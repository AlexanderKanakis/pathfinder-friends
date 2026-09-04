(function () {
  const MODAL_ID = "mapHpEditorModal";

  function ensureModal() {
    let modalEl = document.getElementById(MODAL_ID);
    if (modalEl) return modalEl;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-label="Hit Points" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered map-hp-editor-dialog">
            <form class="modal-content bg-dark text-white border-secondary map-hp-editor-content" id="${MODAL_ID}Form">
              <div class="modal-body map-hp-editor-body">
                <div class="mini-sheet-card map-hp-editor-card">
                  <div class="mini-sheet-label">HP</div>
                  <div class="mini-sheet-value d-flex align-items-center justify-content-center gap-1">
                    <input id="${MODAL_ID}Input" class="form-control form-control-sm hp-number-input map-hp-editor-input" type="number" inputmode="numeric">
                    <span id="${MODAL_ID}Total"></span>
                  </div>
                </div>
              </div>
              <div class="modal-footer border-secondary map-hp-editor-footer">
                <button class="btn btn-outline-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-primary btn-sm" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      `,
    );
    return document.getElementById(MODAL_ID);
  }

  function open({ current = "", total = "", onSave } = {}) {
    const modalEl = ensureModal();
    const input = document.getElementById(`${MODAL_ID}Input`);
    const totalEl = document.getElementById(`${MODAL_ID}Total`);
    const form = document.getElementById(`${MODAL_ID}Form`);
    input.value = current;
    totalEl.textContent = total ? `/ ${total}` : "";

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const submit = async (event) => {
      event.preventDefault();
      await onSave?.(input.value);
      modal.hide();
    };

    form.addEventListener("submit", submit, { once: true });
    modalEl.addEventListener(
      "hidden.bs.modal",
      () => form.removeEventListener("submit", submit),
      { once: true },
    );
    modal.show();
    setTimeout(() => {
      input.focus();
      input.select();
    }, 150);
  }

  window.PFMapHpEditor = { open };
})();
