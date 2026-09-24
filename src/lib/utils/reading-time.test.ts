import { describe, expect, it } from "vitest";

import { readingTime } from "./reading-time";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

describe("readingTime", () => {
  it("rounds up at 225 words per minute", () => {
    expect(readingTime(words(225))).toBe(1);
    expect(readingTime(words(226))).toBe(2);
    expect(readingTime(words(900))).toBe(4);
  });

  it("is at least one minute, even for an empty body", () => {
    expect(readingTime("")).toBe(1);
  });

  it("does not count markdown syntax or link URLs as words", () => {
    const md =
      "## Heading\n\n- **bold** item\n\n> [link text](https://example.com/a/very/long/url)\n\n| a | b |\n|---|---|";
    const plain = "Heading bold item link text a b";
    expect(readingTime(md.repeat(60))).toBe(readingTime(`${plain} `.repeat(60)));
  });

  it("ignores fenced code", () => {
    expect(readingTime("```\n" + words(1000) + "\n```\nhello")).toBe(1);
  });
});
