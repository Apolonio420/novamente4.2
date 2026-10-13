/**
 * Espera los avisos que se disparan al CREARSE un pedido por transferencia
 * (Telegram a "Ventas Novamente", mail a Juan, mail al cliente) ANTES de que la ruta
 * responda al cliente.
 *
 * Por qué (13/10/2026, NOV-20261013-4186): los avisos salían con `void promesa` y en
 * Vercel una promesa suelta puede quedar cortada cuando la función ya respondió. Ese día
 * llegó el mail a Juan y NO el Telegram a Ventas. Con esto los avisos corren EN PARALELO,
 * se esperan hasta `timeoutMs` y se devuelve qué salió y qué no. Nunca lanza: un aviso
 * caído jamás rompe el checkout.
 */
export type NoticeResult = Record<string, "ok" | "falló" | "timeout">

export async function awaitTransferNotices(
  notices: Array<{ name: string; promise: Promise<unknown> }>,
  timeoutMs = 8000,
): Promise<NoticeResult> {
  const result: NoticeResult = {}
  await Promise.all(
    notices.map(async ({ name, promise }) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeout = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs)
      })
      try {
        const out = await Promise.race([promise, timeout])
        if (out === "timeout") result[name] = "timeout"
        else if (out == null || (typeof out === "object" && (out as any).ok === false)) result[name] = "falló"
        else result[name] = "ok"
      } catch {
        result[name] = "falló"
      } finally {
        if (timer) clearTimeout(timer)
      }
    }),
  )
  return result
}
