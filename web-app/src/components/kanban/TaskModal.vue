<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">
          {{ task ? 'Редактировать задачу' : 'Создать новую задачу' }}
        </h3>
        <button @click="$emit('close')" class="close-btn">
          ×
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="title" class="form-label">Название *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="form-textarea"
          />
        </div>
        <div class="form-group">
          <label for="dueDate" class="form-label">Дата дедлайна</label>
          <input
            id="dueDate"
            v-model="dueDateString"
            type="date"
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="priority" class="form-label">Приоритет</label>
            <select
              id="priority"
              v-model="form.priority"
              class="form-select"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>

          <div class="form-group">
            <label for="status" class="form-label">Статус</label>
            <select
              id="status"
              v-model="form.status"
              class="form-select"
            >
              <option value="backlog">Доступный</option>
              <option value="todo">К исполнению</option>
              <option value="in_progress">В процессе</option>
              <option value="review">Оценка</option>
              <option value="done">Завершено</option>
            </select>
          </div>
        </div>

        <!-- Секция тегов -->
        <div class="form-group">
          <label class="form-label">Теги</label>
          <div class="tags-input-container">
            <div class="tags-display">
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="tag"
              >
                {{ tag }}
                <button
                  type="button"
                  @click="removeTag(index)"
                  class="tag-remove"
                >
                  ×
                </button>
              </span>
            </div>
            <div class="tags-input-wrapper">
              <input
                v-model="newTag"
                type="text"
                placeholder="Добавить тег..."
                @keydown.enter.prevent="addTag"
                @keydown.backspace="handleBackspace"
                class="tag-input"
              />
            </div>
            <div class="tags-hint">
              Нажмите Enter, чтобы добавить тег, и Backspace, чтобы удалить последний тег
            </div>
          </div>
        </div>

        <div class="form-actions">
          <!-- Кнопка удаления (только для создателя задачи и при редактировании) -->
          <button 
            v-if="task && canDeleteTask" 
            type="button" 
            @click="handleDelete" 
            class="delete-btn"
          >
            Delete Task
          </button>
          <div class="action-buttons">
            <button type="button" @click="$emit('close')" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              {{ task ? 'Обновить' : 'Создать' }} Task
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { TaskPriority, TaskStatus, type Task } from '../../../types/src'

interface FormData {
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  tags: string[]
  dueDate?: Date | undefined
}

const props = defineProps<{
  show: boolean
  task?: Task | null
  currentUserId?: string
}>()

const emit = defineEmits<{
  close: []
  save: [taskData: FormData]
  delete: [taskId: string]
}>()

const form = reactive<FormData>({
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.TODO,
  tags: [],
  dueDate: undefined
})

const canDeleteTask = computed(() => {
  if (!props.task || !props.currentUserId) return false
  return props.task.reporterId === props.currentUserId
})

const dueDateString = computed({
  get: () => form.dueDate ? form.dueDate.toISOString().split('T')[0] : '',
  set: (value: string) => {
    form.dueDate = value ? new Date(value) : undefined
  }
})

const newTag = ref('')

watch(() => props.task, (newTask) => {
  console.log('TaskModal: Task prop changed:', newTask)
  if (newTask) {
    form.title = newTask.title
    form.description = newTask.description
    form.priority = newTask.priority
    form.status = newTask.status
    form.tags = newTask.tags || []
    form.dueDate = newTask.dueDate || undefined
  } else {
    form.title = ''
    form.description = ''
    form.priority = TaskPriority.MEDIUM
    form.status = TaskStatus.TODO
    form.tags = []
    form.dueDate = undefined
  }
  newTag.value = ''
}, { immediate: true })

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index: number) {
  form.tags.splice(index, 1)
}

function handleBackspace() {
  if (newTag.value === '' && form.tags.length > 0) {
    form.tags.pop()
  }
}

function handleSubmit() {
  console.log('TaskModal: handleSubmit called')
  console.log('TaskModal: Form data to emit:', form)
  emit('save', { ...form })
}

function handleDelete() {
  if (props.task && confirm('Are you sure you want to delete this task?')) {
    console.log('TaskModal: Deleting task:', props.task.id)
    emit('delete', props.task.id)
  }
}
</script>

<style scoped>
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
  padding: 1rem;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 32rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
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
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
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

/* Стили для тегов */
.tags-input-container {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: white;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  margin-left: 0.25rem;
  padding: 0.125rem;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.tag-remove:hover {
  background: #9ca3af;
  color: white;
}

.tags-input-wrapper {
  position: relative;
}

.tag-input {
  border: none;
  padding: 0;
  width: 100%;
  font-size: 0.875rem;
  background: transparent;
}

.tag-input:focus {
  outline: none;
  box-shadow: none;
  border-color: transparent;
}

.tags-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}

.delete-btn {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
  }
  
  .delete-btn,
  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>