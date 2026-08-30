import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ol-analysis-score',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="score">
      <div class="score__label" *ngIf="label">{{ label }}</div>
      <div class="score__row">
        <span class="score__value" [class]="'score__value--' + tone">{{ percent }}%</span>
        <span class="score__caption" *ngIf="caption">{{ caption }}</span>
      </div>
      <div
        class="score__bar"
        role="progressbar"
        [attr.aria-valuenow]="percent"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label || 'Score'"
      >
        <span class="score__fill" [class]="'score__fill--' + tone" [style.width.%]="percent"></span>
      </div>
      <p class="score__disclaimer" *ngIf="showDisclaimer">
        AI-generation signal is probabilistic and may produce false positives
        and false negatives.
      </p>
    </div>
  `,
  styles: [
    `
      .score { display: flex; flex-direction: column; gap: var(--ol-sp-2); }
      .score__label {
        font-size: var(--ol-fs-sm);
        color: var(--ol-color-fg-muted);
        font-weight: var(--ol-fw-medium);
      }
      .score__row {
        display: flex;
        align-items: baseline;
        gap: var(--ol-sp-3);
      }
      .score__value {
        font-size: var(--ol-fs-4xl);
        font-weight: var(--ol-fw-bold);
        line-height: 1;
      }
      .score__value--neutral  { color: var(--ol-color-fg); }
      .score__value--positive { color: var(--ol-color-success); }
      .score__value--warning  { color: var(--ol-color-warning); }
      .score__value--danger   { color: var(--ol-color-danger); }
      .score__caption {
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
      .score__bar {
        width: 100%;
        height: 8px;
        background: var(--ol-color-surface-strong);
        border-radius: var(--ol-radius-full);
        overflow: hidden;
      }
      .score__fill {
        display: block;
        height: 100%;
        border-radius: var(--ol-radius-full);
        transition: width var(--ol-dur-slow) var(--ol-ease);
      }
      .score__fill--neutral  { background: var(--ol-color-border-strong); }
      .score__fill--positive { background: var(--ol-color-success); }
      .score__fill--warning  { background: var(--ol-color-warning); }
      .score__fill--danger   { background: var(--ol-color-danger); }
      .score__disclaimer {
        margin: var(--ol-sp-2) 0 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-xs);
      }
    `,
  ],
})
export class AnalysisScoreComponent {
  /** 0..1 */
  @Input() value = 0;
  @Input() label?: string;
  @Input() caption?: string;
  @Input() tone: 'neutral' | 'positive' | 'warning' | 'danger' = 'neutral';
  @Input() showDisclaimer = true;

  get percent(): number {
    return Math.round(Math.max(0, Math.min(1, this.value)) * 100);
  }
}
