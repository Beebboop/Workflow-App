<!-- KanbanView.vue -->
<template>
  <div class="kanban-view" :class="{ 'mobile-view': isMobile }">
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="title">Kanban доска</h1>
          <p class="subtitle">Управляйте своими задачами с помощью методологии Kanban</p>
        </div>
        <button
          @click="openTaskModal()"
          class="add-task-btn"
          :class="{ 'mobile-add-btn': isMobile }"
        >
          {{ isMobile ? '+' : '+ Добавить задачу' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else class="board-container">
      <!-- Мобильная версия - вертикальные колонки -->
      <div v-if="isMobile" class="mobile-board">
        <select v-model="activeMobileColumn" class="column-selector">
          <option 
            v-for="column in columns" 
            :key="column.id"
            :value="column.status"
          >
            {{ column.name }} ({{ getTasksByStatus(column.status).length }})
          </option>
        </select>
        
        <div class="mobile-column">
          <TaskCard
            v-for="task in getTasksByStatus(activeMobileColumn)"
            :key="task.id"
            :task="task"
            @click="openTaskModal(task)"
            class="mobile-task-card"
          />
          <div v-if="getTasksByStatus(activeMobileColumn).length === 0" class="empty-column-mobile">
            <p>В этой колонке нет заданий</p>
          </div>
        </div>
      </div>
      
      <!-- Десктопная версия - горизонтальные колонки -->
      <div v-else class="desktop-board">
        <div
          v-for="column in columns"
          :key="column.id"
          class="column"
        >
          <div class="column-header">
            <h3 class="column-title">{{ column.name }}</h3>
            <span class="task-count">
              {{ getTasksByStatus(column.status).length }}
            </span>
          </div>
          
          <div class="tasks">
            <TaskCard
              v-for="task in getTasksByStatus(column.status)"
              :key="task.id"
              :task="task"
              @click="openTaskModal(task)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <TaskModal
      v-if="showTaskModal"
      :show="showTaskModal"
      :task="selectedTask"
      :currentUserId="currentUserId"
      @close="closeTaskModal"
      @save="handleSaveTask"
      @delete="handleDeleteTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useAuthStore } from '../stores/auth'
import { useDeviceDetection } from '../composables/useDeviceDetection'
import TaskCard from '../components/kanban/TaskCard.vue'
import TaskModal from '../components/kanban/TaskModal.vue'
import  {type Task, TaskPriority, TaskStatus,type CreateTaskRequest } from '../../types/src'

interface UpdateTaskRequest{
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: Date;
    estimate?: number;
    tags?: string[];
    boardId?: string;
}

const route = useRoute()
const taskStore = useTaskStore()
const authStore = useAuthStore()
const { isMobile } = useDeviceDetection()

const loading = ref(false)
const showTaskModal = ref(false)
const selectedTask = ref<Task | null>(null)
const activeMobileColumn = ref<TaskStatus>(TaskStatus.TODO)
const currentUserId = computed(() => authStore.user?.id || '')

const boardId = computed(() => route.params.boardId as string)
const tasks = computed(() => taskStore.tasks)

const columns = [
  { id: 'backlog', name: 'Доступный', status: TaskStatus.BACKLOG },
  { id: 'todo', name: 'К исполнению', status: TaskStatus.TODO },
  { id: 'in_progress', name: 'В процессе', status: TaskStatus.IN_PROGRESS },
  { id: 'review', name: 'Оценка', status: TaskStatus.REVIEW },
  { id: 'done', name: 'Завершено', status: TaskStatus.DONE }
]

onMounted(async () => {
  console.log('KanbanView mounted')
  await authStore.initializeAuth()
  if (boardId.value) {
    await loadBoardTasks()
  }
})

async function loadBoardTasks() {
  loading.value = true
  try {
    console.log('Loading tasks for board:', boardId.value)
    await taskStore.fetchBoardTasks(boardId.value)
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    loading.value = false
  }
}

function getTasksByStatus(status: TaskStatus) {
  return tasks.value.filter(task => task.status === status)
}

function openTaskModal(task?: Task) {
  console.log('Opening task modal for:', task)
  selectedTask.value = task || null
  showTaskModal.value = true
}

function closeTaskModal() {
  console.log('Closing task modal')
  showTaskModal.value = false
  selectedTask.value = null
}

async function handleSaveTask(taskData: CreateTaskRequest | UpdateTaskRequest) {
  console.log('handleSaveTask called with data:', taskData)
  console.log('Selected task:', selectedTask.value)
  console.log('Board ID:', boardId.value)
  if (!boardId.value) {
    console.error('Cannot save task: Board ID is empty')
    return
  }
  try {
    if (selectedTask.value) {
      await taskStore.updateTask(selectedTask.value.id, taskData as UpdateTaskRequest)
    } else {
      await taskStore.createTask(boardId.value, taskData as CreateTaskRequest)
    }
    closeTaskModal()
  } catch (error) {
    console.error('Ошибка при сохранении задачи:', error)
  }
}

const handleDeleteTask = async (taskId: string) => {
  try {
    await taskStore.deleteTask(taskId);
    await loadBoardTasks();
    showTaskModal.value = false;
    selectedTask.value = null;
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error);
    alert('Не удалось удалить задачу. Возможно, у вас нет прав.');
  }
};
</script>

<style scoped>
/* Mobile First стили */
.kanban-view {
  min-height: 100vh;
  background: #f8fafc;
  padding: 1rem;
}

.kanban-view.mobile-view {
  padding: 0.75rem;
  padding-bottom: 5rem; /* Space for mobile add button */
}

.header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-section {
  flex: 1;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.kanban-view.mobile-view .title {
  font-size: 1.25rem;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.kanban-view.mobile-view .subtitle {
  font-size: 0.75rem;
}

.add-task-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.add-task-btn.mobile-add-btn {
  position: fixed;
  bottom: 5rem;
  right: 1rem;
  z-index: 45;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  padding: 0;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  background: #3b82f6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
} 


.add-task-btn:hover:not(.mobile-add-btn) {
  background: #2563eb;
}

.add-task-btn.mobile-add-btn:active {
  transform: scale(0.95);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Mobile Board */
.mobile-board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.column-selector {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 1rem;
  width: 100%;
}

.mobile-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 50vh;
}

.mobile-task-card {
  margin: 0;
}

.empty-column-mobile {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
  background: white;
  border-radius: 0.5rem;
  border: 2px dashed #e5e7eb;
}

/* Desktop Board */
.desktop-board {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.column {
  background: #f1f5f9;
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 18rem;
  flex-shrink: 0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.column-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.task-count {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Планшет */
@media (min-width: 768px) {
  .kanban-view {
    padding: 1.5rem;
  }
  
  .header-content {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
  
  .add-task-btn {
    align-self: center;
  }
  
  .title {
    font-size: 1.75rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .kanban-view {
    padding: 2rem;
  }
  
  .desktop-board {
    gap: 1.5rem;
  }
  
  .column {
    min-width: 20rem;
    padding: 1.5rem;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 380px) {
  .add-task-btn.mobile-add-btn {
    bottom: 6rem;
    right: 0.75rem;
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }
}
</style>