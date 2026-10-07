const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sheetScript = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "character-sheet.js"),
  "utf8",
);
const page = fs.readFileSync(
  path.join(rootDir, "character-sheet.html"),
  "utf8",
);

const renderStart = sheetScript.indexOf("function renderFeatProgression()");
const renderEnd = sheetScript.indexOf("\nfunction renderClassFeatures()", renderStart);
assert(renderStart >= 0 && renderEnd > renderStart);
const renderFeatProgression = sheetScript.slice(renderStart, renderEnd);

assert(renderFeatProgression.includes('<article class="feat-choice-entry">'));
assert(
  !renderFeatProgression.includes(
    '<article class="class-feature-row border rounded p-2">',
  ),
);
assert(page.includes("character-sheet.js?v=canonical-data-1"));

console.log("Feat choice wrapper checks passed.");
