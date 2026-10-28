/**
 * SSRF-safe image download for "analyze an image URL".
 * Every hop: http(s) on the default port only, no credentials, and every address the name resolves to
 * must be public. The connection uses the address we checked (custom lookup), so a second DNS answer
 * can't rebind to an internal host. Redirects are followed manually and checked again.
 */
import { BlockList, isIP } from "node:net";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { HttpError } from "./http.ts";

const blocked = new BlockList();
for (const [net, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001::", 23], ["2001:db8::", 32],
  ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) blocked.addSubnet(net, prefix, "ipv6");

/** True for anything that is not a public unicast address (private, loopback, link-local, reserved, multicast). */
export function isBlockedAddress(address: string): boolean {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  if (mapped) return blocked.check(mapped, "ipv4");
  const family = isIP(address);
  if (!family) return true;
  return blocked.check(address, family === 6 ? "ipv6" : "ipv4");
}

const DEFAULT_PORT = { "http:": "80", "https:": "443" } as const;

/** Rejects URLs we never fetch, before any network access. Returns the parsed URL. */
export function checkUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new HttpError(422, "url_invalid", "That is not a valid URL."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new HttpError(422, "url_invalid", "Only http and https image URLs are allowed.");
  if (url.username || url.password) throw new HttpError(422, "url_invalid", "URLs with credentials are not allowed.");
  if (url.port && url.port !== DEFAULT_PORT[url.protocol]) throw new HttpError(422, "url_blocked", "Only standard ports 80 and 443 are allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isBlockedAddress(host)) throw new HttpError(422, "url_blocked", "That address is not allowed.");
  return url;
}

const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err || !addresses.length) return callback(err ?? new Error("no address"), "", 4);
    if (addresses.some((a) => isBlockedAddress(a.address))) return callback(new HttpError(422, "url_blocked", "That address is not allowed."), "", 4);
    if (options.all) return (callback as unknown as (e: null, a: typeof addresses) => void)(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};

function get(url: URL, timeoutMs: number): Promise<http.IncomingMessage> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(url, { lookup: safeLookup, timeout: timeoutMs, headers: { Accept: "image/*", "User-Agent": "OriginLens/1.0 (+image-analysis)" } }, resolve);
    req.on("timeout", () => req.destroy(new HttpError(504, "url_fetch_failed", "The image host took too long to respond.")));
    req.on("error", reject);
  });
}

export async function fetchImage(raw: string, maxBytes: number, timeoutMs = 8000, maxRedirects = 3): Promise<Buffer> {
  if (raw.length > 2048) throw new HttpError(422, "url_invalid", "URL is too long.");
  let url = checkUrl(raw);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let res: http.IncomingMessage;
    try {
      res = await get(url, timeoutMs);
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(502, "url_fetch_failed", "Could not download the image.");
    }
    const status = res.statusCode ?? 0;
    if ([301, 302, 303, 307, 308].includes(status)) {
      res.resume();
      const location = res.headers.location;
      if (!location) throw new HttpError(502, "url_fetch_failed", "Redirect without a location.");
      url = checkUrl(new URL(location, url).toString());
      continue;
    }
    if (status !== 200) { res.resume(); throw new HttpError(502, "url_fetch_failed", `Image host returned HTTP ${status}.`); }
    if (Number(res.headers["content-length"]) > maxBytes) { res.destroy(); throw new HttpError(413, "file_too_large", "Remote image is too large."); }
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of res) {
        size += chunk.length;
        if (size > maxBytes) { res.destroy(); throw new HttpError(413, "file_too_large", "Remote image is too large."); }
        chunks.push(chunk);
      }
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(502, "url_fetch_failed", "Could not download the image.");
    }
    return Buffer.concat(chunks);
  }
  throw new HttpError(422, "too_many_redirects", "Too many redirects.");
}

/** Detects the image format from its first bytes; never trusts the Content-Type header. */
export function sniffImage(b: Buffer): { mime: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png" };
  if (b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return { mime: "image/webp" };
  if (["GIF87a", "GIF89a"].includes(b.toString("latin1", 0, 6))) return { mime: "image/gif" };
  return null;
}
