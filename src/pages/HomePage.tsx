import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import EnvironmentSelector from '../components/EnvironmentSelector'
import EnvironmentModal from '../components/EnvironmentModal'
import type { Environment } from '../types/models'

function HomePage() {
  const navigate = useNavigate()
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useAppStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null)
  const [deletingEnv, setDeletingEnv] = useState<Environment | null>(null)

  const activeEnv = environments.find(e => e.id === activeEnvironmentId)

  const handleSaveEnv = async (data: Omit<Environment, 'id' | 'createdAt'>) => {
    if (editingEnv) {
      await updateEnvironment({ ...editingEnv, ...data })
    } else {
      await createEnvironment(data)
    }
    setEditingEnv(null)
  }

  const handleOpenCreate = () => {
    setEditingEnv(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (env: Environment) => {
    setEditingEnv(env)
    setIsModalOpen(true)
  }

  const handleDeleteEnv = (env: Environment) => {
    setDeletingEnv(env)
  }

  const confirmDelete = async () => {
    if (deletingEnv) {
      await deleteEnvironment(deletingEnv.id)
      setDeletingEnv(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center fa-background relative p-8 select-none">
      {/* Resplandor de Luz Frutiger Aero */}
      <div className="fa-lens-flare" />

      {/* === BANNER DE AMBIENTE ACTIVO === */}
      <div className="w-full max-w-4xl mb-8 z-10 animate-in fade-in duration-500">
        <div className="fa-glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-cyan-300/70 uppercase tracking-widest">
              Ambiente Activo
            </span>
          </div>

          {/* Selector */}
          <div className="flex-1">
            <EnvironmentSelector
              environments={environments}
              activeEnvironmentId={activeEnvironmentId}
              onSelect={setActiveEnvironmentId}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteEnv}
              onCreate={handleOpenCreate}
            />
          </div>

          {/* Estado si no hay ambiente */}
          {environments.length === 0 && (
            <div className="flex items-center gap-3 text-amber-300/80 text-xs bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-xl">
              <span>⚠️</span>
              <span>Crea un ambiente para comenzar a gestionar tus repositorios y releases</span>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="text-center mb-14 z-10 animate-in fade-in duration-500">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 shadow-lg backdrop-blur-md">
          <span className="animate-pulse text-sm">✨</span> Sistema de Automatización Git & Releases
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold fa-text-glow mb-4 tracking-tight">
          Generador de Releases
        </h1>
        <p className="text-base md:text-lg text-cyan-100/90 font-medium fa-text-shadow max-w-xl mx-auto leading-relaxed">
          Gestión visual skeuomórfica de transiciones de ramas Git, ejecución de scripts y entregables
        </p>
        {/* Indicador de ambiente activo en el header */}
        {activeEnv && (
          <div
            className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: activeEnv.color + '22',
              border: `1px solid ${activeEnv.color}55`,
              color: activeEnv.color,
              boxShadow: `0 0 16px ${activeEnv.color}22`,
            }}
          >
            <span>{activeEnv.icon}</span>
            <span>{activeEnv.name}</span>
          </div>
        )}
      </header>

      {/* Tarjetas principales Frutiger Aero Glass Panel */}
      <main className="flex flex-col sm:flex-row gap-8 justify-center items-stretch z-10 max-w-4xl w-full">
        {/* Tarjeta: Prepare Repositories */}
        <button
          onClick={() => navigate('/repositories')}
          disabled={!activeEnvironmentId}
          className="group flex-1 fa-glass-panel p-8 text-left transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px] border border-cyan-300/40 hover:border-cyan-200 shadow-2xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {/* Specular split highlight superior */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-2xl" />

          {/* Top Row: Icon + Badge */}
          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg group-hover:shadow-cyan-400/50 transition-shadow">
              <div className="w-full h-full bg-[#0a2540] rounded-[14px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🗂️
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-200 bg-cyan-950/80 px-3.5 py-1.5 rounded-full border border-cyan-400/30 shadow-inner">
              PASO 1
            </span>
          </div>

          {/* Card Body */}
          <div className="relative z-10 my-2">
            <h2 className="text-2xl font-bold text-white mb-2 fa-text-shadow group-hover:text-cyan-200 transition-colors">
              Prepare Repositories
            </h2>
            <p className="text-xs text-cyan-100/80 leading-relaxed font-sans">
              Configura tus repositorios locales, selecciona carpetas y gestiona ramas origen y destino.
            </p>
            {!activeEnvironmentId && (
              <p className="text-xs text-amber-300/70 mt-2">⚠️ Selecciona un ambiente primero</p>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-4 border-t border-cyan-400/20 flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-cyan-200 group-hover:text-white group-hover:translate-x-1 transition-all inline-flex items-center gap-2 fa-text-shadow">
              Configurar Repositorios <span className="text-lg">→</span>
            </span>
            <div className="w-9 h-9 rounded-full fa-btn-cyan flex items-center justify-center text-base font-bold shadow-md shrink-0">
              ›
            </div>
          </div>
        </button>

        {/* Tarjeta: Prepare Release */}
        <button
          onClick={() => navigate('/releases')}
          disabled={!activeEnvironmentId}
          className="group flex-1 fa-glass-panel p-8 text-left transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px] border border-fuchsia-300/40 hover:border-fuchsia-200 shadow-2xl hover:shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {/* Specular split highlight superior */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-2xl" />

          {/* Top Row: Icon + Badge */}
          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-700 p-0.5 shadow-lg group-hover:shadow-fuchsia-400/50 transition-shadow">
              <div className="w-full h-full bg-[#1e0a2b] rounded-[14px] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🚀
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-fuchsia-200 bg-fuchsia-950/80 px-3.5 py-1.5 rounded-full border border-fuchsia-400/30 shadow-inner">
              PASO 2
            </span>
          </div>

          {/* Card Body */}
          <div className="relative z-10 my-2">
            <h2 className="text-2xl font-bold text-white mb-2 fa-text-shadow group-hover:text-fuchsia-200 transition-colors">
              Prepare Release
            </h2>
            <p className="text-xs text-fuchsia-100/80 leading-relaxed font-sans">
              Crea entregables de release, visualiza el mapa de transiciones y ejecuta scripts en lote.
            </p>
            {!activeEnvironmentId && (
              <p className="text-xs text-amber-300/70 mt-2">⚠️ Selecciona un ambiente primero</p>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-4 border-t border-fuchsia-400/20 flex items-center justify-between relative z-10">
            <span className="text-sm font-bold text-fuchsia-200 group-hover:text-white group-hover:translate-x-1 transition-all inline-flex items-center gap-2 fa-text-shadow">
              Gestor de Releases <span className="text-lg">→</span>
            </span>
            <div className="w-9 h-9 rounded-full fa-btn-purple flex items-center justify-center text-base font-bold shadow-md shrink-0">
              ›
            </div>
          </div>
        </button>
      </main>

      {/* Footer Frutiger Aero */}
      <footer className="mt-16 text-center text-cyan-200/60 text-xs font-mono z-10 fa-text-shadow">
        <p>Generador de Releases • Estética Frutiger Aero UI/UX</p>
      </footer>

      {/* Modal de ambiente */}
      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEnv(null) }}
        onSave={handleSaveEnv}
        editingEnv={editingEnv}
      />

      {/* Confirmación de eliminación */}
      {deletingEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingEnv(null)} />
          <div className="fa-glass-window relative z-10 w-full max-w-md overflow-hidden">
            <div className="fa-glass-header-orange">
              <h2 className="text-base font-bold text-white fa-text-shadow">⚠️ Eliminar Ambiente</h2>
            </div>
            <div className="p-8 space-y-5">
              <p className="text-sm text-white/80 leading-relaxed">
                ¿Estás seguro de que quieres eliminar el ambiente{' '}
                <span className="font-bold text-white">"{deletingEnv.name}"</span>?
              </p>
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-xs text-red-300/80 leading-relaxed">
                🗑️ Esta acción eliminará <strong>todos los repositorios, branches, conexiones y releases</strong> asociados a este ambiente. No se puede deshacer.
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeletingEnv(null)} className="fa-btn-glass flex-1">
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-lg shadow-red-900/40 transition-all active:scale-95"
                >
                  Sí, Eliminar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
