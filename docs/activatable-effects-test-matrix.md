# Passive and Active Mechanics Test Matrix

## Authoring Gateways

- Class features and class feature pool choices: `class-editor.html`
- Standard and alternate racial traits: `race-editor.html`
- Feats: `feat-editor.html`
- Wondrous items, weapons, armor, firearms, and mundane items: `item-catalog-editor.html`
- Inventory item creation and editing: `bag-of-holding.html`
- Spells (Active group only): `spell-editor.html`

For every non-spell gateway, save one Passive effect and one Active effect with a duration. Confirm the Passive effect is always applied, the Active effect appears in the character's Effects picker, and activating/removing it applies/removes only the Active mechanics. For spells, confirm only the Active group is shown and its mechanics apply only after Cast.

## Existing Class Activations

- Alchemist level 1: Mutagen
- Barbarian level 1: Rage

## Existing Whole-Trait Activations

- Gnome alternate trait: Stalker
- Halfling alternate traits: Adaptable Luck; Festive; Halfling Jinx; Luckbringer (2 RP); Small Quarter Ally
- Skinwalker standard trait: Change Shape (Su, 5 RP)
- Undine alternate trait: Nereid Fascination
- Trox standard trait: Special Attacks
- Deep One Hybrid standard trait: Final Change (Su)
- Ganzi alternate trait: 4-6: Ink (Ex)
- Kitsune standard trait: Change Shape (Su)
- Reptoid standard trait: Change Shape (Su)

## Existing Nested Racial Abilities

- Skinwalker Werebat-Kin (Bloodmarked): Change Shape
- Skinwalker Werebear-Kin (Coldborn): Change Shape
- Skinwalker Wereboar-Kin (Ragebred): Change Shape
- Skinwalker Werecrocodile-Kin (Scaleheart): Change Shape
- Skinwalker Wereraptor-Kin (Aerieborn): Change Shape
- Skinwalker Wererat-Kin (Nightskulk): Change Shape
- Skinwalker Wereshark-Kin (Seascarred): Change Shape
- Skinwalker Weretiger-Kin (Fanglord): Change Shape
- Skinwalker Werewolf-Kin (Witchwolf): Change Shape

## Runtime Checks

- Character sheet Effects picker: class, race, feat, and equipped-item Active groups appear once.
- Character calculations: Passive groups contribute without activation; Active groups do not.
- Equipped items: unequipping removes Passive mechanics and removes the item's Active option.
- Spell casting: Active spell mechanics use the configured duration and target flow.
- Map effect picker: class feature activations use the same class-feature collector as the character sheet.
- Legacy records: `activatable: true` mechanics load into Active, with no Passive duplicate.
- Legacy nested `activatableAbilities` remain separate named activations.

Run `node scripts/check-effect-gateways.js` after adding or changing any mechanic or authoring gateway.
