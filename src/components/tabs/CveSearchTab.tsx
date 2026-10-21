"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Live-Suche in der offiziellen NVD-Datenbank (National Vulnerability Database)
// des US-NIST. Kostenloses API, kein Schlüssel nötig. Läuft direkt aus dem Browser;
// falls NVD den Browser-Zugriff blockt/limitiert, gibt es einen Fallback-Link.

type Cve = { id: string; score: number | null; severity: string; desc: string; published: string; refs: string[] };

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#f87171", HIGH: "#fb923c", MEDIUM: "#fbbf24", LOW: "#60a5fa", NONE: "#94a3b8", UNKNOWN: "#94a3b8",
};

function parse(json: unknown): Cve[] {
  const vulns = (json as { vulnerabilities?: unknown[] })?.vulnerabilities || [];
  return vulns.map((v) => {
    const cve = (v as { cve: Record<string, unknown> }).cve;
    const m = cve.metrics as Record<string, Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>> | undefined;
    const metric = m?.cvssMetricV31?.[0] || m?.cvssMetricV30?.[0] || m?.cvssMetricV2?.[0];
    const descs = (cve.descriptions as Array<{ lang: string; value: string }>) || [];
    const refs = ((cve.references as Array<{ url: string }>) || []).map((r) => r.url).slice(0, 4);
    return {
      id: String(cve.id),
      score: metric?.cvssData?.baseScore ?? null,
      severity: (metric?.cvssData?.baseSeverity || "UNKNOWN").toUpperCase(),
      desc: (descs.find((d) => d.lang === "en") || descs[0])?.value || "—",
      published: String(cve.published || "").slice(0, 10),
      refs,
    };
  });
}

export function CveSearchTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [results, setResults] = useState<Cve[]>([]);

  async function search() {
    const term = q.trim();
    if (!term) return;
    setState("loading");
    const isId = /^CVE-\d{4}-\d{4,7}$/i.test(term);
    const url = isId
      ? `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(term.toUpperCase())}`
      : `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(term)}&resultsPerPage=15`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setResults(parse(json));
      setState("ok");
    } catch {
      setState("error");
    }
  }

  const nvdLink = /^CVE-\d{4}-\d{4,7}$/i.test(q.trim())
    ? `https://nvd.nist.gov/vuln/detail/${q.trim().toUpperCase()}`
    : `https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(q.trim())}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">CVE-Live-Suche (NVD)</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Echte Schwachstellen live aus der offiziellen NIST-Datenbank. Suche per Stichwort
          (z. B. <code style={{ color: "#67e8f9" }}>openssh</code>) oder exakter ID
          (<code style={{ color: "#67e8f9" }}>CVE-2024-3094</code>).
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Das ist <b>Threat Intelligence &amp; Patch-Priorisierung</b>: Welche Lücke betrifft uns, wie schlimm ist sie
        (CVSS-Score 0–10), gibt es schon einen Exploit? Danach entscheidest du, was zuerst gepatcht wird.
        Der <b>CVSS-Score</b> und die Begriffe CRITICAL/HIGH/MEDIUM/LOW gehören zum Grundwissen jedes Security-Jobs.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Stichwort oder CVE-ID…"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none"
          style={{ background: "#07010f", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#00b8d4" }} />
        <button onClick={search} disabled={!q.trim() || state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
          {state === "loading" ? "Suche…" : "Suchen"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["openssh", "log4j", "fortinet", "CVE-2024-3094"].map((ex) => (
          <button key={ex} onClick={() => { setQ(ex); }}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer"
            style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>{ex}</button>
        ))}
      </div>

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]"
             style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Live-Abfrage war nicht möglich (NVD limitiert Browser-Zugriffe manchmal oder es gab ein Netzwerkproblem).
          Du kannst dieselbe Suche direkt bei NVD öffnen:{" "}
          <a href={nvdLink} target="_blank" rel="noreferrer" style={{ color: "#67e8f9" }}>→ bei nvd.nist.gov öffnen</a>.
          <div className="mt-1" style={{ color: "#94a3b8" }}>Tipp: Mit dem eigenen Backend als Proxy lässt sich das Limit umgehen.</div>
        </div>
      )}

      {state === "ok" && (
        <div className="mt-5 space-y-3">
          <div className="text-[13px] uppercase tracking-wider font-bold" style={{ color: "#94a3b8" }}>
            {results.length} Treffer
          </div>
          {results.length === 0 && <p className="text-[14px]" style={{ color: "#64748b" }}>Keine CVEs gefunden.</p>}
          {results.map((c) => {
            const col = SEV_COLOR[c.severity] || "#94a3b8";
            return (
              <div key={c.id} className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={`https://nvd.nist.gov/vuln/detail/${c.id}`} target="_blank" rel="noreferrer"
                     className="text-[15px] font-bold font-mono" style={{ color: "#67e8f9" }}>{c.id}</a>
                  <div className="flex items-center gap-2">
                    {c.score != null && <span className="text-[14px] font-bold" style={{ color: col }}>CVSS {c.score}</span>}
                    <span className="text-[12px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                          style={{ background: `${col}22`, color: col }}>{c.severity}</span>
                    {c.published && <span className="text-[12px]" style={{ color: "#475569" }}>{c.published}</span>}
                  </div>
                </div>
                <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#cbd5e1" }}>{c.desc}</p>
                {c.refs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {c.refs.map((r, i) => (
                      <a key={i} href={r} target="_blank" rel="noreferrer"
                         className="text-[12px] truncate max-w-[220px]" style={{ color: "#64748b" }}>↗ {r.replace(/^https?:\/\//, "")}</a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
