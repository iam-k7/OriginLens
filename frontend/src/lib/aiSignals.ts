/**
 * Browser-side AI-generation check. It reads metadata and text chunks only: no pixels are
 * analysed, no probability score is produced, and the file never leaves the device.
 */
import exifr from "exifr";

export type AiEvidence = {
  source: string;
  signal: string;
  detail: string;
  strength: "strong" | "moderate" | "weak";
  direction: "ai" | "camera" | "neutral";
};

export type AiSignals = {
  verdict: "declared_ai" | "ai_indicators" | "camera_indicators" | "inconclusive";
  confidence: "high" | "medium" | "low";
  evidence: AiEvidence[];
  limitations: string[];
  detector: { status: "unavailable"; score: null; reason: string };
};

type Exif = Record<string, unknown>;
type Segment = { marker: number; data: Uint8Array };
type Chunk = { type: string; data: Uint8Array };
type Meta = { blobs: Uint8Array[]; keyed: Record<string, string>; c2pa: boolean };

const LATIN1 = new TextDecoder("latin1");
const AI_SOURCE_TYPES = ["trainedAlgorithmicMedia", "compositeWithTrainedAlgorithmicMedia", "algorithmicMedia"];
const GENERATORS = [
  "midjourney", "dall-e", "dall·e", "dalle", "stable diffusion", "sdxl", "firefly", "imagen", "novelai",
  "comfyui", "automatic1111", "invokeai", "flux", "leonardo", "ideogram", "gpt-4o", "chatgpt", "openai",
  "gemini", "bing image creator", "playground ai", "runway", "krea",
];
const GEN_SIZES = new Set([512, 576, 640, 704, 768, 832, 896, 960, 1024, 1152, 1216, 1280, 1344, 1536, 1792, 2048]);
const LIMITATIONS = [
  "No validated pixel-level AI detector is used, so no AI probability score is shown.",
  "Metadata can be stripped or forged. A missing label proves nothing either way.",
  "Camera EXIF can be copied onto generated images. Treat it as weak evidence.",
  "Screenshots, re-uploads and social platforms usually remove these signals.",
  "Content Credentials are detected here but not verified. Signature checks need the server.",
];

function sniff(b: Uint8Array): string {
  if (b[0] === 0xff && b[1] === 0xd8) return "JPEG";
  if (b[0] === 0x89 && b[1] === 0x50) return "PNG";
  if (LATIN1.decode(b.subarray(0, 4)) === "RIFF" && LATIN1.decode(b.subarray(8, 12)) === "WEBP") return "WEBP";
  return "OTHER";
}

function has(b: Uint8Array, text: string, limit = b.length): boolean {
  return LATIN1.decode(b.subarray(0, limit)).includes(text);
}

function jpegSegments(b: Uint8Array): Segment[] {
  const out: Segment[] = [];
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xff) { i += 1; continue; } // fill byte
    if (marker === 0xda) break; // start of scan: pixel data follows
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    out.push({ marker, data: b.subarray(i + 4, i + 2 + len) });
    i += 2 + len;
  }
  return out;
}

function pngChunks(b: Uint8Array): Chunk[] {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Chunk[] = [];
  let i = 8;
  while (i + 8 <= b.length) {
    const len = view.getUint32(i);
    const type = LATIN1.decode(b.subarray(i + 4, i + 8));
    out.push({ type, data: b.subarray(i + 8, i + 8 + len) });
    if (type === "IEND") break;
    i += 12 + len;
  }
  return out;
}

function webpChunks(b: Uint8Array): Chunk[] {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Chunk[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const len = view.getUint32(i + 4, true);
    out.push({ type: LATIN1.decode(b.subarray(i, i + 4)), data: b.subarray(i + 8, i + 8 + len) });
    i += 8 + len + (len & 1);
  }
  return out;
}

// tEXt and iTXt blocks: "keyword NUL text". Compressed zTXt blocks are not read.
function addKeyed(meta: Meta, data: Uint8Array) {
  const zero = data.indexOf(0);
  if (zero > 0) meta.keyed[LATIN1.decode(data.subarray(0, zero))] = LATIN1.decode(data.subarray(zero + 1));
}

function readMetadata(b: Uint8Array, format: string): Meta {
  const meta: Meta = { blobs: [], keyed: {}, c2pa: false };
  if (format === "JPEG") {
    for (const seg of jpegSegments(b)) {
      const isMetadata = (seg.marker >= 0xe1 && seg.marker <= 0xef) || seg.marker === 0xfe;
      if (!isMetadata) continue;
      meta.blobs.push(seg.data);
      if (seg.marker === 0xeb && (has(seg.data, "jumb", 60) || has(seg.data, "c2pa", 120))) meta.c2pa = true;
    }
  } else if (format === "PNG") {
    for (const c of pngChunks(b)) {
      if (c.type === "caBX") meta.c2pa = true;
      if (c.type === "eXIf") meta.blobs.push(c.data);
      if (c.type === "tEXt" || c.type === "iTXt") {
        meta.blobs.push(c.data);
        addKeyed(meta, c.data);
      }
    }
  } else if (format === "WEBP") {
    for (const c of webpChunks(b)) {
      if (c.type === "C2PA") meta.c2pa = true;
      if (c.type === "EXIF" || c.type === "XMP ") meta.blobs.push(c.data);
    }
  }
  return meta;
}

function generatorIn(value: unknown): string | undefined {
  const t = typeof value === "string" ? value.toLowerCase() : "";
  return GENERATORS.find((g) => t.includes(g));
}

/** The check itself, over the file bytes and parsed EXIF. Pure, so it can be tested in Node. */
export function scanBytes(bytes: Uint8Array, exif: Exif = {}, dims?: { width: number; height: number }): AiSignals {
  const meta = readMetadata(bytes, sniff(bytes));
  const text = meta.blobs.map((b) => LATIN1.decode(b)).join("\n");
  const evidence: AiEvidence[] = [];

  const sourceType = AI_SOURCE_TYPES.find((t) => text.includes(t));
  if (sourceType) {
    evidence.push({ source: "XMP/IPTC", signal: "AI digital source type", detail: sourceType, strength: "moderate", direction: "ai" });
  }

  const generator = [exif.Software, exif.CreatorTool, meta.keyed.Software, meta.keyed.Comment, meta.keyed.Description]
    .map(generatorIn)
    .find(Boolean);
  if (generator) {
    evidence.push({ source: "Software field", signal: "Generator tool", detail: `Mentions '${generator}'`, strength: "moderate", direction: "ai" });
  }

  if ("parameters" in meta.keyed) {
    evidence.push({ source: "PNG text", signal: "Diffusion parameters", detail: "A Stable Diffusion-style 'parameters' block is present", strength: "strong", direction: "ai" });
  }
  if ("prompt" in meta.keyed || "workflow" in meta.keyed) {
    evidence.push({ source: "PNG text", signal: "Workflow prompt", detail: "A ComfyUI-style prompt or workflow block is present", strength: "strong", direction: "ai" });
  }

  if (typeof exif.Make === "string" && (exif.ExposureTime !== undefined || exif.FNumber !== undefined)) {
    const device = [exif.Make, exif.Model].filter((v): v is string => typeof v === "string").join(" ");
    evidence.push({ source: "EXIF", signal: "Camera capture data", detail: `${device} with exposure settings`, strength: "weak", direction: "camera" });
  }

  if (dims && GEN_SIZES.has(dims.width) && GEN_SIZES.has(dims.height) && dims.width % 64 === 0 && dims.height % 64 === 0) {
    evidence.push({ source: "Technical", signal: "Generator-typical dimensions", detail: `${dims.width}×${dims.height} (multiples of 64)`, strength: "weak", direction: "ai" });
  }

  if (meta.c2pa) {
    evidence.push({ source: "C2PA", signal: "Content Credentials present", detail: "A manifest marker is in the file; its signature is not checked here", strength: "weak", direction: "neutral" });
  }

  if (meta.blobs.length === 0 && Object.keys(exif).length === 0) {
    evidence.push({ source: "Technical", signal: "No embedded metadata", detail: "Common after screenshots or social uploads; not evidence either way", strength: "weak", direction: "neutral" });
  }

  const ai = evidence.filter((e) => e.direction === "ai");
  let verdict: AiSignals["verdict"] = "inconclusive";
  let confidence: AiSignals["confidence"] = "low";
  if (ai.some((e) => e.strength === "strong")) {
    verdict = "declared_ai";
    confidence = "high";
  } else if (ai.some((e) => e.strength === "moderate")) {
    verdict = "ai_indicators";
    confidence = "medium";
  } else if (evidence.some((e) => e.direction === "camera") && ai.length === 0) {
    verdict = "camera_indicators";
  }

  return {
    verdict,
    confidence,
    evidence,
    limitations: LIMITATIONS,
    detector: { status: "unavailable", score: null, reason: "No validated pixel-level AI-image detector is configured." },
  };
}

/** Reads the file on this device. Nothing is sent to a server. */
export async function checkAiSignals(file: File): Promise<AiSignals> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const exif: Exif =
    (await exifr.parse(bytes, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false, ihdr: false, jfif: false, mergeOutput: true }).catch(() => undefined)) ?? {};

  let dims: { width: number; height: number } | undefined;
  try {
    const bitmap = await createImageBitmap(file);
    dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
  } catch {
    // Not a decodable image: skip the size check.
  }
  return scanBytes(bytes, exif, dims);
}
