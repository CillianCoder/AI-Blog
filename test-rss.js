const axios = require('axios');
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
  console.log("🚀 Starting Unbreakable Connection Test...");

  for (const url of rssFeeds) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 12000
      });

      const rawData = response.data;

      // 1. Identify the first article block (<item> for RSS, <entry> for Reddit/Atom)
      const firstBlockMatch = rawData.match(/<(item|entry)[\s\S]*?>([\s\S]*?)<\/\1>/i);

      if (firstBlockMatch) {
        const blockContent = firstBlockMatch[2];
        // 2. Extract the <title> specifically from inside that block
        const titleMatch = blockContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

        if (titleMatch) {
          let cleanTitle = titleMatch[1]
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Remove CDATA wrappers
            .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML tags
            .trim();
          
          console.log(`✅ SUCCESS: ${url}`);
          console.log(`   Latest Title: ${he.decode(cleanTitle).substring(0, 70)}...`);
        } else {
          console.log(`⚠️ EMPTY: ${url} (Block found, but no Title inside)`);
        }
      } else {
        console.log(`⚠️ EMPTY: ${url} (No <item> or <entry> blocks found)`);
      }
    } catch (err) {
      const reason = err.response ? `Status ${err.response.status}` : err.message;
      console.log(`❌ FAILED: ${url} - Reason: ${reason}`);
    }
  }
}

runTest();
