const sharp = require("sharp");

function wrapText(text, maxChars = 28) {
  const words = text.split(" ");
  let lines = [];
  let line = "";

  for (let word of words) {
    if ((line + word).length > maxChars) {
      lines.push(line.trim());
      line = "";
    }
    line += word + " ";
  }

  lines.push(line.trim());
  return lines.slice(0, 2);
}

async function createNewsImage() {

const title = "Woman Disappears After Night Ride";

const lines = wrapText(title);

const svg = `
<svg width="1200" height="630">

<!-- dark image filter -->
<rect x="0" y="0" width="1200" height="630"
fill="black" opacity="0.35"/>

<!-- dark red banner -->
<rect x="0" y="250" width="1200" height="160"
fill="#5A0000" opacity="0.92"/>

<text x="600" y="310"
font-size="60"
fill="white"
text-anchor="middle"
font-family="Arial Black"
font-weight="900">

<tspan x="600" dy="0">${lines[0] || ""}</tspan>
<tspan x="600" dy="70">${lines[1] || ""}</tspan>

</text>

</svg>
`;

await sharp("news.jpg")
.resize(1200,630)
.composite([
{
input: Buffer.from(svg),
gravity: "center"
}
])
.jpeg()
.toFile("final.jpg");

console.log("Final image created: final.jpg");

}

createNewsImage();