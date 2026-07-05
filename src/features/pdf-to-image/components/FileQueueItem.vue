<script setup lang="ts">
import { CheckCircle2, Clock3, FileText, Loader2, Trash2, XCircle } from "lucide-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatFileSize } from "../../../shared/utils/files";
import type { PdfQueueItem } from "../types";

const props = defineProps<{
  item: PdfQueueItem;
  disabled: boolean;
}>();

const emit = defineEmits<{
  remove: [id: string];
}>();

const { locale, t } = useI18n();

const statusLabel = computed(() => {
  const labels: Record<PdfQueueItem["status"], string> = {
    queued: t("pdf.queued"),
    scanning: t("pdf.scanning"),
    rendering: t("pdf.rendering"),
    done: t("pdf.completed"),
    error: t("pdf.failed")
  };
  return labels[props.item.status];
});

const statusIcon = computed(() => {
  if (props.item.status === "done") return CheckCircle2;
  if (props.item.status === "error") return XCircle;
  if (props.item.status === "rendering" || props.item.status === "scanning") return Loader2;
  return Clock3;
});

const pageProgress = computed(() => {
  if (props.item.pagesTotal <= 0) {
    return "";
  }
  return t("pdf.done", {
    done: props.item.pagesDone,
    total: props.item.pagesTotal
  });
});
</script>

<template>
  <article class="queue-item" :data-status="item.status">
    <div class="thumb" aria-hidden="true">
      <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" alt="" />
      <FileText v-else :size="22" />
    </div>

    <div class="queue-main">
      <div class="queue-title">
        <span>{{ item.name }}</span>
      </div>
      <div class="queue-meta">
        <span>{{ formatFileSize(item.size, locale) }}</span>
        <span v-if="pageProgress">{{ pageProgress }}</span>
        <span v-if="item.errorKey" class="error-text">{{ t(`errors.${item.errorKey}`) }}</span>
      </div>
    </div>

    <div class="status-pill">
      <component
        :is="statusIcon"
        :size="15"
        :class="{ spin: item.status === 'rendering' || item.status === 'scanning' }"
      />
      <span>{{ statusLabel }}</span>
    </div>

    <button
      class="icon-button subtle danger"
      type="button"
      :aria-label="t('actions.remove')"
      :title="t('actions.remove')"
      :disabled="disabled"
      @click="emit('remove', item.id)"
    >
      <Trash2 :size="18" />
    </button>
  </article>
</template>
