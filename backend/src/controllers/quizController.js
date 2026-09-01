import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';
import { aiTrafficController } from '../services/aiTrafficController.js';
import { fetchLeetCodeProblem } from '../services/leetcodeService.js';

export const generateQuiz = async (req, res) => {
  const { problemInput, mode = 'leetcode', difficulty } = req.body;
  const targetProblem = problemInput || req.body.topicOrSlug || '15';

  try {
    // 1. Fetch LeetCode problem metadata
    const problemData = await fetchLeetCodeProblem(targetProblem);
    const selectedDiff = difficulty || problemData.difficulty || 'Medium';

    // 2. Formulate Socratic AI Prompt for 5 MCQs
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
      "correctAnswerIndex": 1,
      "socraticHint": "💡 Socratic AI Hint guiding the user...",
      "explanation": "Detailed explanation of why this choice is correct..."
    }
  ]
}
`;

    // 3. Dispatch to 3-API Traffic Controller
    const aiResult = await aiTrafficController.generateSocraticQuiz(promptText);
    const rawQuestions = aiResult.data?.questions || [];

    // Format & normalize questions list (ensure 5 items)
    const formattedQuestions = rawQuestions.map((q, qIdx) => {
      const optionsList = (q.options || []).map((optText, optIdx) => ({
        id: optIdx,
        text: typeof optText === 'string' ? optText : optText.text || `Option ${optIdx + 1}`,
      }));

      return {
        id: qIdx + 1,
        questionText: q.questionText || `Question ${qIdx + 1}: What is the primary algorithmic considerations for ${problemData.title}?`,
        options: optionsList.length === 4 ? optionsList : [
          { id: 0, text: 'Option A: Space complexity is O(N) due to hash table allocation.' },
          { id: 1, text: 'Option B: Time complexity is O(N log N) from sorting.' },
          { id: 2, text: 'Option C: Time complexity is O(N^2) using two pointers.' },
          { id: 3, text: 'Option D: Bound overflow occurs on large inputs.' },
        ],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 1,
        hint: q.socraticHint || `💡 Socratic Hint: Consider pattern convergence and time complexity limits.`,
        explanation: q.explanation || `Analyzing problem structure reveals optimal bounds.`,
      };
    });

    // Fallback template if AI returns fewer than 5 items
    while (formattedQuestions.length < 5) {
      const idx = formattedQuestions.length + 1;
      formattedQuestions.push({
        id: idx,
        questionText: `Question ${idx}: Which algorithmic pattern optimizes traversal efficiency for ${problemData.title}?`,
        options: [
          { id: 0, text: 'Option A: Brute force nested loops O(N^3)' },
          { id: 1, text: 'Option B: Sorting + Two Pointers O(N^2)' },
          { id: 2, text: 'Option C: Hash Map lookup O(N) space' },
          { id: 3, text: 'Option D: Binary Search Tree O(N log N)' },
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: Think about reducing nested iterations by sorting first.`,
        explanation: `Sorting reduces nested loops by allowing convergent scanning.`,
      });
    }

    const responsePayload = {
      number: problemData.number,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: selectedDiff,
      description: problemData.description,
      questions: formattedQuestions.slice(0, 5), // Guarantee 5 MCQs
      providerUsed: aiResult.providerUsed || 'Google Gemini 2.5',
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[Quiz Generation Error]:`, error);
    res.status(500).json({ message: error.message || 'Failed to generate 5 Socratic MCQs' });
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
