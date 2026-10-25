import { describe, expect, it } from 'vitest'
import { normalize } from '../../lib/text'
import { SIZES, type ArrowWords } from './config'
import { DICTIONARY } from './dictionary'
import { families, generate } from './generator'

function check(g: ArrowWords) {
  const { width: W, height: H, solution, clues } = g
  const letter = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W && solution[r * W + c] !== null

  // Chaque suite de 2 lettres ou plus, dans les deux sens, est un mot avec sa définition.
  const runs: string[] = []
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      if (!letter(r, c)) continue
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        if (letter(r - dr, c - dc)) continue
        let len = 0
        while (letter(r + dr * len, c + dc * len)) len++
        if (len >= 2) runs.push(`${r},${c},${dr}`)
      }
      // Pas de lettre isolée.
      expect(letter(r, c - 1) || letter(r, c + 1) || letter(r - 1, c) || letter(r + 1, c)).toBe(true)
    }
  expect(clues).toHaveLength(runs.length)

  const answers = clues.map((c) => c.answer)
  expect(new Set(families(answers)).size).toBe(answers.length)

  const perDef = new Map<number, number>()
  for (const clue of clues) {
    expect(solution[clue.def]).toBeNull()
    expect(clue.cells.map((i) => solution[i]).join('')).toBe(clue.answer)
    expect(clue.text).toBeTruthy()
    perDef.set(clue.def, (perDef.get(clue.def) ?? 0) + 1)
  }
  for (const n of perDef.values()) expect(n).toBeLessThanOrEqual(2)
  // Chaque case définition sert à quelque chose.
  solution.forEach((v, i) => {
    if (v === null) expect(perDef.has(i)).toBe(true)
  })
}

describe('dictionnaire', () => {
  it('aucune définition ne contient sa réponse', () => {
    const bad = DICTIONARY.flatMap((e) =>
      [...e.easy, ...e.hard].filter((c) => normalize(c.replace(/[^\p{L}]+/gu, ' ')) && c.split(/[^\p{L}]+/u).some((w) => normalize(w) === e.word)).map((c) => `${e.word} : ${c}`),
    )
    expect(bad).toEqual([])
  })
})

describe('générateur de mots fléchés', () => {
  for (const { id } of SIZES) {
    it(`grille ${id} valide`, () => {
      for (let n = 0; n < 3; n++) check(generate(id, n % 2 ? 'difficile' : 'facile'))
    })
  }
})
