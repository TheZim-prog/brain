// Types et réglages partagés par la page et le générateur (sans le dictionnaire, qui reste dans le worker).
import type { WordClue, WordPuzzle } from '../mots/types'

export interface CrossClue extends WordClue {
  /** Ligne (mot horizontal) ou colonne (mot vertical) du mot, à partir de 0. */
  line: number
}

export type SizeId = 'petite' | 'moyenne' | 'grande'

export interface Crossword extends WordPuzzle<CrossClue> {
  size: SizeId
}

export const SIZES: { id: SizeId; label: string; width: number; height: number; blocks: number }[] = [
  { id: 'petite', label: 'Petite', width: 7, height: 7, blocks: 0.16 },
  { id: 'moyenne', label: 'Moyenne', width: 9, height: 9, blocks: 0.16 },
  // En 11×11, il faut un peu plus de cases noires pour que le remplissage aboutisse vite.
  { id: 'grande', label: 'Grande', width: 11, height: 11, blocks: 0.18 },
]

/** 1 → I, 4 → IV, 9 → IX… : les lignes des mots croisés sont numérotées en chiffres romains. */
export function roman(n: number) {
  const units: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [value, sign] of units)
    while (n >= value) {
      out += sign
      n -= value
    }
  return out
}

export const lineLabel = (clue: CrossClue) => (clue.dir === 'h' ? roman(clue.line + 1) : String(clue.line + 1))
