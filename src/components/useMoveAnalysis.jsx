import { useMemo } from 'react';

const QUALITY_COLORS = {
  excellent: 'text-green-400 bg-green-900/20',
  good: 'text-yellow-400 bg-yellow-900/20',
  inaccurate: 'text-orange-400 bg-orange-900/20',
  mistake: 'text-red-300 bg-red-900/20',
  blunder: 'text-red-400 bg-red-900/30',
};

function clampNumber(x) {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  return x;
}

// Determine centipawn-loss-like delta from mover’s perspective (in pawns)
function getEvaluationChangeForMover(prevEval, evalNow, moverColor) {
  const prev = clampNumber(prevEval || 0);
  const curr = clampNumber(evalNow || 0);

  if (moverColor === 'w') {
    // White moved. Positive delta means worse for white.
    return prev - curr;
  } else {
    // Black moved. Positive delta means worse for black (i.e., better for white).
    return curr - prev;
  }
}

function toQuality(evaluationChange) {
  // evaluationChange is in pawns
  const x = Math.max(0, evaluationChange || 0);
  if (x <= 0.2) return 'excellent';
  if (x <= 0.7) return 'good';
  if (x <= 1.5) return 'inaccurate';
  if (x <= 3.0) return 'mistake';
  return 'blunder';
}

function isCentralPawnPush(move) {
  if (!move) return false;
  // chess.js move has from/to squares like "e2"->"e4", and SAN like "e4"
  const san = move.san || '';
  const to = (move.to || '').toLowerCase();
  // Center squares: e4, d4, e5, d5
  const centralTargets = new Set(['e4', 'd4', 'e5', 'd5']);
  // Common pawn push SAN patterns: "e4", "d4", "e5", "d5" (no piece letter)
  const isPawnSan = san && /^[a-h][1-8](=?[QRBN])?$/.test(san);
  return isPawnSan && centralTargets.has(to);
}

function pieceName(letter) {
  // chess.js uses: p,n,b,r,q,k (lowercase for black, uppercase is not used on verbose move)
  const map = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
  };
  return map[letter?.toLowerCase()] || 'piece';
}

function valueOfPiece(letter) {
  // Simple heuristic values in pawns
  const map = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return map[letter?.toLowerCase()] ?? 0;
}

function firstDevelopment(move, positionType) {
  // Very light heuristic: in the opening, moving a minor piece from back rank looks like development
  if (positionType !== 'opening' || !move) return false;
  const from = move.from?.toLowerCase();
  const piece = move.piece?.toLowerCase(); // 'n' or 'b' for minor pieces
  if (!from || !piece) return false;
  const isMinor = piece === 'n' || piece === 'b';
  if (!isMinor) return false;
  // Back ranks: white = rank 1, black = rank 8
  const rank = from[1];
  return rank === '1' || rank === '8';
}

function ruleBasedExplanation(move, positionType) {
  if (!move) return 'Make a move to see analysis';
  const san = move.san || '';
  const flags = move.flags || '';

  // Checkmate
  if (san.includes('#')) {
    return 'A brilliant move, resulting in checkmate!';
  }

  // Check
  if (san.includes('+')) {
    return 'Delivering a check to the opponent’s king to restrict its options.';
  }

  // Castling
  if (san === 'O-O' || san === 'O-O-O' || flags.includes('k') || flags.includes('q')) {
    return 'Castling improves king safety and connects the rooks.';
  }

  // Promotion
  if (flags.includes('p') || /=/.test(san)) {
    return 'Promoting a pawn to a more powerful piece, significantly strengthening your position.';
  }

  // Capture
  if (flags.includes('c')) {
    const captured = move.captured ? pieceName(move.captured) : 'piece';
    const val = valueOfPiece(move.captured);
    if (val >= 5) {
      return `Capturing a high-value ${captured} to gain a material advantage.`;
    }
    if (val >= 3) {
      return `Capturing a valuable ${captured} to improve material balance.`;
    }
    return 'Capturing an enemy piece to gain a material edge.';
  }

  // Central pawn push
  if (isCentralPawnPush(move)) {
    return 'A strong pawn push that seizes control of key central squares.';
  }

  // Early development
  if (firstDevelopment(move, positionType)) {
    return 'Developing a minor piece off the back rank to control the center.';
  }

  // Default
  return 'Improving piece activity and preparing future plans.';
}

function suggestionLine(lastMove, bestMove, quality) {
  if (!bestMove) return '';
  const isBestPlayed = lastMove?.san === bestMove;
  if (isBestPlayed) {
    // Positive reinforcement, vary slightly with quality
    if (quality === 'excellent') return 'Excellent choice—top engine move!';
    if (quality === 'good') return 'Strong practical choice aligned with the plan.';
    return 'Solid move aligning with your position’s needs.';
  }
  // Provide a short rationale stub; in the future, can be refined with deeper PV analysis
  return `Consider ${bestMove}, which could have improved your evaluation.`;
}

export function useMoveAnalysis(lastMove, evaluation, prevEvaluation, bestMove, positionType = 'middlegame') {
  return useMemo(() => {
    if (!lastMove) {
      return {
        quality: 'good',
        explanation: 'Make a move to see analysis',
        suggestion: '',
        qualityColor: QUALITY_COLORS.good,
        evaluationChange: 0,
      };
    }

    const moverColor = lastMove.color === 'b' ? 'b' : 'w';
    const delta = getEvaluationChangeForMover(prevEvaluation, evaluation, moverColor); // in pawns
    const quality = toQuality(delta);
    const explanation = ruleBasedExplanation(lastMove, positionType);
    const suggestion = suggestionLine(lastMove, bestMove, quality);

    return {
      quality,
      explanation,
      suggestion,
      qualityColor: QUALITY_COLORS[quality],
      evaluationChange: delta, // expose if UI wants to show CPL
    };
  }, [lastMove, evaluation, prevEvaluation, bestMove, positionType]);
}
