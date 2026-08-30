import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ol-loading-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ls" role="status" aria-live="polite">
      <div class="ls__spinner" aria-hidden="true"></div>
      <p class="ls__label">{{ label }}</p>
    </div>
  `,
  styles: [
    `
      .ls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ol-sp-3);
        padding: var(--ol-sp-8);
        color: var(--ol-color-fg-muted);
      }
      .ls__spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--ol-color-border);
        border-top-color: var(--ol-color-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .ls__label {
        margin: 0;
        font-size: var(--ol-fs-sm);
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class LoadingStateComponent {
  @Input() label = 'Analyzing…';
}
