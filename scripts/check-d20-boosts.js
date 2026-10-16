const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const boosts = require("./d20-boosts.js");
const mechanics = require("./effect-mechanics.js");

const source = {
  id: "mythic-surge",
  name: "Mythic Surge",
  d20Boosts: [{ id: "surge", diceCount: 1, dieType: 6, staticValue: 2, uses: 2, appliesTo: ["attacks"], bonusType: "insight" }],
};
assert.equal(boosts.collectResources({ sources: [source], rollKind: "saves" }).length, 0);
const [resource] = boosts.collectResources({ sources: [source], rollKind: "attacks" });
assert.equal(resource.remaining, 2);
assert.equal(boosts.rollBoost(resource, () => 0).value, 3);
const spent = boosts.spend({}, resource);
assert.equal(spent[resource.key].remaining, 1);
assert.equal(boosts.spend(spent, { ...resource, remaining: 0 })[resource.key].remaining, 0);
assert.equal(boosts.refill(spent, resource)[resource.key].remaining, 2);
assert.equal(boosts.stackingValue([{ value: 4, bonusType: "insight" }], { value: 3, bonusType: "insight" }), 0);
assert.equal(boosts.stackingValue([{ value: 2, bonusType: "insight" }], { value: 5, bonusType: "insight" }), 3);
assert.equal(boosts.stackingValue([{ value: 2, bonusType: "untyped" }], { value: 5, bonusType: "untyped" }), 5);
assert.deepEqual(
  boosts.baselineBonuses({
    sources: [{ bonuses: [{ stat: "attack", value: 4, type: "insight" }] }],
    rollKind: "attacks",
  }),
  [{ value: 4, bonusType: "insight", baseline: true }],
);
assert.equal(
  boosts.stackingValue(
    boosts.baselineBonuses({ sources: [{ bonuses: [{ stat: "attack", value: 4, type: "insight" }] }], rollKind: "attacks" }),
    { value: 6, bonusType: "insight" },
  ),
  2,
);
assert.equal(
  boosts.baselineBonuses({
    sources: [{ bonuses: [{ stat: "fortitude", value: 4, type: "resistance" }] }],
    rollKind: "saves",
    roll: { label: "Reflex" },
  }).length,
  0,
);
assert.equal(
  boosts.collectResources({ sources: [{ ...source, d20Boosts: [{ ...source.d20Boosts[0], usesPeriod: "rage" }] }], rollKind: "attacks" }).length,
  0,
);
assert.equal(
  boosts.collectResources({ sources: [{ ...source, d20Boosts: [{ ...source.d20Boosts[0], usesPeriod: "rage" }] }], rollKind: "attacks", activeEffects: [{ id: "rage-1", name: "Inspired Rage" }] }).length,
  1,
);
assert(mechanics.extraKeys().includes("d20Boosts"));
const root = path.resolve(__dirname, "..");
const editor = fs.readFileSync(path.join(root, "scripts/effect-editor.js"), "utf8");
const map = fs.readFileSync(path.join(root, "scripts/pages/map.js"), "utf8");
const sheet = fs.readFileSync(path.join(root, "scripts/pages/character-sheet.js"), "utf8");
assert(editor.includes("createD20BoostRow"));
assert(editor.includes("Scale Uses"));
assert(map.includes("renderMapD20BoostPools"));
assert(sheet.includes("d20BoostUses = structuredClone"));
console.log("D20 boost checks passed.");
