import { readFileSync } from "fs";
import { join } from "path";
import { Dashboard } from "./components/Dashboard";
import type { DashboardData } from "./types";

export default function Home() {
  const raw = readFileSync(join(process.cwd(), "data", "scans.json"), "utf-8");
  const data: DashboardData = JSON.parse(raw);
  return <Dashboard data={data} />;
}
