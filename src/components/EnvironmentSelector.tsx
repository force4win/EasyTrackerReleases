import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Environment } from '../types/models'

interface EnvironmentSelectorProps {
  environments: Environment[]
  activeEnvironmentId: string | null
  onSelect: (id: string) => void
  onEdit: (env: Environment) => void
  onDelete: (env: Environment) => void
  onCreate: () => void
}

export default function EnvironmentSelector({
  environments,
  activeEnvironmentId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: EnvironmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeEnv = environments.find(e => e.id === activeEnvironmentId)

  // Calcular posición del dropdown con position:fixed para escapar cualquier stacking context
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 288),
      zIndex: 9999,
    })
  }, [])

  // Abrir dropdown y calcular posición
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(p => !p)
  }

  // Cerrar al hacer click fuera o scroll
  useEffect(() => {
    if (!isOpen) return

    const handleClose = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleScroll = () => setIsOpen(false)

    document.addEventListener('mousedown', handleClose)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const dropdown = isOpen ? (
    <div
      style={dropdownStyle}
      className="fa-glass-window rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Lista de ambientes */}
      <div className="p-2 max-h-72 overflow-y-auto space-y-1">
        {environments.length === 0 ? (
          <div className="px-4 py-6 text-center text-white/40 text-xs">
            No hay ambientes creados
          </div>
        ) : (
          environments.map(env => (
            <div
              key={env.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${
                env.id === activeEnvironmentId
                  ? 'bg-white/15 border border-white/20'
                  : 'hover:bg-white/10 border border-transparent'
              }`}
              onClick={() => { onSelect(env.id); setIsOpen(false) }}
            >
              {/* Icono */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{ backgroundColor: env.color + '28', border: `1.5px solid ${env.color}55` }}
              >
                {env.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{env.name}</p>
                {env.description && (
                  <p className="text-[10px] text-white/50 truncate">{env.description}</p>
                )}
              </div>

              {/* Badge activo */}
              {env.id === activeEnvironmentId && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: env.color + '28', color: env.color, border: `1px solid ${env.color}55` }}
                >
                  ACTIVO
                </span>
              )}

              {/* Acciones en hover */}
              <div
                className="hidden group-hover:flex items-center gap-1 shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { onEdit(env); setIsOpen(false) }}
                  title="Editar"
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all flex items-center justify-center text-xs"
                >
                  ✏️
                </button>
                <button
                  onClick={() => { onDelete(env); setIsOpen(false) }}
                  title="Eliminar"
                  className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400/60 hover:text-red-300 transition-all flex items-center justify-center text-xs"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Separador + botón crear */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => { onCreate(); setIsOpen(false) }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all text-cyan-300 hover:text-cyan-200"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-cyan-500/15 border border-cyan-400/30">
            ＋
          </div>
          <span className="text-sm font-bold">Nuevo Ambiente</span>
        </button>
      </div>
    </div>
  ) : null

  return (
    <div className="relative">
      {/* Botón trigger */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/25 transition-all duration-200 group min-w-[200px]"
        style={activeEnv ? { borderColor: activeEnv.color + '44', boxShadow: `0 0 12px ${activeEnv.color}18` } : {}}
      >
        {activeEnv ? (
          <>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm"
              style={{ backgroundColor: activeEnv.color + '28', border: `1.5px solid ${activeEnv.color}55` }}
            >
              {activeEnv.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-white truncate fa-text-shadow">{activeEnv.name}</p>
              {activeEnv.description && (
                <p className="text-[10px] text-white/50 truncate">{activeEnv.description}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 bg-white/10 border border-white/20">
              🌐
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white/70">Sin ambiente</p>
              <p className="text-[10px] text-white/40">Selecciona o crea uno</p>
            </div>
          </>
        )}
        <span className={`text-white/50 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Dropdown renderizado via Portal para escapar cualquier stacking context */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
