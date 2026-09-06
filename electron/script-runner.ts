import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { BrowserWindow } from 'electron'

export interface ScriptExecutionResult {
  success: boolean
  isConflict?: boolean
  output: string
  failedLine?: string
  failedLineIndex?: number
  remainingLines?: string[]
  error?: string
}

/**
 * Encuentra el ejecutable de shell apropiado (Git Bash en Windows o sh en Unix)
 */
function getSystemShell(): { shell: string; isGitBash: boolean } {
  if (process.platform !== 'win32') {
    return { shell: '/bin/sh', isGitBash: false }
  }

  const gitPaths = [
    'C:\\Program Files\\Git\\bin\\sh.exe',
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\sh.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  ]

  for (const p of gitPaths) {
    if (fs.existsSync(p)) {
      return { shell: p, isGitBash: true }
    }
  }

  return { shell: 'cmd.exe', isGitBash: false }
}

/**
 * Sanitiza comandos legacy (ej. "if git branch --list...") para compatibilidad multi-plataforma
 */
function sanitizeCommandLine(cmdLine: string): string {
  const trimmed = cmdLine.trim()

  // Si detectamos un "if git branch --list <branch>; then git branch -D <branch>; fi"
  if (trimmed.includes('git branch --list') && trimmed.includes('git branch -D')) {
    const match = trimmed.match(/git branch -D\s+([^\s;]+)/) || trimmed.match(/git branch --list\s+([^\s;]+)/)
    if (match && match[1]) {
      const branchName = match[1]
      return `git branch -D ${branchName}`
    }
  }

  return trimmed
}

/**
 * Ejecuta una secuencia de comandos Git línea por línea en el directorio especificado.
 * Emite eventos IPC 'script:log' a la ventana principal para actualizar la consola en tiempo real.
 */
export async function executeGitScript(
  mainWindow: BrowserWindow | null,
  connectionId: string,
  folderPath: string,
  scriptText: string
): Promise<ScriptExecutionResult> {
  const lines = scriptText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))

  let fullOutput = ''

  const sendLog = (type: 'info' | 'stdout' | 'stderr' | 'success' | 'error', message: string, lineIndex?: number) => {
    fullOutput += message + '\n'
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('script:stream', {
        connectionId,
        type,
        message,
        lineIndex,
        timestamp: new Date().toLocaleTimeString(),
      })
    }
  }

  sendLog('info', `🚀 Iniciando secuencia de ${lines.length} pasos en: ${folderPath}`)

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i]!
    const { shell, isGitBash } = getSystemShell()
    const commandLine = sanitizeCommandLine(originalLine)

    sendLog('info', `[Paso ${i + 1}/${lines.length}] > ${commandLine}`, i)

    try {
      const exitCode = await runSingleCommand(commandLine, folderPath, sendLog, i, shell, isGitBash)
      const fullLogLower = fullOutput.toLowerCase()
      const isConflictErr = fullLogLower.includes('conflict') || fullLogLower.includes('automatic merge failed')
      const isMergeCmd = /^git\s+merge\s+/i.test(commandLine)

      if (isMergeCmd && isConflictErr) {
        const warnMsg = `⚠️ CONFLICTO DE MERGE DETECTADO al ejecutar "${commandLine}". Se requiere solución manual de conflictos.`
        sendLog('error', warnMsg, i)
        return {
          success: false,
          isConflict: true,
          output: fullOutput,
          failedLine: commandLine,
          failedLineIndex: i,
          remainingLines: lines.slice(i + 1),
          error: warnMsg,
        }
      }

      if (exitCode !== 0) {
        // Si es una eliminación de rama con "git branch -D" y el resultado es que la rama no existía, no es un fallo fatal
        const isBranchDelete = /^git\s+branch\s+-[dD]\s+/i.test(commandLine)
        const isNotFound = fullLogLower.includes('not found') || fullLogLower.includes('no encontrada') || fullLogLower.includes('error: branch')

        if (isBranchDelete && isNotFound) {
          sendLog('info', `ℹ️ La rama no existía previamente (se procede a crear una nueva limpia).`, i)
        } else {
          const errMsg = `❌ El paso ${i + 1} falló con código de salida ${exitCode}`
          sendLog('error', errMsg, i)
          return {
            success: false,
            output: fullOutput,
            failedLine: commandLine,
            failedLineIndex: i,
            remainingLines: lines.slice(i + 1),
            error: errMsg,
          }
        }
      }
      sendLog('success', `✔ Paso ${i + 1} completado con éxito`, i)
    } catch (err: any) {
      const errMsg = `❌ Error al ejecutar "${commandLine}": ${err.message}`
      sendLog('error', errMsg, i)
      return {
        success: false,
        output: fullOutput,
        failedLine: commandLine,
        failedLineIndex: i,
        error: errMsg,
      }
    }
  }

  sendLog('info', '✅ Secuencia de comandos finalizada exitosamente.')
  return { success: true, output: fullOutput }
}

function runSingleCommand(
  cmdLine: string,
  cwd: string,
  sendLog: (type: 'info' | 'stdout' | 'stderr' | 'success' | 'error', message: string, lineIndex?: number) => void,
  lineIndex: number,
  shellPath: string,
  isGitBash: boolean
): Promise<number> {
  return new Promise(resolve => {
    const isWin = process.platform === 'win32' && !isGitBash
    const args = isWin ? ['/c', cmdLine] : ['-c', cmdLine]

    const child = spawn(shellPath, args, {
      cwd,
      env: process.env,
    })

    child.stdout.on('data', data => {
      sendLog('stdout', data.toString().trimEnd(), lineIndex)
    })

    child.stderr.on('data', data => {
      sendLog('stderr', data.toString().trimEnd(), lineIndex)
    })

    child.on('error', err => {
      sendLog('error', err.message, lineIndex)
      resolve(1)
    })

    child.on('close', code => {
      resolve(code ?? 0)
    })
  })
}
