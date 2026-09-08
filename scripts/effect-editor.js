// Shared "Damage Reduction / Immunity / Spell Resistance / Class Skill Grant /
// Extra Ranks Per Level" row builders, plus the Bonus Scale modal they all use
// to scale by level.
// Every effect-authoring surface (class features, custom buffs/traits/
// feats, loot items, inventory items) wants the same things -- this
// used to mean copy-pasting each one into every file. Defining them
// once here and having each surface call in means a class feature, a
// trait, a loot item, and a piece of gear can all carry DR, immunities,
// SR, "X becomes a class skill", or "+X skill ranks per level" the same
// way, with one place to fix bugs or add fields.
//
// The calculation side already reads these extras off ANY buff-shaped
// object (see character-sheet.js collectors, which walk activeBuffs as
// well as class features). So most additions need only one shared
// authoring row and one sheet collector/display hook.
(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // ---------------------------------------------------------------
  // Plain stat bonus row (Stat/Value/Type/Stacks/Bonus Scale/
  // Conditional/Applies When) -- every effect-authoring surface in the
  // app had its own copy of this row plus the stat lists behind it.
  // One canonical copy here; a surface with its own extra display
  // needs (buff-tracker-widget's abbreviated chip labels, character-
  // sheet's live custom-skill list) passes them in as options instead
  // of forking the row itself.
  // ---------------------------------------------------------------
  const EFFECT_STATS = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
    "attack",
    "melee attack",
    "ranged attack",
    "extra attack",
    "damage",
    "melee damage",
    "ranged damage",
    "ac",
    "touch ac",
    "flat-footed ac",
    "remove dex bonus to ac",
    "cannot gain morale bonuses",
    "cannot gain luck bonuses",
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
  const SKILL_STATS = [
    "skill checks",
    "trained skill checks",
    "untrained skill checks",
    "class skill checks",
    "class knowledge skill checks",
    "knowledge skill checks",
    "strength skill checks",
    "dexterity skill checks",
    "constitution skill checks",
    "intelligence skill checks",
    "wisdom skill checks",
    "charisma skill checks",
    "craft skill checks",
    "profession skill checks",
    "perform skill checks",
  ];
  const PF_SKILLS = [
    "Acrobatics",
    "Appraise",
    "Bluff",
    "Climb",
    "Diplomacy",
    "Disable Device",
    "Disguise",
    "Escape Artist",
    "Fly",
    "Heal",
    "Handle Animal",
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
    "Ride",
    "Sense Motive",
    "Sleight of Hand",
    "Spellcraft",
    "Stealth",
    "Survival",
    "Swim",
    "Use Magic Device",
  ];
  const SPECIFIC_SKILL_STATS = PF_SKILLS.map(
    (skill) => `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
  );
  const BONUS_TYPES = [
    "untyped",
    "alchemical",
    "condition",
    "penalty",
    "armor",
    "circumstance",
    "competence",
    "deflection",
    "dodge",
    "enhancement",
    "insight",
    "luck",
    "morale",
    "natural armor",
    "profane",
    "racial",
    "resistance",
    "sacred",
    "shield",
    "size",
    "inherit",
  ];
  const SIZE_CHANGE_VALUES = [-2, -1, 1, 2];
  const GENERATED_EQUIPMENT_TYPES = ["Weapon", "Armor", "Shield"];
  const GENERATED_WEAPON_TYPES = [
    "Melee Weapon (Light)",
    "Melee Weapon (One-Handed)",
    "Melee Weapon (Two-Handed)",
    "Ranged Weapon",
    "Thrown Weapon",
    "Natural Weapon",
  ];
  const GENERATED_SCALE_OPTIONS = ["STR", "DEX", "CON", "INT", "WIS", "CHA", "None"];
  const SPELL_LIKE_CASTING_ATTR_OPTIONS = ["", "STR", "DEX", "CON", "INT", "WIS", "CHA"];
  const ATTRIBUTE_REQUIREMENT_OPTIONS = ["", "STR", "DEX", "CON", "INT", "WIS", "CHA"];
  const SPELL_SCHOOL_OPTIONS = [
    "Abjuration",
    "Conjuration",
    "Divination",
    "Enchantment",
    "Evocation",
    "Illusion",
    "Necromancy",
    "Transmutation",
    "Universal",
  ].map((name) => ({ value: slugifyOption(name), label: name }));
  const MAGIC_TYPE_OPTIONS = ["Arcane", "Divine", "Occult", "Psychic"].map(
    (name) => ({ value: slugifyOption(name), label: name }),
  );
  const SPELL_TARGET_MODES = [
    { value: "all", label: "All" },
    { value: "class", label: "Class" },
    { value: "school", label: "School" },
    { value: "subschool", label: "School + Subschool" },
    { value: "descriptor", label: "Descriptor" },
    { value: "magicType", label: "Type of Magic" },
    { value: "spell", label: "Specific Spell" },
  ];
  const CASTER_LEVEL_APPLY_TO_OPTIONS = [
    { value: "spell", label: "Whole Spell" },
    { value: "duration", label: "Duration Only" },
    { value: "range", label: "Range Only" },
    { value: "effectScaling", label: "Effect Scaling Only" },
  ];
  let spellAdjustmentRowId = 0;
  const NATURAL_ATTACK_KINDS = [
    "Bite",
    "Claw",
    "Gore",
    "Hoof, Tentacle, Wing",
    "Pincers, Tail Slap",
    "Slam",
    "Sting",
    "Talons",
    "Other",
  ];
  const NATURAL_ATTACK_ROLES = ["Primary", "Secondary"];

  function slugifyOption(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // The plain, un-abbreviated formatter every surface used to
  // duplicate. Pass a surface-specific one (options.titleCaseStat) to
  // createBonusRow/bonusStatOptionsHtml/mountEffectsAccordion instead
  // of forking this when a surface needs something different (compact
  // "STR"-style abbreviations for a chip UI, or resolving skill:
  // against a live character's custom skills rather than the base 30).
  function titleCaseStat(value) {
    const key = String(value || "")
      .toLowerCase()
      .trim();
    const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(key);
    if (choiceLabel) return choiceLabel;
    if (key === "extra attack") return "Extra Attack at Highest BAB";
    if (key.startsWith("skill:")) {
      const genericSkillLabels = {
        "skill:craft": "Craft",
        "skill:profession": "Profession",
        "skill:perform": "Perform",
      };
      const skill = PF_SKILLS.find(
        (entry) =>
          `skill:${entry.replace(/[^a-z0-9]/gi, "").toLowerCase()}` === key,
      );
      return `Skill: ${skill || genericSkillLabels[key] || key.slice(6)}`;
    }
    return key
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const NON_NUMERIC_CUSTOM_LIST_STATS = new Set([
    "extra attack",
    "remove dex bonus to ac",
    "cannot gain morale bonuses",
    "cannot gain luck bonuses",
  ]);

  function customSkillListDisplayLabel(list = {}) {
    if (window.PFEffectStats?.customSkillListLabel) {
      return window.PFEffectStats.customSkillListLabel(list);
    }
    return `${list.name || "Custom"} Skills`;
  }

  function customStatListOptions(options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const stats = (options.effectStats || EFFECT_STATS).filter(
      (stat) => !NON_NUMERIC_CUSTOM_LIST_STATS.has(String(stat).toLowerCase()),
    );
    const skillNames = (
      options.skills ||
      window.PFEffectStats?.PF_SKILLS_WITH_ABILITY ||
      PF_SKILLS.map((skill) => [skill])
    ).map((entry) => (Array.isArray(entry) ? entry[0] : entry.name));
    const rows = [];
    const seen = new Set();
    const add = (value, label = format(value), group = "Stats") => {
      const key = String(value || "").trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      rows.push({ value: key, label, group });
    };
    stats.forEach((stat) => add(stat, format(stat), "Stats"));
    SKILL_STATS.forEach((stat) => add(stat, format(stat), "Skills"));
    add("skill:craft", "Skill: Craft", "Skills");
    add("skill:profession", "Skill: Profession", "Skills");
    add("skill:perform", "Skill: Perform", "Skills");
    skillNames.forEach((skill) => {
      if (skill) add(skillKey(skill), format(skillKey(skill)), "Skills");
    });
    (window.PFEffectStats?.ENERGY_RESISTANCE_STAT_OPTIONS || []).forEach(
      (option) => add(option.value, option.label, "Resistances"),
    );
    return rows;
  }

  function normalizeAttributeKey(value = "") {
    const key = String(value || "")
      .trim()
      .toLowerCase();
    const aliases = {
      str: "STR",
      strength: "STR",
      dex: "DEX",
      dexterity: "DEX",
      con: "CON",
      constitution: "CON",
      int: "INT",
      intelligence: "INT",
      wis: "WIS",
      wisdom: "WIS",
      cha: "CHA",
      charisma: "CHA",
    };
    return aliases[key] || "";
  }

  function normalizeAttributeRequirement(data = {}) {
    const source =
      data.attributeRequirement ||
      data.attributeScoreRequirement ||
      data.abilityRequirement ||
      data.requirement?.attributeRequirement ||
      data.requirements?.attributeRequirement ||
      {};
    const attribute = normalizeAttributeKey(
      source.attribute ||
        source.ability ||
        data.requiredAttribute ||
        data.requiredAbility ||
        data.attributeRequirementAbility ||
        "",
    );
    const score = Number(
      source.score ??
        source.minimumScore ??
        source.minimumAbilityScore ??
        data.requiredScore ??
        data.minimumScore ??
        "",
    );
    return {
      attribute,
      score: Number.isFinite(score) && score > 0 ? Math.floor(score) : "",
    };
  }

  function hasAttributeRequirement(data = {}) {
    const requirement = normalizeAttributeRequirement(data);
    return Boolean(requirement.attribute && requirement.score);
  }

  function attributeRequirementText(data = {}) {
    const requirement = normalizeAttributeRequirement(data);
    return requirement.attribute && requirement.score
      ? `Requires ${requirement.attribute} ${requirement.score}`
      : "";
  }

  // options.skills: optional [name, ability] list override (a live
  // character's allSkills(), including homebrew skills) for the
  // specific-skill options -- falls back to the base 30 PF skills.
  // options.effectStats: optional override for the "Stats" group.
  // options.titleCaseStat: optional override formatter for option
  // labels (see titleCaseStat above).
  function bonusStatOptionsHtml(selected = "", options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const stats = options.effectStats || EFFECT_STATS;
    const skillNames = (
      options.skills ||
      window.PFEffectStats?.PF_SKILLS_WITH_ABILITY ||
      PF_SKILLS.map((skill) => [skill])
    ).map((entry) => (Array.isArray(entry) ? entry[0] : entry.name));
    const specificSkillStats = skillNames.map((skill) => skillKey(skill));
    const option = (value, label = format(value)) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    const customSkillLists = window.PFEffectStats?.customSkillLists?.() || [];
    const skillListOptions = customSkillLists
      .map((list) =>
        option(
          window.PFEffectStats.skillListStatValue(list),
          customSkillListDisplayLabel(list),
        ),
      )
      .join("");
    return `
      <optgroup label="Stats">${stats.map((stat) => option(stat)).join("")}</optgroup>
      <optgroup label="Skills">
        ${SKILL_STATS.map((stat) => option(stat)).join("")}
        <option value="skill:craft" ${selected === "skill:craft" ? "selected" : ""}>Skill: Craft</option>
        <option value="skill:profession" ${selected === "skill:profession" ? "selected" : ""}>Skill: Profession</option>
        <option value="skill:perform" ${selected === "skill:perform" ? "selected" : ""}>Skill: Perform</option>
        ${skillListOptions}
        ${specificSkillStats.map((stat) => option(stat)).join("")}
        <option value="${window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE || "__create-custom-skill-list-stat__"}">Create custom target list...</option>
      </optgroup>
      ${window.PFEffectStats?.energyResistanceOptgroupHtml?.(selected, escapeHtml) || ""}
      ${window.PFEffectStats?.choiceOptgroupHtml?.(selected, escapeHtml) || ""}
    `;
  }

  function customSkillListPayloadForStat(stat) {
    if (!window.PFEffectStats?.skillListForStat) return null;
    const list = window.PFEffectStats.skillListForStat(stat);
    return list
      ? {
          id: list.id,
          name: list.name,
          skills: [...(list.skills || [])],
          items: Array.isArray(list.items)
            ? list.items.map((item) => ({
                value: item.value,
                label: item.label,
                ...(item.group ? { group: item.group } : {}),
              }))
            : [],
        }
      : null;
  }

  function optionIsCreateSkillList(value) {
    return (
      value ===
        (window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE ||
          "__create-custom-skill-list-stat__") ||
      value ===
        (window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE ||
          "__create-custom-skill-list-choice__")
    );
  }

  function wireCustomSkillListSelect(select, options = {}) {
    const renderer = options.renderOptions;
    const sync = options.sync || (() => {});
    select.dataset.lastValidValue = select.value || "";
    select.addEventListener("focus", () => {
      if (!optionIsCreateSkillList(select.value)) {
        select.dataset.lastValidValue = select.value || "";
      }
    });
    select.addEventListener("change", async () => {
      if (!optionIsCreateSkillList(select.value)) {
        select.dataset.lastValidValue = select.value || "";
        sync();
        return;
      }
      const previous = select.dataset.lastValidValue || "";
      if (!window.PFCustomSkillListModal) {
        select.value = previous;
        sync();
        return;
      }
      const createChoice =
        select.value === window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE;
      const list = await window.PFCustomSkillListModal.open({
        skills: options.skills,
        title: options.customListTitle,
        options:
          typeof options.customListOptions === "function"
            ? options.customListOptions()
            : options.customListOptions,
      });
      if (!list) {
        select.innerHTML = renderer(previous);
        select.value = previous;
        sync();
        return;
      }
      const nextValue = createChoice
        ? `choice:${window.PFEffectStats.skillListStatValue(list)}`
        : window.PFEffectStats.skillListStatValue(list);
      select.innerHTML = renderer(nextValue);
      select.value = nextValue;
      select.dataset.lastValidValue = nextValue;
      sync();
    });
  }

  // data: { stat, value, type, stacks, conditional, appliesWhen,
  // skillName?, bonusScale? }. options: { onDelete, skills, effectStats,
  // titleCaseStat } -- same meaning as bonusStatOptionsHtml's options,
  // plus onDelete (called after the row removes itself).
  function createBonusRow(data = {}, options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const row = document.createElement("div");
    row.className = "shared-bonus-row";
    const selectedStat = namedSkillKindForName(data.skillName) || data.stat || "";
    const appliesWhen = data.appliesWhen || "";
    const conditional = Boolean(appliesWhen.trim()) || Boolean(data.conditional);
    row.innerHTML = `
      <div>
        <label>Stat</label>
        <select data-effect-field="stat" class="form-select form-select-sm">${bonusStatOptionsHtml(selectedStat, options)}</select>
      </div>
      <div class="shared-named-skill-field d-none">
        <label>Skill Name</label>
        <input data-effect-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
      <div class="effect-value-field">
        <label>Value</label>
        <input data-effect-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? 0}">
      </div>
      <div class="effect-type-field">
        <label>Type</label>
        <select data-effect-field="type" class="form-select form-select-sm">
          ${BONUS_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${(data.type || "untyped") === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label>Stacks</label>
        <div class="form-check form-switch">
          <input data-effect-field="stacks" class="form-check-input" type="checkbox" ${data.stacks ? "checked" : ""}>
        </div>
      </div>
      <button class="btn btn-outline-info btn-sm effect-scale-button" type="button" data-scale-bonus>Bonus Scale</button>
      <div class="shared-bonus-condition-inline">
        <div>
          <label>Conditional</label>
          <div class="form-check form-switch">
            <input data-effect-field="conditional" class="form-check-input" type="checkbox" ${conditional ? "checked" : ""}>
          </div>
        </div>
        <div>
          <label>Applies When</label>
          <input data-effect-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="vs undead">
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete effect"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    const statSelect = row.querySelector('[data-effect-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector('[data-effect-field="skillName"]');
    const syncNamedSkill = () => {
      const named = isNamedSkillKind(statSelect.value);
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder = namedSkillPlaceholder(statSelect.value);
    };
    wireCustomSkillListSelect(statSelect, {
      skills: options.skills,
      customListTitle: "Custom Target List",
      customListOptions: () => customStatListOptions(options),
      renderOptions: (selected) => bonusStatOptionsHtml(selected, options),
      sync: syncNamedSkill,
    });
    syncNamedSkill();
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    wireConditionalFromAppliesWhen(
      row,
      '[data-effect-field="conditional"]',
      '[data-effect-field="appliesWhen"]',
    );
    row
      .querySelector('button[aria-label="Delete effect"]')
      .addEventListener("click", () => {
        row.remove();
        options.onDelete?.();
      });
    const collect = () => {
      const selected = statSelect.value;
      const skillName = isNamedSkillKind(selected)
        ? namedSkill(selected, skillNameInput.value)
        : "";
      const appliesWhen = row
        .querySelector('[data-effect-field="appliesWhen"]')
        .value.trim();
      const effect = {
        stat: skillName ? skillKey(skillName) : selected,
        value: Number(
          row.querySelector('[data-effect-field="value"]').value || 0,
        ),
        type:
          row.querySelector('[data-effect-field="type"]').value || "untyped",
        stacks: row.querySelector('[data-effect-field="stacks"]').checked,
        conditional:
          row.querySelector('[data-effect-field="conditional"]').checked ||
          Boolean(appliesWhen),
        appliesWhen,
      };
      if (skillName) effect.skillName = skillName;
      const skillList = customSkillListPayloadForStat(effect.stat);
      if (skillList) effect.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(effect.stat)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(effect.stat);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) effect.choicePool = choicePool;
      }
      if (row._bonusScale) effect.bonusScale = row._bonusScale;
      return effect;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // ---------------------------------------------------------------
  // Skill-only stat options, for "X becomes a class skill". Reuses the
  // exact same skill stat keys (skill:xxx) and "Choose When Applied"
  // pool ids the full effect Stat dropdown uses, filtered to skills
  // only -- a class skill grant targeting "AC" or "Fire Resistance"
  // isn't meaningful.
  // ---------------------------------------------------------------
  function slugifySkillName(skill) {
    return `skill:${String(skill || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function namedSkill(kind, value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const prefix =
      {
        "skill:craft": "Craft",
        "skill:profession": "Profession",
        "skill:perform": "Perform",
      }[kind] || "Craft";
    if (text.toLowerCase().startsWith(`${prefix.toLowerCase()} (`)) return text;
    return `${prefix} (${text})`;
  }

  function namedSkillKindForName(skillName) {
    const text = String(skillName || "").toLowerCase();
    if (text.startsWith("craft")) return "skill:craft";
    if (text.startsWith("profession")) return "skill:profession";
    if (text.startsWith("perform")) return "skill:perform";
    return "";
  }

  function isNamedSkillKind(value) {
    return ["skill:craft", "skill:profession", "skill:perform"].includes(
      value,
    );
  }

  function namedSkillPlaceholder(kind) {
    return (
      {
        "skill:craft": "Alchemy",
        "skill:profession": "Sailor",
        "skill:perform": "Oratory",
      }[kind] || "Skill"
    );
  }

  function skillKey(name) {
    return `skill:${String(name || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  // skills: optional [name, ability] list override (a live character's
  // allSkills(), including homebrew skills) -- falls back to the base
  // 30 PF skills from effect-stat-options.js.
  function skillStatOptionsHtml(selected = "", { skills } = {}) {
    const list = (
      skills || window.PFEffectStats?.PF_SKILLS_WITH_ABILITY || []
    ).map((entry) => (Array.isArray(entry) ? entry[0] : entry.name));
    const option = (value, label) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    const skillPools = (window.PFEffectStats?.ALL_POOLS || []).filter(
      (pool) =>
        pool.kind === "skill" ||
        (pool.kind === "custom-skill-list" &&
          (window.PFEffectStats?.customSkillListIsSkillOnly
            ? window.PFEffectStats.customSkillListIsSkillOnly(pool)
            : true)),
    );
    const customSkillLists = window.PFEffectStats?.customSkillLists?.() || [];
    const skillOnlyCustomLists = customSkillLists.filter((customList) =>
      window.PFEffectStats?.customSkillListIsSkillOnly
        ? window.PFEffectStats.customSkillListIsSkillOnly(customList)
        : true,
    );
    return `
      <optgroup label="Skills">
        ${list.map((skill) => option(slugifySkillName(skill), skill)).join("")}
        ${option("skill:craft", "Skill: Craft")}
        ${option("skill:profession", "Skill: Profession")}
        ${option("skill:perform", "Skill: Perform")}
        ${skillOnlyCustomLists
          .map((customList) =>
            option(
              window.PFEffectStats.skillListStatValue(customList),
              customSkillListDisplayLabel(customList),
            ),
          )
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE || "__create-custom-skill-list-stat__", "Create custom skill list...")}
      </optgroup>
      <optgroup label="Choose When Applied">
        ${skillPools
          .map((pool) => option(`choice:${pool.id}`, `${pool.label} (choose one)`))
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE || "__create-custom-skill-list-choice__", "Create custom skill list...")}
      </optgroup>
    `;
  }

  // ---------------------------------------------------------------
  // Shared Bonus Scale modal -- one instance in the DOM regardless of
  // how many surfaces/rows want to use it. Follows the same
  // per-session settle + "wait for the previous hide to finish before
  // show()-ing again" pattern as modals/effect-choice-picker.js, for
  // the same reason: nothing here guarantees only one row ever opens
  // this modal in a session, so a stale "hidden.bs.modal" from a
  // previous open must never be able to resolve a later one.
  // ---------------------------------------------------------------
  const SCALE_MODAL_ID = "sharedBonusScaleModal";
  let scaleModal = null;
  let scaleHideSignal = Promise.resolve();

  function ensureScaleModal() {
    if (document.getElementById(SCALE_MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${SCALE_MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title">Bonus Scale</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2 mb-3">
                <div class="col-12">
                  <label for="${SCALE_MODAL_ID}Source">Level Source</label>
                  <select id="${SCALE_MODAL_ID}Source" class="form-select form-select-sm">
                    ${window.PFEffectMeta?.levelSourceOptions?.({ type: "caster" }, { includeSpecial: true }) || '<option value="caster">Caster level</option><option value="character">Character level</option>'}
                  </select>
                </div>
              </div>
              <div class="small text-secondary mb-2">Level Multiplier</div>
              <div class="row g-2 mb-1 align-items-end">
                <div class="col-4">
                  <label for="${SCALE_MODAL_ID}Num">Numerator</label>
                  <input id="${SCALE_MODAL_ID}Num" class="form-control form-control-sm" type="number" min="0" placeholder="1">
                </div>
                <div class="col-4">
                  <label for="${SCALE_MODAL_ID}Den">Denominator</label>
                  <input id="${SCALE_MODAL_ID}Den" class="form-control form-control-sm" type="number" min="1" placeholder="1">
                </div>
                <div class="col-4">
                  <button id="${SCALE_MODAL_ID}ClearMultiplier" class="btn btn-outline-secondary btn-sm w-100" type="button">Clear</button>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-2" id="${SCALE_MODAL_ID}Presets">
                ${[
                  ["1", "4"],
                  ["1", "3"],
                  ["1", "2"],
                  ["2", "1"],
                  ["3", "1"],
                  ["4", "1"],
                ]
                  .map(
                    ([num, den]) =>
                      `<button type="button" class="btn btn-outline-info btn-sm" data-scale-multiplier-preset="${num}/${den}">${den === "1" ? `${num}x` : `${num}/${den}`}</button>`,
                  )
                  .join("")}
              </div>
              <div class="form-check form-switch mb-3">
                <input id="${SCALE_MODAL_ID}MinOne" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${SCALE_MODAL_ID}MinOne">Minimum 1 (never rounds down to 0)</label>
              </div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Milestones</div>
                <button id="${SCALE_MODAL_ID}AddMilestone" class="btn btn-outline-info btn-sm" type="button">Add Milestone</button>
              </div>
              <div id="${SCALE_MODAL_ID}Rows" class="vstack gap-2 mb-3"></div>
              <div class="row g-2">
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}After">From Level</label>
                  <input id="${SCALE_MODAL_ID}After" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}Every">Every Levels</label>
                  <input id="${SCALE_MODAL_ID}Every" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}Increase">Increase Bonus By</label>
                  <input id="${SCALE_MODAL_ID}Increase" class="form-control form-control-sm" type="number">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="${SCALE_MODAL_ID}Clear" type="button" class="btn btn-outline-danger btn-sm">Clear Scale</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="${SCALE_MODAL_ID}Save" type="button" class="btn btn-primary btn-sm">Save Scale</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(`${SCALE_MODAL_ID}AddMilestone`)
      .addEventListener("click", () => addScaleMilestoneRow());
    document
      .getElementById(`${SCALE_MODAL_ID}Presets`)
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-scale-multiplier-preset]");
        if (!button) return;
        const [num, den] = button.dataset.scaleMultiplierPreset.split("/");
        document.getElementById(`${SCALE_MODAL_ID}Num`).value = num;
        document.getElementById(`${SCALE_MODAL_ID}Den`).value = den;
      });
    document
      .getElementById(`${SCALE_MODAL_ID}ClearMultiplier`)
      .addEventListener("click", () => {
        document.getElementById(`${SCALE_MODAL_ID}Num`).value = "";
        document.getElementById(`${SCALE_MODAL_ID}Den`).value = "";
      });
  }

  function addScaleMilestoneRow(data = {}) {
    const rows = document.getElementById(`${SCALE_MODAL_ID}Rows`);
    const row = document.createElement("div");
    row.className = "shared-scale-row d-flex gap-2 align-items-end";
    row.innerHTML = `
      <div>
        <label>Level</label>
        <input data-scale-field="level" class="form-control form-control-sm" type="number" min="1" value="${data.level || ""}">
      </div>
      <div>
        <label>Bonus Value</label>
        <input data-scale-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? ""}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button">Delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    rows.appendChild(row);
  }

  function collectScale() {
    const milestones = [
      ...document.querySelectorAll(`#${SCALE_MODAL_ID}Rows .shared-scale-row`),
    ]
      .map((row) => ({
        level: Number.parseInt(
          row.querySelector('[data-scale-field="level"]').value,
          10,
        ),
        value: Number(row.querySelector('[data-scale-field="value"]').value),
      }))
      .filter(
        (milestone) => milestone.level > 0 && Number.isFinite(milestone.value),
      )
      .sort((a, b) => a.level - b.level);
    const fromLevel = Number.parseInt(
      document.getElementById(`${SCALE_MODAL_ID}After`).value,
      10,
    );
    const everyLevels = Number.parseInt(
      document.getElementById(`${SCALE_MODAL_ID}Every`).value,
      10,
    );
    const increase = Number(
      document.getElementById(`${SCALE_MODAL_ID}Increase`).value,
    );
    const every =
      fromLevel > 0 &&
      everyLevels > 0 &&
      Number.isFinite(increase) &&
      increase !== 0
        ? { fromLevel, everyLevels, increase }
        : null;
    const multiplierNumeratorInput = document
      .getElementById(`${SCALE_MODAL_ID}Num`)
      .value.trim();
    const multiplierDenominatorInput = document
      .getElementById(`${SCALE_MODAL_ID}Den`)
      .value.trim();
    const multiplierNumerator = Number(multiplierNumeratorInput);
    const multiplierDenominator = Number(multiplierDenominatorInput);
    const levelMultiplier =
      multiplierNumerator > 0 && multiplierDenominator > 0
        ? { numerator: multiplierNumerator, denominator: multiplierDenominator }
        : null;
    const minimumOne = document.getElementById(`${SCALE_MODAL_ID}MinOne`).checked;
    if (!milestones.length && !every && !levelMultiplier && !minimumOne)
      return null;
    const sourceSelect = document.getElementById(`${SCALE_MODAL_ID}Source`);
    const source = window.PFEffectMeta?.sourceFromSelect
      ? window.PFEffectMeta.sourceFromSelect(sourceSelect?.value || "caster")
      : { type: sourceSelect?.value || "caster" };
    return {
      source,
      milestones,
      every,
      ...(levelMultiplier ? { levelMultiplier } : {}),
      ...(minimumOne ? { minimumOne: true } : {}),
    };
  }

  // Resolves to the collected scale object, or null if cleared/cancelled.
  function openScaleModal(existingScale) {
    return scaleHideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureScaleModal();
          const scale = existingScale || {};
          const source = scale.source || { type: "caster" };
          const sourceSelect = document.getElementById(`${SCALE_MODAL_ID}Source`);
          if (sourceSelect && window.PFEffectMeta?.levelSourceOptions) {
            sourceSelect.innerHTML = window.PFEffectMeta.levelSourceOptions(
              source,
              { includeSpecial: true },
            );
          } else if (sourceSelect) {
            sourceSelect.value = source.type || "caster";
          }
          document.getElementById(`${SCALE_MODAL_ID}Num`).value =
            scale.levelMultiplier?.numerator ?? (existingScale ? "" : "1");
          document.getElementById(`${SCALE_MODAL_ID}Den`).value =
            scale.levelMultiplier?.denominator ?? (existingScale ? "" : "1");
          document.getElementById(`${SCALE_MODAL_ID}MinOne`).checked = Boolean(
            scale.minimumOne,
          );
          document.getElementById(`${SCALE_MODAL_ID}Rows`).innerHTML = "";
          const milestones = Array.isArray(scale.milestones)
            ? scale.milestones
            : [];
          if (milestones.length)
            milestones.forEach((milestone) => addScaleMilestoneRow(milestone));
          else addScaleMilestoneRow();
          const every = scale.every || {};
          document.getElementById(`${SCALE_MODAL_ID}After`).value =
            every.fromLevel || every.afterLevel || every.after || "";
          document.getElementById(`${SCALE_MODAL_ID}Every`).value =
            every.everyLevels || "";
          document.getElementById(`${SCALE_MODAL_ID}Increase`).value =
            every.increase ?? "";

          const modalEl = document.getElementById(SCALE_MODAL_ID);
          scaleModal = bootstrap.Modal.getOrCreateInstance(modalEl);

          let settled = false;
          let resolveHideSignal;
          scaleHideSignal = new Promise((res) => {
            resolveHideSignal = res;
          });
          const settle = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };
          const onHidden = () => {
            settle(null);
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            resolveHideSignal();
          };
          modalEl.addEventListener("hidden.bs.modal", onHidden);

          const saveBtn = document.getElementById(`${SCALE_MODAL_ID}Save`);
          const clearBtn = document.getElementById(`${SCALE_MODAL_ID}Clear`);
          const onSave = () => {
            settle(collectScale());
            scaleModal.hide();
          };
          const onClear = () => {
            settle(null);
            scaleModal.hide();
          };
          saveBtn.addEventListener("click", onSave, { once: true });
          clearBtn.addEventListener("click", onClear, { once: true });

          scaleModal.show();
        }),
    );
  }

  // "1/2" for a fraction, "3x" for a whole-number multiplier.
  function levelMultiplierText(multiplier) {
    if (!multiplier) return "";
    const { numerator, denominator } = multiplier;
    return denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`;
  }

  function scaleSourceLabel(source = {}) {
    if (source.type === "character") return "character level";
    if (source.type === "class")
      return source.className ? `${source.className} level` : "class level";
    if (source.type === "special")
      return (
        window.PFEffectMeta?.factorLabel?.(source) ||
        source.label ||
        "special value"
      );
    return "caster level";
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const source = scaleSourceLabel(scale.source || { type: "caster" });
    if (scale.levelMultiplier) {
      parts.push(
        `${levelMultiplierText(scale.levelMultiplier)} ${source} (round down)`,
      );
    }
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    if (milestones.length) {
      parts.push(
        milestones
          .map(
            (milestone) =>
              `${source} ${milestone.level}: ${milestone.value >= 0 ? "+" : ""}${milestone.value}`,
          )
          .join(", "),
      );
    }
    const every = scale.every || {};
    const fromLevel = every.fromLevel || every.afterLevel || every.after;
    if (fromLevel && every.everyLevels && every.increase) {
      parts.push(
        `from ${source} ${fromLevel}, every ${every.everyLevels}: ${every.increase >= 0 ? "+" : ""}${every.increase}`,
      );
    }
    if (scale.minimumOne) parts.push("minimum 1");
    return parts.join("; ");
  }

  // ---------------------------------------------------------------
  // Row builders. Each returns { element, collect(), destroy() }.
  // onDelete lets the caller run its own bookkeeping (accordion
  // counts, etc.) after the row removes itself.
  // ---------------------------------------------------------------

  function wireScaleButton(row, initialScale, summaryEl, scaleBtn) {
    row._bonusScale = initialScale || null;
    const updateSummary = () => {
      const text = scaleText(row._bonusScale);
      summaryEl.textContent = text ? `Scales: ${text}` : "";
    };
    scaleBtn.addEventListener("click", async () => {
      const result = await openScaleModal(row._bonusScale);
      row._bonusScale = result;
      updateSummary();
    });
    updateSummary();
  }

  function wireConditionalFromAppliesWhen(
    row,
    conditionalSelector,
    appliesWhenSelector,
  ) {
    const conditionalInput = row.querySelector(conditionalSelector);
    const appliesWhenInput = row.querySelector(appliesWhenSelector);
    if (!conditionalInput || !appliesWhenInput) return;
    const sync = () => {
      if (appliesWhenInput.value.trim()) conditionalInput.checked = true;
    };
    sync();
    appliesWhenInput.addEventListener("input", sync);
  }

  // Damage reduction is "N/type" -- a numeric amount plus the type of
  // attack that overcomes it ("magic", "cold iron and evil", ...). A
  // dash ("-") means it applies to any attack that doesn't ignore DR
  // outright. The amount can scale by level.
  function createDrRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-dr-row class-feature-dr-row";
    row.innerHTML = `
      <div>
        <label>Amount</label>
        <input data-dr-field="amount" class="form-control form-control-sm" type="number" min="0" value="${Number(data.amount || 0)}">
      </div>
      <div>
        <label>Overcome Type</label>
        <input data-dr-field="overcomeType" class="form-control form-control-sm" value="${escapeHtml(data.overcomeType || "")}" placeholder="magic, or - for any">
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete DR"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    row.querySelector('button[aria-label="Delete DR"]').addEventListener(
      "click",
      () => {
        row.remove();
        onDelete?.();
      },
    );
    const collect = () => {
      const dr = {
        amount: Number(
          row.querySelector('[data-dr-field="amount"]').value || 0,
        ),
        overcomeType: row
          .querySelector('[data-dr-field="overcomeType"]')
          .value.trim(),
      };
      if (row._bonusScale) dr.bonusScale = row._bonusScale;
      return dr.amount > 0 || dr.bonusScale ? dr : null;
    };
    // Stashed on the element too so a caller can collect every row in a
    // container with a plain DOM query instead of tracking its own
    // parallel array of controllers (see createSrRow/createClassSkillRow
    // below, and every addXRow() that uses these).
    row._collect = collect;
    return { element: row, collect };
  }

  // Spell Resistance -- a flat number that can scale by level, plus a
  // Conditional/Applies When pair for things like "SR only vs. evil".
  function createSrRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-sr-row class-feature-sr-row";
    const appliesWhen = data.appliesWhen || data.condition || "";
    const conditional =
      Boolean(String(appliesWhen).trim()) || Boolean(data.conditional);
    row.innerHTML = `
      <div>
        <label>Amount</label>
        <input data-sr-field="amount" class="form-control form-control-sm" type="number" min="0" value="${Number(data.amount || 0)}">
      </div>
      <div>
        <label>Conditional</label>
        <div class="form-check form-switch">
          <input data-sr-field="conditional" class="form-check-input" type="checkbox" ${conditional ? "checked" : ""}>
        </div>
      </div>
      <div>
        <label>Applies When</label>
        <input data-sr-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="vs evil">
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete SR"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    wireConditionalFromAppliesWhen(
      row,
      '[data-sr-field="conditional"]',
      '[data-sr-field="appliesWhen"]',
    );
    row.querySelector('button[aria-label="Delete SR"]').addEventListener(
      "click",
      () => {
        row.remove();
        onDelete?.();
      },
    );
    const collect = () => {
      const appliesWhen = row
        .querySelector('[data-sr-field="appliesWhen"]')
        .value.trim();
      const sr = {
        amount: Number(
          row.querySelector('[data-sr-field="amount"]').value || 0,
        ),
        conditional:
          row.querySelector('[data-sr-field="conditional"]').checked ||
          Boolean(appliesWhen),
        appliesWhen,
      };
      if (row._bonusScale) sr.bonusScale = row._bonusScale;
      return sr.amount > 0 || sr.bonusScale ? sr : null;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function createImmunityRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-immunity-row";
    const appliesWhen = data.appliesWhen || data.condition || "";
    const conditional =
      Boolean(String(appliesWhen).trim()) || Boolean(data.conditional);
    row.innerHTML = `
      <div>
        <label>Immunity</label>
        <input data-immunity-field="name" class="form-control form-control-sm" value="${escapeHtml(data.name || data.immunity || data.type || "")}" placeholder="fire, poison, sleep">
      </div>
      <div>
        <label>Conditional</label>
        <div class="form-check form-switch">
          <input data-immunity-field="conditional" class="form-check-input" type="checkbox" ${conditional ? "checked" : ""}>
        </div>
      </div>
      <div>
        <label>Applies When</label>
        <input data-immunity-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="vs magical sleep">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete immunity"><i class="bi bi-trash"></i></button>
    `;
    row.querySelector('button[aria-label="Delete immunity"]').addEventListener(
      "click",
      () => {
        row.remove();
        onDelete?.();
      },
    );
    wireConditionalFromAppliesWhen(
      row,
      '[data-immunity-field="conditional"]',
      '[data-immunity-field="appliesWhen"]',
    );
    const collect = () => {
      const name = row
        .querySelector('[data-immunity-field="name"]')
        .value.trim();
      if (!name) return null;
      const appliesWhen = row
        .querySelector('[data-immunity-field="appliesWhen"]')
        .value.trim();
      return {
        name,
        conditional:
          row.querySelector('[data-immunity-field="conditional"]').checked ||
          Boolean(appliesWhen),
        appliesWhen,
      };
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // "X becomes a class skill" -- just a skill picker, no amount/type/
  // scale, since class-skill status isn't a number to scale. Can
  // target a fixed skill or a "choose one skill" pool (a trait like
  // "pick a skill; it's a class skill for you"). data is { stat,
  // skillName? } -- the same shape effects/DR/SR use -- so a Craft/
  // Profession pick's friendly name round-trips through save/reload
  // instead of collapsing to a bare "skill:craftalchemy" key.
  function createClassSkillRow(data = {}, { onDelete, skills } = {}) {
    const row = document.createElement("div");
    row.className = "shared-class-skill-row";
    const rawStat = String(data.stat || "");
    const selectedStat = namedSkillKindForName(data.skillName) || rawStat;
    row.innerHTML = `
      <div>
        <label>Skill</label>
        <select data-class-skill-field="stat" class="form-select form-select-sm">
          ${skillStatOptionsHtml(selectedStat, { skills })}
        </select>
      </div>
      <div class="shared-named-skill-field d-none">
        <label>Skill Name</label>
        <input data-class-skill-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete class skill"><i class="bi bi-trash"></i></button>
    `;
    const statSelect = row.querySelector('[data-class-skill-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector(
      '[data-class-skill-field="skillName"]',
    );
    const syncNamedSkill = () => {
      const named = isNamedSkillKind(statSelect.value);
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder = namedSkillPlaceholder(statSelect.value);
    };
    wireCustomSkillListSelect(statSelect, {
      skills,
      renderOptions: (selected) => skillStatOptionsHtml(selected, { skills }),
      sync: syncNamedSkill,
    });
    syncNamedSkill();
    row
      .querySelector('button[aria-label="Delete class skill"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const selected = statSelect.value;
      if (!selected) return null;
      if (isNamedSkillKind(selected)) {
        const name = namedSkill(selected, skillNameInput.value);
        return name ? { stat: skillKey(name), skillName: name } : null;
      }
      const grant = { stat: selected };
      const skillList = customSkillListPayloadForStat(selected);
      if (skillList) grant.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(selected)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(selected);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) grant.choicePool = choicePool;
      }
      return grant;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // entry: { stat, skillName? }. titleCaseStat: the caller's own stat
  // formatter (each surface already has one, for the exact same
  // skillName-or-stat pattern effects/DR/SR use) -- kept as a
  // parameter instead of duplicated here so it stays consistent with
  // however that surface formats every other stat.
  function classSkillGrantText(entry, titleCaseStat) {
    if (!entry) return "";
    const label = titleCaseStat(entry.skillName || entry.stat || "");
    return `${label} becomes a class skill`;
  }

  function createExtraRanksPerLevelRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-extra-ranks-row";
    row.innerHTML = `
      <div>
        <label>Extra Ranks / Level</label>
        <input data-extra-ranks-field="value" class="form-control form-control-sm" type="number" min="0" value="${Number(data.value ?? data.amount ?? data.ranks ?? 0)}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete extra ranks per level"><i class="bi bi-trash"></i></button>
    `;
    row
      .querySelector('button[aria-label="Delete extra ranks per level"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const value = Number(
        row.querySelector('[data-extra-ranks-field="value"]').value || 0,
      );
      return value > 0 ? { value } : null;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function extraRanksPerLevelText(entry = {}) {
    const value = Number(entry.value ?? entry.amount ?? entry.ranks ?? 0);
    return `Extra Ranks / Level ${value >= 0 ? "+" : ""}${value}`;
  }

  function createSizeChangeRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-size-change-row";
    const value = SIZE_CHANGE_VALUES.includes(Number(data.value ?? data.steps))
      ? Number(data.value ?? data.steps)
      : 1;
    row.innerHTML = `
      <div>
        <label>Size Change</label>
        <select data-size-change-field="value" class="form-select form-select-sm">
          ${SIZE_CHANGE_VALUES.map(
            (entry) =>
              `<option value="${entry}" ${value === entry ? "selected" : ""}>${entry > 0 ? "+" : ""}${entry}</option>`,
          ).join("")}
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete size change"><i class="bi bi-trash"></i></button>
    `;
    row
      .querySelector('button[aria-label="Delete size change"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => ({
      value: Number(row.querySelector('[data-size-change-field="value"]').value),
    });
    row._collect = collect;
    return { element: row, collect };
  }

  function spellLikeAbilityName(data = {}) {
    return (
      data.spellName ||
      data.name ||
      data.spell?.name ||
      data.spellChoiceList?.name ||
      data.spellList?.name ||
      ""
    );
  }

  function spellLikeMinimumLevel(data = {}) {
    const value = Number(data.minimumLevel ?? data.level ?? 1);
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value));
  }

  function spellLikeCastingAttr(data = {}) {
    const value = String(
      data.castingAttr || data.castingAbility || data.ability || "",
    ).toUpperCase();
    return SPELL_LIKE_CASTING_ATTR_OPTIONS.includes(value) ? value : "";
  }

  function spellLikeMinimumScore(data = {}) {
    const value = data.minimumScore ?? data.minimumAbilityScore ?? data.score;
    return value === undefined || value === null || value === ""
      ? ""
      : String(Number(value) || "");
  }

  function compactSpellPayload(spell = {}) {
    if (!spell || typeof spell !== "object") return null;
    const name = String(spell.name || spell.spellName || "").trim();
    return name ? { name } : null;
  }

  let spellLikeSpellOptionsPromise = null;

  function loadSpellLikeSpellOptions() {
    spellLikeSpellOptionsPromise ||= (window.PFSpellData?.loadSpells
      ? window.PFSpellData.loadSpells()
      : fetch("./data/spells.json", { cache: "no-cache" }).then((response) =>
          response.ok ? response.json() : [],
        ))
      .then((spells) =>
        (Array.isArray(spells) ? spells : [])
          .filter((spell) => spell?.name)
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
          .map((spell) => ({
            name: spell.name,
            spellName: spell.name,
            value: spell.name,
            label: spell.name,
            meta:
              window.PFSpellData?.schoolWithDescriptors?.(spell) ||
              spell.details?.school ||
              "Spell",
            group: "Spells",
          })),
      )
      .catch(() => []);
    return spellLikeSpellOptionsPromise;
  }

  function normalizeSpellLikeChoiceList(list = {}) {
    if (window.PFEffectStats?.normalizeSpellLikeList) {
      return window.PFEffectStats.normalizeSpellLikeList(list);
    }
    return list && typeof list === "object" ? list : null;
  }

  function spellLikeChoiceList(data = {}) {
    return (
      normalizeSpellLikeChoiceList(
        data.spellChoiceList || data.spellList || data.choiceList || {},
      ) ||
      window.PFEffectStats?.customSpellLikeListById?.(
        data.spellChoiceListId || data.spellListId || "",
      ) ||
      null
    );
  }

  function spellLikeChoiceListText(data = {}) {
    const list = spellLikeChoiceList(data);
    const name = list?.name || data.spellChoiceListName || data.spellListName;
    return name ? `Choose from ${name}` : "";
  }

  async function createSpellLikeChoiceList() {
    if (!window.PFCustomSkillListModal || !window.PFEffectStats) return null;
    const options = await loadSpellLikeSpellOptions();
    return window.PFCustomSkillListModal.open({
      title: "Create SLA Spell List",
      label: "Spells",
      options,
      saveList: window.PFEffectStats.saveCustomSpellLikeList,
    });
  }

  function ensureSpellLikeListPickerModal() {
    const id = "spellLikeListPickerModal";
    const existing = document.getElementById(id);
    if (existing) return existing;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Choose SLA Spell List</h5>
            </div>
            <div class="modal-body">
              <input class="form-control form-control-sm mb-2" data-sla-list-search placeholder="Search lists">
              <div class="list-group" data-sla-list-results></div>
              <div class="small text-secondary mt-2" data-sla-list-empty>No SLA spell lists created yet.</div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-info btn-sm" data-sla-list-create>Create List</button>
              <button type="button" class="btn btn-outline-warning btn-sm" data-sla-list-clear>Clear</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById(id);
  }

  async function openSpellLikeListPicker() {
    const root = ensureSpellLikeListPickerModal();
    const modal = bootstrap.Modal.getOrCreateInstance(root);
    const search = root.querySelector("[data-sla-list-search]");
    const results = root.querySelector("[data-sla-list-results]");
    const empty = root.querySelector("[data-sla-list-empty]");
    let settled = false;
    return new Promise((resolve) => {
      const finish = (value = null) => {
        if (settled) return;
        settled = true;
        modal.hide();
        resolve(value);
      };
      const render = () => {
        const term = search.value.trim().toLowerCase();
        const lists = window.PFEffectStats?.customSpellLikeLists?.() || [];
        const visible = lists.filter(
          (list) =>
            !term ||
            String(list.name || "").toLowerCase().includes(term) ||
            (list.items || []).some((item) =>
              String(item.label || item.name || "")
                .toLowerCase()
                .includes(term),
            ),
        );
        empty.classList.toggle("d-none", visible.length > 0);
        results.innerHTML = visible
          .map(
            (list, index) => `
          <button type="button" class="list-group-item list-group-item-action bg-dark text-white border-secondary" data-sla-list-index="${index}">
            <div class="fw-semibold">${escapeHtml(list.name)}</div>
            <small>${escapeHtml((list.items || []).map((item) => item.label || item.name).filter(Boolean).join(", "))}</small>
          </button>
        `,
          )
          .join("");
        results.querySelectorAll("[data-sla-list-index]").forEach((button) => {
          button.addEventListener("click", () =>
            finish(visible[Number(button.dataset.slaListIndex)]),
          );
        });
      };
      const onHidden = () => {
        root.removeEventListener("hidden.bs.modal", onHidden);
        finish(null);
      };
      root.addEventListener("hidden.bs.modal", onHidden);
      search.value = "";
      search.oninput = render;
      root.querySelector("[data-sla-list-create]").onclick = async () => {
        const created = await createSpellLikeChoiceList();
        if (created) finish(created);
      };
      root.querySelector("[data-sla-list-clear]").onclick = () => finish({ clear: true });
      render();
      modal.show();
      setTimeout(() => search.focus(), 150);
    });
  }

  let conditionCatalogPromise = null;

  function loadConditionCatalog() {
    conditionCatalogPromise ||= (window.PFApp?.loadConditionDefinitions
      ? window.PFApp.loadConditionDefinitions()
      : fetch("data/conditions.json", { cache: "no-cache" }).then((response) =>
          response.ok ? response.json() : [],
        )
    ).then((conditions) =>
      (Array.isArray(conditions) ? conditions : [])
        .filter((condition) => condition && condition.name)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    );
    return conditionCatalogPromise;
  }

  function compactConditionPayload(condition = {}) {
    if (!condition || typeof condition !== "object") return null;
    return {
      id: condition.id || "",
      name: condition.name || "",
      category: condition.category || "Condition",
      duration: condition.duration || "",
      durationConfig: condition.durationConfig || null,
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
      extraRanksPerLevel: Array.isArray(condition.extraRanksPerLevel)
        ? condition.extraRanksPerLevel
        : [],
      sizeChanges: Array.isArray(condition.sizeChanges)
        ? condition.sizeChanges
        : [],
      casterLevelBonuses: Array.isArray(condition.casterLevelBonuses)
        ? condition.casterLevelBonuses
        : [],
      spellDcBonuses: Array.isArray(condition.spellDcBonuses)
        ? condition.spellDcBonuses
        : [],
      spellLikeAbilities: Array.isArray(condition.spellLikeAbilities)
        ? condition.spellLikeAbilities
        : [],
      generatedEquipment: Array.isArray(condition.generatedEquipment)
        ? condition.generatedEquipment
        : [],
      description: condition.description || "",
    };
  }

  function applyConditionName(entry = {}) {
    return (
      entry.name ||
      entry.conditionName ||
      entry.condition?.name ||
      entry.condition?.conditionName ||
      ""
    );
  }

  function applyConditionText(entry = {}) {
    return `Applies condition: ${applyConditionName(entry) || "Condition"}`;
  }

  function createApplyConditionRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-apply-condition-row";
    const selectedId = data.conditionId || data.id || data.condition?.id || "";
    const selectedName = applyConditionName(data);
    row._condition =
      data.condition && typeof data.condition === "object" ? data.condition : null;
    row.innerHTML = `
      <div>
        <label>Condition</label>
        <select data-apply-condition-field="condition" class="form-select form-select-sm">
          <option value="">Choose condition</option>
          ${
            selectedName && !selectedId
              ? `<option value="${escapeHtml(selectedName)}" selected>${escapeHtml(selectedName)}</option>`
              : ""
          }
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete applied condition"><i class="bi bi-trash"></i></button>
    `;
    const select = row.querySelector('[data-apply-condition-field="condition"]');
    loadConditionCatalog()
      .then((conditions) => {
        const selectedValue = selectedId || selectedName;
        select.innerHTML =
          `<option value="">Choose condition</option>` +
          conditions
            .map((condition) => {
              const value = condition.id || condition.name;
              const selected =
                selectedValue &&
                (String(selectedValue) === String(value) ||
                  String(selectedValue).toLowerCase() ===
                    String(condition.name).toLowerCase());
              if (selected) row._condition = condition;
              return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(condition.name)}</option>`;
            })
            .join("");
        if (selectedValue && !row._condition) {
          select.insertAdjacentHTML(
            "beforeend",
            `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedName || selectedValue)}</option>`,
          );
        }
      })
      .catch(() => {});
    select.addEventListener("change", async () => {
      const conditions = await loadConditionCatalog().catch(() => []);
      row._condition =
        conditions.find(
          (condition) =>
            String(condition.id || condition.name) === select.value ||
            String(condition.name).toLowerCase() ===
              String(select.value).toLowerCase(),
        ) || null;
    });
    row
      .querySelector('button[aria-label="Delete applied condition"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const value = select.value;
      const condition = row._condition;
      const name = condition?.name || selectedName || value;
      if (!value && !name) return null;
      return {
        conditionId: condition?.id || value || "",
        name,
        condition: compactConditionPayload(condition || data.condition || data),
      };
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function normalizeConditionalVariableKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ");
  }

  function conditionalVariablePoolOptionsHtml(selected = "") {
    const pools = window.PFEffectStats?.CONDITIONAL_VARIABLE_POOLS || [];
    return pools
      .map(
        (pool) =>
          `<option value="${escapeHtml(pool.id)}" ${selected === pool.id ? "selected" : ""}>${escapeHtml(pool.label)}</option>`,
      )
      .join("");
  }

  function createConditionalVariableRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-conditional-variable-row";
    const key = normalizeConditionalVariableKey(data.key || data.name || "");
    const poolId =
      data.poolId || data.pool || data.source || "ranger-favored-enemies";
    row.innerHTML = `
      <div>
        <label>Variable</label>
        <input data-conditional-variable-field="key" class="form-control form-control-sm" value="${escapeHtml(key || "favored enemy")}" placeholder="favored enemy">
      </div>
      <div>
        <label>Options</label>
        <select data-conditional-variable-field="poolId" class="form-select form-select-sm">
          ${conditionalVariablePoolOptionsHtml(poolId)}
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete conditional variable"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary">Use <code>{${escapeHtml(key || "favored enemy")}}</code> in Applies When.</div>
    `;
    const keyInput = row.querySelector('[data-conditional-variable-field="key"]');
    const hint = row.querySelector(".small");
    keyInput.addEventListener("input", () => {
      const nextKey = normalizeConditionalVariableKey(keyInput.value);
      hint.innerHTML = `Use <code>{${escapeHtml(nextKey || "variable")}}</code> in Applies When.`;
    });
    row
      .querySelector('button[aria-label="Delete conditional variable"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const key = normalizeConditionalVariableKey(keyInput.value);
      if (!key) return null;
      const poolId = row.querySelector(
        '[data-conditional-variable-field="poolId"]',
      ).value;
      const pool = window.PFEffectStats?.conditionalVariablePoolById?.(poolId);
      return {
        key,
        label: data.label || key.replace(/\b\w/g, (ch) => ch.toUpperCase()),
        poolId,
        poolLabel: pool?.label || data.poolLabel || "",
      };
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function generatedEquipmentType(data = {}) {
    const raw = String(data.type || data.itemType || data.equipmentType || "");
    return GENERATED_EQUIPMENT_TYPES.includes(raw) ? raw : "Weapon";
  }

  function generatedEquipmentDetails(data = {}) {
    return data.details && typeof data.details === "object" ? data.details : data;
  }

  async function fetchGeneratedEquipmentJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load ${path}.`);
    return response.json();
  }

  let generatedEquipmentCatalogPromise = null;

  function loadGeneratedEquipmentCatalog() {
    generatedEquipmentCatalogPromise ||= Promise.all([
      window.PFItemData?.loadWeapons?.() ||
        fetchGeneratedEquipmentJson("data/weapons.json"),
      window.PFItemData?.loadArmorShields?.() ||
        fetchGeneratedEquipmentJson("data/armor-shields.json"),
    ]).then(([weapons, armor]) =>
      [
        ...(Array.isArray(weapons) ? weapons : []),
        ...(Array.isArray(armor) ? armor : []),
      ].filter((item) =>
        GENERATED_EQUIPMENT_TYPES.includes(String(item.type || "")),
      ),
    );
    return generatedEquipmentCatalogPromise;
  }

  function generatedEquipmentDetailLine(item = {}) {
    const details = item.details || {};
    if (item.type === "Weapon") {
      return [details.weaponGroup, details.damage, details.critical]
        .filter(Boolean)
        .join(" | ");
    }
    return [details.armorGroup, details.bonus, details.maxDex]
      .filter(Boolean)
      .join(" | ");
  }

  function ensureGeneratedEquipmentPickerModal() {
    const id = "generatedEquipmentPickerModal";
    const existing = document.getElementById(id);
    if (existing) return existing;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable generated-equipment-picker-dialog">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header generated-equipment-picker-header">
              <h5 class="modal-title">Choose Weapon / Armor</h5>
            </div>
            <div class="modal-body">
              <input class="form-control form-control-sm generated-equipment-picker-search" data-generated-equipment-picker-search placeholder="Search weapons and armor">
              <div class="generated-equipment-picker-results" data-generated-equipment-picker-results></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById(id);
  }

  async function openGeneratedEquipmentPicker({ types = GENERATED_EQUIPMENT_TYPES } = {}) {
    const root = ensureGeneratedEquipmentPickerModal();
    const modal = new bootstrap.Modal(root);
    const allowed = new Set(types);
    const search = root.querySelector("[data-generated-equipment-picker-search]");
    const results = root.querySelector("[data-generated-equipment-picker-results]");
    const allItems = (await loadGeneratedEquipmentCatalog()).filter((item) =>
      allowed.has(item.type),
    );
    let settled = false;

    return new Promise((resolve) => {
      const finish = (value = null) => {
        if (settled) return;
        settled = true;
        modal.hide();
        resolve(value);
      };
      const render = () => {
        const term = search.value.trim().toLowerCase();
        const visible = allItems
          .filter((item) => {
            if (!term) return true;
            return `${item.name || ""} ${item.type || ""} ${
              item.details?.summary || ""
            }`
              .toLowerCase()
              .includes(term);
          })
          .slice(0, 80);
        results.innerHTML = visible.length
          ? visible
              .map(
                (item, index) => `
                  <button class="generated-equipment-picker-card" type="button" data-generated-equipment-picker-index="${index}">
                    <span>
                      <strong>${escapeHtml(item.name || "Unnamed item")}</strong>
                      <small>${escapeHtml(generatedEquipmentDetailLine(item))}</small>
                    </span>
                    <span class="generated-equipment-picker-type">${escapeHtml(item.type || "")}</span>
                  </button>
                `,
              )
              .join("")
          : `<div class="small-text">No matching equipment.</div>`;
        results
          .querySelectorAll("[data-generated-equipment-picker-index]")
          .forEach((button) => {
            button.addEventListener("click", () =>
              finish(visible[Number(button.dataset.generatedEquipmentPickerIndex)]),
            );
          });
      };
      const onHidden = () => {
        root.removeEventListener("hidden.bs.modal", onHidden);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
      root.addEventListener("hidden.bs.modal", onHidden);
      search.value = "";
      search.oninput = render;
      render();
      modal.show();
      setTimeout(() => search.focus(), 150);
    });
  }

  function scaleOptionsHtml(selected = "") {
    return GENERATED_SCALE_OPTIONS.map(
      (option) =>
        `<option value="${escapeHtml(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`,
    ).join("");
  }

  function weaponTypeOptionsHtml(selected = "") {
    return GENERATED_WEAPON_TYPES.map(
      (option) =>
        `<option value="${escapeHtml(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`,
    ).join("");
  }

  function simpleOptionsHtml(options = [], selected = "") {
    return options
      .map(
        (option) =>
          `<option value="${escapeHtml(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`,
      )
      .join("");
  }

  function optionObjectsHtml(options = [], selected = "") {
    return options
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}" ${selected === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
      )
      .join("");
  }

  function bonusTypeOptionsHtml(selected = "untyped") {
    return BONUS_TYPES.map(
      (type) =>
        `<option value="${escapeHtml(type)}" ${selected === type ? "selected" : ""}>${escapeHtml(type)}</option>`,
    ).join("");
  }

  function commaList(value) {
    if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    return String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function titleFromId(value) {
    return String(value || "")
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  let spellDescriptorsPromise = null;
  function loadSpellDescriptors() {
    spellDescriptorsPromise ||= fetch("./data/spell-descriptors.json", {
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => (Array.isArray(data.descriptors) ? data.descriptors : []))
      .catch(() => []);
    return spellDescriptorsPromise;
  }

  let spellSubschoolsPromise = null;
  function loadSpellSubschools() {
    spellSubschoolsPromise ||= fetch("./data/spell-subschools.json", {
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => (Array.isArray(data.subschools) ? data.subschools : []))
      .catch(() => []);
    return spellSubschoolsPromise;
  }

  function spellAdjustmentTargets(data = {}) {
    return commaList(
      data.targets ||
        data.values ||
        data.names ||
        data.spellNames ||
        data.classes ||
        data.schools ||
        data.subschools ||
        data.descriptors ||
        data.magicTypes ||
        data.target ||
        "",
    );
  }

  function spellAdjustmentMode(data = {}) {
    const raw = String(
      data.targetMode || data.chooseBy || data.by || data.mode || "all",
    )
      .trim()
      .toLowerCase();
    const aliases = {
      class: "class",
      classes: "class",
      school: "school",
      schools: "school",
      subschool: "subschool",
      subschools: "subschool",
      "school with subschool": "subschool",
      descriptor: "descriptor",
      descriptors: "descriptor",
      "type of magic": "magicType",
      magictype: "magicType",
      magic: "magicType",
      spell: "spell",
      spells: "spell",
      name: "spell",
      names: "spell",
      all: "all",
    };
    return SPELL_TARGET_MODES.some((mode) => mode.value === aliases[raw])
      ? aliases[raw]
      : "all";
  }

  function spellAdjustmentTargetLabel(mode, value) {
    if (mode === "subschool") {
      const [school, subschool] = String(value || "").split(":");
      return subschool
        ? `${titleFromId(school)} (${titleFromId(subschool)})`
        : titleFromId(value);
    }
    return mode === "spell" || mode === "class"
      ? String(value || "")
      : titleFromId(value);
  }

  function spellAdjustmentTargetText(mode, targets = []) {
    if (mode === "all") return "all spells";
    const label =
      SPELL_TARGET_MODES.find((entry) => entry.value === mode)?.label || "Target";
    return `${label}: ${targets.map((target) => spellAdjustmentTargetLabel(mode, target)).join(", ") || "any"}`;
  }

  async function spellAdjustmentSuggestions(mode) {
    if (mode === "school") return SPELL_SCHOOL_OPTIONS;
    if (mode === "magicType") return MAGIC_TYPE_OPTIONS;
    if (mode === "descriptor") {
      const descriptors = await loadSpellDescriptors();
      return descriptors.map((name) => ({
        value: name,
        label: titleFromId(name),
      }));
    }
    if (mode === "subschool") {
      const subschools = await loadSpellSubschools();
      return subschools.map((entry) => ({
        value: `${entry.school}:${entry.id}`,
        label: `${titleFromId(entry.school)} (${entry.name})`,
      }));
    }
    if (mode === "spell") {
      const spells = await loadSpellLikeSpellOptions();
      return spells.map((spell) => ({
        value: spell.name || spell.value,
        label: spell.label || spell.name || spell.value,
      }));
    }
    return [];
  }

  function createSpellAdjustmentRow(kind, data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-spell-adjustment-row";
    const isCasterLevel = kind === "casterLevel";
    const targetMode = spellAdjustmentMode(data);
    const targets = spellAdjustmentTargets(data);
    const appliesWhen = data.appliesWhen || data.condition || "";
    const conditional =
      Boolean(String(appliesWhen).trim()) || Boolean(data.conditional);
    const datalistId = `spellAdjustmentTargets${++spellAdjustmentRowId}`;
    row.innerHTML = `
      <div>
        <label>Choose By</label>
        <select data-spell-adjustment-field="targetMode" class="form-select form-select-sm">
          ${optionObjectsHtml(SPELL_TARGET_MODES, targetMode)}
        </select>
      </div>
      <div data-spell-adjustment-targets-wrap>
        <label>Targets</label>
        <input data-spell-adjustment-field="targets" class="form-control form-control-sm" list="${datalistId}" value="${escapeHtml(targets.join(", "))}" placeholder="comma separated">
        <datalist id="${datalistId}"></datalist>
      </div>
      ${
        isCasterLevel
          ? `<div>
              <label>Applies To</label>
              <select data-spell-adjustment-field="appliesTo" class="form-select form-select-sm">
                ${optionObjectsHtml(CASTER_LEVEL_APPLY_TO_OPTIONS, data.appliesTo || data.applyTo || data.part || "spell")}
              </select>
            </div>`
          : ""
      }
      <div>
        <label>Value</label>
        <input data-spell-adjustment-field="value" class="form-control form-control-sm" type="number" value="${Number(data.value ?? data.amount ?? 0)}">
      </div>
      <div>
        <label>Type</label>
        <select data-spell-adjustment-field="type" class="form-select form-select-sm">
          ${bonusTypeOptionsHtml(data.type || "untyped")}
        </select>
      </div>
      <div>
        <label>Stacks</label>
        <div class="form-check form-switch">
          <input data-spell-adjustment-field="stacks" class="form-check-input" type="checkbox" ${data.stacks ? "checked" : ""}>
        </div>
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
      <div>
        <label>Conditional</label>
        <div class="form-check form-switch">
          <input data-spell-adjustment-field="conditional" class="form-check-input" type="checkbox" ${conditional ? "checked" : ""}>
        </div>
      </div>
      <div>
        <label>Applies When</label>
        <input data-spell-adjustment-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="only vs undead, only fire damage, etc.">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete spell adjustment"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    const modeSelect = row.querySelector('[data-spell-adjustment-field="targetMode"]');
    const targetsWrap = row.querySelector("[data-spell-adjustment-targets-wrap]");
    const targetsInput = row.querySelector('[data-spell-adjustment-field="targets"]');
    const datalist = row.querySelector("datalist");
    const syncTargets = async () => {
      const mode = modeSelect.value;
      targetsWrap.classList.toggle("d-none", mode === "all");
      const suggestions = await spellAdjustmentSuggestions(mode);
      datalist.innerHTML = suggestions
        .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
        .join("");
      const placeholder = {
        class: "Wizard, Cleric",
        school: "evocation, conjuration",
        subschool: "conjuration:teleportation",
        descriptor: "fire, mind-affecting",
        magicType: "arcane, divine",
        spell: "Fireball, Teleport",
      }[mode];
      targetsInput.placeholder = placeholder || "comma separated";
    };
    modeSelect.addEventListener("change", syncTargets);
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    wireConditionalFromAppliesWhen(
      row,
      '[data-spell-adjustment-field="conditional"]',
      '[data-spell-adjustment-field="appliesWhen"]',
    );
    row
      .querySelector('button[aria-label="Delete spell adjustment"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const mode = modeSelect.value || "all";
      const targets = mode === "all" ? [] : commaList(targetsInput.value);
      if (mode !== "all" && !targets.length) return null;
      const appliesWhen = row
        .querySelector('[data-spell-adjustment-field="appliesWhen"]')
        .value.trim();
      const entry = {
        targetMode: mode,
        targets,
        value: Number(
          row.querySelector('[data-spell-adjustment-field="value"]').value || 0,
        ),
        type:
          row.querySelector('[data-spell-adjustment-field="type"]').value ||
          "untyped",
        stacks: row.querySelector('[data-spell-adjustment-field="stacks"]')
          .checked,
        conditional:
          row.querySelector('[data-spell-adjustment-field="conditional"]')
            .checked || Boolean(appliesWhen),
        appliesWhen,
      };
      if (isCasterLevel) {
        entry.appliesTo =
          row.querySelector('[data-spell-adjustment-field="appliesTo"]')
            ?.value || "spell";
      }
      if (row._bonusScale) entry.bonusScale = row._bonusScale;
      return entry.value || entry.bonusScale ? entry : null;
    };
    row._collect = collect;
    syncTargets();
    return { element: row, collect };
  }

  function casterLevelBonusText(entry = {}) {
    const value = Number(entry.value || 0);
    const scale = scaleText(entry.bonusScale || entry.scale || null);
    const appliesTo = CASTER_LEVEL_APPLY_TO_OPTIONS.find(
      (option) => option.value === (entry.appliesTo || entry.applyTo || "spell"),
    )?.label;
    return [
      `Caster Level ${value >= 0 ? "+" : ""}${value}`,
      scale ? `scales: ${scale}` : "",
      appliesTo || "Whole Spell",
      spellAdjustmentTargetText(spellAdjustmentMode(entry), spellAdjustmentTargets(entry)),
      entry.appliesWhen ? `when ${entry.appliesWhen}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function spellDcBonusText(entry = {}) {
    const value = Number(entry.value || 0);
    const scale = scaleText(entry.bonusScale || entry.scale || null);
    return [
      `Spell DC ${value >= 0 ? "+" : ""}${value}`,
      scale ? `scales: ${scale}` : "",
      spellAdjustmentTargetText(spellAdjustmentMode(entry), spellAdjustmentTargets(entry)),
      entry.appliesWhen ? `when ${entry.appliesWhen}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function fillGeneratedEquipmentRow(row, item = {}) {
    const details = generatedEquipmentDetails(item);
    const type = generatedEquipmentType(item);
    row.querySelector('[data-generated-equipment-field="type"]').value = type;
    row.querySelector('[data-generated-equipment-field="name"]').value =
      item.name || item.item || "";
    row.querySelector('[data-generated-equipment-field="weaponType"]').value =
      details.weaponType || "Natural Weapon";
    row.querySelector('[data-generated-equipment-field="naturalAttackKind"]').value =
      details.naturalAttackKind || details.natural_attack_kind || "Other";
    row.querySelector('[data-generated-equipment-field="naturalAttackRole"]').value =
      details.naturalAttackRole || details.natural_attack_role || "Primary";
    row.querySelector('[data-generated-equipment-field="attackScale"]').value =
      details.attackScale || "STR";
    row.querySelector('[data-generated-equipment-field="damageScale"]').value =
      details.damageScale || "STR";
    row.querySelector('[data-generated-equipment-field="damage"]').value =
      details.damage || "";
    row.querySelector('[data-generated-equipment-field="critical"]').value =
      details.critical || "";
    row.querySelector('[data-generated-equipment-field="attackMisc"]').value =
      details.attackMisc || details.attack_misc || "0";
    row.querySelector('[data-generated-equipment-field="damageMisc"]').value =
      details.damageMisc || details.damage_misc || "0";
    row.querySelector('[data-generated-equipment-field="range"]').value =
      details.range || "";
    row.querySelector('[data-generated-equipment-field="armorBonus"]').value =
      details.bonus || item.bonus || "";
    row.querySelector('[data-generated-equipment-field="enhancement"]').value =
      details.enhancement || item.enhancement || "0";
    row.querySelector('[data-generated-equipment-field="penalty"]').value =
      details.penalty || item.penalty || "";
    row.querySelector('[data-generated-equipment-field="failure"]').value =
      details.failure || item.failure || "";
    row.querySelector('[data-generated-equipment-field="weight"]').value =
      details.weight || item.weight || "";
    row._sourceItem = item.name
      ? {
          name: item.name,
          type,
          details: { ...details },
          description: item.description || "",
        }
      : null;
    row.dispatchEvent(new CustomEvent("generated-equipment:typechange"));
    row.querySelectorAll("input, select").forEach((input) => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function createGeneratedEquipmentRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-generated-equipment-row";
    const type = generatedEquipmentType(data);
    const details = generatedEquipmentDetails(data);
    row.innerHTML = `
      <div class="shared-generated-equipment-header">
        <div>
          <label>Type</label>
          <select data-generated-equipment-field="type" class="form-select form-select-sm">
            ${GENERATED_EQUIPMENT_TYPES.map(
              (option) =>
                `<option value="${option}" ${type === option ? "selected" : ""}>${option}</option>`,
            ).join("")}
          </select>
        </div>
        <div>
          <label>Name</label>
          <input data-generated-equipment-field="name" class="form-control form-control-sm" value="${escapeHtml(data.name || data.item || "")}" placeholder="Claw, bite, armor">
        </div>
        <button class="btn btn-outline-light btn-sm" type="button" data-generated-equipment-search>
          <i class="bi bi-search"></i>
          <span>Search</span>
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete generated equipment"><i class="bi bi-trash"></i></button>
      </div>
      <div class="shared-generated-equipment-fields" data-generated-equipment-weapon-fields>
        <div>
          <label>Weapon Type</label>
          <select data-generated-equipment-field="weaponType" class="form-select form-select-sm">
            ${weaponTypeOptionsHtml(details.weaponType || "Natural Weapon")}
          </select>
        </div>
        <div data-generated-equipment-natural-field>
          <label>Natural Attack</label>
          <select data-generated-equipment-field="naturalAttackKind" class="form-select form-select-sm">
            ${simpleOptionsHtml(NATURAL_ATTACK_KINDS, details.naturalAttackKind || details.natural_attack_kind || "Other")}
          </select>
        </div>
        <div data-generated-equipment-natural-field>
          <label>Attack Type</label>
          <select data-generated-equipment-field="naturalAttackRole" class="form-select form-select-sm">
            ${simpleOptionsHtml(NATURAL_ATTACK_ROLES, details.naturalAttackRole || details.natural_attack_role || "Primary")}
          </select>
        </div>
        <div>
          <label>Damage</label>
          <input data-generated-equipment-field="damage" class="form-control form-control-sm" value="${escapeHtml(details.damage || "")}" placeholder="1d6">
        </div>
        <div>
          <label>Critical</label>
          <input data-generated-equipment-field="critical" class="form-control form-control-sm" value="${escapeHtml(details.critical || "")}" placeholder="x2">
        </div>
        <div>
          <label>Attack Scale</label>
          <select data-generated-equipment-field="attackScale" class="form-select form-select-sm">
            ${scaleOptionsHtml(details.attackScale || "STR")}
          </select>
        </div>
        <div>
          <label>Damage Scale</label>
          <select data-generated-equipment-field="damageScale" class="form-select form-select-sm">
            ${scaleOptionsHtml(details.damageScale || "STR")}
          </select>
        </div>
        <div>
          <label>Attack Misc</label>
          <input data-generated-equipment-field="attackMisc" class="form-control form-control-sm" type="number" value="${details.attackMisc ?? details.attack_misc ?? 0}">
        </div>
        <div>
          <label>Damage Misc</label>
          <input data-generated-equipment-field="damageMisc" class="form-control form-control-sm" type="number" value="${details.damageMisc ?? details.damage_misc ?? 0}">
        </div>
        <div>
          <label>Range</label>
          <input data-generated-equipment-field="range" class="form-control form-control-sm" value="${escapeHtml(details.range || "")}">
        </div>
      </div>
      <div class="shared-generated-equipment-fields" data-generated-equipment-armor-fields>
        <div>
          <label>Armor Bonus</label>
          <input data-generated-equipment-field="armorBonus" class="form-control form-control-sm" value="${escapeHtml(details.bonus || data.bonus || "")}" placeholder="+2">
        </div>
        <div>
          <label>Enhancement</label>
          <input data-generated-equipment-field="enhancement" class="form-control form-control-sm" type="number" value="${details.enhancement ?? data.enhancement ?? 0}">
        </div>
        <div>
          <label>Penalty</label>
          <input data-generated-equipment-field="penalty" class="form-control form-control-sm" value="${escapeHtml(details.penalty || data.penalty || "")}">
        </div>
        <div>
          <label>Failure</label>
          <input data-generated-equipment-field="failure" class="form-control form-control-sm" value="${escapeHtml(details.failure || data.failure || "")}">
        </div>
        <div>
          <label>Weight</label>
          <input data-generated-equipment-field="weight" class="form-control form-control-sm" value="${escapeHtml(details.weight || data.weight || "")}">
        </div>
      </div>
    `;
    const syncType = () => {
      const selected = row.querySelector(
        '[data-generated-equipment-field="type"]',
      ).value;
      row
        .querySelector("[data-generated-equipment-weapon-fields]")
        .classList.toggle("d-none", selected !== "Weapon");
      row
        .querySelector("[data-generated-equipment-armor-fields]")
        .classList.toggle("d-none", selected === "Weapon");
      const natural = selected === "Weapon" &&
        ["Natural", "Natural Weapon"].includes(
          row.querySelector('[data-generated-equipment-field="weaponType"]').value,
        );
      row
        .querySelectorAll("[data-generated-equipment-natural-field]")
        .forEach((field) => field.classList.toggle("d-none", !natural));
    };
    row.addEventListener("generated-equipment:typechange", syncType);
    row
      .querySelector('[data-generated-equipment-field="type"]')
      .addEventListener("change", syncType);
    row
      .querySelector('[data-generated-equipment-field="weaponType"]')
      .addEventListener("change", syncType);
    row
      .querySelector("[data-generated-equipment-search]")
      .addEventListener("click", async () => {
        const picker =
          window.PFGeneratedEquipmentPicker?.open || openGeneratedEquipmentPicker;
        const selected = await picker({
          types: ["Weapon", "Armor", "Shield"],
        });
        if (selected) fillGeneratedEquipmentRow(row, selected);
      });
    row
      .querySelector('button[aria-label="Delete generated equipment"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const selectedType = row.querySelector(
        '[data-generated-equipment-field="type"]',
      ).value;
      const name = row
        .querySelector('[data-generated-equipment-field="name"]')
        .value.trim();
      if (!name) return null;
      if (selectedType === "Weapon") {
        return {
          type: "Weapon",
          name,
          details: {
            weaponType: row.querySelector(
              '[data-generated-equipment-field="weaponType"]',
            ).value,
            naturalAttackKind: row.querySelector(
              '[data-generated-equipment-field="naturalAttackKind"]',
            ).value,
            naturalAttackRole: row.querySelector(
              '[data-generated-equipment-field="naturalAttackRole"]',
            ).value,
            attackScale: row.querySelector(
              '[data-generated-equipment-field="attackScale"]',
            ).value,
            damageScale: row.querySelector(
              '[data-generated-equipment-field="damageScale"]',
            ).value,
            damage: row.querySelector('[data-generated-equipment-field="damage"]')
              .value,
            critical: row.querySelector(
              '[data-generated-equipment-field="critical"]',
            ).value,
            attackMisc: row.querySelector(
              '[data-generated-equipment-field="attackMisc"]',
            ).value,
            damageMisc: row.querySelector(
              '[data-generated-equipment-field="damageMisc"]',
            ).value,
            range: row.querySelector('[data-generated-equipment-field="range"]')
              .value,
          },
        };
      }
      return {
        type: selectedType,
        name,
        details: {
          bonus: row.querySelector('[data-generated-equipment-field="armorBonus"]')
            .value,
          enhancement: row.querySelector(
            '[data-generated-equipment-field="enhancement"]',
          ).value,
          penalty: row.querySelector('[data-generated-equipment-field="penalty"]')
            .value,
          failure: row.querySelector('[data-generated-equipment-field="failure"]')
            .value,
          weight: row.querySelector('[data-generated-equipment-field="weight"]')
            .value,
        },
      };
    };
    row._collect = collect;
    syncType();
    return { element: row, collect };
  }

  function createSpellLikeAbilityRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-spell-like-row";
    row._spell = compactSpellPayload(data.spell) || null;
    row._spellChoiceList = spellLikeChoiceList(data);
    row.innerHTML = `
      <div>
        <label>Level</label>
        <input data-spell-like-field="minimumLevel" class="form-control form-control-sm" type="number" min="1" value="${spellLikeMinimumLevel(data)}">
      </div>
      <div>
        <label>Frequency</label>
        <input data-spell-like-field="frequency" class="form-control form-control-sm" value="${escapeHtml(data.frequency || "")}" placeholder="At will (Level 0)">
      </div>
      <div>
        <label>Spell</label>
        <div class="shared-spell-like-spell-actions">
          <button class="btn btn-outline-light btn-sm w-100 shared-spell-like-picker" type="button" data-spell-like-select>
            <span data-spell-like-name>${escapeHtml(spellLikeChoiceListText(data) || spellLikeAbilityName(data) || "Choose spell")}</span>
            <i class="bi bi-search"></i>
          </button>
          <button class="btn btn-outline-info btn-sm btn-icon" type="button" data-spell-like-list-select title="Choose SLA spell list" aria-label="Choose SLA spell list"><i class="bi bi-journal-text"></i></button>
        </div>
      </div>
      <div>
        <label>Casting Attr.</label>
        <select data-spell-like-field="castingAttr" class="form-select form-select-sm">
          ${SPELL_LIKE_CASTING_ATTR_OPTIONS.map(
            (attr) =>
              `<option value="${escapeHtml(attr)}" ${spellLikeCastingAttr(data) === attr ? "selected" : ""}>${escapeHtml(attr || "-")}</option>`,
          ).join("")}
        </select>
      </div>
      <div>
        <label>Score</label>
        <input data-spell-like-field="minimumScore" class="form-control form-control-sm" type="number" min="1" value="${escapeHtml(spellLikeMinimumScore(data))}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete spell-like ability"><i class="bi bi-trash"></i></button>
    `;
    const spellLabel = row.querySelector("[data-spell-like-name]");
    const setSpell = (spell) => {
      row._spell = compactSpellPayload(spell);
      row._spellChoiceList = null;
      spellLabel.textContent = row._spell?.name || "Choose spell";
    };
    const setSpellChoiceList = (list) => {
      if (list?.clear) {
        row._spellChoiceList = null;
        spellLabel.textContent = row._spell?.name || "Choose spell";
        return;
      }
      row._spell = null;
      row._spellChoiceList = normalizeSpellLikeChoiceList(list);
      spellLabel.textContent = row._spellChoiceList
        ? `Choose from ${row._spellChoiceList.name}`
        : "Choose spell";
    };
    row
      .querySelector("[data-spell-like-select]")
      .addEventListener("click", async () => {
        if (!window.PFMagicSearchModal) return;
        const spell = await window.PFMagicSearchModal.open({
          title: "Choose Spell-Like Ability",
        });
        if (spell) setSpell(spell);
      });
    row
      .querySelector("[data-spell-like-list-select]")
      .addEventListener("click", async () => {
        const list = await openSpellLikeListPicker();
        if (list) setSpellChoiceList(list);
      });
    row
      .querySelector('button[aria-label="Delete spell-like ability"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const spellName = row._spell?.name || spellLabel.textContent.trim();
      if (
        (!spellName || spellName === "Choose spell") &&
        !row._spellChoiceList
      )
        return null;
      const payload = {
        minimumLevel: spellLikeMinimumLevel({
          minimumLevel: row.querySelector('[data-spell-like-field="minimumLevel"]')
            .value,
        }),
        frequency: row
          .querySelector('[data-spell-like-field="frequency"]')
          .value.trim(),
        ...(row.querySelector('[data-spell-like-field="castingAttr"]').value
          ? {
              castingAttr: row.querySelector(
                '[data-spell-like-field="castingAttr"]',
              ).value,
            }
          : {}),
        ...(row.querySelector('[data-spell-like-field="minimumScore"]').value
          ? {
              minimumScore: Number(
                row.querySelector('[data-spell-like-field="minimumScore"]')
                  .value || 0,
              ),
            }
          : {}),
      };
      if (row._spellChoiceList) {
        payload.spellChoiceListId = row._spellChoiceList.id;
        payload.spellChoiceList = row._spellChoiceList;
      } else {
        payload.spellName = spellName;
      }
      return payload;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // DR, Immunities, SR, applied conditions, Class Skill grants, Size Changes,
  // caster level/DC bonuses, Spell-Like Abilities, and generated equipped weapons/armor
  // are separate things but they're always authored together and rarely
  // used -- one collapsed "Extra" accordion item holding all of them is
  // what every effect-authoring surface in the app mounts now, built
  // here once so there's exactly one place defining what "Extra" means.
  //
  // Spell-Like Abilities are stored as spellLikeAbilities:
  // [{ minimumLevel, frequency, spellName }]. spellName is the stable
  // display key and resolves to data/spells.json when full details are needed.
  // minimumLevel defaults to 1 for old rows.
  //
  // container: the element to fill with the accordion-item markup.
  // options.idPrefix: unique id prefix for this mount (required --
  // every surface needs its own so multiple mounts on one page, or
  // across pages, never collide). options.accordionParentId: pass the
  // id of an existing bootstrap accordion this should join (so it
  // collapses in sync with sibling items, e.g. class-feature-editor's
  // "Feature Effects"); omit for a standalone collapsible section.
  // options.skills: forwarded to createClassSkillRow. options.onChange:
  // called after any add/delete/edit inside the section.
  //
  // Returns helpers plus reset(item) and collect(). reset(item) clears
  // and repopulates the extra lists; collect() returns the same extras
  // using their app-level camelCase names.
  function mountExtraAccordion(container, options = {}) {
    const prefix = options.idPrefix;
    const parentAttr = options.accordionParentId
      ? ` data-bs-parent="#${options.accordionParentId}"`
      : "";
    container.innerHTML = `
      <div class="accordion-item shared-extra-accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${prefix}Panel" aria-expanded="false" aria-controls="${prefix}Panel">
            Extra <span id="${prefix}Count" class="badge text-bg-secondary ms-2"></span>
          </button>
        </h2>
        <div id="${prefix}Panel" class="accordion-collapse collapse"${parentAttr}>
          <div class="accordion-body">
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Damage Reduction</div>
                <button id="${prefix}AddDr" class="btn btn-outline-info btn-sm" type="button">Add DR</button>
              </div>
              <div id="${prefix}DrRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Spell Resistance</div>
                <button id="${prefix}AddSr" class="btn btn-outline-info btn-sm" type="button">Add SR</button>
              </div>
              <div id="${prefix}SrRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Immunities</div>
                <button id="${prefix}AddImmunity" class="btn btn-outline-info btn-sm" type="button">Add Immunity</button>
              </div>
              <div id="${prefix}ImmunityRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Apply Condition</div>
                <button id="${prefix}AddApplyCondition" class="btn btn-outline-info btn-sm" type="button">Add Condition</button>
              </div>
              <div id="${prefix}ApplyConditionRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Class Skills</div>
                <button id="${prefix}AddClassSkill" class="btn btn-outline-info btn-sm" type="button">Add Class Skill</button>
              </div>
              <div id="${prefix}ClassSkillRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Extra Ranks Per Level</div>
                <button id="${prefix}AddExtraRanksPerLevel" class="btn btn-outline-info btn-sm" type="button">Add Ranks</button>
              </div>
              <div id="${prefix}ExtraRanksPerLevelRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Size Change</div>
                <button id="${prefix}AddSizeChange" class="btn btn-outline-info btn-sm" type="button">Add Size Change</button>
              </div>
              <div id="${prefix}SizeChangeRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Spell-Like Abilities</div>
                <button id="${prefix}AddSpellLikeAbility" class="btn btn-outline-info btn-sm" type="button">Add Spell-Like Ability</button>
              </div>
              <div id="${prefix}SpellLikeAbilityRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Caster Level Bonuses</div>
                <button id="${prefix}AddCasterLevelBonus" class="btn btn-outline-info btn-sm" type="button">Add Caster Level</button>
              </div>
              <div id="${prefix}CasterLevelBonusRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Spell DC Bonuses</div>
                <button id="${prefix}AddSpellDcBonus" class="btn btn-outline-info btn-sm" type="button">Add Spell DC</button>
              </div>
              <div id="${prefix}SpellDcBonusRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Generated Equipment</div>
                <button id="${prefix}AddGeneratedEquipment" class="btn btn-outline-info btn-sm" type="button">Add Weapon / Armor</button>
              </div>
              <div id="${prefix}GeneratedEquipmentRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Conditional Variables</div>
                <button id="${prefix}AddConditionalVariable" class="btn btn-outline-info btn-sm" type="button">Add Variable</button>
              </div>
              <div id="${prefix}ConditionalVariableRows" class="vstack gap-2"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const drRowsEl = document.getElementById(`${prefix}DrRows`);
    const srRowsEl = document.getElementById(`${prefix}SrRows`);
    const immunityRowsEl = document.getElementById(`${prefix}ImmunityRows`);
    const applyConditionRowsEl = document.getElementById(
      `${prefix}ApplyConditionRows`,
    );
    const csRowsEl = document.getElementById(`${prefix}ClassSkillRows`);
    const extraRanksRowsEl = document.getElementById(
      `${prefix}ExtraRanksPerLevelRows`,
    );
    const sizeRowsEl = document.getElementById(`${prefix}SizeChangeRows`);
    const slaRowsEl = document.getElementById(`${prefix}SpellLikeAbilityRows`);
    const casterLevelRowsEl = document.getElementById(
      `${prefix}CasterLevelBonusRows`,
    );
    const spellDcRowsEl = document.getElementById(`${prefix}SpellDcBonusRows`);
    const generatedEquipmentRowsEl = document.getElementById(
      `${prefix}GeneratedEquipmentRows`,
    );
    const conditionalVariableRowsEl = document.getElementById(
      `${prefix}ConditionalVariableRows`,
    );
    const countBadge = document.getElementById(`${prefix}Count`);

    const updateCount = () => {
      const count =
        drRowsEl.children.length +
        srRowsEl.children.length +
        immunityRowsEl.children.length +
        applyConditionRowsEl.children.length +
        csRowsEl.children.length +
        extraRanksRowsEl.children.length +
        sizeRowsEl.children.length +
        slaRowsEl.children.length +
        casterLevelRowsEl.children.length +
        spellDcRowsEl.children.length +
        generatedEquipmentRowsEl.children.length +
        conditionalVariableRowsEl.children.length;
      if (countBadge) {
        countBadge.textContent = count ? String(count) : "";
        countBadge.classList.toggle("d-none", !count);
      }
      options.onChange?.();
    };

    const addDr = (data = {}) => {
      const { element } = createDrRow(data, { onDelete: updateCount });
      drRowsEl.appendChild(element);
      updateCount();
    };
    const addSr = (data = {}) => {
      const { element } = createSrRow(data, { onDelete: updateCount });
      srRowsEl.appendChild(element);
      updateCount();
    };
    const addImmunity = (data = {}) => {
      const { element } = createImmunityRow(data, { onDelete: updateCount });
      immunityRowsEl.appendChild(element);
      updateCount();
    };
    const addApplyCondition = (data = {}) => {
      const { element } = createApplyConditionRow(data, {
        onDelete: updateCount,
      });
      applyConditionRowsEl.appendChild(element);
      updateCount();
    };
    const addClassSkill = (data = {}) => {
      const { element } = createClassSkillRow(data, {
        onDelete: updateCount,
        skills: options.skills,
      });
      csRowsEl.appendChild(element);
      updateCount();
    };
    const addExtraRanksPerLevel = (data = {}) => {
      const { element } = createExtraRanksPerLevelRow(data, {
        onDelete: updateCount,
      });
      extraRanksRowsEl.appendChild(element);
      updateCount();
    };
    const addSizeChange = (data = {}) => {
      const { element } = createSizeChangeRow(data, {
        onDelete: updateCount,
      });
      sizeRowsEl.appendChild(element);
      updateCount();
    };
    const addSpellLikeAbility = (data = {}) => {
      const { element } = createSpellLikeAbilityRow(data, {
        onDelete: updateCount,
      });
      slaRowsEl.appendChild(element);
      updateCount();
    };
    const addCasterLevelBonus = (data = {}) => {
      const { element } = createSpellAdjustmentRow("casterLevel", data, {
        onDelete: updateCount,
      });
      casterLevelRowsEl.appendChild(element);
      updateCount();
    };
    const addSpellDcBonus = (data = {}) => {
      const { element } = createSpellAdjustmentRow("spellDc", data, {
        onDelete: updateCount,
      });
      spellDcRowsEl.appendChild(element);
      updateCount();
    };
    const addGeneratedEquipment = (data = {}) => {
      const { element } = createGeneratedEquipmentRow(data, {
        onDelete: updateCount,
      });
      generatedEquipmentRowsEl.appendChild(element);
      updateCount();
    };
    const addConditionalVariable = (data = {}) => {
      const { element } = createConditionalVariableRow(data, {
        onDelete: updateCount,
      });
      conditionalVariableRowsEl.appendChild(element);
      updateCount();
    };

    document
      .getElementById(`${prefix}AddDr`)
      .addEventListener("click", () => addDr());
    document
      .getElementById(`${prefix}AddSr`)
      .addEventListener("click", () => addSr());
    document
      .getElementById(`${prefix}AddImmunity`)
      .addEventListener("click", () => addImmunity());
    document
      .getElementById(`${prefix}AddApplyCondition`)
      .addEventListener("click", () => addApplyCondition());
    document
      .getElementById(`${prefix}AddClassSkill`)
      .addEventListener("click", () => addClassSkill());
    document
      .getElementById(`${prefix}AddExtraRanksPerLevel`)
      .addEventListener("click", () => addExtraRanksPerLevel());
    document
      .getElementById(`${prefix}AddSizeChange`)
      .addEventListener("click", () => addSizeChange());
    document
      .getElementById(`${prefix}AddSpellLikeAbility`)
      .addEventListener("click", () => addSpellLikeAbility());
    document
      .getElementById(`${prefix}AddCasterLevelBonus`)
      .addEventListener("click", () => addCasterLevelBonus());
    document
      .getElementById(`${prefix}AddSpellDcBonus`)
      .addEventListener("click", () => addSpellDcBonus());
    document
      .getElementById(`${prefix}AddGeneratedEquipment`)
      .addEventListener("click", () => addGeneratedEquipment());
    document
      .getElementById(`${prefix}AddConditionalVariable`)
      .addEventListener("click", () => addConditionalVariable());

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    return {
      addDr,
      addSr,
      addImmunity,
      addApplyCondition,
      addClassSkill,
      addExtraRanksPerLevel,
      addSizeChange,
      addSpellLikeAbility,
      addCasterLevelBonus,
      addSpellDcBonus,
      addGeneratedEquipment,
      addConditionalVariable,
      reset(item = {}) {
        drRowsEl.innerHTML = "";
        srRowsEl.innerHTML = "";
        immunityRowsEl.innerHTML = "";
        applyConditionRowsEl.innerHTML = "";
        csRowsEl.innerHTML = "";
        extraRanksRowsEl.innerHTML = "";
        sizeRowsEl.innerHTML = "";
        slaRowsEl.innerHTML = "";
        casterLevelRowsEl.innerHTML = "";
        spellDcRowsEl.innerHTML = "";
        generatedEquipmentRowsEl.innerHTML = "";
        conditionalVariableRowsEl.innerHTML = "";
        (Array.isArray(item.damageReduction) ? item.damageReduction : []).forEach(
          addDr,
        );
        (Array.isArray(item.spellResistance) ? item.spellResistance : []).forEach(
          addSr,
        );
        (Array.isArray(item.immunities) ? item.immunities : []).forEach(
          addImmunity,
        );
        (Array.isArray(item.applyConditions)
          ? item.applyConditions
          : []
        ).forEach(addApplyCondition);
        (Array.isArray(item.classSkillGrants) ? item.classSkillGrants : []).forEach(
          addClassSkill,
        );
        (Array.isArray(item.extraRanksPerLevel)
          ? item.extraRanksPerLevel
          : []
        ).forEach(addExtraRanksPerLevel);
        (Array.isArray(item.sizeChanges) ? item.sizeChanges : []).forEach(
          addSizeChange,
        );
        (Array.isArray(item.spellLikeAbilities)
          ? item.spellLikeAbilities
          : []
        ).forEach(addSpellLikeAbility);
        (Array.isArray(item.casterLevelBonuses)
          ? item.casterLevelBonuses
          : []
        ).forEach(addCasterLevelBonus);
        (Array.isArray(item.spellDcBonuses)
          ? item.spellDcBonuses
          : []
        ).forEach(addSpellDcBonus);
        (Array.isArray(item.generatedEquipment)
          ? item.generatedEquipment
          : []
        ).forEach(addGeneratedEquipment);
        (Array.isArray(item.conditionalVariables)
          ? item.conditionalVariables
          : []
        ).forEach(addConditionalVariable);
        updateCount();
      },
      collect() {
        return {
          damageReduction: collectRows(drRowsEl),
          spellResistance: collectRows(srRowsEl),
          immunities: collectRows(immunityRowsEl),
          applyConditions: collectRows(applyConditionRowsEl),
          classSkillGrants: collectRows(csRowsEl),
          extraRanksPerLevel: collectRows(extraRanksRowsEl),
          sizeChanges: collectRows(sizeRowsEl),
          spellLikeAbilities: collectRows(slaRowsEl),
          casterLevelBonuses: collectRows(casterLevelRowsEl),
          spellDcBonuses: collectRows(spellDcRowsEl),
          generatedEquipment: collectRows(generatedEquipmentRowsEl),
          conditionalVariables: collectRows(conditionalVariableRowsEl),
        };
      },
    };
  }

  // The whole effects-authoring section, top to bottom: an "Effects"
  // accordion item (plain stat bonuses, open by default) followed by
  // the "Extra" item (DR/SR/Class Skills) from mountExtraAccordion --
  // together, everything a class feature, trait, or item's effects
  // panel needs. Every effect-authoring surface in the app mounts this
  // once instead of building its own Effects list plus its own Extra
  // accordion separately.
  //
  // container: filled with both accordion items. If container has no
  // id yet, one is generated from options.idPrefix and used as the
  // shared data-bs-parent so opening one item closes the other --
  // standard accordion behavior. Pass options.accordionParentId
  // instead to join an already-existing accordion (e.g. joining
  // sibling items in a caller's own accordion group) rather than
  // having this pair collapse only against each other.
  //
  // options: { idPrefix (required), accordionParentId?, skills?,
  // effectStats?, titleCaseStat?, onChange?, effectsKey?, onEffectAdded? }
  // -- skills/effectStats/titleCaseStat are forwarded to both the Effects
  // row and Extra's Class Skill row. effectsKey (default "effects") lets a
  // caller with a differently-named bonus list (buff-tracker-widget.js
  // uses "bonuses") reset()/collect() that property instead. onEffectAdded
  // (row element) fires whenever a new Effects row is appended -- whether
  // from the "Create Effect" button or from reset() -- so a caller can
  // apply its own defaults to freshly-created rows.
  //
  // Returns { addEffect, addDr, addSr, addImmunity, addClassSkill,
  // reset(item), collect() }. reset(item) populates each mechanic list;
  // collect() returns { [effectsKey]: [...], damageReduction,
  // spellResistance, immunities, applyConditions, classSkillGrants, ... }.
  function mountEffectsAccordion(container, options = {}) {
    const prefix = options.idPrefix;
    const parentId =
      options.accordionParentId || (container.id ||= `${prefix}Accordion`);
    container.innerHTML = `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${prefix}EffectsPanel" aria-expanded="true" aria-controls="${prefix}EffectsPanel">
            Effects <span id="${prefix}EffectsCount" class="badge text-bg-secondary ms-2"></span>
          </button>
        </h2>
        <div id="${prefix}EffectsPanel" class="accordion-collapse collapse show" data-bs-parent="#${parentId}">
          <div class="accordion-body">
            <div class="d-flex justify-content-end mb-2">
              <button id="${prefix}AddEffect" class="btn btn-outline-info btn-sm" type="button">Create Effect</button>
            </div>
            <div id="${prefix}EffectRows" class="vstack gap-2"></div>
          </div>
        </div>
      </div>
      <div id="${prefix}ExtraMount"></div>
    `;

    const effectRowsEl = document.getElementById(`${prefix}EffectRows`);
    const effectsBadge = document.getElementById(`${prefix}EffectsCount`);

    const updateEffectsCount = () => {
      const count = effectRowsEl.children.length;
      effectsBadge.textContent = count ? String(count) : "";
      effectsBadge.classList.toggle("d-none", !count);
      options.onChange?.();
    };

    const addEffect = (data = {}) => {
      const { element } = createBonusRow(data, {
        onDelete: updateEffectsCount,
        skills: options.skills,
        effectStats: options.effectStats,
        titleCaseStat: options.titleCaseStat,
      });
      effectRowsEl.appendChild(element);
      updateEffectsCount();
      options.onEffectAdded?.(element);
      return element;
    };
    document
      .getElementById(`${prefix}AddEffect`)
      .addEventListener("click", () => addEffect());

    const extra = mountExtraAccordion(
      document.getElementById(`${prefix}ExtraMount`),
      {
        idPrefix: `${prefix}Extra`,
        accordionParentId: parentId,
        skills: options.skills,
        onChange: options.onChange,
      },
    );

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    return {
      addEffect,
      addDr: extra.addDr,
      addSr: extra.addSr,
      addImmunity: extra.addImmunity,
      addApplyCondition: extra.addApplyCondition,
      addClassSkill: extra.addClassSkill,
      addExtraRanksPerLevel: extra.addExtraRanksPerLevel,
      addSizeChange: extra.addSizeChange,
      addSpellLikeAbility: extra.addSpellLikeAbility,
      addCasterLevelBonus: extra.addCasterLevelBonus,
      addSpellDcBonus: extra.addSpellDcBonus,
      addGeneratedEquipment: extra.addGeneratedEquipment,
      addConditionalVariable: extra.addConditionalVariable,
      reset(item = {}) {
        const effectsKey = options.effectsKey || "effects";
        effectRowsEl.innerHTML = "";
        (Array.isArray(item[effectsKey]) ? item[effectsKey] : []).forEach(
          addEffect,
        );
        updateEffectsCount();
        extra.reset(item);
      },
      collect() {
        return {
          [options.effectsKey || "effects"]: collectRows(effectRowsEl),
          ...extra.collect(),
        };
      },
    };
  }

  window.PFEffectEditor = {
    titleCaseStat,
    bonusStatOptionsHtml,
    createBonusRow,
    attributeRequirementText,
    skillStatOptionsHtml,
    namedSkill,
    skillKey,
    createDrRow,
    createSrRow,
    createImmunityRow,
    createApplyConditionRow,
    applyConditionText,
    createConditionalVariableRow,
    createClassSkillRow,
    createExtraRanksPerLevelRow,
    extraRanksPerLevelText,
    createSizeChangeRow,
    createSpellLikeAbilityRow,
    createSpellAdjustmentRow,
    casterLevelBonusText,
    spellDcBonusText,
    createGeneratedEquipmentRow,
    mountExtraAccordion,
    mountEffectsAccordion,
    classSkillGrantText,
    openScaleModal,
    scaleText,
    // Wires an arbitrary "Scale" button + summary element to the shared
    // modal -- not just for DR/SR rows above, any bonus row (a plain
    // stat effect, say) can reuse this instead of hand-rolling the same
    // open/store/re-render dance.
    wireScaleButton,
  };
})();
