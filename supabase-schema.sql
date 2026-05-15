create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  avatar_path text,
  avatar_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null and username <> '';

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.games add column if not exists description text not null default '';

create table if not exists public.game_members (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner', 'gm', 'player')),
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.campaign_join_requests (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id, status)
);

create table if not exists public.user_dice_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  state jsonb not null default '{"attacks":[],"damages":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_buff_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  character_id uuid references public.character_sheets(id) on delete cascade,
  active_buffs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.buff_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Custom',
  duration text not null default 'variable',
  duration_count integer,
  duration_unit text not null default 'variable' check (duration_unit in ('variable', 'turn', 'round', 'minute', 'hour', 'day')),
  duration_per_level boolean not null default false,
  bonuses jsonb not null default '[]'::jsonb,
  source text not null default 'custom' check (source in ('core', 'custom')),
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint buff_definitions_owner_check check (
    (source = 'core' and user_id is null)
    or (source = 'custom' and user_id is not null)
  )
);

create table if not exists public.character_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  character_name text not null,
  sheet jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.game_loot (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_character_id uuid references public.character_sheets(id) on delete set null,
  name text not null,
  description text not null default '',
  count integer not null default 1 check (count >= 1),
  type text not null default 'Item' check (type in ('Weapon', 'Armor', 'Shield', 'Item')),
  details jsonb not null default '{}'::jsonb,
  effects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.map_state (
  id uuid primary key default gen_random_uuid(),
  context_key text not null default 'general',
  game_id uuid references public.games(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (context_key)
);

create unique index if not exists map_state_context_key_unique
on public.map_state (context_key);

alter table public.game_loot add column if not exists assigned_character_id uuid references public.character_sheets(id) on delete set null;
alter table public.game_loot add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.game_loot add column if not exists effects jsonb not null default '[]'::jsonb;
alter table public.map_state add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.map_state replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.map_state;
exception
  when duplicate_object or undefined_object then null;
end $$;

alter table public.user_dice_state add column if not exists id uuid default gen_random_uuid();
alter table public.user_dice_state add column if not exists context_key text not null default 'general';
alter table public.user_dice_state add column if not exists game_id uuid references public.games(id) on delete cascade;
update public.user_dice_state set id = gen_random_uuid() where id is null;
alter table public.user_dice_state alter column id set not null;
alter table public.user_dice_state alter column user_id set not null;

alter table public.user_buff_state add column if not exists id uuid default gen_random_uuid();
alter table public.user_buff_state add column if not exists context_key text not null default 'general';
alter table public.user_buff_state add column if not exists game_id uuid references public.games(id) on delete cascade;
alter table public.user_buff_state add column if not exists character_id uuid references public.character_sheets(id) on delete cascade;
update public.user_buff_state set id = gen_random_uuid() where id is null;
alter table public.user_buff_state alter column id set not null;
alter table public.user_buff_state alter column user_id set not null;

alter table public.buff_definitions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.buff_definitions add column if not exists category text not null default 'Custom';
alter table public.buff_definitions add column if not exists duration text not null default 'variable';
alter table public.buff_definitions add column if not exists duration_count integer;
alter table public.buff_definitions add column if not exists duration_unit text not null default 'variable';
alter table public.buff_definitions add column if not exists duration_per_level boolean not null default false;
alter table public.buff_definitions add column if not exists bonuses jsonb not null default '[]'::jsonb;
alter table public.buff_definitions add column if not exists source text not null default 'custom';
alter table public.buff_definitions add column if not exists context_key text not null default 'general';
alter table public.buff_definitions add column if not exists game_id uuid references public.games(id) on delete cascade;
alter table public.buff_definitions add column if not exists updated_at timestamptz not null default now();
alter table public.buff_definitions add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'buff_definitions_duration_unit_check'
      and conrelid = 'public.buff_definitions'::regclass
  ) then
    alter table public.buff_definitions
      add constraint buff_definitions_duration_unit_check
      check (duration_unit in ('variable', 'turn', 'round', 'minute', 'hour', 'day'));
  end if;
end $$;

create unique index if not exists buff_definitions_core_name_unique
on public.buff_definitions (lower(name))
where source = 'core';

create unique index if not exists buff_definitions_user_name_unique
on public.buff_definitions (user_id, lower(name))
where source = 'custom';

delete from public.character_sheets old
using (
  select ctid, row_number() over (
    partition by user_id, context_key, character_name
    order by updated_at desc, created_at desc
  ) as rn
  from public.character_sheets
) ranked
where old.ctid = ranked.ctid
  and ranked.rn > 1;

create unique index if not exists character_sheets_user_context_name_unique
on public.character_sheets (user_id, context_key, character_name);

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'user_dice_state_pkey'
      and conrelid = 'public.user_dice_state'::regclass
  ) then
    alter table public.user_dice_state drop constraint user_dice_state_pkey;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_dice_state_pkey'
      and conrelid = 'public.user_dice_state'::regclass
  ) then
    alter table public.user_dice_state add constraint user_dice_state_pkey primary key (id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_dice_state_user_context_unique'
      and conrelid = 'public.user_dice_state'::regclass
  ) then
    alter table public.user_dice_state add constraint user_dice_state_user_context_unique unique (user_id, context_key);
  end if;
end $$;

create unique index if not exists user_buff_state_context_character_unique
on public.user_buff_state (context_key, character_id)
where character_id is not null;

create unique index if not exists user_buff_state_user_context_null_character_unique
on public.user_buff_state (user_id, context_key)
where character_id is null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'user_buff_state_pkey'
      and conrelid = 'public.user_buff_state'::regclass
  ) then
    alter table public.user_buff_state drop constraint user_buff_state_pkey;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_buff_state_pkey'
      and conrelid = 'public.user_buff_state'::regclass
  ) then
    alter table public.user_buff_state add constraint user_buff_state_pkey primary key (id);
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'user_buff_state_user_context_unique'
      and conrelid = 'public.user_buff_state'::regclass
  ) then
    alter table public.user_buff_state drop constraint user_buff_state_user_context_unique;
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.app_admins enable row level security;
alter table public.games enable row level security;
alter table public.game_members enable row level security;
alter table public.campaign_join_requests enable row level security;
alter table public.user_dice_state enable row level security;
alter table public.user_buff_state enable row level security;
alter table public.buff_definitions enable row level security;
alter table public.character_sheets enable row level security;
alter table public.game_loot enable row level security;
alter table public.map_state enable row level security;

insert into public.buff_definitions (name, category, duration, bonuses, source)
values
  ('Bless', 'Spell', '1 minute/level', '[{"stat":"attack","value":1,"type":"morale","stacks":false}]'::jsonb, 'core'),
  ('Bane', 'Spell', '1 minute/level', '[{"stat":"attack","value":-1,"type":"morale","stacks":false},{"stat":"will","value":-1,"type":"morale","stacks":false}]'::jsonb, 'core'),
  ('Heroism', 'Spell', '10 minutes/level', '[{"stat":"attack","value":2,"type":"morale","stacks":false},{"stat":"fortitude","value":2,"type":"morale","stacks":false},{"stat":"reflex","value":2,"type":"morale","stacks":false},{"stat":"will","value":2,"type":"morale","stacks":false}]'::jsonb, 'core'),
  ('Haste', 'Spell', '1 round/level', '[{"stat":"attack","value":1,"type":"untyped","stacks":true},{"stat":"ac","value":1,"type":"dodge","stacks":true},{"stat":"reflex","value":1,"type":"untyped","stacks":true}]'::jsonb, 'core'),
  ('Shield', 'Spell', '1 minute/level', '[{"stat":"ac","value":4,"type":"shield","stacks":false}]'::jsonb, 'core'),
  ('Barkskin', 'Spell', '10 minutes/level', '[{"stat":"natural armor","value":2,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Mage Armor', 'Spell', '1 hour/level', '[{"stat":"ac","value":4,"type":"armor","stacks":false}]'::jsonb, 'core'),
  ('Rage', 'Class Ability', 'variable', '[{"stat":"strength","value":4,"type":"morale","stacks":false},{"stat":"constitution","value":4,"type":"morale","stacks":false},{"stat":"ac","value":-2,"type":"untyped","stacks":true}]'::jsonb, 'core'),
  ('Enlarge Person', 'Spell', '1 minute/level', '[{"stat":"strength","value":2,"type":"size","stacks":false},{"stat":"dexterity","value":-2,"type":"size","stacks":false},{"stat":"ac","value":-1,"type":"size","stacks":false}]'::jsonb, 'core'),
  ('Reduce Person', 'Spell', '1 minute/level', '[{"stat":"strength","value":-2,"type":"size","stacks":false},{"stat":"dexterity","value":2,"type":"size","stacks":false},{"stat":"ac","value":1,"type":"size","stacks":false}]'::jsonb, 'core')
on conflict do nothing;

insert into public.buff_definitions (name, category, duration, bonuses, source)
values
  ('Bull''s Strength', 'Spell', '1 minute/level', '[{"stat":"strength","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Cat''s Grace', 'Spell', '1 minute/level', '[{"stat":"dexterity","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Bear''s Endurance', 'Spell', '1 minute/level', '[{"stat":"constitution","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Fox''s Cunning', 'Spell', '1 minute/level', '[{"stat":"intelligence","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Owl''s Wisdom', 'Spell', '1 minute/level', '[{"stat":"wisdom","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Eagle''s Splendor', 'Spell', '1 minute/level', '[{"stat":"charisma","value":4,"type":"enhancement","stacks":false}]'::jsonb, 'core'),
  ('Shield of Faith', 'Spell', '1 minute/level', '[{"stat":"deflection","value":2,"type":"deflection","stacks":false}]'::jsonb, 'core'),
  ('Divine Favor', 'Spell', '1 minute', '[{"stat":"attack","value":1,"type":"luck","stacks":false},{"stat":"damage","value":1,"type":"luck","stacks":false}]'::jsonb, 'core'),
  ('Prayer', 'Spell', '1 round/level', '[{"stat":"attack","value":1,"type":"luck","stacks":false},{"stat":"damage","value":1,"type":"luck","stacks":false},{"stat":"fortitude","value":1,"type":"luck","stacks":false},{"stat":"reflex","value":1,"type":"luck","stacks":false},{"stat":"will","value":1,"type":"luck","stacks":false}]'::jsonb, 'core'),
  ('Good Hope', 'Spell', '1 minute/level', '[{"stat":"attack","value":2,"type":"morale","stacks":false},{"stat":"damage","value":2,"type":"morale","stacks":false},{"stat":"fortitude","value":2,"type":"morale","stacks":false},{"stat":"reflex","value":2,"type":"morale","stacks":false},{"stat":"will","value":2,"type":"morale","stacks":false}]'::jsonb, 'core')
on conflict do nothing;

insert into public.buff_definitions (name, category, duration, bonuses, source)
select seed.name, seed.category, seed.duration, seed.bonuses, 'core'
from (
  values
    ('Bull''s Strength', 'Spell', '1 minute/level', '[{"stat":"strength","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Cat''s Grace', 'Spell', '1 minute/level', '[{"stat":"dexterity","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Bear''s Endurance', 'Spell', '1 minute/level', '[{"stat":"constitution","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Fox''s Cunning', 'Spell', '1 minute/level', '[{"stat":"intelligence","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Owl''s Wisdom', 'Spell', '1 minute/level', '[{"stat":"wisdom","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Eagle''s Splendor', 'Spell', '1 minute/level', '[{"stat":"charisma","value":4,"type":"enhancement","stacks":false}]'::jsonb),
    ('Shield of Faith', 'Spell', '1 minute/level', '[{"stat":"deflection","value":2,"type":"deflection","stacks":false}]'::jsonb),
    ('Divine Favor', 'Spell', '1 minute', '[{"stat":"attack","value":1,"type":"luck","stacks":false},{"stat":"damage","value":1,"type":"luck","stacks":false}]'::jsonb),
    ('Prayer', 'Spell', '1 round/level', '[{"stat":"attack","value":1,"type":"luck","stacks":false},{"stat":"damage","value":1,"type":"luck","stacks":false},{"stat":"fortitude","value":1,"type":"luck","stacks":false},{"stat":"reflex","value":1,"type":"luck","stacks":false},{"stat":"will","value":1,"type":"luck","stacks":false}]'::jsonb),
    ('Good Hope', 'Spell', '1 minute/level', '[{"stat":"attack","value":2,"type":"morale","stacks":false},{"stat":"damage","value":2,"type":"morale","stacks":false},{"stat":"fortitude","value":2,"type":"morale","stacks":false},{"stat":"reflex","value":2,"type":"morale","stacks":false},{"stat":"will","value":2,"type":"morale","stacks":false}]'::jsonb)
) as seed(name, category, duration, bonuses)
where not exists (
  select 1
  from public.buff_definitions existing
  where existing.source = 'core'
    and lower(existing.name) = lower(seed.name)
);

insert into public.buff_definitions (name, category, duration, bonuses, source)
select seed.name, 'Condition', 'variable', seed.bonuses, 'core'
from (
  values
    ('Bleed', '[]'::jsonb),
    ('Blinded', '[{"stat":"ac","value":-2,"type":"penalty","stacks":true},{"stat":"skill checks","value":-4,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"Str/Dex skills"},{"stat":"skill checks","value":-4,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"opposed Perception"}]'::jsonb),
    ('Broken', '[{"stat":"attack","value":-2,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"item"},{"stat":"damage","value":-2,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"item"},{"stat":"skill checks","value":-2,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"tool"}]'::jsonb),
    ('Confused', '[]'::jsonb),
    ('Cowering', '[{"stat":"ac","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Dazed', '[]'::jsonb),
    ('Dazzled', '[{"stat":"attack","value":-1,"type":"penalty","stacks":true},{"stat":"skill checks","value":-1,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"sight Perception"}]'::jsonb),
    ('Dead', '[]'::jsonb),
    ('Deafened', '[{"stat":"initiative","value":-4,"type":"penalty","stacks":true},{"stat":"skill checks","value":-4,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"opposed Perception"}]'::jsonb),
    ('Disabled', '[]'::jsonb),
    ('Dying', '[]'::jsonb),
    ('Energy Drained', '[{"stat":"attack","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"cmb","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"cmd","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"fortitude","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"reflex","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"will","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"skill checks","value":-1,"type":"penalty","stacks":true,"appliesWhen":"per neg level"},{"stat":"hit points","value":-5,"type":"penalty","stacks":true,"appliesWhen":"per neg level"}]'::jsonb),
    ('Entangled', '[{"stat":"attack","value":-2,"type":"penalty","stacks":true},{"stat":"dexterity","value":-4,"type":"penalty","stacks":true}]'::jsonb),
    ('Exhausted', '[{"stat":"strength","value":-6,"type":"penalty","stacks":true},{"stat":"dexterity","value":-6,"type":"penalty","stacks":true}]'::jsonb),
    ('Fascinated', '[{"stat":"skill checks","value":-4,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"reaction"}]'::jsonb),
    ('Fatigued', '[{"stat":"strength","value":-2,"type":"penalty","stacks":true},{"stat":"dexterity","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Flat-Footed', '[{"stat":"ac","value":0,"type":"condition","conditional":true,"appliesWhen":"lose Dex"},{"stat":"cmd","value":0,"type":"condition","conditional":true,"appliesWhen":"lose Dex"}]'::jsonb),
    ('Frightened', '[{"stat":"attack","value":-2,"type":"penalty","stacks":true},{"stat":"fortitude","value":-2,"type":"penalty","stacks":true},{"stat":"reflex","value":-2,"type":"penalty","stacks":true},{"stat":"will","value":-2,"type":"penalty","stacks":true},{"stat":"skill checks","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Grappled', '[{"stat":"dexterity","value":-4,"type":"penalty","stacks":true},{"stat":"attack","value":-2,"type":"penalty","stacks":true},{"stat":"cmb","value":-2,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"not grapple"}]'::jsonb),
    ('Helpless', '[{"stat":"dexterity","value":0,"type":"condition","conditional":true,"appliesWhen":"effective 0"}]'::jsonb),
    ('Incorporeal', '[]'::jsonb),
    ('Invisible', '[{"stat":"attack","value":2,"type":"condition","stacks":true,"conditional":true,"appliesWhen":"vs sighted"},{"stat":"ac","value":0,"type":"condition","conditional":true,"appliesWhen":"deny Dex"}]'::jsonb),
    ('Nauseated', '[]'::jsonb),
    ('Panicked', '[{"stat":"fortitude","value":-2,"type":"penalty","stacks":true},{"stat":"reflex","value":-2,"type":"penalty","stacks":true},{"stat":"will","value":-2,"type":"penalty","stacks":true},{"stat":"skill checks","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Paralyzed', '[{"stat":"strength","value":0,"type":"condition","conditional":true,"appliesWhen":"set 0"},{"stat":"dexterity","value":0,"type":"condition","conditional":true,"appliesWhen":"set 0"}]'::jsonb),
    ('Petrified', '[]'::jsonb),
    ('Pinned', '[{"stat":"ac","value":-4,"type":"penalty","stacks":true},{"stat":"ac","value":0,"type":"condition","conditional":true,"appliesWhen":"lose Dex"}]'::jsonb),
    ('Prone', '[{"stat":"melee attack","value":-4,"type":"penalty","stacks":true},{"stat":"ac","value":4,"type":"condition","stacks":true,"conditional":true,"appliesWhen":"vs ranged"},{"stat":"ac","value":-4,"type":"penalty","stacks":true,"conditional":true,"appliesWhen":"vs melee"}]'::jsonb),
    ('Shaken', '[{"stat":"attack","value":-2,"type":"penalty","stacks":true},{"stat":"fortitude","value":-2,"type":"penalty","stacks":true},{"stat":"reflex","value":-2,"type":"penalty","stacks":true},{"stat":"will","value":-2,"type":"penalty","stacks":true},{"stat":"skill checks","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Sickened', '[{"stat":"attack","value":-2,"type":"penalty","stacks":true},{"stat":"damage","value":-2,"type":"penalty","stacks":true},{"stat":"fortitude","value":-2,"type":"penalty","stacks":true},{"stat":"reflex","value":-2,"type":"penalty","stacks":true},{"stat":"will","value":-2,"type":"penalty","stacks":true},{"stat":"skill checks","value":-2,"type":"penalty","stacks":true}]'::jsonb),
    ('Sinking', '[]'::jsonb),
    ('Stable', '[]'::jsonb),
    ('Staggered', '[]'::jsonb),
    ('Stunned', '[{"stat":"ac","value":-2,"type":"penalty","stacks":true},{"stat":"ac","value":0,"type":"condition","conditional":true,"appliesWhen":"lose Dex"},{"stat":"cmb","value":4,"type":"condition","conditional":true,"appliesWhen":"enemy vs you"}]'::jsonb),
    ('Unconscious', '[]'::jsonb)
) as seed(name, bonuses)
where not exists (
  select 1
  from public.buff_definitions existing
  where existing.source = 'core'
    and lower(existing.name) = lower(seed.name)
);

insert into public.buff_definitions (
  name,
  category,
  duration,
  duration_count,
  duration_unit,
  duration_per_level,
  bonuses,
  source
)
select
  'Tears to Wine',
  'Spell',
  '10 minutes / level',
  10,
  'minute',
  true,
  '[
    {"stat":"intelligence skill checks","value":2,"type":"enhancement","stacks":false,"bonusScale":{"milestones":[{"level":9,"value":5},{"level":15,"value":10}]}},
    {"stat":"wisdom skill checks","value":2,"type":"enhancement","stacks":false,"bonusScale":{"milestones":[{"level":9,"value":5},{"level":15,"value":10}]}}
  ]'::jsonb,
  'core'
where not exists (
  select 1
  from public.buff_definitions existing
  where existing.source = 'core'
    and lower(existing.name) = lower('Tears to Wine')
);

update public.buff_definitions
set
  duration_count = case
    when lower(duration) in ('', 'variable', 'permanent') then null
    when duration ~ '[0-9]+' then substring(duration from '[0-9]+')::integer
    else 1
  end,
  duration_unit = case
    when lower(duration) like '%turn%' then 'turn'
    when lower(duration) like '%round%' then 'round'
    when lower(duration) like '%minute%' then 'minute'
    when lower(duration) like '%hour%' then 'hour'
    when lower(duration) like '%day%' then 'day'
    else 'variable'
  end,
  duration_per_level = (
    lower(duration) like '%/level%'
    or lower(duration) like '%per level%'
  )
where duration_count is null
  and duration_unit = 'variable'
  and coalesce(duration, '') <> '';

update public.buff_definitions
set
  duration_count = null,
  duration_per_level = false
where duration_unit = 'variable';

update public.buff_definitions
set duration = case
  when duration_count is null or duration_unit = 'variable' then 'variable'
  else duration_count::text || ' ' || duration_unit ||
    case when duration_count = 1 then '' else 's' end ||
    case when duration_per_level then ' / level' else '' end
end;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_game_member(target_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_members
    where game_id = target_game_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

create or replace function public.admin_update_buff_definition(
  target_buff_id uuid,
  new_name text,
  new_category text,
  new_duration text,
  new_duration_count integer,
  new_duration_unit text,
  new_duration_per_level boolean,
  new_bonuses jsonb
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
      bonuses = new_bonuses,
      updated_at = now()
  where id = target_buff_id
  returning * into updated_buff;

  if updated_buff.id is null then
    raise exception 'Effect not found';
  end if;

  return updated_buff;
end;
$$;

revoke all on function public.admin_update_buff_definition(uuid, text, text, text, integer, text, boolean, jsonb) from public;
grant execute on function public.admin_update_buff_definition(uuid, text, text, text, integer, text, boolean, jsonb) to authenticated;

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
    new_bonuses
  );
end;
$$;

revoke all on function public.admin_update_buff_bonuses(uuid, jsonb) from public;
grant execute on function public.admin_update_buff_bonuses(uuid, jsonb) to authenticated;

create or replace function public.admin_delete_buff_definition(target_buff_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Only app admins can delete effect definitions';
  end if;

  delete from public.buff_definitions
  where id = target_buff_id;

  if not found then
    raise exception 'Effect not found';
  end if;
end;
$$;

revoke all on function public.admin_delete_buff_definition(uuid) from public;
grant execute on function public.admin_delete_buff_definition(uuid) to authenticated;

create or replace function public.is_game_owner(target_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games
    where id = target_game_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.is_game_gm(target_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games
    where id = target_game_id
      and owner_id = auth.uid()
  )
  or public.is_app_admin()
  or exists (
    select 1
    from public.game_members
    where game_id = target_game_id
      and user_id = auth.uid()
      and role in ('owner', 'gm')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

create or replace function public.create_game(game_name text)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  created_game public.games;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.games (owner_id, name)
  values (auth.uid(), game_name)
  returning * into created_game;

  insert into public.game_members (game_id, user_id, role)
  values (created_game.id, auth.uid(), 'owner');

  return created_game;
end;
$$;

revoke all on function public.create_game(text) from public;
grant execute on function public.create_game(text) to authenticated;

create or replace function public.create_campaign(game_name text, game_description text default '')
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  created_game public.games;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.games (owner_id, name, description)
  values (auth.uid(), nullif(trim(game_name), ''), coalesce(game_description, ''))
  returning * into created_game;

  insert into public.game_members (game_id, user_id, role)
  values (created_game.id, auth.uid(), 'gm');

  return created_game;
end;
$$;

revoke all on function public.create_campaign(text, text) from public;
grant execute on function public.create_campaign(text, text) to authenticated;

create or replace function public.find_campaign(target_game_id uuid)
returns table (id uuid, name text, description text)
language sql
security definer
set search_path = public
as $$
  select games.id, games.name, games.description
  from public.games
  where games.id = target_game_id;
$$;

revoke all on function public.find_campaign(uuid) from public;
grant execute on function public.find_campaign(uuid) to authenticated;

create or replace function public.request_campaign_access(target_game_id uuid)
returns public.campaign_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.campaign_join_requests;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_game_member(target_game_id) then
    raise exception 'Already a member of this campaign';
  end if;

  insert into public.campaign_join_requests (game_id, user_id, status, updated_at)
  values (target_game_id, auth.uid(), 'pending', now())
  on conflict (game_id, user_id, status) do update set updated_at = now()
  returning * into request_row;

  return request_row;
end;
$$;

revoke all on function public.request_campaign_access(uuid) from public;
grant execute on function public.request_campaign_access(uuid) to authenticated;

create or replace function public.get_my_campaigns()
returns table (
  id uuid,
  name text,
  description text,
  owner_id uuid,
  role text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, g.description, g.owner_id, coalesce(gm.role, 'admin') as role, g.created_at
  from public.games g
  left join public.game_members gm
    on gm.game_id = g.id
   and gm.user_id = auth.uid()
  where gm.user_id = auth.uid()
     or public.is_app_admin()
  order by (g.owner_id = auth.uid()) desc, lower(g.name);
$$;

revoke all on function public.get_my_campaigns() from public;
grant execute on function public.get_my_campaigns() to authenticated;

create or replace function public.get_campaign_requests()
returns table (
  id uuid,
  game_id uuid,
  campaign_name text,
  user_id uuid,
  email text,
  username text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.game_id, g.name, r.user_id, p.email, p.username, r.created_at
  from public.campaign_join_requests r
  join public.games g on g.id = r.game_id
  left join public.profiles p on p.id = r.user_id
  where (g.owner_id = auth.uid() or public.is_app_admin())
    and r.status = 'pending'
  order by r.created_at;
$$;

revoke all on function public.get_campaign_requests() from public;
grant execute on function public.get_campaign_requests() to authenticated;

create or replace function public.respond_campaign_request(request_id uuid, accept_request boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.campaign_join_requests;
begin
  select * into request_row
  from public.campaign_join_requests
  where id = request_id
    and status = 'pending';

  if request_row.id is null then
    raise exception 'Request not found';
  end if;

  if not exists (
    select 1 from public.games
    where id = request_row.game_id
      and (owner_id = auth.uid() or public.is_app_admin())
  ) then
    raise exception 'Only the GM can respond to this request';
  end if;

  update public.campaign_join_requests
  set status = case when accept_request then 'accepted' else 'denied' end,
      updated_at = now()
  where id = request_id;

  if accept_request then
    insert into public.game_members (game_id, user_id, role)
    values (request_row.game_id, request_row.user_id, 'player')
    on conflict (game_id, user_id) do update set role = excluded.role;
  end if;
end;
$$;

revoke all on function public.respond_campaign_request(uuid, boolean) from public;
grant execute on function public.respond_campaign_request(uuid, boolean) to authenticated;

create or replace function public.get_game_members(target_game_id uuid)
returns table (
  user_id uuid,
  email text,
  username text,
  avatar_url text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    gm.user_id,
    p.email,
    p.username,
    p.avatar_url,
    gm.role
  from public.game_members gm
  left join public.profiles p on p.id = gm.user_id
  where gm.game_id = target_game_id
    and (public.is_game_member(target_game_id) or public.is_app_admin())
  order by coalesce(nullif(p.username, ''), p.email, gm.user_id::text);
$$;

revoke all on function public.get_game_members(uuid) from public;
grant execute on function public.get_game_members(uuid) to authenticated;

drop function if exists public.get_context_characters(text);

create or replace function public.get_context_characters(target_context_key text)
returns table (
  id uuid,
  character_name text,
  user_id uuid,
  sheet jsonb,
  username text,
  email text
)
language sql
security definer
set search_path = public
as $$
  select
    cs.id,
    cs.character_name,
    cs.user_id,
    cs.sheet,
    p.username,
    p.email
  from public.character_sheets cs
  left join public.profiles p on p.id = cs.user_id
  where cs.context_key = target_context_key
    and (
      (cs.game_id is null and cs.user_id = auth.uid())
      or (cs.game_id is not null and (public.is_game_member(cs.game_id) or public.is_app_admin()))
    )
  order by lower(cs.character_name), coalesce(nullif(p.username, ''), p.email, cs.user_id::text);
$$;

revoke all on function public.get_context_characters(text) from public;
grant execute on function public.get_context_characters(text) to authenticated;

create or replace function public.leave_campaign(target_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.games
    where id = target_game_id
      and owner_id = auth.uid()
  ) then
    raise exception 'The GM cannot leave their own campaign';
  end if;

  update public.game_loot loot
  set assigned_character_id = null,
      assigned_to = null,
      updated_at = now()
  where loot.assigned_character_id in (
    select id from public.character_sheets
    where game_id = target_game_id
      and user_id = auth.uid()
  );

  delete from public.game_members
  where game_id = target_game_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.leave_campaign(uuid) from public;
grant execute on function public.leave_campaign(uuid) to authenticated;

create or replace function public.kick_campaign_member(target_game_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.games
    where id = target_game_id
      and owner_id = auth.uid()
  ) then
    raise exception 'Only the GM can remove members';
  end if;

  if exists (
    select 1 from public.games
    where id = target_game_id
      and owner_id = target_user_id
  ) then
    raise exception 'The GM cannot be removed';
  end if;

  update public.game_loot loot
  set assigned_character_id = null,
      assigned_to = null,
      updated_at = now()
  where loot.assigned_character_id in (
    select id from public.character_sheets
    where game_id = target_game_id
      and user_id = target_user_id
  );

  delete from public.game_members
  where game_id = target_game_id
    and user_id = target_user_id;
end;
$$;

revoke all on function public.kick_campaign_member(uuid, uuid) from public;
grant execute on function public.kick_campaign_member(uuid, uuid) to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "profiles are self readable" on public.profiles;
create policy "profiles are self readable"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_app_admin());

drop policy if exists "profiles are self insertable" on public.profiles;
create policy "profiles are self insertable"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles are self editable" on public.profiles;
create policy "profiles are self editable"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "users can upload own avatar" on storage.objects;
create policy "users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update own avatar" on storage.objects;
create policy "users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can delete own avatar" on storage.objects;
create policy "users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can create owned games" on public.games;
create policy "users can create owned games"
on public.games for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "members can read games" on public.games;
create policy "members can read games"
on public.games for select
to authenticated
using (owner_id = auth.uid() or public.is_game_member(id) or public.is_app_admin());

drop policy if exists "owners can update games" on public.games;
create policy "owners can update games"
on public.games for update
to authenticated
using (owner_id = auth.uid() or public.is_app_admin())
with check (owner_id = auth.uid() or public.is_app_admin());

drop policy if exists "owners can delete games" on public.games;
create policy "owners can delete games"
on public.games for delete
to authenticated
using (owner_id = auth.uid() or public.is_app_admin());

drop policy if exists "members can read memberships" on public.game_members;
create policy "members can read memberships"
on public.game_members for select
to authenticated
using (public.is_game_member(game_id) or public.is_app_admin());

drop policy if exists "users can read relevant join requests" on public.campaign_join_requests;
create policy "users can read relevant join requests"
on public.campaign_join_requests for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.games
    where games.id = campaign_join_requests.game_id
      and (games.owner_id = auth.uid() or public.is_app_admin())
  )
);

drop policy if exists "users can create own join requests" on public.campaign_join_requests;
create policy "users can create own join requests"
on public.campaign_join_requests for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "owners can update join requests" on public.campaign_join_requests;
create policy "owners can update join requests"
on public.campaign_join_requests for update
to authenticated
using (
  exists (
    select 1 from public.games
    where games.id = campaign_join_requests.game_id
      and (games.owner_id = auth.uid() or public.is_app_admin())
  )
);

drop policy if exists "owners can manage memberships" on public.game_members;
create policy "owners can manage memberships"
on public.game_members for all
to authenticated
using (
  exists (
    select 1 from public.games
    where games.id = game_members.game_id
      and (games.owner_id = auth.uid() or public.is_app_admin())
  )
)
with check (
  exists (
    select 1 from public.games
    where games.id = game_members.game_id
      and (games.owner_id = auth.uid() or public.is_app_admin())
  )
);

drop policy if exists "users can read own dice" on public.user_dice_state;
create policy "users can read own dice"
on public.user_dice_state for select
to authenticated
using (
  user_id = auth.uid()
  and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
);

drop policy if exists "users can write own dice" on public.user_dice_state;
create policy "users can write own dice"
on public.user_dice_state for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can update own dice" on public.user_dice_state;
create policy "users can update own dice"
on public.user_dice_state for update
to authenticated
using (
  user_id = auth.uid()
  and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
)
with check (
  user_id = auth.uid()
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can read own buffs" on public.user_buff_state;
create policy "users can read own buffs"
on public.user_buff_state for select
to authenticated
using (
  (
    user_id = auth.uid()
    and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
  )
  or public.is_app_admin()
  or exists (
    select 1
    from public.character_sheets cs
    where cs.id = character_id
      and cs.game_id is not null
      and public.is_game_gm(cs.game_id)
  )
);

drop policy if exists "users can write own buffs" on public.user_buff_state;
create policy "users can write own buffs"
on public.user_buff_state for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    character_id is null
    or exists (
      select 1
      from public.character_sheets cs
      where cs.id = character_id
        and (cs.user_id = auth.uid() or public.is_game_gm(cs.game_id) or public.is_app_admin())
    )
  )
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can update own buffs" on public.user_buff_state;
create policy "users can update own buffs"
on public.user_buff_state for update
to authenticated
using (
  (
    user_id = auth.uid()
    and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
  )
  or public.is_app_admin()
  or exists (
    select 1
    from public.character_sheets cs
    where cs.id = character_id
      and cs.game_id is not null
      and public.is_game_gm(cs.game_id)
  )
)
with check (
  user_id = auth.uid()
  and (
    character_id is null
    or exists (
      select 1
      from public.character_sheets cs
      where cs.id = character_id
        and (cs.user_id = auth.uid() or public.is_game_gm(cs.game_id) or public.is_app_admin())
    )
  )
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can read core and own buff definitions" on public.buff_definitions;
create policy "users can read core and own buff definitions"
on public.buff_definitions for select
to authenticated
using (source = 'core' or user_id = auth.uid() or public.is_app_admin());

drop policy if exists "users can create own buff definitions" on public.buff_definitions;
create policy "users can create own buff definitions"
on public.buff_definitions for insert
to authenticated
with check (
  user_id = auth.uid()
  and source = 'custom'
  and name <> ''
  and jsonb_typeof(bonuses) = 'array'
);

drop policy if exists "users can update own buff definitions" on public.buff_definitions;
create policy "users can update own buff definitions"
on public.buff_definitions for update
to authenticated
using ((user_id = auth.uid() or public.is_app_admin()) and source = 'custom')
with check (
  user_id = auth.uid()
  and source = 'custom'
  and name <> ''
  and jsonb_typeof(bonuses) = 'array'
);

drop policy if exists "users can delete own buff definitions" on public.buff_definitions;
create policy "users can delete own buff definitions"
on public.buff_definitions for delete
to authenticated
using ((user_id = auth.uid() or public.is_app_admin()) and source = 'custom');

drop policy if exists "users can read own character sheets" on public.character_sheets;
create policy "users can read own character sheets"
on public.character_sheets for select
to authenticated
using (
  (
    user_id = auth.uid()
    and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
  )
  or (
    game_id is not null
    and (public.is_game_gm(game_id) or public.is_app_admin())
  )
);

drop policy if exists "users can write own character sheets" on public.character_sheets;
create policy "users can write own character sheets"
on public.character_sheets for insert
to authenticated
with check (
  user_id = auth.uid()
  and character_name <> ''
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can update own character sheets" on public.character_sheets;
create policy "users can update own character sheets"
on public.character_sheets for update
to authenticated
using (
  user_id = auth.uid()
  and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
)
with check (
  user_id = auth.uid()
  and character_name <> ''
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "users can delete own character sheets" on public.character_sheets;
create policy "users can delete own character sheets"
on public.character_sheets for delete
to authenticated
using (
  user_id = auth.uid()
  and (game_id is null or public.is_game_member(game_id) or public.is_app_admin())
);

drop policy if exists "members can read loot" on public.game_loot;
create policy "members can read loot"
on public.game_loot for select
to authenticated
using (
  (context_key = 'general' and game_id is null and created_by = auth.uid())
  or (game_id is not null and (public.is_game_member(game_id) or public.is_app_admin()))
);

drop policy if exists "members can create loot" on public.game_loot;
create policy "members can create loot"
on public.game_loot for insert
to authenticated
with check (
  created_by = auth.uid()
  and name <> ''
  and count >= 1
  and jsonb_typeof(details) = 'object'
  and jsonb_typeof(effects) = 'array'
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "members can update loot" on public.game_loot;
create policy "members can update loot"
on public.game_loot for update
to authenticated
using (
  (context_key = 'general' and game_id is null and created_by = auth.uid())
  or (game_id is not null and (public.is_game_member(game_id) or public.is_app_admin()))
)
with check (
  name <> ''
  and count >= 1
  and jsonb_typeof(details) = 'object'
  and jsonb_typeof(effects) = 'array'
  and (
    (context_key = 'general' and game_id is null and created_by = auth.uid())
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "members can delete loot" on public.game_loot;
create policy "members can delete loot"
on public.game_loot for delete
to authenticated
using (
  (context_key = 'general' and game_id is null and created_by = auth.uid())
  or (game_id is not null and (public.is_game_member(game_id) or public.is_app_admin()))
);

drop policy if exists "members can read map state" on public.map_state;
create policy "members can read map state"
on public.map_state for select
to authenticated
using (
  (context_key = 'general' and game_id is null)
  or (game_id is not null and (public.is_game_member(game_id) or public.is_app_admin()))
);

drop policy if exists "members can create map state" on public.map_state;
create policy "members can create map state"
on public.map_state for insert
to authenticated
with check (
  updated_by = auth.uid()
  and jsonb_typeof(state) = 'object'
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);

drop policy if exists "members can update map state" on public.map_state;
create policy "members can update map state"
on public.map_state for update
to authenticated
using (
  (context_key = 'general' and game_id is null)
  or (game_id is not null and (public.is_game_member(game_id) or public.is_app_admin()))
)
with check (
  updated_by = auth.uid()
  and jsonb_typeof(state) = 'object'
  and (
    (context_key = 'general' and game_id is null)
    or (context_key = 'game:' || game_id::text and (public.is_game_member(game_id) or public.is_app_admin()))
  )
);
