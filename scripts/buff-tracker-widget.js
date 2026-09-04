(function () {
  const STYLE_ID = "pf-effect-tracker-style";

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
      .effect-card-admin-actions { position: absolute; top: 44px; right: 10px; display: grid; gap: 4px; }
      .effect-card-admin-actions .btn { width: 28px; height: 28px; min-width: 0; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
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
      .shared-dr-row [data-scale-summary], .shared-sr-row [data-scale-summary] { grid-column: 1 / -1; }
      .shared-class-skill-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-class-skill-row .shared-named-skill-field { grid-column: 1 / -1; }
      .shared-spell-like-row { display: grid; grid-template-columns: minmax(72px, 0.35fr) minmax(140px, 0.65fr) minmax(180px, 1.4fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-spell-like-picker { display: flex; align-items: center; justify-content: space-between; min-height: 31px; gap: 8px; text-align: left; }
      .shared-spell-like-picker span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .shared-extra-accordion .accordion-item { background: transparent; border: 0; }
      .shared-extra-accordion .accordion-button { background: #242424; color: #ddd; padding: 8px 10px; font-size: 13px; }
      .shared-extra-accordion .accordion-button:not(.collapsed) { background: #2b2b2b; color: #fff; box-shadow: none; }
      .shared-extra-accordion .accordion-button::after { filter: invert(1) grayscale(1) brightness(1.6); }
      .shared-extra-accordion .accordion-body { background: #1e1e1e; border: 1px solid #333; border-top: 0; padding: 10px; }
      .shared-extra-subsection { margin-bottom: 14px; }
      .shared-extra-subsection:last-child { margin-bottom: 0; }
      @media (max-width: 700px) { .effect-duration-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .shared-bonus-row, .shared-bonus-condition-inline { grid-template-columns: 1fr 1fr; } .shared-bonus-condition-inline { grid-column: auto; } }
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
    "strength skill checks": "Skill: STR Checks",
    "dexterity skill checks": "Skill: DEX Checks",
    "constitution skill checks": "Skill: CON Checks",
    "intelligence skill checks": "Skill: INT Checks",
    "wisdom skill checks": "Skill: WIS Checks",
    "charisma skill checks": "Skill: CHA Checks",
    "craft skill checks": "Skill: Craft Checks",
    ...Object.fromEntries(
      PF_SKILLS.map((skill) => [
        `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
        `Skill: ${skill}`,
      ]),
    ),
  };
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const EFFECT_CATEGORIES = [
    "Spell",
    "Special Ability",
    "Feat",
    "Debuff",
    "Condition",
  ];
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
        perLevel: config.factors.some((factor) => factor.type === "caster"),
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
      ? config.factors.some((factor) => factor.type === "caster")
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
    const value = Number(bonus.value || 0);
    const scale = scaleText(bonus.bonusScale || bonus.scale);
    const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
    const text = `${fmt(value)} ${bonus.type || "untyped"} ${statLabel}${scale ? `; ${scale}` : ""}`;
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }

  function spellLikeText(entry = {}) {
    const spellName = entry.spellName || entry.spell?.name || "Spell";
    const minimumLevel = Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
    const levelText = minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
    return `SLA ${levelText}${entry.frequency ? `${entry.frequency}: ` : ""}${spellName}`;
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const sourceLabel = scale.source
      ? `${window.PFEffectMeta?.factorLabel?.(scale.source) || "level"}`
      : "CL";
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
    if (every.afterLevel && every.everyLevels && every.increase) {
      parts.push(
        `after ${sourceLabel} ${every.afterLevel}, every ${every.everyLevels}: ${fmt(Number(every.increase || 0))}`,
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
      ...(effect.spellLikeAbilities || []).map(spellLikeText),
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
      this.isAdmin = false;
      this.editingEffectId = null;
      this.deletingEffectId = null;
      this.activeTypeFilter = "all";
    }

    async mount() {
      injectStyles();
      this.container.innerHTML = `
        <div id="${this.prefix}AddShell" class="mb-3">
          <label class="small" for="${this.prefix}OpenSearch">Add Effect</label>
          <div class="d-flex gap-2">
            <input id="${this.prefix}OpenSearch" class="form-control form-control-sm effect-tracker-search-trigger" placeholder="Search and add..." readonly>
            <button id="${this.prefix}OpenButton" class="btn btn-outline-success btn-sm" type="button">Add</button>
            <button id="${this.prefix}CreateButton" class="btn btn-outline-info btn-sm" type="button">Create</button>
          </div>
        </div>
        <div id="${this.prefix}RequestStatus" class="small-text mb-2 d-none"></div>
        <h6>Active Effects</h6>
        <div id="${this.prefix}Active"></div>
        <div class="modal fade" id="${this.prefix}PickerModal" tabindex="-1" aria-labelledby="${this.prefix}PickerLabel" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable effect-search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}PickerLabel">Add Effect</h5>
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
        <div class="modal fade" id="${this.prefix}CustomModal" tabindex="-1" aria-labelledby="${this.prefix}CustomLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}CustomLabel">Create Effect</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="row g-2 mb-2">
                  <div class="col-md-4">
                    <label class="small" for="${this.prefix}CustomName">Name</label>
                    <input id="${this.prefix}CustomName" class="form-control form-control-sm" placeholder="Effect name">
                  </div>
                  <div class="col-md-4">
                    <label class="small" for="${this.prefix}CustomCategory">Type</label>
                    <select id="${this.prefix}CustomCategory" class="form-select form-select-sm">
                      ${EFFECT_CATEGORIES.map((category) => `<option value="${category}" ${category === "Spell" ? "selected" : ""}>${category}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="small">Duration</label>
                    <div class="d-flex gap-2 align-items-center">
                      <button id="${this.prefix}EditDuration" class="btn btn-outline-light btn-sm" type="button">Edit Duration</button>
                      <span id="${this.prefix}DurationSummary" class="small-text"></span>
                    </div>
                  </div>
                </div>
                <div class="accordion accordion-flush shared-extra-accordion mb-3" id="${this.prefix}EffectsAccordion"></div>
                <div id="${this.prefix}CustomStatus" class="small-text mt-2"></div>
              </div>
              <div class="modal-footer">
                <button id="${this.prefix}SaveCustom" class="btn btn-primary btn-sm" type="button">Save Effect</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal fade" id="${this.prefix}DeleteModal" tabindex="-1" aria-labelledby="${this.prefix}DeleteLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}DeleteLabel">Delete Effect</h5>
                <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-2">Delete <strong id="${this.prefix}DeleteName"></strong>?</p>
                <div class="small-text">This removes the effect definition from the database. Active copies already applied to characters may remain until removed.</div>
                <div id="${this.prefix}DeleteStatus" class="small-text mt-2"></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
                <button id="${this.prefix}ConfirmDelete" class="btn btn-danger btn-sm" type="button"><i class="bi bi-trash"></i> Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
      this.addShellEl = document.getElementById(`${this.prefix}AddShell`);
      this.openSearchEl = document.getElementById(`${this.prefix}OpenSearch`);
      this.openButtonEl = document.getElementById(`${this.prefix}OpenButton`);
      this.createButtonEl = document.getElementById(
        `${this.prefix}CreateButton`,
      );
      this.pickerModalEl = document.getElementById(`${this.prefix}PickerModal`);
      this.customModalEl = document.getElementById(`${this.prefix}CustomModal`);
      this.deleteModalEl = document.getElementById(`${this.prefix}DeleteModal`);
      this.customNameEl = document.getElementById(`${this.prefix}CustomName`);
      this.editDurationEl = document.getElementById(
        `${this.prefix}EditDuration`,
      );
      this.durationSummaryEl = document.getElementById(
        `${this.prefix}DurationSummary`,
      );
      this.customLabelEl = document.getElementById(`${this.prefix}CustomLabel`);
      this.effectsAccordion = window.PFEffectEditor.mountEffectsAccordion(
        document.getElementById(`${this.prefix}EffectsAccordion`),
        {
          idPrefix: `${this.prefix}Effects`,
          skills: this.options.choicePoolSkills,
          effectStats: this.options.effectStats,
          titleCaseStat,
          effectsKey: "bonuses",
          // Debuff/Condition effects default new bonus rows to a
          // stacking penalty -- but only while creating a brand-new
          // effect, never overriding an existing one's saved values.
          onEffectAdded: (row) => {
            if (!this.editingEffectId) this.applyCustomDefaults(row);
          },
        },
      );
      this.customCategoryEl = document.getElementById(
        `${this.prefix}CustomCategory`,
      );
      this.customStatusEl = document.getElementById(
        `${this.prefix}CustomStatus`,
      );
      this.saveCustomEl = document.getElementById(`${this.prefix}SaveCustom`);
      this.searchEl = document.getElementById(`${this.prefix}Search`);
      this.resultsEl = document.getElementById(`${this.prefix}Results`);
      this.activeEl = document.getElementById(`${this.prefix}Active`);
      this.deleteNameEl = document.getElementById(`${this.prefix}DeleteName`);
      this.deleteStatusEl = document.getElementById(
        `${this.prefix}DeleteStatus`,
      );
      this.durationEditor = window.PFEffectDurationEditor
        ? new window.PFEffectDurationEditor(this.prefix)
        : null;
      [this.pickerModalEl, this.customModalEl, this.deleteModalEl].forEach(
        (modal) => {
          if (modal && modal.parentElement !== document.body)
            document.body.appendChild(modal);
        },
      );
      this.searchEl.addEventListener("input", () => this.renderResults());
      this.openSearchEl.addEventListener("click", () => this.openPicker());
      this.openButtonEl.addEventListener("click", () => this.openPicker());
      this.createButtonEl.addEventListener("click", () => this.openCustom());
      document
        .getElementById(`${this.prefix}SaveCustom`)
        .addEventListener("click", () => this.saveCustomEffect());
      document
        .getElementById(`${this.prefix}ConfirmDelete`)
        .addEventListener("click", () => this.deleteEffect());
      this.customCategoryEl.addEventListener("change", () =>
        this.applyCustomDefaults(),
      );
      this.editDurationEl.addEventListener("click", () =>
        this.openDurationEditor(),
      );
      await this.refresh(this.options);
    }

    async refresh(options = this.options) {
      this.options = { ...this.options, ...options };
      this.isAdmin = (await PFApp.isAppAdmin?.()) || false;
      if (!this.options.characterId) {
        this.effects = [];
        this.active = [];
        this.updateSearchVisibility();
        this.renderResults();
        this.renderActive();
        return;
      }
      // Abilities from the character's own build (activatable class
      // features, with any linked pool choices already bundled in) are
      // listed ahead of the general library, since they're what this
      // character actually has rather than everything anyone's authored.
      const abilities = Array.isArray(this.options.activatableAbilities)
        ? this.options.activatableAbilities
        : [];
      this.effects = [...abilities, ...(await PFApp.loadBuffDefinitions())];
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
      const hasCharacter = Boolean(this.options.characterId);
      this.addShellEl?.classList.toggle("d-none", !hasCharacter);
    }

    openCustom() {
      if (!this.options.characterId) return;
      this.editingEffectId = null;
      this.customLabelEl.textContent = "Create Effect";
      this.customNameEl.value = "";
      this.customNameEl.disabled = false;
      this.customCategoryEl.value = "Spell";
      this.customCategoryEl.disabled = false;
      this.setDurationFields(
        { count: null, unit: "variable", factors: [] },
        false,
      );
      this.effectsAccordion.reset({});
      this.effectsAccordion.addEffect();
      this.saveCustomEl.textContent = "Save Effect";
      this.customStatus("");
      bootstrap.Modal.getOrCreateInstance(this.customModalEl).show();
    }

    openBonusEditor(index) {
      const effect = this.effects[index];
      if (!this.isAdmin || !effect?.id) return;

      this.editingEffectId = effect.id;
      this.customLabelEl.textContent = `Edit Effect: ${effect.name}`;
      this.customNameEl.value = effect.name || "";
      this.customNameEl.disabled = false;
      this.customCategoryEl.value = effect.category || "Spell";
      this.customCategoryEl.disabled = false;
      this.setDurationFields(
        effect.durationConfig || durationParts(effect),
        false,
      );
      this.effectsAccordion.reset(effect);
      if (
        !Array.isArray(effect.bonuses) ||
        (!effect.bonuses.length &&
          !effect.damageReduction?.length &&
          !effect.spellResistance?.length &&
          !effect.classSkillGrants?.length &&
          !effect.sizeChanges?.length &&
          !effect.spellLikeAbilities?.length)
      )
        this.effectsAccordion.addEffect();
      this.saveCustomEl.textContent = "Save Effect";
      this.customStatus("");

      bootstrap.Modal.getOrCreateInstance(this.customModalEl).show();
    }

    setDurationFields(parts, disabled) {
      this.durationConfig = window.PFEffectMeta?.normalizeDurationConfig
        ? window.PFEffectMeta.normalizeDurationConfig(parts)
        : {
            count: parts?.count || null,
            unit: parts?.unit || "variable",
            factors: parts?.perLevel ? [{ type: "caster" }] : [],
          };
      if (this.durationSummaryEl)
        this.durationSummaryEl.textContent = durationLabel({
          durationConfig: this.durationConfig,
        });
      if (this.editDurationEl) this.editDurationEl.disabled = disabled;
    }

    openDurationEditor() {
      if (!this.durationEditor) return;
      this.durationEditor.open(this.durationConfig, (config) => {
        this.setDurationFields(config, false);
      });
    }

    // With no row given, re-applies to every existing Effects row (used
    // when the category dropdown itself changes to Debuff/Condition).
    // With a row given, applies to just that freshly-added one.
    applyCustomDefaults(row) {
      const category = this.customCategoryEl.value;
      if (!["Debuff", "Condition"].includes(category)) return;
      const rows = row
        ? [row]
        : [
            ...(document
              .getElementById(`${this.prefix}EffectsAccordion`)
              ?.querySelectorAll(".shared-bonus-row") || []),
          ];
      rows.forEach((r) => {
        const type = r.querySelector('[data-effect-field="type"]');
        const stacks = r.querySelector('[data-effect-field="stacks"]');
        if (type && type.value === "untyped") type.value = "penalty";
        if (stacks) stacks.checked = true;
      });
    }

    collectCustomEffect() {
      const durationConfig = window.PFEffectMeta?.normalizeDurationConfig
        ? window.PFEffectMeta.normalizeDurationConfig(this.durationConfig)
        : this.durationConfig || { count: null, unit: "variable", factors: [] };
      const durationUnit = durationConfig.unit || "variable";
      const durationCount = durationConfig.count || null;
      const durationPerLevel =
        durationConfig.factors?.some((factor) => factor.type === "caster") ||
        false;
      const duration = durationLabel({
        durationCount,
        durationUnit,
        durationPerLevel,
      });
      return {
        name: this.customNameEl.value.trim(),
        category: this.customCategoryEl.value || "Spell",
        duration,
        durationCount,
        durationUnit,
        durationPerLevel,
        durationConfig,
        contextKey: this.options.contextKey,
        ...this.effectsAccordion.collect(),
      };
    }

    customStatus(message, type = "muted") {
      if (!this.customStatusEl) return;
      this.customStatusEl.className = `small mt-2 text-${type}`;
      this.customStatusEl.textContent = message;
    }

    async saveCustomEffect() {
      const effect = this.collectCustomEffect();
      if (this.editingEffectId && !this.isAdmin) {
        this.customStatus("Only admins can edit bonuses.", "danger");
        return;
      }
      if (!effect.name) {
        this.customStatus("Name is required.", "warning");
        return;
      }
      if (
        !effect.bonuses.length &&
        !effect.damageReduction?.length &&
        !effect.spellResistance?.length &&
        !effect.classSkillGrants?.length &&
        !effect.sizeChanges?.length &&
        !effect.spellLikeAbilities?.length
      ) {
        this.customStatus("Add at least one effect or extra.", "warning");
        return;
      }

      const saved = this.editingEffectId
        ? await PFApp.updateBuffDefinition?.(this.editingEffectId, effect)
        : await PFApp.saveBuffDefinition(effect);
      if (!saved) {
        this.customStatus(
          this.editingEffectId
            ? "Could not update effect."
            : "Could not save effect.",
          "danger",
        );
        return;
      }
      this.effects = await PFApp.loadBuffDefinitions();
      this.renderResults();
      this.customStatus("Effect saved.", "success");
      bootstrap.Modal.getInstance(this.customModalEl)?.hide();
      this.editingEffectId = null;
    }

    openDeleteModal(index) {
      const effect = this.effects[index];
      if (!this.isAdmin || !effect?.id) return;
      this.deletingEffectId = effect.id;
      this.deleteNameEl.textContent = effect.name || "this effect";
      this.deleteStatus("");
      bootstrap.Modal.getOrCreateInstance(this.deleteModalEl).show();
    }

    deleteStatus(message, type = "muted") {
      if (!this.deleteStatusEl) return;
      this.deleteStatusEl.className = `small mt-2 text-${type}`;
      this.deleteStatusEl.textContent = message;
    }

    async deleteEffect() {
      if (!this.isAdmin || !this.deletingEffectId) return;
      const result = await PFApp.deleteBuffDefinition?.(this.deletingEffectId);
      if (result !== true && !result?.ok) {
        const message =
          result?.error?.message ||
          result?.error?.details ||
          result?.error?.hint ||
          JSON.stringify(result?.error || {});
        this.deleteStatus(
          message && message !== "{}"
            ? message
            : "Could not delete effect. Refresh the page and try again.",
          "danger",
        );
        return;
      }
      this.effects = await PFApp.loadBuffDefinitions();
      this.renderResults();
      this.deletingEffectId = null;
      bootstrap.Modal.getInstance(this.deleteModalEl)?.hide();
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
            ...(effect.classSkillGrants || []).map((grant) =>
              window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat),
            ),
            ...(effect.spellLikeAbilities || []).map(spellLikeText),
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
            ${
              this.isAdmin && !effect.fromAbility
                ? `
              <div class="effect-card-admin-actions">
                <button class="btn btn-outline-warning btn-sm" type="button" data-edit-bonuses="${index}" aria-label="Edit effect" title="Edit effect"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-outline-danger btn-sm" type="button" data-delete-effect="${index}" aria-label="Delete effect" title="Delete effect"><i class="bi bi-trash"></i></button>
              </div>
            `
                : ""
            }
            ${this.controls(effect, index)}
          </article>
        `;
        })
        .join("");

      this.resultsEl.querySelectorAll("[data-effect-index]").forEach((card) => {
        card.addEventListener("click", (event) => {
          if (
            event.target.closest(
              ".effect-tracker-controls, .effect-card-admin-actions",
            )
          )
            return;
          this.addEffect(Number(card.dataset.effectIndex));
        });
        card.addEventListener("keydown", (event) => {
          if (
            event.target.closest(
              ".effect-tracker-controls, .effect-card-admin-actions",
            )
          )
            return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          this.addEffect(Number(card.dataset.effectIndex));
        });
      });
      this.resultsEl
        .querySelectorAll("[data-edit-bonuses]")
        .forEach((button) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            this.openBonusEditor(Number(button.dataset.editBonuses));
          });
        });
      this.resultsEl
        .querySelectorAll("[data-delete-effect]")
        .forEach((button) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            this.openDeleteModal(Number(button.dataset.deleteEffect));
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
        resolved.push({ ...item, stat: picked });
      }
      return resolved;
    }

    async resolveChoiceBonuses(effect) {
      return this.resolveChoiceStats(effect.bonuses, effect);
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
      ].some((item) => window.PFEffectStats?.isChoiceStat(item.stat));
      if (needsChoice && this.options.isOwnCharacter === false) {
        await this.requestEffectChoice(finalizedEffect);
        return;
      }

      const resolvedBonuses = await this.resolveChoiceStats(
        finalizedEffect.bonuses,
        finalizedEffect,
      );
      if (resolvedBonuses === null) return;
      const resolvedClassSkillGrants = await this.resolveChoiceStats(
        finalizedEffect.classSkillGrants,
        finalizedEffect,
      );
      if (resolvedClassSkillGrants === null) return;
      this.active.push({
        ...finalizedEffect,
        bonuses: resolvedBonuses,
        ...(resolvedClassSkillGrants.length
          ? { classSkillGrants: resolvedClassSkillGrants }
          : {}),
      });
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
          this.active.push({
            ...finalizedEffect,
            bonuses: result.resolved_bonuses,
          });
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
          ...(effect.classSkillGrants || []).map((grant) =>
            window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat),
          ),
          ...(effect.spellLikeAbilities || []).map(spellLikeText),
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
