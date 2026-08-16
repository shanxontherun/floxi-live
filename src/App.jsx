import { useCallback, useEffect, useRef, useState } from 'react'
import { useCamera } from './hooks/useCamera'
import { useScale } from './hooks/useScale'
import { usePrivacy } from './hooks/usePrivacy'
import { loadQuestions, saveQuestions, loadUsed, saveUsed, loadSound, saveSound, loadStreamMode, saveStreamMode } from './lib/store'
import { sound } from './lib/sound'
import CameraLayer from './components/CameraLayer'
import TopBar from './components/TopBar'
import Hud from './components/Hud'
import QuestionManager from './components/QuestionManager'

const PHASE = { IDLE: 'idle', SPINNING: 'spinning', REVEALED: 'revealed' }
const SPIN_DURATION = 10000

function App() {
  const scale = useScale()
  const camera = useCamera()
  const privacy = usePrivacy(camera)

  const [questions, setQuestions] = useState(() => loadQuestions())
  const [used, setUsed] = useState(() => loadUsed())
  const [soundOn, setSoundOn] = useState(() => loadSound())
  const [streamMode, setStreamMode] = useState(() => loadStreamMode())
  const [gameOn, setGameOn] = useState(false)

  const [phase, setPhase] = useState(PHASE.IDLE)
  const [result, setResult] = useState(null)
  const [spinToken, setSpinToken] = useState(0)
  const [spinTarget, setSpinTarget] = useState(null)
  const [showManager, setShowManager] = useState(false)
  const [toast, setToast] = useState(null)

  const privacyReady = privacy.privacyOn && privacy.mode === 'tracking'
  const privacyBlocked = privacy.privacyOn && privacy.mode !== 'tracking'

  const toastTimer = useRef(null)
  const spinTimer = useRef(null)
  const pendingRef = useRef(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const gameRef = useRef(gameOn)
  gameRef.current = gameOn

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const persistQuestions = useCallback((q) => {
    setQuestions(q)
    saveQuestions(q)
  }, [])

  const persistUsed = useCallback((u) => {
    setUsed(u)
    saveUsed(u)
  }, [])

  const pickQuestion = useCallback((type, qs, us) => {
    const pool = qs[type]
    if (!pool || pool.length === 0) return null
    let usedList = us[type]
    let available = pool.filter((q) => !usedList.includes(q))
    let reshuffled = false
    if (available.length === 0) {
      usedList = []
      available = [...pool]
      reshuffled = true
    }
    const picked = available[Math.floor(Math.random() * available.length)]
    const nextUsed = { ...us, [type]: [...usedList, picked] }
    return { picked, nextUsed, reshuffled }
  }, [])

  const handleSpinEnd = useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    setResult({ type: pending.type, question: pending.question })
    setPhase(PHASE.REVEALED)
    sound.reveal()
  }, [])

  const handleSpin = useCallback(() => {
    if (phaseRef.current === PHASE.SPINNING || showManager) return
    if (!gameRef.current) return
    if (!privacyReady) {
      sound.click()
      showToast(privacy.privacyOn ? 'SELECT GUEST - CLICK ON A FACE' : 'GUEST PRIVACY REQUIRED - TURN IT ON FIRST')
      return
    }
    sound.ensure()

    let type = Math.random() < 0.5 ? 'truth' : 'dare'
    let chosen = pickQuestion(type, questions, used)
    if (!chosen) {
      const other = type === 'truth' ? 'dare' : 'truth'
      chosen = pickQuestion(other, questions, used)
      if (chosen) type = other
    }
    if (!chosen) {
      showToast('Add some questions in Settings first')
      return
    }

    sound.click()
    sound.spin()
    pendingRef.current = { type, question: chosen.picked }
    persistUsed(chosen.nextUsed)
    if (chosen.reshuffled) {
      showToast(`All ${type.toUpperCase()} questions used - starting over`)
    }
    setSpinTarget(type)
    setSpinToken((t) => t + 1)
    setResult(null)
    setPhase(PHASE.SPINNING)
    clearTimeout(spinTimer.current)
    spinTimer.current = setTimeout(() => {
      if (phaseRef.current === PHASE.SPINNING) {
        handleSpinEnd()
      }
    }, SPIN_DURATION)
  }, [questions, used, persistUsed, pickQuestion, showManager, showToast, handleSpinEnd, privacyReady, privacy.privacyOn])

  const handleClearUsed = useCallback(() => {
    persistUsed({ truth: [], dare: [] })
    showToast('Used questions cleared')
    sound.click()
  }, [persistUsed, showToast])

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v
      saveSound(next)
      sound.setEnabled(next)
      if (next) sound.click()
      return next
    })
  }, [])

  const toggleStreamMode = useCallback(() => {
    setStreamMode((v) => {
      const next = !v
      saveStreamMode(next)
      return next
    })
    sound.click()
  }, [])

  const toggleGame = useCallback(() => {
    sound.click()
    if (!gameOn && !privacy.privacyOn) {
      showToast('GUEST PRIVACY REQUIRED - TURN IT ON FIRST')
      return
    }
    if (gameOn) {
      setPhase(PHASE.IDLE)
      setResult(null)
      setSpinTarget(null)
    }
    setGameOn(!gameOn)
  }, [gameOn, privacy.privacyOn, showToast])

  const togglePrivacy = useCallback(() => {
    sound.click()
    if (privacy.privacyOn && gameOn) {
      showToast('TURN OFF TRUTH & DARE FIRST')
      return
    }
    privacy.setPrivacyOn(!privacy.privacyOn)
  }, [privacy, gameOn, showToast])

  useEffect(() => {
    sound.setEnabled(soundOn)
  }, [soundOn])

  useEffect(() => {
    if (phase !== PHASE.SPINNING) return
    let cancelled = false
    let delay = 90
    let elapsed = 0
    let timer = null
    const step = () => {
      if (cancelled) return
      elapsed += delay
      sound.tick(1 - elapsed / SPIN_DURATION)
      if (elapsed < SPIN_DURATION - 150) {
        delay = 90 + (elapsed / SPIN_DURATION) * 330
        timer = setTimeout(step, delay)
      }
    }
    timer = setTimeout(step, delay)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (typing) return
      if (e.code === 'Space') {
        e.preventDefault()
        handleSpin()
      } else if (e.code === 'KeyR') {
        handleClearUsed()
      } else if (e.code === 'Escape') {
        if (showManager) {
          setShowManager(false)
        } else if (streamMode) {
          setStreamMode(false)
          saveStreamMode(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSpin, handleClearUsed, showManager, streamMode])

  const spinRequest = { type: spinTarget, token: spinToken }

  return (
    <div className="app" style={{ '--scale': scale }}>
      <CameraLayer camera={camera} privacy={privacy} />
      <TopBar
        soundOn={soundOn}
        streamMode={streamMode}
        gameOn={gameOn}
        privacyOn={privacy.privacyOn}
        privacyMode={privacy.mode}
        effect={privacy.effect}
        onToggleSound={toggleSound}
        onToggleStreamMode={toggleStreamMode}
        onToggleGame={toggleGame}
        onTogglePrivacy={togglePrivacy}
        onSetEffect={privacy.setEffect}
        onReselectGuest={privacy.clearTarget}
        onOpenManager={() => {
          sound.click()
          setShowManager(true)
        }}
      />
      {gameOn && (
        <Hud
          phase={phase}
          result={result}
          spinRequest={spinRequest}
          onSpin={handleSpin}
          spinDuration={SPIN_DURATION}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
      {showManager && (
        <QuestionManager
          questions={questions}
          used={used}
          onChange={persistQuestions}
          onClearUsed={handleClearUsed}
          onClose={() => setShowManager(false)}
        />
      )}
      {privacyBlocked && gameOn && (
        <div className="gate-banner">
          {privacy.mode === 'selecting'
            ? 'GUEST PRIVACY REQUIRED - SELECT GUEST'
            : privacy.mode === 'lost'
              ? 'GUEST FACE NOT DETECTED - RESELECT GUEST'
              : 'GUEST PRIVACY REQUIRED'}
        </div>
      )}
    </div>
  )
}

export default App
