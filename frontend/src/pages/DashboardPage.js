// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Brain, TrendingUp, ClipboardList, Zap,
  AlertTriangle, ChevronRight, Activity, BookOpen
} from 'lucide-react';

const LEVEL_COLOR = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444' };
const LEVEL_BG    = {
  low:      'bg-emerald-500/10 border-emerald-500/30',
  moderate: 'bg-amber-500/10 border-amber-500/30',
  high:     'bg-red-500/10 border-red-500/30'
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState(null);
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Fetch data only after user is available (token is in localStorage)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    Promise.all([
      api.get('/history/?limit=7'),
      api.get('/alerts/?unread=true'),
    ])
      .then(([h, a]) => {
        setHistory(h.data);
        setAlerts(a.data.alerts || []);
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [user]); // re-runs when user becomes available after login

  // Wait for auth context to resolve
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Wait for dashboard data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-red-300 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary text-sm py-2 px-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const latest  = history?.assessments?.[0];
  const trend   = history?.trend || [];
  const summary = history?.summary || {};

  const greeting =
    new Date().getHours() < 12 ? 'morning' :
    new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Good {greeting},{' '}
            <span className="text-indigo-400">
              {user?.full_name?.split(' ')[0] || user?.username}
            </span>{' '}
            👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your mental wellness overview</p>
        </div>
        <button
          onClick={() => navigate('/quiz')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          New Assessment <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300 text-sm">{alerts[0].message}</p>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon:  Activity,
            label: 'Current Stress Level',
            value: latest ? latest.stress_level.toUpperCase() : '—',
            sub:   latest ? `Score: ${latest.final_score.toFixed(1)}/100` : 'No assessments yet',
            color: latest ? LEVEL_COLOR[latest.stress_level] : '#64748b',
            bg:    latest ? LEVEL_BG[latest.stress_level]    : 'bg-slate-700/30 border-slate-600/30',
          },
          {
            icon:  TrendingUp,
            label: 'Average Score',
            value: summary.average_score ? `${summary.average_score.toFixed(1)}` : '—',
            sub:   'Across all assessments',
            color: '#6366f1',
            bg:    'bg-indigo-500/10 border-indigo-500/30',
          },
          {
            icon:  ClipboardList,
            label: 'Total Assessments',
            value: summary.total_assessments ?? '0',
            sub:   'Completed so far',
            color: '#a78bfa',
            bg:    'bg-violet-500/10 border-violet-500/30',
          },
          {
            icon:  BookOpen,
            label: 'Common Pattern',
            value: summary.most_common_level
              ? summary.most_common_level.charAt(0).toUpperCase() + summary.most_common_level.slice(1)
              : '—',
            sub:   'Most frequent stress level',
            color: '#34d399',
            bg:    'bg-emerald-500/10 border-emerald-500/30',
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className={`card border ${bg} flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400 font-medium">{label}</p>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Trend chart ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white">Stress Score Trend</h3>
            <p className="text-sm text-slate-400 mt-0.5">Last {trend.length} assessments</p>
          </div>
          <Brain size={20} className="text-indigo-400" />
        </div>

        {trend.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                }}
                formatter={(v, n) => [
                  `${v.toFixed(1)}`,
                  n === 'final_score' ? 'Final Score' : n,
                ]}
              />
              <ReferenceLine
                y={40} stroke="#10b981" strokeDasharray="4 4"
                label={{ value: 'Low', fill: '#10b981', fontSize: 10 }}
              />
              <ReferenceLine
                y={70} stroke="#f59e0b" strokeDasharray="4 4"
                label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="final_score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 7, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Zap size={32} className="text-indigo-500/40" />
            <p className="text-sm">Complete at least 2 assessments to see your trend</p>
            <button
              onClick={() => navigate('/quiz')}
              className="btn-primary text-sm py-2 px-4"
            >
              Take First Assessment
            </button>
          </div>
        )}
      </div>

      {/* ── Recent assessments ── */}
      {history?.assessments?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Assessments</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {history.assessments.slice(0, 5).map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: LEVEL_COLOR[a.stress_level] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {new Date(a.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Score: {a.final_score.toFixed(1)}/100
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full capitalize border ${LEVEL_BG[a.stress_level]}`}
                  style={{ color: LEVEL_COLOR[a.stress_level] }}
                >
                  {a.stress_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}