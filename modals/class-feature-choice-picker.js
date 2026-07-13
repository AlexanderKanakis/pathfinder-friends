(function () {
  const MODAL_ID = "classFeatureChoicePickerModal";
  let modal = null;
  let state = null;
  let resolver = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function ensureStyle() {
    if (document.getElementById("classFeatureChoicePickerStyles")) return;
    const style = document.createElement("style");
    style.id = "classFeatureChoicePickerStyles";
    style.textContent = `
      .class-choice-picker-card.is-selected {
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, .25);
      }
      .class-choice-picker-card.is-unmet {
        opacity: .5;
      }
      .class-choice-picker-card.is-unmet:hover,
      .class-choice-picker-card.is-unmet:focus {
        opacity: .85;
      }
      .class-choice-picker-badge {
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
      .class-choice-picker-warning {
        color: #ffc107;
        font-size: 12px;
        margin-top: 6px;
      }
      .class-choice-picker-description {
        color: #ddd;
        font-size: 13px;
        line-height: 1.35;
        margin-top: 8px;
        white-space: pre-wrap;
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
                <h5 class="modal-title" id="${MODAL_ID}Label">Choose Feature</h5>
                <div id="classFeatureChoicePickerCount" class="small text-secondary"></div>
              </div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div id="classFeatureChoicePickerDescription" class="small-text mb-2"></div>
              <div id="classFeatureChoicePickerPoolWarnings" class="class-choice-picker-warning mb-2"></div>
              <input id="classFeatureChoicePickerSearch" class="form-control form-control-sm mb-3" placeholder="Search choices">
              <div id="classFeatureChoicePickerResults" class="source-results-panel search-modal-results"></div>
            </div>
            <div class="modal-footer">
              <button id="classFeatureChoicePickerSelect" type="button" class="btn btn-info btn-sm" disabled>
                <i class="bi bi-check2"></i> Select
              </button>
              <button id="classFeatureChoicePickerClear" type="button" class="btn btn-outline-warning btn-sm">Clear Choice</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `);

    document.getElementById("classFeatureChoicePickerSearch").addEventListener("input", event => {
      state.search = event.target.value.trim().toLowerCase();
      renderResults();
    });
    document.getElementById("classFeatureChoicePickerSelect").addEventListener("click", () => {
      if (!state.expanded) return;
      resolveChoice(state.expanded);
    });
    document.getElementById("classFeatureChoicePickerClear").addEventListener("click", () => resolveChoice(""));
    document.getElementById(MODAL_ID).addEventListener("hidden.bs.modal", () => {
      if (resolver) {
        resolver(null);
        resolver = null;
      }
    });
  }

  function searchableOption(option) {
    return [
      option.name || "",
      option.description || "",
      option.source || "",
      option.publisher || "",
      ...(option.warnings || [])
    ].join(" ").toLowerCase();
  }

  function renderResults() {
    if (!state) return;
    const wrapper = document.getElementById("classFeatureChoicePickerResults");
    const count = document.getElementById("classFeatureChoicePickerCount");
    const term = state.search || "";
    const results = state.options
      .filter(option => !term || searchableOption(option).includes(term))
      .sort((a, b) => {
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();
        const rankA = term && aName.includes(term) ? 0 : 1;
        const rankB = term && bName.includes(term) ? 0 : 1;
        return rankA - rankB || aName.localeCompare(bName);
      });

    count.textContent = `${results.length} choice${results.length === 1 ? "" : "s"}`;
    if (!results.length) {
      wrapper.innerHTML = `<div class="small text-secondary">No matching choices found.</div>`;
      updateSelectButton();
      return;
    }

    wrapper.innerHTML = `
      <div class="source-results-grid">
        ${results.map((option, index) => {
          const unmet = Boolean(option.unmet);
          const selected = String(option.name || "") === state.selected;
          const expanded = String(option.name || "") === state.expanded;
          return `
            <article class="source-result-card class-choice-picker-card${unmet ? " is-unmet" : ""}${selected ? " is-selected" : ""}" role="button" tabindex="0" data-choice-expand="${index}">
              <span class="class-choice-picker-badge"><i class="bi ${selected ? "bi-check2" : unmet ? "bi-exclamation-triangle" : expanded ? "bi-chevron-up" : "bi-stars"}"></i></span>
              <div class="fw-semibold pe-2">${escapeHtml(option.name || "Unnamed choice")}</div>
              ${unmet ? `<div class="class-choice-picker-warning"><i class="bi bi-exclamation-triangle"></i> ${escapeHtml(option.warnings.join("; "))}</div>` : ""}
              ${expanded ? `
                <div class="class-choice-picker-description">${escapeHtml(option.description || option.summary || "No description available.")}</div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    `;
    updateSelectButton();
    wrapper.querySelectorAll("[data-choice-expand]").forEach(card => {
      card.addEventListener("click", () => {
        const option = results[Number(card.dataset.choiceExpand)];
        state.expanded = state.expanded === option?.name ? "" : option?.name || "";
        renderResults();
      });
      card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const option = results[Number(card.dataset.choiceExpand)];
        state.expanded = state.expanded === option?.name ? "" : option?.name || "";
        renderResults();
      });
    });
  }

  function updateSelectButton() {
    const button = document.getElementById("classFeatureChoicePickerSelect");
    if (!button) return;
    button.disabled = !state?.expanded;
  }

  function resolveChoice(value) {
    const next = resolver;
    resolver = null;
    modal?.hide();
    next?.(value);
  }

  window.PFClassFeatureChoicePicker = {
    open(config = {}) {
      ensureModal();
      state = {
        title: config.title || "Choose Feature",
        poolName: config.poolName || config.title || "Class Feature",
        description: config.description || "",
        poolWarnings: Array.isArray(config.poolWarnings) ? config.poolWarnings : [],
        options: Array.isArray(config.options) ? config.options : [],
        selected: config.selected || "",
        search: "",
        expanded: config.initialChoiceName || config.selected || ""
      };

      document.getElementById(`${MODAL_ID}Label`).textContent = state.title;
      document.getElementById("classFeatureChoicePickerDescription").textContent = state.description;
      document.getElementById("classFeatureChoicePickerPoolWarnings").innerHTML = state.poolWarnings.length
        ? `<i class="bi bi-exclamation-triangle"></i> ${escapeHtml(state.poolWarnings.join("; "))}`
        : "";
      document.getElementById("classFeatureChoicePickerSearch").value = "";
      renderResults();
      modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
      modal.show();
      setTimeout(() => document.getElementById("classFeatureChoicePickerSearch")?.focus(), 150);

      return new Promise(resolve => {
        resolver = resolve;
      });
    }
  };
})();
