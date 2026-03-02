/**
 * @fileoverview Toolbar Configuration Models
 * 
 * Provides type-safe configuration for editor toolbars,
 * supporting both the mini floating toolbar and the full editor toolbar.
 * 
 * @module editors/shared/models
 */

// ============================================================================
// Button Configuration
// ============================================================================

/**
 * Configuration for a single toolbar button.
 * Immutable by design using readonly properties.
 */
export interface ToolbarButtonConfig {
  /** Whether the button is visible in the toolbar */
  readonly visible: boolean;
  /** Whether the button is disabled (defaults to false) */
  readonly disabled?: boolean;
}

/**
 * Extended button configuration with metadata.
 * Used by the full editor toolbar.
 */
export interface ToolbarButton {
  readonly id: string;
  readonly icon: string;
  readonly tooltip: string;
  readonly shortcut?: string;
  readonly ariaLabel: string;
}

/**
 * Toolbar button group configuration.
 */
export interface ToolbarButtonGroup {
  readonly id: string;
  readonly buttons: readonly ToolbarButton[];
  readonly hideOnBreakpoint?: 'xs' | 'sm' | 'md' | 'lg';
}

// ============================================================================
// Mini Toolbar Configuration
// ============================================================================

/**
 * Complete toolbar configuration for the mini rich editor.
 * Controls visibility and state of each toolbar action.
 */
export interface MiniToolbarConfig {
  // Text formatting
  readonly bold: ToolbarButtonConfig;
  readonly italic: ToolbarButtonConfig;
  readonly underline: ToolbarButtonConfig;
  readonly strikethrough: ToolbarButtonConfig;

  // History
  readonly undo: ToolbarButtonConfig;
  readonly redo: ToolbarButtonConfig;

  // Colors
  readonly textColor: ToolbarButtonConfig;
  readonly highlightColor: ToolbarButtonConfig;

  // Additional
  readonly clearFormatting: ToolbarButtonConfig;

  // More menu behavior
  readonly showMoreMenu: boolean;
}

// ============================================================================
// Full Toolbar Configuration
// ============================================================================

/**
 * Complete toolbar configuration for the full html editor.
 * Extends mini toolbar with additional options.
 */
export interface FullToolbarConfig extends MiniToolbarConfig {
  // Lists
  readonly orderedList: ToolbarButtonConfig;
  readonly unorderedList: ToolbarButtonConfig;

  // Alignment
  readonly alignLeft: ToolbarButtonConfig;
  readonly alignCenter: ToolbarButtonConfig;
  readonly alignRight: ToolbarButtonConfig;
  readonly alignJustify: ToolbarButtonConfig;

  // Headings
  readonly headings: ToolbarButtonConfig;

  // Insert
  readonly link: ToolbarButtonConfig;
  readonly image: ToolbarButtonConfig;

  // View modes
  readonly sourceView: ToolbarButtonConfig;
}

// ============================================================================
// Presets
// ============================================================================

/** Default compact toolbar - shows basic formatting with more menu */
export const DEFAULT_MINI_TOOLBAR_CONFIG: MiniToolbarConfig = {
  bold: { visible: true },
  italic: { visible: true },
  underline: { visible: true },
  strikethrough: { visible: false },
  undo: { visible: false },
  redo: { visible: false },
  textColor: { visible: true },
  highlightColor: { visible: false },
  clearFormatting: { visible: false },
  showMoreMenu: true,
} as const;

/** Full toolbar configuration with all options visible */
export const FULL_MINI_TOOLBAR_CONFIG: MiniToolbarConfig = {
  bold: { visible: true },
  italic: { visible: true },
  underline: { visible: true },
  strikethrough: { visible: true },
  undo: { visible: true },
  redo: { visible: true },
  textColor: { visible: true },
  highlightColor: { visible: true },
  clearFormatting: { visible: true },
  showMoreMenu: false,
} as const;

/** Minimal toolbar - just bold, italic, underline */
export const MINIMAL_TOOLBAR_CONFIG: MiniToolbarConfig = {
  bold: { visible: true },
  italic: { visible: true },
  underline: { visible: true },
  strikethrough: { visible: false },
  undo: { visible: false },
  redo: { visible: false },
  textColor: { visible: false },
  highlightColor: { visible: false },
  clearFormatting: { visible: false },
  showMoreMenu: true,
} as const;

/** Default full editor toolbar configuration */
export const DEFAULT_FULL_TOOLBAR_CONFIG: FullToolbarConfig = {
  // Base mini config
  bold: { visible: true },
  italic: { visible: true },
  underline: { visible: true },
  strikethrough: { visible: true },
  undo: { visible: true },
  redo: { visible: true },
  textColor: { visible: true },
  highlightColor: { visible: true },
  clearFormatting: { visible: true },
  showMoreMenu: false,
  // Extended options
  orderedList: { visible: true },
  unorderedList: { visible: true },
  alignLeft: { visible: true },
  alignCenter: { visible: true },
  alignRight: { visible: true },
  alignJustify: { visible: true },
  headings: { visible: true },
  link: { visible: true },
  image: { visible: true },
  sourceView: { visible: true },
} as const;

// Legacy alias for backwards compatibility
export type ToolbarConfig = MiniToolbarConfig;
