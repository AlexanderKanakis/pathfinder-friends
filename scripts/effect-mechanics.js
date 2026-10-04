(function (root, factory) {
  const api = factory();
  if (root) root.PFEffectMechanics = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const BASE_EFFECT_KEY = "effects";

  const EXTRA_MECHANIC_KEYS = Object.freeze([
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "bonusRanks",
    "extraRanksPerLevel",
    "featGrants",
    "sizeChanges",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "grantDomains",
    "generatedEquipment",
    "conditionalVariables",
  ]);

  const CHOICE_BEARING_EXTRA_KEYS = Object.freeze([
    "classSkillGrants",
    "bonusRanks",
    "featGrants",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "grantDomains",
    "conditionalVariables",
  ]);

  const PROMPTED_CHOICE_MECHANIC_KEYS = Object.freeze([
    BASE_EFFECT_KEY,
    "classSkillGrants",
    "bonusRanks",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "grantDomains",
    "conditionalVariables",
  ]);

  function cloneKeys(keys) {
    return [...keys];
  }

  function extraKeys() {
    return cloneKeys(EXTRA_MECHANIC_KEYS);
  }

  function mechanicKeys() {
    return [BASE_EFFECT_KEY, ...EXTRA_MECHANIC_KEYS];
  }

  function choiceBearingExtraKeys() {
    return cloneKeys(CHOICE_BEARING_EXTRA_KEYS);
  }

  function promptedChoiceMechanicKeys() {
    return cloneKeys(PROMPTED_CHOICE_MECHANIC_KEYS);
  }

  function hasMechanicList(item = {}, key = "") {
    return Array.isArray(item[key]) && item[key].length > 0;
  }

  function hasAnyMechanics(item = {}, keys = mechanicKeys()) {
    return keys.some((key) => hasMechanicList(item, key));
  }

  function copyMechanics(item = {}, keys = mechanicKeys()) {
    return Object.fromEntries(
      keys.map((key) => [key, Array.isArray(item?.[key]) ? item[key] : []]),
    );
  }

  function passiveMechanics(item = {}) {
    if (item?.activatable === true && !item?.activeMechanics)
      return copyMechanics({});
    return copyMechanics(item);
  }

  function activeMechanics(item = {}, { activeOnly = false } = {}) {
    if (item?.activeMechanics && typeof item.activeMechanics === "object") {
      return {
        ...copyMechanics(item.activeMechanics),
        durationConfig: item.activeMechanics.durationConfig || null,
      };
    }
    if (item?.activatable === true || activeOnly) {
      return {
        ...copyMechanics(item),
        durationConfig: item.durationConfig || null,
      };
    }
    return { ...copyMechanics({}), durationConfig: null };
  }

  function hasActiveMechanics(item = {}, options = {}) {
    return hasAnyMechanics(activeMechanics(item, options));
  }

  function mechanicPayload(item = {}, options = {}) {
    const payload = options.activeOnly ? copyMechanics({}) : passiveMechanics(item);
    const active = activeMechanics(item, options);
    if (hasAnyMechanics(active) || active.durationConfig) {
      payload.activeMechanics = active;
    }
    return payload;
  }

  return {
    baseEffectKey: BASE_EFFECT_KEY,
    extraKeys,
    mechanicKeys,
    choiceBearingExtraKeys,
    promptedChoiceMechanicKeys,
    hasMechanicList,
    hasAnyMechanics,
    copyMechanics,
    passiveMechanics,
    activeMechanics,
    hasActiveMechanics,
    mechanicPayload,
  };
});
