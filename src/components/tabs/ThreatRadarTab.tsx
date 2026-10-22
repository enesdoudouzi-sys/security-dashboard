"use client";
import { useEffect, useRef, useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Live-Bedrohungsradar: animierte Visualisierung eingehender Angriffe auf ein SOC.
// WICHTIG: Dies ist eine Demo-/Lern-Visualisierung (simulierte Ereignisse), damit
// du siehst, wie ein echtes Security Operations Center aussieht. Keine echten Live-Daten.

const COUNTRIES = ["🇷🇺 Russland", "🇨🇳 China", "🇺🇸 USA", "🇧🇷 Brasilien", "🇮🇳 Indien", "🇮🇷 Iran", "🇰🇵 Nordkorea", "🇳🇱 Niederlande", "🇩🇪 Deutschland", "🇻🇳 Vietnam", "🇹🇷 Türkei", "🇺🇦 Ukraine"];
const TYPES = [
  { name: "SSH Brute Force", sev: "hoch", color: "#fb923c" },
  { name: "Port Scan", sev: "niedrig", color: "#00f0ff" },
  { name: "SQL Injection", sev: "kritisch", color: "#f87171" },
  { name: "Malware C2", sev: "kritisch", color: "#f87171" },
  { name: "DDoS", sev: "hoch", color: "#fb923c" },
  { name: "Phishing", sev: "mittel", color: "#fbbf24" },
  { name: "Exploit Attempt", sev: "kritisch", color: "#f87171" },
  { name: "Credential Stuffing", sev: "hoch", color: "#fb923c" },
];
const randIp = () => `${r(1, 223)}.${r(0, 255)}.${r(0, 255)}.${r(0, 255)}`;
function r(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

type Event = { id: number; country: string; ip: string; type: string; sev: string; color: string; t: string };

export function ThreatRadarTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ total: 0, blocked: 0 });
  const topRef = useRef<Record<string, number>>({});
  const [top, setTop] = useState("—");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = canvasRef.current;
    if (!c) return;
    const canvas = c;
    const g = canvas.getContext("2d");
    if (!g) return;
    const ctx = g;

    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
      W = canvas.width; H = canvas.height; cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 10;
    }
    resize();
    window.addEventListener("resize", resize);

    type Blip = { ang: number; dist: number; speed: number; color: string };
    const blips: Blip[] = [];
    let sweep = 0;
    let raf = 0;

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      // Ringe
      ctx.strokeStyle = "rgba(0,240,255,0.18)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, (R / 4) * i, 0, Math.PI * 2); ctx.stroke(); }
      // Kreuz
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // Sweep
      if (!reduce) sweep += 0.012;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweep);
      const lg = ctx.createLinearGradient(0, 0, R, 0);
      lg.addColorStop(0, "rgba(0,240,255,0.35)");
      lg.addColorStop(1, "rgba(0,240,255,0)");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -0.4, 0); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Zentrum (Ziel)
      ctx.fillStyle = "#00ffa3";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,255,163,0.5)";
      ctx.beginPath(); ctx.arc(cx, cy, 9 + (Math.sin(Date.now() / 300) + 1) * 3, 0, Math.PI * 2); ctx.stroke();

      // Blips (Angriffe wandern nach innen)
      for (let i = blips.length - 1; i >= 0; i--) {
        const b = blips[i];
        if (!reduce) b.dist -= b.speed;
        const x = cx + Math.cos(b.ang) * b.dist;
        const y = cy + Math.sin(b.ang) * b.dist;
        // Linie zum Zentrum
        ctx.strokeStyle = b.color + "55";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke();
        // Punkt
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        if (b.dist <= 8) blips.splice(i, 1);
      }
    }
    raf = requestAnimationFrame(draw);

    let id = 0;
    const spawn = setInterval(() => {
      const type = pick(TYPES);
      const country = pick(COUNTRIES);
      blips.push({ ang: Math.random() * Math.PI * 2, dist: R, speed: 0.6 + Math.random() * 0.9, color: type.color });
      const ev: Event = { id: id++, country, ip: randIp(), type: type.name, sev: type.sev, color: type.color, t: new Date().toLocaleTimeString("de-DE") };
      setEvents((prev) => [ev, ...prev].slice(0, 12));
      setStats((s) => ({ total: s.total + 1, blocked: s.blocked + (Math.random() > 0.08 ? 1 : 0) }));
      const key = country;
      topRef.current[key] = (topRef.current[key] || 0) + 1;
      const best = Object.entries(topRef.current).sort((a, b) => b[1] - a[1])[0];
      if (best) setTop(best[0]);
    }, 1100);

    return () => { cancelAnimationFrame(raf); clearInterval(spawn); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Live-Bedrohungsradar</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          So sieht ein <b>Security Operations Center (SOC)</b> aus: eingehende Angriffe in Echtzeit auf dem Radar,
          daneben der Live-Ereignis-Feed. <span style={{ color: "#fbbf24" }}>Demo-Visualisierung (simulierte Ereignisse zum Lernen).</span>
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Was macht ein SOC-Analyst?">
        Im SOC überwachst du solche Feeds rund um die Uhr, erkennst Muster (z. B. viele Brute-Force-Versuche aus einem Land),
        priorisierst nach Schweregrad und reagierst auf echte Vorfälle. Genau dafür trainieren die Tabs „Log-Analyse",
        „Playbooks" und „ATT&CK".
      </LearnNote></div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Radar */}
        <div className="lg:col-span-3 rounded-2xl p-4" style={{ background: "rgba(7,1,15,0.6)", border: "1px solid rgba(0,240,255,0.2)" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: 360, display: "block" }} />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="rounded-lg py-2" style={{ background: "rgba(0,240,255,0.06)" }}>
              <div className="text-xl font-bold" style={{ color: "#00f0ff" }}>{stats.total}</div>
              <div className="text-[11px]" style={{ color: "#64748b" }}>Angriffe erkannt</div>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(0,255,163,0.06)" }}>
              <div className="text-xl font-bold" style={{ color: "#00ffa3" }}>{stats.blocked}</div>
              <div className="text-[11px]" style={{ color: "#64748b" }}>blockiert</div>
            </div>
            <div className="rounded-lg py-2" style={{ background: "rgba(255,43,214,0.06)" }}>
              <div className="text-[15px] font-bold truncate px-1" style={{ color: "#ff2bd6" }}>{top}</div>
              <div className="text-[11px]" style={{ color: "#64748b" }}>Top-Quelle</div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.15)" }}>
          <div className="text-[12px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>Live-Feed</div>
          <div className="space-y-1.5">
            {events.length === 0 && <div className="text-[13px]" style={{ color: "#475569" }}>Warte auf Ereignisse…</div>}
            {events.map((e) => (
              <div key={e.id} className="rounded-lg px-3 py-2 animate-fade-in" style={{ background: "rgba(7,1,15,0.6)", border: `1px solid ${e.color}44` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold" style={{ color: e.color }}>{e.type}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: `${e.color}22`, color: e.color }}>{e.sev}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[12px]" style={{ color: "#cbd5e1" }}>{e.country}</span>
                  <span className="text-[11px] font-mono" style={{ color: "#64748b" }}>{e.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
