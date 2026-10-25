import { describe, expect, it } from 'vitest'
import { generate } from './generator'
import { lineCells, motsMelesReducer, newGame, snapEnd, type MotsMelesAction, type MotsMelesState } from './state'

const run = (s: MotsMelesState, ...actions: MotsMelesAction[]) => actions.reduce(motsMelesReducer, s)

describe('géométrie', () => {
  it('trace les lignes droites et diagonales, refuse le reste', () => {
    expect(lineCells(10, 0, 3)).toEqual([0, 1, 2, 3])
    expect(lineCells(10, 22, 0)).toEqual([22, 11, 0])
    expect(lineCells(10, 0, 12)).toBeNull()
  })

  it('aimante le geste sur la direction la plus proche', () => {
    expect(snapEnd(10, 0, 13)).toBe(3) // (1,3) : presque horizontal
    expect(snapEnd(10, 0, 23)).toBe(33) // (2,3) : diagonale
    expect(snapEnd(10, 0, 4)).toBe(4)
    expect(snapEnd(10, 0, 31)).toBe(30) // presque vertical
    expect(snapEnd(10, 9, 0)).toBe(0)
  })
})

describe('partie', () => {
  const game = newGame(generate('moyen', 'animaux'))
  const words = game.puzzle.words

  it('accepte un mot sélectionné dans les deux sens, une seule fois', () => {
    const w = words[0]
    const s = run(game, { type: 'submit', cells: [...w.cells].reverse() })
    expect(s.found).toHaveLength(1)
    expect(run(s, { type: 'submit', cells: w.cells }).found).toHaveLength(1)
  })

  it('ignore une sélection qui ne forme pas de mot', () => {
    expect(run(game, { type: 'submit', cells: [0] })).toBe(game)
  })

  it('demande le mot mystère une fois tous les mots trouvés', () => {
    const s = run(game, ...words.map((w): MotsMelesAction => ({ type: 'submit', cells: w.cells })))
    expect(s.completed).toBe(false)
    expect(run(s, { type: 'guessMystery', guess: 'nimporte' }).completed).toBe(false)
    const done = run(s, { type: 'guessMystery', guess: game.puzzle.mystery!.label.toLowerCase() })
    expect(done.completed).toBe(true)
    expect(done.hints).toBe(0)
  })

  it('l’indice montre la première lettre d’un mot manquant', () => {
    const s = run(game, { type: 'hint' })
    expect(s.hintCell).toBe(words[0].cells[0])
    expect(run(s, { type: 'submit', cells: words[0].cells }).hintCell).toBeNull()
  })
})
