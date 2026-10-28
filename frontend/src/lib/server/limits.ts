/**
 * Who is calling, and usage limits counted in Supabase (public.consume_quota, callable only with the
 * secret key). Limits fail closed: without the counter, AI calls (which cost money) are refused.
 */
import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./http.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const admin = url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

const PER_MINUTE = 60;
const AI_PER_DAY_SIGNED_IN = 10;
const FREE_PER_DAY = 1; // logged-out visitors: one image check and one text check (analyze or rewrite) per day

export type Tool = "image" | "text";
export const LOGIN_REQUIRED = "login_required";

export type Caller = { userId: string | null; subject: string };

export async function caller(req: Request): Promise<Caller> {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    if (!admin) throw new HttpError(503, "limiter_unavailable", "Usage limits are not configured on this server.");
    const { data } = await admin.auth.getUser(token);
    if (!data.user) throw new HttpError(401, "invalid_token", "Your session has expired. Log in again.");
    return { userId: data.user.id, subject: `user:${data.user.id}` };
  }
  // Vercel overwrites X-Forwarded-For with the real client address, so its first entry can't be spoofed there.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { userId: null, subject: `ip:${ip}` };
}

async function consume(key: string, limit: number, windowSeconds: number, message: string, code: string) {
  if (!admin) throw new HttpError(503, "limiter_unavailable", "Usage limits are not configured on this server.");
  const { data, error } = await admin.rpc("consume_quota", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) throw new HttpError(503, "limiter_unavailable", "Service temporarily unavailable.");
  if (!data) throw new HttpError(429, code, message);
}

export function rateLimit(c: Caller) {
  const minute = Math.floor(Date.now() / 60_000);
  return consume(`rl:${c.subject}:${minute}`, PER_MINUTE, 120, "Too many requests. Please slow down.", "rate_limited");
}

const today = () => new Date().toISOString().slice(0, 10);

/** One logged-out use of `tool` per day; logged-in users are not limited here. */
export function freeUse(c: Caller, tool: Tool) {
  if (c.userId) return Promise.resolve();
  const what = tool === "image" ? "image check" : "text check";
  return consume(`free:${tool}:${c.subject}:${today()}`, FREE_PER_DAY, 2 * 86_400,
    `You've used today's free ${what}. Log in or sign up (free) to keep going.`, LOGIN_REQUIRED);
}

/** AI calls cost money: logged-out visitors spend their one free text check, logged-in users get a daily quota. */
export function aiQuota(c: Caller) {
  if (!c.userId) return freeUse(c, "text");
  return consume(`quota:llm:${c.subject}:${today()}`, AI_PER_DAY_SIGNED_IN, 2 * 86_400,
    `Daily AI limit reached (${AI_PER_DAY_SIGNED_IN} per day). Please try again tomorrow.`, "quota_exceeded");
}
