<script setup lang="ts">
import { KeyRound } from "lucide-vue-next";
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  open: boolean;
  fileName: string;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [password: string];
}>();

const { t } = useI18n();
const password = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      password.value = "";
      await nextTick();
      inputRef.value?.focus();
    }
  }
);
</script>

<template>
  <div v-if="open" class="modal-backdrop" role="presentation">
    <section class="modal" role="dialog" aria-modal="true" :aria-label="t('pdf.passwordTitle')">
      <div class="modal-icon">
        <KeyRound :size="22" />
      </div>
      <h2>{{ t("pdf.passwordTitle") }}</h2>
      <p>{{ t("pdf.passwordHint", { fileName }) }}</p>
      <form
        class="password-form"
        @submit.prevent="emit('confirm', password)"
      >
        <input
          ref="inputRef"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :placeholder="t('pdf.passwordPlaceholder')"
        />
        <div class="modal-actions">
          <button class="button secondary" type="button" @click="emit('cancel')">
            {{ t("actions.cancel") }}
          </button>
          <button class="button primary" type="submit">
            {{ t("actions.unlock") }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
