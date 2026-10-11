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
