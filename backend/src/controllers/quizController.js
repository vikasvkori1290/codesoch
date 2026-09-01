import mongoose from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';
import { aiTrafficController } from '../services/aiTrafficController.js';
import { fetchLeetCodeProblem } from '../services/leetcodeService.js';
import { memoryUsers, memorySubmissions } from './authController.js';

// Helper function to randomly shuffle options and update correctAnswerIndex
function shuffleQuestionOptions(q) {
  const originalOptions = q.options || [];
  const origCorrectIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : Math.floor(Math.random() * 4);
  
  // Format options with correct answer flag
  let opts = originalOptions.map((opt, i) => {
    const textVal = typeof opt === 'string' ? opt : opt.text || `Option ${i + 1}`;
    return {
      text: textVal,
      isCorrect: i === origCorrectIdx,
    };
  });

  // Ensure exactly 4 options
  if (opts.length < 4) {
    while (opts.length < 4) {
      opts.push({ text: `Option ${opts.length + 1}: Alternative approach.`, isCorrect: false });
    }
  }

  // Fisher-Yates Shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

  // Find new position of the correct answer
  let newCorrectIndex = opts.findIndex((o) => o.isCorrect);
  if (newCorrectIndex === -1) {
    newCorrectIndex = Math.floor(Math.random() * 4);
  }

  return {
    ...q,
    options: opts.map((o, idx) => ({ id: idx, text: o.text })),
    correctAnswerIndex: newCorrectIndex,
  };
}

export const generateQuiz = async (req, res) => {
  const { problemInput, mode = 'leetcode', difficulty } = req.body;
  const targetProblem = problemInput || req.body.topicOrSlug || '15';

  try {
    // 1. Fetch LeetCode problem metadata
    const problemData = await fetchLeetCodeProblem(targetProblem);
    const selectedDiff = difficulty || problemData.difficulty || 'Medium';

    // 2. Formulate Socratic AI Prompt for 5 MCQs with randomized answer positions
    const promptText = `
You are a world-class Socratic technical interviewer.
Generate 5 distinct Socratic multiple-choice quiz questions for LeetCode Problem #${problemData.number}: "${problemData.title}".
Difficulty: ${selectedDiff}.
Problem Description: ${problemData.description.slice(0, 800)}

The 5 questions should cover:
- Question 1: Time & Space Complexity analysis of optimal vs naive approaches.
- Question 2: Key data structure selection & pattern recognition (e.g. Hash Map, Two Pointers, Sliding Window, Monotonic Stack).
- Question 3: Critical edge cases (e.g. duplicate elements, empty inputs, negative values, boundary conditions).
- Question 4: Invariant analysis & step-by-step logic tracing.
- Question 5: Algorithmic optimization & trade-off choices.

IMPORTANT: Randomize the correct answer index between 0, 1, 2, and 3 across the 5 questions! Do NOT always make option 0 or 1 correct!

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "questionText": "Socratic probing question text...",
      "options": [
        "Option A description...",
        "Option B description...",
        "Option C description...",
        "Option D description..."
      ],
      "correctAnswerIndex": 2,
      "socraticHint": "💡 Socratic AI Hint guiding the user...",
      "explanation": "Detailed explanation of why this choice is correct..."
    }
  ]
}
`;

    // 3. Dispatch to 3-API Traffic Controller
    const aiResult = await aiTrafficController.generateSocraticQuiz(promptText);
    const rawQuestions = aiResult.data?.questions || [];

    // Format, normalize, and SHUFFLE options for all 5 questions
    const formattedQuestions = rawQuestions.map((q, qIdx) => {
      const baseQ = {
        id: qIdx + 1,
        questionText: q.questionText || `Question ${qIdx + 1}: What is the primary algorithmic considerations for ${problemData.title}?`,
        options: (q.options && q.options.length === 4) ? q.options : [
          'Option A: Space complexity is O(N) due to hash table allocation.',
          'Option B: Time complexity is O(N log N) from sorting.',
          'Option C: Time complexity is O(N^2) using two pointers.',
          'Option D: Bound overflow occurs on large inputs.',
        ],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : Math.floor(Math.random() * 4),
        hint: q.socraticHint || `💡 Socratic Hint: Consider pattern convergence and time complexity limits.`,
        explanation: q.explanation || `Analyzing problem structure reveals optimal bounds.`,
      };

      return shuffleQuestionOptions(baseQ);
    });

    // Fallback template items if AI returns fewer than 5 questions
    const fallbackTemplates = [
      {
        questionText: `Question 1: What is the primary time complexity flaw of utilizing naive brute force iteration for ${problemData.title}?`,
        options: [
          'Space complexity is O(N) due to tuple set storage.',
          'Time complexity is O(N³), causing Time Limit Exceeded (TLE) on large inputs.',
          'Sorting alters original indices causing invalid calculations.',
          'Nested loops fail on negative numbers.',
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic Hint: Triple nested loops run in O(N³). Sorting first enables O(N²) two-pointer traversal.',
        explanation: 'Brute force triple loops execute N*(N-1)*(N-2)/6 iterations, which is O(N³).',
      },
      {
        questionText: `Question 2: Which algorithmic pattern allows reducing traversal time from O(N³) to O(N²)?`,
        options: [
          'Monotonic Stack traversal.',
          'Sorting array + Two-Pointer Convergence.',
          'Breadth-First Search on a graph.',
          'Dynamic Programming memoization table.',
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic Hint: Sorting allows fixing one element and using left/right pointers to find remaining sum.',
        explanation: 'Sorting the array lets us fix element i and use two pointers to find matching pairs in O(N) per outer loop.',
      },
      {
        questionText: `Question 3: How should duplicate triplets be avoided without consuming extra memory?`,
        options: [
          'By storing all triplets in a Hash Set.',
          'By skipping identical adjacent elements during pointer movement.',
          'By clearing the array after every match.',
          'By converting all integers to absolute values.',
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic Hint: In a sorted array, duplicate values are adjacent. Skipping duplicates eliminates redundant triplets.',
        explanation: 'Skipping duplicate adjacent values during traversal prevents duplicate triplets in O(1) auxiliary space.',
      },
      {
        questionText: `Question 4: When searching for target sum with sorted nums[i] + nums[left] + nums[right], what action is taken if current sum > target?`,
        options: [
          'Increment left pointer (left++).',
          'Decrement right pointer (right--).',
          'Break out of the outer loop.',
          'Reset left to index 0.',
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic Hint: In a sorted array, moving right pointer to the left decreases the sum.',
        explanation: 'Since the array is sorted, right-- decreases the total sum towards zero when current sum > 0.',
      },
      {
        questionText: `Question 5: What is the optimal Space Complexity for the two-pointer approach in ${problemData.title}?`,
        options: [
          'O(N) for recursion call stack.',
          'O(1) auxiliary space (excluding output array).',
          'O(N²) for hash table lookup.',
          'O(log N) memory allocation.',
        ],
        correctAnswerIndex: 1,
        hint: '💡 Socratic Hint: Two pointers only require two integer variables (left, right).',
        explanation: 'Two pointers operate directly in-place on the sorted input array, using O(1) auxiliary space.',
      },
    ];

    while (formattedQuestions.length < 5) {
      const template = fallbackTemplates[formattedQuestions.length] || fallbackTemplates[0];
      formattedQuestions.push(shuffleQuestionOptions({
        id: formattedQuestions.length + 1,
        ...template,
      }));
    }

    const responsePayload = {
      number: problemData.number,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: selectedDiff,
      description: problemData.description,
      questions: formattedQuestions.slice(0, 5),
      providerUsed: aiResult.providerUsed || 'Google Gemini 2.5',
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[Quiz Generation Error]:`, error);
    res.status(500).json({ message: error.message || 'Failed to generate 5 Socratic MCQs' });
  }
};

export const recordQuizSubmission = async (req, res) => {
  const { number, title, scorePercent, correctCount, totalQuestions, userAnswers } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const xpEarned = Math.round((scorePercent || 0) * 4);
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let submission = null;
    let userStats = { xp: 0, level: 1, streak: 1 };

    if (isDbConnected) {
      submission = await Submission.create({
        userId,
        quizId: new mongoose.Types.ObjectId(),
        score: scorePercent || 0,
        totalQuestions: totalQuestions || 5,
        correctCount: correctCount || 0,
        xpEarned,
        userAnswers: userAnswers || [],
      });

      const user = await User.findById(userId);
      if (user) {
        user.xp += xpEarned;
        user.level = Math.floor(user.xp / 100) + 1;
        const now = new Date();
        if (user.lastQuizDate) {
          const diffHours = (now - new Date(user.lastQuizDate)) / (1000 * 60 * 60);
          if (diffHours >= 24 && diffHours <= 48) user.streak += 1;
          else if (diffHours > 48) user.streak = 1;
        } else {
          user.streak = 1;
        }
        user.lastQuizDate = now;
        await user.save();
        userStats = { xp: user.xp, level: user.level, streak: user.streak };
      }
    } else {
      // Memory fallback update
      const memUser = memoryUsers.get(String(userId));
      if (memUser) {
        memUser.xp = (memUser.xp || 0) + xpEarned;
        memUser.level = Math.floor(memUser.xp / 100) + 1;
        memUser.streak = (memUser.streak || 0) + 1;
        userStats = { xp: memUser.xp, level: memUser.level, streak: memUser.streak };
      }
      submission = { userId: String(userId), score: scorePercent, xpEarned };
      memorySubmissions.push(submission);
    }

    res.json({
      message: 'Submission recorded successfully',
      submission,
      userStats,
    });
  } catch (error) {
    console.error('[Record Submission Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to record submission' });
  }
};

export const getQuizById = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.json(quiz);
};

export const submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  let correctCount = 0;
  const userAnswers = quiz.questions.map((q, idx) => {
    const userChoice = answers.find((a) => a.questionIndex === idx);
    const selectedIndex = userChoice ? userChoice.selectedIndex : -1;
    const isCorrect = selectedIndex === q.correctAnswerIndex;
    if (isCorrect) correctCount++;
    return { questionIndex: idx, selectedIndex, isCorrect };
  });

  const totalQuestions = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const xpEarned = scorePercent * 10;

  const submission = await Submission.create({
    userId: req.user?._id,
    quizId: quiz._id,
    score: scorePercent,
    totalQuestions,
    correctCount,
    xpEarned,
    userAnswers,
  });

  res.json({ submission, xpEarned });
};
