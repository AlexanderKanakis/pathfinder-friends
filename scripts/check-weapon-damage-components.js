const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.runInNewContext(fs.readFileSync("scripts/weapon-damage-components.js", "utf8"), context);
const damage = context.window.PFWeaponDamage;
const monsters = JSON.parse(fs.readFileSync("data/monsters.json", "utf8"));
const entries = Array.isArray(monsters) ? monsters : monsters.monsters;
const weapon = (monster, name) => entries.find((entry) => entry.name === monster)
  .weapons.find((entry) => entry.name.includes(name));

assert.equal(damage.format(weapon("Mephistopheles", "trident").extraDamage), " + 1d6 fire");
assert.equal(damage.format(weapon("Energized Ice Golem", "slam").extraDamage), " + 1d6 acid + 1d6 cold");
assert.equal(damage.format(weapon("Black Pudding", "slam").extraDamage), " + 2d6 acid");
assert.equal(damage.format([{ formula: "2d4", type: "bleed" }, { formula: "1d6+2", type: "fire" }]), " + 2d4 bleed + 1d6+2 fire");
assert.equal(damage.format(JSON.stringify([{ formula: "1d6", type: "cold" }])), " + 1d6 cold");
assert.deepEqual(
  JSON.parse(JSON.stringify(damage.normalize(["1d6 fire"])[0])),
  {
    diceCount: 1,
    dieType: 6,
    diceCountMax: null,
    staticDamage: 0,
    staticDamageMax: null,
    diceCountScale: null,
    staticDamageScale: null,
    damageType: "fire",
  },
);
assert.equal(
  damage.normalize([
    {
      diceCount: 0,
      dieType: 6,
      diceCountScale: { milestones: [{ level: 5, value: 1 }] },
      damageType: "fire",
    },
  ]).length,
  1,
  "a zero-base component with scaling must remain configurable",
);
const mephistopheles = weapon("Mephistopheles", "trident");
assert.equal(mephistopheles.damage.dice, "2d6");
assert.equal(mephistopheles.damage.staticModifier, 29);
assert.equal(damage.formatEntry(mephistopheles.extraDamage[0]), "1d6 fire");
entries.forEach((monster) => {
  (monster.weapons || []).forEach((entry) => {
    (entry.extraDamage || entry.damage?.extra || []).forEach((component) => {
      if (!/^\s*[+-]?(?:\d+d\d+|\d+)/i.test(String(component))) return;
      assert.equal(
        damage.normalize([component]).length,
        1,
        `${monster.name}: ${entry.name} must parse ${component}`,
      );
    });
  });
});
console.log("Weapon damage component checks passed.");
