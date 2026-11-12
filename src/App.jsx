
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileDown,
  FileUp,
  GraduationCap,
  ListChecks,
  LogOut,
  Pencil,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  defaultProfile,
  getAttempts,
  getCurrentUser,
  getProfile,
  getQuizzes,
  getUsers,
  saveAttempts,
  saveCurrentUser,
  saveProfile,
  saveQuizzes,
  saveUsers,
  seedStorageIfNeeded,
} from './storageService'

const EMPTY_QUESTION = (type = 'single') => ({
  id: `q-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  type,
  category: 'General',
  prompt: '',
  options: type === 'truefalse' ? ['True', 'False'] : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  correctAnswer: [],
})

const createEmptyQuizForm = () => ({
  id: '',
  title: '',
  description: '',
  category: 'General',
  duration: 600,
  questions: [EMPTY_QUESTION('single')],
})

const formatSeconds = (totalSeconds) => {
  const numericSeconds = Number(totalSeconds) || 0
  const minutes = Math.floor(numericSeconds / 60)
  const seconds = numericSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeQuestion = (question) => ({
  ...question,
  id: question.id || `q-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  type: question.type || 'single',
  category: question.category || 'General',
  prompt: String(question.prompt || '').trim(),
  options: (question.options || []).map((option) => String(option).trim()).filter(Boolean),
  correctAnswer: Array.isArray(question.correctAnswer)
    ? question.correctAnswer.map((item) => String(item).trim()).filter(Boolean)
    : String(question.correctAnswer || '').trim()
      ? [String(question.correctAnswer).trim()]
      : [],
})

const getAttemptDate = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently')

function AnalyticsChart({ data }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
        No analytics yet.
      </div>
    )
  }

  const width = 320
  const height = 160
  const maxScore = Math.max(...data.map((entry) => Number(entry.percentage || 0)), 100)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {data.map((entry, index) => {
        const x = 18 + index * 42
        const barHeight = (Number(entry.percentage || 0) / maxScore) * 90
        const y = height - 24 - barHeight
        return (
          <g key={`bar-${entry.id || index}`}>
            <rect x={x} y={y} width={24} height={barHeight} rx={8} fill="url(#chartGradient)" opacity={0.95} />
            <text x={x + 12} y={height - 8} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {index + 1}
            </text>
          </g>
        )
      })}
      <polyline
        fill="none"
        stroke="#f8fafc"
        strokeWidth="2"
        points={data
          .map((entry, index) => {
            const x = 30 + index * 42
            const y = height - 24 - ((Number(entry.percentage || 0) / maxScore) * 90)
            return `${x},${y}`
          })
          .join(' ')}
      />
      {data.map((entry, index) => {
        const x = 30 + index * 42
        const y = height - 24 - ((Number(entry.percentage || 0) / maxScore) * 90)
        return <circle key={`dot-${entry.id || index}`} cx={x} cy={y} r="3.5" fill="#f8fafc" />
      })}
    </svg>
  )
}

function CategoryAnalyticsChart({ data }) {
  if (!data.length) {
    return <div className="rounded-2xl border border-dashed ...">No category data yet.</div>
  }

  const maxValue = Math.max(...data.map((entry) => entry.value), 1)

  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <div key={entry.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{entry.label}</span>
            <span className="text-slate-400">{entry.value}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700"
              style={{ width: `${(entry.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function GradeDistributionChart({ data }) {
  const distribution = [
    { label: 'A', range: '80-100', value: data.filter((entry) => entry >= 80).length },
    { label: 'B', range: '60-79', value: data.filter((entry) => entry >= 60 && entry < 80).length },
    { label: 'C', range: '40-59', value: data.filter((entry) => entry >= 40 && entry < 60).length },
    { label: 'D', range: '<40', value: data.filter((entry) => entry < 40).length },
  ]

  const maxValue = Math.max(...distribution.map((entry) => entry.value), 1)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {distribution.map((entry) => (
        <div key={entry.label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-center">
          <div className="mb-2 h-16 overflow-hidden rounded-xl bg-slate-900 p-1">
            <div
              className="flex h-full items-end justify-center rounded-lg bg-gradient-to-t from-cyan-500 via-violet-500 to-indigo-400 transition-all duration-700"
              style={{ height: `${(entry.value / maxValue) * 100}%` }}
            >
              <span className="mb-2 text-xs font-semibold text-white">{entry.value}</span>
            </div>
          </div>
          <p className="text-lg font-bold text-white">{entry.label}</p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">{entry.range}</p>
        </div>
      ))}
    </div>
  )
}

function AppShell({ authUser, profile, onLogout, children }) {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/quizzes', label: 'Quizzes', icon: BookOpen },
  ]

  if (authUser?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: ShieldCheck })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[28px] border border-slate-800 bg-slate-900/80 p-4 shadow-glow backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-2.5 shadow-lg shadow-cyan-500/20">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Insight Academy</p>
                <h1 className="text-2xl font-semibold text-white">Online Quiz Portal</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 p-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <a
                    key={to}
                    href={to}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      window.location.pathname === to ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-semibold text-white">
                  {authUser?.name?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{authUser?.name || profile?.name}</p>
                  <p className="truncate text-xs text-slate-400">{authUser?.role || profile?.role || 'student'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500/60"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}

function AuthPage({ authView, onAuthViewChange, authForm, setAuthForm, onSubmit }) {
  const isSignup = authView.endsWith('-signup')
  const isAdmin = authView.startsWith('admin-')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-[30px] border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-3 text-white shadow-lg shadow-cyan-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Insight Academy</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Quiz Portal</h1>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-slate-700 bg-slate-800 p-1">
          {[
            { view: 'student-login', label: 'Student Sign In' },
            { view: 'admin-login', label: 'Admin Sign In' },
            { view: 'student-signup', label: 'Student Account' },
            { view: 'admin-signup', label: 'Admin Account' },
          ].map(({ view, label }) => (
            <button
              key={view}
              type="button"
              onClick={() => onAuthViewChange(view)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                authView === view ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <label className="block text-sm text-slate-300">
              Full name
              <input
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                placeholder="Jane Smith"
              />
            </label>
          )}

          {isSignup && isAdmin && (
            <label className="block text-sm text-slate-300">
              Institution or organization
              <input
                value={authForm.institution}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, institution: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                placeholder="Insight Academy"
                required
              />
            </label>
          )}

          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
              placeholder="student@demo.com"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
              placeholder="Enter password"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30"
          >
            {isSignup ? 'Create Account' : `Sign In as ${isAdmin ? 'Admin' : 'Student'}`}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-300">
          <p className="mb-2 font-medium text-white">Demo accounts</p>
          <div className="space-y-2">
            <p>Student: student@demo.com / demo123</p>
            <p>Admin: admin@demo.com / admin123</p>
          </div>
          {isAdmin && isSignup && (
            <p className="mt-3 text-xs text-amber-200">
              Admin registration is stored in this browser and is intended for demonstration use.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardPage({ userAttempts, quizzes, authUser, profile, onStartQuiz }) {
  const recentAttempts = [...userAttempts].slice(0, 5)
  const averageScore = userAttempts.length
    ? Math.round(userAttempts.reduce((sum, entry) => sum + Number(entry.percentage || 0), 0) / userAttempts.length)
    : 0
  const bestScore = userAttempts.length ? Math.max(...userAttempts.map((entry) => Number(entry.percentage || 0))) : 0

  const categoryBreakdown = useMemo(() => {
    const totals = {}

    userAttempts.forEach((attempt) => {
      const label = attempt.category || 'General'
      totals[label] = (totals[label] || 0) + 1
    })

    return Object.entries(totals)
      .map(([label, value]) => ({ label, value: Math.round((value / Math.max(userAttempts.length, 1)) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [userAttempts])

  const gradeDistribution = useMemo(
    () => userAttempts.map((attempt) => Number(attempt.percentage || 0)),
    [userAttempts],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface animate-fade-up p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Attempts</span>
            <Target className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{userAttempts.length}</p>
        </div>

        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Average Score</span>
            <BarChart3 className="h-5 w-5 text-violet-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{averageScore}%</p>
        </div>

        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Best Result</span>
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{bestScore}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '220ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Performance</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Recent analytics</h2>
            </div>
          </div>
          <AnalyticsChart data={userAttempts.slice(0, 7).reverse()} />
        </div>

        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '260ms' }}>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Student</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-lg font-semibold text-white shadow-lg shadow-cyan-600/30">
              {authUser?.name?.charAt(0) || profile?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{authUser?.name || profile?.name}</p>
              <p className="text-sm text-slate-400">{authUser?.email || profile?.email}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-3 py-2">
              <span>Institution</span>
              <span className="font-medium text-white">{profile?.institution || 'Northview Academy'}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-3 py-2">
              <span>Role</span>
              <span className="font-medium text-white">{authUser?.role || 'student'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '300ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Insights</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Category performance</h2>
            </div>
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <CategoryAnalyticsChart data={categoryBreakdown} />
        </div>

        <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '340ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Distribution</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Grade ranges</h2>
            </div>
            <BarChart3 className="h-5 w-5 text-cyan-400" />
          </div>
          <GradeDistributionChart data={gradeDistribution} />
        </div>
      </div>

      <div className="card-surface animate-fade-up p-5" style={{ animationDelay: '380ms' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">History</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Recent attempts</h2>
          </div>
          <button
            type="button"
            onClick={() => onStartQuiz(quizzes[0])}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Start a quiz
          </button>
        </div>

        {recentAttempts.length ? (
          <div className="space-y-3">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{attempt.quizTitle}</p>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-300">
                      {attempt.category || 'General'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{getAttemptDate(attempt.submittedAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{attempt.percentage}%</p>
                    <p className="text-xs text-slate-400">{attempt.score}/{attempt.totalQuestions}</p>
                  </div>
                  <a
                    href={`/results/${attempt.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500/60"
                  >
                    View result
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400">
            No attempts yet. Pick a quiz and start learning.
          </div>
        )}
      </div>
    </div>
  )
}

function QuizCatalogPage({ quizzes, categoryFilter, setCategoryFilter, searchTerm, setSearchTerm, onStartQuiz }) {
  const categories = ['All', ...new Set(quizzes.map((quiz) => quiz.category).filter(Boolean))]
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = categoryFilter === 'All' || quiz.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Explore</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Quiz library</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500 sm:w-52"
                placeholder="Search quizzes"
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuizzes.length ? (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan-500/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{quiz.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{quiz.title}</h3>
                </div>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">
                  {quiz.questions.length} Qs
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-300">{quiz.description}</p>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {formatSeconds(quiz.duration)}</span>
                <span className="inline-flex items-center gap-2"><ListChecks className="h-4 w-4" /> {quiz.questions.length} questions</span>
              </div>

              <button
                type="button"
                onClick={() => onStartQuiz(quiz)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Start quiz
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-8 text-center text-slate-400">
            No quizzes match your current search and category filter.
          </div>
        )}
      </div>
    </div>
  )
}

function QuizAttemptPage({ quiz, authUser, profile, attemptHistory, setAttemptHistory, onCompleteAttempt }) {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerMap, setAnswerMap] = useState({})
  const [markedReview, setMarkedReview] = useState({})
  const [timeLeft, setTimeLeft] = useState(quiz?.duration || 600)

  useEffect(() => {
    if (!quiz) return
    setCurrentIndex(0)
    setAnswerMap({})
    setMarkedReview({})
    setTimeLeft(Number(quiz.duration || 600))
  }, [quiz])

  useEffect(() => {
    if (!quiz) return

    if (timeLeft <= 0) {
      submitAttempt()
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [quiz, timeLeft])

  if (!quiz) {
    return <Navigate to="/quizzes" replace />
  }

  const currentQuestion = quiz.questions[currentIndex]
  const currentSelections = answerMap[currentQuestion.id] || []

  const submitAttempt = () => {
    const score = quiz.questions.reduce((total, question) => {
      const selectedValues = answerMap[question.id] || []
      const normalizedSelected = Array.isArray(selectedValues) ? selectedValues : [selectedValues].filter(Boolean)
      const normalizedCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer].filter(Boolean)
      const isCorrect =
        normalizedCorrect.length === normalizedSelected.length &&
        normalizedCorrect.every((answer) => normalizedSelected.includes(answer)) &&
        normalizedSelected.every((answer) => normalizedCorrect.includes(answer))

      return total + (isCorrect ? 1 : 0)
    }, 0)

    const totalQuestions = quiz.questions.length
    const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0
    const breakdown = quiz.questions.map((question) => {
      const selectedValues = answerMap[question.id] || []
      const normalizedSelected = Array.isArray(selectedValues) ? selectedValues : [selectedValues].filter(Boolean)
      const normalizedCorrect = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer].filter(Boolean)
      const isCorrect =
        normalizedCorrect.length === normalizedSelected.length &&
        normalizedCorrect.every((answer) => normalizedSelected.includes(answer)) &&
        normalizedSelected.every((answer) => normalizedCorrect.includes(answer))

      return {
        id: question.id,
        prompt: question.prompt,
        selected: normalizedSelected,
        correct: normalizedCorrect,
        isCorrect,
      }
    })

    const record = {
      id: `${quiz.id}-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      percentage,
      score,
      totalQuestions,
      correctAnswers: score,
      incorrectAnswers: totalQuestions - score,
      submittedAt: new Date().toISOString(),
      userEmail: authUser?.email || profile.email || 'guest@local.test',
      userName: authUser?.name || profile.name || 'Student',
      breakdown,
    }

    const nextAttempts = [record, ...getAttempts()]
    saveAttempts(nextAttempts)
    setAttemptHistory(nextAttempts)
    onCompleteAttempt(record)
    navigate(`/results/${record.id}`)
  }

  const handleChoiceToggle = (question, option) => {
    const currentSelection = answerMap[question.id] || []

    if (question.type === 'single' || question.type === 'truefalse') {
      setAnswerMap((prev) => ({ ...prev, [question.id]: [option] }))
      return
    }

    const nextSelection = currentSelection.includes(option)
      ? currentSelection.filter((item) => item !== option)
      : [...currentSelection, option]

    setAnswerMap((prev) => ({ ...prev, [question.id]: nextSelection }))
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-glow">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Assessment</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{quiz.title}</h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-amber-200">
          <Clock3 className="h-4 w-4" />
          <span className="text-lg font-semibold">{formatSeconds(timeLeft)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">Questions</h3>
            <span className="text-xs text-slate-400">{quiz.questions.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 xl:grid-cols-4">
            {quiz.questions.map((question, index) => {
              const isAnswered = answerMap[question.id]?.length > 0
              const isMarked = markedReview[question.id]
              const isActive = currentIndex === index

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200'
                      : isAnswered
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : isMarked
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Question {currentIndex + 1}</p>
              <p className="mt-1 text-sm text-cyan-300">{currentQuestion.category}</p>
            </div>
            <button
              type="button"
              onClick={() => setMarkedReview((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                markedReview[currentQuestion.id]
                  ? 'bg-amber-500 text-slate-950'
                  : 'border border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              {markedReview[currentQuestion.id] ? 'Marked' : 'Mark for review'}
            </button>
          </div>

          <h3 className="text-xl font-semibold text-white">{currentQuestion.prompt}</h3>

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const checked = currentSelections.includes(option)

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    checked ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <input
                    type={currentQuestion.type === 'multi' ? 'checkbox' : 'radio'}
                    checked={checked}
                    onChange={() => handleChoiceToggle(currentQuestion, option)}
                    className="h-4 w-4 accent-cyan-500"
                  />
                  <span>{option}</span>
                </label>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, quiz.questions.length - 1))}
                disabled={currentIndex === quiz.questions.length - 1}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <button
              type="button"
              onClick={submitAttempt}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Submit quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsPage({ attemptId, attemptHistory, onPrintResult }) {
  const result = attemptHistory.find((attempt) => attempt.id === attemptId)

  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-8 text-center text-slate-400">
        Result not found.
      </div>
    )
  }

  const award = result.percentage >= 80 ? 'Excellent' : result.percentage >= 60 ? 'Good Work' : 'Keep Learning'

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="certificate-card rounded-[30px] border border-slate-800 bg-slate-900/80 p-6 shadow-glow print:border-slate-300 print:bg-white print:text-slate-900">
        <div className="flex flex-col gap-4 print:flex-row print:items-center print:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 print:text-cyan-700">Certificate of Achievement</p>
            <h2 className="mt-1 text-3xl font-bold text-white print:text-slate-900">{result.quizTitle}</h2>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-200 shadow-lg shadow-emerald-500/10 print:text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-lg font-semibold">{award}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-slate-50">
            <p className="text-sm text-slate-400 print:text-slate-600">Final Score</p>
            <p className="mt-2 text-2xl font-bold text-white print:text-slate-900">{result.percentage}%</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-slate-50">
            <p className="text-sm text-slate-400 print:text-slate-600">Correct</p>
            <p className="mt-2 text-2xl font-bold text-white print:text-slate-900">{result.correctAnswers}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-slate-50">
            <p className="text-sm text-slate-400 print:text-slate-600">Incorrect</p>
            <p className="mt-2 text-2xl font-bold text-white print:text-slate-900">{result.incorrectAnswers}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 print:border-slate-300 print:bg-slate-50">
            <p className="text-sm text-slate-400 print:text-slate-600">Submitted</p>
            <p className="mt-2 text-sm font-medium text-white print:text-slate-900">{getAttemptDate(result.submittedAt)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-cyan-500/40 bg-slate-950/50 p-4 print:border-slate-300 print:bg-slate-50">
          <p className="text-sm text-slate-300 print:text-slate-700">This certificate confirms that</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-2xl font-semibold text-white print:text-slate-900">{result.userName}</p>
            <div className="text-right text-sm text-slate-400 print:text-slate-600">
              <p>Category: {result.category || 'General'}</p>
              <p>Assessment ID: {result.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 no-print">
          <button
            type="button"
            onClick={onPrintResult}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            <Printer className="h-4 w-4" />
            Export PDF / Certificate
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/60"
          >
            <BookOpen className="h-4 w-4" />
            Back to dashboard
          </a>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Breakdown</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Answer review</h3>
        </div>

        <div className="space-y-4">
          {result.breakdown.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{index + 1}. {item.prompt}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <p className="text-slate-400">Your answer</p>
                  <p className="mt-1 text-slate-200">{item.selected.length ? item.selected.join(', ') : 'No answer selected'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Correct answer</p>
                  <p className="mt-1 text-slate-200">{item.correct.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminPage({ quizzes, adminForm, setAdminForm, onSaveQuiz, onEditQuiz, onDeleteQuiz, onExportQuizzes, onImportQuizzes }) {
  const importInputRef = useRef(null)

  const addQuestion = () => {
    setAdminForm((prev) => ({ ...prev, questions: [...prev.questions, EMPTY_QUESTION('single')] }))
  }

  const removeQuestion = (index) => {
    setAdminForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const resetForm = () => setAdminForm(createEmptyQuizForm())

  const addOption = (questionIndex) => {
    setAdminForm((prev) => {
      const nextQuestions = [...prev.questions]
      const question = nextQuestions[questionIndex]
      const nextOptions = [...(question.options || []), `Option ${question.options.length + 1}`]
      nextQuestions[questionIndex] = { ...question, options: nextOptions }
      return { ...prev, questions: nextQuestions }
    })
  }

  const removeOption = (questionIndex, optionIndex) => {
    setAdminForm((prev) => {
      const nextQuestions = [...prev.questions]
      const question = nextQuestions[questionIndex]
      if (question.type === 'truefalse' || question.options.length <= 2) return prev

      const nextOptions = question.options.filter((_, index) => index !== optionIndex)
      const nextAnswers = (question.correctAnswer || []).filter((answer) => nextOptions.includes(answer))
      nextQuestions[questionIndex] = { ...question, options: nextOptions, correctAnswer: nextAnswers }
      return { ...prev, questions: nextQuestions }
    })
  }

  const handleQuestionChange = (index, field, value) => {
    setAdminForm((prev) => {
      const nextQuestions = [...prev.questions]
      nextQuestions[index] = { ...nextQuestions[index], [field]: value }
      return { ...prev, questions: nextQuestions }
    })
  }

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setAdminForm((prev) => {
      const nextQuestions = [...prev.questions]
      const nextOptions = [...nextQuestions[questionIndex].options]
      nextOptions[optionIndex] = value
      nextQuestions[questionIndex] = { ...nextQuestions[questionIndex], options: nextOptions }
      return { ...prev, questions: nextQuestions }
    })
  }

  const handleCorrectAnswerChange = (questionIndex, value, isChecked) => {
    setAdminForm((prev) => {
      const nextQuestions = [...prev.questions]
      const question = nextQuestions[questionIndex]
      const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
      const nextAnswers = isChecked ? [...new Set([...currentAnswers, value])] : currentAnswers.filter((item) => item !== value)
      nextQuestions[questionIndex] = { ...question, correctAnswer: nextAnswers }
      return { ...prev, questions: nextQuestions }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="card-surface p-5 animate-fade-up">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Studio</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Quiz builder</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportQuizzes}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500/60"
            >
              <FileDown className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500/60"
            >
              <FileUp className="h-4 w-4" />
              Import JSON
            </button>
            <input ref={importInputRef} type="file" accept="application/json" hidden onChange={onImportQuizzes} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Quiz title
              <input
                value={adminForm.title}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                placeholder="New quiz title"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Category
              <input
                value={adminForm.category}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                placeholder="General"
              />
            </label>
          </div>

          <label className="block text-sm text-slate-300">
            Description
            <textarea
              value={adminForm.description}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
              placeholder="Short description of the quiz"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block text-sm text-slate-300">
              Duration (seconds)
              <input
                type="number"
                min="30"
                value={adminForm.duration}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, duration: Number(event.target.value) || 0 }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
              />
            </label>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100"
            >
              Reset form
            </button>
          </div>

          <div className="space-y-4">
            {adminForm.questions.map((question, questionIndex) => (
              <div key={question.id || questionIndex} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-inner shadow-slate-950/30">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Question {questionIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-medium text-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Question type
                    <select
                      value={question.type}
                      onChange={(event) => handleQuestionChange(questionIndex, 'type', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                    >
                      <option value="single">Single choice</option>
                      <option value="multi">Multiple choice</option>
                      <option value="truefalse">True / False</option>
                    </select>
                  </label>

                  <label className="block text-sm text-slate-300">
                    Category
                    <input
                      value={question.category}
                      onChange={(event) => handleQuestionChange(questionIndex, 'category', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                    />
                  </label>
                </div>

                <label className="mt-4 block text-sm text-slate-300">
                  Prompt
                  <textarea
                    value={question.prompt}
                    onChange={(event) => handleQuestionChange(questionIndex, 'prompt', event.target.value)}
                    className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                  />
                </label>

                <div className="mt-4 space-y-2">
                  {(question.type === 'truefalse' ? ['True', 'False'] : question.options).map((option, optionIndex) => (
                    <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                      <input
                        type={question.type === 'multi' ? 'checkbox' : 'radio'}
                        checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(option) : false}
                        onChange={(event) => handleCorrectAnswerChange(questionIndex, option, event.target.checked)}
                        className="h-4 w-4 accent-cyan-500"
                      />
                      <input
                        value={option}
                        onChange={(event) => handleOptionChange(questionIndex, optionIndex, event.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-cyan-500"
                        disabled={question.type === 'truefalse'}
                      />
                      {question.type !== 'truefalse' && question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300"
                          aria-label="Remove option"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {question.type !== 'truefalse' && (
                  <button
                    type="button"
                    onClick={() => addOption(questionIndex)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add option
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
            <button
              type="button"
              onClick={onSaveQuiz}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01]"
            >
              Save quiz
            </button>
          </div>
        </div>
      </div>

      <aside className="card-surface p-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Library</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Existing quizzes</h3>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{quizzes.length}</span>
        </div>

        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{quiz.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{quiz.category}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{quiz.questions.length} Qs</p>
                  <p>{formatSeconds(quiz.duration)}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditQuiz(quiz)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-xs font-medium text-slate-100 transition hover:border-cyan-500/60"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuiz(quiz.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-2 text-xs font-medium text-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function App() {
  const [authView, setAuthView] = useState('student-login')
  const [authForm, setAuthForm] = useState({ name: '', email: 'student@demo.com', password: 'demo123', institution: '' })
  const [quizzes, setQuizzes] = useState(() => getQuizzes())
  const [attemptHistory, setAttemptHistory] = useState(() => getAttempts())
  const [profile, setProfile] = useState(() => getProfile())
  const [authUser, setAuthUser] = useState(() => getCurrentUser())
  const [adminForm, setAdminForm] = useState(createEmptyQuizForm())
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    seedStorageIfNeeded()
    const nextQuizzes = getQuizzes()
    setQuizzes(nextQuizzes)
    setAttemptHistory(getAttempts())
    const nextProfile = getProfile()
    setProfile(nextProfile)
    const storedUser = getCurrentUser()
    if (storedUser) {
      setAuthUser(storedUser)
      setProfile((prev) => ({ ...prev, ...nextProfile, name: storedUser.name || prev.name, email: storedUser.email || prev.email, role: storedUser.role || prev.role }))
    }
  }, [])

  const userAttempts = useMemo(
    () => (authUser ? attemptHistory.filter((attempt) => attempt.userEmail === authUser.email || !attempt.userEmail) : []),
    [attemptHistory, authUser],
  )

  const handleAuthSubmit = (event) => {
    event.preventDefault()

    const normalizedEmail = authForm.email.trim().toLowerCase()
    const normalizedPassword = authForm.password.trim()

    if (!normalizedEmail || !normalizedPassword) {
      window.alert('Please enter a valid email and password.')
      return
    }

    const requestedRole = authView.startsWith('admin-') ? 'admin' : 'student'
    const isSignup = authView.endsWith('-signup')

    if (isSignup) {
      if (!authForm.name.trim()) {
        window.alert('Please enter your full name to create an account.')
        return
      }

      if (requestedRole === 'admin' && !authForm.institution.trim()) {
        window.alert('Please enter your institution or organization to create an admin account.')
        return
      }

      const users = getUsers()
      const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail)
      if (exists) {
        window.alert('An account already exists for this email. Please sign in instead.')
        return
      }

      const nextUser = {
        id: `user-${Date.now()}`,
        name: authForm.name.trim(),
        email: normalizedEmail,
        password: normalizedPassword,
        role: requestedRole,
        ...(requestedRole === 'admin' ? { institution: authForm.institution.trim() } : {}),
      }

      const nextUsers = [nextUser, ...users]
      saveUsers(nextUsers)
      setAuthUser(nextUser)
      saveCurrentUser(nextUser)
      const nextProfile = {
        ...defaultProfile,
        name: nextUser.name,
        email: nextUser.email,
        role: nextUser.role,
        ...(nextUser.institution ? { institution: nextUser.institution } : {}),
      }
      setProfile(nextProfile)
      saveProfile(nextProfile)
      return
    }

    const users = getUsers()
    const matchedUser = users.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password === normalizedPassword &&
        user.role === requestedRole,
    )

    if (!matchedUser) {
      window.alert(`Invalid ${requestedRole} credentials. Check the demo account details below if needed.`)
      return
    }

    setAuthUser(matchedUser)
    saveCurrentUser(matchedUser)
    const nextProfile = {
      ...defaultProfile,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      institution: matchedUser.institution || (matchedUser.role === 'admin' ? 'Insight Academy' : 'Northview Academy'),
    }
    setProfile(nextProfile)
    saveProfile(nextProfile)
  }

  const handleLogout = () => {
    setAuthUser(null)
    saveCurrentUser(null)
  }

  const handleAuthViewChange = (view) => {
    setAuthView(view)
    setAuthForm((prev) => {
      if (view.endsWith('-signup')) {
        return { ...prev, name: '', email: '', password: '', institution: '' }
      }

      const isAdminLogin = view.startsWith('admin-')
      return {
        ...prev,
        email: isAdminLogin ? 'admin@demo.com' : 'student@demo.com',
        password: isAdminLogin ? 'admin123' : 'demo123',
      }
    })
  }

  const handleStartQuiz = (quiz) => {
    if (!quiz) return
    window.location.assign(`/quiz/${quiz.id}`)
  }

  const handleSaveQuiz = () => {
    const cleanedQuestions = adminForm.questions.map((question) => {
      const normalized = normalizeQuestion(question)
      if (normalized.type === 'truefalse') normalized.options = ['True', 'False']
      if (!normalized.prompt.trim() || !normalized.options.length || !normalized.correctAnswer.length) return null
      return normalized
    })

    if (!adminForm.title.trim() || cleanedQuestions.some((question) => question === null)) {
      window.alert('Please provide a quiz title and complete every question before saving.')
      return
    }

    const quizId = adminForm.id || slugify(adminForm.title) || `quiz-${Date.now()}`
    const nextQuiz = {
      id: quizId,
      title: adminForm.title.trim(),
      description: adminForm.description.trim() || 'Custom quiz created in admin studio.',
      category: adminForm.category.trim() || 'General',
      duration: Number(adminForm.duration) || 600,
      questions: cleanedQuestions,
    }

    const nextQuizzes = adminForm.id ? quizzes.map((quiz) => (quiz.id === adminForm.id ? nextQuiz : quiz)) : [nextQuiz, ...quizzes]

    setQuizzes(nextQuizzes)
    saveQuizzes(nextQuizzes)
    setAdminForm(createEmptyQuizForm())
  }

  const handleEditQuiz = (quiz) => {
    setAdminForm({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      duration: quiz.duration,
      questions: quiz.questions.map((question) => ({
        ...question,
        correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer].filter(Boolean),
      })),
    })
  }

  const handleDeleteQuiz = (quizId) => {
    const remaining = quizzes.filter((quiz) => quiz.id !== quizId)
    setQuizzes(remaining)
    saveQuizzes(remaining)
    if (adminForm.id === quizId) {
      setAdminForm(createEmptyQuizForm())
    }
  }

  const handleExportQuizzes = () => {
    const blob = new Blob([JSON.stringify(quizzes, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'quiz-portal-export.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportQuizzes = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const imported = Array.isArray(parsed) ? parsed : parsed?.quizzes

        if (!Array.isArray(imported) || !imported.length) {
          window.alert('The selected JSON file does not contain any valid quizzes.')
          return
        }

        const safeQuizzes = imported.map((quiz) => ({
          id: quiz.id || slugify(quiz.title || `quiz-${Date.now()}`),
          title: quiz.title || 'Untitled Quiz',
          description: quiz.description || 'Imported quiz',
          category: quiz.category || 'General',
          duration: Number(quiz.duration) || 600,
          questions: Array.isArray(quiz.questions) ? quiz.questions.map((question) => normalizeQuestion(question)) : [],
        }))

        setQuizzes(safeQuizzes)
        saveQuizzes(safeQuizzes)
        event.target.value = ''
      } catch (error) {
        console.error('Failed to import quizzes', error)
        window.alert('There was a problem importing that JSON file.')
      }
    }

    reader.readAsText(file)
  }

  const handlePrintResult = () => {
    window.print()
  }

  const isAdmin = authUser?.role === 'admin'

  const currentPath = window.location.pathname

  if (!authUser) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <AuthPage
              authView={authView}
              onAuthViewChange={handleAuthViewChange}
              authForm={authForm}
              setAuthForm={setAuthForm}
              onSubmit={handleAuthSubmit}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppShell authUser={authUser} profile={profile} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={<DashboardPage userAttempts={userAttempts} quizzes={quizzes} authUser={authUser} profile={profile} onStartQuiz={handleStartQuiz} />}
        />

        <Route
          path="/quizzes"
          element={
            <QuizCatalogPage
              quizzes={quizzes}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onStartQuiz={handleStartQuiz}
            />
          }
        />

        <Route
          path="/quiz/:quizId"
          element={
            <QuizAttemptPage
              quiz={quizzes.find((quiz) => quiz.id === window.location.pathname.split('/quiz/')[1]) || null}
              authUser={authUser}
              profile={profile}
              attemptHistory={attemptHistory}
              setAttemptHistory={setAttemptHistory}
              onCompleteAttempt={(record) => {
                setAttemptHistory((prev) => [record, ...prev])
              }}
            />
          }
        />

        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminPage
                quizzes={quizzes}
                adminForm={adminForm}
                setAdminForm={setAdminForm}
                onSaveQuiz={handleSaveQuiz}
                onEditQuiz={handleEditQuiz}
                onDeleteQuiz={handleDeleteQuiz}
                onExportQuizzes={handleExportQuizzes}
                onImportQuizzes={handleImportQuizzes}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/results/:attemptId"
          element={<ResultsPage attemptId={currentPath.split('/results/')[1] || ''} attemptHistory={attemptHistory} onPrintResult={handlePrintResult} />}
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
