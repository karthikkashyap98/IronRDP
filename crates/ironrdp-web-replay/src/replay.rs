use wasm_bindgen::prelude::*;
use web_sys::HtmlCanvasElement;

use crate::buffer::PduBuffer;

#[wasm_bindgen]
pub struct Replay {
    pdu_buffer: PduBuffer,
    current_time_ms: f64,
    canvas: HtmlCanvasElement,
}

#[wasm_bindgen]
impl Replay {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement, pdu_buffer: PduBuffer) -> Self {
        Self {
            pdu_buffer,
            current_time_ms: 0.0,
            canvas,
        }
    }

    #[wasm_bindgen(js_name = renderTill)]
    pub fn render_till(&mut self, target_ms: f64) {
        // TODO: implement PDU processing loop
        // - Pop PDUs with timestamp <= target_ms
        // - Decode and apply to framebuffer
        // - Render framebuffer to canvas
        self.current_time_ms = target_ms;
    }

    #[wasm_bindgen(js_name = durationMs)]
    pub fn duration_ms(&self) -> f64 {
        self.pdu_buffer.peek_last_timestamp()
    }

    #[wasm_bindgen(js_name = currentTimeMs)]
    pub fn current_time_ms(&self) -> f64 {
        self.current_time_ms
    }

    pub fn reset(&mut self) {
        self.current_time_ms = 0.0;
        // TODO: reset framebuffer state
        // Note: PDUs are consumed during playback, so full reset
        // would require reloading or keeping a copy
    }
}
