const assert = require("assert");
const fs = require("fs");

global.window = global;
require("./buff-calculator.js");
const damage = require("./damage-rolls.js");
const damageSource = fs.readFileSync(require.resolve("./damage-rolls.js"), "utf8");
const damageCss = fs.readFileSync(
  require.resolve("../css/damage-rolls.css"),
  "utf8",
);

const casterScale = (numerator, denominator) => ({
  source: { type: "caster" },
  levelMultiplier: { numerator, denominator },
});

const searingLight = {
  label: "Searing Light",
  diceCount: 0,
  dieType: 8,
  diceCountMax: 5,
  diceCountScale: casterScale(1, 2),
  damageType: "light",
  conditionals: [
    {
      label: "Undead",
      appliesWhen: "Target is undead",
      diceCount: 0,
      dieType: 6,
      diceCountMax: 10,
      diceCountScale: casterScale(1, 1),
      damageType: "light",
    },
    {
      label: "Undead vulnerable to bright light",
      appliesWhen: "Target is undead and vulnerable to bright light",
      diceCount: 0,
      dieType: 8,
      diceCountMax: 10,
      diceCountScale: casterScale(1, 1),
      damageType: "light",
    },
    {
      label: "Construct or inanimate object",
      appliesWhen: "Target is a construct or inanimate object",
      diceCount: 0,
      dieType: 6,
      diceCountMax: 5,
      diceCountScale: casterScale(1, 2),
      damageType: "light",
    },
  ],
};

assert.deepStrictEqual(
  damage.calculateRoll(searingLight, { casterLevel: 9 }),
  {
    label: "Searing Light",
    profileLabel: "Standard",
    appliesWhen: "",
    diceCount: 4,
    dieType: 8,
    staticDamage: 0,
    damageType: "light",
    formula: "4d8",
  },
);
assert.strictEqual(
  damage.calculateRoll(searingLight, { casterLevel: 9 }, 0).formula,
  "9d6",
);
assert.strictEqual(
  damage.calculateRoll(searingLight, { casterLevel: 12 }, 1).formula,
  "10d8",
);
assert.strictEqual(
  damage.calculateRoll(searingLight, { casterLevel: 12 }, 2).formula,
  "5d6",
);

const staticScaled = damage.calculateRoll(
  {
    label: "Static",
    dieType: 6,
    staticDamage: 2,
    staticDamageMax: 8,
    staticDamageScale: casterScale(1, 1),
  },
  { casterLevel: 20 },
);
assert.strictEqual(staticScaled.staticDamage, 8);
assert.strictEqual(staticScaled.diceCount, 0);
assert.strictEqual(staticScaled.formula, "8");
const staticResult = damage.rollCalculated(staticScaled, () => {
  throw new Error("Static damage must not roll dice.");
});
assert.deepStrictEqual(staticResult.dice, []);
assert.strictEqual(staticResult.total, 8);

assert.strictEqual(damage.normalizeRolls([searingLight, staticScaled]).length, 2);
assert.strictEqual(damage.requiresProfileChoice([searingLight]), true);
assert.strictEqual(damage.requiresProfileChoice([staticScaled]), false);
const rolled = damage.rollCalculated(
  damage.calculateRoll(searingLight, { casterLevel: 2 }),
  () => 0,
);
assert.deepStrictEqual(rolled.dice, [1]);
assert.strictEqual(rolled.total, 1);
assert(!damageSource.includes("btn-close"), "Damage modal must not have a header close button.");
assert(!damageSource.includes("Damage profile"), "Damage profile select must not have a redundant label.");
assert(
  !damageSource.includes("Use the spell or ability's standard damage."),
  "Damage modal must not include redundant standard-damage guidance.",
);
assert(
  damageSource.includes("setInterval(") && damageSource.includes("}, 1000)"),
  "Damage results must use the shared one-second rolling animation.",
);
assert(
  damageSource.includes("!rolledResults.some((result) => result.dice.length > 0)"),
  "Static-only damage must bypass the rolling animation delay.",
);
assert(
  damageSource.includes("if (!needsProfileChoice) runDamageRoll();"),
  "Standard-only damage must bypass the profile-choice step.",
);
assert.strictEqual(
  (damageSource.match(/function rollingHtml\(results\)/g) || []).length,
  1,
  "Damage runtime must have one centralized rolling renderer.",
);
assert(
  damageSource.includes("damage-roll-die-value") &&
    damageSource.includes("damage-roll-total-row"),
  "Damage results must use the established attack-roll hierarchy.",
);
assert(
  !damageCss.includes("grid-template-columns") &&
    !damageCss.includes("background: #222"),
  "Damage content must remain full-width and unframed.",
);

const characterSheet = fs.readFileSync(
  require.resolve("./pages/character-sheet.js"),
  "utf8",
);
const castStart = characterSheet.indexOf("async function castSpellFromDetails");
const castBody = characterSheet.slice(
  castStart,
  characterSheet.indexOf("function spellExtraSlots", castStart),
);
assert(
  castBody.indexOf("await rollSpellDamageFromDetails") <
    castBody.indexOf("await openSpellCastTargetModal"),
  "Spell damage must finish before target-effect selection opens.",
);
assert(
  characterSheet.includes('keys.filter((key) => key !== "damageRolls")'),
  "Damage rolls must not be copied into target-applied spell effects.",
);

const tracker = fs.readFileSync(
  require.resolve("./buff-tracker-widget.js"),
  "utf8",
);
assert(
  tracker.includes("async resolveDamageRolls(effect, casterLevel") &&
    tracker.includes("window.PFDamageRolls?.open?.") &&
    tracker.includes("delete next.damageRolls"),
  "The shared effect browser must roll authored damage and keep it out of saved buffs.",
);
assert(
  tracker.indexOf("PFEffectMechanics.chooseBranch") <
    tracker.lastIndexOf("this.resolveDamageRolls("),
  "Local branch damage must be selected before it is rolled.",
);

const map = fs.readFileSync(require.resolve("./pages/map.js"), "utf8");
const quickStart = map.indexOf("async function chooseQuickEffect");
const quickBody = map.slice(
  quickStart,
  map.indexOf("function renderOwnedSpellEffects", quickStart),
);
assert(
  quickBody.indexOf("await rollQuickEffectDamage") <
    quickBody.indexOf("openQuickEffectTargets"),
  "Map damage must finish before target-effect selection opens.",
);
assert(
  map.includes("damageRolls,") && map.includes('key !== "damageRolls"'),
  "Map-applied effects must strip damage definitions from saved buffs.",
);
assert(
  map.includes("onDamageRolled: async (effect, results)") &&
    map.includes("window.PFDamageRolls.summary(results)"),
  "Damage cast through the map's shared browser must be recorded in the timeline.",
);

const spellPicker = fs.readFileSync(
  require.resolve("../modals/spell-picker.js"),
  "utf8",
);
assert(!spellPicker.includes('max="${escapeHtml(options.max || total)}"'));
assert(spellPicker.includes("misc upcast"));

console.log("Damage roll checks passed.");
