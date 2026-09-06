/**
 * Servicio de persistencia basado en JSON local.
 * Lee/escribe un archivo data.json en la carpeta de datos de la app de Electron.
 * Se usa en el main process exclusivamente.
 */
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { DatabaseSchema } from '../src/types/models'
import { DEFAULT_DB } from '../src/types/models'

let dbPath: string
let cache: DatabaseSchema | null = null

/** Inicializa la ruta al archivo de datos */
export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  dbPath = path.join(userDataPath, 'data.json')

  // Crear el archivo si no existe
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8')
  }

  // Cargar en memoria
  cache = readFromDisk()
}

/** Lee la BD completa del disco */
function readFromDisk(): DatabaseSchema {
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8')
    const parsed = JSON.parse(raw) as DatabaseSchema
    // Asegurar que todas las colecciones existan (por si el archivo es viejo)
    return {
      repositories: parsed.repositories ?? [],
      branches: parsed.branches ?? [],
      connections: parsed.connections ?? [],
      releases: parsed.releases ?? [],
      releaseRepositories: parsed.releaseRepositories ?? [],
      executionLogs: parsed.executionLogs ?? [],
    }
  } catch {
    return { ...DEFAULT_DB }
  }
}

/** Escribe la BD completa al disco */
function writeToDisk(data: DatabaseSchema): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
  cache = data
}

/** Obtiene la BD actual (desde cache) */
export function getDB(): DatabaseSchema {
  if (!cache) {
    cache = readFromDisk()
  }
  return cache
}

/** Actualiza la BD completa */
export function setDB(data: DatabaseSchema): void {
  writeToDisk(data)
}

/**
 * Helper genérico para actualizar una colección específica.
 * Ejemplo: updateCollection('repositories', repos => [...repos, newRepo])
 */
export function updateCollection<K extends keyof DatabaseSchema>(
  key: K,
  updater: (current: DatabaseSchema[K]) => DatabaseSchema[K],
): DatabaseSchema[K] {
  const db = getDB()
  const updated = updater(db[key])
  const newDb = { ...db, [key]: updated }
  writeToDisk(newDb)
  return updated
}

/** Retorna la ruta al archivo de la BD (útil para debug) */
export function getDatabasePath(): string {
  return dbPath
}
