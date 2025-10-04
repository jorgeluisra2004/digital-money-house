// Matchers de Testing Library (toBeInTheDocument, etc.)
import "@testing-library/jest-dom";

// 👇 Importá el valor 'jest' para evitar "Cannot use namespace 'jest' as a value"
import { jest } from "@jest/globals";

// ─────────────────────────────────────────────────────────────────────────────
// Polyfills suaves que Next/RT dev suelen requerir en JSDOM
// ─────────────────────────────────────────────────────────────────────────────
import { TextEncoder, TextDecoder } from "util";
if (!(globalThis as any).TextEncoder)
  (globalThis as any).TextEncoder = TextEncoder as any;
if (!(globalThis as any).TextDecoder)
  (globalThis as any).TextDecoder = TextDecoder as any;

// Mock de next/image para que se renderice como <img> en tests
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    return React.createElement("img", { ...props });
  },
}));

// Mocks básicos del App Router (evitan errores si tus componentes los usan)
jest.mock("next/navigation", () => ({
  __esModule: true,
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
}));

// (Opcional) silenciar warning de React testing "not wrapped in act(...)"
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
