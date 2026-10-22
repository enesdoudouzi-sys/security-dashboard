"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// DNS-Recon: echte DNS-Einträge einer Domain live über Google Public DNS (JSON API).
// https://dns.google/resolve?name=<domain>&type=<TYPE>  – kostenlos, CORS, kein Key.
// Dazu eine kleine E-Mail-Sicherheits-Bewertung (SPF / DMARC / DNSSEC / CAA).
// Alles passiv und im Browser – es wird nichts an ein Backend gesendet.

type Rec = { data: string };
type Section = { type: string; label: string; hint: string; records: string[] };

async function query(name: string, type: string): Promise<{ records: string[]; ad: boolean }> {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    { signal: AbortSignal.timeout(10000) });
  const j = await res.json();
  const ans = (j.Answer as Rec[] | undefined) || [];
  // Nur passende Record-Typen behalten (Google liefert z. T. CNAME-Ketten mit).
  const records = ans.map((a) => String(a.data).replace(/^"|"$/g, "")).filter(Boolean);
  return { records, ad: Boolean(j.AD) };
}

export function DnsReconTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [domain, setDomain] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [sec, setSec] = useState<{ spf: boolean; dmarc: boolean; dnssec: boolean; caa: boolean; spfTxt: string; dmarcTxt: string } | null>(null);

  async function run() {
    const d = q.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
    if (!d || !d.includes(".")) { setState("error"); return; }
    setState("loading"); setSections([]); setSec(null); setDomain(d);
    try {
      const [a, aaaa, mx, ns, txt, caa, dmarc] = await Promise.all([
        query(d, "A"), query(d, "AAAA"), query(d, "MX"), query(d, "NS"),
        query(d, "TXT"), query(d, "CAA"), query("_dmarc." + d, "TXT"),
      ]);

      const secs: Section[] = [
        { type: "A", label: "A (IPv4)", hint: "Server-Adressen", records: a.records },
        { type: "AAAA", label: "AAAA (IPv6)", hint: "IPv6-Adressen", records: aaaa.records },
        { type: "MX", label: "MX (Mailserver)", hint: "wer E-Mails empfängt", records: mx.records.sort() },
        { type: "NS", label: "NS (Nameserver)", hint: "wer die Domain verwaltet", records: ns.records },
        { type: "TXT", label: "TXT", hint: "SPF, Verifizierungen u. a.", records: txt.records },
        { type: "CAA", label: "CAA", hint: "erlaubte Zertifikats-Aussteller", records: caa.records },
      ].filter((s) => s.records.length > 0);
      setSections(secs);

      const spfTxt = txt.records.find((r) => r.toLowerCase().startsWith("v=spf1")) || "";
      const dmarcTxt = dmarc.records.find((r) => r.toLowerCase().startsWith("v=dmarc1")) || "";
      setSec({
        spf: !!spfTxt,
        dmarc: !!dmarcTxt,
        dnssec: a.ad || ns.ad || mx.ad,
        caa: caa.records.length > 0,
        spfTxt, dmarcTxt,
      });
      setState("ok");
    } catch { setState("error"); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">DNS-Recon · echte Einträge</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Gib eine Domain ein → du siehst ihre echten DNS-Einträge (A, MX, NS, TXT, CAA) live aus Google Public DNS,
          plus eine Bewertung der E-Mail-Sicherheit (SPF, DMARC, DNSSEC).
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Warum DNS-Recon?">
        DNS ist das Telefonbuch des Internets. Als Security-Analyst liest du daraus heraus: Wo stehen die Server?
        Wer verschickt E-Mails? Ist die Domain gegen <b>Spoofing</b> geschützt (SPF/DMARC)? Fehlen diese Einträge,
        können Angreifer im Namen der Firma Phishing-Mails verschicken. Das ist klassische <b>Reconnaissance</b>.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="z. B. example.com"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
          style={{ background: "#07010f", border: "1px solid rgba(0,240,255,0.25)", color: "#e2e8f0", caretColor: "#00f0ff" }} />
        <button onClick={run} disabled={!q.trim() || state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
          {state === "loading" ? "Prüfe…" : "Abfragen"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        {["google.com", "github.com", "paypal.com"].map((ex) => (
          <button key={ex} onClick={() => setQ(ex)}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer font-mono"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.2)", color: "#7df9ff" }}>{ex}</button>
        ))}
      </div>

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]"
             style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Abfrage war nicht möglich. Bitte prüfe die Domain (z. B. <code>example.com</code>) und versuche es erneut.
        </div>
      )}

      {state === "ok" && sec && (
        <div className="mt-5 space-y-4">
          {/* E-Mail-Sicherheit */}
          <div className="rounded-2xl p-5"
               style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: "1px solid rgba(0,240,255,0.25)" }}>
            <div className="text-[13px] uppercase tracking-wider font-bold mb-3" style={{ color: "#94a3b8" }}>
              E-Mail- & Domain-Schutz von <span className="font-mono" style={{ color: "#00f0ff" }}>{domain}</span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                { ok: sec.spf, name: "SPF", good: "Absender-Schutz aktiv", bad: "FEHLT – Spoofing möglich" },
                { ok: sec.dmarc, name: "DMARC", good: "Phishing-Schutz aktiv", bad: "FEHLT – kein Phishing-Schutz" },
                { ok: sec.dnssec, name: "DNSSEC", good: "DNS kryptografisch signiert", bad: "nicht signiert" },
                { ok: sec.caa, name: "CAA", good: "Zertifikats-Aussteller begrenzt", bad: "nicht gesetzt" },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                     style={{ background: "rgba(7,1,15,0.5)", border: `1px solid ${r.ok ? "rgba(0,240,255,0.25)" : "rgba(239,68,68,0.3)"}` }}>
                  <span className="text-[18px]" style={{ color: r.ok ? "#00f0ff" : "#f87171" }}>{r.ok ? "✓" : "✗"}</span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold" style={{ color: "#e2e8f0" }}>{r.name}</div>
                    <div className="text-[12px]" style={{ color: r.ok ? "#7df9ff" : "#fca5a5" }}>{r.ok ? r.good : r.bad}</div>
                  </div>
                </div>
              ))}
            </div>
            {sec.spfTxt && <p className="mt-3 text-[12px] font-mono break-all" style={{ color: "#64748b" }}><b style={{ color: "#94a3b8" }}>SPF:</b> {sec.spfTxt}</p>}
            {sec.dmarcTxt && <p className="mt-1 text-[12px] font-mono break-all" style={{ color: "#64748b" }}><b style={{ color: "#94a3b8" }}>DMARC:</b> {sec.dmarcTxt}</p>}
          </div>

          {/* DNS-Einträge */}
          {sections.map((s) => (
            <div key={s.type} className="rounded-xl p-4" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.15)" }}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[14px] font-bold" style={{ color: "#00f0ff" }}>{s.label}</span>
                <span className="text-[11px]" style={{ color: "#475569" }}>{s.hint}</span>
              </div>
              <div className="flex flex-col gap-1">
                {s.records.map((r, i) => (
                  <span key={i} className="text-[13px] font-mono break-all" style={{ color: "#cbd5e1" }}>{r}</span>
                ))}
              </div>
            </div>
          ))}

          <p className="text-[11px]" style={{ color: "#475569" }}>
            Quelle: Google Public DNS (dns.google). DNSSEC = „AD"-Flag der Antwort. Passiv & öffentlich.
          </p>
        </div>
      )}
    </div>
  );
}
