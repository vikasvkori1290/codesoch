import React, { useState, useEffect } from 'react';
import { User, Brain, Sparkles, UserPlus, ArrowRight, LogIn, Zap } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

export default function LandingPage({ currentUser, onOpenAuthModal, onOpenQuiz, onOpenProfile }) {
  const [activeProblem, setActiveProblem] = useState(null);

  useEffect(() => {
    if (currentUser) {
      axios.get(`${API_URL}/quiz/active-problem`)
        .then((res) => {
          if (res.data?.hasActiveProblem) {
            setActiveProblem(res.data);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-amber-500 selection:text-black relative font-sans overflow-x-hidden">
      {/* Background Image: public/bg.png (Scrolls with page) */}
      <div className="absolute inset-0 z-0 min-h-screen">
        <img
          src="/bg.png"
          alt="CodeSoch Background"
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#060608]/60 via-transparent to-[#060608]/80" />
      </div>

      {/* Subtle Aesthetic Dynamic Island Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#08090e]/75 backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 rounded-full px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center gap-3 transition-all duration-300">
        {/* Logo Pill */}
        <div 
          onClick={currentUser ? onOpenQuiz : () => onOpenAuthModal('login')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-black tracking-tight text-white/90 font-sans">
            Code<span className="text-amber-400">Soch</span>
          </span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Navbar Right Actions (Start Quiz only appears when logged in) */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-300 hover:text-amber-400 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.firstName || 'Profile'}</span>
              </button>

              <button
                onClick={onOpenQuiz}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 px-4 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>Start Quiz</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-300 hover:text-amber-400 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container: Highly Transparent Glass Card */}
      <main className="relative z-10 min-h-screen pt-32 pb-20 flex items-center justify-center px-6">
        <div className="bg-[#060608]/20 backdrop-blur-md border border-white/15 hover:border-amber-500/40 rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300">
          {/* Socratic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-amber-400 text-[11px] font-mono font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Socratic Learning Engine</span>
          </div>

          {/* Active Problem Detection Notification Badge */}
          {activeProblem && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1 text-center animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
                Active LeetCode Problem Sync
              </span>
              <p className="text-xs font-bold text-white font-mono">
                Detected: <span className="text-amber-400 underline">{activeProblem.title}</span>
              </p>
            </div>
          )}

          {/* Refined Compact Text */}
          {currentUser ? (
            <h1 className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Welcome back, <span className="text-amber-400 font-extrabold">{currentUser.firstName}!</span> <br />
              {activeProblem ? (
                <span>Ready to generate a Socratic Quiz for <span className="text-amber-400 font-extrabold">{activeProblem.title}</span>?</span>
              ) : (
                <span>Ready to train your algorithmic thinking?</span>
              )}
            </h1>
          ) : (
            <h1 className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Not able to solve the problem? <br />
              <span className="text-amber-400 font-extrabold">Don't worry!</span> You just sign in, <br />
              I will make you <span className="underline decoration-amber-400 decoration-2 underline-offset-4">think.</span>
            </h1>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col items-center gap-3">
            {currentUser ? (
              <button
                onClick={onOpenQuiz}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase py-3 px-7 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.04] active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-black fill-current" />
                <span>{activeProblem ? `Quiz for ${activeProblem.title}` : 'Start Socratic Quiz'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuthModal('signup')}
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase py-3 px-7 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.04] active:scale-95 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>

                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="text-[11px] font-mono text-zinc-200 hover:text-amber-400 transition-colors drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]"
                >
                  Already have an account? <span className="text-amber-400 font-semibold underline">Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
