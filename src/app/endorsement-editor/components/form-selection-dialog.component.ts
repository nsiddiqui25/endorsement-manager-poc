import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type {
  FormSelectionDialogData,
  FormSelectionDialogResult,
} from '../models';

/**
 * FormSelectionDialogComponent
 *
 * Dialog for selecting/entering a form display number.
 * Designed for future extensibility with autocomplete functionality.
 */
@Component({
  selector: 'app-form-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>description</mat-icon>
      {{ data.title }}
    </h2>

    <mat-dialog-content class="p-3">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ data.placeholder }}</mat-label>
        <input
          matInput
          [(ngModel)]="formDisplayNumber"
          [placeholder]="data.placeholder"
          (keydown.enter)="onSubmit()"
          autofocus
          #inputField
        />
        <mat-icon matSuffix>search</mat-icon>
        <mat-hint>Enter the form display number to load the endorsement</mat-hint>
      </mat-form-field>

      <!-- Future: Autocomplete results will appear here -->
      <!-- <div class="search-results" *ngIf="searchResults.length > 0">
        <mat-list>
          <mat-list-item *ngFor="let result of searchResults" (click)="selectResult(result)">
            {{ result.formDisplayNumber }} - {{ result.formName }}
          </mat-list-item>
        </mat-list>
      </div> -->
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelLabel }}
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!formDisplayNumber.trim()"
        (click)="onSubmit()"
      >
        <mat-icon>download</mat-icon>
        {{ data.submitLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          color: #1976d2;
        }
      }

      mat-dialog-content {
        min-width: 400px;
        padding-top: 16px;
      }

      .full-width {
        width: 100%;
      }

      mat-dialog-actions {
        padding: 16px 24px;

        button mat-icon {
          margin-right: 4px;
        }
      }

      /* Future: Autocomplete results styling */
      .search-results {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-top: 8px;
      }
      
        .p-3 {
        padding: 16px !important;
        }
    `,
  ],
})
export class FormSelectionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<FormSelectionDialogComponent>);
  readonly data: FormSelectionDialogData = inject(MAT_DIALOG_DATA);

  formDisplayNumber: string = this.data.initialValue ?? 'D26740';
  // formDisplayNumber: string =  'D16712 (25)';

  // Future: For autocomplete functionality
  // searchResults: FormSearchResult[] = [];
  // private readonly searchSubject = new Subject<string>();

  onSubmit(): void {
    const trimmed = this.formDisplayNumber.trim();
    if (trimmed) {
      const result: FormSelectionDialogResult = {
        formDisplayNumber: trimmed,
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  // Future: Autocomplete selection
  // selectResult(result: FormSearchResult): void {
  //   this.formDisplayNumber = result.formDisplayNumber;
  //   this.onSubmit();
  // }
}
