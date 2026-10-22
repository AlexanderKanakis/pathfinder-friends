(function (root, factory) {
  const api = factory(root);
  if (root) root.PFTemplateData = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const DATA_PATH = "data/templates.json";
  let cache = null;

  const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
  const slugify = (value = "") =>
    String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "template";

  function normalizeTemplate(entry = {}) {
    const name = String(entry.name || "Unnamed Template").trim();
    return {
      ...clone(entry),
      id: String(entry.id || slugify(name)),
      name,
      crAdjustment: String(entry.crAdjustment || ""),
      templateType: String(entry.templateType || ""),
      simple: Boolean(entry.simple),
      usableWithSummons: Boolean(entry.usableWithSummons),
      source: String(entry.source || ""),
      sourceUrl: String(entry.sourceUrl || ""),
      url: String(entry.url || ""),
      descriptionHtml: String(entry.descriptionHtml || ""),
      passiveMechanics:
        entry.passiveMechanics && typeof entry.passiveMechanics === "object"
          ? clone(entry.passiveMechanics)
          : {},
      activeMechanics:
        entry.activeMechanics && typeof entry.activeMechanics === "object"
          ? clone(entry.activeMechanics)
          : {},
    };
  }

  function normalizeData(data = {}) {
    return {
      source: data.source || DATA_PATH,
      generatedAt: data.generatedAt || "",
      schemaVersion: 1,
      templates: (Array.isArray(data.templates) ? data.templates : [])
        .map(normalizeTemplate)
        .filter((entry) => entry.name),
    };
  }

  async function load({ fresh = false } = {}) {
    if (!fresh && cache) return clone(cache);
    const response = await fetch(DATA_PATH, { cache: fresh ? "reload" : "no-cache" });
    if (!response.ok) throw new Error("Could not load data/templates.json.");
    cache = normalizeData(await response.json());
    return clone(cache);
  }

  function byIds(data = {}, ids = []) {
    const wanted = new Set((Array.isArray(ids) ? ids : []).map(String));
    return (Array.isArray(data.templates) ? data.templates : []).filter((entry) =>
      wanted.has(String(entry.id)),
    );
  }

  function effectSource(template = {}, group = "passive") {
    const mechanics =
      group === "active"
        ? root.PFEffectMechanics?.activeMechanics?.(template) ||
          template.activeMechanics ||
          {}
        : root.PFEffectMechanics?.passiveMechanics?.(template) ||
          template.passiveMechanics ||
          {};
    const hasMechanics = root.PFEffectMechanics?.hasAnyMechanics?.(mechanics);
    if (group === "active" && !hasMechanics) return null;
    const id = String(template.id || slugify(template.name));
    return {
      ...clone(mechanics),
      id: `template:${id}:${group}`,
      name: `Template: ${template.name || "Template"}`,
      category: "Racial Template",
      source: "Template",
      permanent: group === "passive",
      passiveSource: group === "passive",
      bonuses: clone(mechanics.effects || []),
      description: template.descriptionHtml || "",
      detailUrl: template.url || "",
      detailData: {
        type: "Racial Template",
        descriptionHtml: template.descriptionHtml || "",
        crAdjustment: template.crAdjustment || "",
        templateType: template.templateType || "",
        source: template.source || "",
      },
    };
  }

  function effectsForIds(data = {}, ids = [], group = "passive") {
    return byIds(data, ids)
      .map((template) => effectSource(template, group))
      .filter(Boolean);
  }

  function reset() {
    cache = null;
  }

  return {
    DATA_PATH,
    byIds,
    effectSource,
    effectsForIds,
    load,
    normalizeData,
    normalizeTemplate,
    reset,
    slugify,
  };
});
