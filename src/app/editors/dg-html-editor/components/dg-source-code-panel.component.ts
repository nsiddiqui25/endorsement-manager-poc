/**
 * @fileoverview Source Code Panel Component
 *
 * Displays HTML source code with syntax highlighting.
 *
 * @module editors/dg-html-editor/components
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EditorStateService, SyntaxHighlightService } from '../services';

/**
 * DgSourceCodePanelComponent
 *
 * Displays syntax-highlighted HTML source with line numbers.
 */
@Component({
  selector: 'dg-source-code-panel',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './dg-source-code-panel.component.html',
  styleUrl: './dg-source-code-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgSourceCodePanelComponent {
  private readonly editorState = inject(EditorStateService);
  private readonly syntaxHighlight = inject(SyntaxHighlightService);

  readonly showLineNumbers = input<boolean>(true);
  readonly readonly = input<boolean>(true);

  readonly closed = output<void>();

  protected readonly content = computed(() => this.editorState.content());

  protected readonly highlightedContent = computed(() =>
    this.syntaxHighlight.highlight(this.content())
  );

  protected readonly lineNumbers = computed(() => {
    const content = this.content();
    const lineCount = content ? content.split('\n').length : 1;
    return this.syntaxHighlight.generateLineNumbers(lineCount);
  });

  onClose(): void {
    this.editorState.toggleSourceCode();
    this.closed.emit();
  }

  onContentChange(value: string): void {
    if (!this.readonly()) {
      this.editorState.updateContent(value, 'input');
    }
  }
}
