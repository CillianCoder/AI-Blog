require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const fs = require("fs");
const Parser = require("rss-parser");
const he = require("he");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const { OpenAI } = require("openai");

// ----------------------------
// ENV VARIABLES
// ----------------------------
const PAGE_ID = process.env.PAGE_ID;
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const NEWS_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// ----------------------------
// POSTED ARTICLES FILE
// ----------------------------
const POSTED_FILE = "./posted.json";
let postedArticles = [];
if(fs.existsSync(POSTED_FILE)){
  try { postedArticles = JSON.parse(fs.readFileSync(POSTED_FILE,"utf-8")); } catch(e){ postedArticles=[]; }
}

// ----------------------------
// TOPIC KEYWORDS
// ----------------------------
const trueCrimeKeywords = [
  "murder","homicide","unsolved mystery","serial killer",
  "missing person","crime investigation","cold case","bizarre incident",
  "mysterious death","true crime","kidnapping","human trafficking",
  "haunted places","paranormal","UFOs","cryptids","strange discoveries",
  "cults","secret societies","forensic breakthroughs","historical conspiracies",
  "secret weapons","espionage","military tech","top secret missions",
  "historical battles","dark history","forbidden experiments",
  "famous trials","corruption scandals","celebrity deaths","mysterious creatures","weird news"
];
const trendingKeywords = [
  "autonomous cars","blockchain","crypto","Apple",
  "iPhone","MacBook","Samsung","Galaxy","Google","Pixel","Sony",
  "PlayStation","Tesla","US elections","global conflict",
  "stock market","economy","climate change","NASA","space exploration",
  "trending apps","Netflix","viral trends","social media","influencers","celebrity news","sports highlights"
];
const rssFeeds = [
  // --- Working True Crime & News Feeds ---
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
  "https://www.reddit.com/r/TrueCrime/.rss",
  "https://www.reddit.com/r/UnresolvedMysteries/.rss",
  "https://www.reddit.com/r/Paranormal/.rss",
  "https://feeds.feedburner.com/CriminalPodcast"






];

// ----------------------------
// HELPERS
// ----------------------------
function selectKeyword() {
  return Math.random() < 0.7
    ? trueCrimeKeywords[Math.floor(Math.random()*trueCrimeKeywords.length)]
    : trendingKeywords[Math.floor(Math.random()*trendingKeywords.length)];
}

function extractHashtags(text,max=5){
  if(!text) return "#news";
  const words=text.replace(/[^\w\s]/gi,"").toLowerCase().split(/\s+/).filter(w=>w.length>3);
  const unique=[...new Set(words)];
  return unique.slice(0,max).map(w=>"#"+w).join(" ");
}

function wrapText(text,maxChars=28){
  const words=text.split(" ");
  let lines=[],line="";
  for(let word of words){
    if((line+word).length>maxChars){
      lines.push(line.trim());
      line="";
    }
    line+=word+" ";
  }
  lines.push(line.trim());
  return lines;
}

// ----------------------------
// OPENAI STORY GENERATION
// ----------------------------
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateStoryOpenAI(title, description) {
  try {
    const prompt = `
Rewrite this into a short,humanize, powerful Facebook article post.

Rules:
- Start with a strong hook (curiosity or shock and space after hook/title)
- Build curiosity naturally
- Add a clear payoff(what actually happened)
- Keep is short but COMPLETE (not cut-off)
- End with a strong closing line (no CTA, no links)

Title: ${title}
Description: ${description}
`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",             // fast + stable for automation
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 800,  
      temperature: 0.7              // creativity vs readability
    });

    return completion.choices[0].message.content || title;

  } catch (err) {
    console.error("OpenAI Text Error:", err.message);
    return title;
  }
}
// ----------------------------
// CREATE DYNAMIC OVERLAY BUFFER
// ----------------------------
async function createOverlayBuffer(title, originalBuffer = null) {
  let metadata = { width: 1200, height: 630 };

  if (!originalBuffer) {
    // fallback if no image
    originalBuffer = await sharp({
      create: { width: metadata.width, height: metadata.height, channels: 3, background: "#000000" }
    }).png().toBuffer();
  } else {
    metadata = await sharp(originalBuffer).metadata();
  }

  const width = metadata.width || 1200;
  const height = metadata.height || 630;
  const lines = wrapText(title);

  // Font & banner dynamic
  const fontSize = Math.floor(height * 0.08);
  const lineHeight = Math.floor(fontSize * 1.3);
  const bannerHeight = lines.length * lineHeight + 40; // padding
  const bannerY = Math.floor(height / 2 - bannerHeight / 2);

  let textSVG = "";
  for (let i = 0; i < lines.length; i++) {
    textSVG += `<tspan x="${width / 2}" dy="${i === 0 ? fontSize : lineHeight}">${lines[i]}</tspan>`;
  }

  // SVG overlay with dark background and title text (no watermark)
  const svg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="black" opacity="0.4"/> <!-- dark overlay -->
    <text x="${width / 2}" y="${bannerY + 20}"
      font-size="${fontSize}"
      fill="white"
      text-anchor="middle"
      font-family="Arial Black"
      font-weight="900"
      stroke="black"
      stroke-width="8"
      paint-order="stroke fill"
    >
      ${textSVG}
    </text>
  </svg>`;

  const finalBuffer = await sharp(originalBuffer)
    .blur(1.5) // slight blur to reduce copyright risk
    .composite([{ input: Buffer.from(svg), gravity: "center" }])
    .jpeg()
    .toBuffer();

  return finalBuffer;
}

// ----------------------------
// DOWNLOAD IMAGE (BUFFER ONLY)
// ----------------------------
async function downloadImageBuffer(url){
  if(!url) return null;
  try{
    const res=await axios.get(url,{responseType:"arraybuffer"});
    return Buffer.from(res.data);
  }catch(err){
    console.log("Image download error:",err.message);
    return null;
  }
}

// ----------------------------
// FETCH NEWS ARTICLE
// ----------------------------
async function fetchNews(keyword){
  try{
    const res=await axios.get("https://newsapi.org/v2/everything",{
      params:{q:keyword,language:"en",sortBy:"publishedAt",pageSize:10,apiKey:NEWS_KEY}
    });
    let articles=res.data.articles.filter(a=>a.url&&(a.title||a.description));
    // Filter out already posted articles
    articles=articles.filter(a=>!postedArticles.includes(a.url));
    if(!articles.length) return null;
    return articles[Math.floor(Math.random()*articles.length)];
  }catch(err){
    console.log("News API error:",err.response?.data||err.message);
    return null;
  }
}

async function extractArticle(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    });

    const dom = new JSDOM(data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) return null;
    return article.textContent.replace(/\s+/g, " ").trim();
  } catch (err) {
    return null;
  }
}

function smartSummary(text) {
  const sentences = text
    .split(". ")
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 5) return text.trim();

  const middleIndex = Math.floor(sentences.length / 2);
  const picked = [
    sentences[0],
    sentences[1] || "",
    sentences[middleIndex] || "",
    sentences[sentences.length - 2] || "",
  ].filter(Boolean);

  return `${picked.join(". ").replace(/\s+/g, " ").trim()}.`;
}

async function getArticleForAI() {
  for (const feedUrl of rssFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (!feed.items || feed.items.length === 0) continue;

      // Filter items matching keywords
      let matchedArticles = feed.items.filter((item) => {
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();

  // allow more flexible matching
  return trueCrimeKeywords.some(keyword =>
    text.includes(keyword.toLowerCase())
  ) || Math.random() < 0.15; // allow 15% random articles
});

      if (matchedArticles.length === 0) continue;

      // Filter out already posted articles
      matchedArticles = matchedArticles.filter((item) => {
        const articleUrl = item.link || (item.enclosure && item.enclosure.url) || "";
        return articleUrl && !postedArticles.includes(articleUrl);
      });

      if (matchedArticles.length === 0) continue;

      // Sort by date (newest first)
      matchedArticles.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

      // Pick the first (latest) article
      const article = matchedArticles[0];

      const title = he.decode(article.title || "").trim();
      const rawText = article.contentSnippet || article.content || article.summary || "";
      const cleanText = rawText
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/The post appeared first on.*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

      const articleUrl = article.link || (article.enclosure && article.enclosure.url) || "";
      let description;

      if (articleUrl) {
        const fullText = await extractArticle(articleUrl);
        if (fullText && fullText.length > 300) {
          description = smartSummary(fullText);
        }
      }

      if (!description) {
        description = cleanText.split(" ").slice(0, 100).join(" ");
      }

      // Try to extract image
      let imageUrl = null;
      if (article.enclosure && article.enclosure.url) imageUrl = article.enclosure.url;
      else if (article["media:content"] && article["media:content"].url) imageUrl = article["media:content"].url;
      else if (article.content) {
        const match = article.content.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) imageUrl = match[1];
      }

      // Return all info including articleUrl for duplicate tracking
      return { title, description, imageUrl, articleUrl };
    } catch (err) {
      console.log("Skipping:", feedUrl, "-", err.message);
    }
  }

  console.log("No valid RSS articles found");
  return null;
}

async function fetchRSSArticle() {
  try {
    const data = await getArticleForAI();
    if (!data) return null;

    return {
      title: data.title,
      description: data.description,
      url: data.articleUrl,
      urlToImage: data.imageUrl || null
    };
  } catch (err) {
    console.log("RSS error:", err.message);
    return null;
  }
}

async function fetchTrivia() {
  try {
    const res = await axios.get("https://opentdb.com/api.php", {
      params: { amount: 1, type: "multiple" }
    });

    const trivia = res.data.results[0];
    if (!trivia) return null;

    return {
      title: he.decode(trivia.question),
      description: he.decode(`Answer: ${trivia.correct_answer}`),
      url: null,
      urlToImage: null
    };
  } catch (err) {
    console.log("Trivia error:", err.message);
    return null;
  }
}

// ----------------------------
// POST TO FACEBOOK (BUFFER ONLY)
// ----------------------------
async function postFacebook(text,imageBuffer,articleUrl){
  try{
    const form=new FormData();
    form.append("access_token",PAGE_TOKEN);
    form.append("caption",text);
    if(imageBuffer) form.append("source",imageBuffer,{filename:"image.jpg"});
    const url=`https://graph.facebook.com/${PAGE_ID}/photos`;
    const res=await axios.post(url,form,{headers:form.getHeaders()});
    console.log("Posted successfully! FB Response:",res.data);

    // Add to posted list
    if(articleUrl){
      postedArticles.push(articleUrl);
      fs.writeFileSync(POSTED_FILE,JSON.stringify(postedArticles,null,2));
    }
  }catch(err){
    console.error("Facebook error:",err.response?.data||err.message);
  }
}

// ----------------------------
// MAIN BOT
// ----------------------------
function formatHashtags(tagsArray){
  // Remove duplicates, limit to 5, clean up characters
  return [...new Set(tagsArray)]
           .slice(0,5)
           .map(t => "#" + t.replace(/[^\w]/g,""))
           .join(" ");
}

async function runBot(){
  try{
    console.log("Bot running...");
    const keyword = selectKeyword();
    console.log("Selected keyword:", keyword);
    let sources = ["rss", "news", "trivia"];
    let article = null;

// keep trying until we find an article or run out of sources
while(sources.length > 0 && !article){
  // pick a random source
  const index = Math.floor(Math.random() * sources.length);
  const selectedSource = sources[index];
  console.log("Trying source:", selectedSource);

  if(selectedSource === "news"){
    article = await fetchNews(keyword);
  } else if(selectedSource === "rss"){
    article = await fetchRSSArticle();
  } else if(selectedSource === "trivia"){
    article = await fetchTrivia();
  }

  // if failed, remove source from array
  if(!article){
    console.log(selectedSource, "returned no article. Trying next source...");
    sources.splice(index, 1); // remove this source
  }
}

if(!article){
  console.log("No content found from any source. Skipping this run.");
  return;
}
    console.log("Article selected:", article.title);

    const storyText = await generateStoryOpenAI(article.title, article.description);

    // Remove any hashtags AI may have added in the story
    const storyTextClean = storyText
  .replace(/#\w+/g, "")    // remove hashtags
  .replace(/\*+/g, "")     // remove * or **
  .replace(/_+/g, "")      // remove underscores
  .trim();

    const rawTags = extractHashtags(article.title + " " + storyTextClean).split(" ");
    const hashtags = formatHashtags(rawTags);
    const postText = `${storyTextClean}\n\n${hashtags}`;

    let imageBuffer = await downloadImageBuffer(article.urlToImage);
    imageBuffer = await createOverlayBuffer(article.title, imageBuffer);

    await postFacebook(postText, imageBuffer, article.url);
    console.log("Bot finished posting.");
  }catch(err){
    console.error("Bot error:", err.message);
  }
}


// ----------------------------
// RUN IMMEDIATELY
// ----------------------------
(async () => {
  try {
    await runBot();
    console.log("Process completed. Exiting...");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();

