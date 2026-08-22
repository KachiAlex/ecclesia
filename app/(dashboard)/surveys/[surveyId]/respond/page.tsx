import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { SurveyService } from '@/lib/services/survey-service'
import SurveyRespondForm from '@/components/survey/SurveyRespondForm'

interface SurveyRespondRouteProps {
  params: { surveyId: string }
}

export default async function SurveyRespondRoute({ params }: SurveyRespondRouteProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/login')
  }

  const survey = await SurveyService.getSurveyById(params.surveyId, session.user.id)
  if (!survey) {
    redirect('/surveys')
  }

  if (survey.status !== 'ACTIVE') {
    redirect(`/surveys/${survey.id}`)
  }

  if (survey.deadline && new Date() > new Date(survey.deadline)) {
    redirect(`/surveys/${survey.id}`)
  }

  const existingResponse = survey.responses?.[0]

  return (
    <div className="mx-auto max-w-4xl">
      <SurveyRespondForm survey={survey} existingResponse={existingResponse || null} />
    </div>
  )
}
