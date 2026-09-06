import { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import type { Connection as ReactFlowConnection, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BranchNode } from './BranchNode'
import { BranchEdge } from './BranchEdge'
import { BranchModal } from './BranchModal'
import { useAppStore } from '../store/useAppStore'
import type { Repository, BranchType } from '../types/models'

interface BranchCanvasProps {
  repository: Repository
  onOpenConsole?: (connectionId: string) => void
}

const nodeTypes = {
  branchNode: BranchNode,
}

const edgeTypes = {
  branchEdge: BranchEdge,
}

export function generateDefaultGitScript(sourceName: string, targetName: string): string {
  return `git checkout ${sourceName}
git pull
git checkout ${targetName}
git pull
git branch -D ${targetName}_merge
git checkout -b ${targetName}_merge
git merge ${sourceName}
git checkout ${targetName}
git merge ${targetName}_merge`
}

export function BranchCanvas({ repository, onOpenConsole }: BranchCanvasProps) {
  const {
    branches,
    connections,
    createBranch,
    updateBranch,
    deleteBranch,
    createConnection,
    deleteConnection,
  } = useAppStore()

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)

  // Callback to delete a branch node
  const handleDeleteNode = useCallback(
    async (id: string) => {
      if (confirm('¿Eliminar esta rama y sus conexiones del canvas?')) {
        await deleteBranch(id)
      }
    },
    [deleteBranch]
  )

  // Callback to delete a connection edge
  const handleDeleteEdge = useCallback(
    async (id: string) => {
      if (confirm('¿Eliminar esta conexión entre ramas?')) {
        await deleteConnection(id)
      }
    },
    [deleteConnection]
  )

  // Map Zustand branches to React Flow Nodes
  const initialNodes = useMemo(() => {
    return branches.map(b => ({
      id: b.id,
      type: 'branchNode',
      position: b.position || { x: 100, y: 100 },
      data: {
        label: b.name,
        branchType: b.branchType,
        repositoryId: b.repositoryId,
        onDelete: handleDeleteNode,
      },
    }))
  }, [branches, handleDeleteNode])

  // Map Zustand connections to React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map(c => {
      const targetBranch = branches.find(b => b.id === c.targetBranchId)
      return {
        id: c.id,
        source: c.sourceBranchId,
        target: c.targetBranchId,
        type: 'branchEdge',
        data: {
          label: c.label,
          targetBranchType: targetBranch?.branchType || 'DEV',
          script: c.script,
          connectionId: c.id,
          onOpenConsole,
          onDeleteEdge: handleDeleteEdge,
        },
      }
    })
  }, [connections, branches, onOpenConsole, handleDeleteEdge])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync React Flow nodes when Zustand branches change
  useMemo(() => {
    setNodes(
      branches.map(b => ({
        id: b.id,
        type: 'branchNode',
        position: b.position || { x: 100, y: 100 },
        data: {
          label: b.name,
          branchType: b.branchType,
          repositoryId: b.repositoryId,
          onDelete: handleDeleteNode,
        },
      }))
    )
  }, [branches, setNodes, handleDeleteNode])

  // Sync React Flow edges when Zustand connections or branches change
  useMemo(() => {
    setEdges(
      connections.map(c => {
        const targetBranch = branches.find(b => b.id === c.targetBranchId)
        return {
          id: c.id,
          source: c.sourceBranchId,
          target: c.targetBranchId,
          type: 'branchEdge',
          data: {
            label: c.label,
            targetBranchType: targetBranch?.branchType || ('DEV' as BranchType),
            script: c.script,
            connectionId: c.id,
            onOpenConsole,
            onDeleteEdge: handleDeleteEdge,
          },
        }
      })
    )
  }, [connections, branches, setEdges, onOpenConsole, handleDeleteEdge])

  // Save node position after dragging
  const handleNodeDragStop = useCallback(
    (_event: any, node: any) => {
      const branchToUpdate = branches.find(b => b.id === node.id)
      if (branchToUpdate) {
        updateBranch({
          ...branchToUpdate,
          position: { x: node.position.x, y: node.position.y },
        })
      }
    },
    [branches, updateBranch]
  )

  // Handle connecting two nodes (onConnect)
  const handleConnect = useCallback(
    async (params: ReactFlowConnection) => {
      if (!params.source || !params.target) return
      if (params.source === params.target) return // Prevent self connection

      const sourceBranch = branches.find(b => b.id === params.source)
      const targetBranch = branches.find(b => b.id === params.target)
      if (!sourceBranch || !targetBranch) return

      // Prevent duplicate connection in the same direction
      const existing = connections.find(
        c => c.sourceBranchId === params.source && c.targetBranchId === params.target
      )
      if (existing) return

      const label = `${sourceBranch.name} -> ${targetBranch.name}`
      const defaultScript = generateDefaultGitScript(sourceBranch.name, targetBranch.name)

      await createConnection({
        sourceBranchId: sourceBranch.id,
        targetBranchId: targetBranch.id,
        repositoryId: repository.id,
        label,
        script: defaultScript,
      })
    },
    [branches, connections, repository.id, createConnection]
  )

  const handleAddBranch = async (name: string, branchType: BranchType) => {
    const count = branches.length
    const x = 100 + (count % 3) * 250
    const y = 150 + Math.floor(count / 3) * 140

    await createBranch({
      name,
      branchType,
      repositoryId: repository.id,
      position: { x, y },
    })
  }

  return (
    <div className="relative w-full h-full bg-[#081e30] select-none">
      {/* Botón flotante Gelatinoso Fucsia para agregar rama */}
      <button
        onClick={() => setIsBranchModalOpen(true)}
        className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full fa-btn-purple text-white font-bold text-2xl flex items-center justify-center shadow-2xl cursor-pointer"
        title="Agregar Rama al Canvas"
      >
        +
      </button>

      {/* Canvas React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.8} color="#00e5ff33" />
        <Controls className="!bg-[#0c2540]/80 !backdrop-blur-md !border-cyan-400/40 !text-white !rounded-xl shadow-xl" />
      </ReactFlow>

      {/* Modal para agregar rama */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        folderPath={repository.folderPath}
        onSave={handleAddBranch}
      />
    </div>
  )
}
