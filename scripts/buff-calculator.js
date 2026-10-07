(function () {
  function abilityMod(score) {
    return Math.floor((Number(score) - 10) / 2);
  }

  function fmt(value) {
    return value >= 0 ? `+${value}` : String(value);
  }

  function normalizeStat(stat) {
    const key = String(stat || "")
      .toLowerCase()
      .trim();
    const aliases = {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
      fort: "fortitude",
      ac: "ac",
      "remove dex bonus to ac": "remove dex bonus to ac",
      "remove dexterity bonus to ac": "remove dex bonus to ac",
      "deny dex bonus to ac": "remove dex bonus to ac",
      "deny dexterity bonus to ac": "remove dex bonus to ac",
      "cannot gain luck bonuses": "cannot gain luck bonuses",
      "can't gain luck bonuses": "cannot gain luck bonuses",
      "cant gain luck bonuses": "cannot gain luck bonuses",
      "remove luck bonuses": "cannot gain luck bonuses",
      "suppress luck bonuses": "cannot gain luck bonuses",
      "no luck bonuses": "cannot gain luck bonuses",
      "cannot gain morale bonuses": "cannot gain morale bonuses",
      "can't gain morale bonuses": "cannot gain morale bonuses",
      "cant gain morale bonuses": "cannot gain morale bonuses",
      "remove morale bonuses": "cannot gain morale bonuses",
      "suppress morale bonuses": "cannot gain morale bonuses",
      "no morale bonuses": "cannot gain morale bonuses",
      "str skill checks": "strength skill checks",
      "dex skill checks": "dexterity skill checks",
      "con skill checks": "constitution skill checks",
      "int skill checks": "intelligence skill checks",
      "wis skill checks": "wisdom skill checks",
      "cha skill checks": "charisma skill checks",
      "str skills": "strength skill checks",
      "dex skills": "dexterity skill checks",
      "con skills": "constitution skill checks",
      "int skills": "intelligence skill checks",
      "wis skills": "wisdom skill checks",
      "cha skills": "charisma skill checks",
      "craft skills": "craft skill checks",
      "craft checks": "craft skill checks",
      "skill:craft": "craft skill checks",
      "profession skills": "profession skill checks",
      "profession checks": "profession skill checks",
      "skill:profession": "profession skill checks",
      "perform skills": "perform skill checks",
      "perform checks": "perform skill checks",
      "skill:perform": "perform skill checks",
      "class skills": "class skill checks",
      "class skill": "class skill checks",
      "class-skill checks": "class skill checks",
      "class skill checks": "class skill checks",
      "class knowledge skills": "class knowledge skill checks",
      "class knowledge skill": "class knowledge skill checks",
      "class knowledge checks": "class knowledge skill checks",
      "class knowledge skill checks": "class knowledge skill checks",
      "knowledge skills": "knowledge skill checks",
      "knowledge skill": "knowledge skill checks",
      "knowledge checks": "knowledge skill checks",
      "knowledge skill checks": "knowledge skill checks",
      "trained skills": "trained skill checks",
      "trained skill": "trained skill checks",
      "trained checks": "trained skill checks",
      "trained-only skills": "trained skill checks",
      "untrained skills": "untrained skill checks",
      "untrained skill": "untrained skill checks",
      "untrained checks": "untrained skill checks",
      "extra attacks": "extra attack",
      "extra attack at highest bab": "extra attack",
      "extra attacks at highest bab": "extra attack",
      "all saving throws": "all saves",
    };
    return aliases[key] || key;
  }

  // "All Saves" isn't its own running total -- it's shorthand so one
  // effect (e.g. a paladin aura, resistance spell) can add the same
  // bonus to Fortitude, Reflex, and Will at once instead of being
  // authored three times. Expanded to those three stats below, at the
  // point bonuses get bucketed, so the rest of the calc never needs to
  // know "all saves" exists.
  const ALL_SAVES_STATS = ["fortitude", "reflex", "will"];

  function skillStatKey(skillName) {
    return `skill:${String(skillName || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function expandedStatsForBonus(rawBonus) {
    const stat = normalizeStat(rawBonus.stat);
    if (stat === "all saves") return ALL_SAVES_STATS;
    if (!stat.startsWith("skill-list:")) return [stat];
    const items = Array.isArray(rawBonus.skillList?.items)
      ? rawBonus.skillList.items
      : [];
    if (items.length) {
      return items
        .map((item) => item?.value || item?.stat || item?.key || "")
        .map(normalizeStat)
        .filter(Boolean);
    }
    const skills = Array.isArray(rawBonus.skillList?.skills)
      ? rawBonus.skillList.skills
      : [];
    if (!skills.length) return [stat];
    return skills.map((skill) => skillFamilyStatKey(skill) || skillStatKey(skill));
  }

  function skillFamilyStatKey(skill) {
    const text = String(skill || "").trim();
    if (/^craft$/i.test(text)) return "craft skill checks";
    if (/^profession$/i.test(text)) return "profession skill checks";
    if (/^perform$/i.test(text)) return "perform skill checks";
    return "";
  }

  function stacksByType(type) {
    return type === "untyped" || type === "dodge" || type === "circumstance";
  }

  const ABILITY_REQUIREMENT_ALIASES = {
    str: "strength",
    strength: "strength",
    dex: "dexterity",
    dexterity: "dexterity",
    con: "constitution",
    constitution: "constitution",
    int: "intelligence",
    intelligence: "intelligence",
    wis: "wisdom",
    wisdom: "wisdom",
    cha: "charisma",
    charisma: "charisma",
  };

  const ABILITY_REQUIREMENT_LABELS = {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA",
  };

  const BONUS_SUPPRESSION_STATS = {
    "cannot gain luck bonuses": "luck",
    "cannot gain morale bonuses": "morale",
  };

  function normalizeBonusType(type) {
    return String(type || "untyped")
      .toLowerCase()
      .trim();
  }

  function bonusTypeSuppressionSourceText(suppressors = []) {
    return suppressors
      .map((bonus) => bonus.source)
      .filter(Boolean)
      .join(", ");
  }

  function activeBonusTypeSuppressions(buffMap = {}, abilityScores = {}) {
    const suppressed = new Map();
    Object.entries(BONUS_SUPPRESSION_STATS).forEach(([stat, type]) => {
      const activeSuppressors = (buffMap[stat] || []).filter(
        (bonus) =>
          !bonus.conditional &&
          bonusMeetsAttributeRequirement(bonus, abilityScores),
      );
      if (activeSuppressors.length) suppressed.set(type, activeSuppressors);
    });
    return suppressed;
  }

  function conditionalBonusTypeSuppressions(buffMap = {}, abilityScores = {}) {
    const suppressed = new Map();
    Object.entries(BONUS_SUPPRESSION_STATS).forEach(([stat, type]) => {
      const conditionalSuppressors = (buffMap[stat] || []).filter(
        (bonus) =>
          bonus.conditional &&
          bonusMeetsAttributeRequirement(bonus, abilityScores),
      );
      if (conditionalSuppressors.length)
        suppressed.set(type, conditionalSuppressors);
    });
    return suppressed;
  }

  function isBonusSuppressionStat(stat) {
    return Boolean(BONUS_SUPPRESSION_STATS[normalizeStat(stat)]);
  }

  function normalizeAttributeRequirement(rawBonus = {}) {
    const source =
      rawBonus.attributeRequirement ||
      rawBonus.attributeScoreRequirement ||
      rawBonus.abilityRequirement ||
      rawBonus.requirement?.attributeRequirement ||
      rawBonus.requirements?.attributeRequirement ||
      {};
    const rawAttribute = String(
      source.attribute ||
        source.ability ||
        rawBonus.requiredAttribute ||
        rawBonus.requiredAbility ||
        rawBonus.attributeRequirementAbility ||
        "",
    )
      .trim()
      .toLowerCase();
    const attribute = ABILITY_REQUIREMENT_ALIASES[rawAttribute] || "";
    const score = Number(
      source.score ??
        source.minimumScore ??
        source.minimumAbilityScore ??
        rawBonus.requiredScore ??
        rawBonus.minimumScore ??
        "",
    );
    return {
      attribute,
      score: Number.isFinite(score) && score > 0 ? Math.floor(score) : 0,
    };
  }

  function attributeRequirementText(rawBonus = {}) {
    const requirement = normalizeAttributeRequirement(rawBonus);
    if (!requirement.attribute || !requirement.score) return "";
    return `requires ${ABILITY_REQUIREMENT_LABELS[requirement.attribute]} ${requirement.score}`;
  }

  function bonusMeetsAttributeRequirement(rawBonus = {}, abilityScores = {}) {
    const requirement = normalizeAttributeRequirement(rawBonus);
    if (!requirement.attribute || !requirement.score) return true;
    const score = Number(abilityScores[requirement.attribute] || 0);
    return Number.isFinite(score) && score >= requirement.score;
  }

  function normalizeFavoredEnemyTarget(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/\{[^{}]+\}/g, "")
      .replace(/\s*\([+-]?\d+\)\s*$/g, "")
      .replace(/\b(against|versus|vs\.?|creatures?|enemy|enemies|type|subtype)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function favoredEnemyTargetKey(value = "") {
    return normalizeFavoredEnemyTarget(value).replace(/\s+/g, "");
  }

  function conditionalChoiceValue(choices = {}, key = "favored enemy") {
    const wanted = String(key || "")
      .toLowerCase()
      .trim();
    const entry = Object.entries(choices || {}).find(
      ([choiceKey]) => String(choiceKey || "").toLowerCase().trim() === wanted,
    )?.[1];
    if (!entry) return "";
    return entry.label || entry.name || entry.value || "";
  }

  function favoredEnemyConditionalChoice(rawBonus = {}, buff = {}) {
    return (
      conditionalChoiceValue(rawBonus.conditionalChoices, "favored enemy") ||
      conditionalChoiceValue(rawBonus.conditionalChoices, "favored enemy increase") ||
      conditionalChoiceValue(buff.conditionalChoices, "favored enemy") ||
      conditionalChoiceValue(buff.conditionalChoices, "favored enemy increase")
    );
  }

  function bonusFavoredEnemyTarget(rawBonus = {}, buff = {}) {
    return (
      rawBonus.favoredEnemyTarget ||
      rawBonus.targetFavoredEnemy ||
      rawBonus.target ||
      favoredEnemyConditionalChoice(rawBonus, buff) ||
      rawBonus.appliesWhen ||
      buff.appliesWhen ||
      ""
    );
  }

  function scaleUsesFavoredEnemyBonus(rawBonus = {}) {
    const source = (rawBonus.bonusScale || rawBonus.scale || {}).source || {};
    return (
      source.type === "special" && source.special === "favored-enemy-bonus"
    );
  }

  function isFavoredEnemyBonus(rawBonus = {}, buff = {}) {
    if (rawBonus.favoredEnemyBonus || rawBonus.favoredEnemy) return true;
    const sourceText = [
      rawBonus.source,
      rawBonus.name,
      buff.source,
      buff.name,
      buff.category,
    ]
      .filter(Boolean)
      .join(" ");
    return /\bfavou?red\s+enemy\b/i.test(sourceText);
  }

  function isFavoredEnemyBonusAmountRow(rawBonus = {}, buff = {}) {
    if (!isFavoredEnemyBonus(rawBonus, buff)) return false;
    const stat = normalizeStat(rawBonus.stat);
    return stat === "attack";
  }

  function favoredEnemyConditionalMergeKey(rawBonus = {}) {
    return [
      normalizeStat(rawBonus.stat),
      normalizeBonusType(rawBonus.type),
      normalizeFavoredEnemyTarget(
        rawBonus.favoredEnemyTarget ||
          rawBonus.targetFavoredEnemy ||
          rawBonus.appliesWhen ||
          rawBonus.conditionalReason ||
          "",
      ),
    ].join("|");
  }

  function mergeFavoredEnemyConditionalBonuses(bonuses = []) {
    const merged = [];
    const byKey = new Map();
    bonuses.forEach((bonus) => {
      if (!isFavoredEnemyBonus(bonus)) {
        merged.push(bonus);
        return;
      }
      const key = favoredEnemyConditionalMergeKey(bonus);
      const existing = byKey.get(key);
      if (!existing) {
        const next = {
          ...bonus,
          value: Number(bonus.value || 0),
          source: "Favored Enemy",
          favoredEnemyBonus: true,
          mergedSources: [bonus.source].filter(Boolean),
        };
        byKey.set(key, next);
        merged.push(next);
        return;
      }
      existing.value += Number(bonus.value || 0);
      if (bonus.source && !existing.mergedSources.includes(bonus.source)) {
        existing.mergedSources.push(bonus.source);
      }
    });
    return merged;
  }

  function conditionalBonusAgainstActiveBonus(bonus, usedBonuses = []) {
    const type = normalizeBonusType(bonus.type);
    const value = Number(bonus.value || 0);
    const conditionalReason =
      bonus.appliesWhen || bonus.conditionalReason || "conditional";

    if (stacksByType(type) || bonus.stacks || value <= 0) {
      return {
        ...bonus,
        conditionalReason,
      };
    }

    const activeBonus = usedBonuses.find(
      (candidate) =>
        normalizeBonusType(candidate.type) === type &&
        !stacksByType(type) &&
        !candidate.stacks &&
        Number(candidate.value || 0) > 0,
    );
    if (!activeBonus) {
      return {
        ...bonus,
        conditionalReason,
      };
    }

    const activeValue = Number(activeBonus.value || 0);
    const difference = Math.max(0, value - activeValue);
    const activeSource = activeBonus.source || "active effect";
    const existingDetail = String(bonus.detail || "").trim();
    const reasonDetail = String(conditionalReason || "").trim();
    const context = [...new Set([reasonDetail, existingDetail].filter(Boolean))];
    const stackingDetail =
      difference > 0
        ? `${type} bonus ${fmt(value)} replaces ${activeSource} ${fmt(activeValue)}; only the ${fmt(difference)} difference applies`
        : `${type} bonus ${fmt(value)} is overwritten by ${activeSource} ${fmt(activeValue)}`;

    return {
      ...bonus,
      value: difference,
      originalValue: value,
      overwritten: difference === 0,
      partiallyOverwritten: difference > 0,
      overwrittenBy: activeSource,
      overwrittenValue: activeValue,
      conditionalReason,
      detail: [...context, stackingDetail].join("; "),
    };
  }

  function favoredEnemyBonusScaleValue(scale = {}, buff = {}, context = {}) {
    const rawBonus = context.rawBonus || {};
    const activeBuffs = Array.isArray(context.activeBuffs)
      ? context.activeBuffs
      : [];
    const requested =
      scale.target ||
      scale.favoredEnemyTarget ||
      bonusFavoredEnemyTarget(rawBonus, buff);
    const requestedKey = favoredEnemyTargetKey(requested);
    let total = 0;

    activeBuffs.forEach((candidateBuff) => {
      (candidateBuff.bonuses || []).forEach((candidateBonus) => {
        if (!isFavoredEnemyBonusAmountRow(candidateBonus, candidateBuff)) return;
        if (scaleUsesFavoredEnemyBonus(candidateBonus)) return;
        if (hasUnresolvedConditionalTokens(candidateBonus)) return;
        const candidateTargetKey = favoredEnemyTargetKey(
          bonusFavoredEnemyTarget(candidateBonus, candidateBuff),
        );
        if (
          requestedKey &&
          candidateTargetKey &&
          requestedKey !== candidateTargetKey
        )
          return;
        const value = scaledBonusValue(candidateBonus, candidateBuff, {
          ...context,
          resolvingFavoredEnemyBonus: true,
        });
        if (Number.isFinite(value)) total += Number(value || 0);
      });
    });

    return total;
  }

  function applyBonuses(bonuses, options = {}) {
    let total = 0;
    const used = [];
    const ignored = [];
    const conditional = [];
    const grouped = {};
    const suppressedBonusTypes =
      options.suppressedBonusTypes instanceof Map
        ? options.suppressedBonusTypes
        : new Map();
    const conditionalSuppressedBonusTypes =
      options.conditionalSuppressedBonusTypes instanceof Map
        ? options.conditionalSuppressedBonusTypes
        : new Map();
    const eligibleBonuses = [];

    (bonuses || []).forEach((bonus) => {
      if (
        !options.ignoreAttributeRequirements &&
        !bonusMeetsAttributeRequirement(bonus, options.abilityScores || {})
      ) {
        ignored.push({
          ...bonus,
          ignoredReason: attributeRequirementText(bonus),
        });
        return;
      }
      const type = normalizeBonusType(bonus.type);
      const suppressors = suppressedBonusTypes.get(type);
      if (suppressors?.length && Number(bonus.value || 0) > 0) {
        const sourceText = bonusTypeSuppressionSourceText(suppressors);
        ignored.push({
          ...bonus,
          ignoredReason: `${type} bonus is blocked${sourceText ? ` by ${sourceText}` : ""}`,
        });
        return;
      }
      eligibleBonuses.push(bonus);
    });

    eligibleBonuses
      .filter((bonus) => !bonus.conditional)
      .forEach((bonus) => {
        const type = normalizeBonusType(bonus.type);
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(bonus);
      });

    Object.entries(grouped).forEach(([type, typedBonuses]) => {
      const stacking = typedBonuses.filter(
        (b) => stacksByType(type) || b.stacks || b.value < 0,
      );
      const nonStacking = typedBonuses.filter(
        (b) => !stacksByType(type) && !b.stacks && b.value >= 0,
      );

      stacking.forEach((b) => {
        total += Number(b.value || 0);
        used.push(b);
      });

      if (nonStacking.length) {
        const best = nonStacking.reduce((a, b) =>
          Number(a.value) >= Number(b.value) ? a : b,
        );
        total += Number(best.value || 0);
        used.push(best);
        nonStacking
          .filter((b) => b !== best)
          .forEach((b) =>
            ignored.push({
              ...b,
              ignoredReason: `${type} bonus is superseded by ${best.source}`,
            }),
          );
      }
    });

    mergeFavoredEnemyConditionalBonuses(
      eligibleBonuses.filter((bonus) => bonus.conditional),
    ).forEach((bonus) => {
      conditional.push(conditionalBonusAgainstActiveBonus(bonus, used));
    });

    conditionalSuppressedBonusTypes.forEach((suppressors, type) => {
      const suppressibleValue = used
        .filter(
          (bonus) =>
            normalizeBonusType(bonus.type) === type &&
            Number(bonus.value || 0) > 0,
        )
        .reduce((sum, bonus) => sum + Number(bonus.value || 0), 0);
      if (suppressibleValue <= 0) return;
      suppressors.forEach((suppressor) => {
        const sourceText = used
          .filter(
            (bonus) =>
              normalizeBonusType(bonus.type) === type &&
              Number(bonus.value || 0) > 0,
          )
          .map((bonus) => bonus.source)
          .filter(Boolean)
          .join(", ");
        conditional.push({
          ...suppressor,
          value: -suppressibleValue,
          type,
          appliesWhen:
            suppressor.appliesWhen ||
            suppressor.conditionalReason ||
            "conditional",
          detail: sourceText ? `without ${sourceText}` : "",
          conditionalReason:
            suppressor.appliesWhen ||
            suppressor.conditionalReason ||
            "conditional",
        });
      });
    });

    return { total, used, ignored, conditional };
  }

  function normalizeWeaponTypeRestriction(value = "all") {
    if (window.PFEffectStats?.normalizeWeaponTypeRestriction) {
      return window.PFEffectStats.normalizeWeaponTypeRestriction(value);
    }
    const key = String(value || "all")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const aliases = {
      all: "all",
      "melee-weapon-light": "melee-light",
      "melee-weapon-one-handed": "melee-one-handed",
      "melee-weapon-two-handed": "melee-two-handed",
      "ranged-weapon": "ranged",
      natural: "natural",
      "natural-weapon": "natural",
    };
    return aliases[key] || key;
  }

  function hasSpecificWeaponRestriction(bonus = {}) {
    return (
      (bonus.weaponTypeRestriction &&
        normalizeWeaponTypeRestriction(bonus.weaponTypeRestriction) !== "all") ||
      (bonus.weaponNameRestriction &&
        String(bonus.weaponNameRestriction).toLowerCase() !== "all")
    );
  }

  function weaponRestrictionMatches(
    bonus = {},
    weaponType = "",
    weaponName = "",
  ) {
    if (!hasSpecificWeaponRestriction(bonus)) return true;
    const nameMatches = window.PFEffectStats?.weaponNameRestrictionMatches
      ? window.PFEffectStats.weaponNameRestrictionMatches(
          bonus.weaponNameRestriction || "all", weaponName,
        )
      : !bonus.weaponNameRestriction ||
        String(bonus.weaponNameRestriction).toLowerCase() === "all" ||
        normalizeWeaponTypeRestriction(bonus.weaponNameRestriction) ===
          normalizeWeaponTypeRestriction(weaponName);
    if (!nameMatches) return false;
    if (window.PFEffectStats?.weaponTypeRestrictionMatches) {
      return window.PFEffectStats.weaponTypeRestrictionMatches(
        bonus.weaponTypeRestriction,
        weaponType,
        weaponName,
      );
    }
    if (
      normalizeWeaponTypeRestriction(bonus.weaponTypeRestriction) ===
      "unarmed-strike"
    ) {
      return normalizeWeaponTypeRestriction(weaponName) === "unarmed-strike";
    }
    return (
      normalizeWeaponTypeRestriction(bonus.weaponTypeRestriction) ===
      normalizeWeaponTypeRestriction(weaponType)
    );
  }

  function scaleLevelValue(scale, buff, context = {}) {
    const source = scale?.source || { type: "caster" };
    if (source.type === "character")
      return Math.max(
        1,
        Number(buff.characterLevel || buff.level || buff.casterLevel || 1) || 1,
      );
    if (source.type === "class") {
      const classLevels = buff.classLevels || {};
      return Math.max(
        1,
        Number(
          classLevels[source.className] ||
            buff.classLevel ||
            buff.casterLevel ||
            1,
        ) || 1,
      );
    }
    if (source.type === "special") {
      if (source.special === "favored-enemy-bonus")
        return favoredEnemyBonusScaleValue(scale, buff, context);
      return 0;
    }
    return Math.max(1, Number(buff.casterLevel || 1) || 1);
  }

  const SCALE_ABILITY_ALIASES = {
    str: "strength",
    strength: "strength",
    dex: "dexterity",
    dexterity: "dexterity",
    con: "constitution",
    constitution: "constitution",
    int: "intelligence",
    intelligence: "intelligence",
    wis: "wisdom",
    wisdom: "wisdom",
    cha: "charisma",
    charisma: "charisma",
  };
  const SCALE_ABILITY_BASELINE_KEYS = {
    strength: "str",
    dexterity: "dex",
    constitution: "con",
    intelligence: "int",
    wisdom: "wis",
    charisma: "cha",
  };

  function scaleAttributeBonuses(scale = {}) {
    if (Array.isArray(scale.attributeBonuses)) return scale.attributeBonuses;
    if (scale.attributeBonus) return [scale.attributeBonus];
    return [];
  }

  function scaleAttributeModifier(entry = {}, context = {}) {
    if (entry.resolvedModifier !== undefined)
      return Number(entry.resolvedModifier || 0);
    const raw = String(entry.ability || entry.attribute || "").toLowerCase();
    const ability = SCALE_ABILITY_ALIASES[raw];
    if (!ability) return 0;
    const shortKey = SCALE_ABILITY_BASELINE_KEYS[ability];
    const explicitModifier =
      context.abilityMods?.[ability] ?? context.abilityMods?.[shortKey];
    if (explicitModifier !== undefined) return Number(explicitModifier || 0);
    const score =
      context.abilityScores?.[ability] ??
      context.abilityScores?.[shortKey] ??
      context.baseline?.[shortKey] ??
      10;
    return abilityMod(Number(score || 0));
  }

  function skillRankKeyForStat(stat = "") {
    const normalized = normalizeStat(stat);
    if (normalized.startsWith("skill:")) return normalized;
    if (normalized === "craft skill checks") return "skill:craft";
    if (normalized === "profession skill checks") return "skill:profession";
    if (normalized === "perform skill checks") return "skill:perform";
    return "";
  }

  function skillRanksForBonus(rawBonus = {}, context = {}) {
    const rankKey = skillRankKeyForStat(context.targetStat || rawBonus.stat);
    if (!rankKey) return 0;
    const ranks = context.skillRanks || context.baseline?.skillRanks || {};
    const direct = Number(ranks[rankKey] || 0);
    if (direct) return direct;
    const compact = rankKey.slice("skill:".length).replace(/[^a-z0-9]/g, "");
    return Number(ranks[`skill:${compact}`] || 0);
  }

  function scaledBonusValue(rawBonus, buff, context = {}) {
    const scale = rawBonus.bonusScale || rawBonus.scale;
    const baseValue = Number(rawBonus.value || 0);
    const maximumRaw = rawBonus.maximum ?? rawBonus.max;
    const maximum =
      maximumRaw === null || maximumRaw === undefined || maximumRaw === ""
        ? null
        : Number(maximumRaw);
    const cap = (value) =>
      Number.isFinite(maximum) ? Math.min(Number(value || 0), maximum) : value;
    if (!scale) return cap(baseValue);
    const level = scaleLevelValue(scale, buff || {}, {
      ...context,
      rawBonus,
    });

    // "DR /lawful equal to 1/2 barbarian level," "+1 per 3 caster
    // levels," etc. -- a straight fraction of the level, not a flat
    // value with milestone bumps. PF1e always rounds this down, so
    // this stays integer division throughout (never a float
    // multiplier) to avoid the classic 9 * (1/3) = 2.999... trap.
    const multiplier = scale.levelMultiplier;
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    const every = scale.every || {};
    const hasMilestones = milestones.some(
      (milestone) =>
        Number(milestone.level || 0) > 0 || Number(milestone.value || 0) !== 0,
    );
    const hasEvery =
      Number(every.fromLevel || every.afterLevel || every.after || 0) > 0 ||
      Number(every.everyLevels || every.every || 0) > 0 ||
      Number(every.increase || 0) !== 0;
    const attributeBonuses = scaleAttributeBonuses(scale);
    const skillRankThresholds = Array.isArray(scale.skillRankThresholds)
      ? scale.skillRankThresholds
      : [];
    const hasSkillRankThresholds = skillRankThresholds.some(
      (threshold) =>
        Number(threshold.ranks ?? threshold.rank ?? 0) > 0 &&
        Number.isFinite(Number(threshold.value || 0)),
    );
    const multiplierNumerator = Number(multiplier?.numerator || 0);
    const multiplierDenominator = Number(multiplier?.denominator || 0);
    const hasLevelMultiplier =
      multiplierDenominator > 0 &&
      !(
        multiplierNumerator === 1 &&
        multiplierDenominator === 1 &&
        (hasMilestones || hasEvery || hasSkillRankThresholds)
      );
    let value =
      hasLevelMultiplier
        ? baseValue +
          Math.floor(
            (level * multiplierNumerator) / multiplierDenominator,
          )
        : scale.source &&
            !baseValue &&
            !attributeBonuses.length &&
            !hasMilestones &&
            !hasEvery &&
            !hasSkillRankThresholds
          ? level
          : baseValue;

    milestones
      .map((milestone) => ({
        level: Number(milestone.level || 0),
        value: Number(milestone.value || 0),
      }))
      .filter((milestone) => milestone.level > 0 && milestone.level <= level)
      .sort((a, b) => a.level - b.level)
      .forEach((milestone) => {
        value = milestone.value;
      });

    const skillRanks = skillRanksForBonus(rawBonus, context);
    skillRankThresholds
      .map((threshold) => ({
        ranks: Number(threshold.ranks ?? threshold.rank ?? 0),
        value: Number(threshold.value || 0),
      }))
      .filter(
        (threshold) =>
          threshold.ranks > 0 &&
          threshold.ranks <= skillRanks &&
          Number.isFinite(threshold.value),
      )
      .sort((a, b) => a.ranks - b.ranks)
      .forEach((threshold) => {
        value = threshold.value;
      });

    const fromLevel = Number(
      every.fromLevel || every.afterLevel || every.after || 0,
    );
    const everyLevels = Number(every.everyLevels || every.every || 0);
    const increase = Number(every.increase || 0);
    if (fromLevel > 0 && everyLevels > 0 && increase) {
      value +=
        level >= fromLevel
          ? (Math.floor((level - fromLevel) / everyLevels) + 1) * increase
          : 0;
    }

    value += attributeBonuses.reduce((sum, entry) => {
      const numerator = Math.max(1, Number(entry.numerator ?? 1) || 1);
      const denominator = Math.max(1, Number(entry.denominator ?? 1) || 1);
      return (
        sum +
        Math.floor(
          (scaleAttributeModifier(entry, context) * numerator) / denominator,
        )
      );
    }, 0);

    // "... minimum +1" is common PF1e phrasing on fractional scaling (DR
    // 1/2 level, minimum 1, etc.) -- round-down math above can floor a
    // low level's share to 0, so this floor is applied last, after
    // milestones/every have already had their say.
    if (scale.minimumOne && value < 1) value = 1;

    return cap(value);
  }

  function describeBonuses(bonuses) {
    if (!bonuses.length) return "no active buff modifiers";
    return bonuses
      .map(
        (b) =>
          `${b.source} ${fmt(Number(b.value || 0))} ${b.type || "untyped"}`,
      )
      .join(", ");
  }

  function hasUnresolvedConditionalTokens(rawBonus = {}) {
    return [rawBonus.appliesWhen, rawBonus.favoredEnemyTarget]
      .filter(Boolean)
      .some((value) => /\{[^{}]+\}/.test(String(value)));
  }

  function normalizedSpellTargetMode(entry = {}) {
    const raw = String(
      entry.targetMode || entry.chooseBy || entry.by || entry.mode || "all",
    )
      .trim()
      .toLowerCase();
    const aliases = {
      all: "all",
      class: "class",
      classes: "class",
      domain: "domain",
      domains: "domain",
      school: "school",
      schools: "school",
      subschool: "subschool",
      subschools: "subschool",
      "school with subschool": "subschool",
      descriptor: "descriptor",
      descriptors: "descriptor",
      "type of magic": "magicType",
      magictype: "magicType",
      magic: "magicType",
      spell: "spell",
      spells: "spell",
      name: "spell",
      names: "spell",
    };
    return aliases[raw] || "all";
  }

  function normalizedSpellTargetValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function normalizedDomainTargetValue(value) {
    return normalizedSpellTargetValue(value)
      .replace(/\s+(?:subdomain|domain)$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizedBloodlineTargetValue(value) {
    return normalizedSpellTargetValue(value)
      .replace(/\s+bloodline$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function spellAdjustmentBloodline(entry = {}) {
    return normalizedBloodlineTargetValue(
      entry.bloodlineId || entry.bloodline || entry.bloodlineName || "any",
    );
  }

  function normalizedSubschoolTargetValue(value) {
    const key = normalizedSpellTargetValue(value);
    const parenthetical = /^([^()]+)\(([^()]+)\)$/.exec(key);
    if (parenthetical)
      return `${parenthetical[1].trim()}:${parenthetical[2].trim()}`;
    return key.replace(/\s*:\s*/g, ":");
  }

  function normalizedSpellName(value) {
    return normalizedSpellTargetValue(value).replace(/[^a-z0-9]+/g, "");
  }

  function listFromValue(value) {
    if (Array.isArray(value))
      return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    return String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function spellAdjustmentTargets(entry = {}) {
    return listFromValue(
      entry.targets ||
        entry.values ||
        entry.names ||
        entry.spellNames ||
        entry.classes ||
        entry.schools ||
        entry.subschools ||
        entry.descriptors ||
        entry.magicTypes ||
        entry.target ||
        "",
    );
  }

  function spellAdjustmentChooseOnApply(entry = {}) {
    return Boolean(
      entry.chooseOnApply ||
        entry.pickOne ||
        entry.pickWhenApplied ||
        entry.choice ||
        entry.choose,
    );
  }

  function normalizedSpellAdjustmentSource(value = "strict-spells") {
    const raw = String(value || "strict-spells")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    const aliases = {
      all: "all",
      any: "all",
      everything: "all",
      strictspell: "strict-spells",
      strictspells: "strict-spells",
      spell: "strict-spells",
      spells: "strict-spells",
      castspell: "strict-spells",
      castspells: "strict-spells",
      spelllikeability: "spell-like-abilities",
      spelllikeabilities: "spell-like-abilities",
      spelllike: "spell-like-abilities",
      sla: "spell-like-abilities",
      slas: "spell-like-abilities",
      extract: "extracts",
      extracts: "extracts",
      formula: "extracts",
      formulae: "extracts",
      draught: "draughts",
      draughts: "draughts",
      draft: "draughts",
      drafts: "draughts",
      classability: "class-abilities",
      classabilities: "class-abilities",
      classpower: "class-abilities",
      classpowers: "class-abilities",
      domainpower: "class-abilities",
      domainpowers: "class-abilities",
      bomb: "class-abilities",
      bombs: "class-abilities",
      alchemistbomb: "class-abilities",
      alchemistbombs: "class-abilities",
      talent: "class-abilities",
      talents: "class-abilities",
      wildtalent: "class-abilities",
      wildtalents: "class-abilities",
      kineticwildtalent: "class-abilities",
      kineticwildtalents: "class-abilities",
    };
    return (
      aliases[raw] ||
      ([
        "all",
        "strict-spells",
        "spell-like-abilities",
        "extracts",
        "draughts",
        "class-abilities",
      ].includes(value)
        ? value
        : "strict-spells")
    );
  }

  function spellAdjustmentSource(entry = {}) {
    return spellAdjustmentSources(entry)[0] || "strict-spells";
  }

  function spellAdjustmentSources(entry = {}) {
    const raw =
      entry.spellSources ||
      entry.appliesToSources ||
      entry.sourceKinds ||
      entry.appliesToKinds ||
      entry.spellSource ||
      entry.appliesToSource ||
      entry.appliesToKind ||
      entry.sourceKind ||
      entry.effectKind ||
      entry.spellKind ||
      "strict-spells";
    const sources = listFromValue(raw).map(normalizedSpellAdjustmentSource);
    const unique = [...new Set(sources.filter(Boolean))];
    if (unique.includes("all")) return ["all"];
    return unique.length ? unique : ["strict-spells"];
  }

  function spellContextSource(context = {}) {
    return normalizedSpellAdjustmentSource(
      context.spellSource ||
        context.appliesToSource ||
        context.sourceKind ||
        context.effectKind ||
        context.spellKind ||
        context.magicSource ||
        "strict-spells",
    );
  }

  function spellAdjustmentAppliesToSource(entry = {}, spellContext = {}) {
    const sources = spellAdjustmentSources(entry);
    return (
      sources.includes("all") ||
      sources.includes(spellContextSource(spellContext))
    );
  }

  function spellAdjustmentTargetFilters(entry = {}) {
    const rawFilters = Array.isArray(entry.targetFilters)
      ? entry.targetFilters
      : Array.isArray(entry.filters)
        ? entry.filters
        : [];
    const filters = rawFilters
      .map((filter) => ({
        targetMode: normalizedSpellTargetMode(filter),
        targets:
          normalizedSpellTargetMode(filter) === "all"
            ? []
            : spellAdjustmentTargets(filter),
        ...(spellAdjustmentChooseOnApply(filter) ? { chooseOnApply: true } : {}),
        ...(normalizedSpellTargetMode(filter) === "class" &&
        spellAdjustmentBloodline(filter) !== "any"
          ? { bloodline: spellAdjustmentBloodline(filter) }
          : {}),
      }))
      .filter(
        (filter) =>
          filter.targetMode === "all" ||
          filter.targets.length ||
          filter.chooseOnApply,
      );
    const specificFilters = filters.filter(
      (filter) => filter.targetMode !== "all",
    );
    if (specificFilters.length) return specificFilters;
    if (filters.length) return filters;
    const targetMode = normalizedSpellTargetMode(entry);
    return [
      {
        targetMode,
        targets: targetMode === "all" ? [] : spellAdjustmentTargets(entry),
        ...(spellAdjustmentChooseOnApply(entry) ? { chooseOnApply: true } : {}),
        ...(targetMode === "class" && spellAdjustmentBloodline(entry) !== "any"
          ? { bloodline: spellAdjustmentBloodline(entry) }
          : {}),
      },
    ];
  }

  function spellAdjustmentIncreases(entry = {}, isCasterLevel = false) {
    const raw = Array.isArray(entry.adjustments)
      ? entry.adjustments
      : Array.isArray(entry.increases)
        ? entry.increases
        : [];
    const increases = raw
      .map((increase) => ({
        ...increase,
        value: Number(increase.value ?? increase.amount ?? 0),
        type: increase.type || entry.type || "untyped",
        stacks: Boolean(increase.stacks ?? entry.stacks),
        conditional: Boolean(increase.conditional || entry.conditional),
        appliesWhen:
          increase.appliesWhen || entry.appliesWhen || "",
        ...(isCasterLevel
          ? {
              appliesTo:
                increase.appliesTo ||
                increase.applyTo ||
                increase.part ||
                entry.appliesTo ||
                entry.applyTo ||
                entry.part ||
                "spell",
            }
          : {}),
        ...(increase.bonusScale || increase.scale || entry.bonusScale || entry.scale
          ? {
              bonusScale:
                increase.bonusScale ||
                increase.scale ||
                entry.bonusScale ||
                entry.scale,
            }
          : {}),
      }))
      .filter((increase) => increase.value || increase.bonusScale);
    if (increases.length) return increases;
    return [
      {
        ...entry,
        value: Number(entry.value ?? entry.amount ?? 0),
        type: entry.type || "untyped",
        stacks: Boolean(entry.stacks),
        conditional: Boolean(entry.conditional),
        appliesWhen: entry.appliesWhen || "",
        ...(isCasterLevel
          ? { appliesTo: entry.appliesTo || entry.applyTo || entry.part || "spell" }
          : {}),
      },
    ].filter((increase) => increase.value || increase.bonusScale || increase.scale);
  }

  function spellContextValues(context = {}, fields = []) {
    return fields.flatMap((field) => {
      const value = context[field];
      if (value && typeof value === "object" && !Array.isArray(value))
        return listFromValue(value.name || value.spellName || "");
      return Array.isArray(value) ? value : listFromValue(value);
    });
  }

  function spellAdjustmentFilterMatches(entry = {}, spellContext = {}) {
    const mode = normalizedSpellTargetMode(entry);
    if (mode === "all") return true;
    if (spellAdjustmentChooseOnApply(entry)) return false;
    const targets = spellAdjustmentTargets(entry);
    if (!targets.length) return false;
    const targetKeys = targets.map(normalizedSpellTargetValue);
    if (mode === "spell") {
      const names = spellContextValues(spellContext, [
        "name",
        "spellName",
        "spell",
      ]).map(normalizedSpellName);
      const targetNames = targets.map(normalizedSpellName);
      return targetNames.some((target) => names.includes(target));
    }
    if (mode === "subschool") {
      const school = normalizedSpellTargetValue(spellContext.school);
      const subschools = spellContextValues(spellContext, [
        "subschool",
        "subschools",
      ]).map(normalizedSpellTargetValue);
      const contextPairs = subschools.flatMap((subschool) =>
        school ? [`${school}:${subschool}`, subschool] : [subschool],
      );
      return targets
        .map(normalizedSubschoolTargetValue)
        .some((target) => contextPairs.includes(target));
    }
    if (mode === "domain") {
      const matchingValues = spellContextValues(spellContext, [
        "matchingDomainIds",
        "matchingDomainNames",
      ]).map(normalizedDomainTargetValue);
      const characterValues = spellContextValues(spellContext, [
        "characterDomainIds",
        "characterDomains",
        "characterDomainNames",
      ]).map(normalizedDomainTargetValue);
      const spellValues = spellContextValues(spellContext, [
        "spellDomainIds",
        "spellDomains",
        "spellDomainNames",
      ]).map(normalizedDomainTargetValue);
      const values = matchingValues.length
        ? matchingValues
        : characterValues.length
          ? []
          : spellValues;
      return targets
        .map(normalizedDomainTargetValue)
        .some((target) => values.includes(target));
    }
    if (mode === "class") {
      const classes = spellContextValues(spellContext, [
        "className",
        "castingClass",
        "spellClass",
      ]).map(normalizedSpellTargetValue);
      if (!targetKeys.some((target) => classes.includes(target))) return false;
      const bloodline = spellAdjustmentBloodline(entry);
      if (!bloodline || bloodline === "any") return true;
      const characterBloodlines = spellContextValues(spellContext, [
        "bloodlineId",
        "bloodline",
        "bloodlineName",
        "classBloodlineId",
        "classBloodline",
        "classBloodlines",
      ]).map(normalizedBloodlineTargetValue);
      return characterBloodlines.includes(bloodline);
    }
    const fieldsByMode = {
      school: ["school"],
      descriptor: ["descriptor", "descriptors"],
      magicType: ["magicType", "magicTypes", "typeOfMagic"],
    };
    const values = spellContextValues(spellContext, fieldsByMode[mode] || []).map(
      normalizedSpellTargetValue,
    );
    return targetKeys.some((target) => values.includes(target));
  }

  function spellAdjustmentMatches(entry = {}, spellContext = {}) {
    const filters = spellAdjustmentTargetFilters(entry);
    if (!filters.length) return true;
    if (filters.every((filter) => filter.targetMode === "all")) return true;
    const matches = (filter) => spellAdjustmentFilterMatches(filter, spellContext);
    return filters.some(matches);
  }

  function normalizedCasterLevelPart(value = "spell") {
    const raw = String(value || "spell")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    const aliases = {
      spell: "spell",
      wholespell: "spell",
      all: "spell",
      duration: "duration",
      durationonly: "duration",
      range: "range",
      rangeonly: "range",
      effect: "effectScaling",
      effects: "effectScaling",
      effectscaling: "effectScaling",
      scaling: "effectScaling",
    };
    return aliases[raw] || "spell";
  }

  function casterLevelBonusAppliesToPart(entry = {}, part = "spell") {
    const rawAppliesTo =
      entry.appliesTo || entry.applyTo || entry.part || "spell";
    const appliesTo = Array.isArray(rawAppliesTo)
      ? rawAppliesTo.map(normalizedCasterLevelPart)
      : listFromValue(rawAppliesTo).map(normalizedCasterLevelPart);
    const targetPart = normalizedCasterLevelPart(part);
    return appliesTo.includes("spell") || appliesTo.includes(targetPart);
  }

  function collectSpellAdjustmentBonuses(
    activeBuffs = [],
    mechanicKey,
    spellContext = {},
    options = {},
  ) {
    const bonuses = [];
    const enrichedBuffs = (activeBuffs || []).map((buff) => ({
      ...buff,
      characterLevel:
        buff.characterLevel || options.characterLevel || spellContext.characterLevel,
      classLevel:
        buff.classLevel ||
        options.classLevel ||
        spellContext.classLevel ||
        spellContext.casterLevel,
      casterLevel:
        buff.casterLevel ||
        options.casterLevel ||
        spellContext.casterLevel ||
        spellContext.classLevel,
      classLevels: buff.classLevels || options.classLevels || spellContext.classLevels,
    }));
    enrichedBuffs.forEach((buff) => {
      (Array.isArray(buff[mechanicKey]) ? buff[mechanicKey] : []).forEach(
        (entry) => {
          if (hasUnresolvedConditionalTokens(entry)) return;
          if (!spellAdjustmentAppliesToSource(entry, spellContext)) return;
          if (!spellAdjustmentMatches(entry, spellContext)) return;
          const isCasterLevel = mechanicKey === "casterLevelBonuses";
          spellAdjustmentIncreases(entry, isCasterLevel).forEach((increase) => {
            if (hasUnresolvedConditionalTokens(increase)) return;
            if (isCasterLevel) {
              const part = options.part || spellContext.part || "spell";
              if (!casterLevelBonusAppliesToPart(increase, part)) return;
            }
            const value = scaledBonusValue(increase, buff, {
              ...options,
              activeBuffs: enrichedBuffs,
              spellContext,
            });
            if (!value && !(increase.bonusScale || increase.scale)) return;
            bonuses.push({
              ...entry,
              ...increase,
              value,
              type: increase.type || entry.type || "untyped",
              spellSource: spellAdjustmentSource(entry),
              source: buff.name || buff.source || "Effect",
              conditional: Boolean(entry.conditional || increase.conditional),
              appliesWhen:
                increase.appliesWhen ||
                entry.appliesWhen ||
                "",
            });
          });
        },
      );
    });
    return applyBonuses(bonuses, options);
  }

  function effectiveCasterLevel(
    baseClassLevel = 0,
    activeBuffs = [],
    spellContext = {},
    part = "spell",
    options = {},
  ) {
    const base = Number(baseClassLevel || spellContext.casterLevel || 0);
    const applied = collectSpellAdjustmentBonuses(
      activeBuffs,
      "casterLevelBonuses",
      { ...spellContext, casterLevel: base, part },
      { ...options, part },
    );
    return {
      base,
      total: base + applied.total,
      bonus: applied.total,
      used: applied.used,
      ignored: applied.ignored,
      conditional: applied.conditional,
    };
  }

  function baseSpellDc(castingAbilityMod = 0, spellLevel = 0) {
    return 10 + Number(spellLevel || 0) + Number(castingAbilityMod || 0);
  }

  function effectiveSpellDc(
    baseDc = 10,
    activeBuffs = [],
    spellContext = {},
    options = {},
  ) {
    const base = Number(baseDc || 0);
    const applied = collectSpellAdjustmentBonuses(
      activeBuffs,
      "spellDcBonuses",
      spellContext,
      options,
    );
    return {
      base,
      total: base + applied.total,
      bonus: applied.total,
      used: applied.used,
      ignored: applied.ignored,
      conditional: applied.conditional,
    };
  }

  function normalizedEffectiveAttribute(entry = {}) {
    const raw = String(entry.attribute || entry.ability || entry.stat || "")
      .trim()
      .toLowerCase();
    const aliases = {
      str: "strength",
      strength: "strength",
      dex: "dexterity",
      dexterity: "dexterity",
      con: "constitution",
      constitution: "constitution",
      int: "intelligence",
      intelligence: "intelligence",
      wis: "wisdom",
      wisdom: "wisdom",
      cha: "charisma",
      charisma: "charisma",
    };
    return aliases[raw] || "";
  }

  function collectEffectiveAttributeBonuses(
    activeBuffs = [],
    attribute = "",
    spellContext = {},
    options = {},
  ) {
    const targetAttribute = normalizedEffectiveAttribute({ attribute });
    if (!targetAttribute) return applyBonuses([], options);
    const bonuses = [];
    const enrichedBuffs = (activeBuffs || []).map((buff) => ({
      ...buff,
      characterLevel:
        buff.characterLevel || options.characterLevel || spellContext.characterLevel,
      classLevel:
        buff.classLevel ||
        options.classLevel ||
        spellContext.classLevel ||
        spellContext.casterLevel,
      casterLevel:
        buff.casterLevel ||
        options.casterLevel ||
        spellContext.casterLevel ||
        spellContext.classLevel,
      classLevels: buff.classLevels || options.classLevels || spellContext.classLevels,
    }));
    enrichedBuffs.forEach((buff) => {
      (Array.isArray(buff.effectiveAttributeBonuses)
        ? buff.effectiveAttributeBonuses
        : []
      ).forEach((entry) => {
        if (hasUnresolvedConditionalTokens(entry)) return;
        if (normalizedEffectiveAttribute(entry) !== targetAttribute) return;
        if (!spellAdjustmentAppliesToSource(entry, spellContext)) return;
        if (!spellAdjustmentMatches(entry, spellContext)) return;
        const value = scaledBonusValue(entry, buff, {
          ...options,
          activeBuffs: enrichedBuffs,
          spellContext,
        });
        if (!value && !(entry.bonusScale || entry.scale)) return;
        bonuses.push({
          ...entry,
          value,
          type: entry.type || "untyped",
          source: buff.name || buff.source || "Effect",
          spellSource: spellAdjustmentSource(entry),
          conditional: Boolean(entry.conditional),
          appliesWhen: entry.appliesWhen || "",
        });
      });
    });
    return applyBonuses(bonuses, options);
  }

  function collectBuffModifiers(activeBuffs, context = {}) {
    const map = {};

    activeBuffs.forEach((buff) => {
      (buff.bonuses || []).forEach((rawBonus) => {
        if (hasUnresolvedConditionalTokens(rawBonus)) return;
        const targets = expandedStatsForBonus(rawBonus);
        targets.forEach((targetStat) => {
          const value = scaledBonusValue(rawBonus, buff, {
            ...context,
            activeBuffs,
            targetStat,
          });
          if (!map[targetStat]) map[targetStat] = [];
          map[targetStat].push({
            ...rawBonus,
            stat: targetStat,
            value,
            type: rawBonus.type || "untyped",
            source: buff.name,
            casterLevel: buff.casterLevel,
          });
        });
      });
    });

    return map;
  }

  function dexDenialBonus(rawBonus, dexBonus) {
    return {
      ...rawBonus,
      value: -Math.max(0, Number(dexBonus || 0)),
      type: rawBonus.type || "condition",
      detail:
        rawBonus.appliesWhen || rawBonus.detail || "removes DEX bonus to AC",
    };
  }

  function applyDexDenialToAc(bonuses, dexBonus) {
    const result = { total: 0, used: [], ignored: [], conditional: [] };
    const normalized = (bonuses || []).map((bonus) =>
      dexDenialBonus(bonus, dexBonus),
    );
    normalized
      .filter((bonus) => bonus.conditional)
      .forEach((bonus) =>
        result.conditional.push({
          ...bonus,
          conditionalReason: bonus.appliesWhen || "removes DEX bonus to AC",
        }),
      );

    const active = normalized.filter((bonus) => !bonus.conditional);
    if (!active.length || Math.max(0, Number(dexBonus || 0)) <= 0)
      return result;

    result.total = active[0].value;
    result.used.push(active[0]);
    active
      .slice(1)
      .forEach((bonus) =>
        result.ignored.push({
          ...bonus,
          ignoredReason: `${active[0].source} already removes DEX bonus to AC`,
        }),
      );
    return result;
  }

  function addBreakdown(
    breakdown,
    stat,
    label,
    value,
    type = "derived",
    detail = "",
  ) {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({
      stat,
      source: label,
      value,
      type,
      detail,
      applied: true,
    });
  }

  function addIgnoredBreakdown(breakdown, stat, bonus, reason) {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({
      stat,
      source: bonus.source,
      value: bonus.value,
      type: bonus.type || "untyped",
      detail: reason || bonus.ignoredReason || "not applied",
      applied: false,
    });
  }

  function addConditionalBreakdown(breakdown, stat, bonus) {
    if (!breakdown[stat]) breakdown[stat] = [];
    breakdown[stat].push({
      ...bonus,
      stat,
      source: bonus.source,
      value: bonus.value,
      type: bonus.type || "untyped",
      detail:
        bonus.detail ||
        bonus.appliesWhen ||
        bonus.conditionalReason ||
        "conditional",
      applied: "conditional",
      conditional: true,
    });
  }

  function calculateStatsDetailed(activeBuffs, baseline) {
    const enrichedBuffs = (activeBuffs || []).map((buff) => ({
      ...buff,
      characterLevel:
        buff.characterLevel || baseline.characterLevel || baseline.level,
      classLevel: buff.classLevel || baseline.classLevel,
      classLevels: buff.classLevels || baseline.classLevels,
    }));
    let buffMap = collectBuffModifiers(enrichedBuffs, {
      baseline,
      skillRanks: baseline?.skillRanks || {},
    });
    let suppressedBonusTypes = new Map();
    let conditionalSuppressedBonusTypes = new Map();
    let requirementAbilityScores = {};
    const applyActiveBonuses = (bonuses) =>
      applyBonuses((bonuses || []).filter((bonus) => !hasSpecificWeaponRestriction(bonus)), {
        suppressedBonusTypes,
        conditionalSuppressedBonusTypes,
        abilityScores: requirementAbilityScores,
      });
    const totals = {};
    const bonuses = {};
    const breakdown = {};

    const abilityKeys = {
      strength: "str",
      dexterity: "dex",
      constitution: "con",
      intelligence: "int",
      wisdom: "wis",
      charisma: "cha",
    };

    const abilityScores = {};
    const abilityMods = {};
    const abilityCauses = {};

    requirementAbilityScores = Object.fromEntries(
      Object.entries(abilityKeys).map(([stat, key]) => [
        stat,
        Number(baseline[key] || 0),
      ]),
    );
    for (let index = 0; index < 4; index += 1) {
      buffMap = collectBuffModifiers(enrichedBuffs, {
        baseline,
        skillRanks: baseline?.skillRanks || {},
        abilityScores: requirementAbilityScores,
      });
      const nextSuppressions = activeBonusTypeSuppressions(
        buffMap,
        requirementAbilityScores,
      );
      const nextScores = {};
      Object.entries(abilityKeys).forEach(([stat, key]) => {
        const applied = applyBonuses(buffMap[stat] || [], {
          suppressedBonusTypes: nextSuppressions,
          abilityScores: requirementAbilityScores,
        });
        nextScores[stat] = Number(baseline[key] || 0) + applied.total;
      });
      const unchanged = Object.keys(nextScores).every(
        (stat) => nextScores[stat] === requirementAbilityScores[stat],
      );
      requirementAbilityScores = nextScores;
      if (unchanged) break;
    }
    buffMap = collectBuffModifiers(enrichedBuffs, {
      baseline,
      skillRanks: baseline?.skillRanks || {},
      abilityScores: requirementAbilityScores,
    });
    suppressedBonusTypes = activeBonusTypeSuppressions(
      buffMap,
      requirementAbilityScores,
    );
    conditionalSuppressedBonusTypes = conditionalBonusTypeSuppressions(
      buffMap,
      requirementAbilityScores,
    );

    Object.entries(abilityKeys).forEach(([stat, key]) => {
      const applied = applyActiveBonuses(buffMap[stat] || []);
      const score = Number(baseline[key] || 0) + applied.total;
      abilityScores[stat] = score;
      abilityMods[stat] = abilityMod(score);
      abilityCauses[stat] = describeBonuses(applied.used);
      totals[stat] = score;
      addBreakdown(
        breakdown,
        stat,
        "Base",
        Number(baseline[key] || 0),
        "score",
      );
      applied.used.forEach((b) =>
        addBreakdown(breakdown, stat, b.source, b.value, b.type),
      );
      applied.ignored.forEach((b) => addIgnoredBreakdown(breakdown, stat, b));
      applied.conditional.forEach((b) =>
        addConditionalBreakdown(breakdown, stat, b),
      );
      bonuses[stat] = applied.total;
    });

    const direct = {};
    const directCauses = {};
    Object.keys(buffMap).forEach((stat) => {
      if (
        abilityKeys[stat] ||
        [
          "ac",
          "natural armor",
          "deflection",
          "remove dex bonus to ac",
        ].includes(stat) ||
        isBonusSuppressionStat(stat)
      )
        return;
      const applied = applyActiveBonuses(buffMap[stat]);
      direct[stat] = applied.total;
      directCauses[stat] = describeBonuses(applied.used);
      applied.used.forEach((b) =>
        addBreakdown(breakdown, stat, b.source, b.value, b.type),
      );
      applied.ignored.forEach((b) => addIgnoredBreakdown(breakdown, stat, b));
      applied.conditional.forEach((b) =>
        addConditionalBreakdown(breakdown, stat, b),
      );
      bonuses[stat] = applied.total;
    });

    const acSizeApplied = applyActiveBonuses(
      (buffMap.ac || []).filter((b) => b.type === "size"),
    );
    const armorApplied = applyActiveBonuses(
      (buffMap.ac || []).filter((b) => b.type === "armor"),
    );
    const shieldApplied = applyActiveBonuses(
      (buffMap.ac || []).filter((b) => b.type === "shield"),
    );
    const naturalApplied = applyActiveBonuses([
      ...(buffMap["natural armor"] || []),
      ...(buffMap.ac || []).filter((b) => b.type === "natural armor"),
    ]);
    const deflectionApplied = applyActiveBonuses(buffMap.deflection || []);
    const acMiscApplied = applyActiveBonuses(
      (buffMap.ac || []).filter(
        (b) => !["armor", "shield", "natural armor", "size"].includes(b.type),
      ),
    );
    const acSizeFromBuffs = acSizeApplied.total;
    const combatSize = Number(baseline.sizeCombat || 0) - acSizeFromBuffs;
    const acSize = Number(baseline.sizeAc || 0) + acSizeFromBuffs;
    const armorFromAcBuffs = armorApplied.total;
    const shieldFromAcBuffs = shieldApplied.total;
    const naturalFromDedicated = naturalApplied.total;
    const deflectionFromDedicated = deflectionApplied.total;
    const acMiscBuffs = acMiscApplied.total;
    const armor = Math.max(Number(baseline.armor || 0), armorFromAcBuffs);
    const shield = Math.max(Number(baseline.shield || 0), shieldFromAcBuffs);
    const naturalArmor =
      Number(baseline.naturalArmor || 0) + naturalFromDedicated;
    totals["natural armor"] = naturalArmor;
    bonuses["natural armor"] = naturalFromDedicated;
    const deflection =
      Number(baseline.deflection || 0) + deflectionFromDedicated;
    const acMisc = Number(baseline.acMisc || 0) + acMiscBuffs;
    const dexMod = abilityMods.dexterity;
    const maxDex =
      baseline.maxDex === null || baseline.maxDex === undefined || baseline.maxDex === ""
        ? null
        : Number(baseline.maxDex);
    const armorDexMod =
      maxDex === null || !Number.isFinite(maxDex) || dexMod <= 0
        ? dexMod
        : Math.min(dexMod, maxDex);
    const positiveDex = Math.max(0, armorDexMod);
    const dexDeniedApplied = applyDexDenialToAc(
      buffMap["remove dex bonus to ac"] || [],
      positiveDex,
    );
    const cmdAcTypes = [
      "circumstance",
      "deflection",
      "dodge",
      "insight",
      "luck",
      "morale",
      "profane",
      "racial",
      "sacred",
    ];
    const cmdAcApplied = applyActiveBonuses(
      (buffMap.ac || []).filter(
        (b) =>
          cmdAcTypes.includes(b.type) ||
          (b.value < 0 &&
            !["armor", "shield", "natural armor", "size"].includes(b.type)),
      ),
    );
    const cmdAcBonus = cmdAcApplied.total + deflectionFromDedicated;

    const acDexMod = armorDexMod + dexDeniedApplied.total;
    const flatDexMod = Math.min(0, dexMod);
    const dodgeAcBuffs = applyActiveBonuses(
      (buffMap.ac || []).filter((b) => b.type === "dodge"),
    ).total;
    totals.ac =
      10 +
      armor +
      shield +
      acDexMod +
      acSize +
      naturalArmor +
      deflection +
      acMisc;
    totals["touch ac"] = 10 + acDexMod + acSize + deflection + acMisc;
    totals["flat-footed ac"] =
      10 +
      armor +
      shield +
      flatDexMod +
      acSize +
      naturalArmor +
      deflection +
      acMisc -
      dodgeAcBuffs;
    addBreakdown(
      breakdown,
      "ac",
      "Formula",
      totals.ac,
      "10 + armor + shield + Dex + size + natural + deflection + misc",
      `DEX ${abilityScores.dexterity} (${fmt(acDexMod)}${armorDexMod !== dexMod ? `; Max Dex ${fmt(maxDex)}` : ""}): ${abilityCauses.dexterity}`,
    );
    acSizeApplied.used.forEach((b) =>
      addBreakdown(
        breakdown,
        "ac",
        b.source,
        b.value,
        b.type,
        "applies as size AC",
      ),
    );
    acSizeApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    acSizeApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    armorApplied.used.forEach((b) => {
      if (armorFromAcBuffs > Number(baseline.armor || 0))
        addBreakdown(
          breakdown,
          "ac",
          b.source,
          b.value,
          b.type,
          "applies as armor bonus",
        );
      else
        addIgnoredBreakdown(
          breakdown,
          "ac",
          b,
          `armor bonus is superseded by equipped armor ${Number(baseline.armor || 0)}`,
        );
    });
    armorApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    armorApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    shieldApplied.used.forEach((b) => {
      if (shieldFromAcBuffs > Number(baseline.shield || 0))
        addBreakdown(
          breakdown,
          "ac",
          b.source,
          b.value,
          b.type,
          "applies as shield bonus",
        );
      else
        addIgnoredBreakdown(
          breakdown,
          "ac",
          b,
          `shield bonus is superseded by equipped shield ${Number(baseline.shield || 0)}`,
        );
    });
    shieldApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    shieldApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    naturalApplied.used.forEach((b) =>
      addBreakdown(
        breakdown,
        "ac",
        b.source,
        b.value,
        b.type,
        "applies as natural armor",
      ),
    );
    naturalApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    naturalApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    deflectionApplied.used.forEach((b) =>
      addBreakdown(
        breakdown,
        "ac",
        b.source,
        b.value,
        b.type,
        "applies as deflection",
      ),
    );
    deflectionApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    deflectionApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    acMiscApplied.used.forEach((b) =>
      addBreakdown(breakdown, "ac", b.source, b.value, b.type, "applies to AC"),
    );
    acMiscApplied.ignored.forEach((b) =>
      addIgnoredBreakdown(breakdown, "ac", b),
    );
    acMiscApplied.conditional.forEach((b) =>
      addConditionalBreakdown(breakdown, "ac", b),
    );
    dexDeniedApplied.used.forEach((b) => {
      addBreakdown(
        breakdown,
        "ac",
        b.source,
        b.value,
        b.type,
        "removes DEX bonus to AC",
      );
      addBreakdown(
        breakdown,
        "touch ac",
        b.source,
        b.value,
        b.type,
        "removes DEX bonus to touch AC",
      );
    });
    dexDeniedApplied.ignored.forEach((b) => {
      addIgnoredBreakdown(breakdown, "ac", b);
      addIgnoredBreakdown(breakdown, "touch ac", b);
    });
    dexDeniedApplied.conditional.forEach((b) => {
      addConditionalBreakdown(breakdown, "ac", b);
      addConditionalBreakdown(breakdown, "touch ac", {
        ...b,
        appliesWhen:
          b.appliesWhen || b.detail || "removes DEX bonus to touch AC",
      });
    });
    addBreakdown(
      breakdown,
      "touch ac",
      "Formula",
      totals["touch ac"],
      "10 + Dex + size + deflection + misc",
      `DEX ${abilityScores.dexterity} (${fmt(dexMod)}): ${abilityCauses.dexterity}`,
    );
    addBreakdown(
      breakdown,
      "flat-footed ac",
      "Formula",
      totals["flat-footed ac"],
      "AC without positive Dex/dodge",
    );

    totals.fortitude =
      Number(baseline.fortBase || 0) +
      abilityMods.constitution +
      (direct.fortitude || 0);
    totals.reflex =
      Number(baseline.reflexBase || 0) +
      abilityMods.dexterity +
      (direct.reflex || 0);
    totals.will =
      Number(baseline.willBase || 0) + abilityMods.wisdom + (direct.will || 0);

    totals.initiative =
      abilityMods.dexterity +
      Number(baseline.initMisc || 0) +
      (direct.initiative || 0);
    totals["melee attack"] =
      Number(baseline.bab || 0) +
      abilityMods.strength +
      acSize +
      (direct.attack || 0) +
      (direct["melee attack"] || 0);
    totals["ranged attack"] =
      Number(baseline.bab || 0) +
      abilityMods.dexterity +
      acSize +
      (direct.attack || 0) +
      (direct["ranged attack"] || 0);
    totals.damage = abilityMods.strength + (direct.damage || 0);
    totals.cmb =
      Number(baseline.bab || 0) +
      abilityMods.strength +
      combatSize +
      Number(baseline.cmbMisc || 0) +
      (direct.cmb || 0) +
      (direct.attack || 0);
    totals.cmd =
      10 +
      Number(baseline.bab || 0) +
      abilityMods.strength +
      abilityMods.dexterity +
      combatSize +
      Number(baseline.cmdMisc || 0) +
      cmdAcBonus +
      (direct.cmd || 0);
    totals["hit points"] =
      Number(baseline.hitPoints || 0) +
      Number(baseline.hitDice || 0) *
        (abilityMods.constitution - abilityMod(baseline.con)) +
      (direct["hit points"] || 0);
    totals["skill checks"] = direct["skill checks"] || 0;
    totals["trained skill checks"] = direct["trained skill checks"] || 0;
    totals["untrained skill checks"] = direct["untrained skill checks"] || 0;
    totals["class skill checks"] = direct["class skill checks"] || 0;
    totals["class knowledge skill checks"] =
      direct["class knowledge skill checks"] || 0;
    totals["craft skill checks"] = direct["craft skill checks"] || 0;
    totals["profession skill checks"] = direct["profession skill checks"] || 0;
    totals["perform skill checks"] = direct["perform skill checks"] || 0;
    totals["spell resistance"] = direct["spell resistance"] || 0;
    bonuses.ac =
      totals.ac -
      (10 +
        Number(baseline.armor || 0) +
        Number(baseline.shield || 0) +
        abilityMod(baseline.dex) +
        Number(baseline.sizeAc || 0) +
        Number(baseline.naturalArmor || 0) +
        Number(baseline.deflection || 0) +
        Number(baseline.acMisc || 0));
    bonuses["touch ac"] =
      totals["touch ac"] -
      (10 +
        abilityMod(baseline.dex) +
        Number(baseline.sizeAc || 0) +
        Number(baseline.deflection || 0) +
        Number(baseline.acMisc || 0));
    bonuses["flat-footed ac"] =
      totals["flat-footed ac"] -
      (10 +
        Number(baseline.armor || 0) +
        Number(baseline.shield || 0) +
        abilityMod(baseline.dex) +
        Number(baseline.sizeAc || 0) +
        Number(baseline.naturalArmor || 0) +
        Number(baseline.deflection || 0) +
        Number(baseline.acMisc || 0) -
        Math.max(0, abilityMod(baseline.dex)));
    bonuses.fortitude =
      totals.fortitude -
      (Number(baseline.fortBase || 0) + abilityMod(baseline.con));
    bonuses.reflex =
      totals.reflex -
      (Number(baseline.reflexBase || 0) + abilityMod(baseline.dex));
    bonuses.will =
      totals.will - (Number(baseline.willBase || 0) + abilityMod(baseline.wis));
    bonuses.initiative =
      totals.initiative -
      (abilityMod(baseline.dex) + Number(baseline.initMisc || 0));
    bonuses.cmb =
      totals.cmb -
      (Number(baseline.bab || 0) +
        abilityMod(baseline.str) +
        Number(baseline.sizeCombat || 0) +
        Number(baseline.cmbMisc || 0));
    bonuses.cmd =
      totals.cmd -
      (10 +
        Number(baseline.bab || 0) +
        abilityMod(baseline.str) +
        abilityMod(baseline.dex) +
        Number(baseline.sizeCombat || 0) +
        Number(baseline.cmdMisc || 0));
    bonuses["hit points"] =
      totals["hit points"] - Number(baseline.hitPoints || 0);
    cmdAcApplied.used.forEach((b) =>
      addBreakdown(
        breakdown,
        "cmd",
        b.source,
        b.value,
        b.type,
        "AC bonus applies to CMD",
      ),
    );
    deflectionApplied.used.forEach((b) =>
      addBreakdown(
        breakdown,
        "cmd",
        b.source,
        b.value,
        b.type,
        "deflection applies to CMD",
      ),
    );

    return {
      totals,
      bonuses,
      breakdown,
      abilityScores,
      abilityMods,
      buffMap,
      bonusContext: {
        suppressedBonusTypes,
        conditionalSuppressedBonusTypes,
        abilityScores: requirementAbilityScores,
      },
    };
  }

  function weaponBonusesForStats(
    calculation = {},
    statNames = [],
    weaponType = "",
    weaponName = "",
  ) {
    const context = calculation.bonusContext || {};
    const byStat = {};
    const breakdown = [];
    let total = 0;
    [...new Set(statNames.filter(Boolean))].forEach((stat) => {
      const bonuses = (calculation.buffMap?.[stat] || []).filter((bonus) =>
        weaponRestrictionMatches(bonus, weaponType, weaponName),
      );
      const applied = applyBonuses(bonuses, context);
      byStat[stat] = applied;
      total += applied.total;
      applied.used.forEach((bonus) =>
        breakdown.push({
          ...bonus,
          stat,
          source: bonus.source,
          value: bonus.value,
          type: bonus.type || "untyped",
          applied: true,
        }),
      );
      applied.ignored.forEach((bonus) =>
        breakdown.push({
          ...bonus,
          stat,
          source: bonus.source,
          value: bonus.value,
          type: bonus.type || "untyped",
          detail: bonus.ignoredReason || "not applied",
          applied: false,
        }),
      );
      applied.conditional.forEach((bonus) =>
        breakdown.push({
          ...bonus,
          stat,
          source: bonus.source,
          value: bonus.value,
          type: bonus.type || "untyped",
          detail:
            bonus.detail ||
            bonus.appliesWhen ||
            bonus.conditionalReason ||
            "conditional",
          applied: "conditional",
          conditional: true,
        }),
      );
    });
    return { total, byStat, breakdown };
  }

  window.PFBuffs = {
    abilityMod,
    fmt,
    applyBonuses,
    calculateStatsDetailed,
    scaledBonusValue,
    scaleLevelValue,
    baseSpellDc,
    collectSpellAdjustmentBonuses,
    effectiveCasterLevel,
    effectiveSpellDc,
    collectEffectiveAttributeBonuses,
    spellAdjustmentMatches,
    weaponBonusesForStats,
  };
})();
