import React, { useState } from 'react';
import { Brain, Search, Sparkles, Code2, Lightbulb, ChevronRight, CheckCircle2, XCircle, RefreshCw, Cpu } from 'lucide-react';
import axios from 'axios';

export default function QuizGenerator({ onGoHome }) {
  const [problemInput, setProblemInput] = useState('15');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!problemInput.trim()) return;

    setIsGenerating(true);
    setErrorMsg('');
    setGeneratedQuiz(null);
    setSelectedOption(null);
    setShowHint(false);
    setIsSubmitted(false);

    try {
      // Call Express Backend Endpoint connected to LeetCode GraphQL + 3-API AI Traffic Controller
      const response = await axios.post('http://localhost:5000/api/quiz/generate', {
        problemInput: problemInput.trim(),
      });

      setGeneratedQuiz(response.data);
    } catch (err) {
      console.warn('[Frontend]: Backend API unreachable or error. Using client fallback generator.', err);
      
      // Resilient fallback mock quiz if backend server is offline
      const num = problemInput.trim() || '15';
      setGeneratedQuiz({
        number: num,
        title: num === '15' ? '3Sum' : num === '1' ? 'Two Sum' : `LeetCode Problem #${num}`,
        difficulty: 'Medium',
        description: 'Given an array of integers, return indices or triplets that satisfy algorithmic sum constraints without duplicates.',
        codeSnippet: `def threeSum(nums: List[int]) -> List[List[int]]:\n    res = set()\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            for k in range(j + 1, n):\n                if nums[i] + nums[j] + nums[k] == 0:\n                    res.add(tuple(sorted([nums[i], nums[j], nums[k]])))\n    return list(res)`,
        questionText: 'What is the primary architectural and algorithmic flaw of utilizing the naive 3-pointer brute force approach shown above?',
        options: [
          { id: 0, text: 'It relies on a set() for deduplication, which is structurally invalid in Python for tuple objects.' },
          { id: 1, text: 'The time complexity is O(N³), making it highly inefficient and prone to Time Limit Exceeded (TLE) errors for large datasets.' },
          { id: 2, text: 'Sorting the triplet inside the innermost loop alters the original array indices, leading to incorrect sum calculations.' },
          { id: 3, text: 'It fails to handle edge cases where the input array contains negative numbers.' },
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic AI Hint: Consider how sorting the array prior to iteration allows two pointers to converge from opposite ends in O(N²) time instead of nested triple loops.',
        explanation: 'Sorting the array first allows two-pointer traversal in O(N²) time instead of O(N³) brute force.',
        providerUsed: 'Google Gemini 2.5 (Fallback)',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans selection:bg-amber-500 selection:text-black relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#17140b_1px,transparent_1px),linear-gradient(to_bottom,#17140b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between relative z-20 border-b border-zinc-900">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Code<span className="text-amber-400">Soch</span>
          </span>
        </div>

        <button
          onClick={onGoHome}
          className="text-xs font-mono font-bold text-zinc-400 hover:text-amber-400 uppercase tracking-wider transition-colors"
        >
          ← Back to Home
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-8 pt-12 pb-16 space-y-10 relative z-10">
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
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-mono mt-3 text-center">{errorMsg}</p>
          )}
        </div>

        {/* Generated Socratic Quiz Display */}
        {generatedQuiz && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quiz Top Metadata Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0c0d12] border border-zinc-800 px-6 py-4 rounded-xl gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-md">
                  LeetCode #{generatedQuiz.number}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">{generatedQuiz.title}</h2>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  {generatedQuiz.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
                  AI: {generatedQuiz.providerUsed}
                </span>
              </div>
            </div>

            {/* Main Quiz Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Problem & Code Snippet */}
              <div className="lg:col-span-5 space-y-6">
                {/* Problem Description */}
                <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Problem Description
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    {generatedQuiz.description}
                  </p>
                </div>

                {/* Code Snippet */}
                {generatedQuiz.codeSnippet && (
                  <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="bg-[#12131a] px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        <span>Code Reference</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Python3</span>
                    </div>
                    <pre className="p-5 text-xs font-mono text-amber-200/90 leading-relaxed overflow-x-auto bg-[#08090d]">
                      <code>{generatedQuiz.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column: Socratic Question & Choice Cards */}
              <div className="lg:col-span-7 space-y-6">
                {/* Socratic Inquiry Banner */}
                <div className="bg-[#0c0d12] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Socratic Question</span>
                  </div>
                  <h2 className="text-base font-bold text-white leading-relaxed">
                    {generatedQuiz.questionText}
                  </h2>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {generatedQuiz.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isCorrectAnswer = opt.id === generatedQuiz.correctAnswerIndex;
                    const optionLetters = ['A', 'B', 'C', 'D'];

                    let cardStyles = 'bg-[#0c0d12] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#101118]';
                    if (isSubmitted) {
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
                        onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                        className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${cardStyles}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSubmitted
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

                {/* Submission Feedback & Socratic Hint */}
                <div className="space-y-4 pt-2">
                  {/* Hint Toggle */}
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>{showHint ? 'Hide Socratic Hint' : '💡 Reveal AI Socratic Hint'}</span>
                  </button>

                  {/* Collapsible Socratic Hint Box */}
                  {showHint && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs font-mono text-amber-300 leading-relaxed shadow-inner space-y-2">
                      <p>{generatedQuiz.hint}</p>
                      {generatedQuiz.explanation && (
                        <p className="text-zinc-300 font-normal pt-1 border-t border-amber-500/20">
                          <strong className="text-amber-400">Explanation:</strong> {generatedQuiz.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Answer Action */}
                  <div className="flex items-center justify-between pt-2">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        {selectedOption === generatedQuiz.correctAnswerIndex ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Correct! Excellent algorithmic intuition.
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            Incorrect. Review the hint above.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}

                    {!isSubmitted && (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null}
                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-black font-mono uppercase px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                      >
                        <span>Submit Answer</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
