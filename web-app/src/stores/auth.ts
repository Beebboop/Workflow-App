import { defineStore } from 'pinia'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, computed, type App } from 'vue'
import api from '../utils/api'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../../types/src'
import { useNotificationStore } from './notification'

// Локальный тип пользователя без пароля
interface AppUser {
  id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
}

export enum UserRole{
    USER = 'user',
    ADMIN = 'admin'
}


export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | AppUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isInitialized = ref(false)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => {
    return !!(token.value && user.value && isInitialized.value)
  })

  async function login(credentials: LoginRequest) {
    console.log('AUTH STORE: Login attempt with:', credentials)
    
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      
      setAuth(response.data)
      return response.data
    } catch (error) {
      console.error('AUTH STORE error: ' + error);
      throw error
    }
  }

  async function register(userData: RegisterRequest) {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData)
      setAuth(response.data)
      return response.data
    } catch (error) {
      console.error('AUTH STORE error: ' + error);
      throw error
    }
  }

  async function logout() {
    user.value = null
    token.value = null
    isLoading.value = false
    isInitialized.value = true
    localStorage.removeItem('auth_token')

    const notificationStore = useNotificationStore()
    notificationStore.notifications = []
    notificationStore.unreadCount = 0
  }

  async function fetchProfile() {
    if (!token.value) {
      isInitialized.value = true
      return null
    }
    
    isLoading.value = true
    try {
      const response = await api.get<User>('/profile')
      user.value = response.data
      isInitialized.value = true
      return response.data
    } catch (error) {
      await logout() // Если запрос не удался, выходим и удаляем токен
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function setAuth(authData: AuthResponse) {
    // Приводим тип, так как AuthResponse.user уже без пароля
    user.value = authData.user as AppUser
    token.value = authData.token
    isInitialized.value = true
    localStorage.setItem('auth_token', authData.token)
  }

  // Initialize user if token exists
  async function initializeAuth() {
    if (token.value && !user.value) {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        // Даже при ошибке помечаем как инициализированное
        isInitialized.value = true
      }
    } else {
      isInitialized.value = true
    }
  }

  return {
    user,
    token,
    isLoading: computed(() => isLoading.value),
    isInitialized: computed(() => isInitialized.value),
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    initializeAuth
  }
})