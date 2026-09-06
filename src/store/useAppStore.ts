import { create } from 'zustand'
import type { Repository, Branch, Connection, Release, ReleaseRepository } from '../types/models'

interface AppState {
  // Data State
  repositories: Repository[]
  branches: Branch[]
  connections: Connection[]
  releases: Release[]
  releaseRepositories: ReleaseRepository[]
  
  // Active Selections
  activeRepositoryId: string | null
  activeReleaseId: string | null
  
  // Loading & Error States
  loading: boolean
  error: string | null

  // Actions - Global Data
  fetchAllData: () => Promise<void>
  fetchAllBranches: () => Promise<void>
  fetchAllConnections: () => Promise<void>

  // Actions - Repositories
  fetchRepositories: () => Promise<void>
  createRepository: (name: string, folderPath: string) => Promise<Repository | null>
  updateRepository: (id: string, name: string, folderPath: string) => Promise<void>
  deleteRepository: (id: string) => Promise<void>
  setActiveRepositoryId: (id: string | null) => void

  // Actions - Branches
  fetchBranches: (repositoryId: string) => Promise<void>
  createBranch: (data: Omit<Branch, 'id'>) => Promise<Branch | null>
  updateBranch: (branch: Branch) => Promise<void>
  deleteBranch: (id: string) => Promise<void>

  // Actions - Connections
  fetchConnections: (repositoryId: string) => Promise<void>
  createConnection: (data: Omit<Connection, 'id'>) => Promise<Connection | null>
  updateConnection: (connection: Connection) => Promise<void>
  deleteConnection: (id: string) => Promise<void>

  // Actions - Releases
  fetchReleases: () => Promise<void>
  createRelease: (name: string) => Promise<Release | null>
  deleteRelease: (id: string) => Promise<void>
  setActiveReleaseId: (id: string | null) => void

  // Actions - Release Repositories
  fetchReleaseRepositories: (releaseId?: string) => Promise<void>
  addReleaseRepository: (data: Omit<ReleaseRepository, 'id'>) => Promise<ReleaseRepository | null>
  removeReleaseRepository: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  repositories: [],
  branches: [],
  connections: [],
  releases: [],
  releaseRepositories: [],
  activeRepositoryId: null,
  activeReleaseId: null,
  loading: false,
  error: null,

  // Global Data
  fetchAllData: async () => {
    set({ loading: true, error: null })
    try {
      const [repositories, branches, connections, releases, releaseRepositories] = await Promise.all([
        window.electronAPI.repositories.getAll(),
        window.electronAPI.branches.getAll(),
        window.electronAPI.connections.getAll(),
        window.electronAPI.releases.getAll(),
        window.electronAPI.releaseRepos.getAll(),
      ])
      set({ repositories, branches, connections, releases, releaseRepositories, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener datos globales', loading: false })
    }
  },

  fetchAllBranches: async () => {
    try {
      const branches = await window.electronAPI.branches.getAll()
      set({ branches })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener todas las ramas' })
    }
  },

  fetchAllConnections: async () => {
    try {
      const connections = await window.electronAPI.connections.getAll()
      set({ connections })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener todas las conexiones' })
    }
  },

  // Repositories
  fetchRepositories: async () => {
    set({ loading: true, error: null })
    try {
      const repositories = await window.electronAPI.repositories.getAll()
      set({ repositories, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener repositorios', loading: false })
    }
  },

  createRepository: async (name, folderPath) => {
    set({ loading: true, error: null })
    try {
      const repo = await window.electronAPI.repositories.create({ name, folderPath })
      set(state => ({ repositories: [...state.repositories, repo], loading: false }))
      return repo
    } catch (err: any) {
      set({ error: err.message || 'Error al crear repositorio', loading: false })
      return null
    }
  },

  updateRepository: async (id, name, folderPath) => {
    set({ loading: true, error: null })
    try {
      const updated = await window.electronAPI.repositories.update({ id, name, folderPath })
      set(state => ({
        repositories: state.repositories.map(r => (r.id === id ? updated : r)),
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar repositorio', loading: false })
    }
  },

  deleteRepository: async id => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.repositories.delete(id)
      set(state => ({
        repositories: state.repositories.filter(r => r.id !== id),
        activeRepositoryId: state.activeRepositoryId === id ? null : state.activeRepositoryId,
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar repositorio', loading: false })
    }
  },

  setActiveRepositoryId: id => {
    set({ activeRepositoryId: id })
    if (id) {
      get().fetchBranches(id)
      get().fetchConnections(id)
    } else {
      set({ branches: [], connections: [] })
    }
  },

  // Branches
  fetchBranches: async repositoryId => {
    try {
      const branches = await window.electronAPI.branches.getByRepository(repositoryId)
      set({ branches })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener ramas' })
    }
  },

  createBranch: async data => {
    try {
      const newBranch = await window.electronAPI.branches.create(data)
      set(state => ({ branches: [...state.branches, newBranch] }))
      return newBranch
    } catch (err: any) {
      set({ error: err.message || 'Error al crear rama' })
      return null
    }
  },

  updateBranch: async branch => {
    try {
      const updated = await window.electronAPI.branches.update(branch)
      set(state => ({
        branches: state.branches.map(b => (b.id === branch.id ? updated : b)),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar rama' })
    }
  },

  deleteBranch: async id => {
    try {
      await window.electronAPI.branches.delete(id)
      set(state => ({
        branches: state.branches.filter(b => b.id !== id),
        connections: state.connections.filter(c => c.sourceBranchId !== id && c.targetBranchId !== id),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar rama' })
    }
  },

  // Connections
  fetchConnections: async repositoryId => {
    try {
      const connections = await window.electronAPI.connections.getByRepository(repositoryId)
      set({ connections })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener conexiones' })
    }
  },

  createConnection: async data => {
    try {
      const newConnection = await window.electronAPI.connections.create(data)
      set(state => ({ connections: [...state.connections, newConnection] }))
      return newConnection
    } catch (err: any) {
      set({ error: err.message || 'Error al crear conexión' })
      return null
    }
  },

  updateConnection: async connection => {
    try {
      const updated = await window.electronAPI.connections.update(connection)
      set(state => ({
        connections: state.connections.map(c => (c.id === connection.id ? updated : c)),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar conexión' })
    }
  },

  deleteConnection: async id => {
    try {
      await window.electronAPI.connections.delete(id)
      set(state => ({
        connections: state.connections.filter(c => c.id !== id),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar conexión' })
    }
  },

  // Releases
  fetchReleases: async () => {
    set({ loading: true, error: null })
    try {
      const releases = await window.electronAPI.releases.getAll()
      set({ releases, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener releases', loading: false })
    }
  },

  createRelease: async name => {
    set({ loading: true, error: null })
    try {
      const release = await window.electronAPI.releases.create({ name })
      set(state => ({ releases: [...state.releases, release], loading: false }))
      return release
    } catch (err: any) {
      set({ error: err.message || 'Error al crear release', loading: false })
      return null
    }
  },

  deleteRelease: async id => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.releases.delete(id)
      set(state => ({
        releases: state.releases.filter(r => r.id !== id),
        activeReleaseId: state.activeReleaseId === id ? null : state.activeReleaseId,
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar release', loading: false })
    }
  },

  setActiveReleaseId: id => {
    set({ activeReleaseId: id })
    get().fetchReleaseRepositories(id || undefined)
  },

  // Release Repositories
  fetchReleaseRepositories: async (releaseId?: string) => {
    try {
      if (releaseId) {
        const rrs = await window.electronAPI.releaseRepos.getByRelease(releaseId)
        set(state => {
          // Actualizar / fusionar los releaseRepositories de este release dentro de la lista global
          const otherRrs = state.releaseRepositories.filter(rr => rr.releaseId !== releaseId)
          return { releaseRepositories: [...otherRrs, ...rrs] }
        })
      } else {
        const releaseRepositories = await window.electronAPI.releaseRepos.getAll()
        set({ releaseRepositories })
      }
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener repositorios del release' })
    }
  },

  addReleaseRepository: async data => {
    try {
      const newRR = await window.electronAPI.releaseRepos.add(data)
      set(state => ({ releaseRepositories: [...state.releaseRepositories, newRR] }))
      return newRR
    } catch (err: any) {
      set({ error: err.message || 'Error al agregar repositorio al release' })
      return null
    }
  },

  removeReleaseRepository: async id => {
    try {
      await window.electronAPI.releaseRepos.remove(id)
      set(state => ({
        releaseRepositories: state.releaseRepositories.filter(rr => rr.id !== id),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al remover repositorio del release' })
    }
  },
}))
