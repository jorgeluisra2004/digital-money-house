"use client";

export default function Footer() {
  const year = new Date().getFullYear();
  const lime = "var(--dmh-lime)";

  return (
    <footer className="mt-auto relative z-50 bg-[#2f2f34]" role="contentinfo">
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center md:justify-start justify-center">
          <p className="text-[11px] md:text-xs" style={{ color: lime }}>
            © {year} Digital Money House
          </p>
        </div>
      </div>
    </footer>
  );
}
