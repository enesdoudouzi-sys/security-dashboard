import { readFileSync } from "fs";
import { join } from "path";
import type { DashboardData } from "@/types";

export function loadDashboardData(): DashboardData {
  const raw = readFileSync(join(process.cwd(), "data", "scans.json"), "utf-8");
  return JSON.parse(raw);
}
