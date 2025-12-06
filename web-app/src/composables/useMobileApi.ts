// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'

export function useMobileApi() {
  const isNative = computed(() => Capacitor.isNativePlatform())
  
  const getApiBaseUrl = () => {
    if (Capacitor.isNativePlatform()) {
      // Для Android эмулятора
      if (Capacitor.getPlatform() === 'android') {
        return import.meta.env.VITE_MOBILE_API_URL || 'http://10.0.2.2:3000'
      }
      // Для iOS симулятора
      return import.meta.env.VITE_MOBILE_API_URL || 'http://localhost:3000'
    }
    // Для веб-версии
    return import.meta.env.VITE_API_URL || '/api'
  }

  const getWebSocketUrl = () => {
    if (Capacitor.isNativePlatform()) {
        console.log('Capacitor platform: '+Capacitor.getPlatform)
      // WebSocket через API Gateway для мобильных
      if (Capacitor.getPlatform() === 'android') {
        return import.meta.env.VITE_MOBILE_WS_URL?.replace('http', 'ws') || 'ws://10.0.2.2:3003'
      }
      return import.meta.env.VITE_MOBILE_WS_URL?.replace('http', 'ws') || 'ws://localhost:3003'
    }
    // Для веб-версии
    
    return import.meta.env.VITE_WS_URL?.replace('http', 'ws') || 'ws://localhost:3003'
  }
  
  const checkNetworkStatus = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Network.getStatus()
        return status.connected
      } catch (error) {
        console.error('Network status check failed:', error)
        return false
      }
    }
    return navigator.onLine
  }

  const getPlatform = () => {
    return Capacitor.getPlatform()
  }

  return {
    isNative,
    getApiBaseUrl,
    getWebSocketUrl,
    checkNetworkStatus,
    getPlatform
  }
}