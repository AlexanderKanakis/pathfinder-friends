const spellcastingClasses = [
  { name: "wizard", levelsPerSpellLevel: 2 },
  { name: "cleric", levelsPerSpellLevel: 2 },
  { name: "druid", levelsPerSpellLevel: 2 },
  { name: "sorcerer", levelsPerSpellLevel: 2.5 },
  { name: "oracle", levelsPerSpellLevel: 2.5 },
  { name: "witch", levelsPerSpellLevel: 2 },
  { name: "shaman", levelsPerSpellLevel: 2 },
  { name: "psychic", levelsPerSpellLevel: 2.5 },
  { name: "bard", levelsPerSpellLevel: 3 },
  { name: "inquisitor", levelsPerSpellLevel: 3 },
  { name: "magus", levelsPerSpellLevel: 3 },
  { name: "summoner", levelsPerSpellLevel: 3 },
  { name: "summoner (unchained)", levelsPerSpellLevel: 3 },
  { name: "alchemist", levelsPerSpellLevel: 3 },
  { name: "investigator", levelsPerSpellLevel: 3 },
  { name: "bloodrager", levelsPerSpellLevel: 3 },
  { name: "hunter", levelsPerSpellLevel: 3 },
  { name: "skald", levelsPerSpellLevel: 3 },
  { name: "warpriest", levelsPerSpellLevel: 3 },
  { name: "paladin", levelsPerSpellLevel: 4 },
  { name: "antipaladin", levelsPerSpellLevel: 4 },
  { name: "ranger", levelsPerSpellLevel: 4 },
  { name: "adept", levelsPerSpellLevel: 2 },
  { name: "arcanist", levelsPerSpellLevel: 2.5 },
];

var itemSlots = [
  "none",
  "belt",
  "body",
  "chest",
  "eyes",
  "feet",
  "hands",
  "head",
  "headband",
  "neck",
  "shoulders",
  "wrist",
  "weapon",
  "armor",
  "shield",
];

var spellSchools = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
  "universal",
];

var spellClasses = [
  "adept",
  "alchemist",
  "arcanist",
  "bard",
  "bloodrager",
  "cleric",
  "bard",
  "bloodrager",
  "cleric",
  "druid",
  "hunter",
  "inquisitor",
  "investigator",
  "magus",
  "medium",
  "mesmerist",
  "occultist",
  "oracle",
  "paladin",
  "antipaladin",
  "psychic",
  "ranger",
  "shaman",
  "skald",
  "sorcerer",
  "spiritualist",
  "summoner",
  "summoner (unchained)",
  "warpriest",
  "witch",
  "wizard",
];

var itemTypes = ["staff", "rod", "cursed"];

const bonusEffects = [
  {
    name: "Ability bonus (enhancement)",
    mult: 1000,
  },
  {
    name: "Armor bonus (enhancement)",
    mult: 1000,
  },
  {
    name: "Bonus spell",
    mult: 1000,
  },
  {
    name: "AC bonus (deflection)",
    mult: 2000,
  },
  {
    name: "AC bonus (other)",
    mult: 2500,
  },
  {
    name: "Natural armor bonus (enhancement)",
    mult: 2000,
  },
  {
    name: "Save bonus (resistance)",
    mult: 1000,
  },
  {
    name: "Save bonus (other)",
    mult: 2000,
  },
  {
    name: "Skill bonus (competence)",
    mult: 100,
  },
  {
    name: "Spell resistance",
    mult: 10000,
  },
  {
    name: "Weapon bonus (enhancement)",
    mult: 2000,
  },
];

const skills = [
  "Acrobatics",
  "Appraise",
  "Bluff",
  "Craft",
  "Diplomacy",
  "Disable Device",
  "Disguise",
  "Escape Artist",
  "Fly",
  "Handle Animal",
  "Heal",
  "Intimidate",
  "Knowledge (arcana)",
  "Knowledge (dungeoneering)",
  "Knowledge (engineering)",
  "Knowledge (geography)",
  "Knowledge (history)",
  "Knowledge (local)",
  "Knowledge (nature)",
  "Knowledge (nobility)",
  "Knowledge (planes)",
  "Knowledge (religion)",
  "Linguistics",
  "Perception",
  "Perform",
  "Profession",
  "Ride",
  "Sense Motive",
  "Slight of Hand",
  "Spellcraft",
  "Stealth",
  "Survival",
  "Swim",
  "UMD",
];

const spellEffects = [
  {
    name: "Single use, spell completion",
    mult: 25,
  },
  {
    name: "Single use, user-activated",
    mult: 50,
  },
  {
    name: "50 charges, spell trigger",
    mult: 750,
  },
  {
    name: "Command word",
    mult: 1800,
  },
  {
    name: "User Activated or Continuous",
    mult: 2000,
  },
  {
    name: "Flavor",
    mult: 0,
  },
];

const abilityBonuses = [
  "Constitution",
  "Strength",
  "Dexterity",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

var caster;

var filteredItemSlots = [];
var filteredItemTypes = [];
var filteredSchools = [];
var filteredClasses = [];
var newItemSpells = [];
var newItemBonuses = [];

window.onload = loadFilters;

function loadFilters() {
  for (let slot of itemSlots) {
    document.getElementById(`item-slots-wrapper`).innerHTML += `
                    <div class="d-flex flex-wrap gap-1">
                        <label>${slot}</label>
                        <input type="checkbox" onclick="wItemSlotCheck()" id="filter-slot-${slot}">
                    </div>
                `;
  }

  for (let school of spellSchools) {
    document.getElementById(`spell-schools-wrapper`).innerHTML += `
                    <div class="d-flex flex-wrap gap-1">
                        <label>${school}</label>
                        <input type="checkbox" onclick="spellSchoolCheck()" id="filter-slot-${school}">
                    </div>
                `;
  }

  for (let spellClass of spellClasses) {
    document.getElementById(`spell-class-wrapper`).innerHTML += `
                    <div class="d-flex flex-wrap gap-1">
                        <label>${spellClass}</label>
                        <input type="checkbox" onclick="spellClassCheck()" id="filter-slot-${spellClass}">
                    </div>
                `;
  }

  for (let type of itemTypes) {
    document.getElementById(`item-types-wrapper`).innerHTML += `
                    <div class="d-flex flex-wrap gap-1">
                        <label>${type}</label>
                        <input type="checkbox" onclick="wItemTypeCheck()" id="filter-slot-${type}">
                    </div>
                `;
  }

  for (let castClass of spellcastingClasses) {
    document.getElementById(`craft-class`).innerHTML += `
                    <option value="${castClass.name}">${castClass.name.charAt(0).toUpperCase() + castClass.name.slice(1)}</option>
                `;
  }
}

function cleanDescription(htmlString) {
  // Use a virtual DOM element to parse and strip HTML tags
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  let text = tempDiv.textContent || tempDiv.innerText || "";

  // Now clean additional patterns from the plain text:
  // Remove parenthetical text: ( Pathfinder RPG ... )
  text = text.replace(/\([^)]*\)/g, "");

  // Collapse extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

async function exportMeta() {
  const description = cleanDescription(
    '</h3>This item appears to be a string or\r cluster of spherical beads, sometimes\r with the ends tied together to form a\r necklace. (It does not count as an item\r worn around the neck for the purpose\r of determining which of a character’s\r worn magic items is effective.) If a\r character holds it, however, all can see the strand as it really\r is—a golden chain from which hang a number of golden\r spheres. The spheres are detachable by the wearer (and only\r by the wearer), who can easily hurl one of them up to 70 feet.\r When a sphere arrives at the end of its trajectory, it detonates\r as a <i>fireball </i>spell (Reflex DC 14 half).<br/><br/>\r Spheres come in different strengths, ranging from those that\r deal 2d6 points of fire damage to those that deal 10d6. The price\r of a sphere is 150 gp for each die of damage it deals.<br/><br/> <table class="inner"><tr><td><b>Necklace</b></td><td><b>10d6</b></td><td><b>9d6</b></td><td><b>8d6</b></td><td><b>7d6</b></td><td><b>6d6</b></td><td><b>5d6</b></td><td><b>4d6</b></td><td><b>3d6</b></td><td><b>2d6</b></td><td><b>cost</b></td></tr> <tr><td>Type I</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>1</td><td>—</td><td>2</td><td>—</td><td>1,650 gp</td></tr> <tr><td>Type II</td><td>—</td><td>—</td><td>—</td><td>—</td><td>1</td><td>—</td><td>2</td><td>—</td><td>2</td><td>2,700 gp</td></tr> <tr><td>Type III</td><td>—</td><td>—</td><td>—</td><td>1</td><td>—</td><td>2</td><td>—</td><td>4</td><td>—</td><td>4,350 gp</td></tr> <tr><td>Type IV</td><td>—</td><td>—</td><td>1</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>4</td><td>5,400 gp</td></tr> <tr><td>Type V</td><td>—</td><td>1</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>5,850 gp</td></tr> <tr><td>Type VI</td><td>1</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>4</td><td>—</td><td>—</td><td>8,100 gp</td></tr> <tr><td>Type VII</td><td>1</td><td>2</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>2</td><td>—</td><td>8,700 gp</td></tr></table>Each necklace of fireballs contains a combination of\r spheres of various strengths. Some traditional combinations,\r designated types I through VII, are detailed above.<br/><br/>\r If the necklace is being worn or carried by a character who fails\r her saving throw against a magical fire attack, the item must make\r a saving throw as well (with a save bonus of +7). If the necklace\r fails to save, all its remaining spheres detonate simultaneously,\r often with regrettable consequences for the wearer.',
  );

  findMostSimilar(items, description).then((results) => console.log(results));
}
