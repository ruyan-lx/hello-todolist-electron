<template>
  <section class="store-demo">
    <h2>Electron Store 示例</h2>
    <p>默认值在主进程设置了，这里读取主进程设置的值，也可以当前渲染进程通过ipc让主进程修改。</p>
    <div class="store-demo-row">
      <input v-model="token" class="todo-input" placeholder="输入 token" />
      <button class="btn btn-primary" @click="saveToken">保存</button>
      <button class="btn btn-secondary" @click="loadToken">读取</button>
      <button class="btn btn-danger" @click="deleteToken">删除</button>
    </div>
    <p class="store-demo-value">当前 token：{{ savedToken || "未设置" }}</p>
    <p v-if="message" class="store-demo-message">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const token = ref("");
const savedToken = ref("");
const message = ref("");

const getApi = () => {
  if (window.api) return window.api;
  message.value = "请在 Electron 窗口中使用";
  return null;
};

const loadToken = async () => {
  const api = getApi();
  if (!api) return;

  const value = await api.invoke("store:get", "token");
  savedToken.value = typeof value === "string" ? value : "";
  token.value = savedToken.value;
  message.value = savedToken.value ? "读取成功" : "当前没有 token";
};

const saveToken = async () => {
  const api = getApi();
  if (!api) return;

  await api.invoke("store:set", {
    key: "token",
    value: token.value,
  });
  savedToken.value = token.value;
  message.value = "保存成功";
};

const deleteToken = async () => {
  const api = getApi();
  if (!api) return;

  await api.invoke("store:delete", "token");
  token.value = "";
  savedToken.value = "";
  message.value = "已删除";
};

onMounted(loadToken);
</script>

<style scoped>
.store-demo {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.store-demo h2 {
  margin-bottom: 12px;
  font-size: 18px;
}

.store-demo-row {
  display: flex;
  gap: 8px;
}

.store-demo-row .todo-input {
  min-width: 0;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: var(--text-primary);
}

.btn-secondary:hover {
  background-color: #e6e6e6;
}

.store-demo-value,
.store-demo-message {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  word-break: break-all;
}
</style>
