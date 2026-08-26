-- Lets a GM (or anyone else applying an effect to a character they don't
-- own -- from the map's effect picker, most commonly) queue up a
-- "choose a skill/target" request instead of picking on that player's
-- behalf. The owning player's own session polls for pending requests
-- against their characters and resolves them locally (see
-- modals/pending-effect-choices.js), then the resolved effect is saved
-- into user_buff_state the same way a normal Add Effect would be.

create table if not exists public.effect_choice_requests (
  id uuid primary key default gen_random_uuid(),
  context_key text not null,
  game_id uuid references public.games(id) on delete cascade,
  character_id uuid not null references public.character_sheets(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  effect_name text not null default 'Effect',
  ability jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'cancelled')),
  resolved_bonuses jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.effect_choice_requests enable row level security;
revoke all on public.effect_choice_requests from public, anon;

create index if not exists effect_choice_requests_character_status_idx
on public.effect_choice_requests (character_id, status);

create index if not exists effect_choice_requests_requester_idx
on public.effect_choice_requests (requested_by, status);

-- Anyone who can already write that character's buffs today (its owner,
-- or a fellow member of its game, or an app admin) can queue a request
-- for it -- same trust boundary "users can write own buffs" already
-- uses in user_buff_state, just requiring requested_by to be the caller.
drop policy if exists "allowed users can create choice requests" on public.effect_choice_requests;
create policy "allowed users can create choice requests"
on public.effect_choice_requests for insert
to authenticated
with check (
  requested_by = auth.uid()
  and exists (
    select 1
    from public.character_sheets cs
    where cs.id = character_id
      and (
        cs.user_id = auth.uid()
        or (cs.game_id is not null and public.is_game_member(cs.game_id))
        or public.is_app_admin()
      )
  )
);

-- The requester needs to see their own request to show "waiting for
-- player"/detect resolution; the character's owner needs to see it to
-- answer it; anyone else with map/game access to that character can see
-- it too so a second GM session isn't left in the dark.
drop policy if exists "involved users can read choice requests" on public.effect_choice_requests;
create policy "involved users can read choice requests"
on public.effect_choice_requests for select
to authenticated
using (
  requested_by = auth.uid()
  or public.is_app_admin()
  or exists (
    select 1
    from public.character_sheets cs
    where cs.id = character_id
      and (
        cs.user_id = auth.uid()
        or (cs.game_id is not null and public.is_game_member(cs.game_id))
      )
  )
);

-- Only the character's own owner (or an admin) can resolve/cancel their
-- pending choice -- this is the whole point: the GM who queued it can't
-- answer on the player's behalf.
drop policy if exists "character owner can resolve choice requests" on public.effect_choice_requests;
create policy "character owner can resolve choice requests"
on public.effect_choice_requests for update
to authenticated
using (
  exists (
    select 1 from public.character_sheets cs
    where cs.id = character_id and cs.user_id = auth.uid()
  )
  or public.is_app_admin()
)
with check (
  exists (
    select 1 from public.character_sheets cs
    where cs.id = character_id and cs.user_id = auth.uid()
  )
  or public.is_app_admin()
);

-- The requester can withdraw a request they no longer want answered
-- (e.g. they undid the cast); the owner can dismiss one they don't want
-- to deal with either.
drop policy if exists "requester or owner can delete choice requests" on public.effect_choice_requests;
create policy "requester or owner can delete choice requests"
on public.effect_choice_requests for delete
to authenticated
using (
  requested_by = auth.uid()
  or public.is_app_admin()
  or exists (
    select 1 from public.character_sheets cs
    where cs.id = character_id and cs.user_id = auth.uid()
  )
);
