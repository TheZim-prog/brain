// localStorage peut être indisponible (navigation privée, quota) : on ignore les erreurs.

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // tant pis, la partie ne sera pas sauvegardée
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // idem
  }
}
