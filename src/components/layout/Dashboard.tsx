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
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar active={active} setActive={setActive} />
      <main className="flex-1 overflow-auto">
        {active === "overview"        && <OverviewTab data={data} />}
        {active === "vulnerabilities" && <VulnerabilitiesTab vulnerabilities={data.vulnerabilities} />}
        {active === "threats"         && <ThreatsTab threats={data.threats} />}
        {active === "network"         && <NetworkTab networkEvents={data.networkEvents} />}
        {active === "scans"           && <ScansTab scans={data.scans} />}
      </main>
      <footer className="border-t border-gray-800 px-6 py-2 flex justify-between text-gray-600 text-xs">
        <span>CyberShield SOC Dashboard v1.0</span>
        <span>Data refreshes every 60s · All times UTC</span>
      </footer>
    </div>
  );
}
