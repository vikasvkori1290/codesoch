// CodeSoch Chrome Extension Content Script
// Instantly detects when a user clicks/opens any LeetCode problem tab
(function () {
  const path = window.location.pathname;
  const match = path.match(/\/problems\/([^\/]+)/);

  if (match && match[1]) {
    const slug = match[1];
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    console.log(`[CodeSoch Sync]: Detected active LeetCode problem '${formattedTitle}' (${slug})`);

    // Broadcast to CodeSoch server if JWT token is stored or fetch sync endpoint
    try {
      const token = localStorage.getItem('thinkquiz_token');
      fetch('http://localhost:5000/api/quiz/sync-active-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          problemInput: slug,
          title: formattedTitle,
          slug: slug,
        }),
      }).catch(() => {});
    } catch (err) {
      console.warn('[CodeSoch Sync]: Failed to sync active problem.', err);
    }
  }
})();
