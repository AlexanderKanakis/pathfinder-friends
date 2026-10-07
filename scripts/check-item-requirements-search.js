const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const editor = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "item-catalog-editor.js"),
  "utf8",
);
const page = fs.readFileSync(
  path.join(rootDir, "item-catalog-editor.html"),
  "utf8",
);

assert(editor.includes("item.details?.requirements"));
assert(editor.includes("item.requirements"));
assert(page.includes('placeholder="Item name or requirement"'));
assert(page.includes("item-catalog-editor.js?v=canonical-data-1"));

const wondrous = require(path.join(rootDir, "data", "wondrous.json"));
const animateDeadMatches = wondrous.filter((item) =>
  [item.name, item.requirements, item.details?.requirements]
    .map((value) => String(value || "").toLowerCase())
    .some((value) => value.includes("animate dead")),
);

assert(animateDeadMatches.length > 0);
assert(animateDeadMatches.some((item) => item.name === "Zombie Skin Shield"));

console.log("Item requirement search checks passed.");
