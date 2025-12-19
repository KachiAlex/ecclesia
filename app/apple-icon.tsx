import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial',
            lineHeight: 1,
            transform: 'translateY(4px)',
          }}
        >
          E
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
