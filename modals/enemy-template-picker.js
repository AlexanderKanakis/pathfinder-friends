(function () {
  const MODAL_ID = "enemyTemplatePickerModal";
  let modal = null;
  let monsters = [];
  let filtered = [];
  let selected = null;
  let config = {};
  const state = { search: "", sortKey: "name", sortDir: "asc" };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="${MODAL_ID}Label">Enemy Templates</h5>
              <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <input id="enemyTemplateSearch" class="form-control form-control-sm mb-3" placeholder="Search enemy name">
              <div class="table-responsive enemy-template-table-wrap">
                <table class="table table-dark table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th><button class="btn btn-link btn-sm p-0 text-info text-decoration-none" type="button" data-template-sort="name">Name <span data-template-sort-icon="name"></span></button></th>
                      <th class="text-nowrap"><button class="btn btn-link btn-sm p-0 text-info text-decoration-none" type="button" data-template-sort="cr">CR <span data-template-sort-icon="cr"></span></button></th>
                      <th class="text-secondary text-end">Type</th>
                    </tr>
                  </thead>
                  <tbody id="enemyTemplateRows"></tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    const style = document.createElement("style");
    style.textContent = `
      .enemy-template-table-wrap { min-height: min(58vh, 540px); }
      #enemyTemplateRows tr { cursor: pointer; }
      #enemyTemplateRows tr:hover { --bs-table-bg: #2b2f33; }
      .enemy-template-type { font-size: 0.78rem; }
    `;
    document.head.appendChild(style);
  }

  async function loadMonsters() {
    if (monsters.length) return monsters;
    const response = await fetch("./data/monsters.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load monster templates (${response.status}).`);
    const data = await response.json();
    monsters = Array.isArray(data) ? data.filter(monster => String(monster?.name || "").trim()) : [];
    return monsters;
  }

  function crValue(value) {
    const text = String(value ?? "").trim();
    if (!text) return -999;
    const fraction = text.match(/^(\d+)\/(\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    const number = text.match(/[+\-]?\d+(?:\.\d+)?/);
    return number ? Number(number[0]) : -999;
  }

  function sortRows(a, b) {
    const dir = state.sortDir === "asc" ? 1 : -1;
    if (state.sortKey === "cr") {
      const diff = crValue(a.cr) - crValue(b.cr);
      if (diff) return diff * dir;
      return String(a.name || "").localeCompare(String(b.name || ""));
    }
    return String(a.name || "").localeCompare(String(b.name || "")) * dir;
  }

  function applyFilters() {
    const term = state.search.trim().toLowerCase();
    filtered = monsters
      .filter(monster => !term || String(monster.name || "").toLowerCase().includes(term))
      .sort(sortRows);
  }

  function sortIcon(key) {
    if (state.sortKey !== key) return "";
    return state.sortDir === "asc" ? "↑" : "↓";
  }

  function render() {
    applyFilters();
    document.querySelectorAll("[data-template-sort-icon]").forEach(node => {
      node.textContent = sortIcon(node.dataset.templateSortIcon);
    });
    document.getElementById("enemyTemplateRows").innerHTML = filtered.length
      ? filtered.map((monster, index) => `
        <tr data-template-index="${index}">
          <td class="fw-semibold">${escapeHtml(monster.name || "Unnamed")}</td>
          <td class="text-nowrap">${escapeHtml(monster.cr || "-")}</td>
          <td class="text-secondary text-end enemy-template-type">${escapeHtml([monster.size, monster.creatureType].filter(Boolean).join(" ") || "-")}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3" class="text-secondary">No templates found.</td></tr>`;
    document.querySelectorAll("[data-template-index]").forEach(row => {
      row.addEventListener("click", () => chooseTemplate(Number(row.dataset.templateIndex)));
    });
  }

  function chooseTemplate(index) {
    selected = filtered[index] || null;
    if (!selected) return;
    config.onSelect?.(selected);
    modal?.hide();
  }

  async function open(nextConfig = {}) {
    config = nextConfig;
    ensureModal();
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
    const search = document.getElementById("enemyTemplateSearch");
    search.value = "";
    state.search = "";
    state.sortKey = "name";
    state.sortDir = "asc";
    document.getElementById("enemyTemplateRows").innerHTML = `<tr><td colspan="3" class="text-secondary">Loading templates...</td></tr>`;
    modal.show();
    try {
      await loadMonsters();
      render();
      setTimeout(() => search.focus(), 150);
    } catch (error) {
      console.warn(error);
      document.getElementById("enemyTemplateRows").innerHTML = `<tr><td colspan="3" class="text-danger">${escapeHtml(error.message || "Could not load templates.")}</td></tr>`;
    }
  }

  document.addEventListener("input", event => {
    if (event.target?.id !== "enemyTemplateSearch") return;
    state.search = event.target.value;
    render();
  });

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-template-sort]");
    if (!button) return;
    const key = button.dataset.templateSort;
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir = "asc";
    }
    render();
  });

  window.PFEnemyTemplatePicker = { open };
})();
