'use client'

export { PartnerFaqSection as FaqSection }

export function PartnerFaqSection({
  faqs,
  primaryColor,
}: {
  faqs: { question: string; answer: string }[]
  primaryColor?: string
}) {
  if (faqs.length === 0) return null

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="mb-10 text-center text-2xl font-semibold text-white md:text-3xl">
        Preguntas Frecuentes
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors open:border-zinc-700"
          >
            <summary
              className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-medium text-zinc-200 transition-colors hover:text-white [&::-webkit-details-marker]:hidden"
              style={{ listStyle: 'none' }}
            >
              <span>{faq.question}</span>
              <span
                className="shrink-0 text-lg transition-transform group-open:rotate-45"
                style={{ color: primaryColor || '#a1a1aa' }}
              >
                +
              </span>
            </summary>
            <div className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
