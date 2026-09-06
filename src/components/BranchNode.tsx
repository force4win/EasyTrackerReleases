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
      className={`group relative px-6 py-3 rounded-3xl bg-[#0b4f6c] border-2 text-white font-semibold text-sm shadow-xl min-w-[130px] text-center select-none transition-all ${
        selected ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-[#012a4a] hover:border-cyan-400'
      }`}
    >
      {/* Target and Source Handles for React Flow connections */}
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-cyan-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-amber-400 !w-3 !h-3" />
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-cyan-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-amber-400 !w-3 !h-3" />

      {/* Content */}
      <div className="flex flex-col items-center justify-center">
        <span>{data.label}</span>
        <span className="text-[10px] font-mono text-cyan-300 opacity-80 uppercase tracking-wider mt-0.5">
          [{data.branchType}]
        </span>
      </div>

      {/* Delete button on hover */}
      {data.onDelete && (
        <button
          onClick={e => {
            e.stopPropagation()
            data.onDelete?.(id)
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md cursor-pointer"
          title="Eliminar nodo"
        >
          ✕
        </button>
      )}
    </div>
  )
})

BranchNode.displayName = 'BranchNode'
