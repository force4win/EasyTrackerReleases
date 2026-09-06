import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react'
import type { EdgeProps, Edge } from '@xyflow/react'
import type { BranchType } from '../types/models'

export type BranchEdgeData = {
  label: string
  targetBranchType: BranchType
  script: string
  connectionId: string
  onOpenConsole?: (connectionId: string) => void
  onDeleteEdge?: (connectionId: string) => void
}

export type BranchCustomEdge = Edge<BranchEdgeData, 'branchEdge'>

export function getEdgeColor(targetType: BranchType): string {
  switch (targetType) {
    case 'QA':
      return '#e74c3c' // Rojo
    case 'STG':
      return '#f1c40f' // Amarillo
    case 'PROD':
      return '#9b59b6' // Morado
    case 'CV':
      return '#3498db' // Azul
    case 'DEV':
    default:
      return '#2ecc71' // Verde
  }
}

export const BranchEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<BranchCustomEdge>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const edgeColor = getEdgeColor(data?.targetBranchType || 'DEV')

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 4.5 : 3.5,
          filter: `drop-shadow(0 0 6px ${edgeColor}aa)`,
          transition: 'all 0.2s ease',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group flex items-center gap-2.5 fa-btn-cyan px-4 py-2 rounded-full shadow-2xl text-white text-xs font-bold select-none border border-white/40 cursor-pointer"
        >
          {/* Label text con espacio amplio */}
          <span className="truncate max-w-[160px] fa-text-shadow tracking-wide font-sans" title={data?.label}>
            {data?.label}
          </span>

          {/* Terminal / Console Icon Button holgado */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (data?.connectionId && data?.onOpenConsole) {
                data.onOpenConsole(data.connectionId)
              }
            }}
            className="w-6 h-6 rounded-lg bg-black/40 hover:bg-black/70 border border-white/40 flex items-center justify-center text-[11px] font-mono font-bold text-cyan-200 hover:text-white transition-colors cursor-pointer shrink-0 shadow-inner"
            title="Abrir editor de comandos y consola"
          >
            &gt;_
          </button>

          {/* Delete edge button on hover */}
          {data?.onDeleteEdge && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (data?.connectionId) {
                  data?.onDeleteEdge?.(data.connectionId)
                }
              }}
              className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] hidden group-hover:flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-0.5 border border-white/50"
              title="Eliminar conexión"
            >
              ✕
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

BranchEdge.displayName = 'BranchEdge'
