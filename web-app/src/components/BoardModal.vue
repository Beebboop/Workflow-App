<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Создать новую доску</h3>
        <button
          @click="$emit('close')"
          class="close-btn"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="name" class="form-label">
            Название доски *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form-input"
            placeholder="Введите название доски"
          />
        </div>

        <div class="form-group">
          <label for="type" class="form-label">
            Тип доски *
          </label>
          <select
            id="type"
            v-model="form.type"
            required
            class="form-select"
            :disabled="isTypeLocked"
          >
            <option value="kanban">Kanban</option>
            <option value="scrum">Scrum</option>
          </select>
          <p v-if="isTypeLocked" class="type-hint">
            Для этой страницы задан тип доски {{ defaultType }}
          </p>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">
            Описание
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="form-textarea"
            placeholder="Введите описание доски (опционально)"
          />
        </div>

        <div class="form-actions">
          <button
            type="button"
            @click="$emit('close')"
            class="cancel-btn"
          >
            Отменить
          </button>
          <button
            type="submit"
            class="submit-btn"
            :class="{ 'scrum-btn': form.type === 'scrum' }"
          >
            Создать {{ form.type === 'scrum' ? 'Scrum' : 'Kanban' }} доску
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { CreateBoardRequest } from '../../types/src'

interface Props {
  show: boolean
  defaultType?: 'kanban' | 'scrum'
}

const props = withDefaults(defineProps<Props>(), {
  defaultType: 'kanban'
})

const emit = defineEmits<{
  close: []
  save: [boardData: CreateBoardRequest]
}>()

const form = reactive({
  name: '',
  type: props.defaultType,
  description: ''
})

const isTypeLocked = computed(() => props.defaultType !== 'kanban')

// Сбрасываем форму при открытии модального окна
watch(() => props.show, (newVal) => {
  if (newVal) {
    form.name = ''
    form.type = props.defaultType
    form.description = ''
  }
})

// Обновляем тип при изменении defaultType
watch(() => props.defaultType, (newType) => {
  form.type = newType
})

function handleSubmit() {
  const boardData: CreateBoardRequest = {
    name: form.name.trim(),
    type: form.type,
    description: form.description.trim() || undefined
  }
  emit('save', boardData)
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
  max-width: 28rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 0.75rem 0.75rem 0 0;
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
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-form {
  padding: 1.5rem;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  width: 100%;
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
  max-width: 100%;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 5rem;
  max-width: 100%;
}

.type-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  width: 100%;
  box-sizing: border-box;
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
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.submit-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.submit-btn.scrum-btn {
  background: #10b981;
  border-color: #10b981;
}

.submit-btn.scrum-btn:hover {
  background: #059669;
  border-color: #059669;
}

.submit-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.submit-btn.scrum-btn:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

/* Адаптивность для мобильных устройств */
@media (max-width: 640px) {
  .modal {
    margin: 0.5rem;
    max-width: calc(100vw - 1rem);
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-form {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>