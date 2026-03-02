/**
 * @fileoverview WYSIWYG Editor Component
 *
 * The main WYSIWYG editing area using contenteditable.
 *
 * @module editors/dg-html-editor/components
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import {
  EditorStateService,
  EditorCommandService,
  KeyboardShortcutService,
} from '../services';
import type { ContentChangeType } from '../../shared/models';

/**
 * DgWysiwygEditorComponent
 *
 * Rich text editing area with keyboard shortcuts and paste handling.
 */
@Component({
  selector: 'dg-wysiwyg-editor',
  standalone: true,
  imports: [],
  templateUrl: './dg-wysiwyg-editor.component.html',
  styleUrl: './dg-wysiwyg-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgWysiwygEditorComponent implements AfterViewInit, OnDestroy {
  private readonly editorState = inject(EditorStateService);
  private readonly commandService = inject(EditorCommandService);
  private readonly keyboardService = inject(KeyboardShortcutService);

  private readonly editorRef = viewChild.required<ElementRef<HTMLDivElement>>('editor');

  readonly placeholder = input<string>('Enter text here...');
  readonly readonly = input<boolean>(false);

  readonly contentChanged = output<string>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngAfterViewInit(): void {
    const element = this.editorRef().nativeElement;
    this.commandService.setEditorElement(element);
    this.syncFromState();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onInput(): void {
    this.syncToState('input');
    this.editorState.updateFormattingState();
  }

  onKeydown(event: KeyboardEvent): void {
    this.keyboardService.handleKeydown(event);
    setTimeout(() => this.editorState.updateFormattingState(), 0);
  }

  onKeyup(): void {
    this.editorState.updateFormattingState();
  }

  onMouseup(): void {
    this.editorState.updateFormattingState();
  }

  onSelect(): void {
    this.editorState.updateFormattingState();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain');
    const content = html || text || '';

    if (content) {
      document.execCommand('insertHTML', false, content);
      this.syncToState('paste');
    }
  }

  onFocus(): void {
    this.editorState.setFocused(true);
    this.focused.emit();
  }

  onBlur(): void {
    this.editorState.setFocused(false);
    this.blurred.emit();
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /** Sync content from state to editor element */
  syncFromState(): void {
    const element = this.editorRef()?.nativeElement;
    if (element) {
      const content = this.editorState.content();
      if (element.innerHTML !== content) {
        element.innerHTML = content;
      }
    }
  }

  /** Focus the editor */
  focus(): void {
    this.editorRef()?.nativeElement.focus();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private syncToState(changeType: ContentChangeType): void {
    const element = this.editorRef()?.nativeElement;
    if (element) {
      const html = element.innerHTML;
      this.editorState.updateContent(html, changeType);
      this.contentChanged.emit(html);
    }
  }
}
