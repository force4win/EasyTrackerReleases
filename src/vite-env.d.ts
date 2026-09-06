/// <reference types="vite/client" />

import type {
  Repository,
  Branch,
  BranchType,
  Connection,
  Release,
  ReleaseRepository,
  DatabaseSchema,
} from './types/models'

interface ElectronAPI {
  ping: () => Promise<string>

  dialog: {
    selectFolder: () => Promise<string | null>
  }

  git: {
    getBranches: (folderPath: string) => Promise<string[]>
    validateRepoState: (folderPath: string) => Promise<{
      isValid: boolean
      hasUncommittedChanges: boolean
      hasUntrackedFiles: boolean
      currentBranch?: string
      error?: string
    }>
  }

  script: {
    execute: (data: {
      connectionId: string
      folderPath: string
      scriptText: string
    }) => Promise<{
      success: boolean
      isConflict?: boolean
      output: string
      failedLine?: string
      failedLineIndex?: number
      remainingLines?: string[]
      error?: string
    }>
    onStream: (
      callback: (data: {
        connectionId: string
        type: 'info' | 'stdout' | 'stderr' | 'success' | 'error'
        message: string
        lineIndex?: number
        timestamp: string
      }) => void
    ) => () => void
  }

  repositories: {
    getAll: () => Promise<Repository[]>
    create: (data: { name: string; folderPath: string }) => Promise<Repository>
    update: (data: { id: string; name: string; folderPath: string }) => Promise<Repository>
    delete: (id: string) => Promise<{ deleted: boolean; branchIds: string[] }>
  }

  branches: {
    getAll: () => Promise<Branch[]>
    getByRepository: (repositoryId: string) => Promise<Branch[]>
    create: (data: {
      name: string;
      branchType: BranchType;
      repositoryId: string;
      position: { x: number; y: number };
    }) => Promise<Branch>
    update: (data: Branch) => Promise<Branch>
    delete: (id: string) => Promise<{ deleted: boolean }>
  }

  connections: {
    getAll: () => Promise<Connection[]>
    getByRepository: (repositoryId: string) => Promise<Connection[]>
    create: (data: Omit<Connection, 'id'>) => Promise<Connection>
    update: (data: Connection) => Promise<Connection>
    delete: (id: string) => Promise<{ deleted: boolean }>
  }

  releases: {
    getAll: () => Promise<Release[]>
    create: (data: { name: string }) => Promise<Release>
    delete: (id: string) => Promise<{ deleted: boolean }>
  }

  releaseRepos: {
    getAll: () => Promise<ReleaseRepository[]>
    getByRelease: (releaseId: string) => Promise<ReleaseRepository[]>
    add: (data: Omit<ReleaseRepository, 'id'>) => Promise<ReleaseRepository>
    remove: (id: string) => Promise<{ deleted: boolean }>
  }

  db: {
    getAll: () => Promise<DatabaseSchema>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
