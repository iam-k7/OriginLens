import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  FileDropzoneComponent,
  DropzoneFile,
  DropzoneConfig,
} from '../../shared/components/file-dropzone/file-dropzone.component';
import { UrlInputComponent } from '../../shared/components/url-input/url-input.component';
import { AnalysisScoreComponent } from '../../shared/components/analysis-score/analysis-score.component';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';
import { SignalListComponent } from '../../shared/components/signal-list/signal-list.component';
import { MetadataTableComponent, MetadataSection } from '../../shared/components/metadata-table/metadata-table.component';
import { ResultCardComponent } from '../../shared/components/result-card/result-card.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { AnalyzerService } from '../../core/services/analyzer.service';
import {
  ImageAnalysisResult,
  MetadataSections,
  MetadataValue,
} from '../../shared/models/analysis-result';

type Source = 'idle' | 'upload' | 'url';
type Status = 'idle' | 'loading' | 'done' | 'error';

const DROPZONE_CONFIG: DropzoneConfig = {
  accept: 'image/png,image/jpeg,image/webp,image/gif',
  maxBytes: 20 * 1024 * 1024,
  maxPixels: 200_000_000,
  label: 'Drop an image here',
  hint: 'or click to browse · paste with Ctrl+V',
};

@Component({
  selector: 'ol-analyzer-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FileDropzoneComponent,
    UrlInputComponent,
    AnalysisScoreComponent,
    ConfidenceBadgeComponent,
    SignalListComponent,
    MetadataTableComponent,
    ResultCardComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './analyzer-page.component.html',
  styleUrl: './analyzer-page.component.scss',
})
export class AnalyzerPageComponent {
  readonly dropzoneConfig = DROPZONE_CONFIG;
  readonly allowSvg = false;

  readonly source = signal<Source>('idle');
  readonly status = signal<Status>('idle');
  readonly result = signal<ImageAnalysisResult | null>(null);
  readonly error = signal<{ code?: string; message: string; retry_after?: number } | null>(null);

  readonly hasResult = computed(() => this.status() === 'done' && !!this.result());
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');

  readonly metadataSections = computed<MetadataSection[]>(() => {
    const r = this.result();
    if (!r) return [];
    return buildMetadataSections(r.metadata);
  });

  readonly limitationSignals = computed(() => {
    const r = this.result();
    if (!r) return [];
    return r.ai_signal.limitations.map((l) => ({ label: l }));
  });

  readonly c2paTone = computed<'success' | 'neutral' | 'warning'>(() => {
    const c = this.result()?.c2pa;
    if (!c) return 'neutral';
    if (c.present && c.issuer) return 'success';
    if (c.present) return 'warning';
    return 'neutral';
  });

  readonly c2paBadge = computed(() => {
    const c = this.result()?.c2pa;
    if (!c) return 'unknown';
    if (c.present && c.issuer) return 'signed';
    if (c.present) return 'unsigned';
    return 'no manifest';
  });

  readonly reverseTone = computed<'neutral' | 'warning'>(() => {
    return this.result()?.reverse_search?.available ? 'neutral' : 'warning';
  });

  readonly reverseBadge = computed(() => {
    const r = this.result()?.reverse_search;
    if (!r) return 'unknown';
    return r.available ? 'available' : 'unavailable';
  });

  constructor(private analyzer: AnalyzerService) {}

  onFileSelected(sel: DropzoneFile): void {
    this.source.set('upload');
    this.run(this.analyzer.analyzeImage(sel.file));
  }

  onFileCleared(): void {
    this.reset();
  }

  onUrlSubmitted(url: string): void {
    this.source.set('url');
    this.run(this.analyzer.analyzeUrl(url));
  }

  retry(): void {
    // No-op: the mock service always succeeds. Real impl will replay the
    // last request body once the backend is wired.
    this.reset();
  }

  formatBytes(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    return n.toLocaleString();
  }

  private run(obs: import('rxjs').Observable<ImageAnalysisResult>): void {
    this.status.set('loading');
    this.error.set(null);
    this.result.set(null);
    obs.subscribe({
      next: (r: ImageAnalysisResult) => {
        this.result.set(r);
        this.status.set('done');
      },
      error: (err: { code?: string; message?: string; retry_after?: number }) => {
        this.error.set({
          code: err?.code ?? 'INTERNAL',
          message: err?.message ?? 'Something went wrong while analyzing this image.',
          retry_after: err?.retry_after,
        });
        this.status.set('error');
      },
    });
  }

  private reset(): void {
    this.source.set('idle');
    this.status.set('idle');
    this.result.set(null);
    this.error.set(null);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const PII_KEYS = new Set([
  'gps', 'gpslatitude', 'gpslongitude', 'gpsposition',
  'artist', 'copyright', 'owner', 'by-line', 'byline',
  'creator', 'author', 'owner name', 'cameraownername',
  'serialnumber', 'lensserialnumber',
]);

function isPiiKey(k: string): boolean {
  return PII_KEYS.has(k.toLowerCase().replace(/[\s_-]/g, ''));
}

function buildMetadataSections(meta: MetadataSections): MetadataSection[] {
  const out: MetadataSection[] = [];
  for (const [name, raw] of Object.entries(meta)) {
    if (!raw) continue;
    const rows = Object.entries(raw)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => ({
        key: prettifyKey(k),
        value: v as MetadataValue,
        sensitive: isPiiKey(k),
      }));
    out.push({ title: name.toUpperCase(), rows });
  }
  return out;
}

function prettifyKey(k: string): string {
  // EXIF style: "DateTimeOriginal" -> "Date Time Original"
  return k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}
