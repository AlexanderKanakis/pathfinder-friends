(function () {
  const MODAL_ID = "magicSearchModal";
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

  function spellClasses(spell) {
    const levels = String(spell.details?.level || "");
    return [
      ...levels.matchAll(/(?:^|,\s*)([a-zA-Z][a-zA-Z ()/-]*?)\s+(\d+)\b/g),
    ]
      .map((match) => ({ className: match[1].trim(), level: Number(match[2]) }))
      .filter((entry) => entry.className);
  }

  function spellSchool(spell) {
    return String(spell.details?.school || "")
      .split(/[,(]/)[0]
      .trim();
  }

  function searchableSpell(spell) {
    return [
      spell.name,
      spell.details?.school,
      spell.details?.level,
      spell.details?.description,
    ]
      .join(" ")
      .toLowerCase();
  }
  function spellMatches() {
    return true;
  }
  function spellDetailsHtml(spell) {
    const details = spell.details || {};
    const effectRows = [
      spellDetail("Range", details.range),
      spellDetail("Target", details.target),
      spellDetail("Area", details.area),
      spellDetail("Duration", details.duration),
      spellDetailPair(
        "Saving Throw",
        details.saving_throw,
        "Spell Resistance",
        details.spell_resistance,
      ),
    ]
      .filter(Boolean)
      .join("");
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
        <div class="spell-picker-description">
          ${escapeHtml(stripHtml(details.description || "No description available."))}
        </div>
      </div>
    `;
  }

  function spellInlineDetail(label, value) {
    return value
      ? `<strong>${escapeHtml(label)}</strong> ${escapeHtml(value)} `
      : "";
  }

  function spellDetail(label, value) {
    return value
      ? `<div class="spell-picker-detail-line"><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</div>`
      : "";
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

  function renderResults() {
    const wrapper = document.getElementById("magicSearchResults");
    const term = state.search;
    const results = state.spells
      .filter(spellMatches)
      .filter((spell) => !term || searchableSpell(spell).includes(term))
      .sort((a, b) => {
        const nameA = String(a.name || "").toLowerCase();
        const nameB = String(b.name || "").toLowerCase();
        const rankA = term && nameA.includes(term) ? 0 : 1;
        const rankB = term && nameB.includes(term) ? 0 : 1;
        return rankA - rankB || nameA.localeCompare(nameB);
      })
      .slice(0, 150);

    if (!results.length) {
      wrapper.innerHTML = `<div class="small text-secondary">No matching spells found.</div>`;
      updateSelectButton();
      return;
    }

    wrapper.innerHTML = `
      <div class="source-results-grid">
        ${results
          .map((spell, index) => {
            const expanded = state.expanded === spell.name;
            return `
              <article class="source-result-card spell-picker-card${expanded ? " is-focused" : ""}" role="button" tabindex="0" data-magic-search-spell="${index}" data-spell-name="${escapeHtml(spell.name || "")}">
                <span class="spell-picker-badge"><i class="bi ${expanded ? "bi-chevron-up" : "bi-magic"}"></i></span>
                <div class="fw-semibold pe-2">${escapeHtml(spell.name || "Spell")}</div>
                ${expanded ? spellDetailsHtml(spell) : ""}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
    updateSelectButton();

    if (state.scrollToExpanded && state.expanded) {
      const focused = [...wrapper.querySelectorAll("[data-spell-name]")].find(
        (card) => card.getAttribute("data-spell-name") === state.expanded,
      );
      focused?.scrollIntoView({ block: "start" });
      state.scrollToExpanded = false;
    }

    wrapper.querySelectorAll("[data-magic-search-spell]").forEach((card) => {
      const toggle = () => {
        const spell = results[Number(card.dataset.magicSearchSpell)];
        state.expanded =
          state.expanded === spell?.name ? "" : spell?.name || "";
        state.scrollToExpanded = Boolean(state.expanded);
        renderResults();
      };
      card.addEventListener("click", toggle);
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle();
      });
    });
  }

  function updateSelectButton() {
    const button = document.getElementById("magicSearchSelect");
    if (!button) return;
    button.disabled = !state?.expanded;
  }
  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary magic-search-modal">
              <div class="modal-header border-secondary">
                <h5 class="modal-title" id="${MODAL_ID}Label">Magic Search</h5>
              </div>
              <div class="modal-body">
                <input id="magicSearchInput" class="form-control form-control-sm mb-2" placeholder="Search spell name or description">
                <div id="magicSearchResults" class="source-results-panel search-modal-results magic-search-results"></div>
              </div>
              <div class="modal-footer border-secondary">
                <button id="magicSearchSelect" type="button" class="btn btn-info btn-sm" disabled>
                  <i class="bi bi-check2"></i> Select
                </button>
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );

    document
      .getElementById("magicSearchInput")
      .addEventListener("input", (event) => {
        state.search = event.target.value.trim().toLowerCase();
        state.expanded = "";
        renderResults();
      });
    document.getElementById("magicSearchSelect").addEventListener("click", () => {
      if (!state.expanded) return;
      const spell = state.spells.find((option) => option.name === state.expanded);
      if (spell) resolveSpell(spell);
    });
    document.getElementById(MODAL_ID).addEventListener("hidden.bs.modal", () => {
      if (!resolver) return;
      resolver(null);
      resolver = null;
    });
  }

  function resolveSpell(spell) {
    const next = resolver;
    resolver = null;
    modal?.hide();
    next?.(spell || null);
  }

  window.PFMagicSearchModal = {
    async open(config = {}) {
      ensureModal();
      const spells = await loadSpells();
      state = {
        spells,
        search: "",
        expanded: "",
        scrollToExpanded: false,
      };
      document.getElementById(`${MODAL_ID}Label`).textContent =
        config.title || "Choose Spell";
      document.getElementById("magicSearchInput").value = "";
      renderResults();
      modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
      modal.show();
      setTimeout(() => document.getElementById("magicSearchInput")?.focus(), 150);
      return new Promise((resolve) => {
        resolver = resolve;
      });
    },
  };
})();

