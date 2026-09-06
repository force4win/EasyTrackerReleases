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
    <div className="relative group w-80 bg-[#16a34a] border-2 border-emerald-600 rounded-2xl p-5 shadow-2xl transition-all hover:scale-102 flex flex-col justify-between">
      {/* Scroll / Pergamino Header (Diapositivas 28 y 38) */}
      <div>
        <div
          onClick={() => onOpenWorkspace(release.id)}
          className="bg-[#0b3c5d] hover:bg-[#1d5073] p-3.5 rounded-xl border border-cyan-400/40 cursor-pointer shadow-md flex justify-between items-center mb-4 transition-colors"
        >
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">{release.name}</h3>
            <span className="text-[11px] text-cyan-200/80">Ver workspace expandido &gt;</span>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteRelease && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDeleteRelease(release.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-cyan-200 hover:text-red-300 text-xs p-1 transition-opacity cursor-pointer"
                title="Eliminar Release"
              >
                🗑️
              </button>
            )}
            <span className="text-xl">📜</span>
          </div>
        </div>

        {/* Scroll Body: List of Grouped Transition Arrows (Diapositivas 28, 38, 41) */}
        <div className="space-y-3 bg-[#15803d]/60 p-4 rounded-xl border border-emerald-500/50">
          <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider mb-2">
            Pases de Entorno Agrupados:
          </p>

          {transitionGroups.length === 0 ? (
            <div className="text-xs text-emerald-100/70 italic text-center py-4 bg-emerald-950/20 rounded-lg">
              Agrega repositorios con transiciones para habilitar pases en lote.
            </div>
          ) : (
            transitionGroups.map(grp => {
              const isCompleted = completedGroups.has(grp.key)

              return (
                <button
                  key={grp.key}
                  onClick={() => onExecuteGroup?.(grp.key)}
                  className={`w-full relative px-4 py-3 rounded-xl border font-bold text-sm text-left flex justify-between items-center shadow-lg transition-all cursor-pointer group/arrow ${
                    isCompleted
                      ? 'bg-emerald-200 border-emerald-300 text-emerald-950 hover:bg-emerald-100' // Verde de éxito (Diapositiva 41)
                      : 'bg-[#ea580c] hover:bg-[#c2410c] border-orange-400 text-white hover:scale-102' // Naranja por defecto (Diapositiva 28)
                  }`}
                >
                  <span className="truncate">{grp.label}</span>

                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/20 text-white/90">
                    {grp.repositoryCount} repo(s)
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-emerald-500/40 text-xs text-emerald-100/80 flex justify-between items-center font-mono">
        <span>{transitionGroups.length} pase(s) en lote</span>
        <span className="text-white font-bold">Resumen listo</span>
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
