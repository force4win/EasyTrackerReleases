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

  const progressPercent = Math.min(100, Math.max(5, (currentIndex / totalRepos) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300 select-none">
      <div className="w-full max-w-lg fa-glass-window p-8 shadow-2xl text-center space-y-6 border border-cyan-400/50">
        {/* Animated Hourglass / Water Bubble Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-cyan-500/20 rounded-full border border-cyan-400/40 shadow-inner">
          <span className="text-5xl animate-bounce">⏳</span>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-300/30 animate-ping" />
        </div>

        {/* Text Title */}
        <div>
          <h3 className="text-2xl font-extrabold text-white tracking-wide mb-1 fa-text-glow">Please wait...</h3>
          <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Ejecutando pase en lote: <span className="text-amber-300 font-mono">{groupLabel}</span>
          </p>
        </div>

        {/* Progress bar Frutiger Aero Glossy */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-cyan-100 font-mono">
            <span>Repositorio: <strong className="text-cyan-300">{currentRepoName}</strong></span>
            <span>{currentIndex} / {totalRepos}</span>
          </div>
          <div className="w-full bg-black/60 rounded-full h-4 overflow-hidden border border-white/20 p-0.5 shadow-inner">
            <div
              className="fa-btn-green h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Log stream box */}
        <div className="bg-black/70 border border-cyan-500/30 rounded-xl p-3 text-left font-mono text-xs text-emerald-400 h-36 overflow-y-auto space-y-1 shadow-inner">
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
