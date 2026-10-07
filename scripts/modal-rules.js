(function () {
  const STEPPER_PARENTS = [
    "[data-item-stepper]",
    ".ability-score-stepper",
    ".height-feet-stepper",
    ".modal-number-stepper",
    ".number-stepper",
    ".skill-stepper",
    ".spell-picker-cl-stepper",
  ].join(",");

  function fieldLabel(input) {
    const explicit = input.getAttribute("aria-label");
    if (explicit) return explicit;
    const label = input.id
      ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`)
      : input.closest("label");
    return label?.textContent?.trim() || "value";
  }

  function step(input, direction) {
    if (input.disabled || input.readOnly) return;
    try {
      if (direction < 0) input.stepDown();
      else input.stepUp();
    } catch {
      const amount = Number(input.step) || 1;
      input.value = String((Number(input.value) || 0) + amount * direction);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function enhanceNumberInput(input) {
    if (input.closest(STEPPER_PARENTS)) return;
    const label = fieldLabel(input);
    const wrapper = document.createElement("div");
    wrapper.className = "modal-number-stepper";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.className =
      "btn btn-outline-light btn-sm modal-number-stepper-button";
    decrease.setAttribute("aria-label", `Decrease ${label}`);
    decrease.textContent = "-";
    const increase = document.createElement("button");
    increase.type = "button";
    increase.className =
      "btn btn-outline-light btn-sm modal-number-stepper-button";
    increase.setAttribute("aria-label", `Increase ${label}`);
    increase.textContent = "+";
    input.before(wrapper);
    wrapper.append(decrease, input, increase);
    decrease.addEventListener("click", () => step(input, -1));
    increase.addEventListener("click", () => step(input, 1));
  }

  function enhance(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(".modal input[type='number']")) {
      enhanceNumberInput(root);
    }
    root
      .querySelectorAll(".modal input[type='number']")
      .forEach(enhanceNumberInput);
  }

  function start() {
    enhance(document);
    new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
        }),
      );
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
