import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ol-url-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui" [class.ui--error]="!!error()">
      <label class="ui__label" for="ol-url-input">Analyze image URL</label>
      <div class="ui__row">
        <input
          id="ol-url-input"
          type="url"
          class="ui__input"
          [(ngModel)]="value"
          [placeholder]="placeholder"
          (keydown.enter)="submit()"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          type="button"
          class="ui__btn"
          (click)="submit()"
          [disabled]="!value.trim()"
        >
          Fetch &amp; analyze
        </button>
      </div>
      @if (error(); as e) {
        <p class="ui__error" role="alert">{{ e }}</p>
      } @else {
        <p class="ui__hint">Public image URL only · HTTPS preferred · max 25 MB</p>
      }
    </div>
  `,
  styles: [
    `
      .ui { display: flex; flex-direction: column; gap: var(--ol-sp-2); }
      .ui__label {
        font-size: var(--ol-fs-sm);
        font-weight: var(--ol-fw-medium);
        color: var(--ol-color-fg);
      }
      .ui__row {
        display: flex;
        gap: var(--ol-sp-2);
      }
      .ui__input {
        flex: 1;
        padding: var(--ol-sp-3) var(--ol-sp-4);
        border: 1px solid var(--ol-color-border-strong);
        border-radius: var(--ol-radius-md);
        font-size: var(--ol-fs-md);
        background: var(--ol-color-bg);
        color: var(--ol-color-fg);
      }
      .ui__input:focus-visible {
        outline: 2px solid var(--ol-color-primary);
        outline-offset: 2px;
        border-color: var(--ol-color-primary);
      }
      .ui__btn {
        padding: 0 var(--ol-sp-5);
        background: var(--ol-color-fg);
        color: var(--ol-color-bg);
        border: 1px solid var(--ol-color-fg);
        border-radius: var(--ol-radius-md);
        font-weight: var(--ol-fw-semibold);
        font-size: var(--ol-fs-sm);
        white-space: nowrap;
      }
      .ui__btn:hover:not(:disabled) {
        background: #000;
        border-color: #000;
      }
      .ui__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ui__hint {
        margin: 0;
        font-size: var(--ol-fs-xs);
        color: var(--ol-color-fg-muted);
      }
      .ui__error {
        margin: 0;
        font-size: var(--ol-fs-sm);
        color: var(--ol-color-danger);
      }
      .ui--error .ui__input { border-color: var(--ol-color-danger); }
      @media (max-width: 480px) {
        .ui__row { flex-direction: column; }
        .ui__btn { padding: var(--ol-sp-3); }
      }
    `,
  ],
})
export class UrlInputComponent {
  @Input() placeholder = 'https://example.com/image.jpg';
  @Output() urlSubmitted = new EventEmitter<string>();

  value = '';
  readonly error = signal<string | null>(null);

  submit(): void {
    const v = this.value.trim();
    if (!v) return;
    try {
      const u = new URL(v);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        this.error.set('Only http:// and https:// URLs are allowed.');
        return;
      }
    } catch {
      this.error.set('That does not look like a valid URL.');
      return;
    }
    this.error.set(null);
    this.urlSubmitted.emit(v);
  }
}
