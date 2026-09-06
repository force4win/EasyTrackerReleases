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
        if (!name) {
          const folderName = selected.split(/[\\/]/).pop() || ''
          setName(folderName)
        }
      }
    } catch {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md fa-glass-window overflow-hidden flex flex-col border border-cyan-400/50 shadow-2xl">
        {/* Header Especular Frutiger Aero */}
        <div className="px-6 py-4 fa-glass-header flex justify-between items-center text-white">
          <h3 className="text-lg font-bold tracking-wide fa-text-shadow">
            {initialData ? 'Editar Repositorio' : 'Agregar Repositorio'}
          </h3>
          <button
            onClick={onClose}
            className="text-cyan-200 hover:text-white text-xl font-bold cursor-pointer transition-colors"
          >
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
              Nombre del Repositorio
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. OperationAPI"
              className="w-full px-3.5 py-2.5 bg-black/50 border border-cyan-500/40 rounded-xl text-white placeholder-cyan-200/40 text-xs focus:outline-none focus:border-cyan-300 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-1.5 uppercase tracking-wider fa-text-shadow">
              Ruta de la Carpeta (Git)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={e => setFolderPath(e.target.value)}
                placeholder="D:\folder\folderOper"
                className="flex-1 px-3.5 py-2.5 bg-black/50 border border-cyan-500/40 rounded-xl text-white placeholder-cyan-200/40 text-xs font-mono focus:outline-none focus:border-cyan-300 shadow-inner"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3.5 py-2.5 fa-btn-cyan text-xs font-bold rounded-xl cursor-pointer shrink-0"
              >
                Examinar...
              </button>
            </div>
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
              disabled={isSubmitting}
              className="px-5 py-2 fa-btn-green text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Repositorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
