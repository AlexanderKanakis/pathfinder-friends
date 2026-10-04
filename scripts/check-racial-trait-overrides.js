const assert = require("node:assert/strict");

global.window = {
  PFEffectMechanics: require("./effect-mechanics.js"),
};
require("./race-data.js");

const { applyModifiedTraitOverride, normalizeRaceData } = window.PFRaceData;

const mixedTrait = {
  name: "Mixed Trait",
  effects: [{ stat: "ac", value: 1 }],
  activeMechanics: {
    effects: [{ stat: "attack", value: 2 }],
    spellResistance: [{ amount: 6 }],
    durationConfig: { count: 3, unit: "rounds" },
  },
};
const override = {
  trait: "Mixed Trait",
  mechanicOverrides: {
    effects: [{ action: "remove", targetIndex: 0 }],
  },
  activeMechanicOverrides: {
    effects: [
      {
        action: "replace",
        targetIndex: 0,
        value: { stat: "attack", value: 4 },
      },
    ],
    spellResistance: [{ action: "remove", targetIndex: 0 }],
    damageReduction: [
      { action: "add", value: { amount: 5, overcomeType: "silver" } },
    ],
  },
  activeDurationConfig: { count: 5, unit: "rounds" },
};
const applied = applyModifiedTraitOverride(mixedTrait, override);

assert.deepEqual(applied.effects, []);
assert.deepEqual(applied.activeMechanics.effects, [
  { stat: "attack", value: 4 },
]);
assert.deepEqual(applied.activeMechanics.spellResistance, []);
assert.deepEqual(applied.activeMechanics.damageReduction, [
  { amount: 5, overcomeType: "silver" },
]);
assert.deepEqual(applied.activeMechanics.durationConfig, {
  count: 5,
  unit: "rounds",
});
assert.deepEqual(mixedTrait.effects, [{ stat: "ac", value: 1 }]);
assert.equal(mixedTrait.activeMechanics.effects[0].value, 2);

const normalized = normalizeRaceData({
  races: [
    {
      name: "Legacy Race",
      standardTraits: [
        {
          name: "Legacy Active",
          activatable: true,
          effects: [{ stat: "damage", value: 2 }],
          durationConfig: { count: 1, unit: "rounds" },
        },
      ],
      alternateTraits: [
        {
          name: "Legacy Modifier",
          modifies: ["Legacy Active"],
          modifiedTraitOverrides: [
            {
              trait: "Legacy Active",
              mechanicOverrides: {
                effects: [
                  {
                    action: "replace",
                    targetIndex: 0,
                    value: { stat: "damage", value: 4 },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
});
const legacyOverride =
  normalized.races[0].alternateTraits[0].modifiedTraitOverrides[0];
assert.equal(legacyOverride.mechanicOverrides.effects, undefined);
assert.equal(legacyOverride.activeMechanicOverrides.effects.length, 1);
assert.equal(legacyOverride.activeMechanicOverrides.effects[0].value.value, 4);

console.log("Racial trait Passive/Active override checks passed.");
