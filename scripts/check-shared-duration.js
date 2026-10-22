const assert = require("assert");
const fs = require("fs");

global.window = global;
require("./effect-rolls.js");
require("../modals/effect-duration-editor.js");

const config = {
  count: 1,
  unit: "minute",
  factors: [{ type: "caster" }],
  splitAmongTargets: true,
};

const normalized = global.PFEffectMeta.normalizeDurationConfig(config);
assert.strictEqual(normalized.splitAmongTargets, true);
assert.strictEqual(normalized.staticValue, 1);
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
    diceCount: 0,
    dieType: 6,
    staticValue: 10,
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
assert.strictEqual(
  global.PFEffectMeta.parseDuration(
    {
      diceCount: 2,
      dieType: 4,
      staticValue: 3,
      unit: "round",
      factors: [],
    },
    { random: () => 0 },
  ),
  5,
  "Duration must roll XdY and add its static value once at activation.",
);
assert.strictEqual(
  global.PFEffectMeta.parseDuration(
    {
      diceCount: 1,
      dieType: 6,
      staticValue: 1,
      diceCountScale: {
        source: { type: "caster" },
        levelMultiplier: { numerator: 1, denominator: 3 },
      },
      staticValueScale: {
        source: { type: "caster" },
        milestones: [{ level: 5, value: 4 }],
      },
      unit: "round",
      factors: [],
    },
    { casterLevel: 6, random: () => 0 },
  ),
  7,
  "Duration dice count and static value must scale independently.",
);

const editor = fs.readFileSync(
  require.resolve("../modals/effect-duration-editor.js"),
  "utf8",
);
assert(editor.includes("data-duration-split-targets"));
assert(editor.includes("data-duration-dice-count"));
assert(editor.includes("data-duration-scale-dice"));
assert(editor.includes("data-duration-scale-static"));
assert(editor.includes("this.formulaScaleOpen"));
assert(editor.includes('this.modal.addEventListener("hidden.bs.modal", resolve'));
assert(editor.indexOf("durationModal.hide();") < editor.indexOf("PFEffectEditor.openScaleModal"));
assert(editor.indexOf("PFEffectEditor.openScaleModal") < editor.indexOf("durationModal.show();"));

const characterSheet = fs.readFileSync(
  require.resolve("./pages/character-sheet.js"),
  "utf8",
);
assert(characterSheet.includes("targetCount = 1"));
assert(characterSheet.includes("targets.length,"));

const map = fs.readFileSync(require.resolve("./pages/map.js"), "utf8");
assert(/function appliedEffectFromQuickSelection\s*\(\s*effect,\s*options,\s*targetCount = 1,/.test(map));
assert(map.includes("durationConfigFromSpellText?.(spell.details?.duration)"));
assert(/quickEffectSelection\.options,\s*targets\.length,/.test(map));

console.log("Shared duration checks passed.");
