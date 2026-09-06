import { describe, it, expect } from 'vitest'
import { generateDefaultGitScript } from '../components/BranchCanvas'

describe('generateDefaultGitScript', () => {
  it('debe generar la secuencia de comandos Git correcta entre dos ramas', () => {
    const script = generateDefaultGitScript('BranchDEV', 'BranchQA')

    expect(script).toContain('git checkout BranchDEV')
    expect(script).toContain('git pull')
    expect(script).toContain('git checkout BranchQA')
    expect(script).toContain('git branch -D BranchQA_merge')
    expect(script).toContain('git checkout -b BranchQA_merge')
    expect(script).toContain('git merge BranchDEV')
    expect(script).toContain('git checkout BranchQA')
    expect(script).toContain('git merge BranchQA_merge')
  })
})
