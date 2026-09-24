import { generationConfig } from "@/config/generation";
import { requireStaff, staffMetadata } from "@/features/auth";
import { DashboardView, getDashboardStats, listRecentRuns } from "@/features/dashboard";

export const generateMetadata = () => staffMetadata("Dashboard");

export default async function DashboardPage() {
  await requireStaff(); // page-level guard — see ./layout.tsx
  const [stats, runs] = await Promise.all([getDashboardStats(), listRecentRuns()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Dashboard</h1>
      <DashboardView
        stats={stats}
        runs={runs}
        costCapUsd={generationConfig.dailyCostCapUsd}
        postsPerDay={generationConfig.postsPerDay}
      />
    </div>
  );
}
