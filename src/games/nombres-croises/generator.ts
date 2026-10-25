import type { Level } from '../mots/types'
import { propertiesOf, type Property } from './properties'

export type SizeId = 'petite' | 'moyenne' | 'grande'

export const SIZES: { id: SizeId; label: string; width: number; height: number }[] = [
  { id: 'petite', label: 'Petite', width: 5, height: 5 },
  { id: 'moyenne', label: 'Moyenne', width: 6, height: 6 },
  { id: 'grande', label: 'Grande', width: 7, height: 7 },
]

export const LEVELS: { id: Level; label: string; detail: string }[] = [
  { id: 'facile', label: 'Facile', detail: 'Indices précis' },
  { id: 'difficile', label: 'Difficile', detail: 'Il faut croiser' },
]

/** Au plus autant de candidats par nombre avant de compter sur les croisements. */
const MAX_DOMAIN: Record<Level, number> = { facile: 12, difficile: 400 }
const MAX_LENGTH = 5
/** Au-delà, la définition devient une énumération indigeste. */
const MAX_CLUES = 3
const BLACK_RATIO = 0.18

export interface NumberClue {
  dir: 'h' | 'v'
  /** Ligne (horizontal) ou colonne (vertical), à partir de 0. */
  line: number
  text: string
  cells: number[]
  answer: string
}

export interface NumberCross {
  width: number
  height: number
  /** Chiffre attendu dans chaque case, null pour une case noire. */
  solution: (string | null)[]
  clues: NumberClue[]
  size: SizeId
  level: Level
}

function shuffle<T>(items: T[], rng: () => number) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Slot {
  dir: 'h' | 'v'
  line: number
  cells: number[]
}

/** Les suites de 2 cases blanches ou plus, dans les deux sens. */
function slotsOf(W: number, H: number, black: boolean[]): Slot[] {
  const white = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W && !black[r * W + c]
  const slots: Slot[] = []
  for (const [dir, dr, dc] of [['h', 0, 1], ['v', 1, 0]] as const)
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++) {
        if (!white(r, c) || white(r - dr, c - dc)) continue
        const cells: number[] = []
        for (let rr = r, cc = c; white(rr, cc); rr += dr, cc += dc) cells.push(rr * W + cc)
        if (cells.length >= 2) slots.push({ dir, line: dir === 'h' ? r : c, cells })
      }
  return slots
}

/** Cases noires au hasard : jamais collées, nombres de 2 à 5 chiffres, chaque case blanche dans au moins un nombre. */
function layout(W: number, H: number, rng: () => number): boolean[] {
  for (;;) {
    const black = Array<boolean>(W * H).fill(false)
    const canBlacken = (i: number) => {
      const r = Math.floor(i / W), c = i % W
      return ![[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([rr, cc]) => rr >= 0 && rr < H && cc >= 0 && cc < W && black[rr * W + cc])
    }
    let count = 0
    for (const i of shuffle([...Array(W * H).keys()], rng)) {
      if (count >= Math.round(W * H * BLACK_RATIO)) break
      if (canBlacken(i)) {
        black[i] = true
        count++
      }
    }
    // Couper les suites trop longues.
    for (let guard = 0; guard < 50; guard++) {
      const long = slotsOf(W, H, black).find((s) => s.cells.length > MAX_LENGTH)
      if (!long) break
      const options = long.cells.slice(2, -2).filter(canBlacken)
      if (!options.length) break
      black[options[Math.floor(rng() * options.length)]] = true
    }
    const slots = slotsOf(W, H, black)
    if (slots.some((s) => s.cells.length > MAX_LENGTH)) continue
    const covered = new Set(slots.flatMap((s) => s.cells))
    if (black.every((b, i) => b || covered.has(i))) return black
  }
}

const range = (k: number) => Array.from({ length: 9 * 10 ** (k - 1) }, (_, i) => 10 ** (k - 1) + i)

/**
 * Compte les solutions (jusqu'à 2) en choisissant d'abord le nombre qui a le moins de candidats compatibles
 * avec les chiffres déjà posés. Renvoie les solutions trouvées, ou null si la recherche dépasse le budget.
 */
function solve(W: number, H: number, slots: Slot[], domains: string[][], budget = 300_000): string[][] | null {
  const digits: string[] = Array(W * H).fill('')
  const assigned = new Uint8Array(slots.length)
  const found: string[][] = []
  let steps = 0

  const compatible = (s: number) =>
    domains[s].filter((v) => slots[s].cells.every((cell, k) => !digits[cell] || digits[cell] === v[k]))

  const rec = (): boolean => {
    if (++steps > budget) return true
    let best = -1
    let bestOptions: string[] = []
    for (let s = 0; s < slots.length; s++) {
      if (assigned[s]) continue
      const options = compatible(s)
      if (!options.length) return false
      if (best === -1 || options.length < bestOptions.length) {
        best = s
        bestOptions = options
      }
    }
    if (best === -1) {
      found.push(slots.map((s) => s.cells.map((c) => digits[c]).join('')))
      return found.length >= 2
    }
    assigned[best] = 1
    for (const v of bestOptions) {
      const previous = slots[best].cells.map((c) => digits[c])
      slots[best].cells.forEach((c, k) => (digits[c] = v[k]))
      const stop = rec()
      slots[best].cells.forEach((c, k) => (digits[c] = previous[k]))
      if (stop) {
        assigned[best] = 0
        return true
      }
    }
    assigned[best] = 0
    return false
  }

  rec()
  return steps > budget ? null : found
}

/** « Finit par 1, commence par 2, somme des chiffres : 13 ». */
export function joinClues(parts: string[]) {
  return parts.map((t, i) => (i === 0 ? t : t[0].toLowerCase() + t.slice(1))).join(', ')
}

export function generate(size: SizeId, level: Level, rng: () => number = Math.random): NumberCross {
  const { width: W, height: H } = SIZES.find((s) => s.id === size)!
  for (;;) {
    const black = layout(W, H, rng)
    const slots = slotsOf(W, H, black)
    // Chiffres au hasard ; un nombre ne commence jamais par 0.
    const starts = new Set(slots.map((s) => s.cells[0]))
    const solution = black.map((b, i) => (b ? null : String(starts.has(i) ? 1 + Math.floor(rng() * 9) : Math.floor(rng() * 10))))
    const values = slots.map((s) => Number(s.cells.map((c) => solution[c]).join('')))

    // Pour chaque nombre, des propriétés vraies jusqu'à réduire assez les candidats. On ne garde que des propriétés
    // qui éliminent vraiment des candidats (pas de « impair » après « finit par 3 »), en tirant parmi les plus efficaces.
    const chosen: Property[][] = slots.map(() => [])
    const pools = values.map((v) => shuffle(propertiesOf(v), rng))
    const domains = slots.map((s) => range(s.cells.length))
    const addProperty = (s: number, mustExclude?: number) => {
      if (chosen[s].length >= MAX_CLUES) return false
      const options = pools[s]
        .filter((p) => !chosen[s].includes(p) && (mustExclude === undefined || !p.test(mustExclude)))
        .map((p) => ({ p, left: domains[s].filter(p.test) }))
        .filter((o) => o.left.length < domains[s].length)
        .sort((a, b) => a.left.length - b.left.length)
      if (!options.length) return false
      // Pas toujours la plus forte, pour varier les définitions ; jamais une qui donne directement la réponse s'il y a mieux.
      const top = options.filter((o) => o.left.length > 1).slice(0, 3)
      const pick = top.length ? top[Math.floor(rng() * top.length)] : options[0]
      chosen[s].push(pick.p)
      domains[s] = pick.left
      return true
    }
    slots.forEach((_, s) => {
      // Toujours au moins une définition, même pour un nombre que les croisements suffiraient à trouver.
      do if (!addProperty(s)) break
      while (domains[s].length > MAX_DOMAIN[level])
    })

    // Tant que plusieurs solutions existent, on précise un nombre qui diffère entre elles.
    let ok = false
    for (let round = 0; round < 40; round++) {
      const found = solve(W, H, slots, domains.map((d) => d.map(String)))
      if (found && found.length === 1) {
        ok = true
        break
      }
      let progressed = false
      if (found && found.length > 1) {
        for (const s of shuffle([...slots.keys()], rng)) {
          if (found[0][s] === found[1][s]) continue
          const other = Number(found[0][s] === String(values[s]) ? found[1][s] : found[0][s])
          if ((progressed = addProperty(s, other))) break
        }
      } else {
        const bySize = [...slots.keys()].sort((a, b) => domains[b].length - domains[a].length)
        for (const s of bySize) if ((progressed = addProperty(s))) break
      }
      if (!progressed) break
    }
    if (!ok) continue

    const clues: NumberClue[] = slots
      .map((slot, s) => ({ ...slot, text: joinClues(chosen[s].map((p) => p.text)), answer: String(values[s]) }))
      .sort((a, b) => Number(a.dir === 'v') - Number(b.dir === 'v') || a.line - b.line || a.cells[0] - b.cells[0])
    return { width: W, height: H, solution, clues, size, level }
  }
}
