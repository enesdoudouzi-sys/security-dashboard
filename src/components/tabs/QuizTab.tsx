"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Security-Quiz: teste dein Wissen. Rein im Browser.
type Q = { q: string; options: string[]; correct: number; explain: string };

const QUESTIONS: Q[] = [
  { q: "Welcher Port gehört standardmäßig zu HTTPS?", options: ["21", "80", "443", "3389"], correct: 2,
    explain: "443 ist HTTPS. 80 = HTTP, 21 = FTP, 3389 = RDP." },
  { q: "Was beschreibt die MITRE-ATT&CK-Taktik „Lateral Movement“?", options: ["Ins Netzwerk eindringen", "Sich im Netzwerk ausbreiten", "Daten verschlüsseln", "Spuren verwischen"], correct: 1,
    explain: "Lateral Movement = sich von System zu System ausbreiten (z. B. über RDP/SMB)." },
  { q: "Viele fehlgeschlagene Logins von einer IP deuten auf …", options: ["Phishing", "Brute Force", "SQL-Injection", "XSS"], correct: 1,
    explain: "Das ist ein klassischer Brute-Force-Angriff (ATT&CK T1110)." },
  { q: "Wofür steht CVSS?", options: ["Common Vulnerability Scoring System", "Cyber Verified Security Standard", "Central Virus Scan Service", "Critical Value Severity Scale"], correct: 0,
    explain: "CVSS = Common Vulnerability Scoring System, bewertet Schwachstellen von 0–10." },
  { q: "Welche E-Mail-Prüfung erkennt Absender-Fälschung am besten?", options: ["Rechtschreibung", "SPF/DKIM/DMARC", "Betreffzeile", "Dateigröße"], correct: 1,
    explain: "SPF/DKIM/DMARC prüfen technisch, ob der Absender echt ist." },
  { q: "Telnet (Port 23) ist unsicher, weil …", options: ["es zu langsam ist", "es alles unverschlüsselt überträgt", "es zu neu ist", "es nur Windows nutzt"], correct: 1,
    explain: "Telnet überträgt alles im Klartext – daher SSH verwenden." },
  { q: "Was tust du bei einem Ransomware-Verdacht ZUERST?", options: ["Lösegeld zahlen", "PC ausschalten", "Gerät vom Netz trennen", "Ignorieren"], correct: 2,
    explain: "Netz trennen stoppt die Ausbreitung – aber NICHT ausschalten (Forensik)." },
  { q: "Welcher Hash ist am sichersten (von diesen)?", options: ["MD5", "SHA-1", "SHA-256", "CRC32"], correct: 2,
    explain: "SHA-256 gilt als sicher. MD5 und SHA-1 sind gebrochen, CRC32 ist kein Krypto-Hash." },
  { q: "Was macht ein „Portscan“ (z. B. mit Nmap)?", options: ["Passwörter knacken", "offene Ports/Dienste finden", "Dateien löschen", "Mails senden"], correct: 1,
    explain: "Ein Portscan findet heraus, welche Ports offen sind und welche Dienste laufen." },
  { q: "Was bedeutet „Least Privilege“?", options: ["Admin für alle", "Nur die nötigsten Rechte vergeben", "Keine Passwörter", "Alles verschlüsseln"], correct: 1,
    explain: "Prinzip der minimalen Rechte: jeder bekommt nur, was er wirklich braucht." },
];

export function QuizTab() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[i];

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) setScore((s) => s + 1);
  }
  function next() {
    if (i + 1 >= QUESTIONS.length) {
      try {
        const prev = Number(localStorage.getItem("quiz-best") || "0");
        if (score > prev) localStorage.setItem("quiz-best", String(score));
      } catch {}
      setDone(true);
      return;
    }
    setI(i + 1); setPicked(null);
  }
  function restart() { setI(0); setPicked(null); setScore(0); setDone(false); }

  if (done) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    const msg = pct >= 80 ? "Stark! Du hast ein gutes Fundament. 🎉" : pct >= 50 ? "Solide – dranbleiben! 💪" : "Guter Start – wiederholen lohnt sich. 📚";
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gradient-green mb-4">Quiz beendet</h2>
        <div className="rounded-2xl p-8 mb-5" style={{ background: "linear-gradient(145deg,#061a12,#082418)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div className="text-6xl font-bold" style={{ color: pct >= 50 ? "#34d399" : "#fbbf24" }}>{score}/{QUESTIONS.length}</div>
          <div className="text-[14px] mt-2" style={{ color: "#94a3b8" }}>{pct}% richtig</div>
          <div className="text-[15px] mt-4" style={{ color: "#e2e8f0" }}>{msg}</div>
        </div>
        <button onClick={restart} className="px-6 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>↻ Nochmal</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Security-Quiz</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>Teste dein Wissen – {QUESTIONS.length} Fragen zu Ports, ATT&amp;CK, CVEs & mehr.</p>
      </div>

      <div className="mb-4"><LearnNote title="Warum Quiz?">
        Aktives Abfragen festigt Wissen viel besser als nur Lesen. Genau solche Fragen kommen auch in
        Zertifikats-Prüfungen (Security+, eJPT) und Bewerbungsgesprächen vor.
      </LearnNote></div>

      <div className="flex items-center justify-between mb-3 text-[12px]" style={{ color: "#64748b" }}>
        <span>Frage {i + 1} / {QUESTIONS.length}</span>
        <span>Punkte: <b style={{ color: "#34d399" }}>{score}</b></span>
      </div>
      <div className="w-full rounded-full h-1.5 mb-5" style={{ background: "rgba(30,41,59,0.8)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${(i / QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
      </div>

      <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="text-[16px] font-semibold mb-4" style={{ color: "#e2e8f0" }}>{q.q}</div>
        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            let bg = "rgba(2,8,23,0.6)", border = "rgba(30,41,59,0.6)", color = "#cbd5e1";
            if (picked !== null) {
              if (idx === q.correct) { bg = "rgba(6,78,59,0.4)"; border = "rgba(16,185,129,0.5)"; color = "#34d399"; }
              else if (idx === picked) { bg = "rgba(127,29,29,0.3)"; border = "rgba(239,68,68,0.5)"; color = "#fca5a5"; }
            }
            return (
              <button key={idx} onClick={() => choose(idx)} disabled={picked !== null}
                className="w-full text-left px-4 py-3 rounded-lg text-[14px] cursor-pointer transition-all disabled:cursor-default"
                style={{ background: bg, border: `1px solid ${border}`, color }}>
                {picked !== null && idx === q.correct && "✓ "}
                {picked !== null && idx === picked && idx !== q.correct && "✗ "}
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-4 text-[13px] p-3 rounded-lg" style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.25)", color: "#7dd3fc" }}>
            💡 {q.explain}
          </div>
        )}
      </div>

      {picked !== null && (
        <button onClick={next} className="px-6 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer"
          style={{ background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff" }}>
          {i + 1 >= QUESTIONS.length ? "Ergebnis anzeigen →" : "Nächste Frage →"}
        </button>
      )}
    </div>
  );
}
