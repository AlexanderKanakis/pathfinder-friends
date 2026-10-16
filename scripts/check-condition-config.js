const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const conditions = JSON.parse(
  fs.readFileSync(path.join(rootDir, "data", "conditions.json"), "utf8"),
);
const config = require("./condition-config.js");

const byId = new Map(conditions.map((condition) => [condition.id, condition]));
const damage = byId.get("condition-ability-damage");
const drain = byId.get("condition-ability-drain");
const negative = byId.get("condition-negative-level");
assert(damage && drain && negative, "The three adjustable conditions must exist.");
assert.equal(config.usesTurns(damage), false);
assert.equal(config.usesTurns(drain), false);
assert.equal(config.usesTurns(negative), false);
assert.equal(damage.adjustableCondition.label, "Value");
assert.equal(drain.adjustableCondition.label, "Value");
assert.equal(negative.adjustableCondition.label, "Value");
assert.deepEqual(config.ABILITIES.slice(-4), [
  ["all-physical", "All physical"],
  ["all-mental", "All mental"],
  ["all", "All"],
  ["player-chooses", "Player chooses"],
]);

const configuredDrain = config.configure(drain, {
  ability: "wisdom",
  amount: 4,
});
assert.equal(configuredDrain.adjustableCondition.stat, "wisdom");
assert.equal(configuredDrain.adjustableCondition.amount, 4);
assert.equal(configuredDrain.adjustableCondition.label, "Value");
assert.deepEqual(
  configuredDrain.bonuses.find((bonus) => bonus.type === "ability drain"),
  { stat: "wisdom", value: -4, type: "ability drain", stacks: true },
);

const physicalDamage = config.configure(damage, {
  ability: "all-physical",
  amount: 2,
});
assert.deepEqual(
  physicalDamage.bonuses
    .filter((bonus) => bonus.type === "ability damage")
    .map((bonus) => bonus.stat),
  ["strength", "dexterity", "constitution"],
);
const mentalDrain = config.configure(drain, {
  ability: "all-mental",
  amount: 2,
});
assert.deepEqual(
  mentalDrain.bonuses
    .filter((bonus) => bonus.type === "ability drain")
    .map((bonus) => bonus.stat),
  ["intelligence", "wisdom", "charisma"],
);
const allDamage = config.configure(damage, {
  ability: "all",
  amount: 1,
});
assert.equal(
  allDamage.bonuses.filter((bonus) => bonus.type === "ability damage").length,
  6,
);
const pendingDamage = config.configure(damage, {
  ability: "player-chooses",
  amount: 3,
});
assert.equal(
  pendingDamage.bonuses.some((bonus) => bonus.type === "ability damage"),
  false,
);
assert.equal(config.hasPendingAbilityChoice(pendingDamage), true);

const configuredNegative = config.configure(negative, { amount: 3 });
assert.equal(configuredNegative.adjustableCondition.label, "Value");
const negativeValues = Object.fromEntries(
  configuredNegative.bonuses
    .filter((bonus) => bonus.negativeLevelPenalty)
    .map((bonus) => [bonus.stat, bonus.value]),
);
assert.equal(negativeValues["ability checks"], -3);
assert.equal(negativeValues["melee attack"], -3);
assert.equal(negativeValues["ranged attack"], -3);
assert.equal(negativeValues.cmb, -3);
assert.equal(negativeValues.cmd, -3);
assert.equal(negativeValues.fortitude, undefined);
assert.equal(negativeValues["all saves"], -3);
assert.equal(negativeValues["skill checks"], -3);
assert.equal(negativeValues["hit points"], -15);
assert.equal(negativeValues["current hit points"], -15);

const randomDamageEntry = {
  conditionId: damage.id,
  name: damage.name,
  condition: damage,
  conditionAdjustment: {
    mode: "apply",
    ability: "dexterity",
    staticValue: 2,
    diceCount: 1,
    dieType: 6,
    resolvedAmount: 5,
  },
};
const configuredDamage = config.configuredCondition(randomDamageEntry);
assert.deepEqual(
  configuredDamage.bonuses.find((bonus) => bonus.type === "ability damage"),
  { stat: "dexterity", value: -5, type: "ability damage", stacks: true },
);

const restoration = config.applyRestorations(
  [configuredDrain],
  {
    applyConditions: [
      {
        conditionId: drain.id,
        name: drain.name,
        condition: drain,
        conditionAdjustment: {
          mode: "heal",
          ability: "wisdom",
          staticValue: 2,
          diceCount: 0,
          dieType: 6,
          resolvedAmount: 2,
        },
      },
    ],
  },
);
assert.equal(restoration.changed, true);
assert.equal(restoration.activeEffects.length, 1);
assert.equal(restoration.activeEffects[0].adjustableCondition.amount, 2);
assert.equal(restoration.effect.applyConditions.length, 0);

const nestedDamage = {
  name: "Poison",
  category: "Spell",
  applyConditions: [randomDamageEntry],
};
const nestedRestoration = config.applyRestorations(
  [nestedDamage],
  {
    applyConditions: [
      {
        condition: damage,
        conditionAdjustment: {
          mode: "heal",
          ability: "dexterity",
          staticValue: 3,
          diceCount: 0,
          dieType: 6,
          resolvedAmount: 3,
        },
      },
    ],
  },
);
assert.equal(nestedRestoration.activeEffects.length, 1);
assert.equal(
  nestedRestoration.activeEffects[0].applyConditions[0].conditionAdjustment
    .resolvedAmount,
  2,
);
assert.equal(
  config
    .configuredCondition(nestedRestoration.activeEffects[0].applyConditions[0])
    .adjustableCondition.amount,
  2,
);

const removedNegativeLevels = config.applyRestorations(
  [configuredNegative],
  {
    applyConditions: [
      {
        condition: negative,
        conditionAdjustment: {
          mode: "heal",
          staticValue: 3,
          diceCount: 0,
          dieType: 6,
          resolvedAmount: 3,
        },
      },
    ],
  },
);
assert.equal(removedNegativeLevels.changed, true);
assert.equal(removedNegativeLevels.activeEffects.length, 0);
assert.equal(removedNegativeLevels.effect.applyConditions.length, 0);

global.window = global;
require("./buff-calculator.js");
const calculation = global.PFBuffs.calculateStatsDetailed(
  [configuredNegative],
  {
    str: 16,
    dex: 14,
    con: 12,
    int: 10,
    wis: 8,
    cha: 10,
    bab: 5,
    fortBase: 4,
    reflexBase: 1,
    willBase: 1,
    hitPoints: 50,
    currentHitPoints: 37,
    hitDice: 5,
    sizeAc: 0,
    sizeCombat: 0,
    cmbMisc: 0,
    cmdMisc: 0,
  },
);
assert.equal(calculation.totals["ability checks"], -3);
assert.equal(calculation.totals["melee attack"], 5);
assert.equal(calculation.totals["ranged attack"], 4);
assert.equal(calculation.totals.cmb, 5);
assert.equal(calculation.totals.cmd, 17);
assert.equal(calculation.totals.fortitude, 2);
assert.equal(calculation.totals.reflex, 0);
assert.equal(calculation.totals.will, -3);
assert.equal(calculation.totals["skill checks"], -3);
assert.equal(calculation.totals["hit points"], 35);
assert.equal(calculation.totals["current hit points"], 22);

const tracker = fs.readFileSync(
  path.join(rootDir, "scripts", "buff-tracker-widget.js"),
  "utf8",
);
const calculator = fs.readFileSync(
  path.join(rootDir, "scripts", "buff-calculator.js"),
  "utf8",
);
const map = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "map.js"),
  "utf8",
);
const characterSheet = fs.readFileSync(
  path.join(rootDir, "scripts", "pages", "character-sheet.js"),
  "utf8",
);
assert(!tracker.includes("data-picker-permanent"));
assert(!tracker.includes("data-active-turns"));
assert(tracker.includes(">Use Powers</button>"));
assert(tracker.includes("PFConditionConfig.configure"));
assert(tracker.includes("PFConditionConfig.updateAmount"));
assert(tracker.includes("PFConditionConfig?.applyRestorations"));
assert(tracker.includes("async resolveActivationDecisions"));
assert(tracker.includes("PFConditionConfig?.resolveAbilityChoices"));
assert(tracker.includes("if (!hasPersistentEffectMechanics(finalizedEffect))"));
assert(map.includes("resolveAbilityChoices"));
assert(map.includes("hasPendingAbilityChoice"));
assert(characterSheet.includes("playerAbilityChoiceNeeded"));
assert(characterSheet.includes("deferAbilityChoice: true"));
const editor = fs.readFileSync(
  path.join(rootDir, "scripts", "effect-editor.js"),
  "utf8",
);
assert(editor.includes('data-condition-adjustment-field="mode"'));
assert(editor.includes('data-condition-adjustment-field="staticValue"'));
assert(editor.includes('data-condition-adjustment-field="diceCount"'));
assert(editor.includes('data-condition-adjustment-field="dieType"'));
assert(editor.includes('data-condition-adjustment-field="diceCountMax"'));
assert(editor.includes('data-condition-adjustment-field="staticValueMax"'));
assert(editor.includes('data-condition-scale-host="dice"'));
assert(editor.includes('data-condition-scale-host="static"'));
assert(
  tracker.indexOf("data-picker-condition-ability") <
    tracker.indexOf("data-picker-condition-amount") &&
    tracker.indexOf("data-picker-condition-amount") <
      tracker.indexOf("data-picker-turns"),
);
assert(calculator.includes('totals["current hit points"]'));
assert(calculator.includes('bonuses["current hit points"]'));

config
  .resolveAbilityChoices(pendingDamage, {
    title: "Test",
    pick: async () => "charisma",
  })
  .then((resolved) => {
    assert.equal(config.hasPendingAbilityChoice(resolved), false);
    assert.deepEqual(
      resolved.bonuses.find((bonus) => bonus.type === "ability damage"),
      {
        stat: "charisma",
        value: -3,
        type: "ability damage",
        stacks: true,
      },
    );
    console.log("Condition configuration checks passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
