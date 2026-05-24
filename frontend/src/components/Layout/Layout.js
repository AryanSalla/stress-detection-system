// src/components/Layout/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  Brain, LayoutDashboard, ClipboardList, MessageSquare,
  History, Bot, LogOut, Bell, Menu, X, ChevronRight, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { to:'/dashboard', icon: LayoutDashboard,  label:'Dashboard' },
  { to:'/quiz',      icon: ClipboardList,     label:'Quiz Assessment' },
  { to:'/scenario',  icon: MessageSquare,     label:'Scenario Analysis' },
  { to:'/results',   icon: Zap,               label:'My Results' },
  { to:'/history',   icon: History,           label:'History & Trends' },
  { to:'/chatbot',   icon: Bot,               label:'MindEase Chat' },
];

export default function Layout() {
  const { user, logout }            = useAuth();
  const navigate                    = useNavigate();
  const [sidebarOpen, setSidebar]   = useState(true);
  const [unread, setUnread]         = useState(0);

  useEffect(() => {
    api.get('/alerts/?unread=true')
      .then(r => setUnread(r.data.unread_count || 0))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`
        flex flex-col bg-slate-800/80 border-r border-slate-700/60
        backdrop-blur-xl transition-all duration-300 shrink-0
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Brain size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-white text-sm leading-tight">MindGuard</p>
              <p className="text-slate-500 text-xs">Stress Detection AI</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}
            `}>
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700/60">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.full_name?.[0] || user?.username?.[0] || 'S'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-xs text-slate-500 truncate">{user?.course || 'Student'}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-slate-800/50 border-b border-slate-700/60 px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-xl">
          <button onClick={() => setSidebar(o => !o)} className="text-slate-400 hover:text-white transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="relative text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              Start Assessment <ChevronRight size={14} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}