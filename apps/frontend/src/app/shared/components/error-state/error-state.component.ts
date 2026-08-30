import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ol-error-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="es" role="alert">
      <p class="es__code" *ngIf="code">{{ code }}</p>
      <p class="es__message">{{ message }}</p>
      @if (retryAfter !== undefined) {
        <p class="es__retry">Try again in {{ retryAfter }}s.</p>
      }
    </div>
  `,
  styles: [
    `
      .es {
        border: 1px solid var(--ol-color-danger);
        background: var(--ol-color-danger-soft);
        color: var(--ol-color-danger);
        border-radius: var(--ol-radius-md);
        padding: var(--ol-sp-4) var(--ol-sp-5);
      }
      .es__code {
        margin: 0 0 var(--ol-sp-1);
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .es__message {
        margin: 0;
        color: var(--ol-color-fg);
      }
      .es__retry {
        margin: var(--ol-sp-2) 0 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
    `,
  ],
})
export class ErrorStateComponent {
  @Input({ required: true }) message!: string;
  @Input() code?: string;
  @Input() retryAfter?: number;
}
