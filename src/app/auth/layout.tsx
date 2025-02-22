import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auth Page',
  description: 'Authentication page for users.',
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
