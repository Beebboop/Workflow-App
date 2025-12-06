<template>
  <div class="scrum-boards-view">
    <div class="header">
      <h1 class="title">Scrum доски</h1>
      <p class="subtitle">Управляйте своими Scrum досками и спринтами</p>
    </div>

    <div class="content">
      <div class="section-header">
        <h2 class="section-title">Ваши Scrum доски</h2>
        <button
          @click="showCreateModal = true"
          class="create-btn"
        >
          + Создать Scrum доску
        </button>
      </div>

      <div class="boards-content">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="filteredBoards.length === 0" class="empty-state">
          <h3>Scrum досок пока нет</h3>
          <p>Создайте свою первую Scrum доску, чтобы начать управлять спринтами</p>
          <button
            @click="showCreateModal = true"
            class="empty-create-btn"
          >
            Создать Scrum доску
          </button>
        </div>

        <div v-else class="boards-grid">
          <div
            v-for="board in filteredBoards"
            :key="board.id"
            @click="openBoard(board)"
            class="board-card"
          >
            <div class="board-header">
              <h3 class="board-name">{{ board.name }}</h3>
              <span class="board-badge scrum">
                Scrum
              </span>
            </div>
            <p class="board-description">{{ board.description || 'No description' }}</p>
            
            <div class="sprint-info" v-if="getActiveSprint(board.id)">
              <div class="sprint-badge active">
                Активный спринт
              </div>
              <p class="sprint-name">{{ getActiveSprint(board.id)?.name }}</p>
            </div>
            <div class="sprint-info" v-else>
              <div class="sprint-badge planning">
                Планирование
              </div>
              <p class="sprint-name">Нет активного спринта</p>
            </div>

            <div class="board-stats">
              <div class="stat">
                <span class="stat-value">{{ getBoardTaskCount(board.id) }}</span>
                <span class="stat-label">Задачи</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ getBoardSprintsCount(board.id) }}</span>
                <span class="stat-label">Спринты</span>
              </div>
            </div>
            <div class="board-footer">
              <span class="created-date">Создано {{ formatDate(board.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Board Modal -->
    <BoardModal
      v-if="showCreateModal"
      :show="showCreateModal"
      :defaultType="'scrum'"
      @close="showCreateModal = false"
      @save="handleCreateBoard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import BoardModal from '../components/BoardModal.vue'
import type { Board, CreateBoardRequest, Sprint } from '../../types/src'

const router = useRouter()
const taskStore = useTaskStore()

const loading = ref(false)
const showCreateModal = ref(false)

const boards = computed(() => taskStore.boards)
const sprints = computed(() => taskStore.sprints)
const filteredBoards = computed(() => 
  boards.value.filter(board => board.type === 'scrum')
)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      taskStore.fetchBoards(),
    ])

    const scrumBoards = boards.value.filter(board => board.type === 'scrum');
    const sprintPromises = scrumBoards.map(board => 
      taskStore.fetchSprints(board.id).catch(() => {})  // Игнорируем 404/ошибки сети
    );
    await Promise.all(sprintPromises)
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function getBoardTaskCount(boardId: string): number {
  return taskStore.tasks.filter(task => task.boardId === boardId).length
}

function getBoardSprintsCount(boardId: string): number {
  return sprints.value.filter(sprint => sprint.boardId === boardId).length
}

function getActiveSprint(boardId: string): Sprint | undefined {
  return sprints.value.find(sprint => 
    sprint.boardId === boardId && sprint.status === 'active'
  )
}

function openBoard(board: Board) {
  console.log('Opening Scrum board:', board.id)
  router.push({ name: 'Scrum', params: { boardId: board.id } })
}

async function handleCreateBoard(boardData: CreateBoardRequest) {
  try {
    // Проверим тип установлен как scrum
    const scrumBoardData = {
      ...boardData,
      type: 'scrum' as const
    }
    await taskStore.createBoard(scrumBoardData);
    showCreateModal.value = false;
    await loadData();
  } catch (error) {
    console.error('Failed to create board:', error)
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.scrum-boards-view {
  min-height: 100vh;
  background: #f8fafc;
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
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

.content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
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
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background: #059669;
}

.boards-content {
  padding: 1.5rem;
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
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  margin: 0 0 2rem 0;
}

.empty-create-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.empty-create-btn:hover {
  background: #059669;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.board-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
  overflow: hidden;
}

.board-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #10b981, #059669);
}

.board-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
  border-color: #10b981;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.board-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

.board-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.board-badge.scrum {
  background: #d1fae5;
  color: #065f46;
}

.board-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
  box-orient: vertical;
}

.sprint-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.sprint-badge {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.sprint-badge.active {
  background: #dcfce7;
  color: #166534;
}

.sprint-badge.planning {
  background: #fef3c7;
  color: #92400e;
}

.sprint-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.board-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.board-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.created-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .scrum-boards-view {
    margin-left: 0;
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .boards-grid {
    grid-template-columns: 1fr;
  }
}
</style>