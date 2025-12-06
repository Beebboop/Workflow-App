import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'
import type { Notification } from '../../types/src'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)

  async function fetchNotifications() {
    try {
      const response = await api.get<Notification[]>('/notifications')
      console.log('API: Before setting notifications, current length:', notifications.value.length)
      notifications.value = response.data
      unreadCountFunc()
      console.log('API Fetch: Уведомления загружены data:', response.data)
      console.log('API Fetch: Уведомления загружены data values:', response.data.values)
      console.log('API Fetch: Уведомления загружены:', response.data.length)
      console.log('API Store updated notifications:', notifications.value.length)
      return response.data
    } catch (error) {
      console.error('API Fetch Failed(fetchNotifications):', error)
      throw error
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw error
    }
  }

  async function unreadCountFunc() {
    try{
      unreadCount.value = notifications.value.filter(n => !n.read).length
    } catch (error){
      console.log(error)
    }
  }

  async function markAllAsRead() {
    try {
      console.log(`Marking all notifications as read via API...`);
      
      await api.put('/notifications/read-all');
      
      // Обновляем локальное состояние
      notifications.value.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
        }
      });
      unreadCount.value = 0;
      
      console.log(`All notifications marked as read locally`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  function addNotification(notification: Notification) {
    notifications.value.unshift(notification)
    if (!notification.read) {
      unreadCount.value++
    }
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    unreadCountFunc
  }
})