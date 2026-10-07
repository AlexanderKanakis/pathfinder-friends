const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "data");
const write = process.argv.includes("--write");

const mechanicKeys = [
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
  "damageRolls",
];

const aliases = {
  abilityBonus: "attributeBonus",
  abilityBonuses: "attributeBonuses",
  attributeModifierSource: "attributeSource",
  source_loot_id: "sourceLootId",
  weapon_type: "weaponType",
  attack_scale: "attackScale",
  damage_scale: "damageScale",
  two_handed: "twoHanded",
  power_attack: "powerAttack",
  deadly_aim: "deadlyAim",
  rapid_shot: "rapidShot",
  twf_no_feat_primary: "twfNoFeatPrimary",
  twf_no_feat_off: "twfNoFeatOff",
  twf_feat_primary: "twfFeatPrimary",
  twf_feat_off: "twfFeatOff",
  improved_twf: "improvedTwf",
  greater_twf: "greaterTwf",
  special_material: "specialMaterial",
  generated_equipment_id: "generatedEquipmentId",
  generated_source: "generatedSource",
  armor_group: "armorGroup",
  max_dex: "maxDex",
  natural_attack_kind: "naturalAttackKind",
  natural_attack_role: "naturalAttackRole",
};

function migrateObject(node, counters) {
  Object.entries(aliases).forEach(([legacy, canonical]) => {
    if (!(legacy in node)) return;
    if (!(canonical in node)) node[canonical] = node[legacy];
    delete node[legacy];
    counters.aliases += 1;
  });

  if (
    typeof node.condition === "string" &&
    !("appliesWhen" in node)
  ) {
    node.appliesWhen = node.condition;
    delete node.condition;
    counters.aliases += 1;
  }

  if (node.sharedAmongTargets !== undefined) {
    if (node.splitAmongTargets === undefined)
      node.splitAmongTargets = Boolean(node.sharedAmongTargets);
    delete node.sharedAmongTargets;
    counters.aliases += 1;
  }

  const hasLegacyDuration =
    node.durationCount !== undefined ||
    node.durationUnit !== undefined ||
    node.durationPerLevel !== undefined;
  if (hasLegacyDuration) {
    if (!node.durationConfig) {
      const count = node.durationCount;
      const unit = node.durationUnit || "variable";
      node.durationConfig = {
        count:
          count === null || count === undefined || count === ""
            ? null
            : Number(count),
        unit,
        factors: node.durationPerLevel ? [{ type: "caster" }] : [],
      };
    }
    delete node.durationCount;
    delete node.durationUnit;
    delete node.durationPerLevel;
    counters.durations += 1;
  }

  if (
    (node.attributeBonus || Array.isArray(node.attributeBonuses)) &&
    !node.attributeSource
  ) {
    node.attributeSource = "caster";
    counters.attributeSources += 1;
  }

  if (node.weaponType === "Natural") {
    node.weaponType = "Natural Weapon";
    counters.weaponTypes += 1;
  }

  if (node.activatable === true && !node.activeMechanics) {
    const activeMechanics = Object.fromEntries(
      mechanicKeys.map((key) => [
        key,
        Array.isArray(node[key]) ? node[key] : [],
      ]),
    );
    if (Array.isArray(node.branches) && node.branches.length)
      activeMechanics.branches = node.branches;
    if (node.durationConfig) activeMechanics.durationConfig = node.durationConfig;
    if (node.auraConfig) activeMechanics.auraConfig = node.auraConfig;
    node.activeMechanics = activeMechanics;
    mechanicKeys.forEach((key) => {
      node[key] = [];
    });
    delete node.branches;
    delete node.durationConfig;
    delete node.auraConfig;
    counters.activatables += 1;
  }
  if (node.activatable !== undefined) {
    delete node.activatable;
    counters.activatableFlags += 1;
  }
}

function migrateTree(value, counters) {
  if (Array.isArray(value)) {
    value.forEach((entry) => migrateTree(entry, counters));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((entry) => migrateTree(entry, counters));
  migrateObject(value, counters);
}

function canonicalizeSpells(spells, counters) {
  (Array.isArray(spells) ? spells : []).forEach((spell) => {
    const hasTopLevel =
      mechanicKeys.some(
        (key) => Array.isArray(spell[key]) && spell[key].length,
      ) ||
      Array.isArray(spell.branches) ||
      Boolean(spell.durationConfig) ||
      Boolean(spell.auraConfig);
    const hasActive =
      spell.activeMechanics && typeof spell.activeMechanics === "object";
    if (!hasTopLevel && !hasActive) return;
    const active = hasActive ? spell.activeMechanics : {};
    mechanicKeys.forEach((key) => {
      if (!Array.isArray(active[key]))
        active[key] = Array.isArray(spell[key]) ? spell[key] : [];
      spell[key] = [];
    });
    if (!Array.isArray(active.branches) && Array.isArray(spell.branches))
      active.branches = spell.branches;
    if (!active.durationConfig && spell.durationConfig)
      active.durationConfig = spell.durationConfig;
    if (!active.auraConfig && spell.auraConfig)
      active.auraConfig = spell.auraConfig;
    spell.activeMechanics = active;
    delete spell.branches;
    delete spell.durationConfig;
    delete spell.auraConfig;
    counters.spellGroups += 1;
  });
}

function jsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(target);
    return entry.isFile() && entry.name.endsWith(".json") ? [target] : [];
  });
}

const totals = {
  aliases: 0,
  durations: 0,
  attributeSources: 0,
  activatables: 0,
  activatableFlags: 0,
  weaponTypes: 0,
  spellGroups: 0,
};
const changedFiles = [];

for (const file of jsonFiles(dataRoot)) {
  if (path.basename(file) === "monsters.json") continue;
  const original = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(original);
  const before = JSON.stringify(parsed);
  migrateTree(parsed, totals);
  if (path.basename(file) === "spells.json") canonicalizeSpells(parsed, totals);
  if (JSON.stringify(parsed) === before) continue;
  changedFiles.push(path.relative(root, file));
  if (write) fs.writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
}

const monstersPath = path.join(dataRoot, "monsters.json");
const monsters = fs.readFileSync(monstersPath, "utf8");
const migratedMonsters = monsters.replace(
  /(\"weaponType\"\s*:\s*)\"Natural\"/g,
  '$1"Natural Weapon"',
);
const monsterChanges = (monsters.match(/\"weaponType\"\s*:\s*\"Natural\"/g) || [])
  .length;
if (monsterChanges) {
  totals.weaponTypes += monsterChanges;
  changedFiles.push(path.relative(root, monstersPath));
  if (write) fs.writeFileSync(monstersPath, migratedMonsters);
}

if (changedFiles.length) {
  console.log(`${write ? "Migrated" : "Legacy data found in"}:`);
  changedFiles.forEach((file) => console.log(`- ${file}`));
  console.log(JSON.stringify(totals, null, 2));
  if (!write) process.exitCode = 1;
} else {
  console.log("Authored JSON is canonical.");
}
