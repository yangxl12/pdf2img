export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const formatFileSize = (bytes: number, locale: string) => {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  });

  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${formatter.format(bytes / 1024)} KB`;
  }
  return `${formatter.format(bytes / (1024 * 1024))} MB`;
};

export const safeFileBaseName = (name: string) =>
  name
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "document";

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
