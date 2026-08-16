import { useEffect, useRef, useState } from 'react'

const WHEEL = { size: 196, cx: 98, cy: 98, r: 92 }

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, from, to) {
  const a = polar(cx, cy, r, from)
  const b = polar(cx, cy, r, to)
  const large = Math.abs(to - from) > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} L ${cx} ${cy} Z`
}

const HINT = {
  idle: 'PRESS SPACE',
  spinning: 'SPINNING...',
}

function Wheel({ spinRequest, spinning, spinDuration, onSpin }) {
  const [rotation, setRotation] = useState(0)
  const rotationRef = useRef(0)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    setRendered(true)
  }, [])

  const spinToken = spinRequest ? spinRequest.token : 0
  const spinType = spinRequest ? spinRequest.type : null

  useEffect(() => {
    if (spinToken === 0) return
    const cur = rotationRef.current
    const desired = spinType === 'truth' ? 270 : 90
    const jitter = Math.random() * 46 - 23
    const finalMod = ((desired + jitter) % 360 + 360) % 360
    const spins = 8 + Math.floor(Math.random() * 3)
    const delta = (((finalMod - (cur % 360)) % 360) + 360) % 360
    const target = cur + spins * 360 + delta
    rotationRef.current = target
    setRotation(target)
  }, [spinToken, spinType])

  const hint = spinning ? HINT.spinning : HINT.idle
  const labelX = polar(WHEEL.cx, WHEEL.cy, 54, 0)
  const labelY = polar(WHEEL.cx, WHEEL.cy, 54, 180)

  return (
    <div className="wheel-column">
      <div className="wheel-wrap">
        <svg className="wheel-pointer" width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
          <path d="M10 17 L2 2 H18 Z" fill="#ffb454" stroke="#26130a" strokeWidth="1.5" />
          <circle cx="10" cy="5" r="2.2" fill="#fff" opacity="0.9" />
        </svg>

        <svg
          className="wheel-svg"
          width={WHEEL.size}
          height={WHEEL.size}
          viewBox={`0 0 ${WHEEL.size} ${WHEEL.size}`}
          style={{
            transform: rendered ? `rotate(${rotation}deg)` : 'none',
            transition: spinning
              ? `transform ${spinDuration}ms cubic-bezier(0.1, 0.72, 0.06, 1)`
              : 'transform 600ms cubic-bezier(0.3, 0.1, 0.2, 1)',
          }}
        >
          <defs>
            <linearGradient id="gTruth" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#5b21b6" />
            </linearGradient>
            <linearGradient id="gDare" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ec4899" />
              <stop offset="1" stopColor="#a21caf" />
            </linearGradient>
            <radialGradient id="gHub" cx="0.35" cy="0.3" r="1">
              <stop offset="0" stopColor="#3b2560" />
              <stop offset="1" stopColor="#140a26" />
            </radialGradient>
            <linearGradient id="wheelRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a855f7" />
              <stop offset="0.5" stopColor="#ec4899" />
              <stop offset="1" stopColor="#ffb454" />
            </linearGradient>
            <filter id="wheelGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={WHEEL.cx} cy={WHEEL.cy} r={WHEEL.r} fill="#140a26" />

          <path d={arcPath(WHEEL.cx, WHEEL.cy, WHEEL.r, 270, 90)} fill="url(#gTruth)" stroke="#1b0f2e" strokeWidth="1.5" />
          <path d={arcPath(WHEEL.cx, WHEEL.cy, WHEEL.r, 90, 270)} fill="url(#gDare)" stroke="#1b0f2e" strokeWidth="1.5" />

          {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
            const p1 = polar(WHEEL.cx, WHEEL.cy, WHEEL.r - 2, deg)
            const p2 = polar(WHEEL.cx, WHEEL.cy, 24, deg)
            return <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
          })}

          <line x1="6" y1={WHEEL.cy} x2={WHEEL.size - 6} y2={WHEEL.cy} stroke="rgba(255,208,140,0.75)" strokeWidth="2" />

          <text x={labelX.x} y={labelX.y} textAnchor="middle" dominantBaseline="central" className="wheel-label" fill="#ffffff">
            TRUTH
          </text>
          <text x={labelY.x} y={labelY.y} textAnchor="middle" dominantBaseline="central" className="wheel-label" fill="#ffffff">
            DARE
          </text>

          <circle
            cx={WHEEL.cx}
            cy={WHEEL.cy}
            r={WHEEL.r + 3}
            fill="none"
            stroke="url(#wheelRing)"
            strokeWidth="3"
            filter="url(#wheelGlow)"
            opacity="0.9"
          />
          <circle cx={WHEEL.cx} cy={WHEEL.cy} r={30} fill="url(#gHub)" stroke="rgba(255,180,84,0.5)" strokeWidth="1.5" />

          <circle cx={WHEEL.cx} cy={WHEEL.cy} r={25} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </svg>

        <button className="spin-hub" type="button" onClick={onSpin} disabled={spinning}>
          SPIN
        </button>
      </div>
      <span className="wheel-hint">{hint}</span>
    </div>
  )
}

export default Wheel
