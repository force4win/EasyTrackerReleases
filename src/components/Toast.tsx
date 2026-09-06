import { useState, useEffect } from 'react'

export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
}

let toastListener: ((toast: ToastMessage) => void) | null = null

export function showToast(type: ToastMessage['type'], title: string, message?: string) {
  const id = Math.random().toString(36).substring(2, 9)
  if (toastListener) {
    toastListener({ id, type, title, message })
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListener = (newToast: ToastMessage) => {
      setToasts(prev => [...prev, newToast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id))
      }, 4000)
    }

    return () => {
      toastListener = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-slate-800 border-slate-700 text-white'
        let icon = 'ℹ️'
        if (toast.type === 'success') {
          bg = 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
          icon = '✅'
        }
        if (toast.type === 'warning') {
          bg = 'bg-amber-950/90 border-amber-500 text-amber-100'
          icon = '⚠️'
        }
        if (toast.type === 'error') {
          bg = 'bg-red-950/90 border-red-500 text-red-100'
          icon = '❌'
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom duration-300 ${bg}`}
          >
            <span className="text-xl">{icon}</span>
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-snug">{toast.title}</h4>
              {toast.message && <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
