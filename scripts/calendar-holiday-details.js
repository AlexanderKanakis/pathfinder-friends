(function () {
  let modal = null;
  let initialized = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function dateRangeLabel(event = {}, config = {}) {
    const start = window.PFCalendarData.absoluteDayToDate(
      event.startDay || 1,
      config,
    );
    const end = window.PFCalendarData.absoluteDayToDate(
      event.endDay || event.startDay || 1,
      config,
    );
    const startText = `${start.day} ${start.monthName} ${start.year} AR`;
    const endText = `${end.day} ${end.monthName} ${end.year} AR`;
    return startText === endText ? startText : `${startText} - ${endText}`;
  }

  function ensureModal() {
    if (
      initialized &&
      document.getElementById("calendarHolidayDetailsModal")
    ) {
      return;
    }
    initialized = true;
    document.getElementById("calendarHolidayDetailsModal")?.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade calendar-holiday-modal" id="calendarHolidayDetailsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 id="calendarHolidayTitle" class="modal-title">Holiday</h5>
            </div>
            <div class="modal-body">
              <div class="calendar-holiday-meta" id="calendarHolidayMeta"></div>
              <div id="calendarHolidayDescription" class="calendar-holiday-description"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
    modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("calendarHolidayDetailsModal"),
    );
  }

  function open(event = {}, options = {}) {
    ensureModal();
    const holiday = event.holiday || {};
    const detail = holiday.commemorates || holiday.observedBy || "";
    const description = holiday.description || "";
    const sourceUrl = holiday.sourceUrl || "";
    const source = holiday.source || "";
    document.getElementById("calendarHolidayTitle").textContent =
      event.title || holiday.name || "Holiday";
    document.getElementById("calendarHolidayMeta").innerHTML = `
      <div>
        <span>Date</span>
        <strong>${escapeHtml(dateRangeLabel(event, options.calendarConfig))}</strong>
      </div>
      ${
        detail
          ? `<div><span>Celebrated / Commemorated</span><strong>${escapeHtml(detail)}</strong></div>`
          : ""
      }
      ${
        holiday.category
          ? `<div><span>Category</span><strong>${escapeHtml(holiday.category)}</strong></div>`
          : ""
      }
      ${
        sourceUrl
          ? `<div><span>Source</span><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(source || sourceUrl)}</a></div>`
          : ""
      }
    `;
    document.getElementById("calendarHolidayDescription").innerHTML =
      description
        ? `<p>${escapeHtml(description)}</p>`
        : `<p class="text-muted mb-0">No description.</p>`;
    modal.show();
  }

  window.PFCalendarHolidayDetails = { open };
})();
