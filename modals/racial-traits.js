(function () {
  const MODAL_ID = "racialTraitsModal";
  let modal = null;
  let state = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function traitKey(value = "") {
    return (
      String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^(?:and|or|the)\s+/i, "")
        .replace(/[^a-z0-9]+/g, "") || ""
    );
  }

  function traitNameKey(trait = {}) {
    return traitKey(trait.name || trait.trait || "");
  }

  function relationKeys(values = []) {
    return new Set(
      (Array.isArray(values) ? values : []).map(traitKey).filter(Boolean),
    );
  }

  function claimedStandardTraitKeys(trait = {}) {
    return new Set([
      ...relationKeys(trait.replaces),
      ...relationKeys(trait.modifies),
    ]);
  }

  function selectedTraits() {
    const selected = new Set((state.selected || []).map(traitKey));
    return (state.race.alternateTraits || []).filter((trait) =>
      selected.has(traitNameKey(trait)),
    );
  }

  function replacedStandardMap() {
    const map = new Map();
    selectedTraits().forEach((trait) => {
      relationKeys(trait.replaces).forEach((key) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(trait.name || "Alternate Trait");
      });
    });
    return map;
  }

  function selectedNameSet() {
    return new Set((state.selected || []).map(traitKey));
  }

  function mechanicChoiceStats(items = []) {
    return (Array.isArray(items) ? items : []).some((item) =>
      window.PFEffectStats?.isChoiceStat?.(item?.stat),
    );
  }

  function mechanicFavoredEnemyScaleChoices(items = []) {
    return (Array.isArray(items) ? items : []).some((item) => {
      const source = (item?.bonusScale || item?.scale || {}).source || {};
      if (
        source.type !== "special" ||
        source.special !== "favored-enemy-bonus"
      )
        return false;
      return !(
        item?.bonusScale?.favoredEnemyTarget ||
        item?.bonusScale?.target ||
        item?.scale?.favoredEnemyTarget ||
        item?.scale?.target ||
        item?.favoredEnemyTarget ||
        item?.targetFavoredEnemy ||
        (item?.appliesWhen &&
          !/favou?red enemy|\{[^{}]+\}/i.test(item.appliesWhen))
      );
    });
  }

  function spellLikeChoiceList(entry = {}) {
    return (
      entry?.spellChoiceList ||
      window.PFEffectStats?.customSpellLikeListById?.(
        entry?.spellChoiceListId || "",
      ) ||
      null
    );
  }

  function mechanicSpellLikeChoices(items = []) {
    return (Array.isArray(items) ? items : []).some(spellLikeChoiceList);
  }

  function mechanicSpellAdjustmentChoices(items = []) {
    return (Array.isArray(items) ? items : []).some((item) =>
      window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(item),
    );
  }

  function mechanicGrantDomainChoices(items = []) {
    return (Array.isArray(items) ? items : []).some((item) =>
      window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(item),
    );
  }

  function operationNeedsChoice(key = "", value = {}) {
    return (
      ((key === "bonusRanks" || key === "effects" || key === "classSkillGrants") &&
        window.PFEffectStats?.isChoiceStat?.(value?.stat)) ||
      mechanicFavoredEnemyScaleChoices([value]) ||
      (key === "spellLikeAbilities" && spellLikeChoiceList(value)) ||
      ((key === "casterLevelBonuses" ||
        key === "spellDcBonuses" ||
        key === "effectiveAttributeBonuses") &&
        mechanicSpellAdjustmentChoices([value])) ||
      (key === "grantDomains" && mechanicGrantDomainChoices([value]))
    );
  }

  function overrideChoiceStats(override = {}) {
    return Object.entries(override.mechanicOverrides || {}).some(
      ([key, operations]) =>
        [
          "effects",
          "classSkillGrants",
          "bonusRanks",
          "spellLikeAbilities",
          "casterLevelBonuses",
          "spellDcBonuses",
          "effectiveAttributeBonuses",
          "grantDomains",
        ].includes(key) &&
        (Array.isArray(operations) ? operations : []).some((operation) =>
          operationNeedsChoice(key, operation?.value),
        ),
    );
  }

  function traitHasChoiceStats(trait = {}) {
    return (
      mechanicChoiceStats(trait.effects) ||
      mechanicFavoredEnemyScaleChoices(trait.effects) ||
      mechanicChoiceStats(trait.classSkillGrants) ||
      mechanicChoiceStats(trait.bonusRanks) ||
      mechanicSpellLikeChoices(trait.spellLikeAbilities) ||
      mechanicSpellAdjustmentChoices(trait.casterLevelBonuses) ||
      mechanicSpellAdjustmentChoices(trait.spellDcBonuses) ||
      mechanicSpellAdjustmentChoices(trait.effectiveAttributeBonuses) ||
      mechanicGrantDomainChoices(trait.grantDomains) ||
      (Array.isArray(trait.conditionalVariables) &&
        trait.conditionalVariables.length > 0) ||
      (Array.isArray(trait.choicePools) && trait.choicePools.length > 0) ||
      (Array.isArray(trait.pools) && trait.pools.length > 0) ||
      (trait.modifiedTraitOverrides || []).some(overrideChoiceStats)
    );
  }

  function effectiveStandardTrait(trait = {}) {
    const key = traitNameKey(trait);
    return (
      (state.effectiveStandardTraits || []).find(
        (candidate) => traitNameKey(candidate) === key,
      ) || trait
    );
  }

  function traitForChoiceKey(key = "") {
    const normalized = traitKey(key);
    return (
      (state.effectiveStandardTraits || []).find(
        (trait) => traitNameKey(trait) === normalized,
      ) ||
      (state.race.alternateTraits || []).find(
        (trait) => traitNameKey(trait) === normalized,
      ) ||
      (state.race.standardTraits || []).find(
        (trait) => traitNameKey(trait) === normalized,
      ) ||
      null
    );
  }

  function traitRequirementStatus(trait = {}) {
    if (typeof state.traitRequirementStatus !== "function") {
      return { met: true, label: "" };
    }
    const status = state.traitRequirementStatus(trait) || {};
    return {
      met: status.met !== false,
      label: status.label || "",
    };
  }

  function choiceControls(trait = {}) {
    if (trait.activatable || !traitHasChoiceStats(trait)) return "";
    const key = traitNameKey(trait);
    const choice = state.choices?.[key];
    const hasChoice = Boolean(choice);
    const summary =
      typeof state.choiceSummary === "function"
        ? state.choiceSummary(choice, trait)
        : "";
    const status = summary || (hasChoice ? "Selected" : "not selected");
    return `
      <div class="racial-trait-choice-row">
        <button
          class="btn btn-outline-info btn-sm racial-trait-choice-button"
          type="button"
          data-racial-trait-choice="${key}"
          title="${escapeHtml(status)}"
        >
          <span>${escapeHtml(status)}</span>
        </button>
      </div>
    `;
  }

  function searchableTrait(trait = {}) {
    return [
      trait.name || "",
      trait.category || "",
      trait.description || "",
      ...(trait.replaces || []),
      ...(trait.modifies || []),
    ]
      .join(" ")
      .toLowerCase();
  }

  function metaPills(trait = {}, replacedBy = []) {
    const pills = [];
    if (replacedBy.length) {
      pills.push(
        `<span class="racial-trait-pill is-replaces"><i class="bi bi-arrow-repeat"></i> Replaced by ${escapeHtml(replacedBy.join(", "))}</span>`,
      );
    }
    if ((trait.replaces || []).length) {
      pills.push(
        `<span class="racial-trait-pill is-replaces"><i class="bi bi-x-circle"></i> Replaces ${escapeHtml(trait.replaces.join(", "))}</span>`,
      );
    }
    if ((trait.modifies || []).length) {
      pills.push(
        `<span class="racial-trait-pill is-modifies"><i class="bi bi-pencil-square"></i> Modifies ${escapeHtml(trait.modifies.join(", "))}</span>`,
      );
    }
    if ((trait.modifiedTraitOverrides || []).length) {
      const names = trait.modifiedTraitOverrides
        .map((override) => override.trait || override.name || "")
        .filter(Boolean);
      if (names.length) {
        pills.push(
          `<span class="racial-trait-pill is-modifies"><i class="bi bi-sliders"></i> Overrides ${escapeHtml(names.join(", "))}</span>`,
        );
      }
    }
    const requirement = traitRequirementStatus(trait);
    if (requirement.label) {
      pills.push(
        `<span class="racial-trait-pill ${requirement.met ? "is-requirement" : "is-unmet"}"><i class="bi bi-shield-exclamation"></i> ${escapeHtml(requirement.label)}</span>`,
      );
    }
    return pills.length
      ? `<div class="racial-trait-meta">${pills.join("")}</div>`
      : "";
  }

  function descriptionAccordion(trait = {}) {
    return `
      <details class="racial-trait-details">
        <summary>Description</summary>
        <div class="racial-trait-description">${escapeHtml(trait.description || "No description available.")}</div>
      </details>
    `;
  }

  function selectedAlternateCard(trait = {}) {
    const requirement = traitRequirementStatus(trait);
    return `
      <article class="racial-trait-card is-selected${requirement.met ? "" : " is-unavailable"}">
        <div class="racial-trait-topline">
          <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
          <button
            class="btn btn-outline-warning btn-sm"
            type="button"
            data-racial-trait-toggle="${traitNameKey(trait)}"
          >
            <i class="bi bi-trash"></i>
            Remove
          </button>
        </div>
        ${metaPills(trait)}
        ${requirement.met ? choiceControls(trait) : ""}
        ${descriptionAccordion(trait)}
      </article>
    `;
  }

  function standardTraitCard(trait = {}, replacedBy = []) {
    const effectiveTrait = effectiveStandardTrait(trait);
    const requirement = traitRequirementStatus(effectiveTrait);
    const isUnavailable = !replacedBy.length && !requirement.met;
    const badgeClass = replacedBy.length
      ? "text-bg-warning"
      : isUnavailable
        ? "text-bg-secondary"
        : "text-bg-success";
    const badgeText = replacedBy.length
      ? "Replaced"
      : isUnavailable
        ? "Unavailable"
        : "Active";
    return `
      <article class="racial-trait-card${replacedBy.length ? " is-replaced" : ""}${isUnavailable ? " is-unavailable" : ""}">
        <div class="racial-trait-topline">
          <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
          <span class="badge ${badgeClass}">
            ${badgeText}
          </span>
        </div>
        ${metaPills(effectiveTrait, replacedBy)}
        ${replacedBy.length || !requirement.met ? "" : choiceControls(effectiveTrait)}
        ${descriptionAccordion(trait)}
      </article>
    `;
  }

  function traitGroup(title, cards) {
    if (!cards.length) return "";
    return `
      <div class="racial-trait-group">
        <div class="racial-trait-group-title">${escapeHtml(title)}</div>
        ${cards.join("")}
      </div>
    `;
  }

  function renderStandardTraits() {
    const replaced = replacedStandardMap();
    const traits = state.race.standardTraits || [];
    if (!traits.length)
      return `<div class="racial-trait-empty">No standard racial traits listed.</div>`;
    const activeCards = [];
    const replacedCards = [];
    traits.forEach((trait) => {
      const replacedBy = replaced.get(traitNameKey(trait)) || [];
      if (replacedBy.length) {
        replacedCards.push(standardTraitCard(trait, replacedBy));
      } else {
        activeCards.push(standardTraitCard(trait));
      }
    });
    const selectedAlternateCards = selectedTraits().map(selectedAlternateCard);
    return `
      <div class="racial-trait-list">
        ${traitGroup("Active Standard Traits", activeCards)}
        ${traitGroup("Selected Alternate Traits", selectedAlternateCards)}
        ${traitGroup("Replaced Standard Traits", replacedCards)}
      </div>
    `;
  }

  function filteredAlternateTraits() {
    const term = state.search.trim().toLowerCase();
    const selected = selectedNameSet();
    return (state.race.alternateTraits || [])
      .filter((trait) => !selected.has(traitNameKey(trait)))
      .filter((trait) => !term || searchableTrait(trait).includes(term))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }

  function renderAlternateTraits() {
    const traits = filteredAlternateTraits();
    if (!traits.length)
      return `<div class="racial-trait-empty">No alternate racial traits found.</div>`;
    return `
      <div class="racial-trait-list">
        ${traits
          .map((trait) => {
            const modifies = (trait.modifies || []).length;
            const requirement = traitRequirementStatus(trait);
            return `
              <article class="racial-trait-card${modifies ? " is-modifier" : ""}${requirement.met ? "" : " is-unavailable"}">
                <div class="racial-trait-topline">
                  <div class="racial-trait-name">${escapeHtml(trait.name || "Trait")}</div>
                  <button
                    class="btn btn-outline-info btn-sm"
                    type="button"
                    data-racial-trait-toggle="${traitNameKey(trait)}"
                    ${requirement.met ? "" : "disabled"}
                  >
                    <i class="bi bi-check2"></i>
                    ${requirement.met ? "Apply" : "Unavailable"}
                  </button>
                </div>
                ${metaPills(trait)}
                ${descriptionAccordion(trait)}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function render() {
    if (!state) return;
    const selectedCount = selectedTraits().length;
    document.getElementById("racialTraitsRaceName").textContent =
      state.race.name || "Race";
    document.getElementById("racialTraitsSelectedCount").textContent =
      selectedCount
        ? `${selectedCount} alternate${selectedCount === 1 ? "" : "s"} applied`
        : "No alternates applied";
    document.getElementById("racialTraitsStandard").innerHTML =
      renderStandardTraits();
    document.getElementById("racialTraitsAlternate").innerHTML =
      renderAlternateTraits();
    document
      .querySelectorAll("[data-racial-trait-toggle]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const key = button.dataset.racialTraitToggle;
          const trait = (state.race.alternateTraits || []).find(
            (candidate) => traitNameKey(candidate) === key,
          );
          toggleAlternateTrait(trait);
        });
      });
    document
      .querySelectorAll("[data-racial-trait-choice]")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const trait = traitForChoiceKey(button.dataset.racialTraitChoice);
          if (!trait || !state.onChoose) return;
          button.disabled = true;
          const changed = await state.onChoose(trait);
          state.choices = state.getChoices?.() || state.choices || {};
          button.disabled = false;
          if (changed) render();
        });
      });
  }

  async function toggleAlternateTrait(trait) {
    if (!trait) return;
    const key = traitNameKey(trait);
    const selected = selectedNameSet();
    if (selected.has(key)) {
      state.selected = state.selected.filter((name) => traitKey(name) !== key);
      state.onRemove?.(trait);
      state.choices = state.getChoices?.() || state.choices || {};
      state.onChange?.(state.selected.slice());
      render();
      return;
    }

    const incomingClaims = claimedStandardTraitKeys(trait);
    if (!traitRequirementStatus(trait).met) return;
    const canApply = state.onBeforeApply
      ? await state.onBeforeApply(trait)
      : true;
    if (!canApply) return;
    state.choices = state.getChoices?.() || state.choices || {};

    state.selected = state.selected.filter((name) => {
      const existing = (state.race.alternateTraits || []).find(
        (candidate) => traitNameKey(candidate) === traitKey(name),
      );
      if (!existing) return false;
      if (traitNameKey(existing) === key) return false;
      const existingClaims = claimedStandardTraitKeys(existing);
      for (const claimKey of incomingClaims) {
        if (existingClaims.has(claimKey)) {
          state.onRemove?.(existing);
          return false;
        }
      }
      return true;
    });
    state.selected.push(trait.name || "");
    state.onChange?.(state.selected.slice());
    render();
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary racial-traits-modal">
              <div class="modal-header border-secondary">
                <h5 class="modal-title" id="${MODAL_ID}Label">Racial Traits</h5>
              </div>
              <div class="modal-body">
                <div class="racial-traits-summary">
                  <span id="racialTraitsRaceName"></span>
                  <span id="racialTraitsSelectedCount"></span>
                </div>
                <section class="racial-traits-section">
                  <h6 class="racial-traits-heading"><strong>Standard Racial Traits</strong></h6>
                  <div id="racialTraitsStandard"></div>
                </section>
                <section class="racial-traits-section">
                  <h6 class="racial-traits-heading"><strong>Alternate Racial Traits</strong></h6>
                  <input
                    id="racialTraitsSearch"
                    class="form-control form-control-sm racial-trait-search"
                    placeholder="Search alternate racial traits"
                  />
                  <div id="racialTraitsAlternate"></div>
                </section>
              </div>
              <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );
    document
      .getElementById("racialTraitsSearch")
      .addEventListener("input", (event) => {
        state.search = event.target.value;
        render();
      });
  }

  window.PFRacialTraitsModal = {
    open(config = {}) {
      ensureModal();
      state = {
        race: config.race || {},
        selected: Array.isArray(config.selectedAlternateTraits)
          ? config.selectedAlternateTraits.slice()
          : [],
        search: "",
        effectiveStandardTraits: Array.isArray(config.effectiveStandardTraits)
          ? config.effectiveStandardTraits.slice()
          : [],
        choices:
          config.choices && typeof config.choices === "object"
            ? { ...config.choices }
            : {},
        getChoices:
          typeof config.getChoices === "function" ? config.getChoices : null,
        onChoose:
          typeof config.onChoose === "function" ? config.onChoose : null,
        onChange:
          typeof config.onChange === "function" ? config.onChange : null,
        onBeforeApply:
          typeof config.onBeforeApply === "function"
            ? config.onBeforeApply
            : null,
        onRemove:
          typeof config.onRemove === "function" ? config.onRemove : null,
        choiceSummary:
          typeof config.choiceSummary === "function" ? config.choiceSummary : null,
        traitRequirementStatus:
          typeof config.traitRequirementStatus === "function"
            ? config.traitRequirementStatus
            : null,
      };
      document.getElementById("racialTraitsSearch").value = "";
      render();
      modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById(MODAL_ID),
      );
      modal.show();
    },
  };
})();
