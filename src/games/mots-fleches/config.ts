// Types et réglages partagés par la page et le générateur (sans le dictionnaire, qui reste dans le worker).

/**
 * Où part le mot par rapport à sa case définition :
 * right = case de droite vers la droite, down = case du dessous vers le bas,
 * rightDown = case de droite vers le bas, downRight = case du dessous vers la droite.
 */
export type Arrow = 'right' | 'down' | 'rightDown' | 'downRight'

export interface Clue {
  /** Case définition qui porte l'énoncé. */
  def: number
  arrow: Arrow
  text: string
  cells: number[]
  answer: string
}

export type SizeId = 'petite' | 'moyenne' | 'grande'
export type Level = 'facile' | 'difficile'

export interface ArrowWords {
  width: number
  height: number
  /** Lettre attendue dans chaque case, null pour une case définition. */
  solution: (string | null)[]
  clues: Clue[]
  size: SizeId
  level: Level
}

export const SIZES: { id: SizeId; label: string; width: number; height: number }[] = [
  { id: 'petite', label: 'Petite', width: 7, height: 9 },
  { id: 'moyenne', label: 'Moyenne', width: 8, height: 11 },
  { id: 'grande', label: 'Grande', width: 9, height: 12 },
]

export const LEVELS: { id: Level; label: string; detail: string }[] = [
  { id: 'facile', label: 'Facile', detail: 'Définitions directes' },
  { id: 'difficile', label: 'Difficile', detail: 'Définitions à double sens' },
]

export const isHorizontal = (arrow: Arrow) => arrow === 'right' || arrow === 'downRight'
