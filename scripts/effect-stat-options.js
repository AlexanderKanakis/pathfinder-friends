// Shared "choose a target at time of use" catalog for effect authoring.
//
// Some feats/rage powers/spells (e.g. Ancestor Totem, Lesser: "+2 insight
// to a skill of your choice"; Human Potential: "+4 enhancement to an
// ability score of your choice") don't have a fixed stat baked into their
// definition -- the player picks the target when the effect is actually
// applied. Every effect-authoring surface in the app (class features,
// pool choices, the Effects tab's custom effects, loot items, bag of
// holding items) gets a "Choose When Applied" group in its Stat dropdown
// for this. The chosen pool is stored as the effect's stat, e.g.
// "choice:skills-all"; PFEffectStats.resolveChoicePool() turns that (plus
// a concrete pick) into a real, already-supported stat like
// "skill:perception" or "strength" that the rest of the app doesn't need
// to know is anything special.
//
// Weapon Types / All Weapons / Spell Schools / Energy Resistance don't
// correspond to any calculable total in this app (there's no "AC vs
// axes" field to add to, and Resistances is a free-text field on the
// sheet, not a running total), so they resolve into descriptive stat
// ids (weapon-type:axes, weapon:longsword, spell-school:evocation,
// resistance:fire) that display like any other conditional bonus (see
// titleCaseStat below) without pretending to feed a running total that
// doesn't exist.
(function () {
  const ABILITY_OPTIONS = [
    { value: "strength", label: "Strength" },
    { value: "dexterity", label: "Dexterity" },
    { value: "constitution", label: "Constitution" },
    { value: "intelligence", label: "Intelligence" },
    { value: "wisdom", label: "Wisdom" },
    { value: "charisma", label: "Charisma" },
  ];
  const PHYSICAL_ABILITIES = ["strength", "dexterity", "constitution"];
  const MENTAL_ABILITIES = ["intelligence", "wisdom", "charisma"];

  const SAVE_OPTIONS = [
    { value: "fortitude", label: "Fortitude" },
    { value: "reflex", label: "Reflex" },
    { value: "will", label: "Will" },
  ];

  // Pathfinder's standard fighter "weapon training" groups.
  const WEAPON_TYPE_OPTIONS = [
    "Axes",
    "Blades, Heavy",
    "Blades, Light",
    "Bows",
    "Close",
    "Crossbows",
    "Double",
    "Firearms",
    "Flails",
    "Hammers",
    "Monk",
    "Natural",
    "Polearms",
    "Siege Engines",
    "Spears",
    "Thrown",
  ].map((label) => ({ value: slugify(label), label }));

  const SPELL_SCHOOL_OPTIONS = [
    "Abjuration",
    "Conjuration",
    "Divination",
    "Enchantment",
    "Evocation",
    "Illusion",
    "Necromancy",
    "Transmutation",
  ].map((label) => ({ value: slugify(label), label }));

  // PF1e's common resistance choices. Positive/negative energy are not
  // part of the classic five energy damage types, but a number of
  // creatures and effects care about resisting them, so expose them
  // alongside the elemental set.
  const ENERGY_RESISTANCE_OPTIONS = [
    "Acid",
    "Cold",
    "Electricity",
    "Fire",
    "Negative Energy",
    "Positive Energy",
    "Sonic",
  ].map((label) => ({ value: slugify(label), label }));

  // Same resistance types, but as fixed stats an author picks directly --
  // "gain 5 fire resistance" (Draconic bloodline, energy resistance
  // traits, etc.) doesn't leave the type up to the player, unlike the
  // "Energy Resistance" choice pool above. Reuses the exact same
  // "resistance:<type>" stat id the choice pool resolves into, so both
  // paths render/calculate identically (see choiceStatLabel below).
  const ENERGY_RESISTANCE_STAT_OPTIONS = ENERGY_RESISTANCE_OPTIONS.map(
    (option) => ({
      value: `resistance:${option.value}`,
      label: `${option.label} Resistance`,
    }),
  );

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function unslugify(slug) {
    return String(slug || "")
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // The base 30 Pathfinder skills with their key ability, matching every
  // page's own skill list exactly. Callers with a live character (custom
  // skills included) should pass their own list into
  // resolveChoicePoolOptions({ skills }) instead of relying on this.
  const PF_SKILLS_WITH_ABILITY = [
    ["Acrobatics", "dex"],
    ["Appraise", "int"],
    ["Bluff", "cha"],
    ["Climb", "str"],
    ["Diplomacy", "cha"],
    ["Disable Device", "dex"],
    ["Disguise", "cha"],
    ["Escape Artist", "dex"],
    ["Fly", "dex"],
    ["Heal", "wis"],
    ["Intimidate", "cha"],
    ["Knowledge (arcana)", "int"],
    ["Knowledge (dungeoneering)", "int"],
    ["Knowledge (engineering)", "int"],
    ["Knowledge (geography)", "int"],
    ["Knowledge (history)", "int"],
    ["Knowledge (local)", "int"],
    ["Knowledge (nature)", "int"],
    ["Knowledge (nobility)", "int"],
    ["Knowledge (planes)", "int"],
    ["Knowledge (religion)", "int"],
    ["Linguistics", "int"],
    ["Perception", "wis"],
    ["Ride", "dex"],
    ["Sense Motive", "wis"],
    ["Sleight of Hand", "dex"],
    ["Spellcraft", "int"],
    ["Stealth", "dex"],
    ["Survival", "wis"],
    ["Swim", "str"],
    ["Use Magic Device", "cha"],
  ];

  // From the barbarian's Rage entry: "a barbarian cannot use any
  // Charisma-, Dexterity-, or Intelligence-based skills (except
  // Acrobatics, Fly, Intimidate, and Ride)...". Only CHA/DEX/INT skills
  // are restricted at all -- STR, CON, and WIS skills are never touched
  // by Rage -- so "usable while raging" is every STR/CON/WIS skill plus
  // those 4 named exceptions from the restricted abilities.
  const RAGE_USABLE_ABILITIES = ["str", "con", "wis"];
  const RAGE_USABLE_EXCEPTION_NAMES = ["Acrobatics", "Fly", "Intimidate", "Ride"];
  const CUSTOM_SKILL_LIST_STORAGE_KEY = "pf_effect_custom_skill_lists_v1";
  const CREATE_SKILL_LIST_STAT_VALUE = "__create-custom-skill-list-stat__";
  const CREATE_SKILL_LIST_CHOICE_VALUE = "__create-custom-skill-list-choice__";

  // Skill pools are resolved dynamically against whichever skill list is
  // passed in (base 30 PF skills by default, or a character's actual
  // list including homebrew custom skills when called from the sheet).
  const SKILL_POOLS = [
    { id: "skills-all", label: "All Skills", ability: null },
    { id: "skills-str", label: "Strength Skills", ability: "str" },
    { id: "skills-dex", label: "Dexterity Skills", ability: "dex" },
    { id: "skills-con", label: "Constitution Skills", ability: "con" },
    { id: "skills-int", label: "Intelligence Skills", ability: "int" },
    {
      id: "skills-knowledge",
      label: "Knowledge Skills",
      namePrefix: "Knowledge",
    },
    {
      id: "skills-craft",
      label: "Craft Skills",
      namePrefix: "Craft",
    },
    { id: "skills-wis", label: "Wisdom Skills", ability: "wis" },
    { id: "skills-cha", label: "Charisma Skills", ability: "cha" },
    {
      id: "skills-rage-usable",
      label: "Skills Usable While Raging",
      usableAbilities: RAGE_USABLE_ABILITIES,
      names: RAGE_USABLE_EXCEPTION_NAMES,
    },
  ];

  const STATIC_POOLS = [
    { id: "saving-throws", label: "Saving Throws", options: SAVE_OPTIONS },
    { id: "attributes-all", label: "All Attributes", options: ABILITY_OPTIONS },
    {
      id: "attributes-physical",
      label: "Physical Attributes",
      options: ABILITY_OPTIONS.filter((a) => PHYSICAL_ABILITIES.includes(a.value)),
    },
    {
      id: "attributes-mental",
      label: "Mental Attributes",
      options: ABILITY_OPTIONS.filter((a) => MENTAL_ABILITIES.includes(a.value)),
    },
    { id: "weapon-types", label: "Weapon Types", options: WEAPON_TYPE_OPTIONS },
    { id: "spell-schools", label: "Spell Schools", options: SPELL_SCHOOL_OPTIONS },
    {
      id: "energy-resistance",
      label: "Energy Resistance",
      options: ENERGY_RESISTANCE_OPTIONS,
    },
  ];

  // All weapons is the one pool too large to inline -- lazy-loaded and
  // cached from the same data/weapons.json the equipment pickers use.
  let weaponListPromise = null;
  async function loadWeaponOptions() {
    if (!weaponListPromise) {
      weaponListPromise = fetch("./data/weapons.json", { cache: "no-cache" })
        .then((response) => (response.ok ? response.json() : []))
        .then((list) =>
          (Array.isArray(list) ? list : [])
            .map((item) => item?.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ value: slugify(name), label: name })),
        )
        .catch(() => []);
    }
    return weaponListPromise;
  }

  const BASE_POOLS = [
    ...SKILL_POOLS.map((pool) => ({ ...pool, kind: "skill" })),
    ...STATIC_POOLS.map((pool) => ({ ...pool, kind: "static" })),
    { id: "weapons-all", label: "All Weapons", kind: "weapon" },
  ];
  const ALL_POOLS = [];

  function normalizeSkillName(skill) {
    return String(skill || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
  }

  function normalizeCustomSkillList(raw = {}) {
    const name = String(raw.name || raw.label || "").trim();
    const skills = (Array.isArray(raw.skills) ? raw.skills : [])
      .map((skill) => String(skill || "").trim())
      .filter(Boolean);
    if (!name || !skills.length) return null;
    const id =
      String(raw.id || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `${slugify(name)}-${Date.now().toString(36)}`;
    return { id, name, skills };
  }

  function loadCustomSkillLists() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(CUSTOM_SKILL_LIST_STORAGE_KEY) || "[]",
      );
      return (Array.isArray(parsed) ? parsed : [])
        .map(normalizeCustomSkillList)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveCustomSkillLists(lists = []) {
    const normalized = lists.map(normalizeCustomSkillList).filter(Boolean);
    localStorage.setItem(
      CUSTOM_SKILL_LIST_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    refreshAllPools();
    window.dispatchEvent(new CustomEvent("pf-custom-skill-lists-updated"));
    return normalized;
  }

  function customSkillLists() {
    return loadCustomSkillLists();
  }

  function saveCustomSkillList(list = {}) {
    const normalized = normalizeCustomSkillList(list);
    if (!normalized) return null;
    const lists = customSkillLists();
    const existingIndex = lists.findIndex((item) => item.id === normalized.id);
    if (existingIndex >= 0) lists[existingIndex] = normalized;
    else lists.push(normalized);
    saveCustomSkillLists(lists);
    return normalized;
  }

  function customSkillListById(id) {
    return customSkillLists().find((list) => list.id === id) || null;
  }

  function customPoolFromList(list = {}) {
    return {
      id: `skill-list:${list.id}`,
      label: list.name,
      kind: "custom-skill-list",
      skills: [...(list.skills || [])],
    };
  }

  function refreshAllPools() {
    ALL_POOLS.splice(
      0,
      ALL_POOLS.length,
      ...BASE_POOLS,
      ...customSkillLists().map(customPoolFromList),
    );
  }

  refreshAllPools();

  function poolById(id) {
    refreshAllPools();
    return ALL_POOLS.find((pool) => pool.id === id) || null;
  }

  function isChoiceStat(value) {
    return /^choice:/.test(String(value || ""));
  }

  function choicePoolIdFromStat(value) {
    const match = /^choice:(.+)$/.exec(String(value || ""));
    return match ? match[1] : "";
  }

  function skillStatValue(skillName) {
    return `skill:${slugify(skillName).replace(/-/g, "")}`;
  }

  function skillListStatValue(listOrId) {
    const id =
      typeof listOrId === "string" ? listOrId : String(listOrId?.id || "");
    return id.startsWith("skill-list:") ? id : `skill-list:${id}`;
  }

  function skillListIdFromStat(value) {
    const match = /^skill-list:(.+)$/.exec(String(value || ""));
    return match ? match[1] : "";
  }

  function choicePoolFallbackFromOptions(poolId, options = {}) {
    const fallback = options.choicePool || options.skillList;
    if (!fallback || typeof fallback !== "object") return null;
    const normalized = normalizeCustomSkillList(fallback);
    if (!normalized) return null;
    const expected = poolId.replace(/^skill-list:/, "");
    if (expected && normalized.id !== expected) return null;
    return customPoolFromList(normalized);
  }

  function skillListForStat(value, fallback = null) {
    const id = skillListIdFromStat(value);
    if (!id) return null;
    return customSkillListById(id) || normalizeCustomSkillList(fallback) || null;
  }

  function skillListIncludesSkill(listOrStat, skillName, fallback = null) {
    const list =
      typeof listOrStat === "string"
        ? skillListForStat(listOrStat, fallback)
        : normalizeCustomSkillList(listOrStat);
    if (!list) return false;
    const target = normalizeSkillName(skillName);
    return list.skills.some((skill) => {
      if (/^craft$/i.test(skill)) return /^craft/i.test(skillName);
      if (/^profession$/i.test(skill)) return /^profession/i.test(skillName);
      return normalizeSkillName(skill) === target;
    });
  }

  // skills: optional override list of [name, ability] pairs (or {name,
  // ability} objects) -- pass a character's own allSkills() to include
  // homebrew custom skills; falls back to the base 30 PF skills.
  async function resolveChoicePoolOptions(poolId, options = {}) {
    const { skills } = options;
    const pool = poolById(poolId) || choicePoolFallbackFromOptions(poolId, options);
    if (!pool) return [];
    if (pool.kind === "custom-skill-list") {
      const liveSkills = (skills || PF_SKILLS_WITH_ABILITY).map((entry) =>
        Array.isArray(entry)
          ? { name: entry[0], ability: entry[1] }
          : { name: entry.name, ability: entry.ability },
      );
      const options = [];
      const addSkill = (skill) => {
        if (!skill?.name) return;
        if (options.some((option) => option.value === skillStatValue(skill.name)))
          return;
        options.push({ value: skillStatValue(skill.name), label: skill.name });
      };
      (pool.skills || []).forEach((skill) => {
        if (/^craft$/i.test(skill)) {
          liveSkills
            .filter((entry) => /^craft(?:\s*\(|\b)/i.test(entry.name))
            .forEach(addSkill);
          return;
        }
        if (/^profession$/i.test(skill)) {
          liveSkills
            .filter((entry) => /^profession(?:\s*\(|\b)/i.test(entry.name))
            .forEach(addSkill);
          return;
        }
        addSkill({ name: skill });
      });
      return options;
    }
    if (pool.kind === "skill") {
      const list = (skills || PF_SKILLS_WITH_ABILITY)
        .map((entry) =>
          Array.isArray(entry)
            ? { name: entry[0], ability: entry[1] }
            : { name: entry.name, ability: entry.ability },
        )
        .filter((entry) => {
          if (pool.usableAbilities || pool.names || pool.namePrefix) {
            return (
              (pool.usableAbilities &&
                pool.usableAbilities.includes(entry.ability)) ||
              (pool.names && pool.names.includes(entry.name)) ||
              (pool.namePrefix &&
                entry.name
                  .toLowerCase()
                  .startsWith(pool.namePrefix.toLowerCase()))
            );
          }
          return !pool.ability || entry.ability === pool.ability;
        });
      return list.map((entry) => ({
        value: skillStatValue(entry.name),
        label: entry.name,
      }));
    }
    if (pool.kind === "weapon") {
      const weapons = await loadWeaponOptions();
      return weapons.map((weapon) => ({
        value: `weapon:${weapon.value}`,
        label: weapon.label,
      }));
    }
    // static
    const prefix =
      pool.id === "weapon-types"
        ? "weapon-type:"
        : pool.id === "spell-schools"
          ? "spell-school:"
          : pool.id === "energy-resistance"
            ? "resistance:"
            : "";
    return (pool.options || []).map((option) => ({
      value: prefix ? `${prefix}${option.value}` : option.value,
      label: option.label,
    }));
  }

  function energyResistanceOptgroupHtml(selected, escapeHtml) {
    const esc = escapeHtml || ((value) => String(value ?? ""));
    return `
      <optgroup label="Energy Resistance">
        ${ENERGY_RESISTANCE_STAT_OPTIONS.map(
          (option) =>
            `<option value="${esc(option.value)}" ${selected === option.value ? "selected" : ""}>${esc(option.label)}</option>`,
        ).join("")}
      </optgroup>
    `;
  }

  function choiceOptgroupHtml(selected, escapeHtml) {
    const esc = escapeHtml || ((value) => String(value ?? ""));
    refreshAllPools();
    return `
      <optgroup label="Choose When Applied">
        ${ALL_POOLS.map(
          (pool) =>
            `<option value="choice:${pool.id}" ${selected === `choice:${pool.id}` ? "selected" : ""}>${esc(pool.label)} (choose one)</option>`,
        ).join("")}
        <option value="${CREATE_SKILL_LIST_CHOICE_VALUE}">Create custom skill list...</option>
      </optgroup>
    `;
  }

  // Extra titleCaseStat branches for the synthetic stat ids these pools
  // resolve into. Each authoring surface's own titleCaseStat() should
  // check this first and fall back to its normal formatting.
  function choiceStatLabel(key) {
    if (key.startsWith("weapon-type:"))
      return `Weapon Type: ${unslugify(key.slice("weapon-type:".length))}`;
    if (key.startsWith("weapon:"))
      return `Weapon: ${unslugify(key.slice("weapon:".length))}`;
    if (key.startsWith("spell-school:"))
      return `Spell School: ${unslugify(key.slice("spell-school:".length))}`;
    if (key.startsWith("resistance:"))
      return `Resistance: ${unslugify(key.slice("resistance:".length))}`;
    if (key.startsWith("skill-list:")) {
      const list = skillListForStat(key);
      return list ? `${list.name} Skills` : "Custom Skill List";
    }
    if (key.startsWith("choice:")) {
      // Unresolved -- the stat is still a pool reference rather than a
      // concrete pick (e.g. a worn item's effect that hasn't gone through
      // an interactive "choose a target" prompt yet). Show the pool name
      // instead of the raw id so it doesn't render as garbled text.
      const pool = poolById(choicePoolIdFromStat(key));
      return pool ? `${pool.label} (choose one)` : "";
    }
    return "";
  }

  window.PFEffectStats = {
    ALL_POOLS,
    PF_SKILLS_WITH_ABILITY,
    ENERGY_RESISTANCE_STAT_OPTIONS,
    CREATE_SKILL_LIST_STAT_VALUE,
    CREATE_SKILL_LIST_CHOICE_VALUE,
    poolById,
    isChoiceStat,
    choicePoolIdFromStat,
    resolveChoicePoolOptions,
    choiceOptgroupHtml,
    energyResistanceOptgroupHtml,
    choiceStatLabel,
    customSkillLists,
    saveCustomSkillList,
    saveCustomSkillLists,
    customSkillListById,
    skillListStatValue,
    skillListIdFromStat,
    skillListForStat,
    skillListIncludesSkill,
    normalizeSkillName,
    slugify,
    unslugify,
  };
})();
