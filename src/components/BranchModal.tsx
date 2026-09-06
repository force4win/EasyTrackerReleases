import { useState, useEffect } from 'react'
import type { BranchType } from '../types/models'

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  folderPath: string
  onSave: (name: string, branchType: BranchType) => Promise<void>
}

const BRANCH_TYPES: BranchType[] = ['DEV', 'QA', 'STG', 'CV', 'PROD']

export function BranchModal({ isOpen, onClose, folderPath, onSave }: BranchModalProps) {
  const [gitBranches, setGitBranches] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [customBranch, setCustomBranch] = useState('')
  const [branchType, setBranchType] = useState<BranchType>('DEV')
  const [loadingGit, setLoadingGit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && folderPath) {
      setLoadingGit(true)
      window.electronAPI.git
        .getBranches(folderPath)
        .then(branches => {
          setGitBranches(branches)
          if (branches.length > 0) {
            setSelectedBranch(branches[0]!)
          }
        })
        .catch(() => setGitBranches([]))
        .finally(() => setLoadingGit(false))
    } else {
      setGitBranches([])
      setSelectedBranch('')
      setCustomBranch('')
      setBranchType('DEV')
      setError(null)
    }

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
  }, [isOpen, folderPath, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalBranchName = customBranch.trim() || selectedBranch.trim()

    if (!finalBranchName) {
      setError('Debes ingresar o seleccionar un nombre de rama')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onSave(finalBranchName, branchType)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al agregar la rama')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-surface)] border border-[var(--color-primary)] rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-primary)] flex justify-between items-center bg-[var(--color-primary)]/30">
          <h3 className="text-lg font-semibold text-white">Agregar Rama al Canvas</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--color-error)]/20 border border-[var(--color-error)] text-[var(--color-error)] text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Ramas detectadas en Git
            </label>
            {loadingGit ? (
              <div className="text-sm text-gray-400 italic">Cargando ramas de Git...</div>
            ) : gitBranches.length > 0 ? (
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-primary)] rounded-lg text-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
              >
                {gitBranches.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-amber-400">No se detectaron ramas automáticas en el repositorio.</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Nombre de Rama personalizado (Opcional)
            </label>
            <input
              type="text"
              value={customBranch}
              onChange={e => setCustomBranch(e.target.value)}
              placeholder="Ej. BranchDEV, BranchQA"
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-primary)] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Tipo de Entorno / Branch
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BRANCH_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBranchType(type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    branchType === type
                      ? 'bg-[var(--color-accent)] border-white text-white'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-primary)] text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

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
              {isSubmitting ? 'Guardando...' : 'Agregar Nodo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
