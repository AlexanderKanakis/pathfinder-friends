const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
global.window = {};
require(path.join(rootDir, "scripts", "effect-stat-options.js"));
require(path.join(rootDir, "scripts", "buff-calculator.js"));

const stats = global.window.PFEffectStats;
assert(stats, "PFEffectStats did not initialize.");

const trainedOnly = [
  "Disable Device",
  "Handle Animal",
  "Knowledge (arcana)",
  "Linguistics",
  "Profession (sailor)",
  "Sleight of Hand",
  "Spellcraft",
  "Use Magic Device",
];
trainedOnly.forEach((skill) => {
  assert.strictEqual(
    stats.skillTrainingStatus(skill),
    "trained",
    `${skill} must require training.`,
  );
});

["Acrobatics", "Craft (alchemy)", "Perform (oratory)"].forEach((skill) => {
  assert.strictEqual(
    stats.skillTrainingStatus(skill),
    "untrained",
    `${skill} must remain usable untrained.`,
  );
});

const recipientSkills = stats.PF_SKILLS_WITH_ABILITY.map((entry) => ({
  ...stats.normalizeSkillEntry(entry),
  classSkill: ["Disable Device", "Spellcraft"].includes(entry[0]),
}));
async function main() {
  const classTrained = await stats.resolveChoicePoolOptions(
    "skills-class-trained",
    { skills: recipientSkills },
  );
  assert.deepStrictEqual(
    classTrained.map((entry) => entry.label).sort(),
    ["Disable Device", "Spellcraft"],
    "Class trained-only choices must be filtered using recipient class skills.",
  );

  const sheetSource = fs.readFileSync(
    path.join(rootDir, "scripts", "pages", "character-sheet.js"),
    "utf8",
  );
  assert(sheetSource.includes('el(`${id}Total`).value = usable'), "Sheet totals must be blanked when unusable.");
  assert(sheetSource.includes('classList.toggle("is-untrained-skill", !usable)'), "Unusable rows must be visually marked.");
  assert(
    sheetSource.includes(
      'if (isKnowledgeSkill(name)) return "knowledge skill checks";',
    ),
    "Knowledge-wide bonuses must be included in each Knowledge skill total.",
  );

  const skald = JSON.parse(
    fs.readFileSync(path.join(rootDir, "data", "classes", "skald.json"), "utf8"),
  );
  const bardicKnowledge = skald.levelProgression
    .flatMap((level) => level.classFeatures || [])
    .find((feature) => feature.name === "Bardic Knowledge");
  assert(bardicKnowledge, "Skald Bardic Knowledge must exist.");
  const calculation = global.window.PFBuffs.calculateStatsDetailed(
    [{ name: bardicKnowledge.name, bonuses: bardicKnowledge.effects }],
    {
      characterLevel: 11,
      classLevels: { Skald: 11 },
      skillRanks: {},
    },
  );
  assert.strictEqual(
    calculation.bonuses["knowledge skill checks"],
    5,
    "An 11th-level Skald must receive +5 on every Knowledge skill check.",
  );
  const firstLevelCalculation = global.window.PFBuffs.calculateStatsDetailed(
    [{ name: bardicKnowledge.name, bonuses: bardicKnowledge.effects }],
    {
      characterLevel: 1,
      classLevels: { Skald: 1 },
      skillRanks: {},
    },
  );
  assert.strictEqual(
    firstLevelCalculation.bonuses["knowledge skill checks"],
    1,
    "A 1st-level Skald must receive Bardic Knowledge's minimum +1.",
  );
  assert.strictEqual(
    bardicKnowledge.effects[0].bonusScale.minimumOne,
    true,
    "Bardic Knowledge must retain its minimum +1 at 1st level.",
  );

  const mapSource = fs.readFileSync(
    path.join(rootDir, "scripts", "pages", "map.js"),
    "utf8",
  );
  assert(mapSource.includes("row.usable === false ? 0"), "Map rolls must force unusable trained skills to +0.");

  console.log("Trained skill checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
