const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");
const data = JSON.parse(read("metamagic.json"));
const metamagic = require(path.join(rootDir, "scripts", "metamagic.js"));
const damage = require(path.join(rootDir, "scripts", "damage-rolls.js"));
const effectMechanics = require(path.join(rootDir, "scripts", "effect-mechanics.js"));
const spells = JSON.parse(read(path.join("data", "spells.json")));

assert.equal(data.metamagic.length, 81, "The metamagic catalog should expose every authored feat.");
assert(data.metamagic.some((entry) => entry.name === "Enlarge Spell"));

const heroism = spells.find((spell) => spell.name === "Heroism");
assert(heroism, "Heroism must remain in the spell catalog.");
const heroismAfterMetamagic = metamagic.apply({
  spell: heroism,
  calculations: { spellLevel: 3 },
  selections: [],
}).spell;
const heroismMechanics = effectMechanics.activeMechanics(
  heroismAfterMetamagic,
  { activeOnly: true },
);
assert.equal(heroismMechanics.effects.length, 3);
assert(effectMechanics.hasAnyMechanics(heroismMechanics));

const definition = (name) => {
  const entry = data.metamagic.find((item) => item.name === name);
  assert(entry, `Missing ${name} in metamagic.json.`);
  return entry;
};
const selection = (name, options = {}) => ({
  name,
  options,
  definition: definition(name),
});
const baseSpell = () => ({
  name: "Test Spell",
  details: {
    school: "evocation",
    components: "V, S",
    casting_time: "1 standard action",
    range: "close (25 ft. + 5 ft./2 levels)",
    duration: "1 round/level",
    descriptors: ["fire"],
    saving_throw: "Reflex half",
  },
  activeMechanics: {
    effects: [{ stat: "attack", value: 2, type: "morale" }],
    applyConditions: [],
    auraConfig: { enabled: true, rangeFeet: 20 },
    durationConfig: {
      count: 1,
      unit: "round",
      factors: [{ type: "caster" }],
    },
    damageRolls: [{
      id: "fire",
      label: "Damage",
      diceCount: 0,
      dieType: 6,
      diceCountMax: 10,
      diceCountScale: {
        source: { type: "caster" },
        every: { fromLevel: 1, everyLevels: 1, increase: 1 },
      },
      staticDamage: 2,
      damageType: "fire",
      conditionals: [],
    }],
  },
});
const baseCalculations = () => ({
  spellLevel: 3,
  calculatedDuration: "10 rounds at CL 10",
  calculatedRange: "50 ft. at CL 10",
  casterLevel: { base: 10, total: 10, bonus: 0, calculatedBonus: 0, used: [], conditional: [] },
  spellDc: { base: 18, total: 18, bonus: 0, calculatedBonus: 0, used: [], conditional: [] },
});

global.PFMetamagicPicker = {
  conditionDefinitions: () => new Map([
    ["dazed", { id: "condition-dazed", name: "Dazed", bonuses: [] }],
  ]),
};

const transformed = metamagic.apply({
  spell: baseSpell(),
  calculations: baseCalculations(),
  selections: [
    selection("Heighten Spell", { targetLevel: 5 }),
    selection("Focused Spell"),
    selection("Extend Spell"),
    selection("Widen Spell"),
    selection("Maximize Spell"),
    selection("Empower Spell"),
    selection("Intensified Spell"),
    selection("Encouraging Spell"),
  ],
});

assert.equal(transformed.calculations.effectiveSpellLevel, 5);
assert.equal(transformed.calculations.effectiveSlotLevel, 17);
assert.equal(transformed.calculations.spellDc.total, 22, "Heighten and Focused should add four to DC.");
assert.equal(transformed.spell.details.duration, "2 rounds/level");
assert.equal(transformed.spell.activeMechanics.durationConfig.count, 2);
assert.equal(transformed.spell.activeMechanics.auraConfig.rangeFeet, 40);
assert.equal(transformed.spell.activeMechanics.effects[0].value, 3);
const transformedRoll = transformed.spell.activeMechanics.damageRolls[0];
assert.equal(transformedRoll.diceCountMax, 15);
assert.equal(transformedRoll.maximizeDice, true);
assert.equal(transformedRoll.damageMultiplier, 1.5);

const calculated = damage.calculateRoll(transformedRoll, { casterLevel: 15 });
const result = damage.rollCalculated(calculated, () => 0);
assert.equal(result.dice.length, 15);
assert(result.dice.every((value) => value === 6));
assert.equal(result.total, 138, "Maximized 15d6 + 2, empowered by 1.5, should round down to 138.");

const elemental = metamagic.apply({
  spell: baseSpell(),
  calculations: baseCalculations(),
  selections: [
    selection("Empower Spell"),
    selection("Elemental Spell", { damageType: "cold", mode: "split" }),
  ],
});
assert.equal(elemental.spell.activeMechanics.damageRolls.length, 2);
assert(elemental.spell.activeMechanics.damageRolls.every((roll) => roll.damageMultiplier === 0.75));
assert.equal(elemental.spell.activeMechanics.damageRolls[1].damageType, "cold");

const riderSpell = metamagic.apply({
  spell: baseSpell(),
  calculations: baseCalculations(),
  selections: [selection("Dazing Spell")],
});
assert.equal(riderSpell.spell.activeMechanics.metamagicRiders.length, 1);
assert.equal(riderSpell.spell.activeMechanics.metamagicRiders[0].metamagicSave.type, "Reflex");
assert.equal(riderSpell.spell.activeMechanics.metamagicRiders[0].durationConfig.count, 3);
const extractedRiderMechanics = effectMechanics.activeMechanics(riderSpell.spell, {
  activeOnly: true,
});
assert.equal(
  extractedRiderMechanics.metamagicRiders.length,
  1,
  "Targeted metamagic riders must survive active-mechanics extraction for damage-only spells.",
);
const shortenedSpell = metamagic.apply({
  spell: baseSpell(),
  calculations: baseCalculations(),
  selections: [selection("Murky Spell")],
});
assert.equal(
  effectMechanics.activeMechanics(shortenedSpell.spell, { activeOnly: true })
    .metamagicDurationMultiplier,
  0.1,
  "Metamagic duration changes must survive active-mechanics extraction.",
);

const abilityDamage = metamagic.apply({
  spell: baseSpell(),
  calculations: baseCalculations(),
  selections: [
    selection("Cherry Blossom Spell", { abilityGroup: "physical" }),
  ],
});
const abilityRiders = abilityDamage.spell.activeMechanics.metamagicRiders;
assert.equal(abilityRiders.length, 3);
assert.deepStrictEqual(
  abilityRiders.map((rider) => rider.adjustableCondition.stat),
  ["strength", "dexterity", "constitution"],
);
assert(abilityRiders.every((rider) => rider.adjustableCondition.amount === 2));
assert(abilityRiders.every((rider) => rider.metamagicSave.group === "Cherry Blossom Spell"));

const picker = read(path.join("modals", "metamagic-picker.js"));
const spellPicker = read(path.join("modals", "spell-picker.js"));
assert(!/btn-close/.test(picker), "Metamagic modals must not include a header close button.");
assert(picker.includes("data-metamagic-save-failed"));
assert(picker.includes("data-metamagic-step"));
assert(picker.includes('id="${DETAILS_MODAL_ID}"'));
assert(picker.includes("data-metamagic-details-description"));
assert(picker.includes("data-metamagic-details-benefits"));
assert(!picker.includes("metamagic-picker-description"));
assert(!picker.includes("metamagic-picker-benefit"));
assert(spellPicker.includes("closeDetails: async () =>"));
assert(spellPicker.includes("await waitForHidden(element)"));
const characterSheet = read(path.join("scripts", "pages", "character-sheet.js"));
assert(characterSheet.includes("function spellTargetPayloadHasMechanics"));
assert.equal(
  (characterSheet.match(/spellTargetPayloadHasMechanics\(/g) || []).length,
  3,
  "Runtime metamagic bonuses must be recognized both before target selection and before application.",
);
const tracker = read(path.join("scripts", "buff-tracker-widget.js"));
assert(tracker.includes("updateAdjustableCondition(index, amount)"));
assert(tracker.includes("data-active-adjustment"));
assert(tracker.includes("effect-adjustable-control .modal-number-stepper"));
assert(!tracker.includes("data-active-adjust-step"));
assert(tracker.includes("this.options.onChange?.([...this.active], change)"));
const queuedSave = tracker.slice(
  tracker.indexOf("queueSave() {"),
  tracker.indexOf("notifyChange(change = {})"),
);
assert(
  !queuedSave.includes("this.notifyChange"),
  "Saving an already-notified effect change must not trigger a second recalculation.",
);
assert(characterSheet.includes("if (collectionChanged) void syncCurrentMapLinkedAuras(activeBuffs)"));
assert(characterSheet.includes("if (!isEnemySheetMode) queueSheetSave()"));
assert.equal(
  (characterSheet.match(/await closeDetails\?\.\(\);/g) || []).length,
  2,
  "Character-sheet spell flows must wait until the details modal is fully hidden.",
);
const map = read(path.join("scripts", "pages", "map.js"));
assert(map.includes("await closeDetails?.();"));

for (const page of ["character-sheet.html", "map.html"]) {
  const html = read(page);
  assert(html.includes("scripts/metamagic.js"));
  assert(html.includes("modals/metamagic-picker.js"));
  assert(html.indexOf("scripts/metamagic.js") < html.indexOf("modals/spell-picker.js"));
}

console.log("Metamagic checks passed.");
