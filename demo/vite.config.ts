import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from "vite-plugin-wasm";
export default defineConfig({
  plugins: [
wasm(),
        nodePolyfills({
      exclude: ["fs"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    sveltekit()],
  build: {
    target: "esnext",
    rollupOptions: {
      external: [
        "vite-plugin-node-polyfills/shims/buffer",
        "vite-plugin-node-polyfills/shims/global",
        "vite-plugin-node-polyfills/shims/process",
      ]
    },
  },
});
