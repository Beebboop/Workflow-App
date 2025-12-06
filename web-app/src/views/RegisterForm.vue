<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">Создайте аккаунт</h2>
      </div>
      
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-fields">
          <div class="input-group">
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="form-input"
              placeholder="Имя"
            >
          </div>
          <div class="input-group">
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="form-input"
              placeholder="Email адрес"
            >
          </div>
          <div class="input-group">
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="form-input"
              placeholder="Пароль"
            >
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="submit-btn"
        >
          <span v-if="loading">Создание аккаунта...</span>
          <span v-else>Зарегистрироваться</span>
        </button>

        <div class="auth-link">
          <router-link to="/login">
            Уже есть аккаунт? Войти
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { RegisterRequest } from '../../types/src'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const form = reactive<RegisterRequest>({
  name: '',
  email: '',
  password: ''
})

async function handleRegister() {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    await authStore.register(form)
    router.push('/')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else if (isApiError(err)) {
      error.value = err.response?.data?.message || 'Registration failed'
    } else {
      error.value = 'Registration failed'
    }
  } finally {
    loading.value = false
  }
}

function isApiError(error: unknown): error is { response?: { data?: { message?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in error
}
</script>

<style scoped>
/* Mobile First стили */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 1rem;
}

.auth-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 0.375rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
}

.auth-link a {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.auth-link a:hover {
  color: #2563eb;
}

/* Планшет */
@media (min-width: 768px) {
  .auth-container {
    padding: 2rem;
  }
  
  .auth-card {
    padding: 2.5rem 2rem;
    max-width: 420px;
  }
  
  .auth-title {
    font-size: 1.75rem;
  }
  
  .form-input {
    padding: 0.875rem 1.25rem;
    font-size: 1.05rem;
  }
  
  .submit-btn {
    padding: 0.875rem 1.25rem;
    font-size: 1.05rem;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .auth-container {
    padding: 3rem;
  }
  
  .auth-card {
    padding: 3rem 2.5rem;
    max-width: 440px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .auth-title {
    font-size: 2rem;
  }
  
  .auth-form {
    gap: 2rem;
  }
  
  .form-fields {
    gap: 1.25rem;
  }
  
  .form-input {
    padding: 1rem 1.5rem;
  }
  
  .submit-btn {
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
  }
  
  .auth-link a {
    font-size: 1rem;
  }
}

/* Большие экраны */
@media (min-width: 1280px) {
  .auth-card {
    max-width: 480px;
  }
}
</style>