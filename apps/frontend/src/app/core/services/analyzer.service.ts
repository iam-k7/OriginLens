import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ImageAnalysisResult,
  MetadataSections,
  C2paInfo,
  ReverseSearchInfo,
  TechnicalInfo,
  AiSignal,
} from '../../shared/models/analysis-result';

/**
 * Analyzer service — Phase 2 mock implementation.
 *
 * The mock is deterministic and shaped to match the real backend contract
 * (see docs/architecture.md §5 API surface). When the backend is wired in
 * Phase 3, replace `analyzeImage` and `analyzeUrl` with HttpClient calls to
 * POST /api/v1/analyzer/image and POST /api/v1/analyzer/url. The output
 * shape will not change.
 */
@Injectable({ providedIn: 'root' })
export class AnalyzerService {
  analyzeImage(file: File): Observable<ImageAnalysisResult> {
    return of(this.buildMock(file, 'upload')).pipe(delay(900));
  }

  analyzeUrl(url: string): Observable<ImageAnalysisResult> {
    return of(this.buildMockForUrl(url)).pipe(delay(900));
  }

  // ─── Mock construction ──────────────────────────────────────────────

  private buildMock(file: File, source: 'upload' | 'url'): ImageAnalysisResult {
    const bytes = file.size || 0;
    const ext = (file.type || 'image/jpeg').split('/')[1] ?? 'jpeg';
    const technical: TechnicalInfo = {
      width: 1024,
      height: 1024,
      format: ext,
      size_bytes: bytes,
      mode: 'RGB',
    };

    // Stable "score" derived from filename length so the UI is reproducible
    const seed = (file.name?.length ?? 7) % 100;
    const score = 0.3 + (seed / 100) * 0.6; // 0.30..0.90
    const confidence: 'low' | 'medium' | 'high' = score > 0.66 ? 'medium' : 'low';

    const ai: AiSignal = {
      score,
      confidence,
      signals: [
        { label: 'Metadata indicators', detail: 'No C2PA manifest found.', source: 'C2PA' },
        { label: 'Image characteristics', detail: 'Texture statistics within mixed-source range.' },
        { label: 'Provenance information', detail: 'No software tag for known generators detected.' },
      ],
      explanation:
        'Signals are consistent with mixed or unknown origin. The model did not ' +
        'find strong evidence for any specific generator.',
      limitations: [
        'Probabilistic; false positives and false negatives are possible.',
        'Detection is most reliable when provenance or metadata is present.',
        'A clean image does not prove human authorship.',
      ],
    };

    const metadata: MetadataSections = {
      exif: {
        Make: 'Unknown',
        Model: 'Unknown',
        Software: 'Unknown',
        DateTime: null,
      },
      iptc: {
        'By-line': null,
        Copyright: null,
      },
      xmp: {
        Creator: null,
        'Creator Tool': null,
      },
    };

    const c2pa: C2paInfo = {
      present: false,
    };

    const reverse: ReverseSearchInfo = {
      available: false,
      reason: 'provider_not_configured',
    };

    return {
      job_id: cryptoRandomId(),
      ai_signal: ai,
      metadata,
      c2pa,
      reverse_search: reverse,
      technical,
      model: 'heuristic-mock',
      provider: 'local',
      source,
    };
  }

  private buildMockForUrl(url: string): ImageAnalysisResult {
    // For URL we don't have a File, so synthesize a placeholder name
    const fake = new File([new Uint8Array(0)], filenameFromUrl(url), {
      type: 'image/jpeg',
    });
    return this.buildMock(fake, 'url');
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'job-' + Math.random().toString(36).slice(2, 10);
}

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.split('/').filter(Boolean).pop() || 'remote.jpg';
  } catch {
    return 'remote.jpg';
  }
}
