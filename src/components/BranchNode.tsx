import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import type { BranchType } from '../types/models'

export type BranchNodeData = {
  label: string
  branchType: BranchType
  repositoryId: string
  onDelete?: (id: string) => void
}

export type BranchCustomNode = Node<BranchNodeData, 'branchNode'>

export const BranchNode = memo(({ id, data, selected }: NodeProps<BranchCustomNode>) => {
  return (
    <div
      className={`group relative px-6 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl min-w-[140px] text-center select-none transition-all duration-200 fa-glass-panel overflow-hidden border ${
        selected
          ? 'border-amber-300 ring-4 ring-amber-400/40 scale-105 shadow-amber-400/30'
          : 'border-cyan-300/40 hover:border-cyan-200 hover:scale-105 shadow-cyan-500/20'
      }`}
    >
      {/* Specular split highlight superior Frutiger Aero */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-full" />

      {/* Target and Source Handles for React Flow connections */}
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-cyan-300 !w-3.5 !h-3.5 !border-2 !border-white shadow-lg" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-amber-300 !w-3.5 !h-3.5 !border-2 !border-white shadow-lg" />
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-cyan-300 !w-3.5 !h-3.5 !border-2 !border-white shadow-lg" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-amber-300 !w-3.5 !h-3.5 !border-2 !border-white shadow-lg" />

      {/* Content */}
      <div className="flex flex-col items-center justify-center relative z-10">
        <span className="fa-text-shadow tracking-wide">{data.label}</span>
        <span className="text-[10px] font-mono text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-400/30 mt-1 uppercase tracking-wider font-semibold">
          {data.branchType}
        </span>
      </div>

      {/* Delete button on hover */}
      {data.onDelete && (
        <button
          onClick={e => {
            e.stopPropagation()
            data.onDelete?.(id)
          }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg cursor-pointer border border-white z-20"
          title="Eliminar rama"
        >
          ✕
        </button>
      )}
    </div>
  )
})

BranchNode.displayName = 'BranchNode'
