const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console });
context.window = context;
context.globalThis = context;

function load(relativePath) {
  vm.runInContext(
    fs.readFileSync(path.join(root, relativePath), "utf8"),
    context,
    { filename: relativePath },
  );
}

load("scripts/effect-mechanics.js");
load("scripts/class-feature-abilities.js");

const barbarian = JSON.parse(
  fs.readFileSync(path.join(root, "data/classes/barbarian.json"), "utf8"),
);
const skald = JSON.parse(
  fs.readFileSync(path.join(root, "data/classes/skald.json"), "utf8"),
);

function ragePools(definition) {
  return (definition.levelProgression || []).flatMap((level) =>
    (level.classFeatures || []).flatMap((feature) =>
      (feature.pools || []).filter((pool) => pool.name === "Rage Power"),
    ),
  );
}

assert(ragePools(barbarian).length > 0, "Barbarian needs Rage Power pools");
assert(ragePools(skald).length > 0, "Skald needs Rage Power pools");
for (const pool of ragePools(barbarian)) {
  assert.equal(pool.contributesToAbility, "Rage");
  assert.equal(pool.chooseContributionsOnActivate, true);
}
for (const pool of ragePools(skald)) {
  assert.equal(pool.contributesToAbility, "Inspired Rage");
  assert.equal(pool.chooseContributionsOnActivate, true);
}

const ancestor = ragePools(skald)[0].options.find((option) =>
  option.name.startsWith("Ancestor Totem, Lesser"),
);
assert(
  ancestor.effects?.some(
    (effect) =>
      effect.stat === "choice:skills-rage-usable" && effect.value === 2,
  ),
  "Skald's Lesser Ancestor Totem must retain its recipient skill choice",
);
assert.equal(
  JSON.stringify(ragePools(skald)).includes('"className":"Barbarian"'),
  false,
  "Skald-granted rage powers must scale from Skald levels",
);

const progression = [1, 2, 3].map((level) => ({
  level,
  className: "Skald",
}));
const abilities = context.PFClassFeatureAbilities.collectActivatableAbilities({
  classDefinitions: [skald],
  classProgression: progression,
  classFeatureChoices: {
    "Skald|3|3|Rage Power|Rage Power": "Ancestor Totem, Lesser (Su)",
  },
  characterLevel: 3,
  abilityScores: { cha: 16 },
});
const inspiredRage = abilities.find((ability) => ability.name === "Inspired Rage");
assert(inspiredRage, "Inspired Rage must be activatable");
assert.equal(inspiredRage.activationGroup, "skald:raging-song");
assert.equal(
  inspiredRage.bonuses.some((effect) =>
    String(effect.stat).startsWith("choice:"),
  ),
  false,
  "Learned rage powers must not be applied before the caster selects them",
);
const ancestorContribution = inspiredRage.contributionOptions.find((option) =>
  option.name.startsWith("Ancestor Totem, Lesser"),
);
assert(ancestorContribution, "Learned rage power must be offered at activation");

const selected = context.PFEffectMechanics.resolveContributions(inspiredRage, [
  ancestorContribution.id,
]);
assert(
  selected.bonuses.some(
    (effect) =>
      effect.stat === "choice:skills-rage-usable" && effect.value === 2,
  ),
  "Selecting Lesser Ancestor Totem must preserve the recipient's skill choice",
);
assert.deepEqual(
  Array.from(selected.selectedContributionNames),
  ["Ancestor Totem, Lesser (Su)"],
);

const unselected = context.PFEffectMechanics.resolveContributions(
  inspiredRage,
  [],
);
assert.equal(
  unselected.bonuses.some((effect) =>
    String(effect.stat).startsWith("choice:"),
  ),
  false,
  "The caster must be allowed to activate Inspired Rage without a rage power",
);

console.log(
  "Rage power activation checks passed for caster selection, Skald mechanics, and recipient choices.",
);
