/**
 * @fileoverview Editor Command Service
 *
 * Handles all document editing commands for the WYSIWYG editor.
 * Uses document.execCommand for formatting operations.
 *
 * @module editors/dg-html-editor/services
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditorStateService } from './editor-state.service';
import type { HeadingOption } from '../../shared/models';

/**
 * EditorCommandService
 *
 * Executes formatting commands and manages content sync.
 */
@Injectable()
export class EditorCommandService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly editorState = inject(EditorStateService);

  private editorElement: HTMLElement | null = null;

  /** Set the editor element reference */
  setEditorElement(element: HTMLElement): void {
    this.editorElement = element;
  }

  // ============================================================================
  // Text Formatting
  // ============================================================================

  bold(): void {
    this.execCommand('bold');
  }

  italic(): void {
    this.execCommand('italic');
  }

  underline(): void {
    this.execCommand('underline');
  }

  strikethrough(): void {
    this.execCommand('strikeThrough');
  }

  // ============================================================================
  // Alignment
  // ============================================================================

  alignLeft(): void {
    this.execCommand('justifyLeft');
  }

  alignCenter(): void {
    this.execCommand('justifyCenter');
  }

  alignRight(): void {
    this.execCommand('justifyRight');
  }

  alignJustify(): void {
    this.execCommand('justifyFull');
  }

  // ============================================================================
  // Lists
  // ============================================================================

  insertOrderedList(): void {
    this.execCommand('insertOrderedList');
  }

  insertUnorderedList(): void {
    this.execCommand('insertUnorderedList');
  }

  // ============================================================================
  // Indentation
  // ============================================================================

  indent(): void {
    this.execCommand('indent');
  }

  outdent(): void {
    this.execCommand('outdent');
  }

  // ============================================================================
  // History
  // ============================================================================

  undo(): void {
    this.execCommand('undo');
  }

  redo(): void {
    this.execCommand('redo');
  }

  // ============================================================================
  // Formatting
  // ============================================================================

  removeFormat(): void {
    this.execCommand('removeFormat');
  }

  changeTextColor(color: string): void {
    this.execCommand('foreColor', color);
  }

  changeBackgroundColor(color: string): void {
    this.execCommand('hiliteColor', color);
  }

  // ============================================================================
  // Block Elements
  // ============================================================================

  insertHeading(heading: HeadingOption): void {
    this.execCommand('formatBlock', `<${heading.tag}>`);
  }

  insertParagraph(): void {
    this.execCommand('formatBlock', '<p>');
  }

  insertBlockquote(): void {
    this.execCommand('formatBlock', '<blockquote>');
  }

  // ============================================================================
  // Insert Elements
  // ============================================================================

  insertLink(): void {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      this.execCommand('createLink', url);
    }
  }

  insertImage(): void {
    const url = prompt('Enter image URL:', 'https://');
    if (url) {
      this.execCommand('insertImage', url);
    }
  }

  insertHorizontalRule(): void {
    this.execCommand('insertHorizontalRule');
  }

  insertTable(rows = 3, cols = 3): void {
    const tableHtml = this.generateTableHtml(rows, cols);
    this.execCommand('insertHTML', tableHtml);
  }

  insertTabSpaces(): void {
    this.execCommand('insertText', '    ');
  }

  // ============================================================================
  // Clipboard
  // ============================================================================

  async copyToClipboard(): Promise<void> {
    const content = this.editorState.content();
    try {
      await navigator.clipboard.writeText(content);
      this.showNotification('HTML copied to clipboard');
    } catch {
      this.showNotification('Failed to copy to clipboard');
    }
  }

  // ============================================================================
  // Content Management
  // ============================================================================

  clearContent(): void {
    if (confirm('Are you sure you want to clear all content?')) {
      if (this.editorElement) {
        this.editorElement.innerHTML = '';
      }
      this.syncContent('command');
      this.showNotification('Content cleared');
    }
  }

  /** Sync content from editor element to state */
  syncContent(changeType: 'input' | 'paste' | 'command' | 'undo' | 'redo' | 'format' | 'delete' = 'input'): void {
    if (this.editorElement) {
      const html = this.editorElement.innerHTML;
      this.editorState.updateContent(html, changeType);
    }
  }

  /** Update editor element from state */
  syncToEditor(): void {
    if (this.editorElement) {
      const content = this.editorState.content();
      if (this.editorElement.innerHTML !== content) {
        this.editorElement.innerHTML = content;
      }
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private execCommand(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.syncContent('command');
    this.editorState.updateFormattingState();
  }

  private generateTableHtml(rows: number, cols: number): string {
    let html = '<table><thead><tr>';
    for (let c = 0; c < cols; c++) {
      html += `<th>Header ${c + 1}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (let r = 0; r < rows - 1; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td>Cell ${r + 1}-${c + 1}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
