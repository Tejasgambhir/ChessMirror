import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Brain, Swords, Shield, TrendingUp, Target, AlertTriangle, Info,
  User, Eye, Star, Trophy, Activity, BarChart3, Zap, Flag, GraduationCap,
} from 'lucide-react';
import Chessboard from './chessboard.jsx'; // Assuming you have a Chessboard component

// --- Reusable UI Components (No Changes) ---
const StatCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex items-center">
    <div className="p-3 bg-slate-700 rounded-md mr-4">{icon}</div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

const InsightCard = ({ title, icon, children, severity }) => {
  const severityClasses = {
    critical: 'border-l-4 border-rose-500 bg-rose-500/10',
    strength: 'border-l-4 border-teal-500 bg-teal-500/10',
    pattern: 'border-l-4 border-amber-400 bg-amber-500/10',
    recommendation: 'border-l-4 border-sky-400 bg-sky-500/10',
    info: 'border-l-4 border-slate-500 bg-slate-500/10',
  };
  return (
    <div className={`bg-slate-800 p-4 rounded-lg shadow-md ${severityClasses[severity] || 'border-l-4 border-slate-600'}`}>
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-slate-200 ml-3">{title}</h3>
      </div>
      <div className="text-slate-300 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-slate-700 border border-slate-600 rounded-md text-sm">
        <p className="label text-slate-200 font-bold">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Dashboard Component ---
const ChessPlayerDashboard = () => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [username, setUsername] = useState('');
  const [analyzedUsername, setAnalyzedUsername] = useState('');

  const fetchPlayerData = async (inputUsername) => {
    if (!inputUsername.trim()) {
      setError('Please enter a valid username');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:8000/api/insights/${inputUsername.trim()}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Player not found. Please check the username.');
        if (response.status === 500) throw new Error('Server error. The analysis could not be completed.');
        throw new Error(`An unexpected error occurred (HTTP ${response.status})`);
      }
      const data = await response.json();
      setPlayerData(data);
      setAnalyzedUsername(inputUsername.trim());
    } catch (err) {
      setError(err.message);
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  };

  const outcomesData = useMemo(() => {
    if (!playerData?.game_results) return [];
    const { wins_by, losses_by, draws_by } = playerData.game_results;
    return [
      { result: 'Wins', count: Object.values(wins_by).reduce((a, b) => a + b, 0), color: '#10b981' },
      { result: 'Losses', count: Object.values(losses_by).reduce((a, b) => a + b, 0), color: '#ef4444' },
      { result: 'Draws', count: Object.values(draws_by).reduce((a, b) => a + b, 0), color: '#6b7280' },
    ];
  }, [playerData]);
  
  const gameShapesData = useMemo(() => {
    if (!playerData?.game_shapes) return [];
    return Object.entries(playerData.game_shapes).map(([key, value]) => ({
        name: key.replace('_pct', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value,
    }));
  }, [playerData]);

  const gamePhasesData = useMemo(() => {
     if (!playerData?.game_phases) return [];
     return Object.entries(playerData.game_phases).map(([phase, data]) => ({
         name: phase.charAt(0).toUpperCase() + phase.slice(1),
         acpl: data.acpl,
         blunder_rate: data.blunder_rate * 100,
     }));
  }, [playerData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlayerData(username);
  };

  const handleNewAnalysis = () => {
    setPlayerData(null);
    setAnalyzedUsername('');
    setUsername('');
    setError(null);
    setActiveTab('overview');
  };
  
  // --- Render Logic ---

  if (!playerData && !loading && !error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="text-center p-8 bg-slate-800 rounded-lg shadow-2xl max-w-md w-full">
          <Brain className="mx-auto h-16 w-16 text-amber-400" />
          <h1 className="text-3xl font-bold mt-4 text-slate-100">Chess Psychology Insights</h1>
          <p className="mt-2 text-slate-400">Analyze recent games to understand a player's mind, style, and decision-making under pressure.</p>
          <form onSubmit={handleSubmit} className="mt-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Chess.com Username"
              className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
            <button type="submit" className="w-full mt-4 bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded hover:bg-amber-500 transition-colors">
              Analyze Player
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="text-center p-8 bg-slate-800 rounded-lg shadow-2xl max-w-md w-full">
          {loading ? (
            <>
              <Brain className="mx-auto h-16 w-16 text-amber-400 animate-pulse" />
              <h1 className="text-2xl font-bold mt-4 text-slate-100">Analyzing...</h1>
              <p className="mt-2 text-slate-400">Please wait while we process the games.</p>
            </>
          ) : (
            <>
              <AlertTriangle className="mx-auto h-16 w-16 text-rose-500" />
              <h1 className="text-2xl font-bold mt-4 text-rose-400">Analysis Failed</h1>
              <p className="mt-2 text-slate-400">{error}</p>
              <button onClick={handleNewAnalysis} className="w-full mt-6 bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded hover:bg-amber-500 transition-colors">
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Analysis for <span className="text-amber-400">{analyzedUsername}</span></h1>
          <p className="text-slate-400">Psychological & Performance Profile (Last {playerData.game_results.total_games} Games)</p>
        </div>
        <button onClick={handleNewAnalysis} className="mt-4 sm:mt-0 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded transition-colors">
          New Analysis
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col space-y-2 sticky top-6">
            {['overview', 'openings', 'performance', 'psychology', 'learn counter'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-left rounded-md font-semibold capitalize transition-colors text-base flex items-center ${
                  activeTab === tab ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {tab === 'overview' && <BarChart3 className="mr-3 h-5 w-5" />}
                {tab === 'openings' && <Flag className="mr-3 h-5 w-5" />}
                {tab === 'performance' && <TrendingUp className="mr-3 h-5 w-5" />}
                {tab === 'psychology' && <Brain className="mr-3 h-5 w-5" />}
                {tab === 'learn counter' && <GraduationCap className="mr-3 h-5 w-5" />}
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <main className="lg:col-span-3">
          {activeTab === 'overview' && (
             <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={<Trophy className="h-6 w-6 text-amber-400" />} title="Win Rate" value={`${(playerData.game_results.win_rate * 100).toFixed(1)}%`} />
                <StatCard icon={<Activity className="h-6 w-6 text-sky-400" />} title="Middlegame ACPL" value={playerData.game_phases.middlegame.acpl.toFixed(1)} subtitle="Accuracy Indicator" />
                <StatCard icon={<Zap className="h-6 w-6 text-rose-400" />} title="Middlegame Blunders" value={`${(playerData.game_phases.middlegame.blunder_rate * 100).toFixed(1)}%`} subtitle="Per 100 moves" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-slate-800 p-4 rounded-lg md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 text-slate-200">Game Outcomes</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={outcomesData} dataKey="count" nameKey="result" cx="50%" cy="50%" outerRadius={80} label>
                        {outcomesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                 <div className="bg-slate-800 p-4 rounded-lg md:col-span-3">
                   <h3 className="text-lg font-semibold mb-4 text-slate-200">Game Shapes</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={gameShapesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Frequency" fill="#38bdf8" />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'openings' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-slate-200">Most Played as White</h3>
                  <div className="space-y-3">
                  {playerData.opening_repertoire.white.map((op, i) => (
                    <div key={i} className="bg-slate-800 p-3 rounded-md">
                      <p className="font-semibold text-slate-100">{op.name} <span className="text-xs text-slate-400">({op.eco})</span></p>
                      <p className="text-sm text-slate-400">{op.games} games, <span className={op.win_rate > 0.5 ? 'text-green-400' : 'text-red-400'}>{(op.win_rate * 100).toFixed(0)}% win rate</span></p>
                    </div>
                  ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4 text-slate-200">Most Played as Black</h3>
                  <div className="space-y-3">
                  {playerData.opening_repertoire.black.map((op, i) => (
                      <div key={i} className="bg-slate-800 p-3 rounded-md">
                        <p className="font-semibold text-slate-100">{op.name} <span className="text-xs text-slate-400">({op.eco})</span></p>
                        <p className="text-sm text-slate-400">{op.games} games, <span className={op.win_rate > 0.5 ? 'text-green-400' : 'text-red-400'}>{(op.win_rate * 100).toFixed(0)}% win rate</span></p>
                      </div>
                  ))}
                  </div>
                </div>
              </div>
          )}
          
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Performance by Game Phase</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gamePhasesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis yAxisId="left" orientation="left" stroke="#38bdf8" label={{ value: 'ACPL', angle: -90, position: 'insideLeft', fill: '#38bdf8' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Blunder Rate %', angle: 90, position: 'insideRight', fill: '#ef4444' }}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="acpl" name="Avg. Centipawn Loss" fill="#38bdf8" />
                    <Bar yAxisId="right" dataKey="blunder_rate" name="Blunder Rate (%)" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Performance vs Opponent Rating</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={playerData.performance_vs_rating}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="bracket" stroke="#94a3b8" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="acpl" name="ACPL" stroke="#38bdf8" />
                    <Line type="monotone" dataKey="win_rate" name="Win Rate" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* === START: IMPROVED PSYCHOLOGY TAB === */}
          {activeTab === 'psychology' && (() => {
            const profile = playerData.psychological_profile_and_recommendations;
            const recommend = profile.recommendation_how_to_play_against;
            return (
              <div className="space-y-8">
                {/* Section 1: Psychological Summary */}
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-100">Psychological Profile</h3>
                  <InsightCard title="Overall Summary" icon={<Info className="h-5 w-5 text-sky-400" />} severity="info">
                    <p>{profile.comment}</p>
                  </InsightCard>
                </div>
          
                {/* Section 2: Core Weaknesses */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-200">Core Weaknesses</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<Activity className="h-6 w-6 text-rose-400" />} title="Middlegame ACPL" value={playerData.game_phases.middlegame.acpl.toFixed(0)} subtitle="Severe Inaccuracy" />
                    <StatCard icon={<AlertTriangle className="h-6 w-6 text-rose-400" />} title="Middlegame Blunders" value={`${(playerData.game_phases.middlegame.blunder_rate * 100).toFixed(1)}%`} subtitle="High Error Rate" />
                    <StatCard icon={<Activity className="h-6 w-6 text-amber-400" />} title="Endgame ACPL" value={playerData.game_phases.endgame.acpl.toFixed(0)} subtitle="Significant Inaccuracy" />
                    <StatCard icon={<AlertTriangle className="h-6 w-6 text-amber-400" />} title="Endgame Blunders" value={`${(playerData.game_phases.endgame.blunder_rate * 100).toFixed(1)}%`} subtitle="Prone to Errors" />
                  </div>
                </div>
          
                {/* Section 3: Behavioral Analysis */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-200">Behavioral Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InsightCard title="Psychological Tendencies" icon={<Swords className="h-5 w-5 text-amber-400" />} severity="pattern">
                      <ul className="list-disc list-inside space-y-1">
                        {profile.opponent_psychological_tendencies}
                      </ul>
                    </InsightCard>
                    <InsightCard title="Confidence vs. Calculation" icon={<Eye className="h-5 w-5 text-amber-400" />} severity="pattern">
                      <p>{profile.pattern_recognition_fear_and_overconfidence}</p>
                    </InsightCard>
                     <InsightCard title="Pressure Response" icon={<AlertTriangle className="h-5 w-5 text-rose-500" />} severity="critical">
                      <p>{profile.blunder_patterns_under_pressure}</p>
                    </InsightCard>
                    <InsightCard title="Opening Personality" icon={<Brain className="h-5 w-5 text-amber-400" />} severity="pattern">
                      <p>{profile.specific_move_based_psychological_profiling}</p>
                    </InsightCard>
                  </div>
                </div>
                
                {/* Section 4: Actionable Recommendations */}
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-100">Actionable Recommendations</h3>
                  <div className="space-y-4">
                    <InsightCard title="Overall Strategy" icon={<Shield className="h-5 w-5 text-sky-400" />} severity="recommendation">
                       <p>{recommend.overall_strategy}</p>
                    </InsightCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <InsightCard title="Playing as White" icon={<Star className="h-5 w-5 text-slate-100" />} severity="recommendation">
                          <p>{recommend.as_white}</p>
                       </InsightCard>
                       <InsightCard title="Playing as Black" icon={<Star className="h-5 w-5 text-slate-800" />} severity="recommendation">
                           <p>{recommend.as_black}</p>
                       </InsightCard>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* === END: IMPROVED PSYCHOLOGY TAB === */}

          {activeTab === 'learn counter' && (
            <Chessboard playerOpenings={playerData.opening_repertoire} />
          )}

        </main>
      </div>
    </div>
  );
};

export default ChessPlayerDashboard;

