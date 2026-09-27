import { readFileSync, writeFileSync } from "node:fs";
const dir = process.argv[2];
const AUTH = /(^|\.)(nhs\.uk|gov\.uk|nhsinform\.scot|cdc\.gov|nih\.gov|who\.int|mayoclinic\.org|clevelandclinic\.org|hopkinsmedicine\.org|harvard\.edu|bmj\.com|heart\.org|bhf\.org\.uk|nice\.org\.uk|sleepfoundation\.org|aasm\.org|patient\.info|jeffersonhealth\.org|texashealth\.org|healthdirect\.gov\.au)$|\.gov$|\.edu$|\.ac\.uk$|\.nhs\.uk$/;
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36" };
const out = {};
for (const id of ["A1", "A2", "A3", "A4", "A5"]) {
  const raw = JSON.parse(readFileSync(`${dir}/${id}.json`, "utf8"));
  const rows = [];
  for (const ch of raw.grounding?.groundingChunks ?? []) {
    let real = ch.web.uri;
    try { const r = await fetch(ch.web.uri, { redirect: "manual", signal: AbortSignal.timeout(15000) }); real = r.headers.get("location") ?? real; } catch {}
    let status = 0;
    try { const r = await fetch(real, { redirect: "follow", headers: UA, signal: AbortSignal.timeout(15000) }); status = r.status; } catch {}
    const host = (() => { try { return new URL(real).hostname.replace(/^www\./, ""); } catch { return ch.web.domain; } })();
    rows.push({ host, url: real, status, authority: AUTH.test(host) });
  }
  out[id] = rows;
  const live = rows.filter((r) => r.status >= 200 && r.status < 400);
  const liveAuth = live.filter((r) => r.authority);
  console.log(`${id}: ${rows.length} grounded pages → ${live.length} live, ${liveAuth.length} live AUTHORITY: ${[...new Set(liveAuth.map((r) => r.host))].join(", ") || "—"}`);
  console.log(`     non-authority: ${[...new Set(rows.filter((r) => !r.authority).map((r) => r.host))].join(", ")}`);
}
writeFileSync(`${dir}/grounded.json`, JSON.stringify(out, null, 2));
