(function () {
  const MODAL_ID = "racialTraitsModal";
  let modal = null;
  let state = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function traitKey(value = "") {
    return (
      String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^(?:and|or|the)\s+/i, "")
        .replace(/[^a-z0-9]+/g, "") || ""
    );
  }

  function traitNameKey(trait = {}) {
    return traitKey(trait.name || trait.trait || "");
  }

  function relationKeys(values = []) {
    return new Set(
      (Array.isArray(values) ? values : []).map(traitKey).filter(Boolean),
    );
  }

  function selectedTraits() {
    const selected = new Set((state.selected || []).map(traitKey));
    return (state.race.alternateTraits || []).filter((trait) =>
      selected.has(traitNameKey(trait)),
    );
  }

  function replacedStandardMap() {
    const map = new Map();
    selectedTraits().forEach((trait) => {
      relationKeys(trait.replaces).forEach((key) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(trait.name || "Alternate Trait");
      });
    });
    return map;
  }

  function selectedNameSet() {
    return new Set((state.selected || []).map(traitKey));
  }

  function searchableTrait(trait = {}) {
    return [
      trait.name || "",
      trait.category || "",
      trait.description || "",
      ...(trait.replaces || []),
      ...(trait.modifies || []),
    ]
      .join(" ")
      .toLowerCase();
  }

  function metaPills(trait = {}, replacedBy = []) {
    const pills = [];
    if (replacedBy.length) {
      pills.push(
        `<span class="racial-trait-pill is-replaces"><i class="bi bi-arrow-repeat"></i> Replaced by ${escapeHtml(replacedBy.join(", "))}</span>`,
      );
    }
    if ((trait.replaces || []).length) {
      pills.push(
        `<span class="racial-trait-pill is-replaces"><i class="bi bi-x-circle"></i> Replaces ${escapeHtml(trait.replaces.join(", "))}</span>`,
      );
    }
    if ((trait.modifies || []).length) {
      pills.push(
        `<span class="racial-trait-pill is-modifies"><i class="bi bi-pencil-square"></i> Modifies ${escapeHtml(trait.modifies.join(", "))}</span>`,
      );
    }
    return pills.length
      ? `<div class="racial-trait-meta">${pills.join("")}</div>`
      : "";
  }

  function descriptionAccordion(trait = {}) {
    return `
      <details class="racial-trait-details">
        <summary>Description</summary>
        <div class="racial-trait-description">${escapeHtml(trait.description || "No description available.")}</div>
      </details>
    `;
  }

  function selectedAlternateCard(trait = {}) {
    return `
      <article class="racial-trait-card is-selected">
        <div class="racial-trait-topline">
          <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
          <button
            class="btn btn-outline-warning btn-sm"
            type="button"
            data-racial-trait-toggle="${traitNameKey(trait)}"
          >
            <i class="bi bi-trash"></i>
            Remove
          </button>
        </div>
        ${metaPills(trait)}
        ${descriptionAccordion(trait)}
      </article>
    `;
  }

  function standardTraitCard(trait = {}, replacedBy = []) {
    return `
      <article class="racial-trait-card${replacedBy.length ? " is-replaced" : ""}">
        <div class="racial-trait-topline">
          <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
          <span class="badge ${replacedBy.length ? "text-bg-warning" : "text-bg-success"}">
            ${replacedBy.length ? "Replaced" : "Active"}
          </span>
        </div>
        ${metaPills(trait, replacedBy)}
        ${descriptionAccordion(trait)}
      </article>
    `;
  }

  function traitGroup(title, cards) {
    if (!cards.length) return "";
    return `
      <div class="racial-trait-group">
        <div class="racial-trait-group-title">${escapeHtml(title)}</div>
        ${cards.join("")}
      </div>
    `;
  }

  function renderStandardTraits() {
    const replaced = replacedStandardMap();
    const traits = state.race.standardTraits || [];
    if (!traits.length)
      return `<div class="racial-trait-empty">No standard racial traits listed.</div>`;
    const activeCards = [];
    const replacedCards = [];
    traits.forEach((trait) => {
      const replacedBy = replaced.get(traitNameKey(trait)) || [];
      if (replacedBy.length) {
        replacedCards.push(standardTraitCard(trait, replacedBy));
      } else {
        activeCards.push(standardTraitCard(trait));
      }
    });
    const selectedAlternateCards = selectedTraits().map(selectedAlternateCard);
    return `
      <div class="racial-trait-list">
        ${traitGroup("Active Standard Traits", activeCards)}
        ${traitGroup("Selected Alternate Traits", selectedAlternateCards)}
        ${traitGroup("Replaced Standard Traits", replacedCards)}
      </div>
    `;
  }

  function filteredAlternateTraits() {
    const term = state.search.trim().toLowerCase();
    const selected = selectedNameSet();
    return (state.race.alternateTraits || [])
      .filter((trait) => !selected.has(traitNameKey(trait)))
      .filter((trait) => !term || searchableTrait(trait).includes(term))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }

  function renderAlternateTraits() {
    const traits = filteredAlternateTraits();
    if (!traits.length)
      return `<div class="racial-trait-empty">No alternate racial traits found.</div>`;
    return `
      <div class="racial-trait-list">
        ${traits
          .map((trait) => {
            const modifies = (trait.modifies || []).length;
            return `
              <article class="racial-trait-card${modifies ? " is-modifier" : ""}">
                <div class="racial-trait-topline">
                  <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
                  <button
                    class="btn btn-outline-info btn-sm"
                    type="button"
                    data-racial-trait-toggle="${traitNameKey(trait)}"
                  >
                    <i class="bi bi-check2"></i>
                    Apply
                  </button>
                </div>
                ${metaPills(trait)}
                ${descriptionAccordion(trait)}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function render() {
    if (!state) return;
    const selectedCount = selectedTraits().length;
    document.getElementById("racialTraitsRaceName").textContent =
      state.race.name || "Race";
    document.getElementById("racialTraitsSelectedCount").textContent =
      selectedCount
        ? `${selectedCount} alternate${selectedCount === 1 ? "" : "s"} applied`
        : "No alternates applied";
    document.getElementById("racialTraitsStandard").innerHTML =
      renderStandardTraits();
    document.getElementById("racialTraitsAlternate").innerHTML =
      renderAlternateTraits();
    document
      .querySelectorAll("[data-racial-trait-toggle]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const key = button.dataset.racialTraitToggle;
          const trait = (state.race.alternateTraits || []).find(
            (candidate) => traitNameKey(candidate) === key,
          );
          toggleAlternateTrait(trait);
        });
      });
  }

  async function toggleAlternateTrait(trait) {
    if (!trait) return;
    const key = traitNameKey(trait);
    const selected = selectedNameSet();
    if (selected.has(key)) {
      state.selected = state.selected.filter((name) => traitKey(name) !== key);
      state.onRemove?.(trait);
      state.onChange?.(state.selected.slice());
      render();
      return;
    }

    const incomingReplaces = relationKeys(trait.replaces);
    const canApply = state.onBeforeApply
      ? await state.onBeforeApply(trait)
      : true;
    if (!canApply) return;

    state.selected = state.selected.filter((name) => {
      const existing = (state.race.alternateTraits || []).find(
        (candidate) => traitNameKey(candidate) === traitKey(name),
      );
      if (!existing) return false;
      if (traitNameKey(existing) === key) return false;
      const existingReplaces = relationKeys(existing.replaces);
      for (const replaceKey of incomingReplaces) {
        if (existingReplaces.has(replaceKey)) {
          state.onRemove?.(existing);
          return false;
        }
      }
      return true;
    });
    state.selected.push(trait.name || "");
    state.onChange?.(state.selected.slice());
    render();
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary racial-traits-modal">
              <div class="modal-header border-secondary">
                <h5 class="modal-title" id="${MODAL_ID}Label">Racial Traits</h5>
              </div>
              <div class="modal-body">
                <div class="racial-traits-summary">
                  <span id="racialTraitsRaceName"></span>
                  <span id="racialTraitsSelectedCount"></span>
                </div>
                <section class="racial-traits-section">
                  <h6 class="racial-traits-heading"><strong>Standard Racial Traits</strong></h6>
                  <div id="racialTraitsStandard"></div>
                </section>
                <section class="racial-traits-section">
                  <h6 class="racial-traits-heading"><strong>Alternate Racial Traits</strong></h6>
                  <input
                    id="racialTraitsSearch"
                    class="form-control form-control-sm racial-trait-search"
                    placeholder="Search alternate racial traits"
                  />
                  <div id="racialTraitsAlternate"></div>
                </section>
              </div>
              <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );
    document
      .getElementById("racialTraitsSearch")
      .addEventListener("input", (event) => {
        state.search = event.target.value;
        render();
      });
  }

  window.PFRacialTraitsModal = {
    open(config = {}) {
      ensureModal();
      state = {
        race: config.race || {},
        selected: Array.isArray(config.selectedAlternateTraits)
          ? config.selectedAlternateTraits.slice()
          : [],
        search: "",
        onChange:
          typeof config.onChange === "function" ? config.onChange : null,
        onBeforeApply:
          typeof config.onBeforeApply === "function"
            ? config.onBeforeApply
            : null,
        onRemove:
          typeof config.onRemove === "function" ? config.onRemove : null,
      };
      document.getElementById("racialTraitsSearch").value = "";
      render();
      modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById(MODAL_ID),
      );
      modal.show();
    },
  };
})();