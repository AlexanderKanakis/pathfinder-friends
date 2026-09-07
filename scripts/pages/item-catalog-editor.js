// Local static-data editor for the core Pathfinder item catalogs
// (data/weapons.json, data/armor-shields.json, data/mundane-items.json,
// data/wondrous.json). Lets an admin create new catalog entries and
// edit every field on an existing one -- name/description/all the
// type-specific details (weapon/armor/shield/mundane/wondrous stats)
// plus Effects/Damage Reduction/Spell Resistance/Class Skill grants,
// via the single shared scripts/effect-editor.js mountEffectsAccordion
// every effect-authoring surface in the app mounts. The detail-field
// sets below mirror exactly what bag-of-holding.js's/character-sheet.js's
// Add/Edit Item modal edits for a Weapon/Armor/Shield (same field list,
// same option lists), plus the catalog-only bibliographic fields
// (cost/weight/source/link/etc.) that modal never needed to touch.
//
// Once an item is equipped/added to a character's inventory, its
// fields get copied into that character's own game_loot row at
// add-time (see normalizeWeaponSourceItem/normalizeArmorShieldSourceItem/
// normalizeMundaneSourceItem/normalizeWondrousSourceItem in
// bag-of-holding.js and character-sheet.js) -- editing the catalog
// here only affects items added AFTER the edit, matching how every
// other "pick from a source list" item already works in this app.

const WEAPON_TYPES = [
  "Melee Weapon (Light)",
  "Melee Weapon (One-Handed)",
  "Melee Weapon (Two-Handed)",
  "Ranged Weapon",
  "Firearm (One-Handed)",
  "Firearm (Two-Handed)",
  "Natural",
];
const WEAPON_ENCHANTMENTS = [
  "",
  "Adaptive",
  "Allying",
  "Anarchic",
  "Anchoring",
  "Axiomatic",
  "Bane",
  "Brilliant Energy",
  "Called",
  "Conductive",
  "Corrosive",
  "Corrosive Burst",
  "Cruel",
  "Cunning",
  "Dancing",
  "Defending",
  "Disruption",
  "Distance",
  "Flaming",
  "Flaming Burst",
  "Frost",
  "Furious",
  "Ghost Touch",
  "Holy",
  "Icy Burst",
  "Impact",
  "Keen",
  "Merciful",
  "Returning",
  "Seeking",
  "Shock",
  "Shocking Burst",
  "Speed",
  "Spell Storing",
  "Throwing",
  "Thundering",
  "Unholy",
  "Vicious",
  "Vorpal",
  "Wounding",
];
const ARMOR_ENCHANTMENTS = [
  "",
  "Balanced",
  "Benevolent",
  "Bitter",
  "Bolstering",
  "Brawling",
  "Champion",
  "Dastard",
  "Deathless",
  "Defiant",
  "Determination",
  "Energy Resistance",
  "Energy Resistance (Improved)",
  "Energy Resistance (Greater)",
  "Etherealness",
  "Fortification (Light)",
  "Fortification (Moderate)",
  "Fortification (Heavy)",
  "Ghost Touch",
  "Glamered",
  "Invulnerability",
  "Shadow",
  "Shadow (Improved)",
  "Shadow (Greater)",
  "Slick",
  "Slick (Improved)",
  "Slick (Greater)",
  "Spell Resistance (13)",
  "Spell Resistance (15)",
  "Spell Resistance (17)",
  "Spell Resistance (19)",
  "Wild",
];
const SHIELD_ENCHANTMENTS = [
  "",
  "Animated",
  "Arrow Catching",
  "Arrow Deflection",
  "Bashing",
  "Blinding",
  "Clangorous",
  "Defiant",
  "Determination",
  "Energy Resistance",
  "Energy Resistance (Improved)",
  "Energy Resistance (Greater)",
  "Fortification (Light)",
  "Fortification (Moderate)",
  "Fortification (Heavy)",
  "Ghost Touch",
  "Impervious",
  "Merging",
  "Mirrored",
  "Poison-Resistant",
  "Rallying",
  "Ramming",
  "Reflecting",
  "Spell Resistance (13)",
  "Spell Resistance (15)",
  "Spell Resistance (17)",
  "Spell Resistance (19)",
  "Wild",
];
const MUNDANE_CATEGORIES = [
  "Adventuring Gear",
  "Alchemical Creations",
  "Books, Paper, & Writing Supplies",
  "Clothing & Containers",
  "Locks, Keys, Tools & Kits",
  "Religious Items",
  "Toys & Games",
];
const ABILITY_SCALES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

let catalogs = {}; // key -> array of items (in-memory, mutated on commit)
let activeCatalogKey = "weapons";
let selectedIndex = -1;
let searchTerm = "";
let dirty = false;
let projectDirectoryHandle = null;
let dataDirectoryHandle = null;
// Effects + DR/SR/Class Skill grants for the currently-open item --
// re-mounted each renderSelectedItem() call (see below) via the shared
// scripts/effect-editor.js accordion, since this panel rebuilds its
// whole innerHTML per selection rather than resetting a long-lived
// modal like the other effect-authoring surfaces.
let currentEffectsAccordion = null;

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionListHtml(options, selected = "", emptyLabel = "None") {
  const entries = options.includes(selected) ? options : [...options, selected];
  return entries
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value) || emptyLabel}</option>`,
    )
    .join("");
}

function isFirearmWeaponType(type) {
  return String(type || "").includes("Firearm");
}

// Same "toggle which ability scores apply" widget bag-of-holding.js's/
// character-sheet.js's Add Item modal uses for attack/damage scaling,
// joined into a single "STR + DEX"-style string on a hidden input.
function scaleButtonsHtml(name, value) {
  const active = new Set(
    String(value || "STR")
      .split("+")
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean),
  );
  if (!active.size) active.add("STR");
  return `
    <input type="hidden" data-detail-field="${name}" value="${escapeHtml([...active].join(" + "))}">
    <div class="scale-options" data-scale-group="${name}">
      ${ABILITY_SCALES.map(
        (ability) =>
          `<button class="btn btn-sm ${active.has(ability) ? "btn-primary" : "btn-outline-light"}" type="button" data-scale-ability="${ability}">${ability}</button>`,
      ).join("")}
    </div>
  `;
}

function wireScaleButtons(container) {
  container.querySelectorAll("[data-scale-group]").forEach((group) => {
    const hiddenInput = container.querySelector(
      `[data-detail-field="${group.dataset.scaleGroup}"]`,
    );
    group.querySelectorAll("[data-scale-ability]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [...group.querySelectorAll(".btn-primary")].map(
          (btn) => btn.dataset.scaleAbility,
        );
        hiddenInput.value = (selected.length ? selected : ["STR"]).join(" + ");
        setDirty(true);
      });
    });
  });
}

function setStatus(message, type = "info") {
  const status = el("itemEditorStatus");
  if (!message) {
    status.classList.add("d-none");
    return;
  }
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
}

function setDirty(value = true) {
  dirty = value;
  renderItemList();
}

function currentItems() {
  return catalogs[activeCatalogKey] || [];
}

async function loadCatalogIfNeeded(key) {
  if (catalogs[key]) return catalogs[key];
  const items = (await window.PFItemData?.loadCatalog(key)) || [];
  catalogs[key] = items;
  return items;
}

function catalogLabel(key) {
  return window.PFItemData?.CATALOGS?.[key]?.label || key;
}

// A brand-new entry for each catalog, shaped exactly like the existing
// entries that catalog's file already stores (see the sample shapes in
// data/weapons.json/armor-shields.json/mundane-items.json/wondrous.json).
function createBlankItem(key) {
  if (key === "weapons") {
    return {
      name: "New Weapon",
      description: "",
      count: 1,
      type: "Weapon",
      details: {
        source: "d20pfsrd weapons",
        proficiency: "",
        weaponGroup: "",
        weaponType: "Melee Weapon (One-Handed)",
        attackScale: "STR",
        damage: "",
        damageSmall: "",
        critical: "",
        damageScale: "STR",
        enhancement: "0",
        enchantment: "",
        range: "",
        cost: "",
        weight: "",
        damageType: "",
        special: "",
        sourceBook: "",
        link: "",
      },
      effects: [],
    };
  }
  if (key === "armorShields") {
    return {
      name: "New Armor",
      description: "",
      count: 1,
      type: "Armor",
      details: {
        source: "d20pfsrd armor",
        armorGroup: "Armor",
        bonus: "0",
        enhancement: "0",
        enchantment: "",
        maxDex: "",
        penalty: "",
        failure: "",
        speed30: "",
        speed20: "",
        cost: "",
        weight: "",
        sourceBook: "",
        link: "",
        summary: "",
      },
      effects: [],
    };
  }
  if (key === "mundaneItems") {
    return {
      id: `mundane:new:${Date.now()}`,
      sourceType: "Mundane Item",
      name: "New Mundane Item",
      description: "",
      count: 1,
      type: "Item",
      details: {
        source: "Mundane Item",
        mundaneCategory: "Adventuring Gear",
        mundaneGroup: "",
        price: "",
        weight: "",
        sourceBook: "",
        link: "",
        summary: "",
      },
      effects: [],
    };
  }
  // wondrousItems
  return {
    name: "New Wondrous Item",
    details: {
      aura: "",
      cl: "",
      slot: "",
      price: "",
      weight: "",
      requirements: "",
      cost: "",
      description: "",
    },
    link: "",
    effects: [],
  };
}

function addNewItem() {
  commitSelectedItem();
  const item = createBlankItem(activeCatalogKey);
  const items = currentItems();
  items.push(item);
  catalogs[activeCatalogKey] = items;
  selectedIndex = items.length - 1;
  searchTerm = "";
  el("itemSearch").value = "";
  setDirty(true);
  renderSelectedItem();
  el("itemDetailName")?.focus();
  el("itemDetailName")?.select();
}

// Clones the currently-open item (including any unsaved edits, effects,
// and DR/SR/Class Skills) and inserts the copy right after it -- a
// quick way to author a family of near-identical items (+1/+2/+3
// weapon variants, size categories, etc.) without retyping every field.
function duplicateSelectedItem() {
  const items = currentItems();
  const item = items[selectedIndex];
  if (!item) return;
  commitSelectedItem();
  const duplicate = JSON.parse(JSON.stringify(items[selectedIndex]));
  duplicate.name = `${duplicate.name || "Item"} (Copy)`;
  if (duplicate.id) duplicate.id = `${activeCatalogKey}:copy:${Date.now()}`;
  items.splice(selectedIndex + 1, 0, duplicate);
  catalogs[activeCatalogKey] = items;
  selectedIndex += 1;
  setDirty(true);
  renderSelectedItem();
  el("itemDetailName")?.focus();
  el("itemDetailName")?.select();
}

function renderCatalogTabs() {
  const keys = Object.keys(window.PFItemData?.CATALOGS || {});
  el("catalogTabs").innerHTML = keys
    .map(
      (key) => `
    <button class="btn btn-sm ${key === activeCatalogKey ? "btn-primary" : "btn-outline-light"}" type="button" data-catalog-key="${key}">
      ${escapeHtml(catalogLabel(key))}
    </button>
  `,
    )
    .join("");
  el("catalogTabs")
    .querySelectorAll("[data-catalog-key]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        if (button.dataset.catalogKey === activeCatalogKey) return;
        commitSelectedItem();
        activeCatalogKey = button.dataset.catalogKey;
        selectedIndex = -1;
        renderCatalogTabs();
        await loadCatalogIfNeeded(activeCatalogKey);
        renderItemList();
        renderSelectedItem();
      });
    });
}

function itemHasEffects(item) {
  return Boolean(
    (Array.isArray(item.effects) && item.effects.length) ||
      (Array.isArray(item.damageReduction) && item.damageReduction.length) ||
      (Array.isArray(item.spellResistance) && item.spellResistance.length) ||
      (Array.isArray(item.immunities) && item.immunities.length) ||
      (Array.isArray(item.classSkillGrants) && item.classSkillGrants.length) ||
      (Array.isArray(item.sizeChanges) && item.sizeChanges.length) ||
      (Array.isArray(item.spellLikeAbilities) &&
        item.spellLikeAbilities.length) ||
      (Array.isArray(item.generatedEquipment) && item.generatedEquipment.length),
  );
}

function filteredItemIndexes() {
  const term = searchTerm.trim().toLowerCase();
  const items = currentItems();
  return items
    .map((_, index) => index)
    .filter((index) => {
      if (!term) return true;
      return String(items[index].name || "")
        .toLowerCase()
        .includes(term);
    });
}

function itemDescriptionPreview(item, maxLength = 90) {
  const text = String(item.description || "").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function renderItemList() {
  const items = currentItems();
  const indexes = filteredItemIndexes();
  el("itemCount").innerHTML =
    `${items.length} items${dirty ? ' <span class="dirty-dot" title="Unsaved changes"></span>' : ""}`;
  el("itemList").innerHTML =
    indexes
      .map((index) => {
        const item = items[index];
        return `
      <button class="btn ${index === selectedIndex ? "btn-primary" : "btn-outline-light"} btn-sm" type="button" data-item-index="${index}">
        <span class="item-list-entry">
          <span class="item-list-name-row">
            <span>${escapeHtml(item.name || "Unnamed Item")}</span>
            ${itemHasEffects(item) ? '<span class="item-effects-badge"><i class="bi bi-magic"></i></span>' : ""}
          </span>
          ${itemDescriptionPreview(item) ? `<span class="item-list-description">${escapeHtml(itemDescriptionPreview(item))}</span>` : ""}
        </span>
      </button>
    `;
      })
      .join("") || `<div class="small-text">No matching items.</div>`;
  el("itemList")
    .querySelectorAll("[data-item-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        commitSelectedItem();
        selectedIndex = Number(button.dataset.itemIndex);
        renderItemList();
        renderSelectedItem();
      });
    });
}

// ---------------------------------------------------------------
// Type-specific detail fields -- one HTML builder + one collector per
// catalog, mirroring exactly what bag-of-holding.js's/character-sheet.js's
// Add/Edit Item modal edits for a Weapon/Armor/Shield (same fields,
// same option lists), plus the plain bibliographic fields (cost/
// weight/source/link/etc.) that modal never exposed.
// ---------------------------------------------------------------
function textFieldHtml(
  field,
  label,
  value,
  { placeholder = "", type = "text", full = false, wrapperClass = "" } = {},
) {
  const classes = [full ? "grid-column-full" : "", wrapperClass]
    .filter(Boolean)
    .join(" ");
  return `
    <div class="${classes}">
      <label>${escapeHtml(label)}</label>
      <input data-detail-field="${field}" class="form-control form-control-sm" type="${type}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(placeholder)}">
    </div>
  `;
}

function selectFieldHtml(field, label, options, value, emptyLabel = "None") {
  return `
    <div>
      <label>${escapeHtml(label)}</label>
      <select data-detail-field="${field}" class="form-select form-select-sm">${optionListHtml(options, value || "", emptyLabel)}</select>
    </div>
  `;
}

function detailValue(container, field) {
  return container.querySelector(`[data-detail-field="${field}"]`)?.value ?? "";
}

function weaponDetailFieldsHtml(item) {
  const details = item.details || {};
  const firearm = isFirearmWeaponType(details.weaponType);
  return `
    ${selectFieldHtml("type", "Type", ["Weapon", "Item"], item.type || "Weapon", "Weapon")}
    <div>
      <label>Weapon Type</label>
      <select data-detail-field="weaponType" id="itemDetailWeaponType" class="form-select form-select-sm">${optionListHtml(WEAPON_TYPES, details.weaponType || "Melee Weapon (One-Handed)")}</select>
    </div>
    <div>
      <label>Attack Scales With</label>
      ${scaleButtonsHtml("attackScale", details.attackScale)}
    </div>
    ${textFieldHtml("damage", "Damage Dice", details.damage, { placeholder: "1d8" })}
    ${textFieldHtml("damageSmall", "Damage (Small)", details.damageSmall, { placeholder: "1d6" })}
    ${textFieldHtml("critical", "Critical", details.critical, { placeholder: "20/x2" })}
    <div>
      <label>Damage Scales With</label>
      ${scaleButtonsHtml("damageScale", details.damageScale)}
    </div>
    <div class="item-firearm-field ${firearm ? "" : "d-none"}">
      <label>Capacity</label>
      <input data-detail-field="capacity" class="form-control form-control-sm" type="number" min="0" value="${escapeHtml(details.capacity ?? "0")}">
    </div>
    ${textFieldHtml("misfire", "Misfire", details.misfire, {
      placeholder: "1 (5 ft.)",
      wrapperClass: `item-firearm-field ${firearm ? "" : "d-none"}`,
    })}
    <div>
      <label>Enhancement</label>
      <input data-detail-field="enhancement" class="form-control form-control-sm" type="number" min="0" max="5" value="${escapeHtml(details.enhancement ?? "0")}">
    </div>
    ${selectFieldHtml("enchantment", "Enchantment", WEAPON_ENCHANTMENTS, details.enchantment, "None")}
    ${textFieldHtml("range", "Range", details.range, { placeholder: "10 ft." })}
    ${textFieldHtml("proficiency", "Proficiency", details.proficiency, { placeholder: "Martial" })}
    ${textFieldHtml("weaponGroup", "Weapon Group", details.weaponGroup)}
    ${textFieldHtml("damageType", "Damage Type", details.damageType, { placeholder: "S, P, B" })}
    ${textFieldHtml("special", "Special", details.special, { full: true })}
    ${textFieldHtml("cost", "Cost", details.cost, { placeholder: "15 gp" })}
    ${textFieldHtml("weight", "Weight", details.weight, { placeholder: "4 lbs." })}
    ${textFieldHtml("sourceBook", "Source Book", details.sourceBook)}
    ${textFieldHtml("link", "Link", details.link, { full: true })}
    ${textFieldHtml("source", "Source", details.source || "d20pfsrd weapons")}
  `;
}

function collectWeaponDetails(item, container) {
  item.type = detailValue(container, "type") || "Weapon";
  item.details = {
    ...item.details,
    weaponType: detailValue(container, "weaponType") || "Melee Weapon (One-Handed)",
    attackScale: detailValue(container, "attackScale") || "STR",
    damage: detailValue(container, "damage").trim(),
    damageSmall: detailValue(container, "damageSmall").trim(),
    critical: detailValue(container, "critical").trim(),
    damageScale: detailValue(container, "damageScale") || "STR",
    capacity: detailValue(container, "capacity").trim(),
    misfire: detailValue(container, "misfire").trim(),
    enhancement: detailValue(container, "enhancement") || "0",
    enchantment: detailValue(container, "enchantment"),
    range: detailValue(container, "range").trim(),
    proficiency: detailValue(container, "proficiency").trim(),
    weaponGroup: detailValue(container, "weaponGroup").trim(),
    damageType: detailValue(container, "damageType").trim(),
    special: detailValue(container, "special").trim(),
    cost: detailValue(container, "cost").trim(),
    weight: detailValue(container, "weight").trim(),
    sourceBook: detailValue(container, "sourceBook").trim(),
    link: detailValue(container, "link").trim(),
    source: detailValue(container, "source").trim() || "d20pfsrd weapons",
  };
}

function armorShieldDetailFieldsHtml(item) {
  const details = item.details || {};
  const type = item.type === "Shield" ? "Shield" : "Armor";
  const enchantments = type === "Shield" ? SHIELD_ENCHANTMENTS : ARMOR_ENCHANTMENTS;
  return `
    <div>
      <label>Type</label>
      <select data-detail-field="type" id="itemDetailArmorType" class="form-select form-select-sm">${optionListHtml(["Armor", "Shield"], type, "Armor")}</select>
    </div>
    ${textFieldHtml("armorGroup", "Armor Group", details.armorGroup || type)}
    ${textFieldHtml("bonus", "Bonus", details.bonus, { placeholder: "+1" })}
    <div>
      <label>Enhancement</label>
      <input data-detail-field="enhancement" class="form-control form-control-sm" type="number" min="0" max="5" value="${escapeHtml(details.enhancement ?? "0")}">
    </div>
    ${selectFieldHtml("enchantment", "Enchantment", enchantments, details.enchantment, "None")}
    ${textFieldHtml("maxDex", "Max Dex", details.maxDex, { placeholder: "+4" })}
    ${textFieldHtml("penalty", "Armor Check Penalty", details.penalty)}
    ${textFieldHtml("failure", "Spell Failure", details.failure, { placeholder: "20%" })}
    ${textFieldHtml("speed30", "Speed (30 ft. base)", details.speed30, { placeholder: "20 ft." })}
    ${textFieldHtml("speed20", "Speed (20 ft. base)", details.speed20, { placeholder: "15 ft." })}
    ${textFieldHtml("cost", "Cost", details.cost, { placeholder: "150 gp" })}
    ${textFieldHtml("weight", "Weight", details.weight, { placeholder: "20 lbs." })}
    ${textFieldHtml("sourceBook", "Source Book", details.sourceBook)}
    ${textFieldHtml("link", "Link", details.link, { full: true })}
    ${textFieldHtml("summary", "Summary", details.summary, { full: true })}
    ${textFieldHtml("source", "Source", details.source || "d20pfsrd armor")}
  `;
}

function collectArmorShieldDetails(item, container) {
  item.type = detailValue(container, "type") === "Shield" ? "Shield" : "Armor";
  item.details = {
    ...item.details,
    armorGroup: detailValue(container, "armorGroup").trim() || item.type,
    bonus: detailValue(container, "bonus").trim() || "0",
    enhancement: detailValue(container, "enhancement") || "0",
    enchantment: detailValue(container, "enchantment"),
    maxDex: detailValue(container, "maxDex").trim(),
    penalty: detailValue(container, "penalty").trim(),
    failure: detailValue(container, "failure").trim(),
    speed30: detailValue(container, "speed30").trim(),
    speed20: detailValue(container, "speed20").trim(),
    cost: detailValue(container, "cost").trim(),
    weight: detailValue(container, "weight").trim(),
    sourceBook: detailValue(container, "sourceBook").trim(),
    link: detailValue(container, "link").trim(),
    summary: detailValue(container, "summary").trim(),
    source: detailValue(container, "source").trim() || "d20pfsrd armor",
  };
}

function mundaneDetailFieldsHtml(item) {
  const details = item.details || {};
  return `
    ${selectFieldHtml("mundaneCategory", "Category", MUNDANE_CATEGORIES, details.mundaneCategory || "Adventuring Gear")}
    ${textFieldHtml("mundaneGroup", "Group", details.mundaneGroup)}
    ${textFieldHtml("price", "Price", details.price, { placeholder: "5 gp" })}
    ${textFieldHtml("weight", "Weight", details.weight, { placeholder: "1 lb." })}
    ${textFieldHtml("sourceBook", "Source Book", details.sourceBook)}
    ${textFieldHtml("link", "Link", details.link, { full: true })}
    ${textFieldHtml("summary", "Summary", details.summary, { full: true })}
    ${textFieldHtml("source", "Source", details.source || "Mundane Item")}
  `;
}

function collectMundaneDetails(item, container) {
  item.type = "Item";
  item.details = {
    ...item.details,
    mundaneCategory: detailValue(container, "mundaneCategory") || "Adventuring Gear",
    mundaneGroup: detailValue(container, "mundaneGroup").trim(),
    price: detailValue(container, "price").trim(),
    weight: detailValue(container, "weight").trim(),
    sourceBook: detailValue(container, "sourceBook").trim(),
    link: detailValue(container, "link").trim(),
    summary: detailValue(container, "summary").trim(),
    source: detailValue(container, "source").trim() || "Mundane Item",
  };
}

function wondrousDetailFieldsHtml(item) {
  const details = item.details || {};
  return `
    ${textFieldHtml("slot", "Slot", details.slot, { placeholder: "wrists" })}
    ${textFieldHtml("aura", "Aura", details.aura, { placeholder: "moderate transmutation" })}
    ${textFieldHtml("casterLevel", "Caster Level", details.cl, { placeholder: "9th" })}
    ${textFieldHtml("price", "Price", details.price, { placeholder: "1,800 gp" })}
    ${textFieldHtml("weight", "Weight", details.weight, { placeholder: "1 lb." })}
    ${textFieldHtml("cost", "Construction Cost", details.cost)}
    ${textFieldHtml("requirements", "Requirements", details.requirements, { full: true })}
    ${textFieldHtml("link", "Link", item.link, { full: true })}
  `;
}

function collectWondrousDetails(item, container) {
  item.details = {
    ...item.details,
    slot: detailValue(container, "slot").trim(),
    aura: detailValue(container, "aura").trim(),
    cl: detailValue(container, "casterLevel").trim(),
    price: detailValue(container, "price").trim(),
    weight: detailValue(container, "weight").trim(),
    cost: detailValue(container, "cost").trim(),
    requirements: detailValue(container, "requirements").trim(),
  };
  item.link = detailValue(container, "link").trim();
}

const DETAIL_BUILDERS = {
  weapons: { html: weaponDetailFieldsHtml, collect: collectWeaponDetails },
  armorShields: {
    html: armorShieldDetailFieldsHtml,
    collect: collectArmorShieldDetails,
  },
  mundaneItems: { html: mundaneDetailFieldsHtml, collect: collectMundaneDetails },
  wondrousItems: {
    html: wondrousDetailFieldsHtml,
    collect: collectWondrousDetails,
  },
};

// Wondrous entries keep their description under details.description
// (the shape all ~3,158 scraped entries already use) instead of a
// top-level field like the other 3 catalogs.
function itemDescriptionValue(key, item) {
  if (key === "wondrousItems")
    return item.details?.description || item.description || "";
  return item.description || "";
}

function applyItemDescription(key, item, value) {
  if (key === "wondrousItems") {
    item.details = { ...item.details, description: value };
    return;
  }
  item.description = value;
}

function wireDetailFields(key, container) {
  wireScaleButtons(container);
  if (key === "weapons") {
    const weaponType = container.querySelector("#itemDetailWeaponType");
    weaponType?.addEventListener("change", () => {
      const firearm = isFirearmWeaponType(weaponType.value);
      container
        .querySelectorAll(".item-firearm-field")
        .forEach((field) => field.classList.toggle("d-none", !firearm));
    });
  }
  if (key === "armorShields") {
    container
      .querySelector("#itemDetailArmorType")
      ?.addEventListener("change", () => {
        commitSelectedItem();
        renderSelectedItem();
      });
  }
}

function renderSelectedItem() {
  const item = currentItems()[selectedIndex];
  if (!item) {
    el("itemEditorPanel").innerHTML =
      `<div class="small-text">Choose an item to edit.</div>`;
    return;
  }
  const builder = DETAIL_BUILDERS[activeCatalogKey];
  el("itemEditorPanel").innerHTML = `
    <div class="item-detail-header">
      <div class="d-flex justify-content-between align-items-end gap-2 flex-wrap">
        <div class="flex-grow-1">
          <label for="itemDetailName">Name</label>
          <input id="itemDetailName" class="form-control form-control-sm" value="${escapeHtml(item.name || "")}">
        </div>
        <button id="duplicateItemBtn" class="btn btn-outline-light btn-sm" type="button">
          <i class="bi bi-copy"></i> Duplicate
        </button>
      </div>
      <div class="mt-2">
        <label for="itemDetailDescription">Description</label>
        <textarea id="itemDetailDescription" class="form-control form-control-sm" rows="3">${escapeHtml(itemDescriptionValue(activeCatalogKey, item))}</textarea>
      </div>
    </div>

    <section class="level-card">
      <strong class="d-block mb-2">Item Details</strong>
      <div class="item-detail-grid">
        ${builder ? builder.html(item) : ""}
      </div>
    </section>

    <div id="itemEffectsAccordion"></div>
  `;

  currentEffectsAccordion = window.PFEffectEditor.mountEffectsAccordion(
    el("itemEffectsAccordion"),
    { idPrefix: "itemEffects", onChange: () => setDirty(true) },
  );
  currentEffectsAccordion.reset(item);
  wireDetailFields(activeCatalogKey, el("itemEditorPanel"));
  el("duplicateItemBtn").addEventListener("click", () => duplicateSelectedItem());

  // The panel element itself persists across renders (only its
  // innerHTML is swapped), so these delegated dirty-tracking listeners
  // only need binding once -- otherwise every re-render (switching
  // items, adding, duplicating, toggling armor/shield type) would pile
  // on 3 more, each still firing on every future edit.
  if (!el("itemEditorPanel").dataset.dirtyListenersBound) {
    el("itemEditorPanel").dataset.dirtyListenersBound = "true";
    el("itemEditorPanel").addEventListener("input", () => setDirty(true));
    el("itemEditorPanel").addEventListener("change", () => setDirty(true));
    el("itemEditorPanel").addEventListener("click", () => setDirty(true));
  }
}

// Writes the currently-open item's edited rows back into the
// in-memory catalog array. Called before switching items/catalogs/
// saving, exactly like class-editor.js's commitSelectedClass.
function commitSelectedItem() {
  const item = currentItems()[selectedIndex];
  if (!item || !currentEffectsAccordion) return;
  item.name = el("itemDetailName")?.value.trim() || item.name;
  if (el("itemDetailDescription"))
    applyItemDescription(
      activeCatalogKey,
      item,
      el("itemDetailDescription").value.trim(),
    );
  DETAIL_BUILDERS[activeCatalogKey]?.collect(item, el("itemEditorPanel"));
  const {
    effects,
    damageReduction,
    spellResistance,
    immunities,
    classSkillGrants,
    sizeChanges,
    spellLikeAbilities,
    generatedEquipment,
  } =
    currentEffectsAccordion.collect();
  item.effects = effects;
  item.damageReduction = damageReduction;
  item.spellResistance = spellResistance;
  item.immunities = immunities;
  item.classSkillGrants = classSkillGrants;
  item.sizeChanges = sizeChanges;
  item.spellLikeAbilities = spellLikeAbilities;
  item.generatedEquipment = generatedEquipment;
}

// ---------------------------------------------------------------
// Persistence -- writes the whole modified catalog array back to its
// source data/*.json file via the File System Access API, same
// pattern as class-editor.js's saveClassesFile.
// ---------------------------------------------------------------
async function ensureDataDirectoryHandle() {
  if (dataDirectoryHandle) return dataDirectoryHandle;
  if (!projectDirectoryHandle && window.showDirectoryPicker) {
    projectDirectoryHandle = await window.showDirectoryPicker({
      mode: "readwrite",
    });
  }
  if (!projectDirectoryHandle) return null;
  dataDirectoryHandle = await projectDirectoryHandle.getDirectoryHandle(
    "data",
    { create: true },
  );
  return dataDirectoryHandle;
}

async function openProjectFolder() {
  if (!window.showDirectoryPicker) {
    setStatus(
      "This browser cannot write directly to project folders.",
      "warning",
    );
    return;
  }
  await ensureDataDirectoryHandle();
  setStatus(
    "Project folder connected. Save writes directly into data/.",
    "success",
  );
}

async function saveCatalogFile(key) {
  const catalog = window.PFItemData.CATALOGS[key];
  const fileName = catalog.file.replace(/^data\//, "");
  const items = catalogs[key];
  if (!items) return false;
  const directory = await ensureDataDirectoryHandle();
  if (directory) {
    const fileHandle = await directory.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(`${JSON.stringify(items, null, 2)}\n`);
    await writable.close();
    return true;
  }
  const blob = new Blob([`${JSON.stringify(items, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return false;
}

async function saveCatalog() {
  commitSelectedItem();
  try {
    const wroteToProject = await saveCatalogFile(activeCatalogKey);
    setDirty(false);
    setStatus(
      wroteToProject
        ? `Saved ${catalogLabel(activeCatalogKey)} to data/${window.PFItemData.CATALOGS[activeCatalogKey].file.replace(/^data\//, "")}.`
        : `Downloaded ${catalogLabel(activeCatalogKey)} -- move it into data/ manually, or use Open Project Folder first to save directly.`,
      "success",
    );
  } catch (error) {
    setStatus(error.message || "Could not save this catalog.", "danger");
  }
}

el("itemSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderItemList();
});
el("openProjectFolderBtn").addEventListener("click", async () => {
  try {
    await openProjectFolder();
  } catch (error) {
    setStatus(error.message || "Could not open the project folder.", "danger");
  }
});
el("saveCatalogBtn").addEventListener("click", () => saveCatalog());
el("addItemBtn").addEventListener("click", () => addNewItem());

async function initItemCatalogEditor() {
  const user = await PFApp.requireAuth();
  if (!user) return;
  const admin = await PFApp.isAppAdmin();
  if (!admin) {
    document.querySelector("main").innerHTML =
      `<div class="alert alert-warning">Only app admins can access this tool.</div>`;
    return;
  }
  renderCatalogTabs();
  await loadCatalogIfNeeded(activeCatalogKey);
  renderItemList();
  renderSelectedItem();
}

initItemCatalogEditor();
