<template>
  <section class="sdk-message-demo">
    <h2>SDK Message 示例</h2>
    <button class="btn btn-primary" @click="showMessage">打开提示</button>
  </section>
</template>

<script setup lang="ts">
import { message } from "@/renderer/sdk/message";

const showMessage = () => {
  message.alert({
    title: "SDK 提示",
    message: "同一套业务代码会在 Electron 和浏览器环境选择不同提示实现。",
  });
};
</script>

<style scoped>
.sdk-message-demo {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.sdk-message-demo h2 {
  margin-bottom: 12px;
  font-size: 18px;
}
</style>
