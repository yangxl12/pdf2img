import { createI18n } from "vue-i18n";
import { messages, type SupportedLocale } from "./messages";

export type { SupportedLocale } from "./messages";

const LOCALE_KEY = "invoiceforge.locale";
const DEFAULT_LOCALE: SupportedLocale = "zh-CN";

export const getInitialLocale = (): SupportedLocale => {
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved === "zh-CN" || saved === "en-US") {
    return saved;
  }
  return DEFAULT_LOCALE;
};

export const persistLocale = (locale: SupportedLocale) => {
  localStorage.setItem(LOCALE_KEY, locale);
  document.documentElement.lang = locale;
};

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages
});

document.documentElement.lang = getInitialLocale();
