/**
 * Experimental pixel check: the Community Forensics ViT-S/384 model (OwensLab/commfor-model-384, MIT),
 * converted to ONNX and run in the browser. The image never leaves the device.
 */
// Types only here: the runtime is imported on first use, since it cannot be evaluated during server rendering.
import type * as Ort from "onnxruntime-web/wasm";
import { resizeBilinear } from "./resample";

const MODEL_URL = "/models/commfor-vit-s-384.onnx";
export const MODEL_MB = 87;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let session: Promise<{ ort: typeof Ort; session: Ort.InferenceSession }> | null = null;

async function download(onProgress: (fraction: number) => void): Promise<Uint8Array> {
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error(`Could not download the model (HTTP ${res.status}).`);
  const total = Number(res.headers.get("content-length")) || MODEL_MB * 1e6;
  const out = new Uint8Array(total);
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.set(value, got);
    got += value.length;
    onProgress(Math.min(got / total, 1));
  }
  return out.subarray(0, got);
}

function load(onProgress: (fraction: number) => void) {
  session ??= (async () => {
    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.wasmPaths = { wasm: new URL("onnxruntime-web/ort-wasm-simd-threaded.wasm", import.meta.url).href };
    const bytes = await download(onProgress);
    return { ort, session: await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] }) };
  })().catch((e) => { session = null; throw e; });
  return session;
}

// Python's round(): halves go to the even neighbour.
const roundHalfEven = (v: number) => { const f = Math.floor(v); const d = v - f; return d > 0.5 || (d === 0.5 && f % 2 === 1) ? f + 1 : f; };

/** The authors' test transform (torchvision Resize(440) on a PIL image, CenterCrop(384), ImageNet normalisation), as CHW float32. */
async function toTensor(ort: typeof Ort, file: File): Promise<Ort.Tensor> {
  // No colour-profile conversion: PIL feeds the model the file's raw RGB values.
  const bitmap = await createImageBitmap(file, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const { width: sw, height: sh } = bitmap;
  const full = new OffscreenCanvas(sw, sh).getContext("2d")!;
  full.drawImage(bitmap, 0, 0);
  bitmap.close();
  const src = full.getImageData(0, 0, sw, sh).data;

  // torchvision keeps the aspect ratio and truncates the long side.
  const [w, h] = sw <= sh ? [440, Math.trunc((440 * sh) / sw)] : [Math.trunc((440 * sw) / sh), 440];
  const resized = resizeBilinear(src, sw, sh, w, h);
  const top = roundHalfEven((h - 384) / 2), left = roundHalfEven((w - 384) / 2);

  const n = 384 * 384, chw = new Float32Array(3 * n);
  for (let y = 0; y < 384; y++) {
    for (let x = 0; x < 384; x++) {
      const p = ((top + y) * w + left + x) * 4;
      for (let c = 0; c < 3; c++) chw[c * n + y * 384 + x] = (resized[p + c] / 255 - MEAN[c]) / STD[c];
    }
  }
  return new ort.Tensor("float32", chw, [1, 3, 384, 384]);
}

/** Probability (0–1) that the picture is AI-generated, according to the model. */
export async function pixelAiScore(file: File, onProgress: (fraction: number) => void = () => {}): Promise<number> {
  const { ort, session: s } = await load(onProgress);
  const { logit } = await s.run({ pixel_values: await toTensor(ort, file) });
  return 1 / (1 + Math.exp(-(logit.data as Float32Array)[0]));
}
