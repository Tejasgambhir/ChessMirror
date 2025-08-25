import React from 'react';
import { useMoveAnalysis } from './useMoveAnalysis';

const QUALITY_LABELS = {
  excellent: 'excellent',
  good: 'good',
  inaccurate: 'inaccurate',
  mistake: 'mistake',
  blunder: 'blunder',
};

const MoveExplanation = ({
  lastMove,
  evaluation = 0,        // current evaluation after lastMove, in pawns
  prevEvaluation = 0,     // evaluation before lastMove, in pawns
  bestMove,
  positionType = 'middlegame',
}) => {
  const analysis = useMoveAnalysis(lastMove, evaluation, prevEvaluation, bestMove, positionType);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Move Analysis
      </h3>

      {!lastMove ? (
        <p className="text-gray-400">Make a move to see detailed analysis</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-white font-mono text-lg">
              {lastMove?.san}
            </span>
            <span className={`px-2 py-1 rounded text-sm capitalize ${analysis.qualityColor}`}>
              {QUALITY_LABELS[analysis.quality]}
            </span>
          </div>

          <p className="text-gray-300 leading-relaxed">
            {analysis.explanation}
          </p>

          {analysis.suggestion && (
            <div className="bg-blue-900/20 border-l-4 border-blue-400 p-3">
              <p className="text-blue-300 text-sm">
                💡 {analysis.suggestion}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Position: {positionType}</span>
            <span>
              Eval: {evaluation > 0 ? '+' : ''}{Number(evaluation).toFixed(2)}
              {typeof analysis.evaluationChange === 'number' && (
                <span className="ml-2 text-gray-500">
                  (Δ {analysis.evaluationChange > 0 ? '+' : ''}{analysis.evaluationChange.toFixed(2)})
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoveExplanation;
