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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f172a] border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500/20 border-b border-amber-500/40 flex items-center gap-3">
          <span className="text-3xl animate-bounce">⚠️</span>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Conflictos de Merge Detectados
            </h3>
            <p className="text-xs text-amber-300 font-mono">
              {repositoryName} ({folderPath})
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-slate-200 leading-relaxed">
          {failedLine && (
            <div className="p-3 bg-black/40 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300">
              Paso que generó conflicto: <span className="text-amber-400 font-bold">{failedLine}</span>
            </div>
          )}

          <div className="space-y-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs font-sans text-gray-300">
            <p className="font-bold text-white text-sm mb-2">Instrucciones para resolver:</p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>
                Abre tu IDE o cliente Git en la carpeta:{' '}
                <strong className="text-cyan-300 font-mono block mt-0.5">{folderPath}</strong>
              </li>
              <li>Resuelve los conflictos en los archivos marcados por Git.</li>
              <li>
                Ejecuta <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git add .</code> y{' '}
                <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git commit</code> (o{' '}
                <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">git merge --continue</code>).
              </li>
              <li>
                Regresa a esta ventana y presiona <strong className="text-emerald-400">"Ok todo solucionado"</strong> para continuar.
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons (alertConfirmMessage) */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ✕ Cancelar ejecución
          </button>
          <button
            onClick={onResolved}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>✅</span> Ok todo solucionado (Continuar)
          </button>
        </div>
      </div>
    </div>
  )
}
