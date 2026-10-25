import { useCallback, useEffect, useRef } from 'react'

/**
 * Envoie un message à un worker et attend sa réponse unique ({ puzzle } ou { error }), puis le termine.
 * La promesse échoue aussi si le worker ne se charge pas, plante, ne répond pas à temps, ou si `signal` annule.
 * Le worker est créé par l'appelant : Vite n'empaquette que `new Worker(new URL('…', import.meta.url))` écrit en toutes lettres.
 */
export function runWorker<P>(
  worker: Worker,
  message: unknown,
  { signal, timeoutMs = 30_000 }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<P> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (settle: () => void) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
      settle()
    }
    const onAbort = () => finish(() => reject(new DOMException('Génération annulée', 'AbortError')))
    if (signal?.aborted) return onAbort()

    timer = setTimeout(() => finish(() => reject(new Error('Le générateur ne répond pas'))), timeoutMs)
    signal?.addEventListener('abort', onAbort)
    worker.onmessage = (e: MessageEvent<{ puzzle?: P; error?: string }>) =>
      finish(() => (e.data.puzzle ? resolve(e.data.puzzle) : reject(new Error(e.data.error))))
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault()
      finish(() => reject(new Error(e.message || 'Le générateur n’a pas pu démarrer')))
    }
    worker.onmessageerror = () => finish(() => reject(new Error('Réponse illisible du générateur')))
    worker.postMessage(message)
  })
}

/**
 * Fournit un signal d'annulation par requête : en demander un nouveau annule le précédent,
 * et tout est annulé quand le composant disparaît (on quitte la page).
 */
export function useCancellable() {
  const current = useRef<AbortController | null>(null)
  useEffect(() => () => current.current?.abort(), [])
  return useCallback(() => {
    current.current?.abort()
    current.current = new AbortController()
    return current.current.signal
  }, [])
}
