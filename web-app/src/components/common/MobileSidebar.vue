<template>
  <aside :class="['mobile-sidebar', { 'open': isOpen }]">
    <div class="sidebar-content">
      <!-- Logo и кнопка закрытия -->
      <div class="logo">
        <h1>Workflow App</h1>
        <button @click="closeSidebar" class="close-sidebar">
          ×
        </button>
      </div>

      <!-- User Menu -->
      <UserMenu class="user-menu-section" />

      <!-- Navigation -->
      <nav class="navigation">
        <router-link
          v-for="link in navigationLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'active': isActive(link.routeName) }"
          @click="handleNavClick"
        >
          <span class="nav-text">{{ link.text }}</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import UserMenu from './UserMenu.vue'

const route = useRoute()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const navigationLinks = computed(() => [
  { 
    to: '/', 
    routeName: 'Dashboard',
    text: 'Панель управления',
  },
  { 
    to: '/kanban-boards', 
    routeName: 'KanbanBoards',
    text: 'Kanban доски',
  },
  { 
    to: '/scrum-boards', 
    routeName: 'ScrumBoards',
    text: 'Scrum доски', 
  }
])

function isActive(routeName: string) {
  return route.name === routeName
}

function closeSidebar() {
  emit('close')
}

function handleNavClick() {
  closeSidebar()
}
</script>

<style scoped>
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 100;
  height: 100vh;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
  padding: 0 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo h1 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.close-sidebar {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
}

.user-menu-section {
  border-bottom: 1px solid #e5e7eb;
}

.navigation {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 1.25rem 1rem;
  color: #374151;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
  gap: 0.75rem;
  min-height: 56px;
}

.nav-link:hover {
  background: #f3f4f6;
}

.nav-link.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-text {
  font-size: 1.125rem;
  font-weight: 500;
}
</style>