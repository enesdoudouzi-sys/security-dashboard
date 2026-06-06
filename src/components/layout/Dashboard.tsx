"use client";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { VulnerabilitiesTab } from "@/components/tabs/VulnerabilitiesTab";
import { ThreatsTab } from "@/components/tabs/ThreatsTab";
import { NetworkTab } from "@/components/tabs/NetworkTab";
import { ScansTab } from "@/components/tabs/ScansTab";
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
      </main>
      <footer className="px-6 py-2 flex justify-between text-[10px]"
              style={{ background: "#020817", borderTop: "1px solid rgba(30,41,59,0.5)", color: "#1e3a2a" }}>
        <span style={{ color: "#064e3b" }}>CyberShield SOC Dashboard v2.0</span>
        <span>Alle Zeiten UTC</span>
      </footer>
    </div>
  );
}
