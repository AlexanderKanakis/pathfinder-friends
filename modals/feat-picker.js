(function () {
  let modalElement = null;
  let modalInstance = null;
  let resolver = null;
  const state = {
    feats: [],
    categories: [],
    selectedId: "",
    selectedIds: [],
    query: "",
    category: "General",
    expandedId: "",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value = "") {
    return (
      String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "feat"
    );
  }

  function featId(feat = {}) {
    return feat.id || feat.slug || feat.name || "";
  }

  function featTypes(feat = {}) {
    if (Array.isArray(feat.types) && feat.types.length) return feat.types;
    return [feat.type || "General"];
  }

  function featDescription(feat = {}) {
    return [

      feat.description,
      feat.benefit ? `Benefit: ${feat.benefit}` : "",
      feat.normal ? `Normal: ${feat.normal}` : "",
      feat.special ? `Special: ${feat.special}` : "",
      feat.goal ? `Goal: ${feat.goal}` : "",
      feat.completionBenefit
        ? `Completion Benefit: ${feat.completionBenefit}`
        : "",
      feat.note,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  function ensureModal() {
    if (modalElement) return modalElement;
    modalElement = document.createElement("div");
    modalElement.className = "modal fade";
    modalElement.id = "featPickerModal";
    modalElement.tabIndex = -1;
    modalElement.setAttribute("aria-hidden", "true");
    modalElement.innerHTML = `
      <style>
        #featPickerModal .feat-picker-filters {
          display: grid;
          grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        #featPickerModal .feat-picker-category {
          width: 100%;
        }
        #featPickerModal .feat-picker-card {
          min-height: 0;
          align-self: start;
          padding: 0.5rem 0.65rem;
          text-align: left;
        }
        #featPickerModal .feat-picker-card.is-selected {
          border-color: #0dcaf0;
          box-shadow: 0 0 0 1px rgba(13, 202, 240, 0.45);
        }
        #featPickerModal .feat-picker-card.is-unavailable {
          opacity: 0.55;
        }
        #featPickerModal .feat-picker-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        #featPickerModal .feat-picker-meta,
        #featPickerModal .feat-picker-warning {
          color: #8ea0ad;
          font-size: 0.8rem;
        }
        #featPickerModal .feat-picker-warning {
          color: #ffc107;
        }
        #featPickerModal .feat-picker-description {
          margin-top: 0.5rem;
          color: #dce4ea;
          font-size: 0.84rem;
          white-space: pre-wrap;
        }
        @media (max-width: 700px) {
          #featPickerModal .feat-picker-filters {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          #featPickerModal .feat-picker-category {
            grid-row: 1;
          }
          #featPickerModal #featPickerSearch {
            grid-row: 2;
          }
        }
      </style>
      <div class="modal-dialog modal-xl search-modal-dialog">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title" id="featPickerTitle">Choose Feat</h5>
          </div>
          <div class="modal-body">
            <div class="feat-picker-filters">
              <select id="featPickerCategory" class="form-select form-select-sm feat-picker-category" aria-label="Feat category"></select>
              <input id="featPickerSearch" class="form-control form-control-sm" placeholder="Search feats" aria-label="Search feats" />
            </div>
            <div id="featPickerResults" class="source-results-panel search-modal-results"></div>
          </div>
          <div class="modal-footer">
            <button id="featPickerClear" type="button" class="btn btn-outline-danger btn-sm">Clear Choice</button>
            <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button id="featPickerSelect" type="button" class="btn btn-info btn-sm">Select</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalElement);
    modalInstance = new bootstrap.Modal(modalElement);
    modalElement.addEventListener("hidden.bs.modal", () => {
      if (resolver) resolver(null);
      resolver = null;
    });
    modalElement
      .querySelector("#featPickerSearch")
      .addEventListener("input", (event) => {
        state.query = event.target.value || "";
        state.expandedId = "";
        renderResults();
      });
    modalElement
      .querySelector("#featPickerCategory")
      .addEventListener("change", (event) => {
        state.category = event.target.value || "General";
        state.expandedId = "";
        renderResults();
      });
    modalElement
      .querySelector("#featPickerClear")
      .addEventListener("click", () => finish(""));
    modalElement
      .querySelector("#featPickerSelect")
      .addEventListener("click", () => finish(state.selectedId || ""));
    return modalElement;
  }

  function categoryOptions() {
    const seen = new Set();
    const categories = state.categories
      .filter(Boolean)
      .filter((category) => category.toLowerCase() !== "all")
      .filter((category) => {
        const key = category.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const generalIndex = categories.findIndex(
      (category) => category.toLowerCase() === "general",
    );
    if (generalIndex >= 0) {
      const [general] = categories.splice(generalIndex, 1);
      categories.unshift(general);
    } else if (!categories.length) {
      categories.unshift("General");
    }
    return categories;
  }

  function renderCategories() {
    const select = modalElement.querySelector("#featPickerCategory");
    select.innerHTML = categoryOptions()
      .map(
        (category) =>
          `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
      )
      .join("");
    select.value = state.category;
  }

  function filteredFeats() {
    const query = state.query.trim().toLowerCase();
    const categoryKey = slugify(state.category);
    return state.feats.filter((feat) => {
      const types = featTypes(feat);
      if (!types.some((type) => slugify(type) === categoryKey)) {
        return false;
      }
      if (!query) return true;
      const searchable = [
        feat.name,

        feat.description,
        feat.benefit,
        feat.special,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }

  function unavailableReason(feat = {}) {
    const id = featId(feat);
    if (!id || feat.multiples || id === state.selectedId) return "";
    return state.selectedIds.includes(String(id)) ? "Already selected" : "";
  }

  function renderResults() {
    const root = modalElement.querySelector("#featPickerResults");
    const feats = filteredFeats();
    if (!feats.length) {
      root.innerHTML = `<div class="small-text">No feats found.</div>`;
      return;
    }
    root.innerHTML = `
      <div class="source-results-grid">
        ${feats
          .map((feat) => {
            const id = featId(feat);
            const selected = id && id === state.selectedId;
            const unavailable = unavailableReason(feat);
            const expanded = state.expandedId === id;
            const description = featDescription(feat);
            return `
              <button type="button" class="source-result-card feat-picker-card ${selected ? "is-selected" : ""} ${unavailable ? "is-unavailable" : ""}" data-feat-id="${escapeHtml(id)}">
                <span class="feat-picker-card-title">
                  <strong>${escapeHtml(feat.name || "Unnamed Feat")}</strong>

                </span>

                ${
                  unavailable
                    ? `<span class="feat-picker-warning">${escapeHtml(unavailable)}</span>`
                    : ""
                }
                ${
                  expanded && description
                    ? `<span class="feat-picker-description">${escapeHtml(description)}</span>`
                    : ""
                }
              </button>
            `;
          })
          .join("")}
      </div>
    `;
    root.querySelectorAll("[data-feat-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.featId || "";
        const feat = state.feats.find((item) => featId(item) === id);
        if (!feat || unavailableReason(feat)) return;
        state.selectedId = id;
        state.expandedId = state.expandedId === id ? "" : id;
        renderResults();
      });
    });
  }

  function finish(value) {
    const next = resolver;
    resolver = null;
    modalInstance.hide();
    if (next) next(value);
  }

  async function open(config = {}) {
    ensureModal();
    state.feats = Array.isArray(config.feats) ? config.feats : [];
    state.categories = Array.isArray(config.categories)
      ? config.categories
      : [];
    state.selectedId = String(config.selectedId || "");
    state.selectedIds = (Array.isArray(config.selectedIds)
      ? config.selectedIds
      : []
    ).map(String);
    state.query = "";
    const requestedCategory = String(config.initialCategory || "");
    const availableCategories = categoryOptions();
    state.category =
      availableCategories.find(
        (category) =>
          category.toLowerCase() === requestedCategory.toLowerCase(),
      ) || availableCategories[0] || "General";
    state.expandedId = state.selectedId;
    modalElement.querySelector("#featPickerTitle").textContent =
      config.title || "Choose Feat";
    modalElement.querySelector("#featPickerSearch").value = "";
    renderCategories();
    renderResults();
    return new Promise((resolve) => {
      resolver = resolve;
      modalInstance.show();
    });
  }

  window.PFFeatPicker = { open };
})();




