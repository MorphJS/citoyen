// Contenido de la presentación (datos, no JSX). Todo texto histórico sale de docs/CONTENIDO.md.
// Algo que no esté ahí => TODO(verificar).

export type Acto = 0 | 1 | 2 | 3 | 4 | 5

export const IMG = {
  bg_salon: 'bg_salon.jpg',
  bg_bastille: 'bg_bastille.jpg',
  bg_asamblea: 'bg_asamblea.jpg',
  bg_terror: 'bg_terror.jpg',
  bg_nacion: 'bg_nacion.jpg',
  voltaire: 'voltaire.jpg',
  montesquieu: 'montesquieu.png',
  rousseau: 'rousseau.jpg',
  diderot: 'diderot.jpg',
  dalembert: 'dalembert.jpg',
  encyclopedie: 'encyclopedie.jpg',
  robespierre: 'robespierre.jpg',
  danton: 'danton.jpg',
  desmoulins: 'desmoulins.jpg',
  kant: 'kant.jpg',
  bentham: 'bentham.jpg',
  mill: 'mill.jpg',
} as const
export type ImgKey = keyof typeof IMG
export const img = (k: ImgKey) => `${import.meta.env.BASE_URL}img/${IMG[k]}`

export type Palette = { glow: string; accent: string; tint: string; name: string; numeral: string }
export const PALETAS: Record<Acto, Palette> = {
  0: { name: 'Prólogo', numeral: '·', glow: '#2f8f94', accent: '#e8a73a', tint: '#0b2a2e' },
  1: { name: 'El salón', numeral: 'I', glow: '#e0a040', accent: '#f0c46a', tint: '#3a2208' },
  2: { name: 'La Asamblea', numeral: 'II', glow: '#7f9bd0', accent: '#dbe5f7', tint: '#0c1a3a' },
  3: { name: 'El Terror', numeral: 'III', glow: '#b0392b', accent: '#e8d5c4', tint: '#3a0e0a' },
  4: { name: 'La nación', numeral: 'IV', glow: '#8a9a4b', accent: '#e3d9a6', tint: '#1d2410' },
  5: { name: 'El juicio', numeral: 'V', glow: '#c9a24b', accent: '#f3e9d2', tint: '#1a1407' },
}

export type Card = { img: ImgKey; tag: string; name: string; line: string }

export type Escena = {
  id: string
  acto: Acto
  layout: 'hero' | 'synopsis' | 'cards'
  kicker: string
  title: string
  statement?: string
  body?: string
  bg: ImgKey
  cards?: Card[]
  seals?: string[]
  /** La escena recibe respuestas de los celulares (se conectará en la Fase 1+). */
  vivo?: boolean
}

export const ESCENAS: Escena[] = [
  {
    id: 'lobby', acto: 0, layout: 'hero', bg: 'bg_bastille',
    kicker: 'Francia · 1750–1794', title: 'CITOYEN',
    statement: '¿Qué pasa cuando las ideas de libertad se encuentran con el poder?',
    body: 'Escanea el código y vive esta historia como un ciudadano.',
    seals: ['1750', '1794'],
  },
  {
    id: 'a1_rumor', acto: 1, layout: 'hero', bg: 'bg_salon', vivo: true,
    kicker: 'Acto I · El salón', title: 'EL SIGLO DE LAS LUCES',
    statement: 'Comprobar una afirmación antes de creerla, en lugar de aceptarla solo porque la dijo alguien importante.',
    body: 'El conocimiento se entendía como una forma de combatir la ignorancia.',
  },
  {
    id: 'a1_rumor_reveal', acto: 1, layout: 'cards', bg: 'bg_salon',
    kicker: 'Acto I · Los pensadores', title: 'PENSAR POR CUENTA PROPIA',
    cards: [
      { img: 'voltaire', tag: 'Tolerancia', name: 'Voltaire', line: 'Defendió la tolerancia religiosa.' },
      { img: 'montesquieu', tag: 'Poder', name: 'Montesquieu', line: 'Propuso distribuir el poder para evitar abusos.' },
      { img: 'rousseau', tag: 'Voluntad', name: 'Rousseau', line: 'Sostuvo que la autoridad política debía basarse en la voluntad general.' },
      { img: 'diderot', tag: 'Enciclopedia', name: 'Diderot', line: 'Dirigió la Enciclopedia junto a D’Alembert.' },
      { img: 'dalembert', tag: 'Enciclopedia', name: 'D’Alembert', line: 'Reunió conocimientos científicos, técnicos y filosóficos para difundirlos.' },
    ],
  },
  {
    id: 'a2_rey', acto: 2, layout: 'synopsis', bg: 'bg_asamblea', vivo: true,
    kicker: 'Acto II · La Asamblea', title: 'UN SOLO PODER',
    statement: 'Si una sola persona crea las leyes, las aplica y decide quién merece un castigo…',
    body: '…tiene muchas posibilidades de abusar de su autoridad.',
  },
  {
    id: 'a2_contrapesos', acto: 2, layout: 'cards', bg: 'bg_asamblea', vivo: true,
    kicker: 'Acto II · Montesquieu', title: 'LÍMITES Y CONTRAPESOS',
    statement: 'La propuesta de Montesquieu buscaba que el poder tuviera límites y contrapesos.',
    cards: [{ img: 'montesquieu', tag: 'Separación de poderes', name: 'Montesquieu', line: 'Distribuir el poder para evitar abusos.' }],
  },
  {
    id: 'a2_reveal', acto: 2, layout: 'synopsis', bg: 'bg_asamblea',
    kicker: 'Acto II · Resultado', title: 'UNO CONTRA TRES',
    statement: 'Un solo poder frente a tres poderes que se vigilan.',
    body: 'Compara qué decidió el “rey” solo y qué decidieron los tres grupos.',
  },
  {
    id: 'a3_decreto', acto: 3, layout: 'hero', bg: 'bg_terror', vivo: true,
    kicker: 'Acto III · El Terror · 1793', title: 'DEFENDER LA REPÚBLICA',
    statement: 'El Comité de Salvación Pública justificaba las medidas extraordinarias como necesarias para defender la República.',
    // TODO(verificar): CONTENIDO no nombra un decreto concreto; el de esta escena es ficticio y así debe decirlo Jesús.
    body: 'Una medida ficticia, para vivir la decisión: aplaudir, callar o criticar.',
    seals: ['1793', '1794'],
  },
  {
    id: 'a3_cordelier', acto: 3, layout: 'cards', bg: 'bg_terror', vivo: true,
    kicker: 'Acto III · Le Vieux Cordelier', title: 'PEDIR CLEMENCIA',
    statement: 'Escribe en 140 caracteres. Tu texto pasa por moderación antes de aparecer.',
    cards: [{ img: 'desmoulins', tag: 'Periodista', name: 'Camille Desmoulins', line: 'Criticó los excesos del Terror y pidió clemencia en su periódico Le Vieux Cordelier.' }],
  },
  {
    id: 'a3_danton', acto: 3, layout: 'cards', bg: 'bg_terror',
    kicker: 'Acto III · Abril de 1794', title: 'ANTES DEL GRAN TERROR',
    statement: 'Su caso muestra que la persecución también afectaba a participantes de la propia Revolución.',
    cards: [
      { img: 'desmoulins', tag: 'Abril de 1794', name: 'Camille Desmoulins', line: 'Ejecutado junto con Danton, antes del Gran Terror.' },
      { img: 'danton', tag: 'Abril de 1794', name: 'Danton', line: 'Ejecutado junto con Desmoulins, antes del Gran Terror.' },
    ],
  },
  {
    id: 'a3_tribunal_garantias', acto: 3, layout: 'synopsis', bg: 'bg_terror', vivo: true,
    kicker: 'Acto III · Tribunal Revolucionario', title: 'EL TRIBUNAL',
    statement: 'Los acusados comparecen ante el Tribunal Revolucionario.',
    body: 'Todavía tienen garantías: pueden defenderse.',
  },
  {
    id: 'a3_pradial', acto: 3, layout: 'hero', bg: 'bg_terror',
    kicker: '10 de junio de 1794', title: 'LEY DEL 22 DE PRADIAL',
    statement: 'Redujo las garantías de los acusados ante el Tribunal Revolucionario y aceleró los procesos.',
    body: 'Las sentencias podían ser la absolución o la muerte.',
    seals: ['GRAN TERROR', 'JUN–JUL 1794'],
  },
  {
    id: 'a3_tribunal_sin_garantias', acto: 3, layout: 'synopsis', bg: 'bg_terror', vivo: true,
    kicker: 'Acto III · Sin garantías', title: 'SIN DEFENSA',
    statement: 'Ya no hay defensa posible.',
    body: 'El resultado es la absolución o la condena.',
  },
  {
    id: 'a3_caida', acto: 3, layout: 'cards', bg: 'bg_terror',
    kicker: '27 de julio de 1794', title: 'CAE ROBESPIERRE',
    statement: 'Un movimiento que defendía la libertad llegó a castigar a quienes cuestionaban a sus dirigentes.',
    cards: [{ img: 'robespierre', tag: 'Figura central', name: 'Robespierre', line: 'Fue una figura central, aunque no el único responsable de estas políticas.' }],
  },
  {
    id: 'a4_fiesta', acto: 4, layout: 'hero', bg: 'bg_nacion', vivo: true,
    kicker: 'Acto IV · La nación · Siglo XIX', title: 'UNA LENGUA, UNA FIESTA',
    statement: 'Compartir lengua y cultura facilita la convivencia y el intercambio cultural.',
  },
  {
    id: 'a4_union', acto: 4, layout: 'synopsis', bg: 'bg_nacion', vivo: true,
    kicker: 'Acto IV · Pangermanismo', title: 'UNIR A TODOS',
    statement: 'Unir en un mismo Estado a las poblaciones consideradas alemanas por su lengua, cultura u origen.',
    body: 'El pangermanismo se desarrolló durante el siglo XIX, cuando diversos pueblos buscaban formar o fortalecer sus propias naciones.',
  },
  {
    id: 'a4_vecino', acto: 4, layout: 'synopsis', bg: 'bg_nacion', vivo: true,
    kicker: 'Acto IV · El vecino', title: 'UN PUEBLO QUE NO QUIERE',
    statement: 'Dos comunidades hablan el mismo idioma. Una no quiere formar parte de tu país.',
    body: 'Eso no significa que una tenga derecho a obligar a la otra.',
  },
  {
    id: 'a4_reveal', acto: 4, layout: 'hero', bg: 'bg_nacion',
    kicker: 'Acto IV · Resultado', title: 'DE LA CULTURA AL EXPANSIONISMO',
    statement: 'El riesgo aparece cuando la identidad nacional se utiliza para negar la libertad o los derechos de otras personas.',
    body: 'Pangermanismo y nazismo no significan lo mismo: el primero surgió antes; el segundo lo incorporó a un proyecto racial y totalitario. Ejemplo: la anexión de Austria, 1938.',
    seals: ['SIGLO XIX', '1938'],
  },
  {
    id: 'a5_kant', acto: 5, layout: 'cards', bg: 'bg_salon', vivo: true,
    kicker: 'Acto V · Primera lente', title: 'KANT',
    statement: '¿Actuaste según un principio que aceptarías para todos? ¿Trataste a alguien solo como instrumento?',
    cards: [{ img: 'kant', tag: 'Deber y dignidad', name: 'Immanuel Kant', line: 'Devolver una cartera porque es lo correcto, no por la recompensa.' }],
  },
  {
    id: 'a5_mill', acto: 5, layout: 'cards', bg: 'bg_salon', vivo: true,
    kicker: 'Acto V · Segunda lente', title: 'BENTHAM Y MILL',
    statement: '¿Qué consecuencias produjeron tus decisiones para el bienestar general?',
    cards: [
      { img: 'bentham', tag: 'Utilitarismo', name: 'Jeremy Bentham', line: 'Evaluar las acciones por sus consecuencias.' },
      { img: 'mill', tag: 'Utilitarismo', name: 'John Stuart Mill', line: 'Promover el mayor bienestar general, considerando imparcialmente a todos.' },
    ],
  },
  {
    id: 'a5_final', acto: 5, layout: 'hero', bg: 'bg_bastille', vivo: true,
    kicker: 'Acto V · Tu final', title: 'TU HISTORIA',
    statement: 'Este es el final que escribieron tus decisiones.',
  },
  {
    id: 'cierre', acto: 5, layout: 'synopsis', bg: 'bg_salon',
    kicker: 'Cierre', title: 'LA ÉTICA EN EL EQUIPO',
    statement: 'Cumplir mi parte, reconocer el esfuerzo de mis compañeros y evitar aprovecharme de ellos.',
    body: 'Aunque pudiera hacerlo sin recibir un castigo. Imágenes: obras y retratos de dominio público (Wikimedia Commons); la sala de Madame Geoffrin, de Lemonnier, CC BY 3.0. Detalle en public/img/CREDITS.json.',
  },
]
