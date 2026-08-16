function BrandMark({ small = false }) {
  return (
    <div className={`brand ${small ? 'brand-small' : ''}`}>
      <img className="brand-avatar" src="/floxi.png" alt="Floxi" />
      <div className="brand-copy">
        <span className="brand-name">FLOXI LIVE</span>
        <span className="brand-tag">TRUTH OR DARE</span>
      </div>
    </div>
  )
}

function TopBar({
  soundOn,
  streamMode,
  gameOn,
  privacyOn,
  privacyMode,
  effect,
  onToggleSound,
  onToggleStreamMode,
  onToggleGame,
  onTogglePrivacy,
  onSetEffect,
  onReselectGuest,
  onOpenManager,
}) {
  const admin = !streamMode

  return (
    <header className="topbar">
      <BrandMark />

      <div className="topbar-right">
        {admin && (
          <>
            <button
              className={`mode-toggle ${gameOn ? 'active' : ''}`}
              type="button"
              onClick={onToggleGame}
              title="Toggle the Truth or Dare game"
              aria-label="Toggle Truth or Dare game"
            >
              TRUTH &amp; DARE
              <span className="tg-state">{gameOn ? 'ON' : 'OFF'}</span>
            </button>

            <button
              className={`privacy-toggle ${privacyOn ? 'active' : ''}`}
              type="button"
              onClick={onTogglePrivacy}
              title="Toggle guest face privacy"
              aria-label="Toggle guest privacy"
            >
              GUEST PRIVACY
              <span className="tg-state">{privacyOn ? 'ON' : 'OFF'}</span>
            </button>

            {privacyOn && (
              <>
                <div className="effect-select" role="group" aria-label="Privacy effect">
                  {['pixelate', 'blur', 'mask'].map((ef) => (
                    <button
                      key={ef}
                      type="button"
                      className={`effect-opt ${effect === ef ? 'active' : ''}`}
                      onClick={() => onSetEffect(ef)}
                      aria-label={`${ef} effect`}
                    >
                      {ef.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`select-guest-btn ${privacyMode === 'selecting' ? 'pulse' : ''}`}
                  onClick={onReselectGuest}
                  title={privacyMode === 'selecting' ? 'Click on a face to select the guest' : 'Choose a different guest'}
                  aria-label="Select or reselect guest"
                >
                  {privacyMode === 'selecting' ? 'SELECT GUEST' : 'RESELECT GUEST'}
                </button>
              </>
            )}
          </>
        )}

        <span className="live-pill">
          <span className="live-dot" />
          LIVE
        </span>

        <button
          className="icon-btn"
          type="button"
          onClick={onToggleSound}
          title={soundOn ? 'Sound on' : 'Sound off'}
          aria-label="Toggle sound"
        >
          {soundOn ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          )}
        </button>

        {!streamMode && (
          <button
            className="icon-btn"
            type="button"
            onClick={onOpenManager}
            title="Question manager"
            aria-label="Open question manager"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        <button
          className={`stream-btn ${streamMode ? 'stream-btn-active' : ''}`}
          type="button"
          onClick={onToggleStreamMode}
          title={streamMode ? 'Exit stream mode (Esc)' : 'Enable stream mode for OBS'}
          aria-label="Toggle stream mode"
        >
          {streamMode ? (
            <>
              <span className="live-dot" />
              STREAM MODE
            </>
          ) : (
            'STREAM MODE'
          )}
        </button>
      </div>
    </header>
  )
}

export default TopBar
