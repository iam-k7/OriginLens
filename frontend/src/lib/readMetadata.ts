/** Browser-side metadata reader: format, size, hash, camera details, GPS and every EXIF/XMP/IPTC field. */
import exifr from "exifr";
import { findMetadata, sniffFormat, type Found } from "./cleanImage";

export type Details = {
  format: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  highlights: Record<string, string>;
  gps?: { latitude: number; longitude: number };
  fields: Record<string, string>;
  blocks: Found[];
};

function show(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (ArrayBuffer.isView(v)) return `<${v.byteLength} bytes binary>`;
  if (Array.isArray(v)) return v.slice(0, 16).map(show).join(", ");
  if (typeof v === "object") return JSON.stringify(v).slice(0, 300);
  return String(v).slice(0, 300);
}

const first = (fields: Record<string, string>, ...keys: string[]) => keys.map((k) => fields[k]).find(Boolean);

export async function readMetadata(file: File): Promise<Details> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const raw: Record<string, unknown> =
    (await exifr.parse(bytes, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false, ihdr: false, jfif: false, makerNote: false, userComment: false, mergeOutput: true }).catch(() => undefined)) ?? {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const text = show(value);
    if (text) fields[key] = text;
  }
  const gps = await exifr.gps(bytes).catch(() => undefined);

  let width = 0;
  let height = 0;
  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch {
    // Not decodable here: leave the size at 0.
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  const camera = [fields.Make, fields.Model].filter(Boolean).join(" ");
  const highlights: Record<string, string> = {};
  for (const [label, value] of Object.entries({
    Camera: camera,
    Lens: fields.LensModel,
    Software: first(fields, "Software", "CreatorTool"),
    Author: first(fields, "Artist", "creator", "Creator"),
    Copyright: first(fields, "Copyright", "rights"),
    Captured: first(fields, "DateTimeOriginal", "CreateDate"),
  })) if (value) highlights[label] = value;

  return {
    format: sniffFormat(bytes) ?? (file.type.split("/")[1] ?? "unknown").toUpperCase(),
    width,
    height,
    bytes: bytes.length,
    sha256: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join(""),
    highlights,
    gps: gps ? { latitude: gps.latitude, longitude: gps.longitude } : undefined,
    fields,
    blocks: findMetadata(bytes),
  };
}
