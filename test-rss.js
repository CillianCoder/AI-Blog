const Parser = require('rss-parser');
const he = require('he');

// We add "customFields" to help the parser find images and handle weird XML
const parser = new Parser({
  headers: { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 10000,
});

const rssFeeds = [
  "https://projectcoldcase.org",
  "https://www.truecrimedaily.com",
  "https://www.fbi.gov",
  "https://www.reddit.com",
  "https://charleyross.wordpress.com",
  "https://defrostingcoldcases.com",
  "https://forensicfilesnow.com",
  "https://storiesoftheunsolved.com",
  "https://morbidology.com"
];

async function runTest() {
  console.log("🚀 Starting Improved RSS Connection Test...");
  
  for (const url of rssFeeds) {
    try {
      // Use a timeout to prevent hanging
      const feed = await parser.parseURL(url);
      
      if (feed.items && feed.items.length > 0) {
        const item = feed.items[0];
        console.log(`✅ WORKING: ${url}`);
        console.log(`   Latest Title: ${he.decode(item.title || "No Title")}`);
      } else {
        console.log(`⚠️ EMPTY: ${url} (No items found)`);
      }
    } catch (err) {
      // If it fails, we try to see if it's a 'User-Agent' block or actual bad XML
      console.log(`❌ FAILED: ${url}`);
      console.log(`   Error Type: ${err.message}`);
    }
  }
}

runTest();
