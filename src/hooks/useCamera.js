import { useEffect, useRef, useState, useCallback } from 'react'

export const CAMERA_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  LIVE: 'live',
  ERROR: 'error',
}

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState(CAMERA_STATES.IDLE)
  const [errorMessage, setErrorMessage] = useState('')

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const start = useCallback(async () => {
    setState(CAMERA_STATES.REQUESTING)
    setErrorMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setState(CAMERA_STATES.LIVE)
    } catch (err) {
      console.error('Camera error:', err)
      let msg = 'Camera unavailable'
      if (err && err.name === 'NotAllowedError') {
        msg = 'Camera permission was blocked'
      } else if (err && err.name === 'NotFoundError') {
        msg = 'No camera found on this device'
      }
      setErrorMessage(msg)
      setState(CAMERA_STATES.ERROR)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return { videoRef, state, errorMessage, start, stop }
}
