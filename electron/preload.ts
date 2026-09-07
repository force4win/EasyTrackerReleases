import { contextBridge, ipcRenderer } from 'electron'

/**
 * API segura expuesta al renderer vía contextBridge.
 * Cada método corresponde a un ipcMain.handle() en ipc-handlers.ts
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Verificación
  ping: () => ipcRenderer.invoke('ping'),

  // Diálogos nativos
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  },

  // Operaciones Git & Scripts
  git: {
    getBranches: (folderPath: string) => ipcRenderer.invoke('git:getBranches', folderPath),
    validateRepoState: (folderPath: string) => ipcRenderer.invoke('git:validateRepoState', folderPath),
  },

  script: {
    execute: (data: { connectionId: string; folderPath: string; scriptText: string }) =>
      ipcRenderer.invoke('script:execute', data),
    onStream: (callback: (data: any) => void) => {
      const listener = (_event: any, value: any) => callback(value)
      ipcRenderer.on('script:stream', listener)
      return () => {
        ipcRenderer.removeListener('script:stream', listener)
      }
    },
  },

  // Environments
  environments: {
    getAll: () => ipcRenderer.invoke('environments:getAll'),
    create: (data: { name: string; description: string; color: string; icon: string }) =>
      ipcRenderer.invoke('environments:create', data),
    update: (data: { id: string; name: string; description: string; color: string; icon: string; createdAt: string }) =>
      ipcRenderer.invoke('environments:update', data),
    delete: (id: string) =>
      ipcRenderer.invoke('environments:delete', id),
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data: { lastActiveEnvironmentId?: string | null }) =>
      ipcRenderer.invoke('settings:update', data),
  },

  // Repositories
  repositories: {
    getAll: (environmentId?: string) => ipcRenderer.invoke('repositories:getAll', environmentId),
    create: (data: { name: string; folderPath: string; environmentId: string }) =>
      ipcRenderer.invoke('repositories:create', data),
    update: (data: { id: string; name: string; folderPath: string }) =>
      ipcRenderer.invoke('repositories:update', data),
    delete: (id: string) =>
      ipcRenderer.invoke('repositories:delete', id),
  },

  // Branches
  branches: {
    getAll: () => ipcRenderer.invoke('branches:getAll'),
    getByRepository: (repositoryId: string) =>
      ipcRenderer.invoke('branches:getByRepository', repositoryId),
    create: (data: {
      name: string;
      branchType: string;
      repositoryId: string;
      position: { x: number; y: number };
    }) => ipcRenderer.invoke('branches:create', data),
    update: (data: {
      id: string;
      name: string;
      branchType: string;
      repositoryId: string;
      position: { x: number; y: number };
    }) => ipcRenderer.invoke('branches:update', data),
    delete: (id: string) =>
      ipcRenderer.invoke('branches:delete', id),
  },

  // Connections
  connections: {
    getAll: () => ipcRenderer.invoke('connections:getAll'),
    getByRepository: (repositoryId: string) =>
      ipcRenderer.invoke('connections:getByRepository', repositoryId),
    create: (data: {
      sourceBranchId: string;
      targetBranchId: string;
      repositoryId: string;
      script: string;
      label: string;
    }) => ipcRenderer.invoke('connections:create', data),
    update: (data: {
      id: string;
      sourceBranchId: string;
      targetBranchId: string;
      repositoryId: string;
      script: string;
      label: string;
    }) => ipcRenderer.invoke('connections:update', data),
    delete: (id: string) =>
      ipcRenderer.invoke('connections:delete', id),
  },

  // Releases
  releases: {
    getAll: (environmentId?: string) => ipcRenderer.invoke('releases:getAll', environmentId),
    create: (data: { name: string; environmentId: string }) =>
      ipcRenderer.invoke('releases:create', data),
    delete: (id: string) =>
      ipcRenderer.invoke('releases:delete', id),
  },

  // Release <-> Repositories
  releaseRepos: {
    getAll: () => ipcRenderer.invoke('releaseRepos:getAll'),
    getByRelease: (releaseId: string) =>
      ipcRenderer.invoke('releaseRepos:getByRelease', releaseId),
    add: (data: {
      releaseId: string;
      repositoryId: string;
      connectionIds: string[];
    }) => ipcRenderer.invoke('releaseRepos:add', data),
    remove: (id: string) =>
      ipcRenderer.invoke('releaseRepos:remove', id),
  },

  // Database
  db: {
    getAll: () => ipcRenderer.invoke('db:getAll'),
  },
})
