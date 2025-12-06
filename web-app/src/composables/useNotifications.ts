import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNotificationStore } from '../stores/notification'
import { useWebSocket } from './useWebSocket'

export function useNotifications() {
  const notificationStore = useNotificationStore()
  const { 
    connect,
    disconnect,
    isConnected,
    markNotificationAsRead: wsMarkAsRead,
    markAllNotificationsAsRead: wsMarkAllAsRead,
    isInitialDataLoaded
  } = useWebSocket()

  const isLoading = ref(false)
  const isInitialized = ref(false)
  
  // Computed свойства для реактивного доступа к данным
  const notifications = computed(() => notificationStore.notifications)
  const unreadCount = computed(() => notificationStore.unreadCount)
  const isWebSocketConnected = computed(() => isConnected.value)
  
  console.log('isWebSocketConnected computed:', isWebSocketConnected.value)

  const markAsRead = async (notificationId: string) => {
    try {
      isLoading.value = true

      // Используем API для отметки как прочитанного
      await notificationStore.markAsRead(notificationId)
      
      // Дополнительно отправляем через WebSocket если подключены
      if (isConnected.value) {
        wsMarkAsRead(notificationId)
      }
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const markAllAsRead = async () => {
    try {
      isLoading.value = true
      
      // Используем API для отметки всех как прочитанных
      await notificationStore.markAllAsRead()
      
      // Дополнительно отправляем через WebSocket если подключены
      if (isConnected.value) {
        wsMarkAllAsRead()
      }
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshNotifications = async () => {
    try {
      isLoading.value = true
      await notificationStore.fetchNotifications()
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to refresh notifications:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const initializeNotifications = async () => {
    console.log('initializeNotifications entering')
    try {
      console.log('Initializing notifications...')
      
      // Загружаем начальные уведомления через fetchNotifications()
      await refreshNotifications()
      
      // Подключаем WebSocket для real-time обновлений
      connect()
      
      console.log('Notifications initialized successfully')
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  onMounted(async () => {
    console.log('useNotifications refreshed')
    // Инициализируем уведомления при монтировании
    await initializeNotifications()
  })

  onUnmounted(() => {
    console.log('useNotifications refreshed onUnmounted')
    disconnect()
  })

  watch(notifications, (newNotifications) => {
    console.log('Notifications list updated:', newNotifications.length, 'items');
  }, { deep: true });

  watch(unreadCount, (newCount) => {
    console.log('Unread count updated:', newCount);
  });

  return {
    notifications,
    unreadCount,
    isLoading: computed(() => isLoading.value),
    isWebSocketConnected,
    isInitialized: computed(() => isInitialized.value),
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    initializeNotifications
  }
}