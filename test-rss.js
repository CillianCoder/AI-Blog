const axios = require('axios');
const xml2js = require('xml2js');
const he = require('he');

const rssFeeds = [
  "https://projectcoldcase.org",
  "https://www.fbi.gov",
  "https://www.reddit.com",
  "https://charleyross.wordpress.com",
  "https://defrostingcoldcases.com",
  "https://forensicfilesnow.com",
  "https://storiesoftheunsolved.com",
  "https://morbidology.com"
];

async function runTest() {
  console.log("🚀 Starting Heavy-Duty Connection Test...");

  for (const url of rssFeeds) {
    try {
      // 1. Download raw XML with a real User-Agent
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/xml, application/xml, */*'
        },
        timeout: 15000
      });

      // 2. Parse the XML manually (more forgiving than rss-parser)
      const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
      const result = await parser.parseStringPromise(response.data);

      // 3. Find the first item (works for RSS 2.0 and Atom/Reddit)
      const channel = result.rss ? result.rss.channel : result.feed;
      const items = channel.item || channel.entry;
      const firstItem = Array.isArray(items) ? items[0] : items;

      if (firstItem) {
        const title = firstItem.title._ || firstItem.title || "No Title";
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`   Latest: ${he.decode(title).substring(0, 50)}...`);
      }
    } catch (err) {
      console.log(`❌ FAILED: ${url}`);
      console.log(`   Reason: ${err.response ? err.response.status : err.message}`);
    }
  }
}

runTest();
