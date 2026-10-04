(function () {
  const STYLE_ID = "pf-effect-tracker-style";
  const CHOICE_POOL_MECHANIC_KEYS =
    window.PFEffectMechanics?.extraKeys?.() || [
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
    ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .effect-tracker-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .effect-search-modal-dialog { width: min(1140px, calc(100vw - 2rem)); max-width: min(1140px, calc(100vw - 2rem)); min-width: min(860px, calc(100vw - 2rem)); }
      .effect-search-modal-dialog .modal-content { width: 100%; height: min(82vh, 820px); }
      .effect-search-modal-body { display: grid; grid-template-rows: auto minmax(0, 1fr); min-height: 0; }
      .effect-search-results { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-content: start; height: 100%; min-height: 0; overflow: auto; }
      .effect-tracker-search-trigger { cursor: pointer; }
      .effect-tracker-card { position: relative; min-height: 116px; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 12px 52px 12px 12px; text-align: left; color: #f4f4f4; cursor: pointer; }
      .effect-tracker-card:hover, .effect-tracker-card:focus { border-color: #0d6efd; outline: none; box-shadow: 0 0 0 2px rgba(13, 110, 253, .25); }
      .effect-tracker-card-ability { border-color: rgba(143, 209, 158, .45); background: rgba(143, 209, 158, .06); }
      .effect-tracker-card-ability:hover, .effect-tracker-card-ability:focus { border-color: #8fd19e; box-shadow: 0 0 0 2px rgba(143, 209, 158, .25); }
      .effect-tracker-ability-badge { display: inline-block; background: rgba(143, 209, 158, .16); border: 1px solid rgba(143, 209, 158, .4); color: #d9f5df; border-radius: 999px; padding: 1px 7px; font-size: 11px; margin-bottom: 4px; }
      .effect-tracker-icon { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #151515; border: 1px solid #555; color: #9ec5fe; }
      .effect-tracker-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
      .effect-tracker-inline { display: inline-flex; align-items: center; gap: 4px; }
      .effect-tracker-inline input[type="number"] { width: 62px; }
      .effect-tracker-chip { display: inline-block; margin: 2px 3px 2px 0; color: #ddd; }
      .effect-tracker-active { background: #242424; border: 1px solid #444; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
      .effect-active-group { margin-top: 10px; }
      .effect-active-group-title { color: #bbb; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 6px; }
      .effect-active-toolbar { display: flex; justify-content: space-between; align-items: end; gap: 10px; margin-bottom: 8px; }
      .effect-active-toolbar select { max-width: 180px; }
      .effect-active-head { display: grid; grid-template-columns: minmax(0, 1fr) 68px; gap: 10px; align-items: start; }
      .effect-active-actions { display: grid; grid-template-columns: 30px 30px; gap: 4px; justify-content: end; }
      .effect-active-actions .btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
      .effect-active-adjustments { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin-top: 8px; }
      .effect-active-adjustments .effect-tracker-inline input[type="number"] { width: 68px; }
      .effect-duration-grid { display: grid; grid-template-columns: .75fr 1fr .7fr; gap: 8px; align-items: end; }
      .shared-bonus-row { position: relative; display: grid; grid-template-columns: 1.5fr .7fr 1fr .7fr auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 10px 48px 10px 10px; }
      .shared-bonus-row .shared-named-skill-field { grid-column: 1 / -1; max-width: 280px; }
      .shared-bonus-row button[aria-label="Delete effect"] { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
      .shared-bonus-condition-inline { grid-column: 1 / -1; display: grid; grid-template-columns: auto minmax(160px, 260px); gap: 8px; align-items: end; }
      .shared-bonus-row [data-scale-summary] { grid-column: 1 / -1; }
      .shared-dr-row { display: grid; grid-template-columns: 0.7fr 1.3fr auto auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-sr-row { display: grid; grid-template-columns: 0.5fr auto 0.9fr auto auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-dr-row [data-scale-summary], .shared-sr-row [data-scale-summary], .shared-spell-adjustment-row [data-scale-summary] { grid-column: 1 / -1; }
      .shared-class-skill-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-class-skill-row .shared-named-skill-field { grid-column: 1 / -1; }
      .shared-grant-domain-row { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(150px, auto) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-grant-domain-choice { min-height: 31px; display: flex; align-items: center; gap: 8px; padding-left: 2.5em; }
      .shared-grant-domain-choice .form-check-label { color: #fff; font-size: 12px; }
      .shared-extra-ranks-row, .shared-size-change-row { display: grid; grid-template-columns: minmax(120px, 180px) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-special-toggle-row { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 8px; align-items: center; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-special-toggle-row .shared-special-toggle-check { align-items: center; display: flex; min-height: 31px; margin: 0; }
      .shared-special-toggle-controls { align-items: center; display: inline-flex; gap: 8px; justify-self: end; }
      .shared-special-toggle-condition { grid-column: 1 / -1; }
      .shared-special-toggle-row button[data-special-toggle-condition-toggle] { align-items: center; display: inline-flex; height: 31px; justify-content: center; justify-self: start; padding: 0; width: 31px; }
      .shared-extra-ranks-row button[aria-label="Delete extra ranks per level"], .shared-grant-domain-row button[aria-label="Delete domain grant"], .shared-size-change-row button[aria-label="Delete size change"], .shared-spell-adjustment-target-row button[aria-label="Delete spell target group"] { align-items: center; display: inline-flex; height: 31px; justify-content: center; justify-self: start; padding: 0; width: 31px; }
      .shared-apply-condition-row { display: grid; grid-template-columns: minmax(150px, 1fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-conditional-variable-row { display: grid; grid-template-columns: minmax(150px, 0.8fr) minmax(180px, 1fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-conditional-variable-row .small { grid-column: 1 / -1; }
      .shared-spell-like-row { display: grid; grid-template-columns: minmax(58px, 0.25fr) minmax(105px, 0.5fr) minmax(130px, 0.8fr) minmax(86px, 0.36fr) minmax(64px, 0.28fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-spell-like-picker { display: flex; align-items: center; justify-content: space-between; min-width: 0; min-height: 31px; gap: 8px; text-align: left; }
      .shared-spell-like-row .form-control, .shared-spell-like-row .form-select { min-width: 0; }
      .shared-spell-like-picker span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .shared-spell-adjustment-row { background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-spell-adjustment-source { max-width: 280px; }
      .shared-effective-attribute-field { max-width: 120px; }
      .shared-spell-adjustment-target-row, .shared-spell-adjustment-increase-row, .shared-spell-adjustment-condition { display: grid; gap: 8px; align-items: end; }
      .shared-spell-adjustment-target-row { grid-template-columns: minmax(140px, 0.7fr) minmax(220px, 1fr) auto auto; }
      .shared-spell-adjustment-increase-row { grid-template-columns: minmax(210px, 1.1fr) minmax(80px, 0.35fr) minmax(110px, 0.6fr) auto auto auto; }
      .shared-spell-adjustment-nested { margin-top: 10px; }
      .shared-spell-adjustment-nested > .vstack { margin-top: 6px; }
      .shared-spell-adjustment-condition { grid-template-columns: auto minmax(220px, 1fr) auto; margin-top: 10px; }
      .shared-spell-adjustment-checks { display: flex; flex-wrap: wrap; gap: 6px 10px; min-height: 31px; align-items: center; }
      .shared-spell-adjustment-checks .form-check-label { color: #fff; font-size: 12px; }
      .shared-spell-adjustment-row .form-control, .shared-spell-adjustment-row .form-select { min-width: 0; }
      .shared-extra-accordion .accordion-item { background: transparent; border: 0; }
      .shared-extra-accordion .accordion-button { background: #242424; color: #ddd; padding: 8px 10px; font-size: 13px; }
      .shared-extra-accordion .accordion-button:not(.collapsed) { background: #2b2b2b; color: #fff; box-shadow: none; }
      .shared-extra-accordion .accordion-button::after { filter: invert(1) grayscale(1) brightness(1.6); }
      .shared-extra-accordion .accordion-body { background: #1e1e1e; border: 1px solid #333; border-top: 0; padding: 10px; }
      .shared-extra-subsection { margin-bottom: 14px; }
      .shared-extra-subsection:last-child { margin-bottom: 0; }
      @media (max-width: 700px) { .effect-duration-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .shared-bonus-row, .shared-bonus-condition-inline { grid-template-columns: 1fr 1fr; } .shared-bonus-condition-inline { grid-column: auto; } .shared-spell-adjustment-target-row, .shared-spell-adjustment-increase-row, .shared-spell-adjustment-condition, .shared-grant-domain-row, .shared-special-toggle-row { grid-template-columns: 1fr; } .shared-special-toggle-controls { justify-self: start; } .shared-extra-ranks-row button[aria-label="Delete extra ranks per level"], .shared-grant-domain-row button[aria-label="Delete domain grant"], .shared-size-change-row button[aria-label="Delete size change"], .shared-spell-adjustment-target-row button[aria-label="Delete spell target group"] { width: 31px; } }
      @media (max-width: 700px) {
        .effect-search-modal-dialog { min-width: 0; }
        .effect-tracker-grid,
        .effect-search-results { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmt(value) {
    return value >= 0 ? `+${value}` : String(value);
  }

  const STAT_LABELS = {
    ac: "AC",
    "touch ac": "Touch AC",
    "flat-footed ac": "Flat-Footed AC",
    "remove dex bonus to ac": "Remove DEX Bonus to AC",
    "cannot gain morale bonuses": "Cannot Gain Morale Bonuses",
    "cannot gain luck bonuses": "Cannot Gain Luck Bonuses",
    cmb: "CMB",
    cmd: "CMD",
    "extra attack": "Extra Attack at Highest BAB",
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
  };
  const PF_SKILLS = [
    "Acrobatics",
    "Appraise",
    "Bluff",
    "Climb",
    "Diplomacy",
    "Disable Device",
    "Disguise",
    "Escape Artist",
    "Fly",
    "Heal",
    "Handle Animal",
    "Intimidate",
    "Knowledge (arcana)",
    "Knowledge (dungeoneering)",
    "Knowledge (engineering)",
    "Knowledge (geography)",
    "Knowledge (history)",
    "Knowledge (local)",
    "Knowledge (nature)",
    "Knowledge (nobility)",
    "Knowledge (planes)",
    "Knowledge (religion)",
    "Linguistics",
    "Perception",
    "Ride",
    "Sense Motive",
    "Sleight of Hand",
    "Spellcraft",
    "Stealth",
    "Survival",
    "Swim",
    "Use Magic Device",
  ];
  const SKILL_STAT_LABELS = {
    "skill checks": "Skill: All Checks",
    "trained skill checks": "Skill: Trained Checks",
    "untrained skill checks": "Skill: Untrained Checks",
    "class skill checks": "Skill: Class Skill Checks",
    "class knowledge skill checks": "Skill: Class Knowledge Checks",
    "skill:craft": "Skill: Craft",
    "skill:profession": "Skill: Profession",
    "skill:perform": "Skill: Perform",
    "strength skill checks": "Skill: STR Checks",
    "dexterity skill checks": "Skill: DEX Checks",
    "constitution skill checks": "Skill: CON Checks",
    "intelligence skill checks": "Skill: INT Checks",
    "wisdom skill checks": "Skill: WIS Checks",
    "charisma skill checks": "Skill: CHA Checks",
    "craft skill checks": "Skill: Craft Checks",
    "profession skill checks": "Skill: Profession Checks",
    "perform skill checks": "Skill: Perform Checks",
    ...Object.fromEntries(
      PF_SKILLS.map((skill) => [
        `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
        `Skill: ${skill}`,
      ]),
    ),
  };
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const ACTIVE_CATEGORY_PRIORITY = [
    "Spell",
    "Special Ability",
    "Feat",
    "Debuff",
    "Condition",
    "Item",
  ];

  function titleCaseStat(value) {
    const key = String(value || "")
      .toLowerCase()
      .trim();
    const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(key);
    if (choiceLabel) return choiceLabel;
    if (STAT_LABELS[key]) return STAT_LABELS[key];
    if (SKILL_STAT_LABELS[key]) return SKILL_STAT_LABELS[key];
    return key
      .split(" ")
      .map(
        (word) =>
          STAT_LABELS[word] || word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  }

  function activeCategoryRank(category) {
    const index = ACTIVE_CATEGORY_PRIORITY.findIndex(
      (item) => item.toLowerCase() === String(category || "").toLowerCase(),
    );
    return index >= 0 ? index : ACTIVE_CATEGORY_PRIORITY.length;
  }

  function sortActiveRows(rows) {
    return rows.sort(
      (a, b) =>
        activeCategoryRank(a.effect.category) -
          activeCategoryRank(b.effect.category) ||
        String(a.effect.name || "").localeCompare(
          String(b.effect.name || ""),
        ) ||
        a.index - b.index,
    );
  }

  function isItemSourcedEffect(effect = {}) {
    return Boolean(effect.sourceLootId || effect.source_loot_id);
  }

  function groupedActiveRows(rows) {
    return rows.reduce((groups, row) => {
      const category = row.effect.category || "Effect";
      const group = groups.find((entry) => entry.category === category);
      if (group) group.rows.push(row);
      else groups.push({ category, rows: [row] });
      return groups;
    }, []);
  }

  function categoryIcon(category) {
    const key = String(category || "").toLowerCase();
    if (key.includes("condition")) return "bi-activity";
    if (key.includes("debuff")) return "bi-arrow-down-circle";
    if (key.includes("feat")) return "bi-award";
    if (key.includes("spell")) return "bi-stars";
    return "bi-lightning-charge";
  }

  function legacyDurationParts(duration) {
    const text = String(duration || "")
      .toLowerCase()
      .trim();
    if (!text || text === "variable" || text === "permanent") {
      return { count: null, unit: "variable", perLevel: false };
    }
    const count = Number((text.match(/(\d+)/) || [null, 1])[1]) || 1;
    const unit =
      DURATION_UNITS.find(
        (value) => value !== "variable" && text.includes(value),
      ) || "variable";
    const perLevel = text.includes("/level") || text.includes("per level");
    return { count, unit, perLevel };
  }

  function durationParts(effect) {
    if (window.PFEffectMeta?.normalizeDurationConfig) {
      const config = window.PFEffectMeta.normalizeDurationConfig(effect);
      return {
        count: config.count,
        unit: config.unit,
        perLevel:
          config.factors.some((factor) => factor.type === "caster") ||
          config.durationScale?.source?.type === "caster",
        config,
      };
    }
    const hasStructured =
      effect &&
      (effect.durationCount !== undefined ||
        effect.durationUnit ||
        effect.durationPerLevel !== undefined);
    if (hasStructured) {
      return {
        count:
          effect.durationCount === null ||
          effect.durationCount === undefined ||
          effect.durationCount === ""
            ? null
            : Number(effect.durationCount),
        unit: effect.durationUnit || "variable",
        perLevel: Boolean(effect.durationPerLevel),
      };
    }
    return legacyDurationParts(effect?.duration);
  }

  function durationUsesCasterLevel(effect) {
    const config = durationParts(effect).config;
    return config
      ? config.factors.some((factor) => factor.type === "caster") ||
        config.durationScale?.source?.type === "caster"
      : durationParts(effect).perLevel;
  }

  function durationLabel(effect) {
    if (window.PFEffectMeta?.durationLabel)
      return window.PFEffectMeta.durationLabel(effect);
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return "variable";
    const unit = `${parts.unit}${Number(parts.count) === 1 ? "" : "s"}`;
    return `${parts.count} ${unit}${parts.perLevel ? " / level" : ""}`;
  }

  function isCondition(effect) {
    return String(effect?.category || "").toLowerCase() === "condition";
  }

  const FEAR_CONDITIONS = ["shaken", "frightened", "panicked"];

  function conditionName(effect = {}) {
    return String(
      effect.name || effect.conditionName || effect.condition?.name || "",
    ).trim();
  }

  function fearRank(effect = {}) {
    return FEAR_CONDITIONS.indexOf(conditionName(effect).toLowerCase());
  }

  function titleCaseConditionName(value = "") {
    return String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ");
  }

  async function conditionDefinitionMaps() {
    const definitions = window.PFApp?.loadConditionDefinitions
      ? await window.PFApp.loadConditionDefinitions()
      : [];
    const byName = new Map();
    const byId = new Map();
    (Array.isArray(definitions) ? definitions : []).forEach((condition) => {
      if (condition?.name) byName.set(String(condition.name).toLowerCase(), condition);
      if (condition?.id) byId.set(String(condition.id), condition);
    });
    return { byName, byId };
  }

  // casterLevelOrContext is normally just a caster level number (the
  // common case: "1 min/level" spells with a CL input). Activatable
  // abilities pass their full resolved context instead (character level,
  // class levels, ability mods), since their duration is computed from the
  // character rather than typed in by hand.
  function parseDuration(effect, casterLevelOrContext = 1) {
    const context =
      casterLevelOrContext && typeof casterLevelOrContext === "object"
        ? casterLevelOrContext
        : { casterLevel: casterLevelOrContext };
    const casterLevel = context.casterLevel ?? 1;
    if (window.PFEffectMeta?.parseDuration) {
      return window.PFEffectMeta.parseDuration(effect, context);
    }
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return null;
    const amount = Number(parts.count) || 1;
    const multiplier = parts.perLevel
      ? Math.max(1, Number(casterLevel) || 1)
      : 1;
    if (parts.unit === "turn" || parts.unit === "round")
      return amount * multiplier;
    if (parts.unit === "minute") return amount * 10 * multiplier;
    if (parts.unit === "hour") return amount * 600 * multiplier;
    if (parts.unit === "day") return amount * 14400 * multiplier;
    return null;
  }

  function formatDurationRounds(rounds) {
    if (rounds === null || rounds === undefined) return "variable";
    if (rounds === 1) return "1 turn";
    if (rounds % 600 === 0)
      return `${rounds / 600} hour${rounds === 600 ? "" : "s"}`;
    if (rounds % 10 === 0)
      return `${rounds / 10} minute${rounds === 10 ? "" : "s"}`;
    return `${rounds} round${rounds === 1 ? "" : "s"}`;
  }

  function activeDuration(effect) {
    if (effect.permanent) return "Permanent";
    if (effect.durationLabel) return effect.durationLabel;
    if (
      effect.computedDuration !== undefined &&
      effect.computedDuration !== null
    )
      return formatDurationRounds(effect.computedDuration);
    return durationLabel(effect);
  }

  function appliedDurationLabel(effect) {
    if (effect.permanent) return "Permanent";
    if (isCondition(effect)) {
      const turns = Math.max(1, Number(effect.turns || effect.remaining || 1));
      return `${turns} turn${turns === 1 ? "" : "s"}`;
    }
    const baseDurationLabel = durationLabel(effect);
    const computedDuration = parseDuration(effect, effect.casterLevel || 1);
    if (computedDuration === null) return baseDurationLabel;
    return durationUsesCasterLevel(effect)
      ? `${baseDurationLabel} | CL ${effect.casterLevel || 1}: ${formatDurationRounds(computedDuration)}`
      : `${baseDurationLabel} | ${formatDurationRounds(computedDuration)}`;
  }

  function bonusText(bonus) {
    if (
      String(bonus.stat || "")
        .toLowerCase()
        .trim() === "remove dex bonus to ac"
    ) {
      const text = "Removes DEX bonus to AC";
      return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
    }
    if (
      String(bonus.stat || "")
        .toLowerCase()
        .trim() === "cannot gain luck bonuses"
    ) {
      const text = "Cannot gain luck bonuses";
      return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
    }
    if (
      String(bonus.stat || "")
        .toLowerCase()
        .trim() === "cannot gain morale bonuses"
    ) {
      const text = "Cannot gain morale bonuses";
      return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
    }
    const value = Number(bonus.value || 0);
    const scale = scaleText(bonus.bonusScale || bonus.scale);
    const requirement = window.PFEffectEditor?.attributeRequirementText?.(bonus);
    const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
    const weaponRestriction =
      bonus.weaponTypeRestriction && bonus.weaponTypeRestriction !== "all"
        ? `; ${window.PFEffectStats?.weaponTypeRestrictionLabel?.(bonus.weaponTypeRestriction) || bonus.weaponTypeRestriction} only`
        : "";
    const weaponNameRestriction = bonus.weaponNameRestriction && bonus.weaponNameRestriction !== "all"
      ? `; ${bonus.weaponNameRestriction} only` : "";
    const text = `${fmt(value)} ${bonus.type || "untyped"} ${statLabel}${weaponRestriction}${weaponNameRestriction}${scale ? `; ${scale}` : ""}${requirement ? `; ${requirement}` : ""}`;
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }

  function spellLikeText(entry = {}) {
    const choiceList =
      entry.spellChoiceList ||
      window.PFEffectStats?.customSpellLikeListById?.(
        entry.spellChoiceListId || "",
      );
    const spellName = choiceList
      ? `choose from ${choiceList.name || "SLA list"}`
      : entry.spellName || entry.spell?.name || "Spell";
    const minimumLevel = Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
    const levelText = minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
    const castingAttr = String(
      entry.castingAttr || entry.castingAbility || entry.ability || "",
    )
      .trim()
      .toUpperCase();
    const minimumScore = Number(
      entry.minimumScore ?? entry.minimumAbilityScore ?? entry.score,
    );
    const scoreText =
      castingAttr && Number.isFinite(minimumScore) && minimumScore > 0
        ? `${castingAttr} ${minimumScore}, `
        : "";
    return `SLA ${levelText}${scoreText}${entry.frequency ? `${entry.frequency}: ` : ""}${spellName}`;
  }

  function extraRanksPerLevelText(entry = {}) {
    if (window.PFEffectEditor?.extraRanksPerLevelText)
      return window.PFEffectEditor.extraRanksPerLevelText(entry);
    const value = Number(entry.value ?? entry.amount ?? entry.ranks ?? 0);
    return `Extra Ranks / Level ${value >= 0 ? "+" : ""}${value}`;
  }

  function featGrantText(entry = {}) {
    if (window.PFEffectEditor?.featGrantText)
      return window.PFEffectEditor.featGrantText(entry);
    return `Gain feat: ${entry.featName || entry.featId || entry.featType || entry.featPoolId || "Feat"}`;
  }

  function casterLevelBonusText(entry = {}) {
    if (window.PFEffectEditor?.casterLevelBonusText)
      return window.PFEffectEditor.casterLevelBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Caster Level ${value >= 0 ? "+" : ""}${value}`;
  }

  function spellDcBonusText(entry = {}) {
    if (window.PFEffectEditor?.spellDcBonusText)
      return window.PFEffectEditor.spellDcBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Spell DC ${value >= 0 ? "+" : ""}${value}`;
  }

  function effectiveAttributeBonusText(entry = {}) {
    if (window.PFEffectEditor?.effectiveAttributeBonusText)
      return window.PFEffectEditor.effectiveAttributeBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Effective Attribute ${value >= 0 ? "+" : ""}${value}`;
  }

  function grantDomainText(entry = {}) {
    if (window.PFEffectEditor?.grantDomainText)
      return window.PFEffectEditor.grantDomainText(entry);
    return `Grant Domain: ${entry.domainName || entry.domainId || "Domain"}`;
  }

  function immunityText(entry = {}) {
    const name = String(entry.name || entry.immunity || entry.type || "")
      .trim()
      .replace(/^immunit(?:y|ies)\s+(?:to\s+)?/i, "");
    const label = name || "immunity";
    const conditional = entry.conditional ?? Boolean(entry.condition);
    const appliesWhen = entry.appliesWhen || entry.condition || "";
    return `Immune ${label}${conditional ? ` (${appliesWhen || "conditional"})` : ""}`;
  }

  function applyConditionText(entry = {}) {
    if (window.PFEffectEditor?.applyConditionText)
      return window.PFEffectEditor.applyConditionText(entry);
    return `Applies condition: ${conditionName(entry) || "Condition"}`;
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const sourceLabel = scale.source
      ? `${window.PFEffectMeta?.factorLabel?.(scale.source) || "level"}`
      : "CL";
    const multiplier = scale.levelMultiplier;
    if (multiplier && Number(multiplier.denominator) > 0) {
      const numerator = Number(multiplier.numerator || 0);
      const denominator = Number(multiplier.denominator || 1);
      parts.push(
        `${denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`} ${sourceLabel} (round down)`,
      );
    }
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    const milestoneText = milestones
      .filter(
        (milestone) =>
          milestone.level &&
          milestone.value !== "" &&
          milestone.value !== null &&
          milestone.value !== undefined,
      )
      .map(
        (milestone) =>
          `${sourceLabel} ${milestone.level}: ${fmt(Number(milestone.value || 0))}`,
      );
    if (milestoneText.length) parts.push(milestoneText.join(", "));
    const every = scale.every || {};
    const fromLevel = every.fromLevel || every.afterLevel || every.after;
    if (fromLevel && every.everyLevels && every.increase) {
      parts.push(
        `from ${sourceLabel} ${fromLevel}, every ${every.everyLevels}: ${fmt(Number(every.increase || 0))}`,
      );
    }
    if (scale.minimumOne) parts.push("minimum 1");
    return parts.length ? `scales ${parts.join("; ")}` : "";
  }

  function searchText(effect) {
    return [
      effect.name,
      effect.category,
      durationLabel(effect),
      ...(effect.bonuses || []).map(bonusText),
      ...(effect.immunities || []).map(immunityText),
      ...(effect.applyConditions || []).map(applyConditionText),
      ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
      ...(effect.featGrants || []).map(featGrantText),
      ...(effect.spellLikeAbilities || []).map(spellLikeText),
      ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
      ...(effect.spellDcBonuses || []).map(spellDcBonusText),
      ...(effect.effectiveAttributeBonuses || []).map(
        effectiveAttributeBonusText,
      ),
      ...(effect.grantDomains || []).map(grantDomainText),
      ...(effect.generatedEquipment || []).map(
        (item) => `${item.type || "equipment"} ${item.name || item.item || ""}`,
      ),
    ]
      .join(" ")
      .toLowerCase();
  }

  function stamp(contextKey, characterId) {
    const value = String(Date.now());
    localStorage.setItem(`pf_buffs_updated_${contextKey}`, value);
    if (characterId)
      localStorage.setItem(
        `pf_buffs_updated_${contextKey}_${characterId}`,
        value,
      );
  }

  class EffectTracker {
    constructor(container, options) {
      this.container = container;
      this.options = options;
      this.effects = [];
      this.active = [];
      this.prefix = `effectTracker${Math.random().toString(36).slice(2)}`;
      this.saveTimer = null;
      this.activeTypeFilter = "all";
    }

    async mount() {
      injectStyles();
      this.container.innerHTML = `
        <div id="${this.prefix}AddShell" class="mb-3">
          <label class="small" for="${this.prefix}OpenSearch">Activate</label>
          <div class="d-flex gap-2">
            <input id="${this.prefix}OpenSearch" class="form-control form-control-sm effect-tracker-search-trigger" placeholder="Search available abilities..." readonly>
            <button id="${this.prefix}OpenButton" class="btn btn-outline-success btn-sm" type="button">Select</button>
          </div>
        </div>
        <div id="${this.prefix}RequestStatus" class="small-text mb-2 d-none"></div>
        <h6>Active Effects</h6>
        <div id="${this.prefix}Active"></div>
        <div class="modal fade" id="${this.prefix}PickerModal" tabindex="-1" aria-labelledby="${this.prefix}PickerLabel" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable effect-search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}PickerLabel">Activate Effect</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body effect-search-modal-body">
                <div class="mb-3">
                  <label class="small" for="${this.prefix}Search">Search</label>
                  <input id="${this.prefix}Search" class="form-control form-control-sm" placeholder="Name, type, or stat change">
                </div>
                <div id="${this.prefix}Results" class="effect-tracker-grid effect-search-results"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      this.addShellEl = document.getElementById(`${this.prefix}AddShell`);
      this.openSearchEl = document.getElementById(`${this.prefix}OpenSearch`);
      this.openButtonEl = document.getElementById(`${this.prefix}OpenButton`);
      this.pickerModalEl = document.getElementById(`${this.prefix}PickerModal`);
      this.searchEl = document.getElementById(`${this.prefix}Search`);
      this.resultsEl = document.getElementById(`${this.prefix}Results`);
      this.activeEl = document.getElementById(`${this.prefix}Active`);
      if (this.pickerModalEl.parentElement !== document.body)
        document.body.appendChild(this.pickerModalEl);
      this.searchEl.addEventListener("input", () => this.renderResults());
      this.openSearchEl.addEventListener("click", () => this.openPicker());
      this.openButtonEl.addEventListener("click", () => this.openPicker());
      await this.refresh(this.options);
    }

    async refresh(options = this.options) {
      this.options = { ...this.options, ...options };
      if (!this.options.characterId) {
        this.effects = [];
        this.active = [];
        this.updateSearchVisibility();
        this.renderResults();
        this.renderActive();
        return;
      }
      const abilities = Array.isArray(this.options.activatableAbilities)
        ? this.options.activatableAbilities
        : [];
      this.effects = abilities;
      const saved = this.options.loadActiveEffects
        ? await this.options.loadActiveEffects()
        : await PFApp.loadBuffState(
            this.options.contextKey,
            this.options.characterId,
          );
      this.active = Array.isArray(saved) ? saved : saved?.buffs || [];
      this.updateSearchVisibility();
      this.renderResults();
      this.renderActive();
    }

    updateSearchVisibility() {
      const hasActivations = Boolean(this.options.characterId && this.effects.length);
      this.addShellEl?.classList.toggle("d-none", !hasActivations);
    }

    showStatus(message, type = "muted") {
      const status = document.getElementById(`${this.prefix}RequestStatus`);
      if (!status) return;
      status.className = `small mb-2 text-${type}`;
      status.textContent = message;
      status.classList.toggle("d-none", !message);
    }

    openPicker() {
      if (!this.options.characterId) return;
      this.searchEl.value = "";
      this.renderResults();
      this.pickerModalEl.addEventListener(
        "shown.bs.modal",
        () => {
          this.searchEl?.focus();
          this.searchEl?.select();
        },
        { once: true },
      );
      bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show();
      setTimeout(() => {
        if (document.activeElement !== this.searchEl) this.searchEl?.focus();
      }, 250);
    }

    renderResults() {
      if (!this.resultsEl) return;
      const term = this.searchEl?.value.trim().toLowerCase() || "";
      const matches = this.effects.filter(
        (effect) => !term || searchText(effect).includes(term),
      );

      if (!matches.length) {
        this.resultsEl.innerHTML = `<div class="small-text">No matching effects found.</div>`;
        return;
      }

      this.resultsEl.innerHTML = matches
        .map((effect) => {
          const index = this.effects.indexOf(effect);
          const allChips = [
            ...(effect.bonuses || []).map(bonusText),
            ...(effect.damageReduction || []).map(
              (dr) =>
                `DR ${Number(dr.amount || 0)}/${String(dr.overcomeType || "").trim() || "-"}`,
            ),
            ...(effect.spellResistance || []).map(
              (sr) =>
                `SR ${Number(sr.amount || 0)}${sr.conditional ? ` (${sr.appliesWhen || "conditional"})` : ""}`,
            ),
            ...(effect.immunities || []).map(immunityText),
            ...(effect.applyConditions || []).map(applyConditionText),
            ...(effect.classSkillGrants || []).map((grant) =>
              window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat),
            ),
            ...(effect.bonusRanks || []).map((entry) =>
              window.PFEffectEditor.bonusRanksText(entry),
            ),
            ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
            ...(effect.featGrants || []).map(featGrantText),
            ...(effect.spellLikeAbilities || []).map(spellLikeText),
            ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
            ...(effect.spellDcBonuses || []).map(spellDcBonusText),
            ...(effect.effectiveAttributeBonuses || []).map(
              effectiveAttributeBonusText,
            ),
            ...(effect.grantDomains || []).map(grantDomainText),
            ...(effect.generatedEquipment || []).map(
              (item) =>
                `Generates ${item.type || "equipment"}: ${
                  item.name || item.item || "Generated item"
                }`,
            ),
            ...(this.choicePools(effect) || []).map(
              (pool) =>
                `${pool.name || "Choice"}: ${
                  Array.isArray(pool.options) ? pool.options.length : 0
                } options`,
            ),
          ];
          const chips = allChips.slice(0, 8);
          const bonusHtml = chips.length
            ? chips
                .map(
                  (text) =>
                    `<span class="effect-tracker-chip">${escapeHtml(text)}</span>`,
                )
                .join("")
            : `<span class="small-text">No numerical changes</span>`;
          const more =
            allChips.length > chips.length
              ? `<span class="small-text">+${allChips.length - chips.length} more</span>`
              : "";
          const abilitySource =
            effect.fromAbility && effect.source
              ? `<div class="small-text mb-2">${escapeHtml(effect.source)}</div>`
              : "";
          return `
          <article class="effect-tracker-card${effect.fromAbility ? " effect-tracker-card-ability" : ""}" role="button" tabindex="0" data-effect-index="${index}">
            ${effect.fromAbility ? `<span class="effect-tracker-ability-badge">Your Feature</span>` : ""}
            <span class="effect-tracker-icon" title="${escapeHtml(effect.category || "Effect")}"><i class="bi ${categoryIcon(effect.category)}"></i></span>
            <div class="fw-semibold pe-2">${escapeHtml(effect.name)}</div>
            <div class="small-text mb-2">${escapeHtml(effect.category || "Effect")} | ${escapeHtml(durationLabel(effect))}</div>
            ${abilitySource}
            <div>${bonusHtml}${more}</div>
            ${this.controls(effect, index)}
          </article>
        `;
        })
        .join("");

      this.resultsEl.querySelectorAll("[data-effect-index]").forEach((card) => {
        card.addEventListener("click", (event) => {
          if (
            event.target.closest(".effect-tracker-controls")
          )
            return;
          this.addEffect(Number(card.dataset.effectIndex));
        });
        card.addEventListener("keydown", (event) => {
          if (
            event.target.closest(".effect-tracker-controls")
          )
            return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          this.addEffect(Number(card.dataset.effectIndex));
        });
      });
    }

    controls(effect, index) {
      // Abilities carry their own resolved duration context (the
      // character's actual level/ability mods), so there's nothing to ask
      // the player to type in -- just activate it.
      const needsCl = durationUsesCasterLevel(effect) && !effect.fromAbility;
      const condition = isCondition(effect);
      return `
        <div class="effect-tracker-controls">
          ${
            needsCl
              ? `
            <label class="small effect-tracker-inline">CL
              <input id="${this.prefix}Cl${index}" class="form-control form-control-sm" type="number" min="1" value="1">
            </label>
          `
              : ""
          }
          ${
            condition
              ? `
            <label class="small effect-tracker-inline">Turns
              <input id="${this.prefix}Turns${index}" class="form-control form-control-sm" type="number" min="1" value="1">
            </label>
          `
              : ""
          }
          <label class="form-check small">
            <input id="${this.prefix}Permanent${index}" class="form-check-input" type="checkbox">
            <span class="form-check-label">Permanent</span>
          </label>
        </div>
      `;
    }

    // Resolves any "choice:<poolId>" stats within a list of stat-bearing
    // items into concrete stats by prompting the player -- used for both
    // an effect's bonuses (e.g. Ancestor Totem, Lesser bundled into
    // Rage: "+2 insight to a skill of your choice") and its
    // classSkillGrants (a trait/rage power saying "choose a skill; it
    // becomes a class skill"), since both carry the exact same
    // { stat, skillName? } shape. Returns the resolved list, or null if
    // the player cancelled a pick.
    async resolveChoiceStats(items, effect) {
      const list = Array.isArray(items) ? items : [];
      if (!list.some((item) => window.PFEffectStats?.isChoiceStat(item.stat)))
        return list;
      const resolved = [];
      for (const item of list) {
        if (!window.PFEffectStats?.isChoiceStat(item.stat)) {
          resolved.push(item);
          continue;
        }
        const poolId = window.PFEffectStats.choicePoolIdFromStat(item.stat);
        const pool = window.PFEffectStats.poolById(poolId);
        const options = await window.PFEffectStats.resolveChoicePoolOptions(
          poolId,
          {
            skills: this.options.choicePoolSkills,
            choicePool: item.choicePool,
          },
        );
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose ${pool?.label || "a Target"}`,
              options,
            })
          : null;
        if (!picked) return null;
        resolved.push(
          typeof picked === "object"
            ? { ...item, stat: picked.value, skillName: picked.skillName }
            : { ...item, stat: picked },
        );
      }
      return resolved;
    }

    async resolveChoiceBonuses(effect) {
      return this.resolveChoiceStats(effect.bonuses, effect);
    }

    bonusUsesFavoredEnemyScale(bonus = {}) {
      const source = (bonus.bonusScale || bonus.scale || {}).source || {};
      return (
        source.type === "special" && source.special === "favored-enemy-bonus"
      );
    }

    favoredEnemyScaleTarget(bonus = {}) {
      return (
        bonus.bonusScale?.favoredEnemyTarget ||
        bonus.bonusScale?.target ||
        bonus.scale?.favoredEnemyTarget ||
        bonus.scale?.target ||
        bonus.favoredEnemyTarget ||
        bonus.targetFavoredEnemy ||
        ""
      );
    }

    needsFavoredEnemyScaleChoice(bonus = {}) {
      if (!this.bonusUsesFavoredEnemyScale(bonus)) return false;
      if (this.favoredEnemyScaleTarget(bonus)) return false;
      return (
        !bonus.appliesWhen ||
        /favou?red enemy|\{[^{}]+\}/i.test(bonus.appliesWhen)
      );
    }

    effectNeedsFavoredEnemyScaleChoice(effect = {}) {
      return (Array.isArray(effect.bonuses) ? effect.bonuses : []).some(
        (bonus) => this.needsFavoredEnemyScaleChoice(bonus),
      );
    }

    favoredEnemyOptions() {
      const source = this.options.favoredEnemyOptions;
      const options = typeof source === "function" ? source() : source;
      return Array.isArray(options) ? options : [];
    }

    favoredEnemyOptionsWithTargets(targets = []) {
      const byTarget = new Map();
      const add = (option = {}) => {
        const target = String(
          option.favoredEnemyTarget || option.name || option.value || option.label || "",
        )
          .replace(/\s*\([+-]?\d+\)\s*$/g, "")
          .trim();
        if (!target) return;
        const key = target.toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (!key || byTarget.has(key)) return;
        byTarget.set(key, {
          ...option,
          value: target,
          name: target,
          favoredEnemyTarget: target,
          label: target,
        });
      };
      this.favoredEnemyOptions().forEach(add);
      targets.forEach((target) =>
        add({
          value: target,
          label: target,
          name: target,
          favoredEnemyTarget: target,
        }),
      );
      return [...byTarget.values()].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    }

    conditionalChoiceLabel(choices = {}, key = "") {
      const wanted = this.normalizeConditionalVariableKey(key);
      if (!wanted) return "";
      const entry = Object.entries(choices || {}).find(
        ([choiceKey]) =>
          this.normalizeConditionalVariableKey(choiceKey) === wanted,
      )?.[1];
      return wanted.startsWith("favored enemy")
        ? this.cleanFavoredEnemyLabel(entry?.value || entry?.name || entry?.label || "")
        : entry?.label || entry?.name || entry?.value || "";
    }

    async resolveFavoredEnemyScaleTargets(items, effect = {}) {
      const list = Array.isArray(items) ? items : [];
      if (!list.some((item) => this.needsFavoredEnemyScaleChoice(item)))
        return list;
      const options = this.favoredEnemyOptions();
      if (!options.length) {
        this.showStatus(
          "Choose this character's favored enemy first, then apply this favored-enemy-scaled effect.",
          "warning",
        );
        return null;
      }
      const resolved = [];
      for (const item of list) {
        if (!this.needsFavoredEnemyScaleChoice(item)) {
          resolved.push(item);
          continue;
        }
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose Favored Enemy`,
              options,
            })
          : null;
        if (!picked) return null;
        const target =
          typeof picked === "object"
            ? picked.favoredEnemyTarget || picked.name || picked.value
            : String(picked || "");
        if (!target) return null;
        const scale = item.bonusScale || item.scale || {};
        resolved.push({
          ...item,
          bonusScale: {
            ...scale,
            favoredEnemyTarget: target,
          },
          favoredEnemyTarget: target,
          conditional: true,
          appliesWhen:
            !item.appliesWhen ||
            /favou?red enemy|\{[^{}]+\}/i.test(item.appliesWhen)
              ? `against ${target}`
              : item.appliesWhen,
        });
      }
      return resolved;
    }

    conditionalVariables(effect = {}) {
      return Array.isArray(effect.conditionalVariables)
        ? effect.conditionalVariables
        : [];
    }

    normalizeConditionalVariableKey(value = "") {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ");
    }

    cleanFavoredEnemyLabel(value = "") {
      return String(value || "")
        .replace(/\s*\([+-]?\d+\)\s*$/g, "")
        .trim();
    }

    conditionalVariableTokenValue(key = "", choice = {}) {
      const fallback = choice?.label || choice?.name || choice?.value || "";
      return this.normalizeConditionalVariableKey(key).startsWith("favored enemy")
        ? this.cleanFavoredEnemyLabel(choice?.value || choice?.name || fallback)
        : fallback;
    }

    replaceConditionalVariableTokens(text = "", choices = {}) {
      return String(text || "").replace(/\{([^{}]+)\}/g, (match, key) => {
        const choice = choices[this.normalizeConditionalVariableKey(key)];
        return choice
          ? this.conditionalVariableTokenValue(key, choice) || match
          : match;
      });
    }

    interpolateConditionalVariables(value, choices = {}) {
      if (Array.isArray(value))
        return value.map((item) =>
          this.interpolateConditionalVariables(item, choices),
        );
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [
            key,
            this.interpolateConditionalVariables(entry, choices),
          ]),
        );
      }
      if (typeof value === "string")
        return this.replaceConditionalVariableTokens(value, choices);
      return value;
    }

    async resolveConditionalVariables(effect = {}) {
      const variables = this.conditionalVariables(effect)
        .map((variable) => ({
          ...variable,
          key: this.normalizeConditionalVariableKey(
            variable.key || variable.name || variable.label,
          ),
          poolId:
            variable.poolId ||
            variable.pool ||
            variable.source ||
            "ranger-favored-enemies",
        }))
        .filter((variable) => variable.key);
      if (!variables.length) return effect;
      const choices = { ...(effect.conditionalChoices || {}) };
      for (const variable of variables) {
        if (choices[variable.key]) continue;
        const pool = window.PFEffectStats?.conditionalVariablePoolById?.(
          variable.poolId,
        );
        const additionalTargets = [
          this.conditionalChoiceLabel(choices, "favored enemy"),
        ].filter(Boolean);
        const options =
          variable.poolId === "character-favored-enemies"
            ? this.favoredEnemyOptionsWithTargets(additionalTargets)
            : (await window.PFEffectStats?.resolveConditionalVariableOptions?.(
                variable.poolId,
              )) || [];
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose ${variable.label || variable.key}`,
              options,
            })
          : null;
        if (!picked) return null;
        const pickedValue =
          typeof picked === "object" ? picked.value : String(picked || "");
        const pickedOption =
          options.find((option) => String(option.value) === pickedValue) ||
          (typeof picked === "object" ? picked : null);
        choices[variable.key] = {
          value: pickedValue,
          label: pickedOption?.label || pickedValue,
          poolId: variable.poolId,
          poolLabel: pool?.label || variable.poolLabel || "",
        };
      }
      return this.interpolateConditionalVariables(
        {
          ...effect,
          conditionalVariables: variables,
          conditionalChoices: choices,
        },
        choices,
      );
    }

    spellLikeChoiceList(entry = {}) {
      return (
        entry.spellChoiceList ||
        window.PFEffectStats?.customSpellLikeListById?.(
          entry.spellChoiceListId || "",
        ) ||
        null
      );
    }

    async resolveSpellLikeAbilityChoices(entries, effect) {
      const list = Array.isArray(entries) ? entries : [];
      if (!list.some((entry) => this.spellLikeChoiceList(entry))) return list;
      const resolved = [];
      for (const entry of list) {
        const choiceList = this.spellLikeChoiceList(entry);
        if (!choiceList) {
          resolved.push(entry);
          continue;
        }
        const spells = (choiceList.items || []).map((item) => ({
          name: item.name || item.spellName || item.label || item.value,
          spellName: item.name || item.spellName || item.label || item.value,
        }));
        const picked = window.PFMagicSearchModal
          ? await window.PFMagicSearchModal.open({
              title: `${effect.name || "Effect"}: Choose SLA`,
              spells,
            })
          : null;
        if (!picked) return null;
        const { spellChoiceList, spellChoiceListId, ...rest } = entry;
        resolved.push({
          ...rest,
          spellName: picked.name || picked.spellName || "Spell",
        });
      }
      return resolved;
    }

    spellAdjustmentEntriesNeedChoice(entries = []) {
      return (Array.isArray(entries) ? entries : []).some((entry) =>
        window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(entry),
      );
    }

    async resolveSpellAdjustmentChoices(entries = [], effect = {}) {
      const list = Array.isArray(entries) ? entries : [];
      if (!this.spellAdjustmentEntriesNeedChoice(list)) return list;
      if (!window.PFEffectEditor?.resolveSpellAdjustmentChoices) return null;
      return window.PFEffectEditor.resolveSpellAdjustmentChoices(list, {
        title: effect.name || "Effect",
      });
    }

    grantDomainEntriesNeedChoice(entries = []) {
      return (Array.isArray(entries) ? entries : []).some((entry) =>
        window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(entry),
      );
    }

    async resolveGrantDomainChoices(entries = [], effect = {}) {
      const list = Array.isArray(entries) ? entries : [];
      if (!this.grantDomainEntriesNeedChoice(list)) return list;
      if (!window.PFEffectEditor?.resolveGrantDomainChoices) return null;
      return window.PFEffectEditor.resolveGrantDomainChoices(list, {
        title: effect.name || "Effect",
      });
    }

    choicePools(effect = {}) {
      return Array.isArray(effect.choicePools)
        ? effect.choicePools
        : Array.isArray(effect.pools)
          ? effect.pools
          : [];
    }

    appendChoicePoolMechanics(target = {}, option = {}) {
      const effects = Array.isArray(option.effects)
        ? option.effects
        : Array.isArray(option.bonuses)
          ? option.bonuses
          : [];
      if (effects.length) {
        target.bonuses = [
          ...(Array.isArray(target.bonuses) ? target.bonuses : []),
          ...effects,
        ];
      }
      CHOICE_POOL_MECHANIC_KEYS.forEach((key) => {
        const rows = Array.isArray(option[key]) ? option[key] : [];
        if (!rows.length) return;
        target[key] = [
          ...(Array.isArray(target[key]) ? target[key] : []),
          ...rows,
        ];
      });
    }

    async resolveChoicePoolOptionMechanics(option = {}, effect = {}) {
      const choiceResolvedEffects = await this.resolveChoiceStats(
        option.effects || option.bonuses,
        effect,
      );
      if (choiceResolvedEffects === null) return null;
      const resolvedEffects = await this.resolveFavoredEnemyScaleTargets(
        choiceResolvedEffects,
        effect,
      );
      if (resolvedEffects === null) return null;
      const resolvedClassSkillGrants = await this.resolveChoiceStats(
        option.classSkillGrants,
        effect,
      );
      if (resolvedClassSkillGrants === null) return null;
      const resolvedBonusRanks = await this.resolveChoiceStats(
        option.bonusRanks,
        effect,
      );
      if (resolvedBonusRanks === null) return null;
      const resolvedSpellLikeAbilities =
        await this.resolveSpellLikeAbilityChoices(
          option.spellLikeAbilities,
          effect,
        );
      if (resolvedSpellLikeAbilities === null) return null;
      const resolvedCasterLevelBonuses = await this.resolveSpellAdjustmentChoices(
        option.casterLevelBonuses,
        effect,
      );
      if (resolvedCasterLevelBonuses === null) return null;
      const resolvedSpellDcBonuses = await this.resolveSpellAdjustmentChoices(
        option.spellDcBonuses,
        effect,
      );
      if (resolvedSpellDcBonuses === null) return null;
      const resolvedEffectiveAttributeBonuses =
        await this.resolveSpellAdjustmentChoices(
          option.effectiveAttributeBonuses,
          effect,
        );
      if (resolvedEffectiveAttributeBonuses === null) return null;
      const resolvedGrantDomains = await this.resolveGrantDomainChoices(
        option.grantDomains,
        effect,
      );
      if (resolvedGrantDomains === null) return null;
      return {
        ...option,
        effects: resolvedEffects,
        classSkillGrants: resolvedClassSkillGrants,
        bonusRanks: resolvedBonusRanks,
        spellLikeAbilities: resolvedSpellLikeAbilities,
        casterLevelBonuses: resolvedCasterLevelBonuses,
        spellDcBonuses: resolvedSpellDcBonuses,
        effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses,
        grantDomains: resolvedGrantDomains,
      };
    }

    async resolveChoicePools(effect = {}) {
      const pools = this.choicePools(effect);
      if (!pools.length) return {};
      if (!window.PFClassFeatureChoicePicker) return null;
      const mechanics = {};
      const poolChoices = {};
      for (const [index, pool] of pools.entries()) {
        const poolKey = pool.name || `Choice ${index + 1}`;
        const choice = await PFClassFeatureChoicePicker.open({
          title: `${effect.name || "Effect"}: ${pool.name || "Choose Feature"}`,
          poolName: pool.name || "Effect Choice",
          description: pool.description || "",
          selected: effect.poolChoices?.[poolKey] || "",
          options: Array.isArray(pool.options) ? pool.options : [],
        });
        if (choice === null) return null;
        if (!choice) continue;
        const option = (pool.options || []).find((item) => item.name === choice);
        if (!option) continue;
        const resolvedOption = await this.resolveChoicePoolOptionMechanics(
          option,
          effect,
        );
        if (!resolvedOption) return null;
        poolChoices[poolKey] = choice;
        this.appendChoicePoolMechanics(mechanics, resolvedOption);
      }
      return { poolChoices, mechanics };
    }

    effectHasOwnMechanics(effect = {}) {
      return Boolean(
        (Array.isArray(effect.bonuses) && effect.bonuses.length) ||
          (Array.isArray(effect.damageReduction) &&
            effect.damageReduction.length) ||
          (Array.isArray(effect.spellResistance) &&
            effect.spellResistance.length) ||
          (Array.isArray(effect.immunities) && effect.immunities.length) ||
          (Array.isArray(effect.classSkillGrants) &&
            effect.classSkillGrants.length) ||
          (Array.isArray(effect.bonusRanks) && effect.bonusRanks.length) ||
          (Array.isArray(effect.extraRanksPerLevel) &&
            effect.extraRanksPerLevel.length) ||
          (Array.isArray(effect.featGrants) &&
            effect.featGrants.length) ||
          (Array.isArray(effect.sizeChanges) && effect.sizeChanges.length) ||
          (Array.isArray(effect.spellLikeAbilities) &&
            effect.spellLikeAbilities.length) ||
          (Array.isArray(effect.casterLevelBonuses) &&
            effect.casterLevelBonuses.length) ||
          (Array.isArray(effect.spellDcBonuses) &&
            effect.spellDcBonuses.length) ||
          (Array.isArray(effect.effectiveAttributeBonuses) &&
            effect.effectiveAttributeBonuses.length) ||
          (Array.isArray(effect.grantDomains) &&
            effect.grantDomains.length) ||
          (Array.isArray(effect.generatedEquipment) &&
            effect.generatedEquipment.length) ||
          this.conditionalVariables(effect).length ||
          this.choicePools(effect).length,
      );
    }

    async expandAppliedConditions(effect = {}) {
      const entries = Array.isArray(effect.applyConditions)
        ? effect.applyConditions
        : [];
      if (!entries.length) return [effect];
      const { byName, byId } = await conditionDefinitionMaps();
      const conditions = entries
        .map((entry) => {
          const embedded =
            entry.condition && typeof entry.condition === "object"
              ? entry.condition
              : null;
          const condition =
            embedded ||
            byId.get(String(entry.conditionId || entry.id || "")) ||
            byName.get(conditionName(entry).toLowerCase()) ||
            entry;
          const name = condition.name || conditionName(entry);
          if (!name) return null;
          return {
            ...condition,
            id:
              condition.id ||
              entry.conditionId ||
              `applied-condition:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name,
            category: "Condition",
            source: effect.name || effect.source || "Effect",
            sourceEffectId: effect.id || effect.sourceEffectId || "",
            casterLevel: effect.casterLevel,
            turns: isCondition(effect)
              ? effect.turns
              : Math.max(1, Number(effect.remaining || effect.turns || 1)),
            permanent: effect.permanent,
            remaining: effect.remaining,
            computedDuration: effect.computedDuration,
            durationLabel: effect.durationLabel,
          };
        })
        .filter(Boolean);
      const { applyConditions, ...parent } = effect;
      return [
        ...(this.effectHasOwnMechanics(parent) ? [parent] : []),
        ...conditions,
      ];
    }

    async addActiveEffectWithFearEscalation(effect) {
      if (!isCondition(effect)) {
        this.active.push(effect);
        return;
      }
      const incomingRank = fearRank(effect);
      if (incomingRank < 0) {
        this.active.push(effect);
        return;
      }
      const existingFear = this.active
        .map((active, index) => ({ active, index, rank: fearRank(active) }))
        .filter((entry) => isCondition(entry.active) && entry.rank >= 0);
      const highestExistingRank = existingFear.reduce(
        (highest, entry) => Math.max(highest, entry.rank),
        -1,
      );
      const finalRank =
        highestExistingRank >= 0
          ? Math.min(2, Math.max(highestExistingRank, incomingRank) + 1)
          : incomingRank;
      const { byName } = await conditionDefinitionMaps();
      const finalName = titleCaseConditionName(FEAR_CONDITIONS[finalRank]);
      const finalDefinition =
        byName.get(finalName.toLowerCase()) ||
        (finalRank === incomingRank ? effect : {});
      this.active = this.active.filter(
        (_, index) => !existingFear.some((entry) => entry.index === index),
      );
      this.active.push({
        ...effect,
        ...finalDefinition,
        name: finalDefinition.name || finalName,
        category: "Condition",
        source: effect.source || effect.name || "Fear effect",
        escalatedFrom: [
          ...existingFear.map((entry) => conditionName(entry.active)),
          conditionName(effect),
        ].filter(Boolean),
      });
    }

    async addEffect(index) {
      const effect = this.effects[index];
      if (!effect || !this.options.characterId) return;
      const casterLevel = Math.max(
        1,
        Number.parseInt(
          document.getElementById(`${this.prefix}Cl${index}`)?.value,
          10,
        ) || 1,
      );
      const turns = Math.max(
        1,
        Number.parseInt(
          document.getElementById(`${this.prefix}Turns${index}`)?.value,
          10,
        ) || 1,
      );
      const permanent = Boolean(
        document.getElementById(`${this.prefix}Permanent${index}`)?.checked,
      );
      const condition = isCondition(effect);
      const durationArg = effect.fromAbility
        ? effect.abilityContext || { casterLevel }
        : casterLevel;
      const baseDurationLabel = durationLabel(effect);
      const calculatedDuration = condition
        ? turns
        : parseDuration(effect, durationArg);
      const appliedDurationLabel = permanent
        ? "Permanent"
        : condition
          ? `${turns} turn${turns === 1 ? "" : "s"}`
          : calculatedDuration === null
            ? baseDurationLabel
            : effect.fromAbility
              ? `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`
              : durationUsesCasterLevel(effect)
                ? `${baseDurationLabel} | CL ${casterLevel}: ${formatDurationRounds(calculatedDuration)}`
                : `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`;

      // fromAbility/abilityContext are only there to drive duration/choice
      // resolution -- strip them so the saved active-effect entry matches
      // the normal buff shape instead of carrying the character's whole
      // stat block. Every duration/CL/turns/permanent decision is baked
      // in here, BEFORE the choice is resolved, so a request sent to
      // another player (see requestEffectChoice) only ever needs them to
      // answer "which skill/target", never redo any of this.
      const { fromAbility, abilityContext, ...persistedEffect } = effect;
      const finalizedEffect = {
        ...persistedEffect,
        casterLevel: fromAbility
          ? abilityContext?.characterLevel || casterLevel
          : casterLevel,
        turns: condition ? turns : undefined,
        permanent,
        remaining: permanent ? null : calculatedDuration,
        computedDuration: calculatedDuration,
        durationLabel: appliedDurationLabel,
      };

      const needsChoice = [
        ...(finalizedEffect.bonuses || []),
        ...(finalizedEffect.classSkillGrants || []),
        ...(finalizedEffect.bonusRanks || []),
      ].some((item) => window.PFEffectStats?.isChoiceStat(item.stat)) ||
        this.conditionalVariables(finalizedEffect).length > 0 ||
        this.effectNeedsFavoredEnemyScaleChoice(finalizedEffect) ||
        (finalizedEffect.spellLikeAbilities || []).some((entry) =>
          this.spellLikeChoiceList(entry),
        ) ||
        this.spellAdjustmentEntriesNeedChoice(finalizedEffect.casterLevelBonuses) ||
        this.spellAdjustmentEntriesNeedChoice(finalizedEffect.spellDcBonuses) ||
        this.spellAdjustmentEntriesNeedChoice(
          finalizedEffect.effectiveAttributeBonuses,
        ) ||
        this.grantDomainEntriesNeedChoice(finalizedEffect.grantDomains) ||
        this.choicePools(finalizedEffect).length > 0;
      if (needsChoice && this.options.isOwnCharacter === false) {
        await this.requestEffectChoice(finalizedEffect);
        return;
      }

      const choiceResolvedBonuses = await this.resolveChoiceStats(
        finalizedEffect.bonuses,
        finalizedEffect,
      );
      if (choiceResolvedBonuses === null) return;
      const resolvedBonuses = await this.resolveFavoredEnemyScaleTargets(
        choiceResolvedBonuses,
        finalizedEffect,
      );
      if (resolvedBonuses === null) return;
      const resolvedClassSkillGrants = await this.resolveChoiceStats(
        finalizedEffect.classSkillGrants,
        finalizedEffect,
      );
      if (resolvedClassSkillGrants === null) return;
      const resolvedBonusRanks = await this.resolveChoiceStats(
        finalizedEffect.bonusRanks,
        finalizedEffect,
      );
      if (resolvedBonusRanks === null) return;
      const resolvedSpellLikeAbilities =
        await this.resolveSpellLikeAbilityChoices(
          finalizedEffect.spellLikeAbilities,
          finalizedEffect,
        );
      if (resolvedSpellLikeAbilities === null) return;
      const resolvedCasterLevelBonuses = await this.resolveSpellAdjustmentChoices(
        finalizedEffect.casterLevelBonuses,
        finalizedEffect,
      );
      if (resolvedCasterLevelBonuses === null) return;
      const resolvedSpellDcBonuses = await this.resolveSpellAdjustmentChoices(
        finalizedEffect.spellDcBonuses,
        finalizedEffect,
      );
      if (resolvedSpellDcBonuses === null) return;
      const resolvedEffectiveAttributeBonuses =
        await this.resolveSpellAdjustmentChoices(
          finalizedEffect.effectiveAttributeBonuses,
          finalizedEffect,
        );
      if (resolvedEffectiveAttributeBonuses === null) return;
      const resolvedGrantDomains = await this.resolveGrantDomainChoices(
        finalizedEffect.grantDomains,
        finalizedEffect,
      );
      if (resolvedGrantDomains === null) return;
      const resolvedChoicePools = await this.resolveChoicePools(finalizedEffect);
      if (resolvedChoicePools === null) return;
      const { choicePools, pools, poolChoices, ...choiceResolvedEffect } =
        finalizedEffect;
      const activeEffect = {
        ...choiceResolvedEffect,
        bonuses: resolvedBonuses,
        ...(resolvedClassSkillGrants.length
          ? { classSkillGrants: resolvedClassSkillGrants }
          : {}),
        ...(resolvedBonusRanks.length ? { bonusRanks: resolvedBonusRanks } : {}),
        ...(resolvedSpellLikeAbilities.length
          ? { spellLikeAbilities: resolvedSpellLikeAbilities }
          : {}),
        ...(resolvedCasterLevelBonuses.length
          ? { casterLevelBonuses: resolvedCasterLevelBonuses }
          : {}),
        ...(resolvedSpellDcBonuses.length
          ? { spellDcBonuses: resolvedSpellDcBonuses }
          : {}),
        ...(resolvedEffectiveAttributeBonuses.length
          ? { effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses }
          : {}),
        ...(resolvedGrantDomains.length
          ? { grantDomains: resolvedGrantDomains }
          : {}),
      };
      this.appendChoicePoolMechanics(
        activeEffect,
        resolvedChoicePools.mechanics || {},
      );
      const variableResolvedEffect =
        await this.resolveConditionalVariables(activeEffect);
      if (variableResolvedEffect === null) return;
      const activeEffects = await this.expandAppliedConditions(
        variableResolvedEffect,
      );
      for (const nextEffect of activeEffects) {
        await this.addActiveEffectWithFearEscalation(nextEffect);
      }
      this.renderActive();
      this.notifyChange();
      this.queueSave();
      bootstrap.Modal.getInstance(this.pickerModalEl)?.hide();
    }

    // Applying a choice-needing effect to a character someone else
    // controls doesn't pick for them -- it queues a request that
    // player's own session picks up (see modals/pending-effect-choices.js)
    // and resolves on their end, so they're the one choosing which skill
    // an insight bonus lands on, not whoever cast it.
    async requestEffectChoice(finalizedEffect) {
      const status = document.getElementById(`${this.prefix}RequestStatus`);
      if (status) {
        status.textContent = "Sending choice to the player...";
        status.classList.remove("d-none", "text-danger");
      }
      const result = await window.PFApp?.createEffectChoiceRequest?.({
        contextKey: this.options.contextKey,
        characterId: this.options.characterId,
        ability: finalizedEffect,
      });
      if (!result?.ok) {
        if (status) {
          status.textContent =
            "Couldn't send this to the player -- try again.";
          status.classList.add("text-danger");
        }
        return;
      }
      if (status) {
        status.textContent = `Sent "${finalizedEffect.name || "effect"}" to the player -- waiting for them to choose.`;
      }
      bootstrap.Modal.getInstance(this.pickerModalEl)?.hide();
      this.watchEffectChoiceRequest(result.id, finalizedEffect);
    }

    // Polls the request this widget just sent so "waiting for player"
    // resolves into an actual active effect without the requester having
    // to do anything else -- caps out after ~30 minutes so a forgotten
    // request doesn't poll forever.
    watchEffectChoiceRequest(requestId, finalizedEffect, attempt = 0) {
      this._watchedRequests = this._watchedRequests || new Set();
      if (this._watchedRequests.has(requestId) || attempt > 300) return;
      const poll = async () => {
        if (this._watchedRequests.has(requestId)) return;
        const result = await window.PFApp?.loadEffectChoiceRequestStatus?.(
          requestId,
        );
        if (!result || result.status === "pending") {
          this._pollTimer = setTimeout(
            () =>
              this.watchEffectChoiceRequest(
                requestId,
                finalizedEffect,
                attempt + 1,
              ),
            6000,
          );
          return;
        }
        this._watchedRequests.add(requestId);
        const status = document.getElementById(`${this.prefix}RequestStatus`);
        if (result.status === "resolved" && Array.isArray(result.resolved_bonuses)) {
          const resolvedSpellLikeAbilities =
            await this.resolveSpellLikeAbilityChoices(
              finalizedEffect.spellLikeAbilities,
              finalizedEffect,
            );
          if (resolvedSpellLikeAbilities === null) return;
          const activeEffects = await this.expandAppliedConditions({
            ...finalizedEffect,
            bonuses: result.resolved_bonuses,
            ...(resolvedSpellLikeAbilities.length
              ? { spellLikeAbilities: resolvedSpellLikeAbilities }
              : {}),
          });
          for (const nextEffect of activeEffects) {
            await this.addActiveEffectWithFearEscalation(nextEffect);
          }
          this.renderActive();
          this.notifyChange();
          this.queueSave();
          if (status)
            status.textContent = `"${finalizedEffect.name || "Effect"}" applied -- the player chose their target.`;
        } else if (status) {
          status.textContent = `"${finalizedEffect.name || "Effect"}" request was cancelled.`;
        }
        if (status) setTimeout(() => status.classList.add("d-none"), 8000);
      };
      poll();
    }

    removeEffect(index) {
      if (isItemSourcedEffect(this.active[index])) return;
      this.active.splice(index, 1);
      this.renderActive();
      this.notifyChange();
      this.queueSave();
    }

    updateActiveDuration(index, patch = {}) {
      const effect = this.active[index];
      if (!effect) return;
      Object.assign(effect, patch);
      if (effect.permanent) {
        effect.remaining = null;
        effect.computedDuration = null;
      } else if (isCondition(effect)) {
        const turns = Math.max(1, Number(effect.turns || 1));
        effect.turns = turns;
        effect.remaining = turns;
        effect.computedDuration = turns;
      } else {
        const computedDuration = parseDuration(effect, effect.casterLevel || 1);
        effect.remaining = computedDuration;
        effect.computedDuration = computedDuration;
      }
      effect.durationLabel = appliedDurationLabel(effect);
      this.renderActive();
      this.notifyChange();
      this.queueSave();
    }

    activeAdjustmentControls(effect, index) {
      const needsCl = durationUsesCasterLevel(effect);
      const condition = isCondition(effect);
      if (!needsCl && !condition) return "";
      return `
        <div class="effect-active-adjustments">
          ${
            needsCl
              ? `
            <label class="small effect-tracker-inline">CL
              <input class="form-control form-control-sm" type="number" min="1" value="${escapeHtml(effect.casterLevel || 1)}" data-active-cl="${index}">
            </label>
          `
              : ""
          }
          ${
            condition
              ? `
            <label class="small effect-tracker-inline">Turns
              <input class="form-control form-control-sm" type="number" min="1" value="${escapeHtml(effect.turns || effect.remaining || 1)}" data-active-turns="${index}">
            </label>
          `
              : ""
          }
        </div>
      `;
    }

    renderActive() {
      if (!this.activeEl) return;
      if (!this.options.characterId) {
        this.activeEl.innerHTML = `<div class="small-text">No character selected. Create or select a character to add effects.</div>`;
        return;
      }

      const activeCategories = [
        ...new Set(this.active.map((effect) => effect.category || "Effect")),
      ].sort(
        (a, b) =>
          activeCategoryRank(a) - activeCategoryRank(b) ||
          String(a).localeCompare(String(b)),
      );
      const filterOptions = ["all", ...activeCategories];
      if (!filterOptions.includes(this.activeTypeFilter))
        this.activeTypeFilter = "all";
      const filteredActive = this.active
        .map((effect, index) => ({ effect, index }))
        .filter(
          (row) =>
            this.activeTypeFilter === "all" ||
            row.effect.category === this.activeTypeFilter,
        );
      sortActiveRows(filteredActive);

      const toolbar = `
        <div class="effect-active-toolbar">
          <div class="small-text">${this.active.length} active effect${this.active.length === 1 ? "" : "s"}</div>
          <div>
            <label class="small" for="${this.prefix}ActiveTypeFilter">Type</label>
            <select id="${this.prefix}ActiveTypeFilter" class="form-select form-select-sm">
              ${filterOptions.map((type) => `<option value="${escapeHtml(type)}" ${this.activeTypeFilter === type ? "selected" : ""}>${escapeHtml(type === "all" ? "All" : type)}</option>`).join("")}
            </select>
          </div>
        </div>
      `;

      if (!this.active.length) {
        this.activeEl.innerHTML = `${toolbar}<div class="small-text">No active effects.</div>`;
        this.bindActiveFilter();
        return;
      }
      if (!filteredActive.length) {
        this.activeEl.innerHTML = `${toolbar}<div class="small-text">No active effects match this type.</div>`;
        this.bindActiveFilter();
        return;
      }

      const renderRow = ({ effect, index }) => {
        const detailsId = `${this.prefix}Details${index}`;
        const detailLines = [
          ...(effect.bonuses || []).map(bonusText),
          ...(effect.damageReduction || []).map(
            (dr) =>
              `DR ${Number(dr.amount || 0)}/${String(dr.overcomeType || "").trim() || "-"}`,
          ),
          ...(effect.spellResistance || []).map(
            (sr) =>
              `SR ${Number(sr.amount || 0)}${sr.conditional ? ` (${sr.appliesWhen || "conditional"})` : ""}`,
          ),
          ...(effect.immunities || []).map(immunityText),
          ...(effect.applyConditions || []).map(applyConditionText),
          ...(effect.classSkillGrants || []).map((grant) =>
            window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat),
          ),
          ...(effect.bonusRanks || []).map((entry) =>
            window.PFEffectEditor.bonusRanksText(entry),
          ),
          ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
          ...(effect.featGrants || []).map(featGrantText),
          ...(effect.spellLikeAbilities || []).map(spellLikeText),
          ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
          ...(effect.spellDcBonuses || []).map(spellDcBonusText),
          ...(effect.effectiveAttributeBonuses || []).map(
            effectiveAttributeBonusText,
          ),
          ...(effect.grantDomains || []).map(grantDomainText),
          ...(effect.generatedEquipment || []).map(
            (item) =>
              `Generates ${item.type || "equipment"}: ${
                item.name || item.item || "Generated item"
              }`,
          ),
        ];
        const bonuses = detailLines
          .map((text) => `<div class="small-text">${escapeHtml(text)}</div>`)
          .join("");
        const lockedToItem = isItemSourcedEffect(effect);
        return `
          <article class="effect-tracker-active">
            <div class="effect-active-head">
              <div>
                <strong>${escapeHtml(effect.name)}</strong>
                <div class="small-text">${escapeHtml(effect.category || "Effect")} | ${escapeHtml(activeDuration(effect))}</div>
                ${this.activeAdjustmentControls(effect, index)}
              </div>
              <div class="effect-active-actions">
                <button class="btn btn-outline-info btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#${detailsId}" aria-label="Show effect details">i</button>
                ${lockedToItem ? "" : `<button class="btn btn-danger btn-sm" type="button" data-remove-effect="${index}" aria-label="Remove effect"><i class="bi bi-trash"></i></button>`}
              </div>
            </div>
            <div id="${detailsId}" class="collapse mt-2">${bonuses || '<div class="small-text">No mechanical bonuses listed.</div>'}</div>
          </article>
        `;
      };
      this.activeEl.innerHTML =
        toolbar +
        groupedActiveRows(filteredActive)
          .map(
            (group) => `
        <section class="effect-active-group">
          <div class="effect-active-group-title">${escapeHtml(group.category)}</div>
          ${group.rows.map(renderRow).join("")}
        </section>
      `,
          )
          .join("");

      this.activeEl
        .querySelectorAll("[data-remove-effect]")
        .forEach((button) => {
          button.addEventListener("click", () =>
            this.removeEffect(Number(button.dataset.removeEffect)),
          );
        });
      this.activeEl.querySelectorAll("[data-active-cl]").forEach((input) => {
        input.addEventListener("change", () => {
          this.updateActiveDuration(Number(input.dataset.activeCl), {
            casterLevel: Math.max(1, Number.parseInt(input.value, 10) || 1),
          });
        });
      });
      this.activeEl.querySelectorAll("[data-active-turns]").forEach((input) => {
        input.addEventListener("change", () => {
          this.updateActiveDuration(Number(input.dataset.activeTurns), {
            turns: Math.max(1, Number.parseInt(input.value, 10) || 1),
          });
        });
      });
      this.bindActiveFilter();
    }

    bindActiveFilter() {
      const filter = document.getElementById(`${this.prefix}ActiveTypeFilter`);
      filter?.addEventListener("change", () => {
        this.activeTypeFilter = filter.value || "all";
        this.renderActive();
      });
    }

    queueSave() {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(async () => {
        if (this.options.saveActiveEffects) {
          await this.options.saveActiveEffects([...this.active]);
        } else {
          await PFApp.saveBuffState(
            this.active,
            this.options.contextKey,
            this.options.characterId,
          );
          stamp(this.options.contextKey, this.options.characterId);
        }
        this.notifyChange();
      }, 250);
    }

    notifyChange() {
      this.options.onChange?.([...this.active]);
    }
  }

  window.PFEffectTracker = {
    mount(container, options) {
      const tracker = new EffectTracker(container, options);
      tracker.ready = tracker.mount();
      return tracker;
    },
  };
})();
