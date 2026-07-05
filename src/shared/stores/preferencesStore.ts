import { defineStore } from "pinia";
import { readJson, writeJson } from "../storage/localSettings";

export type ThemeMode = "light" | "dark" | "system";

interface PreferenceState {
  theme: ThemeMode;
}

const STORAGE_KEY = "invoiceforge.preferences";

const prefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

const applyThemeToDocument = (theme: ThemeMode) => {
  const resolved = theme === "system" ? (prefersDark() ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;

  const color = resolved === "dark" ? "#151718" : "#f7f3ea";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
};

export const usePreferencesStore = defineStore("preferences", {
  state: (): PreferenceState =>
    readJson<PreferenceState>(STORAGE_KEY, {
      theme: "system"
    }),
  actions: {
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      this.persist();
      applyThemeToDocument(theme);
    },
    persist() {
      writeJson(STORAGE_KEY, {
        theme: this.theme
      });
    },
    hydrate() {
      applyThemeToDocument(this.theme);
      window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (this.theme === "system") {
          applyThemeToDocument(this.theme);
        }
      });
    }
  }
});
