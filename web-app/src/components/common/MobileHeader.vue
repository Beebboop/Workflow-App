<!-- components/common/MobileHeader.vue -->
<template>
  <header class="mobile-header">
    <button @click="toggleSidebar" class="menu-toggle">
      ☰
    </button>
    <div class="logo">
      <h1>Workflow</h1>
    </div>
    <div class="header-actions">
      <NotificationCenter />
    </div>
  </header>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'
import NotificationCenter from './NotificationCenter.vue'

const emit = defineEmits<{
  toggleSidebar: []
}>()

function toggleSidebar() {
  emit('toggleSidebar')
}
</script>

<style scoped>
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.menu-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #374151;
  cursor: pointer;
  padding: 0.5rem;
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-menu-section {
  border-bottom: 1px solid #e5e7eb;
  display: block;
  opacity: 1;
  visibility: visible;
}
</style>