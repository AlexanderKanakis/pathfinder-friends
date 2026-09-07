(function () {
  const HOLIDAYS = [
      {
          "id": "dungeonetics-038",
          "name": "Abjurant Day",
          "category": "Religious",
          "observedBy": "Nethys",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 8,
          "commemorates": "Nethys",
          "description": "Day of communal strengthening of defenses and the teaching of magic to children.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-056",
          "name": "Admani Upastuti",
          "category": "Regional",
          "observedBy": "Jalmeray, Vudra",
          "rule": "firstMoonPhaseOfMonth",
          "month": 10,
          "moon": "Somal",
          "phase": "fullMoon",
          "commemorates": "Jalmeray, Vudra",
          "description": "Holiday marking the founding of Jalmeray.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-sarenith-first-day-of-summer-admiral-s-advent",
          "name": "Admiral's Advent",
          "category": "Wiki",
          "observedBy": "Bloodcove",
          "commemorates": "Bloodcove",
          "description": "This honors Grand Admiral Harthwik Barzoni's life and health. Citizens embrace it as a chance to bake treats, celebrate, and fill the streets with music from horns, strings, flutes, and drums.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1
      },
      {
          "id": "dungeonetics-037",
          "name": "All Kings Day",
          "category": "Regional",
          "observedBy": "Galt",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 5,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-100",
          "name": "Allbirth",
          "category": "Religious",
          "observedBy": "Lamashtu",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 27,
          "commemorates": "Lamashtu",
          "description": "A Lamashtan occult celebration of monsters. In Katapesh, and increasingly elsewhere, it is celebrated more broadly as a gruesome masquerade popular among dromaars and goblins.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-080",
          "name": "Angel Day",
          "category": "Local",
          "observedBy": "Magnimar, Varisia",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 31,
          "commemorates": "Magnimar, Varisia",
          "description": "A day of masquerades acting as a celebration to the Empyreal Lords",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-desnus-31-apprentice-appreciation-day",
          "name": "Apprentice Appreciation Day",
          "category": "Wiki",
          "observedBy": "Nethys",
          "commemorates": "Nethys",
          "description": "Celebration of an apprentice's achievements in the last year, with the possibility of a friendly magic duel.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 31
      },
      {
          "id": "wiki-erastus-3-archer-s-day-or-archerfeast",
          "name": "Archer's Day or Archerfeast",
          "category": "Wiki",
          "observedBy": "Erastil",
          "commemorates": "Erastil",
          "description": "Holy day celebrated with archery contests, bartering for livestock, and the courting of women.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 7,
          "day": 3
      },
      {
          "id": "dungeonetics-021",
          "name": "Archerfeast",
          "category": "Religious",
          "observedBy": "Erastil",
          "rule": "dayOfMonth",
          "month": 7,
          "day": 3,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-029",
          "name": "Armasse",
          "category": "Religious",
          "observedBy": "Aroden, Iomedae, Milani",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 16,
          "commemorates": "Aroden, Iomedae, Milani",
          "description": "Holy day where commoners are trained to fight and historical tales are told with the hope that someone will learn from them.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-035",
          "name": "Ascendance Day",
          "category": "Religious",
          "observedBy": "Iomedae",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 6,
          "commemorates": "Iomedae",
          "description": "Holiday marking the ascension of the goddess Iomedae after taking the Test of the Starstone.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-044",
          "name": "Ascendance Day",
          "category": "Religious",
          "observedBy": "Cayden Cailean",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 11,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-014",
          "name": "Ascendance Night",
          "category": "Religious",
          "observedBy": "Norgorber",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 2,
          "commemorates": "Norgorber",
          "description": "Day marking the apotheosis of the Reaper of Reputation.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-abadius-11-ascension-day",
          "name": "Ascension Day",
          "category": "Wiki",
          "observedBy": "Cayden Cailean",
          "commemorates": "Cayden Cailean",
          "description": "Holiday celebrating Cayden's divine ascension after taking the Test of the Starstone.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 11
      },
      {
          "id": "wiki-rova-16-30-autumnal-carpentry-court",
          "name": "Autumnal Carpentry Court",
          "category": "Wiki",
          "observedBy": "Andoran",
          "commemorates": "Andoran",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dateRange",
          "month": 9,
          "day": 16,
          "endMonth": 9,
          "endDay": 30
      },
      {
          "id": "dungeonetics-079",
          "name": "Azvadeva Dejal",
          "category": "Religious",
          "observedBy": "Gruhastha",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 3,
          "commemorates": "Gruhastha",
          "description": "Celebration of the revelation of the Azvadeva Pujila, with gifts of books, celebrations of knowledge, blessing of animals, and a vegetarian feast. See also #Azvadeva Dejal (Niswan).",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-104",
          "name": "Baptism of Ice",
          "category": "Regional",
          "observedBy": "Irrisen",
          "rule": "dateRange",
          "month": 11,
          "day": 24,
          "endMonth": 11,
          "endDay": 30,
          "commemorates": "Irrisen",
          "description": "A fertility festival where the children born in the previous year are paraded through the towns.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-098",
          "name": "Bastion Day",
          "category": "Local",
          "observedBy": "Solku",
          "rule": "dateRange",
          "month": 10,
          "day": 19,
          "endMonth": 10,
          "endDay": 20,
          "commemorates": "Solku",
          "description": "A festival honoring the founding of the town of Solku.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-005",
          "name": "Batul al-Alim",
          "category": "Regional",
          "observedBy": "Qadira",
          "rule": "nthWeekdayOfMonth",
          "month": 2,
          "weekday": "Oathday",
          "n": -1,
          "commemorates": "Qadira",
          "description": "This holiday commemorates the birth of the romantic Qadiran poet Batul al-Alim.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-calistril-all-month-benga",
          "name": "Benga",
          "category": "Wiki",
          "observedBy": "Atas Pulu, Minata",
          "commemorates": "Atas Pulu, Minata",
          "description": "Month-long flower festival.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "month",
          "month": 2
      },
      {
          "id": "wiki-kuthona-winter-solstice-bloodletting-night",
          "name": "Bloodletting Night",
          "category": "Wiki",
          "observedBy": "Camazotz",
          "commemorates": "Camazotz",
          "description": "The longest night serves as the longest hunt for worshippers of the Lord of Stolen Blood, who attempt to kill and capture as many victims as they can.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1
      },
      {
          "id": "wiki-sarenith-week-preceding-summer-solstice-blossom-days",
          "name": "Blossom Days",
          "category": "Wiki",
          "observedBy": "Jolizpan, Xopatl",
          "commemorates": "Jolizpan, Xopatl",
          "description": "A week-long festival celebrating the birth of the City of Flowers after Earthfall.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "daysBeforeSeason",
          "season": "Summer",
          "days": 7
      },
      {
          "id": "dungeonetics-081",
          "name": "Breaching Festival",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "nthWeekdayOfMonth",
          "month": 5,
          "weekday": "Sunday",
          "n": -1,
          "commemorates": "Korvosa",
          "description": "Yearly festival in which contestants try to break through the magical wards protecting the Academae.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-018",
          "name": "Burning Blades",
          "category": "Religious",
          "observedBy": "Sarenrae",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 10,
          "commemorates": "Sarenrae",
          "description": "The holy, month-long festival ends on this day, featuring dances with flaming blades.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-023",
          "name": "Burning Night",
          "category": "Regional",
          "observedBy": "Razmiran",
          "rule": "dayOfMonth",
          "month": 7,
          "day": 17,
          "commemorates": "Razmiran",
          "description": "Items or people who have transgressed against the god-king of Razmiran are burned on this day.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-066",
          "name": "Candlemark",
          "category": "Religious",
          "observedBy": "Sarenrae",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Sarenrae",
          "description": "Holiday reminding the faithful that the Dawnflower's power to heal and redeem is always with her, even during the sun's weakest day. The day is also seen as a time to look forward to longer days.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-009",
          "name": "Conquest Day",
          "category": "Regional",
          "observedBy": "Nex",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 26,
          "commemorates": "Nex",
          "description": "A national holiday in which citizens of Nex renew their pledge to conquer their eternal enemy, Geb.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-092",
          "name": "Crabfest",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "nthWeekdayOfMonth",
          "month": 9,
          "weekday": "Wealday",
          "n": 1,
          "commemorates": "Korvosa",
          "description": "Fall is crab season on Conqueror's Bay, and this feast day is filled with the eating of them.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-arodus-6-crusader-memorial-day",
          "name": "Crusader Memorial Day",
          "category": "Wiki",
          "observedBy": "First Crusader Day, Mendev",
          "commemorates": "First Crusader Day, Mendev",
          "description": "Holiday in celebration of the continuing crusade against the demons of the Worldwound.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 6
      },
      {
          "id": "dungeonetics-052",
          "name": "Crystalhue",
          "category": "Religious",
          "observedBy": "Shelyn",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Shelyn",
          "description": "Holiday marked by the creation of artistic works, and the start of romantic courtships.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-010",
          "name": "Currentseve",
          "category": "Religious",
          "observedBy": "Gozreh",
          "rule": "dayOfMonth",
          "month": 4,
          "day": 7,
          "commemorates": "Gozreh",
          "description": "On this religious holiday, all who travel on the water make offerings to Gozreh in the hopes of safe passage for the coming year.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-sarenith-10-darkness-eternal",
          "name": "Darkness Eternal",
          "category": "Wiki",
          "observedBy": "Asmodeus",
          "commemorates": "Asmodeus",
          "description": "The church of Asmodeus curses the long summer days, praying for the darkness of winter to arrive early.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 10
      },
      {
          "id": "dungeonetics-007",
          "name": "Day of Bones",
          "category": "Religious",
          "observedBy": "Pharasma",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 5,
          "commemorates": "Pharasma",
          "description": "Priests and worshipers of the Lady of Graves parade the bodies of the recently dead on this holiday, holding free burials afterwards.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-083",
          "name": "Day of Destiny Festival",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 3,
          "commemorates": "Korvosa",
          "description": "This day celebrates the day the emperor of Cheliax signed the charter for the founding of the city of Korvosa.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-064",
          "name": "Day of Gritted Teeth",
          "category": "Religious",
          "observedBy": "Zyphus",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 5,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "wiki-kuthona-11-day-of-order",
          "name": "Day of Order",
          "category": "Wiki",
          "observedBy": "Asmodeus",
          "commemorates": "Asmodeus",
          "description": "Though the event lacks a knowable date, Asmodeus's slaying of Ihys is commemorated this day, intentionally chosen to overlap with Cayden's Ascension Day.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 11
      },
      {
          "id": "dungeonetics-028",
          "name": "Day of Silenced Whispers",
          "category": "Regional",
          "observedBy": "Ustalav",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 9,
          "commemorates": "Ustalav",
          "description": "Holiday celebrating the defeat of the Whispering Tyrant and the freeing of Ustalav.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-094",
          "name": "Day of Sundering",
          "category": "Religious",
          "observedBy": "Ydersius",
          "rule": "dayOfMonth",
          "month": 9,
          "day": 29,
          "commemorates": "Ydersius",
          "description": "Once many holidays were celebrated by the faith of Ydersius, but today only this date has much significance.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-033",
          "name": "Day of the Inheritor",
          "category": "Religious",
          "observedBy": "Iomedae",
          "rule": "dayOfMonth",
          "month": 9,
          "day": 19,
          "commemorates": "Iomedae",
          "description": "Holiday commemorating the church of Iomedae's adoption of the forlorn faithful of the dead god Aroden into their midst.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-074",
          "name": "Days of Wrath",
          "category": "Regional",
          "observedBy": "Cheliax, Asmodeus",
          "rule": "nthDayOfSeason",
          "season": "Autumn",
          "n": 1,
          "commemorates": "Cheliax, Asmodeus",
          "description": "Contests and blood sports are held to honor and elevate those who are superior.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-108",
          "name": "Days of Wrath",
          "category": "Regional",
          "observedBy": "Cheliax, Asmodeus",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Cheliax, Asmodeus",
          "description": "Contests and blood sports are held to honor and elevate those who are superior.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-077",
          "name": "Eternal Kiss",
          "category": "Religious",
          "observedBy": "Zon-Kuthon",
          "rule": "firstMoonPhaseOfMonth",
          "month": 1,
          "moon": "Somal",
          "phase": "newMoon",
          "commemorates": "Zon-Kuthon",
          "description": "This 11-day festival culminates on the first new moon of the new year. It involves soothsaying using the entrails of a sacrificial victim.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-039",
          "name": "Even-Tongued Day",
          "category": "Regional",
          "observedBy": "Cheliax, Asmodeus, Milani",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 14,
          "commemorates": "Cheliax, Asmodeus, Milani",
          "description": "Day that celebrates when Andoran, Galt, and Isger were put under Chelaxian control. Milanites celebrate the freedom from Taldor.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-040",
          "name": "Evoking Day",
          "category": "Religious",
          "observedBy": "Nethys",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 18,
          "commemorates": "Nethys",
          "description": "Holiday marked by displays of fireworks and magical duels (both mock and real).",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-070",
          "name": "Fateless Day",
          "category": "Religious",
          "observedBy": "Mahathallah",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 29,
          "description": "Followers of Mahathallah mark each leap day as Fateless Day, when the River of Souls temporarily stops and souls can escape Pharasma's judgment. They perform many sacrificial and suicidal rituals on Fateless Day.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-093",
          "name": "Feast of Szurpada",
          "category": "Regional",
          "observedBy": "Irrisen",
          "rule": "dayOfMonth",
          "month": 9,
          "day": 26,
          "commemorates": "Irrisen",
          "description": "This \"celebration of plenty\" festival mocks the traditional harvest festivals celebrated in the region before Baba Yaga and her eternal winter descended upon the land.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-calistril-14-feast-of-vigor",
          "name": "Feast of Vigor",
          "category": "Wiki",
          "observedBy": "Calistria",
          "commemorates": "Calistria",
          "description": "A communal, hedonistic celebration of pleasure.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 14
      },
      {
          "id": "dungeonetics-095",
          "name": "Festival of Night's Return",
          "category": "Regional",
          "observedBy": "Nidal",
          "rule": "nthDayOfSeason",
          "season": "Autumn",
          "n": 1,
          "commemorates": "Nidal",
          "description": "Celebrated throughout Nidal, this holiday involves the burning of effigies and self-flagellation.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-neth-first-starday-festival-of-the-making-and-breaking",
          "name": "Festival of the Making and Breaking",
          "category": "Wiki",
          "observedBy": "Nethys",
          "commemorates": "Nethys",
          "description": "Artisans teach children to build something which, come evening, is then destroyed by teachers of magic in a vibrant elemental display.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthWeekdayOfMonth",
          "month": 11,
          "weekday": "Starday",
          "n": 1
      },
      {
          "id": "dungeonetics-085",
          "name": "Festival of the Ruling Sun",
          "category": "Religious",
          "observedBy": "Shizuru",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Shizuru",
          "description": "Celebrates the longest day.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-101",
          "name": "Festival of the Witch",
          "category": "Regional",
          "observedBy": "Irrisen",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 27,
          "commemorates": "Irrisen",
          "description": "Festival celebrating witchcraft and the central part it plays in Irriseni culture.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-gozran-24-find-of-the-cayhound",
          "name": "Find of the Cayhound",
          "category": "Wiki",
          "observedBy": "Cayden Cailean",
          "commemorates": "Cayden Cailean",
          "description": "Commemorates Cayden's finding of his mastiff companion Thunder.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 4,
          "day": 24
      },
      {
          "id": "dungeonetics-027",
          "name": "First Crusader Day",
          "category": "Regional",
          "observedBy": "Mendev",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 6,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-075",
          "name": "First Cut",
          "category": "Local",
          "observedBy": "Falcon's Hollow",
          "rule": "nthDayOfSeason",
          "season": "Spring",
          "n": 1,
          "commemorates": "Falcon's Hollow",
          "description": "This start of spring celebration marks the start of work in the woods.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-082",
          "name": "First day of summer",
          "category": "Religious",
          "observedBy": "Sarenrae",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Sarenrae",
          "description": "The church of the Dawnflower reveres this as a holiday.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-046",
          "name": "Firstbloom",
          "category": "Religious",
          "observedBy": "Gozreh",
          "rule": "nthDayOfSeason",
          "season": "Spring",
          "n": 1,
          "commemorates": "Gozreh",
          "description": "Fertility dances celebrate the coming of spring.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-002",
          "name": "Foundation Day",
          "category": "Regional",
          "observedBy": "Absalom, Milani",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 1,
          "commemorates": "Absalom, Milani",
          "description": "A civil holiday celebrating the foundation of the city by the god Aroden. Milanites observe a minute of silence in honor of Aroden saluting Milani.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-abadius-7-founder-s-day",
          "name": "Founder's Day",
          "category": "Wiki",
          "observedBy": "Linvarre",
          "commemorates": "Linvarre",
          "description": "Commemorates General Orphyrea Amanandar's victory against the bandit warlords of Kamikobu.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 7
      },
      {
          "id": "dungeonetics-086",
          "name": "Founder's Folly",
          "category": "Local",
          "observedBy": "Ular Kel",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Ular Kel",
          "description": "Adventurers and children follow a hallucinatory red stripe along zigzagging paths, amusing residents.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-089",
          "name": "Founding Day",
          "category": "Local",
          "observedBy": "Ilsurian, Varisia",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 10,
          "commemorates": "Ilsurian, Varisia",
          "description": "Festival celebrating the founding by Ilsur of the town of Ilsurian in 4631 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-022",
          "name": "Founding Festival",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 7,
          "day": 14,
          "commemorates": "Korvosa",
          "description": "An all-night party filled with fireworks and alcohol commemorating the founding of the city in 4407 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-076",
          "name": "Gala of Sails",
          "category": "Regional",
          "observedBy": "Absalom",
          "rule": "dayOfMonth",
          "month": 4,
          "day": 27,
          "commemorates": "Absalom",
          "description": "One of two local festivals where kite-battlers compete.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-016",
          "name": "Goblin Flea Market",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "nthWeekdayOfMonth",
          "month": 5,
          "weekday": "Sunday",
          "n": -1,
          "commemorates": "Andoran",
          "description": "A market day that focuses on unusual crafts and offers games to children who dress up for the occasion.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-020",
          "name": "Goblin Flea Market",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "nthWeekdayOfMonth",
          "month": 6,
          "weekday": "Sunday",
          "n": -1,
          "commemorates": "Andoran",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-026",
          "name": "Goblin Flea Market",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "nthWeekdayOfMonth",
          "month": 7,
          "weekday": "Sunday",
          "n": -1,
          "commemorates": "Andoran",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-071",
          "name": "Golemwalk Parade",
          "category": "Local",
          "observedBy": "Magnimar, Varisia",
          "rule": "nthWeekdayOfMonth",
          "month": 3,
          "weekday": "Sunday",
          "n": 1,
          "commemorates": "Magnimar, Varisia",
          "description": "A parade of golems made by amateurs hoping to win a monetary grant from the Golemworks. At the end of the parade, the constructs are judged.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-kuthona-23-grand-day-of-independence",
          "name": "Grand Day of Independence",
          "category": "Wiki",
          "observedBy": "Linvarre",
          "commemorates": "Linvarre",
          "description": "A firework-filled celebration of independence from Taldor.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 23
      },
      {
          "id": "dungeonetics-103",
          "name": "Great Fire Remembrance",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 13,
          "commemorates": "Korvosa",
          "description": "Holiday commemorates the dead of the Great Fire of 4429 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-060",
          "name": "Harmattan Revel",
          "category": "Religious",
          "observedBy": "Besmara",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-087",
          "name": "Harvest Bounty Festival",
          "category": "Local",
          "observedBy": "Segada",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Segada",
          "description": "Marking the beginning of the harvest season, this festival involves sporting tournaments, dancing, storytelling, and feasts. Celebrants give thanks and eliminate grudges.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-034",
          "name": "Harvest Feast",
          "category": "General",
          "observedBy": "",
          "rule": "nthWeekdayOfMonth",
          "month": 10,
          "weekday": "Moonday",
          "n": 2,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-050",
          "name": "Harvest Feast",
          "category": "Religious",
          "observedBy": "Erastil",
          "rule": "nthDayOfSeason",
          "season": "Autumn",
          "n": 1,
          "description": "Harvest celebration marking the end of many agricultural activities with the coming of winter.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-neth-5-independence-day",
          "name": "Independence Day",
          "category": "Wiki",
          "observedBy": "Galt",
          "commemorates": "Galt",
          "description": "Marks the beginning of the Red Revolution.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 5
      },
      {
          "id": "dungeonetics-065",
          "name": "Inheritor's Ascendance",
          "category": "Religious",
          "observedBy": "Iomedae",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 1,
          "commemorates": "Iomedae",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-036",
          "name": "Jestercap",
          "category": "Regional",
          "observedBy": "Andoran, Druma, Taldor",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 27,
          "commemorates": "Andoran, Druma, Taldor",
          "description": "Holiday marked by the playing of many practical jokes; particularly popular among gnomes.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-008",
          "name": "Kaliashahrim",
          "category": "Regional",
          "observedBy": "Qadira",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 13,
          "commemorates": "Qadira",
          "description": "This national holiday celebrates the Padishah Emperor and Qadira's allegiance to him.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-erastus-15-21-kianidi-festival",
          "name": "Kianidi Festival",
          "category": "Wiki",
          "observedBy": "Garundi",
          "commemorates": "Garundi",
          "description": "Celebration where tribal ties are honored and stories of travels are shared.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dateRange",
          "month": 7,
          "day": 15,
          "endMonth": 7,
          "endDay": 21
      },
      {
          "id": "dungeonetics-078",
          "name": "King Eodred II's Birthday",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 16,
          "commemorates": "Korvosa",
          "description": "A probably now defunct holiday honoring King Eodred (given the King's death in 4708 AR) on the occasion of his birthday.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-lamashan-15-kraken-carnival",
          "name": "Kraken Carnival",
          "category": "Wiki",
          "observedBy": "Absalom",
          "commemorates": "Absalom",
          "description": "The second of two local festivals where kite-battlers compete.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 15
      },
      {
          "id": "dungeonetics-097",
          "name": "Kraken Festival",
          "category": "Local",
          "observedBy": "Absalom",
          "rule": "dayOfMonth",
          "month": 10,
          "day": 6,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-091",
          "name": "Last day of summer",
          "category": "Religious",
          "observedBy": "Sarenrae",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": -1,
          "commemorates": "Sarenrae",
          "description": "The church of the Dawnflower reveres this as a holiday.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-006",
          "name": "Leap Day",
          "category": "General",
          "observedBy": "",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 29,
          "description": "Every eight years an extra day is added to the end of the month of Calistril, in order to keep calendars accurate. The next leap year will take place in 4720 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-017",
          "name": "Liberty Day",
          "category": "Regional",
          "observedBy": "Andoran, Milani",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 3,
          "commemorates": "Andoran, Milani",
          "description": "Holiday celebrating Andoran's independence. Milanites celebrate that very little violence occurred.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-109",
          "name": "Long Dark Night",
          "category": "Local",
          "observedBy": "Segada",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Segada",
          "description": "Celebrants welcome the ascendant sun's return.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-054",
          "name": "Longnight",
          "category": "General",
          "observedBy": "",
          "rule": "firstMoonPhaseOfMonth",
          "month": 1,
          "moon": "Somal",
          "phase": "fullMoon",
          "description": "All-night festival in which revelers defy the darkness of winter and stay up to greet the dawn. In chilly Irrisen, entire communities gather for annual dances on this night.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-sarenith-summer-solstice-longwalk",
          "name": "Longwalk",
          "category": "Wiki",
          "observedBy": "Grandmother Spider, Nurvatcha; southern hemisphere winter solstice",
          "commemorates": "Grandmother Spider, Nurvatcha; southern hemisphere winter solstice",
          "description": "Celebrates the escape of Nurvatcha's anadi people from bondage, in part thanks to Grandmother Spider lengthening their cover of darkness in their escape.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1
      },
      {
          "id": "dungeonetics-004",
          "name": "Loyalty Day",
          "category": "Regional",
          "observedBy": "Cheliax, Asmodeus",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 19,
          "commemorates": "Cheliax, Asmodeus",
          "description": "This national holiday commemorates the signing of the Treaty of Egorian which ended Cheliax's civil war and installed the diabolic House Thrune on the throne.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-003",
          "name": "Merrymead",
          "category": "General",
          "observedBy": "Druma, Cayden Cailean",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 2,
          "commemorates": "Druma, Cayden Cailean",
          "description": "During this holiday in celebration of the approaching Spring, the previous year's alcohol is consumed.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-abadius-full-moon-mooncall",
          "name": "Mooncall",
          "category": "Wiki",
          "observedBy": "Camazotz",
          "commemorates": "Camazotz",
          "description": "Werecreature worshippers of the Lord of Stolen Blood revel during the night of the full moon, when their powers are at their peak. They engage in hunts as well as violence against each other. Other worshipers of Camazotz also hunt during the night, or seek to become werecreatures themselves.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "firstMoonPhaseOfMonth",
          "month": 1,
          "moon": "Somal",
          "phase": "fullMoon"
      },
      {
          "id": "wiki-pharast-20-mourningfell",
          "name": "Mourningfell",
          "category": "Wiki",
          "observedBy": "Arazni, Iomedae",
          "commemorates": "Arazni, Iomedae",
          "description": "Marking the day Arazni was killed by Tar-Baphon, the church of Iomedae treats this as a day of mourning while Arazni's faithful refocus on tenets of personal endurance.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 20
      },
      {
          "id": "dungeonetics-001",
          "name": "New Year",
          "category": "General",
          "observedBy": "",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 1,
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-073",
          "name": "Night of Tears",
          "category": "Local",
          "observedBy": "Solku",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 7,
          "commemorates": "Solku",
          "description": "A solemn vigil commemorating those lost in the Battle of Red Hail in 4701 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-045",
          "name": "Night of the Pale",
          "category": "General",
          "observedBy": "",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 31,
          "description": "Night of morbid revelry, as people wait indoors for the ghosts of last year's dead to pass by their homes.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-015",
          "name": "Old-Mage Day",
          "category": "Local",
          "observedBy": "Nantambu, Mwangi Expanse",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 13,
          "commemorates": "Nantambu, Mwangi Expanse",
          "description": "Holiday celebrating Old-Mage Jatembe, the father of Garundi magic.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-067",
          "name": "Pjallarane Day",
          "category": "Regional",
          "observedBy": "Irrisen",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 1,
          "commemorates": "Irrisen",
          "description": "This Irrisen New Year celebration commemorates the one-day rebellion launched by Queen Pjallarane against her mother, Baba Yaga.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-047",
          "name": "Planting Week",
          "category": "Religious",
          "observedBy": "Erastil",
          "rule": "nthDayOfSeason",
          "season": "Spring",
          "n": 1,
          "commemorates": "Erastil",
          "description": "This holy week to the god Erastil is a time of heavy work in the fields for farmers.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-107",
          "name": "Pseudodragon Festival",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 7,
          "commemorates": "Korvosa",
          "description": "Holiday marking the return of the wild pseudodragons to Conqueror's Bay.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-055",
          "name": "Remembrance Moon",
          "category": "Regional",
          "observedBy": "Iomedae, Lastwall, Ustalav",
          "rule": "firstMoonPhaseOfMonth",
          "month": 5,
          "moon": "Somal",
          "phase": "fullMoon",
          "commemorates": "Iomedae, Lastwall, Ustalav",
          "description": "A national holiday to commemorate those who died in the Shining Crusade against the Whispering Tyrant. Although not strictly a religious holiday, Iomedae's name is heavily invoked, due to her many military accomplishments during the war.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-048",
          "name": "Ritual of Stardust",
          "category": "Religious",
          "observedBy": "Desna",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Desna",
          "description": "Festival held in the evening and through the night, where Desna's faithful sing songs and throw sand and powdered gems into bonfires.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-053",
          "name": "Ritual of Stardust",
          "category": "Religious",
          "observedBy": "Desna",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Desna",
          "description": "Bi-annual festival held on the solstices, where the faithful of Desna sing songs through the night around bonfires.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-084",
          "name": "Riverwind Festival",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 22,
          "commemorates": "Korvosa",
          "description": "An early summer holiday that honors a cooling shift in the winds, celebrated with much drinking.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-069",
          "name": "Ruby Prince's Birthday",
          "category": "Regional",
          "observedBy": "Osirion",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 20,
          "commemorates": "Osirion",
          "description": "A national holiday in honor of the birthday of Khemet III, the Ruby Prince.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-088",
          "name": "Runefeast",
          "category": "Religious",
          "observedBy": "Magrim",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Magrim",
          "description": "Day marking the day dwarves learnt the first runes and the proper way to pray.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-072",
          "name": "Sable Company Founding Day",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 3,
          "day": 6,
          "commemorates": "Korvosa",
          "description": "A military holiday marked by parades, celebrating the founding of the Sable Company in 4409 AR.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-090",
          "name": "Saint Alika's Birthday",
          "category": "Local",
          "observedBy": "Korvosa",
          "rule": "dayOfMonth",
          "month": 8,
          "day": 31,
          "commemorates": "Korvosa",
          "description": "Quiet holiday honoring the birth of Saint Alika the Martyr.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-063",
          "name": "Seven Veils",
          "category": "General",
          "observedBy": "Sivanah",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 7,
          "commemorates": "Sivanah",
          "description": "Most common date for the celebration of unity across ancestries and the diversity of human, elf, halfling, gnome, aranea, and naga traditions, in honor of Sivanah's veils. This is a day of entertainment with comic performances, jokes, illusions, and masquerade balls.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-041",
          "name": "Seven Veils (IS World Guide)",
          "category": "General",
          "observedBy": "Sivanah",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 23,
          "source": "Dungeonetics",
          "sourceUrl": "https://www.dungeonetics.com/calendar/index.php?desktop=true"
      },
      {
          "id": "dungeonetics-032",
          "name": "Signing Day",
          "category": "Regional",
          "observedBy": "Andoran, Cheliax, Galt, Isger",
          "rule": "nthWeekdayOfMonth",
          "month": 9,
          "weekday": "Oathday",
          "n": 2,
          "commemorates": "Andoran, Cheliax, Galt, Isger",
          "description": "Festival marking the day these nations gained their independence from Taldor.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-030",
          "name": "Silverglazer Sunday",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "nthWeekdayOfMonth",
          "month": 8,
          "weekday": "Sunday",
          "n": -1,
          "commemorates": "Andoran",
          "description": "Two-part fishing festival celebrated with swimming contests and enormous puppets.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-031",
          "name": "Silverglazer Sunday",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "nthWeekdayOfMonth",
          "month": 9,
          "weekday": "Sunday",
          "n": 1,
          "commemorates": "Andoran",
          "description": "Second part of a two-part festival (see above).",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-rova-6-start-of-classes",
          "name": "Start of Classes",
          "category": "Wiki",
          "observedBy": "Acadamae, Arcanamirium, College of Mysteries, Clockwork Cathedral",
          "commemorates": "Acadamae, Arcanamirium, College of Mysteries, Clockwork Cathedral",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 9,
          "day": 6
      },
      {
          "id": "wiki-desnus-13-suha-suha",
          "name": "Suha-Suha",
          "category": "Wiki",
          "observedBy": "Minata",
          "commemorates": "Minata",
          "description": "Harvest festival with emphasis on showing gratitude to local spirits.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 5,
          "day": 13
      },
      {
          "id": "dungeonetics-049",
          "name": "Sunwrought Festival",
          "category": "Religious",
          "observedBy": "Sarenrae, Brigh",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Sarenrae, Brigh",
          "description": "Day commemorating the defeat of Rovagug by Sarenrae, celebrated with the flying of kites, fireworks, and gift giving.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-051",
          "name": "Swallowtail Festival",
          "category": "Religious",
          "observedBy": "Desna",
          "rule": "nthDayOfSeason",
          "season": "Autumn",
          "n": 1,
          "commemorates": "Desna",
          "description": "Holiday celebrated with storytelling, feasting, and the release of butterflies.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-019",
          "name": "Talon Tag",
          "category": "Regional",
          "observedBy": "Andoran",
          "rule": "dayOfMonth",
          "month": 6,
          "day": 21,
          "commemorates": "Andoran",
          "description": "The Eagle Knights perform aerial displays in Almas on this day.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-lamashan-last-sunday-tamung",
          "name": "Tamung",
          "category": "Wiki",
          "observedBy": "Tengah Pulu, Minata",
          "commemorates": "Tengah Pulu, Minata",
          "description": "A wandering carnival of dancers and performers roves from village to village on this holiday.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthWeekdayOfMonth",
          "month": 10,
          "weekday": "Sunday",
          "n": -1
      },
      {
          "id": "dungeonetics-011",
          "name": "Taxfest",
          "category": "Religious",
          "observedBy": "Abadar, Brigh",
          "rule": "dayOfMonth",
          "month": 4,
          "day": 15,
          "commemorates": "Abadar, Brigh",
          "description": "Priests of the Abadar accompany tax collectors on this holiday. After completing their duties, the church sponsors large (and free) public celebrations to help mend relations with common folk. Brigh's faithful help to confirm that the tax calculations are correct.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-calistril-day-before-spring-tempest-day",
          "name": "Tempest Day",
          "category": "Wiki",
          "observedBy": "Bloodcove",
          "commemorates": "Bloodcove",
          "description": "On the eve of spring, this day marks the calm before the storm. As the dry season ends, it inspires toasts to past successes and prayers to the gods for safe journeys in the coming wet season.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "nthDayOfSeason",
          "season": "Spring",
          "n": -1
      },
      {
          "id": "dungeonetics-102",
          "name": "The Feast of the Survivors",
          "category": "Regional",
          "observedBy": "Zon-Kuthon, Nidal",
          "rule": "nthWeekdayOfMonth",
          "month": 10,
          "weekday": "Moonday",
          "n": 3,
          "commemorates": "Zon-Kuthon, Nidal",
          "description": "A harvest festival signifying the centuries of Nidalese ancestors protected by Zon-Kuthon. The ceremonial tables are made of human bones of community members from past generations.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-061",
          "name": "The Final Day",
          "category": "Religious",
          "observedBy": "Groetus",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 31,
          "commemorates": "Groetus",
          "description": "Cultists of Groetus perform an hour's silence at dusk on the last day of the year and seek guidance from their god about the End Time.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-calistril-1-the-ritual-of-the-whip-sting",
          "name": "The Ritual of the Whip Sting",
          "category": "Wiki",
          "observedBy": "Calistria",
          "commemorates": "Calistria",
          "description": "Day of revenge where priests facilitate acts of public vengeance for the wronged, forbidding further reprisal once the agreed upon vengence is completed.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 1
      },
      {
          "id": "dungeonetics-106",
          "name": "The Shadowchaining",
          "category": "Regional",
          "observedBy": "Zon-Kuthon, Nidal",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 1,
          "commemorates": "Zon-Kuthon, Nidal",
          "description": "Commemorating the Midnight Lord's gift of shadow animals.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-058",
          "name": "Time of Reminiscence",
          "category": "Religious",
          "observedBy": "Apsu",
          "rule": "nthDayOfSeason",
          "season": "Winter",
          "n": 1,
          "commemorates": "Apsu",
          "description": "A day of solitude, remembering past events, allies, and lovers.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-042",
          "name": "Transmutatum",
          "category": "Religious",
          "observedBy": "Nethys",
          "rule": "dayOfMonth",
          "month": 11,
          "day": 28,
          "commemorates": "Nethys",
          "description": "Festival promoting self-improvement.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-calistril-29-tricksters-triumph",
          "name": "Tricksters' Triumph",
          "category": "Wiki",
          "observedBy": "Calistria",
          "commemorates": "Calistria",
          "description": "On this day of deceit, worshippers don disguises and spread chaos among those who wronged them.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dayOfMonth",
          "month": 2,
          "day": 29
      },
      {
          "id": "dungeonetics-057",
          "name": "Turning Day",
          "category": "Religious",
          "observedBy": "Alseta",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 31,
          "commemorates": "Alseta",
          "description": "The changing of the year is celebrated with the forgiveness of old debts and grudges, and embracing new opportunities.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-068",
          "name": "Vault Day",
          "category": "Religious",
          "observedBy": "Abadar",
          "rule": "dayOfMonth",
          "month": 1,
          "day": 6,
          "commemorates": "Abadar",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "wiki-pharast-1-15-vernal-carpentry-court",
          "name": "Vernal Carpentry Court",
          "category": "Wiki",
          "observedBy": "Andoran",
          "commemorates": "Andoran",
          "description": "",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals",
          "rule": "dateRange",
          "month": 3,
          "day": 1,
          "endMonth": 3,
          "endDay": 15
      },
      {
          "id": "dungeonetics-059",
          "name": "Wanderer's Escape",
          "category": "Religious",
          "observedBy": "Apsu",
          "rule": "nthDayOfSeason",
          "season": "Summer",
          "n": 1,
          "commemorates": "Apsu",
          "description": "The first day of a week of travel in the wilderness and through unknown lands.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-096",
          "name": "Waning Light Festival",
          "category": "Local",
          "observedBy": "Segada",
          "rule": "nthDayOfSeason",
          "season": "Autumn",
          "n": 1,
          "commemorates": "Segada",
          "description": "Also called Blessing of the Sun and Night of Spirits, participants bid farewell to the long days of sunshine with feasting, dancing, and music.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-043",
          "name": "Winter Week",
          "category": "General",
          "observedBy": "",
          "rule": "nthFullWeekOfMonth",
          "month": 12,
          "n": 2,
          "description": "Traditional feast; time for courting and spending time with friends.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-062",
          "name": "Winterbloom",
          "category": "Religious",
          "observedBy": "Naderi",
          "rule": "dayOfMonth",
          "month": 12,
          "day": 15,
          "commemorates": "Naderi",
          "description": "Holiday celebrating Naderi's ascension. Celebrations are typically understated but include readings of The Lay of Arden and Lysena.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      },
      {
          "id": "dungeonetics-012",
          "name": "Wrights of Augustana",
          "category": "Local",
          "observedBy": "Andoran, Brigh",
          "rule": "dateRange",
          "month": 4,
          "day": 16,
          "endMonth": 4,
          "endDay": 30,
          "commemorates": "Andoran, Brigh",
          "description": "This local festival in the Andoran port city of Augustana is held to honor and celebrate the local shipbuilding industry as well as the navy. The mathematics and engineering required for the building of the ships is praised by Brigh's faithful.",
          "source": "PathfinderWiki",
          "sourceUrl": "https://pathfinderwiki.com/wiki/Holidays_and_festivals"
      }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizedHolidayName(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/^the-/, "")
      .replace(/-begins$|-ends$/g, "")
      .replace(/-begin$|-end$/g, "")
      .replace(/ascendance-night/g, "ascendance-day")
      .replace(/king-eodred-ii/g, "king-erod-ii")
      .replace(/szurpada/g, "szurpade");
  }

  function occurrenceDescription(holiday) {
    return [holiday.commemorates || holiday.observedBy, holiday.category]
      .filter(Boolean)
      .join(" - ");
  }

  function eventFromHoliday(holiday, startDay, endDay = startDay, year = 1) {
    return {
      id: `holiday:${holiday.id}:${year}:${startDay}:${endDay}`,
      title: holiday.name,
      description: holiday.description || occurrenceDescription(holiday),
      startDay,
      startMinute: 0,
      endDay,
      endMinute: 0,
      allDay: true,
      eventType: "holiday",
      visibleToPlayers: true,
      generated: true,
      holidayYear: year,
      holiday,
    };
  }

  function nthWeekdayOfMonth(year, month, weekday, n, config) {
    const calendarData = window.PFCalendarData;
    const monthStart = calendarData.startOfMonthAbsoluteDay(year, month, config);
    const monthLength = calendarData.monthDays(month, year, config);
    const monthEnd = monthStart + monthLength - 1;

    const days = [];
    for (let day = monthStart; day <= monthEnd; day += 1) {
      if (calendarData.weekdayForAbsoluteDay(day, config) === weekday) {
        days.push(day);
      }
    }

    if (n > 0) return days[n - 1] || null;
    return days[days.length + n] || null;
  }

  function resolveHolidayForYear(holiday, year, config) {
    const calendarData = window.PFCalendarData;

    if (holiday.rule === "dayOfMonth") {
      const monthLength = calendarData.monthDays(holiday.month, year, config);
      const day = Number(holiday.day || 1);
      if (day > monthLength || day < 1) return [];
      return [
        eventFromHoliday(
          holiday,
          calendarData.dateToAbsoluteDay(year, holiday.month, day, config),
          undefined,
          year,
        ),
      ];
    }

    if (holiday.rule === "month") {
      const startDay = calendarData.dateToAbsoluteDay(year, holiday.month, 1, config);
      const endDay = startDay + calendarData.monthDays(holiday.month, year, config) - 1;
      return [eventFromHoliday(holiday, startDay, endDay, year)];
    }

    if (holiday.rule === "dateRange") {
      const monthLength = calendarData.monthDays(holiday.month, year, config);
      const endMonthLength = calendarData.monthDays(
        holiday.endMonth || holiday.month,
        year,
        config,
      );
      const day = Number(holiday.day || 1);
      const endDayValue = Number(holiday.endDay || day);
      if (
        day < 1 ||
        endDayValue < 1 ||
        day > monthLength ||
        endDayValue > endMonthLength
      ) {
        return [];
      }
      const startDay = calendarData.dateToAbsoluteDay(
        year,
        holiday.month,
        day,
        config,
      );
      const endDay = calendarData.dateToAbsoluteDay(
        year,
        holiday.endMonth || holiday.month,
        endDayValue,
        config,
      );
      return [eventFromHoliday(holiday, startDay, endDay, year)];
    }

    if (holiday.rule === "nthWeekdayOfMonth") {
      const day = nthWeekdayOfMonth(
        year,
        holiday.month,
        holiday.weekday,
        Number(holiday.n || 1),
        config,
      );
      return day ? [eventFromHoliday(holiday, day, day, year)] : [];
    }

    if (holiday.rule === "nthFullWeekOfMonth") {
      const day = nthWeekdayOfMonth(
        year,
        holiday.month,
        "Sunday",
        Number(holiday.n || 1),
        config,
      );
      return day ? [eventFromHoliday(holiday, day, day + 6, year)] : [];
    }

    if (holiday.rule === "nthDayOfSeason") {
      const n = Number(holiday.n || 1);
      const start = calendarData.seasonStartAbsoluteDay(year, holiday.season, config);
      const end = calendarData.seasonEndAbsoluteDay(year, holiday.season, config);
      if (!start || !end) return [];
      const day = n > 0 ? start + n - 1 : end + n + 1;
      return day >= start && day <= end ? [eventFromHoliday(holiday, day, day, year)] : [];
    }

    if (holiday.rule === "daysBeforeSeason") {
      const end = calendarData.seasonStartAbsoluteDay(year, holiday.season, config);
      const days = Math.max(1, Number(holiday.days || 1) || 1);
      return end ? [eventFromHoliday(holiday, end - days, end - 1, year)] : [];
    }

    if (holiday.rule === "firstMoonPhaseOfMonth") {
      const start = calendarData.dateToAbsoluteDay(year, holiday.month, 1, config);
      const end = start + calendarData.monthDays(holiday.month, year, config) - 1;
      for (let day = start; day <= end; day += 1) {
        if (calendarData.moonPhaseForDay(day, config).key === holiday.phase) {
          return [eventFromHoliday(holiday, day, day, year)];
        }
      }
    }

    return [];
  }

  function beginEndKey(event) {
    const title = String(event.title || "");
    const base = title.replace(/\s+(begins|ends)$/i, "").trim();
    if (base === title) return "";
    return [
      base.toLowerCase(),
      event.holiday?.category || "",
      event.holidayYear || "",
    ].join(":");
  }

  function combineBeginEndEvents(events) {
    const grouped = new Map();
    const passthrough = [];

    events.forEach((event) => {
      const key = beginEndKey(event);
      if (!key) {
        passthrough.push(event);
        return;
      }
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(event);
    });

    grouped.forEach((items) => {
      const begin = items.find((event) => /\sbegins$/i.test(event.title));
      const end = items.find((event) => /\sends$/i.test(event.title));
      if (!begin || !end) {
        passthrough.push(...items);
        return;
      }

      const title = begin.title.replace(/\s+begins$/i, "").trim();
      passthrough.push({
        ...begin,
        id: `holiday-span:${begin.holiday.id}:${end.holiday.id}:${begin.startDay}:${end.startDay}`,
        title,
        startDay: Math.min(begin.startDay, end.startDay),
        endDay: Math.max(begin.startDay, end.startDay),
      });
    });

    return passthrough;
  }

  function occurrenceKey(event) {
    return [
      normalizedHolidayName(event.title),
      Number(event.startDay || 0),
      Number(event.endDay || event.startDay || 0),
    ].join(":");
  }

  function mergeOccurrenceEvents(events) {
    const merged = new Map();
    events.forEach((event) => {
      const key = occurrenceKey(event);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, event);
        return;
      }

      const nextHoliday = {
        ...(existing.holiday || {}),
        ...(event.holiday || {}),
        description:
          event.holiday?.description || existing.holiday?.description || "",
        commemorates:
          event.holiday?.commemorates || existing.holiday?.commemorates || "",
      };
      merged.set(key, {
        ...existing,
        ...event,
        holiday: nextHoliday,
        description: event.description || existing.description || "",
      });
    });
    return [...merged.values()];
  }

  function holidayOccurrencesForRange(holidays, startDay, endDay, config = {}) {
    const calendarData = window.PFCalendarData;
    const startYear = calendarData.absoluteDayToDate(startDay, config).year;
    const endYear = calendarData.absoluteDayToDate(endDay, config).year;
    const events = [];

    for (let year = startYear - 1; year <= endYear + 1; year += 1) {
      if (year < 1) continue;
      holidays.forEach((holiday) => {
        events.push(...resolveHolidayForYear(holiday, year, config));
      });
    }

    return mergeOccurrenceEvents(combineBeginEndEvents(events)).filter(
      (event) =>
        Number(event.startDay || 0) <= endDay &&
        Number(event.endDay || event.startDay || 0) >= startDay,
    );
  }

  async function loadHolidays() {
    return clone(HOLIDAYS);
  }

  window.PFHolidayData = {
    holidays: HOLIDAYS,
    loadHolidays,
    resolveHolidayForYear,
    holidayOccurrencesForRange,
  };
})();
