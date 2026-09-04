// Shared "Damage Reduction / Spell Resistance / Class Skill Grant" row
// builders, plus the Bonus Scale modal they all use to scale by level.
// Every effect-authoring surface (class features, custom buffs/traits/
// feats, loot items, inventory items) wants the same three things --
// this used to mean copy-pasting each one into every file (and DR/SR
// only ever existed on class features at all). Defining them once here
// and having each surface call in means a class feature, a trait, a
// loot item, and a piece of gear can all carry DR, SR, or "X becomes a
// class skill" the same way, with one place to fix bugs or add fields.
//
// The calculation side already reads damageReduction/spellResistance
// off ANY buff-shaped object (see collectClassFeatureDamageReduction/
// collectClassFeatureSpellResistance in character-sheet.js, which walk
// activeBuffs as well as class features) -- classSkillGrants is wired
// the same way. So none of this needs new calc-engine plumbing, only
// somewhere to author it.
(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // ---------------------------------------------------------------
  // Plain stat bonus row (Stat/Value/Type/Stacks/Bonus Scale/
  // Conditional/Applies When) -- every effect-authoring surface in the
  // app had its own copy of this row plus the stat lists behind it.
  // One canonical copy here; a surface with its own extra display
  // needs (buff-tracker-widget's abbreviated chip labels, character-
  // sheet's live custom-skill list) passes them in as options instead
  // of forking the row itself.
  // ---------------------------------------------------------------
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
    "craft skill checks",
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
    "racial",
    "resistance",
    "sacred",
    "shield",
    "size",
    "inherit",
  ];
  const SIZE_CHANGE_VALUES = [-2, -1, 1, 2];

  // The plain, un-abbreviated formatter every surface used to
  // duplicate. Pass a surface-specific one (options.titleCaseStat) to
  // createBonusRow/bonusStatOptionsHtml/mountEffectsAccordion instead
  // of forking this when a surface needs something different (compact
  // "STR"-style abbreviations for a chip UI, or resolving skill:
  // against a live character's custom skills rather than the base 30).
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

  // options.skills: optional [name, ability] list override (a live
  // character's allSkills(), including homebrew skills) for the
  // specific-skill options -- falls back to the base 30 PF skills.
  // options.effectStats: optional override for the "Stats" group.
  // options.titleCaseStat: optional override formatter for option
  // labels (see titleCaseStat above).
  function bonusStatOptionsHtml(selected = "", options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const stats = options.effectStats || EFFECT_STATS;
    const skillNames = (
      options.skills ||
      window.PFEffectStats?.PF_SKILLS_WITH_ABILITY ||
      PF_SKILLS.map((skill) => [skill])
    ).map((entry) => (Array.isArray(entry) ? entry[0] : entry.name));
    const specificSkillStats = skillNames.map((skill) => skillKey(skill));
    const option = (value, label = format(value)) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    const customSkillLists = window.PFEffectStats?.customSkillLists?.() || [];
    const skillListOptions = customSkillLists
      .map((list) =>
        option(
          window.PFEffectStats.skillListStatValue(list),
          `${list.name} Skills`,
        ),
      )
      .join("");
    return `
      <optgroup label="Stats">${stats.map((stat) => option(stat)).join("")}</optgroup>
      <optgroup label="Skills">
        ${SKILL_STATS.map((stat) => option(stat)).join("")}
        <option value="skill:craft" ${selected === "skill:craft" ? "selected" : ""}>Skill: Craft</option>
        <option value="skill:profession" ${selected === "skill:profession" ? "selected" : ""}>Skill: Profession</option>
        ${skillListOptions}
        ${specificSkillStats.map((stat) => option(stat)).join("")}
        <option value="${window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE || "__create-custom-skill-list-stat__"}">Create custom skill list...</option>
      </optgroup>
      ${window.PFEffectStats?.energyResistanceOptgroupHtml?.(selected, escapeHtml) || ""}
      ${window.PFEffectStats?.choiceOptgroupHtml?.(selected, escapeHtml) || ""}
    `;
  }

  function customSkillListPayloadForStat(stat) {
    if (!window.PFEffectStats?.skillListForStat) return null;
    const list = window.PFEffectStats.skillListForStat(stat);
    return list
      ? {
          id: list.id,
          name: list.name,
          skills: [...(list.skills || [])],
        }
      : null;
  }

  function optionIsCreateSkillList(value) {
    return (
      value ===
        (window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE ||
          "__create-custom-skill-list-stat__") ||
      value ===
        (window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE ||
          "__create-custom-skill-list-choice__")
    );
  }

  function wireCustomSkillListSelect(select, options = {}) {
    const renderer = options.renderOptions;
    const sync = options.sync || (() => {});
    select.dataset.lastValidValue = select.value || "";
    select.addEventListener("focus", () => {
      if (!optionIsCreateSkillList(select.value)) {
        select.dataset.lastValidValue = select.value || "";
      }
    });
    select.addEventListener("change", async () => {
      if (!optionIsCreateSkillList(select.value)) {
        select.dataset.lastValidValue = select.value || "";
        sync();
        return;
      }
      const previous = select.dataset.lastValidValue || "";
      if (!window.PFCustomSkillListModal) {
        select.value = previous;
        sync();
        return;
      }
      const createChoice =
        select.value === window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE;
      const list = await window.PFCustomSkillListModal.open({
        skills: options.skills,
      });
      if (!list) {
        select.innerHTML = renderer(previous);
        select.value = previous;
        sync();
        return;
      }
      const nextValue = createChoice
        ? `choice:${window.PFEffectStats.skillListStatValue(list)}`
        : window.PFEffectStats.skillListStatValue(list);
      select.innerHTML = renderer(nextValue);
      select.value = nextValue;
      select.dataset.lastValidValue = nextValue;
      sync();
    });
  }

  // data: { stat, value, type, stacks, conditional, appliesWhen,
  // skillName?, bonusScale? }. options: { onDelete, skills, effectStats,
  // titleCaseStat } -- same meaning as bonusStatOptionsHtml's options,
  // plus onDelete (called after the row removes itself).
  function createBonusRow(data = {}, options = {}) {
    const format = options.titleCaseStat || titleCaseStat;
    const row = document.createElement("div");
    row.className = "shared-bonus-row";
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
        <select data-effect-field="stat" class="form-select form-select-sm">${bonusStatOptionsHtml(selectedStat, options)}</select>
      </div>
      <div class="shared-named-skill-field d-none">
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
      <button class="btn btn-outline-info btn-sm effect-scale-button" type="button" data-scale-bonus>Bonus Scale</button>
      <div class="shared-bonus-condition-inline">
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
    const statSelect = row.querySelector('[data-effect-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector('[data-effect-field="skillName"]');
    const syncNamedSkill = () => {
      const named = ["skill:craft", "skill:profession"].includes(
        statSelect.value,
      );
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder =
        statSelect.value === "skill:profession" ? "Sailor" : "Alchemy";
    };
    wireCustomSkillListSelect(statSelect, {
      skills: options.skills,
      renderOptions: (selected) => bonusStatOptionsHtml(selected, options),
      sync: syncNamedSkill,
    });
    syncNamedSkill();
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    row
      .querySelector('button[aria-label="Delete effect"]')
      .addEventListener("click", () => {
        row.remove();
        options.onDelete?.();
      });
    const collect = () => {
      const selected = statSelect.value;
      const skillName = ["skill:craft", "skill:profession"].includes(selected)
        ? namedSkill(selected, skillNameInput.value)
        : "";
      const effect = {
        stat: skillName ? skillKey(skillName) : selected,
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
      const skillList = customSkillListPayloadForStat(effect.stat);
      if (skillList) effect.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(effect.stat)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(effect.stat);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) effect.choicePool = choicePool;
      }
      if (row._bonusScale) effect.bonusScale = row._bonusScale;
      return effect;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // ---------------------------------------------------------------
  // Skill-only stat options, for "X becomes a class skill". Reuses the
  // exact same skill stat keys (skill:xxx) and "Choose When Applied"
  // pool ids the full effect Stat dropdown uses, filtered to skills
  // only -- a class skill grant targeting "AC" or "Fire Resistance"
  // isn't meaningful.
  // ---------------------------------------------------------------
  function slugifySkillName(skill) {
    return `skill:${String(skill || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function namedSkill(kind, value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const prefix = kind === "skill:profession" ? "Profession" : "Craft";
    if (text.toLowerCase().startsWith(`${prefix.toLowerCase()} (`)) return text;
    return `${prefix} (${text})`;
  }

  function skillKey(name) {
    return `skill:${String(name || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  // skills: optional [name, ability] list override (a live character's
  // allSkills(), including homebrew skills) -- falls back to the base
  // 30 PF skills from effect-stat-options.js.
  function skillStatOptionsHtml(selected = "", { skills } = {}) {
    const list = (
      skills || window.PFEffectStats?.PF_SKILLS_WITH_ABILITY || []
    ).map((entry) => (Array.isArray(entry) ? entry[0] : entry.name));
    const option = (value, label) =>
      `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    const skillPools = (window.PFEffectStats?.ALL_POOLS || []).filter(
      (pool) => pool.kind === "skill" || pool.kind === "custom-skill-list",
    );
    const customSkillLists = window.PFEffectStats?.customSkillLists?.() || [];
    return `
      <optgroup label="Skills">
        ${list.map((skill) => option(slugifySkillName(skill), skill)).join("")}
        ${option("skill:craft", "Skill: Craft")}
        ${option("skill:profession", "Skill: Profession")}
        ${customSkillLists
          .map((customList) =>
            option(
              window.PFEffectStats.skillListStatValue(customList),
              `${customList.name} Skills`,
            ),
          )
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_STAT_VALUE || "__create-custom-skill-list-stat__", "Create custom skill list...")}
      </optgroup>
      <optgroup label="Choose When Applied">
        ${skillPools
          .map((pool) => option(`choice:${pool.id}`, `${pool.label} (choose one)`))
          .join("")}
        ${option(window.PFEffectStats?.CREATE_SKILL_LIST_CHOICE_VALUE || "__create-custom-skill-list-choice__", "Create custom skill list...")}
      </optgroup>
    `;
  }

  // ---------------------------------------------------------------
  // Shared Bonus Scale modal -- one instance in the DOM regardless of
  // how many surfaces/rows want to use it. Follows the same
  // per-session settle + "wait for the previous hide to finish before
  // show()-ing again" pattern as modals/effect-choice-picker.js, for
  // the same reason: nothing here guarantees only one row ever opens
  // this modal in a session, so a stale "hidden.bs.modal" from a
  // previous open must never be able to resolve a later one.
  // ---------------------------------------------------------------
  const SCALE_MODAL_ID = "sharedBonusScaleModal";
  let scaleModal = null;
  let scaleHideSignal = Promise.resolve();

  function ensureScaleModal() {
    if (document.getElementById(SCALE_MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${SCALE_MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title">Bonus Scale</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2 mb-3">
                <div class="col-12">
                  <label for="${SCALE_MODAL_ID}Source">Level Source</label>
                  <select id="${SCALE_MODAL_ID}Source" class="form-select form-select-sm">
                    ${window.PFEffectMeta?.levelSourceOptions?.({ type: "caster" }) || '<option value="caster">Caster level</option><option value="character">Character level</option>'}
                  </select>
                </div>
              </div>
              <div class="small text-secondary mb-2">Level Multiplier</div>
              <div class="row g-2 mb-1 align-items-end">
                <div class="col-4">
                  <label for="${SCALE_MODAL_ID}Num">Numerator</label>
                  <input id="${SCALE_MODAL_ID}Num" class="form-control form-control-sm" type="number" min="0" placeholder="e.g. 1">
                </div>
                <div class="col-4">
                  <label for="${SCALE_MODAL_ID}Den">Denominator</label>
                  <input id="${SCALE_MODAL_ID}Den" class="form-control form-control-sm" type="number" min="1" placeholder="e.g. 2">
                </div>
                <div class="col-4">
                  <button id="${SCALE_MODAL_ID}ClearMultiplier" class="btn btn-outline-secondary btn-sm w-100" type="button">Clear</button>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-1 mb-2" id="${SCALE_MODAL_ID}Presets">
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
                <input id="${SCALE_MODAL_ID}MinOne" class="form-check-input" type="checkbox">
                <label class="form-check-label" for="${SCALE_MODAL_ID}MinOne">Minimum 1 (never rounds down to 0)</label>
              </div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Milestones</div>
                <button id="${SCALE_MODAL_ID}AddMilestone" class="btn btn-outline-info btn-sm" type="button">Add Milestone</button>
              </div>
              <div id="${SCALE_MODAL_ID}Rows" class="vstack gap-2 mb-3"></div>
              <div class="row g-2">
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}After">After Level</label>
                  <input id="${SCALE_MODAL_ID}After" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}Every">Every Levels</label>
                  <input id="${SCALE_MODAL_ID}Every" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div class="col-sm-4">
                  <label for="${SCALE_MODAL_ID}Increase">Increase Bonus By</label>
                  <input id="${SCALE_MODAL_ID}Increase" class="form-control form-control-sm" type="number">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="${SCALE_MODAL_ID}Clear" type="button" class="btn btn-outline-danger btn-sm">Clear Scale</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="${SCALE_MODAL_ID}Save" type="button" class="btn btn-primary btn-sm">Save Scale</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(`${SCALE_MODAL_ID}AddMilestone`)
      .addEventListener("click", () => addScaleMilestoneRow());
    document
      .getElementById(`${SCALE_MODAL_ID}Presets`)
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-scale-multiplier-preset]");
        if (!button) return;
        const [num, den] = button.dataset.scaleMultiplierPreset.split("/");
        document.getElementById(`${SCALE_MODAL_ID}Num`).value = num;
        document.getElementById(`${SCALE_MODAL_ID}Den`).value = den;
      });
    document
      .getElementById(`${SCALE_MODAL_ID}ClearMultiplier`)
      .addEventListener("click", () => {
        document.getElementById(`${SCALE_MODAL_ID}Num`).value = "";
        document.getElementById(`${SCALE_MODAL_ID}Den`).value = "";
      });
  }

  function addScaleMilestoneRow(data = {}) {
    const rows = document.getElementById(`${SCALE_MODAL_ID}Rows`);
    const row = document.createElement("div");
    row.className = "shared-scale-row d-flex gap-2 align-items-end";
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

  function collectScale() {
    const milestones = [
      ...document.querySelectorAll(`#${SCALE_MODAL_ID}Rows .shared-scale-row`),
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
      document.getElementById(`${SCALE_MODAL_ID}After`).value,
      10,
    );
    const everyLevels = Number.parseInt(
      document.getElementById(`${SCALE_MODAL_ID}Every`).value,
      10,
    );
    const increase = Number(
      document.getElementById(`${SCALE_MODAL_ID}Increase`).value,
    );
    const every =
      afterLevel > 0 &&
      everyLevels > 0 &&
      Number.isFinite(increase) &&
      increase !== 0
        ? { afterLevel, everyLevels, increase }
        : null;
    const multiplierNumerator = Number(
      document.getElementById(`${SCALE_MODAL_ID}Num`).value,
    );
    const multiplierDenominator = Number(
      document.getElementById(`${SCALE_MODAL_ID}Den`).value,
    );
    const levelMultiplier =
      multiplierNumerator > 0 && multiplierDenominator > 0
        ? { numerator: multiplierNumerator, denominator: multiplierDenominator }
        : null;
    const minimumOne = document.getElementById(`${SCALE_MODAL_ID}MinOne`).checked;
    if (!milestones.length && !every && !levelMultiplier && !minimumOne)
      return null;
    const sourceSelect = document.getElementById(`${SCALE_MODAL_ID}Source`);
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

  // Resolves to the collected scale object, or null if cleared/cancelled.
  function openScaleModal(existingScale) {
    return scaleHideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureScaleModal();
          const scale = existingScale || {};
          const source = scale.source || { type: "caster" };
          const sourceSelect = document.getElementById(`${SCALE_MODAL_ID}Source`);
          if (sourceSelect && window.PFEffectMeta?.levelSourceOptions) {
            sourceSelect.innerHTML = window.PFEffectMeta.levelSourceOptions(source);
          } else if (sourceSelect) {
            sourceSelect.value = source.type || "caster";
          }
          document.getElementById(`${SCALE_MODAL_ID}Num`).value =
            scale.levelMultiplier?.numerator ?? "";
          document.getElementById(`${SCALE_MODAL_ID}Den`).value =
            scale.levelMultiplier?.denominator ?? "";
          document.getElementById(`${SCALE_MODAL_ID}MinOne`).checked = Boolean(
            scale.minimumOne,
          );
          document.getElementById(`${SCALE_MODAL_ID}Rows`).innerHTML = "";
          const milestones = Array.isArray(scale.milestones)
            ? scale.milestones
            : [];
          if (milestones.length)
            milestones.forEach((milestone) => addScaleMilestoneRow(milestone));
          else addScaleMilestoneRow();
          const every = scale.every || {};
          document.getElementById(`${SCALE_MODAL_ID}After`).value =
            every.afterLevel || "";
          document.getElementById(`${SCALE_MODAL_ID}Every`).value =
            every.everyLevels || "";
          document.getElementById(`${SCALE_MODAL_ID}Increase`).value =
            every.increase ?? "";

          const modalEl = document.getElementById(SCALE_MODAL_ID);
          scaleModal = bootstrap.Modal.getOrCreateInstance(modalEl);

          let settled = false;
          let resolveHideSignal;
          scaleHideSignal = new Promise((res) => {
            resolveHideSignal = res;
          });
          const settle = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };
          const onHidden = () => {
            settle(null);
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            resolveHideSignal();
          };
          modalEl.addEventListener("hidden.bs.modal", onHidden);

          const saveBtn = document.getElementById(`${SCALE_MODAL_ID}Save`);
          const clearBtn = document.getElementById(`${SCALE_MODAL_ID}Clear`);
          const onSave = () => {
            settle(collectScale());
            scaleModal.hide();
          };
          const onClear = () => {
            settle(null);
            scaleModal.hide();
          };
          saveBtn.addEventListener("click", onSave, { once: true });
          clearBtn.addEventListener("click", onClear, { once: true });

          scaleModal.show();
        }),
    );
  }

  // "1/2" for a fraction, "3x" for a whole-number multiplier.
  function levelMultiplierText(multiplier) {
    if (!multiplier) return "";
    const { numerator, denominator } = multiplier;
    return denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`;
  }

  function scaleSourceLabel(source = {}) {
    if (source.type === "character") return "character level";
    if (source.type === "class")
      return source.className ? `${source.className} level` : "class level";
    return "caster level";
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

  // ---------------------------------------------------------------
  // Row builders. Each returns { element, collect(), destroy() }.
  // onDelete lets the caller run its own bookkeeping (accordion
  // counts, etc.) after the row removes itself.
  // ---------------------------------------------------------------

  function wireScaleButton(row, initialScale, summaryEl, scaleBtn) {
    row._bonusScale = initialScale || null;
    const updateSummary = () => {
      const text = scaleText(row._bonusScale);
      summaryEl.textContent = text ? `Scales: ${text}` : "";
    };
    scaleBtn.addEventListener("click", async () => {
      const result = await openScaleModal(row._bonusScale);
      row._bonusScale = result;
      updateSummary();
    });
    updateSummary();
  }

  // Damage reduction is "N/type" -- a numeric amount plus the type of
  // attack that overcomes it ("magic", "cold iron and evil", ...). A
  // dash ("-") means it applies to any attack that doesn't ignore DR
  // outright. The amount can scale by level.
  function createDrRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-dr-row class-feature-dr-row";
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
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    row.querySelector('button[aria-label="Delete DR"]').addEventListener(
      "click",
      () => {
        row.remove();
        onDelete?.();
      },
    );
    const collect = () => {
      const dr = {
        amount: Number(
          row.querySelector('[data-dr-field="amount"]').value || 0,
        ),
        overcomeType: row
          .querySelector('[data-dr-field="overcomeType"]')
          .value.trim(),
      };
      if (row._bonusScale) dr.bonusScale = row._bonusScale;
      return dr.amount > 0 || dr.bonusScale ? dr : null;
    };
    // Stashed on the element too so a caller can collect every row in a
    // container with a plain DOM query instead of tracking its own
    // parallel array of controllers (see createSrRow/createClassSkillRow
    // below, and every addXRow() that uses these).
    row._collect = collect;
    return { element: row, collect };
  }

  // Spell Resistance -- a flat number that can scale by level, plus a
  // Conditional/Applies When pair for things like "SR only vs. evil".
  function createSrRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-sr-row class-feature-sr-row";
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
    wireScaleButton(
      row,
      data.bonusScale || data.scale || null,
      row.querySelector("[data-scale-summary]"),
      row.querySelector("[data-scale-bonus]"),
    );
    row.querySelector('button[aria-label="Delete SR"]').addEventListener(
      "click",
      () => {
        row.remove();
        onDelete?.();
      },
    );
    const collect = () => {
      const sr = {
        amount: Number(
          row.querySelector('[data-sr-field="amount"]').value || 0,
        ),
        conditional: row.querySelector('[data-sr-field="conditional"]')
          .checked,
        appliesWhen: row
          .querySelector('[data-sr-field="appliesWhen"]')
          .value.trim(),
      };
      if (row._bonusScale) sr.bonusScale = row._bonusScale;
      return sr.amount > 0 || sr.bonusScale ? sr : null;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // "X becomes a class skill" -- just a skill picker, no amount/type/
  // scale, since class-skill status isn't a number to scale. Can
  // target a fixed skill or a "choose one skill" pool (a trait like
  // "pick a skill; it's a class skill for you"). data is { stat,
  // skillName? } -- the same shape effects/DR/SR use -- so a Craft/
  // Profession pick's friendly name round-trips through save/reload
  // instead of collapsing to a bare "skill:craftalchemy" key.
  function createClassSkillRow(data = {}, { onDelete, skills } = {}) {
    const row = document.createElement("div");
    row.className = "shared-class-skill-row";
    const rawStat = String(data.stat || "");
    const selectedStat = String(data.skillName || "")
      .toLowerCase()
      .startsWith("profession")
      ? "skill:profession"
      : String(data.skillName || "")
            .toLowerCase()
            .startsWith("craft")
        ? "skill:craft"
        : rawStat;
    row.innerHTML = `
      <div>
        <label>Skill</label>
        <select data-class-skill-field="stat" class="form-select form-select-sm">
          ${skillStatOptionsHtml(selectedStat, { skills })}
        </select>
      </div>
      <div class="shared-named-skill-field d-none">
        <label>Skill Name</label>
        <input data-class-skill-field="skillName" class="form-control form-control-sm" value="${escapeHtml(data.skillName || "")}" placeholder="Alchemy">
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete class skill"><i class="bi bi-trash"></i></button>
    `;
    const statSelect = row.querySelector('[data-class-skill-field="stat"]');
    const namedSkillField = row.querySelector(".shared-named-skill-field");
    const skillNameInput = row.querySelector(
      '[data-class-skill-field="skillName"]',
    );
    const syncNamedSkill = () => {
      const named = ["skill:craft", "skill:profession"].includes(
        statSelect.value,
      );
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder =
        statSelect.value === "skill:profession" ? "Sailor" : "Alchemy";
    };
    wireCustomSkillListSelect(statSelect, {
      skills,
      renderOptions: (selected) => skillStatOptionsHtml(selected, { skills }),
      sync: syncNamedSkill,
    });
    syncNamedSkill();
    row
      .querySelector('button[aria-label="Delete class skill"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const selected = statSelect.value;
      if (!selected) return null;
      if (["skill:craft", "skill:profession"].includes(selected)) {
        const name = namedSkill(selected, skillNameInput.value);
        return name ? { stat: skillKey(name), skillName: name } : null;
      }
      const grant = { stat: selected };
      const skillList = customSkillListPayloadForStat(selected);
      if (skillList) grant.skillList = skillList;
      if (window.PFEffectStats?.isChoiceStat(selected)) {
        const poolId = window.PFEffectStats.choicePoolIdFromStat(selected);
        const choicePool = customSkillListPayloadForStat(poolId);
        if (choicePool) grant.choicePool = choicePool;
      }
      return grant;
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // entry: { stat, skillName? }. titleCaseStat: the caller's own stat
  // formatter (each surface already has one, for the exact same
  // skillName-or-stat pattern effects/DR/SR use) -- kept as a
  // parameter instead of duplicated here so it stays consistent with
  // however that surface formats every other stat.
  function classSkillGrantText(entry, titleCaseStat) {
    if (!entry) return "";
    const label = titleCaseStat(entry.skillName || entry.stat || "");
    return `${label} becomes a class skill`;
  }

  function createSizeChangeRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-size-change-row";
    const value = SIZE_CHANGE_VALUES.includes(Number(data.value ?? data.steps))
      ? Number(data.value ?? data.steps)
      : 1;
    row.innerHTML = `
      <div>
        <label>Size Change</label>
        <select data-size-change-field="value" class="form-select form-select-sm">
          ${SIZE_CHANGE_VALUES.map(
            (entry) =>
              `<option value="${entry}" ${value === entry ? "selected" : ""}>${entry > 0 ? "+" : ""}${entry}</option>`,
          ).join("")}
        </select>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete size change"><i class="bi bi-trash"></i></button>
    `;
    row
      .querySelector('button[aria-label="Delete size change"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => ({
      value: Number(row.querySelector('[data-size-change-field="value"]').value),
    });
    row._collect = collect;
    return { element: row, collect };
  }

  function spellLikeAbilityName(data = {}) {
    return data.spellName || data.name || data.spell?.name || "";
  }

  function spellLikeMinimumLevel(data = {}) {
    const value = Number(data.minimumLevel ?? data.level ?? 1);
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.floor(value));
  }

  function compactSpellPayload(spell = {}) {
    if (!spell || typeof spell !== "object") return null;
    return {
      name: spell.name || "",
      details: spell.details || {},
      link: spell.link || "",
    };
  }

  function createSpellLikeAbilityRow(data = {}, { onDelete } = {}) {
    const row = document.createElement("div");
    row.className = "shared-spell-like-row";
    row._spell = compactSpellPayload(data.spell) || null;
    row.innerHTML = `
      <div>
        <label>Level</label>
        <input data-spell-like-field="minimumLevel" class="form-control form-control-sm" type="number" min="1" value="${spellLikeMinimumLevel(data)}">
      </div>
      <div>
        <label>Frequency</label>
        <input data-spell-like-field="frequency" class="form-control form-control-sm" value="${escapeHtml(data.frequency || "")}" placeholder="At will (Level 0)">
      </div>
      <div>
        <label>Spell</label>
        <button class="btn btn-outline-light btn-sm w-100 shared-spell-like-picker" type="button" data-spell-like-select>
          <span data-spell-like-name>${escapeHtml(spellLikeAbilityName(data) || "Choose spell")}</span>
          <i class="bi bi-search"></i>
        </button>
      </div>
      <button class="btn btn-outline-danger btn-sm" type="button" aria-label="Delete spell-like ability"><i class="bi bi-trash"></i></button>
    `;
    const spellLabel = row.querySelector("[data-spell-like-name]");
    const setSpell = (spell) => {
      row._spell = compactSpellPayload(spell);
      spellLabel.textContent = row._spell?.name || "Choose spell";
    };
    row
      .querySelector("[data-spell-like-select]")
      .addEventListener("click", async () => {
        if (!window.PFMagicSearchModal) return;
        const spell = await window.PFMagicSearchModal.open({
          title: "Choose Spell-Like Ability",
        });
        if (spell) setSpell(spell);
      });
    row
      .querySelector('button[aria-label="Delete spell-like ability"]')
      .addEventListener("click", () => {
        row.remove();
        onDelete?.();
      });
    const collect = () => {
      const spellName = row._spell?.name || spellLabel.textContent.trim();
      if (!spellName || spellName === "Choose spell") return null;
      return {
        minimumLevel: spellLikeMinimumLevel({
          minimumLevel: row.querySelector('[data-spell-like-field="minimumLevel"]')
            .value,
        }),
        frequency: row
          .querySelector('[data-spell-like-field="frequency"]')
          .value.trim(),
        spellName,
        spell: row._spell || { name: spellName },
      };
    };
    row._collect = collect;
    return { element: row, collect };
  }

  // DR, SR, Class Skill grants, Size Changes, and Spell-Like Abilities
  // are separate things but they're always authored together and rarely
  // used -- one collapsed "Extra" accordion item holding all of them is
  // what every effect-authoring surface in the app mounts now, built
  // here once so there's exactly one place defining what "Extra" means.
  //
  // Spell-Like Abilities are stored as spellLikeAbilities:
  // [{ minimumLevel, frequency, spellName, spell }]. spellName is the
  // stable display key; spell keeps the selected spell details handy
  // for later sheet UI. minimumLevel defaults to 1 for old rows.
  //
  // container: the element to fill with the accordion-item markup.
  // options.idPrefix: unique id prefix for this mount (required --
  // every surface needs its own so multiple mounts on one page, or
  // across pages, never collide). options.accordionParentId: pass the
  // id of an existing bootstrap accordion this should join (so it
  // collapses in sync with sibling items, e.g. class-feature-editor's
  // "Feature Effects"); omit for a standalone collapsible section.
  // options.skills: forwarded to createClassSkillRow. options.onChange:
  // called after any add/delete/edit inside the section.
  //
  // Returns helpers plus reset(item) and collect(). reset(item) clears
  // and repopulates the extra lists; collect() returns the same extras
  // using their app-level camelCase names.
  function mountExtraAccordion(container, options = {}) {
    const prefix = options.idPrefix;
    const parentAttr = options.accordionParentId
      ? ` data-bs-parent="#${options.accordionParentId}"`
      : "";
    container.innerHTML = `
      <div class="accordion-item shared-extra-accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${prefix}Panel" aria-expanded="false" aria-controls="${prefix}Panel">
            Extra <span id="${prefix}Count" class="badge text-bg-secondary ms-2"></span>
          </button>
        </h2>
        <div id="${prefix}Panel" class="accordion-collapse collapse"${parentAttr}>
          <div class="accordion-body">
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Damage Reduction</div>
                <button id="${prefix}AddDr" class="btn btn-outline-info btn-sm" type="button">Add DR</button>
              </div>
              <div id="${prefix}DrRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Spell Resistance</div>
                <button id="${prefix}AddSr" class="btn btn-outline-info btn-sm" type="button">Add SR</button>
              </div>
              <div id="${prefix}SrRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Class Skills</div>
                <button id="${prefix}AddClassSkill" class="btn btn-outline-info btn-sm" type="button">Add Class Skill</button>
              </div>
              <div id="${prefix}ClassSkillRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Size Change</div>
                <button id="${prefix}AddSizeChange" class="btn btn-outline-info btn-sm" type="button">Add Size Change</button>
              </div>
              <div id="${prefix}SizeChangeRows" class="vstack gap-2"></div>
            </div>
            <div class="shared-extra-subsection">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div class="small text-secondary">Spell-Like Abilities</div>
                <button id="${prefix}AddSpellLikeAbility" class="btn btn-outline-info btn-sm" type="button">Add Spell-Like Ability</button>
              </div>
              <div id="${prefix}SpellLikeAbilityRows" class="vstack gap-2"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const drRowsEl = document.getElementById(`${prefix}DrRows`);
    const srRowsEl = document.getElementById(`${prefix}SrRows`);
    const csRowsEl = document.getElementById(`${prefix}ClassSkillRows`);
    const sizeRowsEl = document.getElementById(`${prefix}SizeChangeRows`);
    const slaRowsEl = document.getElementById(`${prefix}SpellLikeAbilityRows`);
    const countBadge = document.getElementById(`${prefix}Count`);

    const updateCount = () => {
      const count =
        drRowsEl.children.length +
        srRowsEl.children.length +
        csRowsEl.children.length +
        sizeRowsEl.children.length +
        slaRowsEl.children.length;
      if (countBadge) {
        countBadge.textContent = count ? String(count) : "";
        countBadge.classList.toggle("d-none", !count);
      }
      options.onChange?.();
    };

    const addDr = (data = {}) => {
      const { element } = createDrRow(data, { onDelete: updateCount });
      drRowsEl.appendChild(element);
      updateCount();
    };
    const addSr = (data = {}) => {
      const { element } = createSrRow(data, { onDelete: updateCount });
      srRowsEl.appendChild(element);
      updateCount();
    };
    const addClassSkill = (data = {}) => {
      const { element } = createClassSkillRow(data, {
        onDelete: updateCount,
        skills: options.skills,
      });
      csRowsEl.appendChild(element);
      updateCount();
    };
    const addSizeChange = (data = {}) => {
      const { element } = createSizeChangeRow(data, {
        onDelete: updateCount,
      });
      sizeRowsEl.appendChild(element);
      updateCount();
    };
    const addSpellLikeAbility = (data = {}) => {
      const { element } = createSpellLikeAbilityRow(data, {
        onDelete: updateCount,
      });
      slaRowsEl.appendChild(element);
      updateCount();
    };

    document
      .getElementById(`${prefix}AddDr`)
      .addEventListener("click", () => addDr());
    document
      .getElementById(`${prefix}AddSr`)
      .addEventListener("click", () => addSr());
    document
      .getElementById(`${prefix}AddClassSkill`)
      .addEventListener("click", () => addClassSkill());
    document
      .getElementById(`${prefix}AddSizeChange`)
      .addEventListener("click", () => addSizeChange());
    document
      .getElementById(`${prefix}AddSpellLikeAbility`)
      .addEventListener("click", () => addSpellLikeAbility());

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    return {
      addDr,
      addSr,
      addClassSkill,
      addSizeChange,
      addSpellLikeAbility,
      reset(item = {}) {
        drRowsEl.innerHTML = "";
        srRowsEl.innerHTML = "";
        csRowsEl.innerHTML = "";
        sizeRowsEl.innerHTML = "";
        slaRowsEl.innerHTML = "";
        (Array.isArray(item.damageReduction) ? item.damageReduction : []).forEach(
          addDr,
        );
        (Array.isArray(item.spellResistance) ? item.spellResistance : []).forEach(
          addSr,
        );
        (Array.isArray(item.classSkillGrants) ? item.classSkillGrants : []).forEach(
          addClassSkill,
        );
        (Array.isArray(item.sizeChanges) ? item.sizeChanges : []).forEach(
          addSizeChange,
        );
        (Array.isArray(item.spellLikeAbilities)
          ? item.spellLikeAbilities
          : []
        ).forEach(addSpellLikeAbility);
        updateCount();
      },
      collect() {
        return {
          damageReduction: collectRows(drRowsEl),
          spellResistance: collectRows(srRowsEl),
          classSkillGrants: collectRows(csRowsEl),
          sizeChanges: collectRows(sizeRowsEl),
          spellLikeAbilities: collectRows(slaRowsEl),
        };
      },
    };
  }

  // The whole effects-authoring section, top to bottom: an "Effects"
  // accordion item (plain stat bonuses, open by default) followed by
  // the "Extra" item (DR/SR/Class Skills) from mountExtraAccordion --
  // together, everything a class feature, trait, or item's effects
  // panel needs. Every effect-authoring surface in the app mounts this
  // once instead of building its own Effects list plus its own Extra
  // accordion separately.
  //
  // container: filled with both accordion items. If container has no
  // id yet, one is generated from options.idPrefix and used as the
  // shared data-bs-parent so opening one item closes the other --
  // standard accordion behavior. Pass options.accordionParentId
  // instead to join an already-existing accordion (e.g. joining
  // sibling items in a caller's own accordion group) rather than
  // having this pair collapse only against each other.
  //
  // options: { idPrefix (required), accordionParentId?, skills?,
  // effectStats?, titleCaseStat?, onChange?, effectsKey?, onEffectAdded? }
  // -- skills/effectStats/titleCaseStat are forwarded to both the Effects
  // row and Extra's Class Skill row. effectsKey (default "effects") lets a
  // caller with a differently-named bonus list (buff-tracker-widget.js
  // uses "bonuses") reset()/collect() that property instead. onEffectAdded
  // (row element) fires whenever a new Effects row is appended -- whether
  // from the "Create Effect" button or from reset() -- so a caller can
  // apply its own defaults to freshly-created rows.
  //
  // Returns { addEffect, addDr, addSr, addClassSkill, reset(item),
  // collect() }. reset(item) populates all four lists from
  // item[effectsKey]/damageReduction/spellResistance/classSkillGrants;
  // collect() returns { [effectsKey]: [...], damageReduction,
  // spellResistance, classSkillGrants }.
  function mountEffectsAccordion(container, options = {}) {
    const prefix = options.idPrefix;
    const parentId =
      options.accordionParentId || (container.id ||= `${prefix}Accordion`);
    container.innerHTML = `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${prefix}EffectsPanel" aria-expanded="true" aria-controls="${prefix}EffectsPanel">
            Effects <span id="${prefix}EffectsCount" class="badge text-bg-secondary ms-2"></span>
          </button>
        </h2>
        <div id="${prefix}EffectsPanel" class="accordion-collapse collapse show" data-bs-parent="#${parentId}">
          <div class="accordion-body">
            <div class="d-flex justify-content-end mb-2">
              <button id="${prefix}AddEffect" class="btn btn-outline-info btn-sm" type="button">Create Effect</button>
            </div>
            <div id="${prefix}EffectRows" class="vstack gap-2"></div>
          </div>
        </div>
      </div>
      <div id="${prefix}ExtraMount"></div>
    `;

    const effectRowsEl = document.getElementById(`${prefix}EffectRows`);
    const effectsBadge = document.getElementById(`${prefix}EffectsCount`);

    const updateEffectsCount = () => {
      const count = effectRowsEl.children.length;
      effectsBadge.textContent = count ? String(count) : "";
      effectsBadge.classList.toggle("d-none", !count);
      options.onChange?.();
    };

    const addEffect = (data = {}) => {
      const { element } = createBonusRow(data, {
        onDelete: updateEffectsCount,
        skills: options.skills,
        effectStats: options.effectStats,
        titleCaseStat: options.titleCaseStat,
      });
      effectRowsEl.appendChild(element);
      updateEffectsCount();
      options.onEffectAdded?.(element);
      return element;
    };
    document
      .getElementById(`${prefix}AddEffect`)
      .addEventListener("click", () => addEffect());

    const extra = mountExtraAccordion(
      document.getElementById(`${prefix}ExtraMount`),
      {
        idPrefix: `${prefix}Extra`,
        accordionParentId: parentId,
        skills: options.skills,
        onChange: options.onChange,
      },
    );

    const collectRows = (rowsEl) =>
      [...rowsEl.querySelectorAll(":scope > *")]
        .map((row) => row._collect?.())
        .filter(Boolean);

    return {
      addEffect,
      addDr: extra.addDr,
      addSr: extra.addSr,
      addClassSkill: extra.addClassSkill,
      addSizeChange: extra.addSizeChange,
      addSpellLikeAbility: extra.addSpellLikeAbility,
      reset(item = {}) {
        const effectsKey = options.effectsKey || "effects";
        effectRowsEl.innerHTML = "";
        (Array.isArray(item[effectsKey]) ? item[effectsKey] : []).forEach(
          addEffect,
        );
        updateEffectsCount();
        extra.reset(item);
      },
      collect() {
        return {
          [options.effectsKey || "effects"]: collectRows(effectRowsEl),
          ...extra.collect(),
        };
      },
    };
  }

  window.PFEffectEditor = {
    titleCaseStat,
    bonusStatOptionsHtml,
    createBonusRow,
    skillStatOptionsHtml,
    namedSkill,
    skillKey,
    createDrRow,
    createSrRow,
    createClassSkillRow,
    createSpellLikeAbilityRow,
    mountExtraAccordion,
    mountEffectsAccordion,
    classSkillGrantText,
    openScaleModal,
    scaleText,
    // Wires an arbitrary "Scale" button + summary element to the shared
    // modal -- not just for DR/SR rows above, any bonus row (a plain
    // stat effect, say) can reuse this instead of hand-rolling the same
    // open/store/re-render dance.
    wireScaleButton,
  };
})();
