const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const scriptRoot = path.join(root, "scripts");
const context = {
  window: {
    PFBuffs: {
      scaledBonusValue(bonus) {
        return (
          Number(bonus.scaledValue ?? bonus.value ?? 0) +
          Number(bonus.bonusScale?.testAdd || 0)
        );
      },
    },
  },
};
vm.runInNewContext(
  fs.readFileSync(path.join(scriptRoot, "effect-rolls.js"), "utf8"),
  context,
);
vm.runInNewContext(
  fs.readFileSync(path.join(scriptRoot, "effect-healing.js"), "utf8"),
  context,
);

const healing = context.window.PFEffectHealing;
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

async function main() {

const scaledHeal = healing.applicationResult(
  { bonuses: [{ stat: "healing", value: 3, scaledValue: 8 }] },
  7,
  24,
);
expect(
  scaledHeal.current === 15 && scaledHeal.healed === 8,
  "Healing did not use its scaled value.",
);

const combinedHeal = healing.applicationResult(
  {
    bonuses: [
      { stat: "healing", value: 4 },
      { stat: "healing", value: 3 },
    ],
  },
  10,
  30,
);
expect(
  combinedHeal.current === 17 && combinedHeal.healed === 7,
  "Multiple healing rows were not combined.",
);

const cappedHeal = healing.applicationResult(
  { bonuses: [{ stat: "healing", value: 8 }] },
  21,
  24,
);
expect(
  cappedHeal.current === 24 && cappedHeal.healed === 3,
  "Healing exceeded maximum HP.",
);

const capped = healing.healingResult(21, 24, 8);
expect(capped.current === 24 && capped.healed === 3, "Fast Healing exceeded maximum HP.");

const strongest = healing.fastHealingValue([
  { bonuses: [{ stat: "fast healing", value: 2 }] },
  { bonuses: [{ stat: "fast healing", scaledValue: 5 }] },
  { bonuses: [{ stat: "fast healing", value: 9, conditional: true }] },
]);
expect(strongest === 5, "Fast Healing did not use the highest unconditional value.");

const formulaHeal = healing.applicationResult(
  {
    bonuses: [
      {
        stat: "healing",
        value: 2,
        bonusScale: { testAdd: 3 },
        diceCount: 1,
        dieType: 4,
        diceCountScale: { testAdd: 1 },
        maximizeDice: true,
      },
    ],
  },
  1,
  30,
);
expect(
  formulaHeal.current === 14 && formulaHeal.healed === 13,
  "Healing did not combine scaled dice and scaled static values.",
);

let openedRolls = null;
context.window.PFDamageRolls = {
  async open(options) {
    openedRolls = options.rolls;
    return [{ total: 11 }];
  },
};
const resolved = await healing.resolveRolls(
  {
    effects: [
      {
        stat: "healing",
        value: 2,
        bonusScale: { testAdd: 3 },
        diceCount: 1,
        dieType: 8,
        diceCountScale: { testAdd: 1 },
      },
    ],
  },
  { title: "Cure Test" },
);
expect(openedRolls?.[0]?.diceCountScale?.testAdd === 1, "Healing did not send dice scaling to the roll modal.");
expect(openedRolls?.[0]?.staticDamageScale?.testAdd === 3, "Healing did not send static scaling to the roll modal.");
expect(resolved?.effects?.[0]?.resolvedValue === 11, "Authored healing effects did not retain the rolled value.");

for (const htmlFile of ["character-sheet.html", "map.html"]) {
  const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
  expect(html.includes("scripts/effect-healing.js"), `${htmlFile} does not load the healing runtime.`);
  expect(
    html.indexOf("scripts/effect-rolls.js") <
      html.indexOf("scripts/effect-healing.js"),
    `${htmlFile} loads healing before the shared formula runtime.`,
  );
}

const editor = fs.readFileSync(path.join(scriptRoot, "effect-editor.js"), "utf8");
expect(editor.includes("healingOptgroupHtml"), "The shared effect editor is missing the Healing group.");
expect(editor.includes('data-effect-field="diceCount"'), "Healing is missing a dice-count stepper.");
expect(editor.includes('data-healing-scale-host="dice"'), "Healing is missing dice-count scaling.");
expect(editor.includes('data-effect-field="diceCountMax"'), "Healing is missing a dice-count maximum.");
expect(
  editor.indexOf('data-healing-formula') <
    editor.indexOf('class="effect-value-field"'),
  "Healing dice fields must be arranged before the static healing fields.",
);
expect(
  editor.includes('row.classList.toggle("is-instant-healing", instantHealing)'),
  "Healing rows do not expose their dedicated formula layout state.",
);
const effectRollStyles = fs.readFileSync(
  path.join(root, "css", "effect-rolls.css"),
  "utf8",
);
expect(
  effectRollStyles.includes(".effect-healing-formula {\n  display: contents;"),
  "Healing formula controls are still isolated in a nested grid.",
);
expect(
  !editor.includes("isHealToMaximumStat"),
  "The shared effect editor still treats Healing as a fill-to-maximum toggle.",
);

const characterSheet = fs.readFileSync(
  path.join(scriptRoot, "pages/character-sheet.js"),
  "utf8",
);
expect(
  characterSheet.includes("applyHealingAfterSpellTarget"),
  "Character-sheet spell targeting does not apply healing.",
);
const map = fs.readFileSync(path.join(scriptRoot, "pages/map.js"), "utf8");
expect(
  map.includes("applyFastHealingForEndedTurn(endingRow)"),
  "Map turn advancement does not process Fast Healing.",
);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Effect healing checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
