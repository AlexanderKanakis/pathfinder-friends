(function () {
  const MODAL_ID = "featDetailsModal";
  let modalElement = null;
  let modalInstance = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function textValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    return String(value ?? "").trim();
  }

  function featTypes(feat = {}) {
    const types = Array.isArray(feat.types) ? feat.types : [feat.type];
    return [...new Set(types.map(textValue).filter(Boolean))];
  }

  function detailSection(label, value) {
    const text = textValue(value);
    if (!text) return "";
    return `
      <section class="feat-details-section">
        <div class="feat-details-label">${escapeHtml(label)}</div>
        <div class="feat-details-text">${escapeHtml(text)}</div>
      </section>
    `;
  }

  function ensureModal() {
    if (modalElement) return modalElement;
    modalElement = document.createElement("div");
    modalElement.className = "modal fade feat-details-modal";
    modalElement.id = MODAL_ID;
    modalElement.tabIndex = -1;
    modalElement.setAttribute("aria-hidden", "true");
    modalElement.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title" id="featDetailsModalTitle">Feat</h5>
          </div>
          <div class="modal-body" id="featDetailsModalBody"></div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalElement);
    modalInstance = new bootstrap.Modal(modalElement);
    return modalElement;
  }

  function open(feat = {}) {
    if (!feat || typeof feat !== "object") return;
    ensureModal();
    const name = textValue(feat.name) || "Feat";
    const types = featTypes(feat);
    modalElement.querySelector("#featDetailsModalTitle").textContent = types.length
      ? `${name} (${types.join(", ")})`
      : name;

    const description = textValue(feat.description);
    modalElement.querySelector("#featDetailsModalBody").innerHTML = `
      ${description ? `<p class="feat-details-introduction">${escapeHtml(description)}</p>` : ""}
      ${detailSection("Prerequisite", feat.prerequisites)}
      ${detailSection("Benefit", feat.benefit)}
      ${detailSection("Normal", feat.normal)}
      ${detailSection("Special", feat.special)}
      ${detailSection("Goal", feat.goal)}
      ${detailSection("Completion Benefit", feat.completionBenefit)}
      ${detailSection("Suggested Traits", feat.suggestedTraits)}
      ${detailSection("Race", feat.raceName)}
      ${detailSection("Note", feat.note)}
      ${detailSection("Source", feat.source)}
      ${
        !description &&
        ![
          feat.prerequisites,
          feat.benefit,
          feat.normal,
          feat.special,
          feat.goal,
          feat.completionBenefit,
          feat.note,
          feat.source,
        ].some((value) => textValue(value))
          ? '<div class="text-secondary">No feat details are available.</div>'
          : ""
      }
    `;
    modalInstance.show();
  }

  window.PFFeatDetails = { open };
})();
