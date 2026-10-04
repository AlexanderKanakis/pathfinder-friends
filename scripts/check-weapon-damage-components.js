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
console.log("Weapon damage component checks passed.");
