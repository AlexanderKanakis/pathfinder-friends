(function () {
  const SIZE_KEYS = [
    "fine",
    "diminutive",
    "tiny",
    "small",
    "medium",
    "large",
    "huge",
    "gargantuan",
    "colossal",
  ];
  let catalogPromise = null;
  let catalog = [];

  function titleCase(value) {
    return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function normalizeDamageBySize(value = {}) {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (_error) {
        value = {};
      }
    }
    return Object.fromEntries(
      SIZE_KEYS.map((size) => [size, String(value?.[size] ?? "").trim()]),
    );
  }

  async function loadCatalog() {
    if (catalog.length) return catalog;
    if (!catalogPromise) {
      catalogPromise = fetch("data/weapons.json", { cache: "no-cache" })
        .then((response) => {
          if (!response.ok) throw new Error("Could not load natural weapons.");
          return response.json();
        })
        .then((items) => {
          catalog = (Array.isArray(items) ? items : []).filter(
            (item) => item.generatedCategory === "natural",
          );
          return catalog;
        });
    }
    return catalogPromise;
  }

  function cachedAttack(kindOrAlias = "") {
    const requested = String(kindOrAlias || "").trim().toLowerCase();
    if (!requested) return null;
    return (
      catalog.find(
        (item) =>
          String(item.details?.naturalAttackKind || item.name || "").toLowerCase() ===
          requested,
      ) ||
      catalog.find((item) =>
        (item.details?.naturalAliases || []).some(
          (alias) => String(alias || "").toLowerCase() === requested,
        ),
      ) ||
      null
    );
  }

  async function attack(kindOrAlias = "") {
    await loadCatalog();
    return cachedAttack(kindOrAlias);
  }

  async function naturalWeaponItems() {
    const items = await loadCatalog();
    return items.flatMap((item) => {
      const aliases = item.details?.naturalAliases || [item.name];
      return aliases.map((name) => ({
        ...item,
        name,
        details: { ...item.details },
      }));
    });
  }

  function collect(host) {
    if (!host) return normalizeDamageBySize();
    return normalizeDamageBySize(
      Object.fromEntries(
        SIZE_KEYS.map((size) => {
          const count = Number(
            host.querySelector(`[data-natural-damage-count="${size}"]`)?.value || 0,
          );
          const die =
            host.querySelector(`[data-natural-damage-die="${size}"]`)?.value ||
            "6";
          return [
            size,
            count > 0 ? (die === "flat" ? String(count) : `${count}d${die}`) : "",
          ];
        }),
      ),
    );
  }

  function setValues(host, damageBySize = {}) {
    const normalized = normalizeDamageBySize(damageBySize);
    SIZE_KEYS.forEach((size) => {
      const formula = normalized[size];
      const diceMatch = formula.match(/^(\d+)d(\d+)$/i);
      const flatMatch = formula.match(/^(\d+)$/);
      const countInput = host?.querySelector(
        `[data-natural-damage-count="${size}"]`,
      );
      const dieInput = host?.querySelector(
        `[data-natural-damage-die="${size}"]`,
      );
      if (countInput) countInput.value = diceMatch?.[1] || flatMatch?.[1] || "0";
      if (dieInput) dieInput.value = diceMatch?.[2] || (flatMatch ? "flat" : "6");
    });
    host?._onNaturalDamageChange?.(normalized);
    return normalized;
  }

  async function setFromKind(host, kind, { force = false } = {}) {
    const current = collect(host);
    if (!force && Object.values(current).some(Boolean)) return current;
    const entry = await attack(kind);
    return setValues(host, entry?.details?.naturalDamageBySize || {});
  }

  function mount(host, damageBySize = {}, options = {}) {
    if (!host) return null;
    host.classList.add("natural-damage-editor");
    host.innerHTML = SIZE_KEYS.map(
      (size) => `
        <div class="natural-damage-field">
          <label>${titleCase(size)}</label>
          <div class="natural-damage-controls">
            <div class="modal-number-stepper natural-damage-stepper">
              <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-natural-damage-step="${size}" data-delta="-1" aria-label="Decrease ${size} damage dice">-</button>
              <input class="form-control form-control-sm no-spinner" data-natural-damage-count="${size}" type="number" min="0" value="0" inputmode="numeric" aria-label="${titleCase(size)} damage dice count">
              <button class="btn btn-outline-light btn-sm modal-number-stepper-button" type="button" data-natural-damage-step="${size}" data-delta="1" aria-label="Increase ${size} damage dice">+</button>
            </div>
            <select class="form-select form-select-sm" data-natural-damage-die="${size}" aria-label="${titleCase(size)} damage die">
              <option value="flat">Flat</option>
              <option value="2">d2</option>
              <option value="3">d3</option>
              <option value="4">d4</option>
              <option value="6">d6</option>
              <option value="8">d8</option>
              <option value="10">d10</option>
              <option value="12">d12</option>
              <option value="20">d20</option>
            </select>
          </div>
        </div>
      `,
    ).join("");
    host._onNaturalDamageChange = options.onChange || null;
    const notify = () => host._onNaturalDamageChange?.(collect(host));
    host.addEventListener("input", notify);
    host.addEventListener("change", notify);
    host.querySelectorAll("[data-natural-damage-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = host.querySelector(
          `[data-natural-damage-count="${button.dataset.naturalDamageStep}"]`,
        );
        if (!input) return;
        input.value = String(
          Math.max(0, Number(input.value || 0) + Number(button.dataset.delta || 0)),
        );
        notify();
      });
    });
    host._collectNaturalDamage = () => collect(host);
    host._setNaturalDamage = (value) => setValues(host, value);
    host._setNaturalDamageFromKind = (kind, settings) =>
      setFromKind(host, kind, settings);
    setValues(host, damageBySize);
    return host;
  }

  async function populateKindSelect(select, selected = "Other") {
    if (!select) return;
    const items = await loadCatalog();
    select.innerHTML = items
      .map((item) => {
        const kind = item.details?.naturalAttackKind || item.name;
        return `<option value="${kind}">${kind}</option>`;
      })
      .join("");
    select.value = cachedAttack(selected)?.details?.naturalAttackKind || "Other";
  }

  function damageForSize(damageBySize, size = "Medium") {
    return normalizeDamageBySize(damageBySize)[String(size || "medium").toLowerCase()] || "";
  }

  window.PFNaturalWeapons = {
    SIZE_KEYS,
    attack,
    cachedAttack,
    collect,
    damageForSize,
    loadCatalog,
    mount,
    naturalWeaponItems,
    normalizeDamageBySize,
    populateKindSelect,
    setFromKind,
    setValues,
  };
})();
