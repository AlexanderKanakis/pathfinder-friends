// Player-side half of the cross-device choice flow: a GM applying a
// choice-needing effect to a character they don't own (buff-tracker-
// widget.js's requestEffectChoice) queues a row in
// effect_choice_requests instead of picking for that player. This
// module polls for pending requests against every character the current
// user controls and lets them answer -- on whatever device/session they
// happen to have open -- without the requester ever seeing the picker.
//
// Handles a user controlling multiple characters the same way it
// handles one: every pending request for every character they control
// shows up in the same panel, answered one at a time.
(function () {
  const PANEL_ID = "pendingEffectChoicesPanel";
  let pollTimer = null;
  let pollOptions = null;
  const resolving = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function ensureStyle() {
    if (document.getElementById("pendingEffectChoicesStyles")) return;
    const style = document.createElement("style");
    style.id = "pendingEffectChoicesStyles";
    style.textContent = `
      .pending-effect-choices-panel {
        position: fixed;
        top: 70px;
        right: 16px;
        z-index: 1080;
        width: min(320px, calc(100vw - 32px));
        background: #1c1c1c;
        border: 1px solid #444;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        overflow: hidden;
      }
      .pending-effect-choices-header {
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 600;
        background: #242424;
        border-bottom: 1px solid #333;
        color: #f5e9c8;
      }
      .pending-effect-choices-list {
        max-height: 260px;
        overflow-y: auto;
      }
      .pending-effect-choices-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid #2c2c2c;
      }
      .pending-effect-choices-row:last-child {
        border-bottom: none;
      }
      .pending-effect-choices-name {
        color: #fff;
        font-weight: 600;
        font-size: 13px;
      }
      .pending-effect-choices-source {
        color: #aaa;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    ensureStyle();
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "pending-effect-choices-panel d-none";
    document.body.appendChild(panel);
    return panel;
  }

  function renderPanel(requests) {
    const panel = ensurePanel();
    if (!requests.length) {
      panel.classList.add("d-none");
      panel.innerHTML = "";
      return;
    }
    panel.classList.remove("d-none");
    panel.innerHTML = `
      <div class="pending-effect-choices-header">
        <i class="bi bi-magic"></i> ${requests.length} effect${requests.length === 1 ? "" : "s"} waiting for your choice
      </div>
      <div class="pending-effect-choices-list">
        ${requests
          .map(
            (request) => `
          <div class="pending-effect-choices-row">
            <div>
              <div class="pending-effect-choices-name">${escapeHtml(request.effect_name || "Effect")}</div>
              ${request.characterName ? `<div class="pending-effect-choices-source">for ${escapeHtml(request.characterName)}</div>` : ""}
            </div>
            <button class="btn btn-info btn-sm" type="button" data-resolve-request="${escapeHtml(request.id)}">Choose</button>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
    panel.querySelectorAll("[data-resolve-request]").forEach((button) => {
      button.addEventListener("click", () => {
        const request = requests.find(
          (item) => item.id === button.dataset.resolveRequest,
        );
        if (request) resolveRequest(request);
      });
    });
  }

  // Walks every "choice:" stat in a list of stat-bearing items (an
  // ability's bonuses, or its classSkillGrants -- both carry the same
  // { stat, skillName? } shape) the same way buff-tracker-widget.js's
  // resolveChoiceStats does. Returns the resolved list, or null if a
  // pick was cancelled.
  async function resolveChoiceStats(items, request) {
    const list = Array.isArray(items) ? items : [];
    const resolved = [];
    for (const item of list) {
      if (!window.PFEffectStats?.isChoiceStat(item.stat)) {
        resolved.push(item);
        continue;
      }
      const poolId = window.PFEffectStats.choicePoolIdFromStat(item.stat);
      const pool = window.PFEffectStats.poolById(poolId);
      const options = await window.PFEffectStats.resolveChoicePoolOptions(
        poolId,
        { skills: pollOptions?.choicePoolSkillsFor?.(request.character_id) },
      );
      const picked = window.PFEffectChoicePicker
        ? await window.PFEffectChoicePicker.open({
            title: `${request.effect_name || "Effect"}${request.characterName ? ` (${request.characterName})` : ""}: Choose ${pool?.label || "a Target"}`,
            options,
          })
        : null;
      if (!picked) return null;
      resolved.push({ ...item, stat: picked });
    }
    return resolved;
  }

  // Then saves the finished effect straight into that character's own
  // buff state and marks the request resolved. Cancelling a pick leaves
  // the request pending (nothing saved) so it just reappears next poll.
  async function resolveRequest(request) {
    if (resolving.has(request.id)) return;
    resolving.add(request.id);
    try {
      const ability = request.ability || {};
      const resolved = await resolveChoiceStats(ability.bonuses, request);
      if (resolved === null) return;
      const resolvedClassSkillGrants = await resolveChoiceStats(
        ability.classSkillGrants,
        request,
      );
      if (resolvedClassSkillGrants === null) return;

      const finalized = {
        ...ability,
        bonuses: resolved,
        ...(resolvedClassSkillGrants.length
          ? { classSkillGrants: resolvedClassSkillGrants }
          : {}),
      };
      const existing = await window.PFApp.loadBuffState(
        pollOptions.contextKey,
        request.character_id,
      );
      const nextBuffs = [...(Array.isArray(existing) ? existing : []), finalized];
      const saved = await window.PFApp.saveBuffState(
        nextBuffs,
        pollOptions.contextKey,
        request.character_id,
      );
      if (!saved?.ok) {
        alert("Could not save your choice -- try again.");
        return;
      }
      await window.PFApp.resolveEffectChoiceRequest(request.id, resolved);
      pollOptions?.onResolved?.(request.character_id, finalized);
    } finally {
      resolving.delete(request.id);
      poll();
    }
  }

  async function poll() {
    if (!pollOptions) return;
    const characterIds = pollOptions.characterIds?.() || [];
    const requests =
      (await window.PFApp?.loadPendingEffectChoiceRequests?.(characterIds)) ||
      [];
    const withNames = requests
      .filter((request) => !resolving.has(request.id))
      .map((request) => ({
        ...request,
        characterName: pollOptions.characterNameFor?.(request.character_id) || "",
      }));
    renderPanel(withNames);
  }

  // options: {
  //   contextKey,
  //   characterIds: () => string[] -- every character the current user
  //     controls, re-evaluated each poll so it stays correct if that
  //     changes mid-session,
  //   characterNameFor: (id) => string,
  //   choicePoolSkillsFor: (id) => [[name, ability], ...] (optional),
  //   onResolved: (characterId, finalizedEffect) -- called after a
  //     choice is saved, so the page can refresh anything showing that
  //     character's active effects,
  //   intervalMs (optional, default 12000),
  // }
  function start(options = {}) {
    stop();
    pollOptions = options;
    const loop = async () => {
      await poll();
      pollTimer = setTimeout(loop, options.intervalMs || 12000);
    };
    loop();
  }

  function stop() {
    clearTimeout(pollTimer);
    pollTimer = null;
    pollOptions = null;
    document.getElementById(PANEL_ID)?.remove();
  }

  window.PFPendingEffectChoices = { start, stop };
})();
