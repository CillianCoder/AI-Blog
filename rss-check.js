require("dotenv").config();
const Parser = require("rss-parser");

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// Your RSS sources
const sources = [
  "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
  "https://listverse.com/feed",
  "https://truecrimereport.news.blog/feed",
  "https://truecrime.blog/feed",
  "https://charleyross.wordpress.com/feed",
  "https://defrostingcoldcases.com/feed",
  "https://blog.world-mysteries.com/feed",
  "https://anomalien.com/feed",
  "https://ghosttheory.com/feed",
  "https://connectparanormal.net/feed",
  "https://hauntedplaces.org/feed",
  "https://crimereads.com/feed",
  "https://storiesoftheunsolved.com/feed",
  "https://insightcrime.org/feed",
  "https://www.reddit.com/r/TrueCrime/.rss",
  "https://www.reddit.com/r/UnresolvedMysteries/.rss",
  "https://www.reddit.com/r/Paranormal/.rss",
  "https://feeds.feedburner.com/CriminalPodcast"
];

const keyword = "missing"; // Change for testing

// ------------------- Helpers -------------------
function matchesKeyword(text, keyword) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function summarizeText(text, maxSentences = 5) {
  if (!text) return "";

  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length <= maxSentences) return text;

  const stopWords = new Set([
    "the","is","in","and","to","of","a","on","for","with","as","by","at","from","that","this","it","an"
  ]);

  const wordFreq = {};
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(" ");
  for (let word of words) {
    if (!stopWords.has(word) && word.length > 2) wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  const sentenceScores = sentences.map(sentence => {
    const words = sentence.toLowerCase().replace(/[^\w\s]/g, "").split(" ");
    let score = 0;
    for (let word of words) {
      if (wordFreq[word]) score += wordFreq[word];
    }
    return { sentence, score };
  });

  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .map(s => s.sentence);

  const finalSummary = sentences.filter(s => topSentences.includes(s));

  return finalSummary.join(" ");
}

// ------------------- Main Test -------------------
(async () => {
  console.log("Using keyword:", keyword);
  console.log("Starting RSS test...\n");

  let articleFound = null;

  for (const feedUrl of sources) {
    console.log("Checking RSS feed:", feedUrl);

    try {
      const feed = await parser.parseURL(feedUrl);
      if (!feed.items || feed.items.length === 0) continue;

      // Filter items by keyword
      const matchedItems = feed.items.filter(item => {
        const text = `${item.title || ""} ${item.contentSnippet || ""}`;
        return matchesKeyword(text, keyword);
      });

      if (matchedItems.length === 0) continue;

      // Pick the first matched article
      const firstItem = matchedItems[0];

      // Get full content
      const fullContentRaw = firstItem.content || firstItem.contentSnippet || "";
      const fullContent = fullContentRaw
        .replace(/<[^>]*>/g, "") // remove HTML tags
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // limit to avoid huge text

      const summary = summarizeText(fullContent, 5);

      console.log("✅ Article found!\n");
      console.log("📰 TITLE:\n", firstItem.title);
      console.log("📄 FULL CONTENT:\n", fullContent);
      console.log("🔥 SUMMARY:\n", summary);

      articleFound = firstItem;
      break; // Stop after first match

    } catch (err) {
      console.log("❌ Error fetching feed:", feedUrl);
      continue;
    }
  }

  if (!articleFound) console.log("No articles found with the keyword.");
})();