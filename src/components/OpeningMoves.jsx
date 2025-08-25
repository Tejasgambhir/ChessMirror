import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

const OpeningMoves = ({ 
  openings, 
  playerColor, 
  onMovesPlay, 
  isFlipped ,
  Buttondisabled = false
}) => {
 
  
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [expandedOpening, setExpandedOpening] = useState(null);

  const playOpeningMoves = (opening) => {
    if (Buttondisabled || !opening.initial_moves_pgn) return;
    
    const tempGame = new Chess();
    const moves = [];
    
    try {
      // Parse PGN moves
      const movesList = opening.initial_moves_pgn
        .replace(/\d+\./g, '') // Remove move numbers
        .trim()
        .split(/\s+/)
        .filter(move => move && !move.includes('*'));

      movesList.forEach(move => {
        const moveObj = tempGame.move(move);
        if (moveObj) {
          moves.push(moveObj);
        }
      });

      onMovesPlay(moves, opening);
      setSelectedOpening(opening);
    } catch (error) {
      console.error('Error parsing opening moves:', error);
    }
  };

  const formatMovesPairs = (pgn) => {
    if (!pgn) return [];
    
    const movesList = pgn
      .replace(/\d+\./g, '')
      .trim()
      .split(/\s+/)
      .filter(move => move && !move.includes('*'));

    const pairs = [];
    for (let i = 0; i < movesList.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      pairs.push({
        number: moveNum,
        white: movesList[i] || '',
        black: movesList[i + 1] || ''
      });
    }
    return pairs.slice(0, 5); // First 5 move pairs (10 moves)
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-3">
        Top Openings as {playerColor === 'white' ? 'White' : 'Black'}
      </h3>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {openings.map((opening, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">
                  {opening.name}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                  <span className="bg-gray-600 px-2 py-1 rounded text-xs">
                    {opening.eco}
                  </span>
                  <span>{opening.games} games</span>
                  <span className={`font-medium ${
                    opening.win_rate > 0.5 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(opening.win_rate * 100).toFixed(0)}% win rate
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setExpandedOpening(
                    expandedOpening === index ? null : index
                  )}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="View moves"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d={expandedOpening === index ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </button>
                
                <button
                  onClick={() => playOpeningMoves(opening)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  disabled={!opening.initial_moves_pgn}
                >
                  Play
                </button>
              </div>
            </div>
            
            {/* Expanded moves view */}
            {expandedOpening === index && opening.initial_moves_pgn && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium text-gray-300">#</div>
                  <div className="font-medium text-gray-300">White</div>
                  <div className="font-medium text-gray-300">Black</div>
                  
                  {formatMovesPairs(opening.initial_moves_pgn).map(pair => (
                    <React.Fragment key={pair.number}>
                      <div className="text-gray-400">{pair.number}.</div>
                      <div className="text-white font-mono">{pair.white}</div>
                      <div className="text-white font-mono">{pair.black}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
            
            {selectedOpening?.name === opening.name && (
              <div className="mt-2 text-xs text-green-400">
                ✓ Currently showing on board
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpeningMoves;
