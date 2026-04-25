<!-- 文件：/src/renderer/App.vue -->

<template>
  <div class="todo-container">
    <div class="todo-header">
      <h1>待办事项</h1>
    </div>

    <div class="todo-input-group">
      <input
        ref="inputRef"
        v-model="input"
        @keyup.enter="addTodo"
        class="todo-input"
        placeholder="输入待办事项..."
      />
      <button @click="addTodo" class="btn btn-primary">添加</button>
    </div>

    <ul v-if="list.length > 0" class="todo-list">
      <li v-for="item in list" :key="item.id" class="todo-item">
        <span class="todo-item-text">{{ item.text }}</span>
        <button @click="remove(item.id)" class="btn btn-danger">删除</button>
      </li>
    </ul>

    <div v-else class="todo-empty">
      <div class="todo-empty-icon">📝</div>
      <div class="todo-empty-text">暂无待办事项</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import "@/assets/styles/app.css";

const input = ref("");
const list = ref<any[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);

const addTodo = () => {
  if (!input.value) return;
  list.value.push({
    id: Date.now(),
    text: input.value,
  });
  input.value = "";

  window.api.invoke("notify", {
    title: "Todo 提示",
    body: "添加成功",
  });
};

const remove = (id: number) => {
  list.value = list.value.filter((i) => i.id !== id);

  window.api.invoke("notify", {
    title: "Todo 提示",
    body: "删除成功",
  });
};

// 组件挂载时从主进程获取已保存的待办事项列表
onMounted(async () => {
  list.value = await window.api.invoke("todo:get");

  // 监听主进程的聚焦输入框事件
  window.api.onFocusInput(() => {
    inputRef.value?.focus();
  });
});

// 深度监听列表变化,当列表内容改变时自动同步到主进程
watch(
  list,
  async (val) => {
    // 使用 toRaw 将 Vue 响应式对象转换为普通对象,避免序列化错误
    await window.api.invoke("todo:set", JSON.parse(JSON.stringify(val)));

    // window.api.invoke("dialog:info", "添加成功");
  },
  { deep: true, immediate: false },
);
</script>
