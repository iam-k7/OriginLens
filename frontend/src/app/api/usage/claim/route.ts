import { errorResponse, HttpError, readJson } from "@/lib/server/http.ts";
import { caller, freeUse, rateLimit, type Tool } from "@/lib/server/limits.ts";

/**
 * The browser asks for a "go" before an image or text check that runs on the device.
 * shortcut: the check itself runs client-side, so editing the page can skip this call; move the checks
 * server-side if the free limit ever needs to be strict.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const tool = body.tool;
    if (tool !== "image" && tool !== "text") throw new HttpError(422, "invalid_tool", "Unknown tool.");
    const who = await caller(req);
    try {
      await rateLimit(who);
      await freeUse(who, tool as Tool);
    } catch (e) {
      // Free checks cost nothing to run, so an unavailable counter lets them through instead of blocking everyone.
      if (!(e instanceof HttpError && e.code === "limiter_unavailable")) throw e;
    }
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
