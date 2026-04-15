export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Override root layout: no Navbar, no Footer, no WhatsApp button, no PublicAssistant
  // Just the raw demo page, fullscreen
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 overflow-auto">
      {children}
    </div>
  )
}
