-- Multi-map support: up to 6 battle maps per campaign context.
-- Each map_state row now belongs to a numbered slot (1-6) instead of being
-- the single map for a context. There is no shared "active" map -- every
-- user picks which slot they view independently (tracked client-side), so
-- different people can be looking at different maps at the same time.
-- Each slot's display name lives inside state->settings->>name (no new
-- column needed).

alter table public.map_state
  add column if not exists map_slot smallint not null default 1;

alter table public.map_state
  drop constraint if exists map_state_map_slot_range;
alter table public.map_state
  add constraint map_state_map_slot_range check (map_slot between 1 and 6);

-- Replace the old context_key-only uniqueness with (context_key, map_slot).
alter table public.map_state
  drop constraint if exists map_state_context_key_key;
drop index if exists map_state_context_key_unique;
create unique index if not exists map_state_context_key_slot_unique
on public.map_state (context_key, map_slot);
