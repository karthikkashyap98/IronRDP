use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

/// Direction/source of a PDU in the recording
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PduSource {
    /// PDU from client (C→S), e.g., mouse/keyboard input
    Client = 0,
    /// PDU from server (S→C), e.g., graphics updates
    Server = 1,
}

#[wasm_bindgen]
pub struct Pdu {
    source: PduSource,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl Pdu {
    #[wasm_bindgen(getter)]
    pub fn source(&self) -> PduSource {
        self.source
    }

    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<u8> {
        self.data.clone()
    }

    /// Internal accessor for Rust callers - avoids clone
    #[expect(dead_code, reason = "will be used in Replay integration")]
    pub(crate) fn data_ref(&self) -> &[u8] {
        &self.data
    }
}

struct PduEntry {
    timestamp_ms: f64,
    source: PduSource,
    data: Vec<u8>,
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

    #[wasm_bindgen]
    pub fn push_pdu(&mut self, timestamp_ms: f64, source: PduSource, data: &[u8]) {
        self.entries.push_back(PduEntry {
            timestamp_ms,
            source,
            data: data.to_vec(),
        });
    }

    pub fn peek_timestamp(&self) -> f64 {
        self.entries.front().map_or(f64::NAN, |e| e.timestamp_ms)
    }

    pub fn peek_last_timestamp(&self) -> f64 {
        self.entries.back().map_or(f64::NAN, |e| e.timestamp_ms)
    }

    pub fn pop_pdu(&mut self) -> Option<Pdu> {
        self.entries.pop_front().map(|e| Pdu {
            source: e.source,
            data: e.data,
        })
    }

    pub fn peek_source(&self) -> Option<PduSource> {
        self.entries.front().map(|e| e.source)
    }

    pub fn count(&self) -> usize {
        self.entries.len()
    }

    pub fn clear(&mut self) {
        self.entries.clear();
    }
}
