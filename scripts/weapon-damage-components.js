window.PFWeaponDamage = (() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function normalize(entries) {
    if (typeof entries === "string") {
      try { entries = JSON.parse(entries); } catch { entries = []; }
    }
    return (Array.isArray(entries) ? entries : []).map((entry) => {
      if (typeof entry === "string") {
        const match = entry.trim().match(/^([+-]?(?:\d+d\d+(?:\s*[+-]\s*\d+)?|\d+))\s*(.*)$/i);
        return match
          ? { formula: match[1], type: match[2] }
          : { formula: "", type: "" };
      }
      return { formula: String(entry?.formula || "").trim(), type: String(entry?.type || "").trim() };
    }).filter((entry) => entry.formula);
  }

  function row(entry = {}) {
    return `<div class="d-flex gap-2 align-items-end mb-2" data-extra-damage-row>
      <div class="flex-grow-1" style="min-width:0"><label>Damage</label><input class="form-control form-control-sm" data-extra-damage-formula placeholder="1d6" value="${escapeHtml(entry.formula)}"></div>
      <div class="flex-grow-1" style="min-width:0"><label>Type</label><input class="form-control form-control-sm" data-extra-damage-type placeholder="fire" value="${escapeHtml(entry.type)}"></div>
      <button type="button" class="btn btn-outline-danger btn-sm flex-shrink-0" data-remove-extra-damage aria-label="Remove damage component" title="Remove"><i class="bi bi-trash"></i></button>
    </div>`;
  }

  function mount(container, entries = []) {
    if (!container) return;
    container.innerHTML = `<div data-extra-damage-rows>${normalize(entries).map(row).join("")}</div>
      <button type="button" class="btn btn-outline-info btn-sm" data-add-extra-damage><i class="bi bi-plus"></i> Add Damage</button>`;
    container.onclick = (event) => {
      if (event.target.closest("[data-add-extra-damage]")) {
        container.querySelector("[data-extra-damage-rows]").insertAdjacentHTML("beforeend", row());
      } else if (event.target.closest("[data-remove-extra-damage]")) {
        event.target.closest("[data-extra-damage-row]")?.remove();
      }
    };
  }

  function collect(container) {
    return normalize([...container.querySelectorAll("[data-extra-damage-row]")].map((row) => ({
      formula: row.querySelector("[data-extra-damage-formula]").value,
      type: row.querySelector("[data-extra-damage-type]").value,
    })));
  }

  function format(entries) {
    return normalize(entries).map(({ formula, type }) => ` + ${formula}${type ? ` ${type}` : ""}`).join("");
  }

  return { normalize, mount, collect, format };
})();
