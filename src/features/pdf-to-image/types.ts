export type ConversionStatus = "queued" | "scanning" | "rendering" | "done" | "error";

export interface PdfRenderSettings {
  dpi: 144 | 216 | 300;
  includeAllPages: boolean;
}

export interface RenderedPage {
  fileName: string;
  blob: Blob;
  pageNumber: number;
  width: number;
  height: number;
  dpi: number;
}

export interface PdfQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: ConversionStatus;
  pagesDone: number;
  pagesTotal: number;
  outputs: RenderedPage[];
  errorKey: string | null;
  errorMessage: string | null;
  thumbnailUrl: string | null;
  thumbnailFailed: boolean;
}

export interface PasswordRequest {
  fileName: string;
  reason: "required" | "incorrect";
}

export type PasswordProvider = (request: PasswordRequest) => Promise<string | null>;
