const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const mechanics = require("./effect-mechanics.js");
const sandbox = { window: {}, console };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "buff-calculator.js"), "utf8"),
  sandbox,
  { filename: "buff-calculator.js" },
);
const buffs = sandbox.window.PFBuffs;

function scaledValue(effect, abilityScores) {
  return buffs.scaledBonusValue(effect, {}, { abilityScores });
}

const legacyDefinition = {
  bonuses: [
    {
      stat: "ac",
      value: 0,
      type: "deflection",
      bonusScale: {
        attributeBonuses: [
          { ability: "CHA", numerator: 1, denominator: 1 },
        ],
      },
    },
  ],
};

assert.strictEqual(
  mechanics.attributeScaleSource(legacyDefinition.bonuses[0].bonusScale),
  "caster",
  "Legacy scales must default to the caster.",
);

const casterSnapshot = mechanics.resolveCasterAttributeScales(legacyDefinition, {
  abilityScores: { cha: 18 },
  abilityMods: { cha: 4 },
});
const frozenEntry =
  casterSnapshot.bonuses[0].bonusScale.attributeBonuses[0];
assert.strictEqual(frozenEntry.resolvedModifier, 4);
assert.strictEqual(
  scaledValue(casterSnapshot.bonuses[0], { charisma: 6 }),
  4,
  "A caster scale must ignore the recipient's score.",
);
assert.strictEqual(
  scaledValue(casterSnapshot.bonuses[0], { charisma: 30 }),
  4,
  "A frozen caster modifier must not change after application.",
);

const laterCast = mechanics.resolveCasterAttributeScales(legacyDefinition, {
  abilityScores: { cha: 12 },
  abilityMods: { cha: 1 },
});
assert.strictEqual(
  laterCast.bonuses[0].bonusScale.attributeBonuses[0].resolvedModifier,
  1,
  "A later activation must take a fresh caster snapshot.",
);
assert.strictEqual(
  frozenEntry.resolvedModifier,
  4,
  "Taking a later snapshot must not mutate an already-applied effect.",
);

const recipientDefinition = JSON.parse(JSON.stringify(legacyDefinition));
recipientDefinition.bonuses[0].bonusScale.attributeSource = "recipient";
const recipientEffect = mechanics.resolveCasterAttributeScales(
  recipientDefinition,
  { abilityMods: { cha: 4 } },
);
const recipientEntry =
  recipientEffect.bonuses[0].bonusScale.attributeBonuses[0];
assert.strictEqual(recipientEntry.resolvedModifier, undefined);
assert.strictEqual(
  scaledValue(recipientEffect.bonuses[0], { charisma: 12 }),
  1,
);
assert.strictEqual(
  scaledValue(recipientEffect.bonuses[0], { charisma: 20 }),
  5,
  "Recipient scales must continue to follow the recipient's current score.",
);

const editorSource = fs.readFileSync(
  path.join(__dirname, "effect-editor.js"),
  "utf8",
);
assert(editorSource.includes("Attribute Modifier From"));
assert(editorSource.includes("Caster at cast / activation"));
assert(editorSource.includes('<option value="recipient">Recipient</option>'));

console.log("Attribute scale source checks passed.");
