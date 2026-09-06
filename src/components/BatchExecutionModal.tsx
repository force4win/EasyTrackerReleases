interface BatchExecutionModalProps {
  isOpen: boolean
  groupLabel: string
  currentRepoName: string
  currentIndex: number
  totalRepos: number
  logs: string[]
}

export function BatchExecutionModal({
  isOpen,
  groupLabel,
  currentRepoName,
  currentIndex,
  totalRepos,
  logs,
}: BatchExecutionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Box style matching Diapositiva 40 with Hourglass icon */}
      <div className="w-full max-w-lg bg-[#0f172a] border-2 border-amber-500/60 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Hourglass / Spinner Icon (Diapositiva 40) */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/30">
          <span className="text-5xl animate-bounce">⏳</span>
        </div>

        {/* Text Title (Diapositiva 40) */}
        <div>
          <h3 className="text-2xl font-extrabold text-white tracking-wide mb-1">Please wait...</h3>
          <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            Ejecutando pase en lote: {groupLabel}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-300 font-mono">
            <span>Repositorio: <strong className="text-cyan-300">{currentRepoName}</strong></span>
            <span>{currentIndex} / {totalRepos}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, (currentIndex / totalRepos) * 100))}%` }}
            />
          </div>
        </div>

        {/* Log stream box */}
        <div className="bg-black/60 border border-slate-800 rounded-xl p-3 text-left font-mono text-xs text-emerald-400 h-32 overflow-y-auto space-y-1">
          {logs.map((log, idx) => (
            <div key={idx} className="leading-tight">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
