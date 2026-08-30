import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SignalItem {
  label: string;
  detail?: string;
  source?: string;
}

@Component({
  selector: 'ol-signal-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (signals.length) {
      <ul class="sigs">
        @for (s of signals; track s.label) {
          <li class="sigs__item">
            <span class="sigs__dot" aria-hidden="true">•</span>
            <div class="sigs__body">
              <p class="sigs__label">{{ s.label }}</p>
              @if (s.detail) {
                <p class="sigs__detail">{{ s.detail }}</p>
              }
              @if (s.source) {
                <p class="sigs__source">Source: {{ s.source }}</p>
              }
            </div>
          </li>
        }
      </ul>
    } @else {
      <p class="sigs__empty">No notable signals detected.</p>
    }
  `,
  styles: [
    `
      .sigs {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--ol-sp-3);
      }
      .sigs__item {
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: var(--ol-sp-2);
        align-items: start;
      }
      .sigs__dot {
        color: var(--ol-color-primary);
        font-size: var(--ol-fs-lg);
        line-height: 1;
      }
      .sigs__body { min-width: 0; }
      .sigs__label {
        margin: 0;
        font-weight: var(--ol-fw-medium);
      }
      .sigs__detail,
      .sigs__source {
        margin: var(--ol-sp-1) 0 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
      .sigs__empty {
        margin: 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
    `,
  ],
})
export class SignalListComponent {
  @Input() signals: SignalItem[] = [];
}
