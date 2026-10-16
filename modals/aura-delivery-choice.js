(function (root) {
  const MODAL_ID = "auraDeliveryChoiceModal";
  let modal = null;
  let hideSignal = Promise.resolve();
  let chooseAction = null;

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function needsChoice(effect = {}) {
    const config = effect.auraConfig || {};
    return Boolean(
      config.enabled && config.independentToken && config.targetsEmitAura,
    );
  }

  function withDelivery(effect = {}, delivery = "") {
    if (!needsChoice(effect)) return effect;
    const resolved = clone(effect);
    resolved.auraConfig = {
      ...resolved.auraConfig,
      independentToken: delivery === "independent",
      targetsEmitAura: delivery === "target",
    };
    return resolved;
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" data-aura-delivery-title>Choose Aura Placement</h5>
            </div>
            <div class="modal-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-info text-start" type="button" data-aura-delivery="independent">
                  <i class="bi bi-bounding-box me-2"></i>Independent Map Token
                </button>
                <button class="btn btn-outline-info text-start" type="button" data-aura-delivery="target">
                  <i class="bi bi-person-bounding-box me-2"></i>Target Emits Aura
                </button>
              </div>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    document
      .getElementById(MODAL_ID)
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-aura-delivery]");
        if (button) chooseAction?.(button.dataset.auraDelivery);
      });
  }

  function choose(effect = {}, options = {}) {
    if (!needsChoice(effect)) return Promise.resolve(effect);
    return hideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureModal();
          const modalEl = document.getElementById(MODAL_ID);
          const title = modalEl.querySelector("[data-aura-delivery-title]");
          title.textContent = options.title ||
            `${effect.name || "Effect"}: Choose Aura Placement`;
          modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          let settled = false;
          let selectedEffect = null;
          let resolveHideSignal;
          hideSignal = new Promise((res) => {
            resolveHideSignal = res;
          });
          const settle = (value) => {
            if (settled) return;
            settled = true;
            chooseAction = null;
            resolve(value);
          };
          const onHidden = () => {
            settle(selectedEffect);
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            resolveHideSignal();
          };
          modalEl.addEventListener("hidden.bs.modal", onHidden);
          chooseAction = (delivery) => {
            selectedEffect = withDelivery(effect, delivery);
            chooseAction = null;
            modal.hide();
          };
          modal.show();
        }),
    );
  }

  root.PFAuraDeliveryChoice = Object.freeze({
    needsChoice,
    withDelivery,
    choose,
  });
})(window);
