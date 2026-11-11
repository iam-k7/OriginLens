/** Errors for the website's server routes, in the { error: { code, message } } shape the client already reads. */
export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  console.error(e);
  return Response.json({ error: { code: "server_error", message: "Something went wrong. Please try again." } }, { status: 500 });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through to the error below
  }
  throw new HttpError(400, "invalid_request", "The request body must be a JSON object.");
}

export const MAX_TEXT_CHARS = 20_000;

/** The text field every text route takes: trimmed, non-empty, at most MAX_TEXT_CHARS. */
export function textField(body: Record<string, unknown>): string {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) throw new HttpError(422, "invalid_text", "Text is empty.");
  if (text.length > MAX_TEXT_CHARS) throw new HttpError(422, "invalid_text", `Text must be at most ${MAX_TEXT_CHARS} characters.`);
  return text;
}
