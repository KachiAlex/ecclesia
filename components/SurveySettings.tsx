'use client'

import { Clock, Users, Shield, RefreshCw } from 'lucide-react'

export interface SurveySettingsFormState {
  isAnonymous: boolean
  allowMultipleResponses: boolean
  deadline: string | null
  isActive: boolean
  requiresApproval?: boolean
  showProgressBar?: boolean
  randomizeQuestions?: boolean
  allowSaveAndContinue?: boolean
  sendNotifications?: boolean
  collectMetadata?: boolean
  sendOnPublish: boolean
  sendReminders: boolean
  reminderDays: number[]
  meetingId?: string | null
}

interface SurveySettingsProps {
  settings: SurveySettingsFormState
  onChange: (settings: SurveySettingsFormState) => void
}

export default function SurveySettings({
  settings,
  onChange
}: SurveySettingsProps) {
  const updateSetting = (key: keyof SurveySettingsFormState, value: any) => {
    onChange({ ...settings, [key]: value })
  }

  const toggleReminderDay = (day: number) => {
    const next = new Set(settings.reminderDays || [])
    if (next.has(day)) {
      next.delete(day)
    } else {
      next.add(day)
    }
    onChange({ ...settings, reminderDays: Array.from(next).sort((a, b) => a - b) })
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Survey Settings</h2>
        <p className="text-gray-600 text-sm">Configure how your survey behaves and who can access it</p>
      </div>

      {/* Privacy & Access Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Privacy & Access
        </h3>
        
        <div className="space-y-3 pl-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.isAnonymous}
              onChange={(e) => updateSetting('isAnonymous', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Anonymous responses</span>
              <p className="text-xs text-gray-600">Respondent identities will not be recorded</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.allowMultipleResponses}
              onChange={(e) => updateSetting('allowMultipleResponses', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Allow multiple responses</span>
              <p className="text-xs text-gray-600">Users can submit the survey more than once</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.requiresApproval || false}
              onChange={(e) => updateSetting('requiresApproval', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Require approval before publishing</span>
              <p className="text-xs text-gray-600">Survey must be approved by an admin before going live</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to meeting/event (optional)
            </label>
            <input
              type="text"
              value={settings.meetingId || ''}
              onChange={(e) => updateSetting('meetingId', e.target.value || null)}
              placeholder="Enter meeting ID or leave blank"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Response Collection Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Response Collection
        </h3>
        
        <div className="space-y-3 pl-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.showProgressBar || false}
              onChange={(e) => updateSetting('showProgressBar', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Show progress bar</span>
              <p className="text-xs text-gray-600">Display completion progress to respondents</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.allowSaveAndContinue || false}
              onChange={(e) => updateSetting('allowSaveAndContinue', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Allow save and continue later</span>
              <p className="text-xs text-gray-600">Users can save partial responses and complete later</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.randomizeQuestions || false}
              onChange={(e) => updateSetting('randomizeQuestions', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Randomize question order</span>
              <p className="text-xs text-gray-600">Questions will appear in random order for each respondent</p>
            </div>
          </label>
        </div>
      </div>

      {/* Timing Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timing & Availability
        </h3>
        
        <div className="space-y-4 pl-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={settings.deadline || ''}
              onChange={(e) => updateSetting('deadline', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Survey will automatically close at this date and time
            </p>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => updateSetting('isActive', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Publish immediately</span>
              <p className="text-xs text-gray-600">Make survey available to respondents right away</p>
            </div>
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Notifications & Data
        </h3>
        
        <div className="space-y-3 pl-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.sendNotifications || false}
              onChange={(e) => updateSetting('sendNotifications', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Send notifications</span>
              <p className="text-xs text-gray-600">Notify target audience when survey is published</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.collectMetadata || false}
              onChange={(e) => updateSetting('collectMetadata', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Collect response metadata</span>
              <p className="text-xs text-gray-600">Record submission time, device info, etc. (respects anonymity setting)</p>
            </div>
          </label>

          <div className="rounded-2xl border border-dashed border-gray-200 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Publish notifications</p>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.sendOnPublish}
                onChange={(e) => updateSetting('sendOnPublish', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Notify targeted members immediately when the survey goes live
            </label>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 p-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-900">
              <span>Send reminder nudges</span>
              <input
                type="checkbox"
                checked={settings.sendReminders}
                onChange={(e) => updateSetting('sendReminders', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">Choose when automatic reminders go out</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[7, 3, 1].map((day) => {
                const isActive = settings.reminderDays?.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleReminderDay(day)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:text-primary-700'
                    }`}
                    disabled={!settings.sendReminders}
                  >
                    {day} day{day === 1 ? '' : 's'} before
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Settings Summary</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Responses will be {settings.isAnonymous ? 'anonymous' : 'identified'}</p>
          <p>• {settings.allowMultipleResponses ? 'Multiple responses allowed' : 'One response per person'}</p>
          {settings.deadline && (
            <p>• Closes on {new Date(settings.deadline).toLocaleDateString()} at {new Date(settings.deadline).toLocaleTimeString()}</p>
          )}
          <p>• Survey is {settings.isActive ? 'active and accepting responses' : 'inactive (draft mode)'}</p>
          <p>• {settings.sendOnPublish ? 'Members get an instant publish notification' : 'No publish notification will be sent'}</p>
          <p>
            • {settings.sendReminders && settings.reminderDays?.length
              ? `Reminders scheduled ${settings.reminderDays.map((day) => `${day}d`).join(', ')} before deadline`
              : 'Reminders are disabled'}
          </p>
        </div>
      </div>
    </div>
  )
}