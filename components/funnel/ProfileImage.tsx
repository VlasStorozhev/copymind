import Image from 'next/image'

type ProfileGender = string | null | undefined

export function ProfileImage({ gender }: { gender: ProfileGender }) {
  if (gender !== 'woman' && gender !== 'man') {
    return null
  }

  const src = gender === 'woman' ? '/images/app-profile-woman.png' : '/images/app-profile-man.png'
  const alt = gender === 'woman' ? 'Portrait illustration of a woman' : 'Portrait illustration of a man'

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover object-center"
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 240px, 100vw"
      />
    </div>
  )
}
