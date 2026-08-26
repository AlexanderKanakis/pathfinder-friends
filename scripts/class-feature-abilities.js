// Computes a character's activatable class-feature abilities (Rage, and
// whatever rage powers/pool choices are bundled into it via
// contributesToAbility) from plain, already-loaded data -- no page
// globals. Shared so the character sheet and the map ("cast as" a
// character onto another token, e.g. Share Rage / Skald's Inspired
// Rage) compute this identically instead of drifting out of sync the
// way two hand-copies of this logic already have once this session.
(function () {
  function classNameOf(definition) {
    return definition?.name || definition?.className || "";
  }

  function classDefinitionByName(classDefinitions, name) {
    const target = String(name || "").toLowerCase();
    return (
      (classDefinitions || []).find(
        (definition) => classNameOf(definition).toLowerCase() === target,
      ) || null
    );
  }

  function classLevelAt(definition, classLevel) {
    const progression =
      definition?.levelProgression || definition?.levels || [];
    return (
      progression.find((row) => Number(row.level) === Number(classLevel)) ||
      null
    );
  }

  function featurePools(feature) {
    return Array.isArray(feature.pools)
      ? feature.pools
      : Array.isArray(feature.choicePools)
        ? feature.choicePools
        : [];
  }

  function progressionClassCounts(classProgression, limit) {
    const counts = {};
    (classProgression || []).slice(0, limit).forEach((row) => {
      if (!row.className) return;
      counts[row.className] = (counts[row.className] || 0) + 1;
    });
    return counts;
  }

  function classFeatureChoiceKey(feature, pool, context = {}) {
    return [
      context.className || "",
      context.characterLevel || "",
      context.classLevel || "",
      feature.name || "Class Feature",
      pool.name || "Pool",
    ].join("|");
  }

  function normalizedClassFeatureChoice(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/\((?:ex|su|sp)\)/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function classFeatureChoiceMatchesRequirement(required = "", selected = "") {
    const requiredText = normalizedClassFeatureChoice(required);
    const selectedText = normalizedClassFeatureChoice(selected);
    if (!requiredText || !selectedText) return false;
    if (requiredText === selectedText) return true;
    const requiredWords = requiredText
      .split(/\s+/)
      .filter((word) => !["rage", "power", "the"].includes(word));
    const selectedWords = new Set(selectedText.split(/\s+/));
    return (
      requiredWords.length > 0 &&
      requiredWords.every((word) => selectedWords.has(word))
    );
  }

  function abilityMod(score) {
    return Math.floor((Number(score || 10) - 10) / 2);
  }

  // Chains (lesser/normal/greater totems, mutagens, ...) upgrade rather
  // than stack -- keep only the option nothing else selected requires as
  // ITS OWN prerequisite (the most-evolved tier actually chosen).
  function terminalOptions(options) {
    const grouped = new Map();
    const ungrouped = [];
    options.forEach((option) => {
      const group = String(option.requirements?.excludesGroup || "").trim();
      if (!group) {
        ungrouped.push(option);
        return;
      }
      const list = grouped.get(group) || [];
      list.push(option);
      grouped.set(group, list);
    });
    const result = [...ungrouped];
    grouped.forEach((groupOptions) => {
      if (groupOptions.length <= 1) {
        result.push(...groupOptions);
        return;
      }
      const terminal = groupOptions.filter(
        (option) =>
          !groupOptions.some(
            (other) =>
              other !== option &&
              (other.requirements?.requiredChoices || []).some((req) =>
                classFeatureChoiceMatchesRequirement(req, option.name),
              ),
          ),
      );
      result.push(...(terminal.length ? terminal : groupOptions));
    });
    return result;
  }

  // classDefinitions: array of loaded class JSON (window.PFClassData.loadAllClasses())
  // classProgression: [{level, className}, ...] for ONE character
  // classFeatureChoices: {key: selectedOptionName} for that SAME character
  // characterLevel: number
  // abilityScores: {str,dex,con,int,wis,cha} raw scores
  function collectActivatableAbilities({
    classDefinitions = [],
    classProgression = [],
    classFeatureChoices = {},
    characterLevel = 1,
    abilityScores = {},
  } = {}) {
    const limit = Math.max(1, Number(characterLevel) || 1);
    const counts = {};
    const classLevels = progressionClassCounts(classProgression, limit);
    const entries = [];
    classProgression.slice(0, limit).forEach((row) => {
      const className = row.className;
      if (!className) return;
      counts[className] = (counts[className] || 0) + 1;
      const classLevel = counts[className];
      const definition = classDefinitionByName(classDefinitions, className);
      const levelData = classLevelAt(definition, classLevel);
      const features = levelData?.classFeatures || levelData?.special || [];
      features.forEach((feature) => {
        if (typeof feature === "string") return;
        entries.push({
          feature,
          context: {
            className,
            classLevel,
            classLevels,
            characterLevel: row.level,
          },
        });
      });
    });

    const contributedOptions = new Map();
    entries.forEach(({ feature, context }) => {
      featurePools(feature).forEach((pool) => {
        const target = String(pool.contributesToAbility || "").trim();
        if (!target) return;
        const key = classFeatureChoiceKey(
          { ...feature, ...context },
          pool,
          context,
        );
        const selected = classFeatureChoices[key];
        const option = (pool.options || []).find(
          (item) => item.name === selected,
        );
        if (!option) return;
        const targetKey = target.toLowerCase();
        const list = contributedOptions.get(targetKey) || [];
        list.push(option);
        contributedOptions.set(targetKey, list);
      });
    });

    const contributedEffects = new Map();
    const contributedDr = new Map();
    const contributedSr = new Map();
    const contributedNames = new Map();
    contributedOptions.forEach((options, targetKey) => {
      const finalOptions = terminalOptions(options);
      const effects = [];
      const dr = [];
      const sr = [];
      const names = [];
      finalOptions.forEach((option) => {
        if (Array.isArray(option.effects) && option.effects.length)
          effects.push(...option.effects);
        if (
          Array.isArray(option.damageReduction) &&
          option.damageReduction.length
        )
          dr.push(...option.damageReduction);
        if (
          Array.isArray(option.spellResistance) &&
          option.spellResistance.length
        )
          sr.push(...option.spellResistance);
        names.push(option.name);
      });
      if (effects.length) contributedEffects.set(targetKey, effects);
      if (dr.length) contributedDr.set(targetKey, dr);
      if (sr.length) contributedSr.set(targetKey, sr);
      if (names.length) contributedNames.set(targetKey, names);
    });

    const abilityMods = {
      STR: abilityMod(abilityScores.str),
      DEX: abilityMod(abilityScores.dex),
      CON: abilityMod(abilityScores.con),
      INT: abilityMod(abilityScores.int),
      WIS: abilityMod(abilityScores.wis),
      CHA: abilityMod(abilityScores.cha),
    };
    const castContext = {
      characterLevel: limit,
      classLevels,
      casterLevel: limit,
      abilityMods,
    };

    const abilities = new Map();
    entries.forEach(({ feature, context }) => {
      if (!feature.activatable) return;
      const key = `${context.className}:${feature.name}`;
      if (abilities.has(key)) return;
      const targetKey = String(feature.name || "")
        .trim()
        .toLowerCase();
      const bundled = contributedEffects.get(targetKey) || [];
      const bundledDr = contributedDr.get(targetKey) || [];
      const bundledSr = contributedSr.get(targetKey) || [];
      const bundledNames = contributedNames.get(targetKey) || [];
      const durationConfig = feature.durationConfig || {
        count: null,
        unit: "variable",
        factors: [],
      };
      const damageReduction = [
        ...(Array.isArray(feature.damageReduction)
          ? feature.damageReduction
          : []),
        ...bundledDr,
      ];
      const spellResistance = [
        ...(Array.isArray(feature.spellResistance)
          ? feature.spellResistance
          : []),
        ...bundledSr,
      ];
      abilities.set(key, {
        id: `ability:${key}`,
        name: feature.name || "Class Feature",
        category: "Class Feature",
        source: bundledNames.length
          ? `${context.className} -- with ${bundledNames.join(", ")}`
          : context.className,
        bonuses: [
          ...(Array.isArray(feature.effects) ? feature.effects : []),
          ...bundled,
        ],
        ...(damageReduction.length ? { damageReduction } : {}),
        ...(spellResistance.length ? { spellResistance } : {}),
        durationConfig,
        duration: window.PFEffectMeta?.durationLabel
          ? window.PFEffectMeta.durationLabel(durationConfig)
          : "variable",
        fromAbility: true,
        abilityContext: castContext,
      });
    });
    return [...abilities.values()];
  }

  window.PFClassFeatureAbilities = { collectActivatableAbilities };
})();
