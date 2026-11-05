# ROADMAP — Citoyen

Cada fase termina con algo **jugable y probado**. Si el tiempo aprieta, las fases 0–2 ya forman una experiencia completa (Actos 1 y 3).
Dificultad: 🟢 baja · 🟡 media · 🔴 alta.

## Fase 0 — Cimientos 🟢
- [x] Scaffold Vite + React + TS + Tailwind + Framer Motion + Vitest. `HashRouter`.
- [x] Config de GitHub Pages (`base` en `vite.config.ts`, script `deploy`). Verificar que `/#/jugar?code=TEST` abre bien en producción.
- [x] Proyecto de Supabase: correr `docs/DATA_MODEL.sql`. **Probar cada RPC** con `docs/SMOKE_TEST.sql` (ya validado en Postgres local; repetirlo contra el proyecto real): crear sesión, unirse, decisión en escena activa y en escena inactiva (debe fallar), host con secreto incorrecto (debe fallar), `select` sobre `host_secrets`/`player_secrets` desde anon (debe devolver 0 filas o error).
- [x] `.env.local` con URL y anon key; `.env.example` sin valores.
- **Aceptación:** `npm run build` verde; humo de SQL verde; deploy visible en una URL.

## Fase 1 — Sincronización y lobby 🟡
- [x] `/presentar`: crear sesión (código + host secret), mostrar QR grande y contador de jugadores en vivo.
- [x] `/jugar`: formulario de apodo, `join_session`, guardar `player_id`+`token` en `localStorage` (reconexión si recarga).
- [x] Generador de identidades determinista (`src/content/identidades.ts`) + animación de tarjeta.
- [x] Hook `useSession(code)` con suscripción Realtime a `sessions`, `players`, `decisions` y reconexión.
- [x] Máquina de escenas: host avanza (← →, espacio) y los celulares siguen.
- **Aceptación:** con 3+ dispositivos reales (tu celular, otro celular, laptop), el avance de escena se refleja en < 1 s; recargar un celular lo reincorpora con la misma identidad.

## Fase 2 — Motor de reglas (`src/game/engine.ts`) 🟡
- [x] `computeState(decisions)` → medidores, riesgo, flags.
- [x] `tribunalOutcome(seed, riesgo, bonus, conGarantias)` con RNG determinista (`hash(session_id + player_id + escena)`).
- [x] `pickArrested(players, state, seed, pct)`; `pickRey(players, seed)`.
- [x] `computeEnding(state, fate)` según tabla de SPEC §8.
- [x] Tests Vitest: determinismo (misma seed, mismo resultado), límites de probabilidad (nunca < 0.10 ni > 0.85), sin garantías ≤ con garantías para igual riesgo, prioridad de finales.
- **Aceptación:** `npm test` verde; ninguna función de engine importa React ni Supabase.

## Fase 3 — Acto 3, el corazón 🔴
- [x] Escenas `a3_*` en el orden cronológico de SPEC §6 (Danton en abril de 1794 **antes** de la Ley del 22 de pradial).
- [x] `a3_cordelier` con moderación: cola en `/presentar`, `host_list_pending_posts` (polling cada 2 s), aprobar/rechazar, aparición en proyector.
- [x] `a3_danton`: arrestos con seed + `host_set_fates`.
- [x] `a3_pradial`: animación en celular donde los botones de defensa se desvanecen uno a uno.
- [x] Tribunal con y sin garantías; reveal agregado sin nombres.
- **Aceptación:** corrida de punta a punta con 5+ dispositivos; los destinos coinciden entre host y celular; ningún texto sin aprobar aparece en el proyector.

## Fase 4 — Actos 1, 2, 4 y 5 🟡
- [x] A1: tres variantes de panfleto, espera de "verificar", reveal con pensadores.
- [x] A2: sorteo del "rey", vista en vivo de sus decisiones, grupos de contrapesos, comparación.
- [x] A4: fiesta, unión, vecino, reveal con 1938 y aclaración pangermanismo vs. nazismo (sin identidades de víctima).
- [x] A5: lentes Kant y Mill sobre la historia personal; final y tarjeta.
- **Aceptación:** guion completo jugable en ≤ la duración de la exposición (cronometrar con Jesús).

## Fase 5 — Pulido y robustez 🟡
- [x] Diseño visual completo por acto (SPEC §9), ilustraciones SVG propias, transiciones.
- [x] Tarjeta de final descargable (`html-to-image`).
- [x] Modo sin celulares: cada escena del host funciona sola con datos simulados (botón "demo" oculto).
- [x] Rendimiento: probar con 30 clientes simulados (script que llame RPCs). Revisar límites de conexiones concurrentes de Realtime del plan gratis.
- [x] Accesibilidad: contraste AA, `prefers-reduced-motion`, tamaños táctiles.
- [ ] Audio ambiente opcional con toggle. (no implementado: opcional y apagado por defecto)
- **Aceptación:** ensayo general con ≥ 8 personas reales y wifi del lugar.

> Estado: fases 0–5 implementadas. Verificado con `npm test`, `npm run smoke`, `npm run load` y `npm run e2e`. Pendiente fuera de código: ensayo general con ≥ 8 personas y el wifi del lugar; audio ambiente opcional no implementado.

## Checklist del día de la presentación
- [ ] Despertar el proyecto de Supabase el día anterior (los proyectos gratis se pausan por inactividad).
- [ ] Crear sesión nueva y probar QR con un celular que **no** sea el tuyo.
- [ ] Tener la hoja de respaldo (modo sin celulares) lista en otra pestaña.
- [ ] Después: `delete from sessions where code = '...'` para borrar todos los datos de los compañeros.

## Riesgos conocidos
| Riesgo | Mitigación |
|---|---|
| Wifi débil | Modo sin celulares, datos móviles del host como respaldo |
| Texto ofensivo en Cordelier | Moderación obligatoria + `host_kick_player` |
| Doble voto / manipulación | Constraint único + RPCs con token + destinos calculados por el host |
| Proyecto Supabase pausado | Despertar el día previo |
| Tono inapropiado en Terror / pangermanismo | Reglas 3–5 de CLAUDE.md; revisión de Jesús antes de ensayar |
| Alcance excesivo | Priorizar Fases 0–3; Fase 4 puede recortarse a Actos 1 y 4 |

## Recursos
- Supabase Realtime (Postgres Changes, Broadcast, Presence): https://supabase.com/docs/guides/realtime
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Reacting to the Past (modelo de juegos de rol históricos): https://reactingtothepast.org
