import { exec } from 'node:child_process'
import util from 'node:util'

const execPromise = util.promisify(exec)

export interface LocalGitBranch {
  name: string
  isCurrent: boolean
}

/**
 * Obtiene la lista de branches locales y remotos de un repositorio Git
 */
export async function getGitBranches(folderPath: string): Promise<string[]> {
  try {
    const { stdout } = await execPromise('git branch -a', { cwd: folderPath })
    const lines = stdout.split(/\r?\n/)
    const branchesSet = new Set<string>()

    for (const line of lines) {
      let trimmed = line.trim()
      if (!trimmed) continue

      // Remover indicador de branch actual '*'
      if (trimmed.startsWith('*')) {
        trimmed = trimmed.substring(1).trim()
      }

      // Evitar HEAD detacheados o remotos con ->
      if (trimmed.includes('->')) continue

      // Si es remoto 'remotes/origin/feature-xyz', limpiar prefijo si se desea o conservar
      if (trimmed.startsWith('remotes/origin/')) {
        trimmed = trimmed.replace('remotes/origin/', '')
      } else if (trimmed.startsWith('remotes/')) {
        trimmed = trimmed.replace(/^remotes\/[^/]+\//, '')
      }

      if (trimmed) {
        branchesSet.add(trimmed)
      }
    }

    return Array.from(branchesSet)
  } catch (err) {
    console.error('Error al ejecutar git branch:', err)
    return []
  }
}

export interface GitRepoValidation {
  isValid: boolean
  hasUncommittedChanges: boolean
  hasUntrackedFiles: boolean
  currentBranch?: string
  error?: string
}

/**
 * Valida el estado actual de un repositorio Git antes de ejecutar un script
 */
export async function validateGitRepoState(folderPath: string): Promise<GitRepoValidation> {
  try {
    const { stdout } = await execPromise('git status --porcelain', { cwd: folderPath })
    const lines = stdout.split(/\r?\n/).filter(l => l.trim().length > 0)

    const hasUncommittedChanges = lines.some(l => !l.startsWith('??'))
    const hasUntrackedFiles = lines.some(l => l.startsWith('??'))

    let currentBranch = ''
    try {
      const branchRes = await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: folderPath })
      currentBranch = branchRes.stdout.trim()
    } catch {
      // Ignorar si falla
    }

    return {
      isValid: true,
      hasUncommittedChanges,
      hasUntrackedFiles,
      currentBranch,
    }
  } catch (err: any) {
    return {
      isValid: false,
      hasUncommittedChanges: false,
      hasUntrackedFiles: false,
      error: `La carpeta no es un repositorio Git válido o no existe: ${err.message}`,
    }
  }
}
