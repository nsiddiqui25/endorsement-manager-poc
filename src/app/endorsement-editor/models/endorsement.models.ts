/**
 * Endorsement Editor Models and Interfaces
 */

/** Fill blank method enum - matches backend */
export enum FillBlankMethod {
  Overlap = 0,
  Insert = 1,
  Replace = 2,
}

/** Request payload for filling blanks */
export interface FillBlanksRequest {
  formDisplayNumber: string;
  blanks: string[];
  fillBlankMethod: FillBlankMethod;
}

/** Response wrapper for endorsement API calls */
export interface EndorsementResponse {
  blob: Blob;
  filename: string;
}

/** Endorsement document info */
export interface EndorsementDocumentInfo {
  numPages: number;
  formDisplayNumber: string;
  filename: string;
  title?: string;
  author?: string;
}

/** Endorsement load result */
export interface EndorsementLoadResult {
  success: boolean;
  documentInfo?: EndorsementDocumentInfo;
  outlines?: FlatOutlineItem[];
  error?: string;
}

/** PDF Outline/Bookmark item */
export interface PdfOutlineItem {
  title: string;
  bold: boolean;
  italic: boolean;
  color?: { r: number; g: number; b: number };
  dest: string | any[] | null;
  url: string | null;
  unsafeUrl?: string;
  newWindow?: boolean;
  count?: number;
  items: PdfOutlineItem[];
}

/** Flattened outline item for display */
export interface FlatOutlineItem {
  title: string;
  pageNumber: number | null;
  level: number;
  bold: boolean;
  italic: boolean;
  value?: string;
  destX?: number;
  destY?: number;
  underscoreCount?: number;
  underscoreWidth?: number;
  underscoreX?: number;
  underscoreY?: number;
}

/** Bookmark with calculated screen position for overlay */
export interface PositionedBookmark {
  item: FlatOutlineItem;
  x: number;
  y: number;
  height: number;
  stackIndex: number;
  stackOffset: number;
}

/** Bookmark value entry */
export interface BookmarkValue {
  title: string;
  value: string;
}

/** Form search result for future autocomplete */
export interface FormSearchResult {
  formDisplayNumber: string;
  formName?: string;
  description?: string;
}

/** Dialog data for form selection */
export interface FormSelectionDialogData {
  title: string;
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  initialValue?: string;
}

/** Dialog result */
export interface FormSelectionDialogResult {
  formDisplayNumber: string;
}
