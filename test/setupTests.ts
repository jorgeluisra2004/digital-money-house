// Matchers
import "@testing-library/jest-dom";

// 👇 importante: importá los globals de Jest
import { jest, beforeAll, afterAll } from "@jest/globals";

// Polyfills...
import { TextEncoder, TextDecoder } from "util";
if (!(globalThis as any).TextEncoder) (globalThis as any).TextEncoder = TextEncoder as any;
if (!(globalThis as any).TextDecoder) (globalThis as any).TextDecoder = TextDecoder as any;

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require("react");
    return React.createElement("img", { ...props });
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation") as Record<string, any>;
  return {
    __esModule: true,
    ...actual,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    usePathname: jest.fn(() => "/"),
    useSearchParams: jest.fn(() => new URLSearchParams()),
  };
});

// Silenciar warning "not wrapped in act(...)"
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (typeof msg === "string" && /not wrapped in act/i.test(msg)) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
