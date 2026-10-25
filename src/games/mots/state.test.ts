import { describe, expect, it } from 'vitest'
import { fillGrid } from './fill'
import { activeClue, gridReducer, newGame, type GridAction, type GridState } from './state'
import type { WordPuzzle } from './types'

const run = (s: GridState, ...actions: GridAction[]) => actions.reduce(gridReducer, s)

function puzzle(): WordPuzzle {
  const { solution, runs, clueFor } = fillGrid(7, 7, { style: 'croises', maxBlocks: 10 })
  return { width: 7, height: 7, solution, level: 'facile', clues: runs.map((r) => ({ ...r, text: clueFor(r.answer, 'facile') })) }
}

describe('partie sur une grille de mots', () => {
  const game = newGame(puzzle())
  const { clues, solution } = game.puzzle
  const longest = clues.reduce((a, b) => (b.cells.length > a.cells.length ? b : a))
  const index = clues.indexOf(longest)

  it('sélectionner une définition place le curseur au début du mot, dans le bon sens', () => {
    const s = run(game, { type: 'selectClue', clue: index })
    expect(s.selected).toBe(longest.cells[0])
    expect(s.direction).toBe(longest.dir)
    expect(activeClue(s)).toBe(index)
  })

  it('la saisie avance dans le mot et l’effacement recule', () => {
    let s = run(game, { type: 'selectClue', clue: index }, { type: 'input', letter: 'a' }, { type: 'input', letter: 'b' })
    expect(s.entries[longest.cells[0]]).toBe('A')
    expect(s.entries[longest.cells[1]]).toBe('B')
    expect(s.selected).toBe(longest.cells[2])
    s = run(s, { type: 'erase' })
    expect(s.entries[longest.cells[1]]).toBe('')
    expect(s.selected).toBe(longest.cells[1])
  })

  it('vérifier signale les lettres fausses jusqu’à correction', () => {
    const wrong = solution[longest.cells[0]] === 'Z' ? 'Y' : 'Z'
    let s = run(game, { type: 'selectClue', clue: index }, { type: 'input', letter: wrong }, { type: 'check' })
    expect(s.errors).toEqual([longest.cells[0]])
    s = run(s, { type: 'selectCell', cell: longest.cells[0] }, { type: 'input', letter: solution[longest.cells[0]]! })
    expect(s.errors).toEqual([])
  })

  it('dévoiler tous les mots termine la partie', () => {
    let s: GridState = game
    clues.forEach((_, i) => (s = run(s, { type: 'selectClue', clue: i }, { type: 'revealWord' })))
    expect(s.completed).toBe(true)
    expect(s.hints).toBeGreaterThan(0)
  })
})
