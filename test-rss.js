const axios = require('axios');
const he = require('he');

const rssFeeds = [
  "https://projectcoldcase.org",
  "https://www.fbi.gov",
  "https://www.reddit.com",
  "https://charleyross.wordpress.com",
  "https://defrostingcoldcases.com", // Fixed URL
  "https://forensicfilesnow.com",
  "https://storiesoftheunsolved.com",
  "https://morbidology.com"
];

async function runTest() {
  console.log("🚀 Starting Advanced Connection Test...");

  for (const url of rssFeeds) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com'
        },
        timeout: 10000
      });

      const rawData = response.data;

      // Improved Regex to find content inside <title> tags inside <item> or <entry>
      const titleMatch = rawData.match(/<(item|entry)[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);

      if (titleMatch && titleMatch[2]) {
        let cleanTitle = titleMatch[2]
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Clean CDATA
          .replace(/<\/?[^>]+(>|$)/g, "") // Strip any HTML tags
          .trim();
        
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`   Latest Case: ${he.decode(cleanTitle).substring(0, 70)}...`);
      } else {
        console.log(`⚠️ EMPTY: ${url} (Could not parse Title)`);
      }
    } catch (err) {
      const status = err.response ? err.response.status : err.message;
      console.log(`❌ FAILED: ${url} - Reason: ${status}`);
    }
  }
}

runTest();
