// src/pages/QuizPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ClipboardList, ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';

const LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
const CATEGORY_COLORS = {
  academic:'bg-blue-500/20 text-blue-400 border-blue-500/30',
  social:'bg-purple-500/20 text-purple-400 border-purple-500/30',
  physical:'bg-green-500/20 text-green-400 border-green-500/30',
  emotional:'bg-red-500/20 text-red-400 border-red-500/30',
  financial:'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function QuizPage() {
  const navigate              = useNavigate();
  const [questions, setQs]    = useState([]);
  const [sessionId, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [responses, setResp]  = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSub]  = useState(false);
  const [result, setResult]   = useState(null);

  useEffect(() => {
    Promise.all([api.get('/quiz/questions'), api.post('/quiz/start')])
      .then(([q, s]) => {
        setQs(q.data.questions);
        setSession(s.data.session_id);
      })
      .catch(() => toast.error('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, []);

  const answer = (value) => {
    const q = questions[current];
    setResp(r => ({...r, [q.id]: value}));
    // Auto-advance after short delay
    setTimeout(() => {
      if (current < questions.length - 1) setCurrent(c => c + 1);
    }, 300);
  };

  const submit = async () => {
    const payload = Object.entries(responses).map(([question_id, response_value]) => ({
      question_id: parseInt(question_id), response_value
    }));
    setSub(true);
    try {
      const { data } = await api.post('/quiz/submit', { session_id: sessionId, responses: payload });
      setResult(data);
      localStorage.setItem('quiz_session_id', data.session_id);
      toast.success('Quiz completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSub(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (result) return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="card text-center py-10">
        <CheckCircle2 size={56} className="mx-auto mb-4 text-indigo-400"/>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 mb-6">Phase 1 Assessment Results</p>

        <div className="inline-flex flex-col items-center gap-2 bg-slate-900/50 rounded-2xl px-10 py-6 border border-slate-700 mb-6">
          <p className="text-slate-400 text-sm font-medium">Your Quiz Score</p>
          <p className="font-display text-5xl font-bold text-indigo-400">{result.normalized_score.toFixed(1)}</p>
          <p className="text-slate-500 text-sm">out of 100</p>
        </div>

        <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold border mb-8 ${
          result.stress_level === 'low'      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
          result.stress_level === 'moderate' ? 'bg-amber-500/10   text-amber-400   border-amber-500/30' :
                                               'bg-red-500/10     text-red-400     border-red-500/30'
        }`}>
          {result.stress_level.toUpperCase()} STRESS
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/scenario')} className="btn-primary flex items-center gap-2">
            Continue to Phase 2 <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    </div>
  );

  const q    = questions[current];
  const prog = ((Object.keys(responses).length) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList size={22} className="text-indigo-400"/>
          <h1 className="font-display text-xl font-bold text-white">Phase 1: Quiz Assessment</h1>
        </div>
        <p className="text-slate-400 text-sm">Rate each statement based on your recent experiences</p>
      </div>

      {/* Progress */}
      <div className="card py-4">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Object.keys(responses).length} answered</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{width:`${prog}%`}}/>
        </div>
      </div>

      {/* Question card */}
      {q && (
        <div className="card space-y-6">
          <div className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${CATEGORY_COLORS[q.category]}`}>
              {q.category}
            </span>
          </div>

          <p className="text-lg font-medium text-white leading-relaxed">{q.question_text}</p>

          <div className="grid grid-cols-5 gap-2">
            {LABELS.map((label, idx) => {
              const val = idx + 1;
              const selected = responses[q.id] === val;
              return (
                <button key={val} onClick={() => answer(val)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95
                    ${selected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200'
                    }`}>
                  <span className="font-display font-bold text-lg">{val}</span>
                  <span className="text-xs text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
              className="btn-outline flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-30">
              <ChevronLeft size={16}/> Previous
            </button>

            {current === questions.length - 1 ? (
              <button
                onClick={submit}
                disabled={Object.keys(responses).length < questions.length || submitting}
                className="btn-primary flex items-center gap-2 text-sm">
                {submitting ? <><Loader2 size={16} className="animate-spin"/>Submitting...</> : <>Submit Quiz <CheckCircle2 size={16}/></>}
              </button>
            ) : (
              <button onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                Next <ChevronRight size={16}/>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question nav dots */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
              ${i === current    ? 'bg-indigo-600 text-white scale-110' :
                responses[q.id] ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/50' :
                                   'bg-slate-800 text-slate-500 border border-slate-700'}`}>
            {i+1}
          </button>
        ))}
      </div>
    </div>
  );
}
