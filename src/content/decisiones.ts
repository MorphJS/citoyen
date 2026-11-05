// Opciones de cada escena y sus efectos. Todo ficticio salvo los hechos de CONTENIDO.md.
import type { Meters } from '../game/types.ts'
import { BALANCE as B } from './balance.ts'

export type Opcion = { id: string; label: string; sub?: string; delta?: Partial<Meters>; flag?: string }
export type Prompt = { key: string; pregunta: string; opciones: Opcion[] }

export const PROMPTS: Record<string, Prompt[]> = {
  a1_rumor: [
    {
      key: 'main',
      pregunta: 'Tienes el panfleto en la mano. ¿Qué haces?',
      opciones: [
        { id: 'verificar', label: 'Ir a verificarlo', sub: 'Cuesta tiempo mientras otros ya deciden', delta: { libertad: 5 }, flag: 'verifico' },
        { id: 'creer', label: 'Creerlo', delta: { seguridad: 5 } },
        { id: 'compartir', label: 'Compartirlo', delta: { riesgo: B.riesgoPanfleto }, flag: 'compartio' },
        { id: 'denunciar', label: 'Denunciarlo', sub: 'A la Guardia, señalando al panadero (personaje ficticio)', delta: { riesgo: B.riesgoPanfleto, lealtad: 5 } },
        { id: 'ignorar', label: 'Ignorarlo' },
      ],
    },
    {
      key: 'tras',
      pregunta: 'Ya sabes la verdad. ¿Qué haces con ella?',
      opciones: [
        { id: 'difundir', label: 'Contárselo a tus vecinos', flag: 'difundio' },
        { id: 'guardia', label: 'Avisar a la Guardia de la sección', delta: { riesgo: B.riesgoPanfleto } },
        { id: 'callar', label: 'No hacer nada' },
      ],
    },
  ],
  a2_rey: [
    { key: 'c1', pregunta: 'Falta pan en la ciudad.', opciones: [
      { id: 'requisar', label: 'Requisar el pan y castigar a quien lo esconda' },
      { id: 'regular', label: 'Fijar un precio y vigilar el mercado' },
      { id: 'esperar', label: 'Esperar a que el mercado se arregle' },
    ] },
    { key: 'c2', pregunta: 'Un panfletista critica al gobierno.', opciones: [
      { id: 'encarcelar', label: 'Encarcelarlo' },
      { id: 'multa', label: 'Imponerle una multa' },
      { id: 'ignorar', label: 'Ignorar la crítica' },
    ] },
    { key: 'c3', pregunta: 'Un vecino debe una deuda al rey.', opciones: [
      { id: 'prision', label: 'Prisión por la deuda' },
      { id: 'plazo', label: 'Darle un plazo' },
      { id: 'perdonar', label: 'Perdonar la deuda' },
    ] },
  ],
  // Mismo caso (el panfletista) pero repartido entre tres grupos: cada uno decide solo su parte.
  a2_contrapesos: [
    { key: 'legislativo', pregunta: 'Grupo legislativo: propón la ley sobre el panfletista.', opciones: [
      { id: 'leg_prohibir', label: 'Prohibir toda crítica' },
      { id: 'leg_regular', label: 'Permitir la crítica con límites claros' },
      { id: 'leg_libre', label: 'Libertad de imprenta' },
    ] },
    { key: 'ejecutivo', pregunta: 'Grupo ejecutivo: aplica la ley al panfletista.', opciones: [
      { id: 'eje_arrestar', label: 'Arrestarlo' },
      { id: 'eje_advertir', label: 'Advertirle' },
      { id: 'eje_ignorar', label: 'No intervenir' },
    ] },
    { key: 'judicial', pregunta: 'Grupo judicial: decide el caso del panfletista.', opciones: [
      { id: 'jud_condenar', label: 'Condenarlo' },
      { id: 'jud_multa', label: 'Multa leve' },
      { id: 'jud_absolver', label: 'Absolverlo' },
    ] },
  ],
  a3_decreto: [
    {
      key: 'main',
      pregunta: 'El Comité anuncia una medida (ficticia) “para defender la República”. ¿Cómo reaccionas?',
      opciones: [
        { id: 'aplaudir', label: 'Aplaudir', delta: { lealtad: 15, libertad: -5 }, flag: 'aplaudio' },
        { id: 'callar', label: 'Callar', delta: { seguridad: 5 }, flag: 'callo' },
        { id: 'criticar', label: 'Criticar', delta: { riesgo: B.riesgoCriticarDecreto, libertad: 10 }, flag: 'critico' },
      ],
    },
  ],
  a3_cordelier: [
    {
      key: 'main',
      pregunta: '¿Pides clemencia por escrito, como Desmoulins?',
      opciones: [
        { id: 'escribir', label: 'Escribir', sub: `Máx. ${B.maxPost} caracteres, con moderación`, flag: 'escribio' },
        { id: 'no_escribir', label: 'No escribir' },
      ],
    },
  ],
  a3_danton: [
    {
      key: 'main',
      pregunta: 'Duval, impresor y vecino tuyo (personaje ficticio), fue arrestado esta mañana. ¿Qué haces?',
      opciones: [
        { id: 'abogar', label: 'Pedir que se le dé un juicio justo', sub: 'En voz alta, ante los vecinos', delta: { riesgo: 10, libertad: 10 }, flag: 'abogo' },
        { id: 'callar', label: 'No decir nada' },
        { id: 'distanciar', label: 'Cruzar la calle y no mencionarlo', delta: { seguridad: 5 }, flag: 'distancio' },
      ],
    },
  ],
  a3_tribunal_garantias: [
    {
      key: 'main',
      pregunta: 'Estás citado ante el Tribunal. Aún tienes garantías.',
      opciones: [
        { id: 'defenderme', label: 'Defenderme' },
        { id: 'testigo', label: 'Llamar a un testigo' },
        { id: 'apelar', label: 'Apelar' },
      ],
    },
  ],
  a3_tribunal_sin_garantias: [
    { key: 'main', pregunta: 'Estás citado. Ya no hay defensa posible.', opciones: [{ id: 'esperar', label: 'Esperar la sentencia' }] },
  ],
  a4_fiesta: [
    { key: 'main', pregunta: 'Tu pueblo celebra su lengua y su cultura. ¿Cómo celebras?', opciones: [
      { id: 'musica', label: 'Música en la plaza' },
      { id: 'poesia', label: 'Lectura de poemas' },
      { id: 'cocina', label: 'Mesa común con comida del pueblo' },
    ] },
  ],
  a4_union: [
    { key: 'main', pregunta: 'Llega la propuesta de unir en un Estado a todas las poblaciones de habla alemana.', opciones: [
      { id: 'apoyar', label: 'Apoyar' },
      { id: 'dudar', label: 'Dudar' },
      { id: 'rechazar', label: 'Rechazar' },
    ] },
  ],
  a4_vecino: [
    { key: 'main', pregunta: 'Un pueblo vecino habla tu idioma y no quiere unirse.', opciones: [
      { id: 'dialogo', label: 'Convencer con el diálogo' },
      { id: 'presionar', label: 'Presionar', flag: 'presiono' },
      { id: 'respetar', label: 'Respetar su decisión' },
    ] },
  ],
  a5_kant: [
    { key: 'main', pregunta: '¿Aceptarías para todos los principios con los que actuaste?', opciones: [
      { id: 'si', label: 'Sí, en general' },
      { id: 'no', label: 'No del todo' },
    ] },
  ],
  a5_mill: [
    { key: 'main', pregunta: '¿Tus decisiones produjeron más bienestar que sufrimiento?', opciones: [
      { id: 'si', label: 'Más bien sí' },
      { id: 'no', label: 'Más bien no' },
    ] },
  ],
}

export function promptsDe(scene: string): Prompt[] {
  return PROMPTS[scene] ?? []
}

export function findOpcion(scene: string, key: string, choice: string): Opcion | undefined {
  return promptsDe(scene).find((p) => p.key === key)?.opciones.find((o) => o.id === choice)
}

/** Frases de “tu historia” (Acto 5), en segunda persona y tono sobrio. */
export const HISTORIA: Record<string, Record<string, string>> = {
  a1_rumor: {
    verificar: 'Pediste razones: verificaste el panfleto antes de creerlo.',
    creer: 'Creíste el panfleto sin comprobarlo.',
    compartir: 'Compartiste el panfleto con tus vecinos.',
    denunciar: 'Denunciaste al panadero del panfleto ante la Guardia (personaje ficticio).',
    ignorar: 'Guardaste el panfleto y dejaste que otros decidieran.',
  },
  a3_danton: {
    abogar: 'Pediste un juicio justo para un vecino arrestado (ficticio), sabiendo el riesgo.',
    callar: 'Callaste mientras arrestaban a un vecino (ficticio).',
    distanciar: 'Te alejaste de un vecino arrestado (ficticio).',
  },
  a3_decreto: {
    aplaudir: 'Aplaudiste la medida del Comité.',
    callar: 'Callaste ante la medida del Comité.',
    criticar: 'Criticaste la medida del Comité.',
  },
  a3_cordelier: {
    escribir: 'Escribiste pidiendo clemencia.',
    no_escribir: 'Preferiste no escribir.',
  },
  a4_vecino: {
    dialogo: 'Intentaste convencer a un pueblo vecino con el diálogo.',
    presionar: 'Presionaste a un pueblo vecino para que se uniera.',
    respetar: 'Respetaste la decisión de un pueblo vecino.',
  },
}
