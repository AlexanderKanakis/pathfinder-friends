let diceSaveTimer;
let diceContextKey = "general";

function attackRow() {
  return `
    <div class="row dice-row align-items-center">

      <div class="col-3 fixed-die">d20</div>

      <div class="col-3">
        <input class="form-control form-control-sm attack-mod mini-input" type="number" value="0">
      </div>

      <div class="col-2">
        <input class="form-control form-control-sm attack-crit mini-input" type="text" value="20">
      </div>

      <div class="col-4 d-flex justify-content-center gap-1 px-0">
        <button class="btn btn-success btn-sm icon-btn" onclick="rollSingle(this)" title="Roll" aria-label="Roll attack">
          <i class="bi bi-dice-5"></i>
        </button>

        <button class="btn btn-secondary btn-sm icon-btn" onclick="duplicateRow(this)" title="Duplicate" aria-label="Duplicate attack">
          <i class="bi bi-copy"></i>
        </button>

        <button class="btn btn-danger btn-sm icon-btn" onclick="removeRow(this)" title="Delete" aria-label="Delete attack">
          <i class="bi bi-trash"></i>
        </button>
      </div>

      <div class="col-12 mt-1 result-text"></div>

    </div>
  `;
}

function damageRow() {
  return `
    <div class="row dice-row damage-row align-items-center">

      <div class="col-3 damage-dice-col">
        <div class="d-flex gap-1">
          <input class="form-control form-control-sm dmg-count mini-input" type="number" value="1">
          <select class="form-select form-select-sm dmg-type mini-input">
            <option value="4">d4</option>
            <option value="6">d6</option>
            <option value="8">d8</option>
            <option value="10">d10</option>
            <option value="12">d12</option>
            <option value="20">d20</option>
            <option value="100">d100</option>
          </select>
        </div>
      </div>

      <div class="col-3 damage-mod-col">
        <input class="form-control form-control-sm dmg-mod mini-input" type="number" value="0">
      </div>

      <div class="col-2 damage-spacer-col"></div>

      <div class="col-4 damage-actions-col d-flex justify-content-center gap-1 px-0">
        <button class="btn btn-success btn-sm icon-btn" onclick="rollSingle(this)" title="Roll" aria-label="Roll damage">
          <i class="bi bi-dice-5"></i>
        </button>

        <button class="btn btn-secondary btn-sm icon-btn" onclick="duplicateRow(this)" title="Duplicate" aria-label="Duplicate damage">
          <i class="bi bi-copy"></i>
        </button>

        <button class="btn btn-danger btn-sm icon-btn" onclick="removeRow(this)" title="Delete" aria-label="Delete damage">
          <i class="bi bi-trash"></i>
        </button>
      </div>

      <div class="col-12 mt-1 result-text"></div>

    </div>
  `;
}

function addAttack(save = true) {
  const div = document.createElement("div");
  div.innerHTML = attackRow();
  document.getElementById("attackContainer").appendChild(div.firstElementChild);
  if (save) queueDiceSave();
}

function addDamage(save = true) {
  const div = document.createElement("div");
  div.innerHTML = damageRow();
  document.getElementById("damageContainer").appendChild(div.firstElementChild);
  if (save) queueDiceSave();
}

function removeRow(btn) {
  btn.closest(".dice-row")?.remove();
  queueDiceSave();
}

function duplicateRow(btn) {
  const row = btn.closest(".dice-row");
  if (!row) return;

  const clone = row.cloneNode(true);

  clone.querySelectorAll("input, select").forEach((field, index) => {
    field.value = row.querySelectorAll("input, select")[index].value;
  });

  clone.querySelector(".result-text").innerHTML = "";
  row.after(clone);
  queueDiceSave();
}

function collectDiceState() {
  const attacks = [...document.querySelectorAll("#attackContainer .dice-row")].map(row => ({
    modifier: row.querySelector(".attack-mod").value,
    crit: row.querySelector(".attack-crit").value
  }));

  const damages = [...document.querySelectorAll("#damageContainer .dice-row")].map(row => ({
    count: row.querySelector(".dmg-count").value,
    die: row.querySelector(".dmg-type").value,
    modifier: row.querySelector(".dmg-mod").value
  }));

  return { attacks, damages };
}

function restoreDiceState(state) {
  document.getElementById("attackContainer").innerHTML = "";
  document.getElementById("damageContainer").innerHTML = "";

  (state.attacks || []).forEach(attack => {
    addAttack(false);
    const row = document.querySelector("#attackContainer .dice-row:last-child");
    row.querySelector(".attack-mod").value = attack.modifier ?? 0;
    row.querySelector(".attack-crit").value = attack.crit ?? 20;
  });

  (state.damages || []).forEach(damage => {
    addDamage(false);
    const row = document.querySelector("#damageContainer .dice-row:last-child");
    row.querySelector(".dmg-count").value = damage.count ?? 1;
    row.querySelector(".dmg-type").value = damage.die ?? 6;
    row.querySelector(".dmg-mod").value = damage.modifier ?? 0;
  });

  if (!document.querySelector("#attackContainer .dice-row")) addAttack(false);
  if (!document.querySelector("#damageContainer .dice-row")) addDamage(false);
}

function queueDiceSave() {
  clearTimeout(diceSaveTimer);
  diceSaveTimer = setTimeout(() => {
    PFApp.saveDiceState(collectDiceState(), diceContextKey);
  }, 300);
}

async function loadDiceContext(contextKey) {
  clearTimeout(diceSaveTimer);
  diceContextKey = contextKey || "general";

  const savedState = await PFApp.loadDiceState(diceContextKey);
  if (savedState) {
    restoreDiceState(savedState);
  } else {
    restoreDiceState({ attacks: [], damages: [] });
    queueDiceSave();
  }
}

async function initDiceRoller() {
  const user = await PFApp.requireAuth();
  if (!user) return;

  diceContextKey = PFApp.getSelectedContextKey();
  await loadDiceContext(diceContextKey);
  window.addEventListener("pf-context-change", event => loadDiceContext(event.detail.contextKey));

  document.getElementById("attackContainer").addEventListener("input", queueDiceSave);
  document.getElementById("attackContainer").addEventListener("change", queueDiceSave);
  document.getElementById("damageContainer").addEventListener("input", queueDiceSave);
  document.getElementById("damageContainer").addEventListener("change", queueDiceSave);
}

function isCrit(range, value) {
  if (!range) return false;
  if (range.includes("-")) {
    const [a, b] = range.split("-").map(Number);
    return value >= a && value <= b;
  }
  return value >= parseInt(range);
}

function rollAttack(row) {
  const mod = parseInt(row.querySelector(".attack-mod").value || 0);
  const critRange = row.querySelector(".attack-crit").value;

  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + mod;
  const crit = isCrit(critRange, roll);

  return { roll, mod, total, crit };
}

function rollDamage(row) {
  const count = parseInt(row.querySelector(".dmg-count").value || 1);
  const type = parseInt(row.querySelector(".dmg-type").value || 6);
  const mod = parseInt(row.querySelector(".dmg-mod").value || 0);

  let rolls = [];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * type) + 1;
    rolls.push(r);
    sum += r;
  }

  return { rolls, total: sum + mod, mod, count, type };
}

function rollSingle(btn) {
  const row = btn.closest(".dice-row");
  if (!row) return;

  let result;

  if (row.closest("#attackContainer")) {
    result = rollAttack(row);
    row.querySelector(".result-text").innerHTML =
      `d20 [${result.roll}] + ${result.mod} = ` +
      (result.crit ? `<span class="crit">${result.total} CRIT</span>` : result.total);
  } else {
    result = rollDamage(row);
    row.querySelector(".result-text").innerHTML =
      `${result.count}d${result.type} [${result.rolls.join(", ")}] + ${result.mod} = ${result.total}`;
  }
}

function rollAll() {
  const rows = document.querySelectorAll(".dice-row");
  const results = document.getElementById("results");

  results.innerHTML = "";
  let total = 0;

  rows.forEach(row => {
    let text = "";

    if (row.closest("#attackContainer")) {
      const r = rollAttack(row);
      total += r.total;

      text =
        `ATTACK: d20 [${r.roll}] + ${r.mod} = ` +
        (r.crit ? `<span class="crit">${r.total} CRIT</span>` : r.total);
    } else {
      const r = rollDamage(row);
      total += r.total;

      text =
        `DAMAGE: ${r.count}d${r.type} [${r.rolls.join(", ")}] + ${r.mod} = ${r.total}`;
    }

    const div = document.createElement("div");
    div.innerHTML = text;
    results.appendChild(div);
  });

  document.getElementById("total").innerText = total;
}

initDiceRoller();

