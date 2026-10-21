"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Security-Prozess-Check: geführter Fragebogen → Reifegrad-Score → Optimierungs-Empfehlungen.
// Ideal als Einstiegs-Beratungswerkzeug für KMU. Rein im Browser.

type Question = {
  area: string;
  q: string;
  options: string[];        // index 0 = schlecht … höchster = gut
  tip: string;              // Empfehlung, wenn nicht optimal beantwortet
};

// Jede Antwort gibt Punkte = ihr Index (0 = schlecht … letzter Index = beste Antwort).
const QUESTIONS: Question[] = [
  { area: "Updates & Patches", q: "Werden Betriebssysteme und Programme aktuell gehalten?",
    options: ["Selten oder nie", "Gelegentlich manuell", "Automatisch / zeitnah"],
    tip: "Automatische Updates aktivieren und monatlich prüfen – veraltete Software ist Einfallstor Nr. 1." },
  { area: "Backups", q: "Gibt es regelmäßige, getestete Datensicherungen?",
    options: ["Keine Backups", "Backups, aber ungetestet", "Automatisch & regelmäßig getestet"],
    tip: "3-2-1-Regel: 3 Kopien, 2 Medien, 1 extern/offline – und Rücksicherung testen (sonst wertlos)." },
  { area: "Passwörter", q: "Werden starke, einzigartige Passwörter genutzt?",
    options: ["Mehrfach/einfach", "Teilweise", "Passwort-Manager + einzigartig"],
    tip: "Passwort-Manager einführen, für jeden Dienst ein eigenes langes Passwort (siehe Passwort-Tab)." },
  { area: "Zwei-Faktor (MFA)", q: "Ist Zwei-Faktor-Authentifizierung aktiv?",
    options: ["Nein", "Nur für einzelne Konten", "Für alle wichtigen Konten"],
    tip: "MFA überall aktivieren, wo möglich – stoppt die meisten Konto-Übernahmen." },
  { area: "Awareness", q: "Werden Mitarbeitende zu Phishing & Sicherheit geschult?",
    options: ["Nie", "Einmalig", "Regelmäßig / mit Übungen"],
    tip: "Kurze, regelmäßige Phishing-Schulungen – der Mensch ist das häufigste Ziel." },
  { area: "Zugriffsrechte", q: "Hat jeder nur die wirklich nötigen Rechte?",
    options: ["Alle haben Admin", "Teilweise geregelt", "Least Privilege umgesetzt"],
    tip: "Rechte nach Bedarf vergeben (Least Privilege) – begrenzt den Schaden bei einem Vorfall." },
  { area: "Netzwerk & Fernzugriff", q: "Firewall aktiv und Fernzugriffe (RDP/VPN) abgesichert?",
    options: ["Nein / unklar", "Teilweise", "Firewall + VPN/MFA"],
    tip: "RDP nie offen ins Internet – VPN davor, Firewall-Regeln prüfen." },
  { area: "Endpunktschutz", q: "Aktueller Viren-/Endpunktschutz auf allen Geräten?",
    options: ["Nein", "Nur teilweise", "Überall & aktuell"],
    tip: "Auf allen Geräten aktuellen Schutz (z. B. Defender/EDR) sicherstellen." },
  { area: "Notfallplan", q: "Gibt es einen Notfall-/Incident-Response-Plan?",
    options: ["Nein", "Grob im Kopf", "Dokumentiert & geübt"],
    tip: "Einfachen IR-Plan dokumentieren (wer macht was bei einem Vorfall?) – siehe Playbooks-Tab." },
  { area: "Daten & DSGVO", q: "Sind sensible Daten geschützt und DSGVO-Prozesse vorhanden?",
    options: ["Nein", "Teilweise", "Verschlüsselt & geregelt"],
    tip: "Sensible Daten verschlüsseln, Löschfristen & Auftragsverarbeitung (AVV) klären." },
];

const MAX = QUESTIONS.length * 2;

export function SecurityCheckTab() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answeredCount = Object.keys(answers).length;
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const pct = Math.round((score / MAX) * 100);
  const allDone = answeredCount === QUESTIONS.length;

  const level = pct >= 75 ? { label: "GUT AUFGESTELLT", color: "#34d399" }
    : pct >= 45 ? { label: "AUSBAUFÄHIG", color: "#fbbf24" }
    : { label: "HANDLUNGSBEDARF", color: "#f87171" };

  // Empfehlungen: alle nicht-optimal beantworteten Fragen, schlechteste zuerst.
  const recs = QUESTIONS
    .map((q, i) => ({ q, a: answers[i] }))
    .filter((x) => x.a !== undefined && x.a < 2)
    .sort((x, y) => (x.a ?? 0) - (y.a ?? 0));

  function reset() { setAnswers({}); }

  function printReport() {
    const date = new Date().toLocaleDateString("de-DE");
    const rows = QUESTIONS.map((q, i) => {
      const a = answers[i];
      const txt = a === undefined ? "—" : q.options[a];
      const col = a === 2 ? "#15803d" : a === 1 ? "#b45309" : a === 0 ? "#b91c1c" : "#64748b";
      return `<tr><td>${q.area}</td><td style="color:${col};font-weight:600">${txt}</td></tr>`;
    }).join("");
    const recList = recs.map((r) =>
      `<li><b>${r.a === 0 ? "Dringend" : "Verbessern"} – ${r.q.area}:</b> ${r.q.tip}</li>`).join("");
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Security-Check Report</title>
<style>
  @page { margin: 20mm; }
  body { font-family: Arial, Helvetica, sans-serif; color:#1e293b; line-height:1.5; }
  h1 { color:#059669; margin:0 0 4px; }
  .sub { color:#64748b; font-size:13px; margin-bottom:18px; }
  .score { display:flex; align-items:center; gap:16px; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:18px; }
  .num { font-size:42px; font-weight:bold; color:${level.color}; }
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-weight:bold; font-size:13px; color:#fff; background:${level.color}; }
  table { width:100%; border-collapse:collapse; margin-bottom:18px; font-size:13px; }
  td { border-bottom:1px solid #eee; padding:7px 4px; }
  td:first-child { color:#475569; width:45%; }
  h2 { font-size:15px; margin:14px 0 6px; }
  li { margin-bottom:6px; font-size:13px; }
  .foot { margin-top:24px; font-size:11px; color:#94a3b8; border-top:1px solid #eee; padding-top:8px; }
</style></head><body>
  <h1>Security-Prozess-Check</h1>
  <div class="sub">Reifegrad-Analyse &middot; Datum: ${date}</div>
  <div class="score">
    <div class="num">${pct}<span style="font-size:18px;color:#94a3b8">/100</span></div>
    <div><div class="badge">${allDone ? level.label : "unvollständig"}</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px">${answeredCount} von ${QUESTIONS.length} Fragen beantwortet</div></div>
  </div>
  <h2>Antworten im Überblick</h2>
  <table><tbody>${rows}</tbody></table>
  <h2>Empfohlene Maßnahmen (${recs.length})</h2>
  <ul>${recList || "<li>Keine offensichtlichen Lücken – weiter so!</li>"}</ul>
  <div class="foot">Dieser Check ist eine erste Orientierung und ersetzt keine vollständige Sicherheitsprüfung.
  Erstellt mit dem CyberShield SOC Dashboard.</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Security-Prozess-Check</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Schneller Reifegrad-Check: {QUESTIONS.length} Fragen → Sicherheits-Score + konkrete Empfehlungen.
          Ideal als kostenloser Einstiegs-Check für Unternehmen. Rein im Browser, nichts wird gespeichert.
        </p>
      </div>

      <div className="mb-5"><LearnNote title="Wofür ist das gut?">
        Das ist ein echtes <b>Beratungs-Werkzeug</b>: Statt teurem Pentest zeigt ein kurzer Prozess-Check KMU
        schnell, wo sie stehen. Das Ergebnis ist der perfekte Gesprächseinstieg („diese 3 Dinge zuerst") –
        und genau so arbeiten Security-Berater &amp; Auditoren (z. B. nach IT-Grundschutz).
      </LearnNote></div>

      {/* Live-Score */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-5"
           style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: `1px solid ${level.color}44` }}>
        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 rounded-full"
               style={{ background: `conic-gradient(${level.color} ${pct * 3.6}deg, #1e293b ${pct * 3.6}deg)`, mask: "radial-gradient(circle at center, transparent 33px, black 34px)", WebkitMask: "radial-gradient(circle at center, transparent 33px, black 34px)" }} />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold" style={{ color: level.color }}>{pct}</span>
            <span className="text-[10px]" style={{ color: "#475569" }}>/ 100</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider" style={{ color: "#64748b" }}>Sicherheits-Reifegrad</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: level.color }}>{allDone ? level.label : "…"}</div>
          <div className="text-[12px] mt-1" style={{ color: "#64748b" }}>{answeredCount} / {QUESTIONS.length} Fragen beantwortet</div>
        </div>
        {answeredCount > 0 && (
          <div className="ml-auto flex flex-col gap-2 self-start">
            <button onClick={printReport}
              className="text-[11px] px-3 py-1.5 rounded-lg cursor-pointer font-bold"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>📄 Report / PDF</button>
            <button onClick={reset} className="text-[11px] px-3 py-1.5 rounded-lg cursor-pointer"
              style={{ color: "#64748b", border: "1px solid rgba(51,65,85,0.6)" }}>Zurücksetzen</button>
          </div>
        )}
      </div>

      {/* Fragen */}
      <div className="space-y-4">
        {QUESTIONS.map((q, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#34d399" }}>{q.area}</div>
            <div className="text-[14px] font-semibold mb-3" style={{ color: "#e2e8f0" }}>{i + 1}. {q.q}</div>
            <div className="flex flex-col sm:flex-row gap-2">
              {q.options.map((opt, idx) => {
                const sel = answers[i] === idx;
                const c = idx === 2 ? "#34d399" : idx === 1 ? "#fbbf24" : "#f87171";
                return (
                  <button key={idx} onClick={() => setAnswers((a) => ({ ...a, [i]: idx }))}
                    className="flex-1 px-3 py-2 rounded-lg text-[12.5px] cursor-pointer transition-all text-left"
                    style={sel
                      ? { background: `${c}22`, border: `1px solid ${c}88`, color: c }
                      : { background: "rgba(2,8,23,0.5)", border: "1px solid rgba(30,41,59,0.6)", color: "#94a3b8" }}>
                    {sel ? "● " : "○ "}{opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empfehlungen */}
      {answeredCount > 0 && (
        <div className="mt-6">
          <h3 className="text-[15px] font-bold mb-3" style={{ color: "#e2e8f0" }}>
            {recs.length ? `🎯 Empfohlene Maßnahmen (${recs.length})` : "🎉 Top – keine offensichtlichen Lücken!"}
          </h3>
          <div className="space-y-2">
            {recs.map(({ q, a }, k) => (
              <div key={k} className="rounded-lg p-3" style={{ background: a === 0 ? "rgba(127,29,29,0.18)" : "rgba(113,63,18,0.18)", border: `1px solid ${a === 0 ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}` }}>
                <div className="text-[13px] font-bold" style={{ color: a === 0 ? "#fca5a5" : "#fcd34d" }}>
                  {a === 0 ? "⚠ Dringend" : "→ Verbessern"}: {q.area}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "#cbd5e1" }}>{q.tip}</div>
              </div>
            ))}
          </div>
          {allDone && recs.length > 0 && (
            <p className="text-[12px] mt-4 p-3 rounded-lg" style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.2)", color: "#7dd3fc" }}>
              💼 <b>Als Berater:</b> Diesen Überblick mit dem Kunden besprechen, die „Dringend"-Punkte zuerst angehen –
              daraus wird ein konkreter Maßnahmenplan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
