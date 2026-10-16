const assert = require("assert");
const fs = require("fs");
const path = require("path");

const decisions = require("./effect-decisions.js");
global.PFEffectDecisions = decisions;
const orchestrator = require("./effect-activation-orchestrator.js");
const mechanics = require("./effect-mechanics.js");

const casterBranch = {
  branches: [{ name: "A" }, { name: "B" }],
};
const targetBranch = {
  ...casterBranch,
  decisionOwner: "target",
};

assert.equal(decisions.decisionOwner(casterBranch), "caster");
assert.equal(decisions.decisionOwner(targetBranch), "target");
assert.equal(
  orchestrator.decisionStage(casterBranch),
  orchestrator.BEFORE_TARGETS,
);
assert.equal(
  orchestrator.decisionStage(targetBranch),
  orchestrator.AFTER_TARGETS,
);
assert(orchestrator.shouldResolve(casterBranch, orchestrator.BEFORE_TARGETS));
assert(orchestrator.targetMustAnswer(targetBranch));
assert(!orchestrator.targetMustAnswer(casterBranch));
assert(!orchestrator.targetMustAnswer({ attackRolls: [{ attackType: "melee" }] }));

const active = mechanics.activeMechanics({
  activeMechanics: {
    decisionOwner: "target",
    branches: [{ name: "A" }, { name: "B" }],
  },
});
assert.equal(active.decisionOwner, "target");
assert.equal(active.branches.length, 2);

const expectedNodes = [
  "arcane-spell-failure",
  "caster-decisions",
  "resource-allocation",
  "aura-delivery",
  "targeting",
  "target-decisions",
  "attack-confirmation",
    "saving-throws",
  "effect-rolls",
  "application",
];
assert.deepEqual(
  orchestrator.nodes.map((node) => node.id),
  expectedNodes,
);
for (const sourceType of ["class", "feat", "item", "racial"]) {
  assert(
    !orchestrator
      .planFor({ sourceType })
      .some((node) => node.id === "arcane-spell-failure"),
  );
}
assert(
  orchestrator
    .planFor({ sourceType: "spell" })
    .some((node) => node.id === "arcane-spell-failure"),
);

async function checkOrchestratorRuntime() {
  const seen = [];
  const paused = await orchestrator.run(
    { sourceType: "spell", effect: casterBranch },
    {
      "arcane-spell-failure": async (state) => {
        seen.push("failure");
        return state;
      },
      "caster-decisions": async (state) => {
        seen.push("caster");
        return orchestrator.pause(state, "await-target");
      },
    },
  );
  assert.equal(paused.activationStatus, "paused");
  assert.equal(paused.activationNode, "caster-decisions");
  const resumed = await orchestrator.resume(paused, {
    application: async (state) => {
      seen.push("application");
      return { ...state, applied: true };
    },
  });
  assert.equal(resumed.activationStatus, "completed");
  assert.equal(resumed.applied, true);
  assert.deepEqual(seen, ["failure", "caster", "application"]);

  let statusReads = 0;
  const remote = await orchestrator.waitForRemoteDecision({
    createRequest: async () => ({ ok: true, id: "request-1" }),
    loadStatus: async () =>
      ++statusReads > 1
        ? { status: "resolved", resolved_bonuses: { effect: targetBranch } }
        : { status: "pending" },
    intervalMs: 1,
    timeoutMs: 100,
  });
  assert.equal(remote.ok, true);
  assert.equal(remote.effect.decisionOwner, "target");
}

const root = path.resolve(__dirname, "..");
["character-sheet.html", "map.html", "bag-of-holding.html"].forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const decisionsAt = html.indexOf("scripts/effect-decisions.js?v=owner-1");
  const orchestratorAt = html.indexOf(
    "scripts/effect-activation-orchestrator.js?v=3",
  );
  const editorAt = html.indexOf("scripts/effect-editor.js?v=");
  assert(decisionsAt >= 0, `${file} is missing effect decisions.`);
  assert(orchestratorAt > decisionsAt, `${file} loads the orchestrator too early.`);
  assert(editorAt > decisionsAt, `${file} loads the effect editor too early.`);
});

const editor = fs.readFileSync(
  path.join(root, "scripts/effect-editor.js"),
  "utf8",
);
assert(editor.includes("Decision owner"));
assert(editor.includes('value="caster">Caster decides'));
assert(editor.includes('value="target">Target decides'));
assert(editor.includes('container.addEventListener("input", syncDecisionOwnerControls)'));
assert(editor.includes('container.addEventListener("change", syncDecisionOwnerControls)'));
assert(editor.includes("const passiveData = mechanics?.passiveMechanics?.(item) || item;"));

const poolEditor = fs.readFileSync(
  path.join(root, "modals/class-feature-pool-editor.js"),
  "utf8",
);
assert(poolEditor.includes("classFeaturePoolDecisionOwner"));
assert(poolEditor.includes("async function openOptionEditor"));
assert(poolEditor.includes("if (optionEditorOpen) return;"));

const tracker = fs.readFileSync(
  path.join(root, "scripts/buff-tracker-widget.js"),
  "utf8",
);
const sheet = fs.readFileSync(
  path.join(root, "scripts/pages/character-sheet.js"),
  "utf8",
);
const map = fs.readFileSync(path.join(root, "scripts/pages/map.js"), "utf8");
const pending = fs.readFileSync(
  path.join(root, "modals/pending-effect-choices.js"),
  "utf8",
);
assert(tracker.includes("orchestrator.run("));
assert(tracker.includes("targetMustAnswer?.(\n            resolvedEffect"));
assert(sheet.includes("orchestrator.run("));
assert(map.includes("orchestrator.run(") && map.includes("orchestrator.resume("));
assert(map.includes("stopBeforeTargetOwned: true"));
assert(pending.includes("if (decisionOnly)"));
assert(pending.includes("effect: resolvedEffect"));

checkOrchestratorRuntime()
  .then(() => console.log("Effect decision ownership checks passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
