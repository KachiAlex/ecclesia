'use client'

import { useState } from 'react'
import SurveyCreator from './SurveyCreator'

interface SurveysHubProps {
  userRole: string
  canCreateSurveys: boolean
  canManageAllSurveys: boolean
  churchId?: string
}

export default function SurveysHub({
  userRole,
  canCreateSurveys,
  canManageAllSurveys,
  churchId = ''
}: SurveysHubProps) {
  const [activeTab, setActiveTab] = useState<'participate' | 'manage' | 'analytics' | 'templates'>('participate')
  const [showCreator, setShowCreator] = useState(false)

  const handleSaveSurvey = (surveyData: any) => {
    console.log('Saving survey:', surveyData)
    // TODO: Implement survey save functionality
    setShowCreator(false)
    setActiveTab('manage')
  }

  const handlePreviewSurvey = (surveyData: any) => {
    console.log('Previewing survey:', surveyData)
    // TODO: Implement survey preview functionality
  }

  // Determine which tabs to show based on permissions
  const showManageTab = canCreateSurveys
  const showAnalyticsTab = canCreateSurveys
  const showTemplatesTab = canCreateSurveys

  // Show survey creator if requested
  if (showCreator) {
    return (
      <SurveyCreator
        userRole={userRole}
        churchId={churchId}
        onSave={handleSaveSurvey}
        onPreview={handlePreviewSurvey}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Surveys</h1>
        <p className="text-gray-600 mt-1">
          {canCreateSurveys 
            ? 'Create surveys and gather feedback from your congregation.' 
            : 'Participate in surveys and provide your feedback.'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border p-2 flex gap-2 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('participate')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'participate'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          My Surveys
        </button>
        
        {showManageTab && (
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Manage
          </button>
        )}

        {showAnalyticsTab && (
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
        )}

        {showTemplatesTab && (
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            Templates
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border p-6">
        {activeTab === 'participate' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Surveys</h2>
            <div className="text-gray-600">
              <p>No surveys available at the moment.</p>
              <p className="text-sm mt-2">
                When surveys are published for you, they will appear here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'manage' && canCreateSurveys && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Survey Management</h2>
              <button
                type="button"
                onClick={() => setShowCreator(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold"
              >
                + Create Survey
              </button>
            </div>
            <div className="text-gray-600">
              <p>No surveys created yet.</p>
              <p className="text-sm mt-2">
                Create your first survey to start gathering feedback from your congregation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && canCreateSurveys && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Survey Analytics</h2>
            <div className="text-gray-600">
              <p>No survey data available yet.</p>
              <p className="text-sm mt-2">
                Analytics will appear here once you have active surveys with responses.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'templates' && canCreateSurveys && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Survey Templates</h2>
            <div className="text-gray-600">
              <p>Survey templates will be available here.</p>
              <p className="text-sm mt-2">
                Use pre-built templates to quickly create common types of surveys.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}