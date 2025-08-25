import React from 'react';

const EvaluationBar = ({ evaluation = 0, possibleMate }) => {
  console.log(`EvaluationBar rendered with evaluation: ${evaluation}, possibleMate: ${possibleMate}`);
  
  // A smooth scaling function to convert engine evaluation to a percentage.
  // This replaces the previous jumpy, threshold-based logic.
  const getWhiteAdvantage = (evaluate) => {
    // Handle mate evaluations
    if (possibleMate) {
      return possibleMate > 0 ? 100 : 0;
    }
    
    // Handle null or undefined evaluations
    if (evaluate === undefined || evaluate === null || isNaN(evaluate)) {
      return 50; // Neutral position
    }
    
    // Use a logistic function for smooth scaling from evaluation to a 0-1 range.
    // The factor -0.4 provides a good sensitivity curve.
    const scaledAdvantage = 1 / (1 + Math.exp(-0.4 * evaluate));
    
    // Convert to a percentage and clamp between 5% and 95%.
    // This ensures both sides of the bar are always visible.
    const percentage = scaledAdvantage * 100;
    return Math.max(5, Math.min(95, percentage));
  };

  const whitePercentage = getWhiteAdvantage(evaluation);
  const blackPercentage = 100 - whitePercentage;

  const getEvaluationText = () => {
    if (possibleMate) {
      return `M${Math.abs(possibleMate)}`;
    }
    
    if (evaluation === undefined || evaluation === null || isNaN(evaluation)) {
      return '0.0';
    }
    
    if (Math.abs(evaluation) < 0.05) return '0.0';
    
    // Use different precision for large vs. small evaluations for readability
    if (Math.abs(evaluation) >= 10) {
      return evaluation > 0 ? `+${evaluation.toFixed(0)}` : evaluation.toFixed(0);
    }
    
    return evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
  };
  
  // Get evaluation description
  const getEvaluationDescription = () => {
    const absEval = Math.abs(evaluation);
    if (possibleMate) {
      return `Checkmate in ${Math.abs(possibleMate)}`;
    }
    if (absEval >= 10) return 'Completely winning';
    if (absEval >= 5) return 'Decisive advantage';
    if (absEval >= 3) return 'Major advantage';
    if (absEval >= 1.5) return 'Clear advantage';
    if (absEval >= 0.5) return 'Slight advantage';
    return 'Equal position';
  };

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      {/* Title */}
      <div className="flex items-center justify-center mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Position Evaluation</h3>
        </div>
      </div>

      {/* Main Evaluation Bar */}
      <div className="relative h-10 bg-gray-800 rounded-xl overflow-hidden border border-white/20 shadow-lg">
        {/* White advantage section */}
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-500 ease-out z-10"
          style={{ 
            width: `${whitePercentage}%`,
            background: 'linear-gradient(to right, #ffffff, #f3f4f6)'
          }}
        />
        
        {/* Black advantage section */}
        <div 
          className="absolute top-0 right-0 h-full transition-all duration-500 ease-out z-10"
          style={{ 
            width: `${blackPercentage}%`,
            background: 'linear-gradient(to left, #1f2937, #000000)'
          }}
        />
        
        {/* Center line */}
        <div className="absolute top-0 left-1/2 transform -translate-x-px h-full w-1 bg-gradient-to-b from-yellow-400 to-orange-500 z-20 shadow-lg" />
        
        {/* Evaluation text overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
            <span className="text-base font-bold text-white">
              {getEvaluationText()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-3 px-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-900 to-black"></div>
          <span className="text-sm font-medium text-gray-300">Black</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">White</span>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-white to-gray-100"></div>
        </div>
      </div>

      {/* Status Description */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg border bg-white/5 border-white/10">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-300">
            {getEvaluationDescription()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationBar;
