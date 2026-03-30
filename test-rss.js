const Parser = require('rss-parser');
const he = require('he');
const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0' } // Keeps Reddit from blocking you
});

const rssFeeds = [
  // --- Working True Crime & News Feeds ---
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

async function runTest() {
  console.log("🚀 Starting RSS Connection Test...");
  for (const url of rssFeeds) {
    try {
      const feed = await parser.parseURL(url);
      const item = feed.items[0]; // Get the newest post
      console.log(`✅ WORKING: ${url}`);
      console.log(`   Title: ${he.decode(item.title || "No Title")}`);
    } catch (err) {
      console.log(`❌ FAILED: ${url} - Error: ${err.message}`);
    }
  }
}
runTest();
