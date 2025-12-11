'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import DonateModal from './DonateModal'

interface Project {
  id: string
  name: string
  description?: string
  goalAmount: number
  currentAmount: number
  imageUrl?: string
  progress: number
  remainingAmount: number
  _count: {
    giving: number
  }
}

export default function GivingProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDonateModal, setShowDonateModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/giving/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDonate = (project: Project) => {
    setSelectedProject(project)
    setShowDonateModal(true)
  }

  const handleDonationSuccess = () => {
    setShowDonateModal(false)
    setSelectedProject(null)
    loadProjects()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Giving Projects</h1>
        <p className="text-gray-600">
          Support our church projects and see the impact of your giving
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {project.imageUrl && (
              <img
                src={project.imageUrl}
                alt={project.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-gray-600 mb-4 text-sm">{project.description}</p>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {project.progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-600">
                  <span>{formatCurrency(project.currentAmount)}</span>
                  <span>{formatCurrency(project.goalAmount)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {project._count.giving} donors •{' '}
                {formatCurrency(project.remainingAmount)} remaining
              </div>

              <button
                onClick={() => handleDonate(project)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Give Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No active projects at this time.</p>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && selectedProject && (
        <DonateModal
          project={selectedProject}
          onClose={() => {
            setShowDonateModal(false)
            setSelectedProject(null)
          }}
          onSuccess={handleDonationSuccess}
        />
      )}
    </div>
  )
}

