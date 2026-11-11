/**
 * Pillow's BILINEAR resize (Image.resize(..., Image.BILINEAR)), ported so the browser feeds the pixel model
 * exactly what torchvision/PIL fed it: browser canvas scaling differs enough to move scores by tens of points.
 * Same filter, same fixed-point rounding, horizontal pass first, 8-bit result between passes.
 */
const PRECISION_BITS = 32 - 8 - 2;
const ONE = 2 ** PRECISION_BITS;
const HALF = 2 ** (PRECISION_BITS - 1);

const bilinear = (x: number) => { x = Math.abs(x); return x < 1 ? 1 - x : 0; };
const clip8 = (v: number) => { const r = Math.floor(v / ONE); return r < 0 ? 0 : r > 255 ? 255 : r; };

/** For each output index: the first input index and its fixed-point weights. */
function coefficients(inSize: number, outSize: number) {
  const scale = inSize / outSize;
  const filterscale = Math.max(scale, 1);
  const support = filterscale; // bilinear support is 1.0
  const out: { min: number; k: number[] }[] = [];
  for (let xx = 0; xx < outSize; xx++) {
    const center = (xx + 0.5) * scale;
    const min = Math.max(Math.trunc(center - support + 0.5), 0);
    const max = Math.min(Math.trunc(center + support + 0.5), inSize) - min;
    const w: number[] = [];
    let sum = 0;
    for (let x = 0; x < max; x++) { const v = bilinear((x + min - center + 0.5) / filterscale); w.push(v); sum += v; }
    const k = w.map((v) => { const n = sum ? v / sum : 0; return Math.trunc(n * ONE + (n < 0 ? -0.5 : 0.5)); });
    out.push({ min, k });
  }
  return out;
}

/** Resize interleaved 8-bit pixels with `channels` per pixel (the first three are resized; any 4th is left 255). */
export function resizeBilinear(src: ArrayLike<number>, sw: number, sh: number, dw: number, dh: number, channels = 4): Uint8ClampedArray {
  const cx = coefficients(sw, dw), cy = coefficients(sh, dh);
  const mid = new Uint8ClampedArray(dw * sh * channels);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const { min, k } = cx[x];
      for (let c = 0; c < 3; c++) {
        let ss = HALF;
        for (let i = 0; i < k.length; i++) ss += src[(y * sw + min + i) * channels + c] * k[i];
        mid[(y * dw + x) * channels + c] = clip8(ss);
      }
      if (channels === 4) mid[(y * dw + x) * 4 + 3] = 255;
    }
  }
  const out = new Uint8ClampedArray(dw * dh * channels);
  for (let y = 0; y < dh; y++) {
    const { min, k } = cy[y];
    for (let x = 0; x < dw; x++) {
      for (let c = 0; c < 3; c++) {
        let ss = HALF;
        for (let i = 0; i < k.length; i++) ss += mid[((min + i) * dw + x) * channels + c] * k[i];
        out[(y * dw + x) * channels + c] = clip8(ss);
      }
      if (channels === 4) out[(y * dw + x) * 4 + 3] = 255;
    }
  }
  return out;
}
