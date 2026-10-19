(function (root, factory) {
  const api = factory(root);
  if (root) root.PFEffectActivationOrchestrator = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const decisions =
    root?.PFEffectDecisions ||
    (typeof require === "function" ? require("./effect-decisions.js") : null);
  const BEFORE_TARGETS = "before-targets";
  const AFTER_TARGETS = "after-targets";
  const REMOTE_DECISION_MODE = "decision-only";
  const REMOTE_SAVE_MODE = "save-only";

  const nodes = Object.freeze([
    { id: "arcane-spell-failure", owner: "caster", sourceTypes: ["spell"] },
    { id: "caster-decisions", owner: "caster" },
    { id: "resource-allocation", owner: "caster" },
    { id: "aura-delivery", owner: "caster" },
    { id: "targeting", owner: "caster" },
    { id: "attack-targeting", owner: "caster" },
    { id: "target-decisions", owner: "target" },
    { id: "attack-confirmation", owner: "caster" },
    { id: "saving-throws", owner: "target" },
    { id: "effect-rolls", owner: "caster" },
    { id: "application", owner: "system" },
  ]);
  const nodeById = new Map(
    nodes.map((node, index) => [node.id, { ...node, index }]),
  );

  function activationId() {
    return (
      root?.crypto?.randomUUID?.() ||
      `activation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    );
  }

  function createState(input = {}) {
    if (input.activationId)
      return {
        ...input,
        activationHistory: Array.isArray(input.activationHistory)
          ? input.activationHistory
          : [],
      };
    return {
      ...input,
      activationId: activationId(),
      activationStatus: "ready",
      activationNode: "",
      activationHistory: Array.isArray(input.activationHistory)
        ? [...input.activationHistory]
        : [],
    };
  }

  function decisionStage(effect = {}) {
    return decisions?.decisionOwner?.(effect) === decisions?.TARGET
      ? AFTER_TARGETS
      : BEFORE_TARGETS;
  }

  function shouldResolve(effect = {}, stage = BEFORE_TARGETS) {
    return Boolean(
      decisions?.hasDecision?.(effect) && decisionStage(effect) === stage,
    );
  }

  function targetMustAnswer(effect = {}) {
    return shouldResolve(effect, AFTER_TARGETS);
  }

  function planFor(state = {}, options = {}) {
    const requested = Array.isArray(options.nodeIds)
      ? new Set(options.nodeIds)
      : null;
    const sourceType = String(state.sourceType || "").toLowerCase();
    return nodes.filter((node) => {
      if (requested && !requested.has(node.id)) return false;
      if (node.sourceTypes?.length && !node.sourceTypes.includes(sourceType))
        return false;
      return true;
    });
  }

  function pause(state = {}, reason = "paused", payload = {}) {
    return {
      ...state,
      ...payload,
      activationControl: "pause",
      activationStatus: "paused",
      activationPauseReason: reason,
    };
  }

  function historyEntry(node, status) {
    return {
      node: node.id,
      owner: node.owner,
      status,
      at: new Date().toISOString(),
    };
  }

  async function run(input = {}, handlers = {}, options = {}) {
    let current = createState(input);
    const plan = planFor(current, options);
    current = {
      ...current,
      activationHistory: [...(current.activationHistory || [])],
      activationStatus: "running",
      activationPauseReason: "",
    };
    for (const node of plan) {
      const handler = handlers[node.id];
      current = { ...current, activationNode: node.id };
      if (typeof handler !== "function") {
        current.activationHistory.push(historyEntry(node, "skipped"));
        continue;
      }
      const next = await handler(current, node);
      if (next === false || next === null) {
        current.activationHistory.push(historyEntry(node, "cancelled"));
        return null;
      }
      if (next !== undefined) current = next;
      current = createState(current);
      if (current.activationControl === "pause") {
        const { activationControl: _control, ...paused } = current;
        paused.activationHistory.push(historyEntry(node, "paused"));
        return paused;
      }
      current.activationHistory.push(historyEntry(node, "completed"));
    }
    return {
      ...current,
      activationStatus: "completed",
      activationNode: "",
      activationPauseReason: "",
    };
  }

  async function resume(state = {}, handlers = {}, options = {}) {
    const pausedAt = nodeById.get(state.activationNode)?.index ?? -1;
    const remaining = nodes
      .filter((node) => nodeById.get(node.id).index > pausedAt)
      .map((node) => node.id);
    const requested = Array.isArray(options.nodeIds)
      ? options.nodeIds.filter((id) => remaining.includes(id))
      : remaining;
    return run(
      {
        ...state,
        activationStatus: "ready",
        activationPauseReason: "",
      },
      handlers,
      { ...options, nodeIds: requested },
    );
  }

  async function resolveAuthoredDecisions(
    effect,
    stage,
    resolver,
    context = {},
  ) {
    if (!shouldResolve(effect, stage)) return effect;
    if (typeof resolver !== "function") return null;
    return (await resolver(effect, context)) || null;
  }

  function remoteDecisionAbility(effect = {}, continuation = {}) {
    return {
      ...effect,
      activationRequest: {
        mode: REMOTE_DECISION_MODE,
        version: 1,
        continuation,
      },
    };
  }

  function remoteDecisionResult(payload) {
    if (!payload || typeof payload !== "object") return null;
    return payload.effect && typeof payload.effect === "object"
      ? payload.effect
      : payload;
  }

  async function waitForRemoteDecision({
    createRequest,
    loadStatus,
    request,
    intervalMs = 1500,
    timeoutMs = 30 * 60 * 1000,
    onStatus,
  } = {}) {
    if (typeof createRequest !== "function" || typeof loadStatus !== "function")
      return {
        ok: false,
        error: new Error("Remote decision transport is unavailable."),
      };
    const created = await createRequest(request);
    if (!created?.ok || !created.id) return created || { ok: false };
    onStatus?.("pending", created.id);
    const started = Date.now();
    let missingReads = 0;
    while (Date.now() - started < timeoutMs) {
      const status = await loadStatus(created.id);
      if (status?.status === "resolved") {
        const effect = remoteDecisionResult(status.resolved_bonuses);
        onStatus?.("resolved", created.id, effect);
        return { ok: Boolean(effect), id: created.id, effect };
      }
      if (status?.status && status.status !== "pending") {
        onStatus?.(status.status, created.id);
        return { ok: false, id: created.id, status: status.status };
      }
      if (!status) {
        missingReads += 1;
        if (missingReads >= 3) {
          onStatus?.("cancelled", created.id);
          return { ok: false, id: created.id, status: "cancelled" };
        }
      } else {
        missingReads = 0;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    onStatus?.("timeout", created.id);
    return { ok: false, id: created.id, status: "timeout" };
  }

  return {
    BEFORE_TARGETS,
    AFTER_TARGETS,
    REMOTE_DECISION_MODE,
    REMOTE_SAVE_MODE,
    nodes,
    createState,
    planFor,
    pause,
    run,
    resume,
    decisionStage,
    shouldResolve,
    targetMustAnswer,
    resolveAuthoredDecisions,
    remoteDecisionAbility,
    remoteDecisionResult,
    waitForRemoteDecision,
  };
});
