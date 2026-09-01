import axios from 'axios';

// Popular LeetCode Problem ID mapping
const LEETCODE_ID_MAP = {
  1: 'two-sum',
  2: 'add-two-numbers',
  3: 'longest-substring-without-repeating-characters',
  4: 'median-of-two-sorted-arrays',
  5: 'longest-palindromic-substring',
  11: 'container-with-most-water',
  15: '3sum',
  20: 'valid-parentheses',
  21: 'merge-two-sorted-lists',
  42: 'trapping-rain-water',
  53: 'maximum-subarray',
  70: 'climbing-stairs',
  121: 'best-time-to-buy-and-sell-stock',
  141: 'linked-list-cycle',
  200: 'number-of-islands',
  206: 'reverse-linked-list',
  226: 'invert-binary-tree',
  238: 'product-of-array-except-self',
  300: 'longest-increasing-subsequence',
};

export async function fetchLeetCodeProblem(inputQuery) {
  const cleanInput = String(inputQuery).trim().toLowerCase().replace('#', '');
  
  // Resolve problem slug
  let slug = LEETCODE_ID_MAP[cleanInput] || cleanInput;

  const graphqlQuery = {
    query: `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
          }
          codeSnippets {
            lang
            langSlug
            code
          }
        }
      }
    `,
    variables: { titleSlug: slug },
  };

  try {
    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    const question = response.data?.data?.question;
    if (question) {
      const cleanContent = question.content
        ? question.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()
        : `LeetCode problem ${question.title}`;

      const pythonSnippet =
        question.codeSnippets?.find((s) => s.langSlug === 'python3' || s.langSlug === 'python')?.code ||
        `def solution():\n    # Implement solution for ${question.title}\n    pass`;

      return {
        number: question.questionId || cleanInput,
        title: question.title,
        slug: question.titleSlug,
        difficulty: question.difficulty || 'Medium',
        description: cleanContent,
        codeSnippet: pythonSnippet,
        tags: question.topicTags?.map((t) => t.name) || ['Algorithms'],
      };
    }
  } catch (error) {
    console.warn(`[LeetCode Service]: GraphQL fetch failed for '${slug}'. Using AI fallback synthesis.`);
  }

  const formattedTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    number: cleanInput,
    title: formattedTitle || `LeetCode Problem #${cleanInput}`,
    slug,
    difficulty: 'Medium',
    description: `Algorithmic problem constraints and logic for ${formattedTitle || cleanInput}.`,
    codeSnippet: `def solution(nums):\n    # Optimized logic for ${formattedTitle || cleanInput}\n    pass`,
    tags: ['Algorithms'],
  };
}

export async function fetchRecentLeetCodeUserProblem(username) {
  if (!username) return null;
  const cleanUser = String(username)
    .trim()
    .toLowerCase()
    .replace('https://leetcode.com/u/', '')
    .replace('https://leetcode.com/', '')
    .replace('/', '');

  const graphqlQuery = {
    query: `
      query recentSubmissions($username: String!) {
        recentSubmissionList(username: $username, limit: 1) {
          title
          titleSlug
          timestamp
          statusDisplay
        }
      }
    `,
    variables: { username: cleanUser },
  };

  try {
    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 4000,
    });

    const recent = response.data?.data?.recentSubmissionList?.[0];
    if (recent) {
      return {
        title: recent.title,
        slug: recent.titleSlug,
        timestamp: recent.timestamp,
        statusDisplay: recent.statusDisplay,
      };
    }
  } catch (err) {
    console.warn(`[LeetCode Service]: Recent submissions fetch failed for '${cleanUser}'.`, err.message);
  }
  return null;
}
