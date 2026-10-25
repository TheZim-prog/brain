import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface GameEntry {
  id: string
  name: string
  description: string
  /** Absent tant que le jeu n'est pas encore disponible. */
  component?: LazyExoticComponent<ComponentType>
}

export const GAMES: GameEntry[] = [
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Des grilles générées à l’infini, du niveau facile à expert.',
    component: lazy(() => import('./sudoku/SudokuPage')),
  },
  {
    id: 'mots-fleches',
    name: 'Mots fléchés',
    description: 'Les définitions dans la grille, comme en kiosque.',
    component: lazy(() => import('./mots-fleches/MotsFlechesPage')),
  },
  {
    id: 'mots-croises',
    name: 'Mots croisés',
    description: 'Horizontalement, verticalement…',
    component: lazy(() => import('./mots-croises/MotsCroisesPage')),
  },
  {
    id: 'nombres-croises',
    name: 'Nombres croisés',
    description: 'Des mots croisés de chiffres : multiples, carrés, sommes…',
    component: lazy(() => import('./nombres-croises/NombresCroisesPage')),
  },
  {
    id: 'hidato',
    name: 'Hidato',
    description: 'Des hexagones à relier, de 1 à 37, chaque nombre touchant le suivant.',
    component: lazy(() => import('./hidato/HidatoPage')),
  },
  {
    id: 'mots-meles',
    name: 'Mots mêlés',
    description: 'Retrouve les mots cachés, puis devine le mot mystère.',
    component: lazy(() => import('./mots-meles/MotsMelesPage')),
  },
]
