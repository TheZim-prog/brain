// Grille = tableau de 81 cases, lues ligne par ligne. 0 = case vide.
export type Grid = number[]

export const SIZE = 9
export const CELLS = 81
const ALL = 0x3fe // bits 1..9

export const rowOf = (i: number) => Math.floor(i / SIZE)
export const colOf = (i: number) => i % SIZE
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)

/** Les 20 cases qui partagent une ligne, une colonne ou un bloc avec chaque case. */
export const PEERS: number[][] = Array.from({ length: CELLS }, (_, i) => {
  const peers: number[] = []
  for (let j = 0; j < CELLS; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) peers.push(j)
  }
  return peers
})

function popcount(n: number) {
  let c = 0
  while (n) {
    n &= n - 1
    c++
  }
  return c
}

interface Masks {
  rows: number[]
  cols: number[]
  boxes: number[]
}

function buildMasks(grid: Grid): Masks | null {
  const m: Masks = { rows: Array(9).fill(0), cols: Array(9).fill(0), boxes: Array(9).fill(0) }
  for (let i = 0; i < CELLS; i++) {
    const v = grid[i]
    if (!v) continue
    const bit = 1 << v
    const r = rowOf(i), c = colOf(i), b = boxOf(i)
    if ((m.rows[r] | m.cols[c] | m.boxes[b]) & bit) return null
    m.rows[r] |= bit
    m.cols[c] |= bit
    m.boxes[b] |= bit
  }
  return m
}

/**
 * Backtracking qui choisit toujours la case la plus contrainte.
 * `onSolution` renvoie true pour arrêter la recherche.
 */
function search(grid: Grid, m: Masks, order: (digits: number[]) => number[], onSolution: (g: Grid) => boolean): boolean {
  let best = -1
  let bestMask = 0
  let bestCount = 10
  for (let i = 0; i < CELLS; i++) {
    if (grid[i]) continue
    const mask = ALL & ~(m.rows[rowOf(i)] | m.cols[colOf(i)] | m.boxes[boxOf(i)])
    const count = popcount(mask)
    if (count === 0) return false
    if (count < bestCount) {
      best = i
      bestMask = mask
      bestCount = count
      if (count === 1) break
    }
  }
  if (best === -1) return onSolution(grid)

  const digits: number[] = []
  for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d)

  const r = rowOf(best), c = colOf(best), b = boxOf(best)
  for (const d of order(digits)) {
    const bit = 1 << d
    grid[best] = d
    m.rows[r] |= bit
    m.cols[c] |= bit
    m.boxes[b] |= bit
    const stop = search(grid, m, order, onSolution)
    m.rows[r] &= ~bit
    m.cols[c] &= ~bit
    m.boxes[b] &= ~bit
    grid[best] = 0
    if (stop) return true
  }
  return false
}

/** Compte les solutions, en s'arrêtant à `limit` (2 suffit pour tester l'unicité). */
export function countSolutions(grid: Grid, limit = 2): number {
  const m = buildMasks(grid)
  if (!m) return 0
  let count = 0
  search([...grid], m, (d) => d, () => ++count >= limit)
  return count
}

/** Résout la grille ; `order` permet de mélanger les chiffres pour générer des grilles aléatoires. */
export function solve(grid: Grid, order: (digits: number[]) => number[] = (d) => d): Grid | null {
  const m = buildMasks(grid)
  if (!m) return null
  let result: Grid | null = null
  search([...grid], m, order, (g) => {
    result = [...g]
    return true
  })
  return result
}
