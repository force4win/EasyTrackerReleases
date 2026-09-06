import { useState, useEffect } from 'react'
import type { Repository } from '../types/models'

interface RepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, folderPath: string) => Promise<void>
  initialData?: Repository | null
}

export function RepositoryModal({ isOpen, onClose, onSave, initialData }: RepositoryModalProps) {
  const [name, setName] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setFolderPath(initialData.folderPath)
    } else {
      setName('')
      setFolderPath('')
    }
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
  }, [initialData, isOpen, onClose])

  if (!isOpen) return null

  const handleBrowseFolder = async () => {
    try {
      const selected = await window.electronAPI.dialog.selectFolder()
      if (selected) {
        setFolderPath(selected)
        // Autocompletar nombre con el nombre de la carpeta si está vacío
        if (!name) {
          const folderName = selected.split(/[\\/]/).pop() || ''
          setName(folderName)
        }
      }
    } catch (err: any) {
      setError('Error al seleccionar la carpeta')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del repositorio es obligatorio')
      return
    }
    if (!folderPath.trim()) {
      setError('La ruta de la carpeta es obligatoria')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSave(name.trim(), folderPath.trim())
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el repositorio')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-surface)] border border-[var(--color-primary)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-primary)] flex justify-between items-center bg-[var(--color-primary)]/30">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Editar Repositorio' : 'Agregar Repositorio'}
          </h3>
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
              Nombre del Repositorio
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. OperationAPI"
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-primary)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Ruta de la Carpeta (Git)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={e => setFolderPath(e.target.value)}
                placeholder="D:\folder\folderOper"
                className="flex-1 px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-primary)] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Examinar...
              </button>
            </div>
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
              {isSubmitting ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
