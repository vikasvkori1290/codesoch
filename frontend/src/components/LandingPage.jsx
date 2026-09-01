import React from 'react';
import { User, Brain, Sparkles } from 'lucide-react';
import heroBrainImg from '../assets/hero_brain.jpg';

export default function LandingPage({ onOpenQuiz, onOpenProfile }) {
  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-amber-500 selection:text-black relative overflow-hidden font-sans">
      {/* Background Subtle Gold Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#17140b_1px,transparent_1px),linear-gradient(to_bottom,#17140b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between relative z-20">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Code<span className="text-amber-400">Soch</span>
          </span>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 hover:text-amber-400 bg-[#0c0d12] border border-zinc-800 hover:border-amber-500/30 px-4 py-3 rounded-lg transition-all"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Profile</span>
          </button>
          <button
            onClick={onOpenQuiz}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black tracking-wider uppercase px-6 py-3.5 rounded-none font-mono shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>START QUIZ</span>
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Hero Left Column */}
        <div className="lg:col-span-6 space-y-8">
          {/* Socratic Tag Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Socratic AI Learning</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
            Don't Memorize <br />
            Solutions. <br />
            Learn How to{' '}
            <span className="text-amber-400 border-b-4 border-amber-400 inline-block">
              Think.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base text-zinc-400 leading-relaxed font-normal max-w-xl">
            CodeSoch uses the Socratic method to guide you through coding challenges. Instead of handing you the answer, we ask the right questions to help you discover it yourself.
          </p>

          {/* Social Proof Footer */}
          <div className="pt-6 flex items-center gap-4 border-t border-zinc-900">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#060608] flex items-center justify-center text-xs font-bold text-amber-400">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#060608] flex items-center justify-center text-xs font-bold text-amber-300">
                <User className="w-4 h-4 text-amber-300" />
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-600 border-2 border-[#060608] flex items-center justify-center text-xs font-bold text-amber-200">
                <User className="w-4 h-4 text-amber-200" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Join <span className="text-zinc-300 font-semibold">10,000+</span> developers mastering algorithms
            </p>
          </div>
        </div>

        {/* Hero Right Column (Showcase Card) */}
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#0c0d12] shadow-[0_0_50px_rgba(245,158,11,0.15)] group">
            {/* Image Preview */}
            <img
              src={heroBrainImg}
              alt="AI Neural Cognition Unit"
              className="w-full h-auto object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-[#060608] via-[#060608]/40 to-transparent p-8 flex flex-col justify-end">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Cognitive Code Mastery. <br />
                  Empowering Advanced AI Development.
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal max-w-md">
                  CodeSoch integrates neural networks and algorithmic intelligence to accelerate your coding workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
