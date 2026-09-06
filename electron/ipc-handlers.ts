/**
 * IPC Handlers — Registra todos los canales de comunicación entre
 * el main process y el renderer.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { v4 as uuid } from 'uuid'
import { getDB, updateCollection } from './database'
import { getGitBranches, validateGitRepoState } from './git-service'
import { executeGitScript } from './script-runner'
import type { Repository, Branch, Connection, Release, ReleaseRepository } from '../src/types/models'

// ==============================
// GIT & SCRIPT OPERATIONS
// ==============================

ipcMain.handle('git:getBranches', async (_event, folderPath: string) => {
  return await getGitBranches(folderPath)
})

ipcMain.handle('git:validateRepoState', async (_event, folderPath: string) => {
  return await validateGitRepoState(folderPath)
})

ipcMain.handle(
  'script:execute',
  async (_event, data: { connectionId: string; folderPath: string; scriptText: string }) => {
    const mainWindow = BrowserWindow.getAllWindows()[0] || null
    return await executeGitScript(mainWindow, data.connectionId, data.folderPath, data.scriptText)
  }
)

// ==============================
// DIALOGS
// ==============================

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Seleccionar carpeta del repositorio Git',
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

// ==============================
// REPOSITORIES
// ==============================

ipcMain.handle('repositories:getAll', () => {
  return getDB().repositories
})

ipcMain.handle('repositories:create', (_event, data: { name: string; folderPath: string }) => {
  const newRepo: Repository = {
    id: uuid(),
    name: data.name,
    folderPath: data.folderPath,
    createdAt: new Date().toISOString(),
  }
  updateCollection('repositories', repos => [...repos, newRepo])
  return newRepo
})

ipcMain.handle('repositories:update', (_event, data: { id: string; name: string; folderPath: string }) => {
  const updated = updateCollection('repositories', repos =>
    repos.map(r => r.id === data.id ? { ...r, name: data.name, folderPath: data.folderPath } : r)
  )
  return updated.find(r => r.id === data.id)
})

ipcMain.handle('repositories:delete', (_event, id: string) => {
  // Eliminar en cascada: branches, connections, releaseRepositories relacionados
  const db = getDB()
  const branchIds = db.branches.filter(b => b.repositoryId === id).map(b => b.id)

  updateCollection('connections', conns =>
    conns.filter(c => c.repositoryId !== id)
  )
  updateCollection('branches', branches =>
    branches.filter(b => b.repositoryId !== id)
  )
  updateCollection('releaseRepositories', rrs =>
    rrs.filter(rr => rr.repositoryId !== id)
  )
  updateCollection('repositories', repos =>
    repos.filter(r => r.id !== id)
  )

  return { deleted: true, branchIds }
})

// ==============================
// BRANCHES
// ==============================

ipcMain.handle('branches:getAll', () => {
  return getDB().branches
})

ipcMain.handle('branches:getByRepository', (_event, repositoryId: string) => {
  return getDB().branches.filter(b => b.repositoryId === repositoryId)
})

ipcMain.handle('branches:create', (_event, data: Omit<Branch, 'id'>) => {
  const newBranch: Branch = {
    id: uuid(),
    ...data,
  }
  updateCollection('branches', branches => [...branches, newBranch])
  return newBranch
})

ipcMain.handle('branches:update', (_event, data: Branch) => {
  updateCollection('branches', branches =>
    branches.map(b => b.id === data.id ? data : b)
  )
  return data
})

ipcMain.handle('branches:delete', (_event, id: string) => {
  // Eliminar conexiones que referencien este branch
  updateCollection('connections', conns =>
    conns.filter(c => c.sourceBranchId !== id && c.targetBranchId !== id)
  )
  updateCollection('branches', branches =>
    branches.filter(b => b.id !== id)
  )
  return { deleted: true }
})

// ==============================
// CONNECTIONS
// ==============================

ipcMain.handle('connections:getAll', () => {
  return getDB().connections
})

ipcMain.handle('connections:getByRepository', (_event, repositoryId: string) => {
  return getDB().connections.filter(c => c.repositoryId === repositoryId)
})

ipcMain.handle('connections:create', (_event, data: Omit<Connection, 'id'>) => {
  const newConnection: Connection = {
    id: uuid(),
    ...data,
  }
  updateCollection('connections', conns => [...conns, newConnection])
  return newConnection
})

ipcMain.handle('connections:update', (_event, data: Connection) => {
  updateCollection('connections', conns =>
    conns.map(c => c.id === data.id ? data : c)
  )
  return data
})

ipcMain.handle('connections:delete', (_event, id: string) => {
  updateCollection('connections', conns => conns.filter(c => c.id !== id))
  return { deleted: true }
})

// ==============================
// RELEASES
// ==============================

ipcMain.handle('releases:getAll', () => {
  return getDB().releases
})

ipcMain.handle('releases:create', (_event, data: { name: string }) => {
  const newRelease: Release = {
    id: uuid(),
    name: data.name,
    createdAt: new Date().toISOString(),
  }
  updateCollection('releases', releases => [...releases, newRelease])
  return newRelease
})

ipcMain.handle('releases:delete', (_event, id: string) => {
  updateCollection('releaseRepositories', rrs =>
    rrs.filter(rr => rr.releaseId !== id)
  )
  updateCollection('releases', releases =>
    releases.filter(r => r.id !== id)
  )
  return { deleted: true }
})

// ==============================
// RELEASE <-> REPOSITORIES
// ==============================

ipcMain.handle('releaseRepos:getAll', () => {
  return getDB().releaseRepositories
})

ipcMain.handle('releaseRepos:getByRelease', (_event, releaseId: string) => {
  return getDB().releaseRepositories.filter(rr => rr.releaseId === releaseId)
})

ipcMain.handle('releaseRepos:add', (_event, data: Omit<ReleaseRepository, 'id'>) => {
  const newRR: ReleaseRepository = {
    id: uuid(),
    ...data,
  }
  updateCollection('releaseRepositories', rrs => [...rrs, newRR])
  return newRR
})

ipcMain.handle('releaseRepos:remove', (_event, id: string) => {
  updateCollection('releaseRepositories', rrs => rrs.filter(rr => rr.id !== id))
  return { deleted: true }
})

// ==============================
// DATABASE INFO
// ==============================

ipcMain.handle('db:getAll', () => {
  return getDB()
})
