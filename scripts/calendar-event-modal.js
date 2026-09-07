(function () {
  let modal = null;
  let resolver = null;
  let initialized = false;
  let currentEvent = null;

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
        `<option value="${month.index}" ${Number(selected) === month.index ? "selected" : ""}>${escapeHtml(month.name)}</option>`,
    ).join("");
  }

  function clampDayInput(prefix, date, config) {
    const maxDay = window.PFCalendarData.monthDays(date.month, date.year, config);
    const input = el(`${prefix}Day`);
    input.max = String(maxDay);
    if (Number(input.value || 1) > maxDay) input.value = String(maxDay);
  }

  function setDate(prefix, absoluteDay, config) {
    const date = window.PFCalendarData.absoluteDayToDate(absoluteDay, config);
    el(`${prefix}Year`).value = date.year;
    el(`${prefix}Month`).innerHTML = monthOptions(date.month);
    el(`${prefix}Day`).value = date.day;
    clampDayInput(prefix, date, config);
  }

  function collectDate(prefix, config) {
    const year = Math.max(1, Number(el(`${prefix}Year`).value || 1) || 1);
    const month = Math.min(
      12,
      Math.max(1, Number(el(`${prefix}Month`).value || 1) || 1),
    );
    const maxDay = window.PFCalendarData.monthDays(month, year, config);
    const day = Math.min(
      maxDay,
      Math.max(1, Number(el(`${prefix}Day`).value || 1) || 1),
    );
    return window.PFCalendarData.dateToAbsoluteDay(year, month, day, config);
  }

  function ensureModal() {
    if (initialized && el("calendarEventModal")) return;
    initialized = true;
    el("calendarEventModal")?.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade calendar-event-modal" id="calendarEventModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <form id="calendarEventForm" class="modal-content">
            <div class="modal-header">
              <h5 id="calendarEventModalTitle" class="modal-title">Calendar Event</h5>
              <button type="button" class="btn-close btn-close-white d-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="calendar-event-grid">
                <div class="grid-column-full">
                  <label for="calendarEventTitle">Title</label>
                  <input id="calendarEventTitle" class="form-control form-control-sm" required>
                </div>
                <div class="grid-column-full">
                  <div class="form-check form-switch">
                    <input id="calendarEventAllDay" class="form-check-input" type="checkbox">
                    <label class="form-check-label" for="calendarEventAllDay">All day</label>
                  </div>
                </div>
                <div>
                  <label for="calendarEventStartYear">Start Year</label>
                  <input id="calendarEventStartYear" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div>
                  <label for="calendarEventStartMonth">Start Month</label>
                  <select id="calendarEventStartMonth" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="calendarEventStartDay">Start Day</label>
                  <input id="calendarEventStartDay" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div data-calendar-time-field>
                  <label for="calendarEventStartTime">Start Time</label>
                  <input id="calendarEventStartTime" class="form-control form-control-sm" type="time">
                </div>
                <div>
                  <label for="calendarEventEndYear">End Year</label>
                  <input id="calendarEventEndYear" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div>
                  <label for="calendarEventEndMonth">End Month</label>
                  <select id="calendarEventEndMonth" class="form-select form-select-sm"></select>
                </div>
                <div>
                  <label for="calendarEventEndDay">End Day</label>
                  <input id="calendarEventEndDay" class="form-control form-control-sm" type="number" min="1">
                </div>
                <div data-calendar-time-field>
                  <label for="calendarEventEndTime">End Time</label>
                  <input id="calendarEventEndTime" class="form-control form-control-sm" type="time">
                </div>
                <div class="grid-column-full">
                  <div class="form-check form-switch">
                    <input id="calendarEventVisible" class="form-check-input" type="checkbox" checked>
                    <label class="form-check-label" for="calendarEventVisible">Visible to players</label>
                  </div>
                </div>
                <div class="grid-column-full">
                  <label for="calendarEventDescription">Description</label>
                  <textarea id="calendarEventDescription" class="form-control form-control-sm" rows="4"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="calendarEventDelete" class="btn btn-outline-danger btn-sm me-auto d-none" type="button">
                <i class="bi bi-trash"></i> Delete
              </button>
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Event</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(el("calendarEventModal"));

    ["Start", "End"].forEach((name) => {
      ["Year", "Month"].forEach((part) => {
        el(`calendarEvent${name}${part}`).addEventListener("change", () => {
          const prefix = `calendarEvent${name}`;
          const date = {
            year: Number(el(`${prefix}Year`).value || 1),
            month: Number(el(`${prefix}Month`).value || 1),
          };
          clampDayInput(prefix, date, currentEvent?.calendarConfig || {});
        });
      });
    });
    el("calendarEventAllDay").addEventListener("change", syncAllDayFields);
    el("calendarEventDelete").addEventListener("click", () => {
      resolver?.({ action: "delete", event: currentEvent });
      resolver = null;
      modal.hide();
    });
    el("calendarEventForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const result = collectEvent();
      if (!result.title) return;
      resolver?.({ action: "save", event: result });
      resolver = null;
      modal.hide();
    });
    el("calendarEventModal").addEventListener("hidden.bs.modal", () => {
      resolver?.(null);
      resolver = null;
    });
  }

  function syncAllDayFields() {
    const allDay = el("calendarEventAllDay").checked;
    document
      .querySelectorAll("[data-calendar-time-field]")
      .forEach((field) => field.classList.toggle("d-none", allDay));
  }

  function collectEvent() {
    const config = currentEvent?.calendarConfig || {};
    const allDay = el("calendarEventAllDay").checked;
    const startDay = collectDate("calendarEventStart", config);
    const endDay = Math.max(startDay, collectDate("calendarEventEnd", config));
    const startMinute = allDay
      ? 0
      : window.PFCalendarData.timeToMinutes(el("calendarEventStartTime").value);
    const rawEndMinute = allDay
      ? 0
      : window.PFCalendarData.timeToMinutes(el("calendarEventEndTime").value);
    const endMinute =
      endDay === startDay ? Math.max(startMinute, rawEndMinute) : rawEndMinute;
    return {
      ...currentEvent,
      title: el("calendarEventTitle").value.trim(),
      description: el("calendarEventDescription").value.trim(),
      startDay,
      startMinute,
      endDay,
      endMinute,
      allDay,
      eventType: "custom",
      visibleToPlayers: el("calendarEventVisible").checked,
    };
  }

  function open(event = {}, options = {}) {
    ensureModal();
    currentEvent = {
      ...event,
      calendarConfig: options.calendarConfig || {},
    };
    el("calendarEventModalTitle").textContent = event.id ? "Edit Event" : "New Event";
    el("calendarEventTitle").value = event.title || "";
    el("calendarEventDescription").value = event.description || "";
    el("calendarEventAllDay").checked = event.allDay !== false;
    el("calendarEventVisible").checked = event.visibleToPlayers !== false;
    setDate(
      "calendarEventStart",
      event.startDay || options.defaultDay || 1,
      options.calendarConfig,
    );
    setDate(
      "calendarEventEnd",
      event.endDay || event.startDay || options.defaultDay || 1,
      options.calendarConfig,
    );
    el("calendarEventStartTime").value = window.PFCalendarData.minutesToTime(
      event.startMinute || 0,
    );
    el("calendarEventEndTime").value = window.PFCalendarData.minutesToTime(
      event.endMinute || event.startMinute || 0,
    );
    el("calendarEventDelete").classList.toggle(
      "d-none",
      !options.canDelete || !event.id,
    );
    syncAllDayFields();
    modal.show();
    setTimeout(() => el("calendarEventTitle").focus(), 150);
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  window.PFCalendarEventModal = { open };
})();
