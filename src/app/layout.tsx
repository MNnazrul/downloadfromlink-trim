import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Video Cutter App',
  description: 'Cut video segments with specific time ranges',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}