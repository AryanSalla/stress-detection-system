// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login }              = useAuth();
  const navigate               = useNavigate();
  const [form, setForm]        = useState({ email:'', password:'' });
  const [showPwd, setShowPwd]  = useState(false);
  const [loading, setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 30% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 70% 20%, #a855f7 0%, transparent 40%)'}} />
        <div className="relative z-10 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <Brain size={40} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            AI-Powered<br />Stress Detection
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Understand your stress patterns, get personalized recommendations, and take control of your academic well-being.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['98%','Accuracy'],['10K+','Students'],['AI','Powered']].map(([val,label]) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="font-display text-2xl font-bold text-white">{val}</p>
                <p className="text-slate-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">MindGuard</span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to your student account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input-field" placeholder="you@college.edu" required
                value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPwd?'text':'password'} className="input-field pr-12" placeholder="••••••••" required
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
                <button type="button" onClick={() => setShowPwd(o=>!o)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin"/> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one →</Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-500 font-medium mb-1">Demo Credentials</p>
            <p className="text-xs text-slate-400">Email: <span className="text-slate-300">demo@stressdetect.ai</span></p>
            <p className="text-xs text-slate-400">Password: <span className="text-slate-300">Demo@1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
