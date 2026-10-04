const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(rootDir, "scripts/pages/character-sheet.js"),
  "utf8",
);

function functionSource(name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const open = source.indexOf("{", source.indexOf(")", start));
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Unclosed ${name}`);
}

const context = {
  window: {
    PFEffectStats: {
      isChoiceStat: (stat) => String(stat || "").startsWith("choice:"),
      skillListIncludesSkill: (_stat, skill, list) =>
        (list?.skills || []).includes(skill),
      skillTrainingStatus: (skill) =>
        /^knowledge/i.test(skill) ? "trained" : "untrained",
    },
  },
  skillStatKey: (skill) =>
    `skill:${String(skill).replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
  genericSkillStatKey: (skill) => {
    if (/^craft/i.test(skill)) return "skill:craft";
    if (/^profession/i.test(skill)) return "skill:profession";
    if (/^perform/i.test(skill)) return "skill:perform";
    return "";
  },
};
vm.createContext(context);
vm.runInContext(functionSource("bonusRanksValue"), context);
vm.runInContext(functionSource("bonusRanksTargetMatchesSkill"), context);
vm.runInContext(functionSource("clampSkillRankInput"), context);

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const rankInput = { value: "9", min: "", max: "" };
expect(
  context.clampSkillRankInput(rankInput, 5) === 5 && rankInput.value === "5",
  "Manual ranks were not capped at character level.",
);
expect(
  context.bonusRanksValue({ value: 2.9 }) === 2,
  "Bonus ranks should normalize to a non-negative integer.",
);
expect(
  context.bonusRanksTargetMatchesSkill(
    { stat: "knowledge skill checks" },
    "Knowledge (arcana)",
    "int",
  ),
  "Knowledge skill group did not match a Knowledge skill.",
);
expect(
  context.bonusRanksTargetMatchesSkill(
    { stat: "dexterity skill checks" },
    "Acrobatics",
    "dex",
  ),
  "Ability skill group did not match its skill.",
);
expect(
  context.bonusRanksTargetMatchesSkill(
    { stat: "skill-list:test", skillList: { skills: ["Perception"] } },
    "Perception",
    "wis",
  ),
  "Custom skill list did not match its included skill.",
);
expect(
  !context.bonusRanksTargetMatchesSkill(
    { stat: "choice:skills-all" },
    "Perception",
    "wis",
  ),
  "An unresolved choice pool must not grant ranks.",
);

if (failures.length) {
  console.error("Bonus ranks checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Bonus ranks checks passed for caps, groups, custom lists, and unresolved choices.");
