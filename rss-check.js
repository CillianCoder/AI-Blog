require("dotenv").config();
const Parser = require("rss-parser");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const he = require("he");

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// Add your RSS and site sources here
const rssFeeds = [
  // 🥇 RSS FEEDS (best)
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

  // 🥈 SCRAPING SOURCES (fallback)
  "https://www.truecrimedaily.com",
  "https://radaronline.com",
  "https://murdermap.co.uk",
  "https://truecrimeforensics.com",
  "https://crimerocket.com",
  "https://truecrimereport.news.blog",
  "https://truecrime.blog",
  "https://unsolved.com",
  "https://the-line-up.com",
  "https://blog.world-mysteries.com",
  "https://projectcoldcase.org",
  "https://charleyross.wordpress.com",
  "https://www.oxygen.com",
  "https://defrostingcoldcases.com",
  "https://insightcrime.org",
  "https://crimereads.com",
  "https://storiesoftheunsolved.com",
  "https://atavist.com",
  "https://truecrimenews.com"
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
      description: article.textContent.slice(0, 200) + "...", // short snippet
    };
  } catch (err) {
    return null;
  }
}

// Check RSS feed
async function checkRSSFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (!feed.items || feed.items.length === 0) return null;
    const firstItem = feed.items[0];
    return {
      title: he.decode(firstItem.title || ""),
      description: he.decode(firstItem.contentSnippet || firstItem.content || "").slice(0, 200) + "...",
    };
  } catch (err) {
    return null;
  }
}

// Main check
(async () => {
  console.log("Starting RSS + Scraping check...\n");

  for (const url of sources) {
    process.stdout.write(`Checking: ${url} ... `);

    // 1️⃣ Try RSS first
    let result = await checkRSSFeed(url);

    // 2️⃣ If RSS fails, try scraping
    if (!result) {
      result = await scrapePage(url);
    }

    if (result) {
      console.log(`✅ WORKS: ${result.title}`);
      console.log(`   Description: ${result.description}\n`);
    } else {
      console.log(`❌ FAILED\n`);
    }
  }

  console.log("Check finished.");
})();
