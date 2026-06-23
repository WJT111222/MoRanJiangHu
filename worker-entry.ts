// Wrapper entry point for wrangler deployment.
// Re-exports the Pages Functions default fetch handler AND the OnlineSessionsDO
// Durable Object class so that wrangler can bind the DO in wrangler.jsonc.
//
// Written to .tmp-worker-build/worker-entry.js by build-worker.mjs after the
// pages build completes. wrangler.jsonc is updated to use this as `main`.

// @ts-ignore – .tmp-worker-build/index.js is generated at build time
export { default } from './.tmp-worker-build/index.js';
export { OnlineSessionsDO } from './functions/api/admin/OnlineSessionsDO';
