import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'Novamente'
  const description = searchParams.get('desc') || 'Merch premium con diseño IA'
  const logo = searchParams.get('logo') || ''
  const color = searchParams.get('color') || '#8b5cf6'
  const type = searchParams.get('type') || 'default' // default | partner | product

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: type === 'partner'
            ? `linear-gradient(135deg, ${color}22 0%, #09090b 40%, #09090b 100%)`
            : 'linear-gradient(135deg, #1e1b4b 0%, #09090b 50%, #09090b 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Top bar with brand color */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: type === 'partner' ? color : 'linear-gradient(90deg, #8b5cf6, #ec4899)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            maxWidth: '900px',
          }}
        >
          {/* Logo */}
          {logo ? (
            <img
              src={logo}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: '20px',
                border: '2px solid rgba(255,255,255,0.1)',
                objectFit: 'contain',
              }}
            />
          ) : null}

          {/* Title */}
          <div
            style={{
              fontSize: type === 'product' ? '48px' : '56px',
              fontWeight: 800,
              color: '#fafafa',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            {title.length > 60 ? title.substring(0, 57) + '...' : title}
          </div>

          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: '24px',
                color: '#a1a1aa',
                textAlign: 'center',
                lineHeight: 1.4,
                maxWidth: '700px',
                display: 'flex',
              }}
            >
              {description.length > 120 ? description.substring(0, 117) + '...' : description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#71717a',
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            NOVAMENTE
          </div>
          {type === 'partner' && (
            <div
              style={{
                fontSize: '16px',
                color: '#52525b',
                display: 'flex',
              }}
            >
              · Partner
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
