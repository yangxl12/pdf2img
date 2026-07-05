<script setup lang="ts">
import {
  Archive,
  Check,
  ChevronDown,
  Download,
  FolderOpen,
  Image,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud
} from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getPlatformCapabilities } from "../../../shared/platform/capabilities";
import { downloadPagesAsZip, savePagesToFolder } from "../services/exporter";
import { usePdfConversionStore } from "../stores/pdfConversionStore";
import type { PasswordRequest } from "../types";
import FileQueueItem from "./FileQueueItem.vue";
import PasswordDialog from "./PasswordDialog.vue";

type NoticeType = "success" | "error" | "info";

interface Notice {
  id: string;
  type: NoticeType;
  text: string;
}

const { t } = useI18n();
const store = usePdfConversionStore();
const fileInput = ref<HTMLInputElement | null>(null);
const dragActive = ref(false);
const notices = ref<Notice[]>([]);
const capabilities = getPlatformCapabilities();

const passwordDialog = reactive<{
  open: boolean;
  fileName: string;
  resolve: ((value: string | null) => void) | null;
}>({
  open: false,
  fileName: "",
  resolve: null
});

const hasFiles = computed(() => store.items.length > 0);
const canConvert = computed(() => hasFiles.value && !store.isConverting);
const outputs = computed(() => store.allOutputs);
const progressPercent = computed(() => {
  if (store.totalCount === 0) {
    return 0;
  }
  return Math.round((store.processedCount / store.totalCount) * 100);
});

const pushNotice = (type: NoticeType, text: string) => {
  const notice = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    text
  };
  notices.value.push(notice);
  window.setTimeout(() => {
    notices.value = notices.value.filter((entry) => entry.id !== notice.id);
  }, 3200);
};

const pickFiles = () => fileInput.value?.click();

const handleFiles = (files: FileList | File[]) => {
  const result = store.addFiles(files);

  if (result.added > 0) {
    pushNotice("success", t("notices.added", { count: result.added }));
  }
  if (result.duplicated > 0) {
    pushNotice("info", t("notices.duplicated"));
  }
  if (result.rejected > 0) {
    pushNotice("error", t("notices.notPdf"));
  }
};

const onInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    handleFiles(input.files);
    input.value = "";
  }
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  dragActive.value = false;
  if (event.dataTransfer?.files.length) {
    handleFiles(event.dataTransfer.files);
  }
};

const requestPassword = (request: PasswordRequest) =>
  new Promise<string | null>((resolve) => {
    passwordDialog.fileName = request.fileName;
    passwordDialog.open = true;
    passwordDialog.resolve = resolve;
  });

const closePasswordDialog = (value: string | null) => {
  passwordDialog.open = false;
  passwordDialog.resolve?.(value);
  passwordDialog.resolve = null;
};

const chooseFolder = async () => {
  if (!window.showDirectoryPicker) {
    pushNotice("info", t("pdf.folderUnsupported"));
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    store.setDirectoryHandle(handle);
    pushNotice("success", t("notices.folderSelected", { name: handle.name }));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    pushNotice("error", t("pdf.folderPermissionDenied"));
  }
};

const exportOutputs = async () => {
  if (outputs.value.length === 0) {
    pushNotice("error", t("notices.noOutput"));
    return;
  }

  if (store.directoryHandle) {
    try {
      const saved = await savePagesToFolder(outputs.value, store.directoryHandle);
      pushNotice("success", t("notices.savedFolder", { count: saved }));
      return;
    } catch {
      pushNotice("error", t("errors.saveFailed"));
    }
  }

  try {
    await downloadPagesAsZip(outputs.value);
    pushNotice("success", t("notices.zipStarted"));
  } catch {
    pushNotice("error", t("errors.zipFailed"));
  }
};

const convert = async () => {
  const pages = await store.convertAll(requestPassword);
  if (pages.length === 0) {
    pushNotice("error", t("notices.noOutput"));
    return;
  }

  pushNotice("success", t("notices.converted", { count: pages.length }));
  await exportOutputs();
};
</script>

<template>
  <main class="tool-screen">
    <section class="tool-toolbar" aria-labelledby="pdf-tool-title">
      <div>
        <h1 id="pdf-tool-title">{{ t("pdf.title") }}</h1>
        <p>{{ t("pdf.fileCount", { count: store.items.length }) }}</p>
      </div>
      <button class="button primary compact" type="button" @click="pickFiles">
        <Plus :size="18" />
        <span>{{ hasFiles ? t("actions.addMore") : t("actions.addFiles") }}</span>
      </button>
    </section>

    <section class="control-strip" aria-label="PDF conversion settings">
      <div class="segmented">
        <button
          v-for="dpi in [144, 216, 300]"
          :key="dpi"
          type="button"
          :class="{ active: store.settings.dpi === dpi }"
          @click="store.setDpi(dpi as 144 | 216 | 300)"
        >
          <Sparkles :size="14" />
          <span>{{ t("pdf.dpiCompact", { dpi }) }}</span>
        </button>
      </div>

      <label class="toggle-row">
        <input
          :checked="store.settings.includeAllPages"
          type="checkbox"
          @change="store.setIncludeAllPages(($event.target as HTMLInputElement).checked)"
        />
        <Layers :size="16" />
        <span>{{ store.settings.includeAllPages ? t("pdf.allPages") : t("pdf.firstPageOnly") }}</span>
      </label>

      <button
        class="button secondary compact"
        type="button"
        :disabled="!capabilities.canPickDirectory"
        @click="chooseFolder"
      >
        <FolderOpen :size="18" />
        <span>{{ store.directoryHandle ? t("actions.folderReady") : t("actions.chooseFolder") }}</span>
      </button>
    </section>

    <button
      class="drop-zone"
      :class="{ active: dragActive, filled: hasFiles }"
      type="button"
      @click="pickFiles"
      @dragover.prevent="dragActive = true"
      @dragleave="dragActive = false"
      @drop="onDrop"
    >
      <UploadCloud :size="34" />
      <span>{{ t("pdf.dropTitle") }}</span>
      <small>{{ capabilities.canPickDirectory ? t("pdf.saveTarget") : t("pdf.zipFallback") }}</small>
    </button>

    <input
      ref="fileInput"
      class="sr-only"
      type="file"
      accept=".pdf,application/pdf"
      multiple
      @change="onInputChange"
    />

    <section class="queue-section" aria-labelledby="queue-title">
      <div class="section-heading">
        <h2 id="queue-title">{{ t("pdf.queue") }}</h2>
        <button
          class="text-button danger"
          type="button"
          :disabled="!hasFiles || store.isConverting"
          @click="store.clearItems"
        >
          <Trash2 :size="16" />
          <span>{{ t("actions.clear") }}</span>
        </button>
      </div>

      <div v-if="!hasFiles" class="empty-state">
        <Image :size="40" />
        <span>{{ t("pdf.empty") }}</span>
      </div>

      <div v-else class="queue-list">
        <FileQueueItem
          v-for="item in store.items"
          :key="item.id"
          :item="item"
          :disabled="store.isConverting"
          @remove="store.removeItem"
        />
      </div>
    </section>

    <footer class="action-dock">
      <div class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progressPercent}%` }"></span>
      </div>
      <button class="button primary action-main" type="button" :disabled="!canConvert" @click="convert">
        <Archive v-if="store.isConverting" :size="20" class="spin" />
        <Download v-else :size="20" />
        <span>{{ store.isConverting ? t("actions.converting") : t("actions.convert") }}</span>
        <ChevronDown v-if="outputs.length" :size="18" />
      </button>
    </footer>

    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div v-for="notice in notices" :key="notice.id" class="toast" :data-type="notice.type">
        <Check v-if="notice.type === 'success'" :size="17" />
        <span>{{ notice.text }}</span>
      </div>
    </div>

    <PasswordDialog
      :open="passwordDialog.open"
      :file-name="passwordDialog.fileName"
      @cancel="closePasswordDialog(null)"
      @confirm="closePasswordDialog"
    />
  </main>
</template>
