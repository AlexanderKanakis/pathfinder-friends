(function (root, factory) {
  const api = factory(root);
  if (root) root.PFMetamagic = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const MECHANIC_ARRAYS = [
    "bonuses",
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
  ];
  const DESCRIPTORS = new Map([
    ["Apocalyptic Spell", "evil"],
    ["Authoritative Spell", "lawful"],
    ["Blissful Spell", "good"],
    ["Crypt Spell", "death"],
    ["Toxic Spell", "poison"],
    ["Umbral Spell", "darkness"],
  ]);
  const CONDITION_RULES = new Map([
    ["Dazing Spell", { condition: "Dazed", save: true, duration: "spell-level" }],
    ["Fearsome Spell", { condition: "Shaken", save: true, duration: "spell-level" }],
    ["Flaring Spell", { condition: "Dazzled", save: false, duration: "spell-level" }],
    ["Rime Spell", { condition: "Entangled", save: true, duration: "spell-level" }],
    ["Sickening Spell", { condition: "Sickened", save: true, duration: "spell-level", requiresDamage: true }],
    ["Solar Spell", { condition: "Dazzled", save: false, duration: "caster-level" }],
    ["Thundering Spell", { condition: "Deafened", save: true, duration: "spell-level", requiresDamage: true }],
  ]);
  let definitionsPromise = null;
  let conditionPromise = null;

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function slug(value) {
    return String(value || "metamagic")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function loadJson(path) {
    if (typeof fetch !== "function") return null;
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
    return response.json();
  }

  async function loadDefinitions() {
    if (!definitionsPromise) {
      definitionsPromise = loadJson("metamagic.json").then((data) =>
        (Array.isArray(data?.metamagic) ? data.metamagic : []).map((entry) => ({
          name: String(entry.name || "").trim(),
          benefits: String(entry.benefits || "").trim(),
          description: String(entry.description || "").trim(),
          spellLevelIncrease: Math.max(0, number(entry.spellLevelIncrease, 0)),
          effect: String(entry.effect || "").trim(),
        })),
      );
    }
    return definitionsPromise;
  }

  async function loadConditions() {
    if (!conditionPromise) {
      conditionPromise = loadJson("data/conditions.json").then((rows) => {
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((entry) =>
          map.set(String(entry.name || "").toLowerCase(), entry),
        );
        return map;
      });
    }
    return conditionPromise;
  }

  async function ready() {
    const [definitions, conditions] = await Promise.all([
      loadDefinitions(),
      loadConditions(),
    ]);
    return { definitions, conditions };
  }

  function mechanicShell(name, description = "") {
    const result = {
      id: `metamagic-${slug(name)}`,
      name,
      source: `Metamagic: ${name}`,
      category: "Spell",
      description,
    };
    MECHANIC_ARRAYS.forEach((key) => {
      result[key] = [];
    });
    return result;
  }

  function activeMechanics(spell) {
    if (spell.activeMechanics && typeof spell.activeMechanics === "object")
      return spell.activeMechanics;
    spell.activeMechanics = {};
    MECHANIC_ARRAYS.forEach((key) => {
      spell.activeMechanics[key] = Array.isArray(spell[key]) ? clone(spell[key]) : [];
    });
    return spell.activeMechanics;
  }

  function normalizeMechanics(mechanics) {
    MECHANIC_ARRAYS.forEach((key) => {
      if (!Array.isArray(mechanics[key])) mechanics[key] = [];
    });
    if (!Array.isArray(mechanics.metamagicRiders)) mechanics.metamagicRiders = [];
    return mechanics;
  }

  function addDescriptor(spell, descriptor) {
    const details = spell.details || (spell.details = {});
    const values = new Set(
      (Array.isArray(details.descriptors) ? details.descriptors : [])
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean),
    );
    values.add(descriptor);
    details.descriptors = [...values];
  }

  function removeComponent(text, component) {
    return String(text || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry && entry.toUpperCase() !== component)
      .join(", ");
  }

  function scaledDurationText(text, multiplier) {
    return String(text || "").replace(
      /(^|\b)(\d+)\s*(rounds?|minutes?|mins?\.?|hours?|days?)/i,
      (_, prefix, amount, unit) => {
        const total = Math.max(1, Math.floor(number(amount, 1) * multiplier));
        const singular = String(unit).replace(/s\.?$/i, "");
        return `${prefix}${total} ${singular}${total === 1 ? "" : "s"}`;
      },
    );
  }

  function scaleDurationConfig(config, multiplier) {
    if (!config || typeof config !== "object") return config;
    const next = clone(config);
    if (Number.isFinite(Number(next.count)))
      next.count = Math.max(1, Math.floor(Number(next.count) * multiplier));
    return next;
  }

  function mapDamageProfiles(rolls, callback) {
    return (Array.isArray(rolls) ? rolls : []).map((roll) => {
      const next = callback({ ...roll });
      next.conditionals = (Array.isArray(roll.conditionals) ? roll.conditionals : []).map(
        (profile) => callback({ ...profile }),
      );
      return next;
    });
  }

  function transformDamageRolls(mechanics, transform) {
    mechanics.damageRolls = mapDamageProfiles(mechanics.damageRolls, transform);
    mechanics.metamagicRiders.forEach((rider) => {
      rider.damageRolls = mapDamageProfiles(rider.damageRolls, transform);
    });
  }

  function multiplyDamageRoll(roll, multiplier, overrides = {}) {
    const scaled = {
      ...clone(roll),
      ...overrides,
      damageMultiplier: number(roll.damageMultiplier, 1) * multiplier,
    };
    scaled.conditionals = (Array.isArray(roll.conditionals) ? roll.conditionals : []).map(
      (profile) => ({
        ...clone(profile),
        ...(overrides.damageType ? { damageType: overrides.damageType } : {}),
        damageMultiplier: number(profile.damageMultiplier, 1) * multiplier,
      }),
    );
    return scaled;
  }

  function durationConfig(rule, spellLevel) {
    if (rule === "caster-level")
      return { count: 1, unit: "round", factors: [{ type: "caster" }], factorMode: "multiply" };
    return { count: Math.max(1, spellLevel), unit: "round", factors: [], factorMode: "multiply" };
  }

  function conditionEntry(name, conditions) {
    const condition = clone(conditions?.get(String(name).toLowerCase()) || {});
    return {
      conditionId: condition.id || `condition-${slug(name)}`,
      name,
      condition: {
        ...condition,
        id: condition.id || `condition-${slug(name)}`,
        name,
      },
    };
  }

  function saveType(definition, spell) {
    const explicit = String(definition?.benefits || "").match(/\b(Fortitude|Reflex|Will)\b/i)?.[1];
    const inherited = String(spell.details?.saving_throw || "").match(/\b(Fortitude|Reflex|Will)\b/i)?.[1];
    return inherited || explicit || "Save";
  }

  function addConditionRider(mechanics, definition, rule, spell, context) {
    if (rule.requiresDamage && !mechanics.damageRolls.length) return;
    const rider = mechanicShell(
      `${definition.name}: ${rule.condition}`,
      definition.benefits,
    );
    rider.applyConditions.push(conditionEntry(rule.condition, context.conditions));
    rider.durationConfig = durationConfig(rule.duration, context.originalSpellLevel);
    rider.duration = rule.duration === "caster-level"
      ? "1 round/caster level"
      : `${Math.max(1, context.originalSpellLevel)} rounds`;
    rider.metamagicName = definition.name;
    if (rule.save) {
      rider.metamagicSave = {
        type: saveType(definition, spell),
        prompt: `Did the target fail the save against ${definition.name}?`,
      };
    }
    mechanics.metamagicRiders.push(rider);
  }

  function bonusRider(definition, bonuses, context, options = {}) {
    const rider = mechanicShell(definition.name, definition.benefits);
    rider.bonuses = bonuses;
    rider.durationConfig = options.durationConfig || durationConfig("spell-level", context.originalSpellLevel);
    rider.duration = options.duration || `${Math.max(1, context.originalSpellLevel)} rounds`;
    rider.metamagicName = definition.name;
    if (options.save) {
      rider.metamagicSave = {
        type: options.saveType || "Save",
        prompt: `Did the target fail the save against ${definition.name}?`,
      };
    }
    return rider;
  }

  function appendCalculationBonus(result, value, source, conditional = false) {
    if (!result) return result;
    const next = clone(result);
    const row = { source, value, type: "metamagic", stacks: true };
    if (conditional) {
      next.conditional = [...(next.conditional || []), row];
      return next;
    }
    const currentBonus = number(next.bonus);
    const currentCalculatedBonus = number(next.calculatedBonus, currentBonus);
    next.total = number(next.total ?? next.base) + value;
    next.bonus = currentBonus + value;
    next.calculatedBonus = currentCalculatedBonus + value;
    next.used = [...(next.used || []), row];
    return next;
  }

  function optionFor(selection, key, fallback = "") {
    return selection?.options?.[key] ?? fallback;
  }

  function applyRule(spell, calculations, mechanics, definition, selection, context) {
    const name = definition.name;
    const details = spell.details || (spell.details = {});
    const descriptor = DESCRIPTORS.get(name);
    if (descriptor) addDescriptor(spell, descriptor);

    const conditionRule = CONDITION_RULES.get(name);
    if (conditionRule)
      addConditionRider(mechanics, definition, conditionRule, spell, context);

    if (name === "Silent Spell") details.components = removeComponent(details.components, "V");
    if (name === "Still Spell") details.components = removeComponent(details.components, "S");
    if (name === "Quicken Spell") details.casting_time = "1 swift action";
    if (name === "Extend Spell") {
      details.duration = scaledDurationText(details.duration, 2);
      mechanics.durationConfig = scaleDurationConfig(mechanics.durationConfig, 2);
      calculations.calculatedDuration = scaledDurationText(calculations.calculatedDuration, 2);
    }
    if (name === "Murky Spell") {
      mechanics.metamagicDurationMultiplier = 0.1;
      calculations.metamagicDurationMultiplier = 0.1;
      calculations.calculatedDuration = scaledDurationText(calculations.calculatedDuration, 0.1);
    }
    if (name === "Enlarge Spell") {
      details.range = String(details.range || "").replace(/(\d+)\s*ft\.?/i, (_, feet) => `${number(feet) * 2} ft.`);
      calculations.calculatedRange = String(calculations.calculatedRange || "").replace(/(\d+)\s*ft\.?/i, (_, feet) => `${number(feet) * 2} ft.`);
    }
    if (name === "Reach Spell") {
      const range = String(optionFor(selection, "range", "long") || "long").toLowerCase();
      details.range = range === "short" ? "close" : range;
    }
    if (name === "Widen Spell" && mechanics.auraConfig?.enabled) {
      mechanics.auraConfig.rangeFeet = Math.max(5, number(mechanics.auraConfig.rangeFeet, 5) * 2);
    }
    if (name === "Elemental Spell") {
      const type = String(optionFor(selection, "damageType", "fire"));
      const mode = optionFor(selection, "mode", "replace");
      if (mode === "split") {
        mechanics.damageRolls = mechanics.damageRolls.flatMap((roll) => [
          multiplyDamageRoll(roll, 0.5, { label: `${roll.label || "Damage"} (normal half)` }),
          multiplyDamageRoll(roll, 0.5, { id: `${roll.id || "damage"}-${type}`, label: `${roll.label || "Damage"} (${type} half)`, damageType: type }),
        ]);
      } else {
        transformDamageRolls(mechanics, (profile) => ({ ...profile, damageType: type }));
      }
      addDescriptor(spell, type);
    }
    if (name === "Benthic Spell") {
      const mode = optionFor(selection, "mode", "replace");
      if (mode === "split") {
        mechanics.damageRolls = mechanics.damageRolls.flatMap((roll) => [
          multiplyDamageRoll(roll, 0.5, { label: `${roll.label || "Damage"} (normal half)` }),
          multiplyDamageRoll(roll, 0.5, { id: `${roll.id || "damage"}-bludgeoning`, label: `${roll.label || "Damage"} (bludgeoning half)`, damageType: "bludgeoning" }),
        ]);
      } else {
        transformDamageRolls(mechanics, (profile) => ({ ...profile, damageType: "bludgeoning" }));
      }
      addDescriptor(spell, "water");
    }
    if (["Maximize Spell", "Consecrate Spell"].includes(name))
      transformDamageRolls(mechanics, (profile) => ({ ...profile, maximizeDice: true }));
    if (name === "Empower Spell")
      transformDamageRolls(mechanics, (profile) => ({ ...profile, damageMultiplier: number(profile.damageMultiplier, 1) * 1.5 }));
    if (name === "Furious Spell" && mechanics.damageRolls.length) {
      const bonus = context.originalSpellLevel * 2;
      transformDamageRolls(mechanics, (profile) => ({ ...profile, staticDamage: number(profile.staticDamage) + bonus }));
    }
    if (name === "Intensified Spell")
      transformDamageRolls(mechanics, (profile) => ({
        ...profile,
        diceCountMax: profile.diceCountScale && profile.diceCountMax !== null && profile.diceCountMax !== undefined
          ? number(profile.diceCountMax, 0) + 5
          : profile.diceCountMax,
      }));
    if (name === "Encouraging Spell") {
      mechanics.effects = (mechanics.effects || mechanics.bonuses || []).map((entry) =>
        String(entry.type || "").toLowerCase() === "morale"
          ? { ...entry, value: number(entry.value) + 1 }
          : entry,
      );
      mechanics.bonuses = (mechanics.bonuses || []).map((entry) =>
        String(entry.type || "").toLowerCase() === "morale"
          ? { ...entry, value: number(entry.value) + 1 }
          : entry,
      );
    }
    if (name === "Focused Spell") {
      calculations.spellDc = appendCalculationBonus(calculations.spellDc, 2, name);
    }
    if (name === "Tenebrous Spell") {
      calculations.spellDc = appendCalculationBonus(calculations.spellDc, 1, name, true);
      calculations.casterLevel = appendCalculationBonus(calculations.casterLevel, 1, name, true);
    }
    if (name === "Concussive Spell") {
      mechanics.metamagicRiders.push(
        bonusRider(definition, [
          { stat: "attack", value: -2, type: "penalty", stacks: true },
          { stat: "all saves", value: -2, type: "penalty", stacks: true },
          { stat: "skill checks", value: -2, type: "penalty", stacks: true },
          { stat: "ability checks", value: -2, type: "penalty", stacks: true },
        ], context, { save: true, saveType: saveType(definition, spell) }),
      );
    }
    if (name === "Jinxed Spell") {
      mechanics.metamagicRiders.push(
        bonusRider(definition, [
          { stat: "all saves", value: -1, type: "penalty", stacks: true },
        ], context, { save: true, saveType: saveType(definition, spell) }),
      );
    }
    if (name === "Scarring Spell") {
      const rider = bonusRider(definition, [
        { stat: "all saves", value: -2, type: "penalty", stacks: true, conditional: true, appliesWhen: "vs emotion and fear effects created by the caster" },
        { stat: "all saves", value: -1, type: "penalty", stacks: true, conditional: true, appliesWhen: "vs other emotion and fear effects" },
      ], context, { save: true, saveType: saveType(definition, spell), duration: "24 hours", durationConfig: { count: 24, unit: "hour", factors: [] } });
      mechanics.metamagicRiders.push(rider);
    }
    if (name === "Crypt Spell" && optionFor(selection, "targetKind", "not-undead") === "undead") {
      const rider = mechanicShell(`${definition.name}: Sickened`, definition.benefits);
      rider.applyConditions.push(conditionEntry("Sickened", context.conditions));
      rider.duration = `${Math.max(1, context.originalSpellLevel)} rounds`;
      rider.durationConfig = durationConfig("spell-level", context.originalSpellLevel);
      rider.metamagicName = name;
      rider.metamagicSave = {
        type: saveType(definition, spell),
        prompt: `Did the undead target fail the save against ${definition.name}?`,
        passedDurationMultiplier: 0.5,
      };
      mechanics.metamagicRiders.push(rider);
    }
    if (name === "Brackish Spell") {
      const rider = mechanicShell(definition.name, definition.benefits);
      rider.damageReduction = [{ amount: context.originalSpellLevel, overcomeType: "piercing" }];
      rider.duration = "1 round";
      rider.durationConfig = { count: 1, unit: "round", factors: [] };
      rider.metamagicName = name;
      rider.metamagicSelfOnly = true;
      mechanics.metamagicRiders.push(rider);
    }
    if (name === "Cherry Blossom Spell" && mechanics.damageRolls.length) {
      const mental = optionFor(selection, "abilityGroup", "physical") === "mental";
      const abilities = mental ? ["intelligence", "wisdom", "charisma"] : ["strength", "dexterity", "constitution"];
      abilities.forEach((stat) => {
        const label = `${stat[0].toUpperCase()}${stat.slice(1)} Damage`;
        const rider = bonusRider(
          definition,
          [{ stat, value: -2, type: "ability damage", stacks: true }],
          context,
          { save: true, saveType: saveType(definition, spell), duration: "Ability damage" },
        );
        rider.id = `metamagic-${slug(definition.name)}-${stat}`;
        rider.name = `${definition.name}: ${label}`;
        rider.permanent = true;
        rider.durationConfig = null;
        rider.adjustableCondition = {
          kind: "ability-damage",
          label,
          amount: 2,
          minimum: 0,
          stat,
        };
        rider.metamagicSave.group = "Cherry Blossom Spell";
        mechanics.metamagicRiders.push(rider);
      });
    }
  }

  function apply({ spell = {}, calculations = null, selections = [] } = {}) {
    const effectiveSpell = clone(spell) || {};
    const effectiveCalculations = clone(calculations) || {};
    const mechanics = normalizeMechanics(activeMechanics(effectiveSpell));
    const definitions = new Map(
      selections.map((selection) => [selection.name, selection.definition || selection]),
    );
    const originalSpellLevel = number(
      calculations?.originalSpellLevel ?? calculations?.spellLevel,
      0,
    );
    let effectiveSlotLevel = originalSpellLevel;
    let effectiveSpellLevel = originalSpellLevel;
    const context = {
      conditions: root?.PFMetamagicPicker?.conditionDefinitions?.() || new Map(),
      originalSpellLevel,
    };

    selections.forEach((selection) => {
      const definition = definitions.get(selection.name) || selection;
      let increase = Math.max(0, number(definition.spellLevelIncrease, 0));
      if (definition.name === "Heighten Spell") {
        const targetLevel = Math.max(
          originalSpellLevel + 1,
          Math.min(9, number(optionFor(selection, "targetLevel"), originalSpellLevel + 1)),
        );
        increase = targetLevel - originalSpellLevel;
        effectiveSpellLevel = targetLevel;
      }
      if (definition.name === "Reach Spell") {
        const order = ["touch", "short", "medium", "long"];
        const currentText = String(effectiveSpell.details?.range || "").toLowerCase();
        const current = currentText.includes("touch") ? "touch" : currentText.includes("close") ? "short" : currentText.includes("medium") ? "medium" : "long";
        increase = Math.max(0, order.indexOf(optionFor(selection, "range", "long")) - order.indexOf(current));
      }
      effectiveSlotLevel += increase;
      applyRule(effectiveSpell, effectiveCalculations, mechanics, definition, selection, context);
    });

    if (effectiveSpellLevel !== originalSpellLevel) {
      const difference = effectiveSpellLevel - originalSpellLevel;
      effectiveCalculations.spellDc = appendCalculationBonus(
        effectiveCalculations.spellDc,
        difference,
        "Heighten Spell",
      );
      effectiveCalculations.spellLevel = effectiveSpellLevel;
    }
    effectiveCalculations.originalSpellLevel = originalSpellLevel;
    effectiveCalculations.effectiveSpellLevel = effectiveSpellLevel;
    effectiveCalculations.effectiveSlotLevel = effectiveSlotLevel;
    effectiveCalculations.metamagic = selections.map((selection) => ({
      name: selection.name,
      options: clone(selection.options || {}),
    }));
    effectiveSpell.metamagic = effectiveCalculations.metamagic;
    return {
      spell: effectiveSpell,
      calculations: effectiveCalculations,
      selections: effectiveCalculations.metamagic,
    };
  }

  function mergeRider(effect, rider) {
    const merged = clone(effect) || {};
    MECHANIC_ARRAYS.forEach((key) => {
      if (key === "damageRolls") return;
      merged[key] = [
        ...(Array.isArray(merged[key]) ? merged[key] : []),
        ...(Array.isArray(rider[key]) ? rider[key] : []),
      ];
    });
    return merged;
  }

  async function resolveTargetEffect(
    effect = {},
    { targetName = "the target", saveResults = null } = {},
  ) {
    if (effect.metamagicSave && root?.PFMetamagicPicker?.confirmSave) {
      const saveKey = effect.metamagicSave.group || "";
      const cached = saveKey && saveResults?.has(saveKey)
        ? saveResults.get(saveKey)
        : undefined;
      const applies = cached !== undefined
        ? cached
        : await root.PFMetamagicPicker.confirmSave({
            ...effect.metamagicSave,
            featName: effect.metamagicName || effect.name,
            targetName,
          });
      if (saveKey && saveResults && cached === undefined)
        saveResults.set(saveKey, applies);
      if (applies === null) return null;
      if (!applies && !effect.metamagicSave.passedDurationMultiplier)
        return false;
      effect = clone(effect);
      if (!applies) {
        const multiplier = number(
          effect.metamagicSave.passedDurationMultiplier,
          1,
        );
        if (Number.isFinite(Number(effect.durationConfig?.count))) {
          effect.durationConfig.count = Math.max(
            1,
            Math.floor(Number(effect.durationConfig.count) * multiplier),
          );
        }
      }
      delete effect.metamagicSave;
    }
    const riders = Array.isArray(effect.metamagicRiders) ? effect.metamagicRiders : [];
    let resolved = clone(effect) || {};
    delete resolved.metamagicRiders;
    for (const rider of riders) {
      let applies = true;
      if (rider.metamagicSave && root?.PFMetamagicPicker?.confirmSave) {
        applies = await root.PFMetamagicPicker.confirmSave({
          ...rider.metamagicSave,
          featName: rider.metamagicName || rider.name,
          targetName,
        });
        if (applies === null) return null;
      }
      if (applies) resolved = mergeRider(resolved, rider);
    }
    return resolved;
  }

  async function resolveTargetEffects(effect = {}, options = {}) {
    const riders = Array.isArray(effect.metamagicRiders)
      ? effect.metamagicRiders
      : [];
    if (!riders.length) {
      const resolved = await resolveTargetEffect(effect, options);
      return resolved === null ? null : resolved ? [resolved] : [];
    }
    const base = clone(effect) || {};
    delete base.metamagicRiders;
    const results = [base];
    const saveResults = options.saveResults || new Map();
    for (const rider of riders) {
      const resolved = await resolveTargetEffect(rider, {
        ...options,
        saveResults,
      });
      if (resolved === null) return null;
      if (resolved) results.push(resolved);
    }
    return results;
  }

  function decorateQuickEffect(effect = {}, spell = {}) {
    const mechanics = normalizeMechanics(
      clone(spell.activeMechanics || spell) || {},
    );
    const next = { ...clone(effect), metamagic: clone(spell.metamagic || []) };
    MECHANIC_ARRAYS.forEach((key) => {
      next[key] = clone(mechanics[key] || []);
    });
    next.bonuses = clone(mechanics.effects || mechanics.bonuses || []);
    next.metamagicRiders = clone(mechanics.metamagicRiders || []);
    next.auraConfig = clone(mechanics.auraConfig || next.auraConfig || null);
    next.durationConfig = clone(mechanics.durationConfig || next.durationConfig || null);
    next.metamagicDurationMultiplier = mechanics.metamagicDurationMultiplier || 1;
    return next;
  }

  return {
    loadDefinitions,
    loadConditions,
    ready,
    apply,
    resolveTargetEffect,
    resolveTargetEffects,
    decorateQuickEffect,
    mechanicArrays: () => [...MECHANIC_ARRAYS],
  };
});
