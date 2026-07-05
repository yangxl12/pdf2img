/// <reference types="vite/client" />

declare module "pdfjs-dist/legacy/build/pdf.worker.mjs?url" {
  const url: string;
  export default url;
}

declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

type FileSystemPermissionMode = "read" | "readwrite";
type FileSystemPermissionState = PermissionState;

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

interface FileSystemHandle {
  readonly kind: "file" | "directory";
  readonly name: string;
  queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<FileSystemPermissionState>;
  requestPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<FileSystemPermissionState>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: "directory";
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file";
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BlobPart): Promise<void>;
  close(): Promise<void>;
}

interface Window {
  showDirectoryPicker?: (options?: { mode?: FileSystemPermissionMode }) => Promise<FileSystemDirectoryHandle>;
}
