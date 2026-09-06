import { useEffect } from 'react'

interface ConflictResolutionModalProps {
  isOpen: boolean
  repositoryName: string
  folderPath: string
  failedLine?: string
  onResolved: () => void
  onCancel: () => void
}

export function ConflictResolutionModal({
  isOpen,
  repositoryName,
  folderPath,
  failedLine,
  onResolved,
  onCancel,
}: ConflictResolutionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg fa-glass-window overflow-hidden flex flex-col border border-amber-400/50 shadow-2xl">
        {/* Header Especular Amber/Dorado */}
        <div className="px-6 py-4 fa-glass-header-amber flex items-center gap-3">
          <span className="text-3xl animate-bounce">⚠️</span>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide fa-text-shadow">
              Conflictos de Merge Detectados
            </h3>
            <p className="text-xs text-amber-200 font-mono">
              {repositoryName} ({folderPath})
            </p>
          </div>
        </div>

        {/* Cuerpo con fondo cristal y resaltado */}
        <div className="p-6 space-y-4 text-sm text-slate-100 leading-relaxed bg-[#0a1c2e]/90">
          {failedLine && (
            <div className="p-3 bg-black/50 border border-amber-500/30 rounded-xl text-xs font-mono text-cyan-300">
              Paso que generó conflicto: <span className="text-amber-400 font-bold">{failedLine}</span>
            </div>
          )}

          <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-gray-200">
            <p className="font-bold text-white text-sm mb-2 fa-text-shadow">Instrucciones para resolver:</p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Abre tu IDE o cliente Git en la carpeta:{' '}
                <strong className="text-cyan-300 font-mono block mt-1 bg-black/50 p-1.5 rounded border border-white/10 truncate">
                  {folderPath}
                </strong>
              </li>
              <li>Resuelve los conflictos de merge en los archivos indicados por Git.</li>
              <li>
                Ejecuta <code className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git add .</code> y{' '}
                <code className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git commit</code> (o{' '}
                <code className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git merge --continue</code>).
              </li>
              <li>
                Regresa a esta ventana y presiona <strong className="text-emerald-400">"Ok todo solucionado"</strong> para continuar el script.
              </li>
            </ol>
          </div>
        </div>

        {/* Acciones Gelatinosas (alertConfirmMessage) */}
        <div className="px-6 py-4 bg-[#061524] border-t border-amber-500/30 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 fa-btn-glass text-xs font-bold rounded-xl cursor-pointer"
          >
            ✕ Cancelar ejecución
          </button>
          <button
            onClick={onResolved}
            className="px-5 py-2.5 fa-btn-green text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <span>✅</span> Ok todo solucionado (Continuar)
          </button>
        </div>
      </div>
    </div>
  )
}
