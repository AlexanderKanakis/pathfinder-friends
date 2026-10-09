(function (root) {
  const MODAL_ID = "metamagicPickerModal";
  const DETAILS_MODAL_ID = "metamagicDetailsModal";
  const SAVE_MODAL_ID = "metamagicSaveModal";
  let definitions = [];
  let conditions = new Map();
  let selected = new Map();
  let resolver = null;
  let saveQueue = Promise.resolve();
  let baseSpellLevel = 0;
  let pendingResult = null;
  let viewingDetails = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function finishPicker(value) {
    pendingResult = { value };
    bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID)).hide();
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary metamagic-picker-modal">
            <div class="modal-header border-secondary"><h5 class="modal-title">Apply Metamagic</h5></div>
            <div class="modal-body">
              <input class="form-control form-control-sm" type="search" placeholder="Search metamagic feats" data-metamagic-search>
              <div class="metamagic-picker-list mt-2" data-metamagic-list></div>
            </div>
            <div class="modal-footer border-secondary">
              <span class="small text-secondary me-auto" data-metamagic-summary></span>
              <button type="button" class="btn btn-outline-light btn-sm" data-metamagic-cancel>Cancel</button>
              <button type="button" class="btn btn-info btn-sm" data-metamagic-apply>Apply</button>
            </div>
          </div>
        </div>
      </div>`);
    const element = document.getElementById(MODAL_ID);
    element.querySelector("[data-metamagic-search]").addEventListener("input", render);
    element.querySelector("[data-metamagic-cancel]").addEventListener("click", () => finishPicker(null));
    element.querySelector("[data-metamagic-apply]").addEventListener("click", () => {
      finishPicker([...selected.values()].map((selection) => ({
        name: selection.name,
        options: { ...(selection.options || {}) },
        definition: { ...selection.definition },
      })));
    });
    element.addEventListener("hidden.bs.modal", () => {
      if (viewingDetails) return;
      if (!resolver) return;
      const next = resolver;
      resolver = null;
      const result = pendingResult ? pendingResult.value : null;
      pendingResult = null;
      next(result);
    });
  }

  function ensureDetailsModal() {
    if (document.getElementById(DETAILS_MODAL_ID)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="${DETAILS_MODAL_ID}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary metamagic-details-modal">
            <div class="modal-header border-secondary"><h5 class="modal-title" data-metamagic-details-name></h5></div>
            <div class="modal-body">
              <section class="metamagic-details-section" data-metamagic-details-description-section>
                <h6>Description</h6>
                <p data-metamagic-details-description></p>
              </section>
              <section class="metamagic-details-section" data-metamagic-details-benefits-section>
                <h6>Benefit</h6>
                <p data-metamagic-details-benefits></p>
              </section>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>`);
    document.getElementById(DETAILS_MODAL_ID).addEventListener("hidden.bs.modal", () => {
      if (!viewingDetails) return;
      viewingDetails = false;
      bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID)).show();
    });
  }

  function openDetails(definition) {
    if (!definition) return;
    ensureDetailsModal();
    const pickerElement = document.getElementById(MODAL_ID);
    const detailsElement = document.getElementById(DETAILS_MODAL_ID);
    const description = String(definition.description || "").trim();
    const benefits = String(definition.benefits || "").trim();
    detailsElement.querySelector("[data-metamagic-details-name]").textContent = definition.name;
    detailsElement.querySelector("[data-metamagic-details-description]").textContent = description;
    detailsElement.querySelector("[data-metamagic-details-benefits]").textContent = benefits;
    detailsElement.querySelector("[data-metamagic-details-description-section]").hidden = !description;
    detailsElement.querySelector("[data-metamagic-details-benefits-section]").hidden = !benefits;
    viewingDetails = true;
    pickerElement.addEventListener("hidden.bs.modal", () => {
      bootstrap.Modal.getOrCreateInstance(detailsElement).show();
    }, { once: true });
    bootstrap.Modal.getOrCreateInstance(pickerElement).hide();
  }

  function stepper(name, field, value, min, max) {
    return `<div class="metamagic-option-stepper" data-metamagic-stepper>
      <button class="btn btn-outline-secondary btn-sm" type="button" data-metamagic-step="-1" aria-label="Decrease ${escapeHtml(field)}">-</button>
      <input class="form-control form-control-sm" type="number" min="${min}" max="${max}" value="${value}" data-metamagic-option="${escapeHtml(field)}" data-metamagic-name="${escapeHtml(name)}">
      <button class="btn btn-outline-secondary btn-sm" type="button" data-metamagic-step="1" aria-label="Increase ${escapeHtml(field)}">+</button>
    </div>`;
  }

  function selectHtml(name, field, values, current) {
    return `<select class="form-select form-select-sm" data-metamagic-option="${field}" data-metamagic-name="${escapeHtml(name)}">${values.map(([value, label]) => `<option value="${value}"${current === value ? " selected" : ""}>${label}</option>`).join("")}</select>`;
  }

  function optionsHtml(definition, selection) {
    const options = selection?.options || {};
    if (definition.name === "Heighten Spell") {
      const minimum = Math.min(9, baseSpellLevel + 1);
      const value = Math.max(minimum, Math.min(9, Number(options.targetLevel || minimum)));
      return `<label class="metamagic-option"><span>Effective spell level</span>${stepper(definition.name, "targetLevel", value, minimum, 9)}</label>`;
    }
    if (definition.name === "Reach Spell") {
      return `<label class="metamagic-option"><span>New range</span>${selectHtml(definition.name, "range", [["touch", "Touch"], ["short", "Short"], ["medium", "Medium"], ["long", "Long"]], String(options.range || "long"))}</label>`;
    }
    if (definition.name === "Elemental Spell") {
      return `<div class="metamagic-option-grid">
        <label class="metamagic-option"><span>Damage type</span>${selectHtml(definition.name, "damageType", [["acid", "Acid"], ["cold", "Cold"], ["electricity", "Electricity"], ["fire", "Fire"]], String(options.damageType || "fire"))}</label>
        <label class="metamagic-option"><span>Conversion</span>${selectHtml(definition.name, "mode", [["replace", "Replace"], ["split", "Split evenly"]], String(options.mode || "replace"))}</label>
      </div>`;
    }
    if (definition.name === "Benthic Spell") {
      return `<label class="metamagic-option"><span>Conversion</span>${selectHtml(definition.name, "mode", [["replace", "Replace with bludgeoning"], ["split", "Split evenly"]], String(options.mode || "replace"))}</label>`;
    }
    if (definition.name === "Cherry Blossom Spell") {
      return `<label class="metamagic-option"><span>Ability damage</span>${selectHtml(definition.name, "abilityGroup", [["physical", "STR, DEX, CON"], ["mental", "INT, WIS, CHA"]], String(options.abilityGroup || "physical"))}</label>`;
    }
    if (definition.name === "Crypt Spell") {
      return `<label class="metamagic-option"><span>Target</span>${selectHtml(definition.name, "targetKind", [["not-undead", "Not undead"], ["undead", "Undead"]], String(options.targetKind || "not-undead"))}</label>`;
    }
    return "";
  }

  function render() {
    const element = document.getElementById(MODAL_ID);
    if (!element) return;
    const term = element.querySelector("[data-metamagic-search]").value.trim().toLowerCase();
    const rows = definitions.filter((definition) =>
      `${definition.name} ${definition.description} ${definition.benefits}`.toLowerCase().includes(term));
    element.querySelector("[data-metamagic-list]").innerHTML = rows.length
      ? rows.map((definition) => {
          const selection = selected.get(definition.name);
          return `<article class="metamagic-picker-row${selection ? " is-selected" : ""}" data-metamagic-card="${escapeHtml(definition.name)}" tabindex="0">
            <div class="metamagic-picker-heading">
              <label class="metamagic-picker-select" aria-label="Select ${escapeHtml(definition.name)}">
                <input class="form-check-input" type="checkbox" data-metamagic-toggle="${escapeHtml(definition.name)}"${selection ? " checked" : ""}>
              </label>
              <strong class="metamagic-picker-name">${escapeHtml(definition.name)}</strong>
              <span class="metamagic-level-badge">+${definition.spellLevelIncrease} slot level${definition.spellLevelIncrease === 1 ? "" : "s"}</span>
            </div>
            ${selection ? `<div data-metamagic-controls>${optionsHtml(definition, selection)}</div>` : ""}
          </article>`;
        }).join("")
      : `<div class="small text-secondary">No metamagic feats match this search.</div>`;
    const total = [...selected.values()].reduce((sum, entry) =>
      sum + (entry.name === "Heighten Spell"
        ? Math.max(0, Number(entry.options?.targetLevel || baseSpellLevel) - baseSpellLevel)
        : Number(entry.definition?.spellLevelIncrease || 0)), 0);
    element.querySelector("[data-metamagic-summary]").textContent = selected.size
      ? `${selected.size} selected | +${total} effective slot levels`
      : "No metamagic selected";
    bindRows();
  }

  function defaultOptions(name) {
    if (name === "Heighten Spell") return { targetLevel: Math.min(9, baseSpellLevel + 1) };
    if (name === "Reach Spell") return { range: "long" };
    if (name === "Elemental Spell") return { damageType: "fire", mode: "replace" };
    if (name === "Benthic Spell") return { mode: "replace" };
    if (name === "Cherry Blossom Spell") return { abilityGroup: "physical" };
    if (name === "Crypt Spell") return { targetKind: "not-undead" };
    return {};
  }

  function bindRows() {
    const element = document.getElementById(MODAL_ID);
    element.querySelectorAll("[data-metamagic-card]").forEach((card) => {
      const showDetails = () => openDetails(definitions.find((entry) => entry.name === card.dataset.metamagicCard));
      card.addEventListener("click", (event) => {
        if (event.target.closest("input, button, select, label, [data-metamagic-controls]")) return;
        showDetails();
      });
      card.addEventListener("keydown", (event) => {
        if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        showDetails();
      });
    });
    element.querySelectorAll("[data-metamagic-toggle]").forEach((input) => {
      input.addEventListener("change", () => {
        const definition = definitions.find((entry) => entry.name === input.dataset.metamagicToggle);
        if (!definition) return;
        if (input.checked) selected.set(definition.name, { name: definition.name, definition, options: defaultOptions(definition.name) });
        else selected.delete(definition.name);
        render();
      });
    });
    element.querySelectorAll("[data-metamagic-option]").forEach((input) => {
      input.addEventListener("change", () => {
        const selection = selected.get(input.dataset.metamagicName);
        if (!selection) return;
        selection.options[input.dataset.metamagicOption] = input.type === "number" ? Number(input.value) : input.value;
        render();
      });
    });
    element.querySelectorAll("[data-metamagic-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.closest("[data-metamagic-stepper]").querySelector("input");
        input.value = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + Number(button.dataset.metamagicStep)));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  async function open({ selections = [], spellLevel = 0 } = {}) {
    ensureModal();
    const loaded = await root.PFMetamagic.ready();
    definitions = loaded.definitions;
    conditions = loaded.conditions;
    baseSpellLevel = Math.max(0, Number(spellLevel || 0));
    selected = new Map((Array.isArray(selections) ? selections : []).map((selection) => {
      const definition = definitions.find((entry) => entry.name === selection.name) || selection.definition || selection;
      return [selection.name, { name: selection.name, definition, options: { ...(selection.options || {}) } }];
    }));
    const element = document.getElementById(MODAL_ID);
    element.querySelector("[data-metamagic-search]").value = "";
    render();
    bootstrap.Modal.getOrCreateInstance(element).show();
    setTimeout(() => element.querySelector("[data-metamagic-search]").focus(), 150);
    return new Promise((resolve) => { resolver = resolve; });
  }

  function ensureSaveModal() {
    if (document.getElementById(SAVE_MODAL_ID)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="${SAVE_MODAL_ID}" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary"><h5 class="modal-title" data-metamagic-save-title>Metamagic Save</h5></div>
          <div class="modal-body"><p class="mb-1" data-metamagic-save-prompt></p><div class="small text-secondary" data-metamagic-save-type></div></div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-outline-light btn-sm" data-metamagic-save-cancel>Cancel</button>
            <button type="button" class="btn btn-outline-info btn-sm" data-metamagic-save-passed>Save Passed</button>
            <button type="button" class="btn btn-danger btn-sm" data-metamagic-save-failed>Save Failed</button>
          </div>
        </div></div>
      </div>`);
  }

  function runSaveConfirmation({ featName = "Metamagic", targetName = "the target", type = "Save", prompt = "" } = {}) {
    ensureSaveModal();
    const element = document.getElementById(SAVE_MODAL_ID);
    element.querySelector("[data-metamagic-save-title]").textContent = featName;
    element.querySelector("[data-metamagic-save-prompt]").textContent = prompt || `Did ${targetName} fail the save?`;
    element.querySelector("[data-metamagic-save-type]").textContent = `${targetName} | ${type} save`;
    const modal = bootstrap.Modal.getOrCreateInstance(element);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        element.addEventListener("hidden.bs.modal", () => resolve(value), { once: true });
        modal.hide();
      };
      element.querySelector("[data-metamagic-save-cancel]").onclick = () => finish(null);
      element.querySelector("[data-metamagic-save-passed]").onclick = () => finish(false);
      element.querySelector("[data-metamagic-save-failed]").onclick = () => finish(true);
      modal.show();
    });
  }

  root.PFMetamagicPicker = {
    open,
    conditionDefinitions: () => conditions,
    confirmSave(options = {}) {
      const next = saveQueue.then(() => runSaveConfirmation(options), () => runSaveConfirmation(options));
      saveQueue = next.catch(() => null);
      return next;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
