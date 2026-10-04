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
    const unit =
      effectOrParts?.durationUnit || effectOrParts?.unit || "variable";
    const perLevel = Boolean(
      effectOrParts?.durationPerLevel ?? effectOrParts?.perLevel,
    );
    return {
      count:
        count === null || count === undefined || count === ""
          ? null
          : Number(count),
      unit,
      factors: perLevel ? [{ type: "caster" }] : [],
    };
  }

  function normalizeDurationConfig(effectOrConfig) {
    const raw = effectOrConfig?.durationConfig || effectOrConfig;
    const fallback = legacyDurationConfig(effectOrConfig);
    const count = raw?.count ?? fallback.count;
    const unit = raw?.unit || fallback.unit || "variable";
    const factors = Array.isArray(raw?.factors)
      ? raw.factors
      : fallback.factors;
    const durationScale = normalizeDurationScale(
      raw?.durationScale || raw?.scale || null,
    );
    return {
      count:
        unit === "variable" ||
        count === null ||
        count === undefined ||
        count === ""
          ? null
          : Math.max(1, Number(count) || 1),
      unit,
      factors:
        unit === "variable" ? [] : factors.map(normalizeFactor).filter(Boolean),
      // "multiply" (default) is the existing behavior: count * sum(factors),
      // e.g. "1 round per level". "add" is count + sum(factors), e.g. Rage's
      // "4 rounds + CON modifier" -- a flat base plus a modifier, not a
      // per-level scale. Defaulting to "multiply" keeps every duration
      // already configured the old way behaving identically.
      factorMode: raw?.factorMode === "add" ? "add" : "multiply",
      ...(unit !== "variable" && durationScale ? { durationScale } : {}),
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
    if (!config.count || config.unit === "variable") return "variable";
    const unit = `${config.unit}${config.count === 1 ? "" : "s"}`;
    const factors = config.factors.map(factorLabel).filter(Boolean);
    const baseLabel = !factors.length
      ? `${config.count} ${unit}`
      : config.factorMode === "add"
      ? `${config.count} ${unit} + ${factors.join(" + ")}`
      : `${config.count} ${unit} / ${factors.join(" + ")}`;
    const scaleLabel = durationScaleLabel(config.durationScale);
    return scaleLabel ? `${baseLabel}; ${scaleLabel}` : baseLabel;
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
    if (!config.count || config.unit === "variable") return null;
    const baseAmount =
      config.factorMode === "add"
        ? config.count + factorsSum(config, context)
        : config.count * durationMultiplier(config, context);
    const amount = applyDurationScale(
      baseAmount,
      config.durationScale,
      context,
    );
    if (config.unit === "turn" || config.unit === "round") return amount;
    if (config.unit === "minute") return amount * 10;
    if (config.unit === "hour") return amount * 600;
    if (config.unit === "day") return amount * 14400;
    return null;
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
                      ${DURATION_UNITS.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-sm-4 d-flex align-items-end">
                    <button class="btn btn-outline-light btn-sm w-100" type="button" data-duration-add-level>Add Level Factor</button>
                  </div>
                </div>
                <div class="d-flex gap-2 mb-2 align-items-end">
                  <button class="btn btn-outline-light btn-sm" type="button" data-duration-add-ability>Add Attribute Bonus</button>
                  <div class="flex-grow-1">
                    <label class="small">Factors</label>
                    <select class="form-select form-select-sm" data-duration-factor-mode>
                      <option value="multiply">Multiply count (e.g. 1 round per level)</option>
                      <option value="add">Add to count (e.g. 4 rounds + CON modifier)</option>
                    </select>
                  </div>
                </div>
                <div class="small-text mb-2" data-duration-factor-hint></div>
                <div class="vstack gap-2 mb-3" data-duration-factors></div>
                <div class="border-top border-secondary pt-3" data-duration-scaling>
                  <div class="row g-2 mb-3">
                    <div class="col-sm-8">
                      <label class="small">Scaling Level Source</label>
                      <select class="form-select form-select-sm" data-duration-scale-source>
                        ${levelSourceOptions({ type: "caster" }, { includeSpecial: true })}
                      </select>
                    </div>
                    <div class="col-sm-4 d-flex align-items-end">
                      <button class="btn btn-outline-info btn-sm w-100" type="button" data-duration-add-milestone>Add Milestone</button>
                    </div>
                  </div>
                  <div class="small text-secondary mb-2">Milestones</div>
                  <div class="vstack gap-2 mb-3" data-duration-milestones></div>
                  <div class="small text-secondary mb-2">Repeater</div>
                  <div class="row g-2">
                    <div class="col-sm-4">
                      <label class="small">From Level</label>
                      <input class="form-control form-control-sm" type="number" min="1" data-duration-repeat-from>
                    </div>
                    <div class="col-sm-4">
                      <label class="small">Every Levels</label>
                      <input class="form-control form-control-sm" type="number" min="1" data-duration-repeat-every>
                    </div>
                    <div class="col-sm-4">
                      <label class="small">Duration Increase</label>
                      <input class="form-control form-control-sm" type="number" data-duration-repeat-increase>
                    </div>
                  </div>
                </div>
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
      this.countEl = this.modal.querySelector("[data-duration-count]");
      this.unitEl = this.modal.querySelector("[data-duration-unit]");
      this.factorsEl = this.modal.querySelector("[data-duration-factors]");
      this.factorModeEl = this.modal.querySelector(
        "[data-duration-factor-mode]",
      );
      this.factorHintEl = this.modal.querySelector(
        "[data-duration-factor-hint]",
      );
      this.scalingEl = this.modal.querySelector("[data-duration-scaling]");
      this.scaleSourceEl = this.modal.querySelector(
        "[data-duration-scale-source]",
      );
      this.milestonesEl = this.modal.querySelector(
        "[data-duration-milestones]",
      );
      this.repeatFromEl = this.modal.querySelector(
        "[data-duration-repeat-from]",
      );
      this.repeatEveryEl = this.modal.querySelector(
        "[data-duration-repeat-every]",
      );
      this.repeatIncreaseEl = this.modal.querySelector(
        "[data-duration-repeat-increase]",
      );
      this.modal
        .querySelector("[data-duration-add-level]")
        .addEventListener("click", () => this.addFactor({ type: "caster" }));
      this.modal
        .querySelector("[data-duration-add-ability]")
        .addEventListener("click", () =>
          this.addFactor({ type: "ability", ability: "CON" }),
        );
      this.modal
        .querySelector("[data-duration-add-milestone]")
        .addEventListener("click", () => this.addMilestone());
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
      this.countEl.value = this.config.count || "";
      this.unitEl.value = this.config.unit || "variable";
      this.factorModeEl.value = this.config.factorMode || "multiply";
      this.factorsEl.innerHTML = "";
      this.config.factors.forEach((factor) => this.addFactor(factor));
      const scale = this.config.durationScale || {};
      this.scaleSourceEl.innerHTML = levelSourceOptions(
        scale.source || { type: "caster" },
        { includeSpecial: true },
      );
      this.milestonesEl.innerHTML = "";
      (scale.milestones || []).forEach((milestone) =>
        this.addMilestone(milestone),
      );
      this.repeatFromEl.value = scale.every?.fromLevel || "";
      this.repeatEveryEl.value = scale.every?.everyLevels || "";
      this.repeatIncreaseEl.value = scale.every?.increase ?? "";
      this.sync();
      this.syncFactorHint();
      bootstrap.Modal.getOrCreateInstance(this.modal).show();
    }

    sync() {
      const variable = this.unitEl.value === "variable";
      this.countEl.disabled = variable;
      this.modal
        .querySelectorAll(
          "[data-duration-add-level], [data-duration-add-ability]",
        )
        .forEach((button) => (button.disabled = variable));
      this.factorModeEl.disabled = variable;
      this.factorsEl.classList.toggle("d-none", variable);
      this.scalingEl.classList.toggle("d-none", variable);
      if (variable) this.countEl.value = "";
    }

    syncFactorHint() {
      this.factorHintEl.textContent =
        this.factorModeEl.value === "add"
          ? "Factors are added together, then added to the duration count -- for a flat base plus a modifier, like Rage's 4 rounds + CON modifier."
          : "Factors are added together, then multiplied by the duration count -- for scaling with level, like 1 minute per caster level.";
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

    addMilestone(milestone = {}) {
      const row = document.createElement("div");
      row.className = "row g-2 align-items-end";
      row.innerHTML = `
        <div class="col-sm-5">
          <label class="small">Level</label>
          <input class="form-control form-control-sm" type="number" min="1" value="${milestone.level || ""}" data-duration-milestone-level>
        </div>
        <div class="col-sm-5">
          <label class="small">Duration</label>
          <input class="form-control form-control-sm" type="number" min="1" value="${milestone.value ?? ""}" data-duration-milestone-value>
        </div>
        <div class="col-sm-2">
          <button class="btn btn-outline-danger btn-sm w-100" type="button" aria-label="Delete duration milestone"><i class="bi bi-trash"></i></button>
        </div>`;
      row.querySelector("button").addEventListener("click", () => row.remove());
      this.milestonesEl.appendChild(row);
    }

    collect() {
      const unit = this.unitEl.value || "variable";
      if (unit === "variable")
        return { count: null, unit: "variable", factors: [], factorMode: "multiply" };
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
      const milestones = [...this.milestonesEl.children]
        .map((row) => ({
          level: Number.parseInt(
            row.querySelector("[data-duration-milestone-level]").value,
            10,
          ),
          value: Number(
            row.querySelector("[data-duration-milestone-value]").value,
          ),
        }))
        .filter(
          (milestone) =>
            milestone.level > 0 && Number.isFinite(milestone.value),
        )
        .sort((a, b) => a.level - b.level);
      const fromLevel = Number.parseInt(this.repeatFromEl.value, 10);
      const everyLevels = Number.parseInt(this.repeatEveryEl.value, 10);
      const increase = Number(this.repeatIncreaseEl.value);
      const every =
        fromLevel > 0 &&
        everyLevels > 0 &&
        Number.isFinite(increase) &&
        increase !== 0
          ? { fromLevel, everyLevels, increase }
          : null;
      const durationScale =
        milestones.length || every
          ? {
              source: sourceFromSelect(this.scaleSourceEl.value),
              milestones,
              every,
            }
          : null;
      return {
        count: Math.max(1, Number.parseInt(this.countEl.value, 10) || 1),
        unit,
        factors,
        factorMode: this.factorModeEl.value === "add" ? "add" : "multiply",
        ...(durationScale ? { durationScale } : {}),
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
    legacyDurationConfig,
    durationLabel,
    parseDuration,
    levelSourceOptions,
    sourceFromSelect,
    factorLabel,
    durationMultiplier,
    applyDurationScale,
    durationScaleLabel,
  };
  window.PFEffectDurationEditor = DurationEditor;
})();
