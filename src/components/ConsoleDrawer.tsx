import { useState, useEffect, useRef } from 'react'
import type { Connection, Repository } from '../types/models'
import { useAppStore } from '../store/useAppStore'
import { ConflictResolutionModal } from './ConflictResolutionModal'

interface ConsoleDrawerProps {
  isOpen: boolean
  onClose: () => void
  connection: Connection | null
  repository: Repository | null
}

interface LogEntry {
  type: 'info' | 'stdout' | 'stderr' | 'success' | 'error'
  message: string
  lineIndex?: number
  timestamp: string
}

export function ConsoleDrawer({ isOpen, onClose, connection, repository }: ConsoleDrawerProps) {
  const { updateConnection } = useAppStore()
  const [scriptText, setScriptText] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean
    failedLine?: string
    remainingLines: string[]
  }>({
    isOpen: false,
    remainingLines: [],
  })
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (connection) {
      setScriptText(connection.script)
      setLogs([])
      setExecutionError(null)
      setIsSaved(false)
      setConflictData({ isOpen: false, remainingLines: [] })
    }
  }, [connection])

  // Listen to live execution stream
  useEffect(() => {
    if (!isOpen || !connection) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    const unsubscribe = window.electronAPI.script.onStream(data => {
      if (data.connectionId === connection.id) {
        setLogs(prev => [...prev, data])
      }
    })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      unsubscribe()
    }
  }, [isOpen, connection, onClose])

  // Auto-scroll console output to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (!isOpen || !connection || !repository) return null

  const handleSaveScript = async () => {
    await updateConnection({
      ...connection,
      script: scriptText,
    })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleExecute = async () => {
    if (isExecuting) return
    setIsExecuting(true)
    setExecutionError(null)
    setLogs([])

    // 1. Validar el estado del repositorio Git antes de ejecutar (Misión 12)
    try {
      const validation = await window.electronAPI.git.validateRepoState(repository.folderPath)
      if (!validation.isValid) {
        setExecutionError(validation.error || 'Repositorio no válido')
        setIsExecuting(false)
        return
      }

      if (validation.hasUncommittedChanges) {
        const proceed = confirm(
          '⚠️ ADVERTENCIA: El repositorio contiene cambios sin commitear.\n¿Deseas continuar de todas formas?'
        )
        if (!proceed) {
          setIsExecuting(false)
          return
        }
      }
    } catch {
      // Continuar si falla la validación
    }

    // Save script changes before executing
    await updateConnection({
      ...connection,
      script: scriptText,
    })

    try {
      const result = await window.electronAPI.script.execute({
        connectionId: connection.id,
        folderPath: repository.folderPath,
        scriptText,
      })

      if (result.isConflict) {
        setConflictData({
          isOpen: true,
          failedLine: result.failedLine,
          remainingLines: result.remainingLines || [],
        })
        return
      }

      if (!result.success) {
        setExecutionError(result.error || 'La secuencia de comandos falló.')
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Error al ejecutar los comandos.')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleResolveConflict = async () => {
    setConflictData(prev => ({ ...prev, isOpen: false }))
    if (!connection || !repository) return

    if (conflictData.remainingLines.length > 0) {
      const remainingScript = conflictData.remainingLines.join('\n')
      setIsExecuting(true)
      try {
        const result = await window.electronAPI.script.execute({
          connectionId: connection.id,
          folderPath: repository.folderPath,
          scriptText: remainingScript,
        })

        if (result.isConflict) {
          setConflictData({
            isOpen: true,
            failedLine: result.failedLine,
            remainingLines: result.remainingLines || [],
          })
          return
        }

        if (!result.success) {
          setExecutionError(result.error || 'La continuación tras resolver el conflicto falló.')
        }
      } catch (err: any) {
        setExecutionError(err.message || 'Error al ejecutar la continuación.')
      } finally {
        setIsExecuting(false)
      }
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#091b2c]/95 backdrop-blur-2xl border-l border-cyan-400/40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 select-none">
      {/* Header Frutiger Aero con padding amplio */}
      <div className="px-8 py-5 fa-glass-header-orange flex justify-between items-center text-white shadow-md shrink-0">
        <div>
          <div className="flex items-center gap-3 font-extrabold text-xl fa-text-shadow">
            <span>&gt;_ Consola: {connection.label}</span>
          </div>
          <p className="text-xs font-mono text-orange-100 mt-1 truncate max-w-lg">
            {repository.name} ({repository.folderPath})
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-orange-200 text-2xl font-bold cursor-pointer transition-colors p-1"
          title="Cerrar consola"
        >
          ✕
        </button>
      </div>

      {/* Main Content: Split Editor and Console */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* Editor section */}
        <div className="flex flex-col bg-black/40 rounded-2xl border border-cyan-500/30 p-5 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 fa-text-shadow">
              Secuencia de Comandos (Pseudocódigo / Git)
            </span>
            <div className="flex items-center gap-3">
              {isSaved && <span className="text-xs text-emerald-400 font-bold animate-pulse">¡Guardado!</span>}
              <button
                onClick={handleSaveScript}
                className="fa-btn-cyan text-xs rounded-xl font-bold transition-all cursor-pointer"
              >
                Guardar Script
              </button>
            </div>
          </div>
          <textarea
            value={scriptText}
            onChange={e => setScriptText(e.target.value)}
            rows={8}
            className="w-full bg-[#05111e]/90 border border-cyan-500/40 rounded-xl p-4 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-300 resize-y shadow-inner"
            placeholder="Ingresa los comandos de Git..."
          />
        </div>

        {/* Action controls */}
        <div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="fa-btn-green disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2.5 cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <span className="animate-spin text-base">⏳</span> Ejecutando...
                </>
              ) : (
                <>
                  <span className="text-base">▶</span> Ejecutar Comandos
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setLogs([])}
            className="fa-btn-glass text-xs rounded-xl transition-colors cursor-pointer"
          >
            ⟳ Limpiar Consola
          </button>
        </div>

        {/* Execution Error alert box */}
        {executionError && (
          <div className="p-5 bg-red-950/90 border border-red-500 text-red-200 text-xs rounded-2xl shadow-xl animate-pulse space-y-1.5">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>⚠️ EJECUCIÓN PAUSADA — INTERVENCIÓN REQUERIDA</span>
            </div>
            <p className="font-mono">{executionError}</p>
            <p className="text-[11px] opacity-80 pt-1">
              Revisa los logs abajo para identificar en qué paso falló. Puedes corregir el script o el repositorio y volver a pulsar "Ejecutar Comandos".
            </p>
          </div>
        )}

        {/* Live Terminal Output Console */}
        <div className="flex-1 min-h-[260px] bg-[#050c14] border border-cyan-500/30 rounded-2xl p-5 font-mono text-xs overflow-y-auto shadow-inner space-y-2">
          <div className="text-cyan-400/60 text-[11px] pb-2 border-b border-cyan-500/20 mb-3 font-bold tracking-wider">
            --- CONSOLA DE SALIDA ---
          </div>

          {logs.length === 0 ? (
            <div className="text-stone-500 italic p-2">Pulsa "Ejecutar Comandos" para ver la salida en tiempo real...</div>
          ) : (
            logs.map((log, index) => {
              let colorClass = 'text-stone-300'
              if (log.type === 'info') colorClass = 'text-cyan-300 font-semibold'
              if (log.type === 'stdout') colorClass = 'text-emerald-300'
              if (log.type === 'stderr') colorClass = 'text-amber-300'
              if (log.type === 'success') colorClass = 'text-green-300 font-bold'
              if (log.type === 'error') colorClass = 'text-red-400 font-bold bg-red-950/40 p-2 rounded-xl border border-red-800'

              return (
                <div key={index} className={`leading-relaxed py-0.5 ${colorClass}`}>
                  <span className="text-[10px] text-cyan-500/60 mr-3 select-none">[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              )
            })
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>

      <ConflictResolutionModal
        isOpen={conflictData.isOpen}
        repositoryName={repository.name}
        folderPath={repository.folderPath}
        failedLine={conflictData.failedLine}
        onResolved={handleResolveConflict}
        onCancel={() => setConflictData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
