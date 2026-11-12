const STORAGE_VERSION = 2
const STORAGE_KEY = 'quizPortal:v2'

const STORAGE_KEYS = {
  appState: STORAGE_KEY,
  quizzes: 'quizPortal:quizzes',
  attempts: 'quizPortal:attempts',
  profile: 'quizPortal:profile',
  users: 'quizPortal:users',
  currentUser: 'quizPortal:currentUser',
}

export const defaultProfile = {
  name: 'Ava Johnson',
  email: 'student@demo.com',
  institution: 'Northview Academy',
  role: 'student',
}

export const defaultUsers = [
  {
    id: 'student-demo',
    name: 'Ava Johnson',
    email: 'student@demo.com',
    password: 'demo123',
    role: 'student',
  },
  {
    id: 'admin-demo',
    name: 'Instructor Admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
  },
]

export const seededQuizzes = [
  {
    id: 'javascript-basics',
    title: 'JavaScript Basics',
    description: 'A quick test of core syntax, variables, and logic in JavaScript.',
    category: 'Programming',
    duration: 600,
    questions: [
      {
        id: 'js-1',
        type: 'single',
        category: 'Variables',
        prompt: 'Which keyword is used to declare a block-scoped variable in JavaScript?',
        options: ['var', 'let', 'const', 'function'],
        correctAnswer: ['let'],
      },
      {
        id: 'js-2',
        type: 'multi',
        category: 'Arrays',
        prompt: 'Select all valid primitive data types in JavaScript.',
        options: ['String', 'Object', 'Number', 'Boolean', 'Array'],
        correctAnswer: ['String', 'Number', 'Boolean'],
      },
      {
        id: 'js-3',
        type: 'single',
        category: 'Functions',
        prompt: 'Which method is used to add an element at the end of an array?',
        options: ['push()', 'shift()', 'unshift()', 'slice()'],
        correctAnswer: ['push()'],
      },
      {
        id: 'js-4',
        type: 'truefalse',
        category: 'Logic',
        prompt: 'The strict equality operator compares both value and type.',
        options: ['True', 'False'],
        correctAnswer: ['True'],
      },
    ],
  },
  {
    id: 'world-history',
    title: 'World History',
    description: 'Explore key events, transformations, and civilizations across history.',
    category: 'Humanities',
    duration: 540,
    questions: [
      {
        id: 'history-1',
        type: 'single',
        category: 'Ancient World',
        prompt: 'Which ancient civilization built Machu Picchu?',
        options: ['Roman Empire', 'Maya', 'Inca', 'Ottoman Empire'],
        correctAnswer: ['Inca'],
      },
      {
        id: 'history-2',
        type: 'truefalse',
        category: 'Industrial Era',
        prompt: 'The Industrial Revolution began in Great Britain.',
        options: ['True', 'False'],
        correctAnswer: ['True'],
      },
      {
        id: 'history-3',
        type: 'multi',
        category: 'World Wars',
        prompt: 'Select the countries that were part of the Allied Powers in World War II.',
        options: ['United Kingdom', 'Germany', 'France', 'Japan', 'United States'],
        correctAnswer: ['United Kingdom', 'France', 'United States'],
      },
      {
        id: 'history-4',
        type: 'single',
        category: 'Modern History',
        prompt: 'Who was the first president of the United States?',
        options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
        correctAnswer: ['George Washington'],
      },
    ],
  },
  {
    id: 'science-essentials',
    title: 'Science Essentials',
    description: 'Fundamental concepts in earth science, physics, and biology.',
    category: 'Science',
    duration: 660,
    questions: [
      {
        id: 'science-1',
        type: 'single',
        category: 'Physics',
        prompt: 'What is the unit of electrical resistance?',
        options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
        correctAnswer: ['Ohm'],
      },
      {
        id: 'science-2',
        type: 'single',
        category: 'Biology',
        prompt: 'Which part of the cell contains genetic material?',
        options: ['Ribosome', 'Nucleus', 'Membrane', 'Cytoplasm'],
        correctAnswer: ['Nucleus'],
      },
      {
        id: 'science-3',
        type: 'multi',
        category: 'Earth Science',
        prompt: 'Select the three main rock types.',
        options: ['Igneous', 'Sedimentary', 'Metamorphic', 'Volcanic', 'Mineral'],
        correctAnswer: ['Igneous', 'Sedimentary', 'Metamorphic'],
      },
      {
        id: 'science-4',
        type: 'truefalse',
        category: 'Chemistry',
        prompt: 'Water boils at 100°C at sea level.',
        options: ['True', 'False'],
        correctAnswer: ['True'],
      },
    ],
  },
]

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function safeStorageRead(key, fallback) {
  if (!hasStorage()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error)
    return fallback
  }
}

function safeStorageWrite(key, value) {
  if (!hasStorage()) return false

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error)
    return false
  }
}

function normalizeRecordList(records) {
  if (!Array.isArray(records)) return { byId: {}, allIds: [] }

  const byId = {}
  const allIds = []

  records.forEach((record) => {
    if (!record || typeof record !== 'object') return
    const id = record.id
    if (!id) return

    byId[id] = record
    allIds.push(id)
  })

  return {
    byId,
    allIds: [...new Set(allIds)],
  }
}

function createDefaultState() {
  return {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    collections: {
      quizzes: normalizeRecordList(seededQuizzes),
      attempts: normalizeRecordList([]),
      users: normalizeRecordList(defaultUsers),
    },
    profile: defaultProfile,
    currentUser: null,
  }
}

function migrateLegacyState() {
  const state = createDefaultState()

  const legacyQuizzes = safeStorageRead(STORAGE_KEYS.quizzes, [])
  const legacyAttempts = safeStorageRead(STORAGE_KEYS.attempts, [])
  const legacyUsers = safeStorageRead(STORAGE_KEYS.users, defaultUsers)
  const legacyProfile = safeStorageRead(STORAGE_KEYS.profile, defaultProfile)
  const legacyCurrentUser = safeStorageRead(STORAGE_KEYS.currentUser, null)

  if (Array.isArray(legacyQuizzes) && legacyQuizzes.length) {
    state.collections.quizzes = normalizeRecordList(legacyQuizzes)
  }

  if (Array.isArray(legacyAttempts)) {
    state.collections.attempts = normalizeRecordList(legacyAttempts)
  }

  if (Array.isArray(legacyUsers) && legacyUsers.length) {
    state.collections.users = normalizeRecordList(legacyUsers)
  }

  state.profile = legacyProfile && typeof legacyProfile === 'object' ? legacyProfile : defaultProfile
  state.currentUser = legacyCurrentUser && typeof legacyCurrentUser === 'object' ? legacyCurrentUser : null

  safeStorageWrite(STORAGE_KEYS.appState, state)
  return state
}

function loadState() {
  const rawState = safeStorageRead(STORAGE_KEYS.appState, null)

  if (!rawState || typeof rawState !== 'object') {
    return migrateLegacyState()
  }

  if (rawState.version !== STORAGE_VERSION) {
    return migrateLegacyState()
  }

  const nextState = {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    collections: {
      quizzes: normalizeRecordList(Array.isArray(rawState.collections?.quizzes?.allIds)
        ? rawState.collections.quizzes.allIds.map((id) => rawState.collections.quizzes.byId?.[id]).filter(Boolean)
        : rawState.collections?.quizzes?.byId
          ? Object.values(rawState.collections.quizzes.byId)
          : []),
      attempts: normalizeRecordList(Array.isArray(rawState.collections?.attempts?.allIds)
        ? rawState.collections.attempts.allIds.map((id) => rawState.collections.attempts.byId?.[id]).filter(Boolean)
        : rawState.collections?.attempts?.byId
          ? Object.values(rawState.collections.attempts.byId)
          : []),
      users: normalizeRecordList(Array.isArray(rawState.collections?.users?.allIds)
        ? rawState.collections.users.allIds.map((id) => rawState.collections.users.byId?.[id]).filter(Boolean)
        : rawState.collections?.users?.byId
          ? Object.values(rawState.collections.users.byId)
          : []),
    },
    profile: rawState.profile && typeof rawState.profile === 'object' ? rawState.profile : defaultProfile,
    currentUser: rawState.currentUser && typeof rawState.currentUser === 'object' ? rawState.currentUser : null,
  }

  return nextState
}

function persistState(state) {
  const nextState = {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    collections: {
      quizzes: normalizeRecordList(state.collections?.quizzes ? Object.values(state.collections.quizzes.byId || {}) : []),
      attempts: normalizeRecordList(state.collections?.attempts ? Object.values(state.collections.attempts.byId || {}) : []),
      users: normalizeRecordList(state.collections?.users ? Object.values(state.collections.users.byId || {}) : []),
    },
    profile: state.profile || defaultProfile,
    currentUser: state.currentUser || null,
  }

  return safeStorageWrite(STORAGE_KEYS.appState, nextState)
}

export function getQuizzes() {
  return loadState().collections.quizzes.allIds.map((id) => loadState().collections.quizzes.byId[id]).filter(Boolean)
}

export function saveQuizzes(quizzes) {
  const state = loadState()
  state.collections.quizzes = normalizeRecordList(quizzes)
  state.updatedAt = Date.now()
  return persistState(state)
}

export function getAttempts() {
  return loadState().collections.attempts.allIds.map((id) => loadState().collections.attempts.byId[id]).filter(Boolean)
}

export function saveAttempts(attempts) {
  const state = loadState()
  state.collections.attempts = normalizeRecordList(attempts)
  state.updatedAt = Date.now()
  return persistState(state)
}

export function getProfile() {
  return loadState().profile || defaultProfile
}

export function saveProfile(profile) {
  const state = loadState()
  state.profile = profile || defaultProfile
  state.updatedAt = Date.now()
  return persistState(state)
}

export function getUsers() {
  return loadState().collections.users.allIds.map((id) => loadState().collections.users.byId[id]).filter(Boolean)
}

export function saveUsers(users) {
  const state = loadState()
  state.collections.users = normalizeRecordList(users)
  state.updatedAt = Date.now()
  return persistState(state)
}

export function getCurrentUser() {
  return loadState().currentUser
}

export function saveCurrentUser(user) {
  const state = loadState()
  state.currentUser = user || null
  state.updatedAt = Date.now()
  return persistState(state)
}

export function seedStorageIfNeeded() {
  const state = loadState()

  if (!Array.isArray(state.collections.quizzes.allIds) || state.collections.quizzes.allIds.length === 0) {
    state.collections.quizzes = normalizeRecordList(seededQuizzes)
  }

  if (!Array.isArray(state.collections.users.allIds) || state.collections.users.allIds.length === 0) {
    state.collections.users = normalizeRecordList(defaultUsers)
  }

  if (!state.profile || !state.profile.name) {
    state.profile = defaultProfile
  }

  if (!state.collections.attempts || !Array.isArray(state.collections.attempts.allIds)) {
    state.collections.attempts = normalizeRecordList([])
  }

  state.updatedAt = Date.now()
  return persistState(state)
}
