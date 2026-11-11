import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'ol-file-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 px-4 w-full">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md border border-gray-100 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 tracking-tight">Upload Files</h1>
        
        <input
          #fileInput
          type="file"
          class="hidden"
          (change)="onFileChange($event)"
          aria-label="File input"
          multiple
        />

        <div
          class="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 mb-5 cursor-pointer"
          [class.border-blue-500]="isDragging"
          [class.bg-blue-5%] = "isDragging"
          [class.border-gray-300]="!isDragging"
          [class.bg-gray-50]="!isDragging"
          style="min-height: 120px;"
          (click)="triggerFileInput()"
          (drop)="onDrop($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
        >
          <div class="flex flex-col items-center py-6">
            <span class="text-4xl mb-2 animate-bounce">📁</span>
            <span class="text-gray-700 font-medium">
              Drag & drop files here, or <span class="text-blue-600 underline">browse</span>
            </span>
            <span class="text-xs text-gray-400 mt-1">(PNG, JPG, PDF, etc. up to 5MB each)</span>
          </div>
        </div>

        <!-- Single File Preview -->
        <ng-container *ngIf="selectedFiles.length === 1">
          <div class="mb-4">
            <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-200 mb-2 animate-fade-in">
              <ng-container *ngIf="singlePreviewUrl; else defaultFileIcon">
                <img
                  [src]="singlePreviewUrl"
                  alt="Preview"
                  class="w-16 h-16 object-cover rounded-md border border-gray-200"
                />
              </ng-container>
              <ng-template #defaultFileIcon>
                <div class="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md text-gray-500 text-xl">
                  <span role="img" aria-label="file">📄</span>
                </div>
              </ng-template>

              <div class="flex-1 truncate">
                <div class="font-medium text-gray-800 truncate">{{ selectedFiles[0].name }}</div>
              </div>

              <button
                type="button"
                (click)="removeFile(0)"
                class="ml-2 px-2 py-1 text-xs flex items-center gap-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition border border-red-200 shadow-sm"
                aria-label="Remove file"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Multiple File List -->
        <ng-container *ngIf="selectedFiles.length > 1">
          <div class="mb-4" style="max-height: 180px; overflow-y: auto;">
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let file of selectedFiles; let idx = index"
                class="inline-flex items-center max-w-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium shadow-sm border border-gray-200 truncate"
                style="min-width: 0;"
                [title]="file.name"
              >
                <span class="truncate max-w-[120px] text-xs">{{ file.name }}</span>
                <button
                  type="button"
                  (click)="removeFile(idx)"
                  class="ml-2 p-0.5 rounded-full hover:bg-red-100 text-red-600 transition border border-transparent focus:outline-none focus:ring-2 focus:ring-red-200"
                  aria-label="Remove file"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </ng-container>

        <!-- Progress Bar -->
        <ng-container *ngIf="uploading">
          <div class="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden animate-fade-in">
            <div
              class="bg-green-500 h-3 rounded-full transition-all duration-300"
              [style.width.%]="progress"
            ></div>
          </div>
        </ng-container>

        <!-- Upload Button -->
        <button
          type="button"
          [disabled]="selectedFiles.length === 0 || uploading"
          (click)="handleUpload()"
          class="w-full py-2 px-4 rounded-lg font-semibold text-base transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 shadow-lg flex items-center justify-center gap-2"
          [class.bg-gray-700]="selectedFiles.length > 0 && !uploading"
          [class.text-white]="selectedFiles.length > 0 && !uploading"
          [class.hover:bg-gray-800]="selectedFiles.length > 0 && !uploading"
          [class.bg-gray-300]="selectedFiles.length === 0 || uploading"
          [class.text-gray-500]="selectedFiles.length === 0 || uploading"
          [class.cursor-not-allowed]="selectedFiles.length === 0 || uploading"
          style="min-height: 40px;"
        >
          <svg *ngIf="uploading" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>{{ uploading ? 'Uploading...' : 'Upload' }}</span>
        </button>
      </div>

      <!-- Toast Notification -->
      <div
        *ngIf="toast"
        class="fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white animate-fade-in flex items-center gap-2"
        [class.bg-green-600]="toast.type === 'success'"
        [class.bg-red-600]="toast.type === 'error'"
        role="alert"
      >
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        <span>{{ toast.message }}</span>
        <button (click)="closeToast()" class="ml-3 text-white/80 hover:text-white text-lg" aria-label="Close">×</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease;
    }
  `]
})
export class FileUploaderComponent implements OnDestroy {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFiles: File[] = [];
  isDragging = false;
  uploading = false;
  progress = 0;
  toast: ToastState | null = null;
  singlePreviewUrl: string | null = null;

  private uploadInterval: any;

  triggerFileInput() {
    this.fileInputRef?.nativeElement.click();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  handleFiles(files: FileList) {
    const fileArr = Array.from(files);
    const uniqueFiles = fileArr.filter(
      f => !this.selectedFiles.some(p => p.name === f.name && p.size === f.size)
    );
    this.selectedFiles = [...this.selectedFiles, ...uniqueFiles];
    this.updatePreview();
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.updatePreview();
  }

  private updatePreview() {
    if (this.singlePreviewUrl) {
      URL.revokeObjectURL(this.singlePreviewUrl);
      this.singlePreviewUrl = null;
    }

    if (this.selectedFiles.length === 1) {
      const file = this.selectedFiles[0];
      if (file && file.type.startsWith('image/')) {
        this.singlePreviewUrl = URL.createObjectURL(file);
      }
    }
  }

  handleUpload() {
    if (this.selectedFiles.length === 0) return;
    this.uploading = true;
    this.progress = 0;

    this.uploadInterval = setInterval(() => {
      this.progress += 10;
      if (this.progress >= 100) {
        clearInterval(this.uploadInterval);
        this.uploading = false;
        this.toast = { message: 'Files uploaded successfully!', type: 'success' };
        this.selectedFiles = [];
        this.updatePreview();
      }
    }, 120);
  }

  closeToast() {
    this.toast = null;
  }

  ngOnDestroy() {
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }
    if (this.singlePreviewUrl) {
      URL.revokeObjectURL(this.singlePreviewUrl);
    }
  }
}
