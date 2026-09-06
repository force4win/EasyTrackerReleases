import { describe, it, expect } from 'vitest'
import { getEdgeColor } from '../components/BranchEdge'

describe('getEdgeColor', () => {
  it('debe retornar rojo para QA', () => {
    expect(getEdgeColor('QA')).toBe('#e74c3c')
  })

  it('debe retornar amarillo para STG', () => {
    expect(getEdgeColor('STG')).toBe('#f1c40f')
  })

  it('debe retornar morado para PROD', () => {
    expect(getEdgeColor('PROD')).toBe('#9b59b6')
  })

  it('debe retornar verde para DEV', () => {
    expect(getEdgeColor('DEV')).toBe('#2ecc71')
  })
})
