import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { loadEffect, saveEffect, loadPrivacy, savePrivacy } from '../lib/store'
import { sound } from '../lib/sound'
import { CAMERA_STATES } from './useCamera'

const WASM_PATH = '/mediapipe/wasm/'
const MODEL_PATH = '/mediapipe/models/blaze_face_short_range.tflite'
const FRAMES_LOST = 10
const REACQUIRE_STREAK = 2

function cover(srcW, srcH, dstW, dstH) {
  const scale = Math.max(dstW / srcW, dstH / srcH)
  return { scale, dx: (dstW - srcW * scale) / 2, dy: (dstH - srcH * scale) / 2 }
}

function toDisplay(box, t) {
  return {
    x: t.dx + box.x * t.scale,
    y: t.dy + box.y * t.scale,
    w: box.w * t.scale,
    h: box.h * t.scale,
  }
}

function sourceBox(det, srcW, srcH, id) {
  const bb = det.boundingBox || { originX: 0, originY: 0, width: 0, height: 0 }
  let w = bb.width
  let h = bb.height
  const cx = bb.originX + w / 2
  const cy = bb.originY + h / 2
      w *= 1.25
      h *= 1.35
      w = Math.max(1, w)
      h = Math.max(1, h)
      let x = cx - w / 2
  let y = cy - h / 2
  x = Math.max(0, Math.min(srcW - 1, x))
  y = Math.max(0, Math.min(srcH - 1, y))
  w = Math.min(w, srcW - x)
  h = Math.min(h, srcH - y)
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, id }
}

function nearest(faces, cx, cy, tw, th) {
  let best = null
  let bestD = Infinity
  for (const f of faces) {
    const d = Math.hypot(f.cx - cx, f.cy - cy)
    if (d < bestD) {
      bestD = d
      best = f
    }
  }
  const maxDist = Math.max(tw, th) * 0.85
  return best && bestD <= maxDist ? best : null
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function applyPixelate(ctx, canvas, db) {
  const block = Math.max(6, Math.floor(Math.min(db.w, db.h) / 8))
  ctx.save()
  ctx.beginPath()
  ctx.rect(db.x, db.y, db.w, db.h)
  ctx.clip()
  ctx.imageSmoothingEnabled = false
  const bw = Math.max(1, db.w / block)
  const bh = Math.max(1, db.h / block)
  ctx.drawImage(canvas, db.x, db.y, db.w, db.h, db.x, db.y, bw, bh)
  ctx.drawImage(canvas, db.x, db.y, bw, bh, db.x, db.y, db.w, db.h)
  ctx.restore()
}

function applyBlur(ctx, canvas, db) {
  const pad = Math.max(10, Math.min(db.w, db.h) * 0.15)
  ctx.save()
  ctx.beginPath()
  ctx.rect(db.x - pad, db.y - pad, db.w + pad * 2, db.h + pad * 2)
  ctx.clip()
  ctx.filter = `blur(${Math.max(8, Math.min(db.w, db.h) / 6)}px)`
  ctx.drawImage(
    canvas,
    db.x - pad,
    db.y - pad,
    db.w + pad * 2,
    db.h + pad * 2,
    db.x - pad,
    db.y - pad,
    db.w + pad * 2,
    db.h + pad * 2,
  )
  ctx.restore()
}

function applyMask(ctx, canvas, db, avatar) {
  ctx.save()
  roundRect(ctx, db.x, db.y, db.w, db.h, Math.min(18, db.w * 0.08))
  ctx.clip()
  if (avatar && avatar.complete && avatar.naturalWidth > 0) {
    const ia = avatar.naturalWidth / avatar.naturalHeight
    const ba = db.w / db.h
    let dw
    let dh
    let dx
    let dy
    if (ia > ba) {
      dh = db.h
      dw = dh * ia
      dx = db.x + (db.w - dw) / 2
      dy = db.y
    } else {
      dw = db.w
      dh = dw / ia
      dx = db.x
      dy = db.y + (db.h - dh) / 2
    }
    ctx.drawImage(avatar, dx, dy, dw, dh)
  } else {
    ctx.fillStyle = 'rgba(232, 58, 158, 0.55)'
    ctx.fillRect(db.x, db.y, db.w, db.h)
    ctx.fillStyle = '#fff'
    ctx.font = `900 ${Math.max(14, db.w * 0.14)}px 'Archivo Black', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('FLOXI', db.x + db.w / 2, db.y + db.h / 2)
  }
  ctx.restore()
}

function renderFrame(ctx, canvas, faces, target, mode, effect, avatar, t) {
  if (mode === 'selecting') {
    faces.forEach((f) => {
      const db = toDisplay(f, t)
      if (effect === 'pixelate') applyPixelate(ctx, canvas, db)
      else if (effect === 'blur') applyBlur(ctx, canvas, db)
      else applyMask(ctx, canvas, db, avatar)
    })
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(255, 45, 149, 0.95)'
    ctx.shadowColor = 'rgba(232, 58, 158, 0.8)'
    ctx.shadowBlur = 10
    faces.forEach((f) => {
      const db = toDisplay(f, t)
      roundRect(ctx, db.x, db.y, db.w, db.h, 12)
      ctx.stroke()
    })
    ctx.shadowBlur = 0
  } else if (target) {
    const db = toDisplay(target, t)
    if (effect === 'pixelate') applyPixelate(ctx, canvas, db)
    else if (effect === 'blur') applyBlur(ctx, canvas, db)
    else applyMask(ctx, canvas, db, avatar)
  }
}

export function usePrivacy(camera) {
  const { videoRef, state } = camera
  const canvasRef = useRef(null)

  const [privacyOn, setPrivacyOnState] = useState(() => loadPrivacy())
  const [effect, setEffectState] = useState(() => loadEffect())
  const [status, setStatus] = useState('idle')
  const [mode, setMode] = useState('off')
  const [detected, setDetected] = useState(0)

  const detectorRef = useRef(null)
  const targetRef = useRef(null)
  const facesRef = useRef([])
  const lostRef = useRef(0)
  const streakRef = useRef(0)
  const avatarRef = useRef(null)
  const readyRef = useRef(false)
  const modeRef = useRef(mode)
  const effectRef = useRef(effect)
  const detectedRef = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    effectRef.current = effect
  }, [effect])

  useEffect(() => {
    if (!avatarRef.current) {
      const img = new Image()
      img.src = '/floxi.png'
      avatarRef.current = img
    }
  }, [])

  const setPrivacyOn = useCallback((value) => {
    setPrivacyOnState(value)
    savePrivacy(value)
  }, [])

  const setEffect = useCallback((value) => {
    setEffectState(value)
    saveEffect(value)
  }, [])

  const clearTarget = useCallback(() => {
    targetRef.current = null
    lostRef.current = 0
    streakRef.current = 0
    setMode('selecting')
    sound.click()
  }, [])

  useEffect(() => {
    if (!privacyOn) {
      readyRef.current = false
      detectorRef.current = null
      setMode('off')
      setStatus('idle')
      return undefined
    }

    let cancelled = false
    setStatus('loading')
    setMode('selecting')
    targetRef.current = null

    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
        if (cancelled) return
        let detector = null
        try {
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 10,
            minDetectionConfidence: 0.5,
            minSuppressionThreshold: 0.3,
          })
        } catch {
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numFaces: 10,
            minDetectionConfidence: 0.5,
            minSuppressionThreshold: 0.3,
          })
        }
        if (cancelled) return
        detectorRef.current = detector
        readyRef.current = true
        setStatus('ready')
      } catch (err) {
        console.error('Privacy init error:', err)
        if (cancelled) return
        readyRef.current = false
        setStatus('error')
        setMode('off')
      }
    })()

    return () => {
      cancelled = true
      readyRef.current = false
      detectorRef.current = null
    }
  }, [privacyOn])

  useEffect(() => {
    if (!privacyOn || status !== 'ready' || state !== CAMERA_STATES.LIVE) return undefined

    let raf = 0
    let frame = 0

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const video = videoRef.current
      const canvas = canvasRef.current
      const detector = detectorRef.current
      if (!video || !canvas || !detector) return
      if (video.readyState < 2 || video.videoWidth === 0) return

      const srcW = video.videoWidth
      const srcH = video.videoHeight
      const dstW = Math.round(window.innerWidth)
      const dstH = Math.round(window.innerHeight)
      if (canvas.width !== dstW || canvas.height !== dstH) {
        canvas.width = dstW
        canvas.height = dstH
      }
      const ctx = canvas.getContext('2d')
      const t = cover(srcW, srcH, dstW, dstH)
      ctx.drawImage(video, 0, 0, srcW, srcH, t.dx, t.dy, srcW * t.scale, srcH * t.scale)

      frame += 1
      if (frame % 2 === 1) {
        let dets = null
        try {
          dets = detector.detectForVideo(video, performance.now())
        } catch {
          dets = null
        }
        const list = dets && dets.detections ? dets.detections : []
        facesRef.current = list.map((d, i) => sourceBox(d, srcW, srcH, i))

        const target = targetRef.current
        if (target) {
          const match = nearest(facesRef.current, target.cx, target.cy, target.w, target.h)
          if (match) {
            lostRef.current = 0
            streakRef.current += 1
            targetRef.current = match
            if (modeRef.current === 'lost' && streakRef.current >= REACQUIRE_STREAK) {
              setMode('tracking')
            }
          } else {
            streakRef.current = 0
            lostRef.current += 1
            if (modeRef.current !== 'lost' && lostRef.current > FRAMES_LOST) {
              setMode('lost')
            }
          }
        } else if (modeRef.current !== 'selecting' && modeRef.current !== 'off') {
          setMode('selecting')
        }

        if (facesRef.current.length !== detectedRef.current) {
          detectedRef.current = facesRef.current.length
          setDetected(detectedRef.current)
        }
      }

      renderFrame(ctx, canvas, facesRef.current, targetRef.current, modeRef.current, effectRef.current, avatarRef.current, t)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [privacyOn, status, state, videoRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!privacyOn || !canvas) return undefined

    const onPointerDown = (e) => {
      if (modeRef.current !== 'selecting') return
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      const srcW = video.videoWidth
      const srcH = video.videoHeight
      const t = cover(srcW, srcH, canvas.width, canvas.height)
      const px = e.clientX
      const py = e.clientY
      let best = null
      let bestD = Infinity
      for (const f of facesRef.current) {
        const db = toDisplay(f, t)
        const cx = db.x + db.w / 2
        const cy = db.y + db.h / 2
        const inflate = Math.max(20, Math.min(db.w, db.h) * 0.3)
        if (Math.abs(px - cx) <= db.w / 2 + inflate && Math.abs(py - cy) <= db.h / 2 + inflate) {
          const d = Math.hypot(px - cx, py - cy)
          if (d < bestD) {
            bestD = d
            best = f
          }
        }
      }
      if (best) {
        targetRef.current = { x: best.x, y: best.y, w: best.w, h: best.h, cx: best.cx, cy: best.cy }
        lostRef.current = 0
        streakRef.current = 0
        setMode('tracking')
        sound.click()
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    return () => canvas.removeEventListener('pointerdown', onPointerDown)
  }, [privacyOn, videoRef])

  return {
    privacyOn,
    setPrivacyOn,
    effect,
    setEffect,
    status,
    mode,
    detected,
    canvasRef,
    clearTarget,
  }
}

export default usePrivacy
