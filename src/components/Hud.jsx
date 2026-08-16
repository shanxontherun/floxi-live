import Wheel from './Wheel'

function ResultPanel({ phase, result }) {
  if (phase === 'revealed' && result) {
    return (
      <div className="result-panel">
        <span className={`result-badge anim-pop result-badge-${result.type}`}>
          {result.type.toUpperCase()}
        </span>
        <p className="question-text anim-rise" key={result.question}>
          {result.question}
        </p>
        <span className="result-hint">SPIN AGAIN &middot; PRESS SPACE</span>
      </div>
    )
  }

  if (phase === 'spinning') {
    return (
      <div className="result-panel result-panel-idle">
        <span className="result-badge result-badge-dim">TRUTH or DARE</span>
        <p className="idle-title spinning-title">
          <span className="shimmer">THE WHEEL DECIDES...</span>
        </p>
        <span className="result-hint">GET READY TO WIN SOMETHING EMBARRASSING</span>
      </div>
    )
  }

  return (
    <div className="result-panel result-panel-idle">
      <span className="result-badge result-badge-dim">TRUTH or DARE</span>
      <p className="idle-title">
        READY<span className="idle-q">?</span>
      </p>
      <span className="idle-sub">SPIN THE WHEEL</span>
    </div>
  )
}

function Hud({ phase, result, spinRequest, onSpin, spinDuration }) {
  return (
    <footer className="hud">
      <div className="hud-left hud-zone">
        <div className="hud-brand">
          <img className="brand-avatar" src="/floxi.png" alt="Floxi" />
          <div className="brand-copy">
            <span className="brand-name">FLOXI LIVE</span>
            <span className="brand-tag">TRUTH OR DARE</span>
          </div>
        </div>
      </div>

      <div className="hud-center hud-zone">
        <Wheel
          spinRequest={spinRequest}
          spinning={phase === 'spinning'}
          spinDuration={spinDuration}
          onSpin={onSpin}
        />
      </div>

      <div className="hud-right hud-zone">
        <ResultPanel phase={phase} result={result} />
      </div>
    </footer>
  )
}

export default Hud
