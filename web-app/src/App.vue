<template>
  <div class="app-container">
    <div v-if="!authStore.isInitialized" class="loader">
      <div class="spinner"></div>
    </div>
    
    <template v-else>
      <!-- Мобильный хедер -->
      <MobileHeader 
        v-if="isMobile && showSidebar" 
        @toggle-sidebar="showMobileSidebar = !showMobileSidebar"
      />
      
      <!-- Десктопный сайдбар -->
      <DesktopSidebar 
        v-if="(isTablet || isDesktop) && showSidebar"
      />
      
      <!-- Мобильный сайдбар -->
      <MobileSidebar 
        v-if="isMobile && showSidebar"
        :is-open="showMobileSidebar"
        @close="showMobileSidebar = false"
      />
      
      <div :class="[
        'main-content',
        { 
          'with-desktop-sidebar': (isTablet || isDesktop) && showSidebar,
          'with-mobile-sidebar': isMobile && showMobileSidebar,
          'mobile-layout': isMobile,
          'tablet-layout': isTablet
        }
      ]">
        <!-- Header для планшетов и десктопа -->
        <header v-if="(isTablet || isDesktop) && showSidebar" class="main-header">
          <NotificationCenter />
        </header>
        
        <!-- Overlay для мобильного сайдбара -->
        <div 
          v-if="isMobile && showMobileSidebar" 
          class="mobile-overlay"
          @click="showMobileSidebar = false"
        ></div>
        
        <main class="main-content-area">
          <RouterView />
        </main>
        
        <!-- Мобильная нижняя навигация -->
        <MobileNavBar v-if="isMobile && showSidebar" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useNotifications } from './composables/useNotifications'
import { useDeviceDetection } from './composables/useDeviceDetection'
import DesktopSidebar from './components/common/DesktopSidebar.vue'
import MobileSidebar from './components/common/MobileSidebar.vue'
import NotificationCenter from './components/common/NotificationCenter.vue'
import MobileHeader from './components/common/MobileHeader.vue'
import MobileNavBar from './components/common/MobileNavBar.vue'

const authStore = useAuthStore()
const { isMobile, isTablet, isDesktop } = useDeviceDetection()
const showMobileSidebar = ref(false)

const { initializeNotifications } = useNotifications()

const showSidebar = computed(() => {
  return authStore.isAuthenticated
})

watch(() => authStore.isAuthenticated, () => {
  showMobileSidebar.value = false
  if (authStore.isAuthenticated) {
    console.log('connecting WebSocket')
    // initializeNotifications();
  } else {
    console.log('logging error')
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f9fafb;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

/* Десктопный сайдбар */
.with-desktop-sidebar {
  margin-left: 16rem;
}

/* Мобильный сайдбар */
.with-mobile-sidebar {
  transform: translateX(16rem);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

.main-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 4rem;
}

.main-content-area {
  flex: 1;
  padding: 1rem;
}

/* Mobile First стили */
.mobile-layout .main-content-area {
  padding: 0.75rem;
}

.tablet-layout .main-content-area {
  padding: 1.25rem;
}

/* Планшет */
@media (min-width: 768px) {
  .main-content-area {
    padding: 1.5rem;
  }
}

/* Десктоп */
@media (min-width: 1024px) {
  .main-content-area {
    padding: 2rem;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.main-content.mobile-layout .main-content-area {
  padding: 0.75rem;
  padding-bottom: 5rem; 
}
.main-content.mobile-layout .main-content-area.has-floating-button {
  padding-bottom: 7rem;
}
</style>