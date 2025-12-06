<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Header -->
      <div class="header">
        <h2 class="title">С возвращением</h2>
        <p class="subtitle">Войдите в свою учетную запись, чтобы продолжить</p>
      </div>

      <!-- Form -->
      <form class="form" @submit.prevent="handleLogin">
        <!-- Input Fields -->
        <div class="input-group">
          <div class="input-field">
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="input"
              placeholder="Email адрес"
            >
          </div>
          <div class="input-field">
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="input"
              placeholder="Пароль"
            >
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" clip-rule="evenodd" />
          </svg>
          <span class="error-text">{{ error }}</span>
        </div>

        <!-- Submit Button -->
        <div class="button-container">
          <button
            type="submit"
            :disabled="loading"
            class="submit-button"
          >
            <div class="button-content">
              <svg v-if="loading" class="spinner" fill="none" viewBox="0 0 24 24">
                <path class="spinner-path" fill="currentColor" />
              </svg>
              <span>{{ loading ? 'Вход в систему...' : 'Войдите в систему' }}</span>
            </div>
          </button>
        </div>

        <!-- Sign up Link -->
        <div class="signup-link">
          <p class="signup-text">
            Нет аккаунта?
            <router-link to="/register" class="link">
              Зарегистрируйтесь сейчас
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { LoginRequest } from '../../types/src'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const form = reactive<LoginRequest>({
  email: '',
  password: ''
})

async function handleLogin() {
  if (loading.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(form)
    router.push('/')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else if (isApiError(err)) {
      error.value = err.response?.data?.message || 'Login failed'
    } else {
      error.value = 'Login failed'
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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid #f1f5f9;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-field {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  background: white;
  transition: all 0.2s;
  font-size: 1rem;
  text-align: center;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:hover {
  border-color: #9ca3af;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #dc2626;
  flex-shrink: 0;
}

.error-text {
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 500;
}

.button-container {
  margin-top: 1rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  animation: spin 1s linear infinite;
}

.spinner-path {
  opacity: 0.75;
}

.signup-link {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
}

.signup-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.link {
  color: #2563eb;
  font-weight: 500;
  margin-left: 0.25rem;
  text-decoration: none;
  transition: color 0.2s;
}

.link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>