(function () {
  let modal = null;
  let resolver = null;
  let initialized = false;
  let durationEditor = null;
  let featureDurationConfig = null;
  let editingMode = "feature";
  // Effects/DR/SR/Class Skill grants -- mounted once by ensureModal()
  // via the shared scripts/effect-editor.js accordion, reset/collected
  // on open()/collectFeature() below.
  let effectsAccordion = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function ensureModal() {
    if (initialized && document.getElementById("classFeatureEditorModal"))
      return;
    document.getElementById("classFeatureEditorModal")?.remove();
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
                <div id="classFeatureEffectsMount"></div>
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

    // Effects + DR/SR/Class Skills are a shared component now
    // (scripts/effect-editor.js) -- every effect-authoring surface in
    // the app mounts the same one instead of each building its own
    // Effects list plus its own Extra accordion separately.
    effectsAccordion = window.PFEffectEditor.mountEffectsAccordion(
      document.getElementById("classFeatureEffectsMount"),
      {
        idPrefix: "classFeatureEffects",
        accordionParentId: "classFeatureStatAccordion",
      },
    );

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
    const {
      effects,
      damageReduction,
      spellResistance,
      immunities,
      applyConditions,
      classSkillGrants,
      extraRanksPerLevel,
      sizeChanges,
      spellLikeAbilities,
      generatedEquipment,
      conditionalVariables,
    } = effectsAccordion.collect();
    if (effects.length) feature.effects = effects;
    if (damageReduction.length) feature.damageReduction = damageReduction;
    if (spellResistance.length) feature.spellResistance = spellResistance;
    if (immunities.length) feature.immunities = immunities;
    if (applyConditions.length) feature.applyConditions = applyConditions;
    if (classSkillGrants.length) feature.classSkillGrants = classSkillGrants;
    if (extraRanksPerLevel.length) feature.extraRanksPerLevel = extraRanksPerLevel;
    if (sizeChanges.length) feature.sizeChanges = sizeChanges;
    if (spellLikeAbilities.length)
      feature.spellLikeAbilities = spellLikeAbilities;
    if (generatedEquipment.length)
      feature.generatedEquipment = generatedEquipment;
    if (conditionalVariables.length)
      feature.conditionalVariables = conditionalVariables;
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
    effectsAccordion.reset(feature);
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
