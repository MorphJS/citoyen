-- DATA_MODEL.sql — Citoyen
-- Ejecutar en el SQL editor de Supabase (o como migración).
-- Principios:
--  * Tablas con datos SECRETOS (host_secrets, player_secrets): RLS activado y SIN políticas => ningún cliente las lee.
--  * Los clientes anónimos NO insertan/actualizan directamente: solo llaman RPCs (SECURITY DEFINER).
--  * Lectura pública (anon) de sessions/players/decisions/posts aprobados, para Realtime y para el proyector.
-- NOTA: validado en un Postgres 16 local con roles anon/authenticated simulados (13 comprobaciones en docs/SMOKE_TEST.sql, todas OK).
--       NO se ha probado aún contra un proyecto real de Supabase: repetir el humo ahí en la Fase 0.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tablas ----------
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null check (code ~ '^[A-Z0-9]{4,6}$'),
  scene            text not null default 'lobby',
  scene_started_at timestamptz not null default now(),
  scene_payload    jsonb not null default '{}'::jsonb,   -- p. ej. { "rey_player_id": "...", "pradial": true }
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now()
);

create table if not exists public.host_secrets (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  secret_hash text not null
);

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 20),
  identity    jsonb not null default '{}'::jsonb,
  status      text not null default 'active' check (status in ('active','kicked')),
  fate        text check (fate in ('absuelto','condenado','no_citado','arrestado')),
  created_at  timestamptz not null default now()
);
create unique index if not exists players_session_nick_uq
  on public.players (session_id, lower(nickname));

create table if not exists public.player_secrets (
  player_id uuid primary key references public.players(id) on delete cascade,
  token     uuid not null default gen_random_uuid()
);

create table if not exists public.decisions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  scene       text not null,
  prompt_key  text not null default 'main',
  choice      text not null,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (player_id, scene, prompt_key)          -- un voto por pregunta
);
create index if not exists decisions_session_scene_idx on public.decisions (session_id, scene);

create table if not exists public.posts (          -- Le Vieux Cordelier (texto libre moderado)
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  scene       text not null,
  body        text not null check (char_length(body) between 1 and 140),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  unique (player_id, scene)
);

-- ---------- RLS ----------
alter table public.sessions        enable row level security;
alter table public.host_secrets    enable row level security;   -- sin políticas a propósito
alter table public.players         enable row level security;
alter table public.player_secrets  enable row level security;   -- sin políticas a propósito
alter table public.decisions       enable row level security;
alter table public.posts           enable row level security;

drop policy if exists sessions_read  on public.sessions;
drop policy if exists players_read   on public.players;
drop policy if exists decisions_read on public.decisions;
drop policy if exists posts_read     on public.posts;

create policy sessions_read  on public.sessions  for select to anon, authenticated using (true);
create policy players_read   on public.players   for select to anon, authenticated using (true);
create policy decisions_read on public.decisions for select to anon, authenticated using (true);
create policy posts_read     on public.posts     for select to anon, authenticated using (status = 'approved');

-- Sin políticas de insert/update/delete: todo cambio pasa por las funciones de abajo.

-- ---------- Helpers internos ----------
create or replace function public._check_host(p_code text, p_secret text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  select s.id into v_id
  from sessions s join host_secrets h on h.session_id = s.id
  where s.code = upper(p_code) and h.secret_hash = crypt(p_secret, h.secret_hash);
  if v_id is null then
    raise exception 'host_auth_failed' using errcode = '28000';
  end if;
  return v_id;
end $$;

create or replace function public._check_player(p_player uuid, p_token uuid)
returns uuid                         -- devuelve session_id
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_session uuid;
begin
  select p.session_id into v_session
  from players p join player_secrets ps on ps.player_id = p.id
  where p.id = p_player and ps.token = p_token and p.status = 'active';
  if v_session is null then
    raise exception 'player_auth_failed' using errcode = '28000';
  end if;
  return v_session;
end $$;

revoke all on function public._check_host(text, text)  from public, anon, authenticated;
revoke all on function public._check_player(uuid, uuid) from public, anon, authenticated;

-- ---------- RPCs del HOST ----------
create or replace function public.create_session(p_code text, p_host_secret text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  if char_length(p_host_secret) < 6 then
    raise exception 'host_secret_too_short';
  end if;
  insert into sessions (code) values (upper(p_code)) returning id into v_id;
  insert into host_secrets (session_id, secret_hash)
    values (v_id, crypt(p_host_secret, gen_salt('bf')));
  return v_id;
end $$;

create or replace function public.host_set_scene(p_code text, p_host_secret text, p_scene text, p_payload jsonb default null)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  update sessions
     set scene = p_scene,
         scene_started_at = now(),
         scene_payload = coalesce(p_payload, scene_payload)
   where id = v_id;
end $$;

create or replace function public.host_list_pending_posts(p_code text, p_host_secret text)
returns setof public.posts
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  return query select * from posts where session_id = v_id and status = 'pending' order by created_at;
end $$;

create or replace function public.host_moderate_post(p_code text, p_host_secret text, p_post uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  if p_status not in ('approved','rejected') then
    raise exception 'invalid_status';
  end if;
  update posts set status = p_status where id = p_post and session_id = v_id;
end $$;

-- p_fates: [{"player_id": "...", "fate": "absuelto"}, ...]
create or replace function public.host_set_fates(p_code text, p_host_secret text, p_fates jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  update players p
     set fate = f.fate
    from jsonb_to_recordset(p_fates) as f(player_id uuid, fate text)
   where p.id = f.player_id and p.session_id = v_id;
end $$;

create or replace function public.host_kick_player(p_code text, p_host_secret text, p_player uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  update players set status = 'kicked' where id = p_player and session_id = v_id;
end $$;

-- ---------- RPCs del JUGADOR ----------
create or replace function public.join_session(p_code text, p_nickname text, p_identity jsonb default '{}'::jsonb)
returns table (player_id uuid, token uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_session uuid; v_player uuid; v_token uuid;
begin
  select id into v_session from sessions where code = upper(p_code) and status = 'open';
  if v_session is null then
    raise exception 'session_not_found';
  end if;
  insert into players (session_id, nickname, identity)
    values (v_session, trim(p_nickname), coalesce(p_identity, '{}'::jsonb))
    returning id into v_player;
  -- Ojo: 'token' y 'player_id' también son columnas de salida (RETURNS TABLE); hay que calificar.
  insert into player_secrets (player_id) values (v_player) returning player_secrets.token into v_token;
  return query select v_player, v_token;
end $$;

create or replace function public.submit_decision(p_player uuid, p_token uuid, p_scene text, p_choice text, p_prompt_key text default 'main', p_meta jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_session uuid := public._check_player(p_player, p_token);
begin
  -- Solo se acepta la decisión de la escena activa (evita adelantarse o reescribir el pasado).
  if not exists (select 1 from sessions where id = v_session and scene = p_scene) then
    raise exception 'scene_not_active';
  end if;
  insert into decisions (session_id, player_id, scene, prompt_key, choice, meta)
    values (v_session, p_player, p_scene, p_prompt_key, p_choice, coalesce(p_meta, '{}'::jsonb))
    on conflict (player_id, scene, prompt_key) do nothing;
end $$;

create or replace function public.submit_post(p_player uuid, p_token uuid, p_scene text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_session uuid := public._check_player(p_player, p_token);
begin
  if not exists (select 1 from sessions where id = v_session and scene = p_scene) then
    raise exception 'scene_not_active';
  end if;
  insert into posts (session_id, player_id, scene, body)
    values (v_session, p_player, p_scene, left(trim(p_body), 140))
    on conflict (player_id, scene) do nothing;
end $$;

-- ---------- Permisos de ejecución ----------
-- Por defecto PUBLIC puede ejecutar funciones; restringimos y damos solo lo necesario.
revoke all on function public.create_session(text, text)                              from public;
revoke all on function public.host_set_scene(text, text, text, jsonb)                 from public;
revoke all on function public.host_list_pending_posts(text, text)                     from public;
revoke all on function public.host_moderate_post(text, text, uuid, text)              from public;
revoke all on function public.host_set_fates(text, text, jsonb)                       from public;
revoke all on function public.host_kick_player(text, text, uuid)                      from public;
revoke all on function public.join_session(text, text, jsonb)                         from public;
revoke all on function public.submit_decision(uuid, uuid, text, text, text, jsonb)    from public;
revoke all on function public.submit_post(uuid, uuid, text, text)                     from public;

grant execute on function public.create_session(text, text)                           to anon, authenticated;
grant execute on function public.host_set_scene(text, text, text, jsonb)              to anon, authenticated;
grant execute on function public.host_list_pending_posts(text, text)                  to anon, authenticated;
grant execute on function public.host_moderate_post(text, text, uuid, text)           to anon, authenticated;
grant execute on function public.host_set_fates(text, text, jsonb)                    to anon, authenticated;
grant execute on function public.host_kick_player(text, text, uuid)                   to anon, authenticated;
grant execute on function public.join_session(text, text, jsonb)                      to anon, authenticated;
grant execute on function public.submit_decision(uuid, uuid, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.submit_post(uuid, uuid, text, text)                  to anon, authenticated;

-- ---------- Realtime ----------
-- (si la publicación ya incluye alguna tabla, ignora el error "already member")
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.decisions;
alter publication supabase_realtime add table public.posts;

-- ---------- Limpieza ----------
-- Tras la presentación: delete from public.sessions where code = 'XXXX';  (cascada borra todo lo demás)

-- ---------- Cierre de la actividad (borra TODOS los datos de la sala) ----------
create or replace function public.host_end_session(p_code text, p_host_secret text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid := public._check_host(p_code, p_host_secret);
begin
  delete from sessions where id = v_id;   -- la cascada borra todo lo demás
end $$;
revoke all on function public.host_end_session(text, text) from public;
grant execute on function public.host_end_session(text, text) to anon, authenticated;
