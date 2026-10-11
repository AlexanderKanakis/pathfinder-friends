(function (root, factory) {
  const api = factory();
  if (root) root.PFConditionConfig = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const ABILITIES = Object.freeze([
    ["strength", "Strength"],
    ["dexterity", "Dexterity"],
    ["constitution", "Constitution"],
    ["intelligence", "Intelligence"],
    ["wisdom", "Wisdom"],
    ["charisma", "Charisma"],
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
    return String(effect.category || "").toLowerCase() === "condition";
  }

  function normalizeAbility(value = "") {
    const key = String(value).trim().toLowerCase();
    return ABILITIES.some(([ability]) => ability === key) ? key : "strength";
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
      const stat = normalizeAbility(selection.ability || selection.stat || current.stat);
      const type = conditionKind === "ability-drain" ? "ability drain" : "ability damage";
      next.bonuses = [
        ...bonuses.filter(
          (bonus) => String(bonus.type || "").trim().toLowerCase() !== type,
        ),
        { stat, value: -amount, type, stacks: true },
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

  return {
    ABILITIES,
    config,
    kind,
    isConfigurable,
    needsAbility,
    needsAmount,
    usesTurns,
    configure,
    updateAmount,
    negativeLevelBonuses,
  };
});
