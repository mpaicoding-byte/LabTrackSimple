import "@testing-library/jest-dom";
import { vi } from "vitest";

if (!globalThis.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // @ts-expect-error - test shim for recharts
  globalThis.ResizeObserver = ResizeObserver;
}

if (!globalThis.HTMLElement.prototype.scrollIntoView) {
  // @ts-expect-error - test shim
  globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Provide stable dimensions for chart containers in jsdom.
// @ts-expect-error - test shim
globalThis.HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 640,
  height: 320,
  top: 0,
  left: 0,
  right: 640,
  bottom: 320,
  x: 0,
  y: 0,
  toJSON: () => "",
}));
