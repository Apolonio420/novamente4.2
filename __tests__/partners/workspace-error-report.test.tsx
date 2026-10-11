import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const authFetchMock = vi.fn()
vi.mock('@/lib/partners/auth-fetch', () => ({ authFetch: (...a: unknown[]) => authFetchMock(...a) }))

import { sendAutoReport, createErrorTicket } from '@/lib/errors/workspace-error-report'
import { ErrorTicketButton } from '@/components/workspace/error-ticket-button'

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  authFetchMock.mockResolvedValue({ ok: true, json: async () => ({ ticket: { id: 'tk-9' } }) })
})

function err(message: string, digest?: string) {
  return Object.assign(new Error(message), { digest })
}

describe('sendAutoReport — dedupe', () => {
  it('manda una sola vez por digest aunque se llame de nuevo (StrictMode / re-render / reset)', async () => {
    const e = err('boom A', 'dig-A')
    await sendAutoReport(e)
    await sendAutoReport(e)
    await sendAutoReport(err('otro texto', 'dig-A'))
    expect(authFetchMock).toHaveBeenCalledTimes(1)
    expect(authFetchMock.mock.calls[0][0]).toBe('/api/partners/assistant/bug-report')
  })

  it('un digest distinto sí se manda; sin digest dedupe por ruta+mensaje', async () => {
    await sendAutoReport(err('boom B', 'dig-B'))
    await sendAutoReport(err('sin digest'))
    await sendAutoReport(err('sin digest'))
    expect(authFetchMock).toHaveBeenCalledTimes(2)
  })

  it('una falla de red no lanza', async () => {
    authFetchMock.mockRejectedValue(new Error('offline'))
    await expect(sendAutoReport(err('x', 'dig-C'))).resolves.toBe(false)
  })
})

describe('createErrorTicket / ErrorTicketButton', () => {
  it('crea un ticket técnico con ruta, error y digest', async () => {
    const id = await createErrorTicket(err('fallo raro', 'dig-T'))
    expect(id).toBe('tk-9')
    const [url, init] = authFetchMock.mock.calls[0]
    expect(url).toBe('/api/partners/support')
    const body = JSON.parse(init.body)
    expect(body.category).toBe('technical')
    expect(body.description).toContain('fallo raro')
    expect(body.description).toContain('dig-T')
  })

  it('el botón muestra la confirmación y el link a /workspace/support, y no duplica con doble click', async () => {
    render(<ErrorTicketButton error={err('fallo', 'dig-U')} />)
    const btn = screen.getByText('Avisar a Novamente')
    fireEvent.click(btn)
    fireEvent.click(btn)
    await waitFor(() => screen.getByText(/Listo, ya nos llegó. Te respondemos en Soporte./))
    expect(authFetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Ir a Soporte').getAttribute('href')).toBe('/workspace/support')
  })

  it('si el ticket falla muestra el error y permite reintentar', async () => {
    authFetchMock.mockResolvedValueOnce({ ok: false })
    render(<ErrorTicketButton error={err('fallo', 'dig-V')} />)
    fireEvent.click(screen.getByText('Avisar a Novamente'))
    await waitFor(() => screen.getByText(/No pudimos enviarlo/))
    fireEvent.click(screen.getByText('Avisar a Novamente'))
    await waitFor(() => screen.getByText(/Listo, ya nos llegó/))
  })
})
