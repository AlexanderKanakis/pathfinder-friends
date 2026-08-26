-- Reverts the "shared live map" concept from 20260824_multi_map_slots.sql.
-- Each user now picks their own map slot independently and that choice is
-- tracked client-side only, so the server-side broadcast table is no
-- longer needed. Safe no-op if you never applied the earlier version.

drop table if exists public.map_active_slot cascade;
