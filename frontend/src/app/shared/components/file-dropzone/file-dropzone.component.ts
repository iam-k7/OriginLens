import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropzoneFile {
  file: File;
  previewUrl: string;
}

export interface DropzoneConfig {
  accept: string;        // comma-separated, e.g. "image/png,image/jpeg"
  maxBytes: number;
  maxPixels?: number;
  label: string;
  hint?: string;
}

const DEFAULT_CONFIG: DropzoneConfig = {
  accept: 'image/png,image/jpeg,image/webp,image/gif',
  maxBytes: 20 * 1024 * 1024,
  maxPixels: 200_000_000,
  label: 'Drop an image here',
  hint: 'or click to browse',
};

@Component({
  selector: 'ol-file-dropzone',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="dz"
      [class.dz--active]="isDragging()"
      [class.dz--error]="error()"
      [class.dz--has-file]="!!selected()"
      role="button"
      tabindex="0"
      [attr.aria-label]="config.label"
      (click)="openPicker()"
      (keydown.enter)="openPicker()"
      (keydown.space)="openPicker(); $event.preventDefault()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <input
        #input
        type="file"
        class="dz__input"
        [attr.accept]="config.accept"
        (change)="onFileInput($event)"
      />

      @if (selected(); as sel) {
        <div class="dz__preview">
          <img [src]="sel.previewUrl" alt="Selected image preview" class="dz__img" />
          <div class="dz__meta">
            <p class="dz__name">{{ sel.file.name }}</p>
            <p class="dz__size">{{ formatBytes(sel.file.size) }}</p>
          </div>
          <button
            type="button"
            class="dz__clear"
            (click)="clear($event)"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      } @else {
        <div class="dz__placeholder">
          <div class="dz__icon" aria-hidden="true">⤓</div>
          <p class="dz__title">{{ config.label }}</p>
          @if (config.hint) {
            <p class="dz__hint">{{ config.hint }}</p>
          }
          <p class="dz__formats">PNG · JPG · WEBP · GIF{{ allowSvg ? ' · SVG' : '' }}</p>
          <p class="dz__limit">Up to {{ formatBytes(config.maxBytes) }}</p>
        </div>
      }

      @if (error(); as err) {
        <p class="dz__error" role="alert">{{ err }}</p>
      }
    </div>
  `,
  styleUrl: './file-dropzone.component.scss',
})
export class FileDropzoneComponent {
  @Input() config: DropzoneConfig = DEFAULT_CONFIG;
  @Input() allowSvg = false;

  @Output() fileSelected = new EventEmitter<DropzoneFile>();
  @Output() cleared = new EventEmitter<void>();

  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  readonly isDragging = signal(false);
  readonly selected = signal<DropzoneFile | null>(null);
  readonly error = signal<string | null>(null);

  // Listen for pastes at the document level so the user can paste anywhere
  @HostListener('document:paste', ['$event'])
  onDocumentPaste(event: ClipboardEvent) {
    const item = event.clipboardData?.items?.[0];
    if (!item || item.kind !== 'file') return;
    const file = item.getAsFile();
    if (!file) return;
    event.preventDefault();
    void this.acceptFile(file);
  }

  openPicker(): void {
    if (this.selected()) return; // don't reopen when preview is shown
    this.input.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.acceptFile(file);
  }

  onFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) void this.acceptFile(file);
    target.value = ''; // allow re-selecting same file
  }

  clear(event: Event): void {
    event.stopPropagation();
    const prev = this.selected();
    if (prev) URL.revokeObjectURL(prev.previewUrl);
    this.selected.set(null);
    this.error.set(null);
    this.cleared.emit();
  }

  formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  private async acceptFile(file: File): Promise<void> {
    this.error.set(null);

    // Type validation
    const acceptList = this.config.accept.split(',').map((s) => s.trim().toLowerCase());
    if (!acceptList.includes(file.type.toLowerCase()) && !(this.allowSvg && file.type === 'image/svg+xml')) {
      this.error.set(`Unsupported file type: ${file.type || 'unknown'}.`);
      return;
    }

    // SVG safety default
    if (file.type === 'image/svg+xml' && !this.allowSvg) {
      this.error.set('SVG uploads are disabled by default for safety.');
      return;
    }

    // Size validation
    if (file.size > this.config.maxBytes) {
      this.error.set(`File too large. Max ${this.formatBytes(this.config.maxBytes)}.`);
      return;
    }

    // Pixel-count validation for raster images
    if (file.type !== 'image/svg+xml' && this.config.maxPixels) {
      try {
        const dims = await this.readDimensions(file);
        if (dims.width * dims.height > this.config.maxPixels) {
          this.error.set(
            `Image dimensions too large (${dims.width}×${dims.height}). ` +
              `Max ${this.config.maxPixels.toLocaleString()} pixels.`,
          );
          return;
        }
      } catch {
        this.error.set('Could not read image. The file may be corrupted.');
        return;
      }
    }

    // Release previous preview URL
    const prev = this.selected();
    if (prev) URL.revokeObjectURL(prev.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    this.selected.set({ file, previewUrl });
    this.fileSelected.emit({ file, previewUrl });
  }

  private readDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        URL.revokeObjectURL(url);
        if (w === 0 || h === 0) {
          reject(new Error('zero dimensions'));
        } else {
          resolve({ width: w, height: h });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('decode failed'));
      };
      img.src = url;
    });
  }
}
