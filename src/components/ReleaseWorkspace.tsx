import { useState, useEffect } from 'react'
import type { Release } from '../types/models'
import { useAppStore } from '../store/useAppStore'
import { AddRepoToReleaseModal } from './AddRepoToReleaseModal'
import { ConsoleDrawer } from './ConsoleDrawer'

interface ReleaseWorkspaceProps {
  release: Release
  onClose: () => void
}

export function ReleaseWorkspace({ release, onClose }: ReleaseWorkspaceProps) {
  const {
    repositories,
    connections,
    releaseRepositories,
    fetchReleaseRepositories,
    fetchAllData,
    addReleaseRepository,
    removeReleaseRepository,
  } = useAppStore()

  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false)
  const [activeConsoleConnectionId, setActiveConsoleConnectionId] = useState<string | null>(null)
  const [activeConsoleRepoId, setActiveConsoleRepoId] = useState<string | null>(null)

  // Track executed connections in current session (turns green as in Slide 34)
  const [executedConnectionIds, setExecutedConnectionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAllData()
    fetchReleaseRepositories(release.id)
  }, [release.id, fetchAllData, fetchReleaseRepositories])

  // Current repos added to this release
  const addedRepoIds = new Set(releaseRepositories.map(rr => rr.repositoryId))
  const addedRepositories = repositories.filter(r => addedRepoIds.has(r.id))
  const availableRepositories = repositories.filter(r => !addedRepoIds.has(r.id))

  const handleAddRepo = async (repositoryId: string) => {
    const repoConnections = connections.filter(c => c.repositoryId === repositoryId)
    await addReleaseRepository({
      releaseId: release.id,
      repositoryId,
      connectionIds: repoConnections.map(c => c.id),
    })
  }

  const handleRemoveRepo = async (repositoryId: string) => {
    const rr = releaseRepositories.find(r => r.repositoryId === repositoryId)
    if (rr && confirm('¿Remover este repositorio del release?')) {
      await removeReleaseRepository(rr.id)
    }
  }

  const activeConnection = connections.find(c => c.id === activeConsoleConnectionId) || null
  const activeConsoleRepo = repositories.find(r => r.id === activeConsoleRepoId) || null

  return (
    <div className="w-full h-full flex flex-col bg-[#004d61] relative overflow-hidden">
      {/* Top Header — basado en Diapositiva 26 */}
      <div className="flex justify-between items-center px-8 py-4 bg-[#003543] border-b border-cyan-700/50 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white tracking-wide">{release.name}</h2>
          <span className="text-xs bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 px-3 py-1 rounded-full font-mono">
            {addedRepositories.length} repositorio(s) configurado(s)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Botón + para agregar repositorio al release (Diapositiva 26) */}
          <button
            onClick={() => setIsAddRepoModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30"
            title="Agregar Repositorio al Release"
          >
            +
          </button>

          {/* Botón 🚪 para salir del workspace y volver al resumen (Diapositiva 26) */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-lg flex items-center justify-center shadow-md transition-all cursor-pointer"
            title="Cerrar workspace y volver a Releases"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Diapositivas 26 y 27) */}
      <div className="flex-1 p-8 overflow-auto">
        {addedRepositories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-cyan-100/60 opacity-70">
            <div className="text-center max-w-md bg-black/20 p-8 rounded-2xl border border-white/10">
              <p className="text-6xl mb-4">🗄️</p>
              <p className="text-xl font-bold text-white mb-2">Espacio de trabajo vacío</p>
              <p className="text-sm">
                Pulsa el botón + morado arriba a la derecha para agregar repositorios a este Release.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {addedRepositories.map(repo => {
              // Obtenemos todas las conexiones configuradas para este repositorio
              const repoConns = connections.filter(c => c.repositoryId === repo.id)

              return (
                <div
                  key={repo.id}
                  className="group relative bg-[#00607a] border-2 border-cyan-500/40 rounded-2xl shadow-2xl p-6 flex flex-col justify-between transition-all hover:border-cyan-300"
                >
                  {/* Cylinder/Card Header (Diapositiva 26) */}
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-cyan-400/30 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-400/20 border border-cyan-300/40 flex items-center justify-center text-2xl">
                          🗄️
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{repo.name}</h3>
                          <p className="text-[11px] font-mono text-cyan-200/70 truncate max-w-[200px]">
                            {repo.folderPath}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveRepo(repo.id)}
                        className="opacity-0 group-hover:opacity-100 text-cyan-300 hover:text-red-300 text-sm p-1 transition-opacity cursor-pointer"
                        title="Remover repositorio del release"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Apéndices circulares naranjas de conexión (Diapositivas 26 y 27) */}
                    <div className="space-y-3 my-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200/80">
                        Acciones / Pases de Entorno:
                      </p>

                      {repoConns.length === 0 ? (
                        <div className="text-xs text-cyan-200/60 italic p-3 bg-black/20 rounded-lg">
                          Sin transiciones de ramas configuradas en el módulo de repositorios.
                        </div>
                      ) : (
                        repoConns.map(conn => {
                          const isExecuted = executedConnectionIds.has(conn.id)

                          return (
                            <div
                              key={conn.id}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-full border shadow-md transition-all ${
                                isExecuted
                                  ? 'bg-emerald-600 border-emerald-400 text-white' // Verde si se ejecutó (Diapositiva 34)
                                  : 'bg-[#f97316] hover:bg-[#ea580c] border-orange-400 text-white' // Naranja por defecto (Diap. 26)
                              }`}
                            >
                              <span className="text-xs font-semibold truncate max-w-[180px]">
                                {conn.label}
                              </span>

                              {/* Botón de consola >_ en el apéndice (Diapositiva 26) */}
                              <button
                                onClick={() => {
                                  setActiveConsoleConnectionId(conn.id)
                                  setActiveConsoleRepoId(repo.id)
                                  // Marcar como ejecutado al abrir y simular éxito
                                  setExecutedConnectionIds(prev => new Set(prev).add(conn.id))
                                }}
                                className="w-6 h-6 rounded-full bg-[#1e293b] hover:bg-[#0f172a] border border-white/40 flex items-center justify-center text-[11px] font-mono font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0"
                                title="Ejecutar comandos de este apéndice"
                              >
                                &gt;_
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cyan-400/20 flex justify-between items-center text-xs text-cyan-200/70 font-mono">
                    <span>{repoConns.length} apéndices</span>
                    {repoConns.length > 0 && (
                      <span className="text-emerald-300 font-bold">● Listo para deploy</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal para agregar repositorio */}
      <AddRepoToReleaseModal
        isOpen={isAddRepoModalOpen}
        onClose={() => setIsAddRepoModalOpen(false)}
        availableRepositories={availableRepositories}
        onAdd={handleAddRepo}
      />

      {/* Consola para ejecutar apéndice individual */}
      <ConsoleDrawer
        isOpen={!!activeConsoleConnectionId}
        onClose={() => setActiveConsoleConnectionId(null)}
        connection={activeConnection}
        repository={activeConsoleRepo}
      />
    </div>
  )
}
