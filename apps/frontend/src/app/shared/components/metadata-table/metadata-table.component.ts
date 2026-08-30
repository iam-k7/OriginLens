import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MetadataValue = string | number | boolean | null | string[] | MetadataValue[] | { [k: string]: MetadataValue };

export interface MetadataSection {
  title: string;
  rows: Array<{ key: string; value: MetadataValue; sensitive?: boolean }>;
}

@Component({
  selector: 'ol-metadata-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (section of sections; track section.title) {
      <section class="md">
        <h3 class="md__title">{{ section.title }}</h3>
        @if (section.rows.length) {
          <table class="md__table">
            <tbody>
              @for (row of section.rows; track row.key) {
                <tr [class.md__row--sensitive]="row.sensitive">
                  <th scope="row" class="md__key">{{ row.key }}</th>
                  <td class="md__val">
                    <ng-container *ngTemplateOutlet="valueTpl; context: { $implicit: row.value }"></ng-container>
                    @if (row.sensitive) {
                      <span class="md__pill">PII</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="md__empty">No entries in this section.</p>
        }
      </section>
    }

    <ng-template #valueTpl let-v>
      @if (v === null || v === undefined) {
        <span class="md__val md__val--muted">—</span>
      } @else if (isArray(v)) {
        <span class="md__val">{{ v.join(', ') }}</span>
      } @else if (isObject(v)) {
        <pre class="md__json">{{ asJson(v) }}</pre>
      } @else {
        <span class="md__val">{{ v }}</span>
      }
    </ng-template>
  `,
  styles: [
    `
      .md { margin-bottom: var(--ol-sp-6); }
      .md__title {
        margin: 0 0 var(--ol-sp-3);
        font-size: var(--ol-fs-md);
        font-weight: var(--ol-fw-semibold);
        color: var(--ol-color-fg);
      }
      .md__table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--ol-color-border);
        border-radius: var(--ol-radius-md);
        overflow: hidden;
        background: var(--ol-color-bg);
      }
      .md__key,
      .md__val {
        padding: var(--ol-sp-3) var(--ol-sp-4);
        font-size: var(--ol-fs-sm);
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid var(--ol-color-border);
      }
      .md__key {
        width: 40%;
        color: var(--ol-color-fg-muted);
        font-weight: var(--ol-fw-medium);
        background: var(--ol-color-surface);
      }
      .md__val {
        color: var(--ol-color-fg);
        word-break: break-word;
      }
      .md__val--muted { color: var(--ol-color-fg-muted); }
      .md__row--sensitive .md__val { color: var(--ol-color-danger); }
      .md__pill {
        display: inline-block;
        margin-left: var(--ol-sp-2);
        padding: 0 var(--ol-sp-2);
        background: var(--ol-color-danger-soft);
        color: var(--ol-color-danger);
        font-size: var(--ol-fs-xs);
        font-weight: var(--ol-fw-semibold);
        border-radius: var(--ol-radius-sm);
        vertical-align: middle;
      }
      .md__json {
        margin: 0;
        font-family: var(--ol-font-mono);
        font-size: var(--ol-fs-xs);
        color: var(--ol-color-fg);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .md__empty {
        margin: 0;
        color: var(--ol-color-fg-muted);
        font-size: var(--ol-fs-sm);
      }
    `,
  ],
})
export class MetadataTableComponent {
  @Input() sections: MetadataSection[] = [];

  isArray(v: unknown): v is unknown[] {
    return Array.isArray(v);
  }
  isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }
  asJson(v: unknown): string {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
}
