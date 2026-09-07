import { create } from 'zustand'
import type { Repository, Branch, Connection, Release, ReleaseRepository, Environment } from '../types/models'

interface AppState {
  // Data State
  environments: Environment[]
  repositories: Repository[]
  branches: Branch[]
  connections: Connection[]
  releases: Release[]
  releaseRepositories: ReleaseRepository[]

  // Active Selections
  activeEnvironmentId: string | null
  activeRepositoryId: string | null
  activeReleaseId: string | null

  // Loading & Error States
  loading: boolean
  error: string | null

  // Actions - App Init
  initializeApp: () => Promise<void>

  // Actions - Environments
  fetchEnvironments: () => Promise<void>
  createEnvironment: (data: Omit<Environment, 'id' | 'createdAt'>) => Promise<Environment | null>
  updateEnvironment: (env: Environment) => Promise<void>
  deleteEnvironment: (id: string) => Promise<void>
  setActiveEnvironmentId: (id: string) => Promise<void>

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
  environments: [],
  repositories: [],
  branches: [],
  connections: [],
  releases: [],
  releaseRepositories: [],
  activeEnvironmentId: null,
  activeRepositoryId: null,
  activeReleaseId: null,
  loading: false,
  error: null,

  // ==============================
  // App Init
  // ==============================
  initializeApp: async () => {
    set({ loading: true, error: null })
    try {
      const [environments, settings] = await Promise.all([
        window.electronAPI.environments.getAll(),
        window.electronAPI.settings.get(),
      ])

      // Determinar ambiente activo
      let activeId = settings.lastActiveEnvironmentId
      if (!activeId && environments.length > 0) {
        activeId = environments[0]?.id ?? null
      }

      set({ environments, activeEnvironmentId: activeId, loading: false })

      // Cargar repos y releases del ambiente activo
      if (activeId) {
        await get().fetchAllData()
      }
    } catch (err: any) {
      set({ error: err.message || 'Error al inicializar la app', loading: false })
    }
  },

  // ==============================
  // Environments
  // ==============================
  fetchEnvironments: async () => {
    try {
      const environments = await window.electronAPI.environments.getAll()
      set({ environments })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener ambientes' })
    }
  },

  createEnvironment: async (data) => {
    set({ loading: true, error: null })
    try {
      const env = await window.electronAPI.environments.create(data)
      set(state => ({ environments: [...state.environments, env], loading: false }))

      // Si es el primer ambiente, activarlo automáticamente
      if (get().activeEnvironmentId === null) {
        await get().setActiveEnvironmentId(env.id)
      }

      return env
    } catch (err: any) {
      set({ error: err.message || 'Error al crear ambiente', loading: false })
      return null
    }
  },

  updateEnvironment: async (env) => {
    try {
      const updated = await window.electronAPI.environments.update(env)
      set(state => ({
        environments: state.environments.map(e => e.id === env.id ? updated : e),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar ambiente' })
    }
  },

  deleteEnvironment: async (id) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.environments.delete(id)
      const state = get()
      const remaining = state.environments.filter(e => e.id !== id)

      set({
        environments: remaining,
        loading: false,
      })

      // Si se eliminó el ambiente activo, cambiar al primero disponible
      if (state.activeEnvironmentId === id) {
        if (remaining.length > 0) {
          await get().setActiveEnvironmentId(remaining[0]?.id ?? '')
        } else {
          set({
            activeEnvironmentId: null,
            repositories: [],
            releases: [],
            branches: [],
            connections: [],
            releaseRepositories: [],
            activeRepositoryId: null,
            activeReleaseId: null,
          })
        }
      }
    } catch (err: any) {
      set({ error: err.message || 'Error al eliminar ambiente', loading: false })
    }
  },

  setActiveEnvironmentId: async (id) => {
    set({
      activeEnvironmentId: id,
      activeRepositoryId: null,
      activeReleaseId: null,
      branches: [],
      connections: [],
    })
    // Persistir en settings
    await window.electronAPI.settings.update({ lastActiveEnvironmentId: id })
    // Recargar datos del nuevo ambiente
    await get().fetchAllData()
  },

  // ==============================
  // Global Data
  // ==============================
  fetchAllData: async () => {
    const { activeEnvironmentId } = get()
    set({ loading: true, error: null })
    try {
      const [repositories, branches, connections, releases, releaseRepositories] = await Promise.all([
        window.electronAPI.repositories.getAll(activeEnvironmentId ?? undefined),
        window.electronAPI.branches.getAll(),
        window.electronAPI.connections.getAll(),
        window.electronAPI.releases.getAll(activeEnvironmentId ?? undefined),
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

  // ==============================
  // Repositories
  // ==============================
  fetchRepositories: async () => {
    const { activeEnvironmentId } = get()
    set({ loading: true, error: null })
    try {
      const repositories = await window.electronAPI.repositories.getAll(activeEnvironmentId ?? undefined)
      set({ repositories, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener repositorios', loading: false })
    }
  },

  createRepository: async (name, folderPath) => {
    const { activeEnvironmentId } = get()
    if (!activeEnvironmentId) {
      set({ error: 'Debes seleccionar un ambiente antes de crear un repositorio' })
      return null
    }
    set({ loading: true, error: null })
    try {
      const repo = await window.electronAPI.repositories.create({ name, folderPath, environmentId: activeEnvironmentId })
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

  // ==============================
  // Branches
  // ==============================
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

  // ==============================
  // Connections
  // ==============================
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

  // ==============================
  // Releases
  // ==============================
  fetchReleases: async () => {
    const { activeEnvironmentId } = get()
    set({ loading: true, error: null })
    try {
      const releases = await window.electronAPI.releases.getAll(activeEnvironmentId ?? undefined)
      set({ releases, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al obtener releases', loading: false })
    }
  },

  createRelease: async name => {
    const { activeEnvironmentId } = get()
    if (!activeEnvironmentId) {
      set({ error: 'Debes seleccionar un ambiente antes de crear un release' })
      return null
    }
    set({ loading: true, error: null })
    try {
      const release = await window.electronAPI.releases.create({ name, environmentId: activeEnvironmentId })
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

  // ==============================
  // Release Repositories
  // ==============================
  fetchReleaseRepositories: async (releaseId?: string) => {
    try {
      if (releaseId) {
        const rrs = await window.electronAPI.releaseRepos.getByRelease(releaseId)
        set(state => {
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
