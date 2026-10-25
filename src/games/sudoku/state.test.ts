import { describe, expect, it } from 'vitest'
import { generate } from './generator'
import { PEERS } from './solver'
import { newGame, sudokuReducer, type SudokuAction, type SudokuState } from './state'

const run = (s: SudokuState, ...actions: SudokuAction[]) => actions.reduce(sudokuReducer, s)

describe('logique du sudoku', () => {
  const game = newGame(generate('facile'))
  const empty = game.puzzle.findIndex((v) => v === 0)
  const given = game.puzzle.findIndex((v) => v !== 0)
  const right = game.solution[empty]
  const wrong = (right % 9) + 1

  it('ignore la saisie sur une case donnée', () => {
    expect(run(game, { type: 'select', cell: given }, { type: 'input', digit: wrong })).toEqual({ ...game, selected: given })
  })

  it('compte les erreurs et permet d’annuler', () => {
    const s = run(game, { type: 'select', cell: empty }, { type: 'input', digit: wrong })
    expect(s.values[empty]).toBe(wrong)
    expect(s.mistakes).toBe(1)
    expect(run(s, { type: 'undo' }).values[empty]).toBe(0)
  })

  it('retire un chiffre placé des notes voisines', () => {
    const peer = PEERS[empty].find((p) => game.puzzle[p] === 0)!
    const s = run(
      game,
      { type: 'toggleNotes' },
      { type: 'select', cell: peer },
      { type: 'input', digit: right },
      { type: 'toggleNotes' },
      { type: 'select', cell: empty },
      { type: 'input', digit: right },
    )
    expect(s.notes[peer] & (1 << right)).toBe(0)
  })

  it('termine la partie quand toutes les cases sont justes', () => {
    let s: SudokuState = game
    game.puzzle.forEach((v, i) => {
      if (!v) s = run(s, { type: 'select', cell: i }, { type: 'hint' })
    })
    expect(s.completed).toBe(true)
    expect(s.mistakes).toBe(0)
    expect(run(s, { type: 'tick' }).elapsed).toBe(s.elapsed)
  })
})
