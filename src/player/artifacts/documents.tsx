// Documentos de época recreados (todo ficticio). Se leen en el celular antes de decidir: la decisión nace del objeto, no de un menú.
import type { CSSProperties, ReactNode } from 'react'
import { PANFLETO, type Variante } from '../../content/historias.ts'
import { BLACKLETTER, Emblem, FELL, FELL_SC, HAND, INK, InkStamp, Nail, Ornament, Paper, Rule, WaxSeal, WoodcutGranary } from './paper.tsx'

const body: CSSProperties = { fontFamily: FELL, fontSize: 17, lineHeight: 1.42, textAlign: 'justify', hyphens: 'auto', margin: 0 }
const smallcaps: CSSProperties = { fontFamily: FELL_SC, letterSpacing: '0.12em', textTransform: 'uppercase' }
const ink: CSSProperties = { textShadow: '0 0 .5px rgba(42,31,22,.9), 0 0 2.5px rgba(42,31,22,.22)' }

function DropCapParagraph({ text }: { text: string }) {
  return (
    <p style={{ ...body, ...ink }}>
      <span style={{ float: 'left', fontFamily: BLACKLETTER, fontSize: 54, lineHeight: 0.8, padding: '6px 6px 0 0', color: INK }}>{text[0]}</span>
      {text.slice(1)}
    </p>
  )
}

/** El panfleto del Acto 1: tres envolturas de la misma acusación. `copias` = cuántos ciudadanos ya lo compartieron (en vivo). */
export function Panfleto({ v, copias }: { v: Variante; copias: number }) {
  const d = PANFLETO[v]
  return (
    <div style={{ position: 'relative' }}>
      <Paper tilt={v === 'A' ? -0.8 : v === 'B' ? 0.6 : -0.4} seed={'pan' + v}>
        <article style={{ padding: '26px 22px 30px', textAlign: 'center', ...ink }}>
          <p style={{ ...smallcaps, fontSize: 11.5, margin: 0 }}>{PANFLETO.imprenta}</p>
          <Rule thick />
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 15, margin: '2px 0 6px' }}>{d.kicker}</p>
          <h2 style={{ fontFamily: BLACKLETTER, fontSize: 41, lineHeight: 0.98, margin: '0 0 4px', color: INK, filter: 'url(#ink-bleed)' }}>{PANFLETO.titulo}</h2>
          <WoodcutGranary seed={v} />
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 19, lineHeight: 1.25, margin: '6px 0 2px' }}>{PANFLETO.sub}</p>
          <Ornament />
          <div style={{ textAlign: 'left' }}>
            <DropCapParagraph text={d.cuerpo[0]} />
            {d.cuerpo[1] && <p style={{ ...body, marginTop: 10 }}>{d.cuerpo[1]}</p>}
          </div>
          <div style={{ marginTop: 18, textAlign: 'right', position: 'relative', minHeight: v === 'A' ? 70 : 0 }}>
            {v === 'A' && <div style={{ position: 'absolute', left: 4, top: -8 }}><WaxSeal letter="V" seed="valmont" /></div>}
            <p style={{ ...smallcaps, fontSize: 15, margin: 0 }}>{d.firma}</p>
            {d.cargo && <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 14, margin: '2px 0 0' }}>{d.cargo}</p>}
          </div>
          <Rule />
          <p style={{ fontFamily: FELL, fontSize: 13, fontStyle: 'italic', margin: 0 }}>{PANFLETO.lugar} · Hacedlo correr de mano en mano.</p>
        </article>
        {v === 'C' && (
          <p style={{ position: 'absolute', right: 6, top: 66, width: 96, transform: 'rotate(7deg)', fontFamily: HAND, fontSize: 17, lineHeight: 1, color: '#2a3f6b', margin: 0, opacity: 0.9, textAlign: 'center' }}>
            {PANFLETO.C.nota}
          </p>
        )}
      </Paper>
      <div style={{ position: 'absolute', right: -4, top: 188 }}>
        <InkStamp top="EN CIRCULACIÓN" big={String(copias)} small="COPIAS" />
      </div>
    </div>
  )
}

/** Cartel del Comité pegado en la pared (decreto ficticio basado en el clima del Terror). */
export function Placard() {
  return (
    <div style={{ position: 'relative' }}>
      <Paper tilt={0.5} seed="placard" tone="cool">
        <article style={{ padding: '22px 20px 26px', textAlign: 'center', ...ink }}>
          <div aria-hidden style={{ display: 'flex', height: 6, margin: '0 0 12px' }}>
            <i style={{ flex: 1, background: '#2b3f73' }} /><i style={{ flex: 1, background: '#ece6d6' }} /><i style={{ flex: 1, background: '#8a1c14' }} />
          </div>
          <p style={{ ...smallcaps, fontSize: 12, margin: 0 }}>Comité de Salvación Pública</p>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}><Emblem size={72} /></div>
          <h2 style={{ fontFamily: FELL_SC, fontSize: 36, letterSpacing: '0.1em', margin: '0 0 2px', filter: 'url(#ink-bleed)' }}>AVISO</h2>
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 16, margin: 0 }}>Para defender la República</p>
          <Rule thick />
          <ol style={{ ...body, textAlign: 'left', paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>La República está en guerra y rodeada de enemigos, dentro y fuera.</li>
            <li style={{ marginBottom: 8 }}>Quien difunda dudas sobre las medidas del Comité será llamado a explicar su conducta.</li>
            <li style={{ marginBottom: 8 }}>Los buenos ciudadanos celebrarán estas medidas en voz alta.</li>
          </ol>
          <Rule />
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 13, margin: 0 }}>Se fija en las puertas de cada sección. Nadie podrá alegar ignorancia.</p>
        </article>
      </Paper>
      <Nail style={{ left: 10, top: 6 }} /><Nail style={{ right: 10, top: 6 }} />
    </div>
  )
}

/** Página del Cordelier tal como quedaría impreso. El texto se compone en vivo mientras escribes. */
export function JournalClip({ text }: { text: string }) {
  const t = text.trim()
  return (
    <Paper tilt={-0.4} seed="journal">
      <article style={{ padding: '20px 20px 24px', ...ink }}>
        <p style={{ ...smallcaps, fontSize: 11, textAlign: 'center', margin: 0 }}>Hoja de prueba · sección</p>
        <h2 style={{ fontFamily: BLACKLETTER, fontSize: 38, textAlign: 'center', margin: '2px 0 0', filter: 'url(#ink-bleed)' }}>Le Vieux Cordelier</h2>
        <Rule thick />
        {t ? (
          <>
            <DropCapParagraph text={t} />
            <p style={{ ...smallcaps, fontSize: 13, textAlign: 'right', margin: '12px 0 0' }}>— Un ciudadano</p>
          </>
        ) : (
          <p style={{ ...body, opacity: 0.45, fontStyle: 'italic', minHeight: 70 }}>Aquí aparecerá tu texto, impreso. Cualquiera podrá leerlo.</p>
        )}
        <Rule />
      </article>
    </Paper>
  )
}

/** Citación o detención: sobria, sin imágenes gráficas, y siempre aclarando que fue el AZAR del juego (no un compañero). */
export function Citacion({ nombre, oficio, ciudad, titulo, texto, nota, numero }: { nombre: string; oficio: string; ciudad: string; titulo: string; texto: ReactNode; nota: string; numero: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <Paper tilt={0.4} seed={'cit' + numero}>
        <article style={{ padding: '22px 22px 26px', ...ink }}>
          <p style={{ ...smallcaps, fontSize: 11.5, textAlign: 'center', margin: 0 }}>Tribunal Revolucionario</p>
          <h2 style={{ fontFamily: BLACKLETTER, fontSize: 40, textAlign: 'center', margin: '2px 0 0', filter: 'url(#ink-bleed)' }}>{titulo}</h2>
          <Rule thick />
          <p style={{ ...body, textAlign: 'left' }}>
            El ciudadano <b>{nombre}</b>, {oficio} de {ciudad}, {texto}
          </p>
          <p style={{ fontFamily: HAND, fontSize: 22, color: '#2a3f6b', margin: '12px 0 0', lineHeight: 1 }}>N.º {String(numero).padStart(4, '0')}</p>
          <div style={{ position: 'absolute', right: 14, bottom: 52 }}><WaxSeal letter="R" size={70} seed={'cit' + numero} /></div>
          <Rule />
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 13.5, margin: 0, paddingRight: 76 }}>{nota}</p>
        </article>
      </Paper>
    </div>
  )
}

/** Carta del consejo de un pueblo vecino (ficticio y neutral). */
export function CartaVecina() {
  return (
    <div style={{ position: 'relative' }}>
      <Paper tilt={-0.5} seed="carta">
        <article style={{ padding: '24px 22px 28px', ...ink }}>
          <p style={{ ...smallcaps, fontSize: 11.5, margin: 0 }}>Consejo del pueblo de Hohenau</p>
          <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 13, margin: '0 0 8px' }}>(pueblo ficticio, vecino del vuestro)</p>
          <Rule />
          <p style={{ ...body, textAlign: 'left' }}>Vecinos:</p>
          <p style={{ ...body, marginTop: 8 }}>Hablamos vuestra misma lengua, cantamos vuestras mismas canciones y compramos en vuestro mercado. Os apreciamos.</p>
          <p style={{ ...body, marginTop: 8 }}>Pero no queremos formar parte de vuestro país. Queremos seguir decidiendo nosotros sobre nuestras leyes, nuestros impuestos y nuestras escuelas.</p>
          <p style={{ ...body, marginTop: 8, marginBottom: 34 }}>Sabemos que nuestro paso por el puente os cuesta dinero en aduanas. Sentémonos a hablar de eso, sin amenazas.</p>
          <p style={{ ...smallcaps, fontSize: 14, textAlign: 'right', margin: '16px 0 0', position: 'relative', zIndex: 1 }}>El Consejo</p>
          <div style={{ position: 'absolute', left: 18, bottom: 12 }}><WaxSeal letter="H" size={56} seed="hohenau" /></div>
        </article>
      </Paper>
    </div>
  )
}

/** Manifiesto de unión (Acto 4): persuasivo a propósito. */
export function Manifiesto() {
  return (
    <Paper tilt={0.4} seed="manifiesto">
      <article style={{ padding: '24px 22px 28px', textAlign: 'center', ...ink }}>
        <p style={{ ...smallcaps, fontSize: 11.5, margin: 0 }}>Manifiesto · siglo XIX</p>
        <h2 style={{ fontFamily: BLACKLETTER, fontSize: 36, lineHeight: 1, margin: '6px 0 4px', filter: 'url(#ink-bleed)' }}>A quienes hablamos la misma lengua</h2>
        <Rule thick />
        <p style={{ ...body, textAlign: 'left' }}>¿Por qué un río o una línea en un mapa han de separar a quienes rezan, cantan y sueñan en el mismo idioma?</p>
        <p style={{ ...body, marginTop: 8 }}>Unidos, comerciaremos sin aduanas, tendremos escuelas comunes y una voz que nos respetará en toda Europa.</p>
        <Ornament />
        <p style={{ fontFamily: BLACKLETTER, fontSize: 24, margin: 0 }}>¡Un solo Estado, una sola lengua!</p>
        <Rule />
        <p style={{ fontFamily: FELL, fontStyle: 'italic', fontSize: 13, margin: 0 }}>Documento ficticio. El pangermanismo fue una ideología nacionalista del siglo XIX.</p>
      </article>
    </Paper>
  )
}

/** Ley del 22 de pradial: solo hechos de CONTENIDO.md. */
export function LeyPradial() {
  return (
    <div style={{ position: 'relative' }}>
      <Paper tilt={-0.3} seed="pradial" tone="cool">
        <article style={{ padding: '22px 22px 26px', textAlign: 'center', ...ink }}>
          <p style={{ ...smallcaps, fontSize: 11.5, margin: 0 }}>10 de junio de 1794</p>
          <h2 style={{ fontFamily: BLACKLETTER, fontSize: 38, lineHeight: 1, margin: '4px 0 0', filter: 'url(#ink-bleed)' }}>Ley del 22 de pradial</h2>
          <Rule thick />
          <p style={{ ...body, textAlign: 'left' }}>Se reducen las garantías de los acusados ante el Tribunal Revolucionario y se aceleran los procesos.</p>
          <p style={{ ...body, textAlign: 'left', marginTop: 10, fontWeight: 'bold' }}>Las sentencias podrán ser la absolución o la muerte.</p>
          <Rule />
        </article>
      </Paper>
    </div>
  )
}

/** Papeles de ciudadano: tu identidad (ficticia). */
export function PapelesCiudadano({ nombre, oficio, ciudad, estamento, familia }: { nombre: string; oficio: string; ciudad: string; estamento: string; familia: string }) {
  return (
    <Paper tilt={-0.6} seed={'id' + nombre}>
      <article style={{ padding: '22px 22px 24px', ...ink }}>
        <p style={{ ...smallcaps, fontSize: 11.5, textAlign: 'center', margin: 0 }}>Papeles de ciudadano · Francia, 1750–1794</p>
        <Rule />
        <h2 style={{ fontFamily: BLACKLETTER, fontSize: 40, lineHeight: 1, margin: '6px 0 2px', filter: 'url(#ink-bleed)' }}>{nombre}</h2>
        <p style={{ ...body, textAlign: 'left', textTransform: 'capitalize' }}>{oficio} · {ciudad}</p>
        <p style={{ ...smallcaps, fontSize: 13, margin: '6px 0 0' }}>{estamento}</p>
        <Rule />
        <p style={{ ...body, textAlign: 'left', fontStyle: 'italic' }}>{familia}</p>
        <p style={{ fontFamily: FELL, fontSize: 12.5, fontStyle: 'italic', margin: '10px 0 0', opacity: 0.8 }}>Identidad ficticia asignada por el juego. No es una persona real.</p>
      </article>
    </Paper>
  )
}
