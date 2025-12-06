<template>
  <div class="user-menu">
    <div class="user-info">
      <div class="avatar">
        {{ userInitials }}
      </div>
      <div class="user-details">
        <p class="user-name">{{ authStore.user?.name }}</p>
        <p class="user-email">{{ authStore.user?.email }}</p>
      </div>
      <button
        @click="handleLogout"
        class="logout-btn"
        title="Logout"
      >
        <span class="logout-text">Выйти</span>
        <span class="logout-arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-menu {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: block;
  visibility: visible;
  opacity: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: none;
  color: white;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
  transform: translateY(-1px);
}

.logout-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.logout-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.logout-arrow {
  font-size: 1rem;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.logout-btn:hover .logout-arrow {
  transform: translateX(2px);
}

/* Для мобильных */
@media (max-width: 768px) {
  .user-menu {
    display: block;
    visibility: visible;
    opacity: 1;
  }
}
</style>