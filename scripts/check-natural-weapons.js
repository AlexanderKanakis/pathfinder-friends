const assert = require("assert");
const fs = require("fs");

const sizes = [
  "fine",
  "diminutive",
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
  "colossal",
];
const expected = {
  Bite: ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8", "4d6"],
  Claw: ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
  Gore: ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8", "4d6"],
  "Hoof, Tentacle, Wing": ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
  "Pincers, Tail Slap": ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8", "4d6"],
  Slam: ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
  Sting: ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
  Talons: ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
  Other: ["", "1", "1d2", "1d3", "1d4", "1d6", "1d8", "2d6", "2d8"],
};

const weapons = JSON.parse(fs.readFileSync("data/weapons.json", "utf8"));
const natural = weapons.filter((item) => item.generatedCategory === "natural");
assert.equal(natural.length, 9, "Natural weapon catalog should contain nine table rows.");

for (const item of natural) {
  const kind = item.details.naturalAttackKind;
  assert(expected[kind], `Unexpected natural attack kind: ${kind}`);
  assert.deepEqual(
    sizes.map((size) => item.details.naturalDamageBySize[size]),
    expected[kind],
    `${kind} has incorrect size damage.`,
  );
}

const picker = fs.readFileSync("modals/generated-equipment-picker.js", "utf8");
const editor = fs.readFileSync("scripts/effect-editor.js", "utf8");
const naturalWeapons = fs.readFileSync("scripts/natural-weapons.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
const bag = fs.readFileSync("scripts/pages/bag-of-holding.js", "utf8");
assert(!picker.includes("const NATURAL_WEAPONS"));
assert(!sheet.includes("NATURAL_ATTACK_DAMAGE_BY_SIZE"));
assert(editor.includes("data-generated-natural-damage"));
assert(editor.includes("naturalDamageBySize"));
assert(sheet.includes('data-field="naturalDamageBySize"'));
assert(sheet.includes("inventoryNaturalDamageBySize"));
assert(bag.includes("lootNaturalDamageBySize"));
assert(
  naturalWeapons.includes(
    'class="modal-number-stepper natural-damage-stepper"',
  ),
  "Natural damage values must use one canonical stepper wrapper.",
);
assert(
  naturalWeapons.includes('fetch("data/weapons.json"'),
  "The natural weapon loader must use the existing weapon catalog path.",
);

for (const page of [
  "bag-of-holding.html",
  "character-sheet.html",
  "class-editor.html",
  "class-feature-pool-editor.html",
  "feat-editor.html",
  "item-catalog-editor.html",
  "map.html",
  "race-editor.html",
  "spell-editor.html",
]) {
  assert(
    fs.readFileSync(page, "utf8").includes("scripts/natural-weapons.js"),
    `${page} does not load the shared natural weapon catalog.`,
  );
}

console.log("Natural weapon checks passed.");
