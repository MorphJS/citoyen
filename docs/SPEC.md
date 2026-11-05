# SPEC — Citoyen: Francia 1750–1794, tu vida

## 1. Objetivo
Que cada compañero sienta que fue un habitante de la época: tome decisiones con consecuencias reales dentro del juego, y que al final entienda (sin que se le explique al inicio) los cuatro temas: Ilustración, el Terror y la censura, el pangermanismo y la ética (Kant/utilitarismo).

Restricciones del contexto: ~30 jugadores, un salón con wifi incierto, exposición de tiempo limitado. **Cada acto dura 3–4 min de juego**; el resto es narración de Jesús.

## 2. Roles y vistas
| Rol | Vista | Notas |
|---|---|---|
| Host (Jesús) | `/presentar` | Proyector 16:9. Controla escena, ve resultados en vivo, modera texto, dispara giros |
| Jugador | `/jugar?code=XXXX` | Celular, vertical. Una mano. Botones ≥ 56 px |

El host crea la sesión con un **código de 4–6 caracteres** y un **host secret** (contraseña que él define; se guarda en `sessionStorage`). Los jugadores entran por QR que apunta a `/#/jugar?code=XXXX`.

## 3. Identidad del jugador
Al unirse (apodo + "Entrar"), el cliente genera una identidad **determinista** (seed = id del jugador) desde `src/content/identidades.ts`:
- `nombreFrances` (p. ej. "Jean-Baptiste"), `oficio` (panadero, impresor, abogado, sastre, boticario, maestra, comerciante…), `estamento` (`clero` | `nobleza` | `tercer_estado`; mayoría Tercer Estado), `familia` (una línea), `ciudad`.
- Todo ficticio. Nada de personajes históricos reales como identidad del jugador.
- Se muestra como **tarjeta de identidad** con animación de reveal en el lobby.

## 4. Medidores (derivados, no guardados)
Tres valores 0–100, inician en 50: **libertad**, **seguridad**, **lealtad**. Más una métrica oculta **riesgo** (0–100, inicia en 20).
Cada opción de cada escena declara sus deltas en `src/content/escenas.ts`. `engine.computeState(decisions[]) → { libertad, seguridad, lealtad, riesgo, flags }` es una función pura. Los medidores se muestran como símbolos discretos (vela, escudo, cucarda), no como barras de videojuego, para mantener el tono.

## 5. Máquina de escenas
`sessions.scene` guarda el id de la escena activa. Orden lineal (el host avanza con ← →, espacio o botón):

```
lobby
a1_rumor            a1_rumor_reveal
a2_rey              a2_contrapesos        a2_reveal
a3_decreto          a3_decreto_reveal
a3_cordelier        a3_cordelier_reveal            (moderación)
a3_danton           (giro: arrestos de "leales")
a3_tribunal_garantias   a3_tribunal_garantias_reveal
a3_pradial          (la ley: desaparecen opciones)
a3_tribunal_sin_garantias   a3_tribunal_reveal
a3_caida            (27 julio 1794, epílogo sobrio)
a4_fiesta           a4_union              a4_vecino          a4_reveal
a5_kant             a5_mill               a5_final
cierre
```
Cada escena tiene: `id`, `acto`, `tipo` (`narracion` | `eleccion` | `escritura` | `tribunal` | `reveal`), `host` (qué se proyecta) y `jugador` (qué ve el celular). Las escenas `reveal` muestran resultados agregados (barras, porcentajes, conteos), nunca quién votó qué (anonimato por defecto, salvo apodos aprobados en el Cordelier).

## 6. Actos

### Acto 1 — El salón (Ilustración)
**Idea a vivir:** pensar por cuenta propia; pedir razones; no creer algo solo porque lo dijo alguien importante.
- `a1_rumor`: cada jugador recibe un **panfleto/rumor** (3 variantes repartidas por seed):
  - A: lo firma un personaje ficticio de alto rango ("el Marqués de …").
  - B: anónimo, pero trae una fuente comprobable.
  - C: contradice otro panfleto que ya circula.
  - Opciones: **Verificar** (cuesta "tiempo": 5 s de espera con animación) · **Creerlo** · **Compartirlo** · **Denunciarlo** (a un impresor NPC).
- `a1_rumor_reveal`: el proyector muestra % por opción y por variante. Mensaje de cierre basado en el texto de Jesús: *"comprobar una afirmación antes de creerla, en lugar de aceptarla solamente porque la dijo alguien importante."* Aparecen los pensadores (Voltaire, Montesquieu, Rousseau, Diderot y D'Alembert con la Enciclopedia) con una línea cada uno, tomada de `CONTENIDO.md`.
- Flag: `verifico` si eligió Verificar.

### Acto 2 — La Asamblea (separación de poderes)
**Idea a vivir:** quien crea la ley, la aplica y juzga, abusa; hacen falta límites y contrapesos (Montesquieu).
- `a2_rey`: **un jugador al azar** (el host puede re-sortear) recibe los tres poderes. Ve 3 crisis (p. ej. "falta pan", "un panfletista critica al gobierno", "un vecino debe una deuda") y para cada una decide ley + aplicación + castigo. Los demás ven su teléfono en "espera" y en el proyector aparece lo que decide el "rey" en tiempo real.
- `a2_contrapesos`: la misma crisis, pero los jugadores se dividen en 3 grupos por `seed % 3` (legislativo propone, ejecutivo aplica, judicial decide). Cada grupo vota su parte; el resultado final suele ser más moderado.
- `a2_reveal`: comparación lado a lado "un solo poder" vs. "tres poderes".
- Flag: `fue_rey` y qué hizo (informa a Acto 5).

### Acto 3 — El Terror (corazón del proyecto)
**Idea a vivir:** una revolución que defendía la libertad terminó castigando a quien cuestionaba a sus dirigentes; el miedo silencia.
Cronología obligatoria (ver CLAUDE.md regla 2):
1. `a3_decreto` (1793): el Comité de Salvación Pública anuncia una medida "para defender la República". Cada jugador elige **Aplaudir** · **Callar** · **Criticar**. Criticar sube `riesgo` (+25), aplaudir sube `lealtad`.
2. `a3_cordelier`: pedir clemencia o criticar excesos por escrito, como Camille Desmoulins en *Le Vieux Cordelier* (≤ 140 caracteres). Opción **No escribir**. Los textos van a moderación (`pending`). Publicar y ser aprobado sube `riesgo` (+20) pero otorga el flag `voz_cordelier`.
3. `a3_danton` (**abril de 1794**): giro. El host pulsa "Arrestos": el sistema marca como *arrestados* a ~15% de jugadores (seed determinista), **priorizando a los de más lealtad**. Mensaje: *"Su caso muestra que la persecución también afectaba a participantes de la propia Revolución."* Se menciona a Desmoulins y Danton.
4. `a3_tribunal_garantias`: a los arrestados (y a quienes tengan `riesgo` ≥ 60) se les cita. Opciones: **Defenderme** · **Llamar a un testigo** · **Apelar**. Cada opción da bonus de absolución (ver §7).
5. `a3_pradial` (**10 de junio de 1794**, Ley del 22 de pradial): pantalla solemne. En los celulares, los botones de defensa **se desvanecen uno a uno**. Queda solo "Esperar la sentencia". Texto: "redujo las garantías de los acusados ... Las sentencias podían ser la absolución o la muerte."
6. `a3_tribunal_sin_garantias`: nueva tanda de citaciones, ahora sin defensa posible. Resultado binario (§7).
7. `a3_caida` (**27 de julio de 1794**): cae Robespierre; fin de esa fase. Epílogo sobrio: *"un movimiento que defendía la libertad llegó a castigar a quienes cuestionaban a sus dirigentes."* Aclarar que Robespierre fue figura central pero no el único responsable.
- Los resultados individuales se guardan en `players.fate` (`absuelto` | `condenado` | `no_citado`). **Texto sobrio**; sin imágenes gráficas.
- Debrief en pantalla: cuántos callaron, cuántos criticaron, cuántos fueron citados y cuántos absueltos; sin nombres.

### Acto 4 — La nación (pangermanismo)
**Idea a vivir:** compartir lengua/cultura facilita la convivencia y el intercambio, pero no da derecho a obligar a otros a formar parte de tu país. Pangermanismo ≠ nazismo (el primero es anterior; el segundo incorporó esas aspiraciones a un proyecto racial y totalitario).
- Contexto: eres habitante de un pueblo de habla alemana en el siglo XIX, sin atribuir a nadie identidades étnicas/religiosas de víctima.
- `a4_fiesta`: fiesta cultural (música, lengua, cocina). Elección sencilla de cómo celebrar → sensación de comunidad positiva.
- `a4_union`: llega la propuesta de unir a todas las poblaciones de habla alemana en un Estado. Elegir **Apoyar** · **Dudar** · **Rechazar**.
- `a4_vecino`: un pueblo vecino que habla el mismo idioma **no quiere unirse**. Elegir **Convencer con el diálogo** · **Presionar** · **Respetar su decisión**. Presionar sube un flag `presiono`.
- `a4_reveal`: slider/animación que va de "intercambio cultural" a "expansionismo", la aspiración de integrar Austria y otras poblaciones de habla alemana, y la anexión de Austria en **1938**. Aclaración pangermanismo vs. nazismo. Cierre de Jesús: *"el riesgo aparece cuando la identidad nacional se utiliza para negar la libertad o los derechos de otras personas."*

### Acto 5 — El juicio ético
**Idea a vivir:** evaluar tus propias acciones con dos lentes.
- `a5_kant`: el celular muestra "tu historia" (3–4 decisiones clave) con la lente de Kant: ¿actuaste según un principio que aceptarías para todos? ¿trataste a alguien solo como instrumento? Ejemplo de la cartera del texto de Jesús como pregunta final.
- `a5_mill`: la misma historia con la lente utilitarista (Bentham y Mill): ¿qué consecuencias produjo para el bienestar general? Ejemplo del servicio de agua potable.
- `a5_final`: se calcula el **final personalizado** (§8) y se muestra como tarjeta descargable.
- Cierre en el proyector con las reflexiones de Jesús (equipo: cumplir mi parte, reconocer el esfuerzo de otros, no aprovecharme aunque no haya castigo).

## 7. Reglas del tribunal (valores iniciales; ajustables en `src/content/balance.ts`)
- `riesgo` base 20. Criticar en `a3_decreto` +25; publicar Cordelier aprobado +20; ser "arrestado" en `a3_danton` +30; compartir/denunciar un panfleto en Acto 1 +5.
- **Con garantías** (`a3_tribunal_garantias`): `p_absolucion = clamp(0.85 - riesgo/150 + bonus, 0.15, 0.85)`. Bonus: Defenderme +0.10, Testigo +0.15, Apelar +0.05 (una vez). Sorteo con seed determinista `hash(session_id + player_id + escena)` para que host y celular coincidan.
- **Sin garantías** (`a3_tribunal_sin_garantias`): `p_absolucion = clamp(0.5 - riesgo/200, 0.10, 0.50)`. Sin bonus.
- La **arbitrariedad es parte del mensaje**: nunca bajar de 10% ni superar 85% de probabilidad.
- El **host** calcula los destinos y los publica con `host_set_fates` (RPC). Los celulares solo los leen, para que nadie pueda manipular su resultado.

## 8. Finales personalizados (evaluar en este orden; el primero que cumple gana)
| Id | Condición | Título |
|---|---|---|
| `condenado` | `fate == 'condenado'` | "El que no volvió a hablar" (tono sobrio, sin gráfico) |
| `voz` | flag `voz_cordelier` | "La voz del Cordelier" |
| `presiono` | flag `presiono` | "El que quiso unir a la fuerza" |
| `verificador` | flag `verifico` y `rumor` no compartido | "El que pidió razones" |
| `aplaudidor` | `aplaudio` en `a3_decreto` | "El que aplaudió a tiempo" |
| `silencioso` | `callo` en `a3_decreto` | "El superviviente silencioso" |
| `default` | resto | "Ciudadano del montón" |
Cada final muestra: nombre francés del personaje, tres decisiones clave, una frase del cierre ético y un botón para descargar la tarjeta como imagen.

## 9. Diseño visual y audio
- **Paleta por acto:** A1 luz cálida (ámbar, crema, vela); A2 mármol y azul; A3 rojo apagado/ceniza, contraste alto; A4 verde/sepia de mapa; A5 oscuro con dorado.
- **Tipografía:** serif de época para títulos (Cormorant Garamond / Playfair Display), sans legible (Inter) para UI.
- **Imágenes:** retratos y pinturas de época de dominio público (Wikimedia Commons), con tratamiento de color por acto (desaturado + tinte + grano). Sellos de laurel en SVG propio. Ver CLAUDE.md regla 6.
- **Movimiento:** transiciones de escena cinematográficas, texto que aparece como "escrito", botones que se desvanecen en `a3_pradial`. Respeta `prefers-reduced-motion`.
- **Audio (opcional, Fase 5):** ambiente muy suave con toggle; apagado por defecto.
- **Móvil:** ≥ 56 px de alto en botones, fuente ≥ 17 px, vibración corta (`navigator.vibrate`) en eventos fuertes (opcional).

## 10. Controles del host
Atajos: `→/Espacio` siguiente, `←` anterior, `R` re-sortear "rey", `A` ejecutar arrestos (Danton), `F` calcular destinos del tribunal, `M` abrir moderación, `K` expulsar jugador. Panel lateral: lista de jugadores conectados, cola de moderación, contador de respuestas de la escena actual.

## 11. Fuera de alcance (por ahora)
Cuentas de usuario, persistencia entre sesiones, multi-sala simultánea, sonido ambiente complejo, i18n.
