// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Brain, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username:'', email:'', password:'', full_name:'',
    age:'', institution:'', course:'', year_of_study:''
  });
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
        year_of_study: form.year_of_study ? parseInt(form.year_of_study) : undefined,
      });
      toast.success('Account created! Welcome to MindGuard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type='text', placeholder, required=false }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type={type} className="input-field" placeholder={placeholder} required={required}
        value={form[name]} onChange={e => set(name, e.target.value)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain size={20} className="text-white"/>
          </div>
          <span className="font-display text-xl font-bold text-white">MindGuard</span>
        </div>

        <h2 className="font-display text-3xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-slate-400 mb-8">Start your stress management journey today</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name"          name="full_name"     placeholder="John Doe" />
            <Field label="Username"           name="username"      placeholder="john_doe" required />
            <Field label="Email"              name="email"         type="email" placeholder="you@college.edu" required />
            <Field label="Password"           name="password"      type="password" placeholder="8+ chars, 1 number" required />
            <Field label="Institution"        name="institution"   placeholder="NIT / IIT / University..." />
            <Field label="Course / Program"   name="course"        placeholder="B.Tech Computer Science" />
            <Field label="Year of Study"      name="year_of_study" type="number" placeholder="1–6" />
            <Field label="Age"                name="age"           type="number" placeholder="18" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin"/>Creating account...</> : 'Create Account'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
