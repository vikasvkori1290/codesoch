import React, { useState } from 'react';
import { Brain, Search, Sparkles, Lightbulb, ChevronRight, ChevronLeft, CheckCircle2, XCircle, RefreshCw, Cpu, Trophy, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

function shuffleOptions(q) {
  const origCorrect = q.correctAnswerIndex ?? 0;
  let opts = q.options.map((opt, i) => ({
    text: typeof opt === 'string' ? opt : opt.text,
    isCorrect: i === origCorrect,
  }));

  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

  const newCorrectIndex = opts.findIndex((o) => o.isCorrect);
  return {
    ...q,
    options: opts.map((o, idx) => ({ id: idx, text: o.text })),
    correctAnswerIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

export default function QuizGenerator({ onGoHome }) {
  const [problemInput, setProblemInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  
  // State tracking 5 MCQs session
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: optionId, 1: optionId, ... }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // { 0: true, 1: true, ... }
  const [showHint, setShowHint] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPromptInspector, setShowPromptInspector] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!problemInput.trim()) return;

    setIsGenerating(true);
    setErrorMsg('');
    setGeneratedQuiz(null);
    setCurrentQIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setShowHint(false);
    setIsQuizCompleted(false);

    try {
      // Call Backend API to generate 5 Socratic MCQs
      const response = await axios.post(`${API_URL}/quiz/generate`, {
        problemInput: problemInput.trim(),
      });

      setGeneratedQuiz(response.data);
    } catch (err) {
      console.error('[QuizGenerator Error]:', err);
      const errMsg = err.response?.data?.message || err.message || 'AI Model is unable to send back the response. An error occurred.';
      setErrorMsg(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionId) => {
    if (submittedQuestions[currentQIndex]) return;
    setUserAnswers((prev) => ({ ...prev, [currentQIndex]: optionId }));
  };

  const handleSubmitCurrentAnswer = () => {
    if (userAnswers[currentQIndex] === undefined) return;
    setSubmittedQuestions((prev) => ({ ...prev, [currentQIndex]: true }));
  };

  const currentQ = generatedQuiz?.questions?.[currentQIndex];
  const isCurrentSubmitted = submittedQuestions[currentQIndex];
  const currentSelectedOption = userAnswers[currentQIndex];

  // Calculate final score summary & record to MongoDB
  const handleFinishQuiz = async () => {
    setIsQuizCompleted(true);
    if (!generatedQuiz?.questions) return;
    
    let correctCount = 0;
    generatedQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const total = generatedQuiz.questions.length;
    const scorePercent = Math.round((correctCount / total) * 100);

    try {
      const token = localStorage.getItem('thinkquiz_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await axios.post(`${API_URL}/quiz/record-submission`, {
          number: generatedQuiz.number,
          title: generatedQuiz.title,
          scorePercent,
          correctCount,
          totalQuestions: total,
          userAnswers,
        });
      }
    } catch (err) {
      console.warn('[Quiz submission record]: Backend call failed.', err);
    }
  };

  const calculateResults = () => {
    if (!generatedQuiz?.questions) return { correctCount: 0, total: 5, scorePercent: 0, xp: 0 };
    let correctCount = 0;
    generatedQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    const total = generatedQuiz.questions.length;
    const scorePercent = Math.round((correctCount / total) * 100);
    const xp = scorePercent * 4;
    return { correctCount, total, scorePercent, xp };
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans selection:bg-amber-500 selection:text-black relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#17140b_1px,transparent_1px),linear-gradient(to_bottom,#17140b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Subtle Aesthetic Dynamic Island Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#08090e]/75 backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 rounded-full px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center gap-3 transition-all duration-300">
        <div 
          onClick={onGoHome}
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

        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-amber-400 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all"
        >
          <span>← Home</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-8 pt-28 pb-16 space-y-10 relative z-10">
        {/* LeetCode Input Generator Card */}
        <div className="bg-[#0c0d12] border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-4">
            {/* Input Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/70" />
              <input
                type="text"
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                placeholder="Enter LeetCode Problem # or Slug (e.g., 1, 15, 20, 42, two-sum, 3sum)"
                className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-11 pr-4 py-4 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black font-mono uppercase py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Generating 5 MCQs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generate 5 MCQs</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Alert Card */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(244,63,94,0.1)] space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5" />
              <span>AI Generation Error</span>
            </div>
            <p className="text-xs text-rose-200 font-mono leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* AI Model & Prompt Inspector Card */}
        {generatedQuiz && (
          <div className="bg-[#0c0d12] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  AI Model Info:
                </span>
                <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-md font-bold">
                  Provider: {generatedQuiz.providerUsed || 'Google Gemini AI'}
                </span>
                <span className="text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-md font-bold">
                  Model: {generatedQuiz.modelUsed || 'gemini-flash-latest'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPromptInspector(!showPromptInspector)}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>{showPromptInspector ? 'Hide Prompt' : '🔍 View Prompt Sent to AI'}</span>
              </button>
            </div>

            {showPromptInspector && generatedQuiz.promptSent && (
              <div className="bg-[#050608] border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border-l-4 border-l-amber-500">
                {generatedQuiz.promptSent}
              </div>
            )}
          </div>
        )}

        {/* Generated 5-MCQs Session Display */}
        {generatedQuiz && !isQuizCompleted && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quiz Top Stepper Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0c0d12] border border-zinc-800 px-6 py-4 rounded-xl gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-md">
                  LeetCode #{generatedQuiz.number}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">{generatedQuiz.title}</h2>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  {generatedQuiz.difficulty}
                </span>
              </div>

              {/* 5-Questions Stepper Pills */}
              <div className="flex items-center gap-2">
                {generatedQuiz.questions.map((q, idx) => {
                  const isDone = submittedQuestions[idx];
                  const isCurrent = idx === currentQIndex;
                  const isCorrect = userAnswers[idx] === q.correctAnswerIndex;

                  let pillStyle = 'bg-zinc-800/80 border-zinc-700 text-zinc-400';
                  if (isDone) {
                    pillStyle = isCorrect
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold';
                  } else if (isCurrent) {
                    pillStyle = 'bg-amber-500 text-black font-extrabold ring-2 ring-amber-400/50';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => {
                        setCurrentQIndex(idx);
                        setShowHint(false);
                      }}
                      className={`w-8 h-8 rounded-lg border text-xs font-mono flex items-center justify-center transition-all ${pillStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Quiz Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Problem Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Problem Description
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    {generatedQuiz.description}
                  </p>
                </div>
              </div>

              {/* Right Column: Active Question & Choice Cards */}
              <div className="lg:col-span-7 space-y-6">
                {/* Socratic Question Banner */}
                <div className="bg-[#0c0d12] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
                      <Sparkles className="w-4 h-4" />
                      <span>Question {currentQIndex + 1} of 5</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      AI: {generatedQuiz.providerUsed}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white leading-relaxed">
                    {currentQ.questionText}
                  </h2>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const isSelected = currentSelectedOption === opt.id;
                    const isCorrectAnswer = opt.id === currentQ.correctAnswerIndex;
                    const optionLetters = ['A', 'B', 'C', 'D'];

                    let cardStyles = 'bg-[#0c0d12] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#101118]';
                    if (isCurrentSubmitted) {
                      if (isCorrectAnswer) {
                        cardStyles = 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                      } else if (isSelected && !isCorrectAnswer) {
                        cardStyles = 'bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
                      }
                    } else if (isSelected) {
                      cardStyles = 'bg-amber-500/10 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                          isCurrentSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${cardStyles}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isCurrentSubmitted
                              ? isCorrectAnswer
                                ? 'bg-emerald-500 text-black'
                                : isSelected
                                ? 'bg-rose-500 text-white'
                                : 'bg-zinc-800 text-zinc-400'
                              : isSelected
                              ? 'bg-amber-500 text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {optionLetters[opt.id]}
                        </div>
                        <p className="text-xs leading-relaxed font-normal pt-1 flex-1">{opt.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Socratic Hint & Navigation Controls */}
                <div className="space-y-4 pt-2">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>{showHint ? 'Hide Socratic Hint' : '💡 Reveal AI Socratic Hint'}</span>
                  </button>

                  {showHint && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs font-mono text-amber-300 leading-relaxed shadow-inner space-y-2">
                      <p>{currentQ.hint}</p>
                      {currentQ.explanation && (
                        <p className="text-zinc-300 font-normal pt-1 border-t border-amber-500/20">
                          <strong className="text-amber-400">Explanation:</strong> {currentQ.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Controls Row */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={currentQIndex === 0}
                      onClick={() => {
                        setCurrentQIndex((prev) => prev - 1);
                        setShowHint(false);
                      }}
                      className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 text-xs font-mono font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {!isCurrentSubmitted ? (
                        <button
                          onClick={handleSubmitCurrentAnswer}
                          disabled={currentSelectedOption === undefined}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-black font-mono uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
                        >
                          <span>Submit Answer</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : currentQIndex < 4 ? (
                        <button
                          onClick={() => {
                            setCurrentQIndex((prev) => prev + 1);
                            setShowHint(false);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
                        >
                          <span>Next Question</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleFinishQuiz}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black font-mono uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
                        >
                          <span>View Final Summary</span>
                          <Trophy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Quiz Summary Card */}
        {isQuizCompleted && (
          <div className="bg-[#0c0d12] border border-amber-500/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Quiz Completed!</h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                LeetCode #{generatedQuiz?.number} — {generatedQuiz?.title}
              </p>
            </div>

            {(() => {
              const res = calculateResults();
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2">
                  <div className="bg-[#14151c] border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Accuracy</span>
                    <span className="text-xl font-black text-amber-400">{res.scorePercent}%</span>
                  </div>
                  <div className="bg-[#14151c] border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Score</span>
                    <span className="text-xl font-black text-white">{res.correctCount} / {res.total}</span>
                  </div>
                  <div className="bg-[#14151c] border border-zinc-800 rounded-xl p-4">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">XP Earned</span>
                    <span className="text-xl font-black text-emerald-400">+{res.xp} XP</span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-4">
              <button
                onClick={() => {
                  setGeneratedQuiz(null);
                  setIsQuizCompleted(false);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase px-8 py-3.5 rounded-xl flex items-center gap-2 mx-auto transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Another LeetCode Problem</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
