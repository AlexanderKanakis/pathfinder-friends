// Height Layer (experimental) -- see toggleHeightEditMode()/
// state.heightShapes. Editing (painting regions) is 2D-only; the
// terrain it produces shows up in both the normal 2D view and the 3D
// View toggle below.
let heightEditMode = false;
// "Draw Height Region" paint tool -- see toggleHeightDrawMode().
let heightDrawMode = false;
let paintState = null;
let heightEditingShapeId = "";
// 3D View (experimental) -- tilts the live #mapStage in place, see
// toggleView3DMode(). Independent of heightEditMode: this is a view
// of the normal token/shape map, not a Height Layer editing mode.
let view3DMode = false;
let hovered3DTokenId = "";

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
let mapSaveInFlight = 0;
let mapSaveChain = Promise.resolve();
let lastAppliedMapMeta = null;
let localMapRevision = 0;
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
let pathRuler = null;
let transferTargetTokenId = "";
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
let quickConditionModal = null;
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
let authoredCatalogEffectsPromise = null;
let mapSheetRefreshTimer = null;
let auraCleanupTimer = null;
let pendingAuraCleanupTokenIds = new Set();
let currentActorNamePromise = null;
let mapEffectSourceCache = new Map();
let mapEffectPrefetchGeneration = 0;
let quickEffectDefinitions = [];
let quickEffectLoading = false;
let quickEffectSourceTokenId = "";
let quickEffectSelection = null;
let quickConditionEffect = null;
let quickConditionReturnToPicker = false;
let quickEffectMode = "apply";
let quickEffectGroup = "personal";
const quickSpellMobilePanels = {};
let auraEffectDraft = null;
let auraEffectDismissed = new Set();
let auraEffectInside = new Set();
let turnAdvanceBusy = false;
let seenTurnEffectNotices = new Set();
let dpadJoystickState = null;
let mapToastTimer = null;
let shapeFogRenderContext = null;
let appliedMapBackgroundUrl = null;
let current3DRenderTokens = [];
let tokenBillboardFrame = 0;
const shapeMaskCache = new WeakMap();
let sortedHeightShapesCache = { signature: "", blocks: [] };
let heightCellGridCache = { signature: "", cols: 0, rows: 0, grid: null };

const MAP_SLOT_COUNT = 6;
const MAP_CLIENT_ID_KEY = "pf_map_client_id";
const MAP_CLIENT_ID =
  sessionStorage.getItem(MAP_CLIENT_ID_KEY) ||
  (() => {
    const id = uid("map_client");
    sessionStorage.setItem(MAP_CLIENT_ID_KEY, id);
    return id;
  })();
// Pixels-per-cell assumed when converting a newly loaded background image's
// natural size into a cell count. Fixed and independent of anyone's local
// zoom ("Map Size") so the resulting grid is identical for every viewer.
const MAP_IMAGE_REFERENCE_CELL_PX = 48;
const MAP_SIZE_MIN = 8;
const MAP_SIZE_MAX = 300;
const MAP_GRID_LINES_CSS = [
  "linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px)",
  "linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
].join(", ");
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
  // negative for a pit/depression. See render3DTerrainHtml().
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
      "For enemies specifically, Full Attack is Melee or Ranged, not a chosen weapon -- every equipped weapon in that category contributes its own full sequence. See the Roll doc.",
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
      "For enemies, Full Attack has no single-weapon option -- it's Full Attack (Melee) or Full Attack (Ranged), each rolling every equipped weapon in that category's own full sequence together. A category button is hidden if the enemy has nothing equipped in it. Attack still targets one chosen weapon regardless.",
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

// On mobile the map fills the screen and everything else (element
// buttons, height layer, background settings, ...) lives in the
// #mapMobileMenuModal instead -- but Zoom/Camera angle/Rotate stay out
// of that modal, as a small always-visible floating bar bottom-center,
// since they're the one thing worth adjusting without leaving the map
// view. Both groups keep their real ids/listeners; this only ever
// moves them, via the same anchor-element trick relocateMapSide() uses
// below, never clones them.
function relocateMapSliders(isMobile) {
  const zoomGroup = el("mapZoomControlsGroup");
  const threeDGroup = el("map3DControls");
  const mobileContainer = el("mapMobileSliders");
  const zoomAnchor = el("zoomControlsAnchor");
  const threeDAnchor = el("threeDControlsAnchor");
  if (!zoomGroup || !threeDGroup || !mobileContainer || !zoomAnchor || !threeDAnchor)
    return;
  if (isMobile) {
    mobileContainer.appendChild(zoomGroup);
    mobileContainer.appendChild(threeDGroup);
  } else {
    zoomAnchor.parentElement.insertBefore(zoomGroup, zoomAnchor);
    threeDAnchor.parentElement.insertBefore(threeDGroup, threeDAnchor);
  }
}

// The whole #mapSide <aside> (Character/Initiative/Timeline/Map tabs)
// moves into the "Map Menu" modal on mobile instead of sitting beside
// (desktop) or below (old mobile layout) the map -- see the modal's
// own comment in map.html. #mapSideAnchor marks its original spot in
// the flow so switching back to desktop restores it exactly, the same
// pattern relocateMapSliders() above uses.
function relocateMapSide(isMobile) {
  const side = el("mapSide");
  const modalBody = el("mapMobileMenuModalBody");
  const anchor = el("mapSideAnchor");
  if (!side || !modalBody || !anchor) return;
  if (isMobile) {
    modalBody.appendChild(side);
  } else {
    anchor.parentElement.insertBefore(side, anchor);
  }
}

// #appNavbar's real height changes when the compact navigation opens, so
// "100dvh minus a fixed guess" would
// leave either a gap or an overflow depending on how it's currently
// wrapped. Measuring it for real and exposing it as a CSS var is what
// lets .map-shell's mobile height (see css/map.css) actually fill the
// rest of the screen under the navbar, whatever shape it's in.
function updateMobileNavbarHeightVar() {
  const navbar = el("appNavbar");
  if (!navbar) return;
  document.documentElement.style.setProperty(
    "--map-navbar-height",
    `${navbar.getBoundingClientRect().height}px`,
  );
}

function setupMobileLayout() {
  const applyLayout = (isMobile) => {
    relocateMapToolbar(isMobile);
    relocateMapSliders(isMobile);
    relocateMapSide(isMobile);
    updateMobileNavbarHeightVar();
  };
  applyLayout(mapMobileQuery.matches);
  mapMobileQuery.addEventListener("change", (event) => {
    applyLayout(event.matches);
    renderMobileHud();
  });
  window.addEventListener("resize", updateMobileNavbarHeightVar);
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
      perLevel:
        config.factors.some((factor) => factor.type === "caster") ||
        config.durationScale?.source?.type === "caster",
      config,
    };
  }
  return legacyDurationParts(effect?.duration);
}
function durationUsesCasterLevel(effect) {
  const config = durationParts(effect).config;
  return config
    ? config.factors.some((factor) => factor.type === "caster") ||
      config.durationScale?.source?.type === "caster"
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
      .trim() === "cannot gain morale bonuses"
  )
    return "Cannot Gain Morale Bonuses";
  if (
    String(value || "")
      .toLowerCase()
      .trim() === "cannot gain luck bonuses"
  )
    return "Cannot Gain Luck Bonuses";
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
  const multiplier = scale.levelMultiplier;
  if (multiplier && Number(multiplier.denominator) > 0) {
    const numerator = Number(multiplier.numerator || 0);
    const denominator = Number(multiplier.denominator || 1);
    parts.push(
      `${denominator === 1 ? `${numerator}x` : `${numerator}/${denominator}`} ${sourceLabel} (round down)`,
    );
  }
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
  const fromLevel = every.fromLevel || every.afterLevel || every.after;
  if (fromLevel && every.everyLevels && every.increase) {
    parts.push(
      `from ${sourceLabel} ${fromLevel}, every ${every.everyLevels}: ${fmtSigned(Number(every.increase || 0))}`,
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
  if (
    String(bonus.stat || "")
      .toLowerCase()
      .trim() === "cannot gain morale bonuses"
  ) {
    const text = "Cannot gain morale bonuses";
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }
  if (
    String(bonus.stat || "")
      .toLowerCase()
      .trim() === "cannot gain luck bonuses"
  ) {
    const text = "Cannot gain luck bonuses";
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }
  const scale = scaleText(bonus.bonusScale || bonus.scale);
  const requirement = window.PFEffectEditor?.attributeRequirementText?.(bonus);
  const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
  const text = `${fmtSigned(bonus.value || 0)} ${bonus.type || "untyped"} ${statLabel}${scale ? `; ${scale}` : ""}${requirement ? `; ${requirement}` : ""}`;
  return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
}
function spellLikeText(entry = {}) {
  const spellName = entry.spellName || entry.spell?.name || "Spell";
  const minimumLevel = Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
  const levelText = minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
  return `SLA ${levelText}${entry.frequency ? `${entry.frequency}: ` : ""}${spellName}`;
}
function casterLevelBonusText(entry = {}) {
  if (window.PFEffectEditor?.casterLevelBonusText)
    return window.PFEffectEditor.casterLevelBonusText(entry);
  return `Caster Level ${fmtSigned(Number(entry.value || 0))}`;
}
function spellDcBonusText(entry = {}) {
  if (window.PFEffectEditor?.spellDcBonusText)
    return window.PFEffectEditor.spellDcBonusText(entry);
  return `Spell DC ${fmtSigned(Number(entry.value || 0))}`;
}
function effectiveAttributeBonusText(entry = {}) {
  if (window.PFEffectEditor?.effectiveAttributeBonusText)
    return window.PFEffectEditor.effectiveAttributeBonusText(entry);
  return `Effective Attribute ${fmtSigned(Number(entry.value || 0))}`;
}
function grantDomainText(entry = {}) {
  if (window.PFEffectEditor?.grantDomainText)
    return window.PFEffectEditor.grantDomainText(entry);
  return `Grant Domain: ${entry.domainName || entry.domainId || "Domain"}`;
}
function damageReductionText(entry = {}) {
  const amount = Number(entry.amount || 0);
  const type = entry.overcomeType || entry.type || "-";
  return `DR ${amount}/${type}`;
}
function spellResistanceText(entry = {}) {
  return `SR ${Number(entry.amount || entry.value || 0)}`;
}
function immunityText(entry = {}) {
  const name = String(entry.name || entry.immunity || entry.type || "")
    .trim()
    .replace(/^immunit(?:y|ies)\s+(?:to\s+)?/i, "");
  const label = name || "immunity";
  const conditional = entry.conditional ?? Boolean(entry.condition);
  const appliesWhen = entry.appliesWhen || entry.condition || "";
  return `Immune ${label}${conditional ? ` (${appliesWhen || "conditional"})` : ""}`;
}
function applyConditionText(entry = {}) {
  if (window.PFEffectEditor?.applyConditionText)
    return window.PFEffectEditor.applyConditionText(entry);
  return `Apply Condition: ${entry.conditionName || entry.name || "Condition"}`;
}
function classSkillGrantText(entry = {}) {
  if (window.PFEffectEditor?.classSkillGrantText)
    return window.PFEffectEditor.classSkillGrantText(entry, titleCaseStat);
  return `Class Skill: ${entry.skillName || entry.stat || "Skill"}`;
}
function extraRanksPerLevelText(entry = {}) {
  if (window.PFEffectEditor?.extraRanksPerLevelText)
    return window.PFEffectEditor.extraRanksPerLevelText(entry);
  return `Extra Ranks/Level ${fmtSigned(Number(entry.amount || entry.value || 0))}`;
}
function featGrantText(entry = {}) {
  if (window.PFEffectEditor?.featGrantText)
    return window.PFEffectEditor.featGrantText(entry);
  return `Gain Feat: ${entry.featName || entry.name || entry.featType || "Feat"}`;
}
function sizeChangeText(entry = {}) {
  const value = Number(entry.value ?? entry.steps ?? 0);
  return `Size ${fmtSigned(value)}`;
}
function generatedEquipmentText(entry = {}) {
  return `${entry.type || "Equipment"}: ${entry.name || entry.item || "Generated item"}`;
}
function conditionalVariableText(entry = {}) {
  return `Variable: ${entry.label || entry.name || entry.key || "Choice"}`;
}
function effectExtraTexts(effect = {}) {
  return [
    ...(effect.bonuses || []).map(effectBonusText),
    ...(effect.damageReduction || []).map(damageReductionText),
    ...(effect.spellResistance || []).map(spellResistanceText),
    ...(effect.immunities || []).map(immunityText),
    ...(effect.applyConditions || []).map(applyConditionText),
    ...(effect.classSkillGrants || []).map(classSkillGrantText),
    ...(effect.bonusRanks || []).map((entry) =>
      window.PFEffectEditor?.bonusRanksText?.(entry) || "Bonus ranks",
    ),
    ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
    ...(effect.featGrants || []).map(featGrantText),
    ...(effect.sizeChanges || []).map(sizeChangeText),
    ...(effect.spellLikeAbilities || []).map(spellLikeText),
    ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
    ...(effect.spellDcBonuses || []).map(spellDcBonusText),
    ...(effect.effectiveAttributeBonuses || []).map(effectiveAttributeBonusText),
    ...(effect.grantDomains || []).map(grantDomainText),
    ...(effect.generatedEquipment || []).map(generatedEquipmentText),
    ...(effect.conditionalVariables || []).map(conditionalVariableText),
  ];
}
function effectSearchText(effect) {
  return [
    effect.name,
    effect.category,
    durationLabel(effect),
    ...effectExtraTexts(effect),
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
  if (token.kind === "character") {
    const character = tokenCharacter(token);
    return (
      character?.name ||
      character?.sheet?.fields?.characterName ||
      token.name ||
      "Character"
    );
  }
  if (token.kind === "enemy") {
    const enemy = mapEnemies.find((item) => item.id === token.enemyId);
    return (
      enemy?.name ||
      enemy?.sheet?.fields?.characterName ||
      token.sheet?.fields?.characterName ||
      token.name ||
      "Enemy"
    );
  }
  return token.name || "Token";
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
  // A light's marker is a GM/admin-only editing aid -- the fog reveal
  // it produces still applies to everyone (lightRevealCircles() reads
  // state.tokens directly, not this filtered view), so hiding it here
  // only hides the bulb icon/aura, never the illumination itself.
  if (token.kind === "light" && !isGm) return false;
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
  if (!token?.kind || token.kind === "light") return false;
  if (isGm) return true;
  return token.kind === "character" && token.ownerId === currentUserId;
}
function canManageEffects(token) {
  if (!token?.kind || token.kind === "light") return false;
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
    if (!saved || String(saved.id) !== String(character.id)) {
      await refreshMapTokenSheets({ save: false });
      return;
    }
    await recalculateCharacterSheetFromMap(character.id);
    const refreshed = await PFApp.loadCharacterSheet(
      "",
      mapContextKey,
      character.id,
    );
    if (refreshed?.sheet && String(refreshed.id) === String(character.id))
      character.sheet = refreshed.sheet;
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
      const value = Number(conditional.value || 0);
      const total =
        conditional.displayTotal ||
        (value !== 0
          ? `${conditional.total || ""} (${signedNumberText(value)})`
          : conditional.total || "");
      return `<div class="mini-sheet-inline-conditional"><span>${escapeHtml(total)}</span>${note ? ` <small>${escapeHtml(note)}</small>` : ""}</div>`;
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
  const total = row.displayTotal || row.total || "";
  return `<div class="mini-sheet-card mini-sheet-conditional"><div class="mini-sheet-label">${escapeHtml(row.label || "Conditional")}</div><div class="mini-sheet-value">${escapeHtml(total)}</div>${row.source ? `<div class="small text-secondary">${escapeHtml(row.source)}</div>` : ""}</div>`;
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
  const natural =
    sheetNum(fields.acNaturalBase ?? fields.acNatural) +
    sheetNum(fields.acNaturalMisc);
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
  const refreshed = await PFApp.loadContextCharacters(mapContextKey);
  if (!Array.isArray(refreshed)) return;
  mapCharacters = refreshed;
  mapEffectPrefetchGeneration += 1;
  mapEffectSourceCache.clear();
}

function syncTokenFromSheet(token, source) {
  if (!token || !source?.sheet) return false;
  if (
    token.kind === "character" &&
    source.id &&
    String(source.id) !== String(token.characterId)
  ) {
    return false;
  }
  if (
    token.kind === "enemy" &&
    source.id &&
    String(source.id) !== String(token.enemyId)
  ) {
    return false;
  }
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
    token.sheet = sheet;
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

async function refreshMapTokenSheets({
  save = false,
  reloadCharacters = true,
  reloadEnemies = isGm,
  syncPassiveAuras = true,
  render = true,
} = {}) {
  let changed = false;
  let passiveAurasChanged = false;
  if (reloadCharacters) await hydrateMapCharacterSheets();

  state.tokens.forEach((token) => {
    if (token.kind !== "character") return;
    const character = tokenCharacter(token);
    if (character) changed = syncTokenFromSheet(token, character) || changed;
  });

  if (isGm && reloadEnemies) mapEnemies = await PFApp.loadEnemies(mapContextKey);
  if (isGm) {
    state.tokens.forEach((token) => {
      if (token.kind !== "enemy" || !token.enemyId) return;
      const enemy = mapEnemies.find((item) => item.id === token.enemyId);
      if (enemy) changed = syncTokenFromSheet(token, enemy) || changed;
    });
  }

  if (syncPassiveAuras) {
    for (const token of state.tokens) {
      const auraChanged = await syncTokenPassiveAuras(token);
      passiveAurasChanged = auraChanged || passiveAurasChanged;
      changed = auraChanged || changed;
    }
  }

  if (changed && render) renderAll(save || passiveAurasChanged);
  if (passiveAurasChanged) scheduleOutOfRangeAuraCleanup();
  return changed;
}

function scheduleMapSheetRefresh(delay = 120) {
  clearTimeout(mapSheetRefreshTimer);
  mapSheetRefreshTimer = window.setTimeout(() => {
    mapSheetRefreshTimer = null;
    void refreshMapTokenSheets({ save: false });
  }, Math.max(0, Number(delay) || 0));
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
    _meta:
      raw?._meta && typeof raw._meta === "object"
        ? {
            clientId: String(raw._meta.clientId || ""),
            revision: Math.max(0, Number(raw._meta.revision || 0)),
            savedAt: Math.max(0, Number(raw._meta.savedAt || 0)),
          }
        : null,
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

function mapMetaOf(mapState = state) {
  const meta = mapState?._meta || {};
  return {
    clientId: String(meta.clientId || ""),
    revision: Math.max(0, Number(meta.revision || 0)),
    savedAt: Math.max(0, Number(meta.savedAt || 0)),
  };
}

function stampLocalMapState() {
  localMapRevision += 1;
  state._meta = {
    clientId: MAP_CLIENT_ID,
    revision: localMapRevision,
    savedAt: Date.now(),
  };
  lastAppliedMapMeta = mapMetaOf(state);
}

function isStaleSelfRemote(remoteState) {
  const meta = mapMetaOf(remoteState);
  if (meta.clientId !== MAP_CLIENT_ID) return false;
  return meta.revision <= localMapRevision;
}

function isOlderThanLocal(remoteState) {
  const remoteMeta = mapMetaOf(remoteState);
  const localMeta = mapMetaOf(state);
  if (!remoteMeta.savedAt && localMeta.savedAt) return true;
  if (!remoteMeta.savedAt || !localMeta.savedAt) return false;
  return remoteMeta.savedAt < localMeta.savedAt;
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
  el("mapZoom").value = localGridSize;
  el("mapZoomValue").textContent = `${localGridSize}px`;
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

function mapWrapPadding() {
  const wrap = el("mapStageWrap");
  if (!wrap) return { left: 0, top: 0 };
  const style = getComputedStyle(wrap);
  return {
    left: parseFloat(style.paddingLeft) || 0,
    top: parseFloat(style.paddingTop) || 0,
  };
}

function mapViewportCenterRatio() {
  const wrap = el("mapStageWrap");
  if (!wrap) return { x: 0.5, y: 0.5 };
  const padding = mapWrapPadding();
  const mapWidth = Math.max(1, Number(state.settings.cols || 1) * localGridSize);
  const mapHeight = Math.max(1, Number(state.settings.rows || 1) * localGridSize);
  return {
    x: clamp(
      (wrap.scrollLeft - padding.left + wrap.clientWidth / 2) / mapWidth,
      0,
      1,
    ),
    y: clamp(
      (wrap.scrollTop - padding.top + wrap.clientHeight / 2) / mapHeight,
      0,
      1,
    ),
  };
}

// Same numerator mapViewportCenterRatio() divides down to a 0-1 ratio,
// left as raw px in .map-stage's own coordinate space -- what's
// currently centered in the scrollable viewport, in a form usable as
// a transform-origin so a live zoom preview (see updateZoomPreview())
// scales around the spot the player is actually looking at instead of
// the map's absolute center.
function mapViewportCenterStagePoint() {
  const wrap = el("mapStageWrap");
  if (!wrap) return { x: 0, y: 0 };
  const padding = mapWrapPadding();
  return {
    x: wrap.scrollLeft - padding.left + wrap.clientWidth / 2,
    y: wrap.scrollTop - padding.top + wrap.clientHeight / 2,
  };
}

function scrollMapViewportToRatio(ratio = { x: 0.5, y: 0.5 }) {
  const wrap = el("mapStageWrap");
  if (!wrap) return;
  const padding = mapWrapPadding();
  const mapWidth = Math.max(1, Number(state.settings.cols || 1) * localGridSize);
  const mapHeight = Math.max(1, Number(state.settings.rows || 1) * localGridSize);
  wrap.scrollLeft = ratio.x * mapWidth - wrap.clientWidth / 2 + padding.left;
  wrap.scrollTop = ratio.y * mapHeight - wrap.clientHeight / 2 + padding.top;
}

function centerMapViewport() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollMapViewportToRatio({ x: 0.5, y: 0.5 }));
  });
}

function visibleSpawnCell(width = 1, height = 1) {
  const wrap = el("mapStageWrap");
  const padding = mapWrapPadding();
  const cell = Math.max(1, Number(localGridSize || 48));
  const cols = Number(state.settings.cols || 1);
  const rows = Number(state.settings.rows || 1);
  const fallbackX = Math.floor(cols / 2 - width / 2);
  const fallbackY = Math.floor(rows / 2 - height / 2);
  if (!wrap) {
    return {
      x: clamp(fallbackX, 0, Math.max(0, cols - width)),
      y: clamp(fallbackY, 0, Math.max(0, rows - height)),
    };
  }
  const centerX = (wrap.scrollLeft - padding.left + wrap.clientWidth / 2) / cell;
  const centerY = (wrap.scrollTop - padding.top + wrap.clientHeight / 2) / cell;
  return {
    x: clamp(Math.floor(centerX - width / 2), 0, Math.max(0, cols - width)),
    y: clamp(Math.floor(centerY - height / 2), 0, Math.max(0, rows - height)),
  };
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

function pathRulerActive() {
  return Boolean(pathRuler?.active);
}

function pointForMapCell(x, y, { heightOffsetFeet = 0 } = {}) {
  const cell = Number(localGridSize || 48);
  const gx = clamp(Number(x || 0), 0, state.settings.cols - 1);
  const gy = clamp(Number(y || 0), 0, state.settings.rows - 1);
  const surfaceZ = surfaceFeetAtCell(gx, gy);
  return {
    x: gx,
    y: gy,
    surfaceZ,
    z: surfaceZ + Number(heightOffsetFeet || 0),
    px: (gx + 0.5) * cell,
    py: (gy + 0.5) * cell,
  };
}

function showMapContextMenu(event, item) {
  if (pathRulerActive()) {
    event.preventDefault();
    event.stopPropagation();
    undoPathRulerPoint();
    return;
  }
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
  // A light's only right-click option is Remove -- no aura/effect/roll,
  // no visibility toggles, no z-index (nothing else ever draws on top
  // of a light's own layer in a way reordering it would matter for).
  const isLight = item.kind === "light";
  el("toggleEmitMenu").classList.toggle("d-none", isLight || !canManageAura(item));
  el("emitMenu").classList.add("d-none");
  el("toggleEmitMenu").setAttribute("aria-expanded", "false");
  el("openApplyEffect").classList.toggle("d-none", isLight || !canManageEffects(item));
  el("openRollMenu").classList.toggle("d-none", isLight || !canRollToken(item));
  const tokenVisibilityButton = el("toggleTokenVisibility");
  const canToggleTokenVisibility =
    !isLight && Boolean(item.kind && canManageMapItem(item));
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
  const canToggleName = !isLight && isGm && Boolean(item.kind);
  nameVisibilityButton.classList.toggle("d-none", !canToggleName);
  if (canToggleName) {
    nameVisibilityButton.innerHTML = item.hideName
      ? `<i class="bi bi-eye me-1"></i> Unhide name`
      : `<i class="bi bi-incognito me-1"></i> Hide name`;
  }
  el("transferToken3D")?.classList.toggle(
    "d-none",
    !(view3DMode && !heightEditMode && item.kind && !isLight),
  );
  el("zIndexMenu").classList.add("d-none");
  el("toggleZIndexMenu").classList.toggle("d-none", isLight);
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

function stageCellFromEvent(event, options = {}) {
  const cell = Number(localGridSize || 48);
  // A tilted/spun 3D stage (see toggleView3DMode()) makes the simple
  // rect-relative math below meaningless -- the stage's on-screen
  // bounding box no longer lines up with its actual grid cells once
  // rotated. cell3DFromPoint()/build3DHitGrid() answer the same
  // question via the browser's own (transform-aware) hit-testing
  // instead. Requires a hit grid to already be built (see
  // startDrag()/startMovementMeasure()); falls through to the flat
  // math below if there isn't one (e.g. 3D View was toggled off mid-
  // gesture).
  if (view3DMode && !heightEditMode) {
    const hit = cell3DFromPoint(event.clientX, event.clientY);
    if (hit) return pointForMapCell(hit.x, hit.y, options);
  }
  const stage = el("mapStage");
  const rect = stage.getBoundingClientRect();
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
  return pointForMapCell(x, y, options);
}

function pathfinderDistance(start, end) {
  const dx = Math.abs(Number(end.x || 0) - Number(start.x || 0));
  const dy = Math.abs(Number(end.y || 0) - Number(start.y || 0));
  const dz = Math.round(
    Math.abs(Number(end.z || 0) - Number(start.z || 0)) / 5,
  );
  const axes = [dx, dy, dz].sort((a, b) => a - b);
  const diagonals = axes[1];
  const straight = axes[2] - axes[1];
  return straight * 5 + Math.floor(diagonals / 2) * 15 + (diagonals % 2) * 5;
}

function pathfinderPathDistance(points) {
  return points.slice(1).reduce(
    (total, point, index) => total + pathfinderDistance(points[index], point),
    0,
  );
}

function pointHeightSuffix(point) {
  const z = Number(point?.z || 0);
  if (!z) return "";
  return ` (${z > 0 ? "+" : ""}${z} ft z)`;
}

function rulerPointZPx(point) {
  if (!view3DMode || heightEditMode) return 0;
  return feetToPreviewPx(Number(point?.z || 0)) + 4;
}

function renderPathRulerSegment(previous, point, isPreview = false) {
  const dx = point.px - previous.px;
  const dy = point.py - previous.py;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const pieces = Math.max(1, Math.ceil(length / 14));
  const pieceLength = length / pieces;
  const startZ = rulerPointZPx(previous);
  const endZ = rulerPointZPx(point);
  return Array.from({ length: pieces }, (_, index) => {
    const startRatio = index / pieces;
    const endRatio = (index + 1) / pieces;
    const midRatio = (startRatio + endRatio) / 2;
    const x = previous.px + dx * startRatio;
    const y = previous.py + dy * startRatio;
    const zPx = startZ + (endZ - startZ) * midRatio;
    return `
      <span
        class="path-ruler-segment${isPreview ? " is-preview" : ""}"
        style="left:${x}px;top:${y}px;width:${pieceLength + 1}px;--ruler-angle:${angle}rad;--ruler-z:${zPx}px;"
      ></span>
    `;
  }).join("");
}

function renderPathRulerPoint(point, index, isPreview = false) {
  return `
    <span
      class="path-ruler-point${index === 0 ? " is-start" : ""}${isPreview ? " is-preview" : ""}"
      style="left:${point.px}px;top:${point.py}px;--ruler-z:${rulerPointZPx(point)}px;"
    ></span>
  `;
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

function renderPathRuler() {
  document.querySelector(".path-ruler")?.remove();
  if (!pathRuler?.points?.length) return;
  const stage = el("mapStage");
  const committedPoints = pathRuler.points;
  const points =
    pathRuler.active && pathRuler.preview
      ? [...committedPoints, pathRuler.preview]
      : committedPoints;
  const segments = points
    .slice(1)
    .map((point, index) => {
      const previous = points[index];
      return renderPathRulerSegment(
        previous,
        point,
        pathRuler.active && Boolean(pathRuler.preview) && index === points.length - 2,
      );
    })
    .join("");
  const dots = committedPoints
    .map(
      (point, index) => renderPathRulerPoint(point, index),
    )
    .join("");
  const previewDot =
    pathRuler.active && pathRuler.preview
      ? renderPathRulerPoint(pathRuler.preview, points.length - 1, true)
      : "";
  const last = points[points.length - 1];
  const distance = pathfinderPathDistance(points);
  const nextOffset = Number(pathRuler.elevationOffsetFeet || 0);
  const nextHeightLabel =
    pathRuler.active && nextOffset
      ? ` | next ${nextOffset > 0 ? "+" : ""}${nextOffset} ft`
      : "";
  const layer = document.createElement("div");
  layer.className = "path-ruler";
  layer.innerHTML = `
    ${segments}
    ${dots}
    ${previewDot}
    <div class="movement-ruler-label path-ruler-label" style="left:${last.px}px;top:${last.py}px;--ruler-z:${rulerPointZPx(last)}px;">${distance} ft${pointHeightSuffix(last)}${nextHeightLabel}</div>
  `;
  stage.appendChild(layer);
}

function updatePathRulerButton() {
  const button = el("togglePathRuler");
  if (!button) return;
  const active = Boolean(pathRuler?.active);
  const hasPath = Boolean(pathRuler?.points?.length);
  button.classList.toggle("active", active);
  button.innerHTML = active
    ? `<i class="bi bi-check2"></i> Finish Ruler`
    : hasPath
      ? `<i class="bi bi-trash"></i> Clear Ruler`
      : `<i class="bi bi-rulers"></i> Ruler`;
}

function clearPathRuler() {
  pathRuler = null;
  document.querySelector(".path-ruler")?.remove();
  el("mapStage")?.classList.remove("path-ruler-active");
  updatePathRulerButton();
  if (!dragState && !transferTargetTokenId) teardown3DHitGrid();
}

function finishPathRuler() {
  if (!pathRuler) return;
  pathRuler.active = false;
  pathRuler.preview = null;
  el("mapStage")?.classList.remove("path-ruler-active");
  updatePathRulerButton();
  renderPathRuler();
  if (!dragState && !transferTargetTokenId) teardown3DHitGrid();
}

function startPathRuler() {
  hideContextMenu();
  cancelTransferTarget();
  pathRuler = {
    active: true,
    points: [],
    preview: null,
    elevationOffsetFeet: 0,
  };
  el("mapStage")?.classList.add("path-ruler-active");
  updatePathRulerButton();
  showMapToast("Ruler active: click cells to add path points.");
  if (view3DMode && !heightEditMode) build3DHitGrid();
}

function togglePathRuler() {
  if (pathRuler?.active) {
    finishPathRuler();
    return;
  }
  if (pathRuler?.points?.length) {
    clearPathRuler();
    return;
  }
  startPathRuler();
}

function addPathRulerPoint(event) {
  if (!pathRuler?.active) return false;
  event.preventDefault();
  event.stopPropagation();
  const point = stageCellFromEvent(event, {
    heightOffsetFeet: pathRuler.elevationOffsetFeet,
  });
  if (!point) return true;
  const last = pathRuler.points[pathRuler.points.length - 1];
  if (!last || last.x !== point.x || last.y !== point.y || last.z !== point.z) {
    pathRuler.points.push(point);
  }
  pathRuler.preview = null;
  renderPathRuler();
  updatePathRulerButton();
  return true;
}

function movePathRulerPreview(event) {
  if (!pathRuler?.active || !pathRuler.points.length) return;
  const point = stageCellFromEvent(event, {
    heightOffsetFeet: pathRuler.elevationOffsetFeet,
  });
  if (!point) return;
  pathRuler.preview = point;
  renderPathRuler();
}

function adjustPathRulerElevation(event) {
  if (!pathRuler?.active) return false;
  event.preventDefault();
  event.stopPropagation();
  const direction = Number(event.deltaY || 0) < 0 ? 1 : -1;
  pathRuler.elevationOffsetFeet =
    Number(pathRuler.elevationOffsetFeet || 0) + direction * 5;
  if (pathRuler.preview) {
    pathRuler.preview = pointForMapCell(pathRuler.preview.x, pathRuler.preview.y, {
      heightOffsetFeet: pathRuler.elevationOffsetFeet,
    });
  }
  showMapToast(
    `Ruler next point ${pathRuler.elevationOffsetFeet > 0 ? "+" : ""}${pathRuler.elevationOffsetFeet} ft.`,
  );
  renderPathRuler();
  return true;
}

function undoPathRulerPoint() {
  if (!pathRuler?.points?.length) return;
  pathRuler.points.pop();
  pathRuler.preview = null;
  updatePathRulerButton();
  renderPathRuler();
  if (!pathRuler.points.length) {
    document.querySelector(".path-ruler")?.remove();
  }
}

function cancelTransferTarget() {
  transferTargetTokenId = "";
  el("mapStage")?.classList.remove("transfer-target-active");
  if (!dragState && !pathRuler?.active) teardown3DHitGrid();
}

function startTransferTarget() {
  const token = tokenById(contextMenuTokenId);
  if (!token || !canManageMapItem(token) || !view3DMode || heightEditMode) return;
  finishPathRuler();
  transferTargetTokenId = token.id;
  hideContextMenu();
  el("mapStage")?.classList.add("transfer-target-active");
  build3DHitGrid();
  showMapToast("Transfer active: click a 3D cell to place the token.");
}

function transferTokenToPoint(event) {
  if (!transferTargetTokenId) return false;
  event.preventDefault();
  event.stopPropagation();
  const token = tokenById(transferTargetTokenId);
  const point = stageCellFromEvent(event);
  if (!token || !point || !canManageMapItem(token)) {
    cancelTransferTarget();
    return true;
  }
  token.x = clamp(
    point.x,
    0,
    Math.max(0, Number(state.settings.cols || 0) - Number(token.w || 1)),
  );
  token.y = clamp(
    point.y,
    0,
    Math.max(0, Number(state.settings.rows || 0) - Number(token.h || 1)),
  );
  selectedId = token.id;
  cancelTransferTarget();
  renderAll();
  return true;
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
  if (pathRulerActive()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  hideContextMenu();
  // Must exist before stageCellFromEvent()'s 3D branch can answer
  // anything -- see build3DHitGrid().
  if (view3DMode && !heightEditMode) build3DHitGrid();
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
  teardown3DHitGrid();
}

function renderMap() {
  const stage = el("mapStage");
  const { cols, rows } = state.settings;
  applyMapStageVars();
  // The background always fills the whole cols x rows grid, so resizing
  // Cell X/Y (linked) scales the picture with it instead of cropping it.

  // 3D View only applies to the normal token/shape stage -- Height
  // Layer editing (painting regions) stays 2D-only regardless of the
  // toggle's own state, so this re-derives it fresh every render
  // instead of trusting view3DMode alone.
  const is3D = view3DMode && !heightEditMode;
  const visibleTokens = heightEditMode ? [] : state.tokens.filter(canSeeToken);
  stage.classList.toggle("is-3d", is3D);
  const stageWrap = el("mapStageWrap");
  stageWrap?.classList.toggle("is-3d", is3D);
  if (is3D) {
    set3DViewVars({ preserveCenter: false });
    // The camera needs to stay comfortably farther away than the
    // scene is wide/tall, or a big map's flat ground plane can rotate
    // enough to cross behind the perspective origin -- CSS doesn't
    // clip that cleanly, it distorts catastrophically (the plane's
    // own bounding box balloons to several times the viewport at
    // wildly wrong coordinates), visually burying every block/token
    // on top of it. A fixed perspective distance can't work across
    // both a small map and a large one at a normal zoom level, so
    // this scales with the map's own rendered diagonal
    // (cols/rows * localGridSize, the same size the terrain/tokens
    // actually render at) instead of a constant.
    const mapDiagonal = Math.hypot(
      Number(cols || 0) * Number(localGridSize || 48),
      Number(rows || 0) * Number(localGridSize || 48),
    );
    stageWrap?.style.setProperty(
      "--map-3d-perspective",
      `${Math.max(1400, mapDiagonal * 2)}px`,
    );
  }

  // See token3DFogRevealStrength()'s comment: 3D has no full-stage fog
  // overlay to hide tokens for free (2D gets that for free from the
  // opaque SVG fog layer sitting above them in z-index), so it's done
  // by hand here -- dropped entirely for a player who can't see that
  // cell (unless it's their own token, which they can always see),
  // just dimmed for the GM (matching the 0.45 the terrain fog itself
  // dims to). Computed once up top so both the innerHTML build below
  // and render3DTokenBillboards() see the same filtered set.
  const fog3DActive = is3D && !heightEditMode && Boolean(state.fog?.visible);
  const fog3DLimitedCircles = fog3DActive ? limitedViewRevealCircles() : [];
  const fog3DLightCircles = fog3DActive ? lightRevealCircles() : [];
  shapeFogRenderContext = {
    active: fog3DActive,
    limitedCircles: fog3DLimitedCircles,
    lightCircles: fog3DLightCircles,
    color: state.fog?.color || "#000000",
  };
  const token3DRevealStrength = (token) =>
    token3DFogRevealStrength(token, fog3DLimitedCircles, fog3DLightCircles);
  const token3DFogOpacity = (token) => {
    if (!fog3DActive || token.ownerId === currentUserId) return 1;
    const revealStrength = token3DRevealStrength(token);
    return revealStrength > 0.08 ? 0.45 + revealStrength * 0.55 : 0.45;
  };
  // Mirrors renderLimitedViewGrayscale()'s 2D rule: grayscale/high
  // contrast for anyone standing inside a Special Vision circle,
  // unconditionally -- even where a light also reaches them.
  const token3DGrayscale = (token) => {
    if (!fog3DActive || !fog3DLimitedCircles.length) return false;
    const center = tokenCenter(token);
    const gx = Math.floor(center.x);
    const gy = Math.floor(center.y);
    return fog3DLimitedCircles.some(
      (circle) => flatRevealStrengthAtCell(circle, gx, gy) > 0.02,
    );
  };
  const tokens3D = !fog3DActive
    ? visibleTokens
    : visibleTokens.filter(
        (token) =>
          isGm ||
          token.ownerId === currentUserId ||
          token3DRevealStrength(token) > 0.08,
      );
  current3DRenderTokens = is3D ? tokens3D : [];

  // Height Layer mode replaces the whole stage contents with just the
  // height regions -- no tokens, ordinary shapes, or fog, so painting
  // elevation never risks nudging something used in actual play. See
  // toggleHeightEditMode().
  if (heightEditMode) {
    stage.innerHTML = [
      renderMapBackgroundLayer(),
      ...state.heightShapes.map(renderHeightShape),
      `<div id="heightPaintPreview" class="height-paint-preview"></div>`,
      `<div id="tokenHoverLayer" class="token-hover-layer"></div>`,
    ].join("");
  } else {
    stage.innerHTML = [
      is3D ? render3DTerrainHtml() : renderMapBackgroundLayer(),
      ...(is3D ? tokens3D : visibleTokens).map(renderAura),
      ...(isGm && !is3D
        ? visibleTokens.map((token) =>
            renderRevealIndicator(token, "light", "map-reveal-light", "#f0d58c"),
          )
        : []),
      ...(isGm && !is3D
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
      ...(is3D ? tokens3D : visibleTokens).map((token) =>
        renderToken(token, {
          tz: is3D ? token3DHeights(token).tz : 0,
          fogOpacity: is3D ? token3DFogOpacity(token) : 1,
          grayscale: is3D && token3DGrayscale(token),
        }),
      ),
      is3D ? tokens3D.map(render3DFlightConnector).join("") : "",
      is3D ? "" : renderFogLayer(false),
      is3D ? "" : renderLimitedViewGrayscale(),
      is3D ? "" : renderOwnTokenFogReveal(visibleTokens),
      `<div id="tokenHoverLayer" class="token-hover-layer"></div>`,
    ].join("");
  }

  // stage.innerHTML above just wiped out any in-progress 3D hit-test
  // grid (see build3DHitGrid()) along with everything else -- move
  // the already-built one back in rather than losing it mid-drag;
  // startDrag()/startMovementMeasure() are what actually build it.
  if (is3D && hit3DGridEl) stage.appendChild(hit3DGridEl);
  render3DTokenBillboards(is3D ? tokens3D : []);

  // The movement ruler doesn't mean anything in the Height Layer --
  // clicking the stage background there starts a paint stroke instead
  // (a no-op unless the Draw tool is actually toggled on).
  stage.onpointerdown = heightEditMode
    ? startPaintHeightShape
    : startMovementMeasure;
  // While the Draw tool is active, existing Height Layer regions need
  // to be completely non-interactive -- no drag, no resize, no
  // click-to-select -- so painting over/near one starts a paint stroke
  // instead of grabbing it. Simplest way to guarantee that: don't wire
  // any of those listeners onto the shape elements at all while
  // heightDrawMode is on, so a pointerdown that starts on top of one
  // has nothing local to catch it and just bubbles up to
  // stage.onpointerdown above.
  if (!heightDrawMode) {
    stage.querySelectorAll("[data-resize-handle]").forEach((handle) => {
      handle.addEventListener("pointerdown", startResize);
    });
    stage.querySelectorAll("[data-map-id]:not([data-resize-handle])").forEach((node) => {
      node.addEventListener("pointerdown", startDrag);
      node.addEventListener("mouseenter", () =>
        pathRulerActive() ? null : showTokenHover(node.dataset.mapId),
      );
      node.addEventListener("mouseleave", hideTokenHover);
      node.addEventListener("click", (event) => {
        if (transferTokenToPoint(event) || addPathRulerPoint(event)) return;
        event.stopPropagation();
        suppressStageClick = true;
        hideContextMenu();
        selectedId = node.dataset.mapId;
        renderAll(false);
        showSelectedPanel();
      });
      node.addEventListener("contextmenu", (event) => {
        if (pathRulerActive()) {
          event.preventDefault();
          event.stopPropagation();
          undoPathRulerPoint();
          return;
        }
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
  }
  stage.oncontextmenu = (event) => {
    if (pathRulerActive()) {
      event.preventDefault();
      event.stopPropagation();
      undoPathRulerPoint();
      return;
    }
    if (suppressNextContextMenu) {
      event.preventDefault();
      suppressNextContextMenu = false;
      return;
    }
    if (event.target === stage) event.preventDefault();
  };
  stage.onclick = (event) => {
    if (transferTokenToPoint(event) || addPathRulerPoint(event)) return;
    if (suppressStageClick) {
      suppressStageClick = false;
      return;
    }
    if (event.target !== stage) return;
    hideContextMenu();
    selectedId = "";
    renderAll(false);
  };
  stage.onpointermove = (event) => {
    movePathRulerPreview(event);
  };
  stage.onwheel = (event) => {
    adjustPathRulerElevation(event);
  };
  updateHeightEditControls();
  // Lives outside #mapStage (a sibling in .map-main, see map.html), so
  // rebuilding the stage above never touches it -- hooked here instead
  // of into every renderSelectedPanel() call site because renderMap()
  // is the one function every state change already goes through
  // (drag, dpad move, remote sync, ...), so the HUD never goes stale.
  renderMobileHud();
  renderPathRuler();
  updatePathRulerButton();
}

function renderMapBackgroundLayer() {
  return `<div class="map-background-layer"></div>`;
}

function applyMapStageVars() {
  const stage = el("mapStage");
  if (!stage) return;
  const { cols, rows, backgroundUrl } = state.settings;
  stage.style.setProperty("--cell", `${localGridSize}px`);
  stage.style.setProperty("--cols", cols);
  stage.style.setProperty("--rows", rows);
  if (backgroundUrl !== appliedMapBackgroundUrl) {
    appliedMapBackgroundUrl = backgroundUrl || "";
    stage.style.setProperty(
      "--map-bg",
      backgroundUrl ? `url("${backgroundUrl.replaceAll('"', "%22")}")` : "none",
    );
  }
}

function auraRangeCells(config = {}) {
  return Math.max(
    1,
    Math.ceil(Number(config.rangeFeet || config.range || 5) / 5),
  );
}

function tokenAuraEntries(token) {
  const entries = [];
  if (token?.aura?.visible) {
    entries.push({ id: "manual", aura: token.aura, token });
  }
  (Array.isArray(token?.automaticAuras) ? token.automaticAuras : [])
    .filter((aura) => aura?.visible !== false)
    .forEach((aura) => entries.push({ id: aura.id, aura, token }));
  return entries;
}

function tokenAuraEntry(token, auraId = "manual") {
  return tokenAuraEntries(token).find((entry) => entry.id === auraId) || null;
}

function renderAura(token) {
  return tokenAuraEntries(token)
    .map(({ id, aura }) => {
      const radius = Math.max(1, Number(aura.radius || 1));
      const size = radius * 2;
      const centerX = Number(token.x || 0) + Number(token.w || 1) / 2;
      const centerY = Number(token.y || 0) + Number(token.h || 1) / 2;
      return `<div class="map-aura" data-aura-token-id="${escapeHtml(token.id)}" data-aura-id="${escapeHtml(id)}" data-aura-field="aura" style="--aura-x:${centerX - radius};--aura-y:${centerY - radius};--aura-size:${size};--aura-color:${escapeHtml(aura.color || "#8fd19e")};"></div>`;
    })
    .join("");
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
  return `<div class="map-aura ${className}" data-aura-token-id="${escapeHtml(token.id)}" data-aura-field="${escapeHtml(field)}" style="--aura-x:${center.x - radius};--aura-y:${center.y - radius};--aura-size:${size};--aura-color:${color};"></div>`;
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
      elevationFeet: Number(token.elevationFeet || 0),
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
      elevationFeet: Number(token.elevationFeet || 0),
    });
  });
  return circles;
}

function fogRevealCircles() {
  return [...lightRevealCircles(), ...limitedViewRevealCircles()];
}

// 3D View only -- in 2D, fog already hides tokens for free: the opaque
// SVG fog layer paints over them (z-index 25 vs. a token's z-index ~2,
// see .map-fog-layer/.map-token in css/map.css), and renderOwnTokenFogReveal()
// redraws just the viewer's own token on top of that so they can still
// see themselves. 3D has no such full-stage overlay (fog there is baked
// per-terrain-cell, see renderSurfaceFogCells()), so without this a
// token's billboard/portrait/aura would stay fully visible in 3D no
// matter how dark the ground under it went.
function token3DFogRevealStrength(token, limitedCircles, lightCircles) {
  const center = tokenCenter(token);
  const targetFeet =
    tallestHeightFeetUnder(
      Number(token.x || 0),
      Number(token.y || 0),
      Number(token.w || 1),
      Number(token.h || 1),
    ) + Number(token.elevationFeet || 0);
  return fogRevealStrengthAt3DPoint(
    center.x,
    center.y,
    targetFeet,
    Math.floor(center.x),
    Math.floor(center.y),
    limitedCircles,
    lightCircles,
  );
}

function surfaceFeetAtCell(gx, gy) {
  return heightFeetAtCell(Math.floor(Number(gx || 0)), Math.floor(Number(gy || 0)));
}

const FOG_SOFT_EDGE_CELLS = 0.85;
const FOG_OCCLUSION_EPSILON_FEET = 0.5;

function revealStrengthFromDistance(distance, radius) {
  const safeRadius = Math.max(1, Number(radius || 1));
  const inner = Math.max(0, safeRadius - FOG_SOFT_EDGE_CELLS);
  const outer = safeRadius + FOG_SOFT_EDGE_CELLS;
  if (distance <= inner) return 1;
  if (distance >= outer) return 0;
  return clamp((outer - distance) / (outer - inner), 0, 1);
}

function flatRevealStrengthAtCell(circle, gx, gy) {
  const distance = Math.hypot(gx + 0.5 - circle.x, gy + 0.5 - circle.y);
  return revealStrengthFromDistance(distance, circle.radius);
}

function lightPathBlockedAtPoint(
  light,
  targetX,
  targetY,
  targetFeet,
  targetGx,
  targetGy,
) {
  const sourceSurfaceFeet = surfaceFeetAtCell(
    Math.floor(light.x),
    Math.floor(light.y),
  );
  const sourceFeet = sourceSurfaceFeet + Number(light.elevationFeet || 0);
  const dx = targetX - light.x;
  const dy = targetY - light.y;
  const steps = Math.max(2, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 3));
  const sourceGx = Math.floor(light.x);
  const sourceGy = Math.floor(light.y);

  for (let step = 1; step < steps; step += 1) {
    const t = step / steps;
    const sampleGx = Math.floor(light.x + dx * t);
    const sampleGy = Math.floor(light.y + dy * t);
    if (
      (sampleGx === sourceGx && sampleGy === sourceGy) ||
      (sampleGx === targetGx && sampleGy === targetGy)
    ) {
      continue;
    }
    const pathFeet = sourceFeet + (targetFeet - sourceFeet) * t;
    if (
      surfaceFeetAtCell(sampleGx, sampleGy) >
      pathFeet + FOG_OCCLUSION_EPSILON_FEET
    ) {
      return true;
    }
  }

  return false;
}

function lightRevealStrengthAtCell(light, gx, gy) {
  return flatRevealStrengthAtCell(light, gx, gy);
}

function revealStrengthAt3DPoint(circle, targetX, targetY, targetFeet) {
  const sourceSurfaceFeet = surfaceFeetAtCell(
    Math.floor(circle.x),
    Math.floor(circle.y),
  );
  const sourceFeet = sourceSurfaceFeet + Number(circle.elevationFeet || 0);
  const distance = Math.hypot(
    targetX - circle.x,
    targetY - circle.y,
    (targetFeet - sourceFeet) / 5,
  );
  return revealStrengthFromDistance(distance, circle.radius);
}

function fogRevealStrengthAt3DPoint(
  targetX,
  targetY,
  targetFeet,
  targetGx,
  targetGy,
  limitedCircles,
  lightCircles,
) {
  let strength = 0;
  limitedCircles.forEach((circle) => {
    strength = Math.max(
      strength,
      revealStrengthAt3DPoint(circle, targetX, targetY, targetFeet),
    );
  });
  lightCircles.forEach((light) => {
    const lightStrength = revealStrengthAt3DPoint(
      light,
      targetX,
      targetY,
      targetFeet,
    );
    if (
      lightStrength > 0 &&
      !lightPathBlockedAtPoint(
        light,
        targetX,
        targetY,
        targetFeet,
        targetGx,
        targetGy,
      )
    ) {
      strength = Math.max(strength, lightStrength);
    }
  });
  return strength;
}

function fogRevealStrengthAtCell(gx, gy, limitedCircles, lightCircles) {
  let strength = 0;
  limitedCircles.forEach((circle) => {
    strength = Math.max(strength, flatRevealStrengthAtCell(circle, gx, gy));
  });
  lightCircles.forEach((light) => {
    strength = Math.max(strength, lightRevealStrengthAtCell(light, gx, gy));
  });
  return strength;
}

function fogOpacityAt3DCell(gx, gy, limitedCircles, lightCircles) {
  const revealStrength = fogRevealStrengthAtCell(
    gx,
    gy,
    limitedCircles,
    lightCircles,
  );
  return (isGm ? 0.45 : 1) * (1 - revealStrength);
}

function fogColorWithOpacity(color, opacity) {
  const alpha = clamp(Number(opacity || 0), 0, 1);
  const hex = String(color || "#000000").trim();
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return escapeHtml(hex);
  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

function grayscaleHexColor(color) {
  const hex = String(color || "#8fd19e").trim();
  const match = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return color;
  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
  const part = gray.toString(16).padStart(2, "0");
  return `#${part}${part}${part}`;
}

function highest3DSceneZ(tokens = state.tokens) {
  const terrainFeet = state.heightShapes.reduce(
    (max, shape) => Math.max(max, Number(shape.heightFeet || 0)),
    0,
  );
  const tokenFeet = tokens.reduce((max, token) => {
    const surfaceFeet = tallestHeightFeetUnder(
      Number(token.x || 0),
      Number(token.y || 0),
      Number(token.w || 1),
      Number(token.h || 1),
    );
    return Math.max(max, surfaceFeet + Number(token.elevationFeet || 0));
  }, 0);
  return feetToPreviewPx(Math.max(0, terrainFeet, tokenFeet));
}

function renderFogLayer(is3D = false) {
  if (!state.fog?.visible) return "";
  if (is3D) return "";
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

function tokenInAura(token, auraToken, aura = auraToken?.aura || {}) {
  if (!aura.visible || !aura.effect || token.id === auraToken.id) return false;
  if (!canSeeToken(token) || !canSeeToken(auraToken)) return false;
  const radius = Math.max(1, Number(aura.radius || 1));
  const a = tokenCenter(auraToken);
  const b = tokenCenter(token);
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius;
}

function auraPromptKey(tokenId, auraTokenId, auraId = "manual") {
  return `${mapContextKey}|${tokenId}|${auraTokenId}|${auraId}`;
}

function currentAuraEffectEntries() {
  const auraEntries = state.tokens
    .filter(canSeeToken)
    .flatMap((auraToken) =>
      tokenAuraEntries(auraToken)
        .filter(({ aura }) => aura.visible && aura.effect)
        .map((entry) => ({ ...entry, auraToken })),
    );
  return state.tokens
    .filter(
      (token) =>
        (token.kind === "character" || token.kind === "enemy") &&
        canManageEffects(token),
    )
    .flatMap((token) =>
      auraEntries
        .filter(({ auraToken, aura }) => tokenInAura(token, auraToken, aura))
        .map(({ auraToken, aura, id }) => ({
          token,
          auraToken,
          aura,
          auraId: id,
          key: auraPromptKey(token.id, auraToken.id, id),
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
      ({ token, auraToken, aura, auraId, key }) => `
    <div class="aura-effect-toast">
      <div class="fw-semibold">${escapeHtml(aura.effect?.name || "Effect")} aura</div>
      <div class="small text-secondary mb-2">${escapeHtml(displayTokenName(token))}</div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-outline-light btn-sm" type="button" data-dismiss-aura="${escapeHtml(key)}">Dismiss</button>
        <button class="btn btn-success btn-sm" type="button" data-apply-aura="${escapeHtml(token.id)}" data-aura-source="${escapeHtml(auraToken.id)}" data-aura-id="${escapeHtml(auraId)}">Apply</button>
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
        button.dataset.auraId,
      ),
    );
  });
}

function renderToken(
  token,
  { ghost = false, tz = 0, fogOpacity = 1, grayscale = false } = {},
) {
  const enemyClass = token.kind === "enemy" ? " enemy" : "";
  const genericClass = token.kind === "token" ? " generic-token" : "";
  const lightClass = token.kind === "light" ? " light-token" : "";
  const identityHidden = tokenNameIsHidden(token);
  const imageUrl = tokenNameIsHidden(token)
    ? ""
    : String(token.imageUrl || "").trim();
  const imageClass = imageUrl ? " has-image" : "";
  const identityHiddenClass = identityHidden ? " identity-hidden" : "";
  const tokenImage = imageUrl ? `url('${cssUrl(imageUrl)}')` : "none";
  const baseColor = grayscale
    ? grayscaleHexColor(token.color || "#8fd19e")
    : token.color || "#8fd19e";
  const tokenW = Number(token.w || 1);
  const tokenH = Number(token.h || 1);
  const portraitSize = Math.round(
    clamp(Math.min(tokenW, tokenH) * Number(localGridSize || 48) * 1.35, 56, 128),
  );
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
  const shortLabel = tokenNameIsHidden(token)
    ? isGm
      ? `? ${tokenInitials(tokenActualName(token))}`
      : "?"
    : tokenInitials(tokenActualName(token));
  // opacity/filter < 1 (or != none) force transform-style:preserve-3d
  // to compute as flat on whatever element they're set on (CSS
  // Transforms spec) -- fine for an imageless token (.map-token has no
  // 3D-transformed children to flatten), but .map-token itself needs
  // real preserve-3d in 3D mode so .map-token-3d-image's own
  // translateZ + counter-rotation (see css/map.css) still composes
  // against the tilted scene instead of collapsing onto it. That
  // collapse is exactly what made a dimmed token's portrait render
  // tilted flat with the ground instead of billboarded upright, only
  // for tokens dim enough to carry the style at all -- i.e. everything
  // short of "fully revealed". So both styles go on the leaf image
  // itself when there is one, and only fall back to the container when
  // there's no image (nothing under it needs preserve-3d).
  const grayscaleFilter = grayscale ? "grayscale(1) contrast(1.75)" : "";
  const tokenEffectStyle = [
    fogOpacity < 1 ? `opacity:${fogOpacity};` : "",
    grayscaleFilter
      ? `filter:${grayscaleFilter};-webkit-filter:${grayscaleFilter};`
      : "",
  ].join("");
  const portraitHtml =
    token.kind === "light"
      ? `<div class="map-token-3d-portrait-anchor"><div class="map-token-3d-portrait map-token-light-bulb" style="${tokenEffectStyle}"><i class="bi bi-lightbulb-fill"></i></div></div>`
      : imageUrl
        ? `<div class="map-token-3d-portrait-anchor"><img class="map-token-3d-portrait map-token-3d-image" src="${escapeHtml(cssUrl(imageUrl))}" alt="" style="${tokenEffectStyle}"></div>`
        : `<div class="map-token-3d-portrait-anchor"><div class="map-token-3d-portrait map-token-3d-initials" style="${tokenEffectStyle}">${escapeHtml(shortLabel)}</div></div>`;
  const baseFogHtml =
    fogOpacity < 1
      ? `<div class="map-token-3d-base-fog" style="background:${fogColorWithOpacity("#000000", 1 - fogOpacity)};"></div>`
      : "";
  const containerEffectStyle = imageUrl || (view3DMode && !heightEditMode)
    ? ""
    : [
        grayscaleFilter
          ? `filter:${grayscaleFilter};-webkit-filter:${grayscaleFilter};`
          : "",
      ].join("");
  return `
    <div class="map-token${enemyClass}${genericClass}${lightClass}${imageClass}${identityHiddenClass}${hiddenClass}${tokenHiddenClass}${selectedClass}${activeClass}${ghostClass}"${idAttr} style="--x:${token.x};--y:${token.y};--w:${tokenW};--h:${tokenH};--z:${Number(token.zIndex || 2)};--tz:${tz}px;--portrait-size:${portraitSize}px;--color:${escapeHtml(baseColor)};--token-image:${tokenImage};${containerEffectStyle}">
      ${baseFogHtml}
      ${token.kind === "light" ? `<i class="bi bi-lightbulb-fill map-token-2d-light-icon"></i>` : ""}
      ${portraitHtml}
      <div class="text-center">
        <div class="token-label">${escapeHtml(shortLabel)}</div>
      </div>
    </div>
  `;
}

// Dragging the zoom slider used to call setMapZoom() on every single
// "input" tick -- resampling the whole map background image (2D) or
// rebuilding the full 3D terrain (3D) as often as the input fired,
// which can be more than once per animation frame on a fast/high-
// frequency drag. That's what caused the visible flicker on the big
// ground layer (individual height-shape floors are tiny by comparison
// and never showed it). Throttling those same calls to once per rAF
// frame still did that expensive work on every frame, which just
// traded flicker for a stutter/"shaking" feel.
//
// Instead, dragging only applies a cheap GPU transform: scale() to
// whatever is *already* rendered -- the same trick apps that show a
// blurry placeholder use while the real tile renders elsewhere -- and
// the real, expensive setMapZoom() only runs once the drag settles
// (a short pause) or ends (slider release), via commitZoomPreview().
// The preview is deliberately allowed to look a little soft/scaled
// during the drag; that's the cost of it being nearly free to update.
const ZOOM_PREVIEW_COMMIT_DELAY_MS = 140;
let zoomPreviewTimer = null;
let zoomPreviewActive = false;

function updateZoomPreview(liveValue) {
  const stage = el("mapStage");
  if (!stage) return;
  if (!zoomPreviewActive) {
    zoomPreviewActive = true;
    const point = mapViewportCenterStagePoint();
    stage.style.transformOrigin = `${point.x}px ${point.y}px`;
    stage.classList.add("zoom-previewing");
  }
  const scale = clamp(Number(liveValue || localGridSize) / localGridSize, 0.2, 5);
  stage.style.setProperty("--zoom-preview-scale", scale);
  clearTimeout(zoomPreviewTimer);
  zoomPreviewTimer = setTimeout(
    () => commitZoomPreview(liveValue),
    ZOOM_PREVIEW_COMMIT_DELAY_MS,
  );
}

function commitZoomPreview(liveValue) {
  clearTimeout(zoomPreviewTimer);
  zoomPreviewTimer = null;
  const stage = el("mapStage");
  if (stage) {
    stage.classList.remove("zoom-previewing");
    stage.style.transformOrigin = "";
    stage.style.removeProperty("--zoom-preview-scale");
  }
  zoomPreviewActive = false;
  setMapZoom(liveValue);
}

function updateMapStageTransformOrigin() {
  const stage = el("mapStage");
  if (!stage) return;
  if (!view3DMode && !zoomPreviewActive) {
    stage.style.transformOrigin = "";
    return;
  }
  const point = mapViewportCenterStagePoint();
  stage.style.transformOrigin = `${point.x}px ${point.y}px`;
}

function setMapZoom(value, { render = true } = {}) {
  const centerRatio = mapViewportCenterRatio();
  updateMapStageTransformOrigin();
  localGridSize = clamp(Number(value || 48), 12, 96);
  sessionStorage.setItem("pf_map_grid_size", String(localGridSize));
  el("gridSize").value = localGridSize;
  el("mapZoom").value = localGridSize;
  el("mapZoomValue").textContent = `${localGridSize}px`;
  if (render) {
    if (view3DMode || heightEditMode) {
      renderAll(false);
    } else {
      applyMapStageVars();
    }
    requestAnimationFrame(() => {
      scrollMapViewportToRatio(centerRatio);
      updateMapStageTransformOrigin();
    });
  }
}

function render3DTokenBillboards(tokens) {
  const wrap = el("mapStageWrap");
  let layer = el("token3DBillboardLayer");
  if (!wrap) return;
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "token3DBillboardLayer";
    layer.className = "token-3d-billboard-layer";
    wrap.appendChild(layer);
  }
  if (!view3DMode || heightEditMode) {
    layer.innerHTML = "";
    layer.classList.add("d-none");
    return;
  }
  if (!hovered3DTokenId) {
    layer.innerHTML = "";
    layer.classList.add("d-none");
    return;
  }
  const token = tokens.find((entry) => entry.id === hovered3DTokenId);
  if (!token) {
    layer.innerHTML = "";
    layer.classList.add("d-none");
    return;
  }
  layer.classList.remove("d-none");
  const wrapRect = wrap.getBoundingClientRect();
  const node = wrap.querySelector(
    `.map-token[data-map-id="${CSS.escape(token.id)}"]`,
  );
  if (!node) {
    layer.innerHTML = "";
    layer.classList.add("d-none");
    return;
  }
  const rect = node.getBoundingClientRect();
  const centerX = rect.left - wrapRect.left + wrap.scrollLeft + rect.width / 2;
  const centerY = rect.top - wrapRect.top + wrap.scrollTop + rect.height / 2;
  const tokenBasePx =
    Math.min(Number(token.w || 1), Number(token.h || 1)) *
    Number(localGridSize || 48);
  const size = Math.round(clamp(tokenBasePx * 1.35, 56, 128));
  layer.innerHTML = render3DTokenHover(token, centerX, centerY, size);
}

function schedule3DTokenBillboards() {
  if (tokenBillboardFrame) return;
  tokenBillboardFrame = requestAnimationFrame(() => {
    tokenBillboardFrame = 0;
    render3DTokenBillboards(current3DRenderTokens);
  });
}

function token3DGrayscaleFromContext(token) {
  if (
    !shapeFogRenderContext?.active ||
    !shapeFogRenderContext.limitedCircles.length
  ) {
    return false;
  }
  const center = tokenCenter(token);
  const gx = Math.floor(center.x);
  const gy = Math.floor(center.y);
  return shapeFogRenderContext.limitedCircles.some(
    (circle) => flatRevealStrengthAtCell(circle, gx, gy) > 0.02,
  );
}

function render3DTokenHover(token, centerX, centerY, portraitSize) {
  const hoverName =
    token.kind === "character" || token.kind === "token" || (token.kind === "enemy" && isGm)
      ? displayTokenName(token)
      : "";
  if (!hoverName) return "";
  const hoverHp =
    token.kind === "character"
      ? tokenHpText(token)
      : token.kind === "enemy" && isGm
        ? `${tokenCurrentHp(token) || "?"}/${tokenTotalHp(token) || "?"} HP`
        : "";
  return `
    <div class="token-3d-hover-card" style="left:${centerX}px;top:${centerY - portraitSize / 2 - 8}px;">
      <div class="token-hover-name">${escapeHtml(hoverName)}</div>
      ${hoverHp ? `<div class="token-hover-hp">${escapeHtml(hoverHp)}</div>` : ""}
    </div>
  `;
}

function set3DViewVars({
  preserveCenter = true,
  updateOrigin = preserveCenter,
} = {}) {
  const centerRatio = preserveCenter ? mapViewportCenterRatio() : null;
  const stage = el("mapStage");
  if (!stage) return;
  if (updateOrigin) updateMapStageTransformOrigin();
  const angle = Number(el("map3DAngle")?.value || 55);
  const rotate = Number(el("map3DRotate")?.value || 0);
  stage.style.setProperty("--map-3d-angle", `${angle}deg`);
  stage.style.setProperty("--map-3d-rotate", `${rotate}deg`);
  stage.style.setProperty("--map-3d-angle-inverse", `${-angle}deg`);
  stage.style.setProperty("--map-3d-rotate-inverse", `${-rotate}deg`);
  document.documentElement.style.setProperty("--map-dpad-rotation", `${rotate}deg`);
  if (view3DMode && !heightEditMode) {
    schedule3DTokenBillboards();
  }
  if (centerRatio) {
    requestAnimationFrame(() => {
      scrollMapViewportToRatio(centerRatio);
      updateMapStageTransformOrigin();
    });
  }
}

function renderOwnTokenFogReveal(visibleTokens) {
  if (isGm || !state.fog?.visible) return "";
  return visibleTokens
    .filter((token) => token.ownerId === currentUserId)
    .map((token) => renderToken(token, { ghost: true }))
    .join("");
}

function hideTokenHover() {
  hovered3DTokenId = "";
  if (view3DMode && !heightEditMode) {
    render3DTokenBillboards(current3DRenderTokens);
  }
  const layer = el("tokenHoverLayer");
  if (layer) layer.innerHTML = "";
}

function showTokenHover(tokenId) {
  if (view3DMode && !heightEditMode) {
    hovered3DTokenId = tokenId;
    el("tokenHoverLayer") && (el("tokenHoverLayer").innerHTML = "");
    render3DTokenBillboards(current3DRenderTokens);
    return;
  }
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

function shapeMaskSignature(shape) {
  return [
    shape.shape || "rect",
    Number(shape.w || 2),
    Number(shape.h || 2),
    Array.isArray(shape.cells) ? shape.cells.join("|") : "",
  ].join("::");
}

function shapeMask(shape) {
  const signature = shapeMaskSignature(shape);
  const cached = shapeMaskCache.get(shape);
  if (cached?.signature === signature) return cached.mask;
  const cols = Math.max(1, Number(shape.w || 2));
  const rows = Math.max(1, Number(shape.h || 2));
  const occupied = new Set();
  if (shape.shape !== "circle") {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) occupied.add(`${x},${y}`);
    }
    const mask = { cols, rows, occupied };
    shapeMaskCache.set(shape, { signature, mask });
    return mask;
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
  const mask = { cols, rows, occupied };
  shapeMaskCache.set(shape, { signature, mask });
  return mask;
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
  // The arrow is the primary "raised vs. sunken" signal (a dashed vs.
  // dotted border, the only distinction this used to have, was too
  // subtle to notice at a glance) -- see the hazard-stripe pit fill in
  // css/map.css for the second, harder-to-miss one.
  if (value > 0) return `▲ +${value} ft`;
  if (value < 0) return `▼ ${value} ft`;
  return `${value} ft`;
}

function showMapToast(message) {
  let container = el("mapToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "mapToastContainer";
    container.className = "map-toast-container";
    document.body.appendChild(container);
  }
  container.innerHTML = `<div class="map-toast">${escapeHtml(message)}</div>`;
  clearTimeout(mapToastTimer);
  mapToastTimer = setTimeout(() => {
    container.innerHTML = "";
  }, 2200);
}

function shapeDepth(shape) {
  const rawDepth = Number(shape?.d || 0);
  return Math.max(
    shape?.texture ? 1 : 0,
    Number.isFinite(rawDepth) ? rawDepth : 0,
  );
}

function enforceShapeDepthMinimum(shape, input = null) {
  if (!shape?.shape || !shape.texture || Number(shape.d || 0) >= 1) return false;
  shape.d = 1;
  if (input) input.value = "1";
  showMapToast("Textured shapes need at least 1 height.");
  return true;
}

function renderShape3DTextureSprite(texture, depth) {
  const rows = Math.max(1, Math.round(Number(depth || 1)));
  const virtualMask = {
    cols: 1,
    rows,
    occupied: new Set(Array.from({ length: rows }, (_, row) => `0,${row}`)),
  };
  return Array.from({ length: rows }, (_, row) => {
    const tile = tilePosition(
      shapeTileIndex({ shape: "rect" }, virtualMask, 0, row),
    );
    return `<span class="shape-3d-sprite-segment texture-cell" style="background-image:url('${cssUrl(texture.url)}');--tile-x:${tile.x};--tile-y:${tile.y};"></span>`;
  }).join("");
}

function shape3DCellFogState(shape, gx, gy, depth) {
  const context = shapeFogRenderContext;
  if (!context?.active) return { opacity: 0, grayscale: false };
  const targetFeet =
    surfaceFeetAtCell(gx, gy) + Math.max(0, Number(depth || 0)) * 5;
  const revealStrength = fogRevealStrengthAt3DPoint(
    gx + 0.5,
    gy + 0.5,
    targetFeet,
    gx,
    gy,
    context.limitedCircles,
    context.lightCircles,
  );
  const opacity = (isGm ? 0.45 : 1) * (1 - revealStrength);
  const grayscale = context.limitedCircles.some(
    (circle) => flatRevealStrengthAtCell(circle, gx, gy) > 0.02,
  );
  return { opacity, grayscale };
}

function renderShape3DFogOverlay(fogState) {
  if (!shapeFogRenderContext?.active || fogState.opacity <= 0.01) return "";
  return `<span class="shape-3d-fog" style="background:${fogColorWithOpacity(shapeFogRenderContext.color, fogState.opacity)};"></span>`;
}

function shape3DSpriteFogStyle(fogState) {
  if (!shapeFogRenderContext?.active) return "";
  const visibleOpacity = clamp(1 - fogState.opacity, 0, 1);
  const grayscaleFilter = fogState.grayscale ? "grayscale(1) contrast(1.75)" : "";
  return [
    `opacity:${visibleOpacity};`,
    grayscaleFilter
      ? `filter:${grayscaleFilter};-webkit-filter:${grayscaleFilter};`
      : "",
  ].join("");
}

// A Height Layer region is either a plain rect (from "Add Height
// Region") or a freeform set of painted cells (from "Draw Height
// Region" -- see endPaintHeightShape()). The two need different
// markup: a rect is one positioned box; a painted shape mirrors
// renderShape()'s circle/texture handling -- one cell per occupied
// square within the bounding box, everything else left empty -- so an
// L-shaped or diagonal paint stroke actually looks like one.
function renderHeightShape(shape) {
  const selectedClass = shape.id === selectedId ? " selected" : "";
  const editingClass = shape.id === heightEditingShapeId ? " editing" : "";
  const pitClass = Number(shape.heightFeet || 0) < 0 ? " pit" : "";
  const label = `<span class="map-height-shape-label">${heightFeetLabel(shape.heightFeet)}</span>`;
  if (Array.isArray(shape.cells)) {
    const occupied = new Set(shape.cells);
    const cols = Math.max(1, Number(shape.w || 1));
    const rows = Math.max(1, Number(shape.h || 1));
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const isOccupied = occupied.has(`${x},${y}`);
        cells.push(
          isOccupied
            ? `<span class="height-shape-cell${!occupied.has(`${x},${y - 1}`) ? " edge-n" : ""}${!occupied.has(`${x},${y + 1}`) ? " edge-s" : ""}${!occupied.has(`${x - 1},${y}`) ? " edge-w" : ""}${!occupied.has(`${x + 1},${y}`) ? " edge-e" : ""}"></span>`
            : `<span></span>`,
        );
      }
    }
    return `
      <div class="map-shape map-height-shape height-shape-grid${pitClass}${selectedClass}${editingClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${cols};--h:${rows};--z:2;--shape-cols:${cols};--shape-rows:${rows};--color:${escapeHtml(shape.color || "#61dafb")};">
        ${cells.join("")}
        ${label}
      </div>
    `;
  }
  return `<div class="map-shape map-height-shape${pitClass}${selectedClass}${editingClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${shape.w || 2};--h:${shape.h || 2};--z:2;--color:${escapeHtml(shape.color || "#61dafb")};">
    ${label}
    ${resizeHandlesHtml(shape.id)}
  </div>`;
}

function renderShape(shape) {
  const selectedClass = shape.id === selectedId ? " selected" : "";
  const texture = shapeTexture(shape.texture);
  const depth = shapeDepth(shape);
  const mask = shapeMask(shape);
  if (view3DMode && texture && depth > 0 && !heightEditMode) {
    const surfaceZ = feetToPreviewPx(
      tallestHeightFeetUnder(shape.x, shape.y, mask.cols, mask.rows),
    );
    const spriteHtml = renderShape3DTextureSprite(texture, depth);
    const cells = [];
    for (let y = 0; y < mask.rows; y += 1) {
      for (let x = 0; x < mask.cols; x += 1) {
        cells.push(
          mask.occupied.has(`${x},${y}`)
            ? (() => {
                const gx = Number(shape.x || 0) + x;
                const gy = Number(shape.y || 0) + y;
                const fogState = shape3DCellFogState(shape, gx, gy, depth);
                return `<span class="shape-3d-sprite-cell"><span class="shape-3d-sprite" style="${shape3DSpriteFogStyle(fogState)}">${spriteHtml}</span>${renderShape3DFogOverlay(fogState)}</span>`;
              })()
            : "<span></span>",
        );
      }
    }
    return `
      <div class="map-shape shape-grid shape-3d-texture${selectedClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${mask.cols};--h:${mask.rows};--z:${Number(shape.zIndex || 2)};--shape-cols:${mask.cols};--shape-rows:${mask.rows};--color:${escapeHtml(shape.color || "#f0d58c")};--tz:${surfaceZ}px;--shape-sprite-rows:${Math.max(1, Math.round(depth))};">
        ${cells.join("")}
        ${resizeHandlesHtml(shape.id)}
      </div>
    `;
  }
  if (view3DMode && depth > 0 && !heightEditMode) {
    const depthPx = feetToPreviewPx(depth * 5);
    const surfaceZ = feetToPreviewPx(
      tallestHeightFeetUnder(shape.x, shape.y, mask.cols, mask.rows),
    );
    const cells = [];
    for (let y = 0; y < mask.rows; y += 1) {
      for (let x = 0; x < mask.cols; x += 1) {
        const occupied = mask.occupied.has(`${x},${y}`);
        if (!occupied) {
          cells.push("<span></span>");
          continue;
        }
        const gx = Number(shape.x || 0) + x;
        const gy = Number(shape.y || 0) + y;
        const fogState = shape3DCellFogState(shape, gx, gy, depth);
        const fogOverlay = renderShape3DFogOverlay(fogState);
        const sides = [
          ["north", !mask.occupied.has(`${x},${y - 1}`)],
          ["south", !mask.occupied.has(`${x},${y + 1}`)],
          ["east", !mask.occupied.has(`${x + 1},${y}`)],
          ["west", !mask.occupied.has(`${x - 1},${y}`)],
        ]
          .filter(([, visible]) => visible)
          .map(
            ([side]) =>
              `<span class="shape-3d-wall shape-3d-wall-${side}">${fogOverlay}</span>`,
          )
          .join("");
        const topStyle = texture
          ? (() => {
              const tile = tilePosition(shapeTileIndex(shape, mask, x, y));
              return `background-image:url('${cssUrl(texture.url)}');--tile-x:${tile.x};--tile-y:${tile.y};`;
            })()
          : "";
        cells.push(`
          <span class="shape-3d-cell">
            <span class="shape-3d-cell-top-plane">
              <span class="shape-3d-top${texture ? " texture-cell" : ""}" style="${topStyle}">${fogOverlay}</span>
              ${sides}
            </span>
          </span>
        `);
      }
    }
    return `
      <div class="map-shape shape-grid shape-3d${selectedClass}" data-map-id="${escapeHtml(shape.id)}" style="--x:${shape.x};--y:${shape.y};--w:${mask.cols};--h:${mask.rows};--z:${Number(shape.zIndex || 2)};--shape-cols:${mask.cols};--shape-rows:${mask.rows};--color:${escapeHtml(shape.color || "#f0d58c")};--tz:${surfaceZ}px;--shape-depth:${depthPx}px;">
        ${cells.join("")}
        ${resizeHandlesHtml(shape.id)}
      </div>
    `;
  }
  if (texture || shape.shape === "circle") {
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
// 3D Map View (experimental). Tilts the REAL, live #mapStage in
// place -- see toggleView3DMode() -- rather than a separate snapshot.
// Height Layer regions render as raised/sunken terrain alongside the
// normal tokens/shapes, which keep their existing drag/select/
// context-menu wiring since they're the same DOM elements as always.
//
// Every region in state.heightShapes (see toggleHeightEditMode())
// becomes a block:
// - its top/floor face is the map texture cropped to that region's
//   footprint, floating at translateZ(feet-to-px(heightFeet))
// - raised walls connect the top face back down to ground; pit walls
//   hinge from ground level and fold down to the sunken floor
// Circles and textured shapes were never an option here -- Height
// Layer regions are always plain rects (see addHeightShape()).
//
// Overlapping height regions aren't reconciled into a proper
// heightfield (no adjacency/merging) -- each block is just an
// independent floating platform. Fine for the common case (a
// raised dais, a cliff ledge, a pit) but two overlapping blocks will
// visibly clip through each other rather than blend.
// ---------------------------------------------------------------
// 1 height unit = 5ft (a standard humanoid's height, per the Height
// Region panel) = this many px of translateZ at the reference cell
// size below. Scaled by the current zoom (localGridSize) rather than
// fixed, so a region keeps the same footprint-to-height proportions
// whether cells are rendering at the 48px default or all the way down
// to mobile's 12px minimum -- a fixed px-per-5ft looked fine at the
// default zoom but towered unnaturally once the footprint shrank with
// zoom and the height didn't.
const MAP_3D_PX_PER_5FT = 32;
const MAP_3D_REFERENCE_CELL_PX = 48;

function feetToPreviewPx(feet) {
  const scale =
    Number(localGridSize || MAP_3D_REFERENCE_CELL_PX) /
    MAP_3D_REFERENCE_CELL_PX;
  return (Number(feet || 0) / 5) * MAP_3D_PX_PER_5FT * scale;
}

// True if `shape`'s footprint (rect, or the absolute cells of a
// freeform paint) shares any cell with the x/y/w/h footprint given.
function shapeOverlapsFootprint(shape, x, y, w, h) {
  const sx = Number(shape.x || 0);
  const sy = Number(shape.y || 0);
  if (Array.isArray(shape.cells)) {
    return shape.cells.some((key) => {
      const [dx, dy] = key.split(",").map(Number);
      const gx = sx + dx;
      const gy = sy + dy;
      return gx >= x && gx < x + w && gy >= y && gy < y + h;
    });
  }
  const sw = Number(shape.w || 1);
  const sh = Number(shape.h || 1);
  return sx < x + w && sx + sw > x && sy < y + h && sy + sh > y;
}

function setHeightGridCell(grid, cols, rows, gx, gy, feet) {
  if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return;
  const index = gy * cols + gx;
  if (feet > grid[index]) grid[index] = feet;
}

function heightCellGridSignature() {
  const { cols, rows } = state.settings;
  return [
    Number(cols || 0),
    Number(rows || 0),
    state.heightShapes.map(heightShapeRenderSignature).join("||"),
  ].join("::");
}

function heightCellGrid() {
  const cols = Number(state.settings.cols || 0);
  const rows = Number(state.settings.rows || 0);
  const signature = heightCellGridSignature();
  if (
    heightCellGridCache.signature === signature &&
    heightCellGridCache.cols === cols &&
    heightCellGridCache.rows === rows
  ) {
    return heightCellGridCache.grid;
  }

  const grid = new Float32Array(Math.max(0, cols * rows));
  state.heightShapes.forEach((shape) => {
    const feet = Number(shape.heightFeet || 0);
    if (feet <= 0) return;
    const sx = Number(shape.x || 0);
    const sy = Number(shape.y || 0);
    if (Array.isArray(shape.cells)) {
      shape.cells.forEach((key) => {
        const [dx, dy] = key.split(",").map(Number);
        setHeightGridCell(grid, cols, rows, sx + dx, sy + dy, feet);
      });
      return;
    }
    const startX = Math.floor(sx);
    const startY = Math.floor(sy);
    const endX = Math.ceil(sx + Number(shape.w || 1));
    const endY = Math.ceil(sy + Number(shape.h || 1));
    for (let gy = startY; gy < endY; gy += 1) {
      for (let gx = startX; gx < endX; gx += 1) {
        setHeightGridCell(grid, cols, rows, gx, gy, feet);
      }
    }
  });
  heightCellGridCache = { signature, cols, rows, grid };
  return grid;
}

function heightFeetAtCell(gx, gy) {
  const cols = Number(state.settings.cols || 0);
  const rows = Number(state.settings.rows || 0);
  if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return 0;
  return heightCellGrid()[gy * cols + gx] || 0;
}

// Tokens aren't part of the Height Layer and get no block/wall
// treatment of their own in the 3D preview -- they're just placed
// (flat, no tilt of their own beyond the whole scene's) at the
// elevation of the tallest height region their footprint overlaps, so
// they visibly stand on top of a platform instead of floating at
// ground level cutting through it. Ground level (no region beneath,
// or every region beneath is a pit) is 0.
function tallestHeightFeetUnder(x, y, w, h) {
  const startX = Math.floor(Number(x || 0));
  const startY = Math.floor(Number(y || 0));
  const endX = Math.ceil(Number(x || 0) + Number(w || 1));
  const endY = Math.ceil(Number(y || 0) + Number(h || 1));
  let tallest = 0;
  for (let gy = startY; gy < endY; gy += 1) {
    for (let gx = startX; gx < endX; gx += 1) {
      tallest = Math.max(tallest, heightFeetAtCell(gx, gy));
    }
  }
  return tallest;
}

// A token's stored `elevationFeet` is relative to whatever's beneath
// it, not an absolute world height -- 0 (the default) always means
// "resting on the surface below," whatever that surface happens to
// be, so an ordinary token never needs to be re-set every time it
// walks from open ground onto a platform. Only a nonzero value (set
// deliberately, e.g. for a flying enemy) offsets it above/below that
// surface. Returns the token's own translateZ px (for renderToken()'s
// --tz) plus the surface's, for render3DFlightConnector().
function token3DHeights(token) {
  const surfaceFeet = tallestHeightFeetUnder(
    Number(token.x || 0),
    Number(token.y || 0),
    Number(token.w || 1),
    Number(token.h || 1),
  );
  const elevationFeet = Number(token.elevationFeet || 0);
  return {
    tz: feetToPreviewPx(surfaceFeet + elevationFeet),
    surfaceZ: feetToPreviewPx(surfaceFeet),
    elevationFeet,
  };
}

// The "is this token flying" line: a token whose actual Z isn't the
// same as the surface directly beneath it gets a pole running from
// its own height straight down (or up) to that surface, so it's
// obvious at a glance that it's off the ground/platform rather than
// just badly aligned with it.
function render3DFlightConnector(token) {
  const { tz, surfaceZ, elevationFeet } = token3DHeights(token);
  if (elevationFeet === 0) return "";
  const cell = Number(localGridSize || 48);
  const x = Number(token.x || 0) * cell;
  const y = Number(token.y || 0) * cell;
  const w = Number(token.w || 1) * cell;
  const h = Number(token.h || 1) * cell;
  const poleLenPx = Math.abs(tz - surfaceZ);
  // Hinged at the token's own height (tz) and folded toward the
  // surface -- same "fold down to reach a lower Z" trick the height
  // blocks' walls use, just pointed whichever way the surface
  // actually is.
  const foldClass = tz < surfaceZ ? " fold-up" : "";
  return `
    <div class="map-3d-flight-anchor" data-flight-token-id="${escapeHtml(token.id)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:translateZ(${tz}px);">
      <div class="map-3d-flight-pole${foldClass}" style="height:${poleLenPx}px;"></div>
      <div class="map-3d-flight-anchor-mark" style="transform:translateZ(${surfaceZ - tz}px);"></div>
    </div>
  `;
}

function heightShapeRenderSignature(shape) {
  return [
    shape.id || "",
    Number(shape.x || 0),
    Number(shape.y || 0),
    Number(shape.w || 1),
    Number(shape.h || 1),
    Number(shape.heightFeet || 0),
    shape.pattern || "",
    Array.isArray(shape.cells) ? shape.cells.join("|") : "",
  ].join("::");
}

function sortedHeightBlocks() {
  const signature = state.heightShapes.map(heightShapeRenderSignature).join("||");
  if (sortedHeightShapesCache.signature === signature) {
    return sortedHeightShapesCache.blocks;
  }
  const blocks = state.heightShapes
    .filter((shape) => Number(shape.heightFeet) !== 0)
    // Draw shortest-magnitude first so a small block nested in a much
    // taller one's footprint still ends up on top in the DOM (paint
    // order matters less with preserve-3d's real depth sorting, but
    // keeping it sane costs nothing).
    .slice()
    .sort((a, b) => Math.abs(a.heightFeet) - Math.abs(b.heightFeet));
  sortedHeightShapesCache = { signature, blocks };
  return blocks;
}

// Ground layer + all raised/sunken block terrain, sized to the
// CURRENT cell size (localGridSize) so it lines up exactly with
// token/shape positioning (--x/--y/--cell), which uses the same
// value. Returns HTML to prepend to the stage's normal content.
function render3DTerrainHtml() {
  const { cols, rows, backgroundUrl } = state.settings;
  if (!backgroundUrl) return "";
  const cellPx = Number(localGridSize || 48);
  const mapW = Number(cols || 0) * cellPx;
  const mapH = Number(rows || 0) * cellPx;

  // Single-quoted url() -- this gets embedded inside a double-quoted
  // HTML style="..." attribute below (built via innerHTML, unlike
  // stage.style.setProperty's background-image elsewhere in this
  // file, which goes through the CSSOM directly and never has this
  // problem).
  const bgCss = `url('${cssUrl(backgroundUrl)}')`;
  const backgroundStack = `${MAP_GRID_LINES_CSS},${bgCss}`;
  const backgroundSize = [
    `${cellPx}px ${cellPx}px`,
    `${cellPx}px ${cellPx}px`,
    `${mapW}px ${mapH}px`,
  ].join(",");
  const terrainBackgroundStyle = (x = 0, y = 0) =>
    `background-image:${backgroundStack};background-size:${backgroundSize};background-position:0 0,0 0,-${x}px -${y}px;background-repeat:repeat,repeat,no-repeat;`;
  const blocks = sortedHeightBlocks();

  // A raised block naturally sits in front of the base plate (it's
  // closer to the camera) so it's visible with no extra work. A pit
  // is the opposite: its floor is farther from the camera than the
  // base plate at that same x/y, so the base needs a real transparent
  // cutout there. This is the same masked-base approach used by the
  // original pushed 3D Preview modal, where the bitmap was known to
  // render correctly.
  const pitCutouts = blocks
    .filter((shape) => Number(shape.heightFeet) < 0)
    .flatMap((shape) => {
      const sx = Number(shape.x || 0);
      const sy = Number(shape.y || 0);
      if (Array.isArray(shape.cells)) {
        return shape.cells.map((key) => {
          const [dx, dy] = key.split(",").map(Number);
          return { gx: sx + dx, gy: sy + dy, gw: 1, gh: 1 };
        });
      }
      return [{ gx: sx, gy: sy, gw: Number(shape.w || 1), gh: Number(shape.h || 1) }];
    });
  const baseMaskCss = pitCutouts.length
    ? (() => {
        const holes = pitCutouts
          .map(
            ({ gx, gy, gw, gh }) =>
              `<rect x="${gx * cellPx}" y="${gy * cellPx}" width="${gw * cellPx}" height="${gh * cellPx}" fill="black"/>`,
          )
          .join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapW}" height="${mapH}"><mask id="pitHoles"><rect width="100%" height="100%" fill="white"/>${holes}</mask><rect width="100%" height="100%" fill="white" mask="url(#pitHoles)"/></svg>`;
        const maskUrl = `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
        return `mask-image:${maskUrl};-webkit-mask-image:${maskUrl};mask-size:${mapW}px ${mapH}px;-webkit-mask-size:${mapW}px ${mapH}px;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;`;
      })()
    : "";

  // Same faint per-cell grid the 2D stage draws (see .map-stage in
  // css/map.css) -- two repeating 1px hairline gradients stacked on
  // top of the actual art. Reused here (base plate + every block's
  // top face) so cells stay visible on tilted terrain too.
  const fogVisible = Boolean(state.fog?.visible);
  const terrainLimitedCircles = fogVisible ? limitedViewRevealCircles() : [];
  const terrainLightCircles = fogVisible ? lightRevealCircles() : [];
  const terrainFogColor = state.fog?.color || "#000000";
  // Each cell/block is its own independently-positioned element (see
  // blockHtmlAt() below), so gx*cellPx boundaries between neighbors
  // don't always land on whole device pixels -- a fog cell sized to
  // exactly match its own cell can leave a hairline sub-pixel gap at
  // the seam with the next one, which read as a bright, un-fogged
  // line tracing every cell/shape boundary once the fog itself goes
  // fully opaque. Overdrawing each fog cell by a little in every
  // direction makes neighbors overlap instead of merely touch, which
  // papers over that gap (harmless: they're flat, single-color, so an
  // overlapped seam looks identical to a clean one).
  const FOG_CELL_OVERDRAW_PX = 1;
  const renderSurfaceFogCells = (gx, gy, gw, gh) => {
    if (!fogVisible) return "";
    let fogHtml = "";
    for (let localY = 0; localY < gh; localY += 1) {
      for (let localX = 0; localX < gw; localX += 1) {
        const opacity = fogOpacityAt3DCell(
          gx + localX,
          gy + localY,
          terrainLimitedCircles,
          terrainLightCircles,
        );
        if (opacity <= 0.02) continue;
        const left = localX * cellPx - FOG_CELL_OVERDRAW_PX;
        const top = localY * cellPx - FOG_CELL_OVERDRAW_PX;
        const size = cellPx + FOG_CELL_OVERDRAW_PX * 2;
        fogHtml += `<div class="map-3d-surface-fog-cell" style="left:${left}px;top:${top}px;width:${size}px;height:${size}px;background:${fogColorWithOpacity(terrainFogColor, opacity)};"></div>`;
      }
    }
    return fogHtml;
  };

  // 2D's Special Vision circle (.map-limited-view-grayscale in
  // css/map.css) is one big backdrop-filter'd circle sitting above the
  // fog layer -- there's no equivalent single flat layer to lay over a
  // tilted 3D scene, so this mirrors renderSurfaceFogCells() instead:
  // one small backdrop-filter'd quad per cell, nested in the same
  // tilted coordinate frame as the terrain it needs to sit on top of.
  // Unconditional within a limited-view circle regardless of whether a
  // light also reaches that cell, same as the 2D version -- special
  // vision reads as black-and-white even where a torch is also
  // burning.
  const limitedViewStrengthAtCell = (gx, gy) =>
    terrainLimitedCircles.reduce(
      (max, circle) => Math.max(max, flatRevealStrengthAtCell(circle, gx, gy)),
      0,
    );
  // A cell is either inside a Special Vision circle or it isn't -- the
  // 2D circle (.map-limited-view-grayscale) is one constant-strength
  // backdrop-filter with a crisp border-radius:50% edge, no fade. This
  // used to scale grayscale()/contrast() down by the same soft-edge
  // falloff fog uses, but that falloff covers most of a circle's AREA
  // (a ring near the radius is most of a circle, geometrically), so
  // nearly the whole thing ended up close enough to strength 0 to
  // still read as "in color" -- constant full-strength inside the
  // threshold, same as 2D, fixes that.
  const GRAYSCALE_FILTER = "grayscale(1) contrast(1.75)";
  const renderSurfaceGrayscaleCells = (gx, gy, gw, gh) => {
    if (!fogVisible || !terrainLimitedCircles.length) return "";
    let html = "";
    for (let localY = 0; localY < gh; localY += 1) {
      for (let localX = 0; localX < gw; localX += 1) {
        const strength = limitedViewStrengthAtCell(gx + localX, gy + localY);
        if (strength <= 0.02) continue;
        const globalX = (gx + localX) * cellPx;
        const globalY = (gy + localY) * cellPx;
        html += `<div class="map-3d-surface-grayscale-cell" style="left:${localX * cellPx}px;top:${localY * cellPx}px;width:${cellPx}px;height:${cellPx}px;${terrainBackgroundStyle(globalX, globalY)}filter:${GRAYSCALE_FILTER};-webkit-filter:${GRAYSCALE_FILTER};"></div>`;
      }
    }
    return html;
  };

  const groundHtml = `
    <div class="map-3d-base" style="width:${mapW}px;height:${mapH}px;${terrainBackgroundStyle()}${baseMaskCss}">
      ${renderSurfaceGrayscaleCells(0, 0, Number(cols || 0), Number(rows || 0))}
      ${renderSurfaceFogCells(0, 0, Number(cols || 0), Number(rows || 0))}
    </div>
  `;
  // How dark a wall segment should read: the strongest reveal strength
  // among the cells it separates (itself + its outward neighbor), same
  // per-cell math the ground/top-face fog cells use. NOTE: this only
  // ever *tints* a wall -- it must never be used to skip rendering the
  // wall outright. A block's top face has backface-visibility:visible
  // (see .map-3d-block-top in css/map.css) so it stays legible at
  // extreme spin angles; omitting a wall when its area is unrevealed
  // used to leave a gap there, and looking through that gap exposed
  // the top face's own *backface* -- its terrain art bitmap, mirrored
  // -- which read as "the wall gained a background texture" that
  // came and went with whatever the light's position/radius currently
  // revealed. Always keeping the wall in the DOM (just darkened) seals
  // that gap.
  const wallFogOpacity = (gx, gy, gw, gh, side) => {
    if (!fogVisible) return 0;
    const strengthAt = (x, y) =>
      fogRevealStrengthAtCell(x, y, terrainLimitedCircles, terrainLightCircles);
    let maxStrength = 0;
    if (side === "north") {
      for (let x = gx; x < gx + gw; x += 1) {
        maxStrength = Math.max(maxStrength, strengthAt(x, gy), strengthAt(x, gy - 1));
      }
    } else if (side === "south") {
      for (let x = gx; x < gx + gw; x += 1) {
        maxStrength = Math.max(
          maxStrength,
          strengthAt(x, gy + gh - 1),
          strengthAt(x, gy + gh),
        );
      }
    } else if (side === "west") {
      for (let y = gy; y < gy + gh; y += 1) {
        maxStrength = Math.max(maxStrength, strengthAt(gx, y), strengthAt(gx - 1, y));
      }
    } else if (side === "east") {
      for (let y = gy; y < gy + gh; y += 1) {
        maxStrength = Math.max(
          maxStrength,
          strengthAt(gx + gw - 1, y),
          strengthAt(gx + gw, y),
        );
      }
    }
    return (isGm ? 0.45 : 1) * (1 - maxStrength);
  };

  // Wall counterpart to renderSurfaceGrayscaleCells()'s per-cell
  // grayscale -- same "strongest of the two cells this edge
  // separates" shape as wallFogOpacity() above, but using only
  // Special Vision circles (limitedViewStrengthAtCell), since this is
  // the unconditional-within-the-circle effect, not fog reveal.
  const wallGrayscaleStrength = (gx, gy, gw, gh, side) => {
    if (!fogVisible || !terrainLimitedCircles.length) return 0;
    let maxStrength = 0;
    if (side === "north") {
      for (let x = gx; x < gx + gw; x += 1) {
        maxStrength = Math.max(
          maxStrength,
          limitedViewStrengthAtCell(x, gy),
          limitedViewStrengthAtCell(x, gy - 1),
        );
      }
    } else if (side === "south") {
      for (let x = gx; x < gx + gw; x += 1) {
        maxStrength = Math.max(
          maxStrength,
          limitedViewStrengthAtCell(x, gy + gh - 1),
          limitedViewStrengthAtCell(x, gy + gh),
        );
      }
    } else if (side === "west") {
      for (let y = gy; y < gy + gh; y += 1) {
        maxStrength = Math.max(
          maxStrength,
          limitedViewStrengthAtCell(gx, y),
          limitedViewStrengthAtCell(gx - 1, y),
        );
      }
    } else if (side === "east") {
      for (let y = gy; y < gy + gh; y += 1) {
        maxStrength = Math.max(
          maxStrength,
          limitedViewStrengthAtCell(gx + gw - 1, y),
          limitedViewStrengthAtCell(gx + gw, y),
        );
      }
    }
    return maxStrength;
  };

  // A raised block's walls hinge at the top face and fold down to
  // ground. A pit is the mirror image: its floor face sits below
  // ground, so its walls fold the opposite way to reach back up to
  // Z=0. This matches the original 3D Preview modal.
  // `sides` controls which of the 4 edges actually get a wall -- for
  // a freeform region made of many 1x1 cells, an edge shared with
  // another cell of the SAME region isn't a real boundary and drawing
  // a wall there anyway chops the whole platform up into a
  // distracting grid that reads as "flat textured ground," not "one
  // recessed/raised area." Only the true outer perimeter gets one.
  function blockHtmlAt(gx, gy, gw, gh, z, sides, pattern) {
    const x = gx * cellPx;
    const y = gy * cellPx;
    const w = gw * cellPx;
    const h = gh * cellPx;
    const wallPx = Math.abs(z);
    const faceStyle = terrainBackgroundStyle(x, y);
    const pitClass = z < 0 ? " pit" : "";
    // A region can opt into a textured wall (see scripts/wall-patterns.js
    // + the Height Region panel's picker) in place of the flat
    // raised/pit gradient .map-3d-wall carries by default -- inline
    // style beats both of those class-based rules, and the same
    // texture applies whether the region is raised or a pit (the
    // material doesn't care which way the wall folds).
    const wallPatternStyle = pattern
      ? window.PFWallPatterns?.backgroundStyle(pattern) || ""
      : "";
    // A wall on the true outer perimeter (per `sides`) always gets
    // rendered -- fog only ever darkens it via a nested tint div, see
    // wallFogOpacity()'s comment for why skipping the element itself
    // is the wrong way to hide an unrevealed wall.
    const wallHtml = (side, sizeStyle) => {
      if (!sides[side]) return "";
      const opacity = wallFogOpacity(gx, gy, gw, gh, side);
      const tint =
        opacity > 0.02
          ? `<div class="map-3d-wall-fog" style="background:${fogColorWithOpacity(terrainFogColor, opacity)};"></div>`
          : "";
      const grayStrength = wallGrayscaleStrength(gx, gy, gw, gh, side);
      const grayTint =
        grayStrength > 0.02
          ? `<div class="map-3d-wall-grayscale"></div>`
          : "";
      return `<div class="map-3d-wall map-3d-wall-${side}" style="${sizeStyle}${wallPatternStyle}">${grayTint}${tint}</div>`;
    };
    return `
      <div class="map-3d-block${pitClass}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;">
        <div class="map-3d-block-top" style="transform:translateZ(${z}px);${faceStyle}">
          ${renderSurfaceGrayscaleCells(gx, gy, gw, gh)}
          ${renderSurfaceFogCells(gx, gy, gw, gh)}
          ${wallHtml("south", `height:${wallPx}px;`)}
          ${wallHtml("north", `height:${wallPx}px;`)}
          ${wallHtml("east", `width:${wallPx}px;`)}
          ${wallHtml("west", `width:${wallPx}px;`)}
        </div>
      </div>
    `;
  }

  const ALL_SIDES = { north: true, south: true, east: true, west: true };

  // Each freeform-painted cell becomes its own separate block (top
  // face + up to 4 walls, each nested transform-style:preserve-3d --
  // see blockHtmlAt()).
  const blockHtml = blocks
    .map((shape) => {
      const z = feetToPreviewPx(shape.heightFeet);
      if (Array.isArray(shape.cells)) {
        // No single rectangle formula covers an arbitrary painted
        // outline, so a freeform region becomes one 1x1 block per
        // occupied cell instead -- same top-face crop math, just run
        // per cell. An edge is only "exposed" (gets a wall) if the
        // neighboring cell isn't part of this same shape -- see
        // blockHtmlAt's comment.
        const cellSet = new Set(shape.cells);
        return shape.cells
          .map((key) => {
            const [dx, dy] = key.split(",").map(Number);
            const gx = Number(shape.x || 0) + dx;
            const gy = Number(shape.y || 0) + dy;
            const sides = {
              north: !cellSet.has(`${dx},${dy - 1}`),
              south: !cellSet.has(`${dx},${dy + 1}`),
              west: !cellSet.has(`${dx - 1},${dy}`),
              east: !cellSet.has(`${dx + 1},${dy}`),
            };
            return blockHtmlAt(gx, gy, 1, 1, z, sides, shape.pattern);
          })
          .join("");
      }
      return blockHtmlAt(
        Number(shape.x || 0),
        Number(shape.y || 0),
        Number(shape.w || 1),
        Number(shape.h || 1),
        z,
        ALL_SIDES,
        shape.pattern,
      );
    })
    .join("");

  return groundHtml + blockHtml;
}

// ---------------------------------------------------------------
// 3D drag/measure support: elementFromPoint()-based cell detection.
// A tilted+spun stage means a raw pixel delta (event.clientX minus a
// remembered start X -- the 2D drag's whole approach, see moveDrag())
// no longer maps linearly to grid cells once rotation is involved.
// Rather than inverting that transform by hand, an invisible grid of
// per-cell hit targets is built (only while a drag/measure is
// actually in progress -- see build3DHitGrid()) and the browser's own
// elementFromPoint() -- which DOES correctly account for the full
// transform stack -- is asked which one the pointer is over.
// ---------------------------------------------------------------
let hit3DGridEl = null;

// The grid cells currently scrolled into view (+ marginCells of
// slack), in map.stage-wrap's own untransformed scroll metrics --
// those aren't affected by #mapStage's own tilt/spin transform (CSS
// transforms are purely visual/paint-time; scrollable overflow is
// computed pre-transform), so this plain 2D math is safe to use even
// though the content it's describing is rendered tilted. Shared by
// build3DHitGrid() and render3DTerrainHtml()'s block-count cap --
// both need "what's actually in view" for the same reason: keeping
// the number of live DOM/preserve-3d elements bounded regardless of
// how large the underlying map or how much terrain is painted on it.
function visible3DCellRange(marginCells) {
  const cols = state.settings.cols;
  const rows = state.settings.rows;
  const wrap = el("mapStageWrap");
  const cell = Number(localGridSize || 48);
  // .map-stage-wrap.is-3d carries extra padding on every side (see
  // css/map.css) so there's room to scroll to wherever a tilted/spun
  // map's edges land once they're outside #mapStage's own untransformed
  // box. scrollLeft/scrollTop measure from that padded edge, not from
  // the map content's actual top-left corner, so back the padding back
  // out before converting to cells -- otherwise this creeps the
  // "visible" range off by however many cells the 3D padding is worth
  // (currently several), which would UNDER-count what's in view rather
  // than just over-count it (harmless slack the marginCells below
  // already covers).
  const wrapStyle = getComputedStyle(wrap);
  const padLeft = parseFloat(wrapStyle.paddingLeft) || 0;
  const padTop = parseFloat(wrapStyle.paddingTop) || 0;
  const contentScrollLeft = wrap.scrollLeft - padLeft;
  const contentScrollTop = wrap.scrollTop - padTop;
  return {
    minX: clamp(Math.floor(contentScrollLeft / cell) - marginCells, 0, cols - 1),
    minY: clamp(Math.floor(contentScrollTop / cell) - marginCells, 0, rows - 1),
    maxX: clamp(
      Math.ceil((contentScrollLeft + wrap.clientWidth) / cell) + marginCells,
      0,
      cols - 1,
    ),
    maxY: clamp(
      Math.ceil((contentScrollTop + wrap.clientHeight) / cell) + marginCells,
      0,
      rows - 1,
    ),
  };
}

// Bounded so a large map (up to 300x300, see MAP_SIZE_MAX) never
// generates tens of thousands of hit-test divs: small/medium maps get
// full coverage; a genuinely huge one only gets the scrolled-into-
// view region (+ margin), which is all a drag needs anyway.
const HIT_3D_GRID_MAX_CELLS = 2000;

function hit3DGridRange() {
  const cols = state.settings.cols;
  const rows = state.settings.rows;
  if (cols * rows <= HIT_3D_GRID_MAX_CELLS) {
    return { minX: 0, minY: 0, maxX: cols - 1, maxY: rows - 1 };
  }
  return visible3DCellRange(10);
}

function build3DHitGrid() {
  teardown3DHitGrid();
  const cell = Number(localGridSize || 48);
  const { minX, minY, maxX, maxY } = hit3DGridRange();
  const container = document.createElement("div");
  container.id = "hit3DGrid";
  let html = "";
  for (let gy = minY; gy <= maxY; gy++) {
    for (let gx = minX; gx <= maxX; gx++) {
      // +2px over the visible terrain surface -- purely so this
      // (invisible) cell wins elementFromPoint() ties against the
      // real terrain top face sitting at the exact same Z, not a
      // visible offset.
      const z = feetToPreviewPx(tallestHeightFeetUnder(gx, gy, 1, 1)) + 2;
      html += `<div class="map-3d-hit-cell" data-gx="${gx}" data-gy="${gy}" style="left:${gx * cell}px;top:${gy * cell}px;width:${cell}px;height:${cell}px;transform:translateZ(${z}px);"></div>`;
    }
  }
  container.innerHTML = html;
  hit3DGridEl = container;
  el("mapStage").appendChild(hit3DGridEl);
}

// renderMap() rebuilds #mapStage.innerHTML from scratch on every move
// (see moveDrag()), which would otherwise lose this grid every time --
// it re-appends hit3DGridEl itself when one exists, so nothing needs
// to call this explicitly except at the end of a drag/measure.
function teardown3DHitGrid() {
  hit3DGridEl?.remove();
  hit3DGridEl = null;
}

function cell3DFromPoint(clientX, clientY) {
  const found = (document.elementsFromPoint?.(clientX, clientY) || [
    document.elementFromPoint(clientX, clientY),
  ])
    .map((node) => node?.closest?.("[data-gx]"))
    .find(Boolean);
  if (!found) return null;
  return { x: Number(found.dataset.gx), y: Number(found.dataset.gy) };
}

const DPAD_MOVE_COOLDOWN_MS = 150;
const DPAD_JOYSTICK_INTERVAL_MS = 170;
const DPAD_JOYSTICK_DEADZONE_PX = 7;
const DPAD_JOYSTICK_MAX_PX = 15;

function canUseQuickControls(item) {
  return Boolean(item?.kind) && canManageMapItem(item);
}

function moveTokenByDpad(item, dx, dy, { renderPanel = true } = {}) {
  if (dpadMovingIds.has(item.id) || !canManageMapItem(item)) return;
  const maxX = state.settings.cols - (item.w || 1);
  const maxY = state.settings.rows - (item.h || 1);
  const nextX = clamp((item.x || 0) + dx, 0, maxX);
  const nextY = clamp((item.y || 0) + dy, 0, maxY);
  if (nextX === (item.x || 0) && nextY === (item.y || 0)) return;
  item.x = nextX;
  item.y = nextY;
  dpadMovingIds.add(item.id);
  if (renderPanel) {
    renderAll();
  } else {
    renderMap();
    renderAuraEffectToasts();
    renderTurnEffectNotices();
    queueSave();
  }
  scheduleOutOfRangeAuraCleanup(item.id);
  setTimeout(() => {
    dpadMovingIds.delete(item.id);
    if (renderPanel && selectedObject()?.id === item.id) renderSelectedPanel();
    // renderSelectedPanel() only rebuilds the sidebar's own copy of
    // this dpad -- the mobile HUD is a separate element (see
    // renderMobileHud()) that renderMap() normally keeps in sync, but
    // nothing else calls renderMap() once this cooldown ends, so its
    // buttons were staying stuck disabled after the very first tap.
    renderMobileHud();
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
    <div class="dpad-grid${view3DMode && !heightEditMode ? " dpad-grid-rotated" : ""}">
      <div></div>${dpadButton("up", "bi-caret-up-fill", 0, -1)}<div></div>
      ${dpadButton("left", "bi-caret-left-fill", -1, 0)}
      <button type="button" class="dpad-center" data-dpad-joystick aria-label="Drag to move continuously">
        <span></span>
      </button>
      ${dpadButton("right", "bi-caret-right-fill", 1, 0)}
      <div></div>${dpadButton("down", "bi-caret-down-fill", 0, 1)}<div></div>
    </div>
  `;
}

function rotatedDpadVector(event, center) {
  const dx = event.clientX - center.x;
  const dy = event.clientY - center.y;
  const rotate =
    view3DMode && !heightEditMode ? Number(el("map3DRotate")?.value || 0) : 0;
  const radians = (-rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

function dpadDirectionFromVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length < DPAD_JOYSTICK_DEADZONE_PX) return null;
  const nx = vector.x / length;
  const ny = vector.y / length;
  const diagonalThreshold = 0.38;
  let dx = Math.abs(nx) >= diagonalThreshold ? Math.sign(nx) : 0;
  let dy = Math.abs(ny) >= diagonalThreshold ? Math.sign(ny) : 0;
  if (!dx && !dy) {
    if (Math.abs(nx) > Math.abs(ny)) dx = Math.sign(nx);
    else dy = Math.sign(ny);
  }
  return { dx, dy };
}

function setJoystickHandle(centerEl, vector) {
  const length = Math.hypot(vector.x, vector.y);
  const scale = length > DPAD_JOYSTICK_MAX_PX
    ? DPAD_JOYSTICK_MAX_PX / length
    : 1;
  centerEl.style.setProperty("--joystick-x", `${vector.x * scale}px`);
  centerEl.style.setProperty("--joystick-y", `${vector.y * scale}px`);
}

function stopDpadJoystick() {
  if (!dpadJoystickState) return;
  clearInterval(dpadJoystickState.timer);
  dpadJoystickState.centerEl.classList.remove("dragging");
  dpadJoystickState.centerEl.style.removeProperty("--joystick-x");
  dpadJoystickState.centerEl.style.removeProperty("--joystick-y");
  try {
    dpadJoystickState.centerEl.releasePointerCapture(
      dpadJoystickState.pointerId,
    );
  } catch {
    // Pointer capture may already be gone if the panel was rerendered.
  }
  dpadJoystickState = null;
}

function updateDpadJoystick(event) {
  if (!dpadJoystickState || event.pointerId !== dpadJoystickState.pointerId) {
    return;
  }
  const vector = rotatedDpadVector(event, dpadJoystickState.center);
  setJoystickHandle(dpadJoystickState.centerEl, vector);
  dpadJoystickState.direction = dpadDirectionFromVector(vector);
}

function tickDpadJoystick() {
  if (!dpadJoystickState?.direction) return;
  const item = selectedObject();
  if (!item || item.id !== dpadJoystickState.itemId) {
    stopDpadJoystick();
    return;
  }
  moveTokenByDpad(
    item,
    dpadJoystickState.direction.dx,
    dpadJoystickState.direction.dy,
    { renderPanel: false },
  );
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
  // A light's own dedicated side panel (renderLightPanel()) never opens
  // this Quick Controls surface at all, but hardening it here too means
  // nothing else that happens to call quickActionRows() on a light can
  // accidentally surface more than removal.
  if (item.kind === "light") {
    return [["remove", "bi-box-arrow-right", "btn-outline-danger", "Remove from map"]];
  }
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

// The mobile map view's bottom-right HUD -- name, an HP bar, and the
// dpad for whatever's currently selected, always visible (no toggle,
// unlike the sidebar's quick-controls panel) since it's the only
// per-token UI mobile has left once everything else moves into the
// Map Menu modal. Hooked into renderMap() (see its own comment) so it
// never goes stale, not into renderSelectedPanel() -- deliberately,
// see the dpadJoystickState guard below.
function renderMobileHud() {
  const hud = el("mapMobileHud");
  if (!hud) return;
  if (!mapMobileQuery.matches) {
    hud.classList.add("d-none");
    hud.innerHTML = "";
    return;
  }
  // A joystick drag in progress holds a live reference to its own
  // center element (bindDpadControls()'s pointerdown handler) and
  // relies on that exact DOM node surviving the whole drag for pointer
  // capture + setJoystickHandle()'s --joystick-x/y vars to keep
  // working. renderMap() calls this on every joystick tick too (see
  // tickDpadJoystick()), so rebuilding the HUD's innerHTML here mid-
  // drag would yank the joystick out from under an active gesture.
  // Nothing shown here changes during a pure positional drag anyway.
  if (dpadJoystickState) return;
  const item = selectedObject();
  if (!item || item.kind === "light" || !canUseQuickControls(item)) {
    hud.classList.add("d-none");
    hud.innerHTML = "";
    return;
  }
  hud.classList.remove("d-none");
  const currentRaw = tokenCurrentHp(item);
  const totalRaw = tokenTotalHp(item);
  const hasHp = currentRaw !== "" && totalRaw !== "";
  const current = sheetNum(currentRaw, 0);
  const total = Math.max(1, sheetNum(totalRaw, 0));
  const pct = hasHp ? clamp((current / total) * 100, 0, 100) : 0;
  const editableHp = hasHp && canEditTokenHp(item);
  hud.innerHTML = `
    <div class="map-mobile-hud-card">
      <div class="map-mobile-hud-name">${escapeHtml(displayTokenName(item))}</div>
      ${
        hasHp
          ? `<div class="map-mobile-hp-bar">
              <div class="map-mobile-hp-fill" style="width:${pct}%;"></div>
              <div class="map-mobile-hp-text">
                ${
                  editableHp
                    ? `<button data-open-mobile-hp="${escapeHtml(item.id)}" class="map-mobile-hp-button" type="button">${current}</button>`
                    : `<span>${current}</span>`
                }<span>/${total}</span>
              </div>
            </div>`
          : ""
      }
    </div>
    ${renderMovementDpad(item)}
  `;
  bindDpadControls(item, hud);
  if (editableHp) {
    hud
      .querySelector("[data-open-mobile-hp]")
      ?.addEventListener("click", () => openMobileHpEditor(item.id));
  }
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

// Shared by bindQuickControlsPanel() (the sidebar's collapsible quick
// controls) and bindMobileHudDpad() (the always-visible mobile HUD) --
// both just need the same buttons/joystick wired inside whichever
// container currently holds them. dpadJoystickState tracks the moving
// item by id (see tickDpadJoystick()), not by container, so the same
// joystick element works unmodified in either spot.
function bindDpadControls(item, container) {
  container.querySelectorAll("[data-dpad-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const [dx, dy] = button.dataset.dpadMove.split(",").map(Number);
      moveTokenByDpad(item, dx, dy);
    });
  });
  const joystick = container.querySelector("[data-dpad-joystick]");
  joystick?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    stopDpadJoystick();
    const centerEl = event.currentTarget;
    const rect = centerEl.getBoundingClientRect();
    dpadJoystickState = {
      itemId: item.id,
      centerEl,
      pointerId: event.pointerId,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
      direction: null,
      timer: setInterval(tickDpadJoystick, DPAD_JOYSTICK_INTERVAL_MS),
    };
    centerEl.classList.add("dragging");
    centerEl.setPointerCapture(event.pointerId);
    updateDpadJoystick(event);
    tickDpadJoystick();
  });
  joystick?.addEventListener("pointermove", updateDpadJoystick);
  joystick?.addEventListener("pointerup", stopDpadJoystick);
  joystick?.addEventListener("pointercancel", stopDpadJoystick);
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
  bindDpadControls(item, panel);
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
  const isPainted = Array.isArray(item.cells);
  // A painted (freeform) region's cell mask has no resize formula the
  // way a plain rect's w/h does -- editing W/H wouldn't do anything
  // sensible to it, so those fields are swapped for a plain cell
  // count and a hint to delete + redraw instead.
  const sizeFieldsHtml = isPainted
    ? `<div class="col-12 small-text">${item.cells.length} cell${item.cells.length === 1 ? "" : "s"} painted -- delete and redraw with the Draw tool to reshape.</div>`
    : `
      <div class="col-6"><label>W</label><input data-height-field="w" class="form-control form-control-sm" type="number" min="1" value="${item.w || 1}"></div>
      <div class="col-6"><label>H</label><input data-height-field="h" class="form-control form-control-sm" type="number" min="1" value="${item.h || 1}"></div>
    `;
  el("selectedPanel").innerHTML = `
    <label>Height Region</label>
    <div class="row g-2">
      <div class="col-6"><label>X</label><input data-height-field="x" class="form-control form-control-sm" type="number" value="${item.x || 0}"></div>
      <div class="col-6"><label>Y</label><input data-height-field="y" class="form-control form-control-sm" type="number" value="${item.y || 0}"></div>
      ${sizeFieldsHtml}
      <div class="col-12">
        <label>Height (ft) <span class="small-text">1 unit = 5ft, negative = pit</span></label>
        <div class="height-feet-stepper">
          <button class="btn btn-outline-light btn-sm" type="button" data-height-step="-5" aria-label="Decrease height by 5 feet">-</button>
          <input data-height-field="heightFeet" class="form-control form-control-sm" type="number" step="5" value="${Number(item.heightFeet || 0)}">
          <button class="btn btn-outline-light btn-sm" type="button" data-height-step="5" aria-label="Increase height by 5 feet">+</button>
        </div>
      </div>
      <div class="col-12"><label>Color</label><input data-height-field="color" class="form-control form-control-sm" type="color" value="${escapeHtml(item.color || "#61dafb")}"></div>
      <div class="col-12">
        <label>Wall Dressing <span class="small-text">textures the region's 3D side walls</span></label>
        ${wallPatternPickerHtml(item.pattern || "")}
      </div>
    </div>
    <button class="btn btn-outline-danger btn-sm w-100 mt-2" type="button" data-delete-height-shape>
      <i class="bi bi-trash"></i> Delete
    </button>
  `;
  updateHeightEditControls();
  bindHeightShapePanelInteractions(item);
}

// One swatch per scripts/wall-patterns.js entry, plus a leading "None"
// swatch (empty string) that keeps blockHtmlAt()'s original flat
// gradient/color wall instead of a texture.
function wallPatternPickerHtml(activeId) {
  const patterns = window.PFWallPatterns?.list || [];
  const noneActive = !activeId ? " active" : "";
  const swatches = patterns
    .map((p) => {
      const active = p.id === activeId ? " active" : "";
      const style = window.PFWallPatterns.backgroundStyle(p.id);
      return `<button type="button" class="wall-pattern-swatch${active}" data-pattern-id="${escapeHtml(p.id)}" title="${escapeHtml(p.label)} — ${escapeHtml(p.category)}" style="${style}"></button>`;
    })
    .join("");
  return `
    <div class="wall-pattern-picker" data-wall-pattern-picker>
      <button type="button" class="wall-pattern-swatch${noneActive}" data-pattern-id="" title="None (flat color)"><span class="wall-pattern-swatch-none">&times;</span></button>
      ${swatches}
    </div>
  `;
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
  // Explicit +5/-5 buttons alongside the number input -- not relying
  // solely on typing "-" (native number inputs report .value as ""
  // for that split second, since a bare "-" isn't a complete number
  // yet -- harmless once a digit follows, but easy to misread as "it
  // won't go negative") or the browser's own tiny spinner arrows,
  // which are easy to miss/mis-click depending on OS/theme.
  el("selectedPanel")
    .querySelectorAll("[data-height-step]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const input = el("selectedPanel").querySelector(
          '[data-height-field="heightFeet"]',
        );
        const delta = Number(button.dataset.heightStep);
        item.heightFeet = Number(item.heightFeet || 0) + delta;
        input.value = item.heightFeet;
        renderMap();
        queueSave();
      });
    });
  el("selectedPanel")
    .querySelectorAll("[data-wall-pattern-picker] [data-pattern-id]")
    .forEach((swatch) => {
      swatch.addEventListener("click", () => {
        item.pattern = swatch.dataset.patternId || "";
        swatch
          .closest("[data-wall-pattern-picker]")
          .querySelectorAll(".wall-pattern-swatch")
          .forEach((other) => other.classList.toggle("active", other === swatch));
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
  // A light only ever needs a name + radius -- see renderLightPanel()'s
  // own comment for why it skips the rest of this function (sheet,
  // effects, texture, quick controls, etc.) entirely rather than
  // threading kind==="light" checks through each of those fields.
  if (item?.kind === "light") {
    renderLightPanel(item);
    return;
  }
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
  // Relative to whatever's underneath, not an absolute world height --
  // 0 always means "resting on the ground/platform below it," so this
  // never needs touching for an ordinary token walking around the
  // map. Only used by 3D View (see token3DHeights()): a nonzero value
  // there draws a "flying" line down to the surface below.
  const elevationField = item.kind
    ? `<div class="col-4"><label>Z <span class="small-text">(ft)</span></label><input data-selected-field="elevationFeet" class="form-control form-control-sm" type="number" step="5" value="${Number(item.elevationFeet || 0)}"></div>`
    : "";
  const shapeDepthField = item.shape
    ? `<div><label>D <span class="small-text">(height)</span></label><input data-selected-field="d" class="form-control form-control-sm" type="number" min="0" step="1" value="${shapeDepth(item)}"></div>`
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
              <div class="col-4"><label>X</label><input data-selected-field="x" class="form-control form-control-sm" type="number" value="${item.x || 0}"></div>
              <div class="col-4"><label>Y</label><input data-selected-field="y" class="form-control form-control-sm" type="number" value="${item.y || 0}"></div>
              ${elevationField}
              <div class="col-12">
                <div class="size-link-row${item.shape ? " has-depth" : ""}">
                  <div><label>W</label><input data-selected-field="w" class="form-control form-control-sm" type="number" min="1" value="${item.w || 1}"></div>
                  <button class="btn ${sizeLinked ? "btn-info" : "btn-outline-light"} btn-sm size-link-toggle" type="button" data-toggle-size-link title="${sizeLinked ? "Unlink width and height" : "Link width and height"}" aria-label="${sizeLinked ? "Unlink width and height" : "Link width and height"}">
                    <i class="bi ${sizeLinkIcon}"></i>
                  </button>
                  <div><label>H</label><input data-selected-field="h" class="form-control form-control-sm" type="number" min="1" value="${item.h || 1}"></div>
                  ${shapeDepthField}
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

// A dedicated static Light's side panel -- deliberately separate from
// renderSelectedPanel()'s general token panel (same reasoning as
// renderHeightShapePanel() above it) since a light only ever needs a
// name and a radius, none of the sheet/effects/texture/quick-controls
// machinery every other token kind carries.
function renderLightPanel(item) {
  el("selectedPanel").innerHTML = `
    <label>Light</label>
    <div class="row g-2">
      <div class="col-12">
        <label>Name</label>
        <input data-light-field="name" class="form-control form-control-sm" value="${escapeHtml(item.name || "")}">
      </div>
      <div class="col-12">
        <label>Radius <span class="small-text">(cells)</span></label>
        <input data-light-field="radius" class="form-control form-control-sm" type="number" min="1" step="1" value="${Number(item.light?.radius || 1)}">
      </div>
    </div>
    <button class="btn btn-outline-danger btn-sm w-100 mt-2" type="button" data-remove-light>
      <i class="bi bi-trash"></i> Remove from map
    </button>
  `;
  bindLightPanelInteractions(item);
}

function bindLightPanelInteractions(item) {
  el("selectedPanel")
    .querySelectorAll("[data-light-field]")
    .forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.lightField;
        if (field === "name") {
          item.name = input.value;
        } else if (field === "radius") {
          item.light = { ...item.light, visible: true, radius: Math.max(1, Number(input.value || 1)) };
        }
        renderMap();
        queueSave();
      });
    });
  el("selectedPanel")
    .querySelector("[data-remove-light]")
    ?.addEventListener("click", () => removeMapItem(item.id));
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
        const value = [
          "x",
          "y",
          "w",
          "h",
          "d",
          "elevationFeet",
        ].includes(input.dataset.selectedField)
          ? Number(input.value || 0)
          : input.value;
        item[input.dataset.selectedField] = value;
        if (input.dataset.selectedField === "d") {
          enforceShapeDepthMinimum(item, input);
        }
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
    .forEach((input) => bindHpInput(input, input.dataset.tokenCurrentHp));
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
        enforceShapeDepthMinimum(item);
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
  if (isStaleSelfRemote(remoteState)) return;
  if (saveTimer || mapSaveInFlight > 0) {
    pendingRemoteState = remoteState;
    return;
  }
  if (isOlderThanLocal(remoteState)) return;
  if (dragState || resizeState || isEditingSelectedPanelField()) {
    pendingRemoteState = remoteState;
    return;
  }
  clearTimeout(saveTimer);
  state = normalizeState(remoteState);
  lastAppliedMapMeta = mapMetaOf(state);
  if (selectedId && !mapItemExists(selectedId)) selectedId = "";
  if (
    contextMenuTokenId &&
    !state.tokens.some((token) => token.id === contextMenuTokenId)
  )
    hideContextMenu();
  applySettingsToInputs();
  renderAll(false);
  void refreshMapTokenSheets({
    save: false,
    reloadCharacters: false,
    reloadEnemies: false,
    syncPassiveAuras: false,
  });
  scheduleOutOfRangeAuraCleanup();
}

function flushPendingRemoteState() {
  if (!pendingRemoteState) return;
  if (saveTimer || mapSaveInFlight > 0) return;
  if (isStaleSelfRemote(pendingRemoteState) || isOlderThanLocal(pendingRemoteState)) {
    pendingRemoteState = null;
    return;
  }
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
    lastAppliedMapMeta = mapMetaOf(state);
    if (selectedId && !mapItemExists(selectedId)) selectedId = "";
    applySettingsToInputs();
    renderAll(false);
    return;
  }

  state = remoteState;
  lastAppliedMapMeta = mapMetaOf(state);
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
  stampLocalMapState();
  const snapshot = structuredClone(state);
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    mapSaveInFlight += 1;
    mapSaveChain = mapSaveChain
      .catch(() => {})
      .then(async () => {
        const saved = await PFApp.saveMapState(snapshot, mapContextKey, slot);
        if (saved) lastAppliedMapMeta = mapMetaOf(snapshot);
      })
      .finally(() => {
        mapSaveInFlight = Math.max(0, mapSaveInFlight - 1);
        flushPendingRemoteState();
      });
    await mapSaveChain;
  }, 500);
}

function draggedItemEntries(item) {
  return [
    {
      item,
      startX: Number(item.x || 0),
      startY: Number(item.y || 0),
    },
  ];
}

function clampedDragDelta(entries, dx, dy) {
  const cols = Number(state.settings.cols || 0);
  const rows = Number(state.settings.rows || 0);
  let minDx = -Infinity;
  let maxDx = Infinity;
  let minDy = -Infinity;
  let maxDy = Infinity;
  entries.forEach(({ item, startX, startY }) => {
    minDx = Math.max(minDx, -startX);
    minDy = Math.max(minDy, -startY);
    maxDx = Math.min(maxDx, cols - Number(item.w || 1) - startX);
    maxDy = Math.min(maxDy, rows - Number(item.h || 1) - startY);
  });
  return {
    dx: clamp(dx, minDx, maxDx),
    dy: clamp(dy, minDy, maxDy),
  };
}

function updateAuraDragPreview(token) {
  const stage = el("mapStage");
  if (!stage || !token?.kind) return;
  stage
    .querySelectorAll(`[data-aura-token-id="${CSS.escape(token.id)}"]`)
    .forEach((node) => {
      const field = node.dataset.auraField || "aura";
      const data = token[field] || {};
      const radius = Math.max(1, Number(data.radius || 1));
      const center = tokenCenter(token);
      node.style.setProperty("--aura-x", center.x - radius);
      node.style.setProperty("--aura-y", center.y - radius);
    });
}

function updateFlightConnectorDragPreview(token, heights) {
  const stage = el("mapStage");
  const connector = stage?.querySelector(
    `[data-flight-token-id="${CSS.escape(token.id)}"]`,
  );
  if (!connector) return;
  const cell = Number(localGridSize || 48);
  const x = Number(token.x || 0) * cell;
  const y = Number(token.y || 0) * cell;
  const w = Number(token.w || 1) * cell;
  const h = Number(token.h || 1) * cell;
  const poleLenPx = Math.abs(heights.tz - heights.surfaceZ);
  connector.style.left = `${x}px`;
  connector.style.top = `${y}px`;
  connector.style.width = `${w}px`;
  connector.style.height = `${h}px`;
  connector.style.transform = `translateZ(${heights.tz}px)`;
  connector.querySelector(".map-3d-flight-pole")?.style.setProperty(
    "height",
    `${poleLenPx}px`,
  );
  connector
    .querySelector(".map-3d-flight-anchor-mark")
    ?.style.setProperty(
      "transform",
      `translateZ(${heights.surfaceZ - heights.tz}px)`,
    );
}

function tokenAffectsRevealPreview(token) {
  return Boolean(
    token?.kind &&
      (token.light?.visible || token.limitedView?.visible),
  );
}

function refresh2DRevealLayers() {
  if (heightEditMode) return;
  const stage = el("mapStage");
  if (!stage) return;
  stage
    .querySelectorAll(
      ".map-fog-layer, .map-limited-view-grayscale, .map-token-fog-reveal",
    )
    .forEach((node) => node.remove());
  const anchor = el("tokenHoverLayer");
  const visibleTokens = state.tokens.filter(canSeeToken);
  const wrapper = document.createElement("template");
  wrapper.innerHTML = [
    renderFogLayer(false),
    renderLimitedViewGrayscale(),
    renderOwnTokenFogReveal(visibleTokens),
  ].join("");
  const nodes = [...wrapper.content.childNodes];
  nodes.forEach((node) => {
    if (anchor) stage.insertBefore(node, anchor);
    else stage.appendChild(node);
  });
}

function refreshDragRevealPreview(items) {
  if (!state.fog?.visible || heightEditMode) return;
  const affectsReveal = items.some(({ item }) => tokenAffectsRevealPreview(item));
  if (!affectsReveal) return;
  if (view3DMode && !heightEditMode) {
    renderMap();
    return;
  }
  refresh2DRevealLayers();
}

function updateDraggedItemPreview(item) {
  const stage = el("mapStage");
  const node = stage?.querySelector(`[data-map-id="${CSS.escape(item.id)}"]`);
  if (!node) return;
  node.style.setProperty("--x", Number(item.x || 0));
  node.style.setProperty("--y", Number(item.y || 0));
  if (view3DMode && !heightEditMode) {
    if (item.kind) {
      const heights = token3DHeights(item);
      node.style.setProperty("--tz", `${heights.tz}px`);
      updateFlightConnectorDragPreview(item, heights);
    } else if (item.shape && shapeDepth(item) > 0) {
      const mask = shapeMask(item);
      const surfaceZ = feetToPreviewPx(
        tallestHeightFeetUnder(item.x, item.y, mask.cols, mask.rows),
      );
      node.style.setProperty("--tz", `${surfaceZ}px`);
    }
  }
  updateAuraDragPreview(item);
}

function applyDragPreview(dx, dy) {
  if (!dragState?.items?.length) return;
  const delta = clampedDragDelta(dragState.items, dx, dy);
  if (dragState.lastDx === delta.dx && dragState.lastDy === delta.dy) return;
  dragState.lastDx = delta.dx;
  dragState.lastDy = delta.dy;
  dragState.items.forEach((entry) => {
    entry.item.x = entry.startX + delta.dx;
    entry.item.y = entry.startY + delta.dy;
    updateDraggedItemPreview(entry.item);
  });
  refreshDragRevealPreview(dragState.items);
}

function startDrag(event) {
  if (event.button !== 0) return;
  if (pathRulerActive()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  hideContextMenu();
  suppressStageClick = true;
  const id = event.currentTarget.dataset.mapId;
  const item = [...state.tokens, ...state.shapes, ...state.heightShapes].find(
    (entry) => entry.id === id,
  );
  if (!item) return;
  hideTokenHover();
  selectedId = id;
  const items = draggedItemEntries(item);
  const is3D = view3DMode && !heightEditMode;
  if (is3D) {
    // Must exist before cell3DFromPoint() can answer anything -- see
    // build3DHitGrid(). Grab offset (not just "snap the item's origin
    // to whatever cell was clicked") so dragging feels the same as
    // 2D: wherever on the item you grabbed stays under the cursor.
    build3DHitGrid();
    const cell = cell3DFromPoint(event.clientX, event.clientY);
    dragState = {
      id,
      startCellX: cell?.x ?? Number(item.x || 0),
      startCellY: cell?.y ?? Number(item.y || 0),
      items,
    };
  } else {
    dragState = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      items,
    };
  }
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
  if (view3DMode && !heightEditMode) {
    // A tilted/spun stage means raw pixel deltas no longer map
    // linearly to grid cells -- see stageCellFromEvent()'s comment.
    // Keep the same starting-cell offset instead of snapping the
    // item's origin to the current pointer cell; this matters most for
    // flying tokens, where the visual token is projected above the
    // terrain cell used for hit-testing.
    const cell = cell3DFromPoint(event.clientX, event.clientY);
    if (cell) {
      applyDragPreview(
        cell.x - dragState.startCellX,
        cell.y - dragState.startCellY,
      );
    }
    return;
  }
  const cell = Number(localGridSize || 48);
  const dx = Math.round((event.clientX - dragState.startX) / cell);
  const dy = Math.round((event.clientY - dragState.startY) / cell);
  applyDragPreview(dx, dy);
}

// Same OS-window-style resize for both regular map shapes and Height
// Layer regions -- whichever array is "active" depends on whether the
// Height Layer is open (see resizableItemsList()).
function resizableItemsList() {
  return heightEditMode ? state.heightShapes : state.shapes;
}

function startResize(event) {
  if (event.button !== 0) return;
  if (pathRulerActive()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
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
  const movedTokenId = dragState?.id || "";
  flushPendingRemoteState();
  dragState = null;
  window.removeEventListener("pointermove", moveDrag);
  teardown3DHitGrid();
  renderAll();
  scheduleOutOfRangeAuraCleanup(movedTokenId);
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
  const spawn = visibleSpawnCell(1, 1);
  const token = {
    id: uid("token"),
    kind,
    ownerId: currentUserId,
    name,
    x: spawn.x,
    y: spawn.y,
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

// "Light 1" / "Light 2" / ... -- reuses the lowest free number rather
// than an ever-climbing counter, so deleting Light 1 and adding a new
// one names it "Light 1" again instead of skipping to "Light 3".
function nextLightName() {
  const used = new Set(
    state.tokens
      .filter((token) => token.kind === "light")
      .map((token) => Number(String(token.name || "").match(/^Light (\d+)$/)?.[1]))
      .filter((n) => Number.isFinite(n)),
  );
  let n = 1;
  while (used.has(n)) n += 1;
  return `Light ${n}`;
}

// A dedicated static light source -- see canSeeToken()/quickActionRows()/
// showMapContextMenu()/renderToken()/renderSelectedPanel() for the rest
// of what makes "light" a distinct token kind: GM/admin-only icon, no
// resize, no timeline/initiative entry, and a stripped-down "just a
// radius" side panel instead of the full token panel. The actual fog
// reveal it produces reuses lightRevealCircles() unchanged -- that
// already reads any token's .light field regardless of kind, so a
// light token lights up the map for everyone the same way a torch-
// bearing NPC token would, it just has no NPC attached.
function addLightToken() {
  const spawn = visibleSpawnCell(1, 1);
  const token = {
    id: uid("token"),
    kind: "light",
    ownerId: currentUserId,
    name: nextLightName(),
    x: spawn.x,
    y: spawn.y,
    w: 1,
    h: 1,
    zIndex: nextMapZIndex(),
    color: "#f0d58c",
    light: { visible: true, radius: 3 },
  };
  state.tokens.push(token);
  selectedId = token.id;
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
  const spawn = visibleSpawnCell(1, 1);
  const token = {
    id: uid("token"),
    kind: "token",
    ownerId: currentUserId,
    name,
    hideName: el("genericTokenHideName").checked,
    x: spawn.x,
    y: spawn.y,
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

function tokenSizeFromSheet(source) {
  const raw = Number(source?.sheet?.calculated?.size?.tokenSize);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
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
  const size = tokenSizeFromSheet(character);
  const token = {
    id: uid("token"),
    kind: "character",
    characterId: character.id,
    ownerId: character.userId || currentUserId,
    name: character.name || "Character",
    ...visibleSpawnCell(size, size),
    w: size,
    h: size,
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
  const size = tokenSizeFromSheet(enemy);
  const token = {
    id: uid("token"),
    kind: "enemy",
    enemyId: enemy.id,
    name: enemy.name,
    ...visibleSpawnCell(size, size),
    w: size,
    h: size,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    hp: enemyHpText(enemy),
    ac: enemyAcText(enemy),
    visible: el("enemyTokenVisible").checked,
    hideName: el("enemyTokenHideName").checked,
    sheet: structuredClone(enemy.sheet || {}),
    color: "#b02a37",
  };
  syncTokenFromSheet(token, enemy);
  state.tokens.push(token);
  ensureTokenInitiative(token);
  selectedId = token.id;
  enemyPickerModal.hide();
  if (token.visible !== false) addTimeline(`${enemy.name} entered the map.`);
  renderAll();
}

function addShape(shape) {
  const spawn = visibleSpawnCell(3, 3);
  const item = {
    id: uid("shape"),
    shape,
    ownerId: currentUserId,
    name: shape === "circle" ? "Circle" : "Rectangle",
    x: spawn.x,
    y: spawn.y,
    w: 3,
    h: 3,
    d: 0,
    sizeLinked: true,
    zIndex: nextMapZIndex(),
    color: "#f0d58c",
  };
  state.shapes.push(item);
  selectedId = item.id;
  renderAll();
}

function addHeightShape() {
  const spawn = visibleSpawnCell(3, 3);
  const item = {
    id: uid("height"),
    x: spawn.x,
    y: spawn.y,
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
  if (heightEditingShapeId === id) heightEditingShapeId = "";
  renderAll();
}

function updateHeightEditControls() {
  const selectedHeightShape = state.heightShapes.some(
    (shape) => shape.id === selectedId,
  );
  const editButton = el("editHeightShapeBtn");
  if (editButton) {
    editButton.disabled = !heightEditMode || !selectedHeightShape || heightDrawMode;
    editButton.classList.toggle(
      "active",
      heightDrawMode && Boolean(heightEditingShapeId),
    );
  }
}

// Swaps the whole toolbar + stage + selected-panel into a dedicated
// view for painting elevation (state.heightShapes) -- separate from
// the ordinary gameplay Rect/Circle shapes, tokens, and fog, none of
// which render while this is open. See renderMap()/renderSelectedPanel().
function toggleHeightEditMode(next = !heightEditMode) {
  heightEditMode = next;
  selectedId = "";
  cancelTransferTarget();
  if (heightEditMode && pathRuler?.active) finishPathRuler();
  if (!heightEditMode) toggleHeightDrawMode(false);
  el("mapStage")?.classList.toggle("height-edit-mode", heightEditMode);
  document.querySelector(".map-side")?.classList.toggle(
    "height-edit-mode",
    heightEditMode,
  );
  el("mapNormalToolbar").classList.toggle("d-none", heightEditMode);
  el("mapHeightToolbar").classList.toggle("d-none", !heightEditMode);
  // #map3DControls lives outside mapNormalToolbar (so it doesn't
  // vanish/reappear every time the Draw tool toggles selection), so
  // it needs its own visibility check here -- shown only when 3D View
  // is actually on AND Height editing (2D-only) isn't.
  el("map3DControls")?.classList.toggle(
    "d-none",
    !view3DMode || heightEditMode,
  );
  renderAll(false);
}

// 3D View -- tilts the live #mapStage (see renderMap()'s use of
// view3DMode/render3DTerrainHtml()) instead of opening a separate
// preview. Tokens/shapes keep working exactly as in 2D (same
// elements, same drag/select/context-menu wiring) -- see
// startDrag()/moveDrag()/stageCellFromEvent() for how those adapt to
// the tilt via build3DHitGrid() rather than raw pixel-delta math.
function toggleView3DMode(next = !view3DMode) {
  view3DMode = next;
  if (!view3DMode) cancelTransferTarget();
  el("toggleView3DBtn")?.classList.toggle("active", view3DMode);
  el("map3DControls")?.classList.toggle("d-none", !view3DMode);
  renderAll(false);
  if (view3DMode && pathRuler?.active) build3DHitGrid();
  if (view3DMode) {
    centerMapViewport();
    setTimeout(centerMapViewport, 80);
  }
}

// "Draw Height Region" tool -- paints individual grid cells while the
// left mouse button is held over the Height Layer stage; every cell
// the pointer crosses joins the same in-progress shape, finalized into
// state.heightShapes on release. See renderHeightShape()'s freeform
// (shape.cells) branch for how that gets rendered afterward, and
// render3DTerrainHtml()'s per-cell block handling for the 3D View.
function toggleHeightDrawMode(next = !heightDrawMode, editShapeId = "") {
  heightDrawMode = next;
  heightEditingShapeId = heightDrawMode ? editShapeId : "";
  el("drawHeightShapeBtn")?.classList.toggle("active", heightDrawMode);
  el("editHeightShapeBtn")?.classList.toggle("active", Boolean(heightEditingShapeId));
  el("mapStage")?.classList.toggle("height-draw-active", heightDrawMode);
  if (heightDrawMode && !heightEditingShapeId) selectedId = "";
  else paintState = null;
  // renderMap() is what actually (un)wires drag/resize/click listeners
  // on existing shape elements based on heightDrawMode (see its
  // wiring loop) -- without re-running it here, shapes already on the
  // stage from before this toggle would keep whichever listeners they
  // were built with, regardless of the mode just switched to.
  // renderAll(false) (not just renderMap()) so clearing selectedId
  // above also clears a stale selected-item panel.
  renderAll(false);
}

function startPaintHeightShape(event) {
  if (!heightDrawMode || event.button !== 0) return;
  event.preventDefault();
  hideContextMenu();
  const { x, y } = stageCellFromEvent(event);
  paintState = { cells: new Set(), toggled: new Set() };
  togglePaintHeightCell(x, y);
  renderPaintPreview();
  window.addEventListener("pointermove", movePaintHeightShape);
  window.addEventListener("pointerup", endPaintHeightShape, { once: true });
}

function togglePaintHeightCell(x, y) {
  if (!paintState) return;
  const key = `${x},${y}`;
  if (heightEditingShapeId) {
    if (paintState.toggled.has(key)) return;
    paintState.toggled.add(key);
    if (paintState.cells.has(key)) paintState.cells.delete(key);
    else paintState.cells.add(key);
    return;
  }
  paintState.cells.add(key);
}

function movePaintHeightShape(event) {
  if (!paintState) return;
  const { x, y } = stageCellFromEvent(event);
  const before = paintState.cells.size;
  togglePaintHeightCell(x, y);
  if (paintState.cells.size !== before || heightEditingShapeId) {
    renderPaintPreview();
  }
}

function endPaintHeightShape() {
  window.removeEventListener("pointermove", movePaintHeightShape);
  if (!paintState) return;
  const editingShape = heightEditingShapeId
    ? state.heightShapes.find((shape) => shape.id === heightEditingShapeId)
    : null;
  if (editingShape) {
    const existingCells = new Set(
      Array.isArray(editingShape.cells)
        ? editingShape.cells.map((key) => {
            const [dx, dy] = key.split(",").map(Number);
            return `${Number(editingShape.x || 0) + dx},${
              Number(editingShape.y || 0) + dy
            }`;
          })
        : Array.from({ length: Number(editingShape.h || 1) }, (_, y) =>
            Array.from({ length: Number(editingShape.w || 1) }, (_, x) =>
              `${Number(editingShape.x || 0) + x},${
                Number(editingShape.y || 0) + y
              }`,
            ),
          ).flat(),
    );
    paintState.toggled.forEach((key) => {
      if (existingCells.has(key)) existingCells.delete(key);
      else existingCells.add(key);
    });
    const coords = [...existingCells].map((key) => key.split(",").map(Number));
    paintState = null;
    toggleHeightDrawMode(false);
    if (!coords.length) {
      deleteHeightShape(editingShape.id);
      return;
    }
    const minX = Math.min(...coords.map((c) => c[0]));
    const minY = Math.min(...coords.map((c) => c[1]));
    const maxX = Math.max(...coords.map((c) => c[0]));
    const maxY = Math.max(...coords.map((c) => c[1]));
    editingShape.x = minX;
    editingShape.y = minY;
    editingShape.w = maxX - minX + 1;
    editingShape.h = maxY - minY + 1;
    editingShape.cells = coords.map(([cx, cy]) => `${cx - minX},${cy - minY}`);
    selectedId = editingShape.id;
    renderAll();
    return;
  }
  const coords = [...paintState.cells].map((key) => key.split(",").map(Number));
  paintState = null;
  renderPaintPreview();
  toggleHeightDrawMode(false);
  if (!coords.length) return;
  const minX = Math.min(...coords.map((c) => c[0]));
  const minY = Math.min(...coords.map((c) => c[1]));
  const maxX = Math.max(...coords.map((c) => c[0]));
  const maxY = Math.max(...coords.map((c) => c[1]));
  const shape = {
    id: uid("height"),
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    cells: coords.map(([cx, cy]) => `${cx - minX},${cy - minY}`),
    heightFeet: 5,
    color: "#61dafb",
  };
  state.heightShapes.push(shape);
  selectedId = shape.id;
  renderAll();
}

// Cheap live feedback for an in-progress paint stroke -- doesn't go
// through the full renderMap()/state.heightShapes pipeline (that would
// mean a real state mutation on every single pointermove), just
// highlights cells directly in a dedicated overlay layer.
function renderPaintPreview() {
  const preview = el("heightPaintPreview");
  if (!preview) return;
  if (!paintState) {
    preview.innerHTML = "";
    return;
  }
  const cell = Number(localGridSize || 48);
  preview.innerHTML = [...paintState.cells]
    .map((key) => {
      const [x, y] = key.split(",").map(Number);
      return `<span class="height-paint-preview-cell" style="left:${x * cell}px;top:${y * cell}px;width:${cell}px;height:${cell}px;"></span>`;
    })
    .join("");
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

function openMobileHpEditor(tokenId) {
  const token = tokenById(tokenId);
  if (!token || !canEditTokenHp(token) || !window.PFMapHpEditor) return;
  const current = tokenCurrentHp(token);
  const total = tokenTotalHp(token);
  window.PFMapHpEditor.open({
    current,
    total,
    onSave: async (value) => {
      pendingTokenHp.set(tokenId, value);
      updateTokenHpPreview(token, value);
      clearTimeout(hpSaveTimers.get(tokenId));
      hpSaveTimers.delete(tokenId);
      renderMap();
      renderMobileHud();
      await updateTokenCurrentHp(tokenId, value, nextHpSaveSeq(tokenId));
    },
  });
}

// Shared input/change/blur/Enter wiring for an editable current-HP
// field -- used by the sidebar's compactHpStat() input.
// queueTokenCurrentHp()/flushTokenCurrentHp() are keyed by token id,
// not by container. onInput is an optional extra callback for
// anything else that needs to react live as the value changes.
function bindHpInput(input, tokenId, onInput) {
  if (!input) return;
  input.addEventListener("input", () => {
    onInput?.();
    queueTokenCurrentHp(tokenId, input.value);
  });
  input.addEventListener("change", () => flushTokenCurrentHp(tokenId, input.value));
  input.addEventListener("blur", () => flushTokenCurrentHp(tokenId, input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      flushTokenCurrentHp(tokenId, input.value);
      input.blur();
    }
  });
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
    if (
      saved?.id &&
      character &&
      String(saved.id) === String(token.characterId)
    ) {
      pendingTokenHp.delete(tokenId);
      const refreshed = await PFApp.loadCharacterSheet(
        "",
        mapContextKey,
        token.characterId,
      );
      if (
        refreshed?.sheet &&
        String(refreshed.id) === String(token.characterId)
      )
        character.sheet = {
          ...(character.sheet || {}),
          ...refreshed.sheet,
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

function mapFavoredEnemyTargetKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*\([+-]?\d+\)\s*$/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function cleanMapFavoredEnemyLabel(value = "") {
  return String(value || "")
    .replace(/\s*\([+-]?\d+\)\s*$/g, "")
    .trim();
}

function mapFavoredEnemyChoiceLabel(choices = {}) {
  const entry = Object.entries(choices || {}).find(
    ([key]) =>
      normalizeConditionalVariableKey(key) === "favored enemy",
  )?.[1];
  return cleanMapFavoredEnemyLabel(
    entry?.value || entry?.name || entry?.label || "",
  );
}

function characterFavoredEnemyOptions(character, { additionalTargets = [] } = {}) {
  const byTarget = new Map();
  const addTarget = (target = "", bonus = null) => {
    const label = cleanMapFavoredEnemyLabel(target);
    const key = mapFavoredEnemyTargetKey(label);
    if (!key) return;
    byTarget.set(key, {
      value: label,
      label,
      name: label,
      favoredEnemyTarget: label,
      bonus: Number(bonus || 0),
    });
  };
  additionalTargets.forEach((target) => addTarget(target));
  Object.values(character?.sheet?.classFeatureVariableChoices || {}).forEach(
    (choices) => addTarget(mapFavoredEnemyChoiceLabel(choices)),
  );
  (character?.sheet?.activeBuffs || []).forEach((buff) => {
    (Array.isArray(buff.bonuses) ? buff.bonuses : []).forEach((bonus) => {
      const sourceText = [buff.name, buff.source, bonus.name, bonus.source]
        .filter(Boolean)
        .join(" ");
      if (!bonus.favoredEnemyBonus && !/\bfavou?red\s+enemy\b/i.test(sourceText))
        return;
      addTarget(
        bonus.favoredEnemyTarget ||
          bonus.targetFavoredEnemy ||
          mapFavoredEnemyChoiceLabel(bonus.conditionalChoices) ||
          mapFavoredEnemyChoiceLabel(buff.conditionalChoices),
        bonus.value,
      );
    });
  });
  return [...byTarget.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mapCharacterAttributeScaleContext(character = {}) {
  const sheet = character.sheet || {};
  const raw = sheet.abilities || {};
  const calculated = new Map(
    (sheet.calculated?.abilities || []).map((entry) => [entry.key, entry]),
  );
  const abilityScores = {};
  const abilityMods = {};
  ["str", "dex", "con", "int", "wis", "cha"].forEach((key) => {
    const entry = calculated.get(key) || {};
    const score = Number(entry.total ?? raw[key]?.score ?? 10);
    const parsedMod = Number(String(entry.mod ?? "").replace("+", ""));
    abilityScores[key] = Number.isFinite(score) ? score : 10;
    abilityMods[key] = Number.isFinite(parsedMod)
      ? parsedMod
      : Math.floor((abilityScores[key] - 10) / 2);
  });
  const characterLevel = Math.max(
    1,
    Number(sheet.fields?.characterLevel || 1) || 1,
  );
  const classLevels = {};
  (Array.isArray(sheet.classProgression) ? sheet.classProgression : []).forEach(
    (entry) => {
      const className = String(entry?.className || "").trim();
      if (className) classLevels[className] = Number(classLevels[className] || 0) + 1;
    },
  );
  return {
    characterLevel,
    casterLevel: characterLevel,
    classLevels,
    skillRanks: sheet.calculated?.skillRanks || sheet.fields?.skillRanks || {},
    abilityScores,
    abilityMods,
  };
}

// The class features (Rage, its bundled rage powers/totems, ...) a
// character could activate, computed from their own saved sheet data --
// used both for self-cast (character sheet) and for casting one
// character's abilities onto another token from the map (Share Rage /
// Skald's Inspired Rage).
async function characterActivatableAbilities(character) {
  if (!character?.sheet) return [];
  try {
    const bridge = await characterSheetBridge();
    if (bridge?.activatableEffectSourcesForCharacter) {
      const resolved = await bridge.activatableEffectSourcesForCharacter(
        mapContextKey,
        character.id,
      );
      if (Array.isArray(resolved)) return resolved;
    }
  } catch (error) {
    console.warn(
      "Could not resolve character activations through the sheet.",
      error,
    );
  }
  await ensureMapClassDefinitions();
  const abilityContext = mapCharacterAttributeScaleContext(character);
  const classAbilities =
    window.PFClassFeatureAbilities?.collectActivatableAbilities({
      classDefinitions: mapClassDefinitions || [],
      classProgression: character.sheet.classProgression || [],
      classFeatureChoices: character.sheet.classFeatureChoices || {},
      characterLevel: character.sheet.fields?.characterLevel,
      abilityScores: abilityContext.abilityScores,
    }) || [];
  const loot = await PFApp.loadLootItems(mapContextKey);
  const itemAbilities = (loot || [])
    .filter(
      (item) =>
        String(item.assigned_character_id || "") === String(character.id || ""),
    )
    .map((item) => {
      const active = window.PFEffectMechanics?.activeMechanics?.(item) || {};
      if (!window.PFEffectMechanics?.hasAnyMechanics?.(active)) return null;
      const result = {
        id: `item:${item.id}`,
        name: item.name || "Item",
        category: "Item",
        source: item.name || "Item",
        bonuses: active.effects || [],
        durationConfig: active.durationConfig || null,
        auraConfig: active.auraConfig || null,
        duration: window.PFEffectMeta?.durationLabel
          ? window.PFEffectMeta.durationLabel(active.durationConfig || {})
          : "variable",
        fromAbility: true,
        abilityContext,
        description:
          item.description || item.details?.description || item.details?.summary || "",
        detailUrl: item.url || item.link || item.details?.link || "",
        detailData: {
          type: "Item",
          description:
            item.description || item.details?.description || item.details?.summary || "",
          ...(item.details && typeof item.details === "object"
            ? item.details
            : {}),
        },
      };
      (window.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
        if (Array.isArray(active[key]) && active[key].length) {
          result[key] = active[key];
        }
      });
      return result;
    })
    .filter(Boolean);
  return [...classAbilities, ...itemAbilities];
}

// This modal is for directly managing a token's own active effects
// (self-application, or a GM tidying up an NPC) -- casting one
// character's class features onto ANOTHER token belongs in "Apply
// Effect" and Aura Options instead, where the caster and target are
// already unambiguous from the right-click context, so this doesn't
// need its own "cast as" picker.
function automaticAuraRecord(sourceToken, effect, { id, kind = "active" } = {}) {
  return (
    window.PFEffectMechanics?.createAuraLink?.(sourceToken, effect, {
      id: id || uid("automatic_aura"),
      kind,
    })?.aura || null
  );
}

function installAutomaticAura(sourceToken, effect, options = {}) {
  if (!sourceToken || !effect?.auraConfig?.enabled) return null;
  const aura = automaticAuraRecord(sourceToken, effect, options);
  const current = Array.isArray(sourceToken.automaticAuras)
    ? sourceToken.automaticAuras
    : [];
  sourceToken.automaticAuras = [
    ...current.filter((entry) => entry.id !== aura.id),
    aura,
  ];
  return aura;
}

function installLinkedAutomaticAura(sourceToken, effect) {
  const link = window.PFEffectMechanics?.createAuraLink?.(sourceToken, effect);
  if (!sourceToken || !link) return null;
  const current = Array.isArray(sourceToken.automaticAuras)
    ? sourceToken.automaticAuras
    : [];
  sourceToken.automaticAuras = [...current, link.aura];
  return link;
}

async function syncTokenPassiveAuras(token) {
  if (token?.kind !== "character" || !canManageAura(token)) return false;
  const character = tokenCharacter(token);
  if (!character) return false;
  const passives = await characterPassiveEffects(character);
  const nextPassive = passives
    .filter((effect) => effect?.auraConfig?.enabled)
    .map((effect) => {
      const stable = String(effect.id || effect.name || "aura")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return automaticAuraRecord(
        token,
        { ...effect, permanent: true },
        { id: `passive:${stable}`, kind: "passive" },
      );
    });
  const active = (Array.isArray(token.automaticAuras) ? token.automaticAuras : [])
    .filter((entry) => entry.kind !== "passive");
  const next = [...active, ...nextPassive];
  if (JSON.stringify(next) === JSON.stringify(token.automaticAuras || [])) return false;
  token.automaticAuras = next;
  return true;
}

function hideMapEffectsForPicker() {
  const modalEl = el("mapEffectsModal");
  if (!modalEl?.classList.contains("show")) return Promise.resolve();
  return new Promise((resolve) => {
    modalEl.addEventListener("hidden.bs.modal", resolve, { once: true });
    mapEffectsModal.hide();
  });
}

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
  if (!mapEffectTrackerInstance)
    PFEffectTracker.prepareLoading?.(mount);
  mapEffectsModal.show();
  await new Promise((resolve) =>
    requestAnimationFrame(() => window.setTimeout(resolve, 0)),
  );
  // Enemies aren't "controlled" by a separate real person -- only route
  // a choice-needing effect through the pending-request flow when
  // whoever's applying it isn't that character's own owner.
  const isOwnCharacter =
    token.kind === "enemy" ||
    tokenCharacter(token)?.userId === currentUserId;
  const activatableAbilities =
    token.kind === "character"
      ? await characterActivatableAbilities(tokenCharacter(token))
      : [];
  const options = {
    contextKey: mapContextKey,
    characterId: effectTargetId,
    activatableAbilities,
    effectPickerEffects: () => sourceEffectDefinitions(token),
    onEffectPickerOpen: hideMapEffectsForPicker,
    onEffectPickerCancel: () => mapEffectsModal.show(),
    recalculateSpell: async (effect, casterLevel) => {
      const character =
        token.kind === "character" ? tokenCharacter(token) : null;
      if (!character) return effect.spellCalculations || null;
      const bridge = await characterSheetBridge();
      const detail = await bridge?.spellDetailsForCharacter?.(
        mapContextKey,
        character.id,
        { ...effect.spellMeta, name: effect.name },
        casterLevel,
      );
      return detail?.calculations || effect.spellCalculations || null;
    },
    onDamageRolled: async (effect, results) => {
      addTimeline(
        `${displayTokenName(token)} uses ${effect.name || "an effect"}: ${window.PFDamageRolls.summary(results)}.`,
      );
      queueSave();
    },
    isOwnCharacter,
    choicePoolSkills:
      token.kind === "character"
        ? characterSkillOptions(tokenCharacter(token))
        : undefined,
    favoredEnemyOptions: () =>
      token.kind === "character"
        ? characterFavoredEnemyOptions(tokenCharacter(token))
        : [],
    onAuraActivate: async (effect) => {
      const link = installLinkedAutomaticAura(token, effect);
      if (!link) return false;
      addTimeline(`${displayTokenName(token)} activates ${effect.name || "an aura"}.`);
      renderAll();
      return link.controller;
    },
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
        const character = tokenCharacter(token);
        if (character) {
          character.sheet.activeBuffs = activeEffects;
          const calculated = await recalculateCharacterSheetFromMap(
            token.characterId,
            character,
            activeEffects,
          );
          if (calculated) character.sheet.calculated = calculated;
          syncTokenFromSheet(token, character);
          renderAll(false);
        }
        if (reconcileTokenLinkedAuras(token, activeEffects)) renderAll();
        return;
      }

      if (token.kind === "enemy") {
        const enemy =
          mapEnemies.find((item) => item.id === token.enemyId) || null;
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
          const nextEnemy = saved;
          const calculated = await recalculateEnemySheetFromMap(
            saved.id,
            nextEnemy,
          );
          if (calculated && nextEnemy.sheet)
            nextEnemy.sheet.calculated = calculated;
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
          reconcileTokenLinkedAuras(token, activeEffects);
          renderAll();
        }
      }
    },
    onChange: async (effects) => {
      if (token.kind === "character") {
        const character = tokenCharacter(token);
        if (character) {
          character.sheet.activeBuffs = Array.isArray(effects) ? effects : [];
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

function recordQuickSpellCast(effect) {
  const sourceToken = tokenById(quickEffectSourceTokenId);
  const actor = sourceToken ? displayTokenName(sourceToken) : "A character";
  addTimeline(`${actor} casts ${effect?.name || "a spell"}.`);
  incrementQuickEffectUsage(effect);
  queueSave();
  renderAll();
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
  const condition = isConditionEffect(effect);
  const passive = Boolean(effect.passiveSource);
  if (condition && !passive) {
    return `
      <article class="quick-effect-card quick-condition-card" role="button" tabindex="0" data-quick-effect-index="${index}">
        <div class="quick-effect-name">${escapeHtml(effect.name || "Condition")}</div>
      </article>
    `;
  }

  const needsCl = durationUsesCasterLevel(effect);
  return `
    <article class="quick-effect-card${passive ? " is-passive" : ""}" ${passive ? "" : `role="button" tabindex="0" data-quick-effect-index="${index}"`}>
      <span class="effect-type-icon" title="${escapeHtml(effect.category || "Effect")}"><i class="bi ${effectCategoryIcon(effect.category)}"></i></span>
      <div class="quick-effect-name">${escapeHtml(effect.name || "Effect")}</div>
      ${passive ? "" : `<div class="quick-effect-controls">
        ${
          needsCl
            ? `
          <label class="small">CL
            <input id="${prefix}Cl${index}" class="form-control form-control-sm" data-quick-cl type="number" min="1" value="${defaultCl}">
          </label>
        `
            : ""
        }
        <label class="form-check small mb-1">
          <input id="${prefix}Permanent${index}" class="form-check-input" data-quick-permanent type="checkbox">
          <span class="form-check-label">Permanent</span>
        </label>
      </div>`}
      <button class="btn btn-outline-secondary btn-sm quick-effect-info" type="button" data-quick-effect-info="${index}" title="View details" aria-label="View ${escapeHtml(effect.name || "effect")} details"><i class="bi bi-info-lg"></i></button>
    </article>
  `;
}

function bindQuickEffectCards(container, effects) {
  container.querySelectorAll("[data-quick-effect-info]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openQuickEffectInfo(effects[Number(button.dataset.quickEffectInfo)]);
    });
  });
  container.querySelectorAll("[data-quick-effect-index]").forEach((card) => {
    const choose = () => {
      const effect = effects[Number(card.dataset.quickEffectIndex)];
      if (!effect) return;
      if (isConditionEffect(effect)) {
        openQuickConditionConfig(effect);
        return;
      }
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
      chooseQuickEffect(effect, { casterLevel, turns, permanent });
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

function quickEffectGroupFor(effect = {}) {
  if (effect.passiveSource) return "passives";
  if (isConditionEffect(effect)) return "conditions";
  if (effect.ownedSpell) return "spells";
  if (effect.fromAbility) return "personal";
  return "other";
}

function quickEffectDetailLabel(key = "") {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function quickEffectDetailRows(effect = {}) {
  const ignored = new Set([
    "effects", "bonuses", "activeMechanics", "passiveMechanics",
    "description", "summary", "link", "url", "sourceUrl", "type",
  ]);
  const sourceDetails =
    effect.details && typeof effect.details === "object" ? effect.details : {};
  const data = {
    type: effect.type || effect.category || "",
    prerequisites: effect.prerequisites || "",
    benefit: effect.benefit || "",
    normal: effect.normal || "",
    special: effect.special || "",
    aura: sourceDetails.aura || "",
    casterLevel: sourceDetails.casterLevel || sourceDetails.cl || "",
    slot: sourceDetails.slot || "",
    price: sourceDetails.price || "",
    weight: sourceDetails.weight || "",
    requirements: sourceDetails.requirements || "",
    cost: sourceDetails.cost || "",
    ...(effect.detailData && typeof effect.detailData === "object"
      ? effect.detailData
      : {}),
  };
  const preferred = [
    "type", "class", "aura", "casterLevel", "slot", "price", "weight",
    "prerequisites", "benefit", "normal", "special", "requirements", "cost",
  ];
  const entries = [];
  preferred.forEach((key) => {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim())
      entries.push([key, value]);
  });
  Object.entries(data).forEach(([key, value]) => {
    if (preferred.includes(key) || ignored.has(key)) return;
    if (value === undefined || value === null || typeof value === "object") return;
    if (!String(value).trim()) return;
    entries.push([key, value]);
  });
  return entries;
}

function openQuickEffectInfo(effect = {}) {
  if (!effect?.name) return;
  el("quickEffectInfoModalLabel").textContent = effect.name;
  const description =
    effect.detailData?.description || effect.description || effect.summary || "";
  const rows = quickEffectDetailRows(effect);
  const link =
    effect.detailUrl || effect.url || effect.link || effect.detailData?.link || "";
  el("quickEffectInfoBody").innerHTML = `
    ${rows
      .map(([label, value]) => `<div class="quick-effect-detail-row"><strong>${escapeHtml(quickEffectDetailLabel(label))}</strong><div>${escapeHtml(String(value))}</div></div>`)
      .join("")}
    <div class="quick-effect-detail-description">${escapeHtml(description || "No description available.")}</div>
    ${link ? `<a class="btn btn-outline-info btn-sm" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open source</a>` : ""}
  `;
  const infoModal = bootstrap.Modal.getOrCreateInstance(
    el("quickEffectInfoModal"),
  );
  const showInfo = () => infoModal.show();
  if (el("quickEffectModal").classList.contains("show")) {
    el("quickEffectModal").addEventListener("hidden.bs.modal", showInfo, {
      once: true,
    });
    el("quickEffectInfoModal").addEventListener(
      "hidden.bs.modal",
      () => quickEffectModal.show(),
      { once: true },
    );
    quickEffectModal.hide();
  } else {
    showInfo();
  }
}

function quickConditionDescription(effect = {}) {
  return (
    effect.detailData?.description ||
    effect.description ||
    effect.summary ||
    effect.details?.description ||
    "No description available."
  );
}

function openQuickConditionConfig(effect = {}) {
  if (!effect?.name || !quickConditionModal) return;
  quickConditionEffect = effect;
  quickConditionReturnToPicker = true;
  el("quickConditionModalLabel").textContent = effect.name;
  el("quickConditionDescription").textContent = quickConditionDescription(effect);
  el("quickConditionTurns").value = "1";
  const showConfig = () => {
    const confirm = el("confirmQuickCondition");
    confirm.disabled = true;
    el("quickConditionModal").addEventListener(
      "shown.bs.modal",
      () => {
        confirm.disabled = false;
        el("quickConditionTurns").focus();
      },
      { once: true },
    );
    quickConditionModal.show();
  };
  if (el("quickEffectModal").classList.contains("show")) {
    el("quickEffectModal").addEventListener("hidden.bs.modal", showConfig, {
      once: true,
    });
    quickEffectModal.hide();
  } else {
    showConfig();
  }
}

function confirmQuickConditionConfig() {
  if (!quickConditionEffect) return;
  const effect = quickConditionEffect;
  const turns = Math.max(1, Number.parseInt(el("quickConditionTurns").value, 10) || 1);
  const casterLevel = tokenLevel(tokenById(quickEffectSourceTokenId));
  el("confirmQuickCondition").disabled = true;
  quickConditionReturnToPicker = false;
  el("quickConditionModal").addEventListener(
    "hidden.bs.modal",
    () => {
      quickConditionEffect = null;
      chooseQuickEffect(effect, { casterLevel, turns, permanent: false });
    },
    { once: true },
  );
  quickConditionModal.hide();
}

function effectDamageRolls(effect = {}) {
  return window.PFDamageRolls?.normalizeRolls?.(effect.damageRolls || []) || [];
}

function effectHasTargetMechanics(effect = {}) {
  if (effect.auraConfig?.enabled) return true;
  if (window.PFEffectMechanics?.hasBranches?.(effect)) return true;
  if (Array.isArray(effect.metamagicRiders) && effect.metamagicRiders.length)
    return true;
  if (Array.isArray(effect.bonuses) && effect.bonuses.length) return true;
  return (window.PFEffectMechanics?.extraKeys?.() || [])
    .filter((key) => key !== "damageRolls")
    .some((key) => Array.isArray(effect[key]) && effect[key].length);
}

async function rollQuickEffectDamage(effect = {}, casterLevel = 1) {
  const rolls = effectDamageRolls(effect);
  if (!rolls.length) return [];
  const sourceToken = tokenById(quickEffectSourceTokenId);
  const sourceCharacter =
    sourceToken?.kind === "character" ? tokenCharacter(sourceToken) : null;
  const context = {
    ...(effect.attributeScaleContext ||
      effect.abilityContext ||
      mapCharacterAttributeScaleContext(sourceCharacter || {})),
    casterLevel,
    classLevel: casterLevel,
  };
  quickEffectModal.hide();
  await new Promise((resolve) => setTimeout(resolve, 180));
  const results = await window.PFDamageRolls?.open?.({
    title: `${effect.name || "Effect"} Damage`,
    rolls,
    context,
  });
  if (results?.length) {
    addTimeline(
      `${sourceToken ? displayTokenName(sourceToken) : "A character"} uses ${effect.name || "an effect"}: ${window.PFDamageRolls.summary(results)}.`,
    );
    queueSave();
  }
  return results;
}

async function chooseQuickEffect(effect, options = {}) {
  if (!effect) return;
  const selection = {
    casterLevel: Math.max(1, Number(options.casterLevel || 1) || 1),
    turns: Math.max(1, Number(options.turns || 1) || 1),
    permanent: Boolean(options.permanent),
  };
  if (quickEffectMode === "aura") {
    auraEffectDraft = appliedEffectFromQuickSelection(effect, selection);
    updateAuraEffectSummary();
    quickEffectModal.hide();
    auraModal.show();
    return;
  }
  const damageRolls = effectDamageRolls(effect);
  if (damageRolls.length) {
    const results = await rollQuickEffectDamage(effect, selection.casterLevel);
    if (!results) {
      quickEffectModal.show();
      return;
    }
    if (!effectHasTargetMechanics(effect)) {
      incrementQuickEffectUsage(effect);
      renderAll();
      return;
    }
  }
  if (effect.auraConfig?.enabled) {
    const sourceToken = tokenById(quickEffectSourceTokenId);
    const applied = appliedEffectFromQuickSelection(effect, selection);
    const link = sourceToken
      ? installLinkedAutomaticAura(sourceToken, applied)
      : null;
    if (!link) return;
    const active = await loadTokenActiveEffects(sourceToken);
    if (!(await saveTokenActiveEffects(sourceToken, [...active, link.controller]))) {
      sourceToken.automaticAuras = sourceToken.automaticAuras.filter(
        (aura) => aura.id !== link.aura.id,
      );
      return;
    }
    incrementQuickEffectUsage(effect);
    addTimeline(`${displayTokenName(sourceToken)} activates ${effect.name || "an aura"}.`);
    quickEffectModal.hide();
    renderAll();
    return;
  }
  openQuickEffectTargets(effect, selection);
}

function renderOwnedSpellEffects(effects, defaultCl) {
  const results = el("quickEffectResults");
  const groups = new Map();
  effects.forEach((effect) => {
    const className = effect.spellMeta?.className || "Spells";
    if (!groups.has(className)) groups.set(className, new Map());
    const level = Number(effect.spellMeta?.level || 0);
    if (!groups.get(className).has(level)) groups.get(className).set(level, []);
    groups.get(className).get(level).push(effect);
  });
  const bucketOrder = ["book", "known", "prepared", "sla"];
  const bucketLabel = (bucket) => ({
    book: "Known in Book",
    known: "Known Spells",
    prepared: "Prepared Today",
    sla: "Spell-Like Abilities",
  }[bucket] || "Spells");
  results.innerHTML = groups.size
    ? [...groups.entries()]
        .map(
          ([className, levels]) => `
            <article class="quick-spellcasting-card">
              <div class="quick-spellcasting-header">${escapeHtml(className)}</div>
              ${[...levels.entries()]
                .sort(([left], [right]) => left - right)
                .map(
                  ([level, levelEffects]) => {
                    const buckets = new Map();
                    levelEffects.forEach((effect) => {
                      const bucket = effect.spellMeta?.kind === "sla"
                        ? "sla"
                        : effect.spellMeta?.bucket || "known";
                      if (!buckets.has(bucket)) buckets.set(bucket, []);
                      buckets.get(bucket).push(effect);
                    });
                    const visibleBuckets = bucketOrder.filter((bucket) =>
                      buckets.has(bucket),
                    );
                    const tabGroup = `${String(className).replace(/[^a-z0-9]+/gi, "-")}-${level}`;
                    const activeBucket = visibleBuckets.includes(
                      quickSpellMobilePanels[tabGroup],
                    )
                      ? quickSpellMobilePanels[tabGroup]
                      : visibleBuckets[0];
                    return `
                    <div class="quick-spell-row">
                      <div class="quick-spell-level">${level}</div>
                      <div class="quick-spell-buckets${visibleBuckets.length === 1 ? " is-single" : ""}">
                        ${visibleBuckets.length > 1
                          ? `<div class="quick-spell-mobile-tabs" role="group" aria-label="${escapeHtml(className)} level ${level} spell lists">
                              ${visibleBuckets
                                .map(
                                  (bucket) => `<button class="quick-spell-mobile-tab${bucket === activeBucket ? " active" : ""}" type="button" data-quick-spell-mobile-tab="${escapeHtml(bucket)}" data-quick-spell-mobile-group="${escapeHtml(tabGroup)}">${escapeHtml(bucketLabel(bucket).replace(" in Book", ""))}</button>`,
                                )
                                .join("")}
                            </div>`
                          : ""}
                        ${visibleBuckets
                          .map((bucket) => `
                          <section class="quick-spell-bucket${bucket === activeBucket ? " is-mobile-active" : ""}" data-quick-spell-mobile-panel="${escapeHtml(bucket)}" data-quick-spell-mobile-group="${escapeHtml(tabGroup)}">
                            <div class="quick-spell-bucket-title">${bucketLabel(bucket)}</div>
                            <div class="quick-spell-list">
                              ${buckets.get(bucket)
                                .sort((left, right) => left.name.localeCompare(right.name))
                                .map((effect) => {
                                  const index = effects.indexOf(effect);
                                  const frequency = bucket === "sla"
                                    ? `<span>${escapeHtml(effect.spellMeta?.frequency || "At will")}</span>`
                                    : "";
                                  return `<button class="btn btn-outline-info btn-sm quick-spell-button" type="button" data-quick-spell-index="${index}"><span>${escapeHtml(effect.name)}</span>${frequency}</button>`;
                                })
                                .join("")}
                            </div>
                          </section>`)
                          .join("")}
                      </div>
                    </div>`;
                  },
                )
                .join("")}
            </article>`,
        )
        .join("")
    : `<div class="small text-secondary">No matching owned spells or spell-like abilities found.</div>`;
  results.querySelectorAll("[data-quick-spell-index]").forEach((button) => {
    button.addEventListener("click", () =>
      openMapOwnedSpellDetails(
        effects[Number(button.dataset.quickSpellIndex)],
        defaultCl,
      ),
    );
  });
  results.querySelectorAll("[data-quick-spell-mobile-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.quickSpellMobileGroup || "";
      const bucket = button.dataset.quickSpellMobileTab || "";
      if (!group || !bucket) return;
      quickSpellMobilePanels[group] = bucket;
      results
        .querySelectorAll(`[data-quick-spell-mobile-group="${CSS.escape(group)}"]`)
        .forEach((element) => {
          if (element.matches("[data-quick-spell-mobile-tab]")) {
            element.classList.toggle(
              "active",
              element.dataset.quickSpellMobileTab === bucket,
            );
          } else {
            element.classList.toggle(
              "is-mobile-active",
              element.dataset.quickSpellMobilePanel === bucket,
            );
          }
        });
    });
  });
}

async function openMapOwnedSpellDetails(effect, defaultCl = 1) {
  if (!effect) return;
  const sourceToken = tokenById(quickEffectSourceTokenId);
  const character = sourceToken?.kind === "character"
    ? tokenCharacter(sourceToken)
    : null;
  let spell = effect.spell || null;
  let calculations = effect.spellCalculations || null;
  let bridge = null;
  if (character) {
    try {
      bridge = await characterSheetBridge();
      const detail = await bridge?.spellDetailsForCharacter?.(
        mapContextKey,
        character.id,
        { ...effect.spellMeta, name: effect.name },
      );
      if (detail?.spell) spell = detail.spell;
      if (detail?.calculations) calculations = detail.calculations;
    } catch (error) {
      console.warn("Could not calculate map spell details.", error);
    }
  }
  if (!spell || !window.PFSpellPicker?.openDetails) return;
  const hasConfiguredEffects =
    effectHasTargetMechanics(effect) || effectDamageRolls(effect).length > 0;
  let casting = false;
  quickEffectModal.hide();
  await window.PFSpellPicker.openDetails({
    title: effect.name,
    spell,
    spellName: effect.name,
    className: effect.spellMeta?.kind === "sla" ? "" : effect.spellMeta?.className || "",
    spellLevel: Number(effect.spellMeta?.level || 0),
    calculations,
    recalculate: async (casterLevel) => {
      if (!bridge || !character) return calculations;
      const detail = await bridge.spellDetailsForCharacter?.(
        mapContextKey,
        character.id,
        { ...effect.spellMeta, name: effect.name },
        casterLevel,
      );
      return detail?.calculations || calculations;
    },
    onCast: async ({ spell: castSpell, casterLevel, calculations: castCalculations, closeDetails }) => {
      const castEffect = window.PFMetamagic?.decorateQuickEffect
        ? window.PFMetamagic.decorateQuickEffect(effect, castSpell || spell)
        : effect;
      const castHasConfiguredEffects =
        hasConfiguredEffects ||
        effectHasTargetMechanics(castEffect) ||
        effectDamageRolls(castEffect).length > 0;
      casting = true;
      await closeDetails?.();
      const failureChance = Number(
        castCalculations?.arcaneSpellFailure?.chance || 0,
      );
      if (failureChance > 0) {
        const castContinues = await window.PFArcaneSpellFailure?.check?.({
          chance: failureChance,
          spellName: effect.name || "Spell",
        });
        if (!castContinues) return { close: true };
      }
      if (!castHasConfiguredEffects) {
        recordQuickSpellCast(castEffect);
        return { close: true };
      }
      void chooseQuickEffect(castEffect, {
        casterLevel: casterLevel || defaultCl,
      });
      return { close: true };
    },
  });
  if (!casting) quickEffectModal.show();
}

function renderOtherEffectGroups(effects, defaultCl) {
  const results = el("quickEffectResults");
  const groups = new Map();
  effects.forEach((effect) => {
    const type = String(effect.category || "Effect").trim() || "Effect";
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(effect);
  });
  const entries = [...groups.entries()].sort(([left], [right]) => {
    const leftItem = left.toLowerCase() === "item";
    const rightItem = right.toLowerCase() === "item";
    return Number(leftItem) - Number(rightItem) || left.localeCompare(right);
  });
  results.innerHTML = entries.length
    ? entries
        .map(
          ([type, group], groupIndex) => `
            <section class="quick-effect-type-section">
              <div class="side-title">${escapeHtml(type)}</div>
              <div class="quick-effect-grid" data-quick-effect-type-group="${groupIndex}">
                ${group
                  .map((effect, index) =>
                    effectCardHtml(effect, index, `quickOther${groupIndex}`, defaultCl),
                  )
                  .join("")}
              </div>
            </section>`,
        )
        .join("")
    : `<div class="small text-secondary">No matching effects found.</div>`;
  entries.forEach(([, group], index) => {
    const container = results.querySelector(
      `[data-quick-effect-type-group="${index}"]`,
    );
    if (container) bindQuickEffectCards(container, group);
  });
}

function quickEffectGroupLabel(group = "other") {
  return {
    personal: "Personal",
    spells: "Spells",
    conditions: "Conditions",
    other: "Other",
    passives: "Passives",
  }[group] || "Other";
}

function quickEffectLoadingCardHtml() {
  return `
    <article class="quick-effect-card quick-effect-loading-card" aria-label="Loading effect">
      <span class="quick-effect-loading-line is-title"></span>
      <span class="quick-effect-loading-line"></span>
    </article>
  `;
}

function quickEffectLoadingHtml(group = quickEffectGroup) {
  if (group === "spells") {
    const spellRows = Array.from(
      { length: 4 },
      () => '<span class="quick-effect-loading-spell"></span>',
    ).join("");
    return `
      <article class="quick-spellcasting-card quick-effect-loading-card" aria-label="Loading spells">
        <span class="quick-effect-loading-line is-title"></span>
        <div class="quick-spell-row">
          <div class="quick-spell-level">1</div>
          <div class="quick-spell-buckets">
            <section class="quick-spell-bucket">
              <div class="quick-spell-bucket-title">Known / In Book</div>
              <div class="quick-spell-list">${spellRows}</div>
            </section>
            <section class="quick-spell-bucket">
              <div class="quick-spell-bucket-title">Prepared Today</div>
              <div class="quick-spell-list">${spellRows}</div>
            </section>
          </div>
        </div>
      </article>
    `;
  }
  const cards = Array.from({ length: group === "conditions" ? 5 : 4 }, () =>
    quickEffectLoadingCardHtml(),
  ).join("");
  if (group === "other") {
    return `
      <section class="quick-effect-type-section quick-effect-loading-card" aria-label="Loading effects">
        <span class="quick-effect-loading-line is-title"></span>
        <div class="quick-effect-grid">${cards}</div>
      </section>
    `;
  }
  return cards;
}

function selectQuickEffectGroup(group) {
  if (!["personal", "spells", "conditions", "other", "passives"].includes(group)) return;
  quickEffectGroup = group;
  renderQuickEffects();
}

function renderQuickEffects() {
  const sourceToken = tokenById(quickEffectSourceTokenId);
  const defaultCl = tokenLevel(sourceToken);
  const term = el("quickEffectSearch").value.trim().toLowerCase();
  const groupedEffects = quickEffectDefinitions.filter((effect) =>
    quickEffectGroup === "other"
      ? effect.catalogEffect === true
      : quickEffectGroupFor(effect) === quickEffectGroup,
  );
  const matches = groupedEffects.filter(
    (effect) => !term || effectSearchText(effect).includes(term),
  );
  const counts = quickEffectUsageCounts();
  const mostUsed = groupedEffects
    .filter(
      (effect) => Number(counts[effect.id] || counts[effect.name] || 0) > 0,
    )
    .sort(
      (a, b) =>
        Number(counts[b.id] || counts[b.name] || 0) -
        Number(counts[a.id] || counts[a.name] || 0),
    )
    .slice(0, 7);

  el("quickEffectNav")
    .querySelectorAll("[data-quick-effect-group]")
    .forEach((button) => {
      const active = button.dataset.quickEffectGroup === quickEffectGroup;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  el("quickEffectGroupTitle").textContent =
    ["spells", "conditions", "passives"].includes(quickEffectGroup)
      ? quickEffectGroupLabel(quickEffectGroup)
      : `${quickEffectGroupLabel(quickEffectGroup)} Effects`;

  if (quickEffectLoading) {
    el("quickEffectMostUsedWrap").classList.add("d-none");
    el("quickEffectResults").classList.toggle(
      "quick-effect-list",
      ["personal", "conditions", "passives"].includes(quickEffectGroup),
    );
    el("quickEffectResults").classList.toggle(
      "quick-spells-view",
      quickEffectGroup === "spells",
    );
    el("quickEffectResults").classList.toggle(
      "quick-grouped-view",
      quickEffectGroup === "other",
    );
    el("quickEffectResults").innerHTML = quickEffectLoadingHtml();
    return;
  }

  const useStandardCards = !["spells", "other", "passives", "personal"].includes(quickEffectGroup);
  el("quickEffectMostUsedWrap").classList.toggle(
    "d-none",
    !useStandardCards || !mostUsed.length,
  );
  el("quickEffectMostUsed").innerHTML = mostUsed
    .map((effect, index) =>
      effectCardHtml(effect, index, "quickMost", defaultCl),
    )
    .join("");
  el("quickEffectResults").classList.toggle(
    "quick-effect-list",
    ["personal", "conditions", "passives"].includes(quickEffectGroup),
  );
  el("quickEffectResults").classList.toggle(
    "quick-spells-view",
    quickEffectGroup === "spells",
  );
  el("quickEffectResults").classList.toggle(
    "quick-grouped-view",
    quickEffectGroup === "other",
  );
  if (quickEffectGroup === "spells") {
    renderOwnedSpellEffects(matches, defaultCl);
  } else if (quickEffectGroup === "other") {
    renderOtherEffectGroups(matches, defaultCl);
  } else {
    el("quickEffectResults").innerHTML = matches.length
      ? matches
          .map((effect, index) =>
            effectCardHtml(effect, index, "quickAll", defaultCl),
          )
          .join("")
      : `<div class="small text-secondary">No matching effects found.</div>`;
    bindQuickEffectCards(el("quickEffectResults"), matches);
  }

  bindQuickEffectCards(el("quickEffectMostUsed"), mostUsed);
}

function mapSpellcastingStateKey(value = "") {
  return String(value || "Class").replace(/[^a-z0-9]+/gi, "_");
}

function spellEffectDefinition(spell = {}, metadata = {}) {
  const mechanics = window.PFEffectMechanics?.activeMechanics?.(spell, {
    activeOnly: true,
  }) || { effects: [] };
  const durationConfig =
    mechanics.durationConfig ||
    window.PFEffectMeta?.durationConfigFromSpellText?.(spell.details?.duration) ||
    null;
  const effect = {
    id: `spell:${metadata.kind || "spell"}:${metadata.className || ""}:${metadata.level ?? ""}:${spell.name || metadata.name || "spell"}`,
    name: spell.name || metadata.name || "Spell",
    category: "Spell",
    source:
      metadata.kind === "sla"
        ? `${metadata.source || "Spell-Like Ability"} | ${metadata.frequency || "At will"}`
        : metadata.className || "Spell",
    bonuses: mechanics.effects || [],
    durationConfig,
    auraConfig: mechanics.auraConfig || null,
    ...(window.PFEffectMechanics?.hasBranches?.(mechanics)
      ? { branches: mechanics.branches }
      : {}),
    duration: window.PFEffectMeta?.durationLabel
      ? window.PFEffectMeta.durationLabel(durationConfig || {})
      : "variable",
    ownedSpell: true,
    spellMeta: metadata,
    spell,
  };
  (window.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
    if (Array.isArray(mechanics[key]) && mechanics[key].length) {
      effect[key] = mechanics[key];
    }
  });
  return effect;
}

async function characterOwnedSpellEffects(character) {
  if (!character?.sheet) return [];
  try {
    const bridge = await characterSheetBridge();
    if (bridge?.spellEffectSourcesForCharacter) {
      const resolved = await bridge.spellEffectSourcesForCharacter(
        mapContextKey,
        character.id,
      );
      if (Array.isArray(resolved)) return resolved;
    }
  } catch (error) {
    console.warn("Could not resolve character spells through the sheet.", error);
  }
  const definitions = await window.PFSpellData?.loadSpells?.();
  const spellByName = new Map(
    (definitions || []).map((spell) => [
      String(spell.name || "").trim().toLowerCase(),
      spell,
    ]),
  );
  const classNames = new Map();
  (character.sheet.classProgression || []).forEach((row) => {
    if (row?.className) {
      classNames.set(mapSpellcastingStateKey(row.className), row.className);
    }
  });
  const results = [];
  const seen = new Set();
  Object.entries(character.sheet.spells || {}).forEach(([classKey, state]) => {
    const className = classNames.get(classKey) || classKey.replaceAll("_", " ");
    ["known", "book", "prepared"].forEach((bucket) => {
      Object.entries(state?.[bucket] || {}).forEach(([level, names]) => {
        (Array.isArray(names) ? names : []).filter(Boolean).forEach((name) => {
          const key = `${classKey}:${bucket}:${level}:${String(name).toLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);
          const spell = spellByName.get(String(name).trim().toLowerCase()) || {
            name,
          };
          results.push(
            spellEffectDefinition(spell, {
              kind: "spell",
              className,
              level: Number(level),
              bucket,
            }),
          );
        });
      });
    });
  });

  const buffs = [
    ...(Array.isArray(character.sheet.activeBuffs)
      ? character.sheet.activeBuffs
      : []),
    ...((await PFApp.loadBuffState?.(mapContextKey, character.id)) || []),
  ];
  buffs.forEach((buff) => {
    (Array.isArray(buff.spellLikeAbilities) ? buff.spellLikeAbilities : []).forEach(
      (entry) => {
        const name = String(entry.spellName || entry.name || entry.spell || "").trim();
        if (!name) return;
        const key = `sla:${name.toLowerCase()}:${buff.name || buff.source || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        const spell = spellByName.get(name.toLowerCase()) || { name };
        results.push(
          spellEffectDefinition(spell, {
            kind: "sla",
            className: "Spell-Like Abilities",
            level: Number(entry.spellLevel ?? entry.level ?? 0),
            frequency: entry.frequency || "At will",
            source: buff.name || buff.source || "Spell-Like Ability",
          }),
        );
      },
    );
  });
  return results;
}

async function characterPassiveEffects(character) {
  if (!character?.sheet) return [];
  try {
    const bridge = await characterSheetBridge();
    const resolved = await bridge?.passiveEffectSourcesForCharacter?.(
      mapContextKey,
      character.id,
    );
    return Array.isArray(resolved) ? resolved : [];
  } catch (error) {
    console.warn("Could not resolve character passive effects.", error);
    return [];
  }
}

function catalogEffectFromMechanics(
  entry,
  mechanics,
  { category, source, id, variant = "" },
) {
  const effect = {
    id,
    name: entry.name || entry.title || entry.label || "Effect",
    category,
    source: [source, variant].filter(Boolean).join(" | "),
    bonuses: mechanics.effects || [],
    durationConfig: mechanics.durationConfig || entry.durationConfig || null,
    auraConfig: mechanics.auraConfig || entry.auraConfig || null,
    ...(window.PFEffectMechanics?.hasBranches?.(mechanics)
      ? { branches: mechanics.branches }
      : {}),
    duration: window.PFEffectMeta?.durationLabel
      ? window.PFEffectMeta.durationLabel(
          mechanics.durationConfig || entry.durationConfig || {},
        )
      : "variable",
    description:
      entry.description || entry.benefit || entry.summary || entry.details?.description || "",
    detailUrl: entry.link || entry.url || entry.sourceUrl || "",
    detailData: entry.details && typeof entry.details === "object" ? entry.details : {},
    catalogEffect: true,
  };
  (window.PFEffectMechanics?.extraKeys?.() || []).forEach((key) => {
    if (Array.isArray(mechanics[key]) && mechanics[key].length) {
      effect[key] = mechanics[key];
    }
  });
  return effect;
}

function collectCatalogEffects(root, { category, source, idPrefix, directAsActive = false }) {
  const results = [];
  const seenObjects = new WeakSet();
  const mechanicKeys = new Set([
    "activeMechanics",
    "passiveMechanics",
    "effects",
    "branches",
    ...(window.PFEffectMechanics?.extraKeys?.() || []),
  ]);
  let sequence = 0;

  const add = (entry, mechanics, entrySource, variant) => {
    if (!mechanics) return;
    if (!window.PFEffectMechanics?.hasAnyMechanics?.(mechanics)) return;
    const name = String(entry.name || entry.title || entry.label || "").trim();
    if (!name) return;
    results.push(
      catalogEffectFromMechanics(entry, mechanics, {
        category,
        source: entrySource || source,
        id: `${idPrefix}:${sequence++}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        variant,
      }),
    );
  };

  const walk = (value, inheritedSource = source) => {
    if (!value || typeof value !== "object") return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry) => walk(entry, inheritedSource));
      return;
    }

    const entrySource =
      String(value.name || value.title || value.label || "").trim() || inheritedSource;
    const active = window.PFEffectMechanics?.activeMechanics?.(value, {
      activeOnly: directAsActive,
    });
    const passive = directAsActive
      ? null
      : window.PFEffectMechanics?.passiveMechanics?.(value);
    const hasActive = Boolean(
      active && window.PFEffectMechanics?.hasAnyMechanics?.(active),
    );
    const hasPassive = Boolean(
      passive && window.PFEffectMechanics?.hasAnyMechanics?.(passive),
    );
    add(value, active, inheritedSource, hasPassive ? "Active" : "");
    add(value, passive, inheritedSource, hasActive ? "Passive" : "");

    Object.entries(value).forEach(([key, child]) => {
      if (mechanicKeys.has(key)) return;
      walk(child, entrySource);
    });
  };

  walk(root);
  return results;
}

async function loadAuthoredCatalogEffects() {
  const safeLoad = async (loader, fallback) => {
    try {
      return (await loader?.()) ?? fallback;
    } catch (error) {
      console.warn("Could not load an authored effect catalog.", error);
      return fallback;
    }
  };
  const itemCatalogKeys = Object.keys(window.PFItemData?.CATALOGS || {});
  const [conditions, classes, races, feats, spells, itemCatalogs] =
    await Promise.all([
      safeLoad(() => PFApp.loadConditionDefinitions?.(), []),
      safeLoad(() => window.PFClassData?.loadAllClasses?.(), []),
      safeLoad(() => window.PFRaceData?.loadRaces?.(), { races: [] }),
      safeLoad(() => window.PFFeatData?.loadFeats?.(), { feats: [] }),
      safeLoad(() => window.PFSpellData?.loadSpells?.(), []),
      Promise.all(
        itemCatalogKeys.map((key) =>
          safeLoad(() => window.PFItemData.loadCatalog(key), []),
        ),
      ),
    ]);

  const authored = [
    ...(conditions || []).map((condition) => ({
      ...condition,
      catalogEffect: true,
    })),
    ...collectCatalogEffects(classes, {
      category: "Class Ability",
      source: "Class",
      idPrefix: "class",
    }),
    ...collectCatalogEffects(races?.races || races, {
      category: "Racial Trait",
      source: "Race",
      idPrefix: "race",
    }),
    ...collectCatalogEffects(feats?.feats || feats, {
      category: "Feat",
      source: "Feat",
      idPrefix: "feat",
    }),
    ...collectCatalogEffects(spells, {
      category: "Spell",
      source: "Spell",
      idPrefix: "spell",
      directAsActive: true,
    }),
    ...collectCatalogEffects(itemCatalogs, {
      category: "Item",
      source: "Item",
      idPrefix: "item",
    }),
  ];
  const unique = new Map();
  authored.forEach((effect) => {
    const key = [effect.category, effect.name, effect.source]
      .map((part) => String(part || "").trim().toLowerCase())
      .join("::");
    if (!unique.has(key)) unique.set(key, effect);
  });
  return [...unique.values()];
}

async function authoredCatalogEffects() {
  if (window.PFEffectCatalog?.load) return window.PFEffectCatalog.load();
  if (!authoredCatalogEffectsPromise) {
    authoredCatalogEffectsPromise = loadAuthoredCatalogEffects().catch((error) => {
      authoredCatalogEffectsPromise = null;
      throw error;
    });
  }
  return authoredCatalogEffectsPromise;
}

async function characterMapEffectSources(character) {
  if (!character?.sheet) return { activatable: [], spells: [], passives: [] };
  const signature = JSON.stringify(character.sheet);
  const cached = mapEffectSourceCache.get(character.id);
  if (cached?.signature === signature) return cached.sources;
  try {
    const bridge = await characterSheetBridge();
    if (bridge?.mapEffectSourcesForCharacter) {
      const sources = await bridge.mapEffectSourcesForCharacter(
        mapContextKey,
        character.id,
      );
      if (sources && typeof sources === "object") {
        mapEffectSourceCache.set(character.id, { signature, sources });
        return sources;
      }
    }
  } catch (error) {
    console.warn("Could not resolve map effects through the sheet.", error);
  }
  const [activatable, spells, passives] = await Promise.all([
    characterActivatableAbilities(character),
    characterOwnedSpellEffects(character),
    characterPassiveEffects(character),
  ]);
  const sources = { activatable, spells, passives };
  mapEffectSourceCache.set(character.id, { signature, sources });
  return sources;
}

function scheduleAccessibleEffectSourcePrefetch() {
  const generation = ++mapEffectPrefetchGeneration;
  const characters = mapCharacters.filter(
    (character) => isGm || character.userId === currentUserId,
  );
  const prefetch = async () => {
    try {
      await authoredCatalogEffects();
      for (const character of characters) {
        if (generation !== mapEffectPrefetchGeneration) return;
        await characterMapEffectSources(character);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    } catch (error) {
      console.warn("Could not prefetch map effect sources.", error);
    }
  };
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => void prefetch(), { timeout: 2500 });
    return;
  }
  window.setTimeout(() => void prefetch(), 900);
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
  const [catalog, sources] = await Promise.all([
    authoredCatalogEffects(),
    sourceCharacter
      ? characterMapEffectSources(sourceCharacter)
      : Promise.resolve({ activatable: [], spells: [], passives: [] }),
  ]);
  return [
    ...(sources.activatable || []),
    ...(sources.spells || []),
    ...catalog,
    ...(sources.passives || []),
  ];
}

async function openQuickApplyEffect() {
  const token = tokenById(contextMenuTokenId);
  if (!token || !canManageEffects(token)) return;
  hideContextMenu();
  quickEffectMode = "apply";
  quickEffectGroup = "personal";
  quickEffectSourceTokenId = token.id;
  el("quickEffectModalLabel").textContent =
    `Apply Effect from ${displayTokenName(token)}`;
  el("quickEffectSearch").value = "";
  quickEffectLoading = true;
  renderQuickEffects();
  quickEffectModal.show();
  setTimeout(() => el("quickEffectSearch").focus(), 150);
  try {
    quickEffectDefinitions = await sourceEffectDefinitions(token);
  } finally {
    quickEffectLoading = false;
  }
  renderQuickEffects();
}

async function openAuraEffectPicker() {
  const token = tokenById(auraEditingTokenId);
  if (!token || !canManageAura(token)) return;
  quickEffectMode = "aura";
  quickEffectGroup = "personal";
  quickEffectSourceTokenId = token.id;
  el("quickEffectModalLabel").textContent =
    `Aura Effect for ${displayTokenName(token)}`;
  el("quickEffectSearch").value = "";
  quickEffectLoading = true;
  renderQuickEffects();
  auraModal.hide();
  quickEffectModal.show();
  setTimeout(() => el("quickEffectSearch").focus(), 150);
  try {
    quickEffectDefinitions = await sourceEffectDefinitions(token);
  } finally {
    quickEffectLoading = false;
  }
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

function appliedEffectFromQuickSelection(effect, options, targetCount = 1) {
  const casterAttributeContext =
    effect.attributeScaleContext || effect.abilityContext || {};
  const casterLevel = Math.max(1, Number(options?.casterLevel || 1) || 1);
  const turns = Math.max(1, Number(options?.turns || 1) || 1);
  const permanent = Boolean(options?.permanent);
  const condition = isConditionEffect(effect);
  // A class-feature ability's duration (e.g. Rage's "4 rounds + CON
  // modifier") needs the caster's full stat block, not just a typed-in
  // caster level -- same distinction buff-tracker-widget.js's addEffect
  // makes.
  const durationArg = effect.fromAbility
    ? { ...(effect.abilityContext || { casterLevel }), targetCount }
    : { casterLevel, targetCount };
  const baseDurationLabel = durationLabel(effect);
  let calculatedDuration = condition
    ? turns
    : parseEffectDuration(effect, durationArg);
  const durationMultiplier = Number(effect.metamagicDurationMultiplier || 1);
  if (
    calculatedDuration !== null &&
    calculatedDuration !== undefined &&
    Number.isFinite(durationMultiplier) &&
    durationMultiplier !== 1
  ) {
    calculatedDuration = Math.max(
      1,
      Math.floor(calculatedDuration * durationMultiplier),
    );
  }
  const splitAmongTargets = Boolean(
    window.PFEffectMeta?.normalizeDurationConfig?.(effect)?.splitAmongTargets &&
      targetCount > 1,
  );
  const computedDurationLabel = splitAmongTargets
    ? `${targetCount} targets: ${formatDurationRounds(calculatedDuration)} each`
    : formatDurationRounds(calculatedDuration);
  const appliedDurationLabel = permanent
    ? "Permanent"
    : condition
      ? `${turns} turn${turns === 1 ? "" : "s"}`
      : calculatedDuration === null
        ? baseDurationLabel
        : durationUsesCasterLevel(effect)
          ? `${baseDurationLabel} | CL ${casterLevel}: ${computedDurationLabel}`
          : `${baseDurationLabel} | ${computedDurationLabel}`;

  // fromAbility/abilityContext only exist to drive this pick -- strip
  // them so the saved active-effect entry matches the normal buff shape
  // instead of carrying the caster's whole stat block.
  const {
    fromAbility,
    abilityContext,
    attributeScaleContext,
    spell,
    spellCalculations,
    damageRolls,
    ...persistedEffect
  } = effect;
  const resolvedEffect =
    window.PFEffectMechanics?.resolveCasterAttributeScales?.(
      persistedEffect,
      casterAttributeContext,
    ) || persistedEffect;
  return {
    ...resolvedEffect,
    casterLevel: fromAbility
      ? abilityContext?.characterLevel || casterLevel
      : casterLevel,
    turns: condition ? turns : undefined,
    permanent,
    remaining: permanent ? null : calculatedDuration,
    computedDuration: calculatedDuration,
    durationTargetCount: splitAmongTargets ? targetCount : undefined,
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
    if (!savedBuffs || savedBuffs.ok === false) {
      console.error(savedBuffs?.error || "Could not apply effect");
      return false;
    }
    const character = tokenCharacter(token);
    const nextActiveBuffs = Array.isArray(savedBuffs.activeBuffs)
      ? savedBuffs.activeBuffs
      : [...(character?.sheet?.activeBuffs || []), appliedEffect];
    if (character) character.sheet.activeBuffs = nextActiveBuffs;
    mapEffectSourceCache.delete(token.characterId);
    const stamp = String(Date.now());
    localStorage.setItem(`pf_buffs_updated_${mapContextKey}`, stamp);
    localStorage.setItem(
      `pf_buffs_updated_${mapContextKey}_${token.characterId}`,
      stamp,
    );
    void recalculateCharacterSheetFromMap(
      token.characterId,
      character,
      nextActiveBuffs,
    ).then((calculated) => {
      if (!character || !calculated) return;
      character.sheet.calculated = calculated;
      if (syncTokenFromSheet(token, character)) renderAll(false);
    });
    return true;
  }

  if (token.kind === "enemy") {
    const saved = await PFApp.applyEnemyMapEffect?.(
      token.enemyId,
      appliedEffect,
      mapContextKey,
    );
    if (!saved) return false;
    token.sheet = saved.sheet || token.sheet || {};
    const nextEnemy = { ...saved, sheet: token.sheet };
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
    void recalculateEnemySheetFromMap(saved.id, nextEnemy).then((calculated) => {
      if (!calculated) return;
      token.sheet.calculated = calculated;
      const enemy = mapEnemies.find((item) => item.id === saved.id);
      if (enemy?.sheet) enemy.sheet.calculated = calculated;
      syncTokenFromSheet(token, enemy || nextEnemy);
      renderAll(false);
    });
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

function reconcileTokenLinkedAuras(token, activeEffects = []) {
  const effectIds = new Set(
    (Array.isArray(activeEffects) ? activeEffects : [])
      .map((effect) => effect?.id)
      .filter(Boolean),
  );
  const current = Array.isArray(token?.automaticAuras)
    ? token.automaticAuras
    : [];
  const next = current.filter(
    (aura) =>
      aura.kind === "passive" ||
      !aura.linkedEffectId ||
      effectIds.has(aura.linkedEffectId),
  );
  if (next.length === current.length) return false;
  token.automaticAuras = next;
  return true;
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
    const character = tokenCharacter(token);
    const nextActiveBuffs = Array.isArray(savedBuffs?.activeBuffs)
      ? savedBuffs.activeBuffs
      : activeEffects;
    if (character) character.sheet.activeBuffs = nextActiveBuffs;
    mapEffectSourceCache.delete(token.characterId);
    const calculated = await recalculateCharacterSheetFromMap(
      token.characterId,
      character,
      nextActiveBuffs,
    );
    if (character) {
      if (calculated) character.sheet.calculated = calculated;
      syncTokenFromSheet(token, character);
    }
    if (reconcileTokenLinkedAuras(token, nextActiveBuffs)) queueSave();
    return true;
  }
  if (token.kind === "enemy") {
    const saved = await PFApp.updateEnemyEffectSummary?.(
      token.enemyId,
      activeEffects,
      token.sheet?.calculated || {},
      mapContextKey,
    );
    if (!saved) return false;
    token.sheet = saved.sheet || token.sheet || {};
    const calculated = await recalculateEnemySheetFromMap(token.enemyId, saved);
    if (calculated) token.sheet.calculated = calculated;
    if (reconcileTokenLinkedAuras(token, activeEffects)) queueSave();
    return true;
  }
  return false;
}

function scheduleOutOfRangeAuraCleanup(changedTokenId = "", delay = 350) {
  const changedToken = changedTokenId ? tokenById(changedTokenId) : null;
  const movedAuraSource = changedToken
    ? tokenAuraEntries(changedToken).some(
        ({ aura }) => aura?.effect && aura.removeWhenOutOfRange,
      )
    : true;
  if (movedAuraSource) pendingAuraCleanupTokenIds.add("*");
  else if (changedTokenId) pendingAuraCleanupTokenIds.add(changedTokenId);
  clearTimeout(auraCleanupTimer);
  auraCleanupTimer = window.setTimeout(() => {
    auraCleanupTimer = null;
    const ids = pendingAuraCleanupTokenIds.has("*")
      ? null
      : new Set(pendingAuraCleanupTokenIds);
    pendingAuraCleanupTokenIds.clear();
    void removeOutOfRangeAuraEffects({ tokenIds: ids });
  }, Math.max(0, Number(delay) || 0));
}

async function removeOutOfRangeAuraEffects({ tokenIds = null } = {}) {
  const managedTokens = state.tokens.filter(
    (token) =>
      (token.kind === "character" || token.kind === "enemy") &&
      canManageEffects(token) &&
      (!tokenIds || tokenIds.has(token.id)),
  );
  const loaded = await Promise.all(
    managedTokens.map(async (token) => ({
      token,
      active: await loadTokenActiveEffects(token),
    })),
  );
  const updates = [];
  loaded.forEach(({ token, active }) => {
    const next = active.filter((effect) => {
      if (!effect.auraSourceId || !effect.auraTokenId) return true;
      const auraToken = tokenById(effect.auraTokenId);
      const auraEntry = tokenAuraEntry(auraToken, effect.auraId || "manual");
      return Boolean(
        auraEntry &&
          (!auraEntry.aura.removeWhenOutOfRange ||
            tokenInAura(token, auraToken, auraEntry.aura)),
      );
    });
    if (next.length !== active.length) updates.push({ token, next });
  });
  if (!updates.length) return;
  await Promise.all(
    updates.map(({ token, next }) => saveTokenActiveEffects(token, next)),
  );
  renderAll();
}

// Resolves any "choice:" bonuses on an effect before it lands on a
// token -- locally, via a picker, if whoever's applying it already owns
// that character; otherwise by queuing a cross-device request (see
// modals/pending-effect-choices.js) so the choice lands with whoever
// actually controls the target, not whoever cast the effect.
// Returns { effect, queued }: effect is null if nothing should be
// applied right now (cancelled, or queued for later).
function effectConditionalVariables(effect = {}) {
  return Array.isArray(effect.conditionalVariables)
    ? effect.conditionalVariables
    : [];
}

function normalizeConditionalVariableKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ");
}

function mapConditionalVariableTokenValue(key = "", choice = {}) {
  const fallback = choice?.label || choice?.name || choice?.value || "";
  return normalizeConditionalVariableKey(key).startsWith("favored enemy")
    ? cleanMapFavoredEnemyLabel(choice?.value || choice?.name || fallback)
    : fallback;
}

function replaceConditionalVariableTokens(text = "", choices = {}) {
  return String(text || "").replace(/\{([^{}]+)\}/g, (match, key) => {
    const choice = choices[normalizeConditionalVariableKey(key)];
    return choice ? mapConditionalVariableTokenValue(key, choice) || match : match;
  });
}

function interpolateConditionalVariables(value, choices = {}) {
  if (Array.isArray(value))
    return value.map((item) => interpolateConditionalVariables(item, choices));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        interpolateConditionalVariables(entry, choices),
      ]),
    );
  }
  if (typeof value === "string")
    return replaceConditionalVariableTokens(value, choices);
  return value;
}

function bonusUsesFavoredEnemyScale(bonus = {}) {
  const source = (bonus.bonusScale || bonus.scale || {}).source || {};
  return (
    source.type === "special" && source.special === "favored-enemy-bonus"
  );
}

function needsFavoredEnemyScaleChoice(bonus = {}) {
  if (!bonusUsesFavoredEnemyScale(bonus)) return false;
  if (
    bonus.bonusScale?.favoredEnemyTarget ||
    bonus.bonusScale?.target ||
    bonus.scale?.favoredEnemyTarget ||
    bonus.scale?.target ||
    bonus.favoredEnemyTarget ||
    bonus.targetFavoredEnemy
  )
    return false;
  return (
    !bonus.appliesWhen ||
    /favou?red enemy|\{[^{}]+\}/i.test(bonus.appliesWhen)
  );
}

async function resolveFavoredEnemyScaleTargetsForToken(
  token,
  bonuses = [],
  effect = {},
) {
  const list = Array.isArray(bonuses) ? bonuses : [];
  if (!list.some(needsFavoredEnemyScaleChoice)) return list;
  const character = token.kind === "character" ? tokenCharacter(token) : null;
  const options = character ? characterFavoredEnemyOptions(character) : [];
  if (!options.length) return null;
  const resolved = [];
  for (const bonus of list) {
    if (!needsFavoredEnemyScaleChoice(bonus)) {
      resolved.push(bonus);
      continue;
    }
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${effect.name || "Effect"}${character ? ` (${character.name})` : ""}: Choose Favored Enemy`,
          options,
        })
      : null;
    if (!picked) return null;
    const target =
      typeof picked === "object"
        ? picked.favoredEnemyTarget || picked.name || picked.value
        : String(picked || "");
    if (!target) return null;
    const scale = bonus.bonusScale || bonus.scale || {};
    resolved.push({
      ...bonus,
      bonusScale: { ...scale, favoredEnemyTarget: target },
      favoredEnemyTarget: target,
      conditional: true,
      appliesWhen:
        !bonus.appliesWhen || /favou?red enemy|\{[^{}]+\}/i.test(bonus.appliesWhen)
          ? `against ${target}`
          : bonus.appliesWhen,
    });
  }
  return resolved;
}

function mapSpellAdjustmentEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some((entry) =>
    window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(entry),
  );
}

async function resolveSpellAdjustmentChoicesForToken(entries = [], effect = {}) {
  const list = Array.isArray(entries) ? entries : [];
  if (!mapSpellAdjustmentEntriesNeedChoice(list)) return list;
  if (!window.PFEffectEditor?.resolveSpellAdjustmentChoices) return null;
  return window.PFEffectEditor.resolveSpellAdjustmentChoices(list, {
    title: effect.name || "Effect",
  });
}

function mapGrantDomainEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some((entry) =>
    window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(entry),
  );
}

async function resolveGrantDomainChoicesForToken(entries = [], effect = {}) {
  const list = Array.isArray(entries) ? entries : [];
  if (!mapGrantDomainEntriesNeedChoice(list)) return list;
  if (!window.PFEffectEditor?.resolveGrantDomainChoices) return null;
  return window.PFEffectEditor.resolveGrantDomainChoices(list, {
    title: effect.name || "Effect",
  });
}

function mapChoiceStatEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some((entry) =>
    window.PFEffectStats?.isChoiceStat?.(entry?.stat),
  );
}

async function resolveChoiceStatsForToken(entries = [], effect = {}, token = null) {
  const list = Array.isArray(entries) ? entries : [];
  if (!mapChoiceStatEntriesNeedChoice(list)) return list;
  const character = token?.kind === "character" ? tokenCharacter(token) : null;
  const skills = character ? characterSkillOptions(character) : undefined;
  const equipment = token ? rollTokenSheet(token) : {};
  const resolved = [];
  for (const entry of list) {
    if (!window.PFEffectStats?.isChoiceStat?.(entry?.stat)) {
      resolved.push(entry);
      continue;
    }
    const poolId = window.PFEffectStats.choicePoolIdFromStat(entry.stat);
    const pool = window.PFEffectStats.poolById(poolId);
    const options = await window.PFEffectStats.resolveChoicePoolOptions(
      poolId,
      { skills, equipment, choicePool: entry.choicePool },
    );
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${effect.name || "Effect"}${character ? ` (${character.name})` : ""}: Choose ${pool?.label || "a Target"}`,
          options,
        })
      : null;
    if (!picked) return null;
    resolved.push(
      window.PFEffectStats.resolveChoiceStatItem(entry, picked, options),
    );
  }
  return resolved;
}

function mapSpellLikeChoiceList(entry = {}) {
  return (
    entry?.spellChoiceList ||
    window.PFEffectStats?.customSpellLikeListById?.(
      entry?.spellChoiceListId || "",
    ) ||
    null
  );
}

function mapSpellLikeEntriesNeedChoice(entries = []) {
  return (Array.isArray(entries) ? entries : []).some(mapSpellLikeChoiceList);
}

async function resolveSpellLikeChoicesForToken(entries = [], effect = {}) {
  const list = Array.isArray(entries) ? entries : [];
  if (!mapSpellLikeEntriesNeedChoice(list)) return list;
  const resolved = [];
  for (const entry of list) {
    const choiceList = mapSpellLikeChoiceList(entry);
    if (!choiceList) {
      resolved.push(entry);
      continue;
    }
    const spells = (choiceList.items || []).map((item) => ({
      name: item.name || item.spellName || item.label || item.value,
      spellName: item.name || item.spellName || item.label || item.value,
    }));
    const picked = window.PFMagicSearchModal
      ? await window.PFMagicSearchModal.open({
          title: `${effect.name || "Effect"}: Choose SLA`,
          spells,
        })
      : null;
    if (!picked) return null;
    const { spellChoiceList, spellChoiceListId, ...rest } = entry;
    resolved.push({
      ...rest,
      spellName: picked.name || picked.spellName || "Spell",
    });
  }
  return resolved;
}

async function resolveEffectChoicesForToken(token, effect) {
  const branchNeeded = window.PFEffectMechanics?.hasBranches?.(effect) || false;
  let bonuses = Array.isArray(effect.bonuses) ? effect.bonuses : [];
  let variables = effectConditionalVariables(effect);
  if (
    !branchNeeded &&
    !bonuses.some((bonus) => window.PFEffectStats?.isChoiceStat(bonus.stat)) &&
    !mapChoiceStatEntriesNeedChoice(effect.classSkillGrants) &&
    !mapChoiceStatEntriesNeedChoice(effect.bonusRanks) &&
    !bonuses.some(needsFavoredEnemyScaleChoice) &&
    !variables.length &&
    !mapSpellLikeEntriesNeedChoice(effect.spellLikeAbilities) &&
    !mapSpellAdjustmentEntriesNeedChoice(effect.casterLevelBonuses) &&
    !mapSpellAdjustmentEntriesNeedChoice(effect.spellDcBonuses) &&
    !mapSpellAdjustmentEntriesNeedChoice(effect.effectiveAttributeBonuses) &&
    !mapGrantDomainEntriesNeedChoice(effect.grantDomains)
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

  if (branchNeeded) {
    effect = await window.PFEffectMechanics.chooseBranch(effect, {
      title: effect.name || "Effect",
    });
    if (!effect) return { effect: null, queued: false };
    bonuses = Array.isArray(effect.bonuses) ? effect.bonuses : [];
    variables = effectConditionalVariables(effect);
  }
  const character = token.kind === "character" ? tokenCharacter(token) : null;
  const conditionalChoices = { ...(effect.conditionalChoices || {}) };
  for (const variable of variables) {
    const key = normalizeConditionalVariableKey(
      variable.key || variable.name || variable.label,
    );
    if (!key || conditionalChoices[key]) continue;
    const poolId =
      variable.poolId ||
      variable.pool ||
      variable.source ||
      "ranger-favored-enemies";
    const pool = window.PFEffectStats?.conditionalVariablePoolById?.(poolId);
    const additionalTargets = [
      mapFavoredEnemyChoiceLabel(conditionalChoices),
    ].filter(Boolean);
    const options =
      poolId === "character-favored-enemies"
        ? character
          ? characterFavoredEnemyOptions(character, { additionalTargets })
          : []
        : (await window.PFEffectStats?.resolveConditionalVariableOptions?.(poolId)) ||
          [];
    const picked = window.PFEffectChoicePicker
      ? await window.PFEffectChoicePicker.open({
          title: `${effect.name || "Effect"}${character ? ` (${character.name})` : ""}: Choose ${variable.label || key}`,
          options,
        })
      : null;
    if (!picked) return { effect: null, queued: false };
    const pickedValue =
      typeof picked === "object" ? picked.value : String(picked || "");
    const pickedOption =
      options.find((option) => String(option.value) === pickedValue) ||
      (typeof picked === "object" ? picked : null);
    conditionalChoices[key] = {
      value: pickedValue,
      label: pickedOption?.label || pickedValue,
      poolId,
      poolLabel: pool?.label || variable.poolLabel || "",
    };
  }
  const resolved = await resolveChoiceStatsForToken(bonuses, effect, token);
  if (resolved === null) return { effect: null, queued: false };
  const favoredEnemyResolved = await resolveFavoredEnemyScaleTargetsForToken(
    token,
    resolved,
    effect,
  );
  if (favoredEnemyResolved === null) return { effect: null, queued: false };
  const resolvedClassSkillGrants = await resolveChoiceStatsForToken(
    effect.classSkillGrants,
    effect,
    token,
  );
  if (resolvedClassSkillGrants === null) return { effect: null, queued: false };
  const resolvedBonusRanks = await resolveChoiceStatsForToken(
    effect.bonusRanks,
    effect,
    token,
  );
  if (resolvedBonusRanks === null) return { effect: null, queued: false };
  const resolvedSpellLikeAbilities = await resolveSpellLikeChoicesForToken(
    effect.spellLikeAbilities,
    effect,
  );
  if (resolvedSpellLikeAbilities === null) return { effect: null, queued: false };
  const resolvedCasterLevelBonuses = await resolveSpellAdjustmentChoicesForToken(
    effect.casterLevelBonuses,
    effect,
  );
  if (resolvedCasterLevelBonuses === null)
    return { effect: null, queued: false };
  const resolvedSpellDcBonuses = await resolveSpellAdjustmentChoicesForToken(
    effect.spellDcBonuses,
    effect,
  );
  if (resolvedSpellDcBonuses === null) return { effect: null, queued: false };
  const resolvedEffectiveAttributeBonuses =
    await resolveSpellAdjustmentChoicesForToken(
      effect.effectiveAttributeBonuses,
      effect,
    );
  if (resolvedEffectiveAttributeBonuses === null)
    return { effect: null, queued: false };
  const resolvedGrantDomains = await resolveGrantDomainChoicesForToken(
    effect.grantDomains,
    effect,
  );
  if (resolvedGrantDomains === null) return { effect: null, queued: false };
  const resolvedEffect = interpolateConditionalVariables(
    {
      ...effect,
      bonuses: favoredEnemyResolved,
      conditionalChoices,
      ...(resolvedClassSkillGrants.length
        ? { classSkillGrants: resolvedClassSkillGrants }
        : {}),
      ...(resolvedBonusRanks.length ? { bonusRanks: resolvedBonusRanks } : {}),
      ...(resolvedSpellLikeAbilities.length
        ? { spellLikeAbilities: resolvedSpellLikeAbilities }
        : {}),
      ...(resolvedCasterLevelBonuses.length
        ? { casterLevelBonuses: resolvedCasterLevelBonuses }
        : {}),
      ...(resolvedSpellDcBonuses.length
        ? { spellDcBonuses: resolvedSpellDcBonuses }
        : {}),
      ...(resolvedEffectiveAttributeBonuses.length
        ? { effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses }
        : {}),
      ...(resolvedGrantDomains.length ? { grantDomains: resolvedGrantDomains } : {}),
    },
    conditionalChoices,
  );
  return { effect: resolvedEffect, queued: false };
}

async function applyAuraEffectToToken(tokenId, auraTokenId, auraId = "manual") {
  const token = tokenById(tokenId);
  const auraToken = tokenById(auraTokenId);
  const auraEntry = tokenAuraEntry(auraToken, auraId);
  const effect = auraEntry?.aura?.effect;
  if (!token || !effect || !canManageEffects(token)) return;
  const active = await loadTokenActiveEffects(token);
  const sourceId = `${auraTokenId}:${auraId}:${effect.id || effect.name || "effect"}`;
  const promptKey = auraPromptKey(tokenId, auraTokenId, auraId);
  if (active.some((item) => item.auraSourceId === sourceId)) {
    auraEffectDismissed.add(promptKey);
    renderAuraEffectToasts();
    return;
  }
  const applied = {
    ...structuredClone(effect),
    auraSourceId: sourceId,
    auraTokenId,
    auraId,
    sourceTokenId: auraTokenId,
    durationAnchorTokenId: auraTokenId,
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
    renderAll();
  }
}

async function currentActorName() {
  if (!currentActorNamePromise) {
    currentActorNamePromise = PFApp.loadProfile(currentUserId)
      .then(
        (profile) =>
          profile?.username || profile?.email || currentUserEmail || "User",
      )
      .catch(() => currentUserEmail || "User");
  }
  return currentActorNamePromise;
}

function hideQuickEffectTargetsBeforeChoices() {
  const modalEl = el("quickEffectTargetsModal");
  if (!modalEl?.classList.contains("show")) return Promise.resolve();
  return new Promise((resolve) => {
    modalEl.addEventListener("hidden.bs.modal", resolve, { once: true });
    quickEffectTargetsModal.hide();
  });
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
  await hideQuickEffectTargetsBeforeChoices();
  const sourceTokenId =
    quickEffectSelection.sourceTokenId || quickEffectSourceTokenId || "";
  const queuedTargets = [];
  const readyTargets = [];
  for (const token of targets) {
    const targetEffect = {
      ...structuredClone(quickEffectSelection.effect),
      sourceTokenId: sourceTokenId || token.id,
      durationAnchorTokenId: sourceTokenId || token.id,
    };
    const targetEffects = window.PFMetamagic?.resolveTargetEffects
      ? await window.PFMetamagic.resolveTargetEffects(targetEffect, {
          targetName: tokenActualName(token),
        })
      : [targetEffect];
    if (!targetEffects) continue;
    for (const candidate of targetEffects) {
      if (!effectHasTargetMechanics(candidate)) continue;
      const appliedEffect = appliedEffectFromQuickSelection(
        candidate,
        quickEffectSelection.options,
        targets.length,
      );
      const { effect: resolvedEffect, queued } =
        await resolveEffectChoicesForToken(token, appliedEffect);
      if (queued) queuedTargets.push(tokenActualName(token));
      else if (resolvedEffect)
        readyTargets.push({ token, effect: resolvedEffect });
    }
  }
  const appliedTargets = (
    await Promise.all(
      readyTargets.map(async ({ token, effect }) =>
        (await applyQuickEffectToToken(token, effect))
          ? tokenActualName(token)
          : null,
      ),
    )
  ).filter(Boolean);

  el("confirmQuickEffectTargets").disabled = false;
  if (!appliedTargets.length && !queuedTargets.length) {
    el("quickEffectApplyStatus").textContent = "Could not apply effect.";
    quickEffectTargetsModal.show();
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

async function advanceAutomaticAuras(endingTokenId) {
  if (!endingTokenId) return;
  let changed = false;
  const expiredLinks = [];
  state.tokens.forEach((token) => {
    const auras = Array.isArray(token.automaticAuras) ? token.automaticAuras : [];
    const next = auras.flatMap((aura) => {
      if (
        aura.kind === "passive" ||
        aura.permanent ||
        aura.remaining === null ||
        aura.remaining === undefined ||
        (aura.durationAnchorTokenId || token.id) !== endingTokenId
      ) {
        return [aura];
      }
      const remaining = Number(aura.remaining) - 1;
      changed = true;
      if (remaining <= 0 && aura.linkedEffectId)
        expiredLinks.push({ token, effectId: aura.linkedEffectId });
      return remaining > 0 ? [{ ...aura, remaining }] : [];
    });
    if (next.length !== auras.length || next.some((entry, index) => entry !== auras[index]))
      token.automaticAuras = next;
  });
  if (!changed) return;
  for (const { token, effectId } of expiredLinks) {
    const active = await loadTokenActiveEffects(token);
    await saveTokenActiveEffects(
      token,
      active.filter((effect) => effect.id !== effectId),
    );
  }
  renderAll();
  await removeOutOfRangeAuraEffects();
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
      await advanceAutomaticAuras(endingRow.tokenId);
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
      <div class="roll-result-label">${escapeHtml(row.label || "Roll")}${row.target ? `<span class="roll-result-weapon"> &middot; ${escapeHtml(row.target)}</span>` : ""}</div>
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

// The enemy-only Full Attack stipulation: every weapon in one category
// (melee or ranged) rolls its own full iterative sequence, together --
// there's no equivalent of rollAttack()'s single selectedRollWeapon()
// pick here on purpose. Each weapon's .attacks already reflects
// whatever that weapon's own sheet-side calculation (TWF penalties
// included, if configured there) produced, so this just aggregates
// those pre-calculated sequences rather than recomputing anything.
function rollFullAttackByCategory(ranged) {
  const token = mapRollToken();
  if (!token) return;
  lastRollAction = () => rollFullAttackByCategory(ranged);
  const categoryLabel = ranged ? "Ranged" : "Melee";
  const weapons = rollWeaponsForToken(token).filter(
    (weapon) => mapWeaponTypeIsRanged(weapon.weaponType) === ranged,
  );
  if (!weapons.length) {
    el("rollModalStatus").textContent =
      `No ${categoryLabel.toLowerCase()} weapon attack bonus found.`;
    return;
  }
  const rows = weapons.flatMap((weapon) =>
    weapon.attacks.map((bonus) =>
      makeAttackRollData(token, weapon, bonus, "Attack"),
    ),
  );
  rows.forEach((row, index) => {
    row.label = `Attack ${index + 1}`;
  });
  rows.forEach(recordAttackRoll);
  rollModal?.hide();
  showRollResultModal(
    `${rollTokenName(token)}: Full Attack (${categoryLabel})`,
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
  // Enemies can't cherry-pick a single weapon's iterative sequence for
  // Full Attack -- it's every melee weapon together or every ranged
  // weapon together, an explicit either/or instead of the free weapon
  // pick characters still get. "Attack" (one weapon, one roll) is
  // unaffected either way -- this only replaces the generic Full
  // Attack button with the two category ones, each hidden if that
  // enemy has nothing in that category. See rollFullAttackByCategory().
  const isEnemy = token.kind === "enemy";
  const hasMelee = weapons.some(
    (weapon) => !mapWeaponTypeIsRanged(weapon.weaponType),
  );
  const hasRanged = weapons.some((weapon) =>
    mapWeaponTypeIsRanged(weapon.weaponType),
  );
  el("rollFullAttackBtn").classList.toggle("d-none", isEnemy);
  el("rollFullAttackMeleeBtn").classList.toggle(
    "d-none",
    !isEnemy || !hasMelee,
  );
  el("rollFullAttackRangedBtn").classList.toggle(
    "d-none",
    !isEnemy || !hasRanged,
  );
  el("rollDetailPanel").classList.add("d-none");
  el("rollModalStatus").textContent = "";
  rollModal?.show();
}

async function refetchMapSheetState(delay = 0) {
  if (delay > 0) {
    window.setTimeout(() => scheduleMapSheetRefresh(), delay);
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
    characterSheetBridgeFrame.src = "character-sheet.html?bridge=1&v=attribute-scale-source-1";
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

async function recalculateCharacterSheetFromMap(
  characterId,
  characterSnapshot = null,
  activeBuffSnapshot = null,
) {
  try {
    const bridge = await characterSheetBridge();
    if (characterSnapshot && bridge.recalculateCharacterSnapshot) {
      return await bridge.recalculateCharacterSnapshot(
        mapContextKey,
        characterSnapshot,
        activeBuffSnapshot,
      );
    }
    return await bridge.recalculateAndSaveCharacter(mapContextKey, characterId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function recalculateEnemySheetFromMap(enemyId, enemySnapshot = null) {
  try {
    const bridge = await characterSheetBridge();
    if (enemySnapshot && bridge.recalculateEnemySnapshot) {
      return await bridge.recalculateEnemySnapshot(mapContextKey, enemySnapshot);
    }
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

function automaticAuraDurationText(aura = {}) {
  if (aura.permanent || aura.kind === "passive") return "Always on";
  if (aura.remaining === null || aura.remaining === undefined) return "Until dismissed";
  return formatDurationRounds(Number(aura.remaining || 0));
}

function renderAutomaticAuraList(token) {
  const list = el("automaticAuraList");
  if (!list) return;
  const auras = Array.isArray(token?.automaticAuras) ? token.automaticAuras : [];
  list.innerHTML = auras.length
    ? auras
        .map(
          (aura) => `
            <div class="d-flex align-items-center justify-content-between gap-2 border border-secondary rounded p-2">
              <div>
                <div class="fw-semibold">${escapeHtml(aura.effect?.name || "Aura")}</div>
                <div class="small text-secondary">${escapeHtml(String(Number(aura.rangeFeet || aura.radius * 5 || 5)) + " ft. | " + automaticAuraDurationText(aura))}</div>
              </div>
              ${aura.kind === "passive"
                ? ""
                : `<button class="btn btn-outline-danger btn-sm" type="button" data-remove-automatic-aura="${escapeHtml(aura.id)}" title="Remove aura" aria-label="Remove ${escapeHtml(aura.effect?.name || "aura")}"><i class="bi bi-trash"></i></button>`}
            </div>`,
        )
        .join("")
    : `<div class="small text-secondary">None</div>`;
  list.querySelectorAll("[data-remove-automatic-aura]").forEach((button) => {
    button.addEventListener("click", async () => {
      const removed = auras.find(
        (aura) => aura.id === button.dataset.removeAutomaticAura,
      );
      token.automaticAuras = auras.filter(
        (aura) => aura.id !== button.dataset.removeAutomaticAura,
      );
      if (removed?.linkedEffectId) {
        const active = await loadTokenActiveEffects(token);
        await saveTokenActiveEffects(
          token,
          active.filter((effect) => effect.id !== removed.linkedEffectId),
        );
      }
      renderAutomaticAuraList(token);
      renderAll();
      await removeOutOfRangeAuraEffects();
    });
  });
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
  el("automaticAuraSection").classList.toggle("d-none", mode !== "aura");
  if (mode === "aura") renderAutomaticAuraList(token);
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
  // Also reachable directly from the toolbar now (non-GM players, who
  // never have Map Settings open to begin with -- see loadMap()), not
  // just from the Documentation button inside that modal's footer.
  // Only wait out Map Settings' own close transition when it's
  // actually open; jumping straight to .show() otherwise would fight
  // Bootstrap over the shared modal backdrop.
  if (el("backgroundOptionsModal").classList.contains("show")) {
    backgroundModal.hide();
    window.setTimeout(() => mapDocumentationModal.show(), 160);
  } else {
    mapDocumentationModal.show();
  }
}

async function saveBackgroundOptions(event) {
  event.preventDefault();
  setMapZoom(el("gridSize").value, { render: false });

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
  const [characters, gm, slotMeta] = await Promise.all([
    PFApp.loadContextCharacters(mapContextKey),
    determineGm(mapContextKey),
    PFApp.loadMapSlotSummaries(mapContextKey),
  ]);
  mapCharacters = characters;
  isGm = gm;
  mapSlotMeta = slotMeta;
  startPendingEffectChoicePolling();
  el("addEnemyToken").classList.toggle("d-none", !isGm);
  el("openBackgroundOptions").classList.toggle("d-none", !isGm);
  el("openMapDocumentationIcon").classList.toggle("d-none", isGm);
  el("gmHint").textContent = isGm ? "GM tools enabled" : "Player view";
  mapEnemies = isGm ? await PFApp.loadEnemies(mapContextKey) : [];
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
    choicePoolEquipmentFor: (id) =>
      mapCharacters.find((item) => item.id === id)?.sheet || {},
    favoredEnemyOptionsFor: (id) => {
      const character = mapCharacters.find((item) => item.id === id);
      return character ? characterFavoredEnemyOptions(character) : [];
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
  lastAppliedMapMeta = mapMetaOf(state);
  if (lastAppliedMapMeta.clientId === MAP_CLIENT_ID) {
    localMapRevision = Math.max(localMapRevision, lastAppliedMapMeta.revision);
  }
  pendingRemoteState = null;
  await refreshMapTokenSheets({
    save: false,
    reloadCharacters: false,
    reloadEnemies: false,
    syncPassiveAuras: false,
    render: false,
  });
  applySettingsToInputs();
  renderMapSlotNav();
  selectedId = "";
  renderAll(false);
  centerMapViewport();
  subscribeMapRealtime();
  scheduleAccessibleEffectSourcePrefetch();
  const syncPassiveAuras = () =>
    void refreshMapTokenSheets({
      save: false,
      reloadCharacters: false,
      reloadEnemies: false,
    });
  if (window.requestIdleCallback)
    window.requestIdleCallback(syncPassiveAuras, { timeout: 3000 });
  else window.setTimeout(syncPassiveAuras, 1500);
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
      () => scheduleMapSheetRefresh(),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "enemies",
        filter: `context_key=eq.${mapContextKey}`,
      },
      () => scheduleMapSheetRefresh(),
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

  setupMobileLayout();
  bindNumberSteppers();

  el("mapSlotNav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-map-slot]");
    if (!button) return;
    switchMapSlot(button.dataset.mapSlot);
  });

  el("gridSize").addEventListener("change", () => setMapZoom(el("gridSize").value));
  // See updateZoomPreview()'s own comment -- "input" only drives a
  // cheap live-scale preview, the real (expensive) commit happens on
  // "change" (slider release) or after a short pause mid-drag.
  el("mapZoom").addEventListener("input", () =>
    updateZoomPreview(el("mapZoom").value),
  );
  el("mapZoom").addEventListener("change", () =>
    commitZoomPreview(el("mapZoom").value),
  );

  ["cellX", "cellY"].forEach((id) => {
    el(id).addEventListener("change", () => handleCellSizeChange(id));
  });
  setCellLinkEnabled(cellRatioLinked);
  el("cellLinkToggle").addEventListener("click", () => {
    setCellLinkEnabled(!cellRatioLinked);
  });

  el("backgroundUrl").addEventListener("change", handleBackgroundUrlChange);

  window.addEventListener("focus", () => {
    if (mapContextKey) scheduleMapSheetRefresh();
  });
  window.addEventListener("storage", (event) => {
    if (!mapContextKey) return;
    if (
      event.key?.startsWith(`pf_character_sheet_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_enemy_sheet_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_buffs_updated_${mapContextKey}_`) ||
      event.key?.startsWith(`pf_map_sheet_hp_updated_${mapContextKey}_`)
    ) {
      scheduleMapSheetRefresh();
    }
  });

  el("openBackgroundOptions").addEventListener("click", openBackgroundOptions);
  el("togglePathRuler")?.addEventListener("click", togglePathRuler);
  backgroundModal = new bootstrap.Modal(el("backgroundOptionsModal"));
  mapDocumentationModal = new bootstrap.Modal(el("mapDocumentationModal"));
  el("openMapDocumentation").addEventListener("click", openMapDocumentation);
  el("openMapDocumentationIcon").addEventListener("click", openMapDocumentation);
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
  el("toggleView3DBtn").addEventListener("click", () => toggleView3DMode());
  el("reset3DCamera").addEventListener("click", () => {
    el("map3DAngle").value = "55";
    el("map3DRotate").value = "0";
    set3DViewVars();
  });
  el("map3DAngle").addEventListener("input", set3DViewVars);
  el("map3DRotate").addEventListener("input", set3DViewVars);
  el("enterHeightEditMode").addEventListener("click", () =>
    toggleHeightEditMode(true),
  );
  el("exitHeightEditMode").addEventListener("click", () =>
    toggleHeightEditMode(false),
  );
  el("addHeightShapeBtn").addEventListener("click", addHeightShape);
  el("drawHeightShapeBtn").addEventListener("click", () =>
    toggleHeightDrawMode(),
  );
  el("editHeightShapeBtn").addEventListener("click", () => {
    const selectedHeightShape = state.heightShapes.find(
      (shape) => shape.id === selectedId,
    );
    if (!selectedHeightShape) return;
    toggleHeightDrawMode(true, selectedHeightShape.id);
  });
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
  quickConditionModal = new bootstrap.Modal(el("quickConditionModal"));
  quickEffectTargetsModal = new bootstrap.Modal(el("quickEffectTargetsModal"));
  el("quickConditionModal").addEventListener("hidden.bs.modal", () => {
    if (!quickConditionReturnToPicker) return;
    quickConditionReturnToPicker = false;
    quickConditionEffect = null;
    quickEffectModal.show();
  });
  rollModal = new bootstrap.Modal(el("rollModal"));
  rollResultModal = new bootstrap.Modal(el("rollResultModal"));
  el("rollResultModal").addEventListener("hidden.bs.modal", () =>
    clearInterval(rollAnimationTimer),
  );
  el("rerollResult").addEventListener("click", () => lastRollAction?.());
  el("enemyPickerSearch").addEventListener("input", renderEnemyPicker);
  el("characterPickerSearch").addEventListener("input", renderCharacterPicker);
  el("quickEffectSearch").addEventListener("input", renderQuickEffects);
  el("quickEffectNav")
    .querySelectorAll("[data-quick-effect-group]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        selectQuickEffectGroup(button.dataset.quickEffectGroup),
      ),
    );
  el("addCharacterToken").addEventListener("click", () =>
    addToken("character"),
  );
  el("addEnemyToken").addEventListener("click", () => addToken("enemy"));
  el("addGenericToken").addEventListener("click", () => addToken("token"));
  el("addLightToken").addEventListener("click", addLightToken);
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
      button.addEventListener("click", () => {
        const action = button.dataset.rollAction;
        if (action === "fullAttackMelee") rollFullAttackByCategory(false);
        else if (action === "fullAttackRanged") rollFullAttackByCategory(true);
        else rollAttack(action === "fullAttack");
      });
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
  el("transferToken3D")?.addEventListener("click", startTransferTarget);
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
  el("confirmQuickCondition").addEventListener(
    "click",
    confirmQuickConditionConfig,
  );
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
    if (event.key === "Escape") {
      if (transferTargetTokenId) {
        cancelTransferTarget();
        return;
      }
      if (pathRuler?.active) {
        clearPathRuler();
        return;
      }
      hideContextMenu();
    }
  });
  window.addEventListener("resize", () => {
    hideContextMenu();
    updateAuraToastPosition();
    if (view3DMode && !heightEditMode) {
      schedule3DTokenBillboards();
    }
  });
  window.addEventListener(
    "scroll",
    () => {
      hideContextMenu();
      updateAuraToastPosition();
      if (view3DMode && !heightEditMode) {
        schedule3DTokenBillboards();
      }
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
