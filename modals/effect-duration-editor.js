(function () {
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const STYLE_ID = "pf-effect-duration-editor-style";
  const CLASS_GROUPS = [
    ["Core", ["Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger","Rogue","Sorcerer","Wizard"]],
    ["Base", ["Alchemist","Cavalier","Gunslinger","Inquisitor","Magus","Omdura","Oracle","Shifter","Summoner","Vampire Hunter","Vigilante","Witch"]],
    ["Alternate", ["Antipaladin","Ninja","Samurai"]],
    ["Occult", ["Kineticist","Medium","Mesmerist","Occultist","Psychic","Spiritualist"]],
    ["Hybrid", ["Arcanist","Bloodrager","Brawler","Hunter","Investigator","Shaman","Skald","Slayer","Swashbuckler","Warpriest"]],
    ["Unchained", ["Barbarian (Unchained)","Monk (Unchained)","Rogue (Unchained)","Summoner (Unchained)"]]
  ];
  const BASE_CLASSES = CLASS_GROUPS.flatMap(([, names]) => names);
  const PRESTIGE_CLASSES = [
    "Arcane Archer","Arcane Trickster","Assassin","Battle Herald","Champion of Irori","Dragon Disciple","Duelist","Eldritch Knight","Evangelist","Harrower","Hellknight","Hellknight Signifer","Horizon Walker","Loremaster","Mystic Theurge","Pathfinder Chronicler","Rage Prophet","Red Mantis Assassin","Shadowdancer","Stalwart Defender"
  ];
  const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .effect-duration-editor-modal { z-index: 1085; }
      .effect-duration-editor-backdrop { z-index: 1080; }
    `;
    document.head.appendChild(style);
  }

  function legacyDurationConfig(effectOrParts) {
    const count = effectOrParts?.durationCount ?? effectOrParts?.count ?? null;
    const unit = effectOrParts?.durationUnit || effectOrParts?.unit || "variable";
    const perLevel = Boolean(effectOrParts?.durationPerLevel ?? effectOrParts?.perLevel);
    return {
      count: count === null || count === undefined || count === "" ? null : Number(count),
      unit,
      factors: perLevel ? [{ type: "caster" }] : []
    };
  }

  function normalizeDurationConfig(effectOrConfig) {
    const raw = effectOrConfig?.durationConfig || effectOrConfig;
    const fallback = legacyDurationConfig(effectOrConfig);
    const count = raw?.count ?? fallback.count;
    const unit = raw?.unit || fallback.unit || "variable";
    const factors = Array.isArray(raw?.factors) ? raw.factors : fallback.factors;
    return {
      count: unit === "variable" || count === null || count === undefined || count === "" ? null : Math.max(1, Number(count) || 1),
      unit,
      factors: unit === "variable" ? [] : factors.map(normalizeFactor).filter(Boolean)
    };
  }

  function normalizeFactor(factor) {
    const type = factor?.type || factor?.source || "caster";
    if (type === "character") return { type: "character" };
    if (type === "class") return { type: "class", className: factor.className || factor.class || "", prestige: Boolean(factor.prestige) };
    if (type === "ability") return { type: "ability", ability: factor.ability || "CON" };
    return { type: "caster" };
  }

  function durationLabel(effectOrConfig) {
    const config = normalizeDurationConfig(effectOrConfig);
    if (!config.count || config.unit === "variable") return "variable";
    const unit = `${config.unit}${config.count === 1 ? "" : "s"}`;
    const factors = config.factors.map(factorLabel).filter(Boolean);
    return `${config.count} ${unit}${factors.length ? ` / ${factors.join(" + ")}` : ""}`;
  }

  function factorLabel(factor) {
    if (factor.type === "caster") return "caster level";
    if (factor.type === "character") return "character level";
    if (factor.type === "class") return factor.className ? `${factor.className} level` : "class level";
    if (factor.type === "ability") return `${factor.ability || "CON"} modifier`;
    return "";
  }

  function factorValue(factor, context = {}) {
    if (factor.type === "caster") return Math.max(1, Number(context.casterLevel || 1) || 1);
    if (factor.type === "character") return Math.max(1, Number(context.characterLevel || context.level || context.casterLevel || 1) || 1);
    if (factor.type === "class") {
      const classLevels = context.classLevels || {};
      return Math.max(1, Number(classLevels[factor.className] || context.classLevel || context.casterLevel || 1) || 1);
    }
    if (factor.type === "ability") {
      const mods = context.abilityMods || {};
      return Number(mods[factor.ability] || mods[String(factor.ability || "").toLowerCase()] || 0);
    }
    return 1;
  }

  function durationMultiplier(config, context = {}) {
    const factors = normalizeDurationConfig(config).factors;
    if (!factors.length) return 1;
    return Math.max(1, factors.reduce((sum, factor) => sum + factorValue(factor, context), 0));
  }

  function parseDuration(effect, context = {}) {
    const config = normalizeDurationConfig(effect);
    if (!config.count || config.unit === "variable") return null;
    const amount = config.count * durationMultiplier(config, context);
    if (config.unit === "turn" || config.unit === "round") return amount;
    if (config.unit === "minute") return amount * 10;
    if (config.unit === "hour") return amount * 600;
    if (config.unit === "day") return amount * 14400;
    return null;
  }

  function levelSourceOptions(selected = {}) {
    const selectedType = selected.type || "caster";
    const selectedClass = selected.className || "";
    return `
      <option value="caster" ${selectedType === "caster" ? "selected" : ""}>Caster level</option>
      <option value="character" ${selectedType === "character" ? "selected" : ""}>Character level</option>
      ${CLASS_GROUPS.map(([label, names]) => `
        <optgroup label="${escapeHtml(label)} class level">
          ${names.map(name => `<option value="class:${escapeHtml(name)}" ${selectedType === "class" && selectedClass === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        </optgroup>
      `).join("")}
      <optgroup label="Prestige class level">
        ${PRESTIGE_CLASSES.map(name => `<option class="text-warning" value="prestige:${escapeHtml(name)}" ${selectedType === "class" && selectedClass === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
      </optgroup>
    `;
  }

  function sourceFromSelect(value) {
    if (value === "character") return { type: "character" };
    if (String(value).startsWith("class:")) return { type: "class", className: value.slice(6), prestige: false };
    if (String(value).startsWith("prestige:")) return { type: "class", className: value.slice(9), prestige: true };
    return { type: "caster" };
  }

  class DurationEditor {
    constructor(prefix) {
      this.prefix = `${prefix}DurationEditor`;
      this.config = normalizeDurationConfig({});
      this.onSave = null;
      this.ensureModal();
    }

    ensureModal() {
      if (document.getElementById(this.prefix)) return;
      injectStyles();
      document.body.insertAdjacentHTML("beforeend", `
        <div class="modal fade effect-duration-editor-modal" id="${this.prefix}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title">Duration</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="row g-2 mb-3">
                  <div class="col-sm-4">
                    <label class="small">Count</label>
                    <input class="form-control form-control-sm" type="number" min="1" data-duration-count>
                  </div>
                  <div class="col-sm-4">
                    <label class="small">UOM</label>
                    <select class="form-select form-select-sm" data-duration-unit>
                      ${DURATION_UNITS.map(unit => `<option value="${unit}">${unit}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-sm-4 d-flex align-items-end">
                    <button class="btn btn-outline-light btn-sm w-100" type="button" data-duration-add-level>Add Level Factor</button>
                  </div>
                </div>
                <div class="d-flex gap-2 mb-2">
                  <button class="btn btn-outline-light btn-sm" type="button" data-duration-add-ability>Add Attribute Bonus</button>
                </div>
                <div class="small-text mb-2">Factors are added together, then multiplied by the duration count.</div>
                <div class="vstack gap-2" data-duration-factors></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-primary btn-sm" type="button" data-duration-save>Save Duration</button>
              </div>
            </div>
          </div>
        </div>
      `);
      this.modal = document.getElementById(this.prefix);
      this.countEl = this.modal.querySelector("[data-duration-count]");
      this.unitEl = this.modal.querySelector("[data-duration-unit]");
      this.factorsEl = this.modal.querySelector("[data-duration-factors]");
      this.modal.querySelector("[data-duration-add-level]").addEventListener("click", () => this.addFactor({ type: "caster" }));
      this.modal.querySelector("[data-duration-add-ability]").addEventListener("click", () => this.addFactor({ type: "ability", ability: "CON" }));
      this.modal.querySelector("[data-duration-save]").addEventListener("click", () => this.save());
      this.unitEl.addEventListener("change", () => this.sync());
      this.modal.addEventListener("shown.bs.modal", () => {
        const backdrops = [...document.querySelectorAll(".modal-backdrop")];
        backdrops.at(-1)?.classList.add("effect-duration-editor-backdrop");
      });
    }

    open(config, onSave) {
      this.config = normalizeDurationConfig(config);
      this.onSave = onSave;
      this.countEl.value = this.config.count || "";
      this.unitEl.value = this.config.unit || "variable";
      this.factorsEl.innerHTML = "";
      this.config.factors.forEach(factor => this.addFactor(factor));
      this.sync();
      bootstrap.Modal.getOrCreateInstance(this.modal).show();
    }

    sync() {
      const variable = this.unitEl.value === "variable";
      this.countEl.disabled = variable;
      this.modal.querySelectorAll("[data-duration-add-level], [data-duration-add-ability]").forEach(button => button.disabled = variable);
      this.factorsEl.classList.toggle("d-none", variable);
      if (variable) this.countEl.value = "";
    }

    addFactor(factor) {
      const row = document.createElement("div");
      row.className = "row g-2 align-items-end";
      if (factor.type === "ability") {
        row.innerHTML = `
          <div class="col-sm-10">
            <label class="small">Attribute Bonus</label>
            <select class="form-select form-select-sm" data-factor-ability>
              ${ABILITIES.map(ability => `<option value="${ability}" ${factor.ability === ability ? "selected" : ""}>${ability}</option>`).join("")}
            </select>
          </div>
          <div class="col-sm-2"><button class="btn btn-danger btn-sm w-100" type="button">Delete</button></div>
        `;
      } else {
        row.innerHTML = `
          <div class="col-sm-10">
            <label class="small">Level Source</label>
            <select class="form-select form-select-sm" data-factor-level>${levelSourceOptions(factor)}</select>
          </div>
          <div class="col-sm-2"><button class="btn btn-danger btn-sm w-100" type="button">Delete</button></div>
        `;
      }
      row.querySelector("button").addEventListener("click", () => row.remove());
      this.factorsEl.appendChild(row);
    }

    collect() {
      const unit = this.unitEl.value || "variable";
      if (unit === "variable") return { count: null, unit: "variable", factors: [] };
      const factors = [...this.factorsEl.children].map(row => {
        const level = row.querySelector("[data-factor-level]");
        const ability = row.querySelector("[data-factor-ability]");
        if (level) return sourceFromSelect(level.value);
        if (ability) return { type: "ability", ability: ability.value || "CON" };
        return null;
      }).filter(Boolean);
      return {
        count: Math.max(1, Number.parseInt(this.countEl.value, 10) || 1),
        unit,
        factors
      };
    }

    save() {
      this.config = this.collect();
      this.onSave?.(this.config);
      bootstrap.Modal.getInstance(this.modal)?.hide();
    }
  }

  window.PFEffectMeta = {
    DURATION_UNITS,
    BASE_CLASSES,
    PRESTIGE_CLASSES,
    ABILITIES,
    normalizeDurationConfig,
    legacyDurationConfig,
    durationLabel,
    parseDuration,
    levelSourceOptions,
    sourceFromSelect,
    factorLabel,
    durationMultiplier
  };
  window.PFEffectDurationEditor = DurationEditor;
})();
