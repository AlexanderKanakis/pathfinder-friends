(function (root, factory) {
  const api = factory(root);
  if (root) root.PFPeriodicEffects = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const TIMINGS = new Set([
    "target-turn-start",
    "target-turn-end",
    "caster-turn-start",
    "caster-turn-end",
  ]);
  const OPERATIONS = new Set([
    "damage",
    "healing",
    "ability-damage",
    "ability-drain",
  ]);

  const number = (value, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  const optionalMaximum = (value) =>
    value === "" || value === null || value === undefined
      ? null
      : Math.max(0, Math.floor(number(value)));
  const clone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));

  function normalize(row = {}) {
    const operation = OPERATIONS.has(row.operation) ? row.operation : "damage";
    return {
      id: String(row.id || `periodic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      label: String(row.label || "Periodic Effect").trim() || "Periodic Effect",
      timing: TIMINGS.has(row.timing) ? row.timing : "target-turn-end",
      delivery: row.delivery === "area" ? "area" : "attached",
      operation,
      ability: ["ability-damage", "ability-drain"].includes(operation)
        ? String(row.ability || "strength").trim().toLowerCase()
        : "",
      diceCount: Math.max(0, Math.floor(number(row.diceCount))),
      dieType: Math.max(2, Math.floor(number(row.dieType, 6))),
      diceCountMax: optionalMaximum(row.diceCountMax),
      diceCountScale: row.diceCountScale || null,
      staticValue: Math.max(0, Math.floor(number(row.staticValue))),
      staticValueMax: optionalMaximum(row.staticValueMax),
      staticValueScale: row.staticValueScale || null,
      damageType: operation === "damage"
        ? String(row.damageType || "untyped").trim() || "untyped"
        : "",
      saveMode: String(row.saveMode || "").trim(),
      saveConfig:
        row.saveConfig && typeof row.saveConfig === "object"
          ? clone(row.saveConfig)
          : null,
    };
  }

  function explicitRows(effect = {}, { delivery = "" } = {}) {
    return (Array.isArray(effect.periodicEffects) ? effect.periodicEffects : [])
      .map(normalize)
      .filter((row) => !delivery || row.delivery === delivery);
  }

  function fastHealingValue(effect = {}, context = {}) {
    const bonuses = Array.isArray(effect.bonuses)
      ? effect.bonuses
      : Array.isArray(effect.effects)
        ? effect.effects
        : [];
    return bonuses.reduce((highest, bonus) => {
      if (
        String(bonus?.stat || "").trim().toLowerCase() !== "fast healing" ||
        bonus?.conditional
      )
        return highest;
      const value = root?.PFBuffs?.scaledBonusValue
        ? root.PFBuffs.scaledBonusValue(bonus, effect, context)
        : number(bonus.value);
      return Math.max(highest, Math.max(0, Math.floor(number(value))));
    }, 0);
  }

  function implicitFastHealing(effect = {}, context = {}) {
    const value = fastHealingValue(effect, context);
    return value > 0
      ? {
          id: `${effect.id || effect.name || "effect"}:fast-healing`,
          label: "Fast Healing",
          timing: "target-turn-end",
          delivery: "attached",
          operation: "healing",
          ability: "",
          diceCount: 0,
          dieType: 6,
          diceCountMax: null,
          diceCountScale: null,
          staticValue: value,
          staticValueMax: null,
          staticValueScale: null,
          damageType: "",
          implicitFastHealing: true,
        }
      : null;
  }

  function rows(effect = {}, options = {}) {
    const result = explicitRows(effect, options);
    if (!options.delivery || options.delivery === "attached") {
      const fastHealing = implicitFastHealing(effect, options.context || {});
      if (fastHealing) result.push(fastHealing);
    }
    return result;
  }

  function formula(row = {}) {
    const normalized = normalize(row);
    return {
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      diceCountMax: normalized.diceCountMax,
      diceCountScale: normalized.diceCountScale,
      staticValue: normalized.staticValue,
      staticValueMax: normalized.staticValueMax,
      staticValueScale: normalized.staticValueScale,
    };
  }

  function roll(row = {}, context = {}, random = Math.random) {
    const normalized = normalize(row);
    if (normalized.implicitFastHealing) return normalized.staticValue;
    const result = root?.PFEffectRolls?.rollFormula?.(
      formula(normalized),
      context,
      random,
    );
    return Math.max(0, Math.floor(number(result?.total, normalized.staticValue)));
  }

  function abilityCondition(row = {}, amount = 0, sourceEffect = {}) {
    const normalized = normalize(row);
    if (
      !["ability-damage", "ability-drain"].includes(normalized.operation) ||
      amount <= 0
    )
      return null;
    const kind = normalized.operation;
    const base = {
      id: `${normalized.id}:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: normalized.label,
      category: "condition",
      permanent: true,
      remaining: null,
      sourceTokenId: sourceEffect.sourceTokenId || sourceEffect.casterTokenId || "",
      adjustableCondition: {
        kind,
        stat: normalized.ability,
        amount,
        minimum: 1,
        label: "Value",
      },
      bonuses: [],
    };
    return root?.PFConditionConfig?.configure
      ? root.PFConditionConfig.configure(base, {
          ability: normalized.ability,
          amount,
        })
      : base;
  }

  function hasAreaRows(effect = {}) {
    return explicitRows(effect, { delivery: "area" }).length > 0;
  }

  function withoutAreaRows(effect = {}) {
    const periodicEffects = explicitRows(effect, { delivery: "attached" });
    const next = { ...effect };
    if (periodicEffects.length) next.periodicEffects = periodicEffects;
    else delete next.periodicEffects;
    return next;
  }

  return {
    TIMINGS: [...TIMINGS],
    OPERATIONS: [...OPERATIONS],
    normalize,
    explicitRows,
    rows,
    formula,
    roll,
    abilityCondition,
    hasAreaRows,
    withoutAreaRows,
  };
});
