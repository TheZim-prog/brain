import { describe, expect, it, vi } from 'vitest'
import { runWorker } from './worker'

/** Faux worker : on déclenche à la main ce que ferait le vrai. */
function fakeWorker() {
  const w = {
    onmessage: null as ((e: { data: unknown }) => void) | null,
    onerror: null as ((e: { message: string; preventDefault: () => void }) => void) | null,
    onmessageerror: null as (() => void) | null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  }
  return { w, worker: w as unknown as Worker }
}

describe('runWorker', () => {
  it('renvoie la grille et termine le worker', async () => {
    const { w, worker } = fakeWorker()
    const p = runWorker<string>(worker, { size: 'petite' })
    expect(w.postMessage).toHaveBeenCalledWith({ size: 'petite' })
    w.onmessage!({ data: { puzzle: 'grille' } })
    await expect(p).resolves.toBe('grille')
    expect(w.terminate).toHaveBeenCalled()
  })

  it('échoue si le générateur renvoie une erreur', async () => {
    const { w, worker } = fakeWorker()
    const p = runWorker(worker, {})
    w.onmessage!({ data: { error: 'Impossible' } })
    await expect(p).rejects.toThrow('Impossible')
  })

  it('échoue si le worker ne se charge pas', async () => {
    const { w, worker } = fakeWorker()
    const p = runWorker(worker, {})
    w.onerror!({ message: 'Failed to fetch', preventDefault: () => {} })
    await expect(p).rejects.toThrow('Failed to fetch')
    expect(w.terminate).toHaveBeenCalled()
  })

  it('échoue si le worker ne répond pas à temps', async () => {
    vi.useFakeTimers()
    const { w, worker } = fakeWorker()
    const p = runWorker(worker, {}, { timeoutMs: 1000 })
    vi.advanceTimersByTime(1000)
    await expect(p).rejects.toThrow('ne répond pas')
    expect(w.terminate).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('s’annule et termine le worker quand on quitte la page', async () => {
    const { w, worker } = fakeWorker()
    const controller = new AbortController()
    const p = runWorker(worker, {}, { signal: controller.signal })
    controller.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
    expect(w.terminate).toHaveBeenCalled()
  })
})
