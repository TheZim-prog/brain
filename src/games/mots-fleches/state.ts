import { isHorizontal, type ArrowWords } from './config'

export type Direction = 'h' | 'v'

export interface MotsFlechesState {
  puzzle: ArrowWords
  /** Lettre saisie dans chaque case ('' si vide). */
  entries: string[]
  selected: number | null
  direction: Direction
  /** Cases signalées fausses par « Vérifier », jusqu'à la prochaine modification. */
  errors: number[]
  /** Cases dévoilées par un indice. */
  revealed: number[]
  hints: number
  elapsed: number
  completed: boolean
}

export type MotsFlechesAction =
  | { type: 'selectCell'; cell: number }
  | { type: 'selectClue'; clue: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'input'; letter: string }
  | { type: 'erase' }
  | { type: 'check' }
  | { type: 'revealLetter' }
  | { type: 'revealWord' }
  | { type: 'tick' }

export function newGame(puzzle: ArrowWords): MotsFlechesState {
  const first = puzzle.clues[0]
  return {
    puzzle,
    entries: puzzle.solution.map(() => ''),
    selected: first ? first.cells[0] : null,
    direction: first && isHorizontal(first.arrow) ? 'h' : 'v',
    errors: [],
    revealed: [],
    hints: 0,
    elapsed: 0,
    completed: false,
  }
}

/** Indice de la définition qui couvre la case dans ce sens, ou -1. */
export function clueAt(puzzle: ArrowWords, cell: number, dir: Direction) {
  return puzzle.clues.findIndex((c) => (isHorizontal(c.arrow) ? 'h' : 'v') === dir && c.cells.includes(cell))
}

/** Définition active : celle de la case sélectionnée dans le sens courant (ou l'autre sens à défaut). */
export function activeClue(s: MotsFlechesState) {
  if (s.selected === null) return -1
  const here = clueAt(s.puzzle, s.selected, s.direction)
  return here !== -1 ? here : clueAt(s.puzzle, s.selected, s.direction === 'h' ? 'v' : 'h')
}

const other = (d: Direction): Direction => (d === 'h' ? 'v' : 'h')

function solved(entries: string[], solution: (string | null)[]) {
  return solution.every((l, i) => l === null || entries[i] === l)
}

function withEntries(s: MotsFlechesState, changes: Map<number, string>, extra: Partial<MotsFlechesState> = {}): MotsFlechesState {
  const entries = [...s.entries]
  for (const [cell, letter] of changes) entries[cell] = letter
  return {
    ...s,
    ...extra,
    entries,
    errors: s.errors.filter((e) => !changes.has(e)),
    completed: solved(entries, s.puzzle.solution),
  }
}

export function motsFlechesReducer(s: MotsFlechesState, a: MotsFlechesAction): MotsFlechesState {
  const { puzzle } = s
  const W = puzzle.width
  if (a.type === 'tick') return s.completed ? s : { ...s, elapsed: s.elapsed + 1 }
  if (s.completed) return s

  switch (a.type) {
    case 'selectCell': {
      if (puzzle.solution[a.cell] === null) return s
      // Toucher de nouveau la même case change de sens, s'il y a un mot dans l'autre sens.
      if (a.cell === s.selected) {
        return clueAt(puzzle, a.cell, other(s.direction)) !== -1 ? { ...s, direction: other(s.direction) } : s
      }
      const direction = clueAt(puzzle, a.cell, s.direction) !== -1 ? s.direction : other(s.direction)
      return { ...s, selected: a.cell, direction }
    }
    case 'selectClue': {
      const clue = puzzle.clues[a.clue]
      const firstEmpty = clue.cells.find((c) => !s.entries[c]) ?? clue.cells[0]
      return { ...s, selected: firstEmpty, direction: isHorizontal(clue.arrow) ? 'h' : 'v' }
    }
    case 'move': {
      if (s.selected === null) return s
      let r = Math.floor(s.selected / W) + a.dRow
      let c = (s.selected % W) + a.dCol
      // On saute les cases définition jusqu'à la prochaine lettre dans cette direction.
      while (r >= 0 && r < puzzle.height && c >= 0 && c < W) {
        const cell = r * W + c
        if (puzzle.solution[cell] !== null) {
          const direction: Direction = a.dRow ? 'v' : 'h'
          return { ...s, selected: cell, direction: clueAt(puzzle, cell, direction) !== -1 ? direction : other(direction) }
        }
        r += a.dRow
        c += a.dCol
      }
      return s
    }
    case 'input': {
      if (s.selected === null) return s
      const letter = a.letter.toUpperCase()
      const clue = activeClue(s)
      const cells = clue === -1 ? [] : puzzle.clues[clue].cells
      const pos = cells.indexOf(s.selected)
      const next = pos !== -1 && pos < cells.length - 1 ? cells[pos + 1] : s.selected
      return withEntries(s, new Map([[s.selected, letter]]), { selected: next })
    }
    case 'erase': {
      if (s.selected === null) return s
      if (s.entries[s.selected]) return withEntries(s, new Map([[s.selected, '']]))
      const clue = activeClue(s)
      const cells = clue === -1 ? [] : puzzle.clues[clue].cells
      const pos = cells.indexOf(s.selected)
      if (pos <= 0) return s
      const prev = cells[pos - 1]
      return withEntries(s, new Map([[prev, '']]), { selected: prev })
    }
    case 'check': {
      const errors = s.entries.flatMap((l, i) => (l && l !== puzzle.solution[i] ? [i] : []))
      return { ...s, errors }
    }
    case 'revealLetter': {
      if (s.selected === null || s.entries[s.selected] === puzzle.solution[s.selected]) return s
      return withEntries(s, new Map([[s.selected, puzzle.solution[s.selected]!]]), {
        revealed: [...s.revealed, s.selected],
        hints: s.hints + 1,
      })
    }
    case 'revealWord': {
      const clue = activeClue(s)
      if (clue === -1) return s
      const wrong = puzzle.clues[clue].cells.filter((c) => s.entries[c] !== puzzle.solution[c])
      if (!wrong.length) return s
      return withEntries(s, new Map(wrong.map((c) => [c, puzzle.solution[c]!])), {
        revealed: [...s.revealed, ...wrong],
        hints: s.hints + 1,
      })
    }
  }
}
