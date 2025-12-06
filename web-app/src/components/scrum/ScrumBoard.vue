<template>
  <div class="scrum-board">
    <!-- Sprint Header -->
    <div v-if="sprint" class="sprint-header">
      <div class="sprint-info">
        <h4 class="sprint-name">{{ sprint.name }}</h4>
        <p class="sprint-goal">{{ sprint.goal }}</p>
        <div class="sprint-dates">
          {{ formatDate(sprint.startDate) }} - {{ formatDate(sprint.endDate) }}
          <span :class="['status-badge', sprint.status]">{{ sprint.status }}</span>
        </div>
      </div>
      <div class="sprint-stats">
        <div class="stat">
          <span class="stat-value">{{ completedTasks }}/{{ totalTasks }}</span>
          <span class="stat-label">Задач завершено</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ completedPoints }}/{{ totalPoints }}</span>
          <span class="stat-label">Очки</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ remainingPoints }}</span>
          <span class="stat-label">Осталось</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ progressPercentage }}%</span>
          <span class="stat-label">Прогресс</span>
        </div>
      </div>
    </div>

    <!-- Product Backlog Section (только если нет активного спринта) -->
    <div v-if="!sprintId" class="backlog-section">
      <div class="backlog-header">
        <h4>Список доступных задач</h4>
        <p class="backlog-description">Задачи ожидающие планирования в спринтах</p>
        <button @click="showCreateTaskModal = true" class="create-task-btn">
          + Добавить задачу
        </button>
      </div>
      
      <div class="backlog-tasks">
        <div
          v-for="task in backlogTasks"
          :key="task.id"
          class="backlog-task"
          @click="$emit('task-click', task)"
        >
          <div class="task-header">
            <span class="task-id">#{{ task.id.slice(-4) }}</span>
            <span :class="['priority-badge', task.priority]">
              {{ task.priority }}
            </span>
          </div>
          <h6 class="task-title">{{ task.title }}</h6>
          <p class="task-description" v-if="task.description">{{ task.description }}</p>
          <div class="task-footer">
            <span class="story-points" v-if="task.storyPoints">
              {{ task.storyPoints }} SP
            </span>
            <div class="task-tags" v-if="task.tags && task.tags.length">
              <span
                v-for="tag in task.tags.slice(0, 2)"
                :key="tag"
                class="task-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="backlogTasks.length === 0" class="empty-backlog">
          <h5>Нет задач в списке доступных</h5>
          <p>Добавить задачу</p>
          <button @click="showCreateTaskModal = true" class="create-task-btn">
            + Создать задачу
          </button>
        </div>
      </div>
    </div>

    <!-- Sprint Board -->
    <div class="sprint-board-section">
      <div class="task-board">
        <div
          v-for="column in columns"
          :key="column.id"
          class="board-column"
          @drop="handleDrop($event, column.status)"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          :class="{ 'drag-over': dragOverColumn === column.status }"
        >
          <div class="column-header">
            <h5 class="column-title">{{ column.name }}</h5>
            <span class="task-count">{{ getTasksByStatus(column.status).length }}</span>
          </div>
          
          <div class="tasks-list">
            <div
              v-for="task in getTasksByStatus(column.status)"
              :key="task.id"
              class="scrum-task"
              draggable="true"
              @dragstart="handleDragStart($event, task)"
              @dragend="handleDragEnd"
              @click="$emit('task-click', task)"
            >
              <div class="task-header">
                <span class="task-id">#{{ task.id.slice(-4) }}</span>
                <span :class="['priority-badge', task.priority]">
                  {{ task.priority }}
                </span>
              </div>
              <h6 class="task-title">{{ task.title }}</h6>
              <p class="task-description" v-if="task.description">{{ task.description }}</p>
              <div class="task-footer">
                <span class="story-points" v-if="task.storyPoints">
                  {{ task.storyPoints }} SP
                </span>
                <div class="task-tags" v-if="task.tags && task.tags.length">
                  <span
                    v-for="tag in task.tags.slice(0, 2)"
                    :key="tag"
                    class="task-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="getTasksByStatus(column.status).length === 0" class="empty-column">
              <p>Перетащите задачу сюда</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal для создания задачи в бэклоге -->
    <div v-if="showCreateTaskModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ sprintId ? 'Создать задачу спринта' : 'Добавить в список доступных задач' }}</h3>
          <button @click="showCreateTaskModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <form @submit.prevent="handleCreateTask">
            <div class="form-group">
              <label>Title *</label>
              <input 
                v-model="newTask.title" 
                type="text" 
                required 
                class="form-input" 
                placeholder="Введите название задачи"
              />
            </div>
            
            <div class="form-group">
              <label>Описание</label>
              <textarea 
                v-model="newTask.description" 
                class="form-textarea" 
                rows="3" 
                placeholder="Опишите задачу"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Очки задачи</label>
                <input 
                  v-model="newTask.storyPoints" 
                  type="number" 
                  class="form-input" 
                  placeholder="Введите количество очков"
                  min="0"
                  step="1"
                />
              </div>
              
              <div class="form-group">
                <label>Приоритет *</label>
                <select v-model="newTask.priority" class="form-select" required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Определение выполнения</label>
              <textarea 
                v-model="newTask.dod" 
                class="form-textarea" 
                rows="2" 
                placeholder="Опишите критерий выполнения"
              />
            </div>

            <div class="form-group">
              <label>Теги (через запятую)</label>
              <input 
                v-model="tagInput" 
                type="text" 
                class="form-input" 
                placeholder="feature, bug, ui, etc." 
              />
            </div>

            <div class="location-info">
              <p v-if="sprintId"><strong>Местоположение:</strong> Текущий спринт</p>
              <p v-else><strong>Местоположение:</strong> Список доступных задач </p>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="showCreateTaskModal = false" class="cancel-btn">
                Отменить
              </button>
              <button type="submit" class="submit-btn">
                {{ sprintId ? 'Добавить в спринт' : 'Добавить в список задач' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTaskStore } from '../../stores/task'
import { useAuthStore } from '../../stores/auth'
import { type Task, TaskStatus, TaskPriority, type CreateTaskRequest } from '../../../types/src'

interface Props {
  sprintId?: string | null
  boardId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'task-click': [task: Task]
  'task-move': [taskId: string, newStatus: string]
  'task-created': [taskData: CreateTaskRequest]
}>()

const taskStore = useTaskStore()
const authStore = useAuthStore()
const draggedTask = ref<Task | null>(null)
const dragOverColumn = ref<string | null>(null)
const showCreateTaskModal = ref(false)
const tagInput = ref('')

const newTask = ref<CreateTaskRequest & { dod?: string }>({
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.BACKLOG,
  assigneeId: authStore.user?.id || '',
  reporterId: authStore.user?.id || '',
  tags: [],
  boardId: props.boardId,
  sprintId: props.sprintId || undefined,
  storyPoints: undefined,
  dod: ''
})

const sprint = computed(() => {
  if (!props.sprintId) return null
  return taskStore.sprints.find(s => s.id === props.sprintId) || null
})

// Задачи Product Backlog
const backlogTasks = computed(() => {
  return taskStore.tasks.filter(task => 
    !task.sprintId && task.boardId === props.boardId
  )
})

// Задачи в спринте
const sprintTasks = computed(() => {
  if (!props.sprintId) return []
  return taskStore.tasks.filter(task => task.sprintId === props.sprintId)
})

const columns = [
  { id: 'todo', name: 'К исполнению', status: TaskStatus.TODO },
  { id: 'in_progress', name: 'В процессе', status: TaskStatus.IN_PROGRESS },
  { id: 'review', name: 'Оценка', status: TaskStatus.REVIEW },
  { id: 'done', name: 'Завершено', status: TaskStatus.DONE }
]

const totalTasks = computed(() => sprintTasks.value.length)
const completedTasks = computed(() => 
  sprintTasks.value.filter(task => task.status === TaskStatus.DONE).length
)

const totalPoints = computed(() => 
  sprintTasks.value.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
)

const completedPoints = computed(() => 
  sprintTasks.value
    .filter(task => task.status === TaskStatus.DONE)
    .reduce((sum, task) => sum + (task.storyPoints || 0), 0)
)

const remainingPoints = computed(() => totalPoints.value - completedPoints.value)
const progressPercentage = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})


// Drag and Drop функции
function handleDragStart(event: DragEvent, task: Task) {
  draggedTask.value = task
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
  }
  event.stopPropagation()
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
}

function handleDrop(event: DragEvent, newStatus: TaskStatus) {
  event.preventDefault()
  
  if (draggedTask.value && draggedTask.value.status !== newStatus) {
    // Обновляем статус задачи через store
    taskStore.updateTask(draggedTask.value.id, { status: newStatus })
    
    // Эмитим событие для родительского компонента
    emit('task-move', draggedTask.value.id, newStatus)
    
    console.log(`Moved task ${draggedTask.value.title} to ${newStatus}`)
  }
  
  // Сбрасываем состояние
  dragOverColumn.value = null
  draggedTask.value = null
}

function handleDragEnd() {
  dragOverColumn.value = null
  draggedTask.value = null
}


function getTasksByStatus(status: TaskStatus) {
  return sprintTasks.value.filter(task => task.status === status)
}

async function handleCreateTask() {
  try {
    const taskData: CreateTaskRequest = {
      ...newTask.value,
      tags: tagInput.value 
        ? tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [],
      // Для задач в спринте статус TODO, для бэклога - BACKLOG
      status: props.sprintId ? TaskStatus.TODO : TaskStatus.BACKLOG,
      sprintId: props.sprintId || undefined
    }

    await taskStore.createTask(props.boardId, taskData)
    emit('task-created', taskData)
    showCreateTaskModal.value = false
    resetNewTaskForm()
  } catch (error) {
    console.error('Failed to create task:', error)
    alert('Failed to create task')
  }
}

function resetNewTaskForm() {
  newTask.value = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.BACKLOG,
    assigneeId: authStore.user?.id || '',
    reporterId: authStore.user?.id || '',
    tags: [],
    boardId: props.boardId,
    sprintId: props.sprintId || undefined,
    storyPoints: undefined,
    dod: ''
  }
  tagInput.value = ''
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
.scrum-board {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.sprint-info {
  flex: 1;
}

.sprint-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.sprint-goal {
  color: #6b7280;
  font-style: italic;
  margin: 0 0 0.5rem 0;
}

.sprint-dates {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
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

/* Backlog Section */
.backlog-section {
  padding: 1.5rem;
}

.backlog-header {
  margin-bottom: 1.5rem;
}

.backlog-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.backlog-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.create-task-btn {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.create-task-btn:hover {
  background: #059669;
}

.backlog-tasks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.backlog-task {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.backlog-task:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.empty-backlog {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}


.empty-backlog h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
}

.empty-backlog p {
  margin: 0 0 1.5rem 0;
}

/* Sprint Board Section */
.sprint-board-section {
  padding: 0;
}

.task-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.board-column {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 500px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.column-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.task-count {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 2rem;
}

.scrum-task {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.scrum-task:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.scrum-task.dragging {
  opacity: 0.5;
  border: 2px dashed #3b82f6;
}

.empty-column {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 2rem 1rem;
}

/* Common Task Styles */
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.task-id {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

.priority-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
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

.task-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.task-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
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
  align-items: center;
}

.story-points {
  background: #3b82f6;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-tags {
  display: flex;
  gap: 0.25rem;
}

.task-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 500;
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
}

.close-btn:hover {
  color: #374151;
}

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
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

.location-info {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  border: 1px solid #e5e7eb;
}

.location-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
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

.submit-btn:hover {
  background: #2563eb;
}

@media (max-width: 1024px) {
  .task-board {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sprint-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .sprint-stats {
    gap: 1rem;
  }
  
  .task-board {
    grid-template-columns: 1fr;
  }
  
  .backlog-tasks {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>