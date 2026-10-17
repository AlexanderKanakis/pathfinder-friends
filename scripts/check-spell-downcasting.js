const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("scripts/spell-data.js", "utf8");
const sandbox = {
  window: {},
  fetch: async () => ({ ok: true, json: async () => [] }),
};
vm.runInNewContext(source, sandbox);

const adjust = sandbox.window.PFSpellData.adjustCasterLevelResult;
assert.strictEqual(typeof adjust, "function");

const casterLevel = adjust({ base: 10, total: 10 }, 10, 7);
assert.strictEqual(casterLevel.total, 7);
assert.strictEqual(casterLevel.downcastBy, 3);

const duration = adjust(
  { base: 10, total: 12 },
  10,
  7,
  { preservePartModifiers: true },
);
assert.strictEqual(duration.total, 9);
assert.strictEqual(duration.downcastBy, 3);
assert.strictEqual(duration.downcastFrom, 12);

const range = adjust(
  { base: 10, total: 11 },
  10,
  8,
  { preservePartModifiers: true },
);
assert.strictEqual(range.total, 9);
assert.strictEqual(range.downcastBy, 2);

const upcastDuration = adjust(
  { base: 10, total: 12 },
  10,
  13,
  { preservePartModifiers: true },
);
assert.strictEqual(upcastDuration.total, 15);
assert.strictEqual(upcastDuration.miscCasterLevelBonus, 3);

const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
assert(sheet.includes("window.PFSpellData?.adjustCasterLevelResult"));
assert.strictEqual(
  (sheet.match(/\{ preservePartModifiers: true \}/g) || []).length,
  2,
);
assert(sheet.includes("effectiveDurationClResult.total"));
assert(sheet.includes("effectiveRangeClResult.total"));

console.log("Spell downcasting duration and range checks passed.");
