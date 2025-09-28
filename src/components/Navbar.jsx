"use client";

export default function Header() {
  return (
    <header className="w-full bg-[#222] flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-4">
        {/* Si no tienes logo, reemplaza por /public/logo.svg */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-8 rounded-sm flex items-center justify-center" style={{ background: "linear-gradient(90deg,#bff21a,#d4ff2b)" }}>
            <span className="font-bold text-black text-lg tracking-tight" style={{ letterSpacing: "-1px" }}>DMH</span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <a
          href="/login"
          className="px-4 py-2 rounded-md border-2"
          style={{
            borderColor: "var(--dmh-lime)",
            color: "var(--dmh-lime)",
            transition: "all .15s"
          }}
        >
          Ingresar
        </a>
        <a
          href="/register"
          className="px-4 py-2 rounded-md font-semibold"
          style={{
            backgroundColor: "var(--dmh-lime)",
            color: "#000",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
          }}
        >
          Crear cuenta
        </a>
      </div>
    </header>
  );
}
