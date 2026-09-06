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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="w-full max-w-lg fa-glass-window overflow-hidden flex flex-col border border-fuchsia-400/50 shadow-2xl">
        {/* Header Especular Frutiger Aero con padding amplio */}
        <div className="px-8 py-5 fa-glass-header flex justify-between items-center text-white">
          <h3 className="text-xl font-extrabold tracking-wide fa-text-shadow flex items-center gap-3">
            <span>🚀</span> Crear Nuevo Release
          </h3>
          <button
            onClick={onClose}
            className="text-cyan-200 hover:text-white text-2xl font-bold cursor-pointer transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#0a1c2e]/95">
          {error && (
            <div className="p-4 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-2xl shadow-inner">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-2 uppercase tracking-wider fa-text-shadow">
              Nombre del Release / Entregable
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Release Melissa 2.1"
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/40 rounded-xl text-white placeholder-cyan-200/40 text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
              autoFocus
            />
          </div>

          {/* Botones Acciones Gelatinosas */}
          <div className="flex justify-end gap-4 pt-5 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              className="fa-btn-glass text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="fa-btn-purple text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
