/**
 * @fileoverview Color Palette Models
 * 
 * Unified color palettes for text and highlight colors.
 * Used by both editors for consistent color selection.
 * 
 * @module editors/shared/models
 */

// ============================================================================
// Color Types
// ============================================================================

/**
 * Color option with label for accessible color pickers.
 */
export interface ColorOption {
  readonly color: string;
  readonly label: string;
}

// ============================================================================
// Color Palettes
// ============================================================================

/**
 * Standard color palette for color pickers.
 * Organized in rows: grays, primary colors, secondary colors, pastels.
 */
export const COLOR_PALETTE = [
  // Grays
  '#000000', '#434343', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  // Primary colors
  '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
  // Secondary colors
  '#9900FF', '#FF00FF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3',
  // Pastels
  '#D0E0E3', '#CFE2F3', '#D9D2E9', '#EAD1DC',
] as const;

/**
 * Text colors with labels for accessibility.
 */
export const TEXT_COLORS: readonly ColorOption[] = [
  { color: '#000000', label: 'Black' },
  { color: '#434343', label: 'Dark Gray' },
  { color: '#e53935', label: 'Red' },
  { color: '#fb8c00', label: 'Orange' },
  { color: '#43a047', label: 'Green' },
  { color: '#1e88e5', label: 'Blue' },
  { color: '#8e24aa', label: 'Purple' },
  { color: '#6d4c41', label: 'Brown' },
] as const;

/**
 * Highlight colors with labels for accessibility.
 */
export const HIGHLIGHT_COLORS: readonly ColorOption[] = [
  { color: '#ffeb3b', label: 'Yellow' },
  { color: '#a5d6a7', label: 'Light Green' },
  { color: '#90caf9', label: 'Light Blue' },
  { color: '#f48fb1', label: 'Pink' },
  { color: '#ffcc80', label: 'Light Orange' },
  { color: '#ce93d8', label: 'Light Purple' },
  { color: '#ffffff', label: 'White' },
] as const;

// ============================================================================
// Utility Types
// ============================================================================

/** Extract color values from the palette as a type */
export type PaletteColor = typeof COLOR_PALETTE[number];
