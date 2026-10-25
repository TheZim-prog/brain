// Types et réglages partagés par la page et le générateur (sans le dictionnaire, qui reste dans le worker).
import type { WordClue, WordPuzzle } from '../mots/types'

/**
 * Où part le mot par rapport à sa case définition :
 * right = case de droite vers la droite, down = case du dessous vers le bas,
 * rightDown = case de droite vers le bas, downRight = case du dessous vers la droite.
 */
export type Arrow = 'right' | 'down' | 'rightDown' | 'downRight'

export interface Clue extends WordClue {
  /** Case définition qui porte l'énoncé. */
  def: number
  arrow: Arrow
}

export type SizeId = 'petite' | 'moyenne' | 'grande'

export interface ArrowWords extends WordPuzzle<Clue> {
  size: SizeId
}

export const SIZES: { id: SizeId; label: string; width: number; height: number }[] = [
  { id: 'petite', label: 'Petite', width: 7, height: 9 },
  { id: 'moyenne', label: 'Moyenne', width: 8, height: 11 },
  { id: 'grande', label: 'Grande', width: 9, height: 12 },
]
