const axios = require('axios');
const he = require('he');

const rssFeeds = [
  "https://projectcoldcase.org",
  "https://www.fbi.gov",
  "https://www.reddit.com",
  "https://charleyross.wordpress.com",
  "https://defrostingcoldcases.getfeed", // Fixed URL
  "https://forensicfilesnow.com",
  "https://storiesoftheunsolved.com",
  "https://morbidology.com"
];

async function runTest() {
  console.log("🚀 Starting Regex-Based Connection Test...");

  for (const url of rssFeeds) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        },
        timeout: 10000
      });

      const rawData = response.data;

      // Use Regex to find the first <title> inside an <item> or <entry>
      const titleMatch = rawData.match(/<(item|entry)>[\s\S]*?<title>(.*?)<\/title>/i);

      if (titleMatch && titleMatch[2]) {
        let cleanTitle = titleMatch[2]
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Remove CDATA tags
          .trim();
        
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`   Latest: ${he.decode(cleanTitle).substring(0, 60)}...`);
      } else {
        console.log(`⚠️ EMPTY: ${url} (No titles found in raw text)`);
      }
    } catch (err) {
      console.log(`❌ FAILED: ${url}`);
      console.log(`   Reason: ${err.response ? err.response.status : err.message}`);
    }
  }
}

runTest();
