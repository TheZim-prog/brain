import { describe, expect, it } from 'vitest'
import { generate, LEVELS, SIZES, type NumberCross } from './generator'
import { propertiesOf } from './properties'

function check(g: NumberCross) {
  const { width: W, solution, clues } = g
  for (const clue of clues) {
    expect(clue.cells.map((c) => solution[c]).join('')).toBe(clue.answer)
    expect(clue.answer[0]).not.toBe('0')
    expect(clue.answer.length).toBeGreaterThanOrEqual(2)
    expect(clue.answer.length).toBeLessThanOrEqual(5)
    expect(clue.text).toBeTruthy()
    expect(clue.text.split(', ').length).toBeLessThanOrEqual(3)
    // Chaque indice est vrai pour la réponse.
    const texts = propertiesOf(Number(clue.answer)).map((p) => p.text.toLowerCase())
    for (const part of clue.text.split(', ')) expect(texts).toContain(part.toLowerCase())
  }
  // Chaque case blanche appartient à au moins un nombre ; les cases noires ne se touchent pas.
  const covered = new Set(clues.flatMap((c) => c.cells))
  solution.forEach((v, i) => {
    if (v === null) {
      if (i % W < W - 1) expect(solution[i + 1]).not.toBeNull()
      if (i + W < solution.length) expect(solution[i + W]).not.toBeNull()
    } else expect(covered.has(i)).toBe(true)
  })
}

describe('propriétés', () => {
  it('décrit 144 correctement', () => {
    const texts = propertiesOf(144).map((p) => p.text)
    expect(texts).toContain('Carré parfait')
    expect(texts).toContain('Multiple de 12')
    expect(texts).toContain('Somme des chiffres : 9')
    expect(texts).not.toContain('Nombre premier')
  })
  it('chaque propriété est vraie pour son nombre', () => {
    for (const n of [11, 97, 121, 1000, 2357, 13579, 98765, 44444])
      for (const p of propertiesOf(n)) expect(p.test(n)).toBe(true)
  })
})

describe('générateur de nombres croisés', () => {
  for (const { id: size } of SIZES)
    for (const { id: level } of LEVELS)
      it(`${size} · ${level} : grille valide`, () => {
        for (let n = 0; n < 3; n++) check(generate(size, level))
      })
})
