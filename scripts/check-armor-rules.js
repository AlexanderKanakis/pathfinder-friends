const assert = require("assert");
const fs = require("fs");
const path = require("path");
const rules = require("./armor-rules.js");

const root = path.resolve(__dirname, "..");
const armor = JSON.parse(
  fs.readFileSync(path.join(root, "data", "armor-shields.json"), "utf8"),
);

for (const item of armor) {
  for (const key of ["bonus", "enhancement", "maxDex", "penalty", "failure"]) {
    const value = item.details?.[key];
    assert(
      value === null || (typeof value === "number" && Number.isFinite(value)),
      `${item.name} has non-numeric ${key}`,
    );
  }
}

const heavyArmor = {
  type: "Armor",
  armorGroup: "Heavy Armors",
  maxDex: 3,
  failure: 35,
};
const shield = {
  type: "Shield",
  armorGroup: "Shields",
  maxDex: null,
  failure: 15,
};

assert.strictEqual(rules.summarizeEquipment([heavyArmor, shield]).maxDex, 3);
assert.strictEqual(rules.dexterityForArmorClass(5, 3), 3);
assert.strictEqual(rules.dexterityForArmorClass(-2, 3), -2);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Wizard",
    classLevel: 10,
    components: "V, S, M",
    equipment: [heavyArmor, shield],
  }).chance,
  50,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Wizard",
    classLevel: 10,
    components: "V",
    equipment: [heavyArmor],
  }).chance,
  0,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Bard",
    classLevel: 10,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Light Armors" }, shield],
  }).chance,
  0,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Bard",
    classLevel: 10,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Medium Armors" }, shield],
  }).chance,
  35,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Skald",
    classLevel: 10,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Light Armors" }, shield],
  }).chance,
  0,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Skald",
    classLevel: 10,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Medium Armors" }, shield],
  }).chance,
  0,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Skald",
    classLevel: 10,
    components: "V, S",
    equipment: [heavyArmor, shield],
  }).chance,
  35,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Bloodrager",
    classLevel: 10,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Medium Armors" }, shield],
  }).chance,
  15,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Magus",
    classLevel: 7,
    components: "V, S",
    equipment: [{ ...heavyArmor, armorGroup: "Medium Armors" }, shield],
  }).chance,
  15,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Cleric",
    magicType: "divine",
    components: "V, S",
    equipment: [heavyArmor],
  }).chance,
  0,
);
assert.strictEqual(
  rules.arcaneSpellFailure({
    className: "Alchemist",
    magicType: "extracts",
    sourceKind: "extracts",
    components: "V, S",
    equipment: [heavyArmor],
  }).chance,
  0,
);

const mithral = { ...heavyArmor, specialMaterial: "Mithral" };
assert.strictEqual(rules.itemMaxDex(mithral), 5);
assert.strictEqual(rules.itemSpellFailure(mithral), 25);
assert.strictEqual(rules.effectiveArmorCategory(mithral), "medium");

for (const [file, pattern] of [
  ["character-sheet.html", /scripts\/armor-rules\.js/],
  ["character-sheet.html", /modals\/arcane-spell-failure\.js/],
  ["map.html", /scripts\/armor-rules\.js/],
  ["map.html", /modals\/arcane-spell-failure\.js/],
  ["scripts/pages/character-sheet.js", /data-field="maxDex"/],
  ["scripts/pages/character-sheet.js", /arcaneSpellFailure/],
  [
    "scripts/pages/character-sheet.js",
    /async function syncCharacterInventoryWithEquipment\([^)]*\)/,
  ],
  [
    "scripts/pages/character-sheet.js",
    /if \(sourceLootId && !validIds\.has\(sourceLootId\)\)\s+changed = removeEquippedLoot\(sourceLootId\)/,
  ],
  [
    "scripts/pages/character-sheet.js",
    /if \(isEnemySheetMode\)[\s\S]{0,220}if \(amount >= total\)[\s\S]{0,100}removeEquippedLoot\(item\.id\)/,
  ],
  [
    "scripts/pages/bag-of-holding.js",
    /if \(previous\)[\s\S]{0,160}removeLootBuff\([\s\S]{0,100}assigned_character_id: previous/,
  ],
  ["modals/spell-picker.js", /Arcane Spell Failure/],
]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert(pattern.test(source), `${file} is missing ${pattern}`);
}

const characterSheetSource = fs.readFileSync(
  path.join(root, "scripts/pages/character-sheet.js"),
  "utf8",
);
assert(
  /spellcastingSourceKind\(className, meta\) === "extracts"\) return "extracts"/.test(
    characterSheetSource,
  ),
  "Extract-using classes must not be classified as arcane spellcasters.",
);
for (const legacyHydrator of [
  "loadArmorRulesCatalog",
  "hydrateArmorRules",
  "hydrateSheetArmorRules",
]) {
  assert(
    !characterSheetSource.includes(legacyHydrator),
    `Runtime armor hydration still uses ${legacyHydrator}`,
  );
}

console.log("Armor, Max Dex, and arcane spell failure checks passed.");
