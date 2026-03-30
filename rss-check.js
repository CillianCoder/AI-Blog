require("dotenv").config();
const Parser = require("rss-parser");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const he = require("he");

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// Add your RSS feeds here
const rssFeeds = [
  "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
  "https://listverse.com/feed",
  "https://truecrimestoryblog.com/feed",
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
  // ... add all other feeds
];

// Scrape a page using Readability
async function scrapePage(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    });
    const dom = new JSDOM(data, { url });
    const article = new Readability(dom.window.document).parse();
    if (!article) return null;
    return {
      title: article.title,
      content: article.textContent.slice(0, 500) + "...", // sample
    };
  } catch (err) {
    return null;
  }
}

async function checkRSSFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (!feed.items || feed.items.length === 0) return null;
    const firstItem = feed.items[0];
    return {
      feedUrl,
      title: he.decode(firstItem.title || ""),
      link: firstItem.link || "",
      source: "rss",
    };
  } catch (err) {
    return null;
  }
}

(async () => {
  console.log("Starting RSS + Scraping check...\n");
  for (const feed of rssFeeds) {
    process.stdout.write(`Checking: ${feed} ... `);

    // 1️⃣ Try RSS first
    let result = await checkRSSFeed(feed);

    // 2️⃣ If RSS fails, try scraping the site homepage
    if (!result) {
      const scraped = await scrapePage(feed);
      if (scraped) {
        result = {
          feedUrl: feed,
          title: scraped.title,
          link: feed,
          source: "scraping",
        };
      }
    }

    if (result) {
      console.log(`✅ WORKS (${result.source}): ${result.title}`);
    } else {
      console.log(`❌ FAILED`);
    }
  }
  console.log("\nCheck finished.");
})();
