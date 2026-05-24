// src/pages/ScenarioPage.js
import 'regenerator-runtime/runtime';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MessageSquare, ChevronRight, Loader2, CheckCircle2, Brain, AlertCircle } from 'lucide-react';
import VoiceInput from '../components/VoiceInput/VoiceInput';
import EmotionRecognition from '../components/EmotionRecognition/EmotionRecognition';

const DIFFICULTY_COLOR = {
  mild:'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  moderate:'text-amber-400 bg-amber-500/10 border-amber-500/30',
  severe:'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function ScenarioPage() {
  const navigate              = useNavigate();
  const [scenarios, setScen]  = useState([]);
  const [sessionId, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [text, setText]       = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [faceEmotion, setFaceEmotion] = useState(null);
  const [showEmotion, setShowEmotion] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/scenario/list'), api.post('/scenario/start')])
      .then(([s, sess]) => {
        setScen(s.data.scenarios);
        setSession(sess.data.session_id);
      })
      .catch(() => toast.error('Failed to load scenarios'))
      .finally(() => setLoading(false));
  }, []);

  const analyzeAndNext = async () => {
    if (text.trim().length < 20) {
      toast.error('Please write at least 20 characters for a meaningful analysis.');
      return;
    }
    setAnalyzing(true);
    try {
      const { data } = await api.post('/scenario/analyze', {
        session_id:    sessionId,
        scenario_id:   scenarios[current].id,
        response_text: text,
      });
      setAnalyses(a => [...a, {
        scenario: scenarios[current].title,
        ...data.analysis,
        face_emotion: faceEmotion
      }]);

      if (current < scenarios.length - 1) {
        setCurrent(c => c + 1);
        setText('');
        setFaceEmotion(null);
      } else {
        const { data: final } = await api.post('/scenario/complete', { session_id: sessionId });
        setFinalResult(final);
        localStorage.setItem('scenario_session_id', final.session_id);
        setCompleted(true);
        toast.success('Scenario analysis complete!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const quizDone = !!localStorage.getItem('quiz_session_id');

  if (!quizDone) return (
    <div className="max-w-xl mx-auto card text-center py-12">
      <AlertCircle size={48} className="mx-auto mb-4 text-amber-400"/>
      <h2 className="font-display text-xl font-bold text-white mb-2">Complete Phase 1 First</h2>
      <p className="text-slate-400 mb-6">You need to complete the Quiz Assessment before Scenario Analysis.</p>
      <button onClick={() => navigate('/quiz')} className="btn-primary">Go to Quiz →</button>
    </div>
  );

  if (completed && finalResult) return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="card text-center py-10">
        <CheckCircle2 size={56} className="mx-auto mb-4 text-indigo-400"/>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Scenario Analysis Complete!</h2>
        <p className="text-slate-400 mb-6">Phase 2 Results</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label:'Behavior Score', value: finalResult.normalized_score?.toFixed(1), sub:'/100' },
            { label:'Avg Sentiment',  value: finalResult.avg_sentiment > 0 ? '😊 Positive' : finalResult.avg_sentiment < -0.1 ? '😟 Negative' : '😐 Neutral' },
            { label:'Primary Emotion', value: finalResult.dominant_emotion?.replace('_',' ') || '—' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-2">{label}</p>
              <p className="font-display text-xl font-bold text-indigo-400 capitalize">
                {value}<span className="text-sm text-slate-500">{sub}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="text-left space-y-3 mb-8">
          {analyses.map((a, i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-300 truncate">{a.scenario}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  a.sentiment?.label === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  a.sentiment?.label === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  'bg-slate-700 text-slate-400 border-slate-600'}`}>
                  {a.sentiment?.label}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                <span>Stress: <strong className="text-slate-300">{a.stress_score?.toFixed(0)}/100</strong></span>
                <span>Emotion: <strong className="text-slate-300 capitalize">{a.emotions?.dominant}</strong></span>
                {a.face_emotion && (
                  <span>Face: <strong className="text-indigo-300 capitalize">{a.face_emotion.dominant}</strong></span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/results')} className="btn-primary flex items-center gap-2 mx-auto">
          View Final Assessment <ChevronRight size={16}/>
        </button>
      </div>
    </div>
  );

  const sc = scenarios[current];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare size={22} className="text-indigo-400"/>
          <h1 className="font-display text-xl font-bold text-white">Phase 2: Scenario Analysis</h1>
        </div>
        <p className="text-slate-400 text-sm">Read each scenario carefully and respond honestly</p>
      </div>

      {/* Progress */}
      <div className="card py-4">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
          <span>Scenario {current + 1} of {scenarios.length}</span>
          <span>{analyses.length} analyzed</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{width:`${(analyses.length / scenarios.length) * 100}%`}}/>
        </div>
      </div>

      {/* Main Grid — Scenario left, Emotion right */}
      <div className={`grid gap-4 ${showEmotion ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

        {/* Left: Scenario Card */}
        <div className={showEmotion ? 'lg:col-span-2' : 'col-span-1'}>
          {sc && (
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/50 text-slate-400 border border-slate-700 capitalize">
                    {sc.category}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${DIFFICULTY_COLOR[sc.difficulty]}`}>
                    {sc.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle face detection */}
                  <button
                    onClick={() => setShowEmotion(e => !e)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      showEmotion
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    😊 {showEmotion ? 'Hide Camera' : 'Face Detection'}
                  </button>
                  <Brain size={18} className="text-indigo-400"/>
                </div>
              </div>

              <h3 className="font-semibold text-white text-lg">{sc.title}</h3>
              <p className="text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-sm">
                {sc.description}
              </p>

              <div>
                <label className="label">Your Response</label>
                <textarea
                  className="input-field resize-none h-40"
                  placeholder="Type or speak your response honestly..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  maxLength={2000}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-slate-500">Min 20 characters for analysis</p>
                  <p className={`text-xs ${text.length > 1800 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {text.length}/2000
                  </p>
                </div>
              </div>

              {/* Voice Input */}
              <div className="border-t border-slate-700/60 pt-4">
                <p className="text-xs font-medium text-slate-400 mb-2">🎤 Or speak your answer (Chrome/Edge only):</p>
                <VoiceInput
                  onTranscript={(t) => setText(t)}
                  disabled={analyzing}
                />
              </div>

              {/* Face emotion indicator */}
              {faceEmotion && showEmotion && (
                <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <span className="text-xl">
                    {{'happy':'😊','sad':'😢','angry':'😠','fearful':'😨','surprised':'😮','disgusted':'🤢','neutral':'😐'}[faceEmotion.dominant] || '😐'}
                  </span>
                  <p className="text-xs text-indigo-300">
                    Face detected: <strong className="capitalize">{faceEmotion.dominant}</strong> ({faceEmotion.confidence}% confidence)
                  </p>
                </div>
              )}

              <button
                onClick={analyzeAndNext}
                disabled={analyzing || text.trim().length < 20}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {analyzing
                  ? <><Loader2 size={18} className="animate-spin"/>Analyzing with NLP...</>
                  : current === scenarios.length - 1
                    ? <>Complete Analysis <CheckCircle2 size={16}/></>
                    : <>Analyze & Next <ChevronRight size={16}/></>
                }
              </button>
            </div>
          )}
        </div>

        {/* Right: Emotion Recognition Panel */}
        {showEmotion && (
          <div className="lg:col-span-1">
            <EmotionRecognition
              onEmotionDetected={(data) => setFaceEmotion(data)}
            />
          </div>
        )}
      </div>
    </div>
  );
}