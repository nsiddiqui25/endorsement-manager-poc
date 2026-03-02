import { Injectable, signal, computed } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type {
  FlatOutlineItem,
  EndorsementDocumentInfo,
  EndorsementLoadResult,
  BookmarkValue,
  PositionedBookmark,
} from '../models';

// Set the worker source to locally served file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * EndorsementPdfService
 *
 * Handles PDF document rendering and bookmark management for endorsements.
 * Separated from API concerns for single responsibility.
 */
@Injectable()
export class EndorsementPdfService {
  // State signals
  private readonly _document = signal<PDFDocumentProxy | null>(null);
  private readonly _documentInfo = signal<EndorsementDocumentInfo | null>(null);
  private readonly _outlines = signal<FlatOutlineItem[]>([]);
  private readonly _currentPage = signal<number>(1);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formDisplayNumber = signal<string>('');
  private readonly _fileName = signal<string>('');
  private readonly _scale = signal<number>(1.5);
  private readonly _bookmarkValues = signal<Map<string, string>>(new Map());

  // Track current render task to cancel if needed
  private currentRenderTask: RenderTask | null = null;

  // Public readonly signals
  readonly document = this._document.asReadonly();
  readonly documentInfo = this._documentInfo.asReadonly();
  readonly outlines = this._outlines.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly formDisplayNumber = this._formDisplayNumber.asReadonly();
  readonly fileName = this._fileName.asReadonly();
  readonly scale = this._scale.asReadonly();
  readonly bookmarkValues = this._bookmarkValues.asReadonly();

  // Computed values
  readonly totalPages = computed(() => this._documentInfo()?.numPages ?? 0);
  readonly hasDocument = computed(() => this._document() !== null);
  readonly hasOutlines = computed(() => this._outlines().length > 0);

  /** Get the file name without extension (for filtering) */
  readonly fileNamePrefix = computed(() => {
    const name = this._fileName();
    if (!name) return '';
    return name.replace(/\.pdf$/i, '');
  });

  /** Filtered outlines - only show bookmarks starting with file name */
  readonly filteredOutlines = computed(() => {
    const prefix = this.fileNamePrefix().toLowerCase();
    if (!prefix) return [];
    return this._outlines().filter((item) =>
      item.title.toLowerCase().startsWith(prefix)
    );
  });

  /** Get filtered bookmarks for the current page only */
  readonly currentPageBookmarks = computed(() => {
    const currentPage = this._currentPage();
    return this.filteredOutlines().filter(
      (item) => item.pageNumber === currentPage
    );
  });

  /**
   * Get positioned bookmarks for overlay on current page
   * Uses bookmark destination coordinates (destX, destY) for positioning
   */
  getPositionedBookmarks(canvasHeight: number): PositionedBookmark[] {
    const scale = this._scale();
    const bookmarks = this.currentPageBookmarks();

    const positioned = bookmarks
      .filter(
        (item) =>
          item.destX !== undefined && item.destY !== undefined
      )
      .map((item) => {
        // Use bookmark destination for position
        const posX = item.destX!;
        const posY = item.destY!;
        // Add offset to align input with text baseline
        const screenY = canvasHeight - posY * scale + 14;

        return {
          item,
          x: posX * scale,
          y: screenY,
          height: 24,
          stackIndex: 0,
          stackOffset: 0,
        };
      });

    return positioned;
  }

  /**
   * Get positioned bookmarks for a specific page (for continuous scroll view)
   * Uses bookmark destination coordinates (destX, destY) for positioning
   */
  getPositionedBookmarksForPage(pageNumber: number, canvasHeight: number): PositionedBookmark[] {
    const scale = this._scale();
    const bookmarks = this.filteredOutlines().filter(
      (item) => item.pageNumber === pageNumber
    );

    const positioned = bookmarks
      .filter(
        (item) =>
          item.destX !== undefined && item.destY !== undefined
      )
      .map((item) => {
        // Use bookmark destination for position
        const posX = item.destX!;
        const posY = item.destY!;
        // Add offset to align input with text baseline
        const screenY = canvasHeight - posY * scale + 14;

        return {
          item,
          x: posX * scale,
          y: screenY,
          height: 24,
          stackIndex: 0,
          stackOffset: 0,
        };
      });

    return positioned;
  }

  /**
   * Load a PDF from a Blob (from API response)
   */
  async loadFromBlob(
    blob: Blob,
    formDisplayNumber: string,
    filename: string
  ): Promise<EndorsementLoadResult> {
    this._isLoading.set(true);
    this._error.set(null);
    this._formDisplayNumber.set(formDisplayNumber);
    this._fileName.set(filename);

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdfDocument = await loadingTask.promise;

      this._document.set(pdfDocument);

      // Get document info
      const metadata = await pdfDocument.getMetadata();
      const info: EndorsementDocumentInfo = {
        numPages: pdfDocument.numPages,
        formDisplayNumber,
        filename,
        title: (metadata.info as any)?.Title || undefined,
        author: (metadata.info as any)?.Author || undefined,
      };
      this._documentInfo.set(info);

      // Get outlines/bookmarks
      const outline = await pdfDocument.getOutline();
      let flatOutlines = await this.flattenOutline(
        outline as any[],
        pdfDocument
      );

      // Extract underscore counts from page text
      flatOutlines = await this.extractUnderscoreCounts(
        flatOutlines,
        pdfDocument
      );
      this._outlines.set(flatOutlines);

      this._currentPage.set(1);
      this._isLoading.set(false);

      return {
        success: true,
        documentInfo: info,
        outlines: flatOutlines,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load PDF';
      this._error.set(errorMessage);
      this._isLoading.set(false);
      this.reset();

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Render a specific page to a canvas element.
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    const doc = this._document();
    if (!doc || pageNumber < 1 || pageNumber > doc.numPages) {
      return;
    }

    if (this.currentRenderTask) {
      try {
        this.currentRenderTask.cancel();
      } catch {
        // Ignore cancellation errors
      }
      this.currentRenderTask = null;
    }

    const page = await doc.getPage(pageNumber);
    const scale = this._scale();
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    } as any);

    this.currentRenderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        throw error;
      }
    } finally {
      if (this.currentRenderTask === renderTask) {
        this.currentRenderTask = null;
      }
    }
  }

  goToPage(pageNumber: number): void {
    const total = this.totalPages();
    if (pageNumber >= 1 && pageNumber <= total) {
      this._currentPage.set(pageNumber);
    }
  }

  nextPage(): void {
    this.goToPage(this._currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this._currentPage() - 1);
  }

  setScale(scale: number): void {
    if (scale >= 0.5 && scale <= 3) {
      this._scale.set(scale);
    }
  }

  zoomIn(): void {
    this.setScale(this._scale() + 0.25);
  }

  zoomOut(): void {
    this.setScale(this._scale() - 0.25);
  }

  async goToOutline(item: FlatOutlineItem): Promise<void> {
    if (item.pageNumber !== null) {
      this.goToPage(item.pageNumber);
    }
  }

  setBookmarkValue(bookmarkTitle: string, value: string): void {
    const currentValues = new Map(this._bookmarkValues());
    currentValues.set(bookmarkTitle, value);
    this._bookmarkValues.set(currentValues);
  }

  getBookmarkValue(bookmarkTitle: string): string {
    return this._bookmarkValues().get(bookmarkTitle) || '';
  }

  getAllBookmarkValues(): BookmarkValue[] {
    const values: BookmarkValue[] = [];
    this._bookmarkValues().forEach((value, title) => {
      values.push({ title, value });
    });
    return values;
  }

  /**
   * Get blanks as array of strings for API submission
   */
  getBlanksArray(): string[] {
    const filtered = this.filteredOutlines();
    return filtered.map((item) => this.getBookmarkValue(item.title));
  }

  reset(): void {
    if (this.currentRenderTask) {
      try {
        this.currentRenderTask.cancel();
      } catch {
        // Ignore cancellation errors
      }
      this.currentRenderTask = null;
    }

    const doc = this._document();
    if (doc) {
      doc.destroy();
    }
    this._document.set(null);
    this._documentInfo.set(null);
    this._outlines.set([]);
    this._currentPage.set(1);
    this._formDisplayNumber.set('');
    this._fileName.set('');
    this._error.set(null);
    this._bookmarkValues.set(new Map());
  }

  private async flattenOutline(
    outline: any[] | null,
    pdfDocument: PDFDocumentProxy,
    level: number = 0
  ): Promise<FlatOutlineItem[]> {
    if (!outline || outline.length === 0) {
      return [];
    }

    const result: FlatOutlineItem[] = [];

    for (const item of outline) {
      let pageNumber: number | null = null;
      let destX: number | undefined;
      let destY: number | undefined;

      if (item.dest) {
        try {
          let dest = item.dest;
          if (typeof dest === 'string') {
            dest = await pdfDocument.getDestination(dest);
          }
          if (dest && Array.isArray(dest)) {
            const ref = dest[0];
            if (ref) {
              pageNumber = (await pdfDocument.getPageIndex(ref)) + 1;

              const destType = dest[1]?.name || dest[1];
              if (destType === 'XYZ' || destType === '/XYZ') {
                destX = typeof dest[2] === 'number' ? dest[2] : 0;
                destY = typeof dest[3] === 'number' ? dest[3] : undefined;
              } else if (
                destType === 'FitH' ||
                destType === '/FitH' ||
                destType === 'FitBH' ||
                destType === '/FitBH'
              ) {
                destX = 0;
                destY = typeof dest[2] === 'number' ? dest[2] : undefined;
              }

              if (pageNumber && destY === undefined) {
                try {
                  const page = await pdfDocument.getPage(pageNumber);
                  const viewport = page.getViewport({ scale: 1 });
                  destY = viewport.height;
                  destX = destX ?? 0;
                } catch {
                  // Ignore errors getting page
                }
              }
            }
          }
        } catch {
          // Destination resolution failed
        }
      }

      result.push({
        title: item.title || 'Untitled',
        pageNumber,
        level,
        bold: item.bold || false,
        italic: item.italic || false,
        destX,
        destY,
        underscoreCount: 0,
      });

      if (item.items && item.items.length > 0) {
        const children = await this.flattenOutline(
          item.items,
          pdfDocument,
          level + 1
        );
        result.push(...children);
      }
    }

    return result;
  }

  private async extractUnderscoreCounts(
    outlines: FlatOutlineItem[],
    pdfDocument: PDFDocumentProxy
  ): Promise<FlatOutlineItem[]> {
    // Get the file prefix to filter only relevant bookmarks
    const filePrefix = this.fileNamePrefix().toLowerCase();
    
    // Only process bookmarks that match the file prefix (fillable blanks)
    const relevantOutlines = filePrefix 
      ? outlines.filter(item => item.title.toLowerCase().startsWith(filePrefix))
      : outlines;

    console.log(`[PDF Service] Processing ${relevantOutlines.length} relevant bookmarks (prefix: "${filePrefix}")`);

    const pageMap = new Map<number, FlatOutlineItem[]>();
    for (const item of relevantOutlines) {
      if (item.pageNumber !== null) {
        const items = pageMap.get(item.pageNumber) || [];
        items.push(item);
        pageMap.set(item.pageNumber, items);
      }
    }

    for (const [pageNumber, items] of pageMap) {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];

        const underscoreSequences: Array<{
          x: number;
          y: number;
          width: number;
          count: number;
        }> = [];

        for (let i = 0; i < textItems.length; i++) {
          const textItem = textItems[i];
          const str = textItem.str || '';

          if (str.includes('_')) {
            const match = str.match(/_+/);
            if (match) {
              const transform = textItem.transform || [1, 0, 0, 1, 0, 0];
              const x = transform[4];
              const y = transform[5];
              const count = match[0].length;

              let width = 0;

              if (textItem.width && textItem.width > 0 && str.length > 0) {
                width = (textItem.width / str.length) * count;
              }

              if (width < count * 2) {
                const fontSize = Math.abs(transform[0]);
                width = count * fontSize * 0.55;
              }

              underscoreSequences.push({ x, y, width, count });
            }
          }
        }

        const maxWidthByCount = new Map<number, number>();
        for (const seq of underscoreSequences) {
          const currentMax = maxWidthByCount.get(seq.count) || 0;
          if (seq.width > currentMax) {
            maxWidthByCount.set(seq.count, seq.width);
          }
        }
        for (const seq of underscoreSequences) {
          seq.width = maxWidthByCount.get(seq.count) || seq.width;
        }

        underscoreSequences.sort((a, b) => b.y - a.y);

        const sortedItems = [...items]
          .filter(
            (item) => item.destX !== undefined && item.destY !== undefined
          )
          .sort((a, b) => (b.destY ?? 0) - (a.destY ?? 0));

        const usedUnderscores = new Set<number>();

        for (const item of sortedItems) {
          let bestMatch: (typeof underscoreSequences)[0] | null = null;
          let bestIndex = -1;
          let bestScore = Infinity;

          for (let i = 0; i < underscoreSequences.length; i++) {
            if (usedUnderscores.has(i)) continue;

            const seq = underscoreSequences[i];
            const xDiff = seq.x - (item.destX ?? 0);
            const yDiff = Math.abs(seq.y - (item.destY ?? 0));

            // Matching: underscore can be to the left (-200) or right (+500) of bookmark
            // and on approximately the same line (within 50 PDF units vertically)
            if (xDiff >= -200 && xDiff < 500 && yDiff < 50) {
              // Scoring: prefer underscores that are:
              // 1. Close in Y (same line)
              // 2. To the RIGHT of bookmark (positive xDiff) - typical pattern is label on left, underscore on right
              // 3. Close in X when aligned
              // Heavily penalize underscores to the LEFT of bookmark (negative xDiff)
              const xPenalty = xDiff < 0 ? Math.abs(xDiff) * 3 : xDiff * 0.5;
              const score = yDiff * 5 + xPenalty;
              if (score < bestScore) {
                bestScore = score;
                bestMatch = seq;
                bestIndex = i;
              }
            }
          }

          if (bestMatch && bestIndex >= 0) {
            usedUnderscores.add(bestIndex);
            item.underscoreCount = bestMatch.count;
            item.underscoreWidth = bestMatch.width;
            item.underscoreX = bestMatch.x;
            item.underscoreY = bestMatch.y;
            console.log(`[MATCH] "${item.title}" page ${item.pageNumber}: bookmark(${item.destX?.toFixed(0)}, ${item.destY?.toFixed(0)}) => underscore(${bestMatch.x.toFixed(0)}, ${bestMatch.y.toFixed(0)})`);
          } else {
            const availableSeqs = underscoreSequences.filter((_, i) => !usedUnderscores.has(i));
            console.warn(`[NO MATCH] "${item.title}" page ${item.pageNumber}: bookmark(${item.destX?.toFixed(0)}, ${item.destY?.toFixed(0)})`);
            if (availableSeqs.length > 0 && item.destX !== undefined && item.destY !== undefined) {
              // Show closest underscore sequences and why they didn't match
              const withDistances = availableSeqs.map(s => ({
                seq: s,
                xDiff: s.x - item.destX!,
                yDiff: Math.abs(s.y - item.destY!)
              })).sort((a, b) => (a.yDiff + Math.abs(a.xDiff) * 0.1) - (b.yDiff + Math.abs(b.xDiff) * 0.1));
              
              console.warn(`  Closest underscores (need xDiff in [-200,500], yDiff < 50):`);
              withDistances.slice(0, 5).forEach(d => {
                const xOk = d.xDiff >= -200 && d.xDiff < 500;
                const yOk = d.yDiff < 50;
                console.warn(`    underscore(${d.seq.x.toFixed(0)}, ${d.seq.y.toFixed(0)}): xDiff=${d.xDiff.toFixed(0)} ${xOk ? '✓' : '✗'}, yDiff=${d.yDiff.toFixed(0)} ${yOk ? '✓' : '✗'}`);
              });
            } else if (availableSeqs.length === 0) {
              console.warn(`  No available underscore sequences on this page!`);
            } else {
              console.warn(`  Bookmark has no destination coordinates (destX/destY undefined)`);
            }
          }
        }
      } catch (err) {
        console.error('Error extracting underscores:', err);
      }
    }

    return outlines;
  }
}
