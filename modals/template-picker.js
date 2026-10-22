(function (root) {
  const MODAL_ID = "creatureTemplatePickerModal";
  let modal = null;
  let state = null;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const host = document.createElement("div");
    host.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Creature Templates</h5>
            </div>
            <div class="modal-body template-picker-body">
              <aside class="template-picker-sidebar">
                <input class="form-control form-control-sm" data-template-search placeholder="Search templates" aria-label="Search templates">
                <div class="small text-secondary" data-template-count></div>
                <div class="template-picker-list" data-template-list></div>
              </aside>
              <article class="template-picker-detail" data-template-detail>
                <div class="small text-secondary">Choose a template to read its rules.</div>
              </article>
            </div>
            <div class="modal-footer border-secondary">
              <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
              <button class="btn btn-primary btn-sm" type="button" data-template-apply>Apply Templates</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
  }

  function templateBadges(entry) {
    return [
      entry.crAdjustment ? `CR ${entry.crAdjustment}` : "",
      entry.templateType,
      entry.simple ? "Simple" : "",
      entry.usableWithSummons ? "Summon" : "",
    ]
      .filter(Boolean)
      .map((label) => `<span class="template-rule-badge">${escapeHtml(label)}</span>`)
      .join("");
  }

  function renderDetail() {
    const detail = document.querySelector(`#${MODAL_ID} [data-template-detail]`);
    const entry = state.templates.find((item) => item.id === state.focusedId);
    if (!entry) {
      detail.innerHTML = '<div class="small text-secondary">Choose a template to read its rules.</div>';
      return;
    }
    detail.innerHTML = `
      <div class="template-detail-heading">
        <div>
          <h4>${escapeHtml(entry.name)}</h4>
          <div class="template-rule-badges">${templateBadges(entry)}</div>
        </div>
        <label class="template-detail-toggle">
          <input class="form-check-input" type="checkbox" data-template-detail-select="${escapeHtml(entry.id)}" ${state.selected.has(entry.id) ? "checked" : ""}>
          <span>Add template</span>
        </label>
      </div>
      ${entry.source ? `<div class="small text-secondary mb-3">${escapeHtml(entry.source)}</div>` : ""}
      <div class="template-rules-content">${entry.descriptionHtml || '<p class="text-secondary">No rules text available.</p>'}</div>
      ${entry.url ? `<a class="btn btn-outline-info btn-sm mt-3" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">Open source</a>` : ""}`;
    detail.querySelector("[data-template-detail-select]")?.addEventListener("change", (event) => {
      setSelected(entry.id, event.target.checked);
    });
  }

  function filteredTemplates() {
    const term = state.search.trim().toLowerCase();
    if (!term) return state.templates;
    return state.templates.filter((entry) =>
      `${entry.name} ${entry.templateType} ${entry.source}`.toLowerCase().includes(term),
    );
  }

  function renderList() {
    const node = document.getElementById(MODAL_ID);
    const entries = filteredTemplates();
    node.querySelector("[data-template-count]").textContent =
      `${state.selected.size} selected | ${entries.length} shown`;
    node.querySelector("[data-template-list]").innerHTML = entries
      .map((entry) => `
        <div class="template-picker-row${entry.id === state.focusedId ? " active" : ""}">
          <button class="template-picker-name" type="button" data-template-focus="${escapeHtml(entry.id)}">
            <strong>${escapeHtml(entry.name)}</strong>
            <span>${escapeHtml(entry.templateType || "Template")}${entry.crAdjustment ? ` | CR ${escapeHtml(entry.crAdjustment)}` : ""}</span>
          </button>
          <label class="template-picker-check" title="Add ${escapeHtml(entry.name)}">
            <input class="form-check-input" type="checkbox" data-template-select="${escapeHtml(entry.id)}" ${state.selected.has(entry.id) ? "checked" : ""}>
            <span class="visually-hidden">Add ${escapeHtml(entry.name)}</span>
          </label>
        </div>`)
      .join("");
    node.querySelectorAll("[data-template-focus]").forEach((button) => {
      button.addEventListener("click", () => {
        state.focusedId = button.dataset.templateFocus;
        renderList();
        renderDetail();
      });
    });
    node.querySelectorAll("[data-template-select]").forEach((input) => {
      input.addEventListener("change", () => setSelected(input.dataset.templateSelect, input.checked));
    });
  }

  function setSelected(id, selected) {
    if (selected) state.selected.add(id);
    else state.selected.delete(id);
    renderList();
    renderDetail();
  }

  async function open({ selectedIds = [], onApply } = {}) {
    ensureModal();
    const data = await root.PFTemplateData.load();
    state = {
      templates: data.templates || [],
      selected: new Set((Array.isArray(selectedIds) ? selectedIds : []).map(String)),
      focusedId: String(selectedIds[0] || data.templates?.[0]?.id || ""),
      search: "",
      onApply,
    };
    const node = document.getElementById(MODAL_ID);
    const search = node.querySelector("[data-template-search]");
    search.value = "";
    search.oninput = () => {
      state.search = search.value;
      renderList();
    };
    node.querySelector("[data-template-apply]").onclick = () => {
      const selected = [...state.selected];
      state.onApply?.(selected);
      modal.hide();
    };
    renderList();
    renderDetail();
    modal.show();
  }

  root.PFTemplatePicker = { open };
})(window);
