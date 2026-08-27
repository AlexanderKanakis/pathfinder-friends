let map3DPreviewModal = null;
// Height Layer (experimental "3D Preview" feature) -- see
// toggleHeightEditMode()/state.heightShapes.
let heightEditMode = false;

let mapContextKey = "";
let mapCharacters = [];
let mapClassDefinitions = null;
let currentUserId = "";
let currentUserEmail = "";
let isGm = false;
let selectedId = "";
let characterPanelCharacterId = "";
let saveTimer = null;
let dragState = null;
let resizeState = null;
let mapRealtimeChannel = null;
let pendingRemoteState = null;
let mapViewSlot = 1;
let mapSlotMeta = [];
let pendingBackgroundFootprint = null;
let cellRatioLinked = true;
let localGridSize = Number(sessionStorage.getItem("pf_map_grid_size") || 48);
let suppressStageClick = false;
let contextMenuTokenId = "";
let quickControlsOpenId = "";
let dpadMovingIds = new Set();
let movementMeasure = null;
let suppressNextContextMenu = false;
let auraModal = null;
let auraEditingTokenId = "";
let auraEditingMode = "aura";
let backgroundModal = null;
let mapDocumentationModal = null;
let enemyPickerModal = null;
let characterPickerModal = null;
let genericTokenModal = null;
let mapEffectsModal = null;
let quickEffectModal = null;
let quickEffectTargetsModal = null;
let rollModal = null;
let rollResultModal = null;
let rollTokenId = "";
let rollDetailKind = "";
let rollAnimationTimer = null;
let lastRollAction = null;
let expandedMapWeaponKey = "";
let mapEffectTrackerInstance = null;
let mapEnemies = [];
let pendingTokenHp = new Map();
let hpSaveTimers = new Map();
let hpSaveSeq = new Map();
let characterSheetBridgeFrame = null;
let characterSheetBridgePromise = null;
let mapSheetCalculationSignatures = new Map();
let quickEffectDefinitions = [];
let quickEffectSourceTokenId = "";
let quickEffectSelection = null;
let quickEffectMode = "apply";
let auraEffectDraft = null;
let auraEffectDismissed = new Set();
let auraEffectInside = new Set();
let turnAdvanceBusy = false;
let seenTurnEffectNotices = new Set();

const MAP_SLOT_COUNT = 6;
// Pixels-per-cell assumed when converting a newly loaded background image's
// natural size into a cell count. Fixed and independent of anyone's local
// zoom ("Map Size") so the resulting grid is identical for every viewer.
const MAP_IMAGE_REFERENCE_CELL_PX = 48;
const MAP_SIZE_MIN = 8;
const MAP_SIZE_MAX = 300;
const defaultState = {
  settings: {
    cols: 30,
    rows: 20,
    backgroundUrl: "",
    backgroundCols: 0,
    backgroundRows: 0,
    name: "",
  },
  tokens: [],
  shapes: [],
  // Height Layer regions (experimental "3D Preview" feature) -- a
  // dedicated set of rects, separate from the ordinary gameplay shapes
  // above, edited in their own view (see toggleHeightEditMode()) so
  // painting elevation never clutters the regular map. Each entry:
  // { id, x, y, w, h, heightFeet, color }. heightFeet is a multiple of
  // 5 (1 "unit" = 5ft, a standard humanoid's height) and can be
  // negative for a pit/depression. See render3DPreview().
  heightShapes: [],
  initiative: [],
  activeTurn: 0,
  roundsPassed: 1,
  turnSequence: 0,
  effectNotices: [],
  timeline: [],
  fog: { visible: false, color: "#000000" },
};
let state = structuredClone(defaultState);
const MAP_SKILLS = [
  ["Acrobatics", "dex"],
  ["Appraise", "int"],
  ["Bluff", "cha"],
  ["Climb", "str"],
  ["Diplomacy", "cha"],
  ["Disable Device", "dex"],
  ["Disguise", "cha"],
  ["Escape Artist", "dex"],
  ["Fly", "dex"],
  ["Heal", "wis"],
  ["Intimidate", "cha"],
  ["Knowledge (arcana)", "int"],
  ["Knowledge (dungeoneering)", "int"],
  ["Knowledge (engineering)", "int"],
  ["Knowledge (geography)", "int"],
  ["Knowledge (history)", "int"],
  ["Knowledge (local)", "int"],
  ["Knowledge (nature)", "int"],
  ["Knowledge (nobility)", "int"],
  ["Knowledge (planes)", "int"],
  ["Knowledge (religion)", "int"],
  ["Linguistics", "int"],
  ["Perception", "wis"],
  ["Ride", "dex"],
  ["Sense Motive", "wis"],
  ["Sleight of Hand", "dex"],
  ["Spellcraft", "int"],
  ["Stealth", "dex"],
  ["Survival", "wis"],
  ["Swim", "str"],
  ["Use Magic Device", "cha"],
];
const SHAPE_TEXTURES = [
  { id: "flames", name: "Flames", url: "assets/shape icons/flames.png" },
  { id: "grass", name: "Grass", url: "assets/shape icons/grass.png" },
  { id: "pit", name: "Pit", url: "assets/shape icons/pit.png" },
  { id: "stone", name: "Stone", url: "assets/shape icons/stone.png" },
];
const MAP_CONTEXT_DOCUMENTATION = [
  {
    id: "initiative",
    group: "Combat & Turns",
    title: "Initiative & Rounds",
    icon: "bi-list-ol",
    summary:
      "Track combat order, the active turn, delayed positions, disabled entries, and completed rounds.",
    usage: [
      "Characters, enemies, and generic tokens are added to initiative automatically. Shapes are not.",
      "Initiative initially sorts from highest to lowest. You can change a score or manually reorder entries to represent Delay without changing their names.",
      "Next ends the highlighted entry's turn and highlights the next enabled entry. Disabled entries are greyed out and skipped. If every entry is disabled, combat cannot advance.",
      "A round is completed when the active turn wraps from the bottom of the enabled order back to the top. Reset clears only the round count.",
      "Custom entry is available below the list for combatants or events that do not have a map token.",
    ],
    access:
      "Initiative state is shared by every connected user in the campaign.",
  },
  {
    id: "timeline",
    group: "Combat & Turns",
    title: "Timeline",
    icon: "bi-clock-history",
    summary: "A shared recent history of important map and combat events.",
    usage: [
      "The timeline records turn changes, rolls, effect applications, expired effects, and manually entered events.",
      "Roll entries include the die, bonus, total, and critical threat, failure, success, or firearm misfire status where relevant.",
      "Hidden enemy and token names are masked for regular players while remaining identifiable to the GM and admin.",
      "Only the latest 20 entries are retained. Routine HP changes are intentionally not recorded.",
    ],
    access:
      "Every campaign member can view the timeline and add a manual event.",
  },
  {
    id: "multiattack",
    group: "Combat & Rolls",
    title: "Attack & Full Attack",
    icon: "bi-crosshair2",
    summary:
      "Understand how the app calculates one attack, BAB iteratives, and multiweapon full attacks.",
    usage: [
      "Attack rolls only the selected weapon's first and highest attack bonus.",
      "Full Attack starts with BAB iteratives for a normal or primary weapon: BAB, BAB -5, BAB -10, and BAB -15, stopping before the next value would fall below +1. For example, BAB +11 produces three base attacks: +11, +6, and +1.",
      "Every attack then receives the weapon's attack-scaling ability modifier, enhancement, manual attack misc, applicable effects, and active attack-option penalties.",
      "An effect that grants an extra attack at highest BAB inserts another copy of the first attack. When TWF is active, these effect-granted attacks apply only to the primary weapon.",
      "Rapid Shot inserts one extra attack at the selected ranged weapon's highest bonus and applies -2 to all weapon attacks while active.",
      "Full Attack results are displayed as Attack 1, Attack 2, Attack 3, and so on across the complete sequence.",
    ],
    access:
      "Roll permissions follow the selected token: owners roll their characters, while GM and admin can roll all characters and enemies.",
  },
  {
    id: "twf",
    group: "Combat & Rolls",
    title: "Two-Weapon Fighting",
    icon: "bi-intersect",
    summary:
      "Build a full attack from one primary weapon and one or more off-hand weapons.",
    usage: [
      "Mark exactly one equipped weapon as the TWF primary hand and mark each participating secondary weapon as an off hand. TWF and Two-Handed are mutually exclusive.",
      "The primary weapon keeps its normal BAB iterative attacks. Each off-hand weapon receives one attack at highest BAB.",
      "Improved TWF adds a second attack to that off-hand weapon at highest BAB -5. Greater TWF adds a third at highest BAB -10. These options require an off-hand weapon using the TWF feat mode.",
      "With the TWF feat, primary and off-hand attacks take -2 when an off-hand weapon is Light or Natural, otherwise -4.",
      "Without the feat, the primary takes -4 with a light off hand or -6 otherwise. The off hand takes -8 when light or natural, or -10 otherwise.",
      "During Full Attack, the app rolls the primary sequence first and then each participating off-hand sequence. Effects granting an extra highest-BAB attack are not repeated on off-hand weapons.",
    ],
    access:
      "Attack options can be changed from the equipped weapon on the sheet or from that weapon's expandable row in the Map Character panel.",
  },
  {
    id: "attack-options",
    group: "Combat & Rolls",
    title: "Attack Options",
    icon: "bi-sliders",
    summary:
      "Temporarily configure combat choices that alter weapon attack and damage calculations.",
    usage: [
      "Open a weapon in the Map Character panel to show Attack Options. Changes are saved to the same weapon used by the character or enemy sheet.",
      "Two-Handed causes Strength damage scaling to use x1.5 and is mutually exclusive with every TWF mode.",
      "Power Attack applies -1 attack and +2 damage for the first four BAB, increasing by another -1/+2 for every four BAB. Two-handed melee damage receives x1.5 of that damage bonus; light melee weapons receive no Power Attack damage bonus.",
      "Deadly Aim uses the same BAB progression for ranged weapons: -1 attack and +2 damage per step.",
      "Rapid Shot grants one highest-bonus attack and applies -2 to all weapon attacks. Only one weapon can have Rapid Shot active.",
      "Changing weapon type clears attack options that are no longer compatible with the new type.",
    ],
    access:
      "Players can edit options for their own character. GM and admin can edit options for every character and enemy.",
  },
  {
    id: "aura",
    group: "Right-Click Actions",
    title: "Aura Options",
    icon: "bi-broadcast-pin",
    summary:
      "Create a visible radius around a token and optionally offer an effect to creatures inside it.",
    usage: [
      "Set whether the aura is visible, its radius in grid cells, and its color. One cell represents 5 feet.",
      "An aura can carry an effect. Eligible characters inside the radius receive a prompt and choose whether to apply it.",
      "Remove when out of range removes an accepted aura effect after its target leaves the radius.",
    ],
    access:
      "Characters can manage their own auras. The GM and admin can manage every character or enemy aura.",
  },
  {
    id: "apply-effect",
    group: "Right-Click Actions",
    title: "Apply Effect",
    icon: "bi-magic",
    summary:
      "Apply a spell, ability, feat, debuff, or condition to one or more map targets.",
    usage: [
      "Search or choose a frequently used effect, then select any number of characters or enemies.",
      "Caster level defaults to the source token's level when the effect uses caster level.",
      "Finite durations are tied to the source token's turn and are reduced when that token ends its turn.",
    ],
    access:
      "A character owner can start the action from their character. GM and admin can also start it from enemies.",
  },
  {
    id: "roll",
    group: "Right-Click Actions",
    title: "Roll",
    icon: "bi-dice-5",
    summary:
      "Roll attacks, saves, skills, or attributes using the selected token's calculated sheet values.",
    usage: [
      "Attack rolls the highest attack for the selected weapon. Full Attack rolls every available attack.",
      "Threat ranges, firearm misfires, critical successes, and critical failures are identified automatically.",
      "Every result is added to the timeline. The result modal can reroll the same action.",
    ],
    access:
      "Players can roll their own characters. GM and admin can roll for every character and enemy.",
  },
  {
    id: "hide-token",
    group: "Right-Click Actions",
    title: "Hide / Unhide",
    icon: "bi-eye-slash",
    summary:
      "Temporarily conceal the entire token from users who cannot manage it.",
    usage: [
      "A hidden token cannot be seen or selected by other regular players.",
      "Its owner, GM, and admin see it as semi-transparent so its position remains manageable.",
      "This is separate from an enemy's initial Visible setting and from Hide Name.",
    ],
    access:
      "Character owners can hide their own characters. GM and admin can hide any token.",
  },
  {
    id: "enemy-visibility",
    group: "Right-Click Actions",
    title: "Hide / Show Enemy",
    icon: "bi-person-slash",
    summary: "Control whether an enemy exists visibly for regular players.",
    usage: [
      "Hidden enemies remain semi-transparent and selectable for the GM and admin.",
      "Regular players cannot see or select the enemy while it is hidden.",
      "This uses the same visibility state selected when the enemy was first added to the map.",
    ],
    access: "GM and admin only.",
  },
  {
    id: "hide-name",
    group: "Right-Click Actions",
    title: "Hide / Unhide Name",
    icon: "bi-incognito",
    summary:
      "Keep a token visible while concealing its identity.",
    usage: [
      "Regular players see ? anywhere the name would appear, including the map, initiative, timeline, and effect prompts.",
      "GM and admin continue to see the real name with a [?] marker.",
      "The token remains on the map, but its avatar image is hidden while its name is hidden.",
    ],
    access: "GM and admin only. Available for characters, enemies, and generic tokens.",
  },
  {
    id: "z-index",
    group: "Right-Click Actions",
    title: "Z-Index",
    icon: "bi-layers",
    summary:
      "Change which map entity is drawn in front when tokens or shapes overlap.",
    usage: [
      "Move to top places the entity above every other map entity. Move to bottom places it behind them.",
      "Move up and Move down shift it by one layer.",
      "Layer changes affect presentation only; they do not change position, initiative, or permissions.",
    ],
    access: "Available to anyone who can manage the selected entity.",
  },
  {
    id: "remove",
    group: "Right-Click Actions",
    title: "Remove From Map",
    icon: "bi-box-arrow-right",
    summary: "Remove the selected token or shape from the current map.",
    usage: [
      "Removing a character, enemy, or generic token also removes its linked initiative entry.",
      "The underlying character or enemy sheet is not deleted.",
      "Removing a shape only removes that map shape.",
    ],
    access:
      "Players can remove their own characters and tokens. GM and admin can remove all map entities.",
  },
];

function el(id) {
  return document.getElementById(id);
}
function canViewSelectedDetails(item) {
  return !(item?.kind === "enemy" && !isGm);
}
function activateSideTab(tabId) {
  const tabButton = el(tabId);
  if (!tabButton) return;
  bootstrap.Tab.getOrCreateInstance(tabButton).show();
}

const mapMobileQuery = window.matchMedia("(max-width: 980px)");

function relocateMapToolbar(isMobile) {
  const toolbar = el("mapToolbar");
  const mobileSlot = el("mapToolbarMobileSlot");
  const stageWrap = el("mapStageWrap");
  if (!toolbar || !mobileSlot || !stageWrap) return;
  if (isMobile) {
    mobileSlot.appendChild(toolbar);
  } else {
    stageWrap.parentElement.insertBefore(toolbar, stageWrap);
  }
}

function setupMobileToolbar() {
  relocateMapToolbar(mapMobileQuery.matches);
  mapMobileQuery.addEventListener("change", (event) =>
    relocateMapToolbar(event.matches),
  );
}
function showSelectedPanel() {
  const sideScroll = document.querySelector(".side-scroll");
  if (sideScroll && el("mapCharacterPane")?.classList.contains("active")) {
    sideScroll.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function legacyDurationParts(text) {
  const value = String(text || "").toLowerCase();
  if (!value || value === "variable" || value === "permanent")
    return { count: null, unit: "variable", perLevel: false };
  const count = Number((value.match(/(\d+)/) || [null, 1])[1]) || 1;
  const unit =
    ["turn", "round", "minute", "hour", "day"].find((item) =>
      value.includes(item),
    ) || "variable";
  return {
    count: unit === "variable" ? null : count,
    unit,
    perLevel:
      unit !== "variable" &&
      (value.includes("/level") || value.includes("per level")),
  };
}
function durationParts(effect) {
  if (window.PFEffectMeta?.normalizeDurationConfig) {
    const config = window.PFEffectMeta.normalizeDurationConfig(effect);
    return {
      count: config.count,
      unit: config.unit,
      perLevel: config.factors.some((factor) => factor.type === "caster"),
      config,
    };
  }
  const hasStructured =
    effect &&
    (effect.durationCount !== undefined ||
      effect.durationUnit ||
      effect.durationPerLevel !== undefined);
  if (hasStructured) {
    return {
      count:
        effect.durationCount === null ||
        effect.durationCount === undefined ||
        effect.durationCount === ""
          ? null
          : Number(effect.durationCount),
      unit: effect.durationUnit || "variable",
      perLevel: Boolean(effect.durationPerLevel),
    };
  }
  return legacyDurationParts(effect?.duration);
}
function durationUsesCasterLevel(effect) {
  const config = durationParts(effect).config;
  return config
    ? config.factors.some((factor) => factor.type === "caster")
    : durationParts(effect).perLevel;
}
function durationLabel(effect) {
  if (window.PFEffectMeta?.durationLabel)
    return window.PFEffectMeta.durationLabel(effect);
  const parts = durationParts(effect);
  if (!parts.count || parts.unit === "variable") return "variable";
  return `${parts.count} ${parts.unit}${Number(parts.count) === 1 ? "" : "s"}${parts.perLevel ? " / level" : ""}`;
}
function parseEffectDuration(effect, casterLevelOrContext = 1) {
  const context =
    casterLevelOrContext && typeof casterLevelOrContext === "object"
      ? casterLevelOrContext
      : { casterLevel: casterLevelOrContext };
  if (window.PFEffectMeta?.parseDuration)
    return window.PFEffectMeta.parseDuration(effect, context);
  const casterLevel = context.casterLevel ?? 1;
  const parts = durationParts(effect);
  if (!parts.count || parts.unit === "variable") return null;
  const amount = Number(parts.count) || 1;
  const multiplier = parts.perLevel ? Math.max(1, Number(casterLevel) || 1) : 1;
  if (parts.unit === "turn" || parts.unit === "round")
    return amount * multiplier;
  if (parts.unit === "minute") return amount * 10 * multiplier;
  if (parts.unit === "hour") return amount * 600 * multiplier;
  if (parts.unit === "day") return amount * 14400 * multiplier;
  return null;
}
function formatDurationRounds(rounds) {
  if (rounds === null || rounds === undefined) return "variable";
  if (rounds === 1) return "1 turn";
  if (rounds % 600 === 0)
    return `${rounds / 600} hour${rounds === 600 ? "" : "s"}`;
  if (rounds % 10 === 0)
    return `${rounds / 10} minute${rounds === 10 ? "" : "s"}`;
  return `${rounds} round${rounds === 1 ? "" : "s"}`;
}
function isConditionEffect(effect) {
  return String(effect?.category || "").toLowerCase() === "condition";
}
function titleCaseStat(value) {
  const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(
    String(value || "").toLowerCase().trim(),
  );
  if (choiceLabel) return choiceLabel;
  if (
    String(value || "")
      .toLowerCase()
      .trim() === "remove dex bonus to ac"
  )
    return "Remove DEX Bonus to AC";
  if (
    String(value || "")
      .toLowerCase()
      .trim() === "extra attack"
  )
    return "Extra Attack at Highest BAB";
  return String(value || "Stat")
    .replace(/^skill:/i, "Skill:")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function scaleText(scale) {
  if (!scale) return "";
  const parts = [];
  const sourceLabel = scale.source
    ? window.PFEffectMeta?.factorLabel?.(scale.source) || "level"
    : "CL";
  const milestones = Array.isArray(scale.milestones) ? scale.milestones : [];
  const milestoneText = milestones
    .filter(
      (milestone) =>
        milestone.level &&
        milestone.value !== "" &&
        milestone.value !== null &&
        milestone.value !== undefined,
    )
    .map(
      (milestone) =>
        `${sourceLabel} ${milestone.level}: ${fmtSigned(Number(milestone.value || 0))}`,
    );
  if (milestoneText.length) parts.push(milestoneText.join(", "));
  const every = scale.every || {};
  if (every.afterLevel && every.everyLevels && every.increase) {
    parts.push(
      `after ${sourceLabel} ${every.afterLevel}, every ${every.everyLevels}: ${fmtSigned(Number(every.increase || 0))}`,
    );
  }
  return parts.length ? `scales ${parts.join("; ")}` : "";
}
function effectBonusText(bonus) {
  if (
    String(bonus.stat || "")
      .toLowerCase()
      .trim() === "remove dex bonus to ac"
  ) {
    const text = "Removes DEX bonus to AC";
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }
  const scale = scaleText(bonus.bonusScale || bonus.scale);
  const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
  const text = `${fmtSigned(bonus.value || 0)} ${bonus.type || "untyped"} ${statLabel}${scale ? `; ${scale}` : ""}`;
  return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
}
function effectSearchText(effect) {
  return [
    effect.name,
    effect.category,
    durationLabel(effect),
    ...(effect.bonuses || []).map(effectBonusText),
  ]
    .join(" ")
    .toLowerCase();
}
function effectCategoryIcon(category) {
  const key = String(category || "").toLowerCase();
  if (key === "spell") return "bi-stars";
  if (key === "feat") return "bi-award";
  if (key === "debuff") return "bi-arrow-down-circle";
  if (key === "condition") return "bi-exclamation-diamond";
  if (key.includes("ability")) return "bi-lightning-charge";
  return "bi-magic";
}
function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function selectedObject() {
  return [...state.tokens, ...state.shapes].find(
    (item) => item.id === selectedId,
  );
}
function tokenById(tokenId) {
  return state.tokens.find((token) => token.id === tokenId);
}
function tokenInitials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}
function tokenCharacter(token) {
  return mapCharacters.find((character) => character.id === token.characterId);
}
function tokenActualName(token) {
  if (!token) return "Unnamed";
  if (token.kind === "character")
    return tokenCharacter(token)?.name || token.name || "Character";
  return token.name || (token.kind === "enemy" ? "Enemy" : "Token");
}
function tokenNameIsHidden(token) {
  return Boolean(token?.hideName && token.kind !== "shape");
}
function tokenInitiativeScore(token) {
  const sheet =
    token?.kind === "enemy"
      ? token.sheet || {}
      : tokenCharacter(token)?.sheet || {};
  const fields = sheet.fields || {};
  return firstNumber(
    sheet.calculated?.initiative ??
      fields.initiativeTotal ??
      fields.initTotal ??
      fields.initiative ??
      token?.initiative ??
      0,
  );
}
function displayTokenName(token) {
  const actual = tokenActualName(token);
  if (!tokenNameIsHidden(token)) return actual;
  return isGm ? `[?] ${actual}` : "?";
}
function mapLayerItems() {
  return [...state.shapes, ...state.tokens];
}
function normalizeZIndexes() {
  mapLayerItems()
    .sort((a, b) => Number(a.zIndex ?? 0) - Number(b.zIndex ?? 0))
    .forEach((item, index) => {
      item.zIndex = index + 2;
    });
}
function nextMapZIndex() {
  return (
    Math.max(1, ...mapLayerItems().map((item) => Number(item.zIndex || 1))) + 1
  );
}
function canSeeToken(token) {
  if (token.kind === "enemy" && token.visible === false && !isGm) return false;
  if (token.hidden === true && !canManageMapItem(token)) return false;
  return true;
}
function initiativeNameFromEntry(entry, tokens = state.tokens) {
  const token = tokens.find((item) => item.id === entry.tokenId);
  if (token) return displayTokenName(token);
  return entry.name || "Unnamed";
}
function normalizedInitiativeEntry(entry, tokens = state.tokens) {
  return {
    id: entry.id || entry.tokenId || uid("init"),
    tokenId: entry.tokenId || "",
    name: entry.name || initiativeNameFromEntry(entry, tokens),
    score: Number(entry.score || 0),
    disabled: Boolean(entry.disabled),
    custom: Boolean(entry.custom || !entry.tokenId),
  };
}
function normalizeInitiativeRows(rows, tokens = state.tokens) {
  return (Array.isArray(rows) ? rows : [])
    .map((entry) => normalizedInitiativeEntry(entry, tokens))
    .filter(
      (entry) =>
        entry.name &&
        (!entry.tokenId || tokens.some((token) => token.id === entry.tokenId)),
    );
}
function initiativeTokenEligible(token) {
  return (
    token &&
    (token.kind === "character" ||
      token.kind === "enemy" ||
      token.kind === "token")
  );
}
function syncInitiativeWithTokens(tokens, rows) {
  const normalized = normalizeInitiativeRows(rows, tokens);
  const linked = new Set(
    normalized.map((entry) => entry.tokenId).filter(Boolean),
  );
  tokens.filter(initiativeTokenEligible).forEach((token) => {
    if (linked.has(token.id)) return;
    normalized.push({
      id: `init_${token.id}`,
      tokenId: token.id,
      name: tokenActualName(token),
      score: tokenInitiativeScore(token),
      disabled: false,
      custom: false,
    });
  });
  return normalized;
}
function canEditTokenHp(token) {
  if (!token?.kind) return false;
  if (token.panelOnly) return false;
  if (isGm) return true;
  return token.kind === "character" && token.ownerId === currentUserId;
}
function canManageMapItem(item) {
  if (!item) return false;
  if (isGm) return true;
  if (item.kind === "character") return item.ownerId === currentUserId;
  if (item.kind === "token") return item.ownerId === currentUserId;
  if (item.shape) return true;
  return false;
}
function canManageAura(token) {
  if (!token?.kind) return false;
  if (isGm) return true;
  return token.kind === "character" && token.ownerId === currentUserId;
}
function canManageEffects(token) {
  if (!token?.kind) return false;
  if (token.panelOnly) return false;
  if (isGm) return true;
  return token.kind === "character" && token.ownerId === currentUserId;
}

function canViewCharacter(character) {
  if (!character) return false;
  return isGm || character.userId === currentUserId;
}

function canViewTokenSheet(token) {
  if (!token?.kind) return false;
  if (token.kind === "enemy") return isGm;
  if (token.kind === "character") return canViewCharacter(tokenCharacter(token));
  return false;
}
function canRollToken(token) {
  if (!token?.kind) return false;
  if (isGm) return token.kind === "character" || token.kind === "enemy";
  return token.kind === "character" && token.ownerId === currentUserId;
}
function tokenHpText(token) {
  if (token.kind !== "character") return "";
  const pending = pendingTokenHp.get(token.id);
  const fields = tokenCharacter(token)?.sheet?.fields || {};
  const current = pending ?? fields.currentHitPoints;
  const total = fields.hitPointsTotal || fields.hitPoints;
  if (
    (current === undefined || current === "") &&
    (total === undefined || total === "")
  )
    return "HP not set";
  return `${current ?? "?"}/${total ?? "?"} HP`;
}

function tokenCurrentHp(token) {
  const pending = pendingTokenHp.get(token.id);
  if (pending !== undefined) return pending;
  if (token.kind === "enemy")
    return (
      token.sheet?.calculated?.hp?.current ||
      token.sheet?.fields?.currentHitPoints ||
      token.hp ||
      ""
    );
  const fields = tokenCharacter(token)?.sheet?.fields || {};
  return fields.currentHitPoints ?? "";
}

function tokenTotalHp(token) {
  if (token.kind === "enemy")
    return (
      token.sheet?.calculated?.hp?.total ||
      token.sheet?.fields?.hitPointsTotal ||
      token.sheet?.fields?.hitPoints ||
      ""
    );
  const sheet = tokenCharacter(token)?.sheet || {};
  return (
    sheet.calculated?.hp?.total ||
    sheet.fields?.hitPointsTotal ||
    sheet.fields?.hitPoints ||
    ""
  );
}

function sheetNum(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sheetMod(score) {
  return Math.floor((sheetNum(score, 10) - 10) / 2);
}

function fmtSigned(value) {
  const number = sheetNum(value);
  return number >= 0 ? `+${number}` : String(number);
}

function iterativeBabBonuses(bab) {
  const first = sheetNum(bab);
  if (first < 1) return [first];
  const bonuses = [];
  for (let value = first; value >= 1; value -= 5) bonuses.push(value);
  return bonuses;
}

function sheetAbilityScore(sheet, key) {
  return sheetNum(sheet?.abilities?.[key]?.score, 10);
}

function sheetAbilityMod(sheet, key) {
  return sheetMod(sheetAbilityScore(sheet, key));
}

function firstScalingKey(value, fallback = "str") {
  return (
    String(value || fallback)
      .toLowerCase()
      .match(/\b(str|dex|con|int|wis|cha)\b/)?.[1] || fallback
  );
}

const MAP_TWF_MODE_FIELDS = [
  "twfNoFeatPrimary",
  "twfNoFeatOff",
  "twfFeatPrimary",
  "twfFeatOff",
];
const MAP_TWF_PRIMARY_FIELDS = ["twfNoFeatPrimary", "twfFeatPrimary"];
const MAP_TWF_OFFHAND_FIELDS = ["twfNoFeatOff", "twfFeatOff"];

function mapWeaponOptionChecked(weapon, field) {
  return String(weapon?.[field] || "").toLowerCase() === "yes";
}

function mapWeaponTwfOffhand(weapon) {
  return MAP_TWF_OFFHAND_FIELDS.some((field) =>
    mapWeaponOptionChecked(weapon, field),
  );
}

function mapWeaponTwfFeatOffhand(weapon) {
  return mapWeaponOptionChecked(weapon, "twfFeatOff");
}

function weaponOptionLabel(field) {
  return (
    {
      twoHanded: "Two-Handed",
      powerAttack: "Power Attack",
      deadlyAim: "Deadly Aim",
      rapidShot: "Rapid Shot",
      twfNoFeatPrimary: "No TWF Primary Hand",
      twfNoFeatOff: "No TWF Off Hand",
      twfFeatPrimary: "TWF Primary Hand",
      twfFeatOff: "TWF Off Hand",
      improvedTwf: "Improved TWF",
      greaterTwf: "Greater TWF",
    }[field] || field
  );
}

function mapWeaponTypeIsRanged(type) {
  return [
    "Ranged Weapon",
    "Firearm (One-Handed)",
    "Firearm (Two-Handed)",
  ].includes(type);
}

function mapWeaponOptionFields(weapon = {}) {
  const weaponType = weapon.weaponType || "Melee Weapon (One-Handed)";
  const ranged = mapWeaponTypeIsRanged(weaponType);
  const fields = [
    ...(ranged ? ["deadlyAim", "rapidShot"] : ["twoHanded", "powerAttack"]),
    ...MAP_TWF_MODE_FIELDS,
  ];
  if (mapWeaponTwfFeatOffhand(weapon)) fields.push("improvedTwf", "greaterTwf");
  return fields;
}

function renderMapWeaponOptions(token, weapon, index) {
  if (!canManageMapItem(token)) return "";
  const fields = mapWeaponOptionFields(weapon);
  const twfHelp =
    "Two-Weapon Fighting: choose one primary hand weapon and one or more off-hand weapons. No TWF uses the harsher no-feat penalties. TWF uses feat penalties. A light off-hand weapon improves the penalties. Improved/Greater TWF add extra off-hand attacks.";
  return `
    <div class="map-weapon-options" data-map-weapon-options="${index}">
      <div class="map-weapon-options-title">
        <span>Attack Options</span>
        <i class="bi bi-info-circle" title="${escapeHtml(twfHelp)}" aria-label="${escapeHtml(twfHelp)}"></i>
      </div>
      ${fields
        .map(
          (field) => `
        <label class="map-weapon-option">
          <span>${escapeHtml(weaponOptionLabel(field))}</span>
          <input class="form-check-input" type="checkbox" data-map-weapon-option="${index}" data-map-weapon-field="${escapeHtml(field)}" ${mapWeaponOptionChecked(weapon, field) ? "checked" : ""}>
        </label>
      `,
        )
        .join("")}
    </div>
  `;
}

function applyWeaponOptionChangeToSheet(sheet, weaponIndex, field, checked) {
  const next = structuredClone(sheet || {});
  next.weapons = Array.isArray(next.weapons) ? next.weapons : [];
  if (!next.weapons[weaponIndex]) return next;
  const weapon = next.weapons[weaponIndex];

  if (MAP_TWF_MODE_FIELDS.includes(field) && checked) {
    weapon.twoHanded = "no";
    MAP_TWF_MODE_FIELDS.forEach((otherField) => {
      if (otherField !== field) weapon[otherField] = "no";
    });
    if (MAP_TWF_PRIMARY_FIELDS.includes(field)) {
      next.weapons.forEach((otherWeapon, index) => {
        if (index === weaponIndex) return;
        MAP_TWF_PRIMARY_FIELDS.forEach((primaryField) => {
          otherWeapon[primaryField] = "no";
        });
      });
    }
  }
  if (field === "twoHanded" && checked) {
    MAP_TWF_MODE_FIELDS.forEach((twfField) => {
      weapon[twfField] = "no";
    });
    weapon.improvedTwf = "no";
    weapon.greaterTwf = "no";
  }
  if (field === "rapidShot" && checked) {
    next.weapons.forEach((otherWeapon, index) => {
      if (index !== weaponIndex) otherWeapon.rapidShot = "no";
    });
  }

  weapon[field] = checked ? "yes" : "no";
  if (field === "greaterTwf" && checked) weapon.improvedTwf = "yes";
  if (!mapWeaponTwfFeatOffhand(weapon)) {
    weapon.improvedTwf = "no";
    weapon.greaterTwf = "no";
  }
  return next;
}

async function saveMapWeaponOption(tokenId, weaponIndex, field, checked) {
  const token = tokenById(tokenId);
  if (!token || !canManageMapItem(token)) return;
  const currentSheet = structuredClone(rollTokenSheet(token) || {});
  if (
    !Array.isArray(currentSheet.weapons) ||
    !currentSheet.weapons[weaponIndex]
  )
    return;
  const nextSheet = applyWeaponOptionChangeToSheet(
    currentSheet,
    weaponIndex,
    field,
    checked,
  );

  if (token.kind === "character") {
    const character = tokenCharacter(token);
    if (!character?.id) return;
    character.sheet = nextSheet;
    syncTokenFromSheet(token, character);
    renderAll(false);
    const saved =
      (await PFApp.updateCharacterSheetRaw?.(
        character.id,
        nextSheet,
        mapContextKey,
      )) ||
      (await PFApp.saveCharacterSheet(
        character.name || token.name || "Character",
        nextSheet,
        mapContextKey,
        character.id,
      ));
    if (!saved) {
      await refreshMapTokenSheets({ save: false });
      return;
    }
    await recalculateCharacterSheetFromMap(character.id);
    const refreshed = await PFApp.loadCharacterSheet(
      "",
      mapContextKey,
      character.id,
    );
    if (refreshed?.sheet) character.sheet = refreshed.sheet;
    syncTokenFromSheet(token, character);
    localStorage.setItem(
      `pf_character_sheet_updated_${mapContextKey}_${character.id}`,
      String(Date.now()),
    );
    renderAll(false);
    return;
  }

  if (token.kind === "enemy" && isGm) {
    token.sheet = nextSheet;
    renderAll(false);
    const saved = await PFApp.saveEnemy(
      {
        id: token.enemyId,
        name: token.name || "Enemy",
        visible: token.visible !== false,
        sheet: nextSheet,
      },
      mapContextKey,
    );
    if (!saved) {
      await refreshMapTokenSheets({ save: false });
      return;
    }
    await recalculateEnemySheetFromMap(token.enemyId);
    const refreshed = await PFApp.loadEnemy(token.enemyId, mapContextKey);
    const nextEnemy = refreshed || saved;
    token.sheet = structuredClone(nextEnemy.sheet || nextSheet);
    syncTokenFromSheet(token, nextEnemy);
    mapEnemies = mapEnemies.map((enemy) =>
      enemy.id === nextEnemy.id ? nextEnemy : enemy,
    );
    localStorage.setItem(
      `pf_enemy_sheet_updated_${mapContextKey}_${token.enemyId}`,
      String(Date.now()),
    );
    renderAll(false);
  }
}

function sheetArmorBonus(sheet, typeName) {
  return (sheet?.armor || []).reduce((total, item) => {
    const type = String(item.type || "").toLowerCase();
    if (!type.includes(typeName)) return total;
    return total + sheetNum(item.bonus) + sheetNum(item.enhancement);
  }, 0);
}

function compactStat(label, value) {
  return `<div class="mini-sheet-card"><div class="mini-sheet-label">${escapeHtml(label)}</div><div class="mini-sheet-value">${escapeHtml(value)}</div></div>`;
}

function compactInlineConditionals(rows = []) {
  return (rows || [])
    .map((conditional) => {
      const note =
        conditional.detail ||
        conditional.appliesWhen ||
        conditional.label ||
        "Conditional";
      return `<div class="mini-sheet-inline-conditional"><span>${escapeHtml(conditional.total || "")}</span>${note ? ` <small>(${escapeHtml(note)})</small>` : ""}</div>`;
    })
    .join("");
}

function compactStatWithConditionals(label, value, conditionals = []) {
  return `
    <div class="mini-sheet-card">
      <div class="mini-sheet-label">${escapeHtml(label)}</div>
      <div class="mini-sheet-value">${escapeHtml(value)}</div>
      ${compactInlineConditionals(conditionals)}
    </div>
  `;
}

function compactSaveStat(row) {
  return compactStatWithConditionals(
    row.label || row.key || "Save",
    row.total || "",
    row.conditionals || [],
  );
}

function compactConditionalStat(row) {
  return `<div class="mini-sheet-card mini-sheet-conditional"><div class="mini-sheet-label">${escapeHtml(row.label || "Conditional")}</div><div class="mini-sheet-value">${escapeHtml(row.total || "")}</div>${row.source ? `<div class="small text-secondary">${escapeHtml(row.source)}</div>` : ""}</div>`;
}

function compactConditionalStats(rows = []) {
  return (rows || []).map(compactConditionalStat).join("");
}

function compactConditionalRows(rows = []) {
  return (rows || [])
    .map(
      (row) => `
    <div class="mini-sheet-row mini-sheet-conditional">
      <span>${escapeHtml(row.detail || row.source || "Conditional")}</span>
      <span>${escapeHtml(row.main || row.total || "")}</span>
    </div>
  `,
    )
    .join("");
}

function compactHpStat(token, calculated = null) {
  const current = calculated?.hp?.current || tokenCurrentHp(token) || "?";
  const total = calculated?.hp?.total || tokenTotalHp(token) || "?";
  const value = canEditTokenHp(token)
    ? `<div class="mini-sheet-value d-flex align-items-center gap-1">
        <input data-token-current-hp="${escapeHtml(token.id)}" class="form-control form-control-sm hp-number-input" type="number" value="${escapeHtml(current)}" style="width:70px;">
        <span>/ ${escapeHtml(total)}</span>
      </div>`
    : `<div class="mini-sheet-value">${escapeHtml(`${current}/${total}`)}</div>`;
  return `<div class="mini-sheet-card"><div class="mini-sheet-label">HP</div>${value}</div>`;
}

function compactSection(title, html) {
  return `<div><div class="mini-sheet-title">${escapeHtml(title)}</div>${html}</div>`;
}

function compactAbilityValue(row) {
  const total = String(row.total || "");
  const mod = String(row.mod || "");
  if (!mod || /\([+-]?\d+\)/.test(total)) return total;
  return `${total} (${mod})`;
}

function renderCalculatedSheetSummary(token, calculated) {
  const abilities = calculated.abilities || [];
  const saves = calculated.saves || [];
  const weapons = calculated.weapons || [];
  const rawWeapons = rollTokenSheet(token).weapons || [];
  return `
    <div class="mini-sheet">
      ${compactSection(
        "Character",
        `<div class="mini-sheet-grid">
        ${compactHpStat(token, calculated)}
        ${compactStat("Init", calculated.initiative || "")}
        ${compactConditionalStats(calculated.hpConditionals || [])}
        ${compactConditionalStats(calculated.initiativeConditionals || [])}
      </div>`,
      )}
      ${compactSection(
        "Abilities",
        `<div class="mini-sheet-grid">
        ${abilities.map((row) => compactStatWithConditionals(row.label || row.key?.toUpperCase() || "Ability", compactAbilityValue(row), row.conditionals || [])).join("")}
      </div>`,
      )}
      ${compactSection(
        "Armor Class",
        `<div class="mini-sheet-grid">
        ${compactStatWithConditionals("AC", calculated.armorClass?.ac || "", calculated.armorClass?.conditionals?.ac || [])}
        ${compactStatWithConditionals("Touch", calculated.armorClass?.touch || "", calculated.armorClass?.conditionals?.touch || [])}
        ${compactStatWithConditionals("Flat", calculated.armorClass?.flat || "", calculated.armorClass?.conditionals?.flat || [])}
      </div>`,
      )}
      ${compactSection(
        "Combat",
        `<div class="mini-sheet-grid">
        ${compactStatWithConditionals("CMB", calculated.combat?.cmb || "", calculated.combat?.conditionals?.cmb || [])}
        ${compactStatWithConditionals("CMD", calculated.combat?.cmd || "", calculated.combat?.conditionals?.cmd || [])}
      </div>`,
      )}
      ${compactSection(
        "Saves",
        `<div class="mini-sheet-grid">
        ${saves.map(compactSaveStat).join("")}
      </div>`,
      )}
      ${compactSection(
        "Weapons",
        `<div class="mini-sheet-list">${
          weapons.length
            ? weapons
                .map((weapon, index) => {
                  const expanded =
                    expandedMapWeaponKey === `${token.id}:${index}`;
                  return `<div class="mini-sheet-row map-weapon-row" data-map-weapon-expand="${index}"><span><i class="bi ${expanded ? "bi-chevron-down" : "bi-chevron-right"} me-1"></i>${escapeHtml(weapon.name || "Weapon")}</span><span>${escapeHtml([weapon.attack, weapon.damage, weapon.critical].filter(Boolean).join(" | "))}</span></div>${expanded ? renderMapWeaponOptions(token, rawWeapons[index] || {}, index) : ""}${compactConditionalRows([...(weapon.attackConditionals || []), ...(weapon.damageConditionals || [])])}`;
                })
                .join("")
            : `<div class="small text-secondary">No weapons.</div>`
        }</div>`,
      )}
    </div>
  `;
}

function renderCompactCharacterSheet(token) {
  if (token.kind === "enemy") {
    return isGm && token.sheet?.calculated
      ? renderCalculatedSheetSummary(token, token.sheet.calculated)
      : isGm
        ? `<div class="mini-sheet">${compactSection("Enemy Sheet", `<div class="small text-secondary">No calculated sheet summary found.</div>`)}</div>`
        : "";
  }
  if (token.kind !== "character") return "";
  if (!canViewTokenSheet(token)) return "";

  const character = tokenCharacter(token);
  const sheet = character?.sheet || {};
  const fields = sheet.fields || {};
  if (!Object.keys(sheet).length)
    return `<div class="small text-secondary mb-2">No saved sheet data found.</div>`;
  if (sheet.calculated)
    return renderCalculatedSheetSummary(token, sheet.calculated);

  const str = sheetAbilityMod(sheet, "str");
  const dex = sheetAbilityMod(sheet, "dex");
  const con = sheetAbilityMod(sheet, "con");
  const wis = sheetAbilityMod(sheet, "wis");
  const bab = sheetNum(fields.bab);
  const miscAc = sheetNum(fields.acMisc);
  const natural = sheetNum(fields.acNatural);
  const deflection = sheetNum(fields.acDeflection);
  const armor = sheetArmorBonus(sheet, "armor");
  const shield = sheetArmorBonus(sheet, "shield");
  const ac = 10 + armor + shield + dex + natural + deflection + miscAc;
  const touch = 10 + dex + deflection + miscAc;
  const flat = ac - Math.max(0, dex);
  const hpCurrent = fields.currentHitPoints ?? "?";
  const hpTotal = fields.hitPointsTotal || fields.hitPoints || "?";
  const initiative = dex + sheetNum(fields.initMisc);
  const cmbMisc = sheetNum(fields.cmbMisc);
  const cmdMisc = sheetNum(fields.cmdMisc);
  const saves = [
    ["Fort", sheetNum(sheet.saves?.fort?.base) + con],
    ["Ref", sheetNum(sheet.saves?.reflex?.base) + dex],
    ["Will", sheetNum(sheet.saves?.will?.base) + wis],
  ];
  const weapons =
    (sheet.weapons || [])
      .slice(0, 4)
      .map((weapon, index) => {
        const attackKey = firstScalingKey(weapon.attackScale, "str");
        const damageKey = firstScalingKey(weapon.damageScale, attackKey);
        const enhancement = sheetNum(weapon.enhancement);
        const attackMisc = sheetNum(weapon.attackMisc);
        const damageMisc = sheetNum(weapon.damageMisc);
        const attack =
          bab + sheetAbilityMod(sheet, attackKey) + enhancement + attackMisc;
        const attacks = iterativeBabBonuses(bab)
          .map((base) =>
            fmtSigned(
              base +
                sheetAbilityMod(sheet, attackKey) +
                enhancement +
                attackMisc,
            ),
          )
          .join("/");
        const damageMod =
          Math.floor(
            sheetAbilityMod(sheet, damageKey) *
              (weapon.twoHanded === "yes" ? 1.5 : 1),
          ) +
          enhancement +
          damageMisc;
        const damage =
          `${weapon.damage || ""}${damageMod ? fmtSigned(damageMod) : ""}` ||
          fmtSigned(damageMod);
        const expanded = expandedMapWeaponKey === `${token.id}:${index}`;
        return `<div class="mini-sheet-row map-weapon-row" data-map-weapon-expand="${index}"><span><i class="bi ${expanded ? "bi-chevron-down" : "bi-chevron-right"} me-1"></i>${escapeHtml(weapon.name || "Weapon")}</span><span>${escapeHtml(attacks || fmtSigned(attack))} | ${escapeHtml(damage)} | ${escapeHtml(weapon.critical || "-")}</span></div>${expanded ? renderMapWeaponOptions(token, weapon, index) : ""}`;
      })
      .join("") || `<div class="small text-secondary">No weapons.</div>`;

  return `
    <div class="mini-sheet">
      ${compactSection(
        "Character",
        `<div class="mini-sheet-grid">
        ${compactHpStat(token)}
        ${compactStat("Init", fmtSigned(initiative))}
      </div>`,
      )}
      ${compactSection(
        "Abilities",
        `<div class="mini-sheet-grid">
        ${["str", "dex", "con", "int", "wis", "cha"].map((key) => compactStat(key.toUpperCase(), `${sheetAbilityScore(sheet, key)} (${fmtSigned(sheetAbilityMod(sheet, key))})`)).join("")}
      </div>`,
      )}
      ${compactSection(
        "Armor Class",
        `<div class="mini-sheet-grid">
        ${compactStat("AC", ac)}
        ${compactStat("Touch", touch)}
        ${compactStat("Flat", flat)}
      </div>`,
      )}
      ${compactSection(
        "Combat",
        `<div class="mini-sheet-grid">
        ${compactStat("CMB", fmtSigned(bab + str + cmbMisc))}
        ${compactStat("CMD", 10 + bab + str + dex + cmdMisc)}
      </div>`,
      )}
      ${compactSection("Saves", `<div class="mini-sheet-grid">${saves.map(([label, value]) => compactStat(label, fmtSigned(value))).join("")}</div>`)}
      ${compactSection("Weapons", `<div class="mini-sheet-list">${weapons}</div>`)}
    </div>
  `;
}

function viewableMapCharacters() {
  return mapCharacters
    .filter(canViewCharacter)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function tokenForCharacterPanel(character) {
  const token = state.tokens.find(
    (item) => item.kind === "character" && item.characterId === character.id,
  );
  if (token) return token;
  return {
    id: `panel-character-${character.id}`,
    kind: "character",
    characterId: character.id,
    ownerId: character.userId || "",
    name: character.name || "Character",
    panelOnly: true,
  };
}

function renderCharacterPanelList(activeCharacterId = "") {
  const rows = viewableMapCharacters();
  if (!rows.length) return "";
  return `
    <div class="character-panel-list mb-2">
      ${rows
        .map((character) => {
          const active = character.id === activeCharacterId ? " active" : "";
          const onMap = state.tokens.some(
            (token) =>
              token.kind === "character" && token.characterId === character.id,
          );
          return `
            <button class="character-panel-button${active}" type="button" data-character-panel-id="${escapeHtml(character.id)}">
              <span>${escapeHtml(character.name || "Character")}</span>
              ${onMap ? `<small>On map</small>` : ""}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCharacterPanelBack(characterName = "") {
  return `
    <div class="character-panel-detail-header">
      <span>${escapeHtml(characterName || "Characters")}</span>
      <button class="character-panel-back" type="button" data-character-panel-back>
        <i class="bi bi-arrow-left"></i>
        Back
      </button>
    </div>
  `;
}

function shapeTexture(textureId) {
  return SHAPE_TEXTURES.find((texture) => texture.id === textureId);
}

function tilePosition(tileIndex) {
  const index = Math.max(0, Math.min(23, Number(tileIndex || 0)));
  const col = index % 6;
  const row = Math.floor(index / 6);
  return { x: `${col * 20}%`, y: `${row * (100 / 3)}%` };
}

async function hydrateMapCharacterSheets() {
  if (!mapCharacters.length) return;
  await Promise.all(
    mapCharacters.map(async (character) => {
      const saved = await PFApp.loadCharacterSheet(
        "",
        mapContextKey,
        character.id,
      );
      if (saved?.sheet) character.sheet = saved.sheet;
    }),
  );
}

function sheetClassFeatureCalculationSignature(sheet = {}) {
  const progression = Array.isArray(sheet.classProgression)
    ? sheet.classProgression
    : [];
  const choices =
    sheet.classFeatureChoices && typeof sheet.classFeatureChoices === "object"
      ? sheet.classFeatureChoices
      : {};
  if (!progression.length && !Object.keys(choices).length) return "";
  return JSON.stringify({
    level: sheet.fields?.characterLevel || "",
    classProgression: progression,
    classFeatureChoices: choices,
    saves: sheet.saves || {},
    fields: {
      babMisc: sheet.fields?.babMisc || "",
      fortMisc: sheet.fields?.fortMisc || "",
      reflexMisc: sheet.fields?.reflexMisc || "",
      willMisc: sheet.fields?.willMisc || "",
    },
  });
}

function canRecalculateMapCharacter(character) {
  return Boolean(character?.id && (isGm || character.userId === currentUserId));
}

async function ensureMapCharacterCalculatedSummary(character) {
  if (
    !character?.id ||
    !character.sheet ||
    !canRecalculateMapCharacter(character)
  )
    return false;
  const signature = sheetClassFeatureCalculationSignature(character.sheet);
  if (!signature) return false;
  const key = `character:${character.id}`;
  if (mapSheetCalculationSignatures.get(key) === signature) return false;
  mapSheetCalculationSignatures.set(key, signature);
  const calculated = await recalculateCharacterSheetFromMap(character.id);
  if (!calculated) {
    mapSheetCalculationSignatures.delete(key);
    return false;
  }
  const saved = await PFApp.loadCharacterSheet("", mapContextKey, character.id);
  if (saved?.sheet) character.sheet = saved.sheet;
  return true;
}

async function ensureMapEnemyCalculatedSummary(enemy) {
  if (!enemy?.id || !enemy.sheet) return false;
  const signature = sheetClassFeatureCalculationSignature(enemy.sheet);
  if (!signature) return false;
  const key = `enemy:${enemy.id}`;
  if (mapSheetCalculationSignatures.get(key) === signature) return false;
  mapSheetCalculationSignatures.set(key, signature);
  const calculated = await recalculateEnemySheetFromMap(enemy.id);
  if (!calculated) {
    mapSheetCalculationSignatures.delete(key);
    return false;
  }
  const saved = await PFApp.loadEnemy(enemy.id, mapContextKey);
  if (saved?.sheet) enemy.sheet = saved.sheet;
  return true;
}

function syncTokenFromSheet(token, source) {
  if (!token || !source?.sheet) return false;
  let changed = false;
  const sheet = source.sheet || {};
  const name = source.name || source.character_name || token.name;
  const currentHp =
    sheet.calculated?.hp?.current || sheet.fields?.currentHitPoints || "";
  const totalHp =
    sheet.calculated?.hp?.total ||
    sheet.fields?.hitPointsTotal ||
    sheet.fields?.hitPoints ||
    "";
  const nextHp =
    currentHp || totalHp
      ? `${currentHp || "?"}/${totalHp || "?"}`
      : token.hp || "";
  const nextAc =
    sheet.calculated?.armorClass?.ac || sheet.fields?.acTotal || token.ac || "";
  const sheetImageUrl = String(
    sheet.fields?.imageUrl || sheet.imageUrl || "",
  ).trim();

  if (name && token.name !== name) {
    token.name = name;
    changed = true;
  }
  if (!token.imageUrl && sheetImageUrl) {
    token.imageUrl = sheetImageUrl;
    changed = true;
  }
  if (token.kind === "enemy" && token.sheet !== sheet) {
    token.sheet = structuredClone(sheet);
    changed = true;
  }
  if (!pendingTokenHp.has(token.id) && nextHp && token.hp !== nextHp) {
    token.hp = nextHp;
    changed = true;
  }
  if (nextAc && token.ac !== nextAc) {
    token.ac = nextAc;
    changed = true;
  }
  return changed;
}

async function refreshMapTokenSheets({ save = false } = {}) {
  let changed = false;
  await hydrateMapCharacterSheets();

  for (const token of state.tokens) {
    if (token.kind !== "character") continue;
    const character = tokenCharacter(token);
    if (character)
      changed =
        (await ensureMapCharacterCalculatedSummary(character)) || changed;
  }

  state.tokens.forEach((token) => {
    if (token.kind !== "character") return;
    const character = tokenCharacter(token);
    if (character) changed = syncTokenFromSheet(token, character) || changed;
  });

  if (isGm) {
    mapEnemies = await PFApp.loadEnemies(mapContextKey);
    for (const token of state.tokens) {
      if (token.kind !== "enemy" || !token.enemyId) continue;
      const enemy = mapEnemies.find((item) => item.id === token.enemyId);
      if (enemy)
        changed = (await ensureMapEnemyCalculatedSummary(enemy)) || changed;
    }
    state.tokens.forEach((token) => {
      if (token.kind !== "enemy" || !token.enemyId) return;
      const enemy = mapEnemies.find((item) => item.id === token.enemyId);
      if (enemy) changed = syncTokenFromSheet(token, enemy) || changed;
    });
  }

  if (changed) renderAll(save);
}

async function determineGm(contextKey) {
  return PFApp.isGameManager(contextKey);
}

function normalizeState(raw) {
  const tokens = Array.isArray(raw?.tokens) ? raw.tokens : [];
  const normalizedInitiative = syncInitiativeWithTokens(
    tokens,
    raw?.initiative,
  );
  const settings = { ...defaultState.settings, ...(raw?.settings || {}) };
  // backgroundCols/backgroundRows record the image's own aspect ratio (used
  // to seed Cell X/Y when it first loads, and as the link button's target
  // ratio) -- they are not a floor. Cell X/Y are freely adjustable in
  // either direction; the image always scales to fill them.
  settings.backgroundCols = Math.max(0, Number(settings.backgroundCols) || 0);
  settings.backgroundRows = Math.max(0, Number(settings.backgroundRows) || 0);
  settings.cols = clamp(
    Number(settings.cols) || MAP_SIZE_MIN,
    MAP_SIZE_MIN,
    MAP_SIZE_MAX,
  );
  settings.rows = clamp(
    Number(settings.rows) || MAP_SIZE_MIN,
    MAP_SIZE_MIN,
    MAP_SIZE_MAX,
  );
  const nextState = {
    settings,
    tokens,
    shapes: Array.isArray(raw?.shapes) ? raw.shapes : [],
    heightShapes: Array.isArray(raw?.heightShapes) ? raw.heightShapes : [],
    initiative: normalizedInitiative,
    activeTurn: clamp(
      Number(raw?.activeTurn || 0),
      0,
      Math.max(0, normalizedInitiative.length - 1),
    ),
    roundsPassed: Math.max(1, Number(raw?.roundsPassed || 1)),
    turnSequence: Math.max(0, Number(raw?.turnSequence || 0)),
    effectNotices: Array.isArray(raw?.effectNotices)
      ? raw.effectNotices.slice(-10)
      : [],
    timeline: Array.isArray(raw?.timeline) ? raw.timeline.slice(-20) : [],
    fog: {
      visible: Boolean(raw?.fog?.visible),
      color:
        typeof raw?.fog?.color === "string" && raw.fog.color
          ? raw.fog.color
          : "#000000",
    },
  };
  state = nextState;
  normalizeZIndexes();
  return nextState;
}

function currentMapSlotName() {
  return state.settings?.name?.trim() || `Map ${mapViewSlot}`;
}

function measureImageNaturalSize(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function backgroundFootprintFromNaturalSize(width, height) {
  return {
    cols: clamp(
      Math.round(width / MAP_IMAGE_REFERENCE_CELL_PX) || 1,
      1,
      MAP_SIZE_MAX,
    ),
    rows: clamp(
      Math.round(height / MAP_IMAGE_REFERENCE_CELL_PX) || 1,
      1,
      MAP_SIZE_MAX,
    ),
  };
}

// Cell X/Y always range over the same [MAP_SIZE_MIN, MAP_SIZE_MAX] bounds --
// a loaded background image only affects their *default*, never a floor,
// so the grid can be made coarser (bigger cells) or finer (smaller cells)
// freely in either direction.
function applyCellSizeBounds() {
  const colsInput = el("cellX");
  const rowsInput = el("cellY");
  colsInput.min = String(MAP_SIZE_MIN);
  rowsInput.min = String(MAP_SIZE_MIN);
  colsInput.max = String(MAP_SIZE_MAX);
  rowsInput.max = String(MAP_SIZE_MAX);
}

// When linked, editing Cell X or Cell Y keeps the other one proportional so
// a resize never distorts the background image. The target ratio comes
// from the loaded image itself when there is one; otherwise it's whatever
// ratio the two fields already show, so a fresh resize can't warp that.
// The ratio a link-driven resize should hold. When an image is loaded --
// including one just measured but not saved yet -- its own ratio always
// wins. Otherwise this returns a ratio captured at a well-defined moment
// (modal open, or the link being re-enabled) rather than re-deriving it
// from the field a live edit just changed, which would be self-referential.
let noImageCellRatio = 1;

function targetCellRatio() {
  const url = el("backgroundUrl").value.trim();
  const pending =
    pendingBackgroundFootprint?.url === url ? pendingBackgroundFootprint : null;
  const bgCols = pending?.cols || state.settings.backgroundCols || 0;
  const bgRows = pending?.rows || state.settings.backgroundRows || 0;
  if (bgCols > 0 && bgRows > 0) return bgRows / bgCols;
  return noImageCellRatio || 1;
}

function captureNoImageCellRatio() {
  const x = Number(el("cellX").value) || 1;
  const y = Number(el("cellY").value) || 1;
  noImageCellRatio = y / x;
}

function setCellLinkEnabled(enabled) {
  cellRatioLinked = enabled;
  // Re-locking (e.g. after free, unlinked edits) should hold whatever
  // ratio is showing right now, not a stale one from when the modal opened.
  if (enabled) captureNoImageCellRatio();
  const btn = el("cellLinkToggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(enabled));
  btn.classList.toggle("btn-primary", enabled);
  btn.classList.toggle("btn-outline-secondary", !enabled);
  const label = enabled
    ? "Locked to the image's aspect ratio"
    : "Unlocked -- Cell X and Cell Y resize independently";
  btn.title = label;
  btn.setAttribute("aria-label", label);
}

// Reads whichever of Cell X / Cell Y just changed, clamps it, and -- when
// linked -- recomputes the other one to hold the target ratio. Commits both
// to state.settings and re-renders.
function handleCellSizeChange(sourceId) {
  const xInput = el("cellX");
  const yInput = el("cellY");
  const minCols = Number(xInput.min) || MAP_SIZE_MIN;
  const minRows = Number(yInput.min) || MAP_SIZE_MIN;

  if (cellRatioLinked) {
    const ratio = targetCellRatio(); // rows per column
    if (sourceId === "cellY") {
      const y = clamp(Number(yInput.value) || minRows, minRows, MAP_SIZE_MAX);
      const x = clamp(Math.round(y / ratio) || minCols, minCols, MAP_SIZE_MAX);
      yInput.value = String(y);
      xInput.value = String(x);
    } else {
      const x = clamp(Number(xInput.value) || minCols, minCols, MAP_SIZE_MAX);
      const y = clamp(Math.round(x * ratio) || minRows, minRows, MAP_SIZE_MAX);
      xInput.value = String(x);
      yInput.value = String(y);
    }
  } else {
    xInput.value = String(
      clamp(Number(xInput.value) || minCols, minCols, MAP_SIZE_MAX),
    );
    yInput.value = String(
      clamp(Number(yInput.value) || minRows, minRows, MAP_SIZE_MAX),
    );
  }

  state.settings.cols = Number(xInput.value);
  state.settings.rows = Number(yInput.value);
  renderAll();
}

function applySettingsToInputs() {
  el("gridSize").value = localGridSize;
  el("cellX").value = state.settings.cols;
  el("cellY").value = state.settings.rows;
  el("backgroundUrl").value = state.settings.backgroundUrl || "";
  applyCellSizeBounds();
  el("fogSettingsWrap").classList.toggle("d-none", !isGm);
  el("fogColor").value = state.fog?.color || "#000000";
  updateFogButtonLabel();
  el("mapNameWrap").classList.toggle("d-none", !isGm);
  el("mapName").value = state.settings.name || "";
  el("mapName").placeholder = `Map ${mapViewSlot}`;
  el("backgroundOptionsTitle").textContent = isGm
    ? `Map Settings — ${currentMapSlotName()}`
    : "Map Settings";
  captureNoImageCellRatio();
}

// Fires while editing the Background URL field in the modal: measures the
// new image (if any) and, if it's genuinely a different image, defaults
// Cell X/Y to match its aspect ratio -- purely a starting point, the GM can
// still resize freely (bigger, coarser cells or smaller, finer ones) from
// there, using the link button to stay proportional or not as they choose.
async function handleBackgroundUrlChange() {
  const url = el("backgroundUrl").value.trim();
  if (!url) {
    pendingBackgroundFootprint = { url: "", cols: 0, rows: 0 };
    return;
  }
  const size = await measureImageNaturalSize(url);
  if (el("backgroundUrl").value.trim() !== url) return; // field changed again meanwhile
  if (!size) {
    pendingBackgroundFootprint = { url, cols: 0, rows: 0 };
    return;
  }
  const footprint = backgroundFootprintFromNaturalSize(size.width, size.height);
  pendingBackgroundFootprint = { url, ...footprint };
  if (url !== state.settings.backgroundUrl) {
    el("cellX").value = String(footprint.cols);
    el("cellY").value = String(footprint.rows);
  }
}

function adjustNumberInput(input, delta) {
  if (!input) return;
  const current = Number(input.value || 0);
  const min = input.min === "" ? -Infinity : Number(input.min);
  const max = input.max === "" ? Infinity : Number(input.max);
  const next = Math.min(max, Math.max(min, current + delta));
  input.value = String(next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function bindNumberSteppers() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-stepper-delta]");
    if (!button) return;
    const wrapper = button.closest("[data-item-stepper]");
    const input = wrapper?.querySelector("input");
    adjustNumberInput(input, Number(button.dataset.itemStepperDelta || 0));
  });
}

// Every user (GM and players alike) picks their own map slot independently
// -- there's no shared "live" map, so different people can be looking at
// different maps at the same time. The choice is remembered per browser.
function renderMapSlotNav() {
  const bar = el("mapSlotBar");
  if (!bar) return;
  bar.classList.remove("d-none");

  const nav = el("mapSlotNav");
  nav.innerHTML = Array.from({ length: MAP_SLOT_COUNT }, (_, index) => {
    const slot = index + 1;
    const meta = mapSlotMeta.find((entry) => entry.slot === slot);
    const name = meta?.name?.trim() || `Map ${slot}`;
    const isViewing = slot === mapViewSlot;
    const classes = ["nav-link"];
    if (isViewing) classes.push("active");
    return `<button type="button" class="${classes.join(" ")}" data-map-slot="${slot}" title="${escapeHtml(name)}">${slot}</button>`;
  }).join("");

  const label = el("mapSlotLabel");
  if (label) label.textContent = currentMapSlotName();
}

function updateFogButtonLabel() {
  const button = el("applyFogButton");
  if (!button) return;
  const active = Boolean(state.fog?.visible);
  button.textContent = active ? "Remove Fog" : "Apply Fog";
  button.classList.toggle("btn-outline-light", !active);
  button.classList.toggle("btn-danger", active);
}

function toggleFog() {
  if (!isGm) return;
  state.fog = state.fog || { visible: false, color: "#000000" };
  state.fog.visible = !state.fog.visible;
  if (state.fog.visible) state.fog.color = el("fogColor").value || "#000000";
  updateFogButtonLabel();
  renderAll();
}

function hideContextMenu() {
  contextMenuTokenId = "";
  el("mapContextMenu").classList.add("d-none");
}

function showMapContextMenu(event, item) {
  if (!canManageMapItem(item) || (!item.kind && !item.shape)) return;
  event.preventDefault();
  event.stopPropagation();
  contextMenuTokenId = item.id;
  selectedId = item.id;
  renderAll(false);
  const menu = el("mapContextMenu");
  el("mapContextMenuTitle").textContent =
    item.kind === "character"
      ? displayTokenName(item)
      : item.kind
        ? displayTokenName(item)
        : item.name || "Shape";
  el("toggleEmitMenu").classList.toggle("d-none", !canManageAura(item));
  el("emitMenu").classList.add("d-none");
  el("toggleEmitMenu").setAttribute("aria-expanded", "false");
  el("openApplyEffect").classList.toggle("d-none", !canManageEffects(item));
  el("openRollMenu").classList.toggle("d-none", !canRollToken(item));
  const tokenVisibilityButton = el("toggleTokenVisibility");
  const canToggleTokenVisibility = Boolean(item.kind && canManageMapItem(item));
  tokenVisibilityButton.classList.toggle("d-none", !canToggleTokenVisibility);
  if (canToggleTokenVisibility) {
    tokenVisibilityButton.innerHTML =
      item.hidden === true
        ? `<i class="bi bi-eye me-1"></i> Unhide`
        : `<i class="bi bi-eye-slash me-1"></i> Hide`;
  }
  const visibilityButton = el("toggleEnemyVisibility");
  const canToggleEnemy = item.kind === "enemy" && isGm;
  visibilityButton.classList.toggle("d-none", !canToggleEnemy);
  if (canToggleEnemy) {
    visibilityButton.innerHTML =
      item.visible === false
        ? `<i class="bi bi-eye me-1"></i> Show enemy`
        : `<i class="bi bi-eye-slash me-1"></i> Hide enemy`;
  }
  const nameVisibilityButton = el("toggleTokenNameVisibility");
  const canToggleName = isGm && Boolean(item.kind);
  nameVisibilityButton.classList.toggle("d-none", !canToggleName);
  if (canToggleName) {
    nameVisibilityButton.innerHTML = item.hideName
      ? `<i class="bi bi-eye me-1"></i> Unhide name`
      : `<i class="bi bi-incognito me-1"></i> Hide name`;
  }
  el("zIndexMenu").classList.add("d-none");
  el("toggleZIndexMenu").setAttribute("aria-expanded", "false");
  menu.classList.remove("d-none");
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${clamp(event.clientX, 8, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${clamp(event.clientY, 8, window.innerHeight - rect.height - 8)}px`;
}

function moveContextItemZ(action) {
  const item = selectedObject();
  if (!item || !canManageMapItem(item)) return;
  normalizeZIndexes();
  const items = mapLayerItems().sort(
    (a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0),
  );
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index < 0) return;
  if (action === "top") {
    items.splice(index, 1);
    items.push(item);
  } else if (action === "bottom") {
    items.splice(index, 1);
    items.unshift(item);
  } else if (action === "up" && index < items.length - 1) {
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
  } else if (action === "down" && index > 0) {
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
  }
  items.forEach((entry, nextIndex) => {
    entry.zIndex = nextIndex + 2;
  });
  hideContextMenu();
  renderAll();
}

function stageCellFromEvent(event) {
  const stage = el("mapStage");
  const rect = stage.getBoundingClientRect();
  const cell = Number(localGridSize || 48);
  const x = clamp(
    Math.floor((event.clientX - rect.left) / cell),
    0,
    state.settings.cols - 1,
  );
  const y = clamp(
    Math.floor((event.clientY - rect.top) / cell),
    0,
    state.settings.rows - 1,
  );
  return { x, y, px: (x + 0.5) * cell, py: (y + 0.5) * cell };
}

function pathfinderDistance(start, end) {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const diagonals = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diagonals;
  return straight * 5 + Math.floor(diagonals / 2) * 15 + (diagonals % 2) * 5;
}

function renderMovementMeasure() {
  document.querySelector(".movement-ruler")?.remove();
  if (!movementMeasure) return;
  const stage = el("mapStage");
  const { start, current } = movementMeasure;
  const distance = pathfinderDistance(start, current);
  const layer = document.createElement("div");
  layer.className = "movement-ruler";
  layer.innerHTML = `
    <svg width="100%" height="100%" class="position-absolute top-0 start-0">
      <line class="movement-ruler-line" x1="${start.px}" y1="${start.py}" x2="${current.px}" y2="${current.py}"></line>
      <circle class="movement-ruler-dot" cx="${start.px}" cy="${start.py}" r="4"></circle>
      <circle class="movement-ruler-dot" cx="${current.px}" cy="${current.py}" r="4"></circle>
    </svg>
    <div class="movement-ruler-label" style="left:${current.px}px;top:${current.py}px;">${distance} ft</div>
  `;
  stage.appendChild(layer);
}

function clearMovementMeasure(delay = 0) {
  const clear = () => {
    movementMeasure = null;
    document.querySelector(".movement-ruler")?.remove();
  };
  if (delay) {
    setTimeout(clear, delay);
  } else {
    clear();
  }
}

function startMovementMeasure(event) {
  if (event.button !== 2) return;
  hideContextMenu();
  const point = stageCellFromEvent(event);
  movementMeasure = { start: point, current: point, dragged: false };
  renderMovementMeasure();
  window.addEventListener("pointermove", moveMovementMeasure);
  window.addEventListener("pointerup", endMovementMeasure, { once: true });
}

function moveMovementMeasure(event) {
  if (!movementMeasure) return;
  const next = stageCellFromEvent(event);
  movementMeasure.dragged =
    movementMeasure.dragged ||
    next.x !== movementMeasure.start.x ||
    next.y !== movementMeasure.start.y;
  movementMeasure.current = next;
  renderMovementMeasure();
}

function endMovementMeasure() {
  const wasDragged = Boolean(movementMeasure?.dragged);
  suppressNextContextMenu = wasDragged;
  window.removeEventListener("pointermove", moveMovementMeasure);
  clearMovementMeasure(wasDragged ? 700 : 0);
}

function renderMap() {
  const stage = el("mapStage");
  const { cols, rows, backgroundUrl } = state.settings;
  stage.style.setProperty("--cell", `${localGridSize}px`);
  stage.style.setProperty("--cols", cols);
  stage.style.setProperty("--rows", rows);
  stage.style.setProperty(
    "--map-bg",
    backgroundUrl ? `url("${backgroundUrl.replaceAll('"', "%22")}")` : "none",
  );
  // The background always fills the whole cols x rows grid, so resizing
  // Cell X/Y (linked) scales the picture with it instead of cropping it.

  // Height Layer mode replaces the whole stage contents with just the
  // height regions -- no tokens, ordinary shapes, or fog, so painting
  // elevation never risks nudging something used in actual play. See
  // toggleHeightEditMode().
  if (heightEditMode) {
    stage.innerHTML = [
      ...state.heightShapes.map(renderHeightShape),
      `<div id="tokenHoverLayer" class="token-hover-layer"></div>`,
    ].join("");
  } else {
    const visibleTokens = state.tokens.filter(canSeeToken);
    stage.innerHTML = [
      ...visibleTokens.map(renderAura),
      ...(isGm
        ? visibleTokens.map((token) =>
            renderRevealIndicator(token, "light", "map-reveal-light", "#f0d58c"),
          )
        : []),
      ...(isGm
        ? visibleTokens.map((token) =>
            renderRevealIndicator(
              token,
              "limitedView",
              "map-reveal-limited",
              "#61dafb",
            ),
          )
        : []),
      ...state.shapes.map(renderShape),
      ...visibleTokens.map(renderToken),
      renderFogLayer(),
      renderLimitedViewGrayscale(),
      renderOwnTokenFogReveal(visibleTokens),
      `<div id="tokenHoverLayer" class="token-hover-layer"></div>`,
    ].join("");
  }

  stage.onpointerdown = startMovementMeasure;
  stage.querySelectorAll("[data-resize-handle]").forEach((handle) => {
    handle.addEventListener("pointerdown", startResize);
  });
  stage.querySelectorAll("[data-map-id]:not([data-resize-handle])").forEach((node) => {
    node.addEventListener("pointerdown", startDrag);
    node.addEventListener("mouseenter", () =>
      showTokenHover(node.dataset.mapId),
    );
    node.addEventListener("mouseleave", hideTokenHover);
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      suppressStageClick = true;
      hideContextMenu();
      selectedId = node.dataset.mapId;
      renderAll(false);
      showSelectedPanel();
    });
    node.addEventListener("contextmenu", (event) => {
      if (suppressNextContextMenu) {
        event.preventDefault();
        suppressNextContextMenu = false;
        return;
      }
      event.preventDefault();
      hideContextMenu();
      const item = [...state.tokens, ...state.shapes].find(
        (entry) => entry.id === node.dataset.mapId,
      );
      if (item) showMapContextMenu(event, item);
    });
  });
  stage.oncontextmenu = (event) => {
    if (suppressNextContextMenu) {
      event.preventDefault();
      suppressNextContextMenu = false;
      return;
    }
    if (event.target === stage) event.preventDefault();
  };
  stage.onclick = (event) => {
    if (suppressStageClick) {
      suppressStageClick = false;
      return;
    }
    if (event.target !== stage) return;
    hideContextMenu();
    selectedId = "";
    renderAll(false);
  };
}

function renderAura(token) {
  const aura = token.aura || {};
  if (!aura.visible) return "";
  const radius = Math.max(1, Number(aura.radius || 1));
  const size = radius * 2;
  const centerX = Number(token.x || 0) + Number(token.w || 1) / 2;
  const centerY = Number(token.y || 0) + Number(token.h || 1) / 2;
  return `<div class="map-aura" style="--aura-x:${centerX - radius};--aura-y:${centerY - radius};--aura-size:${size};--aura-color:${escapeHtml(aura.color || "#8fd19e")};"></div>`;
}

function tokenCenter(token) {
  return {
    x: Number(token.x || 0) + Number(token.w || 1) / 2,
    y: Number(token.y || 0) + Number(token.h || 1) / 2,
  };
}

function renderRevealIndicator(token, field, className, color) {
  const data = token[field];
  if (!data?.visible) return "";
  const radius = Math.max(1, Number(data.radius || 1));
  const size = radius * 2;
  const center = tokenCenter(token);
  return `<div class="map-aura ${className}" style="--aura-x:${center.x - radius};--aura-y:${center.y - radius};--aura-size:${size};--aura-color:${color};"></div>`;
}

function lightRevealCircles() {
  const circles = [];
  state.tokens.forEach((token) => {
    if (!token.light?.visible) return;
    const center = tokenCenter(token);
    circles.push({
      x: center.x,
      y: center.y,
      radius: Math.max(1, Number(token.light.radius || 1)),
    });
  });
  return circles;
}

function limitedViewRevealCircles() {
  const circles = [];
  state.tokens.forEach((token) => {
    if (
      !token.limitedView?.visible ||
      !(isGm || token.ownerId === currentUserId)
    )
      return;
    const center = tokenCenter(token);
    circles.push({
      x: center.x,
      y: center.y,
      radius: Math.max(1, Number(token.limitedView.radius || 1)),
    });
  });
  return circles;
}

function fogRevealCircles() {
  return [...lightRevealCircles(), ...limitedViewRevealCircles()];
}

function renderFogLayer() {
  if (!state.fog?.visible) return "";
  const { cols, rows } = state.settings;
  const holes = fogRevealCircles()
    .map(
      (circle) =>
        `<circle cx="${circle.x}" cy="${circle.y}" r="${circle.radius}" fill="black"></circle>`,
    )
    .join("");
  const opacity = isGm ? 0.45 : 1;
  return `
    <svg class="map-fog-layer" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none">
      <defs>
        <mask id="mapFogMask">
          <rect x="0" y="0" width="${cols}" height="${rows}" fill="white"></rect>
          ${holes}
        </mask>
      </defs>
      <rect x="0" y="0" width="${cols}" height="${rows}" fill="${escapeHtml(state.fog.color || "#000000")}" fill-opacity="${opacity}" mask="url(#mapFogMask)"></rect>
    </svg>
  `;
}

function renderLimitedViewGrayscale() {
  if (!state.fog?.visible) return "";
  return limitedViewRevealCircles()
    .map((circle) => {
      const size = circle.radius * 2;
      return `<div class="map-limited-view-grayscale" style="--aura-x:${circle.x - circle.radius};--aura-y:${circle.y - circle.radius};--aura-size:${size};"></div>`;
    })
    .join("");
}

function tokenInAura(token, auraToken) {
  const aura = auraToken?.aura || {};
  if (!aura.visible || !aura.effect || token.id === auraToken.id) return false;
  if (!canSeeToken(token) || !canSeeToken(auraToken)) return false;
  const radius = Math.max(1, Number(aura.radius || 1));
  const a = tokenCenter(auraToken);
  const b = tokenCenter(token);
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius;
}

function auraPromptKey(tokenId, auraId) {
  return `${mapContextKey}|${tokenId}|${auraId}`;
}

function currentAuraEffectEntries() {
  const auraTokens = state.tokens.filter(
    (token) => token.aura?.visible && token.aura?.effect && canSeeToken(token),
  );
  return state.tokens
    .filter(
      (token) =>
        (token.kind === "character" || token.kind === "enemy") &&
        canManageEffects(token),
    )
    .flatMap((token) =>
      auraTokens
        .filter((auraToken) => tokenInAura(token, auraToken))
        .map((auraToken) => ({
          token,
          auraToken,
          key: auraPromptKey(token.id, auraToken.id),
        })),
    );
}

function auraEffectPrompts() {
  const entries = currentAuraEffectEntries();
  const currentKeys = new Set(entries.map((entry) => entry.key));
  for (const key of [...auraEffectInside]) {
    if (!currentKeys.has(key)) {
      auraEffectInside.delete(key);
      auraEffectDismissed.delete(key);
    }
  }
  entries.forEach((entry) => auraEffectInside.add(entry.key));
  return entries.filter((entry) => !auraEffectDismissed.has(entry.key));
}

function updateAuraToastPosition() {
  const container = el("auraEffectToasts");
  const wrap = document.querySelector(".map-stage-wrap");
  if (!container || !wrap) return;
  if (wrap.offsetParent === null) {
    container.style.removeProperty("--aura-toast-top");
    container.style.removeProperty("--aura-toast-right");
    container.style.removeProperty("--aura-toast-width");
    container.style.removeProperty("--aura-toast-max-height");
    return;
  }
  const rect = wrap.getBoundingClientRect();
  const top = clamp(rect.top + 8, 8, window.innerHeight - 80);
  const right = clamp(
    window.innerWidth - rect.right + 8,
    8,
    window.innerWidth - 80,
  );
  const width = Math.max(180, Math.min(300, rect.width - 16));
  const maxHeight = Math.max(
    80,
    Math.min(rect.height - 16, window.innerHeight - top - 8),
  );
  container.style.setProperty("--aura-toast-top", `${top}px`);
  container.style.setProperty("--aura-toast-right", `${right}px`);
  container.style.setProperty("--aura-toast-width", `${width}px`);
  container.style.setProperty("--aura-toast-max-height", `${maxHeight}px`);
}

function renderAuraEffectToasts() {
  const container = el("auraEffectToasts");
  if (!container) return;
  updateAuraToastPosition();
  const prompts = auraEffectPrompts();
  container.innerHTML = prompts
    .map(
      ({ token, auraToken, key }) => `
    <div class="aura-effect-toast">
      <div class="fw-semibold">${escapeHtml(auraToken.aura.effect?.name || "Effect")} aura</div>
      <div class="small text-secondary mb-2">${escapeHtml(displayTokenName(token))}</div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-outline-light btn-sm" type="button" data-dismiss-aura="${escapeHtml(key)}">Dismiss</button>
        <button class="btn btn-success btn-sm" type="button" data-apply-aura="${escapeHtml(token.id)}" data-aura-source="${escapeHtml(auraToken.id)}">Apply</button>
      </div>
    </div>
  `,
    )
    .join("");
  container.querySelectorAll("[data-dismiss-aura]").forEach((button) => {
    button.addEventListener("click", () => {
      auraEffectDismissed.add(button.dataset.dismissAura);
      renderAuraEffectToasts();
    });
  });
  container.querySelectorAll("[data-apply-aura]").forEach((button) => {
    button.addEventListener("click", () =>
      applyAuraEffectToToken(
        button.dataset.applyAura,
        button.dataset.auraSource,
      ),
    );
  });
}

function renderToken(token, { ghost = false } = {}) {
  const enemyClass = token.kind === "enemy" ? " enemy" : "";
  const genericClass = token.kind === "token" ? " generic-token" : "";
  const identityHidden = tokenNameIsHidden(token);
  const imageUrl = tokenNameIsHidden(token)
    ? ""
    : String(token.imageUrl || "").trim();
  const imageClass = imageUrl ? " has-image" : "";
  const identityHiddenClass = identityHidden ? " identity-hidden" : "";
  const tokenImage = imageUrl ? `url('${cssUrl(imageUrl)}')` : "none";
  const hiddenClass =
    token.kind === "enemy" && token.visible === false && isGm
      ? " enemy-hidden"
      : "";
  const tokenHiddenClass =
    token.hidden === true && canManageMapItem(token) ? " token-hidden" : "";
  const selectedClass = !ghost && token.id === selectedId ? " selected" : "";
  const activeEntry = state.initiative[state.activeTurn];
  const activeClass =
    !ghost && activeEntry?.tokenId === token.id && !activeEntry.disabled
      ? " turn-active"
      : "";
  const ghostClass = ghost ? " map-token-fog-reveal" : "";
  const idAttr = ghost ? "" : ` data-map-id="${escapeHtml(token.id)}"`;
  return `
    <div class="map-token${enemyClass}${genericClass}${imageClass}${identityHiddenClass}${hiddenClass}${tokenHiddenClass}${selectedClass}${activeClass}${ghostClass}"${idAttr} style="--x:${token.x};--y:${token.y};--w:${token.w || 1};--h:${token.h || 1};--z:${Number(token.zIndex || 2)};--color:${escapeHtml(token.color || "#8fd19e")};--token-image:${tokenImage};">
      <div class="text-center">
        <div class="token-label">${escapeHtml(tokenNameIsHidden(token) ? (isGm ? `? ${tokenInitials(tokenActualName(token))}` : "?") : tokenInitials(tokenActualName(token)))}</div>
      </div>
    </div>
  `;
}

function renderOwnTokenFogReveal(visibleTokens) {
  if (isGm || !state.fog?.visible) return "";
  return visibleTokens
    .filter((token) => token.ownerId === currentUserId)
    .map((token) => renderToken(token, { ghost: true }))
    .join("");
}

function hideTokenHover() {
  const layer = el("tokenHoverLayer");
  if (layer) layer.innerHTML = "";
}

function showTokenHover(tokenId) {
  const token = tokenById(tokenId);
  const layer = el("tokenHoverLayer");
  if (!token || !layer) return;
  const character = token.kind === "character" ? tokenCharacter(token) : null;
  const hoverName =
    character || token.kind === "token" || (token.kind === "enemy" && isGm)
      ? displayTokenName(token)
      : "";
  if (!hoverName) return;
  const hoverHp = character
    ? tokenHpText(token)
    : token.kind === "enemy" && isGm
      ? `${tokenCurrentHp(token) || "?"}/${tokenTotalHp(token) || "?"} HP`
      : "";
  const centerX =
    (Number(token.x || 0) + Number(token.w || 1) / 2) *
    Number(localGridSize || 48);
  const top = Number(token.y || 0) * Number(localGridSize || 48) - 7;
  layer.innerHTML = `
    <div class="token-hover-card" style="left:${centerX}px;top:${top}px;transform:translate(-50%, -100%);">
      <div class="token-hover-name">${escapeHtml(hoverName)}</div>
      ${hoverHp ? `<div class="token-hover-hp">${escapeHtml(hoverHp)}</div>` : ""}
    </div>
  `;
}

function cssUrl(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replaceAll(" ", "%20")
    .replaceAll('"', "%22")
    .replaceAll("'", "%27")
    .replaceAll("(", "%28")
    .replaceAll(")", "%29");
}

function shapeMask(shape) {
  const cols = Math.max(1, Number(shape.w || 2));
  const rows = Math.max(1, Number(shape.h || 2));
  const occupied = new Set();
  if (shape.shape !== "circle") {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) occupied.add(`${x},${y}`);
    }
    return { cols, rows, occupied };
  }

  const centerX = cols / 2;
  const centerY = rows / 2;
  const radiusX = Math.max(0.5, cols / 2 - 0.15);
  const radiusY = Math.max(0.5, rows / 2 - 0.15);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx = (x + 0.5 - centerX) / radiusX;
      const dy = (y + 0.5 - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1) occupied.add(`${x},${y}`);
    }
  }
  return { cols, rows, occupied };
}

function spriteCellIndex(cellNumber) {
  return Math.max(1, Math.min(24, Number(cellNumber || 1))) - 1;
}

function shapeTileIndex(shape, mask, x, y) {
  if (mask.cols === 1 && mask.rows === 1) return spriteCellIndex(1);

  if (mask.rows === 1) {
    if (x === 0) return spriteCellIndex(2);
    if (x === mask.cols - 1) return spriteCellIndex(4);
    return spriteCellIndex(3);
  }

  if (mask.cols === 1) {
    if (y === 0) return spriteCellIndex(7);
    if (y === mask.rows - 1) return spriteCellIndex(19);
    return spriteCellIndex(13);
  }

  if (shape.shape === "circle") {
    const has = (cx, cy) => mask.occupied.has(`${cx},${cy}`);
    const hasLeft = has(x - 1, y);
    const hasRight = has(x + 1, y);
    const hasTop = has(x, y - 1);
    const hasBottom = has(x, y + 1);
    if (mask.cols === 3 && mask.rows === 3 && mask.occupied.size === 5) {
      if (x === 1 && y === 0) return spriteCellIndex(7);
      if (x === 0 && y === 1) return spriteCellIndex(2);
      if (x === 2 && y === 1) return spriteCellIndex(4);
      if (x === 1 && y === 2) return spriteCellIndex(19);
      return spriteCellIndex(15);
    }
    if (!hasTop && !hasBottom && !hasLeft) return spriteCellIndex(2);
    if (!hasTop && !hasBottom && !hasRight) return spriteCellIndex(4);
    if (!hasLeft && !hasRight && !hasTop) return spriteCellIndex(7);
    if (!hasLeft && !hasRight && !hasBottom) return spriteCellIndex(19);
    if (!hasLeft && !hasTop) return spriteCellIndex(8);
    if (!hasRight && !hasTop) return spriteCellIndex(10);
    if (!hasLeft && !hasBottom) return spriteCellIndex(20);
    if (!hasRight && !hasBottom) return spriteCellIndex(22);
    if (!hasTop) return spriteCellIndex(9);
    if (!hasBottom) return spriteCellIndex(21);
    if (!hasLeft) return spriteCellIndex(14);
    if (!hasRight) return spriteCellIndex(16);
    return spriteCellIndex(15);
  }

  if (y === 0) {
    if (x === 0) return spriteCellIndex(8);
    if (x === mask.cols - 1) return spriteCellIndex(10);
    return spriteCellIndex(9);
  }

  if (y === mask.rows - 1) {
    if (x === 0) return spriteCellIndex(20);
    if (x === mask.cols - 1) return spriteCellIndex(22);
    return spriteCellIndex(21);
  }

  if (x === 0) return spriteCellIndex(14);
  if (x === mask.cols - 1) return spriteCellIndex(16);
  return spriteCellIndex(15);
}

// OS-window-style resize handles -- see startResize()/moveResize().
// Rendered on every shape (only visible/interactive once selected, via
// css/map.css) so both regular map shapes and Height Layer regions
// (renderHeightShape()) can share the exact same drag-resize code.
const RESIZE_HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
function resizeHandlesHtml(id) {
  return RESIZE_HANDLES.map(
    (dir) =>
      `<span class="map-resize-handle map-resize-${dir}" data-map-id="${escapeHtml(id)}" data-resize-handle="${dir}"></span>`,
  ).join("");
}

function heightFeetLabel(feet) {
  const value = Number(feet || 0);
  return value >= 0 ? `+${value} ft` : `${value} ft`;
}

function renderHeightShape(shape) {
  const selectedClass = shape.id === selectedId ? " selected" : "";
  const pitClass = Number(shape.heightFeet || 0) < 0 ? " pit" : "";
  return `<div class="map-shape map-height-shape${pitClass}${selectedClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${shape.w || 2};--h:${shape.h || 2};--z:2;--color:${escapeHtml(shape.color || "#61dafb")};">
    <span class="map-height-shape-label">${heightFeetLabel(shape.heightFeet)}</span>
    ${resizeHandlesHtml(shape.id)}
  </div>`;
}

function renderShape(shape) {
  const selectedClass = shape.id === selectedId ? " selected" : "";
  const texture = shapeTexture(shape.texture);
  if (texture || shape.shape === "circle") {
    const mask = shapeMask(shape);
    const cells = [];
    for (let y = 0; y < mask.rows; y += 1) {
      for (let x = 0; x < mask.cols; x += 1) {
        if (!mask.occupied.has(`${x},${y}`)) {
          cells.push("<span></span>");
          continue;
        }
        if (texture) {
          const tile = tilePosition(shapeTileIndex(shape, mask, x, y));
          // background-image is set directly here (not via a --custom-
          // property referenced from css/map.css) because a url() inside a
          // custom property resolves relative to the stylesheet that reads
          // it, not the page -- which pointed this at css/assets/... and
          // 404'd. An inline style resolves relative to the document.
          cells.push(
            `<span class="shape-cell texture-cell" style="background-image:url('${cssUrl(texture.url)}');--tile-x:${tile.x};--tile-y:${tile.y};"></span>`,
          );
        } else {
          cells.push(`<span class="shape-cell"></span>`);
        }
      }
    }
    return `
      <div class="map-shape shape-grid${selectedClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${mask.cols};--h:${mask.rows};--z:${Number(shape.zIndex || 2)};--shape-cols:${mask.cols};--shape-rows:${mask.rows};--color:${escapeHtml(shape.color || "#f0d58c")};">
        ${cells.join("")}
        ${resizeHandlesHtml(shape.id)}
      </div>
    `;
  }
  return `<div class="map-shape ${shape.shape || "rect"}${selectedClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${shape.w || 2};--h:${shape.h || 2};--z:${Number(shape.zIndex || 2)};--color:${escapeHtml(shape.color || "#f0d58c")};">${resizeHandlesHtml(shape.id)}</div>`;
}

// ---------------------------------------------------------------
// 3D Preview (experimental). Renders a separate, flattened snapshot of
// the map -- deliberately NOT a live-tilted version of the real
// interactive #mapStage, both because that stage is far too deeply
// nested for CSS 3D to render reliably (iOS WebKit especially -- see
// css/map.css's comment above .map-3d-modal-body) and because a
// snapshot is much simpler to reason about for a first pass: read the
// current state once, build a small stack of flat "plates," done.
//
// Every region in state.heightShapes (see toggleHeightEditMode())
// becomes a block:
// - its top/floor face is the map texture cropped to that region's
//   footprint, floating at translateZ(feet-to-px(heightFeet))
// - four walls connect that face back down (or, for a negative/pit
//   height, back UP) to true ground level at Z=0
// Circles and textured shapes were never an option here -- Height
// Layer regions are always plain rects (see addHeightShape()).
//
// Overlapping height regions aren't reconciled into a proper
// heightfield (no adjacency/merging) -- each block is just an
// independent floating platform. Fine for the common case (a
// raised dais, a cliff ledge, a pit) but two overlapping blocks will
// visibly clip through each other rather than blend.
// ---------------------------------------------------------------
const MAP_3D_CELL_PX = 40;
// 1 height unit = 5ft (a standard humanoid's height, per the Height
// Region panel) = this many px in the preview scene.
const MAP_3D_PX_PER_5FT = 32;

function feetToPreviewPx(feet) {
  return (Number(feet || 0) / 5) * MAP_3D_PX_PER_5FT;
}

function render3DPreview() {
  const scene = el("map3DScene");
  const { cols, rows, backgroundUrl } = state.settings;
  const mapW = Number(cols || 0) * MAP_3D_CELL_PX;
  const mapH = Number(rows || 0) * MAP_3D_CELL_PX;
  scene.style.width = `${mapW}px`;
  scene.style.height = `${mapH}px`;
  scene.style.setProperty(
    "--map-3d-angle",
    `${el("map3DAngle").value || 55}deg`,
  );

  if (!backgroundUrl) {
    scene.innerHTML = `<div class="map-3d-empty-hint">Set a map background first (Map Settings) to preview it in 3D.</div>`;
    return;
  }

  // Single-quoted url() -- this gets embedded inside a double-quoted
  // HTML style="..." attribute below (built via innerHTML, unlike
  // stage.style.setProperty's background-image elsewhere in this file,
  // which goes through the CSSOM directly and never has this problem).
  const bgCss = `url('${cssUrl(backgroundUrl)}')`;
  const blocks = [...state.heightShapes]
    .filter((shape) => Number(shape.heightFeet) !== 0)
    // Draw shortest-magnitude first so a small block nested in a much
    // taller one's footprint still ends up on top in the DOM (paint
    // order matters less with preserve-3d's real depth sorting, but
    // keeping it sane costs nothing).
    .sort((a, b) => Math.abs(a.heightFeet) - Math.abs(b.heightFeet));

  const baseHtml = `
    <div class="map-3d-base" style="width:${mapW}px;height:${mapH}px;background-image:${bgCss};"></div>
  `;

  const blockHtml = blocks
    .map((shape) => {
      const x = Number(shape.x || 0) * MAP_3D_CELL_PX;
      const y = Number(shape.y || 0) * MAP_3D_CELL_PX;
      const w = Number(shape.w || 1) * MAP_3D_CELL_PX;
      const h = Number(shape.h || 1) * MAP_3D_CELL_PX;
      const z = feetToPreviewPx(shape.heightFeet);
      const wallPx = Math.abs(z);
      // A raised block's walls hinge at the top face and fold DOWN to
      // ground (the default CSS rotation in css/map.css). A pit is the
      // mirror image: its "top" face already sits below ground, so its
      // walls need to fold the OPPOSITE way to reach back UP to Z=0 --
      // see the .pit override in css/map.css for the reversed
      // rotateX/rotateY signs (worked out by hand, then confirmed by
      // screenshotting both a raised block and a pit side by side).
      const pitClass = z < 0 ? " pit" : "";
      return `
        <div class="map-3d-block${pitClass}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">
          <div class="map-3d-block-top" style="transform:translateZ(${z}px);background-image:${bgCss};background-size:${mapW}px ${mapH}px;background-position:-${x}px -${y}px;">
            <div class="map-3d-wall map-3d-wall-south" style="height:${wallPx}px;"></div>
            <div class="map-3d-wall map-3d-wall-north" style="height:${wallPx}px;"></div>
            <div class="map-3d-wall map-3d-wall-east" style="width:${wallPx}px;"></div>
            <div class="map-3d-wall map-3d-wall-west" style="width:${wallPx}px;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  scene.innerHTML = baseHtml + blockHtml;
}

const DPAD_MOVE_COOLDOWN_MS = 200;

function canUseQuickControls(item) {
  return Boolean(item?.kind) && canManageMapItem(item);
}

function moveTokenByDpad(item, dx, dy) {
  if (dpadMovingIds.has(item.id) || !canManageMapItem(item)) return;
  const maxX = state.settings.cols - (item.w || 1);
  const maxY = state.settings.rows - (item.h || 1);
  const nextX = clamp((item.x || 0) + dx, 0, maxX);
  const nextY = clamp((item.y || 0) + dy, 0, maxY);
  if (nextX === (item.x || 0) && nextY === (item.y || 0)) return;
  item.x = nextX;
  item.y = nextY;
  dpadMovingIds.add(item.id);
  renderAll();
  removeOutOfRangeAuraEffects();
  setTimeout(() => {
    dpadMovingIds.delete(item.id);
    if (selectedObject()?.id === item.id) renderSelectedPanel();
  }, DPAD_MOVE_COOLDOWN_MS);
}

function renderMovementDpad(item) {
  const moving = dpadMovingIds.has(item.id);
  const dpadButton = (direction, icon, dx, dy) => `
    <button type="button" class="btn btn-outline-light btn-sm dpad-btn dpad-${direction}" data-dpad-move="${dx},${dy}" ${moving ? "disabled" : ""} aria-label="Move ${direction}">
      <i class="bi ${icon}"></i>
    </button>
  `;
  return `
    <div class="dpad-grid">
      <div></div>${dpadButton("up", "bi-caret-up-fill", 0, -1)}<div></div>
      ${dpadButton("left", "bi-caret-left-fill", -1, 0)}<div class="dpad-center"></div>${dpadButton("right", "bi-caret-right-fill", 1, 0)}
      <div></div>${dpadButton("down", "bi-caret-down-fill", 0, 1)}<div></div>
    </div>
  `;
}

// Some quick actions are grouped under one expandable entry, same as the
// right-click context menu's submenus (Emit, Z-index).
const QUICK_ACTION_GROUPS = {
  "emit-toggle": {
    label: "Emit",
    icon: "bi-broadcast-pin",
    cls: "btn-outline-info",
    rows: [
      ["aura", "bi-broadcast-pin", "btn-outline-info", "Aura options"],
      ["light", "bi-brightness-high", "btn-outline-warning", "Apply light"],
      ["limitedView", "bi-eye", "btn-outline-info", "Apply Special Vision"],
    ],
  },
  "zindex-toggle": {
    label: "Z-index",
    icon: "bi-layers",
    cls: "btn-outline-light",
    rows: [
      ["z-top", "bi-front", "btn-outline-light", "Move to top"],
      ["z-bottom", "bi-back", "btn-outline-light", "Move to bottom"],
      ["z-up", "bi-arrow-up", "btn-outline-light", "Move up"],
      ["z-down", "bi-arrow-down", "btn-outline-light", "Move down"],
    ],
  },
};
let quickExpandedGroups = new Set();

function quickActionRows(item) {
  const rows = [];
  if (canManageAura(item))
    rows.push(["emit-toggle", "bi-broadcast-pin", "btn-outline-info", "Emit"]);
  if (canManageEffects(item))
    rows.push(["effect", "bi-magic", "btn-outline-success", "Apply effect"]);
  if (canRollToken(item)) rows.push(["roll", "bi-dice-5", "btn-outline-primary", "Roll"]);
  rows.push([
    "toggle-visibility",
    item.hidden === true ? "bi-eye" : "bi-eye-slash",
    "btn-outline-secondary",
    item.hidden === true ? "Unhide" : "Hide",
  ]);
  if (item.kind === "enemy" && isGm) {
    rows.push([
      "toggle-enemy-visibility",
      item.visible === false ? "bi-eye" : "bi-eye-slash",
      "btn-outline-warning",
      item.visible === false ? "Show enemy" : "Hide enemy",
    ]);
  }
  if (isGm) {
    rows.push([
      "toggle-name-visibility",
      item.hideName ? "bi-eye" : "bi-incognito",
      "btn-outline-warning",
      item.hideName ? "Unhide name" : "Hide name",
    ]);
  }
  rows.push(["zindex-toggle", "bi-layers", "btn-outline-light", "Z-index"]);
  rows.push(["remove", "bi-box-arrow-right", "btn-outline-danger", "Remove from map"]);
  return rows;
}

function renderQuickActionsList(item) {
  const rows = quickActionRows(item)
    .map(([action, icon, cls, label]) => {
      const group = QUICK_ACTION_GROUPS[action];
      if (group) {
        const expanded = quickExpandedGroups.has(action);
        const subRows = group.rows
          .map(
            ([subAction, subIcon, subCls, subLabel]) => `
      <button class="btn ${subCls} btn-sm w-100 text-start" type="button" data-quick-action="${subAction}">
        <i class="bi ${subIcon} me-1"></i> ${escapeHtml(subLabel)}
      </button>
    `,
          )
          .join("");
        return `
    <button class="btn ${cls} btn-sm w-100 text-start" type="button" data-quick-group-toggle="${action}" aria-expanded="${expanded}">
      <i class="bi ${expanded ? "bi-chevron-down" : icon} me-1"></i> ${escapeHtml(label)}
    </button>
    ${expanded ? `<div class="quick-actions-submenu">${subRows}</div>` : ""}
  `;
      }
      return `
    <button class="btn ${cls} btn-sm w-100 text-start" type="button" data-quick-action="${action}">
      <i class="bi ${icon} me-1"></i> ${escapeHtml(label)}
    </button>
  `;
    })
    .join("");
  return `<div class="quick-actions-list">${rows}</div>`;
}

function renderQuickControlsPanel(item) {
  return `
    <div class="quick-controls-panel mt-2">
      ${compactHpStat(item)}
      ${renderMovementDpad(item)}
      ${renderQuickActionsList(item)}
    </div>
  `;
}

const QUICK_ACTION_HANDLERS = {
  aura: openAuraOptions,
  light: openLightOptions,
  limitedView: openLimitedViewOptions,
  effect: openQuickApplyEffect,
  roll: openRollModal,
  "toggle-visibility": toggleContextTokenVisibility,
  "toggle-enemy-visibility": toggleContextEnemyVisibility,
  "toggle-name-visibility": toggleContextTokenNameVisibility,
  "z-top": () => moveContextItemZ("top"),
  "z-bottom": () => moveContextItemZ("bottom"),
  "z-up": () => moveContextItemZ("up"),
  "z-down": () => moveContextItemZ("down"),
  remove: removeContextMenuToken,
};

function runQuickAction(item, action) {
  contextMenuTokenId = item.id;
  selectedId = item.id;
  QUICK_ACTION_HANDLERS[action]?.();
}

function bindQuickControlsPanel(item) {
  const panel = el("selectedPanel");
  panel
    .querySelector("[data-quick-controls-toggle]")
    ?.addEventListener("click", () => {
      quickControlsOpenId = quickControlsOpenId === item.id ? "" : item.id;
      quickExpandedGroups.clear();
      renderSelectedPanel();
    });
  if (quickControlsOpenId !== item.id) return;
  panel.querySelectorAll("[data-dpad-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const [dx, dy] = button.dataset.dpadMove.split(",").map(Number);
      moveTokenByDpad(item, dx, dy);
    });
  });
  panel.querySelectorAll("[data-quick-group-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.quickGroupToggle;
      if (quickExpandedGroups.has(group)) quickExpandedGroups.delete(group);
      else quickExpandedGroups.add(group);
      renderSelectedPanel();
    });
  });
  panel.querySelectorAll("[data-quick-action]").forEach((button) => {
    button.addEventListener("click", () =>
      runQuickAction(item, button.dataset.quickAction),
    );
  });
}

// Height Layer's own selected-item panel -- deliberately separate
// from renderSelectedPanel()'s character/token/shape panel below,
// since a height region only ever needs X/Y/W/H/feet/color, none of
// the effects/sheet/texture machinery the regular panel carries.
function renderHeightShapePanel() {
  const item = state.heightShapes.find((shape) => shape.id === selectedId);
  if (!item) {
    el("selectedPanel").innerHTML = `
      <div class="small-text">
        Draw a Height Region to set its elevation. Height Layer regions aren't visible on the regular map -- only in the 3D Preview.
      </div>
    `;
    return;
  }
  el("selectedPanel").innerHTML = `
    <label>Height Region</label>
    <div class="row g-2">
      <div class="col-6"><label>X</label><input data-height-field="x" class="form-control form-control-sm" type="number" value="${item.x || 0}"></div>
      <div class="col-6"><label>Y</label><input data-height-field="y" class="form-control form-control-sm" type="number" value="${item.y || 0}"></div>
      <div class="col-6"><label>W</label><input data-height-field="w" class="form-control form-control-sm" type="number" min="1" value="${item.w || 1}"></div>
      <div class="col-6"><label>H</label><input data-height-field="h" class="form-control form-control-sm" type="number" min="1" value="${item.h || 1}"></div>
      <div class="col-12">
        <label>Height (ft) <span class="small-text">1 unit = 5ft, negative = pit</span></label>
        <input data-height-field="heightFeet" class="form-control form-control-sm" type="number" step="5" value="${Number(item.heightFeet || 0)}">
      </div>
      <div class="col-12"><label>Color</label><input data-height-field="color" class="form-control form-control-sm" type="color" value="${escapeHtml(item.color || "#61dafb")}"></div>
    </div>
    <button class="btn btn-outline-danger btn-sm w-100 mt-2" type="button" data-delete-height-shape>
      <i class="bi bi-trash"></i> Delete
    </button>
  `;
  bindHeightShapePanelInteractions(item);
}

function bindHeightShapePanelInteractions(item) {
  el("selectedPanel")
    .querySelectorAll("[data-height-field]")
    .forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.heightField;
        if (field === "color") {
          item.color = input.value;
        } else if (field === "w" || field === "h") {
          item[field] = Math.max(1, Number(input.value || 1));
        } else {
          item[field] = Number(input.value || 0);
        }
        renderMap();
        queueSave();
      });
    });
  el("selectedPanel")
    .querySelector("[data-delete-height-shape]")
    ?.addEventListener("click", () => deleteHeightShape(item.id));
}

function renderSelectedPanel() {
  if (heightEditMode) {
    renderHeightShapePanel();
    return;
  }
  const item = selectedObject();
  const wasDetailsOpen =
    el("selectedDetailsCollapse")?.classList.contains("show") || false;
  if (item?.kind === "character" && canViewTokenSheet(item)) {
    characterPanelCharacterId = item.characterId || characterPanelCharacterId;
  }
  const viewableCharacters = viewableMapCharacters();
  if (
    characterPanelCharacterId &&
    !viewableCharacters.some((character) => character.id === characterPanelCharacterId)
  ) {
    characterPanelCharacterId = "";
  }
  const characterList = renderCharacterPanelList(characterPanelCharacterId);

  if (!item) {
    const character = viewableCharacters.find(
      (row) => row.id === characterPanelCharacterId,
    );
    const token = character ? tokenForCharacterPanel(character) : null;
    el("selectedPanel").innerHTML = character
      ? `${renderCharacterPanelBack(character.name)}${renderCompactCharacterSheet(token)}`
      : characterList;
    bindSelectedPanelInteractions(token);
    return;
  }
  if (
    !canViewSelectedDetails(item) ||
    (item.kind === "character" && !canViewTokenSheet(item))
  ) {
    const character = viewableCharacters.find(
      (row) => row.id === characterPanelCharacterId,
    );
    const token = character ? tokenForCharacterPanel(character) : null;
    el("selectedPanel").innerHTML = character
      ? `${renderCharacterPanelBack(character.name)}${renderCompactCharacterSheet(token)}`
      : characterList;
    bindSelectedPanelInteractions(token);
    return;
  }
  const compactSheet = item.kind ? renderCompactCharacterSheet(item) : "";
  const effectsSection =
    item.kind && canManageEffects(item)
      ? `<button class="btn btn-outline-success btn-sm w-100 mt-2" type="button" data-open-token-effects="${escapeHtml(item.id)}">Effects</button>`
      : "";
  const textureFields = item.shape
    ? `<div class="mt-2">
        <label>Texture</label>
        <div class="shape-texture-picker">
          <button class="shape-texture-option${!item.texture ? " active" : ""}" type="button" data-shape-texture="">None</button>
          ${SHAPE_TEXTURES.map(
            (texture) => `
            <button class="shape-texture-option${item.texture === texture.id ? " active" : ""}" type="button" data-shape-texture="${escapeHtml(texture.id)}" title="${escapeHtml(texture.name)}">
              <span class="shape-texture-icon" style="background-image:url('${texture.url}')"></span>
            </button>
          `,
          ).join("")}
        </div>
      </div>`
    : "";
  const tokenImageField = item.kind
    ? `<div class="col-12"><label>Image URL</label><input data-selected-field="imageUrl" class="form-control form-control-sm" value="${escapeHtml(item.imageUrl || "")}" placeholder="https://..."></div>`
    : "";
  const sizeLinked = item.sizeLinked !== false;
  const sizeLinkIcon = sizeLinked ? "bi-link-45deg" : "bi-unlink";
  const concealedName = item.kind && tokenNameIsHidden(item) && !isGm;
  const nameField =
    item.kind === "character"
      ? ""
      : `<label>Name</label>
    <input data-selected-field="name" class="form-control form-control-sm" value="${escapeHtml(concealedName ? "?" : item.name || "")}" ${concealedName ? "readonly" : ""}>`;
  const quickControlsAvailable = canUseQuickControls(item);
  const quickControlsOpen = quickControlsAvailable && quickControlsOpenId === item.id;
  const quickControlsToggle = quickControlsAvailable
    ? `<button type="button" class="btn btn-outline-info btn-sm quick-controls-toggle${quickControlsOpen ? " active" : ""}" data-quick-controls-toggle title="Quick controls" aria-label="Quick controls" aria-pressed="${quickControlsOpen}">
        <i class="bi bi-controller"></i>
      </button>`
    : "";
  const belowFoldHtml = quickControlsOpen
    ? renderQuickControlsPanel(item)
    : `
    ${compactSheet}
    ${effectsSection}
    <div class="accordion selected-collapse mt-2" id="selectedDetailsAccordion">
      <div class="accordion-item bg-dark border-secondary">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#selectedDetailsCollapse" aria-expanded="false" aria-controls="selectedDetailsCollapse">
            Position & Style
          </button>
        </h2>
        <div id="selectedDetailsCollapse" class="accordion-collapse collapse${wasDetailsOpen ? " show" : ""}" data-bs-parent="#selectedDetailsAccordion">
          <div class="accordion-body">
            <div class="row g-2">
              <div class="col-6"><label>X</label><input data-selected-field="x" class="form-control form-control-sm" type="number" value="${item.x || 0}"></div>
              <div class="col-6"><label>Y</label><input data-selected-field="y" class="form-control form-control-sm" type="number" value="${item.y || 0}"></div>
              <div class="col-12">
                <div class="size-link-row">
                  <div><label>W</label><input data-selected-field="w" class="form-control form-control-sm" type="number" min="1" value="${item.w || 1}"></div>
                  <button class="btn ${sizeLinked ? "btn-info" : "btn-outline-light"} btn-sm size-link-toggle" type="button" data-toggle-size-link title="${sizeLinked ? "Unlink width and height" : "Link width and height"}" aria-label="${sizeLinked ? "Unlink width and height" : "Link width and height"}">
                    <i class="bi ${sizeLinkIcon}"></i>
                  </button>
                  <div><label>H</label><input data-selected-field="h" class="form-control form-control-sm" type="number" min="1" value="${item.h || 1}"></div>
                </div>
              </div>
              ${tokenImageField}
              <div class="col-12"><label>Color</label><input data-selected-field="color" class="form-control form-control-sm" type="color" value="${escapeHtml(item.color || "#8fd19e")}"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${textureFields}
  `;
  const detailHtml = `
    ${nameField}
    ${quickControlsToggle}
    ${belowFoldHtml}
  `;
  const selectedCharacterName =
    item.kind === "character" && characterPanelCharacterId
      ? tokenActualName(item)
      : "";
  el("selectedPanel").innerHTML =
    item.kind === "character"
      ? `${renderCharacterPanelBack(selectedCharacterName)}${detailHtml}`
      : detailHtml;
  bindSelectedPanelInteractions(item);
}

function bindSelectedPanelInteractions(item) {
  el("selectedPanel")
    .querySelector("[data-character-panel-back]")
    ?.addEventListener("click", () => {
      characterPanelCharacterId = "";
      if (selectedObject()?.kind === "character") selectedId = "";
      renderSelectedPanel();
      renderMap();
    });
  el("selectedPanel")
    .querySelectorAll("[data-character-panel-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        characterPanelCharacterId = button.dataset.characterPanelId || "";
        const token = state.tokens.find(
          (entry) =>
            entry.kind === "character" &&
            entry.characterId === characterPanelCharacterId,
        );
        selectedId = token?.id || "";
        renderSelectedPanel();
        renderMap();
      });
    });
  if (!item) return;
  el("selectedPanel")
    .querySelectorAll("[data-selected-field]")
    .forEach((input) => {
      input.addEventListener("input", () => {
        const value = ["x", "y", "w", "h"].includes(input.dataset.selectedField)
          ? Number(input.value || 0)
          : input.value;
        item[input.dataset.selectedField] = value;
        if (
          (input.dataset.selectedField === "w" ||
            input.dataset.selectedField === "h") &&
          item.sizeLinked !== false
        ) {
          const pairedField = input.dataset.selectedField === "w" ? "h" : "w";
          item[pairedField] = Math.max(1, value || 1);
          const pairedInput = el("selectedPanel").querySelector(
            `[data-selected-field="${pairedField}"]`,
          );
          if (pairedInput) pairedInput.value = item[pairedField];
        }
        renderMap();
        renderInitiative();
        queueSave();
      });
    });
  el("selectedPanel")
    .querySelector("[data-toggle-size-link]")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      item.sizeLinked = item.sizeLinked === false;
      if (item.sizeLinked) {
        item.h = Math.max(1, Number(item.w || item.h || 1));
      }
      renderSelectedPanel();
      renderMap();
      queueSave();
    });
  el("selectedPanel")
    .querySelectorAll("[data-token-current-hp]")
    .forEach((input) => {
      input.addEventListener("input", () =>
        queueTokenCurrentHp(input.dataset.tokenCurrentHp, input.value),
      );
      input.addEventListener("change", () =>
        flushTokenCurrentHp(input.dataset.tokenCurrentHp, input.value),
      );
      input.addEventListener("blur", () =>
        flushTokenCurrentHp(input.dataset.tokenCurrentHp, input.value),
      );
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          flushTokenCurrentHp(input.dataset.tokenCurrentHp, input.value);
          input.blur();
        }
      });
    });
  el("selectedPanel")
    .querySelectorAll("[data-open-token-effects]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        openMapEffects(button.dataset.openTokenEffects),
      );
    });
  el("selectedPanel")
    .querySelectorAll("[data-map-weapon-expand]")
    .forEach((row) => {
      row.addEventListener("click", () => {
        const key = `${item.id}:${row.dataset.mapWeaponExpand}`;
        expandedMapWeaponKey = expandedMapWeaponKey === key ? "" : key;
        renderSelectedPanel();
      });
    });
  el("selectedPanel")
    .querySelectorAll("[data-map-weapon-option]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        saveMapWeaponOption(
          item.id,
          Number(input.dataset.mapWeaponOption || 0),
          input.dataset.mapWeaponField,
          input.checked,
        );
      });
    });
  el("selectedPanel")
    .querySelectorAll("[data-shape-texture]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        item.texture = button.dataset.shapeTexture || "";
        renderAll();
      });
    });
  bindQuickControlsPanel(item);
}

function renderInitiative() {
  const list = el("initiativeList");
  el("roundCounter").textContent = `Round ${state.roundsPassed || 1}`;
  if (!state.initiative.length) {
    list.innerHTML = `<div class="small text-secondary">No initiative entries.</div>`;
    return;
  }
  list.innerHTML = state.initiative
    .map((entry, index) => {
      const active =
        index === state.activeTurn && !entry.disabled ? " active" : "";
      const disabled = entry.disabled ? " disabled" : "";
      const name = initiativeNameFromEntry(entry);
      return `
      <div class="initiative-row${active}${disabled}">
        <div class="initiative-row-grid">
          <div class="initiative-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
          <input class="form-control form-control-sm" data-init-score="${escapeHtml(entry.id)}" type="number" value="${entry.score || 0}" aria-label="Initiative score">
          <span class="initiative-controls">
            <button class="btn btn-outline-light btn-sm btn-icon" type="button" data-init-up="${escapeHtml(entry.id)}" title="Move up" aria-label="Move up"><i class="bi bi-arrow-up"></i></button>
            <button class="btn btn-outline-light btn-sm btn-icon" type="button" data-init-down="${escapeHtml(entry.id)}" title="Move down" aria-label="Move down"><i class="bi bi-arrow-down"></i></button>
            <button class="btn ${entry.disabled ? "btn-outline-success" : "btn-outline-warning"} btn-sm btn-icon" type="button" data-init-disable="${escapeHtml(entry.id)}" title="${entry.disabled ? "Enable" : "Disable"}" aria-label="${entry.disabled ? "Enable" : "Disable"}"><i class="bi ${entry.disabled ? "bi-play-fill" : "bi-pause-fill"}"></i></button>
            ${
              entry.custom
                ? `<button class="btn btn-outline-danger btn-sm btn-icon" type="button" data-init-remove="${escapeHtml(entry.id)}" title="Remove custom entry" aria-label="Remove custom entry"><i class="bi bi-trash"></i></button>`
                : ""
            }
          </span>
        </div>
      </div>
    `;
    })
    .join("");
  list.querySelectorAll("[data-init-score]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.initiative.find(
        (entry) => entry.id === input.dataset.initScore,
      );
      if (row) row.score = Number(input.value || 0);
      queueSave();
    });
    input.addEventListener("change", () => {
      const row = state.initiative.find(
        (entry) => entry.id === input.dataset.initScore,
      );
      if (row) row.score = Number(input.value || 0);
      placeInitiativeRow(row);
      renderAll();
    });
  });
  list.querySelectorAll("[data-init-up]").forEach((button) => {
    button.addEventListener("click", () =>
      moveInitiativeRow(button.dataset.initUp, -1),
    );
  });
  list.querySelectorAll("[data-init-down]").forEach((button) => {
    button.addEventListener("click", () =>
      moveInitiativeRow(button.dataset.initDown, 1),
    );
  });
  list.querySelectorAll("[data-init-disable]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleInitiativeRow(button.dataset.initDisable),
    );
  });
  list.querySelectorAll("[data-init-remove]").forEach((button) => {
    button.addEventListener("click", () =>
      removeInitiativeRow(button.dataset.initRemove),
    );
  });
}

function maskHiddenTokenNames(value) {
  let text = String(value ?? "");
  state.tokens
    .filter(tokenNameIsHidden)
    .sort((a, b) => tokenActualName(b).length - tokenActualName(a).length)
    .forEach((token) => {
      const actual = tokenActualName(token);
      if (!actual || actual === "?") return;
      const replacement = isGm ? `[?] ${actual}` : "?";
      if (isGm) {
        text = text.split(`[?] ${actual}`).join(`\u0000${actual}\u0000`);
        text = text.split(actual).join(replacement);
        text = text.split(`\u0000${actual}\u0000`).join(replacement);
      } else {
        text = text.split(actual).join(replacement);
      }
    });
  return text;
}

function restoreShownTokenNameInTimeline(token) {
  const actual = tokenActualName(token);
  if (!actual || actual === "?") return;
  const hiddenGmName = `[?] ${actual}`;
  state.timeline = state.timeline.map((row) => {
    const next = { ...row };
    if (typeof next.text === "string") {
      next.text = next.text.split(hiddenGmName).join(actual);
    }
    if (Array.isArray(next.parts)) {
      next.parts = next.parts.map((part) =>
        typeof part?.text === "string"
          ? { ...part, text: part.text.split(hiddenGmName).join(actual) }
          : part,
      );
    }
    return next;
  });
}

function renderTimeline() {
  const rows = state.timeline.slice(-20);
  el("timelineList").innerHTML = state.timeline.length
    ? rows
        .slice()
        .reverse()
        .map(
          (row) =>
            `<div class="timeline-row"><div>${timelineRowContent(row)}</div><div class="small text-secondary">${escapeHtml(row.time || "")}</div></div>`,
        )
        .join("")
    : `<div class="small text-secondary">No events yet.</div>`;
}

function renderAll(save = true) {
  renderMap();
  renderSelectedPanel();
  renderInitiative();
  renderTimeline();
  renderAuraEffectToasts();
  renderTurnEffectNotices();
  if (save) queueSave();
}

// selectedObject() only searches tokens/shapes (its full return value --
// kind, effects, etc. -- only ever makes sense for those two), so it's
// the wrong check for "does *anything* with this id still exist" once
// heightShapes is a third possible source. Kept separate on purpose.
function mapItemExists(id) {
  return [...state.tokens, ...state.shapes, ...state.heightShapes].some(
    (entry) => entry.id === id,
  );
}

// True while focus is inside an editable field in the selected-item
// panel (typing a name, a color, the Height Layer's feet input, ...).
// A remote map update arriving mid-edit shouldn't blow that field's
// DOM node away and steal focus -- see applyRemoteMapState() below.
function isEditingSelectedPanelField() {
  const active = document.activeElement;
  const panel = el("selectedPanel");
  return Boolean(
    panel &&
      active &&
      panel.contains(active) &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName),
  );
}

function applyRemoteMapState(remoteState) {
  if (dragState || resizeState || isEditingSelectedPanelField()) {
    pendingRemoteState = remoteState;
    return;
  }
  clearTimeout(saveTimer);
  state = normalizeState(remoteState);
  if (selectedId && !mapItemExists(selectedId)) selectedId = "";
  if (
    contextMenuTokenId &&
    !state.tokens.some((token) => token.id === contextMenuTokenId)
  )
    hideContextMenu();
  applySettingsToInputs();
  renderAll(false);
  refreshMapTokenSheets({ save: false });
}

function flushPendingRemoteState() {
  if (!pendingRemoteState) return;
  if (isEditingSelectedPanelField()) return; // still editing -- wait
  const localDraggedId = dragState?.id || resizeState?.id;
  // Which of the three arrays localDraggedId actually lives in matters
  // for putting it back in the right place below -- tokens/shapes and
  // heightShapes items don't carry anything (like .kind) that tells
  // them apart after the fact, so track the source array at lookup
  // time instead of guessing from the item's own shape.
  let localDraggedItem = null;
  let sourceKey = null;
  for (const key of ["tokens", "shapes", "heightShapes"]) {
    const found = state[key].find((entry) => entry.id === localDraggedId);
    if (found) {
      localDraggedItem = found;
      sourceKey = key;
      break;
    }
  }
  const remoteState = normalizeState(pendingRemoteState);
  pendingRemoteState = null;

  if (!localDraggedId || !localDraggedItem) {
    state = remoteState;
    if (selectedId && !mapItemExists(selectedId)) selectedId = "";
    applySettingsToInputs();
    renderAll(false);
    return;
  }

  state = remoteState;
  const collection = state[sourceKey];
  const existingIndex = collection.findIndex(
    (entry) => entry.id === localDraggedId,
  );
  if (existingIndex >= 0) {
    collection[existingIndex] = localDraggedItem;
  } else {
    collection.push(localDraggedItem);
  }
  if (selectedId && !mapItemExists(selectedId)) selectedId = "";
  applySettingsToInputs();
  renderAll(false);
}

function queueSave() {
  clearTimeout(saveTimer);
  const slot = mapViewSlot;
  saveTimer = setTimeout(async () => {
    await PFApp.saveMapState(state, mapContextKey, slot);
  }, 500);
}

function startDrag(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  hideContextMenu();
  suppressStageClick = true;
  const id = event.currentTarget.dataset.mapId;
  const item = [...state.tokens, ...state.shapes, ...state.heightShapes].find(
    (entry) => entry.id === id,
  );
  if (!item) return;
  selectedId = id;
  dragState = {
    id,
    startX: event.clientX,
    startY: event.clientY,
    x: item.x || 0,
    y: item.y || 0,
  };
  // Not fatal if this throws (e.g. no active pointer with this id) --
  // the drag still works via the window-level listeners below, just
  // without a captured pointer guaranteeing events keep arriving if
  // the cursor leaves the element.
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    /* see comment above */
  }
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag, { once: true });
  renderAll(false);
  showSelectedPanel();
}

function moveDrag(event) {
  if (!dragState) return;
  const item = [...state.tokens, ...state.shapes, ...state.heightShapes].find(
    (entry) => entry.id === dragState.id,
  );
  if (!item) return;
  const cell = Number(localGridSize || 48);
  const dx = Math.round((event.clientX - dragState.startX) / cell);
  const dy = Math.round((event.clientY - dragState.startY) / cell);
  item.x = clamp(dragState.x + dx, 0, state.settings.cols - (item.w || 1));
  item.y = clamp(dragState.y + dy, 0, state.settings.rows - (item.h || 1));
  renderAll(false);
}

// Same OS-window-style resize for both regular map shapes and Height
// Layer regions -- whichever array is "active" depends on whether the
// Height Layer is open (see resizableItemsList()).
function resizableItemsList() {
  return heightEditMode ? state.heightShapes : state.shapes;
}

function startResize(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  hideContextMenu();
  suppressStageClick = true;
  const id = event.currentTarget.dataset.mapId;
  const handle = event.currentTarget.dataset.resizeHandle;
  const item = resizableItemsList().find((entry) => entry.id === id);
  if (!item) return;
  selectedId = id;
  resizeState = {
    id,
    handle,
    startX: event.clientX,
    startY: event.clientY,
    x: item.x || 0,
    y: item.y || 0,
    w: item.w || 1,
    h: item.h || 1,
  };
  // setPointerCapture can throw (e.g. no active pointer with this id) --
  // when it does, the drag should still work via the window-level
  // listeners below, just without a captured pointer guaranteeing
  // events keep arriving if the cursor leaves the handle.
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    /* not fatal -- see comment above */
  }
  window.addEventListener("pointermove", moveResize);
  window.addEventListener("pointerup", endResize, { once: true });
  renderAll(false);
  showSelectedPanel();
}

function moveResize(event) {
  if (!resizeState) return;
  const item = resizableItemsList().find(
    (entry) => entry.id === resizeState.id,
  );
  if (!item) return;
  const cell = Number(localGridSize || 48);
  const dx = Math.round((event.clientX - resizeState.startX) / cell);
  const dy = Math.round((event.clientY - resizeState.startY) / cell);
  const handle = resizeState.handle;
  let { x, y, w, h } = resizeState;
  if (handle.includes("e")) w = Math.max(1, resizeState.w + dx);
  if (handle.includes("s")) h = Math.max(1, resizeState.h + dy);
  if (handle.includes("w")) {
    w = Math.max(1, resizeState.w - dx);
    x = resizeState.x + (resizeState.w - w);
  }
  if (handle.includes("n")) {
    h = Math.max(1, resizeState.h - dy);
    y = resizeState.y + (resizeState.h - h);
  }
  item.w = Math.min(w, state.settings.cols);
  item.h = Math.min(h, state.settings.rows);
  item.x = clamp(x, 0, state.settings.cols - item.w);
  item.y = clamp(y, 0, state.settings.rows - item.h);
  renderAll(false);
}

function endResize() {
  flushPendingRemoteState();
  resizeState = null;
  window.removeEventListener("pointermove", moveResize);
  renderAll();
}

function endDrag() {
  flushPendingRemoteState();
  dragState = null;
  window.removeEventListener("pointermove", moveDrag);
  renderAll();
  removeOutOfRangeAuraEffects();
}

function addToken(kind) {
  if (kind === "enemy" && !isGm) return;
  if (kind === "character") {
    openCharacterPicker();
    return;
  }
  if (kind === "enemy") {
    openEnemyPicker();
    return;
  }
  if (kind === "token") {
    openGenericTokenModal();
    return;
  }
  const name = "Token";
  const token = {
    id: uid("token"),
    kind,
    ownerId: currentUserId,
    name,
    x: 1,
    y: 1,
    w: 1,
    h: 1,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    color: "#8fd19e",
  };
  state.tokens.push(token);
  selectedId = token.id;
  addTimeline(`${name} entered the map.`);
  renderAll();
}

function openGenericTokenModal() {
  el("genericTokenName").value = "";
  el("genericTokenHideName").checked = false;
  genericTokenModal.show();
  setTimeout(() => el("genericTokenName").focus(), 150);
}

function submitGenericToken(event) {
  event.preventDefault();
  const name = el("genericTokenName").value.trim() || "Token";
  const token = {
    id: uid("token"),
    kind: "token",
    ownerId: currentUserId,
    name,
    hideName: el("genericTokenHideName").checked,
    x: 1,
    y: 1,
    w: 1,
    h: 1,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    color: "#3d8bfd",
  };
  state.tokens.push(token);
  ensureTokenInitiative(token);
  selectedId = token.id;
  genericTokenModal.hide();
  addTimeline(`${name} entered the map.`);
  renderAll();
}

function enemyHpText(enemy) {
  const fields = enemy.sheet?.fields || {};
  const calculated = enemy.sheet?.calculated || {};
  const current = calculated.hp?.current || fields.currentHitPoints || "?";
  const total =
    calculated.hp?.total || fields.hitPointsTotal || fields.hitPoints || "?";
  return `${current}/${total}`;
}

function enemyAcText(enemy) {
  return (
    enemy.sheet?.calculated?.armorClass?.ac ||
    enemy.sheet?.fields?.acTotal ||
    "?"
  );
}

function characterHpText(character) {
  const fields = character.sheet?.fields || {};
  const calculated = character.sheet?.calculated || {};
  const current = calculated.hp?.current || fields.currentHitPoints || "?";
  const total =
    calculated.hp?.total || fields.hitPointsTotal || fields.hitPoints || "?";
  return `${current}/${total}`;
}

function characterAcText(character) {
  return (
    character.sheet?.calculated?.armorClass?.ac ||
    character.sheet?.fields?.acTotal ||
    "?"
  );
}

function availableCharacterPickerRows() {
  const term = el("characterPickerSearch").value.trim().toLowerCase();
  return mapCharacters
    .filter((character) => isGm || character.userId === currentUserId)
    .filter((character) => !term || character.name.toLowerCase().includes(term))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function renderCharacterPicker() {
  const rows = availableCharacterPickerRows();
  el("characterPickerList").innerHTML = rows.length
    ? rows
        .map((character) => {
          const onMap = state.tokens.some(
            (token) =>
              token.kind === "character" && token.characterId === character.id,
          );
          return `
        <button class="enemy-picker-row" type="button" data-character-id="${escapeHtml(character.id)}">
          <div class="d-flex justify-content-between gap-2">
            <strong>${escapeHtml(character.name)}</strong>
            ${onMap ? `<span class="badge text-bg-secondary">On map</span>` : ""}
          </div>
          <div class="small text-secondary">HP ${escapeHtml(characterHpText(character))} | AC ${escapeHtml(characterAcText(character))}${isGm && character.username ? ` | ${escapeHtml(character.username)}` : ""}</div>
        </button>
      `;
        })
        .join("")
    : `<div class="small text-secondary">No characters found.</div>`;
  el("characterPickerList")
    .querySelectorAll("[data-character-id]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        addCharacterTokenFromLibrary(button.dataset.characterId),
      );
    });
}

async function openCharacterPicker() {
  mapCharacters = await PFApp.loadContextCharacters(mapContextKey);
  await hydrateMapCharacterSheets();
  el("characterPickerSearch").value = "";
  renderCharacterPicker();
  characterPickerModal.show();
  setTimeout(() => el("characterPickerSearch").focus(), 150);
}

function addCharacterTokenFromLibrary(characterId) {
  const character = mapCharacters.find((item) => item.id === characterId);
  if (!character) return;
  const existingToken = state.tokens.find(
    (token) => token.kind === "character" && token.characterId === character.id,
  );
  if (existingToken) {
    selectedId = existingToken.id;
    characterPickerModal.hide();
    renderAll(false);
    showSelectedPanel();
    return;
  }
  const token = {
    id: uid("token"),
    kind: "character",
    characterId: character.id,
    ownerId: character.userId || currentUserId,
    name: character.name || "Character",
    x: 1,
    y: 1,
    w: 1,
    h: 1,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    color: "#8fd19e",
  };
  syncTokenFromSheet(token, character);
  state.tokens.push(token);
  ensureTokenInitiative(token);
  selectedId = token.id;
  characterPickerModal.hide();
  addTimeline(`${token.name} entered the map.`);
  renderAll();
}

function renderEnemyPicker() {
  const term = el("enemyPickerSearch").value.trim().toLowerCase();
  const rows = mapEnemies.filter(
    (enemy) => !term || enemy.name.toLowerCase().includes(term),
  );
  el("enemyPickerList").innerHTML = rows.length
    ? rows
        .map(
          (enemy) => `
      <button class="enemy-picker-row" type="button" data-enemy-id="${escapeHtml(enemy.id)}">
        <div class="d-flex justify-content-between gap-2">
          <strong>${escapeHtml(enemy.name)}</strong>
          <span class="badge ${enemy.visible ? "text-bg-success" : "text-bg-secondary"}">${enemy.visible ? "Visible" : "Hidden"}</span>
        </div>
        <div class="small text-secondary">HP ${escapeHtml(enemyHpText(enemy))} | AC ${escapeHtml(enemyAcText(enemy))}</div>
      </button>
    `,
        )
        .join("")
    : `<div class="small text-secondary">No enemies found.</div>`;
  el("enemyPickerList")
    .querySelectorAll("[data-enemy-id]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        addEnemyTokenFromLibrary(button.dataset.enemyId),
      );
    });
}

async function openEnemyPicker() {
  mapEnemies = await PFApp.loadEnemies(mapContextKey);
  el("enemyPickerSearch").value = "";
  el("enemyTokenVisible").checked = true;
  el("enemyTokenHideName").checked = false;
  renderEnemyPicker();
  enemyPickerModal.show();
  setTimeout(() => el("enemyPickerSearch").focus(), 150);
}

function addEnemyTokenFromLibrary(enemyId) {
  const enemy = mapEnemies.find((item) => item.id === enemyId);
  if (!enemy) return;
  const token = {
    id: uid("token"),
    kind: "enemy",
    enemyId: enemy.id,
    name: enemy.name,
    x: 1,
    y: 1,
    w: 1,
    h: 1,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    hp: enemyHpText(enemy),
    ac: enemyAcText(enemy),
    visible: el("enemyTokenVisible").checked,
    hideName: el("enemyTokenHideName").checked,
    sheet: structuredClone(enemy.sheet || {}),
    color: "#b02a37",
  };
  state.tokens.push(token);
  ensureTokenInitiative(token);
  selectedId = token.id;
  enemyPickerModal.hide();
  if (token.visible !== false) addTimeline(`${enemy.name} entered the map.`);
  renderAll();
}

function addShape(shape) {
  const item = {
    id: uid("shape"),
    shape,
    ownerId: currentUserId,
    name: shape === "circle" ? "Circle" : "Rectangle",
    x: 3,
    y: 3,
    w: 3,
    h: 3,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    color: "#f0d58c",
  };
  state.shapes.push(item);
  selectedId = item.id;
  renderAll();
}

function addHeightShape() {
  const item = {
    id: uid("height"),
    x: 3,
    y: 3,
    w: 3,
    h: 3,
    sizeLinked: false,
    heightFeet: 5,
    color: "#61dafb",
  };
  state.heightShapes.push(item);
  selectedId = item.id;
  renderAll();
}

function deleteHeightShape(id) {
  state.heightShapes = state.heightShapes.filter((shape) => shape.id !== id);
  if (selectedId === id) selectedId = "";
  renderAll();
}

// Swaps the whole toolbar + stage + selected-panel into a dedicated
// view for painting elevation (state.heightShapes) -- separate from
// the ordinary gameplay Rect/Circle shapes, tokens, and fog, none of
// which render while this is open. See renderMap()/renderSelectedPanel().
function toggleHeightEditMode(next = !heightEditMode) {
  heightEditMode = next;
  selectedId = "";
  el("mapNormalToolbar").classList.toggle("d-none", heightEditMode);
  el("mapHeightToolbar").classList.toggle("d-none", !heightEditMode);
  renderAll(false);
}

function deleteSelected() {
  if (!selectedId) return;
  const item = selectedObject();
  if (!canManageMapItem(item)) return;
  removeMapItem(selectedId);
}

function removeMapItem(itemId) {
  const item = [...state.tokens, ...state.shapes].find(
    (entry) => entry.id === itemId,
  );
  if (!item) return;
  const name = item.name || "Token";
  state.tokens = state.tokens.filter((token) => token.id !== itemId);
  state.shapes = state.shapes.filter((shape) => shape.id !== itemId);
  state.initiative = state.initiative.filter(
    (entry) => entry.tokenId !== itemId,
  );
  selectedId = "";
  contextMenuTokenId = "";
  state.activeTurn = clamp(
    state.activeTurn,
    0,
    Math.max(0, state.initiative.length - 1),
  );
  if (item.kind === "character") addTimeline(`${name} left the map.`);
  renderAll();
}

function removeContextMenuToken() {
  const item = [...state.tokens, ...state.shapes].find(
    (entry) => entry.id === contextMenuTokenId,
  );
  if (!item || !canManageMapItem(item)) return;
  hideContextMenu();
  selectedId = item.id;
  removeMapItem(item.id);
}

function updateTokenHpPreview(token, value) {
  const total = tokenTotalHp(token);
  token.hp = value || total ? `${value || "?"}/${total || "?"}` : "";
}

function nextHpSaveSeq(tokenId) {
  const seq = (hpSaveSeq.get(tokenId) || 0) + 1;
  hpSaveSeq.set(tokenId, seq);
  return seq;
}

function queueTokenCurrentHp(tokenId, value) {
  const token = tokenById(tokenId);
  if (!token || !canEditTokenHp(token)) return;
  pendingTokenHp.set(tokenId, value);
  updateTokenHpPreview(token, value);
  clearTimeout(hpSaveTimers.get(tokenId));
  hpSaveTimers.set(
    tokenId,
    setTimeout(() => {
      hpSaveTimers.delete(tokenId);
      updateTokenCurrentHp(tokenId, value, nextHpSaveSeq(tokenId));
    }, 900),
  );
}

function flushTokenCurrentHp(tokenId, value) {
  if (!hpSaveTimers.has(tokenId)) return;
  clearTimeout(hpSaveTimers.get(tokenId));
  hpSaveTimers.delete(tokenId);
  updateTokenCurrentHp(tokenId, value, nextHpSaveSeq(tokenId));
}

async function updateTokenCurrentHp(
  tokenId,
  value,
  seq = nextHpSaveSeq(tokenId),
) {
  const token = tokenById(tokenId);
  if (!token || !canEditTokenHp(token)) return;

  if (token.kind === "enemy") {
    const saved = await PFApp.updateEnemyCurrentHp(
      token.enemyId,
      value,
      mapContextKey,
    );
    if (hpSaveSeq.get(tokenId) !== seq) return;
    if (!saved) {
      pendingTokenHp.delete(tokenId);
      console.warn("Could not update HP");
      renderAll(false);
      return;
    }
    if (saved) {
      pendingTokenHp.delete(tokenId);
      syncTokenFromSheet(token, saved);
    }
  } else {
    const saved = await PFApp.updateCharacterCurrentHp(
      token.characterId,
      value,
      mapContextKey,
    );
    if (hpSaveSeq.get(tokenId) !== seq) return;
    if (!saved) {
      pendingTokenHp.delete(tokenId);
      console.warn("Could not update HP");
      renderAll(false);
      return;
    }
    const character = mapCharacters.find(
      (item) => item.id === token.characterId,
    );
    if (saved?.id && character) {
      pendingTokenHp.delete(tokenId);
      character.sheet = {
        ...(character.sheet || {}),
        ...(
          await PFApp.loadCharacterSheet("", mapContextKey, token.characterId)
        )?.sheet,
      };
      syncTokenFromSheet(token, character);
    }
  }

  renderAll();
  localStorage.setItem(
    `pf_map_sheet_hp_updated_${mapContextKey}_${token.kind}_${token.kind === "enemy" ? token.enemyId : token.characterId}`,
    String(Date.now()),
  );
}

async function ensureMapClassDefinitions() {
  if (!mapClassDefinitions) {
    mapClassDefinitions = window.PFClassData
      ? await window.PFClassData.loadAllClasses()
      : [];
  }
  return mapClassDefinitions;
}

// Every base-30 PF skill plus this character's own homebrew ones --
// matches character-sheet.js's allSkills() so a "choose a skill" pick
// offers the same options wherever it's answered.
function characterSkillOptions(character) {
  const base = window.PFEffectStats?.PF_SKILLS_WITH_ABILITY || [];
  const custom = Array.isArray(character?.sheet?.customSkills)
    ? character.sheet.customSkills.map((skill) => [
        skill.name,
        skill.ability || "int",
      ])
    : [];
  return [...base, ...custom];
}

// The class features (Rage, its bundled rage powers/totems, ...) a
// character could activate, computed from their own saved sheet data --
// used both for self-cast (character sheet) and for casting one
// character's abilities onto another token from the map (Share Rage /
// Skald's Inspired Rage).
async function characterActivatableAbilities(character) {
  if (!character?.sheet) return [];
  await ensureMapClassDefinitions();
  const abilities = character.sheet.abilities || {};
  return (
    window.PFClassFeatureAbilities?.collectActivatableAbilities({
      classDefinitions: mapClassDefinitions || [],
      classProgression: character.sheet.classProgression || [],
      classFeatureChoices: character.sheet.classFeatureChoices || {},
      characterLevel: character.sheet.fields?.characterLevel,
      abilityScores: {
        str: abilities.str?.score,
        dex: abilities.dex?.score,
        con: abilities.con?.score,
        int: abilities.int?.score,
        wis: abilities.wis?.score,
        cha: abilities.cha?.score,
      },
    }) || []
  );
}

// This modal is for directly managing a token's own active effects
// (self-application, or a GM tidying up an NPC) -- casting one
// character's class features onto ANOTHER token belongs in "Apply
// Effect" and Aura Options instead, where the caster and target are
// already unambiguous from the right-click context, so this doesn't
// need its own "cast as" picker.
async function openMapEffects(tokenId) {
  const token = tokenById(tokenId);
  const mount = el("mapEffectTracker");
  if (!token || !mount || !canManageEffects(token)) return;

  const effectTargetId =
    token.kind === "enemy" ? token.enemyId : token.characterId;
  if (!effectTargetId) {
    mount.innerHTML = `<div class="small text-secondary">Save this token source before adding effects.</div>`;
    mapEffectsModal.show();
    return;
  }

  el("mapEffectsModalLabel").textContent = `${displayTokenName(token)} Effects`;
  // Enemies aren't "controlled" by a separate real person -- only route
  // a choice-needing effect through the pending-request flow when
  // whoever's applying it isn't that character's own owner.
  const isOwnCharacter =
    token.kind === "enemy" ||
    tokenCharacter(token)?.userId === currentUserId;
  const options = {
    contextKey: mapContextKey,
    characterId: effectTargetId,
    isOwnCharacter,
    loadActiveEffects:
      token.kind === "enemy"
        ? async () => {
            const enemy = await PFApp.loadEnemy(token.enemyId, mapContextKey);
            if (enemy?.sheet) token.sheet = structuredClone(enemy.sheet);
            return token.sheet?.activeBuffs || [];
          }
        : undefined,
    saveActiveEffects: async (effects) => {
      const activeEffects = Array.isArray(effects) ? effects : [];
      if (token.kind === "character") {
        const savedBuffs = await PFApp.saveBuffState(
          activeEffects,
          mapContextKey,
          token.characterId,
        );
        if (savedBuffs?.ok === false) {
          console.error(savedBuffs.error);
          console.warn("Could not save effects");
          return;
        }
        const stamp = String(Date.now());
        localStorage.setItem(`pf_buffs_updated_${mapContextKey}`, stamp);
        localStorage.setItem(
          `pf_buffs_updated_${mapContextKey}_${token.characterId}`,
          stamp,
        );
        await recalculateCharacterSheetFromMap(token.characterId);
        const character = tokenCharacter(token);
        if (character) {
          const saved = await PFApp.loadCharacterSheet(
            "",
            mapContextKey,
            token.characterId,
          );
          if (saved?.sheet) character.sheet = saved.sheet;
          syncTokenFromSheet(token, character);
          renderAll();
        }
        await refetchMapSheetState();
        return;
      }

      if (token.kind === "enemy") {
        const enemy = await PFApp.loadEnemy(token.enemyId, mapContextKey);
        const sheet = structuredClone(enemy?.sheet || token.sheet || {});
        sheet.activeBuffs = activeEffects;
        const saved = await PFApp.saveEnemy(
          {
            id: token.enemyId,
            name: enemy?.name || token.name || "Enemy",
            visible: enemy?.visible !== false,
            sheet,
          },
          mapContextKey,
        );
        if (saved) {
          await recalculateEnemySheetFromMap(saved.id);
          const refreshed = await PFApp.loadEnemy(saved.id, mapContextKey);
          const nextEnemy = refreshed || saved;
          syncTokenFromSheet(token, nextEnemy);
          token.sheet = structuredClone(nextEnemy.sheet || sheet);
          mapEnemies = mapEnemies.map((item) =>
            item.id === nextEnemy.id ? nextEnemy : item,
          );
          if (!mapEnemies.some((item) => item.id === nextEnemy.id))
            mapEnemies.push(nextEnemy);
          localStorage.setItem(
            `pf_enemy_sheet_updated_${mapContextKey}_${nextEnemy.id}`,
            String(Date.now()),
          );
          renderAll();
          await refetchMapSheetState();
        }
      }
    },
    onChange: async (effects) => {
      if (token.kind === "character") {
        const character = tokenCharacter(token);
        if (character) {
          syncTokenFromSheet(token, character);
          renderAll(false);
        }
      } else if (token.kind === "enemy") {
        renderAll(false);
      }
    },
  };

  if (!mapEffectTrackerInstance) {
    mapEffectTrackerInstance = PFEffectTracker.mount(mount, options);
    await mapEffectTrackerInstance.ready;
  } else {
    await mapEffectTrackerInstance.refresh(options);
  }
  mapEffectsModal.show();
}

function quickEffectUsageKey() {
  return `pf_map_quick_effect_usage_${mapContextKey || "general"}`;
}

function quickEffectUsageCounts() {
  try {
    return (
      JSON.parse(localStorage.getItem(quickEffectUsageKey()) || "{}") || {}
    );
  } catch {
    return {};
  }
}

function incrementQuickEffectUsage(effect) {
  const key = effect?.id || effect?.name;
  if (!key) return;
  const counts = quickEffectUsageCounts();
  counts[key] = Number(counts[key] || 0) + 1;
  localStorage.setItem(quickEffectUsageKey(), JSON.stringify(counts));
}

function tokenLevel(token) {
  const sheet =
    token?.kind === "enemy"
      ? token.sheet || {}
      : tokenCharacter(token)?.sheet || {};
  const fields = sheet.fields || {};
  return Math.max(
    1,
    Number(fields.characterLevel || fields.classLevel || fields.level || 1) ||
      1,
  );
}

function effectCardHtml(effect, index, prefix, defaultCl) {
  const bonuses = (effect.bonuses || []).slice(0, 8);
  const bonusHtml = bonuses.length
    ? bonuses
        .map(
          (bonus) =>
            `<span class="quick-effect-chip">${escapeHtml(effectBonusText(bonus))}</span>`,
        )
        .join("")
    : `<span class="small text-secondary">No numerical changes</span>`;
  const more =
    (effect.bonuses || []).length > bonuses.length
      ? `<span class="small text-secondary">+${(effect.bonuses || []).length - bonuses.length} more</span>`
      : "";
  const needsCl = durationUsesCasterLevel(effect);
  const condition = isConditionEffect(effect);
  return `
    <article class="quick-effect-card" role="button" tabindex="0" data-quick-effect-index="${index}">
      <span class="effect-type-icon" title="${escapeHtml(effect.category || "Effect")}"><i class="bi ${effectCategoryIcon(effect.category)}"></i></span>
      <div class="fw-semibold pe-4">${escapeHtml(effect.name || "Effect")}</div>
      <div class="small text-secondary mb-2">${escapeHtml(effect.category || "Effect")} | ${escapeHtml(durationLabel(effect))}</div>
      <div>${bonusHtml}${more}</div>
      <div class="quick-effect-controls">
        ${
          needsCl
            ? `
          <label class="small">CL
            <input id="${prefix}Cl${index}" class="form-control form-control-sm" data-quick-cl type="number" min="1" value="${defaultCl}">
          </label>
        `
            : ""
        }
        ${
          condition
            ? `
          <label class="small">Turns
            <input id="${prefix}Turns${index}" class="form-control form-control-sm" data-quick-turns type="number" min="1" value="1">
          </label>
        `
            : ""
        }
        <label class="form-check small mb-1">
          <input id="${prefix}Permanent${index}" class="form-check-input" data-quick-permanent type="checkbox">
          <span class="form-check-label">Permanent</span>
        </label>
      </div>
    </article>
  `;
}

function bindQuickEffectCards(container, effects) {
  container.querySelectorAll("[data-quick-effect-index]").forEach((card) => {
    const choose = () => {
      const effect = effects[Number(card.dataset.quickEffectIndex)];
      if (!effect) return;
      const casterLevel = Math.max(
        1,
        Number.parseInt(card.querySelector("[data-quick-cl]")?.value, 10) ||
          tokenLevel(tokenById(quickEffectSourceTokenId)),
      );
      const turns = Math.max(
        1,
        Number.parseInt(card.querySelector("[data-quick-turns]")?.value, 10) ||
          1,
      );
      const permanent = Boolean(
        card.querySelector("[data-quick-permanent]")?.checked,
      );
      if (quickEffectMode === "aura") {
        auraEffectDraft = appliedEffectFromQuickSelection(effect, {
          casterLevel,
          turns,
          permanent,
        });
        updateAuraEffectSummary();
        quickEffectModal.hide();
        auraModal.show();
        return;
      }
      openQuickEffectTargets(effect, { casterLevel, turns, permanent });
    };
    card.addEventListener("click", (event) => {
      if (event.target.closest(".quick-effect-controls")) return;
      choose();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target.closest(".quick-effect-controls")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      choose();
    });
  });
}

function renderQuickEffects() {
  const sourceToken = tokenById(quickEffectSourceTokenId);
  const defaultCl = tokenLevel(sourceToken);
  const term = el("quickEffectSearch").value.trim().toLowerCase();
  const matches = quickEffectDefinitions.filter(
    (effect) => !term || effectSearchText(effect).includes(term),
  );
  const counts = quickEffectUsageCounts();
  const mostUsed = quickEffectDefinitions
    .filter(
      (effect) => Number(counts[effect.id] || counts[effect.name] || 0) > 0,
    )
    .sort(
      (a, b) =>
        Number(counts[b.id] || counts[b.name] || 0) -
        Number(counts[a.id] || counts[a.name] || 0),
    )
    .slice(0, 7);

  el("quickEffectMostUsedWrap").classList.toggle("d-none", !mostUsed.length);
  el("quickEffectMostUsed").innerHTML = mostUsed
    .map((effect, index) =>
      effectCardHtml(effect, index, "quickMost", defaultCl),
    )
    .join("");
  el("quickEffectResults").innerHTML = matches.length
    ? matches
        .map((effect, index) =>
          effectCardHtml(effect, index, "quickAll", defaultCl),
        )
        .join("")
    : `<div class="small text-secondary">No matching effects found.</div>`;

  bindQuickEffectCards(el("quickEffectMostUsed"), mostUsed);
  bindQuickEffectCards(el("quickEffectResults"), matches);
}

// The source token's own class features (Rage, its bundled totems/rage
// powers, ...) come first, ahead of the general library -- both "Apply
// Effect" and Aura Options already know their caster unambiguously (the
// token the menu was opened from), so this is where Share Rage /
// Inspired Rage style sharing actually belongs, not a separate "cast
// as" picker.
async function sourceEffectDefinitions(sourceToken) {
  const sourceCharacter =
    sourceToken?.kind === "character" ? tokenCharacter(sourceToken) : null;
  const [library, abilities] = await Promise.all([
    PFApp.loadBuffDefinitions(),
    sourceCharacter
      ? characterActivatableAbilities(sourceCharacter)
      : Promise.resolve([]),
  ]);
  return [...abilities, ...library];
}

async function openQuickApplyEffect() {
  const token = tokenById(contextMenuTokenId);
  if (!token || !canManageEffects(token)) return;
  hideContextMenu();
  quickEffectMode = "apply";
  quickEffectSourceTokenId = token.id;
  el("quickEffectModalLabel").textContent =
    `Apply Effect from ${displayTokenName(token)}`;
  el("quickEffectSearch").value = "";
  el("quickEffectResults").innerHTML =
    `<div class="small text-secondary">Loading effects...</div>`;
  el("quickEffectMostUsedWrap").classList.add("d-none");
  quickEffectModal.show();
  setTimeout(() => el("quickEffectSearch").focus(), 150);
  quickEffectDefinitions = await sourceEffectDefinitions(token);
  renderQuickEffects();
}

async function openAuraEffectPicker() {
  const token = tokenById(auraEditingTokenId);
  if (!token || !canManageAura(token)) return;
  quickEffectMode = "aura";
  quickEffectSourceTokenId = token.id;
  el("quickEffectModalLabel").textContent =
    `Aura Effect for ${displayTokenName(token)}`;
  el("quickEffectSearch").value = "";
  el("quickEffectResults").innerHTML =
    `<div class="small text-secondary">Loading effects...</div>`;
  el("quickEffectMostUsedWrap").classList.add("d-none");
  auraModal.hide();
  quickEffectModal.show();
  setTimeout(() => el("quickEffectSearch").focus(), 150);
  quickEffectDefinitions = await sourceEffectDefinitions(token);
  renderQuickEffects();
}

function quickEffectTargets() {
  return state.tokens
    .filter((token) => token.kind === "character" || token.kind === "enemy")
    .filter((token) =>
      isGm
        ? true
        : token.kind === "character" ||
          (token.kind === "enemy" && token.visible !== false),
    )
    .map((token) => ({
      token,
      name: displayTokenName(token),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function openQuickEffectTargets(effect, options) {
  quickEffectSelection = {
    effect,
    options,
    sourceTokenId: quickEffectSourceTokenId,
  };
  const targets = quickEffectTargets();
  el("quickEffectTargetsModalLabel").textContent =
    `Apply ${effect.name || "Effect"}`;
  el("quickEffectTargetHint").textContent =
    "Choose one or more tokens on the current map.";
  el("quickEffectApplyStatus").textContent = "";
  el("quickEffectTargetList").innerHTML = targets.length
    ? targets
        .map(
          ({ token, name }) => `
      <label class="quick-target-card">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" data-quick-target-token="${escapeHtml(token.id)}" ${token.id === quickEffectSourceTokenId ? "checked" : ""}>
          <span class="form-check-label">
            <strong>${escapeHtml(name)}</strong>
            <span class="small text-secondary d-block">${escapeHtml(token.kind === "enemy" ? "Enemy" : "Character")}${token.visible === false ? " | hidden" : ""}</span>
          </span>
        </div>
      </label>
    `,
        )
        .join("")
    : `<div class="small text-secondary">No valid targets on the map.</div>`;
  quickEffectModal.hide();
  quickEffectTargetsModal.show();
}

function appliedEffectFromQuickSelection(effect, options) {
  const casterLevel = Math.max(1, Number(options?.casterLevel || 1) || 1);
  const turns = Math.max(1, Number(options?.turns || 1) || 1);
  const permanent = Boolean(options?.permanent);
  const condition = isConditionEffect(effect);
  // A class-feature ability's duration (e.g. Rage's "4 rounds + CON
  // modifier") needs the caster's full stat block, not just a typed-in
  // caster level -- same distinction buff-tracker-widget.js's addEffect
  // makes.
  const durationArg = effect.fromAbility
    ? effect.abilityContext || { casterLevel }
    : casterLevel;
  const baseDurationLabel = durationLabel(effect);
  const calculatedDuration = condition
    ? turns
    : parseEffectDuration(effect, durationArg);
  const appliedDurationLabel = permanent
    ? "Permanent"
    : condition
      ? `${turns} turn${turns === 1 ? "" : "s"}`
      : calculatedDuration === null
        ? baseDurationLabel
        : durationUsesCasterLevel(effect)
          ? `${baseDurationLabel} | CL ${casterLevel}: ${formatDurationRounds(calculatedDuration)}`
          : `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`;

  // fromAbility/abilityContext only exist to drive this pick -- strip
  // them so the saved active-effect entry matches the normal buff shape
  // instead of carrying the caster's whole stat block.
  const { fromAbility, abilityContext, ...persistedEffect } = effect;
  return {
    ...persistedEffect,
    casterLevel: fromAbility
      ? abilityContext?.characterLevel || casterLevel
      : casterLevel,
    turns: condition ? turns : undefined,
    permanent,
    remaining: permanent ? null : calculatedDuration,
    computedDuration: calculatedDuration,
    durationLabel: appliedDurationLabel,
  };
}

async function applyQuickEffectToToken(token, appliedEffect) {
  if (token.kind === "character") {
    const savedBuffs = await PFApp.applyCharacterMapEffect?.(
      token.characterId,
      appliedEffect,
      mapContextKey,
    );
    if (savedBuffs?.ok === false) {
      console.error(savedBuffs.error);
      return false;
    }
    const stamp = String(Date.now());
    localStorage.setItem(`pf_buffs_updated_${mapContextKey}`, stamp);
    localStorage.setItem(
      `pf_buffs_updated_${mapContextKey}_${token.characterId}`,
      stamp,
    );
    await recalculateCharacterSheetFromMap(token.characterId);
    const character = tokenCharacter(token);
    if (character) {
      const saved = await PFApp.loadCharacterSheet(
        "",
        mapContextKey,
        token.characterId,
      );
      if (saved?.sheet) character.sheet = saved.sheet;
      syncTokenFromSheet(token, character);
    }
    return true;
  }

  if (token.kind === "enemy") {
    const saved = await PFApp.applyEnemyMapEffect?.(
      token.enemyId,
      appliedEffect,
      mapContextKey,
    );
    if (!saved) return false;
    await recalculateEnemySheetFromMap(saved.id);
    const refreshed =
      (await PFApp.loadEnemyForEffectApplication?.(saved.id, mapContextKey)) ||
      (await PFApp.loadEnemy(saved.id, mapContextKey));
    const nextEnemy = refreshed || saved;
    token.sheet = structuredClone(nextEnemy.sheet || token.sheet || {});
    syncTokenFromSheet(token, nextEnemy);
    mapEnemies = mapEnemies.map((item) =>
      item.id === nextEnemy.id ? nextEnemy : item,
    );
    if (!mapEnemies.some((item) => item.id === nextEnemy.id))
      mapEnemies.push(nextEnemy);
    localStorage.setItem(
      `pf_enemy_sheet_updated_${mapContextKey}_${nextEnemy.id}`,
      String(Date.now()),
    );
    return true;
  }

  return false;
}

async function loadTokenActiveEffects(token) {
  if (token.kind === "character")
    return (
      (await PFApp.loadCharacterBuffStateForRecalculation?.(
        token.characterId,
        mapContextKey,
      )) ||
      (await PFApp.loadBuffState(mapContextKey, token.characterId)) ||
      []
    );
  if (token.kind === "enemy") {
    const enemy =
      (await PFApp.loadEnemyForEffectApplication?.(
        token.enemyId,
        mapContextKey,
      )) || (await PFApp.loadEnemy(token.enemyId, mapContextKey));
    return Array.isArray(enemy?.sheet?.activeBuffs)
      ? enemy.sheet.activeBuffs
      : [];
  }
  return [];
}

async function saveTokenActiveEffects(token, effects) {
  const activeEffects = Array.isArray(effects) ? effects : [];
  if (token.kind === "character") {
    const savedBuffs =
      (await PFApp.updateCharacterEffectState?.(
        token.characterId,
        activeEffects,
        mapContextKey,
      )) ||
      (await PFApp.saveBuffState(
        activeEffects,
        mapContextKey,
        token.characterId,
      ));
    if (savedBuffs?.ok === false) return false;
    await recalculateCharacterSheetFromMap(token.characterId);
    const character = tokenCharacter(token);
    if (character) {
      const saved = await PFApp.loadCharacterSheet(
        "",
        mapContextKey,
        token.characterId,
      );
      if (saved?.sheet) character.sheet = saved.sheet;
      syncTokenFromSheet(token, character);
    }
    return true;
  }
  if (token.kind === "enemy") {
    const calculated = token.sheet?.calculated || {};
    const saved = await PFApp.updateEnemyEffectSummary?.(
      token.enemyId,
      activeEffects,
      calculated,
      mapContextKey,
    );
    if (!saved) return false;
    token.sheet = structuredClone(saved.sheet || token.sheet || {});
    await recalculateEnemySheetFromMap(token.enemyId);
    return true;
  }
  return false;
}

async function removeOutOfRangeAuraEffects() {
  const managedTokens = state.tokens.filter(
    (token) =>
      (token.kind === "character" || token.kind === "enemy") &&
      canManageEffects(token),
  );
  let anyChanged = false;
  for (const token of managedTokens) {
    const active = await loadTokenActiveEffects(token);
    const next = [];
    let changed = false;
    for (const effect of active) {
      if (!effect.auraSourceId || !effect.auraTokenId) {
        next.push(effect);
        continue;
      }
      const auraToken = tokenById(effect.auraTokenId);
      const shouldRemove =
        auraToken?.aura?.removeWhenOutOfRange && !tokenInAura(token, auraToken);
      if (shouldRemove) changed = true;
      else next.push(effect);
    }
    if (changed) {
      await saveTokenActiveEffects(token, next);
      anyChanged = true;
    }
  }
  if (anyChanged) {
    await refetchMapSheetState();
    renderAll();
  }
}

// Resolves any "choice:" bonuses on an effect before it lands on a
// token -- locally, via a picker, if whoever's applying it already owns
// that character; otherwise by queuing a cross-device request (see
// modals/pending-effect-choices.js) so the choice lands with whoever
// actually controls the target, not whoever cast the effect.
// Returns { effect, queued }: effect is null if nothing should be
// applied right now (cancelled, or queued for later).
async function resolveEffectChoicesForToken(token, effect) {
  const bonuses = Array.isArray(effect.bonuses) ? effect.bonuses : [];
  if (
    !bonuses.some((bonus) => window.PFEffectStats?.isChoiceStat(bonus.stat))
  )
    return { effect, queued: false };

  const isOwn =
    token.kind === "enemy" ||
    tokenCharacter(token)?.userId === currentUserId;

  if (!isOwn) {
    if (token.kind !== "character" || !token.characterId)
      return { effect: null, queued: false };
    const result = await PFApp.createEffectChoiceRequest?.({
      contextKey: mapContextKey,
      characterId: token.characterId,
      ability: effect,
    });
    return { effect: null, queued: Boolean(result?.ok) };
  }

  const character = token.kind === "character" ? tokenCharacter(token) : null;
  const skills = character ? characterSkillOptions(character) : undefined;
  const resolved = [];
  for (const bonus of bonuses) {
    if (!window.PFEffectStats?.isChoiceStat(bonus.stat)) {
      resolved.push(bonus);
      continue;
    }
    const poolId = window.PFEffectStats.choicePoolIdFromStat(bonus.stat);
    const pool = window.PFEffectStats.poolById(poolId);
    const options = await window.PFEffectStats.resolveChoicePoolOptions(
      poolId,
      { skills },
    );
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${effect.name || "Effect"}${character ? ` (${character.name})` : ""}: Choose ${pool?.label || "a Target"}`,
          options,
        })
      : null;
    if (!picked) return { effect: null, queued: false };
    resolved.push({ ...bonus, stat: picked });
  }
  return { effect: { ...effect, bonuses: resolved }, queued: false };
}

async function applyAuraEffectToToken(tokenId, auraId) {
  const token = tokenById(tokenId);
  const auraToken = tokenById(auraId);
  const effect = auraToken?.aura?.effect;
  if (!token || !effect || !canManageEffects(token)) return;
  const active = await loadTokenActiveEffects(token);
  const sourceId = `${auraId}:${effect.id || effect.name || "effect"}`;
  const promptKey = auraPromptKey(tokenId, auraId);
  if (active.some((item) => item.auraSourceId === sourceId)) {
    auraEffectDismissed.add(promptKey);
    renderAuraEffectToasts();
    return;
  }
  const applied = {
    ...structuredClone(effect),
    auraSourceId: sourceId,
    auraTokenId: auraId,
    sourceTokenId: auraId,
    durationAnchorTokenId: auraId,
  };
  const { effect: resolvedEffect, queued } = await resolveEffectChoicesForToken(
    token,
    applied,
  );
  if (queued) {
    auraEffectDismissed.add(promptKey);
    renderAuraEffectToasts();
    return;
  }
  if (!resolvedEffect) return;
  if (await applyQuickEffectToToken(token, resolvedEffect)) {
    auraEffectDismissed.add(promptKey);
    await refetchMapSheetState();
    renderAll();
  }
}

async function currentActorName() {
  const profile = await PFApp.loadProfile(currentUserId);
  return profile?.username || profile?.email || currentUserEmail || "User";
}

async function confirmQuickEffectTargets() {
  if (!quickEffectSelection?.effect) return;
  const selectedTokenIds = [
    ...el("quickEffectTargetList").querySelectorAll(
      "[data-quick-target-token]:checked",
    ),
  ].map((input) => input.dataset.quickTargetToken);
  const targets = selectedTokenIds.map(tokenById).filter(Boolean);
  if (!targets.length) {
    el("quickEffectApplyStatus").textContent = "Select at least one target.";
    return;
  }

  el("confirmQuickEffectTargets").disabled = true;
  el("quickEffectApplyStatus").textContent = "Applying...";
  const appliedEffect = appliedEffectFromQuickSelection(
    quickEffectSelection.effect,
    quickEffectSelection.options,
  );
  const sourceTokenId =
    quickEffectSelection.sourceTokenId || quickEffectSourceTokenId || "";
  const appliedTargets = [];
  const queuedTargets = [];
  for (const token of targets) {
    const targetEffect = {
      ...structuredClone(appliedEffect),
      sourceTokenId: sourceTokenId || token.id,
      durationAnchorTokenId: sourceTokenId || token.id,
    };
    const { effect: resolvedEffect, queued } =
      await resolveEffectChoicesForToken(token, targetEffect);
    if (queued) {
      queuedTargets.push(tokenActualName(token));
      continue;
    }
    if (!resolvedEffect) continue;
    if (await applyQuickEffectToToken(token, resolvedEffect)) {
      appliedTargets.push(tokenActualName(token));
    }
  }

  el("confirmQuickEffectTargets").disabled = false;
  if (!appliedTargets.length && !queuedTargets.length) {
    el("quickEffectApplyStatus").textContent = "Could not apply effect.";
    return;
  }

  incrementQuickEffectUsage(quickEffectSelection.effect);
  const actor = await currentActorName();
  const effectName = quickEffectSelection.effect.name || "Effect";
  if (appliedTargets.length) {
    const targetsText = appliedTargets.join(", ");
    addTimeline(`${actor} applied ${effectName} on ${targetsText}.`, [
      { text: actor, emphasis: true },
      { text: " applied " },
      { text: effectName, emphasis: true },
      { text: " on " },
      { text: targetsText, emphasis: true },
      { text: "." },
    ]);
  }
  if (queuedTargets.length) {
    const targetsText = queuedTargets.join(", ");
    addTimeline(
      `${actor} sent ${effectName} to ${targetsText} to choose a target.`,
      [
        { text: actor, emphasis: true },
        { text: " sent " },
        { text: effectName, emphasis: true },
        { text: " to " },
        { text: targetsText, emphasis: true },
        { text: " to choose a target." },
      ],
    );
  }
  quickEffectTargetsModal.hide();
  quickEffectSelection = null;
  await refetchMapSheetState();
  renderAll();
}

function toggleContextEnemyVisibility() {
  const token = tokenById(contextMenuTokenId);
  if (!token || token.kind !== "enemy" || !isGm) return;
  token.visible = token.visible === false;
  hideContextMenu();
  renderAll();
}

function toggleContextTokenVisibility() {
  const token = tokenById(contextMenuTokenId);
  if (!token || !canManageMapItem(token)) return;
  token.hidden = token.hidden !== true;
  hideContextMenu();
  renderAll();
}

function showExpiredEffectNotice(token, effect) {
  const tokenName = tokenActualName(token);
  const effectName = effect.name || "an effect";
  state.effectNotices.push({
    id: uid("effect_notice"),
    tokenId: token.id,
    tokenName,
    effectName,
    createdAt: Date.now(),
  });
  state.effectNotices = state.effectNotices.slice(-10);
  addTimeline(`${tokenName} lost ${effectName}.`, [
    { text: tokenName, emphasis: true },
    { text: " lost " },
    { text: effectName, emphasis: true, className: "timeline-negative" },
    { text: "." },
  ]);
  renderTurnEffectNotices();
  renderTimeline();
  queueSave();
}

function renderTurnEffectNotices() {
  const container = el("turnEffectNotices");
  if (!container) return;
  const now = Date.now();
  state.effectNotices
    .filter(
      (notice) =>
        notice?.id &&
        !seenTurnEffectNotices.has(notice.id) &&
        now - Number(notice.createdAt || 0) < 10000,
    )
    .forEach((notice) => {
      seenTurnEffectNotices.add(notice.id);
      const token = tokenById(notice.tokenId);
      const name = token
        ? displayTokenName(token)
        : maskHiddenTokenNames(notice.tokenName || "Token");
      const node = document.createElement("div");
      node.className = "turn-effect-notice";
      node.textContent = `${name} lost ${notice.effectName || "an effect"}.`;
      container.appendChild(node);
      setTimeout(() => node.remove(), 2000);
    });
}

async function processEndedTurnEffectsLegacy(endingRow) {
  const endingTokenId = endingRow?.tokenId;
  if (!endingTokenId) return;
  let changed = false;
  const targets = state.tokens.filter(
    (token) => token.kind === "character" || token.kind === "enemy",
  );
  for (const token of targets) {
    const active = await loadTokenActiveEffects(token);
    if (!active.length) continue;
    const next = [];
    const expired = [];
    for (const effect of active) {
      const remaining = effect.remaining;
      const anchorTokenId =
        effect.durationAnchorTokenId || effect.sourceTokenId || token.id;
      if (
        effect.permanent ||
        remaining === null ||
        remaining === undefined ||
        anchorTokenId !== endingTokenId
      ) {
        next.push(effect);
        continue;
      }
      const nextRemaining = Number(remaining) - 1;
      if (nextRemaining <= 0) {
        expired.push(effect);
      } else {
        next.push({
          ...effect,
          remaining: nextRemaining,
          turns: isConditionEffect(effect) ? nextRemaining : effect.turns,
          durationLabel: formatDurationRounds(nextRemaining),
        });
      }
    }
    if (
      !expired.length &&
      next.length === active.length &&
      next.every((effect, index) => effect === active[index])
    )
      continue;
    if (await saveTokenActiveEffects(token, next)) {
      changed = true;
      expired.forEach((effect) => showExpiredEffectNotice(token, effect));
    }
  }
  if (changed) await refetchMapSheetState();
}

function tokenForEffectChange(change) {
  if (change?.target_token_id) return tokenById(change.target_token_id);
  if (change?.target_type === "character") {
    return state.tokens.find(
      (token) =>
        token.kind === "character" && token.characterId === change.target_id,
    );
  }
  if (change?.target_type === "enemy") {
    return state.tokens.find(
      (token) => token.kind === "enemy" && token.enemyId === change.target_id,
    );
  }
  return null;
}

async function refreshTurnEffectChanges(changes) {
  const unique = new Map();
  (Array.isArray(changes) ? changes : []).forEach((change) => {
    if (change?.target_type && change?.target_id)
      unique.set(`${change.target_type}:${change.target_id}`, change);
  });
  await Promise.all(
    [...unique.values()].map((change) => {
      if (change.target_type === "character")
        return recalculateCharacterSheetFromMap(change.target_id);
      if (change.target_type === "enemy")
        return recalculateEnemySheetFromMap(change.target_id);
      return Promise.resolve();
    }),
  );
  if (unique.size) {
    await refetchMapSheetState();
    renderAll(false);
  }
}

async function processEndedTurnEffects(endingRow, turnEventId) {
  if (!endingRow?.tokenId) return;
  const result = await PFApp.advanceMapEffectTurn?.(
    endingRow.tokenId,
    turnEventId,
    mapContextKey,
  );
  if (!result?.ok) {
    if (result?.unavailable || !PFApp.advanceMapEffectTurn) {
      await processEndedTurnEffectsLegacy(endingRow);
    } else {
      console.error("Could not advance effect durations.", result?.error);
    }
    return;
  }

  result.changes.forEach((change) => {
    const token = tokenForEffectChange(change);
    if (!token) return;
    (Array.isArray(change.expired_effects)
      ? change.expired_effects
      : []
    ).forEach((effect) => showExpiredEffectNotice(token, effect));
  });
  await refreshTurnEffectChanges(result.changes);
}

function toggleContextTokenNameVisibility() {
  const token = tokenById(contextMenuTokenId);
  if (!token || !isGm || !token.kind) return;
  token.hideName = !token.hideName;
  if (!token.hideName) restoreShownTokenNameInTimeline(token);
  hideContextMenu();
  renderAll();
}

function initiativeInsertIndex(score, ignoreId = "") {
  const value = Number(score || 0);
  let insertIndex = 0;
  state.initiative.forEach((entry, index) => {
    if (entry.id !== ignoreId && Number(entry.score || 0) >= value)
      insertIndex = index + 1;
  });
  return insertIndex;
}

function ensureTokenInitiative(token) {
  if (
    !initiativeTokenEligible(token) ||
    state.initiative.some((entry) => entry.tokenId === token.id)
  )
    return;
  const entry = {
    id: `init_${token.id}`,
    tokenId: token.id,
    name: tokenActualName(token),
    score: tokenInitiativeScore(token),
    disabled: false,
    custom: false,
  };
  placeInitiativeRow(entry);
}

function placeInitiativeRow(entry) {
  if (!entry) return;
  const activeId = state.initiative[state.activeTurn]?.id || "";
  const currentIndex = state.initiative.findIndex((row) => row.id === entry.id);
  if (currentIndex >= 0) state.initiative.splice(currentIndex, 1);
  const insertIndex = initiativeInsertIndex(entry.score, entry.id);
  state.initiative.splice(insertIndex, 0, entry);
  if (activeId)
    state.activeTurn = Math.max(
      0,
      state.initiative.findIndex((row) => row.id === activeId),
    );
}

function addInitiativeEntry(event) {
  event.preventDefault();
  const name = el("initiativeName").value.trim();
  if (!name) return;
  const entry = {
    id: uid("init"),
    name,
    score: Number(el("initiativeScore").value || 0),
    disabled: false,
    custom: true,
  };
  placeInitiativeRow(entry);
  el("initiativeName").value = "";
  el("initiativeScore").value = 0;
  state.activeTurn = clamp(
    state.activeTurn,
    0,
    Math.max(0, state.initiative.length - 1),
  );
  renderAll();
  el("initiativeName").focus();
}

function moveInitiativeRow(entryId, direction) {
  const index = state.initiative.findIndex((entry) => entry.id === entryId);
  if (index < 0) return;
  const nextIndex = clamp(index + direction, 0, state.initiative.length - 1);
  if (nextIndex === index) return;
  const activeId = state.initiative[state.activeTurn]?.id || "";
  const [entry] = state.initiative.splice(index, 1);
  state.initiative.splice(nextIndex, 0, entry);
  if (activeId)
    state.activeTurn = Math.max(
      0,
      state.initiative.findIndex((row) => row.id === activeId),
    );
  renderAll();
}

function toggleInitiativeRow(entryId) {
  const entry = state.initiative.find((row) => row.id === entryId);
  if (!entry) return;
  entry.disabled = !entry.disabled;
  el("initiativeNotice").textContent = "";
  renderAll();
}

function removeInitiativeRow(entryId) {
  const entry = state.initiative.find((row) => row.id === entryId);
  if (!entry?.custom) return;
  const activeId = state.initiative[state.activeTurn]?.id || "";
  state.initiative = state.initiative.filter((row) => row.id !== entryId);
  if (activeId) {
    state.activeTurn = Math.max(
      0,
      state.initiative.findIndex((row) => row.id === activeId),
    );
  }
  state.activeTurn = clamp(
    state.activeTurn,
    0,
    Math.max(0, state.initiative.length - 1),
  );
  renderAll();
}

async function nextTurn() {
  if (turnAdvanceBusy || !state.initiative.length) return;
  const enabled = state.initiative
    .map((entry, index) => ({ entry, index }))
    .filter((item) => !item.entry.disabled);
  if (!enabled.length) {
    el("initiativeNotice").textContent = "All initiative entries are disabled.";
    renderAll(false);
    return;
  }
  turnAdvanceBusy = true;
  el("nextTurn").disabled = true;
  el("initiativeNotice").textContent = "";
  try {
    const endingRow = state.initiative[state.activeTurn];
    const nextSequence = Math.max(0, Number(state.turnSequence || 0)) + 1;
    const turnEventId = `${nextSequence}:${endingRow?.id || "entry"}`;
    let nextIndex = state.activeTurn;
    for (let offset = 1; offset <= state.initiative.length; offset += 1) {
      const candidate = (state.activeTurn + offset) % state.initiative.length;
      if (!state.initiative[candidate].disabled) {
        nextIndex = candidate;
        break;
      }
    }
    state.turnSequence = nextSequence;
    if (nextIndex <= state.activeTurn)
      state.roundsPassed = Math.max(0, Number(state.roundsPassed || 0)) + 1;
    state.activeTurn = nextIndex;
    const row = state.initiative[state.activeTurn];
    if (row) {
      const token = row.tokenId ? tokenById(row.tokenId) : null;
      addTimeline(
        `${token ? tokenActualName(token) : row.name || "Entry"} begins their turn.`,
      );
    }
    renderAll();
    if (endingRow && !endingRow.disabled) {
      await processEndedTurnEffects(endingRow, turnEventId);
    }
  } catch (error) {
    console.error(error);
  } finally {
    turnAdvanceBusy = false;
    el("nextTurn").disabled = false;
  }
}

function timelineRowContent(row) {
  if (Array.isArray(row.parts)) {
    return row.parts
      .map((part) => {
        const text = maskHiddenTokenNames(part?.text || "");
        if (!part?.emphasis) return escapeHtml(text);
        const className = part.className || "timeline-emphasis";
        return `<span class="${escapeHtml(className)}">${escapeHtml(text)}</span>`;
      })
      .join("");
  }
  return escapeHtml(maskHiddenTokenNames(row.text));
}

function addTimeline(text, parts = null) {
  state.timeline.push({
    id: uid("event"),
    text,
    parts,
    time: new Date().toLocaleString(),
  });
  state.timeline = state.timeline.slice(-20);
}

function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

function signedNumberText(value) {
  const number = Number(value || 0);
  return number >= 0 ? `+${number}` : String(number);
}

function firstNumber(value, fallback = 0) {
  const match = String(value ?? "").match(/[+-]?\d+/);
  return match ? Number(match[0]) : fallback;
}

function mapRollToken() {
  const token = tokenById(contextMenuTokenId || rollTokenId);
  return token && canRollToken(token) ? token : null;
}

function rollTokenName(token) {
  return displayTokenName(token);
}

function rollTokenSheet(token) {
  if (token.kind === "enemy") return token.sheet || {};
  return tokenCharacter(token)?.sheet || {};
}

function attackNumbers(text) {
  return String(text || "")
    .split("/")
    .map((part) => firstNumber(part, null))
    .filter((value) => Number.isFinite(value));
}

function parseThreatStart(critical) {
  const text = String(critical || "").trim();
  const range = text.match(/(\d+)\s*-\s*20/);
  if (range) return clamp(Number(range[1]), 1, 20);
  const single = text.match(/\b(20)\b/);
  return single ? 20 : 20;
}

function parseMisfireMax(misfire) {
  const values =
    String(misfire || "")
      .match(/\d+/g)
      ?.map(Number) || [];
  return values.length ? Math.max(...values) : 0;
}

function rollWeaponsForToken(token) {
  const sheet = rollTokenSheet(token);
  const calculatedWeapons = sheet.calculated?.weapons || [];
  const rawWeapons = sheet.weapons || [];
  return (calculatedWeapons.length ? calculatedWeapons : rawWeapons)
    .map((weapon, index) => {
      const raw = rawWeapons[index] || {};
      const attackText = weapon.attack || raw.attack || "";
      const attacks = attackNumbers(attackText);
      return {
        index,
        name: weapon.name || raw.name || `Weapon ${index + 1}`,
        attacks,
        attackText,
        critical: weapon.critical || raw.critical || "20/x2",
        misfire: raw.misfire || weapon.misfire || "",
        weaponType: raw.weaponType || weapon.weaponType || "",
        raw,
      };
    })
    .filter((weapon) => weapon.attacks.length);
}

function selectedRollWeapon(token) {
  const weapons = rollWeaponsForToken(token);
  const index = Number(el("rollWeaponSelect")?.value || 0);
  return weapons[index] || weapons[0] || null;
}

function twfRollWeapons(token) {
  const weapons = rollWeaponsForToken(token);
  const primary = weapons.find((weapon) =>
    MAP_TWF_PRIMARY_FIELDS.some((field) =>
      mapWeaponOptionChecked(weapon.raw, field),
    ),
  );
  const offhands = weapons.filter((weapon) =>
    MAP_TWF_OFFHAND_FIELDS.some((field) =>
      mapWeaponOptionChecked(weapon.raw, field),
    ),
  );
  if (!primary || !offhands.length) return [];
  return [primary, ...offhands];
}

function rollTimeline(text, emphasized = []) {
  const parts = [];
  let remaining = text;
  const needles = emphasized.filter(Boolean).map((value) => {
    const textValue = String(value);
    const noteClass = rollNoteClass(textValue);
    return {
      text: textValue,
      className:
        noteClass === "roll-note-positive"
          ? "timeline-positive"
          : noteClass === "roll-note-negative"
            ? "timeline-negative"
            : "timeline-emphasis",
    };
  });
  while (remaining) {
    const next = needles
      .map((needle) => ({ ...needle, index: remaining.indexOf(needle.text) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index || b.text.length - a.text.length)[0];
    if (!next) break;
    if (next.index > 0) parts.push({ text: remaining.slice(0, next.index) });
    parts.push({ text: next.text, emphasis: true, className: next.className });
    remaining = remaining.slice(next.index + next.text.length);
  }
  if (remaining) parts.push({ text: remaining });
  addTimeline(text, parts.length ? parts : null);
}

function attackRollNotes(die, weapon) {
  const notes = [];
  if (die === 1) notes.push("critical failure");
  if (die >= parseThreatStart(weapon.critical)) notes.push("threat");
  const misfireMax = parseMisfireMax(weapon.misfire);
  const firearm =
    String(weapon.weaponType || "")
      .toLowerCase()
      .includes("firearm") || Boolean(weapon.misfire);
  if (firearm && misfireMax && die <= misfireMax) notes.push("misfire");
  return notes;
}

function rollNoteClass(note) {
  const key = String(note || "").toLowerCase();
  if (key === "threat" || key === "critical success")
    return "roll-note-positive";
  if (key === "critical failure" || key === "misfire")
    return "roll-note-negative";
  return "";
}

function rollRowClass(row) {
  const notes = row.notes || [];
  if (notes.some((note) => rollNoteClass(note) === "roll-note-negative"))
    return "roll-note-negative";
  if (notes.some((note) => rollNoteClass(note) === "roll-note-positive"))
    return "roll-note-positive";
  return "";
}

function rollNoteHtml(notes = []) {
  return notes
    .map((note) => {
      const className = rollNoteClass(note);
      return `<span class="${className}">${escapeHtml(note)}</span>`;
    })
    .join(notes.length > 1 ? ", " : "");
}

function showRollResultModal(title, rows) {
  clearInterval(rollAnimationTimer);
  el("rollResultModalLabel").textContent = title;
  el("rollResultList").innerHTML = rows
    .map(
      (row, index) => `
    <div class="roll-result-card" data-roll-result-row="${index}">
      <div class="roll-result-label">${escapeHtml(row.label || "Roll")}</div>
      <div class="roll-die-value" data-roll-die>${d20()}</div>
      <div class="roll-breakdown">
        <div class="roll-breakdown-row"><span>Bonus</span><strong data-roll-bonus>...</strong></div>
        <hr class="roll-total-divider">
        <div class="roll-breakdown-row roll-total-row"><span>Total</span><strong data-roll-total>...</strong></div>
      </div>
      <div class="roll-result-note" data-roll-note></div>
    </div>
  `,
    )
    .join("");
  rollResultModal?.show();

  const dieNodes = [
    ...el("rollResultList").querySelectorAll("[data-roll-die]"),
  ];
  rollAnimationTimer = setInterval(() => {
    dieNodes.forEach((node) => {
      node.textContent = d20();
    });
  }, 55);

  window.setTimeout(() => {
    clearInterval(rollAnimationTimer);
    rows.forEach((row, index) => {
      const card = el("rollResultList").querySelector(
        `[data-roll-result-row="${index}"]`,
      );
      if (!card) return;
      const dieNode = card.querySelector("[data-roll-die]");
      dieNode.textContent = row.die;
      dieNode.classList.remove("roll-note-positive", "roll-note-negative");
      const dieClass = rollRowClass(row);
      if (dieClass) dieNode.classList.add(dieClass);
      card.querySelector("[data-roll-bonus]").textContent = signedNumberText(
        row.bonus,
      );
      card.querySelector("[data-roll-total]").textContent = row.total;
      card.querySelector("[data-roll-note]").innerHTML = row.notes?.length
        ? rollNoteHtml(row.notes)
        : "";
    });
  }, 1000);
}

function makeAttackRollData(token, weapon, bonus, label = "Attack") {
  const die = d20();
  const total = die + Number(bonus || 0);
  const notes = attackRollNotes(die, weapon);
  const actor = rollTokenName(token);
  return {
    actor,
    label,
    target: weapon.name,
    die,
    bonus: Number(bonus || 0),
    total,
    notes,
  };
}

function recordAttackRoll(row) {
  const noteText = row.notes.length ? ` (${row.notes.join(", ")})` : "";
  const text = `${row.actor} rolled ${row.label} with ${row.target}: ${row.die} ${signedNumberText(row.bonus)} = ${row.total}${noteText}`;
  rollTimeline(text, [
    row.actor,
    row.label,
    row.target,
    String(row.total),
    ...row.notes,
  ]);
}

function rollAttack(full = false) {
  const token = mapRollToken();
  if (!token) return;
  lastRollAction = () => rollAttack(full);
  const weapon = selectedRollWeapon(token);
  if (!weapon) {
    el("rollModalStatus").textContent = "No weapon attack bonus found.";
    return;
  }
  const attackWeapons = full
    ? twfRollWeapons(token).length
      ? twfRollWeapons(token)
      : [weapon]
    : [weapon];
  const rows = attackWeapons.flatMap((attackWeapon) => {
    const bonuses = full
      ? attackWeapon.attacks
      : attackWeapon.attacks.slice(0, 1);
    return bonuses.map((bonus) =>
      makeAttackRollData(token, attackWeapon, bonus, "Attack"),
    );
  });
  if (full)
    rows.forEach((row, index) => {
      row.label = `Attack ${index + 1}`;
    });
  rows.forEach(recordAttackRoll);
  rollModal?.hide();
  showRollResultModal(
    `${rollTokenName(token)}: ${full ? "Full Attack" : "Attack"}`,
    rows,
  );
  renderAll();
}

function rollSaveOptions(token) {
  const sheet = rollTokenSheet(token);
  const rows = sheet.calculated?.saves || [];
  const byKey = Object.fromEntries(
    rows.map((row) => [String(row.key || row.label || "").toLowerCase(), row]),
  );
  return [
    {
      key: "fort",
      label: "Fortitude",
      bonus: firstNumber(
        byKey.fort?.total ??
          sheet.saves?.fort?.total ??
          sheet.saves?.fort?.base,
      ),
    },
    {
      key: "reflex",
      label: "Reflex",
      bonus: firstNumber(
        byKey.reflex?.total ??
          sheet.saves?.reflex?.total ??
          sheet.saves?.reflex?.base,
      ),
    },
    {
      key: "will",
      label: "Will",
      bonus: firstNumber(
        byKey.will?.total ??
          sheet.saves?.will?.total ??
          sheet.saves?.will?.base,
      ),
    },
  ];
}

function rollAbilityOptions(token) {
  const sheet = rollTokenSheet(token);
  const labels = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma",
  };
  const calculated = Object.fromEntries(
    (sheet.calculated?.abilities || []).map((row) => [row.key, row]),
  );
  return Object.entries(labels).map(([key, label]) => ({
    key,
    label,
    bonus: firstNumber(
      calculated[key]?.mod ??
        calculated[key]?.total?.match(/\(([+-]?\d+)\)/)?.[1] ??
        sheet.abilities?.[key]?.mod,
    ),
  }));
}

function mapSkillId(skill) {
  return String(skill || "").replace(/[^a-z0-9]/gi, "");
}

function mapSkillNameFromId(id) {
  const key = String(id || "").toLowerCase();
  const base = MAP_SKILLS.find(
    ([name]) => mapSkillId(name).toLowerCase() === key,
  );
  if (base) return base[0];
  return (
    String(id || "")
      .replace(/^skill/i, "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .trim() || String(id || "Skill")
  );
}

function mapSkillAbility(sheet, id, label) {
  const key = String(id || "").toLowerCase();
  const base = MAP_SKILLS.find(
    ([name]) =>
      mapSkillId(name).toLowerCase() === key ||
      name.toLowerCase() === String(label || "").toLowerCase(),
  );
  if (base) return base[1];
  const custom = (sheet.customSkills || []).find(
    (skill) =>
      mapSkillId(skill.name).toLowerCase() === key || skill.name === label,
  );
  return custom?.ability || "int";
}

function rollSkillOptions(token) {
  const sheet = rollTokenSheet(token);
  const calculated = sheet.calculated?.skills || [];
  if (calculated.length) {
    return calculated
      .map((row) => ({
        key: row.key || row.label,
        label: row.label || row.key,
        bonus: firstNumber(row.total),
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }
  return Object.entries(sheet.skills || {})
    .map(([key, value]) => {
      const label = mapSkillNameFromId(key);
      const ability = mapSkillAbility(sheet, key, label);
      const abilityBonus = sheetAbilityMod(sheet, ability);
      const total =
        value.total !== undefined && value.total !== ""
          ? firstNumber(value.total)
          : abilityBonus + Number(value.ranks || 0) + Number(value.misc || 0);
      return { key, label, bonus: total };
    })
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

function showRollDetail(kind) {
  const token = mapRollToken();
  if (!token) return;
  const optionSets = {
    save: {
      label: "Saving Throw",
      options: rollSaveOptions(token),
      crit: true,
    },
    skill: {
      label: "Skill Check",
      options: rollSkillOptions(token),
      crit: false,
    },
    ability: {
      label: "Attribute Check",
      options: rollAbilityOptions(token),
      crit: true,
    },
  };
  const config = optionSets[kind];
  if (!config) return;
  rollDetailKind = kind;
  el("rollDetailLabel").textContent = config.label;
  el("rollDetailSelect").innerHTML = config.options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)} (${signedNumberText(option.bonus)})</option>`,
    )
    .join("");
  el("rollDetailPanel").classList.remove("d-none");
  el("rollModalStatus").textContent = config.options.length
    ? ""
    : `No ${config.label.toLowerCase()} data found.`;
}

function confirmDetailRoll() {
  const token = mapRollToken();
  if (!token || !rollDetailKind) return;
  lastRollAction = () => confirmDetailRoll();
  const options =
    rollDetailKind === "save"
      ? rollSaveOptions(token)
      : rollDetailKind === "skill"
        ? rollSkillOptions(token)
        : rollAbilityOptions(token);
  const selected =
    options.find((option) => option.key === el("rollDetailSelect").value) ||
    options[0];
  if (!selected) return;
  const die = d20();
  const total = die + Number(selected.bonus || 0);
  const notes =
    rollDetailKind !== "skill" && die === 1
      ? ["critical failure"]
      : rollDetailKind !== "skill" && die === 20
        ? ["critical success"]
        : [];
  const noteText = notes.length ? ` (${notes.join(", ")})` : "";
  const actor = rollTokenName(token);
  const label =
    rollDetailKind === "save"
      ? "Saving Throw"
      : rollDetailKind === "skill"
        ? "Skill Check"
        : "Attribute Check";
  const text = `${actor} rolled ${label} (${selected.label}): ${die} ${signedNumberText(selected.bonus)} = ${total}${noteText}`;
  rollTimeline(text, [actor, label, selected.label, String(total), ...notes]);
  rollModal?.hide();
  showRollResultModal(`${actor}: ${label}`, [
    {
      label: selected.label,
      die,
      bonus: Number(selected.bonus || 0),
      total,
      notes,
    },
  ]);
  renderAll();
}

function openRollModal() {
  const token = mapRollToken();
  if (!token) return;
  hideContextMenu();
  rollTokenId = token.id;
  rollDetailKind = "";
  const weapons = rollWeaponsForToken(token);
  el("rollModalLabel").textContent = `Roll: ${rollTokenName(token)}`;
  el("rollWeaponWrap").classList.toggle("d-none", !weapons.length);
  el("rollWeaponSelect").innerHTML = weapons
    .map(
      (weapon, index) =>
        `<option value="${index}">${escapeHtml(weapon.name)} (${escapeHtml(weapon.attackText || weapon.attacks.map(signedNumberText).join("/"))})</option>`,
    )
    .join("");
  el("rollDetailPanel").classList.add("d-none");
  el("rollModalStatus").textContent = "";
  rollModal?.show();
}

async function refetchMapSheetState(delay = 0) {
  if (delay > 0) {
    window.setTimeout(() => refreshMapTokenSheets({ save: false }), delay);
    return;
  }
  await refreshMapTokenSheets({ save: false });
}

function waitForCharacterSheetBridge(frame, startedAt = Date.now()) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const bridge = frame.contentWindow?.PFCharacterSheetBridge;
      if (
        bridge?.recalculateAndSaveCharacter &&
        bridge?.recalculateAndSaveEnemy
      ) {
        resolve(bridge);
        return;
      }
      if (Date.now() - startedAt > 8000) {
        reject(new Error("Character sheet recalculation bridge did not load."));
        return;
      }
      window.setTimeout(check, 100);
    };
    check();
  });
}

async function characterSheetBridge() {
  if (characterSheetBridgePromise) return characterSheetBridgePromise;
  characterSheetBridgePromise = new Promise((resolve, reject) => {
    characterSheetBridgeFrame = document.createElement("iframe");
    characterSheetBridgeFrame.src = "character-sheet.html?bridge=1";
    characterSheetBridgeFrame.tabIndex = -1;
    characterSheetBridgeFrame.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;";
    characterSheetBridgeFrame.addEventListener(
      "load",
      () => {
        waitForCharacterSheetBridge(characterSheetBridgeFrame)
          .then(resolve)
          .catch(reject);
      },
      { once: true },
    );
    document.body.appendChild(characterSheetBridgeFrame);
  }).catch((error) => {
    characterSheetBridgePromise = null;
    throw error;
  });
  return characterSheetBridgePromise;
}

async function recalculateCharacterSheetFromMap(characterId) {
  try {
    const bridge = await characterSheetBridge();
    return await bridge.recalculateAndSaveCharacter(mapContextKey, characterId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function recalculateEnemySheetFromMap(enemyId) {
  try {
    const bridge = await characterSheetBridge();
    return await bridge.recalculateAndSaveEnemy(mapContextKey, enemyId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function updateAuraRadiusText() {
  const cells = Math.max(1, Number(el("auraRadiusCells").value || 1));
  el("auraRadiusText").textContent =
    `${cells} cell${cells === 1 ? "" : "s"} / ${cells * 5} ft`;
}

function updateAuraEffectSummary() {
  const hasEffect = Boolean(auraEffectDraft?.name);
  el("auraEffectSummary").textContent = hasEffect
    ? auraEffectDraft.name
    : "None";
  el("auraRemoveOutWrap").classList.toggle("d-none", !hasEffect);
}

const CIRCLE_MODE_FIELD = {
  aura: "aura",
  light: "light",
  limitedView: "limitedView",
};
const CIRCLE_MODE_LABEL = {
  aura: "Aura Options",
  light: "Apply Light",
  limitedView: "Apply Special Vision",
};
const CIRCLE_MODE_SAVE_LABEL = {
  aura: "Save Aura",
  light: "Save Light",
  limitedView: "Save Special Vision",
};

function openCircleOptions(mode) {
  const token = tokenById(contextMenuTokenId);
  if (!token || !canManageAura(token)) return;
  hideContextMenu();
  auraEditingTokenId = token.id;
  auraEditingMode = mode;
  const field = token[CIRCLE_MODE_FIELD[mode]] || {};
  auraEffectDraft =
    mode === "aura" && field.effect ? structuredClone(field.effect) : null;
  el("auraVisible").checked = Boolean(field.visible);
  el("auraRadiusCells").value = Math.max(1, Number(field.radius || 1));
  el("auraColor").value =
    field.color || (token.kind === "enemy" ? "#b02a37" : "#8fd19e");
  el("auraRemoveOutOfRange").checked = Boolean(field.removeWhenOutOfRange);
  el("auraOptionsModalTitle").textContent = CIRCLE_MODE_LABEL[mode];
  el("auraVisibleLabel").textContent = mode === "aura" ? "Visible" : "Active";
  el("auraColorField").classList.toggle("d-none", mode !== "aura");
  el("auraEffectSection").classList.toggle("d-none", mode !== "aura");
  el("auraSaveButton").textContent = CIRCLE_MODE_SAVE_LABEL[mode];
  updateAuraRadiusText();
  updateAuraEffectSummary();
  auraModal.show();
}

function openAuraOptions() {
  openCircleOptions("aura");
}
function openLightOptions() {
  openCircleOptions("light");
}
function openLimitedViewOptions() {
  openCircleOptions("limitedView");
}

function saveAuraOptions(event) {
  event.preventDefault();
  const token = tokenById(auraEditingTokenId);
  if (!token || !canManageAura(token)) return;
  const mode = auraEditingMode;
  const payload = {
    visible: el("auraVisible").checked,
    radius: Math.max(1, Number(el("auraRadiusCells").value || 1)),
  };
  if (mode === "aura") {
    payload.color = el("auraColor").value || "#8fd19e";
    payload.effect = auraEffectDraft ? structuredClone(auraEffectDraft) : null;
    payload.removeWhenOutOfRange = Boolean(
      auraEffectDraft && el("auraRemoveOutOfRange").checked,
    );
  }
  token[CIRCLE_MODE_FIELD[mode]] = payload;
  auraModal.hide();
  auraEditingTokenId = "";
  auraEditingMode = "aura";
  auraEffectDraft = null;
  renderAll();
}

function openBackgroundOptions() {
  pendingBackgroundFootprint = null;
  applySettingsToInputs();
  backgroundModal.show();
}

function renderMapDocumentation(selectedId = MAP_CONTEXT_DOCUMENTATION[0]?.id) {
  const selected =
    MAP_CONTEXT_DOCUMENTATION.find((entry) => entry.id === selectedId) ||
    MAP_CONTEXT_DOCUMENTATION[0];
  if (!selected) return;
  let currentGroup = "";
  el("mapDocsList").innerHTML = MAP_CONTEXT_DOCUMENTATION.map((entry) => {
    const group = entry.group || "General";
    const groupHeading =
      group !== currentGroup
        ? `<div class="map-docs-group">${escapeHtml(group)}</div>`
        : "";
    currentGroup = group;
    return `${groupHeading}
      <button class="map-docs-list-button${entry.id === selected.id ? " active" : ""}" type="button" data-map-doc="${escapeHtml(entry.id)}">
        <i class="bi ${escapeHtml(entry.icon)}"></i>
        <span>${escapeHtml(entry.title)}</span>
      </button>`;
  }).join("");
  el("mapDocsContent").innerHTML = `
    <h3><i class="bi ${escapeHtml(selected.icon)} me-2 text-success"></i>${escapeHtml(selected.title)}</h3>
    <p>${escapeHtml(selected.summary)}</p>
    <h4>How To Use It</h4>
    <ul class="ps-3 mb-0">
      ${selected.usage.map((item) => `<li class="mb-2">${escapeHtml(item)}</li>`).join("")}
    </ul>
    <h4>Access</h4>
    <p class="mb-0">${escapeHtml(selected.access)}</p>
  `;
  el("mapDocsList")
    .querySelectorAll("[data-map-doc]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        renderMapDocumentation(button.dataset.mapDoc);
        el("mapDocsLayout").classList.add("detail-open");
        el("mapDocsDetail").scrollTop = 0;
      });
    });
}

function openMapDocumentation() {
  renderMapDocumentation();
  el("mapDocsLayout").classList.remove("detail-open");
  backgroundModal.hide();
  window.setTimeout(() => mapDocumentationModal.show(), 160);
}

async function saveBackgroundOptions(event) {
  event.preventDefault();
  localGridSize = clamp(Number(el("gridSize").value || 48), 24, 96);
  sessionStorage.setItem("pf_map_grid_size", String(localGridSize));

  const newBackgroundUrl = el("backgroundUrl").value.trim();
  let footprint = { cols: 0, rows: 0 };
  if (newBackgroundUrl) {
    if (pendingBackgroundFootprint?.url === newBackgroundUrl) {
      footprint = pendingBackgroundFootprint;
    } else if (newBackgroundUrl === state.settings.backgroundUrl) {
      // URL wasn't touched this time around -- keep the footprint already
      // stored for it.
      footprint = {
        cols: state.settings.backgroundCols || 0,
        rows: state.settings.backgroundRows || 0,
      };
    } else {
      // Save was clicked before the field's change/blur handler ran
      // (e.g. paste-then-immediately-submit) -- measure it now.
      const size = await measureImageNaturalSize(newBackgroundUrl);
      if (size) footprint = backgroundFootprintFromNaturalSize(size.width, size.height);
    }
  }

  state.settings.backgroundUrl = newBackgroundUrl;
  state.settings.backgroundCols = newBackgroundUrl ? footprint.cols || 0 : 0;
  state.settings.backgroundRows = newBackgroundUrl ? footprint.rows || 0 : 0;

  state.settings.cols = clamp(
    Number(el("cellX").value) || MAP_SIZE_MIN,
    MAP_SIZE_MIN,
    MAP_SIZE_MAX,
  );
  state.settings.rows = clamp(
    Number(el("cellY").value) || MAP_SIZE_MIN,
    MAP_SIZE_MIN,
    MAP_SIZE_MAX,
  );

  if (isGm) {
    state.settings.name = el("mapName").value.trim();
    const meta = mapSlotMeta.find((entry) => entry.slot === mapViewSlot);
    if (meta) meta.name = state.settings.name;
    else mapSlotMeta.push({ slot: mapViewSlot, name: state.settings.name });
  }
  applySettingsToInputs();
  renderMapSlotNav();
  backgroundModal.hide();
  renderAll();
}

// Which map slot a user is looking at is a purely local, per-browser
// choice -- different people can be on different maps at once, so it is
// never synced or broadcast to anyone else.
function mapSlotStorageKey(contextKey) {
  return `pf_map_slot_${contextKey}`;
}

function loadRememberedMapSlot(contextKey) {
  const stored = Number(localStorage.getItem(mapSlotStorageKey(contextKey)));
  return clamp(stored || 1, 1, MAP_SLOT_COUNT);
}

function rememberMapSlot(contextKey, slot) {
  localStorage.setItem(mapSlotStorageKey(contextKey), String(slot));
}

async function loadMap(contextKey) {
  if (!contextKey || contextKey === "general") return;
  unsubscribeMapRealtime();
  mapContextKey = contextKey;
  mapCharacters = await PFApp.loadContextCharacters(mapContextKey);
  await hydrateMapCharacterSheets();
  startPendingEffectChoicePolling();
  isGm = await determineGm(mapContextKey);
  el("addEnemyToken").classList.toggle("d-none", !isGm);
  el("gmHint").textContent = isGm ? "GM tools enabled" : "Player view";
  if (isGm) mapEnemies = await PFApp.loadEnemies(mapContextKey);
  mapSlotMeta = await PFApp.loadMapSlotSummaries(mapContextKey);
  await loadMapSlot(loadRememberedMapSlot(mapContextKey));
}

// Same idea as character-sheet.js's poller: whoever's viewing the map
// gets prompted for any of THEIR OWN characters' pending choice
// requests (e.g. the GM cast something at them from a token), covering
// however many characters they control the same way -- every one of
// mapCharacters they own is in scope, not just whichever token is
// currently selected.
function startPendingEffectChoicePolling() {
  if (!window.PFPendingEffectChoices) return;
  window.PFPendingEffectChoices.start({
    contextKey: mapContextKey,
    characterIds: () =>
      mapCharacters
        .filter((character) => character.userId === currentUserId)
        .map((character) => character.id),
    characterNameFor: (id) =>
      mapCharacters.find((character) => character.id === id)?.name || "",
    choicePoolSkillsFor: (id) => {
      const character = mapCharacters.find((item) => item.id === id);
      return character ? characterSkillOptions(character) : undefined;
    },
    onResolved: async () => {
      await hydrateMapCharacterSheets();
      renderAll(false);
    },
  });
}

// Loads one of the 6 map slots into the current view. Every user picks
// their own slot independently -- this never affects what anyone else sees.
async function loadMapSlot(slot) {
  unsubscribeMapRealtime();
  mapViewSlot = clamp(Number(slot) || 1, 1, MAP_SLOT_COUNT);
  state = normalizeState(await PFApp.loadMapState(mapContextKey, mapViewSlot));
  await refreshMapTokenSheets({ save: false });
  applySettingsToInputs();
  renderMapSlotNav();
  selectedId = "";
  renderAll(false);
  subscribeMapRealtime();
}

async function switchMapSlot(slot) {
  const nextSlot = clamp(Number(slot) || 1, 1, MAP_SLOT_COUNT);
  if (nextSlot === mapViewSlot) return;
  rememberMapSlot(mapContextKey, nextSlot);
  await loadMapSlot(nextSlot);
}

function subscribeMapRealtime() {
  if (!PFApp.client || !mapContextKey) return;
  const subscribedSlot = mapViewSlot;
  mapRealtimeChannel = PFApp.client
    .channel(`map_state:${mapContextKey}:${subscribedSlot}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "map_state",
        filter: `context_key=eq.${mapContextKey}`,
      },
      (payload) => {
        const row = payload.new;
        if (!row?.state) return;
        if (Number(row.map_slot || 1) !== subscribedSlot) return;
        applyRemoteMapState(row.state);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "character_sheets",
        filter: `context_key=eq.${mapContextKey}`,
      },
      () => refreshMapTokenSheets({ save: false }),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "enemies",
        filter: `context_key=eq.${mapContextKey}`,
      },
      () => refreshMapTokenSheets({ save: false }),
    )
    .subscribe();
}

function unsubscribeMapRealtime() {
  if (mapRealtimeChannel && PFApp.client) {
    PFApp.client.removeChannel(mapRealtimeChannel);
  }
  mapRealtimeChannel = null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await PFApp.requireAuth();
  if (!user) return;
  currentUserId = user.id;
  currentUserEmail = user.email || "";

  setupMobileToolbar();
  bindNumberSteppers();

  el("mapSlotNav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-map-slot]");
    if (!button) return;
    switchMapSlot(button.dataset.mapSlot);
  });

  el("gridSize").addEventListener("change", () => {
    localGridSize = clamp(Number(el("gridSize").value || 48), 24, 96);
    sessionStorage.setItem("pf_map_grid_size", String(localGridSize));
    applySettingsToInputs();
    renderAll(false);
  });

  ["cellX", "cellY"].forEach((id) => {
    el(id).addEventListener("change", () => handleCellSizeChange(id));
  });
  setCellLinkEnabled(cellRatioLinked);
  el("cellLinkToggle").addEventListener("click", () => {
    setCellLinkEnabled(!cellRatioLinked);
  });

  el("backgroundUrl").addEventListener("change", handleBackgroundUrlChange);

  window.addEventListener("focus", () => {
    if (mapContextKey) refreshMapTokenSheets({ save: false });
  });
  window.addEventListener("storage", (event) => {
    if (!mapContextKey) return;
    if (
      event.key?.startsWith(`pf_character_sheet_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_enemy_sheet_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_buffs_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_map_sheet_hp_updated_${mapContextKey}_`)
    ) {
      refreshMapTokenSheets({ save: false });
    }
  });

  el("openBackgroundOptions").addEventListener("click", openBackgroundOptions);
  backgroundModal = new bootstrap.Modal(el("backgroundOptionsModal"));
  mapDocumentationModal = new bootstrap.Modal(el("mapDocumentationModal"));
  el("openMapDocumentation").addEventListener("click", openMapDocumentation);
  el("mapDocsBack").addEventListener("click", () => {
    el("mapDocsLayout").classList.remove("detail-open");
  });
  el("mapDocumentationModal").addEventListener("hidden.bs.modal", () => {
    el("mapDocsLayout").classList.remove("detail-open");
  });
  el("backgroundOptionsForm").addEventListener("submit", saveBackgroundOptions);
  enemyPickerModal = new bootstrap.Modal(el("enemyPickerModal"));
  characterPickerModal = new bootstrap.Modal(el("characterPickerModal"));
  genericTokenModal = new bootstrap.Modal(el("genericTokenModal"));
  el("genericTokenForm").addEventListener("submit", submitGenericToken);
  mapEffectsModal = new bootstrap.Modal(el("mapEffectsModal"));
  map3DPreviewModal = new bootstrap.Modal(el("map3DPreviewModal"));
  el("open3DPreview").addEventListener("click", () => {
    map3DPreviewModal.show();
    render3DPreview();
  });
  el("map3DAngle").addEventListener("input", (event) => {
    el("map3DScene").style.setProperty(
      "--map-3d-angle",
      `${event.target.value}deg`,
    );
  });
  el("enterHeightEditMode").addEventListener("click", () =>
    toggleHeightEditMode(true),
  );
  el("exitHeightEditMode").addEventListener("click", () =>
    toggleHeightEditMode(false),
  );
  el("addHeightShapeBtn").addEventListener("click", addHeightShape);
  // A remote map update that arrived while a field in the selected-item
  // panel was focused gets held (see applyRemoteMapState()) instead of
  // rebuilding the panel's DOM out from under the user's cursor. Once
  // they click/tab away, apply whatever was waiting. #selectedPanel
  // itself persists across renders (only its innerHTML is swapped), so
  // this only needs binding once, not per-render.
  el("selectedPanel").addEventListener("focusout", () => {
    setTimeout(() => {
      if (!isEditingSelectedPanelField()) flushPendingRemoteState();
    }, 0);
  });
  // Backup for the focusout listener above -- focus/blur events aren't
  // guaranteed to fire in every environment this runs in (e.g. some
  // WebView/embedded contexts), so a held remote update shouldn't be
  // able to wait forever if that listener is ever missed.
  setInterval(() => {
    if (pendingRemoteState && !isEditingSelectedPanelField())
      flushPendingRemoteState();
  }, 3000);
  quickEffectModal = new bootstrap.Modal(el("quickEffectModal"));
  quickEffectTargetsModal = new bootstrap.Modal(el("quickEffectTargetsModal"));
  rollModal = new bootstrap.Modal(el("rollModal"));
  rollResultModal = new bootstrap.Modal(el("rollResultModal"));
  el("rollResultModal").addEventListener("hidden.bs.modal", () =>
    clearInterval(rollAnimationTimer),
  );
  el("rerollResult").addEventListener("click", () => lastRollAction?.());
  el("enemyPickerSearch").addEventListener("input", renderEnemyPicker);
  el("characterPickerSearch").addEventListener("input", renderCharacterPicker);
  el("quickEffectSearch").addEventListener("input", renderQuickEffects);
  el("addCharacterToken").addEventListener("click", () =>
    addToken("character"),
  );
  el("addEnemyToken").addEventListener("click", () => addToken("enemy"));
  el("addGenericToken").addEventListener("click", () => addToken("token"));
  el("addRectShape").addEventListener("click", () => addShape("rect"));
  el("addCircleShape").addEventListener("click", () => addShape("circle"));
  el("toggleEmitMenu").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const menu = el("emitMenu");
    const isHidden = menu.classList.toggle("d-none");
    el("toggleEmitMenu").setAttribute("aria-expanded", String(!isHidden));
  });
  el("openAuraOptions").addEventListener("click", openAuraOptions);
  el("openLightOptions").addEventListener("click", openLightOptions);
  el("openLimitedViewOptions").addEventListener(
    "click",
    openLimitedViewOptions,
  );
  el("applyFogButton").addEventListener("click", toggleFog);
  el("fogColor").addEventListener("input", () => {
    if (!isGm || !state.fog?.visible) return;
    state.fog.color = el("fogColor").value;
    renderMap();
    queueSave();
  });
  el("openApplyEffect").addEventListener("click", openQuickApplyEffect);
  el("openRollMenu").addEventListener("click", openRollModal);
  el("rollModal")
    .querySelectorAll("[data-roll-action]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        rollAttack(button.dataset.rollAction === "fullAttack"),
      );
    });
  el("rollModal")
    .querySelectorAll("[data-roll-panel]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        showRollDetail(button.dataset.rollPanel),
      );
    });
  el("confirmRollDetail").addEventListener("click", confirmDetailRoll);
  el("chooseAuraEffect").addEventListener("click", openAuraEffectPicker);
  el("clearAuraEffect").addEventListener("click", () => {
    auraEffectDraft = null;
    updateAuraEffectSummary();
  });
  el("toggleEnemyVisibility").addEventListener(
    "click",
    toggleContextEnemyVisibility,
  );
  el("toggleTokenVisibility").addEventListener(
    "click",
    toggleContextTokenVisibility,
  );
  el("toggleTokenNameVisibility").addEventListener(
    "click",
    toggleContextTokenNameVisibility,
  );
  el("toggleZIndexMenu").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const menu = el("zIndexMenu");
    const isHidden = menu.classList.toggle("d-none");
    el("toggleZIndexMenu").setAttribute("aria-expanded", String(!isHidden));
  });
  el("zIndexMenu")
    .querySelectorAll("[data-z-action]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        moveContextItemZ(button.dataset.zAction),
      );
    });
  el("removeTokenFromMap").addEventListener("click", removeContextMenuToken);
  el("confirmQuickEffectTargets").addEventListener(
    "click",
    confirmQuickEffectTargets,
  );
  auraModal = new bootstrap.Modal(el("auraOptionsModal"));
  el("auraRadiusCells").addEventListener("input", updateAuraRadiusText);
  el("auraOptionsForm").addEventListener("submit", saveAuraOptions);
  el("initiativeForm").addEventListener("submit", addInitiativeEntry);
  el("nextTurn").addEventListener("click", nextTurn);
  el("resetRounds").addEventListener("click", () => {
    state.roundsPassed = 1;
    renderAll();
  });
  el("timelineForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = el("timelineText").value.trim();
    if (!text) return;
    addTimeline(text);
    el("timelineText").value = "";
    renderAll();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#mapContextMenu")) hideContextMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideContextMenu();
  });
  window.addEventListener("resize", () => {
    hideContextMenu();
    updateAuraToastPosition();
  });
  window.addEventListener(
    "scroll",
    () => {
      hideContextMenu();
      updateAuraToastPosition();
    },
    true,
  );

  const requiredContext = await PFApp.requireGameContext();
  if (!requiredContext) return;
  await loadMap(requiredContext);
  window.addEventListener("pf-context-change", (event) => {
    if (event.detail.contextKey && event.detail.contextKey !== "general")
      loadMap(event.detail.contextKey);
  });
});
