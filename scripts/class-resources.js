(function () {
  const ABILITY_KEYS = {
    str: "str",
    strength: "str",
    dex: "dex",
    dexterity: "dex",
    con: "con",
    constitution: "con",
    int: "int",
    intelligence: "int",
    wis: "wis",
    wisdom: "wis",
    cha: "cha",
    charisma: "cha",
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function resourceKey(className, resourceId) {
    return `${clean(className).toLowerCase()}:${clean(resourceId).toLowerCase()}`;
  }

  function classLevels(classProgression = [], characterLevel = 20) {
    const result = {};
    const limit = Math.max(0, Number(characterLevel) || 0);
    classProgression.slice(0, limit).forEach((row) => {
      const name = clean(row?.className);
      if (name) result[name] = (result[name] || 0) + 1;
    });
    return result;
  }

  function classDefinition(classDefinitions = [], className = "") {
    const target = clean(className).toLowerCase();
    return (
      classDefinitions.find(
        (definition) => clean(definition?.name).toLowerCase() === target,
      ) || null
    );
  }

  function abilityModifier(abilityScores = {}, ability = "") {
    const key = ABILITY_KEYS[clean(ability).toLowerCase()];
    if (!key) return 0;
    return Math.floor((Number(abilityScores[key] ?? 10) - 10) / 2);
  }

  function formulaValue(formula = {}, classLevel = 0, abilityScores = {}) {
    const level = Math.max(0, Number(classLevel) || 0);
    const levelRule = formula.classLevel || {};
    const adjustedLevel = Math.max(
      0,
      level + Number(levelRule.offset || 0),
    );
    const levelValue = Math.floor(
      (adjustedLevel * Number(levelRule.multiplier ?? 0)) /
        Math.max(1, Number(levelRule.divisor || 1)),
    );
    const abilityValue = formula.ability
      ? abilityModifier(abilityScores, formula.ability) *
        Number(formula.abilityMultiplier ?? 1)
      : 0;
    const value = Number(formula.base || 0) + levelValue + abilityValue;
    return Math.max(Number(formula.minimum ?? 0), Math.floor(value));
  }

  function derive({
    classDefinitions = [],
    classProgression = [],
    characterLevel = 20,
    abilityScores = {},
    values = {},
  } = {}) {
    const levels = classLevels(classProgression, characterLevel);
    return Object.entries(levels).flatMap(([className, level]) => {
      const definition = classDefinition(classDefinitions, className);
      return (definition?.classResources || [])
        .filter((resource) => level >= Number(resource.unlockLevel || 1))
        .map((resource) => {
          const key = resourceKey(className, resource.id);
          const maximum = formulaValue(
            resource.maximum,
            level,
            abilityScores,
          );
          const defaultCurrent = formulaValue(
            resource.dailyValue || resource.maximum,
            level,
            abilityScores,
          );
          const saved = Number(values?.[key]);
          const current = Number.isFinite(saved)
            ? Math.max(0, Math.min(maximum, Math.floor(saved)))
            : Math.min(maximum, defaultCurrent);
          return {
            ...resource,
            key,
            className,
            classLevel: level,
            maximum,
            current,
          };
        });
    });
  }

  function poolForEffect(effect = {}) {
    const pool = effect.resourcePool;
    if (!pool?.id || !pool?.className) return null;
    return {
      ...pool,
      key: resourceKey(pool.className, pool.id),
      cost: Math.max(1, Number(pool.cost || 1)),
    };
  }

  function insufficientMessage(effect = {}, check = {}) {
    const resourceName =
      check.resource?.name || check.pool?.id || effect.resourcePool?.id || "resource";
    return `Not enough ${resourceName} to activate ${effect.name || "this ability"}.`;
  }

  function resourceForEffect(sheet = {}, effect = {}, classDefinitions = []) {
    const pool = poolForEffect(effect);
    if (!pool) return null;
    const resources = derive({
      classDefinitions,
      classProgression: sheet.classProgression || [],
      characterLevel: Number(sheet.fields?.characterLevel || 20),
      abilityScores: Object.fromEntries(
        Object.entries(sheet.abilities || {}).map(([key, value]) => [
          key,
          Number(value?.score ?? 10),
        ]),
      ),
      values: sheet.classResources || {},
    });
    return resources.find((resource) => resource.key === pool.key) || null;
  }

  function canSpend(sheet = {}, effect = {}, classDefinitions = []) {
    const pool = poolForEffect(effect);
    if (!pool) return { ok: true, pool: null, resource: null };
    const resource = resourceForEffect(sheet, effect, classDefinitions);
    return {
      ok: Boolean(resource && resource.current >= pool.cost),
      pool,
      resource,
    };
  }

  function spend(sheet = {}, effect = {}, classDefinitions = []) {
    const check = canSpend(sheet, effect, classDefinitions);
    if (!check.pool) return { ...check, sheet };
    if (!check.ok) return { ...check, sheet };
    const next = structuredClone(sheet || {});
    next.classResources = { ...(next.classResources || {}) };
    next.classResources[check.pool.key] =
      check.resource.current - check.pool.cost;
    return {
      ...check,
      sheet: next,
      current: next.classResources[check.pool.key],
    };
  }

  window.PFClassResources = {
    abilityModifier,
    canSpend,
    classLevels,
    derive,
    formulaValue,
    insufficientMessage,
    poolForEffect,
    resourceForEffect,
    resourceKey,
    spend,
  };
})();
