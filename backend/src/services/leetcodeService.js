import axios from 'axios';

// Fast local cache for classic LeetCode problem mappings
const LEETCODE_ID_MAP = {
  1: 'two-sum',
  2: 'add-two-numbers',
  3: 'longest-substring-without-repeating-characters',
  4: 'median-of-two-sorted-arrays',
  5: 'longest-palindromic-substring',
  7: 'reverse-integer',
  9: 'palindrome-number',
  11: 'container-with-most-water',
  13: 'roman-to-integer',
  14: 'longest-common-prefix',
  15: '3sum',
  19: 'remove-nth-node-from-end-of-list',
  20: 'valid-parentheses',
  21: 'merge-two-sorted-lists',
  22: 'generate-parentheses',
  23: 'merge-k-sorted-lists',
  33: 'search-in-rotated-sorted-array',
  34: 'find-first-and-last-position-of-element-in-sorted-array',
  35: 'search-insert-position',
  39: 'combination-sum',
  42: 'trapping-rain-water',
  46: 'permutations',
  48: 'rotate-image',
  49: 'group-anagrams',
  53: 'maximum-subarray',
  55: 'jump-game',
  56: 'merge-intervals',
  70: 'climbing-stairs',
  76: 'minimum-window-substring',
  78: 'subsets',
  79: 'word-search',
  98: 'validate-binary-search-tree',
  102: 'binary-tree-level-order-traversal',
  104: 'maximum-depth-of-binary-tree',
  121: 'best-time-to-buy-and-sell-stock',
  124: 'binary-tree-maximum-path-sum',
  125: 'valid-palindrome',
  133: 'clone-graph',
  139: 'word-break',
  141: 'linked-list-cycle',
  143: 'reorder-list',
  152: 'maximum-product-subarray',
  153: 'find-minimum-in-rotated-sorted-array',
  162: 'find-peak-element',
  198: 'house-robber',
  200: 'number-of-islands',
  206: 'reverse-linked-list',
  207: 'course-schedule',
  208: 'implement-trie-prefix-tree',
  217: 'contains-duplicate',
  226: 'invert-binary-tree',
  230: 'kth-smallest-element-in-a-bst',
  238: 'product-of-array-except-self',
  242: 'valid-anagram',
  295: 'find-median-from-data-stream',
  300: 'longest-increasing-subsequence',
  322: 'coin-change',
  347: 'top-k-frequent-elements',
  374: 'guess-number-higher-or-lower',
  416: 'partition-equal-subset-sum',
  435: 'non-overlapping-intervals',
  702: 'search-in-a-sorted-array-of-unknown-size',
  704: 'binary-search',
  852: 'peak-index-in-a-mountain-array',
};

// Rich algorithmic domain descriptions for problems where LeetCode returns sparse/null GraphQL content
const PROBLEM_KNOWLEDGE_MAP = {
  '702': {
    title: 'Search in a Sorted Array of Unknown Size',
    difficulty: 'Medium',
    tags: ['Array', 'Binary Search', 'Interactive'],
    description: 'Given an integer target and a sorted array of unknown size, search for target using the ArrayReader.get(index) interface which returns 2^31 - 1 (2147483647) when accessing out-of-bounds indices. Solved by first establishing search boundaries using exponential step expansion (1, 2, 4, 8, 16...) until reader.get(right) >= target or out of bounds, followed by binary search within [left, right] range in O(log T) time complexity.'
  },
  '704': {
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index; otherwise return -1. Solved using binary search with left and right pointers, calculating mid = left + (right - left) // 2 to prevent integer overflow, achieving O(log N) time and O(1) space.'
  },
  '15': {
    title: '3Sum',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    description: 'Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j != k and nums[i] + nums[j] + nums[k] == 0. Solved by sorting nums first, iterating with a fixed outer index i, and using two pointers (left, right) for the remaining elements, skipping duplicate values for i, left, and right to prevent duplicate triplets in O(N^2) time.'
  },
  '49': {
    title: 'Group Anagrams',
    difficulty: 'Medium',
    tags: ['Array', 'Hash Table', 'String', 'Sorting'],
    description: 'Given an array of strings strs, group the anagrams together. Solved by hashing strings based on a canonical key—either by sorting each string or building a 26-character frequency count tuple—mapping each key to a list of original strings in a Hash Map in O(N * K log K) or O(N * K) time.'
  },
  '207': {
    title: 'Course Schedule',
    difficulty: 'Medium',
    tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    description: 'There are numCourses courses labeled 0 to numCourses - 1. Given prerequisites array where prerequisites[i] = [a, b] means course b must be taken before a. Determine if you can finish all courses. Solved by checking for directed cycles in a graph using Topological Sort (Kahn\'s BFS algorithm with indegrees) or DFS cycle detection using 3-state coloring (Unvisited, Visiting, Visited) in O(V + E) time.'
  }
};

// Helper: Query LeetCode GraphQL API to resolve ANY numeric problem ID
async function resolveSlugFromLeetCodeAPI(cleanInput) {
  if (!/^\d+$/.test(cleanInput)) {
    return cleanInput;
  }

  const graphqlQuery = {
    query: `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          questions: data {
            frontendQuestionId
            title
            titleSlug
          }
        }
      }
    `,
    variables: {
      categorySlug: "",
      limit: 10,
      skip: 0,
      filters: { searchKeywords: cleanInput },
    },
  };

  try {
    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 4000,
    });

    const questions = response.data?.data?.problemsetQuestionList?.questions || [];
    const exactMatch = questions.find((q) => String(q.frontendQuestionId) === cleanInput);
    
    if (exactMatch && exactMatch.titleSlug) {
      LEETCODE_ID_MAP[cleanInput] = exactMatch.titleSlug;
      return exactMatch.titleSlug;
    }

    if (questions[0] && questions[0].titleSlug) {
      LEETCODE_ID_MAP[cleanInput] = questions[0].titleSlug;
      return questions[0].titleSlug;
    }
  } catch (err) {
    console.warn(`[LeetCode Resolver]: GraphQL search query failed for ID #${cleanInput}.`);
  }

  return cleanInput;
}

export async function fetchLeetCodeProblem(inputQuery) {
  const cleanInput = String(inputQuery).trim().toLowerCase().replace('#', '');
  
  // 1. Check local knowledge map for curated problem definitions
  if (PROBLEM_KNOWLEDGE_MAP[cleanInput]) {
    const k = PROBLEM_KNOWLEDGE_MAP[cleanInput];
    return {
      number: cleanInput,
      title: k.title,
      slug: k.title.toLowerCase().replace(/ /g, '-'),
      difficulty: k.difficulty,
      description: k.description,
      codeSnippet: `def solution():\n    # Solution for ${k.title}\n    pass`,
      tags: k.tags,
    };
  }

  // 2. Check local cache or search LeetCode API
  let slug = LEETCODE_ID_MAP[cleanInput];
  if (!slug) {
    slug = await resolveSlugFromLeetCodeAPI(cleanInput);
  }

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
      let cleanContent = question.content
        ? question.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()
        : '';

      const tags = question.topicTags?.map((t) => t.name) || ['Algorithms'];

      // If content from LeetCode GraphQL is empty/null or too short (< 60 chars), enrich it
      if (!cleanContent || cleanContent.length < 60) {
        cleanContent = `LeetCode Problem #${question.questionId || cleanInput}: "${question.title}". Category: ${tags.join(', ')}. Focus on optimal data structures, edge cases, time/space trade-offs, and boundary constraints specific to ${question.title}.`;
      }

      const pythonSnippet =
        question.codeSnippets?.find((s) => s.langSlug === 'python3' || s.langSlug === 'python')?.code ||
        `def solution():\n    # Implement solution for ${question.title}\n    pass`;

      if (question.questionId && question.titleSlug) {
        LEETCODE_ID_MAP[String(question.questionId)] = question.titleSlug;
      }

      return {
        number: question.questionId || cleanInput,
        title: question.title,
        slug: question.titleSlug,
        difficulty: question.difficulty || 'Medium',
        description: cleanContent,
        codeSnippet: pythonSnippet,
        tags,
      };
    }
  } catch (error) {
    console.warn(`[LeetCode Service]: GraphQL fetch failed for '${slug}'. Using fallback synthesis.`);
  }

  // Title formatting fallback
  const formattedTitle = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    number: cleanInput,
    title: formattedTitle || `LeetCode Problem #${cleanInput}`,
    slug,
    difficulty: 'Medium',
    description: `Algorithmic problem constraints, boundary conditions, edge cases, and computational bounds for ${formattedTitle || cleanInput}.`,
    codeSnippet: `def solution():\n    # Solution for ${formattedTitle || cleanInput}\n    pass`,
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
