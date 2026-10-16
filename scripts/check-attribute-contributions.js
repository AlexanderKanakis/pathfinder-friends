const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
global.window = {};
require(path.join(rootDir, "scripts", "effect-stat-options.js"));
global.PFEffectStats = global.window.PFEffectStats;
const mechanics = require(path.join(rootDir, "scripts", "effect-mechanics.js"));
require(path.join(rootDir, "scripts", "buff-calculator.js"));

const abilityMods = {
  str: 4,
  dex: 3,
  con: 2,
  int: 6,
  wis: 1,
  cha: -1,
};

function resolve(attributeContributions, stat, baseAbilities, context = {}) {
  return mechanics.resolveAttributeContributions({
    effects: [{ name: "Test Effect", attributeContributions }],
    stat,
    baseAbilities,
    abilityMods,
    context,
  });
}

assert(
  mechanics.extraKeys().includes("attributeContributions"),
  "Attribute contributions must be a shared extra mechanic.",
);

assert.strictEqual(
  resolve([{ mode: "add", ability: "int", stat: "skill:diplomacy" }], "skill:diplomacy", ["cha"], {
    skillAbility: "cha",
  }).total,
  5,
  "Adding INT to Diplomacy must retain CHA and add INT.",
);

const replacement = resolve(
  [{ mode: "replace", ability: "int", stat: "skill:diplomacy" }],
  "skill:diplomacy",
  ["cha"],
  { skillAbility: "cha" },
);
assert.strictEqual(replacement.total, 6, "Replacing Diplomacy's attribute must use INT only.");
assert.strictEqual(replacement.replaced, true, "Replacement must be reported to the UI.");

assert.strictEqual(
  resolve(
    [
      { mode: "replace", ability: "int", stat: "skill:diplomacy" },
      { mode: "replace", ability: "wis", stat: "skill:diplomacy" },
      { mode: "add", ability: "str", stat: "skill:diplomacy" },
    ],
    "skill:diplomacy",
    ["cha"],
    { skillAbility: "cha" },
  ).total,
  11,
  "Any number of replacement and additive attributes must stack on the selected stat.",
);

assert.strictEqual(
  resolve([{ mode: "add", ability: "cha", stat: "group:saving-throws" }], "will", ["wis"]).total,
  0,
  "Saving-throw groups must apply to each save.",
);
assert.strictEqual(
  resolve([{ mode: "add", ability: "int", stat: "group:skills-cha" }], "skill:diplomacy", ["cha"], {
    skillAbility: "cha",
  }).total,
  5,
  "Ability-based skill groups must match the skill's normal attribute.",
);
assert.strictEqual(
  resolve([{ mode: "add", ability: "int", stat: "group:skills-cha" }], "skill:spellcraft", ["int"], {
    skillAbility: "int",
  }).total,
  6,
  "Ability-based skill groups must not affect skills from another group.",
);

const weaponEffect = [
  {
    mode: "replace",
    ability: "dex",
    stat: "attack",
    weaponType: "melee-light",
    weaponName: "Dagger",
  },
];
assert.strictEqual(
  resolve(weaponEffect, "attack", ["str"], {
    weaponType: "Melee Weapon (Light)",
    weaponName: "Dagger",
  }).total,
  3,
  "A matching weapon must use its replacement attack attribute.",
);
assert.strictEqual(
  resolve(weaponEffect, "attack", ["str"], {
    weaponType: "Melee Weapon (One-Handed)",
    weaponName: "Longsword",
  }).total,
  4,
  "Weapon restrictions must leave nonmatching weapons unchanged.",
);

const calculated = global.window.PFBuffs.calculateStatsDetailed(
  [
    {
      name: "Clever Defense",
      attributeContributions: [
        { mode: "replace", ability: "int", stat: "reflex" },
      ],
    },
  ],
  {
    str: 10,
    dex: 12,
    con: 10,
    int: 18,
    wis: 10,
    cha: 10,
    reflexBase: 2,
    characterLevel: 1,
    skillRanks: {},
  },
);
assert.strictEqual(
  calculated.totals.reflex,
  6,
  "Detailed stat calculation must resolve attribute contributions through the browser global.",
);

const editorSource = fs.readFileSync(
  path.join(rootDir, "scripts", "effect-editor.js"),
  "utf8",
);
[
  "All Attribute-Derived Stats",
  "All Weapon Attack and Damage Rolls",
  "Any Attribute-Derived Stat",
  "Any Skill",
  "Weapon Type",
  "Weapon Name",
].forEach((label) => {
  assert(editorSource.includes(label), `Effect editor is missing ${label}.`);
});

console.log("Attribute contribution checks passed.");
