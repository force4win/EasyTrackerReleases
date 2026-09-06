import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { ReleaseModal } from '../components/ReleaseModal'
import { ReleaseWorkspace } from '../components/ReleaseWorkspace'
import { ReleaseSummaryCard } from '../components/ReleaseSummaryCard'
import { BatchExecutionModal } from '../components/BatchExecutionModal'
import { ConflictResolutionModal } from '../components/ConflictResolutionModal'
import type { Connection } from '../types/models'

export function ReleasesPage() {
  const navigate = useNavigate()
  const {
    releases,
    repositories,
    connections,
    branches,
    releaseRepositories,
    activeReleaseId,
    fetchAllData,
    createRelease,
    deleteRelease,
    setActiveReleaseId,
  } = useAppStore()

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Control de ejecuciones completadas por Release { [releaseId]: Set<groupKey> } (Diapositiva 41)
  const [completedGroupsMap, setCompletedGroupsMap] = useState<Record<string, Set<string>>>({})

  // Estado para el modal de "Please Wait" (Diapositiva 40)
  const [batchExecutionState, setBatchExecutionState] = useState<{
    isOpen: boolean
    groupLabel: string
    currentRepoName: string
    currentIndex: number
    totalRepos: number
    logs: string[]
  }>({
    isOpen: false,
    groupLabel: '',
    currentRepoName: '',
    currentIndex: 0,
    totalRepos: 0,
    logs: [],
  })

  // Estado para resolver conflictos interactivos durante el pase en lote
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean
    repositoryName: string
    folderPath: string
    failedLine?: string
    resolvePromise?: (value: boolean) => void
  }>({
    isOpen: false,
    repositoryName: '',
    folderPath: '',
  })

  const promptConflictResolution = useCallback(
    (repositoryName: string, folderPath: string, failedLine?: string) => {
      return new Promise<boolean>(resolve => {
        setConflictData({
          isOpen: true,
          repositoryName,
          folderPath,
          failedLine,
          resolvePromise: resolve,
        })
      })
    },
    []
  )

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const activeRelease = releases.find(r => r.id === activeReleaseId)

  const handleCreateRelease = async (name: string) => {
    const newRelease = await createRelease(name)
    if (newRelease) {
      setActiveReleaseId(newRelease.id)
    }
  }

  // Lógica de Ejecución en Lote (Diapositivas 39, 40, 41)
  const handleExecuteGroupBatch = useCallback(
    async (releaseId: string, groupKey: string) => {
      // 1. Obtener los repositorios del release
      const currentReleaseRepos = releaseRepositories.filter(rr => rr.releaseId === releaseId)
      const repoIds = new Set(currentReleaseRepos.map(rr => rr.repositoryId))

      // 2. Buscar todas las conexiones de ese tipo para los repositorios del release
      const targets: { connection: Connection; repoName: string; folderPath: string }[] = []

      for (const conn of connections) {
        if (!repoIds.has(conn.repositoryId)) continue

        const sourceBranch = branches.find(b => b.id === conn.sourceBranchId)
        const targetBranch = branches.find(b => b.id === conn.targetBranchId)

        if (sourceBranch && targetBranch) {
          const key = `${sourceBranch.branchType}->${targetBranch.branchType}`
          if (key === groupKey) {
            const repo = repositories.find(r => r.id === conn.repositoryId)
            if (repo) {
              targets.push({
                connection: conn,
                repoName: repo.name,
                folderPath: repo.folderPath,
              })
            }
          }
        }
      }

      if (targets.length === 0) return

      const firstSource = branches.find(b => b.id === targets[0]!.connection.sourceBranchId)?.branchType || 'DEV'
      const firstTarget = branches.find(b => b.id === targets[0]!.connection.targetBranchId)?.branchType || 'QA'
      const groupLabel = `${firstSource} to ${firstTarget}`

      // Open Please Wait Modal (Diapositiva 40)
      setBatchExecutionState({
        isOpen: true,
        groupLabel,
        currentRepoName: targets[0]!.repoName,
        currentIndex: 1,
        totalRepos: targets.length,
        logs: [`🚀 Iniciando pase en lote para ${targets.length} repositorio(s)...`],
      })

      // Subscripción a streaming de logs
      const unsubscribe = window.electronAPI.script.onStream(data => {
        setBatchExecutionState(prev => ({
          ...prev,
          logs: [...prev.logs.slice(-30), `[${data.timestamp}] ${data.message}`],
        }))
      })

      let allSuccess = true

      // 3. Ejecutar secuencialmente cada repositorio
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i]!
        setBatchExecutionState(prev => ({
          ...prev,
          currentRepoName: item.repoName,
          currentIndex: i + 1,
          logs: [...prev.logs, `\n▶ [${i + 1}/${targets.length}] Procesando repositorio: ${item.repoName}`],
        }))

        let scriptToRun = item.connection.script
        let repoSuccess = false

        try {
          while (true) {
            const result = await window.electronAPI.script.execute({
              connectionId: item.connection.id,
              folderPath: item.folderPath,
              scriptText: scriptToRun,
            })

            if (result.isConflict) {
              setBatchExecutionState(prev => ({
                ...prev,
                logs: [...prev.logs, `⚠️ CONFLICTO detectado en ${item.repoName}. Esperando resolución manual...`],
              }))

              const userResolved = await promptConflictResolution(
                item.repoName,
                item.folderPath,
                result.failedLine
              )

              if (userResolved && result.remainingLines && result.remainingLines.length > 0) {
                scriptToRun = result.remainingLines.join('\n')
                setBatchExecutionState(prev => ({
                  ...prev,
                  logs: [...prev.logs, `🔄 Reanudando ejecución tras conflicto en ${item.repoName}...`],
                }))
                continue
              } else {
                repoSuccess = false
                break
              }
            }

            if (!result.success) {
              repoSuccess = false
              setBatchExecutionState(prev => ({
                ...prev,
                logs: [...prev.logs, `❌ ERROR en ${item.repoName}: ${result.error}`],
              }))
              alert(`⚠️ Error en ${item.repoName}: ${result.error}\nSe ha pausado la ejecución en lote.`)
              break
            }

            repoSuccess = true
            break
          }
        } catch (err: any) {
          repoSuccess = false
          alert(`⚠️ Error inesperado en ${item.repoName}: ${err.message}`)
        }

        if (!repoSuccess) {
          allSuccess = false
          break
        }
      }

      unsubscribe()

      // Cerrar modal de Please Wait
      setBatchExecutionState(prev => ({ ...prev, isOpen: false }))

      // 4. Si todos fueron exitosos, marcar el grupo en VERDE (Diapositiva 41)
      if (allSuccess) {
        setCompletedGroupsMap(prev => {
          const releaseSet = new Set(prev[releaseId] || [])
          releaseSet.add(groupKey)
          return { ...prev, [releaseId]: releaseSet }
        })
      }
    },
    [releaseRepositories, connections, branches, repositories, promptConflictResolution]
  )

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Header bar */}
      <div className="h-14 bg-[var(--color-bg-surface)] border-b border-[var(--color-primary)] flex items-center justify-between px-6 shrink-0 shadow-md">
        <button
          onClick={() => {
            if (activeReleaseId) {
              setActiveReleaseId(null)
            } else {
              navigate('/')
            }
          }}
          className="text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium"
        >
          ← {activeReleaseId ? 'Volver a lista de Releases' : 'Volver al Inicio'}
        </button>

        <h2 className="text-lg font-bold text-white tracking-wide">
          {activeRelease ? `Release: ${activeRelease.name}` : 'Gestor de Releases'}
        </h2>

        <div className="w-24"></div> {/* Balance spacer */}
      </div>

      {/* Main Content: Canvas or Release Workspace */}
      <main className="flex-1 bg-[#2d4a3e] relative overflow-hidden flex flex-col">
        {activeRelease ? (
          /* Workspace del Release activo (Misión 9) */
          <ReleaseWorkspace release={activeRelease} onClose={() => setActiveReleaseId(null)} />
        ) : (
          /* Canvas de lista de Releases (Diapositivas 22, 24, 28, 38, 41) */
          <div className="w-full h-full p-8 relative overflow-auto">
            {/* Botón flotante + para crear Release en la esquina superior derecha (Diapositiva 22) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-3xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30"
              title="Crear nuevo Release"
            >
              +
            </button>

            {releases.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/60 opacity-60">
                <div className="text-center">
                  <p className="text-6xl mb-4">🚀</p>
                  <p className="text-xl font-semibold">Sin Releases configurados</p>
                  <p className="text-sm mt-2">Haz clic en el botón + morado arriba a la derecha para crear uno</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-12 items-start">
                {releases.map(release => (
                  <ReleaseSummaryCard
                    key={release.id}
                    release={release}
                    completedGroups={completedGroupsMap[release.id]}
                    onOpenWorkspace={id => setActiveReleaseId(id)}
                    onExecuteGroup={groupKey => handleExecuteGroupBatch(release.id, groupKey)}
                    onDeleteRelease={id => {
                      if (confirm('¿Eliminar este Release y sus configuraciones?')) {
                        deleteRelease(id)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal para crear Release */}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateRelease}
      />

      {/* Overlay modal "Please Wait" para ejecución en lote (Diapositiva 40) */}
      <BatchExecutionModal
        isOpen={batchExecutionState.isOpen}
        groupLabel={batchExecutionState.groupLabel}
        currentRepoName={batchExecutionState.currentRepoName}
        currentIndex={batchExecutionState.currentIndex}
        totalRepos={batchExecutionState.totalRepos}
        logs={batchExecutionState.logs}
      />

      {/* Modal interactivo de alerta en caso de conflicto de merge */}
      <ConflictResolutionModal
        isOpen={conflictData.isOpen}
        repositoryName={conflictData.repositoryName}
        folderPath={conflictData.folderPath}
        failedLine={conflictData.failedLine}
        onResolved={() => {
          conflictData.resolvePromise?.(true)
          setConflictData(prev => ({ ...prev, isOpen: false }))
        }}
        onCancel={() => {
          conflictData.resolvePromise?.(false)
          setConflictData(prev => ({ ...prev, isOpen: false }))
        }}
      />
    </div>
  )
}

export default ReleasesPage
