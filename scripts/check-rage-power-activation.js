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
load("scripts/effect-decisions.js");
load("scripts/effect-activation-orchestrator.js");
load("scripts/class-data.js");
load("scripts/class-feature-abilities.js");

const rageCatalog = JSON.parse(
  fs.readFileSync(
    path.join(root, "data/class-feature-pools/rage-powers.json"),
    "utf8",
  ),
);
const barbarian = context.PFClassData.withPoolCatalogs(
  JSON.parse(
    fs.readFileSync(path.join(root, "data/classes/barbarian.json"), "utf8"),
  ),
  [rageCatalog],
);
const skald = context.PFClassData.withPoolCatalogs(
  JSON.parse(
    fs.readFileSync(path.join(root, "data/classes/skald.json"), "utf8"),
  ),
  [rageCatalog],
);

function ragePools(definition) {
  return (definition.levelProgression || []).flatMap((level) =>
    (level.classFeatures || []).flatMap((feature) =>
      context.PFClassData
        .featurePools(definition, feature)
        .filter((pool) => pool?.name === "Rage Power"),
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
assert.equal(ancestor.decisionOwner, "target");
const celestial = ragePools(skald)[0].options.find(
  (option) => option.name === "Celestial Totem",
);
assert.equal(celestial?.auraConfig?.revealMode, "light");
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
assert.equal(
  ancestorContribution.decisionOwner,
  "target",
  "The recipient must own Lesser Ancestor Totem's skill decision",
);

const celestialProgression = Array.from({ length: 8 }, (_, index) => ({
  level: index + 1,
  className: "Skald",
}));
const celestialAbilities =
  context.PFClassFeatureAbilities.collectActivatableAbilities({
    classDefinitions: [skald],
    classProgression: celestialProgression,
    classFeatureChoices: {
      "Skald|3|3|Rage Power|Rage Power": "Celestial Totem, Lesser",
      "Skald|6|6|Rage Power|Rage Power": "Celestial Totem",
    },
    characterLevel: 8,
    abilityScores: { cha: 18 },
  });
const celestialRage = celestialAbilities.find(
  (ability) => ability.name === "Inspired Rage",
);
const celestialContribution = celestialRage.contributionOptions.find(
  (option) => option.name === "Celestial Totem",
);
assert.equal(
  celestialContribution.emittedAuras?.[0]?.auraConfig?.revealMode,
  "light",
  "Celestial Totem must contribute its own light aura to Inspired Rage",
);
const selectedCelestial = context.PFEffectMechanics.resolveContributions(
  celestialRage,
  [celestialContribution.id],
);
assert.equal(selectedCelestial.emittedAuras?.[0]?.auraConfig?.rangeFeet, 5);
const emittedCelestial = context.PFEffectMechanics.createEmittedAuraLinks(
  { id: "recipient", kind: "character" },
  { ...selectedCelestial, id: "inspired-rage-recipient", remaining: 3 },
);
assert.equal(emittedCelestial[0]?.aura?.revealMode, "light");
assert.equal(emittedCelestial[0]?.aura?.radius, 1);
assert.equal(emittedCelestial[0]?.aura?.visualOnly, true);
assert.equal(
  emittedCelestial[0]?.aura?.linkedEffectId,
  "inspired-rage-recipient",
);
assert.equal(
  emittedCelestial[0]?.aura?.emittedAuraParentKey,
  "inspired-rage-recipient|",
);

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
assert.equal(
  context.PFEffectActivationOrchestrator.targetMustAnswer(selected),
  true,
  "The selected rage power must defer its skill choice until after targeting",
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

const beastProgression = Array.from({ length: 11 }, (_, index) => ({
  level: index + 1,
  className: "Skald",
}));
const beastAbilities = context.PFClassFeatureAbilities.collectActivatableAbilities({
  classDefinitions: [skald],
  classProgression: beastProgression,
  classFeatureChoices: {
    "Skald|3|3|Rage Power|Rage Power": "Beast Totem, Lesser (Su)",
    "Skald|6|6|Rage Power|Rage Power": "Beast Totem (Su)",
    "Skald|9|9|Rage Power|Rage Power": "Beast Totem, Greater (Su)",
  },
  characterLevel: 11,
  abilityScores: { cha: 18 },
});
const beastRage = beastAbilities.find((ability) => ability.name === "Inspired Rage");
const beastContribution = beastRage.contributionOptions.find((option) =>
  option.name.startsWith("Beast Totem, Greater"),
);
assert(beastContribution, "The terminal Beast Totem tier must be selectable");
assert(
  beastContribution.effects.some((effect) => effect.stat === "natural armor"),
  "Greater Beast Totem must inherit the natural armor effect from Beast Totem",
);
assert.equal(
  beastContribution.generatedEquipment.length,
  2,
  "The terminal Beast Totem tier must replace, not duplicate, inherited claws",
);
assert(
  beastContribution.generatedEquipment.every(
    (entry) => entry.details?.damage === "1d8",
  ),
  "Greater Beast Totem must grant its upgraded claws",
);
const selectedBeast = context.PFEffectMechanics.resolveContributions(beastRage, [
  beastContribution.id,
]);
const auraLink = context.PFEffectMechanics.createAuraLink(
  { id: "eryn", kind: "character" },
  selectedBeast,
  { id: "inspired-rage-test" },
);
assert(
  auraLink.controller.bonuses.some((effect) => effect.stat === "natural armor"),
  "An affects-source aura controller must apply Beast Totem to its Skald",
);
assert.equal(
  auraLink.controller.generatedEquipment.length,
  2,
  "An affects-source aura controller must grant the selected natural attacks",
);
assert(
  auraLink.aura.effect.bonuses.some((effect) => effect.stat === "natural armor"),
  "Inspired Rage must still carry Beast Totem to aura recipients",
);

const resolvedAncestorForSource = {
  ...selected,
  bonuses: selected.bonuses.map((effect) =>
    effect.stat === "choice:skills-rage-usable"
      ? { ...effect, stat: "acrobatics" }
      : effect,
  ),
};
const recipientChoiceAura = context.PFEffectMechanics.createAuraLink(
  { id: "jason", kind: "character" },
  resolvedAncestorForSource,
  { id: "ancestor-choice-test", recipientEffect: selected },
);
assert(
  recipientChoiceAura.controller.bonuses.some(
    (effect) => effect.stat === "acrobatics",
  ),
  "An affects-source aura controller must retain the source's resolved choice",
);
assert(
  recipientChoiceAura.aura.effect.bonuses.some(
    (effect) => effect.stat === "choice:skills-rage-usable",
  ),
  "Aura recipients must receive their own unresolved target-owned choice",
);

const hostileAuraLink = context.PFEffectMechanics.createAuraLink(
  { id: "caster", kind: "character" },
  {
    name: "Hostile Aura",
    bonuses: [{ stat: "will", value: -1 }],
    auraConfig: { enabled: true, rangeFeet: 10 },
  },
);
assert.equal(
  hostileAuraLink.controller.bonuses,
  undefined,
  "Auras must continue excluding their source unless configured otherwise",
);

console.log(
  "Rage power activation checks passed for caster selection, Skald mechanics, and recipient choices.",
);
