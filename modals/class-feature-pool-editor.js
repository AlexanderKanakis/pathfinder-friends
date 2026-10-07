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
        .class-feature-pool-option-summary {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 8px;
        }
        .class-feature-pool-option-info {
          min-width: 0;
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
              <div class="mb-2">
                <label for="classFeaturePoolContributesTo">Contributes To Active Feature</label>
                <input id="classFeaturePoolContributesTo" class="form-control form-control-sm" placeholder="Rage">
                <div class="small-text">If set, a selected choice's effects are bundled into that active feature when it's used (e.g. rage powers into Rage) instead of applying on their own.</div>
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
    document
      .getElementById("addClassFeaturePoolOption")
      .addEventListener("click", async () => {
        const created = await window.PFClassFeatureEditor.open(
          {},
          { mode: "option" },
        );
        if (!created || !created.name) return;
        addOptionRow(created);
      });
    document
      .getElementById("classFeaturePoolOptionSearch")
      .addEventListener("input", filterOptionRows);
    document
      .getElementById("classFeaturePoolEditorForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const pool = collectPool();
        if (!pool.name) return;
        resolver?.(pool);
        resolver = null;
        modal.hide();
      });
    document
      .getElementById("classFeaturePoolEditorModal")
      .addEventListener("hidden.bs.modal", () => {
        resolver?.(null);
        resolver = null;
      });
  }

  function normalizeRequirements(requirements = {}) {
    return {
      minClassLevel: requirements.minClassLevel || requirements.minLevel || "",
      race: requirements.race || "",
      requiredChoices: Array.isArray(requirements.requiredChoices)
        ? requirements.requiredChoices
        : [],
      text: requirements.text || requirements.notes || "",
    };
  }

  function searchableOption(option = {}) {
    return [
      option.name || "",
      option.description || "",
      option.summary || "",
      option.source || "",
      option.publisher || "",
      option.requirements?.text || "",
    ]
      .join(" ")
      .toLowerCase();
  }

  function filterOptionRows() {
    const term =
      document
        .getElementById("classFeaturePoolOptionSearch")
        ?.value.trim()
        .toLowerCase() || "";
    const rows = [
      ...document.querySelectorAll(
        "#classFeaturePoolOptions .class-feature-pool-option",
      ),
    ];
    let shown = 0;
    rows.forEach((row) => {
      const matches =
        !term || String(row.dataset.searchText || "").includes(term);
      row.classList.toggle("is-filtered", !matches);
      if (matches) shown += 1;
    });
    const count = document.getElementById("classFeaturePoolOptionCount");
    if (count)
      count.textContent = `${shown} of ${rows.length} choice${rows.length === 1 ? "" : "s"}`;
  }

  // Choices are edited full-screen in PFClassFeatureEditor (same Effects/
  // DR/Activatable UI a class feature gets, plus prerequisites) rather than
  // inline -- there just isn't room for that here, and rage powers etc.
  // need the same expressiveness as a top-level feature.
  function summarizeOption(option = {}) {
    const req = normalizeRequirements(option.requirements || {});
    const parts = [];
    if (req.minClassLevel) parts.push(`Level ${req.minClassLevel}+`);
    if (req.race) parts.push(req.race);
    if (req.requiredChoices.length)
      parts.push(`requires ${req.requiredChoices.join(", ")}`);
    if (
      option.activatable ||
      window.PFEffectMechanics?.hasActiveMechanics?.(option)
    )
      parts.push("Active");
    const effectCount = Array.isArray(option.effects)
      ? option.effects.length
      : 0;
    if (effectCount)
      parts.push(`${effectCount} effect${effectCount === 1 ? "" : "s"}`);
    if (Array.isArray(option.damageReduction) && option.damageReduction.length)
      parts.push("DR");
    if (Array.isArray(option.spellResistance) && option.spellResistance.length)
      parts.push("SR");
    return parts.join(" | ") || "No effects set yet";
  }

  function renderOptionRowContent(row) {
    const option = row.__poolOption;
    row.dataset.searchText = searchableOption(option);
    row.innerHTML = `
      <div class="class-feature-pool-option-summary">
        <div class="class-feature-pool-option-info">
          <strong>${escapeHtml(option.name || "Unnamed choice")}</strong>
          <div class="small-text">${escapeHtml(summarizeOption(option))}</div>
          ${
            option.source || option.publisher || option.sourceUrl
              ? `
            <div class="class-feature-pool-option-meta">
              ${escapeHtml([option.source, option.publisher].filter(Boolean).join(" | "))}${option.sourceUrl ? ` | ${escapeHtml(option.sourceUrl)}` : ""}
            </div>
          `
              : ""
          }
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-outline-warning btn-sm btn-icon" type="button" data-edit-pool-option aria-label="Edit choice"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-delete-pool-option aria-label="Delete choice"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
    row
      .querySelector("[data-edit-pool-option]")
      .addEventListener("click", async () => {
        const edited = await window.PFClassFeatureEditor.open(
          row.__poolOption,
          { mode: "option" },
        );
        if (!edited || !edited.name) return;
        // Keep scraped metadata (source/sourceUrl/publisher/summary/...)
        // that the editor doesn't know about; everything it does edit
        // (name, description, effects, DR, activatable, requirements)
        // is fully replaced so clearing a field in the editor actually
        // clears it here too.
        const preserved = { ...row.__poolOption };
        [
          "name",
          "description",
          "activatable",
          "durationConfig",
          "activeMechanics",
          "requirements",
          ...(window.PFEffectMechanics?.mechanicKeys?.() || [
            "effects",
            "damageReduction",
          ]),
        ].forEach((key) => delete preserved[key]);
        row.__poolOption = { ...preserved, ...edited };
        renderOptionRowContent(row);
        filterOptionRows();
      });
    row
      .querySelector("[data-delete-pool-option]")
      .addEventListener("click", () => {
        row.remove();
        filterOptionRows();
      });
  }

  function addOptionRow(option = {}) {
    const rows = document.getElementById("classFeaturePoolOptions");
    const row = document.createElement("div");
    row.className = "class-feature-pool-option";
    row.__poolOption = option || {};
    renderOptionRowContent(row);
    rows.appendChild(row);
    filterOptionRows();
  }

  function collectPool() {
    const minClassLevel = Number.parseInt(
      document.getElementById("classFeaturePoolMinLevel").value || "",
      10,
    );
    const requiredChoices = document
      .getElementById("classFeaturePoolRequiredChoices")
      .value.split(",")
      .map((choice) => choice.trim())
      .filter(Boolean);
    const requirements = {
      minClassLevel: minClassLevel > 0 ? minClassLevel : null,
      race: document.getElementById("classFeaturePoolRace").value.trim(),
      requiredChoices,
      text: document
        .getElementById("classFeaturePoolRequirementText")
        .value.trim(),
    };
    Object.keys(requirements).forEach((key) => {
      if (
        requirements[key] === "" ||
        requirements[key] === null ||
        (Array.isArray(requirements[key]) && !requirements[key].length)
      )
        delete requirements[key];
    });
    const options = [
      ...document.querySelectorAll(
        "#classFeaturePoolOptions .class-feature-pool-option",
      ),
    ]
      .map((row) => row.__poolOption)
      .filter((option) => option?.name);
    const contributesToAbility = document
      .getElementById("classFeaturePoolContributesTo")
      .value.trim();
    return {
      name: document.getElementById("classFeaturePoolName").value.trim(),
      description: document
        .getElementById("classFeaturePoolDescription")
        .value.trim(),
      requirements,
      ...(contributesToAbility ? { contributesToAbility } : {}),
      options,
    };
  }

  function open(pool = {}) {
    ensureModal();
    const req = normalizeRequirements(pool.requirements || {});
    document.getElementById("classFeaturePoolName").value = pool.name || "";
    document.getElementById("classFeaturePoolDescription").value =
      pool.description || "";
    document.getElementById("classFeaturePoolMinLevel").value =
      req.minClassLevel || "";
    document.getElementById("classFeaturePoolRace").value = req.race || "";
    document.getElementById("classFeaturePoolRequiredChoices").value =
      req.requiredChoices.join(", ");
    document.getElementById("classFeaturePoolRequirementText").value =
      req.text || "";
    document.getElementById("classFeaturePoolContributesTo").value =
      pool.contributesToAbility || "";
    document.getElementById("classFeaturePoolOptionSearch").value = "";
    document.getElementById("classFeaturePoolOptions").innerHTML = "";
    (Array.isArray(pool.options) ? pool.options : []).forEach((option) =>
      addOptionRow(option),
    );
    filterOptionRows();
    modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("classFeaturePoolEditorModal"),
    );
    modal.show();
    setTimeout(
      () => document.getElementById("classFeaturePoolName").focus(),
      150,
    );
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  window.PFClassFeaturePoolEditor = { open };
})();
