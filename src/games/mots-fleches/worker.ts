/// <reference lib="webworker" />
// La génération (jusqu'à une seconde pour une grande grille) tourne ici pour ne pas figer l'écran.
import type { Level, SizeId } from './config'
import { generate } from './generator'

self.onmessage = (e: MessageEvent<{ size: SizeId; level: Level }>) => {
  try {
    self.postMessage({ puzzle: generate(e.data.size, e.data.level) })
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}
