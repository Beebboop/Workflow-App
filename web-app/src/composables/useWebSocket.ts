import { ref, onUnmounted, watch, onMounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useNotificationStore } from '../stores/notification'
import type { Notification } from '../../types/src/notification'
import { useMobileApi } from './useMobileApi'

export function useWebSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const notificationStore = useNotificationStore()
  const mobileApi = useMobileApi()
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const isInitialDataLoaded = ref(false)

  function connect() {
    const token = localStorage.getItem('auth_token')
    console.log('token: ' + token)

    if (!token) {
      console.log('No auth token, skipping WebSocket connection')
      return
    }
    try {
      // Отключаем предыдущее соединение если есть
      if (socket.value) {
        socket.value.disconnect()
        socket.value = null
        isConnected.value = false
      }
      console.log('socket.value before: ')
      console.log(socket.value)
      console.log('WS URL from env:', import.meta.env.VITE_WS_URL)
      console.log('Token available:', !!token)
      const socket_url = mobileApi.getWebSocketUrl()

      socket.value = io(socket_url || 'ws://localhost:3003' , { 
        auth: { token },
        path: '/socket.io/', // путь по умолчанию для Socket.IO
        transports: ['websocket','polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        upgrade: true
      })

      console.log('socket.value after: ')
      console.log(socket.value)

      socket.value.on('connect', () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected successfully!')
        console.log('socket.value.on(connect  isConnected.value' + isConnected.value)
        console.log('Socket ID:', socket.value?.id)
      })

      socket.value.on('connecting', () => {
        console.log('WebSocket connecting...')
      })

      socket.value.on('notifications-full', () => {
        console.log('WS: Before setting notifications, current length:', notificationStore.notifications.length)
        notificationStore.fetchNotifications()
        notificationStore.unreadCountFunc()
        isInitialDataLoaded.value = true
        console.log('Received full notifications from WS:', notificationStore.unreadCount)
      })

      socket.value.on('connect_error', (err) => {
        console.error('WebSocket connection error:')
        console.error('Error message:', err.message)
        isConnected.value = false
      })

      socket.value.on('disconnect', (reason) => {
        isConnected.value = false
        console.log('WebSocket disconnected. Reason:', reason)
      })      

      socket.value.on('reconnect_attempt', (attempt) => {
        console.log(`WebSocket reconnect attempt: ${attempt}`)
      })

      socket.value.on('reconnect', (attempt) => {
        console.log(`WebSocket reconnected after ${attempt} attempts`)
        isConnected.value = true
        reconnectAttempts.value = 0
      })

      socket.value.on('reconnect_error', (error) => {
        console.error('WebSocket reconnect error:', error)
      })

      socket.value.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after all attempts')
      })


      socket.value.on('error', (error) => { 
        console.error('WebSocket error:', error)
      })

      socket.value.on('notification', (notification: Notification) => {
        notificationStore.addNotification(notification)
        console.log('Received notification:', notification) 
      })

      socket.value.on('unread-count-updated', (data: { unreadCount: number }) => {
        console.log('Unread count updated:', data.unreadCount)
        notificationStore.unreadCount = data.unreadCount;
      })

      socket.value.on('notification-read', async (data: { success: boolean; notificationId?: string; error?: string }) => {
        if (data.success && data.notificationId) {
          console.log('WebSocket: Notification marked as read:', data.notificationId)
          
          // Дублируем обновление через API для надежности
          try {
            await notificationStore.markAsRead(data.notificationId)
          } catch (error) {
            console.error('Failed to sync read status with API:', error)
          }
        } else {
          console.error('WebSocket: Failed to mark notification as read:', data.error)
        }
      })

      socket.value.on('all-notifications-read', async (data: { success: boolean; error?: string }) => {
        if (data.success) {
          console.log('WebSocket: All notifications marked as read')
          
          // Дублируем обновление через API для надежности
          try {
            await notificationStore.markAllAsRead()
          } catch (error) {
            console.error('Failed to sync all read status with API:', error)
          }
        } else {
          console.error('WebSocket: Failed to mark all notifications as read:', data.error)
        }
      })

      socket.value.on('task_updated', (task: any) => {
        console.log('Task updated:', task)
      })

      socket.value.on('new-notification', (notification: Notification) => {
        console.log('Received new real-time notification:', notification);
        // Добавляем новое уведомление в хранилище
        notificationStore.addNotification(notification);
      });

      socket.value.on('notifications-updated', () => {
        console.log('Notifications updated via WebSocket - refreshing list');
        // Обновляем весь список уведомлений
        notificationStore.fetchNotifications();
      });

    } catch(error){
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  function disconnect() {
    console.log('useWebSocket disconnect func')
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  

  // Методы для взаимодействия с WebSocket
  function markNotificationAsRead(notificationId: string) {
    if (socket.value && isConnected.value) {
      socket.value.emit('mark-notification-read', { notificationId });
    }
  }

  function markAllNotificationsAsRead() {
    if (socket.value && isConnected.value) {
      socket.value.emit('mark-all-notifications-read');
    }
  }

  function getUnreadCount() {
    if (socket.value && isConnected.value) {
      socket.value.emit('get-unread-count');
    }
  }

  onMounted(() => {
    console.log('useWebSocket mounted')
  })

  onUnmounted(() => {
    console.log('useWebSocket Unmounted')
  })

  return {
    socket,
    isConnected,
    isInitialDataLoaded,
    connect,
    disconnect,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount
  }
}