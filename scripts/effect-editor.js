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

  function numberStepperMarkup({
    id,
    value = 0,
    min = "",
    max = "",
    step = 1,
    inputAttributes = "",
    label = "value",
  }) {
    const bounds = `${min !== "" ? ` min="${escapeHtml(min)}"` : ""}${max !== "" ? ` max="${escapeHtml(max)}"` : ""}`;
    return `<div class="modal-number-stepper shared-effect-number-stepper">
      <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-effect-number-step="-1" data-effect-number-target="${escapeHtml(id)}" aria-label="Decrease ${escapeHtml(label)}">-</button>
      <input class="form-control form-control-sm text-center" type="number"${bounds} step="${escapeHtml(step)}" value="${escapeHtml(value)}" data-effect-number-input="${escapeHtml(id)}" ${inputAttributes}>
      <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-effect-number-step="1" data-effect-number-target="${escapeHtml(id)}" aria-label="Increase ${escapeHtml(label)}">+</button>
    </div>`;
  }

  function wireNumberSteppers(scope) {
    scope.querySelectorAll("[data-effect-number-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = scope.querySelector(
          `[data-effect-number-input="${button.dataset.effectNumberTarget}"]`,
        );
        if (!input) return;
        if (Number(button.dataset.effectNumberStep) < 0) input.stepDown();
        else input.stepUp();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
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
  const GENERATED_WEAPON_ENCHANTMENTS = [
    "Adaptive", "Allying", "Anarchic", "Anchoring", "Axiomatic", "Bane",
    "Brilliant Energy", "Called", "Conductive", "Corrosive",
    "Corrosive Burst", "Cruel", "Cunning", "Dancing", "Defending",
    "Disruption", "Distance", "Flaming", "Flaming Burst", "Frost",
    "Furious", "Ghost Touch", "Holy", "Icy Burst", "Impact", "Keen",
    "Merciful", "Returning", "Seeking", "Shock", "Shocking Burst", "Speed",
    "Spell Storing", "Throwing", "Thundering", "Unholy", "Vicious",
    "Vorpal", "Wounding",
  ];
  let generatedEquipmentRowId = 0;
  let weaponDamageSizeRowId = 0;
  const GENERATED_WEAPON_TYPES = [
    "Melee Weapon (Light)",
    "Melee Weapon (One-Handed)",
    "Melee Weapon (Two-Handed)",
    "Ranged Weapon",
    "Thrown Weapon",
    "Natural Weapon",
    "Improvised",
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
    { value: "domain", label: "Domain" },
    { value: "school", label: "School" },
    { value: "subschool", label: "School + Subschool" },
    { value: "descriptor", label: "Descriptor" },
    { value: "magicType", label: "Type of Magic" },
    { value: "spell", label: "Specific Spell" },
  ];
  const SPELL_ADJUSTMENT_SOURCE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "strict-spells", label: "Strict Spells (default)" },
    { value: "spell-like-abilities", label: "Spell-Like Abilities" },
    { value: "extracts", label: "Extracts" },
    { value: "draughts", label: "Draughts" },
    { value: "class-abilities", label: "Class Abilities" },
  ];
  const CASTER_LEVEL_APPLY_TO_OPTIONS = [
    { value: "spell", label: "All" },
    { value: "duration", label: "Duration Only" },
    { value: "range", label: "Range Only" },
    { value: "effectScaling", label: "Effect Scaling Only" },
  ];
  let spellAdjustmentRowId = 0;
  let domainOptionsPromise = null;
  let bloodlineOptionsPromise = null;
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
  const SPECIAL_EFFECT_TOGGLES = [
    {
      stat: "extra attack",
      label: "Extra Attack at Highest BAB",
      value: 1,
      type: "untyped",
      stacks: true,
    },
    {
      stat: "remove dex bonus to ac",
      label: "Remove Dex Bonus to AC",
      value: 1,
      type: "condition",
      stacks: false,
    },
    {
      stat: "cannot gain morale bonuses",
      label: "Cannot Gain Morale Bonuses",
      value: 1,
      type: "condition",
      stacks: false,
    },
    {
      stat: "cannot gain luck bonuses",
      label: "Cannot Gain Luck Bonuses",
      value: 1,
      type: "condition",
      stacks: false,
    },
  ];
  const SPECIAL_EFFECT_TOGGLE_STATS = new Set(
    SPECIAL_EFFECT_TOGGLES.map((entry) => entry.stat),
  );

  function normalizedSpecialEffectStat(stat) {
    const key = String(stat || "")
      .toLowerCase()
      .trim();
    const aliases = {
      "extra attack at highest bab": "extra attack",
      "remove dex bonus": "remove dex bonus to ac",
      "cannot gain morale bonus": "cannot gain morale bonuses",
      "cannot gain luck bonus": "cannot gain luck bonuses",
    };
    return aliases[key] || key;
  }

  function isSpecialEffectToggleEffect(effect = {}) {
    return SPECIAL_EFFECT_TOGGLE_STATS.has(normalizedSpecialEffectStat(effect.stat));
  }

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
    const stats = (options.effectStats || EFFECT_STATS).filter(
      (stat) => !SPECIAL_EFFECT_TOGGLE_STATS.has(normalizedSpecialEffectStat(stat)),
    );
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
      ${window.PFEffectStats?.healingOptgroupHtml?.(selected, escapeHtml) || ""}
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

  let weaponNameCatalogPromise;
  function loadWeaponNameCatalog() {
    weaponNameCatalogPromise ||= (window.PFItemData?.loadWeapons?.() ||
      fetch("data/weapons.json").then((response) => response.json()))
      .then((weapons) => (Array.isArray(weapons) ? weapons : [])
        .map((weapon) => String(weapon.name || "").trim())
        .filter(Boolean))
      .catch(() => []);
    return weaponNameCatalogPromise;
  }

  // data: { stat, value, maximum?, type, stacks, conditional, appliesWhen,
  // skillName?, weaponTypeRestriction?, weaponNameRestriction?, bonusScale? }. options: { onDelete, skills, effectStats,
  // titleCaseStat } -- same meaning as bonusStatOptionsHtml's options,
  // plus onDelete (called after the row removes itself).
  function createBonusRow(data = {}, options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const row = document.createElement("div");
    row.className = "shared-bonus-row";
    const selectedStat = namedSkillKindForName(data.skillName) || data.stat || "";
    const appliesWhen = data.appliesWhen || "";
    const conditional = Boolean(appliesWhen.trim()) || Boolean(data.conditional);
    const weaponRestrictions =
      window.PFEffectStats?.WEAPON_RESTRICTION_OPTIONS || [
        { value: "all", label: "All" },
      ];
    const selectedWeaponRestriction =
      window.PFEffectStats?.normalizeWeaponTypeRestriction?.(
        data.weaponTypeRestriction || "all",
      ) || data.weaponTypeRestriction || "all";
    const selectedWeaponName = String(data.weaponNameRestriction || "all").trim() || "all";
    const naturalWeaponNames = window.PFEffectStats?.NATURAL_WEAPON_NAME_OPTIONS || [];
    const initialWeaponNames = [...naturalWeaponNames];
    if (selectedWeaponName.toLowerCase() !== "all" &&
        !initialWeaponNames.some((name) => name.toLowerCase() === selectedWeaponName.toLowerCase()))
      initialWeaponNames.push(selectedWeaponName);
    row.innerHTML = `
      <div>
        <label>Stat</label>
        <select data-effect-field="stat" class="form-select form-select-sm">${bonusStatOptionsHtml(selectedStat, options)}</select>
      </div>
      <div class="shared-named-skill-field d-none">
        <label>Skill Name</label>
        <input data-effect-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
      <div class="shared-weapon-restrictions d-none">
        <div>
          <label>Weapon Type</label>
          <select data-effect-field="weaponTypeRestriction" class="form-select form-select-sm">
            ${weaponRestrictions.map((option) =>
              `<option value="${escapeHtml(option.value)}" ${selectedWeaponRestriction === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
            ).join("")}
          </select>
        </div>
        <div>
          <label>Weapon Name</label>
          <select data-effect-field="weaponNameRestriction" class="form-select form-select-sm">
            <option value="all" ${selectedWeaponName.toLowerCase() === "all" ? "selected" : ""}>All</option>
            ${initialWeaponNames.map((name) => `<option value="${escapeHtml(name)}" ${selectedWeaponName.toLowerCase() === name.toLowerCase() ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
            <option value="__custom__">Custom name...</option>
          </select>
          <input data-effect-field="customWeaponName" class="form-control form-control-sm mt-1 d-none" placeholder="Weapon name">
        </div>
      </div>
      <div class="effect-healing-formula d-none" data-healing-formula>
        <div>
          <label>Number of Dice</label>
          ${numberStepperMarkup({ id: "healing-dice-count", value: Math.max(0, Number(data.diceCount || 0)), min: 0, inputAttributes: 'data-effect-field="diceCount"', label: "number of healing dice" })}
        </div>
        <div>
          <label>Die</label>
          <select class="form-select form-select-sm" data-effect-field="dieType">${damageDieOptions(data.dieType || 6)}</select>
        </div>
        <div>
          <label>Maximum Dice</label>
          ${numberStepperMarkup({ id: "healing-dice-maximum", value: data.diceCountMax ?? "", min: 0, inputAttributes: 'data-effect-field="diceCountMax" placeholder="No maximum"', label: "maximum healing dice" })}
        </div>
        <div data-healing-scale-host="dice">
          <button class="btn btn-outline-info btn-sm" type="button" data-healing-dice-scale>Scale Dice</button>
          <span class="small text-secondary" data-healing-dice-scale-summary></span>
        </div>
      </div>
      <div class="effect-value-field">
        <label data-effect-value-label>Value</label>
        ${numberStepperMarkup({ id: "bonus-value", value: data.value ?? 0, inputAttributes: 'data-effect-field="value"', label: "value" })}
      </div>
      <div class="effect-maximum-field">
        <label data-effect-maximum-label>Maximum</label>
        ${numberStepperMarkup({ id: "bonus-maximum", value: data.maximum ?? data.max ?? "", min: 0, inputAttributes: 'data-effect-field="maximum" placeholder="No maximum"', label: "maximum" })}
      </div>
      <div class="effect-type-field">
        <label>Type</label>
        <select data-effect-field="type" class="form-select form-select-sm">
          ${BONUS_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${(data.type || "untyped") === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </div>
      <div class="effect-stacks-field">
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
      <button class="btn btn-outline-info btn-sm btn-icon" type="button" data-effect-save aria-label="Configure effect save" title="Configure save"><i class="bi bi-shield-check"></i></button>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete effect"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    const statSelect = row.querySelector('[data-effect-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector('[data-effect-field="skillName"]');
    const weaponRestrictionsField = row.querySelector(".shared-weapon-restrictions");
    const weaponTypeSelect = row.querySelector(
      '[data-effect-field="weaponTypeRestriction"]',
    );
    const weaponNameSelect = row.querySelector('[data-effect-field="weaponNameRestriction"]');
    const customWeaponName = row.querySelector('[data-effect-field="customWeaponName"]');
    wireNumberSteppers(row);
    weaponNameSelect.addEventListener("change", () => {
      customWeaponName.classList.toggle("d-none", weaponNameSelect.value !== "__custom__");
    });
    void loadWeaponNameCatalog().then((names) => {
      const seen = new Set([...weaponNameSelect.options].map((option) => option.value.toLowerCase()));
      names.forEach((name) => {
        if (seen.has(name.toLowerCase())) return;
        seen.add(name.toLowerCase());
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        weaponNameSelect.add(option, weaponNameSelect.options.length - 1);
      });
    });
    const syncNamedSkill = () => {
      const named = isNamedSkillKind(statSelect.value);
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder = namedSkillPlaceholder(statSelect.value);
      const weaponRestricted = window.PFEffectStats?.isAttackOrDamageStat
        ? window.PFEffectStats.isAttackOrDamageStat(statSelect.value)
        : /^(?:(?:melee|ranged) )?(?:attack|damage)$/i.test(statSelect.value);
      weaponRestrictionsField.classList.toggle("d-none", !weaponRestricted);
      const healing = window.PFEffectStats?.isHealingStat?.(statSelect.value);
      const instantHealing = String(statSelect.value || "").toLowerCase() === "healing";
      row.classList.toggle("is-instant-healing", instantHealing);
      row.querySelector(".effect-type-field")?.classList.toggle(
        "d-none",
        Boolean(healing),
      );
      row.querySelector(".effect-stacks-field")?.classList.toggle(
        "d-none",
        Boolean(healing),
      );
      row.querySelector(".shared-bonus-condition-inline")?.classList.toggle(
        "d-none",
        Boolean(healing),
      );
      row.querySelector("[data-healing-formula]")?.classList.toggle(
        "d-none",
        !instantHealing,
      );
      const valueLabel = row.querySelector("[data-effect-value-label]");
      if (valueLabel) valueLabel.textContent = instantHealing ? "Static" : "Value";
      const maximumLabel = row.querySelector("[data-effect-maximum-label]");
      if (maximumLabel)
        maximumLabel.textContent = instantHealing ? "Maximum Static" : "Maximum";
      const staticScaleButton = row.querySelector("[data-scale-bonus]");
      if (staticScaleButton)
        staticScaleButton.textContent = instantHealing
          ? "Scale Static"
          : "Bonus Scale";
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
    const healingDiceHost = row.querySelector('[data-healing-scale-host="dice"]');
    wireScaleButton(
      healingDiceHost,
      data.diceCountScale || null,
      healingDiceHost.querySelector("[data-healing-dice-scale-summary]"),
      healingDiceHost.querySelector("[data-healing-dice-scale]"),
    );
    wireConditionalFromAppliesWhen(
      row,
      '[data-effect-field="conditional"]',
      '[data-effect-field="appliesWhen"]',
    );
    let saveMode = data.saveMode || (data.saveConfig?.enabled ? "custom" : "shared");
    let saveConfig = data.saveConfig?.enabled
      ? JSON.parse(JSON.stringify(data.saveConfig))
      : null;
    const saveButton = row.querySelector("[data-effect-save]");
    const syncSaveButton = () => {
      saveButton.classList.toggle("btn-info", saveMode === "custom");
      saveButton.classList.toggle("btn-outline-info", saveMode !== "custom");
      saveButton.classList.toggle("text-secondary", saveMode === "none");
      saveButton.title =
        saveMode === "none"
          ? "No save for this effect"
          : saveMode === "custom"
            ? "This effect uses a custom save"
            : "This effect uses the ability save";
    };
    saveButton.addEventListener("click", async () => {
      const updated = await openSaveConfigEditor(saveConfig, {
        rowMode: saveMode,
      });
      if (!updated) return;
      saveMode = updated.mode;
      saveConfig = updated.config;
      syncSaveButton();
    });
    syncSaveButton();
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
      const healing = window.PFEffectStats?.isHealingStat?.(selected);
      const effect = {
        stat: skillName ? skillKey(skillName) : selected,
        value: Number(
          row.querySelector('[data-effect-field="value"]').value || 0,
        ),
        type: healing
          ? "untyped"
          : row.querySelector('[data-effect-field="type"]').value || "untyped",
        stacks: healing
          ? false
          : row.querySelector('[data-effect-field="stacks"]').checked,
        conditional: healing
          ? false
          : row.querySelector('[data-effect-field="conditional"]').checked ||
            Boolean(appliesWhen),
        appliesWhen: healing ? "" : appliesWhen,
      };
      const maximum = row
        .querySelector('[data-effect-field="maximum"]')
        .value.trim();
      if (maximum !== "" && Number.isFinite(Number(maximum)))
        effect.maximum = Number(maximum);
      if (
        window.PFEffectStats?.isAttackOrDamageStat?.(effect.stat) ||
        /^(?:(?:melee|ranged) )?(?:attack|damage)$/i.test(effect.stat)
      ) {
        effect.weaponTypeRestriction =
          window.PFEffectStats?.normalizeWeaponTypeRestriction?.(
            weaponTypeSelect.value,
          ) || weaponTypeSelect.value || "all";
        effect.weaponNameRestriction = weaponNameSelect.value === "__custom__"
          ? customWeaponName.value.trim() || "all"
          : weaponNameSelect.value || "all";
      }
      if (skillName) effect.skillName = skillName;
      const skillList = customSkillListPayloadForStat(effect.stat);
      if (skillList) effect.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(effect.stat)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(effect.stat);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) effect.choicePool = choicePool;
      }
      if (row._bonusScale) effect.bonusScale = row._bonusScale;
      if (String(effect.stat || "").toLowerCase() === "healing") {
        effect.diceCount = Math.max(
          0,
          Math.floor(
            Number(row.querySelector('[data-effect-field="diceCount"]')?.value) ||
              0,
          ),
        );
        effect.dieType = Math.max(
          2,
          Math.floor(
            Number(row.querySelector('[data-effect-field="dieType"]')?.value) ||
              6,
          ),
        );
        const diceCountMax = row
          .querySelector('[data-effect-field="diceCountMax"]')
          ?.value.trim();
        if (diceCountMax !== "" && Number.isFinite(Number(diceCountMax)))
          effect.diceCountMax = Math.max(0, Math.floor(Number(diceCountMax)));
        if (healingDiceHost._bonusScale)
          effect.diceCountScale = healingDiceHost._bonusScale;
      }
      if (saveMode === "none") effect.saveMode = "none";
      if (saveMode === "custom" && saveConfig?.enabled)
        effect.saveConfig = JSON.parse(JSON.stringify(saveConfig));
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

  function useUntrainedOptionsHtml(selected = "", { skills } = {}) {
    const option = (value, label) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    const customSkillLists = (window.PFEffectStats?.customSkillLists?.() || [])
      .filter((list) =>
        window.PFEffectStats?.customSkillListIsSkillOnly
          ? window.PFEffectStats.customSkillListIsSkillOnly(list)
          : true,
      );
    const poolIds = [
      "skills-trained",
      "skills-class-trained",
      "skills-knowledge",
      "skills-all",
    ];
    return `
      <optgroup label="Skill Groups">
        ${option("trained skill checks", "All Trained-Only Skills")}
        ${option("class trained skill checks", "Class Trained-Only Skills")}
        ${option("knowledge skill checks", "Knowledge Skills")}
        ${option("skill checks", "All Skills")}
        ${customSkillLists
          .map((list) =>
            option(
              window.PFEffectStats.skillListStatValue(list),
              customSkillListDisplayLabel(list),
            ),
          )
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE || "__create-custom-skill-list-stat__", "Create custom skill list...")}
      </optgroup>
      <optgroup label="Choose When Applied">
        ${poolIds
          .map((id) => {
            const pool = window.PFEffectStats?.poolById?.(id);
            return option(`choice:${id}`, `${pool?.label || id} (choose one)`);
          })
          .join("")}
        ${customSkillLists
          .map((list) => {
            const stat = window.PFEffectStats.skillListStatValue(list);
            return option(`choice:${stat}`, `${customSkillListDisplayLabel(list)} (choose one)`);
          })
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE || "__create-custom-skill-list-choice__", "Create custom skill list...")}
      </optgroup>
    `;
  }

  function bonusRanksStatOptionsHtml(selected = "", { skills } = {}) {
    const option = (value, label) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    return `
      <optgroup label="Skill Groups">
        ${SKILL_STATS.filter((stat) => stat !== "class skill checks" && stat !== "class knowledge skill checks")
          .map((stat) => option(stat, titleCaseStat(stat)))
          .join("")}
      </optgroup>
      ${skillStatOptionsHtml(selected, { skills })}
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
  const SCALE_MODAL_STYLE_ID = "sharedBonusScaleModalStyles";
  let scaleModal = null;
  let scaleHideSignal = Promise.resolve();

  function ensureScaleModal() {
    if (document.getElementById(SCALE_MODAL_ID)) return;
    if (!document.getElementById(SCALE_MODAL_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = SCALE_MODAL_STYLE_ID;
      style.textContent = `
        .shared-bonus-scale-modal { z-index: 1105; }
        .shared-bonus-scale-backdrop { z-index: 1100; }
      `;
      document.head.appendChild(style);
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade shared-bonus-scale-modal" id="${SCALE_MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 id="${SCALE_MODAL_ID}Title" class="modal-title">Bonus Scale</h5>
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
                <div class="small text-secondary">Attribute Bonuses</div>
                <button id="${SCALE_MODAL_ID}AddAttribute" class="btn btn-outline-info btn-sm" type="button">Add Attribute Bonus</button>
              </div>
              <div class="mb-2">
                <label for="${SCALE_MODAL_ID}AttributeSource">Attribute Modifier From</label>
                <select id="${SCALE_MODAL_ID}AttributeSource" class="form-select form-select-sm">
                  <option value="caster">Caster at cast / activation</option>
                  <option value="recipient">Recipient</option>
                </select>
              </div>
              <div id="${SCALE_MODAL_ID}AttributeRows" class="vstack gap-2 mb-3"></div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Milestones</div>
                <button id="${SCALE_MODAL_ID}AddMilestone" class="btn btn-outline-info btn-sm" type="button">Add Milestone</button>
              </div>
              <div id="${SCALE_MODAL_ID}Rows" class="vstack gap-2 mb-3"></div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Skill Rank Thresholds</div>
                <button id="${SCALE_MODAL_ID}AddSkillRankThreshold" class="btn btn-outline-info btn-sm" type="button">Add Threshold</button>
              </div>
              <div id="${SCALE_MODAL_ID}SkillRankRows" class="vstack gap-2 mb-3"></div>
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
      .getElementById(SCALE_MODAL_ID)
      .addEventListener("shown.bs.modal", () => {
        const backdrops = [...document.querySelectorAll(".modal-backdrop")];
        backdrops.at(-1)?.classList.add("shared-bonus-scale-backdrop");
      });
    document
      .getElementById(`${SCALE_MODAL_ID}AddAttribute`)
      .addEventListener("click", () => addScaleAttributeRow());
    document
      .getElementById(`${SCALE_MODAL_ID}AddMilestone`)
      .addEventListener("click", () => addScaleMilestoneRow());
    document
      .getElementById(`${SCALE_MODAL_ID}AddSkillRankThreshold`)
      .addEventListener("click", () => addSkillRankThresholdRow());
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

  function addSkillRankThresholdRow(data = {}) {
    const rows = document.getElementById(`${SCALE_MODAL_ID}SkillRankRows`);
    const row = document.createElement("div");
    row.className = "shared-scale-row d-flex gap-2 align-items-end";
    row.innerHTML = `
      <div>
        <label>Skill Ranks</label>
        <input data-skill-rank-threshold-field="ranks" class="form-control form-control-sm" type="number" min="1" value="${data.ranks ?? data.rank ?? ""}">
      </div>
      <div>
        <label>Bonus Value</label>
        <input data-skill-rank-threshold-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? ""}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button">Delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    rows.appendChild(row);
  }

  function addScaleAttributeRow(data = {}) {
    const rows = document.getElementById(`${SCALE_MODAL_ID}AttributeRows`);
    const row = document.createElement("div");
    row.className = "shared-scale-row row g-2 align-items-end";
    const ability = String(data.ability || data.attribute || "CON").toUpperCase();
    row.innerHTML = `
      <div class="col-sm-5">
        <label>Attribute Bonus</label>
        <select data-scale-attribute-field="ability" class="form-select form-select-sm">
          ${[
            ["CASTING", "Casting Modifier"],
            ["STR", "STR"],
            ["DEX", "DEX"],
            ["CON", "CON"],
            ["INT", "INT"],
            ["WIS", "WIS"],
            ["CHA", "CHA"],
          ]
            .map(([value, label]) => `<option value="${value}" ${ability === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="col-sm-3">
        <label>Numerator</label>
        <input data-scale-attribute-field="numerator" class="form-control form-control-sm" type="number" min="1" value="${data.numerator ?? 1}">
      </div>
      <div class="col-sm-3">
        <label>Denominator</label>
        <input data-scale-attribute-field="denominator" class="form-control form-control-sm" type="number" min="1" value="${data.denominator ?? 1}">
      </div>
      <div class="col-sm-1">
        <button class="btn btn-outline-danger btn-sm w-100" type="button" aria-label="Delete attribute bonus"><i class="bi bi-trash"></i></button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    rows.appendChild(row);
  }

  function collectScale() {
    const attributeBonuses = [
      ...document.querySelectorAll(
        `#${SCALE_MODAL_ID}AttributeRows .shared-scale-row`,
      ),
    ].map((row) => ({
      ability:
        row.querySelector('[data-scale-attribute-field="ability"]')?.value ||
        "CON",
      numerator: Math.max(
        1,
        Number(
          row.querySelector('[data-scale-attribute-field="numerator"]')?.value ||
            1,
        ),
      ),
      denominator: Math.max(
        1,
        Number(
          row.querySelector('[data-scale-attribute-field="denominator"]')?.value ||
            1,
        ),
      ),
    }));
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
    const skillRankThresholds = [
      ...document.querySelectorAll(
        `#${SCALE_MODAL_ID}SkillRankRows .shared-scale-row`,
      ),
    ]
      .map((row) => ({
        ranks: Number.parseInt(
          row.querySelector('[data-skill-rank-threshold-field="ranks"]').value,
          10,
        ),
        value: Number(
          row.querySelector('[data-skill-rank-threshold-field="value"]').value,
        ),
      }))
      .filter((threshold) => threshold.ranks > 0 && Number.isFinite(threshold.value))
      .sort((a, b) => a.ranks - b.ranks);
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
    const hasOtherScaling =
      attributeBonuses.length > 0 ||
      milestones.length > 0 ||
      skillRankThresholds.length > 0 ||
      Boolean(every);
    const isDefaultMultiplier =
      multiplierNumerator === 1 && multiplierDenominator === 1;
    const levelMultiplier =
      multiplierNumerator > 0 &&
      multiplierDenominator > 0 &&
      (!hasOtherScaling || !isDefaultMultiplier)
        ? { numerator: multiplierNumerator, denominator: multiplierDenominator }
        : null;
    const minimumOne = document.getElementById(`${SCALE_MODAL_ID}MinOne`).checked;
    if (
      !attributeBonuses.length &&
      !milestones.length &&
      !skillRankThresholds.length &&
      !every &&
      !levelMultiplier &&
      !minimumOne
    )
      return null;
    const sourceSelect = document.getElementById(`${SCALE_MODAL_ID}Source`);
    const source = window.PFEffectMeta?.sourceFromSelect
      ? window.PFEffectMeta.sourceFromSelect(sourceSelect?.value || "caster")
      : { type: sourceSelect?.value || "caster" };
    const attributeSource =
      document.getElementById(`${SCALE_MODAL_ID}AttributeSource`)?.value ===
      "recipient"
        ? "recipient"
        : "caster";
    return {
      source,
      ...(attributeBonuses.length
        ? { attributeBonuses, attributeSource }
        : {}),
      milestones,
      ...(skillRankThresholds.length ? { skillRankThresholds } : {}),
      every,
      ...(levelMultiplier ? { levelMultiplier } : {}),
      ...(minimumOne ? { minimumOne: true } : {}),
    };
  }

  // Resolves to the collected scale object, or null if cleared/cancelled.
  function openScaleModal(existingScale, options = {}) {
    return scaleHideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureScaleModal();
          const scale = existingScale || {};
          document.getElementById(`${SCALE_MODAL_ID}Title`).textContent =
            options.title || "Bonus Scale";
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
          document.getElementById(`${SCALE_MODAL_ID}AttributeSource`).value =
            options.attributeSource ||
            window.PFEffectMechanics?.attributeScaleSource?.(scale) ||
            "caster";
          document.getElementById(`${SCALE_MODAL_ID}AttributeSource`).disabled =
            Boolean(options.attributeSource);
          document.getElementById(`${SCALE_MODAL_ID}AttributeRows`).innerHTML =
            "";
          document.getElementById(`${SCALE_MODAL_ID}Rows`).innerHTML = "";
          document.getElementById(`${SCALE_MODAL_ID}SkillRankRows`).innerHTML =
            "";
          const attributeBonuses = Array.isArray(scale.attributeBonuses)
            ? scale.attributeBonuses
            : scale.attributeBonus
              ? [scale.attributeBonus]
              : [];
          attributeBonuses.forEach((entry) => addScaleAttributeRow(entry));
          const milestones = Array.isArray(scale.milestones)
            ? scale.milestones
            : [];
          if (milestones.length)
            milestones.forEach((milestone) => addScaleMilestoneRow(milestone));
          else addScaleMilestoneRow();
          (Array.isArray(scale.skillRankThresholds)
            ? scale.skillRankThresholds
            : []
          ).forEach((threshold) => addSkillRankThresholdRow(threshold));
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
            settle(options.preserveOnCancel ? existingScale || null : null);
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
      return source.className === "$sourceClass"
        ? "source class level"
        : source.className
          ? `${source.className} level`
          : "class level";
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
    const attributeBonuses = Array.isArray(scale.attributeBonuses)
      ? scale.attributeBonuses
      : scale.attributeBonus
        ? [scale.attributeBonus]
        : [];
    const attributeOwner =
      (window.PFEffectMechanics?.attributeScaleSource?.(scale) || "caster") ===
      "recipient"
        ? "recipient's"
        : "caster's";
    attributeBonuses.forEach((entry) => {
      const ability = String(entry.ability || entry.attribute || "CON").toUpperCase();
      const castingModifier = ability === "CASTING";
      const owner = castingModifier ? "caster's" : attributeOwner;
      const label = castingModifier ? "casting" : ability;
      const numerator = Math.max(1, Number(entry.numerator ?? 1) || 1);
      const denominator = Math.max(1, Number(entry.denominator ?? 1) || 1);
      parts.push(
        numerator === 1 && denominator === 1
          ? `${owner} ${label} modifier`
          : `${owner} ${label} modifier x ${numerator}/${denominator}`,
      );
    });
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
    const skillRankThresholds = Array.isArray(scale.skillRankThresholds)
      ? scale.skillRankThresholds
      : [];
    if (skillRankThresholds.length) {
      parts.push(
        skillRankThresholds
          .map(
            (threshold) =>
              `skill ranks ${threshold.ranks}: ${threshold.value >= 0 ? "+" : ""}${threshold.value}`,
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

  function auraTextureOptions() {
    return window.PFTextureCatalog?.all?.() || [];
  }

  function syncAuraTexturePicker(textureUrl = "") {
    const selected = String(textureUrl || "").trim();
    document
      .querySelectorAll(`#sharedAuraDetailsModalTexturePicker [data-aura-texture-url]`)
      .forEach((button) => {
        const active = button.dataset.auraTextureUrl === selected;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
  }

  const AURA_DETAILS_MODAL_ID = "sharedAuraDetailsModal";
  let auraDetailsModal = null;
  let auraDetailsHideSignal = Promise.resolve();
  let auraDetailsSaveAction = null;
  let auraDetailsScaleAction = null;
  let auraDetailsDurationAction = null;
  let auraDetailsLingerToggleAction = null;

  function ensureAuraDetailsModal() {
    if (document.getElementById(AURA_DETAILS_MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${AURA_DETAILS_MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title">Aura Details</h5>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="${AURA_DETAILS_MODAL_ID}Range" class="form-label">Range (ft.)</label>
                <input id="${AURA_DETAILS_MODAL_ID}Range" class="form-control form-control-sm" type="number" min="5" step="5" value="5">
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
                <button id="${AURA_DETAILS_MODAL_ID}Scale" class="btn btn-outline-info btn-sm" type="button">Range Scaling</button>
                <span id="${AURA_DETAILS_MODAL_ID}ScaleSummary" class="small text-secondary"></span>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-sm-6">
                  <label for="${AURA_DETAILS_MODAL_ID}Volume" class="form-label">3D Volume</label>
                  <select id="${AURA_DETAILS_MODAL_ID}Volume" class="form-select form-select-sm">
                    <option value="sphere">Sphere</option>
                    <option value="cylinder">Cylinder</option>
                  </select>
                </div>
                <div id="${AURA_DETAILS_MODAL_ID}HeightWrap" class="col-sm-6 d-none">
                  <label for="${AURA_DETAILS_MODAL_ID}Height" class="form-label">Height (ft.)</label>
                  <input id="${AURA_DETAILS_MODAL_ID}Height" class="form-control form-control-sm" type="number" min="5" step="5" value="10">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Texture</label>
                <div id="${AURA_DETAILS_MODAL_ID}TexturePicker" class="aura-texture-picker" role="group" aria-label="Aura texture">
                  <button class="aura-texture-option" type="button" data-aura-texture-url="" aria-label="No texture" title="No texture" aria-pressed="false">
                    <i class="bi bi-slash-circle"></i>
                  </button>
                  ${auraTextureOptions()
                    .map(
                      (texture) => `
                        <button class="aura-texture-option" type="button" data-aura-texture-url="${escapeHtml(texture.url)}" aria-label="${escapeHtml(texture.name)}" title="${escapeHtml(texture.name)}" aria-pressed="false">
                          <span style="background-image:url('${escapeHtml(texture.url)}')"></span>
                        </button>`,
                    )
                    .join("")}
                </div>
              </div>
              <div class="mb-3">
                <label for="${AURA_DETAILS_MODAL_ID}TextureUrl" class="form-label">Custom Texture URL</label>
                <input id="${AURA_DETAILS_MODAL_ID}TextureUrl" class="form-control form-control-sm" type="text" placeholder="assets/auras/texture.png">
              </div>
              <div class="form-check form-switch mb-2">
                <input id="${AURA_DETAILS_MODAL_ID}Linger" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}Linger">Effect Persists Outside Aura</label>
              </div>
              <div id="${AURA_DETAILS_MODAL_ID}LingerWrap" class="d-none align-items-center gap-2 flex-wrap mb-3">
                <button id="${AURA_DETAILS_MODAL_ID}LingerDuration" class="btn btn-outline-info btn-sm" type="button">Lingering Duration</button>
                <span id="${AURA_DETAILS_MODAL_ID}LingerSummary" class="small text-secondary"></span>
              </div>
              <div class="form-check form-switch mb-3">
                <input id="${AURA_DETAILS_MODAL_ID}AffectsSource" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}AffectsSource">Affects Source</label>
              </div>
              <div class="form-check form-switch mb-3">
                <input id="${AURA_DETAILS_MODAL_ID}IndependentToken" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}IndependentToken">Independent Map Token</label>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-sm-6">
                  <div class="form-check form-switch mb-0">
                    <input id="${AURA_DETAILS_MODAL_ID}Light" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}Light">Light</label>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="form-check form-switch mb-0">
                    <input id="${AURA_DETAILS_MODAL_ID}SpecialVision" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}SpecialVision">Special Vision</label>
                  </div>
                </div>
              </div>
              <div id="${AURA_DETAILS_MODAL_ID}TargetsEmitWrap" class="form-check form-switch mb-0">
                <input id="${AURA_DETAILS_MODAL_ID}TargetsEmit" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${AURA_DETAILS_MODAL_ID}TargetsEmit">Targets Emit Aura</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="${AURA_DETAILS_MODAL_ID}Save" type="button" class="btn btn-primary btn-sm">Save Aura Details</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(`${AURA_DETAILS_MODAL_ID}Scale`)
      .addEventListener("click", () => auraDetailsScaleAction?.());
    document
      .getElementById(`${AURA_DETAILS_MODAL_ID}LingerDuration`)
      .addEventListener("click", () => auraDetailsDurationAction?.());
    document
      .getElementById(`${AURA_DETAILS_MODAL_ID}Linger`)
      .addEventListener("change", () => auraDetailsLingerToggleAction?.());
    document
      .getElementById(`${AURA_DETAILS_MODAL_ID}Save`)
      .addEventListener("click", () => auraDetailsSaveAction?.());
    const textureInput = document.getElementById(
      `${AURA_DETAILS_MODAL_ID}TextureUrl`,
    );
    document
      .getElementById(`${AURA_DETAILS_MODAL_ID}TexturePicker`)
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-aura-texture-url]");
        if (!button) return;
        textureInput.value = button.dataset.auraTextureUrl || "";
        syncAuraTexturePicker(textureInput.value);
      });
    textureInput.addEventListener("input", () =>
      syncAuraTexturePicker(textureInput.value),
    );
    const light = document.getElementById(`${AURA_DETAILS_MODAL_ID}Light`);
    const specialVision = document.getElementById(
      `${AURA_DETAILS_MODAL_ID}SpecialVision`,
    );
    light.addEventListener("change", () => {
      if (light.checked) specialVision.checked = false;
    });
    specialVision.addEventListener("change", () => {
      if (specialVision.checked) light.checked = false;
    });
    const volume = document.getElementById(`${AURA_DETAILS_MODAL_ID}Volume`);
    volume.addEventListener("change", () => {
      document
        .getElementById(`${AURA_DETAILS_MODAL_ID}HeightWrap`)
        .classList.toggle("d-none", volume.value !== "cylinder");
    });
  }

  function openAuraDetailsModal(existingConfig = {}, { allowTargetsEmit = false } = {}) {
    return auraDetailsHideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureAuraDetailsModal();
          const modalEl = document.getElementById(AURA_DETAILS_MODAL_ID);
          const rangeInput = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}Range`,
          );
          const textureUrl = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}TextureUrl`,
          );
          const volume = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}Volume`,
          );
          const heightWrap = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}HeightWrap`,
          );
          const heightInput = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}Height`,
          );
          const affectsSource = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}AffectsSource`,
          );
          const independentToken = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}IndependentToken`,
          );
          const light = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}Light`,
          );
          const specialVision = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}SpecialVision`,
          );
          const targetsEmit = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}TargetsEmit`,
          );
          const targetsEmitWrap = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}TargetsEmitWrap`,
          );
          const scaleSummary = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}ScaleSummary`,
          );
          const linger = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}Linger`,
          );
          const lingerWrap = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}LingerWrap`,
          );
          const lingerSummary = document.getElementById(
            `${AURA_DETAILS_MODAL_ID}LingerSummary`,
          );
          rangeInput.value = Math.max(5, Number(existingConfig.rangeFeet || 5));
          volume.value = existingConfig.volumeShape === "cylinder"
            ? "cylinder"
            : "sphere";
          heightInput.value = Math.max(
            5,
            Number(existingConfig.heightFeet || Number(rangeInput.value) * 2),
          );
          heightWrap.classList.toggle("d-none", volume.value !== "cylinder");
          textureUrl.value = String(existingConfig.textureUrl || "");
          syncAuraTexturePicker(textureUrl.value);
          affectsSource.checked = Boolean(existingConfig.affectsSource);
          independentToken.checked = Boolean(existingConfig.independentToken);
          light.checked = existingConfig.revealMode === "light";
          specialVision.checked = existingConfig.revealMode === "specialVision";
          targetsEmit.checked = Boolean(
            allowTargetsEmit && existingConfig.targetsEmitAura,
          );
          targetsEmitWrap.classList.toggle("d-none", !allowTargetsEmit);
          let rangeScale = existingConfig.rangeScale || null;
          let lingerDurationConfig = existingConfig.lingerDurationConfig || {
            diceCount: 0,
            dieType: 6,
            staticValue: 1,
            unit: "round",
            factors: [],
            factorMode: "multiply",
          };
          linger.checked = Boolean(existingConfig.lingerDurationConfig);
          let settled = false;
          let internalTransition = false;
          let scaling = false;
          const updateScaleSummary = () => {
            const text = scaleText(rangeScale);
            scaleSummary.textContent = text ? `Scales: ${text}` : "No scaling";
          };
          const updateLingerUi = () => {
            lingerWrap.classList.toggle("d-none", !linger.checked);
            lingerWrap.classList.toggle("d-flex", linger.checked);
            lingerSummary.textContent = window.PFEffectMeta?.durationLabel
              ? window.PFEffectMeta.durationLabel(lingerDurationConfig)
              : "Configured";
          };
          updateScaleSummary();
          updateLingerUi();

          auraDetailsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
          let resolveHideSignal;
          auraDetailsHideSignal = new Promise((res) => {
            resolveHideSignal = res;
          });
          const settle = (value) => {
            if (settled) return;
            settled = true;
            auraDetailsSaveAction = null;
            auraDetailsScaleAction = null;
            auraDetailsDurationAction = null;
            auraDetailsLingerToggleAction = null;
            resolve(value);
          };
          const onHidden = () => {
            if (internalTransition) return;
            settle(null);
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            resolveHideSignal();
          };
          modalEl.addEventListener("hidden.bs.modal", onHidden);

          auraDetailsSaveAction = () => {
            settle({
              enabled: true,
              rangeFeet: Math.max(5, Number(rangeInput.value || 5)),
              volumeShape: volume.value === "cylinder" ? "cylinder" : "sphere",
              ...(volume.value === "cylinder"
                ? { heightFeet: Math.max(5, Number(heightInput.value || 5)) }
                : {}),
              ...(rangeScale ? { rangeScale } : {}),
              ...(textureUrl.value.trim()
                ? { textureUrl: textureUrl.value.trim() }
                : {}),
              ...(linger.checked ? { lingerDurationConfig } : {}),
              affectsSource: affectsSource.checked,
              independentToken: independentToken.checked,
              ...(light.checked
                ? { revealMode: "light" }
                : specialVision.checked
                  ? { revealMode: "specialVision" }
                  : {}),
              targetsEmitAura: Boolean(allowTargetsEmit && targetsEmit.checked),
            });
            auraDetailsModal.hide();
          };
          auraDetailsLingerToggleAction = updateLingerUi;
          auraDetailsDurationAction = async () => {
            if (scaling || settled || !window.PFEffectDurationEditor) return;
            scaling = true;
            internalTransition = true;
            const hidden = new Promise((res) =>
              modalEl.addEventListener("hidden.bs.modal", res, { once: true }),
            );
            auraDetailsModal.hide();
            await hidden;
            const durationEditor = new window.PFEffectDurationEditor(
              `${AURA_DETAILS_MODAL_ID}Linger`,
            );
            const durationHidden = new Promise((res) =>
              durationEditor.modal.addEventListener("hidden.bs.modal", res, {
                once: true,
              }),
            );
            durationEditor.open(lingerDurationConfig, (config) => {
              lingerDurationConfig = config;
              updateLingerUi();
            });
            await durationHidden;
            internalTransition = false;
            scaling = false;
            if (!settled) auraDetailsModal.show();
          };
          auraDetailsScaleAction = async () => {
            if (scaling || settled) return;
            scaling = true;
            internalTransition = true;
            const hidden = new Promise((res) =>
              modalEl.addEventListener("hidden.bs.modal", res, { once: true }),
            );
            auraDetailsModal.hide();
            await hidden;
            internalTransition = false;
            rangeScale = await openScaleModal(rangeScale, {
              title: "Aura Range Scale",
              attributeSource: "caster",
              preserveOnCancel: true,
            });
            await scaleHideSignal;
            updateScaleSummary();
            scaling = false;
            if (!settled) auraDetailsModal.show();
          };
          auraDetailsModal.show();
        }),
    );
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
    row._setBonusScale = (scale) => {
      row._bonusScale = scale || null;
      updateSummary();
    };
    if (scaleBtn._effectScaleClickHandler) {
      scaleBtn.removeEventListener("click", scaleBtn._effectScaleClickHandler);
    }
    scaleBtn._effectScaleClickHandler = async () => {
      const result = await openScaleModal(row._bonusScale);
      row._bonusScale = result;
      updateSummary();
    };
    scaleBtn.addEventListener("click", scaleBtn._effectScaleClickHandler);
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
    const appliesWhen = data.appliesWhen || "";
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
    const appliesWhen = data.appliesWhen || "";
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

  function createUseUntrainedRow(data = {}, { onDelete, skills } = {}) {
    const row = document.createElement("div");
    row.className = "shared-use-untrained-row";
    row.innerHTML = `
      <div>
        <label>Skills</label>
        <select data-use-untrained-field="stat" class="form-select form-select-sm">
          ${useUntrainedOptionsHtml(String(data.stat || "trained skill checks"), { skills })}
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete use untrained rule"><i class="bi bi-trash"></i></button>
    `;
    const statSelect = row.querySelector('[data-use-untrained-field="stat"]');
    wireCustomSkillListSelect(statSelect, {
      skills,
      renderOptions: (selected) =>
        useUntrainedOptionsHtml(selected, { skills }),
    });
    row
      .querySelector('button[aria-label="Delete use untrained rule"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const stat = statSelect.value;
      if (!stat) return null;
      const entry = { stat };
      const skillList = customSkillListPayloadForStat(stat);
      if (skillList) entry.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(stat)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(stat);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) entry.choicePool = choicePool;
      }
      return entry;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function useUntrainedText(entry = {}) {
    const labels = {
      "trained skill checks": "All trained-only skills",
      "class trained skill checks": "Class trained-only skills",
      "knowledge skill checks": "Knowledge skills",
      "skill checks": "All skills",
    };
    const stat = String(entry.stat || "");
    const label =
      labels[stat] ||
      window.PFEffectStats?.skillLabelForStatKey?.(stat) ||
      window.PFEffectStats?.choiceStatLabel?.(stat) ||
      titleCaseStat(stat || "Skills");
    return `Use untrained: ${label}`;
  }

  function createBonusRanksRow(data = {}, { onDelete, skills } = {}) {
    const row = document.createElement("div");
    row.className = "shared-bonus-ranks-row";
    const rawStat = String(data.stat || "skill checks");
    const selectedStat = namedSkillKindForName(data.skillName) || rawStat;
    row.innerHTML = `
      <div>
        <label>Skill or Group</label>
        <select data-bonus-ranks-field="stat" class="form-select form-select-sm">
          ${bonusRanksStatOptionsHtml(selectedStat, { skills })}
        </select>
      </div>
      <div>
        <label>Ranks</label>
        <input data-bonus-ranks-field="value" class="form-control form-control-sm" type="number" min="1" step="1" value="${Math.max(1, Number(data.value ?? data.amount ?? data.ranks ?? 1) || 1)}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete bonus ranks"><i class="bi bi-trash"></i></button>
      <div class="shared-named-skill-field d-none">
        <label>Skill Name</label>
        <input data-bonus-ranks-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
    `;
    const statSelect = row.querySelector('[data-bonus-ranks-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector('[data-bonus-ranks-field="skillName"]');
    const syncNamedSkill = () => {
      const named = isNamedSkillKind(statSelect.value);
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder = namedSkillPlaceholder(statSelect.value);
    };
    wireCustomSkillListSelect(statSelect, {
      skills,
      renderOptions: (selected) => bonusRanksStatOptionsHtml(selected, { skills }),
      sync: syncNamedSkill,
    });
    syncNamedSkill();
    row.querySelector('button[aria-label="Delete bonus ranks"]').addEventListener("click", () => {
      row.remove();
      onDelete?.();
    });
    const collect = () => {
      const selected = statSelect.value;
      const value = Math.max(0, Math.floor(Number(row.querySelector('[data-bonus-ranks-field="value"]').value || 0)));
      if (!selected || value < 1) return null;
      if (isNamedSkillKind(selected)) {
        const name = namedSkill(selected, skillNameInput.value);
        return name ? { stat: skillKey(name), skillName: name, value } : null;
      }
      const grant = { stat: selected, value };
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

  function bonusRanksText(entry = {}) {
    const value = Math.max(0, Math.floor(Number(entry.value ?? entry.amount ?? entry.ranks ?? 0) || 0));
    const label =
      window.PFEffectStats?.skillLabelForStatKey?.(entry.stat) ||
      titleCaseStat(entry.skillName || entry.stat || "Skills");
    return `${label}: +${value} bonus rank${value === 1 ? "" : "s"}`;
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

  const FEAT_GRANT_TYPES = [
    "General",
    "Combat",
    "Metamagic",
    "Item Creation",
    "Teamwork",
    "Critical",
    "Style",
    "Grit",
    "Racial",
    "Performance",
    "Companion / Familiar",
  ];

  function featGrantMode(data = {}) {
    const mode = String(data.mode || data.type || "").toLowerCase();
    if (["static", "category", "custom"].includes(mode)) return mode;
    if (data.featPoolId || data.customPoolId) return "custom";
    if (data.featType || data.category) return "category";
    return "static";
  }

  function featGrantText(entry = {}) {
    const label = entry.label || "Bonus Feat";
    const mode = featGrantMode(entry);
    if (mode === "custom") {
      const list =
        window.PFEffectStats?.customFeatListById?.(
          entry.featPoolId || entry.customPoolId,
        ) || entry.featPool;
      return `${label}: choose from ${list?.name || "custom feat pool"}`;
    }
    if (mode === "category") {
      return `${label}: choose ${entry.featType || entry.category || "General"} feat`;
    }
    return `${label}: ${entry.featName || entry.name || entry.featId || "Feat"}`;
  }

  function featGrantTypeOptions(selected = "") {
    const selectedText = String(selected || "General");
    const types = [...FEAT_GRANT_TYPES];
    if (selectedText && !types.some((type) => type === selectedText))
      types.push(selectedText);
    return types
      .map(
        (type) =>
          `<option value="${escapeHtml(type)}" ${type === selectedText ? "selected" : ""}>${escapeHtml(type)}</option>`,
      )
      .join("");
  }

  function featGrantCustomPoolOptions(selected = "") {
    const lists = window.PFEffectStats?.customFeatLists?.() || [];
    return [
      `<option value="">Choose custom pool</option>`,
      ...lists.map(
        (list) =>
          `<option value="${escapeHtml(list.id)}" ${list.id === selected ? "selected" : ""}>${escapeHtml(list.name)}</option>`,
      ),
    ].join("");
  }

  function createFeatGrantRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-feat-grant-row";
    const mode = featGrantMode(data);
    const staticName = data.featName || data.name || data.featId || "";
    const poolId = data.featPoolId || data.customPoolId || "";
    row.innerHTML = `
      <div>
        <label>Label</label>
        <input data-feat-grant-field="label" class="form-control form-control-sm" value="${escapeHtml(data.label || "Bonus Feat")}">
      </div>
      <div>
        <label>Choice</label>
        <select data-feat-grant-field="mode" class="form-select form-select-sm">
          <option value="static" ${mode === "static" ? "selected" : ""}>Static Feat</option>
          <option value="category" ${mode === "category" ? "selected" : ""}>Type Pool</option>
          <option value="custom" ${mode === "custom" ? "selected" : ""}>Custom Pool</option>
        </select>
      </div>
      <div data-feat-grant-mode-field="static">
        <label>Feat</label>
        <input data-feat-grant-field="featName" class="form-control form-control-sm" value="${escapeHtml(staticName)}" placeholder="Skill Focus">
      </div>
      <div data-feat-grant-mode-field="category">
        <label>Feat Type</label>
        <select data-feat-grant-field="featType" class="form-select form-select-sm">
          ${featGrantTypeOptions(data.featType || data.category || "General")}
        </select>
      </div>
      <div data-feat-grant-mode-field="custom">
        <label>Custom Pool</label>
        <select data-feat-grant-field="featPoolId" class="form-select form-select-sm">
          ${featGrantCustomPoolOptions(poolId)}
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete feat grant"><i class="bi bi-trash"></i></button>
    `;
    const syncMode = () => {
      const current = row.querySelector('[data-feat-grant-field="mode"]').value;
      row.querySelectorAll("[data-feat-grant-mode-field]").forEach((field) => {
        field.classList.toggle(
          "d-none",
          field.dataset.featGrantModeField !== current,
        );
      });
    };
    row
      .querySelector('[data-feat-grant-field="mode"]')
      .addEventListener("change", syncMode);
    row
      .querySelector('button[aria-label="Delete feat grant"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const label =
        row.querySelector('[data-feat-grant-field="label"]').value.trim() ||
        "Bonus Feat";
      const currentMode = row.querySelector('[data-feat-grant-field="mode"]').value;
      const payload = { label, mode: currentMode };
      if (currentMode === "category") {
        payload.featType =
          row.querySelector('[data-feat-grant-field="featType"]').value ||
          "General";
        return payload;
      }
      if (currentMode === "custom") {
        const id = row
          .querySelector('[data-feat-grant-field="featPoolId"]')
          .value.trim();
        if (!id) return null;
        payload.featPoolId = id;
        const list = window.PFEffectStats?.customFeatListById?.(id);
        if (list) payload.featPool = list;
        return payload;
      }
      const featName = row
        .querySelector('[data-feat-grant-field="featName"]')
        .value.trim();
      if (!featName) return null;
      payload.featName = featName;
      return payload;
    };
    row._collect = collect;
    syncMode();
    return { element: row, collect };
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

  function createWeaponDamageSizeChangeRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-weapon-damage-size-row";
    const rowId = ++weaponDamageSizeRowId;
    const matchBy = data.matchBy === "type" ? "type" : "name";
    const weaponName = String(data.weaponName || "").trim();
    const weaponType =
      window.PFEffectStats?.normalizeWeaponTypeRestriction?.(
        data.weaponType || "melee-one-handed",
      ) || data.weaponType || "melee-one-handed";
    const sizeSteps = Number(data.sizeSteps) < 0 ? -1 : 1;
    const weaponTypes = (
      window.PFEffectStats?.WEAPON_RESTRICTION_OPTIONS || []
    ).filter((option) => option.value !== "all");
    row.innerHTML = `
      <div>
        <label>Match Weapon By</label>
        <select data-weapon-damage-size-field="matchBy" class="form-select form-select-sm">
          <option value="name" ${matchBy === "name" ? "selected" : ""}>Name</option>
          <option value="type" ${matchBy === "type" ? "selected" : ""}>Type</option>
        </select>
      </div>
      <div data-weapon-damage-size-name>
        <label>Weapon Name</label>
        <input data-weapon-damage-size-field="weaponName" class="form-control form-control-sm" list="weaponDamageSizeNames${rowId}" value="${escapeHtml(weaponName)}" placeholder="Dagger">
        <datalist id="weaponDamageSizeNames${rowId}"></datalist>
      </div>
      <div data-weapon-damage-size-type>
        <label>Weapon Type</label>
        <select data-weapon-damage-size-field="weaponType" class="form-select form-select-sm">
          ${weaponTypes
            .map(
              (option) =>
                `<option value="${escapeHtml(option.value)}" ${weaponType === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
            )
            .join("")}
        </select>
      </div>
      <div>
        <label>Damage Die Size</label>
        <select data-weapon-damage-size-field="sizeSteps" class="form-select form-select-sm">
          <option value="1" ${sizeSteps > 0 ? "selected" : ""}>One size larger</option>
          <option value="-1" ${sizeSteps < 0 ? "selected" : ""}>One size smaller</option>
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm btn-icon" type="button" aria-label="Delete weapon damage size change"><i class="bi bi-trash"></i></button>
    `;
    const matchSelect = row.querySelector(
      '[data-weapon-damage-size-field="matchBy"]',
    );
    const nameWrap = row.querySelector("[data-weapon-damage-size-name]");
    const typeWrap = row.querySelector("[data-weapon-damage-size-type]");
    const syncMatch = () => {
      const byName = matchSelect.value === "name";
      nameWrap.classList.toggle("d-none", !byName);
      typeWrap.classList.toggle("d-none", byName);
    };
    matchSelect.addEventListener("change", syncMatch);
    syncMatch();
    void loadWeaponNameCatalog().then((names) => {
      const datalist = row.querySelector(`#weaponDamageSizeNames${rowId}`);
      if (!datalist) return;
      datalist.innerHTML = names
        .map((name) => `<option value="${escapeHtml(name)}"></option>`)
        .join("");
    });
    row
      .querySelector('button[aria-label="Delete weapon damage size change"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const selectedMatch = matchSelect.value === "type" ? "type" : "name";
      const selectedName = row
        .querySelector('[data-weapon-damage-size-field="weaponName"]')
        .value.trim();
      const selectedType = row.querySelector(
        '[data-weapon-damage-size-field="weaponType"]',
      ).value;
      if (selectedMatch === "name" && !selectedName) return null;
      return {
        matchBy: selectedMatch,
        ...(selectedMatch === "name"
          ? { weaponName: selectedName }
          : { weaponType: selectedType }),
        sizeSteps: Number(
          row.querySelector('[data-weapon-damage-size-field="sizeSteps"]')
            .value,
        ),
      };
    };
    row._collect = collect;
    return { element: row, collect };
  }

  function weaponDamageSizeChangeText(entry = {}) {
    const direction = Number(entry.sizeSteps) < 0 ? "smaller" : "larger";
    const target =
      entry.matchBy === "type"
        ? window.PFEffectStats?.weaponTypeRestrictionLabel?.(
            entry.weaponType,
          ) || entry.weaponType
        : entry.weaponName;
    return `${target || "Weapon"}: damage as one size ${direction}`;
  }

  function createSpecialEffectToggleRow(config, data = {}, { onChange } = {}) {
    const row = document.createElement("div");
    row.className = "shared-special-toggle-row";
    row.dataset.specialEffectStat = config.stat;
    const value = Number(data.value ?? config.value ?? 1) || 1;
    const appliesWhen = String(data.appliesWhen || "").trim();
    const enabled = isSpecialEffectToggleEffect(data) || Boolean(data.enabled);
    row.innerHTML = `
      <div class="small text-secondary shared-special-toggle-name">${escapeHtml(config.label)}</div>
      <div class="shared-special-toggle-controls">
        <label class="form-check form-switch shared-special-toggle-check" title="Enable ${escapeHtml(config.label)}">
          <input data-special-toggle-field="enabled" class="form-check-input" type="checkbox" ${enabled ? "checked" : ""}>
          <span class="visually-hidden">Enable ${escapeHtml(config.label)}</span>
        </label>
        <input data-special-toggle-field="value" type="hidden" value="${value}">
        <button class="btn btn-outline-secondary btn-sm btn-icon" type="button" data-special-toggle-condition-toggle title="Condition" aria-label="Condition"><i class="bi bi-funnel"></i></button>
      </div>
      <div class="shared-special-toggle-condition ${appliesWhen ? "" : "d-none"}">
        <label>Applies When</label>
        <input data-special-toggle-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="optional condition">
      </div>
    `;
    const enabledInput = row.querySelector(
      '[data-special-toggle-field="enabled"]',
    );
    const valueInput = row.querySelector('[data-special-toggle-field="value"]');
    const appliesWhenInput = row.querySelector(
      '[data-special-toggle-field="appliesWhen"]',
    );
    const conditionWrap = row.querySelector(".shared-special-toggle-condition");
    row
      .querySelector("[data-special-toggle-condition-toggle]")
      ?.addEventListener("click", () => {
        conditionWrap?.classList.toggle("d-none");
        if (!conditionWrap?.classList.contains("d-none")) {
          appliesWhenInput?.focus();
        }
      });
    [enabledInput, valueInput, appliesWhenInput].forEach((input) =>
      input?.addEventListener("input", () => onChange?.()),
    );
    enabledInput?.addEventListener("change", () => onChange?.());
    const collect = () => {
      if (!enabledInput?.checked) return null;
      const appliesWhen = appliesWhenInput?.value.trim() || "";
      return {
        stat: config.stat,
        value: Math.max(1, Number(valueInput?.value || config.value || 1)),
        type: data.type || config.type,
        stacks: data.stacks ?? config.stacks,
        conditional: Boolean(appliesWhen),
        appliesWhen,
      };
    };
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
      adjustableCondition:
        condition.adjustableCondition &&
        typeof condition.adjustableCondition === "object"
          ? condition.adjustableCondition
          : null,
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
      useUntrained: Array.isArray(condition.useUntrained)
        ? condition.useUntrained
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
    if (window.PFConditionConfig?.isAdjustmentEntry?.(entry)) {
      const adjustment = window.PFConditionConfig.normalizeAdjustment(entry);
      const formula = `${adjustment.diceCount ? `${adjustment.diceCount}d${adjustment.dieType}` : ""}${adjustment.staticValue ? `${adjustment.diceCount ? " + " : ""}${adjustment.staticValue}` : ""}` || "0";
      const diceScale = scaleText(adjustment.diceCountScale);
      const staticScale = scaleText(adjustment.staticValueScale);
      return `${adjustment.mode === "heal" ? "Heals" : "Applies"} ${applyConditionName(entry) || "Condition"}: ${formula}${diceScale ? `; dice ${diceScale}` : ""}${staticScale ? `; static ${staticScale}` : ""}`;
    }
    return `Applies condition: ${applyConditionName(entry) || "Condition"}`;
  }

  function createApplyConditionRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-apply-condition-row";
    const selectedId = data.conditionId || data.id || data.condition?.id || "";
    const selectedName = applyConditionName(data);
    const initialAdjustment =
      window.PFConditionConfig?.normalizeAdjustment?.(data) || {
        mode: "apply",
        ability: "strength",
        staticValue: 0,
        diceCount: 0,
        dieType: 6,
      };
    const abilityOptions = (window.PFConditionConfig?.ABILITIES || [])
      .map(
        ([value, label]) =>
          `<option value="${escapeHtml(value)}" ${value === initialAdjustment.ability ? "selected" : ""}>${escapeHtml(label)}</option>`,
      )
      .join("");
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
      <div class="shared-condition-adjustment d-none" data-condition-adjustment>
        <div>
          <label>Operation</label>
          <select class="form-select form-select-sm" data-condition-adjustment-field="mode">
            <option value="apply" ${initialAdjustment.mode === "apply" ? "selected" : ""}>Apply</option>
            <option value="heal" ${initialAdjustment.mode === "heal" ? "selected" : ""}>Heal</option>
          </select>
        </div>
        <div data-condition-ability-wrap>
          <label>Ability</label>
          <select class="form-select form-select-sm" data-condition-adjustment-field="ability">${abilityOptions}</select>
        </div>
        <div>
          <label>Number of Dice</label>
          ${numberStepperMarkup({ id: "condition-dice", value: initialAdjustment.diceCount, min: 0, inputAttributes: 'data-condition-adjustment-field="diceCount"', label: "number of dice" })}
        </div>
        <div>
          <label>Die</label>
          <select class="form-select form-select-sm" data-condition-adjustment-field="dieType">${damageDieOptions(initialAdjustment.dieType)}</select>
        </div>
        <div>
          <label>Maximum Dice</label>
          ${numberStepperMarkup({ id: "condition-dice-maximum", value: initialAdjustment.diceCountMax ?? "", min: 0, inputAttributes: 'data-condition-adjustment-field="diceCountMax" placeholder="No maximum"', label: "maximum condition dice" })}
        </div>
        <div data-condition-scale-host="dice">
          <button class="btn btn-outline-info btn-sm" type="button" data-condition-scale-button>Scale Dice</button>
          <span class="small text-secondary" data-condition-scale-summary></span>
        </div>
        <div class="shared-condition-static-field">
          <label>Static</label>
          ${numberStepperMarkup({ id: "condition-static", value: initialAdjustment.staticValue, min: 0, inputAttributes: 'data-condition-adjustment-field="staticValue"', label: "static value" })}
        </div>
        <div>
          <label>Maximum Static</label>
          ${numberStepperMarkup({ id: "condition-static-maximum", value: initialAdjustment.staticValueMax ?? "", min: 0, inputAttributes: 'data-condition-adjustment-field="staticValueMax" placeholder="No maximum"', label: "maximum condition static value" })}
        </div>
        <div data-condition-scale-host="static">
          <button class="btn btn-outline-info btn-sm" type="button" data-condition-scale-button>Scale Static</button>
          <span class="small text-secondary" data-condition-scale-summary></span>
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete applied condition"><i class="bi bi-trash"></i></button>
    `;
    const select = row.querySelector('[data-apply-condition-field="condition"]');
    const adjustmentWrap = row.querySelector("[data-condition-adjustment]");
    wireNumberSteppers(row);
    const conditionDiceScaleHost = row.querySelector(
      '[data-condition-scale-host="dice"]',
    );
    const conditionStaticScaleHost = row.querySelector(
      '[data-condition-scale-host="static"]',
    );
    [
      [conditionDiceScaleHost, initialAdjustment.diceCountScale],
      [conditionStaticScaleHost, initialAdjustment.staticValueScale],
    ].forEach(([host, scale]) =>
      wireScaleButton(
        host,
        scale || null,
        host.querySelector("[data-condition-scale-summary]"),
        host.querySelector("[data-condition-scale-button]"),
      ),
    );
    const syncAdjustment = () => {
      const configurable = window.PFConditionConfig?.isConfigurable?.(
        row._condition || {},
      );
      adjustmentWrap.classList.toggle("d-none", !configurable);
      row
        .querySelector("[data-condition-ability-wrap]")
        ?.classList.toggle(
          "d-none",
          !window.PFConditionConfig?.needsAbility?.(row._condition || {}),
        );
    };
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
        syncAdjustment();
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
      syncAdjustment();
    });
    syncAdjustment();
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
      const result = {
        conditionId: condition?.id || value || "",
        name,
        condition: compactConditionPayload(condition || data.condition || data),
      };
      if (window.PFConditionConfig?.isConfigurable?.(condition || {})) {
        const field = (name) =>
          row.querySelector(`[data-condition-adjustment-field="${name}"]`);
        const optionalMaximum = (name) => {
          const value = field(name)?.value.trim();
          return value !== "" && Number.isFinite(Number(value))
            ? Math.max(0, Math.floor(Number(value)))
            : null;
        };
        result.conditionAdjustment = {
          mode: field("mode").value === "heal" ? "heal" : "apply",
          ability: field("ability")?.value || "",
          staticValue: Math.max(0, Math.floor(Number(field("staticValue").value) || 0)),
          diceCount: Math.max(0, Math.floor(Number(field("diceCount").value) || 0)),
          dieType: Math.max(2, Math.floor(Number(field("dieType").value) || 6)),
          diceCountMax: optionalMaximum("diceCountMax"),
          staticValueMax: optionalMaximum("staticValueMax"),
          diceCountScale: conditionDiceScaleHost._bonusScale || null,
          staticValueScale: conditionStaticScaleHost._bonusScale || null,
        };
      }
      return result;
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

  function createWeaponExtraDamageRow(data = {}, { onDelete } = {}) {
    const element = document.createElement("div");
    element.className = "shared-effect-weapon-damage";
    element.innerHTML = `
      <div class="small text-secondary mb-2">
        The recipient chooses one equipped weapon when this effect is applied.
      </div>
      <div data-effect-weapon-damage-editor></div>
    `;
    const editor = element.querySelector("[data-effect-weapon-damage-editor]");
    window.PFWeaponDamage?.mount(editor, [data], { addButton: false });
    editor.addEventListener(
      "click",
      (event) => {
        if (!event.target.closest("[data-remove-extra-damage]")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        element.remove();
        onDelete?.();
      },
      { capture: true },
    );
    element._collect = () => {
      const damage = window.PFWeaponDamage?.collect(editor)?.[0];
      if (!damage) return null;
      return {
        ...damage,
        stat: data.stat || "choice:equipped-weapons",
        ...(data.equipmentTarget
          ? { equipmentTarget: { ...data.equipmentTarget } }
          : {}),
        ...(data.selectedChoiceLabel
          ? { selectedChoiceLabel: data.selectedChoiceLabel }
          : {}),
      };
    };
    return { element, collect: element._collect };
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

  let spellClassOptionsPromise = null;
  function loadSpellClassOptions() {
    spellClassOptionsPromise ||= (
      window.PFClassData?.loadIndex?.() ||
      fetch("./data/classes/index.json", { cache: "no-cache" })
        .then((response) => (response.ok ? response.json() : []))
    )
      .then((data) => (Array.isArray(data) ? data : []))
      .then((classes) =>
        classes
          .map((entry) => entry?.name || entry?.className || entry)
          .filter(Boolean)
          .sort((a, b) => String(a).localeCompare(String(b)))
          .map((name) => ({ value: name, label: name })),
      )
      .catch(() => []);
    return spellClassOptionsPromise;
  }

  function domainOptionId(domain = {}) {
    return String(domain.id || domain.name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+(?:subdomain|domain)$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function domainOptionLabel(domain = {}) {
    return domain.name || titleFromId(domainOptionId(domain));
  }

  function loadDomainOptions() {
    domainOptionsPromise ||= (
      window.PFSpellData?.loadDomains?.() ||
      fetch("./data/domains.json", { cache: "no-cache" })
        .then((response) => (response.ok ? response.json() : { domains: [] }))
    )
      .then((data) => (Array.isArray(data) ? data : data.domains || []))
      .then((domains) =>
        domains
          .map((domain) => ({
            value: domainOptionId(domain),
            label: domainOptionLabel(domain),
            type: domain.type || "domain",
          }))
          .filter((domain) => domain.value && domain.label)
          .sort(
            (a, b) =>
              String(a.type || "").localeCompare(String(b.type || "")) ||
              String(a.label || "").localeCompare(String(b.label || "")),
          ),
      )
      .catch(() => []);
    return domainOptionsPromise;
  }

  function loadBloodlineOptions(classNames = []) {
    bloodlineOptionsPromise ||= fetch("./data/bloodlines.json", {
      cache: "no-cache",
    })
      .then((response) => (response.ok ? response.json() : { bloodlines: [] }))
      .then((data) => (Array.isArray(data) ? data : data.bloodlines || []))
      .catch(() => []);
    const requested = new Set(
      commaList(classNames).map((name) => String(name).trim().toLowerCase()),
    );
    return bloodlineOptionsPromise.then((bloodlines) =>
      bloodlines
        .filter(
          (bloodline) =>
            !requested.size ||
            (bloodline.classes || []).some((className) =>
              requested.has(String(className).trim().toLowerCase()),
            ),
        )
        .map((bloodline) => ({
          value: bloodline.id || slugifyOption(bloodline.name),
          label: bloodline.name,
        }))
        .filter((bloodline) => bloodline.value && bloodline.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    );
  }

  function spellAdjustmentBloodline(data = {}) {
    return String(
      data.bloodlineId || data.bloodline || data.bloodlineName || "any",
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "any";
  }

  function bloodlineClasses(targets = []) {
    const supported = new Set(["sorcerer", "bloodrager"]);
    return commaList(targets).filter((target) =>
      supported.has(String(target).trim().toLowerCase()),
    );
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

  function spellAdjustmentChooseOnApply(data = {}) {
    return Boolean(
      data.chooseOnApply ||
        data.pickOne ||
        data.pickWhenApplied ||
        data.choice ||
        data.choose,
    );
  }

  function normalizeSpellAdjustmentSource(value = "strict-spells") {
    const raw = String(value || "strict-spells")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    const aliases = {
      all: "all",
      any: "all",
      everything: "all",
      strictspell: "strict-spells",
      strictspells: "strict-spells",
      spell: "strict-spells",
      spells: "strict-spells",
      castspell: "strict-spells",
      castspells: "strict-spells",
      spelllikeability: "spell-like-abilities",
      spelllikeabilities: "spell-like-abilities",
      spelllike: "spell-like-abilities",
      sla: "spell-like-abilities",
      slas: "spell-like-abilities",
      extract: "extracts",
      extracts: "extracts",
      formula: "extracts",
      formulae: "extracts",
      draught: "draughts",
      draughts: "draughts",
      draft: "draughts",
      drafts: "draughts",
      classability: "class-abilities",
      classabilities: "class-abilities",
      classpower: "class-abilities",
      classpowers: "class-abilities",
      domainpower: "class-abilities",
      domainpowers: "class-abilities",
      bomb: "class-abilities",
      bombs: "class-abilities",
      alchemistbomb: "class-abilities",
      alchemistbombs: "class-abilities",
      talent: "class-abilities",
      talents: "class-abilities",
      wildtalent: "class-abilities",
      wildtalents: "class-abilities",
      kineticwildtalent: "class-abilities",
      kineticwildtalents: "class-abilities",
    };
    const normalized = aliases[raw] || value || "strict-spells";
    return SPELL_ADJUSTMENT_SOURCE_OPTIONS.some(
      (option) => option.value === normalized,
    )
      ? normalized
      : "strict-spells";
  }

  function spellAdjustmentSourceValue(data = {}) {
    return spellAdjustmentSourceValues(data)[0] || "strict-spells";
  }

  function spellAdjustmentSourceValues(data = {}) {
    const raw =
      data.spellSources ||
      data.appliesToSources ||
      data.sourceKinds ||
      data.appliesToKinds ||
      data.spellSource ||
      data.appliesToSource ||
      data.appliesToKind ||
      data.sourceKind ||
      data.effectKind ||
      data.spellKind ||
      "strict-spells";
    const values = commaList(raw).map(normalizeSpellAdjustmentSource);
    const unique = [...new Set(values.filter(Boolean))];
    if (unique.includes("all")) return ["all"];
    return unique.length ? unique : ["strict-spells"];
  }

  function spellAdjustmentSourceCheckboxes(data = {}) {
    const selected = new Set(spellAdjustmentSourceValues(data));
    return SPELL_ADJUSTMENT_SOURCE_OPTIONS.map(
      (option) => `
        <label class="form-check form-check-inline m-0">
          <input class="form-check-input" type="checkbox" data-spell-adjustment-source value="${escapeHtml(option.value)}" ${selected.has(option.value) ? "checked" : ""}>
          <span class="form-check-label">${escapeHtml(option.label)}</span>
        </label>
      `,
    ).join("");
  }

  function spellAdjustmentSourceLabel(data = {}) {
    const values =
      typeof data === "string"
        ? [normalizeSpellAdjustmentSource(data)]
        : spellAdjustmentSourceValues(data);
    return values
      .map(
        (value) =>
          SPELL_ADJUSTMENT_SOURCE_OPTIONS.find((option) => option.value === value)
            ?.label || "Strict Spells (default)",
      )
      .join(", ");
  }

  function spellAdjustmentTargetFilters(data = {}) {
    const rawFilters = Array.isArray(data.targetFilters)
      ? data.targetFilters
      : Array.isArray(data.filters)
        ? data.filters
        : [];
    const filters = rawFilters
      .map((filter) => ({
        targetMode: spellAdjustmentMode(filter),
        targets: spellAdjustmentMode(filter) === "all"
          ? []
          : spellAdjustmentTargets(filter),
        ...(spellAdjustmentChooseOnApply(filter) ? { chooseOnApply: true } : {}),
        ...(spellAdjustmentMode(filter) === "class" &&
        spellAdjustmentBloodline(filter) !== "any"
          ? { bloodline: spellAdjustmentBloodline(filter) }
          : {}),
      }))
      .filter(
        (filter) =>
          filter.targetMode === "all" ||
          filter.targets.length ||
          filter.chooseOnApply,
      );
    const specificFilters = filters.filter(
      (filter) => filter.targetMode !== "all",
    );
    if (specificFilters.length) return specificFilters;
    if (filters.length) return filters;
    return [
      {
        targetMode: spellAdjustmentMode(data),
        targets: spellAdjustmentMode(data) === "all"
          ? []
          : spellAdjustmentTargets(data),
        ...(spellAdjustmentChooseOnApply(data) ? { chooseOnApply: true } : {}),
        ...(spellAdjustmentMode(data) === "class" &&
        spellAdjustmentBloodline(data) !== "any"
          ? { bloodline: spellAdjustmentBloodline(data) }
          : {}),
      },
    ];
  }

  function spellAdjustmentIncreases(data = {}, isCasterLevel = false) {
    const raw = Array.isArray(data.adjustments)
      ? data.adjustments
      : Array.isArray(data.increases)
        ? data.increases
        : [];
    const increases = raw
      .map((entry) => ({
        value: Number(entry.value ?? entry.amount ?? 0),
        type: entry.type || "untyped",
        stacks: Boolean(entry.stacks),
        ...(isCasterLevel
          ? { appliesTo: casterLevelAppliesToValues(entry) }
          : {}),
        ...(entry.bonusScale || entry.scale
          ? { bonusScale: entry.bonusScale || entry.scale }
          : {}),
      }))
      .filter((entry) => entry.value || entry.bonusScale);
    if (increases.length) return increases;
    return [
      {
        value: Number(data.value ?? data.amount ?? 0),
        type: data.type || "untyped",
        stacks: Boolean(data.stacks),
        ...(isCasterLevel
          ? { appliesTo: casterLevelAppliesToValues(data) }
          : {}),
        ...(data.bonusScale || data.scale
          ? { bonusScale: data.bonusScale || data.scale }
          : {}),
      },
    ].filter((entry) => entry.value || entry.bonusScale);
  }

  function casterLevelAppliesToValues(data = {}) {
    const values = commaList(data.appliesTo || data.applyTo || data.part || "spell")
      .map((value) => {
        const key = String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
        return (
          {
            all: "spell",
            spell: "spell",
            wholespell: "spell",
            duration: "duration",
            durationonly: "duration",
            range: "range",
            rangeonly: "range",
            effect: "effectScaling",
            effects: "effectScaling",
            effectscaling: "effectScaling",
            scaling: "effectScaling",
          }[key] || value
        );
      })
      .filter((value) =>
        CASTER_LEVEL_APPLY_TO_OPTIONS.some((option) => option.value === value),
      );
    return values.length ? [...new Set(values)] : ["spell"];
  }

  function casterLevelAppliesToCheckboxes(data = {}) {
    const selected = new Set(casterLevelAppliesToValues(data));
    return CASTER_LEVEL_APPLY_TO_OPTIONS.map(
      (option) => `
        <label class="form-check form-check-inline m-0">
          <input class="form-check-input" type="checkbox" data-spell-adjustment-applies-to value="${escapeHtml(option.value)}" ${selected.has(option.value) ? "checked" : ""}>
          <span class="form-check-label">${escapeHtml(option.label)}</span>
        </label>
      `,
    ).join("");
  }

  function casterLevelAppliesToText(data = {}) {
    const values = casterLevelAppliesToValues(data);
    return values
      .map(
        (value) =>
          CASTER_LEVEL_APPLY_TO_OPTIONS.find((option) => option.value === value)
            ?.label || titleFromId(value),
      )
      .join(", ");
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
      domain: "domain",
      domains: "domain",
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
    if (mode === "domain") return titleFromId(value);
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

  function spellAdjustmentFilterText(filter = {}) {
    const mode = spellAdjustmentMode(filter);
    const targets = spellAdjustmentTargets(filter);
    const base = spellAdjustmentTargetText(mode, targets);
    const bloodline = spellAdjustmentBloodline(filter);
    const bloodlineText =
      mode === "class" && bloodline !== "any"
        ? ` | Bloodline: ${titleFromId(bloodline)}`
        : "";
    if (!spellAdjustmentChooseOnApply(filter)) return `${base}${bloodlineText}`;
    if (mode === "all") return "choose one spell target";
    return `${base}${bloodlineText} (choose one)`;
  }

  async function spellAdjustmentSuggestions(mode) {
    if (mode === "class") return loadSpellClassOptions();
    if (mode === "domain") return loadDomainOptions();
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

  async function spellAdjustmentChoiceOptions(filter = {}) {
    const mode = spellAdjustmentMode(filter);
    if (mode === "all") return [];
    const targets = spellAdjustmentTargets(filter);
    if (targets.length) {
      return targets.map((target) => ({
        value: target,
        label: spellAdjustmentTargetLabel(mode, target),
      }));
    }
    return spellAdjustmentSuggestions(mode);
  }

  function spellAdjustmentEntryNeedsChoice(entry = {}) {
    return spellAdjustmentTargetFilters(entry).some(spellAdjustmentChooseOnApply);
  }

  async function resolveSpellAdjustmentChoices(
    entries = [],
    { title = "Effect" } = {},
  ) {
    const list = Array.isArray(entries) ? entries : [];
    if (!list.some(spellAdjustmentEntryNeedsChoice)) return list;
    const resolved = [];
    for (const entry of list) {
      const filters = spellAdjustmentTargetFilters(entry);
      if (!filters.some(spellAdjustmentChooseOnApply)) {
        resolved.push(entry);
        continue;
      }
      const nextFilters = [];
      for (const filter of filters) {
        if (!spellAdjustmentChooseOnApply(filter)) {
          nextFilters.push(filter);
          continue;
        }
        const mode = spellAdjustmentMode(filter);
        const options = await spellAdjustmentChoiceOptions(filter);
        if (!options.length) return null;
        const label =
          SPELL_TARGET_MODES.find((entry) => entry.value === mode)?.label ||
          "Spell Target";
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${title}: Choose ${label}`,
              options,
            })
          : null;
        if (!picked) return null;
        const pickedValue =
          typeof picked === "object" ? picked.value : String(picked || "");
        if (!pickedValue) return null;
        nextFilters.push({
          targetMode: mode,
          targets: [pickedValue],
          resolvedChoice: true,
          ...(mode === "class" && spellAdjustmentBloodline(filter) !== "any"
            ? { bloodline: spellAdjustmentBloodline(filter) }
            : {}),
        });
      }
      const {
        targetMode: _targetMode,
        targets: _targets,
        values: _values,
        names: _names,
        spellNames: _spellNames,
        classes: _classes,
        schools: _schools,
        subschools: _subschools,
        descriptors: _descriptors,
        magicTypes: _magicTypes,
        target: _target,
        chooseOnApply: _chooseOnApply,
        pickOne: _pickOne,
        pickWhenApplied: _pickWhenApplied,
        choice: _choice,
        choose: _choose,
        ...rest
      } = entry;
      resolved.push({
        ...rest,
        targetFilters: nextFilters.length
          ? nextFilters
          : [{ targetMode: "all", targets: [] }],
      });
    }
    return resolved;
  }

  function createSpellAdjustmentRow(kind, data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-spell-adjustment-row";
    const isCasterLevel = kind === "casterLevel";
    const appliesWhen = data.appliesWhen || "";
    const conditional =
      Boolean(String(appliesWhen).trim()) || Boolean(data.conditional);
    row.innerHTML = `
      <div class="shared-spell-adjustment-source">
        <label>Applies To</label>
        <div class="shared-spell-adjustment-checks">
          ${spellAdjustmentSourceCheckboxes(data)}
        </div>
      </div>
      <div class="shared-spell-adjustment-nested">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div class="small text-secondary">Target Groups</div>
          <button class="btn btn-outline-info btn-sm" type="button" data-spell-adjustment-add-target>Add Target Group</button>
        </div>
        <div class="vstack gap-2" data-spell-adjustment-target-rows></div>
      </div>
      <div class="shared-spell-adjustment-nested">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div class="small text-secondary">Increases</div>
          <button class="btn btn-outline-info btn-sm" type="button" data-spell-adjustment-add-increase>Add Increase</button>
        </div>
        <div class="vstack gap-2" data-spell-adjustment-increase-rows></div>
      </div>
      <div class="shared-spell-adjustment-condition">
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
      </div>
    `;
    const targetRows = row.querySelector("[data-spell-adjustment-target-rows]");
    const increaseRows = row.querySelector("[data-spell-adjustment-increase-rows]");
    row.querySelectorAll("[data-spell-adjustment-source]").forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        if (input.value === "all") {
          row
            .querySelectorAll('[data-spell-adjustment-source]:not([value="all"])')
            .forEach((other) => {
              other.checked = false;
            });
          return;
        }
        const allInput = row.querySelector(
          '[data-spell-adjustment-source][value="all"]',
        );
        if (allInput) allInput.checked = false;
      });
    });
    const addTargetFilter = (filter = {}) => {
      const filterRow = document.createElement("div");
      filterRow.className = "shared-spell-adjustment-target-row";
      const mode = spellAdjustmentMode(filter);
      const targets = spellAdjustmentTargets(filter);
      const chooseOnApply = spellAdjustmentChooseOnApply(filter);
      const datalistId = `spellAdjustmentTargets${++spellAdjustmentRowId}`;
      filterRow.innerHTML = `
        <div>
          <label>Choose By</label>
          <select data-spell-adjustment-target-field="targetMode" class="form-select form-select-sm">
            ${optionObjectsHtml(SPELL_TARGET_MODES, mode)}
          </select>
        </div>
        <div data-spell-adjustment-targets-wrap>
          <label>Targets</label>
          <input data-spell-adjustment-target-field="targets" class="form-control form-control-sm" list="${datalistId}" value="${escapeHtml(targets.join(", "))}" placeholder="comma separated">
          <datalist id="${datalistId}"></datalist>
        </div>
        <div data-spell-adjustment-bloodline-wrap class="d-none">
          <label>Bloodline</label>
          <select data-spell-adjustment-target-field="bloodline" class="form-select form-select-sm">
            <option value="any">Any</option>
          </select>
        </div>
        <div data-spell-adjustment-choice-wrap>
          <label>Choose</label>
          <div class="form-check form-switch">
            <input data-spell-adjustment-target-field="chooseOnApply" class="form-check-input" type="checkbox" ${chooseOnApply ? "checked" : ""}>
          </div>
        </div>
        <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete spell target group"><i class="bi bi-trash"></i></button>
      `;
      const modeSelect = filterRow.querySelector(
        '[data-spell-adjustment-target-field="targetMode"]',
      );
      const targetsWrap = filterRow.querySelector(
        "[data-spell-adjustment-targets-wrap]",
      );
      const choiceWrap = filterRow.querySelector(
        "[data-spell-adjustment-choice-wrap]",
      );
      const bloodlineWrap = filterRow.querySelector(
        "[data-spell-adjustment-bloodline-wrap]",
      );
      const bloodlineSelect = filterRow.querySelector(
        '[data-spell-adjustment-target-field="bloodline"]',
      );
      const targetsInput = filterRow.querySelector(
        '[data-spell-adjustment-target-field="targets"]',
      );
      const chooseInput = filterRow.querySelector(
        '[data-spell-adjustment-target-field="chooseOnApply"]',
      );
      const datalist = filterRow.querySelector("datalist");
      const syncTargets = async () => {
        const mode = modeSelect.value;
        targetsWrap.classList.toggle("d-none", mode === "all");
        choiceWrap.classList.toggle("d-none", mode === "all");
        const suggestions = await spellAdjustmentSuggestions(mode);
        datalist.innerHTML = suggestions
          .map(
            (option) =>
              `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`,
          )
          .join("");
        const placeholder = {
          class: "Wizard, Cleric",
          domain: "air, cloud",
          school: "evocation, conjuration",
          subschool: "conjuration:teleportation",
          descriptor: "fire, mind-affecting",
          magicType: "arcane, divine",
          spell: "Fireball, Teleport",
        }[mode];
        targetsInput.placeholder = chooseInput.checked
          ? "leave blank for full list"
          : placeholder || "comma separated";
        const classes =
          mode === "class" ? bloodlineClasses(targetsInput.value) : [];
        const showBloodline = classes.length > 0;
        bloodlineWrap.classList.toggle("d-none", !showBloodline);
        filterRow.classList.toggle("has-bloodline", showBloodline);
        if (showBloodline) {
          const selected = bloodlineSelect.value || spellAdjustmentBloodline(filter);
          const bloodlines = await loadBloodlineOptions(classes);
          bloodlineSelect.innerHTML = [
            '<option value="any">Any</option>',
            ...bloodlines.map(
              (bloodline) =>
                `<option value="${escapeHtml(bloodline.value)}">${escapeHtml(bloodline.label)}</option>`,
            ),
          ].join("");
          bloodlineSelect.value = bloodlines.some(
            (bloodline) => bloodline.value === selected,
          )
            ? selected
            : "any";
        } else {
          bloodlineSelect.value = "any";
        }
      };
      modeSelect.addEventListener("change", syncTargets);
      chooseInput.addEventListener("change", syncTargets);
      targetsInput.addEventListener("input", syncTargets);
      filterRow
        .querySelector('button[aria-label="Delete spell target group"]')
        .addEventListener("click", () => filterRow.remove());
      filterRow._collect = () => {
        const targetMode = modeSelect.value || "all";
        const targets = targetMode === "all" ? [] : commaList(targetsInput.value);
        const chooseOnApply = chooseInput.checked;
        if (targetMode !== "all" && !targets.length && !chooseOnApply) return null;
        return {
          targetMode,
          targets,
          ...(targetMode === "class" &&
          bloodlineClasses(targets).length &&
          bloodlineSelect.value !== "any"
            ? { bloodline: bloodlineSelect.value }
            : {}),
          ...(chooseOnApply && targetMode !== "all" ? { chooseOnApply: true } : {}),
        };
      };
      targetRows.appendChild(filterRow);
      syncTargets();
    };
    const addIncrease = (increase = {}) => {
      const increaseRow = document.createElement("div");
      increaseRow.className = "shared-spell-adjustment-increase-row";
      increaseRow.innerHTML = `
        ${
          isCasterLevel
            ? `<div class="shared-spell-adjustment-applies-to">
                <label>CL Part</label>
                <div class="shared-spell-adjustment-checks">
                  ${casterLevelAppliesToCheckboxes(increase)}
                </div>
              </div>`
            : ""
        }
        <div>
          <label>Value</label>
          <input data-spell-adjustment-increase-field="value" class="form-control form-control-sm" type="number" value="${Number(increase.value ?? increase.amount ?? 0)}">
        </div>
        <div>
          <label>Type</label>
          <select data-spell-adjustment-increase-field="type" class="form-select form-select-sm">
            ${bonusTypeOptionsHtml(increase.type || "untyped")}
          </select>
        </div>
        <div>
          <label>Stacks</label>
          <div class="form-check form-switch">
            <input data-spell-adjustment-increase-field="stacks" class="form-check-input" type="checkbox" ${increase.stacks ? "checked" : ""}>
          </div>
        </div>
        <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
        <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete spell increase"><i class="bi bi-trash"></i></button>
        <div class="small text-secondary" data-scale-summary></div>
      `;
      wireScaleButton(
        increaseRow,
        increase.bonusScale || increase.scale || null,
        increaseRow.querySelector("[data-scale-summary]"),
        increaseRow.querySelector("[data-scale-bonus]"),
      );
      increaseRow
        .querySelector('button[aria-label="Delete spell increase"]')
        .addEventListener("click", () => increaseRow.remove());
      increaseRow._collect = () => {
        const collected = {
          value: Number(
            increaseRow.querySelector(
              '[data-spell-adjustment-increase-field="value"]',
            ).value || 0,
          ),
          type:
            increaseRow.querySelector(
              '[data-spell-adjustment-increase-field="type"]',
            ).value || "untyped",
          stacks: increaseRow.querySelector(
            '[data-spell-adjustment-increase-field="stacks"]',
          ).checked,
        };
        if (isCasterLevel) {
          const appliesTo = [
            ...increaseRow.querySelectorAll(
              "[data-spell-adjustment-applies-to]:checked",
            ),
          ].map((input) => input.value);
          collected.appliesTo = appliesTo.length ? appliesTo : ["spell"];
        }
        if (increaseRow._bonusScale) collected.bonusScale = increaseRow._bonusScale;
        return collected.value || collected.bonusScale ? collected : null;
      };
      increaseRows.appendChild(increaseRow);
    };
    spellAdjustmentTargetFilters(data).forEach(addTargetFilter);
    spellAdjustmentIncreases(data, isCasterLevel).forEach(addIncrease);
    if (!increaseRows.children.length) addIncrease();
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
      const targetFilters = [...targetRows.children]
        .map((filterRow) => filterRow._collect?.())
        .filter(Boolean);
      const specificTargetFilters = targetFilters.filter(
        (filter) => filter.targetMode !== "all",
      );
      const adjustments = [...increaseRows.children]
        .map((increaseRow) => increaseRow._collect?.())
        .filter(Boolean);
      if (!adjustments.length) return null;
      const appliesWhen = row
        .querySelector('[data-spell-adjustment-field="appliesWhen"]')
        .value.trim();
      const selectedSources = [
        ...row.querySelectorAll("[data-spell-adjustment-source]:checked"),
      ].map((input) => input.value);
      const spellSources = selectedSources.includes("all")
        ? ["all"]
        : selectedSources.length
          ? [...new Set(selectedSources)]
          : ["strict-spells"];
      return {
        spellSource: spellSources[0] || "strict-spells",
        spellSources,
        targetFilters: specificTargetFilters.length
          ? specificTargetFilters
          : targetFilters.length
            ? targetFilters
            : [{ targetMode: "all", targets: [] }],
        adjustments,
        conditional:
          row.querySelector('[data-spell-adjustment-field="conditional"]')
            .checked || Boolean(appliesWhen),
        appliesWhen,
      };
    };
    row
      .querySelector("[data-spell-adjustment-add-target]")
      .addEventListener("click", () => addTargetFilter({ targetMode: "all" }));
    row
      .querySelector("[data-spell-adjustment-add-increase]")
      .addEventListener("click", () => addIncrease());
    row._collect = collect;
    return { element: row, collect };
  }

  function casterLevelBonusText(entry = {}) {
    const targetFilters = spellAdjustmentTargetFilters(entry);
    const increases = spellAdjustmentIncreases(entry, true);
    const increaseText = increases
      .map((increase) => {
        const value = Number(increase.value || 0);
        const scale = scaleText(increase.bonusScale || increase.scale || null);
        return [
          `${value >= 0 ? "+" : ""}${value}`,
          scale ? `scales: ${scale}` : "",
          casterLevelAppliesToText(increase),
          increase.stacks ? "stacks" : "",
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join("; ");
    const targetsText = targetFilters
      .map((filter) =>
        spellAdjustmentFilterText(filter),
      )
      .join(" OR ");
    return [
      `Caster Level ${increaseText || "+0"}`,
      spellAdjustmentSourceLabel(entry),
      targetsText,
      entry.appliesWhen ? `when ${entry.appliesWhen}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function spellDcBonusText(entry = {}) {
    const targetFilters = spellAdjustmentTargetFilters(entry);
    const increases = spellAdjustmentIncreases(entry, false);
    const increaseText = increases
      .map((increase) => {
        const value = Number(increase.value || 0);
        const scale = scaleText(increase.bonusScale || increase.scale || null);
        return [
          `${value >= 0 ? "+" : ""}${value}`,
          scale ? `scales: ${scale}` : "",
          increase.stacks ? "stacks" : "",
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join("; ");
    const targetsText = targetFilters
      .map((filter) =>
        spellAdjustmentFilterText(filter),
      )
      .join(" OR ");
    return [
      `Spell DC ${increaseText || "+0"}`,
      spellAdjustmentSourceLabel(entry),
      targetsText,
      entry.appliesWhen ? `when ${entry.appliesWhen}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function normalizeDomainGrant(data = {}) {
    const chooseOnApply = Boolean(
      data.chooseOnApply ||
        data.pickOne ||
        data.pickWhenApplied ||
        data.choice ||
        data.choose,
    );
    return {
      domainId: domainOptionId({
        id: data.domainId || data.id || data.domain || data.name,
      }),
      domainName: data.domainName || data.name || data.domain || "",
      chooseOnApply,
    };
  }

  function grantDomainText(entry = {}) {
    const grant = normalizeDomainGrant(entry);
    if (grant.chooseOnApply) return "Grant Domain: choose when applied";
    return `Grant Domain: ${grant.domainName || titleFromId(grant.domainId) || "Domain"}`;
  }

  function grantDomainEntryNeedsChoice(entry = {}) {
    const grant = normalizeDomainGrant(entry);
    return grant.chooseOnApply && !grant.domainId;
  }

  async function resolveGrantDomainChoices(entries = [], { title = "Effect" } = {}) {
    const list = Array.isArray(entries) ? entries : [];
    if (!list.some(grantDomainEntryNeedsChoice)) return list;
    const options = await loadDomainOptions();
    if (!options.length) return null;
    const resolved = [];
    for (const entry of list) {
      if (!grantDomainEntryNeedsChoice(entry)) {
        resolved.push(entry);
        continue;
      }
      const picked = window.PFEffectChoicePicker
        ? await window.PFEffectChoicePicker.open({
            title: `${title}: Choose Domain`,
            options,
          })
        : null;
      if (!picked) return null;
      const value =
        typeof picked === "object" ? picked.value : String(picked || "");
      const label =
        typeof picked === "object" ? picked.label || picked.name || value : value;
      if (!value) return null;
      const { chooseOnApply, pickOne, pickWhenApplied, choice, choose, ...rest } =
        entry;
      resolved.push({
        ...rest,
        domainId: value,
        domainName: label,
      });
    }
    return resolved;
  }

  function createGrantDomainRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-grant-domain-row";
    const grant = normalizeDomainGrant(data);
    row.innerHTML = `
      <div>
        <label>Fixed Domain</label>
        <select data-grant-domain-field="domainId" class="form-select form-select-sm">
          <option value="">No fixed domain</option>
        </select>
      </div>
      <div>
        <label>User Chooses Domain</label>
        <div class="form-check form-switch shared-grant-domain-choice">
          <input data-grant-domain-field="chooseOnApply" class="form-check-input" type="checkbox" role="switch" aria-label="User chooses domain" ${grant.chooseOnApply ? "checked" : ""}>
          <span class="form-check-label">Player picks</span>
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete domain grant"><i class="bi bi-trash"></i></button>
    `;
    const select = row.querySelector('[data-grant-domain-field="domainId"]');
    const chooseInput = row.querySelector(
      '[data-grant-domain-field="chooseOnApply"]',
    );
    const syncOptions = async () => {
      const options = await loadDomainOptions();
      const selected = select.value || grant.domainId;
      select.innerHTML = [
        `<option value="">No fixed domain</option>`,
        ...options.map(
          (option) =>
            `<option value="${escapeHtml(option.value)}" ${option.value === selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
        ),
      ].join("");
      if (selected) select.value = selected;
      select.disabled = chooseInput.checked;
    };
    chooseInput.addEventListener("change", syncOptions);
    row
      .querySelector('button[aria-label="Delete domain grant"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    row._collect = () => {
      const chooseOnApply = chooseInput.checked;
      const domainId = select.value || "";
      const domainName =
        select.selectedOptions?.[0]?.textContent?.trim() || grant.domainName || "";
      if (!chooseOnApply && !domainId) return null;
      return {
        ...(chooseOnApply ? { chooseOnApply: true } : {}),
        ...(!chooseOnApply
          ? {
              domainId,
              domainName,
            }
          : {}),
      };
    };
    syncOptions();
    return { element: row, collect: row._collect };
  }

  function attributeContributionTargetOptions(selected = "initiative") {
    const direct = [
      ["initiative", "Initiative"],
      ["ac", "Armor Class"],
      ["touch ac", "Touch AC"],
      ["flat-footed ac", "Flat-Footed AC"],
      ["fortitude", "Fortitude"],
      ["reflex", "Reflex"],
      ["will", "Will"],
      ["cmb", "CMB"],
      ["cmd", "CMD"],
      ["hit points", "Hit Points"],
      ["attack", "Weapon Attack Rolls"],
      ["damage", "Weapon Damage Rolls"],
    ];
    const groups = [
      ["group:all", "All Attribute-Derived Stats"],
      ["group:armor-class", "All Armor Class Stats"],
      ["group:saving-throws", "All Saving Throws"],
      ["group:combat-maneuvers", "CMB and CMD"],
      ["group:attacks", "All Weapon Attack Rolls"],
      ["group:damage", "All Weapon Damage Rolls"],
      ["group:weapon-rolls", "All Weapon Attack and Damage Rolls"],
      ["group:skills", "All Skills"],
      ["group:skills-str", "All STR Skills"],
      ["group:skills-dex", "All DEX Skills"],
      ["group:skills-con", "All CON Skills"],
      ["group:skills-int", "All INT Skills"],
      ["group:skills-wis", "All WIS Skills"],
      ["group:skills-cha", "All CHA Skills"],
    ];
    const choices = [
      ["choice:attribute-derived-stats", "Any Attribute-Derived Stat"],
      ["choice:armor-class-stats", "Any Armor Class Stat"],
      ["choice:saving-throws", "Any Saving Throw"],
      ["choice:combat-maneuver-stats", "CMB or CMD"],
      ["choice:weapon-roll-stats", "Weapon Attack or Damage"],
      ["choice:skills-all", "Any Skill"],
      ["choice:skills-str", "Any STR Skill"],
      ["choice:skills-dex", "Any DEX Skill"],
      ["choice:skills-con", "Any CON Skill"],
      ["choice:skills-int", "Any INT Skill"],
      ["choice:skills-wis", "Any WIS Skill"],
      ["choice:skills-cha", "Any CHA Skill"],
    ];
    const skills = (window.PFEffectStats?.PF_SKILLS_WITH_ABILITY || []).map(
      (skill) => {
        const name = Array.isArray(skill) ? skill[0] : skill.name;
        return [window.PFEffectStats.skillStatValue(name), name];
      },
    );
    const option = ([value, label]) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    return `
      <optgroup label="Specific Stat">${direct.map(option).join("")}</optgroup>
      <optgroup label="Specific Skill">${skills.map(option).join("")}</optgroup>
      <optgroup label="Groups">${groups.map(option).join("")}</optgroup>
      <optgroup label="Player Chooses">${choices.map(option).join("")}</optgroup>
    `;
  }

  function createAttributeContributionRow(data = {}, { onDelete, onChange } = {}) {
    const row = document.createElement("div");
    row.className = "shared-attribute-contribution-row";
    const normalized = window.PFEffectMechanics?.normalizeAttributeContribution?.(data) || data;
    const stat = normalized.stat || "initiative";
    const weaponTypes = window.PFEffectStats?.WEAPON_RESTRICTION_OPTIONS || [];
    const nameListId = `attributeContributionWeapons${++weaponDamageSizeRowId}`;
    row.innerHTML = `
      <div>
        <label>Operation</label>
        <select data-attribute-contribution-field="mode" class="form-select form-select-sm">
          <option value="add" ${normalized.mode !== "replace" ? "selected" : ""}>Add Attribute</option>
          <option value="replace" ${normalized.mode === "replace" ? "selected" : ""}>Replace Existing Attributes</option>
        </select>
      </div>
      <div>
        <label>Attribute</label>
        <select data-attribute-contribution-field="ability" class="form-select form-select-sm">
          ${[["str", "STR"], ["dex", "DEX"], ["con", "CON"], ["int", "INT"], ["wis", "WIS"], ["cha", "CHA"]]
            .map(([value, label]) => `<option value="${value}" ${normalized.ability === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </div>
      <div class="shared-attribute-contribution-target">
        <label>Applies To</label>
        <select data-attribute-contribution-field="stat" class="form-select form-select-sm">
          ${attributeContributionTargetOptions(stat)}
        </select>
      </div>
      <div data-attribute-contribution-weapon>
        <label>Weapon Type</label>
        <select data-attribute-contribution-field="weaponType" class="form-select form-select-sm">
          ${weaponTypes.map((option) => `<option value="${escapeHtml(option.value)}" ${(normalized.weaponType || "all") === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </div>
      <div data-attribute-contribution-weapon>
        <label>Weapon Name</label>
        <input data-attribute-contribution-field="weaponName" class="form-control form-control-sm" list="${nameListId}" value="${escapeHtml(normalized.weaponName || "")}" placeholder="Any weapon">
        <datalist id="${nameListId}"></datalist>
      </div>
      <button class="btn btn-outline-danger btn-sm btn-icon" type="button" aria-label="Delete attribute contribution"><i class="bi bi-trash"></i></button>
    `;
    const statSelect = row.querySelector('[data-attribute-contribution-field="stat"]');
    const syncWeaponFields = () => {
      const target = statSelect.value;
      const weaponTarget = ["attack", "damage", "group:attacks", "group:damage", "group:weapon-rolls", "group:all", "choice:attribute-derived-stats", "choice:weapon-roll-stats"].includes(target);
      row.querySelectorAll("[data-attribute-contribution-weapon]").forEach((field) =>
        field.classList.toggle("d-none", !weaponTarget),
      );
      onChange?.();
    };
    statSelect.addEventListener("change", syncWeaponFields);
    row.addEventListener("input", () => onChange?.());
    row.addEventListener("change", () => onChange?.());
    row.querySelector('button[aria-label="Delete attribute contribution"]').addEventListener("click", () => {
      row.remove();
      onDelete?.();
    });
    void loadWeaponNameCatalog().then((names) => {
      const datalist = row.querySelector(`#${nameListId}`);
      if (datalist)
        datalist.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
    });
    row._collect = () => {
      const target = statSelect.value;
      const weaponTarget = ["attack", "damage", "group:attacks", "group:damage", "group:weapon-rolls", "group:all", "choice:attribute-derived-stats", "choice:weapon-roll-stats"].includes(target);
      return {
        mode: row.querySelector('[data-attribute-contribution-field="mode"]').value,
        ability: row.querySelector('[data-attribute-contribution-field="ability"]').value,
        stat: target,
        ...(weaponTarget
          ? {
              weaponType: row.querySelector('[data-attribute-contribution-field="weaponType"]').value || "all",
              weaponName: row.querySelector('[data-attribute-contribution-field="weaponName"]').value.trim(),
            }
          : {}),
      };
    };
    syncWeaponFields();
    return { element: row, collect: row._collect };
  }
  function effectiveAttributeBonusText(entry = {}) {
    const attribute = normalizeAttributeKey(
      entry.attribute || entry.ability || entry.stat || "CHA",
    );
    const value = Number(entry.value ?? entry.amount ?? 0);
    const targetFilters = spellAdjustmentTargetFilters(entry);
    const targetsText = targetFilters
      .map((filter) => spellAdjustmentFilterText(filter))
      .join(" OR ");
    return [
      `Effective ${attribute || "Attribute"} ${value >= 0 ? "+" : ""}${value}`,
      spellAdjustmentSourceLabel(entry),
      targetsText,
      entry.appliesWhen ? `when ${entry.appliesWhen}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function createEffectiveAttributeBonusRow(data = {}, { onDelete } = {}) {
    const rowData = {
      ...data,
      adjustments: [
        {
          value: Number(data.value ?? data.amount ?? 0),
          type: data.type || "untyped",
          stacks: data.stacks ?? true,
          ...(data.bonusScale || data.scale
            ? { bonusScale: data.bonusScale || data.scale }
            : {}),
        },
      ],
    };
    const { element, collect } = createSpellAdjustmentRow("spellDc", rowData, {
      onDelete,
    });
    element.classList.add("shared-effective-attribute-row");
    const source = element.querySelector(".shared-spell-adjustment-source");
    const attributeWrap = document.createElement("div");
    attributeWrap.className = "shared-effective-attribute-field";
    const attribute = normalizeAttributeKey(
      data.attribute || data.ability || data.stat || "CHA",
    );
    attributeWrap.innerHTML = `
      <label>Attribute</label>
      <select data-effective-attribute-field="attribute" class="form-select form-select-sm">
        ${ATTRIBUTE_REQUIREMENT_OPTIONS.filter(Boolean)
          .map(
            (attr) =>
              `<option value="${escapeHtml(attr)}" ${attribute === attr ? "selected" : ""}>${escapeHtml(attr)}</option>`,
          )
          .join("")}
      </select>
    `;
    element.insertBefore(attributeWrap, source || element.firstChild);
    element._collect = () => {
      const result = collect();
      if (!result) return null;
      const increase = (result.adjustments || [])[0] || {};
      return {
        ...result,
        attribute:
          element.querySelector('[data-effective-attribute-field="attribute"]')
            ?.value || "CHA",
        value: Number(increase.value || 0),
        type: increase.type || "untyped",
        stacks: increase.stacks !== false,
        ...(increase.bonusScale ? { bonusScale: increase.bonusScale } : {}),
      };
    };
    return { element, collect: element._collect };
  }

  function generatedWeaponFormula(details = {}) {
    if (window.PFEffectRolls?.weaponFormula)
      return window.PFEffectRolls.weaponFormula(details);
    const match = String(details.damage || "").match(
      /^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i,
    );
    return {
      diceCount: Number(details.diceCount ?? match?.[1] ?? 0),
      dieType: Number(details.dieType ?? match?.[2] ?? 6),
      diceCountMax: details.diceCountMax ?? null,
      staticValue: Number(
        details.staticDamage ??
          Number(details.damageMisc || 0) +
            (match?.[4]
              ? Number(match[4]) * (match[3] === "-" ? -1 : 1)
              : 0),
      ),
      staticValueMax: details.staticDamageMax ?? null,
      diceCountScale: details.diceCountScale || null,
      staticValueScale: details.staticDamageScale || null,
    };
  }

  function generatedSmallWeaponFormula(details = {}) {
    const match = String(details.damageSmall || "").match(/^(\d+)d(\d+)/i);
    return {
      diceCount: Number(details.smallDiceCount ?? match?.[1] ?? 0),
      dieType: Number(details.smallDieType ?? match?.[2] ?? 6),
    };
  }

  function fillGeneratedEquipmentRow(row, item = {}) {
    const details = generatedEquipmentDetails(item);
    const formula = generatedWeaponFormula(details);
    const type = generatedEquipmentType(item);
    const set = (field, value) => {
      const input = row.querySelector(
        `[data-generated-equipment-field="${field}"]`,
      );
      if (!input) return;
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value ?? "";
    };
    set("type", type);
    set("name", item.name || item.item || "");
    set("weaponType", details.weaponType || "Natural Weapon");
    set("naturalAttackKind", details.naturalAttackKind || "Other");
    set("naturalAttackRole", details.naturalAttackRole || "Primary");
    set("attackScale", details.attackScale || "STR");
    set("damageScale", details.damageScale || "STR");
    set("diceCount", formula.diceCount);
    set("dieType", formula.dieType);
    set("diceCountMax", formula.diceCountMax);
    set("staticDamage", formula.staticValue);
    set("staticDamageMax", formula.staticValueMax);
    const smallFormula = generatedSmallWeaponFormula(details);
    set("smallDiceCount", smallFormula.diceCount);
    set("smallDieType", smallFormula.dieType);
    set("damageType", details.damageType || "");
    set("critical", details.critical || "");
    set("attackMisc", details.attackMisc ?? details.attack_misc ?? 0);
    set("range", details.range || "");
    set("enhancement", details.enhancement ?? item.enhancement ?? 0);
    set("armorEnhancement", details.enhancement ?? item.enhancement ?? 0);
    set("enchantment", details.enchantment || item.enchantment || "");
    set("awardProficiency", details.awardProficiency);
    set("proficiencyMode", details.proficiencyMode || "name");
    set("proficiency", details.proficiency || "");
    set("babMode", details.babMode || "standard");
    set("standardBabBonus", details.standardBabBonus ?? 0);
    set("customBab", details.customBab ?? 0);
    set("armorBonus", details.bonus ?? item.bonus ?? "");
    set("penalty", details.penalty ?? item.penalty ?? "");
    set("failure", details.failure ?? item.failure ?? "");
    set("weight", details.weight ?? item.weight ?? "");
    window.PFWeaponDamage?.mount(
      row.querySelector("[data-generated-extra-damage]"),
      details.extraDamage,
    );
    const naturalDamageHost = row.querySelector("[data-generated-natural-damage]");
    naturalDamageHost?._setNaturalDamage?.(details.naturalDamageBySize || {});
    if (
      naturalDamageHost &&
      !Object.values(details.naturalDamageBySize || {}).some(Boolean)
    ) {
      void naturalDamageHost._setNaturalDamageFromKind?.(
        details.naturalAttackKind || "Other",
        { force: true },
      );
    }
    row.querySelector('[data-generated-scale="dice"]')?._setBonusScale?.(
      formula.diceCountScale,
    );
    row.querySelector('[data-generated-scale="static"]')?._setBonusScale?.(
      formula.staticValueScale,
    );
    row.querySelector('[data-generated-scale="enhancement"]')?._setBonusScale?.(
      details.enhancementScale,
    );
    row.querySelector('[data-generated-scale="armor-enhancement"]')?._setBonusScale?.(
      details.enhancementScale,
    );
    row.querySelector('[data-generated-scale="standard-bab"]')?._setBonusScale?.(
      details.standardBabBonusScale,
    );
    row.querySelector('[data-generated-scale="custom-bab"]')?._setBonusScale?.(
      details.customBabScale,
    );
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
    const smallFormula = generatedSmallWeaponFormula(details);
    const enchantmentListId = `generatedWeaponEnchantments${++generatedEquipmentRowId}`;
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
      <div class="shared-generated-equipment-weapon-layout" data-generated-equipment-weapon-fields>
        <section class="shared-generated-equipment-section">
          <h6>Weapon</h6>
          <div class="shared-generated-equipment-grid">
            <div>
              <label>Weapon Type</label>
              <select data-generated-equipment-field="weaponType" class="form-select form-select-sm">
                ${weaponTypeOptionsHtml(details.weaponType || "Natural Weapon")}
              </select>
            </div>
            <div data-generated-equipment-natural-field>
              <label>Natural Attack</label>
              <select data-generated-equipment-field="naturalAttackKind" class="form-select form-select-sm">
                <option value="${escapeHtml(details.naturalAttackKind || "Other")}">${escapeHtml(details.naturalAttackKind || "Other")}</option>
              </select>
            </div>
            <div data-generated-equipment-natural-field>
              <label>Attack Type</label>
              <select data-generated-equipment-field="naturalAttackRole" class="form-select form-select-sm">
                ${simpleOptionsHtml(NATURAL_ATTACK_ROLES, details.naturalAttackRole || "Primary")}
              </select>
            </div>
            <div>
              <label>Critical</label>
              <input data-generated-equipment-field="critical" class="form-control form-control-sm" value="${escapeHtml(details.critical || "")}" placeholder="20/x2">
            </div>
            <div>
              <label>Range</label>
              <input data-generated-equipment-field="range" class="form-control form-control-sm" value="${escapeHtml(details.range || "")}">
            </div>
            <div>
              <label>Damage Type</label>
              <input data-generated-equipment-field="damageType" class="form-control form-control-sm" value="${escapeHtml(details.damageType || "")}" placeholder="Slashing">
            </div>
          </div>
        </section>

        <section class="shared-generated-equipment-section">
          <h6>Damage</h6>
          <div class="shared-generated-equipment-grid shared-generated-damage-grid">
            <div data-generated-equipment-standard-size-field>
              <label>Number of Dice</label>
              ${numberStepperMarkup({ id: "generated-weapon-dice", value: generatedWeaponFormula(details).diceCount, min: 0, inputAttributes: 'data-generated-equipment-field="diceCount"', label: "number of weapon dice" })}
            </div>
            <div data-generated-equipment-standard-size-field>
              <label>Die</label>
              <select data-generated-equipment-field="dieType" class="form-select form-select-sm">${damageDieOptions(generatedWeaponFormula(details).dieType)}</select>
            </div>
            <div>
              <label>Maximum Dice</label>
              ${numberStepperMarkup({ id: "generated-weapon-dice-max", value: generatedWeaponFormula(details).diceCountMax ?? "", min: 0, inputAttributes: 'data-generated-equipment-field="diceCountMax" placeholder="No maximum"', label: "maximum weapon dice" })}
            </div>
            <div class="shared-generated-scale-control" data-generated-scale="dice">
              <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale Dice</button>
              <span class="small text-secondary" data-generated-scale-summary></span>
            </div>
            <div>
              <label>Static Damage</label>
              ${numberStepperMarkup({ id: "generated-weapon-static", value: generatedWeaponFormula(details).staticValue, inputAttributes: 'data-generated-equipment-field="staticDamage"', label: "static weapon damage" })}
            </div>
            <div>
              <label>Maximum Static</label>
              ${numberStepperMarkup({ id: "generated-weapon-static-max", value: generatedWeaponFormula(details).staticValueMax ?? "", min: 0, inputAttributes: 'data-generated-equipment-field="staticDamageMax" placeholder="No maximum"', label: "maximum static weapon damage" })}
            </div>
            <div class="shared-generated-scale-control" data-generated-scale="static">
              <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale Static</button>
              <span class="small text-secondary" data-generated-scale-summary></span>
            </div>
            <div>
              <label>Damage Ability</label>
              <select data-generated-equipment-field="damageScale" class="form-select form-select-sm">
                ${scaleOptionsHtml(details.damageScale || "STR")}
              </select>
            </div>
            <div data-generated-equipment-standard-size-field>
              <label>Small Number of Dice</label>
              ${numberStepperMarkup({ id: "generated-small-weapon-dice", value: smallFormula.diceCount, min: 0, inputAttributes: 'data-generated-equipment-field="smallDiceCount"', label: "number of small weapon dice" })}
            </div>
            <div data-generated-equipment-standard-size-field>
              <label>Small Die</label>
              <select data-generated-equipment-field="smallDieType" class="form-select form-select-sm">${damageDieOptions(smallFormula.dieType)}</select>
            </div>
            <div class="natural-damage-editor-wrap" data-generated-equipment-natural-field>
              <label>Natural Damage by Size</label>
              <div data-generated-natural-damage></div>
            </div>
          </div>
          <div class="shared-generated-extra-damage">
            <h6>Extra Damage</h6>
            <div data-generated-extra-damage></div>
          </div>
        </section>

        <section class="shared-generated-equipment-section">
          <h6>Magic</h6>
          <div class="shared-generated-equipment-grid shared-generated-enhancement-grid">
            <div>
              <label>Enhancement</label>
              ${numberStepperMarkup({ id: "generated-weapon-enhancement", value: details.enhancement ?? 0, min: 0, inputAttributes: 'data-generated-equipment-field="enhancement"', label: "weapon enhancement" })}
            </div>
            <div class="shared-generated-scale-control" data-generated-scale="enhancement">
              <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale Enhancement</button>
            </div>
            <div class="shared-generated-wide-field">
              <label>Enchantments</label>
              <input data-generated-equipment-field="enchantment" class="form-control form-control-sm" list="${enchantmentListId}" value="${escapeHtml(details.enchantment || "")}" placeholder="Start typing an enchantment" autocomplete="off">
              <datalist id="${enchantmentListId}">
                ${GENERATED_WEAPON_ENCHANTMENTS.map((enchantment) => `<option value="${escapeHtml(enchantment)}"></option>`).join("")}
              </datalist>
            </div>
            <div class="small text-secondary shared-generated-enhancement-summary" data-generated-scale-summary-for="enhancement"></div>
          </div>
        </section>

        <section class="shared-generated-equipment-section">
          <h6>Attack Basis</h6>
          <div class="shared-generated-equipment-grid">
            <div>
              <label>Attack Ability</label>
              <select data-generated-equipment-field="attackScale" class="form-select form-select-sm">
                ${scaleOptionsHtml(details.attackScale || "STR")}
              </select>
            </div>
            <div>
              <label>BAB Source</label>
              <select data-generated-equipment-field="babMode" class="form-select form-select-sm">
                <option value="standard" ${(details.babMode || "standard") === "standard" ? "selected" : ""}>Standard BAB + Bonus</option>
                <option value="custom" ${details.babMode === "custom" ? "selected" : ""}>Custom BAB</option>
              </select>
            </div>
            <div data-generated-standard-bab-field>
              <label>Standard BAB Bonus</label>
              ${numberStepperMarkup({ id: "generated-standard-bab", value: details.standardBabBonus ?? 0, inputAttributes: 'data-generated-equipment-field="standardBabBonus"', label: "standard BAB bonus" })}
            </div>
            <div class="shared-generated-scale-control" data-generated-scale="standard-bab" data-generated-standard-bab-field>
              <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale BAB Bonus</button>
              <span class="small text-secondary" data-generated-scale-summary></span>
            </div>
            <div data-generated-custom-bab-field>
              <label>Custom BAB</label>
              ${numberStepperMarkup({ id: "generated-custom-bab", value: details.customBab ?? 0, min: 0, inputAttributes: 'data-generated-equipment-field="customBab"', label: "custom BAB" })}
            </div>
            <div class="shared-generated-scale-control" data-generated-scale="custom-bab" data-generated-custom-bab-field>
              <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale Custom BAB</button>
              <span class="small text-secondary" data-generated-scale-summary></span>
            </div>
            <div>
              <label>Attack Misc</label>
              ${numberStepperMarkup({ id: "generated-attack-misc", value: details.attackMisc ?? details.attack_misc ?? 0, inputAttributes: 'data-generated-equipment-field="attackMisc"', label: "weapon attack misc" })}
            </div>
          </div>
        </section>

        <section class="shared-generated-equipment-section">
          <h6>Proficiency</h6>
          <div class="shared-generated-equipment-grid">
            <div class="shared-generated-toggle">
              <label>Award Proficiency</label>
              <div class="form-check form-switch">
                <input data-generated-equipment-field="awardProficiency" class="form-check-input" type="checkbox" ${details.awardProficiency ? "checked" : ""}>
              </div>
            </div>
            <div data-generated-proficiency-field>
              <label>Award For</label>
              <select data-generated-equipment-field="proficiencyMode" class="form-select form-select-sm">
                <option value="name" ${(details.proficiencyMode || "name") === "name" ? "selected" : ""}>This Weapon</option>
                <option value="type" ${details.proficiencyMode === "type" ? "selected" : ""}>Proficiency Type</option>
              </select>
            </div>
            <div data-generated-proficiency-field data-generated-proficiency-type-field>
              <label>Proficiency Type</label>
              <input data-generated-equipment-field="proficiency" class="form-control form-control-sm" value="${escapeHtml(details.proficiency || "")}" placeholder="Simple, Martial, Exotic">
            </div>
          </div>
        </section>
      </div>
      <div class="shared-generated-equipment-fields" data-generated-equipment-armor-fields>
        <div>
          <label>Armor Bonus</label>
          <input data-generated-equipment-field="armorBonus" class="form-control form-control-sm" value="${escapeHtml(details.bonus || data.bonus || "")}" placeholder="+2">
        </div>
        <div>
          <label>Enhancement</label>
          ${numberStepperMarkup({ id: "generated-armor-enhancement", value: details.enhancement ?? data.enhancement ?? 0, min: 0, inputAttributes: 'data-generated-equipment-field="armorEnhancement"', label: "armor enhancement" })}
        </div>
        <div class="shared-generated-scale-control" data-generated-scale="armor-enhancement">
          <button class="btn btn-outline-info btn-sm" type="button" data-generated-scale-button>Scale Enhancement</button>
        </div>
        <div class="small text-secondary shared-generated-enhancement-summary" data-generated-scale-summary-for="armor-enhancement"></div>
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
    wireNumberSteppers(row);
    const naturalDamageHost = row.querySelector("[data-generated-natural-damage]");
    window.PFNaturalWeapons?.mount(
      naturalDamageHost,
      details.naturalDamageBySize,
      {
        onChange: (damageBySize) => {
          const match = String(damageBySize.medium || "").match(/^(\d+)d(\d+)$/i);
          if (!match) return;
          const diceCountInput = row.querySelector(
            '[data-generated-equipment-field="diceCount"]',
          );
          const dieTypeInput = row.querySelector(
            '[data-generated-equipment-field="dieType"]',
          );
          if (diceCountInput) diceCountInput.value = match[1];
          if (dieTypeInput) dieTypeInput.value = match[2];
        },
      },
    );
    void window.PFNaturalWeapons?.populateKindSelect?.(
      row.querySelector('[data-generated-equipment-field="naturalAttackKind"]'),
      details.naturalAttackKind || "Other",
    );
    if (!Object.values(details.naturalDamageBySize || {}).some(Boolean)) {
      void naturalDamageHost?._setNaturalDamageFromKind?.(
        details.naturalAttackKind || "Other",
        { force: true },
      );
    }
    window.PFWeaponDamage?.mount(
      row.querySelector("[data-generated-extra-damage]"),
      details.extraDamage,
    );
    const scaleDefinitions = [
      ["dice", generatedWeaponFormula(details).diceCountScale],
      ["static", generatedWeaponFormula(details).staticValueScale],
      ["enhancement", details.enhancementScale],
      ["armor-enhancement", details.enhancementScale],
      ["standard-bab", details.standardBabBonusScale],
      ["custom-bab", details.customBabScale],
    ];
    scaleDefinitions.forEach(([key, scale]) => {
      const host = row.querySelector(`[data-generated-scale="${key}"]`);
      if (!host) return;
      wireScaleButton(
        host,
        scale || null,
        host.querySelector("[data-generated-scale-summary]") ||
          row.querySelector(`[data-generated-scale-summary-for="${key}"]`),
        host.querySelector("[data-generated-scale-button]"),
      );
    });
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
      const natural =
        selected === "Weapon" &&
        row.querySelector('[data-generated-equipment-field="weaponType"]').value ===
          "Natural Weapon";
      row
        .querySelectorAll("[data-generated-equipment-natural-field]")
        .forEach((field) => field.classList.toggle("d-none", !natural));
      row
        .querySelectorAll("[data-generated-equipment-standard-size-field]")
        .forEach((field) => field.classList.toggle("d-none", natural));
      const customBab =
        row.querySelector('[data-generated-equipment-field="babMode"]')?.value ===
        "custom";
      row
        .querySelectorAll("[data-generated-standard-bab-field]")
        .forEach((field) => field.classList.toggle("d-none", customBab));
      row
        .querySelectorAll("[data-generated-custom-bab-field]")
        .forEach((field) => field.classList.toggle("d-none", !customBab));
      const awardsProficiency = Boolean(
        row.querySelector(
          '[data-generated-equipment-field="awardProficiency"]',
        )?.checked,
      );
      row
        .querySelectorAll("[data-generated-proficiency-field]")
        .forEach((field) =>
          field.classList.toggle("d-none", !awardsProficiency),
        );
      const proficiencyByType =
        row.querySelector(
          '[data-generated-equipment-field="proficiencyMode"]',
        )?.value === "type";
      row
        .querySelectorAll("[data-generated-proficiency-type-field]")
        .forEach((field) =>
          field.classList.toggle(
            "d-none",
            !awardsProficiency || !proficiencyByType,
          ),
        );
    };
    row.addEventListener("generated-equipment:typechange", syncType);
    row
      .querySelector('[data-generated-equipment-field="type"]')
      .addEventListener("change", syncType);
    row
      .querySelector('[data-generated-equipment-field="weaponType"]')
      .addEventListener("change", syncType);
    row
      .querySelector('[data-generated-equipment-field="naturalAttackKind"]')
      .addEventListener("change", async (event) => {
        const entry = await window.PFNaturalWeapons?.attack?.(event.target.value);
        await naturalDamageHost?._setNaturalDamageFromKind?.(
          event.target.value,
          { force: true },
        );
        if (!entry) return;
        row.querySelector(
          '[data-generated-equipment-field="naturalAttackRole"]',
        ).value = entry.details?.naturalAttackRole || "Primary";
        row.querySelector(
          '[data-generated-equipment-field="damageType"]',
        ).value = entry.details?.damageType || "";
      });
    row
      .querySelector('[data-generated-equipment-field="babMode"]')
      .addEventListener("change", syncType);
    row
      .querySelector('[data-generated-equipment-field="awardProficiency"]')
      .addEventListener("change", syncType);
    row
      .querySelector('[data-generated-equipment-field="proficiencyMode"]')
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
        const value = (field) =>
          row.querySelector(
            `[data-generated-equipment-field="${field}"]`,
          )?.value ?? "";
        const checked = (field) =>
          Boolean(
            row.querySelector(
              `[data-generated-equipment-field="${field}"]`,
            )?.checked,
          );
        const optionalNumber = (field) =>
          value(field) === "" ? null : Number(value(field));
        const natural = value("weaponType") === "Natural Weapon";
        const naturalDamageBySize = natural
          ? window.PFNaturalWeapons?.collect(naturalDamageHost) || {}
          : {};
        const naturalMediumMatch = String(
          naturalDamageBySize.medium || "",
        ).match(/^(\d+)d(\d+)$/i);
        const diceCount = natural
          ? Number(naturalMediumMatch?.[1] || 0)
          : Number(value("diceCount") || 0);
        const dieType = natural
          ? Number(naturalMediumMatch?.[2] || value("dieType") || 6)
          : Number(value("dieType") || 6);
        const smallDiceCount = Number(value("smallDiceCount") || 0);
        const smallDieType = Number(value("smallDieType") || 6);
        return {
          type: "Weapon",
          name,
          details: {
            weaponType: value("weaponType"),
            naturalAttackKind: value("naturalAttackKind"),
            naturalAttackRole: value("naturalAttackRole"),
            attackScale: value("attackScale"),
            damageScale: value("damageScale"),
            damage: natural
              ? naturalDamageBySize.medium || ""
              : diceCount
                ? `${diceCount}d${dieType}`
                : "",
            ...(natural ? { naturalDamageBySize } : {}),
            diceCount,
            dieType,
            diceCountMax: optionalNumber("diceCountMax"),
            diceCountScale:
              row.querySelector('[data-generated-scale="dice"]')
                ?._bonusScale || null,
            staticDamage: Number(value("staticDamage") || 0),
            staticDamageMax: optionalNumber("staticDamageMax"),
            staticDamageScale:
              row.querySelector('[data-generated-scale="static"]')
                ?._bonusScale || null,
            damageSmall: smallDiceCount
              ? `${smallDiceCount}d${smallDieType}`
              : "",
            smallDiceCount,
            smallDieType,
            damageType: value("damageType"),
            extraDamage: window.PFWeaponDamage?.collect(
              row.querySelector("[data-generated-extra-damage]"),
            ) || [],
            critical: value("critical"),
            attackMisc: Number(value("attackMisc") || 0),
            range: value("range"),
            enhancement: Number(value("enhancement") || 0),
            enhancementScale:
              row.querySelector('[data-generated-scale="enhancement"]')
                ?._bonusScale || null,
            enchantment: value("enchantment"),
            awardProficiency: checked("awardProficiency"),
            proficiencyMode: value("proficiencyMode") || "name",
            proficiency: value("proficiency"),
            babMode: value("babMode") || "standard",
            standardBabBonus: Number(value("standardBabBonus") || 0),
            standardBabBonusScale:
              row.querySelector('[data-generated-scale="standard-bab"]')
                ?._bonusScale || null,
            customBab: Number(value("customBab") || 0),
            customBabScale:
              row.querySelector('[data-generated-scale="custom-bab"]')
                ?._bonusScale || null,
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
            '[data-generated-equipment-field="armorEnhancement"]',
          ).value === ""
            ? 0
            : Number(
                row.querySelector(
                  '[data-generated-equipment-field="armorEnhancement"]',
                ).value,
              ),
          enhancementScale:
            row.querySelector('[data-generated-scale="armor-enhancement"]')
              ?._bonusScale || null,
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

function damageDieOptions(selected = 6) {
  return [2, 3, 4, 6, 8, 10, 12, 20, 100]
    .map(
      (sides) =>
        `<option value="${sides}"${Number(selected) === sides ? " selected" : ""}>d${sides}</option>`,
    )
    .join("");
}

function damageProfileMarkup(data = {}, { conditional = false } = {}) {
  const maximum = (value) =>
    value === null || value === undefined || value === "" ? "" : Number(value);
  return `
    <div class="shared-damage-profile${conditional ? " is-conditional" : ""}" data-damage-profile>
      ${
        conditional
          ? `<div class="shared-damage-condition-heading">
              <div><label>Profile Name</label><input class="form-control form-control-sm" data-damage-field="label" value="${escapeHtml(data.label || "")}" placeholder="Undead"></div>
              <div><label>Applies When</label><input class="form-control form-control-sm" data-damage-field="appliesWhen" value="${escapeHtml(data.appliesWhen || "")}" placeholder="Target is undead"></div>
              <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-damage-profile aria-label="Delete conditional damage"><i class="bi bi-trash"></i></button>
            </div>`
          : `<div class="small text-secondary mb-2">Standard damage</div>`
      }
      <div class="shared-damage-profile-grid">
        <div><label>Number of Dice</label>${numberStepperMarkup({ id: "damage-dice-count", value: Math.max(0, Number(data.diceCount || 0)), min: 0, inputAttributes: 'data-damage-field="diceCount"', label: "number of damage dice" })}</div>
        <div><label>Die</label><select class="form-select form-select-sm" data-damage-field="dieType">${damageDieOptions(data.dieType || 6)}</select></div>
        <div><label>Maximum Dice</label>${numberStepperMarkup({ id: "damage-dice-max", value: maximum(data.diceCountMax), min: 0, inputAttributes: 'data-damage-field="diceCountMax" placeholder="No maximum"', label: "maximum damage dice" })}</div>
        <div><label>Static Damage</label>${numberStepperMarkup({ id: "damage-static", value: Number(data.staticDamage || 0), inputAttributes: 'data-damage-field="staticDamage"', label: "static damage" })}</div>
        <div><label>Maximum Static</label>${numberStepperMarkup({ id: "damage-static-max", value: maximum(data.staticDamageMax), min: 0, inputAttributes: 'data-damage-field="staticDamageMax" placeholder="No maximum"', label: "maximum static damage" })}</div>
        <div><label>Denominator</label>${numberStepperMarkup({ id: "damage-denominator", value: Math.max(1, Number(data.damageDenominator || 1)), min: 1, inputAttributes: 'data-damage-field="damageDenominator"', label: "damage denominator" })}</div>
        <div><label>Damage Type</label><input class="form-control form-control-sm" list="sharedDamageTypes" data-damage-field="damageType" value="${escapeHtml(data.damageType || "untyped")}" placeholder="fire"></div>
      </div>
      <div class="shared-damage-scale-row">
        <div data-damage-scale-host="dice"><button class="btn btn-outline-info btn-sm" type="button" data-damage-scale-button>Scale Dice</button><span class="small text-secondary" data-damage-scale-summary></span></div>
        <div data-damage-scale-host="static"><button class="btn btn-outline-info btn-sm" type="button" data-damage-scale-button>Scale Static</button><span class="small text-secondary" data-damage-scale-summary></span></div>
      </div>
    </div>`;
}

function wireDamageProfile(profile, data = {}) {
  wireNumberSteppers(profile);
  const diceHost = profile.querySelector('[data-damage-scale-host="dice"]');
  const staticHost = profile.querySelector('[data-damage-scale-host="static"]');
  wireScaleButton(
    diceHost,
    data.diceCountScale || null,
    diceHost.querySelector("[data-damage-scale-summary]"),
    diceHost.querySelector("[data-damage-scale-button]"),
  );
  wireScaleButton(
    staticHost,
    data.staticDamageScale || null,
    staticHost.querySelector("[data-damage-scale-summary]"),
    staticHost.querySelector("[data-damage-scale-button]"),
  );
}

function collectDamageProfile(profile, { conditional = false } = {}) {
  const value = (key) =>
    profile.querySelector(`[data-damage-field="${key}"]`)?.value ?? "";
  const optionalNumber = (key) => {
    const raw = value(key);
    return raw === "" ? null : Number(raw);
  };
  const diceHost = profile.querySelector('[data-damage-scale-host="dice"]');
  const staticHost = profile.querySelector('[data-damage-scale-host="static"]');
  return {
    ...(conditional
      ? {
          label: value("label").trim() || "Conditional damage",
          appliesWhen: value("appliesWhen").trim(),
        }
      : {}),
    diceCount: Math.max(0, Number(value("diceCount")) || 0),
    dieType: Math.max(2, Number(value("dieType")) || 6),
    diceCountMax: optionalNumber("diceCountMax"),
    staticDamage: Number(value("staticDamage")) || 0,
    staticDamageMax: optionalNumber("staticDamageMax"),
    damageDenominator: Math.max(1, Number(value("damageDenominator")) || 1),
    damageType: value("damageType").trim() || "untyped",
    diceCountScale: diceHost?._bonusScale || null,
    staticDamageScale: staticHost?._bonusScale || null,
  };
}

function createPeriodicEffectRow(data = {}, { onDelete, onChange } = {}) {
  const normalized = window.PFPeriodicEffects?.normalize?.(data) || data;
  const row = document.createElement("div");
  row.className = "shared-periodic-effect-row";
  row.innerHTML = `
    <div class="shared-damage-roll-heading">
      <div><label>Name</label><input class="form-control form-control-sm" data-periodic-field="label" value="${escapeHtml(normalized.label || "Periodic Effect")}"></div>
      <div class="shared-mechanic-row-actions"><button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-periodic aria-label="Delete periodic effect"><i class="bi bi-trash"></i></button></div>
    </div>
    <div class="shared-damage-profile-grid mb-2">
      <div><label>Operation</label><select class="form-select form-select-sm" data-periodic-field="operation"><option value="damage">HP Damage</option><option value="healing">Healing</option><option value="ability-damage">Ability Damage</option><option value="ability-drain">Ability Drain</option></select></div>
      <div><label>Timing</label><select class="form-select form-select-sm" data-periodic-field="timing"><option value="target-turn-start">Beginning of target turn</option><option value="target-turn-end">End of target turn</option><option value="caster-turn-start">Beginning of caster turn</option><option value="caster-turn-end">End of caster turn</option></select></div>
      <div><label>Delivery</label><select class="form-select form-select-sm" data-periodic-field="delivery"><option value="attached">Attached effect</option><option value="area">Aura occupants only</option></select></div>
      <div data-periodic-ability><label>Ability</label><select class="form-select form-select-sm" data-periodic-field="ability">${(window.PFConditionConfig?.CONCRETE_ABILITIES || [["strength", "Strength"], ["dexterity", "Dexterity"], ["constitution", "Constitution"], ["intelligence", "Intelligence"], ["wisdom", "Wisdom"], ["charisma", "Charisma"]]).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></div>
    </div>
    <div data-periodic-formula>${damageProfileMarkup({ ...normalized, staticDamage: normalized.staticValue, staticDamageMax: normalized.staticValueMax })}</div>`;
  row.querySelector('[data-periodic-field="operation"]').value = normalized.operation || "damage";
  row.querySelector('[data-periodic-field="timing"]').value = normalized.timing || "target-turn-end";
  row.querySelector('[data-periodic-field="delivery"]').value = normalized.delivery || "attached";
  row.querySelector('[data-periodic-field="ability"]').value = normalized.ability || "strength";
  const profile = row.querySelector("[data-damage-profile]");
  profile.querySelector(".small.text-secondary")?.remove();
  profile.querySelector('[data-damage-field="damageDenominator"]')?.closest("div")?.remove();
  wireDamageProfile(profile, {
    ...normalized,
    staticDamageScale: normalized.staticValueScale,
  });
  const sync = () => {
    const operation = row.querySelector('[data-periodic-field="operation"]').value;
    row.querySelector("[data-periodic-ability]").classList.toggle(
      "d-none",
      !["ability-damage", "ability-drain"].includes(operation),
    );
    const damageType = profile.querySelector('[data-damage-field="damageType"]')?.closest("div");
    damageType?.classList.toggle("d-none", operation !== "damage");
  };
  row.querySelector("[data-delete-periodic]").addEventListener("click", () => {
    row.remove();
    onDelete?.();
  });
  row.addEventListener("input", () => onChange?.());
  row.addEventListener("change", () => {
    sync();
    onChange?.();
  });
  row._collect = () => {
    const damage = collectDamageProfile(profile);
    return window.PFPeriodicEffects?.normalize?.({
      id: normalized.id,
      label: row.querySelector('[data-periodic-field="label"]').value,
      operation: row.querySelector('[data-periodic-field="operation"]').value,
      timing: row.querySelector('[data-periodic-field="timing"]').value,
      delivery: row.querySelector('[data-periodic-field="delivery"]').value,
      ability: row.querySelector('[data-periodic-field="ability"]').value,
      diceCount: damage.diceCount,
      dieType: damage.dieType,
      diceCountMax: damage.diceCountMax,
      diceCountScale: damage.diceCountScale,
      staticValue: damage.staticDamage,
      staticValueMax: damage.staticDamageMax,
      staticValueScale: damage.staticDamageScale,
      damageType: damage.damageType,
    });
  };
  sync();
  return { element: row, collect: row._collect };
}

function createDamageRollRow(data = {}, { onDelete, onChange } = {}) {
  const row = document.createElement("div");
  row.className = "shared-damage-roll-row";
  row.innerHTML = `
    <div class="shared-damage-roll-heading">
      <div><label>Roll Name</label><input class="form-control form-control-sm" data-damage-roll-label value="${escapeHtml(data.label || "Damage")}" placeholder="Ray damage"></div>
      <div class="shared-mechanic-row-actions">
        <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-damage-roll aria-label="Delete damage roll"><i class="bi bi-trash"></i></button>
      </div>
    </div>
    <div data-damage-standard>${damageProfileMarkup(data)}</div>
    <div class="shared-damage-conditionals">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-2"><span class="small text-secondary">Conditional replacements</span><button class="btn btn-outline-info btn-sm" type="button" data-add-damage-profile>Add Conditional</button></div>
      <div class="vstack gap-2" data-damage-conditionals></div>
    </div>`;
  const standard = row.querySelector("[data-damage-standard] [data-damage-profile]");
  const conditionalRows = row.querySelector("[data-damage-conditionals]");
  wireDamageProfile(standard, data);
  const addConditional = (conditional = {}) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = damageProfileMarkup(conditional, { conditional: true });
    const profile = wrapper.firstElementChild;
    conditionalRows.appendChild(profile);
    wireDamageProfile(profile, conditional);
    profile
      .querySelector("[data-delete-damage-profile]")
      .addEventListener("click", () => {
        profile.remove();
        onChange?.();
      });
  };
  (Array.isArray(data.conditionals) ? data.conditionals : []).forEach(addConditional);
  row.querySelector("[data-add-damage-profile]").addEventListener("click", () => {
    addConditional();
    onChange?.();
  });
  row.querySelector("[data-delete-damage-roll]").addEventListener("click", () => {
    row.remove();
    onDelete?.();
  });
  row.addEventListener("input", () => onChange?.());
  row.addEventListener("change", () => onChange?.());
  row.querySelectorAll("[data-damage-scale-button]").forEach((button) =>
    button.addEventListener("click", () => onChange?.()),
  );
  row._collect = () => ({
    label: row.querySelector("[data-damage-roll-label]").value.trim() || "Damage",
    ...collectDamageProfile(standard),
    conditionals: [...conditionalRows.querySelectorAll(":scope > [data-damage-profile]")].map(
      (profile) => collectDamageProfile(profile, { conditional: true }),
    ),
  });
  return { element: row, collect: row._collect };
}

let independentEffectEditorSequence = 0;

function mountIndependentEffects(container, options = {}) {
  const rows = [];
  const trigger = options.trigger || { scope: "main", outcome: "applied" };
  let triggerEnabled = Boolean(options.triggerVisible);
  const add = (data = {}) => {
    const sequence = ++independentEffectEditorSequence;
    const id = String(data.id || `independent-effect-${sequence}`);
    const row = document.createElement("section");
    row.className = "shared-independent-effect";
    const selectedOutcome = String(data.trigger?.outcome || trigger.outcome || "applied");
    const outcomeControl = trigger.scope === "main"
      ? `<div data-independent-trigger-wrap><label>Trigger</label><select class="form-select form-select-sm" data-independent-outcome${triggerEnabled ? "" : " disabled"}><option value="applied"${selectedOutcome === "applied" ? " selected" : ""}>Main effect applies</option><option value="save-failure"${selectedOutcome === "save-failure" ? " selected" : ""}>Main save fails</option><option value="save-success"${selectedOutcome === "save-success" ? " selected" : ""}>Main save succeeds</option><option value="partial"${selectedOutcome === "partial" ? " selected" : ""}>Main partial applies</option></select><div class="small-text${triggerEnabled ? " d-none" : ""}" data-independent-trigger-note>Configure the main Save to choose a save outcome.</div></div>`
      : "";
    row.innerHTML = `<div class="shared-independent-effect-header${trigger.scope === "main" ? " has-trigger" : ""}"><div><label>Name</label><input class="form-control form-control-sm" data-independent-name value="${escapeHtml(data.name || "Independent Effect")}"></div>${outcomeControl}<button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-independent aria-label="Delete independent effect"><i class="bi bi-trash"></i></button></div><div data-independent-mechanics></div>`;
    container.appendChild(row);
    const editor = mountMechanicGroups(row.querySelector("[data-independent-mechanics]"), {
      ...options,
      idPrefix: `${options.idPrefix || "Independent"}${sequence}`,
      activeOnly: true,
      allowIndependentEffects: false,
      onChange: options.onChange,
    });
    editor.reset({ activeMechanics: data });
    const record = { id, row, editor };
    rows.push(record);
    row.querySelector("[data-delete-independent]").addEventListener("click", () => {
      const index = rows.indexOf(record);
      if (index >= 0) rows.splice(index, 1);
      row.remove();
      options.onChange?.();
    });
    row.addEventListener("input", () => options.onChange?.());
    row.addEventListener("change", () => options.onChange?.());
    options.onChange?.();
  };
  const reset = (item = {}) => {
    rows.splice(0);
    container.innerHTML = "";
    (window.PFEffectMechanics?.independentEffects?.(item) || []).forEach(add);
  };
  const setTriggerVisible = (visible) => {
    triggerEnabled = trigger.scope === "main" && Boolean(visible);
    rows.forEach(({ row }) => {
      const select = row.querySelector("[data-independent-outcome]");
      if (select) select.disabled = !triggerEnabled;
      row.querySelector("[data-independent-trigger-note]")?.classList.toggle(
        "d-none",
        triggerEnabled,
      );
    });
  };
  const collect = () => rows.map(({ id, row, editor }, index) => {
    const collected = editor.collect().activeMechanics || {};
    delete collected.independentEffects;
    (Array.isArray(collected.attackRolls) ? collected.attackRolls : []).forEach(
      (attack) => delete attack.independentEffects,
    );
    return {
      id,
      name: row.querySelector("[data-independent-name]").value.trim() || `Independent Effect ${index + 1}`,
      trigger: {
        scope: trigger.scope,
        outcome: row.querySelector("[data-independent-outcome]")?.value || trigger.outcome || "applied",
        ...(trigger.sourceId ? { sourceId: trigger.sourceId } : {}),
      },
      ...collected,
    };
  });
  return { add, reset, collect, setTriggerVisible };
}

let attackEditorSequence = 0;

function createAttackRollRow(
  data = {},
  { onDelete, onChange, skills, effectStats, titleCaseStat: formatStat, allowIndependentEffects = true } = {},
) {
  const row = document.createElement("div");
  const sequence = ++attackEditorSequence;
  const editorPrefix = `SharedAttack${sequence}`;
  const attackId = String(data.id || `attack-${sequence}`);
  const hasStoredCustomBab =
    data.customBab !== null &&
    data.customBab !== undefined &&
    (Number(data.customBab) !== 0 || Boolean(data.customBabScale));
  const customBab = hasStoredCustomBab ? Number(data.customBab) : "";
  row.className = "shared-attack-roll-row";
  row.innerHTML = `
    <div class="shared-attack-roll-heading">
      <div><label>Attack Name</label><input class="form-control form-control-sm" data-attack-field="label" value="${escapeHtml(data.label || "Attack")}" placeholder="Ray attack"></div>
      <div class="shared-mechanic-row-actions">
        <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-attack-roll aria-label="Delete attack roll"><i class="bi bi-trash"></i></button>
      </div>
    </div>
    <div class="shared-attack-roll-grid">
      <div><label>Number of Attacks</label>${numberStepperMarkup({ id: `attack-count-${sequence}`, value: Math.max(1, Number(data.attackCount || 1)), min: 1, inputAttributes: 'data-attack-field="attackCount"', label: "number of attacks" })}</div>
      <div><label>Maximum Attacks</label>${numberStepperMarkup({ id: `attack-count-max-${sequence}`, value: data.attackCountMax ?? "", min: 1, inputAttributes: 'data-attack-field="attackCountMax" placeholder="No maximum"', label: "maximum attacks" })}</div>
      <div><label>Roll Type</label><select class="form-select form-select-sm" data-attack-field="attackType">
        <option value="melee"${data.attackType === "melee" ? " selected" : ""}>Melee Attack</option>
        <option value="ranged"${data.attackType === "ranged" ? " selected" : ""}>Ranged Attack</option>
        <option value="melee-touch"${!data.attackType || data.attackType === "melee-touch" ? " selected" : ""}>Melee Touch Attack</option>
        <option value="ranged-touch"${data.attackType === "ranged-touch" ? " selected" : ""}>Ranged Touch Attack</option>
        <option value="cmb-bull-rush"${data.attackType === "cmb-bull-rush" ? " selected" : ""}>Bull Rush</option>
        <option value="cmb-dirty-trick"${data.attackType === "cmb-dirty-trick" ? " selected" : ""}>Dirty Trick</option>
        <option value="cmb-disarm"${data.attackType === "cmb-disarm" ? " selected" : ""}>Disarm</option>
        <option value="cmb-drag"${data.attackType === "cmb-drag" ? " selected" : ""}>Drag</option>
        <option value="cmb-grapple"${data.attackType === "cmb-grapple" ? " selected" : ""}>Grapple</option>
        <option value="cmb-overrun"${data.attackType === "cmb-overrun" ? " selected" : ""}>Overrun</option>
        <option value="cmb-reposition"${data.attackType === "cmb-reposition" ? " selected" : ""}>Reposition</option>
        <option value="cmb-steal"${data.attackType === "cmb-steal" ? " selected" : ""}>Steal</option>
        <option value="cmb-sunder"${data.attackType === "cmb-sunder" ? " selected" : ""}>Sunder</option>
        <option value="cmb-trip"${data.attackType === "cmb-trip" ? " selected" : ""}>Trip</option>
      </select></div>
      <div><label>Ability</label><select class="form-select form-select-sm" data-attack-field="attackAbility">
        <option value="default"${!data.attackAbility || data.attackAbility === "default" ? " selected" : ""}>Default for Roll</option>
        <option value="casting"${data.attackAbility === "casting" ? " selected" : ""}>Casting Modifier</option>
        <option value="str"${data.attackAbility === "str" ? " selected" : ""}>Strength</option>
        <option value="dex"${data.attackAbility === "dex" ? " selected" : ""}>Dexterity</option>
        <option value="con"${data.attackAbility === "con" ? " selected" : ""}>Constitution</option>
        <option value="int"${data.attackAbility === "int" ? " selected" : ""}>Intelligence</option>
        <option value="wis"${data.attackAbility === "wis" ? " selected" : ""}>Wisdom</option>
        <option value="cha"${data.attackAbility === "cha" ? " selected" : ""}>Charisma</option>
      </select></div>
      <div><label>Custom BAB</label><input class="form-control form-control-sm" type="number" data-attack-field="customBab" value="${escapeHtml(customBab)}" placeholder="Use caster BAB"></div>
    </div>
    <div class="shared-attack-scale-row">
      <div data-attack-scale-host="count"><button class="btn btn-outline-info btn-sm" type="button" data-attack-scale-button>Scale Attacks</button><span class="small text-secondary" data-attack-scale-summary></span></div>
      <div data-attack-scale-host="original-bab"><button class="btn btn-outline-info btn-sm" type="button" data-attack-scale-button>Scale Original BAB</button><span class="small text-secondary" data-attack-scale-summary></span></div>
      <div data-attack-scale-host="bab"><button class="btn btn-outline-info btn-sm" type="button" data-attack-scale-button>Scale Custom BAB</button><span class="small text-secondary" data-attack-scale-summary></span></div>
      <label class="form-check form-switch shared-attack-multiple-targets">
        <input class="form-check-input" type="checkbox" role="switch" data-attack-field="multipleTargets"${data.multipleTargets ? " checked" : ""}>
        <span class="form-check-label">Multiple Targets</span>
      </label>
    </div>
    <div class="shared-attack-payload-heading"><span>On Success</span>${allowIndependentEffects ? `<button class="btn btn-outline-info btn-sm" type="button" data-add-attack-independent>Add Independent Effect</button>` : ""}</div>
    <div data-attack-payload></div>
    <div data-attack-independent-effects></div>`;

  const countHost = row.querySelector('[data-attack-scale-host="count"]');
  const originalBabHost = row.querySelector('[data-attack-scale-host="original-bab"]');
  const babHost = row.querySelector('[data-attack-scale-host="bab"]');
  wireScaleButton(
    countHost,
    data.attackCountScale || null,
    countHost.querySelector("[data-attack-scale-summary]"),
    countHost.querySelector("[data-attack-scale-button]"),
  );
  wireScaleButton(
    originalBabHost,
    data.originalBabScale || null,
    originalBabHost.querySelector("[data-attack-scale-summary]"),
    originalBabHost.querySelector("[data-attack-scale-button]"),
  );
  wireScaleButton(
    babHost,
    data.customBabScale || null,
    babHost.querySelector("[data-attack-scale-summary]"),
    babHost.querySelector("[data-attack-scale-button]"),
  );
  const syncBabScaleMode = () => {
    const usesCustomBab =
      row.querySelector('[data-attack-field="customBab"]').value !== "";
    originalBabHost.classList.toggle("d-none", usesCustomBab);
    babHost.classList.toggle("d-none", !usesCustomBab);
  };
  row
    .querySelector('[data-attack-field="customBab"]')
    .addEventListener("input", syncBabScaleMode);
  syncBabScaleMode();

  let payloadEditor = null;
  let independentEditor = null;
  const initialize = () => {
    payloadEditor = mountEffectsAccordion(row.querySelector("[data-attack-payload]"), {
      idPrefix: editorPrefix,
      skills,
      effectStats,
      titleCaseStat: formatStat,
      allowAttackRolls: false,
      onChange,
    });
    payloadEditor.reset(data);
    if (allowIndependentEffects) {
      independentEditor = mountIndependentEffects(
        row.querySelector("[data-attack-independent-effects]"),
        {
          idPrefix: `${editorPrefix}Independent`,
          trigger: { scope: "attack", outcome: "success", sourceId: attackId },
          skills,
          effectStats,
          titleCaseStat: formatStat,
          onChange,
        },
      );
      independentEditor.reset(data);
      row.querySelector("[data-add-attack-independent]").addEventListener(
        "click",
        () => independentEditor.add(),
      );
    }
  };
  row.querySelector("[data-delete-attack-roll]").addEventListener("click", () => {
    row.remove();
    onDelete?.();
  });
  row.addEventListener("input", () => onChange?.());
  row.addEventListener("change", () => onChange?.());
  row._collect = () => {
    const customBabInput = row.querySelector('[data-attack-field="customBab"]');
    const hasCustomBab = customBabInput.value !== "";
    return {
      id: attackId,
      label:
        row.querySelector('[data-attack-field="label"]').value.trim() ||
        "Attack",
      attackCount: Math.max(
        1,
        Number(row.querySelector('[data-attack-field="attackCount"]').value) || 1,
      ),
      attackCountScale: countHost._bonusScale || null,
      attackCountMax: (() => {
        const value = row.querySelector(
          '[data-attack-field="attackCountMax"]',
        ).value;
        return value === "" ? null : Math.max(1, Math.floor(Number(value) || 1));
      })(),
      attackType: row.querySelector('[data-attack-field="attackType"]').value,
      attackAbility: row.querySelector('[data-attack-field="attackAbility"]').value,
      multipleTargets: row.querySelector('[data-attack-field="multipleTargets"]').checked,
      originalBabScale: hasCustomBab
        ? null
        : originalBabHost._bonusScale || null,
      customBab: hasCustomBab ? Number(customBabInput.value) : null,
      customBabScale: hasCustomBab ? babHost._bonusScale || null : null,
      ...(payloadEditor?.collect?.() || {}),
      ...(independentEditor?.collect().length
        ? { independentEffects: independentEditor.collect() }
        : {}),
    };
  };
  return { element: row, collect: row._collect, initialize };
}

let d20BoostEditorSequence = 0;

function createD20BoostRow(data = {}, { onDelete, onChange } = {}) {
  const row = document.createElement("div");
  const sequence = ++d20BoostEditorSequence;
  const appliesTo = new Set(
    Array.isArray(data.appliesTo) && data.appliesTo.length ? data.appliesTo : ["all"],
  );
  const scopeOptions = [
    ["all", "All"], ["attacks", "Attacks"], ["saves", "Saves"],
    ["skills", "Skill Checks"], ["cmb", "CMB Checks"],
    ["cmd", "CMD Checks"], ["abilities", "Ability Checks"],
  ];
  row.className = "shared-d20-boost-row";
  row.innerHTML = `
    <div class="shared-d20-boost-heading">
      <div><label>Name</label><input class="form-control form-control-sm" data-d20-boost-field="label" value="${escapeHtml(data.label || "Boost d20")}"></div>
      <div class="shared-mechanic-row-actions">
        <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-d20-boost aria-label="Delete d20 boost"><i class="bi bi-trash"></i></button>
      </div>
    </div>
    <div class="shared-d20-boost-grid">
      <div><label>Number of Dice</label>${numberStepperMarkup({ id: `d20-boost-dice-${sequence}`, value: Math.max(0, Number(data.diceCount || 0)), min: 0, inputAttributes: 'data-d20-boost-field="diceCount"', label: "number of boost dice" })}</div>
      <div><label>Die</label><select class="form-select form-select-sm" data-d20-boost-field="dieType">${damageDieOptions(data.dieType || 6)}</select></div>
      <div><label>Static</label>${numberStepperMarkup({ id: `d20-boost-static-${sequence}`, value: Number(data.staticValue || 0), inputAttributes: 'data-d20-boost-field="staticValue"', label: "static boost" })}</div>
      <div><label>Uses</label>${numberStepperMarkup({ id: `d20-boost-uses-${sequence}`, value: Math.max(0, Number(data.uses ?? 1)), min: 0, inputAttributes: 'data-d20-boost-field="uses"', label: "boost uses" })}</div>
      <div><label>Times Per</label><select class="form-select form-select-sm" data-d20-boost-field="usesPeriod"><option value="day"${(data.usesPeriod || "day") === "day" ? " selected" : ""}>Day</option><option value="effect"${data.usesPeriod === "effect" ? " selected" : ""}>Effect</option><option value="rage"${data.usesPeriod === "rage" ? " selected" : ""}>Rage / Raging Song</option></select></div>
      <div><label>Bonus Type</label><select class="form-select form-select-sm" data-d20-boost-field="bonusType">${BONUS_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${(data.bonusType || "untyped") === type ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></div>
    </div>
    <div class="shared-d20-boost-scales">
      <div data-d20-boost-scale-host="dice"><button class="btn btn-outline-info btn-sm" type="button" data-d20-boost-scale>Scale Dice</button><span class="small text-secondary" data-d20-boost-scale-summary></span></div>
      <div data-d20-boost-scale-host="static"><button class="btn btn-outline-info btn-sm" type="button" data-d20-boost-scale>Scale Static</button><span class="small text-secondary" data-d20-boost-scale-summary></span></div>
      <div data-d20-boost-scale-host="uses"><button class="btn btn-outline-info btn-sm" type="button" data-d20-boost-scale>Scale Uses</button><span class="small text-secondary" data-d20-boost-scale-summary></span></div>
    </div>
    <fieldset class="shared-d20-boost-scope"><legend>Applies To</legend>${scopeOptions.map(([value, label]) => `<label class="form-check"><input class="form-check-input" type="checkbox" data-d20-boost-scope="${value}" ${appliesTo.has(value) ? "checked" : ""}><span class="form-check-label">${label}</span></label>`).join("")}</fieldset>`;
  wireNumberSteppers(row);
  const scaleHosts = Object.fromEntries(["dice", "static", "uses"].map((key) => [key, row.querySelector(`[data-d20-boost-scale-host="${key}"]`)]));
  [["dice", data.diceCountScale], ["static", data.staticValueScale], ["uses", data.usesScale]].forEach(([key, scale]) => {
    const host = scaleHosts[key];
    wireScaleButton(host, scale || null, host.querySelector("[data-d20-boost-scale-summary]"), host.querySelector("[data-d20-boost-scale]"));
  });
  const all = row.querySelector('[data-d20-boost-scope="all"]');
  const scopes = [...row.querySelectorAll("[data-d20-boost-scope]")];
  scopes.forEach((input) => input.addEventListener("change", () => {
    if (input === all && all.checked) scopes.forEach((candidate) => { if (candidate !== all) candidate.checked = false; });
    if (input !== all && input.checked) all.checked = false;
    if (!scopes.some((candidate) => candidate.checked)) all.checked = true;
    onChange?.();
  }));
  row.querySelector("[data-delete-d20-boost]").addEventListener("click", () => { row.remove(); onDelete?.(); });
  row.addEventListener("input", () => onChange?.());
  row.addEventListener("change", () => onChange?.());
  row._collect = () => ({
    id: String(data.id || `d20-boost-${sequence}`),
    label: row.querySelector('[data-d20-boost-field="label"]').value.trim() || "Boost d20",
    diceCount: Math.max(0, Number(row.querySelector('[data-d20-boost-field="diceCount"]').value) || 0),
    dieType: Math.max(2, Number(row.querySelector('[data-d20-boost-field="dieType"]').value) || 6),
    diceCountScale: scaleHosts.dice._bonusScale || null,
    staticValue: Number(row.querySelector('[data-d20-boost-field="staticValue"]').value) || 0,
    staticValueScale: scaleHosts.static._bonusScale || null,
    uses: Math.max(0, Number(row.querySelector('[data-d20-boost-field="uses"]').value) || 0),
    usesScale: scaleHosts.uses._bonusScale || null,
    usesPeriod: row.querySelector('[data-d20-boost-field="usesPeriod"]').value,
    appliesTo: scopes.filter((input) => input.checked).map((input) => input.dataset.d20BoostScope),
    bonusType: row.querySelector('[data-d20-boost-field="bonusType"]').value || "untyped",
  });
  return { element: row, collect: row._collect };
}

  // DR, Immunities, SR, applied conditions, Class Skill grants, bonus feats,
  // Size Changes, caster level/DC bonuses, Spell-Like Abilities, and generated equipped weapons/armor
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
            <datalist id="sharedDamageTypes"><option value="acid"><option value="bludgeoning"><option value="cold"><option value="electricity"><option value="fire"><option value="force"><option value="light"><option value="negative energy"><option value="piercing"><option value="positive energy"><option value="precision"><option value="slashing"><option value="sonic"><option value="untyped"></datalist>
            ${options.allowAttackRolls === false ? "" : `<div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Attacks</div>
                <button id="${prefix}AddAttackRoll" class="btn btn-outline-info btn-sm" type="button">Add Attack</button>
              </div>
              <div id="${prefix}AttackRollRows" class="vstack gap-2"></div>
            </div>`}
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2"><div class="small text-secondary">Boost d20s</div><button id="${prefix}AddD20Boost" class="btn btn-outline-info btn-sm" type="button">Add d20 Boost</button></div>
              <div id="${prefix}D20BoostRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Damage</div>
                <button id="${prefix}AddDamageRoll" class="btn btn-outline-info btn-sm" type="button">Add Damage Roll</button>
              </div>
              <div id="${prefix}DamageRollRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Periodic Effects</div>
                <button id="${prefix}AddPeriodicEffect" class="btn btn-outline-info btn-sm" type="button">Add Periodic Effect</button>
              </div>
              <div id="${prefix}PeriodicEffectRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Equipped Weapon Extra Damage</div>
                <button id="${prefix}AddWeaponExtraDamage" class="btn btn-outline-info btn-sm" type="button">Add Weapon Damage</button>
              </div>
              <div id="${prefix}WeaponExtraDamageRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Weapon Damage Size</div>
                <button id="${prefix}AddWeaponDamageSize" class="btn btn-outline-info btn-sm" type="button">Add Size Rule</button>
              </div>
              <div id="${prefix}WeaponDamageSizeRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Summoned Creatures</div>
                <button id="${prefix}AddSummonCreatures" class="btn btn-outline-info btn-sm" type="button">Add Summon</button>
              </div>
              <div id="${prefix}SummonCreatureRows" class="vstack gap-2"></div>
            </div>
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
                <div class="d-flex gap-2">
                  <button id="${prefix}AddSr" class="btn btn-outline-info btn-sm" type="button">Add SR</button>
                  <button id="${prefix}IncreaseSr" class="btn btn-outline-info btn-sm" type="button">Increase SR</button>
                </div>
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
                <div class="small text-secondary">Use Untrained</div>
                <button id="${prefix}AddUseUntrained" class="btn btn-outline-info btn-sm" type="button">Add Rule</button>
              </div>
              <div id="${prefix}UseUntrainedRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Bonus Ranks</div>
                <button id="${prefix}AddBonusRanks" class="btn btn-outline-info btn-sm" type="button">Add Bonus Ranks</button>
              </div>
              <div id="${prefix}BonusRanksRows" class="vstack gap-2"></div>
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
                <div class="small text-secondary">Grant Domain</div>
                <button id="${prefix}AddGrantDomain" class="btn btn-outline-info btn-sm" type="button">Add Domain</button>
              </div>
              <div id="${prefix}GrantDomainRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Gain Feat</div>
                <button id="${prefix}AddFeatGrant" class="btn btn-outline-info btn-sm" type="button">Add Feat</button>
              </div>
              <div id="${prefix}FeatGrantRows" class="vstack gap-2"></div>
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
                <div class="small text-secondary">Effective Attribute Bonuses</div>
                <button id="${prefix}AddEffectiveAttributeBonus" class="btn btn-outline-info btn-sm" type="button">Add Attribute</button>
              </div>
              <div id="${prefix}EffectiveAttributeBonusRows" class="vstack gap-2"></div>
            </div>            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Attributes Applied to Stats</div>
                <button id="${prefix}AddAttributeContribution" class="btn btn-outline-info btn-sm" type="button">Add Attribute Rule</button>
              </div>
              <div id="${prefix}AttributeContributionRows" class="vstack gap-2"></div>
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
            <div class="shared-extra-subsection">
              <div id="${prefix}SpecialToggleRows" class="vstack gap-2"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const attackRollRowsEl = document.getElementById(`${prefix}AttackRollRows`);
    const d20BoostRowsEl = document.getElementById(`${prefix}D20BoostRows`);
    const damageRollRowsEl = document.getElementById(`${prefix}DamageRollRows`);
    const periodicEffectRowsEl = document.getElementById(`${prefix}PeriodicEffectRows`);
    const weaponExtraDamageRowsEl = document.getElementById(
      `${prefix}WeaponExtraDamageRows`,
    );
    const weaponDamageSizeRowsEl = document.getElementById(
      `${prefix}WeaponDamageSizeRows`,
    );
    const summonCreatureRowsEl = document.getElementById(`${prefix}SummonCreatureRows`);
    const drRowsEl = document.getElementById(`${prefix}DrRows`);
    const srRowsEl = document.getElementById(`${prefix}SrRows`);
    const immunityRowsEl = document.getElementById(`${prefix}ImmunityRows`);
    const applyConditionRowsEl = document.getElementById(
      `${prefix}ApplyConditionRows`,
    );
    const csRowsEl = document.getElementById(`${prefix}ClassSkillRows`);
    const useUntrainedRowsEl = document.getElementById(
      `${prefix}UseUntrainedRows`,
    );
    const bonusRanksRowsEl = document.getElementById(`${prefix}BonusRanksRows`);
    const extraRanksRowsEl = document.getElementById(
      `${prefix}ExtraRanksPerLevelRows`,
    );
    const grantDomainRowsEl = document.getElementById(
      `${prefix}GrantDomainRows`,
    );
    const featGrantRowsEl = document.getElementById(`${prefix}FeatGrantRows`);
    const sizeRowsEl = document.getElementById(`${prefix}SizeChangeRows`);
    const slaRowsEl = document.getElementById(`${prefix}SpellLikeAbilityRows`);
    const casterLevelRowsEl = document.getElementById(
      `${prefix}CasterLevelBonusRows`,
    );
    const spellDcRowsEl = document.getElementById(`${prefix}SpellDcBonusRows`);
    const effectiveAttributeRowsEl = document.getElementById(
      `${prefix}EffectiveAttributeBonusRows`,
    );    const attributeContributionRowsEl = document.getElementById(
      `${prefix}AttributeContributionRows`,
    );
    const generatedEquipmentRowsEl = document.getElementById(
      `${prefix}GeneratedEquipmentRows`,
    );
    const conditionalVariableRowsEl = document.getElementById(
      `${prefix}ConditionalVariableRows`,
    );
    const specialToggleRowsEl = document.getElementById(
      `${prefix}SpecialToggleRows`,
    );
    const countBadge = document.getElementById(`${prefix}Count`);

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    const updateCount = () => {
      const count =
        (attackRollRowsEl?.children.length || 0) +
        d20BoostRowsEl.children.length +
        damageRollRowsEl.children.length +
        periodicEffectRowsEl.children.length +
        weaponExtraDamageRowsEl.children.length +
        weaponDamageSizeRowsEl.children.length +
        summonCreatureRowsEl.children.length +
        drRowsEl.children.length +
        srRowsEl.children.length +
        immunityRowsEl.children.length +
        applyConditionRowsEl.children.length +
        csRowsEl.children.length +
        useUntrainedRowsEl.children.length +
        bonusRanksRowsEl.children.length +
        extraRanksRowsEl.children.length +
        grantDomainRowsEl.children.length +
        featGrantRowsEl.children.length +
        sizeRowsEl.children.length +
        slaRowsEl.children.length +
        casterLevelRowsEl.children.length +
        spellDcRowsEl.children.length +
        effectiveAttributeRowsEl.children.length +
        attributeContributionRowsEl.children.length +
        generatedEquipmentRowsEl.children.length +
        conditionalVariableRowsEl.children.length +
        collectRows(specialToggleRowsEl).length;
      if (countBadge) {
        countBadge.textContent = count ? String(count) : "";
        countBadge.classList.toggle("d-none", !count);
      }
      options.onChange?.();
    };

    const appendSavedRow = (rowsElement, element, data = {}) => {
      if (!element || !rowsElement) return;
      const deleteButton = element.querySelector(
        'button[aria-label^="Delete"], button[data-delete-d20-boost], button[data-delete-summon]',
      );
      if (deleteButton && typeof element._collect === "function") {
        let saveMode = data.saveMode || (data.saveConfig?.enabled ? "custom" : "shared");
        let saveConfig = data.saveConfig?.enabled
          ? JSON.parse(JSON.stringify(data.saveConfig))
          : null;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-outline-info btn-sm btn-icon";
        button.innerHTML = '<i class="bi bi-shield-check"></i>';
        button.setAttribute("aria-label", "Configure mechanic save");
        const sync = () => {
          button.classList.toggle("btn-info", saveMode === "custom");
          button.classList.toggle("btn-outline-info", saveMode !== "custom");
          button.classList.toggle("text-secondary", saveMode === "none");
          button.title = saveMode === "none"
            ? "No save for this mechanic"
            : saveMode === "custom"
              ? "This mechanic uses a custom save"
              : "This mechanic uses the ability save";
        };
        button.addEventListener("click", async () => {
          const updated = await openSaveConfigEditor(saveConfig, { rowMode: saveMode });
          if (!updated) return;
          saveMode = updated.mode;
          saveConfig = updated.config;
          sync();
          options.onChange?.();
        });
        deleteButton.before(button);
        const collect = element._collect.bind(element);
        element._collect = () => {
          const value = collect();
          if (!value || typeof value !== "object") return value;
          const next = { ...value };
          delete next.saveMode;
          delete next.saveConfig;
          if (saveMode === "none") next.saveMode = "none";
          if (saveMode === "custom" && saveConfig?.enabled)
            next.saveConfig = JSON.parse(JSON.stringify(saveConfig));
          return next;
        };
        sync();
      }
      rowsElement.appendChild(element);
    };

    const addAttackRoll = (data = {}) => {
      if (!attackRollRowsEl) return;
      const { element, initialize } = createAttackRollRow(data, {
        onDelete: updateCount,
        onChange: updateCount,
        skills: options.skills,
        effectStats: options.effectStats,
        titleCaseStat: options.titleCaseStat,
        allowIndependentEffects: options.allowIndependentEffects !== false,
      });
      appendSavedRow(attackRollRowsEl, element, data);
      initialize();
      updateCount();
    };

    const addDamageRoll = (data = {}) => {
      const { element } = createDamageRollRow(data, {
        onDelete: updateCount,
        onChange: updateCount,
      });
      appendSavedRow(damageRollRowsEl, element, data);
      updateCount();
    };
    const addPeriodicEffect = (data = {}) => {
      const { element } = createPeriodicEffectRow(data, {
        onDelete: updateCount,
        onChange: updateCount,
      });
      appendSavedRow(periodicEffectRowsEl, element, data);
      updateCount();
    };
    const addD20Boost = (data = {}) => {
      const { element } = createD20BoostRow(data, { onDelete: updateCount, onChange: updateCount });
      appendSavedRow(d20BoostRowsEl, element, data);
      updateCount();
    };
    const addWeaponExtraDamage = (data = {}) => {
      const { element } = createWeaponExtraDamageRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(weaponExtraDamageRowsEl, element, data);
      updateCount();
    };
    const addWeaponDamageSize = (data = {}) => {
      const { element } = createWeaponDamageSizeChangeRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(weaponDamageSizeRowsEl, element, data);
      updateCount();
    };
    const addSummonCreatures = (data = {}, { edit = false } = {}) => {
      const created = window.PFSummonCreatures?.createEditorRow?.(data, {
        onDelete: updateCount,
        onChange: updateCount,
      });
      if (!created?.element) return;
      appendSavedRow(summonCreatureRowsEl, created.element, data);
      updateCount();
      if (edit) created.element._edit?.();
    };
    const addDr = (data = {}) => {
      const { element } = createDrRow(data, { onDelete: updateCount });
      appendSavedRow(drRowsEl, element, data);
      updateCount();
    };
    const addSr = (data = {}) => {
      const { element } = createSrRow(data, { onDelete: updateCount });
      appendSavedRow(srRowsEl, element, data);
      updateCount();
    };
    const addImmunity = (data = {}) => {
      const { element } = createImmunityRow(data, { onDelete: updateCount });
      appendSavedRow(immunityRowsEl, element, data);
      updateCount();
    };
    const addApplyCondition = (data = {}) => {
      const { element } = createApplyConditionRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(applyConditionRowsEl, element, data);
      updateCount();
    };
    const addClassSkill = (data = {}) => {
      const { element } = createClassSkillRow(data, {
        onDelete: updateCount,
        skills: options.skills,
      });
      appendSavedRow(csRowsEl, element, data);
      updateCount();
    };
    const addUseUntrained = (data = {}) => {
      const { element } = createUseUntrainedRow(data, {
        onDelete: updateCount,
        skills: options.skills,
      });
      appendSavedRow(useUntrainedRowsEl, element, data);
      updateCount();
    };
    const addExtraRanksPerLevel = (data = {}) => {
      const { element } = createExtraRanksPerLevelRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(extraRanksRowsEl, element, data);
      updateCount();
    };
    const addBonusRanks = (data = {}) => {
      const { element } = createBonusRanksRow(data, {
        onDelete: updateCount,
        skills: options.skills,
      });
      appendSavedRow(bonusRanksRowsEl, element, data);
      updateCount();
    };
    const addGrantDomain = (data = {}) => {
      const { element } = createGrantDomainRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(grantDomainRowsEl, element, data);
      updateCount();
    };
    const addFeatGrant = (data = {}) => {
      const { element } = createFeatGrantRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(featGrantRowsEl, element, data);
      updateCount();
    };
    const addSizeChange = (data = {}) => {
      const { element } = createSizeChangeRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(sizeRowsEl, element, data);
      updateCount();
    };
    const addSpellLikeAbility = (data = {}) => {
      const { element } = createSpellLikeAbilityRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(slaRowsEl, element, data);
      updateCount();
    };
    const addCasterLevelBonus = (data = {}) => {
      const { element } = createSpellAdjustmentRow("casterLevel", data, {
        onDelete: updateCount,
      });
      appendSavedRow(casterLevelRowsEl, element, data);
      updateCount();
    };
    const addSpellDcBonus = (data = {}) => {
      const { element } = createSpellAdjustmentRow("spellDc", data, {
        onDelete: updateCount,
      });
      appendSavedRow(spellDcRowsEl, element, data);
      updateCount();
    };
    const addEffectiveAttributeBonus = (data = {}) => {
      const { element } = createEffectiveAttributeBonusRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(effectiveAttributeRowsEl, element, data);
      updateCount();
    };
    const addAttributeContribution = (data = {}) => {
      const { element } = createAttributeContributionRow(data, {
        onDelete: updateCount,
        onChange: updateCount,
      });
      appendSavedRow(attributeContributionRowsEl, element, data);
      updateCount();
    };
    const addGeneratedEquipment = (data = {}) => {
      const { element } = createGeneratedEquipmentRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(generatedEquipmentRowsEl, element, data);
      updateCount();
    };
    const addConditionalVariable = (data = {}) => {
      const { element } = createConditionalVariableRow(data, {
        onDelete: updateCount,
      });
      appendSavedRow(conditionalVariableRowsEl, element, data);
      updateCount();
    };
    const resetSpecialEffectToggles = (items = []) => {
      specialToggleRowsEl.innerHTML = "";
      SPECIAL_EFFECT_TOGGLES.forEach((config) => {
        const data =
          items.find(
            (entry) => normalizedSpecialEffectStat(entry?.stat) === config.stat,
          ) || {};
        const { element } = createSpecialEffectToggleRow(config, data, {
          onChange: updateCount,
        });
        specialToggleRowsEl.appendChild(element);
      });
      updateCount();
    };

    document
      .getElementById(`${prefix}AddAttackRoll`)
      ?.addEventListener("click", () => addAttackRoll());
    document
      .getElementById(`${prefix}AddDamageRoll`)
      .addEventListener("click", () => addDamageRoll());
    document
      .getElementById(`${prefix}AddPeriodicEffect`)
      .addEventListener("click", () => addPeriodicEffect());
    document.getElementById(`${prefix}AddD20Boost`).addEventListener("click", () => addD20Boost());
    document
      .getElementById(`${prefix}AddWeaponExtraDamage`)
      .addEventListener("click", () => addWeaponExtraDamage());
    document
      .getElementById(`${prefix}AddWeaponDamageSize`)
      .addEventListener("click", () => addWeaponDamageSize());
    document
      .getElementById(`${prefix}AddSummonCreatures`)
      .addEventListener("click", () => addSummonCreatures({}, { edit: true }));
    document
      .getElementById(`${prefix}AddDr`)
      .addEventListener("click", () => addDr());
    document
      .getElementById(`${prefix}AddSr`)
      .addEventListener("click", () => addSr());
    document
      .getElementById(`${prefix}IncreaseSr`)
      .addEventListener("click", () => options.onIncreaseSr?.());
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
      .getElementById(`${prefix}AddUseUntrained`)
      .addEventListener("click", () => addUseUntrained());
    document
      .getElementById(`${prefix}AddExtraRanksPerLevel`)
      .addEventListener("click", () => addExtraRanksPerLevel());
    document
      .getElementById(`${prefix}AddGrantDomain`)
      .addEventListener("click", () => addGrantDomain());
    document
      .getElementById(`${prefix}AddFeatGrant`)
      .addEventListener("click", () => addFeatGrant());
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
      .getElementById(`${prefix}AddEffectiveAttributeBonus`)
      .addEventListener("click", () => addEffectiveAttributeBonus());
    document
      .getElementById(`${prefix}AddAttributeContribution`)
      .addEventListener("click", () => addAttributeContribution());
    document
      .getElementById(`${prefix}AddBonusRanks`)
      .addEventListener("click", () => addBonusRanks());
    document
      .getElementById(`${prefix}AddGeneratedEquipment`)
      .addEventListener("click", () => addGeneratedEquipment());
    document
      .getElementById(`${prefix}AddConditionalVariable`)
      .addEventListener("click", () => addConditionalVariable());

    return {
      addAttackRoll,
      addD20Boost,
      addDamageRoll,
      addPeriodicEffect,
      addWeaponExtraDamage,
      addWeaponDamageSize,
      addSummonCreatures,
      addDr,
      addSr,
      addImmunity,
      addApplyCondition,
      addClassSkill,
      addUseUntrained,
      addBonusRanks,
      addExtraRanksPerLevel,
      addGrantDomain,
      addFeatGrant,
      addSizeChange,
      addSpellLikeAbility,
      addCasterLevelBonus,
      addSpellDcBonus,
      addEffectiveAttributeBonus,
      addAttributeContribution,
      addGeneratedEquipment,
      addConditionalVariable,
      reset(item = {}) {
        if (attackRollRowsEl) attackRollRowsEl.innerHTML = "";
        d20BoostRowsEl.innerHTML = "";
        damageRollRowsEl.innerHTML = "";
        weaponExtraDamageRowsEl.innerHTML = "";
        weaponDamageSizeRowsEl.innerHTML = "";
        summonCreatureRowsEl.innerHTML = "";
        drRowsEl.innerHTML = "";
        srRowsEl.innerHTML = "";
        immunityRowsEl.innerHTML = "";
        applyConditionRowsEl.innerHTML = "";
        csRowsEl.innerHTML = "";
        useUntrainedRowsEl.innerHTML = "";
        bonusRanksRowsEl.innerHTML = "";
        extraRanksRowsEl.innerHTML = "";
        grantDomainRowsEl.innerHTML = "";
        featGrantRowsEl.innerHTML = "";
        sizeRowsEl.innerHTML = "";
        slaRowsEl.innerHTML = "";
        casterLevelRowsEl.innerHTML = "";
        spellDcRowsEl.innerHTML = "";
        effectiveAttributeRowsEl.innerHTML = "";
        attributeContributionRowsEl.innerHTML = "";
        generatedEquipmentRowsEl.innerHTML = "";
        conditionalVariableRowsEl.innerHTML = "";
        specialToggleRowsEl.innerHTML = "";
        (Array.isArray(item.attackRolls) ? item.attackRolls : []).forEach(
          addAttackRoll,
        );
        (Array.isArray(item.d20Boosts) ? item.d20Boosts : []).forEach(addD20Boost);
        (Array.isArray(item.damageRolls) ? item.damageRolls : []).forEach(
          addDamageRoll,
        );
        (Array.isArray(item.periodicEffects) ? item.periodicEffects : []).forEach(
          addPeriodicEffect,
        );
        (Array.isArray(item.weaponExtraDamage)
          ? item.weaponExtraDamage
          : []
        ).forEach(addWeaponExtraDamage);
        (Array.isArray(item.weaponDamageSizeChanges)
          ? item.weaponDamageSizeChanges
          : []
        ).forEach(addWeaponDamageSize);
        (Array.isArray(item.summonCreatures) ? item.summonCreatures : []).forEach(
          addSummonCreatures,
        );
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
        (Array.isArray(item.useUntrained) ? item.useUntrained : []).forEach(
          addUseUntrained,
        );
        (Array.isArray(item.bonusRanks) ? item.bonusRanks : []).forEach(
          addBonusRanks,
        );
        (Array.isArray(item.extraRanksPerLevel)
          ? item.extraRanksPerLevel
          : []
        ).forEach(addExtraRanksPerLevel);
        (Array.isArray(item.grantDomains) ? item.grantDomains : []).forEach(
          addGrantDomain,
        );
        (Array.isArray(item.featGrants) ? item.featGrants : []).forEach(
          addFeatGrant,
        );
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
        (Array.isArray(item.effectiveAttributeBonuses)
          ? item.effectiveAttributeBonuses
          : []
        ).forEach(addEffectiveAttributeBonus);
        (Array.isArray(item.attributeContributions)
          ? item.attributeContributions
          : []
        ).forEach(addAttributeContribution);
        (Array.isArray(item.generatedEquipment)
          ? item.generatedEquipment
          : []
        ).forEach(addGeneratedEquipment);
        (Array.isArray(item.conditionalVariables)
          ? item.conditionalVariables
          : []
        ).forEach(addConditionalVariable);
        resetSpecialEffectToggles(
          Array.isArray(item.specialEffectToggles)
            ? item.specialEffectToggles
            : [],
        );
        updateCount();
      },
      collect() {
        return {
          attackRolls: attackRollRowsEl ? collectRows(attackRollRowsEl) : [],
          d20Boosts: collectRows(d20BoostRowsEl),
          damageRolls: collectRows(damageRollRowsEl),
          periodicEffects: collectRows(periodicEffectRowsEl),
          weaponExtraDamage: collectRows(weaponExtraDamageRowsEl),
          weaponDamageSizeChanges: collectRows(weaponDamageSizeRowsEl),
          summonCreatures: collectRows(summonCreatureRowsEl),
          damageReduction: collectRows(drRowsEl),
          spellResistance: collectRows(srRowsEl),
          immunities: collectRows(immunityRowsEl),
          applyConditions: collectRows(applyConditionRowsEl),
          classSkillGrants: collectRows(csRowsEl),
          useUntrained: collectRows(useUntrainedRowsEl),
          bonusRanks: collectRows(bonusRanksRowsEl),
          extraRanksPerLevel: collectRows(extraRanksRowsEl),
          grantDomains: collectRows(grantDomainRowsEl),
          featGrants: collectRows(featGrantRowsEl),
          sizeChanges: collectRows(sizeRowsEl),
          spellLikeAbilities: collectRows(slaRowsEl),
          casterLevelBonuses: collectRows(casterLevelRowsEl),
          spellDcBonuses: collectRows(spellDcRowsEl),
          effectiveAttributeBonuses: collectRows(effectiveAttributeRowsEl),
          attributeContributions: collectRows(attributeContributionRowsEl),
          generatedEquipment: collectRows(generatedEquipmentRowsEl),
          conditionalVariables: collectRows(conditionalVariableRowsEl),
          specialEffectToggles: collectRows(specialToggleRowsEl),
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
    container.classList.add("accordion", "shared-extra-accordion");
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
        effectStats: options.effectStats,
        titleCaseStat: options.titleCaseStat,
        allowAttackRolls: options.allowAttackRolls,
        onChange: options.onChange,
        onIncreaseSr: () => {
          const row = addEffect({
            stat: "spell resistance",
            value: 0,
            type: "untyped",
            stacks: true,
          });
          const effectsPanel = document.getElementById(`${prefix}EffectsPanel`);
          if (effectsPanel && window.bootstrap?.Collapse) {
            bootstrap.Collapse.getOrCreateInstance(effectsPanel).show();
          }
          requestAnimationFrame(() =>
            row
              ?.querySelector('[data-effect-field="value"]')
              ?.focus(),
          );
        },
      },
    );

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    return {
      addEffect,
      addAttackRoll: extra.addAttackRoll,
      addD20Boost: extra.addD20Boost,
      addDamageRoll: extra.addDamageRoll,
      addDr: extra.addDr,
      addSr: extra.addSr,
      addImmunity: extra.addImmunity,
      addApplyCondition: extra.addApplyCondition,
      addClassSkill: extra.addClassSkill,
      addUseUntrained: extra.addUseUntrained,
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
        const effects = Array.isArray(item[effectsKey]) ? item[effectsKey] : [];
        const specialEffectToggles = effects.filter(isSpecialEffectToggleEffect);
        effects.filter((effect) => !isSpecialEffectToggleEffect(effect)).forEach(
          addEffect,
        );
        updateEffectsCount();
        extra.reset({ ...item, specialEffectToggles });
      },
      collect() {
        const extraData = extra.collect();
        const specialEffectToggles = Array.isArray(
          extraData.specialEffectToggles,
        )
          ? extraData.specialEffectToggles
          : [];
        delete extraData.specialEffectToggles;
        return {
          [options.effectsKey || "effects"]: [
            ...collectRows(effectRowsEl),
            ...specialEffectToggles,
          ],
          ...extraData,
        };
      },
    };
  }

  let saveEditorSequence = 0;
  function ensureSaveConfigModal() {
    let modal = document.getElementById("sharedSaveConfigModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "sharedSaveConfigModal";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content bg-dark text-light">
        <div class="modal-header"><h5 class="modal-title">Apply Effect on Save</h5></div>
        <div class="modal-body">
          <div data-save-row-mode class="mb-3 d-none"><label>Effect Save</label><select class="form-select form-select-sm" data-save-mode><option value="shared">Uses Ability Save</option><option value="none">No Save</option><option value="custom">Custom Save</option></select></div>
          <div data-save-config-fields>
            <div class="row g-2">
              <div class="col-md-6"><label>Roll</label><select class="form-select form-select-sm" data-save-check>${(window.PFEffectSaves?.CHECKS || []).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}</select></div>
              <div class="col-md-6"><label>Skill or Attack</label><input class="form-control form-control-sm" data-save-detail placeholder="Optional skill or weapon name"></div>
            </div>
            <label class="form-check form-switch mt-3"><input class="form-check-input" type="checkbox" data-save-partial><span class="form-check-label">Successful save applies a partial effect</span></label>
            <div class="mt-3 d-none" data-save-partial-wrap><div class="small text-secondary mb-2">Applied only when the target selects Apply Partial</div><div data-save-partial-editor></div></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-outline-danger" type="button" data-save-remove>Remove Save</button><button class="btn btn-outline-light" type="button" data-save-cancel>Cancel</button><button class="btn btn-primary" type="button" data-save-confirm>Save</button></div>
      </div></div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function openSaveConfigEditor(existing = null, { rowMode = null } = {}) {
    const modal = ensureSaveConfigModal();
    const instance = bootstrap.Modal.getOrCreateInstance(modal, {
      backdrop: "static",
      keyboard: false,
    });
    const sequence = ++saveEditorSequence;
    const config = window.PFEffectSaves?.normalize?.(existing || {}) || {
      enabled: Boolean(existing?.enabled),
      check: existing?.check || "fortitude",
      checkDetail: existing?.checkDetail || "",
      partial: Boolean(existing?.partial),
      partialMechanics: existing?.partialMechanics || {},
    };
    const rowModeWrap = modal.querySelector("[data-save-row-mode]");
    const modeSelect = modal.querySelector("[data-save-mode]");
    rowModeWrap.classList.toggle("d-none", rowMode === null);
    modeSelect.value = rowMode || "shared";
    modal.querySelector("[data-save-check]").value = config.check || "fortitude";
    modal.querySelector("[data-save-detail]").value = config.checkDetail || "";
    modal.querySelector("[data-save-partial]").checked = Boolean(config.partial);
    const partialMount = modal.querySelector("[data-save-partial-editor]");
    partialMount.innerHTML = "";
    const partialEditor = mountEffectsAccordion(partialMount, {
      idPrefix: `SavePartial${sequence}`,
      allowBranches: false,
    });
    partialEditor.reset(config.partialMechanics || {});
    const sync = () => {
      const custom = rowMode === null || modeSelect.value === "custom";
      modal.querySelector("[data-save-config-fields]").classList.toggle("d-none", !custom);
      modal.querySelector("[data-save-partial-wrap]").classList.toggle(
        "d-none",
        !custom || !modal.querySelector("[data-save-partial]").checked,
      );
    };
    modeSelect.onchange = sync;
    modal.querySelector("[data-save-partial]").onchange = sync;
    sync();
    instance.show();
    return new Promise((resolve) => {
      const finish = (value) => {
        instance.hide();
        resolve(value);
      };
      modal.querySelector("[data-save-cancel]").onclick = () => finish(null);
      modal.querySelector("[data-save-remove]").onclick = () =>
        finish({ mode: "none", config: null });
      modal.querySelector("[data-save-confirm]").onclick = () => {
        const mode = rowMode === null ? "custom" : modeSelect.value;
        if (mode !== "custom") return finish({ mode, config: null });
        const partial = modal.querySelector("[data-save-partial]").checked;
        finish({
          mode,
          config: {
            enabled: true,
            check: modal.querySelector("[data-save-check]").value,
            checkDetail: modal.querySelector("[data-save-detail]").value.trim(),
            partial,
            ...(partial ? { partialMechanics: partialEditor.collect() } : {}),
          },
        });
      };
    });
  }

  function mountMechanicGroups(container, options = {}) {
    const prefix = options.idPrefix;
    const activeOnly = Boolean(options.activeOnly);
    const decisionOwnerControl = (group) => `
      <div id="${prefix}${group}DecisionOwnerWrap" class="d-none">
        <label class="visually-hidden" for="${prefix}${group}DecisionOwner">Decision owner</label>
        <select id="${prefix}${group}DecisionOwner" class="form-select form-select-sm" title="Who answers the configured decisions">
          <option value="caster">Caster decides</option>
          <option value="target">Target decides</option>
        </select>
      </div>`;
    const auraControls = (group) => `
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <label class="form-check form-switch mb-0 d-flex align-items-center gap-2">
          <input id="${prefix}${group}Aura" class="form-check-input" type="checkbox">
          <span class="form-check-label">Aura</span>
        </label>
        <button id="${prefix}${group}AuraDetails" class="btn btn-outline-info btn-sm d-none" type="button">Aura Details</button>
      </div>`;
    container.innerHTML = `
      ${activeOnly ? "" : `<section class="shared-mechanic-group"><div class="d-flex justify-content-between align-items-center gap-2 mb-2"><strong>Passive</strong><div class="d-flex align-items-center gap-2 flex-wrap justify-content-end">${decisionOwnerControl("Passive")}${auraControls("Passive")}${options.allowBranches === false ? "" : `<button id="${prefix}PassiveCreateBranch" class="btn btn-outline-info btn-sm" type="button">Create Branch</button>`}</div></div><div id="${prefix}Passive"></div></section>`}
      <section class="shared-mechanic-group">
        <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
          <strong>Active</strong>
          <div class="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            ${decisionOwnerControl("Active")}
            <button id="${prefix}ActiveSave" class="btn btn-outline-info btn-sm" type="button"><i class="bi bi-shield-check me-1"></i>Save</button>
            ${auraControls("Active")}
            ${options.allowBranches === false ? "" : `<button id="${prefix}ActiveCreateBranch" class="btn btn-outline-info btn-sm" type="button">Create Branch</button>`}
            <div class="d-flex align-items-center gap-2">
              <button id="${prefix}EditDuration" class="btn btn-outline-light btn-sm" type="button">Edit Duration</button>
              <span id="${prefix}DurationSummary" class="small-text"></span>
            </div>
          </div>
        </div>
        <div id="${prefix}Active"></div>
        ${options.allowIndependentEffects === false ? "" : `<section class="shared-independent-effects-section">
          <div class="shared-independent-effects-heading">
            <strong>Independent Effects</strong>
            <button id="${prefix}ActiveCreateIndependent" class="btn btn-outline-info btn-sm" type="button">Add Independent Effect</button>
          </div>
          <div id="${prefix}ActiveIndependentEffects"></div>
        </section>`}
      </section>`;

    const newBranchId = () =>
      globalThis.crypto?.randomUUID?.() ||
      `branch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const mechanicsOnly = (item = {}) =>
      window.PFEffectMechanics?.copyMechanics?.(item) || item;
    let syncDecisionOwnerControls = () => {};

    function mountBranchingGroup(group, hostId) {
      const host = document.getElementById(hostId);
      let baseEditor = null;
      let branchEditors = [];
      let branchState = [];
      let renderSequence = 0;

      const mountEditor = (mount, suffix) =>
        mountEffectsAccordion(mount, {
          ...options,
          idPrefix: `${prefix}${group}Mechanics${suffix}`,
          onChange: () => {
            syncDecisionOwnerControls();
            options.onChange?.();
          },
        });

      const currentBranches = () =>
        branchEditors.map(({ id, nameInput, editor }, index) => ({
          id,
          name: nameInput.value.trim() || `Option ${index + 1}`,
          ...editor.collect(),
        }));

      const renderBase = (data = {}) => {
        branchState = [];
        branchEditors = [];
        renderSequence += 1;
        host.innerHTML = `<div id="${prefix}${group}Base${renderSequence}"></div>`;
        baseEditor = mountEditor(
          document.getElementById(`${prefix}${group}Base${renderSequence}`),
          `Base${renderSequence}`,
        );
        baseEditor.reset(data);
        syncDecisionOwnerControls();
      };

      const renderBranches = (rows = []) => {
        branchState = rows.map((branch, index) => ({
          ...branch,
          id: String(branch.id || newBranchId()),
          name: String(branch.name || `Option ${index + 1}`),
        }));
        baseEditor = null;
        branchEditors = [];
        renderSequence += 1;
        host.innerHTML = branchState
          .map(
            (branch, index) => `
              <section class="shared-mechanic-branch" data-branch-index="${index}">
                <div class="shared-mechanic-branch-header">
                  <label class="form-label mb-0" for="${prefix}${group}BranchName${renderSequence}_${index}">Option name</label>
                  <input id="${prefix}${group}BranchName${renderSequence}_${index}" class="form-control form-control-sm" value="${escapeHtml(branch.name)}">
                  <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-branch="${index}" aria-label="Delete branch"><i class="bi bi-trash"></i></button>
                </div>
                <div id="${prefix}${group}BranchMount${renderSequence}_${index}"></div>
              </section>`,
          )
          .join("");
        branchState.forEach((branch, index) => {
          const editor = mountEditor(
            document.getElementById(
              `${prefix}${group}BranchMount${renderSequence}_${index}`,
            ),
            `Branch${renderSequence}_${index}`,
          );
          editor.reset(branch);
          const nameInput = document.getElementById(
            `${prefix}${group}BranchName${renderSequence}_${index}`,
          );
          nameInput.addEventListener("input", () => options.onChange?.());
          branchEditors.push({ id: branch.id, nameInput, editor });
        });
        syncDecisionOwnerControls();
        host.querySelectorAll("[data-delete-branch]").forEach((button) => {
          button.addEventListener("click", () => {
            const rows = currentBranches();
            rows.splice(Number(button.dataset.deleteBranch), 1);
            if (rows.length < 2) renderBase(rows[0] || {});
            else renderBranches(rows);
            options.onChange?.();
          });
        });
      };

      const createBranch = () => {
        const rows = branchEditors.length
          ? currentBranches()
          : [
              {
                id: newBranchId(),
                name: "Option 1",
                ...(baseEditor?.collect() || mechanicsOnly({})),
              },
            ];
        rows.push({
          id: newBranchId(),
          name: `Option ${rows.length + 1}`,
          ...mechanicsOnly({}),
        });
        renderBranches(rows);
        options.onChange?.();
      };

      document
        .getElementById(`${prefix}${group}CreateBranch`)
        ?.addEventListener("click", createBranch);
      renderBase({});

      return {
        reset(item = {}) {
          const rows = window.PFEffectMechanics?.branches?.(item) || [];
          if (rows.length > 1) renderBranches(rows);
          else renderBase(item);
        },
        collect() {
          if (branchEditors.length > 1) {
            return {
              ...mechanicsOnly({}),
              branches: currentBranches(),
            };
          }
          return baseEditor?.collect() || mechanicsOnly({});
        },
      };
    }

    const passive = activeOnly
      ? null
      : mountBranchingGroup("Passive", `${prefix}Passive`);
    const active = mountBranchingGroup("Active", `${prefix}Active`);
    const groupEditors = { Passive: passive, Active: active };
    const independentEditor = options.allowIndependentEffects === false
      ? null
      : mountIndependentEffects(
          document.getElementById(`${prefix}ActiveIndependentEffects`),
          {
            ...options,
            idPrefix: `${prefix}ActiveIndependent`,
            trigger: { scope: "main", outcome: "applied" },
            onChange: options.onChange,
          },
        );
    document.getElementById(`${prefix}ActiveCreateIndependent`)?.addEventListener(
      "click",
      () => independentEditor?.add(),
    );
    const decisionOwnerSelect = (group) =>
      document.getElementById(`${prefix}${group}DecisionOwner`);
    const groupHasDecision = (group) =>
      Boolean(
        groupEditors[group] &&
          window.PFEffectDecisions?.hasDecision?.(
            groupEditors[group].collect(),
          ),
      );
    syncDecisionOwnerControls = () => {
      [activeOnly ? null : "Passive", "Active"]
        .filter(Boolean)
        .forEach((group) => {
          document
            .getElementById(`${prefix}${group}DecisionOwnerWrap`)
            ?.classList.toggle("d-none", !groupHasDecision(group));
        });
    };
    container.addEventListener("input", syncDecisionOwnerControls);
    container.addEventListener("change", syncDecisionOwnerControls);
    [activeOnly ? null : "Passive", "Active"]
      .filter(Boolean)
      .forEach((group) => {
        decisionOwnerSelect(group)?.addEventListener("change", () =>
          options.onChange?.(),
        );
      });
    let durationConfig = null;
    let activeSaveConfig = null;
    let durationEditor = null;
    const auraConfigs = {
      Passive: { enabled: true, rangeFeet: 5 },
      Active: { enabled: true, rangeFeet: 5 },
    };
    const auraConfigFor = (group) => {
      const enabled = document.getElementById(`${prefix}${group}Aura`).checked;
      if (!enabled) return null;
      return JSON.parse(JSON.stringify(auraConfigs[group]));
    };
    const resetAura = (group, config = null) => {
      const toggle = document.getElementById(`${prefix}${group}Aura`);
      const details = document.getElementById(`${prefix}${group}AuraDetails`);
      toggle.checked = Boolean(config?.enabled);
      auraConfigs[group] = {
        enabled: true,
        rangeFeet: Math.max(5, Number(config?.rangeFeet || 5)),
        volumeShape: config?.volumeShape === "cylinder" ? "cylinder" : "sphere",
        ...(config?.volumeShape === "cylinder"
          ? {
              heightFeet: Math.max(
                5,
                Number(config?.heightFeet || Number(config?.rangeFeet || 5) * 2),
              ),
            }
          : {}),
        ...(config?.rangeScale ? { rangeScale: config.rangeScale } : {}),
        ...(String(config?.textureUrl || "").trim()
          ? { textureUrl: String(config.textureUrl).trim() }
          : {}),
        ...(config?.lingerDurationConfig
          ? { lingerDurationConfig: config.lingerDurationConfig }
          : {}),
        affectsSource: Boolean(config?.affectsSource),
        independentToken: Boolean(config?.independentToken),
        ...(["light", "specialVision"].includes(config?.revealMode)
          ? { revealMode: config.revealMode }
          : {}),
        targetsEmitAura: Boolean(
          group === "Active" && config?.targetsEmitAura,
        ),
      };
      details.classList.toggle("d-none", !toggle.checked);
    };
    [activeOnly ? null : "Passive", "Active"].filter(Boolean).forEach((group) => {
      const toggle = document.getElementById(`${prefix}${group}Aura`);
      toggle.addEventListener("change", () => {
        document
          .getElementById(`${prefix}${group}AuraDetails`)
          .classList.toggle("d-none", !toggle.checked);
        options.onChange?.();
      });
      document
        .getElementById(`${prefix}${group}AuraDetails`)
        .addEventListener("click", async () => {
          const updated = await openAuraDetailsModal(auraConfigs[group], {
            allowTargetsEmit: group === "Active",
          });
          if (!updated) return;
          auraConfigs[group] = updated;
          options.onChange?.();
        });
    });
    const summary = document.getElementById(`${prefix}DurationSummary`);
    const updateDuration = () => {
      summary.textContent = window.PFEffectMeta?.durationLabel
        ? window.PFEffectMeta.durationLabel(durationConfig || {})
        : durationConfig
          ? "Configured"
          : "Variable";
    };
    document
      .getElementById(`${prefix}EditDuration`)
      .addEventListener("click", () => {
        if (!window.PFEffectDurationEditor) return;
        durationEditor ||= new window.PFEffectDurationEditor(`${prefix}Active`);
        durationEditor.open(durationConfig || {}, (config) => {
          durationConfig = config;
          updateDuration();
          options.onChange?.();
        });
      });
    const saveButton = document.getElementById(`${prefix}ActiveSave`);
    const syncSaveButton = () => {
      saveButton.classList.toggle("btn-info", Boolean(activeSaveConfig?.enabled));
      saveButton.classList.toggle("btn-outline-info", !activeSaveConfig?.enabled);
    };
    saveButton.addEventListener("click", async () => {
      const result = await openSaveConfigEditor(activeSaveConfig);
      if (!result) return;
      activeSaveConfig = result.mode === "custom" ? result.config : null;
      syncSaveButton();
      independentEditor?.setTriggerVisible(Boolean(activeSaveConfig?.enabled));
      options.onChange?.();
    });

    return {
      reset(item = {}) {
        const mechanics = window.PFEffectMechanics;
        const passiveData = mechanics?.passiveMechanics?.(item) || item;
        passive?.reset(
          mechanics?.passiveMechanics?.(item) ||
            (item.activatable ? {} : item),
        );
        if (!activeOnly) {
          resetAura("Passive", passiveData.auraConfig);
        }
        const activeData =
          mechanics?.activeMechanics?.(item, { activeOnly }) ||
          (item.activatable || activeOnly ? item : item.activeMechanics || {});
        active.reset(activeData);
        if (!activeOnly)
          decisionOwnerSelect("Passive").value =
            window.PFEffectDecisions?.decisionOwner?.(passiveData) || "caster";
        decisionOwnerSelect("Active").value =
          window.PFEffectDecisions?.decisionOwner?.(activeData) || "caster";
        durationConfig = activeData.durationConfig || null;
        activeSaveConfig = activeData.saveConfig?.enabled
          ? JSON.parse(JSON.stringify(activeData.saveConfig))
          : null;
        independentEditor?.setTriggerVisible(Boolean(activeSaveConfig?.enabled));
        independentEditor?.reset(activeData);
        syncSaveButton();
        resetAura("Active", activeData.auraConfig);
        updateDuration();
        syncDecisionOwnerControls();
      },
      collect() {
        const collectedPassive = passive?.collect() || {};
        const passiveData =
          !activeOnly &&
          window.PFEffectDecisions?.hasDecision?.(collectedPassive)
            ? {
                ...collectedPassive,
                decisionOwner: decisionOwnerSelect("Passive").value || "caster",
              }
            : collectedPassive;
        const passiveAura = activeOnly ? null : auraConfigFor("Passive");
        const collectedActive = active.collect();
        const activeData = window.PFEffectDecisions?.hasDecision?.(
          collectedActive,
        )
          ? {
              ...collectedActive,
              decisionOwner: decisionOwnerSelect("Active").value || "caster",
            }
          : collectedActive;
        const activeAura = auraConfigFor("Active");
        const independentEffects = independentEditor?.collect() || [];
        const hasActive = window.PFEffectMechanics?.hasAnyMechanics
          ? window.PFEffectMechanics.hasAnyMechanics(activeData)
          : Object.values(activeData).some(
              (value) => Array.isArray(value) && value.length,
            );
        return {
          ...passiveData,
          ...(passiveAura ? { auraConfig: passiveAura } : {}),
          ...(hasActive || durationConfig || activeAura || independentEffects.length
            ? {
                activeMechanics: {
                  ...activeData,
                  ...(independentEffects.length ? { independentEffects } : {}),
                  ...(activeSaveConfig ? { saveConfig: activeSaveConfig } : {}),
                  ...(durationConfig ? { durationConfig } : {}),
                  ...(activeAura ? { auraConfig: activeAura } : {}),
                },
              }
            : {}),
        };
      },
    };
  }

  window.PFEffectEditor = {
    titleCaseStat,
    bonusStatOptionsHtml,
    createBonusRow,
    createAttackRollRow,
    attributeRequirementText,
    skillStatOptionsHtml,
    namedSkill,
    skillKey,
    createDamageRollRow,
    createDrRow,
    createSrRow,
    createImmunityRow,
    createApplyConditionRow,
    applyConditionText,
    createConditionalVariableRow,
    createClassSkillRow,
    createUseUntrainedRow,
    useUntrainedText,
    createBonusRanksRow,
    bonusRanksText,
    createExtraRanksPerLevelRow,
    extraRanksPerLevelText,
    createGrantDomainRow,
    grantDomainText,
    grantDomainEntryNeedsChoice,
    resolveGrantDomainChoices,
    createFeatGrantRow,
    featGrantText,
    createSizeChangeRow,
    createWeaponDamageSizeChangeRow,
    weaponDamageSizeChangeText,
    createSpellLikeAbilityRow,
    createSpellAdjustmentRow,
    createEffectiveAttributeBonusRow,
    effectiveAttributeBonusText,
    createAttributeContributionRow,
    spellAdjustmentSourceValues,
    spellAdjustmentSourceValue,
    spellAdjustmentSourceLabel,
    spellAdjustmentEntryNeedsChoice,
    resolveSpellAdjustmentChoices,
    spellAdjustmentSuggestions,
    casterLevelBonusText,
    spellDcBonusText,
    createGeneratedEquipmentRow,
    createWeaponExtraDamageRow,
    createD20BoostRow,
    mountExtraAccordion,
    mountEffectsAccordion,
    mountIndependentEffects,
    mountMechanicGroups,
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
