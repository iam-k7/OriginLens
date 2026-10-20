import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanBytes, findMetadata } from "./cleanImage.ts";

// Run with: node --test src/lib/cleanImage.test.mts
const enc = new TextEncoder();
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const le32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const seg = (marker: number, payload: Uint8Array) => [0xff, marker, ((payload.length + 2) >> 8) & 255, (payload.length + 2) & 255, ...payload];

function jpeg(): Uint8Array {
  const exif = enc.encode("Exif\u0000\u0000secret camera data");
  const com = enc.encode("hello comment");
  const pixels = [0xff, 0xda, 0, 2, 1, 2, 3, 4, 0xff, 0xd9];
  return new Uint8Array([0xff, 0xd8, ...seg(0xe1, exif), ...seg(0xfe, com), ...seg(0xdb, new Uint8Array([9, 9])), ...pixels]);
}

function png(): Uint8Array {
  const chunk = (type: string, body: Uint8Array) => [...be32(body.length), ...enc.encode(type), ...body, 0, 0, 0, 0];
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", new Uint8Array(13)),
    ...chunk("tEXt", enc.encode("Comment\u0000private note")),
    ...chunk("IDAT", new Uint8Array([1, 2, 3])),
    ...chunk("IEND", new Uint8Array()),
  ]);
}

function webp(): Uint8Array {
  const chunk = (type: string, body: number[]) => [...enc.encode(type), ...le32(body.length), ...body, ...(body.length & 1 ? [0] : [])];
  const body = [...enc.encode("WEBP"), ...chunk("VP8X", [0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]), ...chunk("EXIF", [1, 2, 3, 4]), ...chunk("VP8L", [7, 7])];
  return new Uint8Array([...enc.encode("RIFF"), ...le32(body.length), ...body]);
}

test("JPEG: removes EXIF and comments, keeps other segments and the scan data", () => {
  const src = jpeg();
  assert.deepEqual(findMetadata(src).map((f) => f.category), ["exif", "comments"]);
  const { bytes, removed } = cleanBytes(src, ["exif", "comments"]);
  assert.deepEqual(removed.map((f) => f.category), ["exif", "comments"]);
  assert.equal(new TextDecoder("latin1").decode(bytes).includes("secret"), false);
  assert.deepEqual([...bytes.subarray(-10)], [0xff, 0xda, 0, 2, 1, 2, 3, 4, 0xff, 0xd9]);
  assert.deepEqual(findMetadata(bytes), []);
});

test("only the chosen categories are removed", () => {
  const { bytes } = cleanBytes(jpeg(), ["comments"]);
  assert.deepEqual(findMetadata(bytes).map((f) => f.category), ["exif"]);
});

test("PNG: drops text chunks and still ends with IEND", () => {
  const { bytes } = cleanBytes(png(), ["comments"]);
  const s = new TextDecoder("latin1").decode(bytes);
  assert.equal(s.includes("private note"), false);
  assert.ok(s.includes("IDAT") && s.endsWith("IEND\u0000\u0000\u0000\u0000"));
});

test("WEBP: fixes the RIFF size and clears the EXIF flag", () => {
  const { bytes } = cleanBytes(webp(), ["exif"]);
  const size = new DataView(bytes.buffer).getUint32(4, true);
  assert.equal(size, bytes.length - 8);
  assert.equal(bytes[20] & 0x08, 0);
  assert.deepEqual(findMetadata(bytes), []);
});

test("unsupported formats are rejected", () => {
  assert.throws(() => cleanBytes(new Uint8Array([71, 73, 70, 56]), ["exif"]), /supports JPEG, PNG and WEBP/);
});
