import { supabase } from "./supabase";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public requestId?: string) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()), ...(init.headers as Record<string, string>) };
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "network_error", "Could not reach the OriginLens API. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    throw new ApiError(res.status, e?.code ?? "http_error", e?.message ?? `Request failed (${res.status})`, e?.request_id);
  }
  return body as T;
}

/** Multipart POST that reports upload progress (fetch cannot). Aborts when `signal` fires. */
export async function uploadFile<T>(
  path: string,
  body: FormData,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  const headers = await authHeader();
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api${path}`);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      let parsed: { error?: { code: string; message: string; request_id?: string } } | null = null;
      try { parsed = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(parsed as T);
      const e = parsed?.error;
      reject(new ApiError(xhr.status, e?.code ?? "http_error", e?.message ?? `Request failed (${xhr.status})`, e?.request_id));
    };
    xhr.onerror = () => reject(new ApiError(0, "network_error", "Could not reach the OriginLens API. Check your connection and try again."));
    xhr.onabort = () => reject(new ApiError(0, "cancelled", "Upload cancelled."));
    if (signal?.aborted) return reject(new ApiError(0, "cancelled", "Upload cancelled."));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
