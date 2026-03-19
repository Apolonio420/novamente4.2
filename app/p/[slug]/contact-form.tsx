'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ContactFormProps {
  tenantSlug: string
  primaryColor: string
}

export default function ContactForm({ tenantSlug, primaryColor }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      slug: tenantSlug,
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/partners/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al enviar el formulario')
      }

      setStatus('success')
      form.reset()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar el formulario')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20" id="contacto">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <div className="mb-4 text-4xl">&#10003;</div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Gracias! Te contactaremos pronto.
          </h2>
          <p className="text-zinc-400">
            Recibimos tu consulta correctamente.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setStatus('idle')}
          >
            Enviar otra consulta
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-20" id="contacto">
      <h2 className="mb-2 text-center text-2xl font-semibold text-white md:text-3xl">
        Contacto
      </h2>
      <p className="mb-10 text-center text-zinc-500">
        Dejanos tu consulta y te respondemos a la brevedad.
      </p>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lead-name" className="text-zinc-300">
              Nombre
            </Label>
            <Input
              id="lead-name"
              name="name"
              placeholder="Tu nombre"
              required
              className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[var(--partner-primary)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="lead-email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[var(--partner-primary)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead-phone" className="text-zinc-300">
            Telefono{' '}
            <span className="text-zinc-600">(opcional)</span>
          </Label>
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            placeholder="+54 11 1234-5678"
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[var(--partner-primary)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead-message" className="text-zinc-300">
            Mensaje
          </Label>
          <Textarea
            id="lead-message"
            name="message"
            rows={4}
            placeholder="Contanos en que podemos ayudarte..."
            required
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[var(--partner-primary)]"
          />
        </div>

        {status === 'error' && (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={status === 'loading'}
          className="w-full text-white disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {status === 'loading' ? 'Enviando...' : 'Enviar consulta'}
        </Button>
      </form>
    </section>
  )
}
