import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { BrowserRouter } from 'react-router-dom'

const DEV_SW_RESET_KEY = '__dev_sw_reset_done__'

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}

const clearDevServiceWorkerState = async () => {
  if (import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return false
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) {
    sessionStorage.removeItem(DEV_SW_RESET_KEY)
    return false
  }

  await Promise.all(
    registrations.map((registration) =>
      registration.unregister().catch(() => false),
    ),
  )

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)))
  }

  // If a stale worker still controls this tab, reload once after cleanup.
  if (navigator.serviceWorker.controller && !sessionStorage.getItem(DEV_SW_RESET_KEY)) {
    sessionStorage.setItem(DEV_SW_RESET_KEY, '1')
    window.location.reload()
    return true
  }

  sessionStorage.removeItem(DEV_SW_RESET_KEY)
  return false
}

const bootstrap = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    })
  } else {
    try {
      const reloadingForCleanup = await clearDevServiceWorkerState()
      if (reloadingForCleanup) {
        return
      }
    } catch (err) {
      console.warn('Failed to clear development service workers:', err)
    }
  }

  renderApp()
}

void bootstrap()
