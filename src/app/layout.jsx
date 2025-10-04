// app/layout.jsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Shell from "./shell";

export const metadata = {
  title: "Digital Money House",
  description: "Billetera virtual",
};

// 👇 agrega esto
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className="min-h-screen flex flex-col bg-[#111] overflow-x-hidden"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
