/**
 * Envoie un message à un worker et attend sa réponse unique ({ puzzle } ou { error }), puis le termine.
 * Le worker est créé par l'appelant : Vite n'empaquette que `new Worker(new URL('…', import.meta.url))` écrit en toutes lettres.
 */
export function runWorker<P>(worker: Worker, message: unknown): Promise<P> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<{ puzzle?: P; error?: string }>) => {
      worker.terminate()
      if (e.data.puzzle) resolve(e.data.puzzle)
      else reject(new Error(e.data.error))
    }
    worker.postMessage(message)
  })
}
