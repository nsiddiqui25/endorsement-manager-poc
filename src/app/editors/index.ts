/**
 * Editors Library - Main Barrel Export
 *
 * This module provides two HTML editor components:
 * - `dg-mini-html-editor`: Compact editor with floating toolbar (for inline editing)
 * - `dg-html-editor`: Full-featured editor with toolbar, source view, and status bar
 *
 * @module editors
 *
 * @example
 * ```typescript
 * // Import specific editor
 * import { DgMiniHtmlEditorComponent } from './editors/dg-mini-html-editor';
 * import { DgHtmlEditorComponent } from './editors/dg-html-editor';
 *
 * // Or import from main barrel
 * import { DgMiniHtmlEditorComponent, DgHtmlEditorComponent } from './editors';
 * ```
 */

// ============================================================================
// Mini HTML Editor (compact with floating toolbar)
// ============================================================================

export {
  DgMiniHtmlEditorComponent,
  DgFloatingToolbarComponent,
} from './dg-mini-html-editor';

// ============================================================================
// Full HTML Editor (with toolbar, source panel, status bar)
// ============================================================================

export {
  DgHtmlEditorComponent,
  DgEditorToolbarComponent,
  DgWysiwygEditorComponent,
  DgSourceCodePanelComponent,
  DgEditorStatusBarComponent,
  EditorStateService,
  EditorCommandService,
  KeyboardShortcutService,
  SyntaxHighlightService,
  HtmlFormatterService,
} from './dg-html-editor';

// ============================================================================
// Shared Types and Utilities
// ============================================================================

export type {
  // Formatting types
  BaseFormattingState,
  FormattingState,
  FullFormattingState,
  FormattingCommand,
  ExtendedFormattingCommand,
  // Toolbar types
  ToolbarButtonConfig,
  MiniToolbarConfig,
  FullToolbarConfig,
  ToolbarConfig,
  // Color types
  ColorOption,
  PaletteColor,
  // Editor types
  EditorTheme,
  EditorViewMode,
  ContentChangeType,
  EditorContentChangeEvent,
  SelectionChangeEvent,
  FormatOptions,
  HeadingOption,
  EditorConfig,
} from './shared';

export {
  // Formatting constants
  INITIAL_BASE_FORMATTING_STATE,
  INITIAL_FORMATTING_STATE,
  INITIAL_FULL_FORMATTING_STATE,
  // Toolbar presets
  DEFAULT_MINI_TOOLBAR_CONFIG,
  FULL_MINI_TOOLBAR_CONFIG,
  MINIMAL_TOOLBAR_CONFIG,
  DEFAULT_FULL_TOOLBAR_CONFIG,
  // Color palettes
  COLOR_PALETTE,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
  // Editor constants
  HEADING_OPTIONS,
  DEFAULT_FORMAT_OPTIONS,
  DEFAULT_EDITOR_CONFIG,
  // Shared services
  FormattingCommandService,
  SelectionService,
} from './shared';
