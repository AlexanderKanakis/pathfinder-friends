(function (root, factory) {
  const api = factory(root);
  if (root) root.PFD20Boosts = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const ROLL_KINDS = Object.freeze([
    "attacks",
    "saves",
    "skills",
    "cmb",
    "cmd",
    "abilities",
  ]);
  const STACKING_TYPES = new Set(["untyped", "dodge", "circumstance"]);

  function numberOr(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function scaledValue(value, scale, context = {}) {
    if (root?.PFDamageRolls?.scaledValue)
      return root.PFDamageRolls.scaledValue(value, scale, context);
    if (root?.PFBuffs?.scaledBonusValue)
      return root.PFBuffs.scaledBonusValue(
        { value, bonusScale: scale },
        context.sourceEffect || {},
        context,
      );
    return numberOr(value, 0);
  }

  function stablePart(value = "") {
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function normalizeAppliesTo(value) {
    const values = Array.isArray(value) ? value : [];
    const normalized = [...new Set(values.map(stablePart))].filter((entry) =>
      ["all", ...ROLL_KINDS].includes(entry),
    );
    return normalized.includes("all") || !normalized.length ? ["all"] : normalized;
  }

  function normalizeBoost(boost = {}, index = 0) {
    return {
      ...boost,
      id: String(boost.id || `d20-boost-${index + 1}`),
      label: String(boost.label || "Boost d20").trim() || "Boost d20",
      diceCount: Math.max(0, Math.floor(numberOr(boost.diceCount, 0))),
      dieType: Math.max(2, Math.floor(numberOr(boost.dieType, 6))),
      diceCountScale: boost.diceCountScale || null,
      staticValue: numberOr(boost.staticValue, 0),
      staticValueScale: boost.staticValueScale || null,
      uses: Math.max(0, Math.floor(numberOr(boost.uses, 1))),
      usesScale: boost.usesScale || null,
      usesPeriod: stablePart(boost.usesPeriod || "day") || "day",
      appliesTo: normalizeAppliesTo(boost.appliesTo),
      bonusType: String(boost.bonusType || "untyped").trim().toLowerCase() || "untyped",
    };
  }

  function maximumUses(boost, context = {}) {
    const row = normalizeBoost(boost);
    return Math.max(0, Math.floor(scaledValue(row.uses, row.usesScale, context)));
  }

  function appliesTo(boost, rollKind) {
    const kinds = normalizeBoost(boost).appliesTo;
    return kinds.includes("all") || kinds.includes(stablePart(rollKind));
  }

  function rageSession(activeEffects = []) {
    const effect = (Array.isArray(activeEffects) ? activeEffects : []).find((entry) => {
      const resource = stablePart(entry?.resourcePool?.id || entry?.resourcePoolId);
      const name = stablePart(entry?.name || entry?.label);
      return (
        resource === "rage-rounds" ||
        resource === "raging-song-rounds" ||
        /(^|-)(rage|raging-song|inspired-rage)(-|$)/.test(name)
      );
    });
    if (!effect) return "";
    return String(
      effect.id || effect.appliedAt || effect.startedAt || effect.createdAt || effect.name,
    );
  }

  function resourceKey(source = {}, boost = {}, index = 0) {
    const sourceId = source.id || source.effectId || source.sourceId ||
      [source.category, source.source, source.name].filter(Boolean).join("::") ||
      "effect";
    return `${stablePart(sourceId)}::${stablePart(boost.id || index + 1)}`;
  }

  function collectResources({ sources = [], usage = {}, rollKind, context = {}, activeEffects = [] } = {}) {
    const rageKey = rageSession(activeEffects);
    return (Array.isArray(sources) ? sources : []).flatMap((source, sourceIndex) =>
      (Array.isArray(source?.d20Boosts) ? source.d20Boosts : []).flatMap(
        (rawBoost, boostIndex) => {
          const boost = normalizeBoost(rawBoost, boostIndex);
          if (!appliesTo(boost, rollKind)) return [];
          if (boost.usesPeriod === "rage" && !rageKey) return [];
          const key = resourceKey(source, boost, sourceIndex * 1000 + boostIndex);
          const periodKey = boost.usesPeriod === "rage" ? rageKey : boost.usesPeriod;
          const maxUses = maximumUses(boost, { ...context, sourceEffect: source });
          const saved = usage?.[key];
          const remaining =
            saved && saved.periodKey === periodKey
              ? Math.max(0, Math.floor(numberOr(saved.remaining, maxUses)))
              : maxUses;
          return [{ key, source, boost, periodKey, maxUses, remaining }];
        },
      ),
    );
  }

  function rollBoost(resource, random = Math.random, context = {}) {
    const boost = normalizeBoost(resource?.boost || resource);
    const diceCount = Math.max(
      0,
      Math.floor(scaledValue(boost.diceCount, boost.diceCountScale, context)),
    );
    const staticValue = scaledValue(
      boost.staticValue,
      boost.staticValueScale,
      context,
    );
    const dice = Array.from({ length: diceCount }, () =>
      Math.floor(random() * boost.dieType) + 1,
    );
    return {
      dice,
      diceTotal: dice.reduce((sum, value) => sum + value, 0),
      staticValue,
      value: dice.reduce((sum, value) => sum + value, 0) + staticValue,
      bonusType: boost.bonusType,
    };
  }

  function stackingValue(applied = [], candidate = {}) {
    const type = stablePart(candidate.bonusType || "untyped") || "untyped";
    const value = numberOr(candidate.value, 0);
    if (value <= 0 || STACKING_TYPES.has(type)) return value;
    const existing = Math.max(
      0,
      ...(Array.isArray(applied) ? applied : [])
        .filter((entry) => stablePart(entry.bonusType) === type)
        .map((entry) => numberOr(entry.value, 0)),
    );
    return Math.max(0, value - existing);
  }

  function bonusAppliesToRoll(bonus = {}, rollKind = "", roll = {}) {
    const stat = stablePart(bonus.stat || bonus.appliesTo || "");
    const kind = stablePart(rollKind);
    const label = stablePart(roll.label || roll.rollLabel || "");
    const attackType = stablePart(roll.attackType || "");
    if (kind === "attacks")
      return stat === "attack" ||
        (stat === "melee-attack" && attackType.startsWith("melee")) ||
        (stat === "ranged-attack" && attackType.startsWith("ranged"));
    if (kind === "saves")
      return ["saving-throws", "save"].includes(stat) || stat === label;
    if (kind === "skills")
      return stat === "skill-checks" || stat === `skill-${label}`;
    if (kind === "cmb") return stat === "cmb" || stat === "combat-maneuver-checks";
    if (kind === "cmd") return stat === "cmd" || stat === "combat-maneuver-defense";
    if (kind === "abilities")
      return stat === "ability-checks" || stat === `${label}-checks`;
    return false;
  }

  function baselineBonuses({ sources = [], rollKind, context = {}, roll = {} } = {}) {
    const best = new Map();
    (Array.isArray(sources) ? sources : []).forEach((source) => {
      const rows = Array.isArray(source?.bonuses)
        ? source.bonuses
        : Array.isArray(source?.effects)
          ? source.effects
          : [];
      rows.filter((bonus) => bonusAppliesToRoll(bonus, rollKind, roll)).forEach((bonus) => {
        const type = stablePart(bonus.type || "untyped") || "untyped";
        if (STACKING_TYPES.has(type) || bonus.stacks) return;
        const value = scaledValue(bonus.value, bonus.bonusScale || bonus.scale, {
          ...context,
          sourceEffect: source,
        });
        if (value > numberOr(best.get(type)?.value, 0))
          best.set(type, { value, bonusType: type, baseline: true });
      });
    });
    return [...best.values()];
  }

  function spend(usage = {}, resource = {}) {
    return {
      ...usage,
      [resource.key]: {
        remaining: Math.max(0, numberOr(resource.remaining, resource.maxUses) - 1),
        periodKey: resource.periodKey,
      },
    };
  }

  function refill(usage = {}, resource = {}) {
    return {
      ...usage,
      [resource.key]: {
        remaining: Math.max(0, numberOr(resource.maxUses, 0)),
        periodKey: resource.periodKey,
      },
    };
  }

  return {
    ROLL_KINDS,
    normalizeBoost,
    maximumUses,
    appliesTo,
    rageSession,
    resourceKey,
    collectResources,
    rollBoost,
    stackingValue,
    baselineBonuses,
    spend,
    refill,
  };
});
