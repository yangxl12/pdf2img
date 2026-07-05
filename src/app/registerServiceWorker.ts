import { registerSW } from "virtual:pwa-register";

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  registerSW({
    immediate: true
  });
};
