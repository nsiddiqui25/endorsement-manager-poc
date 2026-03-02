import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EndorsementResponse, FillBlanksRequest, FillBlankMethod } from '../models';

/**
 * EndorsementService
 *
 * Handles API communication for endorsement operations.
 * Single responsibility: HTTP communication only.
 */
@Injectable({
  providedIn: 'root',
})
export class EndorsementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://localhost:7234/api/endorsements';

  /**
   * Fetch endorsement PDF by form display number
   */
  getEndorsement(formDisplayNumber: string): Observable<EndorsementResponse> {
    return this.http
      .get(`${this.baseUrl}/${encodeURIComponent(formDisplayNumber)}`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(map((response) => this.extractBlobResponse(response)));
  }

  /**
   * Fill blanks and get the resulting PDF
   */
  fillBlanks(
    formDisplayNumber: string,
    blanks: string[],
    fillBlankMethod: FillBlankMethod = FillBlankMethod.Overlap
  ): Observable<EndorsementResponse> {
    const request: FillBlanksRequest = { formDisplayNumber, blanks, fillBlankMethod };
    return this.http
      .post(`${this.baseUrl}/fill`, request, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(map((response) => this.extractBlobResponse(response)));
  }

  private extractBlobResponse(response: HttpResponse<Blob>): EndorsementResponse {
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'endorsement.pdf';

    if (contentDisposition) {
      // Try filename*= first (RFC 5987 encoded)
      let filenameMatch = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;\n]*)/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      } else {
        // Fall back to filename=
        filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
    }

    return {
      blob: response.body!,
      filename,
    };
  }
}
