const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console, structuredClone });
context.window = context;
context.globalThis = context;

vm.runInContext(
  fs.readFileSync(path.join(root, "scripts/class-resources.js"), "utf8"),
  context,
  { filename: "scripts/class-resources.js" },
);
for (const file of [
  "scripts/effect-mechanics.js",
  "scripts/class-feature-abilities.js",
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
}

const classes = [
  "barbarian",
  "skald",
  "arcanist",
  "alchemist",
  "cleric",
  "paladin",
  "monk",
].map((name) =>
  JSON.parse(
    fs.readFileSync(path.join(root, `data/classes/${name}.json`), "utf8"),
  ),
);

function resources(className, level, abilityScores = {}, values = {}) {
  return context.PFClassResources.derive({
    classDefinitions: classes,
    classProgression: Array.from({ length: level }, (_, index) => ({
      level: index + 1,
      className,
    })),
    characterLevel: level,
    abilityScores,
    values,
  });
}

assert.equal(resources("Barbarian", 1, { con: 16 })[0].maximum, 7);
assert.equal(resources("Barbarian", 10, { con: 16 })[0].maximum, 25);
assert.equal(resources("Skald", 1, { cha: 16 })[0].maximum, 6);
assert.equal(resources("Alchemist", 5, { int: 18 })[0].maximum, 9);
assert.equal(resources("Cleric", 5, { cha: 14 })[0].maximum, 5);

const paladin = resources("Paladin", 10, { cha: 18 });
assert.equal(paladin.find((entry) => entry.id === "smite-evil").maximum, 4);
assert.equal(paladin.find((entry) => entry.id === "lay-on-hands").maximum, 9);
assert.equal(resources("Monk", 8, { wis: 16 })[0].maximum, 7);

const reservoir = resources("Arcanist", 10)[0];
assert.equal(reservoir.maximum, 13);
assert.equal(reservoir.current, 8);

const rageEffect = {
  name: "Rage",
  resourcePool: {
    id: "rage-rounds",
    className: "Barbarian",
    cost: 1,
    mode: "per-round",
  },
};
const rageSheet = {
  fields: { characterLevel: "1" },
  classProgression: [{ level: 1, className: "Barbarian" }],
  abilities: { con: { score: 16 } },
  classResources: { "barbarian:rage-rounds": 2 },
};
const spent = context.PFClassResources.spend(rageSheet, rageEffect, classes);
assert.equal(spent.ok, true);
assert.equal(spent.current, 1);
assert.equal(rageSheet.classResources["barbarian:rage-rounds"], 2);
assert.equal(
  context.PFClassResources.insufficientMessage(rageEffect, {
    pool: { id: "rage-rounds" },
    resource: { name: "Rage" },
  }),
  "Not enough Rage to activate Rage.",
);

for (const [className, expectedAbility, resourceId] of [
  ["Barbarian", "Rage", "rage-rounds"],
  ["Skald", "Inspired Rage", "raging-song-rounds"],
]) {
  const definition = classes.find((entry) => entry.name === className);
  const ability = context.PFClassFeatureAbilities.collectActivatableAbilities({
    classDefinitions: [definition],
    classProgression: [{ level: 1, className }],
    characterLevel: 1,
    abilityScores: { con: 16, cha: 16 },
  }).find((entry) => entry.name === expectedAbility);
  assert(ability, `${expectedAbility} must remain activatable`);
  assert.equal(ability.resourcePool.id, resourceId);
  assert.equal(ability.resourcePool.mode, "per-round");
  assert.equal(ability.trackActive, true);
  assert.equal(ability.durationConfig.unit, "variable");
}

const sheetHtml = fs.readFileSync(path.join(root, "character-sheet.html"), "utf8");
const mapHtml = fs.readFileSync(path.join(root, "map.html"), "utf8");
const sheetJs = fs.readFileSync(
  path.join(root, "scripts/pages/character-sheet.js"),
  "utf8",
);
const mapJs = fs.readFileSync(
  path.join(root, "scripts/pages/map.js"),
  "utf8",
);
const trackerJs = fs.readFileSync(
  path.join(root, "scripts/buff-tracker-widget.js"),
  "utf8",
);
assert(sheetHtml.includes('id="classResourcesSection"'));
assert(sheetHtml.includes('scripts/class-resources.js?v=1'));
assert(mapHtml.includes('scripts/class-resources.js?v=1'));
assert(sheetHtml.includes('scripts/toast.js?v=1'));
assert(mapHtml.includes('scripts/toast.js?v=1'));
assert(sheetJs.includes("spendCurrentCharacterResource(effect)"));
assert(sheetJs.includes('PFToast.show(message, { tone: "warning" })'));
assert(mapJs.includes('PFToast?.show(message, { tone: "warning" })'));
assert(mapJs.includes("advanceClassResourcesForEndedTurn(endingRow)"));
assert(mapJs.includes("await advanceClassResourcesForEndedTurn(endingRow);"));
assert(trackerJs.includes("this.options.onBeforeApply?.(finalizedEffect"));

console.log("Class resource formulas and spending checks passed.");
