const { loadClasses, saveClasses } = require("./class-file-store");

const FULL_PREPARED = [
  [3, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1],
  [4, 3, 3, 2], [4, 4, 3, 2, 1], [4, 4, 3, 3, 2], [4, 4, 4, 3, 2, 1],
  [4, 4, 4, 3, 3, 2], [4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
  [4, 4, 4, 4, 4, 4, 4, 4, 3, 3], [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
];

const TWO_THIRDS = [
  [0, 1], [0, 2], [0, 3], [0, 3, 1], [0, 4, 2],
  [0, 4, 3], [0, 4, 3, 1], [0, 4, 4, 2], [0, 5, 4, 3],
  [0, 5, 4, 3, 1], [0, 5, 4, 4, 2], [0, 5, 5, 4, 3],
  [0, 5, 5, 4, 3, 1], [0, 5, 5, 4, 4, 2], [0, 5, 5, 5, 4, 3],
  [0, 5, 5, 5, 4, 3, 1], [0, 5, 5, 5, 4, 4, 2], [0, 5, 5, 5, 5, 4, 3],
  [0, 5, 5, 5, 5, 5, 4], [0, 5, 5, 5, 5, 5, 5]
];

const HALF = [
  [0], [0], [0], [0, 1], [0, 1], [0, 1],
  [0, 1, 0], [0, 1, 1], [0, 2, 1], [0, 2, 1, 0],
  [0, 2, 1, 1], [0, 2, 2, 1], [0, 3, 2, 1, 0], [0, 3, 2, 1, 1],
  [0, 3, 2, 2, 1], [0, 3, 3, 2, 1], [0, 4, 3, 2, 1], [0, 4, 3, 2, 2],
  [0, 4, 3, 3, 2], [0, 4, 4, 3, 3]
];

function trimRows(rows, maxSpellLevel) {
  return rows.map(row => Array.from({ length: maxSpellLevel + 1 }, (_, index) => Number(row[index] || 0)));
}

function spontaneousKnown(rows, maxSpellLevel) {
  return rows.map((row, classLevelIndex) => row.map((slots, spellLevel) => {
    if (spellLevel === 0) return Math.min(9, Math.max(4, 4 + Math.floor(classLevelIndex / 2)));
    if (!slots) return 0;
    return Math.max(1, Math.min(6, slots - 1));
  }).slice(0, maxSpellLevel + 1));
}

function baseSlots(progression, castingType, maxSpellLevel) {
  let rows = FULL_PREPARED;
  if (progression === "2/3") rows = TWO_THIRDS;
  if (progression === "1/2") rows = HALF;
  const trimmed = trimRows(rows, maxSpellLevel);
  if (castingType !== "spontaneous") return trimmed;
  return trimmed.map(row => row.map((value, index) => index === 0 ? value : value + (value > 0 ? 2 : 0)));
}

const DEFAULTS = {
  Adept: ["prepared", "2/3", "wis", "daily-list", 5],
  Alchemist: ["prepared", "2/3", "int", "spellbook", 6],
  Antipaladin: ["spontaneous", "1/2", "cha", "spontaneous", 4],
  Arcanist: ["prepared", "full", "int", "spellbook", 9],
  Bard: ["spontaneous", "2/3", "cha", "spontaneous", 6],
  Bloodrager: ["spontaneous", "1/2", "cha", "spontaneous", 4],
  Cleric: ["prepared", "full", "wis", "daily-list", 9],
  Druid: ["prepared", "full", "wis", "daily-list", 9],
  Hunter: ["spontaneous", "2/3", "wis", "spontaneous", 6],
  Inquisitor: ["spontaneous", "2/3", "wis", "spontaneous", 6],
  Investigator: ["prepared", "2/3", "int", "spellbook", 6],
  Magus: ["prepared", "2/3", "int", "spellbook", 6],
  Medium: ["spontaneous", "1/2", "cha", "spontaneous", 4],
  Mesmerist: ["spontaneous", "2/3", "cha", "spontaneous", 6],
  Occultist: ["spontaneous", "2/3", "int", "spontaneous", 6],
  Omdura: ["spontaneous", "2/3", "cha", "spontaneous", 6],
  Oracle: ["spontaneous", "full", "cha", "spontaneous", 9],
  Paladin: ["prepared", "1/2", "cha", "daily-list", 4],
  Psychic: ["spontaneous", "full", "int", "spontaneous", 9],
  Ranger: ["prepared", "1/2", "wis", "daily-list", 4],
  Shaman: ["prepared", "full", "wis", "daily-list", 9],
  Skald: ["spontaneous", "2/3", "cha", "spontaneous", 6],
  Sorcerer: ["spontaneous", "full", "cha", "spontaneous", 9],
  Spiritualist: ["spontaneous", "2/3", "wis", "spontaneous", 6],
  Summoner: ["spontaneous", "2/3", "cha", "spontaneous", 6],
  "Summoner (Unchained)": ["spontaneous", "2/3", "cha", "spontaneous", 6],
  "Vampire Hunter": ["prepared", "1/2", "wis", "daily-list", 4],
  Warpriest: ["prepared", "2/3", "wis", "daily-list", 6],
  Witch: ["prepared", "full", "int", "spellbook", 9],
  Wizard: ["prepared", "full", "int", "spellbook", 9]
};

const classes = loadClasses();
let updated = 0;
for (const cls of classes) {
  const config = DEFAULTS[cls.name];
  if (!config) continue;
  const [castingType, progression, ability, preparation, maxSpellLevel] = config;
  const slotsByLevel = baseSlots(progression, castingType, maxSpellLevel);
  cls.spellcastingClass = true;
  cls.spellcasting = {
    ...(cls.spellcasting && typeof cls.spellcasting === "object" ? cls.spellcasting : {}),
    summary: `${castingType} ${progression} caster using ${ability.toUpperCase()}`,
    castingType,
    progression,
    ability,
    preparation,
    maxSpellLevel,
    slotsByLevel,
    ...(castingType === "spontaneous" ? { knownByLevel: spontaneousKnown(slotsByLevel, maxSpellLevel) } : {})
  };
  updated += 1;
}

saveClasses(classes);
console.log(`Updated spellcasting metadata for ${updated} class(es).`);
