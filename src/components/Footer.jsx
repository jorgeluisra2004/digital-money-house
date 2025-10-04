"use client";

export default function Footer() {
  const year = new Date().getFullYear();
  const lime = "var(--dmh-lime)";

  return (
    // h-12 => 48px. Si querés otro alto, cambiá y actualizá --footer-h en Hero.
    <footer
      className="mt-auto relative z-50 h-12 bg-[#2f2f34]"
      role="contentinfo"
    >
      <div className="h-full w-full">
        <div className="h-full max-w-6xl mx-auto px-4 md:px-6 flex items-center">
          <p className="text-xs" style={{ color: lime }}>
            © {year} Digital Money House
          </p>
        </div>
      </div>
    </footer>
  );
}
