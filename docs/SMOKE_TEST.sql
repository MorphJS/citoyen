-- SMOKE_TEST.sql — pruebas de seguridad/comportamiento de DATA_MODEL.sql
-- Uso local (Postgres con roles anon/authenticated, esquema 'extensions' y publicación supabase_realtime):
--   psql -f docs/DATA_MODEL.sql && psql -f docs/SMOKE_TEST.sql
-- En Supabase real NO corras los 'grant' de la línea 2 (ya existen por defecto); úsalo desde el SQL editor adaptando \gset a mano.
-- Esperado: pasos 2,4,5,8,10,13 FALLAN a propósito; 7 deja 1 sola fila; 11 pasa de 0 a 1 post visible.
\set ON_ERROR_STOP off
grant usage on schema public to anon; grant select on all tables in schema public to anon;
grant usage on schema extensions to anon;
set role anon;
\echo '--- 1 crear sesion'
select public.create_session('abcd','secreto123') is not null as ok;
\echo '--- 2 secreto corto (debe fallar)'
select public.create_session('zzzz','abc');
\echo '--- 3 unirse'
select * from public.join_session('ABCD','Morph','{"nombre":"Jean"}') \gset
select :'player_id' as pid, :'token' as tok;
\echo '--- 4 decision en escena NO activa (debe fallar)'
select public.submit_decision(:'player_id', :'token', 'a1_rumor', 'verificar');
\echo '--- 5 host cambia escena con secreto malo (debe fallar)'
select public.host_set_scene('ABCD','malo','a1_rumor');
\echo '--- 6 host cambia escena ok'
select public.host_set_scene('ABCD','secreto123','a1_rumor');
\echo '--- 7 decision ok + duplicada (sin error, 1 fila)'
select public.submit_decision(:'player_id', :'token', 'a1_rumor', 'verificar');
select public.submit_decision(:'player_id', :'token', 'a1_rumor', 'creer');
select choice from public.decisions;
\echo '--- 8 token falso (debe fallar)'
select public.submit_decision(:'player_id', gen_random_uuid(), 'a1_rumor', 'x', 'k2');
\echo '--- 9 leer secretos como anon (debe dar permission denied)'
select * from public.host_secrets;
select * from public.player_secrets;
\echo '--- 10 insert directo (debe fallar)'
insert into public.decisions(session_id,player_id,scene,choice) values (gen_random_uuid(),gen_random_uuid(),'x','y');
\echo '--- 11 post pendiente no visible; moderar; visible'
select public.host_set_scene('ABCD','secreto123','a3_cordelier');
select public.submit_post(:'player_id', :'token', 'a3_cordelier', 'Piedad, ciudadanos');
select count(*) as visibles_antes from public.posts;
select id as post_id from public.host_list_pending_posts('ABCD','secreto123') \gset
select public.host_moderate_post('ABCD','secreto123', :'post_id', 'approved');
select count(*) as visibles_despues from public.posts;
\echo '--- 12 destinos'
select public.host_set_fates('ABCD','secreto123', json_build_array(json_build_object('player_id',:'player_id','fate','absuelto'))::jsonb);
select fate from public.players;
\echo '--- 13 kick y luego decision (debe fallar)'
select public.host_kick_player('ABCD','secreto123', :'player_id');
select public.submit_decision(:'player_id', :'token', 'a3_cordelier', 'x', 'k3');
