<template>
  <div class="notification-center">
    <!-- Notification Bell -->
    <button
      @click="toggleNotifications"
      class="notification-bell"
      :class="{ 
        'disconnected': !isWebSocketConnected,
        'mobile': isMobile 
      }"
    >
      <svg class="bell-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="notification-badge"
        :class="{ 'mobile-badge': isMobile }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Notifications Panel -->
    <div
      v-if="showNotifications"
      class="notifications-panel"
      :class="{ 'mobile-panel': isMobile }"
    >
      <div class="panel-header">
        <div class="flex justify-between items-center">
          <h3 class="panel-title">Уведомления</h3>
          <div class="flex items-center gap-2">
            <div 
              class="connection-indicator" 
              :class="{ connected: isWebSocketConnected }"
              :title="isWebSocketConnected ? 'Соединение установлено' : 'Соединение отсутствует'"
            ></div>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="mark-all-btn"
              :disabled="isLoading"
            >
              {{ isLoading ? '...' : (isMobile ? 'Отметить все' : 'Отметить все как прочитанные') }}
            </button>
            <button 
              v-if="isMobile"
              @click="showNotifications = false"
              class="close-panel-btn"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div v-if="notifications.length === 0" class="empty-notifications">
        Уведомления отсутствуют
      </div>

      <div v-else class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'notification-item',
            { 'unread': !notification.read }
          ]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-header">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <span class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </span>
          </div>
          <p class="notification-message">{{ notification.message }}</p>
          <div class="notification-footer">
            <span
              :class="[
                'notification-type',
                getNotificationTypeClass(notification.type)
              ]"
            >
              {{ isMobile ? getShortType(notification.type) : notification.type }}
            </span>
            <span
              v-if="!notification.read"
              class="unread-dot"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobile && showNotifications" 
      class="mobile-overlay"
      @click="showNotifications = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useNotifications } from '../../composables/useNotifications'
import { useDeviceDetection } from '../../composables/useDeviceDetection'

const { isMobile } = useDeviceDetection()
const showNotifications = ref(false)
const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, isWebSocketConnected } = useNotifications()

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function handleNotificationClick(notification: any) {
  markAsRead(notification.id)
  if (isMobile) {
    showNotifications.value = false
  }
}

function getNotificationTypeClass(type: string) {
  const classes: { [key: string]: string } = {
    task_assigned: 'type-assigned',
    task_updated: 'type-updated',
    comment_added: 'type-comment',
    sprint_started: 'type-sprint',
    deadline_approaching: 'type-deadline'
  }
  return classes[type] || 'type-default'
}

function getShortType(type: string): string {
  const shortTypes: { [key: string]: string } = {
    task_assigned: 'Assigned',
    task_updated: 'Updated',
    comment_added: 'Comment',
    sprint_started: 'Sprint',
    deadline_approaching: 'Deadline'
  }
  return shortTypes[type] || type
}


function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
/* Mobile First стили */
.notification-center {
  position: relative;
}

.notification-bell {
  position: relative;
  padding: 0.5rem;
  color: #6b7280;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-bell.mobile {
  padding: 0.75rem;
  border: none;
  background: transparent;
}

.notification-bell:hover:not(.mobile) {
  color: #374151;
  background: #f9fafb;
  border-color: #d1d5db;
}

.bell-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-bell.mobile .bell-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.notification-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge.mobile-badge {
  top: 0.5rem;
  right: 0.5rem;
  width: 1.125rem;
  height: 1.125rem;
  font-size: 0.625rem;
}

.notification-bell.disconnected {
  opacity: 0.7;
  border-color: #ef4444;
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  max-height: 24rem;
  overflow-y: auto;
  z-index: 50;
}

.notifications-panel.mobile-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0;
  border-radius: 0;
  max-height: none;
  z-index: 60;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
  border-radius: 0.75rem 0.75rem 0 0;
}

.notifications-panel.mobile-panel .panel-header {
  border-radius: 0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.mark-all-btn {
  font-size: 0.875rem;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.mark-all-btn:hover {
  background: #eff6ff;
}

.close-panel-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
}

.empty-notifications {
  padding: 2rem 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.notifications-list {
  padding: 0.5rem;
}

.notification-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 0.25rem;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-item.unread:hover {
  background: #e0f2fe;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
  flex: 1;
}

.notification-time {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.notification-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.notification-type {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  white-space: nowrap;
}

.type-assigned { background: #dbeafe; color: #1e40af; }
.type-updated { background: #fef3c7; color: #92400e; }
.type-comment { background: #d1fae5; color: #065f46; }
.type-sprint { background: #e9d5ff; color: #6b21a8; }
.type-deadline { background: #fecaca; color: #991b1b; }
.type-default { background: #f3f4f6; color: #374151; }

.unread-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 55;
}

.connection-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-indicator.connected {
  background: #10b981;
}

/* Планшет */
@media (min-width: 768px) {
  .notifications-panel {
    width: 20rem;
  }
  
  .notification-bell.mobile {
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    background: white;
  }
  
  .notification-bell.mobile .bell-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .notification-badge.mobile-badge {
    top: -0.25rem;
    right: -0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.75rem;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .notifications-panel {
    width: 24rem;
  }
}
</style>