(function (root, factory) {
  const api = factory();
  if (root) root.PFEffectMechanics = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const BASE_EFFECT_KEY = "effects";
  const BRANCH_KEY = "branches";

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
    "damageRolls",
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
    return keys.some((key) => hasMechanicList(item, key)) || hasBranches(item);
  }

  function copyMechanics(item = {}, keys = mechanicKeys()) {
    return Object.fromEntries(
      keys.map((key) => [key, Array.isArray(item?.[key]) ? item[key] : []]),
    );
  }

  function branches(item = {}) {
    const rows = Array.isArray(item?.[BRANCH_KEY]) ? item[BRANCH_KEY] : [];
    if (rows.length < 2) return [];
    return rows.map((branch, index) => ({
      ...branch,
      id: String(branch?.id || `branch-${index + 1}`),
      name:
        String(branch?.name || `Option ${index + 1}`).trim() ||
        `Option ${index + 1}`,
      ...copyMechanics(branch),
    }));
  }

  function hasBranches(item = {}) {
    return branches(item).length > 1;
  }

  function branchOptions(item = {}) {
    return branches(item).map((branch) => ({
      value: branch.id,
      label: branch.name,
    }));
  }

  function branchSource(item = {}) {
    const source = item?.branchSource;
    return source && typeof source === "object" && hasBranches(source)
      ? source
      : hasBranches(item)
        ? item
        : null;
  }

  function canReselectBranch(item = {}) {
    return Boolean(branchSource(item));
  }

  function resolveBranch(item = {}, branchId = "") {
    const available = branches(item);
    if (!available.length) return item;
    const selected =
      available.find((branch) => String(branch.id) === String(branchId)) ||
      available.find((branch) => String(branch.name) === String(branchId));
    if (!selected) return null;
    const resolved = { ...item };
    delete resolved[BRANCH_KEY];
    delete resolved.branchSource;
    mechanicKeys().forEach((key) => {
      const targetKey =
        key === BASE_EFFECT_KEY &&
        Array.isArray(item.bonuses) &&
        !Array.isArray(item.effects)
          ? "bonuses"
          : key;
      const baseRows = Array.isArray(item[targetKey]) ? item[targetKey] : [];
      const branchRows = Array.isArray(selected[key])
        ? selected[key]
        : key === BASE_EFFECT_KEY && Array.isArray(selected.bonuses)
          ? selected.bonuses
          : [];
      resolved[targetKey] = [...baseRows, ...branchRows];
    });
    resolved.selectedBranchId = selected.id;
    resolved.selectedBranchName = selected.name;
    const unresolved = { ...item };
    delete unresolved.selectedBranchId;
    delete unresolved.selectedBranchName;
    delete unresolved.branchSource;
    resolved.branchSource = unresolved;
    return resolved;
  }

  async function chooseBranch(item = {}, { title = "Effect", pick } = {}) {
    const options = branchOptions(item);
    if (!options.length) return item;
    const open = pick || globalThis.PFEffectChoicePicker?.open;
    if (typeof open !== "function") return null;
    const selected = await open({
      title: `${title}: Choose Option`,
      options,
    });
    if (!selected) return null;
    const value = typeof selected === "object" ? selected.value : selected;
    return resolveBranch(item, value);
  }

  function passiveMechanics(item = {}) {
    return {
      ...copyMechanics(item),
      ...(hasBranches(item) ? { branches: branches(item) } : {}),
      auraConfig: item?.auraConfig || null,
    };
  }

  function activeMechanics(item = {}, { activeOnly = false } = {}) {
    if (item?.activeMechanics && typeof item.activeMechanics === "object") {
      return {
        ...copyMechanics(item.activeMechanics),
        ...(hasBranches(item.activeMechanics)
          ? { branches: branches(item.activeMechanics) }
          : {}),
        durationConfig: item.activeMechanics.durationConfig || null,
        auraConfig: item.activeMechanics.auraConfig || null,
      };
    }
    if (activeOnly) {
      return {
        ...copyMechanics(item),
        ...(hasBranches(item) ? { branches: branches(item) } : {}),
        durationConfig: item.durationConfig || null,
        auraConfig: item.auraConfig || null,
      };
    }
    return { ...copyMechanics({}), durationConfig: null, auraConfig: null };
  }

  function hasActiveMechanics(item = {}, options = {}) {
    return hasAnyMechanics(activeMechanics(item, options));
  }

  function mechanicPayload(item = {}, options = {}) {
    const payload = options.activeOnly ? copyMechanics({}) : passiveMechanics(item);
    const active = activeMechanics(item, options);
    if (hasAnyMechanics(active) || active.durationConfig || active.auraConfig?.enabled) {
      payload.activeMechanics = active;
    }
    return payload;
  }

  const ATTRIBUTE_ALIASES = Object.freeze({
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
  });

  function attributeScaleSource(scale = {}) {
    const raw = String(scale.attributeSource || "caster")
      .trim()
      .toLowerCase();
    return ["recipient", "target", "receiver"].includes(raw)
      ? "recipient"
      : "caster";
  }

  function contextAbilityModifier(entry = {}, context = {}) {
    const raw = String(entry.ability || entry.attribute || "").toLowerCase();
    const ability = ATTRIBUTE_ALIASES[raw];
    if (!ability) return null;
    const longKey = {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
    }[ability];
    const explicit =
      context.abilityMods?.[ability] ?? context.abilityMods?.[longKey];
    if (explicit !== undefined && Number.isFinite(Number(explicit)))
      return Number(explicit);
    const score =
      context.abilityScores?.[ability] ?? context.abilityScores?.[longKey];
    if (score !== undefined && Number.isFinite(Number(score)))
      return Math.floor((Number(score) - 10) / 2);
    return Number.isFinite(Number(entry.resolvedModifier))
      ? Number(entry.resolvedModifier)
      : null;
  }

  function resolveCasterAttributeScales(value, context = {}) {
    if (value === null || value === undefined) return value;
    const cloned = JSON.parse(JSON.stringify(value));
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      const entries = Array.isArray(node.attributeBonuses)
        ? node.attributeBonuses
        : node.attributeBonus
          ? [node.attributeBonus]
          : [];
      if (entries.length) {
        const source = attributeScaleSource(node);
        node.attributeSource = source;
        entries.forEach((entry) => {
          if (source === "recipient") {
            delete entry.resolvedModifier;
            return;
          }
          const modifier = contextAbilityModifier(entry, context);
          if (modifier !== null) entry.resolvedModifier = modifier;
        });
      }
      Object.values(node).forEach(visit);
    };
    visit(cloned);
    return cloned;
  }

  return {
    baseEffectKey: BASE_EFFECT_KEY,
    branchKey: BRANCH_KEY,
    extraKeys,
    mechanicKeys,
    choiceBearingExtraKeys,
    promptedChoiceMechanicKeys,
    hasMechanicList,
    hasAnyMechanics,
    copyMechanics,
    branches,
    hasBranches,
    branchOptions,
    branchSource,
    canReselectBranch,
    resolveBranch,
    chooseBranch,
    passiveMechanics,
    activeMechanics,
    hasActiveMechanics,
    mechanicPayload,
    attributeScaleSource,
    resolveCasterAttributeScales,
  };
});
