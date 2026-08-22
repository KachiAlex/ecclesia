import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'

import { authOptions } from '@/lib/auth-options'
import { getCurrentChurch } from '@/lib/church-context'
import {
  DigitalCourseExamService,
  DigitalCourseModuleService,
  DigitalCourseSectionService,
  DigitalCourseService,
} from '@/lib/services/digital-school-service'

const YT_REGEX = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i

const buildYouTubeEmbed = (url: string) => {
  const match = url.match(YT_REGEX)
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null
}

const buildVimeoEmbed = (url: string) => {
  const match = url.match(VIMEO_REGEX)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

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
  const sectionContent = await Promise.all(
    sections.map(async (section) => {
      const [modules, exams] = await Promise.all([
        DigitalCourseModuleService.listBySection(section.id),
        DigitalCourseExamService.listBySection(section.id),
      ])
      return {
        section,
        modules,
        exam: exams[0] ?? null,
      }
    }),
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

        {sectionContent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Sections have not been added to this course yet. Check back once the admin team publishes the outline.
          </div>
        ) : (
          <div className="space-y-6">
            {sectionContent.map(({ section, modules, exam }, index) => (
              <div key={section.id} className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
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
                  <ul className="space-y-4">
                    {modules.map((module, moduleIndex) => {
                      const nextModule = modules[moduleIndex + 1]
                      const embedVideoUrl =
                        (module.videoUrl && (buildYouTubeEmbed(module.videoUrl) ?? buildVimeoEmbed(module.videoUrl))) || null
                      return (
                        <li
                          key={module.id}
                          id={`module-${module.id}`}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"
                        >
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
                          {module.contentType === 'video' && module.videoUrl && (
                            <div className="mt-3 overflow-hidden rounded-xl bg-black">
                              {embedVideoUrl ? (
                                <iframe
                                  src={embedVideoUrl}
                                  title={module.title}
                                  className="h-[420px] w-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <video controls playsInline className="w-full h-full max-h-[420px] object-cover">
                                  <source src={module.videoUrl} />
                                  Your browser does not support embedded videos.{' '}
                                  <a href={module.videoUrl} target="_blank" rel="noreferrer" className="underline">
                                    Open video
                                  </a>
                                </video>
                              )}
                            </div>
                          )}
                          {module.contentType === 'audio' && module.audioUrl && (
                            <div className="mt-3 rounded-xl bg-white p-4 shadow-inner">
                              <audio controls className="w-full">
                                <source src={module.audioUrl} />
                                Your browser does not support embedded audio.
                              </audio>
                            </div>
                          )}
                          {module.bookUrl && (
                            <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white">
                              <iframe
                                src={module.bookUrl}
                                className="h-80 w-full rounded-xl"
                                title={`${module.title} resources`}
                              />
                            </div>
                          )}
                          {module.textContent && module.contentType === 'text' && (
                            <div className="mt-3 rounded-xl bg-white p-4 text-sm text-gray-700 leading-relaxed">
                              {module.textContent}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <span className="text-xs text-gray-500">
                              Updated {module.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {nextModule ? (
                              <a
                                href={`#module-${nextModule.id}`}
                                className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                              >
                                Next module →
                              </a>
                            ) : exam ? (
                              <a
                                href={`#section-${section.id}-exam`}
                                className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Go to section exam →
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">End of section</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div id={`section-${section.id}-exam`} className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Section exam</p>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {exam?.title ?? 'Exam coming soon'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {exam?.description ??
                          'The admin team will publish the sectional exam shortly. Complete all modules to unlock it.'}
                      </p>
                    </div>
                    {exam && (
                      <div className="text-sm text-gray-500 space-y-1 text-right">
                        {exam.timeLimitMinutes && <p>⏱ {exam.timeLimitMinutes} min limit</p>}
                        {typeof exam.questionCount === 'number' && <p>❓ {exam.questionCount} questions</p>}
                        {(() => {
                          const examStatus = exam.status as string
                          const badgeClass =
                            examStatus === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : examStatus === 'ready'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                          return (
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                              {examStatus}
                            </span>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {exam ? (
                      (exam.status as string) === 'published' || (exam.status as string) === 'ready' ? (
                        <Link
                          href={`/dashboard/digital-school/exams/${exam.id}`}
                          className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                          {(exam.status as string) === 'ready' ? 'Preview exam →' : 'Launch exam →'}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {exam.questionCount && exam.questionCount > 0
                            ? 'Exam ready — publish to unlock'
                            : 'Exam not published'}
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-gray-600"
                        disabled
                      >
                        Exam unavailable
                      </button>
                    )}
                    <span className="text-xs text-gray-500">
                      Exams are required to unlock the next section and issue certificates.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
