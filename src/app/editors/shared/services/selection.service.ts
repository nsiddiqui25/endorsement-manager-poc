/**
 * @fileoverview Selection Utilities Service
 * 
 * Provides utilities for managing text selection in contenteditable elements.
 * Used by both editors for selection save/restore operations.
 * 
 * @module editors/shared/services
 */

import { Injectable } from '@angular/core';

/**
 * SelectionService
 *
 * Stateless service for managing browser text selection.
 * Provides utilities for saving, restoring, and manipulating selections.
 *
 * @example
 * ```typescript
 * const selection = inject(SelectionService);
 * 
 * // Save current selection
 * const saved = selection.saveSelection(editorElement);
 * 
 * // Later, restore it
 * selection.restoreSelection(saved);
 * ```
 */
@Injectable()
export class SelectionService {
  /**
   * Save the current selection if it's within the specified container.
   * Returns null if there's no selection or it's outside the container.
   *
   * @param container - The container element to check selection against
   * @returns Cloned Range or null
   */
  saveSelection(container: HTMLElement): Range | null {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      
      // Only save if selection is within our container
      if (!container.contains(range.commonAncestorContainer)) {
        return null;
      }

      return range.cloneRange();
    } catch {
      return null;
    }
  }

  /**
   * Restore a previously saved selection.
   *
   * @param range - The Range to restore
   * @returns Whether restoration succeeded
   */
  restoreSelection(range: Range | null): boolean {
    if (!range) return false;

    try {
      const selection = window.getSelection();
      if (!selection) return false;

      selection.removeAllRanges();
      selection.addRange(range.cloneRange());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the current selection.
   */
  clearSelection(): void {
    try {
      const selection = window.getSelection();
      selection?.removeAllRanges();
    } catch {
      // Ignore errors
    }
  }

  /**
   * Check if a screen point (x, y) falls within a Range's bounding rectangles.
   * Useful for determining if a click occurred within a selection.
   *
   * @param x - Screen X coordinate
   * @param y - Screen Y coordinate
   * @param range - The Range to check against
   * @returns Whether the point is within the range
   */
  isPointInRange(x: number, y: number, range: Range): boolean {
    try {
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get the currently selected text.
   *
   * @returns Selected text or empty string
   */
  getSelectedText(): string {
    try {
      const selection = window.getSelection();
      return selection?.toString() || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if there's an active selection (not collapsed).
   *
   * @returns Whether there's a non-collapsed selection
   */
  hasSelection(): boolean {
    try {
      const selection = window.getSelection();
      return selection !== null && !selection.isCollapsed;
    } catch {
      return false;
    }
  }
}
