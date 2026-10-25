import type { Difficulty, Puzzle } from './generator'
import { PEERS, type Grid } from './solver'

export interface SudokuState {
  puzzle: Grid
  solution: Grid
  difficulty: Difficulty
  values: Grid
  /** Annotations au crayon : bit d = chiffre d noté dans la case. */
  notes: number[]
  selected: number | null
  notesMode: boolean
  history: { values: Grid; notes: number[] }[]
  elapsed: number
  mistakes: number
  hints: number
  completed: boolean
}

export type SudokuAction =
  | { type: 'select'; cell: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'input'; digit: number }
  | { type: 'erase' }
  | { type: 'toggleNotes' }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'tick' }
  | { type: 'load'; state: SudokuState }

const MAX_HISTORY = 200

export function newGame({ puzzle, solution, difficulty }: Puzzle): SudokuState {
  return {
    puzzle,
    solution,
    difficulty,
    values: [...puzzle],
    notes: Array(81).fill(0),
    selected: null,
    notesMode: false,
    history: [],
    elapsed: 0,
    mistakes: 0,
    hints: 0,
    completed: false,
  }
}

function withHistory(s: SudokuState): SudokuState['history'] {
  return [...s.history, { values: s.values, notes: s.notes }].slice(-MAX_HISTORY)
}

/** Place un chiffre et le retire des annotations des cases voisines. */
function place(s: SudokuState, cell: number, digit: number): Pick<SudokuState, 'values' | 'notes'> {
  const values = [...s.values]
  const notes = [...s.notes]
  values[cell] = digit
  notes[cell] = 0
  for (const p of PEERS[cell]) notes[p] &= ~(1 << digit)
  return { values, notes }
}

function isSolved(values: Grid, solution: Grid) {
  return values.every((v, i) => v === solution[i])
}

export function sudokuReducer(s: SudokuState, a: SudokuAction): SudokuState {
  switch (a.type) {
    case 'load':
      return a.state
    case 'tick':
      return s.completed ? s : { ...s, elapsed: s.elapsed + 1 }
    case 'select':
      return { ...s, selected: a.cell }
    case 'move': {
      const cur = s.selected ?? 40
      const row = (Math.floor(cur / 9) + a.dRow + 9) % 9
      const col = ((cur % 9) + a.dCol + 9) % 9
      return { ...s, selected: row * 9 + col }
    }
    case 'toggleNotes':
      return { ...s, notesMode: !s.notesMode }
    case 'undo': {
      const prev = s.history.at(-1)
      if (!prev || s.completed) return s
      return { ...s, ...prev, history: s.history.slice(0, -1) }
    }
  }

  // Les actions suivantes modifient la case sélectionnée.
  const cell = s.selected
  if (cell === null || s.completed || s.puzzle[cell]) return s

  switch (a.type) {
    case 'input': {
      if (s.notesMode) {
        if (s.values[cell]) return s
        const notes = [...s.notes]
        notes[cell] ^= 1 << a.digit
        return { ...s, notes, history: withHistory(s) }
      }
      if (s.values[cell] === a.digit) return s
      const next = place(s, cell, a.digit)
      return {
        ...s,
        ...next,
        history: withHistory(s),
        mistakes: s.mistakes + (a.digit !== s.solution[cell] ? 1 : 0),
        completed: isSolved(next.values, s.solution),
      }
    }
    case 'erase': {
      if (!s.values[cell] && !s.notes[cell]) return s
      const values = [...s.values]
      const notes = [...s.notes]
      values[cell] = 0
      notes[cell] = 0
      return { ...s, values, notes, history: withHistory(s) }
    }
    case 'hint': {
      if (s.values[cell] === s.solution[cell]) return s
      const next = place(s, cell, s.solution[cell])
      return {
        ...s,
        ...next,
        history: withHistory(s),
        hints: s.hints + 1,
        completed: isSolved(next.values, s.solution),
      }
    }
  }
}
