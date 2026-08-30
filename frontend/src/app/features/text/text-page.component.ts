import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { ResultCardComponent } from '../../shared/components/result-card/result-card.component';
import { AnalysisScoreComponent } from '../../shared/components/analysis-score/analysis-score.component';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';
import { SignalListComponent } from '../../shared/components/signal-list/signal-list.component';
import {
  TextIntelligenceService,
  AnalysisMode,
} from '../../core/services/text-intelligence.service';
import {
  TextAnalysisResult,
  TextRewriteResult,
} from '../../shared/models/analysis-result';

type Status = 'idle' | 'loading' | 'done' | 'error';
type Tab = 'analyze' | 'rewrite';

@Component({
  selector: 'ol-text-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
    ResultCardComponent,
    AnalysisScoreComponent,
    ConfidenceBadgeComponent,
    SignalListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './text-page.component.html',
  styleUrl: './text-page.component.scss',
})
export class TextPageComponent {
  readonly text = signal('');
  readonly tab = signal<Tab>('analyze');
  readonly mode = signal<AnalysisMode>('standard');
  readonly tone = signal('neutral');
  readonly status = signal<Status>('idle');
  readonly error = signal<{ code?: string; message: string; retry_after?: number } | null>(null);

  readonly analysis = signal<TextAnalysisResult | null>(null);
  readonly rewrite = signal<TextRewriteResult | null>(null);

  readonly limitationSignals = computed(() => {
    const a = this.analysis();
    if (!a) return [];
    return a.ai_signal.limitations.map((l) => ({ label: l }));
  });

  readonly rewriteNotes = computed(() => {
    const r = this.rewrite();
    if (!r) return [];
    return r.notes.map((n) => ({ label: n }));
  });

  readonly wordCount = computed(() => {
    const t = this.text().trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  });
  readonly charCount = computed(() => this.text().length);
  readonly canAnalyze = computed(() => this.wordCount() >= 5 && this.status() !== 'loading');
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isError = computed(() => this.status() === 'error');
  readonly showResult = computed(() => this.status() === 'done' && (this.analysis() || this.rewrite()));

  readonly tones = ['neutral', 'clear', 'friendly', 'formal', 'concise'];

  constructor(private svc: TextIntelligenceService) {}

  setTab(t: Tab): void {
    this.tab.set(t);
    this.resetResult();
  }

  setMode(m: AnalysisMode): void {
    this.mode.set(m);
  }

  onTextInput(value: string): void {
    this.text.set(value);
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      this.flashError('UNSUPPORTED_FILE', 'Please upload a .txt file.');
      input.value = '';
      return;
    }
    if (file.size > 1_000_000) {
      this.flashError('FILE_TOO_LARGE', 'Text files must be under 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.text.set(result);
      input.value = '';
    };
    reader.onerror = () => {
      this.flashError('READ_ERROR', 'Could not read the file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  clear(): void {
    this.text.set('');
    this.resetResult();
  }

  run(): void {
    const t = this.text();
    if (!t.trim() || t.trim().split(/\s+/).length < 5) return;

    this.status.set('loading');
    this.error.set(null);
    this.analysis.set(null);
    this.rewrite.set(null);

    const obs: import('rxjs').Observable<TextAnalysisResult | TextRewriteResult> =
      this.tab() === 'analyze'
        ? this.svc.analyze(t, this.mode())
        : this.svc.rewrite(t, this.tone());

    obs.subscribe({
      next: (res: TextAnalysisResult | TextRewriteResult) => {
        if ('rewritten' in res) {
          this.rewrite.set(res as TextRewriteResult);
        } else {
          this.analysis.set(res as TextAnalysisResult);
        }
        this.status.set('done');
      },
      error: (err: { code?: string; message?: string; retry_after?: number }) => {
        this.error.set({
          code: err?.code ?? 'INTERNAL',
          message: err?.message ?? 'Something went wrong while analyzing the text.',
          retry_after: err?.retry_after,
        });
        this.status.set('error');
      },
    });
  }

  private resetResult(): void {
    this.analysis.set(null);
    this.rewrite.set(null);
    this.status.set('idle');
    this.error.set(null);
  }

  private flashError(code: string, message: string): void {
    this.error.set({ code, message });
    this.status.set('error');
  }
}
