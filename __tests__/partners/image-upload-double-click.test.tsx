// Bug (auditoría workspace 08/10/2026): ImageUpload no bloqueaba un segundo
// click/drop mientras la subida anterior todavía estaba en curso — el
// estado `uploading` solo se refleja en el próximo render, así que dos
// clicks rápidos ven `uploading === false` los dos y disparan dos
// POST /api/partners/upload en paralelo (dos registros en partner_assets,
// dos llamadas a onChange pisándose). El fix agrega un `uploadingRef`
// (sincrónico) que cierra la ventana de carrera.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'

const authFetchMock = vi.fn()
vi.mock('@/lib/partners/auth-fetch', () => ({
  authFetch: (...args: unknown[]) => authFetchMock(...args),
}))

import { ImageUpload } from '@/components/partners/image-upload'

beforeEach(() => {
  vi.clearAllMocks()
  let resolveFetch: ((v: unknown) => void) | null = null
  authFetchMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
  )
  // Expose a way for tests to resolve the in-flight fetch
  ;(authFetchMock as any)._resolve = (v: unknown) => resolveFetch?.(v)
})

function makeFile(name = 'foto.jpg') {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/jpeg' })
}

describe('ImageUpload — guard contra doble subida', () => {
  it('un segundo click mientras sube NO dispara un segundo fetch', async () => {
    const onChange = vi.fn()
    const { container } = render(<ImageUpload value={null} onChange={onChange} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile()] } })
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(1))

    // Segundo intento mientras la primera subida sigue pendiente.
    fireEvent.change(input, { target: { files: [makeFile('foto2.jpg')] } })

    // Deja correr microtasks pendientes y confirma que NO se agregó un segundo fetch.
    await new Promise((r) => setTimeout(r, 0))
    expect(authFetchMock).toHaveBeenCalledTimes(1)
  })

  it('un segundo drop mientras sube tampoco dispara un segundo fetch', async () => {
    const onChange = vi.fn()
    const { container } = render(<ImageUpload value={null} onChange={onChange} />)
    const dropzone = container.querySelector('div[class*="border-dashed"]') as HTMLElement

    const file1 = makeFile()
    fireEvent.drop(dropzone, { dataTransfer: { files: [file1] } })
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(1))

    const file2 = makeFile('foto2.jpg')
    fireEvent.drop(dropzone, { dataTransfer: { files: [file2] } })
    await new Promise((r) => setTimeout(r, 0))
    expect(authFetchMock).toHaveBeenCalledTimes(1)
  })

  it('después de terminar la subida, un nuevo click sí dispara otro fetch', async () => {
    const onChange = vi.fn()
    const { container } = render(<ImageUpload value={null} onChange={onChange} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [makeFile()] } })
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(1))

    ;(authFetchMock as any)._resolve({ ok: true, json: async () => ({ url: 'https://x/1.jpg' }) })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://x/1.jpg'))

    fireEvent.change(input, { target: { files: [makeFile('foto2.jpg')] } })
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(2))
  })
})
