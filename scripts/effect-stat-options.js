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

  // The 5 PF1e energy types (acid/cold/electricity/fire/sonic) -- e.g.
  // "Energy Resistance 10 against an energy type of your choice."
  const ENERGY_RESISTANCE_OPTIONS = [
    "Acid",
    "Cold",
    "Electricity",
    "Fire",
    "Sonic",
  ].map((label) => ({ value: slugify(label), label }));

  // Same 5 energy types, but as fixed stats an author picks directly --
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

  // Skill pools are resolved dynamically against whichever skill list is
  // passed in (base 30 PF skills by default, or a character's actual
  // list including homebrew custom skills when called from the sheet).
  const SKILL_POOLS = [
    { id: "skills-all", label: "All Skills", ability: null },
    { id: "skills-str", label: "Strength Skills", ability: "str" },
    { id: "skills-dex", label: "Dexterity Skills", ability: "dex" },
    { id: "skills-con", label: "Constitution Skills", ability: "con" },
    { id: "skills-int", label: "Intelligence Skills", ability: "int" },
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

  const ALL_POOLS = [
    ...SKILL_POOLS.map((pool) => ({ ...pool, kind: "skill" })),
    ...STATIC_POOLS.map((pool) => ({ ...pool, kind: "static" })),
    { id: "weapons-all", label: "All Weapons", kind: "weapon" },
  ];

  function poolById(id) {
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

  // skills: optional override list of [name, ability] pairs (or {name,
  // ability} objects) -- pass a character's own allSkills() to include
  // homebrew custom skills; falls back to the base 30 PF skills.
  async function resolveChoicePoolOptions(poolId, { skills } = {}) {
    const pool = poolById(poolId);
    if (!pool) return [];
    if (pool.kind === "skill") {
      const list = (skills || PF_SKILLS_WITH_ABILITY)
        .map((entry) =>
          Array.isArray(entry)
            ? { name: entry[0], ability: entry[1] }
            : { name: entry.name, ability: entry.ability },
        )
        .filter((entry) => {
          if (pool.usableAbilities || pool.names) {
            return (
              (pool.usableAbilities &&
                pool.usableAbilities.includes(entry.ability)) ||
              (pool.names && pool.names.includes(entry.name))
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
    return `
      <optgroup label="Choose When Applied">
        ${ALL_POOLS.map(
          (pool) =>
            `<option value="choice:${pool.id}" ${selected === `choice:${pool.id}` ? "selected" : ""}>${esc(pool.label)} (choose one)</option>`,
        ).join("")}
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
    poolById,
    isChoiceStat,
    choicePoolIdFromStat,
    resolveChoicePoolOptions,
    choiceOptgroupHtml,
    energyResistanceOptgroupHtml,
    choiceStatLabel,
    slugify,
    unslugify,
  };
})();
