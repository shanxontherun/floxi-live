import { DEFAULT_QUESTIONS } from './questions'

const KEYS = {
  truthQuestions: 'floxi.questions.truth',
  dareQuestions: 'floxi.questions.dare',
  usedTruth: 'floxi.used.truth',
  usedDare: 'floxi.used.dare',
  sound: 'floxi.settings.sound',
  streamMode: 'floxi.settings.streamMode',
  effect: 'floxi.settings.effect',
  privacy: 'floxi.settings.privacy',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return fallback
    return parsed
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage may be unavailable (private mode); app still works in-memory
  }
}

export function loadQuestions() {
  return {
    truth: read(KEYS.truthQuestions, DEFAULT_QUESTIONS.truth),
    dare: read(KEYS.dareQuestions, DEFAULT_QUESTIONS.dare),
  }
}

export function saveQuestions(questions) {
  write(KEYS.truthQuestions, questions.truth)
  write(KEYS.dareQuestions, questions.dare)
}

export function resetQuestions() {
  saveQuestions({
    truth: [...DEFAULT_QUESTIONS.truth],
    dare: [...DEFAULT_QUESTIONS.dare],
  })
}

export function loadUsed() {
  return {
    truth: read(KEYS.usedTruth, []),
    dare: read(KEYS.usedDare, []),
  }
}

export function saveUsed(used) {
  write(KEYS.usedTruth, used.truth)
  write(KEYS.usedDare, used.dare)
}

export function loadSound() {
  return read(KEYS.sound, true)
}

export function saveSound(value) {
  write(KEYS.sound, value)
}

export function loadStreamMode() {
  return read(KEYS.streamMode, false)
}

export function saveStreamMode(value) {
  write(KEYS.streamMode, value)
}

export function loadEffect() {
  return read(KEYS.effect, 'pixelate')
}

export function saveEffect(value) {
  write(KEYS.effect, value)
}

export function loadPrivacy() {
  return read(KEYS.privacy, false)
}

export function savePrivacy(value) {
  write(KEYS.privacy, value)
}
