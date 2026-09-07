let calendarContextKey = "";
let calendarContextLabel = "";
let isCalendarManager = false;
let calendarState = null;
let calendarEvents = [];
let holidayRules = [];
let holidayRangeCache = new Map();
let visibleYear = 1;
let visibleMonth = 1;
let selectedDay = 1;
let calendarRealtimeChannel = null;

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

function status(message, type = "info") {
  const box = el("calendarStatus");
  box.className = `alert alert-${type} py-2`;
  box.textContent = message;
  box.classList.toggle("d-none", !message);
}

function calendarConfig() {
  return window.PFCalendarData.configWithDefaults(
    calendarState?.calendarConfig || {},
  );
}

function currentAbsoluteDay() {
  return Math.max(1, Number(calendarState?.currentDay || 1) || 1);
}

function currentSecond() {
  return Math.min(
    86399,
    Math.max(0, Number(calendarState?.currentSecond ?? 28800) || 0),
  );
}

function monthLabel(year, month) {
  const monthData = window.PFCalendarData.MONTHS[month - 1];
  return `${monthData?.name || "Abadius"} ${year} AR`;
}

function dateLabel(absoluteDay) {
  const date = window.PFCalendarData.absoluteDayToDate(
    absoluteDay,
    calendarConfig(),
  );
  return `${date.weekday}, ${date.day} ${date.monthName} ${date.year} AR`;
}

function monthOptions(selected = 1) {
  return window.PFCalendarData.MONTHS.map(
    (month) =>
      `<option value="${month.index}" ${Number(selected) === month.index ? "selected" : ""}>${escapeHtml(month.name)}</option>`,
  ).join("");
}

function syncAssignControls() {
  const date = window.PFCalendarData.absoluteDayToDate(
    currentAbsoluteDay(),
    calendarConfig(),
  );
  el("assignYear").value = date.year;
  el("assignMonth").innerHTML = monthOptions(date.month);
  el("assignDay").value = date.day;
  el("assignDay").max = window.PFCalendarData.monthDays(
    date.month,
    date.year,
    calendarConfig(),
  );
  el("assignTime").value = window.PFCalendarData.secondsToTime(currentSecond());
}

function syncCurrentDateDisplay() {
  const date = window.PFCalendarData.absoluteDayToDate(
    currentAbsoluteDay(),
    calendarConfig(),
  );
  el("campaignCurrentDate").textContent =
    `${date.day} ${date.monthName} ${date.year} AR`;
  el("campaignCurrentTime").textContent =
    window.PFCalendarData.secondsToTime(currentSecond());
  el("campaignCurrentWeekday").textContent = `${date.weekday} · ${date.season}`;
  syncAssignControls();
}

function rangeForVisibleGrid() {
  const config = calendarConfig();
  const firstDay = window.PFCalendarData.startOfMonthAbsoluteDay(
    visibleYear,
    visibleMonth,
    config,
  );
  const firstWeekdayIndex =
    (window.PFCalendarData.WEEKDAYS.indexOf(
      window.PFCalendarData.weekdayForAbsoluteDay(firstDay, config),
    ) + window.PFCalendarData.WEEKDAYS.length) %
    window.PFCalendarData.WEEKDAYS.length;
  const startDay = Math.max(1, firstDay - firstWeekdayIndex);
  return {
    startDay,
    endDay: startDay + 41,
  };
}

function holidayCacheKey(startDay, endDay) {
  const config = calendarConfig();
  return JSON.stringify({
    startDay,
    endDay,
    firstWeekdayIndex: config.firstWeekdayIndex,
    leapRule: config.leapRule,
    leapYearAnchor: config.leapYearAnchor,
    lunarCycleDays: config.lunarCycleDays,
    fullMoonEpochDay: config.fullMoonEpochDay,
    holidayCount: holidayRules.length,
  });
}

function holidaysForRange(startDay, endDay) {
  const key = holidayCacheKey(startDay, endDay);
  if (!holidayRangeCache.has(key)) {
    holidayRangeCache.set(
      key,
      window.PFHolidayData.holidayOccurrencesForRange(
        holidayRules,
        startDay,
        endDay,
        calendarConfig(),
      ),
    );
  }
  return holidayRangeCache.get(key);
}

function eventsForRange(startDay, endDay) {
  return [
    ...calendarEvents,
    ...holidaysForRange(startDay, endDay),
  ].filter(
    (event) =>
      Number(event.startDay || 0) <= endDay &&
      Number(event.endDay || event.startDay || 0) >= startDay,
  );
}

function eventsForDay(absoluteDay) {
  const range = eventsForRange(absoluteDay, absoluteDay);
  return range
    .filter(
      (event) =>
        Number(event.startDay || 0) <= absoluteDay &&
        Number(event.endDay || event.startDay || 0) >= absoluteDay,
    )
    .sort(
      (left, right) =>
        Number(left.startMinute || 0) - Number(right.startMinute || 0) ||
        String(left.title || "").localeCompare(String(right.title || "")),
    );
}

function eventTimeLabel(event) {
  if (event.allDay) return "All day";
  const start = window.PFCalendarData.minutesToTime(event.startMinute || 0);
  const end = window.PFCalendarData.minutesToTime(event.endMinute || 0);
  return start === end ? start : `${start} - ${end}`;
}

function isMobileCalendarView() {
  return window.matchMedia("(max-width: 680px)").matches;
}

function agendaPreview(event = {}) {
  if (event.eventType !== "holiday") return event.description || "";
  const holiday = event.holiday || {};
  return holiday.commemorates || holiday.observedBy || holiday.description || "";
}

function openCalendarItem(event = null) {
  if (!event) return;
  if (event.eventType === "holiday") {
    window.PFCalendarHolidayDetails.open(event, {
      calendarConfig: calendarConfig(),
    });
    return;
  }
  if (isCalendarManager) openEventModal(event);
}

function renderWeekHeader() {
  el("calendarWeekHeader").innerHTML = window.PFCalendarData.WEEKDAYS.map(
    (day) => `<div>${escapeHtml(day)}</div>`,
  ).join("");
}

function renderCalendarGrid() {
  const config = calendarConfig();
  const range = rangeForVisibleGrid();
  const visibleEvents = eventsForRange(range.startDay, range.endDay);
  const monthStart = window.PFCalendarData.startOfMonthAbsoluteDay(
    visibleYear,
    visibleMonth,
    config,
  );
  const monthEnd =
    monthStart +
    window.PFCalendarData.monthDays(visibleMonth, visibleYear, config) -
    1;
  const showSelectedDay = !isMobileCalendarView();

  el("calendarMonthTitle").textContent = monthLabel(visibleYear, visibleMonth);
  el("calendarGrid").innerHTML = Array.from({ length: 42 }, (_, index) => {
    const absoluteDay = range.startDay + index;
    const date = window.PFCalendarData.absoluteDayToDate(absoluteDay, config);
    const moonPhase = window.PFCalendarData.moonPhaseForDay(absoluteDay, config);
    const dayEvents = visibleEvents
      .filter(
        (event) =>
          Number(event.startDay || 0) <= absoluteDay &&
          Number(event.endDay || event.startDay || 0) >= absoluteDay,
      )
      .slice(0, 4);
    const classes = [
      "calendar-day",
      absoluteDay < monthStart || absoluteDay > monthEnd
        ? "is-outside-month"
        : "",
      showSelectedDay && absoluteDay === selectedDay ? "is-selected" : "",
      absoluteDay === currentAbsoluteDay() ? "is-current" : "",
      moonPhase.visualKey ? `has-${moonPhase.visualKey}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `
      <button class="${classes}" type="button" data-calendar-day="${absoluteDay}">
        <div class="calendar-day-number">
          <span>${date.day}</span>
          <span class="calendar-day-weekday">${escapeHtml(date.weekday.slice(0, 3))}</span>
        </div>
        <div class="calendar-event-stack">
          ${dayEvents
            .map((event) => {
              const typeClass =
                event.eventType === "holiday" ? "is-holiday" : "";
              return `
                <span
                  class="calendar-event-pill ${typeClass}"
                  data-calendar-event-id="${escapeHtml(event.id || "")}"
                >
                  ${escapeHtml(event.title || "Event")}
                </span>
              `;
            })
            .join("")}
        </div>
      </button>
    `;
  }).join("");

  el("calendarGrid")
    .querySelectorAll("[data-calendar-event-id]")
    .forEach((pill) => {
      pill.addEventListener("click", (event) => {
        event.stopPropagation();
        if (isMobileCalendarView()) {
          const dayButton = pill.closest("[data-calendar-day]");
          selectedDay = Number(dayButton?.dataset.calendarDay || selectedDay);
          openDayModal(selectedDay);
          return;
        }
        const calendarEvent = visibleEvents.find(
          (item) => item.id === pill.dataset.calendarEventId,
        );
        openCalendarItem(calendarEvent);
      });
    });

  el("calendarGrid")
    .querySelectorAll("[data-calendar-day]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectedDay = Number(button.dataset.calendarDay);
        if (isMobileCalendarView()) {
          openDayModal(selectedDay);
          return;
        }
        renderCalendarGrid();
        renderSelectedDay();
      });
    });
}

function openDayModal(absoluteDay) {
  if (!window.PFCalendarDayModal) return;
  const config = calendarConfig();
  const date = window.PFCalendarData.absoluteDayToDate(absoluteDay, config);
  window.PFCalendarDayModal.open({
    date,
    events: eventsForDay(absoluteDay),
    moonPhase: window.PFCalendarData.moonPhaseForDay(absoluteDay, config),
    canManageEvents: isCalendarManager,
    onOpenEvent: openCalendarItem,
  });
}

function renderSelectedDay() {
  el("selectedDaySummary").textContent = dateLabel(selectedDay);
  const dayEvents = eventsForDay(selectedDay);
  el("selectedDayEvents").innerHTML =
    dayEvents
      .map(
        (event) => `
          <button
            class="calendar-agenda-card ${event.generated ? "is-generated" : ""}"
            type="button"
            data-event-id="${escapeHtml(event.id || "")}"
            ${
              event.eventType !== "holiday" && !isCalendarManager
                ? "disabled"
                : ""
            }
          >
            <div class="calendar-agenda-time">${escapeHtml(eventTimeLabel(event))}</div>
            <div class="fw-semibold">${escapeHtml(event.title || "Event")}</div>
            ${
              agendaPreview(event)
                ? `<div class="small-text">${escapeHtml(agendaPreview(event))}</div>`
                : ""
            }
          </button>
        `,
      )
      .join("") || `<div class="small-text">No events.</div>`;

  el("selectedDayEvents")
    .querySelectorAll("[data-event-id]:not([disabled])")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const event = dayEvents.find(
          (item) => item.id === button.dataset.eventId,
        );
        openCalendarItem(event);
      });
    });
}

function renderCalendar() {
  syncCurrentDateDisplay();
  renderWeekHeader();
  renderCalendarGrid();
  renderSelectedDay();
  el("calendarGmControls").classList.toggle("d-none", !isCalendarManager);
  el("newCalendarEventBtn").classList.toggle("d-none", !isCalendarManager);
  el("openAssignDateModalBtn").classList.toggle("d-none", !isCalendarManager);
  el("openMoveDateModalBtn").classList.toggle("d-none", !isCalendarManager);
}

function assignControlsDay() {
  const config = calendarConfig();
  const year = Math.max(1, Number(el("assignYear").value || 1) || 1);
  const month = Math.min(
    12,
    Math.max(1, Number(el("assignMonth").value || 1) || 1),
  );
  const maxDay = window.PFCalendarData.monthDays(month, year, config);
  const day = Math.min(
    maxDay,
    Math.max(1, Number(el("assignDay").value || 1) || 1),
  );
  return window.PFCalendarData.dateToAbsoluteDay(year, month, day, config);
}

function addSecondsToCurrent(seconds) {
  const total = currentSecond() + Number(seconds || 0);
  const dayDelta = Math.floor(total / 86400);
  const current = {
    currentDay: Math.max(1, currentAbsoluteDay() + dayDelta),
    currentSecond: ((total % 86400) + 86400) % 86400,
    calendarConfig: calendarConfig(),
  };
  if (current.currentDay < 1) {
    current.currentDay = 1;
    current.currentSecond = 0;
  }
  return current;
}

function movedState(amount, unit) {
  const value = Math.max(1, Number(amount || 1) || 1);
  if (unit === "turn") return addSecondsToCurrent(value * 6);
  if (unit === "minute") return addSecondsToCurrent(value * 60);
  if (unit === "hour") return addSecondsToCurrent(value * 3600);
  if (unit === "day") return addSecondsToCurrent(value * 86400);
  if (unit === "week") return addSecondsToCurrent(value * 7 * 86400);
  if (unit === "month") {
    const date = window.PFCalendarData.absoluteDayToDate(
      currentAbsoluteDay(),
      calendarConfig(),
    );
    let month = date.month + value;
    let year = date.year;
    while (month > 12) {
      month -= 12;
      year += 1;
    }
    const day = Math.min(
      date.day,
      window.PFCalendarData.monthDays(month, year, calendarConfig()),
    );
    return {
      currentDay: window.PFCalendarData.dateToAbsoluteDay(
        year,
        month,
        day,
        calendarConfig(),
      ),
      currentSecond: currentSecond(),
      calendarConfig: calendarConfig(),
    };
  }
  return calendarState;
}

async function saveCalendarState(nextState) {
  status("Saving campaign date...", "secondary");
  const saved = await PFApp.saveCampaignCalendarState(nextState, calendarContextKey);
  if (!saved) {
    status("Could not save the campaign date. Has the calendar migration been applied?", "danger");
    return;
  }
  calendarState = saved;
  const date = window.PFCalendarData.absoluteDayToDate(
    currentAbsoluteDay(),
    calendarConfig(),
  );
  visibleYear = date.year;
  visibleMonth = date.month;
  selectedDay = currentAbsoluteDay();
  renderCalendar();
  status("", "info");
}

async function assignCurrentDate() {
  if (!isCalendarManager) return;
  await saveCalendarState({
    currentDay: assignControlsDay(),
    currentSecond: window.PFCalendarData.timeToSeconds(el("assignTime").value),
    calendarConfig: calendarConfig(),
  });
}

async function moveTime() {
  if (!isCalendarManager) return;
  await saveCalendarState(
    movedState(el("moveTimeAmount").value, el("moveTimeUnit").value),
  );
}

async function openAssignDateModal() {
  if (!isCalendarManager || !window.PFCalendarTimeControls) return;
  const result = await window.PFCalendarTimeControls.openAssign({
    currentDay: currentAbsoluteDay(),
    currentSecond: currentSecond(),
    calendarConfig: calendarConfig(),
  });
  if (!result) return;
  await saveCalendarState({
    ...result,
    calendarConfig: calendarConfig(),
  });
}

async function openMoveDateModal() {
  if (!isCalendarManager || !window.PFCalendarTimeControls) return;
  const result = await window.PFCalendarTimeControls.openMove({
    calendarConfig: calendarConfig(),
  });
  if (!result) return;
  await saveCalendarState(movedState(result.amount, result.unit));
}

async function openEventModal(event = null) {
  if (!isCalendarManager) return;
  const result = await window.PFCalendarEventModal.open(
    event || {
      startDay: selectedDay,
      endDay: selectedDay,
      allDay: true,
      visibleToPlayers: true,
    },
    {
      defaultDay: selectedDay,
      calendarConfig: calendarConfig(),
      canDelete: Boolean(event?.id),
    },
  );
  if (!result) return;
  if (result.action === "delete") {
    const { error } = await PFApp.deleteCampaignCalendarEvent(
      result.event.id,
      calendarContextKey,
    );
    if (error) status(error.message || "Could not delete event.", "danger");
  } else if (result.action === "save") {
    const saved = await PFApp.saveCampaignCalendarEvent(
      result.event,
      calendarContextKey,
    );
    if (!saved) status("Could not save event.", "danger");
  }
  await loadCalendarContext(calendarContextKey, false);
}

async function shiftVisibleMonth(delta) {
  if (visibleYear <= 1 && visibleMonth <= 1 && delta < 0) return;
  visibleMonth += delta;
  while (visibleMonth < 1) {
    visibleMonth += 12;
    visibleYear -= 1;
  }
  while (visibleMonth > 12) {
    visibleMonth -= 12;
    visibleYear += 1;
  }
  visibleYear = Math.max(1, visibleYear);
  selectedDay = window.PFCalendarData.startOfMonthAbsoluteDay(
    visibleYear,
    visibleMonth,
    calendarConfig(),
  );
  await refreshVisibleEvents();
}

async function loadCalendarContext(contextKey, showLoading = true) {
  if (!contextKey || contextKey === "general") return;
  calendarContextKey = contextKey;
  if (showLoading) status("Loading calendar...", "secondary");

  const [contexts, manager, loadedState, loadedHolidays] = await Promise.all([
    PFApp.loadContexts(),
    PFApp.isGameManager(calendarContextKey),
    PFApp.loadCampaignCalendarState(calendarContextKey),
    window.PFHolidayData.loadHolidays(),
  ]);
  holidayRules = Array.isArray(loadedHolidays) ? loadedHolidays : [];
  holidayRangeCache = new Map();
  isCalendarManager = Boolean(manager);
  calendarContextLabel =
    contexts.find((context) => context.key === calendarContextKey)?.label ||
    "Current campaign";
  el("calendarCampaignLabel").textContent = calendarContextLabel;
  calendarState =
    loadedState ||
    {
      contextKey: calendarContextKey,
      currentDay: 1,
      currentSecond: 28800,
      calendarConfig: window.PFCalendarData.DEFAULT_CONFIG,
    };

  const currentDate = window.PFCalendarData.absoluteDayToDate(
    currentAbsoluteDay(),
    calendarConfig(),
  );
  visibleYear = currentDate.year;
  visibleMonth = currentDate.month;
  selectedDay = currentAbsoluteDay();

  const range = rangeForVisibleGrid();
  calendarEvents = await PFApp.loadCampaignCalendarEvents(
    calendarContextKey,
    range.startDay,
    range.endDay,
  );
  renderCalendar();
  subscribeCalendarRealtime();
  status("", "info");
}

async function refreshVisibleEvents() {
  const range = rangeForVisibleGrid();
  calendarEvents = await PFApp.loadCampaignCalendarEvents(
    calendarContextKey,
    range.startDay,
    range.endDay,
  );
  renderCalendar();
}

function subscribeCalendarRealtime() {
  if (calendarRealtimeChannel && PFApp.client) {
    PFApp.client.removeChannel(calendarRealtimeChannel);
  }
  if (!PFApp.client || !calendarContextKey) return;
  calendarRealtimeChannel = PFApp.client
    .channel(`campaign_calendar:${calendarContextKey}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign_calendar_state",
        filter: `context_key=eq.${calendarContextKey}`,
      },
      (payload) => {
        if (payload.new) {
          calendarState = {
            ...calendarState,
            currentDay: payload.new.current_day,
            currentSecond: payload.new.current_second,
            calendarConfig: payload.new.calendar_config || {},
          };
          renderCalendar();
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign_calendar_events",
        filter: `context_key=eq.${calendarContextKey}`,
      },
      () => refreshVisibleEvents(),
    )
    .subscribe();
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await PFApp.requireAuth();
  if (!user) return;

  calendarContextKey = await PFApp.requireGameContext();
  if (!calendarContextKey) return;
  await PFApp.renderAuthNav(user);

  el("assignMonth").innerHTML = monthOptions(1);
  el("newCalendarEventBtn").addEventListener("click", () => openEventModal());
  el("openAssignDateModalBtn").addEventListener("click", openAssignDateModal);
  el("openMoveDateModalBtn").addEventListener("click", openMoveDateModal);
  el("refreshCalendarBtn").addEventListener("click", () =>
    loadCalendarContext(calendarContextKey),
  );
  el("assignCurrentDateBtn").addEventListener("click", assignCurrentDate);
  el("moveTimeBtn").addEventListener("click", moveTime);
  el("previousMonthBtn").addEventListener("click", () => shiftVisibleMonth(-1));
  el("nextMonthBtn").addEventListener("click", () => shiftVisibleMonth(1));
  el("goToCurrentMonthBtn").addEventListener("click", () => {
    const date = window.PFCalendarData.absoluteDayToDate(
      currentAbsoluteDay(),
      calendarConfig(),
    );
    visibleYear = date.year;
    visibleMonth = date.month;
    selectedDay = currentAbsoluteDay();
    refreshVisibleEvents();
  });
  ["assignYear", "assignMonth"].forEach((id) => {
    el(id).addEventListener("change", () => {
      const year = Math.max(1, Number(el("assignYear").value || 1) || 1);
      const month = Math.min(
        12,
        Math.max(1, Number(el("assignMonth").value || 1) || 1),
      );
      el("assignDay").max = window.PFCalendarData.monthDays(
        month,
        year,
        calendarConfig(),
      );
    });
  });

  window.addEventListener("pf-context-change", (event) => {
    if (event.detail.contextKey && event.detail.contextKey !== "general") {
      loadCalendarContext(event.detail.contextKey);
    }
  });

  await loadCalendarContext(calendarContextKey);
});
