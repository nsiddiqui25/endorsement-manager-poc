import {
  Component,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  viewChildren,
  ElementRef,
  effect,
  signal,
  input,
  OnInit,
  OnDestroy,
  QueryList,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { EndorsementService, EndorsementPdfService } from './services';
import { FormSelectionDialogComponent, PdfPreviewDialogComponent, type PdfPreviewDialogData, type BlankPosition } from './components';
import {
  FillBlankMethod,
  type FlatOutlineItem,
  type PositionedBookmark,
  type FormSelectionDialogData,
  type FormSelectionDialogResult,
} from './models';
import {
  DgMiniHtmlEditorComponent,
  type MiniToolbarConfig,
  MINIMAL_TOOLBAR_CONFIG,
} from '../editors';

type FocusSource = 'sidebar' | 'overlay' | null;

@Component({
  selector: 'app-endorsement-editor',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    DgMiniHtmlEditorComponent,
  ],
  providers: [EndorsementPdfService],
  templateUrl: './endorsement-editor.component.html',
  styleUrl: './endorsement-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndorsementEditorComponent implements OnInit, OnDestroy {
  readonly initialFormDisplayNumber = input<string | null>(null);
  protected readonly pdfService = inject(EndorsementPdfService);
  private readonly endorsementService = inject(EndorsementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // View references
  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');
  private readonly pagesContainer = viewChild<ElementRef<HTMLElement>>('pagesContainer');
  private readonly outlineList = viewChild<ElementRef<HTMLElement>>('outlineList');
  private readonly sidebarEditors = viewChildren<DgMiniHtmlEditorComponent>('sidebarEditor');
  private readonly overlayEditors = viewChildren<DgMiniHtmlEditorComponent>('overlayEditor');

  // Loading state for API calls
  protected readonly isApiLoading = signal<boolean>(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly isPreviewLoading = signal<boolean>(false);

  // Fill blank method selection
  protected readonly FillBlankMethod = FillBlankMethod;
  protected readonly selectedFillMethod = signal<FillBlankMethod>(FillBlankMethod.Overlap);

  // Page numbers for continuous scroll
  protected readonly pageNumbers = signal<number[]>([]);

  // Positioned bookmarks per page
  private readonly allPositionedBookmarks = signal<Map<number, PositionedBookmark[]>>(new Map());

  // Blank navigation state
  protected readonly currentBlankIndex = signal<number>(0);
  private focusSource: FocusSource = null;
  private isScrolling = false;
  private scrollTimeout: any = null;

  // Toolbar configuration for sidebar
  protected readonly sidebarToolbarConfig: MiniToolbarConfig = {
    ...MINIMAL_TOOLBAR_CONFIG,
    textColor: { visible: true },
    showMoreMenu: true,
  };

  // Toolbar configuration for overlay
  protected readonly overlayToolbarConfig: MiniToolbarConfig =
    MINIMAL_TOOLBAR_CONFIG;

  // Track previous scale to detect scale changes vs initial load
  private previousScale = 1.5;

  constructor() {
    // Re-render all pages only when scale changes (not on initial load)
    effect(() => {
      const scale = this.pdfService.scale();
      const hasDoc = this.pdfService.hasDocument();
      const pages = this.pageNumbers();

      // Only re-render if scale actually changed (not initial load)
      if (hasDoc && pages.length > 0 && scale !== this.previousScale) {
        this.previousScale = scale;
        setTimeout(() => this.renderAllPages(), 50);
      }
    });
  }

  ngOnInit(): void {
    const initialFormDisplayNumber = this.initialFormDisplayNumber();
    if (initialFormDisplayNumber) {
      this.loadEndorsement(initialFormDisplayNumber);
      return;
    }
    // Show the form selection dialog on component initialization
    this.openFormSelectionDialog();
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  // ============ Dialog ============

  openFormSelectionDialog(): void {
    const dialogData: FormSelectionDialogData = {
      title: 'Load Endorsement',
      placeholder: 'Form Display Number',
      submitLabel: 'Load',
      cancelLabel: 'Cancel',
      initialValue: this.pdfService.formDisplayNumber(),
    };

    const dialogRef = this.dialog.open(FormSelectionDialogComponent, {
      data: dialogData,
      width: '480px',
      disableClose: false,
      autoFocus: true,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: FormSelectionDialogResult | null) => {
        if (result?.formDisplayNumber) {
          this.loadEndorsement(result.formDisplayNumber);
        }
      });
  }

  // ============ API Calls ============

  private loadEndorsement(formDisplayNumber: string): void {
    this.isApiLoading.set(true);
    this.apiError.set(null);
    this.pdfService.reset();
    this.pageNumbers.set([]);
    this.allPositionedBookmarks.set(new Map());

    this.endorsementService.getEndorsement(formDisplayNumber).subscribe({
      next: async (response) => {
        const result = await this.pdfService.loadFromBlob(
          response.blob,
          formDisplayNumber,
          response.filename
        );

        this.isApiLoading.set(false);

        if (result.success) {
          this.snackBar.open(
            `Loaded: ${response.filename} (${result.documentInfo?.numPages} pages)`,
            'Close',
            { duration: 3000 }
          );

          // Set page numbers for continuous scroll
          const numPages = result.documentInfo?.numPages ?? 0;
          this.pageNumbers.set(Array.from({ length: numPages }, (_, i) => i + 1));

          // Render all pages after view updates
          setTimeout(() => this.renderAllPages(), 100);
        } else {
          this.apiError.set(result.error || 'Failed to parse PDF');
          this.snackBar.open(`Error: ${result.error}`, 'Close', {
            duration: 5000,
          });
        }
      },
      error: (err) => {
        this.isApiLoading.set(false);
        const errorMsg =
          err.status === 404
            ? `Endorsement "${formDisplayNumber}" not found`
            : err.message || 'Failed to load endorsement';
        this.apiError.set(errorMsg);
        this.snackBar.open(`Error: ${errorMsg}`, 'Close', { duration: 5000 });
      },
    });
  }

  // ============ Preview ============

  onPreview(): void {
    const formDisplayNumber = this.pdfService.formDisplayNumber();
    if (!formDisplayNumber) return;

    const blanks = this.pdfService.getBlanksArray();
    this.isPreviewLoading.set(true);

    // Prepare blank positions for the preview dialog
    const blankPositions: BlankPosition[] = this.pdfService.filteredOutlines().map((item, index) => ({
      index,
      title: item.title,
      pageNumber: item.pageNumber ?? 1,
      x: item.underscoreX,
      y: item.underscoreY,
    }));

    this.endorsementService.fillBlanks(formDisplayNumber, blanks, this.selectedFillMethod()).subscribe({
      next: (response) => {
        this.isPreviewLoading.set(false);

        const dialogData: PdfPreviewDialogData = {
          blob: response.blob,
          filename: response.filename,
          title: 'Preview - Filled Endorsement',
          blanks: blankPositions,
        };

        this.dialog.open(PdfPreviewDialogComponent, {
          data: dialogData,
          width: '90vw',
          maxWidth: '1200px',
          height: '90vh',
          panelClass: 'pdf-preview-dialog-panel',
        });
      },
      error: (err) => {
        this.isPreviewLoading.set(false);
        const errorMsg = err.message || 'Failed to generate preview';
        this.snackBar.open(`Error: ${errorMsg}`, 'Close', { duration: 5000 });
      },
    });
  }

  // ============ Blank Navigation ============

  previousBlank(): void {
    const total = this.pdfService.filteredOutlines().length;
    if (total === 0) return;

    const current = this.currentBlankIndex();
    if (current > 0) {
      this.goToBlank(current - 1);
    }
  }

  nextBlank(): void {
    const total = this.pdfService.filteredOutlines().length;
    if (total === 0) return;

    const current = this.currentBlankIndex();
    if (current < total - 1) {
      this.goToBlank(current + 1);
    }
  }

  goToCurrentBlank(): void {
    const current = this.currentBlankIndex();
    this.goToBlank(current);
  }

  goToBlank(index: number): void {
    const outlines = this.pdfService.filteredOutlines();
    if (index < 0 || index >= outlines.length) return;

    this.currentBlankIndex.set(index);
    const item = outlines[index];

    // Scroll to blank in main content
    this.scrollToBlankInPdf(item, index);

    // Scroll to blank in sidebar
    this.scrollToBlankInSidebar(index);

    // Focus the appropriate editor based on current focus source
    setTimeout(() => {
      this.focusBlankEditor(index);
    }, 400);
  }

  private scrollToBlankInPdf(item: FlatOutlineItem, index: number): void {
    const mainContentRef = this.mainContent();
    if (!mainContentRef || !item.pageNumber) return;

    // MatSidenavContent has elementRef property, not nativeElement directly
    const container = (mainContentRef as any).elementRef?.nativeElement as HTMLElement;
    if (!container) return;

    this.isScrolling = true;

    const pageWrapper = container.querySelector(`[data-page="${item.pageNumber}"]`);
    const canvas = container.querySelector(`#page-${item.pageNumber}`) as HTMLCanvasElement;

    if (pageWrapper && canvas && item.underscoreY !== undefined) {
      const scale = this.pdfService.scale();
      const canvasHeight = canvas.height;
      
      // underscoreY is in PDF units, convert to scaled pixels from top
      const yFromTop = canvasHeight - (item.underscoreY * scale);
      
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
      pageWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  private scrollToBlankInSidebar(index: number): void {
    const outlineListEl = this.outlineList()?.nativeElement;
    if (!outlineListEl) return;

    const blankItem = outlineListEl.querySelector(`[data-blank-index="${index}"]`);
    if (blankItem) {
      blankItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private focusBlankEditor(index: number): void {
    // Determine which set of editors to focus based on focus source
    if (this.focusSource === 'overlay') {
      this.focusOverlayEditor(index);
    } else {
      this.focusSidebarEditor(index);
    }
  }

  private focusSidebarEditor(index: number): void {
    const editors = this.sidebarEditors();
    if (editors && index < editors.length) {
      const editor = editors[index];
      if (editor) {
        editor.focusEditor();
      }
    }
  }

  private focusOverlayEditor(index: number): void {
    // Find the overlay editor with the matching blank index
    const container = this.mainContent()?.nativeElement;
    if (!container) return;

    const overlayWrapper = container.querySelector(`[data-blank-index="${index}"]`);
    if (overlayWrapper) {
      const editorEl = overlayWrapper.querySelector('.editor-content') as HTMLElement;
      if (editorEl) {
        editorEl.focus();
      }
    }
  }

  onSidebarEditorFocus(index: number): void {
    this.focusSource = 'sidebar';
    this.currentBlankIndex.set(index);
  }

  onOverlayEditorFocus(index: number): void {
    this.focusSource = 'overlay';
    this.currentBlankIndex.set(index);
  }

  // ============ Scroll Handling ============

  onScroll(): void {
    if (this.isScrolling) return;

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.updateCurrentPageFromScroll();
    }, 100);
  }

  private updateCurrentPageFromScroll(): void {
    const container = this.mainContent()?.nativeElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const viewportMiddle = containerRect.top + containerRect.height / 3;

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

    this.pdfService.goToPage(closestPage);
  }

  // ============ Value Changes ============

  onBookmarkValueChange(item: FlatOutlineItem, value: string): void {
    this.pdfService.setBookmarkValue(item.title, value);
  }

  getBookmarkValue(item: FlatOutlineItem): string {
    return this.pdfService.getBookmarkValue(item.title);
  }

  // ============ Zoom ============

  onZoomIn(): void {
    this.pdfService.zoomIn();
  }

  onZoomOut(): void {
    this.pdfService.zoomOut();
  }

  onResetZoom(): void {
    this.pdfService.setScale(1.5);
  }

  // ============ Rendering ============

  private async renderAllPages(): Promise<void> {
    const numPages = this.pdfService.totalPages();
    if (numPages === 0) return;

    const scale = this.pdfService.scale();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      await this.renderPage(pageNum, scale);
    }

    // Update positioned bookmarks for all pages after render
    this.updateAllPositionedBookmarks();
  }

  private async renderPage(pageNum: number, scale: number): Promise<void> {
    const canvas = document.getElementById(`page-${pageNum}`) as HTMLCanvasElement;
    if (!canvas) return;

    await this.pdfService.renderPage(pageNum, canvas);
  }

  private updateAllPositionedBookmarks(): void {
    const newMap = new Map<number, PositionedBookmark[]>();
    const numPages = this.pdfService.totalPages();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const canvas = document.getElementById(`page-${pageNum}`) as HTMLCanvasElement;
      if (canvas) {
        const positioned = this.pdfService.getPositionedBookmarksForPage(pageNum, canvas.height);
        newMap.set(pageNum, positioned);
      }
    }

    this.allPositionedBookmarks.set(newMap);
  }

  getPageBookmarks(pageNum: number): PositionedBookmark[] {
    return this.allPositionedBookmarks().get(pageNum) || [];
  }

  getGlobalBlankIndex(item: FlatOutlineItem): number {
    const outlines = this.pdfService.filteredOutlines();
    return outlines.findIndex(o => o.title === item.title);
  }

  // ============ Helpers ============

  getZoomPercent(): number {
    return Math.round(this.pdfService.scale() * 100);
  }

  getBlankDisplayName(item: FlatOutlineItem): string {
    const prefix = this.pdfService.fileNamePrefix();
    if (prefix && item.title.toLowerCase().startsWith(prefix.toLowerCase())) {
      const suffix = item.title.slice(prefix.length);
      // Show only the last 2 digits
      const lastTwoDigits = suffix.slice(-2);
      return `Blank ${lastTwoDigits}`;
    }
    // Fallback: try to get last 2 digits from title
    const lastTwo = item.title.slice(-2);
    return `Blank ${lastTwo}`;
  }

  getEditorWidth(item: FlatOutlineItem): number {
    const scale = this.pdfService.scale();
    const minWidth = 80;
    const maxWidth = 600;

    const underscoreCount = item.underscoreCount ?? 0;
    if (underscoreCount === 0) {
      return minWidth;
    }

    if (item.underscoreWidth && item.underscoreWidth > 0) {
      const calculatedWidth = item.underscoreWidth * scale;
      return Math.max(minWidth, Math.min(maxWidth, Math.round(calculatedWidth)));
    }

    const pdfUnitsPerUnderscore = 5.5;
    const calculatedWidth = underscoreCount * pdfUnitsPerUnderscore * scale;

    return Math.max(minWidth, Math.min(maxWidth, Math.round(calculatedWidth)));
  }

  // ============ Combined Loading State ============

  get isLoading(): boolean {
    return this.isApiLoading() || this.pdfService.isLoading();
  }

  get hasError(): boolean {
    return !!(this.apiError() || this.pdfService.error());
  }

  get errorMessage(): string {
    return this.apiError() || this.pdfService.error() || '';
  }
}
