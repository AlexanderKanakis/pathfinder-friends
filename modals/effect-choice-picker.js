// Small "pick one" modal used whenever an effect's stat/target was left as
// a choice pool (see scripts/effect-stat-options.js) and now needs an
// actual pick -- e.g. activating Rage bundles in Ancestor Totem, Lesser,
// which needs the player to say which skill it applies to.
(function () {
  const MODAL_ID = "effectChoicePickerModal";
  let modal = null;
  let resolver = null;

  // Resolves once the modal has fully finished hiding and is safe to
  // show() again. An effect can carry more than one "choice:" bonus (a
  // mutagen: "+ physical attribute of your choice" AND "- mental
  // attribute of your choice"), which resolveChoiceBonuses() in
  // buff-tracker-widget.js resolves by awaiting open() twice in a row.
  // Bootstrap's Modal.show() silently no-ops if called while the same
  // instance is still mid fade-out from the previous hide() -- and the
  // fade-out is still running right after the first pick, since the
  // click handler resolves the pick promise immediately but the CSS
  // transition (and "hidden.bs.modal") only finish later. So the next
  // open() has to wait for that transition to actually complete before
  // it dares call show() again, or the second picker never appears.
  let hideSignal = Promise.resolve();

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
            </div>
            <div class="modal-body">
              <input id="${MODAL_ID}Search" class="form-control form-control-sm mb-2" placeholder="Search...">
              <div id="${MODAL_ID}List" class="list-group" style="max-height: min(50vh, 420px); overflow: auto;"></div>
              <div id="${MODAL_ID}NamedSkill" class="d-none">
                <label id="${MODAL_ID}NamedSkillLabel" class="form-label small-text mb-1">Skill Specialty</label>
                <input id="${MODAL_ID}NamedSkillInput" class="form-control form-control-sm mb-2" placeholder="Alchemy">
                <div class="d-flex gap-2">
                  <button id="${MODAL_ID}NamedSkillBack" type="button" class="btn btn-outline-light btn-sm">Back</button>
                  <button id="${MODAL_ID}NamedSkillUse" type="button" class="btn btn-primary btn-sm">Use Skill</button>
                </div>
              </div>
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
    document
      .getElementById(`${MODAL_ID}NamedSkillBack`)
      .addEventListener("click", renderList);
    document
      .getElementById(`${MODAL_ID}NamedSkillUse`)
      .addEventListener("click", settleNamedSkill);
  }

  let currentOptions = [];
  let pendingNamedSkillOption = null;

  function skillKey(name) {
    return `skill:${String(name || "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
  }

  function namedSkillLabel(kind) {
    return (
      {
        "skill:craft": "Craft",
        "skill:perform": "Perform",
        "skill:profession": "Profession",
      }[kind] || "Skill"
    );
  }

  function namedSkillPlaceholder(kind) {
    return (
      {
        "skill:craft": "Alchemy",
        "skill:perform": "Oratory",
        "skill:profession": "Sailor",
      }[kind] || "Specialty"
    );
  }

  function namedSkillName(kind, specialty) {
    const text = String(specialty || "").trim();
    if (!text) return "";
    const label = namedSkillLabel(kind);
    if (text.toLowerCase().startsWith(`${label.toLowerCase()} (`)) return text;
    return `${label} (${text})`;
  }

  function settleNamedSkill() {
    if (!pendingNamedSkillOption) return;
    const input = document.getElementById(`${MODAL_ID}NamedSkillInput`);
    const skillName = namedSkillName(
      pendingNamedSkillOption.namedSkillKind,
      input?.value,
    );
    if (!skillName) {
      input?.focus();
      return;
    }
    resolver?.({ value: skillKey(skillName), skillName });
    modal.hide();
  }

  function renderNamedSkill(option) {
    pendingNamedSkillOption = option;
    const kind = option.namedSkillKind || option.value;
    document.getElementById(`${MODAL_ID}Search`).classList.add("d-none");
    document.getElementById(`${MODAL_ID}List`).classList.add("d-none");
    document.getElementById(`${MODAL_ID}Empty`).classList.add("d-none");
    document.getElementById(`${MODAL_ID}NamedSkill`).classList.remove("d-none");
    document.getElementById(`${MODAL_ID}NamedSkillLabel`).textContent =
      `${namedSkillLabel(kind)} Specialty`;
    const input = document.getElementById(`${MODAL_ID}NamedSkillInput`);
    input.value = "";
    input.placeholder = namedSkillPlaceholder(kind);
    input.focus();
  }

  function renderList() {
    pendingNamedSkillOption = null;
    document.getElementById(`${MODAL_ID}Search`).classList.remove("d-none");
    document.getElementById(`${MODAL_ID}List`).classList.remove("d-none");
    document.getElementById(`${MODAL_ID}NamedSkill`).classList.add("d-none");
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
        (option, index) => `
      <button type="button" class="list-group-item list-group-item-action bg-dark text-white border-secondary" data-choice-index="${index}">
        ${escapeHtml(option.label)}
      </button>
    `,
      )
      .join("");
    list.querySelectorAll("[data-choice-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const option = matches[Number(button.dataset.choiceIndex)];
        if (!option) return;
        if (option.namedSkillKind) {
          renderNamedSkill(option);
          return;
        }
        // resolver is this session's settle() (see open() below) -- it
        // resolves the *pick* promise right away, but the modal itself
        // isn't done closing until "hidden.bs.modal" fires below, which
        // is what actually unblocks the next open() call.
        resolver?.(option.value);
        modal.hide();
      });
    });
  }

  // options: [{ value, label }]. Resolves to the chosen value, a
  // { value, skillName } named-skill object, or null if cancelled.
  function open({ title = "Choose a Target", options = [] } = {}) {
    // Wait for any still-closing previous session before touching the
    // (singleton) modal element again -- see hideSignal above.
    return hideSignal.then(
      () =>
        new Promise((resolve) => {
          ensureModal();
          document.getElementById(`${MODAL_ID}Title`).textContent = title;
          document.getElementById(`${MODAL_ID}Search`).value = "";
          currentOptions = Array.isArray(options) ? options : [];
          renderList();
          const modalEl = document.getElementById(MODAL_ID);
          modal = bootstrap.Modal.getOrCreateInstance(modalEl);

          let settled = false;
          let resolveHideSignal;
          hideSignal = new Promise((res) => {
            resolveHideSignal = res;
          });

          const settle = (value) => {
            if (settled) return;
            settled = true;
            resolver = null;
            resolve(value);
          };
          const onHidden = () => {
            // Covers both paths: Cancel/close-button/backdrop (nothing
            // has settled yet, so this is the real "no pick" answer) and
            // a normal pick (already settled by the click handler above,
            // so this is just a no-op confirmation the fade-out is done).
            settle(null);
            modalEl.removeEventListener("hidden.bs.modal", onHidden);
            resolveHideSignal();
          };
          modalEl.addEventListener("hidden.bs.modal", onHidden);

          resolver = settle;
          modal.show();
          setTimeout(
            () => document.getElementById(`${MODAL_ID}Search`).focus(),
            150,
          );
        }),
    );
  }

  window.PFEffectChoicePicker = { open };
})();
