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
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Sidebar azul — basado en Diapositivas 2, 3 y 4 */}
      <aside className="w-64 bg-[var(--color-sidebar)] flex flex-col p-4 shrink-0 shadow-lg border-r border-[var(--color-primary)]/30">
        <div className="flex items-center justify-between mb-6 bg-[var(--color-primary)]/20 p-2.5 rounded-lg border border-white/20">
          <h2 className="text-base font-bold text-white tracking-wide">
            Repositorios
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white
                       flex items-center justify-center text-xl font-bold shadow-md
                       hover:bg-[var(--color-accent-hover)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Agregar repositorio"
          >
            +
          </button>
        </div>

        {/* Lista de repositorios */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {repositories.length === 0 ? (
            <div className="text-[var(--color-bg-primary)] text-sm font-medium opacity-70 text-center mt-8 p-4 bg-white/10 rounded-lg">
              <p className="font-semibold text-white mb-1">Sin repositorios</p>
              <p className="text-xs text-white/80">Pulsa el botón + para agregar uno</p>
            </div>
          ) : (
            repositories.map(repo => {
              const isActive = repo.id === activeRepositoryId
              return (
                <div
                  key={repo.id}
                  onClick={() => setActiveRepositoryId(repo.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-[#e056fd] border-white text-white shadow-lg scale-102'
                      : 'bg-[#f3a683] hover:bg-[#e77f67] border-black/10 text-gray-900 shadow-md hover:scale-101'
                  }`}
                >
                  <div className="font-bold text-sm truncate pr-12">{repo.name}</div>
                  <div className="text-xs truncate opacity-85 mt-0.5 font-mono">
                    {repo.folderPath}
                  </div>

                  {/* Acciones (Editar/Eliminar) */}
                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-black/40 p-1 rounded backdrop-blur-xs">
                    <button
                      onClick={e => handleOpenEditModal(repo, e)}
                      className="text-white hover:text-amber-300 text-xs px-1"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => handleDelete(repo.id, e)}
                      className="text-white hover:text-red-400 text-xs px-1"
                      title="Eliminar"
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

      {/* Área principal — Canvas */}
      <main className="flex-1 bg-[var(--color-bg-canvas)] flex flex-col">
        {/* Header bar */}
        <div className="h-14 bg-[var(--color-bg-surface)] border-b border-[var(--color-primary)]
                        flex items-center justify-between px-6 shrink-0 shadow-md">
          <button
            onClick={() => navigate('/')}
            className="text-[var(--color-text-muted)] hover:text-white
                       transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium"
          >
            ← Volver al Inicio
          </button>
          
          {activeRepo ? (
            <div className="text-center">
              <span className="text-white font-bold text-base">{activeRepo.name}</span>
              <span className="text-[var(--color-text-muted)] text-xs ml-3 font-mono">
                {activeRepo.folderPath}
              </span>
            </div>
          ) : (
            <span className="text-[var(--color-text-muted)] text-sm">
              Selecciona un repositorio para configurar sus branches
            </span>
          )}

          <div className="w-24"></div> {/* Balance spacer */}
        </div>

        {/* Canvas React Flow */}
        <div className="flex-1 relative overflow-hidden">
          {activeRepo ? (
            <BranchCanvas
              repository={activeRepo}
              onOpenConsole={id => setActiveConsoleConnectionId(id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] opacity-50">
              <div className="text-center">
                <p className="text-6xl mb-4">🗂️</p>
                <p className="text-xl font-semibold">Espacio de trabajo de Repositorios</p>
                <p className="text-sm mt-2">Selecciona o crea un repositorio en el panel de la izquierda</p>
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
