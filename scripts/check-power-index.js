const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("scripts/power-index.js", "utf8");
const sheet = fs.readFileSync("scripts/pages/character-sheet.js", "utf8");
const map = fs.readFileSync("scripts/pages/map.js", "utf8");
const sheetHtml = fs.readFileSync("character-sheet.html", "utf8");
const mapHtml = fs.readFileSync("map.html", "utf8");
const window = {
  PFEffectMechanics: {
    extraKeys: () => ["damageRolls"],
    activeMechanics: (entry) => entry.activeMechanics || entry,
    hasBranches: (entry) => Array.isArray(entry.branches) && entry.branches.length > 0,
    copyActivationConfig: () => ({}),
  },
  PFEffectMeta: { durationLabel: () => "variable" },
};
vm.runInNewContext(source, { window });

const catalog = [
  {
    id: "feat:surge",
    name: "Surge",
    category: "Feat",
    source: "Feat",
    bonuses: [{ stat: "attack", value: 1 }],
  },
];
const classAbility = {
  id: "ability:Skald:Inspired Rage",
  name: "Inspired Rage",
  category: "Class Feature",
  source: "Skald -- with Beast Totem",
  fromAbility: true,
  bonuses: [{ stat: "strength", value: 4 }],
};
const index = window.PFPowerIndex.build({
  signature: "sheet-signature",
  catalog,
  activatable: [
    classAbility,
    {
      ...catalog[0],
      catalogEffect: false,
      bonuses: [{ stat: "attack", value: 2 }],
    },
  ],
  spells: [
    {
      id: "spell:cleric:1:bless",
      name: "Bless",
      category: "Spell",
      ownedSpell: true,
      spellMeta: {
        kind: "spell",
        className: "Cleric",
        level: 1,
        bucket: "prepared",
      },
    },
  ],
});

assert(window.PFPowerIndex.isUsable(index, "sheet-signature"));
assert(
  window.PFPowerIndex.isUsableForSheet(index, {
    classProgression: [{ className: "Cleric" }],
    spells: { Cleric: { prepared: { 1: ["Bless"] } } },
  }),
);
assert(
  !window.PFPowerIndex.isUsableForSheet(index, {
    classProgression: [{ className: "Bard" }],
    spells: { Bard: { known: { 1: ["Cure Light Wounds"] } } },
  }),
);
assert(
  !window.PFPowerIndex.isUsableForSheet(
    { ...index, spellSignature: undefined },
    { spells: {} },
  ),
);
assert(window.PFPowerIndex.isUsable(index, "sheet-signature", catalog));
assert(
  !window.PFPowerIndex.isUsable(index, "sheet-signature", [
    { ...catalog[0], bonuses: [{ stat: "attack", value: 99 }] },
  ]),
);
assert.strictEqual(index.activatable[0].kind, "class-ability");
assert.strictEqual(index.activatable[1].kind, "catalog");
assert.strictEqual(
  JSON.stringify(index.activatable[1].patch.bonuses),
  JSON.stringify([{ stat: "attack", value: 2 }]),
);
assert.strictEqual(index.spells[0].kind, "spell");

const resolved = window.PFPowerIndex.resolve(index, {
  catalog,
  classAbilities: [classAbility],
  spellDefinitions: [
    {
      name: "Bless",
      activeMechanics: { effects: [{ stat: "attack", value: 1 }] },
    },
  ],
});
assert.strictEqual(resolved.activatable[0].source, classAbility.source);
assert.strictEqual(resolved.activatable[1].bonuses[0].value, 2);
assert.strictEqual(resolved.spells[0].ownedSpell, true);
assert.strictEqual(resolved.spells[0].spellMeta.className, "Cleric");
const lightweightSpells = window.PFPowerIndex.resolveSpells(index);
assert.strictEqual(lightweightSpells[0].name, "Bless");
assert.strictEqual(lightweightSpells[0].spell.name, "Bless");
const sheetSpells = window.PFPowerIndex.spellsFromSheet({
  classProgression: [{ className: "Cleric" }],
  spells: { Cleric: { prepared: { 1: ["Bless"] } } },
});
assert.strictEqual(sheetSpells[0].spellMeta.bucket, "prepared");
assert.strictEqual(sheetSpells[0].spellMeta.className, "Cleric");

assert(
  sheetHtml.includes('scripts/power-index.js?v=power-index-ownership-1'),
);
assert(mapHtml.includes('scripts/power-index.js?v=power-index-ownership-1'));
assert(sheet.includes("sheet.powerIndex = structuredClone(currentPowerIndex)"));
assert(sheet.includes("window.PFPowerIndex?.isUsableForSheet?.("));
assert(map.includes("window.PFPowerIndex?.isUsableForSheet?.(sheet.powerIndex, sheet)"));
assert(sheet.includes("await ensureCurrentPowerIndex();"));
const requestStart = sheet.indexOf("function createSheetSaveRequest");
const requestEnd = sheet.indexOf("\nfunction saveSheetNow", requestStart);
const requestBody = sheet.slice(requestStart, requestEnd);
assert(requestBody.includes("refreshCurrentSpellPowerIndex();"));
assert(!requestBody.includes("await ensureCurrentPowerIndex();"));
assert(sheet.includes('currentPowerIndex = index ? { ...index, scope: "spells" } : null;'));
assert(map.includes("resolveIndexedCharacterPowerSources(character)"));
assert(map.includes("indexedCharacterSpellSources(character)"));
assert(map.includes('sourceCharacter && group === "spells"'));
assert(map.includes('if (index?.scope === "spells") return null;'));
assert(sheet.includes("function currentSpellPickerSources()"));
assert(sheet.includes("hydrateCurrentPickerEffect"));
const mapSourceStart = map.indexOf("async function characterMapEffectSources");
const mapSourceEnd = map.indexOf("\nfunction scheduleAccessibleEffectSourcePrefetch", mapSourceStart);
const mapSourceLoader = map.slice(mapSourceStart, mapSourceEnd);
assert(
  mapSourceLoader.indexOf("resolveIndexedCharacterPowerSources(character)") <
    mapSourceLoader.indexOf("const bridge = await characterSheetBridge();"),
  "The map must try the thin power index before restoring the character sheet.",
);

console.log("Thin power index checks passed.");
