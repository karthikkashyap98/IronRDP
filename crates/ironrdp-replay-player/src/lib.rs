#![allow(clippy::new_without_default)] // Default trait can't be used by wasm consumer anyway.

mod error;
mod reader;

use ironrdp_core::{decode, WriteBuf};
use ironrdp_graphics::image_processing::PixelFormat;
use ironrdp_graphics::pointer::DecodedPointer;
use ironrdp_pdu::input::fast_path::{FastPathInput, FastPathInputEvent};
use ironrdp_pdu::mcs::McsMessage;
use ironrdp_pdu::rdp::capability_sets::CapabilitySet;
use ironrdp_pdu::rdp::headers::{ShareControlHeader, ShareControlPdu};
use ironrdp_pdu::x224::X224;
use ironrdp_pdu::Action;
use ironrdp_session::fast_path::{self, UpdateKind};
use ironrdp_session::image::DecodedImage;
use std::sync::Arc;
use wasm_bindgen::prelude::*;

use crate::reader::ReplayReader;

/// A replay session for playing back recorded RDP sessions.
#[wasm_bindgen]
pub struct Replay {
    reader: ReplayReader,
    image: DecodedImage,
    fast_path_processor: fast_path::Processor,
    pointer_bitmap: Option<Arc<DecodedPointer>>,
    mouse_x: u16,
    mouse_y: u16,

    // Resolution tracking
    desktop_width: u16,
    desktop_height: u16,

    // Pointer and Bitmap changes
    resolution_changed: bool,
    pointer_bitmap_changed: bool,
}

#[wasm_bindgen]
impl Replay {
    /* TODO: Refactor this to do more of the heavy lifting
     *  1. Callback map  - Accept a callback map from JS to react to frame events
     *  2. Add Options   - Wider configuration control - cursor, default res, mouse ptr, etc.,
     *  3. Handle Timing - JS handles timing now, keep the client lean and move all timing related logic to be callback based
     */
    #[wasm_bindgen]
    pub async fn create(db_name: &str, width: u16, height: u16) -> Result<Replay, JsValue> {
        let reader = ReplayReader::open(db_name).await.map_err(JsValue::from)?;

        let image = DecodedImage::new(PixelFormat::RgbA32, width, height);

        // TODO: Dynamically set Channel IDs
        let fast_path_processor = fast_path::ProcessorBuilder {
            io_channel_id: 1003,
            user_channel_id: 1007,
            enable_server_pointer: true,
            pointer_software_rendering: false,
        }
        .build();

        Ok(Self {
            reader,
            image,
            fast_path_processor,
            pointer_bitmap: None,
            mouse_x: 0,
            mouse_y: 0,
            desktop_width: width,
            desktop_height: height,
            resolution_changed: false,
            pointer_bitmap_changed: false,
        })
    }

    /// Process the next frame.
    ///
    /// Returns `true` if there are more frames, `false` if replay is complete.
    pub async fn step(&mut self) -> Result<bool, JsValue> {
        // Get next frame from IndexedDB
        let bytes = match self.reader.next().await {
            Some(Ok(bytes)) => bytes,
            Some(Err(e)) => return Err(JsValue::from(e)),
            None => return Ok(false), // No more frames
        };

        // Parse the PDU to get the Action type
        let pdu_info = ironrdp_pdu::find_size(&bytes)
            .map_err(|e| JsValue::from_str(&format!("PDU parse error: {e:?}")))?
            .ok_or_else(|| JsValue::from_str("Incomplete PDU"))?;

        let frame_index = self.reader.current_index() - 1; // Already incremented

        match pdu_info.action {
            Action::FastPath => {
                if Self::is_client_fastpath(&bytes) {
                    // Process client input PDU (mouse, keyboard)
                    self.process_client_fastpath(frame_index, &bytes);
                } else {
                    // Process server FastPath output (graphics, pointers)
                    web_sys::console::log_1(
                        &format!(
                            "Frame {frame_index}: FastPath PDU - stored_bytes={}, pdu_header_length={}",
                            bytes.len(),
                            pdu_info.length
                        )
                        .into(),
                    );

                    // Process FastPath frame - decodes graphics into self.image
                    let mut response_buffer = WriteBuf::new();
                    let updates = self
                        .fast_path_processor
                        .process(&mut self.image, &bytes, &mut response_buffer)
                        .map_err(|e| {
                            JsValue::from_str(&format!(
                                "FastPath error at frame {frame_index} (bytes={}, header_len={}): {e:?}",
                                bytes.len(),
                                pdu_info.length
                            ))
                        })?;

                    // Log what was updated
                    for update in updates {
                        match update {
                            UpdateKind::Region(rect) => {
                                web_sys::console::log_1(
                                    &format!("Frame {frame_index}: Graphics update: {rect:?}").into(),
                                );
                            }
                            UpdateKind::PointerBitmap(pointer) => {
                                web_sys::console::log_1(&format!("Frame {frame_index}: Pointer bitmap").into());
                                self.pointer_bitmap = Some(pointer);
                                self.pointer_bitmap_changed = true;
                            }
                            UpdateKind::PointerDefault => {
                                web_sys::console::log_1(&format!("Frame {frame_index}: Pointer default").into());
                            }
                            UpdateKind::PointerHidden => {
                                web_sys::console::log_1(&format!("Frame {frame_index}: Pointer hidden").into());
                            }
                            UpdateKind::PointerPosition { x, y } => {
                                self.mouse_x = x;
                                self.mouse_y = y;
                                web_sys::console::log_1(
                                    &format!("Frame {frame_index}: Pointer position: ({x}, {y})").into(),
                                );
                            }
                            _ => {}
                        }
                    }
                    // response_buffer ignored - no server to send to
                }
            }
            Action::X224 => {
                self.process_x224_frame(frame_index, &bytes);
            }
        }

        Ok(true)
    }

    /// Reset replay to the beginning
    pub fn reset(&mut self) {
        self.reader.reset();
    }

    /// Get the current frame index
    #[wasm_bindgen(getter, js_name = "currentFrame")]
    pub fn current_frame(&self) -> u32 {
        self.reader.current_index()
    }

    /// Get the raw framebuffer data (RGBA format).
    ///
    /// Returns a copy of the pixel data that can be used with canvas ImageData.
    #[wasm_bindgen(js_name = "getFrameBuffer")]
    pub fn get_frame_buffer(&self) -> Vec<u8> {
        self.image.data().to_vec()
    }

    /// Get the desktop width
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u16 {
        self.image.width()
    }

    /// Get the desktop height
    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u16 {
        self.image.height()
    }

    #[wasm_bindgen(js_name = "getPointerBitmap")]
    pub fn get_pointer_bitmap(&self) -> Option<Vec<u8>> {
        self.pointer_bitmap.as_ref().map(|p| p.bitmap_data.to_vec())
    }

    #[wasm_bindgen(getter, js_name = "pointerWidth")]
    pub fn pointer_width(&self) -> u16 {
        self.pointer_bitmap.as_ref().map(|p| p.width).unwrap_or(0)
    }

    #[wasm_bindgen(getter, js_name = "pointerHeight")]
    pub fn pointer_height(&self) -> u16 {
        self.pointer_bitmap.as_ref().map(|p| p.height).unwrap_or(0)
    }

    #[wasm_bindgen(getter, js_name = "pointerHotspotX")]
    pub fn pointer_hotspot_x(&self) -> u16 {
        self.pointer_bitmap.as_ref().map(|p| p.hotspot_x).unwrap_or(0)
    }

    #[wasm_bindgen(getter, js_name = "pointerHotspotY")]
    pub fn pointer_hotspot_y(&self) -> u16 {
        self.pointer_bitmap.as_ref().map(|p| p.hotspot_y).unwrap_or(0)
    }

    #[wasm_bindgen(getter, js_name = "mouseX")]
    pub fn mouse_x(&self) -> u16 {
        self.mouse_x
    }

    #[wasm_bindgen(getter, js_name = "mouseY")]
    pub fn mouse_y(&self) -> u16 {
        self.mouse_y
    }

    // Resolution tracking

    #[wasm_bindgen(getter, js_name = "desktopWidth")]
    pub fn desktop_width(&self) -> u16 {
        self.desktop_width
    }

    #[wasm_bindgen(getter, js_name = "desktopHeight")]
    pub fn desktop_height(&self) -> u16 {
        self.desktop_height
    }

    #[wasm_bindgen(getter, js_name = "resolutionChanged")]
    pub fn resolution_changed(&self) -> bool {
        self.resolution_changed
    }

    #[wasm_bindgen(js_name = "clearResolutionChanged")]
    pub fn clear_resolution_changed(&mut self) {
        self.resolution_changed = false;
    }

    // Pointer bitmap change tracking

    #[wasm_bindgen(getter, js_name = "pointerBitmapChanged")]
    pub fn pointer_bitmap_changed(&self) -> bool {
        self.pointer_bitmap_changed
    }

    #[wasm_bindgen(js_name = "clearPointerBitmapChanged")]
    pub fn clear_pointer_bitmap_changed(&mut self) {
        self.pointer_bitmap_changed = false;
    }

    /// Detect if a FastPath PDU is from client (input) vs server (output).
    /// Client FastPath input has numEvents in bits 2-5 (non-zero).
    /// Server FastPath output has reserved bits 2-5 (always zero).
    fn is_client_fastpath(bytes: &[u8]) -> bool {
        if bytes.is_empty() {
            return false;
        }
        // Bits 2-5 contain numEvents for client input (1-15)
        // For server output, these bits are reserved (0)
        (bytes[0] & 0x3C) != 0
    }

    /// Process a client FastPath input PDU and extract mouse position.
    fn process_client_fastpath(&mut self, frame_index: u32, bytes: &[u8]) {
        match decode::<FastPathInput>(bytes) {
            Ok(input) => {
                for event in input.input_events() {
                    match event {
                        FastPathInputEvent::MouseEvent(mouse) => {
                            self.mouse_x = mouse.x_position;
                            self.mouse_y = mouse.y_position;
                            web_sys::console::log_1(
                                &format!(
                                    "Frame {frame_index}: Mouse position: ({}, {})",
                                    self.mouse_x, self.mouse_y
                                )
                                .into(),
                            );
                        }
                        FastPathInputEvent::MouseEventEx(mouse) => {
                            self.mouse_x = mouse.x_position;
                            self.mouse_y = mouse.y_position;
                            web_sys::console::log_1(
                                &format!(
                                    "Frame {frame_index}: MouseEx position: ({}, {})",
                                    self.mouse_x, self.mouse_y
                                )
                                .into(),
                            );
                        }
                        _ => {
                            // Ignore keyboard, sync, and other events for now
                        }
                    }
                }
            }
            Err(e) => {
                web_sys::console::log_1(&format!("Frame {frame_index}: Client FastPath decode error: {e:?}").into());
            }
        }
    }

    /// Process an X224 frame and extract resolution from ServerDemandActive.
    fn process_x224_frame(&mut self, frame_index: u32, bytes: &[u8]) {
        let size = bytes.len();

        match decode::<X224<McsMessage<'_>>>(bytes) {
            Ok(X224(mcs_msg)) => {
                match mcs_msg {
                    McsMessage::SendDataIndication(sdi) => {
                        // Note: Not all SendDataIndication PDUs contain ShareControlHeader -
                        // some contain license PDUs, virtual channel data, etc.
                        match decode::<ShareControlHeader>(&sdi.user_data) {
                            Ok(header) => {
                                self.process_share_control_pdu(frame_index, size, &header.share_control_pdu);
                            }
                            Err(_) => {
                                // Not a ShareControlHeader - could be license PDU, virtual channel, etc.
                                // Just log the channel ID for now
                                web_sys::console::log_1(
                                    &format!(
                                        "Frame {frame_index}: X224/SendDataIndication (channel={}, data_len={}, size={size})",
                                        sdi.channel_id,
                                        sdi.user_data.len()
                                    )
                                    .into(),
                                );
                            }
                        }
                    }
                    McsMessage::SendDataRequest(sdr) => {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/SendDataRequest (channel={}, size={size})",
                                sdr.channel_id
                            )
                            .into(),
                        );
                    }
                    McsMessage::DisconnectProviderUltimatum(dpu) => {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/DisconnectProviderUltimatum - reason: {:?} (size={size})",
                                dpu.reason
                            )
                            .into(),
                        );
                    }
                    McsMessage::ErectDomainRequest(_) => {
                        web_sys::console::log_1(
                            &format!("Frame {frame_index}: X224/ErectDomainRequest (size={size})").into(),
                        );
                    }
                    McsMessage::AttachUserRequest(_) => {
                        web_sys::console::log_1(
                            &format!("Frame {frame_index}: X224/AttachUserRequest (size={size})").into(),
                        );
                    }
                    McsMessage::AttachUserConfirm(auc) => {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/AttachUserConfirm - initiator={} (size={size})",
                                auc.initiator_id
                            )
                            .into(),
                        );
                    }
                    McsMessage::ChannelJoinRequest(cjr) => {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/ChannelJoinRequest - channel={} (size={size})",
                                cjr.channel_id
                            )
                            .into(),
                        );
                    }
                    McsMessage::ChannelJoinConfirm(cjc) => {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/ChannelJoinConfirm - channel={} (size={size})",
                                cjc.channel_id
                            )
                            .into(),
                        );
                    }
                }
            }
            Err(e) => {
                web_sys::console::log_1(
                    &format!("Frame {frame_index}: X224 decode failed: {e:?} (size={size})").into(),
                );
            }
        }
    }

    /// Process ShareControlPdu and extract resolution from ServerDemandActive
    fn process_share_control_pdu(&mut self, frame_index: u32, size: usize, pdu: &ShareControlPdu) {
        match pdu {
            ShareControlPdu::ServerDemandActive(sda) => {
                // Extract resolution from Bitmap capability set
                let resolution = sda.pdu.capability_sets.iter().find_map(|c| match c {
                    CapabilitySet::Bitmap(b) => Some((b.desktop_width, b.desktop_height)),
                    _ => None,
                });

                if let Some((width, height)) = resolution {
                    // Check if resolution changed
                    if width != self.desktop_width || height != self.desktop_height {
                        self.desktop_width = width;
                        self.desktop_height = height;
                        self.resolution_changed = true;

                        // Recreate the framebuffer with new dimensions
                        self.image = DecodedImage::new(PixelFormat::RgbA32, width, height);

                        // Clear pointer bitmap since we have a new session/resolution
                        self.pointer_bitmap = None;
                        self.pointer_bitmap_changed = true;

                        web_sys::console::log_1(
                            &format!("Frame {frame_index}: Resolution CHANGED to {width}x{height} (size={size})")
                                .into(),
                        );
                    } else {
                        web_sys::console::log_1(
                            &format!(
                                "Frame {frame_index}: X224/ServerDemandActive - Resolution: {width}x{height} (size={size})"
                            )
                            .into(),
                        );
                    }
                } else {
                    web_sys::console::log_1(
                        &format!(
                            "Frame {frame_index}: X224/ServerDemandActive - No Bitmap capability found (size={size})"
                        )
                        .into(),
                    );
                }

                // Log all capability sets for debugging
                web_sys::console::log_1(
                    &format!(
                        "Frame {frame_index}: ServerDemandActive has {} capability sets",
                        sda.pdu.capability_sets.len()
                    )
                    .into(),
                );
            }
            ShareControlPdu::ClientConfirmActive(_) => {
                web_sys::console::log_1(&format!("Frame {frame_index}: X224/ClientConfirmActive (size={size})").into());
            }
            ShareControlPdu::ServerDeactivateAll(_) => {
                web_sys::console::log_1(
                    &format!("Frame {frame_index}: X224/ServerDeactivateAll - resize may follow (size={size})").into(),
                );
            }
            ShareControlPdu::Data(data_header) => {
                web_sys::console::log_1(
                    &format!(
                        "Frame {frame_index}: X224/ShareDataPdu::{} (size={size})",
                        data_header.share_data_pdu.as_short_name()
                    )
                    .into(),
                );
            }
        }
    }
}
