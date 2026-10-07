const assert = require("assert");

global.window = global;
require("./buff-calculator.js");

const { applyBonuses, calculateStatsDetailed } = global.PFBuffs;

function bonus(source, value, type, options = {}) {
  return { source, value, type, ...options };
}

function conditional(source, value, type, options = {}) {
  return bonus(source, value, type, {
    conditional: true,
    appliesWhen: "vs undead",
    ...options,
  });
}

{
  const result = applyBonuses([
    bonus("Bless", 2, "morale"),
    conditional("Greater courage", 2, "morale"),
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.conditional[0].value, 0);
  assert.equal(result.conditional[0].originalValue, 2);
  assert.equal(result.conditional[0].overwritten, true);
  assert.match(result.conditional[0].detail, /overwritten by Bless \+2/);
}

{
  const result = applyBonuses([
    bonus("Bless", 2, "morale"),
    conditional("Greater courage", 5, "morale"),
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.conditional[0].value, 3);
  assert.equal(result.conditional[0].originalValue, 5);
  assert.equal(result.conditional[0].partiallyOverwritten, true);
  assert.match(result.conditional[0].detail, /only the \+3 difference applies/);
}

{
  const result = applyBonuses([
    bonus("Insight", 4, "insight"),
    conditional("Lesser insight", 1, "insight"),
  ]);
  assert.equal(result.conditional[0].value, 0);
  assert.match(result.conditional[0].detail, /overwritten by Insight \+4/);
}

{
  const result = applyBonuses([
    bonus("Training", 2, "untyped"),
    conditional("Situational training", 4, "untyped"),
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.conditional[0].value, 4);
  assert.equal(result.conditional[0].overwritten, undefined);
}

{
  const result = applyBonuses([
    bonus("Stacking morale", 2, "morale", { stacks: true }),
    conditional("Conditional morale", 4, "morale"),
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.conditional[0].value, 4);
}

{
  const result = applyBonuses([
    bonus("Zero placeholder", 0, "morale"),
    conditional("Conditional morale", 4, "morale"),
  ]);
  assert.equal(result.conditional[0].value, 4);
  assert.equal(result.conditional[0].partiallyOverwritten, undefined);
}

{
  const result = applyBonuses([
    bonus("Bless", 2, "morale"),
    conditional("Stacking courage", 4, "morale", { stacks: true }),
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.conditional[0].value, 4);
}

{
  const result = applyBonuses([
    bonus("Bless", 2, "morale"),
    conditional("Conditional penalty", -3, "morale"),
  ]);
  assert.equal(result.conditional[0].value, -3);
}

{
  const calculation = calculateStatsDetailed(
    [
      {
        name: "Bless",
        bonuses: [bonus("Bless", 2, "morale", { stat: "fortitude" })],
      },
      {
        name: "Greater courage",
        bonuses: [
          conditional("Greater courage", 5, "morale", {
            stat: "fortitude",
          }),
        ],
      },
    ],
    { con: 10, fortBase: 0, characterLevel: 1, skillRanks: {} },
  );
  const row = calculation.breakdown.fortitude.find(
    (entry) => entry.source === "Greater courage",
  );
  assert(row, "Conditional row should reach the character breakdown.");
  assert.equal(row.value, 3);
  assert.match(row.detail, /only the \+3 difference applies/);
}

console.log("Conditional bonus stacking checks passed.");
