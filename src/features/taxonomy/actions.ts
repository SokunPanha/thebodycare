"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/features/auth";
import { createSessionClient } from "@/lib/supabase/server";

// Changing the matrix steers what gets written next — admins only (RLS 0005). Checked here too,
// because RLS answers an editor's update with "0 rows changed", not an error: without this the
// button would look like it worked.

export type CellState = { error: string | null };

const idSchema = z.uuid();

async function updateCell(
  cellId: string,
  values: { status?: "open" | "exhausted"; priority?: number },
) {
  const staff = await requireStaff();
  if (staff.role !== "admin") return { error: "Only admins can change the topic matrix." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("topic_matrix")
    .update(values)
    .eq("id", idSchema.parse(cellId))
    .select("id");
  if (error) return { error: error.message };
  if (data.length !== 1) return { error: "That cell wasn't changed — it may no longer exist." };

  revalidatePath("/admin/topics");
  return { error: null };
}

/** Retire a cell (it's been covered elsewhere, or isn't worth writing), or bring it back. */
export async function setCellStatus(
  cellId: string,
  status: "open" | "exhausted",
  _previous: CellState,
): Promise<CellState> {
  return updateCell(cellId, { status: z.enum(["open", "exhausted"]).parse(status) });
}

export async function setCellPriority(
  cellId: string,
  _previous: CellState,
  formData: FormData,
): Promise<CellState> {
  const priority = z.coerce.number().int().min(1).max(5).safeParse(formData.get("priority"));
  if (!priority.success) return { error: "Priority is 1 (first) to 5." };
  return updateCell(cellId, { priority: priority.data });
}
