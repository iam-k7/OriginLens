import { errorResponse, HttpError, readJson } from "@/lib/server/http.ts";
import { caller, freeUse, rateLimit } from "@/lib/server/limits.ts";
import { fetchImage, sniffImage } from "@/lib/server/urlFetch.ts";

const MAX_BYTES = 15 * 1024 * 1024;

/** Downloads a public image for the browser analyzer (which can't fetch other sites itself because of CORS). */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (typeof body.url !== "string" || !body.url.trim()) throw new HttpError(422, "url_invalid", "Enter an image URL.");
    const who = await caller(req);
    await rateLimit(who);
    const bytes = await fetchImage(body.url.trim(), MAX_BYTES);
    const kind = sniffImage(bytes);
    if (!kind) throw new HttpError(415, "unsupported_format", "Supported formats: JPEG, PNG, WEBP, GIF.");
    await freeUse(who, "image"); // only a successfully fetched image counts as the visitor's image check for the day
    return Response.json({ image: { mime_type: kind.mime, base64: bytes.toString("base64") } });
  } catch (e) {
    return errorResponse(e);
  }
}
