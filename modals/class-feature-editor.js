(function () {
  const EFFECT_STATS = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
    "attack",
    "melee attack",
    "ranged attack",
    "extra attack",
    "damage",
    "melee damage",
    "ranged damage",
    "ac",
    "touch ac",
    "flat-footed ac",
    "remove dex bonus to ac",
    "natural armor",
    "deflection",
    "fortitude",
    "reflex",
    "will",
    "all saves",
    "initiative",
    "cmb",
    "cmd",
    "hit points",
    "spell resistance",
  ];
  const SKILL_STATS = [
    "skill checks",
    "strength skill checks",
    "dexterity skill checks",
    "constitution skill checks",
    "intelligence skill checks",
    "wisdom skill checks",
    "charisma skill checks",
  ];
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
  const SPECIFIC_SKILL_STATS = PF_SKILLS.map(
    (skill) => `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
  );
  const BONUS_TYPES = [
    "untyped",
    "alchemical",
    "condition",
    "penalty",
    "armor",
    "circumstance",
    "competence",
    "deflection",
    "dodge",
    "enhancement",
    "insight",
    "luck",
    "morale",
    "natural armor",
    "profane",
    "resistance",
    "sacred",
    "shield",
    "size",
  ];

  let modal = null;
  let scaleModal = null;
  let resolver = null;
  let editingScaleRow = null;
  let initialized = false;
  let durationEditor = null;
  let featureDurationConfig = null;
  let editingMode = "feature";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function titleCaseStat(value) {
    const key = String(value || "")
      .toLowerCase()
      .trim();
    const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(key);
    if (choiceLabel) return choiceLabel;
    if (key === "extra attack") return "Extra Attack at Highest BAB";
    if (key.startsWith("skill:")) {
      const skill = PF_SKILLS.find(
        (entry) =>
          `skill:${entry.replace(/[^a-z0-9]/gi, "").toLowerCase()}` === key,
      );
      return `Skill: ${skill || key.slice(6)}`;
    }
    return key
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function effectStatOptions(selected = "") {
    const option = (value, label = titleCaseStat(value)) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    return `
      <optgroup label="Stats">${EFFECT_STATS.map((stat) => option(stat)).join("")}</optgroup>
      <optgroup label="Skills">
        ${SKILL_STATS.map((stat) => option(stat)).join("")}
        <option value="skill:craft" ${selected === "skill:craft" ? "selected" : ""}>Skill: Craft</option>
        <option value="skill:profession" ${selected === "skill:profession" ? "selected" : ""}>Skill: Profession</option>
        ${SPECIFIC_SKILL_STATS.map((stat) => option(stat)).join("")}
      </optgroup>
      ${window.PFEffectStats?.choiceOptgroupHtml?.(selected, escapeHtml) || ""}
    `;
  }

  function skillKey(name) {
    return `skill:${String(name || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase()}`;
  }

  function namedSkill(kind, value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const prefix = kind === "skill:profession" ? "Profession" : "Craft";
    if (text.toLowerCase().startsWith(`${prefix.toLowerCase()} (`)) return text;
    return `${prefix} (${text})`;
  }

  function ensureModal() {
    if (
      initialized &&
      document.getElementById("classFeatureEditorModal") &&
      document.getElementById("classFeatureScaleModal")
    )
      return;
    document.getElementById("classFeatureEditorModal")?.remove();
    document.getElementById("classFeatureScaleModal")?.remove();
    initialized = true;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="classFeatureEditorModal" tabindex="-1" aria-labelledby="classFeatureEditorModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form id="classFeatureEditorForm" class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title" id="classFeatureEditorModalLabel">Class Feature</h5>
              <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label for="classFeatureName">Name</label>
                <input id="classFeatureName" class="form-control form-control-sm" required>
              </div>
              <div class="mb-3">
                <label for="classFeatureDescription">Description</label>
                <textarea id="classFeatureDescription" class="form-control form-control-sm" rows="5"></textarea>
              </div>
              <div id="classFeatureRequirementsSection" class="d-none">
                <div class="row g-2 mb-2">
                  <div class="col-md-4">
                    <label for="classFeatureReqMinLevel">Minimum Class Level</label>
                    <input id="classFeatureReqMinLevel" class="form-control form-control-sm" type="number" min="1" max="20">
                  </div>
                  <div class="col-md-8">
                    <label for="classFeatureReqRace">Race Requirement</label>
                    <input id="classFeatureReqRace" class="form-control form-control-sm" placeholder="Elf">
                  </div>
                </div>
                <div class="mb-2">
                  <label for="classFeatureReqChoices">Required Previous Choices</label>
                  <input id="classFeatureReqChoices" class="form-control form-control-sm" placeholder="Mutagen, Greater Mutagen">
                </div>
                <div class="mb-2">
                  <label for="classFeatureReqExclusiveGroup">Exclusive Group</label>
                  <input id="classFeatureReqExclusiveGroup" class="form-control form-control-sm" placeholder="totem">
                  <div class="small-text">Choices sharing this tag block each other (e.g. tag every totem-line rage power "totem") -- a later tier that requires an earlier one via "Required Previous Choices" is still allowed.</div>
                </div>
                <div class="mb-3">
                  <label for="classFeatureReqText">Requirement Notes</label>
                  <textarea id="classFeatureReqText" class="form-control form-control-sm" rows="2"></textarea>
                </div>
              </div>
              <div class="mb-3 class-feature-activatable-row">
                <div class="form-check form-switch">
                  <input id="classFeatureActivatable" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="classFeatureActivatable">Activatable (not always on)</label>
                </div>
                <div id="classFeatureActivatableHint" class="small-text mb-2 d-none">
                  These effects only apply when a player activates this feature (e.g. Rage) -- they won't be added to always-on class bonuses, and the feature becomes selectable in the Effects tab and the map's effect pickers.
                </div>
                <div id="classFeatureDurationField" class="d-flex align-items-center gap-2 d-none">
                  <button id="classFeatureEditDuration" class="btn btn-outline-light btn-sm" type="button">Edit Duration</button>
                  <span id="classFeatureDurationSummary" class="small-text"></span>
                </div>
              </div>
              <div class="accordion accordion-flush class-feature-stat-accordion" id="classFeatureStatAccordion">
                <div class="accordion-item">
                  <h2 class="accordion-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#classFeatureEffectsPanel" aria-expanded="true" aria-controls="classFeatureEffectsPanel">
                      Feature Effects <span id="classFeatureEffectsCount" class="badge text-bg-secondary ms-2"></span>
                    </button>
                  </h2>
                  <div id="classFeatureEffectsPanel" class="accordion-collapse collapse show" data-bs-parent="#classFeatureStatAccordion">
                    <div class="accordion-body">
                      <div class="d-flex justify-content-end mb-2">
                        <button id="addClassFeatureEffect" class="btn btn-outline-info btn-sm" type="button">Create Effect</button>
                      </div>
                      <div id="classFeatureEffectRows" class="vstack gap-2"></div>
                    </div>
                  </div>
                </div>
                <div class="accordion-item">
                  <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#classFeatureDrPanel" aria-expanded="false" aria-controls="classFeatureDrPanel">
                      Damage Reduction <span id="classFeatureDrCount" class="badge text-bg-secondary ms-2"></span>
                    </button>
                  </h2>
                  <div id="classFeatureDrPanel" class="accordion-collapse collapse" data-bs-parent="#classFeatureStatAccordion">
                    <div class="accordion-body">
                      <div class="d-flex justify-content-end mb-2">
                        <button id="addClassFeatureDr" class="btn btn-outline-info btn-sm" type="button">Add DR</button>
                      </div>
                      <div id="classFeatureDrRows" class="vstack gap-2"></div>
                    </div>
                  </div>
                </div>
                <div class="accordion-item">
                  <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#classFeatureSrPanel" aria-expanded="false" aria-controls="classFeatureSrPanel">
                      Spell Resistance <span id="classFeatureSrCount" class="badge text-bg-secondary ms-2"></span>
                    </button>
                  </h2>
                  <div id="classFeatureSrPanel" class="accordion-collapse collapse" data-bs-parent="#classFeatureStatAccordion">
                    <div class="accordion-body">
                      <div class="d-flex justify-content-end mb-2">
                        <button id="addClassFeatureSr" class="btn btn-outline-info btn-sm" type="button">Add SR</button>
                      </div>
                      <div id="classFeatureSrRows" class="vstack gap-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Feature</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);

    const scaleWrapper = document.createElement("div");
    scaleWrapper.innerHTML = `
      <div class="modal fade" id="classFeatureScaleModal" tabindex="-1" aria-labelledby="classFeatureScaleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title" id="classFeatureScaleModalLabel">Bonus Scale</h5>
              <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2 mb-3">
                <div class="col-12">
                  <label for="classFeatureScaleSource">Level Source</label>
                  <select id="classFeatureScaleSource" class="form-select form-select-sm">
                    ${window.PFEffectMeta?.levelSourceOptions?.({ type: "caster" }) || '<option value="caster">Caster level</option><option value="character">Character level</option>'}
                  </select>
                </div>
              </div>
              <div class="small text-secondary mb-2">Level Multiplier</div>
              <div class="row g-2 mb-1 align-items-end">
                <div class="col-4">
                  <label for="classFeatureScaleMultiplierNum">Numerator</label>
                  <input id="classFeatureScaleMultiplierNum" class="form-control form-control-sm" type="number" min="0" placeholder="e.g. 1">
                </div>
                <div class="col-4">
                  <label for="classFeatureScaleMultiplierDen">Denominator</label>
                  <input id="classFeatureScaleMultiplierDen" class="form-control form-control-sm" type="number" min="1" placeholder="e.g. 2">
                </div>
                <div class="col-4">
                  <button id="clearClassFeatureScaleMultiplier" class="btn btn-outline-secondary btn-sm w-100" type="button">Clear</button>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-2" id="classFeatureScaleMultiplierPresets">
                ${[
                  ["1", "4"],
                  ["1", "3"],
                  ["1", "2"],
                  ["2", "1"],
                  ["3", "1"],
                  ["4", "1"],
                ]
                  .map(
                    ([num, den]) =>
                      `<button type="button" class="btn btn-outline-info btn-sm" data-scale-multiplier-preset="${num}/${den}">${den === "1" ? `${num}x` : `${num}/${den}`}</button>`,
                  )
                  .join("")}
              </div>
              <div class="form-check form-switch mb-3">
                <input id="classFeatureScaleMinOne" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="classFeatureScaleMinOne">Minimum 1 (never rounds down to 0)</label>
              </div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Milestones</div>
                <button id="addClassFeatureScaleMilestone" class="btn btn-outline-info btn-sm" type="button">Add Milestone</button>
              </div>
              <div id="classFeatureScaleRows" class="vstack gap-2 mb-3"></div>
              <div class="row g-2">
                <div class="col-sm-4">
                  <label for="classFeatureScaleAfter">After Level</label>
                  <input id="classFeatureScaleAfter" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="classFeatureScaleEvery">Every Levels</label>
                  <input id="classFeatureScaleEvery" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="classFeatureScaleIncrease">Increase Bonus By</label>
                  <input id="classFeatureScaleIncrease" class="form-control form-control-sm" type="number">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="clearClassFeatureScale" type="button" class="btn btn-outline-danger btn-sm">Clear Scale</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="saveClassFeatureScale" type="button" class="btn btn-primary btn-sm">Save Scale</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(scaleWrapper.firstElementChild);

    document
      .getElementById("addClassFeatureEffect")
      .addEventListener("click", () => addEffectRow());
    document
      .getElementById("addClassFeatureDr")
      .addEventListener("click", () => addDrRow());
    document
      .getElementById("addClassFeatureSr")
      .addEventListener("click", () => addSrRow());
    document
      .getElementById("classFeatureActivatable")
      .addEventListener("change", updateActivatableVisibility);
    document
      .getElementById("classFeatureEditDuration")
      .addEventListener("click", () => {
        if (!window.PFEffectDurationEditor) return;
        durationEditor =
          durationEditor || new window.PFEffectDurationEditor("classFeature");
        durationEditor.open(featureDurationConfig || {}, (config) => {
          featureDurationConfig = config;
          updateDurationSummary();
        });
      });
    document
      .getElementById("addClassFeatureScaleMilestone")
      .addEventListener("click", () => addScaleMilestoneRow());
    document
      .getElementById("classFeatureScaleMultiplierPresets")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-scale-multiplier-preset]");
        if (!button) return;
        const [num, den] = button.dataset.scaleMultiplierPreset.split("/");
        document.getElementById("classFeatureScaleMultiplierNum").value = num;
        document.getElementById("classFeatureScaleMultiplierDen").value = den;
      });
    document
      .getElementById("clearClassFeatureScaleMultiplier")
      .addEventListener("click", () => {
        document.getElementById("classFeatureScaleMultiplierNum").value = "";
        document.getElementById("classFeatureScaleMultiplierDen").value = "";
      });
    document
      .getElementById("clearClassFeatureScale")
      .addEventListener("click", clearScale);
    document
      .getElementById("saveClassFeatureScale")
      .addEventListener("click", saveScale);
    document
      .getElementById("classFeatureEditorForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const feature = collectFeature();
        if (!feature.name) return;
        resolver?.(feature);
        modal.hide();
      });
    document
      .getElementById("classFeatureEditorModal")
      .addEventListener("hidden.bs.modal", () => {
        resolver?.(null);
        resolver = null;
      });
  }

  // Badge counts on each accordion header so a collapsed section still
  // shows whether it has anything in it (Effects/DR/SR, more to come).
  function updateAccordionCounts() {
    const counts = [
      ["classFeatureEffectsCount", "#classFeatureEffectRows > *"],
      ["classFeatureDrCount", "#classFeatureDrRows > *"],
      ["classFeatureSrCount", "#classFeatureSrRows > *"],
    ];
    counts.forEach(([badgeId, selector]) => {
      const badge = document.getElementById(badgeId);
      if (!badge) return;
      const count = document.querySelectorAll(selector).length;
      badge.textContent = count ? String(count) : "";
      badge.classList.toggle("d-none", !count);
    });
  }

  function addEffectRow(data = {}) {
    const rows = document.getElementById("classFeatureEffectRows");
    const row = document.createElement("div");
    row.className = "class-feature-effect-row";
    const selectedStat = String(data.skillName || "")
      .toLowerCase()
      .startsWith("profession")
      ? "skill:profession"
      : String(data.skillName || "")
            .toLowerCase()
            .startsWith("craft")
        ? "skill:craft"
        : data.stat || "";
    row.innerHTML = `
      <div>
        <label>Stat</label>
        <select data-effect-field="stat" class="form-select form-select-sm">${effectStatOptions(selectedStat)}</select>
      </div>
      <div class="named-skill-field d-none">
        <label>Skill Name</label>
        <input data-effect-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
      <div class="effect-value-field">
        <label>Value</label>
        <input data-effect-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? 0}">
      </div>
      <div class="effect-type-field">
        <label>Type</label>
        <select data-effect-field="type" class="form-select form-select-sm">
          ${BONUS_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${(data.type || "untyped") === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label>Stacks</label>
        <div class="form-check form-switch">
          <input data-effect-field="stacks" class="form-check-input" type="checkbox" ${data.stacks ? "checked" : ""}>
        </div>
      </div>
      <div>
        <label>Class Skill</label>
        <div class="form-check form-switch">
          <input data-effect-field="classSkillGrant" class="form-check-input" type="checkbox" ${data.classSkillGrant ? "checked" : ""}>
        </div>
      </div>
      <button class="btn btn-outline-info btn-sm effect-scale-button" type="button" data-scale-bonus>Bonus Scale</button>
      <div class="class-feature-condition-inline">
        <div>
          <label>Conditional</label>
          <div class="form-check form-switch">
            <input data-effect-field="conditional" class="form-check-input" type="checkbox" ${data.conditional ? "checked" : ""}>
          </div>
        </div>
        <div>
          <label>Applies When</label>
          <input data-effect-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(data.appliesWhen || "")}" placeholder="vs undead">
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete effect"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    row._bonusScale = data.bonusScale || data.scale || null;
    const statSelect = row.querySelector('[data-effect-field="stat"]');
    const namedSkillField = row.querySelector(".named-skill-field");
    const skillNameInput = row.querySelector('[data-effect-field="skillName"]');
    const syncNamedSkill = () => {
      const named = ["skill:craft", "skill:profession"].includes(
        statSelect.value,
      );
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder =
        statSelect.value === "skill:profession" ? "Sailor" : "Alchemy";
    };
    statSelect.addEventListener("change", syncNamedSkill);
    syncNamedSkill();
    // "Becomes a Class Skill" is a flag, not a numeric bonus -- Value/
    // Type/Bonus Scale don't mean anything for it, so hide them instead
    // of leaving fields that would just be ignored.
    const classSkillCheckbox = row.querySelector(
      '[data-effect-field="classSkillGrant"]',
    );
    const syncClassSkillGrant = () => {
      const granting = classSkillCheckbox.checked;
      row.querySelector(".effect-value-field").classList.toggle("d-none", granting);
      row.querySelector(".effect-type-field").classList.toggle("d-none", granting);
      row.querySelector(".effect-scale-button").classList.toggle("d-none", granting);
    };
    classSkillCheckbox.addEventListener("change", syncClassSkillGrant);
    syncClassSkillGrant();
    row
      .querySelector("[data-scale-bonus]")
      .addEventListener("click", () => openScaleModal(row));
    row
      .querySelector('button[aria-label="Delete effect"]')
      .addEventListener("click", () => {
        row.remove();
        updateAccordionCounts();
      });
    updateScaleSummary(row);
    rows.appendChild(row);
    updateAccordionCounts();
  }

  // Damage reduction is "N/type" -- a numeric amount plus the type of
  // attack that overcomes it (e.g. "magic", "cold iron and evil"). A dash
  // ("-") means it applies to any attack that doesn't ignore DR outright.
  // The amount can scale by level using the same scale modal as effects.
  function addDrRow(data = {}) {
    const rows = document.getElementById("classFeatureDrRows");
    const row = document.createElement("div");
    row.className = "class-feature-dr-row";
    row.innerHTML = `
      <div>
        <label>Amount</label>
        <input data-dr-field="amount" class="form-control form-control-sm" type="number" min="0" value="${Number(data.amount || 0)}">
      </div>
      <div>
        <label>Overcome Type</label>
        <input data-dr-field="overcomeType" class="form-control form-control-sm" value="${escapeHtml(data.overcomeType || "")}" placeholder="magic, or - for any">
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete DR"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    row._bonusScale = data.bonusScale || data.scale || null;
    row
      .querySelector("[data-scale-bonus]")
      .addEventListener("click", () => openScaleModal(row));
    row
      .querySelector('button[aria-label="Delete DR"]')
      .addEventListener("click", () => {
        row.remove();
        updateAccordionCounts();
      });
    updateScaleSummary(row);
    rows.appendChild(row);
    updateAccordionCounts();
  }

  // Spell Resistance -- a flat number that can scale by level the same
  // way DR and effect bonuses do, plus the same Conditional/Applies When
  // pair every other effect uses (e.g. "vs. evil spells") instead of a
  // one-off free-text field.
  function addSrRow(data = {}) {
    const rows = document.getElementById("classFeatureSrRows");
    const row = document.createElement("div");
    row.className = "class-feature-sr-row";
    const conditional = data.conditional ?? Boolean(data.condition);
    const appliesWhen = data.appliesWhen || data.condition || "";
    row.innerHTML = `
      <div>
        <label>Amount</label>
        <input data-sr-field="amount" class="form-control form-control-sm" type="number" min="0" value="${Number(data.amount || 0)}">
      </div>
      <div>
        <label>Conditional</label>
        <div class="form-check form-switch">
          <input data-sr-field="conditional" class="form-check-input" type="checkbox" ${conditional ? "checked" : ""}>
        </div>
      </div>
      <div>
        <label>Applies When</label>
        <input data-sr-field="appliesWhen" class="form-control form-control-sm" value="${escapeHtml(appliesWhen)}" placeholder="vs evil">
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Scale</button>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete SR"><i class="bi bi-trash"></i></button>
      <div class="small text-secondary" data-scale-summary></div>
    `;
    row._bonusScale = data.bonusScale || data.scale || null;
    row
      .querySelector("[data-scale-bonus]")
      .addEventListener("click", () => openScaleModal(row));
    row
      .querySelector('button[aria-label="Delete SR"]')
      .addEventListener("click", () => {
        row.remove();
        updateAccordionCounts();
      });
    updateScaleSummary(row);
    rows.appendChild(row);
    updateAccordionCounts();
  }

  function scaleSourceLabel(source = {}) {
    if (source.type === "character") return "character level";
    if (source.type === "class")
      return source.className ? `${source.className} level` : "class level";
    return "caster level";
  }

  // "1/2" for a fraction, "3x" for a whole-number multiplier -- matches
  // how the preset buttons in the scale modal label themselves.
  function levelMultiplierText(multiplier) {
    if (!multiplier) return "";
    const { numerator, denominator } = multiplier;
    return denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`;
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const source = scaleSourceLabel(scale.source || { type: "caster" });
    if (scale.levelMultiplier) {
      parts.push(
        `${levelMultiplierText(scale.levelMultiplier)} ${source} (round down)`,
      );
    }
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    if (milestones.length) {
      parts.push(
        milestones
          .map(
            (milestone) =>
              `${source} ${milestone.level}: ${milestone.value >= 0 ? "+" : ""}${milestone.value}`,
          )
          .join(", "),
      );
    }
    const every = scale.every || {};
    if (every.afterLevel && every.everyLevels && every.increase) {
      parts.push(
        `after ${source} ${every.afterLevel}, every ${every.everyLevels}: ${every.increase >= 0 ? "+" : ""}${every.increase}`,
      );
    }
    if (scale.minimumOne) parts.push("minimum 1");
    return parts.join("; ");
  }

  function updateScaleSummary(row) {
    const summary = row.querySelector("[data-scale-summary]");
    if (!summary) return;
    const text = scaleText(row._bonusScale);
    summary.textContent = text ? `Scales: ${text}` : "";
  }

  function addScaleMilestoneRow(data = {}) {
    const rows = document.getElementById("classFeatureScaleRows");
    const row = document.createElement("div");
    row.className = "class-feature-scale-row";
    row.innerHTML = `
      <div>
        <label>Level</label>
        <input data-scale-field="level" class="form-control form-control-sm" type="number" min="1" value="${data.level || ""}">
      </div>
      <div>
        <label>Bonus Value</label>
        <input data-scale-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? ""}">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button">Delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    rows.appendChild(row);
  }

  function openScaleModal(row) {
    editingScaleRow = row;
    const scale = row._bonusScale || {};
    const source = scale.source || { type: "caster" };
    const sourceSelect = document.getElementById("classFeatureScaleSource");
    if (sourceSelect && window.PFEffectMeta?.levelSourceOptions) {
      sourceSelect.innerHTML = window.PFEffectMeta.levelSourceOptions(source);
    } else if (sourceSelect) {
      sourceSelect.value = source.type || "caster";
    }
    document.getElementById("classFeatureScaleMultiplierNum").value =
      scale.levelMultiplier?.numerator ?? "";
    document.getElementById("classFeatureScaleMultiplierDen").value =
      scale.levelMultiplier?.denominator ?? "";
    document.getElementById("classFeatureScaleMinOne").checked = Boolean(
      scale.minimumOne,
    );
    document.getElementById("classFeatureScaleRows").innerHTML = "";
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    if (milestones.length)
      milestones.forEach((milestone) => addScaleMilestoneRow(milestone));
    else addScaleMilestoneRow();
    const every = scale.every || {};
    document.getElementById("classFeatureScaleAfter").value =
      every.afterLevel || "";
    document.getElementById("classFeatureScaleEvery").value =
      every.everyLevels || "";
    document.getElementById("classFeatureScaleIncrease").value =
      every.increase ?? "";
    scaleModal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("classFeatureScaleModal"),
    );
    scaleModal.show();
  }

  function collectScale() {
    const milestones = [
      ...document.querySelectorAll(
        "#classFeatureScaleRows .class-feature-scale-row",
      ),
    ]
      .map((row) => ({
        level: Number.parseInt(
          row.querySelector('[data-scale-field="level"]').value,
          10,
        ),
        value: Number(row.querySelector('[data-scale-field="value"]').value),
      }))
      .filter(
        (milestone) => milestone.level > 0 && Number.isFinite(milestone.value),
      )
      .sort((a, b) => a.level - b.level);
    const afterLevel = Number.parseInt(
      document.getElementById("classFeatureScaleAfter").value,
      10,
    );
    const everyLevels = Number.parseInt(
      document.getElementById("classFeatureScaleEvery").value,
      10,
    );
    const increase = Number(
      document.getElementById("classFeatureScaleIncrease").value,
    );
    const every =
      afterLevel > 0 &&
      everyLevels > 0 &&
      Number.isFinite(increase) &&
      increase !== 0
        ? { afterLevel, everyLevels, increase }
        : null;
    const multiplierNumerator = Number(
      document.getElementById("classFeatureScaleMultiplierNum").value,
    );
    const multiplierDenominator = Number(
      document.getElementById("classFeatureScaleMultiplierDen").value,
    );
    const levelMultiplier =
      multiplierNumerator > 0 && multiplierDenominator > 0
        ? { numerator: multiplierNumerator, denominator: multiplierDenominator }
        : null;
    const minimumOne = document.getElementById(
      "classFeatureScaleMinOne",
    ).checked;
    if (!milestones.length && !every && !levelMultiplier && !minimumOne)
      return null;
    const sourceSelect = document.getElementById("classFeatureScaleSource");
    const source = window.PFEffectMeta?.sourceFromSelect
      ? window.PFEffectMeta.sourceFromSelect(sourceSelect?.value || "caster")
      : { type: sourceSelect?.value || "caster" };
    return {
      source,
      milestones,
      every,
      ...(levelMultiplier ? { levelMultiplier } : {}),
      ...(minimumOne ? { minimumOne: true } : {}),
    };
  }

  function clearScale() {
    if (!editingScaleRow) return;
    editingScaleRow._bonusScale = null;
    updateScaleSummary(editingScaleRow);
    bootstrap.Modal.getInstance(
      document.getElementById("classFeatureScaleModal"),
    )?.hide();
  }

  function saveScale() {
    if (!editingScaleRow) return;
    editingScaleRow._bonusScale = collectScale();
    updateScaleSummary(editingScaleRow);
    bootstrap.Modal.getInstance(
      document.getElementById("classFeatureScaleModal"),
    )?.hide();
  }

  function collectEffects() {
    return [
      ...document.querySelectorAll(
        "#classFeatureEffectRows .class-feature-effect-row",
      ),
    ].map((row) => {
      const selectedStat = row.querySelector(
        '[data-effect-field="stat"]',
      ).value;
      const skillName = ["skill:craft", "skill:profession"].includes(
        selectedStat,
      )
        ? namedSkill(
            selectedStat,
            row.querySelector('[data-effect-field="skillName"]')?.value,
          )
        : "";
      const effect = {
        stat: skillName ? skillKey(skillName) : selectedStat,
        value: Number(
          row.querySelector('[data-effect-field="value"]').value || 0,
        ),
        type:
          row.querySelector('[data-effect-field="type"]').value || "untyped",
        stacks: row.querySelector('[data-effect-field="stacks"]').checked,
        conditional: row.querySelector('[data-effect-field="conditional"]')
          .checked,
        appliesWhen: row
          .querySelector('[data-effect-field="appliesWhen"]')
          .value.trim(),
      };
      if (skillName) effect.skillName = skillName;
      if (row._bonusScale) effect.bonusScale = row._bonusScale;
      if (row.querySelector('[data-effect-field="classSkillGrant"]').checked)
        effect.classSkillGrant = true;
      return effect;
    });
  }

  // Activatable features aren't always-on: their effects only apply once a
  // player triggers them (Rage, Smite Evil, etc.), so they need a duration
  // like any other cast effect. Reuses the same duration editor buffs use.
  function updateActivatableVisibility() {
    const active = document.getElementById("classFeatureActivatable").checked;
    document
      .getElementById("classFeatureActivatableHint")
      .classList.toggle("d-none", !active);
    document
      .getElementById("classFeatureDurationField")
      .classList.toggle("d-none", !active);
  }

  function updateDurationSummary() {
    const summary = document.getElementById("classFeatureDurationSummary");
    if (!summary) return;
    summary.textContent = window.PFEffectMeta?.durationLabel
      ? window.PFEffectMeta.durationLabel(featureDurationConfig || {})
      : "";
  }

  function collectDr() {
    return [
      ...document.querySelectorAll("#classFeatureDrRows .class-feature-dr-row"),
    ]
      .map((row) => {
        const dr = {
          amount: Number(row.querySelector('[data-dr-field="amount"]').value || 0),
          overcomeType: row
            .querySelector('[data-dr-field="overcomeType"]')
            .value.trim(),
        };
        if (row._bonusScale) dr.bonusScale = row._bonusScale;
        return dr;
      })
      .filter((dr) => dr.amount > 0 || dr.bonusScale);
  }

  function collectSr() {
    return [
      ...document.querySelectorAll("#classFeatureSrRows .class-feature-sr-row"),
    ]
      .map((row) => {
        const sr = {
          amount: Number(row.querySelector('[data-sr-field="amount"]').value || 0),
          conditional: row.querySelector('[data-sr-field="conditional"]').checked,
          appliesWhen: row
            .querySelector('[data-sr-field="appliesWhen"]')
            .value.trim(),
        };
        if (row._bonusScale) sr.bonusScale = row._bonusScale;
        return sr;
      })
      .filter((sr) => sr.amount > 0 || sr.bonusScale);
  }

  // Pool choices (rage powers, rogue talents, ...) have prerequisites a
  // plain class feature doesn't. Only collected/shown when editing a pool
  // option (mode: "option").
  function collectRequirements() {
    const minClassLevel = Number.parseInt(
      document.getElementById("classFeatureReqMinLevel").value || "",
      10,
    );
    const requiredChoices = document
      .getElementById("classFeatureReqChoices")
      .value.split(",")
      .map((choice) => choice.trim())
      .filter(Boolean);
    const requirements = {
      minClassLevel: minClassLevel > 0 ? minClassLevel : null,
      race: document.getElementById("classFeatureReqRace").value.trim(),
      requiredChoices,
      excludesGroup: document
        .getElementById("classFeatureReqExclusiveGroup")
        .value.trim(),
      text: document.getElementById("classFeatureReqText").value.trim(),
    };
    Object.keys(requirements).forEach((key) => {
      if (
        requirements[key] === "" ||
        requirements[key] === null ||
        (Array.isArray(requirements[key]) && !requirements[key].length)
      )
        delete requirements[key];
    });
    return requirements;
  }

  function applyRequirementsToForm(requirements = {}) {
    document.getElementById("classFeatureReqMinLevel").value =
      requirements.minClassLevel || "";
    document.getElementById("classFeatureReqRace").value =
      requirements.race || "";
    document.getElementById("classFeatureReqChoices").value = (
      Array.isArray(requirements.requiredChoices)
        ? requirements.requiredChoices
        : []
    ).join(", ");
    document.getElementById("classFeatureReqExclusiveGroup").value =
      requirements.excludesGroup || "";
    document.getElementById("classFeatureReqText").value =
      requirements.text || requirements.notes || "";
  }

  function collectFeature() {
    const activatable = document.getElementById("classFeatureActivatable")
      .checked;
    const feature = {
      name: document.getElementById("classFeatureName").value.trim(),
      description: document
        .getElementById("classFeatureDescription")
        .value.trim(),
    };
    const effects = collectEffects();
    if (effects.length) feature.effects = effects;
    const damageReduction = collectDr();
    if (damageReduction.length) feature.damageReduction = damageReduction;
    const spellResistance = collectSr();
    if (spellResistance.length) feature.spellResistance = spellResistance;
    if (activatable) {
      feature.activatable = true;
      if (featureDurationConfig) feature.durationConfig = featureDurationConfig;
    }
    if (editingMode === "option") {
      const requirements = collectRequirements();
      if (Object.keys(requirements).length) feature.requirements = requirements;
    }
    return feature;
  }

  // mode: "feature" (default) edits a class feature. "option" edits a
  // choice inside a feature pool (a rage power, rogue talent, ...) -- same
  // effects/DR/activatable editing, plus its own prerequisites.
  function open(feature = {}, { mode = "feature" } = {}) {
    ensureModal();
    editingMode = mode === "option" ? "option" : "feature";
    const isOption = editingMode === "option";
    document.getElementById("classFeatureEditorModalLabel").textContent =
      isOption ? "Pool Choice" : "Class Feature";
    document
      .getElementById("classFeatureRequirementsSection")
      .classList.toggle("d-none", !isOption);
    if (isOption) applyRequirementsToForm(feature.requirements || {});
    document.getElementById("classFeatureName").value = feature.name || "";
    document.getElementById("classFeatureDescription").value =
      feature.description || "";
    document.getElementById("classFeatureActivatable").checked = Boolean(
      feature.activatable,
    );
    featureDurationConfig = feature.durationConfig || null;
    updateActivatableVisibility();
    updateDurationSummary();
    document.getElementById("classFeatureEffectRows").innerHTML = "";
    (Array.isArray(feature.effects) ? feature.effects : []).forEach((effect) =>
      addEffectRow(effect),
    );
    document.getElementById("classFeatureDrRows").innerHTML = "";
    (Array.isArray(feature.damageReduction) ? feature.damageReduction : []).forEach(
      (dr) => addDrRow(dr),
    );
    document.getElementById("classFeatureSrRows").innerHTML = "";
    (Array.isArray(feature.spellResistance) ? feature.spellResistance : []).forEach(
      (sr) => addSrRow(sr),
    );
    updateAccordionCounts();
    modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("classFeatureEditorModal"),
    );
    modal.show();
    setTimeout(() => document.getElementById("classFeatureName").focus(), 150);
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  window.PFClassFeatureEditor = { open };
})();
