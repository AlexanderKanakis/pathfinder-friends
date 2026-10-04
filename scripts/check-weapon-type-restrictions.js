const assert = require("node:assert/strict");

global.window = {};
require("./effect-stat-options.js");
require("./buff-calculator.js");

const buffs = [
  {
    name: "All Weapons",
    bonuses: [
      {
        stat: "attack",
        value: 2,
        type: "enhancement",
        weaponTypeRestriction: "all",
      },
    ],
  },
  {
    name: "Light Weapons",
    bonuses: [
      {
        stat: "attack",
        value: 3,
        type: "enhancement",
        weaponTypeRestriction: "melee-light",
      },
    ],
  },
  {
    name: "Ranged Weapons",
    bonuses: [
      {
        stat: "attack",
        value: 5,
        type: "untyped",
        weaponTypeRestriction: "ranged",
      },
    ],
  },
  {
    name: "Natural Weapons",
    bonuses: [
      {
        stat: "damage",
        value: 4,
        type: "untyped",
        weaponTypeRestriction: "natural",
      },
    ],
  },
  {
    name: "Improvised Weapons",
    bonuses: [
      {
        stat: "attack",
        value: 4,
        type: "untyped",
        weaponTypeRestriction: "improvised",
      },
    ],
  },
  {
    name: "Unarmed Strike",
    bonuses: [
      {
        stat: "attack",
        value: 6,
        type: "untyped",
        weaponTypeRestriction: "unarmed-strike",
      },
    ],
  },
  {
    name: "Horseshoes of Crushing Blows",
    bonuses: [
      {
        stat: "attack",
        value: 4,
        type: "untyped",
        weaponTypeRestriction: "natural",
        weaponNameRestriction: "Hoof",
      },
      {
        stat: "damage",
        value: 4,
        type: "untyped",
        weaponTypeRestriction: "natural",
        weaponNameRestriction: "Hoof",
      },
    ],
  },
  {
    name: "Named Weapon",
    bonuses: [
      {
        stat: "attack",
        value: 1,
        type: "untyped",
        weaponNameRestriction: "Trident",
      },
    ],
  },
];

const calculation = window.PFBuffs.calculateStatsDetailed(buffs, {
  characterLevel: 1,
  skillRanks: {},
});
const forWeapon = (stats, weaponType, weaponName = "") =>
  window.PFBuffs.weaponBonusesForStats(
    calculation,
    stats,
    weaponType,
    weaponName,
  ).total;

assert.equal(calculation.bonuses.attack, 2);
assert.equal(window.PFEffectStats.weaponNameRestrictionMatches("Hoof", "2 hooves"), true);
assert.equal(window.PFEffectStats.weaponNameRestrictionMatches("Hoof", "claw"), false);
assert.equal(window.PFEffectStats.weaponNameRestrictionMatches("Claw", "claw hammer"), false);
assert.equal(forWeapon(["attack"], "Natural Weapon", "hooves"), 6);
assert.equal(forWeapon(["damage"], "Natural Weapon", "hoof"), 8);
assert.equal(forWeapon(["attack"], "Natural Weapon", "claw"), 2);
assert.equal(forWeapon(["attack"], "Melee Weapon (One-Handed)", "+5 axiomatic flaming unholy trident"), 3);
assert.equal(forWeapon(["attack"], "Melee Weapon (Light)"), 3);
assert.equal(forWeapon(["attack"], "Melee Weapon (One-Handed)"), 2);
assert.equal(forWeapon(["attack"], "Improvised"), 6);
assert.equal(forWeapon(["attack"], "Improvised", "Chair Leg"), 6);
assert.equal(window.PFEffectStats.weaponTypeRestrictionMatches("improvised", "Ranged Weapon"), false);
assert.equal(window.PFEffectStats.weaponTypeRestrictionLabel("improvised"), "Improvised");
assert.equal(forWeapon(["attack"], "Ranged Weapon"), 7);
assert.equal(forWeapon(["damage"], "Natural"), 4);
assert.equal(forWeapon(["damage"], "Natural Weapon"), 4);
assert.equal(forWeapon(["damage"], "Melee Weapon (Light)"), 0);
assert.equal(
  forWeapon(["attack"], "Melee Weapon (Light)", "Unarmed Strike"),
  9,
);
assert.equal(
  forWeapon(["attack"], "Melee Weapon (Light)", "unarmed strike"),
  9,
);
assert.equal(forWeapon(["attack"], "Melee Weapon (Light)", "Gauntlet"), 3);

console.log("Weapon type restriction checks passed.");
