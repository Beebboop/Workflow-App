<template>
  <div class="dashboard">
    <div class="dashboard-content">
      <div class="header">
        <h1 class="title">Панель управления</h1>
        <p class="subtitle">С возвращением, {{ authStore.user?.name }}</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3 class="stat-title">Количество досок</h3>
          <p class="stat-value">{{ boards.length }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Активные задачи</h3>
          <p class="stat-value">{{ totalActiveTasksCount }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Непрочитанные уведомления</h3>
          <p class="stat-value">{{ notificationStore.unreadCount }}</p>
        </div>
      </div>

      <!-- Boards Section -->
      <div class="boards-section">
        <div class="section-header">
          <h2 class="section-title">Ваши доски</h2>
          <button
            @click="showCreateModal = true"
            class="create-btn"
          >
            Создать доску
          </button>
        </div>

        <div class="boards-content">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
          </div>

          <div v-else-if="boards.length === 0" class="empty">
            <p>Досок пока нет. Пожалуйста, создайте свою первую доску</p>
          </div>

          <div v-else class="boards-grid">
            <div
              v-for="board in boards"
              :key="board.id"
              @click="openBoard(board)"
              class="board-card"
            >
              <div class="board-header">
                <h3 class="board-name">{{ board.name }}</h3>
                <span :class="['board-type', board.type]">
                  {{ board.type }}
                </span>
              </div>
              <p class="board-description">{{ board.description }}</p>
              <div class="board-footer">
                <span>{{ board.columns.length }} столбцы</span>
                <span>{{ formatDate(board.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Board Modal -->
      <BoardModal
        v-if="showCreateModal"
        :show="showCreateModal"
        @close="showCreateModal = false"
        @save="handleCreateBoard"
      />
    </div>
    <section v-if="assignedTasks.length > 0" class="assigned-section">
      <h3>Ваши назначенные задачи из спринтов</h3>
      <TaskList :tasks="assignedTasks" /> 
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/task'
import { useNotificationStore } from '../stores/notification'
import BoardModal from '../components/BoardModal.vue'
import type { Board, CreateBoardRequest } from '../../types/src'

const router = useRouter()
const authStore = useAuthStore()
const taskStore = useTaskStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const showCreateModal = ref(false)

// Реактивный computed для отображения в шаблоне
const totalActiveTasksCount = computed(() => activeTasksCount.value)

const boards = computed(() => taskStore.boards)

const activeTasksCount = ref(0)
onMounted(async () => {
  console.log('Dashboard mounted')
  await loadData()
  activeTasksCount.value = await taskStore.fetchBoardsTasksCounter()
  console.log('activeTasksCount: '+activeTasksCount.value)
})

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      taskStore.fetchBoards(),
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function openBoard(board: Board) {
  console.log('Opening board:', board.id)
  const route = board.type === 'kanban' ? 'Kanban' : 'Scrum'
  router.push({ name: route, params: { boardId: board.id } })
}

async function handleCreateBoard(boardData: CreateBoardRequest) {
  try {
    await taskStore.createBoard(boardData)
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create board:', error)
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString()
}

const assignedTasks = computed(() => taskStore.assignedTasks);
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-content {
  padding: 1.5rem;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.stat-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
  margin: 0;
}

.boards-section {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.create-btn {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background: #1d4ed8;
}

.boards-content {
  padding: 1.5rem;
  overflow: visible;
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
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.board-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.board-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.board-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.board-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-weight: 500;
}

.board-type.kanban {
  background: #dbeafe;
  color: #1e40af;
}

.board-type.scrum {
  background: #d1fae5;
  color: #065f46;
}

.board-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.board-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Для мобильных устройств */
@media (max-width: 768px) {
  .boards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .board-card {
    margin: 0;
  }
}

/* Для планшетов */
@media (min-width: 769px) and (max-width: 1024px) {
  .boards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>