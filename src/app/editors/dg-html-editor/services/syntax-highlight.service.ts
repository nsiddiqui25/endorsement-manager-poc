/**
 * @fileoverview Syntax Highlight Service
 *
 * Converts raw HTML into HTML with syntax highlighting spans.
 *
 * @module editors/dg-html-editor/services
 */

import { Injectable } from '@angular/core';

/**
 * SyntaxHighlightService
 *
 * Provides syntax highlighting for HTML source code display.
 */
@Injectable({ providedIn: 'root' })
export class SyntaxHighlightService {
  /**
   * Highlight HTML code with syntax coloring
   */
  highlight(html: string): string {
    if (!html) return '';

    let result = this.escapeHtml(html);
    result = this.highlightComments(result);
    result = this.highlightDoctype(result);
    result = this.highlightTags(result);

    return result;
  }

  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private highlightComments(html: string): string {
    return html.replace(
      /(&lt;!--[\s\S]*?--&gt;)/g,
      '<span class="hl-comment">$1</span>'
    );
  }

  private highlightDoctype(html: string): string {
    return html.replace(
      /(&lt;!DOCTYPE[^&]*&gt;)/gi,
      '<span class="hl-doctype">$1</span>'
    );
  }

  private highlightTags(html: string): string {
    return html.replace(
      /(&lt;)(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^&]*?)?)(\/?&gt;)/g,
      (match, openBracket, slash, tagName, attributes, closeBracket) => {
        const highlightedAttrs = this.highlightAttributes(attributes);
        return (
          `<span class="hl-bracket">${openBracket}</span>` +
          `<span class="hl-slash">${slash}</span>` +
          `<span class="hl-tag">${tagName}</span>` +
          highlightedAttrs +
          `<span class="hl-bracket">${closeBracket}</span>`
        );
      }
    );
  }

  private highlightAttributes(attrString: string): string {
    if (!attrString || !attrString.trim()) return attrString;

    return attrString
      .replace(
        /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*(=)\s*(&quot;[^&]*&quot;|&#39;[^&]*&#39;|[^\s&]+)?/g,
        (match, name, equals, value) => {
          let result = `<span class="hl-attr">${name}</span>`;
          if (equals) {
            result += `<span class="hl-equals">${equals}</span>`;
          }
          if (value) {
            result += `<span class="hl-value">${value}</span>`;
          }
          return result;
        }
      )
      .replace(/\s([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?=\s|$|&gt;|\/)/g, (match, name) => {
        if (match.includes('class="hl-')) return match;
        return ` <span class="hl-attr">${name}</span>`;
      });
  }

  /** Get line count from content */
  getLineCount(content: string): number {
    if (!content) return 1;
    return content.split('\n').length;
  }

  /** Generate line numbers string */
  generateLineNumbers(count: number): string {
    return Array.from({ length: count }, (_, i) => i + 1)
      .map(n => `<span class="line-number">${n}</span>`)
      .join('\n');
  }
}
