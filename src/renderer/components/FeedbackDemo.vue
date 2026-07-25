<template>
  <section class="feedback-demo">
    <h2>日志上报示例</h2>
    <textarea
      v-model="desc"
      class="feedback-demo-input"
      placeholder="请输入问题描述..."
      rows="3"
    />
    <div class="feedback-demo-actions">
      <button class="btn btn-primary" :disabled="submitting || !desc.trim()" @click="submit">
        {{ submitting ? "提交中..." : "提交反馈" }}
      </button>
      <span v-if="message" class="feedback-demo-message">{{ message }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const desc = ref("");
const message = ref("");
const submitting = ref(false);

const submit = async () => {
  const value = desc.value.trim();
  if (!value) return;

  submitting.value = true;
  message.value = "";

  try {
    await window.api.submitFeedback(value);
    desc.value = "";
    message.value = "反馈已提交";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "提交失败";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.feedback-demo {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.feedback-demo h2 {
  margin-bottom: 12px;
  font-size: 18px;
}

.feedback-demo-input {
  width: 100%;
  padding: 8px 12px;
  font: inherit;
  color: var(--text-primary);
  resize: vertical;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  outline: none;
}

.feedback-demo-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.1);
}

.feedback-demo-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.feedback-demo-message {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
