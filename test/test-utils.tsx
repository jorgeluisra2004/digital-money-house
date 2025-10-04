import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";

type Props = { children: React.ReactNode };

// Si más adelante quieres envolver con providers (Theme/Auth/QueryClient), hazlo aquí.
const AllProviders = ({ children }: Props) => {
  return <>{children}</>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

// Re-exporta todo de RTL y expone nuestro render
export * from "@testing-library/react";
export { customRender as render };
