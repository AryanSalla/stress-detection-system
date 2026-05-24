// src/pages/HistoryPage.js
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine
} from 'recharts';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const LEVEL_COLOR = { low:'#10b981', moderate:'#f59e0b', high:'#ef4444' };
const LEVEL_BG    = {
  low:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  high:     'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function HistoryPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history/?limit=20')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const trend       = data?.trend || [];
  const assessments = data?.assessments || [];
  const summary     = data?.summary || {};

  // Trend direction
  let trendDir = 'neutral';
  if (trend.length >= 2) {
    const diff = trend[trend.length-1].final_score - trend[0].final_score;
    trendDir = diff > 3 ? 'up' : diff < -3 ? 'down' : 'neutral';
  }
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendColor = trendDir === 'up' ? 'text-red-400' : trendDir === 'down' ? 'text-emerald-400' : 'text-slate-400';
  const trendMsg   = trendDir === 'up' ? 'Stress increasing — take action' :
                     trendDir === 'down' ? 'Stress improving — keep it up!' : 'Stress level stable';

  // Level distribution for bar chart
  const distribution = ['low','moderate','high'].map(level => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    count: assessments.filter(a => a.stress_level === level).length,
    fill: LEVEL_COLOR[level]
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History size={22} className="text-indigo-400"/>
        <div>
          <h1 className="font-display text-xl font-bold text-white">History & Trends</h1>
          <p className="text-slate-400 text-sm">Track your stress patterns over time</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Assessments', value: summary.total_assessments ?? 0, color:'text-indigo-400' },
          { label:'Average Score',     value: summary.average_score ? `${summary.average_score.toFixed(1)}/100` : '—', color:'text-violet-400' },
          { label:'Most Common Level', value: summary.most_common_level ? summary.most_common_level.charAt(0).toUpperCase()+summary.most_common_level.slice(1) : '—', color: summary.most_common_level ? LEVEL_COLOR[summary.most_common_level] : '#64748b' },
          { label:'Trend Direction',   value: trendMsg, isLong: true, color: trendColor },
        ].map(({ label, value, color, isLong }) => (
          <div key={label} className="card">
            <p className="text-xs text-slate-500 font-medium mb-2">{label}</p>
            <div className="flex items-center gap-2">
              {label === 'Trend Direction' && <TrendIcon size={16} className={trendColor}/>}
              <p className={`font-display font-bold ${isLong ? 'text-sm' : 'text-2xl'}`} style={{color}}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {assessments.length === 0 ? (
        <div className="card text-center py-16">
          <History size={48} className="mx-auto mb-4 text-slate-600"/>
          <p className="text-slate-400 font-medium">No assessments yet</p>
          <p className="text-slate-500 text-sm mt-1">Complete your first assessment to see history here</p>
        </div>
      ) : (
        <>
          {/* Line chart */}
          <div className="card">
            <h3 className="font-semibold text-white mb-1">Stress Score Over Time</h3>
            <p className="text-xs text-slate-500 mb-5">Quiz score vs Scenario score vs Final score</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="date" tick={{fill:'#64748b', fontSize:11}} tickLine={false} axisLine={false}/>
                <YAxis domain={[0,100]} tick={{fill:'#64748b', fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', color:'#f1f5f9'}}/>
                <Legend wrapperStyle={{fontSize:'12px', paddingTop:'12px'}}/>
                <ReferenceLine y={40} stroke="#10b981" strokeDasharray="4 4"/>
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4"/>
                <Line type="monotone" dataKey="quiz_score"     stroke="#a78bfa" strokeWidth={2} dot={false} name="Quiz"/>
                <Line type="monotone" dataKey="scenario_score" stroke="#60a5fa" strokeWidth={2} dot={false} name="Scenario"/>
                <Line type="monotone" dataKey="final_score"    stroke="#6366f1" strokeWidth={3}
                  dot={{fill:'#6366f1', r:5, strokeWidth:2, stroke:'#0f172a'}} name="Final"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart — level distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Stress Level Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="name" tick={{fill:'#94a3b8', fontSize:12}} tickLine={false} axisLine={false}/>
                  <YAxis allowDecimals={false} tick={{fill:'#64748b', fontSize:11}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', color:'#f1f5f9'}}/>
                  <Bar dataKey="count" name="Assessments" radius={[6,6,0,0]}>
                    {distribution.map((d, i) => (
                      <rect key={i} fill={d.fill}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Assessment list */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">All Assessments</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {assessments.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="text-sm text-slate-300">{new Date(a.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
                      <p className="text-xs text-slate-500">Score: {parseFloat(a.final_score).toFixed(1)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${LEVEL_BG[a.stress_level]}`}>
                      {a.stress_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
