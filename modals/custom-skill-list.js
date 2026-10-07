(function () {
  const MODAL_ID = "customSkillListModal";
  let modal = null;
  let resolver = null;
  let currentOptions = [];
  let currentSaveList = null;
  let selected = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeSkillEntry(entry) {
    if (Array.isArray(entry)) return { name: entry[0], ability: entry[1] };
    return { name: entry?.name, ability: entry?.ability };
  }

  function skillStatValue(skillName = "") {
    if (window.PFEffectStats?.skillStatValue) {
      return window.PFEffectStats.skillStatValue(skillName);
    }
    return `skill:${String(skillName || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function baseSkills() {
    const base = window.PFEffectStats?.PF_SKILLS_WITH_ABILITY || [];
    const skills = base.map(normalizeSkillEntry).filter((skill) => skill.name);
    if (!skills.some((skill) => /^craft$/i.test(skill.name))) {
      skills.push({ name: "Craft", ability: "int" });
    }
    if (!skills.some((skill) => /^profession$/i.test(skill.name))) {
      skills.push({ name: "Profession", ability: "wis" });
    }
    if (!skills.some((skill) => /^perform$/i.test(skill.name))) {
      skills.push({ name: "Perform", ability: "cha" });
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  function skillOptions(skills) {
    const merged = [...baseSkills(), ...(skills || []).map(normalizeSkillEntry)]
      .filter((skill) => skill.name)
      .reduce((map, skill) => {
        const key = window.PFEffectStats?.normalizeSkillName
          ? window.PFEffectStats.normalizeSkillName(skill.name)
          : String(skill.name).toLowerCase();
        if (!map.has(key)) map.set(key, skill);
        return map;
      }, new Map());
    return [...merged.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((skill) => ({
        value: skillStatValue(skill.name),
        label: skill.name,
        meta: String(skill.ability || "").toUpperCase(),
        group: "Skills",
        skillName: skill.name,
      }));
  }

  function normalizeOption(option = {}) {
    const source =
      option && typeof option === "object"
        ? option
        : { value: String(option || ""), label: String(option || "") };
    const spell =
      source.spell && typeof source.spell === "object" ? source.spell : null;
    const spellName = String(source.spellName || spell?.name || "").trim();
    const value = String(
      spellName || source.name || source.value || source.stat || source.key || "",
    ).trim();
    if (!value) return null;
    return {
      value,
      label: String(spellName || source.label || source.name || value).trim() || value,
      meta: String(source.meta || source.group || "").trim(),
      group: String(source.group || "Targets").trim() || "Targets",
      skillName: source.skillName || "",
      name: spellName || source.name || "",
      spellName,
    };
  }

  function targetOptions(options = {}) {
    // Shared skill-only callers may pass `options: undefined`. Only an actual
    // array means the caller is replacing the normal skill catalog.
    const hasProvidedOptions = Array.isArray(options.options);
    const provided = Array.isArray(options.options)
      ? options.options.map(normalizeOption).filter(Boolean)
      : [];
    if (hasProvidedOptions) return provided;
    return skillOptions(options.skills);
  }

  function selectedOptions() {
    const byValue = new Map(currentOptions.map((option) => [option.value, option]));
    return [...selected]
      .map((value) => byValue.get(value))
      .filter(Boolean);
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="${MODAL_ID}Title">Custom Skill List</h5>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label for="${MODAL_ID}Name">List Name</label>
                <input id="${MODAL_ID}Name" class="form-control form-control-sm" placeholder="Crafting skills">
              </div>
              <div class="mb-2">
                <label for="${MODAL_ID}Search" id="${MODAL_ID}SearchLabel">Skills</label>
                <input id="${MODAL_ID}Search" class="form-control form-control-sm" placeholder="Search skills">
              </div>
              <div class="custom-skill-list-toolbar">
                <button id="${MODAL_ID}SelectVisible" class="btn btn-outline-info btn-sm" type="button">Select Visible</button>
                <button id="${MODAL_ID}ClearVisible" class="btn btn-outline-light btn-sm" type="button">Clear Visible</button>
              </div>
              <div id="${MODAL_ID}Skills" class="custom-skill-list-grid"></div>
              <div id="${MODAL_ID}Status" class="small mt-2 text-warning"></div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="${MODAL_ID}Save" class="btn btn-primary btn-sm" type="button">Save List</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(`${MODAL_ID}Search`)
      .addEventListener("input", renderSkills);
    document
      .getElementById(`${MODAL_ID}SelectVisible`)
      .addEventListener("click", () => {
        visibleSkills().forEach((option) => selected.add(option.value));
        renderSkills();
      });
    document
      .getElementById(`${MODAL_ID}ClearVisible`)
      .addEventListener("click", () => {
        visibleSkills().forEach((option) => selected.delete(option.value));
        renderSkills();
      });
    document
      .getElementById(`${MODAL_ID}Save`)
      .addEventListener("click", saveList);
    document.getElementById(MODAL_ID).addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  function visibleSkills() {
    const term =
      document
        .getElementById(`${MODAL_ID}Search`)
        ?.value.trim()
        .toLowerCase() || "";
    return currentOptions.filter(
      (option) =>
        !term ||
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.group.toLowerCase().includes(term),
    );
  }

  function renderSkills() {
    const list = document.getElementById(`${MODAL_ID}Skills`);
    const rows = visibleSkills();
    list.innerHTML = rows
      .map(
        (option) => `
      <label class="custom-skill-list-option">
        <input class="form-check-input" type="checkbox" value="${escapeHtml(option.value)}" ${selected.has(option.value) ? "checked" : ""}>
        <span>${escapeHtml(option.label)}</span>
        <small>${escapeHtml(option.meta || option.group)}</small>
      </label>
    `,
      )
      .join("");
    list.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(checkbox.value);
        else selected.delete(checkbox.value);
      });
    });
  }

  function saveList() {
    const name = document.getElementById(`${MODAL_ID}Name`).value.trim();
    const status = document.getElementById(`${MODAL_ID}Status`);
    if (!name) {
      status.textContent = "List name is required.";
      return;
    }
    if (!selected.size) {
      status.textContent = "Choose at least one target.";
      return;
    }
    const picked = selectedOptions();
    const items = picked.map((option) => ({
      value: option.value,
      label: option.label,
      ...(option.name ? { name: option.name } : {}),
      ...(option.spellName ? { spellName: option.spellName } : {}),
      ...(option.meta ? { meta: option.meta } : {}),
      ...(option.group ? { group: option.group } : {}),
    }));
    const skills = picked
      .map((option) => option.skillName)
      .filter(Boolean);
    const saveList =
      typeof currentSaveList === "function"
        ? currentSaveList
        : window.PFEffectStats?.saveCustomSkillList;
    const saved = saveList?.({
      name,
      skills,
      items,
    });
    if (!saved) {
      status.textContent = "Could not save this list.";
      return;
    }
    const settle = resolver;
    resolver = null;
    settle?.(saved);
    modal.hide();
  }

  function open(options = {}) {
    ensureModal();
    currentOptions = targetOptions(options);
    selected = new Set();
    const title = options.title || "Custom Skill List";
    const label = options.label || (options.options ? "Targets" : "Skills");
    document.getElementById(`${MODAL_ID}Title`).textContent = title;
    document.getElementById(`${MODAL_ID}SearchLabel`).textContent = label;
    document.getElementById(`${MODAL_ID}Name`).value = "";
    document.getElementById(`${MODAL_ID}Search`).value = "";
    document.getElementById(`${MODAL_ID}Search`).placeholder =
      options.options ? "Search targets" : "Search skills";
    document.getElementById(`${MODAL_ID}Status`).textContent = "";
    currentSaveList =
      typeof options.saveList === "function" ? options.saveList : null;
    renderSkills();
    const modalEl = document.getElementById(MODAL_ID);
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    return new Promise((resolve) => {
      resolver = resolve;
      modal.show();
      modalEl.addEventListener(
        "shown.bs.modal",
        () => document.getElementById(`${MODAL_ID}Name`)?.focus(),
        { once: true },
      );
    });
  }

  window.PFCustomSkillListModal = { open };
})();
