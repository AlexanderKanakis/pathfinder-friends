const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
require("./effect-stat-options.js");

const stats = global.PFEffectStats;
const equipment = {
  weapons: [
    { id: "w1", name: "Relic Rifle", type: "Weapon" },
    { id: "w3", name: "Relic Rifle", type: "Weapon" },
    { id: "w2", name: "Unworn Blade", type: "Weapon", equipped: false },
  ],
  armor: [
    { id: "a1", item: "+2 Leather Armor", type: "Armor" },
    { id: "s1", item: "Heavy Steel Shield", type: "Shield" },
  ],
};

async function run() {
  for (const [poolId, label] of [
    ["equipped-weapons", "Equipped Weapons"],
    ["equipped-shields", "Equipped Shields"],
    ["equipped-armor", "Equipped Armor"],
    ["equipped-armor-shields", "Equipped Armor / Shields"],
  ]) assert.equal(stats.poolById(poolId)?.label, label);

  const weapons = await stats.resolveChoicePoolOptions("equipped-weapons", { equipment });
  const shields = await stats.resolveChoicePoolOptions("equipped-shields", { equipment });
  const armor = await stats.resolveChoicePoolOptions("equipped-armor", { equipment });
  const combined = await stats.resolveChoicePoolOptions("equipped-armor-shields", { equipment });

  assert.deepEqual(weapons.map((item) => item.label), ["Relic Rifle", "Relic Rifle"]);
  assert.notEqual(weapons[0].value, weapons[1].value);
  assert.deepEqual(shields.map((item) => item.label), ["Heavy Steel Shield"]);
  assert.deepEqual(armor.map((item) => item.label), ["+2 Leather Armor"]);
  assert.deepEqual(combined.map((item) => item.label), ["+2 Leather Armor", "Heavy Steel Shield"]);

  const resolved = stats.resolveChoiceStatItem(
    { stat: "choice:equipped-weapons", value: 1 },
    weapons[0].value,
    weapons,
  );
  assert.equal(resolved.stat, "equipped:weapon:relic-rifle:w1");
  assert.equal(resolved.equipmentTarget.id, "w1");
  assert.equal(resolved.equipmentTarget.name, "Relic Rifle");
  assert.equal(stats.choiceStatLabel(resolved.stat), "Equipped Weapon: Relic Rifle");

  const enhancement = stats.resolveEquipmentEnhancement({
    item: equipment.weapons[0],
    fallbackKind: "weapon",
    baseEnhancement: 2,
    buffs: [
      {
        name: "Lesser effect",
        bonuses: [{ ...resolved, value: 1, type: "enhancement", stacks: true }],
      },
      {
        name: "Greater effect",
        bonuses: [{ ...resolved, value: 4, type: "untyped" }],
      },
      {
        name: "Conditional effect",
        bonuses: [{ ...resolved, value: 5, conditional: true }],
      },
    ],
  });
  assert.equal(enhancement.base, 2);
  assert.equal(enhancement.effect, 4);
  assert.equal(enhancement.value, 4);
  assert.equal(enhancement.breakdown.filter((entry) => entry.applied).length, 1);
  assert.equal(enhancement.breakdown.find((entry) => entry.applied).source, "Greater effect");
  assert.ok(enhancement.breakdown.every((entry) => entry.type === "equipment enhancement"));

  const scaled = stats.resolveEquipmentEnhancement({
    item: equipment.weapons[0],
    fallbackKind: "weapon",
    baseEnhancement: 1,
    buffs: [{ name: "Scaled effect", bonuses: [{ ...resolved, value: 2 }] }],
    valueForBonus: (bonus) => bonus.value + 2,
  });
  assert.equal(scaled.value, 4);

  const baseWins = stats.resolveEquipmentEnhancement({
    item: equipment.weapons[0],
    fallbackKind: "weapon",
    baseEnhancement: 4,
    buffs: [{ name: "Equal effect", bonuses: [{ ...resolved, value: 4 }] }],
  });
  assert.equal(baseWins.value, 4);
  assert.ok(baseWins.breakdown.every((entry) => entry.applied === false));

  const shieldResolved = stats.resolveChoiceStatItem(
    { stat: "choice:equipped-shields", value: 3 },
    shields[0].value,
    shields,
  );
  const shieldDoesNotEnhanceArmor = stats.resolveEquipmentEnhancement({
    item: equipment.armor[0],
    fallbackKind: "armor",
    baseEnhancement: 1,
    buffs: [{ name: "Shield effect", bonuses: [{ ...shieldResolved, value: 5 }] }],
  });
  assert.equal(shieldDoesNotEnhanceArmor.value, 1);

  const sources = {
    tracker: fs.readFileSync(path.join(__dirname, "buff-tracker-widget.js"), "utf8"),
    pending: fs.readFileSync(path.join(__dirname, "../modals/pending-effect-choices.js"), "utf8"),
    sheet: fs.readFileSync(path.join(__dirname, "pages/character-sheet.js"), "utf8"),
    map: fs.readFileSync(path.join(__dirname, "pages/map.js"), "utf8"),
    picker: fs.readFileSync(path.join(__dirname, "../modals/effect-choice-picker.js"), "utf8"),
  };
  assert.match(sources.tracker, /choicePoolEquipment/);
  assert.match(sources.pending, /choicePoolEquipmentFor/);
  assert.match(sources.sheet, /currentEffectChoiceEquipment/);
  assert.match(sources.map, /equipment = token \? rollTokenSheet\(token\)/);
  assert.match(sources.picker, /hideSignal/);
  console.log("Equipment choice pool checks passed.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
