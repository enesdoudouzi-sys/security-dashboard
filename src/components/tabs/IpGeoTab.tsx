"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// IP-Geolocation: zeigt live, wo eine IP/Domain steht (Land, Stadt, Provider, ASN).
// Quelle: ipwho.is (kostenlos, CORS, kein Schlüssel). Passiv & öffentlich.

type Geo = {
  ip: string; type: string; country: string; flag: string; region: string; city: string;
  lat: number; lon: number; tz: string; asn: string; org: string; isp: string;
};

function parse(j: Record<string, unknown>): Geo {
  const conn = (j.connection as Record<string, unknown>) || {};
  const flagObj = (j.flag as Record<string, unknown>) || {};
  return {
    ip: String(j.ip || ""),
    type: String(j.type || ""),
    country: String(j.country || "—"),
    flag: String(flagObj.emoji || ""),
    region: String(j.region || ""),
    city: String(j.city || ""),
    lat: Number(j.latitude ?? 0),
    lon: Number(j.longitude ?? 0),
    tz: String((j.timezone as Record<string, unknown>)?.id || ""),
    asn: String(conn.asn ? `AS${conn.asn}` : ""),
    org: String(conn.org || ""),
    isp: String(conn.isp || ""),
  };
}

export function IpGeoTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [geo, setGeo] = useState<Geo | null>(null);

  async function run(target?: string) {
    const t = (target ?? q).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setState("loading"); setGeo(null);
    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(t)}`, { signal: AbortSignal.timeout(10000) });
      const j = await res.json();
      if (j.success === false) throw new Error(String(j.message || "nicht gefunden"));
      setGeo(parse(j));
      setState("ok");
    } catch { setState("error"); }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">IP-Geolocation · Standort</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Gib eine IP oder Domain ein → du siehst live, <b>wo</b> der Server steht: Land, Stadt, Provider (ISP) und
          Netzbetreiber (ASN). Leer lassen & „Meine IP" → dein eigener Standort.
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Wozu Geolocation im Security-Job?">
        Bei einem Angriff willst du wissen: <b>Woher kommt die IP?</b> Welches Land, welcher Provider, welches Netz (ASN)?
        Das hilft beim Einordnen von Logs, beim Blockieren ganzer Netzbereiche und beim Erkennen verdächtiger Herkünfte.
        Hinweis: Geo-IP ist ein <b>Anhaltspunkt</b>, kein Beweis — VPN/Proxy verschleiern den echten Standort.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="z. B. 8.8.8.8  oder  github.com"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
          style={{ background: "#07010f", border: "1px solid rgba(0,240,255,0.25)", color: "#e2e8f0", caretColor: "#00f0ff" }} />
        <button onClick={() => run()} disabled={state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40"
          style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
          {state === "loading" ? "Suche…" : "Orten"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={() => { setQ(""); run(""); }}
          className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer"
          style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff" }}>📍 Meine IP</button>
        {["8.8.8.8", "1.1.1.1", "github.com"].map((ex) => (
          <button key={ex} onClick={() => { setQ(ex); run(ex); }}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer font-mono"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.2)", color: "#7df9ff" }}>{ex}</button>
        ))}
      </div>

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]" style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Standort konnte nicht ermittelt werden. Bitte prüfe die Eingabe (gültige IP oder Domain) und versuche es erneut.
        </div>
      )}

      {state === "ok" && geo && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl p-5 flex items-center gap-4"
               style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: "1px solid rgba(0,240,255,0.25)" }}>
            <span className="text-5xl flex-shrink-0">{geo.flag || "🌐"}</span>
            <div className="min-w-0">
              <div className="text-xl font-bold" style={{ color: "#e2e8f0" }}>{[geo.city, geo.region, geo.country].filter(Boolean).join(", ")}</div>
              <div className="text-[14px] font-mono" style={{ color: "#00f0ff" }}>{geo.ip} {geo.type && <span style={{ color: "#64748b" }}>· {geo.type}</span>}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Provider (ISP)", value: geo.isp || geo.org || "—" },
              { label: "Netzbetreiber (ASN)", value: [geo.asn, geo.org].filter(Boolean).join(" · ") || "—" },
              { label: "Koordinaten", value: geo.lat || geo.lon ? `${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` : "—" },
              { label: "Zeitzone", value: geo.tz || "—" },
            ].map((r) => (
              <div key={r.label} className="rounded-xl p-3.5" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.15)" }}>
                <div className="text-[12px] uppercase tracking-wider" style={{ color: "#64748b" }}>{r.label}</div>
                <div className="text-[14px] mt-0.5 break-all" style={{ color: "#e2e8f0" }}>{r.value}</div>
              </div>
            ))}
          </div>

          {(geo.lat || geo.lon) && (
            <a href={`https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=10/${geo.lat}/${geo.lon}`}
               target="_blank" rel="noreferrer"
               className="inline-block text-[13px]" style={{ color: "#7df9ff" }}>↗ auf OpenStreetMap ansehen</a>
          )}

          <p className="text-[11px]" style={{ color: "#475569" }}>
            Quelle: ipwho.is (öffentlich). Standort ist ungefähr (Stadt-/Provider-Ebene), bei VPN/Proxy abweichend.
          </p>
        </div>
      )}
    </div>
  );
}
