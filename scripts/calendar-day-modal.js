(function () {
  let modal = null;
  let eventCallback = null;
  let initialized = false;

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

  function ensureModal() {
    if (initialized && el("calendarDayViewModal")) return;
    initialized = true;
    el("calendarDayViewModal")?.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div
        class="modal fade calendar-day-view-modal"
        id="calendarDayViewModal"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 id="calendarDayViewTitle" class="modal-title">Calendar Day</h5>
            </div>
            <div class="modal-body">
              <div id="calendarDayViewCell" class="calendar-day-view-cell"></div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-light btn-sm"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(el("calendarDayViewModal"));
  }

  function eventTimeLabel(event = {}) {
    if (event.allDay) return "All day";
    const start = window.PFCalendarData.minutesToTime(event.startMinute || 0);
    const end = window.PFCalendarData.minutesToTime(event.endMinute || 0);
    return start === end ? start : `${start} - ${end}`;
  }

  function open(options = {}) {
    ensureModal();
    eventCallback = options.onOpenEvent || null;

    const date = options.date || {};
    const events = Array.isArray(options.events) ? options.events : [];
    const moonPhase = options.moonPhase || {};
    const canManageEvents = Boolean(options.canManageEvents);
    const title = `${date.day || ""} ${date.monthName || ""} ${date.year || ""} AR`;
    const moonClass = moonPhase.visualKey
      ? `has-${moonPhase.visualKey}`
      : "";

    el("calendarDayViewTitle").textContent = title.trim() || "Calendar Day";
    el("calendarDayViewCell").className =
      `calendar-day-view-cell ${moonClass}`.trim();
    el("calendarDayViewCell").innerHTML = `
      <div class="calendar-day-view-number">${escapeHtml(date.day || "")}</div>
      <div class="calendar-day-view-events">
        ${
          events.length
            ? events
                .map(
                  (event) => {
                    const canOpen =
                      event.eventType === "holiday" || canManageEvents;
                    return `
                    <button
                      class="calendar-day-view-event ${
                        event.eventType === "holiday" ? "is-holiday" : ""
                      }"
                      type="button"
                      data-calendar-day-event-id="${escapeHtml(event.id || "")}"
                      ${canOpen ? "" : "disabled"}
                    >
                      <span class="fw-semibold">${escapeHtml(event.title || "Event")}</span>
                      <span class="small-text ms-2">${escapeHtml(eventTimeLabel(event))}</span>
                    </button>
                  `;
                  },
                )
                .join("")
            : `<div class="calendar-day-view-empty">No events.</div>`
        }
      </div>
    `;

    el("calendarDayViewCell")
      .querySelectorAll("[data-calendar-day-event-id]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const calendarEvent = events.find(
            (item) => item.id === button.dataset.calendarDayEventId,
          );
          if (!calendarEvent) return;
          modal.hide();
          eventCallback?.(calendarEvent);
        });
      });

    modal.show();
  }

  window.PFCalendarDayModal = { open };
})();
