<script setup lang="ts">
import { Languages, Moon, Sun, WandSparkles } from "lucide-vue-next";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import PdfToImageTool from "../features/pdf-to-image/components/PdfToImageTool.vue";
import { tools } from "../features/tool-registry/tools";
import { registerServiceWorker } from "./registerServiceWorker";
import { persistLocale, type SupportedLocale } from "../shared/i18n";
import { usePreferencesStore, type ThemeMode } from "../shared/stores/preferencesStore";

const { locale, t } = useI18n();
const preferences = usePreferencesStore();
const activeTool = tools[0];

const resolvedThemeIcon = computed(() => {
  if (preferences.theme === "dark") return Moon;
  if (preferences.theme === "light") return Sun;
  return WandSparkles;
});

const setLocale = (value: string) => {
  const next = value === "en-US" ? "en-US" : "zh-CN";
  locale.value = next;
  persistLocale(next as SupportedLocale);
};

const setTheme = (value: string) => {
  const next = ["light", "dark", "system"].includes(value) ? value : "system";
  preferences.setTheme(next as ThemeMode);
};

onMounted(() => {
  preferences.hydrate();
  registerServiceWorker();
});
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true">
          <component :is="activeTool.icon" :size="22" />
        </div>
        <div>
          <p>{{ t("app.name") }}</p>
          <span>{{ t("app.subtitle") }}</span>
        </div>
      </div>

      <div class="app-controls">
        <label class="select-control" :title="t('app.language')">
          <Languages :size="17" />
          <select :value="locale" :aria-label="t('app.language')" @change="setLocale(($event.target as HTMLSelectElement).value)">
            <option value="zh-CN">中文</option>
            <option value="en-US">EN</option>
          </select>
        </label>

        <label class="select-control" :title="t('app.theme')">
          <component :is="resolvedThemeIcon" :size="17" />
          <select :value="preferences.theme" :aria-label="t('app.theme')" @change="setTheme(($event.target as HTMLSelectElement).value)">
            <option value="system">{{ t("app.system") }}</option>
            <option value="light">{{ t("app.light") }}</option>
            <option value="dark">{{ t("app.dark") }}</option>
          </select>
        </label>
      </div>
    </header>

    <PdfToImageTool />
  </div>
</template>
