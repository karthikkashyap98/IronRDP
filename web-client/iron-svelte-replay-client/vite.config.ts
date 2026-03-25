import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

const wasmPlugin = (wasm as unknown as () => Plugin);
const topLevelAwaitPlugin = (topLevelAwait as unknown as () => Plugin);

export default defineConfig({
	plugins: [sveltekit(), wasmPlugin(), topLevelAwaitPlugin()],
	server: {
		fs: {
			strict: false,
		},
	},
});
