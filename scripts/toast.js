(function () {
  const CONTAINER_ID = "pfToastContainer";
  const DEFAULT_DURATION = 4200;

  function container() {
    let root = document.getElementById(CONTAINER_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = CONTAINER_ID;
    root.className = "pf-toast-container";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "false");
    document.body.appendChild(root);
    return root;
  }

  function remove(toast) {
    if (!toast?.isConnected) return;
    toast.classList.add("pf-toast-leaving");
    window.setTimeout(() => toast.remove(), 180);
  }

  function show(message, options = {}) {
    const text = String(message || "").trim();
    if (!text) return null;
    const tone = ["danger", "info", "success", "warning"].includes(options.tone)
      ? options.tone
      : "info";
    const toast = document.createElement("div");
    toast.className = `pf-toast pf-toast-${tone}`;
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");

    const icon = document.createElement("i");
    icon.className =
      tone === "warning" || tone === "danger"
        ? "bi bi-exclamation-triangle-fill"
        : tone === "success"
          ? "bi bi-check-circle-fill"
          : "bi bi-info-circle-fill";
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = text;
    toast.append(icon, label);
    container().appendChild(toast);
    window.requestAnimationFrame(() => toast.classList.add("pf-toast-visible"));

    const duration = Math.max(
      1200,
      Number(options.duration || DEFAULT_DURATION) || DEFAULT_DURATION,
    );
    window.setTimeout(() => remove(toast), duration);
    return toast;
  }

  window.PFToast = { show };
})();
