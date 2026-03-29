const Parser = require("rss-parser");
const he = require("he");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// --- Your feeds ---
const rssFeeds = [
  "https://www.truecrimedaily.com/feed/",
  "https://crimewatchdaily.com/feed/",
  "https://listverse.com/feed/",
  "https://crimelibrary.com/rss/news.xml",
  "https://radaronline.com/true-crime/rss",
  "https://murdermap.co.uk/feed",
  "https://truecrimeforensics.com/feed",
  "https://crimerocket.com/feed",
  "https://truecrimestoryblog.com/blog/feed",
  "https://truecrimereport.news.blog/feed",
  "https://truecrime.blog/feed",
  "https://blog.world-mysteries.com/feed",
  "https://unsolved.com/feed",
  "https://anomalien.com/feed",
  "https://ghosttheory.com/feed",
  "https://southernmostghosts.com/blog/feed",
  "https://connectparanormal.net/feed",
  "https://paranormal-evidence.com/feed",
  "https://hauntedplaces.org/feed",
  "https://yourghoststories.com/rss.php",
  "https://the-line-up.com/rss/",
  "https://mysterywire.com/feed",
  "https://mysterydelver.com/feed",
  "https://www.reddit.com/r/TrueCrime/.rss",
  "https://www.reddit.com/r/UnresolvedMysteries/.rss",
  "https://www.reddit.com/r/CrimeScene/.rss",
  "https://www.reddit.com/r/SerialKillers/.rss",
  "https://www.reddit.com/r/ColdCases/.rss",
  "https://www.reddit.com/r/Paranormal/.rss",
  "https://www.reddit.com/r/UFOs/.rss",
  "https://www.reddit.com/r/cryptids/.rss",
  "https://www.reddit.com/r/Strange/.rss",
  "https://www.reddit.com/r/WeirdNews/.rss",
  "https://www.reddit.com/r/GetMotivated/.rss",
  "https://www.reddit.com/r/todayilearned/.rss",
  "https://www.reddit.com/r/interestingasfuck/.rss",
  "https://www.reddit.com/r/history/.rss",
  "https://www.reddit.com/r/Documentaries/.rss",
];

// --- Keywords ---
const keywords = [
  "murder",
  "serial killer",
  "haunted",
  "kidnapping",
  "cold case",
  "unsolved",
  "crime",
  "mystery",
];

async function extractArticle(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    });

    const dom = new JSDOM(data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) return null;
    return article.textContent.replace(/\s+/g, " ").trim();
  } catch (err) {
    return null;
  }
}

function smartSummary(text) {
  const sentences = text
    .split(". ")
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length < 5) return text.trim();

  const mid = Math.floor(sentences.length / 2);
  const picked = [
    sentences[0],
    sentences[1] || "",
    sentences[mid] || "",
    sentences[sentences.length - 2] || "",
  ].filter(Boolean);

  return picked.join(". ").replace(/\s+/g, " ").trim() + ".";
}

async function getArticleForAI() {
  const feeds = [...rssFeeds];

  while (feeds.length > 0) {
    const index = Math.floor(Math.random() * feeds.length);
    const feedUrl = feeds.splice(index, 1)[0];

    try {
      const feed = await parser.parseURL(feedUrl);
      if (!feed.items || feed.items.length === 0) continue;

      const matchedArticles = feed.items.filter((item) => {
        const text = (
          item.title +
          " " +
          (item.contentSnippet || "")
        ).toLowerCase();
        return keywords.some((k) => text.includes(k));
      });

      if (matchedArticles.length === 0) continue;
      const article =
        matchedArticles[Math.floor(Math.random() * matchedArticles.length)];

      const title = he.decode(article.title || "").trim();
      const rawText =
        article.contentSnippet || article.content || article.summary || "";
      let cleanText = rawText
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/The post appeared first on.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

      const articleUrl =
        article.link || (article.enclosure && article.enclosure.url) || "";
      let description;

      if (articleUrl) {
        const fullText = await extractArticle(articleUrl);
        if (fullText && fullText.length > 300) {
          description = smartSummary(fullText);
        }
      }

      if (!description) {
        description = cleanText.split(" ").slice(0, 100).join(" ");
      }

      console.log("\n✅ FINAL OUTPUT (SEND TO AI)\n");
      console.log("Feed:", feedUrl);
      console.log("Title:", title);
      console.log("Description:", description);

      return { title, description };
    } catch (err) {
      console.log("Skipping:", feedUrl, "-", err.message);
      continue;
    }
  }

  console.log("❌ No valid articles found");
  return null;
}

// --- Test run ---
getArticleForAI();
