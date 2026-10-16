const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {
  console,
  window: {},
  globalThis: {},
};
context.globalThis = context.window;
vm.createContext(context);
vm.runInContext(
  fs.readFileSync("scripts/effect-mechanics.js", "utf8"),
  context,
);
vm.runInContext(
  fs.readFileSync("scripts/buff-calculator.js", "utf8"),
  context,
);
context.window.PFClassData = { featurePools: () => [] };
context.window.PFEffectMeta = { durationLabel: () => "variable" };
vm.runInContext(
  fs.readFileSync("scripts/class-feature-abilities.js", "utf8"),
  context,
);

const scale = {
  attributeSource: "caster",
  attributeBonuses: [
    { ability: "CASTING", numerator: 1, denominator: 1 },
  ],
};
const effect = {
  bonuses: [
    {
      stat: "attack",
      value: 1,
      bonusScale: scale,
    },
  ],
};
const casterContext = {
  castingAbility: "INT",
  castingAbilityMod: 5,
  abilityMods: { int: 5, wis: 2 },
};
const resolved = context.window.PFEffectMechanics.resolveCasterAttributeScales(
  effect,
  casterContext,
);

assert.equal(
  resolved.bonuses[0].bonusScale.attributeBonuses[0].resolvedModifier,
  5,
);
assert.equal(
  context.window.PFBuffs.scaledBonusValue(
    effect.bonuses[0],
    {},
    casterContext,
  ),
  6,
);

const recipientScale = {
  bonuses: [
    {
      stat: "attack",
      value: 0,
      bonusScale: {
        ...scale,
        attributeSource: "recipient",
      },
    },
  ],
};
const resolvedRecipientScale =
  context.window.PFEffectMechanics.resolveCasterAttributeScales(
    recipientScale,
    casterContext,
  );
assert.equal(
  resolvedRecipientScale.bonuses[0].bonusScale.attributeBonuses[0]
    .resolvedModifier,
  5,
  "Casting Modifier always comes from the caster's casting class",
);

const classDefinitions = [
  {
    name: "Wizard",
    spellcasting: { ability: "INT" },
    levelProgression: [
      {
        level: 1,
        classFeatures: [
          {
            name: "Arcane Feature",
            activatable: true,
            activeMechanics: { effects: effect.bonuses },
          },
        ],
      },
    ],
  },
  {
    name: "Cleric",
    spellcasting: { ability: "WIS" },
    levelProgression: [
      {
        level: 1,
        classFeatures: [
          {
            name: "Divine Feature",
            activatable: true,
            activeMechanics: { effects: effect.bonuses },
          },
        ],
      },
    ],
  },
];
const abilities =
  context.window.PFClassFeatureAbilities.collectActivatableAbilities({
    classDefinitions,
    classProgression: [
      { level: 1, className: "Wizard" },
      { level: 2, className: "Cleric" },
    ],
    characterLevel: 2,
    abilityScores: { int: 18, wis: 16 },
  });
const wizard = abilities.find((entry) => entry.name === "Arcane Feature");
const cleric = abilities.find((entry) => entry.name === "Divine Feature");
assert.equal(wizard.abilityContext.castingAbility, "INT");
assert.equal(wizard.abilityContext.castingAbilityMod, 4);
assert.equal(cleric.abilityContext.castingAbility, "WIS");
assert.equal(cleric.abilityContext.castingAbilityMod, 3);

console.log("Casting modifier scale checks passed.");
