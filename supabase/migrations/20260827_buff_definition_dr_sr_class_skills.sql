-- Custom buffs/traits/feats (buff_definitions) AND loot/inventory items
-- (game_loot) gain the same three things class features already had:
-- Damage Reduction, Spell Resistance, and "X becomes a class skill"
-- (class_skill_grants). See scripts/effect-editor.js for the shared
-- authoring UI now used by every effect-authoring surface in the app.
alter table public.buff_definitions
  add column if not exists damage_reduction jsonb not null default '[]'::jsonb;
alter table public.buff_definitions
  add column if not exists spell_resistance jsonb not null default '[]'::jsonb;
alter table public.buff_definitions
  add column if not exists class_skill_grants jsonb not null default '[]'::jsonb;

alter table public.game_loot
  add column if not exists damage_reduction jsonb not null default '[]'::jsonb;
alter table public.game_loot
  add column if not exists spell_resistance jsonb not null default '[]'::jsonb;
alter table public.game_loot
  add column if not exists class_skill_grants jsonb not null default '[]'::jsonb;

-- Adding new_damage_reduction/new_spell_resistance/new_class_skill_grants
-- changes the function's argument signature, which Postgres treats as a
-- distinct overload rather than a replacement -- drop the old one first
-- so the two don't coexist.
drop function if exists public.admin_update_buff_definition(uuid, text, text, text, integer, text, boolean, jsonb, jsonb);

create or replace function public.admin_update_buff_definition(
  target_buff_id uuid,
  new_name text,
  new_category text,
  new_duration text,
  new_duration_count integer,
  new_duration_unit text,
  new_duration_per_level boolean,
  new_duration_config jsonb,
  new_bonuses jsonb,
  new_damage_reduction jsonb default '[]'::jsonb,
  new_spell_resistance jsonb default '[]'::jsonb,
  new_class_skill_grants jsonb default '[]'::jsonb
)
returns public.buff_definitions
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_buff public.buff_definitions;
begin
  if not public.is_app_admin() then
    raise exception 'Only app admins can edit effect definitions';
  end if;

  if nullif(trim(new_name), '') is null then
    raise exception 'Effect name is required';
  end if;

  if coalesce(new_duration_unit, 'variable') not in ('variable', 'turn', 'round', 'minute', 'hour', 'day') then
    raise exception 'Unsupported duration unit';
  end if;

  if jsonb_typeof(new_bonuses) <> 'array' then
    raise exception 'Bonuses must be a JSON array';
  end if;

  if new_damage_reduction is not null and jsonb_typeof(new_damage_reduction) <> 'array' then
    raise exception 'Damage reduction must be a JSON array';
  end if;

  if new_spell_resistance is not null and jsonb_typeof(new_spell_resistance) <> 'array' then
    raise exception 'Spell resistance must be a JSON array';
  end if;

  if new_class_skill_grants is not null and jsonb_typeof(new_class_skill_grants) <> 'array' then
    raise exception 'Class skill grants must be a JSON array';
  end if;

  if new_duration_config is not null and jsonb_typeof(new_duration_config) <> 'object' then
    raise exception 'Duration config must be a JSON object';
  end if;

  update public.buff_definitions
  set name = trim(new_name),
      category = coalesce(nullif(trim(new_category), ''), 'Custom'),
      duration = coalesce(nullif(trim(new_duration), ''), 'variable'),
      duration_count = case
        when coalesce(new_duration_unit, 'variable') = 'variable' then null
        else greatest(1, coalesce(new_duration_count, 1))
      end,
      duration_unit = coalesce(new_duration_unit, 'variable'),
      duration_per_level = case
        when coalesce(new_duration_unit, 'variable') = 'variable' then false
        else coalesce(new_duration_per_level, false)
      end,
      duration_config = new_duration_config,
      bonuses = new_bonuses,
      damage_reduction = coalesce(new_damage_reduction, '[]'::jsonb),
      spell_resistance = coalesce(new_spell_resistance, '[]'::jsonb),
      class_skill_grants = coalesce(new_class_skill_grants, '[]'::jsonb),
      updated_at = now()
  where id = target_buff_id
  returning * into updated_buff;

  if updated_buff.id is null then
    raise exception 'Effect not found';
  end if;

  return updated_buff;
end;
$$;

revoke all on function public.admin_update_buff_definition(uuid, text, text, text, integer, text, boolean, jsonb, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.admin_update_buff_definition(uuid, text, text, text, integer, text, boolean, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.admin_update_buff_bonuses(target_buff_id uuid, new_bonuses jsonb)
returns public.buff_definitions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_buff public.buff_definitions;
begin
  select * into current_buff
  from public.buff_definitions
  where id = target_buff_id;

  if current_buff.id is null then
    raise exception 'Effect not found';
  end if;

  return public.admin_update_buff_definition(
    target_buff_id,
    current_buff.name,
    current_buff.category,
    current_buff.duration,
    current_buff.duration_count,
    current_buff.duration_unit,
    current_buff.duration_per_level,
    current_buff.duration_config,
    new_bonuses,
    current_buff.damage_reduction,
    current_buff.spell_resistance,
    current_buff.class_skill_grants
  );
end;
$$;

revoke all on function public.admin_update_buff_bonuses(uuid, jsonb) from public;
grant execute on function public.admin_update_buff_bonuses(uuid, jsonb) to authenticated;
