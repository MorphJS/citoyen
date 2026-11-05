# Citoyen — Francia 1750–1794: tu vida

Presentación escolar interactiva: cada compañero, desde su celular, vive la historia como un personaje francés; el presentador proyecta. Detalle de diseño en `docs/`.

## Cómo se usa el día de la presentación
1. Abre `https://morphjs.github.io/citoyen/#/presentar` en el proyector → **Crear sala** (código + contraseña tuya, mínimo 6 caracteres).
2. Los compañeros escanean el QR del lobby (o entran a `/#/jugar` y escriben el código).
3. Avanza con **→ / espacio** (← para volver). **P** = pantalla completa.
4. Abre `/#/moderar` **en otra pestaña o en tu celular** (misma contraseña): aprueba o rechaza textos del Cordelier, expulsa jugadores y controla las escenas como control remoto.
5. En las escenas del Terror: **A** = arrestos por azar (escena Danton) · **F** = publicar destinos (los dos tribunales) · **R** = re-sortear al “rey”.
6. **Sin celulares / sin wifi:** en la pantalla de entrada pulsa “Modo sin celulares”. Todas las escenas funcionan con datos simulados, rotulados como tales.
7. Después: `delete from public.sessions where code = 'TUCODIGO';` en el SQL editor (la cascada borra todo lo de la sala).

## Antes de presentar (checklist)
- Despierta el proyecto de Supabase el día anterior (los gratuitos se pausan).
- Abre la URL una vez en el proyector: las imágenes (~9 MB) quedan en caché.
- Prueba con un celular que no sea el tuyo.

## Desarrollo
```bash
npm install
npm run dev      # desarrollo
npm test         # vitest: engine, operaciones del host, modo sin celulares
npm run build    # build estático
npm run deploy   # publica en gh-pages
npm run smoke    # 13 pruebas de seguridad del esquema contra Supabase real (anon key)
npm run load     # 30 clientes simulados: unirse, latencia Realtime, respuestas
npm run e2e      # host + 3 celulares jugando de punta a punta (requiere `vite preview` en :4173)
```
Variables en `.env.local` (no se sube): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Estructura
- `src/content/` — textos, escenas, opciones, identidades, finales y balance (datos, no JSX).
- `src/game/engine.ts` — reglas puras y testeadas (medidores, tribunal, arrestos, finales).
- `src/host/` — escenario del proyector, operaciones del host, modo sin celulares.
- `src/player/`, `src/pages/` — vistas del celular, presentador y moderación.
- `scripts/fetch-images.mjs` — descarga las imágenes de dominio público (Wikimedia Commons) con sus créditos.

## Límites conocidos
- `decisions` y `players` son legibles con la anon key (decisión de alcance: es un salón de clase). La interfaz nunca muestra quién votó qué ni los apodos.
- Realtime del plan gratuito de Supabase admite ~200 conexiones simultáneas: sobra para ~30.
