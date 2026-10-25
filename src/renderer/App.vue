<!-- 文件：/src/renderer/App.vue -->
<!-- 布局壳：只负责组装页面视图，业务逻辑全部在 views/ 与 composables/ 中 -->

<template>
  <div class="app-shell">
    <TodoView />
    <WindowPoolDemo />
    <StoreDemo />
    <FeedbackDemo />
    <SdkMessageDemo />
  </div>
</template>

<script setup lang="ts">
import TodoView from "./views/TodoView.vue";
import WindowPoolDemo from "./views/WindowPoolDemo.vue";
import StoreDemo from "./views/StoreDemo.vue";
import FeedbackDemo from "./views/FeedbackDemo.vue";
import SdkMessageDemo from "./views/SdkMessageDemo.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
