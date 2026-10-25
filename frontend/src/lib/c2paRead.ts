/**
 * Reads C2PA Content Credentials in the browser with the official SDK (the same engine as the
 * c2pa-python Reader used in the reference article, compiled to WebAssembly). The 9 MB engine
 * loads only when a file actually carries a C2PA marker.
 */
import { findMetadata, sniffFormat } from "./cleanImage";

export type Credentials = {
  present: boolean;
  error?: string;
  generator?: string;
  title?: string;
  issuer?: string;
  signedAt?: string;
  sourceTypes: string[];
  validation?: string;
  issues: string[];
};

type Manifest = {
  claim_generator?: string;
  claim_generator_info?: { name?: string; version?: string }[];
  title?: string;
  signature_info?: { issuer?: string; time?: string };
  assertions?: { label: string; data?: { actions?: { digitalSourceType?: string }[] } }[];
};
type Store = {
  active_manifest?: string | null;
  manifests?: Record<string, Manifest>;
  validation_state?: string;
  validation_status?: { code?: string }[];
};

const MIME = { JPEG: "image/jpeg", PNG: "image/png", WEBP: "image/webp" } as const;

let engine: ReturnType<typeof start> | undefined;
async function start() {
  const { createC2pa, Reader } = await import("@contentauth/c2pa-web");
  const c2pa = await createC2pa({ wasmSrc: new URL("@contentauth/c2pa-web/resources/c2pa.wasm", import.meta.url).toString() });
  return { c2pa, Reader };
}

export async function readCredentials(file: File): Promise<Credentials> {
  const none: Credentials = { present: false, sourceTypes: [], issues: [] };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniffFormat(bytes);
  if (!format || !findMetadata(bytes).some((f) => f.category === "c2pa")) return none;

  const present: Credentials = { ...none, present: true };
  try {
    engine ??= start().catch((e) => { engine = undefined; throw e; });
    const { c2pa, Reader } = await engine;
    const reader = await Reader.fromBlob(c2pa, MIME[format], file);
    if (!reader) return { ...present, error: "A Content Credentials marker is present, but no manifest could be read." };
    try {
      const store = (await reader.manifestStore()) as unknown as Store;
      const m = store.manifests?.[store.active_manifest ?? ""];
      const info = m?.claim_generator_info?.[0];
      return {
        ...present,
        generator: info?.name ? [info.name, info.version].filter(Boolean).join(" ") : m?.claim_generator,
        title: m?.title,
        issuer: m?.signature_info?.issuer,
        signedAt: m?.signature_info?.time,
        // Every manifest in the file's history: an AI step is often one edit back (e.g. Google tools add a watermark manifest on top).
        sourceTypes: [...new Set(Object.values(store.manifests ?? {})
          .flatMap((mf) => mf.assertions ?? [])
          .filter((a) => a.label.startsWith("c2pa.actions"))
          .flatMap((a) => a.data?.actions ?? [])
          .flatMap((a) => (a.digitalSourceType ? [a.digitalSourceType] : [])))],
        validation: store.validation_state,
        issues: (store.validation_status ?? []).flatMap((s) => (s.code ? [s.code] : [])).slice(0, 20),
      };
    } finally {
      await reader.free();
    }
  } catch (e) {
    return { ...present, error: `Content Credentials are present but could not be read here (${e instanceof Error ? e.message : "unknown error"}).` };
  }
}
