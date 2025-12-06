import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { useMobileApi } from '../composables/useMobileApi'

const { getApiBaseUrl } = useMobileApi()

const api = axios.create({
  baseURL: Capacitor.isNativePlatform() ? getApiBaseUrl() : '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      console.log('error status: 401, BAD_TOKEN')
      // Для мобильных используем Capacitor для навигации
      // if (Capacitor.isNativePlatform()) {
      //   import('@capacitor/app').then(({ App }) => {
      //     App.removeAllListeners()
      //   })
      // } else {
      //   //window.location.href = '/login'
      // }
    }
    return Promise.reject(error)
  }
)

export default api