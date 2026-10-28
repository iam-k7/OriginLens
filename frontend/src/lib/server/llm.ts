/** AI writing calls: NVIDIA's OpenAI-compatible chat API, with bounded retries on transient failures. */
import { HttpError } from "./http.ts";

const BASE_URL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b";
const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export type Message = { role: "system" | "user" | "assistant"; content: string };

export async function complete(messages: Message[], temperature: number, maxTokens: number): Promise<{ text: string; model: string }> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new HttpError(503, "llm_not_configured", "AI writing features are not configured on this server.");

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      continue; // timeout or network error: retry
    }
    if (res.ok) {
      const body = await res.json().catch(() => null);
      const text: unknown = body?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return { text: text.trim(), model: MODEL };
      continue; // an empty reply happens when a reasoning model spends its budget thinking
    }
    if (!RETRYABLE.has(res.status)) break;
  }
  throw new HttpError(503, "llm_unavailable", "AI service is temporarily unavailable. Please try again shortly.");
}
