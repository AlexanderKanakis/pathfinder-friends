(function () {
  const DEFAULT_SLOTS = ["", "Armor", "Shield", "Weapon", "Ring", "Rod", "Staff", "Headband", "Head", "Eyes", "Neck", "Shoulders", "Wrists", "Hands", "Feet", "Belt", "Chest", "Body", "Held", "None", "Special", "Other"];
  const WEAPON_SPECIAL_MATERIALS = ["", "Abysium", "Adamantine", "Bone", "Bronze", "Cryptstone", "Blood Crystal", "Darkwood", "Druchite", "Dragonskin", "Elysian Bronze", "Gold", "Greenwood", "Horacalcum", "Inubrix", "Cold Iron", "Mindglass", "Mithral", "Noqual", "Obsidian", "Siccatite", "Alchemical Silver", "Silversheen", "Fire-Forged Steel", "Frost-Forged Steel", "Living Steel", "Singing Steel", "Stainless Steel", "Stone", "Sunsilver", "Spiresteel", "Viridium", "Voidglass", "Whipwood", "Wyroot"];
  const ARMOR_SPECIAL_MATERIALS = ["", "Abysium", "Adamantine", "Angelskin", "Aszite", "Bone", "Bronze", "Darkleaf Cloth", "Darkwood", "Druchite", "Dragonhide", "Eel Hide", "Elysian Bronze", "Gold", "Griffon Mane", "Horacalcum", "Mithral", "Noqual", "Siccatite", "Fire-Forged Steel", "Frost-Forged Steel", "Living Steel", "Singing Steel", "Stainless Steel", "Sunsilk", "Sunsilver", "Spiresteel", "Voidglass"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function optionList(options, selected = "", emptyLabel = "No slot") {
    const entries = options.includes(selected) ? options : [...options, selected];
    return entries.map(value => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${value || emptyLabel}</option>`).join("");
  }

  function autosize(textarea) {
    if (!textarea) return;
    textarea.style.overflow = "hidden";
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 120)}px`;
  }

  function syncSlotForType(config) {
    const type = document.getElementById(config.typeInputId)?.value || "Item";
    const slotField = document.getElementById(config.slotFieldId);
    const automaticSlot = ["Weapon", "Armor", "Shield"].includes(type) ? type : "";
    slotField?.classList.toggle("d-none", type !== "Item");
    if (automaticSlot) setSlot(config, automaticSlot);
    else config.onSlotChange?.();
    syncSpecialMaterialForType(config);
    requestAnimationFrame(() => syncTabHeights(config));
  }

  function materialOptionsForType(type) {
    if (type === "Weapon") return WEAPON_SPECIAL_MATERIALS;
    if (type === "Armor" || type === "Shield") return ARMOR_SPECIAL_MATERIALS;
    return [""];
  }

  function syncSpecialMaterialForType(config, selected = null) {
    const type = document.getElementById(config.typeInputId)?.value || "Item";
    const field = document.getElementById(config.materialFieldId);
    const input = document.getElementById(config.materialInputId);
    if (!field || !input) return;
    const show = ["Weapon", "Armor", "Shield"].includes(type);
    field.classList.toggle("d-none", !show);
    const current = selected ?? input.value ?? "";
    input.innerHTML = optionList(materialOptionsForType(type), current, "None");
    input.value = materialOptionsForType(type).includes(current) ? current : "";
  }

  function initTabs(config) {
    if (config.formId && config.effectsRootId && !document.getElementById(config.generalPanelId)) {
      const form = document.getElementById(config.formId);
      const body = form?.querySelector(".modal-body");
      const effectsRoot = document.getElementById(config.effectsRootId);
      const effectsSection = effectsRoot?.closest(config.effectsSectionSelector || ".mt-3");
      if (body && effectsSection) {
        const tabs = document.createElement("div");
        tabs.className = "item-editor-tabs item-editor-view-tabs";
        tabs.innerHTML = `
          <div class="item-editor-tablist" role="tablist" aria-label="Item editor tabs">
            <button id="${escapeHtml(config.generalTabId)}" class="item-editor-view-tab active" type="button" role="tab" aria-selected="true">General</button>
            <button id="${escapeHtml(config.effectsTabId)}" class="item-editor-view-tab" type="button" role="tab" aria-selected="false">Item Effects</button>
          </div>
        `;
        const generalPanel = document.createElement("div");
        generalPanel.id = config.generalPanelId;
        generalPanel.className = "item-editor-panel";
        const effectsPanel = document.createElement("div");
        effectsPanel.id = config.effectsPanelId;
        effectsPanel.className = "item-editor-panel";
        [...body.children].forEach(child => generalPanel.appendChild(child));
        effectsPanel.appendChild(effectsSection);
        body.appendChild(tabs);
        body.appendChild(generalPanel);
        body.appendChild(effectsPanel);
      }
    }

    const generalTab = document.getElementById(config.generalTabId);
    const effectsTab = document.getElementById(config.effectsTabId);
    const generalPanel = document.getElementById(config.generalPanelId);
    const effectsPanel = document.getElementById(config.effectsPanelId);
    if (!generalTab || !effectsTab || !generalPanel || !effectsPanel) return;

    const show = tab => {
      const effects = tab === "effects";
      syncTabHeights(config);
      generalTab.classList.toggle("active", !effects);
      generalTab.setAttribute("aria-selected", !effects ? "true" : "false");
      effectsTab.classList.toggle("active", effects);
      effectsTab.setAttribute("aria-selected", effects ? "true" : "false");
      generalPanel.classList.toggle("d-none", effects);
      effectsPanel.classList.toggle("d-none", !effects);
      requestAnimationFrame(() => syncTabHeights(config));
    };

    generalTab.addEventListener("click", () => show("general"));
    effectsTab.addEventListener("click", () => show("effects"));
    show("general");
    requestAnimationFrame(() => syncTabHeights(config));
  }

  function measurePanel(panel) {
    const wasHidden = panel.classList.contains("d-none");
    const previous = {
      position: panel.style.position,
      visibility: panel.style.visibility,
      pointerEvents: panel.style.pointerEvents,
      width: panel.style.width
    };
    if (wasHidden) {
      panel.classList.remove("d-none");
      panel.style.position = "absolute";
      panel.style.visibility = "hidden";
      panel.style.pointerEvents = "none";
      panel.style.width = "100%";
    }
    const height = panel.scrollHeight;
    if (wasHidden) {
      panel.classList.add("d-none");
      panel.style.position = previous.position;
      panel.style.visibility = previous.visibility;
      panel.style.pointerEvents = previous.pointerEvents;
      panel.style.width = previous.width;
    }
    return height;
  }

  function syncTabHeights(config) {
    const generalPanel = document.getElementById(config.generalPanelId);
    const effectsPanel = document.getElementById(config.effectsPanelId);
    if (!generalPanel || !effectsPanel) return;
    generalPanel.style.minHeight = "";
    effectsPanel.style.minHeight = "";
    const height = Math.max(260, measurePanel(generalPanel), measurePanel(effectsPanel));
    generalPanel.style.minHeight = `${height}px`;
    effectsPanel.style.minHeight = `${height}px`;
  }

  function init(config) {
    const slotSelect = document.getElementById(config.slotInputId);
    const description = document.getElementById(config.descriptionId);
    if (slotSelect) {
      slotSelect.innerHTML = optionList(config.slots || DEFAULT_SLOTS);
      slotSelect.addEventListener("change", () => config.onSlotChange?.());
    }
    if (description) {
      description.addEventListener("input", () => autosize(description));
      setTimeout(() => autosize(description), 0);
    }
    initTabs(config);
    syncSlotForType(config);
  }

  function setSlot(config, value = "") {
    const slotSelect = document.getElementById(config.slotInputId);
    if (!slotSelect) return;
    slotSelect.innerHTML = optionList(config.slots || DEFAULT_SLOTS, value);
    slotSelect.value = value;
    config.onSlotChange?.();
  }

  function reset(config) {
    setSlot(config, "");
    syncSpecialMaterialForType(config, "");
    const description = document.getElementById(config.descriptionId);
    if (description) setTimeout(() => autosize(description), 0);
    resetTabs(config);
    syncSlotForType(config);
  }

  function resetTabs(config) {
    const generalTab = document.getElementById(config.generalTabId);
    generalTab?.click();
  }

  function refreshDescription(config) {
    const description = document.getElementById(config.descriptionId);
    autosize(description);
    requestAnimationFrame(() => autosize(description));
    setTimeout(() => autosize(description), 50);
    requestAnimationFrame(() => syncTabHeights(config));
    setTimeout(() => syncTabHeights(config), 80);
  }

  window.PFItemEditor = {
    DEFAULT_SLOTS,
    WEAPON_SPECIAL_MATERIALS,
    ARMOR_SPECIAL_MATERIALS,
    init,
    setSlot,
    reset,
    resetTabs,
    refreshDescription,
    syncSlotForType,
    syncSpecialMaterialForType,
    slotOptionList: optionList
  };
})();
