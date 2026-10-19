"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Netzwerk-/CIDR-Rechner + Hash-Identifier. Rein im Browser.

function ipToInt(ip: string): number | null {
  const p = ip.trim().split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const part of p) {
    const b = Number(part);
    if (!Number.isInteger(b) || b < 0 || b > 255 || part === "") return null;
    n = n * 256 + b;
  }
  return n >>> 0;
}
function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function cidrInfo(input: string) {
  const [ip, maskStr] = input.trim().split("/");
  const base = ipToInt(ip);
  const bits = Number(maskStr);
  if (base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const network = (base & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = Math.pow(2, 32 - bits);
  const usable = bits >= 31 ? total : total - 2;
  const first = bits >= 31 ? network : (network + 1) >>> 0;
  const last = bits >= 31 ? broadcast : (broadcast - 1) >>> 0;
  return {
    netmask: intToIp(mask),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    first: intToIp(first),
    last: intToIp(last),
    total, usable, bits,
  };
}

function identifyHash(h: string): { name: string; note: string }[] {
  const s = h.trim();
  const out: { name: string; note: string }[] = [];
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s)) out.push({ name: "bcrypt", note: "Starker Passwort-Hash (mit Salt)." });
  if (/^\$argon2(id|i|d)\$/.test(s)) out.push({ name: "Argon2", note: "Moderner, sehr starker Passwort-Hash." });
  if (/^[a-f0-9]{32}$/i.test(s)) out.push({ name: "MD5", note: "32 Hex. GEBROCHEN – nicht für Sicherheit nutzen." });
  if (/^[a-f0-9]{40}$/i.test(s)) out.push({ name: "SHA-1", note: "40 Hex. Gilt als unsicher." });
  if (/^[a-f0-9]{64}$/i.test(s)) out.push({ name: "SHA-256", note: "64 Hex. Sicher & weit verbreitet." });
  if (/^[a-f0-9]{128}$/i.test(s)) out.push({ name: "SHA-512", note: "128 Hex. Sehr sicher." });
  if (/^[a-f0-9]{16}$/i.test(s)) out.push({ name: "CRC/MySQL323?", note: "16 Hex – oft Prüfsumme, kein Krypto-Hash." });
  if (/^[A-Za-z0-9+/]{27}=$/.test(s)) out.push({ name: "SHA-1 (Base64)", note: "27 Zeichen + '=' – Base64-kodiert." });
  return out;
}

export function NetToolsTab() {
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [hash, setHash] = useState("");
  const info = cidrInfo(cidr);
  const hashRes = hash.trim() ? identifyHash(hash) : [];

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderTop: "1px solid rgba(30,41,59,0.4)" }}>
      <span style={{ color: "#64748b" }}>{k}</span>
      <span className="font-mono font-semibold" style={{ color: "#67e8f9" }}>{v}</span>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Netzwerk-Rechner & Hash-Identifier</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>Zwei Alltags-Werkzeuge: Subnetze berechnen und Hash-Typen erkennen. Rein im Browser.</p>
      </div>

      <div className="mb-5"><LearnNote>
        <b>CIDR/Subnetze</b> musst du im Security- und Netzwerk-Job im Schlaf können: Welche IPs gehören zu einem Netz,
        wie viele Hosts passen rein? Und beim Analysieren von Daten hilft es, einen <b>Hash am Format zu erkennen</b>,
        bevor man ihn (im Labor!) zu knacken versucht.
      </LearnNote></div>

      {/* CIDR */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#e2e8f0" }}>🌐 CIDR-/Subnetz-Rechner</div>
        <input value={cidr} onChange={(e) => setCidr(e.target.value)}
          placeholder="z. B. 192.168.1.0/24"
          className="w-full px-3 py-2.5 rounded-xl text-[14px] font-mono outline-none"
          style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }} />
        {cidr.trim() && (info
          ? <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(30,41,59,0.6)" }}>
              <Row k="Netzadresse" v={info.network} />
              <Row k="Broadcast" v={info.broadcast} />
              <Row k="Subnetzmaske" v={info.netmask} />
              <Row k="Erste nutzbare IP" v={info.first} />
              <Row k="Letzte nutzbare IP" v={info.last} />
              <Row k="Nutzbare Hosts" v={info.usable.toLocaleString("de-DE")} />
              <Row k="Adressen gesamt" v={info.total.toLocaleString("de-DE")} />
            </div>
          : <p className="mt-3 text-[13px]" style={{ color: "#f87171" }}>Ungültiges Format. Beispiel: 10.0.0.0/8</p>)}
      </div>

      {/* Hash */}
      <div className="rounded-xl p-5" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="text-[14px] font-bold mb-3" style={{ color: "#e2e8f0" }}>🔐 Hash-Identifier</div>
        <input value={hash} onChange={(e) => setHash(e.target.value)}
          placeholder="Hash einfügen…"
          className="w-full px-3 py-2.5 rounded-xl text-[13px] font-mono outline-none break-all"
          style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }} />
        {hash.trim() && (hashRes.length
          ? <div className="mt-3 space-y-2">
              {hashRes.map((r, i) => (
                <div key={i} className="rounded-lg px-4 py-2.5" style={{ background: "#020817", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <span className="text-[14px] font-bold" style={{ color: "#34d399" }}>{r.name}</span>
                  <span className="text-[12px] ml-2" style={{ color: "#64748b" }}>{r.note}</span>
                </div>
              ))}
            </div>
          : <p className="mt-3 text-[13px]" style={{ color: "#fbbf24" }}>Kein bekanntes Hash-Format erkannt.</p>)}
        <p className="text-[11px] mt-3" style={{ color: "#475569" }}>Hinweis: Erkennung nur anhand Länge/Format – mehrere Treffer sind möglich.</p>
      </div>
    </div>
  );
}
