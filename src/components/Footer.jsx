// /src/components/Footer.jsx
"use client";

export default function Footer() {
  const year = new Date().getFullYear();
  const lime = "var(--dmh-lime)"; // fallback si querés: "#c9ff2a"

  return (
    <footer className="mt-auto" role="contentinfo">
      {/* Cuerpo del footer */}
      <div className="w-full bg-[#2f2f34]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
          <p className="text-xs" style={{ color: lime }}>
            © {year} Digital Money House
          </p>
        </div>
      </div>
    </footer>
  );
}
