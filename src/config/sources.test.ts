import { describe, expect, it } from "vitest";

import { trustedPublisher } from "./sources";

describe("trustedPublisher", () => {
  it.each([
    ["www.nhs.uk", "NHS"],
    ["pmc.ncbi.nlm.nih.gov", "NIH"],
    ["www.aad.org", "American Academy of Dermatology"],
    ["www.cancerresearchuk.org", "Cancer Research UK"],
    ["keepingwellnwl.nhs.uk", "NHS"],
  ])("trusts %s as %s", (host, name) => expect(trustedPublisher(host)).toBe(name));

  it.each([
    "facebook.com",
    "youtube.com",
    "healthline.com",
    "webmd.com",
    "archerpharmacy.co.uk",
    "nhs.uk.evil.example",
  ])("does not trust %s", (host) => expect(trustedPublisher(host)).toBeNull());

  it("doesn't match a trusted name embedded in another domain", () => {
    expect(trustedPublisher("notnhs.uk")).toBeNull();
    expect(trustedPublisher("fakeaad.org")).toBeNull();
  });
});
