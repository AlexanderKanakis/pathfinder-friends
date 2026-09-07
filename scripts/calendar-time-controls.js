(function () {
  let modal = null;
  let resolver = null;
  let initialized = false;
  let currentMode = "assign";
  let currentConfig = {};

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function monthOptions(selected = 1) {
    return window.PFCalendarData.MONTHS.map(
      (month) =>
        `<option value="${month.index}" ${
          Number(selected) === month.index ? "selected" : ""
        }>${escapeHtml(month.name)}</option>`,
    ).join("");
  }

  function clampAssignDay() {
    const year = Math.max(
      1,
      Number(el("calendarAssignModalYear").value || 1) || 1,
    );
    const month = Math.min(
      12,
      Math.max(1, Number(el("calendarAssignModalMonth").value || 1) || 1),
    );
    const maxDay = window.PFCalendarData.monthDays(month, year, currentConfig);
    const input = el("calendarAssignModalDay");
    input.max = String(maxDay);
    if (Number(input.value || 1) > maxDay) input.value = String(maxDay);
  }

  function ensureModal() {
    if (initialized && el("calendarTimeControlModal")) return;
    initialized = true;
    el("calendarTimeControlModal")?.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div
        class="modal fade calendar-time-control-modal"
        id="calendarTimeControlModal"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <form id="calendarTimeControlForm" class="modal-content">
            <div class="modal-header">
              <h5 id="calendarTimeControlTitle" class="modal-title">Calendar Time</h5>
            </div>
            <div class="modal-body">
              <div id="calendarAssignModalFields" class="calendar-time-control-grid">
                <div>
                  <label for="calendarAssignModalYear">Year</label>
                  <input
                    id="calendarAssignModalYear"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                  />
                </div>
                <div>
                  <label for="calendarAssignModalMonth">Month</label>
                  <select
                    id="calendarAssignModalMonth"
                    class="form-select form-select-sm"
                  ></select>
                </div>
                <div>
                  <label for="calendarAssignModalDay">Day</label>
                  <input
                    id="calendarAssignModalDay"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                  />
                </div>
                <div>
                  <label for="calendarAssignModalTime">Time</label>
                  <input
                    id="calendarAssignModalTime"
                    class="form-control form-control-sm"
                    type="time"
                    step="1"
                  />
                </div>
              </div>
              <div
                id="calendarMoveModalFields"
                class="calendar-time-control-grid d-none"
              >
                <div>
                  <label for="calendarMoveModalAmount">Amount</label>
                  <input
                    id="calendarMoveModalAmount"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    value="1"
                  />
                </div>
                <div>
                  <label for="calendarMoveModalUnit">Unit</label>
                  <select
                    id="calendarMoveModalUnit"
                    class="form-select form-select-sm"
                  >
                    <option value="turn">Turn</option>
                    <option value="minute">Minute</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-light btn-sm"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                id="calendarTimeControlSubmit"
                type="submit"
                class="btn btn-primary btn-sm"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(el("calendarTimeControlModal"));
    ["calendarAssignModalYear", "calendarAssignModalMonth"].forEach((id) => {
      el(id).addEventListener("change", clampAssignDay);
    });
    el("calendarTimeControlForm").addEventListener("submit", (event) => {
      event.preventDefault();
      resolver?.(collectValue());
      resolver = null;
      modal.hide();
    });
    el("calendarTimeControlModal").addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  function collectAssignValue() {
    const year = Math.max(
      1,
      Number(el("calendarAssignModalYear").value || 1) || 1,
    );
    const month = Math.min(
      12,
      Math.max(1, Number(el("calendarAssignModalMonth").value || 1) || 1),
    );
    const maxDay = window.PFCalendarData.monthDays(month, year, currentConfig);
    const day = Math.min(
      maxDay,
      Math.max(1, Number(el("calendarAssignModalDay").value || 1) || 1),
    );
    return {
      currentDay: window.PFCalendarData.dateToAbsoluteDay(
        year,
        month,
        day,
        currentConfig,
      ),
      currentSecond: window.PFCalendarData.timeToSeconds(
        el("calendarAssignModalTime").value,
      ),
    };
  }

  function collectMoveValue() {
    return {
      amount: Math.max(
        1,
        Number(el("calendarMoveModalAmount").value || 1) || 1,
      ),
      unit: el("calendarMoveModalUnit").value || "turn",
    };
  }

  function collectValue() {
    return currentMode === "move" ? collectMoveValue() : collectAssignValue();
  }

  function openAssign(options = {}) {
    ensureModal();
    currentMode = "assign";
    currentConfig = options.calendarConfig || {};
    const date = window.PFCalendarData.absoluteDayToDate(
      options.currentDay || 1,
      currentConfig,
    );

    el("calendarTimeControlTitle").textContent = "Assign Current Date";
    el("calendarAssignModalFields").classList.remove("d-none");
    el("calendarMoveModalFields").classList.add("d-none");
    el("calendarTimeControlSubmit").textContent = "Assign";
    el("calendarAssignModalYear").value = date.year;
    el("calendarAssignModalMonth").innerHTML = monthOptions(date.month);
    el("calendarAssignModalDay").value = date.day;
    el("calendarAssignModalTime").value = window.PFCalendarData.secondsToTime(
      options.currentSecond || 0,
    );
    clampAssignDay();
    modal.show();
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  function openMove(options = {}) {
    ensureModal();
    currentMode = "move";
    currentConfig = options.calendarConfig || {};
    el("calendarTimeControlTitle").textContent = "Move Time By";
    el("calendarAssignModalFields").classList.add("d-none");
    el("calendarMoveModalFields").classList.remove("d-none");
    el("calendarTimeControlSubmit").textContent = "Move";
    el("calendarMoveModalAmount").value = options.amount || 1;
    el("calendarMoveModalUnit").value = options.unit || "turn";
    modal.show();
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  window.PFCalendarTimeControls = {
    openAssign,
    openMove,
  };
})();
