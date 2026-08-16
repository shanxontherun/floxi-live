import { CAMERA_STATES } from '../hooks/useCamera'

function StartOverlay({ state, errorMessage, onStart }) {
  return (
    <div className="start-overlay">
      <div className="start-content">
        <img className="start-avatar" src="/floxi.png" alt="Floxi" />
        <h1 className="start-name">FLOXI LIVE</h1>
        <p className="start-tag">TRUTH OR DARE &middot; A CHEEKY LITTLE LIVE SHOW</p>

        {state === CAMERA_STATES.REQUESTING ? (
          <div className="start-status">
            <span className="spinner" />
            <span className="start-status-text">ALLOWING CAMERA...</span>
          </div>
        ) : state === CAMERA_STATES.ERROR ? (
          <div className="start-status">
            <span className="start-status-text start-error">{errorMessage}</span>
            <div className="start-actions">
              <button className="btn-primary" type="button" onClick={onStart}>
                TRY AGAIN
              </button>
            </div>
            <p className="start-hint">You can still play the game with the camera off</p>
          </div>
        ) : (
          <>
            <button className="btn-primary" type="button" onClick={onStart}>
              START CAMERA
            </button>
            <p className="start-hint">YOUR WEBCAM IS THE SHOW</p>
          </>
        )}
      </div>
    </div>
  )
}

function PrivacyChip({ status, mode, clearTarget }) {
  if (status === 'loading') {
    return <div className="privacy-chip">LOADING PRIVACY...</div>
  }
  if (status === 'error') {
    return <div className="privacy-chip error">PRIVACY ENGINE ERROR &middot; TURN OFF PRIVACY</div>
  }
  if (status !== 'ready') return null
  if (mode === 'selecting') {
    return (
      <div className="privacy-chip selecting">
        <span className="live-dot" />
        SELECT GUEST &middot; CLICK ON A FACE
      </div>
    )
  }
  if (mode === 'lost') {
    return (
      <>
        <div className="privacy-chip warn">
          <span className="live-dot warn" />
          GUEST FACE NOT DETECTED
        </div>
        <button className="reselect-btn" type="button" onClick={clearTarget}>
          RESELECT GUEST
        </button>
      </>
    )
  }
  return (
    <div className="privacy-chip">
      <span className="live-dot ok" />
      GUEST HIDDEN
    </div>
  )
}

function CameraLayer({ camera, privacy }) {
  const { videoRef, state, errorMessage, start } = camera
  const { canvasRef, privacyOn, status, mode, clearTarget } = privacy

  return (
    <div className="camera">
      <video
        ref={videoRef}
        className={`video ${privacyOn ? 'video-hidden' : ''}`}
        playsInline
        muted
        autoPlay
        aria-label="Floxi live camera"
      />
      {privacyOn && <canvas ref={canvasRef} className="privacy-canvas" aria-hidden="true" />}
      {privacyOn && <PrivacyChip status={status} mode={mode} clearTarget={clearTarget} />}
      {state !== CAMERA_STATES.LIVE && (
        <StartOverlay state={state} errorMessage={errorMessage} onStart={start} />
      )}
      <div className="scrim" />
      <div className="scene-frame" />
    </div>
  )
}

export default CameraLayer
