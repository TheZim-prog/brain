import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, generate } from './generator'
import { CELLS, PEERS, countSolutions, solve } from './solver'

function isValidSolution(grid: number[]) {
  return grid.every((v, i) => v >= 1 && v <= 9 && PEERS[i].every((p) => grid[p] !== v))
}

describe('solveur', () => {
  it('résout une grille connue', () => {
    const puzzle =
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number)
    const solution = solve(puzzle)!
    expect(isValidSolution(solution)).toBe(true)
    expect(solution.join('')).toBe('534678912672195348198342567859761423426853791713924856961537284287419635345286179')
    expect(countSolutions(puzzle)).toBe(1)
  })

  it('détecte les grilles à plusieurs solutions ou impossibles', () => {
    expect(countSolutions(Array(CELLS).fill(0))).toBe(2)
    const invalid = Array(CELLS).fill(0)
    invalid[0] = 5
    invalid[1] = 5
    expect(countSolutions(invalid)).toBe(0)
  })
})

describe('générateur', () => {
  for (const { id, clues } of DIFFICULTIES) {
    it(`produit une grille ${id} valide et à solution unique`, () => {
      const { puzzle, solution } = generate(id)
      expect(isValidSolution(solution)).toBe(true)
      expect(puzzle.every((v, i) => v === 0 || v === solution[i])).toBe(true)
      expect(countSolutions(puzzle)).toBe(1)
      const given = puzzle.filter(Boolean).length
      expect(given).toBeGreaterThanOrEqual(clues)
      expect(given).toBeLessThanOrEqual(clues + 6)
    })
  }
})
