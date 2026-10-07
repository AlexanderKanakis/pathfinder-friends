(function (root) {
  let queue = Promise.resolve();

  function ensureModal() {
    let element = document.getElementById("arcaneSpellFailureModal");
    if (element) return element;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal fade" id="arcaneSpellFailureModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
              <h5 class="modal-title">Arcane Spell Failure</h5>
            </div>
            <div class="modal-body">
              <section class="damage-roll-card damage-roll-result-card">
                <div class="damage-roll-result-label" data-asf-spell></div>
                <div class="damage-roll-die-value is-rolling" data-asf-roll>0</div>
                <div class="damage-roll-result-breakdown">
                  <div class="damage-roll-result-row"><span>Failure chance</span><strong data-asf-chance></strong></div>
                  <hr class="damage-roll-total-divider">
                  <div class="damage-roll-result-row damage-roll-total-row" data-asf-result>Rolling</div>
                </div>
              </section>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-outline-light" data-asf-cancel>Cancel</button>
              <button type="button" class="btn btn-success d-none" data-asf-anyway>Cast Anyway</button>
            </div>
          </div>
        </div>
      </div>`,
    );
    return document.getElementById("arcaneSpellFailureModal");
  }

  function run({ chance = 0, spellName = "Spell", random = Math.random } = {}) {
    const failureChance = Math.max(0, Math.min(100, Number(chance) || 0));
    if (!failureChance) return Promise.resolve(true);
    return new Promise((resolve) => {
      const element = ensureModal();
      const modal = bootstrap.Modal.getOrCreateInstance(element);
      const rollNode = element.querySelector("[data-asf-roll]");
      const resultNode = element.querySelector("[data-asf-result]");
      const cancel = element.querySelector("[data-asf-cancel]");
      const anyway = element.querySelector("[data-asf-anyway]");
      element.querySelector("[data-asf-spell]").textContent = spellName;
      element.querySelector("[data-asf-chance]").textContent = `${failureChance}%`;
      rollNode.textContent = "0";
      rollNode.classList.add("is-rolling");
      resultNode.textContent = "Rolling";
      resultNode.className = "damage-roll-result-row damage-roll-total-row";
      anyway.classList.add("d-none");
      let settled = false;
      let interval = null;
      let resultTimer = null;
      let closeTimer = null;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (interval) clearInterval(interval);
        if (resultTimer) clearTimeout(resultTimer);
        if (closeTimer) clearTimeout(closeTimer);
        modal.hide();
        resolve(value);
      };
      cancel.onclick = () => finish(false);
      anyway.onclick = () => finish(true);
      interval = setInterval(() => {
        rollNode.textContent = String(Math.floor(random() * 100) + 1);
      }, 70);
      modal.show();
      resultTimer = setTimeout(() => {
        clearInterval(interval);
        interval = null;
        const roll = Math.floor(random() * 100) + 1;
        const failed = roll <= failureChance;
        rollNode.textContent = String(roll);
        rollNode.classList.remove("is-rolling");
        resultNode.textContent = failed ? "Spell Failed" : "Spell Cast";
        resultNode.classList.add(failed ? "text-danger" : "text-success");
        if (failed) {
          anyway.classList.remove("d-none");
        } else {
          closeTimer = setTimeout(() => finish(true), 1000);
        }
      }, 850);
    });
  }

  root.PFArcaneSpellFailure = {
    check(options = {}) {
      const next = queue.then(() => run(options), () => run(options));
      queue = next.catch(() => false);
      return next;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
