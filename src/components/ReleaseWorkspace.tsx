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

  // Track executed connections in current session (turns green)
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
    <div className="w-full h-full flex flex-col fa-background relative overflow-hidden select-none">
      {/* Resplandor Aero */}
      <div className="fa-lens-flare" />

      {/* Top Header Frutiger Aero */}
      <div className="flex justify-between items-center px-8 py-4 fa-glass-header shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white tracking-wide fa-text-shadow">{release.name}</h2>
          <span className="text-xs bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 px-3.5 py-1 rounded-full font-mono font-bold shadow-inner">
            {addedRepositories.length} repositorio(s) configurado(s)
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Botón + Gelatinoso Fucsia para agregar repositorio */}
          <button
            onClick={() => setIsAddRepoModalOpen(true)}
            className="w-10 h-10 rounded-full fa-btn-purple text-white font-bold text-2xl flex items-center justify-center shadow-lg cursor-pointer"
            title="Agregar Repositorio al Release"
          >
            +
          </button>

          {/* Botón Salir */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full fa-btn-glass text-white font-bold text-lg flex items-center justify-center shadow-md cursor-pointer"
            title="Cerrar workspace y volver a Releases"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 p-8 overflow-auto z-10">
        {addedRepositories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-cyan-200/60">
            <div className="text-center max-w-md fa-glass-panel p-8">
              <p className="text-6xl mb-4 animate-bounce">🗄️</p>
              <p className="text-xl font-bold text-white mb-2 fa-text-shadow">Espacio de trabajo vacío</p>
              <p className="text-xs text-cyan-100/70 leading-relaxed">
                Pulsa el botón <strong className="text-fuchsia-300">+</strong> morado arriba a la derecha para agregar repositorios a este Release.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {addedRepositories.map(repo => {
              const repoConns = connections.filter(c => c.repositoryId === repo.id)

              return (
                <div
                  key={repo.id}
                  className="group relative fa-glass-panel border border-cyan-400/40 p-6 flex flex-col justify-between transition-all duration-300 hover:scale-102 shadow-2xl overflow-hidden"
                >
                  {/* Specular split highlight superior */}
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />

                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-cyan-400/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-md">
                          <div className="w-full h-full bg-[#0a2540] rounded-[10px] flex items-center justify-center text-xl">
                            🗄️
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white fa-text-shadow">{repo.name}</h3>
                          <p className="text-[11px] font-mono text-cyan-200/70 truncate max-w-[180px]">
                            {repo.folderPath}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveRepo(repo.id)}
                        className="opacity-0 group-hover:opacity-100 text-cyan-200 hover:text-red-400 text-sm p-1.5 rounded hover:bg-black/30 transition-all cursor-pointer"
                        title="Remover repositorio del release"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Apéndices / Pases de Entorno */}
                    <div className="space-y-3 my-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-200 fa-text-shadow">
                        Acciones / Pases de Entorno:
                      </p>

                      {repoConns.length === 0 ? (
                        <div className="text-xs text-cyan-200/60 italic p-3 bg-black/30 rounded-xl border border-white/5">
                          Sin transiciones de ramas configuradas en el módulo de repositorios.
                        </div>
                      ) : (
                        repoConns.map(conn => {
                          const isExecuted = executedConnectionIds.has(conn.id)

                          return (
                            <div
                              key={conn.id}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-full shadow-lg transition-all ${
                                isExecuted
                                  ? 'fa-btn-green'
                                  : 'fa-btn-cyan'
                              }`}
                            >
                              <span className="text-xs font-bold truncate max-w-[170px] fa-text-shadow">
                                {conn.label}
                              </span>

                              {/* Botón de consola >_ */}
                              <button
                                onClick={() => {
                                  setActiveConsoleConnectionId(conn.id)
                                  setActiveConsoleRepoId(repo.id)
                                  setExecutedConnectionIds(prev => new Set(prev).add(conn.id))
                                }}
                                className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 border border-white/40 flex items-center justify-center text-[11px] font-mono font-bold text-cyan-200 hover:text-white transition-colors cursor-pointer shrink-0 shadow-inner"
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
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <span>●</span> Listo
                      </span>
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

      {/* Consola y Editor de Comandos */}
      <ConsoleDrawer
        isOpen={!!activeConsoleConnectionId}
        onClose={() => {
          setActiveConsoleConnectionId(null)
          setActiveConsoleRepoId(null)
        }}
        connection={activeConnection}
        repository={activeConsoleRepo}
      />
    </div>
  )
}
