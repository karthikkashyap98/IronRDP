//! PDU processing for RDP session replay.
//!
//! Provides a simplified processing pipeline for replay

use std::sync::Arc;

use ironrdp_core::{WriteBuf, decode};
use ironrdp_graphics::pointer::DecodedPointer;
use ironrdp_pdu::Action;
use ironrdp_pdu::input::fast_path::{FastPathInput, FastPathInputEvent};
use ironrdp_pdu::mcs::McsMessage;
use ironrdp_pdu::rdp::capability_sets::CapabilitySet;
use ironrdp_pdu::rdp::headers::{ShareControlHeader, ShareControlPdu};
use ironrdp_pdu::x224::X224;
use ironrdp_session::image::DecodedImage;

use crate::buffer::PduSource;
use ironrdp_session::fast_path;
pub use ironrdp_session::fast_path::UpdateKind;

/// Current pointer state for UI synchronization after seeking
/// TODO: Could be exposed by DecodedImage
#[derive(Debug, Clone)]
pub enum PointerState {
    /// Custom pointer bitmap
    Bitmap(Arc<DecodedPointer>),
    /// Use system default pointer
    Default,
    /// Pointer is hidden
    Hidden,
}

#[derive(Debug)]
pub enum ProcessError {
    /// PDU parsing/decoding failed
    Decode(String),
    /// Graphics operation failed
    Graphics(String),
    IncompletePdu,
}

impl core::fmt::Display for ProcessError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            ProcessError::Decode(msg) => write!(f, "decode error: {msg}"),
            ProcessError::Graphics(msg) => write!(f, "graphics error: {msg}"),
            ProcessError::IncompletePdu => write!(f, "incomplete PDU"),
        }
    }
}

impl core::error::Error for ProcessError {}

/// Outcome of processing a single PDU
#[derive(Debug)]
pub enum ProcessResult {
    /// FastPath result (graphics, pointers) - delegates to upstream type
    FastPath(UpdateKind),

    /// Pointer position from client input recording
    ClientPointerPosition { x: u16, y: u16 },

    /// Desktop resolution changed - caller should resize framebuffer
    ResolutionChanged { width: u16, height: u16 },

    /// Session deactivated - expect reactivation with new resolution
    SessionDeactivated,

    /// Session ended
    SessionEnded,
}

/// Stateful processor for replay PDU handling
pub struct ReplayProcessor {
    /// FastPath processor for graphics/pointer handling
    fast_path_processor: fast_path::Processor,

    /// When false, suppresses visual results (GraphicsUpdate, Pointer*) during seeking.
    /// Session state results (ResolutionChanged, SessionDeactivated, SessionEnded) are always emitted.
    update_canvas: bool,

    /// Current pointer state, tracked for post-seek UI synchronization
    current_pointer: PointerState,
}

impl ReplayProcessor {
    pub fn new() -> Self {
        let fast_path_processor = fast_path::ProcessorBuilder {
            io_channel_id: 1003,
            user_channel_id: 1007,
            share_id: 0x0001_0000, // TODO: Figure impact of this
            enable_server_pointer: true,
            pointer_software_rendering: false,
            bulk_decompressor: None,
        }
        .build();

        Self {
            fast_path_processor,
            update_canvas: true,
            current_pointer: PointerState::Default,
        }
    }

    /// Set whether to emit visual results (GraphicsUpdate, Pointer*).
    /// Set to `false` during seeking to suppress canvas updates.
    pub fn set_update_canvas(&mut self, update: bool) {
        self.update_canvas = update;
    }

    /// Returns whether visual results are being emitted.
    pub fn update_canvas(&self) -> bool {
        self.update_canvas
    }

    /// Returns the current pointer state for UI synchronization after seeking.
    pub fn current_pointer_state(&self) -> &PointerState {
        &self.current_pointer
    }

    /// Dispatch a raw PDU to the appropriate processing function.
    ///
    /// Uses `source` from the recording to route between client/server FastPath and X224.
    /// Malformed PDUs are silently skipped (empty result).
    pub fn process_pdu(
        &mut self,
        image: &mut DecodedImage,
        source: PduSource,
        pdu: &[u8],
    ) -> Result<Vec<ProcessResult>, ProcessError> {
        let action = match ironrdp_pdu::find_size(pdu) {
            Ok(Some(info)) => info.action,
            _ => return Ok(vec![]), // skip malformed PDUs
        };

        match (action, source) {
            (Action::FastPath, PduSource::Server) => self.process_server_pdu(image, pdu),
            (Action::FastPath, PduSource::Client) => self.process_client_pdu(pdu),
            (Action::X224, _) => self.process_x224(pdu),
        }
    }

    /// Process a server PDU (graphics, pointers)
    pub fn process_server_pdu(
        &mut self,
        image: &mut DecodedImage,
        pdu: &[u8],
    ) -> Result<Vec<ProcessResult>, ProcessError> {
        let mut response_buffer = WriteBuf::new();
        let updates = self
            .fast_path_processor
            .process(image, pdu, &mut response_buffer)
            .map_err(|e| ProcessError::Decode(format!("{e}")))?;

        let mut results = Vec::new();
        for update in updates {
            // Track pointer state changes (always, even during seeking)
            match &update {
                UpdateKind::PointerBitmap(pointer) => {
                    self.current_pointer = PointerState::Bitmap(Arc::clone(pointer));
                }
                UpdateKind::PointerDefault => {
                    self.current_pointer = PointerState::Default;
                }
                UpdateKind::PointerHidden => {
                    self.current_pointer = PointerState::Hidden;
                }
                _ => {}
            }

            // Filter visual results based on update_canvas
            let is_visual = matches!(
                update,
                UpdateKind::Region(_)
                    | UpdateKind::PointerBitmap(_)
                    | UpdateKind::PointerPosition { .. }
                    | UpdateKind::PointerHidden
                    | UpdateKind::PointerDefault
            );

            if !is_visual || self.update_canvas {
                results.push(ProcessResult::FastPath(update));
            }
        }

        Ok(results)
    }

    /// Process a client PDU (mouse/keyboard input)
    pub fn process_client_pdu(&self, pdu: &[u8]) -> Result<Vec<ProcessResult>, ProcessError> {
        // Early return - skip decode when results will be suppressed
        if !self.update_canvas {
            return Ok(Vec::new());
        }

        let input = decode::<FastPathInput>(pdu).map_err(|e| ProcessError::Decode(format!("{e}")))?;

        let mut results = Vec::new();
        for event in input.input_events() {
            match event {
                FastPathInputEvent::MouseEvent(mouse) => {
                    results.push(ProcessResult::ClientPointerPosition {
                        x: mouse.x_position,
                        y: mouse.y_position,
                    });
                }
                FastPathInputEvent::MouseEventEx(mouse) => {
                    results.push(ProcessResult::ClientPointerPosition {
                        x: mouse.x_position,
                        y: mouse.y_position,
                    });
                }
                _ => {} // Keyboard events ignored for replay
            }
        }

        Ok(results)
    }

    /// Process an X224 PDU (session control, resolution changes)
    pub fn process_x224(&self, pdu: &[u8]) -> Result<Vec<ProcessResult>, ProcessError> {
        let x224 = decode::<X224<McsMessage<'_>>>(pdu).map_err(|e| ProcessError::Decode(format!("{e}")))?;

        match x224.0 {
            McsMessage::SendDataIndication(sdi) => {
                if let Ok(header) = decode::<ShareControlHeader>(&sdi.user_data) {
                    return process_share_control(&header.share_control_pdu);
                }
                Ok(vec![])
            }
            McsMessage::DisconnectProviderUltimatum(_) => Ok(vec![ProcessResult::SessionEnded]),
            _ => Ok(vec![]),
        }
    }
}

/// Process ShareControlPdu for resolution changes
fn process_share_control(pdu: &ShareControlPdu) -> Result<Vec<ProcessResult>, ProcessError> {
    match pdu {
        ShareControlPdu::ServerDemandActive(sda) => {
            if let Some((width, height)) = sda.pdu.capability_sets.iter().find_map(|c| match c {
                CapabilitySet::Bitmap(b) => Some((b.desktop_width, b.desktop_height)),
                _ => None,
            }) {
                // Always emit ResolutionChanged (even during seeking)
                Ok(vec![ProcessResult::ResolutionChanged { width, height }])
            } else {
                Ok(vec![])
            }
        }
        ShareControlPdu::ServerDeactivateAll(_) => Ok(vec![ProcessResult::SessionDeactivated]),
        _ => Ok(vec![]),
    }
}

impl Default for ReplayProcessor {
    fn default() -> Self {
        Self::new()
    }
}
