require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const fs = require("fs");
const { OpenAI } = require("openai");

// ----------------------------
// ENV VARIABLES
// ----------------------------
const PAGE_ID = process.env.PAGE_ID;
const PAGE_TOKEN = process.env.PAGE_TOKEN;
const NEWS_KEY = process.env.NEWS_API_KEY;
const HF_KEY = process.env.HF_KEY;

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
  "AI","ChatGPT","machine learning","autonomous cars","drones",
  "quantum computing","blockchain","crypto","VR","AR","Apple",
  "iPhone","MacBook","Samsung","Galaxy","Google","Pixel","Sony",
  "PlayStation","Tesla","EV","US elections","global conflict",
  "stock market","economy","climate change","NASA","space exploration",
  "trending apps","Netflix","viral trends","social media","influencers","celebrity news","sports highlights"
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
// HUGGING FACE STORY GENERATION
// ----------------------------
const hfClient = new OpenAI({ baseURL:"https://router.huggingface.co/v1", apiKey:HF_KEY });

async function generateStoryHF(title,description){
  try{
    const prompt = `Rewrite this news article into an attractive social media story for social media. 
Do NOT include any CTA, URLs, or phrases that send readers outside. 
Include a strong hook at the beginning and a question at the end. 
Use emojis where appropriate to highlight key parts.
Title: ${title}
Description: ${description}`;
    const completion = await hfClient.chat.completions.create({
      model:"Qwen/Qwen2.5-7B-Instruct",
      messages:[{role:"user",content:prompt}]
    });
    return completion?.choices?.[0]?.message?.content||title;
  }catch(err){
    console.error("HF Text Error:",err.message);
    return title;
  }
}

// ----------------------------
// CREATE DYNAMIC OVERLAY BUFFER
// ----------------------------
async function createOverlayBuffer(title,originalBuffer=null){
  let metadata={width:1200,height:630};
  if(!originalBuffer){
    originalBuffer=await sharp({create:{width:metadata.width,height:metadata.height,channels:3,background:"#000000"}}).png().toBuffer();
  }else{
    metadata=await sharp(originalBuffer).metadata();
  }
  const width=metadata.width;
  const height=metadata.height;
  const lines=wrapText(title);

  // Font & banner dynamic
  const fontSize=Math.floor(height*0.08);
  const lineHeight=Math.floor(fontSize*1.3);
  const bannerHeight=lines.length*lineHeight + 40; // extra padding
  const bannerY=Math.floor(height/2 - bannerHeight/2);

  let textSVG="";
  for(let i=0;i<lines.length;i++){
    textSVG+=`<tspan x="${width/2}" dy="${i===0?fontSize:lineHeight}">${lines[i]}</tspan>`;
  }

  const svg=`<svg width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="black" opacity="0.4"/>
  <rect x="0" y="${bannerY}" width="${width}" height="${bannerHeight}" fill="#7A0000" opacity="0.5"/>
  <text x="${width/2}" y="${bannerY+20}" font-size="${fontSize}" fill="white" text-anchor="middle" font-family="Arial Black" font-weight="900">
    ${textSVG}
  </text>
</svg>`;

  const finalBuffer=await sharp(originalBuffer)
    .composite([{input:Buffer.from(svg),gravity:"center"}])
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
    postedArticles.push(articleUrl);
    fs.writeFileSync(POSTED_FILE,JSON.stringify(postedArticles,null,2));
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
    const article = await fetchNews(keyword);
    if(!article){
      console.log("No new articles to post.");
      return;
    }
    console.log("Article selected:", article.title);

    const storyText = await generateStoryHF(article.title, article.description);

    // Remove any hashtags AI may have added in the story
    const storyTextClean = storyText.replace(/#\w+/g, "").trim();

    const rawTags = extractHashtags(storyTextClean).split(" ");
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
runBot();

