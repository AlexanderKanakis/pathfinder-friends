(function (root, factory) {
  const api = factory(root);
  if (root) root.PFSummonCreatures = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const MODAL_ID = "summonCreaturesEditorModal";
  const CREATURE_SIZES = Object.freeze([
    "Fine",
    "Diminutive",
    "Tiny",
    "Small",
    "Medium",
    "Large",
    "Huge",
    "Gargantuan",
    "Colossal",
  ]);
  const SIZE_CELLS = Object.freeze({ Fine: 1, Diminutive: 1, Tiny: 1, Small: 1, Medium: 1, Large: 2, Huge: 3, Gargantuan: 4, Colossal: 6 });
  const SKILL_ABILITIES = Object.freeze({ Acrobatics: "dex", Appraise: "int", Bluff: "cha", Climb: "str", Diplomacy: "cha", "Disable Device": "dex", Disguise: "cha", "Escape Artist": "dex", Fly: "dex", "Handle Animal": "cha", Heal: "wis", Intimidate: "cha", Linguistics: "int", Perception: "wis", Ride: "dex", "Sense Motive": "wis", "Sleight of Hand": "dex", Spellcraft: "int", Stealth: "dex", Survival: "wis", Swim: "str", "Use Magic Device": "cha" });
  let catalogPromise = null;
  let templateCatalogPromise = null;
  let modal = null;
  let editorState = null;
  let editorResolve = null;

  const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const optionalMaximum = (value) =>
    value === "" || value === null || value === undefined
      ? null
      : Math.max(0, Math.floor(number(value)));
  const slug = (value) => String(value || "").trim().toLowerCase();
  const monsterKey = (monster = {}) => String(monster.url || monster.name || "");
  const monsterHd = (monster = {}) => number(String(monster.hpText || "").match(/\((\d+)d/i)?.[1], 1);
  const scoreMod = (score) => Math.floor((number(score, 10) - 10) / 2);
  const skillId = (name) => String(name || "").replace(/[^a-z0-9]/gi, "");
  const signed = (value) => number(value) >= 0 ? `+${number(value)}` : String(number(value));

  async function loadCatalog() {
    catalogPromise ||= fetch("data/monsters.json").then((response) => {
      if (!response.ok) throw new Error("Could not load the monster catalog.");
      return response.json();
    });
    return catalogPromise;
  }

  async function loadTemplateCatalog() {
    templateCatalogPromise ||= root.PFTemplateData
      ?.load?.()
      .then((data) => data.templates || []);
    return (await templateCatalogPromise) || [];
  }

  function normalizeSelector(selector = {}) {
    const mode = selector.mode === "filtered" ? "filtered" : "custom";
    const byKind = new Map();
    (Array.isArray(selector.filters) ? selector.filters : []).forEach((filter) => {
      if (filter?.kind === "type") {
        byKind.set("type", {
          kind: "type",
          values: [
            ...new Set(
              (Array.isArray(filter.values) ? filter.values : [])
                .map(slug)
                .filter(Boolean),
            ),
          ],
        });
      } else if (filter?.kind === "hd") {
        byKind.set("hd", {
          kind: "hd",
          operator: filter.operator === "lt" ? "lt" : "eq",
          value: Math.max(1, Math.floor(number(filter.value, 1))),
        });
      } else if (filter?.kind === "size") {
        byKind.set("size", {
          kind: "size",
          operator: filter.operator === "lt" ? "lt" : "eq",
          value: CREATURE_SIZES.includes(filter.value)
            ? filter.value
            : "Medium",
        });
      }
    });
    return {
      mode,
      monsterKeys: [
        ...new Set(
          (Array.isArray(selector.monsterKeys) ? selector.monsterKeys : [])
            .map(String)
            .filter(Boolean),
        ),
      ],
      filters: [...byKind.values()],
    };
  }

  function normalize(config = {}) {
    const mode = config.countMode === "dice" ? "dice" : "fixed";
    const templateMode = ["fixed", "caster-choice"].includes(config.templateMode)
      ? config.templateMode
      : "none";
    return {
      id: String(config.id || `summon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      countMode: mode,
      count: Math.max(0, Math.floor(number(config.count, 1))),
      countMax: optionalMaximum(config.countMax),
      countScale: config.countScale || null,
      diceCount: Math.max(0, Math.floor(number(config.diceCount, 1))),
      diceCountMax: optionalMaximum(config.diceCountMax),
      dieType: Math.max(2, Math.floor(number(config.dieType, 4))),
      diceCountScale: config.diceCountScale || null,
      staticValue: Math.floor(number(config.staticValue, 0)),
      staticValueMax: optionalMaximum(config.staticValueMax),
      staticValueScale: config.staticValueScale || null,
      selector: normalizeSelector(config.selector),
      targetChooses: Boolean(config.targetChooses),
      selectedMonsterKey: String(config.selectedMonsterKey || ""),
      selectedMonsterName: String(config.selectedMonsterName || ""),
      templateMode,
      templateIds: [
        ...new Set(
          (Array.isArray(config.templateIds) ? config.templateIds : [])
            .map(String)
            .filter(Boolean),
        ),
      ],
      selectedTemplateIds: [
        ...new Set(
          (Array.isArray(config.selectedTemplateIds)
            ? config.selectedTemplateIds
            : [])
            .map(String)
            .filter(Boolean),
        ),
      ],
    };
  }

  function availableMonsters(config, catalog) {
    const row = normalize(config);
    if (row.selector.mode === "custom") {
      const keys = new Set(row.selector.monsterKeys);
      return catalog.filter((monster) => keys.has(monsterKey(monster)));
    }
    return catalog.filter((monster) =>
      row.selector.filters.every((filter) => {
        if (filter.kind === "type") {
          return new Set(filter.values).has(slug(monster.creatureType));
        }
        if (filter.kind === "hd") {
          return filter.operator === "lt"
            ? monsterHd(monster) < filter.value
            : monsterHd(monster) === filter.value;
        }
        const targetIndex = CREATURE_SIZES.indexOf(filter.value);
        const monsterIndex = CREATURE_SIZES.findIndex(
          (size) => slug(size) === slug(monster.size),
        );
        if (monsterIndex < 0) return false;
        return filter.operator === "lt"
          ? monsterIndex < targetIndex
          : monsterIndex === targetIndex;
      }),
    );
  }

  function hasChoice(config = {}) {
    const row = normalize(config);
    return (
      !row.selectedMonsterKey ||
      (row.templateMode === "caster-choice" && !row.selectedTemplateIds.length)
    );
  }

  function hasSummon(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object") return false;
    if (seen.has(value)) return false;
    seen.add(value);
    if (
      Array.isArray(value.summonCreatures) &&
      value.summonCreatures.length > 0
    )
      return true;
    return Object.values(value).some((child) => hasSummon(child, seen));
  }

  function hasPendingChoice(effect = {}) {
    return (Array.isArray(effect.summonCreatures) ? effect.summonCreatures : []).some(hasChoice);
  }

  function targetChooses(effect = {}) {
    return (Array.isArray(effect.summonCreatures) ? effect.summonCreatures : []).some((entry) => normalize(entry).targetChooses && hasChoice(entry));
  }

  async function resolveChoices(effect = {}, { title = "Effect" } = {}) {
    const rows = Array.isArray(effect.summonCreatures) ? effect.summonCreatures : [];
    if (!rows.length) return effect;
    const [catalog, templates] = await Promise.all([
      loadCatalog(),
      loadTemplateCatalog(),
    ]);
    const resolved = [];
    for (const entry of rows) {
      const row = normalize(entry);
      if (!row.selectedMonsterKey) {
        const options = availableMonsters(row, catalog);
        if (!options.length) return null;
        let selected = options[0];
        if (options.length > 1) {
          const picked = await root.PFEffectChoicePicker?.open?.({
            title: `${title}: Choose Summoned Creature`,
            options: options.map((monster) => ({ value: monsterKey(monster), label: `${monster.name} | ${monster.creatureType || "creature"} | ${monsterHd(monster)} HD | ${monster.size || "Medium"}` })),
          });
          if (!picked) return null;
          selected = options.find((monster) => monsterKey(monster) === String(typeof picked === "object" ? picked.value : picked));
        }
        if (!selected) return null;
        row.selectedMonsterKey = monsterKey(selected);
        row.selectedMonsterName = selected.name || "Creature";
      }
      if (row.templateMode === "fixed") {
        row.selectedTemplateIds = row.templateIds.slice();
      } else if (
        row.templateMode === "caster-choice" &&
        !row.selectedTemplateIds.length
      ) {
        const choices = templates.filter((template) =>
          row.templateIds.includes(String(template.id)),
        );
        if (!choices.length) return null;
        let chosen = choices[0];
        if (choices.length > 1) {
          const picked = await root.PFEffectChoicePicker?.open?.({
            title: `${title}: Choose Creature Template`,
            options: choices.map((template) => ({
              value: template.id,
              label: `${template.name}${template.crAdjustment ? ` | CR ${template.crAdjustment}` : ""}`,
            })),
          });
          if (!picked) return null;
          chosen = choices.find((template) =>
            String(template.id) === String(typeof picked === "object" ? picked.value : picked),
          );
        }
        if (!chosen) return null;
        row.selectedTemplateIds = [String(chosen.id)];
      }
      resolved.push(row);
    }
    return { ...effect, summonCreatures: resolved };
  }

  function scaledValue(value, scale, context = {}) {
    return root.PFEffectRolls?.scaledValue?.(value, scale, context) ?? number(value);
  }

  function cappedScaledValue(value, scale, maximum, context = {}) {
    const scaled = Math.floor(scaledValue(value, scale, context));
    return maximum === null ? scaled : Math.min(scaled, maximum);
  }

  function rollCount(config = {}, context = {}, random = Math.random) {
    const row = normalize(config);
    if (row.countMode === "fixed") {
      return {
        count: Math.max(
          0,
          cappedScaledValue(row.count, row.countScale, row.countMax, context),
        ),
        rolls: [],
      };
    }
    const dice = Math.max(
      0,
      cappedScaledValue(
        row.diceCount,
        row.diceCountScale,
        row.diceCountMax,
        context,
      ),
    );
    const staticValue = cappedScaledValue(
      row.staticValue,
      row.staticValueScale,
      row.staticValueMax,
      context,
    );
    const rolls = Array.from(
      { length: dice },
      () => 1 + Math.floor(random() * row.dieType),
    );
    return {
      count: Math.max(
        0,
        rolls.reduce((total, roll) => total + roll, staticValue),
      ),
      rolls,
    };
  }

  function formatList(value) {
    if (!value) return "";
    if (Array.isArray(value)) return value.map(formatList).filter(Boolean).join(", ");
    if (typeof value === "object") return Object.entries(value).map(([key, entry]) => `${key}: ${formatList(entry)}`).join(", ");
    return String(value);
  }

  function weaponRows(monster = {}) {
    return (Array.isArray(monster.weapons) ? monster.weapons : []).map((weapon) => ({
      name: weapon.characterSheet?.name || weapon.name || "Attack",
      type: "Weapon",
      weaponType: weapon.characterSheet?.weaponType || weapon.weaponType || "Natural Weapon",
      attackScale: weapon.characterSheet?.attackScale || weapon.attackScale || "STR",
      damageScale: "",
      templateAttack: weapon.attackRoutine || weapon.characterSheet?.attack || weapon.attackBonus || "",
      attack: weapon.attackRoutine || weapon.characterSheet?.attack || weapon.attackBonus || "",
      damage: weapon.damage?.dice || weapon.characterSheet?.damage || "",
      damageType: weapon.damageType || "",
      extraDamage: clone(weapon.extraDamage || weapon.damage?.extra || []),
      critical: weapon.characterSheet?.critical || weapon.critical || "20/x2",
      details: weapon.characterSheet?.details || weapon.raw || "",
      attackMisc: "0",
      damageMisc: String(weapon.damage?.staticModifier ?? 0),
    }));
  }

  function monsterSheet(monster = {}, name = monster.name || "Summoned Creature") {
    const scores = { str: number(monster.strength, 10), dex: number(monster.dexterity, 10), con: number(monster.constitution, 10), int: number(monster.intelligence, 10), wis: number(monster.wisdom, 10), cha: number(monster.charisma, 10) };
    const skills = {};
    const customSkills = [];
    (monster.skills || []).forEach((skill) => {
      const skillName = String(skill.name || "").replace(/\s*\+.*/, "").trim();
      if (!skillName) return;
      const ability = SKILL_ABILITIES[skillName] || (/^Craft/i.test(skillName) ? "int" : /^Profession/i.test(skillName) ? "wis" : "int");
      skills[skillId(skillName)] = { ranks: "0", misc: String(number(skill.bonus) - scoreMod(scores[ability])) };
      if (!SKILL_ABILITIES[skillName]) customSkills.push({ name: skillName, ability });
    });
    const ac = monster.ac || {};
    const size = monster.size || "Medium";
    const hp = number(monster.hp);
    const weapons = weaponRows(monster);
    const sheet = {
      fields: {
        characterName: name,
        race: monster.creatureType || "",
        subtype: formatList(monster.subtypes),
        alignment: monster.alignmentName || monster.alignment || "",
        size,
        characterLevel: String(monsterHd(monster)),
        currentHitPoints: String(hp), hitPoints: String(hp), hitPointsTotal: String(hp),
        babMisc: String(number(monster.bab)),
        initMisc: String(number(monster.init) - scoreMod(scores.dex)),
        speedBase: Array.isArray(monster.speed) ? monster.speed[0] || "" : monster.speed || "",
        acNatural: String(number(ac.natural)), acNaturalBase: String(number(ac.natural)), acNaturalMisc: "0",
        acDeflection: String(number(ac.deflection)),
        acMisc: String(number(ac.total, 10) - 10 - number(ac.armor) - number(ac.shield) - scoreMod(scores.dex) - number(ac.natural) - number(ac.deflection)),
        cmbMisc: String(number(monster.cmb) - number(monster.bab) - scoreMod(scores.str)),
        cmdMisc: String(number(monster.cmd) - 10 - number(monster.bab) - scoreMod(scores.str) - scoreMod(scores.dex)),
        senses: formatList(monster.senses), aura: formatList(monster.aura), damageReduction: formatList(monster.dr),
        resistances: formatList(monster.resistances), immunities: formatList(monster.immunities), weaknesses: formatList(monster.weaknesses),
        specialAttacks: formatList(monster.specialAttacks), languages: formatList(monster.languages), sq: formatList(monster.sq),
        notes: [monster.hpText ? `HP: ${monster.hpText}` : "", monster.description || ""].filter(Boolean).join("\n\n"),
      },
      abilities: Object.fromEntries(Object.entries(scores).map(([key, score]) => [key, { score: String(score) }])),
      saves: {
        fort: { base: "0", misc: String(number(monster.fortitude) - scoreMod(scores.con)) },
        reflex: { base: "0", misc: String(number(monster.reflex) - scoreMod(scores.dex)) },
        will: { base: "0", misc: String(number(monster.will) - scoreMod(scores.wis)) },
      },
      skills, customSkills, weapons, armor: [], inventory: [], activeBuffs: [],
      calculated: {
        hp: { current: hp, total: hp },
        initiative: number(monster.init),
        abilities: Object.entries(scores).map(([key, score]) => ({
          key,
          label: key.toUpperCase(),
          total: score,
          mod: signed(scoreMod(score)),
          conditionals: [],
        })),
        armorClass: {
          ac: number(ac.total, 10),
          touch: number(ac.touch, 10),
          flat: number(ac.flatFooted, 10),
          conditionals: { ac: [], touch: [], flat: [] },
        },
        combat: {
          cmb: number(monster.cmb),
          cmd: number(monster.cmd),
          conditionals: { cmb: [], cmd: [] },
        },
        size: {
          base: size,
          final: size,
          tokenSize: SIZE_CELLS[size] || 1,
          changes: [],
        },
        saves: [
          { key: "fort", label: "Fort", total: number(monster.fortitude), conditionals: [] },
          { key: "reflex", label: "Ref", total: number(monster.reflex), conditionals: [] },
          { key: "will", label: "Will", total: number(monster.will), conditionals: [] },
        ],
        skills: clone(monster.skills || []),
        weapons: weapons.map((weapon) => ({
          name: weapon.name,
          attack: weapon.attack,
          damage: weapon.damage,
          extraDamage: clone(weapon.extraDamage || []),
          critical: weapon.critical,
          attackConditionals: [],
          damageConditionals: [],
        })),
      },
    };
    return sheet;
  }

  function freeSpawn(mapState, sourceToken, size, offset) {
    const cols = Math.max(1, number(mapState?.settings?.cols, 30));
    const rows = Math.max(1, number(mapState?.settings?.rows, 20));
    const occupied = new Set((mapState.tokens || []).flatMap((token) => Array.from({ length: Math.max(1, number(token.w, 1)) }, (_, dx) => Array.from({ length: Math.max(1, number(token.h, 1)) }, (_, dy) => `${number(token.x) + dx},${number(token.y) + dy}`)).flat()));
    const centerX = Math.floor(number(sourceToken?.x) + number(sourceToken?.w, 1) / 2);
    const centerY = Math.floor(number(sourceToken?.y) + number(sourceToken?.h, 1) / 2);
    for (let step = offset; step < offset + cols * rows; step += 1) {
      const radius = Math.max(1, Math.ceil(Math.sqrt(step + 1)));
      const angle = step * 2.399963229728653;
      const x = Math.max(0, Math.min(cols - size, centerX + Math.round(Math.cos(angle) * radius)));
      const y = Math.max(0, Math.min(rows - size, centerY + Math.round(Math.sin(angle) * radius)));
      let clear = true;
      for (let dx = 0; dx < size && clear; dx += 1) for (let dy = 0; dy < size; dy += 1) if (occupied.has(`${x + dx},${y + dy}`)) { clear = false; break; }
      if (clear) return { x, y };
    }
    return { x: 0, y: 0 };
  }

  async function spawn(effect = {}, { mapState, sourceToken, durationAnchorToken = sourceToken, context = {}, ownerId = "" } = {}) {
    if (!mapState || !sourceToken) return { ok: false, tokens: [], reason: "source-token" };
    const rows = Array.isArray(effect.summonCreatures) ? effect.summonCreatures : [];
    if (!rows.length) return { ok: true, tokens: [] };
    const catalog = await loadCatalog();
    const groupId = `summon-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const plans = rows.map((entry) => {
      const row = normalize(entry);
      const monster = catalog.find((candidate) => monsterKey(candidate) === row.selectedMonsterKey) || availableMonsters(row, catalog)[0];
      return monster
        ? {
            monster,
            count: rollCount(row, { ...context, sourceEffect: effect }).count,
            templateIds: row.selectedTemplateIds.slice(),
          }
        : null;
    }).filter((plan) => plan?.count > 0);
    const totals = new Map();
    plans.forEach(({ monster, count }) => {
      const key = monsterKey(monster);
      totals.set(key, (totals.get(key) || 0) + count);
    });
    const indexes = new Map();
    const created = [];
    let sequence = 0;
    for (const { monster, count, templateIds } of plans) {
      const key = monsterKey(monster);
      for (let index = 0; index < count; index += 1) {
        sequence += 1;
        const summonIndex = (indexes.get(key) || 0) + 1;
        indexes.set(key, summonIndex);
        const numbered = totals.get(key) > 1;
        const name = numbered ? `${monster.name} ${summonIndex}` : monster.name;
        const size = SIZE_CELLS[monster.size] || 1;
        const position = freeSpawn(mapState, sourceToken, size, sequence);
        const sheet = monsterSheet(monster, name);
        sheet.templates = templateIds.slice();
        created.push({
          id: `summon_${Date.now()}_${sequence}_${Math.random().toString(16).slice(2)}`,
          kind: "enemy", enemyId: `summon:${groupId}:${sequence}`, summonedCreature: true,
          summonGroupId: groupId, summonSourceEffectId: effect.id || "", summonAnchorTokenId: durationAnchorToken?.id || sourceToken.id,
          summonRemaining: effect.permanent ? null : effect.remaining ?? effect.computedDuration ?? null,
          ownerId: ownerId || sourceToken.ownerId || "", name, summonIndex: numbered ? summonIndex : 0,
          x: position.x, y: position.y, w: size, h: size, sizeLinked: true,
          zIndex: Math.max(1, ...(mapState.tokens || []).map((token) => number(token.zIndex, 1)), ...created.map((token) => number(token.zIndex, 1))) + 1,
          hp: `${monster.hp || "?"}/${monster.hp || "?"}`, ac: monster.ac?.total || "?", visible: true,
          sheet, color: "#7a5fb5", monsterCatalogKey: key,
        });
      }
    }
    mapState.tokens = [...(mapState.tokens || []), ...created];
    mapState.initiative = Array.isArray(mapState.initiative) ? mapState.initiative : [];
    created.forEach((token) => mapState.initiative.push({ id: `init_${token.id}`, tokenId: token.id, name: token.name, score: number(token.sheet.calculated?.initiative), disabled: false, custom: false }));
    return { ok: created.length > 0, tokens: created, groupId };
  }
  function advance(mapState, endingTokenId) {
    const expired = new Set();
    let changed = false;
    (mapState.tokens || []).forEach((token) => {
      if (!token.summonedCreature || token.summonRemaining === null || token.summonRemaining === undefined || String(token.summonAnchorTokenId) !== String(endingTokenId)) return;
      token.summonRemaining = number(token.summonRemaining) - 1;
      changed = true;
      if (token.summonRemaining <= 0) expired.add(token.id);
    });
    if (expired.size) {
      mapState.tokens = mapState.tokens.filter((token) => !expired.has(token.id));
      mapState.initiative = (mapState.initiative || []).filter((entry) => !expired.has(entry.tokenId));
    }
    return { changed, expiredIds: [...expired] };
  }

  function summary(config = {}) {
    const row = normalize(config);
    const count = row.countMode === "dice" ? `${row.diceCount}d${row.dieType}${row.staticValue ? ` ${signed(row.staticValue)}` : ""}` : String(row.count);
    const filterText = (filter) => {
      if (filter.kind === "type") return `Type: ${filter.values.join(", ") || "none"}`;
      if (filter.kind === "hd") return `HD ${filter.operator === "lt" ? "<" : "="} ${filter.value}`;
      return `Size ${filter.operator === "lt" ? "<" : "="} ${filter.value}`;
    };
    const source = row.selector.mode === "custom"
      ? `${row.selector.monsterKeys.length} selected creature${row.selector.monsterKeys.length === 1 ? "" : "s"}`
      : row.selector.filters.map(filterText).join("; ") || "All creatures";
    const templateSummary =
      row.templateMode === "none"
        ? ""
        : " | " +
          row.templateIds.length +
          " template" +
          (row.templateIds.length === 1 ? "" : "s") +
          (row.templateMode === "fixed" ? " applied" : " for caster choice");
    return (
      count +
      " creature" +
      (count === "1" ? "" : "s") +
      " | " +
      source +
      (row.targetChooses ? " | target chooses" : "") +
      templateSummary
    );
  }

  function stepper(field, value, min = "", placeholder = "") {
    return `<div class="modal-number-stepper"><button class="btn btn-outline-light btn-sm" type="button" data-summon-step="-1" data-summon-step-field="${field}">-</button><input class="form-control form-control-sm text-center" type="number" data-summon-field="${field}" value="${escapeHtml(value ?? "")}"${min !== "" ? ` min="${min}"` : ""}${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}><button class="btn btn-outline-light btn-sm" type="button" data-summon-step="1" data-summon-step-field="${field}">+</button></div>`;
  }

  function ensureEditorModal() {
    if (document.getElementById(MODAL_ID)) return;
    const host = document.createElement("div");
    host.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary"><h5 class="modal-title">Summon Creatures</h5></div>
            <div class="modal-body">
              <div class="summon-editor-grid">
                <div>
                  <label>Count Formula</label>
                  <select class="form-select form-select-sm" data-summon-field="countMode">
                    <option value="fixed">Scaling counter</option>
                    <option value="dice">Scaling dice + static</option>
                  </select>
                </div>
                <label class="form-check form-switch summon-target-choice">
                  <input class="form-check-input" type="checkbox" data-summon-field="targetChooses">
                  <span>Target chooses creature</span>
                </label>
              </div>
              <div data-summon-fixed class="summon-count-grid">
                <div><label>Count</label>${stepper("count", 1, 0)}</div>
                <div><label>Maximum Count</label>${stepper("countMax", null, 0, "No maximum")}</div>
                <div data-summon-scale="count">
                  <button class="btn btn-outline-info btn-sm w-100" type="button" data-summon-scale-button>Scale Count</button>
                  <div class="small text-secondary" data-summon-scale-summary></div>
                </div>
              </div>
              <div data-summon-dice class="summon-count-grid d-none">
                <div><label>Number of Dice</label>${stepper("diceCount", 1, 0)}</div>
                <div><label>Maximum Dice</label>${stepper("diceCountMax", null, 0, "No maximum")}</div>
                <div>
                  <label>Die</label>
                  <select class="form-select form-select-sm" data-summon-field="dieType">
                    ${[2, 3, 4, 6, 8, 10, 12, 20].map((die) => `<option value="${die}">d${die}</option>`).join("")}
                  </select>
                </div>
                <div><label>Static</label>${stepper("staticValue", 0)}</div>
                <div><label>Maximum Static</label>${stepper("staticValueMax", null, 0, "No maximum")}</div>
                <div data-summon-scale="dice">
                  <button class="btn btn-outline-info btn-sm w-100" type="button" data-summon-scale-button>Scale Dice</button>
                  <div class="small text-secondary" data-summon-scale-summary></div>
                </div>
                <div data-summon-scale="static">
                  <button class="btn btn-outline-info btn-sm w-100" type="button" data-summon-scale-button>Scale Static</button>
                  <div class="small text-secondary" data-summon-scale-summary></div>
                </div>
              </div>
              <hr>
              <div>
                <label>Creature List</label>
                <select class="form-select form-select-sm" data-summon-field="selectorMode">
                  <option value="custom">Custom list</option>
                  <option value="filtered">Filtered catalog</option>
                </select>
              </div>
              <div data-summon-source="custom" class="mt-2">
                <input class="form-control form-control-sm mb-2" data-summon-search placeholder="Search monsters">
                <div class="summon-monster-results" data-summon-results></div>
                <div class="small text-secondary mt-2" data-summon-selected-summary></div>
              </div>
              <div data-summon-source="filtered" class="mt-2 d-none">
                <div class="border border-secondary rounded p-2 mb-2">
                  <label class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" data-summon-filter-enabled="type">
                    <span class="form-check-label">Creature Type</span>
                  </label>
                  <div data-summon-filter-body="type" class="d-none">
                    <div class="summon-type-grid" data-summon-types></div>
                  </div>
                </div>
                <div class="border border-secondary rounded p-2 mb-2">
                  <label class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" data-summon-filter-enabled="hd">
                    <span class="form-check-label">Hit Dice</span>
                  </label>
                  <div data-summon-filter-body="hd" class="summon-hd-grid d-none">
                    <div>
                      <label>HD Rule</label>
                      <select class="form-select form-select-sm" data-summon-field="hdOperator">
                        <option value="eq">HD equals</option>
                        <option value="lt">HD less than</option>
                      </select>
                    </div>
                    <div><label>Hit Dice</label>${stepper("hdValue", 1, 1)}</div>
                  </div>
                </div>
                <div class="border border-secondary rounded p-2">
                  <label class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" data-summon-filter-enabled="size">
                    <span class="form-check-label">Creature Size</span>
                  </label>
                  <div data-summon-filter-body="size" class="summon-hd-grid d-none">
                    <div>
                      <label>Size Rule</label>
                      <select class="form-select form-select-sm" data-summon-field="sizeOperator">
                        <option value="eq">Size equals</option>
                        <option value="lt">Size smaller than</option>
                      </select>
                    </div>
                    <div>
                      <label>Creature Size</label>
                      <select class="form-select form-select-sm" data-summon-field="sizeValue">
                        ${CREATURE_SIZES.map((size) => `<option value="${size}">${size}</option>`).join("")}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="small text-secondary mt-2" data-summon-match-count></div>
              <hr>
              <div class="summon-template-editor">
                <label>Creature Templates</label>
                <select class="form-select form-select-sm" data-summon-field="templateMode">
                  <option value="none">None</option>
                  <option value="fixed">Apply selected templates</option>
                  <option value="caster-choice">Caster chooses one</option>
                </select>
                <div class="mt-2 d-none" data-summon-template-options>
                  <input class="form-control form-control-sm mb-2" data-summon-template-search placeholder="Search templates">
                  <div class="summon-monster-results" data-summon-template-results></div>
                  <div class="small text-secondary mt-2" data-summon-template-summary></div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary btn-sm" type="button" data-summon-save>Save</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
  }

  async function openEditor(initial = {}) {
    ensureEditorModal();
    const node = document.getElementById(MODAL_ID);
    const [catalog, templates] = await Promise.all([
      loadCatalog(),
      loadTemplateCatalog(),
    ]);
    editorState = normalize(initial);
    const fields = (name) => node.querySelector(`[data-summon-field="${name}"]`);
    [
      "countMode",
      "count",
      "countMax",
      "diceCount",
      "diceCountMax",
      "dieType",
      "staticValue",
      "staticValueMax",
    ].forEach((name) => {
      fields(name).value = editorState[name] ?? "";
    });
    const filtersByKind = new Map(
      editorState.selector.filters.map((filter) => [filter.kind, filter]),
    );
    fields("selectorMode").value = editorState.selector.mode;
    fields("hdOperator").value = filtersByKind.get("hd")?.operator || "eq";
    fields("hdValue").value = filtersByKind.get("hd")?.value || 1;
    fields("sizeOperator").value = filtersByKind.get("size")?.operator || "eq";
    fields("sizeValue").value = filtersByKind.get("size")?.value || "Medium";
    node.querySelectorAll("[data-summon-filter-enabled]").forEach((input) => {
      input.checked = filtersByKind.has(input.dataset.summonFilterEnabled);
    });
    fields("targetChooses").checked = editorState.targetChooses;
    fields("templateMode").value = editorState.templateMode;
    const scaleHosts = Object.fromEntries(["count","dice","static"].map((key) => [key, node.querySelector(`[data-summon-scale="${key}"]`)]));
    [["count", editorState.countScale],["dice", editorState.diceCountScale],["static", editorState.staticValueScale]].forEach(([key, scale]) => root.PFEffectEditor?.wireScaleButton?.(scaleHosts[key], scale, scaleHosts[key].querySelector("[data-summon-scale-summary]"), scaleHosts[key].querySelector("[data-summon-scale-button]")));
    const types = [...new Set(catalog.map((monster) => slug(monster.creatureType)).filter(Boolean))].sort();
    const selectedTypes = new Set(filtersByKind.get("type")?.values || []);
    node.querySelector("[data-summon-types]").innerHTML = types.map((type) => `<label class="form-check"><input class="form-check-input" type="checkbox" data-summon-type="${escapeHtml(type)}" ${selectedTypes.has(type) ? "checked" : ""}><span>${escapeHtml(type)}</span></label>`).join("");
    const syncState = () => {
      editorState.countMode = fields("countMode").value;
      editorState.count = Math.max(0, number(fields("count").value));
      editorState.countMax = optionalMaximum(fields("countMax").value);
      editorState.diceCount = Math.max(0, number(fields("diceCount").value));
      editorState.diceCountMax = optionalMaximum(fields("diceCountMax").value);
      editorState.dieType = Math.max(2, number(fields("dieType").value, 4));
      editorState.staticValue = number(fields("staticValue").value);
      editorState.staticValueMax = optionalMaximum(fields("staticValueMax").value);
      editorState.targetChooses = fields("targetChooses").checked;
      editorState.templateMode = fields("templateMode").value;
      const enabled = new Set(
        [...node.querySelectorAll("[data-summon-filter-enabled]:checked")]
          .map((input) => input.dataset.summonFilterEnabled),
      );
      const filters = [];
      if (enabled.has("type")) {
        filters.push({
          kind: "type",
          values: [...node.querySelectorAll("[data-summon-type]:checked")]
            .map((input) => input.dataset.summonType),
        });
      }
      if (enabled.has("hd")) {
        filters.push({
          kind: "hd",
          operator: fields("hdOperator").value,
          value: Math.max(1, number(fields("hdValue").value, 1)),
        });
      }
      if (enabled.has("size")) {
        filters.push({
          kind: "size",
          operator: fields("sizeOperator").value,
          value: fields("sizeValue").value,
        });
      }
      editorState.selector = {
        mode: fields("selectorMode").value === "filtered" ? "filtered" : "custom",
        monsterKeys: editorState.selector.monsterKeys,
        filters,
      };
      node.querySelector("[data-summon-fixed]").classList.toggle("d-none", editorState.countMode !== "fixed");
      node.querySelector("[data-summon-dice]").classList.toggle("d-none", editorState.countMode !== "dice");
      node.querySelectorAll("[data-summon-source]").forEach((section) => section.classList.toggle("d-none", section.dataset.summonSource !== editorState.selector.mode));
      node.querySelectorAll("[data-summon-filter-body]").forEach((body) => body.classList.toggle("d-none", !enabled.has(body.dataset.summonFilterBody)));
      node.querySelector("[data-summon-selected-summary]").textContent = `${editorState.selector.monsterKeys.length} creature${editorState.selector.monsterKeys.length === 1 ? "" : "s"} selected`;
      node.querySelector("[data-summon-match-count]").textContent =
        availableMonsters(editorState, catalog).length + " matching creatures";
      node
        .querySelector("[data-summon-template-options]")
        .classList.toggle("d-none", editorState.templateMode === "none");
      node.querySelector("[data-summon-template-summary]").textContent =
        editorState.templateIds.length +
        " template" +
        (editorState.templateIds.length === 1 ? "" : "s") +
        " selected";
    };
    const renderResults = () => {
      const term = slug(node.querySelector("[data-summon-search]").value);
      const selected = new Set(editorState.selector.monsterKeys);
      const rows = catalog.filter((monster) => !term || `${monster.name} ${monster.creatureType}`.toLowerCase().includes(term)).slice(0, 80);
      node.querySelector("[data-summon-results]").innerHTML = rows.map((monster) => { const key = monsterKey(monster); return `<label class="summon-monster-row"><input class="form-check-input" type="checkbox" data-summon-monster="${escapeHtml(key)}" ${selected.has(key) ? "checked" : ""}><span><strong>${escapeHtml(monster.name)}</strong><small>${escapeHtml(monster.creatureType || "creature")} | ${monsterHd(monster)} HD | ${escapeHtml(monster.size || "Medium")}</small></span></label>`; }).join("");
      node.querySelectorAll("[data-summon-monster]").forEach((input) => input.addEventListener("change", () => { const keys = new Set(editorState.selector.monsterKeys); if (input.checked) keys.add(input.dataset.summonMonster); else keys.delete(input.dataset.summonMonster); editorState.selector.monsterKeys = [...keys]; syncState(); }));
    };
    const renderTemplateResults = () => {
      const term = slug(
        node.querySelector("[data-summon-template-search]").value,
      );
      const selected = new Set(editorState.templateIds);
      const rows = templates
        .filter(
          (template) =>
            !term ||
            (template.name + " " + template.templateType)
              .toLowerCase()
              .includes(term),
        )
        .slice(0, 80);
      node.querySelector("[data-summon-template-results]").innerHTML = rows
        .map((template) => {
          const checked = selected.has(String(template.id)) ? " checked" : "";
          const cr = template.crAdjustment
            ? " | CR " + escapeHtml(template.crAdjustment)
            : "";
          const summon = template.usableWithSummons ? " | summon option" : "";
          return (
            '<label class="summon-monster-row"><input class="form-check-input" type="checkbox" data-summon-template="' +
            escapeHtml(template.id) +
            '"' +
            checked +
            '><span><strong>' +
            escapeHtml(template.name) +
            "</strong><small>" +
            escapeHtml(template.templateType || "template") +
            cr +
            summon +
            "</small></span></label>"
          );
        })
        .join("");
      node.querySelectorAll("[data-summon-template]").forEach((input) =>
        input.addEventListener("change", () => {
          const ids = new Set(editorState.templateIds);
          if (input.checked) ids.add(input.dataset.summonTemplate);
          else ids.delete(input.dataset.summonTemplate);
          editorState.templateIds = [...ids];
          syncState();
        }),
      );
    };
    node.oninput = () => { syncState(); };
    node.onchange = () => {
      syncState();
      renderResults();
      renderTemplateResults();
    };
    node.querySelector("[data-summon-search]").oninput = renderResults;
    node.querySelector("[data-summon-template-search]").oninput =
      renderTemplateResults;
    node.querySelectorAll("[data-summon-step]").forEach((button) => button.onclick = () => { const input = fields(button.dataset.summonStepField); Number(button.dataset.summonStep) < 0 ? input.stepDown() : input.stepUp(); input.dispatchEvent(new Event("change", { bubbles: true })); });
    syncState();
    renderResults();
    renderTemplateResults();
    return new Promise((resolve) => {
      editorResolve = resolve;
      const onHidden = () => { node.removeEventListener("hidden.bs.modal", onHidden); if (editorResolve) { editorResolve(null); editorResolve = null; } };
      node.addEventListener("hidden.bs.modal", onHidden);
      node.querySelector("[data-summon-save]").onclick = () => {
        syncState();
        editorState.countScale = scaleHosts.count._bonusScale || null;
        editorState.diceCountScale = scaleHosts.dice._bonusScale || null;
        editorState.staticValueScale = scaleHosts.static._bonusScale || null;
        const result = normalize(editorState);
        const finish = editorResolve; editorResolve = null; modal.hide(); finish?.(result);
      };
      modal.show();
    });
  }

  function createEditorRow(data = {}, { onDelete, onChange } = {}) {
    let value = normalize(data);
    const row = document.createElement("div");
    row.className = "shared-summon-creature-row";
    const render = () => { row.innerHTML = `<div><strong>Summon Creatures</strong><div class="small text-secondary">${escapeHtml(summary(value))}</div></div><div class="d-flex gap-2"><button class="btn btn-outline-info btn-sm" type="button" data-edit-summon><i class="bi bi-pencil"></i><span class="visually-hidden">Edit summoned creatures</span></button><button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-summon aria-label="Delete summoned creatures"><i class="bi bi-trash"></i></button></div>`; row.querySelector("[data-edit-summon]").onclick = async () => { const next = await openEditor(value); if (!next) return; value = next; render(); onChange?.(); }; row.querySelector("[data-delete-summon]").onclick = () => { row.remove(); onDelete?.(); }; };
    row._collect = () => normalize(value);
    row._edit = () => row.querySelector("[data-edit-summon]")?.click();
    render();
    return { element: row, collect: row._collect };
  }

  return { normalize, loadCatalog, monsterHd, availableMonsters, hasSummon, hasPendingChoice, targetChooses, resolveChoices, rollCount, monsterSheet, spawn, advance, summary, openEditor, createEditorRow };
});
