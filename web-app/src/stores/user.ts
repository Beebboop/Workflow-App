import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../utils/api'
import type { User } from '../../types/src'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const usersMap = ref<Map<string, User>>(new Map())
  const isLoading = ref(false)

  // Получение всех пользователей
  async function fetchUsers(): Promise<User[]> {
    try {
      isLoading.value = true
      const response = await api.get<User[]>('/users')
      users.value = response.data
      
      // Заполняем карту для быстрого доступа
      usersMap.value.clear()
      response.data.forEach(user => {
        usersMap.value.set(user.id, user)
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to fetch users:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Получение пользователя по ID
  function getUserById(userId: string): User | undefined {
    return usersMap.value.get(userId)
  }

  // Получение имени пользователя
  function getUserName(userId: string): string {
    const user = getUserById(userId)
    return user ? user.name : `User ${userId.substring(0, 8)}...`
  }

  // Получение email пользователя
  function getUserEmail(userId: string): string {
    const user = getUserById(userId)
    return user ? user.email : 'unknown@mail.com'
  }

  // Предзагрузка пользователей
  async function preloadUsers(userIds: string[]): Promise<void> {
    const missingIds = userIds.filter(id => !usersMap.value.has(id) && id)
    
    if (missingIds.length > 0) {
      // Если есть отсутствующие пользователи, загружаем всех
      await fetchUsers()
    }
  }

  return {
    users: computed(() => users.value),
    usersMap: computed(() => usersMap.value),
    isLoading: computed(() => isLoading.value),
    fetchUsers,
    getUserById,
    getUserName,
    getUserEmail,
    preloadUsers
  }
})