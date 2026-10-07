const ABILITIES = [
  ["str", "STR"],
  ["dex", "DEX"],
  ["con", "CON"],
  ["int", "INT"],
  ["wis", "WIS"],
  ["cha", "CHA"],
];
const SAVES = [
  ["fort", "Fortitude", "con"],
  ["reflex", "Reflex", "dex"],
  ["will", "Will", "wis"],
];
const CREATURE_SIZES = [
  { name: "Fine", modifier: 8, specialModifier: -8, flyModifier: 8, stealthModifier: 16, space: "1/2 ft.", reach: "0 ft.", tokenSize: 1 },
  { name: "Diminutive", modifier: 4, specialModifier: -4, flyModifier: 6, stealthModifier: 12, space: "1 ft.", reach: "0 ft.", tokenSize: 1 },
  { name: "Tiny", modifier: 2, specialModifier: -2, flyModifier: 4, stealthModifier: 8, space: "2-1/2 ft.", reach: "0 ft.", tokenSize: 1 },
  { name: "Small", modifier: 1, specialModifier: -1, flyModifier: 2, stealthModifier: 4, space: "5 ft.", reach: "5 ft.", tokenSize: 1 },
  { name: "Medium", modifier: 0, specialModifier: 0, flyModifier: 0, stealthModifier: 0, space: "5 ft.", reach: "5 ft.", tokenSize: 1 },
  { name: "Large", modifier: -1, specialModifier: 1, flyModifier: -2, stealthModifier: -4, space: "10 ft.", reach: "10 ft.", tokenSize: 2 },
  { name: "Huge", modifier: -2, specialModifier: 2, flyModifier: -4, stealthModifier: -8, space: "15 ft.", reach: "15 ft.", tokenSize: 3 },
  { name: "Gargantuan", modifier: -4, specialModifier: 4, flyModifier: -6, stealthModifier: -12, space: "20 ft.", reach: "20 ft.", tokenSize: 4 },
  { name: "Colossal", modifier: -8, specialModifier: 8, flyModifier: -8, stealthModifier: -16, space: "30 ft.", reach: "30 ft.", tokenSize: 5 },
];
const SIZE_CHANGE_VALUES = [-2, -1, 1, 2];
const SKILLS = [
  ["Acrobatics", "dex"],
  ["Appraise", "int"],
  ["Bluff", "cha"],
  ["Climb", "str"],
  ["Diplomacy", "cha"],
  ["Disable Device", "dex"],
  ["Disguise", "cha"],
  ["Escape Artist", "dex"],
  ["Fly", "dex"],
  ["Heal", "wis"],
  ["Handle Animal", "cha"],
  ["Intimidate", "cha"],
  ["Knowledge (arcana)", "int"],
  ["Knowledge (dungeoneering)", "int"],
  ["Knowledge (engineering)", "int"],
  ["Knowledge (geography)", "int"],
  ["Knowledge (history)", "int"],
  ["Knowledge (local)", "int"],
  ["Knowledge (nature)", "int"],
  ["Knowledge (nobility)", "int"],
  ["Knowledge (planes)", "int"],
  ["Knowledge (religion)", "int"],
  ["Linguistics", "int"],
  ["Perception", "wis"],
  ["Ride", "dex"],
  ["Sense Motive", "wis"],
  ["Sleight of Hand", "dex"],
  ["Spellcraft", "int"],
  ["Stealth", "dex"],
  ["Survival", "wis"],
  ["Swim", "str"],
  ["Use Magic Device", "cha"],
];
const SIMPLE_FIELDS = [
  "characterName",
  "imageUrl",
  "classLevel",
  "characterLevel",
  "race",
  "subtype",
  "alignment",
  "xp",
  "deity",
  "homeland",
  "size",
  "reach",
  "senses",
  "aura",
  "gender",
  "age",
  "height",
  "weight",
  "hair",
  "eyes",
  "bab",
  "babBase",
  "babMisc",
  "currentHitPoints",
  "hitPoints",
  "hitPointsTotal",
  "regeneration",
  "damageReduction",
  "resistances",
  "immunities",
  "spellResistance",
  "weaknesses",
  "initMisc",
  "speedBase",
  "speedArmor",
  "flySpeed",
  "acNaturalBase",
  "acNaturalMisc",
  "acDeflection",
  "acMisc",
  "cmbMisc",
  "cmdMisc",
  "defensiveAbilities",
  "specialAttacks",
  "spellLikeCl",
  "spellLikeConcentration",
  "spellLikeAbilities",
  "enemySpells",
  "enemySpellsKnown",
  "enemySpellsPrepared",
  "enemyPsychicMagic",
  "languages",
  "sq",
  "specialAbilities",
  "lightLoad",
  "mediumLoad",
  "heavyLoad",
  "liftOverHead",
  "liftOffGround",
  "dragOrPush",
  "GP",
  "SP",
  "CP",
  "notes",
];
const ABILITY_STAT_NAMES = {
  str: "strength",
  dex: "dexterity",
  con: "constitution",
  int: "intelligence",
  wis: "wisdom",
  cha: "charisma",
};
const ABILITY_NAME_TO_STAT = {
  str: "strength",
  strength: "strength",
  dex: "dexterity",
  dexterity: "dexterity",
  con: "constitution",
  constitution: "constitution",
  int: "intelligence",
  intelligence: "intelligence",
  wis: "wisdom",
  wisdom: "wisdom",
  cha: "charisma",
  charisma: "charisma",
};
const SCALE_ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const WEAPON_TYPES = [
  "Melee Weapon (Light)",
  "Melee Weapon (One-Handed)",
  "Melee Weapon (Two-Handed)",
  "Ranged Weapon",
  "Firearm (One-Handed)",
  "Firearm (Two-Handed)",
  "Natural Weapon",
  "Improvised",
];
const NATURAL_ATTACK_DAMAGE_BY_SIZE = {
  Bite: {
    fine: "1",
    diminutive: "1d2",
    tiny: "1d3",
    small: "1d4",
    medium: "1d6",
    large: "1d8",
    huge: "2d6",
    gargantuan: "2d8",
    colossal: "4d6",
    damageType: "B, P, and S",
    attackRole: "Primary",
  },
  Claw: {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "B and S",
    attackRole: "Primary",
  },
  Gore: {
    fine: "1",
    diminutive: "1d2",
    tiny: "1d3",
    small: "1d4",
    medium: "1d6",
    large: "1d8",
    huge: "2d6",
    gargantuan: "2d8",
    colossal: "4d6",
    damageType: "P",
    attackRole: "Primary",
  },
  "Hoof, Tentacle, Wing": {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "B",
    attackRole: "Secondary",
  },
  "Pincers, Tail Slap": {
    fine: "1",
    diminutive: "1d2",
    tiny: "1d3",
    small: "1d4",
    medium: "1d6",
    large: "1d8",
    huge: "2d6",
    gargantuan: "2d8",
    colossal: "4d6",
    damageType: "B",
    attackRole: "Secondary",
  },
  Slam: {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "B",
    attackRole: "Primary",
  },
  Sting: {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "P",
    attackRole: "Primary",
  },
  Talons: {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "S",
    attackRole: "Primary",
  },
  Other: {
    fine: "",
    diminutive: "1",
    tiny: "1d2",
    small: "1d3",
    medium: "1d4",
    large: "1d6",
    huge: "1d8",
    gargantuan: "2d6",
    colossal: "2d8",
    damageType: "B, P, or S",
    attackRole: "Secondary",
  },
};
const ALIGNMENTS = [
  ["LG", "Lawful Good"],
  ["NG", "Neutral Good"],
  ["CG", "Chaotic Good"],
  ["LN", "Lawful Neutral"],
  ["N", "Neutral"],
  ["CN", "Chaotic Neutral"],
  ["LE", "Lawful Evil"],
  ["NE", "Neutral Evil"],
  ["CE", "Chaotic Evil"],
];
const ALIGNMENT_BY_CODE = Object.fromEntries(ALIGNMENTS);
const ALIGNMENT_CODE_BY_NAME = Object.fromEntries(
  ALIGNMENTS.map(([code, name]) => [name.toLowerCase(), code]),
);
const ZERO_LEVEL_SPELL_CLASSES = new Set([
  "adept",
  "arcanist",
  "bard",
  "cleric",
  "druid",
  "hunter",
  "inquisitor",
  "magus",
  "medium",
  "mesmerist",
  "occultist",
  "oracle",
  "psychic",
  "shaman",
  "skald",
  "sorcerer",
  "spiritualist",
  "summoner",
  "summoner (unchained)",
  "warpriest",
  "witch",
  "wizard",
]);
const ITEM_SLOTS = PFItemEditor.DEFAULT_SLOTS;
const WEAPON_ENCHANTMENTS = [
  "",
  "Adaptive",
  "Allying",
  "Anarchic",
  "Anchoring",
  "Axiomatic",
  "Bane",
  "Brilliant Energy",
  "Called",
  "Conductive",
  "Corrosive",
  "Corrosive Burst",
  "Cruel",
  "Cunning",
  "Dancing",
  "Defending",
  "Disruption",
  "Distance",
  "Flaming",
  "Flaming Burst",
  "Frost",
  "Furious",
  "Ghost Touch",
  "Holy",
  "Icy Burst",
  "Impact",
  "Keen",
  "Merciful",
  "Returning",
  "Seeking",
  "Shock",
  "Shocking Burst",
  "Speed",
  "Spell Storing",
  "Throwing",
  "Thundering",
  "Unholy",
  "Vicious",
  "Vorpal",
  "Wounding",
];
const ARMOR_ENCHANTMENTS = [
  "",
  "Balanced",
  "Benevolent",
  "Bitter",
  "Bolstering",
  "Brawling",
  "Champion",
  "Dastard",
  "Deathless",
  "Defiant",
  "Determination",
  "Energy Resistance",
  "Energy Resistance (Improved)",
  "Energy Resistance (Greater)",
  "Etherealness",
  "Fortification (Light)",
  "Fortification (Moderate)",
  "Fortification (Heavy)",
  "Ghost Touch",
  "Glamered",
  "Invulnerability",
  "Shadow",
  "Shadow (Improved)",
  "Shadow (Greater)",
  "Slick",
  "Slick (Improved)",
  "Slick (Greater)",
  "Spell Resistance (13)",
  "Spell Resistance (15)",
  "Spell Resistance (17)",
  "Spell Resistance (19)",
  "Wild",
];
const SHIELD_ENCHANTMENTS = [
  "",
  "Animated",
  "Arrow Catching",
  "Arrow Deflection",
  "Bashing",
  "Blinding",
  "Clangorous",
  "Defiant",
  "Determination",
  "Energy Resistance",
  "Energy Resistance (Improved)",
  "Energy Resistance (Greater)",
  "Fortification (Light)",
  "Fortification (Moderate)",
  "Fortification (Heavy)",
  "Ghost Touch",
  "Impervious",
  "Merging",
  "Mirrored",
  "Poison-Resistant",
  "Rallying",
  "Ramming",
  "Reflecting",
  "Spell Resistance (13)",
  "Spell Resistance (15)",
  "Spell Resistance (17)",
  "Spell Resistance (19)",
  "Wild",
];
const LOOT_EFFECT_STATS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "attack",
  "melee attack",
  "ranged attack",
  "damage",
  "melee damage",
  "ranged damage",
  "ac",
  "touch ac",
  "flat-footed ac",
  "natural armor",
  "deflection",
  "fortitude",
  "reflex",
  "will",
  "all saves",
  "initiative",
  "cmb",
  "cmd",
  "hit points",
  "spell resistance",
];
let weaponCount = 0;
let armorCount = 0;
let gearCount = 0;
let generatedEquipmentSignature = "";
let sheetSaveTimer;
let sheetSaveQueue = Promise.resolve();
let sheetContextKey = "general";
let showCalculations = true;
let currentSheetId = null;
let isRestoringSheet = false;
let activeBuffs = [];
let equipmentEnhancementCache = new WeakMap();
let equipmentEnhancementBuffCache = null;
let lastBuffRefresh = "";
let effectTrackerInstance = null;
let effectTrackerModal = null;
let currentUserId = "";
let currentSheetOwnerId = "";
let currentUserIsAdmin = false;
let isEnemySheetMode = false;
let enemySheetId = "";
let classDefinitions = [];
const loadedClassDefinitions = new Map();
let domainDefinitions = { domains: [] };
let bloodlineDefinitions = { bloodlines: [] };
let classProgression = [];
let featDefinitions = { types: [], feats: [] };
let characterFeats = {};
let activeSheetInfoTab = "character";
let characterSheetReadyResolve = null;
const characterSheetReady = new Promise((resolve) => {
  characterSheetReadyResolve = resolve;
});
let sheetViewMode = sessionStorage.getItem("pf_character_sheet_view") || "full";
let customSkills = [];
let skillSearchTerm = "";
let classFeatureChoices = {};
let classFeatureVariableChoices = {};
let selectedRacialAlternateTraits = [];
let selectedRacialTraitChoices = {};
let classFeatureChoicePickerConfigs = new Map();
let classFeatureVariableChoicePickerConfigs = new Map();
// Effects + DR/SR/Class Skill grants on an inventory item -- mounted once
// (see initCharacterSheet below) via the shared scripts/effect-editor.js
// accordion.
let inventoryEffectsAccordion = null;
let characterSpells = {};
let selectedSpellLikeChoices = {};
let spellLikeChoiceConfigs = new Map();
let spellLikeDetailConfigs = new Map();
let spellMobilePanels = {};
let spellCastTargetModal = null;
let spellCastTargetResolver = null;
let spellCastTargetMapState = null;
let spellCastTargetMapSlot = 1;
let spellCastBridgeFrame = null;
let spellCastBridgePromise = null;
let inventoryItemModal = null;
let deleteInventoryItemModal = null;
let editingInventoryItemId = null;
let pendingInventoryDeleteId = null;
let characterInventoryItems = [];
let enemySourceItemModal = null;
let enemySourceItems = [];
let enemySourceItemSearchTerm = "";
let enemySourceItemCategory = "all";
let enemySourceItemMundaneCategory = "Adventuring Gear";
let raceDefinitions = { groups: [], races: [] };
const MUNDANE_CATEGORIES = [
  "Adventuring Gear",
  "Alchemical Creations",
  "Books, Paper, & Writing Supplies",
  "Clothing & Containers",
  "Locks, Keys, Tools & Kits",
  "Religious Items",
  "Toys & Games",
];

const PDF_SAMPLE = {
  characterName: "Choose Name",
  classLevel: "",
  race: "",
  alignment: "",
  deity: "Not set",
  homeland: "Not set",
  size: "Medium",
  gender: "Not set",
  age: "Not set (Adult)",
  characterLevel: 0,
  currentHitPoints: 0,
  hitPoints: 0,
  damageReduction: "",
  strScore: 10,
  dexScore: 10,
  conScore: 10,
  intScore: 10,
  wisScore: 10,
  chaScore: 10,
  bab: 6,
  acArmor: 8,
  acShield: 0,
  acNaturalBase: 0,
  acNaturalMisc: 0,
  acDeflection: 0,
  acMisc: 0,
  fortBase: 6,
  reflexBase: 3,
  willBase: 6,
  initMisc: 0,
  speedArmor: "20 ft. 4 sq.",
  mediumLoad: "174-346 lbs.",
  heavyLoad: "347-520 lbs.",
  liftOverHead: "520 lbs.",
  liftOffGround: "1040 lbs.",
  dragOrPush: "2600 lbs.",
  notes: "173 lbs. or less",
};

function el(id) {
  return document.getElementById(id);
}
function num(id) {
  return Number(el(id)?.value || 0);
}
function mod(score) {
  return Math.floor((Number(score || 0) - 10) / 2);
}
function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}
function skillId(skill) {
  return skill.replace(/[^a-z0-9]/gi, "");
}
function normalizeSkillName(skill) {
  return skillId(skill).toLowerCase();
}
function allSkills() {
  return [
    ...SKILLS,
    ...customSkills.map((skill) => [skill.name, skill.ability || "int", true]),
  ];
}
function abilityMod(key) {
  return mod(num(`${key}Score`));
}
function abilityModFor(key, buffed) {
  return buffed?.abilityMods?.[ABILITY_STAT_NAMES[key]] ?? abilityMod(key);
}

function currentAttributeScaleContext() {
  const baseline = sheetToBaseline();
  const buffed = window.PFBuffs?.calculateStatsDetailed?.(
    calculationBuffs(),
    baseline,
  );
  const abilityScores = {};
  const abilityMods = {};
  ABILITIES.forEach(([key]) => {
    const name = ABILITY_STAT_NAMES[key];
    abilityScores[key] = Number(buffed?.totals?.[name] ?? num(`${key}Score`));
    abilityMods[key] = Number(
      buffed?.abilityMods?.[name] ?? Math.floor((abilityScores[key] - 10) / 2),
    );
  });
  const characterLevel = Math.max(1, num("characterLevel") || 1);
  return {
    characterLevel,
    casterLevel: characterLevel,
    classLevels: progressionClassCounts(),
    skillRanks: baseline.skillRanks || {},
    abilityScores,
    abilityMods,
  };
}

const ENEMY_SPELL_METADATA_KEYS = new Set([
  "cl",
  "concentration",
  "notes",
  "levels",
  "classname",
  "class",
]);

function isEnemySpellMetadataKey(key = "") {
  return ENEMY_SPELL_METADATA_KEYS.has(
    String(key || "")
      .trim()
      .toLowerCase(),
  );
}

function isEnemySpellRowKey(key = "") {
  const clean = String(key || "").trim();
  return (
    /^constant$/i.test(clean) ||
    /^constant\s*\(level\s*\d+\)$/i.test(clean) ||
    /^atWill$/i.test(clean) ||
    /^at will$/i.test(clean) ||
    /^at will\s*\(level\s*\d+\)$/i.test(clean) ||
    /^\d+PerDay$/i.test(clean) ||
    /^\d+\s*per\s*day$/i.test(clean) ||
    /^\d+\/day$/i.test(clean) ||
    /^\d+\/day\s*\(level\s*\d+\)$/i.test(clean) ||
    /^level\s*\d+/i.test(clean) ||
    /^\d+(st|nd|rd|th)?$/i.test(clean)
  );
}

function prettifyEnemySpellLabel(key = "") {
  return String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^(\d+)PerDay$/i, "$1/day")
    .replace(/^at Will$/i, "At will")
    .replace(/^constant$/i, "Constant")
    .replace(/^level\s*(\d+)$/i, "Level $1")
    .trim();
}

function signedEnemyValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value || "");
  return number >= 0 ? `+${number}` : String(number);
}

function maybePopulateSpellLikeMeta(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return;
  if (
    el("spellLikeCl") &&
    !el("spellLikeCl").value &&
    payload.cl !== undefined &&
    payload.cl !== null
  ) {
    el("spellLikeCl").value = String(payload.cl);
  }
  if (
    el("spellLikeConcentration") &&
    !el("spellLikeConcentration").value &&
    payload.concentration !== undefined &&
    payload.concentration !== null
  ) {
    el("spellLikeConcentration").value = String(payload.concentration);
  }
}

function normalizeEnemySpellRows(value = "") {
  if (!value) return [];
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray(value.rows)
  ) {
    return normalizeEnemySpellRows(value.rows);
  }
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray(value.levels) &&
    value.levels.length
  ) {
    return value.levels
      .map((row) => ({
        label: row.frequency
          ? `${prettifyEnemySpellLabel(row.frequency)} ${row.level !== undefined && row.level !== null ? `(Level ${row.level})` : ""}`.trim()
          : `Level ${row.level ?? ""}`.trim(),
        spells: Array.isArray(row.spells)
          ? row.spells.join(", ")
          : String(row.spells || ""),
      }))
      .filter((row) => row.label || row.spells);
  }
  if (Array.isArray(value))
    return value
      .map((row) => {
        const rawLabel = String(
          row?.label || row?.frequency || row?.level || "",
        );
        const spells = Array.isArray(row?.spells)
          ? row.spells.join(", ")
          : String(row?.spells || row?.value || "");
        if (/^CL\b/i.test(spells) && /concentration/i.test(spells)) {
          const clMatch = spells.match(/\bCL\s*([^,]+)/i);
          const concentrationMatch = spells.match(
            /\bconcentration\s*([+-]?\d+)/i,
          );
          if (el("spellLikeCl") && !el("spellLikeCl").value && clMatch)
            el("spellLikeCl").value = clMatch[1].trim();
          if (
            el("spellLikeConcentration") &&
            !el("spellLikeConcentration").value &&
            concentrationMatch
          )
            el("spellLikeConcentration").value = concentrationMatch[1].trim();
          return null;
        }
        if (isEnemySpellMetadataKey(rawLabel) || !isEnemySpellRowKey(rawLabel))
          return null;
        return {
          label: prettifyEnemySpellLabel(rawLabel),
          spells,
        };
      })
      .filter((row) => row && (row.label || row.spells));
  if (typeof value === "object") {
    maybePopulateSpellLikeMeta(value);
    return Object.entries(value)
      .filter(
        ([label, spells]) =>
          !isEnemySpellMetadataKey(label) &&
          isEnemySpellRowKey(label) &&
          spells,
      )
      .map(([label, spells]) => ({
        label: prettifyEnemySpellLabel(label),
        spells: Array.isArray(spells)
          ? spells.join(", ")
          : String(spells || ""),
      }))
      .filter((row) => row.label || row.spells);
  }
  const text = String(value || "").trim();
  if (!text) return [];
  try {
    return normalizeEnemySpellRows(JSON.parse(text));
  } catch {
    return text
      .split(/\n+/)
      .map((line) => {
        if (/^CL\b/i.test(line) && /concentration/i.test(line)) {
          const clMatch = line.match(/\bCL\s*([^,]+)/i);
          const concentrationMatch = line.match(
            /\bconcentration\s*([+-]?\d+)/i,
          );
          if (el("spellLikeCl") && !el("spellLikeCl").value && clMatch)
            el("spellLikeCl").value = clMatch[1].trim();
          if (
            el("spellLikeConcentration") &&
            !el("spellLikeConcentration").value &&
            concentrationMatch
          )
            el("spellLikeConcentration").value = concentrationMatch[1].trim();
          return null;
        }
        const index = line.indexOf(":");
        if (index >= 0) {
          const label = line.slice(0, index).trim();
          if (isEnemySpellMetadataKey(label) || !isEnemySpellRowKey(label))
            return null;
          return {
            label: prettifyEnemySpellLabel(label),
            spells: line.slice(index + 1).trim(),
          };
        }
        return null;
      })
      .filter((row) => row && (row.label || row.spells));
  }
}

function normalizeEnemySpellSource(value = {}, fallbackTitle = "Spells") {
  let parsed = value || {};
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = { rows: normalizeEnemySpellRows(parsed) };
    }
  }
  const source =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : { rows: normalizeEnemySpellRows(parsed) };
  return {
    title: source.title || fallbackTitle,
    className: source.className || "",
    cl: source.cl ?? "",
    concentration: source.concentration ?? "",
    rows: normalizeEnemySpellRows(source.rows || source),
  };
}

function collectEnemySpellRows(containerId) {
  return [
    ...(el(containerId)?.querySelectorAll("[data-enemy-spell-row]") || []),
  ]
    .map((row) => ({
      label: row.querySelector("[data-enemy-spell-label]")?.value?.trim() || "",
      spells: row.querySelector("[data-enemy-spell-list]")?.value?.trim() || "",
    }))
    .filter((row) => row.label || row.spells);
}

function collectEnemySpellSource(group) {
  const source = normalizeEnemySpellSource(
    el(group.hiddenId)?.value || "{}",
    group.title,
  );
  source.rows = collectEnemySpellRows(group.rowsId);
  return source;
}

const ENEMY_SPELL_GROUPS = [
  { title: "Spells", hiddenId: "enemySpells", rowsId: "enemySpellRows" },
  {
    title: "Spells Known",
    hiddenId: "enemySpellsKnown",
    rowsId: "enemySpellsKnownRows",
  },
  {
    title: "Spells Prepared",
    hiddenId: "enemySpellsPrepared",
    rowsId: "enemySpellsPreparedRows",
  },
  {
    title: "Psychic Magic",
    hiddenId: "enemyPsychicMagic",
    rowsId: "enemyPsychicMagicRows",
  },
];

function renderEnemySpellRows(containerId, hiddenId, emptyText) {
  const container = el(containerId);
  if (!container) return;
  const rows = normalizeEnemySpellRows(el(hiddenId)?.value || "");
  container.innerHTML = rows.length
    ? `${enemySpellGridHeader()}${rows.map((row) => enemySpellRowMarkup(row)).join("")}`
    : `<div class="small-text" data-enemy-spell-empty>${emptyText}</div>`;
}

function enemySpellSourceMeta(source) {
  return [
    source.className || "",
    source.cl !== "" && source.cl !== null && source.cl !== undefined
      ? `CL ${source.cl}`
      : "",
    source.concentration !== "" &&
    source.concentration !== null &&
    source.concentration !== undefined
      ? `Concentration ${signedEnemyValue(source.concentration)}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function renderEnemySpellGroups() {
  const container = el("enemySpellGroups");
  if (!container) return;
  const groups = ENEMY_SPELL_GROUPS.map((group) => ({
    ...group,
    source: normalizeEnemySpellSource(
      el(group.hiddenId)?.value || "{}",
      group.title,
    ),
  }));
  container.innerHTML = groups
    .map(
      (group) => `
      <div class="enemy-spell-source" data-enemy-spell-source="${group.rowsId}">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div>
            <div class="enemy-spell-source-title">${escapeHtml(group.source.title || group.title)}</div>
            ${enemySpellSourceMeta(group.source) ? `<div class="enemy-spell-source-meta">${escapeHtml(enemySpellSourceMeta(group.source))}</div>` : ""}
          </div>
          <button class="btn btn-outline-info btn-sm" type="button" onclick="addEnemySpellRow('${group.rowsId}')">Add</button>
        </div>
        <div id="${group.rowsId}" class="enemy-spell-grid" data-enemy-spell-hidden="${group.hiddenId}">
          ${
            group.source.rows.length
              ? `${enemySpellGridHeader()}${group.source.rows.map((row) => enemySpellRowMarkup(row)).join("")}`
              : `<div class="small-text" data-enemy-spell-empty>No entries.</div>`
          }
        </div>
      </div>
    `,
    )
    .join("");
}

function enemySpellGridHeader(options = {}) {
  const readonly = options.readonly === true;
  return `
    <div class="enemy-spell-header${readonly ? " character-spell-like-row" : ""}" data-enemy-spell-header>
      <span>Frequency / Level</span>
      <span>Spells</span>
      ${readonly ? "" : "<span></span>"}
    </div>
  `;
}

function enemySpellRowMarkup(row = {}, options = {}) {
  const readonly = options.readonly === true;
  const deleteButton = readonly
    ? ""
    : `<button class="btn btn-outline-danger btn-sm enemy-spell-delete" type="button" data-delete-enemy-spell-row aria-label="Delete row"><i class="bi bi-trash"></i></button>`;
  return `
      <div class="enemy-spell-row${readonly ? " character-spell-like-row" : ""}" data-enemy-spell-row>
        <input class="form-control form-control-sm sheet-input enemy-auto-input" data-enemy-spell-label value="${escapeHtml(row.label || "")}" aria-label="Frequency or spell level"${readonly ? " readonly" : ""}>
        <textarea class="form-control form-control-sm sheet-input" data-enemy-spell-list aria-label="Spells"${readonly ? " readonly" : ""}>${escapeHtml(row.spells || "")}</textarea>
        ${deleteButton}
      </div>
    `;
}

function addEnemySpellRow(containerId) {
  const container = el(containerId);
  if (!container) return;
  container.querySelector("[data-enemy-spell-empty]")?.remove();
  if (!container.querySelector("[data-enemy-spell-header]")) {
    const header = document.createElement("div");
    header.innerHTML = enemySpellGridHeader().trim();
    container.appendChild(header.firstElementChild);
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = enemySpellRowMarkup({ label: "", spells: "" }).trim();
  const row = wrapper.firstElementChild;
  container.appendChild(row);
  attachInputListeners(row);
  updateEnemyAutoInputSizes(row);
  autosizeEnemyTextareas(row);
  row.querySelector("[data-enemy-spell-label]")?.focus();
  syncEnemyStructuredSpellFields();
  queueSheetSave();
}

function deleteEnemySpellRow(button) {
  const row = button.closest("[data-enemy-spell-row]");
  const container = row?.parentElement;
  if (!row || !container) return;
  row.remove();
  if (!container.querySelector("[data-enemy-spell-row]")) {
    container.querySelector("[data-enemy-spell-header]")?.remove();
    container.innerHTML = `<div class="small-text" data-enemy-spell-empty>No entries.</div>`;
  }
  syncEnemyStructuredSpellFields();
  queueSheetSave();
}

function autosizeEnemyTextareas(root = document) {
  root
    .querySelectorAll(".enemy-spell-row textarea, .enemy-auto-textarea")
    .forEach((textarea) => {
      if (textarea.closest(".character-spell-like-row")) return;
      const baseHeight = textarea.classList.contains("enemy-header-control")
        ? 31
        : 0;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(baseHeight, textarea.scrollHeight)}px`;
    });
}

function renderEnemyStructuredSpellFields() {
  if (!isEnemySheetMode) return;
  el("sheetSpellLikeSection")?.classList.remove("d-none");
  renderEnemySpellRows(
    "spellLikeAbilityRows",
    "spellLikeAbilities",
    "No spell-like abilities.",
  );
  renderEnemySpellGroups();
  updateEnemyAutoInputSizes();
  autosizeEnemyTextareas();
}

function spellLikeAbilityDisplayName(entry = {}) {
  return entry.spellName || entry.spell?.name || entry.name || "";
}

function spellLikeChoiceListName(entry = {}) {
  return (
    spellLikeChoiceList(entry)?.name ||
    entry.spellChoiceListName ||
    entry.spellListName ||
    ""
  );
}

function spellLikeChoiceKey(buff = {}, entry = {}) {
  const choiceList = spellLikeChoiceList(entry);
  return [
    buff.source || buff.name || "effect",
    buff.id || "",
    entry.spellChoiceListId || choiceList?.id || choiceList?.name || "",
    entry.frequency || "",
    spellLikeMinimumLevel(entry),
    spellLikeCastingAttrKey(entry),
    spellLikeMinimumScore(entry),
  ].join("|");
}

function spellLikeChoiceSpellOptions(choiceList = {}) {
  return (choiceList.items || [])
    .map((item) => ({
      name: item.name || item.spellName || item.label || item.value,
      spellName: item.name || item.spellName || item.label || item.value,
    }))
    .filter((spell) => spell.name);
}

async function chooseSheetSpellLikeAbility(choiceKey = "") {
  const config = spellLikeChoiceConfigs.get(choiceKey);
  if (!config || !window.PFMagicSearchModal) return;
  const picked = await window.PFMagicSearchModal.open({
    title: `${config.source || "Effect"}: Choose SLA`,
    spells: spellLikeChoiceSpellOptions(config.choiceList),
  });
  if (!picked) return;
  selectedSpellLikeChoices[choiceKey] = {
    spellName: picked.name || picked.spellName || "Spell",
  };
  recalculateSheet();
  queueSheetSave();
}

function spellLikeMinimumLevel(entry = {}) {
  const value = Number(entry.minimumLevel ?? entry.level ?? 1);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function spellLikeCastingAttrKey(entry = {}) {
  const raw = String(
    entry.castingAttr || entry.castingAbility || entry.ability || "",
  )
    .trim()
    .toLowerCase();
  const aliases = {
    str: "str",
    strength: "str",
    dex: "dex",
    dexterity: "dex",
    con: "con",
    constitution: "con",
    int: "int",
    intelligence: "int",
    wis: "wis",
    wisdom: "wis",
    cha: "cha",
    charisma: "cha",
  };
  return aliases[raw] || "";
}

function spellLikeMinimumScore(entry = {}) {
  const value = Number(
    entry.minimumScore ?? entry.minimumAbilityScore ?? entry.score,
  );
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function spellLikeRequirementText(entry = {}) {
  const attr = spellLikeCastingAttrKey(entry);
  const minimumScore = spellLikeMinimumScore(entry);
  return attr && minimumScore ? `${attr.toUpperCase()} ${minimumScore}` : "";
}

function spellLikeAbilityMeetsScoreRequirement(entry = {}) {
  const attr = spellLikeCastingAttrKey(entry);
  const minimumScore = spellLikeMinimumScore(entry);
  if (!attr || !minimumScore) return true;
  return Number(abilityDisplayValue(attr) || 0) >= minimumScore;
}

function spellLikeAbilityIsUnlocked(entry = {}) {
  return (
    (num("characterLevel") || 1) >= spellLikeMinimumLevel(entry) &&
    spellLikeAbilityMeetsScoreRequirement(entry)
  );
}

function collectCharacterSpellLikeRows() {
  const grouped = new Map();
  const pendingChoices = [];
  spellLikeChoiceConfigs = new Map();
  spellLikeDetailConfigs = new Map();
  let detailIndex = 0;
  calculationBuffs().forEach((buff) => {
    (Array.isArray(buff.spellLikeAbilities)
      ? buff.spellLikeAbilities
      : []
    ).forEach((entry) => {
      if (!spellLikeAbilityIsUnlocked(entry)) return;
      const choiceList = spellLikeChoiceList(entry);
      const choiceKey = choiceList ? spellLikeChoiceKey(buff, entry) : "";
      const chosen = choiceKey ? selectedSpellLikeChoices[choiceKey] : null;
      if (choiceList && !chosen) {
        spellLikeChoiceConfigs.set(choiceKey, {
          source: buff.name || buff.source || "Effect",
          entry,
          choiceList,
        });
        pendingChoices.push({
          key: choiceKey,
          source: buff.name || buff.source || "Effect",
          listName: choiceList.name || "SLA list",
          frequency: String(entry.frequency || "At will").trim() || "At will",
        });
        return;
      }
      const effectiveEntry = chosen
        ? { ...entry, spellName: chosen.spellName }
        : entry;
      const spellName = spellLikeAbilityDisplayName(effectiveEntry);
      if (!spellName) return;
      const label = String(effectiveEntry.frequency || "At will").trim() || "At will";
      const group = grouped.get(label) || { spells: new Map(), plain: new Set() };
      const normalizedName = spellName.toLowerCase().trim();
      if (!group.spells.has(normalizedName)) {
        const key = `spell-like-detail-${detailIndex++}`;
        group.spells.set(normalizedName, { key, name: spellName });
        spellLikeDetailConfigs.set(key, {
          source: buff.name || buff.source || "Spell-Like Ability",
          entry: effectiveEntry,
          spellName,
        });
      }
      grouped.set(label, group);
    });
  });
  collectGrantedDomains().forEach((grant) => {
    const powers = Array.isArray(grant.domain?.grantedPowers)
      ? grant.domain.grantedPowers
      : [];
    if (!powers.length) return;
    const label = `${grant.name || "Domain"} Domain Powers`;
    const group = grouped.get(label) || { spells: new Map(), plain: new Set() };
    powers.forEach((power) => {
      const name = String(power.name || "").trim();
      if (!name) return;
      const type = String(power.abilityType || power.type || "").trim();
      group.plain.add(type ? `${name} (${type})` : name);
    });
    grouped.set(label, group);
  });
  return {
    rows: [...grouped.entries()].map(([label, group]) => ({
      label,
      entries: [...group.spells.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      plain: [...group.plain].sort((a, b) => a.localeCompare(b)),
    })),
    pendingChoices,
  };
}

function characterSpellLikeRowMarkup(row = {}) {
  const spells = (row.entries || [])
    .map(
      (entry) =>
        `<button class="character-spell-like-link" type="button" data-spell-like-detail="${escapeHtml(entry.key)}">${escapeHtml(entry.name)}</button>`,
    )
    .join('<span class="character-spell-like-separator">, </span>');
  const plain = (row.plain || []).map(escapeHtml).join(", ");
  const separator = spells && plain ? '<span class="character-spell-like-separator">, </span>' : "";
  return `
    <div class="enemy-spell-row character-spell-like-row" data-enemy-spell-row>
      <input class="form-control form-control-sm sheet-input enemy-auto-input" value="${escapeHtml(row.label || "")}" aria-label="Frequency or spell level" readonly>
      <div class="form-control form-control-sm sheet-input character-spell-like-list" aria-label="Spells">${spells}${separator}${plain}</div>
    </div>
  `;
}

function renderCharacterSpellLikeAbilities() {
  const section = el("characterSpellLikeSection");
  const container = el("characterSpellLikeRows");
  if (!section || !container) return;
  if (isEnemySheetMode) {
    section.classList.add("d-none");
    container.innerHTML = "";
    return;
  }
  const { rows, pendingChoices } = collectCharacterSpellLikeRows();
  section.classList.toggle("d-none", !rows.length && !pendingChoices.length);
  const pendingHtml = pendingChoices.length
    ? `<div class="character-spell-like-choices">${pendingChoices
        .map(
          (choice) => `
        <div class="character-spell-like-choice">
          <div>
            <div class="fw-semibold">${escapeHtml(choice.frequency)}: ${escapeHtml(choice.listName)}</div>
            <small>${escapeHtml(choice.source)}</small>
          </div>
          <button class="btn btn-outline-info btn-sm" type="button" data-spell-like-choice="${escapeHtml(choice.key)}">Choose SLA</button>
        </div>
      `,
        )
        .join("")}</div>`
    : "";
  container.innerHTML = rows.length
    ? `${enemySpellGridHeader({ readonly: true })}${rows
        .map(characterSpellLikeRowMarkup)
        .join("")}${pendingHtml}`
    : pendingHtml;
  container.querySelectorAll("[data-spell-like-choice]").forEach((button) => {
    button.addEventListener("click", () =>
      chooseSheetSpellLikeAbility(button.dataset.spellLikeChoice),
    );
  });
  container.querySelectorAll("[data-spell-like-detail]").forEach((button) => {
    button.addEventListener("click", () =>
      openCharacterSpellLikeDetails(button.dataset.spellLikeDetail),
    );
  });
  updateEnemyAutoInputSizes(container);
  autosizeEnemyTextareas(container);
}

function syncEnemyStructuredSpellFields() {
  if (el("spellLikeAbilities"))
    el("spellLikeAbilities").value = JSON.stringify(
      collectEnemySpellRows("spellLikeAbilityRows"),
    );
  ENEMY_SPELL_GROUPS.forEach((group) => {
    if (el(group.hiddenId) && el(group.rowsId))
      el(group.hiddenId).value = JSON.stringify(collectEnemySpellSource(group));
  });
}

function updateEnemyAutoInputSizes(root = document) {
  root.querySelectorAll(".enemy-auto-input").forEach((input) => {
    const length = String(input.value || input.placeholder || "").length;
    input.size = Math.max(7, Math.min(44, length || 7));
  });
}

function parseScalingKeys(value) {
  const matches = String(value || "")
    .toLowerCase()
    .match(/\b(str|dex|con|int|wis|cha)\b/g);
  return matches ? [...new Set(matches)] : [];
}

function scalingOptionButtons(name, value = "STR") {
  const selected = parseScalingKeys(value).map((key) => key.toUpperCase());
  const active = selected.length ? selected : ["STR"];
  return `
    <input data-field="${name}" class="sheet-input" type="hidden" value="${escapeHtml(active.join(" + "))}">
    <div class="scale-options" data-scale-options="${name}">
      ${SCALE_ABILITIES.map(
        (ability) => `
        <button class="btn btn-sm ${active.includes(ability) ? "btn-primary" : "btn-outline-light"}" type="button" data-scale-ability="${ability}">${ability}</button>
      `,
      ).join("")}
    </div>
  `;
}

function attachScalingControls(root = document) {
  root.querySelectorAll("[data-scale-options]").forEach((group) => {
    if (group.dataset.bound === "true") return;
    group.dataset.bound = "true";
    const field = group.dataset.scaleOptions;
    const hidden = group.parentElement.querySelector(`[data-field="${field}"]`);
    group.querySelectorAll("[data-scale-ability]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [...group.querySelectorAll(".btn-primary")].map(
          (btn) => btn.dataset.scaleAbility,
        );
        hidden.value = (selected.length ? selected : ["STR"]).join(" + ");
        recalculateSheet();
        queueSheetSave();
      });
    });
  });
}

function isRangedWeaponType(type) {
  return [
    "Ranged Weapon",
    "Firearm (One-Handed)",
    "Firearm (Two-Handed)",
  ].includes(type);
}

function isFirearmWeaponType(type) {
  return String(type || "").includes("Firearm");
}

function isNaturalWeaponType(type) {
  return String(type || "") === "Natural Weapon";
}

function isMeleeWeaponType(type) {
  return !isRangedWeaponType(type);
}

function isTwoHandedWeaponType(type) {
  return ["Melee Weapon (Two-Handed)", "Firearm (Two-Handed)"].includes(type);
}

function isLightOffHandWeaponType(type) {
  return ["Melee Weapon (Light)", "Natural Weapon"].includes(type);
}

function naturalAttackKindFromName(name = "") {
  const text = String(name || "").toLowerCase();
  if (/\bbite\b/.test(text)) return "Bite";
  if (/\bclaws?\b/.test(text)) return "Claw";
  if (/\bgore\b/.test(text)) return "Gore";
  if (/\bhoof\b|\bhooves\b|\btentacles?\b|\bwings?\b/.test(text))
    return "Hoof, Tentacle, Wing";
  if (/\bpincers?\b|\btail\s+slap\b|\btail\b/.test(text))
    return "Pincers, Tail Slap";
  if (/\bslams?\b/.test(text)) return "Slam";
  if (/\bstings?\b/.test(text)) return "Sting";
  if (/\btalons?\b/.test(text)) return "Talons";
  return "Other";
}

function naturalAttackData(card) {
  if (!card) return null;
  const weaponType =
    card.querySelector('[data-field="weaponType"]')?.value || "";
  if (!isNaturalWeaponType(weaponType)) return null;
  const explicitKind =
    card.querySelector('[data-field="naturalAttackKind"]')?.value || "";
  const name = card.querySelector('[data-field="name"]')?.value || "";
  const kind = NATURAL_ATTACK_DAMAGE_BY_SIZE[explicitKind]
    ? explicitKind
    : naturalAttackKindFromName(name);
  return {
    kind,
    ...(NATURAL_ATTACK_DAMAGE_BY_SIZE[kind] || NATURAL_ATTACK_DAMAGE_BY_SIZE.Other),
  };
}

function naturalAttackDice(card) {
  const data = naturalAttackData(card);
  if (!data) return "";
  const sizeKey = String(finalCreatureSize().name || "Medium").toLowerCase();
  return data[sizeKey] || "";
}

const TWF_MODE_FIELDS = [
  "twfNoFeatPrimary",
  "twfNoFeatOff",
  "twfFeatPrimary",
  "twfFeatOff",
];
const TWF_PRIMARY_FIELDS = ["twfNoFeatPrimary", "twfFeatPrimary"];
const TWF_OFFHAND_FIELDS = ["twfNoFeatOff", "twfFeatOff"];
const INVENTORY_WEAPON_ATTACK_OPTION_IDS = {
  twoHanded: "inventoryTwoHanded",
  powerAttack: "inventoryPowerAttack",
  deadlyAim: "inventoryDeadlyAim",
  rapidShot: "inventoryRapidShot",
  twfNoFeatPrimary: "inventoryTwfNoFeatPrimary",
  twfNoFeatOff: "inventoryTwfNoFeatOff",
  twfFeatPrimary: "inventoryTwfFeatPrimary",
  twfFeatOff: "inventoryTwfFeatOff",
  improvedTwf: "inventoryImprovedTwf",
  greaterTwf: "inventoryGreaterTwf",
};

function twfMode(card) {
  const active = TWF_MODE_FIELDS.find(
    (field) => card.querySelector(`[data-field="${field}"]`)?.checked,
  );
  if (!active)
    return { field: "", primary: false, offhand: false, feat: false };
  return {
    field: active,
    primary: TWF_PRIMARY_FIELDS.includes(active),
    offhand: TWF_OFFHAND_FIELDS.includes(active),
    feat: ["twfFeatPrimary", "twfFeatOff"].includes(active),
  };
}

function twfPenalty(mode, offHandLight) {
  if (!mode?.field) return 0;
  if (mode.feat) return offHandLight ? -2 : -4;
  if (mode.primary) return offHandLight ? -4 : -6;
  return offHandLight ? -8 : -10;
}

function activeOffhandWeaponCards() {
  return [...el("weaponRows").querySelectorAll(".sheet-card")].filter(
    (card) => twfMode(card).offhand,
  );
}

function activePrimaryWeaponCards() {
  return [...el("weaponRows").querySelectorAll(".sheet-card")].filter(
    (card) => twfMode(card).primary,
  );
}

function activeRapidShotCard() {
  return (
    [...el("weaponRows").querySelectorAll(".sheet-card")].find((card) => {
      const rapidShot = card.querySelector('[data-field="rapidShot"]');
      return Boolean(rapidShot?.checked);
    }) || null
  );
}

function syncTwfFeatControls(card) {
  const mode = twfMode(card);
  const eligible = mode.offhand && mode.feat;
  card
    .querySelectorAll("[data-twf-offhand-feat-option]")
    .forEach((node) => node.classList.toggle("d-none", !eligible));
  if (!eligible) {
    ["improvedTwf", "greaterTwf"].forEach((field) => {
      const input = card.querySelector(`[data-field="${field}"]`);
      if (input) input.checked = false;
    });
  }
}

function enforceTwfChoice(input) {
  const card = input.closest(".sheet-card");
  if (!card || !input.checked) {
    if (card) syncTwfFeatControls(card);
    return;
  }
  const field = input.dataset.field;
  if (field === "twoHanded") {
    [...TWF_MODE_FIELDS, "improvedTwf", "greaterTwf"].forEach((twfField) => {
      const twfInput = card.querySelector(`[data-field="${twfField}"]`);
      if (twfInput) twfInput.checked = false;
    });
    syncTwfFeatControls(card);
    return;
  }
  if (TWF_MODE_FIELDS.includes(field)) {
    const twoHanded = card.querySelector('[data-field="twoHanded"]');
    if (twoHanded) twoHanded.checked = false;
    TWF_MODE_FIELDS.forEach((otherField) => {
      if (otherField === field) return;
      const other = card.querySelector(`[data-field="${otherField}"]`);
      if (other) other.checked = false;
    });
    if (TWF_PRIMARY_FIELDS.includes(field)) {
      el("weaponRows")
        .querySelectorAll(".sheet-card")
        .forEach((otherCard) => {
          if (otherCard === card) return;
          TWF_PRIMARY_FIELDS.forEach((primaryField) => {
            const other = otherCard.querySelector(
              `[data-field="${primaryField}"]`,
            );
            if (other) other.checked = false;
          });
        });
    }
  }
  if (field === "greaterTwf") {
    const improved = card.querySelector('[data-field="improvedTwf"]');
    if (improved) improved.checked = true;
  }
  syncTwfFeatControls(card);
}

function enforceRapidShotChoice(input) {
  const card = input.closest(".sheet-card");
  if (!card || !input.checked) return;
  el("weaponRows")
    .querySelectorAll(".sheet-card")
    .forEach((otherCard) => {
      if (otherCard === card) return;
      const rapidShot = otherCard.querySelector('[data-field="rapidShot"]');
      if (rapidShot) rapidShot.checked = false;
    });
}

function attachTwfControls(card) {
  card
    .querySelectorAll("[data-twf-option], [data-field='twoHanded']")
    .forEach((input) => {
      if (input.dataset.twfBound === "true") return;
      input.dataset.twfBound = "true";
      input.addEventListener("change", () => {
        enforceTwfChoice(input);
        recalculateSheet();
        queueSheetSave();
      });
    });
  syncTwfFeatControls(card);
}

function attachRapidShotControls(card) {
  const input = card.querySelector('[data-field="rapidShot"]');
  if (!input || input.dataset.rapidShotBound === "true") return;
  input.dataset.rapidShotBound = "true";
  input.addEventListener("change", () => {
    enforceRapidShotChoice(input);
    recalculateSheet();
    queueSheetSave();
  });
}

function normalizeTwfWeaponChoices() {
  let primarySeen = false;
  el("weaponRows")
    .querySelectorAll(".sheet-card")
    .forEach((card) => {
      const activeModes = TWF_MODE_FIELDS.filter(
        (field) => card.querySelector(`[data-field="${field}"]`)?.checked,
      );
      activeModes.slice(1).forEach((field) => {
        const input = card.querySelector(`[data-field="${field}"]`);
        if (input) input.checked = false;
      });
      const mode = twfMode(card);
      if (mode.primary) {
        if (primarySeen) {
          TWF_PRIMARY_FIELDS.forEach((field) => {
            const input = card.querySelector(`[data-field="${field}"]`);
            if (input) input.checked = false;
          });
        } else {
          primarySeen = true;
        }
      }
      syncTwfFeatControls(card);
    });
}

function syncWeaponTypeControls(card, resetToggles = false) {
  const weaponType =
    card.querySelector('[data-field="weaponType"]')?.value ||
    "Melee Weapon (One-Handed)";
  const melee = isMeleeWeaponType(weaponType);
  const firearm = isFirearmWeaponType(weaponType);
  card
    .querySelectorAll("[data-melee-weapon-option]")
    .forEach((node) => node.classList.toggle("d-none", !melee));
  card
    .querySelectorAll("[data-ranged-weapon-option]")
    .forEach((node) => node.classList.toggle("d-none", melee));
  card
    .querySelectorAll("[data-firearm-weapon-option]")
    .forEach((node) => node.classList.toggle("d-none", !firearm));
  if (resetToggles) {
    [
      "twoHanded",
      "powerAttack",
      "deadlyAim",
      "rapidShot",
      ...TWF_MODE_FIELDS,
      "improvedTwf",
      "greaterTwf",
    ].forEach((field) => {
      const input = card.querySelector(`[data-field="${field}"]`);
      if (input) input.checked = false;
    });
    if (!firearm) {
      ["capacity", "misfire"].forEach((field) => {
        const input = card.querySelector(`[data-field="${field}"]`);
        if (input) input.value = "";
      });
    }
  }
}

function attachWeaponTypeControls(card) {
  const select = card.querySelector('[data-field="weaponType"]');
  if (!select || select.dataset.bound === "true") return;
  select.dataset.bound = "true";
  syncWeaponTypeControls(card);
  select.addEventListener("change", () => {
    syncWeaponTypeControls(card, true);
    recalculateSheet();
    queueSheetSave();
  });
}

function parseScalingTerms(value, fallback = "STR") {
  const text = String(value || fallback).toLowerCase();
  const terms = [];
  const pattern = /\b(str|dex|con|int|wis|cha)\b/g;
  let match;
  while ((match = pattern.exec(text))) {
    terms.push({ multiplier: 1, key: match[1] });
  }
  if (terms.length) return terms;
  return fallback &&
    String(value || "").toLowerCase() !== String(fallback).toLowerCase()
    ? parseScalingTerms(fallback, "")
    : [];
}

function stripDamageModifier(value) {
  const text = String(value || "").trim();
  return text.replace(/\s*[+-]\s*\d+\s*$/, "").trim() || text;
}

function buffCauseForStat(buffed, statName) {
  const items = buffed?.breakdown?.[statName] || [];
  const causes = items
    .filter((item) => !["Base", "Formula"].includes(item.source))
    .filter((item) => item.applied !== false)
    .map((item) =>
      `${item.source} ${signed(Number(item.value || 0))} ${item.type || ""}`.trim(),
    );
  return causes.length ? causes.join(", ") : "no active buff modifiers";
}

function breakdownForStat(buffed, statName, detailPrefix = "") {
  const items = buffed?.breakdown?.[statName] || [];
  if (!items.length) return [];
  return items
    .filter((item) => !["Base", "Formula"].includes(item.source))
    .map((item) =>
      detailPrefix
        ? {
            ...item,
            detail: item.detail
              ? `${detailPrefix}: ${item.detail}`
              : detailPrefix,
          }
        : item,
    );
}

function weaponBuffResult(
  buffed,
  buffBonuses,
  statNames,
  weaponType,
  weaponName = "",
) {
  if (window.PFBuffs?.weaponBonusesForStats) {
    return window.PFBuffs.weaponBonusesForStats(
      buffed,
      statNames,
      weaponType,
      weaponName,
    );
  }
  return {
    total: statNames.reduce(
      (total, stat) => total + Number(buffBonuses?.[stat] || 0),
      0,
    ),
    breakdown: statNames.flatMap((stat) => breakdownForStat(buffed, stat)),
  };
}

function weaponBuffBreakdown(result = {}, genericStat = "") {
  return (result.breakdown || []).map((item) => ({
    ...item,
    targetLabel:
      item.stat === genericStat
        ? titleCaseStat(genericStat)
        : titleCaseStat(item.stat || genericStat),
  }));
}

function combinedBreakdowns(buffed, entries = []) {
  return entries.flatMap((entry) => {
    if (typeof entry === "string") return breakdownForStat(buffed, entry);
    return breakdownForStat(buffed, entry.stat, entry.detail).map((item) => ({
      ...item,
      targetLabel: entry.target || item.targetLabel,
    }));
  });
}

function skillBuffKeyForAbility(abilityKey) {
  const statName = ABILITY_STAT_NAMES[abilityKey];
  return statName ? `${statName} skill checks` : "";
}

function skillStatKey(skill) {
  return `skill:${normalizeSkillName(skill)}`;
}

function skillFamilyBonusKey(skill) {
  const name = String(skill || "").trim();
  if (/^craft(?:\s*\(|\b)/i.test(name)) return "craft skill checks";
  if (/^profession(?:\s*\(|\b)/i.test(name)) return "profession skill checks";
  if (/^perform(?:\s*\(|\b)/i.test(name)) return "perform skill checks";
  return "";
}

function isKnowledgeSkill(skill) {
  return /^knowledge(?:\s*\(|\b)/i.test(String(skill || "").trim());
}

function genericSkillStatKey(skill) {
  const name = String(skill || "").trim();
  if (/^craft(?:\s*\(|\b)/i.test(name)) return "skill:craft";
  if (/^profession(?:\s*\(|\b)/i.test(name)) return "skill:profession";
  if (/^perform(?:\s*\(|\b)/i.test(name)) return "skill:perform";
  return "";
}

function classSkillSetHasSkill(keys, skill) {
  const specificKey = skillStatKey(skill);
  const genericKey = genericSkillStatKey(skill);
  return keys.has(specificKey) || Boolean(genericKey && keys.has(genericKey));
}

function skillTrainingBonusKey(skill) {
  const status = window.PFEffectStats?.skillTrainingStatus?.(skill);
  if (status === "trained") return "trained skill checks";
  if (status === "untrained") return "untrained skill checks";
  return "";
}

function skillFamilyLabel(stat) {
  return (
    {
      "craft skill checks": "Craft skills",
      "profession skill checks": "Profession skills",
      "perform skill checks": "Perform skills",
      "class skill checks": "Class skills",
      "class knowledge skill checks": "Class Knowledge skills",
      "trained skill checks": "Trained skills",
      "untrained skill checks": "Untrained skills",
    }[stat] || ""
  );
}

function iterativeBabBonuses(bab) {
  const first = Number(bab || 0);
  if (first < 1) return [first];
  const bonuses = [];
  for (let value = first; value >= 1; value -= 5) bonuses.push(value);
  return bonuses;
}

function optionList(options, selected = "") {
  return options
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${value || "None"}</option>`,
    )
    .join("");
}

function selectOption(value, label = value, selected = "") {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label || value || "None")}</option>`;
}

function normalizeAlignmentValue(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  const upper = text.toUpperCase();
  if (ALIGNMENT_BY_CODE[upper]) return ALIGNMENT_BY_CODE[upper];
  return ALIGNMENT_BY_CODE[ALIGNMENT_CODE_BY_NAME[text.toLowerCase()]] || text;
}

function alignmentOptions(selected = "") {
  const normalized = normalizeAlignmentValue(selected);
  return [
    selectOption("", "None", normalized),
    ...ALIGNMENTS.map(([, name]) => selectOption(name, name, normalized)),
  ].join("");
}

function raceOptions(selected = "") {
  const normalized = String(selected || "").trim();
  const knownNames = new Set(
    (raceDefinitions.races || []).map((race) => race.name),
  );
  const raceBySlug = new Map(
    (raceDefinitions.races || []).map((race) => [
      race.slug || raceKey(race.name || race.race || ""),
      race,
    ]),
  );
  const raceFromGroupEntry = (entry) => {
    if (!entry) return null;
    if (typeof entry === "string") return raceBySlug.get(entry) || null;
    return entry.name || entry.race
      ? entry
      : raceBySlug.get(entry.slug || raceKey(entry.name || entry.race || ""));
  };
  const customOption =
    normalized && !knownNames.has(normalized)
      ? selectOption(normalized, normalized, normalized)
      : "";
  const groups = (raceDefinitions.groups || [])
    .map(
      (group) => `
    <optgroup label="${escapeHtml(group.name)}">
      ${(group.races || [])
        .map(raceFromGroupEntry)
        .filter(Boolean)
        .map((race) => selectOption(race.name, race.name, normalized))
        .join("")}
    </optgroup>
  `,
    )
    .join("");
  return `${selectOption("", "None", normalized)}${customOption}${groups}`;
}

function raceKey(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function selectedRaceDefinition() {
  const selected = el("race")?.value || "";
  if (!selected) return null;
  const key = raceKey(selected);
  return (
    (raceDefinitions.races || []).find(
      (race) =>
        raceKey(race.name) === key ||
        raceKey(race.race) === key ||
        raceKey(race.slug) === key,
    ) || null
  );
}

function racialTraitKey(value = "") {
  return (
    String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^(?:and|or|the)\s+/i, "")
      .replace(/[^a-z0-9]+/g, "") || ""
  );
}

function racialTraitNameKey(trait = {}) {
  return racialTraitKey(trait.name || trait.trait || "");
}

function normalizeSelectedRacialAlternateTraits(value = []) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (Array.isArray(value?.alternateTraits))
    return value.alternateTraits.map(String).filter(Boolean);
  return [];
}

function normalizeSelectedRacialTraitChoices(value = {}) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function racialTraitChoiceKeyForTrait(trait = {}) {
  return racialTraitNameKey(trait);
}

function racialTraitChoicePools(trait = {}) {
  return Array.isArray(trait.choicePools)
    ? trait.choicePools
    : Array.isArray(trait.pools)
      ? trait.pools
      : [];
}

function airAffinityDomainDcBonus(entry = {}) {
  const filters = Array.isArray(entry.targetFilters)
    ? entry.targetFilters
    : [];
  return (
    Number(entry.adjustments?.[0]?.value ?? entry.value ?? 0) === 1 &&
    filters.some(
      (filter) =>
        String(filter.targetMode || "").toLowerCase() === "domain" &&
        (filter.targets || []).some(
          (target) => domainKey(target) === "air",
        ),
    )
  );
}

function normalizeResolvedRacialTraitMechanics(resolved = {}, sourceTrait = {}) {
  if (racialTraitNameKey(sourceTrait) !== "airaffinity") return resolved;
  const sourceHasSpellDcBonuses =
    Array.isArray(sourceTrait.spellDcBonuses) && sourceTrait.spellDcBonuses.length;
  return {
    ...resolved,
    casterLevelBonuses:
      Array.isArray(sourceTrait.casterLevelBonuses) &&
      sourceTrait.casterLevelBonuses.length
        ? sourceTrait.casterLevelBonuses
        : resolved.casterLevelBonuses,
    spellDcBonuses: sourceHasSpellDcBonuses
      ? resolved.spellDcBonuses
      : (Array.isArray(resolved.spellDcBonuses)
          ? resolved.spellDcBonuses
          : []
        ).filter((entry) => !airAffinityDomainDcBonus(entry)),
  };
}

function resolvedRacialTrait(trait = {}) {
  const hasChoice =
    racialTraitMechanicsHaveChoiceStats(trait) ||
    racialTraitChoicePools(trait).length ||
    (trait.modifiedTraitOverrides || []).some(racialTraitOverrideHasChoiceStats);
  if (!hasChoice) return trait;
  const choices =
    selectedRacialTraitChoices[racialTraitChoiceKeyForTrait(trait)];
  if (!choices || typeof choices !== "object") return trait;
  const resolved = {
    ...trait,
    effects: Array.isArray(choices.effects) ? choices.effects : trait.effects,
    damageReduction: Array.isArray(choices.damageReduction)
      ? choices.damageReduction
      : trait.damageReduction,
    spellResistance: Array.isArray(choices.spellResistance)
      ? choices.spellResistance
      : trait.spellResistance,
    classSkillGrants: Array.isArray(choices.classSkillGrants)
      ? choices.classSkillGrants
      : trait.classSkillGrants,
    bonusRanks: Array.isArray(choices.bonusRanks)
      ? choices.bonusRanks
      : trait.bonusRanks,
    extraRanksPerLevel: Array.isArray(choices.extraRanksPerLevel)
      ? choices.extraRanksPerLevel
      : trait.extraRanksPerLevel,
    featGrants: Array.isArray(choices.featGrants)
      ? choices.featGrants
      : trait.featGrants,
    immunities: Array.isArray(choices.immunities)
      ? choices.immunities
      : trait.immunities,
    applyConditions: Array.isArray(choices.applyConditions)
      ? choices.applyConditions
      : trait.applyConditions,
    spellLikeAbilities: Array.isArray(choices.spellLikeAbilities)
      ? choices.spellLikeAbilities
      : trait.spellLikeAbilities,
    casterLevelBonuses: Array.isArray(choices.casterLevelBonuses)
      ? choices.casterLevelBonuses
      : trait.casterLevelBonuses,
    spellDcBonuses: Array.isArray(choices.spellDcBonuses)
      ? choices.spellDcBonuses
      : trait.spellDcBonuses,
    effectiveAttributeBonuses: Array.isArray(choices.effectiveAttributeBonuses)
      ? choices.effectiveAttributeBonuses
      : trait.effectiveAttributeBonuses,
    grantDomains: Array.isArray(choices.grantDomains)
      ? choices.grantDomains
      : trait.grantDomains,
    generatedEquipment: Array.isArray(choices.generatedEquipment)
      ? choices.generatedEquipment
      : trait.generatedEquipment,
    conditionalVariables: Array.isArray(choices.conditionalVariables)
      ? choices.conditionalVariables
      : trait.conditionalVariables,
    conditionalChoices:
      choices.conditionalChoices && typeof choices.conditionalChoices === "object"
        ? choices.conditionalChoices
        : trait.conditionalChoices,
    activeMechanics:
      choices.activeMechanics && typeof choices.activeMechanics === "object"
        ? choices.activeMechanics
        : trait.activeMechanics,
    modifiedTraitOverrides: Array.isArray(choices.modifiedTraitOverrides)
      ? choices.modifiedTraitOverrides
      : trait.modifiedTraitOverrides,
  };
  if (choices.selectedBranchId) {
    delete resolved.branches;
    resolved.selectedBranchId = choices.selectedBranchId;
    resolved.selectedBranchName = choices.selectedBranchName || "";
  }
  return normalizeResolvedRacialTraitMechanics(resolved, trait);
}

function resolvedRacialAlternateTrait(trait = {}) {
  return resolvedRacialTrait(trait);
}

function removeRacialTraitChoice(trait = {}) {
  const key = racialTraitChoiceKeyForTrait(trait);
  if (!key) return;
  delete selectedRacialTraitChoices[key];
}

function selectedRacialTraitChoicesForSave() {
  const race = selectedRaceDefinition();
  if (!race) return cloneJson(selectedRacialTraitChoices);
  const activatableKeys = new Set(
    [...(race.standardTraits || []), ...(race.alternateTraits || [])]
      .filter(
        (trait) =>
          trait?.activatable ||
          window.PFEffectMechanics?.hasActiveMechanics?.(trait),
      )
      .map(racialTraitChoiceKeyForTrait)
      .filter(Boolean),
  );
  return Object.fromEntries(
    Object.entries(selectedRacialTraitChoices || {}).filter(
      ([key]) => !activatableKeys.has(key),
    ),
  );
}

function abilityForNamedSkillChoice(skillName = "") {
  if (/^craft(?:\s*\(|\b)/i.test(skillName)) return "int";
  if (/^perform(?:\s*\(|\b)/i.test(skillName)) return "cha";
  if (/^profession(?:\s*\(|\b)/i.test(skillName)) return "wis";
  return "int";
}

function ensureNamedSkillChoiceVisible(skillName = "") {
  const name = String(skillName || "").trim();
  if (!name) return;
  const key = normalizeSkillName(name);
  if (allSkills().some(([skill]) => normalizeSkillName(skill) === key)) return;
  const saved = currentSkillValues();
  customSkills.push({ name, ability: abilityForNamedSkillChoice(name) });
  renderSkillRows(saved);
  renderSkillSummaryRows();
}

function conditionalVariables(item = {}) {
  return Array.isArray(item.conditionalVariables)
    ? item.conditionalVariables
    : [];
}

function normalizeConditionalVariableKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ");
}

function replaceConditionalVariableTokens(text = "", choices = {}) {
  return String(text || "").replace(/\{([^{}]+)\}/g, (match, key) => {
    const choice = choices[normalizeConditionalVariableKey(key)];
    return choice ? conditionalVariableTokenValue(key, choice) || match : match;
  });
}

function interpolateConditionalVariables(value, choices = {}) {
  if (Array.isArray(value))
    return value.map((item) => interpolateConditionalVariables(item, choices));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        interpolateConditionalVariables(entry, choices),
      ]),
    );
  }
  if (typeof value === "string")
    return replaceConditionalVariableTokens(value, choices);
  return value;
}

function bonusUsesFavoredEnemyScale(bonus = {}) {
  const source = (bonus.bonusScale || bonus.scale || {}).source || {};
  return (
    source.type === "special" && source.special === "favored-enemy-bonus"
  );
}

function favoredEnemyChoiceLabel(choices = {}) {
  const entry = Object.entries(choices || {}).find(
    ([key]) => normalizeConditionalVariableKey(key) === "favored enemy",
  )?.[1];
  return cleanFavoredEnemyLabel(
    entry?.value || entry?.name || entry?.label || "",
  );
}

function conditionalChoiceLabel(choices = {}, key = "") {
  const wanted = normalizeConditionalVariableKey(key);
  if (!wanted) return "";
  const entry = Object.entries(choices || {}).find(
    ([choiceKey]) => normalizeConditionalVariableKey(choiceKey) === wanted,
  )?.[1];
  return wanted.startsWith("favored enemy")
    ? cleanFavoredEnemyLabel(entry?.value || entry?.name || entry?.label || "")
    : entry?.label || entry?.name || entry?.value || "";
}

function cleanFavoredEnemyLabel(value = "") {
  return String(value || "")
    .replace(/\s*\([+-]?\d+\)\s*$/g, "")
    .trim();
}

function conditionalVariableTokenValue(key = "", choice = {}) {
  const fallback = choice?.label || choice?.name || choice?.value || "";
  return normalizeConditionalVariableKey(key).startsWith("favored enemy")
    ? cleanFavoredEnemyLabel(choice?.value || choice?.name || fallback)
    : fallback;
}

function favoredEnemyTargetText(value = "") {
  const text = String(value || "")
    .replace(/\{[^{}]+\}/g, "")
    .replace(/\s*\([+-]?\d+\)\s*$/g, "")
    .replace(/\b(against|versus|vs\.?|creatures?|enemy|enemies|type|subtype)\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!text || /favou?red enemy/i.test(text)) return "";
  return text;
}

function bonusFavoredEnemyTarget(bonus = {}, buff = {}) {
  return (
    bonus.bonusScale?.favoredEnemyTarget ||
    bonus.bonusScale?.target ||
    bonus.scale?.favoredEnemyTarget ||
    bonus.scale?.target ||
    bonus.favoredEnemyTarget ||
    bonus.targetFavoredEnemy ||
    favoredEnemyChoiceLabel(bonus.conditionalChoices) ||
    conditionalChoiceLabel(bonus.conditionalChoices, "favored enemy increase") ||
    favoredEnemyChoiceLabel(buff.conditionalChoices) ||
    conditionalChoiceLabel(buff.conditionalChoices, "favored enemy increase") ||
    favoredEnemyTargetText(bonus.appliesWhen || "")
  );
}

function needsFavoredEnemyScaleChoice(bonus = {}) {
  if (!bonusUsesFavoredEnemyScale(bonus)) return false;
  return !bonusFavoredEnemyTarget(bonus);
}

function itemHasFavoredEnemyScaleChoice(item = {}) {
  return (Array.isArray(item.effects) ? item.effects : []).some(
    needsFavoredEnemyScaleChoice,
  );
}

function favoredEnemyBonusLooksRelevant(bonus = {}, buff = {}) {
  if (bonus.favoredEnemyBonus || bonus.favoredEnemy) return true;
  const sourceText = [
    bonus.source,
    bonus.name,
    buff.source,
    buff.name,
    buff.category,
  ]
    .filter(Boolean)
    .join(" ");
  return /\bfavou?red\s+enemy\b/i.test(sourceText);
}

function favoredEnemyTargetKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*\([+-]?\d+\)\s*$/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function favoredEnemyBonusAmountRow(bonus = {}, buff = {}) {
  if (!favoredEnemyBonusLooksRelevant(bonus, buff)) return false;
  return String(bonus.stat || "").trim().toLowerCase() === "attack";
}

function addFavoredEnemyOption(byTarget, target = "", bonus = null) {
  const label = String(target || "").trim();
  const key = favoredEnemyTargetKey(label);
  if (!key) return;
  const previous = byTarget.get(key);
  const nextBonus =
    bonus === null || bonus === undefined || bonus === ""
      ? previous?.bonus
      : Number(previous?.bonus || 0) + Number(bonus || 0);
  byTarget.set(key, {
    value: label,
    label,
    name: label,
    favoredEnemyTarget: label,
    bonus: Number.isFinite(nextBonus) ? Number(nextBonus || 0) : null,
  });
}

function characterFavoredEnemyOptions({ additionalTargets = [] } = {}) {
  const buffs = [
    ...collectClassFeatureBuffs(),
    ...activeBuffs,
  ];
  const byTarget = new Map();
  additionalTargets.forEach((target) => addFavoredEnemyOption(byTarget, target));
  buffs.forEach((buff) => {
    (Array.isArray(buff.bonuses) ? buff.bonuses : []).forEach((bonus) => {
      if (!favoredEnemyBonusAmountRow(bonus, buff)) return;
      if (bonusUsesFavoredEnemyScale(bonus)) return;
      const target = bonusFavoredEnemyTarget(bonus, buff);
      const value = window.PFBuffs?.scaledBonusValue
        ? window.PFBuffs.scaledBonusValue(bonus, buff, { activeBuffs: buffs })
        : Number(bonus.value || 0);
      addFavoredEnemyOption(byTarget, target, value);
    });
  });
  return [...byTarget.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveFavoredEnemyScaleTargets(items = [], title = "Effect") {
  const list = Array.isArray(items) ? items : [];
  if (!list.some(needsFavoredEnemyScaleChoice)) return list;
  const options = characterFavoredEnemyOptions();
  if (!options.length) {
    setStatus(
      "Choose the character's favored enemy first, then apply this favored-enemy-scaled effect.",
      "warning",
    );
    return null;
  }
  const resolved = [];
  for (const item of list) {
    if (!needsFavoredEnemyScaleChoice(item)) {
      resolved.push(item);
      continue;
    }
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${title}: Choose Favored Enemy`,
          options,
        })
      : null;
    if (!picked) return null;
    const target =
      typeof picked === "object"
        ? picked.favoredEnemyTarget || picked.name || picked.value
        : String(picked || "");
    if (!target) return null;
    const scale = item.bonusScale || item.scale || {};
    const nextScale = {
      ...scale,
      favoredEnemyTarget: target,
    };
    const genericAppliesWhen =
      !item.appliesWhen || /favou?red enemy|\{[^{}]+\}/i.test(item.appliesWhen);
    resolved.push({
      ...item,
      bonusScale: nextScale,
      favoredEnemyTarget: target,
      conditional: true,
      appliesWhen: genericAppliesWhen
        ? `against ${target}`
        : item.appliesWhen,
    });
  }
  return resolved;
}

async function resolveConditionalVariablesForItem(item = {}, title = "Effect") {
  const variables = conditionalVariables(item)
    .map((variable) => ({
      ...variable,
      key: normalizeConditionalVariableKey(
        variable.key || variable.name || variable.label,
      ),
      poolId:
        variable.poolId ||
        variable.pool ||
        variable.source ||
        "ranger-favored-enemies",
    }))
    .filter((variable) => variable.key);
  if (!variables.length) return item;
  const choices = { ...(item.conditionalChoices || {}) };
  for (const variable of variables) {
    if (choices[variable.key]) continue;
    const pool = window.PFEffectStats?.conditionalVariablePoolById?.(
      variable.poolId,
    );
    const additionalTargets = [
      conditionalChoiceLabel(choices, "favored enemy"),
    ].filter(Boolean);
    const options =
      variable.poolId === "character-favored-enemies"
        ? characterFavoredEnemyOptions({ additionalTargets })
        : (await window.PFEffectStats?.resolveConditionalVariableOptions?.(
            variable.poolId,
          )) || [];
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${title}: Choose ${variable.label || variable.key}`,
          options,
        })
      : null;
    if (!picked) return null;
    const pickedValue =
      typeof picked === "object" ? picked.value : String(picked || "");
    const pickedOption =
      options.find((option) => String(option.value) === pickedValue) ||
      (typeof picked === "object" ? picked : null);
    choices[variable.key] = {
      value: pickedValue,
      label: pickedOption?.label || pickedValue,
      poolId: variable.poolId,
      poolLabel: pool?.label || variable.poolLabel || "",
    };
  }
  return interpolateConditionalVariables(
    {
      ...item,
      conditionalVariables: variables,
      conditionalChoices: choices,
    },
    choices,
  );
}

async function resolveRacialTraitChoiceStats(items, trait = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.some((item) => window.PFEffectStats?.isChoiceStat(item.stat)))
    return list;
  const resolved = [];
  for (const item of list) {
    if (!window.PFEffectStats?.isChoiceStat(item.stat)) {
      resolved.push(item);
      continue;
    }
    const poolId = window.PFEffectStats.choicePoolIdFromStat(item.stat);
    const pool = window.PFEffectStats.poolById(poolId);
    const options = await window.PFEffectStats.resolveChoicePoolOptions(
      poolId,
      {
        skills: allSkills(),
        equipment: currentEffectChoiceEquipment(),
        choicePool: item.choicePool,
      },
    );
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${trait.name || "Racial Trait"}: Choose ${pool?.label || "a Target"}`,
          options,
        })
      : null;
    if (!picked) return null;
    const resolvedItem = window.PFEffectStats.resolveChoiceStatItem(
      item,
      picked,
      options,
    );
    ensureNamedSkillChoiceVisible(resolvedItem.skillName);
    resolved.push(resolvedItem);
  }
  return resolved;
}

function spellLikeChoiceList(entry = {}) {
  return (
    entry.spellChoiceList ||
    window.PFEffectStats?.customSpellLikeListById?.(
      entry.spellChoiceListId || "",
    ) ||
    null
  );
}

function spellLikeAbilityHasChoiceList(entry = {}) {
  return Boolean(spellLikeChoiceList(entry));
}

async function resolveRacialTraitSpellLikeChoices(items, trait = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.some(spellLikeAbilityHasChoiceList)) return list;
  const resolved = [];
  for (const item of list) {
    const choiceList = spellLikeChoiceList(item);
    if (!choiceList) {
      resolved.push(item);
      continue;
    }
    const spells = (choiceList.items || []).map((entry) => ({
      name: entry.name || entry.spellName || entry.label || entry.value,
      spellName: entry.name || entry.spellName || entry.label || entry.value,
    }));
    const picked = window.PFMagicSearchModal
      ? await window.PFMagicSearchModal.open({
          title: `${trait.name || "Racial Trait"}: Choose SLA`,
          spells,
        })
      : null;
    if (!picked) return null;
    const { spellChoiceList, spellChoiceListId, ...rest } = item;
    resolved.push({
      ...rest,
      spellName: picked.name || picked.spellName || "Spell",
    });
  }
  return resolved;
}

function spellAdjustmentEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some((entry) =>
    window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(entry),
  );
}

async function resolveRacialTraitSpellAdjustmentChoices(items, trait = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!spellAdjustmentEntriesNeedChoice(list)) return list;
  if (!window.PFEffectEditor?.resolveSpellAdjustmentChoices) return null;
  return window.PFEffectEditor.resolveSpellAdjustmentChoices(list, {
    title: trait.name || "Effect",
  });
}

function grantDomainEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some((entry) =>
    window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(entry),
  );
}

async function resolveRacialTraitGrantDomainChoices(items, trait = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!grantDomainEntriesNeedChoice(list)) return list;
  if (!window.PFEffectEditor?.resolveGrantDomainChoices) return null;
  return window.PFEffectEditor.resolveGrantDomainChoices(list, {
    title: trait.name || "Effect",
  });
}

async function resolveMechanicBranchChoice(item = {}, title = "Effect") {
  if (!window.PFEffectMechanics?.hasBranches?.(item)) return item;
  return window.PFEffectMechanics.chooseBranch(item, { title });
}

async function resolveRacialTraitMechanicChoices(
  item = {},
  trait = {},
  { resolveBranch = true } = {},
) {
  if (resolveBranch) {
    item = await resolveMechanicBranchChoice(
      item,
      trait.name || item.name || "Effect",
    );
    if (!item) return false;
  }
  const choiceResolvedEffects = await resolveRacialTraitChoiceStats(
    item.effects,
    trait,
  );
  if (!choiceResolvedEffects) return false;
  const resolvedEffects = await resolveFavoredEnemyScaleTargets(
    choiceResolvedEffects,
    trait.name || "Racial Trait",
  );
  if (!resolvedEffects) return false;
  const resolvedClassSkillGrants = await resolveRacialTraitChoiceStats(
    item.classSkillGrants,
    trait,
  );
  if (!resolvedClassSkillGrants) return false;
  const resolvedBonusRanks = await resolveRacialTraitChoiceStats(
    item.bonusRanks,
    trait,
  );
  if (!resolvedBonusRanks) return false;
  const resolvedSpellLikeAbilities = await resolveRacialTraitSpellLikeChoices(
    item.spellLikeAbilities,
    trait,
  );
  if (!resolvedSpellLikeAbilities) return false;
  const resolvedCasterLevelBonuses =
    await resolveRacialTraitSpellAdjustmentChoices(
      item.casterLevelBonuses,
      trait,
    );
  if (!resolvedCasterLevelBonuses) return false;
  const resolvedSpellDcBonuses = await resolveRacialTraitSpellAdjustmentChoices(
    item.spellDcBonuses,
    trait,
  );
  if (!resolvedSpellDcBonuses) return false;
  const resolvedEffectiveAttributeBonuses =
    await resolveRacialTraitSpellAdjustmentChoices(
      item.effectiveAttributeBonuses,
      trait,
    );
  if (!resolvedEffectiveAttributeBonuses) return false;
  const resolvedGrantDomains = await resolveRacialTraitGrantDomainChoices(
    item.grantDomains,
    trait,
  );
  if (!resolvedGrantDomains) return false;
  return {
    ...item,
    effects: resolvedEffects,
    classSkillGrants: resolvedClassSkillGrants,
    bonusRanks: resolvedBonusRanks,
    spellLikeAbilities: resolvedSpellLikeAbilities,
    casterLevelBonuses: resolvedCasterLevelBonuses,
    spellDcBonuses: resolvedSpellDcBonuses,
    effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses,
    grantDomains: resolvedGrantDomains,
  };
}

function appendRacialTraitChoiceMechanics(target = {}, option = {}) {
  RACIAL_TRAIT_MECHANIC_KEYS.forEach((key) => {
    const rows = Array.isArray(option[key]) ? option[key] : [];
    if (!rows.length) return;
    target[key] = [...(Array.isArray(target[key]) ? target[key] : []), ...rows];
  });
}

async function resolveRacialTraitChoicePools(trait = {}) {
  const pools = racialTraitChoicePools(trait);
  if (!pools.length) {
    return { poolChoices: {}, poolMechanics: {} };
  }
  if (!window.PFClassFeatureChoicePicker) return null;
  const poolChoices = {};
  const poolMechanics = {};
  const saved =
    selectedRacialTraitChoices[racialTraitChoiceKeyForTrait(trait)] || {};
  for (const [index, pool] of pools.entries()) {
    const poolKey = pool.name || `Choice ${index + 1}`;
    const selected = saved.poolChoices?.[poolKey] || "";
    const choice = await PFClassFeatureChoicePicker.open({
      title: `${trait.name || "Racial Trait"}: ${pool.name || "Choose Feature"}`,
      poolName: pool.name || "Racial Trait",
      description: pool.description || "",
      selected,
      options: Array.isArray(pool.options) ? pool.options : [],
    });
    if (choice === null) return null;
    if (!choice) continue;
    const option = (pool.options || []).find((item) => item.name === choice);
    if (!option) continue;
    const resolvedOption = await resolveRacialTraitMechanicChoices(
      option,
      trait,
    );
    if (!resolvedOption) return null;
    poolChoices[poolKey] = choice;
    appendRacialTraitChoiceMechanics(poolMechanics, resolvedOption);
  }
  return { poolChoices, poolMechanics };
}

async function resolveRacialTraitOperationValueChoice(
  key = "",
  value = {},
  trait = {},
) {
  if (key === "effects" || key === "classSkillGrants" || key === "bonusRanks") {
    const resolved = await resolveRacialTraitChoiceStats([value], trait);
    if (!resolved) return null;
    if (key !== "effects") return resolved[0];
    const favoredEnemyResolved = await resolveFavoredEnemyScaleTargets(
      resolved,
      trait.name || "Racial Trait",
    );
    return favoredEnemyResolved ? favoredEnemyResolved[0] : null;
  }
  if (key === "spellLikeAbilities") {
    const resolved = await resolveRacialTraitSpellLikeChoices([value], trait);
    return resolved ? resolved[0] : null;
  }
  if (
    key === "casterLevelBonuses" ||
    key === "spellDcBonuses" ||
    key === "effectiveAttributeBonuses"
  ) {
    const resolved = await resolveRacialTraitSpellAdjustmentChoices([value], trait);
    return resolved ? resolved[0] : null;
  }
  if (key === "grantDomains") {
    const resolved = await resolveRacialTraitGrantDomainChoices([value], trait);
    return resolved ? resolved[0] : null;
  }
  return value;
}

async function resolveRacialTraitOverrideChoices(override = {}, trait = {}) {
  const resolved = {
    ...override,
    mechanicOverrides: {},
    activeMechanicOverrides: {},
  };
  for (const operationMapName of [
    "mechanicOverrides",
    "activeMechanicOverrides",
  ]) {
    for (const [key, operations] of Object.entries(
      override[operationMapName] || {},
    )) {
      resolved[operationMapName][key] = [];
      for (const operation of Array.isArray(operations) ? operations : []) {
        if (!["add", "replace"].includes(operation.action)) {
          resolved[operationMapName][key].push(operation);
          continue;
        }
        const value = await resolveRacialTraitOperationValueChoice(
          key,
          operation.value,
          trait,
        );
        if (!value) return null;
        resolved[operationMapName][key].push({ ...operation, value });
      }
    }
  }
  return resolved;
}

function racialTraitMechanicsHaveChoiceStats(item = {}) {
  const activeMechanics = item.activeMechanics;
  return (
    window.PFEffectMechanics?.hasBranches?.(item) ||
    (Array.isArray(item.effects) &&
      item.effects.some((effect) =>
        window.PFEffectStats?.isChoiceStat(effect.stat) ||
        needsFavoredEnemyScaleChoice(effect),
      )) ||
    (Array.isArray(item.classSkillGrants) &&
      item.classSkillGrants.some((grant) =>
        window.PFEffectStats?.isChoiceStat(grant.stat),
      )) ||
    (Array.isArray(item.bonusRanks) &&
      item.bonusRanks.some((grant) =>
        window.PFEffectStats?.isChoiceStat(grant.stat),
      )) ||
    (Array.isArray(item.spellLikeAbilities) &&
      item.spellLikeAbilities.some(spellLikeAbilityHasChoiceList)) ||
    spellAdjustmentEntriesNeedChoice(item.casterLevelBonuses) ||
    spellAdjustmentEntriesNeedChoice(item.spellDcBonuses) ||
    spellAdjustmentEntriesNeedChoice(item.effectiveAttributeBonuses) ||
    grantDomainEntriesNeedChoice(item.grantDomains) ||
    conditionalVariables(item).length > 0 ||
    racialTraitChoicePools(item).length > 0 ||
    (activeMechanics &&
      activeMechanics !== item &&
      racialTraitMechanicsHaveChoiceStats(activeMechanics))
  );
}

function racialTraitOverrideHasChoiceStats(override = {}) {
  return [override.mechanicOverrides, override.activeMechanicOverrides].some(
    (operationMap) =>
      Object.entries(operationMap || {}).some(
        ([key, operations]) =>
          [
            "effects",
            "classSkillGrants",
            "bonusRanks",
            "spellLikeAbilities",
            "casterLevelBonuses",
            "spellDcBonuses",
            "effectiveAttributeBonuses",
            "grantDomains",
          ].includes(key) &&
          (Array.isArray(operations) ? operations : []).some(
            (operation) =>
              operation.value &&
              (window.PFEffectStats?.isChoiceStat(operation.value.stat) ||
                spellLikeAbilityHasChoiceList(operation.value) ||
                spellAdjustmentEntriesNeedChoice([operation.value]) ||
                needsFavoredEnemyScaleChoice(operation.value)),
          ),
      ),
  );
}

async function resolveRacialTraitChoicesBeforeApply(trait = {}) {
  if (trait.activatable) {
    removeRacialTraitChoice(trait);
    return true;
  }
  const resolvedTrait = await resolveRacialTraitMechanicChoices(trait, trait);
  if (!resolvedTrait) return false;
  if (trait.activeMechanics) {
    const resolvedActiveMechanics = await resolveRacialTraitMechanicChoices(
      trait.activeMechanics,
      trait,
      { resolveBranch: false },
    );
    if (!resolvedActiveMechanics) return false;
    resolvedTrait.activeMechanics = resolvedActiveMechanics;
  }
  const resolvedPools = await resolveRacialTraitChoicePools(trait);
  if (!resolvedPools) return false;
  appendRacialTraitChoiceMechanics(
    resolvedTrait,
    resolvedPools.poolMechanics,
  );
  const variableResolvedTrait = await resolveConditionalVariablesForItem(
    resolvedTrait,
    trait.name || "Racial Trait",
  );
  if (!variableResolvedTrait) return false;
  const resolvedOverrides = [];
  for (const override of trait.modifiedTraitOverrides || []) {
    const resolvedOverride = await resolveRacialTraitOverrideChoices(
      override,
      trait,
    );
    if (!resolvedOverride) return false;
    resolvedOverrides.push(resolvedOverride);
  }
  const hasChoice =
    racialTraitMechanicsHaveChoiceStats(trait) ||
    racialTraitChoicePools(trait).length ||
    (trait.modifiedTraitOverrides || []).some(racialTraitOverrideHasChoiceStats);
  if (hasChoice) {
    selectedRacialTraitChoices[racialTraitChoiceKeyForTrait(trait)] = {
      effects: cloneJson(variableResolvedTrait.effects),
      selectedBranchId: variableResolvedTrait.selectedBranchId || "",
      selectedBranchName: variableResolvedTrait.selectedBranchName || "",
      damageReduction: cloneJson(variableResolvedTrait.damageReduction),
      spellResistance: cloneJson(variableResolvedTrait.spellResistance),
      immunities: cloneJson(variableResolvedTrait.immunities),
      applyConditions: cloneJson(variableResolvedTrait.applyConditions),
      classSkillGrants: cloneJson(variableResolvedTrait.classSkillGrants),
      bonusRanks: cloneJson(variableResolvedTrait.bonusRanks),
      extraRanksPerLevel: cloneJson(variableResolvedTrait.extraRanksPerLevel),
      featGrants: cloneJson(variableResolvedTrait.featGrants),
      sizeChanges: cloneJson(variableResolvedTrait.sizeChanges),
      spellLikeAbilities: cloneJson(variableResolvedTrait.spellLikeAbilities),
      casterLevelBonuses: cloneJson(variableResolvedTrait.casterLevelBonuses),
      spellDcBonuses: cloneJson(variableResolvedTrait.spellDcBonuses),
      effectiveAttributeBonuses: cloneJson(
        variableResolvedTrait.effectiveAttributeBonuses,
      ),
      grantDomains: cloneJson(variableResolvedTrait.grantDomains),
      generatedEquipment: cloneJson(variableResolvedTrait.generatedEquipment),
      conditionalVariables: cloneJson(variableResolvedTrait.conditionalVariables),
      conditionalChoices: cloneJson(variableResolvedTrait.conditionalChoices),
      activeMechanics: cloneJson(variableResolvedTrait.activeMechanics),
      poolChoices: cloneJson(resolvedPools.poolChoices),
      modifiedTraitOverrides: cloneJson(resolvedOverrides),
    };
  } else {
    removeRacialTraitChoice(trait);
  }
  return true;
}

async function chooseRacialTraitMechanicTargets(trait = {}) {
  const resolved = await resolveRacialTraitChoicesBeforeApply(trait);
  if (!resolved) return false;
  recalculateSheet();
  queueSheetSave();
  return true;
}

function selectedAlternateRacialTraits(race = selectedRaceDefinition()) {
  if (!race) return [];
  const selected = new Set(selectedRacialAlternateTraits.map(racialTraitKey));
  return (race.alternateTraits || []).filter((trait) =>
    selected.has(racialTraitNameKey(trait)),
  );
}

function replacedStandardRacialTraitKeys(race = selectedRaceDefinition()) {
  const keys = new Set();
  selectedAlternateRacialTraits(race).forEach((trait) => {
    (trait.replaces || []).forEach((name) => {
      const key = racialTraitKey(name);
      if (key) keys.add(key);
    });
  });
  return keys;
}

function activeStandardRacialTraits(race = selectedRaceDefinition()) {
  if (!race) return [];
  const replaced = replacedStandardRacialTraitKeys(race);
  return (race.standardTraits || []).filter(
    (trait) => !replaced.has(racialTraitNameKey(trait)),
  );
}

const RACIAL_TRAIT_MECHANIC_KEYS =
  window.PFEffectMechanics?.mechanicKeys?.() || [
    "effects",
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "bonusRanks",
    "extraRanksPerLevel",
    "featGrants",
    "sizeChanges",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "grantDomains",
    "generatedEquipment",
    "conditionalVariables",
  ];

function racialTraitMechanicArray(item = {}, key = "") {
  return Array.isArray(item[key]) ? item[key] : [];
}

function racialTraitHasMechanic(item = {}, key = "") {
  return racialTraitMechanicArray(item, key).length > 0;
}

function racialTraitHasAnyMechanics(item = {}) {
  return (
    RACIAL_TRAIT_MECHANIC_KEYS.some((key) =>
      racialTraitHasMechanic(item, key),
    ) || racialTraitHasAnyMechanicOverrides(item)
  );
}

function stableRacialMechanicKey(value) {
  return JSON.stringify(stableRacialMechanicValue(value));
}

function stableRacialMechanicValue(value) {
  if (Array.isArray(value)) return value.map(stableRacialMechanicValue);
  if (!value || typeof value !== "object") return value ?? null;
  const spellName = String(
    value.spellName || value.spell?.name || value.name || "",
  ).trim();
  if (
    spellName &&
    !value.stat &&
    (value.frequency ||
      value.minimumLevel !== undefined ||
      value.level !== undefined ||
      value.castingAttr ||
      value.minimumScore !== undefined)
  ) {
    const minimumLevel = Number(value.minimumLevel ?? value.level ?? 1) || 1;
    return {
      frequency: String(value.frequency || "").trim(),
      minimumLevel,
      spellName,
    };
  }
  const sorted = {};
  Object.keys(value)
    .sort()
    .forEach((key) => {
      sorted[key] = stableRacialMechanicValue(value[key]);
    });
  return sorted;
}

function racialTraitMechanicOperations(
  override = {},
  key = "",
  group = "passive",
) {
  const operationMap =
    group === "active"
      ? override.activeMechanicOverrides
      : override.mechanicOverrides;
  const operations = operationMap?.[key];
  return Array.isArray(operations) ? operations : [];
}

function racialTraitHasAnyMechanicOverrides(override = {}) {
  return (
    ["passive", "active"].some((group) =>
      RACIAL_TRAIT_MECHANIC_KEYS.some((key) =>
        racialTraitMechanicOperations(override, key, group).some(
          (operation) =>
            operation.action === "remove" ||
            (["add", "replace"].includes(operation.action) && operation.value),
        ),
      ),
    ) || Boolean(override.activeDurationConfig)
  );
}

function racialTraitMechanicOperationMatches(operation = {}, row = {}, index = 0) {
  if (operation.targetKey) {
    return operation.targetKey === stableRacialMechanicKey(row);
  }
  return Number(operation.targetIndex) === index;
}

function applyRacialTraitMechanicOperations(baseRows = [], operations = []) {
  const rows = baseRows
    .map((row, index) => {
      const operation = [...operations]
        .reverse()
        .find((entry) =>
          racialTraitMechanicOperationMatches(entry, row, index),
        );
      if (!operation || operation.action === "keep") return row;
      if (operation.action === "remove") return null;
      if (operation.action === "replace" && operation.value) {
        return operation.value;
      }
      return row;
    })
    .filter(Boolean);
  const additions = operations
    .filter((operation) => operation.action === "add" && operation.value)
    .map((operation) => operation.value);
  return [...rows, ...additions];
}

function selectedRacialModifiedTraitOverrides(alternateTraits = []) {
  const overrides = new Map();
  alternateTraits.forEach((trait) => {
    (trait.modifiedTraitOverrides || []).forEach((override) => {
      if (!racialTraitHasAnyMechanics(override)) return;
      const key = racialTraitKey(override.trait || override.name || "");
      if (!key) return;
      overrides.set(key, override);
    });
  });
  return overrides;
}

function racialTraitWithModifierOverrides(trait = {}, overrides = new Map()) {
  const override = overrides.get(racialTraitNameKey(trait));
  if (!override) return trait;
  if (window.PFRaceData?.applyModifiedTraitOverride) {
    return window.PFRaceData.applyModifiedTraitOverride(trait, override);
  }
  const merged = { ...trait };
  const mechanics = window.PFEffectMechanics;
  const passiveSource =
    mechanics?.passiveMechanics?.(trait) || (trait.activatable ? {} : trait);
  const activeSource =
    mechanics?.activeMechanics?.(trait) ||
    (trait.activatable ? trait : trait.activeMechanics || {});
  RACIAL_TRAIT_MECHANIC_KEYS.forEach((key) => {
    const operations = racialTraitMechanicOperations(override, key);
    merged[key] = operations.length
      ? applyRacialTraitMechanicOperations(
          racialTraitMechanicArray(passiveSource, key),
          operations,
        )
      : racialTraitMechanicArray(passiveSource, key);
    if (racialTraitHasMechanic(override, key)) {
      merged[key] = override[key];
    }
  });
  const activeMechanics = {};
  RACIAL_TRAIT_MECHANIC_KEYS.forEach((key) => {
    const operations = racialTraitMechanicOperations(override, key, "active");
    activeMechanics[key] = operations.length
      ? applyRacialTraitMechanicOperations(
          racialTraitMechanicArray(activeSource, key),
          operations,
        )
      : racialTraitMechanicArray(activeSource, key);
  });
  const activeDurationConfig =
    override.activeDurationConfig || activeSource.durationConfig || null;
  const hasActiveMechanics = mechanics?.hasAnyMechanics
    ? mechanics.hasAnyMechanics(activeMechanics)
    : Object.values(activeMechanics).some(
        (value) => Array.isArray(value) && value.length,
      );
  if (hasActiveMechanics || activeDurationConfig) {
    merged.activeMechanics = {
      ...activeMechanics,
      ...(activeDurationConfig
        ? { durationConfig: activeDurationConfig }
        : {}),
    };
  } else {
    delete merged.activeMechanics;
  }
  return merged;
}

function racialAbilityStat(value = "") {
  return ABILITY_NAME_TO_STAT[String(value || "").trim().toLowerCase()] || "";
}

function racialAbilityEffectsFromTrait(race = {}, traits = race.standardTraits) {
  const abilityTrait = (traits || []).find((trait) =>
    /ability score/i.test(trait?.name || ""),
  );
  if (Array.isArray(abilityTrait?.effects) && abilityTrait.effects.length)
    return abilityTrait.effects;
  const description = abilityTrait?.description || "";
  const effects = [];
  for (const match of description.matchAll(
    /([+-]\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\b/gi,
  )) {
    const stat = racialAbilityStat(match[2]);
    const value = Number(match[1]);
    if (!stat || !Number.isFinite(value)) continue;
    effects.push({
      stat,
      value,
      type: "racial",
      stacks: false,
      conditional: false,
      appliesWhen: "",
    });
  }
  return effects;
}

function racialAbilityEffectsFromSummary(race = {}) {
  const effects = [];
  const addSummaryAbilities = (rawValue, value) => {
    String(rawValue || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const match = part.match(/^(.+?)(?:\s*\(([+-]?\d+)\))?$/);
        const ability = (match?.[1] || part).trim();
        if (/^(any|none)$/i.test(ability)) return;
        const stat = racialAbilityStat(ability);
        if (!stat) return;
        const parsedValue =
          match?.[2] !== undefined ? Number(match[2]) : Number(value);
        effects.push({
          stat,
          value: Number.isFinite(parsedValue) ? parsedValue : value,
          type: "racial",
          stacks: false,
          conditional: false,
          appliesWhen: "",
        });
      });
  };
  addSummaryAbilities(race.abilityScorePlus, 2);
  addSummaryAbilities(race.abilityScoreMinus, -2);
  return effects;
}

function racialAbilityEffects(race = {}, activeTraits = race.standardTraits) {
  const eligibleActiveTraits = (activeTraits || []).filter(
    traitAttributeRequirementMet,
  );
  const hasStandardAbilityTrait = (race.standardTraits || []).some((trait) =>
    /ability score/i.test(trait?.name || ""),
  );
  const hasActiveAbilityTrait = eligibleActiveTraits.some((trait) =>
    /ability score/i.test(trait?.name || ""),
  );
  if (hasStandardAbilityTrait && !hasActiveAbilityTrait) return [];
  const exact = racialAbilityEffectsFromTrait(race, eligibleActiveTraits);
  const source = exact.length ? exact : racialAbilityEffectsFromSummary(race);
  const seen = new Set();
  return source.filter((effect) => {
    const key = `${effect.stat}:${effect.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function racialTraitBuffContext(race = {}) {
  const characterLevel = Math.max(1, num("characterLevel") || 1);
  return {
    category: "Race",
    sourceRace: race.name || el("race")?.value || "",
    characterLevel,
    level: characterLevel,
    casterLevel: characterLevel,
    permanent: true,
  };
}

const TRAIT_ATTRIBUTE_REQUIREMENT_ALIASES = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

const TRAIT_ATTRIBUTE_REQUIREMENT_LABELS = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function normalizeTraitAttributeRequirement(trait = {}) {
  const source =
    trait.attributeRequirement ||
    trait.attributeScoreRequirement ||
    trait.abilityRequirement ||
    {};
  const rawAttribute = source.attribute || source.ability || "";
  const key =
    TRAIT_ATTRIBUTE_REQUIREMENT_ALIASES[
      String(rawAttribute || "").trim().toLowerCase()
    ] || "";
  const rawScore =
    source.score ?? source.minimumScore ?? source.minimumAbilityScore ?? "";
  const score = Number(rawScore);
  if (!key || !Number.isFinite(score) || score <= 0) return null;
  return {
    key,
    label: TRAIT_ATTRIBUTE_REQUIREMENT_LABELS[key] || key.toUpperCase(),
    score: Math.floor(score),
  };
}

function traitAttributeRequirementText(trait = {}) {
  const requirement = normalizeTraitAttributeRequirement(trait);
  return requirement
    ? `Requires ${requirement.label} ${requirement.score}`
    : "";
}

function traitAttributeRequirementMet(trait = {}) {
  const requirement = normalizeTraitAttributeRequirement(trait);
  if (!requirement) return true;
  const score = Number(abilityDisplayValue(requirement.key));
  return Number.isFinite(score) && score >= requirement.score;
}

function collectSelectedRaceBuffs() {
  const race = selectedRaceDefinition();
  if (!race) return [];
  const context = racialTraitBuffContext(race);
  const buffs = [];
  const activeStandardTraits = activeStandardRacialTraits(race);
  const alternateTraits = selectedAlternateRacialTraits(race).map(
    resolvedRacialAlternateTrait,
  );
  const modifiedTraitOverrides =
    selectedRacialModifiedTraitOverrides(alternateTraits);
  const modifiedActiveStandardTraits = activeStandardTraits
    .map((trait) => racialTraitWithModifierOverrides(trait, modifiedTraitOverrides))
    .map(resolvedRacialTrait);
  const abilityEffects = racialAbilityEffects(race, modifiedActiveStandardTraits);
  if (abilityEffects.length) {
    buffs.push({
      ...context,
      name: `Race: ${race.name} Ability Scores`,
      bonuses: abilityEffects,
    });
  }

  const addTraitBuff = (trait, sourceLabel, options = {}) => {
    if (!trait || typeof trait === "string") return;
    trait = {
      ...trait,
      ...(window.PFEffectMechanics?.passiveMechanics?.(trait) || trait),
    };
    if (!traitAttributeRequirementMet(trait)) return;
    if (!options.parseAbilityTrait && /ability score/i.test(trait.name || ""))
      return;
    const hasEffects = Array.isArray(trait.effects) && trait.effects.length;
    const parsedAbilityEffects =
      options.parseAbilityTrait &&
      !hasEffects &&
      /ability score/i.test(trait.name || "")
        ? racialAbilityEffectsFromTrait({ standardTraits: [trait] }, [trait])
        : [];
    const hasDr =
      Array.isArray(trait.damageReduction) && trait.damageReduction.length;
    const hasSr =
      Array.isArray(trait.spellResistance) && trait.spellResistance.length;
    const hasImmunities =
      Array.isArray(trait.immunities) && trait.immunities.length;
    const hasApplyConditions =
      Array.isArray(trait.applyConditions) && trait.applyConditions.length;
    const hasClassSkills =
      Array.isArray(trait.classSkillGrants) && trait.classSkillGrants.length;
    const hasBonusRanks =
      Array.isArray(trait.bonusRanks) && trait.bonusRanks.length;
    const hasExtraRanks =
      Array.isArray(trait.extraRanksPerLevel) && trait.extraRanksPerLevel.length;
    const featGrants = Array.isArray(trait.featGrants)
      ? trait.featGrants
      : [];
    const hasFeatGrants = featGrants.length;
    const hasSizeChanges =
      Array.isArray(trait.sizeChanges) && trait.sizeChanges.length;
    const spellLikeAbilities = Array.isArray(trait.spellLikeAbilities)
      ? trait.spellLikeAbilities
      : [];
    const hasSpellLikeAbilities = spellLikeAbilities.length;
    const casterLevelBonuses = Array.isArray(trait.casterLevelBonuses)
      ? trait.casterLevelBonuses
      : [];
    const hasCasterLevelBonuses = casterLevelBonuses.length;
    const spellDcBonuses = Array.isArray(trait.spellDcBonuses)
      ? trait.spellDcBonuses
      : [];
    const hasSpellDcBonuses = spellDcBonuses.length;
    const effectiveAttributeBonuses = Array.isArray(
      trait.effectiveAttributeBonuses,
    )
      ? trait.effectiveAttributeBonuses
      : [];
    const hasEffectiveAttributeBonuses = effectiveAttributeBonuses.length;
    const grantDomains = Array.isArray(trait.grantDomains)
      ? trait.grantDomains
      : [];
    const hasGrantDomains = grantDomains.length;
    const generatedEquipment = Array.isArray(trait.generatedEquipment)
      ? trait.generatedEquipment
      : [];
    const hasGeneratedEquipment = generatedEquipment.length;
    const conditionalVariables = Array.isArray(trait.conditionalVariables)
      ? trait.conditionalVariables
      : [];
    const hasConditionalVariables = conditionalVariables.length;
    if (
      !hasEffects &&
      !parsedAbilityEffects.length &&
      !hasDr &&
      !hasSr &&
      !hasImmunities &&
      !hasApplyConditions &&
      !hasClassSkills &&
      !hasBonusRanks &&
      !hasExtraRanks &&
      !hasFeatGrants &&
      !hasSizeChanges &&
      !hasSpellLikeAbilities &&
      !hasCasterLevelBonuses &&
      !hasSpellDcBonuses &&
      !hasEffectiveAttributeBonuses &&
      !hasGrantDomains &&
      !hasGeneratedEquipment &&
      !hasConditionalVariables
    )
      return;
    buffs.push({
      ...context,
      name: `${sourceLabel}: ${race.name} ${trait.name || "Trait"}`,
      description: trait.description || trait.desc || "",
      detailUrl: trait.url || trait.link || trait.sourceUrl || "",
      detailData: passiveEffectDetail?.(trait, "Racial Trait") || {},
      bonuses: hasEffects ? trait.effects : parsedAbilityEffects,
      damageReduction: hasDr ? trait.damageReduction : [],
      spellResistance: hasSr ? trait.spellResistance : [],
      immunities: hasImmunities ? trait.immunities : [],
      applyConditions: hasApplyConditions ? trait.applyConditions : [],
      classSkillGrants: hasClassSkills ? trait.classSkillGrants : [],
      bonusRanks: hasBonusRanks ? trait.bonusRanks : [],
      extraRanksPerLevel: hasExtraRanks ? trait.extraRanksPerLevel : [],
      featGrants: hasFeatGrants ? featGrants : [],
      sizeChanges: hasSizeChanges ? trait.sizeChanges : [],
      spellLikeAbilities: hasSpellLikeAbilities ? spellLikeAbilities : [],
      casterLevelBonuses: hasCasterLevelBonuses ? casterLevelBonuses : [],
      spellDcBonuses: hasSpellDcBonuses ? spellDcBonuses : [],
      effectiveAttributeBonuses: hasEffectiveAttributeBonuses
        ? effectiveAttributeBonuses
        : [],
      grantDomains: hasGrantDomains ? grantDomains : [],
      generatedEquipment: hasGeneratedEquipment ? generatedEquipment : [],
      conditionalVariables: hasConditionalVariables ? conditionalVariables : [],
      auraConfig: trait.auraConfig || null,
    });
  };

  modifiedActiveStandardTraits.forEach((trait) => addTraitBuff(trait, "Race"));
  alternateTraits.forEach((trait) =>
    addTraitBuff(trait, "Alternate Race", { parseAbilityTrait: true }),
  );
  return buffs;
}

function racialTraitAbilityFromTrait(trait, race, sourceLabel, options = {}) {
  if (!trait || typeof trait === "string") return null;
  const activeMechanics = window.PFEffectMechanics?.activeMechanics?.(trait) ||
    (trait.activatable ? trait : {});
  if (!window.PFEffectMechanics?.hasAnyMechanics?.(activeMechanics)) return null;
  trait = { ...trait, ...activeMechanics };
  if (!traitAttributeRequirementMet(trait)) return null;
  if (!options.parseAbilityTrait && /ability score/i.test(trait.name || ""))
    return null;
  const hasEffects = Array.isArray(trait.effects) && trait.effects.length;
  const parsedAbilityEffects =
    options.parseAbilityTrait &&
    !hasEffects &&
    /ability score/i.test(trait.name || "")
      ? racialAbilityEffectsFromTrait({ standardTraits: [trait] }, [trait])
      : [];
  const generatedEquipment = Array.isArray(trait.generatedEquipment)
    ? trait.generatedEquipment
    : [];
  const choicePools = racialTraitChoicePools(trait);
  const ability = {
    ...racialTraitBuffContext(race),
    id: `racial-trait:${race.name || "race"}:${trait.name || "trait"}`,
    name:
      options.displayName ||
      `${sourceLabel}: ${race.name || "Race"} ${trait.name || "Trait"}`,
    category: "Race",
    source: race.name || "Race",
    sourceRacialTraitName: options.sourceRacialTraitName || trait.name || "",
    bonuses: hasEffects ? trait.effects : parsedAbilityEffects,
    damageReduction: Array.isArray(trait.damageReduction)
      ? trait.damageReduction
      : [],
    spellResistance: Array.isArray(trait.spellResistance)
      ? trait.spellResistance
      : [],
    immunities: Array.isArray(trait.immunities) ? trait.immunities : [],
    applyConditions: Array.isArray(trait.applyConditions)
      ? trait.applyConditions
      : [],
    classSkillGrants: Array.isArray(trait.classSkillGrants)
      ? trait.classSkillGrants
      : [],
    bonusRanks: Array.isArray(trait.bonusRanks) ? trait.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(trait.extraRanksPerLevel)
      ? trait.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(trait.featGrants) ? trait.featGrants : [],
    sizeChanges: Array.isArray(trait.sizeChanges) ? trait.sizeChanges : [],
    spellLikeAbilities: Array.isArray(trait.spellLikeAbilities)
      ? trait.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(trait.casterLevelBonuses)
      ? trait.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(trait.spellDcBonuses)
      ? trait.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(trait.effectiveAttributeBonuses)
      ? trait.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(trait.grantDomains) ? trait.grantDomains : [],
    generatedEquipment,
    conditionalVariables: Array.isArray(trait.conditionalVariables)
      ? trait.conditionalVariables
      : [],
    choicePools,
    auraConfig: activeMechanics.auraConfig || trait.auraConfig || null,
    durationConfig: activeMechanics.durationConfig || trait.durationConfig || {
      count: null,
      unit: "variable",
      factors: [],
    },
    duration: window.PFEffectMeta?.durationLabel
      ? window.PFEffectMeta.durationLabel(
          activeMechanics.durationConfig || trait.durationConfig || {
            count: null,
            unit: "variable",
            factors: [],
          },
        )
      : "variable",
    fromAbility: true,
    description: trait.description || trait.desc || "",
    detailUrl: trait.url || trait.link || trait.sourceUrl || "",
    detailData: {
      type: "Racial Trait",
      race: race.name || "Race",
      description: trait.description || trait.desc || "",
    },
  };
  const hasAny =
    (ability.bonuses || []).length ||
    (ability.damageReduction || []).length ||
    (ability.spellResistance || []).length ||
    (ability.immunities || []).length ||
    (ability.applyConditions || []).length ||
    (ability.classSkillGrants || []).length ||
    (ability.bonusRanks || []).length ||
    (ability.extraRanksPerLevel || []).length ||
    (ability.featGrants || []).length ||
    (ability.sizeChanges || []).length ||
    (ability.spellLikeAbilities || []).length ||
    (ability.casterLevelBonuses || []).length ||
    (ability.spellDcBonuses || []).length ||
    (ability.effectiveAttributeBonuses || []).length ||
    (ability.grantDomains || []).length ||
    (ability.generatedEquipment || []).length ||
    (ability.conditionalVariables || []).length ||
    (ability.damageRolls || []).length ||
    (ability.choicePools || []).length;
  return hasAny ? ability : null;
}

function activatableAbilitiesFromRacialTrait(
  trait,
  race,
  sourceLabel,
  options = {},
) {
  const abilities = Array.isArray(trait?.activatableAbilities)
    ? trait.activatableAbilities
    : [];
  return abilities
    .map((ability) =>
      racialTraitAbilityFromTrait(
        {
          ...ability,
          activatable: true,
          name: ability.name || `${trait.name || "Trait"} Ability`,
          durationConfig: ability.durationConfig || trait.durationConfig,
        },
        race,
        sourceLabel,
        {
          ...options,
          displayName: ability.name || `${trait.name || "Trait"} Ability`,
          sourceRacialTraitName: trait.name || "",
        },
      ),
    )
    .filter(Boolean);
}

function collectActivatableRacialTraitAbilities() {
  const race = selectedRaceDefinition();
  if (!race) return [];
  const activeStandardTraits = activeStandardRacialTraits(race);
  const alternateTraits = selectedAlternateRacialTraits(race);
  const resolvedAlternateTraits = alternateTraits.map(resolvedRacialAlternateTrait);
  const modifiedTraitOverrides =
    selectedRacialModifiedTraitOverrides(resolvedAlternateTraits);
  const modifiedActiveStandardTraits = activeStandardTraits
    .map((trait) => racialTraitWithModifierOverrides(trait, modifiedTraitOverrides));
  return [
    ...modifiedActiveStandardTraits.map((trait) =>
      racialTraitAbilityFromTrait(trait, race, "Race"),
    ),
    ...modifiedActiveStandardTraits.flatMap((trait) =>
      activatableAbilitiesFromRacialTrait(trait, race, "Race"),
    ),
    ...alternateTraits.map((trait) =>
      racialTraitAbilityFromTrait(trait, race, "Alternate Race", {
        parseAbilityTrait: true,
      }),
    ),
    ...resolvedAlternateTraits.flatMap((trait) =>
      activatableAbilitiesFromRacialTrait(trait, race, "Alternate Race", {
        parseAbilityTrait: true,
      }),
    ),
  ].filter(Boolean);
}

function racialTraitActiveEffectId(effect = {}) {
  const ids = [effect.id, effect.sourceEffectId, effect.parentEffectId]
    .map((value) => String(value || ""))
    .filter(Boolean);
  return ids.find((id) => id.startsWith("racial-trait:")) || "";
}

function activeRacialTraitAbilityMap() {
  return new Map(
    collectActivatableRacialTraitAbilities().map((ability) => [
      String(ability.id || ""),
      ability,
    ]),
  );
}

async function persistActiveBuffPrune() {
  if (!currentSheetId) return;
  if (isEnemySheetMode) {
    queueSheetSave();
    return;
  }
  await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
  localStorage.setItem(buffRefreshKey(), String(Date.now()));
}

function pruneUnavailableRacialTraitActiveBuffs(options = {}) {
  if (!Array.isArray(activeBuffs) || !activeBuffs.length) return false;
  const available = activeRacialTraitAbilityMap();
  let changed = false;
  activeBuffs = activeBuffs
    .map((buff) => {
      const id = racialTraitActiveEffectId(buff);
      if (!id || !available.has(id)) return buff;
      if (!String(buff.id || "").startsWith("racial-trait:")) return buff;
      const ability = available.get(id);
      if (!ability?.name || buff.name === ability.name) return buff;
      changed = true;
      return {
        ...buff,
        name: ability.name,
        source: ability.source || buff.source,
        sourceRacialTraitName:
          ability.sourceRacialTraitName || buff.sourceRacialTraitName,
      };
    })
    .filter((buff) => {
      const id = racialTraitActiveEffectId(buff);
      if (!id || available.has(id)) return true;
      changed = true;
      return false;
    });
  if (!changed) return false;
  if (effectTrackerInstance) {
    effectTrackerInstance.active = [...activeBuffs];
    effectTrackerInstance.renderActive?.();
  }
  recalculateSheet();
  if (options.persist) persistActiveBuffPrune().catch(console.error);
  return true;
}

function applySelectedRaceDefaults() {
  const race = selectedRaceDefinition();
  if (!race) return;
  const size = defaultSizeForRace(race);
  if (size && el("size")) {
    setSelectValuePreservingUnknown("size", size);
    updateCreatureSizeFields();
  }
}

function defaultSizeForRace(race = {}) {
  const direct = String(race.size || "").trim();
  if (direct) return normalizeCreatureSize(direct);
  const sizeTrait = (race.standardTraits || []).find(
    (trait) => racialTraitNameKey(trait) === "size",
  );
  const description = String(sizeTrait?.description || "");
  return (
    CREATURE_SIZES.find((size) =>
      new RegExp(`\\b${size.name}\\b`, "i").test(description),
    )?.name || ""
  );
}

function shouldApplyRaceDefaultSize(restoredSize = "") {
  const raceSize = defaultSizeForRace(selectedRaceDefinition() || {});
  if (!raceSize) return false;
  const rawRestoredSize = String(restoredSize || "").trim();
  if (!rawRestoredSize) return true;
  const restored = normalizeCreatureSize(rawRestoredSize);
  return raceSize !== "Medium" && restored === "Medium";
}

function updateRacialTraitsButton() {
  const button = el("racialTraitsButton");
  if (!button) return;
  const race = selectedRaceDefinition();
  const selectedCount = selectedAlternateRacialTraits(race).length;
  button.disabled = !race;
  button.title = race
    ? `Manage ${race.name || "race"} racial traits`
    : "Choose a race first";
  const count = el("racialTraitsButtonCount");
  if (count) count.textContent = selectedCount ? `(${selectedCount})` : "";
}

function setSelectedRacialAlternateTraits(next = []) {
  selectedRacialAlternateTraits = normalizeSelectedRacialAlternateTraits(next);
  updateRacialTraitsButton();
  pruneUnavailableRacialTraitActiveBuffs({ persist: true });
  recalculateSheet();
  queueSheetSave();
}

function openRacialTraitsModal() {
  const race = selectedRaceDefinition();
  if (!race) {
    setStatus("Choose a race before changing racial traits.", "warning");
    return;
  }
  if (!window.PFRacialTraitsModal) {
    setStatus("Racial traits modal is not available.", "warning");
    return;
  }
  const alternateTraits = selectedAlternateRacialTraits(race).map(
    resolvedRacialTrait,
  );
  const modifiedTraitOverrides =
    selectedRacialModifiedTraitOverrides(alternateTraits);
  const effectiveStandardTraits = activeStandardRacialTraits(race).map((trait) =>
    racialTraitWithModifierOverrides(trait, modifiedTraitOverrides),
  );
  window.PFRacialTraitsModal.open({
    race,
    selectedAlternateTraits: selectedAlternateRacialTraits(race).map(
      (trait) => trait.name || "",
    ),
    effectiveStandardTraits,
    choices: cloneJson(selectedRacialTraitChoices),
    getChoices: () => cloneJson(selectedRacialTraitChoices),
    choiceSummary: (choice) => mechanicsChoiceSummary(choice),
    traitRequirementStatus: (trait) => ({
      met: traitAttributeRequirementMet(trait),
      label: traitAttributeRequirementText(trait),
    }),
    onChoose: chooseRacialTraitMechanicTargets,
    onBeforeApply: resolveRacialTraitChoicesBeforeApply,
    onRemove: (trait) => {
      removeRacialTraitChoice(trait);
      pruneUnavailableRacialTraitActiveBuffs({ persist: true });
      queueSheetSave();
    },
    onChange: setSelectedRacialAlternateTraits,
  });
}

function normalizeCreatureSize(value = "") {
  const text = String(value || "").trim();
  if (!text) return "Medium";
  const compact = text
    .replace(/\s*\((?:tall|long)\)\s*/gi, "")
    .toLowerCase();
  return (
    CREATURE_SIZES.find((size) => size.name.toLowerCase() === compact)?.name ||
    "Medium"
  );
}

function creatureSizeOptions(selected = "") {
  const normalized = normalizeCreatureSize(selected);
  return CREATURE_SIZES.map((size) =>
    selectOption(size.name, size.name, normalized),
  ).join("");
}

function creatureSizeIndex(value = "") {
  const normalized = normalizeCreatureSize(value);
  return Math.max(
    0,
    CREATURE_SIZES.findIndex((size) => size.name === normalized),
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function creatureSizeByStep(value = "", step = 0) {
  return CREATURE_SIZES[
    clamp(creatureSizeIndex(value) + Number(step || 0), 0, CREATURE_SIZES.length - 1)
  ];
}

function collectSizeChangeEntries() {
  const entries = [];
  const addEntries = (list, source = "Effect") => {
    (Array.isArray(list) ? list : []).forEach((entry) => {
      const value = Number(entry.value ?? entry.steps ?? 0);
      if (!SIZE_CHANGE_VALUES.includes(value)) return;
      entries.push({
        value,
        source,
      });
    });
  };

  collectClassFeatureBuffs().forEach((buff) =>
    addEntries(buff.sizeChanges, buff.name || "Class Feature"),
  );
  collectSelectedRaceBuffs().forEach((buff) =>
    addEntries(buff.sizeChanges, buff.name || "Race"),
  );
  (activeBuffs || []).forEach((buff) =>
    addEntries(buff.sizeChanges, buff.name || "Active Effect"),
  );
  return entries;
}

function finalCreatureSize() {
  const baseSize = normalizeCreatureSize(el("size")?.value || "Medium");
  const totalSteps = collectSizeChangeEntries().reduce(
    (sum, entry) => sum + Number(entry.value || 0),
    0,
  );
  return creatureSizeByStep(baseSize, totalSteps);
}

function updateCreatureSizeFields() {
  const sizeSelect = el("size");
  if (sizeSelect && !sizeSelect.options.length) {
    sizeSelect.innerHTML = creatureSizeOptions(sizeSelect.value || "Medium");
  }
  if (sizeSelect) sizeSelect.value = normalizeCreatureSize(sizeSelect.value);
  const finalSize = finalCreatureSize();
  if (el("reach")) el("reach").value = finalSize.reach;
}

function setSelectValuePreservingUnknown(id, value = "") {
  const select = el(id);
  if (!select) return;
  const nextValue =
    id === "alignment"
      ? normalizeAlignmentValue(value)
      : id === "size"
        ? normalizeCreatureSize(value)
      : String(value || "").trim();
  if (id === "alignment") select.innerHTML = alignmentOptions(nextValue);
  if (id === "race") select.innerHTML = raceOptions(nextValue);
  if (id === "size") select.innerHTML = creatureSizeOptions(nextValue);
  select.value = nextValue;
  if (nextValue && select.value !== nextValue) {
    select.insertAdjacentHTML(
      "afterbegin",
      selectOption(nextValue, nextValue, nextValue),
    );
    select.value = nextValue;
  }
}

function armorEnchantmentOptions(selected = "") {
  return `
    <option value="" ${selected === "" ? "selected" : ""}>None</option>
    <optgroup label="Armor">${optionList(ARMOR_ENCHANTMENTS.slice(1), selected)}</optgroup>
    <optgroup label="Shield">${optionList(SHIELD_ENCHANTMENTS.slice(1), selected)}</optgroup>
  `;
}

function titleCaseStat(value) {
  const key = String(value || "")
    .toLowerCase()
    .trim();
  const labels = {
    "cannot gain morale bonuses": "Cannot Gain Morale Bonuses",
    "cannot gain luck bonuses": "Cannot Gain Luck Bonuses",
  };
  if (labels[key]) return labels[key];
  const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(key);
  if (choiceLabel) return choiceLabel;
  if (key.startsWith("skill:")) {
    const skill = allSkills()
      .map(([name]) => name)
      .find((entry) => `skill:${normalizeSkillName(entry)}` === key);
    return `Skill: ${skill || key.slice(6)}`;
  }
  return key
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function enhancementValue(value) {
  return Math.max(0, Math.min(5, Number(value || 0)));
}

function isYes(value) {
  return ["yes", "true", "1", "on"].includes(String(value || "").toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showSheetLoading() {
  el("sheetLoading")?.classList.remove("d-none");
  el("sheetMain")?.classList.add("d-none");
}

function hideSheetLoading() {
  el("sheetLoading")?.classList.add("d-none");
}

let sheetStickyObserver = null;
let sheetStickyResizeObserver = null;

function syncSheetStickyControls() {
  const controls = el("sheetStickyControls");
  const placeholder = el("sheetStickyPlaceholder");
  const main = el("sheetMain");
  if (!controls || !placeholder || !main || main.classList.contains("d-none"))
    return;
  updateSheetStickyMetrics();
  updateSheetStickyControls();
}

function updateSheetStickyMetrics() {
  const controls = el("sheetStickyControls");
  const placeholder = el("sheetStickyPlaceholder");
  const main = el("sheetMain");
  if (!controls || !placeholder || !main || main.classList.contains("d-none"))
    return;
  const mainRect = main.getBoundingClientRect();
  const mainStyles = getComputedStyle(main);
  controls.dataset.stickyHeight = String(controls.offsetHeight + 2);
  controls.style.setProperty("--sheet-sticky-left", `${mainRect.left}px`);
  controls.style.setProperty("--sheet-sticky-width", `${mainRect.width}px`);
  controls.style.setProperty(
    "--sheet-sticky-padding-x",
    mainStyles.paddingLeft,
  );
  if (controls.classList.contains("is-fixed")) {
    placeholder.style.height = `${controls.dataset.stickyHeight}px`;
  }
}

function updateSheetStickyControls() {
  const sentinel = el("sheetStickySentinel");
  const controls = el("sheetStickyControls");
  const placeholder = el("sheetStickyPlaceholder");
  const main = el("sheetMain");
  if (
    !sentinel ||
    !controls ||
    !placeholder ||
    !main ||
    main.classList.contains("d-none")
  )
    return;
  const shouldFix = sentinel.getBoundingClientRect().top <= 0;
  const height = Number(
    controls.dataset.stickyHeight || controls.offsetHeight + 8,
  );
  placeholder.style.height = shouldFix ? `${height}px` : "0px";
  controls.classList.toggle("is-fixed", shouldFix);
  updateSheetStickyMetrics();
}

function initSheetStickyControls() {
  const sentinel = el("sheetStickySentinel");
  const controls = el("sheetStickyControls");
  if (!sentinel || !controls) return;
  sheetStickyObserver?.disconnect();
  sheetStickyResizeObserver?.disconnect();
  sheetStickyObserver = new IntersectionObserver(
    () => requestAnimationFrame(updateSheetStickyControls),
    {
      root: null,
      threshold: [0, 1],
    },
  );
  sheetStickyObserver.observe(sentinel);
  sheetStickyResizeObserver = new ResizeObserver(() =>
    requestAnimationFrame(syncSheetStickyControls),
  );
  sheetStickyResizeObserver.observe(controls);
  requestAnimationFrame(syncSheetStickyControls);
}

const mobileCombatSectionSelectors = [
  ".full-order-ac",
  ".full-order-saves",
  ".full-order-bab",
  ".full-order-maneuvers",
];
let combatSectionsDesktopColumn = null;
let combatSectionsDesktopBefore = null;
let combatSectionsAreMobile = false;

function syncFullViewMobileOrder() {
  const sections = mobileCombatSectionSelectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);
  const weapons = document.querySelector(".full-order-weapons");
  if (!sections.length || !weapons) return;

  if (!combatSectionsDesktopColumn) {
    combatSectionsDesktopColumn = sections[0].parentElement;
    combatSectionsDesktopBefore =
      combatSectionsDesktopColumn?.querySelector(".enemy-section-stack") ||
      null;
  }

  const shouldUseMobileOrder = window.matchMedia(
    "(max-width: 1199.98px)",
  ).matches;
  if (shouldUseMobileOrder === combatSectionsAreMobile) return;
  combatSectionsAreMobile = shouldUseMobileOrder;

  if (shouldUseMobileOrder) {
    sections.forEach((section) =>
      weapons.parentElement.insertBefore(section, weapons),
    );
  } else if (combatSectionsDesktopColumn) {
    sections.forEach((section) =>
      combatSectionsDesktopColumn.insertBefore(
        section,
        combatSectionsDesktopBefore,
      ),
    );
  }
  requestAnimationFrame(syncSheetStickyControls);
}

function setSheetView(mode) {
  sheetViewMode = mode === "simplified" ? "simplified" : "full";
  sessionStorage.setItem("pf_character_sheet_view", sheetViewMode);
  const isSimple = sheetViewMode === "simplified";
  el("fullSheetView")?.classList.toggle("d-none", isSimple);
  el("simplifiedSheetView")?.classList.toggle("d-none", !isSimple);
  el("fullViewBtn")?.classList.toggle("active", !isSimple);
  el("fullViewBtn")?.setAttribute(
    "aria-selected",
    !isSimple ? "true" : "false",
  );
  el("simplifiedViewBtn")?.classList.toggle("active", isSimple);
  el("simplifiedViewBtn")?.setAttribute(
    "aria-selected",
    isSimple ? "true" : "false",
  );
  if (isSimple) renderSimplifiedSheet();
  syncFullViewMobileOrder();
  requestAnimationFrame(syncSheetStickyControls);
}

function fieldValue(id, fallback = "") {
  return el(id)?.value || fallback;
}

function abilityDisplayValue(key) {
  const raw = fieldValue(`${key}Total`, fieldValue(`${key}Score`));
  return String(raw || "")
    .replace(/\s*\([+-]?\d+\)\s*$/, "")
    .trim();
}

function simpleStat(label, value) {
  return `<div class="simple-card"><div class="simple-label">${escapeHtml(label)}</div><div class="simple-value">${escapeHtml(value || "-")}</div></div>`;
}

function simpleTable(headers, rows) {
  return `
    <table class="table table-dark table-sm align-middle simple-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows
        .map((row) => {
          const cells = Array.isArray(row) ? row : row.cells;
          const className = row.conditional
            ? ' class="simple-conditional"'
            : "";
          return `<tr${className}>${cells.map((cell) => `<td>${escapeHtml(cell || "-")}</td>`).join("")}</tr>`;
        })
        .join("")}</tbody>
    </table>
  `;
}

function simpleChips(rows, emptyText = "None.") {
  if (!rows.length)
    return `<div class="small-text">${escapeHtml(emptyText)}</div>`;
  return `<div class="simple-chip-grid">${rows
    .map(
      (row) => `
    <div class="simple-chip">
      <div class="simple-chip-main">${escapeHtml(row.main || "-")}</div>
      ${row.sub ? `<div class="simple-chip-sub clamp-2">${escapeHtml(row.sub)}</div>` : ""}
    </div>
  `,
    )
    .join("")}</div>`;
}

function simpleInventoryChips(items, emptyText = "No inventory.") {
  if (!items.length)
    return `<div class="small-text">${escapeHtml(emptyText)}</div>`;
  return `<div class="simple-chip-grid">${items
    .map((item) => {
      return `
      <button class="simple-chip simple-chip-clickable text-start text-white" type="button" data-simple-inventory-loot="${escapeHtml(item.id)}">
        <div class="simple-chip-main">
          <span class="me-1">${sourceItemIcon(item)}</span>${escapeHtml(item.name || "Item")}
          <span class="simple-chip-sub ms-1">${escapeHtml(`x${item.count || 1}`)}</span>
        </div>
      </button>
    `;
    })
    .join("")}</div>`;
}

function simpleList(rows, emptyText = "None.") {
  if (!rows.length)
    return `<div class="small-text">${escapeHtml(emptyText)}</div>`;
  return `<div class="simple-list">${rows
    .map(
      (row) => `
    <div class="simple-list-row${row.conditional ? " simple-conditional" : ""}">
      <div>
        <div class="simple-list-main">${escapeHtml(row.main || "-")}</div>
        ${row.detail ? `<div class="simple-chip-sub">${escapeHtml(row.detail)}</div>` : ""}
      </div>
      ${row.sub ? `<div class="simple-list-sub">${escapeHtml(row.sub)}</div>` : ""}
    </div>
  `,
    )
    .join("")}</div>`;
}

function simpleDetailRows(rows = [], emptyText = "") {
  const filtered = rows.filter((row) => row && (row.value || row.detail));
  if (!filtered.length)
    return emptyText
      ? `<div class="small-text">${escapeHtml(emptyText)}</div>`
      : "";
  return `<div class="simple-detail-list">${filtered
    .map(
      (row) => `
    <div class="simple-detail-row${row.conditional ? " simple-conditional" : ""}">
      <div class="simple-detail-label">${escapeHtml(row.label || "")}</div>
      <div>
        <div class="simple-detail-value">${escapeHtml(row.value || "-")}</div>
        ${row.detail ? `<div class="simple-chip-sub">${escapeHtml(row.detail)}</div>` : ""}
      </div>
    </div>
  `,
    )
    .join("")}</div>`;
}

function simpleEquipmentCards(rows, emptyText = "None.") {
  if (!rows.length)
    return `<div class="small-text">${escapeHtml(emptyText)}</div>`;
  return `<div class="vstack gap-2">${rows
    .map(
      (row) => `
    <div class="sheet-card simple-weapon-card">
      <div class="simple-value simple-weapon-name mb-1">${escapeHtml(row.name || "-")}</div>
      ${simpleDetailRows(row.details || [])}
    </div>
  `,
    )
    .join("")}</div>`;
}

function statDisplayLabel(stat) {
  const key = String(stat || "").toLowerCase();
  const ability = Object.entries(ABILITY_STAT_NAMES).find(
    ([, value]) => value === key,
  );
  if (ability) return ability[0].toUpperCase();
  const skill = allSkills().find(([name]) => skillStatKey(name) === key);
  if (skill) return skill[0];
  const labels = {
    ac: "AC",
    "touch ac": "Touch AC",
    "flat-footed ac": "Flat-Footed AC",
    "remove dex bonus to ac": "Remove DEX Bonus to AC",
    "cannot gain morale bonuses": "Cannot Gain Morale Bonuses",
    "cannot gain luck bonuses": "Cannot Gain Luck Bonuses",
    "extra attack": "Extra Attack at Highest BAB",
    cmb: "CMB",
    cmd: "CMD",
    fortitude: "Fortitude",
    reflex: "Reflex",
    will: "Will",
    initiative: "Initiative",
    "hit points": "HP",
    "skill checks": "All skills",
    "strength skill checks": "STR skills",
    "dexterity skill checks": "DEX skills",
    "constitution skill checks": "CON skills",
    "intelligence skill checks": "INT skills",
    "wisdom skill checks": "WIS skills",
    "charisma skill checks": "CHA skills",
    "craft skill checks": "Craft skills",
    "profession skill checks": "Profession skills",
    "perform skill checks": "Perform skills",
    "class skill checks": "Class skills",
    "class knowledge skill checks": "Class Knowledge skills",
    "knowledge skill checks": "Knowledge skills",
    "trained skill checks": "Trained skills",
    "untrained skill checks": "Untrained skills",
  };
  return (
    labels[key] ||
    key
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function totalForStat(stat) {
  const key = String(stat || "").toLowerCase();
  const ability = Object.entries(ABILITY_STAT_NAMES).find(
    ([, value]) => value === key,
  );
  if (ability) return abilityDisplayValue(ability[0]);
  const skill = allSkills().find(([name]) => skillStatKey(name) === key);
  if (skill) return fieldValue(`${skillId(skill[0])}Total`);
  const ids = {
    ac: "acTotal",
    "touch ac": "acTouch",
    "flat-footed ac": "acFlat",
    cmb: "cmbTotal",
    cmd: "cmdTotal",
    fortitude: "fortTotal",
    reflex: "reflexTotal",
    will: "willTotal",
    initiative: "initTotal",
    "hit points": "hitPointsTotal",
  };
  return ids[key] ? fieldValue(ids[key]) : "";
}

function simpleConditionalsByStat() {
  const buffed = window.PFBuffs?.calculateStatsDetailed(
    calculationBuffs(),
    sheetToBaseline(),
  );
  const groups = {};
  Object.entries(buffed?.breakdown || {}).forEach(([stat, items]) => {
    mergedConditionalBreakdownItems(
      items.filter((item) => item.conditional || item.applied === "conditional"),
    )
      .forEach((item) => {
        const value = Number(item.value || 0);
        const total = totalForStat(stat)
          ? numericTotalText(totalForStat(stat), value, stat)
          : signed(value);
        const appliesWhen = String(item.detail || "").trim();
        const totalWithBonus = `${total} (${signed(value)})`;
        if (!groups[stat]) groups[stat] = [];
        groups[stat].push({
          label: [statDisplayLabel(stat), appliesWhen]
            .filter(Boolean)
            .join(" "),
          total,
          displayTotal: totalWithBonus,
          source: `${item.source} (${item.type || "untyped"})`,
          value,
          type: item.type || "untyped",
          effect: item.source,
          appliesWhen,
          rawTotal: total,
        });
      });
  });
  return groups;
}

function simpleConditionalStats(stat, groups) {
  return (groups[stat] || [])
    .map((row) =>
      simpleStat(row.label, row.displayTotal || row.total).replace(
        "simple-card",
        "simple-card simple-conditional",
      ),
    )
    .join("");
}

function conditionalTableRows(stat, groups, currentTotal = "") {
  return (groups[stat] || []).map((row) => ({
    conditional: true,
    cells: [
      row.label,
      currentTotal
        ? conditionalSkillTotal(row, currentTotal, stat)
        : row.displayTotal || row.total,
    ],
    label: row.label,
    total: currentTotal
      ? numericTotalText(currentTotal, row.value, stat)
      : row.total,
    displayTotal: currentTotal
      ? conditionalSkillTotal(row, currentTotal, stat)
      : row.displayTotal || row.total,
    source: row.source,
    value: row.value,
    type: row.type,
    appliesWhen: row.appliesWhen,
  }));
}

function conditionalSkillTotal(row, currentTotal, stat) {
  return `${numericTotalText(currentTotal, row.value, stat)} (${signed(row.value)})`;
}

function simpleSkillRows(groups) {
  const rows = [];
  const classSkillEffectSet = characterClassSkillKeys();
  allSkills().forEach(([skill, ability]) => {
    const key = skillStatKey(skill);
    const hasClassSkillEffect = classSkillSetHasSkill(classSkillEffectSet, skill);
    const hasClassKnowledgeSkillEffect =
      hasClassSkillEffect && isKnowledgeSkill(skill);
    const currentTotal = fieldValue(`${skillId(skill)}Total`);
    rows.push({ main: skill, sub: fieldValue(`${skillId(skill)}Total`) });
    (groups["skill checks"] || []).forEach((row) =>
      rows.push({
        main: row.label,
        sub: conditionalSkillTotal(row, currentTotal, "skill checks"),
        detail: row.source,
        conditional: true,
      }),
    );
    (groups[skillBuffKeyForAbility(ability)] || []).forEach((row) =>
      rows.push({
        main: row.label,
        sub: conditionalSkillTotal(
          row,
          currentTotal,
          skillBuffKeyForAbility(ability),
        ),
        detail: row.source,
        conditional: true,
      }),
    );
    const familyKey = skillFamilyBonusKey(skill);
    const trainingKey = skillTrainingBonusKey(skill);
    if (familyKey) {
      (groups[familyKey] || []).forEach((row) =>
        rows.push({
          main: row.label,
          sub: conditionalSkillTotal(row, currentTotal, familyKey),
          detail: row.source,
          conditional: true,
        }),
      );
    }
    if (trainingKey) {
      (groups[trainingKey] || []).forEach((row) =>
        rows.push({
          main: row.label,
          sub: conditionalSkillTotal(row, currentTotal, trainingKey),
          detail: row.source,
          conditional: true,
        }),
      );
    }
    if (hasClassSkillEffect) {
      (groups["class skill checks"] || []).forEach((row) =>
        rows.push({
          main: row.label,
          sub: conditionalSkillTotal(row, currentTotal, "class skill checks"),
          detail: row.source,
          conditional: true,
        }),
      );
    }
    if (hasClassKnowledgeSkillEffect) {
      (groups["class knowledge skill checks"] || []).forEach((row) =>
        rows.push({
          main: row.label,
          sub: conditionalSkillTotal(
            row,
            currentTotal,
            "class knowledge skill checks",
          ),
          detail: row.source,
          conditional: true,
        }),
      );
    }
    if (isKnowledgeSkill(skill)) {
      (groups["knowledge skill checks"] || []).forEach((row) =>
        rows.push({
          main: row.label,
          sub: conditionalSkillTotal(row, currentTotal, "knowledge skill checks"),
          detail: row.source,
          conditional: true,
        }),
      );
    }
    (groups[key] || []).forEach((row) =>
      rows.push({
        main: row.label,
        sub: conditionalSkillTotal(row, currentTotal, key),
        detail: row.source,
        conditional: true,
      }),
    );
  });
  return rows;
}

function simpleConditionalListRows(label, currentTotal, stats, groups) {
  return stats.flatMap((stat) =>
    (groups[stat] || []).map((row) => ({
      main: `${numericTotalText(currentTotal, row.value, stat)} (${signed(row.value)})${row.appliesWhen ? ` ${row.appliesWhen}` : ""}`,
      sub: "",
      detail: row.source,
      conditional: true,
    })),
  );
}

function simpleWeaponCards(rows) {
  if (!rows.length) return `<div class="small-text">No weapons.</div>`;
  return `<div class="vstack gap-2">${rows
    .map(
      (row) => `
    <div class="sheet-card simple-weapon-card">
      <div class="mb-2">
        <div class="simple-label">Name</div>
        <div class="simple-value simple-weapon-name">${escapeHtml(row[0] || "-")}</div>
      </div>
      <div class="simple-weapon-block">
        ${simpleDetailRows([
          { label: "Attack Bonus", value: row[1] },
          ...(row[4] || []).map((item) => ({
            label: "Attack",
            value: item.main,
            detail: item.detail,
            conditional: item.conditional,
          })),
          { label: "Damage", value: row[2] },
          ...(row[6] || []).map((value) => ({ label: "", value })),
          ...(row[5] || []).map((item) => ({
            label: "Damage",
            value: item.main,
            detail: item.detail,
            conditional: item.conditional,
          })),
          { label: "Critical", value: row[3] },
        ])}
      </div>
    </div>
  `,
    )
    .join("")}</div>`;
}

function lootIcon(type) {
  return (
    {
      Weapon: "bi bi-crosshair",
      Armor: "bi bi-shield-fill",
      Shield: "bi bi-shield",
      Item: "bi bi-gem",
    }[type] || "bi bi-gem"
  );
}

function normalizeWondrousSlot(value = "") {
  const slot = String(value || "")
    .toLowerCase()
    .trim();
  if (!slot || slot === "-") return "none";
  if (slot.includes("armor")) return "armor";
  if (slot.includes("shield")) return "shield";
  if (slot.includes("weapon")) return "weapon";
  if (slot.includes("ring")) return "ring";
  if (slot.includes("rod") || slot.includes("wand")) return "rod";
  if (slot.includes("staff")) return "staff";
  if (slot.includes("headband")) return "headband";
  if (slot.includes("head") || slot.includes("helm")) return "head";
  if (slot.includes("eye") || slot.includes("goggle")) return "eyes";
  if (
    slot.includes("neck") ||
    slot.includes("amulet") ||
    slot.includes("necklace")
  )
    return "neck";
  if (
    slot.includes("shoulder") ||
    slot.includes("cloak") ||
    slot.includes("mantle") ||
    slot.includes("back")
  )
    return "shoulders";
  if (slot.includes("wrist")) return "wrists";
  if (
    slot.includes("hand") ||
    slot.includes("glove") ||
    slot.includes("gauntlet")
  )
    return "hands";
  if (slot.includes("feet") || slot.includes("boot")) return "feet";
  if (slot.includes("belt")) return "belt";
  if (slot.includes("chest") || slot.includes("torso")) return "chest";
  if (slot.includes("body")) return "body";
  if (slot.includes("held")) return "held";
  if (slot.includes("none")) return "none";
  if (slot.includes("special") || slot.includes("see text")) return "special";
  return "other";
}

function typeIconHtml(type) {
  return `<i class="${lootIcon(type)}"></i>`;
}

function wondrousSlotIcon(slot) {
  return getIconName(normalizeWondrousSlot(slot)) || typeIconHtml("Item");
}

function sourceItemIcon(item) {
  const slot = itemSlotLabel(item);
  if (slot) return wondrousSlotIcon(slot);
  return typeIconHtml(item?.type);
}

function itemSlotLabel(item) {
  return String(item?.details?.slot || "").trim();
}

function renderSlotValue(item) {
  const slot = itemSlotLabel(item);
  return slot
    ? `${wondrousSlotIcon(slot)}<span>${escapeHtml(slot)}</span>`
    : "";
}

function updateInventorySlotPreview() {
  const slot = el("inventorySlotInput").value.trim();
  el("inventorySlotValue").innerHTML = slot ? wondrousSlotIcon(slot) : "";
}

function syncInventorySlotForType() {
  PFItemEditor.syncSlotForType(inventoryEditorConfig());
}

function applyWondrousSource(details, checked) {
  if (checked) {
    details.source = "Wondrous Item";
  } else if (String(details.source || "").toLowerCase() === "wondrous item") {
    delete details.source;
  }
  return details;
}

function stripSourceHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value || "").replace(/^<\/h3>/i, "");
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function inferWondrousType(item) {
  const details = item.details || {};
  const slot = String(details.slot || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  if (slot.includes("shield") || name.includes("shield")) return "Shield";
  if (slot.includes("armor") || name.includes("armor")) return "Armor";
  if (slot.includes("weapon")) return "Weapon";
  return "Item";
}

function normalizeWondrousSourceItem(item, index) {
  const details = item.details || {};
  const type = inferWondrousType(item);
  return {
    id: `wondrous:${index}`,
    sourceType: "Wondrous Item",
    name: item.name || "Wondrous Item",
    description: stripSourceHtml(details.description || item.description || ""),
    type,
    count: 1,
    details: {
      source: "Wondrous Item",
      aura: details.aura || "",
      casterLevel: details.cl || "",
      slot: details.slot || "",
      price: details.price || "",
      weight: details.weight || "",
      requirements: details.requirements || "",
      cost: details.cost || "",
      link: item.link || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    immunities: Array.isArray(item.immunities) ? item.immunities : [],
    applyConditions: Array.isArray(item.applyConditions)
      ? item.applyConditions
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
    bonusRanks: Array.isArray(item.bonusRanks) ? item.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(item.extraRanksPerLevel)
      ? item.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(item.featGrants) ? item.featGrants : [],
    sizeChanges: Array.isArray(item.sizeChanges) ? item.sizeChanges : [],
    spellLikeAbilities: Array.isArray(item.spellLikeAbilities)
      ? item.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(item.casterLevelBonuses)
      ? item.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(item.spellDcBonuses)
      ? item.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(item.effectiveAttributeBonuses)
      ? item.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(item.grantDomains) ? item.grantDomains : [],
    generatedEquipment: Array.isArray(item.generatedEquipment)
      ? item.generatedEquipment
      : [],
    conditionalVariables: Array.isArray(item.conditionalVariables)
      ? item.conditionalVariables
      : [],
    activeMechanics: item.activeMechanics || null,
  };
}

function normalizeAlchemicalSourceItem(item, index) {
  const description = [
    ...(item.desc || []),
    ...(item.flavor || []),
    ...(Array.isArray(item.effect)
      ? item.effect
      : item.effect
        ? [item.effect]
        : []),
    item.damage || "",
    item.cure ? `Cure: ${item.cure}` : "",
    item.addiction ? `Addiction: ${item.addiction}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: `alchemical:${index}`,
    sourceType: "Alchemical Item",
    name: item.name || "Alchemical Item",
    description,
    type: "Item",
    count: 1,
    details: {
      source: "Alchemical Item",
      mundaneCategory: "Alchemical Creations",
      craftDc: item.dc || "",
      price: `${item.gp || 0} gp${item.sp ? `, ${item.sp} sp` : ""}${item.cp ? `, ${item.cp} cp` : ""}`,
      subtype: item.type || "",
      link: item.link || "",
    },
    effects: [],
  };
}

function normalizeMundaneSourceItem(item, index) {
  const details = item.details || {};
  return {
    id: `mundane:${index}`,
    sourceType: "Mundane Item",
    name: item.name || "Mundane Item",
    description: item.description || details.summary || "",
    type: "Item",
    count: item.count || 1,
    details: {
      source: "Mundane Item",
      mundaneCategory: details.mundaneCategory || "Adventuring Gear",
      mundaneGroup: details.mundaneGroup || "",
      price: details.price || "",
      weight: details.weight || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
      summary: details.summary || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    immunities: Array.isArray(item.immunities) ? item.immunities : [],
    applyConditions: Array.isArray(item.applyConditions)
      ? item.applyConditions
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
    bonusRanks: Array.isArray(item.bonusRanks) ? item.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(item.extraRanksPerLevel)
      ? item.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(item.featGrants) ? item.featGrants : [],
    sizeChanges: Array.isArray(item.sizeChanges) ? item.sizeChanges : [],
    spellLikeAbilities: Array.isArray(item.spellLikeAbilities)
      ? item.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(item.casterLevelBonuses)
      ? item.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(item.spellDcBonuses)
      ? item.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(item.effectiveAttributeBonuses)
      ? item.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(item.grantDomains) ? item.grantDomains : [],
    generatedEquipment: Array.isArray(item.generatedEquipment)
      ? item.generatedEquipment
      : [],
    conditionalVariables: Array.isArray(item.conditionalVariables)
      ? item.conditionalVariables
      : [],
    activeMechanics: item.activeMechanics || null,
  };
}

function normalizeWeaponSourceItem(item, index) {
  const details = item.details || {};
  return {
    id: `weapon:${index}`,
    sourceType: "Weapon",
    name: item.name || "Weapon",
    description:
      item.description ||
      [
        details.proficiency,
        details.weaponGroup,
        details.damageType ? `Damage type: ${details.damageType}` : "",
        details.special ? `Special: ${details.special}` : "",
      ]
        .filter(Boolean)
        .join(". "),
    type: item.type || "Weapon",
    count: item.count || 1,
    details: {
      source: details.source || "d20pfsrd weapons",
      proficiency: details.proficiency || "",
      weaponGroup: details.weaponGroup || "",
      weaponType: details.weaponType || "Melee Weapon (One-Handed)",
      attackScale: details.attackScale || "STR",
      damage: details.damage || "",
      extraDamage: details.extraDamage || [],
      damageSmall: details.damageSmall || "",
      critical: details.critical || "",
      damageScale: details.damageScale || "STR",
      enhancement: details.enhancement || "0",
      enchantment: details.enchantment || "",
      range: details.range || "",
      cost: details.cost || "",
      weight: details.weight || "",
      damageType: details.damageType || "",
      special: details.special || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    immunities: Array.isArray(item.immunities) ? item.immunities : [],
    applyConditions: Array.isArray(item.applyConditions)
      ? item.applyConditions
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
    bonusRanks: Array.isArray(item.bonusRanks) ? item.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(item.extraRanksPerLevel)
      ? item.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(item.featGrants) ? item.featGrants : [],
    sizeChanges: Array.isArray(item.sizeChanges) ? item.sizeChanges : [],
    spellLikeAbilities: Array.isArray(item.spellLikeAbilities)
      ? item.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(item.casterLevelBonuses)
      ? item.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(item.spellDcBonuses)
      ? item.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(item.effectiveAttributeBonuses)
      ? item.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(item.grantDomains) ? item.grantDomains : [],
    generatedEquipment: Array.isArray(item.generatedEquipment)
      ? item.generatedEquipment
      : [],
    conditionalVariables: Array.isArray(item.conditionalVariables)
      ? item.conditionalVariables
      : [],
    activeMechanics: item.activeMechanics || null,
  };
}

function normalizeFirearmSourceItem(item, index) {
  const normalized = normalizeWeaponSourceItem(item, index);
  normalized.id = `firearm:${index}`;
  normalized.sourceType = "Firearm";
  normalized.details = {
    ...normalized.details,
    source: item.details?.source || "d20pfsrd firearms",
    firearmEra: item.details?.firearmEra || "",
    misfire: item.details?.misfire || "",
    capacity: item.details?.capacity || "",
  };
  return normalized;
}

function normalizeArmorShieldSourceItem(item, index) {
  const details = item.details || {};
  const type = item.type === "Shield" ? "Shield" : "Armor";
  return {
    id: `${type.toLowerCase()}:${index}`,
    sourceType: type,
    name: item.name || type,
    description: item.description || details.summary || "",
    type,
    count: item.count || 1,
    details: {
      source: details.source || "d20pfsrd armor",
      armorGroup: details.armorGroup || type,
      bonus: details.bonus ?? 0,
      enhancement: details.enhancement ?? 0,
      enchantment: details.enchantment || "",
      maxDex: details.maxDex ?? null,
      penalty: details.penalty ?? null,
      failure: details.failure ?? null,
      speed30: details.speed30 || "",
      speed20: details.speed20 || "",
      cost: details.cost || "",
      weight: details.weight || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
      summary: details.summary || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    immunities: Array.isArray(item.immunities) ? item.immunities : [],
    applyConditions: Array.isArray(item.applyConditions)
      ? item.applyConditions
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
    bonusRanks: Array.isArray(item.bonusRanks) ? item.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(item.extraRanksPerLevel)
      ? item.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(item.featGrants) ? item.featGrants : [],
    sizeChanges: Array.isArray(item.sizeChanges) ? item.sizeChanges : [],
    spellLikeAbilities: Array.isArray(item.spellLikeAbilities)
      ? item.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(item.casterLevelBonuses)
      ? item.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(item.spellDcBonuses)
      ? item.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(item.effectiveAttributeBonuses)
      ? item.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(item.grantDomains) ? item.grantDomains : [],
    generatedEquipment: Array.isArray(item.generatedEquipment)
      ? item.generatedEquipment
      : [],
    conditionalVariables: Array.isArray(item.conditionalVariables)
      ? item.conditionalVariables
      : [],
    activeMechanics: item.activeMechanics || null,
  };
}

async function loadEnemySourceItems() {
  const rawWondrousItems = window.PFItemData
    ? await window.PFItemData.loadWondrousItems()
    : [];
  const wondrous = Array.isArray(rawWondrousItems)
    ? rawWondrousItems.map(normalizeWondrousSourceItem)
    : [];
  let weapons = [];
  try {
    const response = await fetch("./data/weapons.json", { cache: "no-cache" });
    if (response.ok)
      weapons = (await response.json()).map(normalizeWeaponSourceItem);
  } catch (error) {
    console.info("No generated weapons.json found yet.", error);
  }
  let firearms = [];
  try {
    const response = await fetch("./data/firearms.json", { cache: "no-cache" });
    if (response.ok)
      firearms = (await response.json()).map(normalizeFirearmSourceItem);
  } catch (error) {
    console.info("No generated firearms.json found yet.", error);
  }
  let armorShields = [];
  try {
    const response = await fetch("./data/armor-shields.json", {
      cache: "no-cache",
    });
    if (response.ok) {
      const data = await response.json();
      armorShields = (Array.isArray(data) ? data : []).map(
        normalizeArmorShieldSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated armor-shields.json found yet.", error);
  }
  let alchemical = [];
  try {
    const module = await import("./data/alchemical-crafts.js");
    alchemical = (Array.isArray(module.items) ? module.items : [])
      .filter((item) => item.name && item.dc)
      .map(normalizeAlchemicalSourceItem);
  } catch (error) {
    console.error("Could not load alchemical item source data", error);
  }
  let mundane = [];
  try {
    const response = await fetch("./data/mundane-items.json", {
      cache: "no-cache",
    });
    if (response.ok) {
      const data = await response.json();
      mundane = (Array.isArray(data) ? data : []).map(
        normalizeMundaneSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated mundane-items.json found yet.", error);
  }
  enemySourceItems = [
    ...weapons,
    ...firearms,
    ...armorShields,
    ...wondrous,
    ...mundane,
    ...alchemical,
  ].filter((item) => item.name && item.description);
}

function enemySourceItemMatchesCategory(item) {
  if (enemySourceItemCategory === "wondrous")
    return item.sourceType === "Wondrous Item";
  if (enemySourceItemCategory === "weapons")
    return ["Weapon", "Firearm"].includes(item.sourceType);
  if (enemySourceItemCategory === "armor") return item.type === "Armor";
  if (enemySourceItemCategory === "shields") return item.type === "Shield";
  if (enemySourceItemCategory === "mundane") {
    return (
      ["Mundane Item", "Alchemical Item"].includes(item.sourceType) &&
      (item.details?.mundaneCategory || "") === enemySourceItemMundaneCategory
    );
  }
  return true;
}

function searchableEnemySourceItem(item) {
  return `${item.name || ""} ${item.sourceType || ""} ${item.description || ""} ${Object.values(item.details || {}).join(" ")}`.toLowerCase();
}

function enemySourceItemSearchRank(item, term) {
  if (!term) return 0;
  return String(item.name || "")
    .toLowerCase()
    .includes(term)
    ? 0
    : 1;
}

function renderEnemySourceItemResults() {
  renderEnemySourceMundaneTabs();
  const term = enemySourceItemSearchTerm.trim().toLowerCase();
  if (enemySourceItemCategory === "all" && term.length < 3) {
    el("enemySourceItemCount").textContent = "0 items";
    el("enemySourceItemResults").innerHTML =
      `<div class="small-text">Type at least 3 characters to search all source items.</div>`;
    return;
  }
  const rows = enemySourceItems
    .filter(enemySourceItemMatchesCategory)
    .filter((item) => searchableEnemySourceItem(item).includes(term))
    .sort(
      (a, b) =>
        enemySourceItemSearchRank(a, term) -
          enemySourceItemSearchRank(b, term) ||
        String(a.name || "").localeCompare(String(b.name || "")),
    );
  el("enemySourceItemCount").textContent =
    `${rows.length} item${rows.length === 1 ? "" : "s"}`;
  el("enemySourceItemResults").innerHTML = rows.length
    ? `
    <div class="source-results-grid">
      ${rows
        .map(
          (item) => `
        <button class="source-result-card" type="button" data-enemy-source-item="${escapeHtml(item.id)}">
          <span class="source-result-icon">${sourceItemIcon(item)}</span>
          <div class="fw-semibold pe-2">${escapeHtml(item.name)}</div>
          <div class="small-text">${escapeHtml(item.sourceType)} | ${escapeHtml(item.type || "Item")}${itemSlotLabel(item) ? ` | Slot: ${escapeHtml(itemSlotLabel(item))}` : ""}</div>
          <div class="source-result-description mt-1">${escapeHtml(item.description)}</div>
        </button>
      `,
        )
        .join("")}
    </div>
  `
    : `<div class="small-text">No matching source items found.</div>`;
  el("enemySourceItemResults")
    .querySelectorAll("[data-enemy-source-item]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        addEnemySourceItemToInventory(button.dataset.enemySourceItem),
      );
    });
}

function renderEnemySourceMundaneTabs() {
  const tabs = el("enemySourceMundaneTabs");
  if (!tabs) return;
  const show = enemySourceItemCategory === "mundane";
  tabs.classList.toggle("d-none", !show);
  if (!show) return;
  tabs.innerHTML = MUNDANE_CATEGORIES.map(
    (category) => `
    <li class="source-list-tab-item" role="presentation">
      <button class="source-list-tab${enemySourceItemMundaneCategory === category ? " active" : ""}" type="button" data-enemy-source-mundane-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    </li>
  `,
  ).join("");
  tabs
    .querySelectorAll("[data-enemy-source-mundane-category]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        enemySourceItemMundaneCategory =
          button.dataset.enemySourceMundaneCategory || MUNDANE_CATEGORIES[0];
        renderEnemySourceItemResults();
      });
    });
}

function openEnemySourceItemsModal() {
  if (!isEnemySheetMode) return;
  enemySourceItemCategory = "all";
  enemySourceItemMundaneCategory = MUNDANE_CATEGORIES[0];
  enemySourceItemSearchTerm = "";
  el("enemySourceItemSearch").value = "";
  el("enemySourceItemTabs")
    .querySelectorAll("[data-source-category]")
    .forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.sourceCategory === "all");
    });
  renderEnemySourceItemResults();
  enemySourceItemModal.show();
  setTimeout(() => el("enemySourceItemSearch").focus(), 150);
}

function rememberSelectedCharacter(characterId, contextKey = sheetContextKey) {
  const key = `pf_last_sheet_character_id_${contextKey}`;
  if (characterId) localStorage.setItem(key, characterId);
  else localStorage.removeItem(key);
}

function rememberedSheetCharacter(contextKey = sheetContextKey) {
  return localStorage.getItem(`pf_last_sheet_character_id_${contextKey}`) || "";
}

function classNameOf(definition) {
  return definition?.name || definition?.class || "";
}

const CLASS_GROUPS = [
  ["core", "Core"],
  ["base", "Base"],
  ["alternate", "Alternate"],
  ["occult", "Occult"],
  ["hybrid", "Hybrid"],
  ["unchained", "Unchained"],
  ["prestige", "Prestige"],
  ["npc", "NPC"],
];

function classTypeOf(definition) {
  return String(
    definition?.type || definition?.category || "base",
  ).toLowerCase();
}

function groupedClassOptions(definitions, selected = "") {
  const selectedClass = String(selected || "");
  return CLASS_GROUPS.map(([type, label]) => {
    const options = definitions
      .filter((definition) => classTypeOf(definition) === type)
      .sort((a, b) => classNameOf(a).localeCompare(classNameOf(b)));
    if (!options.length) return "";
    return `
      <optgroup label="${escapeHtml(label)}">
        ${options
          .map((definition) => {
            const name = classNameOf(definition);
            return `<option value="${escapeHtml(name)}" ${name === selectedClass ? "selected" : ""}>${escapeHtml(name)}</option>`;
          })
          .join("")}
      </optgroup>
    `;
  }).join("");
}

function playableClassDefinitions() {
  return classDefinitions.filter((definition) => {
    const type = classTypeOf(definition);
    return (
      classNameOf(definition) &&
      !type.includes("prestige") &&
      !type.includes("3rd")
    );
  });
}

function classNamesFromSheet(sheet = {}) {
  return [
    ...new Set(
      (Array.isArray(sheet?.classProgression) ? sheet.classProgression : [])
        .map((row) => String(row?.className || row?.class || "").trim())
        .filter(Boolean),
    ),
  ];
}

async function loadClassDefinitions(classNames = []) {
  try {
    const requestedNames = [
      ...new Set(
        (Array.isArray(classNames) ? classNames : [classNames])
          .map((name) => String(name || "").trim())
          .filter(Boolean),
      ),
    ];
    const [index, requestedDefinitions] = await Promise.all([
      PFClassData.loadIndex(),
      PFClassData.loadClassesByNames(requestedNames),
    ]);
    requestedDefinitions.forEach((definition) => {
      loadedClassDefinitions.set(
        classNameOf(definition).toLowerCase(),
        definition,
      );
    });
    classDefinitions = index.map(
      (entry) =>
        loadedClassDefinitions.get(classNameOf(entry).toLowerCase()) || entry,
    );
  } catch (error) {
    console.warn("Could not load class data", error);
  }
  return classDefinitions;
}

async function ensureClassDefinitionsForSheet(sheet = {}) {
  return loadClassDefinitions(classNamesFromSheet(sheet));
}

async function restoreSheetWithClassDefinitions(sheet = {}) {
  await ensureClassDefinitionsForSheet(sheet);
  restoreSheet(sheet);
}

async function loadRaceDefinitions() {
  if (raceDefinitions.races?.length) return raceDefinitions;
  try {
    if (window.PFRaceData?.loadRaces) {
      raceDefinitions = await window.PFRaceData.loadRaces();
    } else {
      const response = await fetch("./data/races.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      raceDefinitions = {
        groups: Array.isArray(data.groups) ? data.groups : [],
        races: Array.isArray(data.races) ? data.races : [],
      };
    }
  } catch (error) {
    console.warn("Could not load race data", error);
    const coreRaces = [
      "Dwarf",
      "Elf",
      "Gnome",
      "Half-Elf",
      "Half-Orc",
      "Halfling",
      "Human",
    ].map((name) => ({ name, race: name, group: "Core Races" }));
    raceDefinitions = {
      groups: [{ name: "Core Races", races: coreRaces }],
      races: coreRaces,
    };
  }
  return raceDefinitions;
}

async function loadFeatDefinitions() {
  if (featDefinitions.feats?.length) return featDefinitions;
  try {
    if (window.PFFeatData?.loadFeats) {
      featDefinitions = await window.PFFeatData.loadFeats();
    } else {
      const response = await fetch("./data/feats.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      featDefinitions = {
        types: Array.isArray(data.types) ? data.types : [],
        feats: Array.isArray(data.feats) ? data.feats : [],
      };
    }
  } catch (error) {
    console.warn("Could not load feat data", error);
    featDefinitions = { types: [], feats: [] };
  }
  return featDefinitions;
}

async function loadDomainDefinitions() {
  if (domainDefinitions.domains?.length) return domainDefinitions;
  try {
    const domains = window.PFSpellData?.loadDomains
      ? await window.PFSpellData.loadDomains()
      : await fetch("./data/domains.json", { cache: "no-cache" }).then(
          async (response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : data.domains || [];
          },
        );
    domainDefinitions = { domains: Array.isArray(domains) ? domains : [] };
  } catch (error) {
    console.warn("Could not load domain data", error);
    domainDefinitions = { domains: [] };
  }
  return domainDefinitions;
}

async function loadBloodlineDefinitions() {
  if (bloodlineDefinitions.bloodlines?.length) return bloodlineDefinitions;
  try {
    const response = await fetch("./data/bloodlines.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    bloodlineDefinitions = {
      bloodlines: Array.isArray(data) ? data : data.bloodlines || [],
    };
  } catch (error) {
    console.warn("Could not load bloodline data", error);
    bloodlineDefinitions = { bloodlines: [] };
  }
  return bloodlineDefinitions;
}

function classDefinitionByName(name) {
  const target = String(name || "").toLowerCase();
  return (
    classDefinitions.find(
      (definition) => classNameOf(definition).toLowerCase() === target,
    ) || null
  );
}

function normalizeClassProgression(raw = []) {
  const byLevel = new Map(
    (Array.isArray(raw) ? raw : []).map((row) => [
      Number(row.level),
      row.className || row.class || "",
    ]),
  );
  return Array.from({ length: 20 }, (_, index) => ({
    level: index + 1,
    className: byLevel.get(index + 1) || "",
  }));
}

function classLevelAt(definition, classLevel) {
  const progression = definition?.levelProgression || definition?.levels || [];
  return (
    progression.find((row) => Number(row.level) === Number(classLevel)) || null
  );
}

function progressionClassCounts(limit = Math.max(1, num("characterLevel"))) {
  const counts = {};
  classProgression.slice(0, Math.max(1, limit)).forEach((row) => {
    if (!row.className) return;
    counts[row.className] = (counts[row.className] || 0) + 1;
  });
  return counts;
}

function collectClassFeatureBuffs() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const classLevels = progressionClassCounts(limit);
  const buffs = [];
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      const context = {
        category: "Class Feature",
        sourceClass: className,
        sourceClassLevel: classLevel,
        sourceCharacterLevel: row.level,
        characterLevel: limit,
        classLevel,
        classLevels,
        casterLevel: classLevel,
        permanent: true,
      };
      const variableContext = { className, classLevel, characterLevel: row.level };
      const resolvedFeature = applyClassFeatureConditionalVariables(
        applyClassFeatureMechanicChoices(feature, variableContext),
        variableContext,
      );
      const passiveFeature = {
        ...resolvedFeature,
        ...(window.PFEffectMechanics?.passiveMechanics?.(resolvedFeature) ||
          resolvedFeature),
      };
      // Activatable features (Rage, Smite Evil, ...) aren't always-on --
      // their effects only apply once cast, via collectActivatableAbilities.
      if (
          window.PFEffectMechanics?.hasAnyMechanics?.(passiveFeature)
      ) {
        buffs.push({
          ...context,
          name: passiveFeature.name || "Class Feature",
          description: passiveFeature.description || passiveFeature.desc || "",
          detailUrl:
            passiveFeature.url || passiveFeature.link || passiveFeature.sourceUrl || "",
          detailData: {
            type: "Class Feature",
            class: className,
            description:
              passiveFeature.description || passiveFeature.desc || "",
          },
          bonuses: passiveFeature.effects,
          bonusRanks: passiveFeature.bonusRanks,
          extraRanksPerLevel: passiveFeature.extraRanksPerLevel,
          featGrants: passiveFeature.featGrants,
          sizeChanges: passiveFeature.sizeChanges,
          immunities: passiveFeature.immunities,
          applyConditions: passiveFeature.applyConditions,
          spellLikeAbilities: passiveFeature.spellLikeAbilities,
          casterLevelBonuses: passiveFeature.casterLevelBonuses,
          spellDcBonuses: passiveFeature.spellDcBonuses,
          effectiveAttributeBonuses: passiveFeature.effectiveAttributeBonuses,
          grantDomains: passiveFeature.grantDomains,
          generatedEquipment: passiveFeature.generatedEquipment,
          auraConfig: passiveFeature.auraConfig || null,
        });
      }
      featurePools(feature).forEach((pool) => {
        // Choices whose pool contributes to an activatable ability (e.g.
        // rage powers into Rage) get bundled in at cast time instead of
        // applying as their own always-on buff.
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          {
            ...feature,
            className,
            classLevel,
            characterLevel: row.level,
          },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const selectedOption = (pool.options || []).find(
          (item) => item.name === selected,
        );
        const option = selectedOption
          ? applyClassFeaturePoolOptionMechanicChoices(
              feature,
              pool,
              selectedOption,
              {
                className,
                classLevel,
                characterLevel: row.level,
              },
            )
          : null;
        if (
          option &&
          ((Array.isArray(option.effects) && option.effects.length) ||
            (Array.isArray(option.bonusRanks) && option.bonusRanks.length) ||
            (Array.isArray(option.extraRanksPerLevel) &&
              option.extraRanksPerLevel.length) ||
            (Array.isArray(option.featGrants) &&
              option.featGrants.length) ||
            (Array.isArray(option.sizeChanges) && option.sizeChanges.length) ||
            (Array.isArray(option.immunities) && option.immunities.length) ||
            (Array.isArray(option.applyConditions) &&
              option.applyConditions.length) ||
            (Array.isArray(option.spellLikeAbilities) &&
              option.spellLikeAbilities.length) ||
            (Array.isArray(option.casterLevelBonuses) &&
              option.casterLevelBonuses.length) ||
            (Array.isArray(option.spellDcBonuses) &&
              option.spellDcBonuses.length) ||
            (Array.isArray(option.effectiveAttributeBonuses) &&
              option.effectiveAttributeBonuses.length) ||
            (Array.isArray(option.grantDomains) &&
              option.grantDomains.length) ||
            (Array.isArray(option.generatedEquipment) &&
              option.generatedEquipment.length))
        ) {
          buffs.push({
            ...context,
            name: option.name || pool.name || "Class Feature Choice",
            description: option.description || option.desc || pool.description || "",
            detailUrl: option.url || option.link || option.sourceUrl || "",
            detailData: {
              type: "Class Feature",
              class: className,
              description:
                option.description || option.desc || pool.description || "",
            },
            bonuses: option.effects,
            bonusRanks: option.bonusRanks,
            extraRanksPerLevel: option.extraRanksPerLevel,
            featGrants: option.featGrants,
            sizeChanges: option.sizeChanges,
            immunities: option.immunities,
            applyConditions: option.applyConditions,
            spellLikeAbilities: option.spellLikeAbilities,
            casterLevelBonuses: option.casterLevelBonuses,
            spellDcBonuses: option.spellDcBonuses,
            effectiveAttributeBonuses: option.effectiveAttributeBonuses,
            grantDomains: option.grantDomains,
            generatedEquipment: option.generatedEquipment,
            auraConfig: option.auraConfig || null,
          });
        }
      });
    });
  });
  return buffs;
}

// Resolves every class feature's damage reduction (scaled to the current
// level via the same milestone/every-N-levels math as regular stat
// bonuses) into "amount/type" entries, e.g. { amount: 3, overcomeType:
// "magic", source: "Damage Reduction" }.
function collectClassFeatureDamageReduction() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const classLevels = progressionClassCounts(limit);
  const entries = [];
  const addEntries = (drList, context, sourceName, active = false) => {
    (Array.isArray(drList) ? drList : []).forEach((dr) => {
      const amount = window.PFBuffs?.scaledBonusValue
        ? window.PFBuffs.scaledBonusValue(
            { value: dr.amount, bonusScale: dr.bonusScale || dr.scale },
            context,
          )
        : Number(dr.amount || 0);
      if (amount <= 0) return;
      entries.push({
        amount,
        overcomeType: dr.overcomeType || "",
        source: sourceName,
        active,
      });
    });
  };
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      const context = {
        characterLevel: limit,
        classLevel,
        classLevels,
        casterLevel: classLevel,
      };
      addEntries(
        window.PFEffectMechanics?.passiveMechanics?.(feature)
          ?.damageReduction || [],
        context,
        feature.name || "Class Feature",
      );
      featurePools(feature).forEach((pool) => {
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          { ...feature, className, classLevel, characterLevel: row.level },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (option) {
          addEntries(
            option.damageReduction,
            context,
            option.name || pool.name || "Class Feature Choice",
          );
        }
      });
    });
  });
  collectSelectedRaceBuffs().forEach((buff) => {
    addEntries(buff.damageReduction, buff, buff.name || "Race");
  });
  collectSelectedFeatBuffs().forEach((buff) => {
    addEntries(buff.damageReduction, buff, buff.name || "Feat");
  });
  // Abilities that are currently active (Rage, etc.) can carry their
  // own bundled DR -- e.g. Celestial Totem, Greater's SR only applies
  // while raging, so it's on the active buff entry rather than an
  // always-on class feature. Scaled against that buff's own
  // casterLevel/characterLevel (locked in when it was activated), not
  // the character's current class-level walk.
  (activeBuffs || []).forEach((buff) => {
    addEntries(buff.damageReduction, buff, buff.name || "Active Effect", true);
  });
  return entries;
}

function normalizeDamageReductionType(value = "") {
  return String(value || "")
    .trim()
    .replace(/^dr\s+/i, "")
    .replace(/[.;]+$/g, "")
    .replace(/\s+/g, " ") || "-";
}

function damageReductionTypeKey(value = "") {
  return normalizeDamageReductionType(value).toLowerCase();
}

function collectCustomDamageReduction() {
  const text = el("damageReduction")?.value || "";
  const entries = [];
  const pattern = /(?:^|[,;\n|])\s*(?:DR\s*)?(\d+)\s*\/\s*([^,;\n|]+)/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const amount = Number(match[1] || 0);
    if (amount <= 0) continue;
    entries.push({
      amount,
      overcomeType: normalizeDamageReductionType(match[2]),
      source: "Custom DR",
      custom: true,
    });
  }
  return entries;
}

function defenseConditionKey(entry = {}) {
  return String(entry.appliesWhen || "").trim().toLowerCase();
}

function defenseSourceText(entry = {}) {
  return String(entry.source || "Effect").trim() || "Effect";
}

function defenseEntryWithSource(entry = {}, textFn = () => "") {
  return `${textFn(entry)} (${defenseSourceText(entry)})`;
}

function strongestDefenseApplicationBreakdown(entries = [], keyFn) {
  const groups = new Map();
  (Array.isArray(entries) ? entries : []).forEach((entry, order) => {
    const amount = Number(entry.amount || entry.value || 0);
    if (amount <= 0) return;
    const key = keyFn(entry);
    if (!key) return;
    const normalized = {
      ...entry,
      amount,
      _defenseKey: key,
      _defenseOrder: order,
    };
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(normalized);
  });

  const applied = [];
  const overridden = [];
  groups.forEach((group) => {
    const best = group.reduce((winner, entry) => {
      if (entry.amount > winner.amount) return entry;
      if (
        entry.amount === winner.amount &&
        entry._defenseOrder < winner._defenseOrder
      ) {
        return entry;
      }
      return winner;
    }, group[0]);
    applied.push(best);
    group
      .filter((entry) => entry !== best)
      .forEach((entry) => overridden.push({ ...entry, overriddenBy: best }));
  });

  const sortByAmount = (a, b) => {
    const amountDiff = Number(b.amount || 0) - Number(a.amount || 0);
    if (amountDiff) return amountDiff;
    return defenseSourceText(a).localeCompare(defenseSourceText(b));
  };
  return {
    applied: applied.sort(sortByAmount),
    overridden: overridden.sort(sortByAmount),
  };
}

function renderDefenseApplicationRows(
  label,
  entries = [],
  textFn = () => "",
  className = "",
) {
  if (!entries.length) return "";
  const rows = entries
    .map((entry) => {
      const name = escapeHtml(defenseEntryWithSource(entry, textFn));
      const coveredBy = entry.overriddenBy
        ? ` covered by <span class="calc-buff-name">${escapeHtml(defenseEntryWithSource(entry.overriddenBy, textFn))}</span>`
        : "";
      return `<div class="${className}">${escapeHtml(label)}: <span class="calc-buff-name">${name}</span>${coveredBy}</div>`;
    })
    .join("");
  return `<div class="calc-buff-block">${rows}</div>`;
}

function activeDefenseApplied(baseBreakdown, activeBreakdown) {
  const baseAppliedKeys = new Set(
    (baseBreakdown.applied || []).map((entry) => entry._defenseKey || ""),
  );
  return (activeBreakdown.applied || []).filter(
    (entry) => entry.active && !baseAppliedKeys.has(entry._defenseKey),
  );
}

function activeDefenseOverridden(activeBreakdown) {
  return (activeBreakdown.overridden || []).filter(
    (entry) => entry.active || entry.overriddenBy?.active,
  );
}

function normalizeResistanceType(value = "") {
  return String(value || "")
    .trim()
    .replace(/^resist(?:ance)?\s+(?:to\s+)?/i, "")
    .replace(/\s+resistance$/i, "")
    .replace(/[.;]+$/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function resistanceTypeKey(value = "") {
  return normalizeResistanceType(value).toLowerCase();
}

function resistanceTypeText(value = "") {
  return normalizeResistanceType(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resistanceEntryText(entry = {}) {
  const type = resistanceTypeText(entry.type || entry.resistanceType);
  const isConditional = entry.conditional ?? Boolean(entry.appliesWhen);
  const appliesWhen = entry.appliesWhen || "";
  return `${type || "Resistance"} resistance ${Number(entry.amount || 0)}${
    isConditional ? ` (${appliesWhen || "conditional"})` : ""
  }`;
}

function collectCustomSpellResistance() {
  const text = el("spellResistance")?.value || "";
  const match = String(text).match(/\d+/);
  const amount = match ? Number(match[0]) : 0;
  if (amount <= 0) return [];
  return [
    {
      amount,
      source: "Custom SR",
      custom: true,
    },
  ];
}

function collectCustomResistances() {
  const text = el("resistances")?.value || "";
  return String(text)
    .split(/[,;\n|]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const amountFirst = entry.match(
        /^(?:resist(?:ance)?\s*)?(\d+)\s+(.+?)(?:\s+resistance)?$/i,
      );
      const typeFirst = entry.match(
        /^(?:resist(?:ance)?\s+(?:to\s+)?)?(.+?)(?:\s+resistance)?\s+(\d+)$/i,
      );
      const match = amountFirst || typeFirst;
      if (!match) return null;
      const amount = Number(amountFirst ? match[1] : match[2]);
      const type = normalizeResistanceType(amountFirst ? match[2] : match[1]);
      if (!type || amount <= 0) return null;
      return {
        type,
        amount,
        source: "Custom Resistance",
        custom: true,
      };
    })
    .filter(Boolean);
}

function collectEffectResistances() {
  const entries = [];
  const activeSet = new Set(activeBuffs || []);
  calculationBuffs().forEach((buff) => {
    (Array.isArray(buff.bonuses) ? buff.bonuses : []).forEach((bonus) => {
      const stat = String(bonus.stat || "").trim().toLowerCase();
      if (!stat.startsWith("resistance:")) return;
      const amount = window.PFBuffs?.scaledBonusValue
        ? window.PFBuffs.scaledBonusValue(bonus, buff)
        : Number(bonus.value || 0);
      if (amount <= 0) return;
      entries.push({
        type: normalizeResistanceType(stat.slice("resistance:".length)),
        amount,
        conditional: bonus.conditional,
        appliesWhen: bonus.appliesWhen,
        condition: bonus.condition,
        source: buff.name || "Effect",
        active: activeSet.has(buff),
      });
    });
  });
  return entries;
}

function updateResistanceSummary() {
  const summary = el("resistancesFromEffects");
  if (!summary) return;
  const custom = collectCustomResistances();
  const entries = collectEffectResistances();
  const always = entries.filter((entry) => !entry.active);
  const active = entries.filter((entry) => entry.active);
  const keyFn = (entry) =>
    `${resistanceTypeKey(entry.type || entry.resistanceType)}|${defenseConditionKey(entry)}`;
  const baseBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always],
    keyFn,
  );
  const activeBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always, ...active],
    keyFn,
  );
  const activeApplied = activeDefenseApplied(baseBreakdown, activeBreakdown);
  const activeOverridden = activeDefenseOverridden(activeBreakdown);
  if (
    !custom.length &&
    !always.length &&
    !active.length &&
    !baseBreakdown.applied.length
  ) {
    summary.innerHTML = "";
    summary.classList.add("d-none");
    return;
  }
  const parts = [
    renderDefenseApplicationRows(
      "applied",
      baseBreakdown.applied,
      resistanceEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden",
      baseBreakdown.overridden,
      resistanceEntryText,
      "calc-overridden",
    ),
    renderDefenseApplicationRows(
      "while active",
      activeApplied,
      resistanceEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden while active",
      activeOverridden,
      resistanceEntryText,
      "calc-overridden",
    ),
  ].filter(Boolean);
  summary.innerHTML = `<div class="calc-buffs">${parts.join("")}</div>`;
  summary.classList.remove("d-none");
}

function normalizeImmunityName(value = "") {
  return String(value || "")
    .trim()
    .replace(/^immunit(?:y|ies)\s+(?:to\s+)?/i, "")
    .replace(/[.;]+$/g, "")
    .replace(/\s+/g, " ");
}

function immunityKey(entry = {}) {
  return [
    normalizeImmunityName(entry.name || entry.immunity || entry.type).toLowerCase(),
    String(entry.appliesWhen || "").trim().toLowerCase(),
  ].join("|");
}

function immunityEntryText(entry = {}) {
  const name =
    normalizeImmunityName(entry.name || entry.immunity || entry.type) || "-";
  const isConditional = entry.conditional ?? Boolean(entry.appliesWhen);
  const appliesWhen = entry.appliesWhen || "";
  return `${name}${isConditional ? ` (${appliesWhen || "conditional"})` : ""}`;
}

function immunitySourceText(entry = {}) {
  return String(entry.source || "Effect").trim() || "Effect";
}

function immunityEntryTextWithSource(entry = {}) {
  return `${immunityEntryText(entry)} (${immunitySourceText(entry)})`;
}

function collectCustomImmunities() {
  const text = el("immunities")?.value || "";
  return String(text)
    .split(/[,;\n|]+/)
    .map(normalizeImmunityName)
    .filter(Boolean)
    .map((name) => ({
      name,
      source: "Custom Immunity",
      custom: true,
    }));
}

function collectClassFeatureImmunities() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const classLevels = progressionClassCounts(limit);
  const entries = [];
  const addEntries = (immunityList, sourceName, active = false) => {
    (Array.isArray(immunityList) ? immunityList : []).forEach((immunity) => {
      const name = normalizeImmunityName(
        immunity.name || immunity.immunity || immunity.type,
      );
      if (!name) return;
      entries.push({
        name,
        conditional: immunity.conditional,
        appliesWhen: immunity.appliesWhen,
        condition: immunity.condition,
        source: sourceName,
        active,
      });
    });
  };
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      addEntries(
        window.PFEffectMechanics?.passiveMechanics?.(feature)?.immunities || [],
        feature.name || "Class Feature",
      );
      featurePools(feature).forEach((pool) => {
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          { ...feature, className, classLevel, characterLevel: row.level },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (option) {
          addEntries(
            option.immunities,
            option.name || pool.name || "Class Feature Choice",
          );
        }
      });
    });
  });
  collectSelectedRaceBuffs().forEach((buff) => {
    addEntries(buff.immunities, buff.name || "Race");
  });
  collectSelectedFeatBuffs().forEach((buff) => {
    addEntries(buff.immunities, buff.name || "Feat");
  });
  (activeBuffs || []).forEach((buff) => {
    addEntries(buff.immunities, buff.name || "Active Effect", true);
  });
  return entries;
}

function uniqueImmunityEntries(entries = []) {
  const seen = new Map();
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const key = immunityKey(entry);
    if (!key.startsWith("|") && !seen.has(key)) seen.set(key, entry);
  });
  return [...seen.values()].sort((a, b) =>
    immunityEntryText(a).localeCompare(immunityEntryText(b)),
  );
}

function immunityApplicationBreakdown(entries = []) {
  const seen = new Map();
  const applied = [];
  const overridden = [];
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const key = immunityKey(entry);
    if (key.startsWith("|")) return;
    const normalized = {
      ...entry,
      name: normalizeImmunityName(entry.name || entry.immunity || entry.type),
    };
    const existing = seen.get(key);
    if (existing) {
      overridden.push({
        ...normalized,
        overriddenBy: existing,
      });
      return;
    }
    seen.set(key, normalized);
    applied.push(normalized);
  });
  const sortByText = (a, b) =>
    immunityEntryText(a).localeCompare(immunityEntryText(b));
  return {
    applied: applied.sort(sortByText),
    overridden: overridden.sort(sortByText),
  };
}

function renderImmunityApplicationRows(label, entries = [], className = "") {
  if (!entries.length) return "";
  const rows = entries
    .map((entry) => {
      const name = escapeHtml(immunityEntryTextWithSource(entry));
      const coveredBy = entry.overriddenBy
        ? ` covered by <span class="calc-buff-name">${escapeHtml(immunityEntryTextWithSource(entry.overriddenBy))}</span>`
        : "";
      return `<div class="${className}">${escapeHtml(label)}: <span class="calc-buff-name">${name}</span>${coveredBy}</div>`;
    })
    .join("");
  return `<div class="calc-buff-block">${rows}</div>`;
}

function updateClassFeatureDamageReductionSummary() {
  const summary = el("damageReductionFromClasses");
  if (!summary) return;
  const custom = collectCustomDamageReduction();
  const entries = collectClassFeatureDamageReduction();
  const always = entries.filter((entry) => !entry.active);
  const active = entries.filter((entry) => entry.active);
  const keyFn = (entry) =>
    `${damageReductionTypeKey(entry.overcomeType)}|${defenseConditionKey(entry)}`;
  const baseBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always],
    keyFn,
  );
  const activeBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always, ...active],
    keyFn,
  );
  const activeApplied = activeDefenseApplied(baseBreakdown, activeBreakdown);
  const activeOverridden = activeDefenseOverridden(activeBreakdown);
  if (
    !custom.length &&
    !always.length &&
    !active.length &&
    !baseBreakdown.applied.length
  ) {
    summary.innerHTML = "";
    summary.classList.add("d-none");
    return;
  }
  const parts = [
    renderDefenseApplicationRows(
      "applied",
      baseBreakdown.applied,
      drEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden",
      baseBreakdown.overridden,
      drEntryText,
      "calc-overridden",
    ),
    renderDefenseApplicationRows(
      "while active",
      activeApplied,
      drEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden while active",
      activeOverridden,
      drEntryText,
      "calc-overridden",
    ),
  ].filter(Boolean);
  summary.innerHTML = `<div class="calc-buffs">${parts.join("")}</div>`;
  summary.classList.remove("d-none");
}

function updateClassFeatureImmunitySummary() {
  const summary = el("immunitiesFromEffects");
  if (!summary) return;
  const custom = collectCustomImmunities();
  const entries = collectClassFeatureImmunities();
  const always = entries.filter((entry) => !entry.active);
  const active = entries.filter((entry) => entry.active);
  const baseBreakdown = immunityApplicationBreakdown([...custom, ...always]);
  const activeBreakdown = immunityApplicationBreakdown([
    ...custom,
    ...always,
    ...active,
  ]);
  const baseAppliedKeys = new Set(baseBreakdown.applied.map(immunityKey));
  const activeApplied = activeBreakdown.applied.filter(
    (entry) => entry.active && !baseAppliedKeys.has(immunityKey(entry)),
  );
  const activeOverridden = activeBreakdown.overridden.filter(
    (entry) => entry.active || entry.overriddenBy?.active,
  );
  if (
    !custom.length &&
    !always.length &&
    !active.length &&
    !baseBreakdown.applied.length
  ) {
    summary.innerHTML = "";
    summary.classList.add("d-none");
    return;
  }
  const parts = [
    renderImmunityApplicationRows(
      "applied",
      baseBreakdown.applied,
      "calc-applied",
    ),
    renderImmunityApplicationRows(
      "overridden",
      baseBreakdown.overridden,
      "calc-overridden",
    ),
    renderImmunityApplicationRows("while active", activeApplied, "calc-applied"),
    renderImmunityApplicationRows(
      "overridden while active",
      activeOverridden,
      "calc-overridden",
    ),
  ].filter(Boolean);
  summary.innerHTML = `<div class="calc-buffs">${parts.join("")}</div>`;
  summary.classList.remove("d-none");
}

// Same idea as collectClassFeatureDamageReduction, but for Spell
// Resistance -- fewer class features grant it, but the ones that do
// (protective auras, some archetypes) scale the same way DR does.
function collectClassFeatureSpellResistance() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const classLevels = progressionClassCounts(limit);
  const entries = [];
  const addEntries = (srList, context, sourceName, active = false) => {
    (Array.isArray(srList) ? srList : []).forEach((sr) => {
      const amount = window.PFBuffs?.scaledBonusValue
        ? window.PFBuffs.scaledBonusValue(
            { value: sr.amount, bonusScale: sr.bonusScale || sr.scale },
            context,
          )
        : Number(sr.amount || 0);
      if (amount <= 0) return;
      entries.push({
        amount,
        conditional: sr.conditional,
        appliesWhen: sr.appliesWhen,
        condition: sr.condition,
        source: sourceName,
        active,
      });
    });
  };
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      const context = {
        characterLevel: limit,
        classLevel,
        classLevels,
        casterLevel: classLevel,
      };
      addEntries(
        window.PFEffectMechanics?.passiveMechanics?.(feature)
          ?.spellResistance || [],
        context,
        feature.name || "Class Feature",
      );
      featurePools(feature).forEach((pool) => {
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          { ...feature, className, classLevel, characterLevel: row.level },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (option) {
          addEntries(
            option.spellResistance,
            context,
            option.name || pool.name || "Class Feature Choice",
          );
        }
      });
    });
  });
  collectSelectedRaceBuffs().forEach((buff) => {
    addEntries(buff.spellResistance, buff, buff.name || "Race");
  });
  collectSelectedFeatBuffs().forEach((buff) => {
    addEntries(buff.spellResistance, buff, buff.name || "Feat");
  });
  // Same reasoning as collectClassFeatureDamageReduction: an ability
  // that's currently active can carry its own bundled SR (e.g.
  // Celestial Totem, Greater's SR only while raging).
  (activeBuffs || []).forEach((buff) => {
    addEntries(buff.spellResistance, buff, buff.name || "Active Effect", true);
  });
  return entries;
}

// SR shows up two ways in this app: the dedicated DR/SR/Class-Skill
// "entity" (a flat SR value like "SR 13" -- doesn't stack with other
// flat SR, you use whichever applies) collected above by
// collectClassFeatureSpellResistance(), and a plain numeric "spell
// resistance" stat in the Effects list, for items/effects that instead
// ADD to whatever SR you already have (e.g. Ring of the Godless: "the
// wearer's spell resistance, if any, increases by..."). That second
// kind is already summed correctly (respecting bonus-type stacking,
// same as AC/attack/etc.) by PFBuffs.calculateStatsDetailed -- it just
// was never surfaced anywhere. This pulls that total (and, since a
// bonus like the Ring's genuinely only applies vs. divine spells, its
// conditional entries too) into the same hint line.
function updateClassFeatureSpellResistanceSummary() {
  const summary = el("spellResistanceFromClasses");
  if (!summary) return;
  const custom = collectCustomSpellResistance();
  const entries = collectClassFeatureSpellResistance();
  const buffed = window.PFBuffs?.calculateStatsDetailed(
    calculationBuffs(),
    sheetToBaseline(),
  );
  const srBreakdown = buffed?.breakdown?.["spell resistance"] || [];
  const bonusUsed = srBreakdown.filter((entry) => entry.applied === true);
  const bonusConditional = srBreakdown.filter(
    (entry) => entry.applied === "conditional",
  );
  const bonusOverridden = srBreakdown.filter((entry) => entry.applied === false);
  const always = entries.filter((entry) => !entry.active);
  const active = entries.filter((entry) => entry.active);
  const keyFn = (entry) => `sr|${defenseConditionKey(entry)}`;
  const baseBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always],
    keyFn,
  );
  const activeBreakdown = strongestDefenseApplicationBreakdown(
    [...custom, ...always, ...active],
    keyFn,
  );
  const activeApplied = activeDefenseApplied(baseBreakdown, activeBreakdown);
  const activeOverridden = activeDefenseOverridden(activeBreakdown);
  if (
    !custom.length &&
    !entries.length &&
    !bonusUsed.length &&
    !bonusConditional.length &&
    !bonusOverridden.length
  ) {
    summary.innerHTML = "";
    summary.classList.add("d-none");
    return;
  }
  const renderSrBonusRows = (label, rows = [], className = "") => {
    if (!rows.length) return "";
    return `<div class="calc-buff-block">${rows
      .map((entry) => {
        const detail = conciseBreakdownDetail(entry.detail);
        const detailText = detail ? ` | ${escapeHtml(detail)}` : "";
        const amount = Number(entry.value || 0);
        const valueClass =
          amount > 0
            ? "calc-value-positive"
            : amount < 0
              ? "calc-value-negative"
              : "calc-value-neutral";
        return `<div class="${className}">${escapeHtml(label)}: <span class="calc-buff-name">${escapeHtml(entry.source || "Effect")}</span> <span class="${valueClass}">${signed(amount)}</span> (${escapeHtml(entry.type || "untyped")})${detailText}</div>`;
      })
      .join("")}</div>`;
  };
  const parts = [
    renderDefenseApplicationRows(
      "applied",
      baseBreakdown.applied,
      srEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden",
      baseBreakdown.overridden,
      srEntryText,
      "calc-overridden",
    ),
    renderDefenseApplicationRows(
      "while active",
      activeApplied,
      srEntryText,
      "calc-applied",
    ),
    renderDefenseApplicationRows(
      "overridden while active",
      activeOverridden,
      srEntryText,
      "calc-overridden",
    ),
    renderSrBonusRows("applied bonus", bonusUsed, "calc-applied"),
    renderSrBonusRows("overridden bonus", bonusOverridden, "calc-overridden"),
    renderSrBonusRows("conditional bonus", bonusConditional, "calc-conditional"),
  ].filter(Boolean);
  summary.innerHTML = `<div class="calc-buffs">${parts.join("")}</div>`;
  summary.classList.remove("d-none");
}

// Class features (or pool choices) flagged "activatable" aren't part of
// the always-on bonus total -- they're things a player triggers (Rage,
// Smite Evil, ...), so they're surfaced here as ready-to-cast abilities
// instead, for the Effects tab / map effect pickers to offer directly.
// Any selected pool choice whose pool declares contributesToAbility gets
// folded into the matching ability's bonuses (e.g. rage powers into Rage)
// rather than applying on its own.
function collectActivatableAbilities() {
  const attributeScaleContext = currentAttributeScaleContext();
  const classFeatureAbilities =
    window.PFClassFeatureAbilities?.collectActivatableAbilities({
      classDefinitions,
      classProgression,
      classFeatureChoices,
      characterLevel: num("characterLevel"),
      abilityScores: attributeScaleContext.abilityScores,
    }) || [];
  const mechanicAbility = (source, mechanics, category, sourceLabel, id) => {
    if (!window.PFEffectMechanics?.hasAnyMechanics?.(mechanics)) return null;
    const ability = {
      id,
      name: source.name || category,
      category,
      source: sourceLabel,
      bonuses: mechanics.effects || [],
      durationConfig: mechanics.durationConfig || null,
      auraConfig: mechanics.auraConfig || null,
      ...(window.PFEffectMechanics?.hasBranches?.(mechanics)
        ? { branches: mechanics.branches }
        : {}),
      duration: window.PFEffectMeta?.durationLabel
        ? window.PFEffectMeta.durationLabel(mechanics.durationConfig || {})
        : "variable",
      fromAbility: true,
      abilityContext: attributeScaleContext,
      description:
        source.description || source.desc || source.details?.description || "",
      detailUrl:
        source.url ||
        source.link ||
        source.sourceUrl ||
        source.details?.link ||
        "",
      detailData: {
        type: category,
        description:
          source.description || source.desc || source.details?.description || "",
        ...(source.prerequisites
          ? { prerequisites: source.prerequisites }
          : {}),
        ...(source.benefit ? { benefit: source.benefit } : {}),
        ...(source.normal ? { normal: source.normal } : {}),
        ...(source.special ? { special: source.special } : {}),
        ...(source.details && typeof source.details === "object"
          ? source.details
          : {}),
      },
    };
    (window.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
      if (Array.isArray(mechanics[key]) && mechanics[key].length)
        ability[key] = mechanics[key];
    });
    return ability;
  };
  const featAbilities = selectedFeatSelections({ activeOnly: true })
    .map(({ id, source }) => {
      const feat = featById(id);
      const mechanics = window.PFEffectMechanics?.activeMechanics?.(feat || {});
      return feat
        ? mechanicAbility(feat, mechanics, "Feat", source || "Feat", `feat:${id}`)
        : null;
    })
    .filter(Boolean);
  // An item's Passive group requires equipping and is synchronized through
  // syncEquippedLootBuffFromItem. Its Active group only requires the item to
  // be in this character's inventory, so carried consumables and command
  // items appear beside class activations such as Rage and Mutagen.
  const itemAbilities = (characterInventoryItems || [])
    .map((item) =>
      mechanicAbility(
        item,
        window.PFEffectMechanics?.activeMechanics?.(item) || {},
        "Item",
        item.name || "Item",
        `item:${item.id}`,
      ),
    )
    .filter(Boolean);
  return [
    ...classFeatureAbilities,
    ...collectActivatableRacialTraitAbilities(),
    ...featAbilities,
    ...itemAbilities,
  ].map((ability) => ({
    ...ability,
    abilityContext: ability.abilityContext || attributeScaleContext,
  }));
}

function appliedConditionName(entry = {}) {
  return (
    entry.name ||
    entry.conditionName ||
    entry.condition?.name ||
    entry.condition?.conditionName ||
    ""
  );
}

function conditionBuffFromApplyCondition(entry = {}, sourceBuff = {}) {
  const condition =
    entry.condition && typeof entry.condition === "object"
      ? entry.condition
      : entry;
  const name = condition.name || appliedConditionName(entry);
  if (!name) return null;
  return {
    ...condition,
    id:
      condition.id ||
      entry.conditionId ||
      `applied-condition:${slugify(name)}`,
    name,
    category: condition.category || "Condition",
    source: sourceBuff.name || sourceBuff.source || "Effect",
    sourceConditionExtra: true,
    bonuses: Array.isArray(condition.bonuses) ? condition.bonuses : [],
    damageReduction: Array.isArray(condition.damageReduction)
      ? condition.damageReduction
      : [],
    spellResistance: Array.isArray(condition.spellResistance)
      ? condition.spellResistance
      : [],
    immunities: Array.isArray(condition.immunities) ? condition.immunities : [],
    classSkillGrants: Array.isArray(condition.classSkillGrants)
      ? condition.classSkillGrants
      : [],
    bonusRanks: Array.isArray(condition.bonusRanks) ? condition.bonusRanks : [],
    extraRanksPerLevel: Array.isArray(condition.extraRanksPerLevel)
      ? condition.extraRanksPerLevel
      : [],
    featGrants: Array.isArray(condition.featGrants) ? condition.featGrants : [],
    sizeChanges: Array.isArray(condition.sizeChanges)
      ? condition.sizeChanges
      : [],
    spellLikeAbilities: Array.isArray(condition.spellLikeAbilities)
      ? condition.spellLikeAbilities
      : [],
    casterLevelBonuses: Array.isArray(condition.casterLevelBonuses)
      ? condition.casterLevelBonuses
      : [],
    spellDcBonuses: Array.isArray(condition.spellDcBonuses)
      ? condition.spellDcBonuses
      : [],
    effectiveAttributeBonuses: Array.isArray(condition.effectiveAttributeBonuses)
      ? condition.effectiveAttributeBonuses
      : [],
    grantDomains: Array.isArray(condition.grantDomains)
      ? condition.grantDomains
      : [],
    generatedEquipment: Array.isArray(condition.generatedEquipment)
      ? condition.generatedEquipment
      : [],
  };
}

function expandApplyConditionBuffs(buffs = []) {
  return (Array.isArray(buffs) ? buffs : []).flatMap((buff) => {
    const applied = (Array.isArray(buff.applyConditions)
      ? buff.applyConditions
      : []
    )
      .map((entry) => conditionBuffFromApplyCondition(entry, buff))
      .filter(Boolean);
    return applied.length ? [buff, ...applied] : [buff];
  });
}

function calculationBuffs() {
  return expandApplyConditionBuffs([
    ...collectSelectedRaceBuffs(),
    ...collectSelectedFeatBuffs(),
    ...activeBuffs,
    ...collectClassFeatureBuffs(),
  ]);
}

function domainKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+(?:subdomain|domain)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function domainNameKey(value = "") {
  return domainKey(value).replace(/-/g, "");
}

function domainById(id = "") {
  const target = domainKey(id);
  const targetName = domainNameKey(id);
  return (
    (domainDefinitions.domains || []).find((domain) => {
      const idKey = domainKey(domain.id || domain.name);
      const nameKey = domainNameKey(domain.name || domain.id);
      return idKey === target || nameKey === targetName;
    }) || null
  );
}

function domainSpellNames(domain = {}) {
  const names = [
    ...(Array.isArray(domain.domainSpells) ? domain.domainSpells : []),
    ...(Array.isArray(domain.replacementDomainSpells)
      ? domain.replacementDomainSpells
      : []),
  ]
    .map((spell) => spell.name || spell.spellName || spell)
    .filter(Boolean);
  if (domain.type === "subdomain") {
    (Array.isArray(domain.associatedDomains)
      ? domain.associatedDomains
      : []
    ).forEach((parentName) => {
      const parent = domainById(parentName);
      if (!parent) return;
      (Array.isArray(parent.domainSpells) ? parent.domainSpells : []).forEach(
        (spell) => {
          if (spell?.name) names.push(spell.name);
        },
      );
    });
  }
  return [...new Set(names.map((name) => String(name).toLowerCase().trim()))];
}

function domainEquivalentRefs(domain = {}) {
  const refs = [
    { id: domainKey(domain.id || domain.name), name: domain.name || domain.id },
  ];
  if (domain.type === "subdomain") {
    (Array.isArray(domain.associatedDomains)
      ? domain.associatedDomains
      : []
    ).forEach((parentName) => {
      const parent = domainById(parentName);
      refs.push({
        id: domainKey(parent?.id || parentName),
        name: parent?.name || parentName,
      });
    });
  }
  return refs.filter((ref) => ref.id || ref.name);
}

function addGrantedDomain(granted, seen, domain = {}, source = "Domain") {
  if (!domain) return;
  const id = domainKey(domain.id || domain.name);
  if (!id) return;
  const key = `${id}:${source}`;
  if (seen.has(key)) return;
  seen.add(key);
  granted.push({
    id,
    name: domain.name || id,
    source,
    domain,
    equivalents: domainEquivalentRefs(domain),
    spellNames: domainSpellNames(domain),
  });
}

function collectClassFeatureChoiceDomains(granted, seen) {
  const addValue = (value, source = "Class Feature Choice") => {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      const domain = domainById(value);
      if (domain) addGrantedDomain(granted, seen, domain, source);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => addValue(entry, source));
      return;
    }
    if (typeof value !== "object") return;
    const domainValue =
      value.domainId ||
      value.domain ||
      value.domainName ||
      value.value ||
      value.label ||
      value.name;
    const domain = domainById(domainValue);
    if (domain) addGrantedDomain(granted, seen, domain, source);
    Object.entries(value).forEach(([key, nested]) => {
      if (/domain/i.test(key)) addValue(nested, source);
    });
  };
  Object.entries(classFeatureChoices || {}).forEach(([key, value]) => {
    if (/domain/i.test(key) || domainById(value))
      addValue(value, "Class Feature Choice");
  });
  Object.entries(classFeatureVariableChoices || {}).forEach(([key, value]) => {
    if (/domain/i.test(key) || domainById(value))
      addValue(value, "Class Feature Choice");
  });
}

function allDomainsForSpell(spell = {}) {
  const spellName = String(spell.name || spell.spellName || "")
    .toLowerCase()
    .trim();
  if (!spellName) return [];
  return (domainDefinitions.domains || []).filter((domain) =>
    domainSpellNames(domain).includes(spellName),
  );
}

function collectGrantedDomains() {
  const seen = new Set();
  const granted = [];
  calculationBuffs().forEach((buff) => {
    (Array.isArray(buff.grantDomains) ? buff.grantDomains : []).forEach(
      (grant) => {
        if (grant.chooseOnApply && !grant.domainId && !grant.domainName) return;
        const domain =
          domainById(grant.domainId || grant.domain || grant.domainName) ||
          domainById(grant.name);
        if (!domain) return;
        addGrantedDomain(granted, seen, domain, buff.name || buff.source || "Effect");
      },
    );
  });
  collectClassFeatureChoiceDomains(granted, seen);
  return granted;
}

function matchingDomainsForSpell(spell = {}) {
  const spellName = String(spell.name || spell.spellName || "")
    .toLowerCase()
    .trim();
  if (!spellName) return [];
  return collectGrantedDomains().filter((grant) =>
    grant.spellNames.includes(spellName),
  );
}

function extraRanksPerLevelValue(entry = {}) {
  const value = Number(entry.value ?? entry.amount ?? entry.ranks ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function collectExtraRanksPerLevelEntries() {
  return calculationBuffs()
    .flatMap((buff) =>
      (Array.isArray(buff.extraRanksPerLevel)
        ? buff.extraRanksPerLevel
        : []
      ).map((entry) => ({
        ...entry,
        value: extraRanksPerLevelValue(entry),
        source: buff.name || buff.source || "Effect",
      })),
    )
    .filter((entry) => entry.value);
}

function extraRanksPerLevelSummary() {
  const entries = collectExtraRanksPerLevelEntries();
  const perLevel = entries.reduce(
    (sum, entry) => sum + extraRanksPerLevelValue(entry),
    0,
  );
  const characterLevel = Math.max(1, num("characterLevel") || 1);
  return {
    perLevel,
    total: perLevel * characterLevel,
    characterLevel,
    sources: entries,
  };
}

function bonusRanksValue(entry = {}) {
  const value = Math.floor(Number(entry.value ?? entry.amount ?? entry.ranks ?? 0));
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function bonusRanksTargetMatchesSkill(entry = {}, skill = "", abilityKey = "") {
  const stat = String(entry.stat || "").trim().toLowerCase();
  if (!stat || window.PFEffectStats?.isChoiceStat?.(stat)) return false;
  if (stat === skillStatKey(skill)) return true;
  if (stat.startsWith("skill-list:")) {
    return Boolean(
      window.PFEffectStats?.skillListIncludesSkill?.(
        stat,
        skill,
        entry.skillList,
      ),
    );
  }
  if (stat === "skill checks") return true;
  const training = window.PFEffectStats?.skillTrainingStatus?.(skill) || "";
  if (stat === "trained skill checks") return training === "trained";
  if (stat === "untrained skill checks") return training === "untrained";
  const abilityStats = {
    str: "strength skill checks",
    dex: "dexterity skill checks",
    con: "constitution skill checks",
    int: "intelligence skill checks",
    wis: "wisdom skill checks",
    cha: "charisma skill checks",
  };
  if (stat === abilityStats[abilityKey]) return true;
  if (stat === "knowledge skill checks") return /^knowledge(?:\s*\(|\b)/i.test(skill);
  if (stat === "craft skill checks") return /^craft(?:\s*\(|\b)/i.test(skill);
  if (stat === "profession skill checks") return /^profession(?:\s*\(|\b)/i.test(skill);
  if (stat === "perform skill checks") return /^perform(?:\s*\(|\b)/i.test(skill);
  return stat === genericSkillStatKey(skill);
}

function collectBonusRanksForSkill(skill = "", abilityKey = "") {
  return calculationBuffs()
    .flatMap((buff) =>
      (Array.isArray(buff.bonusRanks) ? buff.bonusRanks : [])
        .filter((entry) => bonusRanksTargetMatchesSkill(entry, skill, abilityKey))
        .map((entry) => ({
          ...entry,
          value: bonusRanksValue(entry),
          source: buff.name || buff.source || "Effect",
        })),
    )
    .filter((entry) => entry.value > 0);
}

function characterSkillRankCap() {
  return Math.max(1, Math.floor(num("characterLevel") || 1));
}

function clampSkillRankInput(input, cap = characterSkillRankCap()) {
  if (!input) return 0;
  input.min = "0";
  input.max = String(cap);
  const value = Math.max(0, Math.min(cap, Math.floor(Number(input.value || 0) || 0)));
  if (String(value) !== input.value) input.value = String(value);
  return value;
}

function effectiveSkillRanks(skill = "", abilityKey = "") {
  const manual = clampSkillRankInput(el(`${skillId(skill)}Ranks`));
  const entries = collectBonusRanksForSkill(skill, abilityKey);
  const available = Math.max(0, characterSkillRankCap() - manual);
  const granted = Math.min(
    available,
    entries.reduce((sum, entry) => sum + bonusRanksValue(entry), 0),
  );
  return { manual, bonus: granted, total: manual + granted, entries };
}

// Every class skill from every class this character has levels in --
// which class actually granted it doesn't matter for the +3 bonus (PF1e:
// classes sharing a class skill don't stack it), so a Set of resolved
// skill keys already gives the right "does this count at all" answer.
function characterClassSkillKeys() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const keys = new Set();
  const seenClasses = new Set();
  classProgression.slice(0, limit).forEach((row) => {
    if (!row.className || seenClasses.has(row.className)) return;
    seenClasses.add(row.className);
    const definition = classDefinitionByName(row.className);
    (definition?.classSkills || []).forEach((skill) => {
      keys.add(skillStatKey(skill));
    });
  });
  return keys;
}

// Skills granted class-skill status by a feat/trait/racial ability/
// class feature/item -- each carries its own classSkillGrants array
// (see scripts/effect-editor.js's createClassSkillRow), read exactly
// the same way collectClassFeatureDamageReduction/...SpellResistance
// read DR/SR: always-on class features + whichever pool option is
// currently selected walk classFeatureChoices, and any active buff
// (trait, cast ability, equipped item) contributes its own array too.
// Traits, feats, and anything added through the tracker (activatable
// abilities included) already have their "choice:<poolId>" stats
// resolved to a concrete skill via PFEffectChoicePicker at add/cast
// time (see resolveChoiceStats in buff-tracker-widget.js), so those
// work here with no extra plumbing. The one gap: a class feature that
// is (a) not activatable -- i.e. baked straight into calculationBuffs()
// every recalc with no "add" step -- and (b) itself carries a raw
// "choice:<poolId>" stat never passes through that picker, so its stat
// stays unresolved and is skipped here rather than applied
// nonsensically (DR/SR don't have this gap -- they're plain numbers,
// nothing to resolve).
function collectClassFeatureClassSkillGrants() {
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const keys = new Set();
  const addGrants = (grants) => {
    (Array.isArray(grants) ? grants : []).forEach((grant) => {
      const stat = String(grant?.stat || "");
      if (stat.startsWith("skill:")) keys.add(stat);
      if (stat.startsWith("skill-list:")) {
        allSkills().forEach(([skill]) => {
          if (
            window.PFEffectStats?.skillListIncludesSkill?.(
              stat,
              skill,
              grant.skillList,
            )
          ) {
            keys.add(skillStatKey(skill));
          }
        });
      }
    });
  };
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      addGrants(
        window.PFEffectMechanics?.passiveMechanics?.(feature)
          ?.classSkillGrants || [],
      );
      featurePools(feature).forEach((pool) => {
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          { ...feature, className, classLevel, characterLevel: row.level },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (option) addGrants(option.classSkillGrants);
      });
    });
  });
  collectSelectedRaceBuffs().forEach((buff) =>
    addGrants(buff.classSkillGrants),
  );
  // Active buffs (traits, cast abilities, equipped items) carry their
  // own classSkillGrants -- same reasoning as DR/SR's "while active"
  // half in collectClassFeatureDamageReduction.
  (activeBuffs || []).forEach((buff) => addGrants(buff.classSkillGrants));
  return keys;
}

function characterClassSkillSet() {
  return new Set([
    ...characterClassSkillKeys(),
    ...collectClassFeatureClassSkillGrants(),
  ]);
}

function computeClassProgressionTotals() {
  const levelLimit = Math.max(1, Math.min(20, num("characterLevel") || 1));
  const counts = {};
  const totals = { bab: 0, fort: 0, reflex: 0, will: 0 };
  classProgression.slice(0, levelLimit).forEach((row) => {
    const name = row.className;
    if (!name) return;
    counts[name] = (counts[name] || 0) + 1;
    const definition = classDefinitionByName(name);
    const current = classLevelAt(definition, counts[name]);
    const previous = classLevelAt(definition, counts[name] - 1) || {};
    totals.bab += Number(current?.bab ?? 0) - Number(previous?.bab ?? 0);
    totals.fort +=
      Number(current?.fort ?? current?.fortitude ?? 0) -
      Number(previous?.fort ?? previous?.fortitude ?? 0);
    totals.reflex +=
      Number(current?.ref ?? current?.reflex ?? 0) -
      Number(previous?.ref ?? previous?.reflex ?? 0);
    totals.will += Number(current?.will ?? 0) - Number(previous?.will ?? 0);
  });
  return totals;
}

function applyClassProgressionStats() {
  if (!classProgression.length || !classDefinitions.length) return;
  const totals = computeClassProgressionTotals();
  if (el("babBase")) el("babBase").value = totals.bab;
  if (el("bab")) el("bab").value = totals.bab + num("babMisc");
  if (el("fortBase")) el("fortBase").value = totals.fort;
  if (el("reflexBase")) el("reflexBase").value = totals.reflex;
  if (el("willBase")) el("willBase").value = totals.will;
}

function classOptions(selected = "") {
  const classes = classDefinitions.filter((definition) =>
    classNameOf(definition),
  );
  return groupedClassOptions(classes, selected);
}

function renderLevelProgression() {
  const root = el("levelProgressionRows");
  if (!root) return;
  if (!classDefinitions.length) {
    root.innerHTML = `<div class="small-text">Class data is not loaded.</div>`;
    return;
  }
  classProgression = normalizeClassProgression(classProgression);
  root.innerHTML = classProgression
    .map((row, index) => {
      const next = classProgression[index + 1];
      const canDuplicate =
        row.level < 20 && row.className && next?.className !== row.className;
      return `
      <div class="progression-card">
        <label for="classProgressionLevel${row.level}">Level ${row.level}</label>
        <select id="classProgressionLevel${row.level}" class="form-select form-select-sm sheet-input" data-class-level="${row.level}">
          ${classOptions(row.className)}
        </select>
        ${
          canDuplicate
            ? `
          <div class="progression-actions">
            <button class="btn btn-outline-info btn-sm" type="button" data-class-duplicate-next="${row.level}">Copy to Next</button>
            <button class="btn btn-outline-info btn-sm" type="button" data-class-duplicate-rest="${row.level}">Copy to Rest</button>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
  root.querySelectorAll("[data-class-level]").forEach((select) => {
    select.addEventListener("change", async () => {
      const level = Number(select.dataset.classLevel);
      const row = classProgression.find((item) => item.level === level);
      if (row) row.className = select.value;
      select.disabled = true;
      try {
        await loadClassDefinitions([select.value]);
        updateClassDerivedViews();
        recalculateSheet();
        queueSheetSave();
      } finally {
        select.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-class-duplicate-next]").forEach((button) => {
    button.addEventListener("click", () =>
      duplicateClassProgression(
        Number(button.dataset.classDuplicateNext),
        false,
      ),
    );
  });
  root.querySelectorAll("[data-class-duplicate-rest]").forEach((button) => {
    button.addEventListener("click", () =>
      duplicateClassProgression(
        Number(button.dataset.classDuplicateRest),
        true,
      ),
    );
  });
}

function duplicateClassProgression(level, rest = false) {
  const source = classProgression.find(
    (row) => Number(row.level) === Number(level),
  );
  if (!source?.className || Number(level) >= 20) return;
  classProgression.forEach((row) => {
    if (rest ? row.level > level : row.level === level + 1) {
      row.className = source.className;
    }
  });
  renderLevelProgression();
  updateClassDerivedViews();
  recalculateSheet();
  queueSheetSave();
}

function updateClassLevelText() {
  const counts = progressionClassCounts();
  const text = Object.entries(counts)
    .map(([name, level]) => `${name} ${level}`)
    .join(" / ");
  if (el("classLevel")) el("classLevel").value = text;
}

function capitalizedFeatureName(name = "") {
  const text = String(name || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Class Feature";
}

function classFeatureScaleText(scale) {
  if (!scale) return "";
  const source = scale.source || { type: "caster" };
  const sourceLabel =
    source.type === "character"
      ? "character level"
      : source.type === "class"
        ? `${source.className || "class"} level`
        : "caster level";
  const parts = [];
  if (scale.levelMultiplier) {
    const { numerator, denominator } = scale.levelMultiplier;
    const frac = denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`;
    parts.push(`${frac} ${sourceLabel} (round down)`);
  }
  const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
  if (milestones.length) {
    parts.push(
      milestones
        .map(
          (milestone) =>
            `${sourceLabel} ${milestone.level}: ${signed(Number(milestone.value || 0))}`,
        )
        .join(", "),
    );
  }
  const every = scale.every || {};
  const fromLevel = every.fromLevel || every.afterLevel || every.after;
  if (fromLevel && every.everyLevels && every.increase) {
    parts.push(
      `from ${sourceLabel} ${fromLevel}, every ${every.everyLevels}: ${signed(Number(every.increase || 0))}`,
    );
  }
  if (scale.minimumOne) parts.push("minimum 1");
  return parts.length ? `; scales ${parts.join("; ")}` : "";
}

// DR is written "amount/type" -- an empty type or a bare "-" means it
// applies to any attack that doesn't ignore DR outright (PF core rules).
function drOvercomeTypeText(overcomeType) {
  const text = String(overcomeType || "").trim();
  return text && text !== "-" ? text : "-";
}

function drEntryText(dr) {
  return `DR ${Number(dr.amount || 0)}/${drOvercomeTypeText(dr.overcomeType)}`;
}

function renderClassFeatureDamageReduction(feature) {
  const entries = Array.isArray(feature.damageReduction)
    ? feature.damageReduction
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map((dr) => {
          const scale = classFeatureScaleText(dr.bonusScale || dr.scale);
          return `<span class="class-feature-dr-pill">${escapeHtml(`${drEntryText(dr)}${scale}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function srEntryText(sr) {
  // conditional/appliesWhen matches how every other effect authors a
  // condition; sr.condition is a fallback for entries saved before this
  // switched over from its own one-off free-text field.
  const isConditional = sr.conditional ?? Boolean(sr.appliesWhen);
  const appliesWhen = sr.appliesWhen || "";
  return `SR ${Number(sr.amount || 0)}${isConditional ? ` (${appliesWhen || "conditional"})` : ""}`;
}

function renderClassFeatureSpellResistance(feature) {
  const entries = Array.isArray(feature.spellResistance)
    ? feature.spellResistance
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map((sr) => {
          const scale = classFeatureScaleText(sr.bonusScale || sr.scale);
          return `<span class="class-feature-sr-pill">${escapeHtml(`${srEntryText(sr)}${scale}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderClassFeatureImmunities(feature) {
  const entries = Array.isArray(feature.immunities) ? feature.immunities : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map(
          (immunity) =>
            `<span class="class-feature-effect-pill">${escapeHtml(`Immune ${immunityEntryText(immunity)}`)}</span>`,
        )
        .join("")}
    </div>
  `;
}

function renderClassFeatureApplyConditions(feature) {
  const entries = Array.isArray(feature.applyConditions)
    ? feature.applyConditions
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map(
          (entry) =>
            `<span class="class-feature-effect-pill">${escapeHtml(window.PFEffectEditor?.applyConditionText ? window.PFEffectEditor.applyConditionText(entry) : `Applies condition: ${appliedConditionName(entry) || "Condition"}`)}</span>`,
        )
        .join("")}
    </div>
  `;
}

function renderClassFeatureEffects(feature) {
  const effects = Array.isArray(feature.effects) ? feature.effects : [];
  if (!effects.length) return "";
  return `
    <div class="class-feature-effects">
      ${effects
        .map((effect) => {
          const stat = titleCaseStat(
            effect.skillName || effect.stat || "effect",
          );
          const value =
            String(effect.stat || "").toLowerCase() ===
            "remove dex bonus to ac"
              ? "removes DEX bonus"
              : String(effect.stat || "").toLowerCase() ===
                  "cannot gain morale bonuses"
                ? "blocks morale bonuses"
              : String(effect.stat || "").toLowerCase() ===
                  "cannot gain luck bonuses"
                ? "blocks luck bonuses"
              : `${signed(Number(effect.value || 0))} ${effect.type || "untyped"}`;
          const conditional = effect.conditional
            ? ` (${effect.appliesWhen || "conditional"})`
            : "";
          const stacks = effect.stacks ? "; stacks" : "";
          const scale = classFeatureScaleText(effect.bonusScale || effect.scale);
          const requirement = window.PFEffectEditor?.attributeRequirementText?.(
            effect,
          );
          return `<span class="class-feature-effect-pill">${escapeHtml(`${stat}: ${value}${conditional}${stacks}${scale}${requirement ? `; ${requirement}` : ""}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderClassFeatureClassSkillGrants(feature) {
  const entries = Array.isArray(feature.classSkillGrants)
    ? feature.classSkillGrants
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map(
          (grant) =>
            `<span class="class-feature-effect-pill">${escapeHtml(window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat))}</span>`,
        )
        .join("")}
    </div>
  `;
}

function renderClassFeatureExtraRanksPerLevel(feature) {
  const entries = Array.isArray(feature.extraRanksPerLevel)
    ? feature.extraRanksPerLevel
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map(
          (entry) =>
            `<span class="class-feature-effect-pill">${escapeHtml(window.PFEffectEditor.extraRanksPerLevelText(entry))}</span>`,
        )
        .join("")}
    </div>
  `;
}

function renderClassFeatureSizeChanges(feature) {
  const entries = Array.isArray(feature.sizeChanges) ? feature.sizeChanges : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map((entry) => {
          const value = Number(entry.value || 0);
          return `<span class="class-feature-effect-pill">${escapeHtml(`Size Change: ${value > 0 ? "+" : ""}${value}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderClassFeatureSpellLikeAbilities(feature) {
  const entries = Array.isArray(feature.spellLikeAbilities)
    ? feature.spellLikeAbilities
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map((entry) => {
          const listName = spellLikeChoiceListName(entry);
          const spellName =
            entry.spellName ||
            entry.spell?.name ||
            (listName ? `Choose from ${listName}` : "Spell");
          const frequency = entry.frequency ? `${entry.frequency}: ` : "";
          const minimumLevel =
            Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
          const levelText =
            minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
          const requirement = spellLikeRequirementText(entry);
          const requirementText = requirement ? `${requirement}, ` : "";
          return `<span class="class-feature-effect-pill">${escapeHtml(`SLA ${levelText}${requirementText}${frequency}${spellName}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function renderClassFeatureGeneratedEquipment(feature) {
  const entries = Array.isArray(feature.generatedEquipment)
    ? feature.generatedEquipment
    : [];
  if (!entries.length) return "";
  return `
    <div class="class-feature-effects">
      ${entries
        .map((entry) => {
          const type = entry.type || "Equipment";
          const name = entry.name || entry.item || "Generated item";
          return `<span class="class-feature-effect-pill">${escapeHtml(`Generates ${type}: ${name}`)}</span>`;
        })
        .join("")}
    </div>
  `;
}

function featurePools(feature) {
  const choiceSource = String(feature.choiceSource || "").toLowerCase();
  if (
    choiceSource === "sorcerer-bloodlines" ||
    choiceSource === "bloodrager-bloodlines"
  ) {
    const className = choiceSource.startsWith("bloodrager")
      ? "Bloodrager"
      : "Sorcerer";
    const options = (bloodlineDefinitions.bloodlines || [])
      .filter((bloodline) =>
        (bloodline.classes || []).some(
          (entry) => String(entry).toLowerCase() === className.toLowerCase(),
        ),
      )
      .map((bloodline) => {
        const details = (bloodline.classDetails || []).find(
          (entry) =>
            String(entry.className).toLowerCase() === className.toLowerCase(),
        );
        return {
          name: bloodline.name,
          description: details?.summary || "",
          source: details?.url || "",
          bloodlineId: bloodline.id,
        };
      });
    return [
      {
        name: "Bloodline",
        description: `Choose a ${className.toLowerCase()} bloodline.`,
        options,
      },
    ];
  }
  return Array.isArray(feature.pools)
    ? feature.pools
    : Array.isArray(feature.choicePools)
      ? feature.choicePools
      : [];
}

function selectedBloodlineForClass(className = "") {
  const targetClass = String(className).trim().toLowerCase();
  if (!targetClass) return null;
  const selected = Object.entries(classFeatureChoices || {}).find(
    ([key, value]) => {
      const parts = String(key).split("|");
      return (
        String(parts[0] || "").trim().toLowerCase() === targetClass &&
        parts.some((part) => String(part).trim().toLowerCase() === "bloodline") &&
        Boolean(value)
      );
    },
  )?.[1];
  if (!selected) return null;
  const normalized = String(selected).trim().toLowerCase();
  return (
    (bloodlineDefinitions.bloodlines || []).find(
      (bloodline) =>
        String(bloodline.id || "").toLowerCase() === normalized ||
        String(bloodline.name || "").toLowerCase() === normalized,
    ) || { id: normalized.replace(/[^a-z0-9]+/g, "-"), name: selected }
  );
}

// Every option currently chosen across every instance of a pool sharing
// this name (e.g. every level's separate "Rage Power" slot), except the
// slot identified by excludeKey -- used to check exclusive-group
// conflicts (totem lines, etc.) against choices made at *other* levels.
function chosenOptionsForPoolName(poolName, excludeKey) {
  if (!poolName) return [];
  const limit = Math.max(1, num("characterLevel") || 1);
  const counts = {};
  const results = [];
  classProgression.slice(0, limit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature) => {
      if (typeof feature === "string") return;
      const context = { className, classLevel, characterLevel: row.level };
      featurePools(feature).forEach((pool) => {
        if (pool.name !== poolName) return;
        const key = classFeatureChoiceKey(
          { ...feature, ...context },
          pool,
          context,
        );
        if (key === excludeKey) return;
        const selected = classFeatureChoices[key];
        if (!selected) return;
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (option) results.push(option);
      });
    });
  });
  return results;
}

// Two options with the same requirements.excludesGroup tag block each
// other -- unless one is a prerequisite of the other via
// requiredChoices (e.g. a totem line's later tiers), in which case
// they're the same chain, not competing chains.
function exclusiveGroupConflict(option = {}, requirements = {}, extra = {}) {
  const group = String(requirements.excludesGroup || "").trim();
  if (!group || !extra.poolName) return "";
  const others = chosenOptionsForPoolName(extra.poolName, extra.excludeKey);
  const conflict = others.find((other) => {
    if (other.name === option.name) return false;
    if (String(other.requirements?.excludesGroup || "").trim() !== group)
      return false;
    const linkedForward = (requirements.requiredChoices || []).some((req) =>
      classFeatureChoiceMatchesRequirement(req, other.name),
    );
    const linkedBackward = (
      other.requirements?.requiredChoices || []
    ).some((req) => classFeatureChoiceMatchesRequirement(req, option.name));
    return !linkedForward && !linkedBackward;
  });
  return conflict ? `exclusive with ${conflict.name}` : "";
}

// extra: optional { option, poolName, excludeKey } to also check the
// requirements.excludesGroup tag against choices made in every other
// instance of the same-named pool (see chosenOptionsForPoolName).
function requirementWarnings(requirements = {}, context = {}, extra = {}) {
  const warnings = [];
  const minClassLevel = Number(
    requirements.minClassLevel || requirements.minLevel || 0,
  );
  if (minClassLevel > 0 && Number(context.classLevel || 0) < minClassLevel) {
    warnings.push(
      `requires ${context.className || "class"} level ${minClassLevel}`,
    );
  }
  const race = String(requirements.race || "").trim();
  if (
    race &&
    String(el("race")?.value || "")
      .trim()
      .toLowerCase() !== race.toLowerCase()
  ) {
    warnings.push(`requires race: ${race}`);
  }
  const requiredChoices = Array.isArray(requirements.requiredChoices)
    ? requirements.requiredChoices
    : [];
  const chosen = Object.values(classFeatureChoices || {}).map(String);
  requiredChoices.forEach((choice) => {
    if (
      !chosen.some((value) =>
        classFeatureChoiceMatchesRequirement(choice, value),
      )
    )
      warnings.push(`requires choice: ${choice}`);
  });
  const exclusiveWarning = exclusiveGroupConflict(
    extra.option || {},
    requirements,
    extra,
  );
  if (exclusiveWarning) warnings.push(exclusiveWarning);
  // requirements.text is a descriptive note (e.g. "Barbarian 6, lesser
  // ancestor totem"), not itself a failed check -- it must not count
  // toward "unmet", or every option with prerequisite flavor text would
  // show as permanently blocked even when its actual requirements are
  // satisfied. blockingCount freezes the real failure count before text
  // is appended, without changing this into anything but a plain array
  // (still safe to .join()/spread/Array.isArray() as before).
  warnings.blockingCount = warnings.length;
  if (requirements.text) warnings.push(requirements.text);
  return warnings;
}

function normalizedClassFeatureChoice(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\((?:ex|su|sp)\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function classFeatureChoiceMatchesRequirement(required = "", selected = "") {
  const requiredText = normalizedClassFeatureChoice(required);
  const selectedText = normalizedClassFeatureChoice(selected);
  if (!requiredText || !selectedText) return false;
  if (requiredText === selectedText) return true;
  const requiredWords = requiredText
    .split(/\s+/)
    .filter((word) => !["rage", "power", "the"].includes(word));
  const selectedWords = new Set(selectedText.split(/\s+/));
  return (
    requiredWords.length > 0 &&
    requiredWords.every((word) => selectedWords.has(word))
  );
}

function classFeatureChoiceKey(feature, pool, context = {}) {
  return [
    context.className || "",
    context.characterLevel || "",
    context.classLevel || "",
    feature.name || "Class Feature",
    pool.name || "Pool",
  ].join("|");
}

function classFeatureConditionalVariableChoiceKey(feature, context = feature) {
  return [
    context.className || feature.className || "",
    context.characterLevel || feature.characterLevel || "",
    context.classLevel || feature.classLevel || "",
    feature.name || "Class Feature",
    "Conditional Variables",
  ].join("|");
}

function classFeatureMechanicChoiceKey(feature, context = feature) {
  return [
    context.className || feature.className || "",
    context.characterLevel || feature.characterLevel || "",
    context.classLevel || feature.classLevel || "",
    feature.name || "Class Feature",
    "Mechanic Choices",
  ].join("|");
}

function classFeaturePoolOptionMechanicChoiceKey(
  feature = {},
  pool = {},
  option = {},
  context = feature,
) {
  return [
    context.className || feature.className || "",
    context.characterLevel || feature.characterLevel || "",
    context.classLevel || feature.classLevel || "",
    feature.name || "Class Feature",
    pool.name || "Pool",
    option.name || "Option",
    "Mechanic Choices",
  ].join("|");
}

function conditionalVariableChoiceSummary(item = {}, choices = {}) {
  const variables = conditionalVariables(item);
  if (!variables.length) return "";
  return variables
    .map((variable) => {
      const key = normalizeConditionalVariableKey(
        variable.key || variable.name || variable.label,
      );
      const label = variable.label || key || "Variable";
      return `${label}: ${choices[key]?.label || "not selected"}`;
    })
    .join(", ");
}

function applyClassFeatureConditionalVariables(item = {}, context = item) {
  const key = classFeatureConditionalVariableChoiceKey(item, context);
  const choices = classFeatureVariableChoices[key];
  if (!choices || typeof choices !== "object") return item;
  return interpolateConditionalVariables(
    {
      ...item,
      conditionalChoices: choices,
    },
    choices,
  );
}

function classFeatureMechanicsNeedChoice(item = {}) {
  return (
    window.PFEffectMechanics?.hasBranches?.(item) ||
    (Array.isArray(item.effects) &&
      item.effects.some((effect) =>
        window.PFEffectStats?.isChoiceStat(effect.stat) ||
        needsFavoredEnemyScaleChoice(effect),
      )) ||
    (Array.isArray(item.classSkillGrants) &&
      item.classSkillGrants.some((grant) =>
        window.PFEffectStats?.isChoiceStat(grant.stat),
      )) ||
    (Array.isArray(item.bonusRanks) &&
      item.bonusRanks.some((grant) =>
        window.PFEffectStats?.isChoiceStat(grant.stat),
      )) ||
    (Array.isArray(item.spellLikeAbilities) &&
      item.spellLikeAbilities.some(spellLikeAbilityHasChoiceList)) ||
    spellAdjustmentEntriesNeedChoice(item.casterLevelBonuses) ||
    spellAdjustmentEntriesNeedChoice(item.spellDcBonuses) ||
    spellAdjustmentEntriesNeedChoice(item.effectiveAttributeBonuses) ||
    grantDomainEntriesNeedChoice(item.grantDomains)
  );
}

function classFeatureMechanicChoices(feature = {}, context = feature) {
  const key = classFeatureMechanicChoiceKey(feature, context);
  const stored = classFeatureVariableChoices[key];
  return stored && typeof stored === "object" && stored.mechanics
    ? stored.mechanics
    : null;
}

function classFeatureMechanicsForKey(key = "") {
  const stored = classFeatureVariableChoices[key];
  return stored && typeof stored === "object" && stored.mechanics
    ? stored.mechanics
    : null;
}

function mergeResolvedMechanics(item = {}, mechanics = null) {
  if (!mechanics || typeof mechanics !== "object") return item;
  const resolved = { ...item, ...mechanics };
  if (mechanics.selectedBranchId) delete resolved.branches;
  return resolved;
}

function applyClassFeatureMechanicChoices(item = {}, context = item) {
  return mergeResolvedMechanics(
    item,
    classFeatureMechanicChoices(item, context),
  );
}

function applyClassFeaturePoolOptionMechanicChoices(
  feature = {},
  pool = {},
  option = {},
  context = feature,
) {
  const key = classFeaturePoolOptionMechanicChoiceKey(
    feature,
    pool,
    option,
    context,
  );
  const mechanics = classFeatureMechanicsForKey(key);
  return mergeResolvedMechanics(option, mechanics);
}

function titleFromChoiceId(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/[-_]/.test(text)) {
    return text
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function firstChoiceLabel(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    const raw = String(value).trim();
    if (!raw) return "";
    const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(raw.toLowerCase());
    if (choiceLabel) return choiceLabel;
    if (raw.toLowerCase().startsWith("skill:")) {
      const skillKey = raw.slice("skill:".length).toLowerCase();
      const skill = allSkills()
        .map(([name]) => name)
        .find((entry) => normalizeSkillName(entry) === skillKey);
      return skill || raw;
    }
    const domain = domainById(raw);
    if (domain) return domain.name || titleFromChoiceId(raw);
    return titleFromChoiceId(raw);
  }
  if (Array.isArray(value)) {
    return value.map(firstChoiceLabel).filter(Boolean).join(", ");
  }
  if (typeof value !== "object") return "";
  const candidate =
    value.label ||
    value.name ||
    value.skillName ||
    value.spellName ||
    value.domainName ||
    value.domainId ||
    value.value ||
    "";
  return firstChoiceLabel(candidate);
}

function spellAdjustmentChoiceSummary(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .flatMap((entry) =>
      (entry.targetFilters || entry.filters || [])
        .filter((filter) => filter.chooseOnApply || filter.choice || filter.pickOne)
        .flatMap((filter) => filter.targets || filter.values || []),
    )
    .map(firstChoiceLabel)
    .filter(Boolean);
}

function mechanicsChoiceSummary(mechanics = {}) {
  if (!mechanics || typeof mechanics !== "object") return "";
  const labels = [];
  if (mechanics.selectedBranchName) labels.push(mechanics.selectedBranchName);
  Object.values(mechanics.poolChoices || {}).forEach((choice) => {
    const label = firstChoiceLabel(choice);
    if (label) labels.push(label);
  });
  Object.values(mechanics.conditionalChoices || {}).forEach((choice) => {
    const label = firstChoiceLabel(choice);
    if (label) labels.push(label);
  });
  (mechanics.effects || mechanics.bonuses || []).forEach((effect) => {
    const label = firstChoiceLabel(effect.skillName || effect.stat);
    if (label) labels.push(label);
    const favoredEnemy = firstChoiceLabel(
      effect.favoredEnemyTarget ||
        effect.targetFavoredEnemy ||
        effect.bonusScale?.favoredEnemyTarget ||
        effect.bonusScale?.target ||
        effect.scale?.favoredEnemyTarget ||
        effect.scale?.target,
    );
    if (favoredEnemy) labels.push(favoredEnemy);
  });
  (mechanics.classSkillGrants || []).forEach((grant) => {
    const label = firstChoiceLabel(grant.skillName || grant.stat);
    if (label) labels.push(label);
  });
  (mechanics.bonusRanks || []).forEach((grant) => {
    const label = firstChoiceLabel(grant.skillName || grant.stat);
    if (label) labels.push(label);
  });
  (mechanics.spellLikeAbilities || []).forEach((entry) => {
    const label = firstChoiceLabel(entry.spellName || entry.name);
    if (label) labels.push(label);
  });
  (mechanics.grantDomains || []).forEach((entry) => {
    const domain = domainById(entry.domainId || entry.domain || entry.domainName || entry.name);
    const label = domain?.name || firstChoiceLabel(entry.domainName || entry.domainId || entry.name);
    if (label) labels.push(label);
  });
  labels.push(...spellAdjustmentChoiceSummary(mechanics.casterLevelBonuses));
  labels.push(...spellAdjustmentChoiceSummary(mechanics.spellDcBonuses));
  labels.push(...spellAdjustmentChoiceSummary(mechanics.effectiveAttributeBonuses));
  return [...new Set(labels.map(String).filter(Boolean))].join(", ");
}

function featChoiceSummary(selection) {
  return mechanicsChoiceSummary(featSelectionMechanics(selection)).replace(
    /\b(Craft|Knowledge|Perform|Profession) \(([^)]+)\)/g,
    "$1: $2",
  );
}

function renderClassFeatureMechanicChoices(feature) {
  if (!classFeatureMechanicsNeedChoice(feature)) return "";
  const key = classFeatureMechanicChoiceKey(feature, feature);
  classFeatureVariableChoicePickerConfigs.set(key, { feature });
  const selected = classFeatureMechanicChoices(feature, feature);
  const summary = mechanicsChoiceSummary(selected);
  const status = summary || (selected ? "Selected" : "not selected");
  return `
    <div class="class-feature-pools">
      <div class="class-feature-pool">
        <div class="class-feature-choice-row">
          <button class="btn btn-outline-info btn-sm class-feature-choice-select" type="button" data-class-feature-mechanic-button="${escapeHtml(key)}" title="${escapeHtml(`Choices: ${status}`)}">
            <span>${escapeHtml(status)}</span>
          </button>
          ${
            selected
              ? `
            <button class="btn btn-outline-danger btn-sm btn-icon class-feature-choice-clear" type="button" data-class-feature-mechanic-clear="${escapeHtml(key)}" aria-label="Clear class feature choices"><i class="bi bi-trash"></i></button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderClassFeaturePoolOptionMechanicChoices(feature, pool, option) {
  if (!option || !classFeatureMechanicsNeedChoice(option)) return "";
  const key = classFeaturePoolOptionMechanicChoiceKey(feature, pool, option, feature);
  classFeatureVariableChoicePickerConfigs.set(key, { feature: option });
  const selected = classFeatureMechanicsForKey(key);
  const summary = mechanicsChoiceSummary(selected);
  const status = summary || (selected ? "Selected" : "not selected");
  return `
    <div class="class-feature-choice-row mt-1">
      <button class="btn btn-outline-info btn-sm class-feature-choice-select" type="button" data-class-feature-mechanic-button="${escapeHtml(key)}" title="${escapeHtml(`Choices: ${status}`)}">
        <span>${escapeHtml(status)}</span>
      </button>
      ${
        selected
          ? `
        <button class="btn btn-outline-danger btn-sm btn-icon class-feature-choice-clear" type="button" data-class-feature-mechanic-clear="${escapeHtml(key)}" aria-label="Clear class feature option choices"><i class="bi bi-trash"></i></button>
      `
          : ""
      }
    </div>
  `;
}

function renderClassFeatureConditionalVariables(feature) {
  const variables = conditionalVariables(feature);
  if (!variables.length) return "";
  const key = classFeatureConditionalVariableChoiceKey(feature, feature);
  classFeatureVariableChoicePickerConfigs.set(key, { feature });
  const choices = classFeatureVariableChoices[key] || {};
  const hasChoices = Object.keys(choices).length > 0;
  return `
    <div class="class-feature-pools">
      ${variables
        .map((variable) => {
          const variableKey = normalizeConditionalVariableKey(
            variable.key || variable.name || variable.label,
          );
          const label = variable.label || variableKey || "Choice";
          const selected = firstChoiceLabel(choices[variableKey]?.label || "");
          return `
            <div class="class-feature-pool">
              <div class="class-feature-choice-row">
                <button class="btn btn-outline-info btn-sm class-feature-choice-select" type="button" data-class-feature-variable-button="${escapeHtml(key)}" title="${escapeHtml(`${label}: ${selected || "not selected"}`)}">
                  <span>${escapeHtml(selected || "not selected")}</span>
                </button>
                ${
                  hasChoices
                    ? `
                  <button class="btn btn-outline-danger btn-sm btn-icon class-feature-choice-clear" type="button" data-class-feature-variable-clear="${escapeHtml(key)}" aria-label="Clear conditional selections"><i class="bi bi-trash"></i></button>
                `
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderClassFeaturePools(feature) {
  const pools = featurePools(feature);
  if (!pools.length) return "";
  return `
    <div class="class-feature-pools">
      ${pools
        .map((pool) => {
          const key = classFeatureChoiceKey(feature, pool, feature);
          classFeatureChoicePickerConfigs.set(key, { feature, pool });
          const selected = classFeatureChoices[key] || "";
          const selectedLabel = firstChoiceLabel(selected);
          const selectedOption = (pool.options || []).find(
            (option) => option.name === selected,
          );
          return `
          <div class="class-feature-pool">
            <div class="class-feature-choice-row">
              <button class="btn btn-outline-info btn-sm class-feature-choice-select" type="button" data-class-feature-choice-button="${escapeHtml(key)}" title="${escapeHtml(`${pool.name || "Choice"}: ${selectedLabel || "not selected"}`)}">
                <span>${escapeHtml(selectedLabel || "not selected")}</span>
              </button>
              ${
                selected
                  ? `
                <button class="btn btn-outline-danger btn-sm btn-icon class-feature-choice-clear" type="button" data-class-feature-choice-clear="${escapeHtml(key)}" aria-label="Clear ${escapeHtml(selectedLabel || selected)}"><i class="bi bi-trash"></i></button>
              `
                  : ""
              }
            </div>
            ${selectedOption ? renderClassFeaturePoolOptionMechanicChoices(feature, pool, selectedOption) : ""}
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function classFeatureLevelTitle(level, features = []) {
  const classes = [
    ...new Set(
      (features || [])
        .map((feature) => String(feature.className || "").trim())
        .filter(Boolean),
    ),
  ];
  return `Level ${level}${classes.length ? ` - ${classes.join(", ")}` : ""}`;
}

function normalizeCharacterFeats(raw = {}) {
  const normal = {};
  const granted = {};
  const effect = {};
  const readFeatSelection = (value) => {
    const featId =
      typeof value === "string"
        ? value
        : value?.featId || value?.id || value?.slug || value?.name || "";
    if (!featId) return null;
    if (typeof value !== "object" || !value) return String(featId);
    const selection = { ...value, featId: String(featId) };
    delete selection.id;
    delete selection.slug;
    delete selection.name;
    return selection;
  };
  const readEntry = (level, value) => {
    const numericLevel = Number(level);
    if (!Number.isFinite(numericLevel) || numericLevel <= 0) return;
    const selection = readFeatSelection(value);
    if (selection) normal[String(numericLevel)] = selection;
  };
  const readGrantedEntry = (key, value) => {
    const selection = readFeatSelection(value);
    if (!key || !selection) return;
    granted[String(key)] = selection;
  };
  const readEffectEntry = (key, value) => {
    const selection = readFeatSelection(value);
    if (!key || !selection) return;
    effect[String(key)] = selection;
  };
  Object.entries(raw?.normal || {}).forEach(([level, value]) =>
    readEntry(level, value),
  );
  Object.entries(raw?.granted || {}).forEach(([key, value]) =>
    readGrantedEntry(key, value),
  );
  Object.entries(raw?.effect || {}).forEach(([key, value]) =>
    readEffectEntry(key, value),
  );
  return { normal, granted, effect };
}

function normalFeatLevels(limit = 20) {
  const level = Math.max(0, Math.min(20, Number(limit) || 0));
  const levels = [];
  for (let current = 1; current <= level; current += 2) {
    levels.push(current);
  }
  return levels;
}

function featDisplayLevels() {
  return Array.from({ length: 20 }, (_, index) => index + 1);
}

function isNormalFeatLevel(level) {
  return Number(level) % 2 === 1;
}

function classFeatFeatureName(feature = {}) {
  return typeof feature === "string" ? feature : feature?.name || "";
}

function isClassFeatSlotFeature(feature = {}) {
  return /\bfeats?\b/i.test(classFeatFeatureName(feature));
}

function classFeatSlotKey(slot = {}) {
  return [
    slot.className || "",
    slot.characterLevel || "",
    slot.classLevel || "",
    slot.name || "Bonus Feat",
    slot.index || 0,
  ].join("|");
}

function activeCharacterLevelLimit() {
  return Math.max(1, Math.min(20, num("characterLevel") || 1));
}

function classFeatSlotsByLevel(limit = 20) {
  const cappedLimit = Math.max(1, Math.min(20, Number(limit) || 20));
  const counts = {};
  const groups = new Map();
  classProgression.slice(0, cappedLimit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature, index) => {
      if (!isClassFeatSlotFeature(feature)) return;
      if (Array.isArray(feature?.featGrants) && feature.featGrants.length)
        return;
      const name = capitalizedFeatureName(classFeatFeatureName(feature));
      const slot = {
        index,
        name: name || "Bonus Feat",
        className,
        classLevel,
        characterLevel: row.level,
        description:
          typeof feature === "object"
            ? feature.description || feature.desc || ""
            : "",
      };
      if (!groups.has(row.level)) groups.set(row.level, []);
      groups.get(row.level).push(slot);
    });
  });
  return groups;
}

function featGrantMode(grant = {}) {
  const mode = String(grant.mode || grant.type || "").toLowerCase();
  if (["static", "category", "custom"].includes(mode)) return mode;
  if (grant.featPoolId || grant.customPoolId) return "custom";
  if (grant.featType || grant.category) return "category";
  return "static";
}

function featGrantSourceLevel(source = {}, grant = {}) {
  const explicit = Number(
    grant.level || grant.characterLevel || grant.sourceCharacterLevel || 0,
  );
  if (Number.isFinite(explicit) && explicit > 0)
    return Math.max(1, Math.min(20, Math.floor(explicit)));
  if (
    source.category === "Race" ||
    /^Race:/i.test(source.name || "") ||
    /^Alternate Race:/i.test(source.name || "")
  )
    return 1;
  const sourceLevel = Number(source.sourceCharacterLevel || 0);
  if (Number.isFinite(sourceLevel) && sourceLevel > 0)
    return Math.max(1, Math.min(20, Math.floor(sourceLevel)));
  const characterLevel = Number(source.characterLevel || 0);
  if (Number.isFinite(characterLevel) && characterLevel > 0)
    return Math.max(1, Math.min(20, Math.floor(characterLevel)));
  return activeCharacterLevelLimit();
}

function featGrantLabel(grant = {}, source = {}) {
  return grant.label || grant.name || source.name || "Bonus Feat";
}

function featGrantSlotKey(slot = {}) {
  return [
    "effect",
    slot.level || "",
    slot.sourceKey || "",
    slot.index || 0,
    slot.label || "Bonus Feat",
  ].join("|");
}

function featGrantStaticId(grant = {}) {
  const raw = grant.featId || grant.id || grant.slug || grant.featName || grant.name || "";
  const exact = featById(raw);
  if (exact) return featId(exact);
  const target = String(raw || "").trim().toLowerCase();
  const byName = (featDefinitions.feats || []).find(
    (feat) => String(feat.name || "").trim().toLowerCase() === target,
  );
  return byName ? featId(byName) : raw;
}

function featGrantCustomList(grant = {}) {
  const id = grant.featPoolId || grant.customPoolId || "";
  return (
    window.PFEffectStats?.customFeatListById?.(id) ||
    window.PFEffectStats?.normalizeFeatList?.(grant.featPool) ||
    null
  );
}

function featGrantAllowedFeats(grant = {}) {
  const mode = featGrantMode(grant);
  if (mode === "category") {
    const category = String(grant.featType || grant.category || "General");
    return (featDefinitions.feats || []).filter((feat) =>
      featTypes(feat).some(
        (type) => type.toLowerCase() === category.toLowerCase(),
      ),
    );
  }
  if (mode === "custom") {
    const list = featGrantCustomList(grant);
    const allowed = new Set(
      (list?.items || [])
        .flatMap((item) => [item.featId, item.id, item.slug, item.label])
        .filter(Boolean)
        .map((item) => String(item).toLowerCase()),
    );
    return (featDefinitions.feats || []).filter((feat) =>
      [feat.id, feat.slug, feat.name]
        .filter(Boolean)
        .some((value) => allowed.has(String(value).toLowerCase())),
    );
  }
  return featDefinitions.feats || [];
}

function collectClassFeatureFeatGrantSlots(limit = 20) {
  const cappedLimit = Math.max(1, Math.min(20, Number(limit) || 20));
  const counts = {};
  const groups = new Map();
  classProgression.slice(0, cappedLimit).forEach((row) => {
    const className = row.className;
    if (!className) return;
    counts[className] = (counts[className] || 0) + 1;
    const classLevel = counts[className];
    const definition = classDefinitionByName(className);
    const levelData = classLevelAt(definition, classLevel);
    const features = levelData?.classFeatures || levelData?.special || [];
    features.forEach((feature, featureIndex) => {
      if (typeof feature === "string") return;
      const resolvedFeature = applyClassFeatureConditionalVariables(feature, {
        className,
        classLevel,
        characterLevel: row.level,
      });
      const source = {
        category: "Class Feature",
        name: resolvedFeature.name || "Class Feature",
        sourceClass: className,
        sourceClassLevel: classLevel,
        sourceCharacterLevel: row.level,
        characterLevel: activeCharacterLevelLimit(),
      };
      (Array.isArray(resolvedFeature.featGrants)
        ? resolvedFeature.featGrants
        : []
      ).forEach((grant, index) => {
        const level = featGrantSourceLevel(source, grant);
        if (!groups.has(level)) groups.set(level, []);
        groups.get(level).push({
          index,
          label: featGrantLabel(grant, source),
          grant,
          source,
          sourceKey: `${className}:${row.level}:${classLevel}:${featureIndex}`,
          level,
        });
      });
      featurePools(feature).forEach((pool, poolIndex) => {
        if (pool.contributesToAbility) return;
        const key = classFeatureChoiceKey(
          { ...feature, className, classLevel, characterLevel: row.level },
          pool,
          { className, classLevel, characterLevel: row.level },
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (!option) return;
        const optionSource = {
          ...source,
          name: option.name || pool.name || source.name,
          sourceKey: `${source.sourceClass}:${row.level}:${classLevel}:${featureIndex}:${poolIndex}:${selected}`,
        };
        (Array.isArray(option.featGrants) ? option.featGrants : []).forEach(
          (grant, index) => {
            const level = featGrantSourceLevel(optionSource, grant);
            if (!groups.has(level)) groups.set(level, []);
            groups.get(level).push({
              index,
              label: featGrantLabel(grant, optionSource),
              grant,
              source: optionSource,
              sourceKey: optionSource.sourceKey,
              level,
            });
          },
        );
      });
    });
  });
  return groups;
}

function effectFeatSlotsByLevel(limit = 20) {
  const cappedLimit = Math.max(1, Math.min(20, Number(limit) || 20));
  const groups = new Map();
  const addSource = (source = {}, sourceKey = "") => {
    (Array.isArray(source.featGrants) ? source.featGrants : []).forEach(
      (grant, index) => {
        const level = featGrantSourceLevel(source, grant);
        if (level > cappedLimit) return;
        if (!groups.has(level)) groups.set(level, []);
        groups.get(level).push({
          index,
          label: featGrantLabel(grant, source),
          grant,
          source,
          sourceKey,
          level,
        });
      },
    );
  };
  collectSelectedRaceBuffs().forEach((buff, index) =>
    addSource(buff, `race:${buff.name || index}`),
  );
  collectClassFeatureFeatGrantSlots(cappedLimit).forEach((slots, level) => {
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(...slots);
  });
  activeBuffs.forEach((buff, index) =>
    addSource(buff, `active:${buff.id || buff.name || index}`),
  );
  return groups;
}

function featLevelTitle(level) {
  return `Level ${level}`;
}

function normalizeCharacterFeatsForSave(raw = characterFeats) {
  const availableLevels = new Set(normalFeatLevels(20).map(String));
  const availableGranted = new Map();
  classFeatSlotsByLevel(20).forEach((slots) => {
    slots.forEach((slot) => availableGranted.set(classFeatSlotKey(slot), slot));
  });
  const availableEffect = new Map();
  effectFeatSlotsByLevel(20).forEach((slots) => {
    slots.forEach((slot) => availableEffect.set(featGrantSlotKey(slot), slot));
  });
  const normal = {};
  Object.entries(raw?.normal || {}).forEach(([level, featId]) => {
    const selection = featSelectionForSave(featId, { level: Number(level) });
    if (availableLevels.has(String(level)) && selection)
      normal[String(level)] = selection;
  });
  const granted = {};
  Object.entries(raw?.granted || {}).forEach(([key, value]) => {
    const slot = availableGranted.get(String(key));
    const selection = featSelectionForSave(value, {
      level: slot?.characterLevel,
      className: slot?.className,
      classLevel: slot?.classLevel,
      source: slot?.name,
    });
    if (!slot || !selection) return;
    granted[String(key)] = selection;
  });
  const effect = {};
  Object.entries(raw?.effect || {}).forEach(([key, value]) => {
    const slot = availableEffect.get(String(key));
    const selection = featSelectionForSave(value, {
      level: slot?.level,
      source: slot?.label,
    });
    if (!slot || !selection) return;
    effect[String(key)] = selection;
  });
  return { normal, granted, effect };
}

function featSelectionId(value) {
  return typeof value === "string"
    ? value
    : value?.featId || value?.id || value?.slug || value?.name || "";
}

function featSelectionMechanics(value) {
  return typeof value === "object" && value
    ? value.mechanics || value.resolvedMechanics || null
    : null;
}

function compactFeatMechanics(source = {}) {
  const mechanics = {};
  FEAT_MECHANIC_KEYS.forEach((key) => {
    if (Array.isArray(source[key]) && source[key].length)
      mechanics[key] = cloneJson(source[key]);
  });
  if (source.selectedBranchId) mechanics.selectedBranchId = source.selectedBranchId;
  if (source.selectedBranchName)
    mechanics.selectedBranchName = source.selectedBranchName;
  if (source.conditionalChoices && typeof source.conditionalChoices === "object")
    mechanics.conditionalChoices = cloneJson(source.conditionalChoices);
  return mechanics;
}

function featMechanicsHasAny(mechanics = {}) {
  const data = mechanics && typeof mechanics === "object" ? mechanics : {};
  return (
    FEAT_MECHANIC_KEYS.some(
      (key) => Array.isArray(data[key]) && data[key].length,
    ) ||
    Boolean(
      data.conditionalChoices &&
        Object.keys(data.conditionalChoices).length,
    )
  );
}

function featSelectionForSave(value, metadata = {}) {
  const featId = featSelectionId(value);
  if (!featId) return null;
  const mechanics = featSelectionMechanics(value);
  const selection = {
    ...Object.fromEntries(
      Object.entries(metadata).filter(([, entry]) => entry !== undefined),
    ),
    featId: String(featId),
  };
  if (featMechanicsHasAny(mechanics)) selection.mechanics = cloneJson(mechanics);
  return selection;
}

function featId(feat = {}) {
  return feat.id || feat.slug || feat.name || "";
}

function featTypes(feat = {}) {
  if (Array.isArray(feat.types) && feat.types.length) return feat.types;
  return [feat.type || "General"];
}

function featById(id = "") {
  const target = String(id || "");
  if (!target) return null;
  return (
    (featDefinitions.feats || []).find((feat) =>
      [feat.id, feat.slug, feat.name].some(
        (value) => String(value || "") === target,
      ),
    ) || null
  );
}

function featCategories() {
  const groupNames = (featDefinitions.types || [])
    .map((group) => group.name)
    .filter(Boolean);
  const featNames = (featDefinitions.feats || [])
    .flatMap(featTypes)
    .filter(Boolean);
  return [...new Set([...groupNames, ...featNames])].sort((left, right) =>
    left.localeCompare(right),
  );
}

function featCategoriesForFeats(feats = [], grant = {}) {
  if (featGrantMode(grant) === "category") {
    return [grant.featType || grant.category || "General"];
  }
  const categories = [
    ...new Set((Array.isArray(feats) ? feats : []).flatMap(featTypes)),
  ].sort((left, right) => left.localeCompare(right));
  if (!categories.length) return ["General"];
  const generalIndex = categories.findIndex(
    (category) => category.toLowerCase() === "general",
  );
  if (generalIndex > 0) {
    const [general] = categories.splice(generalIndex, 1);
    categories.unshift(general);
  }
  return categories;
}

function selectedFeatIds({ activeOnly = false } = {}) {
  const limit = activeOnly ? activeCharacterLevelLimit() : 20;
  const availableLevels = new Set(normalFeatLevels(limit).map(String));
  const availableGranted = new Set();
  classFeatSlotsByLevel(limit).forEach((slots) => {
    slots.forEach((slot) => availableGranted.add(classFeatSlotKey(slot)));
  });
  const effectSlots = new Map();
  effectFeatSlotsByLevel(limit).forEach((slots) => {
    slots.forEach((slot) => effectSlots.set(featGrantSlotKey(slot), slot));
  });
  return [
    ...Object.entries(characterFeats?.normal || {})
    .filter(([level]) => availableLevels.has(String(level)))
    .map(([, selection]) => featSelectionId(selection))
    .filter(Boolean),
    ...Object.entries(characterFeats?.granted || {})
      .filter(([key]) => availableGranted.has(String(key)))
      .map(([, value]) => featSelectionId(value))
    .filter(Boolean),
    ...Object.entries(characterFeats?.effect || {})
      .filter(([key]) => effectSlots.has(String(key)))
      .map(([, value]) => featSelectionId(value))
      .filter(Boolean),
    ...[...effectSlots.entries()]
      .filter(
        ([key, slot]) =>
          featGrantMode(slot.grant) === "static" &&
          !characterFeats?.effect?.[key],
      )
      .map(([, slot]) => featGrantStaticId(slot.grant))
      .filter(Boolean),
  ].map(String);
}

function selectedFeatSelections({ activeOnly = false } = {}) {
  const limit = activeOnly ? activeCharacterLevelLimit() : 20;
  const availableLevels = new Set(normalFeatLevels(limit).map(String));
  const availableGranted = new Set();
  classFeatSlotsByLevel(limit).forEach((slots) => {
    slots.forEach((slot) => availableGranted.add(classFeatSlotKey(slot)));
  });
  const effectSlots = new Map();
  effectFeatSlotsByLevel(limit).forEach((slots) => {
    slots.forEach((slot) => effectSlots.set(featGrantSlotKey(slot), slot));
  });
  const selections = [];
  Object.entries(characterFeats?.normal || {}).forEach(([level, selection]) => {
    if (!availableLevels.has(String(level))) return;
    const id = featSelectionId(selection);
    if (id) selections.push({ id, selection, level: Number(level), source: "Feat" });
  });
  Object.entries(characterFeats?.granted || {}).forEach(([key, selection]) => {
    if (!availableGranted.has(String(key))) return;
    const id = featSelectionId(selection);
    if (id)
      selections.push({
        id,
        selection,
        level: Number(selection?.level || 0),
        source: selection?.source || "Bonus Feat",
      });
  });
  effectSlots.forEach((slot, key) => {
    const mode = featGrantMode(slot.grant);
    const selection =
      characterFeats?.effect?.[key] ||
      (mode === "static" ? featGrantStaticId(slot.grant) : "");
    const id = featSelectionId(selection);
    if (!id) return;
    selections.push({
      id,
      selection,
      level: slot.level,
      source: slot.label || "Bonus Feat",
    });
  });
  return selections;
}

function featDescription(feat = {}) {
  return [
    feat.prerequisites ? `Prerequisites: ${feat.prerequisites}` : "",
    feat.description,
    feat.benefit ? `Benefit: ${feat.benefit}` : "",
    feat.normal ? `Normal: ${feat.normal}` : "",
    feat.special ? `Special: ${feat.special}` : "",
    feat.goal ? `Goal: ${feat.goal}` : "",
    feat.completionBenefit
      ? `Completion Benefit: ${feat.completionBenefit}`
      : "",
    feat.note,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function featInitialCategoryForSlot(label = "") {
  const categories = featCategories();
  const lower = String(label || "").toLowerCase();
  const preferred = [
    ["teamwork", "Teamwork"],
    ["combat", "Combat"],
    ["grit", "Grit"],
    ["style", "Style"],
    ["metamagic", "Metamagic"],
    ["item creation", "Item Creation"],
    ["critical", "Critical"],
    ["performance", "Performance"],
    ["racial", "Racial"],
  ].find(([needle]) => lower.includes(needle));
  if (!preferred) return "General";
  return (
    categories.find(
      (category) =>
        category.toLowerCase() === preferred[1].toLowerCase(),
    ) || "General"
  );
}

async function resolveFeatChoicesBeforeSave(feat = {}, label = "Feat") {
  if (!feat) return null;
  const resolvedMechanics = await resolveRacialTraitMechanicChoices(feat, {
    ...feat,
    name: feat.name || label,
  });
  if (!resolvedMechanics) return null;
  const resolvedVariables = await resolveConditionalVariablesForItem(
    resolvedMechanics,
    feat.name || label,
  );
  if (!resolvedVariables) return null;
  return {
    featId: featId(feat),
    mechanics: compactFeatMechanics(resolvedVariables),
  };
}

function featHasChoiceBearingMechanics(feat = {}) {
  const hasChoiceStats = (items = []) =>
    (Array.isArray(items) ? items : []).some((item) =>
      window.PFEffectStats?.isChoiceStat?.(item.stat),
    );
  return (
    window.PFEffectMechanics?.hasBranches?.(feat) ||
    hasChoiceStats(feat.effects) ||
    hasChoiceStats(feat.classSkillGrants) ||
    hasChoiceStats(feat.bonusRanks) ||
    (Array.isArray(feat.spellLikeAbilities) &&
      feat.spellLikeAbilities.some(spellLikeAbilityHasChoiceList)) ||
    spellAdjustmentEntriesNeedChoice(feat.casterLevelBonuses) ||
    spellAdjustmentEntriesNeedChoice(feat.spellDcBonuses) ||
    spellAdjustmentEntriesNeedChoice(feat.effectiveAttributeBonuses) ||
    grantDomainEntriesNeedChoice(feat.grantDomains) ||
    conditionalVariables(feat).length > 0 ||
    (Array.isArray(feat.effects) &&
      feat.effects.some(needsFavoredEnemyScaleChoice))
  );
}

function storeCharacterFeatSelection(kind, key, level, label, selection) {
  if (kind === "effect") {
    if (!characterFeats.effect) characterFeats.effect = {};
    characterFeats.effect[key] = {
      level,
      source: label,
      ...selection,
    };
    return;
  }
  if (kind === "granted") {
    if (!characterFeats.granted) characterFeats.granted = {};
    characterFeats.granted[key] = {
      level,
      source: label,
      ...selection,
    };
    return;
  }
  if (!characterFeats.normal) characterFeats.normal = {};
  characterFeats.normal[String(level)] = {
    level,
    ...selection,
  };
}

const FEAT_MECHANIC_KEYS = window.PFEffectMechanics?.mechanicKeys?.() || [
  "effects",
  "damageReduction",
  "spellResistance",
  "immunities",
  "applyConditions",
  "classSkillGrants",
  "bonusRanks",
  "extraRanksPerLevel",
  "featGrants",
  "sizeChanges",
  "spellLikeAbilities",
  "casterLevelBonuses",
  "spellDcBonuses",
  "effectiveAttributeBonuses",
  "grantDomains",
  "generatedEquipment",
  "conditionalVariables",
];

function featHasAnyMechanics(feat = {}) {
  return FEAT_MECHANIC_KEYS.some(
    (key) => Array.isArray(feat[key]) && feat[key].length,
  );
}

function collectSelectedFeatBuffs() {
  const characterLevel = Math.max(1, num("characterLevel") || 1);
  return selectedFeatSelections({ activeOnly: true })
    .map(({ id, selection, source }) => {
      const feat = featById(id);
      if (!feat) return null;
      const mechanics = featSelectionMechanics(selection);
      return {
        sourceName: source,
        feat: mergeResolvedMechanics(feat, mechanics),
      };
    })
    .filter(Boolean)
    .map(({ feat, sourceName }) => ({
      sourceName,
      feat: {
        ...feat,
        ...(window.PFEffectMechanics?.passiveMechanics?.(feat) || feat),
      },
    }))
    .filter(({ feat }) => featHasAnyMechanics(feat))
    .map(({ feat, sourceName }) => ({
      category: "Feat",
      source: `${sourceName || "Feat"}: ${feat.name || "Feat"}`,
      name: feat.name || "Feat",
      description: featDescription(feat),
      detailUrl: feat.url || feat.link || feat.sourceUrl || "",
      detailData: {
        type: Array.isArray(feat.types) ? feat.types.join(", ") : feat.type || "Feat",
        prerequisites: feat.prerequisites || "",
        benefit: feat.benefit || "",
        normal: feat.normal || "",
        special: feat.special || "",
        description: feat.description || "",
      },
      characterLevel,
      classLevel: characterLevel,
      casterLevel: characterLevel,
      permanent: true,
      bonuses: Array.isArray(feat.effects) ? feat.effects : [],
      damageReduction: Array.isArray(feat.damageReduction)
        ? feat.damageReduction
        : [],
      spellResistance: Array.isArray(feat.spellResistance)
        ? feat.spellResistance
        : [],
      immunities: Array.isArray(feat.immunities) ? feat.immunities : [],
      applyConditions: Array.isArray(feat.applyConditions)
        ? feat.applyConditions
        : [],
      classSkillGrants: Array.isArray(feat.classSkillGrants)
        ? feat.classSkillGrants
        : [],
      bonusRanks: Array.isArray(feat.bonusRanks) ? feat.bonusRanks : [],
      extraRanksPerLevel: Array.isArray(feat.extraRanksPerLevel)
        ? feat.extraRanksPerLevel
        : [],
      featGrants: Array.isArray(feat.featGrants) ? feat.featGrants : [],
      sizeChanges: Array.isArray(feat.sizeChanges) ? feat.sizeChanges : [],
      spellLikeAbilities: Array.isArray(feat.spellLikeAbilities)
        ? feat.spellLikeAbilities
        : [],
      casterLevelBonuses: Array.isArray(feat.casterLevelBonuses)
        ? feat.casterLevelBonuses
        : [],
      spellDcBonuses: Array.isArray(feat.spellDcBonuses)
        ? feat.spellDcBonuses
        : [],
      effectiveAttributeBonuses: Array.isArray(feat.effectiveAttributeBonuses)
        ? feat.effectiveAttributeBonuses
        : [],
      grantDomains: Array.isArray(feat.grantDomains) ? feat.grantDomains : [],
      generatedEquipment: Array.isArray(feat.generatedEquipment)
        ? feat.generatedEquipment
        : [],
      conditionalVariables: Array.isArray(feat.conditionalVariables)
        ? feat.conditionalVariables
        : [],
      auraConfig: feat.auraConfig || null,
    }));
}

function renderFeatProgression() {
  const root = el("featProgressionList");
  if (!root) return;
  const feats = featDefinitions.feats || [];
  if (!feats.length) {
    root.innerHTML = `<div class="small-text">Feat data is not loaded.</div>`;
    return;
  }
  const levels = featDisplayLevels();
  if (!levels.length) {
    root.innerHTML = `<div class="small-text">No feat levels yet.</div>`;
    return;
  }
  const grantedSlots = classFeatSlotsByLevel();
  const effectSlots = effectFeatSlotsByLevel();
  const renderChoice = ({
    level,
    kind,
    key,
    label,
    selection = "",
    slot = null,
  }) => {
    const selectedId = featSelectionId(selection);
    const grantMode = slot?.grant ? featGrantMode(slot.grant) : "";
    const lockedStaticGrant = kind === "effect" && grantMode === "static";
    const selectedFeat = featById(selectedId);
    const selectedName = selectedFeat?.name || selectedId || "";
    const hasChoiceButton =
      selectedFeat && featHasChoiceBearingMechanics(selectedFeat);
    const choiceSummary = hasChoiceButton
      ? featChoiceSummary(selection)
      : "";
    const displayName =
      selectedName && hasChoiceButton
        ? `${selectedName} (${choiceSummary || "not selected"})`
        : selectedName;
    const safeKey = escapeHtml(key);
    const primaryAction = selectedFeat
      ? `data-character-feat-detail="${escapeHtml(featId(selectedFeat))}"`
      : `data-character-feat-pick="${safeKey}" data-character-feat-kind="${escapeHtml(kind)}" data-character-feat-level="${level}" data-character-feat-label="${escapeHtml(label)}"`;
    return `
      <article class="feat-choice-entry">
        <div class="class-feature-choice-row feat-choice-row">
          <button class="btn btn-outline-info btn-sm class-feature-choice-select" type="button" ${primaryAction} title="${escapeHtml(selectedFeat ? `View ${displayName}` : `${label}: not selected`)}">
            <span>${escapeHtml(displayName || "not selected")}</span>
          </button>
          ${
            hasChoiceButton
              ? `
            <button class="btn btn-outline-info btn-sm btn-icon class-feature-choice-clear feat-choice-reselect" type="button" data-character-feat-rechoose="${safeKey}" data-character-feat-kind="${escapeHtml(kind)}" data-character-feat-level="${level}" data-character-feat-label="${escapeHtml(label)}" title="Redo feat choices" aria-label="Redo choices for ${escapeHtml(selectedName || "feat")}"><i class="bi bi-arrow-clockwise"></i></button>
          `
              : ""
          }
          ${
            selectedId && !lockedStaticGrant
              ? `
            <button class="btn btn-outline-danger btn-sm btn-icon class-feature-choice-clear feat-choice-remove" type="button" data-character-feat-clear="${safeKey}" data-character-feat-kind="${escapeHtml(kind)}" aria-label="Clear ${escapeHtml(selectedName || "feat")}"><i class="bi bi-trash"></i></button>
          `
              : ""
          }
        </div>
        ${
          slot?.description
            ? `<div class="small text-secondary mt-2">${escapeHtml(slot.description)}</div>`
            : ""
        }
      </article>
    `;
  };
  root.innerHTML = levels
    .map((level) => {
      const choices = [];
      if (isNormalFeatLevel(level)) {
        choices.push(
          renderChoice({
            level,
            kind: "normal",
            key: String(level),
            label: "Feat",
            selection: characterFeats?.normal?.[String(level)] || "",
          }),
        );
      }
      (grantedSlots.get(level) || []).forEach((slot) => {
        const key = classFeatSlotKey(slot);
        choices.push(
          renderChoice({
            level,
            kind: "granted",
            key,
            label: slot.name || "Bonus Feat",
            selection: characterFeats?.granted?.[key] || "",
            slot,
          }),
        );
      });
      (effectSlots.get(level) || []).forEach((slot) => {
        const key = featGrantSlotKey(slot);
        const mode = featGrantMode(slot.grant);
        const selection =
          characterFeats?.effect?.[key] ||
          (mode === "static" ? featGrantStaticId(slot.grant) : "");
        choices.push(
          renderChoice({
            level,
            kind: "effect",
            key,
            label: slot.label || "Bonus Feat",
            selection,
            slot,
          }),
        );
      });
      return `
        <section class="class-feature-item">
          <div class="sheet-title mb-2">${escapeHtml(featLevelTitle(level))}</div>
          <div class="vstack gap-2">
            ${
              choices.length
                ? choices.join("")
                : `<div class="small-text">No feat choices at this level.</div>`
            }
          </div>
        </section>
      `;
    })
    .join("");
  root.querySelectorAll("[data-character-feat-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      const feat = featById(button.dataset.characterFeatDetail || "");
      if (feat) window.PFFeatDetails?.open?.(feat);
    });
  });
  root.querySelectorAll("[data-character-feat-pick]").forEach((button) => {
    button.addEventListener("click", async () => {
      const level = Number(
        button.dataset.characterFeatLevel || button.dataset.characterFeatPick,
      );
      const key = button.dataset.characterFeatPick || "";
      const kind = button.dataset.characterFeatKind || "normal";
      const label = button.dataset.characterFeatLabel || "Feat";
      const selectedId =
        kind === "effect"
          ? featSelectionId(characterFeats?.effect?.[key] || "")
        : kind === "granted"
          ? featSelectionId(characterFeats?.granted?.[key] || "")
          : featSelectionId(characterFeats?.normal?.[String(level)] || "");
      const slot =
        kind === "effect"
          ? [...effectFeatSlotsByLevel(20).values()]
              .flat()
              .find((entry) => featGrantSlotKey(entry) === key)
          : null;
      const mode = slot?.grant ? featGrantMode(slot.grant) : "";
      const fixedId = mode === "static" ? featGrantStaticId(slot.grant) : "";
      if (kind === "effect" && mode === "static") {
        const chosenFeat = featById(fixedId);
        if (!chosenFeat) return;
        if (!featHasChoiceBearingMechanics(chosenFeat)) return;
        const nextSelection = await resolveFeatChoicesBeforeSave(chosenFeat, label);
        if (!nextSelection) return;
        storeCharacterFeatSelection(kind, key, level, label, nextSelection);
        renderFeatProgression();
        recalculateSheet();
        queueSheetSave();
        return;
      }
      if (!window.PFFeatPicker) return;
      const pickerFeats = slot?.grant ? featGrantAllowedFeats(slot.grant) : feats;
      const pickerCategories = slot?.grant
        ? featCategoriesForFeats(pickerFeats, slot.grant)
        : featCategories();
      const choice = await window.PFFeatPicker.open({
        title: `${featLevelTitle(level)}: ${label}`,
        feats: pickerFeats,
        categories: pickerCategories,
        initialCategory:
          mode === "category"
            ? slot.grant.featType || slot.grant.category || "General"
            : featInitialCategoryForSlot(label),
        selectedId,
        selectedIds: selectedFeatIds(),
      });
      if (choice === null) return;
      let nextSelection = "";
      if (choice) {
        const chosenFeat = featById(choice);
        nextSelection = await resolveFeatChoicesBeforeSave(chosenFeat, label);
        if (!nextSelection) return;
      }
      if (kind === "effect") {
        if (choice) {
          storeCharacterFeatSelection(kind, key, level, label, nextSelection);
        } else {
          if (characterFeats?.effect) delete characterFeats.effect[key];
        }
      } else if (kind === "granted") {
        if (choice) {
          storeCharacterFeatSelection(kind, key, level, label, nextSelection);
        } else {
          delete characterFeats.granted[key];
        }
      } else {
        if (choice) storeCharacterFeatSelection(kind, key, level, label, nextSelection);
        else delete characterFeats.normal[String(level)];
      }
      renderFeatProgression();
      recalculateSheet();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-character-feat-rechoose]").forEach((button) => {
    button.addEventListener("click", async () => {
      const level = Number(
        button.dataset.characterFeatLevel || button.dataset.characterFeatRechoose,
      );
      const key = button.dataset.characterFeatRechoose || "";
      const kind = button.dataset.characterFeatKind || "normal";
      const label = button.dataset.characterFeatLabel || "Feat";
      const selectedId =
        kind === "effect"
          ? featSelectionId(characterFeats?.effect?.[key] || "")
        : kind === "granted"
          ? featSelectionId(characterFeats?.granted?.[key] || "")
          : featSelectionId(characterFeats?.normal?.[String(level)] || "");
      const effectSlot =
        kind === "effect"
          ? [...effectFeatSlotsByLevel(20).values()]
              .flat()
              .find((entry) => featGrantSlotKey(entry) === key)
          : null;
      const selectedFeat = featById(selectedId);
      const fixedFeat =
        !selectedFeat && effectSlot?.grant
          ? featById(featGrantStaticId(effectSlot.grant))
          : null;
      const featToResolve = selectedFeat || fixedFeat;
      if (!featToResolve) return;
      const nextSelection = await resolveFeatChoicesBeforeSave(
        featToResolve,
        label,
      );
      if (!nextSelection) return;
      storeCharacterFeatSelection(kind, key, level, label, nextSelection);
      renderFeatProgression();
      recalculateSheet();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-character-feat-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      const level = button.dataset.characterFeatClear;
      const key = button.dataset.characterFeatClear || "";
      const kind = button.dataset.characterFeatKind || "normal";
      if (kind === "effect" && characterFeats?.effect) {
        delete characterFeats.effect[key];
      } else if (kind === "granted" && characterFeats?.granted) {
        delete characterFeats.granted[key];
      } else if (characterFeats?.normal) {
        delete characterFeats.normal[String(level)];
      }
      renderFeatProgression();
      recalculateSheet();
      queueSheetSave();
    });
  });
}

function renderClassFeatures() {
  const root = el("classFeatureList");
  if (!root) return;
  classFeatureChoicePickerConfigs = new Map();
  classFeatureVariableChoicePickerConfigs = new Map();
  const counts = {};
  const groups = new Map();
  classProgression
    .slice(0, Math.max(1, num("characterLevel") || 1))
    .forEach((row) => {
      const definition = classDefinitionByName(row.className);
      if (!definition) return;
      counts[row.className] = (counts[row.className] || 0) + 1;
      const classLevel = counts[row.className];
      const levelData = classLevelAt(definition, classLevel);
      const features = levelData?.classFeatures || levelData?.special || [];
      if (!groups.has(row.level)) groups.set(row.level, []);
      features.forEach((feature) => {
        const nextFeature =
          typeof feature === "string"
            ? {
                className: row.className,
                classLevel,
                characterLevel: row.level,
                name: capitalizedFeatureName(feature),
                description: "",
              }
            : {
                className: row.className,
                classLevel,
                characterLevel: row.level,
                name: capitalizedFeatureName(feature.name || "Class Feature"),
                description: feature.description || feature.desc || "",
                effects: Array.isArray(feature.effects) ? feature.effects : [],
                damageReduction: Array.isArray(feature.damageReduction)
                  ? feature.damageReduction
                  : [],
                spellResistance: Array.isArray(feature.spellResistance)
                  ? feature.spellResistance
                  : [],
                immunities: Array.isArray(feature.immunities)
                  ? feature.immunities
                  : [],
                applyConditions: Array.isArray(feature.applyConditions)
                  ? feature.applyConditions
                  : [],
                classSkillGrants: Array.isArray(feature.classSkillGrants)
                  ? feature.classSkillGrants
                  : [],
                bonusRanks: Array.isArray(feature.bonusRanks)
                  ? feature.bonusRanks
                  : [],
                extraRanksPerLevel: Array.isArray(feature.extraRanksPerLevel)
                  ? feature.extraRanksPerLevel
                  : [],
                featGrants: Array.isArray(feature.featGrants)
                  ? feature.featGrants
                  : [],
                sizeChanges: Array.isArray(feature.sizeChanges)
                  ? feature.sizeChanges
                  : [],
                spellLikeAbilities: Array.isArray(feature.spellLikeAbilities)
                  ? feature.spellLikeAbilities
                  : [],
                casterLevelBonuses: Array.isArray(feature.casterLevelBonuses)
                  ? feature.casterLevelBonuses
                  : [],
                spellDcBonuses: Array.isArray(feature.spellDcBonuses)
                  ? feature.spellDcBonuses
                  : [],
                effectiveAttributeBonuses: Array.isArray(
                  feature.effectiveAttributeBonuses,
                )
                  ? feature.effectiveAttributeBonuses
                  : [],
                grantDomains: Array.isArray(feature.grantDomains)
                  ? feature.grantDomains
                  : [],
                generatedEquipment: Array.isArray(feature.generatedEquipment)
                  ? feature.generatedEquipment
                  : [],
                conditionalVariables: Array.isArray(feature.conditionalVariables)
                  ? feature.conditionalVariables
                  : [],
                pools: featurePools(feature),
              };
        groups.get(row.level).push(nextFeature);
      });
    });
  const populated = [...groups.entries()].filter(
    ([, features]) => features.length,
  );
  root.innerHTML = populated.length
    ? populated
        .map(
          ([level, features]) => `
    <section class="class-feature-item">
      <div class="sheet-title mb-2">${escapeHtml(classFeatureLevelTitle(level, features))}</div>
      <div class="vstack gap-2">
        ${features
          .map((feature, index) => {
            const collapseId = `featureDescription${level}_${index}`;
            return `
            <article class="class-feature-row border rounded p-2">
              <button class="class-feature-description-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                <span>${escapeHtml(feature.name)}</span>
                <i class="bi bi-chevron-down"></i>
              </button>
              ${renderClassFeatureConditionalVariables(feature)}
              ${renderClassFeatureMechanicChoices(feature)}
              ${renderClassFeaturePools(feature)}
              <div id="${collapseId}" class="collapse small mt-2">${feature.description ? escapeHtml(feature.description) : "No description scraped."}</div>
            </article>
          `;
          })
          .join("")}
      </div>
    </section>
  `,
        )
        .join("")
    : `<div class="small-text">No class features listed for the current progression.</div>`;
  root
    .querySelectorAll("[data-class-feature-choice-button]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const key = button.dataset.classFeatureChoiceButton;
        const config = classFeatureChoicePickerConfigs.get(key);
        if (!config || !window.PFClassFeatureChoicePicker) return;
        const { feature, pool } = config;
        const selected = classFeatureChoices[key] || "";
        const choice = await PFClassFeatureChoicePicker.open({
          title: pool.name || "Choose Feature",
          poolName: pool.name || "Class Feature",
          description: pool.description || "",
          selected,
          poolWarnings: requirementWarnings(pool.requirements || {}, feature),
          options: (pool.options || []).map((option) => {
            const warnings = requirementWarnings(
              option.requirements || {},
              feature,
              { option, poolName: pool.name, excludeKey: key },
            );
            return { ...option, warnings, unmet: warnings.blockingCount > 0 };
          }),
        });
        if (choice === null) return;
        if (choice) classFeatureChoices[key] = choice;
        else delete classFeatureChoices[key];
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
  root
    .querySelectorAll("[data-class-feature-variable-button]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const key = button.dataset.classFeatureVariableButton;
        const config = classFeatureVariableChoicePickerConfigs.get(key);
        if (!config) return;
        const resolved = await resolveConditionalVariablesForItem(
          {
            conditionalVariables: config.feature.conditionalVariables,
            conditionalChoices: classFeatureVariableChoices[key] || {},
          },
          config.feature.name || "Class Feature",
        );
        if (!resolved) return;
        classFeatureVariableChoices[key] = resolved.conditionalChoices || {};
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
  root
    .querySelectorAll("[data-class-feature-mechanic-button]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const key = button.dataset.classFeatureMechanicButton;
        const config = classFeatureVariableChoicePickerConfigs.get(key);
        if (!config) return;
        const resolved = await resolveRacialTraitMechanicChoices(
          config.feature,
          { ...config.feature, name: config.feature.name || "Class Feature" },
        );
        if (!resolved) return;
        classFeatureVariableChoices[key] = {
          ...(classFeatureVariableChoices[key] || {}),
          mechanics: compactFeatMechanics(resolved),
        };
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
  root
    .querySelectorAll("[data-class-feature-variable-clear]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.classFeatureVariableClear;
        delete classFeatureVariableChoices[key];
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
  root
    .querySelectorAll("[data-class-feature-mechanic-clear]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.classFeatureMechanicClear;
        if (classFeatureVariableChoices[key]) {
          delete classFeatureVariableChoices[key].mechanics;
          if (!Object.keys(classFeatureVariableChoices[key]).length)
            delete classFeatureVariableChoices[key];
        }
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
  root
    .querySelectorAll("[data-class-feature-choice-clear]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.classFeatureChoiceClear;
        delete classFeatureChoices[key];
        renderClassFeatures();
        recalculateSheet();
        queueSheetSave();
      });
    });
}

function spellAbilityMod(ability) {
  const key = String(ability || "")
    .toLowerCase()
    .slice(0, 3);
  if (!key || !el(`${key}Total`)) return 0;
  const total = el(`${key}Total`).value || "";
  const match = total.match(/\(([+-]?\d+)\)/);
  if (match) return Number(match[1] || 0);
  return window.PFBuffs?.abilityMod
    ? window.PFBuffs.abilityMod(Number(total || 10))
    : Math.floor((Number(total || 10) - 10) / 2);
}

function normalizeAbilityKey(ability) {
  const raw = String(ability || "").trim().toLowerCase();
  if (!raw) return "";
  const short = raw.slice(0, 3);
  if (ABILITIES.some(([key]) => key === short)) return short;
  const statName = ABILITY_NAME_TO_STAT[raw];
  if (!statName) return "";
  return (
    Object.entries(ABILITY_STAT_NAMES).find(([, name]) => name === statName)?.[0] ||
    ""
  );
}

function bonusSlotsForSpellLevel(modifier, spellLevel) {
  const level = Number(spellLevel || 0);
  if (level <= 0 || modifier < level) return 0;
  return 1 + Math.floor((modifier - level) / 4);
}

function spellcastingStateKey(className) {
  return String(className || "Class").replace(/[^a-z0-9]+/gi, "_");
}

function spellcastingRowValue(rows, classLevel, spellLevel) {
  const row = Array.isArray(rows)
    ? rows[Math.max(0, Number(classLevel || 1) - 1)]
    : null;
  if (!Array.isArray(row)) return 0;
  return Number(row[spellLevel] || 0);
}

function spellStateValue(className, bucket, spellLevel) {
  const key = spellcastingStateKey(className);
  const value = characterSpells?.[key]?.[bucket]?.[spellLevel];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((spell) => spell.trim())
      .filter(Boolean);
  }
  return [];
}

function setSpellStateValue(
  className,
  bucket,
  spellLevel,
  spells,
  { unique = true } = {},
) {
  const key = spellcastingStateKey(className);
  if (!characterSpells[key]) characterSpells[key] = {};
  if (!characterSpells[key][bucket]) characterSpells[key][bucket] = {};
  const values = unique
    ? (spells || []).filter(Boolean)
    : Array.from(spells || []).map((value) => value || "");
  characterSpells[key][bucket][spellLevel] = unique
    ? Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
    : values;
}

function spellBucketLabel(bucket) {
  return bucket === "book"
    ? "Known in book"
    : bucket === "known"
      ? "Known spells"
      : "Prepared today";
}

function spellPickerClassAliases(className) {
  const key = String(className || "").toLowerCase();
  const aliases = new Set([key]);
  if (key === "wizard") aliases.add("arcanist");
  if (key === "arcanist") aliases.add("wizard");
  return aliases;
}

function spellClassLevelForClass(spell = {}, className = "") {
  const levels = String(spell.details?.level || "").toLowerCase();
  for (const alias of spellPickerClassAliases(className)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = levels.match(
      new RegExp(`(?:^|,\\s*)${escaped}\\s+(\\d+)\\b`, "i"),
    );
    if (match) return Number(match[1]);
  }
  return null;
}

async function spellByNameForClass(spellName = "", className = "") {
  const spells = window.PFSpellData?.loadSpells
    ? await window.PFSpellData.loadSpells()
    : [];
  const target = String(spellName || "").trim().toLowerCase();
  const exact = spells.filter(
    (spell) => String(spell.name || "").trim().toLowerCase() === target,
  );
  return (
    exact.find((spell) => spellClassLevelForClass(spell, className) !== null) ||
    exact[0] ||
    null
  );
}

function spellLowestListedLevel(spell = {}) {
  const levels = [...String(spell.details?.level || "").matchAll(/\b(\d+)\b/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  return levels.length ? Math.min(...levels) : 0;
}

async function openCharacterSpellLikeDetails(detailKey = "") {
  const config = spellLikeDetailConfigs.get(detailKey);
  if (!config) return;
  const spell = await spellByNameForClass(config.spellName);
  if (!spell) {
    setStatus(`Could not find spell details for ${config.spellName}.`, "warning");
    return;
  }
  const entry = config.entry || {};
  const spellLevel = Math.max(
    0,
    Number(entry.spellLevel ?? spellLowestListedLevel(spell)) || 0,
  );
  const calculationOptions = {
    spellSource: "spell-like-abilities",
    baseCasterLevel: Math.max(1, Number(num("characterLevel") || 1)),
    castingAbility: spellLikeCastingAttrKey(entry) || "cha",
    spellLevel,
  };
  await openSpellDetails({
    title: config.spellName,
    spell,
    spellName: config.spellName,
    className: "",
    spellLevel,
    calculations: safeSpellDetailCalculations(
      spell,
      "",
      spellLevel,
      calculationOptions,
    ),
    recalculate: (casterLevel) =>
      safeSpellDetailCalculations(spell, "", spellLevel, {
        ...calculationOptions,
        casterLevel,
      }),
    onCast: castSpellFromDetails,
  });
}

function spellSchoolName(spell = {}) {
  return String(spell.details?.school || "")
    .split(/[,(]/)[0]
    .trim();
}

function spellSubschools(spell = {}) {
  const school = String(spell.details?.school || "");
  return [...school.matchAll(/\(([^()]+)\)/g)]
    .flatMap((match) => String(match[1] || "").split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function spellcastingMagicType(className = "", meta = {}) {
  const explicit = String(meta.magicType || meta.typeOfMagic || "").trim();
  if (explicit) return explicit.toLowerCase();
  const name = String(className || "").toLowerCase();
  const divine = new Set([
    "adept",
    "antipaladin",
    "cleric",
    "druid",
    "hunter",
    "inquisitor",
    "oracle",
    "paladin",
    "ranger",
    "shaman",
    "warpriest",
  ]);
  const psychic = new Set(["medium", "mesmerist", "psychic", "spiritualist"]);
  const occult = new Set(["occultist"]);
  if (divine.has(name)) return "divine";
  if (psychic.has(name)) return "psychic";
  if (occult.has(name)) return "occult";
  return "arcane";
}

function spellcastingSourceKind(className = "", meta = {}) {
  const explicit = String(
    meta.spellSource ||
      meta.appliesToSource ||
      meta.sourceKind ||
      meta.effectKind ||
      meta.spellKind ||
      "",
  )
    .trim()
    .toLowerCase();
  if (explicit) return explicit;
  const name = String(className || "").trim().toLowerCase();
  if (name === "alchemist" || name === "investigator") return "extracts";
  return "strict-spells";
}

function scaledDurationText(duration = "", casterLevel = 0) {
  const match = String(duration || "").match(
    /(\d+)?\s*(rounds?|minutes?|mins?\.?|hours?|days?)\s*\/\s*(?:(\d+)\s*)?levels?/i,
  );
  if (!match) return "";
  const amount = Number(match[1] || 1);
  const unitKey = String(match[2] || "").toLowerCase();
  const denominator = Math.max(1, Number(match[3] || 1));
  const units = amount * Math.floor(Number(casterLevel || 0) / denominator);
  if (!units) return "";
  const unit = /^min/.test(unitKey)
    ? "minute"
    : /^hour/.test(unitKey)
      ? "hour"
      : /^day/.test(unitKey)
        ? "day"
        : "round";
  return `${units} ${unit}${units === 1 ? "" : "s"} at CL ${casterLevel}`;
}

function scaledRangeText(range = "", casterLevel = 0) {
  const text = String(range || "");
  const cl = Number(casterLevel || 0);
  if (!cl) return "";
  const named = [
    { pattern: /^close\b/i, base: 25, step: 5, denominator: 2 },
    { pattern: /^medium\b/i, base: 100, step: 10, denominator: 1 },
    { pattern: /^long\b/i, base: 400, step: 40, denominator: 1 },
  ].find((entry) => entry.pattern.test(text));
  if (named)
    return `${named.base + named.step * Math.floor(cl / named.denominator)} ft. at CL ${cl}`;
  const match = text.match(
    /(\d+)\s*ft\.?\s*\+\s*(\d+)\s*ft\.?\s*\/\s*(?:(\d+)\s*)?levels?/i,
  );
  if (!match) return "";
  const total =
    Number(match[1] || 0) +
    Number(match[2] || 0) *
      Math.floor(cl / Math.max(1, Number(match[3] || 1)));
  return total ? `${total} ft. at CL ${cl}` : "";
}

function spellDetailCalculations(
  spell = {},
  className = "",
  slotLevel = 0,
  options = {},
) {
  const definition = classDefinitionByName(className);
  const definitionMeta = definition?.spellcasting || {};
  const meta = options.castingAbility
    ? { ...definitionMeta, ability: options.castingAbility }
    : definitionMeta;
  const classLevel = Math.max(
    1,
    Number(
      options.baseCasterLevel ??
        progressionClassCounts()[className] ??
        num("characterLevel") ??
        1,
    ) || 1,
  );
  const spellLevel = Number.isFinite(Number(options.spellLevel))
    ? Number(options.spellLevel)
    : spellClassLevelForClass(spell, className) ?? slotLevel;
  const spellSource = options.spellSource || spellcastingSourceKind(className, meta);
  const classBloodline = selectedBloodlineForClass(className);
  const descriptors = window.PFSpellData?.spellDescriptors
    ? window.PFSpellData.spellDescriptors(spell)
    : spell.details?.descriptors || [];
  const characterDomains = collectGrantedDomains();
  const matchingDomains = characterDomains.filter((grant) =>
    grant.spellNames.includes(String(spell.name || "").toLowerCase().trim()),
  );
  const spellDomains = allDomainsForSpell(spell);
  const characterDomainIds = [
    ...new Set(
      characterDomains.flatMap((grant) =>
        (grant.equivalents || []).map((domain) => domain.id).filter(Boolean),
      ),
    ),
  ];
  const characterDomainNames = [
    ...new Set(
      characterDomains.flatMap((grant) =>
        (grant.equivalents || []).map((domain) => domain.name).filter(Boolean),
      ),
    ),
  ];
  const matchingDomainIds = [
    ...new Set(
      matchingDomains.flatMap((grant) =>
        (grant.equivalents || []).map((domain) => domain.id).filter(Boolean),
      ),
    ),
  ];
  const matchingDomainNames = [
    ...new Set(
      matchingDomains.flatMap((grant) =>
        (grant.equivalents || []).map((domain) => domain.name).filter(Boolean),
      ),
    ),
  ];
  const spellDomainIds = [
    ...new Set(
      spellDomains.flatMap((domain) =>
        domainEquivalentRefs(domain).map((ref) => ref.id).filter(Boolean),
      ),
    ),
  ];
  const spellDomainNames = [
    ...new Set(
      spellDomains.flatMap((domain) =>
        domainEquivalentRefs(domain).map((ref) => ref.name).filter(Boolean),
      ),
    ),
  ];
  const context = {
    name: spell.name,
    spellName: spell.name,
    spell,
    className,
    castingClass: className,
    spellClass: className,
    spellLevel,
    school: spellSchoolName(spell),
    subschool: spellSubschools(spell),
    subschools: spellSubschools(spell),
    descriptor: descriptors,
    descriptors,
    magicType: spellcastingMagicType(className, meta),
    magicTypes: [spellcastingMagicType(className, meta)],
    domainIds: matchingDomainIds,
    domains: matchingDomainNames,
    domainNames: matchingDomainNames,
    characterDomainIds,
    characterDomains: characterDomainNames,
    characterDomainNames,
    spellDomainIds,
    spellDomains: spellDomainNames,
    spellDomainNames,
    matchingDomainIds,
    matchingDomainNames,
    spellSource,
    sourceKind: spellSource,
    effectKind: spellSource,
    characterLevel: num("characterLevel"),
    classLevel,
    classLevels: progressionClassCounts(),
    bloodlineId: classBloodline?.id || "",
    bloodline: classBloodline?.name || "",
    bloodlineName: classBloodline?.name || "",
    classBloodlineId: classBloodline?.id || "",
    classBloodline: classBloodline?.name || "",
    classBloodlines: classBloodline
      ? [
          classBloodline.id,
          classBloodline.name,
          classBloodline.parentBloodlineId,
        ].filter(Boolean)
      : [],
  };
  const buffs = calculationBuffs();
  const commonOptions = {
    characterLevel: num("characterLevel"),
    classLevel,
    casterLevel: classLevel,
    classLevels: progressionClassCounts(),
  };
  const casterLevel = window.PFBuffs?.effectiveCasterLevel
    ? window.PFBuffs.effectiveCasterLevel(
        classLevel,
        buffs,
        context,
        "spell",
        commonOptions,
      )
    : { base: classLevel, total: classLevel, used: [], ignored: [], conditional: [] };
  const durationCasterLevel = window.PFBuffs?.effectiveCasterLevel
    ? window.PFBuffs.effectiveCasterLevel(
        classLevel,
        buffs,
        context,
        "duration",
        commonOptions,
      )
    : casterLevel;
  const rangeCasterLevel = window.PFBuffs?.effectiveCasterLevel
    ? window.PFBuffs.effectiveCasterLevel(
        classLevel,
        buffs,
        context,
        "range",
        commonOptions,
      )
    : casterLevel;
  const castingAbilityKey = normalizeAbilityKey(meta.ability);
  const castingAbilityName =
    {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
    }[castingAbilityKey] || "";
  const attributeBonuses =
    window.PFBuffs?.collectEffectiveAttributeBonuses && castingAbilityName
      ? window.PFBuffs.collectEffectiveAttributeBonuses(
          buffs,
          castingAbilityName,
          context,
          commonOptions,
        )
      : { total: 0, used: [], ignored: [], conditional: [] };
  const baseAbilityScore = castingAbilityKey
    ? Number(abilityDisplayValue(castingAbilityKey) || 0)
    : 10;
  const effectiveAbilityScore =
    baseAbilityScore + Number(attributeBonuses.total || 0);
  const effectiveAbilityMod = mod(effectiveAbilityScore);
  const baseDc = window.PFBuffs?.baseSpellDc
    ? window.PFBuffs.baseSpellDc(effectiveAbilityMod, spellLevel)
    : 10 + Number(spellLevel || 0) + effectiveAbilityMod;
  const spellDc = window.PFBuffs?.effectiveSpellDc
    ? window.PFBuffs.effectiveSpellDc(baseDc, buffs, context, commonOptions)
    : { base: baseDc, total: baseDc, used: [], ignored: [], conditional: [] };
  const spellDcWithAttributeBonuses =
    attributeBonuses.used?.length || attributeBonuses.ignored?.length
      ? {
          ...spellDc,
          used: [
            ...(attributeBonuses.used || []).map((entry) => ({
              ...entry,
              source: `${entry.source || "Effect"} (effective ${String(meta.ability || "").toUpperCase()})`,
            })),
            ...(spellDc.used || []),
          ],
          ignored: [
            ...(attributeBonuses.ignored || []).map((entry) => ({
              ...entry,
              source: `${entry.source || "Effect"} (effective ${String(meta.ability || "").toUpperCase()})`,
            })),
            ...(spellDc.ignored || []),
          ],
          conditional: [
            ...(attributeBonuses.conditional || []).map((entry) => ({
              ...entry,
              source: `${entry.source || "Effect"} (effective ${String(meta.ability || "").toUpperCase()})`,
            })),
            ...(spellDc.conditional || []),
          ],
        }
      : spellDc;
  const calculatedCasterLevel = Number(casterLevel.total ?? classLevel) || 1;
  const requestedCasterLevel =
    options.casterLevel === undefined || options.casterLevel === null
      ? calculatedCasterLevel
      : Number(options.casterLevel);
  const effectiveCasterLevel = Math.max(
    1,
    Number.isFinite(requestedCasterLevel)
      ? requestedCasterLevel
      : calculatedCasterLevel,
  );
  const withEffectiveCasterLevel = (result = {}) => {
    const base = Number(result.base || 0);
    if (effectiveCasterLevel === Number(result.total ?? base)) return result;
    const calculatedTotal = Number(result.total ?? base);
    return {
      ...result,
      total: effectiveCasterLevel,
      bonus: effectiveCasterLevel - base,
      calculatedTotal,
      calculatedBonus: calculatedTotal - base,
      miscCasterLevelBonus: Math.max(0, effectiveCasterLevel - calculatedCasterLevel),
      downcastBy: Math.max(0, calculatedCasterLevel - effectiveCasterLevel),
      downcastFrom: calculatedCasterLevel,
    };
  };
  const effectiveClResult = withEffectiveCasterLevel(casterLevel);
  const effectiveDurationClResult =
    withEffectiveCasterLevel(durationCasterLevel);
  const effectiveRangeClResult = withEffectiveCasterLevel(rangeCasterLevel);
  return {
    className,
    spellLevel,
    slotLevel,
    castingAbility: String(meta.ability || "").toUpperCase(),
    castingAbilityMod: effectiveAbilityMod,
    baseCastingAbilityScore: baseAbilityScore,
    effectiveCastingAbilityScore: effectiveAbilityScore,
    effectiveAttributeBonuses: attributeBonuses,
    calculatedCasterLevel,
    casterLevel: effectiveClResult,
    spellDc: spellDcWithAttributeBonuses,
    durationCasterLevel: effectiveDurationClResult,
    rangeCasterLevel: effectiveRangeClResult,
    calculatedDuration: scaledDurationText(
      spell.details?.duration,
      effectiveDurationClResult.total,
    ),
    calculatedRange: scaledRangeText(
      spell.details?.range,
      effectiveRangeClResult.total,
    ),
  };
}

function baselineSpellDetailCalculations(
  spell = {},
  className = "",
  slotLevel = 0,
  options = {},
) {
  const definition = classDefinitionByName(className);
  const definitionMeta = definition?.spellcasting || {};
  const meta = options.castingAbility
    ? { ...definitionMeta, ability: options.castingAbility }
    : definitionMeta;
  const classLevel = Math.max(
    1,
    Number(
      options.baseCasterLevel ?? (progressionClassCounts()[className] || 0),
    ) ||
      Number(num("characterLevel") || 1),
  );
  const spellLevel = Number.isFinite(Number(options.spellLevel))
    ? Number(options.spellLevel)
    : spellClassLevelForClass(spell, className) ?? slotLevel;
  const castingAbilityKey = normalizeAbilityKey(meta.ability);
  const baseAbilityScore = castingAbilityKey
    ? Number(abilityDisplayValue(castingAbilityKey) || 0)
    : 10;
  const castingAbilityMod = mod(baseAbilityScore);
  const baseDc = 10 + Number(spellLevel || 0) + castingAbilityMod;
  const calculatedCasterLevel = classLevel;
  const requestedCasterLevel =
    options.casterLevel === undefined || options.casterLevel === null
      ? calculatedCasterLevel
      : Number(options.casterLevel);
  const effectiveCasterLevel = Math.max(
    1,
    Number.isFinite(requestedCasterLevel)
      ? requestedCasterLevel
      : calculatedCasterLevel,
  );
  const casterLevel = {
    base: classLevel,
    total: effectiveCasterLevel,
    bonus: effectiveCasterLevel - classLevel,
    used: [],
    ignored: [],
    conditional: [],
    calculatedTotal: calculatedCasterLevel,
    calculatedBonus: 0,
    miscCasterLevelBonus: Math.max(0, effectiveCasterLevel - calculatedCasterLevel),
    ...(effectiveCasterLevel < calculatedCasterLevel
      ? {
          downcastBy: calculatedCasterLevel - effectiveCasterLevel,
          downcastFrom: calculatedCasterLevel,
        }
      : {}),
  };
  return {
    className,
    spellLevel,
    slotLevel,
    spellSource: options.spellSource || spellcastingSourceKind(className, meta),
    castingAbility: String(meta.ability || "").toUpperCase(),
    castingAbilityMod,
    baseCastingAbilityScore: baseAbilityScore,
    effectiveCastingAbilityScore: baseAbilityScore,
    effectiveAttributeBonuses: {
      total: 0,
      used: [],
      ignored: [],
      conditional: [],
    },
    calculatedCasterLevel,
    casterLevel,
    spellDc: {
      base: baseDc,
      total: baseDc,
      bonus: 0,
      used: [],
      ignored: [],
      conditional: [],
    },
    durationCasterLevel: casterLevel,
    rangeCasterLevel: casterLevel,
    calculatedDuration: scaledDurationText(
      spell.details?.duration,
      effectiveCasterLevel,
    ),
    calculatedRange: scaledRangeText(spell.details?.range, effectiveCasterLevel),
  };
}

function safeSpellDetailCalculations(
  spell = {},
  className = "",
  slotLevel = 0,
  options = {},
) {
  let calculations;
  try {
    calculations = spellDetailCalculations(spell, className, slotLevel, options);
  } catch (error) {
    console.error("Could not calculate spell details.", error);
    calculations = baselineSpellDetailCalculations(
      spell,
      className,
      slotLevel,
      options,
    );
  }
  const definition = classDefinitionByName(className);
  const magicType = spellcastingMagicType(
    className,
    definition?.spellcasting || {},
  );
  const armor = window.PFArmorRules?.arcaneSpellFailure?.({
    className,
    classLevel: progressionClassCounts()[className] || 0,
    magicType,
    sourceKind: calculations.spellSource || options.spellSource,
    components: spell.details?.components || spell.components || "",
    equipment: calculateGearAc().items,
  }) || { chance: 0, applies: false };
  return { ...calculations, arcaneSpellFailure: armor };
}

async function openSpellPicker(config = {}) {
  const picker = window.PFSpellPicker;
  if (!picker?.open) {
    setStatus("Spell picker is not available. Refresh the sheet and try again.", "danger");
    return null;
  }
  try {
    return await picker.open(config);
  } catch (error) {
    console.error("Could not open spell picker.", error);
    setStatus("Could not open the spell picker. Check the console for details.", "danger");
    return null;
  }
}

async function openSpellDetails(config = {}) {
  const picker = window.PFSpellPicker;
  if (!picker?.openDetails) {
    setStatus("Spell details modal is not available. Refresh the sheet and try again.", "danger");
    return null;
  }
  try {
    return await picker.openDetails(config);
  } catch (error) {
    console.error("Could not open spell details.", error);
    setStatus("Could not open spell details. Check the console for details.", "danger");
    return null;
  }
}

function currentSheetMapSlot() {
  const maxSlot = Number(PFApp.MAP_SLOT_COUNT || 6) || 6;
  const stored = Number(localStorage.getItem(`pf_map_slot_${sheetContextKey}`));
  return Math.max(1, Math.min(maxSlot, stored || 1));
}

function spellEffectPayloads(spell = {}) {
  const keys = window.PFEffectMechanics?.extraKeys?.() || [
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "bonusRanks",
    "extraRanksPerLevel",
    "featGrants",
    "sizeChanges",
    "spellLikeAbilities",
    "generatedEquipment",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "grantDomains",
    "conditionalVariables",
  ];
  const mechanics = window.PFEffectMechanics?.activeMechanics?.(spell, {
    activeOnly: true,
  }) || spell;
  const bonusRows = Array.isArray(mechanics.effects)
    ? mechanics.effects
    : Array.isArray(mechanics.bonuses)
      ? mechanics.bonuses
      : [];
  const targetKeys = keys.filter((key) => key !== "damageRolls");
  const hasInlineEffect = targetKeys.some(
    (key) => Array.isArray(mechanics[key]) && mechanics[key].length,
  );
  const hasBranches = window.PFEffectMechanics?.hasBranches?.(mechanics);
  if (!bonusRows.length && !hasInlineEffect && !hasBranches) return [];
  const payload = {
    name: spell.name || "Spell Effect",
    description: spell.details?.description || spell.description || "",
    bonuses: bonusRows,
    durationConfig: mechanics.durationConfig || spell.durationConfig || null,
    auraConfig: mechanics.auraConfig || spell.auraConfig || null,
    duration: spell.duration || spell.details?.duration || "",
    ...(window.PFEffectMechanics?.hasBranches?.(mechanics)
      ? { branches: mechanics.branches }
      : {}),
  };
  targetKeys.forEach((key) => {
    payload[key] = Array.isArray(mechanics[key]) ? mechanics[key] : [];
  });
  return [payload];
}

function spellDamageRolls(spell = {}) {
  const mechanics = window.PFEffectMechanics?.activeMechanics?.(spell, {
    activeOnly: true,
  }) || spell;
  return window.PFDamageRolls?.normalizeRolls?.(mechanics.damageRolls || []) || [];
}

async function recordSpellDamageTimeline(spell = {}, results = []) {
  if (!results.length || !window.PFDamageRolls) return;
  await spellCastTargetsFromCurrentMap();
  const actor = el("characterName")?.value?.trim() || (isEnemySheetMode ? "Enemy" : "Character");
  const text = `${actor} casts ${spell.name || "a spell"}: ${window.PFDamageRolls.summary(results)}.`;
  if (!Array.isArray(spellCastTargetMapState.timeline))
    spellCastTargetMapState.timeline = [];
  spellCastTargetMapState.timeline.push({
    id: globalThis.crypto?.randomUUID?.() || `spell-damage-${Date.now()}`,
    text,
    time: new Date().toLocaleString(),
  });
  spellCastTargetMapState.timeline = spellCastTargetMapState.timeline.slice(-20);
  await PFApp.saveMapState?.(
    spellCastTargetMapState,
    sheetContextKey,
    spellCastTargetMapSlot,
  );
}

async function rollSpellDamageFromDetails(
  spell = {},
  casterLevel = 1,
  authoredRolls = null,
) {
  const damageRolls = authoredRolls
    ? window.PFDamageRolls?.normalizeRolls?.(authoredRolls) || []
    : spellDamageRolls(spell);
  if (!damageRolls.length) return [];
  const context = {
    ...currentAttributeScaleContext(),
    casterLevel,
    classLevel: casterLevel,
  };
  const results = await window.PFDamageRolls?.open?.({
    title: `${spell.name || "Spell"} Damage`,
    rolls: damageRolls,
    context,
  });
  if (results) await recordSpellDamageTimeline(spell, results);
  return results;
}

function spellCastDurationLabel(effect = {}) {
  if (window.PFEffectMeta?.durationLabel)
    return window.PFEffectMeta.durationLabel(effect);
  return effect.duration || "variable";
}

function spellCastDurationUsesCasterLevel(effect = {}) {
  const config = window.PFEffectMeta?.normalizeDurationConfig?.(effect);
  if (config)
    return (
      (config.factors || []).some((factor) => factor.type === "caster") ||
      config.durationScale?.source?.type === "caster"
    );
  return /\/\s*level|per\s+level/i.test(String(effect.duration || ""));
}

function spellCastParseDuration(
  effect = {},
  casterLevel = 1,
  targetCount = 1,
) {
  if (window.PFEffectMeta?.parseDuration)
    return window.PFEffectMeta.parseDuration(effect, {
      casterLevel,
      characterLevel: num("characterLevel"),
      classLevel: casterLevel,
      classLevels: progressionClassCounts(),
      targetCount,
    });
  return null;
}

function spellCastFormatDuration(rounds) {
  if (rounds === null || rounds === undefined) return "variable";
  if (rounds === 1) return "1 turn";
  if (rounds % 600 === 0)
    return `${rounds / 600} hour${rounds === 600 ? "" : "s"}`;
  if (rounds % 10 === 0)
    return `${rounds / 10} minute${rounds === 10 ? "" : "s"}`;
  return `${rounds} round${rounds === 1 ? "" : "s"}`;
}

async function resolveSpellCastEffectChoices(
  effect = {},
  spell = {},
  { resolveBranch = true } = {},
) {
  if (resolveBranch) {
    effect = await resolveMechanicBranchChoice(
      effect,
      spell.name || effect.name || "Spell",
    );
    if (!effect) return null;
  }
  const resolvedGrantDomains = await resolveRacialTraitGrantDomainChoices(
    effect.grantDomains,
    { name: spell.name || effect.name || "Spell" },
  );
  if (!resolvedGrantDomains) return null;
  const resolvedCasterLevelBonuses =
    await resolveRacialTraitSpellAdjustmentChoices(effect.casterLevelBonuses, {
      name: spell.name || effect.name || "Spell",
    });
  if (!resolvedCasterLevelBonuses) return null;
  const resolvedSpellDcBonuses = await resolveRacialTraitSpellAdjustmentChoices(
    effect.spellDcBonuses,
    { name: spell.name || effect.name || "Spell" },
  );
  if (!resolvedSpellDcBonuses) return null;
  const resolvedEffectiveAttributeBonuses =
    await resolveRacialTraitSpellAdjustmentChoices(
      effect.effectiveAttributeBonuses,
      { name: spell.name || effect.name || "Spell" },
    );
  if (!resolvedEffectiveAttributeBonuses) return null;
  return {
    ...effect,
    grantDomains: resolvedGrantDomains,
    casterLevelBonuses: resolvedCasterLevelBonuses,
    spellDcBonuses: resolvedSpellDcBonuses,
    effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses,
  };
}

function spellDurationConfigFromText(duration = "") {
  const text = String(duration || "").toLowerCase();
  const match = text.match(
    /(\d+)?\s*(rounds?|minutes?|mins?\.?|hours?|days?)\s*(?:\/|per)\s*(?:caster\s*)?levels?/i,
  );
  if (!match) return null;
  const rawUnit = String(match[2] || "").toLowerCase();
  const unit = /^min/.test(rawUnit)
    ? "minute"
    : /^hour/.test(rawUnit)
      ? "hour"
      : /^day/.test(rawUnit)
        ? "day"
        : "round";
  return {
    count: Math.max(1, Number(match[1] || 1) || 1),
    unit,
    factors: [{ type: "caster" }],
    factorMode: "multiply",
  };
}

function appliedSpellEffect(
  effect = {},
  spell = {},
  casterLevel = 1,
  index = 0,
  targetCount = 1,
) {
  const cloned =
    window.PFEffectMechanics?.resolveCasterAttributeScales?.(
      effect,
      currentAttributeScaleContext(),
    ) || cloneJson(effect);
  const hasOwnDuration =
    cloned.durationConfig ||
    cloned.duration;
  if (!hasOwnDuration && spell.details?.duration) {
    const durationConfig = spellDurationConfigFromText(spell.details.duration);
    if (durationConfig) cloned.durationConfig = durationConfig;
    else cloned.duration = spell.details.duration;
  }
  const baseDurationLabel = spellCastDurationLabel(cloned);
  const computedDuration = spellCastParseDuration(
    cloned,
    casterLevel,
    targetCount,
  );
  const splitAmongTargets = Boolean(
    window.PFEffectMeta?.normalizeDurationConfig?.(cloned)?.splitAmongTargets &&
      targetCount > 1,
  );
  const computedDurationLabel = splitAmongTargets
    ? `${targetCount} targets: ${spellCastFormatDuration(computedDuration)} each`
    : spellCastFormatDuration(computedDuration);
  const appliedDurationLabel =
    computedDuration === null || computedDuration === undefined
      ? baseDurationLabel
      : spellCastDurationUsesCasterLevel(cloned)
        ? `${baseDurationLabel} | CL ${casterLevel}: ${computedDurationLabel}`
        : `${baseDurationLabel} | ${computedDurationLabel}`;
  return {
    ...cloned,
    id:
      cloned.id ||
      `spell:${String(spell.name || "spell")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}:${index}`,
    name: cloned.name || spell.name || "Spell Effect",
    source: cloned.source || `Spell: ${spell.name || "Spell"}`,
    category: cloned.category || "Spell",
    sourceSpellName: spell.name || "",
    casterLevel,
    permanent: Boolean(cloned.permanent),
    remaining: cloned.permanent ? null : computedDuration,
    computedDuration,
    durationTargetCount: splitAmongTargets ? targetCount : undefined,
    durationLabel: splitAmongTargets
      ? appliedDurationLabel
      : cloned.durationLabel || appliedDurationLabel,
  };
}

function ensureSpellCastTargetModal() {
  if (document.getElementById("spellCastTargetModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal fade" id="spellCastTargetModal" tabindex="-1" aria-labelledby="spellCastTargetModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title" id="spellCastTargetModalLabel">Choose Targets</h5>
          </div>
          <div class="modal-body">
            <div id="spellCastTargetHint" class="small text-secondary mb-3"></div>
            <div id="spellCastTargetList" class="spell-cast-target-list"></div>
          </div>
          <div class="modal-footer border-secondary">
            <span id="spellCastTargetStatus" class="small text-secondary me-auto"></span>
            <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button id="confirmSpellCastTargets" class="btn btn-success btn-sm" type="button">Cast</button>
          </div>
        </div>
      </div>
    </div>
  `,
  );
  const modalEl = document.getElementById("spellCastTargetModal");
  modalEl.addEventListener("hidden.bs.modal", () => {
    if (spellCastTargetResolver) {
      spellCastTargetResolver(null);
      spellCastTargetResolver = null;
    }
  });
  document
    .getElementById("confirmSpellCastTargets")
    .addEventListener("click", () => {
      const selected = [
        ...document.querySelectorAll("[data-spell-cast-target]:checked"),
      ].map((input) => input.value);
      if (!selected.length) {
        document.getElementById("spellCastTargetStatus").textContent =
          "Select at least one target.";
        return;
      }
      const next = spellCastTargetResolver;
      spellCastTargetResolver = null;
      modalEl.addEventListener(
        "hidden.bs.modal",
        () => next?.(selected),
        { once: true },
      );
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    });
  modalEl.addEventListener("change", (event) => {
    const group = event.target.closest("[data-spell-cast-group]");
    if (group) {
      const groupName = group.getAttribute("data-spell-cast-group");
      modalEl
        .querySelectorAll(`[data-spell-cast-target-group="${groupName}"]`)
        .forEach((input) => {
          input.checked = group.checked;
        });
      return;
    }
    const target = event.target.closest("[data-spell-cast-target]");
    if (!target) return;
    ["ally", "enemy"].forEach((groupName) => {
      const targets = [
        ...modalEl.querySelectorAll(
          `[data-spell-cast-target-group="${groupName}"]`,
        ),
      ];
      const toggle = modalEl.querySelector(
        `[data-spell-cast-group="${groupName}"]`,
      );
      if (!toggle || !targets.length) return;
      toggle.checked = targets.every((input) => input.checked);
      toggle.indeterminate =
        !toggle.checked && targets.some((input) => input.checked);
    });
  });
}

function spellCastTokenName(token = {}, characterMap = new Map(), enemyMap = new Map()) {
  if (token.kind === "character") {
    const character = characterMap.get(token.characterId);
    return (
      character?.name ||
      character?.character_name ||
      character?.sheet?.fields?.characterName ||
      token.name ||
      "Character"
    );
  }
  if (token.kind === "enemy") {
    const enemy = enemyMap.get(token.enemyId);
    return (
      enemy?.name ||
      enemy?.sheet?.fields?.characterName ||
      token.sheet?.fields?.characterName ||
      token.name ||
      "Enemy"
    );
  }
  return token.name || "Token";
}

function renderSpellCastTargetGroup(label, group, targets = []) {
  if (!targets.length) return "";
  return `
    <section class="spell-cast-target-group">
      <label class="spell-cast-target-group-toggle">
        <input class="form-check-input" type="checkbox" data-spell-cast-group="${escapeHtml(group)}">
        <span>${escapeHtml(label)}</span>
      </label>
      <div class="spell-cast-target-grid">
        ${targets
          .map(
            (target) => `
          <label class="spell-cast-target-card">
            <input class="form-check-input" type="checkbox" value="${escapeHtml(target.key)}" data-spell-cast-target data-spell-cast-target-group="${escapeHtml(group)}">
            <span>
              <strong>${escapeHtml(target.name)}</strong>
              <span class="small text-secondary d-block">${escapeHtml(target.subtitle)}</span>
            </span>
          </label>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

async function spellCastTargetsFromCurrentMap() {
  const mapSlot = currentSheetMapSlot();
  const [mapState, characters, enemies, isGm] = await Promise.all([
    PFApp.loadMapState?.(sheetContextKey, mapSlot),
    PFApp.loadContextCharacters?.(sheetContextKey),
    PFApp.loadEnemies?.(sheetContextKey),
    PFApp.isGameManager?.(sheetContextKey),
  ]);
  spellCastTargetMapState = mapState || { tokens: [] };
  spellCastTargetMapSlot = mapSlot;
  const characterMap = new Map(
    (characters || []).map((character) => [character.id, character]),
  );
  const enemyMap = new Map((enemies || []).map((enemy) => [enemy.id, enemy]));
  const canSeeHiddenEnemies = Boolean(isGm || currentUserIsAdmin);
  const entries = (spellCastTargetMapState.tokens || [])
    .filter((token) => token.kind === "character" || token.kind === "enemy")
    .filter((token) => token.kind !== "enemy" || token.visible !== false || canSeeHiddenEnemies)
    .map((token) => ({
      key: token.id,
      token,
      group: token.kind === "enemy" ? "enemy" : "ally",
      name: spellCastTokenName(token, characterMap, enemyMap),
      subtitle:
        token.kind === "enemy"
          ? `Enemy${token.visible === false ? " | hidden" : ""}`
          : "Character",
      targetId: token.kind === "enemy" ? token.enemyId : token.characterId,
      ownerId:
        token.kind === "character"
          ? characterMap.get(token.characterId)?.userId || ""
          : "",
    }))
    .filter((entry) => entry.targetId)
    .sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

async function openSpellCastTargetModal(spell = {}) {
  ensureSpellCastTargetModal();
  const targets = await spellCastTargetsFromCurrentMap();
  document.getElementById("spellCastTargetModalLabel").textContent =
    `Cast ${spell.name || "Spell"}`;
  document.getElementById("spellCastTargetHint").textContent =
    "Choose one or more tokens on the current map.";
  document.getElementById("spellCastTargetStatus").textContent = "";
  document.getElementById("spellCastTargetList").innerHTML = targets.length
    ? [
        renderSpellCastTargetGroup(
          "Allies",
          "ally",
          targets.filter((target) => target.group === "ally"),
        ),
        renderSpellCastTargetGroup(
          "Enemies",
          "enemy",
          targets.filter((target) => target.group === "enemy"),
        ),
      ].join("")
    : `<div class="small text-secondary">No valid targets on the current map.</div>`;
  const modalEl = document.getElementById("spellCastTargetModal");
  spellCastTargetModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  spellCastTargetModal.show();
  return new Promise((resolve) => {
    spellCastTargetResolver = (selectedIds) =>
      resolve(
        selectedIds
          ? targets.filter((target) => selectedIds.includes(target.key))
          : null,
      );
  });
}

function waitForSpellCastBridge(frame) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      try {
        const bridge = frame.contentWindow?.PFCharacterSheetBridge;
        if (
          bridge?.recalculateAndSaveCharacter &&
          bridge?.recalculateAndSaveEnemy
        ) {
          clearInterval(timer);
          resolve(bridge);
        } else if (Date.now() - started > 15000) {
          clearInterval(timer);
          reject(new Error("Character sheet bridge did not initialize."));
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, 100);
  });
}

async function spellCastRecalculationBridge() {
  if (spellCastBridgePromise) return spellCastBridgePromise;
  spellCastBridgePromise = new Promise((resolve, reject) => {
    spellCastBridgeFrame = document.createElement("iframe");
    spellCastBridgeFrame.src = "character-sheet.html?bridge=1&v=spell-cast-targets-1";
    spellCastBridgeFrame.tabIndex = -1;
    spellCastBridgeFrame.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;";
    spellCastBridgeFrame.addEventListener(
      "load",
      () => {
        waitForSpellCastBridge(spellCastBridgeFrame)
          .then(resolve)
          .catch(reject);
      },
      { once: true },
    );
    document.body.appendChild(spellCastBridgeFrame);
  }).catch((error) => {
    spellCastBridgePromise = null;
    throw error;
  });
  return spellCastBridgePromise;
}

async function recalculateSpellCastTarget(target) {
  try {
    const bridge = await spellCastRecalculationBridge();
    if (target.group === "ally")
      return await bridge.recalculateAndSaveCharacter(
        sheetContextKey,
        target.targetId,
      );
    return await bridge.recalculateAndSaveEnemy(sheetContextKey, target.targetId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function refreshSpellCastTargetOnMap(target) {
  const token = target?.token;
  if (!token) return;
  if (target.group === "ally") {
    localStorage.setItem(`pf_buffs_updated_${sheetContextKey}`, String(Date.now()));
    localStorage.setItem(
      `pf_buffs_updated_${sheetContextKey}_${target.targetId}`,
      String(Date.now()),
    );
    await recalculateSpellCastTarget(target);
    const saved = await PFApp.loadCharacterSheet("", sheetContextKey, target.targetId);
    const sheet = saved?.sheet || {};
    if (sheet.fields || sheet.calculated) {
      token.name = saved.character_name || sheet.fields?.characterName || token.name;
      const currentHp = sheet.calculated?.hp?.current || sheet.fields?.currentHitPoints || "";
      const totalHp =
        sheet.calculated?.hp?.total ||
        sheet.fields?.hitPointsTotal ||
        sheet.fields?.hitPoints ||
        "";
      if (currentHp || totalHp) token.hp = `${currentHp || "?"}/${totalHp || "?"}`;
      token.ac = sheet.calculated?.armorClass?.ac || sheet.fields?.acTotal || token.ac;
    }
    return;
  }
  await recalculateSpellCastTarget(target);
  const saved =
    (await PFApp.loadEnemyForEffectApplication?.(target.targetId, sheetContextKey)) ||
    (await PFApp.loadEnemy?.(target.targetId, sheetContextKey));
  const enemy = saved || {};
  token.name = enemy.name || token.name;
  if (enemy.sheet) token.sheet = cloneJson(enemy.sheet);
  const sheet = enemy.sheet || token.sheet || {};
  const currentHp = sheet.calculated?.hp?.current || sheet.fields?.currentHitPoints || "";
  const totalHp =
    sheet.calculated?.hp?.total ||
    sheet.fields?.hitPointsTotal ||
    sheet.fields?.hitPoints ||
    "";
  if (currentHp || totalHp) token.hp = `${currentHp || "?"}/${totalHp || "?"}`;
  token.ac = sheet.calculated?.armorClass?.ac || sheet.fields?.acTotal || token.ac;
  localStorage.setItem(
    `pf_enemy_sheet_updated_${sheetContextKey}_${target.targetId}`,
    String(Date.now()),
  );
}

async function resolveSpellCastEffectForTarget(target, effect, spell) {
  const branchNeeded =
    window.PFEffectMechanics?.hasBranches?.(effect) || false;
  const remoteCharacter =
    target.group === "ally" &&
    target.ownerId &&
    target.ownerId !== currentUserId;
  if (branchNeeded && remoteCharacter) {
    const result = await PFApp.createEffectChoiceRequest?.({
      contextKey: sheetContextKey,
      characterId: target.targetId,
      ability: effect,
    });
    if (!result?.ok) console.error(result?.error || "Could not queue effect choice.");
    return { effect: null, queued: Boolean(result?.ok) };
  }
  const resolved = await resolveSpellCastEffectChoices(effect, spell);
  return { effect: resolved, queued: false };
}

async function applySpellEffectToTarget(target, effect) {
  if (target.group === "ally") {
    if (!PFApp.applyCharacterMapEffect) return false;
    const result = await PFApp.applyCharacterMapEffect?.(
      target.targetId,
      effect,
      sheetContextKey,
    );
    if (result?.ok === false) {
      console.error(result.error);
      return false;
    }
    return true;
  }
  if (!PFApp.applyEnemyMapEffect) return false;
  const saved = await PFApp.applyEnemyMapEffect?.(
    target.targetId,
    effect,
    sheetContextKey,
  );
  return Boolean(saved);
}

function spellAuraRecord(sourceToken = {}, effect = {}) {
  const config = effect.auraConfig || {};
  const auraEffect = cloneJson(effect);
  delete auraEffect.auraConfig;
  return {
    id: `spell-aura-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind: "active",
    visible: true,
    radius: Math.max(1, Math.ceil(Number(config.rangeFeet || 5) / 5)),
    rangeFeet: Math.max(5, Number(config.rangeFeet || 5)),
    color: sourceToken.kind === "enemy" ? "#b02a37" : "#8fd19e",
    effect: auraEffect,
    removeWhenOutOfRange: true,
    permanent: Boolean(effect.permanent),
    remaining: effect.remaining ?? null,
    durationAnchorTokenId: sourceToken.id,
  };
}

async function createAuraOnCurrentMap(effect) {
  await spellCastTargetsFromCurrentMap();
  const sourceToken = (spellCastTargetMapState?.tokens || []).find((token) =>
    isEnemySheetMode
      ? token.kind === "enemy" && String(token.enemyId) === String(enemySheetId)
      : token.kind === "character" && String(token.characterId) === String(currentSheetId),
  );
  if (!sourceToken) return false;
  const current = Array.isArray(sourceToken.automaticAuras)
    ? sourceToken.automaticAuras
    : [];
  sourceToken.automaticAuras = [
    ...current,
    spellAuraRecord(sourceToken, effect),
  ];
  return Boolean(
    await PFApp.saveMapState?.(
      spellCastTargetMapState,
      sheetContextKey,
      spellCastTargetMapSlot,
    ),
  );
}

async function createSpellAurasOnCurrentMap(spell, payloads, casterLevel) {
  await spellCastTargetsFromCurrentMap();
  const sourceToken = (spellCastTargetMapState?.tokens || []).find((token) =>
    isEnemySheetMode
      ? token.kind === "enemy" && String(token.enemyId) === String(enemySheetId)
      : token.kind === "character" && String(token.characterId) === String(currentSheetId),
  );
  if (!sourceToken) return false;
  const current = Array.isArray(sourceToken.automaticAuras)
    ? sourceToken.automaticAuras
    : [];
  const additions = payloads.map((payload, index) =>
    spellAuraRecord(
      sourceToken,
      appliedSpellEffect(payload, spell, casterLevel, index),
    ),
  );
  sourceToken.automaticAuras = [...current, ...additions];
  return Boolean(
    await PFApp.saveMapState?.(
      spellCastTargetMapState,
      sheetContextKey,
      spellCastTargetMapSlot,
    ),
  );
}

async function castSpellFromDetails({
  spell,
  casterLevel = 1,
  calculations = null,
  closeDetails,
} = {}) {
  const effectPayloads = spellEffectPayloads(spell);
  let damageRolls = spellDamageRolls(spell);
  if (!effectPayloads.length && !damageRolls.length)
    return {
      close: false,
      message: `${spell?.name || "This spell"} has no configured effects or damage.`,
    };
  const failureChance = Number(
    calculations?.arcaneSpellFailure?.chance || 0,
  );
  if (failureChance > 0) {
    closeDetails?.();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const castContinues = await window.PFArcaneSpellFailure?.check?.({
      chance: failureChance,
      spellName: spell?.name || "Spell",
    });
    if (!castContinues) return { close: true };
  }
  let resolvedPayloads = [];
  for (const payload of effectPayloads) {
    if (window.PFEffectMechanics?.hasBranches?.(payload)) {
      resolvedPayloads.push(payload);
      continue;
    }
    const resolved = await resolveSpellCastEffectChoices(payload, spell);
    if (!resolved) return { close: false };
    resolvedPayloads.push(resolved);
  }
  damageRolls = [
    ...damageRolls,
    ...resolvedPayloads.flatMap((payload) =>
      window.PFEffectMechanics?.hasBranches?.(payload)
        ? []
        : Array.isArray(payload.damageRolls)
          ? payload.damageRolls
          : [],
    ),
  ];
  resolvedPayloads = resolvedPayloads
    .map((payload) => {
      if (window.PFEffectMechanics?.hasBranches?.(payload)) return payload;
      const { damageRolls: _damageRolls, ...effectPayload } = payload;
      return effectPayload;
    })
    .filter(
      (payload) =>
        payload.auraConfig?.enabled ||
        window.PFEffectMechanics?.hasBranches?.(payload) ||
        window.PFEffectMechanics?.hasAnyMechanics?.(payload),
    );
  if (!failureChance) {
    closeDetails?.();
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  if (damageRolls.length) {
    const damageResults = await rollSpellDamageFromDetails(
      spell,
      casterLevel,
      damageRolls,
    );
    if (!damageResults) return { close: true };
    if (!resolvedPayloads.length) {
      setStatus(`${spell.name || "Spell"} damage rolled.`, "success");
      return { close: true };
    }
  }
  const auraPayloads = resolvedPayloads.filter(
    (payload) => payload.auraConfig?.enabled,
  );
  if (auraPayloads.length) {
    const created = await createSpellAurasOnCurrentMap(
      spell,
      auraPayloads,
      casterLevel,
    );
    if (!created) {
      setStatus(
        `Place ${isEnemySheetMode ? "this enemy" : "this character"} on the current map before casting an aura.`,
        "warning",
      );
      return { close: true };
    }
    resolvedPayloads = resolvedPayloads.filter(
      (payload) => !payload.auraConfig?.enabled,
    );
    if (!resolvedPayloads.length) {
      setStatus(`${spell.name || "Spell"} aura activated.`, "success");
      return { close: true };
    }
  }
  const targets = await openSpellCastTargetModal(spell);
  if (!targets) return { close: true };
  let appliedCount = 0;
  let queuedCount = 0;
  const locallyAppliedTargets = new Set();
  for (const target of targets) {
    for (let index = 0; index < resolvedPayloads.length; index += 1) {
      const unresolvedEffect = appliedSpellEffect(
        resolvedPayloads[index],
        spell,
        casterLevel,
        index,
        targets.length,
      );
      const { effect: resolvedEffect, queued } =
        await resolveSpellCastEffectForTarget(target, unresolvedEffect, spell);
      if (queued) {
        queuedCount += 1;
        continue;
      }
      if (!resolvedEffect) continue;
      const branchDamageRolls = Array.isArray(resolvedEffect.damageRolls)
        ? resolvedEffect.damageRolls
        : [];
      if (branchDamageRolls.length) {
        const damageResults = await rollSpellDamageFromDetails(
          spell,
          casterLevel,
          branchDamageRolls,
        );
        if (!damageResults) continue;
      }
      const { damageRolls: _damageRolls, ...effect } = resolvedEffect;
      if (!window.PFEffectMechanics?.hasAnyMechanics?.(effect)) continue;
      if (await applySpellEffectToTarget(target, effect)) {
        appliedCount += 1;
        locallyAppliedTargets.add(target.key);
      }
    }
    if (locallyAppliedTargets.has(target.key))
      await refreshSpellCastTargetOnMap(target);
  }
  if (spellCastTargetMapState?.tokens && PFApp.saveMapState)
    await PFApp.saveMapState(
      spellCastTargetMapState,
      sheetContextKey,
      spellCastTargetMapSlot,
    );
  const targetedCurrentCharacter =
    !isEnemySheetMode &&
    currentSheetId &&
    targets.some(
      (target) =>
        target.group === "ally" && String(target.targetId) === String(currentSheetId),
    );
  const targetedCurrentEnemy =
    isEnemySheetMode &&
    enemySheetId &&
    targets.some(
      (target) =>
        target.group === "enemy" && String(target.targetId) === String(enemySheetId),
    );
  if (targetedCurrentCharacter) {
    await loadActiveBuffs(currentSheetId);
    await effectTrackerInstance?.refresh?.();
    recalculateSheet();
  } else if (targetedCurrentEnemy) {
    await loadEnemySheet(enemySheetId);
  }
  const completedCount = appliedCount + queuedCount;
  setStatus(
    completedCount
      ? queuedCount
        ? `${spell.name || "Spell"} applied locally; ${queuedCount} choice${queuedCount === 1 ? "" : "s"} sent to the selected player${queuedCount === 1 ? "" : "s"}.`
        : `${spell.name || "Spell"} applied to ${targets.length} target${targets.length === 1 ? "" : "s"}.`
      : `Could not apply ${spell.name || "spell"}.`,
    completedCount ? "success" : "warning",
  );
  return { close: true };
}
function spellExtraSlots(className, bucket, spellLevel) {
  const key = spellcastingStateKey(className);
  return Number(
    characterSpells?.[key]?.extraSlots?.[bucket]?.[spellLevel] || 0,
  );
}

function addSpellExtraSlot(className, bucket, spellLevel) {
  const key = spellcastingStateKey(className);
  if (!characterSpells[key]) characterSpells[key] = {};
  if (!characterSpells[key].extraSlots) characterSpells[key].extraSlots = {};
  if (!characterSpells[key].extraSlots[bucket])
    characterSpells[key].extraSlots[bucket] = {};
  characterSpells[key].extraSlots[bucket][spellLevel] =
    spellExtraSlots(className, bucket, spellLevel) + 1;
}

function removeSpellExtraSlot(
  className,
  bucket,
  spellLevel,
  baseCount = 0,
  bonusCount = 0,
) {
  const key = spellcastingStateKey(className);
  const current = spellExtraSlots(className, bucket, spellLevel);
  if (!current || !characterSpells[key]?.extraSlots?.[bucket]) return;
  const nextExtra = current - 1;
  characterSpells[key].extraSlots[bucket][spellLevel] = nextExtra;
  const maxSlots =
    Math.max(0, Number(baseCount || 0)) +
    Math.max(0, Number(bonusCount || 0)) +
    nextExtra;
  const nextSpells = spellStateValue(className, bucket, spellLevel).slice(
    0,
    maxSlots,
  );
  setSpellStateValue(className, bucket, spellLevel, nextSpells, {
    unique: bucket === "book",
  });
}

function renderSpellKnownList(className, bucket, spellLevel, options = {}) {
  const spells = spellStateValue(className, bucket, spellLevel);
  return `
    <div class="spell-bucket${options.mobileActive ? " is-mobile-active" : ""}" data-spell-mobile-panel="${escapeHtml(bucket)}">
      <div class="spell-bucket-title">${escapeHtml(spellBucketLabel(bucket))}</div>
      <div class="spell-action-stack">
        ${
          spells
            .map(
              (spell) => `
          <div class="spell-selection-row">
            <button class="btn btn-outline-info btn-sm" type="button" data-edit-known-spell="${escapeHtml(spell)}" data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}" title="${escapeHtml(spell)}">${escapeHtml(spell)}</button>
            <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-remove-spell="${escapeHtml(spell)}" data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}" aria-label="Remove ${escapeHtml(spell)}"><i class="bi bi-trash"></i></button>
          </div>
        `,
            )
            .join("") || `<span class="small-text">None selected</span>`
        }
        <button class="btn btn-outline-info btn-sm" type="button" data-add-spell data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}">
          <i class="bi bi-plus-lg"></i> Add Spell
        </button>
      </div>
    </div>
  `;
}

function renderSpellSlotButtons(
  className,
  bucket,
  spellLevel,
  baseCount,
  bonusCount = 0,
  options = {},
) {
  const sourceBucket = options.sourceBucket || "";
  const sourceValuesByLevel = sourceBucket
    ? Array.from({ length: 10 }, (_, level) =>
        spellStateValue(className, sourceBucket, level),
      )
    : [];
  const sourceCount = sourceBucket
    ? sourceValuesByLevel[spellLevel]?.length || 0
    : 0;
  const sourceHasEligible = sourceBucket
    ? sourceValuesByLevel
        .slice(0, Math.max(0, Number(spellLevel || 0)) + 1)
        .some((spellsAtLevel) => spellsAtLevel.length)
    : true;
  const extraCount = spellExtraSlots(className, bucket, spellLevel);
  const total =
    Math.max(0, Number(baseCount || 0)) +
    Math.max(0, Number(bonusCount || 0)) +
    extraCount;
  const spells = spellStateValue(className, bucket, spellLevel);
  const extraLabel = options.extraLabel || "Extra Slot";
  const removeExtraLabel = options.removeExtraLabel || "Remove Extra Slot";
  return `
    <div class="spell-bucket${options.mobileActive ? " is-mobile-active" : ""}" data-spell-mobile-panel="${escapeHtml(bucket)}">
      <div class="spell-bucket-title">${escapeHtml(spellBucketLabel(bucket))}</div>
      ${options.usageText ? `<div class="spell-casts-note">${escapeHtml(options.usageText)}</div>` : ""}
      <div class="spell-action-stack">
        ${
          Array.from({ length: total }, (_, index) => {
            const name = spells[index] || "Choose Spell";
            const hasSpell = Boolean(spells[index]);
            const bonus =
              index >= Number(baseCount || 0) &&
              index < Number(baseCount || 0) + Number(bonusCount || 0);
            const extra =
              index >= Number(baseCount || 0) + Number(bonusCount || 0);
            const disabled = sourceBucket && !hasSpell && !sourceHasEligible;
            const button = `<button class="btn btn-outline-info btn-sm spell-slot-button${bonus ? " bonus-slot" : ""}${extra ? " extra-slot" : ""}" type="button" data-pick-spell-slot="${index}" data-spell-current-name="${escapeHtml(spells[index] || "")}" data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}" data-spell-source-bucket="${escapeHtml(sourceBucket)}" title="${escapeHtml(name)}" ${disabled ? "disabled" : ""}>${escapeHtml(name)}</button>`;
            if (!spells[index]) return button;
            return `
            <div class="spell-selection-row">
              ${button}
              <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-clear-spell-slot="${index}" data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}" aria-label="Clear ${escapeHtml(spells[index])}"><i class="bi bi-trash"></i></button>
            </div>
          `;
          }).join("") ||
          `<span class="small-text">No slots at this level.</span>`
        }
        <button class="btn btn-outline-warning btn-sm" type="button" data-add-extra-spell-slot data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}">
          <i class="bi bi-plus-lg"></i> ${escapeHtml(extraLabel)}
        </button>
        ${
          extraCount
            ? `
          <button class="btn btn-outline-danger btn-sm" type="button" data-remove-extra-spell-slot data-spell-class-name="${escapeHtml(className)}" data-spell-bucket="${escapeHtml(bucket)}" data-spell-level="${spellLevel}" data-spell-base-count="${Number(baseCount || 0)}" data-spell-bonus-count="${Number(bonusCount || 0)}">
            <i class="bi bi-dash-lg"></i> ${escapeHtml(removeExtraLabel)}
          </button>
        `
            : ""
        }
      </div>
      ${sourceBucket && !sourceHasEligible ? `<div class="small-text">Add known spells at this level or lower before preparing them.</div>` : ""}
    </div>
  `;
}

function spontaneousCastsPerDayText(spellLevel, base, bonus) {
  if (Number(spellLevel || 0) === 0) return "Casts/day: at will";
  const baseCount = Math.max(0, Number(base || 0));
  const bonusCount = Math.max(0, Number(bonus || 0));
  const total = baseCount + bonusCount;
  return bonusCount
    ? `Casts/day: ${total} (${baseCount} base + ${bonusCount} bonus)`
    : `Casts/day: ${total}`;
}

function renderSpellbookBuckets(
  className,
  spellLevel,
  base,
  bonus,
  options = {},
) {
  const tabGroup = `${spellcastingStateKey(className)}_${spellLevel}`;
  const activePanel = spellMobilePanels[tabGroup] || "book";
  return `
    <div class="spell-dual-buckets" data-spell-mobile-group="${escapeHtml(tabGroup)}">
      <div class="spell-mobile-tabs" role="group" aria-label="${escapeHtml(className)} level ${spellLevel} spells">
        <button class="spell-mobile-tab${activePanel === "book" ? " active" : ""}" type="button" data-spell-mobile-tab="book" data-spell-mobile-group="${escapeHtml(tabGroup)}">Known</button>
        <button class="spell-mobile-tab${activePanel === "prepared" ? " active" : ""}" type="button" data-spell-mobile-tab="prepared" data-spell-mobile-group="${escapeHtml(tabGroup)}">Prepared</button>
      </div>
      ${renderSpellKnownList(className, "book", spellLevel, { mobileActive: activePanel === "book" })}
      ${renderSpellSlotButtons(className, "prepared", spellLevel, base, bonus, { mobileActive: activePanel === "prepared", sourceBucket: "book", usageText: options.usageText || "" })}
    </div>
  `;
}

function renderSpellRows(className, meta, classLevel, mode) {
  const maxLevel = Number(meta.maxSpellLevel ?? 9);
  const abilityMod = spellAbilityMod(meta.ability);
  const hasZeroLevelSpells = ZERO_LEVEL_SPELL_CLASSES.has(
    String(className || "").toLowerCase(),
  );
  const rows = [];
  for (let spellLevel = 0; spellLevel <= maxLevel; spellLevel += 1) {
    const base = spellcastingRowValue(
      meta.slotsByLevel,
      classLevel,
      spellLevel,
    );
    const preparedBase = spellcastingRowValue(
      meta.preparedByLevel,
      classLevel,
      spellLevel,
    );
    const knownLimit = spellcastingRowValue(
      meta.knownByLevel,
      classLevel,
      spellLevel,
    );
    const bonus = bonusSlotsForSpellLevel(abilityMod, spellLevel);
    if (spellLevel === 0 && !hasZeroLevelSpells) continue;
    if (!base && !knownLimit && !preparedBase && spellLevel > 0) continue;
    const preparedCount = preparedBase || base;
    const preparedBonus = preparedBase ? 0 : bonus;
    const castUsage = preparedBase
      ? spontaneousCastsPerDayText(
          spellLevel,
          base,
          spellLevel === 0 ? 0 : bonus,
        )
      : "";
    const notes =
      mode === "spontaneous"
        ? renderSpellSlotButtons(
            className,
            "known",
            spellLevel,
            knownLimit,
            0,
            {
              usageText: spontaneousCastsPerDayText(spellLevel, base, bonus),
              extraLabel: "Extra Known Spell",
              removeExtraLabel: "Remove Extra Known Spell",
            },
          )
        : mode === "spellbook"
          ? renderSpellbookBuckets(
              className,
              spellLevel,
              preparedCount,
              preparedBonus,
              { usageText: castUsage },
            )
          : renderSpellSlotButtons(
              className,
              "prepared",
              spellLevel,
              base,
              bonus,
            );
    rows.push(`
      <div class="spell-row">
        <div><div class="spell-level-number">${spellLevel}</div></div>
        <div class="spell-notes">${notes}</div>
      </div>
    `);
  }
  return (
    rows.join("") ||
    `<div class="small-text">No spell levels available at this class level.</div>`
  );
}

function renderSpellProgression() {
  const root = el("spellProgressionList");
  if (!root) return;
  const counts = progressionClassCounts();
  const rows = Object.entries(counts)
    .map(([name, level]) => {
      const definition = classDefinitionByName(name);
      const meta = definition?.spellcasting;
      if (!definition?.spellcastingClass || !meta || typeof meta !== "object")
        return "";
      const mode =
        meta.preparation ||
        (meta.castingType === "spontaneous" ? "spontaneous" : "daily-list");
      const ability = String(meta.ability || "").toUpperCase() || "N/A";
      const abilityMod = spellAbilityMod(meta.ability);
      return `
      <article class="spellcasting-card">
        <div class="spellcasting-header">
          <h5 class="mb-0">${escapeHtml(name)} ${escapeHtml(level)}</h5>
          <button class="btn btn-outline-info btn-sm spellcasting-info-button" type="button" data-spellcasting-info="${escapeHtml(name)}" title="Spellcasting details" aria-label="${escapeHtml(name)} spellcasting details">
            <i class="bi bi-info-lg"></i>
          </button>
        </div>
        <div class="spell-grid-table">${renderSpellRows(name, meta, level, mode)}</div>
      </article>
    `;
    })
    .filter(Boolean);
  root.innerHTML = rows.length
    ? rows.join("")
    : "No spellcasting data listed for the current progression.";
  root.querySelectorAll("[data-spell-mobile-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.getAttribute("data-spell-mobile-group") || "";
      const target = button.getAttribute("data-spell-mobile-tab") || "";
      spellMobilePanels[group] = target;
      const wrapper = [
        ...root.querySelectorAll("[data-spell-mobile-group]"),
      ].find(
        (candidate) =>
          candidate.getAttribute("data-spell-mobile-group") === group,
      );
      if (!wrapper) return;
      wrapper.querySelectorAll("[data-spell-mobile-tab]").forEach((tab) => {
        const active = tab.getAttribute("data-spell-mobile-tab") === target;
        tab.classList.toggle("active", active);
      });
      wrapper.querySelectorAll("[data-spell-mobile-panel]").forEach((panel) => {
        panel.classList.toggle(
          "is-mobile-active",
          panel.getAttribute("data-spell-mobile-panel") === target,
        );
      });
    });
  });
  root.querySelectorAll("[data-spellcasting-info]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-spellcasting-info") || "";
      const level = counts[name] || 0;
      const definition = classDefinitionByName(name);
      const meta = definition?.spellcasting || {};
      const mode =
        meta.preparation ||
        (meta.castingType === "spontaneous" ? "spontaneous" : "daily-list");
      const ability = String(meta.ability || "").toUpperCase() || "N/A";
      PFSpellcastingInfo.open({
        className: name,
        level,
        castingType: meta.castingType || "Spellcasting",
        progression: meta.progression || "Unknown",
        ability,
        abilityMod: `${ability} ${signed(spellAbilityMod(meta.ability))}`,
        mode,
        maxSpellLevel: meta.maxSpellLevel ?? "Unknown",
      });
    });
  });
  root.querySelectorAll("[data-add-spell]").forEach((button) => {
    button.addEventListener("click", async () => {
      const className = button.dataset.spellClassName;
      const bucket = button.dataset.spellBucket;
      const spellLevel = Number(button.dataset.spellLevel || 0);
      const selected = spellStateValue(className, bucket, spellLevel);
      const spell = await openSpellPicker({
        title: `${className} ${spellLevel}: ${spellBucketLabel(bucket)}`,
        className,
        spellLevel,
        selected,
      });
      if (!spell?.name) return;
      setSpellStateValue(className, bucket, spellLevel, [
        ...selected,
        spell.name,
      ]);
      renderSpellProgression();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-pick-spell-slot]").forEach((button) => {
    button.addEventListener("click", async () => {
      const className = button.getAttribute("data-spell-class-name") || "";
      const bucket = button.getAttribute("data-spell-bucket") || "";
      const spellLevel = Number(button.getAttribute("data-spell-level") || 0);
      const slotIndex = Number(
        button.getAttribute("data-pick-spell-slot") || 0,
      );
      const sourceBucket =
        button.getAttribute("data-spell-source-bucket") || "";
      const currentName = button.getAttribute("data-spell-current-name") || "";
      const selected = spellStateValue(className, bucket, spellLevel);
      if (currentName) {
        const spell = await spellByNameForClass(currentName, className);
        if (spell) {
          await openSpellDetails({
            title: currentName,
            spell,
            spellName: currentName,
            className,
            spellLevel,
            calculations: safeSpellDetailCalculations(
              spell,
              className,
              spellLevel,
            ),
            recalculate: (casterLevel) =>
              safeSpellDetailCalculations(spell, className, spellLevel, {
                casterLevel,
              }),
            onCast: castSpellFromDetails,
          });
          return;
        }
        setStatus(`Could not find spell details for ${currentName}.`, "warning");
      }
      const allowedNames = sourceBucket
        ? [
            ...new Set(
              Array.from({ length: Math.max(0, spellLevel) + 1 }, (_, level) =>
                spellStateValue(className, sourceBucket, level),
              )
                .flat()
                .filter(Boolean),
            ),
          ]
        : null;
      const initialPickerLevel = sourceBucket
        ? Array.from({ length: Math.max(0, spellLevel) + 1 }, (_, level) => level)
            .reverse()
            .find(
              (level) =>
                spellStateValue(className, sourceBucket, level).length > 0,
            ) ?? spellLevel
        : spellLevel;
      const spell = await openSpellPicker({
        title: `${className} ${spellLevel}: ${spellBucketLabel(bucket)}`,
        className,
        spellLevel: initialPickerLevel,
        selected: selected.filter(Boolean),
        allowedNames,
        allowDuplicates: bucket === "prepared",
        maxSpellLevel: sourceBucket ? spellLevel : undefined,
        initialSpellName: currentName,
        hideClassFilter: Boolean(sourceBucket),
        emptyMessage: sourceBucket
          ? `No known ${className} level ${spellLevel} or lower spells are available to prepare.`
          : "",
      });
      if (!spell?.name) return;
      const next = [...selected];
      next[slotIndex] = spell.name;
      setSpellStateValue(className, bucket, spellLevel, next, {
        unique: bucket === "book",
      });
      renderSpellProgression();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-edit-known-spell]").forEach((button) => {
    button.addEventListener("click", async () => {
      const className = button.getAttribute("data-spell-class-name") || "";
      const spellLevel = Number(button.getAttribute("data-spell-level") || 0);
      const spellName = button.getAttribute("data-edit-known-spell") || "";
      if (!spellName) return;
      const spell = await spellByNameForClass(spellName, className);
      if (!spell) {
        setStatus(`Could not find spell details for ${spellName}.`, "warning");
        return;
      }
      await openSpellDetails({
        title: spellName,
        spell,
        spellName,
        className,
        spellLevel,
        calculations: safeSpellDetailCalculations(spell, className, spellLevel),
        recalculate: (casterLevel) =>
          safeSpellDetailCalculations(spell, className, spellLevel, {
            casterLevel,
          }),
        onCast: castSpellFromDetails,
      });
    });
  });
  root.querySelectorAll("[data-clear-spell-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const className = button.getAttribute("data-spell-class-name") || "";
      const bucket = button.getAttribute("data-spell-bucket") || "";
      const spellLevel = Number(button.getAttribute("data-spell-level") || 0);
      const slotIndex = Number(
        button.getAttribute("data-clear-spell-slot") || 0,
      );
      const next = [...spellStateValue(className, bucket, spellLevel)];
      next[slotIndex] = "";
      setSpellStateValue(className, bucket, spellLevel, next, {
        unique: false,
      });
      renderSpellProgression();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-add-extra-spell-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      addSpellExtraSlot(
        button.getAttribute("data-spell-class-name") || "",
        button.getAttribute("data-spell-bucket") || "",
        Number(button.getAttribute("data-spell-level") || 0),
      );
      renderSpellProgression();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-remove-extra-spell-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      removeSpellExtraSlot(
        button.getAttribute("data-spell-class-name") || "",
        button.getAttribute("data-spell-bucket") || "",
        Number(button.getAttribute("data-spell-level") || 0),
        Number(button.getAttribute("data-spell-base-count") || 0),
        Number(button.getAttribute("data-spell-bonus-count") || 0),
      );
      renderSpellProgression();
      queueSheetSave();
    });
  });
  root.querySelectorAll("[data-remove-spell]").forEach((button) => {
    button.addEventListener("click", () => {
      const className = button.dataset.spellClassName;
      const bucket = button.dataset.spellBucket;
      const spellLevel = Number(button.dataset.spellLevel || 0);
      const next = spellStateValue(className, bucket, spellLevel).filter(
        (spell) => spell !== button.dataset.removeSpell,
      );
      setSpellStateValue(className, bucket, spellLevel, next);
      if (bucket === "book") {
        const prepared = spellStateValue(
          className,
          "prepared",
          spellLevel,
        ).filter((spell) => spell !== button.dataset.removeSpell);
        setSpellStateValue(className, "prepared", spellLevel, prepared);
      }
      renderSpellProgression();
      queueSheetSave();
    });
  });
}

function updateClassDerivedViews() {
  applyClassProgressionStats();
  updateClassLevelText();
  renderClassFeatures();
  renderFeatProgression();
  renderSpellProgression();
  updateClassFeatureDamageReductionSummary();
  updateResistanceSummary();
  updateClassFeatureImmunitySummary();
  updateClassFeatureSpellResistanceSummary();
}

function setSheetInfoTab(tab) {
  activeSheetInfoTab = tab || "character";
  const isCharacter = activeSheetInfoTab === "character";
  const infoTabs = el("sheetInfoTabs");
  infoTabs?.classList.toggle("d-none", isCharacter);
  if (infoTabs) infoTabs.dataset.activePanel = activeSheetInfoTab;
  document
    .querySelectorAll("[data-sheet-info-panel]")
    .forEach((panel) =>
      panel.classList.toggle(
        "d-none",
        panel.dataset.sheetInfoPanel !== activeSheetInfoTab,
      ),
    );
  document
    .querySelector(".view-tabs")
    ?.classList.toggle("d-none", !isCharacter);
  document.querySelectorAll("[data-sheet-info-tab]").forEach((button) => {
    const active = button.dataset.sheetInfoTab === activeSheetInfoTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  if (isCharacter) {
    setSheetView(sheetViewMode);
  } else {
    el("fullSheetView")?.classList.remove("d-none");
    el("simplifiedSheetView")?.classList.add("d-none");
    requestAnimationFrame(syncSheetStickyControls);
  }
}

function sheetToBaseline(gearAcOverride = null) {
  const gearAc = gearAcOverride || calculateGearAc();
  const classLevels = progressionClassCounts(
    Math.max(1, num("characterLevel") || 1),
  );
  const size = finalCreatureSize();
  const skillRanks = {};
  allSkills().forEach(([skill, ability]) => {
    const ranks = effectiveSkillRanks(skill, ability).total;
    skillRanks[skillStatKey(skill)] = ranks;
    const familyKey = genericSkillStatKey(skill);
    if (familyKey) skillRanks[familyKey] = Math.max(skillRanks[familyKey] || 0, ranks);
  });
  return {
    str: num("strScore"),
    dex: num("dexScore"),
    con: num("conScore"),
    int: num("intScore"),
    wis: num("wisScore"),
    cha: num("chaScore"),
    bab: num("bab"),
    hitPoints: num("hitPoints"),
    level: Math.max(1, num("characterLevel") || 1),
    characterLevel: Math.max(1, num("characterLevel") || 1),
    classLevels,
    hitDice: Math.max(1, num("characterLevel")),
    armor: gearAc.armor,
    shield: gearAc.shield,
    maxDex: gearAc.maxDex,
    naturalArmor: num("acNaturalBase") + num("acNaturalMisc"),
    deflection: num("acDeflection"),
    acMisc: num("acMisc"),
    cmbMisc: num("cmbMisc"),
    cmdMisc: num("cmdMisc"),
    fortBase: num("fortBase") + num("fortMisc"),
    reflexBase: num("reflexBase") + num("reflexMisc"),
    willBase: num("willBase") + num("willMisc"),
    initMisc: num("initMisc"),
    sizeAc: Number(size.modifier || 0),
    sizeCombat: Number(size.specialModifier || 0),
    skillRanks,
  };
}

function setStatus(message, type = "info") {
  const status = el("sheetStatus");
  if (!status) return;
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
  status.classList.remove("d-none");
}

function buildSheet(deferDynamicSections = false) {
  setSelectValuePreservingUnknown("race", el("race")?.value || "");
  setSelectValuePreservingUnknown("alignment", el("alignment")?.value || "");
  setSelectValuePreservingUnknown("size", el("size")?.value || "Medium");
  updateCreatureSizeFields();
  el("abilityRows").innerHTML = ABILITIES.map(
    ([key, label]) => `
    <tr>
      <th>${label}</th>
      <td><input id="${key}Total" class="form-control form-control-sm ability-total-input" readonly></td>
      <td><input id="${key}Buff" class="form-control form-control-sm buff-field" readonly></td>
      <td><input id="${key}Mod" class="form-control form-control-sm" readonly></td>
      <td>
        <div class="ability-score-stepper">
          <button class="btn btn-outline-light btn-sm ability-stepper-btn" type="button" onclick="adjustSkillNumber('${key}Score', -1)" aria-label="Decrease ${label} score">-</button>
          <input id="${key}Score" class="form-control form-control-sm sheet-input no-spinner" type="number" value="10" inputmode="numeric">
          <button class="btn btn-outline-light btn-sm ability-stepper-btn" type="button" onclick="adjustSkillNumber('${key}Score', 1)" aria-label="Increase ${label} score">+</button>
        </div>
      </td>
    </tr>
    <tr class="ability-calc-row">
      <td colspan="5"><div class="small-text calc-line" data-calc-for="${key}Total"></div></td>
    </tr>
  `,
  ).join("");

  el("saveRows").innerHTML = SAVES.map(
    ([key, label]) => `
    <tr>
      <th>${label}</th>
      <td><input id="${key}Total" class="form-control form-control-sm total-first-input" readonly></td>
      <td><input id="${key}Base" class="form-control form-control-sm no-spinner" inputmode="numeric" value="0" readonly></td>
      <td>
        <div class="number-stepper">
          <button class="btn btn-outline-light btn-sm ability-stepper-btn" type="button" onclick="adjustSkillNumber('${key}Misc', -1)" aria-label="Decrease ${label} misc">-</button>
          <input id="${key}Misc" class="form-control form-control-sm sheet-input no-spinner" type="number" value="0" inputmode="numeric">
          <button class="btn btn-outline-light btn-sm ability-stepper-btn" type="button" onclick="adjustSkillNumber('${key}Misc', 1)" aria-label="Increase ${label} misc">+</button>
        </div>
      </td>
      <td><input id="${key}Ability" class="form-control form-control-sm" readonly></td>
      <td><input id="${key}Buff" class="form-control form-control-sm buff-field" readonly></td>
    </tr>
    <tr>
      <td colspan="6"><div class="small-text calc-line" data-calc-for="${key}Total"></div></td>
    </tr>
  `,
  ).join("");

  if (!deferDynamicSections) {
    renderSkillRows();
    renderLevelProgression();
    updateRacialTraitsButton();
    renderCharacterSpellLikeAbilities();
  }
  setSheetInfoTab(activeSheetInfoTab);
}

function renderSkillRows(saved = {}) {
  const rankCap = characterSkillRankCap();
  el("skillRows").innerHTML = allSkills()
    .map(([skill, ability, custom]) => {
      const id = skillId(skill);
      const values = saved[id] || {};
      const searchName = escapeHtml(skill.toLowerCase());
      return `
      <tr data-skill-row="${searchName}">
        <td class="class-skill-cell"><span id="${id}ClassSkill" class="class-skill-dot" title="Not a class skill"></span></td>
        <th class="skill-name-cell">
          ${escapeHtml(skill)}
          ${custom ? `<button class="btn btn-outline-danger btn-sm ms-2 py-0 px-1" type="button" onclick="removeNamedSkillByKey('${normalizeSkillName(skill)}')" aria-label="Remove ${escapeHtml(skill)}"><i class="bi bi-trash"></i></button>` : ""}
        </th>
        <td><input id="${id}Total" class="form-control form-control-sm total-first-input" readonly></td>
        <td><input id="${id}Ability" class="form-control form-control-sm no-spinner" value="0" data-ability="${ability}" readonly></td>
        <td>
          <div class="skill-stepper">
            <button class="btn btn-outline-light btn-sm skill-stepper-btn" type="button" onclick="adjustSkillNumber('${id}Ranks', -1)" aria-label="Decrease ${escapeHtml(skill)} ranks">-</button>
            <input id="${id}Ranks" class="form-control form-control-sm sheet-input no-spinner" type="number" min="0" max="${rankCap}" value="${Math.max(0, Math.min(rankCap, Math.floor(Number(values.ranks || 0) || 0)))}" inputmode="numeric">
            <button class="btn btn-outline-light btn-sm skill-stepper-btn" type="button" onclick="adjustSkillNumber('${id}Ranks', 1)" aria-label="Increase ${escapeHtml(skill)} ranks">+</button>
          </div>
        </td>
        <td>
          <div class="skill-stepper">
            <button class="btn btn-outline-light btn-sm skill-stepper-btn" type="button" onclick="adjustSkillNumber('${id}Misc', -1)" aria-label="Decrease ${escapeHtml(skill)} misc">-</button>
            <input id="${id}Misc" class="form-control form-control-sm sheet-input no-spinner" type="number" value="${values.misc || 0}" inputmode="numeric">
            <button class="btn btn-outline-light btn-sm skill-stepper-btn" type="button" onclick="adjustSkillNumber('${id}Misc', 1)" aria-label="Increase ${escapeHtml(skill)} misc">+</button>
          </div>
        </td>
        <td><input id="${id}Buff" class="form-control form-control-sm buff-field" readonly></td>
      </tr>
      <tr data-skill-row="${searchName}">
        <td colspan="7"><div class="small-text calc-line" data-calc-for="${id}Total"></div></td>
      </tr>
    `;
    })
    .join("");
  attachInputListeners(el("skillRows"));
  applySkillSearchFilter();
}

function adjustSkillNumber(id, delta) {
  const input = el(id);
  if (!input) return;
  adjustNumberInput(input, delta);
}

function adjustSiblingNumber(button, delta) {
  const input = button?.parentElement?.querySelector("input");
  if (!input) return;
  adjustNumberInput(input, delta);
}

function adjustNumberInput(input, delta) {
  const current = Number(input.value || 0);
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const next = Math.min(max, Math.max(min, current + delta));
  input.value = String(next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function renderSkillSummaryRows() {
  const root = el("skillSummaryRows");
  if (!root) return;
  root.innerHTML = allSkills()
    .map(
      ([skill]) => `
    <div class="skill-summary-row" data-skill-summary-row="${escapeHtml(skill.toLowerCase())}">
      <div class="skill-summary-name">${escapeHtml(skill)}</div>
      <div class="skill-summary-total">${escapeHtml(fieldValue(`${skillId(skill)}Total`, "-"))}</div>
    </div>
  `,
    )
    .join("");
  applySkillSearchFilter();
}

function applySkillSearchFilter() {
  const term = skillSearchTerm.trim().toLowerCase();
  document.querySelectorAll("[data-skill-row]").forEach((row) => {
    row.classList.toggle(
      "d-none",
      Boolean(term) && !row.dataset.skillRow.includes(term),
    );
  });
  document.querySelectorAll("[data-skill-summary-row]").forEach((row) => {
    row.classList.toggle(
      "d-none",
      Boolean(term) && !row.dataset.skillSummaryRow.includes(term),
    );
  });
}

function currentSkillValues() {
  const values = {};
  allSkills().forEach(([skill]) => {
    const id = skillId(skill);
    values[id] = {
      ranks: el(`${id}Ranks`)?.value || 0,
      misc: el(`${id}Misc`)?.value || 0,
    };
  });
  return values;
}

function addNamedSkill(prefix, ability) {
  const detail = window.prompt(`${prefix} name`, "");
  if (detail === null) return;
  const clean = detail.trim();
  if (!clean) return;
  const name = `${prefix} (${clean})`;
  const key = normalizeSkillName(name);
  if (allSkills().some(([skill]) => normalizeSkillName(skill) === key)) {
    setStatus(`${name} already exists.`, "warning");
    return;
  }
  customSkills.push({ name, ability });
  renderSkillRows(currentSkillValues());
  renderSkillSummaryRows();
  recalculateSheet();
  queueSheetSave();
}

function removeNamedSkillByKey(key) {
  const saved = currentSkillValues();
  customSkills = customSkills.filter(
    (skill) => normalizeSkillName(skill.name) !== key,
  );
  renderSkillRows(saved);
  renderSkillSummaryRows();
  recalculateSheet();
  queueSheetSave();
}

function addWeapon(data = {}) {
  const i = weaponCount++;
  const card = document.createElement("div");
  card.className = "sheet-card";
  card.dataset.weaponIndex = i;
  const sourceLootId = data.sourceLootId || "";
  const name = data.name || `Weapon ${i + 1}`;
  const attackScale = data.attackScale || "STR";
  const damageScale = data.damageScale || "STR";
  const twoHanded = isYes(data.twoHanded) ? "yes" : "no";
  const powerAttack = isYes(data.powerAttack)
    ? "yes"
    : "no";
  const deadlyAim = isYes(data.deadlyAim) ? "yes" : "no";
  const rapidShot = isYes(data.rapidShot) ? "yes" : "no";
  const twfNoFeatPrimary = isYes(
    data.twfNoFeatPrimary,
  )
    ? "yes"
    : "no";
  const twfNoFeatOff = isYes(data.twfNoFeatOff)
    ? "yes"
    : "no";
  const twfFeatPrimary = isYes(data.twfFeatPrimary)
    ? "yes"
    : "no";
  const twfFeatOff = isYes(data.twfFeatOff) ? "yes" : "no";
  const improvedTwf = isYes(data.improvedTwf)
    ? "yes"
    : "no";
  const greaterTwf = isYes(data.greaterTwf) ? "yes" : "no";
  const weaponType = data.weaponType || "Melee Weapon (One-Handed)";
  const naturalAttackKind =
    data.naturalAttackKind || naturalAttackKindFromName(name);
  const naturalAttackRole = data.naturalAttackRole || "";
  const enhancement = data.enhancement || "0";
  const enchantment = data.enchantment || "";
  const specialMaterial = data.specialMaterial || "";
  const detailsText = data.details || data.type || "";
  const generatedEquipmentId =
    data.generatedEquipmentId || "";
  const generatedSource = data.generatedSource || "";
  const generatedLocked = Boolean(generatedEquipmentId);
  const sourceLocked = Boolean(sourceLootId || generatedLocked);
  if (generatedLocked) card.dataset.generatedEquipment = "true";
  card.innerHTML = `
    <div class="equipment-card-header">
      <input data-field="name" class="form-control form-control-sm sheet-input fw-semibold equipment-name-input" value="${escapeHtml(name)}" ${sourceLocked ? "readonly" : ""}>
      <div class="equipment-actions">
        ${
          generatedLocked
            ? `<span class="inventory-equipped-badge" title="${escapeHtml(generatedSource || "Generated by effect")}">Effect</span>`
            : `
        <button class="btn btn-outline-light btn-sm" type="button" onclick="openEquipmentItemEditor(this)">More</button>
        <button class="btn btn-outline-danger btn-sm equipment-icon-btn" type="button" onclick="removeCard(this)" aria-label="Remove ${escapeHtml(name)}" title="Remove">
          <i class="bi bi-trash"></i>
        </button>`
        }
      </div>
    </div>
    <input data-field="sourceLootId" class="sheet-input" type="hidden" value="${sourceLootId}">
    <input data-field="generatedEquipmentId" class="sheet-input" type="hidden" value="${escapeHtml(generatedEquipmentId)}">
    <input data-field="generatedSource" class="sheet-input" type="hidden" value="${escapeHtml(generatedSource)}">
    <input data-field="templateAttack" class="sheet-input" type="hidden" value="${escapeHtml(data.templateAttack || "")}">
    <div class="weapon-summary">
      <div class="weapon-attack-summary"><label>Attack Bonus</label><input data-attack-total class="form-control form-control-sm" readonly></div>
      <div><label>Damage</label><input data-damage-total class="form-control form-control-sm" readonly><div class="weapon-extra-damage-results" data-extra-damage-results></div></div>
      <div><label>Critical</label><input data-field="critical" class="form-control form-control-sm sheet-input" value="${data.critical || ""}" ${sourceLocked ? "readonly" : ""}></div>
    </div>
    <div class="small-text calc-line" data-weapon-attack-calc></div>
    <div class="small-text calc-line" data-weapon-damage-calc></div>
    <input data-field="enhancement" class="sheet-input" type="hidden" value="${enhancement}">
    <input data-field="enchantment" class="sheet-input" type="hidden" value="${escapeHtml(enchantment)}">
    <input data-field="specialMaterial" class="sheet-input" type="hidden" value="${escapeHtml(specialMaterial)}">
    <input data-field="weaponType" class="sheet-input" type="hidden" value="${escapeHtml(weaponType)}">
    <input data-field="naturalAttackKind" class="sheet-input" type="hidden" value="${escapeHtml(naturalAttackKind)}">
    <input data-field="naturalAttackRole" class="sheet-input" type="hidden" value="${escapeHtml(naturalAttackRole)}">
    <input data-field="attackScale" class="sheet-input" type="hidden" value="${escapeHtml(attackScale)}">
    <input data-field="attackMisc" class="sheet-input" type="hidden" value="${data.attackMisc || "0"}">
    <input data-field="damage" class="sheet-input" type="hidden" value="${escapeHtml(data.damage || "")}">
    <input data-field="damageType" class="sheet-input" type="hidden" value="${escapeHtml(data.damageType || "")}">
    <input data-field="extraDamage" class="sheet-input" type="hidden" value="${escapeHtml(JSON.stringify(PFWeaponDamage.normalize(data.extraDamage)))}">
    <input data-field="damageScale" class="sheet-input" type="hidden" value="${escapeHtml(damageScale)}">
    <input data-field="damageMisc" class="sheet-input" type="hidden" value="${data.damageMisc || "0"}">
    <input data-field="details" class="sheet-input" type="hidden" value="${escapeHtml(detailsText)}">
    <input data-field="range" class="sheet-input" type="hidden" value="${escapeHtml(data.range || "")}">
    <input data-field="capacity" class="sheet-input" type="hidden" value="${escapeHtml(data.capacity || "")}">
    <input data-field="misfire" class="sheet-input" type="hidden" value="${escapeHtml(data.misfire || "")}">
    <input data-field="twoHanded" data-twf-compatible class="sheet-input d-none" type="checkbox" value="yes" ${twoHanded === "yes" ? "checked" : ""}>
    <input data-field="powerAttack" class="sheet-input d-none" type="checkbox" value="yes" ${powerAttack === "yes" ? "checked" : ""}>
    <input data-field="deadlyAim" class="sheet-input d-none" type="checkbox" value="yes" ${deadlyAim === "yes" ? "checked" : ""}>
    <input data-field="rapidShot" class="sheet-input d-none" type="checkbox" value="yes" ${rapidShot === "yes" ? "checked" : ""}>
    <input data-field="twfNoFeatPrimary" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${twfNoFeatPrimary === "yes" ? "checked" : ""}>
    <input data-field="twfNoFeatOff" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${twfNoFeatOff === "yes" ? "checked" : ""}>
    <input data-field="twfFeatPrimary" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${twfFeatPrimary === "yes" ? "checked" : ""}>
    <input data-field="twfFeatOff" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${twfFeatOff === "yes" ? "checked" : ""}>
    <input data-field="improvedTwf" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${improvedTwf === "yes" ? "checked" : ""}>
    <input data-field="greaterTwf" data-twf-option class="sheet-input d-none" type="checkbox" value="yes" ${greaterTwf === "yes" ? "checked" : ""}>
  `;
  el("weaponRows").appendChild(card);
  attachInputListeners(card);
  attachScalingControls(card);
  attachWeaponTypeControls(card);
  attachTwfControls(card);
  attachRapidShotControls(card);
}

function addArmor(data = {}) {
  const i = armorCount++;
  const card = document.createElement("div");
  card.className = "sheet-card";
  card.dataset.armorIndex = i;
  const type = data.type === "Shield" ? "Shield" : "Armor";
  const itemName = data.item || `Armor / Shield ${i + 1}`;
  const enhancement = data.enhancement ?? 0;
  const enchantment = data.enchantment || "";
  const specialMaterial = data.specialMaterial || "";
  const sourceLootId = data.sourceLootId || "";
  const generatedEquipmentId =
    data.generatedEquipmentId || "";
  const generatedSource = data.generatedSource || "";
  const generatedLocked = Boolean(generatedEquipmentId);
  const sourceLocked = Boolean(sourceLootId || generatedLocked);
  if (generatedLocked) card.dataset.generatedEquipment = "true";
  card.innerHTML = `
    <div class="equipment-card-header">
      <input data-field="item" class="form-control form-control-sm sheet-input fw-semibold equipment-name-input" value="${escapeHtml(itemName)}" ${sourceLocked ? "readonly" : ""}>
      <div class="equipment-actions">
        ${
          generatedLocked
            ? `<span class="inventory-equipped-badge" title="${escapeHtml(generatedSource || "Generated by effect")}">Effect</span>`
            : `
        <button class="btn btn-outline-light btn-sm" type="button" onclick="openEquipmentItemEditor(this)">More</button>
        <button class="btn btn-outline-danger btn-sm equipment-icon-btn" type="button" onclick="removeCard(this)" aria-label="Remove ${escapeHtml(itemName)}" title="Remove">
          <i class="bi bi-trash"></i>
        </button>`
        }
      </div>
    </div>
    <div class="card-summary">
      <div><label>Total</label><input data-armor-total class="form-control form-control-sm" readonly></div>
    </div>
    <input data-field="sourceLootId" class="sheet-input" type="hidden" value="${sourceLootId}">
    <input data-field="generatedEquipmentId" class="sheet-input" type="hidden" value="${escapeHtml(generatedEquipmentId)}">
    <input data-field="generatedSource" class="sheet-input" type="hidden" value="${escapeHtml(generatedSource)}">
    <input data-field="type" class="sheet-input" type="hidden" value="${type}">
    <input data-field="bonus" class="sheet-input" type="hidden" value="${data.bonus ?? ""}">
    <input data-field="enhancement" class="sheet-input" type="hidden" value="${enhancement}">
    <input data-field="enchantment" class="sheet-input" type="hidden" value="${escapeHtml(enchantment)}">
    <input data-field="specialMaterial" class="sheet-input" type="hidden" value="${escapeHtml(specialMaterial)}">
    <input data-field="armorGroup" class="sheet-input" type="hidden" value="${escapeHtml(data.armorGroup || type)}">
    <input data-field="maxDex" class="sheet-input" type="hidden" value="${data.maxDex ?? ""}">
    <input data-field="penalty" class="sheet-input" type="hidden" value="${data.penalty ?? ""}">
    <input data-field="failure" class="sheet-input" type="hidden" value="${data.failure ?? ""}">
    <input data-field="weight" class="sheet-input" type="hidden" value="${data.weight || ""}">
  `;
  el("armorRows").appendChild(card);
  attachInputListeners(card);
  syncArmorCardDisplay(card);
}

function addGear(data = {}) {
  const i = gearCount++;
  const card = document.createElement("div");
  card.className = "sheet-card";
  card.dataset.gearIndex = i;
  const itemName = data.item || data.name || `Gear ${i + 1}`;
  const slot = data.slot || "";
  const sourceLootId = data.sourceLootId || "";
  const sourceLocked = Boolean(sourceLootId);
  card.innerHTML = `
    <div class="equipment-card-header">
      <input data-field="item" class="form-control form-control-sm sheet-input fw-semibold equipment-name-input" value="${escapeHtml(itemName)}" ${sourceLocked ? "readonly" : ""}>
      <div class="equipment-actions">
        <button class="btn btn-outline-light btn-sm" type="button" onclick="openEquipmentItemEditor(this)">More</button>
        <button class="btn btn-outline-danger btn-sm equipment-icon-btn" type="button" onclick="removeCard(this)" aria-label="Remove ${escapeHtml(itemName)}" title="Remove">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
    <input data-field="sourceLootId" class="sheet-input" type="hidden" value="${sourceLootId}">
    <input data-field="slot" class="sheet-input" type="hidden" value="${escapeHtml(slot)}">
    <input data-field="details" class="sheet-input" type="hidden" value="${escapeHtml(data.details || "")}">
  `;
  el("gearRows").appendChild(card);
  attachInputListeners(card);
}

function generatedEquipmentCardData(entry = {}, buff = {}, index = 0) {
  const details = entry.details && typeof entry.details === "object"
    ? entry.details
    : {};
  const type = ["Weapon", "Armor", "Shield"].includes(entry.type)
    ? entry.type
    : "Weapon";
  const name = entry.name || entry.item || `Generated ${type}`;
  const source = buff.name || buff.source || "Effect";
  const generatedEquipmentId = [
    source,
    index,
    type,
    name,
    JSON.stringify(details),
  ].join("|");
  if (type === "Weapon") {
    return {
      kind: "Weapon",
      data: {
        name,
        generatedEquipmentId,
        generatedSource: source,
        weaponType: details.weaponType || "Natural Weapon",
        naturalAttackKind:
          details.naturalAttackKind || naturalAttackKindFromName(name),
        naturalAttackRole:
          details.naturalAttackRole ||
          NATURAL_ATTACK_DAMAGE_BY_SIZE[
            details.naturalAttackKind ||
              naturalAttackKindFromName(name)
          ]?.attackRole ||
          "",
        attackScale: details.attackScale || "STR",
        attackMisc: details.attackMisc || "0",
        damage: details.damage || "",
        damageScale: details.damageScale || "STR",
        damageMisc: details.damageMisc || "0",
        enhancement: details.enhancement || "0",
        enchantment: details.enchantment || "",
        specialMaterial: details.specialMaterial || "",
        details: details.details || details.summary || "",
        range: details.range || "",
        critical: details.critical || "",
        capacity: details.capacity || "",
        misfire: details.misfire || "",
        twoHanded: details.twoHanded || "no",
        powerAttack: details.powerAttack || "no",
        deadlyAim: details.deadlyAim || "no",
        rapidShot: details.rapidShot || "no",
      },
    };
  }
  return {
    kind: "Armor",
    data: {
      item: name,
      generatedEquipmentId,
      generatedSource: source,
      type,
      bonus: details.bonus ?? 0,
      enhancement: details.enhancement ?? 0,
      enchantment: details.enchantment || "",
      specialMaterial: details.specialMaterial || "",
      armorGroup: details.armorGroup || type,
      maxDex: details.maxDex ?? null,
      penalty: details.penalty ?? null,
      failure: details.failure ?? null,
      weight: details.weight || "",
    },
  };
}

function collectGeneratedEquipmentCards() {
  const generated = [];
  calculationBuffs().forEach((buff) => {
    (Array.isArray(buff.generatedEquipment) ? buff.generatedEquipment : []).forEach(
      (entry, index) => {
        generated.push(generatedEquipmentCardData(entry, buff, index));
      },
    );
  });
  return generated;
}

function syncGeneratedEquipmentCards() {
  const generated = collectGeneratedEquipmentCards();
  const signature = JSON.stringify(generated);
  const existing = [
    ...document.querySelectorAll('[data-generated-equipment="true"]'),
  ];
  if (signature === generatedEquipmentSignature && existing.length === generated.length)
    return;
  existing.forEach((card) => card.remove());
  generated.forEach((entry) => {
    if (entry.kind === "Weapon") addWeapon(entry.data);
    else addArmor(entry.data);
  });
  generatedEquipmentSignature = signature;
}

function equipmentField(card, name) {
  const input = card?.querySelector(`[data-field="${name}"]`);
  if (!input) return "";
  if (input.type === "checkbox") return input.checked ? "yes" : "no";
  return input.value || "";
}

function equipmentCardKind(card) {
  if (!card) return "";
  if (card.closest("#weaponRows")) return "Weapon";
  if (card.closest("#armorRows")) return "Armor";
  if (card.closest("#gearRows")) return "Item";
  return "";
}

function defaultInventoryItemForType(type = "Item") {
  if (type === "Weapon") {
    return {
      name: `Weapon ${weaponCount + 1}`,
      description: "",
      count: 1,
      type: "Weapon",
      assignedCharacterId: currentSheetId,
      assigned_character_id: currentSheetId,
      details: {
        weaponType: "Melee Weapon (One-Handed)",
        attackScale: "STR",
        damage: "",
        critical: "",
        damageScale: "STR",
        enhancement: "0",
        enchantment: "",
        specialMaterial: "",
        details: "",
        range: "",
        capacity: "",
        misfire: "",
      },
      effects: [],
    };
  }
  if (type === "Armor" || type === "Shield") {
    return {
      name: `Armor / Shield ${armorCount + 1}`,
      description: "",
      count: 1,
      type,
      assignedCharacterId: currentSheetId,
      assigned_character_id: currentSheetId,
      details: {
        bonus: "0",
        enhancement: "0",
        enchantment: "",
        specialMaterial: "",
      },
      effects: [],
    };
  }
  return {
    name: `Equipment ${gearCount + 1}`,
    description: "",
    count: 1,
    type: "Item",
    assignedCharacterId: currentSheetId,
    assigned_character_id: currentSheetId,
    details: {
      slot: "",
      details: "",
    },
    effects: [],
  };
}

function inventoryItemFromEquipmentCard(card) {
  const kind = equipmentCardKind(card);
  const item = defaultInventoryItemForType(kind);
  if (kind === "Weapon") {
    item.name = equipmentField(card, "name") || item.name;
    item.details = {
      ...item.details,
      weaponType:
        equipmentField(card, "weaponType") || item.details.weaponType,
      attackScale:
        equipmentField(card, "attackScale") || item.details.attackScale,
      damage: equipmentField(card, "damage"),
      damageType: equipmentField(card, "damageType"),
      extraDamage: PFWeaponDamage.normalize(equipmentField(card, "extraDamage")),
      critical: equipmentField(card, "critical"),
      damageScale:
        equipmentField(card, "damageScale") || item.details.damageScale,
      enhancement: equipmentField(card, "enhancement") || "0",
      enchantment: equipmentField(card, "enchantment"),
      specialMaterial: equipmentField(card, "specialMaterial"),
      details: equipmentField(card, "details"),
      range: equipmentField(card, "range"),
      capacity: equipmentField(card, "capacity"),
      misfire: equipmentField(card, "misfire"),
    };
  } else if (kind === "Armor") {
    item.name = equipmentField(card, "item") || item.name;
    item.type = equipmentField(card, "type") === "Shield" ? "Shield" : "Armor";
    item.details = {
      ...item.details,
      bonus: equipmentField(card, "bonus") || "0",
      enhancement: equipmentField(card, "enhancement") || "0",
      enchantment: equipmentField(card, "enchantment"),
      specialMaterial: equipmentField(card, "specialMaterial"),
    };
  } else {
    item.name = equipmentField(card, "item") || item.name;
    item.details = {
      ...item.details,
      slot: equipmentField(card, "slot"),
      details: equipmentField(card, "details"),
    };
  }
  return item;
}

async function saveInventoryBackedEquipment(item) {
  if (!currentSheetId) {
    setStatus("Choose or create a character before adding equipment.", "warning");
    return null;
  }

  if (isEnemySheetMode) {
    const enemyItem = {
      ...makeEnemyInventoryItem(item),
      assigned_character_id: currentSheetId,
    };
    characterInventoryItems = [...characterInventoryItems, enemyItem];
    await saveEnemyInventoryItems("");
    return enemyItem;
  }

  const saved = await PFApp.saveLootItem(item, sheetContextKey);
  if (!saved) {
    setStatus("Could not create inventory item.", "danger");
    return null;
  }
  characterInventoryItems = [...characterInventoryItems, saved];
  renderCharacterInventory(characterInventoryItems);
  return saved;
}

async function createAndEquipInventoryItem(type = "Item") {
  const saved = await saveInventoryBackedEquipment(
    defaultInventoryItemForType(type),
  );
  if (!saved) return;
  await wearLootItem(saved);
  openInventoryItemEditor(saved.id);
}

function removeCard(btn) {
  const card = btn.closest(".sheet-card");
  const sourceLootId =
    card?.querySelector('[data-field="sourceLootId"]')?.value || "";
  card?.remove();
  recalculateSheet();
  queueSheetSave();
  if (sourceLootId) void removeWornLootEffect(sourceLootId);
}

async function removeWornLootEffect(sourceLootId) {
  const before = activeBuffs.length;
  activeBuffs = activeBuffs.filter(
    (buff) => buff.sourceLootId !== sourceLootId,
  );
  if (activeBuffs.length === before) return;
  await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
  localStorage.setItem(buffRefreshKey(), String(Date.now()));
  recalculateSheet();
}

function removeEquippedLoot(sourceLootId) {
  let changed = false;
  ["weaponRows", "armorRows", "gearRows"].forEach((containerId) => {
    el(containerId)
      .querySelectorAll(".sheet-card")
      .forEach((card) => {
        if (
          card.querySelector('[data-field="sourceLootId"]')?.value ===
          sourceLootId
        ) {
          card.remove();
          changed = true;
        }
      });
  });
  const before = activeBuffs.length;
  activeBuffs = activeBuffs.filter(
    (buff) => buff.sourceLootId !== sourceLootId,
  );
  return changed || activeBuffs.length !== before;
}

function setCardScaling(card, name, value = "STR") {
  const input = card?.querySelector(`[data-field="${name}"]`);
  const group = card?.querySelector(`[data-scale-options="${name}"]`);
  if (!input || !group) return;
  const selected = parseScalingKeys(value).map((key) => key.toUpperCase());
  const activeSet = new Set(selected.length ? selected : ["STR"]);
  input.value = [...activeSet].join(" + ");
  group.querySelectorAll("[data-scale-ability]").forEach((button) => {
    const active = activeSet.has(button.dataset.scaleAbility);
    button.classList.toggle("btn-primary", active);
    button.classList.toggle("btn-outline-light", !active);
  });
}

function updateWornCardFromLoot(item) {
  const details = item.details || {};
  const weaponCard = [...el("weaponRows").querySelectorAll(".sheet-card")].find(
    (card) =>
      card.querySelector('[data-field="sourceLootId"]')?.value === item.id,
  );
  const armorCard = [...el("armorRows").querySelectorAll(".sheet-card")].find(
    (card) =>
      card.querySelector('[data-field="sourceLootId"]')?.value === item.id,
  );
  const gearCard = [...el("gearRows").querySelectorAll(".sheet-card")].find(
    (card) =>
      card.querySelector('[data-field="sourceLootId"]')?.value === item.id,
  );

  if (weaponCard && item.type === "Weapon") {
    weaponCard.querySelector('[data-field="name"]').value = item.name || "";
    weaponCard.querySelector('[data-field="damage"]').value =
      details.damage || "";
    weaponCard.querySelector('[data-field="damageType"]').value = details.damageType || "";
    weaponCard.querySelector('[data-field="extraDamage"]').value =
      JSON.stringify(PFWeaponDamage.normalize(details.extraDamage));
    weaponCard.querySelector('[data-field="critical"]').value =
      details.critical || "";
    weaponCard.querySelector('[data-field="capacity"]').value =
      details.capacity || "";
    weaponCard.querySelector('[data-field="misfire"]').value =
      details.misfire || "";
    weaponCard.querySelector('[data-field="range"]').value =
      details.range || "";
    weaponCard.querySelector('[data-field="enhancement"]').value =
      details.enhancement || "0";
    weaponCard.querySelector('[data-field="enchantment"]').value =
      details.enchantment || "";
    weaponCard.querySelector('[data-field="specialMaterial"]').value =
      details.specialMaterial || "";
    weaponCard.querySelector('[data-field="details"]').value =
      details.details || "";
    const previousType =
      weaponCard.querySelector('[data-field="weaponType"]').value || "";
    const nextType = details.weaponType || "Melee Weapon (One-Handed)";
    weaponCard.querySelector('[data-field="weaponType"]').value = nextType;
    syncWeaponTypeControls(weaponCard, previousType !== nextType);
    weaponCard.querySelector('[data-field="attackMisc"]').value =
      details.attackMisc || details.attack_misc || "0";
    weaponCard.querySelector('[data-field="damageMisc"]').value =
      details.damageMisc || details.damage_misc || "0";
    Object.keys(INVENTORY_WEAPON_ATTACK_OPTION_IDS).forEach((field) => {
      const input = weaponCard.querySelector(`[data-field="${field}"]`);
      const snakeField = field.replace(
        /[A-Z]/g,
        (match) => `_${match.toLowerCase()}`,
      );
      if (input) input.checked = isYes(details[field] || details[snakeField]);
    });
    const rapidShotInput = weaponCard.querySelector('[data-field="rapidShot"]');
    if (rapidShotInput?.checked) enforceRapidShotChoice(rapidShotInput);
    syncTwfFeatControls(weaponCard);
    setCardScaling(weaponCard, "attackScale", details.attackScale || "STR");
    setCardScaling(weaponCard, "damageScale", details.damageScale || "STR");
  }

  if (armorCard && ["Armor", "Shield"].includes(item.type)) {
    armorCard.querySelector('[data-field="item"]').value = item.name || "";
    armorCard.querySelector('[data-field="type"]').value =
      item.type === "Shield"
        ? "Shield"
        : item.type === "Armor"
          ? "Armor"
          : "Gear";
    armorCard.querySelector('[data-field="bonus"]').value =
      details.bonus ?? 0;
    armorCard.querySelector('[data-field="enhancement"]').value =
      details.enhancement ?? 0;
    armorCard.querySelector('[data-field="enchantment"]').value =
      details.enchantment || "";
    armorCard.querySelector('[data-field="specialMaterial"]').value =
      details.specialMaterial || "";
    armorCard.querySelector('[data-field="armorGroup"]').value =
      details.armorGroup || item.type;
    armorCard.querySelector('[data-field="maxDex"]').value =
      details.maxDex ?? "";
    armorCard.querySelector('[data-field="penalty"]').value =
      details.penalty ?? "";
    armorCard.querySelector('[data-field="failure"]').value =
      details.failure ?? "";
    syncArmorCardDisplay(armorCard);
  }

  if (gearCard && !["Weapon", "Armor", "Shield"].includes(item.type)) {
    gearCard.querySelector('[data-field="item"]').value = item.name || "";
    gearCard.querySelector('[data-field="slot"]').value = details.slot || "";
    gearCard.querySelector('[data-field="details"]').value =
      details.details || item.description || "";
  }

  const isWorn = Boolean(weaponCard || armorCard || gearCard);
  if (!isWorn) return;
  if (item.type === "Weapon" && !weaponCard) {
    armorCard?.remove();
    gearCard?.remove();
    addWeapon({
      name: item.name,
      sourceLootId: item.id,
      weaponType: details.weaponType || "Melee Weapon (One-Handed)",
      attackScale: details.attackScale || "STR",
      attackMisc: details.attackMisc || "0",
      damage: details.damage || "",
      damageType: details.damageType || "",
      extraDamage: details.extraDamage || [],
      damageScale: details.damageScale || "STR",
      damageMisc: details.damageMisc || "0",
      enhancement: details.enhancement || "0",
      enchantment: details.enchantment || "",
      specialMaterial: details.specialMaterial || "",
      details: details.details || "",
      range: details.range || "",
      critical: details.critical || "",
      capacity: details.capacity || "",
      misfire: details.misfire || "",
      twoHanded: details.twoHanded || "no",
      powerAttack: details.powerAttack || "no",
      deadlyAim: details.deadlyAim || "no",
      rapidShot: details.rapidShot || "no",
      twfNoFeatPrimary: details.twfNoFeatPrimary || "no",
      twfNoFeatOff: details.twfNoFeatOff || "no",
      twfFeatPrimary: details.twfFeatPrimary || "no",
      twfFeatOff: details.twfFeatOff || "no",
      improvedTwf: details.improvedTwf || "no",
      greaterTwf: details.greaterTwf || "no",
    });
  } else if (["Armor", "Shield"].includes(item.type) && !armorCard) {
    weaponCard?.remove();
    gearCard?.remove();
    addArmor({
      item: item.name,
      sourceLootId: item.id,
      type: item.type,
      bonus: details.bonus ?? 0,
      enhancement: details.enhancement ?? 0,
      enchantment: details.enchantment || "",
      specialMaterial: details.specialMaterial || "",
      armorGroup: details.armorGroup || item.type,
      maxDex: details.maxDex ?? null,
      penalty: details.penalty ?? null,
      failure: details.failure ?? null,
    });
  } else if (!["Weapon", "Armor", "Shield"].includes(item.type) && !gearCard) {
    weaponCard?.remove();
    armorCard?.remove();
    addGear({
      item: item.name,
      sourceLootId: item.id,
      slot: details.slot || "",
      details: details.details || item.description || "",
    });
  }
}

function syncEquippedLootBuffFromItem(item) {
  const index = activeBuffs.findIndex((buff) => buff.sourceLootId === item.id);
  let passiveMechanics =
    window.PFEffectMechanics?.passiveMechanics?.(item) || item;
  const savedBranchId = activeBuffs[index]?.selectedBranchId;
  if (savedBranchId && window.PFEffectMechanics?.hasBranches?.(passiveMechanics)) {
    passiveMechanics =
      window.PFEffectMechanics.resolveBranch(passiveMechanics, savedBranchId) ||
      passiveMechanics;
  }
  item = { ...item, ...passiveMechanics };
  const effects = Array.isArray(item.effects) ? item.effects : [];
  const damageReduction = Array.isArray(item.damageReduction)
    ? item.damageReduction
    : [];
  const spellResistance = Array.isArray(item.spellResistance)
    ? item.spellResistance
    : [];
  const immunities = Array.isArray(item.immunities) ? item.immunities : [];
  const applyConditions = Array.isArray(item.applyConditions)
    ? item.applyConditions
    : [];
  const classSkillGrants = Array.isArray(item.classSkillGrants)
    ? item.classSkillGrants
    : [];
  const bonusRanks = Array.isArray(item.bonusRanks) ? item.bonusRanks : [];
  const extraRanksPerLevel = Array.isArray(item.extraRanksPerLevel)
    ? item.extraRanksPerLevel
    : [];
  const featGrants = Array.isArray(item.featGrants) ? item.featGrants : [];
  const sizeChanges = Array.isArray(item.sizeChanges) ? item.sizeChanges : [];
  const spellLikeAbilities = Array.isArray(item.spellLikeAbilities)
    ? item.spellLikeAbilities
    : [];
  const casterLevelBonuses = Array.isArray(item.casterLevelBonuses)
    ? item.casterLevelBonuses
    : [];
  const spellDcBonuses = Array.isArray(item.spellDcBonuses)
    ? item.spellDcBonuses
    : [];
  const effectiveAttributeBonuses = Array.isArray(item.effectiveAttributeBonuses)
    ? item.effectiveAttributeBonuses
    : [];
  const grantDomains = Array.isArray(item.grantDomains) ? item.grantDomains : [];
  const generatedEquipment = Array.isArray(item.generatedEquipment)
    ? item.generatedEquipment
    : [];
  // An item can grant DR/SR/class-skill status with no plain "effects"
  // at all (a ring of protection from acid, say) -- so "has nothing to
  // contribute" has to check all four, not just effects, or the buff
  // gets dropped (or never created) even though the item does
  // something.
  if (
    !effects.length &&
    !damageReduction.length &&
    !spellResistance.length &&
    !immunities.length &&
    !applyConditions.length &&
    !classSkillGrants.length &&
    !bonusRanks.length &&
    !extraRanksPerLevel.length &&
    !featGrants.length &&
    !sizeChanges.length &&
    !spellLikeAbilities.length &&
    !casterLevelBonuses.length &&
    !spellDcBonuses.length &&
    !effectiveAttributeBonuses.length &&
    !grantDomains.length &&
    !generatedEquipment.length
  ) {
    if (index >= 0) {
      activeBuffs.splice(index, 1);
      return true;
    }
    return false;
  }
  // Only attach damageReduction/spellResistance/classSkillGrants when
  // there's actually something in them -- an item with none of the
  // three keeps the exact object shape it always had. Unconditionally
  // stamping empty arrays onto every equipped item's buff made the
  // JSON.stringify comparison below see a "change" against any buff
  // saved before this feature existed (present-with-[] vs.
  // absent-key), so the plain act of loading the sheet kept looking
  // like something changed -- triggering a save + recalculate + active
  // effects list rebuild every single time (window focus, tab switch,
  // any inventory reload), which is what "pop in and out" was.
  const next = {
    ...(index >= 0 ? activeBuffs[index] : {}),
    name: item.name,
    category: "Item",
    sourceLootId: item.id,
    permanent: true,
    durationLabel: "Equipped",
    bonuses: effects,
    ...(item.selectedBranchId ? { selectedBranchId: item.selectedBranchId } : {}),
    ...(item.selectedBranchName ? { selectedBranchName: item.selectedBranchName } : {}),
    ...(damageReduction.length ? { damageReduction } : {}),
    ...(spellResistance.length ? { spellResistance } : {}),
    ...(immunities.length ? { immunities } : {}),
    ...(applyConditions.length ? { applyConditions } : {}),
    ...(classSkillGrants.length ? { classSkillGrants } : {}),
    ...(bonusRanks.length ? { bonusRanks } : {}),
    ...(extraRanksPerLevel.length ? { extraRanksPerLevel } : {}),
    ...(featGrants.length ? { featGrants } : {}),
    ...(sizeChanges.length ? { sizeChanges } : {}),
    ...(spellLikeAbilities.length ? { spellLikeAbilities } : {}),
    ...(casterLevelBonuses.length ? { casterLevelBonuses } : {}),
    ...(spellDcBonuses.length ? { spellDcBonuses } : {}),
    ...(effectiveAttributeBonuses.length ? { effectiveAttributeBonuses } : {}),
    ...(grantDomains.length ? { grantDomains } : {}),
    ...(generatedEquipment.length ? { generatedEquipment } : {}),
  };
  if (index >= 0 && JSON.stringify(activeBuffs[index]) === JSON.stringify(next))
    return false;
  if (index >= 0) activeBuffs[index] = next;
  else activeBuffs.push(next);
  return true;
}

function isLootEquipped(sourceLootId) {
  return ["weaponRows", "armorRows", "gearRows"].some((containerId) =>
    [...el(containerId).querySelectorAll(".sheet-card")].some(
      (card) =>
        card.querySelector('[data-field="sourceLootId"]')?.value ===
        sourceLootId,
    ),
  );
}

async function openEquipmentItemEditor(btn) {
  const card = btn.closest(".sheet-card");
  if (card?.dataset.generatedEquipment === "true") return;
  const sourceLootId =
    card?.querySelector('[data-field="sourceLootId"]')?.value || "";
  if (sourceLootId) {
    openInventoryItemEditor(sourceLootId);
    return;
  }

  const saved = await saveInventoryBackedEquipment(
    inventoryItemFromEquipmentCard(card),
  );
  if (!saved) return;
  card?.remove();
  await wearLootItem(saved);
  openInventoryItemEditor(saved.id);
}

function equipmentCardData(card) {
  const data = {};
  card?.querySelectorAll("[data-field]").forEach((input) => {
    data[input.dataset.field] =
      input.type === "checkbox" ? (input.checked ? "yes" : "no") : input.value;
  });
  return data;
}

function equipmentEnhancementBuffs() {
  if (equipmentEnhancementBuffCache) return equipmentEnhancementBuffCache;
  const characterLevel = Math.max(1, num("characterLevel") || 1);
  const classLevels = progressionClassCounts(characterLevel);
  const abilityScores = {
    strength: num("strScore"),
    dexterity: num("dexScore"),
    constitution: num("conScore"),
    intelligence: num("intScore"),
    wisdom: num("wisScore"),
    charisma: num("chaScore"),
  };
  const baseline = {
    str: abilityScores.strength,
    dex: abilityScores.dexterity,
    con: abilityScores.constitution,
    int: abilityScores.intelligence,
    wis: abilityScores.wisdom,
    cha: abilityScores.charisma,
    level: characterLevel,
    characterLevel,
    classLevels,
  };
  const buffs = calculationBuffs().map((buff) => ({
    ...buff,
    characterLevel: buff.characterLevel || characterLevel,
    classLevels: buff.classLevels || classLevels,
  }));
  equipmentEnhancementBuffCache = { buffs, abilityScores, baseline };
  return equipmentEnhancementBuffCache;
}

function equipmentEnhancementForCard(card) {
  if (!card) return { base: 0, effect: 0, value: 0, breakdown: [] };
  const cached = equipmentEnhancementCache.get(card);
  if (cached) return cached;
  const weapon = Boolean(card.closest("#weaponRows"));
  const container = card.parentElement;
  const index = container
    ? [...container.querySelectorAll(":scope > .sheet-card")].indexOf(card)
    : 0;
  const item = equipmentCardData(card);
  const context = equipmentEnhancementBuffs();
  const result = window.PFEffectStats?.resolveEquipmentEnhancement
    ? window.PFEffectStats.resolveEquipmentEnhancement({
        item,
        fallbackKind: weapon ? "weapon" : "armor",
        index: Math.max(0, index),
        baseEnhancement: item.enhancement,
        buffs: context.buffs,
        normalizeValue: enhancementValue,
        valueForBonus: (bonus, buff) =>
          window.PFBuffs?.scaledBonusValue
            ? window.PFBuffs.scaledBonusValue(bonus, buff, {
                activeBuffs: context.buffs,
                abilityScores: context.abilityScores,
                baseline: context.baseline,
              })
            : Number(bonus.value || 0),
      })
    : {
        base: enhancementValue(item.enhancement),
        effect: 0,
        value: enhancementValue(item.enhancement),
        breakdown: [],
      };
  equipmentEnhancementCache.set(card, result);
  return result;
}

function equipmentEnhancementBreakdown(result = {}, targetLabel = "Enhancement") {
  return (result.breakdown || []).map((entry) => ({ ...entry, targetLabel }));
}

function calculateGearAc() {
  const totals = {
    armor: 0,
    shield: 0,
    maxDex: null,
    spellFailure: 0,
    items: [],
    breakdown: [],
  };
  const winningBreakdown = { armor: [], shield: [] };
  el("armorRows")
    .querySelectorAll(":scope > .sheet-card")
    .forEach((card) => {
      const item = equipmentCardData(card);
      totals.items.push(item);
      const key = item.type === "Shield" ? "shield" : "armor";
      const enhancement = equipmentEnhancementForCard(card);
      const total = Number(item.bonus || 0) + enhancement.value;
      if (total < totals[key]) return;
      totals[key] = total;
      winningBreakdown[key] = equipmentEnhancementBreakdown(
        enhancement,
        `${item.type || "Armor"} enhancement`,
      );
    });
  const armorRules = window.PFArmorRules?.summarizeEquipment?.(totals.items);
  if (armorRules) {
    totals.maxDex = armorRules.maxDex;
    totals.spellFailure = armorRules.spellFailure;
  }
  totals.breakdown = [...winningBreakdown.armor, ...winningBreakdown.shield];
  return totals;
}

function syncArmorCardDisplay(card) {
  if (!card) return;
  const type =
    card.querySelector('[data-field="type"]')?.value === "Shield"
      ? "Shield"
      : "Armor";
  const bonus = Number(card.querySelector('[data-field="bonus"]')?.value || 0);
  const enhancement = equipmentEnhancementForCard(card);
  const total = bonus + enhancement.value;
  const label = card.querySelector("[data-armor-bonus-label]");
  const totalInput = card.querySelector("[data-armor-total]");
  if (label)
    label.textContent = type === "Shield" ? "Shield Bonus" : "Armor Bonus";
  if (totalInput) totalInput.value = String(total);
}

function syncArmorCardsDisplay() {
  el("armorRows").querySelectorAll(".sheet-card").forEach(syncArmorCardDisplay);
}

function powerFeatStep() {
  const bab = Math.max(0, num("bab"));
  return bab > 0 ? Math.floor((bab + 3) / 4) : 0;
}

function weaponFeatAdjustments(card) {
  const field = (name) => {
    const input = card.querySelector(`[data-field="${name}"]`);
    if (!input) return "";
    if (input.type === "checkbox") return input.checked ? "yes" : "no";
    return input.value || "";
  };
  const weaponType = field("weaponType") || "Melee Weapon (One-Handed)";
  const step = powerFeatStep();
  const result = { attackPenalty: 0, damageBonus: 0, breakdown: [] };
  if (!step) return result;

  if (isMeleeWeaponType(weaponType) && isYes(field("powerAttack"))) {
    const penalty = -step;
    const baseDamage = step * 2;
    const twoHanded =
      isTwoHandedWeaponType(weaponType) || isYes(field("twoHanded"));
    const lightMelee = weaponType === "Melee Weapon (Light)";
    const damage = lightMelee
      ? 0
      : twoHanded
        ? Math.floor(baseDamage * 1.5)
        : baseDamage;
    result.attackPenalty += penalty;
    result.damageBonus += damage;
    result.breakdown.push({
      source: "Power Attack",
      value: penalty,
      type: "feat",
      applied: true,
      targetLabel: "Attack",
    });
    if (damage)
      result.breakdown.push({
        source: "Power Attack",
        value: damage,
        type: "feat",
        applied: true,
        targetLabel: "Damage",
      });
  }

  if (isRangedWeaponType(weaponType) && isYes(field("deadlyAim"))) {
    const penalty = -step;
    const damage = step * 2;
    result.attackPenalty += penalty;
    result.damageBonus += damage;
    result.breakdown.push({
      source: "Deadly Aim",
      value: penalty,
      type: "feat",
      applied: true,
      targetLabel: "Attack",
    });
    result.breakdown.push({
      source: "Deadly Aim",
      value: damage,
      type: "feat",
      applied: true,
      targetLabel: "Damage",
    });
  }

  return result;
}

function calculateWeaponDamage(card, buffed, buffBonuses) {
  const field = (name) => {
    const input = card.querySelector(`[data-field="${name}"]`);
    if (!input) return "";
    if (input.type === "checkbox") return input.checked ? "yes" : "no";
    return input.value || "";
  };
  const scalingTerms = parseScalingTerms(field("damageScale"), "STR");
  const weaponType = field("weaponType") || "Melee Weapon (One-Handed)";
  const weaponName = field("name");
  const naturalData = naturalAttackData(card);
  const dice = naturalData
    ? naturalAttackDice(card) || stripDamageModifier(field("damage"))
    : stripDamageModifier(field("damage"));
  const isRanged =
    isRangedWeaponType(weaponType) ||
    Boolean(field("range").trim()) ||
    parseScalingKeys(field("attackScale")).includes("dex");
  const naturalSecondary =
    naturalData &&
    String(
      field("naturalAttackRole") || naturalData.attackRole || "",
    ).toLowerCase() === "secondary";
  const twoHanded =
    !naturalData &&
    (isTwoHandedWeaponType(weaponType) || isYes(field("twoHanded")));
  const enhancementResult = equipmentEnhancementForCard(card);
  const enhancement = enhancementResult.value;
  const miscBonus = Number(field("damageMisc") || 0);
  const feat = weaponFeatAdjustments(card);
  const scalingBonus = scalingTerms.reduce((total, term) => {
    const multiplier = naturalSecondary
      ? 0.5
      : twoHanded && term.key === "str"
        ? 1.5
        : term.multiplier;
    return total + Math.floor(abilityModFor(term.key, buffed) * multiplier);
  }, 0);
  const weaponBuffs = weaponBuffResult(
    buffed,
    buffBonuses,
    ["damage", isRanged ? "ranged damage" : "melee damage"],
    weaponType,
    weaponName,
  );
  const buffBonus = weaponBuffs.total;
  const totalBonus =
    scalingBonus + enhancement + miscBonus + buffBonus + feat.damageBonus;
  const extraDamage = PFWeaponDamage.normalize(field("extraDamage"));
  const damageType = field("damageType").trim();
  const totalText = `${dice || "0"}${signed(totalBonus)}${damageType ? ` ${damageType}` : ""}`;
  const statItems = scalingTerms.flatMap((term) => {
    const statName = ABILITY_STAT_NAMES[term.key];
    const multiplier = naturalSecondary
      ? 0.5
      : twoHanded && term.key === "str"
        ? 1.5
        : term.multiplier;
    return breakdownForStat(
      buffed,
      statName,
      `${statName} scaling x${multiplier}`,
    ).map((item) => ({ ...item, targetLabel: "Damage scaling" }));
  });
  const directItems = [
    ...equipmentEnhancementBreakdown(
      enhancementResult,
      "Weapon enhancement",
    ),
    ...weaponBuffBreakdown(weaponBuffs, "damage"),
    ...feat.breakdown.filter((item) => item.targetLabel === "Damage"),
  ];
  const naturalSize = naturalData ? ` (${finalCreatureSize().name} ${naturalData.kind})` : "";
  const formula = `${dice || "0"}${naturalSize} + scaling ${signed(scalingBonus)} + enhancement ${signed(enhancement)} + misc ${signed(miscBonus)} + buffs ${signed(buffBonus)} + feats ${signed(feat.damageBonus)}`;
  return {
    buffBonus,
    scalingBonus,
    totalBonus,
    totalText,
    extraDamage,
    formula,
    breakdown: [...statItems, ...directItems],
  };
}

function calculateWeaponAttack(card, buffed, buffBonuses) {
  const field = (name) => {
    const input = card.querySelector(`[data-field="${name}"]`);
    if (!input) return "";
    if (input.type === "checkbox") return input.checked ? "yes" : "no";
    return input.value || "";
  };
  const weaponType = field("weaponType") || "Melee Weapon (One-Handed)";
  const weaponName = field("name");
  const isRanged =
    isRangedWeaponType(weaponType) ||
    Boolean(field("range").trim()) ||
    parseScalingKeys(field("attackScale")).includes("dex");
  const size = finalCreatureSize();
  const sizeAttack = Number(size.modifier || 0);
  const miscBonus = Number(field("attackMisc") || 0);
  const weaponBuffs = weaponBuffResult(
    buffed,
    buffBonuses,
    ["attack", isRanged ? "ranged attack" : "melee attack"],
    weaponType,
    weaponName,
  );
  const buffBonus = weaponBuffs.total;
  const enhancementResult = equipmentEnhancementForCard(card);
  const enhancement = enhancementResult.value;
  const enhancementDelta = enhancement - enhancementResult.base;
  const templateAttack = field("templateAttack");
  if (templateAttack) {
    const attackValues =
      String(templateAttack)
        .match(/[+\-]?\d+/g)
        ?.map((value) =>
          signed(
            Number(value) +
              enhancementDelta +
              sizeAttack +
              miscBonus +
              buffBonus,
          ),
        ) || [];
    const directItems = [
      ...(sizeAttack
        ? [
            {
              source: `${size.name} size`,
              value: sizeAttack,
              type: "size",
              applied: true,
              targetLabel: "Attack",
            },
          ]
        : []),
      ...equipmentEnhancementBreakdown(
        enhancementResult,
        "Weapon enhancement",
      ),
      ...weaponBuffBreakdown(weaponBuffs, "attack"),
    ];
    const formula = `template ${templateAttack} + enhancement override ${signed(enhancementDelta)} + size ${signed(sizeAttack)} + misc ${signed(miscBonus)} + buffs ${signed(buffBonus)}`;
    return {
      buffBonus,
      attacks: attackValues.join("/"),
      formula,
      breakdown: directItems,
    };
  }
  const scalingTerms = parseScalingTerms(
    field("attackScale"),
    String(isRanged ? "DEX" : "STR"),
  );
  const scalingBonus = scalingTerms.reduce(
    (total, term) =>
      total + Math.floor(abilityModFor(term.key, buffed) * term.multiplier),
    0,
  );
  const feat = weaponFeatAdjustments(card);
  const naturalData = naturalAttackData(card);
  if (naturalData) {
    const role = String(
      field("naturalAttackRole") || naturalData.attackRole || "Primary",
    );
    const secondaryPenalty =
      role.toLowerCase() === "secondary" ? -5 : 0;
    const totalBonus =
      num("bab") +
      scalingBonus +
      enhancement +
      sizeAttack +
      miscBonus +
      buffBonus +
      feat.attackPenalty +
      secondaryPenalty;
    const statItems = scalingTerms.flatMap((term) =>
      breakdownForStat(
        buffed,
        ABILITY_STAT_NAMES[term.key],
        `${ABILITY_STAT_NAMES[term.key]} attack scaling`,
      ).map((item) => ({ ...item, targetLabel: "Attack scaling" })),
    );
    const directItems = [
      ...(sizeAttack
        ? [
            {
              source: `${size.name} size`,
              value: sizeAttack,
              type: "size",
              applied: true,
              targetLabel: "Attack",
            },
          ]
        : []),
      ...equipmentEnhancementBreakdown(
        enhancementResult,
        "Weapon enhancement",
      ),
      ...weaponBuffBreakdown(weaponBuffs, "attack"),
      ...feat.breakdown.filter((item) => item.targetLabel === "Attack"),
    ];
    if (secondaryPenalty) {
      directItems.push({
        source: "Secondary natural attack",
        value: secondaryPenalty,
        type: "natural",
        applied: true,
        targetLabel: "Attack",
      });
    }
    const formula = `BAB ${signed(num("bab"))} + scaling ${signed(scalingBonus)} + enhancement ${signed(enhancement)} + size ${signed(sizeAttack)} + misc ${signed(miscBonus)} + buffs ${signed(buffBonus)} + feats ${signed(feat.attackPenalty)} + ${role} ${signed(secondaryPenalty)}`;
    return {
      buffBonus,
      attacks: signed(totalBonus),
      formula,
      breakdown: [...statItems, ...directItems],
    };
  }
  const extraAttacks = Math.max(
    0,
    Math.floor(Number(buffBonuses["extra attack"] || 0)),
  );
  const twf = twfMode(card);
  const offhandCards = activeOffhandWeaponCards();
  const hasPrimaryWeapon = activePrimaryWeaponCards().length > 0;
  const twfSetActive = hasPrimaryWeapon && offhandCards.length > 0;
  const effectExtraAttacks = twfSetActive && !twf.primary ? 0 : extraAttacks;
  const rapidShotCard = activeRapidShotCard();
  const rapidShotActive = Boolean(rapidShotCard);
  const rapidShotOnThisWeapon = rapidShotCard === card;
  const primaryOffhandLight = offhandCards.some((offhandCard) => {
    const offhandType =
      offhandCard.querySelector('[data-field="weaponType"]')?.value || "";
    return isLightOffHandWeaponType(offhandType);
  });
  const selfOffhandLight = isLightOffHandWeaponType(weaponType);
  const twfActive =
    (twf.offhand && hasPrimaryWeapon) ||
    (twf.primary && offhandCards.length > 0);
  const twfAttackPenalty = twfActive
    ? twfPenalty(twf, twf.primary ? primaryOffhandLight : selfOffhandLight)
    : 0;
  const rapidShotPenalty = rapidShotActive ? -2 : 0;
  const totalBonus =
    scalingBonus +
    enhancement +
    sizeAttack +
    miscBonus +
    buffBonus +
    feat.attackPenalty +
    twfAttackPenalty +
    rapidShotPenalty;
  const baseIteratives = iterativeBabBonuses(num("bab"));
  const attackValues =
    twf.offhand && hasPrimaryWeapon
      ? [
          baseIteratives[0] || 0,
          ...(isYes(field("improvedTwf"))
            ? [(baseIteratives[0] || 0) - 5]
            : []),
          ...(isYes(field("greaterTwf"))
            ? [(baseIteratives[0] || 0) - 10]
            : []),
        ].map((base) => signed(base + totalBonus))
      : baseIteratives.map((base) => signed(base + totalBonus));
  if (rapidShotOnThisWeapon && attackValues.length) {
    attackValues.splice(1, 0, attackValues[0]);
  }
  if (effectExtraAttacks && attackValues.length) {
    attackValues.splice(
      1,
      0,
      ...Array(effectExtraAttacks).fill(attackValues[0]),
    );
  }
  const attacks = attackValues.join("/");
  const statItems = scalingTerms.flatMap((term) =>
    breakdownForStat(
      buffed,
      ABILITY_STAT_NAMES[term.key],
      `${ABILITY_STAT_NAMES[term.key]} attack scaling`,
    ).map((item) => ({ ...item, targetLabel: "Attack scaling" })),
  );
  const directItems = [
    ...(sizeAttack
      ? [
          {
            source: `${size.name} size`,
            value: sizeAttack,
            type: "size",
            applied: true,
            targetLabel: "Attack",
          },
        ]
      : []),
    ...equipmentEnhancementBreakdown(
      enhancementResult,
      "Weapon enhancement",
    ),
    ...weaponBuffBreakdown(weaponBuffs, "attack"),
    ...(effectExtraAttacks
      ? breakdownForStat(buffed, "extra attack").map((item) => ({
          ...item,
          targetLabel: "Extra attack",
        }))
      : []),
    ...feat.breakdown.filter((item) => item.targetLabel === "Attack"),
  ];
  if (twfAttackPenalty) {
    const source = twf.offhand
      ? `TWF ${twf.feat ? "feat" : "no feat"} off-hand${selfOffhandLight ? " light" : ""}`
      : `TWF ${twf.feat ? "feat" : "no feat"} primary${primaryOffhandLight ? " light off-hand" : ""}`;
    directItems.push({
      source,
      value: twfAttackPenalty,
      type: "feat",
      applied: true,
      targetLabel: "Attack",
    });
  }
  if (rapidShotPenalty)
    directItems.push({
      source: "Rapid Shot",
      value: rapidShotPenalty,
      type: "feat",
      applied: true,
      targetLabel: "Attack",
    });
  if (rapidShotOnThisWeapon)
    directItems.push({
      source: "Rapid Shot",
      value: 1,
      type: "feat",
      applied: true,
      targetLabel: "Extra attack",
    });
  if (twf.offhand && hasPrimaryWeapon && isYes(field("improvedTwf")))
    directItems.push({
      source: "Improved Two-Weapon Fighting",
      value: -5,
      type: "feat",
      applied: true,
      targetLabel: "Extra off-hand attack",
    });
  if (twf.offhand && hasPrimaryWeapon && isYes(field("greaterTwf")))
    directItems.push({
      source: "Greater Two-Weapon Fighting",
      value: -10,
      type: "feat",
      applied: true,
      targetLabel: "Extra off-hand attack",
    });
  const formula = `BAB ${twf.offhand && hasPrimaryWeapon ? "off-hand" : "iteratives"} + extra attacks ${effectExtraAttacks + (rapidShotOnThisWeapon ? 1 : 0)} + scaling ${signed(scalingBonus)} + enhancement ${signed(enhancement)} + size ${signed(sizeAttack)} + misc ${signed(miscBonus)} + buffs ${signed(buffBonus)} + feats ${signed(feat.attackPenalty)} + TWF ${signed(twfAttackPenalty)} + Rapid Shot ${signed(rapidShotPenalty)}`;
  return {
    buffBonus,
    attacks,
    formula,
    breakdown: [...statItems, ...directItems],
  };
}

function recalculateWeapons(buffed, buffBonuses) {
  el("weaponRows")
    .querySelectorAll(".sheet-card")
    .forEach((card) => {
      const attack = calculateWeaponAttack(card, buffed, buffBonuses);
      const damage = calculateWeaponDamage(card, buffed, buffBonuses);
      const attackField = card.querySelector("[data-attack-total]");
      const attackBuffField = card.querySelector("[data-attack-buff]");
      const damageBuffField = card.querySelector("[data-damage-buff]");
      const scalingField = card.querySelector("[data-damage-scaling]");
      const bonusField = card.querySelector("[data-damage-bonus]");
      const totalField = card.querySelector("[data-damage-total]");
      const attackCalc = card.querySelector("[data-weapon-attack-calc]");
      const damageCalc = card.querySelector("[data-weapon-damage-calc]");
      if (attackField) attackField.value = attack.attacks;
      if (attackBuffField) attackBuffField.value = signed(attack.buffBonus);
      if (damageBuffField) damageBuffField.value = signed(damage.buffBonus);
      if (scalingField) scalingField.value = signed(damage.scalingBonus);
      if (bonusField) bonusField.value = signed(damage.totalBonus);
      if (totalField) totalField.value = damage.totalText;
      const extraResults = card.querySelector("[data-extra-damage-results]");
      if (extraResults) {
        extraResults.replaceChildren(...damage.extraDamage.map(({ formula, type }) => {
          const input = document.createElement("input");
          input.className = "form-control form-control-sm";
          input.readOnly = true;
          input.value = `${formula}${type ? ` ${type}` : ""}`;
          input.setAttribute("aria-label", `Additional ${type || "weapon"} damage`);
          return input;
        }));
      }
      if (attackCalc)
        attackCalc.innerHTML = showCalculations
          ? formatBreakdown(attack.breakdown, attack.attacks)
          : "";
      if (damageCalc)
        damageCalc.innerHTML = showCalculations
          ? formatBreakdown(damage.breakdown, damage.totalText)
          : "";
    });
}

function setCalc(id, formula, items = [], currentTotal = null) {
  const line = document.querySelector(`[data-calc-for="${id}"]`);
  if (!line) return;
  const total = currentTotal ?? el(id)?.value ?? "";
  const buffRows = showCalculations ? formatBreakdown(items, total) : "";
  line.innerHTML = buffRows;
  line.classList.remove("d-none");
}

function numericTotalText(currentTotal, bonusValue, statName = "") {
  const text = String(currentTotal ?? "").trim();
  const value = Number(bonusValue || 0);
  const abilityStats = new Set([
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ]);
  if (abilityStats.has(statName)) {
    const score = Number((text.match(/-?\d+/) || [0])[0]) + value;
    return String(score);
  }
  if (/^[+-]?\d+(\/[+-]?\d+)+$/.test(text)) {
    return text
      .split("/")
      .map((part) => signed(Number(part) + value))
      .join("/");
  }
  const diceMatch = text.match(/^(.+?)([+-]\d+)$/);
  if (diceMatch) {
    return `${diceMatch[1]}${signed(Number(diceMatch[2]) + value)}`;
  }
  if (/^[+-]?\d+$/.test(text)) {
    const total = Number(text) + value;
    if (["cmb", "cmd"].includes(String(statName || "").toLowerCase()))
      return String(total);
    return text.startsWith("+") || text.startsWith("-")
      ? signed(total)
      : String(total);
  }
  if (text) return `${text} ${signed(value)}`;
  return signed(value);
}

function conciseBreakdownDetail(detail = "") {
  const text = String(detail || "").trim();
  const match = text.match(/^affects\s+.+?\s+through\s+(.+)$/i);
  return match ? match[1].trim() : text;
}

function isFavoredEnemyBreakdownItem(item = {}) {
  return (
    item.favoredEnemyBonus ||
    item.favoredEnemy ||
    /\bfavou?red\s+enemy\b/i.test(item.source || "")
  );
}

function conditionalBreakdownKey(item = {}, index = 0) {
  if (!isFavoredEnemyBreakdownItem(item)) return `single|${index}`;
  return [
    item.stat || "",
    item.targetLabel || "",
    item.type || "",
    conciseBreakdownDetail(item.detail),
    "favored-enemy",
  ]
    .map((part) => String(part || "").trim().toLowerCase())
    .join("|");
}

function mergedConditionalBreakdownItems(items = []) {
  const groups = new Map();
  items.forEach((item, index) => {
    const key = conditionalBreakdownKey(item, index);
    const value = Number(item.value || 0);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...item,
        value,
        sources: [item.source].filter(Boolean),
      });
      return;
    }
    existing.value += value;
    if (item.source && !existing.sources.includes(item.source))
      existing.sources.push(item.source);
    existing.source =
      isFavoredEnemyBreakdownItem(existing) &&
      existing.sources.length > 1
        ? "Favored Enemy"
        : existing.sources.join(", ");
  });
  return [...groups.values()];
}

function formatBreakdown(items = [], currentTotal = "") {
  const buffItems = items.filter((b) => {
    if (["Formula", "Base"].includes(b.source)) return false;
    if (["derived", "score", "temporary"].includes(b.type)) return false;
    return true;
  });
  if (!buffItems.length) return "";
  const conditionalItems = buffItems.filter(
    (b) => b.conditional || b.applied === "conditional",
  );
  const normalItems = buffItems.filter(
    (b) => !(b.conditional || b.applied === "conditional"),
  );
  const conditionalRows = mergedConditionalBreakdownItems(conditionalItems)
    .map((b) => {
      const target = b.targetLabel
        ? `<span class="badge text-bg-secondary me-1">${escapeHtml(b.targetLabel)}</span>`
        : "";
      const value = Number(b.value || 0);
      const valueClass =
        value > 0
          ? "calc-value-positive"
          : value < 0
            ? "calc-value-negative"
            : "calc-value-neutral";
      const total = numericTotalText(currentTotal, value, b.stat);
      const detail = conciseBreakdownDetail(b.detail);
      const appliesWhen = detail ? ` ${escapeHtml(detail)}` : "";
      const totalWithBonus = `${total} (${signed(value)})`;
      return `<div class="calc-conditional">${target}<strong>${escapeHtml(totalWithBonus)}</strong>${appliesWhen}: <span class="calc-buff-name ${valueClass}">${escapeHtml(b.source)}</span> (${escapeHtml(b.type)})</div>`;
    })
    .join("");
  const normalRows = normalItems
    .map((b) => {
      const detailText = conciseBreakdownDetail(b.detail);
      const detail = detailText ? ` | ${escapeHtml(detailText)}` : "";
      const target = b.targetLabel
        ? `<span class="badge text-bg-secondary me-1">${escapeHtml(b.targetLabel)}</span>`
        : "";
      const label = b.applied === false ? "overridden" : "applied";
      const className =
        b.applied === false ? "calc-overridden" : "calc-applied";
      const value = Number(b.value || 0);
      const valueClass =
        value > 0
          ? "calc-value-positive"
          : value < 0
            ? "calc-value-negative"
            : "calc-value-neutral";
      return `<div class="${className}">${target}${label}: <span class="calc-buff-name ${valueClass}">${escapeHtml(b.source)}</span> <span class="${valueClass}">${signed(value)}</span> (${escapeHtml(b.type)})${detail}</div>`;
    })
    .join("");
  return `<div class="calc-buffs">${conditionalRows ? `<div class="calc-conditional-block"><div class="small text-warning-emphasis fw-semibold">Conditional Effects</div>${conditionalRows}</div>` : ""}${normalRows ? `<div class="calc-buff-block">${normalRows}</div>` : ""}</div>`;
}

function updateAppliedBuffsToggle() {
  const btn = el("showAppliedBuffsToggle");
  if (!btn) return;
  btn.textContent = showCalculations ? "Hide Effects" : "Show Effects";
  btn.classList.toggle("btn-info", showCalculations);
  btn.classList.toggle("btn-outline-info", !showCalculations);
}

function toggleAppliedBuffs() {
  showCalculations = !showCalculations;
  updateAppliedBuffsToggle();
  recalculateSheet();
  queueSheetSave();
}

function recalculateSheet() {
  equipmentEnhancementCache = new WeakMap();
  equipmentEnhancementBuffCache = null;
  applyClassProgressionStats();
  updateCreatureSizeFields();
  syncGeneratedEquipmentCards();
  const skillRankCap = characterSkillRankCap();
  allSkills().forEach(([skill]) =>
    clampSkillRankInput(el(`${skillId(skill)}Ranks`), skillRankCap),
  );
  if (el("bab")) el("bab").value = num("babBase") + num("babMisc");
  const gearAc = calculateGearAc();
  syncArmorCardsDisplay();
  el("acArmor").value = gearAc.armor;
  el("acShield").value = gearAc.shield;
  const buffed = window.PFBuffs?.calculateStatsDetailed(
    calculationBuffs(),
    sheetToBaseline(gearAc),
  );
  const buffTotals = buffed?.totals || {};
  const buffBonuses = buffed?.bonuses || {};
  const buffBreakdown = buffed?.breakdown || {};
  const naturalArmorBase = num("acNaturalBase");
  const naturalArmorMisc = num("acNaturalMisc");
  const naturalArmorTotal =
    buffTotals["natural armor"] ?? naturalArmorBase + naturalArmorMisc;
  el("acNatural").value = naturalArmorTotal;
  ABILITIES.forEach(([key]) => {
    const score = num(`${key}Score`);
    const statName = ABILITY_STAT_NAMES[key];
    el(`${key}Buff`).value = signed(buffBonuses[statName] || 0);
    el(`${key}Total`).value = buffTotals[statName] || score;
    el(`${key}Mod`).value = signed(abilityModFor(key, buffed));
    setCalc(
      `${key}Total`,
      `base ${score} + buffs ${signed(buffBonuses[statName] || 0)}`,
      buffBreakdown[statName],
    );
  });

  const str = abilityModFor("str", buffed);
  const dex = abilityModFor("dex", buffed);
  const acDex = window.PFArmorRules?.dexterityForArmorClass
    ? window.PFArmorRules.dexterityForArmorClass(dex, gearAc.maxDex)
    : dex;
  const con = abilityModFor("con", buffed);
  const wis = abilityModFor("wis", buffed);
  el("hitPointsBuff").value = signed(buffBonuses["hit points"] || 0);
  el("hitPointsTotal").value = buffTotals["hit points"] ?? num("hitPoints");
  setCalc(
    "hitPointsTotal",
    `Base HP ${num("hitPoints")} + CON modifier changes x level ${Math.max(1, num("characterLevel"))}`,
    combinedBreakdowns(buffed, [
      { stat: "constitution", detail: "affects HP through CON" },
      "hit points",
    ]),
  );
  el("initDexMod").value = signed(dex);
  el("initBuff").value = signed(buffBonuses.initiative || 0);
  el("initTotal").value =
    buffTotals.initiative !== undefined
      ? signed(buffTotals.initiative)
      : signed(dex + num("initMisc"));
  setCalc(
    "initTotal",
    `DEX ${signed(dex)} + misc ${signed(num("initMisc"))}`,
    combinedBreakdowns(buffed, [
      { stat: "dexterity", detail: "affects initiative through DEX" },
      "initiative",
    ]),
  );
  el("acDex").value = signed(acDex);
  el("acTotal").value =
    buffTotals.ac ??
    10 +
      num("acArmor") +
      num("acShield") +
      acDex +
      naturalArmorTotal +
      num("acDeflection") +
      num("acMisc");
  el("acBuff").value = signed(buffBonuses.ac || 0);
  el("acTouch").value =
    buffTotals["touch ac"] ?? 10 + acDex + num("acDeflection") + num("acMisc");
  el("acTouchBuff").value = signed(buffBonuses["touch ac"] || 0);
  el("acFlat").value =
    buffTotals["flat-footed ac"] ??
    Number(el("acTotal").value) - Math.max(0, acDex);
  el("acFlatBuff").value = signed(buffBonuses["flat-footed ac"] || 0);
  setCalc(
    "acTotal",
    `10 + armor ${gearAc.armor} + shield ${gearAc.shield} + DEX ${signed(acDex)}${gearAc.maxDex !== null && dex > gearAc.maxDex ? ` (capped from ${signed(dex)} by Max Dex ${signed(gearAc.maxDex)})` : ""} + natural ${naturalArmorTotal} (base ${naturalArmorBase} + misc ${naturalArmorMisc}) + deflection ${num("acDeflection")} + misc ${num("acMisc")}`,
    [...(buffBreakdown.ac || []), ...gearAc.breakdown],
  );

  [
    ["fort", "con", con],
    ["reflex", "dex", dex],
    ["will", "wis", wis],
  ].forEach(([key, abilityKey, abilityValue]) => {
    el(`${key}Ability`).value = signed(abilityValue);
    const buffKey = { fort: "fortitude", reflex: "reflex", will: "will" }[key];
    const saveBaseTotal = num(`${key}Base`) + num(`${key}Misc`);
    el(`${key}Buff`).value = signed(buffBonuses[buffKey] || 0);
    el(`${key}Total`).value =
      buffTotals[buffKey] !== undefined
        ? signed(buffTotals[buffKey])
        : signed(saveBaseTotal + abilityValue);
    setCalc(
      `${key}Total`,
      `base ${signed(num(`${key}Base`))} + misc ${signed(num(`${key}Misc`))} + ${abilityKey.toUpperCase()} ${signed(abilityValue)} + buffs ${signed(buffBonuses[buffKey] || 0)}`,
      combinedBreakdowns(buffed, [
        {
          stat: ABILITY_STAT_NAMES[abilityKey],
          detail: `affects ${buffKey} through ${abilityKey.toUpperCase()}`,
        },
        buffKey,
      ]),
    );
  });

  el("cmbTotal").value =
    buffTotals.cmb !== undefined
      ? String(buffTotals.cmb)
      : String(num("bab") + str + num("cmbMisc"));
  el("cmbBuff").value = signed(buffBonuses.cmb || 0);
  el("cmdTotal").value =
    buffTotals.cmd ?? 10 + num("bab") + str + dex + num("cmdMisc");
  el("cmdBuff").value = signed(buffBonuses.cmd || 0);
  setCalc(
    "cmbTotal",
    `BAB ${signed(num("bab"))} + STR ${signed(str)} + misc ${signed(num("cmbMisc"))}`,
    combinedBreakdowns(buffed, [
      {
        stat: "strength",
        target: "CMB via STR",
        detail: "affects CMB through STR",
      },
      { stat: "cmb", target: "CMB" },
      { stat: "attack", target: "CMB via attack", detail: "applies to CMB" },
    ]),
  );
  setCalc(
    "cmdTotal",
    `10 + BAB ${signed(num("bab"))} + STR ${signed(str)} + DEX ${signed(dex)} + misc ${signed(num("cmdMisc"))}`,
    combinedBreakdowns(buffed, [
      {
        stat: "strength",
        target: "CMD via STR",
        detail: "affects CMD through STR",
      },
      {
        stat: "dexterity",
        target: "CMD via DEX",
        detail: "affects CMD through DEX",
      },
      { stat: "cmd", target: "CMD" },
      {
        stat: "ac",
        target: "CMD via AC",
        detail: "only CMD-valid AC bonus types apply",
      },
      {
        stat: "deflection",
        target: "CMD via deflection",
        detail: "applies to CMD",
      },
    ]),
  );
  recalculateWeapons(buffed, buffBonuses);

  const classSkillSet = characterClassSkillSet();
  const classSkillEffectSet = characterClassSkillKeys();
  allSkills().forEach(([skill]) => {
    const id = skillId(skill);
    const abilityKey = el(`${id}Ability`)?.dataset.ability;
    const abilityValue = abilityModFor(abilityKey, buffed);
    const skillAbilityBuffKey = skillBuffKeyForAbility(abilityKey);
    const specificSkillKey = skillStatKey(skill);
    const familyKey = skillFamilyBonusKey(skill);
    const trainingKey = skillTrainingBonusKey(skill);
    const skillBuff =
      Number(buffBonuses["skill checks"] || 0) +
      Number(buffBonuses[skillAbilityBuffKey] || 0) +
      (familyKey ? Number(buffBonuses[familyKey] || 0) : 0) +
      (trainingKey ? Number(buffBonuses[trainingKey] || 0) : 0) +
      Number(buffBonuses[specificSkillKey] || 0);
    // +3 for ranking a class skill (from any of your classes, or a "X
    // becomes a class skill" grant) -- only once it actually has ranks
    // in it, and never stacking no matter how many sources call it a
    // class skill (a Set already collapses that).
    const effectiveRanks = effectiveSkillRanks(skill, abilityKey);
    const ranks = effectiveRanks.total;
    const isClassSkill = classSkillSetHasSkill(classSkillSet, skill);
    const hasClassSkillEffect = classSkillSetHasSkill(
      classSkillEffectSet,
      skill,
    );
    const hasClassKnowledgeSkillEffect =
      hasClassSkillEffect && isKnowledgeSkill(skill);
    const classSkillBonus = isClassSkill && ranks > 0 ? 3 : 0;
    const classSkillEffectBonus = hasClassSkillEffect
      ? Number(buffBonuses["class skill checks"] || 0)
      : 0;
    const classKnowledgeSkillEffectBonus = hasClassKnowledgeSkillEffect
      ? Number(buffBonuses["class knowledge skill checks"] || 0)
      : 0;
    el(`${id}Ability`).value = String(abilityValue);
    el(`${id}Buff`).value = String(
      skillBuff +
        classSkillEffectBonus +
        classKnowledgeSkillEffectBonus +
        classSkillBonus +
        effectiveRanks.bonus,
    );
    el(`${id}Total`).value = String(
      abilityValue +
        ranks +
        num(`${id}Misc`) +
        skillBuff +
        classSkillEffectBonus +
        classKnowledgeSkillEffectBonus +
        classSkillBonus,
    );
    const classSkillEl = el(`${id}ClassSkill`);
    if (classSkillEl) {
      classSkillEl.classList.toggle("is-class-skill", isClassSkill);
      classSkillEl.title = isClassSkill
        ? "Class skill -- +3 once ranked"
        : "Not a class skill";
    }
    const skillBreakdownItems = combinedBreakdowns(buffed, [
      {
        stat: ABILITY_STAT_NAMES[abilityKey],
        target: `${skill} via ${abilityKey.toUpperCase()}`,
        detail: `affects ${skill} through ${abilityKey.toUpperCase()}`,
      },
      { stat: "skill checks", target: "All skills" },
      {
        stat: skillAbilityBuffKey,
        target: `${abilityKey.toUpperCase()} skills`,
      },
      ...(hasClassSkillEffect
        ? [{ stat: "class skill checks", target: "Class skills" }]
        : []),
      ...(hasClassKnowledgeSkillEffect
        ? [
            {
              stat: "class knowledge skill checks",
              target: "Class Knowledge skills",
            },
          ]
        : []),
      ...(familyKey
        ? [{ stat: familyKey, target: skillFamilyLabel(familyKey) }]
        : []),
      ...(trainingKey
        ? [{ stat: trainingKey, target: skillFamilyLabel(trainingKey) }]
        : []),
      { stat: specificSkillKey, target: skill },
    ]);
    if (classSkillBonus)
      skillBreakdownItems.push({
        source: "Class Skill",
        value: classSkillBonus,
        type: "untyped",
        stat: specificSkillKey,
      });
    if (effectiveRanks.bonus) {
      skillBreakdownItems.push({
        source: effectiveRanks.entries.map((entry) => entry.source).join(", "),
        value: effectiveRanks.bonus,
        type: "bonus ranks",
        stat: specificSkillKey,
        detail: `effective ranks ${effectiveRanks.total}/${skillRankCap}`,
      });
    }
    setCalc(`${id}Total`, "", skillBreakdownItems);
  });
  renderSkillSummaryRows();
  renderCharacterSpellLikeAbilities();
  if (sheetViewMode === "simplified") renderSimplifiedSheet();
}

function buffRefreshKey(characterId = currentSheetId) {
  return characterId
    ? `pf_buffs_updated_${sheetContextKey}_${characterId}`
    : `pf_buffs_updated_${sheetContextKey}`;
}

async function loadActiveBuffs(characterId = currentSheetId) {
  const savedState = characterId
    ? await PFApp.loadBuffState(sheetContextKey, characterId)
    : [];
  if (Array.isArray(savedState)) activeBuffs = savedState;
  else activeBuffs = savedState?.buffs || [];
  lastBuffRefresh = localStorage.getItem(buffRefreshKey(characterId)) || "";
}

async function refreshBuffsIfChanged(force = false, saveAfterRefresh = false) {
  const stamp = localStorage.getItem(buffRefreshKey()) || "";
  if (!force && stamp === lastBuffRefresh) return;
  await loadActiveBuffs();
  recalculateSheet();
  if (saveAfterRefresh && currentSheetId && !isEnemySheetMode)
    await saveSheetNow(true);
}

async function openEffectTrackerModal() {
  const mount = el("sheetEffectTracker");
  if (!mount) return;
  if (!currentSheetId) {
    mount.innerHTML = `<div class="small-text">Select or create a character before managing effects.</div>`;
    return;
  }

  const enemySaveActiveEffects = isEnemySheetMode
    ? async (buffs) => {
        activeBuffs = Array.isArray(buffs) ? buffs : [];
        recalculateSheet();
        const name = el("characterName").value.trim();
        if (!name) {
          setStatus("Enemy name is required before saving.", "warning");
          return;
        }
        const sheet = collectSheet();
        sheet.activeBuffs = activeBuffs;
        const savedEnemy = await PFApp.saveEnemy(
          { id: enemySheetId, name, visible: true, sheet },
          sheetContextKey,
        );
        if (savedEnemy?.id) {
          localStorage.setItem(
            `pf_enemy_sheet_updated_${sheetContextKey}_${savedEnemy.id}`,
            String(Date.now()),
          );
        }
      }
    : null;
  pruneUnavailableRacialTraitActiveBuffs({ persist: true });
  const options = {
    contextKey: sheetContextKey,
    characterId: currentSheetId,
    effectStats: LOOT_EFFECT_STATS,
    activatableAbilities: collectActivatableAbilities(),
    recalculateSpell: async (effect, casterLevel) => {
      const detail = await spellDetailsForCharacter(
        sheetContextKey,
        currentSheetId,
        effect.spellMeta || { name: effect.name },
        casterLevel,
      );
      return detail?.calculations || effect.spellCalculations || null;
    },
    effectPickerEffects: async () => {
      const [spells, catalog] = await Promise.all([
        collectBridgeOwnedSpellEffects(),
        window.PFEffectCatalog?.load?.() || [],
      ]);
      return [
        ...collectActivatableAbilities(),
        ...spells,
        ...catalog,
        ...collectBridgePassiveEffectSources(),
      ];
    },
    choicePoolSkills: allSkills(),
    choicePoolEquipment: currentEffectChoiceEquipment,
    favoredEnemyOptions: characterFavoredEnemyOptions,
    onAuraActivate: async (effect) => {
      const created = await createAuraOnCurrentMap(effect);
      setStatus(
        created
          ? `${effect.name || "Aura"} activated on the current map.`
          : `Place ${isEnemySheetMode ? "this enemy" : "this character"} on the current map before activating an aura.`,
        created ? "success" : "warning",
      );
      return created;
    },
    // Enemies aren't "controlled" by a separate real person the way a
    // PC is -- only route PC effects-with-a-choice through the request
    // flow when someone other than that character's own owner is the
    // one applying it.
    isOwnCharacter: isEnemySheetMode
      ? true
      : !currentSheetOwnerId || currentSheetOwnerId === currentUserId,
    loadActiveEffects: isEnemySheetMode ? async () => activeBuffs : undefined,
    saveActiveEffects: enemySaveActiveEffects || undefined,
    onChange: async (buffs) => {
      activeBuffs = Array.isArray(buffs) ? buffs : [];
      lastBuffRefresh =
        localStorage.getItem(buffRefreshKey()) || String(Date.now());
      const name = el("characterName").value.trim();
      if (!name) {
        setStatus(
          `${isEnemySheetMode ? "Enemy" : "Character"} name is required before saving.`,
          "warning",
        );
        return;
      }
      recalculateSheet();
      if (!isEnemySheetMode)
        await PFApp.saveCharacterSheet(
          name,
          collectSheet(),
          sheetContextKey,
          currentSheetId,
        );
    },
  };

  if (!effectTrackerInstance) {
    effectTrackerInstance = PFEffectTracker.mount(mount, options);
    await effectTrackerInstance.ready;
  } else {
    await effectTrackerInstance.refresh(options);
  }
}

function renderInventoryAttributes(item) {
  const details = item.details || {};
  const rows = [];
  if (item.type === "Weapon") {
    rows.push([
      "Weapon Type",
      details.weaponType || "Melee Weapon (One-Handed)",
    ]);
    if (details.specialMaterial)
      rows.push(["Material", details.specialMaterial]);
    rows.push(["Attack Scales", details.attackScale || "STR"]);
    if (details.damage) rows.push(["Damage", `${details.damage}${details.damageType ? ` ${details.damageType}` : ""}${PFWeaponDamage.format(details.extraDamage)}`]);
    if (details.critical) rows.push(["Critical", details.critical]);
    if (isFirearmWeaponType(details.weaponType) && details.capacity)
      rows.push(["Capacity", details.capacity]);
    if (isFirearmWeaponType(details.weaponType) && details.misfire)
      rows.push(["Misfire", details.misfire]);
    rows.push(["Damage Scales", details.damageScale || "STR"]);
    rows.push(["Enhancement", signed(Number(details.enhancement || 0))]);
    if (details.enchantment) rows.push(["Enchantment", details.enchantment]);
    if (details.details) rows.push(["Details", details.details]);
  } else if (["Armor", "Shield"].includes(item.type)) {
    rows.push(["Bonus", signed(Number(details.bonus || 0))]);
    if (details.specialMaterial)
      rows.push(["Material", details.specialMaterial]);
    rows.push(["Enhancement", signed(Number(details.enhancement || 0))]);
    if (details.enchantment) rows.push(["Enchantment", details.enchantment]);
  }

  if (!rows.length) return "";
  return `
    <div class="inventory-attributes">
      ${rows.map(([label, value]) => `<span class="inventory-attribute"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}
    </div>
  `;
}

function renderInventoryEffects(item) {
  item = {
    ...item,
    ...(window.PFEffectMechanics?.passiveMechanics?.(item) || item),
  };
  const effects = Array.isArray(item.effects) ? item.effects : [];
  const damageReduction = Array.isArray(item.damageReduction)
    ? item.damageReduction
    : [];
  const spellResistance = Array.isArray(item.spellResistance)
    ? item.spellResistance
    : [];
  const immunities = Array.isArray(item.immunities) ? item.immunities : [];
  const applyConditions = Array.isArray(item.applyConditions)
    ? item.applyConditions
    : [];
  const classSkillGrants = Array.isArray(item.classSkillGrants)
    ? item.classSkillGrants
    : [];
  const bonusRanks = Array.isArray(item.bonusRanks) ? item.bonusRanks : [];
  const extraRanksPerLevel = Array.isArray(item.extraRanksPerLevel)
    ? item.extraRanksPerLevel
    : [];
  const featGrants = Array.isArray(item.featGrants) ? item.featGrants : [];
  const sizeChanges = Array.isArray(item.sizeChanges) ? item.sizeChanges : [];
  const spellLikeAbilities = Array.isArray(item.spellLikeAbilities)
    ? item.spellLikeAbilities
    : [];
  const casterLevelBonuses = Array.isArray(item.casterLevelBonuses)
    ? item.casterLevelBonuses
    : [];
  const spellDcBonuses = Array.isArray(item.spellDcBonuses)
    ? item.spellDcBonuses
    : [];
  const effectiveAttributeBonuses = Array.isArray(item.effectiveAttributeBonuses)
    ? item.effectiveAttributeBonuses
    : [];
  const grantDomains = Array.isArray(item.grantDomains) ? item.grantDomains : [];
  const generatedEquipment = Array.isArray(item.generatedEquipment)
    ? item.generatedEquipment
    : [];
  const effectText = (effect) => {
    if (
      String(effect.stat || "")
        .toLowerCase()
        .trim() === "remove dex bonus to ac"
    ) {
      return `Removes DEX bonus to AC${effect.conditional ? ` (${escapeHtml(effect.appliesWhen || "conditional")})` : ""}${effect.stacks ? " stacks" : ""}`;
    }
    if (
      String(effect.stat || "")
        .toLowerCase()
        .trim() === "cannot gain luck bonuses"
    ) {
      return `Cannot gain luck bonuses${effect.conditional ? ` (${escapeHtml(effect.appliesWhen || "conditional")})` : ""}`;
    }
    if (
      String(effect.stat || "")
        .toLowerCase()
        .trim() === "cannot gain morale bonuses"
    ) {
      return `Cannot gain morale bonuses${effect.conditional ? ` (${escapeHtml(effect.appliesWhen || "conditional")})` : ""}`;
    }
    const requirement = window.PFEffectEditor?.attributeRequirementText?.(effect);
    const weaponRestriction =
      effect.weaponTypeRestriction && effect.weaponTypeRestriction !== "all"
        ? `; ${escapeHtml(window.PFEffectStats?.weaponTypeRestrictionLabel?.(effect.weaponTypeRestriction) || effect.weaponTypeRestriction)} only`
        : "";
    const weaponNameRestriction = effect.weaponNameRestriction && effect.weaponNameRestriction !== "all"
      ? `; ${escapeHtml(effect.weaponNameRestriction)} only` : "";
    return `${escapeHtml(titleCaseStat(effect.stat || "effect"))} ${signed(Number(effect.value || 0))} (${escapeHtml(effect.type || "untyped")})${weaponRestriction}${weaponNameRestriction}${effect.conditional ? ` (${escapeHtml(effect.appliesWhen || "conditional")})` : ""}${effect.stacks ? " stacks" : ""}${requirement ? `; ${escapeHtml(requirement)}` : ""}`;
  };
  const lines = [
    ...effects.map(effectText),
    ...damageReduction.map(
      (dr) =>
        `DR ${Number(dr.amount || 0)}/${escapeHtml(String(dr.overcomeType || "").trim() || "-")}`,
    ),
    ...spellResistance.map(
      (sr) =>
        `SR ${Number(sr.amount || 0)}${sr.conditional ? ` (${escapeHtml(sr.appliesWhen || "conditional")})` : ""}`,
    ),
    ...immunities.map(
      (immunity) =>
        `Immune ${escapeHtml(immunityEntryText(immunity))}`,
    ),
    ...applyConditions.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.applyConditionText
          ? window.PFEffectEditor.applyConditionText(entry)
          : `Applies condition: ${appliedConditionName(entry) || "Condition"}`,
      ),
    ),
    ...classSkillGrants.map((grant) =>
      escapeHtml(window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat)),
    ),
    ...bonusRanks.map((entry) =>
      escapeHtml(window.PFEffectEditor.bonusRanksText(entry)),
    ),
    ...extraRanksPerLevel.map((entry) =>
      escapeHtml(window.PFEffectEditor.extraRanksPerLevelText(entry)),
    ),
    ...featGrants.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.featGrantText
          ? window.PFEffectEditor.featGrantText(entry)
          : "Gain feat",
      ),
    ),
    ...sizeChanges.map(
      (entry) =>
        `Size ${Number(entry.value || 0) > 0 ? "+" : ""}${Number(entry.value || 0)}`,
    ),
    ...spellLikeAbilities.map(
      (entry) => {
        const minimumLevel =
          Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
        const levelText =
          minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
        const requirement = spellLikeRequirementText(entry);
        const requirementText = requirement ? `${escapeHtml(requirement)}, ` : "";
        const listName = spellLikeChoiceListName(entry);
        const spellName =
          entry.spellName ||
          entry.spell?.name ||
          (listName ? `Choose from ${listName}` : "Spell");
        return `SLA ${levelText}${requirementText}${entry.frequency ? `${escapeHtml(entry.frequency)}: ` : ""}${escapeHtml(spellName)}`;
      },
    ),
    ...casterLevelBonuses.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.casterLevelBonusText
          ? window.PFEffectEditor.casterLevelBonusText(entry)
          : "Caster Level bonus",
      ),
    ),
    ...spellDcBonuses.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.spellDcBonusText
          ? window.PFEffectEditor.spellDcBonusText(entry)
          : "Spell DC bonus",
      ),
    ),
    ...effectiveAttributeBonuses.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.effectiveAttributeBonusText
          ? window.PFEffectEditor.effectiveAttributeBonusText(entry)
          : "Effective attribute bonus",
      ),
    ),
    ...grantDomains.map((entry) =>
      escapeHtml(
        window.PFEffectEditor?.grantDomainText
          ? window.PFEffectEditor.grantDomainText(entry)
          : "Grant Domain",
      ),
    ),
    ...generatedEquipment.map(
      (entry) =>
        `Generates ${escapeHtml(entry.type || "equipment")}: ${escapeHtml(entry.name || entry.item || "Generated item")}`,
    ),
  ];
  if (!lines.length) return "";
  return `
    <div class="inventory-effects">
      <div class="small-text">Item effects</div>
      ${lines.map((line) => `<div class="inventory-effect">${line}</div>`).join("")}
    </div>
  `;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function normalizeSpellLikeChoicesForSave(choices = {}) {
  return Object.fromEntries(
    Object.entries(choices || {})
      .map(([key, choice]) => {
        const spellName = String(
          choice?.spellName || choice?.spell?.name || choice?.name || "",
        ).trim();
        return spellName ? [key, { spellName }] : null;
      })
      .filter(Boolean),
  );
}

function makeEnemyInventoryItem(source) {
  return {
    id: `enemy-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: source.name || "Item",
    description: source.description || "",
    count: source.count || 1,
    type: source.type || "Item",
    details: cloneJson(source.details || {}),
    effects: cloneJson(source.effects || []),
    damageReduction: cloneJson(source.damageReduction || []),
    spellResistance: cloneJson(source.spellResistance || []),
    immunities: cloneJson(source.immunities || []),
    applyConditions: cloneJson(source.applyConditions || []),
    classSkillGrants: cloneJson(source.classSkillGrants || []),
    bonusRanks: cloneJson(source.bonusRanks || []),
    extraRanksPerLevel: cloneJson(source.extraRanksPerLevel || []),
    featGrants: cloneJson(source.featGrants || []),
    sizeChanges: cloneJson(source.sizeChanges || []),
    spellLikeAbilities: cloneJson(source.spellLikeAbilities || []),
    casterLevelBonuses: cloneJson(source.casterLevelBonuses || []),
    spellDcBonuses: cloneJson(source.spellDcBonuses || []),
    effectiveAttributeBonuses: cloneJson(
      source.effectiveAttributeBonuses || [],
    ),
    grantDomains: cloneJson(source.grantDomains || []),
    generatedEquipment: cloneJson(source.generatedEquipment || []),
    conditionalVariables: cloneJson(source.conditionalVariables || []),
    damageRolls: cloneJson(source.damageRolls || []),
    activeMechanics: cloneJson(source.activeMechanics || null),
  };
}

async function saveEnemyInventoryItems(message = "Enemy inventory updated.") {
  characterInventoryItems = characterInventoryItems.map((item) => ({
    ...item,
    assigned_character_id: currentSheetId,
  }));
  await saveSheetNow(true);
  renderCharacterInventory(characterInventoryItems);
  if (sheetViewMode === "simplified") renderSimplifiedSheet();
  localStorage.setItem(
    `pf_enemy_sheet_updated_${sheetContextKey}_${enemySheetId}`,
    String(Date.now()),
  );
  if (message) setStatus(message, "success");
}

async function addEnemySourceItemToInventory(sourceItemId) {
  const source = enemySourceItems.find((item) => item.id === sourceItemId);
  if (!source || !isEnemySheetMode || !currentSheetId) return;
  characterInventoryItems = [
    ...characterInventoryItems,
    {
      ...makeEnemyInventoryItem(source),
      assigned_character_id: currentSheetId,
    },
  ];
  await saveEnemyInventoryItems(`${source.name} added to enemy inventory.`);
  enemySourceItemModal.hide();
}

function toggleInventoryDetailFields(resetAttackOptions = false) {
  const type = el("inventoryItemType")?.value || "Item";
  const weaponType = el("inventoryWeaponType")?.value;
  const firearm =
    type === "Weapon" && isFirearmWeaponType(weaponType);
  el("inventoryWeaponFields")?.classList.toggle("d-none", type !== "Weapon");
  document
    .querySelectorAll(".inventory-firearm-field")
    .forEach((field) => field.classList.toggle("d-none", !firearm));
  if (!firearm) {
    if (el("inventoryWeaponCapacity")) el("inventoryWeaponCapacity").value = "";
    if (el("inventoryWeaponMisfire")) el("inventoryWeaponMisfire").value = "";
  }
  el("inventoryArmorFields")?.classList.toggle(
    "d-none",
    !["Armor", "Shield"].includes(type),
  );
  if (el("inventoryArmorEnchantment"))
    el("inventoryArmorEnchantment").innerHTML = armorEnchantmentOptions(
      el("inventoryArmorEnchantment").value,
    );
  syncInventoryWeaponAttackOptions(weaponType, resetAttackOptions);
  syncInventorySlotForType();
}

function setInventoryDamageScale(value = "STR") {
  const selected = parseScalingKeys(value).map((key) => key.toUpperCase());
  const activeSet = new Set(selected.length ? selected : ["STR"]);
  el("inventoryDamageScale").value = [...activeSet].join(" + ");
  el("inventoryDamageScaleOptions")
    .querySelectorAll("[data-inventory-scale-ability]")
    .forEach((button) => {
      const active = activeSet.has(button.dataset.inventoryScaleAbility);
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-light", !active);
    });
}

function setInventoryAttackScale(value = "STR") {
  const selected = parseScalingKeys(value).map((key) => key.toUpperCase());
  const activeSet = new Set(selected.length ? selected : ["STR"]);
  el("inventoryAttackScale").value = [...activeSet].join(" + ");
  el("inventoryAttackScaleOptions")
    .querySelectorAll("[data-inventory-attack-scale-ability]")
    .forEach((button) => {
      const active = activeSet.has(button.dataset.inventoryAttackScaleAbility);
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-light", !active);
    });
}

function setupInventoryScalingControls() {
  el("inventoryDamageScaleOptions")
    ?.querySelectorAll("[data-inventory-scale-ability]")
    .forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [
          ...el("inventoryDamageScaleOptions").querySelectorAll(".btn-primary"),
        ].map((btn) => btn.dataset.inventoryScaleAbility);
        el("inventoryDamageScale").value = (
          selected.length ? selected : ["STR"]
        ).join(" + ");
      });
    });
  el("inventoryAttackScaleOptions")
    ?.querySelectorAll("[data-inventory-attack-scale-ability]")
    .forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [
          ...el("inventoryAttackScaleOptions").querySelectorAll(".btn-primary"),
        ].map((btn) => btn.dataset.inventoryAttackScaleAbility);
        el("inventoryAttackScale").value = (
          selected.length ? selected : ["STR"]
        ).join(" + ");
      });
    });
}

function inventoryAttackCheckbox(field) {
  return el(INVENTORY_WEAPON_ATTACK_OPTION_IDS[field]);
}

function setInventoryAttackCheckbox(field, value) {
  const input = inventoryAttackCheckbox(field);
  if (input) input.checked = isYes(value);
}

function inventoryAttackCheckboxValue(field) {
  return inventoryAttackCheckbox(field)?.checked ? "yes" : "no";
}

function clearInventoryAttackOptions(fields) {
  fields.forEach((field) => {
    const input = inventoryAttackCheckbox(field);
    if (input) input.checked = false;
  });
}

function syncInventoryTwfFeatControls() {
  const featOffhand = inventoryAttackCheckbox("twfFeatOff")?.checked;
  document
    .querySelectorAll("[data-inventory-twf-offhand-feat-option]")
    .forEach((field) => field.classList.toggle("d-none", !featOffhand));
  if (!featOffhand) clearInventoryAttackOptions(["improvedTwf", "greaterTwf"]);
}

function enforceInventoryTwfChoice(input) {
  if (!input) return;
  const field =
    Object.entries(INVENTORY_WEAPON_ATTACK_OPTION_IDS).find(
      ([, id]) => id === input.id,
    )?.[0] || input.dataset.inventoryTwfOption;
  if (!field || !input.checked) {
    syncInventoryTwfFeatControls();
    return;
  }
  if (field === "twoHanded") {
    clearInventoryAttackOptions([
      ...TWF_MODE_FIELDS,
      "improvedTwf",
      "greaterTwf",
    ]);
    syncInventoryTwfFeatControls();
    return;
  }
  if (TWF_MODE_FIELDS.includes(field)) {
    setInventoryAttackCheckbox("twoHanded", false);
    TWF_MODE_FIELDS.forEach((otherField) => {
      if (otherField !== field) setInventoryAttackCheckbox(otherField, false);
    });
  }
  if (field === "greaterTwf") {
    setInventoryAttackCheckbox("improvedTwf", true);
  }
  syncInventoryTwfFeatControls();
}

function syncInventoryWeaponAttackOptions(weaponType, resetInvalid = false) {
  const type = el("inventoryItemType")?.value || "Item";
  const isWeapon = type === "Weapon";
  const melee = isWeapon && isMeleeWeaponType(weaponType);
  const ranged = isWeapon && isRangedWeaponType(weaponType);
  const twoHandedCompatible =
    isWeapon &&
    melee &&
    !["Natural Weapon", "Melee Weapon (Light)"].includes(weaponType);
  el("inventoryWeaponAttackOptions")?.classList.toggle("d-none", !isWeapon);
  document
    .querySelectorAll("[data-inventory-melee-weapon-option]")
    .forEach((field) => field.classList.toggle("d-none", !melee));
  document
    .querySelectorAll("[data-inventory-ranged-weapon-option]")
    .forEach((field) => field.classList.toggle("d-none", !ranged));
  document
    .querySelectorAll("[data-inventory-twf-compatible-option]")
    .forEach((field) =>
      field.classList.toggle("d-none", !twoHandedCompatible),
    );
  if (resetInvalid || !isWeapon) {
    if (!melee) {
      clearInventoryAttackOptions([
        "twoHanded",
        "powerAttack",
        ...TWF_MODE_FIELDS,
        "improvedTwf",
        "greaterTwf",
      ]);
    }
    if (!ranged) clearInventoryAttackOptions(["deadlyAim", "rapidShot"]);
    if (!twoHandedCompatible) setInventoryAttackCheckbox("twoHanded", false);
  }
  syncInventoryTwfFeatControls();
}

function setInventoryWeaponAttackOptions(details = {}) {
  Object.keys(INVENTORY_WEAPON_ATTACK_OPTION_IDS).forEach((field) => {
    const snakeField = field.replace(
      /[A-Z]/g,
      (match) => `_${match.toLowerCase()}`,
    );
    setInventoryAttackCheckbox(field, details[field] || details[snakeField]);
  });
  el("inventoryAttackMisc").value =
    details.attackMisc || details.attack_misc || "0";
  el("inventoryDamageMisc").value =
    details.damageMisc || details.damage_misc || "0";
}

function setupInventoryAttackOptionControls() {
  Object.values(INVENTORY_WEAPON_ATTACK_OPTION_IDS).forEach((id) => {
    const input = el(id);
    if (!input || input.dataset.bound === "true") return;
    input.dataset.bound = "true";
    input.addEventListener("change", () => enforceInventoryTwfChoice(input));
  });
}

function collectInventoryDetails() {
  const type = el("inventoryItemType").value;
  const slot = el("inventorySlotInput").value.trim();
  const slotDetails = { slot };
  if (type === "Weapon") {
    const weaponType =
      el("inventoryWeaponType").value || "Melee Weapon (One-Handed)";
    const details = {
      ...slotDetails,
      weaponType,
      attackScale: el("inventoryAttackScale").value.trim() || "STR",
      damage: el("inventoryDamageDice").value.trim(),
      damageType: el("inventoryDamageType").value.trim(),
      extraDamage: PFWeaponDamage.collect(el("inventoryExtraDamage")),
      critical: el("inventoryWeaponCritical").value.trim(),
      damageScale: el("inventoryDamageScale").value.trim() || "STR",
      attackMisc: el("inventoryAttackMisc").value || "0",
      damageMisc: el("inventoryDamageMisc").value || "0",
      enhancement: el("inventoryWeaponEnhancement").value || "0",
      enchantment: el("inventoryWeaponEnchantment").value.trim(),
      specialMaterial: el("inventorySpecialMaterial").value,
      details: el("inventoryWeaponDetails").value.trim(),
      twoHanded: inventoryAttackCheckboxValue("twoHanded"),
      powerAttack: inventoryAttackCheckboxValue("powerAttack"),
      deadlyAim: inventoryAttackCheckboxValue("deadlyAim"),
      rapidShot: inventoryAttackCheckboxValue("rapidShot"),
      twfNoFeatPrimary: inventoryAttackCheckboxValue("twfNoFeatPrimary"),
      twfNoFeatOff: inventoryAttackCheckboxValue("twfNoFeatOff"),
      twfFeatPrimary: inventoryAttackCheckboxValue("twfFeatPrimary"),
      twfFeatOff: inventoryAttackCheckboxValue("twfFeatOff"),
      improvedTwf: inventoryAttackCheckboxValue("improvedTwf"),
      greaterTwf: inventoryAttackCheckboxValue("greaterTwf"),
    };
    if (isFirearmWeaponType(weaponType)) {
      details.capacity = el("inventoryWeaponCapacity").value.trim();
      details.misfire = el("inventoryWeaponMisfire").value.trim();
    }
    return details;
  }
  if (["Armor", "Shield"].includes(type)) {
    return {
      ...slotDetails,
      bonus: Number(el("inventoryArmorBonus").value || 0),
      enhancement: Number(el("inventoryArmorEnhancement").value || 0),
      enchantment: el("inventoryArmorEnchantment").value.trim(),
      specialMaterial: el("inventorySpecialMaterial").value,
    };
  }
  return slotDetails;
}

function openInventoryItemEditor(itemId) {
  const item = characterInventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;

  editingInventoryItemId = item.id;
  el("inventoryItemName").value = item.name || "";
  el("inventoryItemDescription").value = item.description || "";
  el("inventoryItemCount").value = item.count || 1;
  el("inventoryItemType").value = item.type || "Item";
  const details = item.details || {};
  PFItemEditor.setSlot(inventoryEditorConfig(), details.slot || "");
  el("inventoryWondrousItem").checked =
    String(details.source || item.sourceType || "").toLowerCase() ===
    "wondrous item";
  updateInventorySlotPreview();
  PFItemEditor.refreshDescription(inventoryEditorConfig());
  el("inventoryWeaponType").value =
    details.weaponType || "Melee Weapon (One-Handed)";
  setInventoryAttackScale(details.attackScale || "STR");
  el("inventoryDamageDice").value = details.damage || "";
  el("inventoryDamageType").value = details.damageType || "";
  PFWeaponDamage.mount(el("inventoryExtraDamage"), details.extraDamage);
  el("inventoryWeaponCritical").value = details.critical || "";
  el("inventoryWeaponCapacity").value = details.capacity || "";
  el("inventoryWeaponMisfire").value = details.misfire || "";
  setInventoryDamageScale(details.damageScale || "STR");
  el("inventoryWeaponEnhancement").value = details.enhancement || "0";
  el("inventoryWeaponEnchantment").value = details.enchantment || "";
  el("inventoryWeaponDetails").value = details.details || "";
  setInventoryWeaponAttackOptions(details);
  el("inventoryArmorBonus").value = details.bonus ?? 0;
  el("inventoryArmorEnhancement").value = details.enhancement ?? 0;
  el("inventoryArmorEnchantment").value = details.enchantment || "";
  PFItemEditor.syncSpecialMaterialForType(
    inventoryEditorConfig(),
    details.specialMaterial || "",
  );
  inventoryEffectsAccordion.reset(item);
  toggleInventoryDetailFields();
  syncInventorySlotForType();
  inventoryItemModal = bootstrap.Modal.getOrCreateInstance(
    el("inventoryItemModal"),
  );
  inventoryItemModal.show();
}

async function submitInventoryItemEdit(event) {
  event.preventDefault();
  const item = characterInventoryItems.find(
    (entry) => entry.id === editingInventoryItemId,
  );
  if (!item) return;
  const name = el("inventoryItemName").value.trim();
  if (!name) return;

  if (isEnemySheetMode) {
    const updatedEnemyDetails = applyWondrousSource(
      { ...cloneJson(item.details || {}), ...collectInventoryDetails() },
      el("inventoryWondrousItem").checked,
    );
    const updatedEnemyItem = {
      ...item,
      name,
      description: el("inventoryItemDescription").value.trim(),
      count: el("inventoryItemCount").value,
      type: el("inventoryItemType").value,
      details: updatedEnemyDetails,
      ...inventoryEffectsAccordion.collect(),
    };
    characterInventoryItems = characterInventoryItems.map((entry) =>
      entry.id === editingInventoryItemId
        ? {
            ...entry,
            ...updatedEnemyItem,
          }
        : entry,
    );
    renderCharacterInventory(characterInventoryItems);
    updateWornCardFromLoot(updatedEnemyItem);
    recalculateSheet();
    queueSheetSave();
    if (isLootEquipped(updatedEnemyItem.id))
      syncEquippedLootBuffFromItem(updatedEnemyItem);
    inventoryItemModal?.hide();
    editingInventoryItemId = null;
    await saveEnemyInventoryItems("Enemy inventory item updated.");
    return;
  }

  const savedDetails = applyWondrousSource(
    { ...cloneJson(item.details || {}), ...collectInventoryDetails() },
    el("inventoryWondrousItem").checked,
  );
  const saved = await PFApp.saveLootItem(
    {
      id: item.id,
      name,
      description: el("inventoryItemDescription").value.trim(),
      count: el("inventoryItemCount").value,
      type: el("inventoryItemType").value,
      assignedCharacterId: item.assigned_character_id || currentSheetId,
      details: savedDetails,
      ...inventoryEffectsAccordion.collect(),
    },
    sheetContextKey,
  );

  if (!saved) {
    setStatus("Could not update inventory item.", "danger");
    return;
  }

  characterInventoryItems = characterInventoryItems.map((entry) =>
    entry.id === item.id ? saved : entry,
  );
  renderCharacterInventory(characterInventoryItems);
  updateWornCardFromLoot(saved);
  recalculateSheet();
  queueSheetSave();
  if (isLootEquipped(saved.id) && syncEquippedLootBuffFromItem(saved)) {
    await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
    localStorage.setItem(buffRefreshKey(), String(Date.now()));
    recalculateSheet();
  }

  inventoryItemModal?.hide();
  editingInventoryItemId = null;
  await loadCharacterInventory();
  setStatus("Inventory item updated.", "success");
}

async function deleteInventoryItemAmount(itemId, amountOverride = null) {
  const item = characterInventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;

  const total = Number(item.count || 1);
  const parsedAmount =
    Number.parseInt(el("deleteInventoryItemCount").value, 10) || 1;
  const amount = Math.max(1, Math.min(total, amountOverride ?? parsedAmount));
  if (isEnemySheetMode) {
    if (amount >= total) {
      removeEquippedLoot(item.id);
      recalculateSheet();
      queueSheetSave();
    }
    characterInventoryItems =
      amount >= total
        ? characterInventoryItems.filter((entry) => entry.id !== itemId)
        : characterInventoryItems.map((entry) =>
            entry.id === itemId ? { ...entry, count: total - amount } : entry,
          );
    pendingInventoryDeleteId = null;
    deleteInventoryItemModal?.hide();
    await saveEnemyInventoryItems("Enemy inventory item deleted.");
    return;
  }
  let ok = false;

  if (amount >= total) {
    ok = await PFApp.deleteLootItem(item.id);
    if (ok) {
      removeEquippedLoot(item.id);
      await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
      localStorage.setItem(buffRefreshKey(), String(Date.now()));
      recalculateSheet();
      queueSheetSave();
    }
  } else {
    ok = Boolean(
      await PFApp.saveLootItem(
        {
          id: item.id,
          name: item.name,
          description: item.description,
          count: total - amount,
          type: item.type,
          assignedCharacterId: item.assigned_character_id || currentSheetId,
          details: item.details,
          ...(window.PFEffectMechanics?.mechanicPayload?.(item) || {
            effects: item.effects,
          }),
        },
        sheetContextKey,
      ),
    );
  }

  if (!ok) {
    setStatus("Could not delete inventory item.", "danger");
    return;
  }

  pendingInventoryDeleteId = null;
  deleteInventoryItemModal?.hide();
  await loadCharacterInventory();
  setStatus("Inventory item deleted.", "success");
}

function requestInventoryItemDelete(itemId) {
  const item = characterInventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  const total = Number(item.count || 1);
  if (total <= 1) {
    void deleteInventoryItemAmount(item.id, 1);
    return;
  }
  pendingInventoryDeleteId = item.id;
  el("deleteInventoryItemSummary").textContent =
    `${item.name} is assigned to this character. If fully deleted, equipped copies and item effects will be removed.`;
  el("deleteInventoryItemCount").max = String(total);
  el("deleteInventoryItemCount").value = String(total);
  el("deleteInventoryItemMax").textContent = `Max: ${total}`;
  deleteInventoryItemModal = bootstrap.Modal.getOrCreateInstance(
    el("deleteInventoryItemModal"),
  );
  deleteInventoryItemModal.show();
}

async function submitInventoryItemDelete(event) {
  event.preventDefault();
  if (!pendingInventoryDeleteId) return;
  await deleteInventoryItemAmount(pendingInventoryDeleteId);
}

function inventoryItemGroupType(item) {
  if (item.type === "Weapon") return "Weapon";
  if (item.type === "Armor") return "Armor";
  if (item.type === "Shield") return "Shield";
  if (
    String(item.details?.source || item.sourceType || "").toLowerCase() ===
    "wondrous item"
  )
    return "Wondrous";
  return "Item";
}

function renderCharacterInventory(items = []) {
  const container = el("characterInventory");
  if (!container) return;

  if (!currentSheetId) {
    container.innerHTML = `<div class="small-text">Save or select a character to show assigned loot.</div>`;
    return;
  }

  if (!items.length) {
    container.innerHTML = `<div class="small-text">No loot assigned to this character.</div>`;
    return;
  }

  const groups = [
    ["Weapon", "Weapons"],
    ["Armor", "Armor"],
    ["Shield", "Shields"],
    ["Wondrous", "Wondrous Items"],
    ["Item", "Items"],
  ];
  container.innerHTML = groups
    .map(([type, label]) => {
      const groupItems = items.filter(
        (item) => inventoryItemGroupType(item) === type,
      );
      if (!groupItems.length) return "";
      return `
      <div class="inventory-group">
        <div class="inventory-group-title">${label}</div>
        <div class="inventory-group-grid">
          ${groupItems
            .map((item) => {
              const equipped = isLootEquipped(item.id);
              return `
            <article class="inventory-item${equipped ? " equipped" : ""}" data-loot-id="${escapeHtml(item.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.name)} details">
              <div class="inventory-card-head">
                <div class="inventory-card-title">
                  <div class="inventory-card-name fw-semibold" title="${escapeHtml(item.name)}">
                    <span class="inventory-card-icon">${sourceItemIcon(item)}</span>
                    <span class="inventory-card-name-text">${escapeHtml(item.name)}</span>
                  </div>
                </div>
                <span class="inventory-count-actions">
                  <span class="inventory-count">x${escapeHtml(item.count || 1)}</span>
                  <button class="btn ${equipped ? "btn-success" : "btn-outline-success"} btn-sm inventory-icon-btn" type="button" data-wear-loot="${escapeHtml(item.id)}" aria-label="${equipped ? "Unequip" : "Equip"} ${escapeHtml(item.name)}" title="${equipped ? "Unequip" : "Equip"}">
                    <i class="bi ${equipped ? "bi-box-arrow-up" : "bi-box-arrow-in-down"}"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm inventory-icon-btn" type="button" data-delete-inventory-loot="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">
                    <i class="bi bi-trash"></i>
                  </button>
                </span>
              </div>
            </article>
          `;
            })
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");

  container.querySelectorAll("[data-wear-loot]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      wearLootItem(items.find((item) => item.id === button.dataset.wearLoot));
    });
  });
  container
    .querySelectorAll("[data-delete-inventory-loot]")
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        requestInventoryItemDelete(button.dataset.deleteInventoryLoot);
      });
    });
  container.querySelectorAll(".inventory-item").forEach((card) => {
    card.addEventListener("click", () =>
      openInventoryItemEditor(card.dataset.lootId),
    );
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openInventoryItemEditor(card.dataset.lootId);
      }
    });
  });
}

async function wearLootItem(item) {
  if (!item) return;
  if (!isLootEquipped(item.id)) {
    const passive = window.PFEffectMechanics?.passiveMechanics?.(item) || item;
    if (window.PFEffectMechanics?.hasBranches?.(passive)) {
      const resolved = await resolveMechanicBranchChoice(
        { ...item, ...passive },
        item.name || "Item",
      );
      if (!resolved) return;
      item = resolved;
    }
  }
  const details = item.details || {};
  if (isLootEquipped(item.id)) {
    removeEquippedLoot(item.id);
    if (isEnemySheetMode) {
      await saveSheetNow(true);
      localStorage.setItem(
        `pf_enemy_sheet_updated_${sheetContextKey}_${enemySheetId}`,
        String(Date.now()),
      );
    } else {
      await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
      localStorage.setItem(buffRefreshKey(), String(Date.now()));
    }
    recalculateSheet();
    queueSheetSave();
    renderCharacterInventory(characterInventoryItems);
    if (sheetViewMode === "simplified") renderSimplifiedSheet();
    setStatus(`${item.name} unequipped.`, "success");
    return;
  }

  if (item.type === "Weapon") {
    addWeapon({
      name: item.name,
      sourceLootId: item.id,
      weaponType: details.weaponType || "Melee Weapon (One-Handed)",
      attackScale: details.attackScale || "STR",
      damage: details.damage || "",
      damageType: details.damageType || "",
      extraDamage: details.extraDamage || [],
      damageScale: details.damageScale || "STR",
      enhancement: details.enhancement || "0",
      enchantment: details.enchantment || "",
      specialMaterial: details.specialMaterial || "",
      details: details.details || "",
      range: details.range || "",
      critical: details.critical || "",
      capacity: details.capacity || "",
      misfire: details.misfire || "",
    });
  } else if (["Armor", "Shield"].includes(item.type)) {
    addArmor({
      item: item.name,
      sourceLootId: item.id,
      type:
        item.type === "Shield"
          ? "Shield"
          : item.type === "Armor"
            ? "Armor"
            : "Gear",
      bonus: details.bonus ?? 0,
      enhancement: details.enhancement ?? 0,
      enchantment: details.enchantment || "",
      specialMaterial: details.specialMaterial || "",
      armorGroup: details.armorGroup || item.type,
      maxDex: details.maxDex ?? null,
      penalty: details.penalty ?? null,
      failure: details.failure ?? null,
    });
  } else {
    addGear({
      item: item.name,
      sourceLootId: item.id,
      slot: details.slot || "",
      details: details.details || item.description || "",
    });
  }

  if (syncEquippedLootBuffFromItem(item)) {
    if (isEnemySheetMode) {
      await saveSheetNow(true);
      localStorage.setItem(
        `pf_enemy_sheet_updated_${sheetContextKey}_${enemySheetId}`,
        String(Date.now()),
      );
    } else {
      await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
      localStorage.setItem(buffRefreshKey(), String(Date.now()));
    }
  }

  recalculateSheet();
  queueSheetSave();
  renderCharacterInventory(characterInventoryItems);
  if (sheetViewMode === "simplified") renderSimplifiedSheet();
}

async function syncCharacterInventoryWithEquipment(preloadedLoot = null) {
  if (isEnemySheetMode) {
    characterInventoryItems = characterInventoryItems.map((item) => ({
      ...item,
      assigned_character_id: currentSheetId,
    }));
    return;
  }
  if (!currentSheetId) {
    characterInventoryItems = [];
    return;
  }

  const loot = Array.isArray(preloadedLoot)
    ? preloadedLoot
    : await PFApp.loadLootItems(sheetContextKey);
  characterInventoryItems = loot.filter(
    (item) => item.assigned_character_id === currentSheetId,
  );
  await reconcileEquippedLoot(loot);
}

async function loadCharacterInventory(preloadedLoot = null) {
  await syncCharacterInventoryWithEquipment(preloadedLoot);
  renderCharacterInventory(characterInventoryItems);
  if (sheetViewMode === "simplified") renderSimplifiedSheet();
}

async function reconcileEquippedLoot(allLoot = []) {
  const ownedLoot = (allLoot || []).filter(
    (item) => item.assigned_character_id === currentSheetId,
  );
  const validIds = new Set(ownedLoot.map((item) => item.id));
  let changed = false;
  ownedLoot.forEach((item) => {
    if (isLootEquipped(item.id)) {
      updateWornCardFromLoot(item);
      if (syncEquippedLootBuffFromItem(item)) changed = true;
    }
  });
  ["weaponRows", "armorRows", "gearRows"].forEach((containerId) => {
    el(containerId)
      .querySelectorAll(".sheet-card")
      .forEach((card) => {
        const sourceLootId =
          card.querySelector('[data-field="sourceLootId"]')?.value || "";
        if (sourceLootId && !validIds.has(sourceLootId))
          changed = removeEquippedLoot(sourceLootId) || changed;
      });
  });
  const nextBuffs = activeBuffs.filter(
    (buff) => !buff.sourceLootId || validIds.has(buff.sourceLootId),
  );
  if (nextBuffs.length !== activeBuffs.length) {
    activeBuffs = nextBuffs;
    await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
    localStorage.setItem(buffRefreshKey(), String(Date.now()));
    changed = true;
  }
  if (changed) {
    await PFApp.saveBuffState(activeBuffs, sheetContextKey, currentSheetId);
    localStorage.setItem(buffRefreshKey(), String(Date.now()));
    recalculateSheet();
    queueSheetSave();
  }
}

function collectCards(containerId) {
  return [...el(containerId).querySelectorAll(".sheet-card")].map((card) => {
    const data = {};
    card.querySelectorAll("[data-field]").forEach((input) => {
      data[input.dataset.field] =
        input.type === "checkbox"
          ? input.checked
            ? "yes"
            : "no"
          : input.value;
    });
    return data;
  });
}

function currentEffectChoiceEquipment() {
  return {
    weapons: collectCards("weaponRows"),
    armor: collectCards("armorRows"),
  };
}

function collectPersistedCards(containerId) {
  return [...el(containerId).querySelectorAll(".sheet-card")]
    .filter((card) => card.dataset.generatedEquipment !== "true")
    .map((card) => {
      const data = {};
      card.querySelectorAll("[data-field]").forEach((input) => {
        data[input.dataset.field] =
          input.type === "checkbox"
            ? input.checked
              ? "yes"
              : "no"
            : input.value;
      });
      delete data.generatedEquipmentId;
      delete data.generatedSource;
      return data;
    });
}

function collectCalculatedSummary() {
  const gearAc = calculateGearAc();
  const conditionalGroups = simpleConditionalsByStat();
  const classSkillEffectSet = characterClassSkillKeys();
  const abilityRows = ABILITIES.map(([key, label]) => ({
    key,
    label,
    total: abilityDisplayValue(key),
    mod: el(`${key}Mod`)?.value || "",
    conditionals: conditionalGroups[ABILITY_STAT_NAMES[key]] || [],
  }));
  const saveRows = SAVES.map(([key, label]) => ({
    key,
    label,
    total: el(`${key}Total`)?.value || "",
    conditionals:
      conditionalGroups[
        { fort: "fortitude", reflex: "reflex", will: "will" }[key]
      ] || [],
  }));
  const skillRows = allSkills().map(([skill, ability]) => {
    const id = skillId(skill);
    const currentTotal = el(`${id}Total`)?.value || "";
    const familyKey = skillFamilyBonusKey(skill);
    const trainingKey = skillTrainingBonusKey(skill);
    const skillKey = skillStatKey(skill);
    const hasClassSkillEffect = classSkillSetHasSkill(classSkillEffectSet, skill);
    const hasClassKnowledgeSkillEffect =
      hasClassSkillEffect && isKnowledgeSkill(skill);
    return {
      key: id,
      label: skill,
      total: currentTotal,
      conditionals: [
        ...conditionalTableRows("skill checks", conditionalGroups, currentTotal),
        ...conditionalTableRows(
          skillBuffKeyForAbility(ability),
          conditionalGroups,
          currentTotal,
        ),
        ...(familyKey
          ? conditionalTableRows(familyKey, conditionalGroups, currentTotal)
          : []),
        ...(trainingKey
          ? conditionalTableRows(trainingKey, conditionalGroups, currentTotal)
          : []),
        ...(hasClassSkillEffect
          ? conditionalTableRows(
              "class skill checks",
              conditionalGroups,
              currentTotal,
            )
          : []),
        ...(hasClassKnowledgeSkillEffect
          ? conditionalTableRows(
              "class knowledge skill checks",
              conditionalGroups,
              currentTotal,
            )
          : []),
        ...conditionalTableRows(skillKey, conditionalGroups, currentTotal),
      ],
    };
  });

  const weaponRows = [...el("weaponRows").querySelectorAll(".sheet-card")].map(
    (card) => {
      const range = card.querySelector('[data-field="range"]')?.value || "";
      const attackScale =
        card.querySelector('[data-field="attackScale"]')?.value || "";
      const weaponType =
        card.querySelector('[data-field="weaponType"]')?.value || "";
      const attack = card.querySelector("[data-attack-total]")?.value || "";
      const damage = card.querySelector("[data-damage-total]")?.value || "";
      const isRanged =
        isRangedWeaponType(weaponType) ||
        Boolean(range.trim()) ||
        parseScalingKeys(attackScale).includes("dex");
      return {
        name: card.querySelector('[data-field="name"]')?.value || "Weapon",
        attack,
        damage,
        critical: card.querySelector('[data-field="critical"]')?.value || "",
        attackConditionals: simpleConditionalListRows(
          "Attack",
          attack,
          ["attack", isRanged ? "ranged attack" : "melee attack"],
          conditionalGroups,
        ),
        damageConditionals: simpleConditionalListRows(
          "Damage",
          damage,
          ["damage", isRanged ? "ranged damage" : "melee damage"],
          conditionalGroups,
        ),
      };
    },
  );
  const finalSize = finalCreatureSize();
  const baseSize = normalizeCreatureSize(el("size")?.value || "Medium");
  const skillRanks = extraRanksPerLevelSummary();

  return {
    size: {
      base: baseSize,
      final: finalSize.name,
      reach: finalSize.reach,
      space: finalSize.space,
      tokenSize: finalSize.tokenSize,
      changes: collectSizeChangeEntries(),
    },
    conditionals: conditionalGroups,
    hp: {
      current: el("currentHitPoints")?.value || "",
      total: el("hitPointsTotal")?.value || el("hitPoints")?.value || "",
    },
    initiative: el("initTotal")?.value || "",
    abilities: abilityRows,
    armorClass: {
      ac: el("acTotal")?.value || "",
      touch: el("acTouch")?.value || "",
      flat: el("acFlat")?.value || "",
      maxDex: gearAc.maxDex,
      spellFailure: gearAc.spellFailure,
      conditionals: {
        ac: conditionalGroups.ac || [],
        touch: conditionalGroups["touch ac"] || [],
        flat: conditionalGroups["flat-footed ac"] || [],
      },
    },
    combat: {
      cmb: el("cmbTotal")?.value || "",
      cmd: el("cmdTotal")?.value || "",
      conditionals: {
        cmb: conditionalGroups.cmb || [],
        cmd: conditionalGroups.cmd || [],
      },
    },
    initiativeConditionals: conditionalGroups.initiative || [],
    hpConditionals: conditionalGroups["hit points"] || [],
    saves: saveRows,
    skillRanks,
    skills: skillRows,
    weapons: weaponRows,
  };
}

function renderSimplifiedSheet() {
  const container = el("simplifiedSheetView");
  if (!container) return;

  const conditionalGroups = simpleConditionalsByStat();
  const abilityRows = ABILITIES.flatMap(([key, label]) => [
    [label, abilityDisplayValue(key)],
    ...conditionalTableRows(ABILITY_STAT_NAMES[key], conditionalGroups),
  ]);
  const saveRows = SAVES.flatMap(([key, label]) => [
    [label, fieldValue(`${key}Total`)],
    ...conditionalTableRows(
      { fort: "fortitude", reflex: "reflex", will: "will" }[key],
      conditionalGroups,
    ),
  ]);
  const skillRows = simpleSkillRows(conditionalGroups);
  const weaponRows = [...el("weaponRows").querySelectorAll(".sheet-card")].map(
    (card) => {
      const name =
        card.querySelector('[data-field="name"]')?.value || "Unnamed weapon";
      const attackTotal =
        card.querySelector("[data-attack-total]")?.value || "";
      const damageTotal =
        card.querySelector("[data-damage-total]")?.value || "";
      const critical =
        card.querySelector('[data-field="critical"]')?.value || "";
      const range = card.querySelector('[data-field="range"]')?.value || "";
      const attackScale =
        card.querySelector('[data-field="attackScale"]')?.value || "";
      const weaponType =
        card.querySelector('[data-field="weaponType"]')?.value || "";
      const isRanged =
        isRangedWeaponType(weaponType) ||
        Boolean(range.trim()) ||
        parseScalingKeys(attackScale).includes("dex");
      const attackConditionals = simpleConditionalListRows(
        "Attack",
        attackTotal,
        ["attack", isRanged ? "ranged attack" : "melee attack"],
        conditionalGroups,
      );
      const damageConditionals = simpleConditionalListRows(
        "Damage",
        damageTotal,
        ["damage", isRanged ? "ranged damage" : "melee damage"],
        conditionalGroups,
      );
      return [
        name,
        attackTotal,
        damageTotal,
        critical,
        attackConditionals,
        damageConditionals,
        [...card.querySelectorAll("[data-extra-damage-results] input")].map((input) => input.value),
      ];
    },
  );
  const armorRows = [...el("armorRows").querySelectorAll(".sheet-card")].map(
    (card) => ({
      name: card.querySelector('[data-field="item"]')?.value || "Unnamed item",
      details: [
        {
          label: "Total",
          value: card.querySelector("[data-armor-total]")?.value || "",
        },
      ],
    }),
  );
  const gearRows = [...el("gearRows").querySelectorAll(".sheet-card")].map(
    (card) => ({
      name:
        card.querySelector('[data-field="item"]')?.value || "Unnamed equipment",
      details: [],
    }),
  );
  const inventoryRows = characterInventoryItems.filter(
    (item) => item.assigned_character_id === currentSheetId,
  );

  container.innerHTML = `
    <section class="simple-section">
      <div class="simple-grid simple-top-grid">
        ${simpleStat("Character", fieldValue("characterName"))}
        ${simpleStat("Level", fieldValue("characterLevel"))}
        ${simpleStat("HP", `${fieldValue("currentHitPoints", "0")}/${fieldValue("hitPointsTotal", "0")}`)}
        ${simpleConditionalStats("hit points", conditionalGroups)}
        ${simpleStat("Initiative", fieldValue("initTotal"))}
        ${simpleConditionalStats("initiative", conditionalGroups)}
        ${simpleStat("GP", fieldValue("GP", "0"))}
        ${simpleStat("SP", fieldValue("SP", "0"))}
        ${simpleStat("CP", fieldValue("CP", "0"))}
      </div>
    </section>

    <div class="simple-core-grid">
      <div>
        <section class="simple-section simple-core-section">
          <div class="sheet-title">Attributes</div>
          ${simpleTable(["Attr", "Total"], abilityRows)}
        </section>
      </div>
      <div>
        <section class="simple-section simple-core-section">
          <div class="sheet-title">Armor Class</div>
          <div class="simple-grid-tight">
            ${simpleStat("AC", fieldValue("acTotal"))}
            ${simpleConditionalStats("ac", conditionalGroups)}
            ${simpleStat("Touch", fieldValue("acTouch"))}
            ${simpleConditionalStats("touch ac", conditionalGroups)}
            ${simpleStat("Flat-Footed", fieldValue("acFlat"))}
            ${simpleConditionalStats("flat-footed ac", conditionalGroups)}
          </div>
        </section>
        <section class="simple-section simple-core-section">
          <div class="sheet-title">Combat Maneuvers</div>
          <div class="simple-grid-tight">
            ${simpleStat("CMB", fieldValue("cmbTotal"))}
            ${simpleConditionalStats("cmb", conditionalGroups)}
            ${simpleStat("CMD", fieldValue("cmdTotal"))}
            ${simpleConditionalStats("cmd", conditionalGroups)}
          </div>
        </section>
      </div>
      <div>
        <section class="simple-section simple-core-section">
          <div class="sheet-title">Saving Throws</div>
          ${simpleTable(["Save", "Total"], saveRows)}
        </section>
      </div>
    </div>

    <section class="simple-section">
      <div class="sheet-title">Weapons</div>
      ${simpleWeaponCards(weaponRows)}
    </section>

    <section class="simple-section">
      <div class="sheet-title">Armor & Shields</div>
      ${simpleEquipmentCards(armorRows, "No armor or shields.")}
    </section>

    <section class="simple-section">
      <div class="sheet-title">Other Equipment</div>
      ${simpleEquipmentCards(gearRows, "No other equipment.")}
    </section>

    <section class="simple-section">
      <div class="sheet-title">Skills</div>
      <div class="simple-skills-list">${simpleList(skillRows, "No skills.")}</div>
    </section>

    <section class="simple-section">
      <div class="sheet-title">Inventory</div>
      ${simpleInventoryChips(inventoryRows, "No inventory.")}
    </section>
  `;

  container
    .querySelectorAll("[data-simple-inventory-loot]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        openInventoryItemEditor(button.dataset.simpleInventoryLoot),
      );
    });
}

function collectSheet() {
  const sheet = {
    fields: {},
    abilities: {},
    saves: {},
    skills: {},
    weapons: collectPersistedCards("weaponRows"),
    armor: collectPersistedCards("armorRows"),
    gear: collectPersistedCards("gearRows"),
  };
  sheet.preferences = { showAppliedBuffs: showCalculations };
  sheet.customSkills = customSkills;
  sheet.classFeatureChoices = classFeatureChoices;
  sheet.classFeatureVariableChoices = classFeatureVariableChoices;
  sheet.racialTraits = {
    alternateTraits: selectedRacialAlternateTraits.slice(),
    choices: selectedRacialTraitChoicesForSave(),
  };
  sheet.classProgression = classProgression.map((row) => ({
    level: row.level,
    className: row.className,
  }));
  sheet.feats = normalizeCharacterFeatsForSave(characterFeats);
  sheet.spells = characterSpells;
  sheet.spellLikeChoices = normalizeSpellLikeChoicesForSave(
    selectedSpellLikeChoices,
  );
  if (isEnemySheetMode)
    sheet.enemyInventory = characterInventoryItems.map((item) => ({
      ...item,
      assigned_character_id: currentSheetId,
    }));
  sheet.calculated = collectCalculatedSummary();
  if (isEnemySheetMode) syncEnemyStructuredSpellFields();
  SIMPLE_FIELDS.forEach((id) => (sheet.fields[id] = el(id)?.value || ""));
  ABILITIES.forEach(
    ([key]) => (sheet.abilities[key] = { score: el(`${key}Score`).value }),
  );
  SAVES.forEach(
    ([key]) =>
      (sheet.saves[key] = {
        base: el(`${key}Base`).value,
        misc: el(`${key}Misc`).value,
      }),
  );
  allSkills().forEach(([skill]) => {
    const id = skillId(skill);
    sheet.skills[id] = {
      ranks: el(`${id}Ranks`).value,
      misc: el(`${id}Misc`).value,
    };
  });
  return sheet;
}

function restoreSheet(sheet) {
  isRestoringSheet = true;
  const data = sheet || {};
  const restoredSizeValue = data.fields?.size ?? "";
  showCalculations = Boolean(
    data.preferences?.showAppliedBuffs ?? true,
  );
  updateAppliedBuffsToggle();
  SIMPLE_FIELDS.forEach((id) => {
    if (el(id)) el(id).value = el(id).defaultValue || "";
  });
  setSelectValuePreservingUnknown("race", data.fields?.race || "");
  setSelectValuePreservingUnknown(
    "alignment",
    data.fields?.alignment || "",
  );
  setSelectValuePreservingUnknown(
    "size",
    data.fields?.size || "Medium",
  );
  Object.entries(data.fields || {}).forEach(([id, value]) => {
    if (id === "race" || id === "alignment" || id === "size")
      setSelectValuePreservingUnknown(id, value);
    else if (el(id)) el(id).value = value;
  });
  if (el("acNaturalBase")) {
    el("acNaturalBase").value = data.fields?.acNaturalBase ?? 0;
  }
  if (!isEnemySheetMode && shouldApplyRaceDefaultSize(restoredSizeValue)) {
    applySelectedRaceDefaults();
  }
  renderEnemyStructuredSpellFields();
  updateEnemyAutoInputSizes();
  Object.entries(data.abilities || {}).forEach(([key, value]) => {
    if (el(`${key}Score`)) el(`${key}Score`).value = value.score || 10;
  });
  Object.entries(data.saves || {}).forEach(([key, value]) => {
    if (el(`${key}Base`)) el(`${key}Base`).value = value.base || 0;
    if (el(`${key}Misc`)) el(`${key}Misc`).value = value.misc || 0;
  });
  customSkills = Array.isArray(data.customSkills) ? data.customSkills : [];
  classFeatureChoices =
    data.classFeatureChoices && typeof data.classFeatureChoices === "object"
      ? data.classFeatureChoices
      : {};
  classFeatureVariableChoices =
    data.classFeatureVariableChoices &&
    typeof data.classFeatureVariableChoices === "object"
      ? data.classFeatureVariableChoices
      : {};
  selectedRacialAlternateTraits = normalizeSelectedRacialAlternateTraits(
    data.racialTraits?.alternateTraits || [],
  );
  selectedRacialTraitChoices = normalizeSelectedRacialTraitChoices(
    data.racialTraits?.choices || {},
  );
  characterSpells =
    data.spells && typeof data.spells === "object" ? data.spells : {};
  selectedSpellLikeChoices = normalizeSpellLikeChoicesForSave(
    data.spellLikeChoices && typeof data.spellLikeChoices === "object"
      ? data.spellLikeChoices
      : {},
  );
  characterFeats = normalizeCharacterFeats(data.feats || {});
  classProgression = normalizeClassProgression(
    data.classProgression || [],
  );
  ["babMisc", "initMisc", "acNaturalMisc", "acMisc", "cmbMisc", "cmdMisc"].forEach((id) => {
    if (el(id) && el(id).value === "") el(id).value = "0";
  });
  characterInventoryItems =
    isEnemySheetMode && Array.isArray(data.enemyInventory)
      ? data.enemyInventory.map((item) => ({
          ...item,
          assigned_character_id: currentSheetId,
        }))
      : [];
  renderSkillRows(data.skills || {});
  renderLevelProgression();
  Object.entries(data.skills || {}).forEach(([id, value]) => {
    if (el(`${id}Ability`)) el(`${id}Ability`).value = value.ability || 0;
    if (el(`${id}Ranks`)) el(`${id}Ranks`).value = value.ranks || 0;
    if (el(`${id}Misc`)) el(`${id}Misc`).value = value.misc || 0;
  });
  el("weaponRows").innerHTML = "";
  el("armorRows").innerHTML = "";
  el("gearRows").innerHTML = "";
  weaponCount = 0;
  armorCount = 0;
  gearCount = 0;
  generatedEquipmentSignature = "";
  (data.weapons || []).forEach(addWeapon);
  normalizeTwfWeaponChoices();
  (data.armor || []).forEach((item) => {
    if (["Gear", "Item"].includes(item.type))
      addGear({ ...item, details: item.details || item.weight || "" });
    else addArmor(item);
  });
  (data.gear || []).forEach(addGear);
  updateCharacterImagePreview();
  updateRacialTraitsButton();
  updateClassDerivedViews();
  pruneUnavailableRacialTraitActiveBuffs({ persist: Boolean(currentSheetId) });
  recalculateSheet();
  isRestoringSheet = false;
}

function loadSampleValues() {
  Object.entries(PDF_SAMPLE).forEach(([id, value]) => {
    if (id === "race" || id === "alignment")
      setSelectValuePreservingUnknown(id, value);
    else if (el(id)) el(id).value = value;
  });
}

function updateCharacterImagePreview() {
  const url = el("imageUrl")?.value.trim() || "";
  const preview = el("characterImagePreview");
  const placeholder = el("characterImagePlaceholder");
  if (!preview || !placeholder) return;
  if (!url) {
    preview.classList.add("d-none");
    preview.removeAttribute("src");
    placeholder.classList.remove("d-none");
    placeholder.textContent = "No image";
    return;
  }
  preview.classList.remove("d-none");
  placeholder.classList.add("d-none");
  preview.src = url;
}

function attachInputListeners(root = document) {
  updateEnemyAutoInputSizes(root);
  autosizeEnemyTextareas(root);
  root.querySelectorAll("[data-delete-enemy-spell-row]").forEach((button) => {
    if (button.dataset.enemySpellDeleteBound === "true") return;
    button.dataset.enemySpellDeleteBound = "true";
    button.addEventListener("click", () => deleteEnemySpellRow(button));
  });
  root.querySelectorAll(".sheet-input, #characterName").forEach((input) => {
    if (input.dataset.sheetInputBound === "true") return;
    input.dataset.sheetInputBound = "true";
    input.addEventListener("input", () => {
      if (input.classList.contains("enemy-auto-input"))
        updateEnemyAutoInputSizes(input.parentElement || document);
      if (
        input.classList.contains("enemy-auto-textarea") ||
        input.matches("[data-enemy-spell-list]")
      )
        autosizeEnemyTextareas(input.parentElement || document);
      if (input.matches("[data-enemy-spell-label], [data-enemy-spell-list]"))
        syncEnemyStructuredSpellFields();
      if (input.id === "imageUrl") updateCharacterImagePreview();
      recalculateSheet();
      queueSheetSave();
    });
    input.addEventListener("change", () => {
      if (input.id === "race") {
        selectedRacialAlternateTraits = [];
        selectedRacialTraitChoices = {};
        applySelectedRaceDefaults();
        updateRacialTraitsButton();
        pruneUnavailableRacialTraitActiveBuffs({ persist: true });
      }
      if (input.id === "race" || input.id === "characterLevel")
        updateClassDerivedViews();
      if (input.matches("[data-enemy-spell-label], [data-enemy-spell-list]"))
        syncEnemyStructuredSpellFields();
      if (input.id === "imageUrl") updateCharacterImagePreview();
      recalculateSheet();
      void saveSheetNow(true);
    });
  });
}

function queueSheetSave() {
  if (isRestoringSheet) return;
  if (!isSheetEditable()) return;
  clearTimeout(sheetSaveTimer);
  sheetSaveTimer = setTimeout(() => {
    sheetSaveTimer = null;
    void enqueueSheetSave(true);
  }, 500);
}

function isSheetEditable() {
  if (isEnemySheetMode) return true;
  if (!currentSheetOwnerId) return true;
  return currentSheetOwnerId === currentUserId || currentUserIsAdmin;
}

function saveSheetNow(silent = false) {
  clearTimeout(sheetSaveTimer);
  sheetSaveTimer = null;
  return enqueueSheetSave(silent);
}

function enqueueSheetSave(silent = false) {
  const run = () => saveSheetSnapshot(silent);
  sheetSaveQueue = sheetSaveQueue.then(run, run);
  return sheetSaveQueue;
}

async function saveSheetSnapshot(silent = false) {
  if (!isSheetEditable()) {
    setStatus(
      "You can view this campaign character, but only its owner or an admin can save changes.",
      "warning",
    );
    return null;
  }

  const name = el("characterName").value.trim();
  if (!name) {
    if (!silent)
      setStatus("Character name is required before saving.", "warning");
    return;
  }
  recalculateSheet();
  if (isEnemySheetMode) {
    const sheet = collectSheet();
    sheet.activeBuffs = activeBuffs;
    const savedEnemy = await PFApp.saveEnemy(
      {
        id: enemySheetId,
        name,
        visible: true,
        sheet,
      },
      sheetContextKey,
    );
    if (savedEnemy?.id) {
      enemySheetId = savedEnemy.id;
      currentSheetId = savedEnemy.id;
    } else {
      setStatus(
        "Changes could not be saved. Refreshing now would discard them.",
        "danger",
      );
      return null;
    }
    localStorage.setItem(
      `pf_enemy_sheet_updated_${sheetContextKey}_${enemySheetId}`,
      String(Date.now()),
    );
    if (!silent) setStatus("Enemy sheet saved.", "success");
    return savedEnemy;
  }

  const saved = await PFApp.saveCharacterSheet(
    name,
    collectSheet(),
    sheetContextKey,
    currentSheetId,
  );
  if (!saved?.id) {
    setStatus(
      "Changes could not be saved. Refreshing now would discard them.",
      "danger",
    );
    return null;
  }
  currentSheetId = saved.id;
  if (currentSheetId) rememberSelectedCharacter(currentSheetId);
  await loadCharacterInventory();
  if (currentSheetId)
    localStorage.setItem(
      `pf_character_sheet_updated_${sheetContextKey}_${currentSheetId}`,
      String(Date.now()),
    );
  if (!silent) setStatus("Character sheet saved.", "success");
  return saved;
}

async function loadEnemySheet(enemyId, prefetchedEnemy = null) {
  const enemy =
    prefetchedEnemy && String(prefetchedEnemy.id) === String(enemyId)
      ? prefetchedEnemy
      : await PFApp.loadEnemy(enemyId, sheetContextKey);
  if (!enemy) {
    setStatus("Could not load that enemy.", "warning");
    return;
  }

  isEnemySheetMode = true;
  enemySheetId = enemy.id;
  currentSheetId = enemy.id;
  currentSheetOwnerId = currentUserId;
  activeBuffs = Array.isArray(enemy.sheet?.activeBuffs)
    ? enemy.sheet.activeBuffs
    : [];
  await restoreSheetWithClassDefinitions(enemy.sheet || {});
  el("characterName").value = enemy.name;
  characterInventoryItems = Array.isArray(enemy.sheet?.enemyInventory)
    ? enemy.sheet.enemyInventory.map((item) => ({
        ...item,
        assigned_character_id: currentSheetId,
      }))
    : [];
  renderCharacterInventory(characterInventoryItems);
  if (sheetViewMode === "simplified") renderSimplifiedSheet();
  el("enemySourceItemButton")?.classList.remove("d-none");
}

async function loadCurrentSheet(
  sheetId = currentSheetId,
  prefetchedSheet = null,
) {
  const name = el("characterName").value.trim();
  if (!name && !sheetId) return;
  const saved =
    prefetchedSheet && String(prefetchedSheet.id) === String(sheetId)
      ? prefetchedSheet
      : await PFApp.loadCharacterSheet(name, sheetContextKey, sheetId);
  if (saved?.sheet) {
    currentSheetId = saved.id;
    currentSheetOwnerId = saved.user_id || currentUserId;
    rememberSelectedCharacter(currentSheetId);
    const [savedBuffState, loot] = await Promise.all([
      PFApp.loadBuffState(sheetContextKey, currentSheetId),
      PFApp.loadLootItems(sheetContextKey),
    ]);
    activeBuffs = Array.isArray(savedBuffState)
      ? savedBuffState
      : savedBuffState?.buffs || [];
    lastBuffRefresh = localStorage.getItem(buffRefreshKey(currentSheetId)) || "";
    await restoreSheetWithClassDefinitions(saved.sheet);
    el("characterName").value = saved.character_name;
    await loadCharacterInventory(loot);
  } else {
    setStatus("Could not load that character sheet.", "warning");
  }
}

let sheetBridgeRecalculationQueue = Promise.resolve();
let sheetBridgeSummarySaveQueue = Promise.resolve();

function bridgeSpellEffectDefinition(spell = {}, metadata = {}) {
  const mechanics = window.PFEffectMechanics?.activeMechanics?.(spell, {
    activeOnly: true,
  }) || { effects: [] };
  const effect = {
    id: `spell:${metadata.kind || "spell"}:${metadata.className || ""}:${metadata.level ?? ""}:${spell.name || metadata.name || "spell"}`,
    name: spell.name || metadata.name || "Spell",
    category: "Spell",
    source:
      metadata.kind === "sla"
        ? `${metadata.source || "Spell-Like Ability"} | ${metadata.frequency || "At will"}`
        : metadata.className || "Spell",
    bonuses: mechanics.effects || [],
    durationConfig: mechanics.durationConfig || null,
    auraConfig: mechanics.auraConfig || null,
    ...(window.PFEffectMechanics?.hasBranches?.(mechanics)
      ? { branches: mechanics.branches }
      : {}),
    duration: window.PFEffectMeta?.durationLabel
      ? window.PFEffectMeta.durationLabel(mechanics.durationConfig || {})
      : "variable",
    ownedSpell: true,
    spellMeta: metadata,
    spell,
    attributeScaleContext: currentAttributeScaleContext(),
  };
  (window.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
    if (Array.isArray(mechanics[key]) && mechanics[key].length) {
      effect[key] = mechanics[key];
    }
  });
  return effect;
}

async function collectBridgeOwnedSpellEffects() {
  const definitions = await window.PFSpellData?.loadSpells?.();
  const byName = new Map(
    (definitions || []).map((spell) => [
      String(spell.name || "").trim().toLowerCase(),
      spell,
    ]),
  );
  const classNames = new Map();
  classProgression.forEach((row) => {
    if (row?.className) {
      classNames.set(spellcastingStateKey(row.className), row.className);
    }
  });
  const results = [];
  const seen = new Set();
  Object.entries(characterSpells || {}).forEach(([classKey, state]) => {
    const className = classNames.get(classKey) || classKey.replaceAll("_", " ");
    ["known", "book", "prepared"].forEach((bucket) => {
      Object.entries(state?.[bucket] || {}).forEach(([level, names]) => {
        (Array.isArray(names) ? names : []).filter(Boolean).forEach((name) => {
          const key = `${classKey}:${bucket}:${level}:${String(name).toLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);
          const spell =
            byName.get(String(name).trim().toLowerCase()) || { name };
          const metadata = {
            kind: "spell",
            className,
            level: Number(level),
            bucket,
          };
          const effect = bridgeSpellEffectDefinition(spell, metadata);
          effect.spellCalculations = safeSpellDetailCalculations(
            spell,
            className,
            Number(level),
          );
          results.push(effect);
        });
      });
    });
  });
  collectCharacterSpellLikeRows();
  spellLikeDetailConfigs.forEach((config) => {
    const name = String(config.spellName || "").trim();
    if (!name) return;
    const key = `sla:${name.toLowerCase()}:${config.source || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    const spell = byName.get(name.toLowerCase()) || { name };
    const spellLevel = Number(
      config.entry?.spellLevel ?? config.entry?.level ?? spellLowestListedLevel(spell),
    );
    const calculationOptions = {
      spellSource: "spell-like-abilities",
      baseCasterLevel: Math.max(1, Number(num("characterLevel") || 1)),
      castingAbility: spellLikeCastingAttrKey(config.entry || {}) || "cha",
      spellLevel,
    };
    const effect = bridgeSpellEffectDefinition(spell, {
      kind: "sla",
      className: "Spell-Like Abilities",
      level: spellLevel,
      frequency: config.entry?.frequency || "At will",
      source: config.source || "Spell-Like Ability",
      calculationOptions,
    });
    effect.spellCalculations = safeSpellDetailCalculations(
      spell,
      "",
      spellLevel,
      calculationOptions,
    );
    results.push(effect);
  });
  return results;
}

function passiveEffectDetail(source = {}, fallbackType = "Effect") {
  const details = source.details && typeof source.details === "object"
    ? source.details
    : {};
  return {
    type: source.category || fallbackType,
    description:
      source.description || source.desc || details.description || details.summary || "",
    ...(source.prerequisites ? { prerequisites: source.prerequisites } : {}),
    ...(source.benefit ? { benefit: source.benefit } : {}),
    ...(source.normal ? { normal: source.normal } : {}),
    ...(source.special ? { special: source.special } : {}),
    ...details,
  };
}

function passiveEffectSource(source = {}, category = "Effect", id = "") {
  return {
    ...source,
    id: id || source.id || `passive:${category}:${source.name || "effect"}`,
    name: source.name || category,
    category,
    passiveSource: true,
    description:
      source.description || source.desc || source.details?.description || "",
    detailUrl:
      source.url || source.link || source.sourceUrl || source.details?.link || "",
    detailData: {
      ...passiveEffectDetail(source, category),
      ...(source.detailData && typeof source.detailData === "object"
        ? source.detailData
        : {}),
    },
  };
}

function collectBridgePassiveEffectSources() {
  const results = [];
  const seen = new Set();
  const add = (entry) => {
    if (!entry?.name) return;
    const key = `${entry.category}:${entry.id || entry.name}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push(entry);
  };

  collectSelectedRaceBuffs().forEach((buff, index) =>
    add(passiveEffectSource(buff, buff.category || "Racial Trait", `passive:race:${index}:${buff.name}`)),
  );
  collectSelectedFeatBuffs().forEach((buff, index) => {
    const selection = selectedFeatSelections({ activeOnly: true }).find(
      ({ id }) => String(featById(id)?.name || "") === String(buff.name || ""),
    );
    const feat = selection ? featById(selection.id) : null;
    add(passiveEffectSource({ ...(feat || {}), ...buff }, "Feat", `passive:feat:${selection?.id || index}`));
  });
  collectClassFeatureBuffs().forEach((buff, index) =>
    add(passiveEffectSource(buff, "Class Feature", `passive:class:${index}:${buff.name}`)),
  );
  (characterInventoryItems || [])
    .filter((item) => isLootEquipped(item.id))
    .forEach((item) => {
      const mechanics = window.PFEffectMechanics?.passiveMechanics?.(item) || {};
      if (!window.PFEffectMechanics?.hasAnyMechanics?.(mechanics)) return;
      add(passiveEffectSource({ ...item, ...mechanics }, "Item", `passive:item:${item.id}`));
    });
  return results;
}

async function prepareBridgeCharacterSheet(
  contextKey,
  characterId,
  { inventory = false } = {},
) {
  await characterSheetReady;
  if (!contextKey || !characterId) return null;
  isEnemySheetMode = false;
  enemySheetId = "";
  el("enemySourceItemButton")?.classList.add("d-none");
  sheetContextKey = contextKey;
  const saved =
    (await PFApp.loadCharacterSheetForRecalculation?.(
      characterId,
      sheetContextKey,
    )) || (await PFApp.loadCharacterSheet("", sheetContextKey, characterId));
  if (!saved?.sheet || String(saved.id) !== String(characterId)) return null;
  currentSheetId = saved.id;
  currentSheetOwnerId = saved.user_id || currentUserId;
  activeBuffs =
    (await PFApp.loadCharacterBuffStateForRecalculation?.(
      saved.id,
      sheetContextKey,
    )) || [];
  lastBuffRefresh = localStorage.getItem(buffRefreshKey(saved.id)) || "";
  await restoreSheetWithClassDefinitions(saved.sheet);
  el("characterName").value = saved.character_name;
  await syncCharacterInventoryWithEquipment();
  if (inventory) renderCharacterInventory(characterInventoryItems);
  recalculateSheet();
  return saved;
}

async function passiveEffectSourcesForCharacter(contextKey, characterId) {
  return queueSheetBridgeRecalculation(async () => {
    const saved = await prepareBridgeCharacterSheet(contextKey, characterId, {
      inventory: true,
    });
    if (!saved) return [];
    return collectBridgePassiveEffectSources();
  });
}

async function spellDetailsForCharacter(
  contextKey,
  characterId,
  spellMeta = {},
  casterLevel = null,
) {
  return queueSheetBridgeRecalculation(async () => {
    await characterSheetReady;
    if (!contextKey || !characterId || !spellMeta?.name) return null;
    sheetContextKey = contextKey;
    const saved =
      (await PFApp.loadCharacterSheetForRecalculation?.(characterId, sheetContextKey)) ||
      (await PFApp.loadCharacterSheet("", sheetContextKey, characterId));
    if (!saved?.sheet || String(saved.id) !== String(characterId)) return null;
    currentSheetId = saved.id;
    currentSheetOwnerId = saved.user_id || currentUserId;
    activeBuffs =
      (await PFApp.loadCharacterBuffStateForRecalculation?.(saved.id, sheetContextKey)) || [];
    await restoreSheetWithClassDefinitions(saved.sheet);
    el("characterName").value = saved.character_name;
    await syncCharacterInventoryWithEquipment();
    recalculateSheet();
    const isSla = spellMeta.kind === "sla";
    const className = isSla ? "" : spellMeta.className || "";
    const spell = await spellByNameForClass(spellMeta.name, className);
    if (!spell) return null;
    const spellLevel = Number(
      spellMeta.level ?? (isSla ? spellLowestListedLevel(spell) : 0),
    );
    const calculationOptions = isSla
      ? {
          ...(spellMeta.calculationOptions || {}),
          spellSource: "spell-like-abilities",
          baseCasterLevel: Math.max(1, Number(num("characterLevel") || 1)),
          spellLevel,
        }
      : {};
    if (casterLevel !== null && casterLevel !== undefined)
      calculationOptions.casterLevel = casterLevel;
    return {
      spell,
      calculations: safeSpellDetailCalculations(
        spell,
        className,
        spellLevel,
        calculationOptions,
      ),
    };
  });
}

async function spellEffectSourcesForCharacter(contextKey, characterId) {
  return queueSheetBridgeRecalculation(async () => {
    const saved = await prepareBridgeCharacterSheet(contextKey, characterId);
    if (!saved) return [];
    return collectBridgeOwnedSpellEffects();
  });
}

async function activatableEffectSourcesForCharacter(contextKey, characterId) {
  return queueSheetBridgeRecalculation(async () => {
    const saved = await prepareBridgeCharacterSheet(contextKey, characterId, {
      inventory: true,
    });
    if (!saved) return [];
    return collectActivatableAbilities();
  });
}

async function mapEffectSourcesForCharacter(contextKey, characterId) {
  return queueSheetBridgeRecalculation(async () => {
    const saved = await prepareBridgeCharacterSheet(contextKey, characterId, {
      inventory: true,
    });
    if (!saved) return { activatable: [], spells: [], passives: [] };
    return {
      activatable: collectActivatableAbilities(),
      spells: await collectBridgeOwnedSpellEffects(),
      passives: collectBridgePassiveEffectSources(),
    };
  });
}

function queueSheetBridgeRecalculation(task) {
  const next = sheetBridgeRecalculationQueue.then(
    () => task(),
    () => task(),
  );
  sheetBridgeRecalculationQueue = next.catch(() => {});
  return next;
}

function queueSheetBridgeSummarySave(task) {
  const next = sheetBridgeSummarySaveQueue.then(
    () => task(),
    () => task(),
  );
  sheetBridgeSummarySaveQueue = next.catch((error) => console.error(error));
  return next;
}

async function recalculateAndSaveCharacterSnapshot(
  contextKey,
  character,
  nextActiveBuffs = [],
) {
  return queueSheetBridgeRecalculation(async () => {
    await characterSheetReady;
    if (!contextKey || !character?.id || !character?.sheet) return null;
    isEnemySheetMode = false;
    enemySheetId = "";
    el("enemySourceItemButton")?.classList.add("d-none");
    sheetContextKey = contextKey;
    currentSheetId = character.id;
    currentSheetOwnerId = character.userId || character.user_id || currentUserId;
    activeBuffs = Array.isArray(nextActiveBuffs) ? nextActiveBuffs : [];
    await restoreSheetWithClassDefinitions(character.sheet);
    el("characterName").value =
      character.name || character.character_name || "Character";
    await syncCharacterInventoryWithEquipment();
    recalculateSheet();
    const calculated = collectCalculatedSummary();
    const targetId = character.id;
    const targetContext = sheetContextKey;
    const summary = structuredClone(calculated);
    void queueSheetBridgeSummarySave(async () => {
      const updated = await PFApp.updateCharacterCalculatedSummary?.(
        targetId,
        summary,
        targetContext,
      );
      if (!updated?.id || String(updated.id) !== String(targetId)) return;
      localStorage.setItem(
        `pf_character_sheet_updated_${targetContext}_${updated.id}`,
        String(Date.now()),
      );
    });
    return calculated;
  });
}

async function recalculateAndSaveEnemySnapshot(contextKey, enemy) {
  return queueSheetBridgeRecalculation(async () => {
    await characterSheetReady;
    if (!contextKey || !enemy?.id || !enemy?.sheet) return null;
    sheetContextKey = contextKey;
    isEnemySheetMode = true;
    enemySheetId = enemy.id;
    currentSheetId = enemy.id;
    currentSheetOwnerId = currentUserId;
    activeBuffs = Array.isArray(enemy.sheet.activeBuffs)
      ? enemy.sheet.activeBuffs
      : [];
    await restoreSheetWithClassDefinitions(enemy.sheet);
    el("characterName").value = enemy.name || "Enemy";
    recalculateSheet();
    const calculated = collectCalculatedSummary();
    const targetId = enemy.id;
    const targetContext = sheetContextKey;
    const buffs = structuredClone(activeBuffs);
    const summary = structuredClone(calculated);
    void queueSheetBridgeSummarySave(async () => {
      const savedEnemy = await PFApp.updateEnemyEffectSummary?.(
        targetId,
        buffs,
        summary,
        targetContext,
      );
      if (!savedEnemy?.id) return;
      localStorage.setItem(
        `pf_enemy_sheet_updated_${targetContext}_${savedEnemy.id}`,
        String(Date.now()),
      );
    });
    return calculated;
  });
}

async function recalculateAndSaveCharacterSheet(contextKey, characterId) {
  return queueSheetBridgeRecalculation(() =>
    recalculateAndSaveCharacterSheetNow(contextKey, characterId),
  );
}

async function recalculateAndSaveCharacterSheetNow(contextKey, characterId) {
  await characterSheetReady;
  if (!contextKey || !characterId) return null;
  isEnemySheetMode = false;
  enemySheetId = "";
  el("enemySourceItemButton")?.classList.add("d-none");
  sheetContextKey = contextKey;
  const saved =
    (await PFApp.loadCharacterSheetForRecalculation?.(
      characterId,
      sheetContextKey,
    )) || (await PFApp.loadCharacterSheet("", sheetContextKey, characterId));
  if (!saved?.sheet) return null;
  if (String(saved.id) !== String(characterId)) return null;
  const targetSheetId = saved.id;
  currentSheetId = targetSheetId;
  currentSheetOwnerId = saved.user_id || currentUserId;
  activeBuffs =
    (await PFApp.loadCharacterBuffStateForRecalculation?.(
      targetSheetId,
      sheetContextKey,
    )) || [];
  lastBuffRefresh = localStorage.getItem(buffRefreshKey(targetSheetId)) || "";
  await restoreSheetWithClassDefinitions(saved.sheet);
  el("characterName").value = saved.character_name;
  await syncCharacterInventoryWithEquipment();
  recalculateSheet();
  const nextSheet = collectSheet();
  const updated = await PFApp.updateCharacterCalculatedSummary?.(
    targetSheetId,
    nextSheet.calculated || {},
    sheetContextKey,
  );
  if (updated?.id && String(updated.id) === String(targetSheetId)) {
    localStorage.setItem(
      `pf_character_sheet_updated_${sheetContextKey}_${updated.id}`,
      String(Date.now()),
    );
    return nextSheet.calculated || null;
  }
  return null;
}

async function recalculateAndSaveEnemySheet(contextKey, enemyId) {
  return queueSheetBridgeRecalculation(() =>
    recalculateAndSaveEnemySheetNow(contextKey, enemyId),
  );
}

async function recalculateAndSaveEnemySheetNow(contextKey, enemyId) {
  await characterSheetReady;
  if (!contextKey || !enemyId) return null;
  sheetContextKey = contextKey;
  const enemy =
    (await PFApp.loadEnemyForEffectApplication?.(enemyId, sheetContextKey)) ||
    (await PFApp.loadEnemy(enemyId, sheetContextKey));
  if (!enemy?.sheet) return null;
  if (String(enemy.id) !== String(enemyId)) return null;
  isEnemySheetMode = true;
  enemySheetId = enemy.id;
  currentSheetId = enemy.id;
  currentSheetOwnerId = currentUserId;
  activeBuffs = Array.isArray(enemy.sheet.activeBuffs)
    ? enemy.sheet.activeBuffs
    : [];
  await restoreSheetWithClassDefinitions(enemy.sheet);
  el("characterName").value = enemy.name;
  recalculateSheet();
  const nextSheet = collectSheet();
  nextSheet.activeBuffs = activeBuffs;
  const savedEnemy =
    (await PFApp.updateEnemyEffectSummary?.(
      enemy.id,
      activeBuffs,
      nextSheet.calculated || {},
      sheetContextKey,
    )) ||
    (await PFApp.saveEnemy(
      {
        id: enemy.id,
        name: enemy.name || el("characterName").value.trim() || "Enemy",
        visible: enemy.visible !== false,
        sheet: nextSheet,
      },
      sheetContextKey,
    ));
  if (savedEnemy?.id) {
    localStorage.setItem(
      `pf_enemy_sheet_updated_${sheetContextKey}_${savedEnemy.id}`,
      String(Date.now()),
    );
    return nextSheet.calculated || null;
  }
  return null;
}

window.PFCharacterSheetBridge = {
  recalculateAndSaveCharacter: recalculateAndSaveCharacterSheet,
  recalculateAndSaveEnemy: recalculateAndSaveEnemySheet,
  recalculateCharacterSnapshot: recalculateAndSaveCharacterSnapshot,
  recalculateEnemySnapshot: recalculateAndSaveEnemySnapshot,
  spellEffectSourcesForCharacter,
  activatableEffectSourcesForCharacter,
  passiveEffectSourcesForCharacter,
  mapEffectSourcesForCharacter,
  spellDetailsForCharacter,
};

function inventoryEditorConfig() {
  return {
    formId: "inventoryItemForm",
    effectsRootId: "inventoryEffectsAccordion",
    generalTabId: "inventoryEditorGeneralTab",
    effectsTabId: "inventoryEditorEffectsTab",
    generalPanelId: "inventoryEditorGeneralPanel",
    effectsPanelId: "inventoryEditorEffectsPanel",
    slotInputId: "inventorySlotInput",
    slotFieldId: "inventorySlotField",
    typeInputId: "inventoryItemType",
    descriptionId: "inventoryItemDescription",
    materialFieldId: "inventorySpecialMaterialField",
    materialInputId: "inventorySpecialMaterial",
    slots: ITEM_SLOTS,
    onSlotChange: updateInventorySlotPreview,
  };
}

// Cache of the current user's own characters in this context, refreshed
// periodically -- used to scope the pending-choice poller. A user
// controlling more than one character (a main PC plus a companion
// sheet, say) just means more ids in this list; the poller and its
// panel already handle any number of pending requests across any
// number of characters the same way.
let myCharacterOptionsCache = [];
async function refreshMyCharacterOptions() {
  myCharacterOptionsCache = await PFApp.loadCharacterSheets(sheetContextKey, {
    ownOnly: true,
    summaryOnly: true,
  });
}

async function startPendingEffectChoicePolling() {
  if (!window.PFPendingEffectChoices) return;
  await refreshMyCharacterOptions();
  window.PFPendingEffectChoices.start({
    contextKey: sheetContextKey,
    characterIds: () => myCharacterOptionsCache.map((row) => row.id),
    characterNameFor: (id) =>
      myCharacterOptionsCache.find((row) => row.id === id)?.character_name ||
      "",
    choicePoolSkillsFor: (id) =>
      !isEnemySheetMode && id === currentSheetId ? allSkills() : undefined,
    choicePoolEquipmentFor: async (id) => {
      if (id === currentSheetId) return currentEffectChoiceEquipment();
      const saved = await PFApp.loadCharacterSheet("", sheetContextKey, id);
      return saved?.sheet || {};
    },
    favoredEnemyOptionsFor: (id) =>
      !isEnemySheetMode && id === currentSheetId
        ? characterFavoredEnemyOptions()
        : [],
    onResolved: async (characterId) => {
      if (isEnemySheetMode || characterId !== currentSheetId) return;
      await loadActiveBuffs(currentSheetId);
      await effectTrackerInstance?.refresh?.();
      recalculateSheet();
    },
  });
  setInterval(refreshMyCharacterOptions, 60000);
}

async function initCharacterSheet() {
  showSheetLoading();
  const params = new URLSearchParams(window.location.search);
  const requestedCharacterId = params.get("characterId") || "";
  const contextFromUrl = params.get("context") || "";
  if (contextFromUrl) PFApp.setSelectedContextKey(contextFromUrl);
  const user = await PFApp.requireAuth();
  if (!user) return;
  const requestedContext =
    contextFromUrl ||
    (requestedCharacterId
      ? await PFApp.loadCharacterSheetContext?.(requestedCharacterId)
      : "");
  if (
    requestedContext &&
    requestedContext !== PFApp.getSelectedContextKey()
  ) {
    PFApp.setSelectedContextKey(requestedContext);
    await PFApp.renderAuthNav(user);
  }
  sheetContextKey = await PFApp.requireGameContext();
  if (!sheetContextKey) return;
  currentUserId = user.id;
  currentUserIsAdmin = (await PFApp.isAppAdmin?.()) || false;
  currentSheetOwnerId = user.id;
  const bridgeMode = params.get("bridge") === "1";
  enemySheetId = params.get("enemyId") || "";
  isEnemySheetMode = Boolean(enemySheetId);
  const initialCharacterPromise =
    requestedCharacterId && !isEnemySheetMode
      ? PFApp.loadCharacterSheet("", sheetContextKey, requestedCharacterId)
      : Promise.resolve(null);
  const sharedDefinitionsPromise = Promise.all([
    loadRaceDefinitions(),
    loadFeatDefinitions(),
    loadDomainDefinitions(),
    loadBloodlineDefinitions(),
  ]);
  const initialCharacter = await initialCharacterPromise;
  await Promise.all([
    sharedDefinitionsPromise,
    loadClassDefinitions(classNamesFromSheet(initialCharacter?.sheet)),
  ]);
  document.body.classList.toggle("enemy-sheet-mode", isEnemySheetMode);
  buildSheet(Boolean(initialCharacter?.sheet) || isEnemySheetMode);
  if (isEnemySheetMode) {
    const canManageEnemies = await PFApp.isGameManager(sheetContextKey);
    if (!canManageEnemies) {
      document.querySelector("main").innerHTML = `
        <div class="alert alert-warning">
          <h5 class="alert-heading">GM access required</h5>
          <p class="mb-0">Only the GM of this campaign or an app admin can edit enemies.</p>
        </div>
      `;
      hideSheetLoading();
      el("sheetMain")?.classList.remove("d-none");
      return;
    }
    el("sheetPageTitle").textContent = "Enemy Sheet";
    el("backToCharactersBtn")?.classList.add("d-none");
    el("backToEnemiesBtn").classList.remove("d-none");
    el("enemySourceItemButton")?.classList.remove("d-none");
    await loadEnemySourceItems();
  } else {
    el("enemySourceItemButton")?.classList.add("d-none");
  }
  updateAppliedBuffsToggle();
  setSheetView(sheetViewMode);
  window.addEventListener("pf-context-change", async (event) => {
    if (isEnemySheetMode) return;
    if (!event.detail.contextKey || event.detail.contextKey === "general")
      return;
    window.location.href = "characters.html";
  });
  window.addEventListener("focus", () => {
    if (!isEnemySheetMode) refreshBuffsIfChanged(false, true);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !isEnemySheetMode)
      refreshBuffsIfChanged(false, true);
  });
  window.addEventListener("storage", (event) => {
    if (isEnemySheetMode || !currentSheetId) return;
    if (event.key === buffRefreshKey(currentSheetId))
      refreshBuffsIfChanged(true, true);
    if (event.key === `pf_loot_updated_${sheetContextKey}_${currentSheetId}`) {
      loadCharacterInventory().then(() => {
        recalculateSheet();
        queueSheetSave();
      });
    }
  });
  if (isEnemySheetMode) {
    await loadEnemySheet(enemySheetId);
  } else if (requestedCharacterId) {
    await loadCurrentSheet(requestedCharacterId, initialCharacter);
  } else if (bridgeMode) {
    loadSampleValues();
    renderCharacterInventory([]);
  } else {
    window.location.href = "characters.html";
    return;
  }
  void startPendingEffectChoicePolling();
  hideSheetLoading();
  el("sheetMain")?.classList.remove("d-none");
  attachInputListeners();
  el("characterImagePreview")?.addEventListener("error", () => {
    el("characterImagePreview").classList.add("d-none");
    el("characterImagePlaceholder").classList.remove("d-none");
    el("characterImagePlaceholder").textContent = "Image unavailable";
  });
  updateCharacterImagePreview();
  PFItemEditor.init(inventoryEditorConfig());
  document.querySelectorAll("[data-sheet-info-tab]").forEach((button) => {
    button.addEventListener("click", () =>
      setSheetInfoTab(button.dataset.sheetInfoTab),
    );
  });
  initSheetStickyControls();
  window.addEventListener("scroll", updateSheetStickyControls, {
    passive: true,
  });
  window.addEventListener("resize", () => {
    syncFullViewMobileOrder();
    requestAnimationFrame(syncSheetStickyControls);
  });
  window.visualViewport?.addEventListener("scroll", updateSheetStickyControls, {
    passive: true,
  });
  window.visualViewport?.addEventListener("resize", () => {
    syncFullViewMobileOrder();
    requestAnimationFrame(syncSheetStickyControls);
  });
  syncFullViewMobileOrder();
  requestAnimationFrame(syncSheetStickyControls);
  setTimeout(syncSheetStickyControls, 250);
  el("skillSearch")?.addEventListener("input", (event) => {
    skillSearchTerm = event.target.value.trim();
    applySkillSearchFilter();
  });
  el("racialTraitsButton")?.addEventListener("click", openRacialTraitsModal);
  el("showAppliedBuffsToggle")?.addEventListener("click", toggleAppliedBuffs);
  effectTrackerModal = bootstrap.Modal.getOrCreateInstance(
    el("effectTrackerModal"),
  );
  el("openEffectTrackerButton").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await openEffectTrackerModal();
      effectTrackerModal.show();
    } finally {
      button.disabled = false;
    }
  });
  el("characterName").addEventListener("change", async () => {
    if (isEnemySheetMode) return;
    const saved = await PFApp.loadCharacterSheet(
      el("characterName").value.trim(),
      sheetContextKey,
    );
    currentSheetId = saved?.id || null;
    if (saved?.sheet) await loadCurrentSheet(saved.id);
  });
  el("inventoryItemType").addEventListener(
    "change",
    () => toggleInventoryDetailFields(true),
  );
  el("inventoryWeaponType").addEventListener(
    "change",
    () => toggleInventoryDetailFields(true),
  );
  el("inventoryWeaponType").innerHTML = optionList(
    WEAPON_TYPES,
    "Melee Weapon (One-Handed)",
  );
  el("inventoryWeaponEnchantment").innerHTML = optionList(WEAPON_ENCHANTMENTS);
  el("inventoryArmorEnchantment").innerHTML = armorEnchantmentOptions();
  setupInventoryAttackOptionControls();
  el("inventoryItemForm").addEventListener("submit", submitInventoryItemEdit);
  el("inventoryItemModal").addEventListener("hidden.bs.modal", () =>
    PFItemEditor.resetTabs(inventoryEditorConfig()),
  );
  el("inventoryItemModal").addEventListener("shown.bs.modal", () =>
    PFItemEditor.refreshDescription(inventoryEditorConfig()),
  );
  el("deleteInventoryItemForm").addEventListener(
    "submit",
    submitInventoryItemDelete,
  );
  inventoryEffectsAccordion = window.PFEffectEditor.mountMechanicGroups(
    el("inventoryEffectsAccordion"),
    {
      idPrefix: "inventoryEffects",
      skills: allSkills(),
      effectStats: LOOT_EFFECT_STATS,
      titleCaseStat,
    },
  );
  enemySourceItemModal = bootstrap.Modal.getOrCreateInstance(
    el("enemySourceItemsModal"),
  );
  el("enemySourceItemButton").addEventListener(
    "click",
    openEnemySourceItemsModal,
  );
  el("enemySourceItemSearch").addEventListener("input", (event) => {
    enemySourceItemSearchTerm = event.target.value.trim();
    renderEnemySourceItemResults();
  });
  el("enemySourceItemTabs")
    .querySelectorAll("[data-source-category]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        enemySourceItemCategory = button.dataset.sourceCategory || "all";
        if (
          enemySourceItemCategory === "mundane" &&
          !MUNDANE_CATEGORIES.includes(enemySourceItemMundaneCategory)
        ) {
          enemySourceItemMundaneCategory = MUNDANE_CATEGORIES[0];
        }
        el("enemySourceItemTabs")
          .querySelectorAll("[data-source-category]")
          .forEach((tab) => {
            tab.classList.toggle("active", tab === button);
          });
        renderEnemySourceItemResults();
      });
    });
  setupInventoryScalingControls();
  recalculateSheet();
  characterSheetReadyResolve?.(true);
}

initCharacterSheet();
