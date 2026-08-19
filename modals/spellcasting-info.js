(function () {
  const MODAL_ID = "spellcastingInfoModal";
  let modal = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function modeLabel(mode) {
    if (mode === "spellbook") return "Known spellbook plus prepared daily slots";
    if (mode === "spontaneous") return "Spontaneous spells known and casts per day";
    return "Daily prepared from the class spell list";
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header">
              <h5 class="modal-title" id="${MODAL_ID}Label">Spellcasting</h5>
            </div>
            <div class="modal-body">
              <div id="spellcastingInfoBody" class="vstack gap-2"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  function detail(label, value) {
    return `
      <div>
        <div class="small text-secondary">${escapeHtml(label)}</div>
        <div class="fw-semibold">${escapeHtml(value || "Not listed")}</div>
      </div>
    `;
  }

  window.PFSpellcastingInfo = {
    open(config = {}) {
      ensureModal();
      document.getElementById(`${MODAL_ID}Label`).textContent = `${config.className || "Class"} Spellcasting`;
      document.getElementById("spellcastingInfoBody").innerHTML = `
        ${detail("Class Level", config.level)}
        ${detail("Casting Type", config.castingType)}
        ${detail("Progression", config.progression)}
        ${detail("Casting Ability", config.ability)}
        ${detail("Ability Modifier", config.abilityMod)}
        ${detail("Spell Management", modeLabel(config.mode))}
        ${detail("Maximum Spell Level", config.maxSpellLevel)}
      `;
      modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(MODAL_ID));
      modal.show();
    }
  };
})();
