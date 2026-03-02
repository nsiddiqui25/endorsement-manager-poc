/**
 * @fileoverview Editor Toolbar Component
 *
 * Full-featured toolbar for the HTML editor.
 *
 * @module editors/dg-html-editor/components
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { EditorStateService, EditorCommandService } from '../services';
import {
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
  HEADING_OPTIONS,
  type ColorOption,
  type HeadingOption,
  type FullFormattingState,
} from '../../shared/models';

/**
 * DgEditorToolbarComponent
 *
 * Full toolbar with text formatting, colors, alignment, lists, and insert options.
 */
@Component({
  selector: 'dg-editor-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './dg-editor-toolbar.component.html',
  styleUrl: './dg-editor-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgEditorToolbarComponent {
  protected readonly editorState = inject(EditorStateService);
  protected readonly commands = inject(EditorCommandService);

  readonly showSourceCodeButton = input<boolean>(true);
  readonly sourceCodeToggled = output<void>();

  protected readonly headingOptions = HEADING_OPTIONS;
  protected readonly textColors = TEXT_COLORS;
  protected readonly highlightColors = HIGHLIGHT_COLORS;

  protected get formatting(): FullFormattingState {
    return this.editorState.formattingState();
  }

  protected get isSourceCodeVisible(): boolean {
    return this.editorState.showSourceCode();
  }

  // ============================================================================
  // Toolbar Actions
  // ============================================================================

  onBold(): void {
    this.commands.bold();
  }

  onItalic(): void {
    this.commands.italic();
  }

  onUnderline(): void {
    this.commands.underline();
  }

  onStrikethrough(): void {
    this.commands.strikethrough();
  }

  onAlignLeft(): void {
    this.commands.alignLeft();
  }

  onAlignCenter(): void {
    this.commands.alignCenter();
  }

  onAlignRight(): void {
    this.commands.alignRight();
  }

  onAlignJustify(): void {
    this.commands.alignJustify();
  }

  onOrderedList(): void {
    this.commands.insertOrderedList();
  }

  onUnorderedList(): void {
    this.commands.insertUnorderedList();
  }

  onIndent(): void {
    this.commands.indent();
  }

  onOutdent(): void {
    this.commands.outdent();
  }

  onUndo(): void {
    this.commands.undo();
  }

  onRedo(): void {
    this.commands.redo();
  }

  onRemoveFormat(): void {
    this.commands.removeFormat();
  }

  onTextColor(color: string): void {
    this.commands.changeTextColor(color);
  }

  onHighlightColor(color: string): void {
    this.commands.changeBackgroundColor(color);
  }

  onHeading(heading: HeadingOption): void {
    this.commands.insertHeading(heading);
  }

  onParagraph(): void {
    this.commands.insertParagraph();
  }

  onBlockquote(): void {
    this.commands.insertBlockquote();
  }

  onInsertLink(): void {
    this.commands.insertLink();
  }

  onInsertImage(): void {
    this.commands.insertImage();
  }

  onInsertTable(): void {
    this.commands.insertTable();
  }

  onInsertHorizontalRule(): void {
    this.commands.insertHorizontalRule();
  }

  onCopyHtml(): void {
    this.commands.copyToClipboard();
  }

  onClearContent(): void {
    this.commands.clearContent();
  }

  onToggleSourceCode(): void {
    this.editorState.toggleSourceCode();
    this.sourceCodeToggled.emit();
  }

  getHeadingFontSize(tag: string): string {
    const sizes: Record<string, string> = {
      h1: '24px',
      h2: '20px',
      h3: '18px',
      h4: '16px',
      h5: '14px',
      h6: '12px',
    };
    return sizes[tag] || '14px';
  }
}
