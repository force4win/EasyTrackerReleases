import { useState, useEffect } from 'react'

interface ReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
}

export function ReleaseModal({ isOpen, onClose, onSave }: ReleaseModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setName('')
    setError(null)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del release es obligatorio')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSave(name.trim())
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al crear el release')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-surface)] border border-[var(--color-primary)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-primary)] flex justify-between items-center bg-[var(--color-primary)]/30">
          <h3 className="text-lg font-semibold text-white">Crear Nuevo Release</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-white text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--color-error)]/20 border border-[var(--color-error)] text-[var(--color-error)] text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Nombre del Release
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Melissa 2,1"
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-primary)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)]"
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-primary)]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-white/5 text-[var(--color-text-muted)] hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Creando...' : 'Crear Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
