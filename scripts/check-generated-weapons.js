const assert = require("assert");
const fs = require("fs");
const rolls = require("./effect-rolls.js");

const editor = fs.readFileSync("scripts/effect-editor.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");

for (const field of [
  "diceCount",
  "dieType",
  "staticDamage",
  "smallDiceCount",
  "smallDieType",
  "enhancement",
  "enchantment",
  "awardProficiency",
  "proficiencyMode",
  "standardBabBonus",
  "customBab",
]) {
  assert(
    editor.includes(`data-generated-equipment-field="${field}"`),
    `Generated weapon editor is missing ${field}.`,
  );
}

for (const scale of [
  "dice",
  "static",
  "enhancement",
  "armor-enhancement",
  "standard-bab",
  "custom-bab",
]) {
  assert(
    editor.includes(`data-generated-scale="${scale}"`),
    `Generated weapon editor is missing ${scale} scaling.`,
  );
}

assert(
  editor.includes("enhancementScale:") &&
    editor.includes("details.enhancementScale"),
  "Generated equipment does not persist enhancement scaling.",
);
assert(
  (
    sheet.match(
      /generatedEquipmentScaleValue\(\s*details\.enhancement,\s*details\.enhancementScale,/g,
    ) || []
  ).length === 2,
  "Generated weapon and armor enhancement values are not scaled at application time.",
);

assert(sheet.includes('field("babMode") || "standard"'));
assert(sheet.includes("iterativeBabBonuses(babValue)"));
assert(sheet.includes("PFEffectRolls.resizeWeaponDice"));
assert(sheet.includes('scaleDamageBySize: "yes"'));
assert(sheet.includes("details.awardProficiency ? \"yes\" : \"no\""));
assert(!editor.includes("Change Die With Size"));
assert(editor.includes("GENERATED_WEAPON_ENCHANTMENTS"));
assert(editor.includes('data-generated-extra-damage'));
assert(editor.includes("PFWeaponDamage?.collect"));
assert(sheet.includes("weaponExtraDamageForCard"));

const calculated = rolls.calculateFormula({
  diceCount: 1,
  dieType: 8,
  diceCountScale: { levelMultiplier: { numerator: 1, denominator: 1 } },
  staticValue: 2,
  staticValueScale: { levelMultiplier: { numerator: 1, denominator: 1 } },
}, { casterLevel: 3 });
assert.equal(calculated.diceCount, 4);
assert.equal(calculated.staticValue, 5);
assert.equal(rolls.resizeWeaponDice("1d8", "large"), "2d6");
assert.equal(
  rolls.resizeWeaponDice("1d8", "small", {
    baseDice: "1d8",
    smallDice: "1d6",
  }),
  "1d6",
);
assert.equal(rolls.parseDiceFormula("1d3").dieType, 3);
assert.equal(
  rolls.resizeWeaponDice("1d8", "tiny", { smallDice: "2d4" }),
  "1d6",
  "Smaller sizes must continue from the editable Small formula.",
);

console.log("Generated weapon checks passed.");
