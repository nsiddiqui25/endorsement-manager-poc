/**
 * @fileoverview Editor State Service
 *
 * Central state management for the full HTML editor.
 * Uses Angular signals for reactive state updates.
 *
 * @module editors/dg-html-editor/services
 */

import { Injectable, signal, computed } from '@angular/core';
import {
  FullFormattingState,
  INITIAL_FULL_FORMATTING_STATE,
  ContentChangeType,
  EditorContentChangeEvent,
} from '../../shared/models';

/**
 * EditorStateService
 *
 * Manages all editor state using signals.
 * Provides computed values for derived state.
 */
@Injectable()
export class EditorStateService {
  // ============================================================================
  // Content State
  // ============================================================================

  /** Current HTML content */
  readonly content = signal<string>('');

  /** Whether source code panel is visible */
  readonly showSourceCode = signal<boolean>(false);

  /** Whether editor has focus */
  readonly isFocused = signal<boolean>(false);

  // ============================================================================
  // Formatting State
  // ============================================================================

  /** Current formatting state at cursor position */
  readonly formattingState = signal<FullFormattingState>(INITIAL_FULL_FORMATTING_STATE);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /** Plain text content (HTML stripped) */
  readonly plainText = computed(() => {
    const html = this.content();
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  });

  /** Word count */
  readonly wordCount = computed(() => {
    const text = this.plainText().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  });

  /** Character count */
  readonly characterCount = computed(() => this.plainText().length);

  /** Line count in source code */
  readonly lineCount = computed(() => {
    const html = this.content();
    if (!html) return 0;
    return html.split('\n').length;
  });

  // ============================================================================
  // State Updates
  // ============================================================================

  /** Update content and return event data */
  updateContent(html: string, changeType: ContentChangeType): EditorContentChangeEvent {
    this.content.set(html);
    return {
      html,
      plainText: this.extractPlainText(html),
      timestamp: new Date(),
      changeType,
    };
  }

  /** Update formatting state from document commands */
  updateFormattingState(): void {
    const selection = window.getSelection();
    const hasValidSelection = selection && selection.rangeCount > 0 && selection.anchorNode;

    if (!hasValidSelection) {
      this.formattingState.set(INITIAL_FULL_FORMATTING_STATE);
      return;
    }

    if (!this.isSelectionInContentEditable(selection)) {
      this.formattingState.set(INITIAL_FULL_FORMATTING_STATE);
      return;
    }

    this.formattingState.set({
      bold: this.safeQueryCommandState('bold'),
      italic: this.safeQueryCommandState('italic'),
      underline: this.safeQueryCommandState('underline'),
      strikethrough: this.safeQueryCommandState('strikeThrough'),
      orderedList: this.safeQueryCommandState('insertOrderedList'),
      unorderedList: this.safeQueryCommandState('insertUnorderedList'),
      alignLeft: this.safeQueryCommandState('justifyLeft'),
      alignCenter: this.safeQueryCommandState('justifyCenter'),
      alignRight: this.safeQueryCommandState('justifyRight'),
      alignJustify: this.safeQueryCommandState('justifyFull'),
      textColor: this.safeQueryCommandValue('foreColor') || null,
      highlightColor: this.safeQueryCommandValue('backColor') || null,
    });
  }

  /** Toggle source code panel visibility */
  toggleSourceCode(): void {
    this.showSourceCode.update(v => !v);
  }

  /** Set focus state */
  setFocused(focused: boolean): void {
    this.isFocused.set(focused);
  }

  /** Reset state to defaults */
  reset(): void {
    this.content.set('');
    this.showSourceCode.set(false);
    this.isFocused.set(false);
    this.formattingState.set(INITIAL_FULL_FORMATTING_STATE);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private safeQueryCommandState(command: string): boolean {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }

  private safeQueryCommandValue(command: string): string | null {
    try {
      const value = document.queryCommandValue(command);
      return value || null;
    } catch {
      return null;
    }
  }

  private isSelectionInContentEditable(selection: Selection): boolean {
    let node: Node | null = selection.anchorNode;

    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (
          element.hasAttribute('contenteditable') &&
          element.getAttribute('contenteditable') !== 'false'
        ) {
          return true;
        }
      }
      node = node.parentNode;
    }

    return false;
  }

  private extractPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }
}
