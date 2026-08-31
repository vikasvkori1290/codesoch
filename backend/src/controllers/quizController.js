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
    // 1. Fetch LeetCode problem metadata (Title, Description, Code Snippet, Tags)
    const problemData = await fetchLeetCodeProblem(targetProblem);
    const selectedDiff = difficulty || problemData.difficulty || 'Medium';

    // 2. Formulate Socratic AI Prompt for 3-API Traffic Controller
    const promptText = `
You are a world-class Socratic technical interviewer.
Generate a Socratic quiz question for LeetCode Problem #${problemData.number}: "${problemData.title}".
Difficulty: ${selectedDiff}.
Description: ${problemData.description.slice(0, 800)}
Code Snippet:
${problemData.codeSnippet}

Generate ONE Socratic probing question about the architectural flaw, time complexity trade-off, edge case, or pattern analysis for this problem.
Provide exactly 4 distinct multiple choice options (A, B, C, D).

Return ONLY valid JSON matching this exact structure:
{
  "questionText": "Socratic probing question text...",
  "codeSnippet": "Python code snippet illustrating the problem or approach",
  "options": [
    "Option A description...",
    "Option B description...",
    "Option C description...",
    "Option D description..."
  ],
  "correctAnswerIndex": 1,
  "socraticHint": "💡 Socratic AI Hint guiding the user without giving away the exact solution...",
  "explanation": "Detailed explanation of why this option is correct..."
}
`;

    // 3. Dispatch to 3-API Traffic Controller (Gemini -> Groq -> OpenAI failover)
    const aiResult = await aiTrafficController.generateSocraticQuiz(promptText);
    const quizData = aiResult.data;

    // Normalize options for frontend
    const formattedOptions = (quizData.options || []).map((optText, index) => ({
      id: index,
      text: typeof optText === 'string' ? optText : optText.text || `Option ${index + 1}`,
    }));

    const responsePayload = {
      number: problemData.number,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: selectedDiff,
      description: problemData.description,
      codeSnippet: quizData.codeSnippet || problemData.codeSnippet,
      questionText: quizData.questionText || `What is the primary algorithmic complexity of ${problemData.title}?`,
      options: formattedOptions.length === 4 ? formattedOptions : [
        { id: 0, text: 'Option A: High space complexity due to recursion.' },
        { id: 1, text: 'Option B: Time complexity is O(N log N) from sorting.' },
        { id: 2, text: 'Option C: Time complexity is O(N^2) using two pointers.' },
        { id: 3, text: 'Option D: Memory limit exceeded from nested arrays.' },
      ],
      correctAnswerIndex: quizData.correctAnswerIndex ?? 2,
      hint: quizData.socraticHint || `💡 Socratic Hint: Think about how sorting the array allows two pointers to converge.`,
      explanation: quizData.explanation || `Sorting enables two-pointer convergence in O(N^2) time.`,
      providerUsed: aiResult.providerUsed || 'Google Gemini 2.5',
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error(`[Quiz Generation Error]:`, error);
    res.status(500).json({ message: error.message || 'Failed to generate Socratic quiz' });
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
