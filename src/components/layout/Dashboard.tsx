"use client";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
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
import type { DashboardData } from "@/types";

export function Dashboard({ data }: { data: DashboardData }) {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col">
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
        {active === "vulnscan"        && <VulnScanTab />}
        {active === "cve"             && <CveSearchTab />}
        {active === "attack"          && <AttackTab />}
        {active === "loganalyzer"     && <LogAnalyzerTab />}
        {active === "phishing"        && <PhishingTab />}
        {active === "commands"        && <CommandsTab />}
        {active === "encoder"         && <EncoderTab />}
        {active === "playbooks"       && <PlaybooksTab />}
        {active === "roadmap"         && <RoadmapTab />}
      </main>
      <footer className="px-6 py-2 flex justify-between text-[10px]"
              style={{ background: "#020817", borderTop: "1px solid rgba(30,41,59,0.5)", color: "#1e3a2a" }}>
        <span style={{ color: "#064e3b" }}>CyberShield SOC Dashboard v2.0</span>
        <span>Alle Zeiten UTC</span>
      </footer>
    </div>
  );
}
