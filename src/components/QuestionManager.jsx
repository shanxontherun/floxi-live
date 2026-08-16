import { useEffect, useRef, useState } from 'react'
import { DEFAULT_QUESTIONS } from '../lib/questions'
import { resetQuestions } from '../lib/store'

function exportQuestions(questions) {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'floxi-questions.json'
  a.click()
  URL.revokeObjectURL(url)
}

function QuestionManager({ questions, used, onChange, onClearUsed, onClose }) {
  const [tab, setTab] = useState('truth')
  const [draft, setDraft] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editText, setEditText] = useState('')
  const fileRef = useRef(null)
  const listRef = useRef(null)

  const list = questions[tab]
  const usedList = used[tab]

  useEffect(() => {
    setDraft('')
    setEditingIndex(null)
  }, [tab])

  const addQuestion = () => {
    const text = draft.trim()
    if (!text) return
    const next = { ...questions, [tab]: [...questions[tab], text] }
    onChange(next)
    setDraft('')
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }

  const startEdit = (index) => {
    setEditingIndex(index)
    setEditText(list[index])
  }

  const saveEdit = () => {
    const text = editText.trim()
    if (!text || editingIndex === null) return
    const next = { ...questions, [tab]: questions[tab].map((q, i) => (i === editingIndex ? text : q)) }
    onChange(next)
    setEditingIndex(null)
  }

  const deleteQuestion = (index) => {
    const next = { ...questions, [tab]: questions[tab].filter((_, i) => i !== index) }
    onChange(next)
    setEditingIndex(null)
  }

  const handleImportFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const next = {
          truth: Array.isArray(parsed.truth) ? parsed.truth.map(String) : questions.truth,
          dare: Array.isArray(parsed.dare) ? parsed.dare.map(String) : questions.dare,
        }
        onChange(next)
        window.alert('Questions imported successfully')
      } catch {
        window.alert('Invalid JSON file. Expected: { "truth": [...], "dare": [...] }')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (!window.confirm('Reset all questions back to the default set?')) return
    resetQuestions()
    onChange({ ...DEFAULT_QUESTIONS })
  }

  const handleClearUsed = () => {
    if (!window.confirm('Clear all used questions so every question is available again?')) return
    onClearUsed()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addQuestion()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2 className="modal-title">QUESTION MANAGER</h2>
            <p className="modal-sub">Questions live in this browser only &middot; hidden in Stream Mode</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-tabs">
          <button
            type="button"
            className={`tab ${tab === 'truth' ? 'tab-active tab-truth' : ''}`}
            onClick={() => setTab('truth')}
          >
            TRUTH <span className="tab-count">{questions.truth.length}</span>
          </button>
          <button
            type="button"
            className={`tab ${tab === 'dare' ? 'tab-active tab-dare' : ''}`}
            onClick={() => setTab('dare')}
          >
            DARE <span className="tab-count">{questions.dare.length}</span>
          </button>
        </div>

        <div className="modal-add">
          <input
            className="modal-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add a new ${tab.toUpperCase()} question...`}
            maxLength={240}
          />
          <button className="btn-ghost" type="button" onClick={addQuestion}>
            ADD
          </button>
        </div>

        <div className="modal-list" ref={listRef}>
          {list.length === 0 && <p className="modal-empty">No {tab.toUpperCase()} questions yet. Add one above.</p>}
          {list.map((q, i) => {
            const isUsed = usedList.includes(q)
            const editing = editingIndex === i
            return (
              <div className={`qrow ${editing ? 'qrow-editing' : ''}`} key={`${i}-${q}`}>
                <span className="qrow-idx">{String(i + 1).padStart(2, '0')}</span>
                {editing ? (
                  <>
                    <textarea
                      className="modal-textarea"
                      rows={2}
                      value={editText}
                      maxLength={240}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <button className="qbtn qbtn-save" type="button" onClick={saveEdit}>
                      SAVE
                    </button>
                    <button className="qbtn" type="button" onClick={() => setEditingIndex(null)}>
                      CANCEL
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`qrow-text ${isUsed ? 'qrow-used' : ''}`}>{q}</p>
                    {isUsed && <span className="qrow-used-badge">USED</span>}
                    <button className="qbtn" type="button" onClick={() => startEdit(i)}>
                      EDIT
                    </button>
                    <button className="qbtn qbtn-del" type="button" onClick={() => deleteQuestion(i)}>
                      DELETE
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <footer className="modal-footer">
          <span className="modal-stats">
            {usedList.length} of {list.length} {tab.toUpperCase()} used
          </span>
          <div className="modal-actions">
            <button className="btn-ghost" type="button" onClick={() => fileRef.current.click()}>
              IMPORT
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button className="btn-ghost" type="button" onClick={() => exportQuestions(questions)}>
              EXPORT
            </button>
            <button className="btn-ghost btn-warn" type="button" onClick={handleReset}>
              RESET TO DEFAULT
            </button>
            <button className="btn-ghost btn-warn" type="button" onClick={handleClearUsed}>
              CLEAR USED
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default QuestionManager
