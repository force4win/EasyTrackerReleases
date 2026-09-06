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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[var(--color-bg-surface)] border-l border-[var(--color-primary)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header — basado en Diapositiva 9 */}
      <div className="px-6 py-4 bg-[#ea580c] border-b border-orange-700 flex justify-between items-center text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>&gt;_ Consola: {connection.label}</span>
          </div>
          <p className="text-xs font-mono opacity-90 mt-0.5 truncate max-w-md">
            {repository.name} ({repository.folderPath})
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-orange-200 text-2xl font-bold cursor-pointer transition-colors"
          title="Cerrar consola"
        >
          ✕
        </button>
      </div>

      {/* Main Content: Split Editor and Console */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* Editor section */}
        <div className="flex flex-col bg-[#1e293b] rounded-xl border border-slate-700 p-3 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Secuencia de Comandos (Pseudocódigo / Git)
            </span>
            <div className="flex items-center gap-2">
              {isSaved && <span className="text-xs text-green-400 font-medium">¡Guardado!</span>}
              <button
                onClick={handleSaveScript}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded font-medium transition-colors cursor-pointer"
              >
                Guardar Script
              </button>
            </div>
          </div>
          <textarea
            value={scriptText}
            onChange={e => setScriptText(e.target.value)}
            rows={7}
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-cyan-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-orange-500 resize-y"
            placeholder="Ingresa los comandos de Git..."
          />
        </div>

        {/* Action controls */}
        <div className="flex justify-between items-center bg-[#18181b] p-3 rounded-xl border border-zinc-800">
          <div className="flex gap-2">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
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
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-colors cursor-pointer"
          >
            ⟳ Limpiar Consola
          </button>
        </div>

        {/* Execution Error alert box (Diapositiva 9 requirement) */}
        {executionError && (
          <div className="p-4 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl shadow-lg animate-pulse">
            <div className="font-bold text-sm mb-1 flex items-center gap-2">
              <span>⚠️ EJECUCIÓN PAUSADA — INTERVENCIÓN REQUERIDA</span>
            </div>
            <p className="font-mono">{executionError}</p>
            <p className="mt-2 text-[11px] opacity-80">
              Revisa los logs abajo para identificar en qué paso falló. Puedes corregir el script o el repositorio y volver a pulsar "Ejecutar Comandos".
            </p>
          </div>
        )}

        {/* Live Terminal Output Console (Diapositiva 9) */}
        <div className="flex-1 min-h-[220px] bg-[#0c0a09] border border-stone-800 rounded-xl p-4 font-mono text-xs overflow-y-auto shadow-inner space-y-1">
          <div className="text-stone-500 text-[11px] pb-2 border-b border-stone-800 mb-2">
            --- CONSOLA DE SALIDA ---
          </div>

          {logs.length === 0 ? (
            <div className="text-stone-600 italic">Pulsa "Ejecutar Comandos" para ver la salida en tiempo real...</div>
          ) : (
            logs.map((log, index) => {
              let colorClass = 'text-stone-300'
              if (log.type === 'info') colorClass = 'text-cyan-400 font-semibold'
              if (log.type === 'stdout') colorClass = 'text-emerald-300'
              if (log.type === 'stderr') colorClass = 'text-amber-400'
              if (log.type === 'success') colorClass = 'text-green-400 font-bold'
              if (log.type === 'error') colorClass = 'text-red-400 font-bold bg-red-950/40 p-1 rounded border border-red-800'

              return (
                <div key={index} className={`leading-relaxed ${colorClass}`}>
                  <span className="text-[10px] text-stone-600 mr-2 select-none">[{log.timestamp}]</span>
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
