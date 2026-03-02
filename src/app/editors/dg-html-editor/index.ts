/**
 * DG HTML Editor - Barrel Export
 * @module editors/dg-html-editor
 */

// Main component
export { DgHtmlEditorComponent } from './dg-html-editor.component';

// Sub-components
export {
  DgEditorToolbarComponent,
  DgWysiwygEditorComponent,
  DgSourceCodePanelComponent,
  DgEditorStatusBarComponent,
} from './components';

// Services
export {
  EditorStateService,
  EditorCommandService,
  KeyboardShortcutService,
  SyntaxHighlightService,
  HtmlFormatterService,
  type ShortcutResult,
} from './services';
