"use client";
import { useState, useEffect } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Incident-Response-Playbooks als abhakbare Checklisten (Fortschritt lokal gespeichert).
// Struktur nach den NIST-IR-Phasen: Erkennen → Eindämmen → Beseitigen → Wiederherstellen → Nachbereiten.

type Playbook = { id: string; icon: string; title: string; intro: string; steps: { phase: string; items: string[] }[] };

const PLAYBOOKS: Playbook[] = [
  {
    id: "ransomware", icon: "🔒", title: "Ransomware",
    intro: "Dateien verschlüsselt, Lösegeldforderung. Ziel: Ausbreitung stoppen, sauber wiederherstellen.",
    steps: [
      { phase: "1 · Erkennen", items: [
        "Betroffene Systeme & Verschlüsselungs-Zeitpunkt feststellen",
        "Art der Ransomware bestimmen (Lösegeld-Notiz, Dateiendung) – ID Ransomware / No More Ransom",
        "Umfang prüfen: welche Hosts, Shares, Backups betroffen?",
      ]},
      { phase: "2 · Eindämmen", items: [
        "Betroffene Geräte SOFORT vom Netz trennen (LAN/WLAN), NICHT ausschalten (Speicher-Forensik)",
        "Gemeinsame Laufwerke / Shares isolieren",
        "Kompromittierte Konten sperren, Passwörter zurücksetzen",
        "Backups vom Netz nehmen, damit sie nicht mitverschlüsselt werden",
      ]},
      { phase: "3 · Beseitigen", items: [
        "Schadsoftware & Persistenz entfernen (lieber Neuaufsetzen als Säubern)",
        "Einfallstor schließen (gepatchte Lücke, Phishing-Mail, offenes RDP)",
      ]},
      { phase: "4 · Wiederherstellen", items: [
        "Aus sauberem, offline geprüftem Backup wiederherstellen",
        "KEIN Lösegeld zahlen (keine Garantie, finanziert Täter) – mit Leitung/Rechtsabteilung abstimmen",
        "Systeme überwacht wieder ins Netz nehmen",
      ]},
      { phase: "5 · Nachbereiten", items: [
        "Vorfall dokumentieren, ggf. Meldepflicht prüfen (Behörde/Datenschutz)",
        "Lessons Learned: Backups, Patching, Segmentierung verbessern",
      ]},
    ],
  },
  {
    id: "phishing", icon: "🎣", title: "Phishing (gemeldete Mail / Klick)",
    intro: "Verdächtige Mail erhalten oder ein Nutzer hat geklickt. Ziel: Schaden begrenzen, andere warnen.",
    steps: [
      { phase: "1 · Erkennen", items: [
        "Header analysieren (SPF/DKIM/DMARC – siehe Phishing-Tab)",
        "Links/Anhänge in sicherer Umgebung prüfen (nicht am Produktivrechner öffnen)",
        "Hat jemand geklickt / Zugangsdaten eingegeben? Betroffene ermitteln",
      ]},
      { phase: "2 · Eindämmen", items: [
        "Bei eingegebenen Zugangsdaten: Passwort sofort zurücksetzen, Sessions beenden, MFA erzwingen",
        "Mail aus allen Postfächern entfernen/quarantänen (Mail-Admin)",
        "Absender/Domain & schädliche URLs blocken",
      ]},
      { phase: "3 · Beseitigen", items: [
        "Bei Anhang-Ausführung: Gerät auf Malware prüfen, ggf. isolieren",
        "Weitergeleitete Mails / angelegte Postfachregeln prüfen (Angreifer legt oft Weiterleitungen an)",
      ]},
      { phase: "4 · Wiederherstellen", items: [
        "Konten nach Prüfung wieder freigeben",
        "Normalbetrieb überwacht aufnehmen",
      ]},
      { phase: "5 · Nachbereiten", items: [
        "Alle Mitarbeitenden warnen (gleiche Welle trifft meist mehrere)",
        "Awareness-Schulung / Simulierte Phishing-Übung einplanen",
      ]},
    ],
  },
  {
    id: "databreach", icon: "🗄️", title: "Datenleck / Datenabfluss",
    intro: "Vertrauliche Daten könnten abgeflossen sein. Ziel: stoppen, Umfang klären, Meldepflichten einhalten.",
    steps: [
      { phase: "1 · Erkennen", items: [
        "Welche Daten, welche Menge, welcher Zeitraum? (Logs, DLP-Alarme)",
        "Abflussweg bestimmen (C2-Upload, Mail, USB, Cloud)",
        "Personenbezogene Daten betroffen? (wichtig für DSGVO)",
      ]},
      { phase: "2 · Eindämmen", items: [
        "Abfluss stoppen: betroffene Zugänge sperren, Verbindung/Host isolieren",
        "Ausgehende Verbindung zum Ziel (IP/Domain) blocken",
      ]},
      { phase: "3 · Beseitigen", items: [
        "Ursache beheben (Lücke, gestohlene Zugangsdaten, Fehlkonfiguration)",
        "Weitere betroffene Systeme suchen",
      ]},
      { phase: "4 · Wiederherstellen", items: [
        "Betroffene Zugänge/Schlüssel rotieren",
        "Monitoring für erneuten Abfluss verschärfen",
      ]},
      { phase: "5 · Nachbereiten", items: [
        "DSGVO: Meldepflicht an Aufsichtsbehörde binnen 72 h prüfen; ggf. Betroffene informieren",
        "Vorfall & Entscheidungen lückenlos dokumentieren",
      ]},
    ],
  },
  {
    id: "account", icon: "👤", title: "Kompromittiertes Konto",
    intro: "Ein Benutzer- oder Admin-Konto wurde übernommen. Ziel: Zugriff entziehen, Folgeschäden finden.",
    steps: [
      { phase: "1 · Erkennen", items: [
        "Verdächtige Logins prüfen (fremdes Land, ungewöhnliche Zeit, unmögliche Reise)",
        "Was hat das Konto getan? (Mails, Dateizugriffe, neue Regeln)",
      ]},
      { phase: "2 · Eindämmen", items: [
        "Passwort zurücksetzen, ALLE aktiven Sessions beenden (Token widerrufen)",
        "MFA erzwingen / zurücksetzen",
        "Bei Admin-Konto: zusätzlich nach neu angelegten Konten/Rechten suchen",
      ]},
      { phase: "3 · Beseitigen", items: [
        "Vom Angreifer angelegte Weiterleitungen/Regeln/App-Passwörter entfernen",
        "Prüfen, ob von hier aus weitere Konten/Systeme erreicht wurden (Lateral Movement)",
      ]},
      { phase: "4 · Wiederherstellen", items: [
        "Konto nach Prüfung wieder freigeben",
      ]},
      { phase: "5 · Nachbereiten", items: [
        "MFA überall verpflichtend? Login-Monitoring verbessern",
      ]},
    ],
  },
];

export function PlaybooksTab() {
  const [active, setActive] = useState(PLAYBOOKS[0].id);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { const s = localStorage.getItem("ir-playbooks"); if (s) setDone(JSON.parse(s)); } catch {}
  }, []);
  function toggle(key: string) {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("ir-playbooks", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const pb = PLAYBOOKS.find((p) => p.id === active)!;
  const allItems = pb.steps.flatMap((s, si) => s.items.map((_, ii) => `${pb.id}-${si}-${ii}`));
  const doneCount = allItems.filter((k) => done[k]).length;
  const pct = Math.round((doneCount / allItems.length) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gradient-green">Incident-Response-Playbooks</h2>
        <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
          Schritt-für-Schritt-Checklisten für den Ernstfall, nach den NIST-Phasen. Fortschritt wird lokal gespeichert.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Im Job passiert Incident Response unter Stress – da hilft eine <b>vorbereitete Checkliste</b>, nichts zu vergessen.
        Die Phasen <b>Erkennen → Eindämmen → Beseitigen → Wiederherstellen → Nachbereiten</b> sind Standard (NIST SP 800-61)
        und gehören zum Grundwissen für SOC- und IR-Rollen.
      </LearnNote></div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PLAYBOOKS.map((p) => (
          <button key={p.id} onClick={() => setActive(p.id)}
            className="px-3.5 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            style={active === p.id
              ? { background: "rgba(16,185,129,0.18)", border: "1px solid rgba(52,211,153,0.5)", color: "#34d399" }
              : { background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>
            <span>{p.icon}</span>{p.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-bold" style={{ color: "#e2e8f0" }}>{pb.icon} {pb.title}</span>
          <span className="text-[11px] font-bold" style={{ color: pct === 100 ? "#34d399" : "#94a3b8" }}>{doneCount}/{allItems.length} · {pct}%</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: "#64748b" }}>{pb.intro}</p>
        <div className="w-full rounded-full h-1.5" style={{ background: "rgba(30,41,59,0.8)" }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
        </div>
      </div>

      <div className="space-y-4">
        {pb.steps.map((s, si) => (
          <div key={si}>
            <div className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{s.phase}</div>
            <div className="space-y-1.5">
              {s.items.map((item, ii) => {
                const key = `${pb.id}-${si}-${ii}`;
                const checked = !!done[key];
                return (
                  <button key={ii} onClick={() => toggle(key)}
                    className="w-full flex items-start gap-3 text-left rounded-lg px-3.5 py-2.5 cursor-pointer transition-all"
                    style={{ background: checked ? "rgba(6,78,59,0.25)" : "rgba(15,23,42,0.5)", border: `1px solid ${checked ? "rgba(16,185,129,0.3)" : "rgba(30,41,59,0.6)"}` }}>
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                          style={{ background: checked ? "#10b981" : "transparent", border: `1px solid ${checked ? "#10b981" : "#475569"}`, color: "#020817" }}>
                      {checked ? "✓" : ""}
                    </span>
                    <span className="text-[12.5px]" style={{ color: checked ? "#64748b" : "#cbd5e1", textDecoration: checked ? "line-through" : "none" }}>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl p-3 text-[11px]"
           style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
        ⚠️ Übungs-/Lernmaterial. Im echten Ernstfall immer dem offiziellen Notfallplan deiner Organisation folgen und früh die Verantwortlichen einbinden.
      </div>
    </div>
  );
}
