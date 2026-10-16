(function () {
  const MODAL_ID = "generatedEquipmentPickerModal";
  const FILTERS = [
    { key: "all", label: "All" },
    { key: "natural", label: "Natural" },
    { key: "weapon", label: "Weapons" },
    { key: "armor", label: "Armor" },
    { key: "shield", label: "Shields" },
  ];
  let modal = null;
  let equipmentCache = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load ${path}.`);
    return response.json();
  }

  async function loadEquipment() {
    if (equipmentCache) return equipmentCache;
    const [naturalWeapons, weapons, armor] = await Promise.all([
      window.PFNaturalWeapons?.naturalWeaponItems?.() || [],
      window.PFItemData?.loadWeapons?.() || fetchJson("data/weapons.json"),
      window.PFItemData?.loadArmorShields?.() ||
        fetchJson("data/armor-shields.json"),
    ]);
    equipmentCache = [
      ...(Array.isArray(naturalWeapons) ? naturalWeapons : []),
      ...(Array.isArray(weapons)
        ? weapons.filter((item) => item.generatedCategory !== "natural")
        : []),
      ...(Array.isArray(armor) ? armor : []),
    ].filter((item) =>
      ["Weapon", "Armor", "Shield"].includes(String(item.type || "")),
    );
    return equipmentCache;
  }

  function itemFilterKey(item = {}) {
    if (item.generatedCategory === "natural") return "natural";
    return String(item.type || "").toLowerCase();
  }

  function detailLine(item = {}) {
    const details = item.details || {};
    if (item.generatedCategory === "natural") {
      return [details.naturalAttackRole, details.damage, details.damageType]
        .filter(Boolean)
        .join(" | ");
    }
    if (item.type === "Weapon") {
      return [details.weaponGroup, details.damage, details.critical]
        .filter(Boolean)
        .join(" | ");
    }
    return [details.armorGroup, details.bonus, details.maxDex]
      .filter(Boolean)
      .join(" | ");
  }

  function ensureModal() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) return existing;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable generated-equipment-picker-dialog">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header generated-equipment-picker-header">
              <h5 class="modal-title">Choose Weapon / Armor</h5>
            </div>
            <div class="modal-body">
              <div class="generated-equipment-type-nav" data-generated-equipment-type-nav></div>
              <input class="form-control form-control-sm generated-equipment-picker-search" data-generated-equipment-picker-search placeholder="Search weapons, natural attacks, armor, shields">
              <div class="generated-equipment-picker-results" data-generated-equipment-picker-results></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById(MODAL_ID);
  }

  function renderTypeNav(root, allowedFilters, activeFilter, onSelect) {
    const nav = root.querySelector("[data-generated-equipment-type-nav]");
    nav.innerHTML = FILTERS.filter((filter) => allowedFilters.has(filter.key))
      .map(
        (filter) => `
          <button class="generated-equipment-type-button ${filter.key === activeFilter ? "active" : ""}" type="button" data-generated-equipment-filter="${filter.key}">
            ${escapeHtml(filter.label)}
          </button>
        `,
      )
      .join("");
    nav.querySelectorAll("[data-generated-equipment-filter]").forEach((button) => {
      button.addEventListener("click", () => onSelect(button.dataset.generatedEquipmentFilter));
    });
  }

  function renderResults(root, items, onChoose) {
    const results = root.querySelector("[data-generated-equipment-picker-results]");
    if (!items.length) {
      results.innerHTML = `<div class="small-text">No matching equipment.</div>`;
      return;
    }
    results.innerHTML = items
      .map(
        (item, index) => `
          <button class="generated-equipment-picker-card" type="button" data-generated-equipment-picker-index="${index}">
            <span>
              <strong>${escapeHtml(item.name || "Unnamed item")}</strong>
              <small>${escapeHtml(detailLine(item))}</small>
            </span>
            <span class="generated-equipment-picker-type">${escapeHtml(item.generatedCategory === "natural" ? "Natural" : item.type || "")}</span>
          </button>
        `,
      )
      .join("");
    results
      .querySelectorAll("[data-generated-equipment-picker-index]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          onChoose(items[Number(button.dataset.generatedEquipmentPickerIndex)]),
        );
      });
  }

  function allowedFilterKeys(types) {
    const allowed = new Set(types);
    const filters = new Set(["all"]);
    if (allowed.has("Weapon")) {
      filters.add("weapon");
      filters.add("natural");
    }
    if (allowed.has("Armor")) filters.add("armor");
    if (allowed.has("Shield")) filters.add("shield");
    return filters;
  }

  async function open({ types = ["Weapon", "Armor", "Shield"] } = {}) {
    const root = ensureModal();
    modal ||= new bootstrap.Modal(root);
    const allowedTypes = new Set(types);
    const allowedFilters = allowedFilterKeys(types);
    const search = root.querySelector("[data-generated-equipment-picker-search]");
    const allItems = (await loadEquipment()).filter((item) =>
      allowedTypes.has(item.type),
    );
    let activeFilter = allowedFilters.has("natural") ? "natural" : "all";
    let settled = false;

    return new Promise((resolve) => {
      const finish = (value = null) => {
        if (settled) return;
        settled = true;
        modal.hide();
        resolve(value);
      };
      const refresh = () => {
        renderTypeNav(root, allowedFilters, activeFilter, (nextFilter) => {
          activeFilter = nextFilter;
          refresh();
        });
        const term = search.value.trim().toLowerCase();
        const visibleItems = allItems
          .filter((item) => {
            const filterKey = itemFilterKey(item);
            const matchesFilter =
              activeFilter === "all" || filterKey === activeFilter;
            if (!matchesFilter) return false;
            if (!term) return true;
            const haystack = `${item.name || ""} ${item.type || ""} ${
              item.generatedCategory || ""
            } ${item.details?.summary || ""}`.toLowerCase();
            return haystack.includes(term);
          })
          .slice(0, 80);
        renderResults(root, visibleItems, finish);
      };
      const onHidden = () => {
        root.removeEventListener("hidden.bs.modal", onHidden);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      };
      root.addEventListener("hidden.bs.modal", onHidden);
      search.value = "";
      search.oninput = refresh;
      refresh();
      modal.show();
      setTimeout(() => search.focus(), 150);
    });
  }

  window.PFGeneratedEquipmentPicker = { open };
})();
