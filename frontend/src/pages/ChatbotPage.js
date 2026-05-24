// src/pages/ChatbotPage.js
import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Bot, Send, Loader2, User, Brain } from 'lucide-react';

const QUICK_PROMPTS = [
  "I'm feeling overwhelmed with exams",
  "How can I manage my study stress?",
  "I can't sleep because of anxiety",
  "I feel like giving up on my studies",
  "Tips for better concentration",
];

export default function ChatbotPage() {
  const [sessionId, setSession]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [initializing, setInit]   = useState(true);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    api.post('/chatbot/start')
      .then(r => {
        setSession(r.data.session_id);
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm **MindEase**, your personal mental wellness companion 🌟\n\nI'm here to support you through academic stress, anxiety, and emotional challenges. Everything you share with me is private and judgment-free.\n\nHow are you feeling today?",
          sent_at: new Date().toISOString()
        }]);
      })
      .catch(() => toast.error('Failed to start chat session'))
      .finally(() => setInit(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || !sessionId) return;
    setInput('');

    // Add user message immediately
    setMessages(m => [...m, { role:'user', content:msg, sent_at: new Date().toISOString() }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', { session_id: sessionId, message: msg });
      setMessages(m => [...m, { role:'assistant', content: data.ai_response, sent_at: new Date().toISOString() }]);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Render markdown-lite (bold only)
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold text-white">{p.slice(2,-2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  if (initializing) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-9rem)] flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="card py-4 flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Bot size={20} className="text-white"/>
        </div>
        <div>
          <p className="font-semibold text-white">MindEase</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse-slow"/>
            AI Mental Wellness Assistant
          </p>
        </div>
        <div className="ml-auto text-xs text-slate-500 text-right">
          <p>Powered by Claude AI</p>
          <p className="text-slate-600">Private & Confidential</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user'
                ? 'bg-indigo-600'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {msg.role === 'user' ? <User size={14} className="text-white"/> : <Brain size={14} className="text-white"/>}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm'
            }`}>
              {renderContent(msg.content)}
              <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-600'}`}>
                {new Date(msg.sent_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Brain size={14} className="text-white"/>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
              {[0,1,2].map(d => (
                <div key={d} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay:`${d*0.15}s`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="text-xs bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl transition-all">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="card py-3 px-4 flex items-end gap-3 shrink-0">
        <textarea
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 resize-none max-h-32"
          placeholder="Type your message... (Shift+Enter for new line)"
          value={input}
          rows={1}
          onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
          onKeyDown={handleKey}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-all shrink-0 active:scale-90">
          {loading ? <Loader2 size={16} className="text-white animate-spin"/> : <Send size={16} className="text-white"/>}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-600 shrink-0 -mt-2">
        MindEase is an AI assistant, not a licensed therapist. For crises, call iCall: <strong className="text-slate-500">9152987821</strong>
      </p>
    </div>
  );
}
