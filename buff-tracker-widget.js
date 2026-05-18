(function () {
  const STYLE_ID = "pf-effect-tracker-style";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .effect-tracker-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .effect-tracker-search-trigger { cursor: pointer; }
      .effect-tracker-card { position: relative; min-height: 116px; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 12px 44px 12px 12px; text-align: left; color: #f4f4f4; cursor: pointer; }
      .effect-tracker-card:hover, .effect-tracker-card:focus { border-color: #0d6efd; outline: none; box-shadow: 0 0 0 2px rgba(13, 110, 253, .25); }
      .effect-tracker-icon { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #151515; border: 1px solid #555; color: #9ec5fe; }
      .effect-tracker-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
      .effect-tracker-inline { display: inline-flex; align-items: center; gap: 4px; }
      .effect-tracker-inline input[type="number"] { width: 62px; }
      .effect-tracker-chip { display: inline-block; margin: 2px 3px 2px 0; color: #ddd; }
      .effect-tracker-active { background: #242424; border: 1px solid #444; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
      .effect-active-toolbar { display: flex; justify-content: space-between; align-items: end; gap: 10px; margin-bottom: 8px; }
      .effect-active-toolbar select { max-width: 180px; }
      .effect-duration-grid { display: grid; grid-template-columns: .75fr 1fr .7fr; gap: 8px; align-items: end; }
      .effect-toggle-field { min-height: 31px; display: flex; align-items: center; margin: 0; padding-left: 0; }
      .effect-toggle-field .form-check-input { width: 2.75rem; height: 1.4rem; margin-left: 0; cursor: pointer; }
      .effect-custom-row { position: relative; display: grid; grid-template-columns: 1.5fr .7fr 1fr .7fr auto; gap: 6px; align-items: end; padding: 10px 48px 10px 10px; background: #242424; border: 1px solid #444; border-radius: 8px; }
      .effect-named-skill-field { grid-column: 1 / -1; max-width: 280px; }
      .effect-row-delete { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
      .effect-condition-fields { grid-column: 1 / -1; display: grid; grid-template-columns: auto minmax(160px, 260px); gap: 8px; align-items: end; }
      .effect-condition-fields [data-field="appliesWhen"] { max-width: 260px; }
      .effect-scale-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; align-items: end; }
      @media (max-width: 700px) { .effect-duration-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .effect-custom-row { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .effect-tracker-grid { grid-template-columns: 1fr; } }
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
    cmb: "CMB",
    cmd: "CMD",
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA"
  };
  const EFFECT_STATS = ["strength","dexterity","constitution","intelligence","wisdom","charisma","attack","melee attack","ranged attack","damage","melee damage","ranged damage","ac","touch ac","flat-footed ac","natural armor","deflection","fortitude","reflex","will","initiative","cmb","cmd","hit points","spell resistance"];
  const SKILL_STATS = ["skill checks","strength skill checks","dexterity skill checks","constitution skill checks","intelligence skill checks","wisdom skill checks","charisma skill checks"];
  const PF_SKILLS = ["Acrobatics","Appraise","Bluff","Climb","Diplomacy","Disable Device","Disguise","Escape Artist","Fly","Heal","Intimidate","Knowledge (arcana)","Knowledge (dungeoneering)","Knowledge (engineering)","Knowledge (geography)","Knowledge (history)","Knowledge (local)","Knowledge (nature)","Knowledge (nobility)","Knowledge (planes)","Knowledge (religion)","Linguistics","Perception","Ride","Sense Motive","Sleight of Hand","Spellcraft","Stealth","Survival","Swim","Use Magic Device"];
  const SPECIFIC_SKILL_STATS = PF_SKILLS.map(skill => `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`);
  const SKILL_STAT_LABELS = {
    "skill checks": "Skill: All Checks",
    "strength skill checks": "Skill: STR Checks",
    "dexterity skill checks": "Skill: DEX Checks",
    "constitution skill checks": "Skill: CON Checks",
    "intelligence skill checks": "Skill: INT Checks",
    "wisdom skill checks": "Skill: WIS Checks",
    "charisma skill checks": "Skill: CHA Checks",
    ...Object.fromEntries(PF_SKILLS.map(skill => [`skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`, `Skill: ${skill}`]))
  };
  const CRAFT_SKILL_STAT = "skill:craft";
  const PROFESSION_SKILL_STAT = "skill:profession";
  const SPECIAL_SKILL_STATS = [CRAFT_SKILL_STAT, PROFESSION_SKILL_STAT];
  const BONUS_TYPES = ["untyped","alchemical","condition","penalty","armor","circumstance","competence","deflection","dodge","enhancement","insight","luck","morale","natural armor","profane","resistance","sacred","shield","size"];
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const EFFECT_CATEGORIES = ["Spell", "Special Ability", "Feat", "Debuff", "Condition"];

  function titleCaseStat(value) {
    const key = String(value || "").toLowerCase().trim();
    if (STAT_LABELS[key]) return STAT_LABELS[key];
    if (SKILL_STAT_LABELS[key]) return SKILL_STAT_LABELS[key];
    return key
      .split(" ")
      .map(word => STAT_LABELS[word] || word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function statOptionValue(data = {}) {
    const skillName = String(data.skillName || "").toLowerCase();
    if (skillName.startsWith("craft")) return CRAFT_SKILL_STAT;
    if (skillName.startsWith("profession")) return PROFESSION_SKILL_STAT;
    return data.stat || "";
  }

  function statOptions(data = {}) {
    const selected = statOptionValue(data);
    const option = (stat, label = titleCaseStat(stat)) =>
      `<option value="${stat}" ${selected === stat ? "selected" : ""}>${escapeHtml(label)}</option>`;
    return `
      <optgroup label="Stats">
        ${EFFECT_STATS.map(stat => option(stat)).join("")}
      </optgroup>
      <optgroup label="Skills">
        ${SKILL_STATS.map(stat => option(stat)).join("")}
        ${option(CRAFT_SKILL_STAT, "Skill: Craft")}
        ${option(PROFESSION_SKILL_STAT, "Skill: Profession")}
        ${SPECIFIC_SKILL_STATS.map(stat => option(stat)).join("")}
      </optgroup>
    `;
  }

  function skillKey(name) {
    return `skill:${String(name || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function namedSkill(kind, value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const prefix = kind === PROFESSION_SKILL_STAT ? "Profession" : "Craft";
    if (text.toLowerCase().startsWith(`${prefix.toLowerCase()} (`)) return text;
    return `${prefix} (${text})`;
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
    const text = String(duration || "").toLowerCase().trim();
    if (!text || text === "variable" || text === "permanent") {
      return { count: null, unit: "variable", perLevel: false };
    }
    const count = Number((text.match(/(\d+)/) || [null, 1])[1]) || 1;
    const unit = DURATION_UNITS.find(value => value !== "variable" && text.includes(value)) || "variable";
    const perLevel = text.includes("/level") || text.includes("per level");
    return { count, unit, perLevel };
  }

  function durationParts(effect) {
    const hasStructured = effect && (effect.durationCount !== undefined || effect.durationUnit || effect.durationPerLevel !== undefined);
    if (hasStructured) {
      return {
        count: effect.durationCount === null || effect.durationCount === undefined || effect.durationCount === "" ? null : Number(effect.durationCount),
        unit: effect.durationUnit || "variable",
        perLevel: Boolean(effect.durationPerLevel)
      };
    }
    return legacyDurationParts(effect?.duration);
  }

  function durationUsesCasterLevel(effect) {
    return durationParts(effect).perLevel;
  }

  function durationLabel(effect) {
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return "variable";
    const unit = `${parts.unit}${Number(parts.count) === 1 ? "" : "s"}`;
    return `${parts.count} ${unit}${parts.perLevel ? " / level" : ""}`;
  }

  function isCondition(effect) {
    return String(effect?.category || "").toLowerCase() === "condition";
  }

  function parseDuration(effect, casterLevel = 1) {
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return null;
    const amount = Number(parts.count) || 1;
    const multiplier = parts.perLevel ? Math.max(1, Number(casterLevel) || 1) : 1;
    if (parts.unit === "turn" || parts.unit === "round") return amount * multiplier;
    if (parts.unit === "minute") return amount * 10 * multiplier;
    if (parts.unit === "hour") return amount * 600 * multiplier;
    if (parts.unit === "day") return amount * 14400 * multiplier;
    return null;
  }

  function formatDurationRounds(rounds) {
    if (rounds === null || rounds === undefined) return "variable";
    if (rounds === 1) return "1 turn";
    if (rounds % 600 === 0) return `${rounds / 600} hour${rounds === 600 ? "" : "s"}`;
    if (rounds % 10 === 0) return `${rounds / 10} minute${rounds === 10 ? "" : "s"}`;
    return `${rounds} round${rounds === 1 ? "" : "s"}`;
  }

  function activeDuration(effect) {
    if (effect.permanent) return "Permanent";
    if (effect.durationLabel) return effect.durationLabel;
    if (effect.computedDuration !== undefined && effect.computedDuration !== null) return formatDurationRounds(effect.computedDuration);
    return durationLabel(effect);
  }

  function bonusText(bonus) {
    const value = Number(bonus.value || 0);
    const scale = scaleText(bonus.bonusScale || bonus.scale);
    const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
    const text = `${fmt(value)} ${bonus.type || "untyped"} ${statLabel}${scale ? `; ${scale}` : ""}`;
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    const milestoneText = milestones
      .filter(milestone => milestone.level && milestone.value !== "" && milestone.value !== null && milestone.value !== undefined)
      .map(milestone => `CL ${milestone.level}: ${fmt(Number(milestone.value || 0))}`);
    if (milestoneText.length) parts.push(milestoneText.join(", "));
    const every = scale.every || {};
    if (every.afterLevel && every.everyLevels && every.increase) {
      parts.push(`after CL ${every.afterLevel}, every ${every.everyLevels}: ${fmt(Number(every.increase || 0))}`);
    }
    return parts.length ? `scales ${parts.join("; ")}` : "";
  }

  function searchText(effect) {
    return [
      effect.name,
      effect.category,
      durationLabel(effect),
      ...(effect.bonuses || []).map(bonusText)
    ].join(" ").toLowerCase();
  }

  function stamp(contextKey, characterId) {
    const value = String(Date.now());
    localStorage.setItem(`pf_buffs_updated_${contextKey}`, value);
    if (characterId) localStorage.setItem(`pf_buffs_updated_${contextKey}_${characterId}`, value);
  }

  class EffectTracker {
    constructor(container, options) {
      this.container = container;
      this.options = options;
      this.effects = [];
      this.active = [];
      this.prefix = `effectTracker${Math.random().toString(36).slice(2)}`;
      this.saveTimer = null;
      this.customBonusCount = 0;
      this.isAdmin = false;
      this.editingEffectId = null;
      this.deletingEffectId = null;
      this.editingScaleRow = null;
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
        <h6>Active Effects</h6>
        <div id="${this.prefix}Active"></div>
        <div class="modal fade" id="${this.prefix}PickerModal" tabindex="-1" aria-labelledby="${this.prefix}PickerLabel" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}PickerLabel">Add Effect</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="small" for="${this.prefix}Search">Search</label>
                  <input id="${this.prefix}Search" class="form-control form-control-sm" placeholder="Name, type, or stat change">
                </div>
                <div id="${this.prefix}Results" class="effect-tracker-grid"></div>
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
                      ${EFFECT_CATEGORIES.map(category => `<option value="${category}" ${category === "Spell" ? "selected" : ""}>${category}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-md-4">
                    <div class="effect-duration-grid">
                      <div>
                        <label class="small" for="${this.prefix}DurationCount">Count</label>
                        <input id="${this.prefix}DurationCount" class="form-control form-control-sm" type="number" min="1" placeholder="--">
                      </div>
                      <div>
                        <label class="small" for="${this.prefix}DurationUnit">UOM</label>
                        <select id="${this.prefix}DurationUnit" class="form-select form-select-sm">
                          ${DURATION_UNITS.map(unit => `<option value="${unit}">${unit}</option>`).join("")}
                        </select>
                      </div>
                      <div>
                        <label class="small" for="${this.prefix}DurationPerLevel">Level</label>
                        <label class="form-check form-switch effect-toggle-field">
                          <input id="${this.prefix}DurationPerLevel" class="form-check-input" type="checkbox">
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="small-text mb-1">Bonuses</div>
                <div id="${this.prefix}CustomRows" class="vstack gap-2 mb-2"></div>
                <div id="${this.prefix}CustomStatus" class="small-text mt-2"></div>
              </div>
              <div class="modal-footer">
                <button id="${this.prefix}AddCustomBonus" class="btn btn-outline-light btn-sm" type="button">Add Bonus</button>
                <button id="${this.prefix}SaveCustom" class="btn btn-primary btn-sm" type="button">Save Effect</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal fade" id="${this.prefix}ScaleModal" tabindex="-1" aria-labelledby="${this.prefix}ScaleLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}ScaleLabel">Bonus Scale</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="small-text mb-2">Milestones</div>
                <div id="${this.prefix}ScaleRows" class="vstack gap-2 mb-3"></div>
                <button id="${this.prefix}AddScaleMilestone" class="btn btn-outline-light btn-sm mb-3" type="button">Add Milestone</button>
                <div class="small-text mb-2">Repeating Increase</div>
                <div class="row g-2">
                  <div class="col-md-4">
                    <label class="small" for="${this.prefix}ScaleAfter">After level</label>
                    <input id="${this.prefix}ScaleAfter" class="form-control form-control-sm" type="number" min="1" placeholder="X">
                  </div>
                  <div class="col-md-4">
                    <label class="small" for="${this.prefix}ScaleEvery">Every levels</label>
                    <input id="${this.prefix}ScaleEvery" class="form-control form-control-sm" type="number" min="1" placeholder="Y">
                  </div>
                  <div class="col-md-4">
                    <label class="small" for="${this.prefix}ScaleIncrease">Increase bonus by</label>
                    <input id="${this.prefix}ScaleIncrease" class="form-control form-control-sm" type="number" placeholder="Z">
                  </div>
                </div>
                <div id="${this.prefix}ScaleStatus" class="small-text mt-2"></div>
              </div>
              <div class="modal-footer">
                <button id="${this.prefix}ClearScale" class="btn btn-outline-danger btn-sm" type="button">Clear Scale</button>
                <button id="${this.prefix}SaveScale" class="btn btn-primary btn-sm" type="button">Save Scale</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal fade" id="${this.prefix}DeleteModal" tabindex="-1" aria-labelledby="${this.prefix}DeleteLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title" id="${this.prefix}DeleteLabel">Delete Effect</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
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
      this.createButtonEl = document.getElementById(`${this.prefix}CreateButton`);
      this.pickerModalEl = document.getElementById(`${this.prefix}PickerModal`);
      this.customModalEl = document.getElementById(`${this.prefix}CustomModal`);
      this.scaleModalEl = document.getElementById(`${this.prefix}ScaleModal`);
      this.deleteModalEl = document.getElementById(`${this.prefix}DeleteModal`);
      this.customNameEl = document.getElementById(`${this.prefix}CustomName`);
      this.durationCountEl = document.getElementById(`${this.prefix}DurationCount`);
      this.durationUnitEl = document.getElementById(`${this.prefix}DurationUnit`);
      this.durationPerLevelEl = document.getElementById(`${this.prefix}DurationPerLevel`);
      this.customLabelEl = document.getElementById(`${this.prefix}CustomLabel`);
      this.customRowsEl = document.getElementById(`${this.prefix}CustomRows`);
      this.customCategoryEl = document.getElementById(`${this.prefix}CustomCategory`);
      this.customStatusEl = document.getElementById(`${this.prefix}CustomStatus`);
      this.saveCustomEl = document.getElementById(`${this.prefix}SaveCustom`);
      this.searchEl = document.getElementById(`${this.prefix}Search`);
      this.resultsEl = document.getElementById(`${this.prefix}Results`);
      this.activeEl = document.getElementById(`${this.prefix}Active`);
      this.scaleRowsEl = document.getElementById(`${this.prefix}ScaleRows`);
      this.scaleAfterEl = document.getElementById(`${this.prefix}ScaleAfter`);
      this.scaleEveryEl = document.getElementById(`${this.prefix}ScaleEvery`);
      this.scaleIncreaseEl = document.getElementById(`${this.prefix}ScaleIncrease`);
      this.scaleStatusEl = document.getElementById(`${this.prefix}ScaleStatus`);
      this.deleteNameEl = document.getElementById(`${this.prefix}DeleteName`);
      this.deleteStatusEl = document.getElementById(`${this.prefix}DeleteStatus`);
      this.searchEl.addEventListener("input", () => this.renderResults());
      this.openSearchEl.addEventListener("click", () => this.openPicker());
      this.openButtonEl.addEventListener("click", () => this.openPicker());
      this.createButtonEl.addEventListener("click", () => this.openCustom());
      document.getElementById(`${this.prefix}AddCustomBonus`).addEventListener("click", () => this.addCustomBonusRow());
      document.getElementById(`${this.prefix}SaveCustom`).addEventListener("click", () => this.saveCustomEffect());
      document.getElementById(`${this.prefix}AddScaleMilestone`).addEventListener("click", () => this.addScaleMilestoneRow());
      document.getElementById(`${this.prefix}ClearScale`).addEventListener("click", () => this.clearScale());
      document.getElementById(`${this.prefix}SaveScale`).addEventListener("click", () => this.saveScale());
      document.getElementById(`${this.prefix}ConfirmDelete`).addEventListener("click", () => this.deleteEffect());
      this.customCategoryEl.addEventListener("change", () => this.applyCustomDefaults());
      this.durationUnitEl.addEventListener("change", () => this.syncDurationInputs());
      this.durationPerLevelEl.addEventListener("change", () => this.updateScaleButtons());
      await this.refresh(this.options);
    }

    async refresh(options = this.options) {
      this.options = { ...this.options, ...options };
      this.isAdmin = await PFApp.isAppAdmin?.() || false;
      if (!this.options.characterId) {
        this.effects = [];
        this.active = [];
        this.updateSearchVisibility();
        this.renderResults();
        this.renderActive();
        return;
      }
      this.effects = await PFApp.loadBuffDefinitions();
      const saved = this.options.loadActiveEffects
        ? await this.options.loadActiveEffects()
        : await PFApp.loadBuffState(this.options.contextKey, this.options.characterId);
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
      this.setDurationFields({ count: null, unit: "variable", perLevel: false }, false);
      this.customRowsEl.innerHTML = "";
      this.saveCustomEl.textContent = "Save Effect";
      this.customStatus("");
      if (!this.customRowsEl.children.length) this.addCustomBonusRow();
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
      this.setDurationFields(durationParts(effect), false);
      this.customRowsEl.innerHTML = "";
      this.saveCustomEl.textContent = "Save Effect";
      this.customStatus("");

      const bonuses = Array.isArray(effect.bonuses) ? effect.bonuses : [];
      if (bonuses.length) bonuses.forEach(bonus => this.addCustomBonusRow(bonus));
      else this.addCustomBonusRow();

      bootstrap.Modal.getOrCreateInstance(this.customModalEl).show();
    }

    setDurationFields(parts, disabled) {
      this.durationCountEl.value = parts?.count || "";
      this.durationCountEl.disabled = disabled;
      this.durationUnitEl.value = parts?.unit || "variable";
      this.durationUnitEl.disabled = disabled;
      this.durationPerLevelEl.checked = Boolean(parts?.perLevel);
      this.durationPerLevelEl.disabled = disabled;
      this.syncDurationInputs();
    }

    syncDurationInputs() {
      const variable = this.durationUnitEl.value === "variable";
      this.durationCountEl.disabled = this.durationUnitEl.disabled || variable;
      this.durationPerLevelEl.disabled = this.durationUnitEl.disabled || variable;
      if (variable) {
        this.durationCountEl.value = "";
        this.durationPerLevelEl.checked = false;
      }
      this.updateScaleButtons();
    }

    updateScaleButtons() {
      const enabled = this.durationPerLevelEl?.checked && this.durationUnitEl?.value !== "variable";
      this.customRowsEl?.querySelectorAll("[data-scale-bonus]").forEach(button => {
        button.classList.toggle("d-none", !enabled);
      });
    }

    addCustomBonusRow(data = {}) {
      const index = this.customBonusCount++;
      const row = document.createElement("div");
      row.className = "effect-custom-row";
      row.dataset.customBonusIndex = index;
      row.innerHTML = `
        <div>
          <label class="small">Stat</label>
          <select data-field="stat" class="form-select form-select-sm">
            ${statOptions(data)}
          </select>
        </div>
        <div class="effect-named-skill-field d-none">
          <label class="small">Skill Name</label>
          <input data-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
        </div>
        <div>
          <label class="small">Value</label>
          <input data-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? 0}">
        </div>
        <div>
          <label class="small">Type</label>
          <select data-field="type" class="form-select form-select-sm">
            ${BONUS_TYPES.map(type => `<option value="${type}" ${(data.type || "untyped") === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="small">Stacks</label>
          <label class="form-check form-switch effect-toggle-field">
            <input data-field="stacks" class="form-check-input" type="checkbox" ${data.stacks ? "checked" : ""}>
          </label>
        </div>
        <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Bonus Scale</button>
        <button class="btn btn-danger btn-sm effect-row-delete" type="button" aria-label="Delete bonus"><i class="bi bi-trash"></i></button>
        <div class="effect-condition-fields">
          <div>
            <label class="small">Conditional</label>
            <label class="form-check form-switch effect-toggle-field">
              <input data-field="conditional" class="form-check-input" type="checkbox" ${data.conditional ? "checked" : ""}>
            </label>
          </div>
          <div>
            <label class="small">Applies When</label>
            <input data-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(data.appliesWhen || "")}" placeholder="for example: vs melee, while charging">
          </div>
        </div>
      `;
      row._bonusScale = data.bonusScale || data.scale || null;
      const statSelect = row.querySelector('[data-field="stat"]');
      const namedSkillField = row.querySelector(".effect-named-skill-field");
      const skillNameInput = row.querySelector('[data-field="skillName"]');
      const syncNamedSkill = () => {
        const named = [CRAFT_SKILL_STAT, PROFESSION_SKILL_STAT].includes(statSelect.value);
        namedSkillField.classList.toggle("d-none", !named);
        skillNameInput.placeholder = statSelect.value === PROFESSION_SKILL_STAT ? "Sailor" : "Alchemy";
      };
      statSelect.addEventListener("change", syncNamedSkill);
      syncNamedSkill();
      row.querySelector("[data-scale-bonus]").addEventListener("click", () => this.openScaleModal(row));
      row.querySelector('button[aria-label="Delete bonus"]').addEventListener("click", () => row.remove());
      this.customRowsEl.appendChild(row);
      if (!this.editingEffectId) this.applyCustomDefaults(row);
      this.updateScaleButtons();
    }

    openScaleModal(row) {
      if (!this.durationPerLevelEl.checked || this.durationUnitEl.value === "variable") return;
      this.editingScaleRow = row;
      this.scaleRowsEl.innerHTML = "";
      this.scaleStatus("");
      const scale = row._bonusScale || {};
      const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
      if (milestones.length) milestones.forEach(milestone => this.addScaleMilestoneRow(milestone));
      else this.addScaleMilestoneRow();
      const every = scale.every || {};
      this.scaleAfterEl.value = every.afterLevel || "";
      this.scaleEveryEl.value = every.everyLevels || "";
      this.scaleIncreaseEl.value = every.increase ?? "";
      bootstrap.Modal.getOrCreateInstance(this.scaleModalEl).show();
    }

    addScaleMilestoneRow(data = {}) {
      const row = document.createElement("div");
      row.className = "effect-scale-row";
      row.innerHTML = `
        <div>
          <label class="small">Caster Level</label>
          <input data-scale-field="level" class="form-control form-control-sm" type="number" min="1" value="${data.level || ""}">
        </div>
        <div>
          <label class="small">Bonus Value</label>
          <input data-scale-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? ""}">
        </div>
        <button class="btn btn-danger btn-sm" type="button" aria-label="Delete scale milestone">Delete</button>
      `;
      row.querySelector("button").addEventListener("click", () => row.remove());
      this.scaleRowsEl.appendChild(row);
    }

    collectScale() {
      const milestones = [...this.scaleRowsEl.querySelectorAll(".effect-scale-row")]
        .map(row => ({
          level: Number.parseInt(row.querySelector('[data-scale-field="level"]').value, 10),
          value: Number(row.querySelector('[data-scale-field="value"]').value)
        }))
        .filter(milestone => milestone.level > 0 && Number.isFinite(milestone.value))
        .sort((a, b) => a.level - b.level);
      const afterLevel = Number.parseInt(this.scaleAfterEl.value, 10);
      const everyLevels = Number.parseInt(this.scaleEveryEl.value, 10);
      const increase = Number(this.scaleIncreaseEl.value);
      const every = afterLevel > 0 && everyLevels > 0 && Number.isFinite(increase) && increase !== 0
        ? { afterLevel, everyLevels, increase }
        : null;
      if (!milestones.length && !every) return null;
      return { milestones, every };
    }

    scaleStatus(message, type = "muted") {
      if (!this.scaleStatusEl) return;
      this.scaleStatusEl.className = `small mt-2 text-${type}`;
      this.scaleStatusEl.textContent = message;
    }

    clearScale() {
      if (!this.editingScaleRow) return;
      this.editingScaleRow._bonusScale = null;
      bootstrap.Modal.getInstance(this.scaleModalEl)?.hide();
    }

    saveScale() {
      if (!this.editingScaleRow) return;
      this.editingScaleRow._bonusScale = this.collectScale();
      this.scaleStatus("Scale saved.", "success");
      bootstrap.Modal.getInstance(this.scaleModalEl)?.hide();
    }

    applyCustomDefaults(scope = this.customRowsEl) {
      const category = this.customCategoryEl.value;
      if (!["Debuff", "Condition"].includes(category)) return;
      const rows = scope.classList?.contains("effect-custom-row")
        ? [scope]
        : [...(scope.querySelectorAll?.(".effect-custom-row") || [])];
      rows.forEach(row => {
        const type = row.querySelector('[data-field="type"]');
        const stacks = row.querySelector('[data-field="stacks"]');
        if (type && type.value === "untyped") type.value = "penalty";
        if (stacks) stacks.checked = true;
      });
    }

    collectCustomEffect() {
      const durationUnit = this.durationUnitEl.value || "variable";
      const durationCount = durationUnit === "variable"
        ? null
        : Math.max(1, Number.parseInt(this.durationCountEl.value, 10) || 1);
      const durationPerLevel = durationUnit !== "variable" && Boolean(this.durationPerLevelEl.checked);
      const duration = durationLabel({ durationCount, durationUnit, durationPerLevel });
      return {
        name: this.customNameEl.value.trim(),
        category: this.customCategoryEl.value || "Spell",
        duration,
        durationCount,
        durationUnit,
        durationPerLevel,
        contextKey: this.options.contextKey,
        bonuses: [...this.customRowsEl.querySelectorAll(".effect-custom-row")].map(row => {
          const selectedStat = row.querySelector('[data-field="stat"]').value;
          const skillName = [CRAFT_SKILL_STAT, PROFESSION_SKILL_STAT].includes(selectedStat)
            ? namedSkill(selectedStat, row.querySelector('[data-field="skillName"]')?.value)
            : "";
          const bonus = {
            stat: skillName ? skillKey(skillName) : selectedStat,
            value: Number(row.querySelector('[data-field="value"]').value || 0),
            type: row.querySelector('[data-field="type"]').value || "untyped",
            stacks: row.querySelector('[data-field="stacks"]').checked,
            conditional: row.querySelector('[data-field="conditional"]').checked,
            appliesWhen: row.querySelector('[data-field="appliesWhen"]').value.trim()
          };
          if (skillName) bonus.skillName = skillName;
          if (durationPerLevel && row._bonusScale) bonus.bonusScale = row._bonusScale;
          return bonus;
        })
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
      if (!effect.bonuses.length) {
        this.customStatus("Add at least one bonus.", "warning");
        return;
      }

      const saved = this.editingEffectId
        ? await PFApp.updateBuffDefinition?.(this.editingEffectId, effect)
        : await PFApp.saveBuffDefinition(effect);
      if (!saved) {
        this.customStatus(this.editingEffectId ? "Could not update effect." : "Could not save effect.", "danger");
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
        const message = result?.error?.message || result?.error?.details || result?.error?.hint || JSON.stringify(result?.error || {});
        this.deleteStatus(message && message !== "{}" ? message : "Could not delete effect. Refresh the page and try again.", "danger");
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
      this.pickerModalEl.addEventListener("shown.bs.modal", () => {
        this.searchEl?.focus();
        this.searchEl?.select();
      }, { once: true });
      bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show();
      setTimeout(() => {
        if (document.activeElement !== this.searchEl) this.searchEl?.focus();
      }, 250);
    }

    renderResults() {
      if (!this.resultsEl) return;
      const term = this.searchEl?.value.trim().toLowerCase() || "";
      const matches = this.effects
        .filter(effect => !term || searchText(effect).includes(term));

      if (!matches.length) {
        this.resultsEl.innerHTML = `<div class="small-text">No matching effects found.</div>`;
        return;
      }

      this.resultsEl.innerHTML = matches.map(effect => {
        const index = this.effects.indexOf(effect);
        const bonuses = (effect.bonuses || []).slice(0, 8);
        const bonusHtml = bonuses.length
          ? bonuses.map(bonus => `<span class="effect-tracker-chip">${escapeHtml(bonusText(bonus))}</span>`).join("")
          : `<span class="small-text">No numerical changes</span>`;
        const more = (effect.bonuses || []).length > bonuses.length
          ? `<span class="small-text">+${(effect.bonuses || []).length - bonuses.length} more</span>`
          : "";
        return `
          <article class="effect-tracker-card" role="button" tabindex="0" data-effect-index="${index}">
            <span class="effect-tracker-icon" title="${escapeHtml(effect.category || "Effect")}"><i class="bi ${categoryIcon(effect.category)}"></i></span>
            <div class="fw-semibold pe-2">${escapeHtml(effect.name)}</div>
            <div class="small-text mb-2">${escapeHtml(effect.category || "Effect")} | ${escapeHtml(durationLabel(effect))}</div>
            <div>${bonusHtml}${more}</div>
            ${this.isAdmin ? `
              <div class="d-flex gap-2 mt-2">
                <button class="btn btn-outline-warning btn-sm" type="button" data-edit-bonuses="${index}"><i class="bi bi-pencil-square"></i> Edit</button>
                <button class="btn btn-outline-danger btn-sm" type="button" data-delete-effect="${index}" aria-label="Delete effect"><i class="bi bi-trash"></i></button>
              </div>
            ` : ""}
            ${this.controls(effect, index)}
          </article>
        `;
      }).join("");

      this.resultsEl.querySelectorAll("[data-effect-index]").forEach(card => {
        card.addEventListener("click", event => {
          if (event.target.closest(".effect-tracker-controls")) return;
          this.addEffect(Number(card.dataset.effectIndex));
        });
        card.addEventListener("keydown", event => {
          if (event.target.closest(".effect-tracker-controls")) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          this.addEffect(Number(card.dataset.effectIndex));
        });
      });
      this.resultsEl.querySelectorAll("[data-edit-bonuses]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          this.openBonusEditor(Number(button.dataset.editBonuses));
        });
      });
      this.resultsEl.querySelectorAll("[data-delete-effect]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          this.openDeleteModal(Number(button.dataset.deleteEffect));
        });
      });
    }

    controls(effect, index) {
      const needsCl = durationUsesCasterLevel(effect);
      const condition = isCondition(effect);
      return `
        <div class="effect-tracker-controls">
          ${needsCl ? `
            <label class="small effect-tracker-inline">CL
              <input id="${this.prefix}Cl${index}" class="form-control form-control-sm" type="number" min="1" value="1">
            </label>
          ` : ""}
          ${condition ? `
            <label class="small effect-tracker-inline">Turns
              <input id="${this.prefix}Turns${index}" class="form-control form-control-sm" type="number" min="1" value="1">
            </label>
          ` : ""}
          <label class="form-check small">
            <input id="${this.prefix}Permanent${index}" class="form-check-input" type="checkbox">
            <span class="form-check-label">Permanent</span>
          </label>
        </div>
      `;
    }

    addEffect(index) {
      const effect = this.effects[index];
      if (!effect || !this.options.characterId) return;
      const casterLevel = Math.max(1, Number.parseInt(document.getElementById(`${this.prefix}Cl${index}`)?.value, 10) || 1);
      const turns = Math.max(1, Number.parseInt(document.getElementById(`${this.prefix}Turns${index}`)?.value, 10) || 1);
      const permanent = Boolean(document.getElementById(`${this.prefix}Permanent${index}`)?.checked);
      const condition = isCondition(effect);
      const baseDurationLabel = durationLabel(effect);
      const calculatedDuration = condition ? turns : parseDuration(effect, casterLevel);
      const appliedDurationLabel = permanent
        ? "Permanent"
        : condition
          ? `${turns} turn${turns === 1 ? "" : "s"}`
          : calculatedDuration === null
            ? baseDurationLabel
            : durationUsesCasterLevel(effect)
              ? `${baseDurationLabel} | CL ${casterLevel}: ${formatDurationRounds(calculatedDuration)}`
              : `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`;

      this.active.push({
        ...effect,
        casterLevel,
        turns: condition ? turns : undefined,
        permanent,
        remaining: permanent ? null : calculatedDuration,
        computedDuration: calculatedDuration,
        durationLabel: appliedDurationLabel
      });
      this.renderActive();
      this.notifyChange();
      this.queueSave();
      bootstrap.Modal.getInstance(this.pickerModalEl)?.hide();
    }

    removeEffect(index) {
      this.active.splice(index, 1);
      this.renderActive();
      this.notifyChange();
      this.queueSave();
    }

    renderActive() {
      if (!this.activeEl) return;
      if (!this.options.characterId) {
        this.activeEl.innerHTML = `<div class="small-text">No character selected. Create or select a character to add effects.</div>`;
        return;
      }

      const activeCategories = [...new Set(this.active.map(effect => effect.category || "Effect"))]
        .sort((a, b) => String(a).localeCompare(String(b)));
      const filterOptions = ["all", ...activeCategories];
      if (!filterOptions.includes(this.activeTypeFilter)) this.activeTypeFilter = "all";
      const filteredActive = this.active
        .map((effect, index) => ({ effect, index }))
        .filter(row => this.activeTypeFilter === "all" || row.effect.category === this.activeTypeFilter);

      const toolbar = `
        <div class="effect-active-toolbar">
          <div class="small-text">${this.active.length} active effect${this.active.length === 1 ? "" : "s"}</div>
          <div>
            <label class="small" for="${this.prefix}ActiveTypeFilter">Type</label>
            <select id="${this.prefix}ActiveTypeFilter" class="form-select form-select-sm">
              ${filterOptions.map(type => `<option value="${escapeHtml(type)}" ${this.activeTypeFilter === type ? "selected" : ""}>${escapeHtml(type === "all" ? "All" : type)}</option>`).join("")}
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

      this.activeEl.innerHTML = toolbar + filteredActive.map(({ effect, index }) => {
        const detailsId = `${this.prefix}Details${index}`;
        const bonuses = (effect.bonuses || []).map(bonus => `<div class="small-text">${escapeHtml(bonusText(bonus))}</div>`).join("");
        return `
          <article class="effect-tracker-active">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <strong>${escapeHtml(effect.name)}</strong>
                <div class="small-text">${escapeHtml(effect.category || "Effect")} | ${escapeHtml(activeDuration(effect))}</div>
              </div>
              <div class="d-flex gap-1">
                <button class="btn btn-outline-info btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#${detailsId}" aria-label="Show effect details">i</button>
                <button class="btn btn-danger btn-sm" type="button" data-remove-effect="${index}" aria-label="Remove effect"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <div id="${detailsId}" class="collapse mt-2">${bonuses || '<div class="small-text">No mechanical bonuses listed.</div>'}</div>
          </article>
        `;
      }).join("");

      this.activeEl.querySelectorAll("[data-remove-effect]").forEach(button => {
        button.addEventListener("click", () => this.removeEffect(Number(button.dataset.removeEffect)));
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
          await PFApp.saveBuffState(this.active, this.options.contextKey, this.options.characterId);
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
      tracker.mount();
      return tracker;
    }
  };
})();
