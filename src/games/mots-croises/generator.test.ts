import { describe, expect, it } from 'vitest'
import { families } from '../mots/fill'
import { roman, SIZES, type Crossword } from './config'
import { generate } from './generator'

function check(g: Crossword) {
  const { width: W, height: H, solution, clues } = g
  const black = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W && solution[r * W + c] === null

  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      // Deux cases noires ne se touchent jamais par un côté.
      if (black(r, c)) expect(black(r, c + 1) || black(r + 1, c)).toBe(false)
    }

  const answers = clues.map((c) => c.answer)
  expect(new Set(families(answers)).size).toBe(answers.length)
  for (const clue of clues) {
    expect(clue.cells.map((i) => solution[i]).join('')).toBe(clue.answer)
    expect(clue.text).toBeTruthy()
    const line = clue.dir === 'h' ? Math.floor(clue.cells[0] / W) : clue.cells[0] % W
    expect(clue.line).toBe(line)
  }
  // Horizontaux puis verticaux, dans l'ordre des lignes.
  const order = clues.map((c) => (c.dir === 'h' ? 0 : 100) + c.line)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  // Assez peu de cases noires.
  const size = SIZES.find((s) => s.id === g.size)!
  expect(solution.filter((v) => v === null).length).toBeLessThanOrEqual(Math.round(W * H * size.blocks))
}

describe('générateur de mots croisés', () => {
  for (const { id } of SIZES) {
    it(`grille ${id} valide`, () => {
      for (let n = 0; n < 3; n++) check(generate(id, n % 2 ? 'difficile' : 'facile'))
    })
  }

  it('numérote les lignes en chiffres romains', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(roman).join(' ')).toBe('I II III IV V VI VII VIII IX X XI')
  })
})
