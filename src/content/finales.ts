import type { EndingId } from '../game/types.ts'

export const FINALES: Record<EndingId, { titulo: string; texto: string }> = {
  condenado: {
    titulo: 'El que no volvió a hablar',
    texto: 'Tu caso fue condenado. Las sentencias podían ser la absolución o la muerte, y ya no había defensa posible.',
  },
  voz: {
    titulo: 'La voz del Cordelier',
    texto: 'Pediste clemencia por escrito, como Camille Desmoulins en Le Vieux Cordelier. Hablar tuvo un riesgo.',
  },
  presiono: {
    titulo: 'El que quiso unir a la fuerza',
    texto: 'Presionaste a un pueblo que no quería unirse. Compartir idioma no da derecho a obligar a otra comunidad.',
  },
  verificador: {
    titulo: 'El que pidió razones',
    texto: 'Comprobaste antes de creer y no compartiste lo que no habías verificado: pensar por cuenta propia.',
  },
  aplaudidor: {
    titulo: 'El que aplaudió a tiempo',
    texto: 'Aplaudiste la medida cuando era seguro hacerlo. ¿Habrías hecho lo mismo si nadie te estuviera mirando?',
  },
  silencioso: {
    titulo: 'El superviviente silencioso',
    texto: 'Callaste y seguiste adelante. El miedo silencia, incluso cuando nadie pide el silencio.',
  },
  default: {
    titulo: 'Ciudadano del montón',
    texto: 'Viviste tu época sin destacar. Tus decisiones fueron comunes; las preguntas, no.',
  },
}

export const CIERRE_ETICO = 'Cumplir mi parte, reconocer el esfuerzo de los demás y no aprovecharme, aunque no haya castigo.'

export const FATE_TEXT: Record<string, string> = {
  absuelto: 'Tu caso fue absuelto.',
  condenado: 'Tu caso fue condenado.',
  no_citado: 'No fuiste citado.',
}
