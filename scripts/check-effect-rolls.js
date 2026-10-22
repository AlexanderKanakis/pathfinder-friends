const assert = require("assert");
const rolls = require("./effect-rolls.js");

const scale = (testAdd) => ({ testAdd });
global.PFBuffs = {
  scaledBonusValue(bonus) {
    return Number(bonus.value || 0) + Number(bonus.bonusScale?.testAdd || 0);
  },
};

const formula = rolls.calculateFormula({
  diceCount: 1,
  dieType: 6,
  diceCountScale: scale(2),
  diceCountMax: 2,
  staticValue: 3,
  staticValueScale: scale(4),
  staticValueMax: 6,
});
assert.equal(formula.diceCount, 2, "The scaled dice count must respect its maximum.");
assert.equal(formula.staticValue, 6, "The scaled static value must respect its maximum.");

const maximized = rolls.rollFormula({
  diceCount: 2,
  dieType: 8,
  staticValue: 3,
  maximizeDice: true,
  valueMultiplier: 1.5,
});
assert.deepEqual(maximized.dice, [8, 8]);
assert.equal(maximized.total, 28, "Maximize and Empower must cover the whole XdY + static result.");

const divided = rolls.rollFormula({
  diceCount: 2,
  dieType: 6,
  staticValue: 3,
  valueMultiplier: 1.5,
  valueDivisor: 2,
}, {}, () => 0.99);
assert.deepEqual(divided.dice, [6, 6]);
assert.equal(divided.subtotal, 15);
assert.equal(divided.total, 11, "Damage division must apply after dice, static damage, and metamagic multipliers, rounding down.");
assert.equal(divided.formula, "(2d6 + 3 x 1.5) / 2");

const legacyDamage = rolls.withDamageFormula(
  { label: "Damage", damageType: "fire" },
  rolls.damageFormula({
    diceCount: 2,
    dieType: 6,
    staticDamage: 4,
    staticDamageScale: scale(1),
  }),
);
assert.equal(legacyDamage.staticDamage, 4);
assert.equal(legacyDamage.staticDamageScale.testAdd, 1);

const transformed = rolls.mapEffectFormulas(
  {
    durationConfig: {
      diceCount: 1,
      dieType: 4,
      staticValue: 2,
      unit: "round",
    },
    auraConfig: {
      lingerDurationConfig: {
        diceCount: 1,
        dieType: 3,
        staticValue: 1,
        unit: "round",
      },
    },
    effects: [{ stat: "healing", value: 2, diceCount: 1, dieType: 8 }],
    applyConditions: [
      {
        conditionAdjustment: {
          mode: "apply",
          staticValue: 1,
          diceCount: 1,
          dieType: 4,
        },
      },
    ],
    damageRolls: [{ diceCount: 1, dieType: 6, staticDamage: 2, damageDenominator: 2 }],
    weaponExtraDamage: [
      {
        stat: "choice:equipped-weapons",
        diceCount: 1,
        dieType: 6,
        staticDamage: 1,
        damageType: "fire",
      },
    ],
    branches: [
      {
        effects: [{ stat: "healing", value: 1, diceCount: 1, dieType: 6 }],
      },
    ],
    generatedEquipment: [
      {
        type: "Weapon",
        name: "Generated Blade",
        details: { damage: "1d8", staticDamage: 2 },
      },
      { type: "Armor", name: "Generated Armor", details: { bonus: 4 } },
    ],
  },
  (entry) => ({ ...entry, maximizeDice: true, valueMultiplier: 1.5 }),
);
assert.equal(transformed.durationConfig.maximizeDice, true);
assert.equal(transformed.durationConfig.valueMultiplier, 1.5);
assert.equal(transformed.auraConfig.lingerDurationConfig.maximizeDice, true);
assert.equal(
  transformed.auraConfig.lingerDurationConfig.valueMultiplier,
  1.5,
);
assert.equal(transformed.effects[0].maximizeDice, true);
assert.equal(transformed.effects[0].valueMultiplier, 1.5);
assert.equal(transformed.applyConditions[0].conditionAdjustment.maximizeDice, true);
assert.equal(transformed.damageRolls[0].damageMultiplier, 1.5);
assert.equal(transformed.damageRolls[0].damageDenominator, 2);
assert.equal(transformed.weaponExtraDamage[0].maximizeDice, true);
assert.equal(transformed.weaponExtraDamage[0].damageMultiplier, 1.5);
assert.equal(transformed.branches[0].effects[0].maximizeDice, true);
assert.equal(
  transformed.generatedEquipment[0].details.maximizeDice,
  true,
  "Generated weapon damage must participate in relevant XdY transforms.",
);
assert.equal(transformed.generatedEquipment[0].details.damageMultiplier, 1.5);
assert.deepEqual(
  transformed.generatedEquipment[1],
  { type: "Armor", name: "Generated Armor", details: { bonus: 4 } },
  "Generated armor must remain outside damage transforms.",
);

const legacyWeapon = rolls.weaponFormula({ damage: "2d6+3" });
assert.equal(legacyWeapon.diceCount, 2);
assert.equal(legacyWeapon.dieType, 6);
assert.equal(legacyWeapon.staticValue, 3);
assert.equal(
  rolls.resizeWeaponDice("1d8", "large", { smallDice: "1d6", baseDice: "1d8" }),
  "2d6",
);
assert.equal(
  rolls.resizeWeaponDice("1d8", "small", { smallDice: "1d6", baseDice: "1d8" }),
  "1d6",
);

console.log("Effect roll checks passed.");
