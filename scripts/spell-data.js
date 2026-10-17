(function () {
  const SPELLS_URL = "./data/spells.json";
  const DESCRIPTORS_URL = "./data/spell-descriptors.json";
  const DOMAINS_URL = "./data/domains.json";
  let spellsPromise = null;
  let descriptorsPromise = null;
  let domainsPromise = null;

  async function jsonFrom(url, fallback) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return fallback;
    const data = await response.json();
    return data ?? fallback;
  }

  async function loadSpells() {
    spellsPromise ||= jsonFrom(SPELLS_URL, []).then((data) => {
      const spells = Array.isArray(data) ? data : data.spells || [];
      window.items = spells;
      return spells;
    });
    return spellsPromise;
  }

  async function loadDescriptors() {
    descriptorsPromise ||= jsonFrom(DESCRIPTORS_URL, { descriptors: [] }).then(
      (data) => (Array.isArray(data) ? data : data.descriptors || []),
    );
    return descriptorsPromise;
  }

  async function loadDomains() {
    domainsPromise ||= jsonFrom(DOMAINS_URL, { domains: [] }).then(
      (data) => (Array.isArray(data) ? data : data.domains || []),
    );
    return domainsPromise;
  }

  function spellDescriptors(spell = {}) {
    return Array.isArray(spell.details?.descriptors)
      ? spell.details.descriptors.filter(Boolean)
      : [];
  }

  function schoolWithDescriptors(spell = {}) {
    const school = String(spell.details?.school || "").trim();
    const descriptors = spellDescriptors(spell);
    return descriptors.length
      ? `${school} [${descriptors.join(", ")}]`
      : school;
  }

  function adjustCasterLevelResult(
    result = {},
    calculatedCasterLevel = 1,
    requestedCasterLevel = calculatedCasterLevel,
    { preservePartModifiers = false } = {},
  ) {
    const base = Number(result.base || 0);
    const calculatedTotal = Number(result.total ?? base);
    const calculatedCore = Math.max(1, Number(calculatedCasterLevel) || 1);
    const requestedCore = Math.max(
      1,
      Number.isFinite(Number(requestedCasterLevel))
        ? Number(requestedCasterLevel)
        : calculatedCore,
    );
    const adjustment = requestedCore - calculatedCore;
    const total = Math.max(
      1,
      preservePartModifiers
        ? calculatedTotal + adjustment
        : requestedCore,
    );
    if (total === calculatedTotal) return result;
    return {
      ...result,
      total,
      bonus: total - base,
      calculatedTotal,
      calculatedBonus: calculatedTotal - base,
      miscCasterLevelBonus: Math.max(0, total - calculatedTotal),
      downcastBy: Math.max(0, calculatedTotal - total),
      downcastFrom: calculatedTotal,
    };
  }

  function reset() {
    spellsPromise = null;
    descriptorsPromise = null;
    domainsPromise = null;
  }

  window.items = window.items || [];
  window.PFSpellData = {
    dataPath: SPELLS_URL,
    descriptorPath: DESCRIPTORS_URL,
    domainPath: DOMAINS_URL,
    loadSpells,
    loadDescriptors,
    loadDomains,
    spellDescriptors,
    schoolWithDescriptors,
    adjustCasterLevelResult,
    reset,
  };

})();
