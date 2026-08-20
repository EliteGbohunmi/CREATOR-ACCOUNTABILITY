import toast from 'react-hot-toast'

export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    console.error('Unhandled rejection:', error)
    toast.error(error?.message || 'Network error. Please check your connection.')
  })
}
