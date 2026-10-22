(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectMechanics = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const BASE_EFFECT_KEY = "effects";
  const BRANCH_KEY = "branches";
  const INDEPENDENT_EFFECTS_KEY = "independentEffects";

  const EXTRA_MECHANIC_KEYS = Object.freeze([
    "damageReduction",
    "spellResistance",
    "immunities",
    "applyConditions",
    "classSkillGrants",
    "useUntrained",
    "bonusRanks",
    "extraRanksPerLevel",
    "featGrants",
    "sizeChanges",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "attributeContributions",
    "grantDomains",
    "generatedEquipment",
    "summonCreatures",
    "weaponExtraDamage",
    "weaponDamageSizeChanges",
    "conditionalVariables",
    "attackRolls",
    "damageRolls",
    "d20Boosts",
    "periodicEffects",
  ]);

  const CHOICE_BEARING_EXTRA_KEYS = Object.freeze([
    "classSkillGrants",
    "useUntrained",
    "bonusRanks",
    "featGrants",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "attributeContributions",
    "grantDomains",
    "weaponExtraDamage",
    "conditionalVariables",
  ]);

  const PROMPTED_CHOICE_MECHANIC_KEYS = Object.freeze([
    BASE_EFFECT_KEY,
    "classSkillGrants",
    "useUntrained",
    "bonusRanks",
    "spellLikeAbilities",
    "casterLevelBonuses",
    "spellDcBonuses",
    "effectiveAttributeBonuses",
    "attributeContributions",
    "grantDomains",
    "weaponExtraDamage",
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
    return (
      keys.some((key) => hasMechanicList(item, key)) ||
      independentEffects(item).length > 0 ||
      hasBranches(item) ||
      (Array.isArray(item?.emittedAuras) && item.emittedAuras.length > 0) ||
      Boolean(item?.auraConfig?.enabled)
    );
  }

  function hasAura(value, seen = new WeakSet()) {
    if (!(seen instanceof WeakSet)) seen = new WeakSet();
    if (!value || typeof value !== "object") return false;
    if (seen.has(value)) return false;
    seen.add(value);
    if (value.auraConfig?.enabled === true) return true;
    const children = Array.isArray(value) ? value : Object.values(value);
    return children.some((child) => hasAura(child, seen));
  }

  function copyMechanics(item = {}, keys = mechanicKeys()) {
    return Object.fromEntries(
      keys.map((key) => [key, Array.isArray(item?.[key]) ? item[key] : []]),
    );
  }

  function independentEffects(item = {}) {
    const rows = Array.isArray(item?.[INDEPENDENT_EFFECTS_KEY])
      ? item[INDEPENDENT_EFFECTS_KEY]
      : [];
    return rows.map((entry, index) => {
      const child = JSON.parse(JSON.stringify(entry || {}));
      delete child[INDEPENDENT_EFFECTS_KEY];
      (Array.isArray(child.attackRolls) ? child.attackRolls : []).forEach(
        (attack) => delete attack[INDEPENDENT_EFFECTS_KEY],
      );
      return {
        ...child,
        id: String(child.id || `independent-effect-${index + 1}`),
        name: String(child.name || `Independent Effect ${index + 1}`).trim() || `Independent Effect ${index + 1}`,
        trigger: {
          scope: child.trigger?.scope === "attack" ? "attack" : "main",
          outcome: String(child.trigger?.outcome || "applied"),
          ...(child.trigger?.sourceId ? { sourceId: String(child.trigger.sourceId) } : {}),
        },
      };
    });
  }

  function copyIndependentEffects(item = {}) {
    const rows = independentEffects(item);
    return rows.length ? { [INDEPENDENT_EFFECTS_KEY]: rows } : {};
  }

  function independentTriggerMatches(entry = {}, event = {}) {
    const trigger = entry.trigger || {};
    if (String(trigger.scope || "main") !== String(event.scope || "main")) return false;
    if (String(trigger.outcome || "applied") !== String(event.outcome || "applied")) return false;
    if (trigger.scope === "attack" && trigger.sourceId)
      return String(trigger.sourceId) === String(event.sourceId || "");
    return true;
  }

  function triggeredIndependentEffects(item = {}, event = {}) {
    return independentEffects(item)
      .filter((entry) => independentTriggerMatches(entry, event))
      .map((entry) => {
        const child = JSON.parse(JSON.stringify(entry));
        delete child.trigger;
        delete child[INDEPENDENT_EFFECTS_KEY];
        return {
          ...child,
          name: child.name || item.name || "Independent Effect",
          independentEffectDepth: 1,
          independentEffectParentId: item.id || "",
          independentEffectParentName: item.name || "",
        };
      });
  }

  function separateIndependentEffects(item = {}) {
    const parent = JSON.parse(JSON.stringify(item || {}));
    const attackChildren = Array.isArray(parent._triggeredIndependentEffects)
      ? parent._triggeredIndependentEffects
      : [];
    const saveOutcome = String(parent._saveResolution || "");
    const children = [
      ...triggeredIndependentEffects(parent, { scope: "main", outcome: "applied" }),
      ...(saveOutcome && saveOutcome !== "applied"
        ? triggeredIndependentEffects(parent, { scope: "main", outcome: saveOutcome })
        : []),
      ...attackChildren,
    ].map((child) => {
      const clean = JSON.parse(JSON.stringify(child));
      delete clean[INDEPENDENT_EFFECTS_KEY];
      delete clean._triggeredIndependentEffects;
      return clean;
    });
    delete parent[INDEPENDENT_EFFECTS_KEY];
    delete parent._triggeredIndependentEffects;
    delete parent._saveResolution;
    return { parent, children };
  }

  function copyDecisionConfig(item = {}) {
    return {
      ...(item.decisionOwner
        ? {
            decisionOwner:
              String(item.decisionOwner).toLowerCase() === "target"
                ? "target"
                : "caster",
          }
        : {}),
      ...(Array.isArray(item.contributionOptions) &&
      item.contributionOptions.length
        ? { contributionOptions: item.contributionOptions }
        : {}),
      ...(Array.isArray(item.choicePools) && item.choicePools.length
        ? { choicePools: item.choicePools }
        : {}),
    };
  }

  function copySaveConfig(item = {}) {
    return item.saveConfig && typeof item.saveConfig === "object"
      ? { saveConfig: JSON.parse(JSON.stringify(item.saveConfig)) }
      : {};
  }

  function copyActivationConfig(item = {}) {
    return {
      ...copyDecisionConfig(item),
      ...copySaveConfig(item),
    };
  }

  const WEAPON_DAMAGE_SIZES = Object.freeze([
    "Fine",
    "Diminutive",
    "Tiny",
    "Small",
    "Medium",
    "Large",
    "Huge",
    "Gargantuan",
    "Colossal",
  ]);

  function normalizedWeaponRestriction(value = "") {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return {
      "melee-weapon-light": "melee-light",
      "melee-weapon-one-handed": "melee-one-handed",
      "melee-weapon-two-handed": "melee-two-handed",
      "ranged-weapon": "ranged",
      "thrown-weapon": "thrown",
      "natural-weapon": "natural",
    }[normalized] || normalized;
  }

  function weaponDamageSizeChangeMatches(
    change = {},
    weaponType = "",
    weaponName = "",
  ) {
    if (change.matchBy === "type") {
      const restriction = change.weaponType || "";
      if (!restriction) return false;
      if (root?.PFEffectStats?.weaponTypeRestrictionMatches) {
        return root.PFEffectStats.weaponTypeRestrictionMatches(
          restriction,
          weaponType,
          weaponName,
        );
      }
      return (
        normalizedWeaponRestriction(restriction) ===
        normalizedWeaponRestriction(weaponType)
      );
    }
    const restriction = change.weaponName || "";
    if (!restriction || !weaponName) return false;
    if (root?.PFEffectStats?.weaponNameRestrictionMatches) {
      return root.PFEffectStats.weaponNameRestrictionMatches(
        restriction,
        weaponName,
      );
    }
    return (
      normalizedWeaponRestriction(restriction) ===
      normalizedWeaponRestriction(weaponName)
    );
  }

  function weaponDamageSizeChangesForWeapon(
    effects = [],
    weaponType = "",
    weaponName = "",
  ) {
    return (Array.isArray(effects) ? effects : []).flatMap((effect) =>
      (Array.isArray(effect?.weaponDamageSizeChanges)
        ? effect.weaponDamageSizeChanges
        : []
      )
        .filter((change) =>
          weaponDamageSizeChangeMatches(change, weaponType, weaponName),
        )
        .map((change) => ({
          ...change,
          source: effect.name || effect.source || "Effect",
          sizeSteps: Math.sign(Number(change.sizeSteps) || 0),
        }))
        .filter((change) => change.sizeSteps),
    );
  }

  function shiftWeaponDamageSize(size = "Medium", steps = 0) {
    const current = WEAPON_DAMAGE_SIZES.findIndex(
      (entry) => entry.toLowerCase() === String(size || "").toLowerCase(),
    );
    if (current < 0) return "Medium";
    const target = Math.max(
      0,
      Math.min(
        WEAPON_DAMAGE_SIZES.length - 1,
        current + Math.trunc(Number(steps) || 0),
      ),
    );
    return WEAPON_DAMAGE_SIZES[target];
  }

  const ATTRIBUTE_KEYS = Object.freeze([
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha",
  ]);

  const ATTRIBUTE_NAMES = Object.freeze({
    str: "strength",
    dex: "dexterity",
    con: "constitution",
    int: "intelligence",
    wis: "wisdom",
    cha: "charisma",
  });

  function normalizeAttributeKey(value = "") {
    const raw = String(value || "").trim().toLowerCase();
    return (
      ATTRIBUTE_KEYS.find(
        (key) => key === raw || ATTRIBUTE_NAMES[key] === raw,
      ) || ""
    );
  }

  function normalizeAttributeContribution(entry = {}) {
    const stat = String(entry.stat || entry.target || "").trim().toLowerCase();
    return {
      ...entry,
      mode:
        String(entry.mode || entry.operation || "add").toLowerCase() ===
        "replace"
          ? "replace"
          : "add",
      ability: normalizeAttributeKey(entry.ability || entry.attribute),
      stat,
      weaponType: String(entry.weaponType || "all").trim() || "all",
      weaponName: String(entry.weaponName || "").trim(),
    };
  }

  function attributeContributionGroupMatches(group = "", stat = "", context = {}) {
    const key = String(group || "").replace(/^group:/, "").toLowerCase();
    const target = String(stat || "").toLowerCase();
    const skill = target.startsWith("skill:");
    const skillAbility = normalizeAttributeKey(context.skillAbility);
    if (key === "all") return true;
    if (key === "armor-class")
      return ["ac", "touch ac", "flat-footed ac"].includes(target);
    if (key === "saving-throws")
      return ["fortitude", "reflex", "will"].includes(target);
    if (key === "combat-maneuvers") return ["cmb", "cmd"].includes(target);
    if (key === "attacks") return target === "attack";
    if (key === "damage") return target === "damage";
    if (key === "weapon-rolls") return ["attack", "damage"].includes(target);
    if (key === "skills") return skill;
    if (key.startsWith("skills-"))
      return skill && skillAbility === normalizeAttributeKey(key.slice(7));
    return false;
  }

  function attributeContributionWeaponMatches(entry, context = {}) {
    if (!["attack", "damage"].includes(String(context.stat || ""))) return true;
    const type = entry.weaponType || "all";
    const name = entry.weaponName || "";
    if (type && type !== "all") {
      if (root?.PFEffectStats?.weaponTypeRestrictionMatches) {
        if (
          !root.PFEffectStats.weaponTypeRestrictionMatches(
            type,
            context.weaponType || "",
            context.weaponName || "",
          )
        )
          return false;
      } else if (
        normalizedWeaponRestriction(type) !==
        normalizedWeaponRestriction(context.weaponType)
      )
        return false;
    }
    if (!name) return true;
    if (root?.PFEffectStats?.weaponNameRestrictionMatches)
      return root.PFEffectStats.weaponNameRestrictionMatches(
        name,
        context.weaponName || "",
      );
    return (
      normalizedWeaponRestriction(name) ===
      normalizedWeaponRestriction(context.weaponName)
    );
  }

  function attributeContributionMatches(entry = {}, stat = "", context = {}) {
    const normalized = normalizeAttributeContribution(entry);
    if (!normalized.ability || !normalized.stat || normalized.stat.startsWith("choice:"))
      return false;
    const target = String(stat || "").toLowerCase();
    const statMatches = normalized.stat.startsWith("group:")
      ? attributeContributionGroupMatches(normalized.stat, target, context)
      : normalized.stat === target;
    return (
      statMatches &&
      attributeContributionWeaponMatches(normalized, { ...context, stat: target })
    );
  }

  function attributeContributionsForStat(
    effects = [],
    stat = "",
    context = {},
  ) {
    return (Array.isArray(effects) ? effects : []).flatMap((effect) =>
      (Array.isArray(effect?.attributeContributions)
        ? effect.attributeContributions
        : []
      )
        .map(normalizeAttributeContribution)
        .filter((entry) => attributeContributionMatches(entry, stat, context))
        .map((entry) => ({
          ...entry,
          source: effect.name || effect.source || "Effect",
        })),
    );
  }

  function resolveAttributeContributions({
    effects = [],
    stat = "",
    baseAbilities = [],
    abilityMods = {},
    context = {},
  } = {}) {
    const entries = attributeContributionsForStat(effects, stat, context);
    const replacements = entries.filter((entry) => entry.mode === "replace");
    const additions = entries.filter((entry) => entry.mode === "add");
    const base = (replacements.length ? [] : baseAbilities)
      .map(normalizeAttributeKey)
      .filter(Boolean)
      .map((ability) => ({ ability, mode: "base", source: "Base" }));
    const terms = [...base, ...replacements, ...additions].map((term) => ({
      ...term,
      value: Number(
        abilityMods[term.ability] ??
          abilityMods[ATTRIBUTE_NAMES[term.ability]] ??
          0,
      ),
    }));
    return {
      entries,
      terms,
      total: terms.reduce((sum, term) => sum + term.value, 0),
      replaced: replacements.length > 0,
    };
  }
  function contributionOptions(item = {}) {
    const rows = Array.isArray(item?.contributionOptions)
      ? item.contributionOptions
      : [];
    return rows.map((option, index) => ({
      ...option,
      id: String(option?.id || option?.name || `contribution-${index + 1}`),
      name:
        String(option?.name || `Option ${index + 1}`).trim() ||
        `Option ${index + 1}`,
      ...copyMechanics(option),
    }));
  }

  function hasContributionOptions(item = {}) {
    return contributionOptions(item).length > 0;
  }

  function resolveContributions(item = {}, selectedIds = []) {
    const selected = new Set((selectedIds || []).map(String));
    const chosen = contributionOptions(item).filter((option) =>
      selected.has(option.id),
    );
    const resolved = { ...item };
    delete resolved.contributionOptions;
    mechanicKeys().forEach((key) => {
      const targetKey =
        key === BASE_EFFECT_KEY &&
        Array.isArray(item.bonuses) &&
        !Array.isArray(item.effects)
          ? "bonuses"
          : key;
      const baseRows = Array.isArray(item[targetKey]) ? item[targetKey] : [];
      const contributedRows = chosen.flatMap((option) =>
        Array.isArray(option[key]) ? option[key] : [],
      );
      resolved[targetKey] = [...baseRows, ...contributedRows];
    });
    const baseEmittedAuras = Array.isArray(item.emittedAuras)
      ? item.emittedAuras
      : [];
    const contributedAuras = chosen.flatMap((option) =>
      Array.isArray(option.emittedAuras) ? option.emittedAuras : [],
    );
    resolved.emittedAuras = [...baseEmittedAuras, ...contributedAuras];
    resolved.selectedContributionIds = chosen.map((option) => option.id);
    resolved.selectedContributionNames = chosen.map((option) => option.name);
    if (
      chosen.some(
        (option) =>
          String(option.decisionOwner || "").toLowerCase() === "target",
      )
    ) {
      resolved.decisionOwner = "target";
    }
    return resolved;
  }

  async function chooseContributions(
    item = {},
    { title = "Effect", pick } = {},
  ) {
    const options = contributionOptions(item);
    if (!options.length) return item;
    const open = pick || globalThis.PFEffectChoicePicker?.openMultiple;
    if (typeof open !== "function") return null;
    const selected = await open({
      title: `${title}: Choose Rage Powers`,
      options: options.map((option) => ({
        value: option.id,
        label: option.name,
      })),
      selected: item.selectedContributionIds || [],
      confirmLabel: "Continue",
      searchable: false,
    });
    if (!Array.isArray(selected)) return null;
    return resolveContributions(item, selected);
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
      ...copyIndependentEffects(branch),
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
    resolved[INDEPENDENT_EFFECTS_KEY] = [
      ...independentEffects(item),
      ...independentEffects(selected),
    ];
    if (!resolved[INDEPENDENT_EFFECTS_KEY].length) delete resolved[INDEPENDENT_EFFECTS_KEY];
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
      searchable: false,
    });
    if (!selected) return null;
    const value = typeof selected === "object" ? selected.value : selected;
    return resolveBranch(item, value);
  }

  function passiveMechanics(item = {}) {
    return {
      ...copyMechanics(item),
      ...copyIndependentEffects(item),
      ...copyDecisionConfig(item),
      ...copySaveConfig(item),
      ...(hasBranches(item) ? { branches: branches(item) } : {}),
      auraConfig: item?.auraConfig || null,
    };
  }

  function activeMechanics(item = {}, { activeOnly = false } = {}) {
    if (item?.activeMechanics && typeof item.activeMechanics === "object") {
      return {
        ...copyMechanics(item.activeMechanics),
        ...copyIndependentEffects(item.activeMechanics),
        ...copyDecisionConfig(item.activeMechanics),
        ...copySaveConfig(item.activeMechanics),
        ...(hasBranches(item.activeMechanics)
          ? { branches: branches(item.activeMechanics) }
          : {}),
        durationConfig: item.activeMechanics.durationConfig || null,
        auraConfig: item.activeMechanics.auraConfig || null,
        metamagicRiders: Array.isArray(item.activeMechanics.metamagicRiders)
          ? item.activeMechanics.metamagicRiders
          : [],
        metamagicDurationMultiplier: Number(
          item.activeMechanics.metamagicDurationMultiplier || 1,
        ),
      };
    }
    if (activeOnly) {
      return {
        ...copyMechanics(item),
        ...copyIndependentEffects(item),
        ...copyDecisionConfig(item),
        ...copySaveConfig(item),
        ...(hasBranches(item) ? { branches: branches(item) } : {}),
        durationConfig: item.durationConfig || null,
        auraConfig: item.auraConfig || null,
        metamagicRiders: Array.isArray(item.metamagicRiders)
          ? item.metamagicRiders
          : [],
        metamagicDurationMultiplier: Number(
          item.metamagicDurationMultiplier || 1,
        ),
      };
    }
    return {
      ...copyMechanics({}),
      durationConfig: null,
      auraConfig: null,
      metamagicRiders: [],
      metamagicDurationMultiplier: 1,
    };
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
    if (["casting", "casting modifier", "castingmodifier"].includes(raw)) {
      const explicit =
        context.castingAbilityMod ??
        context.spellCalculations?.castingAbilityMod;
      if (explicit !== undefined && Number.isFinite(Number(explicit)))
        return Number(explicit);
      const castingAbility = String(
        context.castingAbility ||
          context.spellCalculations?.castingAbility ||
          "",
      ).toLowerCase();
      if (!castingAbility) return null;
      return contextAbilityModifier(
        { ability: castingAbility },
        { ...context, castingAbility: "" },
      );
    }
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
      context.abilityMods?.[ability] ??
      context.abilityMods?.[ability.toUpperCase()] ??
      context.abilityMods?.[longKey];
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
          const raw = String(
            entry.ability || entry.attribute || "",
          ).toLowerCase();
          const castingModifier = [
            "casting",
            "casting modifier",
            "castingmodifier",
          ].includes(raw);
          if (source === "recipient" && !castingModifier) {
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

  function resolveAuraRange(effect = {}) {
    const config = effect.auraConfig || {};
    const baseRange = Math.max(5, Number(config.rangeFeet || 5));
    if (!config.rangeScale) return baseRange;
    const scaledValue = root?.PFBuffs?.scaledBonusValue;
    if (typeof scaledValue !== "function") return baseRange;
    const range = Number(
      scaledValue(
        { value: baseRange, bonusScale: config.rangeScale },
        effect,
      ),
    );
    return Number.isFinite(range) ? Math.max(5, range) : baseRange;
  }

  function auraVolumeShape(config = {}) {
    return config.volumeShape === "cylinder" ? "cylinder" : "sphere";
  }

  function auraHeightFeet(config = {}, rangeFeet = 5) {
    const radiusFeet = Math.max(5, Number(rangeFeet || 5));
    return auraVolumeShape(config) === "cylinder"
      ? Math.max(5, Number(config.heightFeet || radiusFeet * 2))
      : radiusFeet * 2;
  }

  function pointInAuraVolume(source = {}, target = {}, aura = {}) {
    const radiusFeet = Math.max(
      5,
      Number(aura.rangeFeet || Number(aura.radius || 1) * 5),
    );
    const horizontalFeet =
      Math.hypot(
        Number(target.x || 0) - Number(source.x || 0),
        Number(target.y || 0) - Number(source.y || 0),
      ) * 5;
    const verticalFeet = Math.abs(
      Number(target.elevationFeet || 0) - Number(source.elevationFeet || 0),
    );
    if (auraVolumeShape(aura) === "cylinder") {
      return (
        horizontalFeet <= radiusFeet &&
        verticalFeet <= auraHeightFeet(aura, radiusFeet) / 2
      );
    }
    return Math.hypot(horizontalFeet, verticalFeet) <= radiusFeet;
  }

  function createAuraLink(sourceToken = {}, effect = {}, options = {}) {
    if (!effect?.auraConfig?.enabled) return null;
    const auraId =
      options.id ||
      `automatic-aura-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const kind = options.kind || "active";
    const config = effect.auraConfig || {};
    const rangeFeet = resolveAuraRange(effect);
    const volumeShape = auraVolumeShape(config);
    const auraEffect = JSON.parse(
      JSON.stringify(options.recipientEffect || effect),
    );
    delete auraEffect.auraConfig;
    if (config.lingerDurationConfig)
      auraEffect.auraLingerDurationConfig = JSON.parse(
        JSON.stringify(config.lingerDurationConfig),
      );
    auraEffect.sourceTokenId = auraEffect.sourceTokenId || sourceToken.id || "";
    auraEffect.casterTokenId =
      auraEffect.casterTokenId || auraEffect.sourceTokenId || sourceToken.id || "";

    const controller = JSON.parse(JSON.stringify(effect));
    if (!config.affectsSource) {
      mechanicKeys().forEach((key) => delete controller[key]);
      delete controller.bonuses;
    }
    delete controller.branches;
    delete controller.auraConfig;
    delete controller.metamagicRiders;
    controller.id = `${auraId}:effect`;
    controller.auraController = true;
    controller.linkedAuraId = auraId;
    controller.auraSourceEffectId = effect.id || "";
    controller.durationAnchorTokenId = sourceToken.id;
    controller.sourceTokenId = controller.sourceTokenId || sourceToken.id || "";
    controller.casterTokenId =
      controller.casterTokenId || controller.sourceTokenId || sourceToken.id || "";

    return {
      aura: {
        id: auraId,
        ...(kind === "active" ? { linkedEffectId: controller.id } : {}),
        kind,
        visible: true,
        radius: Math.max(1, Math.ceil(rangeFeet / 5)),
        rangeFeet,
        volumeShape,
        heightFeet: auraHeightFeet(config, rangeFeet),
        ...(["light", "specialVision"].includes(config.revealMode)
          ? { revealMode: config.revealMode }
          : {}),
        ...(String(config.textureUrl || "").trim()
          ? { textureUrl: String(config.textureUrl).trim() }
          : {}),
        color: sourceToken.kind === "enemy" ? "#b02a37" : "#8fd19e",
        effect: auraEffect,
        affectsSource: Boolean(config.affectsSource),
        removeWhenOutOfRange: true,
        permanent: Boolean(effect.permanent || kind === "passive"),
        remaining: effect.remaining ?? null,
        durationAnchorTokenId: sourceToken.id,
        casterTokenId: auraEffect.casterTokenId,
        emitterTokenId: sourceToken.id || "",
      },
      controller,
    };
  }

  function createIndependentAuraToken(sourceToken = {}, effect = {}, options = {}) {
    if (!effect?.auraConfig?.enabled || !effect.auraConfig.independentToken)
      return null;
    const tokenId =
      options.tokenId ||
      `aura-token-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const link = createAuraLink(sourceToken, effect, options);
    if (!link) return null;
    link.aura.independentAuraTokenId = tokenId;
    link.controller.independentAuraTokenId = tokenId;
    return {
      ...link,
      token: {
        id: tokenId,
        kind: "aura",
        panelOnly: true,
        independentAuraToken: true,
        ownerId: sourceToken.ownerId || "",
        name: effect.name || "Aura",
        effectCategory: effect.category || "Effect",
        x: Number(sourceToken.x || 0),
        y: Number(sourceToken.y || 0),
        w: 1,
        h: 1,
        sizeLinked: true,
        zIndex:
          options.zIndex ?? Math.max(2, Number(sourceToken.zIndex || 2) + 1),
        color: link.aura.color,
        auraCasterTokenId: sourceToken.id || "",
        auraControllerEffectId: link.controller.id,
        auraSourceEffectId: effect.id || "",
        automaticAuras: [link.aura],
      },
    };
  }

  function emittedAuraParentKey(parentEffect = {}) {
    return [
      parentEffect.id || parentEffect.activationGroup || parentEffect.name || "effect",
      parentEffect.activationSourceId || parentEffect.sourceTokenId || "",
    ].join("|");
  }

  function createEmittedAuraLinks(sourceToken = {}, parentEffect = {}) {
    const rows = Array.isArray(parentEffect.emittedAuras)
      ? parentEffect.emittedAuras
      : [];
    const parentId = String(
      parentEffect.id || parentEffect.activationGroup || parentEffect.name || "effect",
    );
    return rows
      .filter((entry) => entry?.auraConfig?.enabled)
      .map((entry, index) => {
        const key = String(entry.id || entry.name || `aura-${index + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `aura-${index + 1}`;
        const emittedEffect = {
          ...entry,
          id: `${parentId}:emitted:${key}`,
          category: entry.category || parentEffect.category || "Effect",
          source: entry.source || parentEffect.source || "",
          casterLevel: parentEffect.casterLevel,
          ...(parentEffect.classLevels
            ? { classLevels: parentEffect.classLevels }
            : {}),
          sourceTokenId: sourceToken.id || "",
          casterTokenId:
            parentEffect.casterTokenId ||
            parentEffect.sourceTokenId ||
            sourceToken.id ||
            "",
          durationAnchorTokenId:
            parentEffect.durationAnchorTokenId ||
            parentEffect.sourceTokenId ||
            sourceToken.id ||
            "",
          permanent: Boolean(parentEffect.permanent),
          remaining: parentEffect.remaining ?? null,
        };
        delete emittedEffect.emittedAuras;
        const link = createAuraLink(sourceToken, emittedEffect, {
          id: `${parentId}:emitted-aura:${key}`,
        });
        if (!link) return null;
        link.aura.linkedEffectId = parentEffect.id || link.controller.id;
        link.aura.emittedAuraParentKey = emittedAuraParentKey(parentEffect);
        link.aura.visualOnly = true;
        link.aura.removeWhenOutOfRange = false;
        return link;
      })
      .filter(Boolean);
  }

  function isAuraController(effect = {}) {
    return Boolean(effect.auraController && effect.linkedAuraId);
  }

  function beginAuraLinger(effect = {}, options = {}) {
    const config = effect.auraLingerDurationConfig;
    if (!config) return null;
    if (effect.auraLingering) return effect;
    const context = {
      casterLevel: effect.casterLevel,
      characterLevel: effect.characterLevel || effect.casterLevel,
      classLevel: effect.classLevel,
      classLevels: effect.classLevels,
      abilityMods: effect.abilityMods,
      specialValues: effect.specialValues,
      ...(options.context || {}),
    };
    const remaining = root?.PFEffectMeta?.parseDuration
      ? root.PFEffectMeta.parseDuration(config, context)
      : null;
    return {
      ...effect,
      auraLingering: true,
      permanent: false,
      remaining,
      computedDuration: remaining,
      durationConfig: JSON.parse(JSON.stringify(config)),
      durationLabel: root?.PFEffectMeta?.durationLabel
        ? root.PFEffectMeta.durationLabel(config)
        : "variable",
      durationAnchorTokenId:
        options.durationAnchorTokenId || effect.durationAnchorTokenId || "",
    };
  }

  function restoreAuraBoundEffect(effect = {}, aura = {}) {
    if (!effect.auraLingering) return effect;
    const restored = {
      ...effect,
      permanent: Boolean(aura.permanent),
      remaining: aura.remaining ?? null,
      computedDuration:
        aura.remaining ?? aura.effect?.computedDuration ?? null,
      durationAnchorTokenId:
        aura.durationAnchorTokenId || effect.durationAnchorTokenId || "",
    };
    if (aura.effect?.durationConfig)
      restored.durationConfig = JSON.parse(
        JSON.stringify(aura.effect.durationConfig),
      );
    else delete restored.durationConfig;
    if (aura.effect?.durationLabel)
      restored.durationLabel = aura.effect.durationLabel;
    else delete restored.durationLabel;
    delete restored.auraLingering;
    return restored;
  }

  function auraActivationKey(effect = {}) {
    if (effect.activationGroup)
      return `group:${String(effect.activationGroup)}`;
    if (effect.id) return `effect:${String(effect.id)}`;
    return "";
  }

  function auraActivationSource(value = {}, fallbackSourceId = "") {
    const effect = value.effect || value;
    return String(
      effect.activationSourceId ||
        effect.sourceTokenId ||
        value.durationAnchorTokenId ||
        effect.durationAnchorTokenId ||
        fallbackSourceId ||
        "",
    );
  }

  function upsertLinkedAura(auras = [], nextAura = null, sourceTokenId = "") {
    const current = Array.isArray(auras) ? auras : [];
    if (!nextAura) return [...current];
    const nextKey = auraActivationKey(nextAura.effect || {});
    if (!nextKey) return [...current, nextAura];
    const nextSource = auraActivationSource(nextAura, sourceTokenId);
    return [
      ...current.filter((aura) => {
        if (aura.kind === "passive") return true;
        if (auraActivationKey(aura.effect || {}) !== nextKey) return true;
        return auraActivationSource(aura) !== nextSource;
      }),
      nextAura,
    ];
  }

  function upsertAuraController(
    activeEffects = [],
    controller = null,
    sourceTokenId = "",
  ) {
    const current = Array.isArray(activeEffects) ? activeEffects : [];
    if (!controller) return [...current];
    const controllerEffect = {
      ...controller,
      id: controller.auraSourceEffectId || "",
    };
    const nextKey = auraActivationKey(controllerEffect);
    const nextSignature = [
      controller.category || "",
      controller.source || "",
      controller.sourceSpellName || "",
      controller.name || "",
    ].join("|");
    if (!nextKey) return [...current, controller];
    const nextSource = auraActivationSource(controller, sourceTokenId);
    return [
      ...current.filter((effect) => {
        if (!isAuraController(effect)) return true;
        const existingEffect = {
          ...effect,
          id: effect.auraSourceEffectId || "",
        };
        const existingKey = auraActivationKey(existingEffect);
        const existingSignature = [
          effect.category || "",
          effect.source || "",
          effect.sourceSpellName || "",
          effect.name || "",
        ].join("|");
        const sameActivation =
          existingKey === nextKey ||
          (!effect.auraSourceEffectId && existingSignature === nextSignature);
        return (
          !sameActivation || auraActivationSource(effect) !== nextSource
        );
      }),
      controller,
    ];
  }

  function reconcileLinkedAuras(auras = [], activeEffects = []) {
    const effectIds = new Set(
      (Array.isArray(activeEffects) ? activeEffects : [])
        .map((effect) => effect?.id)
        .filter(Boolean),
    );
    return (Array.isArray(auras) ? auras : []).filter(
      (aura) =>
        aura.kind === "passive" ||
        !aura.linkedEffectId ||
        effectIds.has(aura.linkedEffectId),
    );
  }

  return {
    baseEffectKey: BASE_EFFECT_KEY,
    branchKey: BRANCH_KEY,
    extraKeys,
    mechanicKeys,
    independentEffects,
    copyIndependentEffects,
    triggeredIndependentEffects,
    separateIndependentEffects,
    choiceBearingExtraKeys,
    promptedChoiceMechanicKeys,
    hasMechanicList,
    hasAnyMechanics,
    hasAura,
    copyMechanics,
    copyActivationConfig,
    contributionOptions,
    hasContributionOptions,
    resolveContributions,
    chooseContributions,
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
    weaponDamageSizeChangeMatches,
    weaponDamageSizeChangesForWeapon,
    shiftWeaponDamageSize,
    normalizeAttributeKey,
    normalizeAttributeContribution,
    attributeContributionMatches,
    attributeContributionsForStat,
    resolveAttributeContributions,
    attributeScaleSource,
    resolveCasterAttributeScales,
    resolveAuraRange,
    auraVolumeShape,
    auraHeightFeet,
    pointInAuraVolume,
    createAuraLink,
    createIndependentAuraToken,
    emittedAuraParentKey,
    createEmittedAuraLinks,
    isAuraController,
    beginAuraLinger,
    restoreAuraBoundEffect,
    upsertLinkedAura,
    upsertAuraController,
    reconcileLinkedAuras,
  };
});
