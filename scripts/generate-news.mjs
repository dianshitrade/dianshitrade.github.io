import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = join(root, "data/source-directory.json");
const outputDir = join(root, "data/generated");
const sources = JSON.parse(readFileSync(sourcePath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

const topics = [
  {
    title: "Daily Nigeria money news brief",
    tags: ["Nigeria", "money", "local news"],
    angle: "Summarise local stories that could affect youth spending, mobile money and online earning interest."
  },
  {
    title: "USD/NGN and gift card rate watch",
    tags: ["FX", "gift cards", "Naira"],
    angle: "Explain how dollar movement can affect card demand and user expectations."
  },
  {
    title: "Online earning and side-hustle radar",
    tags: ["VTU", "freelancing", "mobile money"],
    angle: "Track practical earning channels while warning users about unrealistic claims."
  }
];

const allSources = Object.entries(sources).flatMap(([group, items]) => items.map((item) => ({ group, ...item })));
const rankedSources = allSources.sort((a, b) => b.score - a.score).slice(0, 12);

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, `${today}.json`), JSON.stringify({
  date: today,
  status: "draft",
  editorialPolicy: "Use source links as signals, write original summaries, avoid copying full article text, and add Card Cosmic CTA blocks.",
  topics,
  rankedSources
}, null, 2));

console.log(`Generated daily editorial draft: data/generated/${today}.json`);
