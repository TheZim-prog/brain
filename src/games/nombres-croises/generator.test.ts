import { describe, expect, it } from 'vitest'
import { seededRandom } from '../../lib/random'
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

  it('les tests rapides donnent les mêmes résultats que la définition naïve', () => {
    const p = Object.fromEntries(propertiesOf(13579).map((x) => [x.text, x.test]))
    expect(p['Chiffres croissants'](12349)).toBe(true)
    expect(p['Chiffres croissants'](12339)).toBe(false)
    expect(p['Tous les chiffres sont impairs'](13571)).toBe(true)
    expect(p['Tous les chiffres sont impairs'](13570)).toBe(false)
    expect(p['Commence par 1'](19999)).toBe(true)
    expect(p['Commence par 1'](29999)).toBe(false)
    expect(propertiesOf(4444).find((x) => x.text === 'Un seul chiffre répété')!.test(7777)).toBe(true)
    expect(propertiesOf(98765).find((x) => x.text === 'Chiffres décroissants')!.test(98766)).toBe(false)
  })
})

describe('générateur de nombres croisés', () => {
  it('renvoie une erreur au lieu de tourner sans fin', () => {
    expect(() => generate('petite', 'facile', Math.random, 0)).toThrow('Impossible')
  })

  // Graines fixes : un échec se rejoue à l'identique.
  for (const { id: size } of SIZES)
    for (const { id: level } of LEVELS)
      it(`${size} · ${level} : grilles valides`, () => {
        for (const seed of [1, 2, 3]) check(generate(size, level, seededRandom(seed * 1000 + size.length * 10 + level.length)))
      })

  it('la même graine donne la même grille', () => {
    expect(generate('moyenne', 'facile', seededRandom(42))).toEqual(generate('moyenne', 'facile', seededRandom(42)))
  })
})
