use ironrdp_graphics::image_processing::PixelFormat;
use ironrdp_graphics::pointer::DecodedPointer;
use ironrdp_session::image::DecodedImage;
use wasm_bindgen::prelude::*;
use web_sys::{
    CanvasRenderingContext2d, HtmlCanvasElement, ImageData, OffscreenCanvas, OffscreenCanvasRenderingContext2d, console,
};

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
    /// Whether a SessionEnded PDU was encountered — caller should stop the playback loop
    pub session_ended: bool,
}

#[wasm_bindgen]
pub struct Replay {
    pdu_buffer: PduBuffer,
    current_time_ms: f64,
    canvas: HtmlCanvasElement,
    ctx: CanvasRenderingContext2d,
    processor: ReplayProcessor,
    image: DecodedImage,
    // Cursor state
    pointer_hidden: bool,
    pointer_hotspot_x: u16,
    pointer_hotspot_y: u16,
    mouse_x: u16,
    mouse_y: u16,
    cursor_canvas: Option<OffscreenCanvas>,
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
            pointer_hidden: false,
            pointer_hotspot_x: 0,
            pointer_hotspot_y: 0,
            mouse_x: 0,
            mouse_y: 0,
            cursor_canvas: None,
        })
    }

    /// Process all PDUs up to `target_ms` and blit the resulting framebuffer to canvas.
    #[wasm_bindgen(js_name = renderTill)]
    pub fn render_till(&mut self, target_ms: f64) -> RenderResult {
        let mut pdus_processed: u32 = 0;
        let mut resolution_changed = false;
        let mut session_ended = false;

        while self.pdu_buffer.peek_timestamp() <= target_ms {
            let pdu = match self.pdu_buffer.pop_pdu() {
                Some(p) => p,
                None => break,
            };

            let results = match self.processor.process_pdu(&mut self.image, pdu.source, &pdu.data) {
                Ok(r) => r,
                Err(e) => {
                    console::error_1(&format!("pdu processing error: {e}").into());
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
                    ProcessResult::FastPath(UpdateKind::PointerBitmap(pointer)) => {
                        self.pointer_hotspot_x = pointer.hotspot_x;
                        self.pointer_hotspot_y = pointer.hotspot_y;
                        self.cursor_canvas = Self::build_cursor_canvas(&pointer);
                        self.pointer_hidden = false;
                        frame_dirty = true;
                    }
                    ProcessResult::FastPath(UpdateKind::PointerPosition { x, y }) => {
                        self.mouse_x = x;
                        self.mouse_y = y;
                        frame_dirty = true;
                    }
                    ProcessResult::FastPath(UpdateKind::PointerHidden) => {
                        self.pointer_hidden = true;
                        frame_dirty = true;
                    }
                    ProcessResult::FastPath(UpdateKind::PointerDefault) => {
                        self.pointer_hidden = false;
                        self.cursor_canvas = None;
                        frame_dirty = true;
                    }
                    ProcessResult::ClientPointerPosition { x, y } => {
                        self.mouse_x = x;
                        self.mouse_y = y;
                        frame_dirty = true;
                    }
                    ProcessResult::SessionEnded => {
                        session_ended = true;
                    }
                    _ => {}
                }
            }

            if frame_dirty && self.processor.update_canvas() {
                self.draw_to_canvas();
            }

            pdus_processed += 1;
        }

        self.current_time_ms = target_ms;

        RenderResult {
            current_time_ms: self.current_time_ms,
            pdus_processed,
            resolution_changed,
            session_ended,
        }
    }

    /// Push a single PDU into the internal buffer.
    /// Called by JS (PduFetcher) to feed PDU data before calling renderTill().
    #[wasm_bindgen(js_name = pushPdu)]
    pub fn push_pdu(&mut self, timestamp_ms: f64, source: crate::buffer::PduSource, data: &[u8]) {
        self.pdu_buffer.push_pdu(timestamp_ms, source, data);
    }

    /// Reset playback state to the beginning.
    ///
    /// # Caller contract
    /// The canvas is not cleared by this method. The caller is responsible for
    /// not displaying the canvas between reset() and the first render_till() call.
    pub fn reset(&mut self) {
        self.current_time_ms = 0.0;
        self.pdu_buffer.clear();
        self.image = DecodedImage::new(PixelFormat::RgbA32, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        self.processor = ReplayProcessor::new();
        self.pointer_hidden = false;
        self.pointer_hotspot_x = 0;
        self.pointer_hotspot_y = 0;
        self.mouse_x = 0;
        self.mouse_y = 0;
        // Drop the cached OffscreenCanvas to free the JS object reference.
        self.cursor_canvas = None;
    }

    /// Enable or disable canvas updates during rendering.
    /// Set to false during seek fast-forward to suppress intermediate frame blits.
    #[wasm_bindgen(js_name = setUpdateCanvas)]
    pub fn set_update_canvas(&mut self, update: bool) {
        self.processor.set_update_canvas(update);
    }

    /// Unconditionally blit the current in-memory framebuffer to the canvas.
    ///
    /// Call this after a seek's fast-forward loop to display the final frame.
    /// `renderTill` alone is insufficient here because all PDUs up to the seek
    /// target have already been consumed by the chunk loop, so its inner loop
    /// processes zero PDUs and `draw_to_canvas` is never reached.
    #[wasm_bindgen(js_name = forceRedraw)]
    pub fn force_redraw(&self) {
        self.draw_to_canvas();
    }

    /// Blit framebuffer to canvas using putImageData, then composite cursor on top.
    fn draw_to_canvas(&self) {
        let width = u32::from(self.image.width());
        let height = u32::from(self.image.height());
        let clamped = wasm_bindgen::Clamped(self.image.data());

        let Ok(image_data) = ImageData::new_with_u8_clamped_array_and_sh(clamped, width, height) else {
            return;
        };

        // Skip cursor compositing if the frame blit fails — cursor over a blank canvas is misleading.
        if self.ctx.put_image_data(&image_data, 0.0, 0.0).is_ok() {
            self.draw_cursor();
        }
    }

    /// Build a cached OffscreenCanvas from a cursor bitmap.
    /// Called once per PointerBitmap change. Returns None on any failure.
    fn build_cursor_canvas(pointer: &DecodedPointer) -> Option<OffscreenCanvas> {
        if pointer.width == 0 || pointer.height == 0 {
            return None;
        }

        let Ok(offscreen) = OffscreenCanvas::new(u32::from(pointer.width), u32::from(pointer.height)) else {
            console::warn_1(&"Failed to create OffscreenCanvas for cursor".into());
            return None;
        };

        let Ok(Some(obj)) = offscreen.get_context("2d") else {
            console::warn_1(&"Failed to get 2d context from cursor OffscreenCanvas".into());
            return None;
        };

        let Ok(offscreen_ctx) = obj.dyn_into::<OffscreenCanvasRenderingContext2d>() else {
            console::warn_1(&"Failed to cast cursor OffscreenCanvas context".into());
            return None;
        };

        let clamped = wasm_bindgen::Clamped(pointer.bitmap_data.as_slice());
        let Ok(image_data) =
            ImageData::new_with_u8_clamped_array_and_sh(clamped, u32::from(pointer.width), u32::from(pointer.height))
        else {
            console::warn_1(&"Failed to create ImageData for cursor bitmap".into());
            return None;
        };

        let Ok(()) = offscreen_ctx.put_image_data(&image_data, 0.0, 0.0) else {
            console::warn_1(&"Failed to write cursor bitmap to OffscreenCanvas".into());
            return None;
        };

        Some(offscreen)
    }

    /// Composite the cached cursor canvas onto the main canvas at the current mouse position.
    fn draw_cursor(&self) {
        if self.pointer_hidden {
            return;
        }

        let Some(cursor_canvas) = &self.cursor_canvas else {
            return;
        };

        let dest_x = f64::from(self.mouse_x.saturating_sub(self.pointer_hotspot_x));
        let dest_y = f64::from(self.mouse_y.saturating_sub(self.pointer_hotspot_y));

        // Non-fatal if compositing fails; the frame is already drawn correctly.
        let _ = self.ctx.draw_image_with_offscreen_canvas(cursor_canvas, dest_x, dest_y);
    }
}
