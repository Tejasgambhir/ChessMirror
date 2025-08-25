import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Engine from '../../public/stockfish/engine';
import EvaluationBar from './EvaluationBar';
import OpeningMoves from './OpeningMoves';
import MoveExplanation from './MoveExplanation';


const ChessEngineGame = ({playerOpenings}) => {
  // Core state and refs...
  const engine = useMemo(() => new Engine(), []);
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const engineMoveTimeoutRef = useRef(null);
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [positionEvaluation, setPositionEvaluation] = useState(0);
  const prevEvalRef = useRef(0);
  const [depth, setDepth] = useState(10);
  const [bestLine, setBestLine] = useState('');
  const [possibleMate, setPossibleMate] = useState('');
  const [enginePlaysAs, setEnginePlaysAs] = useState(null);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);
//   const [playerOpenings, setPlayerOpenings] = useState({ white: [], black: [] });
  const [currentPlayerColor, setCurrentPlayerColor] = useState('white');
  const [lastMove, setLastMove] = useState(null);
  const [playingOpening, setPlayingOpening] = useState(false);
  const [gamePhase, setGamePhase] = useState('opening');
  const [gameHistory, setGameHistory] = useState([]);
  const [moveStack, setMoveStack] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);
  // FIX: Add state to manage the sequence of opening moves
  const [openingSequence, setOpeningSequence] = useState(null); // e.g., { moves: ['e4', 'e5'], index: 0 }
  const isEngineThinkingRef = useRef(false);
  const enginePlaysAsRef = useRef(null);

  const clearPendingEngineMove = useCallback(() => {
    if (engineMoveTimeoutRef.current) {
      clearTimeout(engineMoveTimeoutRef.current);
      engineMoveTimeoutRef.current = null;
    }
  }, []);


  // Initialize and cleanup engine
  useEffect(() => {
    console.log('Stockfish engine ready');
    return () => {
      engine.stop();
      clearPendingEngineMove();
    };
  }, [engine, clearPendingEngineMove]);



  const makeMove = useCallback((move) => {
    const historyToBranchFrom = moveStack.slice(0, currentMoveIndex + 1);
    const tempGame = new Chess();
    historyToBranchFrom.forEach(m => tempGame.move(m));

    try {
      const moveResult = tempGame.move(move);
      if (moveResult) {
        chessGameRef.current = tempGame;
        const newHistory = tempGame.history({ verbose: true });
        setMoveStack(newHistory);
        setCurrentMoveIndex(newHistory.length - 1);
        setLastMove(moveResult);
        setChessPosition(tempGame.fen());
        clearPendingEngineMove();
        engine.stop();
        setBestLine('');
        setPossibleMate('');
        setIsEngineThinking(false);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [moveStack, currentMoveIndex, engine, clearPendingEngineMove]);

  const makeEngineMove = useCallback((moveUci) => {
    const moveData = { from: moveUci.substring(0, 2), to: moveUci.substring(2, 4), promotion: moveUci.length > 4 ? moveUci.substring(4) : undefined };
    if (!makeMove(moveData)) {
      console.error('Engine move failed:', moveUci);
      setIsEngineThinking(false);
    }
  }, [makeMove]);
 
 useEffect(() => {
  isEngineThinkingRef.current = isEngineThinking;
}, [isEngineThinking]);

useEffect(() => {
  enginePlaysAsRef.current = enginePlaysAs;
}, [enginePlaysAs]);

useEffect(() => {
  if (chessGame.isGameOver() || chessGame.isDraw() || playingOpening) return;
  engine.evaluatePosition(chessGame.fen(), 18);
}, [chessPosition]);

useEffect(() => {
  if (!autoPlay || enginePlaysAs !== chessGame.turn() || playingOpening) return;
  setIsEngineThinking(true);
}, [chessPosition, autoPlay, enginePlaysAs, playingOpening]);


  useEffect(() => {
    const handleEngineMessage = ({ positionEvaluation, possibleMate, pv, depth: currentDepth }) => {

      if (currentDepth && currentDepth < 8) return;
      if (positionEvaluation !== undefined) {
  setPositionEvaluation((chessGame.turn() === 'w' ? 1 : -1) * Number(positionEvaluation) / 100);
  prevEvalRef.current = positionEvaluation;
   }
      if (possibleMate !== undefined) setPossibleMate(possibleMate);
      if (currentDepth) setDepth(currentDepth);
      if (pv) {
        setBestLine(pv);
        if (autoPlay && enginePlaysAsRef.current === chessGame.turn() && isEngineThinkingRef.current)
 {
          const bestMove = pv.split(' ')[0];
          if (bestMove) {
            clearPendingEngineMove();
            engineMoveTimeoutRef.current = setTimeout(() => makeEngineMove(bestMove), 1000);
          }
        }
      }
    }
    engine.onMessage(handleEngineMessage);
    return () => { clearPendingEngineMove(); };
  }, [chessPosition, autoPlay, enginePlaysAs, isEngineThinking, engine, chessGame, makeEngineMove, clearPendingEngineMove, playingOpening]);

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (playingOpening || (autoPlay && enginePlaysAs === chessGame.turn())) return false;
      return makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    },
    [playingOpening, autoPlay, enginePlaysAs, chessGame, makeMove]
  );
  
  const flipBoard = useCallback(() => {
    setBoardFlipped(prev => !prev);
    setCurrentPlayerColor(prev => (prev === 'white' ? 'black' : 'white'));
  }, []);

  const resetGame = useCallback(() => {
    clearPendingEngineMove();
    engine.stop();
    setOpeningSequence(null); // Stop any opening sequence on reset
    chessGameRef.current = new Chess();
    setChessPosition(chessGameRef.current.fen());
    setBestLine('');
    setPossibleMate('');
    setPositionEvaluation(0);
    setDepth(10);
    setIsEngineThinking(false);
    setLastMove(null);
    setGameHistory([]);
    setMoveStack([]);
    setCurrentMoveIndex(-1);
    setEnginePlaysAs(null);
    setAutoPlay(false);
    setPlayingOpening(false);
  }, [engine, clearPendingEngineMove]);

  const goToMove = useCallback((moveIndex) => {
    if (playingOpening) return;
    clearPendingEngineMove();
    engine.stop();
    const newGame = new Chess();
    const movesToReplay = moveStack.slice(0, moveIndex + 1);
    movesToReplay.forEach(move => newGame.move(move));
    chessGameRef.current = newGame;
    setChessPosition(newGame.fen());
    setCurrentMoveIndex(moveIndex);
    setLastMove(moveIndex >= 0 ? movesToReplay[moveIndex] : null);
    setBestLine('');
    setPossibleMate('');
    setIsEngineThinking(false);
  }, [moveStack, playingOpening, engine, clearPendingEngineMove]);

  const undoMove = useCallback(() => {
    if (currentMoveIndex >= 0 && !playingOpening) {
      goToMove(currentMoveIndex - 1);
    }
  }, [currentMoveIndex, playingOpening, goToMove]);

  // FIX: This function now simply STARTS the sequence.
  const playOpeningMoves = useCallback((moves, opening) => {
    if (playingOpening || moveStack.length > 0) return;
    if (!opening || !opening.initial_moves_pgn) return;

    const movesList = opening.initial_moves_pgn
      .replace(/\d+\./g, '')
      .trim()
      .split(/\s+/)
      .filter(mv => mv && !mv.includes('*'));

    if (movesList.length > 0) {
      setPlayingOpening(true);
      setOpeningSequence({ moves: movesList, index: 0 });
    }
  }, [playingOpening, moveStack.length]);

  // FIX: This new useEffect hook DRIVES the sequence, ensuring state is always fresh.
  useEffect(() => {
    if (!openingSequence) return;

    const { moves, index } = openingSequence;

    if (index >= moves.length) {
      setOpeningSequence(null);
      setPlayingOpening(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      const move = moves[index];
      if (makeMove(move)) {
        setOpeningSequence(prev => ({ ...prev, index: prev.index + 1 }));
      } else {
        console.error("Error playing opening move, stopping sequence:", move);
        setOpeningSequence(null);
        setPlayingOpening(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [openingSequence, makeMove]);

  const toggleAutoPlay = useCallback(() => {
    clearPendingEngineMove();
    engine.stop();
    setAutoPlay(prev => !prev);
    setIsEngineThinking(false);
  }, [engine, clearPendingEngineMove]);

  const handleSetEnginePlaysAs = useCallback((color) => {
    clearPendingEngineMove();
    engine.stop();
    setEnginePlaysAs(prev => (prev === color ? null : color));
    setIsEngineThinking(false);
  }, [engine, clearPendingEngineMove]);

  const makeEngineMoveManuallly = useCallback(() => {
    clearPendingEngineMove();
    setIsEngineThinking(true);
    if (bestLine && !playingOpening) {
      const bestMove = bestLine.split(' ')[0];
      if (bestMove) { makeEngineMove(bestMove); }
    }
    setIsEngineThinking(false);
  }, [bestLine, playingOpening, makeEngineMove]);

  useEffect(() => {
    setGameHistory(moveStack);
  }, [moveStack]);

  useEffect(() => {
    const moveCount = chessGame.history().length;
    const pieces = chessGame.board().flat().filter(Boolean);
    const majorPiecesCount = pieces.filter(p => ['q', 'r'].includes(p.type)).length;
    if (moveCount < 20) { setGamePhase('opening'); }
    else if (majorPiecesCount > 4) { setGamePhase('middlegame'); }
    else { setGamePhase('endgame'); }
  }, [chessPosition, chessGame]);

  const bestMove = bestLine?.split(' ')?.[0];

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    boardOrientation: boardFlipped ? 'black' : 'white',
    animationDuration: 200,
    arePiecesDraggable: !playingOpening && !isEngineThinking && currentMoveIndex === moveStack.length - 1,
    customBoardStyle: { borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', maxWidth: '600px', maxHeight: '600px', width: '80vw', height: '80vw' },
    customDarkSquareStyle: { backgroundColor: '#779952' },
    customLightSquareStyle: { backgroundColor: '#edeed1' },
    customArrows: bestMove && !playingOpening ? [{ startSquare: bestMove.substring(0, 2), endSquare: bestMove.substring(2, 4), color: 'rgba(0, 128, 0, 0.8)' }] : [],
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen p-6 bg-gray-900 gap-6">
      {/* Left Panel: Chessboard and Controls */}
      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
        {/* Controls */}
        <div className="flex flex-wrap justify-between items-center w-full gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <button onClick={flipBoard} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2 disabled:opacity-50" disabled={playingOpening} title="Flip Board">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" /></svg>
              <span>Flip</span>
            </button>
            <button onClick={undoMove} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50" disabled={playingOpening || currentMoveIndex < 0} title="Undo Move">
              Undo
            </button>
            {bestMove && (
              <button onClick={makeEngineMoveManuallly} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50" disabled={playingOpening || isEngineThinking}  title="Play Best Engine Move">
                Play Best
              </button>
            )}
          </div>
          <div className="text-gray-400 text-sm text-center flex-1">
            Playing as:{' '}
            <span className="text-white capitalize font-medium">{currentPlayerColor}</span>
          </div>
          <button onClick={resetGame} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50" disabled={playingOpening} title="Reset Board">
            Reset
          </button>
        </div>
        <EvaluationBar evaluation={positionEvaluation} possibleMate={possibleMate} />
        <div className="relative mt-4 w-full max-w-[600px]">
          <Chessboard options={chessboardOptions} />
          {playingOpening && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Playing opening...</span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 w-full text-center text-gray-300 space-y-2">
          <div className="flex justify-center items-center space-x-4 text-lg">
            {chessGame.isGameOver() ? ( chessGame.isCheckmate() ? (<span>{chessGame.turn() === 'w' ? 'Black' : 'White'} wins!</span>) : chessGame.isDraw() ? (<span>Game drawn</span>) : (<span>Game over</span>) ) : ( <span>{chessGame.turn() === 'w' ? 'White' : 'Black'} to move</span> )}
            {chessGame.inCheck() && !chessGame.isGameOver() && (<span className="text-red-400 font-bold">CHECK!</span>)}
          </div>
          <div className="text-sm text-gray-400">Move {Math.ceil(gameHistory.length / 2)} • {gamePhase}</div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="lg:w-[400px] flex flex-col space-y-6 overflow-y-auto">
        {/* Stockfish Engine Controls */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Stockfish Engine
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-white text-sm">Auto-play:</span>
              <button onClick={toggleAutoPlay} className={`px-3 py-1 rounded text-sm transition-colors ${autoPlay ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                {autoPlay ? 'ON' : 'OFF'}
              </button>
            </div>
            {autoPlay && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSetEnginePlaysAs('w')} className={`py-2 px-3 rounded text-sm transition-colors ${enginePlaysAs === 'w' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} disabled={playingOpening}>
                  Play as White
                </button>
                <button onClick={() => handleSetEnginePlaysAs('b')} className={`py-2 px-3 rounded text-sm transition-colors ${enginePlaysAs === 'b' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} disabled={playingOpening}>
                  Play as Black
                </button>
              </div>
            )}
            {autoPlay && enginePlaysAs && (<div className="text-xs text-gray-400 text-center">Engine will auto-play as {enginePlaysAs === 'w' ? 'White' : 'Black'}</div>)}
            <div className="mt-4 space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Depth:</span>
                <span className="text-white">{depth}</span>
              </div>

              <div>
                  <div className="text-gray-400 mb-1">Best line:</div>
                  <div className="text-white font-mono text-xs break-all bg-gray-700 p-2 rounded min-h-[36px] flex items-center">
                    {bestLine ? (
                      <>
                        {bestLine.split(' ').slice(0, 8).join(' ')}
                        {bestLine.split(' ').length > 8 && '...'}
                      </>
                    ) : (
                      <span className="text-gray-400">Calculating...</span>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Move History Section */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-3">Move History</h3>
          <div className="flex justify-center space-x-2 mb-3 flex-wrap">
            <button onClick={() => goToMove(-1)} disabled={playingOpening || currentMoveIndex < 0} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50" title="Go to start">⏪ Start</button>
            <button onClick={() => goToMove(currentMoveIndex - 1)} disabled={playingOpening || currentMoveIndex < 0} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50" title="Previous move">◀ Prev</button>
            <button onClick={() => goToMove(currentMoveIndex + 1)} disabled={playingOpening || currentMoveIndex >= moveStack.length - 1} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50" title="Next move">Next ▶</button>
            <button onClick={() => goToMove(moveStack.length - 1)} disabled={playingOpening || currentMoveIndex >= moveStack.length - 1} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50" title="Go to end">End ⏩</button>
          </div>
          <div className="max-h-40 overflow-y-auto rounded bg-gray-900 p-2 text-sm text-white font-mono">
            {gameHistory.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-400 font-semibold">#</div>
                <div className="text-gray-400 font-semibold">White</div>
                <div className="text-gray-400 font-semibold">Black</div>
                {Array.from({ length: Math.ceil(gameHistory.length / 2) }, (_, i) => {
                  const whiteMove = gameHistory[i * 2];
                  const blackMove = gameHistory[i * 2 + 1];
                  const whiteMoveIndex = i * 2;
                  const blackMoveIndex = i * 2 + 1;
                  return (
                    <React.Fragment key={i}>
                      <div>{i + 1}.</div>
                      <div className={`cursor-pointer rounded px-1 ${currentMoveIndex === whiteMoveIndex ? 'bg-blue-600' : 'hover:bg-gray-700'}`} onClick={() => goToMove(whiteMoveIndex)} title={`Go to move ${whiteMoveIndex + 1}`}>{whiteMove?.san || ''}</div>
                      <div className={`cursor-pointer rounded px-1 ${currentMoveIndex === blackMoveIndex ? 'bg-blue-600' : 'hover:bg-gray-700'}`} onClick={() => blackMove && goToMove(blackMoveIndex)} title={`Go to move ${blackMoveIndex + 1}`}>{blackMove?.san || ''}</div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : <div className="text-center text-gray-400">No moves played</div>}
          </div>
        </div>
        {/* Top Opening List */}
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg max-h-52 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-3">Top Opening List ({currentPlayerColor})</h3>
          <OpeningMoves
            openings={playerOpenings[currentPlayerColor] || []}
            playerColor={currentPlayerColor}
            onMovesPlay={(moves, opening) => playOpeningMoves(moves, opening)}
            isFlipped={boardFlipped}
            disabled={moveStack.length > 0 || playingOpening}
          />
        </div>
        <MoveExplanation lastMove={lastMove} evaluation={positionEvaluation} prevEvaluation = {prevEvalRef.current} bestMove={bestMove} positionType={gamePhase}  />
      </div>
    </div>
  );
};

export default ChessEngineGame;
