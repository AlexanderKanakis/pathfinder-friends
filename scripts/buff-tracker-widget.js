(function () {
  const STYLE_ID = "pf-effect-tracker-style";
  const PICKER_RESULT_BATCH_SIZE = 80;
  const EFFECT_BROWSER_GROUPS = [
    ["spells", "Spells"],
    ["conditions", "Conditions"],
    ["class", "Class"],
    ["racial", "Racials"],
    ["feats", "Feats"],
    ["items", "Items"],
    ["other", "Other"],
  ];
  const CHOICE_POOL_MECHANIC_KEYS =
    window.PFEffectMechanics?.extraKeys?.() || [
      "damageReduction",
      "spellResistance",
      "immunities",
      "applyConditions",
      "classSkillGrants",
      "bonusRanks",
      "extraRanksPerLevel",
      "featGrants",
      "sizeChanges",
      "spellLikeAbilities",
      "casterLevelBonuses",
      "spellDcBonuses",
      "effectiveAttributeBonuses",
      "grantDomains",
      "generatedEquipment",
      "summonCreatures",
      "weaponExtraDamage",
      "weaponDamageSizeChanges",
      "conditionalVariables",
      "attackRolls",
      "damageRolls",
      "periodicEffects",
      "d20Boosts",
    ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .effect-tracker-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .effect-tracker-add-shell { margin-bottom: 1rem; }
      .effect-tracker-add-row { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr) max-content; }
      .effect-tracker-add-row .form-control { min-width: 0; }
      .effect-tracker-add-row .btn { white-space: nowrap; }
      .effect-search-modal-dialog { width: min(1140px, calc(100vw - 2rem)); max-width: min(1140px, calc(100vw - 2rem)); min-width: min(860px, calc(100vw - 2rem)); }
      .effect-search-modal-dialog .modal-content { width: 100%; height: min(82vh, 820px); }
      .effect-search-modal-body { display: grid; grid-template-rows: auto auto minmax(0, 1fr); min-height: 0; }
      .effect-browser-nav { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: #1b1b1b; margin-bottom: 12px; }
      .effect-browser-nav .nav-link { border: 0; border-bottom: 2px solid transparent; border-radius: 0; color: #ccc; min-width: 0; }
      .effect-browser-nav .nav-link.active { background: transparent; border-bottom-color: #0dcaf0; color: #fff; font-weight: 700; }
      .effect-browser-group-title { color: #aaa; font-size: 12px; letter-spacing: .04em; margin: 0 0 8px; text-transform: uppercase; }
      .effect-browser-list { display: grid; gap: 8px; align-content: start; }
      .effect-search-results.effect-browser-list { grid-template-columns: 1fr; }
      [data-effect-browser-more] { grid-column: 1 / -1; }
      .effect-browser-row { align-items: center; background: #242424; border: 1px solid #444; border-radius: 7px; color: #f4f4f4; display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr) auto; min-height: 54px; padding: 9px 12px; text-align: left; }
      .effect-browser-row[role="button"] { cursor: pointer; }
      .effect-browser-row[role="button"]:hover, .effect-browser-row[role="button"]:focus { border-color: #0dcaf0; outline: none; }
      .effect-browser-row.is-condition { min-height: 58px; }
      .effect-browser-row-title { font-weight: 700; }
      .effect-browser-row-meta { color: #aaa; font-size: 12px; }
      .effect-browser-controls { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
      .effect-browser-number-control { align-items: center; display: flex; gap: 6px; margin: 0; white-space: nowrap; }
      .effect-browser-condition-control { align-items: center; display: flex; gap: 6px; margin: 0; white-space: nowrap; }
      .effect-browser-condition-control .form-select { min-width: 132px; }
      .effect-browser-number-control .modal-number-stepper { width: 132px; }
      .effect-browser-controls .form-check { align-items: center; display: flex; min-height: 31px; margin: 0 !important; }
      .effect-browser-controls input[type="number"] { width: 68px; }
      .effect-browser-type-section + .effect-browser-type-section { margin-top: 14px; }
      .effect-browser-spell-class + .effect-browser-spell-class { margin-top: 14px; }
      .effect-browser-spell-class-title { margin-bottom: 6px; }
      .effect-browser-spell-level { border: 1px solid #3d3d3d; border-radius: 7px; display: grid; gap: 12px; grid-template-columns: 46px minmax(0, 1fr); margin-top: 8px; padding: 10px; }
      .effect-browser-level-number { color: #ffd86b; font-size: 24px; font-weight: 700; text-align: center; }
      .effect-browser-spell-columns { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .effect-browser-spell-columns.is-single { grid-template-columns: minmax(0, 1fr); }
      .effect-browser-sla-list { display: grid; gap: 5px; }
      .effect-browser-spell-column-title { color: #aaa; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; }
      .effect-browser-spell-mobile-tabs { display: none; gap: 2px; border-bottom: 1px solid #333; background: #121212; margin-bottom: 8px; }
      .effect-browser-spell-mobile-tab { flex: 1 1 0; min-width: 0; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: #bbb; padding: 7px 8px 8px; line-height: 1.1; text-align: center; }
      .effect-browser-spell-mobile-tab:hover, .effect-browser-spell-mobile-tab:focus { color: #fff; background: #1b1b1b; outline: none; }
      .effect-browser-spell-mobile-tab.active { color: #fff; border-bottom-color: #0dcaf0; background: #202020; }
      .effect-browser-spell-button { display: block; margin-bottom: 5px; overflow: hidden; text-align: left; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
      .effect-browser-loading { pointer-events: none; }
      .effect-browser-loading-line { animation: effect-browser-loading-pulse 1.1s ease-in-out infinite alternate; background: #4a4a4a; border-radius: 4px; display: block; height: 10px; width: min(72%, 260px); }
      .effect-browser-loading-line.is-title { background: #5b5b5b; height: 15px; margin-bottom: 8px; width: min(48%, 180px); }
      .effect-browser-loading-line.is-short { width: min(34%, 110px); }
      .effect-browser-loading-spell { animation: effect-browser-loading-pulse 1.1s ease-in-out infinite alternate; background: #303030; border: 1px solid #46545a; border-radius: 4px; height: 31px; margin-bottom: 5px; }
      @keyframes effect-browser-loading-pulse { from { opacity: .48; } to { opacity: 1; } }
      .effect-search-results { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: max-content; gap: 10px; align-content: start; height: 100%; min-height: 0; overflow: auto; }
      .effect-tracker-search-trigger { cursor: pointer; }
      .effect-tracker-card { position: relative; min-height: 116px; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 12px 52px 12px 12px; text-align: left; color: #f4f4f4; cursor: pointer; }
      .effect-tracker-card:hover, .effect-tracker-card:focus { border-color: #0d6efd; outline: none; box-shadow: 0 0 0 2px rgba(13, 110, 253, .25); }
      .effect-tracker-card-ability { border-color: rgba(143, 209, 158, .45); background: rgba(143, 209, 158, .06); }
      .effect-tracker-card-ability:hover, .effect-tracker-card-ability:focus { border-color: #8fd19e; box-shadow: 0 0 0 2px rgba(143, 209, 158, .25); }
      .effect-tracker-ability-badge { display: inline-block; background: rgba(143, 209, 158, .16); border: 1px solid rgba(143, 209, 158, .4); color: #d9f5df; border-radius: 999px; padding: 1px 7px; font-size: 11px; margin-bottom: 4px; }
      .effect-tracker-icon { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #151515; border: 1px solid #555; color: #9ec5fe; }
      .effect-tracker-chip { display: inline-block; margin: 2px 3px 2px 0; color: #ddd; }
      .effect-tracker-active { background: #242424; border: 1px solid #444; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
      .effect-tracker-loading-card { min-height: 66px; pointer-events: none; }
      .effect-tracker-loading-line { animation: effect-browser-loading-pulse 1.1s ease-in-out infinite alternate; background: #4a4a4a; border-radius: 4px; display: block; height: 10px; width: min(68%, 260px); }
      .effect-tracker-loading-line.is-title { background: #5b5b5b; height: 15px; margin-bottom: 9px; width: min(42%, 170px); }
      .effect-active-nav { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); background: #1b1b1b; margin-bottom: 10px; }
      .effect-active-nav .nav-link { border: 0; border-bottom: 2px solid transparent; border-radius: 0; color: #ccc; min-width: 0; padding-inline: 4px; }
      .effect-active-nav .nav-link.active { background: transparent; border-bottom-color: #0dcaf0; color: #fff; font-weight: 700; }
      .effect-active-head { display: grid; grid-template-columns: minmax(0, 1fr) 68px; gap: 10px; align-items: start; }
      .effect-active-actions { display: flex; gap: 4px; justify-content: end; }
      .effect-active-actions .btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
      .effect-active-adjustments { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin-top: 8px; }
      .effect-adjustable-control { display: inline-flex; align-items: center; gap: 8px; }
      .effect-adjustable-label { max-width: 110px; }
      .effect-adjustable-control .modal-number-stepper { width: 132px; }
      .effect-duration-grid { display: grid; grid-template-columns: .75fr 1fr .7fr; gap: 8px; align-items: end; }
      .shared-bonus-row { position: relative; display: grid; grid-template-columns: 1.5fr .7fr 1fr .7fr auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 10px 48px 10px 10px; }
      .shared-bonus-row .shared-named-skill-field { grid-column: 1 / -1; max-width: 280px; }
      .shared-bonus-row button[aria-label="Delete effect"] { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
      .shared-bonus-condition-inline { grid-column: 1 / -1; display: grid; grid-template-columns: auto minmax(160px, 260px); gap: 8px; align-items: end; }
      .shared-bonus-row [data-scale-summary] { grid-column: 1 / -1; }
      .shared-dr-row { display: grid; grid-template-columns: 0.7fr 1.3fr auto auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-sr-row { display: grid; grid-template-columns: 0.5fr auto 0.9fr auto auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-dr-row [data-scale-summary], .shared-sr-row [data-scale-summary], .shared-spell-adjustment-row [data-scale-summary] { grid-column: 1 / -1; }
      .shared-class-skill-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-class-skill-row .shared-named-skill-field { grid-column: 1 / -1; }
      .shared-grant-domain-row { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(150px, auto) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-grant-domain-choice { min-height: 31px; display: flex; align-items: center; gap: 8px; padding-left: 2.5em; }
      .shared-grant-domain-choice .form-check-label { color: #fff; font-size: 12px; }
      .shared-extra-ranks-row, .shared-size-change-row { display: grid; grid-template-columns: minmax(120px, 180px) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-special-toggle-row { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 8px; align-items: center; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-special-toggle-row .shared-special-toggle-check { align-items: center; display: flex; min-height: 31px; margin: 0; }
      .shared-special-toggle-controls { align-items: center; display: inline-flex; gap: 8px; justify-self: end; }
      .shared-special-toggle-condition { grid-column: 1 / -1; }
      .shared-special-toggle-row button[data-special-toggle-condition-toggle] { align-items: center; display: inline-flex; height: 31px; justify-content: center; justify-self: start; padding: 0; width: 31px; }
      .shared-extra-ranks-row button[aria-label="Delete extra ranks per level"], .shared-grant-domain-row button[aria-label="Delete domain grant"], .shared-size-change-row button[aria-label="Delete size change"], .shared-spell-adjustment-target-row button[aria-label="Delete spell target group"] { align-items: center; display: inline-flex; height: 31px; justify-content: center; justify-self: start; padding: 0; width: 31px; }
      .shared-apply-condition-row { display: grid; grid-template-columns: minmax(150px, 1fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-conditional-variable-row { display: grid; grid-template-columns: minmax(150px, 0.8fr) minmax(180px, 1fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-conditional-variable-row .small { grid-column: 1 / -1; }
      .shared-spell-like-row { display: grid; grid-template-columns: minmax(58px, 0.25fr) minmax(105px, 0.5fr) minmax(130px, 0.8fr) minmax(86px, 0.36fr) minmax(64px, 0.28fr) auto; gap: 8px; align-items: end; background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-spell-like-picker { display: flex; align-items: center; justify-content: space-between; min-width: 0; min-height: 31px; gap: 8px; text-align: left; }
      .shared-spell-like-row .form-control, .shared-spell-like-row .form-select { min-width: 0; }
      .shared-spell-like-picker span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .shared-spell-adjustment-row { background: #242424; border: 1px solid #444; border-radius: 8px; padding: 8px; }
      .shared-spell-adjustment-source { max-width: 280px; }
      .shared-effective-attribute-field { max-width: 120px; }
      .shared-spell-adjustment-target-row, .shared-spell-adjustment-increase-row, .shared-spell-adjustment-condition { display: grid; gap: 8px; align-items: end; }
      .shared-spell-adjustment-target-row { grid-template-columns: minmax(140px, 0.7fr) minmax(220px, 1fr) auto auto; }
      .shared-spell-adjustment-increase-row { grid-template-columns: minmax(210px, 1.1fr) minmax(80px, 0.35fr) minmax(110px, 0.6fr) auto auto auto; }
      .shared-spell-adjustment-nested { margin-top: 10px; }
      .shared-spell-adjustment-nested > .vstack { margin-top: 6px; }
      .shared-spell-adjustment-condition { grid-template-columns: auto minmax(220px, 1fr) auto; margin-top: 10px; }
      .shared-spell-adjustment-checks { display: flex; flex-wrap: wrap; gap: 6px 10px; min-height: 31px; align-items: center; }
      .shared-spell-adjustment-checks .form-check-label { color: #fff; font-size: 12px; }
      .shared-spell-adjustment-row .form-control, .shared-spell-adjustment-row .form-select { min-width: 0; }
      .shared-extra-accordion .accordion-item { background: transparent; border: 0; }
      .shared-extra-accordion .accordion-button { background: #242424; color: #ddd; padding: 8px 10px; font-size: 13px; }
      .shared-extra-accordion .accordion-button:not(.collapsed) { background: #2b2b2b; color: #fff; box-shadow: none; }
      .shared-extra-accordion .accordion-button::after { filter: invert(1) grayscale(1) brightness(1.6); }
      .shared-extra-accordion .accordion-body { background: #1e1e1e; border: 1px solid #333; border-top: 0; padding: 10px; }
      .shared-extra-subsection { margin-bottom: 14px; }
      .shared-extra-subsection:last-child { margin-bottom: 0; }
      @media (max-width: 700px) { .effect-duration-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .shared-bonus-row, .shared-bonus-condition-inline { grid-template-columns: 1fr 1fr; } .shared-bonus-condition-inline { grid-column: auto; } .shared-spell-adjustment-target-row, .shared-spell-adjustment-increase-row, .shared-spell-adjustment-condition, .shared-grant-domain-row, .shared-special-toggle-row { grid-template-columns: 1fr; } .shared-special-toggle-controls { justify-self: start; } .shared-extra-ranks-row button[aria-label="Delete extra ranks per level"], .shared-grant-domain-row button[aria-label="Delete domain grant"], .shared-size-change-row button[aria-label="Delete size change"], .shared-spell-adjustment-target-row button[aria-label="Delete spell target group"] { width: 31px; } }
      @media (max-width: 700px) {
        .effect-search-modal-dialog { min-width: 0; }
        .effect-tracker-grid,
        .effect-search-results { grid-template-columns: 1fr; }
        .effect-browser-nav { grid-template-columns: repeat(7, minmax(90px, 1fr)); overflow-x: auto; }
        .effect-browser-spell-level { grid-template-columns: 1fr; gap: 6px; padding: 8px; }
        .effect-browser-spell-mobile-tabs { display: flex; }
        .effect-browser-spell-panel { display: none; }
        .effect-browser-spell-panel.is-mobile-active,
        .effect-browser-spell-panel.is-single { display: block; }
        .effect-browser-spell-column-title { display: none; }
        .effect-browser-row.is-condition { align-items: start; grid-template-columns: 1fr; }
        .effect-tracker-add-shell { margin-bottom: 6px; }
        .effect-tracker-add-row { gap: 4px; }
        .effect-tracker-add-row .form-control,
        .effect-tracker-add-row .btn { min-height: 29px; height: 29px; font-size: 12px; }
        .effect-active-nav { grid-template-columns: repeat(6, minmax(62px, 1fr)); margin-bottom: 6px; overflow-x: auto; }
        .effect-active-nav .nav-link { min-height: 31px; padding: 5px 2px; font-size: 12px; line-height: 1.1; }
        .effect-tracker-active { border-radius: 6px; margin-bottom: 5px; padding: 7px 8px; }
        .effect-active-head { grid-template-columns: minmax(0, 1fr) 60px; gap: 6px; }
        .effect-active-head strong { font-size: 13px; line-height: 1.2; }
        .effect-tracker-active .small-text { font-size: 11px; line-height: 1.25; }
        .effect-active-actions { gap: 3px; }
        .effect-active-actions .btn { width: 28px; height: 28px; }
        .effect-active-adjustments { gap: 5px; margin-top: 5px; }
        .effect-adjustable-control { gap: 5px; }
        .effect-adjustable-label { max-width: 86px; font-size: 11px; }
        .effect-adjustable-control .modal-number-stepper { width: 108px; }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function trackerLoadingHtml() {
    const cards = Array.from(
      { length: 3 },
      () => `
        <article class="effect-tracker-active effect-tracker-loading-card" aria-label="Loading active effect">
          <span class="effect-tracker-loading-line is-title"></span>
          <span class="effect-tracker-loading-line"></span>
        </article>
      `,
    ).join("");
    return `
      <div class="effect-tracker-add-shell">
        <div class="effect-tracker-add-row">
          <input class="form-control form-control-sm" placeholder="Loading available abilities..." disabled>
          <button class="btn btn-outline-success btn-sm" type="button" disabled>Use Powers</button>
        </div>
      </div>
      <nav class="nav effect-active-nav" aria-label="Active effect types">
        <button class="nav-link active" type="button" disabled>Spells</button>
        <button class="nav-link" type="button" disabled>Conditions</button>
        <button class="nav-link" type="button" disabled>Class</button>
        <button class="nav-link" type="button" disabled>Racials</button>
        <button class="nav-link" type="button" disabled>Feats</button>
        <button class="nav-link" type="button" disabled>Items</button>
      </nav>
      <div>${cards}</div>
    `;
  }

  function fmt(value) {
    return value >= 0 ? `+${value}` : String(value);
  }

  const STAT_LABELS = {
    ac: "AC",
    "touch ac": "Touch AC",
    "flat-footed ac": "Flat-Footed AC",
    "remove dex bonus to ac": "Remove DEX Bonus to AC",
    "cannot gain morale bonuses": "Cannot Gain Morale Bonuses",
    "cannot gain luck bonuses": "Cannot Gain Luck Bonuses",
    cmb: "CMB",
    cmd: "CMD",
    "extra attack": "Extra Attack at Highest BAB",
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
  };
  const PF_SKILLS = [
    "Acrobatics",
    "Appraise",
    "Bluff",
    "Climb",
    "Diplomacy",
    "Disable Device",
    "Disguise",
    "Escape Artist",
    "Fly",
    "Heal",
    "Handle Animal",
    "Intimidate",
    "Knowledge (arcana)",
    "Knowledge (dungeoneering)",
    "Knowledge (engineering)",
    "Knowledge (geography)",
    "Knowledge (history)",
    "Knowledge (local)",
    "Knowledge (nature)",
    "Knowledge (nobility)",
    "Knowledge (planes)",
    "Knowledge (religion)",
    "Linguistics",
    "Perception",
    "Ride",
    "Sense Motive",
    "Sleight of Hand",
    "Spellcraft",
    "Stealth",
    "Survival",
    "Swim",
    "Use Magic Device",
  ];
  const SKILL_STAT_LABELS = {
    "skill checks": "Skill: All Checks",
    "trained skill checks": "Skill: Trained Checks",
    "untrained skill checks": "Skill: Untrained Checks",
    "class skill checks": "Skill: Class Skill Checks",
    "class knowledge skill checks": "Skill: Class Knowledge Checks",
    "skill:craft": "Skill: Craft",
    "skill:profession": "Skill: Profession",
    "skill:perform": "Skill: Perform",
    "strength skill checks": "Skill: STR Checks",
    "dexterity skill checks": "Skill: DEX Checks",
    "constitution skill checks": "Skill: CON Checks",
    "intelligence skill checks": "Skill: INT Checks",
    "wisdom skill checks": "Skill: WIS Checks",
    "charisma skill checks": "Skill: CHA Checks",
    "craft skill checks": "Skill: Craft Checks",
    "profession skill checks": "Skill: Profession Checks",
    "perform skill checks": "Skill: Perform Checks",
    ...Object.fromEntries(
      PF_SKILLS.map((skill) => [
        `skill:${skill.replace(/[^a-z0-9]/gi, "").toLowerCase()}`,
        `Skill: ${skill}`,
      ]),
    ),
  };
  const DURATION_UNITS = ["variable", "turn", "round", "minute", "hour", "day"];
  const ACTIVE_EFFECT_TABS = [
    { key: "spell", label: "Spells" },
    { key: "condition", label: "Conditions" },
    { key: "class", label: "Class" },
    { key: "racial", label: "Racials" },
    { key: "feat", label: "Feats" },
    { key: "item", label: "Items" },
  ];

  function titleCaseStat(value) {
    const key = String(value || "")
      .toLowerCase()
      .trim();
    const choiceLabel = window.PFEffectStats?.choiceStatLabel?.(key);
    if (choiceLabel) return choiceLabel;
    if (STAT_LABELS[key]) return STAT_LABELS[key];
    if (SKILL_STAT_LABELS[key]) return SKILL_STAT_LABELS[key];
    return key
      .split(" ")
      .map(
        (word) =>
          STAT_LABELS[word] || word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  }

  function activeEffectTab(effect = {}) {
    if (isCondition(effect)) return "condition";
    const sourceGroup = categorizedSourceGroup(effect);
    if (sourceGroup === "racial") return "racial";
    if (sourceGroup === "feats") return "feat";
    if (sourceGroup === "items") return "item";
    if (sourceGroup === "spells") return "spell";
    return "class";
  }

  function activeEffectVisibleInTab(effect = {}, tab = "") {
    if (activeEffectTab(effect) === tab) return true;
    if (
      tab === "condition" &&
      Array.isArray(effect.applyConditions) &&
      effect.applyConditions.length
    )
      return true;
    return (
      isCondition(effect) &&
      String(effect.sourceEffectTab || "") === tab
    );
  }

  function categorizedSourceGroup(effect = {}) {
    const sourceText = [
      effect.category,
      effect.sourceCategory,
      effect.sourceType,
      effect.type,
      effect.detailData?.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (/\bclass(?: ability| feature)?\b/.test(sourceText)) return "class";
    if (/\b(?:race|racial)\b/.test(sourceText)) return "racial";
    if (/\bfeat\b/.test(sourceText)) return "feats";
    if (isItemSourcedEffect(effect) || /\bitem\b/.test(sourceText)) return "items";
    if (/\bspell\b/.test(sourceText)) return "spells";
    return "other";
  }

  function effectSourceGroup(effect = {}) {
    if (isCondition(effect)) return "conditions";
    if (effect.ownedSpell) return "spells";
    const categoryGroup = categorizedSourceGroup(effect);
    if (
      effect.catalogEffect &&
      ["class", "racial", "feats", "items"].includes(categoryGroup)
    )
      return "other";
    if (categoryGroup === "spells") return "other";
    return categoryGroup;
  }

  function normalizedPickerSource(effect = {}, group = effectSourceGroup(effect)) {
    const detailKey = group === "class" ? "class" : group === "racial" ? "race" : "";
    const value = (detailKey && effect.detailData?.[detailKey]) || effect.source || "";
    return String(value)
      .split("|")[0]
      .split(" -- with ")[0]
      .trim()
      .toLowerCase();
  }

  function ownedPickerIdentity(effect = {}) {
    const group = effectSourceGroup(effect);
    if (!["class", "racial", "feats", "items"].includes(group)) return "";
    const name = String(effect.name || "").trim().toLowerCase();
    if (!name) return "";
    const source = ["class", "racial"].includes(group)
      ? normalizedPickerSource(effect, group)
      : "";
    return `${group}::${name}::${source}`;
  }

  function preferOwnedPickerEffects(effects = []) {
    const rows = Array.isArray(effects) ? effects : [];
    const owned = new Set(
      rows
        .filter((effect) => !effect?.catalogEffect)
        .map(ownedPickerIdentity)
        .filter(Boolean),
    );
    return rows.filter((effect) => {
      if (!effect?.catalogEffect) return true;
      const identity = ownedPickerIdentity(effect);
      return !identity || !owned.has(identity);
    });
  }

  function sortActiveRows(rows) {
    return rows.sort(
      (a, b) =>
        String(a.effect.name || "").localeCompare(
          String(b.effect.name || ""),
        ) ||
        a.index - b.index,
    );
  }

  function isItemSourcedEffect(effect = {}) {
    return Boolean(effect.sourceLootId || effect.source_loot_id);
  }

  function categoryIcon(category) {
    const key = String(category || "").toLowerCase();
    if (key.includes("condition")) return "bi-activity";
    if (key.includes("debuff")) return "bi-arrow-down-circle";
    if (key.includes("feat")) return "bi-award";
    if (key.includes("spell")) return "bi-stars";
    return "bi-lightning-charge";
  }

  function legacyDurationParts(duration) {
    const text = String(duration || "")
      .toLowerCase()
      .trim();
    if (!text || text === "variable" || text === "permanent") {
      return { count: null, unit: "variable", perLevel: false };
    }
    const count = Number((text.match(/(\d+)/) || [null, 1])[1]) || 1;
    const unit =
      DURATION_UNITS.find(
        (value) => value !== "variable" && text.includes(value),
      ) || "variable";
    const perLevel = text.includes("/level") || text.includes("per level");
    return { count, unit, perLevel };
  }

  function durationParts(effect) {
    if (window.PFEffectMeta?.normalizeDurationConfig) {
      const config = window.PFEffectMeta.normalizeDurationConfig(effect);
      return {
        count: config.staticValue,
        unit: config.unit,
        perLevel:
          config.factors.some((factor) => factor.type === "caster") ||
          config.diceCountScale?.source?.type === "caster" ||
          config.staticValueScale?.source?.type === "caster",
        config,
      };
    }
    return legacyDurationParts(effect?.duration);
  }

  function durationUsesCasterLevel(effect) {
    const config = durationParts(effect).config;
    return config
      ? config.factors.some((factor) => factor.type === "caster") ||
        config.diceCountScale?.source?.type === "caster" ||
        config.staticValueScale?.source?.type === "caster"
      : durationParts(effect).perLevel;
  }

  function durationLabel(effect) {
    if (window.PFEffectMeta?.durationLabel)
      return window.PFEffectMeta.durationLabel(effect);
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return "variable";
    const unit = `${parts.unit}${Number(parts.count) === 1 ? "" : "s"}`;
    return `${parts.count} ${unit}${parts.perLevel ? " / level" : ""}`;
  }

  function isCondition(effect) {
    return String(effect?.category || "").toLowerCase() === "condition";
  }

  function conditionUsesTurns(effect = {}) {
    return window.PFConditionConfig?.usesTurns
      ? window.PFConditionConfig.usesTurns(effect)
      : isCondition(effect);
  }

  function hasPersistentEffectMechanics(effect = {}) {
    return Boolean(
      isCondition(effect) ||
        (Array.isArray(effect.bonuses) && effect.bonuses.length > 0) ||
        (Array.isArray(effect._triggeredIndependentEffects) &&
          effect._triggeredIndependentEffects.length > 0) ||
        (window.PFEffectMechanics?.independentEffects?.(effect)?.length > 0) ||
        effect.trackActive ||
        effect.auraConfig?.enabled ||
        window.PFEffectMechanics?.hasBranches?.(effect) ||
        window.PFEffectMechanics?.hasAnyMechanics?.(effect),
    );
  }

  const FEAR_CONDITIONS = ["shaken", "frightened", "panicked"];

  function conditionName(effect = {}) {
    return String(
      effect.name || effect.conditionName || effect.condition?.name || "",
    ).trim();
  }

  function activeEffectTitle(effect = {}, tab = "") {
    if (tab !== "condition") return String(effect.name || "Effect");
    const appliedNames = (Array.isArray(effect.applyConditions)
      ? effect.applyConditions
      : []
    )
      .map(conditionName)
      .filter(Boolean);
    const names = [
      ...new Set(
        appliedNames.length
          ? appliedNames
          : isCondition(effect)
            ? [conditionName(effect)]
            : [],
      ),
    ];
    if (!names.length) return String(effect.name || "Effect");
    const conditionText = names.join(", ");
    const attachedToEffect = Boolean(
      appliedNames.length ||
        effect.appliedCondition ||
        effect.sourceEffectId ||
        effect.sourceEffectTab,
    );
    const source = attachedToEffect
      ? String(
          appliedNames.length
            ? effect.name || effect.source || ""
            : effect.source || effect.sourceEffectName || "",
        ).trim()
      : "";
    return source && source.toLowerCase() !== conditionText.toLowerCase()
      ? `${conditionText} (${source})`
      : conditionText;
  }

  function fearRank(effect = {}) {
    return FEAR_CONDITIONS.indexOf(conditionName(effect).toLowerCase());
  }

  function titleCaseConditionName(value = "") {
    return String(value || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ");
  }

  async function conditionDefinitionMaps() {
    const definitions = window.PFApp?.loadConditionDefinitions
      ? await window.PFApp.loadConditionDefinitions()
      : [];
    const byName = new Map();
    const byId = new Map();
    (Array.isArray(definitions) ? definitions : []).forEach((condition) => {
      if (condition?.name) byName.set(String(condition.name).toLowerCase(), condition);
      if (condition?.id) byId.set(String(condition.id), condition);
    });
    return { byName, byId };
  }

  // casterLevelOrContext is normally just a caster level number (the
  // common case: "1 min/level" spells with a CL input). Activatable
  // abilities pass their full resolved context instead (character level,
  // class levels, ability mods), since their duration is computed from the
  // character rather than typed in by hand.
  function parseDuration(effect, casterLevelOrContext = 1) {
    const context =
      casterLevelOrContext && typeof casterLevelOrContext === "object"
        ? casterLevelOrContext
        : { casterLevel: casterLevelOrContext };
    const casterLevel = context.casterLevel ?? 1;
    if (window.PFEffectMeta?.parseDuration) {
      return window.PFEffectMeta.parseDuration(effect, context);
    }
    const parts = durationParts(effect);
    if (!parts.count || parts.unit === "variable") return null;
    const amount = Number(parts.count) || 1;
    const multiplier = parts.perLevel
      ? Math.max(1, Number(casterLevel) || 1)
      : 1;
    if (parts.unit === "turn" || parts.unit === "round")
      return amount * multiplier;
    if (parts.unit === "minute") return amount * 10 * multiplier;
    if (parts.unit === "hour") return amount * 600 * multiplier;
    if (parts.unit === "day") return amount * 14400 * multiplier;
    return null;
  }

  function formatDurationRounds(rounds) {
    if (rounds === null || rounds === undefined) return "variable";
    if (Number(rounds) <= 0) return "0 turns";
    if (rounds === 1) return "1 turn";
    if (rounds % 600 === 0)
      return `${rounds / 600} hour${rounds === 600 ? "" : "s"}`;
    if (rounds % 10 === 0)
      return `${rounds / 10} minute${rounds === 10 ? "" : "s"}`;
    return `${rounds} round${rounds === 1 ? "" : "s"}`;
  }

  function activeDuration(effect) {
    if (effect.passiveSource) return "Permanent";
    if (effect.permanent) return "Permanent";
    if (conditionUsesTurns(effect)) {
      const turns = Math.max(
        0,
        Number(effect.remaining ?? effect.turns ?? 1) || 0,
      );
      return `${turns} turn${turns === 1 ? "" : "s"}`;
    }
    const rounds = effect.remaining ?? effect.computedDuration;
    if (rounds !== undefined && rounds !== null && Number.isFinite(Number(rounds)))
      return formatDurationRounds(Math.max(0, Number(rounds)));
    const calculated = parseDuration(effect, effect.casterLevel || 1);
    if (calculated !== null) return formatDurationRounds(calculated);
    const stored = String(effect.durationLabel || "")
      .split("|")
      .pop()
      .trim()
      .replace(/^CL\s*\d+\s*:\s*/i, "");
    return /^(?:\d+(?:\.\d+)?\s+(?:turns?|rounds?|minutes?|hours?|days?)|permanent|variable)$/i.test(
      stored,
    )
      ? stored
      : "Variable";
  }

  function appliedDurationLabel(effect) {
    if (effect.permanent) return "Permanent";
    if (conditionUsesTurns(effect)) {
      const turns = Math.max(1, Number(effect.turns || effect.remaining || 1));
      return `${turns} turn${turns === 1 ? "" : "s"}`;
    }
    const baseDurationLabel = durationLabel(effect);
    const computedDuration = parseDuration(effect, effect.casterLevel || 1);
    if (computedDuration === null) return baseDurationLabel;
    return durationUsesCasterLevel(effect)
      ? `${baseDurationLabel} | CL ${effect.casterLevel || 1}: ${formatDurationRounds(computedDuration)}`
      : `${baseDurationLabel} | ${formatDurationRounds(computedDuration)}`;
  }

  function bonusText(bonus) {
    const normalizedStat = String(bonus.stat || "")
      .toLowerCase()
      .trim();
    if (normalizedStat === "healing") {
      const formula = window.PFEffectRolls?.formulaText?.(
        window.PFEffectRolls.healingFormula(bonus),
      ) || String(Number(bonus.value || 0));
      const diceScale = scaleText(bonus.diceCountScale);
      const staticScale = scaleText(bonus.bonusScale || bonus.scale);
      return `Healing ${formula}${diceScale ? `; dice ${diceScale}` : ""}${staticScale ? `; static ${staticScale}` : ""}`;
    }
    if (normalizedStat === "fast healing") {
      const scale = scaleText(bonus.bonusScale || bonus.scale);
      return `Fast Healing ${Number(bonus.value || 0)}${scale ? `; ${scale}` : ""}`;
    }
    if (
      normalizedStat === "remove dex bonus to ac"
    ) {
      const text = "Removes DEX bonus to AC";
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
    if (
      String(bonus.stat || "")
        .toLowerCase()
        .trim() === "cannot gain morale bonuses"
    ) {
      const text = "Cannot gain morale bonuses";
      return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
    }
    const value = Number(bonus.value || 0);
    const scale = scaleText(bonus.bonusScale || bonus.scale);
    const requirement = window.PFEffectEditor?.attributeRequirementText?.(bonus);
    const statLabel = bonus.skillName || titleCaseStat(bonus.stat);
    const weaponRestriction =
      bonus.weaponTypeRestriction && bonus.weaponTypeRestriction !== "all"
        ? `; ${window.PFEffectStats?.weaponTypeRestrictionLabel?.(bonus.weaponTypeRestriction) || bonus.weaponTypeRestriction} only`
        : "";
    const weaponNameRestriction = bonus.weaponNameRestriction && bonus.weaponNameRestriction !== "all"
      ? `; ${bonus.weaponNameRestriction} only` : "";
    const text = `${fmt(value)} ${bonus.type || "untyped"} ${statLabel}${weaponRestriction}${weaponNameRestriction}${scale ? `; ${scale}` : ""}${requirement ? `; ${requirement}` : ""}`;
    return bonus.appliesWhen ? `${text} (${bonus.appliesWhen})` : text;
  }

  function spellLikeText(entry = {}) {
    const choiceList =
      entry.spellChoiceList ||
      window.PFEffectStats?.customSpellLikeListById?.(
        entry.spellChoiceListId || "",
      );
    const spellName = choiceList
      ? `choose from ${choiceList.name || "SLA list"}`
      : entry.spellName || entry.spell?.name || "Spell";
    const minimumLevel = Number(entry.minimumLevel ?? entry.level ?? 1) || 1;
    const levelText = minimumLevel > 1 ? `level ${minimumLevel}, ` : "";
    const castingAttr = String(
      entry.castingAttr || entry.castingAbility || entry.ability || "",
    )
      .trim()
      .toUpperCase();
    const minimumScore = Number(
      entry.minimumScore ?? entry.minimumAbilityScore ?? entry.score,
    );
    const scoreText =
      castingAttr && Number.isFinite(minimumScore) && minimumScore > 0
        ? `${castingAttr} ${minimumScore}, `
        : "";
    return `SLA ${levelText}${scoreText}${entry.frequency ? `${entry.frequency}: ` : ""}${spellName}`;
  }

  function extraRanksPerLevelText(entry = {}) {
    if (window.PFEffectEditor?.extraRanksPerLevelText)
      return window.PFEffectEditor.extraRanksPerLevelText(entry);
    const value = Number(entry.value ?? entry.amount ?? entry.ranks ?? 0);
    return `Extra Ranks / Level ${value >= 0 ? "+" : ""}${value}`;
  }

  function featGrantText(entry = {}) {
    if (window.PFEffectEditor?.featGrantText)
      return window.PFEffectEditor.featGrantText(entry);
    return `Gain feat: ${entry.featName || entry.featId || entry.featType || entry.featPoolId || "Feat"}`;
  }

  function casterLevelBonusText(entry = {}) {
    if (window.PFEffectEditor?.casterLevelBonusText)
      return window.PFEffectEditor.casterLevelBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Caster Level ${value >= 0 ? "+" : ""}${value}`;
  }

  function spellDcBonusText(entry = {}) {
    if (window.PFEffectEditor?.spellDcBonusText)
      return window.PFEffectEditor.spellDcBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Spell DC ${value >= 0 ? "+" : ""}${value}`;
  }

  function effectiveAttributeBonusText(entry = {}) {
    if (window.PFEffectEditor?.effectiveAttributeBonusText)
      return window.PFEffectEditor.effectiveAttributeBonusText(entry);
    const value = Number(entry.value ?? entry.amount ?? 0);
    return `Effective Attribute ${value >= 0 ? "+" : ""}${value}`;
  }

  function grantDomainText(entry = {}) {
    if (window.PFEffectEditor?.grantDomainText)
      return window.PFEffectEditor.grantDomainText(entry);
    return `Grant Domain: ${entry.domainName || entry.domainId || "Domain"}`;
  }

  function weaponDamageSizeText(entry = {}) {
    return window.PFEffectEditor?.weaponDamageSizeChangeText?.(entry) ||
      `${entry.weaponName || entry.weaponType || "Weapon"}: damage as one size ${Number(entry.sizeSteps) < 0 ? "smaller" : "larger"}`;
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
    return `Applies condition: ${conditionName(entry) || "Condition"}`;
  }

  function scaleText(scale) {
    if (!scale) return "";
    const parts = [];
    const sourceLabel = scale.source
      ? `${window.PFEffectMeta?.factorLabel?.(scale.source) || "level"}`
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
          `${sourceLabel} ${milestone.level}: ${fmt(Number(milestone.value || 0))}`,
      );
    if (milestoneText.length) parts.push(milestoneText.join(", "));
    const every = scale.every || {};
    const fromLevel = every.fromLevel || every.afterLevel || every.after;
    if (fromLevel && every.everyLevels && every.increase) {
      parts.push(
        `from ${sourceLabel} ${fromLevel}, every ${every.everyLevels}: ${fmt(Number(every.increase || 0))}`,
      );
    }
    if (scale.minimumOne) parts.push("minimum 1");
    return parts.length ? `scales ${parts.join("; ")}` : "";
  }

  function searchText(effect) {
    return [
      effect.name,
      effect.category,
      durationLabel(effect),
      ...(effect.bonuses || []).map(bonusText),
      ...(effect.immunities || []).map(immunityText),
      ...(effect.applyConditions || []).map(applyConditionText),
      ...(effect.useUntrained || []).map((entry) =>
        window.PFEffectEditor?.useUntrainedText?.(entry) || "use untrained",
      ),
      ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
      ...(effect.featGrants || []).map(featGrantText),
      ...(effect.spellLikeAbilities || []).map(spellLikeText),
      ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
      ...(effect.spellDcBonuses || []).map(spellDcBonusText),
      ...(effect.effectiveAttributeBonuses || []).map(
        effectiveAttributeBonusText,
      ),
      ...(effect.grantDomains || []).map(grantDomainText),
      ...(effect.generatedEquipment || []).map(
        (item) => `${item.type || "equipment"} ${item.name || item.item || ""}`,
      ),
      ...(effect.weaponDamageSizeChanges || []).map(weaponDamageSizeText),
    ]
      .join(" ")
      .toLowerCase();
  }

  function effectBrowserNavHtml({
    attribute = "data-effect-browser-group",
    activeGroup = "spells",
  } = {}) {
    return EFFECT_BROWSER_GROUPS.map(([group, label]) => {
      const active = group === activeGroup;
      return `<button class="nav-link${active ? " active" : ""}" type="button" ${attribute}="${group}" role="tab" aria-selected="${active}">${label}</button>`;
    }).join("");
  }

  function effectBrowserControlsHtml(effect, defaultCasterLevel = 1) {
    const needsCl = durationUsesCasterLevel(effect);
    const configurable = window.PFConditionConfig?.isConfigurable?.(effect);
    const needsAbility = window.PFConditionConfig?.needsAbility?.(effect);
    const adjustment = effect.adjustableCondition || {};
    const abilityOptions = (window.PFConditionConfig?.ABILITIES || [])
      .map(
        ([value, label]) =>
          `<option value="${escapeHtml(value)}" ${value === adjustment.stat ? "selected" : ""}>${escapeHtml(label)}</option>`,
      )
      .join("");
    return `
      <div class="effect-browser-controls">
        ${
          needsCl
            ? `<label class="small effect-browser-number-control"><span>CL</span><input class="form-control form-control-sm" data-picker-cl type="number" min="1" value="${escapeHtml(effect.casterLevel || defaultCasterLevel || 1)}"></label>`
            : ""
        }
        ${needsAbility ? `<label class="small effect-browser-condition-control"><span>Ability</span><select class="form-select form-select-sm" data-picker-condition-ability>${abilityOptions}</select></label>` : ""}
        ${configurable ? `<label class="small effect-browser-number-control"><span>${escapeHtml(adjustment.label || "Amount")}</span><input class="form-control form-control-sm" data-picker-condition-amount type="number" min="${Math.max(1, Number(adjustment.minimum || 1))}" value="${Math.max(1, Number(adjustment.amount || 1))}" inputmode="numeric"></label>` : ""}
        ${
          conditionUsesTurns(effect)
            ? `<label class="small effect-browser-number-control"><span>Turns</span><input class="form-control form-control-sm" data-picker-turns type="number" min="1" value="1"></label>`
            : ""
        }
      </div>
    `;
  }

  function effectBrowserRowHtml(effect, index, options = {}) {
    const condition = isCondition(effect);
    return `
      <article class="effect-browser-row${condition ? " is-condition" : ""}" role="button" tabindex="0" data-picker-effect-index="${index}">
        <div>
          <div class="effect-browser-row-title">${escapeHtml(effect.name || "Effect")}</div>
          ${condition ? "" : `<div class="effect-browser-row-meta">${escapeHtml(effect.category || "Effect")}${
            effect.source ? ` | ${escapeHtml(effect.source)}` : ""
          }</div>`}
        </div>
        ${effectBrowserControlsHtml(effect, options.defaultCasterLevel)}
      </article>
    `;
  }

  function effectBrowserSpellsHtml(rows, spellPanels = {}) {
    const groups = new Map();
    rows.forEach(({ effect, index }) => {
      const className = effect.spellMeta?.className || "Spell-Like Abilities";
      if (!groups.has(className)) groups.set(className, new Map());
      const level = Number(effect.spellMeta?.level || 0);
      if (!groups.get(className).has(level)) groups.get(className).set(level, []);
      groups.get(className).get(level).push({ effect, index });
    });
    const buttons = (entries) =>
      entries
        .map(
          ({ effect, index }) => `
            <button class="btn btn-outline-info btn-sm effect-browser-spell-button" type="button" data-picker-effect-index="${index}">
              ${escapeHtml(effect.name)}
            </button>
          `,
        )
        .join("");
    return [...groups.entries()]
      .map(([className, levels]) => {
        const classSpells = [...levels.values()].flat();
        const spellLikeAbilities = classSpells.every(
          ({ effect }) => effect.spellMeta?.kind === "sla",
        );
        if (spellLikeAbilities) {
          const sorted = classSpells.sort(
            (a, b) =>
              Number(a.effect.spellMeta?.level || 0) -
                Number(b.effect.spellMeta?.level || 0) ||
              String(a.effect.name || "").localeCompare(b.effect.name || ""),
          );
          return `
            <section class="effect-browser-spell-class">
              <div class="effect-browser-spell-class-title fw-bold text-uppercase">${escapeHtml(className)}</div>
              <div class="effect-browser-sla-list">${buttons(sorted)}</div>
            </section>
          `;
        }
        const preparation = String(
          classSpells.find(({ effect }) => effect.spellMeta?.preparation)
            ?.effect.spellMeta.preparation || "",
        ).toLowerCase();
        const usesSpellbook =
          preparation === "spellbook" ||
          (!preparation &&
            classSpells.some(
              ({ effect }) => effect.spellMeta?.bucket === "book",
            ));
        return `
          <section class="effect-browser-spell-class">
            <div class="effect-browser-spell-class-title fw-bold text-uppercase">${escapeHtml(className)}</div>
            ${[...levels.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([level, spells]) => {
                const known = spells.filter(
                  ({ effect }) => effect.spellMeta?.bucket !== "prepared",
                );
                const prepared = spells.filter(
                  ({ effect }) => effect.spellMeta?.bucket === "prepared",
                );
                if (!usesSpellbook) {
                  const usesDailyList =
                    preparation === "daily-list" ||
                    (!preparation && prepared.length > 0 && known.length === 0);
                  const available = usesDailyList ? prepared : known;
                  return `
                    <div class="effect-browser-spell-level">
                      <div class="effect-browser-level-number">${level}</div>
                      <div class="effect-browser-spell-columns is-single">
                        <div class="effect-browser-spell-panel is-single">
                          <div class="effect-browser-spell-column-title">${usesDailyList ? "Prepared Today" : "Known"}</div>
                          ${buttons(available.length ? available : spells)}
                        </div>
                      </div>
                    </div>
                  `;
                }
                const mobileGroup = `${className}:${level}`;
                const activePanel =
                  spellPanels[mobileGroup] ||
                  (known.length ? "known" : "prepared");
                return `
                  <div class="effect-browser-spell-level">
                    <div class="effect-browser-level-number">${level}</div>
                    <div class="effect-browser-spell-mobile-tabs" role="group" aria-label="${escapeHtml(className)} level ${level} spells">
                      <button class="effect-browser-spell-mobile-tab${activePanel === "known" ? " active" : ""}" type="button" data-effect-browser-spell-tab="known" data-effect-browser-spell-group="${escapeHtml(mobileGroup)}" aria-selected="${activePanel === "known"}">Known</button>
                      <button class="effect-browser-spell-mobile-tab${activePanel === "prepared" ? " active" : ""}" type="button" data-effect-browser-spell-tab="prepared" data-effect-browser-spell-group="${escapeHtml(mobileGroup)}" aria-selected="${activePanel === "prepared"}">Prepared</button>
                    </div>
                    <div class="effect-browser-spell-columns">
                      <div class="effect-browser-spell-panel${activePanel === "known" ? " is-mobile-active" : ""}" data-effect-browser-spell-panel="known">
                        <div class="effect-browser-spell-column-title">Known / In Book</div>
                        ${buttons(known)}
                      </div>
                      <div class="effect-browser-spell-panel${activePanel === "prepared" ? " is-mobile-active" : ""}" data-effect-browser-spell-panel="prepared">
                        <div class="effect-browser-spell-column-title">Prepared Today</div>
                        ${buttons(prepared)}
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </section>
        `;
      })
      .join("");
  }

  function effectBrowserLoadingHtml(group = "spells") {
    if (group === "spells") {
      const spellRows = Array.from({ length: 4 }, () =>
        '<div class="effect-browser-loading-spell"></div>',
      ).join("");
      return `
        <section class="effect-browser-spell-class effect-browser-loading" aria-label="Loading spells">
          <span class="effect-browser-loading-line is-title"></span>
          <div class="effect-browser-spell-level">
            <div class="effect-browser-level-number">1</div>
            <div class="effect-browser-spell-columns is-single">
              <div>${spellRows}</div>
            </div>
          </div>
        </section>
      `;
    }
    return Array.from(
      { length: group === "conditions" ? 5 : 4 },
      () => `
        <article class="effect-browser-row effect-browser-loading" aria-label="Loading effect">
          <div>
            <span class="effect-browser-loading-line is-title"></span>
            <span class="effect-browser-loading-line"></span>
          </div>
          <span class="effect-browser-loading-line is-short"></span>
        </article>
      `,
    ).join("");
  }

  function stamp(contextKey, characterId) {
    const value = String(Date.now());
    localStorage.setItem(`pf_buffs_updated_${contextKey}`, value);
    if (characterId)
      localStorage.setItem(
        `pf_buffs_updated_${contextKey}_${characterId}`,
        value,
      );
  }

  function shouldResetPickerCache(
    options = {},
    currentKey = "",
    currentRevision = "",
  ) {
    if (options.preservePickerCache !== true) return true;
    const nextKey = String(options.pickerCacheKey || options.characterId || "");
    const nextRevision = String(options.pickerCacheRevision || "");
    return nextKey !== currentKey || nextRevision !== currentRevision;
  }

  class EffectTracker {
    constructor(container, options) {
      this.container = container;
      this.options = options;
      this.effects = [];
      this.active = [];
      this.prefix = `effectTracker${Math.random().toString(36).slice(2)}`;
      this.saveTimer = null;
      this.activeTypeFilter = "spell";
      this.pickerGroup = "spells";
      this.pickerEffects = [];
      this.pickerLoadedGroups = new Set();
      this.passiveEffects = [];
      this.pickerClosingForSelection = false;
      this.pickerFinishing = false;
      this.pickerLoading = false;
      this.pickerReturnModalEl = null;
      this.pickerSpellPanels = {};
      this.pickerVisibleLimit = PICKER_RESULT_BATCH_SIZE;
      this.refreshGeneration = 0;
      this.pickerCacheKey = "";
      this.pickerCacheRevision = "";
    }

    async mount() {
      injectStyles();
      this.container.innerHTML = `
        <div id="${this.prefix}AddShell" class="effect-tracker-add-shell">
          <div class="effect-tracker-add-row">
            <input id="${this.prefix}OpenSearch" class="form-control form-control-sm effect-tracker-search-trigger" placeholder="Search available abilities..." readonly>
            <button id="${this.prefix}OpenButton" class="btn btn-outline-success btn-sm" type="button">Use Powers</button>
          </div>
        </div>
        <div id="${this.prefix}RequestStatus" class="small-text mb-2 d-none"></div>
        <div id="${this.prefix}Active"></div>
        <div class="modal fade modal-workspace" id="${this.prefix}PickerModal" tabindex="-1" aria-labelledby="${this.prefix}PickerLabel" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable effect-search-modal-dialog">
            <div class="modal-content bg-dark text-white border-secondary">
              <div class="modal-header border-secondary">
                <h5 class="modal-title" id="${this.prefix}PickerLabel">Use Powers</h5>
              </div>
              <div class="modal-body effect-search-modal-body">
                <nav id="${this.prefix}PickerNav" class="nav nav-pills effect-browser-nav" aria-label="Effect groups" role="tablist">
                  ${effectBrowserNavHtml()}
                </nav>
                <input id="${this.prefix}Search" class="form-control form-control-sm mb-3" placeholder="Search effects">
                <div id="${this.prefix}Results" class="effect-search-results effect-browser-list"></div>
              </div>
              <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      `;
      this.addShellEl = document.getElementById(`${this.prefix}AddShell`);
      this.openSearchEl = document.getElementById(`${this.prefix}OpenSearch`);
      this.openButtonEl = document.getElementById(`${this.prefix}OpenButton`);
      this.pickerModalEl = document.getElementById(`${this.prefix}PickerModal`);
      this.searchEl = document.getElementById(`${this.prefix}Search`);
      this.pickerNavEl = document.getElementById(`${this.prefix}PickerNav`);
      this.resultsEl = document.getElementById(`${this.prefix}Results`);
      this.activeEl = document.getElementById(`${this.prefix}Active`);
      if (this.pickerModalEl.parentElement !== document.body)
        document.body.appendChild(this.pickerModalEl);
      this.searchEl.addEventListener("input", () => {
        this.pickerVisibleLimit = PICKER_RESULT_BATCH_SIZE;
        this.renderResults();
      });
      this.pickerNavEl.querySelectorAll("[data-effect-browser-group]").forEach((button) => {
        button.addEventListener("click", async () => {
          this.pickerGroup = button.dataset.effectBrowserGroup || "spells";
          this.pickerVisibleLimit = PICKER_RESULT_BATCH_SIZE;
          await this.loadPickerGroup(this.pickerGroup);
        });
      });
      this.openSearchEl.addEventListener("click", () => this.openPicker());
      this.openButtonEl.addEventListener("click", () => this.openPicker());
      this.pickerModalEl.addEventListener("hidden.bs.modal", () => {
        if (this.pickerClosingForSelection) {
          this.pickerClosingForSelection = false;
          return;
        }
        if (!this.pickerFinishing) this.options.onEffectPickerCancel?.();
        this.pickerFinishing = false;
        this.restorePickerParent();
      });
      await this.refresh(this.options);
    }

    async refresh(options = this.options) {
      const generation = ++this.refreshGeneration;
      this.options = { ...this.options, ...options };
      const pickerCacheKey = String(
        this.options.pickerCacheKey || this.options.characterId || "",
      );
      const pickerCacheRevision = String(this.options.pickerCacheRevision || "");
      const pickerCacheChanged = shouldResetPickerCache(
        this.options,
        this.pickerCacheKey,
        this.pickerCacheRevision,
      );
      if (pickerCacheChanged) {
        this.pickerEffects = [];
        this.pickerLoadedGroups.clear();
        this.pickerSpellPanels = {};
      }
      this.pickerCacheKey = pickerCacheKey;
      this.pickerCacheRevision = pickerCacheRevision;
      if (!this.options.characterId) {
        this.effects = [];
        this.active = [];
        this.passiveEffects = [];
        this.updateSearchVisibility();
        this.renderResults();
        this.renderActive();
        return;
      }
      const abilities = Array.isArray(this.options.activatableAbilities)
        ? this.options.activatableAbilities
        : [];
      this.effects = abilities;
      const saved = await (this.options.loadActiveEffects
        ? this.options.loadActiveEffects()
        : PFApp.loadBuffState(
            this.options.contextKey,
            this.options.characterId,
          ));
      if (generation !== this.refreshGeneration) return;
      this.active = Array.isArray(saved) ? saved : saved?.buffs || [];
      this.passiveEffects = Array.isArray(this.options.initialPassiveEffects)
        ? this.options.initialPassiveEffects
        : [];
      this.updateSearchVisibility();
      this.renderResults();
      this.renderActive();
      if (
        this.options.loadPassiveEffects &&
        !Array.isArray(this.options.initialPassiveEffects)
      ) {
        const loadPassives = async () => {
          try {
            const passives = await this.options.loadPassiveEffects();
            if (generation !== this.refreshGeneration) return;
            this.passiveEffects = Array.isArray(passives) ? passives : [];
            this.renderActive();
          } catch (error) {
            console.error("Could not load passive effects.", error);
          }
        };
        requestAnimationFrame(() => window.setTimeout(() => void loadPassives(), 0));
      }
    }

    setActiveEffects(effects = []) {
      this.active = Array.isArray(effects) ? [...effects] : [];
      this.renderActive();
    }

    setPassiveEffects(effects = []) {
      this.passiveEffects = Array.isArray(effects) ? [...effects] : [];
      this.renderActive();
    }

    updateSearchVisibility() {
      const hasActivations = Boolean(
        this.options.characterId &&
          (this.effects.length || this.options.effectPickerEffects),
      );
      this.addShellEl?.classList.toggle("d-none", !hasActivations);
    }

    showStatus(message, type = "muted") {
      const status = document.getElementById(`${this.prefix}RequestStatus`);
      if (!status) return;
      status.className = `small mb-2 text-${type}`;
      status.textContent = message;
      status.classList.toggle("d-none", !message);
    }

    pickerGroupFor(effect = {}) {
      return effectSourceGroup(effect);
    }

    showActiveEffectCategory(effect = {}) {
      const nextTab = activeEffectTab(effect);
      if (ACTIVE_EFFECT_TABS.some((tab) => tab.key === nextTab))
        this.activeTypeFilter = nextTab;
    }

    waitForModalHidden(modalEl) {
      if (!modalEl?.classList.contains("show")) return Promise.resolve();
      return new Promise((resolve) => {
        modalEl.addEventListener("hidden.bs.modal", resolve, { once: true });
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      });
    }

    async hidePickerParent() {
      const parentModal = this.container.closest(".modal.show");
      if (!parentModal || parentModal === this.pickerModalEl) return;
      this.pickerReturnModalEl = parentModal;
      await this.waitForModalHidden(parentModal);
    }

    restorePickerParent() {
      const parentModal = this.pickerReturnModalEl;
      this.pickerReturnModalEl = null;
      if (!parentModal?.isConnected) return;
      bootstrap.Modal.getOrCreateInstance(parentModal).show();
    }

    finishPicker() {
      const modal = bootstrap.Modal.getOrCreateInstance(this.pickerModalEl);
      this.pickerFinishing = true;
      if (this.pickerModalEl.classList.contains("show")) {
        modal.hide();
        return;
      }
      this.pickerFinishing = false;
      this.restorePickerParent();
    }

    async openPicker() {
      if (!this.options.characterId) return;
      this.pickerGroup = "spells";
      this.pickerVisibleLimit = PICKER_RESULT_BATCH_SIZE;
      this.searchEl.value = "";
      this.pickerLoading = true;
      this.renderPickerNav();
      this.renderResults();
      await this.options.onEffectPickerOpen?.();
      await this.hidePickerParent();
      bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show();
      await this.loadPickerGroup("spells");
      this.pickerModalEl.addEventListener(
        "shown.bs.modal",
        () => this.searchEl?.focus(),
        { once: true },
      );
    }

    mergePickerEffects(effects = []) {
      const merged = new Map(
        this.pickerEffects.map((effect) => [
          [effect.id, effect.category, effect.name, effect.source]
            .map((value) => String(value || "").toLowerCase())
            .join("::"),
          effect,
        ]),
      );
      effects.forEach((effect) => {
        const key = [effect.id, effect.category, effect.name, effect.source]
          .map((value) => String(value || "").toLowerCase())
          .join("::");
        merged.set(key, effect);
      });
      this.pickerEffects = preferOwnedPickerEffects([...merged.values()]);
    }

    async loadPickerGroup(group = this.pickerGroup) {
      if (this.pickerLoadedGroups.has(group)) {
        this.pickerLoading = false;
        this.renderResults();
        return;
      }
      this.pickerLoading = true;
      this.renderResults();
      try {
        const lazySource = this.options.loadEffectPickerGroup;
        if (typeof lazySource === "function") {
          const loaded = await lazySource(group);
          this.mergePickerEffects(Array.isArray(loaded) ? loaded : []);
          this.pickerLoadedGroups.add(group);
        } else {
          const source = this.options.effectPickerEffects;
          const loaded = typeof source === "function" ? await source() : source;
          this.pickerEffects = preferOwnedPickerEffects(
            Array.isArray(loaded) ? loaded : this.effects,
          );
          EFFECT_BROWSER_GROUPS.forEach(([value]) =>
            this.pickerLoadedGroups.add(value),
          );
        }
      } catch (error) {
        console.error(error);
        if (!this.pickerEffects.length) this.pickerEffects = [...this.effects];
      } finally {
        this.pickerLoading = false;
      }
      this.renderResults();
    }

    renderPickerNav() {
      this.pickerNavEl
        ?.querySelectorAll("[data-effect-browser-group]")
        .forEach((button) => {
          const active = button.dataset.effectBrowserGroup === this.pickerGroup;
          button.classList.toggle("active", active);
          button.setAttribute("aria-selected", String(active));
        });
    }

    hidePicker() {
      const modal = bootstrap.Modal.getOrCreateInstance(this.pickerModalEl);
      if (!this.pickerModalEl.classList.contains("show"))
        return Promise.resolve();
      return new Promise((resolve) => {
        this.pickerModalEl.addEventListener("hidden.bs.modal", resolve, {
          once: true,
        });
        modal.hide();
      });
    }

    pickerControls(effect) {
      return effectBrowserControlsHtml(effect);
    }

    pickerRowHtml(effect, index) {
      return effectBrowserRowHtml(effect, index);
    }

    renderPickerSpells(rows) {
      return effectBrowserSpellsHtml(rows, this.pickerSpellPanels);
    }

    loadingResultsHtml() {
      return effectBrowserLoadingHtml(this.pickerGroup);
    }

    bindPickerRows() {
      this.resultsEl
        .querySelector("[data-effect-browser-more]")
        ?.addEventListener("click", () => {
          this.pickerVisibleLimit += PICKER_RESULT_BATCH_SIZE;
          this.renderResults();
        });
      this.resultsEl
        .querySelectorAll("[data-effect-browser-spell-tab]")
        .forEach((button) => {
          button.addEventListener("click", () => {
            const group = button.dataset.effectBrowserSpellGroup || "";
            const target = button.dataset.effectBrowserSpellTab || "known";
            this.pickerSpellPanels[group] = target;
            const wrapper = button.closest(".effect-browser-spell-level");
            if (!wrapper) return;
            wrapper
              .querySelectorAll("[data-effect-browser-spell-tab]")
              .forEach((tab) => {
                const active = tab.dataset.effectBrowserSpellTab === target;
                tab.classList.toggle("active", active);
                tab.setAttribute("aria-selected", String(active));
              });
            wrapper
              .querySelectorAll("[data-effect-browser-spell-panel]")
              .forEach((panel) => {
                panel.classList.toggle(
                  "is-mobile-active",
                  panel.dataset.effectBrowserSpellPanel === target,
                );
              });
          });
        });
      this.resultsEl
        .querySelectorAll("[data-picker-effect-index]")
        .forEach((row) => {
          const choose = () =>
            this.choosePickerEffect(
              Number(row.dataset.pickerEffectIndex),
              row.closest(".effect-browser-row") || row,
            );
          row.addEventListener("click", (event) => {
            if (event.target.closest(".effect-browser-controls")) return;
            choose();
          });
          row.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            choose();
          });
        });
    }

    async choosePickerEffect(index, row) {
      let effect = this.pickerEffects[index];
      if (!effect) return;
      if (effect.ownedSpell && this.options.hydratePickerEffect) {
        row?.classList.add("effect-browser-loading-pulse");
        try {
          effect = (await this.options.hydratePickerEffect(effect)) || effect;
          this.pickerEffects[index] = effect;
        } finally {
          row?.classList.remove("effect-browser-loading-pulse");
        }
      }
      const configuredEffect = window.PFConditionConfig?.isConfigurable?.(effect)
        ? window.PFConditionConfig.configure(effect, {
            ability: row?.querySelector?.("[data-picker-condition-ability]")?.value,
            amount: row?.querySelector?.("[data-picker-condition-amount]")?.value,
          })
        : effect;
      const selection = {
        casterLevel: Math.max(
          1,
          Number.parseInt(row?.querySelector?.("[data-picker-cl]")?.value, 10) ||
            Number(effect.casterLevel || 1) ||
            1,
        ),
        turns: Math.max(
          1,
          Number.parseInt(
            row?.querySelector?.("[data-picker-turns]")?.value,
            10,
          ) || 1,
        ),
        permanent: false,
      };
      this.pickerClosingForSelection = true;
      await this.hidePicker();
      if (
        effect.ownedSpell &&
        effect.spell &&
        window.PFSpellPicker?.openDetails
      ) {
        let cast = false;
        await window.PFSpellPicker.openDetails({
          title: effect.name,
          spell: effect.spell,
          spellName: effect.name,
          className:
            effect.spellMeta?.kind === "sla"
              ? ""
              : effect.spellMeta?.className || "",
          spellLevel: Number(effect.spellMeta?.level || 0),
          calculations: effect.spellCalculations || null,
          recalculate:
            typeof this.options.recalculateSpell === "function"
              ? (casterLevel) =>
                  this.options.recalculateSpell(effect, casterLevel)
              : null,
          onCast: async ({ casterLevel, calculations, closeDetails }) => {
            cast = true;
            closeDetails?.();
            await new Promise((resolve) => setTimeout(resolve, 180));
            await this.addEffectDefinition({
              ...configuredEffect,
              spellCalculations:
                calculations || configuredEffect.spellCalculations || null,
            }, {
              ...selection,
              casterLevel: casterLevel || selection.casterLevel,
            });
            return { close: true };
          },
        });
        if (!cast || this.pickerReturnModalEl)
          bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show();
        return;
      }
      await this.addEffectDefinition(configuredEffect, selection);
      if (this.pickerReturnModalEl)
        bootstrap.Modal.getOrCreateInstance(this.pickerModalEl).show();
    }

    renderResults() {
      if (!this.resultsEl) return;
      this.renderPickerNav();
      if (this.pickerLoading) {
        this.resultsEl.innerHTML = this.loadingResultsHtml();
        return;
      }
      const term = this.searchEl?.value.trim().toLowerCase() || "";
      const rows = this.pickerEffects
        .map((effect, index) => ({ effect, index }))
        .filter(
          ({ effect }) => this.pickerGroupFor(effect) === this.pickerGroup,
        )
        .filter(({ effect }) => !term || searchText(effect).includes(term))
        .sort((a, b) => {
          const aItem =
            String(a.effect.category || "").toLowerCase() === "item";
          const bItem =
            String(b.effect.category || "").toLowerCase() === "item";
          return (
            Number(aItem) - Number(bItem) ||
            String(a.effect.category || "").localeCompare(
              String(b.effect.category || ""),
            ) ||
            String(a.effect.name || "").localeCompare(
              String(b.effect.name || ""),
            )
          );
        });
      if (!rows.length) {
        this.resultsEl.innerHTML =
          '<div class="small-text">No matching effects found.</div>';
        return;
      }
      const visibleRows =
        this.pickerGroup === "spells"
          ? rows
          : rows.slice(0, this.pickerVisibleLimit);
      const moreResults = visibleRows.length < rows.length
        ? `<button class="btn btn-outline-info btn-sm w-100" type="button" data-effect-browser-more>Show more (${visibleRows.length} of ${rows.length})</button>`
        : "";
      if (this.pickerGroup === "spells") {
        this.resultsEl.innerHTML = this.renderPickerSpells(rows);
      } else if (this.pickerGroup === "other") {
        const groups = new Map();
        visibleRows.forEach((row) => {
          const category = row.effect.category || "Effect";
          if (!groups.has(category)) groups.set(category, []);
          groups.get(category).push(row);
        });
        this.resultsEl.innerHTML = [...groups.entries()]
          .map(
            ([category, entries]) => `
              <section class="effect-browser-type-section">
                <div class="effect-browser-group-title">${escapeHtml(category)}</div>
                <div class="effect-browser-list">
                  ${entries
                    .map(({ effect, index }) =>
                      this.pickerRowHtml(effect, index),
                    )
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("") + moreResults;
      } else {
        this.resultsEl.innerHTML = visibleRows
          .map(({ effect, index }) => this.pickerRowHtml(effect, index))
          .join("") + moreResults;
      }
      this.bindPickerRows();
    }

    // Resolves any "choice:<poolId>" stats within a list of stat-bearing
    // items into concrete stats by prompting the player -- used for both
    // an effect's bonuses (e.g. Ancestor Totem, Lesser bundled into
    // Rage: "+2 insight to a skill of your choice") and its
    // classSkillGrants (a trait/rage power saying "choose a skill; it
    // becomes a class skill"), since both carry the exact same
    // { stat, skillName? } shape. Returns the resolved list, or null if
    // the player cancelled a pick.
    async resolveChoiceStats(items, effect) {
      const list = Array.isArray(items) ? items : [];
      if (!list.some((item) => window.PFEffectStats?.isChoiceStat(item.stat)))
        return list;
      const resolved = [];
      for (const item of list) {
        if (!window.PFEffectStats?.isChoiceStat(item.stat)) {
          resolved.push(item);
          continue;
        }
        const poolId = window.PFEffectStats.choicePoolIdFromStat(item.stat);
        const pool = window.PFEffectStats.poolById(poolId);
        const equipmentSource = this.options.choicePoolEquipment;
        const equipment =
          pool?.kind !== "equipment"
            ? undefined
            : typeof equipmentSource === "function"
              ? await equipmentSource()
              : equipmentSource;
        const options = await window.PFEffectStats.resolveChoicePoolOptions(
          poolId,
          {
            skills: this.options.choicePoolSkills,
            equipment,
            choicePool: item.choicePool,
          },
        );
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose ${pool?.label || "a Target"}`,
              options,
            })
          : null;
        if (!picked) return null;
        resolved.push(
          window.PFEffectStats.resolveChoiceStatItem(item, picked, options),
        );
      }
      return resolved;
    }

    async resolveChoiceBonuses(effect) {
      return this.resolveChoiceStats(effect.bonuses, effect);
    }

    bonusUsesFavoredEnemyScale(bonus = {}) {
      const source = (bonus.bonusScale || bonus.scale || {}).source || {};
      return (
        source.type === "special" && source.special === "favored-enemy-bonus"
      );
    }

    favoredEnemyScaleTarget(bonus = {}) {
      return (
        bonus.bonusScale?.favoredEnemyTarget ||
        bonus.bonusScale?.target ||
        bonus.scale?.favoredEnemyTarget ||
        bonus.scale?.target ||
        bonus.favoredEnemyTarget ||
        bonus.targetFavoredEnemy ||
        ""
      );
    }

    needsFavoredEnemyScaleChoice(bonus = {}) {
      if (!this.bonusUsesFavoredEnemyScale(bonus)) return false;
      if (this.favoredEnemyScaleTarget(bonus)) return false;
      return (
        !bonus.appliesWhen ||
        /favou?red enemy|\{[^{}]+\}/i.test(bonus.appliesWhen)
      );
    }

    effectNeedsFavoredEnemyScaleChoice(effect = {}) {
      return (Array.isArray(effect.bonuses) ? effect.bonuses : []).some(
        (bonus) => this.needsFavoredEnemyScaleChoice(bonus),
      );
    }

    favoredEnemyOptions() {
      const source = this.options.favoredEnemyOptions;
      const options = typeof source === "function" ? source() : source;
      return Array.isArray(options) ? options : [];
    }

    favoredEnemyOptionsWithTargets(targets = []) {
      const byTarget = new Map();
      const add = (option = {}) => {
        const target = String(
          option.favoredEnemyTarget || option.name || option.value || option.label || "",
        )
          .replace(/\s*\([+-]?\d+\)\s*$/g, "")
          .trim();
        if (!target) return;
        const key = target.toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (!key || byTarget.has(key)) return;
        byTarget.set(key, {
          ...option,
          value: target,
          name: target,
          favoredEnemyTarget: target,
          label: target,
        });
      };
      this.favoredEnemyOptions().forEach(add);
      targets.forEach((target) =>
        add({
          value: target,
          label: target,
          name: target,
          favoredEnemyTarget: target,
        }),
      );
      return [...byTarget.values()].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    }

    conditionalChoiceLabel(choices = {}, key = "") {
      const wanted = this.normalizeConditionalVariableKey(key);
      if (!wanted) return "";
      const entry = Object.entries(choices || {}).find(
        ([choiceKey]) =>
          this.normalizeConditionalVariableKey(choiceKey) === wanted,
      )?.[1];
      return wanted.startsWith("favored enemy")
        ? this.cleanFavoredEnemyLabel(entry?.value || entry?.name || entry?.label || "")
        : entry?.label || entry?.name || entry?.value || "";
    }

    async resolveFavoredEnemyScaleTargets(items, effect = {}) {
      const list = Array.isArray(items) ? items : [];
      if (!list.some((item) => this.needsFavoredEnemyScaleChoice(item)))
        return list;
      const options = this.favoredEnemyOptions();
      if (!options.length) {
        this.showStatus(
          "Choose this character's favored enemy first, then apply this favored-enemy-scaled effect.",
          "warning",
        );
        return null;
      }
      const resolved = [];
      for (const item of list) {
        if (!this.needsFavoredEnemyScaleChoice(item)) {
          resolved.push(item);
          continue;
        }
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose Favored Enemy`,
              options,
            })
          : null;
        if (!picked) return null;
        const target =
          typeof picked === "object"
            ? picked.favoredEnemyTarget || picked.name || picked.value
            : String(picked || "");
        if (!target) return null;
        const scale = item.bonusScale || item.scale || {};
        resolved.push({
          ...item,
          bonusScale: {
            ...scale,
            favoredEnemyTarget: target,
          },
          favoredEnemyTarget: target,
          conditional: true,
          appliesWhen:
            !item.appliesWhen ||
            /favou?red enemy|\{[^{}]+\}/i.test(item.appliesWhen)
              ? `against ${target}`
              : item.appliesWhen,
        });
      }
      return resolved;
    }

    conditionalVariables(effect = {}) {
      return Array.isArray(effect.conditionalVariables)
        ? effect.conditionalVariables
        : [];
    }

    normalizeConditionalVariableKey(value = "") {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ");
    }

    cleanFavoredEnemyLabel(value = "") {
      return String(value || "")
        .replace(/\s*\([+-]?\d+\)\s*$/g, "")
        .trim();
    }

    conditionalVariableTokenValue(key = "", choice = {}) {
      const fallback = choice?.label || choice?.name || choice?.value || "";
      return this.normalizeConditionalVariableKey(key).startsWith("favored enemy")
        ? this.cleanFavoredEnemyLabel(choice?.value || choice?.name || fallback)
        : fallback;
    }

    replaceConditionalVariableTokens(text = "", choices = {}) {
      return String(text || "").replace(/\{([^{}]+)\}/g, (match, key) => {
        const choice = choices[this.normalizeConditionalVariableKey(key)];
        return choice
          ? this.conditionalVariableTokenValue(key, choice) || match
          : match;
      });
    }

    interpolateConditionalVariables(value, choices = {}) {
      if (Array.isArray(value))
        return value.map((item) =>
          this.interpolateConditionalVariables(item, choices),
        );
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [
            key,
            this.interpolateConditionalVariables(entry, choices),
          ]),
        );
      }
      if (typeof value === "string")
        return this.replaceConditionalVariableTokens(value, choices);
      return value;
    }

    async resolveConditionalVariables(effect = {}) {
      const variables = this.conditionalVariables(effect)
        .map((variable) => ({
          ...variable,
          key: this.normalizeConditionalVariableKey(
            variable.key || variable.name || variable.label,
          ),
          poolId:
            variable.poolId ||
            variable.pool ||
            variable.source ||
            "ranger-favored-enemies",
        }))
        .filter((variable) => variable.key);
      if (!variables.length) return effect;
      const choices = { ...(effect.conditionalChoices || {}) };
      for (const variable of variables) {
        if (choices[variable.key]) continue;
        const pool = window.PFEffectStats?.conditionalVariablePoolById?.(
          variable.poolId,
        );
        const additionalTargets = [
          this.conditionalChoiceLabel(choices, "favored enemy"),
        ].filter(Boolean);
        const options =
          variable.poolId === "character-favored-enemies"
            ? this.favoredEnemyOptionsWithTargets(additionalTargets)
            : (await window.PFEffectStats?.resolveConditionalVariableOptions?.(
                variable.poolId,
              )) || [];
        const picked = window.PFEffectChoicePicker
          ? await window.PFEffectChoicePicker.open({
              title: `${effect.name || "Effect"}: Choose ${variable.label || variable.key}`,
              options,
            })
          : null;
        if (!picked) return null;
        const pickedValue =
          typeof picked === "object" ? picked.value : String(picked || "");
        const pickedOption =
          options.find((option) => String(option.value) === pickedValue) ||
          (typeof picked === "object" ? picked : null);
        choices[variable.key] = {
          value: pickedValue,
          label: pickedOption?.label || pickedValue,
          poolId: variable.poolId,
          poolLabel: pool?.label || variable.poolLabel || "",
        };
      }
      return this.interpolateConditionalVariables(
        {
          ...effect,
          conditionalVariables: variables,
          conditionalChoices: choices,
        },
        choices,
      );
    }

    spellLikeChoiceList(entry = {}) {
      return (
        entry.spellChoiceList ||
        window.PFEffectStats?.customSpellLikeListById?.(
          entry.spellChoiceListId || "",
        ) ||
        null
      );
    }

    async resolveSpellLikeAbilityChoices(entries, effect) {
      const list = Array.isArray(entries) ? entries : [];
      if (!list.some((entry) => this.spellLikeChoiceList(entry))) return list;
      const resolved = [];
      for (const entry of list) {
        const choiceList = this.spellLikeChoiceList(entry);
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

    spellAdjustmentEntriesNeedChoice(entries = []) {
      return (Array.isArray(entries) ? entries : []).some((entry) =>
        window.PFEffectEditor?.spellAdjustmentEntryNeedsChoice?.(entry),
      );
    }

    async resolveSpellAdjustmentChoices(entries = [], effect = {}) {
      const list = Array.isArray(entries) ? entries : [];
      if (!this.spellAdjustmentEntriesNeedChoice(list)) return list;
      if (!window.PFEffectEditor?.resolveSpellAdjustmentChoices) return null;
      return window.PFEffectEditor.resolveSpellAdjustmentChoices(list, {
        title: effect.name || "Effect",
      });
    }

    grantDomainEntriesNeedChoice(entries = []) {
      return (Array.isArray(entries) ? entries : []).some((entry) =>
        window.PFEffectEditor?.grantDomainEntryNeedsChoice?.(entry),
      );
    }

    async resolveGrantDomainChoices(entries = [], effect = {}) {
      const list = Array.isArray(entries) ? entries : [];
      if (!this.grantDomainEntriesNeedChoice(list)) return list;
      if (!window.PFEffectEditor?.resolveGrantDomainChoices) return null;
      return window.PFEffectEditor.resolveGrantDomainChoices(list, {
        title: effect.name || "Effect",
      });
    }

    choicePools(effect = {}) {
      return Array.isArray(effect.choicePools)
        ? effect.choicePools
        : Array.isArray(effect.pools)
          ? effect.pools
          : [];
    }

    appendChoicePoolMechanics(target = {}, option = {}) {
      const effects = Array.isArray(option.effects)
        ? option.effects
        : Array.isArray(option.bonuses)
          ? option.bonuses
          : [];
      if (effects.length) {
        target.bonuses = [
          ...(Array.isArray(target.bonuses) ? target.bonuses : []),
          ...effects,
        ];
      }
      CHOICE_POOL_MECHANIC_KEYS.forEach((key) => {
        const rows = Array.isArray(option[key]) ? option[key] : [];
        if (!rows.length) return;
        target[key] = [
          ...(Array.isArray(target[key]) ? target[key] : []),
          ...rows,
        ];
      });
    }

    async resolveChoicePoolOptionMechanics(option = {}, effect = {}) {
      const choiceResolvedEffects = await this.resolveChoiceStats(
        option.effects || option.bonuses,
        effect,
      );
      if (choiceResolvedEffects === null) return null;
      const resolvedEffects = await this.resolveFavoredEnemyScaleTargets(
        choiceResolvedEffects,
        effect,
      );
      if (resolvedEffects === null) return null;
      const resolvedClassSkillGrants = await this.resolveChoiceStats(
        option.classSkillGrants,
        effect,
      );
      if (resolvedClassSkillGrants === null) return null;
      const resolvedUseUntrained = await this.resolveChoiceStats(
        option.useUntrained,
        effect,
      );
      if (resolvedUseUntrained === null) return null;
      const resolvedBonusRanks = await this.resolveChoiceStats(
        option.bonusRanks,
        effect,
      );
      if (resolvedBonusRanks === null) return null;
      const resolvedWeaponExtraDamage = await this.resolveChoiceStats(
        option.weaponExtraDamage,
        effect,
      );
      if (resolvedWeaponExtraDamage === null) return null;
      const resolvedAttributeContributions = await this.resolveChoiceStats(
        option.attributeContributions,
        effect,
      );
      if (resolvedAttributeContributions === null) return null;
      const resolvedSpellLikeAbilities =
        await this.resolveSpellLikeAbilityChoices(
          option.spellLikeAbilities,
          effect,
        );
      if (resolvedSpellLikeAbilities === null) return null;
      const resolvedCasterLevelBonuses = await this.resolveSpellAdjustmentChoices(
        option.casterLevelBonuses,
        effect,
      );
      if (resolvedCasterLevelBonuses === null) return null;
      const resolvedSpellDcBonuses = await this.resolveSpellAdjustmentChoices(
        option.spellDcBonuses,
        effect,
      );
      if (resolvedSpellDcBonuses === null) return null;
      const resolvedEffectiveAttributeBonuses =
        await this.resolveSpellAdjustmentChoices(
          option.effectiveAttributeBonuses,
          effect,
        );
      if (resolvedEffectiveAttributeBonuses === null) return null;
      const resolvedGrantDomains = await this.resolveGrantDomainChoices(
        option.grantDomains,
        effect,
      );
      if (resolvedGrantDomains === null) return null;
      return {
        ...option,
        effects: resolvedEffects,
        classSkillGrants: resolvedClassSkillGrants,
        useUntrained: resolvedUseUntrained,
        bonusRanks: resolvedBonusRanks,
        weaponExtraDamage: resolvedWeaponExtraDamage,
        attributeContributions: resolvedAttributeContributions,
        spellLikeAbilities: resolvedSpellLikeAbilities,
        casterLevelBonuses: resolvedCasterLevelBonuses,
        spellDcBonuses: resolvedSpellDcBonuses,
        effectiveAttributeBonuses: resolvedEffectiveAttributeBonuses,
        grantDomains: resolvedGrantDomains,
      };
    }

    async resolveChoicePools(effect = {}) {
      const pools = this.choicePools(effect);
      if (!pools.length) return {};
      if (!window.PFClassFeatureChoicePicker) return null;
      const mechanics = {};
      const poolChoices = {};
      for (const [index, pool] of pools.entries()) {
        const poolKey = pool.name || `Choice ${index + 1}`;
        const choice = await PFClassFeatureChoicePicker.open({
          title: `${effect.name || "Effect"}: ${pool.name || "Choose Feature"}`,
          poolName: pool.name || "Effect Choice",
          description: pool.description || "",
          selected: effect.poolChoices?.[poolKey] || "",
          options: Array.isArray(pool.options) ? pool.options : [],
        });
        if (choice === null) return null;
        if (!choice) continue;
        const option = (pool.options || []).find((item) => item.name === choice);
        if (!option) continue;
        const resolvedOption = await this.resolveChoicePoolOptionMechanics(
          option,
          effect,
        );
        if (!resolvedOption) return null;
        poolChoices[poolKey] = choice;
        this.appendChoicePoolMechanics(mechanics, resolvedOption);
      }
      return { poolChoices, mechanics };
    }

    effectHasOwnMechanics(effect = {}) {
      return Boolean(
        (Array.isArray(effect.bonuses) && effect.bonuses.length) ||
          (Array.isArray(effect.damageReduction) &&
            effect.damageReduction.length) ||
          (Array.isArray(effect.spellResistance) &&
            effect.spellResistance.length) ||
          (Array.isArray(effect.immunities) && effect.immunities.length) ||
          (Array.isArray(effect.classSkillGrants) &&
            effect.classSkillGrants.length) ||
          (Array.isArray(effect.bonusRanks) && effect.bonusRanks.length) ||
          (Array.isArray(effect.extraRanksPerLevel) &&
            effect.extraRanksPerLevel.length) ||
          (Array.isArray(effect.featGrants) &&
            effect.featGrants.length) ||
          (Array.isArray(effect.sizeChanges) && effect.sizeChanges.length) ||
          (Array.isArray(effect.weaponDamageSizeChanges) &&
            effect.weaponDamageSizeChanges.length) ||
          (Array.isArray(effect.spellLikeAbilities) &&
            effect.spellLikeAbilities.length) ||
          (Array.isArray(effect.casterLevelBonuses) &&
            effect.casterLevelBonuses.length) ||
          (Array.isArray(effect.spellDcBonuses) &&
            effect.spellDcBonuses.length) ||
          (Array.isArray(effect.effectiveAttributeBonuses) &&
            effect.effectiveAttributeBonuses.length) ||
          (Array.isArray(effect.grantDomains) &&
            effect.grantDomains.length) ||
          (Array.isArray(effect.generatedEquipment) &&
            effect.generatedEquipment.length) ||
          this.conditionalVariables(effect).length ||
          this.choicePools(effect).length,
      );
    }

    async expandAppliedConditions(effect = {}) {
      const entries = Array.isArray(effect.applyConditions)
        ? effect.applyConditions
        : [];
      if (!entries.length) return [effect];
      const { byName, byId } = await conditionDefinitionMaps();
      const conditions = entries
        .map((entry) => {
          const embedded =
            entry.condition && typeof entry.condition === "object"
              ? entry.condition
              : null;
          const condition =
            embedded ||
            byId.get(String(entry.conditionId || entry.id || "")) ||
            byName.get(conditionName(entry).toLowerCase()) ||
            entry;
          const configured = window.PFConditionConfig?.configuredCondition?.({
            ...entry,
            condition,
          });
          if (configured === null) return null;
          const appliedCondition = configured || condition;
          const name = appliedCondition.name || conditionName(entry);
          if (!name) return null;
          return {
            ...appliedCondition,
            id:
              condition.id ||
              entry.conditionId ||
              `applied-condition:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name,
            category: "Condition",
            appliedCondition: true,
            sourceEffectTab: activeEffectTab(effect),
            source: effect.name || effect.source || "Effect",
            sourceEffectId: effect.id || effect.sourceEffectId || "",
            casterLevel: effect.casterLevel,
            turns: isCondition(effect)
              ? effect.turns
              : Math.max(1, Number(effect.remaining || effect.turns || 1)),
            permanent: effect.permanent,
            remaining: effect.remaining,
            computedDuration: effect.computedDuration,
            durationLabel: effect.durationLabel,
          };
        })
        .filter(Boolean);
      const { applyConditions, ...parent } = effect;
      return [
        ...(this.effectHasOwnMechanics(parent) ? [parent] : []),
        ...conditions,
      ];
    }

    async addActiveEffectWithFearEscalation(effect) {
      if (!isCondition(effect)) {
        this.active.push(effect);
        return;
      }
      const incomingRank = fearRank(effect);
      if (incomingRank < 0) {
        this.active.push(effect);
        return;
      }
      const existingFear = this.active
        .map((active, index) => ({ active, index, rank: fearRank(active) }))
        .filter((entry) => isCondition(entry.active) && entry.rank >= 0);
      const highestExistingRank = existingFear.reduce(
        (highest, entry) => Math.max(highest, entry.rank),
        -1,
      );
      const finalRank =
        highestExistingRank >= 0
          ? Math.min(2, Math.max(highestExistingRank, incomingRank) + 1)
          : incomingRank;
      const { byName } = await conditionDefinitionMaps();
      const finalName = titleCaseConditionName(FEAR_CONDITIONS[finalRank]);
      const finalDefinition =
        byName.get(finalName.toLowerCase()) ||
        (finalRank === incomingRank ? effect : {});
      this.active = this.active.filter(
        (_, index) => !existingFear.some((entry) => entry.index === index),
      );
      this.active.push({
        ...effect,
        ...finalDefinition,
        name: finalDefinition.name || finalName,
        category: "Condition",
        source: effect.source || effect.name || "Fear effect",
        escalatedFrom: [
          ...existingFear.map((entry) => conditionName(entry.active)),
          conditionName(effect),
        ].filter(Boolean),
      });
    }

    async addEffect(index) {
      return this.addEffectDefinition(this.effects[index], { index });
    }

    async resolveDamageRolls(effect, casterLevel, casterContext = {}) {
      const rolls =
        window.PFDamageRolls?.normalizeRolls?.(effect.damageRolls || []) || [];
      if (!rolls.length) return effect;
      const results = await window.PFDamageRolls?.open?.({
        title: `${effect.name || "Effect"} Damage`,
        rolls,
        context: {
          ...casterContext,
          casterLevel,
          classLevel: casterLevel,
        },
      });
      if (!results) return null;
      await this.options.onDamageRolled?.(effect, results);
      const next = { ...effect };
      delete next.damageRolls;
      return next;
    }

    async resolveConditionAdjustments(
      effect,
      casterLevel,
      casterContext = {},
      { deferAbilityChoice = false } = {},
    ) {
      if (!window.PFConditionConfig?.resolveAdjustments) return effect;
      return window.PFConditionConfig.resolveAdjustments(effect, {
        title: effect.name || "Effect",
        deferAbilityChoice,
        context: {
          ...casterContext,
          casterLevel,
          classLevel: casterLevel,
        },
      });
    }

    async resolveHealingRolls(effect, casterLevel, casterContext = {}) {
      if (!window.PFEffectHealing?.resolveRolls) return effect;
      return window.PFEffectHealing.resolveRolls(effect, {
        title: effect.name || "Effect",
        context: {
          ...casterContext,
          casterLevel,
          classLevel: casterLevel,
        },
      });
    }

    async resolveAttackRolls(effect, casterLevel, casterContext = {}) {
      const attacks =
        window.PFAttackRolls?.normalizeAttacks?.(effect.attackRolls || []) || [];
      if (!attacks.length) return effect;
      const context = {
        ...casterContext,
        casterLevel,
        classLevel: casterLevel,
      };
      const rollKinds = new Set(attacks.map((attack) =>
        window.PFAttackRolls?.calculateAttack?.(attack, context)?.rollKind ||
        "attacks",
      ));
      const rollKind = rollKinds.size === 1 ? [...rollKinds][0] : "attacks";
      const d20BoostSession = await this.options.d20BoostSession?.(rollKind);
      if (d20BoostSession) context.d20BoostSession = d20BoostSession;
      const results = await window.PFAttackRolls?.open?.({
        title: `${effect.name || "Effect"} Attacks`,
        attacks,
        context,
      });
      if (!results) return null;
      await this.options.onAttackRolled?.(effect, results);
      return (
        window.PFAttackRolls?.payloadForSuccessfulAttacks?.(effect, results) ||
        effect
      );
    }

    prepareIndependentEffect(child = {}, parent = {}, casterLevel = 1, casterContext = {}) {
      const effect = {
        ...child,
        category: child.category || parent.category,
        source: child.source || parent.name || parent.source || "Effect",
        sourceType: child.sourceType || parent.sourceType,
        sourceTokenId: child.sourceTokenId || parent.sourceTokenId,
        durationAnchorTokenId:
          child.durationAnchorTokenId || parent.durationAnchorTokenId,
        saveDc: child.saveDc ?? parent.saveDc,
        casterLevel: child.casterLevel || parent.casterLevel || casterLevel,
      };
      const trackedTurns = conditionUsesTurns(effect);
      const calculatedDuration = trackedTurns
        ? Math.max(1, Number(effect.turns || 1))
        : parseDuration(effect, { ...casterContext, casterLevel });
      const baseDurationLabel = durationLabel(effect);
      return {
        ...effect,
        turns: trackedTurns ? calculatedDuration : undefined,
        permanent: Boolean(effect.permanent),
        remaining: effect.permanent ? null : calculatedDuration,
        computedDuration: calculatedDuration,
        durationLabel: effect.permanent
          ? "Permanent"
          : calculatedDuration === null
            ? baseDurationLabel
            : `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`,
      };
    }

    async resolveIndependentEffect(child, parent, casterLevel, casterContext) {
      let effect = this.prepareIndependentEffect(
        child,
        parent,
        casterLevel,
        casterContext,
      );
      if (window.PFEffectActivationOrchestrator?.targetMustAnswer?.(effect)) {
        effect =
          this.options.isOwnCharacter === false
            ? await this.requestEffectChoice(effect)
            : await this.resolveActivationDecisions(effect, casterContext);
      } else {
        effect = await this.resolveActivationDecisions(effect, casterContext);
      }
      if (!effect) return null;
      if (window.PFEffectSaves?.hasImmediateSave?.(effect)) {
        effect = await window.PFEffectSaves.resolve(effect, {
          sheet:
            this.options.targetSheet?.() ||
            window.PFCharacterSheetBridge?.currentSheetSnapshot?.() ||
            {},
          title: effect.name || parent.name || "Effect",
          targetName: this.options.targetName || "This character",
        });
        if (!effect) return null;
      }
      effect = await this.resolveAttackRolls(effect, casterLevel, casterContext);
      if (!effect) return null;
      effect = await this.resolveDamageRolls(effect, casterLevel, casterContext);
      if (!effect) return null;
      effect = await this.resolveConditionAdjustments(
        effect,
        casterLevel,
        casterContext,
      );
      if (!effect) return null;
      effect = await this.resolveHealingRolls(effect, casterLevel, casterContext);
      if (!effect) return null;
      const {
        attackRolls: _attackRolls,
        damageRolls: _damageRolls,
        castRollContext: _castRollContext,
        ...persistable
      } = effect;
      return persistable;
    }

    async resolveActivationDecisions(effect, casterAttributeContext = {}) {
      let resolvedEffect = effect;
      if (window.PFEffectMechanics?.hasContributionOptions?.(resolvedEffect)) {
        resolvedEffect = await window.PFEffectMechanics.chooseContributions(
          resolvedEffect,
          { title: resolvedEffect.name || "Effect" },
        );
        if (!resolvedEffect) return null;
        if (
          window.PFEffectActivationOrchestrator?.targetMustAnswer?.(
            resolvedEffect,
          )
        )
          return resolvedEffect;
      }
      if (window.PFEffectMechanics?.hasBranches?.(resolvedEffect)) {
        resolvedEffect = await window.PFEffectMechanics.chooseBranch(
          resolvedEffect,
          { title: resolvedEffect.name || "Effect" },
        );
        if (!resolvedEffect) return null;
        if (
          window.PFEffectActivationOrchestrator?.targetMustAnswer?.(
            resolvedEffect,
          )
        )
          return resolvedEffect;
      }
      if (window.PFSummonCreatures?.hasPendingChoice?.(resolvedEffect)) {
        resolvedEffect = await window.PFSummonCreatures.resolveChoices(
          resolvedEffect,
          { title: resolvedEffect.name || "Effect" },
        );
        if (!resolvedEffect) return null;
      }
      const choiceResolvedBonuses = await this.resolveChoiceStats(
        resolvedEffect.bonuses,
        resolvedEffect,
      );
      if (choiceResolvedBonuses === null) return null;
      const resolvedBonuses = await this.resolveFavoredEnemyScaleTargets(
        choiceResolvedBonuses,
        resolvedEffect,
      );
      if (resolvedBonuses === null) return null;
      const resolvedClassSkillGrants = await this.resolveChoiceStats(
        resolvedEffect.classSkillGrants,
        resolvedEffect,
      );
      if (resolvedClassSkillGrants === null) return null;
      const resolvedUseUntrained = await this.resolveChoiceStats(
        resolvedEffect.useUntrained,
        resolvedEffect,
      );
      if (resolvedUseUntrained === null) return null;
      const resolvedBonusRanks = await this.resolveChoiceStats(
        resolvedEffect.bonusRanks,
        resolvedEffect,
      );
      if (resolvedBonusRanks === null) return null;
      const resolvedWeaponExtraDamage = await this.resolveChoiceStats(
        resolvedEffect.weaponExtraDamage,
        resolvedEffect,
      );
      if (resolvedWeaponExtraDamage === null) return null;
      const resolvedAttributeContributions = await this.resolveChoiceStats(
        resolvedEffect.attributeContributions,
        resolvedEffect,
      );
      if (resolvedAttributeContributions === null) return null;
      const resolvedSpellLikeAbilities =
        await this.resolveSpellLikeAbilityChoices(
          resolvedEffect.spellLikeAbilities,
          resolvedEffect,
        );
      if (resolvedSpellLikeAbilities === null) return null;
      const resolvedCasterLevelBonuses = await this.resolveSpellAdjustmentChoices(
        resolvedEffect.casterLevelBonuses,
        resolvedEffect,
      );
      if (resolvedCasterLevelBonuses === null) return null;
      const resolvedSpellDcBonuses = await this.resolveSpellAdjustmentChoices(
        resolvedEffect.spellDcBonuses,
        resolvedEffect,
      );
      if (resolvedSpellDcBonuses === null) return null;
      const resolvedEffectiveAttributeBonuses =
        await this.resolveSpellAdjustmentChoices(
          resolvedEffect.effectiveAttributeBonuses,
          resolvedEffect,
        );
      if (resolvedEffectiveAttributeBonuses === null) return null;
      const resolvedGrantDomains = await this.resolveGrantDomainChoices(
        resolvedEffect.grantDomains,
        resolvedEffect,
      );
      if (resolvedGrantDomains === null) return null;
      const resolvedChoicePools = await this.resolveChoicePools(resolvedEffect);
      if (resolvedChoicePools === null) return null;
      const { choicePools, pools, poolChoices, ...choiceResolvedEffect } =
        resolvedEffect;
      const activeEffect = {
        ...choiceResolvedEffect,
        bonuses: resolvedBonuses,
        ...(resolvedClassSkillGrants.length
          ? { classSkillGrants: resolvedClassSkillGrants }
          : {}),
        ...(resolvedUseUntrained.length
          ? { useUntrained: resolvedUseUntrained }
          : {}),
        ...(resolvedBonusRanks.length
          ? { bonusRanks: resolvedBonusRanks }
          : {}),
        ...(resolvedWeaponExtraDamage.length
          ? { weaponExtraDamage: resolvedWeaponExtraDamage }
          : {}),
        ...(resolvedAttributeContributions.length
          ? { attributeContributions: resolvedAttributeContributions }
          : {}),
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
        ...(resolvedGrantDomains.length
          ? { grantDomains: resolvedGrantDomains }
          : {}),
      };
      this.appendChoicePoolMechanics(
        activeEffect,
        resolvedChoicePools.mechanics || {},
      );
      const variableResolvedEffect =
        await this.resolveConditionalVariables(activeEffect);
      if (variableResolvedEffect === null) return null;
      const abilityResolvedEffect =
        await window.PFConditionConfig?.resolveAbilityChoices?.(
          variableResolvedEffect,
          { title: variableResolvedEffect.name || "Effect" },
        );
      if (!abilityResolvedEffect) return null;
      return (
        window.PFEffectMechanics?.resolveCasterAttributeScales?.(
          abilityResolvedEffect,
          casterAttributeContext,
        ) || abilityResolvedEffect
      );
    }

    async persistActivationEffect(
      finalizedEffect,
      selection = {},
      casterLevel = 1,
      casterContext = {},
    ) {
      const separated = window.PFEffectMechanics?.separateIndependentEffects?.(
        finalizedEffect,
      ) || { parent: finalizedEffect, children: [] };
      const candidates = [];
      if (hasPersistentEffectMechanics(separated.parent))
        candidates.push(separated.parent);
      for (const child of separated.children) {
        const resolved = await this.resolveIndependentEffect(
          child,
          finalizedEffect,
          casterLevel,
          casterContext,
        );
        if (resolved && hasPersistentEffectMechanics(resolved))
          candidates.push(resolved);
      }
      const activeEffects = [];
      for (let candidate of candidates) {
        await this.options.onHealingApply?.(candidate);
        const restoration = window.PFConditionConfig?.applyRestorations?.(
          this.active,
          candidate,
        );
        if (restoration) {
          this.active = restoration.activeEffects;
          candidate = restoration.effect;
        }
        if (!hasPersistentEffectMechanics(candidate)) continue;
        activeEffects.push(...(await this.expandAppliedConditions(candidate)));
      }
      if (!activeEffects.length) {
        this.renderActive();
        this.notifyChange({ collectionChanged: true });
        this.queueSave();
        this.finishPicker();
        return true;
      }
      let persistedEffects = activeEffects;
      if (selection.runtime && typeof selection.runtime === "object") {
        persistedEffects = activeEffects.map((nextEffect) => ({
          ...nextEffect,
          ...selection.runtime,
          selectedBranchId: nextEffect.selectedBranchId,
          selectedBranchName: nextEffect.selectedBranchName,
          branchSource: nextEffect.branchSource,
        }));
      }
      if (Number.isInteger(selection.replaceIndex)) {
        this.active.splice(selection.replaceIndex, 1, ...persistedEffects);
      } else {
        if (finalizedEffect.activationGroup) {
          const sourceId = String(finalizedEffect.activationSourceId || "");
          this.active = this.active.filter(
            (existing) =>
              !(
                existing.activationGroup === finalizedEffect.activationGroup &&
                String(existing.activationSourceId || "") === sourceId
              ),
          );
        }
        for (const nextEffect of persistedEffects) {
          await this.addActiveEffectWithFearEscalation(nextEffect);
        }
      }
      this.showActiveEffectCategory(persistedEffects[0] || finalizedEffect);
      this.renderActive();
      this.notifyChange({ collectionChanged: true });
      this.queueSave();
      this.finishPicker();
      return true;
    }

    async addEffectDefinition(effect, selection = {}) {
      const index = selection.index;
      if (!effect || !this.options.characterId) return;
      const casterLevel = Math.max(
        1,
        Number(selection.casterLevel) ||
          Number.parseInt(document.getElementById(`${this.prefix}Cl${index}`)?.value, 10) ||
          1,
      );
      const turns = Math.max(
        1,
        Number(selection.turns) ||
          Number.parseInt(document.getElementById(`${this.prefix}Turns${index}`)?.value, 10) ||
          1,
      );
      const permanent = Boolean(selection.permanent);
      const trackedTurns = conditionUsesTurns(effect);
      const spellCalculations = effect.spellCalculations || null;
      const baseAttributeContext =
        effect.attributeScaleContext || effect.abilityContext || {};
      const casterAttributeContext = {
        ...baseAttributeContext,
        castingAbility:
          spellCalculations?.castingAbility ||
          baseAttributeContext.castingAbility ||
          "",
        castingAbilityMod: Number(
          spellCalculations?.castingAbilityMod ??
            baseAttributeContext.castingAbilityMod ??
            0,
        ),
        spellCalculations,
      };
      const durationArg = {
        ...casterAttributeContext,
        ...(effect.fromAbility ? effect.abilityContext || {} : {}),
        casterLevel,
      };
      const baseDurationLabel = durationLabel(effect);
      const calculatedDuration = trackedTurns
        ? turns
        : parseDuration(effect, durationArg);
      const appliedDurationLabel = permanent
        ? "Permanent"
        : trackedTurns
          ? `${turns} turn${turns === 1 ? "" : "s"}`
          : calculatedDuration === null
            ? baseDurationLabel
            : effect.fromAbility
              ? `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`
              : durationUsesCasterLevel(effect)
                ? `${baseDurationLabel} | CL ${casterLevel}: ${formatDurationRounds(calculatedDuration)}`
                : `${baseDurationLabel} | ${formatDurationRounds(calculatedDuration)}`;

      // fromAbility/abilityContext are only there to drive duration/choice
      // resolution -- strip them so the saved active-effect entry matches
      // the normal buff shape instead of carrying the character's whole
      // stat block. Every duration/CL/turns/permanent decision is baked
      // in here, BEFORE the choice is resolved, so a request sent to
      // another player (see requestEffectChoice) only ever needs them to
      // answer "which skill/target", never redo any of this.
      const {
        fromAbility,
        abilityContext,
        attributeScaleContext,
        spellCalculations: _spellCalculations,
        ...persistedEffect
      } = effect;
      let finalizedEffect = {
        ...persistedEffect,
        casterLevel: fromAbility
          ? abilityContext?.characterLevel || casterLevel
          : casterLevel,
        ...(fromAbility && abilityContext?.classLevels
          ? { classLevels: { ...abilityContext.classLevels } }
          : {}),
        turns: trackedTurns ? turns : undefined,
        permanent,
        remaining: permanent ? null : calculatedDuration,
        computedDuration: calculatedDuration,
        durationLabel: appliedDurationLabel,
        ...(persistedEffect.activationGroup
          ? {
              activationSourceId:
                selection.activationSourceId ||
                selection.runtime?.sourceTokenId ||
                persistedEffect.activationSourceId ||
                this.options.characterId,
            }
          : {}),
      };
      finalizedEffect =
        window.PFEffectMechanics?.resolveCasterAttributeScales?.(
          finalizedEffect,
          casterAttributeContext,
        ) || finalizedEffect;
      let applicationCommitted = false;
      const commitApplication = async () => {
        if (applicationCommitted || Number.isInteger(selection.replaceIndex))
          return true;
        const result = await this.options.onBeforeApply?.(finalizedEffect, {
          replaceIndex: selection.replaceIndex,
        });
        if (result === false) return false;
        if (result && typeof result === "object")
          finalizedEffect = { ...finalizedEffect, ...result };
        applicationCommitted = true;
        return true;
      };

      const orchestrator = window.PFEffectActivationOrchestrator;
      const activation = await orchestrator.run(
        {
          sourceType: activeEffectTab(finalizedEffect),
          surface: "effect-tracker",
          effect: finalizedEffect,
        },
        {
          "caster-decisions": async (state) => {
            if (orchestrator.targetMustAnswer(state.effect)) return state;
            const resolved = await this.resolveActivationDecisions(
              state.effect,
              casterAttributeContext,
            );
            return resolved ? { ...state, effect: resolved } : null;
          },
          "resource-allocation": async (state) => state,
          "aura-delivery": async (state) => {
            if (!window.PFAuraDeliveryChoice?.needsChoice?.(state.effect))
              return state;
            const resolved = await window.PFAuraDeliveryChoice.choose(
              state.effect,
            );
            return resolved ? { ...state, effect: resolved } : null;
          },
          targeting: async (state) => {
            const targetedAura = Boolean(
              state.effect.auraConfig?.enabled &&
                state.effect.auraConfig?.targetsEmitAura &&
                typeof this.options.onTargetedAuraActivate === "function",
            );
            return {
              ...state,
              targetedAura,
              auraRecipientEffect:
                state.effect.auraConfig?.enabled && !targetedAura
                  ? JSON.parse(JSON.stringify(state.effect))
                  : null,
            };
          },
          "target-decisions": async (state) => {
            if (state.targetedAura) return state;
            if (!orchestrator.targetMustAnswer(state.effect)) return state;
            const resolved =
              this.options.isOwnCharacter === false &&
              !Number.isInteger(selection.replaceIndex)
                ? await this.requestEffectChoice(state.effect)
                : await this.resolveActivationDecisions(
                    state.effect,
                    casterAttributeContext,
                  );
            return resolved ? { ...state, effect: resolved } : null;
          },
          "saving-throws": async (state) => {
            if (
              state.targetedAura ||
              Number.isInteger(selection.replaceIndex) ||
              !window.PFEffectSaves?.hasImmediateSave?.(state.effect)
            )
              return state;
            const resolved = await window.PFEffectSaves.resolve(state.effect, {
              sheet:
                window.PFCharacterSheetBridge?.currentSheetSnapshot?.() || {},
              title: state.effect.name || "Effect",
              targetName: "This character",
            });
            return resolved ? { ...state, effect: resolved } : null;
          },
          "attack-confirmation": async (state) => {
            if (state.targetedAura || Number.isInteger(selection.replaceIndex))
              return state;
            const resolved = await this.resolveAttackRolls(
              state.effect,
              casterLevel,
              casterAttributeContext,
            );
            return resolved ? { ...state, effect: resolved } : null;
          },
          "effect-rolls": async (state) => {
            if (state.targetedAura || Number.isInteger(selection.replaceIndex))
              return state;
            let resolved = await this.resolveDamageRolls(
              state.effect,
              casterLevel,
              casterAttributeContext,
            );
            if (!resolved) return null;
            resolved = await this.resolveConditionAdjustments(
              resolved,
              casterLevel,
              casterAttributeContext,
            );
            if (!resolved) return null;
            resolved = await this.resolveHealingRolls(
              resolved,
              casterLevel,
              casterAttributeContext,
            );
            return resolved ? { ...state, effect: resolved } : null;
          },
          application: async (state) => {
            finalizedEffect = state.effect;
            if (state.targetedAura) {
              const result = await this.options.onTargetedAuraActivate(
                finalizedEffect,
                { beforeApply: commitApplication },
              );
              if (result) this.finishPicker();
              return result ? { ...state, applied: true } : null;
            }
            if (
              Array.isArray(finalizedEffect.summonCreatures) &&
              finalizedEffect.summonCreatures.length &&
              typeof this.options.onSummonCreatures === "function"
            ) {
              if (!(await commitApplication())) return null;
              const summoned = await this.options.onSummonCreatures(finalizedEffect);
              if (!summoned) return null;
              finalizedEffect = { ...finalizedEffect, summonCreatures: [] };
            }
            if (!hasPersistentEffectMechanics(finalizedEffect)) {
              this.finishPicker();
              return { ...state, applied: true };
            }
            if (
              finalizedEffect.auraConfig?.enabled &&
              typeof this.options.onAuraActivate === "function"
            ) {
              if (!(await commitApplication())) return null;
              const result = await this.options.onAuraActivate(finalizedEffect, {
                recipientEffect: state.auraRecipientEffect || finalizedEffect,
              });
              const controller =
                result?.controller || (result?.auraController ? result : null);
              if (controller) {
                this.active = window.PFEffectMechanics?.upsertAuraController
                  ? window.PFEffectMechanics.upsertAuraController(
                      this.active,
                      controller,
                      controller.durationAnchorTokenId || "",
                    )
                  : [...this.active, controller];
                this.showActiveEffectCategory(controller);
                this.renderActive();
                this.notifyChange({ collectionChanged: true });
                this.queueSave();
              }
              if (result) this.finishPicker();
              return result ? { ...state, applied: true } : null;
            }
            if (!(await commitApplication())) return null;
            return (await this.persistActivationEffect(
              finalizedEffect,
              selection,
              casterLevel,
              casterAttributeContext,
            ))
              ? { ...state, effect: finalizedEffect, applied: true }
              : null;
          },
        },
      );
      return activation;

    }

    // Pause this activation while the target answers on their own device,
    // then return the resolved effect to the caster-owned pipeline.
    async requestEffectChoice(finalizedEffect) {
      const status = document.getElementById(`${this.prefix}RequestStatus`);
      if (status) {
        status.textContent = "Sending choice to the player...";
        status.classList.remove("d-none", "text-danger");
      }
      const orchestrator = window.PFEffectActivationOrchestrator;
      const result = await orchestrator?.waitForRemoteDecision?.({
        createRequest: window.PFApp?.createEffectChoiceRequest,
        loadStatus: window.PFApp?.loadEffectChoiceRequestStatus,
        request: {
          contextKey: this.options.contextKey,
          characterId: this.options.characterId,
          ability: orchestrator.remoteDecisionAbility(finalizedEffect, {
            surface: "effect-tracker",
            sourceType:
              finalizedEffect.sourceType ||
              finalizedEffect.type ||
              finalizedEffect.category ||
              "other",
          }),
        },
        onStatus: (nextStatus) => {
          if (!status) return;
          if (nextStatus === "pending")
            status.textContent = `Sent "${finalizedEffect.name || "effect"}" to the player -- waiting for them to choose.`;
          if (nextStatus === "resolved")
            status.textContent = `The player completed the choices for "${finalizedEffect.name || "effect"}."`;
        },
      });
      if (!result?.ok) {
        if (status) {
          status.textContent =
            "Couldn't send this to the player -- try again.";
          status.classList.add("text-danger");
        }
        return null;
      }
      return result.effect;
    }

    // Polls the request this widget just sent so "waiting for player"
    // resolves into an actual active effect without the requester having
    // to do anything else -- caps out after ~30 minutes so a forgotten
    // request doesn't poll forever.
    watchEffectChoiceRequest(requestId, finalizedEffect, attempt = 0) {
      this._watchedRequests = this._watchedRequests || new Set();
      if (this._watchedRequests.has(requestId) || attempt > 300) return;
      const poll = async () => {
        if (this._watchedRequests.has(requestId)) return;
        const result = await window.PFApp?.loadEffectChoiceRequestStatus?.(
          requestId,
        );
        if (!result || result.status === "pending") {
          this._pollTimer = setTimeout(
            () =>
              this.watchEffectChoiceRequest(
                requestId,
                finalizedEffect,
                attempt + 1,
              ),
            6000,
          );
          return;
        }
        this._watchedRequests.add(requestId);
        const status = document.getElementById(`${this.prefix}RequestStatus`);
        if (result.status === "resolved") {
          const saved = this.options.loadActiveEffects
            ? await this.options.loadActiveEffects()
            : await PFApp.loadBuffState(
                this.options.contextKey,
                this.options.characterId,
              );
          this.active = Array.isArray(saved) ? saved : saved?.buffs || [];
          this.showActiveEffectCategory(finalizedEffect);
          this.renderActive();
          this.notifyChange({ collectionChanged: true });
          if (status)
            status.textContent = `"${finalizedEffect.name || "Effect"}" applied -- the player completed their choices.`;
        } else if (status) {
          status.textContent = `"${finalizedEffect.name || "Effect"}" request was cancelled.`;
        }
        if (status) setTimeout(() => status.classList.add("d-none"), 8000);
      };
      poll();
    }

    async reselectBranch(index) {
      const current = this.active[index];
      const source = window.PFEffectMechanics?.branchSource?.(current);
      if (!source) return;
      await this.addEffectDefinition(source, {
        casterLevel: current.casterLevel || 1,
        turns: current.turns || 1,
        permanent: Boolean(current.permanent),
        replaceIndex: index,
        runtime: {
          casterLevel: current.casterLevel,
          turns: current.turns,
          permanent: current.permanent,
          remaining: current.remaining,
          computedDuration: current.computedDuration,
          durationLabel: current.durationLabel,
        },
      });
    }

    removeEffect(index) {
      if (isItemSourcedEffect(this.active[index])) return;
      this.active.splice(index, 1);
      this.renderActive();
      this.notifyChange({ collectionChanged: true });
      this.queueSave();
    }

    updateAdjustableCondition(index, amount) {
      const effect = this.active[index];
      const config = effect?.adjustableCondition;
      if (!effect || !config) return;
      const minimum = Math.max(0, Number(config.minimum || 0));
      const nextAmount = Math.max(minimum, Math.floor(Number(amount) || 0));
      this.active[index] = window.PFConditionConfig?.updateAmount
        ? window.PFConditionConfig.updateAmount(effect, nextAmount)
        : { ...effect, adjustableCondition: { ...config, amount: nextAmount } };
      this.renderActive();
      this.notifyChange();
      this.queueSave();
    }

    activeAdjustmentControls(effect, index) {
      const canReselect = window.PFEffectMechanics?.canReselectBranch?.(effect);
      const adjustable = effect.adjustableCondition || null;
      if (!canReselect && !adjustable) return "";
      return `
        <div class="effect-active-adjustments">
          ${canReselect ? `<button class="btn btn-outline-info btn-sm" type="button" data-reselect-branch="${index}">Change ${escapeHtml(effect.selectedBranchName || "Option")}</button>` : ""}
          ${
            adjustable
              ? `<div class="effect-adjustable-control">
                  <span class="small effect-adjustable-label">${escapeHtml(adjustable.label || "Amount")}</span>
                  <input class="form-control form-control-sm text-center" type="number" inputmode="numeric" min="${Math.max(0, Number(adjustable.minimum || 0))}" value="${Math.max(0, Number(adjustable.amount || 0))}" data-active-adjustment="${index}" aria-label="${escapeHtml(adjustable.label || "Amount")}">
                </div>`
              : ""
          }
        </div>
      `;
    }

    renderActive() {
      if (!this.activeEl) return;
      if (!this.options.characterId) {
        this.activeEl.innerHTML = `<div class="small-text">No character selected. Create or select a character to add effects.</div>`;
        return;
      }

      if (!ACTIVE_EFFECT_TABS.some((tab) => tab.key === this.activeTypeFilter))
        this.activeTypeFilter = ACTIVE_EFFECT_TABS[0].key;
      const visiblePassives = this.passiveEffects.filter((passive) => {
        const passiveLootId = passive.sourceLootId || passive.source_loot_id;
        return !passiveLootId || !this.active.some(
          (active) =>
            String(active.sourceLootId || active.source_loot_id || "") ===
            String(passiveLootId),
        );
      });
      const activeRows = [
        ...this.active.map((effect, index) => ({ effect, index, passive: false })),
        ...visiblePassives.map((effect, index) => ({ effect, index, passive: true })),
      ];
      const filteredActive = activeRows
        .filter((row) =>
          activeEffectVisibleInTab(row.effect, this.activeTypeFilter),
        );
      sortActiveRows(filteredActive);

      const navigation = `
        <nav class="nav effect-active-nav" aria-label="Active effect types" role="tablist">
          ${ACTIVE_EFFECT_TABS.map(
            (tab) => `
              <button
                class="nav-link${this.activeTypeFilter === tab.key ? " active" : ""}"
                type="button"
                data-active-effect-tab="${tab.key}"
                role="tab"
                aria-selected="${this.activeTypeFilter === tab.key ? "true" : "false"}"
              >${tab.label}</button>
            `,
          ).join("")}
        </nav>
      `;

      if (!activeRows.length) {
        this.activeEl.innerHTML = `${navigation}<div class="small-text">No active effects.</div>`;
        this.bindActiveTabs();
        return;
      }
      if (!filteredActive.length) {
        const activeTab = ACTIVE_EFFECT_TABS.find(
          (tab) => tab.key === this.activeTypeFilter,
        );
        this.activeEl.innerHTML = `${navigation}<div class="small-text">No ${escapeHtml(activeTab?.label || "matching")} effects.</div>`;
        this.bindActiveTabs();
        return;
      }

      const renderRow = ({ effect, index, passive }) => {
        const detailsId = `${this.prefix}${passive ? "Passive" : ""}Details${index}`;
        const detailLines = [
          ...(effect.bonuses || []).map(bonusText),
          ...(effect.damageReduction || []).map(
            (dr) =>
              `DR ${Number(dr.amount || 0)}/${String(dr.overcomeType || "").trim() || "-"}`,
          ),
          ...(effect.spellResistance || []).map(
            (sr) =>
              `SR ${Number(sr.amount || 0)}${sr.conditional ? ` (${sr.appliesWhen || "conditional"})` : ""}`,
          ),
          ...(effect.immunities || []).map(immunityText),
          ...(effect.applyConditions || []).map(applyConditionText),
          ...(effect.classSkillGrants || []).map((grant) =>
            window.PFEffectEditor.classSkillGrantText(grant, titleCaseStat),
          ),
          ...(effect.useUntrained || []).map((entry) =>
            window.PFEffectEditor.useUntrainedText(entry),
          ),
          ...(effect.bonusRanks || []).map((entry) =>
            window.PFEffectEditor.bonusRanksText(entry),
          ),
          ...(effect.extraRanksPerLevel || []).map(extraRanksPerLevelText),
          ...(effect.featGrants || []).map(featGrantText),
          ...(effect.spellLikeAbilities || []).map(spellLikeText),
          ...(effect.casterLevelBonuses || []).map(casterLevelBonusText),
          ...(effect.spellDcBonuses || []).map(spellDcBonusText),
          ...(effect.effectiveAttributeBonuses || []).map(
            effectiveAttributeBonusText,
          ),
          ...(effect.grantDomains || []).map(grantDomainText),
          ...(effect.generatedEquipment || []).map(
            (item) =>
              `Generates ${item.type || "equipment"}: ${
                item.name || item.item || "Generated item"
              }`,
          ),
          ...(effect.weaponDamageSizeChanges || []).map(
            weaponDamageSizeText,
          ),
        ];
        const bonuses = detailLines
          .map((text) => `<div class="small-text">${escapeHtml(text)}</div>`)
          .join("");
        const locked = passive || isItemSourcedEffect(effect);
        return `
          <article class="effect-tracker-active">
            <div class="effect-active-head">
              <div>
                <strong>${escapeHtml(activeEffectTitle(effect, this.activeTypeFilter))}</strong>
                <div class="small-text">${escapeHtml(activeDuration(effect))}</div>
                ${passive ? "" : this.activeAdjustmentControls(effect, index)}
              </div>
              <div class="effect-active-actions">
                <button class="btn btn-outline-info btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#${detailsId}" aria-label="Show effect details">i</button>
                ${locked ? "" : `<button class="btn btn-danger btn-sm" type="button" data-remove-effect="${index}" aria-label="Remove effect"><i class="bi bi-trash"></i></button>`}
              </div>
            </div>
            <div id="${detailsId}" class="collapse mt-2">${bonuses || '<div class="small-text">No mechanical bonuses listed.</div>'}</div>
          </article>
        `;
      };
      this.activeEl.innerHTML =
        navigation + filteredActive.map(renderRow).join("");

      this.activeEl
        .querySelectorAll("[data-reselect-branch]")
        .forEach((button) => {
          button.addEventListener("click", () =>
            this.reselectBranch(Number(button.dataset.reselectBranch)),
          );
        });
      this.activeEl
        .querySelectorAll("[data-remove-effect]")
        .forEach((button) => {
          button.addEventListener("click", () =>
            this.removeEffect(Number(button.dataset.removeEffect)),
          );
        });
      this.activeEl
        .querySelectorAll("[data-active-adjustment]")
        .forEach((input) => {
          input.addEventListener("change", () => {
            this.updateAdjustableCondition(
              Number(input.dataset.activeAdjustment),
              input.value,
            );
          });
        });
      this.bindActiveTabs();
    }

    bindActiveTabs() {
      this.activeEl
        ?.querySelectorAll("[data-active-effect-tab]")
        .forEach((button) => {
          button.addEventListener("click", () => {
            this.activeTypeFilter = button.dataset.activeEffectTab || "spell";
            this.renderActive();
          });
        });
    }

    queueSave() {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(async () => {
        if (this.options.saveActiveEffects) {
          await this.options.saveActiveEffects([...this.active]);
        } else {
          await PFApp.saveBuffState(
            this.active,
            this.options.contextKey,
            this.options.characterId,
          );
          stamp(this.options.contextKey, this.options.characterId);
        }
      }, 250);
    }

    notifyChange(change = {}) {
      this.options.onChange?.([...this.active], change);
    }
  }

  window.PFEffectTracker = {
    sourceGroup: effectSourceGroup,
    activeTitle: activeEffectTitle,
    shouldResetPickerCache,
    preferOwnedPickerEffects,
    browser: {
      groups: EFFECT_BROWSER_GROUPS.map(([value, label]) => ({ value, label })),
      prepare: injectStyles,
      navHtml: effectBrowserNavHtml,
      controlsHtml: effectBrowserControlsHtml,
      rowHtml: effectBrowserRowHtml,
      spellsHtml: effectBrowserSpellsHtml,
      loadingHtml: effectBrowserLoadingHtml,
      searchText,
    },
    prepareLoading(container) {
      if (!container) return;
      injectStyles();
      container.innerHTML = trackerLoadingHtml();
    },
    mount(container, options) {
      const tracker = new EffectTracker(container, options);
      tracker.ready = tracker.mount();
      return tracker;
    },
  };
})();
