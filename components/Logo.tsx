import Link from "next/link"
import Image from "next/image"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative">
        <Image
          src="/novamente-logo.png"
          alt="NovaMente Logo"
          width={40}
          height={40}
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
          priority
        />
      </div>
      <span className="font-bold text-lg md:text-xl tracking-widest hidden sm:inline-block">novamente</span>
    </Link>
  )
}
