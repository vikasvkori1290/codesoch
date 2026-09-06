import React, { useState } from 'react';
import { Brain, Search, Sparkles, Lightbulb, ChevronRight, ChevronLeft, CheckCircle2, XCircle, RefreshCw, Cpu, Trophy, RotateCcw } from 'lucide-react';
import axios from 'axios';

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
      const response = await axios.post('http://localhost:5000/api/quiz/generate', {
        problemInput: problemInput.trim(),
      });

      setGeneratedQuiz(response.data);
    } catch (err) {
      console.warn('[Frontend]: Backend API unreachable or error. Using client fallback 5-MCQs session.', err);
      
      const num = problemInput.trim() || '15';
      const cleanInput = num.toLowerCase().replace('#', '');
      const isStack = cleanInput.includes('stack') || cleanInput.includes('parentheses') || cleanInput === '20';
      const isTree = cleanInput.includes('tree') || cleanInput.includes('bst') || cleanInput === '226' || cleanInput === '104';
      const isDP = cleanInput.includes('climb') || cleanInput.includes('dp') || cleanInput === '70' || cleanInput === '198';

      let title = `LeetCode Problem #${num}`;
      if (cleanInput === '1' || cleanInput === 'two-sum') title = 'Two Sum';
      else if (cleanInput === '15' || cleanInput === '3sum') title = '3Sum';
      else if (cleanInput === '20' || cleanInput === 'valid-parentheses') title = 'Valid Parentheses';
      else if (cleanInput === '70' || cleanInput === 'climbing-stairs') title = 'Climbing Stairs';
      else if (cleanInput === '226' || cleanInput === 'invert-binary-tree') title = 'Invert Binary Tree';

      let rawQuestions = [];
      if (isStack) {
        rawQuestions = [
          {
            id: 1,
            questionText: `Q1 (Complexity & Pattern): What is the primary advantage of using a Stack (LIFO) over a Queue for solving ${title}?`,
            options: [
              'Stack operations allow random access to any depth in O(1) time.',
              'Stack naturally matches nested structures by matching the most recently opened symbol first.',
              'Stack guarantees sorted element ordering after every push operation.',
              'Stack reduces overall Time Complexity from O(N) to O(log N).',
            ],
            correctAnswerIndex: 1,
            hint: '💡 Socratic Hint: Think about LIFO (Last-In, First-Out). Which element must be checked first when closing symbols appear?',
            explanation: 'A Stack processes the most recent unclosed element first, making it optimal for nested structures in O(N) time and space.',
          },
          {
            id: 2,
            questionText: `Q2 (Edge Cases): Which boundary condition will break a naive Stack implementation of ${title}?`,
            options: [
              'An input string starting with a closing symbol or ending with unclosed opening symbols.',
              'An input array containing only positive integers.',
              'Passing duplicate characters into the stack container.',
              'When input length is an even number.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: What happens if you pop from an empty stack when closing symbols appear first?',
            explanation: 'Underflow occurs if popping from an empty stack when closing symbols appear first or if opening symbols remain unclosed.',
          },
          {
            id: 3,
            questionText: `Q3 (Invariant Tracing): In ${title}, what invariant must hold when input iteration completes successfully?`,
            options: [
              'The stack must contain exactly 1 element representing the max depth.',
              'The stack must be completely empty, indicating all items were matched.',
              'The stack pointers must point to the middle element.',
              'The top element of the stack must equal zero.',
            ],
            correctAnswerIndex: 1,
            hint: '💡 Socratic Hint: If any element remains in the stack after processing all inputs, what does that imply about balance?',
            explanation: 'An empty stack at the end guarantees every opened element was properly matched and closed.',
          },
          {
            id: 4,
            questionText: `Q4 (Optimization): What is the worst-case Space Complexity of the optimal Stack solution for ${title}?`,
            options: [
              'O(1) Auxiliary Space regardless of input size.',
              'O(N) Space in the worst-case when all characters are pushed before popping.',
              'O(N^2) Space due to stack frame allocations.',
              'O(log N) Space using binary tree splitting.',
            ],
            correctAnswerIndex: 1,
            hint: '💡 Socratic Hint: If the input consists entirely of unclosed elements, how many items are stored in memory?',
            explanation: 'Worst-case space is O(N) when all N elements are held in the stack simultaneously.',
          },
          {
            id: 5,
            questionText: `Q5 (Trade-offs): How can Space Complexity be optimized if input characters are constrained to a single symmetric symbol pair?`,
            options: [
              'By using a 2-pointer approach to shrink space to O(1) in-place.',
              'By maintaining an integer balance counter instead of storing individual characters.',
              'By sorting the input string alphabetically before processing.',
              'By using a Hash Map with 100 buckets.',
            ],
            correctAnswerIndex: 1,
            hint: '💡 Socratic Hint: If there is only one type of symbol, do you need to store character values or just count open vs closed?',
            explanation: 'For a single symbol type, a numeric counter tracking open count achieves O(1) auxiliary space.',
          },
        ];
      } else if (isTree) {
        rawQuestions = [
          {
            id: 1,
            questionText: `Q1 (Traversal Strategy): When analyzing ${title}, what distinguishes BFS from DFS tree exploration?`,
            options: [
              'BFS uses a Queue to process level-by-level, while DFS uses recursion/stack to explore paths to leaf nodes first.',
              'BFS runs in O(N^2) time while DFS runs in O(N) time.',
              'DFS requires a sorted Binary Search Tree while BFS works on any tree.',
              'BFS requires O(1) auxiliary space while DFS requires O(N^2) space.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: Which data structure processes nodes layer by layer vs exploring deep branches first?',
            explanation: 'BFS utilizes a Queue for level-order traversal, whereas DFS utilizes recursion/stack for deep path exploration.',
          },
          {
            id: 2,
            questionText: `Q2 (Tree Base Cases): Which base case is mandatory for recursive node traversal in ${title}?`,
            options: [
              'If root is null, return base value (e.g. null, 0, or true).',
              'If node value is negative, throw an exception.',
              'If node has no left child, stop recursion entirely.',
              'If tree height exceeds 10, return false.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: What is the termination condition when a recursive call reaches beyond a leaf node?',
            explanation: 'Checking `if (root === null)` provides the required base case to terminate recursion safely.',
          },
          {
            id: 3,
            questionText: `Q3 (Complexity Bounds): What is the worst-case Space Complexity for recursive DFS on ${title}?`,
            options: [
              'O(1) space always.',
              'O(H) space where H is tree height, which degenerates to O(N) for a skewed tree.',
              'O(N^2) space for tree node duplication.',
              'O(log N) space for any unbalanced tree.',
            ],
            correctAnswerIndex: 1,
            hint: '💡 Socratic Hint: Call stack depth equals the maximum height of the tree. What is height H for a skewed list-like tree?',
            explanation: 'Recursion call stack memory equals tree height H. In unbalanced skewed trees, H = N, yielding O(N) space.',
          },
          {
            id: 4,
            questionText: `Q4 (Pointer Swap Invariant): When inverting or transforming binary trees in ${title}, what invariant holds at each node?`,
            options: [
              'Recursively swap left and right pointers before or after visiting subtrees.',
              'Only swap left children if node value is odd.',
              'Delete right subtrees to enforce single-branch binary trees.',
              'Convert tree into an array before swapping elements.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: Swapping node.left and node.right at every node mirrors the tree structure.',
            explanation: 'Swapping left and right pointers recursively at every node produces a mirrored binary tree.',
          },
          {
            id: 5,
            questionText: `Q5 (Time Complexity): What is the overall Time Complexity of visiting every node once in ${title}?`,
            options: [
              'O(N) where N is total number of nodes in the tree.',
              'O(N log N) from sorting node keys.',
              'O(N^2) due to nested subtree iterations.',
              'O(2^N) due to binary branching.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: If every node is visited exactly once, what is the operation count?',
            explanation: 'Visiting each node once performs constant work O(1) per node, totaling O(N) linear time.',
          },
        ];
      } else if (isDP) {
        rawQuestions = [
          {
            id: 1,
            questionText: `Q1 (Optimal Substructure): What characteristic in ${title} justifies using Dynamic Programming over brute force recursion?`,
            options: [
              'Overlapping subproblems allow memoizing or tabulating previously computed state results.',
              'The input array is guaranteed to be pre-sorted.',
              'The problem requires graph cycle detection.',
              'Decisions must be made randomly.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: Plain recursion re-calculates the same states repeatedly. How does DP optimize this?',
            explanation: 'Memoizing overlapping subproblems avoids redundant calculations, reducing exponential O(2^N) time to polynomial O(N).',
          },
          {
            id: 2,
            questionText: `Q2 (State Transition): What represents the state transition recurrence for ${title}?`,
            options: [
              'dp[i] = dp[i-1] + dp[i-2], expressing current state using optimal answers of smaller steps.',
              'dp[i] = dp[i] * 2.',
              'dp[i] = max(dp[0...i]).',
              'dp[i] = dp[i-1] - 1.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: To reach step i, you could arrive from step i-1 (1 step) or step i-2 (2 steps). How do options combine?',
            explanation: 'Current ways dp[i] is the sum of ways to reach previous steps (dp[i-1] + dp[i-2]).',
          },
          {
            id: 3,
            questionText: `Q3 (Space Optimization): How can memory space for ${title} be optimized from O(N) to O(1)?`,
            options: [
              'By keeping only two variables tracking the previous two steps instead of allocating a full DP array.',
              'By using a 2D matrix filled with zeroes.',
              'By converting bottom-up DP back to top-down recursion.',
              'By sorting inputs before running DP.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: If state i only depends on state i-1 and i-2, do you need the full array?',
            explanation: 'Since state i only references two prior variables, rolling variables reduce space complexity to O(1).',
          },
          {
            id: 4,
            questionText: `Q4 (Base Cases): Which base cases must be initialized for ${title}?`,
            options: [
              'dp[1] = 1 and dp[2] = 2 representing baseline small steps.',
              'dp[0] = -1.',
              'dp[N] = infinity.',
              'Base cases are unnecessary for iterative DP.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: What are the base values for n=1 and n=2 before launching the iteration loop?',
            explanation: 'Initializing dp[1]=1 and dp[2]=2 seeds the bottom-up iteration safely.',
          },
          {
            id: 5,
            questionText: `Q5 (Time Complexity): What is the Time Complexity of solving ${title} via iterative DP?`,
            options: [
              'O(N) linear time.',
              'O(2^N) exponential time.',
              'O(N^2) quadratic time.',
              'O(log N) logarithmic time.',
            ],
            correctAnswerIndex: 0,
            hint: '💡 Socratic Hint: A single loop runs from 3 up to N. What is the operation count?',
            explanation: 'Iterating N times with O(1) state transitions achieves O(N) linear time.',
          },
        ];
      } else {
        rawQuestions = [
          {
            id: 1,
            questionText: `Q1 (Time-Space Trade-off): What is the primary efficiency gain of using a Hash Map for ${title}?`,
            options: [
              'Trading O(N) space complexity to achieve O(1) average lookups, reducing total time from O(N^2) to O(N).',
              'Reducing space complexity to O(1) while maintaining O(N^2) time.',
              'Automatically keeping input elements in sorted numerical order.',
              'Eliminating the need for iteration or key checking.',
            ],
            correctAnswerIndex: 0,
            hint: `💡 Socratic Hint: Instead of scanning the rest of the array with nested loops O(N^2), what is the lookup cost in a Hash Map?`,
            explanation: `Hash tables store visited items for O(1) average lookup, replacing brute force nested loops O(N^2) with O(N) time.`,
          },
          {
            id: 2,
            questionText: `Q2 (Pattern Selection): When is Two Pointers preferable over a Hash Table for array problem ${title}?`,
            options: [
              'When the input array is already sorted (or can be sorted), allowing O(1) auxiliary space traversal.',
              'When we need O(1) lookup speed without mutating array order.',
              'When elements are non-numeric strings.',
              'When duplicate values are explicitly disallowed.',
            ],
            correctAnswerIndex: 0,
            hint: `💡 Socratic Hint: If an array is sorted, how do left and right pointers converge in O(1) extra space?`,
            explanation: `Sorted arrays enable two-pointer convergent search in O(1) auxiliary space without hash table memory overhead.`,
          },
          {
            id: 3,
            questionText: `Q3 (Edge Cases): Which critical test case must be handled in ${title}?`,
            options: [
              'Inputs containing duplicate numbers, negative target values, or minimal array size (N < 2).',
              'Arrays containing floating-point numbers.',
              'Arrays where all elements are positive even numbers.',
              'Arrays with length equal to a power of 2.',
            ],
            correctAnswerIndex: 0,
            hint: `💡 Socratic Hint: Can an element pair with itself? How does code handle negative targets or duplicate values?`,
            explanation: `Ensuring elements are not reused and handling duplicates/negative values prevents logic errors on edge cases.`,
          },
          {
            id: 4,
            questionText: `Q4 (Invariant Tracing): In Hash Map single-pass lookup for ${title}, what is checked before inserting element nums[i]?`,
            options: [
              'Check if complement (target - nums[i]) exists in the map; if yes, return indices immediately.',
              'Check if nums[i] is greater than target value.',
              'Check if map size exceeds array length.',
              'Clear the hash map to prevent memory leaks.',
            ],
            correctAnswerIndex: 0,
            hint: `💡 Socratic Hint: If current value is X and goal is Target, what complement value are you looking for in the map?`,
            explanation: `Searching for target - current in the hash map before insertion prevents using the same index twice.`,
          },
          {
            id: 5,
            questionText: `Q5 (Hash Collision & Constraints): What happens to Hash Map performance in ${title} during worst-case hash collisions?`,
            options: [
              'Lookup degrades from O(1) average time to O(N) worst-case time per operation.',
              'Space complexity increases from O(N) to O(N^2).',
              'Array indices become inverted.',
              'Execution time automatically speeds up.',
            ],
            correctAnswerIndex: 0,
            hint: `💡 Socratic Hint: If all keys hash to the same bucket (bucket collision), what data structure does the bucket degrade to?`,
            explanation: `Bucket collisions degrade hash lookups to O(N) linear search in worst-case scenarios.`,
          },
        ];
      }

      setGeneratedQuiz({
        number: num,
        title,
        difficulty: 'Medium',
        description: `Algorithmic problem constraints, edge cases, and computational bounds for ${title}.`,
        providerUsed: 'Socratic AI Engine',
        questions: rawQuestions.map(shuffleOptions),
      });
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
        await axios.post('http://localhost:5000/api/quiz/record-submission', {
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
