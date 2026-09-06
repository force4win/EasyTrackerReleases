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
    <div className="relative group w-80 fa-glass-panel p-5 border border-cyan-400/40 shadow-2xl transition-all duration-300 hover:scale-102 flex flex-col justify-between overflow-hidden">
      {/* Specular split highlight superior */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />

      <div>
        {/* Header de la tarjeta */}
        <div
          onClick={() => onOpenWorkspace(release.id)}
          className="bg-gradient-to-r from-cyan-500/30 to-blue-600/40 hover:from-cyan-500/40 hover:to-blue-600/50 p-4 rounded-xl border border-cyan-300/40 cursor-pointer shadow-lg flex justify-between items-center mb-4 transition-all duration-200"
        >
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide fa-text-shadow">{release.name}</h3>
            <span className="text-[11px] text-cyan-200 font-semibold inline-flex items-center gap-1 mt-0.5">
              Ver workspace expandido →
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteRelease && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDeleteRelease(release.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-cyan-200 hover:text-red-400 text-xs p-1.5 rounded hover:bg-black/30 transition-all cursor-pointer"
                title="Eliminar Release"
              >
                🗑️
              </button>
            )}
            <span className="text-2xl">📜</span>
          </div>
        </div>

        {/* Lista de Pases de Entorno Agrupados */}
        <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider mb-2">
            Pases de Entorno Agrupados:
          </p>

          {transitionGroups.length === 0 ? (
            <div className="text-xs text-cyan-200/60 italic text-center py-4 bg-white/5 rounded-lg border border-white/5">
              Agrega repositorios con transiciones para habilitar pases en lote.
            </div>
          ) : (
            transitionGroups.map(grp => {
              const isCompleted = completedGroups.has(grp.key)

              return (
                <button
                  key={grp.key}
                  onClick={() => onExecuteGroup?.(grp.key)}
                  className={`w-full relative px-4 py-3 rounded-xl font-bold text-sm text-left flex justify-between items-center shadow-lg transition-all cursor-pointer ${
                    isCompleted
                      ? 'fa-btn-green'
                      : 'fa-btn-cyan'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <span>{isCompleted ? '✅' : '▶'}</span>
                    {grp.label}
                  </span>

                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-black/30 text-white/90 shadow-inner">
                    {grp.repositoryCount} repo(s)
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-cyan-400/20 text-xs text-cyan-200/80 flex justify-between items-center font-mono">
        <span>{transitionGroups.length} pase(s) configurado(s)</span>
        <span className="text-emerald-300 font-bold flex items-center gap-1">
          <span>●</span> Listo
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
