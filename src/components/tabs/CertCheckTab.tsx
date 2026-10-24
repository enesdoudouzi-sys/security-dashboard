"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// SSL-/TLS-Zertifikat-Check über Certificate Transparency (crt.sh).
// Zeigt das aktuellste Zertifikat einer Domain: Aussteller (CA), Gültigkeit,
// Tage bis Ablauf und abgedeckte Namen. Passiv & öffentlich, kein Key.

type Cert = {
  issuer: string; commonName: string; names: string[];
  notBefore: string; notAfter: string; serial: string;
};

function clean(s: string): string {
  // issuer_name ist ein DN-String wie "C=US, O=Let's Encrypt, CN=R3"
  const m = /O=([^,]+)/.exec(s);
  return (m ? m[1] : s).replace(/"/g, "").trim();
}

function daysUntil(iso: string): number {
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00") + "Z").getTime();
  return Math.round((d - Date.now()) / 86400000);
}

export function CertCheckTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "empty" | "error">("idle");
  const [cert, setCert] = useState<Cert | null>(null);
  const [total, setTotal] = useState(0);
  const [domain, setDomain] = useState("");

  async function run() {
    const d = q.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
    if (!d || !d.includes(".")) { setState("error"); return; }
    setState("loading"); setCert(null); setDomain(d);
    try {
      const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(d)}&output=json`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(String(res.status));
      const arr = (await res.json()) as Array<Record<string, unknown>>;
      if (!arr.length) { setState("empty"); return; }
      setTotal(arr.length);
      // aktuellstes Zertifikat = höchstes not_after
      const latest = arr.reduce((a, b) => (String(a.not_after) > String(b.not_after) ? a : b));
      const names = String(latest.name_value || "").split("\n").map((s) => s.trim()).filter(Boolean);
      setCert({
        issuer: clean(String(latest.issuer_name || "")),
        commonName: String(latest.common_name || names[0] || d),
        names: [...new Set(names)],
        notBefore: String(latest.not_before || "").slice(0, 10),
        notAfter: String(latest.not_after || "").slice(0, 10),
        serial: String(latest.serial_number || ""),
      });
      setState("ok");
    } catch { setState("error"); }
  }

  const left = cert ? daysUntil(cert.notAfter) : 0;
  const status = left < 0 ? { t: "ABGELAUFEN", c: "#f87171" } : left < 14 ? { t: "LÄUFT BALD AB", c: "#fb923c" } : left < 30 ? { t: "BALD ERNEUERN", c: "#fbbf24" } : { t: "GÜLTIG", c: "#00ffa3" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">SSL-/Zertifikat-Check</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Gib eine Domain ein → du siehst ihr aktuelles TLS-Zertifikat: <b>Aussteller</b>, <b>Gültigkeit</b>,
          <b> wann es abläuft</b> und welche Namen es abdeckt. Quelle: Certificate Transparency (crt.sh).
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Warum Zertifikate prüfen?">
        Ein abgelaufenes oder falsches TLS-Zertifikat bedeutet: Browser warnen, Kunden springen ab, und im schlimmsten
        Fall ist die Verbindung angreifbar. Als Security-/IT-Person überwachst du <b>Ablaufdaten</b> (rechtzeitig erneuern!)
        und prüfst, ob der <b>richtige Aussteller</b> (CA) das Zertifikat ausgestellt hat.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="z. B. github.com"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
          style={{ background: "#07010f", border: "1px solid rgba(0,240,255,0.25)", color: "#e2e8f0", caretColor: "#00f0ff" }} />
        <button onClick={run} disabled={!q.trim() || state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40"
          style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
          {state === "loading" ? "Prüfe…" : "Prüfen"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["github.com", "google.com", "example.com"].map((ex) => (
          <button key={ex} onClick={() => setQ(ex)}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer font-mono"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.2)", color: "#7df9ff" }}>{ex}</button>
        ))}
      </div>

      {state === "empty" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fcd34d" }}>
          Für <b className="font-mono">{domain}</b> wurden keine Zertifikate in den öffentlichen Logs gefunden.
        </div>
      )}
      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]" style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Abfrage war nicht möglich. Bitte prüfe die Domain und versuche es erneut (crt.sh limitiert manchmal).
        </div>
      )}

      {state === "ok" && cert && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
               style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: `1px solid ${status.c}55` }}>
            <div>
              <div className="text-[12px] uppercase tracking-wider" style={{ color: "#64748b" }}>Status</div>
              <div className="text-2xl font-bold" style={{ color: status.c }}>{status.t}</div>
              <div className="text-[13px] font-mono mt-0.5" style={{ color: "#94a3b8" }}>{cert.commonName}</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{ color: status.c }}>{left < 0 ? 0 : left}</div>
              <div className="text-[12px]" style={{ color: "#64748b" }}>Tage {left < 0 ? "überfällig" : "gültig"}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Aussteller (CA)", value: cert.issuer || "—" },
              { label: "Seriennummer", value: cert.serial ? cert.serial.slice(0, 20) + "…" : "—" },
              { label: "Gültig ab", value: cert.notBefore || "—" },
              { label: "Gültig bis", value: cert.notAfter || "—" },
            ].map((r) => (
              <div key={r.label} className="rounded-xl p-3.5" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.15)" }}>
                <div className="text-[12px] uppercase tracking-wider" style={{ color: "#64748b" }}>{r.label}</div>
                <div className="text-[14px] mt-0.5 break-all font-mono" style={{ color: "#e2e8f0" }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.15)" }}>
            <div className="text-[12px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>
              Abgedeckte Namen ({cert.names.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cert.names.slice(0, 30).map((n) => (
                <span key={n} className="text-[12px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(0,240,255,0.08)", color: "#7df9ff" }}>{n}</span>
              ))}
            </div>
          </div>

          <p className="text-[11px]" style={{ color: "#475569" }}>
            Insgesamt <b style={{ color: "#94a3b8" }}>{total}</b> Zertifikate in den CT-Logs für diese Domain · Quelle: crt.sh
          </p>
        </div>
      )}
    </div>
  );
}
