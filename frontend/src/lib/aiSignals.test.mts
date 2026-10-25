import assert from "node:assert/strict";
import { test } from "node:test";
import { scanBytes } from "./aiSignals.ts";

// Run with: node --test src/lib/aiSignals.test.mts
const enc = new TextEncoder();
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

/** A PNG with tEXt blocks. The reader does not check CRCs, so they are zeros. */
function png(...texts: [string, string][]): Uint8Array {
  const out = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const [key, value] of texts) {
    const body = enc.encode(`${key}\u0000${value}`);
    out.push(...be32(body.length), ...enc.encode("tEXt"), ...body, 0, 0, 0, 0);
  }
  out.push(...be32(0), ...enc.encode("IEND"), 0, 0, 0, 0);
  return new Uint8Array(out);
}

/** A JPEG header with one XMP APP1 segment, then start-of-scan. */
function jpegWithXmp(xmp: string): Uint8Array {
  const payload = enc.encode(`http://ns.adobe.com/xap/1.0/\u0000${xmp}`);
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (len >> 8) & 255, len & 255, ...payload, 0xff, 0xda, 0, 2]);
}

test("Stable Diffusion parameters are a strong AI declaration", () => {
  const r = scanBytes(png(["parameters", "a cat, Steps: 20, Sampler: Euler a"]));
  assert.equal(r.verdict, "declared_ai");
  assert.equal(r.confidence, "high");
});

test("an XMP AI source type is an indicator, not a declaration", () => {
  const xmp = "<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>";
  const r = scanBytes(jpegWithXmp(xmp));
  assert.equal(r.verdict, "ai_indicators");
  assert.ok(r.evidence.some((e) => e.signal === "AI digital source type"));
});

test("a generator named in a text block counts as an indicator", () => {
  assert.equal(scanBytes(png(["Software", "Midjourney v6"])).verdict, "ai_indicators");
});

test("camera data alone is camera_indicators; no metadata is inconclusive", () => {
  assert.equal(scanBytes(png(), { Make: "Canon", Model: "EOS R5", ExposureTime: 0.01 }).verdict, "camera_indicators");
  const plain = scanBytes(png());
  assert.equal(plain.verdict, "inconclusive");
  assert.ok(plain.evidence.some((e) => e.signal === "No embedded metadata"));
});

/** A PNG that carries a C2PA chunk (caBX), as AI tools write into their output. */
function pngWithC2pa(): Uint8Array {
  const base = png();
  const chunk = [...be32(4), ...enc.encode("caBX"), 1, 2, 3, 4, 0, 0, 0, 0];
  const iend = base.length - 12;
  return new Uint8Array([...base.subarray(0, iend), ...chunk, ...base.subarray(iend)]);
}
const AI_TYPE = "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";

test("a Content Credentials manifest that declares AI counts; a verified signature makes it strong", () => {
  const creds = { present: true, generator: "ChatGPT", sourceTypes: [AI_TYPE], issues: [] };
  assert.equal(scanBytes(pngWithC2pa(), {}, undefined, { ...creds, validation: "Valid" }).verdict, "declared_ai");
  assert.equal(scanBytes(pngWithC2pa(), {}, undefined, { ...creds, validation: "Invalid" }).verdict, "ai_indicators");
});

test("a C2PA marker without a read manifest is shown, and is not 'no metadata'", () => {
  const r = scanBytes(pngWithC2pa());
  assert.ok(r.evidence.some((e) => e.signal === "Content Credentials present"));
  assert.ok(!r.evidence.some((e) => e.signal === "No embedded metadata"));
  assert.equal(r.verdict, "inconclusive");
});

test("generator-sized dimensions are weak evidence only", () => {
  const r = scanBytes(png(), {}, { width: 1024, height: 1024 });
  assert.equal(r.verdict, "inconclusive");
  assert.ok(r.evidence.some((e) => e.signal === "Generator-typical dimensions" && e.strength === "weak"));
});
