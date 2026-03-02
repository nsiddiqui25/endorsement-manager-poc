/**
 * @fileoverview Shared Models - Barrel Export
 * 
 * Central export point for all shared model types and constants.
 * 
 * @module editors/shared/models
 */

// Formatting models
export {
  type BaseFormattingState,
  type FormattingState,
  type FullFormattingState,
  type InlineCommandType,
  type HistoryCommandType,
  type ColorCommandType,
  type ClearCommandType,
  type ListCommandType,
  type AlignCommandType,
  type InsertCommandType,
  type FormattingCommand,
  type ExtendedFormattingCommand,
  INITIAL_BASE_FORMATTING_STATE,
  INITIAL_FORMATTING_STATE,
  INITIAL_FULL_FORMATTING_STATE,
} from './formatting.models';

// Toolbar models
export {
  type ToolbarButtonConfig,
  type ToolbarButton,
  type ToolbarButtonGroup,
  type MiniToolbarConfig,
  type FullToolbarConfig,
  type ToolbarConfig,
  DEFAULT_MINI_TOOLBAR_CONFIG,
  FULL_MINI_TOOLBAR_CONFIG,
  MINIMAL_TOOLBAR_CONFIG,
  DEFAULT_FULL_TOOLBAR_CONFIG,
} from './toolbar.models';

// Color models
export {
  type ColorOption,
  type PaletteColor,
  COLOR_PALETTE,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from './color.models';

// Editor models
export {
  type EditorTheme,
  type EditorViewMode,
  type ContentChangeType,
  type EditorContentChangeEvent,
  type HtmlUpdateEvent,
  type SelectionChangeEvent,
  type SavedSelection,
  type HeadingOption,
  type FormatOptions,
  type EditorConfig,
  HEADING_OPTIONS,
  DEFAULT_FORMAT_OPTIONS,
  DEFAULT_EDITOR_CONFIG,
} from './editor.models';
