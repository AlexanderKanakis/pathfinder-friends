(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectHealing = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const HEALING_STAT = "healing";
  const FAST_HEALING_STAT = "fast healing";
  const effectRolls =
    root?.PFEffectRolls ||
    (typeof require === "function" ? require("./effect-rolls.js") : null);

  function normalizeStat(value = "") {
    return String(value || "").trim().toLowerCase();
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function effectBonusKey(effect = {}) {
    return Array.isArray(effect.bonuses)
      ? "bonuses"
      : Array.isArray(effect.effects)
        ? "effects"
        : "bonuses";
  }

  function effectBonuses(effect = {}) {
    return effect[effectBonusKey(effect)] || [];
  }

  function hasHealing(effect = {}) {
    return effectBonuses(effect).some(
      (bonus) =>
        normalizeStat(bonus?.stat) === HEALING_STAT &&
        !bonus?.conditional,
    );
  }

  function scaledValue(bonus, effect, context = {}) {
    if (root?.PFBuffs?.scaledBonusValue)
      return root.PFBuffs.scaledBonusValue(bonus, effect, context);
    return Number(bonus?.value || 0);
  }

  function healingFormula(bonus = {}) {
    return effectRolls?.healingFormula?.(bonus) || {
      diceCount: Math.max(0, Math.floor(Number(bonus.diceCount) || 0)),
      dieType: Math.max(2, Math.floor(Number(bonus.dieType) || 6)),
      staticValue: Number(bonus.value) || 0,
    };
  }

  function calculatedHealing(bonus = {}, effect = {}, context = {}) {
    if (
      bonus.resolvedValue !== null &&
      bonus.resolvedValue !== undefined &&
      bonus.resolvedValue !== "" &&
      Number.isFinite(Number(bonus.resolvedValue))
    )
      return Math.max(0, Math.floor(Number(bonus.resolvedValue)));
    if (
      !Number(bonus.diceCount || 0) &&
      !bonus.diceCountScale &&
      !bonus.bonusScale &&
      !bonus.scale &&
      Number.isFinite(Number(bonus.scaledValue))
    )
      return Math.max(0, Math.floor(Number(bonus.scaledValue)));
    if (effectRolls?.rollFormula)
      return Math.max(
        0,
        effectRolls.rollFormula(healingFormula(bonus), context).total,
      );
    return Math.max(0, Math.floor(scaledValue(bonus, effect, context) || 0));
  }

  function fastHealingValue(effects = [], context = {}) {
    return (Array.isArray(effects) ? effects : []).reduce((highest, effect) => {
      const effectHighest = effectBonuses(effect).reduce((value, bonus) => {
        if (
          normalizeStat(bonus?.stat) !== FAST_HEALING_STAT ||
          bonus?.conditional
        )
          return value;
        return Math.max(
          value,
          Math.max(0, Math.floor(scaledValue(bonus, effect, context) || 0)),
        );
      }, 0);
      return Math.max(highest, effectHighest);
    }, 0);
  }

  function healingValue(effect = {}, context = {}) {
    return effectBonuses(effect).reduce((total, bonus) => {
      if (
        normalizeStat(bonus?.stat) !== HEALING_STAT ||
        bonus?.conditional
      )
        return total;
      return total + calculatedHealing(bonus, effect, context);
    }, 0);
  }

  async function resolveRolls(
    effect = {},
    { title = "Effect", context = {} } = {},
  ) {
    const bonuses = effectBonuses(effect);
    const pending = bonuses
      .map((bonus, index) => ({ bonus, index }))
      .filter(
        ({ bonus }) =>
          normalizeStat(bonus?.stat) === HEALING_STAT &&
          !bonus?.conditional &&
          (bonus.resolvedValue === null ||
            bonus.resolvedValue === undefined ||
            bonus.resolvedValue === "" ||
            !Number.isFinite(Number(bonus.resolvedValue))),
      );
    if (!pending.length) return clone(effect);
    const rolls = pending.map(({ bonus }, index) => {
      const formula = healingFormula(bonus);
      return {
        id: `healing-${index + 1}`,
        label: String(bonus.label || "Healing").trim() || "Healing",
        diceCount: formula.diceCount,
        dieType: formula.dieType,
        diceCountMax: formula.diceCountMax,
        diceCountScale: formula.diceCountScale,
        staticDamage: formula.staticValue,
        staticDamageMax: formula.staticValueMax,
        staticDamageScale: formula.staticValueScale,
        maximizeDice: formula.maximizeDice,
        damageMultiplier: formula.valueMultiplier,
        damageType: "",
      };
    });
    const hasRandom = pending.some(({ bonus }) => {
      const calculated = effectRolls?.calculateFormula?.(
        healingFormula(bonus),
        context,
      );
      return Number(calculated?.diceCount ?? bonus.diceCount ?? 0) > 0;
    });
    let results = null;
    if (hasRandom && root?.PFDamageRolls?.open) {
      results = await root.PFDamageRolls.open({
        title: `${title} Healing`,
        rolls,
        context,
        labels: {
          resultNoun: "Healing",
          rollButton: "Roll Healing",
          staticLabel: "Static",
        },
      });
      if (!results) return null;
    }
    const values = new Map(
      pending.map(({ bonus, index }, resultIndex) => [
        index,
        results
          ? Math.max(0, Math.floor(Number(results[resultIndex]?.total) || 0))
          : calculatedHealing(bonus, effect, context),
      ]),
    );
    const bonusKey = effectBonusKey(effect);
    return {
      ...clone(effect),
      [bonusKey]: bonuses.map((bonus, index) =>
        values.has(index)
          ? { ...clone(bonus), resolvedValue: values.get(index) }
          : clone(bonus),
      ),
    };
  }

  function healingResult(currentHp, maximumHp, amount = Infinity) {
    const current = Number(currentHp);
    const maximum = Number(maximumHp);
    const healing = Number(amount);
    if (!Number.isFinite(current) || !Number.isFinite(maximum) || maximum < 0)
      return { current: currentHp, healed: 0, changed: false };
    const clampedCurrent = Math.min(current, maximum);
    const next = Number.isFinite(healing)
      ? Math.min(maximum, clampedCurrent + Math.max(0, healing))
      : maximum;
    return {
      current: next,
      healed: Math.max(0, next - current),
      changed: next !== current,
    };
  }

  function applicationResult(effect, currentHp, maximumHp, context = {}) {
    return hasHealing(effect)
      ? healingResult(
          currentHp,
          maximumHp,
          healingValue(effect, context),
        )
      : { current: currentHp, healed: 0, changed: false };
  }

  return {
    HEALING_STAT,
    FAST_HEALING_STAT,
    hasHealing,
    healingValue,
    fastHealingValue,
    healingResult,
    applicationResult,
    resolveRolls,
  };
});
