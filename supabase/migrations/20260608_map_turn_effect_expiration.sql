create table if not exists public.map_turn_effect_events (
  context_key text not null,
  event_id text not null,
  ending_token_id text not null,
  created_at timestamptz not null default now(),
  primary key (context_key, event_id)
);

alter table public.map_turn_effect_events enable row level security;
revoke all on public.map_turn_effect_events from public, anon, authenticated;

create or replace function public.decrement_map_effect_list(
  effect_list jsonb,
  ending_token_id text,
  fallback_token_id text
)
returns table (
  active_buffs jsonb,
  expired_effects jsonb,
  changed boolean
)
language sql
immutable
set search_path = public
as $$
  with effects as (
    select value as effect, ordinality
    from jsonb_array_elements(coalesce(effect_list, '[]'::jsonb)) with ordinality
  ),
  prepared as (
    select
      effect,
      ordinality,
      coalesce(
        nullif(effect ->> 'durationAnchorTokenId', ''),
        nullif(effect ->> 'sourceTokenId', ''),
        fallback_token_id
      ) = ending_token_id
      and coalesce((effect ->> 'permanent')::boolean, false) is false
      and coalesce(effect ->> 'remaining', '') ~ '^[0-9]+$' as should_decrement,
      case
        when coalesce(effect ->> 'remaining', '') ~ '^[0-9]+$'
          then (effect ->> 'remaining')::integer
        else null
      end as remaining
    from effects
  ),
  mapped as (
    select
      effect,
      ordinality,
      should_decrement,
      should_decrement and remaining <= 1 as should_expire,
      case
        when should_decrement and remaining > 1 then
          case
            when lower(coalesce(effect ->> 'category', '')) = 'condition' then
              jsonb_set(
                jsonb_set(
                  jsonb_set(effect, '{remaining}', to_jsonb(remaining - 1), true),
                  '{turns}',
                  to_jsonb(remaining - 1),
                  true
                ),
                '{durationLabel}',
                to_jsonb((remaining - 1)::text || case when remaining - 1 = 1 then ' round' else ' rounds' end),
                true
              )
            else
              jsonb_set(
                jsonb_set(effect, '{remaining}', to_jsonb(remaining - 1), true),
                '{durationLabel}',
                to_jsonb((remaining - 1)::text || case when remaining - 1 = 1 then ' round' else ' rounds' end),
                true
              )
          end
        else effect
      end as updated_effect
    from prepared
  )
  select
    coalesce(jsonb_agg(updated_effect order by ordinality) filter (where not should_expire), '[]'::jsonb),
    coalesce(jsonb_agg(effect order by ordinality) filter (where should_expire), '[]'::jsonb),
    coalesce(bool_or(should_decrement), false)
  from mapped;
$$;

revoke all on function public.decrement_map_effect_list(jsonb, text, text) from public, anon, authenticated;

create or replace function public.advance_map_effect_turn(
  target_context_key text,
  ending_token_id text,
  turn_event_id text
)
returns table (
  target_type text,
  target_id uuid,
  target_token_id text,
  expired_effects jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_game_id uuid;
  target_row record;
  token_id text;
  next_buffs jsonb;
  expired jsonb;
  did_change boolean;
begin
  select ms.game_id
  into target_game_id
  from public.map_state ms
  where ms.context_key = target_context_key;

  if target_game_id is null or not (
    public.is_game_member(target_game_id)
    or public.is_app_admin()
  ) then
    raise exception 'Not allowed to advance effects for this map';
  end if;

  insert into public.map_turn_effect_events (context_key, event_id, ending_token_id)
  values (target_context_key, turn_event_id, ending_token_id)
  on conflict do nothing;

  if not found then
    return;
  end if;

  delete from public.map_turn_effect_events
  where created_at < now() - interval '7 days';

  for target_row in
    select ubs.id, ubs.character_id, ubs.active_buffs
    from public.user_buff_state ubs
    where ubs.context_key = target_context_key
      and ubs.character_id is not null
  loop
    select token ->> 'id'
    into token_id
    from public.map_state ms
    cross join lateral jsonb_array_elements(coalesce(ms.state -> 'tokens', '[]'::jsonb)) token
    where ms.context_key = target_context_key
      and token ->> 'characterId' = target_row.character_id::text
    limit 1;

    select result.active_buffs, result.expired_effects, result.changed
    into next_buffs, expired, did_change
    from public.decrement_map_effect_list(target_row.active_buffs, ending_token_id, token_id) result;

    if did_change then
      update public.user_buff_state
      set active_buffs = next_buffs, updated_at = now()
      where id = target_row.id;

      target_type := 'character';
      target_id := target_row.character_id;
      target_token_id := token_id;
      expired_effects := expired;
      return next;
    end if;
  end loop;

  for target_row in
    select e.id, e.sheet
    from public.enemies e
    where e.context_key = target_context_key
  loop
    select token ->> 'id'
    into token_id
    from public.map_state ms
    cross join lateral jsonb_array_elements(coalesce(ms.state -> 'tokens', '[]'::jsonb)) token
    where ms.context_key = target_context_key
      and token ->> 'enemyId' = target_row.id::text
    limit 1;

    select result.active_buffs, result.expired_effects, result.changed
    into next_buffs, expired, did_change
    from public.decrement_map_effect_list(
      coalesce(target_row.sheet -> 'activeBuffs', '[]'::jsonb),
      ending_token_id,
      token_id
    ) result;

    if did_change then
      update public.enemies
      set
        sheet = jsonb_set(coalesce(sheet, '{}'::jsonb), '{activeBuffs}', next_buffs, true),
        updated_at = now()
      where id = target_row.id;

      target_type := 'enemy';
      target_id := target_row.id;
      target_token_id := token_id;
      expired_effects := expired;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.advance_map_effect_turn(text, text, text) from public, anon;
grant execute on function public.advance_map_effect_turn(text, text, text) to authenticated;
