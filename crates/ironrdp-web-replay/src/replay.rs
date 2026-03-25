use ironrdp_graphics::image_processing::PixelFormat;
use ironrdp_session::image::DecodedImage;
use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

use crate::buffer::PduBuffer;
use crate::process::{ProcessResult, ReplayProcessor, UpdateKind};

/// Default desktop resolution used until the server sends ResolutionChanged
const DEFAULT_WIDTH: u16 = 1920;
const DEFAULT_HEIGHT: u16 = 1080;

/// Result returned to JS after render_till() completes
#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct RenderResult {
    /// Current playhead position after rendering
    pub current_time_ms: f64,
    /// Number of PDUs processed in this call
    pub pdus_processed: u32,
    /// Whether the desktop resolution changed during this render
    pub resolution_changed: bool,
}

#[wasm_bindgen]
pub struct Replay {
    pdu_buffer: PduBuffer,
    current_time_ms: f64,
    canvas: HtmlCanvasElement,
    ctx: CanvasRenderingContext2d,
    processor: ReplayProcessor,
    image: DecodedImage,
}

#[wasm_bindgen]
impl Replay {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: HtmlCanvasElement) -> Result<Replay, JsValue> {
        let ctx = canvas
            .get_context("2d")?
            .ok_or_else(|| JsValue::from_str("failed to get 2d context"))?
            .dyn_into::<CanvasRenderingContext2d>()?;

        Ok(Self {
            pdu_buffer: PduBuffer::new(),
            current_time_ms: 0.0,
            canvas,
            ctx,
            processor: ReplayProcessor::new(),
            image: DecodedImage::new(PixelFormat::RgbA32, DEFAULT_WIDTH, DEFAULT_HEIGHT),
        })
    }

    /// Process all PDUs up to `target_ms` and blit the resulting framebuffer to canvas.
    #[wasm_bindgen(js_name = renderTill)]
    pub fn render_till(&mut self, target_ms: f64) -> RenderResult {
        let mut pdus_processed: u32 = 0;
        let mut resolution_changed = false;

        while self.pdu_buffer.peek_timestamp() <= target_ms {
            let pdu = match self.pdu_buffer.pop_pdu() {
                Some(p) => p,
                None => break,
            };

            let source = pdu.source();
            let results = match self.processor.process_pdu(&mut self.image, source, pdu.data_ref()) {
                Ok(r) => r,
                Err(e) => {
                    web_sys::console::error_1(&format!("pdu processing error: {e}").into());
                    continue;
                }
            };

            let mut frame_dirty = false;
            for result in results {
                match result {
                    ProcessResult::FastPath(UpdateKind::Region(_)) => {
                        frame_dirty = true;
                    }
                    ProcessResult::ResolutionChanged { width, height } => {
                        self.image = DecodedImage::new(PixelFormat::RgbA32, width, height);
                        self.canvas.set_width(u32::from(width));
                        self.canvas.set_height(u32::from(height));
                        resolution_changed = true;
                        frame_dirty = true;
                    }
                    _ => {}
                }
            }

            if frame_dirty {
                self.draw_to_canvas();
            }

            pdus_processed += 1;
        }

        self.current_time_ms = target_ms;

        RenderResult {
            current_time_ms: self.current_time_ms,
            pdus_processed,
            resolution_changed,
        }
    }

    /// Push a single PDU into the internal buffer.
    /// Called by JS (PduFetcher) to feed PDU data before calling renderTill().
    #[wasm_bindgen(js_name = pushPdu)]
    pub fn push_pdu(&mut self, timestamp_ms: f64, source: crate::buffer::PduSource, data: &[u8]) {
        self.pdu_buffer.push_pdu(timestamp_ms, source, data);
    }

    pub fn reset(&mut self) {
        self.current_time_ms = 0.0;
        self.image = DecodedImage::new(PixelFormat::RgbA32, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        self.processor = ReplayProcessor::new();
    }

    /// Blit framebuffer to canvas using putImageData
    fn draw_to_canvas(&self) {
        let width = u32::from(self.image.width());
        let height = u32::from(self.image.height());
        let clamped = wasm_bindgen::Clamped(self.image.data());

        if let Ok(image_data) = web_sys::ImageData::new_with_u8_clamped_array_and_sh(clamped, width, height) {
            let _ = self.ctx.put_image_data(&image_data, 0.0, 0.0);
        }
    }
}
