// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Zap, ChevronRight, AlertCircle, Loader2, Lightbulb, Clock, Calendar, HeartHandshake } from 'lucide-react';

const LEVEL_STYLES = {
  low:      { color:'#10b981', bg:'bg-emerald-500/10 border-emerald-500/30', text:'text-emerald-400', label:'Low Stress — You\'re doing well!' },
  moderate: { color:'#f59e0b', bg:'bg-amber-500/10 border-amber-500/30',   text:'text-amber-400',   label:'Moderate Stress — Take action now' },
  high:     { color:'#ef4444', bg:'bg-red-500/10 border-red-500/30',        text:'text-red-400',     label:'High Stress — Please seek support' },
};
const CAT_ICONS = { immediate: Zap, short_term: Clock, long_term: Calendar, professional: HeartHandshake };
const CAT_COLORS = {
  immediate:'bg-red-500/10 border-red-500/30 text-red-400',
  short_term:'bg-amber-500/10 border-amber-500/30 text-amber-400',
  long_term:'bg-blue-500/10 border-blue-500/30 text-blue-400',
  professional:'bg-purple-500/10 border-purple-500/30 text-purple-400',
};

export default function ResultsPage() {
  const navigate              = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const quizId     = localStorage.getItem('quiz_session_id');
  const scenarioId = localStorage.getItem('scenario_session_id');

  useEffect(() => {
    if (quizId && scenarioId && !result) fetchResult();
  }, []);

  const fetchResult = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/assessment/final', {
        quiz_session_id:     parseInt(quizId),
        scenario_session_id: parseInt(scenarioId),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compute final assessment');
    } finally {
      setLoading(false);
    }
  };

  if (!quizId || !scenarioId) return (
    <div className="max-w-xl mx-auto card text-center py-12 space-y-4">
      <AlertCircle size={48} className="mx-auto text-amber-400"/>
      <h2 className="font-display text-xl font-bold text-white">Complete Both Phases First</h2>
      <p className="text-slate-400 text-sm">You need to complete the Quiz (Phase 1) and Scenario Analysis (Phase 2) before viewing results.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/quiz')} className="btn-primary text-sm py-2 px-4">Phase 1: Quiz</button>
        <button onClick={() => navigate('/scenario')} className="btn-outline text-sm py-2 px-4">Phase 2: Scenario</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
      <p className="text-slate-400 font-medium animate-pulse">Computing AI fusion score & recommendations...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto card text-center py-10 space-y-4">
      <AlertCircle size={40} className="mx-auto text-red-400"/>
      <p className="text-red-300">{error}</p>
      <button onClick={fetchResult} className="btn-primary">Retry</button>
    </div>
  );

  if (!result) return (
    <div className="max-w-xl mx-auto card text-center py-12 space-y-4">
      <Zap size={48} className="mx-auto text-indigo-400"/>
      <h2 className="font-display text-xl font-bold text-white">Ready for Final Assessment</h2>
      <p className="text-slate-400 text-sm">Both phases are complete. Generate your final AI-fused stress score now.</p>
      <button onClick={fetchResult} disabled={loading} className="btn-primary flex items-center gap-2 mx-auto">
        {loading ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
        Generate Final Results
      </button>
    </div>
  );

  const level  = result.stress_level;
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.moderate;
  const score  = result.scores?.final_score ?? 0;
  const gaugeData = [{ value: score, fill: styles.color }];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Zap size={22} className="text-indigo-400"/>
            <h1 className="font-display text-xl font-bold text-white">Final Assessment Results</h1>
          </div>
          <p className="text-slate-400 text-sm">AI-Fused Score from Phase 1 + Phase 2</p>
        </div>
        <button onClick={() => { localStorage.removeItem('quiz_session_id'); localStorage.removeItem('scenario_session_id'); navigate('/quiz'); }}
          className="btn-outline text-sm py-2 px-4">
          New Assessment
        </button>
      </div>

      {/* Score card */}
      <div className={`card border ${styles.bg} flex flex-col items-center py-8`}>
        {/* Gauge */}
        <div className="w-48 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%"
              data={gaugeData} startAngle={180} endAngle={0}>
              <PolarAngleAxis type="number" domain={[0,100]} tick={false} />
              <RadialBar dataKey="value" background={{fill:'#1e293b'}} cornerRadius={8}/>
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
            <p className="font-display text-4xl font-black" style={{color: styles.color}}>{score.toFixed(1)}</p>
            <p className="text-slate-500 text-xs">/ 100</p>
          </div>
        </div>

        <div className={`mt-4 px-6 py-2 rounded-full text-sm font-bold border ${styles.bg} ${styles.text}`}>
          {styles.label}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6 w-full max-w-md">
          {[
            { label:'Quiz Score',     value: result.scores?.quiz_score?.toFixed(1),     sub:'Phase 1 (40%)' },
            { label:'Behavior Score', value: result.scores?.scenario_score?.toFixed(1), sub:'Phase 2 (60%)' },
            { label:'Confidence',     value: result.confidence ? `${(result.confidence*100).toFixed(0)}%` : '—', sub: result.model_used?.replace('_',' ') },
          ].map(({ label, value, sub }) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-bold text-white">{value ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
              <p className="text-xs text-slate-600 capitalize">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-indigo-400"/>
          <h2 className="font-semibold text-white">Personalized Recommendations</h2>
          {result.recommendations?.some(r => r.is_ai_generated) && (
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">AI-Generated</span>
          )}
        </div>
        <div className="space-y-3">
          {result.recommendations?.map((rec, i) => {
            const Icon = CAT_ICONS[rec.category] || Lightbulb;
            return (
              <div key={i} className="card hover:border-slate-600 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl border ${CAT_COLORS[rec.category] || 'bg-slate-700 border-slate-600 text-slate-400'} shrink-0`}>
                    <Icon size={16}/>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white text-sm">{rec.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CAT_COLORS[rec.category] || ''}`}>
                        {rec.category?.replace('_',' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{rec.description}</p>
                    {rec.resource_link && (
                      <a href={rec.resource_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                        Learn more <ChevronRight size={12}/>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={() => navigate('/chatbot')} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Chat with MindEase <ChevronRight size={16}/>
        </button>
        <button onClick={() => navigate('/history')} className="btn-outline flex-1">
          View History
        </button>
      </div>
    </div>
  );
}
