(function () {
  let modal;

  function ensureModal() {
    if (modal) return modal;
    const root = document.createElement("div");
    root.className = "modal fade";
    root.tabIndex = -1;
    root.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title">Attach Option Pool</h5>
          </div>
          <div class="modal-body">
            <input class="form-control form-control-sm mb-3" data-pool-search placeholder="Search pools">
            <div class="vstack gap-2" data-pool-options></div>
          </div>
          <div class="modal-footer border-secondary">
            <button class="btn btn-outline-light" type="button" data-pool-cancel>Cancel</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);
    modal = { root, instance: new bootstrap.Modal(root) };
    return modal;
  }

  function open(catalogs = []) {
    const current = ensureModal();
    const search = current.root.querySelector("[data-pool-search]");
    const options = current.root.querySelector("[data-pool-options]");
    const cancel = current.root.querySelector("[data-pool-cancel]");
    search.value = "";

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        current.instance.hide();
        resolve(value);
      };
      const render = () => {
        const term = search.value.trim().toLowerCase();
        const visible = catalogs
          .filter(
            (catalog) =>
              !term ||
              `${catalog.name || ""} ${catalog.id || ""}`
                .toLowerCase()
                .includes(term),
          )
          .sort((a, b) =>
            String(a.name || a.id).localeCompare(String(b.name || b.id)),
          );
        options.innerHTML = visible.length
          ? visible
              .map(
                (catalog) => `
                <button class="btn btn-outline-info text-start" type="button" data-pool-id="${String(catalog.id || "").replaceAll('"', "&quot;")}">
                  <strong>${String(catalog.name || catalog.id || "Pool").replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</strong>
                  <span class="small-text d-block">${(catalog.options || []).length} options</span>
                </button>`,
              )
              .join("")
          : '<div class="small-text">No matching pools.</div>';
        options.querySelectorAll("[data-pool-id]").forEach((button) => {
          button.addEventListener("click", () =>
            finish(catalogs.find((catalog) => catalog.id === button.dataset.poolId)),
          );
        });
      };
      const onHidden = () => {
        current.root.removeEventListener("hidden.bs.modal", onHidden);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
      current.root.addEventListener("hidden.bs.modal", onHidden);
      search.oninput = render;
      cancel.onclick = () => finish(null);
      render();
      current.instance.show();
      current.root.addEventListener("shown.bs.modal", () => search.focus(), {
        once: true,
      });
    });
  }

  window.PFClassFeaturePoolPicker = { open };
})();
