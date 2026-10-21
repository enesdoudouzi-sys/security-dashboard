"use client";

// Projekt-/Portfolio-Seite – zeigt, was das Dashboard ist und was dahintersteckt.
// Gut zum Herzeigen (Freunde, Bewerbung).

const FEATURES = [
  { icon: "🎯", title: "MITRE ATT&CK Matrix", desc: "Interaktive Angreifer-Taktiken & -Techniken" },
  { icon: "📑", title: "Log-Analyse", desc: "IOC-Extraktion & Brute-Force-Erkennung" },
  { icon: "🎣", title: "Phishing-Analyse", desc: "SPF/DKIM/DMARC-Prüfung aus E-Mail-Headern" },
  { icon: "🔎", title: "CVE-Live-Suche", desc: "Echte Schwachstellen aus der NVD-Datenbank" },
  { icon: "🔄", title: "Encoder/Decoder", desc: "Base64, URL, Hex, ROT13 & JWT" },
  { icon: "🔑", title: "Passwort-Generator", desc: "Sichere Passwörter mit Entropie-Anzeige" },
  { icon: "📋", title: "IR-Playbooks", desc: "Notfall-Checklisten nach NIST" },
  { icon: "🧭", title: "Lern-Roadmap", desc: "Weg zum ersten Security-Job" },
];

const STACK = ["Next.js 16", "React", "TypeScript", "Tailwind CSS", "FastAPI", "python-nmap", "Docker", "GitHub Pages", "Render"];
const SKILLS = ["Frontend-Entwicklung", "Security-Grundlagen", "Blue-Team-Werkzeuge", "DevSecOps", "CI/CD & Deployment", "Clean Code"];

export function AboutTab() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl p-8 mb-6 text-center relative overflow-hidden"
           style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: "1px solid rgba(0,240,255,0.3)" }}>
        <div className="text-5xl mb-3">🛡️</div>
        <h1 className="text-3xl font-bold text-gradient-green mb-2">CyberShield SOC Dashboard</h1>
        <p className="text-[15px] max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
          Eine selbst entwickelte Security-Operations-Plattform mit 20+ Werkzeugen für
          Schwachstellen-Analyse, Threat Intelligence und Incident Response – plus Lern-Inhalte für den Einstieg in die IT-Sicherheit.
        </p>
        <div className="flex gap-3 justify-center mt-5 flex-wrap">
          <a href="https://enesdoudouzi-sys.github.io/security-dashboard/" target="_blank" rel="noreferrer"
             className="px-4 py-2 rounded-xl text-[13px] font-bold"
             style={{ background: "linear-gradient(135deg,#0e3a4d,#00b8d4)", color: "#fff" }}>🌐 Live-Dashboard</a>
          <a href="https://github.com/enesdoudouzi-sys/security-dashboard" target="_blank" rel="noreferrer"
             className="px-4 py-2 rounded-xl text-[13px] font-bold"
             style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(51,65,85,0.8)", color: "#e2e8f0" }}>💻 Quellcode (GitHub)</a>
        </div>
      </div>

      {/* Features */}
      <h2 className="text-xl font-bold mb-3" style={{ color: "#e2e8f0" }}>Was das Dashboard kann</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl p-4 flex items-start gap-3"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <span className="text-2xl">{f.icon}</span>
            <div>
              <div className="text-[14px] font-bold" style={{ color: "#e2e8f0" }}>{f.title}</div>
              <div className="text-[12px]" style={{ color: "#64748b" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tech-Stack */}
      <h2 className="text-xl font-bold mb-3" style={{ color: "#e2e8f0" }}>Eingesetzte Technologien</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {STACK.map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.25)", color: "#00f0ff" }}>{t}</span>
        ))}
      </div>

      {/* Skills */}
      <h2 className="text-xl font-bold mb-3" style={{ color: "#e2e8f0" }}>Gezeigte Fähigkeiten</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {SKILLS.map((s) => (
          <span key={s} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                style={{ background: "rgba(8,145,178,0.1)", border: "1px solid rgba(8,145,178,0.25)", color: "#67e8f9" }}>✓ {s}</span>
        ))}
      </div>

      <div className="rounded-xl p-4 text-[12px]"
           style={{ background: "rgba(127,29,29,0.15)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
        ⚖️ Alle Scan-Werkzeuge sind für <b>legales Üben</b> gedacht – nur gegen <b>scanme.nmap.org</b> oder eigene Systeme.
        Fremde Systeme ohne Erlaubnis zu scannen ist strafbar (§ 202 StGB).
      </div>

      <p className="text-center text-[12px] mt-6" style={{ color: "#475569" }}>
        Entwickelt von Enes Doudouzi · als Lern- und Portfolio-Projekt
      </p>
    </div>
  );
}
