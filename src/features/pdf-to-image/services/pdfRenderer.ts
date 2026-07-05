import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy
} from "pdfjs-dist/types/src/display/api";
import { getSafeCanvasPixelBudget } from "../../../shared/platform/capabilities";
import { safeFileBaseName } from "../../../shared/utils/files";
import type { PasswordProvider, PdfRenderSettings, RenderedPage } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const assetBase = `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}pdfjs/`;
const maxCanvasEdge = 8192;

export class PdfRenderError extends Error {
  constructor(
    readonly code: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = "PdfRenderError";
  }
}

const isPasswordException = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name?: string }).name === "PasswordException";

const createDocumentOptions = (data: Uint8Array, password?: string) => ({
  data,
  password,
  cMapUrl: `${assetBase}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${assetBase}standard_fonts/`,
  wasmUrl: `${assetBase}wasm/`,
  iccUrl: `${assetBase}iccs/`,
  useSystemFonts: true,
  disableFontFace: false,
  enableXfa: true,
  stopAtErrors: false
});

interface LoadedDocument {
  pdf: PDFDocumentProxy;
  task: PDFDocumentLoadingTask;
}

const loadDocument = async (
  file: File,
  passwordProvider?: PasswordProvider
): Promise<LoadedDocument> => {
  const source = await file.arrayBuffer();
  let password: string | undefined;
  let reason: "required" | "incorrect" = "required";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const task = pdfjsLib.getDocument(createDocumentOptions(new Uint8Array(source.slice(0)), password));
    try {
      const pdf = await task.promise;
      return { pdf, task };
    } catch (error) {
      await task.destroy();
      if (!isPasswordException(error)) {
        throw error;
      }

      if (!passwordProvider) {
        throw new PdfRenderError("passwordRequired");
      }

      const nextPassword = await passwordProvider({
        fileName: file.name,
        reason
      });

      if (!nextPassword) {
        throw new PdfRenderError("cancelled");
      }

      password = nextPassword;
      reason = "incorrect";
    }
  }

  throw new PdfRenderError("wrongPassword");
};

const constrainScale = (page: PDFPageProxy, desiredScale: number) => {
  const budget = getSafeCanvasPixelBudget();
  let scale = desiredScale;
  let viewport = page.getViewport({ scale });

  const shrinkToBudget = () => {
    const pixels = viewport.width * viewport.height;
    const edgeRatio = Math.min(maxCanvasEdge / viewport.width, maxCanvasEdge / viewport.height, 1);
    const pixelRatio = pixels > budget ? Math.sqrt(budget / pixels) : 1;
    const ratio = Math.min(edgeRatio, pixelRatio);

    if (ratio < 1) {
      scale *= ratio;
      viewport = page.getViewport({ scale });
      return true;
    }

    return false;
  };

  while (shrinkToBudget()) {
    if (scale < 0.5) {
      throw new PdfRenderError("canvasTooLarge");
    }
  }

  return { scale, viewport };
};

const canvasToPng = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new PdfRenderError("conversionFailed"));
      }
    }, "image/png");
  });

const renderPage = async (
  page: PDFPageProxy,
  settings: PdfRenderSettings,
  fileName: string,
  pageNumber: number,
  totalPages: number
): Promise<RenderedPage> => {
  const desiredScale = settings.dpi / 72;
  const { scale, viewport } = constrainScale(page, desiredScale);
  const canvas = document.createElement("canvas");
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: false
  });

  if (!context) {
    throw new PdfRenderError("conversionFailed");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    intent: "print",
    background: "rgb(255,255,255)"
  }).promise;

  const blob = await canvasToPng(canvas);
  canvas.width = 1;
  canvas.height = 1;
  page.cleanup();

  const base = safeFileBaseName(fileName);
  const suffix = totalPages > 1 ? `-p${String(pageNumber).padStart(2, "0")}` : "";

  return {
    fileName: `${base}${suffix}.png`,
    blob,
    pageNumber,
    width,
    height,
    dpi: Math.round(scale * 72)
  };
};

export const renderPdfToPng = async (
  file: File,
  settings: PdfRenderSettings,
  passwordProvider: PasswordProvider,
  callbacks: {
    onDocumentLoaded?: (targetPages: number, documentPages: number) => void;
    onPageRendered?: (pageNumber: number) => void;
  } = {}
) => {
  let loaded: LoadedDocument | null = null;
  try {
    loaded = await loadDocument(file, passwordProvider);
    const documentPages = loaded.pdf.numPages;
    const targetPages = settings.includeAllPages ? documentPages : 1;
    const results: RenderedPage[] = [];

    callbacks.onDocumentLoaded?.(targetPages, documentPages);

    for (let pageNumber = 1; pageNumber <= targetPages; pageNumber += 1) {
      const page = await loaded.pdf.getPage(pageNumber);
      const rendered = await renderPage(page, settings, file.name, pageNumber, targetPages);
      results.push(rendered);
      callbacks.onPageRendered?.(pageNumber);
    }

    return results;
  } finally {
    await loaded?.pdf.cleanup();
    await loaded?.task.destroy();
  }
};

export const renderPdfThumbnail = async (file: File) => {
  let loaded: LoadedDocument | null = null;
  try {
    loaded = await loadDocument(file);
    const page = await loaded.pdf.getPage(1);
    const { viewport } = constrainScale(page, 0.35);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new PdfRenderError("conversionFailed");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      background: "rgb(255,255,255)"
    }).promise;

    const url = canvas.toDataURL("image/webp", 0.68);
    canvas.width = 1;
    canvas.height = 1;
    page.cleanup();
    return url;
  } finally {
    await loaded?.pdf.cleanup();
    await loaded?.task.destroy();
  }
};
