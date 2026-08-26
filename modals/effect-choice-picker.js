// Small "pick one" modal used whenever an effect's stat/target was left as
// a choice pool (see scripts/effect-stat-options.js) and now needs an
// actual pick -- e.g. activating Rage bundles in Ancestor Totem, Lesser,
// which needs the player to say which skill it applies to.
(function () {
  const MODAL_ID = "effectChoicePickerModal";
  let modal = null;
  let resolver = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="${MODAL_ID}Title">Choose a Target</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <input id="${MODAL_ID}Search" class="form-control form-control-sm mb-2" placeholder="Search...">
              <div id="${MODAL_ID}List" class="list-group" style="max-height: min(50vh, 420px); overflow: auto;"></div>
              <div id="${MODAL_ID}Empty" class="small-text mt-2 d-none">No options found.</div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(`${MODAL_ID}Search`)
      .addEventListener("input", renderList);
    document.getElementById(MODAL_ID).addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  let currentOptions = [];

  function renderList() {
    const term =
      document
        .getElementById(`${MODAL_ID}Search`)
        ?.value.trim()
        .toLowerCase() || "";
    const list = document.getElementById(`${MODAL_ID}List`);
    const matches = currentOptions.filter(
      (option) => !term || option.label.toLowerCase().includes(term),
    );
    document
      .getElementById(`${MODAL_ID}Empty`)
      .classList.toggle("d-none", matches.length > 0);
    list.innerHTML = matches
      .map(
        (option) => `
      <button type="button" class="list-group-item list-group-item-action bg-dark text-white border-secondary" data-choice-value="${escapeHtml(option.value)}">
        ${escapeHtml(option.label)}
      </button>
    `,
      )
      .join("");
    list.querySelectorAll("[data-choice-value]").forEach((button) => {
      button.addEventListener("click", () => {
        resolver?.(button.dataset.choiceValue);
        resolver = null;
        modal.hide();
      });
    });
  }

  // options: [{ value, label }]. Resolves to the chosen value, or null if
  // cancelled/closed without a pick.
  function open({ title = "Choose a Target", options = [] } = {}) {
    ensureModal();
    document.getElementById(`${MODAL_ID}Title`).textContent = title;
    document.getElementById(`${MODAL_ID}Search`).value = "";
    currentOptions = Array.isArray(options) ? options : [];
    renderList();
    modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
    modal.show();
    setTimeout(
      () => document.getElementById(`${MODAL_ID}Search`).focus(),
      150,
    );
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  window.PFEffectChoicePicker = { open };
})();
