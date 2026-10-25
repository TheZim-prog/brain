import { LEVELS } from '../mots/types'
import { gameLabel, GridPicker, requestPuzzle, useGeneratedGame } from '../mots/ui'
import { SIZES, type Crossword, type SizeId } from './config'
import { CrossBoard } from './CrossBoard'

const SAVE_KEY = 'brain:mots-croises:current'

export default function MotsCroisesPage() {
  const { game, loading, error, start, quit } = useGeneratedGame<Crossword, SizeId>(SAVE_KEY, ({ size, level }, signal) =>
    requestPuzzle<Crossword>({ game: 'croises', size, level }, signal),
  )

  if (!game) return <GridPicker title="Mots croisés" prefsKey="brain:mots-croises:prefs" sizes={SIZES} onStart={start} loading={loading} error={error} />
  return <CrossBoard key={game.id} initial={game.state} saveKey={SAVE_KEY} label={gameLabel(SIZES, LEVELS, game.state.puzzle)} onNewGame={quit} />
}
