// Stores
import { createPinia } from 'pinia'

export default createPinia()

// Re-export stores for convenience
export { useAppStore } from './app'
export { useAuthStore } from './auth'
export { usePropertyStore } from './property'
export { useMerchantStore } from './merchant'
