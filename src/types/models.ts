// ==============================
// MODELO DE DATOS — Generador de Releases
// ==============================

/** Tipos estándar de branch/entorno */
export type BranchType = 'DEV' | 'QA' | 'STG' | 'CV' | 'PROD'

/** Estado de ejecución de un script */
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled'

// --- Entidades principales ---

/** Repositorio Git local */
export interface Repository {
  id: string
  name: string
  folderPath: string
  createdAt: string
}

/** Branch configurado dentro de un repositorio */
export interface Branch {
  id: string
  name: string                // Nombre real del branch en Git (ej. "BranchDEV")
  branchType: BranchType      // Tipo lógico (ej. "DEV")
  repositoryId: string
  /** Posición del nodo en el canvas de React Flow */
  position: { x: number; y: number }
}

/** Conexión direccional entre dos branches (flecha en el canvas) */
export interface Connection {
  id: string
  sourceBranchId: string
  targetBranchId: string
  repositoryId: string
  /** Script de comandos Git a ejecutar para esta transición */
  script: string
  /** Etiqueta visible (ej. "BranchDEV -> BranchQA") */
  label: string
}

/** Release: agrupación de repositorios para un despliegue */
export interface Release {
  id: string
  name: string
  createdAt: string
}

/** Asociación entre un Release y un Repositorio con sus conexiones seleccionadas */
export interface ReleaseRepository {
  id: string
  releaseId: string
  repositoryId: string
  connectionIds: string[]     // IDs de las conexiones incluidas en este release
}

/** Log de ejecución de un script */
export interface ExecutionLog {
  id: string
  connectionId: string
  releaseId: string | null     // null si se ejecutó individualmente (no desde un release)
  repositoryId: string
  status: ExecutionStatus
  startedAt: string
  finishedAt: string | null
  output: string               // Salida acumulada del proceso
  error: string | null         // Mensaje de error si falló
}

// --- Esquema de la base de datos ---

/** Estructura completa del archivo data.json */
export interface DatabaseSchema {
  repositories: Repository[]
  branches: Branch[]
  connections: Connection[]
  releases: Release[]
  releaseRepositories: ReleaseRepository[]
  executionLogs: ExecutionLog[]
}

/** Esquema vacío por defecto */
export const DEFAULT_DB: DatabaseSchema = {
  repositories: [],
  branches: [],
  connections: [],
  releases: [],
  releaseRepositories: [],
  executionLogs: [],
}
