/**
 * @fileoverview Formatting Command Service
 * 
 * Provides stateless formatting commands for contenteditable elements.
 * This is the core service used by both editors for text formatting.
 * 
 * @module editors/shared/services
 */

import { Injectable } from '@angular/core';
import type { FormattingState, FormattingCommand } from '../models';

/**
 * FormattingCommandService
 *
 * Stateless service for executing document.execCommand operations
 * and querying formatting state. All methods are pure functions
 * that operate on the current document selection.
 *
 * Design:
 * - Injectable without providedIn for component-level scoping
 * - All methods are stateless and side-effect free (except execute)
 * - Comprehensive error handling for all browser APIs
 *
 * @example
 * ```typescript
 * const service = inject(FormattingCommandService);
 * 
 * // Execute a formatting command
 * service.execute({ type: 'bold' }, editorElement);
 * 
 * // Query current state
 * const state = service.getFormattingState();
 * ```
 */
@Injectable()
export class FormattingCommandService {
  // ============================================================================
  // Command Execution
  // ============================================================================

  /**
   * Execute a formatting command on the document.
   * Ensures the editor element is focused before executing.
   *
   * @param command - The formatting command to execute
   * @param editorElement - Optional target element to focus
   * @returns Whether the command executed successfully
   */
  execute(command: FormattingCommand, editorElement?: HTMLElement): boolean {
    // Ensure focus is on the editor
    if (editorElement && document.activeElement !== editorElement) {
      editorElement.focus();
    }

    try {
      switch (command.type) {
        case 'bold':
          return document.execCommand('bold', false);
        case 'italic':
          return document.execCommand('italic', false);
        case 'underline':
          return document.execCommand('underline', false);
        case 'strikethrough':
          return document.execCommand('strikeThrough', false);
        case 'undo':
          return document.execCommand('undo', false);
        case 'redo':
          return document.execCommand('redo', false);
        case 'textColor':
          return document.execCommand('foreColor', false, command.color);
        case 'highlightColor':
          return document.execCommand('hiliteColor', false, command.color);
        case 'clearFormatting':
          return document.execCommand('removeFormat', false);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  /**
   * Get current formatting state at cursor/selection position.
   * Uses document.queryCommandState for boolean states and
   * document.queryCommandValue for color values.
   *
   * @returns Current formatting state
   */
  getFormattingState(): FormattingState {
    return {
      bold: this.queryCommandState('bold'),
      italic: this.queryCommandState('italic'),
      underline: this.queryCommandState('underline'),
      strikethrough: this.queryCommandState('strikeThrough'),
      textColor: this.normalizeColor(this.queryCommandValue('foreColor')),
      highlightColor: this.getHighlightColor(),
    };
  }

  /**
   * Get the current highlight/background color.
   * Tries both hiliteColor (Firefox) and backColor (Chrome/Safari) commands.
   * 
   * @returns Normalized hex color or null
   */
  private getHighlightColor(): string | null {
    // Try hiliteColor first (Firefox)
    let color = this.queryCommandValue('hiliteColor');
    let normalized = this.normalizeColor(color);
    
    // If hiliteColor didn't return a valid color, try backColor (Chrome/Safari)
    if (!normalized) {
      color = this.queryCommandValue('backColor');
      normalized = this.normalizeColor(color);
    }
    
    return normalized;
  }

  /**
   * Safely query command state with error handling.
   * 
   * @param command - The command to query
   * @returns Whether the command is active
   */
  private queryCommandState(command: string): boolean {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }

  /**
   * Safely query command value with error handling.
   * 
   * @param command - The command to query
   * @returns The command value or null
   */
  private queryCommandValue(command: string): string | null {
    try {
      const value = document.queryCommandValue(command);
      return value || null;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Color Normalization
  // ============================================================================

  /**
   * Normalize color value to uppercase hex format.
   * Handles various browser color formats: rgb(), rgba(), hex, named colors.
   *
   * @param color - Color value in any format
   * @returns Normalized #RRGGBB hex color or null for invalid/transparent
   */
  private normalizeColor(color: string | null): string | null {
    if (!color) return null;

    const lowerColor = color.toLowerCase().trim();
    
    // Handle transparent/empty values
    if (
      lowerColor === '' ||
      lowerColor === 'transparent' ||
      lowerColor === 'inherit' ||
      lowerColor === 'initial' ||
      lowerColor === 'rgba(0, 0, 0, 0)'
    ) {
      return null;
    }

    // Handle hex format
    if (color.startsWith('#')) {
      return this.normalizeHexColor(color);
    }

    // Handle rgb/rgba format
    return this.parseRgbColor(color);
  }

  /**
   * Normalize hex color to #RRGGBB format.
   * Expands short hex (#RGB) to full format.
   */
  private normalizeHexColor(hex: string): string {
    if (hex.length === 4) {
      // Expand #RGB to #RRGGBB
      const r = hex[1];
      const g = hex[2];
      const b = hex[3];
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return hex.toUpperCase();
  }

  /**
   * Parse rgb/rgba color string to hex format.
   */
  private parseRgbColor(color: string): string | null {
    const rgbaMatch = color.match(
      /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i
    );

    if (!rgbaMatch) return null;

    // Check if alpha is 0 (transparent)
    const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    if (alpha === 0) return null;

    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);

    // Convert to hex
    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  // ============================================================================
  // Text Utilities
  // ============================================================================

  /**
   * Get plain text length from HTML content.
   * Strips all HTML tags and counts only visible characters.
   *
   * @param html - HTML string to measure
   * @returns Character count of plain text content
   */
  getPlainTextLength(html: string): number {
    return this.getPlainText(html).length;
  }

  /**
   * Extract plain text from HTML content.
   * Creates a temporary DOM element to safely parse HTML.
   *
   * @param html - HTML string to convert
   * @returns Plain text without HTML tags
   */
  getPlainText(html: string): string {
    if (!html) return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Check if content exceeds max length (based on plain text).
   *
   * @param html - HTML content to check
   * @param maxLength - Maximum allowed length (null/undefined = unlimited)
   * @returns Whether content exceeds the limit
   */
  exceedsMaxLength(html: string, maxLength: number | null | undefined): boolean {
    if (maxLength === null || maxLength === undefined) return false;
    return this.getPlainTextLength(html) > maxLength;
  }
}
