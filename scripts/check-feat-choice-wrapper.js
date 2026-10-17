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
assert(renderFeatProgression.includes('class-feature-choice-row feat-choice-row'));
assert(renderFeatProgression.includes('feat-choice-reselect'));
assert(renderFeatProgression.includes('feat-choice-remove'));
assert(renderFeatProgression.includes('featChoiceSummary(selection, selectedFeat)'));
assert(sheetScript.includes('function featChoiceSummary(selection, feat = {})'));
assert(sheetScript.includes('function legacySpellAdjustmentChoiceSummary('));
assert(sheetScript.includes('filter.resolvedChoice'));
const effectEditor = fs.readFileSync(
  path.join(rootDir, "scripts", "effect-editor.js"),
  "utf8",
);
assert(effectEditor.includes('resolvedChoice: true'));
assert(sheetScript.includes('(Craft|Knowledge|Perform|Profession)'));

global.window = {};
require("./buff-calculator.js");
const featData = JSON.parse(
  fs.readFileSync(path.join(rootDir, "data", "feats.json"), "utf8"),
);
const spellFocus = featData.feats.find(
  (feat) => feat.id === "spell-focus-145",
);
assert(spellFocus, "Core Spell Focus feat is missing");
const resolvedSpellFocus = structuredClone(spellFocus.spellDcBonuses[0]);
resolvedSpellFocus.targetFilters = [
  { targetMode: "school", targets: ["evocation"], resolvedChoice: true },
];
const spellFocusBuff = {
  source: "Feat: Spell Focus",
  spellDcBonuses: [resolvedSpellFocus],
};
assert.strictEqual(
  window.PFBuffs.effectiveSpellDc(15, [spellFocusBuff], {
    school: "Evocation",
    spellSource: "strict-spells",
  }).total,
  16,
);
assert.strictEqual(
  window.PFBuffs.effectiveSpellDc(15, [spellFocusBuff], {
    school: "Conjuration",
    spellSource: "strict-spells",
  }).total,
  15,
);
assert(
  !renderFeatProgression.includes(
    '<article class="class-feature-row border rounded p-2">',
  ),
);
assert(renderFeatProgression.includes("data-character-feat-detail"));
assert(!renderFeatProgression.includes('data-bs-toggle="collapse"'));
assert(!renderFeatProgression.includes("featDescription"));
assert(page.includes('href="css/feat-details.css?v=1"'));
assert(page.includes('src="modals/feat-details.js?v=1"'));
assert(/character-sheet\.js\?v=[^"]+/.test(page));

const css = fs.readFileSync(
  path.join(rootDir, "css", "character-sheet.css"),
  "utf8",
);
assert(css.includes(".feat-choice-row"));
assert(css.includes("grid-template-columns: minmax(0, 1fr) 34px 34px;"));
assert(css.includes(".feat-choice-row .feat-choice-reselect"));
assert(css.includes(".feat-choice-row .feat-choice-remove"));

console.log("Feat choice wrapper checks passed.");
