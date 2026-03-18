/**
 * ML Predictions Dashboard Component
 * Displays various machine learning predictions
 */

'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  useAttendancePrediction,
  useGivingForecast,
  useChurnRiskAnalysis,
  useSermonOptimization,
  useBatchPredictions
} from '@/hooks/usePredictions'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  DollarSign,
  BookOpen,
  Activity,
  Loader2
} from 'lucide-react'

interface MLPredictionsDashboardProps {
  churchId: string
}

export default function MLPredictionsDashboard({ churchId }: MLPredictionsDashboardProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'giving' | 'churn' | 'sermon'>('overview')

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please sign in to view predictions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'attendance', label: '👥 Attendance' },
          { id: 'giving', label: '💰 Giving' },
          { id: 'churn', label: '⚠️ At Risk' },
          { id: 'sermon', label: '📖 Sermons' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <OverviewTab churchId={churchId} />
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <AttendanceTab churchId={churchId} />
      )}

      {/* Giving Tab */}
      {activeTab === 'giving' && (
        <GivingTab churchId={churchId} />
      )}

      {/* Churn Risk Tab */}
      {activeTab === 'churn' && (
        <ChurnTab churchId={churchId} />
      )}

      {/* Sermon Tab */}
      {activeTab === 'sermon' && (
        <SermonTab churchId={churchId} />
      )}
    </div>
  )
}

// ============================================================================
// Overview Tab Component
// ============================================================================

function OverviewTab({ churchId }: { churchId: string }) {
  const batch = useBatchPredictions(churchId)

  if (batch.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading predictions...</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Attendance Card */}
      <PredictionCard
        title="Attendance Forecast"
        icon={<Users className="w-5 h-5" />}
        loading={!batch.data?.attendance}
        content={batch.data?.attendance && (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {batch.data.attendance.data?.prediction?.predictedAttendance || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {((batch.data.attendance.data?.prediction?.confidenceScore || 0) * 100).toFixed(0)}%
            </div>
          </div>
        )}
      />

      {/* Giving Card */}
      <PredictionCard
        title="Giving Forecast (90 days)"
        icon={<DollarSign className="w-5 h-5" />}
        loading={!batch.data?.giving}
        content={batch.data?.giving && (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              ${batch.data.giving.data?.forecast?.predictedTotal?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Trend: {batch.data.giving.data?.forecast?.trend || 'Unknown'}
            </div>
          </div>
        )}
      />

      {/* At-Risk Members Card */}
      <PredictionCard
        title="Members At Risk"
        icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
        loading={!batch.data?.churn}
        content={batch.data?.churn && (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-orange-600">
              {batch.data.churn.data?.atriskCount || 0}
            </div>
            <div className="text-sm text-gray-600">
              Needing intervention
            </div>
          </div>
        )}
      />

      {/* Sermon Optimization Card */}
      <PredictionCard
        title="Sermon Insights"
        icon={<BookOpen className="w-5 h-5" />}
        loading={!batch.data?.sermon}
        content={batch.data?.sermon && (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {batch.data.sermon.data?.optimization?.recommendedTopics?.length || 0}
            </div>
            <div className="text-sm text-gray-600">
              Topics recommended
            </div>
          </div>
        )}
      />
    </div>
  )
}

// ============================================================================
// Attendance Tab
// ============================================================================

function AttendanceTab({ churchId }: { churchId: string }) {
  const [eventType, setEventType] = useState('SERVICE')
  const prediction = useAttendancePrediction(churchId, eventType)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="font-medium">Event Type:</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="SERVICE">Service</option>
          <option value="MEETING">Meeting</option>
          <option value="CONFERENCE">Conference</option>
          <option value="WORKSHOP">Workshop</option>
          <option value="SOCIAL">Social</option>
        </select>
      </div>

      {prediction.isLoading ? (
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p>Predicting attendance...</p>
        </div>
      ) : prediction.error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          Unable to generate prediction. Insufficient historical data.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Prediction */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Predicted Attendance</h3>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold text-blue-600">
                  {prediction.data?.prediction?.predictedAttendance}
                </div>
                <p className="text-gray-600">Expected attendees</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Confidence Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(prediction.data?.prediction?.confidenceScore || 0) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {((prediction.data?.prediction?.confidenceScore || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Recommended Capacity</p>
                <p className="text-2xl font-bold text-green-600">
                  {prediction.data?.prediction?.recommendedCapacity}
                </p>
              </div>
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Contributing Factors</h3>
            <div className="space-y-3">
              {prediction.data?.prediction?.factorsAnalyzed && (
                <>
                  <FactorRow
                    label="Historical Average"
                    value={prediction.data.prediction.factorsAnalyzed.historicalAverage}
                  />
                  <FactorRow
                    label="Seasonality Factor"
                    value={prediction.data.prediction.factorsAnalyzed.seasonality}
                  />
                  <FactorRow
                    label="Day of Week"
                    value={prediction.data.prediction.factorsAnalyzed.dayOfWeek}
                  />
                  <FactorRow
                    label="Time of Day"
                    value={prediction.data.prediction.factorsAnalyzed.timeOfDay}
                  />
                  <FactorRow
                    label="Trend"
                    value={prediction.data.prediction.factorsAnalyzed.trendFactor}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Giving Tab
// ============================================================================

function GivingTab({ churchId }: { churchId: string }) {
  const [period, setPeriod] = useState<'30-day' | '90-day' | '365-day'>('90-day')
  const forecast = useGivingForecast(churchId, period)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="font-medium">Forecast Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="30-day">30 Days</option>
          <option value="90-day">90 Days</option>
          <option value="365-day">1 Year</option>
        </select>
      </div>

      {forecast.isLoading ? (
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p>Analyzing giving patterns...</p>
        </div>
      ) : forecast.error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          Unable to generate forecast. Insufficient giving history.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Forecast */}
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-2">Predicted Total</p>
            <p className="text-4xl font-bold text-green-600">
              ${forecast.data?.forecast?.predictedTotal?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {period.split('-')[0]} day forecast
            </p>
          </div>

          {/* Per Donor */}
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-2">Per Donor Average</p>
            <p className="text-4xl font-bold text-blue-600">
              ${forecast.data?.forecast?.predictedPerDonor?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Average gift size
            </p>
          </div>

          {/* Trend */}
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-2">Trend</p>
            <p className={`text-2xl font-bold ${
              forecast.data?.forecast?.trend === 'increasing' ? 'text-green-600' :
              forecast.data?.forecast?.trend === 'declining' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {forecast.data?.forecast?.trend?.toUpperCase()}
            </p>
            <div className="mt-2">
              {forecast.data?.forecast?.trend === 'increasing' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : forecast.data?.forecast?.trend === 'declining' ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : null}
            </div>
          </div>

          {/* Confidence Interval */}
          <div className="md:col-span-2 bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm mb-4">Confidence Range</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Lower Bound</p>
                <p className="text-xl font-bold">
                  ${forecast.data?.forecast?.confidenceInterval?.lower?.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2 relative">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    marginLeft: '10%',
                    width: '80%'
                  }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Upper Bound</p>
                <p className="text-xl font-bold">
                  ${forecast.data?.forecast?.confidenceInterval?.upper?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-gray-600 text-sm font-medium mb-3">Risk Factors</p>
            <ul className="space-y-2">
              {forecast.data?.forecast?.riskFactors?.length > 0 ? (
                forecast.data.forecast.riskFactors.map((risk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-600">No major risk factors identified</p>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Churn Risk Tab
// ============================================================================

function ChurnTab({ churchId }: { churchId: string }) {
  const churnAnalysis = useChurnRiskAnalysis(churchId, { limit: 50 })

  if (churnAnalysis.isLoading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p>Analyzing member engagement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
        <p className="text-orange-900 font-medium">
          {churnAnalysis.data?.atriskCount || 0} members at risk
        </p>
      </div>

      <div className="space-y-2">
        {churnAnalysis.data?.members?.map((member: any) => (
          <ChurnRiskRow key={member.memberId} member={member} />
        ))}

        {churnAnalysis.data?.members?.length === 0 && (
          <div className="text-center p-8 text-gray-600">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p>No members at risk - great engagement!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sermon Tab
// ============================================================================

function SermonTab({ churchId }: { churchId: string }) {
  const optimization = useSermonOptimization(churchId)

  if (optimization.isLoading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p>Analyzing sermon data...</p>
      </div>
    )
  }

  if (optimization.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700">
        Unable to generate recommendations. Insufficient sermon data.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recommended Topics */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-lg mb-4">Recommended Topics</h3>
        <div className="space-y-3">
          {optimization.data?.optimization?.recommendedTopics?.map((topic: any, i: number) => (
            <div key={i} className="pb-3 border-b last:border-b-0">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium">{topic.topic}</p>
                <p className="text-sm text-blue-600 font-semibold">
                  {(topic.relevanceScore * 100).toFixed(0)}%
                </p>
              </div>
              <p className="text-xs text-gray-600">
                Engagement: {topic.predictedEngagement?.toFixed(0)} | 
                Frequency: {topic.optimalFrequency}x/year
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Optimal Timing & Content Mix */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-lg mb-4">Optimal Timing</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Best Day</p>
              <p className="text-lg font-bold">Sunday</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Best Time</p>
              <p className="text-lg font-bold">
                {optimization.data?.optimization?.optimalEventTiming?.timeOfDay}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Attendance</p>
              <p className="text-lg font-bold">
                {optimization.data?.optimization?.optimalEventTiming?.avgAttendance}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-lg mb-4">Content Recommendations</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Sermon Length</p>
              <p className="text-lg font-bold">
                {optimization.data?.optimization?.contentMix?.length?.recommended} min
              </p>
              <p className="text-xs text-gray-500">
                Optimal: {optimization.data?.optimization?.contentMix?.length?.optimal} min |
                Range: {optimization.data?.optimization?.contentMix?.length?.range?.join('-')} min
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Series vs Standalone</p>
              <p className="text-lg font-bold">
                {optimization.data?.optimization?.contentMix?.seriesVsStandalone}% Series
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

function PredictionCard({
  title,
  icon,
  loading,
  content
}: {
  title: string
  icon: React.ReactNode
  loading: boolean
  content: React.ReactNode
}) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-blue-600">{icon}</div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : (
        content
      )}
    </div>
  )
}

function FactorRow({
  label,
  value
}: {
  label: string
  value: number
}) {
  const isPositive = value >= 1
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-gray-700">{label}</p>
      <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {value > 0 ? '+' : ''}{(value - 1).toFixed(1)}%
      </span>
    </div>
  )
}

function ChurnRiskRow({
  member
}: {
  member: any
}) {
  const riskColor =
    member.churnRiskScore > 75 ? 'bg-red-50 border-red-200' :
    member.churnRiskScore > 50 ? 'bg-orange-50 border-orange-200' :
    'bg-yellow-50 border-yellow-200'

  return (
    <div className={`${riskColor} border p-4 rounded-lg`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-xs text-gray-600">{member.email}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-600">{member.churnRiskScore}</p>
          <p className="text-xs text-gray-600">Risk Score</p>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {member.riskFactors.map((factor: any, i: number) => (
          <p key={i} className="text-sm text-gray-700">
            • {factor.factor}: {factor.severity}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        {member.interventionSuggestions.map((suggestion: string, i: number) => (
          <span key={i} className="text-xs bg-white px-2 py-1 rounded border">
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  )
}
