import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { RepositoryModal } from '../components/RepositoryModal'
import { BranchCanvas } from '../components/BranchCanvas'
import { ConsoleDrawer } from '../components/ConsoleDrawer'
import type { Repository } from '../types/models'

export function RepositoriesPage() {
  const navigate = useNavigate()
  const {
    repositories,
    connections,
    activeRepositoryId,
    fetchRepositories,
    createRepository,
    updateRepository,
    deleteRepository,
    setActiveRepositoryId,
  } = useAppStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [activeConsoleConnectionId, setActiveConsoleConnectionId] = useState<string | null>(null)

  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const activeRepo = repositories.find(r => r.id === activeRepositoryId)
  const activeConnection = connections.find(c => c.id === activeConsoleConnectionId) || null

  const handleOpenAddModal = () => {
    setEditingRepo(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingRepo(repo)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de eliminar este repositorio?')) {
      await deleteRepository(id)
    }
  }

  const handleSaveRepository = async (name: string, folderPath: string) => {
    if (editingRepo) {
      await updateRepository(editingRepo.id, name, folderPath)
    } else {
      const newRepo = await createRepository(name, folderPath)
      if (newRepo) {
        setActiveRepositoryId(newRepo.id)
      }
    }
  }

  return (
    <div className="min-h-screen flex fa-background relative overflow-hidden select-none">
      {/* Resplandor Aero */}
      <div className="fa-lens-flare" />

      {/* Sidebar Frutiger Aero — Cristal & Resplandores */}
      <aside className="w-80 bg-[#0c2540]/85 backdrop-blur-xl border-r border-cyan-400/30 flex flex-col p-5 shrink-0 shadow-2xl z-10">
        {/* Banner de título del Sidebar con espacio holgado */}
        <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border border-cyan-300/40 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🗂️</span>
            <h2 className="text-base font-extrabold text-white tracking-wide fa-text-shadow">
              Repositorios
            </h2>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="w-9 h-9 rounded-full fa-btn-cyan text-white flex items-center justify-center text-xl font-bold shadow-lg cursor-pointer"
            title="Agregar nuevo repositorio"
          >
            +
          </button>
        </div>

        {/* Lista de repositorios con acabado de cristal y padding espacioso */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {repositories.length === 0 ? (
            <div className="text-cyan-200/70 text-xs text-center mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="font-bold text-white text-sm mb-1.5">Sin Repositorios</p>
              <p className="text-cyan-100/70">Haz clic en el botón <strong className="text-cyan-300">+</strong> arriba para comenzar</p>
            </div>
          ) : (
            repositories.map(repo => {
              const isActive = repo.id === activeRepositoryId
              return (
                <div
                  key={repo.id}
                  onClick={() => setActiveRepositoryId(repo.id)}
                  className={`group relative px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/45 to-blue-600/55 border-cyan-300 shadow-xl shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-100 hover:border-cyan-400/50'
                  }`}
                >
                  {/* Highlight especular */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />

                  <div className="font-bold text-sm truncate pr-16 text-white fa-text-shadow leading-snug">
                    {repo.name}
                  </div>
                  <div className="text-[11px] truncate text-cyan-200/80 mt-1 font-mono leading-tight">
                    {repo.folderPath}
                  </div>

                  {/* Acciones flotantes (Editar/Eliminar) */}
                  <div className="absolute right-3 top-3.5 hidden group-hover:flex items-center gap-1 bg-black/70 p-1.5 rounded-xl border border-white/20 backdrop-blur-md">
                    <button
                      onClick={e => handleOpenEditModal(repo, e)}
                      className="text-white hover:text-cyan-300 text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                      title="Editar Repositorio"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => handleDelete(repo.id, e)}
                      className="text-white hover:text-red-400 text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                      title="Eliminar Repositorio"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* Área principal — Canvas de Ramas */}
      <main className="flex-1 bg-[#0b273d]/90 flex flex-col z-10">
        {/* Header bar Frutiger Aero con padding amplio */}
        <div className="h-16 fa-glass-header flex items-center justify-between px-8 shrink-0 shadow-md">
          <button
            onClick={() => navigate('/')}
            className="text-cyan-200 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider fa-text-shadow"
          >
            ← Volver al Inicio
          </button>

          {activeRepo ? (
            <div className="text-center px-4 py-1">
              <span className="text-white font-extrabold text-base tracking-wide fa-text-shadow">
                {activeRepo.name}
              </span>
              <span className="text-cyan-200/80 text-xs ml-3 font-mono">
                ({activeRepo.folderPath})
              </span>
            </div>
          ) : (
            <span className="text-cyan-200/60 text-xs font-medium italic">
              Selecciona un repositorio para visualizar y configurar sus ramas Git
            </span>
          )}

          <div className="w-32"></div> {/* Balance spacer */}
        </div>

        {/* Canvas de React Flow */}
        <div className="flex-1 relative overflow-hidden">
          {activeRepo ? (
            <BranchCanvas
              repository={activeRepo}
              onOpenConsole={id => setActiveConsoleConnectionId(id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-cyan-200/50">
              <div className="text-center p-8 fa-glass-panel max-w-md">
                <p className="text-6xl mb-4 animate-bounce">🗂️</p>
                <p className="text-xl font-bold text-white mb-2 fa-text-shadow">Espacio de trabajo de Repositorios</p>
                <p className="text-xs text-cyan-100/70 leading-relaxed">
                  Selecciona o crea un repositorio en el panel lateral para administrar sus ramas Git y secuencias de despliegue.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal CRUD Repositorios */}
      <RepositoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRepository}
        initialData={editingRepo}
      />

      {/* Consola y Editor de Comandos en Panel Deslizable */}
      <ConsoleDrawer
        isOpen={!!activeConsoleConnectionId}
        onClose={() => setActiveConsoleConnectionId(null)}
        connection={activeConnection}
        repository={activeRepo || null}
      />
    </div>
  )
}

export default RepositoriesPage
