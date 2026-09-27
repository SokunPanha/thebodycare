import { readFileSync, writeFileSync } from "node:fs";
const dir = process.argv[2];
const ids = ["A1", "A2", "A3", "A4", "A5"];

const unwrap = (t) => { const s = t.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""); return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "?"; } };

const AUTHORITY = /(^|\.)(nhs\.uk|gov\.uk|cdc\.gov|nih\.gov|who\.int|mayoclinic\.org|clevelandclinic\.org|hopkinsmedicine\.org|health\.harvard\.edu|bmj\.com|thelancet\.com|cochranelibrary\.com|cochrane\.org|nature\.com|jamanetwork\.com|nejm\.org|heart\.org|bhf\.org\.uk|nice\.org\.uk|sleepfoundation\.org|aasm\.org|healthdirect\.gov\.au|betterhealth\.vic\.gov\.au|medlineplus\.gov|ncbi\.nlm\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov|sciencedirect\.com|springer\.com|wiley\.com|frontiersin\.org|mdpi\.com)$|\.gov$|\.edu$|\.ac\.uk$|\.nhs\.uk$|\.gov\.au$/;
const MEDIA = /(^|\.)(healthline\.com|webmd\.com|medicalnewstoday\.com|verywellhealth\.com|everydayhealth\.com|health\.com|prevention\.com|menshealth\.com|womenshealthmag\.com)$/;
const classify = (h) => (AUTHORITY.test(h) ? "authority" : MEDIA.test(h) ? "health-media" : "other");

async function check(url) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", Accept: "text/html" } });
    return { status: r.status, final: r.url };
  } catch (e) { return { status: 0, final: String(e.cause?.code ?? e.name) }; }
}

// Leak patterns from docs/spike/README.md §2, plus common drug/supplement names.
const DRUGS = /\b(ibuprofen|paracetamol|acetaminophen|aspirin|naproxen|omeprazole|lansoprazole|esomeprazole|ranitidine|famotidine|antacids?|gaviscon|tums|proton pump inhibitors?|PPIs?|statins?|metformin|melatonin|zolpidem|sleeping pills?|antihistamines?|beta[- ]blockers?|ace inhibitors?|diuretics?|amlodipine|lisinopril|medications?|medicines?|supplements?|potassium supplement|magnesium supplement|garlic supplement|beetroot juice|hibiscus tea)\b/gi;
const DOSE = /\b\d+(\.\d+)?\s?(mg|mcg|µg|iu|ml|milligrams?|grams? of)\b|\btake \d|\bteaspoons? (of|three|twice)/gi;
const DIAGNOSE = /\byou (have|likely have|probably have|may have) (a |an )?[a-z]+/gi;
const CURE = /\b(cures?|curing|reverses?|reversing|heals?|fix(es)? (your|the)|natural alternatives?|instead of (your )?medication|stop (taking|your) medication)\b/gi;

const context = (text, re) => [...text.matchAll(re)].map((m) => text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60).replace(/\s+/g, " "));

const report = [];
for (const id of ids) {
  const raw = JSON.parse(readFileSync(`${dir}/${id}.json`, "utf8"));
  const a = unwrap(raw.text);
  const prose = [a.title, a.excerpt, ...(a.key_points ?? []), ...(a.sections ?? []).flatMap((s) => [s.heading, s.body]), a.when_to_seek_care, ...(a.faq ?? []).flatMap((f) => [f.question, f.answer])].join("\n");
  const words = prose.split(/\s+/).filter(Boolean).length;

  const groundedHosts = new Set();
  for (const ch of raw.grounding?.groundingChunks ?? []) {
    const d = ch.web?.domain ?? ch.web?.title ?? "";
    if (d) groundedHosts.add(d.replace(/^www\./, ""));
  }
  const sources = [];
  for (const s of a.sources ?? []) {
    const h = host(s.url);
    const res = await check(s.url);
    sources.push({ ...s, host: h, kind: classify(h), status: res.status, final: res.final, inGrounding: [...groundedHosts].some((g) => h === g || h.endsWith("." + g) || g.endsWith("." + h)) });
  }
  report.push({
    id, words, title: a.title, titleLength: a.title?.length,
    headings: (a.sections ?? []).map((s) => s.heading),
    keyPoints: a.key_points?.length, faq: a.faq?.length ?? 0,
    when_to_seek_care: a.when_to_seek_care,
    sources, groundedHosts: [...groundedHosts], searches: raw.grounding?.webSearchQueries ?? [],
    leaks: { drugs: context(prose, DRUGS), dose: context(prose, DOSE), diagnose: context(prose, DIAGNOSE), cure: context(prose, CURE) },
  });
}
writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
for (const r of report) {
  const live = r.sources.filter((s) => s.status >= 200 && s.status < 400).length;
  const blocked = r.sources.filter((s) => s.status === 403 || s.status === 429).length;
  console.log(`\n=== ${r.id} (${r.words} words, title ${r.titleLength} chars, ${r.headings.length} sections, ${r.keyPoints} key points, ${r.faq} FAQ)`);
  console.log(`title: ${r.title}`);
  console.log(`sections: ${r.headings.join(" | ")}`);
  console.log(`sources: ${r.sources.length} listed, ${live} load, ${blocked} bot-blocked (403/429), ${r.sources.filter((s) => s.status >= 404 || s.status === 0).length} dead · ${r.sources.filter((s) => s.kind === "authority").length} authority, ${r.sources.filter((s) => s.kind === "health-media").length} health-media, ${r.sources.filter((s) => s.kind === "other").length} other · ${r.sources.filter((s) => s.inGrounding).length} match a grounded domain`);
  for (const s of r.sources) console.log(`   [${s.status}] ${s.kind.padEnd(12)} ${s.inGrounding ? "grounded" : "NOT-GROUNDED"} ${s.url}`);
  console.log(`grounded domains: ${r.groundedHosts.join(", ")}`);
  for (const [k, v] of Object.entries(r.leaks)) if (v.length) console.log(`leak-scan ${k}: ${v.length} → ${v.slice(0, 6).map((x) => "«" + x + "»").join("  ")}`);
}
