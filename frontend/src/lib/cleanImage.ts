/**
 * Browser-side Privacy Clean. Metadata lives in separate blocks (JPEG segments, PNG chunks,
 * WEBP RIFF chunks), so cleaning cuts those byte ranges out and copies everything else as is.
 * Pixels are never decoded or re-encoded, and the file never leaves the device.
 */
export const CLEAN_CATEGORIES = ["exif", "xmp", "iptc", "c2pa", "comments"] as const;
export type CleanCategory = (typeof CLEAN_CATEGORIES)[number];
export type Found = { category: CleanCategory; bytes: number };

type Block = { start: number; end: number; category: CleanCategory };

const LATIN1 = new TextDecoder("latin1");
const text = (b: Uint8Array, from: number, to: number) => LATIN1.decode(b.subarray(from, to));

function jpegBlocks(b: Uint8Array): Block[] {
  const out: Block[] = [];
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xff) { i += 1; continue; } // fill byte
    if (marker === 0xda) break; // start of scan: pixel data follows
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const end = Math.min(i + 2 + ((b[i + 2] << 8) | b[i + 3]), b.length);
    const head = text(b, i + 4, Math.min(i + 4 + 29, end));
    let category: CleanCategory | undefined;
    if (marker === 0xe1 && head.startsWith("Exif")) category = "exif";
    else if (marker === 0xe1 && head.startsWith("http://ns.adobe.com/xap/") ) category = "xmp";
    else if (marker === 0xe1 && head.startsWith("http://ns.adobe.com/xmp/extension/")) category = "xmp";
    else if (marker === 0xed && head.startsWith("Photoshop 3.0")) category = "iptc";
    else if (marker === 0xeb && (text(b, i + 4, Math.min(i + 4 + 60, end)).includes("jumb") || text(b, i + 4, Math.min(i + 4 + 120, end)).includes("c2pa"))) category = "c2pa";
    else if (marker === 0xfe) category = "comments";
    if (category) out.push({ start: i, end, category });
    i += 2 + ((b[i + 2] << 8) | b[i + 3]);
  }
  return out;
}

function pngBlocks(b: Uint8Array): Block[] {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Block[] = [];
  let i = 8;
  while (i + 12 <= b.length) {
    const len = view.getUint32(i);
    const type = text(b, i + 4, i + 8);
    const end = Math.min(i + 12 + len, b.length);
    let category: CleanCategory | undefined;
    if (type === "eXIf") category = "exif";
    else if (type === "caBX") category = "c2pa";
    else if (type === "iTXt" && text(b, i + 8, i + 8 + 17) === "XML:com.adobe.xmp") category = "xmp";
    else if (type === "tEXt" || type === "zTXt" || type === "iTXt" || type === "tIME") category = "comments";
    if (category) out.push({ start: i, end, category });
    if (type === "IEND") break;
    i += 12 + len;
  }
  return out;
}

function webpBlocks(b: Uint8Array): Block[] {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Block[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const len = view.getUint32(i + 4, true);
    const type = text(b, i, i + 4);
    const end = Math.min(i + 8 + len + (len & 1), b.length);
    const category: CleanCategory | undefined = type === "EXIF" ? "exif" : type === "XMP " ? "xmp" : type === "C2PA" ? "c2pa" : undefined;
    if (category) out.push({ start: i, end, category });
    i = end;
  }
  return out;
}

export function sniffFormat(b: Uint8Array): "JPEG" | "PNG" | "WEBP" | undefined {
  if (b[0] === 0xff && b[1] === 0xd8) return "JPEG";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "PNG";
  if (text(b, 0, 4) === "RIFF" && text(b, 8, 12) === "WEBP") return "WEBP";
  return undefined;
}

function blocksOf(b: Uint8Array): Block[] {
  const format = sniffFormat(b);
  return format === "JPEG" ? jpegBlocks(b) : format === "PNG" ? pngBlocks(b) : format === "WEBP" ? webpBlocks(b) : [];
}

function total(blocks: Block[]): Found[] {
  return CLEAN_CATEGORIES.flatMap((category) => {
    const bytes = blocks.filter((x) => x.category === category).reduce((n, x) => n + x.end - x.start, 0);
    return bytes ? [{ category, bytes }] : [];
  });
}

/** Metadata categories present in the file, with their sizes. Empty for unsupported formats. */
export function findMetadata(bytes: Uint8Array): Found[] {
  return total(blocksOf(bytes));
}

/** Returns a copy of the file without the chosen metadata blocks. ICC profiles are always kept. */
export function cleanBytes(bytes: Uint8Array, remove: CleanCategory[]): { bytes: Uint8Array<ArrayBuffer>; removed: Found[] } {
  const format = sniffFormat(bytes);
  if (!format) throw new Error("Privacy Clean supports JPEG, PNG and WEBP.");
  const cut = blocksOf(bytes).filter((x) => remove.includes(x.category));
  const out = new Uint8Array(bytes.length - cut.reduce((n, x) => n + x.end - x.start, 0));
  let from = 0;
  let to = 0;
  for (const x of cut) {
    out.set(bytes.subarray(from, x.start), to);
    to += x.start - from;
    from = x.end;
  }
  out.set(bytes.subarray(from), to);

  if (format === "WEBP") {
    const view = new DataView(out.buffer);
    view.setUint32(4, out.length - 8, true); // RIFF size
    if (text(out, 12, 16) === "VP8X") {
      const gone = (c: CleanCategory) => cut.some((x) => x.category === c);
      if (gone("exif")) out[20] &= ~0x08; // keep the feature flags in step with the chunks
      if (gone("xmp")) out[20] &= ~0x04;
    }
  }
  return { bytes: out, removed: total(cut) };
}
