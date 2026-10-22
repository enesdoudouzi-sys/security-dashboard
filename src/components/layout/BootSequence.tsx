"use client";
import { useEffect, useState } from "react";

// Kurze Boot-Sequenz beim Laden (wie ein hochfahrendes Hacker-Terminal).
// Läuft nur einmal pro Browser-Sitzung (sessionStorage) und respektiert
// "Bewegung reduzieren".
const LINES = [
  "[ OK ] CyberShield Kernel geladen",
  "[ OK ] Netzwerk-Sensoren initialisiert",
  "[ OK ] Threat-Intelligence-Feeds verbunden",
  "[ OK ] OSINT-Module: Shodan · crt.sh · DNS · Observatory",
  "[ OK ] Verschlüsselung AES-256 aktiv",
  "[ OK ] SOC-Dashboard bereit",
  "> Willkommen, Analyst.",
];

export function BootSequence() {
  const [done, setDone] = useState(true);   // Standard: nicht zeigen (SSR-sicher)
  const [shown, setShown] = useState<string[]>([]);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("booted") === "1") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { sessionStorage.setItem("booted", "1"); return; }
      sessionStorage.setItem("booted", "1");
    } catch { return; }

    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      setShown((prev) => [...prev, LINES[i]]);
      i++;
      if (i >= LINES.length) {
        clearInterval(iv);
        setTimeout(() => setFade(true), 650);
        setTimeout(() => setDone(true), 1250);
      }
    }, 320);
    return () => clearInterval(iv);
  }, []);

  if (done) return null;

  return (
    <div aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#060010",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: fade ? 0 : 1, transition: "opacity 0.6s ease", pointerEvents: fade ? "none" : "auto",
      }}>
      <div style={{ fontFamily: "monospace", fontSize: 14, lineHeight: 1.9, width: "min(560px, 86vw)" }}>
        <div className="text-gradient-green" style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>CyberShield SOC</div>
        {shown.map((l, idx) => (
          <div key={idx} style={{ color: l.startsWith(">") ? "#00ffa3" : "#7df9ff" }}>
            {l.includes("[ OK ]") ? <><span style={{ color: "#00ffa3" }}>[ OK ]</span>{l.replace("[ OK ]", "")}</> : l}
          </div>
        ))}
        <span className="animate-blink" style={{ color: "#00f0ff" }}>█</span>
      </div>
    </div>
  );
}
