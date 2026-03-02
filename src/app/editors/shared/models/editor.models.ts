/**
 * @fileoverview Editor Common Models
 * 
 * Common types and interfaces used across all editor components.
 * 
 * @module editors/shared/models
 */

// ============================================================================
// Theme Configuration
// ============================================================================

/** Editor theme options */
export type EditorTheme = 'light' | 'dark';

/** Editor view mode (WYSIWYG vs source code) */
export type EditorViewMode = 'wysiwyg' | 'source' | 'split';

// ============================================================================
// Editor Events
// ============================================================================

/** Types of content changes */
export type ContentChangeType = 'input' | 'paste' | 'command' | 'undo' | 'redo' | 'format' | 'delete';

/**
 * Event emitted when editor content changes.
 */
export interface EditorContentChangeEvent {
  /** The HTML content */
  readonly html: string;
  /** Plain text content (no HTML tags) */
  readonly plainText: string;
  /** Timestamp of the change */
  readonly timestamp: Date;
  /** Type of change that occurred */
  readonly changeType: ContentChangeType;
}

/**
 * Legacy alias for HtmlUpdateEvent.
 * @deprecated Use EditorContentChangeEvent instead
 */
export type HtmlUpdateEvent = EditorContentChangeEvent;

/**
 * Event emitted when text selection changes.
 */
export interface SelectionChangeEvent {
  readonly hasSelection: boolean;
  readonly isCollapsed: boolean;
  readonly selectedText: string;
}

// ============================================================================
// Selection Types
// ============================================================================

/**
 * Represents a saved text selection that can be restored later.
 */
export interface SavedSelection {
  readonly range: Range;
  readonly collapsed: boolean;
}

// ============================================================================
// Heading Configuration
// ============================================================================

/** Heading level option for the editor */
export interface HeadingOption {
  readonly level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly label: string;
  readonly tag: string;
  readonly fontSize?: string;
}

/** Available heading options */
export const HEADING_OPTIONS: readonly HeadingOption[] = [
  { level: 0, label: 'Normal', tag: 'p' },
  { level: 1, label: 'Heading 1', tag: 'h1', fontSize: '2em' },
  { level: 2, label: 'Heading 2', tag: 'h2', fontSize: '1.5em' },
  { level: 3, label: 'Heading 3', tag: 'h3', fontSize: '1.17em' },
  { level: 4, label: 'Heading 4', tag: 'h4', fontSize: '1em' },
  { level: 5, label: 'Heading 5', tag: 'h5', fontSize: '0.83em' },
  { level: 6, label: 'Heading 6', tag: 'h6', fontSize: '0.67em' },
] as const;

// ============================================================================
// Format Options
// ============================================================================

/** HTML formatting/beautification options */
export interface FormatOptions {
  readonly indentSize: number;
  readonly maxLineLength: number;
  readonly preserveNewlines: boolean;
  readonly trimWhitespace: boolean;
}

/** Default formatting options */
export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indentSize: 2,
  maxLineLength: 80,
  preserveNewlines: true,
  trimWhitespace: true,
} as const;

// ============================================================================
// Editor Configuration
// ============================================================================

/** Full editor configuration */
export interface EditorConfig {
  readonly theme: EditorTheme;
  readonly viewMode: EditorViewMode;
  readonly showToolbar: boolean;
  readonly showStatusBar: boolean;
  readonly enableKeyboardShortcuts: boolean;
  readonly autoFocus: boolean;
  readonly placeholder: string;
  readonly maxLength?: number;
  readonly formatOptions: FormatOptions;
}

/** Default editor configuration */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  theme: 'light',
  viewMode: 'wysiwyg',
  showToolbar: true,
  showStatusBar: true,
  enableKeyboardShortcuts: true,
  autoFocus: false,
  placeholder: 'Start typing...',
  formatOptions: DEFAULT_FORMAT_OPTIONS,
} as const;
