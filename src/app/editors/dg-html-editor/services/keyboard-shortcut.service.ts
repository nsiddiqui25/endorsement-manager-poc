/**
 * @fileoverview Keyboard Shortcut Service
 *
 * Handles keyboard shortcuts for the HTML editor.
 *
 * @module editors/dg-html-editor/services
 */

import { Injectable, inject } from '@angular/core';
import { EditorStateService } from './editor-state.service';
import { EditorCommandService } from './editor-command.service';
import { HEADING_OPTIONS, type HeadingOption } from '../../shared/models';

/** Keyboard shortcut action result */
export interface ShortcutResult {
  handled: boolean;
  action?: string;
}

/**
 * KeyboardShortcutService
 *
 * Maps keyboard shortcuts to editor commands.
 */
@Injectable()
export class KeyboardShortcutService {
  private readonly editorState = inject(EditorStateService);
  private readonly commandService = inject(EditorCommandService);

  /** Process keydown event and execute appropriate action */
  handleKeydown(event: KeyboardEvent): ShortcutResult {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
    const key = event.key.toLowerCase();

    // Tab handling
    if (event.key === 'Tab') {
      return this.handleTab(event);
    }

    // Ctrl/Cmd shortcuts
    if (ctrlKey) {
      return this.handleCtrlShortcut(event, key);
    }

    // Alt shortcuts
    if (event.altKey && !ctrlKey && !event.shiftKey) {
      return this.handleAltShortcut(event, key);
    }

    return { handled: false };
  }

  private handleTab(event: KeyboardEvent): ShortcutResult {
    event.preventDefault();
    event.stopPropagation();

    const formatting = this.editorState.formattingState();
    const inList = formatting.orderedList || formatting.unorderedList;

    if (event.shiftKey) {
      document.execCommand('outdent', false);
    } else if (inList) {
      document.execCommand('indent', false);
    } else {
      document.execCommand('insertText', false, '    ');
    }

    this.commandService.syncContent('command');
    return { handled: true, action: event.shiftKey ? 'outdent' : 'indent' };
  }

  private handleCtrlShortcut(event: KeyboardEvent, key: string): ShortcutResult {
    if (event.shiftKey) {
      return this.handleCtrlShiftShortcut(event, key);
    }

    if (event.altKey) {
      return this.handleCtrlAltShortcut(event, key);
    }

    switch (key) {
      case 'b':
        event.preventDefault();
        this.commandService.bold();
        return { handled: true, action: 'bold' };

      case 'i':
        event.preventDefault();
        this.commandService.italic();
        return { handled: true, action: 'italic' };

      case 'u':
        event.preventDefault();
        this.commandService.underline();
        return { handled: true, action: 'underline' };

      case 'k':
        event.preventDefault();
        this.commandService.insertLink();
        return { handled: true, action: 'insertLink' };

      case 'y':
        event.preventDefault();
        this.commandService.redo();
        return { handled: true, action: 'redo' };

      case ']':
        event.preventDefault();
        this.commandService.indent();
        return { handled: true, action: 'indent' };

      case '[':
        event.preventDefault();
        this.commandService.outdent();
        return { handled: true, action: 'outdent' };

      case '\\':
        event.preventDefault();
        this.commandService.removeFormat();
        return { handled: true, action: 'removeFormat' };

      case 's':
        event.preventDefault();
        this.commandService.copyToClipboard();
        return { handled: true, action: 'save' };
    }

    return { handled: false };
  }

  private handleCtrlShiftShortcut(event: KeyboardEvent, key: string): ShortcutResult {
    switch (key) {
      case 'z':
        event.preventDefault();
        this.commandService.redo();
        return { handled: true, action: 'redo' };

      case 'l':
        event.preventDefault();
        this.commandService.alignLeft();
        return { handled: true, action: 'alignLeft' };

      case 'e':
        event.preventDefault();
        this.commandService.alignCenter();
        return { handled: true, action: 'alignCenter' };

      case 'r':
        event.preventDefault();
        this.commandService.alignRight();
        return { handled: true, action: 'alignRight' };

      case 'j':
        event.preventDefault();
        this.commandService.alignJustify();
        return { handled: true, action: 'alignJustify' };

      case '7':
        event.preventDefault();
        this.commandService.insertOrderedList();
        return { handled: true, action: 'orderedList' };

      case '8':
        event.preventDefault();
        this.commandService.insertUnorderedList();
        return { handled: true, action: 'unorderedList' };
    }

    return { handled: false };
  }

  private handleCtrlAltShortcut(event: KeyboardEvent, key: string): ShortcutResult {
    if (['1', '2', '3', '4', '5', '6'].includes(key)) {
      event.preventDefault();
      const level = parseInt(key, 10);
      const heading = HEADING_OPTIONS.find((h: HeadingOption) => h.level === level);
      if (heading) {
        this.commandService.insertHeading(heading);
        return { handled: true, action: `heading${level}` };
      }
    }

    if (key === '0') {
      event.preventDefault();
      this.commandService.insertParagraph();
      return { handled: true, action: 'paragraph' };
    }

    return { handled: false };
  }

  private handleAltShortcut(event: KeyboardEvent, key: string): ShortcutResult {
    switch (key) {
      case 'q':
        event.preventDefault();
        this.commandService.insertBlockquote();
        return { handled: true, action: 'blockquote' };

      case 'h':
        event.preventDefault();
        this.commandService.insertHorizontalRule();
        return { handled: true, action: 'horizontalRule' };
    }

    return { handled: false };
  }
}
