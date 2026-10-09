const assert = require("assert");
const fs = require("fs");

global.window = global;
require("../modals/effect-duration-editor.js");

const config = {
  count: 1,
  unit: "minute",
  factors: [{ type: "caster" }],
  splitAmongTargets: true,
};

const normalized = global.PFEffectMeta.normalizeDurationConfig(config);
assert.strictEqual(normalized.splitAmongTargets, true);
assert.match(global.PFEffectMeta.durationLabel(config), /split among targets/);
assert.strictEqual(
  global.PFEffectMeta.parseDuration(config, { casterLevel: 6 }),
  60,
);
assert.strictEqual(
  global.PFEffectMeta.parseDuration(config, { casterLevel: 6, targetCount: 3 }),
  20,
);
assert.strictEqual(
  global.PFEffectMeta.parseDuration(
    { count: 1, unit: "round", splitAmongTargets: true },
    { targetCount: 4 },
  ),
  1,
);
assert.deepStrictEqual(
  global.PFEffectMeta.durationConfigFromSpellText("10 minutes/level"),
  {
    count: 10,
    unit: "minute",
    factors: [{ type: "caster" }],
    factorMode: "multiply",
  },
);
assert.strictEqual(
  global.PFEffectMeta.parseDuration(
    global.PFEffectMeta.durationConfigFromSpellText("10 minutes/level"),
    { casterLevel: 21 },
  ),
  2100,
);

const editor = fs.readFileSync(
  require.resolve("../modals/effect-duration-editor.js"),
  "utf8",
);
assert(editor.includes("data-duration-split-targets"));

const characterSheet = fs.readFileSync(
  require.resolve("./pages/character-sheet.js"),
  "utf8",
);
assert(characterSheet.includes("targetCount = 1"));
assert(characterSheet.includes("targets.length,"));

const map = fs.readFileSync(require.resolve("./pages/map.js"), "utf8");
assert(map.includes("appliedEffectFromQuickSelection(effect, options, targetCount = 1)"));
assert(map.includes("durationConfigFromSpellText?.(spell.details?.duration)"));
assert(/quickEffectSelection\.options,\s*targets\.length,/.test(map));

console.log("Shared duration checks passed.");
