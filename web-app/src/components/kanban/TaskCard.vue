<template>
  <div class="task-card" @click="$emit('click', task)">
    <div class="task-header">
      <h4 class="task-title">{{ task.title }}</h4>
      <span :class="['priority-badge', task.priority]">
        {{ task.priority }}
      </span>
    </div>
    
    <p class="task-description">{{ task.description }}</p>
    
    <div class="task-footer">
      <span v-if="task.dueDate" class="task-date">{{ formatDate(task.dueDate) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../../../types/src'

defineProps<{
  task: Task
}>()

defineEmits<{
  click: [task: Task]
}>()

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.task-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.task-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
  flex: 1;
  margin-right: 0.5rem;
}

.priority-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 500;
  flex-shrink: 0;
}

.priority-badge.low {
  background: #dcfce7;
  color: #166534;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-badge.high {
  background: #fed7aa;
  color: #c2410c;
}

.priority-badge.urgent {
  background: #fecaca;
  color: #991b1b;
}

.task-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
  box-orient: vertical;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #9ca3af;
}

.task-date {
  font-size: 0.75rem;
}
</style>