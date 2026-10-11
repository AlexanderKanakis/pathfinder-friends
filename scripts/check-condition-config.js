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
assert.equal(config.usesTurns(damage), true);
assert.equal(config.usesTurns(drain), true);
assert.equal(config.usesTurns(negative), true);
assert.equal(damage.adjustableCondition.label, "Value");
assert.equal(drain.adjustableCondition.label, "Value");
assert.equal(negative.adjustableCondition.label, "Value");

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
assert(!tracker.includes("data-picker-permanent"));
assert(!tracker.includes("data-active-turns"));
assert(tracker.includes(">Apply Effect</button>"));
assert(tracker.includes("PFConditionConfig.configure"));
assert(tracker.includes("PFConditionConfig.updateAmount"));
assert(
  tracker.indexOf("data-picker-condition-ability") <
    tracker.indexOf("data-picker-condition-amount") &&
    tracker.indexOf("data-picker-condition-amount") <
      tracker.indexOf("data-picker-turns"),
);
assert(calculator.includes('totals["current hit points"]'));
assert(calculator.includes('bonuses["current hit points"]'));

console.log("Condition configuration checks passed.");
