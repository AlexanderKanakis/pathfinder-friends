(function () {
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const STYLE_ID = "pf-effect-duration-editor-style";
  const CLASS_GROUPS = [
    [
      "Core",
      [
        "Barbarian",
        "Bard",
        "Cleric",
        "Druid",
        "Fighter",
        "Monk",
        "Paladin",
        "Ranger",
        "Rogue",
        "Sorcerer",
        "Wizard",
      ],
    ],
    [
      "Base",
      [
        "Alchemist",
        "Cavalier",
        "Gunslinger",
        "Inquisitor",
        "Magus",
        "Omdura",
        "Oracle",
        "Shifter",
        "Summoner",
        "Vampire Hunter",
        "Vigilante",
        "Witch",
      ],
    ],
    ["Alternate", ["Antipaladin", "Ninja", "Samurai"]],
    [
      "Occult",
      [
        "Kineticist",
        "Medium",
        "Mesmerist",
        "Occultist",
        "Psychic",
        "Spiritualist",
      ],
    ],
    [
      "Hybrid",
      [
        "Arcanist",
        "Bloodrager",
        "Brawler",
        "Hunter",
        "Investigator",
        "Shaman",
        "Skald",
        "Slayer",
        "Swashbuckler",
        "Warpriest",
      ],
    ],
    [
      "Unchained",
      [
        "Barbarian (Unchained)",
        "Monk (Unchained)",
        "Rogue (Unchained)",
        "Summoner (Unchained)",
      ],
    ],
  ];
  const BASE_CLASSES = CLASS_GROUPS.flatMap(([, names]) => names);
  const PRESTIGE_CLASSES = [
    "Arcane Archer",
    "Arcane Trickster",
    "Assassin",
    "Battle Herald",
    "Champion of Irori",
    "Dragon Disciple",
    "Duelist",
    "Eldritch Knight",
    "Evangelist",
    "Harrower",
    "Hellknight",
    "Hellknight Signifer",
    "Horizon Walker",
    "Loremaster",
    "Mystic Theurge",
    "Pathfinder Chronicler",
    "Rage Prophet",
    "Red Mantis Assassin",
    "Shadowdancer",
    "Stalwart Defender",
  ];
  const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
  const DURATION_DICE_SIDES = [2, 3, 4, 6, 8, 10, 12, 20, 100];

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

  function normalizeDurationConfig(effectOrConfig) {
    const raw = effectOrConfig?.durationConfig || effectOrConfig || {};
    const staticValue = raw.staticValue ?? raw.count ?? null;
    const unit = raw.unit || "variable";
    const factors = Array.isArray(raw.factors) ? raw.factors : [];
    const diceCountScale = raw.diceCountScale || null;
    const staticValueScale =
      raw.staticValueScale || raw.durationScale || raw.scale || null;
    return {
      diceCount:
        unit === "variable"
          ? 0
          : Math.max(0, Math.floor(Number(raw.diceCount) || 0)),
      dieType: Math.max(2, Math.floor(Number(raw.dieType) || 6)),
      diceCountMax:
        raw.diceCountMax === null ||
        raw.diceCountMax === undefined ||
        raw.diceCountMax === ""
          ? null
          : Math.max(0, Math.floor(Number(raw.diceCountMax) || 0)),
      staticValue:
        unit === "variable" ||
        staticValue === null ||
        staticValue === undefined ||
        staticValue === ""
          ? null
          : Number(staticValue) || 0,
      staticValueMax:
        raw.staticValueMax === null ||
        raw.staticValueMax === undefined ||
        raw.staticValueMax === ""
          ? null
          : Math.max(0, Number(raw.staticValueMax) || 0),
      maximizeDice: Boolean(raw.maximizeDice),
      valueMultiplier: Math.max(0, Number(raw.valueMultiplier) || 1),
      unit,
      factors:
        unit === "variable" ? [] : factors.map(normalizeFactor).filter(Boolean),
      // "multiply" applies the factor to the whole XdY + static formula,
      // e.g. "1 round per level". "add" adds the factor after the formula, e.g.
      // "1d4 rounds + caster level" -- a rolled base plus a modifier, not a
      // per-level scale. Defaulting to "multiply" keeps every duration
      // already configured the old way behaving identically.
      factorMode: raw?.factorMode === "add" ? "add" : "multiply",
      splitAmongTargets:
        unit !== "variable" &&
        Boolean(raw?.splitAmongTargets),
      ...(unit !== "variable" && diceCountScale ? { diceCountScale } : {}),
      ...(unit !== "variable" && staticValueScale
        ? { staticValueScale }
        : {}),
    };
  }

  function normalizeDurationScale(scale) {
    if (!scale || typeof scale !== "object") return null;
    const source = normalizeFactor(scale.source || { type: "caster" });
    const milestones = (Array.isArray(scale.milestones)
      ? scale.milestones
      : []
    )
      .map((milestone) => ({
        level: Math.max(0, Number.parseInt(milestone.level, 10) || 0),
        value: Number(milestone.value),
      }))
      .filter(
        (milestone) =>
          milestone.level > 0 && Number.isFinite(milestone.value),
      )
      .sort((a, b) => a.level - b.level);
    const rawEvery = scale.every || {};
    const every = {
      fromLevel: Math.max(
        0,
        Number.parseInt(
          rawEvery.fromLevel || rawEvery.afterLevel || rawEvery.after,
          10,
        ) || 0,
      ),
      everyLevels: Math.max(
        0,
        Number.parseInt(rawEvery.everyLevels || rawEvery.every, 10) || 0,
      ),
      increase: Number(rawEvery.increase || 0),
    };
    const hasEvery =
      every.fromLevel > 0 &&
      every.everyLevels > 0 &&
      Number.isFinite(every.increase) &&
      every.increase !== 0;
    if (!milestones.length && !hasEvery) return null;
    return {
      source,
      milestones,
      every: hasEvery ? every : null,
    };
  }

  function normalizeFactor(factor) {
    const type = factor?.type || factor?.source || "caster";
    const ratio = {
      numerator: Math.max(1, Number(factor?.numerator ?? 1) || 1),
      denominator: Math.max(1, Number(factor?.denominator ?? 1) || 1),
    };
    if (type === "character") return { type: "character", ...ratio };
    if (type === "class")
      return {
        type: "class",
        className: factor.className || factor.class || "",
        prestige: Boolean(factor.prestige),
        ...ratio,
      };
    if (type === "ability")
      return {
        type: "ability",
        ability: factor.ability || "CON",
        ...ratio,
      };
    if (type === "special")
      return {
        type: "special",
        special: factor.special || "",
        label: factor.label || "",
        ...ratio,
      };
    return { type: "caster", ...ratio };
  }

  function durationLabel(effectOrConfig) {
    const config = normalizeDurationConfig(effectOrConfig);
    if (config.unit === "variable") return "variable";
    const dice = config.diceCount ? `${config.diceCount}d${config.dieType}` : "";
    const flat = Number(config.staticValue || 0);
    const formula =
      window.PFEffectRolls?.formulaText?.({
        diceCount: config.diceCount,
        dieType: config.dieType,
        staticValue: flat,
        maximizeDice: config.maximizeDice,
        valueMultiplier: config.valueMultiplier,
      }) ||
      [
        dice,
        flat
          ? `${dice && flat > 0 ? "+ " : flat < 0 ? "- " : ""}${dice ? Math.abs(flat) : flat}`
          : "",
      ].filter(Boolean).join(" ") ||
      "0";
    const unit = `${config.unit}${config.diceCount || flat !== 1 ? "s" : ""}`;
    const factors = config.factors.map(factorLabel).filter(Boolean);
    const baseLabel = !factors.length
      ? `${formula} ${unit}`
      : config.factorMode === "add"
      ? `${formula} ${unit} + ${factors.join(" + ")}`
      : `${formula} ${unit} / ${factors.join(" + ")}`;
    const scaleLabel = (scale) =>
      window.PFEffectEditor?.scaleText?.(scale) || durationScaleLabel(scale);
    const diceScaleLabel = scaleLabel(config.diceCountScale);
    const staticScaleLabel = scaleLabel(config.staticValueScale);
    const labels = [
      baseLabel,
      diceScaleLabel ? `dice: ${diceScaleLabel}` : "",
      staticScaleLabel ? `static: ${staticScaleLabel}` : "",
    ].filter(Boolean);
    if (config.splitAmongTargets) labels.push("split among targets");
    return labels.join("; ");
  }

  function durationConfigFromSpellText(duration = "") {
    const match = String(duration || "").match(
      /(\d+)?\s*(rounds?|minutes?|mins?\.?|hours?|days?)\s*(?:\/|per)\s*(?:caster\s*)?levels?/i,
    );
    if (!match) return null;
    const rawUnit = String(match[2] || "").toLowerCase();
    const unit = /^min/.test(rawUnit)
      ? "minute"
      : /^hour/.test(rawUnit)
        ? "hour"
        : /^day/.test(rawUnit)
          ? "day"
          : "round";
    return {
      diceCount: 0,
      dieType: 6,
      staticValue: Math.max(1, Number(match[1] || 1) || 1),
      unit,
      factors: [{ type: "caster" }],
      factorMode: "multiply",
    };
  }

  function durationScaleLabel(scale) {
    const normalized = normalizeDurationScale(scale);
    if (!normalized) return "";
    const source = factorLabel(normalized.source) || "level";
    const parts = normalized.milestones.map(
      (milestone) =>
        `${source} ${milestone.level}: ${milestone.value}`,
    );
    const every = normalized.every;
    if (every) {
      parts.push(
        `from ${source} ${every.fromLevel}, every ${every.everyLevels}: ${every.increase >= 0 ? "+" : ""}${every.increase}`,
      );
    }
    return parts.join("; ");
  }

  function factorLabel(factor) {
    let label = "";
    if (factor.type === "caster") label = "caster level";
    if (factor.type === "character") label = "character level";
    if (factor.type === "class")
      label = factor.className ? `${factor.className} level` : "class level";
    if (factor.type === "special") {
      if (factor.special === "favored-enemy-bonus")
        label = "favored enemy bonus";
      else label = factor.label || "special value";
    }
    if (factor.type === "ability") label = `${factor.ability || "CON"} modifier`;
    if (!label) return "";
    const numerator = Math.max(1, Number(factor.numerator ?? 1) || 1);
    const denominator = Math.max(1, Number(factor.denominator ?? 1) || 1);
    return numerator === 1 && denominator === 1
      ? label
      : `${label} x ${numerator}/${denominator}`;
  }

  function factorValue(factor, context = {}) {
    let value = 1;
    if (factor.type === "caster")
      value = Math.max(1, Number(context.casterLevel || 1) || 1);
    else if (factor.type === "character")
      value = Math.max(
        1,
        Number(
          context.characterLevel || context.level || context.casterLevel || 1,
        ) || 1,
      );
    else if (factor.type === "class") {
      const classLevels = context.classLevels || {};
      value = Math.max(
        1,
        Number(
          classLevels[factor.className] ||
            context.classLevel ||
            context.casterLevel ||
            1,
        ) || 1,
      );
    } else if (factor.type === "ability") {
      const mods = context.abilityMods || {};
      value = Number(
        mods[factor.ability] ||
          mods[String(factor.ability || "").toLowerCase()] ||
          0,
      );
    } else if (factor.type === "special") {
      const specialValues = context.specialValues || {};
      value = Number(specialValues[factor.special] || 0);
    }
    const numerator = Math.max(1, Number(factor.numerator ?? 1) || 1);
    const denominator = Math.max(1, Number(factor.denominator ?? 1) || 1);
    return Math.floor((value * numerator) / denominator);
  }

  function factorsSum(config, context = {}) {
    const factors = normalizeDurationConfig(config).factors;
    return factors.reduce((sum, factor) => sum + factorValue(factor, context), 0);
  }

  function applyDurationScale(amount, scale, context = {}) {
    const normalized = normalizeDurationScale(scale);
    if (!normalized) return amount;
    const level = factorValue(normalized.source, context);
    let value = amount;
    normalized.milestones
      .filter((milestone) => milestone.level <= level)
      .forEach((milestone) => {
        value = milestone.value;
      });
    const every = normalized.every;
    if (every && level >= every.fromLevel) {
      value +=
        (Math.floor((level - every.fromLevel) / every.everyLevels) + 1) *
        every.increase;
    }
    return value;
  }

  // Kept for compatibility with existing callers/exports -- this is the
  // "multiply" path's scale factor (e.g. "1 round per level" -> the level).
  function durationMultiplier(config, context = {}) {
    const factors = normalizeDurationConfig(config).factors;
    if (!factors.length) return 1;
    return Math.max(1, factorsSum(config, context));
  }

  function parseDuration(effect, context = {}) {
    const config = normalizeDurationConfig(effect);
    if (config.unit === "variable") return null;
    const formula = {
      diceCount: config.diceCount,
      dieType: config.dieType,
      staticValue: config.staticValue || 0,
      diceCountMax: config.diceCountMax,
      staticValueMax: config.staticValueMax,
      diceCountScale: config.diceCountScale || null,
      staticValueScale: config.staticValueScale || null,
      maximizeDice: config.maximizeDice,
      valueMultiplier: config.valueMultiplier,
    };
    const random =
      typeof context.random === "function" ? context.random : Math.random;
    const rolled = window.PFEffectRolls?.rollFormula
      ? window.PFEffectRolls.rollFormula(formula, context, random)
      : null;
    const calculated = rolled || {
          ...formula,
          diceCount: Math.max(
            0,
            Math.floor(
              applyDurationScale(
                formula.diceCount,
                formula.diceCountScale,
                context,
              ),
            ),
          ),
          staticValue: applyDurationScale(
            formula.staticValue,
            formula.staticValueScale,
            context,
          ),
        };
    const formulaAmount = Math.max(
      1,
      rolled
        ? rolled.total
        : Math.floor(
            (Array.from(
              { length: calculated.diceCount },
              () =>
                calculated.maximizeDice
                  ? calculated.dieType
                  : Math.floor(random() * calculated.dieType) + 1,
            ).reduce((sum, value) => sum + value, 0) +
              calculated.staticValue) *
              Math.max(0, Number(calculated.valueMultiplier) || 1),
          ),
    );
    const baseAmount =
      config.factorMode === "add"
        ? formulaAmount + factorsSum(config, context)
        : formulaAmount * durationMultiplier(config, context);
    const amount = Math.max(1, baseAmount);
    let rounds = null;
    if (config.unit === "turn" || config.unit === "round") rounds = amount;
    if (config.unit === "minute") rounds = amount * 10;
    if (config.unit === "hour") rounds = amount * 600;
    if (config.unit === "day") rounds = amount * 14400;
    if (rounds === null) return null;
    const targetCount = Math.max(
      1,
      Math.floor(Number(context.targetCount || 1) || 1),
    );
    return config.splitAmongTargets && targetCount > 1
      ? Math.max(1, Math.floor(rounds / targetCount))
      : rounds;
  }

  function levelSourceOptions(selected = {}, options = {}) {
    const selectedType = selected.type || "caster";
    const selectedClass = selected.className || "";
    const selectedSpecial = selected.special || "";
    const includeSpecial =
      Boolean(options.includeSpecial) || selectedType === "special";
    return `
      <option value="caster" ${selectedType === "caster" ? "selected" : ""}>Caster level</option>
      <option value="character" ${selectedType === "character" ? "selected" : ""}>Character level</option>
      <option value="class:$sourceClass" ${selectedType === "class" && selectedClass === "$sourceClass" ? "selected" : ""}>Source class level</option>
      ${CLASS_GROUPS.map(
        ([label, names]) => `
        <optgroup label="${escapeHtml(label)} class level">
          ${names.map((name) => `<option value="class:${escapeHtml(name)}" ${selectedType === "class" && selectedClass === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        </optgroup>
      `,
      ).join("")}
      <optgroup label="Prestige class level">
        ${PRESTIGE_CLASSES.map((name) => `<option class="text-warning" value="prestige:${escapeHtml(name)}" ${selectedType === "class" && selectedClass === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
      </optgroup>
      ${
        includeSpecial
          ? `
      <optgroup label="Special">
        <option value="special:favored-enemy-bonus" ${selectedType === "special" && selectedSpecial === "favored-enemy-bonus" ? "selected" : ""}>Favored enemy bonus</option>
      </optgroup>
      `
          : ""
      }
    `;
  }

  function sourceFromSelect(value) {
    if (value === "character") return { type: "character" };
    if (String(value).startsWith("special:"))
      return { type: "special", special: value.slice(8) };
    if (String(value).startsWith("class:"))
      return { type: "class", className: value.slice(6), prestige: false };
    if (String(value).startsWith("prestige:"))
      return { type: "class", className: value.slice(9), prestige: true };
    return { type: "caster" };
  }

  const durationEditorInstances = new Map();

  class DurationEditor {
    constructor(prefix) {
      const editorPrefix = `${prefix}DurationEditor`;
      const existing = durationEditorInstances.get(editorPrefix);
      if (existing) return existing;
      this.prefix = editorPrefix;
      this.config = normalizeDurationConfig({});
      this.onSave = null;
      this.ensureModal();
      durationEditorInstances.set(this.prefix, this);
    }

    ensureModal() {
      if (document.getElementById(this.prefix)) return;
      injectStyles();
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div class="modal fade effect-duration-editor-modal" id="${this.prefix}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header">
                <h5 class="modal-title">Duration</h5>
              </div>
              <div class="modal-body">
                <div class="row g-2 mb-2" data-duration-formula>
                  <div class="col-sm-3">
                    <label class="small">Number of Dice</label>
                    <input class="form-control form-control-sm" type="number" min="0" data-duration-dice-count>
                  </div>
                  <div class="col-sm-3">
                    <label class="small">Die</label>
                    <select class="form-select form-select-sm" data-duration-die-type>
                      ${DURATION_DICE_SIDES.map((sides) => `<option value="${sides}">d${sides}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-sm-3">
                    <label class="small">Static</label>
                    <input class="form-control form-control-sm" type="number" data-duration-static>
                  </div>
                  <div class="col-sm-3">
                    <label class="small">UOM</label>
                    <select class="form-select form-select-sm" data-duration-unit>
                      ${DURATION_UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
                    </select>
                  </div>
                </div>
                <div class="row g-2 mb-3" data-duration-formula-scales>
                  <div class="col-sm-4">
                    <button class="btn btn-outline-info btn-sm w-100" type="button" data-duration-scale-dice>Scale Dice</button>
                    <div class="small text-secondary mt-1" data-duration-dice-scale-summary></div>
                  </div>
                  <div class="col-sm-4">
                    <button class="btn btn-outline-info btn-sm w-100" type="button" data-duration-scale-static>Scale Static</button>
                    <div class="small text-secondary mt-1" data-duration-static-scale-summary></div>
                  </div>
                  <div class="col-sm-4">
                    <button class="btn btn-outline-light btn-sm w-100" type="button" data-duration-add-level>Add Level Factor</button>
                  </div>
                </div>
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" role="switch" data-duration-split-targets>
                  <label class="form-check-label">Split duration among targets</label>
                </div>
                <div class="d-flex gap-2 mb-2 align-items-end">
                  <button class="btn btn-outline-light btn-sm" type="button" data-duration-add-ability>Add Attribute Bonus</button>
                  <div class="flex-grow-1">
                    <label class="small">Factors</label>
                    <select class="form-select form-select-sm" data-duration-factor-mode>
                      <option value="multiply">Multiply formula (e.g. 1 round per level)</option>
                      <option value="add">Add factors (e.g. 1d4 rounds + caster level)</option>
                    </select>
                  </div>
                </div>
                <div class="small-text mb-2" data-duration-factor-hint></div>
                <div class="vstack gap-2 mb-3" data-duration-factors></div>

              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-primary btn-sm" type="button" data-duration-save>Save Duration</button>
              </div>
            </div>
          </div>
        </div>
      `,
      );
      this.modal = document.getElementById(this.prefix);
      this.diceCountEl = this.modal.querySelector("[data-duration-dice-count]");
      this.dieTypeEl = this.modal.querySelector("[data-duration-die-type]");
      this.staticValueEl = this.modal.querySelector("[data-duration-static]");
      this.unitEl = this.modal.querySelector("[data-duration-unit]");
      this.formulaEl = this.modal.querySelector("[data-duration-formula]");
      this.formulaScalesEl = this.modal.querySelector(
        "[data-duration-formula-scales]",
      );
      this.diceScaleSummaryEl = this.modal.querySelector(
        "[data-duration-dice-scale-summary]",
      );
      this.staticScaleSummaryEl = this.modal.querySelector(
        "[data-duration-static-scale-summary]",
      );
      this.factorsEl = this.modal.querySelector("[data-duration-factors]");
      this.factorModeEl = this.modal.querySelector(
        "[data-duration-factor-mode]",
      );
      this.splitTargetsEl = this.modal.querySelector(
        "[data-duration-split-targets]",
      );
      this.factorHintEl = this.modal.querySelector(
        "[data-duration-factor-hint]",
      );
      this.diceCountScale = null;
      this.staticValueScale = null;
      this.formulaScaleOpen = false;
      this.modal
        .querySelector("[data-duration-add-level]")
        .addEventListener("click", () => this.addFactor({ type: "caster" }));
      this.modal
        .querySelector("[data-duration-add-ability]")
        .addEventListener("click", () =>
          this.addFactor({ type: "ability", ability: "CON" }),
        );
      this.modal
        .querySelector("[data-duration-scale-dice]")
        .addEventListener("click", () => this.openFormulaScale("dice"));
      this.modal
        .querySelector("[data-duration-scale-static]")
        .addEventListener("click", () => this.openFormulaScale("static"));
      this.modal
        .querySelector("[data-duration-save]")
        .addEventListener("click", () => this.save());
      this.unitEl.addEventListener("change", () => this.sync());
      this.factorModeEl.addEventListener("change", () => this.syncFactorHint());
      this.modal.addEventListener("shown.bs.modal", () => {
        const backdrops = [...document.querySelectorAll(".modal-backdrop")];
        backdrops.at(-1)?.classList.add("effect-duration-editor-backdrop");
      });
    }

    open(config, onSave) {
      this.config = normalizeDurationConfig(config);
      this.onSave = onSave;
      this.diceCountEl.value = this.config.diceCount || 0;
      this.dieTypeEl.value = this.config.dieType || 6;
      this.staticValueEl.value = this.config.staticValue ?? "";
      this.diceCountScale = this.config.diceCountScale || null;
      this.staticValueScale = this.config.staticValueScale || null;
      this.unitEl.value = this.config.unit || "variable";
      this.factorModeEl.value = this.config.factorMode || "multiply";
      this.splitTargetsEl.checked = Boolean(this.config.splitAmongTargets);
      this.factorsEl.innerHTML = "";
      this.config.factors.forEach((factor) => this.addFactor(factor));
      this.syncScaleSummaries();
      this.sync();
      this.syncFactorHint();
      bootstrap.Modal.getOrCreateInstance(this.modal).show();
    }

    sync() {
      const variable = this.unitEl.value === "variable";
      this.diceCountEl.disabled = variable;
      this.dieTypeEl.disabled = variable;
      this.staticValueEl.disabled = variable;
      this.modal
        .querySelectorAll(
          "[data-duration-add-level], [data-duration-add-ability]",
        )
        .forEach((button) => (button.disabled = variable));
      this.factorModeEl.disabled = variable;
      this.splitTargetsEl.disabled = variable;
      this.factorsEl.classList.toggle("d-none", variable);
      this.formulaScalesEl.classList.toggle("d-none", variable);
      if (variable) {
        this.diceCountEl.value = 0;
        this.staticValueEl.value = "";
      }
    }

    syncFactorHint() {
      this.factorHintEl.textContent =
        this.factorModeEl.value === "add"
          ? "Factors are added to the rolled duration formula, like 1d4 rounds + caster level."
          : "The rolled duration formula is multiplied by the factors, like 1 round per caster level.";
    }

    syncScaleSummaries() {
      const scaleText = (scale) =>
        window.PFEffectEditor?.scaleText?.(scale) ||
        durationScaleLabel(scale) ||
        "No scaling";
      this.diceScaleSummaryEl.textContent = scaleText(this.diceCountScale);
      this.staticScaleSummaryEl.textContent = scaleText(this.staticValueScale);
    }

    async openFormulaScale(kind) {
      if (!window.PFEffectEditor?.openScaleModal || this.formulaScaleOpen)
        return;
      this.formulaScaleOpen = true;
      const property = kind === "dice" ? "diceCountScale" : "staticValueScale";
      const current = this[property] || null;
      const durationModal = bootstrap.Modal.getOrCreateInstance(this.modal);
      if (this.modal.classList.contains("show")) {
        await new Promise((resolve) => {
          this.modal.addEventListener("hidden.bs.modal", resolve, { once: true });
          durationModal.hide();
        });
      }
      try {
        const scale = await window.PFEffectEditor.openScaleModal(current, {
          title:
            kind === "dice" ? "Duration Dice Scale" : "Duration Static Scale",
          preserveOnCancel: true,
        });
        this[property] = scale || null;
        this.syncScaleSummaries();
      } finally {
        durationModal.show();
        this.formulaScaleOpen = false;
      }
    }
    addFactor(factor) {
      const row = document.createElement("div");
      row.className = "row g-2 align-items-end";
      if (factor.type === "ability") {
        row.innerHTML = `
          <div class="col-sm-6">
            <label class="small">Attribute Bonus</label>
            <select class="form-select form-select-sm" data-factor-ability>
              ${ABILITIES.map((ability) => `<option value="${ability}" ${factor.ability === ability ? "selected" : ""}>${ability}</option>`).join("")}
            </select>
          </div>
          <div class="col-sm-2">
            <label class="small">Numerator</label>
            <input class="form-control form-control-sm" type="number" min="1" value="${factor.numerator ?? 1}" data-factor-numerator>
          </div>
          <div class="col-sm-2">
            <label class="small">Denominator</label>
            <input class="form-control form-control-sm" type="number" min="1" value="${factor.denominator ?? 1}" data-factor-denominator>
          </div>
          <div class="col-sm-2"><button class="btn btn-danger btn-sm w-100" type="button">Delete</button></div>
        `;
      } else {
        row.innerHTML = `
          <div class="col-sm-6">
            <label class="small">Level Source</label>
            <select class="form-select form-select-sm" data-factor-level>${levelSourceOptions(factor)}</select>
          </div>
          <div class="col-sm-2">
            <label class="small">Numerator</label>
            <input class="form-control form-control-sm" type="number" min="1" value="${factor.numerator ?? 1}" data-factor-numerator>
          </div>
          <div class="col-sm-2">
            <label class="small">Denominator</label>
            <input class="form-control form-control-sm" type="number" min="1" value="${factor.denominator ?? 1}" data-factor-denominator>
          </div>
          <div class="col-sm-2"><button class="btn btn-danger btn-sm w-100" type="button">Delete</button></div>
        `;
      }
      row.querySelector("button").addEventListener("click", () => row.remove());
      this.factorsEl.appendChild(row);
    }

    collect() {
      const unit = this.unitEl.value || "variable";
      if (unit === "variable")
        return {
          diceCount: 0,
          dieType: 6,
          staticValue: null,
          unit: "variable",
          factors: [],
          factorMode: "multiply",
        };
      const factors = [...this.factorsEl.children]
        .map((row) => {
          const level = row.querySelector("[data-factor-level]");
          const ability = row.querySelector("[data-factor-ability]");
          const ratio = {
            numerator: Math.max(
              1,
              Number(row.querySelector("[data-factor-numerator]")?.value || 1),
            ),
            denominator: Math.max(
              1,
              Number(row.querySelector("[data-factor-denominator]")?.value || 1),
            ),
          };
          if (level) return { ...sourceFromSelect(level.value), ...ratio };
          if (ability)
            return {
              type: "ability",
              ability: ability.value || "CON",
              ...ratio,
            };
          return null;
        })
        .filter(Boolean);
      return {
        diceCount: Math.max(
          0,
          Math.floor(Number(this.diceCountEl.value) || 0),
        ),
        dieType: Math.max(2, Math.floor(Number(this.dieTypeEl.value) || 6)),
        staticValue: Number(this.staticValueEl.value) || 0,
        ...(this.diceCountScale
          ? { diceCountScale: this.diceCountScale }
          : {}),
        ...(this.staticValueScale
          ? { staticValueScale: this.staticValueScale }
          : {}),
        unit,
        factors,
        factorMode: this.factorModeEl.value === "add" ? "add" : "multiply",
        ...(this.splitTargetsEl.checked ? { splitAmongTargets: true } : {}),
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
    normalizeDurationScale,
    durationLabel,
    parseDuration,
    levelSourceOptions,
    sourceFromSelect,
    factorLabel,
    durationMultiplier,
    applyDurationScale,
    durationScaleLabel,
    durationConfigFromSpellText,
  };
  window.PFEffectDurationEditor = DurationEditor;
})();
