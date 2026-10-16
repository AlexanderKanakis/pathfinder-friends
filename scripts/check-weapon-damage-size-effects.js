const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mechanics = require("./effect-mechanics.js");
const rolls = require("./effect-rolls.js");

assert(mechanics.extraKeys().includes("weaponDamageSizeChanges"));

const effects = [
  {
    name: "Impact Grip",
    weaponDamageSizeChanges: [
      {
        matchBy: "name",
        weaponName: "Elven Curve Blade",
        sizeSteps: 1,
      },
    ],
  },
  {
    name: "Natural Savagery",
    weaponDamageSizeChanges: [
      { matchBy: "type", weaponType: "natural", sizeSteps: 1 },
    ],
  },
];

const named = mechanics.weaponDamageSizeChangesForWeapon(
  effects,
  "Melee Weapon (Two-Handed)",
  "Elven Curve Blade",
);
assert.equal(named.length, 1);
assert.equal(named[0].source, "Impact Grip");

const natural = mechanics.weaponDamageSizeChangesForWeapon(
  effects,
  "Natural Weapon",
  "Bite",
);
assert.equal(natural.length, 1);
assert.equal(natural[0].source, "Natural Savagery");

assert.equal(mechanics.shiftWeaponDamageSize("Medium", 1), "Large");
assert.equal(mechanics.shiftWeaponDamageSize("Small", -2), "Diminutive");
assert.equal(mechanics.shiftWeaponDamageSize("Fine", -1), "Fine");
assert.equal(mechanics.shiftWeaponDamageSize("Colossal", 2), "Colossal");

assert.equal(rolls.shiftWeaponDice("1d6", 1), "1d8");
assert.equal(rolls.shiftWeaponDice("1d6", -1), "1d4");
assert.equal(rolls.shiftWeaponDice("2d6", 2), "4d6");

const editor = fs.readFileSync(path.join(root, "scripts/effect-editor.js"), "utf8");
const sheet = fs.readFileSync(
  path.join(root, "scripts/pages/character-sheet.js"),
  "utf8",
);
const map = fs.readFileSync(path.join(root, "scripts/pages/map.js"), "utf8");

assert(editor.includes("createWeaponDamageSizeChangeRow"));
assert(editor.includes("weaponDamageSizeChanges: collectRows"));
assert(sheet.includes("weaponDamageSizeForCard"));
assert(sheet.includes("PFEffectRolls.shiftWeaponDice"));
assert(map.includes("weapon-damage-size-1"));

for (const file of [
  "modals/class-feature-editor.js",
  "scripts/pages/feat-editor.js",
  "scripts/pages/spell-editor.js",
  "scripts/pages/race-editor.js",
  "scripts/pages/item-catalog-editor.js",
  "scripts/pages/bag-of-holding.js",
]) {
  assert(
    fs
      .readFileSync(path.join(root, file), "utf8")
      .includes("weaponDamageSizeChanges"),
    `${file} must persist weapon damage size changes`,
  );
}

console.log("Weapon damage size effect checks passed.");
