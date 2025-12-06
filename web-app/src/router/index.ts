import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.ts'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginForm.vue'),
    meta: { requiresAuth: false, requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterForm.vue'),
    meta: { requiresAuth: false, requiresGuest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/kanban/:boardId?',
    name: 'Kanban',
    component: () => import('../views/KanbanView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scrum/:boardId?',
    name: 'Scrum',
    component: () => import('../views/ScrumView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/kanban-boards',
    name: 'KanbanBoards',
    component: () => import('../views/KanbanBoardsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scrum-boards',
    name: 'ScrumBoards',
    component: () => import('../views/ScrumBoardsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  


  // Если auth еще не инициализирован, инициализируем
  if (!authStore.isInitialized) {
    await authStore.initializeAuth()
  }

  // Если маршрут требует аутентификации, но пользователь не аутентифицирован
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Если токен есть, но пользователь еще загружается - ждем
    if (authStore.token && authStore.isLoading) {
      try {
        await authStore.fetchProfile()
        next() // Пользователь загружен, продолжаем
      } catch {
        next('/login') // Ошибка загрузки, перенаправляем на логин
      }
    } else {
      next('/login') // Нет токена, перенаправляем на логин
    }
  } 
  // Если маршрут требует гостя (логин/регистрация), но пользователь аутентифицирован
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/') // Перенаправляем на главную
  } 
  // Во всех остальных случаях продолжаем
  else {
    next()
  }
})


export default router