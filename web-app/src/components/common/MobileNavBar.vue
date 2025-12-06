<!-- components/common/MobileNavBar.vue -->
<template>
  <nav class="mobile-nav-bar">
    <router-link
      v-for="link in navigationLinks"
      :key="link.to"
      :to="link.to"
      class="nav-item"
      :class="{ 'active': $route.name === link.routeName }"
    >
      <span class="nav-label">{{ link.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navigationLinks = [
  { 
    to: '/', 
    routeName: 'Dashboard',
    label: 'Панель управления',
  },
  { 
    to: '/kanban-boards', 
    routeName: 'KanbanBoards',
    label: 'Kanban',
  },
  { 
    to: '/scrum-boards', 
    routeName: 'ScrumBoards',
    label: 'Scrum',
  }
]
</script>

<style scoped>
.mobile-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  padding: 0.5rem;
  z-index: 40;
  height: 4rem;
  box-sizing: border-box;
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  text-decoration: none;
  color: #6b7280;
  border-radius: 0.5rem;
  transition: all 0.2s;
  min-height: 3rem;
}

.nav-item.active {
  color: #3b82f6;
  background: #eff6ff;
}

.nav-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Для очень маленьких экранов */
@media (max-width: 380px) {
  .mobile-nav-bar {
    height: 3.5rem;
    padding: 0.25rem;
  }
  
  .nav-item {
    padding: 0.25rem;
  }
  
  .nav-icon {
    font-size: 1.125rem;
    margin-bottom: 0.125rem;
  }
  
  .nav-label {
    font-size: 0.625rem;
  }
}
</style>