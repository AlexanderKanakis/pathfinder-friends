(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectRolls = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const DIE_SIDES = Object.freeze([2, 3, 4, 6, 8, 10, 12, 20, 100]);

  function numberOr(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function optionalMaximum(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  function normalizeFormula(formula = {}) {
    return {
      diceCount: Math.max(0, Math.floor(numberOr(formula.diceCount, 0))),
      dieType: DIE_SIDES.includes(Number(formula.dieType))
        ? Number(formula.dieType)
        : Math.max(2, Math.floor(numberOr(formula.dieType, 6))),
      diceCountMax: optionalMaximum(formula.diceCountMax),
      staticValue: numberOr(formula.staticValue, 0),
      staticValueMax: optionalMaximum(formula.staticValueMax),
      diceCountScale: formula.diceCountScale || null,
      staticValueScale: formula.staticValueScale || null,
      maximizeDice: Boolean(formula.maximizeDice),
      valueMultiplier: Math.max(0, numberOr(formula.valueMultiplier, 1)),
      valueDivisor: Math.max(1, numberOr(formula.valueDivisor, 1)),
    };
  }

  function fallbackScaledValue(value, scale, context = {}) {
    if (!scale) return numberOr(value, 0);
    const source = scale.source || { type: "caster" };
    const level =
      source.type === "character"
        ? numberOr(context.characterLevel, 1)
        : source.type === "class"
          ? numberOr(
              context.classLevels?.[source.className],
              context.classLevel || 1,
            )
          : numberOr(context.casterLevel, 1);
    const multiplier = scale.levelMultiplier;
    let total = numberOr(value, 0);
    if (multiplier && numberOr(multiplier.denominator, 0) > 0) {
      total += Math.floor(
        (level * numberOr(multiplier.numerator, 0)) /
          numberOr(multiplier.denominator, 1),
      );
    }
    (Array.isArray(scale.milestones) ? scale.milestones : [])
      .filter((entry) => numberOr(entry.level, 0) <= level)
      .sort((a, b) => numberOr(a.level) - numberOr(b.level))
      .forEach((entry) => {
        total = numberOr(entry.value, total);
      });
    const every = scale.every || {};
    const from = numberOr(
      every.fromLevel || every.afterLevel || every.after,
      0,
    );
    const interval = numberOr(every.everyLevels || every.every, 0);
    if (from > 0 && interval > 0 && level >= from) {
      total +=
        (Math.floor((level - from) / interval) + 1) *
        numberOr(every.increase, 0);
    }
    const attributeBonuses = Array.isArray(scale.attributeBonuses)
      ? scale.attributeBonuses
      : scale.attributeBonus
        ? [scale.attributeBonus]
        : [];
    attributeBonuses.forEach((entry) => {
      const requested = String(
        entry.ability || entry.attribute || "",
      ).toLowerCase();
      const castingModifier = [
        "casting",
        "casting modifier",
        "castingmodifier",
      ].includes(requested);
      const key = castingModifier
        ? String(
            context.castingAbility ||
              context.spellCalculations?.castingAbility ||
              "",
          ).toLowerCase()
        : requested;
      const modifier = castingModifier
        ? numberOr(
            context.castingAbilityMod ??
              context.spellCalculations?.castingAbilityMod ??
              context.abilityMods?.[key] ??
              context.abilityMods?.[key.slice(0, 3)],
            0,
          )
        : numberOr(
            context.abilityMods?.[key] ??
              context.abilityMods?.[key.slice(0, 3)] ??
              context.abilityMods?.[key.slice(0, 3).toUpperCase()],
            0,
          );
      total += Math.floor(
        (modifier * Math.max(1, numberOr(entry.numerator, 1))) /
          Math.max(1, numberOr(entry.denominator, 1)),
      );
    });
    return scale.minimumOne ? Math.max(1, total) : total;
  }

  function scaledValue(value, scale, context = {}) {
    if (root?.PFBuffs?.scaledBonusValue) {
      return root.PFBuffs.scaledBonusValue(
        { value, bonusScale: scale },
        context.effect || {
          casterLevel: context.casterLevel,
          characterLevel: context.characterLevel,
          classLevel: context.classLevel,
          classLevels: context.classLevels,
        },
        context,
      );
    }
    return fallbackScaledValue(value, scale, context);
  }

  function formulaText(formula = {}) {
    const normalized = normalizeFormula(formula);
    const dice = normalized.diceCount
      ? `${normalized.diceCount}d${normalized.dieType}`
      : "";
    const flat = normalized.staticValue
      ? dice
        ? ` ${normalized.staticValue >= 0 ? "+" : "-"} ${Math.abs(normalized.staticValue)}`
        : String(normalized.staticValue)
      : "";
    const base = `${dice}${flat}` || "0";
    const numerator = `${base}${normalized.maximizeDice && normalized.diceCount ? " (maximized)" : ""}${normalized.valueMultiplier !== 1 ? ` x ${normalized.valueMultiplier}` : ""}`;
    return normalized.valueDivisor !== 1
      ? `(${numerator}) / ${normalized.valueDivisor}`
      : numerator;
  }

  function calculateFormula(formula = {}, context = {}) {
    const normalized = normalizeFormula(formula);
    let diceCount = Math.max(
      0,
      Math.floor(
        scaledValue(
          normalized.diceCount,
          normalized.diceCountScale,
          context,
        ),
      ),
    );
    let staticValue = scaledValue(
      normalized.staticValue,
      normalized.staticValueScale,
      context,
    );
    if (normalized.diceCountMax !== null)
      diceCount = Math.min(diceCount, normalized.diceCountMax);
    if (normalized.staticValueMax !== null)
      staticValue = Math.min(staticValue, normalized.staticValueMax);
    const calculated = {
      ...normalized,
      diceCount,
      staticValue,
    };
    return { ...calculated, formula: formulaText(calculated) };
  }

  function rollFormula(formula = {}, context = {}, random = Math.random) {
    const calculated = calculateFormula(formula, context);
    const dice = Array.from({ length: calculated.diceCount }, () =>
      calculated.maximizeDice
        ? calculated.dieType
        : Math.floor(random() * calculated.dieType) + 1,
    );
    const subtotal =
      dice.reduce((sum, value) => sum + value, 0) + calculated.staticValue;
    return {
      ...calculated,
      dice,
      subtotal,
      total: Math.floor(
        (subtotal * calculated.valueMultiplier) / calculated.valueDivisor,
      ),
    };
  }

  function damageFormula(profile = {}) {
    return normalizeFormula({
      ...profile,
      staticValue: profile.staticDamage,
      staticValueMax: profile.staticDamageMax,
      staticValueScale: profile.staticDamageScale,
      valueMultiplier: profile.damageMultiplier,
      valueDivisor: profile.damageDenominator,
    });
  }

  function parseDiceFormula(value = "") {
    const match = String(value || "")
      .trim()
      .match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!match) return null;
    return normalizeFormula({
      diceCount: Number(match[1]),
      dieType: Number(match[2]),
      staticValue:
        Number(match[4] || 0) * (match[3] === "-" ? -1 : 1),
    });
  }

  function weaponFormula(details = {}) {
    const legacy = parseDiceFormula(details.damage) || {};
    return normalizeFormula({
      ...legacy,
      ...details,
      diceCount: details.diceCount ?? legacy.diceCount ?? 0,
      dieType: details.dieType ?? legacy.dieType ?? 6,
      staticValue:
        details.staticDamage ??
        numberOr(legacy.staticValue, 0) + numberOr(details.damageMisc, 0),
      staticValueMax: details.staticDamageMax,
      staticValueScale: details.staticDamageScale,
      valueMultiplier: details.damageMultiplier,
      valueDivisor: details.damageDenominator,
    });
  }

  function withWeaponFormula(details = {}, formula = {}) {
    const normalized = normalizeFormula(formula);
    return {
      ...details,
      damage: normalized.diceCount
        ? `${normalized.diceCount}d${normalized.dieType}`
        : "",
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      diceCountMax: normalized.diceCountMax,
      diceCountScale: normalized.diceCountScale,
      staticDamage: normalized.staticValue,
      staticDamageMax: normalized.staticValueMax,
      staticDamageScale: normalized.staticValueScale,
      damageDenominator: normalized.valueDivisor,
      ...(normalized.maximizeDice ? { maximizeDice: true } : {}),
      ...(normalized.valueMultiplier !== 1
        ? { damageMultiplier: normalized.valueMultiplier }
        : {}),
    };
  }

  const WEAPON_DIE_SIZE_UP = Object.freeze({
    "1": "1d2",
    "1d2": "1d3",
    "1d3": "1d4",
    "1d4": "1d6",
    "1d6": "1d8",
    "1d8": "2d6",
    "1d10": "2d8",
    "1d12": "3d6",
    "2d4": "2d6",
    "2d6": "3d6",
    "2d8": "3d8",
    "2d10": "4d8",
    "3d6": "4d6",
    "3d8": "4d8",
    "4d6": "6d6",
    "4d8": "6d8",
    "6d6": "8d6",
    "6d8": "8d8",
  });
  const WEAPON_DIE_SIZE_DOWN = Object.freeze({
    "1d2": "1",
    "1d3": "1d2",
    "1d4": "1d3",
    "1d6": "1d4",
    "1d8": "1d6",
    "1d10": "1d8",
    "1d12": "1d10",
    "2d4": "1d6",
    "2d6": "1d8",
    "2d8": "1d10",
    "2d10": "2d6",
    "3d6": "2d6",
    "3d8": "2d8",
    "4d6": "3d6",
    "4d8": "3d8",
    "6d6": "4d6",
    "6d8": "4d8",
    "8d6": "6d6",
    "8d8": "6d8",
  });
  const CREATURE_SIZE_INDEX = Object.freeze({
    fine: 0,
    diminutive: 1,
    tiny: 2,
    small: 3,
    medium: 4,
    large: 5,
    huge: 6,
    gargantuan: 7,
    colossal: 8,
  });

  function resizeWeaponDice(
    dice,
    targetSize,
    { smallDice = "" } = {},
  ) {
    let current = String(dice || "").trim().toLowerCase();
    const target = CREATURE_SIZE_INDEX[String(targetSize || "medium").toLowerCase()];
    if (!current || target === undefined || target === CREATURE_SIZE_INDEX.medium)
      return current;
    const useSmallAnchor = target <= CREATURE_SIZE_INDEX.small && smallDice;
    if (useSmallAnchor) current = String(smallDice).trim().toLowerCase();
    const sourceSize = useSmallAnchor
      ? CREATURE_SIZE_INDEX.small
      : CREATURE_SIZE_INDEX.medium;
    const direction = target > sourceSize ? 1 : -1;
    const steps = Math.abs(target - sourceSize);
    for (let index = 0; index < steps; index += 1) {
      const next = direction > 0
        ? WEAPON_DIE_SIZE_UP[current]
        : WEAPON_DIE_SIZE_DOWN[current];
      if (!next) break;
      current = next;
    }
    return current;
  }

  function shiftWeaponDice(dice, steps = 0) {
    let current = String(dice || "").trim().toLowerCase();
    const direction = Number(steps) < 0 ? -1 : 1;
    const count = Math.abs(Math.trunc(Number(steps) || 0));
    for (let index = 0; index < count; index += 1) {
      const next =
        direction > 0
          ? WEAPON_DIE_SIZE_UP[current]
          : WEAPON_DIE_SIZE_DOWN[current];
      if (!next) break;
      current = next;
    }
    return current;
  }

  function withDamageFormula(profile = {}, formula = {}) {
    const normalized = normalizeFormula(formula);
    return {
      ...profile,
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      diceCountMax: normalized.diceCountMax,
      staticDamage: normalized.staticValue,
      staticDamageMax: normalized.staticValueMax,
      diceCountScale: normalized.diceCountScale,
      staticDamageScale: normalized.staticValueScale,
      damageDenominator: normalized.valueDivisor,
      ...(normalized.maximizeDice ? { maximizeDice: true } : {}),
      ...(normalized.valueMultiplier !== 1
        ? { damageMultiplier: normalized.valueMultiplier }
        : {}),
    };
  }

  function healingFormula(bonus = {}) {
    return normalizeFormula({
      ...bonus,
      staticValue: bonus.value,
      staticValueMax: bonus.maximum ?? bonus.max,
      staticValueScale: bonus.bonusScale || bonus.scale,
    });
  }

  function withHealingFormula(bonus = {}, formula = {}) {
    const normalized = normalizeFormula(formula);
    return {
      ...bonus,
      value: normalized.staticValue,
      maximum: normalized.staticValueMax,
      bonusScale: normalized.staticValueScale,
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      diceCountMax: normalized.diceCountMax,
      diceCountScale: normalized.diceCountScale,
      ...(normalized.maximizeDice ? { maximizeDice: true } : {}),
      ...(normalized.valueMultiplier !== 1
        ? { valueMultiplier: normalized.valueMultiplier }
        : {}),
    };
  }

  function conditionFormula(adjustment = {}) {
    return normalizeFormula(adjustment);
  }

  function durationFormula(config = {}) {
    return normalizeFormula({
      diceCount: config.diceCount,
      dieType: config.dieType,
      diceCountMax: config.diceCountMax,
      staticValue: config.staticValue ?? config.count,
      staticValueMax: config.staticValueMax,
      diceCountScale: config.diceCountScale,
      staticValueScale:
        config.staticValueScale || config.durationScale || config.scale,
      maximizeDice: config.maximizeDice,
      valueMultiplier: config.valueMultiplier,
    });
  }

  function withDurationFormula(config = {}, formula = {}) {
    const normalized = normalizeFormula(formula);
    const next = {
      ...config,
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      staticValue: normalized.staticValue,
      ...(normalized.diceCountMax !== null
        ? { diceCountMax: normalized.diceCountMax }
        : {}),
      ...(normalized.staticValueMax !== null
        ? { staticValueMax: normalized.staticValueMax }
        : {}),
      ...(normalized.diceCountScale
        ? { diceCountScale: normalized.diceCountScale }
        : {}),
      ...(normalized.staticValueScale
        ? { staticValueScale: normalized.staticValueScale }
        : {}),
      ...(normalized.maximizeDice ? { maximizeDice: true } : {}),
      ...(normalized.valueMultiplier !== 1
        ? { valueMultiplier: normalized.valueMultiplier }
        : {}),
    };
    delete next.count;
    delete next.durationScale;
    delete next.scale;
    return next;
  }

  function withConditionFormula(adjustment = {}, formula = {}) {
    const normalized = normalizeFormula(formula);
    return {
      ...adjustment,
      staticValue: normalized.staticValue,
      staticValueMax: normalized.staticValueMax,
      staticValueScale: normalized.staticValueScale,
      diceCount: normalized.diceCount,
      dieType: normalized.dieType,
      diceCountMax: normalized.diceCountMax,
      diceCountScale: normalized.diceCountScale,
      ...(normalized.maximizeDice ? { maximizeDice: true } : {}),
      ...(normalized.valueMultiplier !== 1
        ? { valueMultiplier: normalized.valueMultiplier }
        : {}),
    };
  }

  function isHealingBonus(bonus = {}) {
    return String(bonus.stat || "").trim().toLowerCase() === "healing";
  }

  function mapDamageProfiles(rolls, transform) {
    return (Array.isArray(rolls) ? rolls : []).map((roll) => {
      const nextFormula = transform(damageFormula(roll), {
        kind: "damage",
        node: roll,
      });
      const next = withDamageFormula(roll, nextFormula || damageFormula(roll));
      next.conditionals = (Array.isArray(roll.conditionals)
        ? roll.conditionals
        : []
      ).map((profile) => {
        const conditionalFormula = transform(damageFormula(profile), {
          kind: "damage",
          node: profile,
          conditional: true,
        });
        return withDamageFormula(
          profile,
          conditionalFormula || damageFormula(profile),
        );
      });
      return next;
    });
  }

  function mapWeaponDamageComponents(entries, transform) {
    return (Array.isArray(entries) ? entries : []).map((entry) => {
      const formula = transform(damageFormula(entry), {
        kind: "weapon-extra-damage",
        node: entry,
      });
      return withDamageFormula(entry, formula || damageFormula(entry));
    });
  }

  function mapEffectFormulas(effect = {}, transform = (formula) => formula) {
    const next = { ...effect };
    if (effect.durationConfig) {
      const baseFormula = durationFormula(effect.durationConfig);
      const formula = baseFormula.diceCount || baseFormula.diceCountScale
        ? transform(baseFormula, { kind: "duration", node: effect })
        : baseFormula;
      next.durationConfig = withDurationFormula(
        effect.durationConfig,
        formula || durationFormula(effect.durationConfig),
      );
    }
    if (effect.auraConfig?.lingerDurationConfig) {
      const baseFormula = durationFormula(
        effect.auraConfig.lingerDurationConfig,
      );
      const formula = baseFormula.diceCount || baseFormula.diceCountScale
        ? transform(baseFormula, {
            kind: "aura-linger-duration",
            node: effect,
          })
        : baseFormula;
      next.auraConfig = {
        ...effect.auraConfig,
        lingerDurationConfig: withDurationFormula(
          effect.auraConfig.lingerDurationConfig,
          formula || durationFormula(effect.auraConfig.lingerDurationConfig),
        ),
      };
    }
    next.damageRolls = mapDamageProfiles(effect.damageRolls, transform);
    next.weaponExtraDamage = mapWeaponDamageComponents(
      effect.weaponExtraDamage,
      transform,
    );
    for (const key of ["bonuses", "effects"]) {
      if (!Array.isArray(effect[key])) continue;
      next[key] = effect[key].map((bonus) => {
        if (!isHealingBonus(bonus)) return bonus;
        const formula = transform(healingFormula(bonus), {
          kind: "healing",
          node: bonus,
        });
        return withHealingFormula(bonus, formula || healingFormula(bonus));
      });
    }
    if (Array.isArray(effect.applyConditions)) {
      next.applyConditions = effect.applyConditions.map((entry) => {
        if (!entry?.conditionAdjustment) return entry;
        const formula = transform(conditionFormula(entry.conditionAdjustment), {
          kind: "condition",
          node: entry,
          mode: entry.conditionAdjustment.mode === "heal" ? "heal" : "apply",
        });
        return {
          ...entry,
          conditionAdjustment: withConditionFormula(
            entry.conditionAdjustment,
            formula || conditionFormula(entry.conditionAdjustment),
          ),
        };
      });
    }
    if (Array.isArray(effect.generatedEquipment)) {
      next.generatedEquipment = effect.generatedEquipment.map((entry) => {
        if (String(entry?.type || "").toLowerCase() !== "weapon") return entry;
        const details = entry.details && typeof entry.details === "object"
          ? entry.details
          : {};
        const formula = transform(weaponFormula(details), {
          kind: "weapon",
          node: entry,
        });
        const transformedDetails = withWeaponFormula(
          details,
          formula || weaponFormula(details),
        );
        return {
          ...entry,
          details: {
            ...transformedDetails,
            ...(Array.isArray(details.extraDamage)
              ? {
                  extraDamage: mapWeaponDamageComponents(
                    details.extraDamage,
                    transform,
                  ),
                }
              : {}),
          },
        };
      });
    }
    for (const key of ["attackRolls", "metamagicRiders", "branches"]) {
      if (Array.isArray(effect[key]))
        next[key] = effect[key].map((entry) =>
          mapEffectFormulas(entry, transform),
        );
    }
    return next;
  }

  return {
    DIE_SIDES,
    normalizeFormula,
    scaledValue,
    formulaText,
    calculateFormula,
    rollFormula,
    damageFormula,
    withDamageFormula,
    parseDiceFormula,
    weaponFormula,
    withWeaponFormula,
    resizeWeaponDice,
    shiftWeaponDice,
    healingFormula,
    withHealingFormula,
    conditionFormula,
    withConditionFormula,
    durationFormula,
    withDurationFormula,
    mapWeaponDamageComponents,
    mapEffectFormulas,
  };
});
