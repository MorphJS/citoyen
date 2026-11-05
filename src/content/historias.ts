// Historias, consecuencias y preguntas de debate. TODO ES FICTICIO salvo los hechos de CONTENIDO.md.
// Personajes (Gauthier, Valmont, Duval, el pueblo de Hohenau) son inventados; ninguno representa a una persona real.
// Regla 3: toda denuncia/arresto apunta a ficticios o al azar del sistema, nunca a compañeros.

export type Variante = 'A' | 'B' | 'C'
export type Veredicto = 'falso' | 'cierto' | 'mixto'
export type Tono = 'bien' | 'mal' | 'mixto'

// ---------------------------------------------------------------- Acto 1: el panfleto
/** Misma acusación, tres “envolturas”: autoridad, fuente comprobable y disputa. La verdad NO coincide con la apariencia. */
export const VERDAD_A1: Record<Variante, Veredicto> = { A: 'falso', B: 'cierto', C: 'mixto' }

export const PANFLETO = {
  imprenta: 'De l’Imprimerie de la rue des Noyers',
  lugar: 'À Paris · 1793', // TODO(verificar): no usamos calendario republicano porque CONTENIDO no lo cubre
  titulo: '¡Abrid los ojos, ciudadanos!',
  sub: 'El panadero Gauthier guarda trigo en su sótano mientras vosotros hacéis cola por un pan que no llega.',
  nota: 'Documento ficticio, recreado con el estilo de los panfletos de la época. Traducido del francés.',
  A: {
    kicker: 'Aviso al pueblo de la sección',
    cuerpo: [
      'Yo mismo he bajado a su sótano y he contado cuarenta sacos de trigo, apilados como un tesoro, mientras en la calle las madres cuentan las migas.',
      'Esto no es un rumor. Lo afirmo con mi nombre y con mi cargo, para que nadie diga que se lo ocultamos.',
    ],
    firma: 'Citoyen Valmont',
    cargo: 'Miembro del Comité de la sección',
    sello: true,
  },
  B: {
    kicker: 'Aviso al pueblo, sin firma',
    cuerpo: [
      'No pedimos que nos creáis: pedimos que lo comprobéis. El registro del mercado de la sección, que cualquiera puede consultar en la municipalidad, anota cuarenta sacos entregados a Gauthier el lunes y ninguno puesto a la venta.',
      'Preguntad al encargado del registro. Preguntad por qué el pan sube cuando el trigo existe.',
    ],
    firma: 'Unos vecinos que prefieren no dar su nombre',
    cargo: '',
    sello: false,
  },
  C: {
    kicker: 'Aviso al pueblo, segunda tirada',
    cuerpo: [
      'Otro papel circula estos días diciendo que Gauthier es “un buen patriota” y que el pan sube por culpa de los acaparadores del puerto. No lo creáis.',
      'Gauthier guarda harina. Eso no lo niega nadie. Que explique para quién la guarda, si es tan buen patriota.',
    ],
    firma: 'Sin firma',
    cargo: '',
    sello: false,
    nota: 'Alguien escribió a mano en el margen: «¡esto no es lo que dice el otro papel!»',
  },
} as const

/** Lo que descubre quien va a la municipalidad (opción Verificar). */
export const REVELA_A1: Record<Variante, string> = {
  A: 'En la municipalidad no hay registro de ningún saco a nombre de Gauthier. Sí hay una deuda: el ciudadano Valmont le debe dinero desde hace meses.',
  B: 'El registro existe. Cuarenta sacos entregados el lunes y ninguno vendido. Gauthier esperaba al invierno para venderlos más caros.',
  C: 'Gauthier guarda harina, sí: es la reserva del hospital de la sección. No es para vender. El panfleto dice la mitad; el otro papel, la otra.',
}

export const VEREDICTO_TXT: Record<Veredicto, { titulo: string; resumen: string }> = {
  falso: { titulo: 'El panfleto era FALSO', resumen: 'Lo firmaba alguien con cargo, y mentía.' },
  cierto: { titulo: 'El panfleto era CIERTO', resumen: 'No tenía firma, pero se podía comprobar.' },
  mixto: { titulo: 'El panfleto decía MEDIA VERDAD', resumen: 'Todo lo que decía era cierto… menos lo que callaba.' },
}

/** Eco inmediato de la primera decisión (antes de conocer la verdad). */
export const ECO_A1_MAIN: Record<string, string> = {
  creer: 'Lo crees. En la fila del pan repites lo que leíste. Nadie te pide pruebas; a ti tampoco.',
  compartir: 'Pasas el panfleto a quien tienes al lado. Para la noche lo habrá leído medio barrio.',
  denunciar: 'Llevas el panfleto a la Guardia de la sección y señalas a Gauthier, el panadero (personaje ficticio).',
  ignorar: 'Doblas el panfleto y te lo guardas en el bolsillo.',
}

/** Qué hacer tras verificar (segunda decisión, ya conociendo la verdad). */
export const OPCIONES_TRAS = [
  { id: 'difundir', label: 'Contárselo a tus vecinos' },
  { id: 'guardia', label: 'Avisar a la Guardia de la sección' },
  { id: 'callar', label: 'No hacer nada' },
] as const

const EFECTO: Record<string, Record<Veredicto, [string, Tono]>> = {
  creer: {
    falso: ['Repetiste una mentira convencido de que era verdad. Con tu voz, el rumor ganó credibilidad.', 'mal'],
    cierto: ['Acertaste, pero por suerte: no comprobaste nada. La próxima vez podría ser falso.', 'mixto'],
    mixto: ['Creíste solo la mitad de la historia, y la mitad que faltaba lo cambiaba todo.', 'mal'],
  },
  compartir: {
    falso: ['Tu copia pasó por decenas de manos. Gauthier estuvo días sin poder abrir su panadería por culpa de un rumor falso.', 'mal'],
    cierto: ['Tu copia ayudó a que el barrio presionara y Gauthier tuvo que sacar el trigo a la venta. Dijiste algo cierto, aunque sin saberlo.', 'mixto'],
    mixto: ['Tu copia dejó a Gauthier como acaparador. El hospital de la sección se quedó sin quien quisiera entregarle harina por miedo.', 'mal'],
  },
  denunciar: {
    falso: ['La Guardia detuvo a Gauthier sin pruebas. Pasó la noche en el calabozo y perdió tres días de ventas. Era inocente, y el motivo fue tu denuncia.', 'mal'],
    cierto: ['La Guardia encontró los sacos. Gauthier fue multado y el trigo se repartió. Tu denuncia ayudó, y desde entonces eres quien señala.', 'mixto'],
    mixto: ['La Guardia encontró harina y detuvo a Gauthier un día. Cuando se supo que era para el hospital lo soltaron, pero la gente ya lo llamaba acaparador.', 'mal'],
  },
  ignorar: {
    falso: ['Dejaste que otros decidieran. El rumor siguió sin ti, y Gauthier cargó con él solo.', 'mixto'],
    cierto: ['Dejaste que otros decidieran. A veces no decidir también es una decisión.', 'mixto'],
    mixto: ['Dejaste que otros decidieran. A veces no decidir también es una decisión.', 'mixto'],
  },
  difundir: {
    falso: ['Desmentiste el panfleto ante tus vecinos. Unos te dieron las gracias; otros dijeron que defendías a un acaparador con pruebas no mejores que las del papel.', 'bien'],
    cierto: ['Confirmaste lo cierto ante tus vecinos. La cola se encendió: ahora eras quien traía la mala noticia.', 'mixto'],
    mixto: ['Contaste la historia completa. Te acusaron de tibio: querían un culpable, no una explicación.', 'bien'],
  },
  guardia: {
    falso: ['Avisaste a la Guardia de que el panfleto mentía. Investigaron a Valmont, que lo negó todo. Tu nombre quedó en un informe.', 'mixto'],
    cierto: ['Avisaste a la Guardia con el registro en la mano. Gauthier fue multado y el trigo, repartido. Tenías pruebas; aun así, señalaste a alguien.', 'mixto'],
    mixto: ['Avisaste a la Guardia con lo que sabías. Resolvieron que la harina era legítima, pero por tu aviso Gauthier perdió un día de trabajo.', 'mixto'],
  },
  callar: {
    falso: ['Sabías que era falso y callaste. El rumor siguió sin ti, y Gauthier cargó con él.', 'mal'],
    cierto: ['Sabías que era cierto y callaste. El barrio siguió sin pan, y sin explicaciones.', 'mal'],
    mixto: ['Sabías la verdad completa y no la dijiste. La mitad del rumor ganó.', 'mal'],
  },
}

/** Desenlace personal tras conocer la verdad. `tras` solo existe si verificó. */
export function desenlaceA1(variante: Variante, main: string | undefined, tras?: string): { verdad: Veredicto; texto: string; tono: Tono } {
  const verdad = VERDAD_A1[variante]
  const accion = main === 'verificar' ? (tras ?? 'callar') : (main ?? 'ignorar')
  const [texto, tono] = (EFECTO[accion] ?? EFECTO.ignorar)[verdad]
  return { verdad, texto, tono }
}

// ---------------------------------------------------------------- Ecos del resto de decisiones
/** Línea de consecuencia inmediata que aparece en el celular tras decidir. clave: `${escena}|${prompt}|${opción}` */
export const ECO: Record<string, string> = {
  'a2_rey|c1|requisar': 'Los soldados vacían el almacén de un panadero. Hay pan para hoy; mañana nadie querrá guardar nada.',
  'a2_rey|c1|regular': 'Fijas un precio. Algunos panaderos cierran; otros venden bajo cuerda.',
  'a2_rey|c1|esperar': 'Esperas. El pan sube y la gente empieza a buscar culpables por su cuenta.',
  'a2_rey|c2|encarcelar': 'El panfletista pasa la noche en prisión. Mañana habrá tres más escribiendo en voz baja.',
  'a2_rey|c2|multa': 'Paga y sigue escribiendo, pero ahora sabe lo que le costaría.',
  'a2_rey|c2|ignorar': 'Lo dejas. La crítica circula; también circulan las preguntas.',
  'a2_rey|c3|prision': 'El vecino entra a prisión por su deuda. Su familia pierde el sustento.',
  'a2_rey|c3|plazo': 'Le das un plazo. Cobras tarde, pero cobras.',
  'a2_rey|c3|perdonar': 'Perdonas la deuda. Otros vecinos empiezan a preguntar por la suya.',
  'a2_contrapesos|legislativo|leg_prohibir': 'Propones prohibir toda crítica. Tu propuesta pasa al ejecutivo, que puede aplicarla… o no.',
  'a2_contrapesos|legislativo|leg_regular': 'Propones permitir la crítica con límites. Otros decidirán si los límites se respetan.',
  'a2_contrapesos|legislativo|leg_libre': 'Propones libertad de imprenta. Otros decidirán qué hacer cuando moleste.',
  'a2_contrapesos|ejecutivo|eje_arrestar': 'Ordenas arrestarlo. El tribunal aún puede decidir que no había delito.',
  'a2_contrapesos|ejecutivo|eje_advertir': 'Le adviertes. Sabe que lo estás mirando.',
  'a2_contrapesos|ejecutivo|eje_ignorar': 'No intervienes. Dependerá de la ley y del juez.',
  'a2_contrapesos|judicial|jud_condenar': 'Lo condenas, si la ley lo permite. Nadie más puede cambiar tu sentencia.',
  'a2_contrapesos|judicial|jud_multa': 'Multa leve. Ni castigo ejemplar ni impunidad.',
  'a2_contrapesos|judicial|jud_absolver': 'Lo absuelves. Tu decisión no depende de quien te lo pidió.',
  'a3_decreto|main|aplaudir': 'Aplaudes. Un vecino te sonríe; otro baja la vista.',
  'a3_decreto|main|callar': 'Callas. Nadie lo nota… o eso crees.',
  'a3_decreto|main|criticar': 'Hablas en voz alta. Se hace un silencio. Alguien te mira y desvía los ojos.',
  'a3_cordelier|main|escribir': 'Escribes. Antes de salir impreso, tu texto pasa por manos del presentador.',
  'a3_cordelier|main|no_escribir': 'Decides no escribir. Nadie sabrá lo que pensabas; tampoco lo sabrán quienes lo necesitaban.',
  'a3_danton|main|abogar': 'Pides públicamente que a Duval (ficticio) se le dé un juicio justo. Algunos te miran con respeto; otros, con miedo de estar cerca de ti.',
  'a3_danton|main|callar': 'No dices nada. Duval sigue en la celda y tú sigues libre.',
  'a3_danton|main|distanciar': 'Cruzas la calle. Te dices que es prudencia.',
  'a3_tribunal_garantias|main|defenderme': 'Defiendes tu caso con tus propias palabras.',
  'a3_tribunal_garantias|main|testigo': 'Un vecino acepta declarar a tu favor, con el riesgo que eso implica para él.',
  'a3_tribunal_garantias|main|apelar': 'Apelas. El tribunal aún debe decidir si te escucha.',
  'a3_tribunal_sin_garantias|main|esperar': 'No hay defensa posible. Solo esperar.',
  'a4_fiesta|main|musica': 'La música llena la plaza. Por un momento nadie piensa en fronteras.',
  'a4_fiesta|main|poesia': 'Alguien lee versos en vuestra lengua y media plaza calla para escucharlos.',
  'a4_fiesta|main|cocina': 'La mesa común se llena. Compartir comida es la forma más vieja de compartir cultura.',
  'a4_union|main|apoyar': 'Apoyas la unión. Tienes primos al otro lado de la frontera y quieres verlos más.',
  'a4_union|main|dudar': 'Dudas: ¿quién decidirá, y a quién se le preguntó?',
  'a4_union|main|rechazar': 'Rechazas. Compartir idioma no es firmar un contrato.',
  'a4_vecino|main|dialogo': 'Envías una delegación a conversar. Es lento y poco heroico, pero nadie sale herido.',
  'a4_vecino|main|presionar': 'Cierras el camino del mercado a sus carros hasta que cedan. Tus vecinos aplauden; al llegar el invierno, los dos pueblos pasan escasez.',
  'a4_vecino|main|respetar': 'Respetas su decisión. En tu pueblo, unos te llaman blando y otros, justo.',
  'a5_kant|main|si': 'Anotado. ¿Lo creerías también si el juicio no fuera tuyo?',
  'a5_kant|main|no': 'Anotado. Saberlo ya es empezar a juzgarse con honestidad.',
  'a5_mill|main|si': 'Anotado. ¿Y quién quedó fuera de la cuenta?',
  'a5_mill|main|no': 'Anotado. ¿A quién perjudicaron, y cómo lo supiste?',
}
export const ecoDe = (scene: string, key: string, choice: string) => ECO[`${scene}|${key}|${choice}`]

/** “Hoy sería…”: el paralelo moderno que ayuda a debatir. */
export const HOY: Record<string, string> = {
  a1_rumor: 'Hoy sería un mensaje reenviado en un grupo de chat, con una captura de pantalla como “prueba”.',
  a3_decreto: 'Hoy sería un comentario que quieres publicar, y la duda de quién lo va a ver.',
  a3_danton: 'Hoy sería ver cómo acusan a alguien que conoces y decidir si lo defiendes, sabiendo que a ti también te pueden señalar.',
  a3_cordelier: 'Hoy sería escribir una opinión con tu nombre sabiendo que no se puede borrar.',
  a4_union: 'Hoy sería una disputa entre regiones o países por una lengua, un recurso o una frontera.',
  a4_vecino: 'Hoy sería un bloqueo comercial o una presión política “por el bien común”.',
}

// ---------------------------------------------------------------- Debate (se lee en voz alta desde el proyector con la tecla D)
export const DEBATE: Record<string, string[]> = {
  a1_rumor_resultados: [
    '¿Qué panfleto parecía más creíble? ¿Y cuál resultó ser verdad?',
    '¿Por qué creemos más a quien firma con un cargo que a un papel anónimo con pruebas?',
    '¿Cuánto cuesta verificar? ¿Quién puede permitírselo cuando todos están compartiendo?',
  ],
  a1_rumor_reveal: [
    'Si ya sabían pensar por su cuenta, ¿por qué el rumor se difundió tan rápido?',
    '¿Quién es más responsable: quien imprimió, quien compartió o quien creyó?',
  ],
  a2_reveal: [
    '¿Qué pasó cuando una sola persona decidió todo? ¿Y con tres grupos?',
    '¿Los límites hacen más lento el gobierno… o más justo?',
  ],
  a3_decreto: [
    'En tiempos de guerra, ¿dudar de una medida es traición?',
    '¿Cuándo callar deja de ser prudencia y empieza a ser complicidad?',
  ],
  a3_cordelier: [
    '¿Qué se pierde al escribir con riesgo? ¿Qué se pierde al no escribir?',
    '¿Quién decide qué texto es aceptable? ¿Tiene sentido que haya moderación?',
  ],
  a3_danton: [
    'Si un conocido es arrestado, ¿defenderlo es valentía o imprudencia?',
    '¿Qué los hizo decidir? ¿El miedo, la lealtad, la justicia?',
  ],
  a3_tribunal_garantias: [
    '¿Qué garantías necesita alguien acusado? ¿Por qué importan aunque sea culpable?',
  ],
  a3_pradial: [
    '¿Qué pasa cuando se aceleran los juicios “para defender a la República”?',
  ],
  a3_resultados: [
    '¿Cuántos callaron? ¿Qué dice eso del miedo como forma de gobierno?',
    'Una revolución que defendía la libertad terminó castigando a quien cuestionaba: ¿cómo evitarlo?',
  ],
  a4_union: [
    '¿Compartir idioma justifica compartir país? ¿Quién debería decidirlo?',
  ],
  a4_vecino: [
    'Si el pueblo vecino no quiere unirse, ¿hasta dónde puede presionarse sin dejar de respetarlo?',
    '¿Presionar “por su bien” cuenta como convencer?',
  ],
  a4_resultados: [
    '¿Qué porcentaje presionó? ¿Cambiaría su respuesta si fuera su propio pueblo el que se negara?',
  ],
  a5_kant: [
    '¿Aceptarías, para todos, el principio con el que decidiste?',
    '¿Tratamos a Gauthier, a Duval o al vecino solo como un medio para algo?',
  ],
  a5_mill: [
    '¿Quién quedó fuera de la cuenta del “mayor bienestar”?',
    '¿Una decisión puede ser buena por sus consecuencias y mala por sus principios?',
  ],
  cierre: [
    'En un trabajo en equipo: ¿cumplir tu parte y no aprovecharte aunque nadie te vea… es lo mismo que lo que vivimos hoy?',
  ],
}
