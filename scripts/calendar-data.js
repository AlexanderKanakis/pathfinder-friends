(function () {
  const WEEKDAYS = [
    "Moonday",
    "Toilday",
    "Wealday",
    "Oathday",
    "Fireday",
    "Starday",
    "Sunday",
  ];

  const MONTHS = [
    { index: 1, name: "Abadius", commonName: "Prima", days: 31, season: "Winter" },
    { index: 2, name: "Calistril", commonName: "Snappe", days: 28, season: "Winter" },
    { index: 3, name: "Pharast", commonName: "Anu", days: 31, season: "Spring" },
    { index: 4, name: "Gozran", commonName: "Rusanne", days: 30, season: "Spring" },
    { index: 5, name: "Desnus", commonName: "Farlong", days: 31, season: "Spring" },
    { index: 6, name: "Sarenith", commonName: "Sola", days: 30, season: "Summer" },
    { index: 7, name: "Erastus", commonName: "Fletch", days: 31, season: "Summer" },
    { index: 8, name: "Arodus", commonName: "Hazen", days: 31, season: "Summer" },
    { index: 9, name: "Rova", commonName: "Nuvar", days: 30, season: "Autumn" },
    { index: 10, name: "Lamashan", commonName: "Shaldo", days: 31, season: "Autumn" },
    { index: 11, name: "Neth", commonName: "Uoya", days: 30, season: "Autumn" },
    { index: 12, name: "Kuthona", commonName: "Kai", days: 31, season: "Winter" },
  ];

  const DEFAULT_CONFIG = {
    firstWeekdayIndex: 0,
    leapRule: "golarion8",
    leapYearAnchor: 4724,
    lunarCycleDays: 29.5,
    fullMoonEpochDay: 26,
    moonEventWindowDays: 0.55,
    seasonStartPercent: 0.21587,
    seasonLengthPercents: [0.25399, 0.25637, 0.24601, 0.24363],
  };

  function configWithDefaults(config = {}) {
    return {
      ...DEFAULT_CONFIG,
      ...(config || {}),
      firstWeekdayIndex: Number.isFinite(Number(config.firstWeekdayIndex))
        ? Number(config.firstWeekdayIndex)
        : DEFAULT_CONFIG.firstWeekdayIndex,
      lunarCycleDays:
        Number(config.lunarCycleDays) > 0
          ? Number(config.lunarCycleDays)
          : DEFAULT_CONFIG.lunarCycleDays,
      fullMoonEpochDay:
        Number(config.fullMoonEpochDay) > 0
          ? Number(config.fullMoonEpochDay)
          : DEFAULT_CONFIG.fullMoonEpochDay,
      leapYearAnchor:
        Number(config.leapYearAnchor) > 0
          ? Number(config.leapYearAnchor)
          : DEFAULT_CONFIG.leapYearAnchor,
      moonEventWindowDays:
        Number(config.moonEventWindowDays) > 0
          ? Number(config.moonEventWindowDays)
          : DEFAULT_CONFIG.moonEventWindowDays,
      seasonStartPercent:
        Number(config.seasonStartPercent) > 0
          ? Number(config.seasonStartPercent)
          : DEFAULT_CONFIG.seasonStartPercent,
      seasonLengthPercents: Array.isArray(config.seasonLengthPercents)
        ? config.seasonLengthPercents.map(Number)
        : DEFAULT_CONFIG.seasonLengthPercents,
    };
  }

  function isLeapYear(year, config = {}) {
    const activeConfig = configWithDefaults(config);
    const value = Number(year || 1);
    if (activeConfig.leapRule === "none") return false;
    if (activeConfig.leapRule === "golarion8") {
      return (value - activeConfig.leapYearAnchor) % 8 === 0;
    }
    return value % 4 === 0 && (value % 100 !== 0 || value % 400 === 0);
  }

  function golarionLeapYearsBefore(year, anchor) {
    const lastYear = Math.max(0, Number(year || 1) - 1);
    if (lastYear < 1) return 0;
    let firstLeap = Number(anchor || DEFAULT_CONFIG.leapYearAnchor);
    while (firstLeap > 1) firstLeap -= 8;
    while (firstLeap < 1) firstLeap += 8;
    if (firstLeap > lastYear) return 0;
    return Math.floor((lastYear - firstLeap) / 8) + 1;
  }

  function leapYearsBefore(year, config = {}) {
    const activeConfig = configWithDefaults(config);
    const lastYear = Math.max(0, Number(year || 1) - 1);
    if (activeConfig.leapRule === "none") return 0;
    if (activeConfig.leapRule === "golarion8") {
      return golarionLeapYearsBefore(year, activeConfig.leapYearAnchor);
    }
    return (
      Math.floor(lastYear / 4) -
      Math.floor(lastYear / 100) +
      Math.floor(lastYear / 400)
    );
  }

  function startOfYearAbsoluteDay(year, config = {}) {
    const safeYear = Math.max(1, Number(year || 1) || 1);
    return (safeYear - 1) * 365 + leapYearsBefore(safeYear, config) + 1;
  }

  function monthDays(monthIndex, year, config = {}) {
    const month = MONTHS[Number(monthIndex) - 1] || MONTHS[0];
    return month.index === 2 && isLeapYear(year, config)
      ? month.days + 1
      : month.days;
  }

  function daysInYear(year, config = {}) {
    return MONTHS.reduce(
      (total, month) => total + monthDays(month.index, year, config),
      0,
    );
  }

  function dateToAbsoluteDay(year, month, day, config = {}) {
    let total = startOfYearAbsoluteDay(year, config);
    for (let cursorMonth = 1; cursorMonth < Number(month || 1); cursorMonth += 1) {
      total += monthDays(cursorMonth, year, config);
    }
    return total + Math.max(0, Number(day || 1) - 1);
  }

  function absoluteDayToDate(absoluteDay, config = {}) {
    const target = Math.max(1, Number(absoluteDay || 1) || 1);
    let low = 1;
    let high = Math.max(1, Math.ceil(target / 365) + 2);
    while (startOfYearAbsoluteDay(high, config) <= target) {
      high *= 2;
    }
    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (startOfYearAbsoluteDay(mid, config) <= target) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    const year = low;
    let remaining = target - startOfYearAbsoluteDay(year, config) + 1;
    let month = 1;
    while (remaining > monthDays(month, year, config)) {
      remaining -= monthDays(month, year, config);
      month += 1;
    }

    return {
      year,
      month,
      day: remaining,
      monthName: MONTHS[month - 1]?.name || "Abadius",
      weekday: weekdayForAbsoluteDay(absoluteDay, config),
      season: MONTHS[month - 1]?.season || "",
    };
  }

  function weekdayForAbsoluteDay(absoluteDay, config = {}) {
    const activeConfig = configWithDefaults(config);
    const index =
      (Math.max(1, Number(absoluteDay || 1)) - 1 + activeConfig.firstWeekdayIndex) %
      WEEKDAYS.length;
    return WEEKDAYS[index];
  }

  function startOfMonthAbsoluteDay(year, month, config = {}) {
    return dateToAbsoluteDay(year, month, 1, config);
  }

  function minutesToTime(minutes = 0) {
    const normalized = Math.min(1439, Math.max(0, Number(minutes || 0) || 0));
    const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
    const mins = String(normalized % 60).padStart(2, "0");
    return `${hours}:${mins}`;
  }

  function secondsToTime(seconds = 0) {
    const normalized = Math.min(86399, Math.max(0, Number(seconds || 0) || 0));
    const hours = String(Math.floor(normalized / 3600)).padStart(2, "0");
    const mins = String(Math.floor((normalized % 3600) / 60)).padStart(2, "0");
    const secs = String(normalized % 60).padStart(2, "0");
    return secs === "00" ? `${hours}:${mins}` : `${hours}:${mins}:${secs}`;
  }

  function timeToMinutes(value = "00:00") {
    const [hours, minutes] = String(value || "00:00").split(":").map(Number);
    return Math.min(1439, Math.max(0, (hours || 0) * 60 + (minutes || 0)));
  }

  function timeToSeconds(value = "00:00") {
    const [hours, minutes, seconds] = String(value || "00:00")
      .split(":")
      .map(Number);
    return Math.min(
      86399,
      Math.max(0, (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0)),
    );
  }

  function moonPhaseForDay(absoluteDay, config = {}) {
    const activeConfig = configWithDefaults(config);
    const cycle = activeConfig.lunarCycleDays;
    const numericDay = Math.max(1, Number(absoluteDay || 1) || 1);
    const phases = [
      { key: "fullMoon", visualKey: "full-moon", name: "Somal full moon", offset: 0 },
      { key: "lastQuarter", visualKey: "semi-moon", name: "Somal last quarter", offset: cycle / 4 },
      { key: "newMoon", visualKey: "new-moon", name: "Somal new moon", offset: cycle / 2 },
      { key: "firstQuarter", visualKey: "semi-moon", name: "Somal first quarter", offset: (cycle * 3) / 4 },
    ];

    for (const phase of phases) {
      const approximateCycle = Math.round(
        (numericDay - activeConfig.fullMoonEpochDay - phase.offset) / cycle,
      );
      for (let cycleOffset = -1; cycleOffset <= 1; cycleOffset += 1) {
        const phaseDay =
          activeConfig.fullMoonEpochDay +
          (approximateCycle + cycleOffset) * cycle +
          phase.offset;
        if (Math.floor(phaseDay) === numericDay) {
          return { ...phase, age: phaseDay };
        }
      }
    }

    return { name: "", key: "", visualKey: "", age: 0 };
  }

  function seasonStartAbsoluteDay(year, seasonName, config = {}) {
    const activeConfig = configWithDefaults(config);
    const seasonIndex = ["Spring", "Summer", "Autumn", "Winter"].indexOf(
      seasonName,
    );
    if (seasonIndex < 0) return null;

    const percent = activeConfig.seasonLengthPercents
      .slice(0, seasonIndex)
      .reduce((total, value) => total + Number(value || 0), activeConfig.seasonStartPercent);
    const startOfYear = dateToAbsoluteDay(year, 1, 1, activeConfig);
    return startOfYear + Math.floor(percent * daysInYear(year, activeConfig));
  }

  function seasonEndAbsoluteDay(year, seasonName, config = {}) {
    const seasonNames = ["Spring", "Summer", "Autumn", "Winter"];
    const seasonIndex = seasonNames.indexOf(seasonName);
    if (seasonIndex < 0) return null;
    if (seasonIndex === seasonNames.length - 1) {
      const nextSpring = seasonStartAbsoluteDay(year + 1, "Spring", config);
      return nextSpring ? nextSpring - 1 : null;
    }
    const nextSeason = seasonStartAbsoluteDay(
      year,
      seasonNames[seasonIndex + 1],
      config,
    );
    return nextSeason ? nextSeason - 1 : null;
  }

  function generateMoonEvents(startDay, endDay, config = {}) {
    const events = [];
    for (let day = startDay; day <= endDay; day += 1) {
      const phase = moonPhaseForDay(day, config);
      if (!phase.key) continue;
      events.push({
        id: `moon:${phase.key}:${day}`,
        title: phase.name,
        description: "Somal lunar phase",
        startDay: day,
        startMinute: 0,
        endDay: day,
        endMinute: 0,
        allDay: true,
        eventType: phase.key,
        visibleToPlayers: true,
        generated: true,
      });
    }
    return events;
  }

  window.PFCalendarData = {
    WEEKDAYS,
    MONTHS,
    DEFAULT_CONFIG,
    configWithDefaults,
    isLeapYear,
    monthDays,
    daysInYear,
    dateToAbsoluteDay,
    absoluteDayToDate,
    leapYearsBefore,
    startOfYearAbsoluteDay,
    weekdayForAbsoluteDay,
    startOfMonthAbsoluteDay,
    minutesToTime,
    secondsToTime,
    timeToMinutes,
    timeToSeconds,
    moonPhaseForDay,
    generateMoonEvents,
    seasonStartAbsoluteDay,
    seasonEndAbsoluteDay,
  };
})();
