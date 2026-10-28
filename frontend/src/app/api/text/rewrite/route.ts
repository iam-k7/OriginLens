import { errorResponse, HttpError, readJson, textField } from "@/lib/server/http.ts";
import { aiQuota, caller, rateLimit } from "@/lib/server/limits.ts";
import { complete } from "@/lib/server/llm.ts";
import { HUMANIZE_BACK, HUMANIZE_TO_CHINESE, REWRITE_SYSTEM, TONES, wrap } from "@/lib/server/prompts.ts";

export const maxDuration = 60; // Humanize makes two AI calls (~15 s together)

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const text = textField(body);
    const tone = typeof body.tone === "string" ? body.tone : "neutral";
    if (tone !== "humanize" && !(tone in TONES)) throw new HttpError(422, "invalid_tone", "Unknown tone.");
    const who = await caller(req);
    await rateLimit(who);
    await aiQuota(who);

    const budget = Math.min(4000, Math.floor(text.length / 2) + 400);
    let result;
    if (tone === "humanize") {
      const draft = await complete([{ role: "system", content: HUMANIZE_TO_CHINESE }, { role: "user", content: wrap(text) }], 1.3, budget);
      result = await complete([{ role: "system", content: HUMANIZE_BACK },
        { role: "user", content: `${wrap(text)}\n${wrap(draft.text, "draft")}` }], 0.9, budget);
    } else {
      result = await complete([{ role: "system", content: REWRITE_SYSTEM(TONES[tone as keyof typeof TONES]) },
        { role: "user", content: wrap(text) }], 0.6, budget);
    }
    return Response.json({ text: result.text, tone, provider: "nvidia", model: result.model,
      note: "Rewriting improves readability. It does not guarantee any score from AI detectors." });
  } catch (e) {
    return errorResponse(e);
  }
}
