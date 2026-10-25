import { useEffect } from 'react'

/** Appelle `tick` chaque seconde tant que `active` est vrai et que la page est visible. `tick` doit être stable. */
export function useTicker(active: boolean, tick: () => void) {
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') tick()
    }, 1000)
    return () => clearInterval(id)
  }, [active, tick])
}
