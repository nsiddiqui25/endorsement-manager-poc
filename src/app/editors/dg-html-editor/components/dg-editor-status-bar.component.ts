/**
 * @fileoverview Editor Status Bar Component
 *
 * Displays editor statistics and status information.
 *
 * @module editors/dg-html-editor/components
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { EditorStateService } from '../services';

/**
 * DgEditorStatusBarComponent
 *
 * Shows word count, character count, and editing status.
 */
@Component({
  selector: 'dg-editor-status-bar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dg-editor-status-bar.component.html',
  styleUrl: './dg-editor-status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgEditorStatusBarComponent {
  private readonly editorState = inject(EditorStateService);

  protected readonly wordCount = computed(() => this.editorState.wordCount());
  protected readonly characterCount = computed(() => this.editorState.characterCount());
  protected readonly isFocused = computed(() => this.editorState.isFocused());
}
