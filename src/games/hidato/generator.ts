// Hidato : placer les nombres de 1 à N pour que chaque nombre touche le suivant.
// Trois plateaux : hexagonal (6 voisines), carré par les côtés (Numbrix), carré avec diagonales (8 voisines).
import { shuffle } from '../../lib/random'

export type Shape = 'hexagone' | 'carre' | 'diagonales'
export type Difficulty = 'facile' | 'moyen' | 'difficile'
export type SizeId = 'petite' | 'moyenne' | 'grande'

export const SHAPES: { id: Shape; label: string; detail: string }[] = [
  { id: 'hexagone', label: 'Hexagone', detail: '6 voisines' },
  { id: 'carre', label: 'Carré', detail: 'Par les côtés' },
  { id: 'diagonales', label: 'Carré', detail: 'Avec diagonales' },
]

/** Côté de l'hexagone (en cases) ou du carré, selon la taille. */
const SIDE: Record<Shape, Record<SizeId, number>> = {
  hexagone: { petite: 3, moyenne: 4, grande: 5 },
  carre: { petite: 5, moyenne: 6, grande: 8 },
  diagonales: { petite: 5, moyenne: 6, grande: 8 },
}

export const SIZES: { id: SizeId; label: string }[] = [
  { id: 'petite', label: 'Petite' },
  { id: 'moyenne', label: 'Moyenne' },
  { id: 'grande', label: 'Grande' },
]

export const DIFFICULTIES: { id: Difficulty; label: string; shown: number }[] = [
  // Part des nombres laissés visibles (au minimum ce qu'il faut pour une solution unique).
  { id: 'facile', label: 'Facile', shown: 0.5 },
  { id: 'moyen', label: 'Moyen', shown: 0.35 },
  { id: 'difficile', label: 'Difficile', shown: 0 },
]

export interface Hidato {
  shape: Shape
  size: SizeId
  difficulty: Difficulty
  /** Nombre attendu dans chaque case. */
  solution: number[]
  /** Nombres donnés au départ (0 = case à remplir). */
  given: number[]
}

export interface Board {
  count: number
  neighbors: number[][]
  /** Nombre minimal de pas pour aller d'une case à l'autre. */
  distance: (a: number, b: number) => number
  /** Un chemin qui passe une fois par chaque case : le point de départ du tirage aléatoire. */
  serpentine: number[]
  /** Centre de chaque case, en unités de case, pour l'affichage. */
  centers: { x: number; y: number }[]
  /** Contour d'une case autour de son centre. */
  outline: { x: number; y: number }[]
  width: number
  height: number
}

export const sizeCount = (shape: Shape, size: SizeId) => {
  const n = SIDE[shape][size]
  return shape === 'hexagone' ? 3 * n * (n - 1) + 1 : n * n
}

export function makeBoard(shape: Shape, size: SizeId): Board {
  const n = SIDE[shape][size]
  return shape === 'hexagone' ? hexBoard(n) : squareBoard(n, shape === 'diagonales')
}

function squareBoard(side: number, diagonals: boolean): Board {
  const dirs = diagonals
    ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1]]
  const neighbors = Array.from({ length: side * side }, (_, i) => {
    const r = Math.floor(i / side), c = i % side
    return dirs
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([rr, cc]) => rr >= 0 && rr < side && cc >= 0 && cc < side)
      .map(([rr, cc]) => rr * side + cc)
  })
  const serpentine: number[] = []
  for (let r = 0; r < side; r++) for (let c = 0; c < side; c++) serpentine.push(r * side + (r % 2 ? side - 1 - c : c))
  return {
    count: side * side,
    neighbors,
    distance: (a, b) => {
      const dr = Math.abs(Math.floor(a / side) - Math.floor(b / side))
      const dc = Math.abs((a % side) - (b % side))
      return diagonals ? Math.max(dr, dc) : dr + dc
    },
    serpentine,
    centers: Array.from({ length: side * side }, (_, i) => ({ x: (i % side) + 0.5, y: Math.floor(i / side) + 0.5 })),
    outline: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 }],
    width: side,
    height: side,
  }
}

/** Hexagone de n cases de côté, en coordonnées axiales (q, r) avec |q|, |r|, |q + r| < n. */
function hexBoard(n: number): Board {
  const cells: { q: number; r: number }[] = []
  for (let r = -(n - 1); r <= n - 1; r++)
    for (let q = Math.max(-(n - 1), -(n - 1) - r); q <= Math.min(n - 1, n - 1 - r); q++) cells.push({ q, r })
  const index = new Map(cells.map((c, i) => [`${c.q},${c.r}`, i]))
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]
  const neighbors = cells.map(({ q, r }) => dirs.map(([dq, dr]) => index.get(`${q + dq},${r + dr}`)).filter((i): i is number => i !== undefined))

  // Serpentin ligne par ligne : la fin d'une ligne touche toujours le bout de la suivante.
  const serpentine: number[] = []
  let flip = false
  for (let r = -(n - 1); r <= n - 1; r++) {
    const row = cells.map((c, i) => ({ c, i })).filter(({ c }) => c.r === r).map(({ i }) => i)
    serpentine.push(...(flip ? row.reverse() : row))
    flip = !flip
  }

  // Hexagones « pointe en haut » de largeur 1 : centres espacés de 1 en largeur et de √3/2 en hauteur.
  const h = Math.sqrt(3) / 2
  const raw = cells.map(({ q, r }) => ({ x: q + r / 2, y: r * h }))
  const minX = Math.min(...raw.map((p) => p.x)) - 0.5
  const minY = Math.min(...raw.map((p) => p.y)) - 1 / Math.sqrt(3)
  const centers = raw.map((p) => ({ x: p.x - minX, y: p.y - minY }))
  const radius = 1 / Math.sqrt(3)
  return {
    count: cells.length,
    neighbors,
    distance: (a, b) => {
      const dq = cells[a].q - cells[b].q, dr = cells[a].r - cells[b].r
      return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
    },
    serpentine,
    centers,
    outline: Array.from({ length: 6 }, (_, k) => ({ x: radius * Math.cos(((60 * k - 90) * Math.PI) / 180), y: radius * Math.sin(((60 * k - 90) * Math.PI) / 180) })),
    width: 2 * n - 1,
    height: (2 * n - 2) * h + 2 * radius,
  }
}

/**
 * Chemin aléatoire passant une fois par chaque case (« backbite ») : on part d'un serpentin
 * et on le déforme au hasard en reliant une extrémité à une voisine puis en retournant une portion du chemin.
 */
export function randomPath(board: Board, rng: () => number = Math.random): number[] {
  const path = [...board.serpentine]
  const index = new Int32Array(board.count)
  const reindex = (from: number, to: number) => {
    for (let k = from; k <= to; k++) index[path[k]] = k
  }
  reindex(0, path.length - 1)
  const reverse = (from: number, to: number) => {
    for (let a = from, b = to; a < b; a++, b--) [path[a], path[b]] = [path[b], path[a]]
    reindex(from, to)
  }

  const last = path.length - 1
  for (let step = 0; step < board.count * 40; step++) {
    const atEnd = rng() < 0.5
    const options = board.neighbors[atEnd ? path[last] : path[0]]
    const i = index[options[Math.floor(rng() * options.length)]]
    if (atEnd) {
      if (i !== last - 1) reverse(i + 1, last)
    } else if (i !== 1) reverse(0, i - 1)
  }
  return path
}

/**
 * Compte les solutions (en s'arrêtant à `limit`) ; renvoie -1 si la recherche dépasse `budget` étapes.
 * On construit le chemin de 1 vers N : un nombre déjà donné impose sa case, sinon on essaie les voisines libres
 * qui restent assez proches du prochain nombre donné.
 */
export function countSolutions(board: Board, given: number[], limit = 2, budget = 200_000): number {
  const N = board.count
  const { neighbors: adj, distance } = board
  const pos = new Int32Array(N + 2).fill(-1)
  given.forEach((v, i) => {
    if (v) pos[v] = i
  })
  // Prochain nombre donné après n.
  const nextGiven = new Int32Array(N + 2).fill(0)
  for (let n = N, next = 0; n >= 1; n--) {
    nextGiven[n] = next
    if (pos[n] >= 0) next = n
  }
  const used = new Uint8Array(N)
  given.forEach((v, i) => {
    if (v) used[i] = 1
  })

  let found = 0
  let steps = 0
  const dfs = (n: number, cell: number): boolean => {
    if (++steps > budget) return true
    if (n === N) return ++found >= limit
    const target = pos[n + 1]
    if (target >= 0) return adj[cell].includes(target) ? dfs(n + 1, target) : false
    const k = nextGiven[n + 1]
    for (const next of adj[cell]) {
      if (used[next]) continue
      if (k && distance(next, pos[k]) > k - (n + 1)) continue
      used[next] = 1
      const stop = dfs(n + 1, next)
      used[next] = 0
      if (stop) return true
    }
    return false
  }

  if (pos[1] >= 0) dfs(1, pos[1])
  return steps > budget ? -1 : found
}

export function generate(shape: Shape, size: SizeId, difficulty: Difficulty, rng: () => number = Math.random): Hidato {
  const board = makeBoard(shape, size)
  const N = board.count
  const path = randomPath(board, rng)
  const solution = Array<number>(N)
  path.forEach((cell, k) => (solution[cell] = k + 1))

  // On retire les nombres un à un, dans un ordre aléatoire, tant que la solution reste unique.
  // Le 1 et le dernier restent toujours visibles, comme dans les magazines.
  const given = [...solution]
  const target = Math.round(N * DIFFICULTIES.find((d) => d.id === difficulty)!.shown)
  let shown = N
  const order = shuffle([...Array(N).keys()], rng)
  for (const cell of order) {
    if (shown <= target) break
    const v = given[cell]
    if (v === 1 || v === N) continue
    given[cell] = 0
    if (countSolutions(board, given) === 1) shown--
    else given[cell] = v
  }
  return { shape, size, difficulty, solution, given }
}
