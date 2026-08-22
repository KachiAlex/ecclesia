'use client'

interface UsageStatsProps {
  usage: {
    userCount: number
    storageUsedGB: number
    sermonsCount: number
    eventsCount: number
  }
  limits: {
    maxUsers?: number
    maxStorageGB?: number
    maxSermons?: number
    maxEvents?: number
  }
}

export default function UsageStats({ usage, limits }: UsageStatsProps) {
  const getPercentage = (current: number, limit?: number) => {
    if (!limit) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const stats = [
    {
      label: 'Users',
      current: usage.userCount,
      limit: limits.maxUsers,
      unit: '',
    },
    {
      label: 'Storage',
      current: usage.storageUsedGB,
      limit: limits.maxStorageGB,
      unit: 'GB',
    },
    {
      label: 'Sermons',
      current: usage.sermonsCount,
      limit: limits.maxSermons,
      unit: '',
    },
    {
      label: 'Events',
      current: usage.eventsCount,
      limit: limits.maxEvents,
      unit: '',
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const percentage = getPercentage(stat.current, stat.limit)
          const isUnlimited = !stat.limit

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                <span className="text-sm text-gray-600">
                  {stat.current.toLocaleString()}
                  {stat.unit} {isUnlimited ? '' : `/ ${stat.limit?.toLocaleString()}${stat.unit}`}
                </span>
              </div>
              {!isUnlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              )}
              {isUnlimited && (
                <div className="text-xs text-gray-500">Unlimited</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

