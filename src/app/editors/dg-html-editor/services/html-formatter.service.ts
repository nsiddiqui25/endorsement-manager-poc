/**
 * @fileoverview HTML Formatter Service
 *
 * Formats/beautifies HTML code.
 *
 * @module editors/dg-html-editor/services
 */

import { Injectable } from '@angular/core';
import { FormatOptions, DEFAULT_FORMAT_OPTIONS } from '../../shared/models';

/**
 * HtmlFormatterService
 *
 * Provides HTML formatting, minification, and validation.
 */
@Injectable({ providedIn: 'root' })
export class HtmlFormatterService {
  /**
   * Format/beautify HTML code
   */
  format(html: string, options: Partial<FormatOptions> = {}): string {
    const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };

    if (!html || !html.trim()) return '';

    const normalized = this.normalizeWhitespace(html);
    return this.indent(normalized, opts);
  }

  private normalizeWhitespace(html: string): string {
    return html
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/>\s*</g, '>\n<')
      .trim();
  }

  private indent(html: string, options: FormatOptions): string {
    const indentChar = ' '.repeat(options.indentSize);
    const lines = html.split('\n');
    const result: string[] = [];
    let indentLevel = 0;

    const voidElements = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const closingTagMatch = trimmed.match(/^<\/([a-zA-Z][a-zA-Z0-9]*)/);
      if (closingTagMatch) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      result.push(indentChar.repeat(indentLevel) + trimmed);

      const openingTagMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
      if (openingTagMatch) {
        const tagName = openingTagMatch[1].toLowerCase();
        const isSelfClosing = trimmed.endsWith('/>');
        const isVoid = voidElements.has(tagName);
        const hasClosingOnSameLine = new RegExp(`</${tagName}\\s*>\\s*$`, 'i').test(trimmed);

        if (!isSelfClosing && !isVoid && !hasClosingOnSameLine) {
          indentLevel++;
        }
      }
    }

    return result.join('\n');
  }

  /** Minify HTML */
  minify(html: string): string {
    return html
      .replace(/\n/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  /** Validate basic HTML structure */
  validate(html: string): string[] {
    const errors: string[] = [];
    const tagStack: string[] = [];

    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
    let match;

    const voidElements = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    while ((match = tagRegex.exec(html)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();

      if (voidElements.has(tagName) || fullTag.endsWith('/>')) {
        continue;
      }

      if (fullTag.startsWith('</')) {
        if (tagStack.length === 0) {
          errors.push(`Unexpected closing tag </${tagName}> at position ${match.index}`);
        } else if (tagStack[tagStack.length - 1] !== tagName) {
          errors.push(
            `Mismatched tag: expected </${tagStack[tagStack.length - 1]}>, found </${tagName}>`
          );
        } else {
          tagStack.pop();
        }
      } else {
        tagStack.push(tagName);
      }
    }

    for (const tag of tagStack) {
      errors.push(`Unclosed tag: <${tag}>`);
    }

    return errors;
  }
}
