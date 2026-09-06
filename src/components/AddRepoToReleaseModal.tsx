import { useState, useEffect } from 'react'
import type { Repository } from '../types/models'

interface AddRepoToReleaseModalProps {
  isOpen: boolean
  onClose: () => void
  availableRepositories: Repository[]
  onAdd: (repositoryId: string) => Promise<void>
}

export function AddRepoToReleaseModal({
  isOpen,
  onClose,
  availableRepositories,
  onAdd,
}: AddRepoToReleaseModalProps) {
  const [selectedRepoId, setSelectedRepoId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSelectedRepoId('')
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
    if (!selectedRepoId) {
      setError('Debes seleccionar un repositorio')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onAdd(selectedRepoId)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al agregar repositorio al release')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="w-full max-w-md fa-glass-window overflow-hidden flex flex-col border border-cyan-400/50 shadow-2xl">
        {/* Header Especular Frutiger Aero */}
        <div className="px-6 py-4 fa-glass-header flex justify-between items-center text-white">
          <h3 className="text-lg font-bold tracking-wide fa-text-shadow">Agregar Repositorio al Release</h3>
          <button onClick={onClose} className="text-cyan-200 hover:text-white text-xl font-bold cursor-pointer transition-colors">
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#0a1c2e]/90">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl shadow-inner">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-1.5 uppercase tracking-wider fa-text-shadow">
              Seleccionar Repositorio
            </label>
            {availableRepositories.length > 0 ? (
              <select
                value={selectedRepoId}
                onChange={e => setSelectedRepoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-cyan-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-300 shadow-inner"
              >
                <option value="" className="bg-[#0a1c2e] text-cyan-300">
                  -- Selecciona un repositorio --
                </option>
                {availableRepositories.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#0a1c2e] text-white">
                    {r.name} ({r.folderPath})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                Todos los repositorios ya han sido agregados a este release, o no hay repositorios creados.
              </div>
            )}
          </div>

          {/* Botones Acciones Gelatinosas */}
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 fa-btn-glass text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableRepositories.length === 0}
              className="px-5 py-2 fa-btn-green text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Agregando...' : 'Agregar al Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
