// Morceaux d'interface communs aux jeux de grille à mots.
import { useEffect, useState, type Dispatch } from 'react'
import { formatTime } from '../../lib/format'
import { load, save } from '../../lib/storage'
import { runWorker } from '../../lib/worker'
import type { GridAction } from './state'
import { LEVELS, type Level, type WordClue } from './types'
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
}) {
  const levels = props.levels ?? LEVELS
  const [prefs, setPrefs] = useState<GridPrefs<S>>(() => load<GridPrefs<S>>(props.prefsKey) ?? { size: props.sizes[0].id, level: 'facile' })
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

      <h2 className="label">Définitions</h2>
      <div className="segmented two" role="radiogroup" aria-label="Définitions">
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
