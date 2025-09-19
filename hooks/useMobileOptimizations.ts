import { useEffect, useState } from 'react'

export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const mobile = width < 768
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setIsMobile(mobile)
      setIsTouchDevice(touch)
      setScreenSize({ width, height })

      // Añadir clases CSS para optimizaciones móviles
      if (mobile) {
        document.body.classList.add('mobile-device')
      } else {
        document.body.classList.remove('mobile-device')
      }

      if (touch) {
        document.body.classList.add('touch-device')
      } else {
        document.body.classList.remove('touch-device')
      }
    }

    // Verificar al cargar
    checkDevice()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  // Función para prevenir zoom en inputs
  const preventZoom = (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (isMobile) {
      element.style.fontSize = '16px'
    }
  }

  // Función para optimizar el scroll
  const optimizeScroll = (element: HTMLElement) => {
    if (isMobile) {
      element.style.webkitOverflowScrolling = 'touch'
    }
  }

  // Función para mejorar la accesibilidad táctil
  const enhanceTouchTarget = (element: HTMLElement) => {
    if (isTouchDevice) {
      element.style.minHeight = '44px'
      element.style.minWidth = '44px'
    }
  }

  // Función para detectar gestos de swipe
  const addSwipeDetection = (
    element: HTMLElement,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    if (!isTouchDevice) return

    let startX = 0
    let startY = 0
    let endX = 0
    let endY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX
      endY = e.changedTouches[0].clientY

      const deltaX = endX - startX
      const deltaY = endY - startY
      const minSwipeDistance = 50

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe horizontal
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        }
      } else {
        // Swipe vertical
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // Función para pull-to-refresh
  const addPullToRefresh = (
    element: HTMLElement,
    onRefresh: () => void,
    threshold: number = 80
  ) => {
    if (!isTouchDevice) return

    let startY = 0
    let currentY = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      currentY = e.touches[0].clientY
      const pullDistance = currentY - startY

      if (pullDistance > 0) {
        e.preventDefault()
        element.style.transform = `translateY(${Math.min(pullDistance * 0.5, threshold)}px)`
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling) return

      const pullDistance = currentY - startY
      isPulling = false

      if (pullDistance > threshold) {
        onRefresh()
      }

      element.style.transform = 'translateY(0)'
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // Función para vibrar (si está disponible)
  const vibrate = (pattern: number | number[] = 50) => {
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  // Función para detectar la orientación
  const getOrientation = () => {
    if (screenSize.width > screenSize.height) {
      return 'landscape'
    }
    return 'portrait'
  }

  // Función para optimizar imágenes para móvil
  const optimizeImageForMobile = (imageUrl: string, width?: number) => {
    if (isMobile && width) {
      // Aquí podrías integrar con un servicio de optimización de imágenes
      return `${imageUrl}?w=${width}&q=80&f=webp`
    }
    return imageUrl
  }

  // Función para manejar el teclado virtual
  const handleVirtualKeyboard = (callback: (isOpen: boolean) => void) => {
    if (!isMobile) return

    const initialHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDifference = initialHeight - currentHeight
      
      // Si la diferencia es significativa, probablemente el teclado esté abierto
      callback(heightDifference > 150)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }

  return {
    isMobile,
    isTouchDevice,
    screenSize,
    preventZoom,
    optimizeScroll,
    enhanceTouchTarget,
    addSwipeDetection,
    addPullToRefresh,
    vibrate,
    getOrientation,
    optimizeImageForMobile,
    handleVirtualKeyboard
  }
}
