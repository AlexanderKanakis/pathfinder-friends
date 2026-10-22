const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.PFBuffs = {
  scaledBonusValue(entry) {
    return Number(entry.value || 0) + Number(entry.bonusScale?.testIncrease || 0);
  },
};
require("./damage-rolls.js");
require("./effect-mechanics.js");
const attacks = require("./attack-rolls.js");

const context = {
  bab: 6,
  abilityMods: { str: 4, dex: 2 },
  castingAbility: "wis",
  castingAbilityMod: 5,
  casterLevel: 7,
  characterLevel: 7,
};

assert.equal(
  attacks.calculateAttack({ attackType: "melee" }, context).attackBonus,
  10,
  "Melee attacks must use BAB + STR.",
);
assert.equal(
  attacks.calculateAttack({ attackType: "ranged-touch" }, context).attackBonus,
  8,
  "Ranged touch attacks must use BAB + DEX.",
);
assert.equal(
  attacks.calculateAttack(
    { attackType: "melee" },
    { bab: 3, abilityMods: { STR: 5 } },
  ).attackBonus,
  8,
  "Class-feature contexts with uppercase ability keys must roll correctly.",
);
assert.equal(
  attacks.calculateAttack(
    {
      attackType: "melee",
      originalBabScale: { testIncrease: 2 },
    },
    context,
  ).attackBonus,
  12,
  "A scaled original BAB must use the caster's BAB as its base.",
);
assert.equal(
  attacks.calculateAttack(
    {
      attackType: "melee-touch",
      customBab: 3,
      customBabScale: { testIncrease: 2 },
      originalBabScale: { testIncrease: 20 },
    },
    context,
  ).attackBonus,
  9,
  "A scaled custom BAB must replace caster BAB and its scale.",
);
assert.equal(
  attacks.calculateAttack(
    { attackType: "melee", attackAbility: "casting" },
    context,
  ).attackBonus,
  11,
  "Attacks may use the caster's key spellcasting ability modifier.",
);
const trip = attacks.calculateAttack(
  { attackType: "cmb-trip", attackAbility: "casting" },
  context,
);
assert.equal(
  trip.attackBonus,
  11,
  "Combat maneuvers may use BAB plus the key spellcasting ability modifier.",
);
assert.equal(trip.rollKind, "cmb", "Trip must be treated as a CMB check.");
const conditionalAttack = attacks.calculateAttack(
  { attackType: "melee-touch", conditionals: [{ source: "Authored", value: 1 }] },
  {
    ...context,
    attackConditionals: [{ source: "All attacks", value: 2 }],
    attackConditionalsByType: {
      "melee-touch": [{ source: "Touch attacks", value: 3 }],
    },
  },
);
assert.deepEqual(
  conditionalAttack.conditionals.map((entry) => entry.value),
  [2, 3, 1],
  "Effect attacks must expose general, attack-type, and authored conditionals.",
);
assert.equal(
  attacks.calculateAttack(
    {
      attackType: "melee",
      customBab: 0,
      customBabScale: null,
      originalBabScale: { testIncrease: 2 },
    },
    context,
  ).attackBonus,
  12,
  "An unscaled stored zero must not replace the caster's original BAB.",
);
assert.equal(
  attacks.calculateAttack(
    { attackCount: 1, attackCountScale: { testIncrease: 2 } },
    context,
  ).count,
  3,
  "Attack count scaling must determine how many d20s are rolled.",
);
assert.equal(
  attacks.calculateAttack(
    {
      attackCount: 1,
      attackCountScale: { testIncrease: 5 },
      attackCountMax: 4,
    },
    context,
  ).count,
  4,
  "Maximum attacks must cap the final scaled attack count.",
);

const rolled = attacks.rollAttacks(
  [{ label: "Ray", attackCount: 2, attackType: "ranged-touch" }],
  context,
  () => 0.45,
);
assert.equal(rolled.length, 2, "Every configured attack must roll once.");
assert.equal(rolled[0].die, 10, "The d20 result must use the supplied RNG.");

const singleRoll = attacks.rollAttacks(
  [{ label: "Touch", attackCount: 1, attackType: "melee-touch" }],
  context,
  () => 0.45,
);
assert.equal(singleRoll.length, 1, "A single configured attack must produce one result.");
assert.equal(
  attacks.conditionalLabel({
    source: "Feat: Example",
    appliesWhen: "against incorporeal creatures",
  }),
  "against incorporeal creatures",
  "Attack conditionals must describe their condition rather than their origin.",
);

rolled[0].hit = true;
const resolved = attacks.payloadForSuccessfulAttacks(
  {
    attackRolls: [
      {
        label: "Ray",
        effects: [{ stat: "ac", value: -1 }],
        damageRolls: [{ diceCount: 1, dieType: 6 }],
      },
    ],
  },
  rolled.map((result) => ({
    ...result,
    attack: {
      ...result.attack,
      effects: [{ stat: "ac", value: -1 }],
      damageRolls: [{ diceCount: 1, dieType: 6 }],
    },
  })),
);
assert.equal(resolved.attackRolls, undefined, "Attack definitions must not persist as active effects.");
assert.equal(resolved.effects.length, 1, "Only successful attacks contribute effects.");
assert.equal(resolved.damageRolls.length, 1, "Only successful attacks contribute damage.");

const root = path.resolve(__dirname, "..");
const editor = fs.readFileSync(path.join(root, "scripts/effect-editor.js"), "utf8");
const attackRoller = fs.readFileSync(path.join(root, "scripts/attack-rolls.js"), "utf8");
const mapPage = fs.readFileSync(path.join(root, "scripts/pages/map.js"), "utf8");
assert(
  attackRoller.includes("singleAttack ||"),
  "A lone attack must continue without a redundant hit toggle.",
);
assert(
  mapPage.includes(
    "if (effectAttackRolls(effect).length || effectDamageRolls(effect).length)",
  ),
  "Map targeting must retain effects whose only mechanics are attacks or damage.",
);
assert(
  mapPage.includes("const label = rollConditionalLabel(entry);"),
  "Map d20 conditionals must use condition-first labels.",
);
assert(
  mapPage.includes("{ preserveRolls: true }"),
  "Map targeting must carry attack and damage definitions into the roll nodes.",
);
assert(editor.includes("Add Attack"), "Shared effect authoring must expose attacks.");
assert(
  editor.includes("Scale Original BAB"),
  "Attack authoring must expose original BAB scaling.",
);
assert(
  editor.includes("Maximum Attacks"),
  "Attack authoring must expose a maximum attack count.",
);
assert(editor.includes("Casting Modifier"), "Attack authoring must expose the casting modifier.");
assert(editor.includes('value="cmb-trip"'), "Attack authoring must expose Trip maneuvers.");
assert(editor.includes("allowAttackRolls: false"), "Nested attack payloads must not recurse.");
for (const file of ["character-sheet.html", "map.html"]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  assert(html.includes("scripts/attack-rolls.js"), `${file} must load the shared attack roller.`);
}

console.log("Attack roll checks passed.");
