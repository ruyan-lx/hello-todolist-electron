<!-- 文件：/src/renderer/App.vue -->

<template>
  <div>
    <h1>Todo List</h1>

    <input v-model="input" @keyup.enter="addTodo" />
    <button @click="addTodo">添加</button>

    <ul>
      <li v-for="item in list" :key="item.id">
        {{ item.text }}
        <button @click="remove(item.id)">删除</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw, watch } from 'vue'

const input = ref('')
const list = ref<any[]>([])

const addTodo = () => {
  if (!input.value) return
  list.value.push({
    id: Date.now(),
    text: input.value
  })
  input.value = ''
}

const remove = (id: number) => {
  list.value = list.value.filter(i => i.id !== id)
}

// 组件挂载时从主进程获取已保存的待办事项列表
onMounted(async () => {
  list.value = await window.api.invoke('todo:get')
})

// 深度监听列表变化,当列表内容改变时自动同步到主进程
watch(list, async (val) => {
  // 使用 toRaw 将 Vue 响应式对象转换为普通对象,避免序列化错误
  await window.api.invoke('todo:set', toRaw(val))
}, { deep: true })
</script>