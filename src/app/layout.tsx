import "@/app/globals.css";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

export const metadata = {
  title: "Digital Money House",
  description: "Landing page - Digital Money House",
};

const ClientAuthProvider = dynamic(
  () => import("./providers/AuthProvider.client"),
  { ssr: false }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
