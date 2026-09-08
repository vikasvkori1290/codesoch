import mongoose from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';
import { connectDB } from '../config/db.js';
import { aiTrafficController } from '../services/aiTrafficController.js';
import { fetchLeetCodeProblem, fetchRecentLeetCodeUserProblem } from '../services/leetcodeService.js';
import { memoryUsers, memorySubmissions } from './authController.js';

// Real-time active problem store (maps userId -> { title, slug, number, updatedAt })
export const activeUserProblems = new Map();

// Helper function to randomly shuffle options and update correctAnswerIndex
function shuffleQuestionOptions(q) {
  const originalOptions = q.options || [];
  const origCorrectIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : Math.floor(Math.random() * 4);
  
  let opts = originalOptions.map((opt, i) => {
    const textVal = typeof opt === 'string' ? opt : opt.text || `Option ${i + 1}`;
    return {
      text: textVal,
      isCorrect: i === origCorrectIdx,
    };
  });

  if (opts.length < 4) {
    while (opts.length < 4) {
      opts.push({ text: `Option ${opts.length + 1}: Alternative algorithmic strategy.`, isCorrect: false });
    }
  }

  // Fisher-Yates Shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }

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
  const { problemInput, mode = 'leetcode', difficulty, skillLevel } = req.body;
  const targetProblem = problemInput || req.body.topicOrSlug || '15';
  const userSkillLevel = skillLevel || req.user?.skillLevel || 'Intermediate';

  try {
    const problemData = await fetchLeetCodeProblem(targetProblem);
    const selectedDiff = difficulty || problemData.difficulty || 'Medium';

    let skillPromptGuidance = '';
    if (userSkillLevel === 'Beginner') {
      skillPromptGuidance = `- TARGET USER TIER: BEGINNER. Focus on fundamental mechanics, basic loop operations, intuitive step-by-step logic, and gentle Socratic hints that build foundational problem-solving confidence. Avoid overly intricate bitwise tricks or extreme micro-optimizations.`;
    } else if (userSkillLevel === 'Pro') {
      skillPromptGuidance = `- TARGET USER TIER: PRO / COMPETITIVE PROGRAMMER. Focus on advanced space-time limits, subtle boundary conditions, cache locality, memory allocation trade-offs, bitwise optimizations, and tricky structural invariants. Challenge experienced developers.`;
    } else {
      skillPromptGuidance = `- TARGET USER TIER: INTERMEDIATE. Focus on standard algorithmic patterns, optimal space-time complexity, core data structure invariants, and common edge cases.`;
    }

    const promptText = `
You are an expert Socratic technical interviewer.
Generate 5 distinct, 100% genuine Socratic multiple-choice quiz questions specifically and exclusively for LeetCode Problem #${problemData.number}: "${problemData.title}".
Problem Difficulty: ${selectedDiff}.
${skillPromptGuidance}
Primary Categories/Tags: ${(problemData.tags || []).join(', ')}.
Problem Statement & Context:
${problemData.description}

STRICT QUALITY & PROBLEM-SPECIFIC RELEVANCE MANDATES:
1. Every question MUST directly probe the specific algorithms, data structures, code logic, invariants, and edge cases of "${problemData.title}".
2. STRICT PROHIBITION: Do NOT ask about Hash Maps, Binary Search Trees, Two Pointers, or Dynamic Programming UNLESS that specific technique is the actual primary algorithm required to solve "${problemData.title}".
3. For example, if "${problemData.title}" is a Binary Search problem, ALL 5 questions MUST probe binary search mechanics, exponential boundary expansion, mid-point calculation, array bounds, and time/space complexity of binary search.
4. DO NOT use generic option text like "O(N) space for Hash Map" or "O(N log N) sorting" unless genuinely relevant to "${problemData.title}".
5. Create 5 distinct Socratic questions following this exact breakdown:
   - Question 1: Primary algorithmic paradigm & optimal strategy for "${problemData.title}".
   - Question 2: Invariants, boundary conditions, edge cases, and range limits for "${problemData.title}".
   - Question 3: Time complexity derivation and search/traversal bounds for "${problemData.title}".
   - Question 4: Space complexity and auxiliary memory invariants for "${problemData.title}".
   - Question 5: Key state transitions, loop invariants, or step-by-step code logic for "${problemData.title}".

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "questionText": "Problem-specific Socratic question text...",
      "options": [
        "Option A description...",
        "Option B description...",
        "Option C description...",
        "Option D description..."
      ],
      "correctAnswerIndex": 1,
      "socraticHint": "💡 Socratic AI Hint guiding the user...",
      "explanation": "Detailed explanation of why this choice is correct..."
    }
  ]
}
`;

    let formattedQuestions = [];
    let providerUsed = 'Google Gemini AI';
    let modelUsed = 'gemini-3.5-flash';

    try {
      const aiResult = await aiTrafficController.generateSocraticQuiz(promptText);
      const rawQuestions = aiResult.data?.questions || [];
      providerUsed = aiResult.providerUsed || 'Google Gemini AI';
      modelUsed = aiResult.modelUsed || 'gemini-3.5-flash';

      if (!rawQuestions || rawQuestions.length === 0) {
        throw new Error('Gemini AI model returned empty questions array.');
      }

      formattedQuestions = rawQuestions.map((q, qIdx) => {
        const rawOpts = q.options || [];
        const optionsList = rawOpts.map((optText, optIdx) => (
          typeof optText === 'string' ? optText : optText.text || `Option ${optIdx + 1}`
        ));

        if (optionsList.length < 4) {
          throw new Error(`Question ${qIdx + 1} generated by Gemini contains fewer than 4 options.`);
        }

        return shuffleQuestionOptions({
          id: qIdx + 1,
          questionText: q.questionText || `Question ${qIdx + 1}: What is the primary algorithmic consideration for ${problemData.title}?`,
          options: optionsList.slice(0, 4),
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : Math.floor(Math.random() * 4),
          hint: q.socraticHint || `💡 Socratic Hint: Consider structural invariants and time bounds for ${problemData.title}.`,
          explanation: q.explanation || `Analyzing ${problemData.title} structure reveals optimal bounds.`,
        });
      });
    } catch (aiErr) {
      console.error(`❌ [Quiz Controller Error]: AI Generation Failed for '${problemData.title}'.`, aiErr.message);
      return res.status(500).json({
        message: `AI Model Failure: Unable to fetch live questions from Gemini API. (${aiErr.message})`,
        promptSent: promptText,
      });
    }

    if (formattedQuestions.length < 5) {
      return res.status(500).json({
        message: `AI Model Failure: Gemini generated ${formattedQuestions.length} questions, expected 5.`,
        promptSent: promptText,
      });
    }

    const responsePayload = {
      number: problemData.number,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: selectedDiff,
      description: problemData.description,
      questions: formattedQuestions.slice(0, 5),
      providerUsed,
      modelUsed,
      promptSent: promptText,
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[Quiz Generation Error]:`, error);
    res.status(500).json({ message: error.message || 'Failed to generate 5 Socratic MCQs' });
  }
};

export const syncActiveProblem = async (req, res) => {
  const { problemInput, title, slug, number } = req.body;
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: 'User not authenticated' });

  try {
    let resolvedProblem = { title: title || problemInput, slug: slug || problemInput, number: number || '15' };
    
    if (!title && problemInput) {
      const p = await fetchLeetCodeProblem(problemInput);
      resolvedProblem = { title: p.title, slug: p.slug, number: p.number };
    }

    activeUserProblems.set(String(userId), {
      ...resolvedProblem,
      updatedAt: Date.now(),
    });

    res.json({ message: 'Active problem synced successfully', problem: resolvedProblem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getActiveProblem = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: 'User not authenticated' });

  try {
    const realTimeActive = activeUserProblems.get(String(userId));
    if (realTimeActive && (Date.now() - realTimeActive.updatedAt < 1000 * 60 * 60)) {
      return res.json({
        hasActiveProblem: true,
        title: realTimeActive.title,
        slug: realTimeActive.slug,
        number: realTimeActive.number,
        source: 'clicked',
      });
    }

    let userObj = null;
    if (mongoose.connection.readyState === 1) {
      userObj = await User.findById(userId);
    } else {
      userObj = memoryUsers.get(String(userId));
    }

    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const username = userObj.leetcodeUrl || userObj.username;
    const recentProblem = await fetchRecentLeetCodeUserProblem(username);

    if (recentProblem) {
      return res.json({
        hasActiveProblem: true,
        title: recentProblem.title,
        slug: recentProblem.slug,
        source: 'recent_submission',
      });
    }

    res.json({ hasActiveProblem: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordQuizSubmission = async (req, res) => {
  const { number, title, scorePercent, correctCount, totalQuestions, userAnswers } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const xpEarned = Math.round((scorePercent || 0) * 4);

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {}
  }
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let submission = null;
    let userStats = { xp: 0, level: 1, streak: 1 };

    if (isDbConnected) {
      submission = await Submission.create({
        userId,
        quizId: new mongoose.Types.ObjectId(),
        problemNumber: String(number || '15'),
        problemTitle: title || '3Sum',
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
      const memUser = memoryUsers.get(String(userId));
      if (memUser) {
        memUser.xp = (memUser.xp || 0) + xpEarned;
        memUser.level = Math.floor(memUser.xp / 100) + 1;
        memUser.streak = (memUser.streak || 0) + 1;
        userStats = { xp: memUser.xp, level: memUser.level, streak: memUser.streak };
      }
      submission = { 
        userId: String(userId), 
        problemNumber: String(number || '15'),
        problemTitle: title || '3Sum',
        score: scorePercent, 
        correctCount: correctCount || 0,
        totalQuestions: totalQuestions || 5,
        xpEarned,
        createdAt: new Date().toISOString()
      };
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
