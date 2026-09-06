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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="w-full max-w-lg fa-glass-window overflow-hidden flex flex-col border border-cyan-400/50 shadow-2xl">
        {/* Header Especular Frutiger Aero con padding amplio */}
        <div className="px-8 py-5 fa-glass-header flex justify-between items-center text-white">
          <h3 className="text-xl font-extrabold tracking-wide fa-text-shadow">Agregar Rama al Canvas</h3>
          <button onClick={onClose} className="text-cyan-200 hover:text-white text-2xl font-bold cursor-pointer transition-colors p-1">
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
              Ramas detectadas en Git
            </label>
            {loadingGit ? (
              <div className="text-xs text-cyan-200/60 italic p-3 bg-black/30 rounded-xl">Cargando ramas de Git...</div>
            ) : gitBranches.length > 0 ? (
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-300 shadow-inner"
              >
                {gitBranches.map(b => (
                  <option key={b} value={b} className="bg-[#0a1c2e] text-white">
                    {b}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                No se detectaron ramas automáticas en el repositorio.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-2 uppercase tracking-wider fa-text-shadow">
              Nombre de Rama personalizado (Opcional)
            </label>
            <input
              type="text"
              value={customBranch}
              onChange={e => setCustomBranch(e.target.value)}
              placeholder="Ej. BranchDEV, BranchQA"
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/40 rounded-xl text-white text-xs placeholder-cyan-200/40 focus:outline-none focus:border-cyan-300 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-200 mb-2 uppercase tracking-wider fa-text-shadow">
              Tipo de Entorno / Branch
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {BRANCH_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBranchType(type)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                    branchType === type
                      ? 'fa-btn-cyan border-white'
                      : 'fa-btn-glass text-cyan-100/70 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
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
              className="fa-btn-green text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Agregar Nodo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
