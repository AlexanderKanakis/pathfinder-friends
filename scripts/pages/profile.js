const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
let currentUser = null;
let currentProfile = null;

function setProfileStatus(message, type = "info") {
  const el = document.getElementById("profileStatus");
  el.className = `alert alert-${type} py-2`;
  el.textContent = message;
  el.classList.remove("d-none");
}

function setSaving(isSaving) {
  const btn = document.getElementById("saveBtn");
  btn.disabled = isSaving;
  btn.textContent = isSaving ? "Saving..." : "Save Profile";
}

function setPasswordSaving(isSaving) {
  const btn = document.getElementById("passwordBtn");
  btn.disabled = isSaving;
  btn.textContent = isSaving ? "Updating..." : "Update Password";
}

function fallbackAvatar(label) {
  const initial = (label || "?").trim().charAt(0).toUpperCase() || "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <rect width="112" height="112" fill="#2b2b2b"/>
      <text x="56" y="64" text-anchor="middle" font-size="42" font-family="Arial" fill="#f8f9fa">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function shrinkAvatar(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size <= MAX_AVATAR_BYTES) {
    return file;
  }

  const image = await loadImage(file);
  let maxSide = 1024;
  let quality = 0.9;

  while (maxSide >= 256) {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    quality = 0.9;
    while (quality >= 0.5) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_AVATAR_BYTES) {
        return new File([blob], "avatar.jpg", { type: "image/jpeg" });
      }
      quality -= 0.1;
    }

    maxSide = Math.floor(maxSide * 0.75);
  }

  throw new Error("That image could not be reduced below 2 MB. Try a smaller source image.");
}

async function uploadAvatar(file) {
  const avatar = await shrinkAvatar(file);
  const extension = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
  const path = `${currentUser.id}/avatar.${extension}`;

  const { error } = await PFApp.client
    .storage
    .from("avatars")
    .upload(path, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: true
    });

  if (error) throw error;

  const { data } = PFApp.client.storage.from("avatars").getPublicUrl(path);
  return { path, url: `${data.publicUrl}?v=${Date.now()}` };
}

async function initProfile() {
  currentUser = await PFApp.requireAuth();
  if (!currentUser) return;

  currentProfile = await PFApp.loadProfile();
  document.getElementById("email").value = currentUser.email || "";
  document.getElementById("username").value = currentProfile?.username || "";
  document.getElementById("avatarPreview").src =
    currentProfile?.avatar_url || fallbackAvatar(currentProfile?.username || currentUser.email);

  const isAdmin = await PFApp.isAppAdmin();
  document.getElementById("adminSettingsPanel").classList.toggle("d-none", !isAdmin);
}

document.getElementById("avatarFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("avatarPreview").src = URL.createObjectURL(file);
  document.getElementById("avatarHelp").textContent =
    file.size > MAX_AVATAR_BYTES
      ? "This image is over 2 MB and will be resized when you save."
      : "This image is under 2 MB and ready to upload.";
});

document.getElementById("profileForm").addEventListener("submit", async event => {
  event.preventDefault();
  setSaving(true);

  try {
    const username = document.getElementById("username").value.trim();
    const avatarFile = document.getElementById("avatarFile").files[0];
    const update = { username };

    if (avatarFile) {
      setProfileStatus("Preparing avatar...", "info");
      const avatar = await uploadAvatar(avatarFile);
      update.avatar_path = avatar.path;
      update.avatar_url = avatar.url;
    }

    const { data, error } = await PFApp.saveProfile(update);
    if (error) throw error;

    currentProfile = data;
    document.getElementById("avatarPreview").src =
      currentProfile.avatar_url || fallbackAvatar(currentProfile.username || currentUser.email);
    await PFApp.renderAuthNav(currentUser);
    setProfileStatus("Profile saved.", "success");
  } catch (error) {
    setProfileStatus(error.message || "Could not save profile.", "danger");
  } finally {
    setSaving(false);
  }
});

document.getElementById("passwordForm").addEventListener("submit", async event => {
  event.preventDefault();
  const password = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    setProfileStatus("Passwords do not match.", "warning");
    return;
  }

  setPasswordSaving(true);
  try {
    const { error } = await PFApp.updatePassword(password);
    if (error) throw error;
    event.target.reset();
    setProfileStatus("Password updated.", "success");
  } catch (error) {
    setProfileStatus(error.message || "Could not update password.", "danger");
  } finally {
    setPasswordSaving(false);
  }
});

initProfile();
