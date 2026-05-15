(function () {
  const config = window.PF_SUPABASE_CONFIG || {};
  const missingConfig =
    !config.url ||
    !config.anonKey ||
    config.url.includes("YOUR_PROJECT_REF") ||
    config.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  let client = null;

  if (!missingConfig && window.supabase) {
    client = window.supabase.createClient(config.url, config.anonKey);
  }

  function authLinkHtml(user, profile, isAdmin = false) {
    if (missingConfig) {
      return `<span class="navbar-text small text-warning">Supabase config needed</span>`;
    }

    if (!user) {
      return `<a class="btn btn-outline-light btn-sm" href="auth.html">Login</a>`;
    }

    const displayName = profile?.username || user.email || "Signed in";
    const avatar = profile?.avatar_url
      ? `<img src="${escapeHtml(profile.avatar_url)}" alt="" class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">`
      : "";

    return `
      <div class="d-flex flex-wrap align-items-center gap-2">
        <div>
          <label class="navbar-text small text-secondary d-block py-0" for="navContextSelect">Campaign</label>
          <select id="navContextSelect" class="form-select form-select-sm" style="width: auto; min-width: 150px;" aria-label="Context"></select>
        </div>
        <div>
          <label class="navbar-text small text-secondary d-block py-0" for="navCharacterSelect">Character</label>
          <select id="navCharacterSelect" class="form-select form-select-sm" style="width: auto; min-width: 150px;" aria-label="Character"></select>
        </div>
      </div>
      ${isAdmin ? `<a class="btn btn-outline-info btn-sm" href="admin.html">Admin</a>` : ""}
      <a class="navbar-text small text-light text-decoration-none d-inline-flex align-items-center gap-2" href="profile.html">
        ${avatar}
        <span>${escapeHtml(displayName)}</span>
      </a>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setStatus(message, type = "info") {
    const el = document.getElementById("authStatus");
    if (!el) return;
    el.className = `alert alert-${type} py-2`;
    el.textContent = message;
    el.classList.remove("d-none");
  }

  function normalizeContext(contextKey = getSelectedContextKey()) {
    if (!contextKey || contextKey === "general") {
      return { contextKey: "general", gameId: null };
    }

    if (contextKey.startsWith("game:")) {
      return { contextKey, gameId: contextKey.slice(5) };
    }

    return { contextKey: "general", gameId: null };
  }

  function getSelectedContextKey() {
    return localStorage.getItem("pf_context_key") || "general";
  }

  function setSelectedContextKey(contextKey) {
    localStorage.setItem("pf_context_key", contextKey || "general");
  }

  async function getRequiredGameContextKey() {
    const contexts = (await loadContexts()).filter(context => context.gameId);
    if (!contexts.length) return "";

    const selected = getSelectedContextKey();
    if (contexts.some(context => context.key === selected)) return selected;

    const fallback = contexts[0].key;
    setSelectedContextKey(fallback);
    return fallback;
  }

  function showCampaignRequiredMessage() {
    const main = document.querySelector("main") || document.body;
    main.innerHTML = `
      <div class="container mt-4">
        <div class="alert alert-warning">
          <h5 class="alert-heading">Campaign required</h5>
          <p class="mb-2">This page is only available inside a campaign.</p>
          <a class="btn btn-primary btn-sm" href="campaigns.html">Go to Campaigns</a>
        </div>
      </div>
    `;
  }

  async function requireGameContext() {
    const contextKey = await getRequiredGameContextKey();
    if (!contextKey) {
      showCampaignRequiredMessage();
      return "";
    }
    return contextKey;
  }

  function getSelectedCharacterId(contextKey = getSelectedContextKey()) {
    return localStorage.getItem(`pf_character_id_${contextKey}`) || "";
  }

  function setSelectedCharacterId(characterId, contextKey = getSelectedContextKey()) {
    const key = `pf_character_id_${contextKey}`;
    if (characterId) localStorage.setItem(key, characterId);
    else localStorage.removeItem(key);
  }

  async function getUser() {
    if (!client) return null;
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session?.user) return sessionData.session.user;

    const { data } = await client.auth.getUser();
    return data.user;
  }

  async function requireAuth() {
    if (missingConfig) {
      showLockedMessage("Add your Supabase URL and anon key in supabase-config.js.");
      return null;
    }

    const user = await getUser();
    if (!user) {
      window.location.href = `auth.html?redirect=${encodeURIComponent(window.location.pathname.split("/").pop() || "dice-roller.html")}`;
      return null;
    }

    await renderAuthNav(user);
    return user;
  }

  async function renderAuthNav(user) {
    const slot = document.getElementById("authNav");
    if (!slot) return;
    const currentUser = user === undefined ? await getUser() : user;
    const profile = currentUser ? await loadProfile(currentUser.id) : null;
    const admin = currentUser ? await isAppAdmin() : false;
    slot.innerHTML = authLinkHtml(currentUser, profile, admin);
    if (currentUser) {
      await setupContextSelect("navContextSelect", async contextKey => {
        await setupCharacterSelect("navCharacterSelect", contextKey);
      });
      await setupCharacterSelect("navCharacterSelect", getSelectedContextKey(), null, { dispatch: false });
    }
  }

  function showLockedMessage(message) {
    const container = document.querySelector(".container");
    if (!container) return;
    container.innerHTML = `
      <div class="alert alert-warning mt-3">
        ${escapeHtml(message)}
      </div>
    `;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    window.location.href = "auth.html";
  }

  async function setupAuthPage() {
    await renderAuthNav(await getUser());

    if (missingConfig) {
      setStatus("Add your Supabase URL and anon key in supabase-config.js first.", "warning");
      return;
    }

    const redirect = new URLSearchParams(window.location.search).get("redirect") || "dice-roller.html";
    const currentUser = await getUser();
    if (currentUser) {
      window.location.href = redirect;
      return;
    }

    document.getElementById("loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        setStatus(error.message, "danger");
        return;
      }

      if (!data.session) {
        setStatus("Login succeeded, but no session was returned. Check email confirmation settings.", "warning");
        return;
      }

      window.location.href = redirect;
    });

  }

  async function createUserAsAdmin(email, password) {
    if (!client) return { error: new Error("Supabase is not configured") };
    return client.functions.invoke("admin-create-user", {
      body: { email, password }
    });
  }

  async function setupAdminPage() {
    const user = await requireAuth();
    if (!user) return;

    const admin = await isAppAdmin();
    if (!admin) {
      showLockedMessage("Only app admins can access this page.");
      return;
    }

    await renderAuthNav(user);
    const form = document.getElementById("adminCreateUserForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.getElementById("adminUserEmail").value.trim();
      const password = document.getElementById("adminUserPassword").value;
      const status = document.getElementById("adminStatus");
      const button = document.getElementById("adminCreateUserBtn");
      status.className = "alert alert-info py-2";
      status.textContent = "Creating user...";
      status.classList.remove("d-none");
      button.disabled = true;

      const { data, error } = await createUserAsAdmin(email, password);
      button.disabled = false;

      if (error || data?.error) {
        status.className = "alert alert-danger py-2";
        status.textContent = data?.error || error?.message || "Could not create user.";
        return;
      }

      status.className = "alert alert-success py-2";
      status.textContent = `User created for ${data?.email || email}.`;
      form.reset();
    });
  }

  async function loadContexts() {
    const user = await getUser();
    if (!client || !user) return [{ key: "general", label: "General", gameId: null }];

    const { data, error } = await client
      .from("games")
      .select("id,name")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      return [{ key: "general", label: "General", gameId: null }];
    }

    return [
      { key: "general", label: "General", gameId: null },
      ...(data || []).map(game => ({
        key: `game:${game.id}`,
        label: game.name,
        gameId: game.id
      }))
    ];
  }

  async function createCampaign(name, description) {
    const user = await getUser();
    if (!client || !user) return null;
    const { data, error } = await client.rpc("create_campaign", {
      game_name: name,
      game_description: description || ""
    });
    if (error) {
      console.error(error);
      return { error };
    }
    return { data };
  }

  async function findCampaign(gameId) {
    const user = await getUser();
    if (!client || !user) return null;
    const { data, error } = await client.rpc("find_campaign", { target_game_id: gameId });
    if (error) {
      console.error(error);
      return { error };
    }
    return { data: data?.[0] || null };
  }

  async function requestCampaignAccess(gameId) {
    const user = await getUser();
    if (!client || !user) return null;
    const { data, error } = await client.rpc("request_campaign_access", { target_game_id: gameId });
    if (error) {
      console.error(error);
      return { error };
    }
    return { data };
  }

  async function loadCampaigns() {
    const user = await getUser();
    if (!user) return [];
    const { data, error } = await client.rpc("get_my_campaigns");
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async function loadCampaignRequests() {
    const user = await getUser();
    if (!user) return [];
    const { data, error } = await client.rpc("get_campaign_requests");
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async function respondCampaignRequest(requestId, accepted) {
    const { error } = await client.rpc("respond_campaign_request", {
      request_id: requestId,
      accept_request: Boolean(accepted)
    });
    if (error) console.error(error);
    return { error };
  }

  async function leaveCampaign(gameId) {
    const { error } = await client.rpc("leave_campaign", { target_game_id: gameId });
    if (error) console.error(error);
    return { error };
  }

  async function kickCampaignMember(gameId, userId) {
    const { error } = await client.rpc("kick_campaign_member", {
      target_game_id: gameId,
      target_user_id: userId
    });
    if (error) console.error(error);
    return { error };
  }

  async function deleteCampaign(gameId) {
    const { error } = await client.from("games").delete().eq("id", gameId);
    if (error) console.error(error);
    return { error };
  }

  async function updateCampaign(gameId, name, description) {
    const { data, error } = await client
      .from("games")
      .update({
        name,
        description: description || ""
      })
      .eq("id", gameId)
      .select("id,name,description,owner_id,created_at")
      .single();

    if (error) console.error(error);
    return { data, error };
  }

  async function setupContextSelect(selectId, onChange) {
    const select = document.getElementById(selectId);
    if (!select) return "general";

    const contexts = await loadContexts();
    const keys = contexts.map(context => context.key);
    let selectedKey = getSelectedContextKey();
    const page = window.location.pathname.split("/").pop() || "";
    const requiresGame = ["map.html", "character-sheet.html", "bag-of-holding.html"].includes(page);
    const availableContexts = requiresGame ? contexts.filter(context => context.gameId) : contexts;

    if (!availableContexts.length) {
      select.innerHTML = `<option value="">No campaigns</option>`;
      setSelectedContextKey("general");
      return "";
    }

    if (!availableContexts.some(context => context.key === selectedKey)) {
      selectedKey = requiresGame ? availableContexts[0].key : "general";
      setSelectedContextKey(selectedKey);
    }

    select.innerHTML = "";
    availableContexts.forEach(context => {
      const option = document.createElement("option");
      option.value = context.key;
      option.textContent = context.label;
      select.appendChild(option);
    });

    select.value = selectedKey;
    select.addEventListener("change", () => {
      setSelectedContextKey(select.value);
      window.dispatchEvent(new CustomEvent("pf-context-change", { detail: { contextKey: select.value } }));
      onChange?.(select.value);
    });

    return selectedKey;
  }

  async function setupCharacterSelect(selectId, contextKey = getSelectedContextKey(), onChange, options = {}) {
    const select = document.getElementById(selectId);
    if (!select) return "";

    const sheets = await loadCharacterSheets(contextKey);
    const remembered = getSelectedCharacterId(contextKey);
    const selectedId = remembered && sheets.some(sheet => sheet.id === remembered)
      ? remembered
      : "";

    select.innerHTML = `<option value="">No character</option>`;
    sheets.forEach(sheet => {
      const option = document.createElement("option");
      option.value = sheet.id;
      option.textContent = sheet.character_name || "Unnamed";
      select.appendChild(option);
    });

    select.value = selectedId;
    select.onchange = () => {
      setSelectedCharacterId(select.value, contextKey);
      window.dispatchEvent(new CustomEvent("pf-character-change", {
        detail: { contextKey, characterId: select.value }
      }));
      onChange?.(select.value);
    };

    if (options.dispatch !== false) {
      window.dispatchEvent(new CustomEvent("pf-character-change", {
        detail: { contextKey, characterId: selectedId }
      }));
    }

    return selectedId;
  }

  async function loadProfile(userId) {
    const user = userId ? { id: userId } : await getUser();
    if (!client || !user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("id,email,username,avatar_path,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function saveProfile(profile) {
    const user = await getUser();
    if (!client || !user) return { error: new Error("Not signed in") };

    return client
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select("id,email,username,avatar_path,avatar_url")
      .single();
  }

  async function updatePassword(newPassword) {
    if (!client) return { error: new Error("Supabase is not configured") };
    return client.auth.updateUser({ password: newPassword });
  }

  async function isAppAdmin() {
    const user = await getUser();
    if (!client || !user) return false;

    const { data, error } = await client.rpc("is_app_admin");
    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data);
  }

  async function loadDiceState(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await client
      .from("user_dice_state")
      .select("state")
      .eq("user_id", user.id)
      .eq("context_key", normalizeContext(contextKey).contextKey)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.state || null;
  }

  async function saveDiceState(state, contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!client || !user) return;
    const context = normalizeContext(contextKey);

    const { error } = await client
      .from("user_dice_state")
      .upsert(
        {
          user_id: user.id,
          context_key: context.contextKey,
          game_id: context.gameId,
          state,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,context_key" }
      );

    if (error) console.error(error);
  }

  function normalizeActiveBuffState(activeBuffs) {
    if (Array.isArray(activeBuffs)) return activeBuffs;
    if (Array.isArray(activeBuffs?.buffs)) return activeBuffs.buffs;
    return [];
  }

  async function loadBuffState(contextKey = getSelectedContextKey(), characterId = "") {
    const user = await getUser();
    if (!user) return null;
    const context = normalizeContext(contextKey);

    let query = client
      .from("user_buff_state")
      .select("active_buffs")
      .eq("context_key", context.contextKey)
      .order("updated_at", { ascending: false })
      .limit(1);

    query = characterId
      ? query.eq("character_id", characterId)
      : query.eq("user_id", user.id).is("character_id", null);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return null;
    }

    if (data?.[0]) return normalizeActiveBuffState(data[0].active_buffs);

    if (characterId) {
      const { data: legacy, error: legacyError } = await client
        .from("user_buff_state")
        .select("active_buffs")
        .eq("user_id", user.id)
        .eq("context_key", context.contextKey)
        .is("character_id", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (legacyError) {
        console.error(legacyError);
        return [];
      }

      const legacyState = legacy?.[0]?.active_buffs;
      if (legacyState?.characterId === characterId) return normalizeActiveBuffState(legacyState);
    }

    return [];
  }

  async function saveBuffState(activeBuffs, contextKey = getSelectedContextKey(), characterId = "") {
    const user = await getUser();
    if (!client || !user) return;
    const context = normalizeContext(contextKey);

    const payload = {
      user_id: user.id,
      context_key: context.contextKey,
      game_id: context.gameId,
      character_id: characterId || null,
      active_buffs: activeBuffs,
      updated_at: new Date().toISOString()
    };

    let existingQuery = client
      .from("user_buff_state")
      .select("id")
      .eq("context_key", context.contextKey)
      .limit(1);

    existingQuery = characterId
      ? existingQuery.eq("character_id", characterId)
      : existingQuery.eq("user_id", user.id).is("character_id", null);

    const { data: existing, error: existingError } = await existingQuery;
    if (existingError) {
      console.error(existingError);
      return;
    }

    const { error } = existing?.[0]?.id
      ? await client.from("user_buff_state").update(payload).eq("id", existing[0].id)
      : await client.from("user_buff_state").insert(payload);

    if (error) console.error(error);
  }

  function normalizeBuffDefinition(row) {
    const legacyDuration = parseDurationLabel(row.duration);
    const durationCount = row.duration_count === undefined ? legacyDuration.count : row.duration_count;
    const durationUnit = row.duration_unit === undefined ? legacyDuration.unit : row.duration_unit;
    const durationPerLevel = row.duration_per_level === undefined ? legacyDuration.perLevel : row.duration_per_level;
    return {
      id: row.id,
      name: row.name,
      category: row.category || "Custom",
      duration: formatDurationLabel(durationCount, durationUnit, durationPerLevel),
      durationCount,
      durationUnit: durationUnit || "variable",
      durationPerLevel: Boolean(durationPerLevel),
      bonuses: Array.isArray(row.bonuses) ? row.bonuses : [],
      source: row.source || "custom",
      contextKey: row.context_key || "general",
      gameId: row.game_id || null
    };
  }

  function parseDurationLabel(duration) {
    const text = String(duration || "").toLowerCase().trim();
    if (!text || text === "variable" || text === "permanent") {
      return { count: null, unit: "variable", perLevel: false };
    }

    const count = Number((text.match(/(\d+)/) || [null, 1])[1]) || 1;
    const units = ["turn", "round", "minute", "hour", "day"];
    const unit = units.find(value => text.includes(value)) || "variable";
    const perLevel = text.includes("/level") || text.includes("per level");
    return { count: unit === "variable" ? null : count, unit, perLevel: unit !== "variable" && perLevel };
  }

  function formatDurationLabel(count, unit, perLevel) {
    const amount = Number(count || 0);
    if (!amount || !unit || unit === "variable") return "variable";
    return `${amount} ${unit}${amount === 1 ? "" : "s"}${perLevel ? " / level" : ""}`;
  }

  async function loadBuffDefinitions() {
    const user = await getUser();
    if (!user) return [];

    let { data, error } = await client
      .from("buff_definitions")
      .select("id,name,category,duration,duration_count,duration_unit,duration_per_level,bonuses,source,context_key,game_id")
      .order("name", { ascending: true });

    if (error?.code === "42703") {
      const fallback = await client
        .from("buff_definitions")
        .select("id,name,category,duration,bonuses,source")
        .order("name", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map(normalizeBuffDefinition);
  }

  async function saveBuffDefinition(buff) {
    const user = await getUser();
    if (!client || !user) return null;
    const context = normalizeContext(buff.contextKey || getSelectedContextKey());

    const payload = {
      user_id: user.id,
      name: buff.name,
      category: buff.category || "Custom",
      duration: buff.duration || formatDurationLabel(buff.durationCount, buff.durationUnit, buff.durationPerLevel),
      duration_count: buff.durationCount || null,
      duration_unit: buff.durationUnit || "variable",
      duration_per_level: Boolean(buff.durationPerLevel),
      bonuses: buff.bonuses || [],
      source: "custom",
      context_key: context.contextKey,
      game_id: context.gameId,
      updated_at: new Date().toISOString()
    };

    const { data: existing, error: existingError } = await client
      .from("buff_definitions")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", buff.name)
      .eq("source", "custom")
      .maybeSingle();

    if (existingError) {
      console.error(existingError);
      return null;
    }

    let query = existing?.id
      ? client.from("buff_definitions").update(payload).eq("id", existing.id)
      : client.from("buff_definitions").insert(payload);

    let { data, error } = await query
      .select("id,name,category,duration,duration_count,duration_unit,duration_per_level,bonuses,source,context_key,game_id")
      .single();

    if (error?.code === "42703") {
      const legacyPayload = { ...payload };
      delete legacyPayload.duration_count;
      delete legacyPayload.duration_unit;
      delete legacyPayload.duration_per_level;
      query = existing?.id
        ? client.from("buff_definitions").update(legacyPayload).eq("id", existing.id)
        : client.from("buff_definitions").insert(legacyPayload);
      const fallback = await query
        .select("id,name,category,duration,bonuses,source,context_key,game_id")
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error(error);
      return null;
    }

    return normalizeBuffDefinition(data);
  }

  async function updateBuffDefinition(buffId, buff) {
    const user = await getUser();
    if (!client || !user || !buffId) return null;

    const { data, error } = await client.rpc("admin_update_buff_definition", {
      target_buff_id: buffId,
      new_name: buff.name,
      new_category: buff.category || "Custom",
      new_duration: buff.duration || formatDurationLabel(buff.durationCount, buff.durationUnit, buff.durationPerLevel),
      new_duration_count: buff.durationCount || null,
      new_duration_unit: buff.durationUnit || "variable",
      new_duration_per_level: Boolean(buff.durationPerLevel),
      new_bonuses: Array.isArray(buff.bonuses) ? buff.bonuses : []
    });

    if (error) {
      console.error(error);
      return null;
    }

    return normalizeBuffDefinition(data);
  }

  async function deleteBuffDefinition(buffId) {
    const user = await getUser();
    if (!client || !user || !buffId) {
      return { ok: false, error: new Error("Not signed in or missing effect id") };
    }

    const { error } = await client.rpc("admin_delete_buff_definition", {
      target_buff_id: buffId
    });

    if (error) {
      console.error(error);
      return { ok: false, error };
    }

    return { ok: true };
  }

  async function loadCharacterSheets(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return [];

    const context = normalizeContext(contextKey);
    let query = client
      .from("character_sheets")
      .select("id,character_name,user_id,updated_at")
      .eq("context_key", context.contextKey)
      .order("updated_at", { ascending: false });

    if (!context.gameId) query = query.eq("user_id", user.id);

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  }

  async function loadCharacterSheet(characterName, contextKey = getSelectedContextKey(), sheetId = null) {
    const user = await getUser();
    if (!user || (!characterName && !sheetId)) return null;

    const context = normalizeContext(contextKey);
    let query = client
      .from("character_sheets")
      .select("id,character_name,user_id,sheet")
      .eq("context_key", context.contextKey);

    if (sheetId) {
      query = query.eq("id", sheetId);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error(error);
        return null;
      }

      return data;
    } else {
      query = query
        .eq("user_id", user.id)
        .eq("character_name", characterName)
        .order("updated_at", { ascending: false })
        .limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return null;
    }

    return Array.isArray(data) ? data[0] || null : data;
  }

  async function saveCharacterSheet(characterName, sheet, contextKey = getSelectedContextKey(), sheetId = null) {
    const user = await getUser();
    if (!client || !user || !characterName) return null;
    const context = normalizeContext(contextKey);
    const payload = {
      user_id: user.id,
      context_key: context.contextKey,
      game_id: context.gameId,
      character_name: characterName,
      sheet,
      updated_at: new Date().toISOString()
    };

    if (sheetId) {
      const { data, error } = await client
        .from("character_sheets")
        .update(payload)
        .eq("id", sheetId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) console.error(error);
      return data;
    }

    const existing = await loadCharacterSheet(characterName, contextKey);
    if (existing?.id) {
      return saveCharacterSheet(characterName, sheet, contextKey, existing.id);
    }

    const { data, error } = await client
      .from("character_sheets")
      .insert(payload)
      .select("id")
      .single();

    if (error) console.error(error);
    return data;
  }

  async function loadContextMembers(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return [];

    const context = normalizeContext(contextKey);
    if (!context.gameId) {
      const profile = await loadProfile(user.id);
      return [{
        userId: user.id,
        email: user.email || "",
        username: profile?.username || "",
        avatarUrl: profile?.avatar_url || ""
      }];
    }

    const { data, error } = await client.rpc("get_game_members", { target_game_id: context.gameId });
    if (error) {
      console.error(error);
      const profile = await loadProfile(user.id);
      return [{
        userId: user.id,
        email: user.email || "",
        username: profile?.username || "",
        avatarUrl: profile?.avatar_url || ""
      }];
    }

    return (data || []).map(member => ({
      userId: member.user_id,
      email: member.email || "",
      username: member.username || "",
      avatarUrl: member.avatar_url || ""
    }));
  }

  async function loadContextCharacters(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return [];

    const context = normalizeContext(contextKey);
    const { data, error } = await client.rpc("get_context_characters", { target_context_key: context.contextKey });
    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map(character => ({
      id: character.id,
      name: character.character_name || "Unnamed character",
      userId: character.user_id,
      sheet: character.sheet || {},
      username: character.username || "",
      email: character.email || ""
    }));
  }

  async function loadLootItems(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return [];

    const context = normalizeContext(contextKey);
    const { data, error } = await client
      .from("game_loot")
      .select("id,name,description,count,type,assigned_to,assigned_character_id,details,effects,created_by,updated_at")
      .eq("context_key", context.contextKey)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  }

  async function saveLootItem(item, contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!client || !user) return null;

    const context = normalizeContext(contextKey);
    const payload = {
      name: item.name,
      description: item.description || "",
      count: Math.max(1, Number.parseInt(item.count, 10) || 1),
      type: item.type || "Item",
      assigned_to: item.assignedTo || null,
      assigned_character_id: item.assignedCharacterId || null,
      details: item.details || {},
      effects: Array.isArray(item.effects) ? item.effects : [],
      context_key: context.contextKey,
      game_id: context.gameId,
      updated_at: new Date().toISOString()
    };

    const query = item.id
      ? client.from("game_loot").update(payload).eq("id", item.id)
      : client.from("game_loot").insert({ ...payload, created_by: user.id });

    const { data, error } = await query
      .select("id,name,description,count,type,assigned_to,assigned_character_id,details,effects,created_by,updated_at")
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function deleteLootItem(itemId) {
    const user = await getUser();
    if (!client || !user || !itemId) return false;

    const { data, error } = await client
      .from("game_loot")
      .delete()
      .eq("id", itemId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data?.id);
  }

  async function loadMapState(contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!user) return null;

    const context = normalizeContext(contextKey);
    const { data, error } = await client
      .from("map_state")
      .select("state,updated_at,updated_by")
      .eq("context_key", context.contextKey)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.state || null;
  }

  async function saveMapState(state, contextKey = getSelectedContextKey()) {
    const user = await getUser();
    if (!client || !user) return null;

    const context = normalizeContext(contextKey);
    const payload = {
      context_key: context.contextKey,
      game_id: context.gameId,
      state: state || {},
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("map_state")
      .upsert(payload, { onConflict: "context_key" })
      .select("state")
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.state || state;
  }

  window.PFApp = {
    client,
    missingConfig,
    requireAuth,
    renderAuthNav,
    setupAuthPage,
    setupAdminPage,
    signOut,
    loadProfile,
    saveProfile,
    updatePassword,
    isAppAdmin,
    createUserAsAdmin,
    loadContexts,
    createCampaign,
    findCampaign,
    requestCampaignAccess,
    loadCampaigns,
    requireGameContext,
    loadCampaignRequests,
    respondCampaignRequest,
    leaveCampaign,
    kickCampaignMember,
    deleteCampaign,
    updateCampaign,
    setupContextSelect,
    setupCharacterSelect,
    getSelectedContextKey,
    setSelectedContextKey,
    getSelectedCharacterId,
    setSelectedCharacterId,
    loadDiceState,
    saveDiceState,
    loadBuffState,
    saveBuffState,
    loadBuffDefinitions,
    saveBuffDefinition,
    updateBuffDefinition,
    deleteBuffDefinition,
    loadCharacterSheets,
    loadCharacterSheet,
    saveCharacterSheet,
    loadContextMembers,
    loadContextCharacters,
    loadLootItems,
    saveLootItem,
    deleteLootItem,
    loadMapState,
    saveMapState
  };
})();
