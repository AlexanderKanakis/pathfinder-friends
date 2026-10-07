const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = global;
require("./buff-calculator.js");

const { scaledBonusValue } = global.PFBuffs;

const characterScale = {
  source: { type: "character" },
  levelMultiplier: { numerator: 1, denominator: 1 },
};

assert.equal(
  scaledBonusValue(
    { value: 1, maximum: 5, bonusScale: characterScale },
    { characterLevel: 20 },
  ),
  5,
  "A scaled stat bonus must stop at its maximum.",
);

assert.equal(
  scaledBonusValue(
    {
      value: 1,
      maximum: 6,
      bonusScale: {
        source: { type: "character" },
        every: { fromLevel: 2, everyLevels: 2, increase: 2 },
        attributeBonuses: [
          { ability: "CHA", numerator: 1, denominator: 1 },
        ],
      },
    },
    { characterLevel: 10 },
    { abilityScores: { charisma: 20 } },
  ),
  6,
  "The maximum must be applied after repeaters and attribute scaling.",
);

assert.equal(
  scaledBonusValue(
    { value: 1, bonusScale: characterScale },
    { characterLevel: 20 },
  ),
  21,
  "A stat bonus without a maximum must remain uncapped.",
);

assert.equal(
  scaledBonusValue({ value: 8, maximum: 5 }, {}),
  5,
  "The stored value must not be able to bypass its maximum.",
);

const editor = fs.readFileSync(path.join(__dirname, "effect-editor.js"), "utf8");
assert.match(editor, /data-effect-field="maximum"/);
assert.match(editor, /effect\.maximum = Number\(maximum\)/);

console.log("Stat bonus maximum checks passed.");
