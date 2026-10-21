"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Exposure-Check: ECHTE Daten, keine Demo.
//  • IP  → Shodan InternetDB (https://internetdb.shodan.io/{ip})
//          Liefert real gescannte offene Ports, bekannte CVEs, Hostnamen und Tags.
//          Kostenlos, kein Schlüssel, passiv (keine aktive Verbindung zum Ziel).
//  • Domain → crt.sh Certificate Transparency (https://crt.sh/?q={domain}&output=json)
//          Liefert echte ausgestellte Zertifikate und dadurch bekannte Subdomains.
// Alles läuft direkt im Browser. Es wird NICHTS an unser eigenes Backend gesendet.

type IpResult = {
  ip: string;
  ports: number[];
  cpes: string[];
  hostnames: string[];
  tags: string[];
  vulns: string[];
};

function isIp(s: string): boolean {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(s);
}
function isDomain(s: string): boolean {
  return /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i.test(s) && !isIp(s);
}

export function ExposureTab() {
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "empty" | "error">("idle");
  const [mode, setMode] = useState<"ip" | "domain" | null>(null);
  const [ip, setIp] = useState<IpResult | null>(null);
  const [subs, setSubs] = useState<string[]>([]);
  const [myIp, setMyIp] = useState<string | null>(null);

  async function lookupMyIp() {
    try {
      const res = await fetch("https://dns.google/resolve?name=o-o.myaddr.l.google.com&type=TXT", { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      const txt = (json?.Answer as Array<{ data?: string }> | undefined)?.find((a) => a.data)?.data || "";
      const found = txt.replace(/"/g, "").trim();
      if (isIp(found)) { setMyIp(found); setQ(found); }
    } catch { /* optional, einfach ignorieren */ }
  }

  async function run() {
    const term = q.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!term) return;
    setState("loading"); setIp(null); setSubs([]);

    if (isIp(term)) {
      setMode("ip");
      try {
        const res = await fetch(`https://internetdb.shodan.io/${term}`, { signal: AbortSignal.timeout(12000) });
        if (res.status === 404) { setState("empty"); return; }
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        setIp({
          ip: String(j.ip || term),
          ports: Array.isArray(j.ports) ? j.ports : [],
          cpes: Array.isArray(j.cpes) ? j.cpes : [],
          hostnames: Array.isArray(j.hostnames) ? j.hostnames : [],
          tags: Array.isArray(j.tags) ? j.tags : [],
          vulns: Array.isArray(j.vulns) ? j.vulns : [],
        });
        setState("ok");
      } catch { setState("error"); }
      return;
    }

    if (isDomain(term)) {
      setMode("domain");
      try {
        const res = await fetch(`https://crt.sh/?q=${encodeURIComponent("%." + term)}&output=json`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(String(res.status));
        const arr = (await res.json()) as Array<{ name_value?: string }>;
        const set = new Set<string>();
        for (const row of arr) {
          for (const n of String(row.name_value || "").split("\n")) {
            const name = n.trim().toLowerCase();
            if (name && !name.startsWith("*.") && (name === term || name.endsWith("." + term))) set.add(name);
          }
        }
        const list = [...set].sort();
        setSubs(list);
        setState(list.length ? "ok" : "empty");
      } catch { setState("error"); }
      return;
    }

    setMode(null);
    setState("error");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Exposure-Check · echte Daten</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Keine Demo. Gib eine <b>IP-Adresse</b> ein → du siehst echte offene Ports, bekannte Schwachstellen (CVEs),
          Hostnamen und Tags aus Shodans realen Internet-Scans. Oder eine <b>Domain</b> → echte Subdomains aus den
          öffentlichen Zertifikats-Logs (Certificate Transparency).
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Was ist das – und ist es legal?">
        Das ist <b>passives OSINT (Open-Source Intelligence)</b>: Du fragst öffentliche Datenbanken, die das Internet
        ohnehin schon gescannt haben (Shodan) bzw. die jeder Zertifikatsausstellung öffentlich protokollieren (crt.sh).
        Es wird <b>keine Verbindung zum Ziel selbst</b> aufgebaut – genau so beginnt ein echtes Security-Assessment
        (Reconnaissance). Prüfe damit am besten <b>deine eigene</b> IP/Domain und schau, was von außen über dich sichtbar ist.
      </LearnNote></div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="z. B. 80.151.244.109  oder  example.com"
          className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
          style={{ background: "#07010f", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#00b8d4" }} />
        <button onClick={run} disabled={!q.trim() || state === "loading"}
          className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
          {state === "loading" ? "Prüfe…" : "Prüfen"}
        </button>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap items-center">
        <button onClick={lookupMyIp}
          className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer"
          style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff" }}>
          📍 Meine öffentliche IP ermitteln
        </button>
        {myIp && <span className="text-[13px] font-mono" style={{ color: "#67e8f9" }}>{myIp}</span>}
        {["80.151.244.109", "github.com", "1.1.1.1"].map((ex) => (
          <button key={ex} onClick={() => setQ(ex)}
            className="text-[13px] px-2.5 py-1 rounded-lg cursor-pointer font-mono"
            style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>{ex}</button>
        ))}
      </div>

      {state === "empty" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]"
             style={{ background: "rgba(10,26,46,0.18)", border: "1px solid rgba(0,240,255,0.3)", color: "#7df9ff" }}>
          ✓ Gute Nachricht: Für <b className="font-mono">{q.trim()}</b> sind in den öffentlichen Scan-Daten
          {mode === "ip" ? " keine offenen Ports oder Schwachstellen" : " keine Subdomains"} bekannt.
          Das heißt: nach außen nichts Auffälliges sichtbar.
        </div>
      )}

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]"
             style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Abfrage war nicht möglich. Bitte prüfe die Eingabe (gültige IPv4-Adresse oder Domain) oder versuche es erneut –
          die öffentlichen Dienste (Shodan / crt.sh) limitieren Anfragen manchmal.
        </div>
      )}

      {/* IP-Ergebnis */}
      {state === "ok" && mode === "ip" && ip && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[16px] font-bold font-mono" style={{ color: "#67e8f9" }}>{ip.ip}</span>
              <a href={`https://www.shodan.io/host/${ip.ip}`} target="_blank" rel="noreferrer"
                 className="text-[12px]" style={{ color: "#64748b" }}>↗ Vollbild bei shodan.io</a>
            </div>
            {ip.hostnames.length > 0 && (
              <div className="mt-2 text-[13px]" style={{ color: "#cbd5e1" }}>
                <span style={{ color: "#64748b" }}>Hostnamen: </span>{ip.hostnames.join(", ")}
              </div>
            )}
            {ip.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ip.tags.map((t) => (
                  <span key={t} className="text-[12px] px-2 py-0.5 rounded font-bold"
                        style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="text-[13px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>
                Offene Ports ({ip.ports.length})
              </div>
              {ip.ports.length === 0
                ? <p className="text-[14px]" style={{ color: "#7df9ff" }}>Keine offenen Ports bekannt ✓</p>
                : <div className="flex flex-wrap gap-2">
                    {ip.ports.map((p) => (
                      <span key={p} className="text-[13px] px-2 py-1 rounded font-mono font-bold"
                            style={{ background: "rgba(0,240,255,0.12)", border: "1px solid rgba(0,240,255,0.25)", color: "#00f0ff" }}>{p}</span>
                    ))}
                  </div>}
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="text-[13px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>
                Bekannte Schwachstellen ({ip.vulns.length})
              </div>
              {ip.vulns.length === 0
                ? <p className="text-[14px]" style={{ color: "#7df9ff" }}>Keine bekannten CVEs ✓</p>
                : <div className="flex flex-wrap gap-2">
                    {ip.vulns.map((v) => (
                      <a key={v} href={`https://nvd.nist.gov/vuln/detail/${v}`} target="_blank" rel="noreferrer"
                         className="text-[13px] px-2 py-1 rounded font-mono font-bold"
                         style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>{v}</a>
                    ))}
                  </div>}
            </div>
          </div>

          {ip.cpes.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="text-[13px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>
                Erkannte Software (CPE · {ip.cpes.length})
              </div>
              <div className="flex flex-col gap-1">
                {ip.cpes.map((c) => (
                  <span key={c} className="text-[12px] font-mono" style={{ color: "#94a3b8" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px]" style={{ color: "#475569" }}>
            Quelle: Shodan InternetDB (passiv, öffentlich). Daten können einige Tage alt sein.
          </p>
        </div>
      )}

      {/* Domain-Ergebnis */}
      {state === "ok" && mode === "domain" && (
        <div className="mt-5 space-y-3">
          <div className="text-[13px] uppercase tracking-wider font-bold" style={{ color: "#94a3b8" }}>
            {subs.length} Subdomains aus Zertifikats-Logs
          </div>
          <div className="rounded-xl p-4 grid gap-1 sm:grid-cols-2"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            {subs.map((s) => (
              <span key={s} className="text-[13px] font-mono truncate" style={{ color: "#cbd5e1" }}>{s}</span>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: "#475569" }}>
            Quelle: crt.sh (Certificate Transparency, öffentlich). Jedes je ausgestellte TLS-Zertifikat ist hier verzeichnet –
            ein Angreifer nutzt genau diese Liste, um versteckte Subdomains zu finden.
          </p>
        </div>
      )}
    </div>
  );
}
