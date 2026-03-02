/**
 * @fileoverview Unified Formatting Models
 * 
 * Core type definitions for text formatting state and commands.
 * Used by both dg-html-editor and dg-mini-html-editor components.
 * 
 * @module editors/shared/models
 */

// ============================================================================
// Formatting State
// ============================================================================

/**
 * Basic formatting state for inline text styles.
 * Used by the mini editor and as a base for the full editor.
 */
export interface BaseFormattingState {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strikethrough: boolean;
}

/**
 * Extended formatting state including colors.
 * Used by both editors for color-aware formatting.
 */
export interface FormattingState extends BaseFormattingState {
  readonly textColor: string | null;
  readonly highlightColor: string | null;
}

/**
 * Full formatting state including lists and alignment.
 * Used exclusively by the full HTML editor.
 */
export interface FullFormattingState extends FormattingState {
  readonly orderedList: boolean;
  readonly unorderedList: boolean;
  readonly alignLeft: boolean;
  readonly alignCenter: boolean;
  readonly alignRight: boolean;
  readonly alignJustify: boolean;
}

// ============================================================================
// Formatting Commands
// ============================================================================

/** Basic inline formatting command types */
export type InlineCommandType = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strikethrough';

/** History command types */
export type HistoryCommandType = 'undo' | 'redo';

/** Color command types */
export type ColorCommandType = 'textColor' | 'highlightColor';

/** Clear formatting command */
export type ClearCommandType = 'clearFormatting';

/** List command types (full editor only) */
export type ListCommandType = 'orderedList' | 'unorderedList';

/** Alignment command types (full editor only) */
export type AlignCommandType = 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify';

/** Insert command types (full editor only) */
export type InsertCommandType = 'insertLink' | 'insertImage' | 'insertTable' | 'insertHorizontalRule';

/**
 * Union type for commands that can be executed.
 * Uses discriminated union for type-safe command handling.
 */
export type FormattingCommand =
  | { readonly type: InlineCommandType }
  | { readonly type: HistoryCommandType }
  | { readonly type: ColorCommandType; readonly color: string }
  | { readonly type: ClearCommandType };

/**
 * Extended commands for the full HTML editor.
 */
export type ExtendedFormattingCommand =
  | FormattingCommand
  | { readonly type: ListCommandType }
  | { readonly type: AlignCommandType }
  | { readonly type: InsertCommandType; readonly value?: string };

// ============================================================================
// Defaults & Constants
// ============================================================================

/** Initial/empty base formatting state */
export const INITIAL_BASE_FORMATTING_STATE: BaseFormattingState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
} as const;

/** Initial/empty formatting state with colors */
export const INITIAL_FORMATTING_STATE: FormattingState = {
  ...INITIAL_BASE_FORMATTING_STATE,
  textColor: null,
  highlightColor: null,
} as const;

/** Initial/empty full formatting state */
export const INITIAL_FULL_FORMATTING_STATE: FullFormattingState = {
  ...INITIAL_FORMATTING_STATE,
  orderedList: false,
  unorderedList: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
} as const;
