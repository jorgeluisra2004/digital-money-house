import "@/app/globals.css";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientAuthProvider from "./providers/AuthProvider.client";

export const metadata = {
  title: "Digital Money House",
  description: "Landing page - Digital Money House",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head />
      <body className="flex flex-col min-h-screen">
        <ClientAuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClientAuthProvider>
      </body>
    </html>
  );
}
