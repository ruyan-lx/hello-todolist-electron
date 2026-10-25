// 文件：/src/renderer/composables/useTodo.ts
// 待办业务逻辑复用层：状态 + 持久化 + 系统通知，视图组件只负责渲染

import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { TodoItem } from "@/lib/todo/type";
import { todoApi, systemApi } from "@/renderer/api";

export function useTodo() {
  const input = ref("");
  const list = ref<TodoItem[]>([]);
  const inputRef = ref<HTMLInputElement | null>(null);
  let disposeFocus: (() => void) | null = null;

  const addTodo = async () => {
    if (!input.value) return;
    list.value.push({
      id: Date.now(),
      text: input.value,
    });
    input.value = "";

    await systemApi.notify({
      title: "Todo 提示",
      body: "添加成功",
    });
  };

  const remove = async (id: number) => {
    list.value = list.value.filter((i) => i.id !== id);

    await systemApi.notify({
      title: "Todo 提示",
      body: "删除成功",
    });
  };

  // 组件挂载时从主进程获取已保存的待办事项列表，并监听聚焦通知
  onMounted(async () => {
    list.value = await todoApi.getAll();

    disposeFocus = todoApi.onFocusInput(() => {
      inputRef.value?.focus();
    });
  });

  onBeforeUnmount(() => {
    disposeFocus?.();
    disposeFocus = null;
  });

  // 深度监听列表变化，当列表内容改变时自动同步到主进程
  watch(
    list,
    async (val) => {
      // 使用 toRaw 思路将 Vue 响应式对象转换为普通对象，避免序列化错误
      await todoApi.save(JSON.parse(JSON.stringify(val)));
    },
    { deep: true, immediate: false },
  );

  return { input, list, inputRef, addTodo, remove };
}
