import { describe, expect, it } from "vitest";

import { latestByTopic } from "./front";
import type { PostListing } from "./queries";

const post = (id: string, slug: string) =>
  ({ id, category: { slug, name: slug } }) as unknown as PostListing;
const topics = [
  { slug: "sleep", name: "Sleep" },
  { slug: "mind", name: "Mind" },
  { slug: "food", name: "Food" },
];

describe("latestByTopic", () => {
  it("groups in nav order, caps each row, and drops empty topics", () => {
    const posts = [post("1", "mind"), post("2", "sleep"), post("3", "sleep"), post("4", "sleep")];
    const rows = latestByTopic(posts, topics, { perTopic: 2 });
    expect(rows.map((r) => [r.topic.slug, r.posts.map((p) => p.id)])).toEqual([
      ["sleep", ["2", "3"]],
      ["mind", ["1"]],
    ]);
  });

  it("never repeats a post already shown above", () => {
    const posts = [post("1", "mind"), post("2", "sleep")];
    const rows = latestByTopic(posts, topics, { exclude: [posts[0]!] });
    expect(rows.map((r) => r.topic.slug)).toEqual(["sleep"]);
  });
});
