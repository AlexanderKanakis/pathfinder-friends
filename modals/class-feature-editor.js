(function () {
  const EFFECT_STATS = ["strength","dexterity","constitution","intelligence","wisdom","charisma","attack","melee attack","ranged attack","extra attack","damage","melee damage","ranged damage","ac","touch ac","flat-footed ac","remove dex bonus to ac","natural armor","deflection","fortitude","reflex","will","initiative","cmb","cmd","hit points","spell resistance"];
  const SKILL_STATS = ["skill checks","strength skill checks","dexterity skill checks","constitution skill checks","intelligence skill checks","wisdom skill checks","charisma skill checks"];
  const PF_SKILLS = ["Acrobatics","Appraise","Bluff","Climb","Diplomacy","Disable Device","Disguise","Escape Artist","Fly","Heal","Intimidate","Knowledge (arcana)","Knowledge (dungeoneering)","Knowledge (engineering)","Knowledge (geography)","Knowledge (history)","Knowledge (local)","Knowledge (nature)","Knowledge (nobility)","Knowledge (planes)","Knowledge (religion)","Linguistics","Perception","Ride","Sense Motive","Sleight of Hand","Spellcraft","Stealth","Survival","Swim","Use Magic Device"];
  const SPECIFIC_SKILL_STATS = PF_SKILLS.map(skill => `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`);
  const BONUS_TYPES = ["untyped","alchemical","condition","penalty","armor","circumstance","competence","deflection","dodge","enhancement","insight","luck","morale","natural armor","profane","resistance","sacred","shield","size"];

  let modal = null;
  let scaleModal = null;
  let resolver = null;
  let editingScaleRow = null;
  let initialized = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function titleCaseStat(value) {
    const key = String(value || "").toLowerCase().trim();
    if (key === "extra attack") return "Extra Attack at Highest BAB";
    if (key.startsWith("skill:")) {
      const skill = PF_SKILLS.find(entry => `skill:${entry.replace(/[^a-z0-9]/gi, "").toLowerCase()}` === key);
      return `Skill: ${skill || key.slice(6)}`;
    }
    return key.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  function effectStatOptions(selected = "") {
    const option = (value, label = titleCaseStat(value)) => `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
    return `
      <optgroup label="Stats">${EFFECT_STATS.map(stat => option(stat)).join("")}</optgroup>
      <optgroup label="Skills">
        ${SKILL_STATS.map(stat => option(stat)).join("")}
        <option value="skill:craft" ${selected === "skill:craft" ? "selected" : ""}>Skill: Craft</option>
        <option value="skill:profession" ${selected === "skill:profession" ? "selected" : ""}>Skill: Profession</option>
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
    const prefix = kind === "skill:profession" ? "Profession" : "Craft";
    if (text.toLowerCase().startsWith(`${prefix.toLowerCase()} (`)) return text;
    return `${prefix} (${text})`;
  }

  function ensureModal() {
    if (initialized && document.getElementById("classFeatureEditorModal") && document.getElementById("classFeatureScaleModal")) return;
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
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
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
              <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div class="small text-secondary">Feature Effects</div>
                <button id="addClassFeatureEffect" class="btn btn-outline-info btn-sm" type="button">Create Effect</button>
              </div>
              <div id="classFeatureEffectRows" class="vstack gap-2"></div>
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
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
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

    document.getElementById("addClassFeatureEffect").addEventListener("click", () => addEffectRow());
    document.getElementById("addClassFeatureScaleMilestone").addEventListener("click", () => addScaleMilestoneRow());
    document.getElementById("clearClassFeatureScale").addEventListener("click", clearScale);
    document.getElementById("saveClassFeatureScale").addEventListener("click", saveScale);
    document.getElementById("classFeatureEditorForm").addEventListener("submit", event => {
      event.preventDefault();
      const feature = collectFeature();
      if (!feature.name) return;
      resolver?.(feature);
      modal.hide();
    });
    document.getElementById("classFeatureEditorModal").addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  function addEffectRow(data = {}) {
    const rows = document.getElementById("classFeatureEffectRows");
    const row = document.createElement("div");
    row.className = "class-feature-effect-row";
    const selectedStat = String(data.skillName || "").toLowerCase().startsWith("profession")
      ? "skill:profession"
      : String(data.skillName || "").toLowerCase().startsWith("craft")
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
      <div>
        <label>Value</label>
        <input data-effect-field="value" class="form-control form-control-sm" type="number" value="${data.value ?? 0}">
      </div>
      <div>
        <label>Type</label>
        <select data-effect-field="type" class="form-select form-select-sm">
          ${BONUS_TYPES.map(type => `<option value="${escapeHtml(type)}" ${(data.type || "untyped") === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label>Stacks</label>
        <div class="form-check form-switch">
          <input data-effect-field="stacks" class="form-check-input" type="checkbox" ${data.stacks ? "checked" : ""}>
        </div>
      </div>
      <button class="btn btn-outline-info btn-sm" type="button" data-scale-bonus>Bonus Scale</button>
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
      const named = ["skill:craft", "skill:profession"].includes(statSelect.value);
      namedSkillField.classList.toggle("d-none", !named);
      skillNameInput.placeholder = statSelect.value === "skill:profession" ? "Sailor" : "Alchemy";
    };
    statSelect.addEventListener("change", syncNamedSkill);
    syncNamedSkill();
    row.querySelector("[data-scale-bonus]").addEventListener("click", () => openScaleModal(row));
    row.querySelector('button[aria-label="Delete effect"]').addEventListener("click", () => row.remove());
    updateScaleSummary(row);
    rows.appendChild(row);
  }

  function scaleSourceLabel(source = {}) {
    if (source.type === "character") return "character level";
    if (source.type === "class") return source.className ? `${source.className} level` : "class level";
    return "caster level";
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const source = scaleSourceLabel(scale.source || { type: "caster" });
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    if (milestones.length) {
      parts.push(milestones.map(milestone => `${source} ${milestone.level}: ${milestone.value >= 0 ? "+" : ""}${milestone.value}`).join(", "));
    }
    const every = scale.every || {};
    if (every.afterLevel && every.everyLevels && every.increase) {
      parts.push(`after ${source} ${every.afterLevel}, every ${every.everyLevels}: ${every.increase >= 0 ? "+" : ""}${every.increase}`);
    }
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
    document.getElementById("classFeatureScaleRows").innerHTML = "";
    const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
    if (milestones.length) milestones.forEach(milestone => addScaleMilestoneRow(milestone));
    else addScaleMilestoneRow();
    const every = scale.every || {};
    document.getElementById("classFeatureScaleAfter").value = every.afterLevel || "";
    document.getElementById("classFeatureScaleEvery").value = every.everyLevels || "";
    document.getElementById("classFeatureScaleIncrease").value = every.increase ?? "";
    scaleModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("classFeatureScaleModal"));
    scaleModal.show();
  }

  function collectScale() {
    const milestones = [...document.querySelectorAll("#classFeatureScaleRows .class-feature-scale-row")]
      .map(row => ({
        level: Number.parseInt(row.querySelector('[data-scale-field="level"]').value, 10),
        value: Number(row.querySelector('[data-scale-field="value"]').value)
      }))
      .filter(milestone => milestone.level > 0 && Number.isFinite(milestone.value))
      .sort((a, b) => a.level - b.level);
    const afterLevel = Number.parseInt(document.getElementById("classFeatureScaleAfter").value, 10);
    const everyLevels = Number.parseInt(document.getElementById("classFeatureScaleEvery").value, 10);
    const increase = Number(document.getElementById("classFeatureScaleIncrease").value);
    const every = afterLevel > 0 && everyLevels > 0 && Number.isFinite(increase) && increase !== 0
      ? { afterLevel, everyLevels, increase }
      : null;
    if (!milestones.length && !every) return null;
    const sourceSelect = document.getElementById("classFeatureScaleSource");
    const source = window.PFEffectMeta?.sourceFromSelect
      ? window.PFEffectMeta.sourceFromSelect(sourceSelect?.value || "caster")
      : { type: sourceSelect?.value || "caster" };
    return { source, milestones, every };
  }

  function clearScale() {
    if (!editingScaleRow) return;
    editingScaleRow._bonusScale = null;
    updateScaleSummary(editingScaleRow);
    bootstrap.Modal.getInstance(document.getElementById("classFeatureScaleModal"))?.hide();
  }

  function saveScale() {
    if (!editingScaleRow) return;
    editingScaleRow._bonusScale = collectScale();
    updateScaleSummary(editingScaleRow);
    bootstrap.Modal.getInstance(document.getElementById("classFeatureScaleModal"))?.hide();
  }

  function collectEffects() {
    return [...document.querySelectorAll("#classFeatureEffectRows .class-feature-effect-row")].map(row => {
      const selectedStat = row.querySelector('[data-effect-field="stat"]').value;
      const skillName = ["skill:craft", "skill:profession"].includes(selectedStat)
        ? namedSkill(selectedStat, row.querySelector('[data-effect-field="skillName"]')?.value)
        : "";
      const effect = {
        stat: skillName ? skillKey(skillName) : selectedStat,
        value: Number(row.querySelector('[data-effect-field="value"]').value || 0),
        type: row.querySelector('[data-effect-field="type"]').value || "untyped",
        stacks: row.querySelector('[data-effect-field="stacks"]').checked,
      conditional: row.querySelector('[data-effect-field="conditional"]').checked,
      appliesWhen: row.querySelector('[data-effect-field="appliesWhen"]').value.trim()
    };
    if (skillName) effect.skillName = skillName;
    if (row._bonusScale) effect.bonusScale = row._bonusScale;
    return effect;
  });
  }

  function collectFeature() {
    const feature = {
      name: document.getElementById("classFeatureName").value.trim(),
      description: document.getElementById("classFeatureDescription").value.trim()
    };
    const effects = collectEffects();
    if (effects.length) feature.effects = effects;
    return feature;
  }

  function open(feature = {}) {
    ensureModal();
    document.getElementById("classFeatureName").value = feature.name || "";
    document.getElementById("classFeatureDescription").value = feature.description || "";
    document.getElementById("classFeatureEffectRows").innerHTML = "";
    (Array.isArray(feature.effects) ? feature.effects : []).forEach(effect => addEffectRow(effect));
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("classFeatureEditorModal"));
    modal.show();
    setTimeout(() => document.getElementById("classFeatureName").focus(), 150);
    return new Promise(resolve => {
      resolver = resolve;
    });
  }

  window.PFClassFeatureEditor = { open };
})();
