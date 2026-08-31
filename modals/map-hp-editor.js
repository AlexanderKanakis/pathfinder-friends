(function () {
  const MODAL_ID = "mapHpEditorModal";

  function ensureModal() {
    let modalEl = document.getElementById(MODAL_ID);
    if (modalEl) return modalEl;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <form class="modal-content bg-dark text-white border-secondary" id="${MODAL_ID}Form">
              <div class="modal-header border-secondary">
                <h5 class="modal-title" id="${MODAL_ID}Label">Hit Points</h5>
              </div>
              <div class="modal-body">
                <label class="form-label" for="${MODAL_ID}Input">Current HP</label>
                <input id="${MODAL_ID}Input" class="form-control form-control-sm" type="number" inputmode="numeric">
                <div class="small text-secondary mt-2" id="${MODAL_ID}Total"></div>
              </div>
              <div class="modal-footer border-secondary">
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

  function open({ title = "Hit Points", current = "", total = "", onSave } = {}) {
    const modalEl = ensureModal();
    const input = document.getElementById(`${MODAL_ID}Input`);
    const totalEl = document.getElementById(`${MODAL_ID}Total`);
    const form = document.getElementById(`${MODAL_ID}Form`);
    document.getElementById(`${MODAL_ID}Label`).textContent = title;
    input.value = current;
    totalEl.textContent = total ? `Total HP: ${total}` : "";

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
