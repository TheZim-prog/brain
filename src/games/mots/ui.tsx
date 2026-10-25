// Morceaux d'interface communs aux jeux de grille à mots.
import { useEffect, useState, type Dispatch } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { runWorker, useCancellable } from '../../lib/worker'
import { newGame, type GridAction, type GridState } from './state'
import { LEVELS, type Level, type WordClue, type WordPuzzle } from './types'
import type { GenerateRequest } from './worker'

const KEYBOARD = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN']
const DIGITS = ['12345', '67890']

/** Lance la génération d'une grille dans le worker partagé des jeux de mots. */
export function requestPuzzle<P>(request: GenerateRequest, signal?: AbortSignal): Promise<P> {
  return runWorker<P>(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }), request, { signal })
}

export interface GridPrefs<S extends string> {
  size: S
  level: Level
}

/** Écran de départ : taille de grille, niveau des définitions, et lancement. */
export function GridPicker<S extends string>(props: {
  title: string
  prefsKey: string
  sizes: { id: S; label: string; width: number; height: number }[]
  onStart: (p: GridPrefs<S>) => void
  loading: boolean
  error: string | null
  levels?: { id: Level; label: string; detail: string }[]
  /** Titre de la section des niveaux. */
  levelsTitle?: string
}) {
  const levels = props.levels ?? LEVELS
  const levelsTitle = props.levelsTitle ?? 'Définitions'
  const [prefs, setPrefs] = useState<GridPrefs<S>>(() => {
    // Des préférences enregistrées peuvent viser une taille ou un niveau qui n'existe plus.
    const saved = load<GridPrefs<S>>(props.prefsKey)
    return {
      size: props.sizes.some((s) => s.id === saved?.size) ? saved!.size : props.sizes[0].id,
      level: levels.some((l) => l.id === saved?.level) ? saved!.level : levels[0].id,
    }
  })
  const update = (p: Partial<GridPrefs<S>>) => {
    const next = { ...prefs, ...p }
    setPrefs(next)
    save(props.prefsKey, next)
  }

  return (
    <main className="page">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
      </header>
      <h1 className="title">{props.title}</h1>
      <p className="subtitle">Une nouvelle grille à chaque partie</p>

      <h2 className="label">Taille</h2>
      <div className="segmented" role="radiogroup" aria-label="Taille">
        {props.sizes.map((s) => (
          <button key={s.id} role="radio" aria-checked={prefs.size === s.id} className={prefs.size === s.id ? 'on' : undefined} onClick={() => update({ size: s.id })}>
            {s.label}
            <small>
              {s.width}×{s.height}
            </small>
          </button>
        ))}
      </div>

      <h2 className="label">{levelsTitle}</h2>
      <div className="segmented two" role="radiogroup" aria-label={levelsTitle}>
        {levels.map((l) => (
          <button key={l.id} role="radio" aria-checked={prefs.level === l.id} className={prefs.level === l.id ? 'on' : undefined} onClick={() => update({ level: l.id })}>
            {l.label}
            <small>{l.detail}</small>
          </button>
        ))}
      </div>

      <button className="primary wide" onClick={() => props.onStart(prefs)} disabled={props.loading}>
        {props.loading ? 'Préparation de la grille…' : 'Nouvelle grille'}
      </button>
      {props.error && <p className="error">{props.error}</p>}
    </main>
  )
}

/**
 * Cycle de vie commun aux jeux de grille générée : reprise de la partie sauvegardée, lancement de la génération
 * (annulée si on relance ou quitte la page), message d'erreur, abandon.
 */
export function useGeneratedGame<P extends WordPuzzle, S extends string>(
  saveKey: string,
  request: (prefs: GridPrefs<S>, signal: AbortSignal) => Promise<P>,
) {
  const [game, setGame] = useState(() => {
    const saved = load<GridState<P>>(saveKey)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextSignal = useCancellable()

  const start = (prefs: GridPrefs<S>) => {
    const signal = nextSignal()
    setLoading(true)
    setError(null)
    request(prefs, signal)
      .then((puzzle) => setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(puzzle) })))
      .catch(() => signal.aborted || setError('La grille n’a pas pu être préparée. Réessaie !'))
      .finally(() => signal.aborted || setLoading(false))
  }

  const quit = () => {
    remove(saveKey)
    setGame(null)
  }

  return { game, loading, error, start, quit }
}

/** « Moyenne · Facile » ; reste lisible même si une partie sauvegardée vise une taille ou un niveau disparu. */
export function gameLabel(sizes: { id: string; label: string }[], levels: { id: string; label: string }[], puzzle: { size: string; level: string }) {
  return [sizes.find((s) => s.id === puzzle.size)?.label, levels.find((l) => l.id === puzzle.level)?.label].filter(Boolean).join(' · ')
}

/** Saisie au clavier physique : lettres (ou chiffres), effacement, flèches. */
export function useGridKeyboard(dispatch: Dispatch<GridAction>, digits = false) {
  useEffect(() => {
    const allowed = digits ? /^[0-9]$/ : /^[a-zA-Z]$/
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (allowed.test(e.key)) dispatch({ type: 'input', letter: e.key })
      else if (e.key === 'Backspace' || e.key === 'Delete') dispatch({ type: 'erase' })
      else if (e.key === 'ArrowUp') dispatch({ type: 'move', dRow: -1, dCol: 0 })
      else if (e.key === 'ArrowDown') dispatch({ type: 'move', dRow: 1, dCol: 0 })
      else if (e.key === 'ArrowLeft') dispatch({ type: 'move', dRow: 0, dCol: -1 })
      else if (e.key === 'ArrowRight') dispatch({ type: 'move', dRow: 0, dCol: 1 })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, digits])
}

export function ClueBar({ clue, prefix, unit = 'lettres' }: { clue: WordClue | undefined; prefix?: string; unit?: string }) {
  return (
    <div className="clue-bar" aria-live="polite">
      {clue ? (
        <>
          <span className="clue-dir" aria-hidden>
            {prefix ?? (clue.dir === 'h' ? '→' : '↓')}
          </span>
          <span>{clue.text}</span>
          <span className="clue-len">
            {clue.cells.length} {unit}
          </span>
        </>
      ) : (
        <span className="muted">Touche une case pour commencer</span>
      )}
    </div>
  )
}

export function GridTools({ dispatch, numbers = false }: { dispatch: Dispatch<GridAction>; numbers?: boolean }) {
  return (
    <div className="tools">
      <button onClick={() => dispatch({ type: 'check' })}>
        <span aria-hidden>✓</span>Vérifier
      </button>
      <button onClick={() => dispatch({ type: 'revealLetter' })}>
        <span aria-hidden>?</span>
        {numbers ? 'Un chiffre' : 'Une lettre'}
      </button>
      <button onClick={() => dispatch({ type: 'revealWord' })}>
        <span aria-hidden>¶</span>
        {numbers ? 'Le nombre' : 'Le mot'}
      </button>
      <button onClick={() => dispatch({ type: 'erase' })}>
        <span aria-hidden>⌫</span>Effacer
      </button>
    </div>
  )
}

export function Keyboard({ dispatch, digits = false }: { dispatch: Dispatch<GridAction>; digits?: boolean }) {
  return (
    <div className="keyboard">
      {(digits ? DIGITS : KEYBOARD).map((row) => (
        <div key={row} className="key-row">
          {[...row].map((k) => (
            <button key={k} onClick={() => dispatch({ type: 'input', letter: k })}>
              {k}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Victory({ elapsed, hints, onNewGame }: { elapsed: number; hints: number; onNewGame: () => void }) {
  return (
    <div className="overlay">
      <div className="card">
        <h2>Bravo !</h2>
        <p>
          Grille terminée en <strong>{formatTime(elapsed)}</strong>
        </p>
        <p className="muted">
          {hints} indice{hints > 1 ? 's' : ''}
        </p>
        <button className="primary" onClick={onNewGame}>Nouvelle grille</button>
      </div>
    </div>
  )
}
