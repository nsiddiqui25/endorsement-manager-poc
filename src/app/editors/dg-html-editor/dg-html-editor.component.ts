/**
 * @fileoverview DG HTML Editor Component
 *
 * Main container component for the full HTML WYSIWYG editor.
 * Orchestrates sub-components and manages overall editor state.
 *
 * Architecture:
 * - Uses standalone components for modularity
 * - Services provided at component level for encapsulation
 * - Signal-based reactive state management
 * - Follows single responsibility principle
 *
 * Sub-components:
 * - DgEditorToolbarComponent: Formatting toolbar
 * - DgWysiwygEditorComponent: Main editing area
 * - DgSourceCodePanelComponent: HTML source view
 * - DgEditorStatusBarComponent: Status information
 *
 * @module editors/dg-html-editor
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  effect,
  viewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import {
  DgEditorToolbarComponent,
  DgWysiwygEditorComponent,
  DgSourceCodePanelComponent,
  DgEditorStatusBarComponent,
} from './components';

import {
  EditorStateService,
  EditorCommandService,
  KeyboardShortcutService,
  SyntaxHighlightService,
  HtmlFormatterService,
} from './services';

import type {
  EditorContentChangeEvent,
  EditorTheme,
} from '../shared/models';

/**
 * DgHtmlEditorComponent
 *
 * Full-featured HTML WYSIWYG editor with toolbar, source view, and status bar.
 *
 * @example
 * ```html
 * <dg-html-editor
 *   [initialContent]="htmlContent"
 *   [placeholder]="'Start typing...'"
 *   [theme]="'light'"
 *   (htmlUpdated)="onContentChange($event)">
 * </dg-html-editor>
 * ```
 */
@Component({
  selector: 'dg-html-editor',
  standalone: true,
  imports: [
    MatSnackBarModule,
    DgEditorToolbarComponent,
    DgWysiwygEditorComponent,
    DgSourceCodePanelComponent,
    DgEditorStatusBarComponent,
  ],
  providers: [
    EditorStateService,
    EditorCommandService,
    KeyboardShortcutService,
    SyntaxHighlightService,
    HtmlFormatterService,
  ],
  templateUrl: './dg-html-editor.component.html',
  styleUrl: './dg-html-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgHtmlEditorComponent implements OnInit, OnDestroy {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly editorState = inject(EditorStateService);
  private readonly commandService = inject(EditorCommandService);

  // ============================================================================
  // View Children
  // ============================================================================

  private readonly wysiwygEditor = viewChild<DgWysiwygEditorComponent>('wysiwygEditor');

  // ============================================================================
  // Inputs
  // ============================================================================

  /** Initial HTML content to load into the editor */
  readonly initialContent = input<string>('');

  /** Placeholder text shown when editor is empty */
  readonly placeholder = input<string>('Enter HTML here...');

  /** Whether the editor is read-only */
  readonly readonly = input<boolean>(false);

  /** Show the formatting toolbar */
  readonly showToolbar = input<boolean>(true);

  /** Show the status bar */
  readonly showStatusBar = input<boolean>(true);

  /** Show line numbers in source code panel */
  readonly showLineNumbers = input<boolean>(true);

  /** Color theme: 'light' or 'dark' */
  readonly theme = input<EditorTheme>('light');

  /** Minimum height of the editor */
  readonly minHeight = input<string>('400px');

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted on every content change with HTML string */
  readonly contentChange = output<string>();

  /** Emitted with full event data when content changes */
  readonly htmlUpdated = output<EditorContentChangeEvent>();

  /** Emitted when editor gains focus */
  readonly focused = output<void>();

  /** Emitted when editor loses focus */
  readonly blurred = output<void>();

  // ============================================================================
  // Template Getters
  // ============================================================================

  protected get showSourceCode(): boolean {
    return this.editorState.showSourceCode();
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  constructor() {
    effect(() => {
      const content = this.initialContent();
      if (content) {
        this.editorState.updateContent(content, 'input');
        setTimeout(() => this.wysiwygEditor()?.syncFromState(), 0);
      }
    });
  }

  ngOnInit(): void {
    const content = this.initialContent();
    if (content) {
      this.editorState.updateContent(content, 'input');
    }
  }

  ngOnDestroy(): void {
    this.editorState.reset();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onContentChanged(html: string): void {
    this.contentChange.emit(html);
    this.htmlUpdated.emit({
      html,
      plainText: this.editorState.plainText(),
      timestamp: new Date(),
      changeType: 'input',
    });
  }

  onEditorFocused(): void {
    this.focused.emit();
  }

  onEditorBlurred(): void {
    this.blurred.emit();
  }

  onSourceCodeToggled(): void {
    if (!this.editorState.showSourceCode()) {
      setTimeout(() => this.wysiwygEditor()?.syncFromState(), 0);
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Get the current HTML content */
  getContent(): string {
    return this.editorState.content();
  }

  /** Get the current plain text content */
  getPlainText(): string {
    return this.editorState.plainText();
  }

  /** Set the editor content programmatically */
  setContent(html: string): void {
    this.editorState.updateContent(html, 'input');
    this.wysiwygEditor()?.syncFromState();
  }

  /** Focus the editor */
  focus(): void {
    this.wysiwygEditor()?.focus();
  }

  /** Clear all content */
  clear(): void {
    this.commandService.clearContent();
  }
}
