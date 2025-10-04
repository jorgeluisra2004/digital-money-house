"use client";

export default function Footer() {
  const year = new Date().getFullYear();
  const lime = "var(--dmh-lime)";

  return (
    <footer
      role="contentinfo"
      className="mt-auto relative z-50"
      style={{ backgroundColor: "#2f2f34" }}
    >
      {/* 👇 sin max-w; siempre alineado a la izquierda con padding mínimo */}
      <div className="w-full pl-3 pr-4 md:pl-4 md:pr-6 py-3 flex items-center justify-start">
        <p className="text-[11px] md:text-xs" style={{ color: lime }}>
          © {year} Digital Money House
        </p>
      </div>
    </footer>
  );
}
