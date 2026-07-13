(function () {
  let modal = null;
  let resolver = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureModal() {
    if (document.getElementById("classFeaturePoolEditorModal")) return;
    if (!document.getElementById("classFeaturePoolEditorStyles")) {
      const style = document.createElement("style");
      style.id = "classFeaturePoolEditorStyles";
      style.textContent = `
        #classFeaturePoolOptions {
          max-height: min(58vh, 680px);
          overflow: auto;
          padding-right: 4px;
        }
        .class-feature-pool-option.is-filtered {
          display: none;
        }
        .class-feature-pool-option textarea {
          min-height: 120px;
        }
        .class-feature-pool-option-meta {
          color: #9aa0a6;
          font-size: 12px;
        }
      `;
      document.head.appendChild(style);
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="classFeaturePoolEditorModal" tabindex="-1" aria-labelledby="classFeaturePoolEditorModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <form id="classFeaturePoolEditorForm" class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title" id="classFeaturePoolEditorModalLabel">Feature Pool</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2 mb-2">
                <div class="col-md-5">
                  <label for="classFeaturePoolName">Pool Name</label>
                  <input id="classFeaturePoolName" class="form-control form-control-sm" required placeholder="Discoveries">
                </div>
                <div class="col-md-3">
                  <label for="classFeaturePoolMinLevel">Minimum Class Level</label>
                  <input id="classFeaturePoolMinLevel" class="form-control form-control-sm" type="number" min="1" max="20">
                </div>
                <div class="col-md-4">
                  <label for="classFeaturePoolRace">Race Requirement</label>
                  <input id="classFeaturePoolRace" class="form-control form-control-sm" placeholder="Elf">
                </div>
              </div>
              <div class="mb-2">
                <label for="classFeaturePoolRequiredChoices">Required Previous Choices</label>
                <input id="classFeaturePoolRequiredChoices" class="form-control form-control-sm" placeholder="Mutagen, Greater Mutagen">
              </div>
              <div class="mb-3">
                <label for="classFeaturePoolRequirementText">Requirement Notes</label>
                <textarea id="classFeaturePoolRequirementText" class="form-control form-control-sm" rows="2" placeholder="Any requirement text that the scraper could not structure."></textarea>
              </div>
              <div class="mb-3">
                <label for="classFeaturePoolDescription">Description</label>
                <textarea id="classFeaturePoolDescription" class="form-control form-control-sm" rows="3"></textarea>
              </div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
                <div>
                  <div class="small text-secondary">Choices</div>
                  <div id="classFeaturePoolOptionCount" class="small text-secondary"></div>
                </div>
                <button id="addClassFeaturePoolOption" class="btn btn-outline-info btn-sm" type="button">Add Choice</button>
              </div>
              <input id="classFeaturePoolOptionSearch" class="form-control form-control-sm mb-2" placeholder="Search choices">
              <div id="classFeaturePoolOptions" class="vstack gap-2"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Pool</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    document.getElementById("addClassFeaturePoolOption").addEventListener("click", () => addOptionRow());
    document.getElementById("classFeaturePoolOptionSearch").addEventListener("input", filterOptionRows);
    document.getElementById("classFeaturePoolEditorForm").addEventListener("submit", event => {
      event.preventDefault();
      const pool = collectPool();
      if (!pool.name) return;
      resolver?.(pool);
      resolver = null;
      modal.hide();
    });
    document.getElementById("classFeaturePoolEditorModal").addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  function normalizeRequirements(requirements = {}) {
    return {
      minClassLevel: requirements.minClassLevel || requirements.minLevel || "",
      race: requirements.race || "",
      requiredChoices: Array.isArray(requirements.requiredChoices) ? requirements.requiredChoices : [],
      text: requirements.text || requirements.notes || ""
    };
  }

  function searchableOption(option = {}) {
    return [
      option.name || "",
      option.description || "",
      option.summary || "",
      option.source || "",
      option.publisher || "",
      option.requirements?.text || ""
    ].join(" ").toLowerCase();
  }

  function filterOptionRows() {
    const term = document.getElementById("classFeaturePoolOptionSearch")?.value.trim().toLowerCase() || "";
    const rows = [...document.querySelectorAll("#classFeaturePoolOptions .class-feature-pool-option")];
    let shown = 0;
    rows.forEach(row => {
      const matches = !term || String(row.dataset.searchText || "").includes(term);
      row.classList.toggle("is-filtered", !matches);
      if (matches) shown += 1;
    });
    const count = document.getElementById("classFeaturePoolOptionCount");
    if (count) count.textContent = `${shown} of ${rows.length} choice${rows.length === 1 ? "" : "s"}`;
  }

  function addOptionRow(option = {}) {
    const rows = document.getElementById("classFeaturePoolOptions");
    const req = normalizeRequirements(option.requirements || {});
    const row = document.createElement("div");
    row.className = "class-feature-pool-option";
    row.__poolOptionOriginal = JSON.parse(JSON.stringify(option || {}));
    row.dataset.searchText = searchableOption(option);
    row.innerHTML = `
      <div class="row g-2">
        <div class="col-md-4">
          <label>Choice Name</label>
          <input data-pool-option-field="name" class="form-control form-control-sm" value="${escapeHtml(option.name || "")}" required>
        </div>
        <div class="col-md-2">
          <label>Min Level</label>
          <input data-pool-option-field="minClassLevel" class="form-control form-control-sm" type="number" min="1" max="20" value="${escapeHtml(req.minClassLevel)}">
        </div>
        <div class="col-md-3">
          <label>Race</label>
          <input data-pool-option-field="race" class="form-control form-control-sm" value="${escapeHtml(req.race)}">
        </div>
        <div class="col-md-3 d-flex align-items-end justify-content-end">
          <button class="btn btn-outline-danger btn-sm" type="button" data-delete-pool-option><i class="bi bi-trash"></i></button>
        </div>
        ${option.source || option.publisher || option.sourceUrl ? `
          <div class="col-12 class-feature-pool-option-meta">
            ${escapeHtml([option.source, option.publisher].filter(Boolean).join(" | "))}${option.sourceUrl ? ` | ${escapeHtml(option.sourceUrl)}` : ""}
          </div>
        ` : ""}
        <div class="col-md-6">
          <label>Required Previous Choices</label>
          <input data-pool-option-field="requiredChoices" class="form-control form-control-sm" value="${escapeHtml(req.requiredChoices.join(", "))}">
        </div>
        <div class="col-md-6">
          <label>Requirement Notes</label>
          <input data-pool-option-field="requirementText" class="form-control form-control-sm" value="${escapeHtml(req.text)}">
        </div>
        <div class="col-12">
          <label>Description</label>
          <textarea data-pool-option-field="description" class="form-control form-control-sm" rows="2">${escapeHtml(option.description || "")}</textarea>
        </div>
      </div>
    `;
    row.querySelectorAll("input, textarea").forEach(input => {
      input.addEventListener("input", () => {
        row.dataset.searchText = searchableOption({
          ...row.__poolOptionOriginal,
          name: row.querySelector('[data-pool-option-field="name"]').value,
          description: row.querySelector('[data-pool-option-field="description"]').value,
          requirements: { text: row.querySelector('[data-pool-option-field="requirementText"]').value }
        });
        filterOptionRows();
      });
    });
    row.querySelector("[data-delete-pool-option]").addEventListener("click", () => {
      row.remove();
      filterOptionRows();
    });
    rows.appendChild(row);
    filterOptionRows();
  }

  function collectRequirements(scope, prefix = "") {
    const minClassLevel = Number.parseInt(scope.querySelector(`[data-pool-option-field="${prefix}minClassLevel"]`)?.value || "", 10);
    const requiredChoices = String(scope.querySelector(`[data-pool-option-field="${prefix}requiredChoices"]`)?.value || "")
      .split(",")
      .map(choice => choice.trim())
      .filter(Boolean);
    const requirements = {
      minClassLevel: minClassLevel > 0 ? minClassLevel : null,
      race: scope.querySelector(`[data-pool-option-field="${prefix}race"]`)?.value.trim() || "",
      requiredChoices,
      text: scope.querySelector(`[data-pool-option-field="${prefix}requirementText"]`)?.value.trim() || ""
    };
    Object.keys(requirements).forEach(key => {
      if (requirements[key] === "" || requirements[key] === null || (Array.isArray(requirements[key]) && !requirements[key].length)) delete requirements[key];
    });
    return requirements;
  }

  function collectPool() {
    const minClassLevel = Number.parseInt(document.getElementById("classFeaturePoolMinLevel").value || "", 10);
    const requiredChoices = document.getElementById("classFeaturePoolRequiredChoices").value
      .split(",")
      .map(choice => choice.trim())
      .filter(Boolean);
    const requirements = {
      minClassLevel: minClassLevel > 0 ? minClassLevel : null,
      race: document.getElementById("classFeaturePoolRace").value.trim(),
      requiredChoices,
      text: document.getElementById("classFeaturePoolRequirementText").value.trim()
    };
    Object.keys(requirements).forEach(key => {
      if (requirements[key] === "" || requirements[key] === null || (Array.isArray(requirements[key]) && !requirements[key].length)) delete requirements[key];
    });
    const options = [...document.querySelectorAll("#classFeaturePoolOptions .class-feature-pool-option")]
      .map(row => {
        const option = {
          ...(row.__poolOptionOriginal || {}),
          name: row.querySelector('[data-pool-option-field="name"]').value.trim(),
          description: row.querySelector('[data-pool-option-field="description"]').value.trim(),
          requirements: collectRequirements(row)
        };
        if (!Object.keys(option.requirements || {}).length) delete option.requirements;
        return option;
      })
      .filter(option => option.name);
    return {
      name: document.getElementById("classFeaturePoolName").value.trim(),
      description: document.getElementById("classFeaturePoolDescription").value.trim(),
      requirements,
      options
    };
  }

  function open(pool = {}) {
    ensureModal();
    const req = normalizeRequirements(pool.requirements || {});
    document.getElementById("classFeaturePoolName").value = pool.name || "";
    document.getElementById("classFeaturePoolDescription").value = pool.description || "";
    document.getElementById("classFeaturePoolMinLevel").value = req.minClassLevel || "";
    document.getElementById("classFeaturePoolRace").value = req.race || "";
    document.getElementById("classFeaturePoolRequiredChoices").value = req.requiredChoices.join(", ");
    document.getElementById("classFeaturePoolRequirementText").value = req.text || "";
    document.getElementById("classFeaturePoolOptionSearch").value = "";
    document.getElementById("classFeaturePoolOptions").innerHTML = "";
    (Array.isArray(pool.options) ? pool.options : []).forEach(option => addOptionRow(option));
    filterOptionRows();
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("classFeaturePoolEditorModal"));
    modal.show();
    setTimeout(() => document.getElementById("classFeaturePoolName").focus(), 150);
    return new Promise(resolve => {
      resolver = resolve;
    });
  }

  window.PFClassFeaturePoolEditor = { open };
})();
