import "@/app/globals.css";

export const metadata = {
  title: "Digital Money House",
  description: "Landing page - Digital Money House"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
