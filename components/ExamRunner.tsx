'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type ExamRunnerProps = {
  exam: {
    id: string
    title: string
    description?: string | null
    timeLimitMinutes?: number | null
    questionCount?: number | null
  }
  questions: Array<{
    id: string
    question: string
    options: string[]
    durationSeconds?: number | null
    explanation?: string | null
  }>
}

type ExamStatus = 'ready' | 'in-progress' | 'completed'

export function ExamRunner({ exam, questions }: ExamRunnerProps) {
  const [status, setStatus] = useState<ExamStatus>('ready')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    exam.timeLimitMinutes ? exam.timeLimitMinutes * 60 : null,
  )
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptScore, setAttemptScore] = useState<number | null>(null)
  const [attemptQuestionTotal, setAttemptQuestionTotal] = useState<number | null>(null)
  const [gradedResponses, setGradedResponses] = useState<
    Array<{ questionId: string; answerIndex: number; correct: boolean }> | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isStartingAttempt, setIsStartingAttempt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoStartAttempted, setAutoStartAttempted] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (status !== 'in-progress' || remainingSeconds == null) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null) return prev
        if (prev <= 1) {
          window.clearInterval(interval)
          setStatus('completed')
          setSubmittedAt(new Date())
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [status, remainingSeconds])

  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => typeof answer === 'number').length,
    [answers],
  )

  const responseMap = useMemo(() => {
    if (!gradedResponses) return new Map<string, { answerIndex: number; correct: boolean }>()
    return gradedResponses.reduce((map, response) => {
      map.set(response.questionId, response)
      return map
    }, new Map<string, { answerIndex: number; correct: boolean }>())
  }, [gradedResponses])

  const formatTimer = (seconds: number | null) => {
    if (seconds == null) return '—'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = useCallback(async () => {
    if (!questions.length || isStartingAttempt || status !== 'ready') return
    setIsStartingAttempt(true)
    setError(null)
    try {
      const response = await fetch('/api/digital-school/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Unable to start exam attempt.')
      }
      const attempt = await response.json()
      setAttemptId(attempt.id)
      setStatus('in-progress')
      setRemainingSeconds(exam.timeLimitMinutes ? exam.timeLimitMinutes * 60 : null)
      setSubmittedAt(null)
      setAnswers({})
      setGradedResponses(null)
      setAttemptScore(null)
      setAttemptQuestionTotal(null)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start exam attempt.')
    } finally {
      setIsStartingAttempt(false)
    }
  }, [exam.id, exam.timeLimitMinutes, isStartingAttempt, questions.length, status])

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (status !== 'in-progress') return
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  const handleSubmit = async () => {
    if (status !== 'in-progress' || isSubmitting) return
    if (!attemptId) {
      setError('Attempt not initialized. Please start the exam again.')
      return
    }

    const responses = Object.entries(answers)
      .filter(([, value]) => typeof value === 'number')
      .map(([questionId, value]) => ({
        questionId,
        answerIndex: value as number,
      }))

    if (!responses.length) {
      setError('Select at least one answer before submitting.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/digital-school/attempts/${attemptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Unable to submit exam.')
      }

      const updatedAttempt = await response.json()
      setStatus('completed')
      setSubmittedAt(new Date())
      setRemainingSeconds((prev) => prev)
      setAttemptScore(typeof updatedAttempt.score === 'number' ? updatedAttempt.score : null)
      setAttemptQuestionTotal(typeof updatedAttempt.totalQuestions === 'number' ? updatedAttempt.totalQuestions : null)
      setGradedResponses(Array.isArray(updatedAttempt.responses) ? updatedAttempt.responses : null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit exam.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavigate = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleReset = () => {
    if (status === 'in-progress') return
    setAnswers({})
    setStatus('ready')
    setCurrentQuestionIndex(0)
    setRemainingSeconds(exam.timeLimitMinutes ? exam.timeLimitMinutes * 60 : null)
    setSubmittedAt(null)
    setAttemptId(null)
    setAttemptScore(null)
    setAttemptQuestionTotal(null)
    setGradedResponses(null)
    setError(null)
    setAutoStartAttempted(false)
  }

  useEffect(() => {
    if (status !== 'ready' || isStartingAttempt || attemptId || !questions.length || autoStartAttempted) return
    setAutoStartAttempted(true)
    void handleStart()
  }, [attemptId, autoStartAttempted, handleStart, isStartingAttempt, questions.length, status])

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-gray-100 bg-white px-6 py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Exam</p>
          <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
          {exam.description && <p className="text-sm text-gray-600 mt-1 max-w-2xl">{exam.description}</p>}
        </div>
        <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Questions</p>
            <p className="text-base font-semibold text-gray-900">{questions.length || exam.questionCount || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Answered</p>
            <p className="text-base font-semibold text-gray-900">
              {answeredCount}/{questions.length || exam.questionCount || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Timer</p>
            <p className="text-base font-semibold text-gray-900">{formatTimer(remainingSeconds)}</p>
          </div>
          {status === 'ready' && (
            <button
              type="button"
              onClick={() => void handleStart()}
              className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              disabled={!questions.length || isStartingAttempt}
            >
              {isStartingAttempt ? 'Preparing…' : 'Begin exam'}
            </button>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700">
              Submitted {submittedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {status === 'completed' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 flex flex-wrap items-center gap-4 text-sm text-emerald-800">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Score</p>
            <p className="text-2xl font-semibold text-emerald-900">
              {attemptScore != null ? `${attemptScore}%` : 'Pending grading'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Questions graded</p>
            <p className="text-base font-semibold text-emerald-900">
              {attemptQuestionTotal != null ? `${attemptQuestionTotal} total` : '—'}
            </p>
          </div>
          {gradedResponses && (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Correct</p>
              <p className="text-base font-semibold text-emerald-900">
                {gradedResponses.filter((response) => response.correct).length}/{gradedResponses.length}
              </p>
            </div>
          )}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          This exam does not have any questions yet. Please contact your Digital School admin.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">{currentQuestion.question}</h2>
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                {currentQuestion.durationSeconds ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                    Suggested: {Math.round(currentQuestion.durationSeconds / 60)} min
                  </span>
                ) : null}
                {status === 'completed' && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
                    Review mode
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index
                const submittedResponse = responseMap.get(currentQuestion.id)
                const isSubmittedAnswer = submittedResponse?.answerIndex === index
                const isCorrectAnswer = submittedResponse?.correct && isSubmittedAnswer
                const optionLetter = String.fromCharCode(65 + index)
                return (
                  <label
                    key={index}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      isCorrectAnswer
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : isSubmittedAnswer
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-900'
                            : 'border-gray-200 hover:border-primary-200'
                    } ${status === 'completed' ? 'cursor-default' : ''}`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      checked={isSelected}
                      onChange={() => handleSelectAnswer(currentQuestion.id, index)}
                      disabled={status !== 'in-progress'}
                    />
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {optionLetter}
                    </span>
                    <span className="flex-1">{option}</span>
                  </label>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate(Math.max(0, currentQuestionIndex - 1))}
                  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={currentQuestionIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next →
                </button>
              </div>
              {status === 'in-progress' ? (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit exam'}
                </button>
              ) : status === 'completed' ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Restart practice
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Question navigator</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((question, index) => {
                const answered = typeof answers[question.id] === 'number'
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => handleNavigate(index)}
                    className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                      index === currentQuestionIndex
                        ? 'bg-primary-600 text-white'
                        : answered
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
