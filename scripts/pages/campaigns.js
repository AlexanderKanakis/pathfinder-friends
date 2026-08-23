let currentUser = null;
let campaigns = [];
let selectedCampaignId = "";

function el(id) { return document.getElementById(id); }
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, type = "info") {
  const status = el("campaignStatus");
  status.className = `alert alert-${type} py-2`;
  status.textContent = message;
  status.classList.remove("d-none");
}

function displayName(row) {
  return row.username || row.email || row.user_id || "Unknown";
}

function shouldUseDetailsModal() {
  return window.matchMedia("(max-width: 767px)").matches;
}

async function copyCampaignId(gameId) {
  try {
    await navigator.clipboard.writeText(gameId);
    setStatus("Campaign ID copied.", "success");
  } catch (error) {
    const input = document.createElement("input");
    input.value = gameId;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    setStatus("Campaign ID copied.", "success");
  }
}

async function findCampaignById() {
  const id = el("campaignIdInput").value.trim();
  if (!id) return;
  const result = await PFApp.findCampaign(id);
  if (result?.error || !result?.data) {
    el("foundCampaign").innerHTML = `<div class="small-text">No campaign found.</div>`;
    return;
  }

  const campaign = result.data;
  el("foundCampaign").innerHTML = `
    <div class="detail-row">
      <div class="fw-semibold">${escapeHtml(campaign.name)}</div>
      <div class="small-text">${escapeHtml(campaign.description || "No description.")}</div>
      <button class="btn btn-primary btn-sm mt-2" type="button" onclick="requestJoin('${escapeHtml(campaign.id)}')">Request Entry</button>
    </div>
  `;
}

async function requestJoin(gameId) {
  const result = await PFApp.requestCampaignAccess(gameId);
  if (result?.error) {
    setStatus(result.error.message || "Could not request entry.", "danger");
    return;
  }
  setStatus("Request sent to the GM.", "success");
}

function renderCampaignList() {
  if (!campaigns.length) {
    el("campaignList").innerHTML = `<div class="small-text">No campaigns yet.</div>`;
    return;
  }

  el("campaignList").innerHTML = campaigns.map(campaign => `
    <article class="campaign-card ${campaign.id === selectedCampaignId ? "active" : ""}" onclick="selectCampaign('${escapeHtml(campaign.id)}')">
      <div class="campaign-card-main d-flex justify-content-between gap-2">
        <div>
          <div class="fw-semibold">${escapeHtml(campaign.name)}</div>
          <div class="small-text">${campaign.owner_id === currentUser.id ? "GM" : "Player"}</div>
        </div>
        <div class="campaign-id-wrap d-flex align-items-center gap-1">
          <code class="campaign-id small text-info">${escapeHtml(campaign.id)}</code>
          <button class="btn btn-outline-light btn-sm" type="button" title="Copy campaign ID" onclick="event.stopPropagation(); copyCampaignId('${escapeHtml(campaign.id)}')">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

async function selectCampaign(gameId) {
  selectedCampaignId = gameId;
  renderCampaignList();
  const campaign = campaigns.find(item => item.id === gameId);
  if (!campaign) return;

  const [members, characters] = await Promise.all([
    PFApp.loadContextMembers(`game:${gameId}`),
    PFApp.loadContextCharacters(`game:${gameId}`)
  ]);

  const isGm = campaign.owner_id === currentUser.id;
  const sortedMembers = [...members].sort((a, b) => (a.userId === campaign.owner_id ? -1 : b.userId === campaign.owner_id ? 1 : 0));

  const detailsHtml = `
    <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
      <div>
        <h4 class="mb-1">${escapeHtml(campaign.name)}</h4>
        <div class="small-text">${escapeHtml(campaign.description || "No description.")}</div>
        <div class="small-text mt-1 d-flex align-items-center gap-2">
          <span>ID: <code class="campaign-id">${escapeHtml(campaign.id)}</code></span>
          <button class="btn btn-outline-light btn-sm" type="button" title="Copy campaign ID" onclick="copyCampaignId('${escapeHtml(campaign.id)}')">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      </div>
      <div class="d-flex gap-2 align-items-start">
        ${isGm ? `
          <button class="btn btn-outline-info btn-sm" type="button" onclick="openEditCampaign('${escapeHtml(campaign.id)}')">Edit</button>
          <button class="btn btn-danger btn-sm" type="button" onclick="deleteCampaign('${escapeHtml(campaign.id)}')">Delete</button>
        ` : `<button class="btn btn-outline-warning btn-sm" type="button" onclick="leaveCampaign('${escapeHtml(campaign.id)}')">Leave</button>`}
      </div>
    </div>

    <h5>Players</h5>
    <div class="detail-list mb-3">
      ${sortedMembers.map(member => `
        <div class="detail-row d-flex justify-content-between align-items-center gap-2">
          <div>
            <span class="fw-semibold">${escapeHtml(displayName(member))}</span>
            ${member.userId === campaign.owner_id ? `<span class="badge text-bg-info ms-1">GM</span>` : ""}
          </div>
          ${isGm && member.userId !== campaign.owner_id ? `<button class="btn btn-outline-danger btn-sm" type="button" onclick="kickMember('${escapeHtml(campaign.id)}','${escapeHtml(member.userId)}')">Remove</button>` : ""}
        </div>
      `).join("")}
    </div>

    <h5>Characters</h5>
    <div class="detail-list">
      ${characters.length ? characters.map(character => `
        <div class="detail-row">
          <div class="fw-semibold">${escapeHtml(character.name)}</div>
          <div class="small-text">${escapeHtml(character.username || character.email || "Unknown owner")}</div>
        </div>
      `).join("") : `<div class="small-text">No characters in this campaign yet.</div>`}
    </div>
  `;

  if (shouldUseDetailsModal()) {
    el("campaignDetailsModalLabel").textContent = campaign.name || "Campaign";
    el("campaignDetailsModalBody").innerHTML = detailsHtml;
    new bootstrap.Modal(el("campaignDetailsModal")).show();
    el("campaignDetails").innerHTML = `<div class="small-text">Selected: ${escapeHtml(campaign.name)}</div>`;
  } else {
    el("campaignDetails").innerHTML = detailsHtml;
  }
}

async function refreshCampaigns() {
  campaigns = await PFApp.loadCampaigns();
  renderCampaignList();
  await renderRequests();
  if (selectedCampaignId && campaigns.some(campaign => campaign.id === selectedCampaignId)) {
    await selectCampaign(selectedCampaignId);
  } else {
    selectedCampaignId = "";
    el("campaignDetails").innerHTML = "Select a campaign to see details.";
  }
}

async function renderRequests() {
  const requests = await PFApp.loadCampaignRequests();
  if (!requests.length) {
    el("requestList").innerHTML = `<div class="small-text">No pending requests.</div>`;
    return;
  }

  el("requestList").innerHTML = requests.map(request => `
    <div class="detail-row">
      <div><span class="fw-semibold">${escapeHtml(request.username || request.email || request.user_id)}</span> has requested access to <span class="fw-semibold">${escapeHtml(request.campaign_name)}</span></div>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-success btn-sm" type="button" onclick="respondRequest('${escapeHtml(request.id)}', true)">Accept</button>
        <button class="btn btn-outline-danger btn-sm" type="button" onclick="respondRequest('${escapeHtml(request.id)}', false)">Deny</button>
      </div>
    </div>
  `).join("");
}

async function respondRequest(requestId, accepted) {
  const result = await PFApp.respondCampaignRequest(requestId, accepted);
  if (result.error) {
    setStatus(result.error.message || "Could not update request.", "danger");
    return;
  }
  setStatus(accepted ? "Request accepted." : "Request denied.", "success");
  await refreshCampaigns();
}

async function leaveCampaign(gameId) {
  if (!confirm("Leave this campaign? Your assigned loot will be moved to unassigned.")) return;
  const result = await PFApp.leaveCampaign(gameId);
  if (result.error) {
    setStatus(result.error.message || "Could not leave campaign.", "danger");
    return;
  }
  setStatus("You left the campaign.", "success");
  await PFApp.renderAuthNav(currentUser);
  await refreshCampaigns();
}

async function kickMember(gameId, userId) {
  if (!confirm("Remove this player? Their assigned loot will be moved to unassigned.")) return;
  const result = await PFApp.kickCampaignMember(gameId, userId);
  if (result.error) {
    setStatus(result.error.message || "Could not remove player.", "danger");
    return;
  }
  setStatus("Player removed.", "success");
  await selectCampaign(gameId);
}

async function deleteCampaign(gameId) {
  if (!confirm("Delete this campaign and all associated campaign data?")) return;
  const result = await PFApp.deleteCampaign(gameId);
  if (result.error) {
    setStatus(result.error.message || "Could not delete campaign.", "danger");
    return;
  }
  setStatus("Campaign deleted.", "success");
  await PFApp.renderAuthNav(currentUser);
  await refreshCampaigns();
}

function openEditCampaign(gameId) {
  const campaign = campaigns.find(item => item.id === gameId);
  if (!campaign) return;
  el("editCampaignId").value = campaign.id;
  el("editCampaignName").value = campaign.name || "";
  el("editCampaignDescription").value = campaign.description || "";
  const detailsModal = bootstrap.Modal.getInstance(el("campaignDetailsModal"));
  if (detailsModal) {
    detailsModal.hide();
    setTimeout(() => new bootstrap.Modal(el("editCampaignModal")).show(), 180);
    return;
  }
  new bootstrap.Modal(el("editCampaignModal")).show();
}

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = await PFApp.requireAuth();
  if (!currentUser) return;

  el("createCampaignForm").addEventListener("submit", async event => {
    event.preventDefault();
    const name = el("campaignName").value.trim();
    const description = el("campaignDescription").value.trim();
    const result = await PFApp.createCampaign(name, description);
    if (result?.error) {
      setStatus(result.error.message || "Could not create campaign.", "danger");
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById("createCampaignModal"))?.hide();
    event.target.reset();
    setStatus("Campaign created.", "success");
    await PFApp.renderAuthNav(currentUser);
    await refreshCampaigns();
  });

  el("editCampaignForm").addEventListener("submit", async event => {
    event.preventDefault();
    const id = el("editCampaignId").value;
    const name = el("editCampaignName").value.trim();
    const description = el("editCampaignDescription").value.trim();
    const result = await PFApp.updateCampaign(id, name, description);
    if (result.error) {
      setStatus(result.error.message || "Could not update campaign.", "danger");
      return;
    }

    bootstrap.Modal.getInstance(el("editCampaignModal"))?.hide();
    setStatus("Campaign updated.", "success");
    await PFApp.renderAuthNav(currentUser);
    await refreshCampaigns();
    await selectCampaign(id);
  });

  await refreshCampaigns();
});
