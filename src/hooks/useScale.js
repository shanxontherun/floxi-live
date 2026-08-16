import { useEffect, useState } from 'react'

const DESIGN = { width: 1920, height: 1080 }

export function useScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const compute = () => {
      const s = Math.min(
        window.innerWidth / DESIGN.width,
        window.innerHeight / DESIGN.height,
      )
      setScale(Math.min(s, 1))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return scale
}
