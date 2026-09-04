let bagContextKey = "general";
let bagCharacters = [];
let bagLoot = [];
let bagCurrentUserId = "";
let bagCanManageContext = false;
let sourceItems = [];
let lootModal;
let sourceItemModal;
let moveLootModal;
let deleteLootModal;
let pendingLootMove = null;
let pendingLootDelete = null;
let lootSearchTerm = "";
let sourceItemSearchTerm = "";
let returnToSourceItemsAfterClose = false;
let sourceItemCategory = "all";
let sourceItemMundaneCategory = "Adventuring Gear";
let bagViewMode = sessionStorage.getItem("pf_bag_view") || "full";
let editingLootId = null;
let sourceLootTemplateDetails = null;
let collapsedLootGroups = new Set();
// Effects + Extra grants -- mounted once (see DOMContentLoaded
// below) via the shared scripts/effect-editor.js accordion.
let lootEffectsAccordion = null;

const typeIcons = {
  Weapon: "bi bi-crosshair",
  Armor: "bi bi-shield-fill",
  Shield: "bi bi-shield",
  Item: "bi bi-gem",
};
const WEAPON_TYPES = [
  "Melee Weapon (Light)",
  "Melee Weapon (One-Handed)",
  "Melee Weapon (Two-Handed)",
  "Ranged Weapon",
  "Firearm (One-Handed)",
  "Firearm (Two-Handed)",
  "Natural",
];
const ITEM_SLOTS = PFItemEditor.DEFAULT_SLOTS;
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

function setBagView(mode) {
  bagViewMode = mode === "simplified" ? "simplified" : "full";
  sessionStorage.setItem("pf_bag_view", bagViewMode);
  const simple = bagViewMode === "simplified";
  el("bagFullViewBtn")?.classList.toggle("active", !simple);
  el("bagFullViewBtn")?.setAttribute(
    "aria-selected",
    !simple ? "true" : "false",
  );
  el("bagSimplifiedViewBtn")?.classList.toggle("active", simple);
  el("bagSimplifiedViewBtn")?.setAttribute(
    "aria-selected",
    simple ? "true" : "false",
  );
  renderLoot();
}

function optionList(options, selected = "") {
  return options
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${value || "None"}</option>`,
    )
    .join("");
}

function armorEnchantmentOptions(selected = "") {
  return `
    <option value="" ${selected === "" ? "selected" : ""}>None</option>
    <optgroup label="Armor">${optionList(ARMOR_ENCHANTMENTS.slice(1), selected)}</optgroup>
    <optgroup label="Shield">${optionList(SHIELD_ENCHANTMENTS.slice(1), selected)}</optgroup>
  `;
}

function setLootStatus(message, type = "info") {
  const status = el("lootStatus");
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
  status.classList.remove("d-none");
}

function clearLootStatus() {
  el("lootStatus").classList.add("d-none");
}

function characterLabel(character) {
  const owner = character?.username || character?.email || "";
  return owner
    ? `${character.name} (${owner})`
    : character?.name || "Unnamed character";
}

function isOwnBagCharacter(character) {
  return Boolean(bagCurrentUserId && character?.userId === bagCurrentUserId);
}

function orderedBagCharacters() {
  if (bagCanManageContext) return bagCharacters;
  const ownCharacters = bagCharacters.filter(isOwnBagCharacter);
  const otherCharacters = bagCharacters.filter(
    (character) => !isOwnBagCharacter(character),
  );
  return [...ownCharacters, ...otherCharacters];
}

function renderCharacterOptions(select, selectedCharacterId = "") {
  select.innerHTML = `<option value="">Unassigned</option>`;
  orderedBagCharacters().forEach((character) => {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = characterLabel(character);
    select.appendChild(option);
  });
  select.value = selectedCharacterId || "";
}

function itemGroupKey(item) {
  return item.assigned_character_id || "unassigned";
}

function collapsedLootStorageKey() {
  return `pf_bag_collapsed_groups_${bagContextKey}`;
}

function loadCollapsedLootGroups() {
  try {
    collapsedLootGroups = new Set(
      JSON.parse(localStorage.getItem(collapsedLootStorageKey()) || "[]"),
    );
  } catch {
    collapsedLootGroups = new Set();
  }
}

function applyRoleBasedCollapseDefaults() {
  if (bagCanManageContext) return;

  const ownCharacterIds = new Set(
    bagCharacters.filter(isOwnBagCharacter).map((character) => character.id),
  );
  collapsedLootGroups = new Set([
    "unassigned",
    ...bagCharacters
      .filter((character) => !ownCharacterIds.has(character.id))
      .map((character) => character.id),
  ]);
}

function saveCollapsedLootGroups() {
  localStorage.setItem(
    collapsedLootStorageKey(),
    JSON.stringify([...collapsedLootGroups]),
  );
}

function toggleLootGroup(groupKey) {
  if (collapsedLootGroups.has(groupKey)) collapsedLootGroups.delete(groupKey);
  else collapsedLootGroups.add(groupKey);
  saveCollapsedLootGroups();
  renderLoot();
}

function searchableLoot(item) {
  return `${item.name || ""} ${item.description || ""}`.toLowerCase();
}

function stripSourceHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value || "").replace(/^<\/h3>/i, "");
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

function normalizeWondrousSlot(value = "") {
  const slot = String(value || "")
    .toLowerCase()
    .trim();
  if (!slot || slot === "-") return "none";
  if (slot.includes("armor")) return "armor";
  if (slot.includes("shield")) return "shield";
  if (slot.includes("weapon")) return "weapon";
  if (slot.includes("ring")) return "ring";
  if (slot.includes("rod") || slot.includes("wand")) return "rod";
  if (slot.includes("staff")) return "staff";
  if (slot.includes("headband")) return "headband";
  if (slot.includes("head") || slot.includes("helm")) return "head";
  if (slot.includes("eye") || slot.includes("goggle")) return "eyes";
  if (
    slot.includes("neck") ||
    slot.includes("amulet") ||
    slot.includes("necklace")
  )
    return "neck";
  if (
    slot.includes("shoulder") ||
    slot.includes("cloak") ||
    slot.includes("mantle") ||
    slot.includes("back")
  )
    return "shoulders";
  if (slot.includes("wrist")) return "wrists";
  if (
    slot.includes("hand") ||
    slot.includes("glove") ||
    slot.includes("gauntlet")
  )
    return "hands";
  if (slot.includes("feet") || slot.includes("boot")) return "feet";
  if (slot.includes("belt")) return "belt";
  if (slot.includes("chest") || slot.includes("torso")) return "chest";
  if (slot.includes("body")) return "body";
  if (slot.includes("held")) return "held";
  if (slot.includes("none")) return "none";
  if (slot.includes("special") || slot.includes("see text")) return "special";
  return "other";
}

function typeIconHtml(type) {
  return `<i class="${typeIcons[type] || typeIcons.Item}"></i>`;
}

function wondrousSlotIcon(slot) {
  return getIconName(normalizeWondrousSlot(slot)) || typeIconHtml("Item");
}

function itemSlotLabel(item) {
  const slot = item?.details?.slot || "";
  return String(slot || "").trim();
}

function renderSlotValue(item) {
  const slot = itemSlotLabel(item);
  return slot
    ? `${wondrousSlotIcon(slot)}<span>${escapeHtml(slot)}</span>`
    : "";
}

function updateLootSlotPreview() {
  const slot = el("lootSlotInput").value.trim();
  el("lootSlotValue").innerHTML = slot ? wondrousSlotIcon(slot) : "";
}

function syncLootSlotForType() {
  PFItemEditor.syncSlotForType(lootEditorConfig());
}

function applyWondrousSource(details, checked) {
  if (checked) {
    details.source = "Wondrous Item";
  } else if (String(details.source || "").toLowerCase() === "wondrous item") {
    delete details.source;
  }
  return details;
}

function sourceItemIcon(itemOrType) {
  if (typeof itemOrType === "object") {
    const slot = itemSlotLabel(itemOrType);
    if (slot) return wondrousSlotIcon(slot);
  }
  const type = typeof itemOrType === "object" ? itemOrType?.type : itemOrType;
  return typeIconHtml(type);
}

function inferWondrousType(item) {
  const details = item.details || {};
  const slot = String(details.slot || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  if (slot.includes("shield") || name.includes("shield")) return "Shield";
  if (slot.includes("armor") || name.includes("armor")) return "Armor";
  if (slot.includes("weapon")) return "Weapon";
  return "Item";
}

function normalizeWondrousSourceItem(item, index) {
  const details = item.details || {};
  const type = inferWondrousType(item);
  const description = stripSourceHtml(
    details.description || item.description || "",
  );
  return {
    id: `wondrous:${index}`,
    sourceType: "Wondrous Item",
    name: item.name || "Wondrous Item",
    description,
    type,
    count: 1,
    details: {
      source: "Wondrous Item",
      aura: details.aura || "",
      casterLevel: details.cl || "",
      slot: details.slot || "",
      price: details.price || "",
      weight: details.weight || "",
      requirements: details.requirements || "",
      cost: details.cost || "",
      link: item.link || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
  };
}

function normalizeAlchemicalSourceItem(item, index) {
  const description = [
    ...(item.desc || []),
    ...(item.flavor || []),
    ...(Array.isArray(item.effect)
      ? item.effect
      : item.effect
        ? [item.effect]
        : []),
    item.damage || "",
    item.cure ? `Cure: ${item.cure}` : "",
    item.addiction ? `Addiction: ${item.addiction}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    id: `alchemical:${index}`,
    sourceType: "Alchemical Item",
    name: item.name || "Alchemical Item",
    description,
    type: "Item",
    count: 1,
    details: {
      source: "Alchemical Item",
      mundaneCategory: "Alchemical Creations",
      craftDc: item.dc || "",
      price: `${item.gp || 0} gp${item.sp ? `, ${item.sp} sp` : ""}${item.cp ? `, ${item.cp} cp` : ""}`,
      subtype: item.type || "",
      link: item.link || "",
    },
    effects: [],
  };
}

function normalizeMundaneSourceItem(item, index) {
  const details = item.details || {};
  return {
    id: `mundane:${index}`,
    sourceType: "Mundane Item",
    name: item.name || "Mundane Item",
    description: item.description || details.summary || "",
    type: "Item",
    count: item.count || 1,
    details: {
      source: "Mundane Item",
      mundaneCategory: details.mundaneCategory || "Adventuring Gear",
      mundaneGroup: details.mundaneGroup || "",
      price: details.price || "",
      weight: details.weight || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
      summary: details.summary || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
  };
}

function normalizeWeaponSourceItem(item, index) {
  const details = item.details || {};
  return {
    id: `weapon:${index}`,
    sourceType: "Weapon",
    name: item.name || "Weapon",
    description:
      item.description ||
      [
        details.proficiency,
        details.weaponGroup,
        details.damageType ? `Damage type: ${details.damageType}` : "",
        details.special ? `Special: ${details.special}` : "",
      ]
        .filter(Boolean)
        .join(". "),
    type: item.type || "Weapon",
    count: item.count || 1,
    details: {
      source: details.source || "d20pfsrd weapons",
      proficiency: details.proficiency || "",
      weaponGroup: details.weaponGroup || "",
      weaponType: details.weaponType || "Melee Weapon (One-Handed)",
      attackScale: details.attackScale || "STR",
      damage: details.damage || "",
      damageSmall: details.damageSmall || "",
      critical: details.critical || "",
      damageScale: details.damageScale || "STR",
      enhancement: details.enhancement || "0",
      enchantment: details.enchantment || "",
      range: details.range || "",
      cost: details.cost || "",
      weight: details.weight || "",
      damageType: details.damageType || "",
      special: details.special || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
  };
}

function normalizeFirearmSourceItem(item, index) {
  const normalized = normalizeWeaponSourceItem(item, index);
  normalized.id = `firearm:${index}`;
  normalized.sourceType = "Firearm";
  normalized.details = {
    ...normalized.details,
    source: item.details?.source || "d20pfsrd firearms",
    firearmEra: item.details?.firearmEra || "",
    misfire: item.details?.misfire || "",
    capacity: item.details?.capacity || "",
  };
  return normalized;
}

function normalizeArmorShieldSourceItem(item, index) {
  const details = item.details || {};
  const type = item.type === "Shield" ? "Shield" : "Armor";
  return {
    id: `${type.toLowerCase()}:${index}`,
    sourceType: type,
    name: item.name || type,
    description: item.description || details.summary || "",
    type,
    count: item.count || 1,
    details: {
      source: details.source || "d20pfsrd armor",
      armorGroup: details.armorGroup || type,
      bonus: details.bonus || "0",
      enhancement: details.enhancement || "0",
      enchantment: details.enchantment || "",
      maxDex: details.maxDex || "",
      penalty: details.penalty || "",
      failure: details.failure || "",
      speed30: details.speed30 || "",
      speed20: details.speed20 || "",
      cost: details.cost || "",
      weight: details.weight || "",
      sourceBook: details.sourceBook || "",
      link: details.link || "",
      summary: details.summary || "",
    },
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
  };
}

async function loadSourceItems() {
  const rawWondrousItems = window.PFItemData
    ? await window.PFItemData.loadWondrousItems()
    : [];
  const wondrous = Array.isArray(rawWondrousItems)
    ? rawWondrousItems.map(normalizeWondrousSourceItem)
    : [];
  let weapons = [];
  try {
    const response = await fetch("./data/weapons.json", { cache: "no-cache" });
    if (response.ok) {
      const data = await response.json();
      weapons = (Array.isArray(data) ? data : []).map(
        normalizeWeaponSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated weapons.json found yet.", error);
  }
  let firearms = [];
  try {
    const response = await fetch("./data/firearms.json", { cache: "no-cache" });
    if (response.ok) {
      const data = await response.json();
      firearms = (Array.isArray(data) ? data : []).map(
        normalizeFirearmSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated firearms.json found yet.", error);
  }
  let armorShields = [];
  try {
    const response = await fetch("./data/armor-shields.json", {
      cache: "no-cache",
    });
    if (response.ok) {
      const data = await response.json();
      armorShields = (Array.isArray(data) ? data : []).map(
        normalizeArmorShieldSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated armor-shields.json found yet.", error);
  }
  let alchemical = [];
  try {
    const module = await import("./data/alchemical-crafts.js");
    alchemical = (Array.isArray(module.items) ? module.items : [])
      .filter((item) => item.name && item.dc)
      .map(normalizeAlchemicalSourceItem);
  } catch (error) {
    console.error("Could not load alchemical item source data", error);
  }
  let mundane = [];
  try {
    const response = await fetch("./data/mundane-items.json", {
      cache: "no-cache",
    });
    if (response.ok) {
      const data = await response.json();
      mundane = (Array.isArray(data) ? data : []).map(
        normalizeMundaneSourceItem,
      );
    }
  } catch (error) {
    console.info("No generated mundane-items.json found yet.", error);
  }
  sourceItems = [
    ...weapons,
    ...firearms,
    ...armorShields,
    ...wondrous,
    ...mundane,
    ...alchemical,
  ].filter((item) => item.name && item.description);
}

function searchableSourceItem(item) {
  return `${item.name || ""} ${item.sourceType || ""} ${item.description || ""} ${Object.values(item.details || {}).join(" ")}`.toLowerCase();
}

function sourceItemSearchRank(item, term) {
  if (!term) return 0;
  return String(item.name || "")
    .toLowerCase()
    .includes(term)
    ? 0
    : 1;
}

function sourceItemMatchesCategory(item) {
  if (sourceItemCategory === "wondrous")
    return item.sourceType === "Wondrous Item";
  if (sourceItemCategory === "weapons")
    return ["Weapon", "Firearm"].includes(item.sourceType);
  if (sourceItemCategory === "armor") return item.type === "Armor";
  if (sourceItemCategory === "shields") return item.type === "Shield";
  if (sourceItemCategory === "mundane") {
    return (
      ["Mundane Item", "Alchemical Item"].includes(item.sourceType) &&
      (item.details?.mundaneCategory || "") === sourceItemMundaneCategory
    );
  }
  return true;
}

function renderSourceItemResults() {
  const wrapper = el("sourceItemResults");
  const count = el("sourceItemCount");
  renderSourceMundaneTabs();
  const term = sourceItemSearchTerm.trim().toLowerCase();
  if (sourceItemCategory === "all" && term.length < 3) {
    count.textContent = "0 items";
    wrapper.innerHTML = `<div class="small text-secondary">Type at least 3 characters to search all source items.</div>`;
    return;
  }
  const results = sourceItems
    .filter(sourceItemMatchesCategory)
    .filter((item) => searchableSourceItem(item).includes(term))
    .sort(
      (a, b) =>
        sourceItemSearchRank(a, term) - sourceItemSearchRank(b, term) ||
        String(a.name || "").localeCompare(String(b.name || "")),
    );
  count.textContent = `${results.length} item${results.length === 1 ? "" : "s"}`;
  if (!results.length) {
    wrapper.innerHTML = `<div class="small text-secondary">No matching source items found.</div>`;
    return;
  }
  wrapper.innerHTML = `
    <div class="source-results-grid">
      ${results
        .map(
          (item) => `
        <button class="source-result-card" type="button" data-source-item="${escapeHtml(item.id)}">
          <span class="source-result-icon">${sourceItemIcon(item)}</span>
          <div class="fw-semibold pe-2">${escapeHtml(item.name)}</div>
          <div class="loot-meta">${escapeHtml(item.sourceType)} | ${escapeHtml(item.type)}${itemSlotLabel(item) ? ` | Slot: ${escapeHtml(itemSlotLabel(item))}` : ""}</div>
          <div class="source-result-description mt-1">${escapeHtml(item.description)}</div>
        </button>
      `,
        )
        .join("")}
    </div>
  `;
  wrapper.querySelectorAll("[data-source-item]").forEach((button) => {
    button.addEventListener("click", () =>
      openSourceItemEditor(button.dataset.sourceItem),
    );
  });
}

function renderSourceMundaneTabs() {
  const tabs = el("sourceMundaneTabs");
  if (!tabs) return;
  const show = sourceItemCategory === "mundane";
  tabs.classList.toggle("d-none", !show);
  if (!show) return;
  tabs.innerHTML = MUNDANE_CATEGORIES.map(
    (category) => `
    <li class="source-list-tab-item" role="presentation">
      <button class="source-list-tab${sourceItemMundaneCategory === category ? " active" : ""}" type="button" data-source-mundane-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    </li>
  `,
  ).join("");
  tabs.querySelectorAll("[data-source-mundane-category]").forEach((button) => {
    button.addEventListener("click", () => {
      sourceItemMundaneCategory =
        button.dataset.sourceMundaneCategory || MUNDANE_CATEGORIES[0];
      renderSourceItemResults();
    });
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function populateLootForm(item, selectedCharacterId = "") {
  el("lootName").value = item.name || "";
  el("lootDescription").value = item.description || "";
  el("lootCount").value = item.count || 1;
  el("lootType").value = item.type || "Item";
  renderCharacterOptions(el("lootAssignedTo"), selectedCharacterId);

  const details = item.details || {};
  PFItemEditor.setSlot(lootEditorConfig(), details.slot || "");
  el("lootWondrousItem").checked =
    String(details.source || item.sourceType || "").toLowerCase() ===
    "wondrous item";
  updateLootSlotPreview();
  PFItemEditor.refreshDescription(lootEditorConfig());
  el("lootWeaponType").value =
    details.weaponType || "Melee Weapon (One-Handed)";
  setLootAttackScale(details.attackScale || "STR");
  el("lootDamageDice").value = details.damage || "";
  el("lootWeaponCritical").value = details.critical || "";
  el("lootWeaponCapacity").value = details.capacity || "";
  el("lootWeaponMisfire").value = details.misfire || "";
  setLootDamageScale(details.damageScale || "STR");
  el("lootWeaponEnhancement").value = details.enhancement || "0";
  el("lootWeaponEnchantment").value = details.enchantment || "";
  el("lootWeaponDetails").value =
    details.details || details.summary || details.special || "";
  el("lootArmorBonus").value = details.bonus || "0";
  el("lootArmorEnhancement").value = details.enhancement || "0";
  el("lootArmorEnchantment").value = details.enchantment || "";
  PFItemEditor.syncSpecialMaterialForType(
    lootEditorConfig(),
    details.specialMaterial || "",
  );
  lootEffectsAccordion.reset(item);
  toggleLootDetailFields();
  syncLootSlotForType();
}

function openSourceItemEditor(sourceItemId) {
  const source = sourceItems.find((item) => item.id === sourceItemId);
  if (!source) return;
  resetLootForm();
  editingLootId = null;
  sourceLootTemplateDetails = cloneJson(source.details);
  el("lootModalLabel").textContent = "Add Item";
  el("lootSubmitButton").textContent = "Add Item";
  populateLootForm({ ...source, count: 1 }, "");
  sourceItemModal.hide();
  lootModal.show();
}

function openSourceItemsModal() {
  sourceItemCategory = "all";
  sourceItemMundaneCategory = MUNDANE_CATEGORIES[0];
  sourceItemSearchTerm = "";
  el("sourceItemSearch").value = "";
  el("sourceItemTabs")
    .querySelectorAll("[data-source-category]")
    .forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.sourceCategory === "all");
    });
  renderSourceItemResults();
  sourceItemModal.show();
  setTimeout(() => el("sourceItemSearch").focus(), 150);
}

function renderLoot() {
  const grid = el("lootGrid");
  const visibleLoot = lootSearchTerm
    ? bagLoot.filter((item) => searchableLoot(item).includes(lootSearchTerm))
    : bagLoot;
  const groups = [
    { key: "unassigned", label: "Unassigned" },
    ...orderedBagCharacters().map((character) => ({
      key: character.id,
      label: characterLabel(character),
    })),
  ];

  grid.innerHTML = groups
    .map((group) => {
      const items = visibleLoot.filter(
        (item) => itemGroupKey(item) === group.key,
      );
      const collapsed = collapsedLootGroups.has(group.key);
      return `
      <div class="loot-group${collapsed ? " collapsed" : ""}">
        <div class="loot-group-header">
          <strong class="loot-group-title">${escapeHtml(group.label)}</strong>
          <span class="loot-group-actions">
            <span class="badge text-bg-secondary">${items.length}</span>
            <button class="btn btn-outline-light btn-sm loot-group-toggle" type="button" data-toggle-loot-group="${escapeHtml(group.key)}" aria-label="${collapsed ? "Expand" : "Collapse"} ${escapeHtml(group.label)}" title="${collapsed ? "Expand" : "Collapse"}">
              <i class="bi ${collapsed ? "bi-chevron-down" : "bi-chevron-up"}"></i>
            </button>
          </span>
        </div>
        <div class="loot-group-body">
          ${renderLootTypeSections(items)}
        </div>
      </div>
    `;
    })
    .join("");

  grid.querySelectorAll("[data-toggle-loot-group]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLootGroup(button.dataset.toggleLootGroup);
    });
  });
  grid.querySelectorAll("[data-loot-assign]").forEach((select) => {
    select.addEventListener("click", (event) => event.stopPropagation());
    select.addEventListener("change", (event) => {
      event.stopPropagation();
      assignLoot(select.dataset.lootAssign, select.value);
    });
  });
  grid.querySelectorAll("[data-delete-loot]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      requestLootDelete(button.dataset.deleteLoot);
    });
  });
  grid.querySelectorAll(".loot-card").forEach((card) => {
    card.addEventListener("click", () => openLootEditor(card.dataset.lootId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLootEditor(card.dataset.lootId);
      }
    });
  });
}

function toggleLootDetailFields() {
  const type = el("lootType").value;
  const firearm =
    type === "Weapon" && isFirearmWeaponType(el("lootWeaponType").value);
  el("lootWeaponFields").classList.toggle("d-none", type !== "Weapon");
  document
    .querySelectorAll(".loot-firearm-field")
    .forEach((field) => field.classList.toggle("d-none", !firearm));
  if (!firearm) {
    el("lootWeaponCapacity").value = "";
    el("lootWeaponMisfire").value = "";
  }
  el("lootArmorFields").classList.toggle(
    "d-none",
    !["Armor", "Shield"].includes(type),
  );
  el("lootArmorEnchantment").innerHTML = armorEnchantmentOptions(
    el("lootArmorEnchantment").value,
  );
  syncLootSlotForType();
}

function isFirearmWeaponType(type) {
  return String(type || "").includes("Firearm");
}

function setupLootScalingControls() {
  el("lootDamageScaleOptions")
    .querySelectorAll("[data-scale-ability]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [
          ...el("lootDamageScaleOptions").querySelectorAll(".btn-primary"),
        ].map((btn) => btn.dataset.scaleAbility);
        el("lootDamageScale").value = (
          selected.length ? selected : ["STR"]
        ).join(" + ");
      });
    });
  el("lootAttackScaleOptions")
    .querySelectorAll("[data-attack-scale-ability]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("btn-primary");
        button.classList.toggle("btn-outline-light");
        const selected = [
          ...el("lootAttackScaleOptions").querySelectorAll(".btn-primary"),
        ].map((btn) => btn.dataset.attackScaleAbility);
        el("lootAttackScale").value = (
          selected.length ? selected : ["STR"]
        ).join(" + ");
      });
    });
}

function setLootDamageScale(value = "STR") {
  const selected = String(value || "STR")
    .split("+")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
  const activeSet = new Set(selected.length ? selected : ["STR"]);
  el("lootDamageScale").value = [...activeSet].join(" + ");
  el("lootDamageScaleOptions")
    .querySelectorAll("[data-scale-ability]")
    .forEach((button) => {
      const active = activeSet.has(button.dataset.scaleAbility);
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-light", !active);
    });
}

function setLootAttackScale(value = "STR") {
  const selected = String(value || "STR")
    .split("+")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
  const activeSet = new Set(selected.length ? selected : ["STR"]);
  el("lootAttackScale").value = [...activeSet].join(" + ");
  el("lootAttackScaleOptions")
    .querySelectorAll("[data-attack-scale-ability]")
    .forEach((button) => {
      const active = activeSet.has(button.dataset.attackScaleAbility);
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-light", !active);
    });
}


function collectLootDetails() {
  const type = el("lootType").value;
  const slot = el("lootSlotInput").value.trim();
  const slotDetails = { slot };
  if (type === "Weapon") {
    const weaponType =
      el("lootWeaponType").value || "Melee Weapon (One-Handed)";
    const details = {
      ...slotDetails,
      weaponType,
      attackScale: el("lootAttackScale").value.trim() || "STR",
      damage: el("lootDamageDice").value.trim(),
      critical: el("lootWeaponCritical").value.trim(),
      damageScale: el("lootDamageScale").value.trim() || "STR",
      enhancement: el("lootWeaponEnhancement").value || "0",
      enchantment: el("lootWeaponEnchantment").value.trim(),
      specialMaterial: el("lootSpecialMaterial").value,
      details: el("lootWeaponDetails").value.trim(),
    };
    if (isFirearmWeaponType(weaponType)) {
      details.capacity = el("lootWeaponCapacity").value.trim();
      details.misfire = el("lootWeaponMisfire").value.trim();
    }
    return details;
  }
  if (["Armor", "Shield"].includes(type)) {
    return {
      ...slotDetails,
      bonus: el("lootArmorBonus").value || "0",
      enhancement: el("lootArmorEnhancement").value || "0",
      enchantment: el("lootArmorEnchantment").value.trim(),
      specialMaterial: el("lootSpecialMaterial").value,
    };
  }
  return slotDetails;
}

function signedValue(value) {
  const number = Number(value || 0);
  return number >= 0 ? `+${number}` : String(number);
}

function renderLootAttributes(item) {
  const details = item.details || {};
  const rows = [];
  if (item.type === "Weapon") {
    rows.push([
      "Weapon Type",
      details.weaponType || "Melee Weapon (One-Handed)",
    ]);
    if (details.specialMaterial)
      rows.push(["Material", details.specialMaterial]);
    rows.push(["Attack Scales", details.attackScale || "STR"]);
    if (details.damage) rows.push(["Damage", details.damage]);
    if (details.critical) rows.push(["Critical", details.critical]);
    if (isFirearmWeaponType(details.weaponType) && details.capacity)
      rows.push(["Capacity", details.capacity]);
    if (isFirearmWeaponType(details.weaponType) && details.misfire)
      rows.push(["Misfire", details.misfire]);
    rows.push(["Damage Scales", details.damageScale || "STR"]);
    rows.push(["Enhancement", signedValue(details.enhancement || 0)]);
    if (details.enchantment) rows.push(["Enchantment", details.enchantment]);
    if (details.details) rows.push(["Details", details.details]);
  } else if (["Armor", "Shield"].includes(item.type)) {
    rows.push(["Bonus", signedValue(details.bonus || 0)]);
    if (details.specialMaterial)
      rows.push(["Material", details.specialMaterial]);
    rows.push(["Enhancement", signedValue(details.enhancement || 0)]);
    if (details.enchantment) rows.push(["Enchantment", details.enchantment]);
  }

  if (!rows.length) return "";
  return `
    <div class="loot-attributes">
      ${rows.map(([label, value]) => `<span class="loot-attribute"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}
    </div>
  `;
}

function renderLootEffects(item) {
  const effects = Array.isArray(item.effects) ? item.effects : [];
  const damageReduction = Array.isArray(item.damageReduction)
    ? item.damageReduction
    : [];
  const spellResistance = Array.isArray(item.spellResistance)
    ? item.spellResistance
    : [];
  const classSkillGrants = Array.isArray(item.classSkillGrants)
    ? item.classSkillGrants
    : [];
  const lines = [
    ...effects.map(
      (effect) =>
        `${escapeHtml(window.PFEffectEditor.titleCaseStat(effect.stat || "effect"))} ${signedValue(effect.value)} (${escapeHtml(effect.type || "untyped")})${effect.conditional ? ` (${escapeHtml(effect.appliesWhen || "conditional")})` : ""}${effect.stacks ? " stacks" : ""}`,
    ),
    ...damageReduction.map(
      (dr) =>
        `DR ${Number(dr.amount || 0)}/${escapeHtml(String(dr.overcomeType || "").trim() || "-")}`,
    ),
    ...spellResistance.map(
      (sr) =>
        `SR ${Number(sr.amount || 0)}${sr.conditional ? ` (${escapeHtml(sr.appliesWhen || "conditional")})` : ""}`,
    ),
    ...classSkillGrants.map((grant) =>
      escapeHtml(
        window.PFEffectEditor.classSkillGrantText(
          grant,
          window.PFEffectEditor.titleCaseStat,
        ),
      ),
    ),
  ];
  if (!lines.length) return "";
  return `
    <div class="loot-effects-display">
      <div class="loot-meta">Item effects</div>
      ${lines.map((line) => `<div class="loot-effect-display">${line}</div>`).join("")}
    </div>
  `;
}

function renderLootCard(item) {
  return bagViewMode === "simplified"
    ? renderSimplifiedLootCard(item)
    : renderFullLootCard(item);
}

function renderSimplifiedLootCard(item) {
  return `
    <article class="loot-card" data-loot-id="${escapeHtml(item.id)}" role="button" tabindex="0" aria-label="Edit ${escapeHtml(item.name)}">
      <div class="loot-card-head">
        <div class="loot-title flex-grow-1">
          <div class="loot-name">${escapeHtml(item.name)}</div>
        </div>
        <span class="loot-count-actions">
          <span class="loot-count">x${escapeHtml(item.count)}</span>
          <button class="btn btn-outline-danger btn-sm loot-icon-btn" type="button" data-delete-loot="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">
            <i class="bi bi-trash"></i>
          </button>
        </span>
      </div>
    </article>
  `;
}

function renderFullLootCard(item) {
  const icon = sourceItemIcon(item);
  const options = [
    `<option value="">Unassigned</option>`,
    ...bagCharacters.map(
      (character) =>
        `<option value="${escapeHtml(character.id)}"${character.id === item.assigned_character_id ? " selected" : ""}>${escapeHtml(characterLabel(character))}</option>`,
    ),
  ].join("");

  return `
    <article class="loot-card" data-loot-id="${escapeHtml(item.id)}" role="button" tabindex="0" aria-label="Edit ${escapeHtml(item.name)}">
      <div class="loot-card-head">
        <span class="loot-icon">${icon}</span>
        <div class="loot-title flex-grow-1">
          <div class="loot-name">${escapeHtml(item.name)}</div>
          <div class="loot-meta">${escapeHtml(item.type)}${itemSlotLabel(item) ? ` | Slot: ${escapeHtml(itemSlotLabel(item))}` : ""}</div>
        </div>
        <span class="loot-count-actions">
          <span class="loot-count">x${escapeHtml(item.count)}</span>
          <button class="btn btn-outline-danger btn-sm loot-icon-btn" type="button" data-delete-loot="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}">
            <i class="bi bi-trash"></i>
          </button>
        </span>
      </div>
      <div class="mt-2">
        <label for="assign-${escapeHtml(item.id)}">Give to</label>
        <select id="assign-${escapeHtml(item.id)}" class="form-select form-select-sm w-100" data-loot-assign="${escapeHtml(item.id)}">
          ${options}
        </select>
      </div>
    </article>
  `;
}

function lootTypeBucket(item) {
  if (item.type === "Weapon") return "weapons";
  if (["Armor", "Shield"].includes(item.type)) return "armor";
  if (
    String(item.details?.source || item.sourceType || "").toLowerCase() ===
    "wondrous item"
  )
    return "wondrous";
  return "other";
}

function renderLootTypeSections(items) {
  if (!items.length) return `<div class="empty-state">No loot here.</div>`;
  const sections = [
    { key: "weapons", label: "Weapons" },
    { key: "armor", label: "Armor / Shields" },
    { key: "wondrous", label: "Wondrous Items" },
    { key: "other", label: "Other" },
  ];
  return sections
    .map((section) => {
      const sectionItems = items.filter(
        (item) => lootTypeBucket(item) === section.key,
      );
      if (!sectionItems.length) return "";
      return `
      <section class="loot-type-section">
        <div class="loot-type-title">${escapeHtml(section.label)}</div>
        <div class="loot-type-grid">
          ${sectionItems.map(renderLootCard).join("")}
        </div>
      </section>
    `;
    })
    .join("");
}

function lootEffectPayload(item = {}) {
  return {
    effects: Array.isArray(item.effects) ? item.effects : [],
    damageReduction: Array.isArray(item.damageReduction)
      ? item.damageReduction
      : [],
    spellResistance: Array.isArray(item.spellResistance)
      ? item.spellResistance
      : [],
    classSkillGrants: Array.isArray(item.classSkillGrants)
      ? item.classSkillGrants
      : [],
    sizeChanges: Array.isArray(item.sizeChanges) ? item.sizeChanges : [],
    spellLikeAbilities: Array.isArray(item.spellLikeAbilities)
      ? item.spellLikeAbilities
      : [],
  };
}

async function assignLoot(itemId, assignedTo) {
  const item = bagLoot.find((entry) => entry.id === itemId);
  if (!item) return;

  const previous = item.assigned_character_id || "";
  const target = assignedTo || null;
  if (previous === (target || "")) return;

  if (Number(item.count || 1) > 1) {
    pendingLootMove = { itemId, target, previous };
    renderLoot();
    openMoveLootModal(item, target);
    return;
  }

  item.assigned_character_id = target;
  renderLoot();

  const saved = await PFApp.saveLootItem(
    {
      id: item.id,
      name: item.name,
      description: item.description,
      count: item.count,
      type: item.type,
      assignedCharacterId: item.assigned_character_id,
      details: item.details,
      ...lootEffectPayload(item),
    },
    bagContextKey,
  );

  if (!saved) {
    item.assigned_character_id = previous || null;
    renderLoot();
    setLootStatus("Could not update assignment.", "danger");
    return;
  }

  clearLootStatus();
  notifyLootUpdated({ ...item, assigned_character_id: previous || null });
  notifyLootUpdated(saved);
  await loadBagContext(bagContextKey, false);
}

function openMoveLootModal(item, targetCharacterId) {
  const target = bagCharacters.find(
    (character) => character.id === targetCharacterId,
  );
  el("moveLootSummary").textContent =
    `${item.name} -> ${target ? characterLabel(target) : "Unassigned"}`;
  el("moveLootCount").max = String(item.count || 1);
  el("moveLootCount").value = String(item.count || 1);
  el("moveLootMax").textContent = `Max: ${item.count || 1}`;
  moveLootModal.show();
}

async function submitLootMove(event) {
  event.preventDefault();
  if (!pendingLootMove) return;

  const item = bagLoot.find((entry) => entry.id === pendingLootMove.itemId);
  if (!item) return;

  const total = Number(item.count || 1);
  const amount = Math.max(
    1,
    Math.min(total, Number.parseInt(el("moveLootCount").value, 10) || 1),
  );
  const target = pendingLootMove.target || null;

  if (amount >= total) {
    item.assigned_character_id = target;
    const saved = await PFApp.saveLootItem(
      {
        id: item.id,
        name: item.name,
        description: item.description,
        count: item.count,
        type: item.type,
        assignedCharacterId: target,
        details: item.details,
        ...lootEffectPayload(item),
      },
      bagContextKey,
    );
    if (saved) {
      notifyLootUpdated({
        ...item,
        assigned_character_id: pendingLootMove.previous || null,
      });
      notifyLootUpdated(saved);
    }
  } else {
    const remaining = await PFApp.saveLootItem(
      {
        id: item.id,
        name: item.name,
        description: item.description,
        count: total - amount,
        type: item.type,
        assignedCharacterId: pendingLootMove.previous || null,
        details: item.details,
        ...lootEffectPayload(item),
      },
      bagContextKey,
    );
    const moved = await PFApp.saveLootItem(
      {
        name: item.name,
        description: item.description,
        count: amount,
        type: item.type,
        assignedCharacterId: target,
        details: item.details,
        ...lootEffectPayload(item),
      },
      bagContextKey,
    );
    if (remaining) notifyLootUpdated(remaining);
    if (moved) notifyLootUpdated(moved);
  }

  pendingLootMove = null;
  moveLootModal.hide();
  clearLootStatus();
  await loadBagContext(bagContextKey, false);
}

function resetLootForm() {
  editingLootId = null;
  sourceLootTemplateDetails = null;
  el("lootModalLabel").textContent = "Add Item";
  el("lootSubmitButton").textContent = "Add Item";
  el("lootForm").reset();
  el("lootCount").value = "1";
  el("lootWondrousItem").checked = false;
  PFItemEditor.reset(lootEditorConfig());
  setLootAttackScale("STR");
  setLootDamageScale("STR");
  el("lootWeaponType").value = "Melee Weapon (One-Handed)";
  el("lootWeaponCritical").value = "";
  el("lootWeaponCapacity").value = "";
  el("lootWeaponMisfire").value = "";
  lootEffectsAccordion.reset({});
  toggleLootDetailFields();
  renderCharacterOptions(el("lootAssignedTo"));
}

function openLootEditor(itemId) {
  const item = bagLoot.find((entry) => entry.id === itemId);
  if (!item) return;

  editingLootId = item.id;
  sourceLootTemplateDetails = null;
  el("lootModalLabel").textContent = "Edit Item";
  el("lootSubmitButton").textContent = "Save Changes";
  populateLootForm(item, item.assigned_character_id || "");
  lootModal.show();
}

async function syncEditedLootBuff(item) {
  if (!item?.assigned_character_id) return;
  const buffs = await PFApp.loadBuffState(
    bagContextKey,
    item.assigned_character_id,
  );
  if (!Array.isArray(buffs)) return;
  const index = buffs.findIndex((buff) => buff.sourceLootId === item.id);
  if (index < 0) return;
  const extras = lootEffectPayload(item);
  const hasExtras =
    extras.effects.length ||
    extras.damageReduction.length ||
    extras.spellResistance.length ||
    extras.classSkillGrants.length ||
    extras.sizeChanges.length ||
    extras.spellLikeAbilities.length;
  if (hasExtras) {
    buffs[index] = {
      ...buffs[index],
      name: item.name,
      bonuses: extras.effects,
      damageReduction: extras.damageReduction,
      spellResistance: extras.spellResistance,
      classSkillGrants: extras.classSkillGrants,
      sizeChanges: extras.sizeChanges,
      spellLikeAbilities: extras.spellLikeAbilities,
    };
  } else {
    buffs.splice(index, 1);
  }
  await PFApp.saveBuffState(buffs, bagContextKey, item.assigned_character_id);
  localStorage.setItem(
    `pf_buffs_updated_${bagContextKey}_${item.assigned_character_id}`,
    String(Date.now()),
  );
  localStorage.setItem(
    `pf_loot_updated_${bagContextKey}_${item.assigned_character_id}`,
    JSON.stringify({ itemId: item.id, at: Date.now() }),
  );
}

function notifyLootUpdated(item) {
  if (!item?.assigned_character_id) return;
  localStorage.setItem(
    `pf_loot_updated_${bagContextKey}_${item.assigned_character_id}`,
    JSON.stringify({ itemId: item.id, at: Date.now() }),
  );
}

async function removeLootBuff(item) {
  if (!item?.assigned_character_id) return;
  const buffs = await PFApp.loadBuffState(
    bagContextKey,
    item.assigned_character_id,
  );
  if (!Array.isArray(buffs)) return;
  const next = buffs.filter((buff) => buff.sourceLootId !== item.id);
  if (next.length === buffs.length) return;
  await PFApp.saveBuffState(next, bagContextKey, item.assigned_character_id);
  localStorage.setItem(
    `pf_buffs_updated_${bagContextKey}_${item.assigned_character_id}`,
    String(Date.now()),
  );
}

async function deleteLootAmount(itemId, amountOverride = null) {
  const item = bagLoot.find((entry) => entry.id === itemId);
  if (!item) return;

  const total = Number(item.count || 1);
  const parsedAmount = Number.parseInt(el("deleteLootCount").value, 10) || 1;
  const amount = Math.max(1, Math.min(total, amountOverride ?? parsedAmount));
  let ok = false;

  if (amount >= total) {
    await removeLootBuff(item);
    ok = await PFApp.deleteLootItem(item.id);
  } else {
    ok = Boolean(
      await PFApp.saveLootItem(
        {
          id: item.id,
          name: item.name,
          description: item.description,
          count: total - amount,
          type: item.type,
          assignedCharacterId: item.assigned_character_id,
          details: item.details,
          ...lootEffectPayload(item),
        },
        bagContextKey,
      ),
    );
  }

  if (!ok) {
    setLootStatus("Could not delete item.", "danger");
    return;
  }

  pendingLootDelete = null;
  deleteLootModal?.hide();
  notifyLootUpdated(item);
  clearLootStatus();
  await loadBagContext(bagContextKey, false);
}

function requestLootDelete(itemId) {
  const item = bagLoot.find((entry) => entry.id === itemId);
  if (!item) return;
  const total = Number(item.count || 1);
  if (total <= 1) {
    void deleteLootAmount(itemId, 1);
    return;
  }
  pendingLootDelete = { itemId };
  el("deleteLootSummary").textContent =
    `${item.name}${item.assigned_character_id ? " is assigned. If fully deleted, equipped copies and item effects will be removed." : ""}`;
  el("deleteLootCount").max = String(total);
  el("deleteLootCount").value = String(total);
  el("deleteLootMax").textContent = `Max: ${total}`;
  deleteLootModal.show();
}

async function submitLootDelete(event) {
  event.preventDefault();
  if (!pendingLootDelete) return;
  await deleteLootAmount(pendingLootDelete.itemId);
}

async function submitLootForm(event) {
  event.preventDefault();
  const name = el("lootName").value.trim();
  if (!name) return;
  const isCreating = !editingLootId;
  const createdFromSourceList =
    isCreating && Boolean(sourceLootTemplateDetails);
  const existingItem = editingLootId
    ? bagLoot.find((item) => item.id === editingLootId)
    : null;
  const selectedType = el("lootType").value;
  const baseDetails = sourceLootTemplateDetails || existingItem?.details || {};
  const details = applyWondrousSource(
    { ...cloneJson(baseDetails), ...collectLootDetails() },
    el("lootWondrousItem").checked,
  );

  const saved = await PFApp.saveLootItem(
    {
      id: editingLootId,
      name,
      description: el("lootDescription").value.trim(),
      count: el("lootCount").value,
      type: selectedType,
      assignedCharacterId: el("lootAssignedTo").value,
      details,
      ...lootEffectsAccordion.collect(),
    },
    bagContextKey,
  );

  if (!saved) {
    setLootStatus(
      editingLootId ? "Could not update item." : "Could not add item.",
      "danger",
    );
    return;
  }

  returnToSourceItemsAfterClose = createdFromSourceList;
  resetLootForm();
  lootModal.hide();
  await syncEditedLootBuff(saved);
  notifyLootUpdated(saved);
  clearLootStatus();
  await loadBagContext(bagContextKey, false);
}

async function loadBagContext(contextKey, showLoading = true) {
  if (!contextKey || contextKey === "general") return;
  bagContextKey = contextKey;
  loadCollapsedLootGroups();
  if (showLoading) setLootStatus("Loading bag...", "secondary");

  const [isAdmin, isManager] = await Promise.all([
    PFApp.isAppAdmin(),
    PFApp.isGameManager(bagContextKey),
  ]);
  bagCanManageContext = Boolean(isAdmin || isManager);
  bagCharacters = await PFApp.loadContextCharacters(bagContextKey);
  applyRoleBasedCollapseDefaults();
  bagLoot = await PFApp.loadLootItems(bagContextKey);
  renderCharacterOptions(el("lootAssignedTo"));
  renderLoot();

  const contexts = await PFApp.loadContexts();
  const current = contexts.find((context) => context.key === bagContextKey);
  el("contextHint").textContent = current ? `Context: ${current.label}` : "";
  clearLootStatus();
}

function lootEditorConfig() {
  return {
    formId: "lootForm",
    effectsRootId: "lootEffectsAccordion",
    generalTabId: "lootEditorGeneralTab",
    effectsTabId: "lootEditorEffectsTab",
    generalPanelId: "lootEditorGeneralPanel",
    effectsPanelId: "lootEditorEffectsPanel",
    slotInputId: "lootSlotInput",
    slotFieldId: "lootSlotField",
    typeInputId: "lootType",
    descriptionId: "lootDescription",
    materialFieldId: "lootSpecialMaterialField",
    materialInputId: "lootSpecialMaterial",
    slots: ITEM_SLOTS,
    onSlotChange: updateLootSlotPreview,
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await PFApp.requireAuth();
  if (!user) return;
  bagCurrentUserId = user.id;

  lootModal = new bootstrap.Modal(el("lootModal"));
  sourceItemModal = new bootstrap.Modal(el("sourceItemsModal"));
  moveLootModal = new bootstrap.Modal(el("moveLootModal"));
  deleteLootModal = new bootstrap.Modal(el("deleteLootModal"));
  PFItemEditor.init(lootEditorConfig());
  el("lootWeaponType").innerHTML = optionList(
    WEAPON_TYPES,
    "Melee Weapon (One-Handed)",
  );
  el("lootWeaponEnchantment").innerHTML = optionList(WEAPON_ENCHANTMENTS);
  el("lootArmorEnchantment").innerHTML = armorEnchantmentOptions();
  el("lootForm").addEventListener("submit", submitLootForm);
  el("lootModal").addEventListener("hidden.bs.modal", resetLootForm);
  el("lootModal").addEventListener("hidden.bs.modal", () =>
    PFItemEditor.resetTabs(lootEditorConfig()),
  );
  el("lootModal").addEventListener("hidden.bs.modal", () => {
    if (!returnToSourceItemsAfterClose) return;
    returnToSourceItemsAfterClose = false;
    window.setTimeout(() => {
      renderSourceItemResults();
      sourceItemModal.show();
      window.setTimeout(() => el("sourceItemSearch").focus(), 150);
    }, 160);
  });
  el("lootModal").addEventListener("shown.bs.modal", () =>
    PFItemEditor.refreshDescription(lootEditorConfig()),
  );
  el("lootType").addEventListener("change", toggleLootDetailFields);
  el("lootWeaponType").addEventListener("change", toggleLootDetailFields);
  setupLootScalingControls();
  lootEffectsAccordion = window.PFEffectEditor.mountEffectsAccordion(
    el("lootEffectsAccordion"),
    { idPrefix: "lootEffects" },
  );
  el("moveLootForm").addEventListener("submit", submitLootMove);
  el("deleteLootForm").addEventListener("submit", submitLootDelete);
  el("lootSearch").addEventListener("input", (event) => {
    lootSearchTerm = event.target.value.trim().toLowerCase();
    renderLoot();
  });
  el("openSourceItems").addEventListener("click", openSourceItemsModal);
  el("sourceItemSearch").addEventListener("input", (event) => {
    sourceItemSearchTerm = event.target.value.trim();
    renderSourceItemResults();
  });
  el("sourceItemTabs")
    .querySelectorAll("[data-source-category]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        sourceItemCategory = button.dataset.sourceCategory || "all";
        if (
          sourceItemCategory === "mundane" &&
          !MUNDANE_CATEGORIES.includes(sourceItemMundaneCategory)
        ) {
          sourceItemMundaneCategory = MUNDANE_CATEGORIES[0];
        }
        el("sourceItemTabs")
          .querySelectorAll("[data-source-category]")
          .forEach((tab) => {
            tab.classList.toggle("active", tab === button);
          });
        renderSourceItemResults();
      });
    });
  bagContextKey = await PFApp.requireGameContext();
  if (!bagContextKey) return;
  await loadSourceItems();
  await loadBagContext(bagContextKey);
  setBagView(bagViewMode);
  window.addEventListener("pf-context-change", (event) => {
    if (event.detail.contextKey && event.detail.contextKey !== "general")
      loadBagContext(event.detail.contextKey);
  });
});
