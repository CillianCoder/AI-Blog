// List of OpenTDB categories you might care about
const categories = [9, 23, 17, 20]; // 9=General, 23=History, 17=Science, 20=Myth/Legend
const difficulties = ["easy", "medium", "hard"];

// Pick random one each run
const randomCategory = categories[Math.floor(Math.random() * categories.length)];
const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

console.log("Random category:", randomCategory);
console.log("Random difficulty:", randomDifficulty);

const axios = require("axios");
const he = require("he");

async function getRandomTrivia() {
  try {
    const res = await axios.get("https://opentdb.com/api.php", {
      params: { amount: 1, type: "multiple" }
    });

    const trivia = res.data.results[0];

    // Decode HTML entities
    const title = he.decode(trivia.question);
    const description = he.decode(`Answer: ${trivia.correct_answer}`);

    console.log("Title:", title);
    console.log("Description:", description);

    return { title, description };
  } catch (err) {
    console.error("Error fetching trivia:", err.message);
  }
}

getRandomTrivia();