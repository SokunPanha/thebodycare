import { readFileSync, writeFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const out = process.argv[2];
// Reads GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION and GEMINI_SERVICE_ACCOUNT_FILE from the
// environment, e.g.: node --env-file=.env.local --input-type=module - <outdir> < run.mjs
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  googleAuthOptions: {
    keyFile: process.env.GEMINI_SERVICE_ACCOUNT_FILE,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  },
});
const system = readFileSync("docs/spike/system-prompt.txt", "utf8");
const schema = JSON.parse(readFileSync("docs/spike/response-schema.json", "utf8"));
const blocks = [...readFileSync("docs/spike/prompts.md", "utf8").matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trim());
const prompts = { A1: blocks[0], A2: blocks[1], A3: blocks[2], A4: blocks[1], A5: blocks[3] };

async function call(id, prompt, structured) {
  const started = Date.now();
  const r = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature: 0.7,
      tools: [{ googleSearch: {} }],
      ...(structured ? { responseMimeType: "application/json", responseJsonSchema: schema } : {}),
    },
  });
  return { r, seconds: Math.round((Date.now() - started) / 1000) };
}

for (const [id, prompt] of Object.entries(prompts)) {
  let mode = "structured", res;
  try {
    res = await call(id, prompt, true);
  } catch (e) {
    console.log(id, "structured+grounding rejected:", String(e.message).slice(0, 160));
    mode = "json-in-prompt";
    res = await call(id, `${prompt}\n\nReturn ONLY a JSON object matching this schema, no prose, no code fences:\n${JSON.stringify(schema)}`, false);
  }
  const c = res.r.candidates?.[0];
  writeFileSync(`${out}/${id}.json`, JSON.stringify({ id, prompt, mode, seconds: res.seconds, text: res.r.text, finishReason: c?.finishReason, grounding: c?.groundingMetadata, usage: res.r.usageMetadata }, null, 2));
  console.log(`${id}: ${mode}, ${res.seconds}s, finish ${c?.finishReason}, ${c?.groundingMetadata?.webSearchQueries?.length ?? 0} searches, ${c?.groundingMetadata?.groundingChunks?.length ?? 0} grounding sources, ${res.r.usageMetadata?.totalTokenCount} tokens`);
}
