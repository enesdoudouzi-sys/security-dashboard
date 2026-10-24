"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MatrixRain } from "@/components/layout/MatrixRain";
import { CursorGlow } from "@/components/layout/CursorGlow";
import { BootSequence } from "@/components/layout/BootSequence";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { VulnerabilitiesTab } from "@/components/tabs/VulnerabilitiesTab";
import { ThreatsTab } from "@/components/tabs/ThreatsTab";
import { NetworkTab } from "@/components/tabs/NetworkTab";
import { ScansTab } from "@/components/tabs/ScansTab";
import { ProtectTab } from "@/components/tabs/ProtectTab";
import { HardeningTab } from "@/components/tabs/HardeningTab";
import { ToolsTab } from "@/components/tabs/ToolsTab";
import { JournalTab } from "@/components/tabs/JournalTab";
import { VulnScanTab } from "@/components/tabs/VulnScanTab";
import { CommandsTab } from "@/components/tabs/CommandsTab";
import { AttackTab } from "@/components/tabs/AttackTab";
import { LogAnalyzerTab } from "@/components/tabs/LogAnalyzerTab";
import { PhishingTab } from "@/components/tabs/PhishingTab";
import { CveSearchTab } from "@/components/tabs/CveSearchTab";
import { EncoderTab } from "@/components/tabs/EncoderTab";
import { PlaybooksTab } from "@/components/tabs/PlaybooksTab";
import { RoadmapTab } from "@/components/tabs/RoadmapTab";
import { PasswordTab } from "@/components/tabs/PasswordTab";
import { SecurityStatusTab } from "@/components/tabs/SecurityStatusTab";
import { AboutTab } from "@/components/tabs/AboutTab";
import { QuizTab } from "@/components/tabs/QuizTab";
import { NetToolsTab } from "@/components/tabs/NetToolsTab";
import { SecurityCheckTab } from "@/components/tabs/SecurityCheckTab";
import { ProgressTab } from "@/components/tabs/ProgressTab";
import { ChallengesTab } from "@/components/tabs/ChallengesTab";
import { BreachCheckTab } from "@/components/tabs/BreachCheckTab";
import { ThreatRadarTab } from "@/components/tabs/ThreatRadarTab";
import { ExposureTab } from "@/components/tabs/ExposureTab";
import { HeaderCheckTab } from "@/components/tabs/HeaderCheckTab";
import { DnsReconTab } from "@/components/tabs/DnsReconTab";
import { LocalScanTab } from "@/components/tabs/LocalScanTab";
import { IpGeoTab } from "@/components/tabs/IpGeoTab";
import { CertCheckTab } from "@/components/tabs/CertCheckTab";
import type { DashboardData } from "@/types";

export function Dashboard({ data }: { data: DashboardData }) {
  const [active, setActive] = useState("overview");

  // Direktlink-Unterstützung: ?tab=quiz öffnet direkt diesen Tab.
  // Beim Tab-Wechsel wird die URL mitgeführt (teilbar, ohne Neuladen).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t) setActive(t);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (active === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", active);
    window.history.replaceState(null, "", url);
  }, [active]);

  return (
    <div className="min-h-screen flex flex-col">
      <BootSequence />
      <MatrixRain />
      <CursorGlow />
      <div className="scan-beam" aria-hidden="true" />
      <Navbar active={active} setActive={setActive} />
      <main className="flex-1 overflow-auto">
        {active === "overview"        && <OverviewTab data={data} onNavigate={setActive} />}
        {active === "vulnerabilities" && <VulnerabilitiesTab vulnerabilities={data.vulnerabilities} />}
        {active === "threats"         && <ThreatsTab threats={data.threats} />}
        {active === "network"         && <NetworkTab networkEvents={data.networkEvents} />}
        {active === "scans"           && <ScansTab scans={data.scans} />}
        {active === "protect"         && <ProtectTab />}
        {active === "hardening"       && <HardeningTab />}
        {active === "tools"           && <ToolsTab />}
        {active === "journal"         && <JournalTab />}
        {active === "exposure"        && <ExposureTab />}
        {active === "headercheck"     && <HeaderCheckTab />}
        {active === "dnsrecon"        && <DnsReconTab />}
        {active === "localscan"       && <LocalScanTab />}
        {active === "ipgeo"           && <IpGeoTab />}
        {active === "certcheck"       && <CertCheckTab />}
        {active === "breach"          && <BreachCheckTab />}
        {active === "radar"           && <ThreatRadarTab />}
        {active === "vulnscan"        && <VulnScanTab />}
        {active === "cve"             && <CveSearchTab />}
        {active === "attack"          && <AttackTab />}
        {active === "loganalyzer"     && <LogAnalyzerTab />}
        {active === "phishing"        && <PhishingTab />}
        {active === "commands"        && <CommandsTab />}
        {active === "encoder"         && <EncoderTab />}
        {active === "playbooks"       && <PlaybooksTab />}
        {active === "roadmap"         && <RoadmapTab />}
        {active === "password"        && <PasswordTab />}
        {active === "security"        && <SecurityStatusTab />}
        {active === "nettools"        && <NetToolsTab />}
        {active === "quiz"            && <QuizTab />}
        {active === "about"           && <AboutTab />}
        {active === "seccheck"        && <SecurityCheckTab />}
        {active === "progress"        && <ProgressTab onNavigate={setActive} />}
        {active === "challenges"      && <ChallengesTab />}
      </main>
      <footer className="px-6 py-2 flex justify-between text-[12px]"
              style={{ background: "#07010f", borderTop: "1px solid rgba(30,41,59,0.5)", color: "#1e2b3a" }}>
        <span style={{ color: "#0a2838" }}>CyberShield SOC Dashboard v2.0</span>
        <span>Alle Zeiten UTC</span>
      </footer>
    </div>
  );
}
