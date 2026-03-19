'use client'

import { useState, type FormEvent } from 'react'

export function ArrepentimientoForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    alert('Solicitud enviada. Te contactaremos dentro de las 24 horas.')
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors'
  const labelClass = 'block text-sm font-medium text-white/80 mb-1.5'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white/[0.02] border border-white/10 rounded-xl p-6"
    >
      <div>
        <label htmlFor="nombre" className={labelClass}>
          Nombre completo <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          required
          placeholder="Tu nombre y apellido"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="tu@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="pedido" className={labelClass}>
          Numero de pedido o descripcion del producto{' '}
          <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="pedido"
          name="pedido"
          required
          placeholder="Ej: Pedido #12345 o Remera Aldea talle M"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fecha_compra" className={labelClass}>
            Fecha de compra <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            id="fecha_compra"
            name="fecha_compra"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="fecha_recepcion" className={labelClass}>
            Fecha de recepcion <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            id="fecha_recepcion"
            name="fecha_recepcion"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="motivo" className={labelClass}>
          Motivo <span className="text-white/30">(opcional)</span>
        </label>
        <textarea
          id="motivo"
          name="motivo"
          rows={4}
          placeholder="Contanos el motivo de tu solicitud..."
          className={inputClass + ' resize-none'}
        />
      </div>

      <button
        type="submit"
        disabled={submitted}
        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium px-8 py-2.5 rounded-lg transition-colors text-sm"
      >
        {submitted ? 'Solicitud enviada' : 'Enviar solicitud'}
      </button>
    </form>
  )
}
