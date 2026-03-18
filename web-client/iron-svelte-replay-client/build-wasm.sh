#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRATE_DIR="$SCRIPT_DIR/../../crates/ironrdp-web-replay"
PKG_DIR="$CRATE_DIR/pkg"
STATIC_WASM_DIR="$SCRIPT_DIR/static/wasm"

echo "Building ironrdp-web-replay WASM package..."
cd "$CRATE_DIR"
wasm-pack build --target web

echo "Copying to static/wasm..."
rm -rf "$STATIC_WASM_DIR"
mkdir -p "$STATIC_WASM_DIR"
cp "$PKG_DIR"/* "$STATIC_WASM_DIR/"

echo "Done! WASM files are in $STATIC_WASM_DIR"
