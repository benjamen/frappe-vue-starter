// src/composables/toast.js
// Simple toast implementation using browser alerts for now
// You can replace this with a proper toast library later

export function useToast() {
  const success = (message) => {
    // For now, use alert. You can replace with proper toast later
    alert(`✅ ${message}`)
    console.log(`[Toast Success] ${message}`)
  }

  const error = (message) => {
    alert(`❌ ${message}`)
    console.error(`[Toast Error] ${message}`)
  }

  const info = (message) => {
    alert(`ℹ️ ${message}`)
    console.info(`[Toast Info] ${message}`)
  }

  const warning = (message) => {
    alert(`⚠️ ${message}`)
    console.warn(`[Toast Warning] ${message}`)
  }

  return {
    success,
    error,
    info,
    warning
  }
}
