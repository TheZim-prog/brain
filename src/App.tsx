import { Suspense } from 'react'
import { GAMES } from './games/registry'
import { useHashRoute } from './lib/useHashRoute'

export default function App() {
  const route = useHashRoute()
  const game = GAMES.find((g) => g.id === route && g.component)

  if (game?.component) {
    const Game = game.component
    return (
      <Suspense fallback={<main className="page" />}>
        <Game />
      </Suspense>
    )
  }

  return (
    <main className="page">
      <h1 className="title masthead">Brain</h1>
      <p className="subtitle">Les jeux de ton magazine, dans ta poche.</p>
      <ul className="games">
        {GAMES.map((g) => (
          <li key={g.id}>
            {g.component ? (
              <a className="game" href={`#/${g.id}`}>
                <strong>{g.name}</strong>
                <span>{g.description}</span>
              </a>
            ) : (
              <div className="game soon" aria-disabled>
                <strong>{g.name}</strong>
                <span>{g.description}</span>
                <em>Bientôt</em>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
