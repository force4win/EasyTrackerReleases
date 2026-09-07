import { useState, useEffect } from 'react'
import type { Environment } from '../types/models'

interface EnvironmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Environment, 'id' | 'createdAt'>) => void
  editingEnv?: Environment | null
}

const PRESET_COLORS = [
  { hex: '#00e5ff', label: 'Cyan' },
  { hex: '#7c3aed', label: 'Púrpura' },
  { hex: '#16a34a', label: 'Verde' },
  { hex: '#ea580c', label: 'Naranja' },
  { hex: '#db2777', label: 'Rosa' },
  { hex: '#ca8a04', label: 'Ámbar' },
  { hex: '#0284c7', label: 'Azul' },
  { hex: '#dc2626', label: 'Rojo' },
]

const PRESET_ICONS = ['🏠', '💼', '🚀', '🌐', '⚡', '🔬', '🎯', '🌱', '🏗️', '🔐', '🎮', '🌙']

export default function EnvironmentModal({ isOpen, onClose, onSave, editingEnv }: EnvironmentModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#00e5ff')
  const [icon, setIcon] = useState('🏠')

  useEffect(() => {
    if (isOpen) {
      if (editingEnv) {
        setName(editingEnv.name)
        setDescription(editingEnv.description)
        setColor(editingEnv.color)
        setIcon(editingEnv.icon)
      } else {
        setName('')
        setDescription('')
        setColor('#00e5ff')
        setIcon('🏠')
      }
    }
  }, [isOpen, editingEnv])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), color, icon })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fa-glass-window relative z-10 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="fa-glass-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
              style={{ backgroundColor: color + '33', border: `1.5px solid ${color}66` }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white fa-text-shadow">
                {editingEnv ? 'Editar Ambiente' : 'Nuevo Ambiente'}
              </h2>
              <p className="text-xs text-cyan-200/70">Configura tu espacio de trabajo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-cyan-300/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Vista previa */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{
              background: `linear-gradient(135deg, ${color}18, ${color}08)`,
              borderColor: color + '44',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0"
              style={{ backgroundColor: color + '22', border: `2px solid ${color}55` }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold truncate fa-text-shadow">
                {name || 'Nombre del ambiente'}
              </p>
              <p className="text-xs text-cyan-100/60 truncate">
                {description || 'Descripción del ambiente'}
              </p>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-wider">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Desarrollo Local, Trabajo..."
              maxLength={40}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-wider">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ej. Proyectos personales en mi máquina..."
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Icono */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-wider">
              Icono
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-white/20 border-2 border-cyan-400/80 scale-110'
                      : 'bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-105'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-cyan-200/80 uppercase tracking-wider">
              Color de Identificación
            </label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className={`w-8 h-8 rounded-full transition-all shadow-lg ${
                    color === c.hex ? 'scale-125 ring-2 ring-white/60 ring-offset-2 ring-offset-transparent' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.hex}66` }}
                />
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="fa-btn-glass flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="fa-btn-cyan flex-1"
              style={color !== '#00e5ff' ? {
                background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
                boxShadow: `0 4px 20px ${color}44`,
              } : {}}
            >
              {editingEnv ? '💾 Guardar Cambios' : '✨ Crear Ambiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
