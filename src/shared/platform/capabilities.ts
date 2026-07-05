export interface PlatformCapabilities {
  canPickDirectory: boolean;
  canShareFiles: boolean;
  canUseServiceWorker: boolean;
  isStandalone: boolean;
  deviceMemoryGb: number | null;
}

export const getPlatformCapabilities = (): PlatformCapabilities => {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    deviceMemory?: number;
    standalone?: boolean;
  };

  return {
    canPickDirectory: typeof window.showDirectoryPicker === "function",
    canShareFiles: typeof nav.canShare === "function",
    canUseServiceWorker: "serviceWorker" in navigator,
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(nav.standalone),
    deviceMemoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null
  };
};

export const getSafeCanvasPixelBudget = () => {
  const memory = getPlatformCapabilities().deviceMemoryGb;
  if (memory !== null && memory <= 2) {
    return 12_000_000;
  }
  if (memory !== null && memory <= 4) {
    return 24_000_000;
  }
  return 36_000_000;
};
