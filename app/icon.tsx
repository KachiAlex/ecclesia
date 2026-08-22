import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 112,
        }}
      >
        <div
          style={{
            width: 380,
            height: 380,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 96,
          }}
        >
          <div
            style={{
              fontSize: 240,
              fontWeight: 800,
              color: 'white',
              fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial',
              lineHeight: 1,
              transform: 'translateY(8px)',
            }}
          >
            E
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
