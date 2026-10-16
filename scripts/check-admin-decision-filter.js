const assert = require("assert");
const fs = require("fs");
const path = require("path");
const decisions = require("./effect-decisions.js");

assert(decisions.hasDecision({ branches: [{ name: "A" }, { name: "B" }] }));
assert(decisions.hasDecision({ effects: [{ stat: "choice:skills-all" }] }));
assert(decisions.hasDecision({ conditionalVariables: [{ key: "enemy" }] }));
assert(decisions.hasDecision({ applyConditions: [{ ability: "player-chooses" }] }));
assert(decisions.hasDecision({ grantDomains: [{ chooseOnApply: true }] }));
assert(decisions.hasDecision({ spellLikeAbilities: [{ spellChoiceListId: "fire" }] }));
assert(decisions.hasDecision({ chooseContributionsOnActivate: true }));
assert.equal(
  decisions.decisionOwner({ branches: [{ name: "A" }, { name: "B" }] }),
  "caster",
);
assert.equal(
  decisions.decisionOwner({
    branches: [{ name: "A" }, { name: "B" }],
    decisionOwner: "target",
  }),
  "target",
);
assert.equal(
  [{ branches: [{ name: "A" }, { name: "B" }] }].filter(
    decisions.hasDecision,
  ).length,
  1,
);
assert(!decisions.hasDecision({ auraConfig: { enabled: true, targetsEmitAura: true } }));
assert(!decisions.hasDecision({ attackRolls: [{ attackType: "melee" }] }));
assert(!decisions.hasDecision({ resourcePool: { id: "rage", cost: 1 } }));

const root = path.resolve(__dirname, "..");
const editors = [
  ["spell-editor.html", "spellDecisionFilter", "scripts/pages/spell-editor.js"],
  ["class-editor.html", "classDecisionFilter", "scripts/pages/class-editor.js"],
  ["feat-editor.html", "featDecisionFilter", "scripts/pages/feat-editor.js"],
  ["item-catalog-editor.html", "itemDecisionFilter", "scripts/pages/item-catalog-editor.js"],
  ["race-editor.html", "raceDecisionFilter", "scripts/pages/race-editor.js"],
  ["class-feature-pool-editor.html", "poolDecisionFilter", "scripts/pages/class-feature-pool-editor.js"],
];

editors.forEach(([htmlFile, buttonId, scriptFile]) => {
  const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
  const script = fs.readFileSync(path.join(root, scriptFile), "utf8");
  assert(html.includes(`id="${buttonId}"`), `${htmlFile} is missing ${buttonId}.`);
  assert(
    html.includes('scripts/effect-decisions.js?v=owner-1'),
    `${htmlFile} is missing the shared decision detector.`,
  );
  assert(
    script
      .replace(/\s+/g, "")
      .includes(`bindFilterButton(el("${buttonId}")`),
    `${scriptFile} does not bind ${buttonId}.`,
  );
  assert(
    script.includes("PFEffectDecisions.hasDecision"),
    `${scriptFile} does not use the shared decision detector.`,
  );
});

console.log("Admin decision filter checks passed.");
