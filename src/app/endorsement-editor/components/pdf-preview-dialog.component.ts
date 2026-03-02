import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/** Blank position info for navigation */
export interface BlankPosition {
  index: number;
  title: string;
  pageNumber: number;
  x?: number;
  y?: number;
}

export interface PdfPreviewDialogData {
  blob: Blob;
  filename: string;
  title?: string;
  blanks?: BlankPosition[];
}

/**
 * PdfPreviewDialogComponent
 *
 * Dialog for previewing a PDF document with continuous scroll and navigation.
 */
@Component({
  selector: 'app-pdf-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="pdf-preview-dialog">
      <div class="dialog-header">
        <h2>
          <mat-icon>preview</mat-icon>
          {{ data.title || 'Preview' }}
        </h2>
        <span class="filename">{{ data.filename }}</span>
        <button mat-icon-button matTooltip="Close" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-toolbar">
        <!-- Navigation -->
        <button
          mat-icon-button
          matTooltip="Previous Page"
          [disabled]="currentPage() <= 1"
          (click)="goToPage(currentPage() - 1)"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="page-info">{{ currentPage() }} / {{ totalPages() }}</span>
        <button
          mat-icon-button
          matTooltip="Next Page"
          [disabled]="currentPage() >= totalPages()"
          (click)="goToPage(currentPage() + 1)"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>

        <span class="divider"></span>

        <!-- Zoom -->
        <button
          mat-icon-button
          matTooltip="Zoom Out"
          [disabled]="scale() <= 0.5"
          (click)="zoomOut()"
        >
          <mat-icon>remove</mat-icon>
        </button>
        <span class="zoom-info">{{ getZoomPercent() }}%</span>
        <button
          mat-icon-button
          matTooltip="Zoom In"
          [disabled]="scale() >= 3"
          (click)="zoomIn()"
        >
          <mat-icon>add</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Reset Zoom" (click)="resetZoom()">
          <mat-icon>fit_screen</mat-icon>
        </button>

        <span class="divider"></span>

        <!-- Download -->
        <button mat-icon-button matTooltip="Download PDF" (click)="downloadPdf()">
          <mat-icon>download</mat-icon>
        </button>

        @if (hasBlanks()) {
          <span class="divider"></span>

          <!-- Blank Navigation -->
          <button
            mat-icon-button
            matTooltip="Previous Blank"
            [disabled]="currentBlankIndex() <= 0"
            (click)="previousBlank()"
          >
            <mat-icon>skip_previous</mat-icon>
          </button>
          <span 
            class="blank-info clickable" 
            matTooltip="Go to current blank"
            (click)="scrollToCurrentBlank()"
          >
            Blank {{ currentBlankIndex() + 1 }} / {{ totalBlanks() }}
          </span>
          <button
            mat-icon-button
            matTooltip="Next Blank"
            [disabled]="currentBlankIndex() >= totalBlanks() - 1"
            (click)="nextBlank()"
          >
            <mat-icon>skip_next</mat-icon>
          </button>
        }
      </div>

      <mat-dialog-content class="dialog-content" #scrollContainer (scroll)="onScroll()">
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Loading preview...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        } @else {
          <div class="pages-container" #pagesContainer>
            @for (pageNum of pageNumbers(); track pageNum) {
              <div class="page-wrapper" [attr.data-page]="pageNum">
                <canvas [id]="'preview-page-' + pageNum" class="pdf-canvas"></canvas>
                <span class="page-label">Page {{ pageNum }}</span>
              </div>
            }
          </div>
        }
      </mat-dialog-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .pdf-preview-dialog {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;

        h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 500;

          mat-icon {
            color: #1976d2;
          }
        }

        .filename {
          flex: 1;
          font-size: 13px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .dialog-toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;

        .page-info,
        .zoom-info,
        .blank-info {
          font-size: 13px;
          color: #333;
          min-width: 60px;
          text-align: center;
        }

        .blank-info {
          min-width: 100px;
          color: #1976d2;
          font-weight: 500;

          &.clickable {
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.15s ease;

            &:hover {
              background: rgba(25, 118, 210, 0.1);
            }

            &:active {
              background: rgba(25, 118, 210, 0.2);
            }
          }
        }

        .divider {
          width: 1px;
          height: 24px;
          background: #e0e0e0;
          margin: 0 8px;
        }
      }

      .dialog-content {
        flex: 1;
        overflow: auto;
        background: #525659;
        padding: 20px;
        min-height: 0;
      }

      .pages-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .page-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .pdf-canvas {
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: block;
      }

      .page-label {
        font-size: 12px;
        color: #aaa;
        padding: 4px 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
      }

      .loading-container,
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 16px;
        color: #999;

        p {
          margin: 0;
        }
      }

      .error-container {
        .error-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #f44336;
        }
      }
    `,
  ],
})
export class PdfPreviewDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<PdfPreviewDialogComponent>);
  readonly data: PdfPreviewDialogData = inject(MAT_DIALOG_DATA);

  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private readonly pagesContainer = viewChild<ElementRef<HTMLElement>>('pagesContainer');

  private pdfDocument: PDFDocumentProxy | null = null;
  private isScrolling = false;
  private scrollTimeout: any = null;

  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(0);
  readonly scale = signal<number>(1.2);
  readonly pageNumbers = signal<number[]>([]);
  readonly currentBlankIndex = signal<number>(0);

  // Computed blank properties
  readonly hasBlanks = () => (this.data.blanks?.length ?? 0) > 0;
  readonly totalBlanks = () => this.data.blanks?.length ?? 0;

  async ngOnInit(): Promise<void> {
    await this.loadPdf();
  }

  ngAfterViewInit(): void {
    // Initial render after view is ready
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
    }
  }

  private async loadPdf(): Promise<void> {
    try {
      const arrayBuffer = await this.data.blob.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      this.pdfDocument = await loadingTask.promise;

      const numPages = this.pdfDocument.numPages;
      this.totalPages.set(numPages);
      this.pageNumbers.set(Array.from({ length: numPages }, (_, i) => i + 1));
      this.isLoading.set(false);

      // Wait for canvases to be created, then render all pages
      setTimeout(() => this.renderAllPages(), 100);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load PDF');
      this.isLoading.set(false);
    }
  }

  private async renderAllPages(): Promise<void> {
    if (!this.pdfDocument) return;

    const scale = this.scale();

    for (let pageNum = 1; pageNum <= this.totalPages(); pageNum++) {
      await this.renderPage(pageNum, scale);
    }
  }

  private async renderPage(pageNum: number, scale: number): Promise<void> {
    if (!this.pdfDocument) return;

    const container = this.pagesContainer()?.nativeElement;
    if (!container) return;

    const canvas = container.querySelector(`#preview-page-${pageNum}`) as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const page = await this.pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      context.clearRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      } as any).promise;
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    }
  }

  goToPage(pageNum: number): void {
    if (pageNum < 1 || pageNum > this.totalPages()) return;

    this.isScrolling = true;
    this.currentPage.set(pageNum);

    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const pageWrapper = container.querySelector(`[data-page="${pageNum}"]`);
    if (pageWrapper) {
      pageWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Reset scrolling flag after animation
      setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    }
  }

  onScroll(): void {
    if (this.isScrolling) return;

    // Debounce scroll detection
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.updateCurrentPageFromScroll();
    }, 100);
  }

  private updateCurrentPageFromScroll(): void {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;
    const containerHeight = containerRect.height;
    const viewportMiddle = containerTop + containerHeight / 3; // Use upper third for detection

    const pageWrappers = container.querySelectorAll('.page-wrapper');
    let closestPage = 1;
    let closestDistance = Infinity;

    pageWrappers.forEach((wrapper) => {
      const rect = wrapper.getBoundingClientRect();
      const pageMiddle = rect.top + rect.height / 2;
      const distance = Math.abs(pageMiddle - viewportMiddle);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = parseInt(wrapper.getAttribute('data-page') || '1', 10);
      }
    });

    if (closestPage !== this.currentPage()) {
      this.currentPage.set(closestPage);
    }
  }

  zoomIn(): void {
    if (this.scale() < 3) {
      this.scale.set(this.scale() + 0.25);
      this.renderAllPages();
    }
  }

  zoomOut(): void {
    if (this.scale() > 0.5) {
      this.scale.set(this.scale() - 0.25);
      this.renderAllPages();
    }
  }

  resetZoom(): void {
    this.scale.set(1.2);
    this.renderAllPages();
  }

  getZoomPercent(): number {
    return Math.round(this.scale() * 100);
  }

  downloadPdf(): void {
    const url = URL.createObjectURL(this.data.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============ Blank Navigation ============

  previousBlank(): void {
    if (this.currentBlankIndex() > 0) {
      this.currentBlankIndex.set(this.currentBlankIndex() - 1);
      this.scrollToCurrentBlank();
    }
  }

  nextBlank(): void {
    if (this.currentBlankIndex() < this.totalBlanks() - 1) {
      this.currentBlankIndex.set(this.currentBlankIndex() + 1);
      this.scrollToCurrentBlank();
    }
  }

  scrollToCurrentBlank(): void {
    const blanks = this.data.blanks;
    if (!blanks || blanks.length === 0) return;

    const blank = blanks[this.currentBlankIndex()];
    if (!blank) return;

    // First, scroll to the page
    const pageNum = blank.pageNumber;
    if (pageNum < 1 || pageNum > this.totalPages()) return;

    this.isScrolling = true;

    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const pageWrapper = container.querySelector(`[data-page="${pageNum}"]`);
    const canvas = container.querySelector(`#preview-page-${pageNum}`) as HTMLCanvasElement;

    if (pageWrapper && canvas && container && blank.y !== undefined) {
      // Calculate the Y position within the page
      // PDF coordinates: Y=0 at bottom, increases upward
      // We need to convert to screen coordinates
      const scale = this.scale();
      const canvasHeight = canvas.height;
      
      // blank.y is in PDF units, convert to scaled pixels from top
      const yFromTop = canvasHeight - (blank.y * scale);
      
      // Get the page wrapper's position
      const pageRect = pageWrapper.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate scroll position to center the blank in the viewport
      const scrollOffset = container.scrollTop + pageRect.top - containerRect.top + yFromTop - (containerRect.height / 3);
      
      container.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: 'smooth'
      });
    } else if (pageWrapper) {
      // Fallback: just scroll to the page
      pageWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.currentPage.set(pageNum);

    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
