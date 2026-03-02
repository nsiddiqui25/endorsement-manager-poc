/**
 * @fileoverview Floating Toolbar Component
 *
 * A compact, floating toolbar for rich text formatting.
 * Displays configurable formatting buttons and color pickers.
 * Designed to appear above the editor on focus.
 *
 * @module editors/dg-mini-html-editor
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import type {
  MiniToolbarConfig,
  FormattingState,
  FormattingCommand,
} from '../shared/models';
import { COLOR_PALETTE } from '../shared/models';

/**
 * DgFloatingToolbarComponent
 *
 * Compact floating toolbar for the mini HTML editor.
 * Features:
 * - Configurable button visibility
 * - Color pickers for text and highlight
 * - "More" menu for hidden options
 * - Menu state tracking to prevent toolbar disappearing
 *
 * @example
 * ```html
 * <dg-floating-toolbar
 *   [config]="toolbarConfig"
 *   [formattingState]="currentState()"
 *   [visible]="isFocused()"
 *   (command)="onCommand($event)" />
 * ```
 */
@Component({
  selector: 'dg-floating-toolbar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './dg-floating-toolbar.component.html',
  styleUrl: './dg-floating-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DgFloatingToolbarComponent {
  // ============================================================================
  // Inputs
  // ============================================================================

  /** Toolbar configuration - controls which buttons are visible */
  readonly config = input.required<MiniToolbarConfig>();

  /** Current formatting state at cursor position */
  readonly formattingState = input.required<FormattingState>();

  /** Whether the toolbar should be visible */
  readonly visible = input<boolean>(false);

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when a formatting command is requested */
  readonly command = output<FormattingCommand>();

  /** Emitted when a menu opens (to keep toolbar visible) */
  readonly menuOpened = output<void>();

  /** Emitted when a menu closes */
  readonly menuClosed = output<void>();

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Track if any menu is currently open */
  protected readonly isMenuOpen = signal<boolean>(false);

  // ============================================================================
  // Constants
  // ============================================================================

  /** Color palette for color pickers */
  protected readonly colors = COLOR_PALETTE;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Check if there are hidden options that should appear in "more" menu
   */
  protected readonly hasHiddenOptions = computed(() => {
    const cfg = this.config();
    return (
      !cfg.strikethrough.visible ||
      !cfg.undo.visible ||
      !cfg.redo.visible ||
      !cfg.textColor.visible ||
      !cfg.highlightColor.visible ||
      !cfg.clearFormatting.visible
    );
  });

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Emit a formatting command
   */
  protected emitCommand(cmd: FormattingCommand): void {
    this.command.emit(cmd);
  }

  /**
   * Handle menu opened event
   */
  protected onMenuOpened(): void {
    this.isMenuOpen.set(true);
    this.menuOpened.emit();
  }

  /**
   * Handle menu closed event
   */
  protected onMenuClosed(): void {
    this.isMenuOpen.set(false);
    this.menuClosed.emit();
  }
}
