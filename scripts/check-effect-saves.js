const assert = require("node:assert/strict");
const fs = require("node:fs");

require("./effect-mechanics.js");
const saves = require("./effect-saves.js");

const bonus = (stat, value, extra = {}) => ({ stat, value, ...extra });
const saveConfig = (partialMechanics = null) => ({
  enabled: true,
  check: "fortitude",
  partial: Boolean(partialMechanics),
  ...(partialMechanics ? { partialMechanics } : {}),
});

async function main() {
  const unchanged = { name: "No Save", effects: [bonus("attack", 1)] };
  assert.equal(saves.hasSave(unchanged), false);

  const failed = await saves.resolve(
    {
      name: "Failed Save",
      saveConfig: saveConfig(),
      effects: [bonus("attack", -2), bonus("damage", -2)],
    },
    { sheet: {}, random: () => 0 },
  );
  assert.equal(failed.effects.length, 2, "A natural 1 must retain every protected mechanic.");
  assert.equal(failed.saveConfig, undefined, "Resolved saves must not persist on the applied effect.");

  const partial = await saves.resolve(
    {
      name: "Destruction",
      saveConfig: saveConfig({
        damageRolls: [{ diceCount: 10, dieType: 6 }],
      }),
      effects: [
        bonus("damage", 10),
        bonus("armor class", -1, { saveMode: "none" }),
      ],
    },
    { sheet: {}, random: () => 0.9999 },
  );
  assert.equal(partial.effects.length, 1, "A no-save mechanic must survive a successful save.");
  assert.equal(partial.effects[0].stat, "armor class");
  assert.equal(partial.damageRolls.length, 1, "Apply Partial must substitute partial mechanics.");

  const negated = await saves.resolve(
    {
      name: "Mixed",
      saveConfig: saveConfig(),
      effects: [
        bonus("attack", -2),
        bonus("speed", -10, { saveMode: "none" }),
      ],
    },
    { sheet: {}, random: () => 0.9999 },
  );
  assert.deepEqual(
    negated.effects.map((entry) => entry.stat),
    ["speed"],
    "A successful save must remove only protected mechanics.",
  );

  const nauseatingDart = await saves.resolve(
    {
      name: "Nauseating Dart",
      saveConfig: saveConfig(),
      damageRolls: [{ diceCount: 1, dieType: 4, saveMode: "none" }],
      applyConditions: [{ condition: "Nauseated" }],
    },
    { sheet: {}, random: () => 0.9999 },
  );
  assert.equal(nauseatingDart.damageRolls.length, 1);
  assert.equal(
    nauseatingDart.applyConditions,
    undefined,
    "A mixed ability must retain its no-save damage and remove its save-gated condition.",
  );

  const custom = await saves.resolve(
    {
      name: "Multiple Saves",
      effects: [
        bonus("attack", -2, { saveConfig: saveConfig() }),
        bonus("damage", -2),
      ],
    },
    { sheet: {}, random: () => 0.9999 },
  );
  assert.deepEqual(custom.effects.map((entry) => entry.stat), ["damage"]);

  const active = globalThis.PFEffectMechanics.activeMechanics({
    activeMechanics: {
      saveConfig: saveConfig(),
      effects: [bonus("will", -2)],
    },
  });
  assert.equal(active.saveConfig.check, "fortitude");
  assert.deepEqual(
    globalThis.PFEffectMechanics.copyActivationConfig(active),
    { saveConfig: active.saveConfig },
    "Spell-source builders must be able to retain authored save configuration.",
  );

  const spells = JSON.parse(fs.readFileSync("data/spells.json", "utf8"));
  const destruction = spells.find((spell) => spell.name === "Destruction");
  const destructionMechanics = globalThis.PFEffectMechanics.activeMechanics(
    destruction,
    { activeOnly: true },
  );
  assert.equal(saves.hasSave(destructionMechanics), true);
  assert.equal(destructionMechanics.saveConfig.check, "fortitude");
  const destructionPartial = await saves.resolve(destructionMechanics, {
    sheet: {},
    random: () => 0.9999,
  });
  assert.equal(destructionPartial.damageRolls[0].diceCount, 10);
  assert.equal(destructionPartial.damageRolls[0].dieType, 6);
  assert.deepEqual(
    saves.saveOutcome({ die: 12, total: 21, dc: 20 }),
    { known: true, success: true, label: "Success" },
  );
  assert.deepEqual(
    saves.saveOutcome({ die: 12, total: 19, dc: 20 }),
    { known: true, success: false, label: "Failure" },
  );
  assert.equal(
    saves.saveOutcome({ die: 20, total: 1, dc: 100 }).success,
    true,
    "A natural 20 must report success without revealing the DC.",
  );
  assert.equal(
    saves.saveOutcome({ die: 1, total: 100, dc: 1 }).success,
    false,
    "A natural 1 must report failure without revealing the DC.",
  );

  const resolvedWithTransientDc = await saves.resolve(
    {
      name: "Hidden DC",
      saveDc: 20,
      saveConfig: saveConfig(),
      effects: [bonus("attack", -2)],
    },
    { sheet: {}, random: () => 0 },
  );
  assert.equal(resolvedWithTransientDc.saveDc, undefined);

  const editor = fs.readFileSync("scripts/effect-editor.js", "utf8");
  assert(editor.includes('id="${prefix}ActiveSave"'));
  assert(editor.includes("appendSavedRow(applyConditionRowsEl, element, data)"));
  assert(editor.includes("partialMechanics: partialEditor.collect()"));

  const characterSheet = fs.readFileSync(
    "scripts/pages/character-sheet.js",
    "utf8",
  );
  assert(
    characterSheet.includes(
      "...window.PFEffectMechanics?.copyActivationConfig?.(mechanics)",
    ),
    "Character-sheet spell payloads must retain save configuration.",
  );
  assert(
    characterSheet.includes("payload.damageRolls = Array.isArray(mechanics.damageRolls)"),
    "Save-bound damage must remain in the per-target payload.",
  );
  assert(
    (characterSheet.match(/window\.PFEffectSaves\?\.hasSave\?\.\(payload\)/g) || [])
      .length >= 2,
    "Save-bound damage must not be rolled early or stripped during caster decisions.",
  );
  const map = fs.readFileSync("scripts/pages/map.js", "utf8");
  assert(
    map.includes(
      "...window.PFEffectMechanics?.copyActivationConfig?.(mechanics)",
    ),
    "Map spell definitions must retain save configuration.",
  );

  for (const page of [
    "character-sheet.html",
    "map.html",
    "spell-editor.html",
    "feat-editor.html",
    "race-editor.html",
    "class-editor.html",
    "class-feature-pool-editor.html",
    "item-catalog-editor.html",
    "bag-of-holding.html",
  ]) {
    assert(
      fs.readFileSync(page, "utf8").includes("scripts/effect-saves.js?v="),
      `${page} must load shared effect saves.`,
    );
  }

  console.log("Effect save checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
