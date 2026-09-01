import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../services/auth';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    mobile: '',
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await loginUser(loginData.email, loginData.password);
      onSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await registerUser(signupData);
      onSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Signup failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0d12] border border-amber-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Sign In to CodeSoch' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            {mode === 'login'
              ? 'Access your Socratic quizzes & gamified stats'
              : 'Join 10,000+ developers mastering algorithms'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-[#14151c] p-1 rounded-xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-5 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form (Email & Password Only) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="developer@codesoch.dev"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 mt-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up Form (Name, Username, Email, Password, Mobile) */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">First Name</label>
                <input
                  type="text"
                  required
                  value={signupData.firstName}
                  onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                  placeholder="Vikas"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-400">Last Name</label>
                <input
                  type="text"
                  required
                  value={signupData.lastName}
                  onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                  placeholder="Kori"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  placeholder="vikaskori"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="developer@codesoch.dev"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-zinc-400">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={signupData.mobile}
                  onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 mt-3"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
