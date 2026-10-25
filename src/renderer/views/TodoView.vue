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
import "@/assets/styles/app.css";
import { useTodo } from "@/renderer/composables/useTodo";

const { input, list, inputRef, addTodo, remove } = useTodo();
</script>
