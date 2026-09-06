import mongoose from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { SpacedRepetition } from '../models/SpacedRepetition.js';
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

// Category-Aware Socratic Question Generator for 100% problem relevance
function buildCategorySocraticQuestions(problemData) {
  const title = problemData.title || 'LeetCode Problem';
  const num = String(problemData.number || '15');
  const tagsStr = (problemData.tags || []).join(' ').toLowerCase();
  const titleLower = title.toLowerCase();

  // Detect Problem Domain Category accurately
  let category = 'array_hashmap';
  if (
    titleLower.includes('anagram') ||
    titleLower.includes('group anagrams') ||
    (tagsStr.includes('string') && tagsStr.includes('hash table')) ||
    ['49', '242', '205', '290'].includes(num)
  ) {
    category = 'string_hashmap';
  } else if (
    titleLower.includes('search') ||
    titleLower.includes('binary search') ||
    titleLower.includes('sorted array') ||
    tagsStr.includes('binary search') ||
    ['704', '702', '33', '153', '34', '35', '81', '374', '852', '1095', '162'].includes(num)
  ) {
    category = 'binary_search';
  } else if (titleLower.includes('parentheses') || titleLower.includes('stack') || tagsStr.includes('stack')) {
    category = 'stack';
  } else if (titleLower.includes('linked list') || titleLower.includes('cycle') || titleLower.includes('node') || tagsStr.includes('linked list')) {
    category = 'linked_list';
  } else if (titleLower.includes('tree') || titleLower.includes('bst') || titleLower.includes('invert') || tagsStr.includes('tree')) {
    category = 'binary_tree';
  } else if (titleLower.includes('climb') || titleLower.includes('robber') || titleLower.includes('coin') || tagsStr.includes('dynamic programming')) {
    category = 'dp_recursion';
  } else if (titleLower.includes('island') || titleLower.includes('graph') || tagsStr.includes('graph') || tagsStr.includes('breadth-first search')) {
    category = 'graph';
  } else if (titleLower.includes('sum') || titleLower.includes('two') || tagsStr.includes('hash table') || tagsStr.includes('array')) {
    category = 'array_hashmap';
  }

  const categoryTemplates = {
    string_hashmap: [
      {
        questionText: `Question 1: What is the primary approach for constructing a unique Hash Map key to group anagrams in "${title}"?`,
        options: [
          'Sort the characters of each string (or generate a 26-count frequency tuple) so all anagrams share the exact same key.',
          'Use the original string length as the hash map key.',
          'Sum the ASCII values of all characters in the string.',
          'Use the first and last character of the string as the tuple key.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Anagrams contain identical character frequencies. How can you transform any anagram into a canonical key representation?`,
        explanation: `Sorting characters of a string (e.g. "eat" -> "aet") or generating a 26-count tuple creates a unique key shared by all anagrams in O(1) lookup.`,
      },
      {
        questionText: `Question 2: What is the Time Complexity difference between sorting string keys vs character frequency counting in "${title}"?`,
        options: [
          'Sorting keys takes O(N * K log K), whereas frequency counting array tuple key takes O(N * K) where N is array size and K is max string length.',
          'Sorting keys takes O(N^2), whereas frequency counting takes O(N^3).',
          'Both approaches require O(N * K^2) quadratic string comparisons.',
          'Frequency counting increases time complexity to exponential O(2^K).',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Sorting a string of length K takes O(K log K). Counting 26 lowercase English letters takes O(K) time per string.`,
        explanation: `Character frequency array tuple key reduces string key generation from O(K log K) sorting down to linear O(K) counting time per word.`,
      },
      {
        questionText: `Question 3: In Python/Java, why must character frequency arrays or sorted lists be converted to immutable types (like Tuples or Strings) before using them as Hash Map keys in "${title}"?`,
        options: [
          'Mutable types (like lists/arrays) are unhashable because their contents can mutate, changing their hash code after insertion.',
          'Immutable types consume 10x more memory than mutable lists.',
          'Hash maps in programming languages only accept 32-bit integer keys.',
          'Mutable lists automatically throw IndexOutOfBounds exceptions when hashed.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Hash map keys require stable, unchangeable hash values. Can a mutable array guarantee a fixed hash code over time?`,
        explanation: `Keys in hash maps must be immutable so their hash code remains constant. Python tuples or serialized string keys guarantee unchangeable hashes.`,
      },
      {
        questionText: `Question 4: How should edge cases like empty strings "" or single-character strings "a" be handled in "${title}"?`,
        options: [
          'They naturally map to their own key (e.g. "" or "a") in the hash map without needing special exception handling.',
          'They must be discarded from the input array before processing.',
          'They require initializing a 2D dynamic array with null pointers.',
          'They trigger infinite loops during character frequency iteration.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Does sorting "" or counting characters for "" produce a valid empty key in the map?`,
        explanation: `Standard key generation (sorting or 26-count tuple) handles empty strings and single characters seamlessly without extra branch logic.`,
      },
      {
        questionText: `Question 5: What is the Space Complexity of storing all grouped anagram lists in the final result payload for "${title}"?`,
        options: [
          'O(N * K) space where N is the number of strings and K is the maximum string length.',
          'O(1) space because strings are modified in-place.',
          'O(N^2) space due to hash bucket chain overhead.',
          'O(2^N) exponential space for recursion.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Every string from the input array of total N strings (max length K) is stored in the hash map output buckets.`,
        explanation: `Storing all input strings across the hash map buckets consumes O(N * K) space corresponding to total character count.`,
      },
    ],

    binary_search: [
      {
        questionText: `Question 1: What is the primary efficiency advantage of Binary Search over Linear Search for "${title}"?`,
        options: [
          'Binary Search eliminates half of the remaining search space at every step, running in O(log N) time.',
          'Binary Search allows random access on unsorted linked lists in O(1) time.',
          'Binary Search guarantees O(1) space complexity by allocating additional dynamic hash buckets.',
          'Binary Search checks every element sequentially to ensure 100% accuracy.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: When an array is sorted, comparing target with the middle element eliminates how much of the search space?`,
        explanation: `Binary search divides the search space by half in each iteration, achieving O(log N) logarithmic time complexity.`,
      },
      {
        questionText: `Question 2: How do you prevent integer overflow when calculating the midpoint in "${title}"?`,
        options: [
          'Calculate mid using mid = left + (right - left) / 2 instead of mid = (left + right) / 2.',
          'Convert all array elements to floating point numbers.',
          'Set mid equal to right pointer index divided by 2.',
          'Reset left pointer to zero before every iteration.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: If left and right are large positive integers near Integer.MAX_VALUE, what happens when adding left + right?`,
        explanation: `left + (right - left) / 2 prevents potential integer overflow caused by left + right exceeding max integer bounds.`,
      },
      {
        questionText: `Question 3: In "${title}" (e.g. searching an unknown or unbounded array), how do you establish the initial search boundaries [left, right]?`,
        options: [
          'Exponentially double the right boundary (1, 2, 4, 8, 16...) until target <= element or boundary reached.',
          'Start with left = 0 and right = 1,000,000,000 regardless of target value.',
          'Scan the entire array linearly to find the maximum index.',
          'Set left = right = 0 and increment by 1.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: If the array size is unknown or unbounded, how can you find a right boundary containing the target in O(log N) steps?`,
        explanation: `Exponential search doubles the step size (1, 2, 4, 8...) to locate a valid [left, right] range in O(log N) time.`,
      },
      {
        questionText: `Question 4: What is the loop termination condition for Binary Search in "${title}" to avoid infinite loops?`,
        options: [
          'Continue while left <= right, updating left = mid + 1 or right = mid - 1.',
          'Continue while left != right, updating mid = left.',
          'Break loop as soon as mid is an odd index.',
          'Continue while right - left > N.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: To avoid getting stuck when left == right, how should pointers shrink past mid?`,
        explanation: `Updating left = mid + 1 and right = mid - 1 ensures the search space strictly decreases at every step.`,
      },
      {
        questionText: `Question 5: What is the Auxiliary Space Complexity of iterative Binary Search for "${title}"?`,
        options: [
          'O(1) auxiliary space using two integer pointers (left, right).',
          'O(log N) space for storing dynamic array slices.',
          'O(N) space for hash table key storage.',
          'O(N^2) space for call stack frames.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Iterative binary search operates directly in-place using left and right variables. How much extra memory is used?`,
        explanation: `Iterative binary search modifies left and right pointers in-place, consuming O(1) constant auxiliary space.`,
      },
    ],

    stack: [
      {
        questionText: `Question 1: What is the primary advantage of using a Stack (LIFO) over a Queue for solving "${title}"?`,
        options: [
          'Stack operations allow random access to any depth in O(1) time.',
          'Stack naturally matches nested structures by matching the most recently opened symbol first.',
          'Stack guarantees sorted element ordering after every push operation.',
          'Stack reduces overall Time Complexity from O(N) to O(log N).',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: Think about Last-In, First-Out (LIFO). When closing a bracket or evaluating expressions, which element must be checked first?`,
        explanation: `A Stack processes the most recent unclosed element first, making it optimal for nested structures in O(N) time and space.`,
      },
      {
        questionText: `Question 2: Which boundary condition will break a naive Stack implementation of "${title}"?`,
        options: [
          'An input string containing only opening symbols or starting with a closing symbol.',
          'An input array containing only positive integers.',
          'Passing duplicate characters into the stack container.',
          'When input length is an even number.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: What happens if you try to pop from an empty stack when encountering a closing symbol at index 0?`,
        explanation: `Underflow occurs if popping from an empty stack when closing symbols appear first or if opening symbols remain unclosed.`,
      },
      {
        questionText: `Question 3: In "${title}", what invariant must hold when the input iteration terminates successfully?`,
        options: [
          'The stack must contain exactly 1 element representing the max depth.',
          'The stack must be completely empty, indicating all items were matched.',
          'The stack pointers must point to the middle element.',
          'The top element of the stack must equal zero.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: If any element remains in the stack after processing all inputs, what does that imply about balance?`,
        explanation: `An empty stack at the end guarantees every opened element was properly matched and closed.`,
      },
      {
        questionText: `Question 4: What is the Space Complexity of the optimal Stack solution for "${title}"?`,
        options: [
          'O(1) Auxiliary Space regardless of input size.',
          'O(N) Space in the worst-case when all characters are pushed before popping.',
          'O(N^2) Space due to stack frame allocations.',
          'O(log N) Space using binary tree splitting.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: If the input consists entirely of unclosed elements, how many items are stored in memory?`,
        explanation: `Worst-case space is O(N) when all N elements are held in the stack simultaneously.`,
      },
      {
        questionText: `Question 5: How can Space Complexity be optimized if input characters are constrained to simple symmetric pairs?`,
        options: [
          'By using a 2-pointer approach to shrink space to O(1) in-place.',
          'By maintaining an integer balance counter instead of storing individual characters.',
          'By sorting the input string alphabetically before processing.',
          'By using a Hash Map with 100 buckets.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: If there is only one type of symbol, do you need to store character values or just count open vs closed?`,
        explanation: `For a single symbol type, a numeric counter tracking open count achieves O(1) auxiliary space.`,
      },
    ],

    linked_list: [
      {
        questionText: `Question 1: What is the core invariant when reversing or reordering pointers in "${title}"?`,
        options: [
          'Always update the head pointer before preserving the next node reference.',
          'Store node.next in a temporary variable before reassigning pointers to prevent losing reference to the rest of the list.',
          'Recursively copy all node values into an auxiliary dynamic array.',
          'Traverse backward from the tail node using double pointers.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: If you execute curr.next = prev without saving curr.next, what happens to the remaining list?`,
        explanation: `Saving next = curr.next before pointer reassignment prevents breaking the linked list chain.`,
      },
      {
        questionText: `Question 2: Which classic two-pointer strategy detects cycles or finds the middle node in "${title}"?`,
        options: [
          'Sliding Window with dynamic boundaries.',
          'Floyd\'s Slow and Fast Pointers (Tortoise and Hare).',
          'Monotonic Stack traversal.',
          'Divide and Conquer with merge sort.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: One pointer moves 1 step while another moves 2 steps. How does this help detect cycles or midpoints?`,
        explanation: `Slow (1 step) and Fast (2 steps) pointers meet inside cycles and locate the middle node in O(N) time and O(1) space.`,
      },
      {
        questionText: `Question 3: What edge cases must be handled first in "${title}" to prevent Null Pointer Exception?`,
        options: [
          'Lists with 0 nodes (head is null) or single-node lists (head.next is null).',
          'Lists containing negative integer node values.',
          'Lists with more than 1,000 nodes.',
          'Lists where node values are unsorted.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: What happens if your code dereferences head.next.val when head or head.next is null?`,
        explanation: `Checking for head === null or head.next === null prevents null dereference crashes on minimal lists.`,
      },
      {
        questionText: `Question 4: What are the optimal Time and Space bounds for solving "${title}" in-place?`,
        options: [
          'O(N^2) Time and O(N) Auxiliary Space.',
          'O(N) Time and O(1) Auxiliary Space.',
          'O(N log N) Time and O(N) Auxiliary Space.',
          'O(1) Time and O(N) Auxiliary Space.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: Single traversal modifies pointers directly in memory. Does it allocate new list nodes?`,
        explanation: `In-place pointer mutation traverses the list once in O(N) time while using O(1) auxiliary memory.`,
      },
      {
        questionText: `Question 5: Why is a Dummy / Sentinel head node frequently used in linked list algorithms like "${title}"?`,
        options: [
          'It automatically sorts node values in ascending order.',
          'It simplifies edge cases when inserting or removing the first node of the list.',
          'It reduces time complexity from O(N) to O(1).',
          'It converts a singly-linked list into a doubly-linked list.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: Without a dummy node, how does code handle operations that modify the head node itself?`,
        explanation: `Dummy head nodes eliminate special-case code for head node insertion/deletion, keeping logic clean.`,
      },
    ],

    binary_tree: [
      {
        questionText: `Question 1: When analyzing "${title}", what distinguishes Breadth-First Search (BFS) from Depth-First Search (DFS)?`,
        options: [
          'BFS uses a Queue to process level-by-level, while DFS uses a Stack (or recursion) to explore paths to leaf nodes first.',
          'BFS runs in O(N^2) time while DFS runs in O(N) time.',
          'DFS requires a sorted Binary Search Tree while BFS works on any tree.',
          'BFS requires O(1) auxiliary space while DFS requires O(N^2) space.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Which data structure processes nodes layer by layer vs exploring deep branches first?`,
        explanation: `BFS utilizes a Queue for level-order traversal, whereas DFS utilizes recursion/stack for deep path exploration.`,
      },
      {
        questionText: `Question 2: For binary tree problem "${title}", what property must hold for every node in a valid BST?`,
        options: [
          'Left child value <= node value < right child value, applied strictly across all subtrees.',
          'Every leaf node must reside at the exact same depth level.',
          'The root node must contain the maximum element in the tree.',
          'The total number of left nodes must equal the total number of right nodes.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: In a Binary Search Tree, does the property apply only to direct children or to all subtree descendant nodes?`,
        explanation: `BST property requires all left subtree nodes < current node < all right subtree nodes globally across all depths.`,
      },
      {
        questionText: `Question 3: Which base case is mandatory for recursive tree traversal in "${title}"?`,
        options: [
          'If root is null, return base value (e.g. 0, null, or true).',
          'If node value is negative, throw an exception.',
          'If node has no left child, stop recursion entirely.',
          'If tree height exceeds 10, return false.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: What is the termination condition when a recursive call reaches beyond a leaf node?`,
        explanation: `Checking if (root === null) provides the required base case to terminate recursion safely.`,
      },
      {
        questionText: `Question 4: What is the worst-case Space Complexity for recursive DFS on "${title}"?`,
        options: [
          'O(1) space always.',
          'O(H) space where H is tree height, which degenerates to O(N) for a skewed tree.',
          'O(N^2) space for tree node duplication.',
          'O(log N) space for any unbalanced tree.',
        ],
        correctAnswerIndex: 1,
        hint: `💡 Socratic Hint: Call stack depth equals the maximum height of the tree. What is height H for a skewed linked-list-like tree?`,
        explanation: `Recursion call stack memory equals tree height H. In unbalanced skewed trees, H = N, yielding O(N) space.`,
      },
      {
        questionText: `Question 5: How can in-order traversal be utilized to solve "${title}" efficiently?`,
        options: [
          'In-order traversal of a BST yields elements in strictly ascending sorted order.',
          'In-order traversal guarantees level-by-level node processing.',
          'In-order traversal reduces execution time from O(N) to O(1).',
          'In-order traversal eliminates the need for base cases.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: What is the relative output order of visiting Left Subtree -> Root -> Right Subtree on a BST?`,
        explanation: `Visiting Left -> Root -> Right produces a sorted sequence, ideal for validation or finding K-th smallest items.`,
      },
    ],

    dp_recursion: [
      {
        questionText: `Question 1: What key characteristic in "${title}" justifies using Dynamic Programming over plain recursion?`,
        options: [
          'The problem exhibits overlapping subproblems and optimal substructure.',
          'The input array is guaranteed to be pre-sorted.',
          'The algorithm requires graph cycle detection.',
          'The optimal solution requires non-deterministic random choices.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Plain recursion re-calculates the same states repeatedly (e.g. fib(3)). How does DP optimize this?`,
        explanation: `Memoizing overlapping subproblems avoids redundant calculations, reducing exponential O(2^N) time to polynomial O(N).`,
      },
      {
        questionText: `Question 2: What represents the state transition formula in "${title}"?`,
        options: [
          'Building current state answer dp[i] from previously computed smaller subproblems dp[i-1], dp[i-2], etc.',
          'Randomly choosing elements using a uniform distribution.',
          'Sorting the array in descending order at every step.',
          'Clearing the memoization table whenever state changes.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: How do you express the decision at step i in terms of decisions made at earlier steps?`,
        explanation: `DP state transition equations express the optimal value for state i using optimal solutions of smaller states.`,
      },
      {
        questionText: `Question 3: How can memory space for "${title}" be optimized from O(N) to O(1)?`,
        options: [
          'By retaining only the last few necessary state values instead of keeping the full DP array.',
          'By using a 2D matrix filled with zeroes.',
          'By converting bottom-up DP to naive top-down recursion.',
          'By sorting inputs before running DP.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: If dp[i] only depends on dp[i-1] and dp[i-2], do you need to store the entire dp[0...N] table?`,
        explanation: `If transitions only reference the past K states, rolling variables replace the 1D/2D table for O(1) space.`,
      },
      {
        questionText: `Question 4: Which base cases must be initialized for "${title}" to prevent index out of bounds?`,
        options: [
          'Base cases for smallest inputs (e.g. n = 0, n = 1, or empty container).',
          'Negative values must be multiplied by -1.',
          'The last element of the DP array must be set to infinity.',
          'Base cases are unnecessary if recursion is used.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: What starting values trigger the DP recurrence relation without looking up negative indices?`,
        explanation: `Explicit base cases (like dp[0] or dp[1]) seed the bottom-up iteration safely without array index overflow.`,
      },
      {
        questionText: `Question 5: What is the trade-off between Top-Down Memoization and Bottom-Up Tabulation in "${title}"?`,
        options: [
          'Top-down uses call stack space O(N), while bottom-up uses iterative loops avoiding stack overflow.',
          'Top-down runs in O(N^2) time while bottom-up runs in O(N) time.',
          'Bottom-up cannot handle dynamic state sizes.',
          'Top-down requires O(1) space always.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Top-Down recursion relies on function call frames. What potential issue can deep recursion cause?`,
        explanation: `Top-down uses recursion stack memory (risk of StackOverflow), whereas bottom-up uses iterative loops cleanly.`,
      },
    ],

    array_hashmap: [
      {
        questionText: `Question 1: What is the primary efficiency gain of using a Hash Table in "${title}"?`,
        options: [
          'Trading O(N) space complexity to achieve O(1) average-time lookups, reducing total time from O(N^2) to O(N).',
          'Reducing space complexity to O(1) while maintaining O(N^2) time.',
          'Automatically keeping input elements in sorted numerical order.',
          'Eliminating the need for iteration or key checking.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: Instead of scanning the rest of the array with a second nested loop O(N), what is the lookup cost in a Hash Map?`,
        explanation: `Hash tables store visited items for O(1) average lookup, replacing brute force nested loops O(N^2) with O(N) time.`,
      },
      {
        questionText: `Question 2: How does a Hash Table achieve O(1) average-time lookups when searching for elements in "${title}"?`,
        options: [
          'By computing a hash code index directly mapping keys to buckets in constant time.',
          'By sorting the array in O(N log N) time before searching.',
          'By using binary search pointers on unsorted memory.',
          'By scanning all elements sequentially in O(N) worst-case.',
        ],
        correctAnswerIndex: 0,
        hint: `💡 Socratic Hint: How does a hash function convert a key directly into an array bucket index?`,
        explanation: `Hash functions compute bucket indices in O(1) time, enabling direct key lookups without full array traversal.`,
      },
      {
        questionText: `Question 3: Which critical test case must be handled in "${title}"?`,
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
        questionText: `Question 4: In Hash Map single-pass lookup for "${title}", what is checked before inserting element nums[i]?`,
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
        questionText: `Question 5: What happens to Hash Map performance in "${title}" during worst-case hash collisions?`,
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
    ],
  };

  const selectedList = categoryTemplates[category] || categoryTemplates.array_hashmap;

  return selectedList.map((tpl, i) => shuffleQuestionOptions({
    id: i + 1,
    questionText: tpl.questionText,
    options: tpl.options,
    correctAnswerIndex: tpl.correctAnswerIndex,
    hint: tpl.hint,
    explanation: tpl.explanation,
  }));
}

export const generateQuiz = async (req, res) => {
  const { problemInput, mode = 'leetcode', difficulty } = req.body;
  const targetProblem = problemInput || req.body.topicOrSlug || '15';

  try {
    const problemData = await fetchLeetCodeProblem(targetProblem);
    const selectedDiff = difficulty || problemData.difficulty || 'Medium';

    // Unrestricted Socratic AI Prompt without rigid forced genres
    const promptText = `
You are an expert Socratic technical interviewer.
Generate 5 distinct, highly relevant Socratic multiple-choice quiz questions specifically about LeetCode Problem #${problemData.number}: "${problemData.title}".
Difficulty: ${selectedDiff}.
Tags/Topic: ${(problemData.tags || []).join(', ')}.
Problem Summary: ${problemData.description.slice(0, 900)}

Instructions:
- Create 5 deep, thought-provoking Socratic questions probing the core algorithm, code logic, invariants, edge cases, and optimization trade-offs specifically for "${problemData.title}".
- CRITICAL: Do NOT ask about algorithms or techniques that are NOT relevant to "${problemData.title}" (for example, do NOT ask about Two Pointers if "${problemData.title}" uses String Sorting or Hash Maps).
- Make every single question and option 100% accurate and relevant to "${problemData.title}".
- Randomize the correct answer index between 0, 1, 2, and 3 across the 5 questions.
- For each question, provide a Socratic hint that guides the user to think through the problem without giving away the answer directly.

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
    let providerUsed = 'Socratic AI Engine';

    try {
      const aiResult = await aiTrafficController.generateSocraticQuiz(promptText);
      const rawQuestions = aiResult.data?.questions || [];
      providerUsed = aiResult.providerUsed || 'Google Gemini 2.5';

      if (rawQuestions.length > 0) {
        formattedQuestions = rawQuestions.map((q, qIdx) => {
          const rawOpts = q.options || [];
          const optionsList = rawOpts.map((optText, optIdx) => (
            typeof optText === 'string' ? optText : optText.text || `Option ${optIdx + 1}`
          ));

          return shuffleQuestionOptions({
            id: qIdx + 1,
            questionText: q.questionText || `Question ${qIdx + 1}: What is the primary algorithmic consideration for ${problemData.title}?`,
            options: optionsList.length === 4 ? optionsList : [
              'Option A: Space complexity is O(N) for state allocation.',
              'Option B: Time complexity is O(N log N) from sorting.',
              'Option C: Time complexity is O(N) using optimal traversal.',
              'Option D: Boundary conditions overflow on edge inputs.',
            ],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : Math.floor(Math.random() * 4),
            hint: q.socraticHint || `💡 Socratic Hint: Consider structural invariants and time bounds for ${problemData.title}.`,
            explanation: q.explanation || `Analyzing ${problemData.title} structure reveals optimal bounds.`,
          });
        });
      }
    } catch (aiErr) {
      console.warn(`[Quiz Controller]: AI Traffic Controller failed for '${problemData.title}'. Employing problem-aware Socratic generator.`, aiErr.message);
    }

    // If AI returns fewer than 5 questions, fill with problem-aware category generator
    if (formattedQuestions.length < 5) {
      const categoryQuestions = buildCategorySocraticQuestions(problemData);
      while (formattedQuestions.length < 5) {
        formattedQuestions.push(categoryQuestions[formattedQuestions.length] || categoryQuestions[0]);
      }
    }

    const responsePayload = {
      number: problemData.number,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: selectedDiff,
      description: problemData.description,
      questions: formattedQuestions.slice(0, 5),
      providerUsed,
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
