(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectDecisions = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const PLAYER_CHOOSES = "player-chooses";
  const CASTER = "caster";
  const TARGET = "target";

  function hasDirectDecision(value = {}) {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value.branches) && value.branches.length > 1) return true;
    if (
      Array.isArray(value.contributionOptions) &&
      value.contributionOptions.length
    )
      return true;
    if (
      Array.isArray(value.conditionalVariables) &&
      value.conditionalVariables.length
    )
      return true;
    if (Array.isArray(value.choicePools) && value.choicePools.length) return true;
    if (value.chooseContributionsOnActivate === true) return true;
    if (value.chooseOnApply === true) return true;
    if (/^choice:/.test(String(value.stat || ""))) return true;
    if (
      [value.ability, value.attribute, value.targetAbility, value.stat].some(
        (entry) => String(entry || "").toLowerCase() === PLAYER_CHOOSES,
      )
    )
      return true;
    if (value.spellChoiceListId || value.spellChoiceList) return true;
    if (
      Array.isArray(value.summonCreatures) &&
      value.summonCreatures.some((entry) => !entry?.selectedMonsterKey)
    )
      return true;
    return false;
  }

  function hasDecision(value, seen = new WeakSet()) {
    if (!(seen instanceof WeakSet)) seen = new WeakSet();
    if (!value || typeof value !== "object") return false;
    if (seen.has(value)) return false;
    seen.add(value);
    if (hasDirectDecision(value)) return true;
    const children = Array.isArray(value) ? value : Object.values(value);
    return children.some((child) => hasDecision(child, seen));
  }

  function decisionOwner(value = {}) {
    if (!hasDecision(value)) return CASTER;
    if (
      Array.isArray(value.summonCreatures) &&
      value.summonCreatures.some(
        (entry) => entry?.targetChooses && !entry?.selectedMonsterKey,
      )
    )
      return TARGET;
    return String(value.decisionOwner || "").toLowerCase() === TARGET
      ? TARGET
      : CASTER;
  }

  function hasOwnedDecision(value, owner) {
    return hasDecision(value) && decisionOwner(value) === owner;
  }

  function bindFilterButton(button, onChange) {
    if (!button) return;
    const render = (active) => {
      button.classList.toggle("btn-info", active);
      button.classList.toggle("text-dark", active);
      button.classList.toggle("btn-outline-info", !active);
      button.setAttribute("aria-pressed", String(active));
    };
    render(false);
    button.addEventListener("click", () => {
      const active = button.getAttribute("aria-pressed") !== "true";
      render(active);
      onChange?.(active);
    });
  }

  return {
    CASTER,
    TARGET,
    hasDecision,
    hasDirectDecision,
    decisionOwner,
    hasOwnedDecision,
    bindFilterButton,
  };
});
