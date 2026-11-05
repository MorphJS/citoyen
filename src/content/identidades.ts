// Identidades 100% ficticias (SPEC §3). Nunca personajes históricos reales ni identidades de víctima étnica/religiosa.
import { makeRng } from '../game/rng.ts'

export type Estamento = 'clero' | 'nobleza' | 'tercer_estado'
export type Identidad = {
  seed: string
  nombreFrances: string
  oficio: string
  estamento: Estamento
  familia: string
  ciudad: string
}

const NOMBRES: { n: string; g: 'm' | 'f' }[] = [
  { n: 'Jean-Baptiste', g: 'm' }, { n: 'Étienne', g: 'm' }, { n: 'Pierre', g: 'm' }, { n: 'Louis', g: 'm' },
  { n: 'Antoine', g: 'm' }, { n: 'Mathieu', g: 'm' }, { n: 'Gaspard', g: 'm' }, { n: 'Thibault', g: 'm' },
  { n: 'Marie-Anne', g: 'f' }, { n: 'Louise', g: 'f' }, { n: 'Jeanne', g: 'f' }, { n: 'Margot', g: 'f' },
  { n: 'Élisabeth', g: 'f' }, { n: 'Colette', g: 'f' }, { n: 'Madeleine', g: 'f' }, { n: 'Geneviève', g: 'f' },
]
const APELLIDOS = ['Lefèvre', 'Moreau', 'Fournier', 'Girard', 'Bonnet', 'Lambert', 'Rousseau', 'Mercier', 'Faure', 'Roux', 'Chevalier', 'Perrin', 'Giraud', 'Masson']

const OFICIOS: Record<Estamento, { m: string[]; f: string[] }> = {
  tercer_estado: {
    m: ['panadero', 'impresor', 'abogado', 'sastre', 'boticario', 'maestro', 'comerciante', 'tejedor', 'zapatero', 'carpintero'],
    f: ['panadera', 'impresora', 'abogada', 'sastra', 'boticaria', 'maestra', 'comerciante', 'tejedora', 'zapatera', 'lavandera'],
  },
  clero: { m: ['párroco de una aldea', 'monje copista'], f: ['hermana de un hospital', 'maestra de un convento'] },
  nobleza: { m: ['pequeño noble de provincia', 'propietario de tierras'], f: ['pequeña noble de provincia', 'propietaria de tierras'] },
}
const FAMILIAS = [
  'Tu familia lleva tres generaciones en el mismo barrio.',
  'Tu familia llegó a la ciudad buscando trabajo.',
  'Tu familia tiene una pequeña tienda heredada.',
  'Tu familia vive de la tierra y de lo que vende en el mercado.',
  'Tu familia siempre ha creído que la educación abre puertas.',
  'Tu familia no sabe leer, pero tú sí.',
]
const CIUDADES = ['París', 'Lyon', 'Burdeos', 'Marsella', 'Nantes', 'Ruan', 'Lille', 'Toulouse', 'Reims', 'Estrasburgo']

function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export function identidadPara(seed: string): Identidad {
  const rnd = makeRng(seed)
  const nom = pick(NOMBRES, rnd)
  const r = rnd()
  const estamento: Estamento = r < 0.85 ? 'tercer_estado' : r < 0.93 ? 'clero' : 'nobleza' // mayoría Tercer Estado
  return {
    seed,
    nombreFrances: `${nom.n} ${pick(APELLIDOS, rnd)}`,
    oficio: pick(OFICIOS[estamento][nom.g], rnd),
    estamento,
    familia: pick(FAMILIAS, rnd),
    ciudad: pick(CIUDADES, rnd),
  }
}

export const ESTAMENTO_LABEL: Record<Estamento, string> = {
  clero: 'Clero',
  nobleza: 'Nobleza',
  tercer_estado: 'Tercer Estado',
}
