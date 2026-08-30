/**
 * Shared frontend types mirroring the backend API contracts.
 * Phase 1 placeholder shapes — finalize when the API is wired (Phase 3+).
 */

export type Confidence = 'low' | 'medium' | 'high';

export interface SignalItem {
  label: string;
  detail?: string;
  source?: string;
}

export interface AiSignal {
  score: number;            // 0..1
  confidence: Confidence;
  signals: SignalItem[];
  explanation: string;
  limitations: string[];
}

export interface TechnicalInfo {
  width: number;
  height: number;
  format: string;
  size_bytes: number;
  mode?: string;
}

export type MetadataValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | MetadataValue[]
  | { [k: string]: MetadataValue };

export interface MetadataSections {
  exif?: Record<string, MetadataValue>;
  iptc?: Record<string, MetadataValue>;
  xmp?: Record<string, MetadataValue>;
  [k: string]: Record<string, MetadataValue> | undefined;
}

export interface C2paInfo {
  present: boolean;
  issuer?: string;
  signed_at?: string;
  claim_generator?: string;
  ingredients?: string[];
}

export interface ReverseSearchInfo {
  available: boolean;
  reason?: string;
  matches?: Array<{ url: string; similarity?: number; source?: string }>;
}

export interface ImageAnalysisResult {
  job_id: string;
  ai_signal: AiSignal;
  metadata: MetadataSections;
  c2pa: C2paInfo;
  reverse_search: ReverseSearchInfo;
  technical: TechnicalInfo;
  model?: string;
  provider?: string;
  source: 'upload' | 'url';
}

export interface TextAnalysisResult {
  job_id: string;
  ai_signal: AiSignal;
  signals: SignalItem[];
  explanation: string;
  limitations: string[];
  model?: string;
  provider?: string;
}

export interface TextRewriteResult {
  rewritten: string;
  notes: string[];
  model?: string;
  provider?: string;
}

export interface ApiError {
  code: string;
  message: string;
  retry_after?: number;
}
