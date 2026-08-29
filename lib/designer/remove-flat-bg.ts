/**
 * Pela fondos PLANOS por capas, desde el borde hacia adentro.
 *
 * Para el arte "tipo póster": un dibujo montado sobre una placa de color liso,
 * a veces con un marco finito de otro color alrededor. Ningún servicio lo
 * resuelve (verificado 28/08/2026 con un diseño real: Gemini repinta el damero,
 * remove.bg conserva la placa porque la lee como parte del sujeto), y el
 * flood-fill de un solo color tampoco: el marco (gris 164) y la placa (gris 30)
 * son DOS colores distintos y la semilla del borde no puede cruzar de uno al
 * otro.
 *
 * De ahí las pasadas: cada una toma el color del borde OPACO actual, y si ese
 * borde es razonablemente uniforme lo inunda a transparente. La pasada
 * siguiente ve el borde nuevo (la capa de abajo) y repite. El marco cae en la
 * primera, la placa en la segunda, el arte corta la inundación.
 *
 * SOLO para cuando la persona pidió explícitamente sacar el fondo ("Sin
 * fondo"): sobre una foto o un arte full-bleed esto muerde de más, y en los
 * caminos automáticos (mockup) no hay que usarlo.
 */
import sharp from 'sharp'

/**
 * Hasta 6: un marco degradé se pela de a bandas de tolerancia (el caso real
 * llevó 3-4 pasadas: dos para el bisel 96→192, una para la placa gris).
 */
const MAX_PASADAS = 6
/**
 * Fracción del borde opaco que debe estar cerca del promedio para inundar.
 * La tolerancia es ±40 y no menos porque los marcos reales no son un color
 * plano: el diseño que motivó esto tenía un bisel degradé de grises 96→192
 * (uniformidad 0.71 a ±28, 0.90 a ±40). A ±40 con gate 0.85 el marco pasa y
 * una foto (borde multicolor) sigue quedando afuera.
 */
const BORDE_UNIFORME_MIN = 0.85
const TOL_BORDE = 40
const TOL_FILL = 40

export async function removeFlatLayeredBackground(
  input: Buffer,
): Promise<{ buffer: Buffer; removed: boolean; passes: number }> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const n = w * h
  const total = () => {
    let t = 0
    for (let p = 0; p < n; p++) if (data[p * 4 + 3] === 0) t++
    return t
  }
  const transparentesAlEmpezar = total()

  let pasadas = 0
  for (let pass = 0; pass < MAX_PASADAS; pass++) {
    // borde opaco actual: el marco exterior de lo que va quedando. No es solo
    // el 1px del canvas: tras una pasada, la "capa de abajo" queda expuesta
    // como frontera con lo transparente. La barremos entera: opacos con al
    // menos un vecino transparente, más los opacos del borde del canvas.
    const frontera: number[] = []
    for (let p = 0; p < n; p++) {
      if (data[p * 4 + 3] < 128) continue
      const x = p % w, y = (p / w) | 0
      const enCanvas = x === 0 || y === 0 || x === w - 1 || y === h - 1
      const vecinoTransp = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
        .some(q => q >= 0 && data[q * 4 + 3] < 128)
      if (enCanvas || vecinoTransp) frontera.push(p)
    }
    if (frontera.length < 50) break

    const avg = [0, 0, 0]
    for (const p of frontera) { avg[0] += data[p * 4]; avg[1] += data[p * 4 + 1]; avg[2] += data[p * 4 + 2] }
    avg[0] /= frontera.length; avg[1] /= frontera.length; avg[2] /= frontera.length

    const uniforme =
      frontera.filter(p => [0, 1, 2].every(k => Math.abs(data[p * 4 + k] - avg[k]) <= TOL_BORDE)).length /
      frontera.length
    if (uniforme < BORDE_UNIFORME_MIN) break

    // Sólo se pelan capas NEUTRAS (grises, blancos, negros): las placas y los
    // marcos de este tipo de arte lo son, igual que la falsa transparencia.
    // Un frente uniforme pero DE COLOR es el propio arte (un logo liso, una
    // figura plana) — sin este freno, la pasada siguiente se lo comía y el
    // guardarraíl final tiraba TODO el trabajo (visto con un sujeto naranja
    // liso en tests: pasada 3 se lo tragó entero).
    if (Math.max(avg[0], avg[1], avg[2]) - Math.min(avg[0], avg[1], avg[2]) > 24) break

    const esFondo = (p: number) =>
      data[p * 4 + 3] >= 128 && [0, 1, 2].every(k => Math.abs(data[p * 4 + k] - avg[k]) <= TOL_FILL)

    const visited = new Uint8Array(n)
    const queue: number[] = []
    for (const p of frontera) if (esFondo(p)) { visited[p] = 1; queue.push(p) }

    let removidos = 0
    while (queue.length) {
      const p = queue.pop()!
      data[p * 4 + 3] = 0
      removidos++
      const x = p % w, y = (p / w) | 0
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !visited[q] && esFondo(q)) { visited[q] = 1; queue.push(q) }
      }
    }
    if (removidos / n < 0.002) break
    pasadas++
  }

  const transparentesAlFinal = total()
  const removidoTotal = (transparentesAlFinal - transparentesAlEmpezar) / n
  const opacoRestante = 1 - transparentesAlFinal / n
  // <2% removido = no había fondo que pelar · sujeto <3% = nos comimos el arte
  if (pasadas === 0 || removidoTotal < 0.02 || opacoRestante < 0.03) {
    return { buffer: input, removed: false, passes: pasadas }
  }
  const buffer = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
  return { buffer, removed: true, passes: pasadas }
}
