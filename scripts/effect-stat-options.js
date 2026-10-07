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

  const WEAPON_RESTRICTION_OPTIONS = [
    { value: "all", label: "All" },
    { value: "melee-light", label: "Melee Weapon (Light)" },
    { value: "melee-one-handed", label: "Melee Weapon (One-Handed)" },
    { value: "melee-two-handed", label: "Melee Weapon (Two-Handed)" },
    { value: "ranged", label: "Ranged Weapon" },
    { value: "firearm-one-handed", label: "Firearm (One-Handed)" },
    { value: "firearm-two-handed", label: "Firearm (Two-Handed)" },
    { value: "natural", label: "Natural Weapon" },
    { value: "improvised", label: "Improvised" },
    { value: "unarmed-strike", label: "Unarmed Strike" },
  ];
  const NATURAL_WEAPON_NAME_OPTIONS = [
    "Bite", "Claw", "Gore", "Hoof", "Pincers", "Slam", "Sting",
    "Tail Slap", "Talons", "Tentacle", "Unarmed Strike", "Wing",
  ];

  function normalizeWeaponTypeRestriction(value = "all") {
    const key = slugify(value || "all");
    const aliases = {
      all: "all",
      "melee-weapon-light": "melee-light",
      "melee-weapon-one-handed": "melee-one-handed",
      "melee-weapon-two-handed": "melee-two-handed",
      "ranged-weapon": "ranged",
      "firearm-one-handed": "firearm-one-handed",
      "firearm-two-handed": "firearm-two-handed",
      natural: "natural",
      "natural-weapon": "natural",
    };
    return aliases[key] || key;
  }

  function weaponTypeRestrictionMatches(
    restriction = "all",
    weaponType = "",
    weaponName = "",
  ) {
    const normalizedRestriction = normalizeWeaponTypeRestriction(restriction);
    if (normalizedRestriction === "unarmed-strike") {
      return slugify(weaponName) === "unarmed-strike";
    }
    return (
      normalizedRestriction === "all" ||
      normalizedRestriction === normalizeWeaponTypeRestriction(weaponType)
    );
  }

  function weaponNameRestrictionMatches(restriction = "all", weaponName = "") {
    const target = slugify(restriction || "all");
    if (target === "all") return true;
    let name = slugify(weaponName);
    name = name.replace(/^\d+-/, "").replace(/-attacks?$/, "");
    const aliases = target === "hoof" ? ["hoof", "hooves"]
      : target === "pincers" ? ["pincers", "pincer"]
      : target === "talons" ? ["talons", "talon"]
      : [target, `${target}s`];
    return aliases.some((alias) => name === alias || name.endsWith(`-${alias}`));
  }

  function weaponTypeRestrictionLabel(value = "all") {
    const normalized = normalizeWeaponTypeRestriction(value);
    return (
      WEAPON_RESTRICTION_OPTIONS.find(
        (option) => option.value === normalized,
      )?.label || unslugify(normalized)
    );
  }

  function isAttackOrDamageStat(stat = "") {
    return /^(?:(?:melee|ranged) )?(?:attack|damage)$/i.test(
      String(stat || "").trim(),
    );
  }

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

  // The Pathfinder skills represented by the sheet, with key ability and
  // whether the skill can be used untrained. The third slot is reserved by
  // character-sheet.js for "custom skill", so the untrained flag lives in
  // the fourth slot for array compatibility.
  const PF_SKILLS_WITH_ABILITY = [
    ["Acrobatics", "dex", false, true],
    ["Appraise", "int", false, true],
    ["Bluff", "cha", false, true],
    ["Climb", "str", false, true],
    ["Diplomacy", "cha", false, true],
    ["Disable Device", "dex", false, false],
    ["Disguise", "cha", false, true],
    ["Escape Artist", "dex", false, true],
    ["Fly", "dex", false, true],
    ["Heal", "wis", false, true],
    ["Handle Animal", "cha", false, false],
    ["Intimidate", "cha", false, true],
    ["Knowledge (arcana)", "int", false, false],
    ["Knowledge (dungeoneering)", "int", false, false],
    ["Knowledge (engineering)", "int", false, false],
    ["Knowledge (geography)", "int", false, false],
    ["Knowledge (history)", "int", false, false],
    ["Knowledge (local)", "int", false, false],
    ["Knowledge (nature)", "int", false, false],
    ["Knowledge (nobility)", "int", false, false],
    ["Knowledge (planes)", "int", false, false],
    ["Knowledge (religion)", "int", false, false],
    ["Linguistics", "int", false, false],
    ["Perception", "wis", false, true],
    ["Ride", "dex", false, true],
    ["Sense Motive", "wis", false, true],
    ["Sleight of Hand", "dex", false, false],
    ["Spellcraft", "int", false, false],
    ["Stealth", "dex", false, true],
    ["Survival", "wis", false, true],
    ["Swim", "str", false, true],
    ["Use Magic Device", "cha", false, false],
  ];
  const SKILL_TRAINING_FAMILY_OPTIONS = [
    { name: "Craft", ability: "int", untrained: true },
    { name: "Profession", ability: "wis", untrained: false },
    { name: "Perform", ability: "cha", untrained: true },
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
  const CUSTOM_SLA_SPELL_LIST_STORAGE_KEY =
    "pf_effect_custom_sla_spell_lists_v1";
  const CUSTOM_FEAT_LIST_STORAGE_KEY = "pf_effect_custom_feat_lists_v1";
  const CREATE_SKILL_LIST_STAT_VALUE = "__create-custom-skill-list-stat__";
  const CREATE_SKILL_LIST_CHOICE_VALUE = "__create-custom-skill-list-choice__";

  // Skill pools are resolved dynamically against whichever skill list is
  // passed in (base 30 PF skills by default, or a character's actual
  // list including homebrew custom skills when called from the sheet).
  const SKILL_POOLS = [
    { id: "skills-all", label: "All Skills", ability: null },
    { id: "skills-trained", label: "Trained Skills", trainedOnly: true },
    { id: "skills-untrained", label: "Untrained Skills", untrained: true },
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
    {
      id: "skills-profession",
      label: "Profession Skills",
      namePrefix: "Profession",
    },
    {
      id: "skills-perform",
      label: "Perform Skills",
      namePrefix: "Perform",
    },
    {
      id: "skills-craft-perform-profession",
      label: "Craft, Perform, or Profession Skills",
      namePrefixes: ["Craft", "Perform", "Profession"],
      namedSkillKinds: ["skill:craft", "skill:perform", "skill:profession"],
    },
    {
      id: "skills-craft-profession",
      label: "Craft or Profession Skills",
      namePrefixes: ["Craft", "Profession"],
      namedSkillKinds: ["skill:craft", "skill:profession"],
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

  const EQUIPMENT_POOLS = [
    {
      id: "equipped-weapons",
      label: "Equipped Weapons",
      kind: "equipment",
      equipmentKinds: ["weapon"],
    },
    {
      id: "equipped-shields",
      label: "Equipped Shields",
      kind: "equipment",
      equipmentKinds: ["shield"],
    },
    {
      id: "equipped-armor",
      label: "Equipped Armor",
      kind: "equipment",
      equipmentKinds: ["armor"],
    },
    {
      id: "equipped-armor-shields",
      label: "Equipped Armor / Shields",
      kind: "equipment",
      equipmentKinds: ["armor", "shield"],
    },
  ];

  const CONDITIONAL_VARIABLE_POOLS = [
    {
      id: "ranger-favored-enemies",
      label: "Ranger Favored Enemies",
      source: "creature-types",
    },
    {
      id: "character-favored-enemies",
      label: "Character Favored Enemies",
      source: "character-favored-enemies",
    },
  ];

  let creatureTypesPromise = null;
  async function loadCreatureTypesData() {
    if (!creatureTypesPromise) {
      creatureTypesPromise = fetch("./data/creature-types.json", {
        cache: "no-cache",
      })
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
    }
    return creatureTypesPromise;
  }

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
    ...EQUIPMENT_POOLS,
    { id: "weapons-all", label: "All Weapons", kind: "weapon" },
  ];
  const ALL_POOLS = [];

  function normalizeSkillName(skill) {
    return String(skill || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
  }

  function normalizeSkillEntry(entry) {
    if (Array.isArray(entry)) {
      return {
        name: entry[0],
        ability: entry[1],
        custom: Boolean(entry[2]),
        untrained: entry.length >= 4 ? Boolean(entry[3]) : null,
      };
    }
    return {
      name: entry?.name,
      ability: entry?.ability,
      custom: Boolean(entry?.custom),
      untrained:
        typeof entry?.untrained === "boolean" ? entry.untrained : null,
    };
  }

  function skillTrainingStatus(skillName) {
    const text = String(skillName || "").trim();
    const key = normalizeSkillName(text);
    const base = PF_SKILLS_WITH_ABILITY.map(normalizeSkillEntry).find(
      (skill) => normalizeSkillName(skill.name) === key,
    );
    if (base) return base.untrained ? "untrained" : "trained";
    if (/^craft(?:\s*\(|\b)/i.test(text)) return "untrained";
    if (/^perform(?:\s*\(|\b)/i.test(text)) return "untrained";
    if (/^profession(?:\s*\(|\b)/i.test(text)) return "trained";
    if (/^knowledge(?:\s*\(|\b)/i.test(text)) return "trained";
    return "";
  }

  function normalizeCustomListItem(raw = {}) {
    const source =
      raw && typeof raw === "object"
        ? raw
        : { value: String(raw || ""), label: String(raw || "") };
    const value = String(
      source.value || source.stat || source.key || "",
    ).trim();
    if (!value) return null;
    const label = String(
      source.label ||
        source.name ||
        choiceStatLabel(value) ||
        value,
    ).trim();
    const group = String(source.group || "").trim();
    return {
      value,
      label: label || value,
      ...(group ? { group } : {}),
    };
  }

  function skillFamilyStatValue(skillName = "") {
    const text = String(skillName || "").trim();
    if (/^craft(?:\s*\(|\b)/i.test(text)) return "skill:craft";
    if (/^profession(?:\s*\(|\b)/i.test(text)) return "skill:profession";
    if (/^perform(?:\s*\(|\b)/i.test(text)) return "skill:perform";
    return "";
  }

  function normalizeCustomSkillList(raw = {}) {
    if (!raw || typeof raw !== "object") return null;
    const name = String(raw.name || raw.label || "").trim();
    const skills = (Array.isArray(raw.skills) ? raw.skills : [])
      .map((skill) => String(skill || "").trim())
      .filter(Boolean);
    const rawItems = Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.stats)
        ? raw.stats
        : Array.isArray(raw.entries)
          ? raw.entries
          : [];
    const items = rawItems.map(normalizeCustomListItem).filter(Boolean);
    if (!name || (!skills.length && !items.length)) return null;
    const id =
      String(raw.id || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `${slugify(name)}-${Date.now().toString(36)}`;
    return {
      id,
      name,
      skills,
      ...(items.length ? { items } : {}),
    };
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

  function normalizeSpellLikeListItem(raw = {}) {
    const source =
      raw && typeof raw === "object"
        ? raw
        : { name: String(raw || ""), label: String(raw || "") };
    const spell = source.spell && typeof source.spell === "object"
      ? source.spell
      : null;
    const name = String(
      spell?.name ||
        source.spellName ||
        source.name ||
        source.label ||
        source.value ||
        "",
    ).trim();
    if (!name) return null;
    return {
      name,
      spellName: name,
      value: name,
      label: String(spell ? name : source.label || name).trim() || name,
      ...(source.group ? { group: source.group } : {}),
      ...(source.meta ? { meta: source.meta } : {}),
    };
  }

  function normalizeSpellLikeList(raw = {}) {
    const name = String(raw.name || raw.label || "").trim();
    const rawItems = Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.spells)
        ? raw.spells
        : Array.isArray(raw.entries)
          ? raw.entries
          : [];
    const items = rawItems.map(normalizeSpellLikeListItem).filter(Boolean);
    if (!name || !items.length) return null;
    const id =
      String(raw.id || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `${slugify(name)}-${Date.now().toString(36)}`;
    return {
      id,
      name,
      items,
    };
  }

  function loadCustomSpellLikeLists() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(CUSTOM_SLA_SPELL_LIST_STORAGE_KEY) || "[]",
      );
      return (Array.isArray(parsed) ? parsed : [])
        .map(normalizeSpellLikeList)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveCustomSpellLikeLists(lists = []) {
    const normalized = lists.map(normalizeSpellLikeList).filter(Boolean);
    localStorage.setItem(
      CUSTOM_SLA_SPELL_LIST_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    window.dispatchEvent(new CustomEvent("pf-custom-sla-lists-updated"));
    return normalized;
  }

  function customSpellLikeLists() {
    return loadCustomSpellLikeLists();
  }

  function saveCustomSpellLikeList(list = {}) {
    const normalized = normalizeSpellLikeList(list);
    if (!normalized) return null;
    const lists = customSpellLikeLists();
    const existingIndex = lists.findIndex((item) => item.id === normalized.id);
    if (existingIndex >= 0) lists[existingIndex] = normalized;
    else lists.push(normalized);
    saveCustomSpellLikeLists(lists);
    return normalized;
  }

  function customSpellLikeListById(id) {
    return customSpellLikeLists().find((list) => list.id === id) || null;
  }

  function normalizeFeatListItem(raw = {}) {
    const source =
      raw && typeof raw === "object"
        ? raw
        : { featId: String(raw || ""), label: String(raw || "") };
    const featId = String(
      source.featId || source.id || source.slug || source.value || "",
    ).trim();
    const name = String(source.name || source.label || featId).trim();
    if (!featId && !name) return null;
    return {
      featId: featId || name,
      label: name || featId,
      ...(source.type ? { type: source.type } : {}),
    };
  }

  function normalizeFeatList(raw = {}) {
    const name = String(raw.name || raw.label || "").trim();
    const rawItems = Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.feats)
        ? raw.feats
        : Array.isArray(raw.entries)
          ? raw.entries
          : [];
    const items = rawItems.map(normalizeFeatListItem).filter(Boolean);
    if (!name || !items.length) return null;
    const id =
      String(raw.id || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `${slugify(name)}-${Date.now().toString(36)}`;
    return { id, name, items };
  }

  function loadCustomFeatLists() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(CUSTOM_FEAT_LIST_STORAGE_KEY) || "[]",
      );
      return (Array.isArray(parsed) ? parsed : [])
        .map(normalizeFeatList)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function saveCustomFeatLists(lists = []) {
    const normalized = lists.map(normalizeFeatList).filter(Boolean);
    localStorage.setItem(
      CUSTOM_FEAT_LIST_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    window.dispatchEvent(new CustomEvent("pf-custom-feat-lists-updated"));
    return normalized;
  }

  function customFeatLists() {
    return loadCustomFeatLists();
  }

  function saveCustomFeatList(list = {}) {
    const normalized = normalizeFeatList(list);
    if (!normalized) return null;
    const lists = customFeatLists();
    const existingIndex = lists.findIndex((item) => item.id === normalized.id);
    if (existingIndex >= 0) lists[existingIndex] = normalized;
    else lists.push(normalized);
    saveCustomFeatLists(lists);
    return normalized;
  }

  function customFeatListById(id) {
    return customFeatLists().find((list) => list.id === id) || null;
  }

  function customPoolFromList(list = {}) {
    return {
      id: `skill-list:${list.id}`,
      label: customSkillListLabel(list),
      kind: "custom-skill-list",
      skills: [...(list.skills || [])],
      items: Array.isArray(list.items)
        ? list.items.map(normalizeCustomListItem).filter(Boolean)
        : [],
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

  function conditionalVariablePoolById(id) {
    return (
      CONDITIONAL_VARIABLE_POOLS.find(
        (pool) => pool.id === String(id || ""),
      ) || null
    );
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

  function skillLabelForStatKey(key) {
    const target = String(key || "")
      .toLowerCase()
      .replace(/^skill:/, "");
    if (!target) return "";
    const skill = PF_SKILLS_WITH_ABILITY.map(normalizeSkillEntry).find(
      (entry) => normalizeSkillName(entry.name) === target,
    );
    if (skill?.name) return skill.name;
    if (target === "craft") return "Craft";
    if (target === "profession") return "Profession";
    if (target === "perform") return "Perform";
    return "";
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
    if (Array.isArray(list.items) && list.items.length) {
      const specific = skillStatValue(skillName);
      const family = skillFamilyStatValue(skillName);
      return list.items.some((item) => {
        const value = String(item?.value || "").trim().toLowerCase();
        return value === specific || (family && value === family);
      });
    }
    return list.skills.some((skill) => {
      if (/^craft$/i.test(skill)) return /^craft/i.test(skillName);
      if (/^profession$/i.test(skill)) return /^profession/i.test(skillName);
      if (/^perform$/i.test(skill)) return /^perform/i.test(skillName);
      return normalizeSkillName(skill) === target;
    });
  }

  function customSkillListIsSkillOnly(list = {}) {
    const normalized = normalizeCustomSkillList(list);
    if (!normalized) return false;
    if (!Array.isArray(normalized.items) || !normalized.items.length) return true;
    return normalized.items.every((item) =>
      String(item.value || "").toLowerCase().startsWith("skill:"),
    );
  }

  function customSkillListLabel(list = {}) {
    const normalized = normalizeCustomSkillList(list) || list;
    const name = normalized.name || "Custom";
    return `${name} ${customSkillListIsSkillOnly(normalized) ? "Skills" : "List"}`;
  }

  function equipmentItemKind(item = {}, fallbackKind = "") {
    const raw = String(
      item.equipmentKind ||
        item.kind ||
        item.type ||
        item.sourceType ||
        item.details?.type ||
        fallbackKind ||
        "",
    )
      .trim()
      .toLowerCase();
    if (raw.includes("shield")) return "shield";
    if (raw.includes("armor")) return "armor";
    if (raw.includes("weapon")) return "weapon";
    return fallbackKind;
  }

  function itemIsExplicitlyUnequipped(item = {}) {
    const value = item.equipped ?? item.isEquipped ?? item.worn;
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "boolean") return !value;
    return ["no", "false", "0", "unequipped"].includes(
      String(value).trim().toLowerCase(),
    );
  }

  function normalizeEquippedItems(equipment = {}) {
    const rows = [];
    const addRows = (items, fallbackKind) => {
      (Array.isArray(items) ? items : []).forEach((item, index) => {
        if (!item || itemIsExplicitlyUnequipped(item)) return;
        const kind = equipmentItemKind(item, fallbackKind);
        const name = String(item.name || item.item || item.label || "").trim();
        if (!kind || !name) return;
        const sourceId = String(
          item.sourceLootId || item.source_loot_id || item.id || "",
        ).trim();
        const equipmentIndex = Number.isFinite(Number(item.__equipmentIndex))
          ? Number(item.__equipmentIndex)
          : index;
        rows.push({
          id: sourceId || `${kind}:${slugify(name)}:${equipmentIndex}`,
          name,
          kind,
          sourceLootId: String(
            item.sourceLootId || item.source_loot_id || "",
          ).trim(),
        });
      });
    };

    if (Array.isArray(equipment)) addRows(equipment, "");
    else {
      addRows(equipment.weapons, "weapon");
      addRows(equipment.armor, "armor");
      addRows(equipment.items, "");
    }
    return rows;
  }

  function equipmentChoiceOptions(poolId, equipment = {}) {
    const pool = poolById(poolId);
    if (pool?.kind !== "equipment") return [];
    const allowedKinds = new Set(pool.equipmentKinds || []);
    return normalizeEquippedItems(equipment)
      .filter((item) => allowedKinds.has(item.kind))
      .map((item) => ({
        value: `equipped:${item.kind}:${slugify(item.name)}:${slugify(item.id)}`,
        label: item.name,
        equipmentTarget: { ...item },
      }));
  }

  function resolveChoiceStatItem(item = {}, picked = null, options = []) {
    const value =
      typeof picked === "object" ? picked?.value : String(picked || "");
    const option =
      (picked && typeof picked === "object" ? picked : null) ||
      (Array.isArray(options)
        ? options.find((candidate) => String(candidate.value) === value)
        : null);
    const resolved = { ...item, stat: value };
    if (option?.skillName) resolved.skillName = option.skillName;
    if (option?.equipmentTarget) {
      resolved.equipmentTarget = { ...option.equipmentTarget };
      resolved.selectedChoiceLabel = option.label || option.equipmentTarget.name;
    }
    return resolved;
  }

  function equipmentTargetFromBonus(bonus = {}) {
    if (bonus.equipmentTarget && typeof bonus.equipmentTarget === "object")
      return { ...bonus.equipmentTarget };
    const stat = String(bonus.stat || "").trim().toLowerCase();
    if (!stat.startsWith("equipped:")) return null;
    const [, kind = "", name = "", id = ""] = stat.split(":");
    return {
      kind,
      name: unslugify(name),
      id,
      synthetic: true,
    };
  }

  function equipmentTargetMatchesItem(
    target = {},
    item = {},
    fallbackKind = "",
    index = 0,
  ) {
    const candidate = normalizeEquippedItems({
      [fallbackKind === "weapon" ? "weapons" : "armor"]: [
        { ...item, __equipmentIndex: index },
      ],
    })[0];
    if (!candidate) return false;
    const targetKind = String(target.kind || "").toLowerCase();
    if (targetKind && targetKind !== candidate.kind) return false;
    const targetSourceId = String(
      target.sourceLootId || target.source_loot_id || "",
    ).trim();
    if (targetSourceId && candidate.sourceLootId)
      return targetSourceId === candidate.sourceLootId;
    const targetId = String(target.id || "").trim();
    if (
      targetId &&
      (targetId === candidate.id || slugify(targetId) === slugify(candidate.id))
    )
      return true;
    return slugify(target.name || "") === slugify(candidate.name || "");
  }

  function resolveEquipmentEnhancement({
    item = {},
    fallbackKind = "",
    index = 0,
    baseEnhancement = 0,
    buffs = [],
    valueForBonus = (bonus) => Number(bonus.value || 0),
    normalizeValue = (value) => Math.max(0, Number(value || 0)),
  } = {}) {
    const base = normalizeValue(baseEnhancement);
    const candidates = [];
    (Array.isArray(buffs) ? buffs : []).forEach((buff) => {
      (Array.isArray(buff?.bonuses) ? buff.bonuses : []).forEach((bonus) => {
        if (bonus?.conditional) return;
        const target = equipmentTargetFromBonus(bonus);
        if (!target) return;
        if (!equipmentTargetMatchesItem(target, item, fallbackKind, index)) return;
        const value = normalizeValue(valueForBonus(bonus, buff));
        if (value <= 0) return;
        candidates.push({ bonus, buff, value });
      });
    });
    const effect = candidates.reduce(
      (highest, candidate) => Math.max(highest, candidate.value),
      0,
    );
    const value = Math.max(base, effect);
    let winnerClaimed = base >= effect;
    const breakdown = candidates.map((candidate) => {
      const applied = !winnerClaimed && candidate.value === effect;
      if (applied) winnerClaimed = true;
      const overridingValue = Math.max(
        base,
        ...candidates
          .filter((entry) => entry !== candidate)
          .map((entry) => entry.value),
      );
      return {
        ...candidate.bonus,
        source: candidate.buff?.name || candidate.buff?.source || "Effect",
        value: candidate.value,
        type: "equipment enhancement",
        applied,
        detail: applied
          ? `sets the item's enhancement to +${candidate.value}`
          : `overridden by enhancement +${overridingValue}`,
      };
    });
    return { base, effect, value, breakdown };
  }

  // skills: optional override list of [name, ability] pairs (or {name,
  // ability} objects) -- pass a character's own allSkills() to include
  // homebrew custom skills; falls back to the base 30 PF skills.
  async function resolveChoicePoolOptions(poolId, options = {}) {
    const { skills, equipment } = options;
    const pool = poolById(poolId) || choicePoolFallbackFromOptions(poolId, options);
    if (!pool) return [];
    if (pool.kind === "custom-skill-list") {
      if (Array.isArray(pool.items) && pool.items.length) {
        return pool.items.map(normalizeCustomListItem).filter(Boolean);
      }
      const liveSkills = (skills || PF_SKILLS_WITH_ABILITY).map(
        normalizeSkillEntry,
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
        if (/^perform$/i.test(skill)) {
          liveSkills
            .filter((entry) => /^perform(?:\s*\(|\b)/i.test(entry.name))
            .forEach(addSkill);
          return;
        }
        addSkill({ name: skill });
      });
      return options;
    }
    if (pool.kind === "skill") {
      const includeFamilyOptions = pool.trainedOnly || pool.untrained;
      const sourceSkills = [
        ...(skills || PF_SKILLS_WITH_ABILITY),
        ...(includeFamilyOptions ? SKILL_TRAINING_FAMILY_OPTIONS : []),
      ];
      const list = sourceSkills
        .map(normalizeSkillEntry)
        .filter((entry) => {
          if (pool.trainedOnly)
            return skillTrainingStatus(entry.name) === "trained";
          if (pool.untrained)
            return skillTrainingStatus(entry.name) === "untrained";
          if (
            pool.usableAbilities ||
            pool.names ||
            pool.namePrefix ||
            pool.namePrefixes
          ) {
            const prefixes = [
              ...(pool.namePrefix ? [pool.namePrefix] : []),
              ...(Array.isArray(pool.namePrefixes) ? pool.namePrefixes : []),
            ];
            return (
              (pool.usableAbilities &&
                pool.usableAbilities.includes(entry.ability)) ||
              (pool.names && pool.names.includes(entry.name)) ||
              prefixes.some((prefix) =>
                entry.name.toLowerCase().startsWith(prefix.toLowerCase()),
              )
            );
          }
          return !pool.ability || entry.ability === pool.ability;
        });
      const resolved = list.map((entry) => ({
        value: skillStatValue(entry.name),
        label: entry.name,
      }));
      (pool.namedSkillKinds || []).forEach((kind) => {
        const label = skillLabelForStatKey(kind);
        if (!label) return;
        if (resolved.some((option) => option.value === kind)) return;
        resolved.push({
          value: kind,
          label: `${label} (enter specialty)`,
          namedSkillKind: kind,
        });
      });
      return resolved;
    }
    if (pool.kind === "weapon") {
      const weapons = await loadWeaponOptions();
      return weapons.map((weapon) => ({
        value: `weapon:${weapon.value}`,
        label: weapon.label,
      }));
    }
    if (pool.kind === "equipment") {
      return equipmentChoiceOptions(poolId, equipment);
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

  async function resolveConditionalVariableOptions(poolId) {
    const pool = conditionalVariablePoolById(poolId);
    if (!pool) return [];
    if (pool.source === "creature-types") {
      const data = await loadCreatureTypesData();
      const options = Array.isArray(data.favoredEnemyOptions)
        ? data.favoredEnemyOptions
        : [];
      return options
        .map((option) => ({
          value: option.id || option.name,
          label: option.name || option.id || "",
          type: option.type || "",
          subtype: option.subtype || "",
        }))
        .filter((option) => option.value && option.label);
    }
    return [];
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
        <option value="${CREATE_SKILL_LIST_CHOICE_VALUE}">Create custom target list...</option>
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
    if (key.startsWith("equipped:")) {
      const [, kind, name] = key.split(":");
      const kindLabel =
        { weapon: "Weapon", shield: "Shield", armor: "Armor" }[kind] ||
        "Equipment";
      return `Equipped ${kindLabel}: ${unslugify(name)}`;
    }
    if (key.startsWith("spell-school:"))
      return `Spell School: ${unslugify(key.slice("spell-school:".length))}`;
    if (key.startsWith("resistance:"))
      return `Resistance: ${unslugify(key.slice("resistance:".length))}`;
    if (key.startsWith("skill:")) {
      const skillLabel = skillLabelForStatKey(key);
      return skillLabel ? `Skill: ${skillLabel}` : "";
    }
    if (key.startsWith("skill-list:")) {
      const list = skillListForStat(key);
      return list ? customSkillListLabel(list) : "Custom Target List";
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
    CONDITIONAL_VARIABLE_POOLS,
    PF_SKILLS_WITH_ABILITY,
    ENERGY_RESISTANCE_STAT_OPTIONS,
    WEAPON_RESTRICTION_OPTIONS,
    NATURAL_WEAPON_NAME_OPTIONS,
    CREATE_SKILL_LIST_STAT_VALUE,
    CREATE_SKILL_LIST_CHOICE_VALUE,
    poolById,
    conditionalVariablePoolById,
    isChoiceStat,
    choicePoolIdFromStat,
    resolveChoicePoolOptions,
    normalizeEquippedItems,
    equipmentChoiceOptions,
    resolveChoiceStatItem,
    equipmentTargetFromBonus,
    equipmentTargetMatchesItem,
    resolveEquipmentEnhancement,
    resolveConditionalVariableOptions,
    choiceOptgroupHtml,
    energyResistanceOptgroupHtml,
    choiceStatLabel,
    customSkillLists,
    customSkillListIsSkillOnly,
    customSkillListLabel,
    saveCustomSkillList,
    saveCustomSkillLists,
    customSkillListById,
    customSpellLikeLists,
    saveCustomSpellLikeList,
    saveCustomSpellLikeLists,
    customSpellLikeListById,
    normalizeSpellLikeList,
    customFeatLists,
    saveCustomFeatList,
    saveCustomFeatLists,
    customFeatListById,
    normalizeFeatList,
    skillListStatValue,
    skillListIdFromStat,
    skillListForStat,
    skillListIncludesSkill,
    skillStatValue,
    skillLabelForStatKey,
    normalizeSkillEntry,
    normalizeSkillName,
    skillTrainingStatus,
    slugify,
    unslugify,
    normalizeWeaponTypeRestriction,
    weaponTypeRestrictionMatches,
    weaponNameRestrictionMatches,
    weaponTypeRestrictionLabel,
    isAttackOrDamageStat,
  };
})();
