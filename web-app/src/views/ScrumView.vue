<template>
  <div class="scrum-view">
    <div class="header">
      <h1 class="title">Scrum доска</h1>
      <p class="subtitle">Управляйте своими спринтами и задачами с помощью Scrum</p>
      <div v-if="isScrumMaster" class="show-completed-toggle">
        <label>
          <input type="checkbox" v-model="showCompleted" class="toggle-input" />
          Показать завершенные спринты
        </label>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else class="content">
      <!-- Sprint Selection -->
      <div class="section">
        <h3 class="section-title">Активный спринт</h3>
        <SprintSelector 
          :boardId="boardId" 
          :sprints="filteredSprints"
          :activeSprint="activeSprint"
          @sprint-change="handleSprintChange"
          @sprint-create="handleSprintCreate"
          @sprint-delete="handleSprintDelete"
          @sprint-start="handleSprintStart"
          @sprint-complete="handleSprintComplete"
          @backlog-tasks-add="handleBacklogTasksAdd"
          @sprint-team-update="handleSprintTeamUpdate"
        />
      </div>
      
      <!-- Sprint Info -->
      <div v-if="activeSprint" class="section">
        <div class="sprint-info-card">
          <div class="sprint-header">
            <h4>{{ activeSprint.name }}</h4>
            <div class="sprint-actions">
              <button 
                v-if="activeSprint.status === 'planning'" 
                @click="startSprint(activeSprint.id)"
                class="action-btn primary"
              >
                Начать спринт
              </button>
              <button 
                v-if="activeSprint.status === 'active'" 
                @click="completeSprint(activeSprint.id)"
                class="action-btn success"
              >
                Завершить спринт
              </button>
              <span :class="['status-badge', activeSprint.status]">
                {{ activeSprint.status }}
              </span>
            </div>
          </div>
          <p class="sprint-goal">{{ activeSprint.goal }}</p>
          <div class="sprint-dates">
            {{ formatDate(activeSprint?.startDate) }} - {{ formatDate(activeSprint?.endDate) }}
          </div>
          <div class="sprint-stats">
            <div class="stat">
              <span class="stat-value">{{ activeSprint.velocity }}</span>
              <span class="stat-label">Скорость</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ activeSprint.completedPoints }}</span>
              <span class="stat-label">Полученные очки</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Task Board -->
      <div class="section">
        <h3 class="section-title">Доска спринтов</h3>
        <ScrumBoard 
          :sprintId="currentSprintId" 
          :boardId="boardId"
          @task-click="handleTaskClick"
          @task-move="handleTaskMove"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useAuthStore } from '../stores/auth'
import ScrumBoard from '../components/scrum/ScrumBoard.vue'
import SprintSelector from '../components/scrum/SprintSelector.vue'
import { type Task, type CreateSprintRequest, TaskStatus } from '../../types/src'

const route = useRoute()
const taskStore = useTaskStore()
const authStore = useAuthStore()

const loading = ref(false)
const isLoading = ref(false)
const currentSprintId = ref<string | undefined>(undefined)

const boardId = computed(() => route.params.boardId as string)
const sprints = computed(() => taskStore.sprints)
const activeSprint = computed(() => taskStore.activeSprint)
//const sprintStats = computed(() => taskStore.sprintStats)

const showCompleted = ref(false)

const currentUserId = computed(() => authStore.user?.id || '')

const isScrumMaster = computed(() => {
  return activeSprint.value?.scrumMasterId === currentUserId.value // Используем из store
})

async function loadSprints() {
  await taskStore.fetchSprints(boardId.value)
}
async function loadBoardTasks() {
  await taskStore.fetchBoardTasks(boardId.value, currentSprintId.value)
}

onMounted(async () => {
  if (boardId.value) {
    await loadScrumData()
  }
})

async function loadScrumData() {
  loading.value = true
  try {
    await Promise.all([
      taskStore.fetchSprints(boardId.value),
      taskStore.fetchActiveSprint(boardId.value),
      taskStore.fetchBoardTasks(boardId.value)
    ])
    
    if (activeSprint.value) {
      currentSprintId.value = activeSprint.value.id
      await taskStore.fetchSprintStats(activeSprint.value.id)
    }
  } catch (error) {
    console.error('Failed to load scrum data:', error)
  } finally {
    loading.value = false
  }
}

function handleSprintChange(sprintId: string) {
  currentSprintId.value = sprintId
  if (sprintId) {
    taskStore.fetchBoardTasks(boardId.value, sprintId)
    taskStore.fetchSprintStats(sprintId)
  } else {
    taskStore.fetchBoardTasks(boardId.value)
  }
}

async function handleSprintCreate(sprintData: CreateSprintRequest) {
  const validationError = validateSprintDates(sprintData)
  if (validationError) {
    alert(validationError)
    return
  }

  try {
    await taskStore.createSprint(sprintData)
    await loadScrumData()
  } catch (error) {
    console.error('Failed to create sprint:', error)
  }
}

async function handleSprintDelete(sprintId: string) {
  if (confirm('Вы уверены, что хотите удалить этот спринт?')) {
    try {
      await taskStore.deleteSprint(sprintId)
      await loadScrumData()
    } catch (error) {
      console.error('Failed to delete sprint:', error)
    }
  }
}

async function startSprint(sprintId: string) {
  try {
    await taskStore.updateSprintStatus(sprintId, 'active')
    await loadScrumData()
  } catch (error) {
    console.error('Failed to start sprint:', error)
  }
}

async function completeSprint(sprintId: string) {
  try {
    await taskStore.updateSprintStatus(sprintId, 'completed')
    await loadScrumData()
  } catch (error) {
    console.error('Failed to complete sprint:', error)
  }
}

// Добавляем обработчик обновления команды
async function handleSprintTeamUpdate(sprintId: string, teamData: { scrumMasterId: string; teamMembers: string[] }) {
  try {
    await taskStore.updateSprintTeam(sprintId, teamData)
    await loadScrumData()
  } catch (error) {
    console.error('Failed to update sprint team:', error)
  }
}

function handleTaskClick(task: Task) {
  console.log('Task clicked:', task)
  // Добавить открытие модального окна редактирования задачи
}

function handleTaskMove(taskId: string, newStatus: string) {
  // Безопасное приведение типа
  const statusMap: Record<string, TaskStatus> = {
    'todo': TaskStatus.TODO,
    'in_progress': TaskStatus.IN_PROGRESS,
    'review': TaskStatus.REVIEW,
    'done': TaskStatus.DONE
  }
  
  const taskStatus = statusMap[newStatus]
  if (taskStatus) {
    taskStore.updateTask(taskId, { status: taskStatus })
  }
}

function formatDate(date?: Date) {
  if (!date) return 'Дата неизвестна';
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Неверная дата';
    }
    return parsedDate.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Ошибка даты';
  }
}

async function handleSprintStart(sprintId: string) {
  try {
    const sprintTasks = taskStore.tasks.filter(task => task.sprintId === sprintId) 
    // Обновляем статус всех задач спринта на "todo"
    for (const task of sprintTasks) {
      if (task.status === TaskStatus.BACKLOG) {
        await taskStore.updateTask(task.id, { 
          status: TaskStatus.TODO
        })
      }
    }
    
    // Запускаем спринт
    await taskStore.updateSprintStatus(sprintId, 'active')
    await loadScrumData()
  } catch (error) {
    console.error('Failed to start sprint:', error)
  }
}

async function handleSprintComplete(sprintId: string) {
  if (confirm('Complete this sprint? All completed tasks will be archived and unfinished tasks will return to Product Backlog.')) {
    isLoading.value = true
    try {
      await taskStore.completeSprint(sprintId, boardId.value)
      await loadSprints()
      await loadBoardTasks()
      alert('Sprint completed! Assigned tasks updated.')
    } catch (error) {
      alert('Failed to complete sprint: ' + error)
    } finally {
      isLoading.value = false
    }
  }
}

async function handleBacklogTasksAdd(sprintId: string, taskIds: string[]) {
  try {
    await taskStore.addTasksToSprint(sprintId, taskIds)
    await taskStore.fetchBoardTasks(boardId.value, currentSprintId.value)
  } catch (error) {
    console.error('Failed to add backlog tasks to sprint:', error)
  }
}

// Фильтрация спринтов для scrum master
const filteredSprints = computed(() => {
  if (isScrumMaster.value && showCompleted.value) { 
    return sprints.value
  }
  return sprints.value.filter(sprint => 
    sprint.status === 'planning' || sprint.status === 'active'
  )
});

function validateSprintDates(sprintData: CreateSprintRequest): string | null {
  if (!sprintData.startDate || !sprintData.endDate) {
    return 'Заполните обе даты спринта'
  }

  try {
    const start = new Date(sprintData.startDate);
    const end = new Date(sprintData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Неверный формат даты';
    }

    if (start < today) {
      return 'Дата начала не может быть в прошлом';
    }

    if (end <= start) {
      return 'Дата окончания должна быть после даты начала';
    }

    // Максимальная длительность спринта (например, 4 недели)
    const maxDuration = 28 * 24 * 60 * 60 * 1000; // 4 недели в миллисекундах
    if (end.getTime() - start.getTime() > maxDuration) {
      return 'Спринт не может длиться более 4 недель';
    }

    // Минимальная длительность спринта (например, 1 день)
    const minDuration = 24 * 60 * 60 * 1000; // 1 день в миллисекундах
    if (end.getTime() - start.getTime() < minDuration) {
      return 'Спринт должен длиться хотя бы 1 день';
    }

    return null;
  } catch (error) {
    return 'Ошибка при проверке дат: ' + error;
  }
}
</script>

<style scoped>
.scrum-view {
  padding: 1.5rem;
  min-height: 100vh;
  background: #f8fafc;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
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


.form-group input:invalid {
  border-color: #dc2626;
  box-shadow: 0 0 0 1px #dc2626;
}

.form-group input:valid {
  border-color: #10b981;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message::before {
  content: "⚠";
  font-size: 0.75rem;
}



.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.sprint-info-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.sprint-header h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.sprint-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.success {
  background: #10b981;
  color: white;
}

.action-btn.success:hover {
  background: #059669;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.planning {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.completed {
  background: #e5e7eb;
  color: #374151;
}

.sprint-goal {
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-style: italic;
}

.sprint-dates {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.sprint-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .scrum-view {
    padding: 1rem;
  }
  
  .sprint-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .sprint-actions {
    align-self: flex-start;
  }
}
</style>