/// <reference lib="webworker" />
// La génération (jusqu'à une seconde pour une grande grille) tourne ici pour ne pas figer l'écran.
// Un seul worker pour les deux jeux : le dictionnaire n'est téléchargé et mis en cache qu'une fois.
import { generate as croises } from '../mots-croises/generator'
import { generate as fleches } from '../mots-fleches/generator'
import type { Level } from './types'

export type GenerateRequest =
  | { game: 'fleches'; size: Parameters<typeof fleches>[0]; level: Level }
  | { game: 'croises'; size: Parameters<typeof croises>[0]; level: Level }

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  try {
    const { data } = e
    const puzzle = data.game === 'fleches' ? fleches(data.size, data.level) : croises(data.size, data.level)
    self.postMessage({ puzzle })
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}
