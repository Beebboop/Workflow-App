<template>
  <aside class="desktop-sidebar">
    <div class="sidebar-content">
      <!-- Logo -->
      <div class="logo">
        <h1>Workflow App</h1>
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
</script>

<style scoped>
.desktop-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 16rem;
  background: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 50;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.75rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
  padding: 0 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.user-menu-section {
  border-bottom: 1px solid #e5e7eb;
}

.navigation {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.nav-text {
  font-size: 1rem;
  font-weight: 500;
}
</style>