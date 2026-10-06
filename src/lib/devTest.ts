// Development-only switches for testing waits and failures that the local data never
// produces: set window.__maresTest in the browser console (or from a test runner) while
// running `npm run dev`. Production builds ignore it entirely.
//
//   window.__maresTest = { stockLatency: 800 }               // every new result set waits
//   window.__maresTest = { stockLatency: (c) => c.query ? 900 : 150 }  // out of order
//   window.__maresTest = { stockFail: true }                 // result sets fail
//   window.__maresTest = { requestLatency: 1500, requestFail: true }   // financing request
//   window.__maresTest = { photoLatency: 1200 }              // gallery photos decode late
export type DevTest = {
  stockLatency?: number | ((criteria: { query: string; sort: string }) => number);
  stockFail?: boolean;
  requestLatency?: number;
  requestFail?: boolean;
  photoLatency?: number;
};

export const devTest = (): DevTest =>
  import.meta.env.DEV ? ((window as unknown as { __maresTest?: DevTest }).__maresTest ?? {}) : {};
