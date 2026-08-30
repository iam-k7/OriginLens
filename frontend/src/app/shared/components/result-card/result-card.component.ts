import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ol-result-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="rc">
      <header class="rc__head">
        <h2 class="rc__title">{{ title }}</h2>
        @if (badge) {
          <span class="rc__badge" [class]="'rc__badge--' + badgeTone">{{ badge }}</span>
        }
      </header>
      <div class="rc__body">
        <ng-content></ng-content>
      </div>
      @if (footnote) {
        <p class="rc__footnote">{{ footnote }}</p>
      }
    </article>
  `,
  styles: [
    `
      .rc {
        background: var(--ol-color-bg);
        border: 1px solid var(--ol-color-border);
        border-radius: var(--ol-radius-lg);
        padding: var(--ol-sp-6);
      }
      .rc__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ol-sp-3);
        margin-bottom: var(--ol-sp-4);
      }
      .rc__title {
        margin: 0;
        font-size: var(--ol-fs-lg);
        font-weight: var(--ol-fw-semibold);
      }
      .rc__badge {
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px var(--ol-sp-2);
        border-radius: var(--ol-radius-sm);
        border: 1px solid transparent;
      }
      .rc__badge--neutral  { background: var(--ol-color-surface-strong); color: var(--ol-color-fg-muted); }
      .rc__badge--success  { background: var(--ol-color-success-soft); color: var(--ol-color-success); }
      .rc__badge--warning  { background: var(--ol-color-warning-soft); color: var(--ol-color-warning); }
      .rc__badge--danger   { background: var(--ol-color-danger-soft); color: var(--ol-color-danger); }
      .rc__badge--info     { background: var(--ol-color-info-soft); color: var(--ol-color-info); }
      .rc__body { color: var(--ol-color-fg); }
      .rc__footnote {
        margin: var(--ol-sp-4) 0 0;
        padding-top: var(--ol-sp-4);
        border-top: 1px dashed var(--ol-color-border);
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
    `,
  ],
})
export class ResultCardComponent {
  @Input({ required: true }) title!: string;
  @Input() badge?: string;
  @Input() badgeTone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' = 'neutral';
  @Input() footnote?: string;
}
