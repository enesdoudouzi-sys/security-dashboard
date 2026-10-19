"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Reine Browser-Analyse: Logzeilen einfügen, IOCs (Indicators of Compromise)
// per Regex herausziehen und auffällige Muster (z. B. Brute Force) markieren.

const SAMPLE = `Oct 19 08:11:02 srv sshd[2211]: Failed password for root from 45.33.32.156 port 51114 ssh2
Oct 19 08:11:03 srv sshd[2212]: Failed password for root from 45.33.32.156 port 51120 ssh2
Oct 19 08:11:05 srv sshd[2213]: Failed password for admin from 45.33.32.156 port 51130 ssh2
Oct 19 08:11:06 srv sshd[2214]: Failed password for admin from 45.33.32.156 port 51144 ssh2
Oct 19 08:11:09 srv sshd[2215]: Failed password for root from 45.33.32.156 port 51160 ssh2
Oct 19 08:12:40 srv sshd[2301]: Accepted password for deploy from 10.0.0.22 port 44512 ssh2
Oct 19 08:13:00 srv kernel: possible SYN flood on port 443 from 185.220.101.45
Oct 19 08:14:12 web nginx: 195.123.246.138 "GET /wp-login.php" 404
Oct 19 08:14:15 web nginx: 195.123.246.138 "GET /.env" 200
Oct 19 08:15:01 host malware: dropped file hash a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
Oct 19 08:15:30 dns query for evil-c2-domain.ru from 10.0.0.15`;

type Ioc = { type: string; value: string; count: number; risk: "high" | "medium" | "low" | "info"; note: string };

const RISK_COLOR: Record<string, string> = {
  high: "#f87171", medium: "#fbbf24", low: "#60a5fa", info: "#94a3b8",
};

function analyze(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const found: Record<string, Ioc> = {};
  const add = (type: string, value: string, risk: Ioc["risk"], note: string) => {
    const key = type + "|" + value;
    if (found[key]) found[key].count++;
    else found[key] = { type, value, count: 1, risk, note };
  };

  // Regex-Muster für typische IOCs
  const reIpv4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
  const reSha256 = /\b[a-f0-9]{64}\b/gi;
  const reSha1 = /\b[a-f0-9]{40}\b/gi;
  const reMd5 = /\b[a-f0-9]{32}\b/gi;
  const reUrl = /https?:\/\/[^\s"'<>]+/gi;
  const reEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const reCve = /CVE-\d{4}-\d{4,7}/gi;
  const reDomain = /\b(?:[a-z0-9-]+\.)+(?:ru|cn|tk|top|xyz|info|biz|su|cc)\b/gi;

  const isPrivate = (ip: string) =>
    /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || /^127\./.test(ip);

  for (const m of text.matchAll(reSha256)) add("SHA-256 Hash", m[0].toLowerCase(), "high", "Datei-Hash → bei VirusTotal prüfen.");
  for (const m of text.matchAll(reCve)) add("CVE", m[0].toUpperCase(), "high", "Referenzierte Schwachstelle.");
  for (const m of text.matchAll(reUrl)) add("URL", m[0], "medium", "Aufgerufene Adresse.");
  for (const m of text.matchAll(reEmail)) add("E-Mail", m[0], "low", "E-Mail-Adresse.");
  for (const m of text.matchAll(reDomain)) add("Verdächtige Domain", m[0].toLowerCase(), "high", "Ungewöhnliche TLD – oft C2/Malware.");
  for (const m of text.matchAll(reIpv4)) {
    const ip = m[0];
    if (isPrivate(ip)) add("IP (intern)", ip, "info", "Adresse aus dem eigenen Netz.");
    else add("IP (extern)", ip, "medium", "Öffentliche IP – Reputation prüfen.");
  }
  // SHA1/MD5 nur, wenn nicht schon als längerer Hash erkannt
  for (const m of text.matchAll(reSha1)) if (!found["SHA-256 Hash|" + m[0].toLowerCase()]) add("SHA-1 Hash", m[0].toLowerCase(), "high", "Datei-Hash → bei VirusTotal prüfen.");
  for (const m of text.matchAll(reMd5)) {
    const v = m[0].toLowerCase();
    if (!found["SHA-256 Hash|" + v] && !found["SHA-1 Hash|" + v]) add("MD5 Hash", v, "high", "Datei-Hash → bei VirusTotal prüfen.");
  }

  // Muster-Erkennung
  const alerts: { title: string; detail: string; sev: Ioc["risk"] }[] = [];
  const failsByIp: Record<string, number> = {};
  let synFlood = 0;
  for (const l of lines) {
    const fail = /failed password|authentication failure|invalid user/i.test(l);
    if (fail) {
      const ip = l.match(reIpv4)?.[0];
      if (ip) failsByIp[ip] = (failsByIp[ip] || 0) + 1;
    }
    if (/syn flood|ddos|flood on port/i.test(l)) synFlood++;
  }
  for (const [ip, n] of Object.entries(failsByIp)) {
    if (n >= 5) alerts.push({ title: `Brute-Force-Verdacht von ${ip}`, detail: `${n} fehlgeschlagene Logins. Technik: T1110. Maßnahme: IP sperren, fail2ban prüfen.`, sev: "high" });
    else if (n >= 3) alerts.push({ title: `Auffällige Login-Fehler von ${ip}`, detail: `${n} Fehlversuche – beobachten.`, sev: "medium" });
  }
  if (synFlood) alerts.push({ title: "Möglicher (D)DoS / SYN-Flood", detail: "Technik: T1498. Rate-Limiting / Upstream-Schutz prüfen.", sev: "high" });
  if (/\/\.env|\/wp-login|\/phpmyadmin|\/\.git/i.test(text)) alerts.push({ title: "Web-Scanning / sensible Pfade abgefragt", detail: "Angreifer sucht Konfig-/Login-Dateien (z. B. /.env). Technik: T1595.", sev: "medium" });

  const order = { high: 0, medium: 1, low: 2, info: 3 };
  const iocs = Object.values(found).sort((a, b) => order[a.risk] - order[b.risk] || b.count - a.count);
  return { iocs, alerts, lineCount: lines.length };
}

export function LogAnalyzerTab() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<ReturnType<typeof analyze> | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gradient-green">Log-Analyse &amp; IOC-Extractor</h2>
        <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
          Logzeilen einfügen → IPs, Hashes, URLs und verdächtige Domains werden automatisch herausgezogen
          (IOC = Indicator of Compromise) und auffällige Muster wie Brute Force markiert. Läuft komplett im Browser.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Das ist der <b>Alltag im SOC</b>: Du bekommst einen Alarm, öffnest die Logs und machst &bdquo;Triage&ldquo; –
        was ist passiert, welche IPs/Dateien sind beteiligt, ist es echt? IOCs extrahieren und gegen Threat-Intel
        prüfen ist die Kern-Fähigkeit eines <b>Tier-1-Analysten</b>.
      </LearnNote></div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9}
        placeholder="Logzeilen hier einfügen (SSH, Nginx, Firewall, …)"
        className="w-full px-3 py-3 rounded-xl text-[12px] font-mono outline-none resize-y"
        style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#cbd5e1", caretColor: "#10b981" }} />

      <div className="flex gap-2 mt-3">
        <button onClick={() => setRes(analyze(text))} disabled={!text.trim()}
          className="px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>
          Analysieren
        </button>
        <button onClick={() => { setText(SAMPLE); setRes(analyze(SAMPLE)); }}
          className="px-4 py-2 rounded-xl text-[12px] font-medium cursor-pointer"
          style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>
          Beispiel laden
        </button>
        {text && <button onClick={() => { setText(""); setRes(null); }}
          className="px-4 py-2 rounded-xl text-[12px] font-medium cursor-pointer"
          style={{ color: "#64748b" }}>Leeren</button>}
      </div>

      {res && (
        <div className="mt-5 space-y-5">
          {res.alerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: "#f87171" }}>⚠ Erkannte Muster ({res.alerts.length})</div>
              {res.alerts.map((a, i) => (
                <div key={i} className="rounded-lg p-3"
                     style={{ background: "rgba(127,29,29,0.18)", border: `1px solid ${RISK_COLOR[a.sev]}44` }}>
                  <div className="text-[13px] font-bold" style={{ color: RISK_COLOR[a.sev] }}>{a.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#cbd5e1" }}>{a.detail}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>
              Gefundene IOCs ({res.iocs.length}) · {res.lineCount} Zeilen analysiert
            </div>
            {res.iocs.length === 0 ? (
              <p className="text-[12px]" style={{ color: "#64748b" }}>Keine IOCs gefunden.</p>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(30,41,59,0.6)" }}>
                {res.iocs.map((ioc, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-[12px]"
                       style={{ background: i % 2 ? "rgba(15,23,42,0.4)" : "transparent", borderTop: i ? "1px solid rgba(30,41,59,0.4)" : "none" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: RISK_COLOR[ioc.risk] }} />
                    <span className="font-mono flex-1 break-all" style={{ color: "#e2e8f0" }}>{ioc.value}</span>
                    {ioc.count > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(30,41,59,0.8)", color: "#94a3b8" }}>×{ioc.count}</span>}
                    <span className="text-[10px] uppercase tracking-wider w-32 text-right flex-shrink-0" style={{ color: "#64748b" }}>{ioc.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
