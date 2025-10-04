// Matchers de Testing Library (toBeInTheDocument, etc.)
import "@testing-library/jest-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Polyfills suaves que Next/RT dev suelen requerir en JSDOM
// ─────────────────────────────────────────────────────────────────────────────
import { TextEncoder, TextDecoder } from "util";
if (!(global as any).TextEncoder)
  (global as any).TextEncoder = TextEncoder as any;
if (!(global as any).TextDecoder)
  (global as any).TextDecoder = TextDecoder as any;

// Mock de next/image para que se renderice como <img> en tests
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => require("react").createElement("img", { ...props }),
}));

// Mocks básicos del App Router (evitan errores si tus componentes los usan)
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
  };
});

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
