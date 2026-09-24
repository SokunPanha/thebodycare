// Dashboard: the admin home — queue, publishing, generation spend and topic runway at a glance.
// Public surface of this feature. Import from "@/features/dashboard", never a deep path. (STRUCTURE.md rule 2)
export { DashboardView } from "./components/dashboard-view";
export { getDashboardStats, listRecentRuns, type DashboardStats, type RecentRun } from "./queries";
