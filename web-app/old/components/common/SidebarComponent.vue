<template>
  <aside :class="['sidebar', 
  { 'mobile-sidebar': isMobile, 'open': showMobileSidebar }]">
    <div class="sidebar-content">
      <!-- Logo -->
      <div class="logo">
        <h1>Workflow App</h1>
        <button v-if="isMobile" @click="closeSidebar" class="close-sidebar">
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
import { useDeviceDetection } from '../../../src/composables/useDeviceDetection'
import UserMenu from './UserMenu.vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = useRoute()
const { isMobile } = useDeviceDetection()

defineProps<{
  showMobileSidebar?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const navigationLinks = computed(() => [
  { 
    to: '/', 
    routeName: 'Dashboard',
    text: 'Dashboard',
  },
  { 
    to: '/kanban-boards', 
    routeName: 'KanbanBoards',
    text: 'Kanban Boards',
  },
  { 
    to: '/scrum-boards', 
    routeName: 'ScrumBoards',
    text: 'Scrum Boards', 
  }
])

function isActive(routeName: string) {
  return route.name === routeName
}

function closeSidebar() {
  emit('close')
}

function handleNavClick() {
  if (isMobile) {
    closeSidebar()
  }
}
</script>

<style scoped>
/* Mobile First стили */
.sidebar {
  background: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 50;
  height: 100vh;
  overflow-y: auto;
}

/* Мобильная версия */
.sidebar.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 100;
}

.sidebar.mobile-sidebar.open {
  transform: translateX(0);
}

/* Десктоп версия */
.sidebar:not(.mobile-sidebar) {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 16rem;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem;
  width: 100%;
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
  display: block;
}

.navigation {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: #374151;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
  gap: 0.75rem;
}

.nav-link:hover {
  background: #f3f4f6;
}

.nav-link.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
}

.nav-text {
  font-size: 1rem;
  font-weight: 500;
}

/* Планшет */
@media (min-width: 768px) {
  .sidebar-content {
    padding: 0.75rem;
  }
  
  .logo {
    height: 4rem;
  }
  
  .logo h1 {
    font-size: 1.25rem;
  }
  
  .navigation {
    padding: 1rem;
    gap: 0.5rem;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .nav-text {
    font-size: 1rem;
  }
}
/* Для мобильных */
@media (max-width: 768px) {
  .nav-link {
    padding: 1.25rem 1rem;
    min-height: 56px; /* Минимальная высота для touch */
  }
  
  .nav-text {
    font-size: 1.125rem;
  }

  .user-menu-section {
    display: block;
    opacity: 1;
    visibility: visible;
  }
}
</style>