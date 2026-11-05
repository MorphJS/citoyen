# CLAUDE.md — Citoyen (Francia 1750–1794: tu vida)

## Qué es esto
Una presentación escolar interactiva donde **cada compañero, desde su celular, vive la historia como un personaje francés**. Jesús (alias Morph / MorphJS) presenta en el proyector; ~30 compañeros escanean un QR y reciben una identidad, toman decisiones con consecuencias y ven el resultado colectivo en vivo.

Tema (de la investigación en `docs/CONTENIDO.md`): Ilustración → Terror en la Revolución francesa → pangermanismo → ética moderna (Kant y utilitarismo).
Hilo conductor: **¿qué pasa cuando las ideas de libertad se encuentran con el poder?**

Lee en este orden antes de escribir código:
1. `docs/SPEC.md` — diseño del juego, escenas, reglas, finales.
2. `docs/CONTENIDO.md` — fuente de verdad histórica.
3. `docs/DATA_MODEL.sql` — esquema de Supabase (RLS + RPCs).
4. `docs/ROADMAP.md` — fases con criterios de aceptación.
5. `docs/SMOKE_TEST.sql` — pruebas de seguridad del esquema.

## Sobre Jesús (cómo trabajar con él)
- Estudiante de Ingeniería de Software (fin de semana) con experiencia freelance. Meta: ser SWE de alto nivel.
- **Explica el porqué de cada decisión técnica**: trade-offs, riesgos, alternativas, dificultad. No solo el qué.
- Al cierre de explicaciones importantes, da 1–2 recursos concretos (docs oficiales, papers, cursos específicos; nada genérico).
- Español para conversación y textos del juego. Código, nombres de variables y commits en inglés.
- Ya construyó "Membrana Arena" (Supabase + GitHub Pages). Mismo patrón de despliegue.

## Stack (decidido, no re-discutir sin motivo)
| Pieza | Elección | Por qué / trade-off |
|---|---|---|
| Build | Vite + React + TypeScript | Estático → cabe en GitHub Pages. Sin SSR porque no hace falta |
| Estilos | Tailwind CSS | Rápido para iterar el visual |
| Animación | Framer Motion | Transiciones de escena y efectos del tribunal. Costo: peso del bundle, aceptable |
| Router | `HashRouter` | GitHub Pages no soporta rewrites de SPA; hash evita 404 al recargar |
| Backend | Supabase (Postgres + Realtime) | Jesús ya lo conoce. Realtime empuja cambios a ~30 teléfonos |
| QR | `qrcode.react` | Pequeño, sin dependencias raras |
| Tests | Vitest | Solo para `src/game/engine.ts` (lógica pura) |
| Captura de final | `html-to-image` | Tarjeta de final descargable. Opcional (Fase 5) |

Si Jesús tiene su "premium template" (Vite+React+TS+Tailwind) disponible, úsalo como base; si no, `npm create vite@latest` con la plantilla `react-ts`.

## Rutas
- `/#/` → landing mínima con dos botones (presentar / jugar).
- `/#/presentar` → vista de Jesús (16:9, proyector). Pide el código de host. Controla escenas.
- `/#/jugar?code=XXXX` → vista del celular (mobile-first, una mano, botones grandes).

## Arquitectura en una frase
La escena actual vive en una fila `sessions`; todos los clientes se suscriben por Realtime. Los celulares **solo escriben vía RPC** (`join_session`, `submit_decision`, `submit_post`); el host escribe vía RPCs protegidas con un secreto. Los medidores del jugador se **derivan** de sus decisiones con una función pura compartida (`src/game/engine.ts`); no se guardan.

## Reglas duras (no negociables)
1. **Fidelidad histórica:** fechas y hechos salen únicamente de `docs/CONTENIDO.md`. Algo nuevo → `TODO(verificar)`.
2. **Cronología correcta del Terror:** Desmoulins y Danton fueron ejecutados en **abril de 1794, ANTES** de la Ley del 22 de pradial (10 de junio de 1794) y del Gran Terror (junio–julio 1794). Robespierre cae el 27 de julio de 1794. Respeta ese orden en las escenas.
3. **Nunca denuncias contra compañeros reales.** Toda denuncia/arresto apunta a personajes ficticios (NPC) o ocurre por azar del sistema. Evita acoso entre amigos.
4. **No asignar identidades de víctima étnica o religiosa a los jugadores** (sobre todo en el acto del pangermanismo). Los pueblos vecinos son neutros. Sin simulaciones de persecución a grupos reales.
5. **Tono sobrio.** Las condenas se muestran como texto ("tu caso fue condenado"), nunca gráfico. No glorificar ni burlarse.
6. **Imágenes (decidido por Jesús, reemplaza la regla original):** se usan retratos y obras de época de **dominio público** de Wikimedia Commons, alojadas en `public/img/` con créditos en `public/img/CREDITS.json` (`node scripts/fetch-images.mjs`). Nunca fotos de compañeros, ni imágenes gráficas de ejecuciones, ni desnudos (ojo: el boceto de David del Juramento del Juego de Pelota tiene desnudos; no usarlo). A los jugadores no se les asigna la identidad de personajes históricos reales.
7. **Moderación:** todo texto libre de jugadores (Le Vieux Cordelier) queda `pending` hasta que el host lo aprueba. Máx. 140 caracteres.
8. **Degradación elegante:** si falla el wifi, la presentación del host debe poder avanzar escena por escena **sin** celulares.
9. **Seguridad:** nunca expongas `host_secret` ni tokens de jugador en consultas `select`. Usa el esquema de `DATA_MODEL.sql` tal cual (tablas secretas sin políticas + RPCs `security definer`).
10. **Sin secretos en el repo:** `.env.local` en `.gitignore`; solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la anon key es pública por diseño; la seguridad la dan RLS y las RPCs).

## Decisiones de alcance (Jesús, "algo sencillo para una clase del sábado")
- **Anonimato:** se acepta que `decisions` sea legible con la anon key (es un salón de clase); la UI nunca muestra quién votó qué. Documentado, no resuelto en el esquema.
- **Apodos:** el proyector solo muestra el conteo de jugadores, nunca apodos; `host_kick_player` queda como válvula.
- **Arrestos (`a3_danton`):** por azar puro con seed determinista (no "priorizar lealtad"), según la regla 3.
- **Diseño:** estética de sitio de cine (oscuro, ámbar/teal, título tipográfico enorme, tira de escenas abajo). La presentación del host (`/presentar`) funciona sola con teclado (← → espacio, F = pantalla completa) y `?s=<id_escena>`.

## Convenciones
- TypeScript estricto. Sin `any` salvo en el borde con Supabase y con comentario.
- Contenido del juego (textos, identidades, escenas) en `src/content/*.ts` como datos, **no** hardcodeado en componentes.
- Lógica de reglas (medidores, probabilidades del tribunal, finales) en `src/game/engine.ts`, pura y testeada.
- Componentes por escena en `src/scenes/<id>/Host.tsx` y `Player.tsx`.
- Commits pequeños y descriptivos (Conventional Commits).
- Antes de dar algo por terminado: `npm run build` y `npm test` en verde, y probar en un viewport de celular (390×844).

## Comandos esperados
```bash
npm install
npm run dev        # desarrollo
npm test           # vitest (engine)
npm run build      # build estático
npm run deploy     # gh-pages (configurar en Fase 0)
```

## Diseño visual (resumen; detalle en SPEC §9)
Oscuro, dramático, acentos dorados: **luz contra sombra** (Siglo de las Luces → Terror). Tipografía serif de época para títulos (p. ej. Cormorant Garamond o Playfair Display) + sans legible para UI. El tricolor, con mucha mesura. Que cada acto cambie la paleta (luz cálida → rojo/ceniza → azul frío) para sentir el avance.
