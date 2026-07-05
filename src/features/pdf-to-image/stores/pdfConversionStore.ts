import { defineStore } from "pinia";
import { readJson, writeJson } from "../../../shared/storage/localSettings";
import { isPdfFile } from "../../../shared/utils/files";
import type {
  PasswordProvider,
  PdfQueueItem,
  PdfRenderSettings,
  RenderedPage
} from "../types";

const SETTINGS_KEY = "invoiceforge.pdf.settings";

const defaultSettings: PdfRenderSettings = {
  dpi: 216,
  includeAllPages: true
};

const createId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createItem = (file: File): PdfQueueItem => ({
  id: createId(),
  file,
  name: file.name,
  size: file.size,
  status: "queued",
  pagesDone: 0,
  pagesTotal: 0,
  outputs: [],
  errorKey: null,
  errorMessage: null,
  thumbnailUrl: null,
  thumbnailFailed: false
});

const isRenderError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  "code" in error &&
  (error as { name?: string }).name === "PdfRenderError";

const errorToKey = (error: unknown) => {
  if (isRenderError(error)) {
    return error.code;
  }
  if (error instanceof Error && error.message in knownErrorKeys) {
    return error.message;
  }
  return "conversionFailed";
};

const knownErrorKeys = {
  conversionFailed: true,
  canvasTooLarge: true,
  passwordRequired: true,
  wrongPassword: true,
  cancelled: true,
  folderPermissionDenied: true
} as const;

interface AddFilesResult {
  added: number;
  duplicated: number;
  rejected: number;
}

interface PdfConversionState {
  items: PdfQueueItem[];
  settings: PdfRenderSettings;
  directoryHandle: FileSystemDirectoryHandle | null;
  isConverting: boolean;
}

export const usePdfConversionStore = defineStore("pdfConversion", {
  state: (): PdfConversionState => ({
    items: [],
    settings: readJson<PdfRenderSettings>(SETTINGS_KEY, defaultSettings),
    directoryHandle: null,
    isConverting: false
  }),
  getters: {
    allOutputs: (state): RenderedPage[] => state.items.flatMap((item) => item.outputs),
    completedCount: (state) => state.items.filter((item) => item.status === "done").length,
    failedCount: (state) => state.items.filter((item) => item.status === "error").length,
    processedCount(): number {
      return this.completedCount + this.failedCount;
    },
    totalCount: (state) => state.items.length
  },
  actions: {
    setDpi(dpi: PdfRenderSettings["dpi"]) {
      this.settings.dpi = dpi;
      this.persistSettings();
    },
    setIncludeAllPages(includeAllPages: boolean) {
      this.settings.includeAllPages = includeAllPages;
      this.persistSettings();
    },
    persistSettings() {
      writeJson(SETTINGS_KEY, this.settings);
    },
    setDirectoryHandle(handle: FileSystemDirectoryHandle | null) {
      this.directoryHandle = handle;
    },
    addFiles(fileList: FileList | File[]): AddFilesResult {
      const incoming = Array.from(fileList);
      const existing = new Set(this.items.map((item) => `${item.name}-${item.size}`));
      let duplicated = 0;
      let rejected = 0;
      let added = 0;

      for (const file of incoming) {
        if (!isPdfFile(file)) {
          rejected += 1;
          continue;
        }

        const key = `${file.name}-${file.size}`;
        if (existing.has(key)) {
          duplicated += 1;
          continue;
        }

        const item = createItem(file);
        this.items.push(item);
        existing.add(key);
        added += 1;
        void this.generateThumbnail(item);
      }

      return { added, duplicated, rejected };
    },
    async generateThumbnail(item: PdfQueueItem) {
      try {
        const { renderPdfThumbnail } = await import("../services/pdfRenderer");
        item.thumbnailUrl = await renderPdfThumbnail(item.file);
      } catch {
        item.thumbnailFailed = true;
      }
    },
    removeItem(id: string) {
      const item = this.items.find((entry) => entry.id === id);
      if (item?.thumbnailUrl) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
      this.items = this.items.filter((entry) => entry.id !== id);
    },
    clearItems() {
      if (this.isConverting) {
        return;
      }

      for (const item of this.items) {
        if (item.thumbnailUrl) {
          URL.revokeObjectURL(item.thumbnailUrl);
        }
      }

      this.items = [];
    },
    async convertAll(passwordProvider: PasswordProvider) {
      if (this.isConverting || this.items.length === 0) {
        return [];
      }

      this.isConverting = true;
      const { renderPdfToPng } = await import("../services/pdfRenderer");

      for (const item of this.items) {
        item.status = "queued";
        item.pagesDone = 0;
        item.pagesTotal = 0;
        item.outputs = [];
        item.errorKey = null;
        item.errorMessage = null;
      }

      for (const item of this.items) {
        item.status = "scanning";
        try {
          const outputs = await renderPdfToPng(item.file, this.settings, passwordProvider, {
            onDocumentLoaded: (targetPages) => {
              item.status = "rendering";
              item.pagesTotal = targetPages;
            },
            onPageRendered: () => {
              item.pagesDone += 1;
            }
          });

          item.outputs = outputs;
          item.status = "done";
        } catch (error) {
          item.status = "error";
          item.errorKey = errorToKey(error);
          item.errorMessage = error instanceof Error ? error.message : null;
        }
      }

      this.isConverting = false;
      return this.allOutputs;
    }
  }
});
