// Tileable SVG "wall dressing" patterns for the Map's 3D Height Layer.
// Each entry is the *inner* markup of one tile (drawn on a w x h canvas,
// origin top-left) -- see wallPatternTileSvg() for how that gets wrapped
// into a standalone <svg> and wallPatternBackgroundStyle() for how that
// becomes a CSS background-image data URI with matching background-size
// + background-repeat:repeat, ready to drop straight onto a
// .map-3d-wall or .map-3d-block-top element.
//
// Palette/style note: these were drawn to match three reference battle
// maps a player shared (a mossy riverside camp, a glowing swamp shrine,
// and a crystal-veined dungeon), grouped into Wood / Rock / Foliage /
// Stone Wall / Wood Wall / Extras -- see renderWallPatternPicker() in
// scripts/pages/map.js for where these show up in the Height Region
// editor panel.
(function () {
  const WALL_PATTERNS = [
    // ============ WOOD ============
    {
      id: "wood-riverboat",
      label: "Riverboat Plank",
      category: "Wood",
      w: 88,
      h: 24,
      inner: `
        <rect width="88" height="24" fill="#6e4620"/>
        <rect y="0" width="88" height="22" fill="#8a5a2e"/>
        <path d="M0 6 Q22 4 44 6 T88 6" stroke="#a97a42" stroke-width="1.4" fill="none" opacity="0.55"/>
        <path d="M0 13 Q22 15 44 13 T88 13" stroke="#4a2e14" stroke-width="1.2" fill="none" opacity="0.5"/>
        <path d="M0 19 Q22 17 44 19 T88 19" stroke="#a97a42" stroke-width="1" fill="none" opacity="0.4"/>
        <ellipse cx="30" cy="10" rx="3.2" ry="2.1" fill="#4a2e14" opacity="0.7"/>
        <ellipse cx="30" cy="10" rx="1.3" ry="0.8" fill="#2f1c0c"/>
        <rect y="22" width="88" height="2" fill="#3a2410"/>
      `,
    },
    {
      id: "wood-driftwood",
      label: "Weathered Driftwood",
      category: "Wood",
      w: 96,
      h: 22,
      inner: `
        <rect width="96" height="22" fill="#6f665a"/>
        <rect width="96" height="20" fill="#8f8578"/>
        <path d="M0 5 L20 6 L48 4 L70 6 L96 5" stroke="#4a4338" stroke-width="1" fill="none" opacity="0.55"/>
        <path d="M0 12 L26 13 L52 11 L80 13 L96 12" stroke="#4a4338" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M0 17 L18 16 L46 18 L74 16 L96 17" stroke="#a89d8c" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M40 0 L38 20" stroke="#3a352c" stroke-width="0.8" opacity="0.4"/>
        <rect y="20" width="96" height="2" fill="#3a352c"/>
      `,
    },
    {
      id: "wood-oak-endgrain",
      label: "Oak Crossbeam",
      category: "Wood",
      w: 64,
      h: 64,
      inner: `
        <rect width="64" height="64" fill="#3e2a16"/>
        <g transform="translate(16,16)">
          <circle r="13" fill="#7a5230"/>
          <circle r="10" fill="none" stroke="#8f6a3e" stroke-width="1.3" opacity="0.7"/>
          <circle r="6.5" fill="none" stroke="#6a4726" stroke-width="1.1" opacity="0.7"/>
          <circle r="3" fill="none" stroke="#8f6a3e" stroke-width="1" opacity="0.6"/>
          <circle r="1.1" fill="#3e2a16"/>
        </g>
        <g transform="translate(48,48)">
          <circle r="13" fill="#83592f"/>
          <circle r="9.5" fill="none" stroke="#96703f" stroke-width="1.3" opacity="0.7"/>
          <circle r="6" fill="none" stroke="#6a4726" stroke-width="1.1" opacity="0.7"/>
          <circle r="2.6" fill="none" stroke="#96703f" stroke-width="1" opacity="0.6"/>
          <circle r="1" fill="#3e2a16"/>
        </g>
      `,
    },
    {
      id: "wood-ashen-bark",
      label: "Ashen Bark",
      category: "Wood",
      w: 48,
      h: 72,
      inner: `
        <rect width="48" height="72" fill="#1c1f24"/>
        <path d="M4 0 C2 12 6 24 3 36 C1 48 5 60 3 72" stroke="#0d0f11" stroke-width="2" fill="none" opacity="0.65"/>
        <path d="M12 0 C14 14 10 26 13 40 C15 54 11 66 13 72" stroke="#3a424a" stroke-width="1.6" fill="none" opacity="0.55"/>
        <path d="M20 0 C18 10 22 22 19 34 C17 48 21 58 19 72" stroke="#0d0f11" stroke-width="2.2" fill="none" opacity="0.6"/>
        <path d="M28 0 C30 12 26 24 29 38 C31 50 27 62 29 72" stroke="#3a424a" stroke-width="1.4" fill="none" opacity="0.5"/>
        <path d="M36 0 C34 14 38 26 35 40 C33 52 37 64 35 72" stroke="#0d0f11" stroke-width="2" fill="none" opacity="0.55"/>
        <path d="M44 0 C46 10 42 22 45 36 C47 48 43 60 45 72" stroke="#3a424a" stroke-width="1.5" fill="none" opacity="0.5"/>
        <g stroke="#0d0f11" stroke-width="1" opacity="0.5">
          <path d="M6 18 l4 -1"/><path d="M16 34 l4 1"/><path d="M24 10 l4 -1"/>
          <path d="M32 46 l4 1"/><path d="M40 28 l4 -1"/><path d="M10 58 l4 1"/>
        </g>
        <g fill="#6b7680" opacity="0.3">
          <circle cx="8" cy="24" r="1"/><circle cx="22" cy="50" r="0.9"/><circle cx="38" cy="14" r="1"/>
        </g>
      `,
    },
    {
      id: "wood-oak-bark",
      label: "Oak Bark",
      category: "Wood",
      w: 48,
      h: 72,
      inner: `
        <rect width="48" height="72" fill="#4a3320"/>
        <path d="M4 0 C2 12 6 24 3 36 C1 48 5 60 3 72" stroke="#2e1f12" stroke-width="2" fill="none" opacity="0.65"/>
        <path d="M12 0 C14 14 10 26 13 40 C15 54 11 66 13 72" stroke="#6b4f30" stroke-width="1.6" fill="none" opacity="0.55"/>
        <path d="M20 0 C18 10 22 22 19 34 C17 48 21 58 19 72" stroke="#2e1f12" stroke-width="2.2" fill="none" opacity="0.6"/>
        <path d="M28 0 C30 12 26 24 29 38 C31 50 27 62 29 72" stroke="#6b4f30" stroke-width="1.4" fill="none" opacity="0.5"/>
        <path d="M36 0 C34 14 38 26 35 40 C33 52 37 64 35 72" stroke="#2e1f12" stroke-width="2" fill="none" opacity="0.55"/>
        <path d="M44 0 C46 10 42 22 45 36 C47 48 43 60 45 72" stroke="#6b4f30" stroke-width="1.5" fill="none" opacity="0.5"/>
        <g stroke="#2e1f12" stroke-width="1" opacity="0.5">
          <path d="M6 18 l4 -1"/><path d="M16 34 l4 1"/><path d="M24 10 l4 -1"/>
          <path d="M32 46 l4 1"/><path d="M40 28 l4 -1"/><path d="M10 58 l4 1"/>
        </g>
        <g fill="#7a5a38" opacity="0.35">
          <circle cx="8" cy="24" r="1"/><circle cx="22" cy="50" r="0.9"/><circle cx="38" cy="14" r="1"/>
        </g>
      `,
    },
    {
      id: "wood-birch-bark",
      label: "Birch Bark",
      category: "Wood",
      w: 48,
      h: 72,
      inner: `
        <rect width="48" height="72" fill="#cbc7ba"/>
        <path d="M14 0 V72 M34 0 V72" stroke="#a8a190" stroke-width="1" opacity="0.35"/>
        <g stroke="#2a2620" stroke-linecap="round">
          <path d="M4 6 h7" stroke-width="2"/>
          <path d="M20 14 h5" stroke-width="1.6"/>
          <path d="M36 8 h8" stroke-width="2.2"/>
          <path d="M8 26 h6" stroke-width="1.8"/>
          <path d="M28 30 h9" stroke-width="2"/>
          <path d="M42 22 h4" stroke-width="1.4"/>
          <path d="M14 42 h7" stroke-width="2"/>
          <path d="M2 50 h5" stroke-width="1.6"/>
          <path d="M32 48 h6" stroke-width="1.8"/>
          <path d="M22 60 h8" stroke-width="2.2"/>
          <path d="M40 64 h5" stroke-width="1.6"/>
          <path d="M6 66 h6" stroke-width="1.8"/>
        </g>
        <g fill="#a8a190" opacity="0.4">
          <ellipse cx="18" cy="20" rx="3" ry="1.4"/><ellipse cx="38" cy="52" rx="3.4" ry="1.5"/>
        </g>
      `,
    },
    {
      id: "wood-charred-deadfall",
      label: "Charred Deadfall",
      category: "Wood",
      w: 96,
      h: 24,
      inner: `
        <rect width="96" height="24" fill="#14161a"/>
        <rect width="96" height="22" fill="#262a2f"/>
        <path d="M0 5 L20 6 L48 4 L70 6 L96 5" stroke="#0d0f11" stroke-width="1" fill="none" opacity="0.6"/>
        <path d="M0 12 L26 13 L52 11 L80 13 L96 12" stroke="#0d0f11" stroke-width="1" fill="none" opacity="0.55"/>
        <path d="M0 17 L18 16 L46 18 L74 16 L96 17" stroke="#4a545e" stroke-width="1" fill="none" opacity="0.45"/>
        <path d="M40 0 L38 20" stroke="#0d0f11" stroke-width="0.9" opacity="0.5"/>
        <circle cx="62" cy="9" r="1.4" fill="#8a95a0" opacity="0.5"/>
        <circle cx="14" cy="16" r="1" fill="#8a95a0" opacity="0.4"/>
        <rect y="22" width="96" height="2" fill="#0d0f11"/>
      `,
    },

    // ============ ROCK ============
    {
      id: "rock-mossy-boulder",
      label: "Mossy Boulder",
      category: "Rock",
      w: 100,
      h: 100,
      inner: `
        <rect width="100" height="100" fill="#9a988c"/>
        <path d="M0 30 L28 12 L58 22 L70 0 L100 8 L100 46 L64 58 L34 48 L0 60 Z" fill="#b9b8ae"/>
        <path d="M100 60 L100 100 L58 100 L46 78 L74 62 Z" fill="#a3a196"/>
        <path d="M0 60 L34 48 L46 78 L20 100 L0 100 Z" fill="#8d8b7f"/>
        <path d="M28 12 L58 22 L64 58 L34 48 Z" fill="none" stroke="#6d6b60" stroke-width="1.4" opacity="0.6"/>
        <path d="M58 22 L70 0" stroke="#6d6b60" stroke-width="1.2" opacity="0.5"/>
        <ellipse cx="20" cy="20" rx="9" ry="5.5" fill="#6f8a49" opacity="0.85" transform="rotate(-12 20 20)"/>
        <ellipse cx="16" cy="24" rx="4.5" ry="3" fill="#587339" opacity="0.9"/>
        <ellipse cx="82" cy="72" rx="10" ry="6" fill="#6f8a49" opacity="0.8" transform="rotate(8 82 72)"/>
        <ellipse cx="86" cy="76" rx="4" ry="2.6" fill="#4c6633" opacity="0.9"/>
        <ellipse cx="50" cy="88" rx="6" ry="3.4" fill="#6f8a49" opacity="0.7"/>
      `,
    },
    {
      id: "rock-cavern-granite",
      label: "Cavern Granite",
      category: "Rock",
      w: 70,
      h: 70,
      inner: `
        <rect width="70" height="70" fill="#3c3d42"/>
        <path d="M0 10 L18 0 L34 8 L30 26 L8 30 L0 24 Z" fill="#46474d" opacity="0.9"/>
        <path d="M40 40 L58 34 L70 46 L64 66 L44 70 L36 54 Z" fill="#33343a" opacity="0.9"/>
        <g fill="#55565d">
          <circle cx="6" cy="42" r="1.6"/><circle cx="15" cy="55" r="1.1"/><circle cx="24" cy="38" r="1.4"/>
          <circle cx="33" cy="18" r="1.2"/><circle cx="46" cy="10" r="1.5"/><circle cx="58" cy="14" r="1"/>
          <circle cx="63" cy="58" r="1.3"/><circle cx="12" cy="10" r="1"/><circle cx="52" cy="52" r="1.4"/>
        </g>
        <g fill="#26272b">
          <circle cx="10" cy="48" r="1.4"/><circle cx="28" cy="30" r="1.1"/><circle cx="44" cy="22" r="1.3"/>
          <circle cx="60" cy="40" r="1.2"/><circle cx="20" cy="62" r="1.4"/><circle cx="66" cy="12" r="1"/>
        </g>
        <path d="M0 24 L8 30 L30 26" stroke="#26272b" stroke-width="1" fill="none" opacity="0.6"/>
        <path d="M36 54 L44 70" stroke="#26272b" stroke-width="1" fill="none" opacity="0.6"/>
      `,
    },
    {
      id: "rock-crystal-vein",
      label: "Crystal-Veined Rock",
      category: "Rock",
      w: 90,
      h: 90,
      inner: `
        <rect width="90" height="90" fill="#2a2b30"/>
        <path d="M0 20 L20 4 L44 14 L38 40 L10 42 Z" fill="#313239" opacity="0.85"/>
        <path d="M50 50 L74 40 L90 58 L82 84 L54 82 Z" fill="#26272c" opacity="0.85"/>
        <path d="M4 24 C 20 30, 24 46, 14 62 S 30 88, 46 84" stroke="#cf5fd6" stroke-width="1.6" fill="none" opacity="0.75"/>
        <path d="M46 6 C 54 18, 50 30, 62 34 S 84 30, 90 44" stroke="#57c9d8" stroke-width="1.4" fill="none" opacity="0.7"/>
        <g fill="#e39fe8">
          <polygon points="14,60 17,66 14,72 11,66" opacity="0.9"/>
          <polygon points="44,82 46,86 44,90 42,86" opacity="0.85"/>
        </g>
        <g fill="#8fe1ec">
          <polygon points="62,32 65,37 62,42 59,37" opacity="0.9"/>
          <polygon points="88,42 90,46 88,50 86,46" opacity="0.8"/>
        </g>
        <path d="M10 42 L38 40 L44 14" stroke="#1c1d20" stroke-width="1" fill="none" opacity="0.7"/>
      `,
    },

    // ============ FOLIAGE ============
    {
      id: "foliage-canopy",
      label: "Canopy Leaf",
      category: "Foliage",
      w: 80,
      h: 80,
      inner: `
        <rect width="80" height="80" fill="#3a5326"/>
        <g>
          <ellipse cx="16" cy="18" rx="16" ry="13" fill="#4c6b34"/>
          <ellipse cx="30" cy="10" rx="12" ry="10" fill="#5f8a3f"/>
          <ellipse cx="8" cy="34" rx="11" ry="9" fill="#3a5326"/>
          <ellipse cx="58" cy="52" rx="17" ry="14" fill="#4c6b34"/>
          <ellipse cx="72" cy="40" rx="12" ry="10" fill="#5f8a3f"/>
          <ellipse cx="46" cy="64" rx="11" ry="9" fill="#3a5326"/>
          <ellipse cx="0" cy="70" rx="13" ry="11" fill="#4c6b34"/>
          <ellipse cx="80" cy="8" rx="13" ry="11" fill="#4c6b34"/>
        </g>
        <g fill="#2a3d1c" opacity="0.55">
          <ellipse cx="20" cy="24" rx="5" ry="3.4"/>
          <ellipse cx="62" cy="58" rx="5.5" ry="3.6"/>
          <ellipse cx="10" cy="10" rx="4" ry="2.8"/>
          <ellipse cx="70" cy="46" rx="4.4" ry="3"/>
        </g>
        <g fill="#7ea852" opacity="0.6">
          <ellipse cx="26" cy="6" rx="3.4" ry="2.2"/>
          <ellipse cx="66" cy="36" rx="3.6" ry="2.4"/>
        </g>
      `,
    },
    {
      id: "foliage-undergrowth",
      label: "Undergrowth Moss",
      category: "Foliage",
      w: 60,
      h: 60,
      inner: `
        <rect width="60" height="60" fill="#33421f"/>
        <g fill="#7a9a3f">
          <circle cx="4" cy="8" r="1.6"/><circle cx="14" cy="4" r="1.2"/><circle cx="24" cy="14" r="1.8"/>
          <circle cx="36" cy="6" r="1.3"/><circle cx="48" cy="12" r="1.6"/><circle cx="56" cy="4" r="1.1"/>
          <circle cx="8" cy="24" r="1.4"/><circle cx="20" cy="30" r="1.7"/><circle cx="32" cy="22" r="1.2"/>
          <circle cx="44" cy="28" r="1.5"/><circle cx="54" cy="20" r="1.3"/>
          <circle cx="2" cy="42" r="1.5"/><circle cx="16" cy="48" r="1.2"/><circle cx="28" cy="40" r="1.8"/>
          <circle cx="40" cy="50" r="1.3"/><circle cx="52" cy="44" r="1.6"/>
          <circle cx="10" cy="58" r="1.2"/><circle cx="34" cy="58" r="1.5"/><circle cx="58" cy="56" r="1.1"/>
        </g>
        <g fill="#223014">
          <circle cx="20" cy="8" r="1.1"/><circle cx="42" cy="16" r="1.3"/><circle cx="6" cy="34" r="1.2"/>
          <circle cx="30" cy="34" r="1.4"/><circle cx="50" cy="34" r="1.1"/><circle cx="22" cy="52" r="1.3"/>
          <circle cx="46" cy="8" r="1"/>
        </g>
        <g fill="#cfe05a" opacity="0.85">
          <circle cx="12" cy="16" r="0.9"/><circle cx="44" cy="40" r="0.9"/><circle cx="28" cy="52" r="0.8"/>
        </g>
      `,
    },
    {
      id: "foliage-bramble",
      label: "Bramble Vine",
      category: "Foliage",
      w: 72,
      h: 72,
      inner: `
        <rect width="72" height="72" fill="#23301c"/>
        <path d="M-4 10 C 12 4, 18 20, 34 14 S 56 4, 76 10" stroke="#171f12" stroke-width="2" fill="none"/>
        <path d="M-4 34 C 14 40, 20 24, 38 32 S 60 42, 76 34" stroke="#2c1f13" stroke-width="1.8" fill="none"/>
        <path d="M-4 58 C 10 52, 24 64, 40 56 S 62 50, 76 58" stroke="#171f12" stroke-width="2" fill="none"/>
        <g stroke="#4f6b34" stroke-width="1.6" fill="none">
          <path d="M12 6 l-3 -4 M12 6 l4 -3"/>
          <path d="M30 16 l-3 -4 M30 16 l4 -3"/>
          <path d="M50 6 l-3 -4 M50 6 l4 -3"/>
          <path d="M20 30 l-3 4 M20 30 l4 4"/>
          <path d="M48 36 l-3 4 M48 36 l4 4"/>
          <path d="M16 60 l-3 -4 M16 60 l4 -3"/>
          <path d="M44 54 l-3 -4 M44 54 l4 -3"/>
          <path d="M64 62 l-3 -4 M64 62 l4 -3"/>
        </g>
        <g fill="#3a2a1c">
          <circle cx="34" cy="14" r="1.1"/><circle cx="38" cy="32" r="1.1"/><circle cx="40" cy="56" r="1.1"/>
        </g>
      `,
    },

    // ============ STONE WALL ============
    {
      id: "wall-ashlar",
      label: "Dungeon Ashlar",
      category: "Stone Wall",
      w: 72,
      h: 36,
      inner: `
        <rect width="72" height="36" fill="#2f3032"/>
        <rect x="1" y="1" width="34" height="16" rx="1" fill="#6b6d6f"/>
        <rect x="37" y="1" width="34" height="16" rx="1" fill="#636567"/>
        <rect x="1" y="19" width="16" height="16" rx="1" fill="#5c5e60"/>
        <rect x="19" y="19" width="34" height="16" rx="1" fill="#6b6d6f"/>
        <rect x="55" y="19" width="16" height="16" rx="1" fill="#5c5e60"/>
        <path d="M1 4 H33" stroke="#86888a" stroke-width="0.8" opacity="0.5"/>
        <path d="M37 4 H69" stroke="#86888a" stroke-width="0.8" opacity="0.5"/>
        <path d="M19 22 H51" stroke="#86888a" stroke-width="0.8" opacity="0.5"/>
      `,
    },
    {
      id: "wall-fieldstone",
      label: "Rough Fieldstone",
      category: "Stone Wall",
      w: 84,
      h: 60,
      inner: `
        <rect width="84" height="60" fill="#3a3226"/>
        <path d="M2 2 L26 0 L30 16 L14 22 L0 18 Z" fill="#7a6f5e"/>
        <path d="M30 16 L52 6 L60 20 L46 32 L26 28 Z" fill="#6a604f"/>
        <path d="M60 20 L82 10 L84 28 L66 34 Z" fill="#7a6f5e"/>
        <path d="M0 18 L14 22 L18 40 L0 44 Z" fill="#6a604f"/>
        <path d="M26 28 L46 32 L44 48 L20 50 L18 40 Z" fill="#7a6f5e"/>
        <path d="M46 32 L66 34 L70 50 L44 48 Z" fill="#665c4b"/>
        <path d="M0 44 L18 40 L20 50 L2 58 L0 60 Z" fill="#7a6f5e"/>
        <path d="M20 50 L44 48 L46 60 L18 60 Z" fill="#6a604f"/>
        <path d="M44 48 L70 50 L72 60 L46 60 Z" fill="#7a6f5e"/>
        <path d="M66 34 L84 28 L84 60 L72 60 L70 50 Z" fill="#665c4b"/>
        <g fill="none" stroke="#948a76" stroke-width="0.7" opacity="0.4">
          <path d="M30 16 L14 22"/><path d="M52 6 L60 20"/><path d="M26 28 L46 32"/>
        </g>
      `,
    },
    {
      id: "wall-flagstone-ritual",
      label: "Ritual Flagstone",
      category: "Stone Wall",
      w: 60,
      h: 60,
      inner: `
        <rect width="60" height="60" fill="#202124"/>
        <rect x="1" y="1" width="27" height="27" fill="#3a3b3f"/>
        <rect x="32" y="1" width="27" height="27" fill="#333438"/>
        <rect x="1" y="32" width="27" height="27" fill="#333438"/>
        <rect x="32" y="32" width="27" height="27" fill="#3a3b3f"/>
        <path d="M28.5 0 V60 M0 28.5 H60" stroke="#d99a3e" stroke-width="0.7" opacity="0.45"/>
        <circle cx="14.5" cy="14.5" r="0.9" fill="#d99a3e" opacity="0.5"/>
        <circle cx="45.5" cy="45.5" r="0.9" fill="#d99a3e" opacity="0.5"/>
      `,
    },

    // ============ WOOD WALL ============
    {
      id: "wallwood-palisade",
      label: "Palisade Logs",
      category: "Wood Wall",
      w: 20,
      h: 60,
      inner: `
        <rect width="20" height="60" fill="#3e2a16"/>
        <path d="M2 60 L2 10 Q10 2 18 10 L18 60 Z" fill="#7a5230"/>
        <path d="M2 10 Q10 2 18 10 Q10 6 2 10 Z" fill="#8f6a3e"/>
        <circle cx="10" cy="9" r="3.2" fill="none" stroke="#5a3c1e" stroke-width="0.8" opacity="0.7"/>
        <path d="M6 20 V54 M14 24 V56" stroke="#5a3c1e" stroke-width="0.8" opacity="0.5"/>
        <rect x="0" y="0" width="1.4" height="60" fill="#241708"/>
      `,
    },
    {
      id: "wallwood-timber",
      label: "Timber Frame Wall",
      category: "Wood Wall",
      w: 96,
      h: 48,
      inner: `
        <rect width="96" height="48" fill="#5c4529"/>
        <rect y="1" width="96" height="10" fill="#8a6a45"/>
        <rect y="13" width="96" height="10" fill="#82623f"/>
        <rect y="25" width="96" height="10" fill="#8a6a45"/>
        <rect y="37" width="96" height="10" fill="#82623f"/>
        <rect x="10" width="10" height="48" fill="#4a3520"/>
        <rect x="12" width="6" height="48" fill="#6b4f30"/>
        <rect x="70" width="10" height="48" fill="#4a3520"/>
        <rect x="72" width="6" height="48" fill="#6b4f30"/>
      `,
    },
    {
      id: "wallwood-wattle",
      label: "Wattle & Daub",
      category: "Wood Wall",
      w: 56,
      h: 56,
      inner: `
        <rect width="56" height="56" fill="#a98a5c"/>
        <g stroke="#8a6238" stroke-width="4.2" fill="none" opacity="0.9">
          <path d="M-8 4 L28 40 L64 4"/>
          <path d="M-8 24 L28 60 L64 24"/>
          <path d="M-8 -16 L28 20 L64 -16"/>
        </g>
        <g stroke="#6b4a2a" stroke-width="1.6" fill="none" opacity="0.8">
          <path d="M-8 4 L28 40 L64 4"/>
          <path d="M-8 24 L28 60 L64 24"/>
          <path d="M-8 -16 L28 20 L64 -16"/>
        </g>
        <g fill="#4a3018" opacity="0.35">
          <circle cx="10" cy="14" r="1"/><circle cx="44" cy="14" r="1"/>
          <circle cx="28" cy="40" r="1"/><circle cx="10" cy="46" r="1"/><circle cx="46" cy="46" r="1"/>
        </g>
      `,
    },
    {
      id: "wallwood-frost-palisade",
      label: "Frost Palisade",
      category: "Wood Wall",
      w: 20,
      h: 60,
      inner: `
        <rect width="20" height="60" fill="#14161a"/>
        <path d="M2 60 L2 10 Q10 2 18 10 L18 60 Z" fill="#2b2f35"/>
        <path d="M2 10 Q10 2 18 10 Q10 6 2 10 Z" fill="#3a424a"/>
        <circle cx="10" cy="9" r="3.2" fill="none" stroke="#1c1f24" stroke-width="0.8" opacity="0.7"/>
        <path d="M6 20 V54 M14 24 V56" stroke="#1c1f24" stroke-width="0.8" opacity="0.5"/>
        <rect x="0" y="0" width="1.4" height="60" fill="#0a0b0d"/>
        <circle cx="9" cy="30" r="0.9" fill="#8a95a0" opacity="0.4"/>
      `,
    },
    {
      id: "wallwood-ashwood",
      label: "Ashwood Wall",
      category: "Wood Wall",
      w: 96,
      h: 48,
      inner: `
        <rect width="96" height="48" fill="#1c1f24"/>
        <rect y="1" width="96" height="10" fill="#2b2f35"/>
        <rect y="13" width="96" height="10" fill="#262a2f"/>
        <rect y="25" width="96" height="10" fill="#2b2f35"/>
        <rect y="37" width="96" height="10" fill="#262a2f"/>
        <rect x="10" width="10" height="48" fill="#14161a"/>
        <rect x="12" width="6" height="48" fill="#3a424a"/>
        <rect x="70" width="10" height="48" fill="#14161a"/>
        <rect x="72" width="6" height="48" fill="#3a424a"/>
      `,
    },

    // ============ EXTRAS ============
    {
      id: "extra-trail-dirt",
      label: "Trail Dirt",
      category: "Extras",
      w: 70,
      h: 70,
      inner: `
        <rect width="70" height="70" fill="#7a5a3a"/>
        <g fill="#8a6a45">
          <ellipse cx="20" cy="18" rx="16" ry="11" opacity="0.6"/>
          <ellipse cx="52" cy="46" rx="18" ry="12" opacity="0.6"/>
        </g>
        <g fill="#c9c2ad">
          <circle cx="10" cy="10" r="2"/><circle cx="30" cy="6" r="1.5"/><circle cx="46" cy="16" r="1.8"/>
          <circle cx="6" cy="34" r="1.6"/><circle cx="24" cy="30" r="1.3"/><circle cx="60" cy="10" r="1.6"/>
          <circle cx="14" cy="52" r="1.8"/><circle cx="36" cy="46" r="1.4"/><circle cx="56" cy="56" r="2"/>
          <circle cx="66" cy="34" r="1.5"/><circle cx="42" cy="62" r="1.3"/>
        </g>
        <g stroke="#4a3826" stroke-width="0.8" fill="none" opacity="0.5">
          <path d="M4 44 L18 40 L26 52"/>
          <path d="M40 12 L50 20 L46 30"/>
        </g>
      `,
    },
    {
      id: "extra-deep-water",
      label: "Deep Water",
      category: "Extras",
      w: 80,
      h: 30,
      inner: `
        <rect width="80" height="30" fill="#1c3a44"/>
        <path d="M-4 6 Q10 0 24 6 T52 6 T84 6" stroke="#3f7288" stroke-width="1.6" fill="none" opacity="0.7"/>
        <path d="M-4 15 Q10 9 24 15 T52 15 T84 15" stroke="#6fb0c2" stroke-width="1.3" fill="none" opacity="0.55"/>
        <path d="M-4 23 Q10 18 24 23 T52 23 T84 23" stroke="#0f232a" stroke-width="1.6" fill="none" opacity="0.6"/>
      `,
    },
    {
      id: "extra-arcane-moss",
      label: "Arcane Glow Moss",
      category: "Extras",
      w: 90,
      h: 90,
      inner: `
        <rect width="90" height="90" fill="#16241c"/>
        <circle cx="30" cy="30" r="22" fill="none" stroke="#c8e05a" stroke-width="1.2" opacity="0.35"/>
        <circle cx="30" cy="30" r="13" fill="#c8e05a" opacity="0.14"/>
        <circle cx="30" cy="30" r="4" fill="#e8f28a" opacity="0.6"/>
        <g fill="#3a5c2e">
          <circle cx="70" cy="14" r="1.5"/><circle cx="78" cy="26" r="1.2"/><circle cx="8" cy="66" r="1.4"/>
          <circle cx="66" cy="70" r="1.6"/><circle cx="80" cy="60" r="1.3"/><circle cx="14" cy="80" r="1.5"/>
          <circle cx="52" cy="76" r="1.2"/>
        </g>
        <g fill="#e8f28a" opacity="0.7">
          <circle cx="66" cy="68" r="0.8"/><circle cx="12" cy="20" r="0.7"/><circle cx="76" cy="40" r="0.8"/>
        </g>
      `,
    },
  ];

  function wallPatternById(id) {
    return WALL_PATTERNS.find((p) => p.id === id) || null;
  }

  function wallPatternTileSvg(p) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}">${p.inner}</svg>`;
  }

  function wallPatternDataUri(p) {
    const svg = wallPatternTileSvg(p);
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  // CSS text (no leading/trailing selector) ready to splice into an
  // inline style="" attribute -- background-size deliberately matches
  // the tile's own w/h 1:1 so it repeats at native resolution.
  function wallPatternBackgroundStyle(id) {
    const p = wallPatternById(id);
    if (!p) return "";
    return `background-image:url('${wallPatternDataUri(p)}');background-repeat:repeat;background-size:${p.w}px ${p.h}px;`;
  }

  window.PFWallPatterns = {
    list: WALL_PATTERNS,
    byId: wallPatternById,
    tileSvg: wallPatternTileSvg,
    dataUri: wallPatternDataUri,
    backgroundStyle: wallPatternBackgroundStyle,
  };
})();
