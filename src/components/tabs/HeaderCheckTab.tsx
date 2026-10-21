"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// HTTP-Security-Header-Check über die offizielle MDN HTTP Observatory API.
// POST https://observatory-api.mdn.mozilla.net/api/v2/scan?host=<host>
// Liefert eine echte Note (A+ … F), einen Score und Einzeltests pro Header.
// Kein Schlüssel nötig. Hinweis: Ein Browser darf fremde Header nicht selbst
// auslesen (CORS). Deshalb bewertet Mozillas Dienst für uns. Falls der Dienst
// den Browser-Zugriff limitiert, gibt es einen Fallback-Link zum echten Report.

type Test = { key: string; pass: boolean; desc: string; modifier: number };
type Scan = { grade: string; score: number; passed: number; failed: number; tests: Test[] };

const GRADE_COLOR: Record<string, string> = {
  "A+": "#34d399", A: "#34d399", "A-": "#4ade80",
  "B+": "#60a5fa", B: "#60a5fa", "B-": "#60a5fa",
  "C+": "#fbbf24", C: "#fbbf24", "C-": "#fbbf24",
  "D+": "#fb923c", D: "#fb923c", "D-": "#fb923c",
  F: "#f87171",
};

const NICE: Record<string, string> = {
  "content-security-policy": "Content-Security-Policy (CSP)",
  "strict-transport-security": "HSTS (erzwungenes HTTPS)",
  "x-content-type-options": "X-Content-Type-Options",
  "x-frame-options": "X-Frame-Options (Clickjacking)",
  "cross-origin-resource-policy": "Cross-Origin-Resource-Policy",
  "referrer-policy": "Referrer-Policy",
  cookies: "Cookies (Secure/HttpOnly)",
  redirection: "HTTP → HTTPS Weiterleitung",
  "subresource-integrity": "Subresource Integrity (SRI)",
};

function hostOf(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  return s;
}

function parse(json: unknown): Scan {
  const j = json as Record<string, unknown>;
  const rawTests = (j.tests as Record<string, Record<string, unknown>>) || {};
  const tests: Test[] = Object.entries(rawTests).map(([key, t]) => ({
    key,
    pass: Boolean(t.pass),
    desc: String(t.score_description || t.result || ""),
    modifier: Number(t.score_modifier || 0),
  }));
  // Erst die Fehler (negativer Modifier), dann bestandene; stärkste Abzüge oben.
  tests.sort((a, b) => Number(a.pass) - Number(b.pass) || a.modifier - b.modifier);
  return {
    grade: String(j.grade || "?"),
    score: Number(j.score ?? 0),
    passed: tests.filter((t) => t.pass).length,
    failed: tests.filter((t) => !t.pass).length,
    tests,
  };
}

export function HeaderCheckTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [scan, setScan] = useState<Scan | null>(null);

  async function run() {
    const host = hostOf(q);
    if (!host || !host.includes(".")) { setState("error"); return; }
    setState("loading"); setScan(null);
    try {
      const res = await fetch(`https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`,
        { method: "POST", signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setScan(parse(json));
      setState("ok");
    } catch { setState("error"); }
  }

  const host = hostOf(q);
  const reportLink = `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(host)}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Header-Check · Website-Sicherheit</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Gib eine Website ein → du bekommst eine echte Schulnote (A+ bis F) für ihre HTTP-Sicherheits-Header,
          bewertet von Mozillas offiziellem <b>HTTP Observatory</b>. Prüfe deine eigene Seite oder jede andere.
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Warum sind Header wichtig?">
        HTTP-Sicherheits-Header sagen dem Browser, wie er eine Seite schützen soll – z. B. <b>CSP</b> gegen XSS,
        <b> HSTS</b> erzwingt HTTPS, <b>X-Frame-Options</b> verhindert Clickjacking. Fehlen sie, ist die Seite
        angreifbar. Dieser Check gehört zum Alltag in <b>AppSec / Web-Pentesting</b> und ist eine typische
        erste Aufgabe im Job.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="z. B. github.com  oder  deine-seite.de"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
          style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }} />
        <button onClick={run} disabled={!q.trim() || state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>
          {state === "loading" ? "Prüfe…" : "Prüfen"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["github.com", "mozilla.org", "example.com"].map((ex) => (
          <button key={ex} onClick={() => setQ(ex)}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer font-mono"
            style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>{ex}</button>
        ))}
      </div>
      {state === "loading" && (
        <p className="mt-3 text-[13px]" style={{ color: "#64748b" }}>Der erste Scan einer Seite kann einige Sekunden dauern…</p>
      )}

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]"
             style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Live-Abfrage war nicht möglich (ungültige Eingabe, die Seite ist nicht erreichbar, oder Mozilla
          limitiert den Browser-Zugriff). {host.includes(".") && (
            <>Du kannst denselben Report direkt bei Mozilla öffnen:{" "}
            <a href={reportLink} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>→ bei MDN Observatory öffnen</a>.</>
          )}
        </div>
      )}

      {state === "ok" && scan && (
        <div className="mt-5 space-y-4">
          {/* Noten-Karte */}
          <div className="rounded-2xl p-5 flex items-center gap-5"
               style={{ background: "linear-gradient(145deg,#061a12,#082418)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: "rgba(2,8,23,0.6)", border: `2px solid ${GRADE_COLOR[scan.grade] || "#94a3b8"}` }}>
              <span className="text-5xl font-bold" style={{ color: GRADE_COLOR[scan.grade] || "#94a3b8" }}>{scan.grade}</span>
            </div>
            <div className="flex-1">
              <div className="text-[13px] uppercase tracking-wider" style={{ color: "#64748b" }}>Gesamtnote für</div>
              <div className="text-xl font-bold font-mono" style={{ color: "#e2e8f0" }}>{host}</div>
              <div className="text-[14px] mt-1" style={{ color: "#94a3b8" }}>
                Score: <b style={{ color: "#34d399" }}>{scan.score}</b> ·
                <span style={{ color: "#86efac" }}> {scan.passed} bestanden</span> ·
                <span style={{ color: "#fca5a5" }}> {scan.failed} offen</span>
              </div>
              <a href={reportLink} target="_blank" rel="noreferrer"
                 className="text-[12px]" style={{ color: "#64748b" }}>↗ Voller Report bei MDN</a>
            </div>
          </div>

          {/* Einzeltests */}
          <div className="space-y-2">
            {scan.tests.map((t) => (
              <div key={t.key} className="rounded-xl p-3.5 flex items-start gap-3"
                   style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${t.pass ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.25)"}` }}>
                <span className="text-[16px] mt-0.5" style={{ color: t.pass ? "#34d399" : "#f87171" }}>{t.pass ? "✓" : "✗"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: "#e2e8f0" }}>{NICE[t.key] || t.key}</div>
                  <div className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>{t.desc}</div>
                </div>
                {t.modifier !== 0 && (
                  <span className="text-[12px] font-bold font-mono flex-shrink-0"
                        style={{ color: t.modifier < 0 ? "#f87171" : "#34d399" }}>
                    {t.modifier > 0 ? "+" : ""}{t.modifier}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px]" style={{ color: "#475569" }}>
            Quelle: Mozilla / MDN HTTP Observatory. Punkte starten bei 100; jeder fehlende Schutz zieht ab.
          </p>
        </div>
      )}
    </div>
  );
}
