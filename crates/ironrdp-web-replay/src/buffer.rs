use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

/// Direction/source of a PDU in the recording.
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PduSource {
    /// PDU from client (C→S)
    Client = 0,
    /// PDU from server (S→C)
    Server = 1,
}

/// A single timestamped PDU stored in [`PduBuffer`].
pub(crate) struct PduEntry {
    pub(crate) timestamp_ms: f64,
    pub(crate) source: PduSource,
    pub(crate) data: Vec<u8>,
}

#[wasm_bindgen]
pub struct PduBuffer {
    entries: VecDeque<PduEntry>,
}

impl Default for PduBuffer {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl PduBuffer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        PduBuffer {
            entries: VecDeque::new(),
        }
    }

    /// Append a PDU to the back of the buffer.
    #[wasm_bindgen]
    pub fn push_pdu(&mut self, timestamp_ms: f64, source: PduSource, data: &[u8]) {
        self.entries.push_back(PduEntry {
            timestamp_ms,
            source,
            data: data.to_vec(),
        });
    }
}

impl PduBuffer {
    /// Returns the timestamp of the next (front) PDU, or `NAN` if empty.
    ///
    /// `NAN` comparisons are always false, so callers using `<= target_ms`
    /// naturally stop when the buffer is empty.
    pub fn peek_timestamp(&self) -> f64 {
        self.entries.front().map_or(f64::NAN, |e| e.timestamp_ms)
    }

    /// Returns the timestamp of the last (back) PDU, or `NAN` if empty.
    pub fn peek_last_timestamp(&self) -> f64 {
        self.entries.back().map_or(f64::NAN, |e| e.timestamp_ms)
    }

    /// Removes and returns the front PDU, or `None` if empty.
    pub(crate) fn pop_pdu(&mut self) -> Option<PduEntry> {
        self.entries.pop_front()
    }

    /// Returns the source direction of the next PDU without consuming it.
    pub fn peek_source(&self) -> Option<PduSource> {
        self.entries.front().map(|e| e.source)
    }

    /// Returns the number of PDUs currently in the buffer.
    pub fn count(&self) -> usize {
        self.entries.len()
    }

    /// Discards all buffered PDUs.
    pub fn clear(&mut self) {
        self.entries.clear();
    }
}
