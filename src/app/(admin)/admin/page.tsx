import { requireStaff } from "@/features/auth";

// Placeholder until the dashboard lands in M5.5.
export default async function AdminHomePage() {
  // Page-level guard — see the note in ./layout.tsx.
  const staff = await requireStaff();

  return (
    <div className="max-w-(--measure)">
      <h1 className="text-2xl">Dashboard</h1>
      <p className="mt-2 text-ink-muted">Signed in as {staff.email}.</p>
    </div>
  );
}
