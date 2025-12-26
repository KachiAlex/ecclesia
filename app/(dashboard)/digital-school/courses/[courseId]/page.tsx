import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import {
  DigitalCourseModuleService,
  DigitalCourseSectionService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'

export const dynamic = 'force-dynamic'

type CourseDetailPageProps = {
  params: {
    courseId: string
  }
}

export default async function DigitalCourseDetailPage({ params }: CourseDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }

  const church = await getCurrentChurch(session.user.id)
  if (!church) {
    notFound()
  }

  const course = await DigitalCourseService.get(params.courseId)
  if (!course || course.churchId !== church.id) {
    notFound()
  }

  const sections = await DigitalCourseSectionService.listByCourse(course.id)
  const sectionModules = await Promise.all(
    sections.map(async (section) => ({
      section,
      modules: await DigitalCourseModuleService.listBySection(section.id),
    })),
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Digital school</p>
          <h1 className="text-3xl font-semibold text-gray-900">{course.title}</h1>
          {course.summary && <p className="text-gray-600 mt-2 max-w-3xl">{course.summary}</p>}
        </div>
        <Link
          href="/dashboard/digital-school"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to catalog
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Estimated hours</p>
          <p className="text-2xl font-semibold text-gray-900">{course.estimatedHours ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Mentors</p>
          <p className="text-sm font-medium text-gray-900">{course.mentors?.join(', ') || 'Training team'}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Format</p>
          <p className="text-sm font-medium text-gray-900">{course.tags?.join(', ') || 'Video lessons'}</p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Course outline</p>
            <h2 className="text-2xl font-semibold text-gray-900">Sections & modules</h2>
            <p className="text-sm text-gray-500">Review each section to access the modules and resources inside.</p>
          </div>
        </div>

        {sectionModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Sections have not been added to this course yet. Check back once the admin team publishes the outline.
          </div>
        ) : (
          <div className="space-y-6">
            {sectionModules.map(({ section, modules }, index) => (
              <div key={section.id} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Section {index + 1}</p>
                    <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                    {section.description && <p className="text-sm text-gray-600 mt-1">{section.description}</p>}
                  </div>
                  {section.estimatedHours ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      ~{section.estimatedHours} hrs
                    </span>
                  ) : null}
                </div>

                {modules.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    Modules for this section will be published soon.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {modules.map((module) => (
                      <li key={module.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{module.title}</p>
                            {module.description && <p className="text-sm text-gray-600">{module.description}</p>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {module.contentType && (
                              <span className="rounded-full bg-white px-3 py-1 font-medium capitalize text-gray-700">
                                {module.contentType}
                              </span>
                            )}
                            {module.estimatedMinutes && (
                              <span className="rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                                ~{module.estimatedMinutes} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-primary-600">
                          {module.videoUrl && (
                            <a
                              href={module.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-white px-3 py-1 font-semibold hover:bg-primary-50"
                            >
                              Watch video
                            </a>
                          )}
                          {module.audioUrl && (
                            <a
                              href={module.audioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-white px-3 py-1 font-semibold hover:bg-primary-50"
                            >
                              Listen audio
                            </a>
                          )}
                          {module.bookUrl && (
                            <a
                              href={module.bookUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-white px-3 py-1 font-semibold hover:bg-primary-50"
                            >
                              View notes
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
