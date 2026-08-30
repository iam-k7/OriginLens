import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ol-usage-meter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="um">
      <div class="um__row">
        <span class="um__label">{{ label }}</span>
        <span class="um__count">{{ used }} / {{ limit }}</span>
      </div>
      <div class="um__bar" role="progressbar"
           [attr.aria-valuenow]="used" aria-valuemin="0"
           [attr.aria-valuemax]="limit"
           [attr.aria-label]="label">
        <span class="um__fill" [class.um__fill--full]="isFull"
              [style.width.%]="percent"></span>
      </div>
    </div>
  `,
  styles: [
    `
      .um { display: flex; flex-direction: column; gap: var(--ol-sp-2); }
      .um__row {
        display: flex;
        justify-content: space-between;
        font-size: var(--ol-fs-sm);
      }
      .um__label { color: var(--ol-color-fg-muted); }
      .um__count { color: var(--ol-color-fg); font-weight: var(--ol-fw-medium); }
      .um__bar {
        height: 6px;
        background: var(--ol-color-surface-strong);
        border-radius: var(--ol-radius-full);
        overflow: hidden;
      }
      .um__fill {
        display: block;
        height: 100%;
        background: var(--ol-color-primary);
        transition: width var(--ol-dur-base) var(--ol-ease);
      }
      .um__fill--full { background: var(--ol-color-danger); }
    `,
  ],
})
export class UsageMeterComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) used!: number;
  @Input({ required: true }) limit!: number;

  get percent(): number {
    if (this.limit <= 0) return 0;
    return Math.min(100, Math.round((this.used / this.limit) * 100));
  }

  get isFull(): boolean {
    return this.used >= this.limit;
  }
}
