import { errorResponse, readJson, textField } from "@/lib/server/http.ts";
import { aiQuota, caller, rateLimit } from "@/lib/server/limits.ts";
import { complete } from "@/lib/server/llm.ts";
import { DEEP_SCAN_SYSTEM, wrap } from "@/lib/server/prompts.ts";

export const maxDuration = 60;

const list = (v: unknown) => (Array.isArray(v) ? v : []);

export async function POST(req: Request) {
  try {
    const text = textField(await readJson(req));
    const who = await caller(req);
    await rateLimit(who);
    await aiQuota(who);
    const llm = await complete([{ role: "system", content: DEEP_SCAN_SYSTEM }, { role: "user", content: wrap(text) }], 0.2, 900);
    let data: Record<string, unknown> = {};
    try {
      const start = llm.text.indexOf("{"), end = llm.text.lastIndexOf("}");
      if (start >= 0) data = JSON.parse(llm.text.slice(start, end + 1));
    } catch {
      // a malformed reply becomes empty lists below
    }
    return Response.json({ observations: list(data.observations), sentence_notes: list(data.sentence_notes),
      suggestions: list(data.suggestions), provider: "nvidia", model: llm.model,
      disclaimer: "Style review written by a language model. It is an opinion, not a detection result." });
  } catch (e) {
    return errorResponse(e);
  }
}
