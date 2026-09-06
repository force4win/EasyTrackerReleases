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

// Colores según el tipo de entorno de destino (basado en Storyboard Diapositivas 7, 10, 13)
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
          strokeWidth: selected ? 4 : 3,
          transition: 'stroke-width 0.2s',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] border border-cyan-300/40 px-2.5 py-1 rounded shadow-lg text-white text-xs font-semibold select-none transition-all"
        >
          {/* Label text */}
          <span className="truncate max-w-[140px]" title={data?.label}>
            {data?.label}
          </span>

          {/* Terminal / Console Icon Button (Diapositiva 9) */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (data?.connectionId && data?.onOpenConsole) {
                data.onOpenConsole(data.connectionId)
              }
            }}
            className="w-5 h-5 rounded bg-[#1e293b] hover:bg-[#0f172a] border border-cyan-400/50 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0"
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
              className="w-4 h-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] hidden group-hover:flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-0.5"
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
