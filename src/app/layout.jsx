import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Shell from "./shell"; // <- wrapper que decide si muestra H/F

export const metadata = {
  title: "Digital Money House",
  description: "Billetera virtual",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Contenedor base: flex para que el footer se pegue abajo cuando exista */}
      <body className="min-h-screen flex flex-col bg-[#111] overflow-x-hidden">
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
