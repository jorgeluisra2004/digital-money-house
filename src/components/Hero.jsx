"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Hero() {
  const supabase = getSupabaseClient();
  const [data, setData] = useState(null);

  const defaults = useMemo(
    () => ({
      title: "De ahora en\nadelante, hacés\nmás con tu dinero",
      subtitle: "Tu nueva billetera virtual",
      bg: "/landing-bg.webp",
      card1_title: "Transferí dinero",
      card1_body:
        "Desde Digital Money House vas a poder transferir dinero a otras cuentas, así como también recibir transferencias y nuclear tu capital en nuestra billetera virtual",
      card2_title: "Pago de servicios",
      card2_body:
        "Pagá mensualmente los servicios en 3 simples clicks. Fácil, rápido y conveniente. Olvidate de las facturas en papel",
    }),
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: row, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("slug", "home")
        .maybeSingle();

      if (error) {
        if (alive) setData(defaults);
        return;
      }

      let bg = row?.bg_url || null;
      if (!bg && row?.bg_path) {
        const { data: pub } = supabase.storage
          .from("landing")
          .getPublicUrl(row.bg_path);
        bg = pub?.publicUrl || null;
      }

      if (alive)
        setData({
          title: row?.title || defaults.title,
          subtitle: row?.subtitle || defaults.subtitle,
          bg: bg || defaults.bg,
          card1_title: row?.card1_title || defaults.card1_title,
          card1_body: row?.card1_body || defaults.card1_body,
          card2_title: row?.card2_title || defaults.card2_title,
          card2_body: row?.card2_body || defaults.card2_body,
        });
    })();
    return () => {
      alive = false;
    };
  }, [supabase, defaults]);

  const lime = "var(--dmh-lime)";
  const bg = data?.bg || defaults.bg;
  const titleLines = (data?.title || defaults.title)
    .replace(/\\n/g, "\n")
    .split("\n");
  const subParts = (data?.subtitle || defaults.subtitle).split(
    /(billetera virtual)/i
  );

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{
        // ⚠️ usar HEIGHT (no minHeight) para que el hero llegue justo hasta el footer
        height: "calc(100dvh - var(--header-h, 64px) - var(--footer-h, 48px))",
        ["--header-h"]: "64px",
        ["--footer-h"]: "48px",
        ["--franja-h"]: "136px",
        ["--cards-gap"]: "16px", // separación de las cards al footer
      }}
    >
      {/* Fondo + overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.65) 100%)",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Texto superior alineado con navbar */}
        <div className="pt-8 md:pt-12 pl-3 pr-4 md:pl-4 md:pr-6 lg:pl-10 lg:pr-10 max-w-[820px]">
          <h1 className="text-white font-semibold leading-tight text-[34px] md:text-5xl lg:text-6xl">
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && (
                  <br className="hidden md:block" />
                )}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-2xl font-semibold" style={{ color: lime }}>
            {subParts.map((p, i) =>
              /billetera virtual/i.test(p) ? (
                <span key={i} className="font-extrabold">
                  {p}
                </span>
              ) : (
                <span key={i}>{p}</span>
              )
            )}
          </p>
        </div>

        {/* Banda y cards pegadas al footer */}
        <div className="relative mt-auto h-0">
          {/* Banda lima tocando el borde inferior del hero */}
          <div
            aria-hidden
            className="absolute left-0 right-0 rounded-t-[22px]"
            style={{
              height: "var(--franja-h)",
              bottom: 0,
              background: lime,
              boxShadow: "0 -8px 40px rgba(0,0,0,.25)",
              zIndex: 5,
            }}
          />

          {/* Cards: ancladas al borde inferior del HERO */}
          <div
            className="absolute left-0 right-0 z-20"
            style={{ bottom: "var(--cards-gap)" }}
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-20 flex flex-col md:flex-row gap-6 items-stretch">
              <article
                className="bg-white rounded-[28px] p-7 md:w-1/2"
                style={{ boxShadow: "0 16px 32px rgba(0,0,0,.25)" }}
              >
                <h2 className="text-3xl font-extrabold text-[#111]">
                  {data?.card1_title || defaults.card1_title}
                </h2>
                <div
                  className="mt-3 mb-5 h-[3px] rounded-sm"
                  style={{ background: lime }}
                />
                <p className="text-gray-700 leading-relaxed">
                  {data?.card1_body || defaults.card1_body}
                </p>
              </article>
              <article
                className="bg-white rounded-[28px] p-7 md:w-1/2"
                style={{ boxShadow: "0 16px 32px rgba(0,0,0,.25)" }}
              >
                <h2 className="text-3xl font-extrabold text-[#111]">
                  {data?.card2_title || defaults.card2_title}
                </h2>
                <div
                  className="mt-3 mb-5 h-[3px] rounded-sm"
                  style={{ background: lime }}
                />
                <p className="text-gray-700 leading-relaxed">
                  {data?.card2_body || defaults.card2_body}
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
