import { useMemo } from 'react'
import type { Release, Connection } from '../types/models'
import { useAppStore } from '../store/useAppStore'

interface ReleaseSummaryCardProps {
  release: Release
  onOpenWorkspace: (releaseId: string) => void
  onExecuteGroup?: (groupTypeKey: string) => void
  onDeleteRelease?: (releaseId: string) => void
  completedGroups?: Set<string>
}

export interface TransitionGroup {
  key: string // e.g. "DEV->QA"
  label: string // e.g. "Dev to QA"
  sourceType: string
  targetType: string
  connectionCount: number
  repositoryCount: number
  connections: { connection: Connection; repositoryId: string }[]
}

export function ReleaseSummaryCard({
  release,
  onOpenWorkspace,
  onExecuteGroup,
  onDeleteRelease,
  completedGroups = new Set(),
}: ReleaseSummaryCardProps) {
  const { releaseRepositories, connections, branches } = useAppStore()

  // Calcular las transiciones agrupadas del Release (Diapositivas 28 y 38)
  const transitionGroups = useMemo<TransitionGroup[]>(() => {
    // 1. Repositorios de este release
    const currentReleaseRepos = releaseRepositories.filter(rr => rr.releaseId === release.id)
    const repoIds = new Set(currentReleaseRepos.map(rr => rr.repositoryId))

    // 2. Conexiones de estos repositorios
    const relConns = connections.filter(c => repoIds.has(c.repositoryId))

    // 3. Agrupar por (BranchType Origen -> BranchType Destino)
    const groupsMap = new Map<string, TransitionGroup>()

    for (const conn of relConns) {
      const sourceBranch = branches.find(b => b.id === conn.sourceBranchId)
      const targetBranch = branches.find(b => b.id === conn.targetBranchId)

      let sourceType = sourceBranch?.branchType || ''
      let targetType = targetBranch?.branchType || ''

      if (!sourceType || !targetType) {
        // Parsing de resguardo si los objetos de branch no están cargados
        const labelStr = conn.label || ''
        const parts = labelStr.split('->').map(s => s.trim())
        if (parts.length === 2) {
          sourceType = sourceType || parseBranchTypeFromName(parts[0]!)
          targetType = targetType || parseBranchTypeFromName(parts[1]!)
        }
      }

      const srcClean = sourceType || 'DEV'
      const tgtClean = targetType || 'QA'
      const key = `${srcClean}->${tgtClean}`
      const label = `${formatBranchType(srcClean)} to ${formatBranchType(tgtClean)}`

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label,
          sourceType: srcClean,
          targetType: tgtClean,
          connectionCount: 0,
          repositoryCount: 0,
          connections: [],
        })
      }

      const grp = groupsMap.get(key)!
      grp.connectionCount++
      grp.connections.push({ connection: conn, repositoryId: conn.repositoryId })
    }

    // Calcular cantidad única de repositorios por grupo
    for (const grp of groupsMap.values()) {
      const uniqueRepos = new Set(grp.connections.map(c => c.repositoryId))
      grp.repositoryCount = uniqueRepos.size
    }

    return Array.from(groupsMap.values())
  }, [release.id, releaseRepositories, connections, branches])

  return (
    <div className="relative group w-[420px] max-w-full fa-glass-panel p-7 border border-cyan-400/40 shadow-2xl transition-all duration-300 hover:scale-102 flex flex-col justify-between overflow-hidden">
      {/* Specular split highlight superior */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />

      <div>
        {/* Header de la tarjeta con amplio espacio */}
        <div
          onClick={() => onOpenWorkspace(release.id)}
          className="bg-gradient-to-r from-cyan-500/30 to-blue-600/40 hover:from-cyan-500/40 hover:to-blue-600/50 p-5 rounded-2xl border border-cyan-300/40 cursor-pointer shadow-lg flex justify-between items-center mb-6 transition-all duration-200"
        >
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-wide fa-text-shadow mb-1.5">{release.name}</h3>
            <span className="text-xs text-cyan-200 font-semibold inline-flex items-center gap-2">
              Ver workspace expandido <span className="text-sm">→</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onDeleteRelease && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDeleteRelease(release.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-cyan-200 hover:text-red-400 text-sm p-2 rounded-xl hover:bg-black/30 transition-all cursor-pointer"
                title="Eliminar Release"
              >
                🗑️
              </button>
            )}
            <span className="text-3xl">📜</span>
          </div>
        </div>

        {/* Lista de Pases de Entorno Agrupados con botones holgados y amplio padding */}
        <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
          <p className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-3 fa-text-shadow">
            Pases de Entorno Agrupados:
          </p>

          {transitionGroups.length === 0 ? (
            <div className="text-xs text-cyan-200/60 italic text-center py-6 bg-white/5 rounded-xl border border-white/5">
              Agrega repositorios con transiciones para habilitar pases en lote.
            </div>
          ) : (
            transitionGroups.map(grp => {
              const isCompleted = completedGroups.has(grp.key)

              return (
                <button
                  key={grp.key}
                  onClick={() => onExecuteGroup?.(grp.key)}
                  className={`w-full relative px-6 py-4 rounded-full font-bold text-xs text-left flex justify-between items-center gap-4 shadow-xl transition-all cursor-pointer ${
                    isCompleted
                      ? 'fa-btn-green'
                      : 'fa-btn-cyan'
                  }`}
                >
                  <span className="truncate flex items-center gap-3 tracking-wide">
                    <span className="text-sm shrink-0">{isCompleted ? '✅' : '▶'}</span>
                    <span className="truncate">{grp.label}</span>
                  </span>

                  <span className="text-[11px] font-mono font-semibold px-3.5 py-1 rounded-full bg-black/40 text-white shadow-inner shrink-0 whitespace-nowrap">
                    {grp.repositoryCount} repo(s)
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-7 pt-4 border-t border-cyan-400/20 text-xs text-cyan-200/80 flex justify-between items-center font-mono">
        <span>{transitionGroups.length} pase(s) configurado(s)</span>
        <span className="text-emerald-300 font-bold flex items-center gap-2">
          <span className="text-sm">●</span> Listo
        </span>
      </div>
    </div>
  )
}

function parseBranchTypeFromName(name: string): string {
  const upper = name.toUpperCase()
  if (upper.includes('DEV')) return 'DEV'
  if (upper.includes('QA')) return 'QA'
  if (upper.includes('STG') || upper.includes('STAGE')) return 'STG'
  if (upper.includes('CV')) return 'CV'
  if (upper.includes('PROD') || upper.includes('MAIN') || upper.includes('MASTER')) return 'PROD'
  return name
}

function formatBranchType(type: string): string {
  switch (type) {
    case 'DEV':
      return 'Dev'
    case 'QA':
      return 'QA'
    case 'STG':
      return 'STG'
    case 'PROD':
      return 'PROD'
    default:
      return type
  }
}
