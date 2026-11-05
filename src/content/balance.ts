// Valores ajustables del juego (SPEC §7).
export const BALANCE = {
  riesgoBase: 20,
  riesgoCriticarDecreto: 25,
  riesgoCordelierAprobado: 20,
  riesgoArrestado: 30,
  riesgoPanfleto: 5, // compartir o denunciar en el Acto 1
  pArrestos: 0.15,
  garantias: { base: 0.85, div: 150, min: 0.15, max: 0.85, bonus: { defenderme: 0.1, testigo: 0.15, apelar: 0.05 } as Record<string, number> },
  sinGarantias: { base: 0.5, div: 200, min: 0.1, max: 0.5 },
  citarGarantiasRiesgo: 60,
  citarSinGarantiasRiesgo: 50,
  citarSinGarantiasAzar: 0.1, // además de quienes superan el riesgo: azar del sistema
  verificarMs: 5000,
  maxPost: 140,
} as const
