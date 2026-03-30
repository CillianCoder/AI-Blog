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
  "https://morbidology.com/feed",
    "https://www.truecrimedaily.com",
  "https://listverse.com",
  "https://radaronline.com",
  "https://murdermap.co.uk",
  "https://truecrimeforensics.com",
  "https://crimerocket.com",
  "https://truecrimestoryblog.com",
  "https://truecrimereport.news.blog",
  "https://truecrime.blog",
  "https://unsolved.com",
  "https://the-line-up.com",
  "https://mysterydelver.com",
  "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",

  // --- Working Paranormal & Mystery Feeds ---
  "https://blog.world-mysteries.com",
  "https://anomalien.com",
  "https://ghosttheory.com",
  "https://southernmostghosts.com",
  "https://connectparanormal.net",
  "https://paranormal-evidence.com",
  "https://hauntedplaces.org",

  // --- Working Reddit Mystery Feeds (Requires User-Agent) ---
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",
  "https://www.reddit.com",

  // --- Verified New High-Quality Sources (Fixed URLs) ---
  "https://projectcoldcase.org",
  "https://charleyross.wordpress.com", 
  "https://www.oxygen.com",
  "https://defrostingcoldcases.com",
  "https://insightcrime.org",
  "https://www.fbi.gov",
  "https://forensicfilesnow.com",
  "https://crimereads.com",
  "https://storiesoftheunsolved.com",
  "https://morbidology.com",
  "https://atavist.com",
  "https://thesuitcasemurder.com",
  "https://investigative-reporter.com",
  "https://crimeblogger19.com",
  "https://www.thetruecrimemuseum.co.uk",
  "https://caughtoffguard.org",
  "https://truecrimenews.com"
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
