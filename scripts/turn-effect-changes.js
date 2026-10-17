(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PFTurnEffectChanges = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const KINDS = Object.freeze({
    DURATION_ONLY: "duration-only",
    MECHANICS_CHANGED: "mechanics-changed",
    EFFECT_EXPIRED: "effect-expired",
    AURA_MEMBERSHIP_CHANGED: "aura-membership-changed",
    AURA_EXPIRED: "aura-expired",
  });
  const VALID_KINDS = new Set(Object.values(KINDS));
  const PRIORITY = Object.freeze({
    [KINDS.DURATION_ONLY]: 0,
    [KINDS.MECHANICS_CHANGED]: 1,
    [KINDS.EFFECT_EXPIRED]: 2,
    [KINDS.AURA_MEMBERSHIP_CHANGED]: 3,
    [KINDS.AURA_EXPIRED]: 4,
  });

  function isAuraEffect(effect = {}) {
    return Boolean(
      effect.auraController ||
        effect.auraConfig?.enabled ||
        effect.aura?.enabled ||
        effect.independentAuraToken ||
        effect.linkedAuraId,
    );
  }

  function normalizeKind(change = {}) {
    const explicit = String(change.change_kind || change.changeKind || "").trim();
    if (VALID_KINDS.has(explicit)) return explicit;
    if (change.aura_membership_changed || change.auraMembershipChanged)
      return KINDS.AURA_MEMBERSHIP_CHANGED;
    if (change.mechanics_changed || change.mechanicsChanged)
      return KINDS.MECHANICS_CHANGED;
    const expired = Array.isArray(change.expired_effects)
      ? change.expired_effects
      : Array.isArray(change.expiredEffects)
        ? change.expiredEffects
        : [];
    if (expired.length)
      return expired.some(isAuraEffect) ? KINDS.AURA_EXPIRED : KINDS.EFFECT_EXPIRED;
    return KINDS.DURATION_ONLY;
  }

  function requiresRecalculation(change = {}) {
    return normalizeKind(change) !== KINDS.DURATION_ONLY;
  }

  function activeBuffs(change = {}) {
    if (Array.isArray(change.active_buffs)) return change.active_buffs;
    if (Array.isArray(change.activeBuffs)) return change.activeBuffs;
    return null;
  }

  function coalesce(changes = []) {
    const grouped = new Map();
    (Array.isArray(changes) ? changes : []).forEach((change) => {
      if (!change?.target_type || !change?.target_id) return;
      const key = String(change.target_type) + ":" + String(change.target_id);
      const kind = normalizeKind(change);
      const previous = grouped.get(key);
      const expired = [
        ...(previous?.expired_effects || []),
        ...(Array.isArray(change.expired_effects) ? change.expired_effects : []),
      ];
      const uniqueExpired = [...new Map(expired.map((effect, index) => [
        String(effect?.id || effect?.name || index),
        effect,
      ])).values()];
      grouped.set(key, {
        ...(previous || {}),
        ...change,
        active_buffs: activeBuffs(change) ?? previous?.active_buffs ?? null,
        expired_effects: uniqueExpired,
        change_kind:
          !previous || PRIORITY[kind] >= PRIORITY[previous.change_kind]
            ? kind
            : previous.change_kind,
      });
    });
    return [...grouped.values()];
  }

  return { KINDS, activeBuffs, coalesce, isAuraEffect, normalizeKind, requiresRecalculation };
});
