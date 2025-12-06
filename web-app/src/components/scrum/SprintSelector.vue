<template>
  <div class="sprint-selector">
    <div class="selector-main">
      <label class="selector-label">Активный спринт:</label>
      <select v-model="selectedSprint" class="selector" @change="handleSprintChange">
        <option value="">Нет активного спринта</option>
        <option v-for="sprint in activeSprints" :key="sprint.id" :value="sprint.id">
          {{ sprint.name }} ({{ formatDate(sprint.startDate) }} - {{ formatDate(sprint.endDate) }})
        </option>
      </select>
      
      <button @click="showCreateModal = true" class="new-sprint-btn">
        + Спланировать новый спринт
      </button>
      
      <!-- Кнопка для добавления задач из бэклога -->
      <button 
        v-if="selectedSprint && selectedSprintStatus === 'planning' && isCurrentUserScrumMaster"
        @click="showBacklogModal = true"
        class="add-tasks-btn"
      >
        Добавить из списка невыполненных работ
      </button>
    </div>

    <!-- Sprint Actions -->
    <div v-if="selectedSprint" class="sprint-actions">
      <button 
        v-if="selectedSprintStatus === 'planning' && isCurrentUserScrumMaster"
        @click="startSprint(selectedSprint)"
        class="action-btn primary"
        :disabled="sprintTasks.length === 0"
      >
        Начать спринт
      </button>
      <button 
        v-if="selectedSprintStatus === 'active' && isCurrentUserScrumMaster"
        @click="completeSprint(selectedSprint)"
        class="action-btn success"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Завершение...' : 'Завершить спринт' }}
      </button>
      <button 
        v-if="isCurrentUserScrumMaster"
        @click="handleDeleteSprint(selectedSprint)"
        class="action-btn danger"
      >
        Удалить спринт
      </button>
      <span :class="['status-badge', selectedSprintStatus]">
        {{ selectedSprintStatus }}
      </span>
    </div>

    <!-- Sprint Team Management -->
    <div v-if="selectedSprint && selectedSprintStatus === 'planning' && isCurrentUserScrumMaster && selectedSprintObj" class="team-management">
      <h4>Команда спринта</h4>
      <div class="team-members">
        <div class="team-member">
          <span class="member-name">Scrum Master: {{ getScrumMasterName(selectedSprintObj.scrumMasterId) }}</span>
          <span class="role-badge scrum-master">Scrum Master</span>
        </div>
        <div v-for="memberId in selectedSprintObj.teamMembers" :key="memberId" class="team-member">
          <span class="member-name">{{ getUserName(memberId) }}</span>
          <span class="role-badge developer">Член команды</span>
          <button @click="removeTeamMember(memberId)" class="remove-member-btn" title="Remove from team">
            ×
          </button>
        </div>
      </div>
      <div class="team-actions">
        <button @click="showTeamModal = true" class="manage-team-btn">
          Управлять командой
        </button>
        <span class="team-info">{{ selectedSprintObj.teamMembers.length }} члены команды</span>
      </div>
    </div>

    <!-- Sprint Planning Info -->
    <div v-if="selectedSprint && selectedSprintStatus === 'planning'" class="planning-info">
      <div class="planning-stats">
        <div class="stat">
          <span class="stat-value">{{ sprintTasks.length }}</span>
          <span class="stat-label">Задачи выбрана</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ totalSprintPoints }}</span>
          <span class="stat-label">Количество очков</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ availableBacklogTasks.length }}</span>
          <span class="stat-label">Доступный список невыполненных работ</span>
        </div>
      </div>
      <!-- Role Information -->
      <div v-if="selectedSprint" class="role-info">
        <p v-if="isCurrentUserScrumMaster" class="scrum-master-info">
          Вы Scrum Master в этом спринте
        </p>
        <p v-else-if="isCurrentUserTeamMember" class="team-member-info">
          Вы член команды в этом спринте
        </p>
        <p v-else class="observer-info">
          Вы рассматриваете этот спринт
        </p>
      </div>
    </div>

    <!-- Create Sprint Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Спланировать новый спринт</h3>
          <button @click="closeCreateModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="sprint-info">
            <p><strong>Доступные невыполненные задачи:</strong> {{ availableBacklogTasks.length }}</p>
            <p><strong>Количество очков незавершенных задач:</strong> {{ totalBacklogPoints }}</p>
          </div>
          
          <form @submit.prevent="handleCreateSprint">
            <div class="form-group">
              <label>Название спринта *</label>
              <input 
                v-model="newSprint.name" 
                type="text" 
                required 
                class="form-input" 
                placeholder="пример, Sprint 1 - Аутентификация пользователя" 
              />
            </div>
            
            <div class="form-group">
              <label>Цель спринта *</label>
              <textarea 
                v-model="newSprint.goal" 
                required 
                class="form-textarea" 
                rows="3" 
                placeholder="Что является целью спринта?" 
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Дата начала *</label>
                <input 
                  v-model="startDateString" 
                  type="date" 
                  required 
                  class="form-input" 
                />
              </div>
              
              <div class="form-group">
                <label>Дата окончания *</label>
                <input 
                  v-model="endDateString" 
                  type="date" 
                  required 
                  class="form-input" 
                />
              </div>
            </div>

            <div class="form-group">
              <label>Объем количества очков спринта</label>
              <input 
                v-model="newSprint.velocity" 
                type="number" 
                class="form-input" 
                placeholder="Рассчитываемый объем спринта" 
              />
            </div>

            <!-- Team Selection -->
            <div class="form-group">
              <label>Члены команды</label>
              <div class="team-selection">
                <div v-if="availableUsers.length === 0" class="loading-users">
                  Загрузка пользователей...
                </div>
                <div 
                  v-for="user in availableUsers" 
                  :key="user.id"
                  class="user-checkbox"
                >
                  <label>
                    <input 
                      type="checkbox" 
                      :value="user.id" 
                      v-model="newSprint.teamMembers"
                      :disabled="user.id === newSprint.scrumMasterId"
                    />
                    <span class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-actions">
          <button @click="closeCreateModal" class="cancel-btn">
            Отменить
          </button>
          <button @click="handleCreateSprint" class="submit-btn">
            Создать план спринта
          </button>
        </div>
      </div>
    </div>

    <!-- Team Management Modal -->
    <div v-if="showTeamModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Управления командой спринта</h3>
          <button @click="showTeamModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="current-team">
            <h4>Текущая команда</h4>
            <div class="team-list">
              <div class="team-member-info">
                <strong>Scrum Master:</strong> {{ getScrumMasterName(teamData.scrumMasterId) }}
              </div>
              <div v-for="memberId in teamData.teamMembers" :key="memberId" class="team-member-info">
                <strong>Член команды:</strong> {{ getUserName(memberId) }}
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Добавить члена команды</label>
            <div class="team-selection">
              <div v-if="availableUsers.length === 0" class="loading-users">
                Загрузка пользователей...
              </div>
              <div 
                v-for="user in availableUsers" 
                :key="user.id"
                class="user-checkbox"
              >
                <label>
                  <input 
                    type="checkbox" 
                    :value="user.id" 
                    v-model="teamData.teamMembers"
                    :disabled="user.id === teamData.scrumMasterId"
                    :checked="teamData.teamMembers.includes(user.id)"
                  />
                  <span class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showTeamModal = false" class="cancel-btn">
            Отменить
          </button>
          <button @click="updateSprintTeam" class="submit-btn">
            Обновить команду
          </button>
        </div>
      </div>
    </div>

    <!-- Backlog Tasks Modal -->
    <div v-if="showBacklogModal" class="modal-overlay">
      <div class="modal large-modal">
        <div class="modal-header">
          <h3>Добавить задачи из списка доступных задач</h3>
          <button @click="closeBacklogModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="backlog-info">
            <p><strong>Спринт:</strong> {{ getSelectedSprintName() }}</p>
            <p><strong>Выбранные:</strong> {{ selectedBacklogTaskIds.length }} задачи ({{ getSelectedPoints() }} очки)</p>
          </div>
          
          <div class="tasks-list">
            <div 
              v-for="task in availableBacklogTasks" 
              :key="task.id"
              class="task-item"
            >
              <label class="task-checkbox">
                <input 
                  type="checkbox" 
                  :value="task.id" 
                  v-model="selectedBacklogTaskIds"
                />
                <span class="checkmark"></span>
              </label>
              
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <p class="task-description" v-if="task.description">{{ task.description }}</p>
                <div class="task-meta">
                  <span class="task-points" v-if="task.storyPoints">
                    {{ task.storyPoints }} Очки
                  </span>
                  <span :class="['priority-badge', task.priority]">
                    {{ task.priority }}
                  </span>
                </div>
              </div>
              
              <span :class="['task-status', task.status]">
                {{ task.status }}
              </span>
            </div>
            
            <div v-if="availableBacklogTasks.length === 0" class="no-tasks">
              <p>Нет доступных задач</p>
              <p class="hint">Создайте задачу для списка доступных задач</p>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeBacklogModal" class="cancel-btn">
            отменить
          </button>
          <button 
            @click="addBacklogTasksToSprint" 
            class="submit-btn"
            :disabled="selectedBacklogTaskIds.length === 0"
          >
            Добавить {{ selectedBacklogTaskIds.length }} задач в спринт
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useTaskStore } from '../../stores/task'
import { useAuthStore } from '../../stores/auth'
import { useUserStore } from '../../stores/user'
import { type Sprint, type CreateSprintRequest, TaskStatus } from '../../../types/src'

const isLoading = ref(false);

interface Props {
  boardId: string
  sprints: Sprint[]
  activeSprint?: Sprint | null
  isScrumMaster?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'sprint-change': [sprintId: string]
  'sprint-create': [sprintData: CreateSprintRequest & { scrumMasterId: string; teamMembers: string[] }]
  'sprint-delete': [sprintId: string]
  //'sprint-set-active': [sprintId: string]
  'sprint-start': [sprintId: string]
  'sprint-complete': [sprintId: string]
  'backlog-tasks-add': [sprintId: string, taskIds: string[]]
  'sprint-team-update': [sprintId: string, teamData: { scrumMasterId: string; teamMembers: string[] }]
}>()

const taskStore = useTaskStore()
const authStore = useAuthStore()
const userStore = useUserStore()


const selectedSprint = ref('')
const showCreateModal = ref(false)
const showBacklogModal = ref(false)
const showTeamModal = ref(false)
const selectedBacklogTaskIds = ref<string[]>([])

onMounted(async () => {
  await userStore.fetchUsers()
})

const teamData = ref({
  scrumMasterId: authStore.user?.id || '',
  teamMembers: [] as string[]
})


const newSprint = ref({
  name: '',
  goal: '',
  startDate: new Date(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 дней
  boardId: props.boardId,
  velocity: 0,
  scrumMasterId: authStore.user?.id || '',
  teamMembers: [] as string[]
})

const startDateString = ref(newSprint.value.startDate.toISOString().split('T')[0])
const endDateString = ref(newSprint.value.endDate.toISOString().split('T')[0])

// Доступные пользователи (исключаем текущего пользователя из списка участников если он Scrum Master)
const availableUsers = computed(() => {
  return userStore.users.filter(user => user.id !== authStore.user?.id)
})

// Активные спринты (planning или active)
const activeSprints = computed(() => {
  return props.sprints.filter(sprint => 
    sprint.status === 'planning' || sprint.status === 'active'
  )
})

// Выбранный спринт объект
const selectedSprintObj = computed(() => {
  if (!selectedSprint.value) return null
  const sprint = props.sprints.find(s => s.id === selectedSprint.value)
  // Проверка для teamMembers
  return sprint ? {
    ...sprint,
    teamMembers: sprint.teamMembers || []
  } : null
})

// Задачи Product Backlog (без спринта)
const availableBacklogTasks = computed(() => {
  return taskStore.tasks.filter(task => 
    !task.sprintId && task.boardId === props.boardId
  )
})

// Задачи в выбранном спринте
const sprintTasks = computed(() => {
  if (!selectedSprint.value) return []
  return taskStore.tasks.filter(task => task.sprintId === selectedSprint.value)
})

// Статус выбранного спринта
const selectedSprintStatus = computed(() => {
  return selectedSprintObj.value?.status || ''
})

// Проверяем, является ли текущий пользователь Scrum Master
const isCurrentUserScrumMaster = computed(() => {
  return selectedSprintObj.value?.scrumMasterId === authStore.user?.id
})

// Проверяем, является ли текущий пользователь участником команды
const isCurrentUserTeamMember = computed(() => {
  if (!selectedSprintObj.value) return false
  const teamMembers = selectedSprintObj.value.teamMembers || []
  return teamMembers.includes(authStore.user?.id || '') ||
         selectedSprintObj.value.scrumMasterId === authStore.user?.id
})

// Общие очки в бэклоге
const totalBacklogPoints = computed(() => {
  return availableBacklogTasks.value.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
})

// Общие очки в спринте
const totalSprintPoints = computed(() => {
  return sprintTasks.value.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
})

// Устанавливаем активный спринт по умолчанию
watch(() => props.activeSprint, (newActiveSprint) => {
  if (newActiveSprint) {
    selectedSprint.value = newActiveSprint.id

    // Загружаем информацию о пользователях команды
    if (newActiveSprint.teamMembers && newActiveSprint.teamMembers.length > 0) {
      userStore.preloadUsers([newActiveSprint.scrumMasterId, ...newActiveSprint.teamMembers])
    }
  }
}, { immediate: true })

function getSelectedSprintName(): string {
  if (!selectedSprint.value) return 'No sprint selected'
  const sprint = props.sprints.find(s => s.id === selectedSprint.value)
  return sprint ? sprint.name : 'Unknown sprint'
}

function getSelectedPoints(): number {
  return availableBacklogTasks.value
    .filter(task => selectedBacklogTaskIds.value.includes(task.id))
    .reduce((sum, task) => sum + (task.storyPoints || 0), 0)
}

function handleSprintChange() {
  selectedBacklogTaskIds.value = [] // Сбрасываем выбор при смене спринта
  emit('sprint-change', selectedSprint.value)

  // Загружаем информацию о пользователях при смене спринта
  if (selectedSprintObj.value) {
    userStore.preloadUsers([
      selectedSprintObj.value.scrumMasterId,
      ...(selectedSprintObj.value.teamMembers || [])
    ])
  }
}

function handleCreateSprint() {
  if (!newSprint.value.name || !newSprint.value.goal) {
    alert('Пожалуйста, заполните все обязательные поля')
    return
  }

  if (!startDateString.value || !endDateString.value) {
    alert('Пожалуйста, выберите даты начала и окончания')
    return
  }

  const startDate = new Date(startDateString.value)
  const endDate = new Date(endDateString.value)

  if (endDate <= startDate) {
    alert('Дата окончания должна быть после даты начала')
    return
  }

  const sprintData: CreateSprintRequest = {
    ...newSprint.value,
    startDate: new Date(newSprint.value.startDate),
    endDate: new Date(newSprint.value.endDate),
    boardId: props.boardId,
    scrumMasterId: newSprint.value.scrumMasterId,
    teamMembers: newSprint.value.teamMembers
  }
  try {
      emit('sprint-create', sprintData)
      closeCreateModal()
    } catch (error) {
      console.error('Error creating sprint:', error)
      alert('Не удалось создать план спринта')
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  resetNewSprintForm()
}

function closeBacklogModal() {
  showBacklogModal.value = false
  selectedBacklogTaskIds.value = []
}

function handleDeleteSprint(sprintId: string) {
  if (!isCurrentUserScrumMaster.value) {
    alert('Только Scrum Master может удалять спринты')
    return
  }

  if (confirm('Вы уверены, что хотите удалить этот спринт? Все задачи будут перенесены обратно в журнал невыполненных работ.')) {
    emit('sprint-delete', sprintId)
    if (selectedSprint.value === sprintId) {
      selectedSprint.value = ''
    }
  }
}

function startSprint(sprintId: string) {
  if (!isCurrentUserScrumMaster.value) {
    alert('Только Scrum Master может начинать спринты')
    return
  }

  if (sprintTasks.value.length === 0) {
    alert('Невозможно запустить sprint без задач. Пожалуйста, сначала добавьте задачи из списка невыполненных работ.')
    return
  }
  emit('sprint-start', sprintId)
}

function completeSprint(sprintId: string) {
  if (confirm('Завершите этот спринт? Все выполненные задачи будут заархивированы, а незавершенные задачи вернутся в журнал невыполненных работ.')) {
    isLoading.value = true;
    try {
      emit('sprint-complete', sprintId);
    } finally {
      isLoading.value = false;
    }
  }
}

function updateSprintTeam() {
  if (!isCurrentUserScrumMaster.value) {
    alert('Только Scrum Master может обновлять команду')
    return
  }

  if (selectedSprint.value) {
    emit('sprint-team-update', selectedSprint.value, teamData.value)
    showTeamModal.value = false
  }
}

function removeTeamMember(memberId: string) {
  if (!isCurrentUserScrumMaster.value) {
    alert('Только Scrum Master может удалять членов команды')
    return
  }

  if (selectedSprintObj.value) {
    const currentTeamMembers = selectedSprintObj.value.teamMembers || []
    const updatedTeamMembers = currentTeamMembers.filter(id => id !== memberId)
    const updatedTeamData = {
      scrumMasterId: selectedSprintObj.value.scrumMasterId,
      teamMembers: updatedTeamMembers
    }
    emit('sprint-team-update', selectedSprint.value, updatedTeamData)
  }
}

// Инициализируем teamData при открытии модального окна
watch(showTeamModal, (show) => {
  if (show && selectedSprintObj.value) {
    teamData.value = {
      scrumMasterId: selectedSprintObj.value.scrumMasterId,
      teamMembers: [...(selectedSprintObj.value.teamMembers || [])]
    }
  }
})

function getScrumMasterName(userId: string): string {
  if (userId === authStore.user?.id) return 'Вы'
  return userStore.getUserName(userId)
}

function getUserName(userId: string): string {
  if (userId === authStore.user?.id) return 'Вы'
  return userStore.getUserName(userId)
}

async function addBacklogTasksToSprint() {
  if (selectedBacklogTaskIds.value.length === 0) return
  
  try {
    // Обновляем статус задач на "backlog" при добавлении в спринт
    for (const taskId of selectedBacklogTaskIds.value) {
      await taskStore.updateTask(taskId, { 
        status: TaskStatus.BACKLOG,
        sprintId: selectedSprint.value
      })
    }


    await taskStore.addTasksToSprint(selectedSprint.value, selectedBacklogTaskIds.value)
    emit('backlog-tasks-add', selectedSprint.value, selectedBacklogTaskIds.value)
    closeBacklogModal()
  } catch (error) {
    console.error('Failed to add tasks to sprint:', error)
    alert('Не удалось добавить задачи в sprint')
  }
}

function resetNewSprintForm() {
  newSprint.value = {
    name: '',
    goal: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    boardId: props.boardId,
    velocity: 0,
    scrumMasterId: authStore.user?.id || '',
    teamMembers: []
  }
  startDateString.value = newSprint.value.startDate.toISOString().split('T')[0]
  endDateString.value = newSprint.value.endDate.toISOString().split('T')[0]
}

function formatDate(date?: Date) {
  if (!date) return 'Дата неизвестна';
  return new Date(date).toLocaleDateString('ru-RU', { 
    day: 'numeric',
    month: 'short'
  })
}

</script>

<style scoped>
.sprint-selector {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.selector-label {
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.selector {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  min-width: 200px;
}

.new-sprint-btn,
.add-tasks-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-sprint-btn {
  background: #10b981;
  color: white;
}

.new-sprint-btn:hover {
  background: #059669;
}

.add-tasks-btn {
  background: #3b82f6;
  color: white;
}

.add-tasks-btn:hover {
  background: #2563eb;
}

.sprint-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn.success {
  background: #10b981;
  color: white;
}

.action-btn.success:hover:not(:disabled) {
  background: #059669;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
}

.action-btn.danger:hover {
  background: #dc2626;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.large-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background: #f9fafb;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Styles */
.sprint-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.sprint-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Team Management Styles */
.team-management {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
}

.team-management h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.team-members {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.team-member {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.member-name {
  font-size: 0.875rem;
  color: #374151;
  flex: 1;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 0.5rem;
}

.role-badge.scrum-master {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.developer {
  background: #dbeafe;
  color: #1e40af;
}

.remove-member-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.remove-member-btn:hover {
  background: #dc2626;
}

.team-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manage-team-btn {
  padding: 0.5rem 1rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.manage-team-btn:hover {
  background: #7c3aed;
}

.team-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.team-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.user-checkbox {
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-checkbox:last-child {
  border-bottom: none;
}

.user-checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.loading-users {
  text-align: center;
  color: #6b7280;
  padding: 1rem;
  font-style: italic;
}

.current-team {
  margin-bottom: 1.5rem;
}

.current-team h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-member-info {
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

/* Planning Info Styles */
.planning-info {
  margin-top: 1rem;
}

.planning-stats {
  display: flex;
  gap: 2rem;
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
  color: #3b82f6;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-info {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
}

.scrum-master-info {
  background: #fef3c7;
  color: #92400e;
  margin: 0;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.team-member-info {
  background: #dbeafe;
  color: #1e40af;
  margin: 0;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.observer-info {
  background: #f3f4f6;
  color: #374151;
  margin: 0;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

/* Backlog Tasks Styles */
.backlog-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.backlog-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  transition: border-color 0.2s;
}

.task-item:hover {
  border-color: #3b82f6;
}

.task-checkbox {
  display: flex;
  align-items: center;
}

.task-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: block;
}

.task-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.task-points {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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

.task-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.task-status.backlog {
  background: #f3f4f6;
  color: #374151;
}

.task-status.todo {
  background: #dbeafe;
  color: #1e40af;
}

.task-status.in_progress {
  background: #fef3c7;
  color: #92400e;
}

.no-tasks {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.no-tasks p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.875rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .selector-main {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .selector {
    min-width: auto;
  }
  
  .sprint-actions {
    flex-wrap: wrap;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal {
    margin: 1rem;
  }
  
  .planning-stats {
    gap: 1rem;
  }
  
  .task-item {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>