import { makeBoard, type Hidato } from './generator'

export interface HidatoState {
  puzzle: Hidato
  /** Nombre dans chaque case (donné ou saisi), 0 si vide. */
  values: number[]
  selected: number | null
  /** Chiffres tapés dans la case sélectionnée, pour saisir les nombres à deux chiffres. */
  buffer: string
  history: number[][]
  revealed: number[]
  hints: number
  elapsed: number
  completed: boolean
}

export type HidatoAction =
  | { type: 'select'; cell: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'digit'; digit: number }
  | { type: 'erase' }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'tick' }

export function newGame(puzzle: Hidato): HidatoState {
  return {
    puzzle,
    values: [...puzzle.given],
    selected: null,
    buffer: '',
    history: [],
    revealed: [],
    hints: 0,
    elapsed: 0,
    completed: false,
  }
}

/** Cases qui enfreignent la règle : nombre en double, ou nombre qui ne touche pas son prédécesseur ou son successeur. */
export function conflicts(puzzle: Hidato, values: number[]): Set<number> {
  const adj = makeBoard(puzzle.shape, puzzle.size).neighbors
  const cellsOf = new Map<number, number[]>()
  values.forEach((v, i) => {
    if (v) cellsOf.set(v, [...(cellsOf.get(v) ?? []), i])
  })
  const bad = new Set<number>()
  for (const [v, cells] of cellsOf) {
    if (cells.length > 1) cells.forEach((c) => bad.add(c))
    for (const other of [v - 1, v + 1]) {
      const others = cellsOf.get(other)
      if (others?.length === 1 && cells.length === 1 && !adj[cells[0]].includes(others[0])) bad.add(cells[0])
    }
  }
  return bad
}

function withValues(s: HidatoState, values: number[], extra: Partial<HidatoState> = {}): HidatoState {
  return {
    ...s,
    ...extra,
    values,
    history: [...s.history, s.values].slice(-200),
    completed: values.every((v, i) => v === s.puzzle.solution[i]),
  }
}

export function hidatoReducer(s: HidatoState, a: HidatoAction): HidatoState {
  const { puzzle } = s
  const N = puzzle.solution.length
  if (a.type === 'tick') return s.completed ? s : { ...s, elapsed: s.elapsed + 1 }
  if (s.completed) return s

  switch (a.type) {
    case 'select':
      return { ...s, selected: a.cell, buffer: '' }
    case 'move': {
      // La voisine la mieux alignée avec la flèche (marche aussi pour les hexagones).
      if (s.selected === null) return { ...s, selected: 0, buffer: '' }
      const { neighbors, centers } = makeBoard(puzzle.shape, puzzle.size)
      const from = centers[s.selected]
      let best = s.selected, bestScore = 0.5
      for (const n of neighbors[s.selected]) {
        const dx = centers[n].x - from.x, dy = centers[n].y - from.y
        const score = (dx * a.dCol + dy * a.dRow) / Math.hypot(dx, dy)
        if (score > bestScore) [best, bestScore] = [n, score]
      }
      return { ...s, selected: best, buffer: '' }
    }
    case 'undo': {
      const prev = s.history.at(-1)
      return prev ? { ...s, values: prev, history: s.history.slice(0, -1), buffer: '' } : s
    }
    case 'hint': {
      // Sur la case sélectionnée si elle est fausse, sinon sur le plus petit nombre pas encore bien placé.
      let cell = s.selected !== null && !puzzle.given[s.selected] && s.values[s.selected] !== puzzle.solution[s.selected] ? s.selected : -1
      if (cell === -1) {
        for (let n = 1; n <= N && cell === -1; n++) {
          const target = puzzle.solution.indexOf(n)
          if (s.values[target] !== n) cell = target
        }
      }
      if (cell === -1) return s
      const values = [...s.values]
      values[cell] = puzzle.solution[cell]
      return withValues(s, values, { selected: cell, buffer: '', revealed: [...s.revealed, cell], hints: s.hints + 1 })
    }
  }

  const cell = s.selected
  if (cell === null || puzzle.given[cell]) return s

  switch (a.type) {
    case 'digit': {
      // On enchaîne les chiffres tant que le nombre reste possible, sinon on repart du chiffre tapé.
      let text = s.buffer + a.digit
      if (Number(text) > N || text.startsWith('0')) text = String(a.digit)
      if (text === '0') return s
      const values = [...s.values]
      values[cell] = Number(text)
      return withValues(s, values, { buffer: text })
    }
    case 'erase': {
      if (!s.values[cell]) return s
      const text = s.buffer.slice(0, -1)
      const values = [...s.values]
      values[cell] = Number(text) || 0
      return withValues(s, values, { buffer: text })
    }
  }
}
