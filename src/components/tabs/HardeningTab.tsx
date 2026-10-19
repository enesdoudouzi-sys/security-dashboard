"use client";
import { useState, useEffect } from "react";
import { CopyBtn } from "@/components/ui/CopyBtn";

interface Check { id: string; text: string; cmd?: string; }
interface Group { title: string; checks: Check[]; }

const GROUPS: Record<"linux" | "windows", Group[]> = {
  linux: [
    {
      title: "Grundlagen",
      checks: [
        { id: "l-upd", text: "System aktuell halten", cmd: "sudo apt update && sudo apt upgrade -y" },
        { id: "l-auto", text: "Automatische Sicherheitsupdates aktivieren", cmd: "sudo apt install -y unattended-upgrades && sudo dpkg-reconfigure --priority=low unattended-upgrades" },
        { id: "l-ufw", text: "Firewall (UFW) aktiv, eingehend standardmäßig verweigern", cmd: "sudo ufw default deny incoming && sudo ufw enable" },
      ],
    },
    {
      title: "Zugänge absichern",
      checks: [
        { id: "l-pw", text: "Starke, einzigartige Passwörter + Passwort-Manager nutzen" },
        { id: "l-ssh-key", text: "SSH nur mit Schlüssel, Passwort-Login aus", cmd: "sudo sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl restart ssh" },
        { id: "l-root", text: "Direkten Root-Login per SSH deaktivieren", cmd: "sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo systemctl restart ssh" },
        { id: "l-fail2ban", text: "fail2ban gegen Brute-Force installieren", cmd: "sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban" },
      ],
    },
    {
      title: "Härtung & Überwachung",
      checks: [
        { id: "l-ports", text: "Offene Ports prüfen und unnötige Dienste abschalten", cmd: "sudo ss -tulpn" },
        { id: "l-rkhunter", text: "Rootkit-Prüfung einrichten", cmd: "sudo apt install -y rkhunter && sudo rkhunter --check --sk" },
        { id: "l-backup", text: "Regelmäßige Backups (z. B. Timeshift) eingerichtet" },
        { id: "l-disk", text: "Festplattenverschlüsselung aktiv (LUKS)" },
      ],
    },
  ],
  windows: [
    {
      title: "Grundlagen",
      checks: [
        { id: "w-upd", text: "Windows-Update: automatische Updates an" },
        { id: "w-def", text: "Microsoft Defender aktiv + Echtzeitschutz an" },
        { id: "w-fw", text: "Firewall für alle Profile aktiv", cmd: "Set-NetFirewallProfile -All -Enabled True" },
        { id: "w-bit", text: "Laufwerksverschlüsselung BitLocker aktiv" },
      ],
    },
    {
      title: "Konten & Zugänge",
      checks: [
        { id: "w-std", text: "Täglich mit Standardkonto arbeiten, nicht als Administrator" },
        { id: "w-uac", text: "Benutzerkontensteuerung (UAC) auf höchster Stufe" },
        { id: "w-pw", text: "Starke Passwörter + Passwort-Manager + 2FA bei Online-Konten" },
        { id: "w-bl", text: "BitLocker-Wiederherstellungsschlüssel sicher aufbewahrt" },
      ],
    },
    {
      title: "Härtung",
      checks: [
        { id: "w-apps", text: "Nicht benötigte Programme deinstallieren" },
        { id: "w-smb", text: "Altes SMBv1 deaktivieren", cmd: "Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol" },
        { id: "w-rdp", text: "Remotedesktop aus, wenn nicht gebraucht" },
        { id: "w-backup", text: "Regelmäßige Backups (Dateiversionsverlauf/extern)" },
      ],
    },
  ],
};

const STORE_KEY = "hardening-done";

export function HardeningTab() {
  const [osSel, setOsSel] = useState<"linux" | "windows">("linux");
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); } catch { /* ignore */ }
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const groups = GROUPS[osSel];
  const all = groups.flatMap((g) => g.checks);
  const doneCount = all.filter((c) => done[c.id]).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gradient-green">System-Härtung</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Schritt-für-Schritt-Checkliste, um deinen Rechner abzusichern. Dein Fortschritt
          wird lokal in diesem Browser gespeichert.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {(["linux", "windows"] as const).map((key) => (
            <button key={key} onClick={() => setOsSel(key)}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-bold uppercase tracking-wider cursor-pointer"
              style={osSel === key
                ? { color: "#34d399", background: "rgba(6,78,59,0.4)", border: "1px solid rgba(16,185,129,0.4)" }
                : { color: "#64748b", background: "rgba(30,41,59,0.4)", border: "1px solid rgba(51,65,85,0.5)" }}>
              {key === "linux" ? "Linux" : "Windows"}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="flex justify-between text-[13px] mb-1">
            <span style={{ color: "#64748b" }}>Abgesichert</span>
            <span style={{ color: "#34d399" }} className="font-bold">{doneCount}/{all.length} · {pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.6)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.title} className="rounded-xl p-5"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <h3 className="text-[15px] font-bold uppercase tracking-wider mb-3" style={{ color: "#94a3b8" }}>{g.title}</h3>
            <div className="space-y-2.5">
              {g.checks.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <button onClick={() => toggle(c.id)} aria-label="Erledigt"
                    className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-none cursor-pointer text-[14px] font-bold"
                    style={done[c.id]
                      ? { background: "#059669", color: "#fff", border: "1px solid #10b981" }
                      : { background: "transparent", color: "transparent", border: "1px solid #475569" }}>
                    ✓
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px]" style={{ color: done[c.id] ? "#64748b" : "#e2e8f0", textDecoration: done[c.id] ? "line-through" : "none" }}>{c.text}</span>
                    {c.cmd && (
                      <div className="mt-1.5 flex items-start gap-2">
                        <code className="flex-1 text-[13px] font-mono break-all rounded px-2 py-1" style={{ background: "#020817", color: "#67e8f9" }}>{c.cmd}</code>
                        <CopyBtn text={c.cmd} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
