import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import {
  DigitalCourseExamService,
  DigitalCourseService,
  DigitalExamQuestionService,
} from '@/lib/services/digital-school-service'
import { ExamRunner } from '@/components/ExamRunner'

export const dynamic = 'force-dynamic'

type ExamPageProps = {
  params: {
    examId: string
  }
}

export default async function ExamPage({ params }: ExamPageProps) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }

  const church = await getCurrentChurch(session.user.id)
  if (!church) {
    notFound()
  }

  const exam = await DigitalCourseExamService.get(params.examId)
  if (!exam) {
    notFound()
  }

  const course = await DigitalCourseService.get(exam.courseId)
  if (!course || course.churchId !== church.id) {
    notFound()
  }

  const questions = await DigitalExamQuestionService.listByExam(exam.id)

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <div>
        <Link
          href="/dashboard/digital-school"
          className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          ← Back to Digital School
        </Link>
      </div>
      <ExamRunner
        exam={{
          id: exam.id,
          title: exam.title,
          description: exam.description,
          timeLimitMinutes: exam.timeLimitMinutes ?? undefined,
          questionCount: exam.questionCount ?? undefined,
        }}
        questions={questions.map((question) => ({
          id: question.id,
          question: question.question,
          options: question.options,
          durationSeconds: question.durationSeconds,
          explanation: question.explanation,
        }))}
      />
    </div>
  )
}
