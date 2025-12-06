import { ref, onMounted, onUnmounted } from 'vue'

export function useDeviceDetection() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)

  // Брейкпоинты 
  const breakpoints = {
    mobile: 768,    // < 768px - мобильные
    tablet: 1024,   // 768px - 1024px - планшеты
    desktop: 1025   // > 1024px - десктоп
  }

  function checkDeviceType() {
    const width = window.innerWidth
    
    isMobile.value = width < breakpoints.mobile
    isTablet.value = width >= breakpoints.mobile && width < breakpoints.tablet
    isDesktop.value = width >= breakpoints.desktop
    
    console.log('Device detection:', { 
      width, 
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      isDesktop: isDesktop.value 
    })
  }

  onMounted(() => {
    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkDeviceType)
  })

  return {
    isMobile,
    isTablet,
    isDesktop
  }
}