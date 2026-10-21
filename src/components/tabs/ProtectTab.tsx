"use client";
import { useState, useEffect } from "react";
import { CommandRow } from "@/components/ui/CopyBtn";

type OS = "windows" | "linux" | "mac";

const SECTIONS: Record<OS, { title: string; items: { title: string; desc: string; cmds: { cmd: string; note?: string }[] }[] }> = {
  windows: {
    title: "Windows",
    items: [
      {
        title: "Virenscan mit Microsoft Defender",
        desc: "Defender ist in Windows eingebaut. In PowerShell als Administrator ausführen.",
        cmds: [
          { cmd: "Update-MpSignature", note: "Virendefinitionen aktualisieren" },
          { cmd: "Start-MpScan -ScanType QuickScan", note: "Schnellscan der wichtigsten Orte" },
          { cmd: "Start-MpScan -ScanType FullScan", note: "Vollständiger Scan (dauert länger)" },
          { cmd: "Get-MpThreatDetection", note: "Gefundene Bedrohungen anzeigen" },
        ],
      },
      {
        title: "System aktuell halten",
        desc: "Updates schließen Sicherheitslücken – der wichtigste Schutz überhaupt.",
        cmds: [
          { cmd: "winget upgrade --all", note: "Alle installierten Programme aktualisieren" },
          { cmd: "Get-WindowsUpdate", note: "benötigt Modul PSWindowsUpdate; zeigt offene Windows-Updates" },
        ],
      },
      {
        title: "Firewall prüfen",
        desc: "Die Firewall sollte für alle Profile aktiv sein.",
        cmds: [
          { cmd: "Get-NetFirewallProfile | Select Name,Enabled", note: "Status anzeigen" },
          { cmd: "Set-NetFirewallProfile -All -Enabled True", note: "Firewall überall einschalten" },
        ],
      },
    ],
  },
  linux: {
    title: "Linux (Ubuntu/Debian)",
    items: [
      {
        title: "Virenscan mit ClamAV",
        desc: "Kostenloser Open-Source-Scanner. Einmal installieren, dann scannen.",
        cmds: [
          { cmd: "sudo apt install -y clamav clamav-daemon", note: "Scanner installieren" },
          { cmd: "sudo freshclam", note: "Virendefinitionen aktualisieren" },
          { cmd: "clamscan -r --bell -i /home", note: "Home-Ordner scannen, nur Treffer zeigen" },
          { cmd: "sudo clamscan -r -i /", note: "Gesamtes System scannen (dauert lange)" },
        ],
      },
      {
        title: "System aktuell halten",
        desc: "Regelmäßig aktualisieren schließt die meisten Lücken.",
        cmds: [
          { cmd: "sudo apt update && sudo apt upgrade -y", note: "Paketlisten und Programme aktualisieren" },
          { cmd: "sudo apt autoremove -y", note: "Nicht mehr benötigte Pakete entfernen" },
        ],
      },
      {
        title: "Firewall (UFW) einrichten",
        desc: "UFW ist eine einfache Firewall für Ubuntu.",
        cmds: [
          { cmd: "sudo apt install -y ufw", note: "installieren" },
          { cmd: "sudo ufw default deny incoming && sudo ufw default allow outgoing", note: "sichere Grundregel" },
          { cmd: "sudo ufw enable", note: "Firewall einschalten" },
          { cmd: "sudo ufw status verbose", note: "Status prüfen" },
        ],
      },
      {
        title: "Rootkits suchen",
        desc: "rkhunter sucht nach versteckter Schadsoftware.",
        cmds: [
          { cmd: "sudo apt install -y rkhunter", note: "installieren" },
          { cmd: "sudo rkhunter --update && sudo rkhunter --check --sk", note: "prüfen" },
        ],
      },
    ],
  },
  mac: {
    title: "macOS",
    items: [
      {
        title: "Virenscan mit ClamAV",
        desc: "Über Homebrew installieren.",
        cmds: [
          { cmd: "brew install clamav", note: "Scanner installieren" },
          { cmd: "freshclam", note: "Definitionen aktualisieren" },
          { cmd: "clamscan -r -i ~", note: "Benutzerordner scannen" },
        ],
      },
      {
        title: "System aktuell halten",
        desc: "Apple liefert Sicherheitsupdates über die Softwareaktualisierung.",
        cmds: [
          { cmd: "softwareupdate -l", note: "verfügbare Updates auflisten" },
          { cmd: "sudo softwareupdate -ia", note: "alle Updates installieren" },
        ],
      },
      {
        title: "Firewall einschalten",
        desc: "macOS hat eine eingebaute Firewall.",
        cmds: [
          { cmd: "sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on", note: "Firewall aktivieren" },
        ],
      },
    ],
  },
};

function detectOS(): OS {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "mac";
  return "linux";
}

export function ProtectTab() {
  const [os, setOs] = useState<OS>("linux");
  useEffect(() => { setOs(detectOS()); }, []);
  const section = SECTIONS[os];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gradient-green">PC-Schutz-Assistent</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Echte Schutz-Befehle zum selbst Ausführen. Eine Website kann deinen PC nicht
          scannen – aber sie kann dir genau zeigen, was du im Terminal eingibst.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(Object.keys(SECTIONS) as OS[]).map((key) => (
          <button key={key} onClick={() => setOs(key)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-bold uppercase tracking-wider cursor-pointer"
            style={os === key
              ? { color: "#00f0ff", background: "rgba(10,26,46,0.4)", border: "1px solid rgba(0,240,255,0.4)" }
              : { color: "#64748b", background: "rgba(30,41,59,0.4)", border: "1px solid rgba(51,65,85,0.5)" }}>
            {SECTIONS[key].title}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {section.items.map((item) => (
          <div key={item.title} className="rounded-xl p-5"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <h3 className="text-[16px] font-bold" style={{ color: "#e2e8f0" }}>{item.title}</h3>
            <p className="text-[14px] mt-1 mb-3" style={{ color: "#64748b" }}>{item.desc}</p>
            <div className="space-y-2">
              {item.cmds.map((c) => <CommandRow key={c.cmd} cmd={c.cmd} note={c.note} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl p-4 text-[14px]"
           style={{ background: "rgba(120,53,15,0.2)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
        ⚠️ Lade Antiviren-Programme nur von den offiziellen Herstellerseiten. Angebliche
        „Online-Virenscanner im Browser“ sind meist selbst Schadsoftware.
      </div>
    </div>
  );
}
