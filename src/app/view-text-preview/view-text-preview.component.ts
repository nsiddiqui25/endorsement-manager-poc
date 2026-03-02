import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-view-text-preview',
  standalone: true,
  templateUrl: './view-text-preview.component.html',
  styleUrl: './view-text-preview.component.scss'
})
export class ViewTextPreviewComponent implements OnChanges {
  @Input() url = '';
  @Input() title = 'View endorsement text';
  safeUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.safeUrl = this.url
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this.url)
      : null;
  }
}
