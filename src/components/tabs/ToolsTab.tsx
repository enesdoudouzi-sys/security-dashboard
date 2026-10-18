"use client";
import { useState, useMemo } from "react";
import { CommandRow } from "@/components/ui/CopyBtn";

// ── Passwortstärke (grobe Schätzung der Entropie) ─────────────────
function passwordScore(pw: string) {
  if (!pw) return { bits: 0, label: "–", color: "#475569", pct: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const bits = Math.round(pw.length * Math.log2(pool || 1));
  const label = bits < 40 ? "Schwach" : bits < 60 ? "Okay" : bits < 80 ? "Stark" : "Sehr stark";
  const color = bits < 40 ? "#f87171" : bits < 60 ? "#fbbf24" : bits < 80 ? "#34d399" : "#22d3ee";
  return { bits, label, color, pct: Math.min(100, Math.round((bits / 100) * 100)) };
}

// ── Security-Header bewerten (aus pastebarer curl -I Ausgabe) ──────
const WANTED = [
  { key: "strict-transport-security", name: "HSTS", why: "erzwingt HTTPS" },
  { key: "content-security-policy", name: "Content-Security-Policy", why: "bremst XSS aus" },
  { key: "x-content-type-options", name: "X-Content-Type-Options", why: "kein MIME-Sniffing" },
  { key: "x-frame-options", name: "X-Frame-Options", why: "Schutz vor Clickjacking" },
  { key: "referrer-policy", name: "Referrer-Policy", why: "weniger Datenabfluss" },
  { key: "permissions-policy", name: "Permissions-Policy", why: "schränkt Browser-APIs ein" },
];

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
      <h3 className="text-[14px] font-bold" style={{ color: "#e2e8f0" }}>{title}</h3>
      <p className="text-[12px] mt-1 mb-4" style={{ color: "#64748b" }}>{desc}</p>
      {children}
    </div>
  );
}

export function ToolsTab() {
  const [pw, setPw] = useState("");
  const score = passwordScore(pw);

  const [hashIn, setHashIn] = useState("");
  const [hash, setHash] = useState("");
  async function doHash() {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashIn));
    setHash([...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""));
  }

  const [headerText, setHeaderText] = useState("");
  const headerResult = useMemo(() => {
    const low = headerText.toLowerCase();
    return WANTED.map((w) => ({ ...w, present: low.includes(w.key) }));
  }, [headerText]);
  const headerScore = headerResult.filter((h) => h.present).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gradient-green">DevSecOps-Werkzeuge</h2>
        <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
          Praktische Helfer für sichere Entwicklung. Alles läuft nur in deinem Browser –
          Passwörter und Eingaben verlassen dein Gerät nicht.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Passwortstärke */}
        <Card title="Passwort-Stärke" desc="Schätzt die Stärke anhand von Länge und Zeichenvielfalt.">
          <input type="text" value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="Passwort eingeben (wird nicht gesendet)"
            className="w-full rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
            style={{ background: "#020817", border: "1px solid rgba(51,65,85,0.6)", color: "#e2e8f0" }} />
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span style={{ color: "#64748b" }}>≈ {score.bits} Bit Entropie</span>
            <span className="font-bold" style={{ color: score.color }}>{score.label}</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.6)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${score.pct}%`, background: score.color }} />
          </div>
          <p className="mt-3 text-[11px]" style={{ color: "#64748b" }}>Tipp: lieber lang (3–4 zufällige Wörter) als kompliziert kurz.</p>
        </Card>

        {/* SHA-256 */}
        <Card title="SHA-256 Hash" desc="Erzeugt den Hash eines Textes – z. B. zum Vergleich von Prüfsummen.">
          <input type="text" value={hashIn} onChange={(e) => setHashIn(e.target.value)}
            placeholder="Text eingeben"
            className="w-full rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
            style={{ background: "#020817", border: "1px solid rgba(51,65,85,0.6)", color: "#e2e8f0" }} />
          <button onClick={doHash}
            className="mt-3 px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            style={{ color: "#34d399", background: "rgba(6,78,59,0.4)", border: "1px solid rgba(16,185,129,0.4)" }}>
            Hash erzeugen
          </button>
          {hash && <code className="block mt-3 text-[11px] font-mono break-all rounded px-2 py-2" style={{ background: "#020817", color: "#67e8f9" }}>{hash}</code>}
        </Card>

        {/* Security-Header */}
        <Card title="Security-Header prüfen" desc="Führe den Befehl aus und füge die Ausgabe hier ein – ich bewerte die Schutz-Header.">
          <CommandRow cmd="curl -sI https://deine-seite.de" />
          <textarea value={headerText} onChange={(e) => setHeaderText(e.target.value)}
            placeholder="Ausgabe von curl -sI hier einfügen…" rows={4}
            className="w-full mt-3 rounded-lg px-3 py-2 text-[12px] font-mono outline-none resize-y"
            style={{ background: "#020817", border: "1px solid rgba(51,65,85,0.6)", color: "#e2e8f0" }} />
          {headerText.trim() && (
            <>
              <div className="mt-3 text-[12px] font-bold" style={{ color: headerScore >= 5 ? "#34d399" : headerScore >= 3 ? "#fbbf24" : "#f87171" }}>
                {headerScore}/{WANTED.length} Schutz-Header vorhanden
              </div>
              <div className="mt-2 space-y-1.5">
                {headerResult.map((h) => (
                  <div key={h.key} className="flex items-center gap-2 text-[12px]">
                    <span style={{ color: h.present ? "#34d399" : "#f87171" }}>{h.present ? "✓" : "✗"}</span>
                    <span style={{ color: "#e2e8f0" }}>{h.name}</span>
                    <span style={{ color: "#475569" }}>— {h.why}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Abhängigkeits-Scan */}
        <Card title="Abhängigkeiten auf Lücken prüfen" desc="Bekannte Schwachstellen in deinen Projekt-Paketen finden.">
          <div className="space-y-2">
            <CommandRow cmd="npm audit" note="Node.js-Projekte" />
            <CommandRow cmd="npm audit fix" note="behebbare automatisch beheben" />
            <CommandRow cmd="pip install pip-audit && pip-audit" note="Python-Projekte" />
            <CommandRow cmd="docker scout cves <image>" note="Docker-Images prüfen" />
          </div>
        </Card>
      </div>

      <div className="mt-5 rounded-xl p-4 text-[12px]"
           style={{ background: "rgba(30,58,138,0.2)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
        🔒 Mehr Web-Lücken üben: PortSwigger Web Security Academy (kostenlos). Siehe docs/LERNEN.md.
      </div>
    </div>
  );
}
