(function (root, factory) {
  const api = factory(root);
  if (root) root.PFConditionConfig = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const effectRolls =
    root?.PFEffectRolls ||
    (typeof require === "function" ? require("./effect-rolls.js") : null);
  const CONCRETE_ABILITIES = Object.freeze([
    ["strength", "Strength"],
    ["dexterity", "Dexterity"],
    ["constitution", "Constitution"],
    ["intelligence", "Intelligence"],
    ["wisdom", "Wisdom"],
    ["charisma", "Charisma"],
  ]);
  const PLAYER_CHOOSES_ABILITY = "player-chooses";
  const ABILITY_GROUPS = Object.freeze({
    "all-physical": Object.freeze([
      "strength",
      "dexterity",
      "constitution",
    ]),
    "all-mental": Object.freeze(["intelligence", "wisdom", "charisma"]),
    all: Object.freeze(CONCRETE_ABILITIES.map(([value]) => value)),
  });
  const ABILITIES = Object.freeze([
    ...CONCRETE_ABILITIES,
    ["all-physical", "All physical"],
    ["all-mental", "All mental"],
    ["all", "All"],
    [PLAYER_CHOOSES_ABILITY, "Player chooses"],
  ]);
  const ADJUSTABLE_KINDS = new Set([
    "ability-damage",
    "ability-drain",
    "negative-level",
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function config(effect = {}) {
    const value = effect.adjustableCondition;
    return value && typeof value === "object" ? value : null;
  }

  function kind(effect = {}) {
    return String(config(effect)?.kind || "").trim().toLowerCase();
  }

  function isConfigurable(effect = {}) {
    return ADJUSTABLE_KINDS.has(kind(effect));
  }

  function needsAbility(effect = {}) {
    return ["ability-damage", "ability-drain"].includes(kind(effect));
  }

  function needsAmount(effect = {}) {
    return isConfigurable(effect);
  }

  function usesTurns(effect = {}) {
    return (
      String(effect.category || "").toLowerCase() === "condition" &&
      !isConfigurable(effect)
    );
  }

  function normalizeAbility(value = "") {
    const key = String(value).trim().toLowerCase();
    return ABILITIES.some(([ability]) => ability === key) ? key : "strength";
  }

  function abilityTargets(value = "") {
    const ability = normalizeAbility(value);
    if (ability === PLAYER_CHOOSES_ABILITY) return [];
    return ABILITY_GROUPS[ability]
      ? [...ABILITY_GROUPS[ability]]
      : [ability];
  }

  function abilityLabel(value = "") {
    const ability = normalizeAbility(value);
    return ABILITIES.find(([option]) => option === ability)?.[1] || "Strength";
  }

  function normalizeAmount(value, minimum = 1) {
    return Math.max(minimum, Math.floor(Number(value) || minimum));
  }

  function negativeLevelBonuses(amount) {
    return [
      ["ability checks", -amount],
      ["melee attack", -amount],
      ["ranged attack", -amount],
      ["cmb", -amount],
      ["cmd", -amount],
      ["all saves", -amount],
      ["skill checks", -amount],
      ["hit points", -5 * amount],
      ["current hit points", -5 * amount],
    ].map(([stat, value]) => ({
      stat,
      value,
      type: "negative level",
      stacks: true,
      negativeLevelPenalty: true,
    }));
  }

  function configure(effect = {}, selection = {}) {
    const next = clone(effect) || {};
    const current = config(next);
    const conditionKind = kind(next);
    if (!current || !ADJUSTABLE_KINDS.has(conditionKind)) return next;
    const minimum = Math.max(1, Number(current.minimum || 1));
    const amount = normalizeAmount(selection.amount ?? current.amount, minimum);
    const bonuses = Array.isArray(next.bonuses) ? next.bonuses : [];

    if (["ability-damage", "ability-drain"].includes(conditionKind)) {
      const stat = normalizeAbility(
        selection.ability || selection.stat || current.stat,
      );
      const type = conditionKind === "ability-drain" ? "ability drain" : "ability damage";
      next.bonuses = [
        ...bonuses.filter(
          (bonus) => String(bonus.type || "").trim().toLowerCase() !== type,
        ),
        ...abilityTargets(stat).map((ability) => ({
          stat: ability,
          value: -amount,
          type,
          stacks: true,
        })),
      ];
      next.adjustableCondition = {
        ...current,
        stat,
        amount,
        minimum,
        label: "Value",
      };
      return next;
    }

    next.bonuses = [
      ...bonuses.filter((bonus) => !bonus.negativeLevelPenalty),
      ...negativeLevelBonuses(amount),
    ];
    next.adjustableCondition = {
      ...current,
      amount,
      minimum,
      label: "Value",
    };
    return next;
  }

  function updateAmount(effect = {}, amount) {
    return configure(effect, {
      amount,
      ability: config(effect)?.stat,
    });
  }

  function conditionFromEntry(entry = {}) {
    return entry.condition && typeof entry.condition === "object"
      ? entry.condition
      : entry;
  }

  function entryKind(entry = {}) {
    return kind(conditionFromEntry(entry));
  }

  function normalizeAdjustment(entry = {}) {
    const raw =
      entry.conditionAdjustment && typeof entry.conditionAdjustment === "object"
        ? entry.conditionAdjustment
        : {};
    const conditionKind = entryKind(entry);
    const formula = effectRolls?.conditionFormula?.(raw) || raw;
    return {
      mode: raw.mode === "heal" ? "heal" : "apply",
      ability: needsAbility(conditionFromEntry(entry))
        ? normalizeAbility(raw.ability || config(conditionFromEntry(entry))?.stat)
        : "",
      staticValue: Math.max(0, Math.floor(Number(formula.staticValue) || 0)),
      staticValueMax: formula.staticValueMax ?? null,
      staticValueScale: formula.staticValueScale || null,
      diceCount: Math.max(0, Math.floor(Number(formula.diceCount) || 0)),
      dieType: Math.max(2, Math.floor(Number(formula.dieType) || 6)),
      diceCountMax: formula.diceCountMax ?? null,
      diceCountScale: formula.diceCountScale || null,
      maximizeDice: Boolean(formula.maximizeDice),
      valueMultiplier: Number.isFinite(Number(formula.valueMultiplier))
        ? Math.max(0, Number(formula.valueMultiplier))
        : 1,
      ...(raw.resolvedAmount !== null &&
      raw.resolvedAmount !== undefined &&
      raw.resolvedAmount !== "" &&
      Number.isFinite(Number(raw.resolvedAmount))
        ? { resolvedAmount: Math.max(0, Math.floor(Number(raw.resolvedAmount))) }
        : {}),
      kind: conditionKind,
    };
  }

  function isAdjustmentEntry(entry = {}) {
    return Boolean(entry?.conditionAdjustment) && ADJUSTABLE_KINDS.has(entryKind(entry));
  }

  function adjustmentAmount(entry = {}) {
    const adjustment = normalizeAdjustment(entry);
    if (Number.isFinite(adjustment.resolvedAmount))
      return adjustment.resolvedAmount;
    return adjustment.staticValue;
  }

  function configuredCondition(entry = {}) {
    const condition = conditionFromEntry(entry);
    if (!isAdjustmentEntry(entry)) return clone(condition);
    const adjustment = normalizeAdjustment(entry);
    if (adjustment.mode === "heal") return null;
    if (adjustment.ability === PLAYER_CHOOSES_ABILITY) return null;
    const amount = adjustmentAmount(entry);
    if (amount <= 0) return null;
    return configure(condition, {
      ability: adjustment.ability,
      amount,
    });
  }

  function adjustmentLabel(entry = {}) {
    const adjustment = normalizeAdjustment(entry);
    const name = String(
      conditionFromEntry(entry).name || entry.name || "Condition",
    ).trim();
    const ability = needsAbility(conditionFromEntry(entry))
      ? abilityLabel(adjustment.ability)
      : "";
    return `${adjustment.mode === "heal" ? "Heal" : "Apply"} ${name}${ability ? ` (${ability})` : ""}`;
  }

  function hasPendingAbilityChoice(effect = {}) {
    if (
      needsAbility(effect) &&
      normalizeAbility(config(effect)?.stat) === PLAYER_CHOOSES_ABILITY
    )
      return true;
    return (Array.isArray(effect.applyConditions)
      ? effect.applyConditions
      : []
    ).some(
      (entry) =>
        isAdjustmentEntry(entry) &&
        needsAbility(conditionFromEntry(entry)) &&
        normalizeAdjustment(entry).ability === PLAYER_CHOOSES_ABILITY,
    );
  }

  async function resolveAbilityChoices(
    effect = {},
    { title = "Effect", pick } = {},
  ) {
    let next = clone(effect) || {};
    const open = pick || root?.PFEffectChoicePicker?.open;
    if (!hasPendingAbilityChoice(next)) return next;
    if (typeof open !== "function") return null;
    const choose = async (conditionName = "Condition") => {
      const picked = await open({
        title: `${title}: Choose Ability for ${conditionName}`,
        options: CONCRETE_ABILITIES.map(([value, label]) => ({
          value,
          label,
        })),
      });
      const value =
        typeof picked === "object" ? picked?.value : String(picked || "");
      return value ? normalizeAbility(value) : null;
    };

    if (
      needsAbility(next) &&
      normalizeAbility(config(next)?.stat) === PLAYER_CHOOSES_ABILITY
    ) {
      const selected = await choose(next.name || "Condition");
      if (!selected) return null;
      next = configure(next, {
        ability: selected,
        amount: config(next)?.amount,
      });
    }

    const entries = Array.isArray(next.applyConditions)
      ? next.applyConditions
      : [];
    const resolvedEntries = [];
    for (const entry of entries) {
      if (
        !isAdjustmentEntry(entry) ||
        !needsAbility(conditionFromEntry(entry)) ||
        normalizeAdjustment(entry).ability !== PLAYER_CHOOSES_ABILITY
      ) {
        resolvedEntries.push(entry);
        continue;
      }
      const selected = await choose(
        conditionFromEntry(entry).name || entry.name || "Condition",
      );
      if (!selected) return null;
      resolvedEntries.push({
        ...entry,
        conditionAdjustment: {
          ...(entry.conditionAdjustment || {}),
          ability: selected,
        },
      });
    }
    if (entries.length) next.applyConditions = resolvedEntries;
    return next;
  }

  function localRoll(entry = {}, context = {}, random = Math.random) {
    const adjustment = normalizeAdjustment(entry);
    return effectRolls?.rollFormula
      ? effectRolls.rollFormula(adjustment, context, random).total
      : adjustment.staticValue;
  }

  async function resolveAdjustments(
    effect = {},
    {
      title = "Effect",
      context = {},
      deferAbilityChoice = false,
      pick,
    } = {},
  ) {
    const abilityResolved = deferAbilityChoice
      ? clone(effect)
      : await resolveAbilityChoices(effect, { title, pick });
    if (!abilityResolved) return null;
    const entries = Array.isArray(abilityResolved.applyConditions)
      ? abilityResolved.applyConditions
      : [];
    const adjustable = entries
      .map((entry, index) => ({ entry, index }))
      .filter(
        ({ entry }) =>
          isAdjustmentEntry(entry) &&
          (entry.conditionAdjustment?.resolvedAmount === null ||
            entry.conditionAdjustment?.resolvedAmount === undefined ||
            entry.conditionAdjustment?.resolvedAmount === "" ||
            !Number.isFinite(
              Number(entry.conditionAdjustment?.resolvedAmount),
            )),
      );
    if (!adjustable.length) return abilityResolved;

    const rolls = adjustable.map(({ entry }, index) => {
      const adjustment = normalizeAdjustment(entry);
      return {
        id: `condition-adjustment-${index + 1}`,
        label: adjustmentLabel(entry),
        diceCount: adjustment.diceCount,
        dieType: adjustment.dieType,
        diceCountMax: adjustment.diceCountMax,
        diceCountScale: adjustment.diceCountScale,
        staticDamage: adjustment.staticValue,
        staticDamageMax: adjustment.staticValueMax,
        staticDamageScale: adjustment.staticValueScale,
        maximizeDice: adjustment.maximizeDice,
        damageMultiplier: adjustment.valueMultiplier,
        damageType: "",
      };
    });
    let results = null;
    const hasRandom = rolls.some((roll) => {
      const formula = effectRolls?.damageFormula?.(roll);
      return (
        effectRolls?.calculateFormula?.(formula, context)?.diceCount ??
        roll.diceCount
      ) > 0;
    });
    if (hasRandom && root?.PFDamageRolls?.open) {
      results = await root.PFDamageRolls.open({
        title: `${title} Condition Change`,
        rolls,
        context,
        labels: {
          resultNoun: "Change",
          rollButton: "Roll Value",
          staticLabel: "Static",
        },
      });
      if (!results) return null;
    }

    const resolvedByIndex = new Map(
      adjustable.map(({ entry, index }, resultIndex) => [
        index,
        results
          ? Math.max(0, Math.floor(Number(results[resultIndex]?.total) || 0))
          : localRoll(entry, context),
      ]),
    );
    return {
      ...abilityResolved,
      applyConditions: entries.map((entry, index) =>
        resolvedByIndex.has(index)
          ? {
              ...clone(entry),
              conditionAdjustment: {
                ...normalizeAdjustment(entry),
                resolvedAmount: resolvedByIndex.get(index),
              },
            }
          : clone(entry),
      ),
    };
  }

  function matchesRestoration(effect, healingEntry) {
    const healing = normalizeAdjustment(healingEntry);
    if (kind(effect) !== healing.kind) return false;
    return !needsAbility(effect) || config(effect)?.stat === healing.ability;
  }

  function reduceDirectCondition(effect, healingEntry, amount) {
    if (!matchesRestoration(effect, healingEntry) || amount <= 0)
      return { effect, amount, changed: false };
    const current = Math.max(0, Number(config(effect)?.amount || 0));
    const used = Math.min(current, amount);
    const remaining = current - used;
    return {
      effect: remaining > 0 ? updateAmount(effect, remaining) : null,
      amount: amount - used,
      changed: used > 0,
    };
  }

  function reduceNestedConditions(effect, healingEntry, amount) {
    const entries = Array.isArray(effect.applyConditions)
      ? effect.applyConditions
      : [];
    if (!entries.length || amount <= 0)
      return { effect, amount, changed: false };
    let remaining = amount;
    let changed = false;
    const nextEntries = [];
    entries.forEach((entry) => {
      const adjustment = normalizeAdjustment(entry);
      const condition = configuredCondition(entry);
      if (
        remaining <= 0 ||
        !condition ||
        adjustment.mode === "heal" ||
        !matchesRestoration(condition, healingEntry)
      ) {
        nextEntries.push(entry);
        return;
      }
      const current = adjustmentAmount(entry) || Number(config(condition)?.amount || 0);
      const used = Math.min(current, remaining);
      const nextAmount = current - used;
      remaining -= used;
      changed ||= used > 0;
      if (nextAmount <= 0) return;
      nextEntries.push({
        ...entry,
        condition: configure(conditionFromEntry(entry), {
          ability: adjustment.ability,
          amount: nextAmount,
        }),
        conditionAdjustment: {
          ...adjustment,
          resolvedAmount: nextAmount,
        },
      });
    });
    return {
      effect: { ...effect, applyConditions: nextEntries },
      amount: remaining,
      changed,
    };
  }

  function hasPersistableMechanics(effect = {}) {
    if (String(effect.category || "").toLowerCase() === "condition") return true;
    if (Array.isArray(effect.bonuses) && effect.bonuses.length) return true;
    if (Array.isArray(effect.applyConditions) && effect.applyConditions.length)
      return true;
    return Boolean(
      effect.trackActive ||
        effect.auraConfig?.enabled ||
        root?.PFEffectMechanics?.hasAnyMechanics?.(effect),
    );
  }

  function stripHealingAdjustments(effect = {}) {
    const entries = Array.isArray(effect.applyConditions)
      ? effect.applyConditions
      : [];
    const applyConditions = entries.filter(
      (entry) => !isAdjustmentEntry(entry) || normalizeAdjustment(entry).mode !== "heal",
    );
    return { ...clone(effect), applyConditions };
  }

  function applyRestorations(activeEffects = [], effect = {}) {
    const healingEntries = (Array.isArray(effect.applyConditions)
      ? effect.applyConditions
      : []
    ).filter(
      (entry) => isAdjustmentEntry(entry) && normalizeAdjustment(entry).mode === "heal",
    );
    let next = clone(Array.isArray(activeEffects) ? activeEffects : []);
    let changed = false;
    healingEntries.forEach((healingEntry) => {
      let remaining = adjustmentAmount(healingEntry);
      next = next.flatMap((activeEffect) => {
        if (remaining <= 0) return [activeEffect];
        const direct = reduceDirectCondition(activeEffect, healingEntry, remaining);
        if (direct.changed) {
          remaining = direct.amount;
          changed = true;
          return direct.effect ? [direct.effect] : [];
        }
        const nested = reduceNestedConditions(activeEffect, healingEntry, remaining);
        remaining = nested.amount;
        changed ||= nested.changed;
        if (!nested.changed) return [activeEffect];
        return hasPersistableMechanics(nested.effect) ? [nested.effect] : [];
      });
    });
    return {
      activeEffects: next,
      effect: stripHealingAdjustments(effect),
      changed,
      hadRestoration: healingEntries.length > 0,
    };
  }

  return {
    ABILITIES,
    CONCRETE_ABILITIES,
    PLAYER_CHOOSES_ABILITY,
    abilityTargets,
    abilityLabel,
    config,
    kind,
    isConfigurable,
    needsAbility,
    needsAmount,
    usesTurns,
    configure,
    updateAmount,
    negativeLevelBonuses,
    conditionFromEntry,
    entryKind,
    normalizeAdjustment,
    isAdjustmentEntry,
    adjustmentAmount,
    adjustmentLabel,
    configuredCondition,
    hasPendingAbilityChoice,
    resolveAbilityChoices,
    resolveAdjustments,
    stripHealingAdjustments,
    applyRestorations,
    hasPersistableMechanics,
  };
});
