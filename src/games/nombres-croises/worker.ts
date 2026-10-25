/// <reference lib="webworker" />
// La génération peut prendre une demi-seconde : elle tourne ici pour ne pas figer l'écran.
import type { Level } from '../mots/types'
import { generate, type SizeId } from './generator'

self.onmessage = (e: MessageEvent<{ size: SizeId; level: Level }>) => {
  try {
    self.postMessage({ puzzle: generate(e.data.size, e.data.level) })
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}
