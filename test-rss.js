const Parser = require("rss-parser");
const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

const rssFeeds = [
  "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
  "https://listverse.com/feed",
  "https://truecrime.blog/feed",
  "https://truecrimestoryblog.com/feed",
  "https://truecrimereport.news.blog/feed",
  "https://blog.world-mysteries.com/feed",
  "https://anomalien.com/feed",
  "https://ghosttheory.com/feed",
  "https://southernmostghosts.com/feed",
  "https://connectparanormal.net/feed",
  "https://paranormal-evidence.com/feed",
  "https://hauntedplaces.org/feed",
  "https://charleyross.wordpress.com/feed",
  "https://storiesoftheunsolved.com/feed",
  "https://morbidology.com/feed"
];

(async () => {
  for (const url of rssFeeds) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`[✅ WORKS] ${url} - Items: ${feed.items.length}`);
    } catch (err) {
      console.log(`[❌ FAIL] ${url} - ${err.message}`);
    }
  }
})();
