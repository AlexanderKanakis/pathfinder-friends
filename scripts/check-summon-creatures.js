const assert = require("node:assert/strict");
const fs = require("node:fs");

const monsters = [
  {
    name: "Dire Rat",
    url: "dire-rat",
    creatureType: "animal",
    size: "Small",
    hp: 5,
    hpText: "5 (1d8+1)",
    strength: 10,
    dexterity: 17,
    constitution: 12,
    intelligence: 2,
    wisdom: 12,
    charisma: 4,
    bab: 0,
    init: 3,
    fortitude: 3,
    reflex: 5,
    will: 1,
    cmb: 0,
    cmd: 13,
    ac: { total: 15, touch: 14, flatFooted: 12, natural: 1 },
    skills: [{ name: "Perception", bonus: 4 }],
    weapons: [],
  },
];

global.fetch = async () => ({ ok: true, json: async () => monsters });
global.PFEffectRolls = {
  scaledValue(value) {
    return Number(value || 0);
  },
};

const summons = require("./summon-creatures.js");
const decisions = require("./effect-decisions.js");

(async () => {
  const config = summons.normalize({
    countMode: "fixed",
    count: 2,
    monsterKeys: ["dire-rat"],
  });
  assert.equal(config.countMode, "fixed");
  assert.equal(config.countMax, null);
  assert.equal(summons.rollCount(config).count, 2);
  assert.equal(
    summons.rollCount({ countMode: "fixed", count: 8, countMax: 3 }).count,
    3,
  );

  const dice = summons.rollCount(
    { countMode: "dice", diceCount: 2, dieType: 4, staticValue: 1 },
    {},
    () => 0,
  );
  assert.deepEqual(dice, { count: 3, rolls: [1, 1] });
  assert.deepEqual(
    summons.rollCount(
      {
        countMode: "dice",
        diceCount: 5,
        diceCountMax: 2,
        dieType: 4,
        staticValue: 7,
        staticValueMax: 1,
      },
      {},
      () => 0,
    ),
    { count: 3, rolls: [1, 1] },
  );

  assert.deepEqual(
    summons.availableMonsters(
      { sourceMode: "size", sizeOperator: "eq", sizeValue: "Small" },
      monsters,
    ).map((monster) => monster.name),
    ["Dire Rat"],
  );
  assert.equal(
    summons.availableMonsters(
      { sourceMode: "size", sizeOperator: "lt", sizeValue: "Medium" },
      monsters,
    ).length,
    1,
  );
  assert.equal(
    summons.availableMonsters(
      { sourceMode: "size", sizeOperator: "lt", sizeValue: "Small" },
      monsters,
    ).length,
    0,
  );

  const unresolved = {
    name: "Summon Nature's Ally",
    summonCreatures: [{ ...config, targetChooses: true }],
  };
  assert.equal(decisions.hasDecision(unresolved), true);
  assert.equal(decisions.decisionOwner(unresolved), decisions.TARGET);
  const resolved = await summons.resolveChoices(unresolved);
  assert.equal(resolved.summonCreatures[0].selectedMonsterKey, "dire-rat");

  const mapState = {
    settings: { cols: 20, rows: 20 },
    tokens: [],
    initiative: [],
  };
  const caster = { id: "caster", name: "Caster", x: 10, y: 10, w: 1, h: 1 };
  mapState.tokens.push(caster);
  const spawned = await summons.spawn(
    { ...resolved, remaining: 2, casterLevel: 5 },
    { mapState, sourceToken: caster, ownerId: "owner" },
  );
  assert.equal(spawned.ok, true);
  assert.equal(spawned.tokens.length, 2);
  assert.deepEqual(spawned.tokens.map((token) => token.name), ["Dire Rat 1", "Dire Rat 2"]);
  assert.equal(spawned.tokens[0].w, 1);
  assert.equal(spawned.tokens[0].sheet.calculated.hp.total, 5);
  assert.equal(Array.isArray(spawned.tokens[0].sheet.calculated.abilities), true);
  assert.equal(Array.isArray(spawned.tokens[0].sheet.calculated.saves), true);
  assert.equal(spawned.tokens[0].sheet.calculated.combat.cmd, 13);
  assert.equal(mapState.initiative.length, 2);

  assert.deepEqual(summons.advance(mapState, "caster").expiredIds, []);
  const expired = summons.advance(mapState, "caster");
  assert.equal(expired.expiredIds.length, 2);
  assert.deepEqual(mapState.tokens.map((token) => token.id), ["caster"]);
  assert.equal(mapState.initiative.length, 0);

  const effectEditorSource = fs.readFileSync("scripts/effect-editor.js", "utf8");
  assert.match(effectEditorSource, /removeEventListener\("click", scaleBtn\._effectScaleClickHandler\)/);

  const summonSource = fs.readFileSync("scripts/summon-creatures.js", "utf8");
  ["countMax", "diceCountMax", "staticValueMax"].forEach((field) =>
    assert.match(summonSource, new RegExp('stepper\\("' + field + '"')),
  );
  ["sizeOperator", "sizeValue"].forEach((field) =>
    assert.match(
      summonSource,
      new RegExp('data-summon-field="' + field + '"'),
    ),
  );

  const mapSource = fs.readFileSync("scripts/pages/map.js", "utf8");
  assert.match(mapSource, /function controlsSummonedCreature\(token\)/);
  assert.match(mapSource, /\(placementToken \|\| sourceToken\)\.ownerId/);
  assert.match(mapSource, /return canViewTokenSheet\(token\) && token\.sheet\?\.calculated/);

  const characterSheetSource = fs.readFileSync(
    "scripts/pages/character-sheet.js",
    "utf8",
  );
  assert.match(characterSheetSource, /controllerOwnerId \|\|/);
  assert.match(characterSheetSource, /target\?\.ownerId \|\| ""/);

  const expectedPages = [
    "spell-editor.html",
    "feat-editor.html",
    "class-editor.html",
    "class-feature-pool-editor.html",
    "race-editor.html",
    "item-catalog-editor.html",
    "bag-of-holding.html",
    "character-sheet.html",
    "map.html",
  ];
  expectedPages.forEach((page) =>
    assert.match(fs.readFileSync(page, "utf8"), /scripts\/summon-creatures\.js/),
  );
  console.log("Summon creature checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
