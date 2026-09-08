(function () {
  const SPELLS_URL = "./data/spells.json";
  const DESCRIPTORS_URL = "./data/spell-descriptors.json";
  let spellsPromise = null;
  let descriptorsPromise = null;

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

  window.items = window.items || [];
  window.PFSpellData = {
    dataPath: SPELLS_URL,
    descriptorPath: DESCRIPTORS_URL,
    loadSpells,
    loadDescriptors,
    spellDescriptors,
    schoolWithDescriptors,
  };

  loadSpells().catch((error) => {
    console.warn("Could not preload spell data", error);
  });
})();