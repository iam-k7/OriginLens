import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type Confidence = 'low' | 'medium' | 'high';

@Component({
  selector: 'ol-confidence-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge--' + level" [attr.aria-label]="'Confidence: ' + level">
      <span class="badge__dot" aria-hidden="true"></span>
      <span class="badge__text">{{ level }}</span>
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--ol-sp-2);
        padding: 2px var(--ol-sp-3);
        border-radius: var(--ol-radius-full);
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
        text-transform: capitalize;
        border: 1px solid transparent;
      }
      .badge__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }
      .badge--low {
        background: var(--ol-color-warning-soft);
        color: var(--ol-color-warning);
        border-color: var(--ol-color-warning);
      }
      .badge--low .badge__dot { background: var(--ol-color-warning); }
      .badge--medium {
        background: var(--ol-color-info-soft);
        color: var(--ol-color-info);
        border-color: var(--ol-color-info);
      }
      .badge--medium .badge__dot { background: var(--ol-color-info); }
      .badge--high {
        background: var(--ol-color-success-soft);
        color: var(--ol-color-success);
        border-color: var(--ol-color-success);
      }
      .badge--high .badge__dot { background: var(--ol-color-success); }
    `,
  ],
})
export class ConfidenceBadgeComponent {
  @Input({ required: true }) level!: Confidence;
}
