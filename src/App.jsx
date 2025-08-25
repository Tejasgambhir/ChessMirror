import { useState ,useEffect} from 'react'
import ChessAnalysisTool from './components/chessAnalysis'
import ChessboardFeature from './components/chessboard.jsx'
import posthog from 'posthog-js'

function App() {
  return (
    <>
      <ChessAnalysisTool/>
    </>
  )
}

export default App;
