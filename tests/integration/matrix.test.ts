import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { anon, service, signedInAs } from "./local-supabase";

// topic_matrix_coverage() (0010) and who may change a cell (0005: admins only).

let admin: Awaited<ReturnType<typeof signedInAs>>;
let editor: Awaited<ReturnType<typeof signedInAs>>;
let cellId: string;

beforeAll(async () => {
  [admin, editor] = await Promise.all([signedInAs("admin"), signedInAs("editor")]);
  const { data } = await service()
    .from("topic_matrix")
    .select("id")
    .eq("status", "open")
    .limit(1)
    .single();
  cellId = data!.id;
});

afterAll(async () => {
  await service().from("topic_matrix").update({ status: "open" }).eq("id", cellId);
  await Promise.all([admin.cleanup(), editor.cleanup()]);
});

describe("topic_matrix_coverage", () => {
  it("counts every cell once, by status and by format, per category", async () => {
    const { data, error } = await editor.client.rpc("topic_matrix_coverage");
    expect(error).toBeNull();
    expect(data).toHaveLength(8);

    const { count } = await service()
      .from("topic_matrix")
      .select("*", { count: "exact", head: true });
    const sum = (record: unknown) =>
      Object.values(record as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(data!.reduce((acc, row) => acc + Number(row.total), 0)).toBe(count);
    for (const row of data!) {
      expect(sum(row.by_status), row.category_slug).toBe(Number(row.total));
      expect(sum(row.by_format), row.category_slug).toBe(Number(row.total));
    }
  });

  it("refuses anon", async () => {
    const { error } = await anon().rpc("topic_matrix_coverage");
    expect(error).not.toBeNull();
  });
});

describe("changing a cell", () => {
  it("admins can mark a cell exhausted", async () => {
    const { data, error } = await admin.client
      .from("topic_matrix")
      .update({ status: "exhausted" })
      .eq("id", cellId)
      .select("status");
    expect(error).toBeNull();
    expect(data).toEqual([{ status: "exhausted" }]);
  });

  it("editors can't — RLS matches zero rows rather than erroring", async () => {
    const { data } = await editor.client
      .from("topic_matrix")
      .update({ status: "open" })
      .eq("id", cellId)
      .select("status");
    expect(data).toEqual([]);
  });
});
