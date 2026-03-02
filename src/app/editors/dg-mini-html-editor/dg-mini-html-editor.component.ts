/**
 * @fileoverview Mini HTML Editor Component
 *
 * A compact, configurable rich text editor with a floating toolbar.
 * Supports formatting, keyboard shortcuts, and character limits.
 *
 * Features:
 * - Floating toolbar appears on focus
 * - Configurable toolbar buttons
 * - Keyboard shortcuts (Ctrl+B/I/U/Z/Y) always work
 * - Optional character limit based on plain text
 * - Light/dark theme support
 * - Full ARIA accessibility
 *
 * @module editors/dg-mini-html-editor
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  inject,
  effect,
  OnDestroy,
} from '@angular/core';

import { DgFloatingToolbarComponent } from './dg-floating-toolbar.component';
import { FormattingCommandService, SelectionService } from '../shared/services';
import type {
  MiniToolbarConfig,
  FormattingState,
  FormattingCommand,
  EditorTheme,
} from '../shared/models';
import {
  DEFAULT_MINI_TOOLBAR_CONFIG,
  INITIAL_FORMATTING_STATE,
} from '../shared/models';

/**
 * DgMiniHtmlEditorComponent
 *
 * A compact rich text editor optimized for inline editing scenarios.
 * Uses contenteditable with a floating toolbar for formatting controls.
 *
 * Architecture:
 * - Signal-based reactive state management
 * - Component-scoped services for isolation
 * - Selection persistence for menu interactions
 *
 * @example
 * ```html
 * <dg-mini-html-editor
 *   [value]="content()"
 *   [placeholder]="'Enter text...'"
 *   [maxLength]="500"
 *   (valueChange)="onContentChange($event)" />
 * ```
 */
@Component({
  selector: 'dg-mini-html-editor',
  standalone: true,
  imports: [DgFloatingToolbarComponent],
  providers: [FormattingCommandService, SelectionService],
  templateUrl: './dg-mini-html-editor.component.html',
  styleUrl: './dg-mini-html-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgMiniHtmlEditorComponent implements OnDestroy {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly formattingService = inject(FormattingCommandService);
  private readonly selectionService = inject(SelectionService);

  /** Bound scroll handler for cleanup */
  private readonly boundScrollHandler = this.onScroll.bind(this);
  
  /** Scroll listener cleanup functions */
  private scrollListenerCleanups: (() => void)[] = [];

  // ============================================================================
  // Inputs
  // ============================================================================

  /** HTML content value */
  readonly value = input<string>('');

  /** Placeholder text when empty */
  readonly placeholder = input<string>('Enter text...');

  /** Toolbar configuration */
  readonly config = input<MiniToolbarConfig>(DEFAULT_MINI_TOOLBAR_CONFIG);

  /** Color theme */
  readonly theme = input<EditorTheme>('light');

  /** Disabled state */
  readonly disabled = input<boolean>(false);

  /** Maximum plain text length (null/undefined = unlimited) */
  readonly maxLength = input<number | null | undefined>(null);

  /** Width of the editor (e.g., '200px', '100%', or number for pixels) */
  readonly width = input<string | number | null>(null);

  /** Height of the editor (e.g., '24px' or number for pixels) */
  readonly height = input<string | number | null>(null);

  /** ARIA label for accessibility */
  readonly ariaLabel = input<string>('Rich text editor');

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when content changes */
  readonly valueChange = output<string>();

  /** Emitted when editor gains focus */
  readonly focus = output<void>();

  /** Emitted when editor loses focus */
  readonly blur = output<void>();

  // ============================================================================
  // View Queries
  // ============================================================================

  private readonly editorRef = viewChild.required<ElementRef<HTMLElement>>('editor');

  // ============================================================================
  // Internal State
  // ============================================================================

  protected readonly isFocused = signal<boolean>(false);
  protected readonly isMenuOpen = signal<boolean>(false);
  protected readonly formattingState = signal<FormattingState>(INITIAL_FORMATTING_STATE);
  protected readonly currentLength = signal<number>(0);

  /** Toolbar position for fixed positioning */
  protected readonly toolbarPosition = signal<{ top: string; left: string }>({ top: '0px', left: '0px' });

  /** Saved selection range to restore on focus */
  private savedSelection: Range | null = null;

  /** Pending click position to check against saved selection */
  private pendingClickPosition: { x: number; y: number } | null = null;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /** Whether the editor content is empty */
  protected readonly isEmpty = computed(() => this.currentLength() === 0);

  /** Whether the content exceeds the max length */
  protected readonly isExceeded = computed(() => {
    const max = this.maxLength();
    return max !== null && max !== undefined && this.currentLength() > max;
  });

  /** Whether to show the character counter */
  protected readonly showCounter = computed(() => {
    const max = this.maxLength();
    return max !== null && max !== undefined;
  });

  /** Computed width style */
  protected readonly widthStyle = computed(() => {
    const w = this.width();
    if (w === null || w === undefined) return null;
    return typeof w === 'number' ? `${w}px` : w;
  });

  /** Computed height style */
  protected readonly heightStyle = computed(() => {
    const h = this.height();
    if (h === null || h === undefined) return null;
    return typeof h === 'number' ? `${h}px` : h;
  });

  // ============================================================================
  // Lifecycle
  // ============================================================================

  constructor() {
    // Sync external value changes to editor
    effect(() => {
      const value = this.value();
      const editorEl = this.editorRef()?.nativeElement;

      if (editorEl && editorEl.innerHTML !== value) {
        editorEl.innerHTML = value;
        this.updateCurrentLength();
      }
    });
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  protected onInput(): void {
    const editor = this.editorRef().nativeElement;
    const html = editor.innerHTML;

    this.updateCurrentLength();
    // Emit empty string instead of just <br>
    this.valueChange.emit(html === '<br>' ? '' : html);
  }

  protected onFocus(): void {
    if (this.disabled()) return;

    this.isFocused.set(true);
    this.updateToolbarPosition();
    this.setupScrollListeners();

    // Only restore selection if it was a programmatic focus (no click) 
    // and we have a toolbar interaction going on
    if (this.savedSelection && !this.pendingClickPosition && this.isMenuOpen()) {
      this.selectionService.restoreSelection(this.savedSelection);
    } else {
      // Clear saved selection - let browser handle cursor placement from click
      this.savedSelection = null;
    }

    this.pendingClickPosition = null;
    this.updateFormattingState();
    this.focus.emit();
  }

  protected onBlur(): void {
    // Save current selection before losing focus
    const editor = this.editorRef().nativeElement;
    this.savedSelection = this.selectionService.saveSelection(editor);

    // Small delay to allow toolbar/menu clicks to register
    setTimeout(() => {
      // Only clear selection and emit blur if:
      // 1. No menu is open
      // 2. Focus has truly left this editor (not just to toolbar)
      // 3. Focus hasn't moved to another contenteditable (another editor)
      const activeElement = document.activeElement;
      const isAnotherEditor = activeElement?.hasAttribute('contenteditable');
      
      if (!this.isMenuOpen() && activeElement !== editor) {
        // Don't clear document selection if focus moved to another editor
        // as it would clear their cursor position
        if (!isAnotherEditor) {
          this.selectionService.clearSelection();
        }
        this.isFocused.set(false);
        this.removeScrollListeners();
        this.blur.emit();
      }
    }, 150);
  }

  protected onMouseDown(event: MouseEvent): void {
    // Capture the click position before focus event fires
    this.pendingClickPosition = { x: event.clientX, y: event.clientY };
  }

  protected onMenuOpened(): void {
    this.isMenuOpen.set(true);
    const editor = this.editorRef().nativeElement;
    this.savedSelection = this.selectionService.saveSelection(editor);
  }

  protected onMenuClosed(): void {
    this.isMenuOpen.set(false);

    // Restore selection and refocus editor
    const editor = this.editorRef().nativeElement;
    editor.focus();

    if (this.savedSelection) {
      setTimeout(() => {
        this.selectionService.restoreSelection(this.savedSelection);
        this.isFocused.set(true);
      }, 0);
    }
  }

  protected onCommand(command: FormattingCommand): void {
    const editor = this.editorRef().nativeElement;
    this.formattingService.execute(command, editor);
    this.updateFormattingState();
    this.onInput();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }

    // Handle keyboard shortcuts (always enabled)
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      let command: FormattingCommand | null = null;

      switch (key) {
        case 'b':
          command = { type: 'bold' };
          break;
        case 'i':
          command = { type: 'italic' };
          break;
        case 'u':
          command = { type: 'underline' };
          break;
        case 'z':
          command = event.shiftKey ? { type: 'redo' } : { type: 'undo' };
          break;
        case 'y':
          command = { type: 'redo' };
          break;
      }

      if (command) {
        event.preventDefault();
        this.onCommand(command);
      }
    }
  }

  protected onSelectionChange(): void {
    this.updateFormattingState();
  }

  // ============================================================================
  // State Updates
  // ============================================================================

  protected updateFormattingState(): void {
    const state = this.formattingService.getFormattingState();
    this.formattingState.set(state);
  }

  private updateCurrentLength(): void {
    const editor = this.editorRef().nativeElement;
    const length = this.formattingService.getPlainTextLength(editor.innerHTML);
    this.currentLength.set(length);
  }

  private updateToolbarPosition(): void {
    const editor = this.editorRef().nativeElement;
    const rect = editor.getBoundingClientRect();
    this.toolbarPosition.set({
      top: `${rect.top - 8}px`,
      left: `${rect.left}px`
    });
  }

  /** Set up scroll listeners on all scrollable ancestors */
  private setupScrollListeners(): void {
    this.removeScrollListeners();
    
    let element: HTMLElement | null = this.editorRef().nativeElement.parentElement;
    
    while (element) {
      // Check if element is scrollable
      const style = getComputedStyle(element);
      const isScrollable = 
        style.overflow === 'auto' || 
        style.overflow === 'scroll' ||
        style.overflowY === 'auto' || 
        style.overflowY === 'scroll';
      
      if (isScrollable || element === document.documentElement) {
        element.addEventListener('scroll', this.boundScrollHandler, { passive: true });
        const el = element;
        this.scrollListenerCleanups.push(() => {
          el.removeEventListener('scroll', this.boundScrollHandler);
        });
      }
      
      element = element.parentElement;
    }
    
    // Also listen to window scroll
    window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
    this.scrollListenerCleanups.push(() => {
      window.removeEventListener('scroll', this.boundScrollHandler);
    });
  }

  /** Remove all scroll listeners */
  private removeScrollListeners(): void {
    this.scrollListenerCleanups.forEach(cleanup => cleanup());
    this.scrollListenerCleanups = [];
  }

  /** Handle scroll events - update toolbar position */
  private onScroll(): void {
    if (this.isFocused()) {
      this.updateToolbarPosition();
    }
  }

  ngOnDestroy(): void {
    this.removeScrollListeners();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Focus the editor programmatically */
  focusEditor(): void {
    this.editorRef().nativeElement.focus();
  }

  /** Get plain text content (without HTML) */
  getPlainText(): string {
    const editor = this.editorRef().nativeElement;
    return this.formattingService.getPlainText(editor.innerHTML);
  }

  /** Clear all content */
  clear(): void {
    const editor = this.editorRef().nativeElement;
    editor.innerHTML = '';
    this.onInput();
  }
}
