import type { Vulnerability } from "@/types";

const SEV_DE: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const STATUS_DE: Record<string, string> = {
  open: "Offen",
  investigating: "In Bearbeitung",
  patched: "Gepatcht",
};

export function exportCSV(vulns: Vulnerability[], filename = "cve-report.csv") {
  const header = ["CVE-ID", "Name", "Schweregrad", "CVSS", "Host", "Dienst", "Port", "Status", "Entdeckt"];
  const rows = vulns.map((v) => [
    v.id,
    `"${v.name.replace(/"/g, '""')}"`,
    SEV_DE[v.severity] ?? v.severity,
    v.cvss.toFixed(1),
    v.host,
    v.service,
    v.port ?? "",
    STATUS_DE[v.status] ?? v.status,
    v.discovered,
  ]);

  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(vulns: Vulnerability[]) {
  const now = new Date().toLocaleString("de-DE");
  const critical = vulns.filter((v) => v.severity === "critical").length;
  const open = vulns.filter((v) => v.status === "open").length;
  const patched = vulns.filter((v) => v.status === "patched").length;

  const rows = vulns
    .map((v) => {
      const sevColor =
        v.severity === "critical" ? "#dc2626" :
        v.severity === "high"     ? "#ea580c" :
        v.severity === "medium"   ? "#ca8a04" : "#2563eb";
      const stColor =
        v.status === "open"          ? "#dc2626" :
        v.status === "investigating" ? "#ca8a04" : "#16a34a";
      return `
        <tr>
          <td style="color:#dc2626;font-weight:700;font-family:monospace">${v.id}</td>
          <td>${v.name}</td>
          <td style="color:${sevColor};font-weight:700;text-align:center">${SEV_DE[v.severity] ?? v.severity}</td>
          <td style="font-weight:700;text-align:center;color:${v.cvss >= 9 ? "#dc2626" : v.cvss >= 7 ? "#ea580c" : "#ca8a04"}">${v.cvss.toFixed(1)}</td>
          <td style="font-family:monospace">${v.host}</td>
          <td>${v.service}${v.port ? `:${v.port}` : ""}</td>
          <td style="color:${stColor};font-weight:600;text-align:center">${STATUS_DE[v.status] ?? v.status}</td>
          <td style="color:#555">${v.discovered}</td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>CyberShield — CVE Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #10b981; }
    .title { font-size: 22px; font-weight: 800; color: #064e3b; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
    .meta { text-align: right; font-size: 10px; color: #888; }
    .kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { padding: 12px 16px; border-radius: 8px; }
    .kpi.red    { background: #fef2f2; border-left: 4px solid #dc2626; }
    .kpi.yellow { background: #fefce8; border-left: 4px solid #ca8a04; }
    .kpi.green  { background: #f0fdf4; border-left: 4px solid #16a34a; }
    .kpi.blue   { background: #eff6ff; border-left: 4px solid #2563eb; }
    .kpi-num { font-size: 26px; font-weight: 800; }
    .kpi-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #064e3b; color: #fff; }
    thead th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f0fdf4; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #aaa; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">🛡️ CyberShield SOC — CVE Report</div>
      <div class="subtitle">${vulns.length} Schwachstellen · Erstellt am ${now}</div>
    </div>
    <div class="meta">
      <div>Vertraulich</div>
      <div>Nur für internen Gebrauch</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi red">   <div class="kpi-num" style="color:#dc2626">${critical}</div><div class="kpi-lbl">Kritisch</div></div>
    <div class="kpi yellow"><div class="kpi-num" style="color:#ca8a04">${open}</div><div class="kpi-lbl">Offen</div></div>
    <div class="kpi green"> <div class="kpi-num" style="color:#16a34a">${patched}</div><div class="kpi-lbl">Gepatcht</div></div>
    <div class="kpi blue">  <div class="kpi-num" style="color:#2563eb">${vulns.length - open - patched}</div><div class="kpi-lbl">In Bearbeitung</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>CVE-ID</th><th>Name</th><th>Schweregrad</th><th>CVSS</th>
        <th>Host</th><th>Dienst</th><th>Status</th><th>Entdeckt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>CyberShield SOC Dashboard v2.0</span>
    <span>Erstellt: ${now}</span>
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
