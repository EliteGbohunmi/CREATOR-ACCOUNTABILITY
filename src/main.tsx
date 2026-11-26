import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { setupGlobalErrorHandler } from './lib/errorHandler'
import './global.css'
import './styles/premium.css'

setupGlobalErrorHandler()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1C1C1C',
            color: '#F0EDE8',
            border: '1px solid #2A2A2A'
          },
          duration: 4000
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>
)

// Register service worker for PWA install prompt + push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })
  })
}
