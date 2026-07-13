(function () {
  const MODAL_ID = "spellPickerModal";
  let modal = null;
  let resolver = null;
  let state = null;
  let spellCache = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function stripHtml(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "").replace(/<\/h3>/g, "");
    return div.textContent.replace(/\s+/g, " ").trim();
  }

  function ensureStyle() {
    if (document.getElementById("spellPickerStyles")) return;
    const style = document.createElement("style");
    style.id = "spellPickerStyles";
    style.textContent = `
      .spell-picker-card.is-selected {
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, .25);
      }
      .spell-picker-card.is-focused {
        border-color: #f0d58c;
        box-shadow: 0 0 0 2px rgba(240, 213, 140, .25);
      }
      .spell-picker-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #151515;
        border: 1px solid #555;
        color: #8fd19e;
      }
      .spell-picker-description {
        color: #ddd;
        font-size: 13px;
        line-height: 1.35;
        white-space: pre-wrap;
      }
      .spell-picker-filters {
        display: grid;
        grid-template-columns: minmax(140px, 1fr) minmax(86px, 120px) minmax(140px, 1fr);
        gap: 8px;
        margin-bottom: 8px;
      }
      .spell-picker-detail-stack {
        margin-top: 8px;
        display: grid;
        gap: 6px;
        color: #eee;
        font-size: 13px;
        line-height: 1.35;
      }
      .spell-picker-summary-line strong,
      .spell-picker-detail-line strong {
        color: #fff;
      }
      .spell-picker-rule-heading {
        border-top: 1px solid #666;
        border-bottom: 1px solid #666;
        color: #b8b8b8;
        font-size: 10px;
        line-height: 1.2;
        text-transform: uppercase;
        margin-top: 2px;
        padding: 1px 0;
      }
      .spell-picker-rule-block {
        display: grid;
        gap: 2px;
      }
      @media (max-width: 760px) {
        .spell-picker-filters { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyle();
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable search-modal-dialog">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <div>
                <h5 class="modal-title" id="${MODAL_ID}Label">Choose Spell</h5>
                <div id="spellPickerCount" class="small text-secondary"></div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="spell-picker-filters">
                <div>
                  <label for="spellPickerClass">Class</label>
                  <select id="spellPickerClass" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="spellPickerLevel">Level</label>
                  <select id="spellPickerLevel" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="spellPickerSchool">School</label>
                  <select id="spellPickerSchool" class="form-select form-select-sm"></select>
                </div>
              </div>
              <input id="spellPickerSearch" class="form-control form-control-sm mb-3" placeholder="Search spells">
              <div id="spellPickerResults" class="source-results-panel search-modal-results"></div>
            </div>
            <div class="modal-footer">
              <button id="spellPickerSelect" type="button" class="btn btn-info btn-sm" disabled>
                <i class="bi bi-check2"></i> Select
              </button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `);
    document.getElementById("spellPickerSearch").addEventListener("input", event => {
      state.search = event.target.value.trim().toLowerCase();
      renderResults();
    });
    document.getElementById("spellPickerClass").addEventListener("change", event => {
      state.className = event.target.value;
      renderResults();
    });
    document.getElementById("spellPickerLevel").addEventListener("change", event => {
      state.spellLevel = Number(event.target.value || 0);
      renderResults();
    });
    document.getElementById("spellPickerSchool").addEventListener("change", event => {
      state.school = event.target.value;
      renderResults();
    });
    document.getElementById("spellPickerSelect").addEventListener("click", () => {
      if (!state.expanded) return;
      const spell = state.spells.find(option => option.name === state.expanded);
      if (!spell) return;
      if (state.selected.includes(spell.name) && !state.allowDuplicates) return;
      resolveSpell(spell);
    });
    document.getElementById(MODAL_ID).addEventListener("hidden.bs.modal", () => {
      if (resolver) {
        resolver(null);
        resolver = null;
      }
    });
  }

  async function loadSpells() {
    if (spellCache) return spellCache;
    const response = await fetch("./data/spells.js", { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load data/spells.js.");
    const text = await response.text();
    const match = text.match(/const\s+items\s*=\s*(\[[\s\S]*?\]);?\s*$/);
    if (!match) throw new Error("Could not parse data/spells.js.");
    spellCache = Function(`"use strict"; return (${match[1]});`)();
    return spellCache;
  }

  function classAliases(className) {
    const key = String(className || "").toLowerCase();
    const aliases = new Set([key]);
    if (key === "wizard") aliases.add("arcanist");
    if (key === "arcanist") aliases.add("wizard");
    if (key === "summoner (unchained)") aliases.add("summoner (unchained)");
    return aliases;
  }

  function spellClassLevel(spell, className) {
    const levels = String(spell.details?.level || "").toLowerCase();
    for (const alias of classAliases(className)) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = levels.match(new RegExp(`(?:^|,\\s*)${escaped}\\s+(\\d+)\\b`, "i"));
      if (match) return Number(match[1]);
    }
    return null;
  }

  function spellClasses(spell) {
    const levels = String(spell.details?.level || "");
    return [...levels.matchAll(/(?:^|,\s*)([a-zA-Z][a-zA-Z ()/-]*?)\s+(\d+)\b/g)]
      .map(match => ({ className: match[1].trim(), level: Number(match[2]) }))
      .filter(entry => entry.className);
  }

  function spellSchool(spell) {
    return String(spell.details?.school || "").split(/[,(]/)[0].trim();
  }

  function spellMatches(spell) {
    const spellLevel = spellClassLevel(spell, state.className);
    if (spellLevel !== Number(state.spellLevel)) return false;
    if (state.school && spellSchool(spell).toLowerCase() !== state.school.toLowerCase()) return false;
    if (Array.isArray(state.allowedNames) && state.allowedNames.length) {
      return state.allowedNames.some(name => String(name).toLowerCase() === String(spell.name || "").toLowerCase());
    }
    if (Array.isArray(state.allowedNames) && !state.allowedNames.length) return false;
    return true;
  }

  function searchableSpell(spell) {
    return [
      spell.name,
      spell.details?.school,
      spell.details?.level,
      spell.details?.description
    ].join(" ").toLowerCase();
  }

  function renderResults() {
    const wrapper = document.getElementById("spellPickerResults");
    const count = document.getElementById("spellPickerCount");
    const term = state.search || "";
    const results = state.spells
      .filter(spellMatches)
      .filter(spell => !term || searchableSpell(spell).includes(term))
      .sort((a, b) => {
        const rankA = term && String(a.name || "").toLowerCase().includes(term) ? 0 : 1;
        const rankB = term && String(b.name || "").toLowerCase().includes(term) ? 0 : 1;
        return rankA - rankB || String(a.name || "").localeCompare(String(b.name || ""));
      });

    count.textContent = `${results.length} spell${results.length === 1 ? "" : "s"}`;
    if (!results.length) {
      wrapper.innerHTML = `<div class="small text-secondary">${escapeHtml(state.emptyMessage || "No matching spells found.")}</div>`;
      updateSelectButton();
      return;
    }

    wrapper.innerHTML = `
      <div class="source-results-grid">
        ${results.map((spell, index) => {
          const selected = state.selected.includes(spell.name);
          const expanded = state.expanded === spell.name;
          return `
            <article class="source-result-card spell-picker-card${selected ? " is-selected" : ""}${expanded ? " is-focused" : ""}" role="button" tabindex="0" data-spell-expand="${index}" data-spell-name="${escapeHtml(spell.name)}">
              <span class="spell-picker-badge"><i class="bi ${selected ? "bi-check2" : expanded ? "bi-chevron-up" : "bi-magic"}"></i></span>
              <div class="fw-semibold pe-2">${escapeHtml(spell.name)}</div>
              ${expanded ? `
                ${spellDetailsHtml(spell)}
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    `;
    updateSelectButton();

    if (state.scrollToExpanded && state.expanded) {
      const focused = [...wrapper.querySelectorAll("[data-spell-name]")]
        .find(card => card.getAttribute("data-spell-name") === state.expanded);
      focused?.scrollIntoView({ block: "nearest" });
      state.scrollToExpanded = false;
    }

    wrapper.querySelectorAll("[data-spell-expand]").forEach(card => {
      card.addEventListener("click", () => {
        const spell = results[Number(card.dataset.spellExpand)];
        state.expanded = state.expanded === spell?.name ? "" : spell?.name || "";
        renderResults();
      });
      card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const spell = results[Number(card.dataset.spellExpand)];
        state.expanded = state.expanded === spell?.name ? "" : spell?.name || "";
        renderResults();
      });
    });
  }

  function updateSelectButton() {
    const button = document.getElementById("spellPickerSelect");
    if (!button) return;
    const alreadySelected = state?.expanded && state.selected.includes(state.expanded) && !state.allowDuplicates;
    button.disabled = !state?.expanded || alreadySelected;
    button.innerHTML = alreadySelected
      ? `<i class="bi bi-check2"></i> Added`
      : `<i class="bi bi-check2"></i> Select`;
  }

  function spellDetailsHtml(spell) {
    const details = spell.details || {};
    const effectRows = [
      spellDetail("Range", details.range),
      spellDetail("Target", details.target),
      spellDetail("Area", details.area),
      spellDetail("Duration", details.duration),
      spellDetailPair("Saving Throw", details.saving_throw, "Spell Resistance", details.spell_resistance)
    ].filter(Boolean).join("");
    return `
      <div class="spell-picker-detail-stack">
        <div class="spell-picker-summary-line">
          ${spellInlineDetail("School", details.school)}
          ${spellInlineDetail("Level", details.level)}
        </div>
        <div class="spell-picker-rule-heading">Casting</div>
        <div class="spell-picker-rule-block">
          ${spellDetail("Casting Time", details.casting_time)}
          ${spellDetail("Components", details.components)}
        </div>
        <div class="spell-picker-rule-heading">Effect</div>
        <div class="spell-picker-rule-block">
          ${effectRows || `<div class="spell-picker-detail-line text-secondary">No effect details listed.</div>`}
        </div>
        <div class="spell-picker-rule-heading">Description</div>
        <div class="spell-picker-description">${escapeHtml(stripHtml(details.description || "No description available."))}</div>
      </div>
    `;
  }

  function spellInlineDetail(label, value) {
    return value ? `<strong>${escapeHtml(label)}</strong> ${escapeHtml(value)} ` : "";
  }

  function spellDetail(label, value) {
    return value ? `<div class="spell-picker-detail-line"><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</div>` : "";
  }

  function spellDetailPair(firstLabel, firstValue, secondLabel, secondValue) {
    if (!firstValue && !secondValue) return "";
    return `
      <div class="spell-picker-detail-line">
        ${firstValue ? `<strong>${escapeHtml(firstLabel)}</strong> ${escapeHtml(firstValue)}` : ""}
        ${firstValue && secondValue ? "; " : ""}
        ${secondValue ? `<strong>${escapeHtml(secondLabel)}</strong> ${escapeHtml(secondValue)}` : ""}
      </div>
    `;
  }

  function resolveSpell(spell) {
    const next = resolver;
    resolver = null;
    modal?.hide();
    next?.(spell);
  }

  window.PFSpellPicker = {
    async open(config = {}) {
      ensureModal();
      const spells = await loadSpells();
      state = {
        title: config.title || "Choose Spell",
        className: config.className || "",
        spellLevel: Number(config.spellLevel || 0),
        selected: Array.isArray(config.selected) ? config.selected : [],
        allowedNames: Array.isArray(config.allowedNames) ? config.allowedNames : null,
        allowDuplicates: Boolean(config.allowDuplicates),
        emptyMessage: config.emptyMessage || "",
        spells,
        search: "",
        school: config.school || "",
        expanded: config.initialSpellName || "",
        scrollToExpanded: Boolean(config.initialSpellName)
      };
      document.getElementById(`${MODAL_ID}Label`).textContent = state.title;
      document.getElementById("spellPickerSearch").value = "";
      renderFilterOptions();
      renderResults();
      modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
      modal.show();
      setTimeout(() => document.getElementById("spellPickerSearch")?.focus(), 150);
      return new Promise(resolve => { resolver = resolve; });
    }
  };

  function renderFilterOptions() {
    const classSelect = document.getElementById("spellPickerClass");
    const levelSelect = document.getElementById("spellPickerLevel");
    const schoolSelect = document.getElementById("spellPickerSchool");
    const classes = [...new Set(state.spells.flatMap(spell => spellClasses(spell).map(entry => entry.className)))]
      .sort((a, b) => a.localeCompare(b));
    const schools = [...new Set(state.spells.map(spellSchool).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    if (!classes.some(name => name.toLowerCase() === state.className.toLowerCase())) {
      state.className = classes[0] || state.className;
    } else {
      state.className = classes.find(name => name.toLowerCase() === state.className.toLowerCase()) || state.className;
    }
    classSelect.innerHTML = classes.map(name => `<option value="${escapeHtml(name)}" ${name === state.className ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
    levelSelect.innerHTML = Array.from({ length: 10 }, (_, level) => `<option value="${level}" ${level === Number(state.spellLevel) ? "selected" : ""}>${level}</option>`).join("");
    schoolSelect.innerHTML = `<option value="">All schools</option>${schools.map(school => `<option value="${escapeHtml(school)}" ${school === state.school ? "selected" : ""}>${escapeHtml(school)}</option>`).join("")}`;
  }
})();
