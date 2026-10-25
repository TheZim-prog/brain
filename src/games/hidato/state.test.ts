import { describe, expect, it } from 'vitest'
import { generate } from './generator'
import { conflicts, hidatoReducer, newGame, type HidatoAction, type HidatoState } from './state'

const run = (s: HidatoState, ...actions: HidatoAction[]) => actions.reduce(hidatoReducer, s)

describe('partie de hidato', () => {
  const game = newGame(generate('hexagone', 'moyenne', 'moyen'))
  const { solution, given } = game.puzzle
  const empty = given.findIndex((v) => v === 0)
  const fixed = given.findIndex((v) => v !== 0)

  it('saisit les nombres à deux chiffres et repart si le nombre dépasse le maximum', () => {
    let s = run(game, { type: 'select', cell: empty }, { type: 'digit', digit: 1 }, { type: 'digit', digit: 2 })
    expect(s.values[empty]).toBe(12)
    s = run(s, { type: 'digit', digit: 7 })
    expect(s.values[empty]).toBe(7)
    s = run(s, { type: 'erase' })
    expect(s.values[empty]).toBe(0)
  })

  it('ne touche pas aux nombres donnés', () => {
    expect(run(game, { type: 'select', cell: fixed }, { type: 'digit', digit: 5 }).values).toEqual(game.values)
  })

  it('signale un nombre en double', () => {
    const v = given[fixed]
    const digits = String(v).split('').map(Number)
    const s = run(game, { type: 'select', cell: empty }, ...digits.map((digit): HidatoAction => ({ type: 'digit', digit })))
    expect(conflicts(s.puzzle, s.values).has(empty)).toBe(true)
  })

  it('annuler revient en arrière', () => {
    const s = run(game, { type: 'select', cell: empty }, { type: 'digit', digit: 3 }, { type: 'undo' })
    expect(s.values[empty]).toBe(0)
  })

  it('les indices finissent la grille', () => {
    let s: HidatoState = game
    while (!s.completed) s = run(s, { type: 'hint' })
    expect(s.values).toEqual(solution)
    expect(conflicts(s.puzzle, s.values).size).toBe(0)
  })
})
