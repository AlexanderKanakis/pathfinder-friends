(function () {
  const MODAL_ID = "spellPickerModal";
  let modal = null;
  let resolver = null;
  let state = null;
  let spellCache = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function stripHtml(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value || "").replace(/<\/h3>/g, "");
    return div.textContent.replace(/\s+/g, " ").trim();
  }

  function ensureStyle() {
    if (document.getElementById("spellPickerStyles")) return;
    const style = document.createElement("style");
    style.id = "spellPickerStyles";
    style.textContent = `
      .spell-picker-card.is-selected {
        border-color: #0d6efd;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, .25);
      }
      .spell-picker-card.is-focused {
        border-color: #f0d58c;
        box-shadow: 0 0 0 2px rgba(240, 213, 140, .25);
      }
      .spell-picker-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #151515;
        border: 1px solid #555;
        color: #8fd19e;
      }
      #spellPickerResults .source-results-grid {
        align-items: start;
      }
      .spell-picker-card {
        min-height: 0;
        align-self: start;
        padding: 8px 38px 8px 10px;
      }
      .spell-picker-modal .modal-header {
        padding: 8px 12px;
      }
      .spell-picker-modal .modal-title {
        font-size: 16px;
        line-height: 1.2;
      }
      .spell-picker-modal .modal-body {
        overflow-y: auto;
      }
      .spell-picker-modal.is-detail-mode .modal-header {
        display: none;
      }
      .spell-picker-modal.is-detail-mode .modal-body {
        padding: 10px 12px 8px;
      }
      .spell-picker-modal.is-detail-mode #spellPickerResults {
        margin-top: 0;
      }
      .spell-picker-detail-only {
        color: #eee;
      }
      .spell-picker-detail-title {
        padding-right: 0;
      }
      .spell-picker-modal.is-detail-mode .modal-footer {
        padding: 8px 12px;
      }
      .spell-picker-description {
        color: #ddd;
        font-size: 13px;
        line-height: 1.35;
        white-space: pre-wrap;
      }
      .spell-picker-filters {
        display: grid;
        grid-template-columns: minmax(120px, 1fr) 62px minmax(120px, .85fr);
        gap: 8px;
        margin-bottom: 8px;
      }
      .spell-picker-filters.hide-class-filter {
        grid-template-columns: 62px minmax(120px, .85fr);
      }
      .spell-picker-filters label {
        font-size: 12px;
        margin-bottom: 2px;
      }
      #spellPickerResults {
        min-height: 0;
        max-height: none;
        overflow: visible;
        margin-top: 8px;
      }
      .spell-picker-detail-stack {
        margin-top: 8px;
        display: grid;
        gap: 6px;
        color: #eee;
        font-size: 13px;
        line-height: 1.35;
      }
      .spell-picker-summary-line strong,
      .spell-picker-detail-line strong {
        color: #fff;
      }
      .spell-picker-rule-heading {
        border-top: 1px solid #666;
        border-bottom: 1px solid #666;
        color: #b8b8b8;
        font-size: 10px;
        line-height: 1.2;
        text-transform: uppercase;
        margin-top: 2px;
        padding: 1px 0;
      }
      .spell-picker-rule-block {
        display: grid;
        gap: 2px;
      }
      .spell-picker-calculations {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 8px;
      }
      .spell-picker-calculation-card {
        position: relative;
        background: #242424;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 8px 36px 8px 10px;
      }
      .spell-picker-calculation-summary {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 28px;
      }
      .spell-picker-calculation-label {
        color: #b8b8b8;
        font-size: 13px;
        font-weight: 700;
      }
      .spell-picker-calculation-value {
        color: #fff;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.15;
      }
      .spell-picker-cl-stepper {
        display: inline-grid;
        grid-template-columns: 28px 54px 28px;
        gap: 4px;
        align-items: center;
      }
      .spell-picker-cl-stepper .btn,
      .spell-picker-cl-stepper input {
        height: 28px;
        padding: 0;
        text-align: center;
      }
      .spell-picker-cl-stepper input::-webkit-outer-spin-button,
      .spell-picker-cl-stepper input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .spell-picker-cl-stepper input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
      .spell-picker-calculation-note,
      .spell-picker-calculated-inline {
        color: #8fd19e;
        font-size: 12px;
      }
      .spell-picker-calculation-toggle {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 24px;
        height: 24px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .spell-picker-calculation-toggle i {
        transition: transform .15s ease;
      }
      .spell-picker-calculation-toggle[aria-expanded="true"] i {
        transform: rotate(180deg);
      }
      .spell-picker-calculation-breakdown {
        margin-top: 4px;
      }
      .spell-picker-effects-accordion .accordion-item {
        background: transparent;
        border-color: #444;
      }
      .spell-picker-effects-accordion .accordion-button {
        background: #242424;
        color: #ddd;
        padding: 8px 10px;
        font-size: 13px;
      }
      .spell-picker-effects-accordion .accordion-button:not(.collapsed) {
        background: #2b2b2b;
        color: #fff;
        box-shadow: none;
      }
      .spell-picker-effects-accordion .accordion-button::after {
        filter: invert(1) grayscale(1) brightness(1.6);
      }
      .spell-picker-effects-accordion .accordion-body {
        background: #1e1e1e;
        padding: 10px;
      }
      @media (max-width: 760px) {
        .spell-picker-calculations { grid-template-columns: 1fr; }
        .spell-picker-filters { grid-template-columns: minmax(0, 1fr) 60px minmax(0, 1fr); }
        .spell-picker-filters.hide-class-filter { grid-template-columns: 60px minmax(0, 1fr); }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    ensureStyle();
    const existing = document.getElementById(MODAL_ID);
    if (existing) {
      const requiredIds = [
        "spellPickerSearch",
        "spellPickerClass",
        "spellPickerLevel",
        "spellPickerSchool",
        "spellPickerResults",
        "spellPickerSelect",
        "spellPickerCast",
      ];
      const complete = requiredIds.every((id) => document.getElementById(id));
      if (complete) return;
      existing.remove();
      modal = null;
      resolver = null;
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable search-modal-dialog">
          <div class="modal-content bg-dark text-white border-secondary spell-picker-modal">
            <div class="modal-header">
              <h5 class="modal-title" id="${MODAL_ID}Label">Choose Spell</h5>
              <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="spell-picker-filters">
                <div data-spell-picker-class-filter>
                  <label for="spellPickerClass">Class</label>
                  <select id="spellPickerClass" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="spellPickerLevel">Level</label>
                  <select id="spellPickerLevel" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="spellPickerSchool">School</label>
                  <select id="spellPickerSchool" class="form-select form-select-sm"></select>
                </div>
              </div>
              <input id="spellPickerSearch" class="form-control form-control-sm mb-2" placeholder="Search spell name or description">
              <div id="spellPickerResults" class="source-results-panel search-modal-results"></div>
            </div>
            <div class="modal-footer">
              <span id="spellPickerCastStatus" class="small text-secondary me-auto d-none"></span>
              <button id="spellPickerSelect" type="button" class="btn btn-info btn-sm" disabled>
                <i class="bi bi-check2"></i> Select
              </button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button id="spellPickerCast" type="button" class="btn btn-success btn-sm d-none">Cast</button>
            </div>
          </div>
        </div>
      </div>
    `,
    );
    document
      .getElementById("spellPickerSearch")
      .addEventListener("input", (event) => {
        state.search = event.target.value.trim().toLowerCase();
        renderResults();
      });
    document
      .getElementById("spellPickerClass")
      .addEventListener("change", (event) => {
        state.className = event.target.value;
        renderResults();
      });
    document
      .getElementById("spellPickerLevel")
      .addEventListener("change", (event) => {
        state.spellLevel = Number(event.target.value || 0);
        renderResults();
      });
    document
      .getElementById("spellPickerSchool")
      .addEventListener("change", (event) => {
        state.school = event.target.value;
        renderResults();
      });
    document
      .getElementById("spellPickerSelect")
      .addEventListener("click", () => {
        const spell = visibleExpandedSpell();
        if (!spell) return;
        if (state.selected.includes(spell.name) && !state.allowDuplicates)
          return;
        resolveSpell(spell);
      });
    document
      .getElementById("spellPickerCast")
      .addEventListener("click", async () => {
        if (!state?.detailSpell || typeof state.onCast !== "function") return;
        const button = document.getElementById("spellPickerCast");
        const status = document.getElementById("spellPickerCastStatus");
        button.disabled = true;
        status.textContent = "";
        status.classList.remove("d-none");
        try {
          const result = await state.onCast({
            spell: state.detailSpell,
            casterLevel: state.currentCasterLevel,
            calculatedCasterLevel: state.maxCasterLevel,
            calculations: state.calculations,
            closeDetails: () => modal?.hide(),
          });
          if (result?.message) status.textContent = result.message;
          if (result?.close === true) modal?.hide();
        } finally {
          button.disabled = false;
        }
      });
    document
      .getElementById(MODAL_ID)
      .addEventListener("hidden.bs.modal", () => {
        if (resolver) {
          resolver(null);
          resolver = null;
        }
      });
  }

  function setPickerControlsVisible(visible) {
    document
      .querySelector(`#${MODAL_ID} .spell-picker-filters`)
      ?.classList.toggle("d-none", !visible);
    document.getElementById("spellPickerSearch")?.classList.toggle("d-none", !visible);
    document.getElementById("spellPickerSelect")?.classList.toggle("d-none", !visible);
    document.getElementById("spellPickerCast")?.classList.toggle("d-none", visible);
    const castStatus = document.getElementById("spellPickerCastStatus");
    castStatus?.classList.add("d-none");
    if (castStatus) castStatus.textContent = "";
  }

  async function loadSpells() {
    if (spellCache) return spellCache;
    if (window.PFSpellData?.loadSpells) {
      spellCache = await window.PFSpellData.loadSpells();
      return spellCache;
    }
    const response = await fetch("./data/spells.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load data/spells.json.");
    spellCache = await response.json();
    return spellCache;
  }

  function classAliases(className) {
    const key = String(className || "").toLowerCase();
    const aliases = new Set([key]);
    if (key === "wizard") aliases.add("arcanist");
    if (key === "arcanist") aliases.add("wizard");
    if (key === "summoner (unchained)") aliases.add("summoner (unchained)");
    return aliases;
  }

  function spellClassLevel(spell, className) {
    const levels = String(spell.details?.level || "").toLowerCase();
    for (const alias of classAliases(className)) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = levels.match(
        new RegExp(`(?:^|,\\s*)${escaped}\\s+(\\d+)\\b`, "i"),
      );
      if (match) return Number(match[1]);
    }
    return null;
  }

  function spellClasses(spell) {
    const levels = String(spell.details?.level || "");
    return [
      ...levels.matchAll(/(?:^|,\s*)([a-zA-Z][a-zA-Z ()/-]*?)\s+(\d+)\b/g),
    ]
      .map((match) => ({ className: match[1].trim(), level: Number(match[2]) }))
      .filter((entry) => entry.className);
  }

  function spellSchool(spell) {
    return String(spell.details?.school || "")
      .split(/[,(]/)[0]
      .trim();
  }

  function spellMatches(spell) {
    const spellLevel = spellClassLevel(spell, state.className);
    if (spellLevel !== Number(state.spellLevel)) return false;
    if (
      state.school &&
      spellSchool(spell).toLowerCase() !== state.school.toLowerCase()
    )
      return false;
    const allowedNames = currentAllowedNames();
    if (Array.isArray(allowedNames) && allowedNames.length) {
      return allowedNames.some(
        (name) =>
          String(name).toLowerCase() === String(spell.name || "").toLowerCase(),
      );
    }
    if (Array.isArray(allowedNames) && !allowedNames.length) return false;
    return true;
  }

  function currentAllowedNames() {
    return state.allowedNames;
  }

  function currentEmptyMessage() {
    return state.emptyMessage || "No matching spells found.";
  }

  function searchableSpell(spell) {
    return [
      spell.name,
      spell.details?.school,
      ...(spell.details?.descriptors || []),
      spell.details?.level,
      spell.details?.description,
    ]
      .join(" ")
      .toLowerCase();
  }

  function renderResults() {
    const wrapper = document.getElementById("spellPickerResults");
    const term = state.search || "";
    const results = state.spells
      .filter(spellMatches)
      .filter((spell) => !term || searchableSpell(spell).includes(term))
      .sort((a, b) => {
        const rankA =
          term &&
          String(a.name || "")
            .toLowerCase()
            .includes(term)
            ? 0
            : 1;
        const rankB =
          term &&
          String(b.name || "")
            .toLowerCase()
            .includes(term)
            ? 0
            : 1;
        return (
          rankA - rankB ||
          String(a.name || "").localeCompare(String(b.name || ""))
        );
      });

    if (!results.length) {
      wrapper.innerHTML = `<div class="small text-secondary">${escapeHtml(currentEmptyMessage())}</div>`;
      updateSelectButton();
      return;
    }

    wrapper.innerHTML = `
      <div class="source-results-grid">
        ${results
          .map((spell, index) => {
            const selected = state.selected.includes(spell.name);
            const expanded = state.expanded === spell.name;
            return `
            <article class="source-result-card spell-picker-card${selected ? " is-selected" : ""}${expanded ? " is-focused" : ""}" role="button" tabindex="0" data-spell-expand="${index}" data-spell-name="${escapeHtml(spell.name)}">
              <span class="spell-picker-badge"><i class="bi ${selected ? "bi-check2" : expanded ? "bi-chevron-up" : "bi-magic"}"></i></span>
              <div class="fw-semibold pe-2">${escapeHtml(spell.name)}</div>
              ${
                expanded
                  ? `
                ${spellDetailsHtml(spell, detailCalculationsForSpell(spell))}
              `
                  : ""
              }
            </article>
          `;
          })
          .join("")}
      </div>
    `;
    updateSelectButton();

    if (state.scrollToExpanded && state.expanded) {
      const focused = [...wrapper.querySelectorAll("[data-spell-name]")].find(
        (card) => card.getAttribute("data-spell-name") === state.expanded,
      );
      focused?.scrollIntoView({ block: "start" });
      state.scrollToExpanded = false;
    }

    wrapper.querySelectorAll("[data-spell-expand]").forEach((card) => {
      card.addEventListener("click", () => {
        const spell = results[Number(card.dataset.spellExpand)];
        state.expanded =
          state.expanded === spell?.name ? "" : spell?.name || "";
        state.scrollToExpanded = Boolean(state.expanded);
        renderResults();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const spell = results[Number(card.dataset.spellExpand)];
        state.expanded =
          state.expanded === spell?.name ? "" : spell?.name || "";
        state.scrollToExpanded = Boolean(state.expanded);
        renderResults();
      });
    });
  }

  function visibleExpandedSpell() {
    if (!state?.expanded) return null;
    const term = state.search || "";
    return (
      state.spells.find(
        (spell) =>
          spell.name === state.expanded &&
          spellMatches(spell) &&
          (!term || searchableSpell(spell).includes(term)),
      ) || null
    );
  }

  function updateSelectButton() {
    const button = document.getElementById("spellPickerSelect");
    if (!button) return;
    const expandedSpell = visibleExpandedSpell();
    const alreadySelected =
      expandedSpell &&
      state.selected.includes(expandedSpell.name) &&
      !state.allowDuplicates;
    button.disabled = !expandedSpell || alreadySelected;
    button.innerHTML = alreadySelected
      ? `<i class="bi bi-check2"></i> Added`
      : `<i class="bi bi-check2"></i> Select`;
  }

  function detailCalculationsForSpell(spell) {
    return state?.showCalculationsInPicker && typeof state?.calculationsForSpell === "function"
      ? state.calculationsForSpell(
          spell,
          state.className,
          Number(state.spellLevel || 0),
        )
      : null;
  }

  function spellDetailsHtml(spell, calculations = null) {
    const details = spell.details || {};
    const effectRows = [
      spellDetail("Range", details.range, calculations?.calculatedRange),
      spellDetail("Target", details.target),
      spellDetail("Area", details.area),
      spellDetail("Duration", details.duration, calculations?.calculatedDuration),
      spellDetailPair(
        "Saving Throw",
        details.saving_throw,
        "Spell Resistance",
        details.spell_resistance,
      ),
    ]
      .filter(Boolean)
      .join("");
    return `
      <div class="spell-picker-detail-stack">
        <div class="spell-picker-summary-line">
          ${spellInlineDetail("School", window.PFSpellData?.schoolWithDescriptors?.(spell) || details.school)}
          ${spellInlineDetail("Level", details.level)}
        </div>
        <div class="spell-picker-rule-heading">Casting</div>
        <div class="spell-picker-rule-block">
          ${spellDetail("Casting Time", details.casting_time)}
          ${spellDetail("Components", details.components)}
        </div>
        <div class="spell-picker-rule-heading">Effect</div>
        <div class="spell-picker-rule-block">
          ${effectRows || `<div class="spell-picker-detail-line text-secondary">No effect details listed.</div>`}
        </div>
        <div class="spell-picker-rule-heading">Description</div>
        <div class="spell-picker-description">${escapeHtml(stripHtml(details.description || "No description available."))}</div>
        ${spellCalculationsHtml(calculations)}
      </div>
    `;
  }

  function spellInlineDetail(label, value) {
    return value
      ? `<strong>${escapeHtml(label)}</strong> ${escapeHtml(value)} `
      : "";
  }

  function spellDetail(label, value, calculated = "") {
    return value
      ? `<div class="spell-picker-detail-line"><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}${calculated ? ` <span class="spell-picker-calculated-inline">(${escapeHtml(calculated)})</span>` : ""}</div>`
      : "";
  }

  function spellDetailPair(firstLabel, firstValue, secondLabel, secondValue) {
    if (!firstValue && !secondValue) return "";
    return `
      <div class="spell-picker-detail-line">
        ${firstValue ? `<strong>${escapeHtml(firstLabel)}</strong> ${escapeHtml(firstValue)}` : ""}
        ${firstValue && secondValue ? "; " : ""}
        ${secondValue ? `<strong>${escapeHtml(secondLabel)}</strong> ${escapeHtml(secondValue)}` : ""}
      </div>
    `;
  }

  function signed(value) {
    const number = Number(value || 0);
    return number >= 0 ? `+${number}` : String(number);
  }

  function calculationCardHtml(label, result = {}, note = "", key = "", options = {}) {
    const base = Number(result.base || 0);
    const total = Number(result.total ?? base);
    const bonus = Number(result.bonus || 0);
    const downcast = Number(result.downcastBy || 0);
    const detail = note || [
      bonus ? `base ${base}, modifiers ${signed(bonus)}` : `base ${base}`,
      downcast > 0 ? `downcast from CL ${result.downcastFrom || state?.maxCasterLevel || total}` : "",
    ].filter(Boolean).join("; ");
    const collapseId = `spellPicker${key || label.replace(/[^a-z0-9]+/gi, "")}Breakdown`;
    const stepper = options.stepper
      ? `<div class="spell-picker-cl-stepper" aria-label="Caster level adjustment">
          <button class="btn btn-outline-secondary btn-sm" type="button" data-spell-cl-step="-1" title="Decrease caster level">-</button>
          <input class="form-control form-control-sm" type="number" min="1" max="${escapeHtml(options.max || total)}" value="${escapeHtml(total)}" data-spell-cl-input>
          <button class="btn btn-outline-secondary btn-sm" type="button" data-spell-cl-step="1" title="Increase caster level">+</button>
        </div>`
      : "";
    return `
      <div class="spell-picker-calculation-card">
        <button class="btn btn-outline-secondary btn-sm spell-picker-calculation-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#${escapeHtml(collapseId)}" aria-expanded="false" aria-controls="${escapeHtml(collapseId)}" title="Show calculation">
          <i class="bi bi-chevron-down"></i>
        </button>
        <div class="spell-picker-calculation-summary">
          <span class="spell-picker-calculation-label">${escapeHtml(label)}:</span>
          ${stepper || `<span class="spell-picker-calculation-value">${escapeHtml(total)}</span>`}
        </div>
        <div id="${escapeHtml(collapseId)}" class="collapse spell-picker-calculation-breakdown">
          <div class="spell-picker-calculation-note">${escapeHtml(detail)}</div>
        </div>
      </div>
    `;
  }

  function calculationEffectRow(item = {}, label = "", status = "applied") {
    const className = status === "overridden" ? "calc-overridden" : status === "conditional" ? "calc-conditional" : "calc-applied";
    const detail = item.conditionalReason || item.ignoredReason || item.appliesWhen || item.detail || "";
    const target = label ? `<span class="badge text-bg-secondary me-1">${escapeHtml(label)}</span>` : "";
    return `<div class="${className}">${target}${escapeHtml(status)}: <span class="calc-buff-name">${escapeHtml(item.source || "Effect")}</span> ${signed(item.value)} (${escapeHtml(item.type || "untyped")})${detail ? ` <span class="text-secondary">${escapeHtml(detail)}</span>` : ""}</div>`;
  }

  function casterLevelEntryParts(item = {}) {
    const raw = item.appliesTo || item.applyTo || item.part || "spell";
    const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
    return list
      .map((value) =>
        String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ""),
      )
      .filter(Boolean);
  }

  function isWholeCasterLevelEntry(item = {}) {
    const parts = casterLevelEntryParts(item);
    return (
      !parts.length ||
      parts.some((part) => ["all", "spell", "wholespell"].includes(part))
    );
  }

  function calculationEffectRows(result = {}, label = "") {
    const visibleItems = (items = []) =>
      ["Duration", "Range"].includes(label)
        ? items.filter((item) => !isWholeCasterLevelEntry(item))
        : items;
    return [
      ...visibleItems(result.used || []).map((item) => calculationEffectRow(item, label, "applied")),
      ...visibleItems(result.ignored || []).map((item) => calculationEffectRow(item, label, "overridden")),
      ...visibleItems(result.conditional || []).map((item) => calculationEffectRow(item, label, "conditional")),
    ].join("");
  }

  function spellCalculationsHtml(calculations = null) {
    if (!calculations) return "";
    const casterLevel = calculations.casterLevel || {};
    const spellDc = calculations.spellDc || {};
    const groups = [
      ["Caster Level", "CL", casterLevel],
      ["Duration Caster Level", "Duration", calculations.durationCasterLevel],
      ["Range Caster Level", "Range", calculations.rangeCasterLevel],
      ["Spell DC", "DC", spellDc],
    ].filter(([, , result]) => result);
    const effectRows = groups
      .map(([title, label, result]) => {
        const rows = calculationEffectRows(result, label);
        return rows ? `<div class="mb-2"><div class="small text-secondary mb-1">${escapeHtml(title)}</div><div class="calc-buffs">${rows}</div></div>` : "";
      })
      .filter(Boolean)
      .join("");
    return `
      <div class="spell-picker-rule-heading">Calculated</div>
      <div class="spell-picker-calculations">
        ${calculationCardHtml("Caster Level", casterLevel, "", "Cl", { stepper: true, max: calculations.calculatedCasterLevel || casterLevel.total })}
        ${calculationCardHtml("DC", spellDc, `10 + spell level ${calculations.spellLevel ?? 0} + ${calculations.castingAbility || "ability"} ${signed(calculations.castingAbilityMod || 0)}${Number(spellDc.bonus || 0) ? ` + modifiers ${signed(spellDc.bonus)}` : ""}`, "Dc")}
      </div>
      <div class="accordion spell-picker-effects-accordion mt-2" id="spellPickerEffectBreakdown">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#spellPickerEffectBreakdownPanel" aria-expanded="false" aria-controls="spellPickerEffectBreakdownPanel">
              Effects ${effectRows ? "" : "(none)"}
            </button>
          </h2>
          <div id="spellPickerEffectBreakdownPanel" class="accordion-collapse collapse" data-bs-parent="#spellPickerEffectBreakdown">
            <div class="accordion-body">${effectRows || `<div class="small text-secondary">No CL or DC modifiers apply.</div>`}</div>
          </div>
        </div>
      </div>
    `;
  }

  function findSpellByName(spells = [], spellName = "", className = "", spellLevel = null) {
    const target = String(spellName || "").toLowerCase();
    const exact = spells.filter((spell) => String(spell.name || "").toLowerCase() === target);
    if (!exact.length) return null;
    if (spellLevel !== null && spellLevel !== undefined) {
      const levelMatch = exact.find((spell) => spellClassLevel(spell, className) === Number(spellLevel));
      if (levelMatch) return levelMatch;
    }
    return exact.find((spell) => spellClassLevel(spell, className) !== null) || exact[0];
  }

  function clampCasterLevel(value) {
    const max = Math.max(1, Number(state?.maxCasterLevel || 1) || 1);
    return Math.max(1, Math.min(max, Number(value) || 1));
  }

  async function setDetailCasterLevel(value) {
    if (!state?.detailSpell) return;
    const nextLevel = clampCasterLevel(value);
    state.currentCasterLevel = nextLevel;
    if (typeof state.recalculate === "function") {
      const nextCalculations = await state.recalculate(nextLevel);
      if (nextCalculations) state.calculations = nextCalculations;
    } else if (state.calculations?.casterLevel) {
      state.calculations = {
        ...state.calculations,
        casterLevel: {
          ...state.calculations.casterLevel,
          total: nextLevel,
        },
      };
    }
    renderDetailOnly(state.detailSpell, state.calculations);
  }

  function bindDetailControls() {
    const wrapper = document.getElementById("spellPickerResults");
    wrapper.querySelectorAll("[data-spell-cl-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = Number(button.getAttribute("data-spell-cl-step") || 0);
        setDetailCasterLevel((state?.currentCasterLevel || 1) + delta);
      });
    });
    wrapper.querySelector("[data-spell-cl-input]")?.addEventListener("change", (event) => {
      setDetailCasterLevel(event.target.value);
    });
  }

  function renderDetailOnly(spell, calculations = null) {
    const wrapper = document.getElementById("spellPickerResults");
    wrapper.innerHTML = `
      <div class="spell-picker-detail-only">
        <div class="fw-semibold spell-picker-detail-title">${escapeHtml(spell.name || "Spell")}</div>
        ${spellDetailsHtml(spell, calculations)}
      </div>
    `;
    bindDetailControls();
  }

  function resolveSpell(spell) {
    const next = resolver;
    resolver = null;
    modal?.hide();
    next?.(spell);
  }

  window.PFSpellPicker = {
    async open(config = {}) {
      ensureModal();
      const spells = await loadSpells();
      state = {
        title: config.title || "Choose Spell",
        className: config.className || "",
        spellLevel: Number(config.spellLevel || 0),
        selected: Array.isArray(config.selected) ? config.selected : [],
        allowedNames: Array.isArray(config.allowedNames)
          ? config.allowedNames
          : null,
        allowedNamesByLevel: null,
        allowDuplicates: Boolean(config.allowDuplicates),
        emptyMessage: config.emptyMessage || "",
        spells,
        search: "",
        school: config.school || "",
        expanded: config.initialSpellName || "",
        scrollToExpanded: Boolean(config.initialSpellName),
        detailSpell: null,
        calculations: null,
        recalculate: null,
        onCast: null,
        calculationsForSpell:
          typeof config.calculationsForSpell === "function"
            ? config.calculationsForSpell
            : null,
        showCalculationsInPicker: Boolean(config.showCalculationsInPicker),
        hideClassFilter: Boolean(config.hideClassFilter),
        currentCasterLevel: 1,
        maxCasterLevel: 1,
        maxSpellLevel:
          config.maxSpellLevel === undefined || config.maxSpellLevel === null
            ? 9
            : Math.max(0, Math.min(9, Number(config.maxSpellLevel) || 0)),
      };
      setPickerControlsVisible(true);
      document.querySelector(`#${MODAL_ID} .spell-picker-modal`)?.classList.remove("is-detail-mode");
      document.getElementById(`${MODAL_ID}Label`).textContent = state.title;
      document.getElementById("spellPickerSearch").value = "";
      renderFilterOptions();
      renderResults();
      modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById(MODAL_ID),
      );
      modal.show();
      setTimeout(
        () => document.getElementById("spellPickerSearch")?.focus(),
        150,
      );
      return new Promise((resolve) => {
        resolver = resolve;
      });
    },
    async openDetails(config = {}) {
      ensureModal();
      const spells = await loadSpells();
      const spell =
        config.spell ||
        findSpellByName(
          spells,
          config.spellName || config.name,
          config.className,
          config.spellLevel,
        );
      if (!spell) return null;
      state = {
        title: config.title || spell.name || "Spell Details",
        className: config.className || "",
        spellLevel: Number(
          spellClassLevel(spell, config.className) ?? config.spellLevel ?? 0,
        ),
        selected: [],
        allowedNames: null,
        allowedNamesByLevel: null,
        allowDuplicates: true,
        emptyMessage: "",
        spells,
        search: "",
        school: "",
        expanded: spell.name || "",
        scrollToExpanded: false,
        detailSpell: spell,
        calculations: config.calculations || null,
        recalculate: typeof config.recalculate === "function" ? config.recalculate : null,
        onCast: typeof config.onCast === "function" ? config.onCast : null,
        calculationsForSpell: null,
        currentCasterLevel: Math.max(1, Number(config.calculations?.casterLevel?.total || 1) || 1),
        maxCasterLevel: Math.max(1, Number(config.calculations?.calculatedCasterLevel || config.calculations?.casterLevel?.total || 1) || 1),
        maxSpellLevel: 9,
      };
      setPickerControlsVisible(false);
      document.querySelector(`#${MODAL_ID} .spell-picker-modal`)?.classList.add("is-detail-mode");
      document.getElementById(`${MODAL_ID}Label`).textContent = state.title;
      document.getElementById("spellPickerSearch").value = "";
      renderDetailOnly(spell, state.calculations || null);
      modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById(MODAL_ID),
      );
      modal.show();
      return new Promise((resolve) => {
        resolver = resolve;
      });
    },
  };

  function renderFilterOptions() {
    const classSelect = document.getElementById("spellPickerClass");
    const levelSelect = document.getElementById("spellPickerLevel");
    const schoolSelect = document.getElementById("spellPickerSchool");
    const classes = [
      ...new Set(
        state.spells.flatMap((spell) =>
          spellClasses(spell).map((entry) => entry.className),
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const schools = [
      ...new Set(state.spells.map(spellSchool).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    if (
      !classes.some(
        (name) => name.toLowerCase() === state.className.toLowerCase(),
      )
    ) {
      state.className = classes[0] || state.className;
    } else {
      state.className =
        classes.find(
          (name) => name.toLowerCase() === state.className.toLowerCase(),
        ) || state.className;
    }
    classSelect.innerHTML = classes
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}" ${name === state.className ? "selected" : ""}>${escapeHtml(name)}</option>`,
      )
      .join("");
    document
      .querySelector(`#${MODAL_ID} .spell-picker-filters`)
      ?.classList.toggle("hide-class-filter", Boolean(state.hideClassFilter));
    classSelect
      .closest("[data-spell-picker-class-filter]")
      ?.classList.toggle("d-none", Boolean(state.hideClassFilter));
    const maxLevel = Math.max(0, Math.min(9, Number(state.maxSpellLevel ?? 9)));
    if (Number(state.spellLevel || 0) > maxLevel) state.spellLevel = maxLevel;
    levelSelect.innerHTML = Array.from(
      { length: maxLevel + 1 },
      (_, level) =>
        `<option value="${level}" ${level === Number(state.spellLevel) ? "selected" : ""}>${level}</option>`,
    ).join("");
    schoolSelect.innerHTML = `<option value="">All schools</option>${schools.map((school) => `<option value="${escapeHtml(school)}" ${school === state.school ? "selected" : ""}>${escapeHtml(school)}</option>`).join("")}`;
  }
})();
