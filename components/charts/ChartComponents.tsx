'use client'

import React, { useMemo } from 'react'
import { ChartDataPoint, ChartConfig, CHART_COLORS } from '@/lib/types/chart-types'

/**
 * Line Chart Component
 */
export function LineChart({ config }: { config: ChartConfig }) {
  const { datasets, height = 300, yAxisLabel, showGrid = true, showTooltip = true } = config

  const { minY, maxY, points } = useMemo(() => {
    const allValues = datasets.flatMap((d) => d.data.map((p) => p.value))
    const min = Math.min(...allValues) * 0.9
    const max = Math.max(...allValues) * 1.1
    const dataPoints = datasets.map((dataset) => ({
      label: dataset.label,
      color: dataset.borderColor || CHART_COLORS.primary,
      points: dataset.data,
    }))
    return { minY: min, maxY: max, points: dataPoints }
  }, [datasets])

  const width = 800
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const scaleX = chartWidth / (datasets[0]?.data.length || 1 - 1 || 1)
  const scaleY = chartHeight / (maxY - minY || 1)

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={height} className="border border-gray-300 rounded-lg">
        {/* Grid */}
        {showGrid && (
          <>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = padding + (chartHeight / 4) * i
              return (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              )
            })}
          </>
        )}

        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />

        {/* X-axis */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Y-axis label */}
        {yAxisLabel && (
          <text x="20" y="30" fontSize="12" fill="#1f2937" textAnchor="middle">
            {yAxisLabel}
          </text>
        )}

        {/* Lines */}
        {points.map((series, seriesIdx) => {
          const pathData = series.points
            .map((point, idx) => {
              const x = padding + idx * scaleX
              const y = height - padding - (point.value - minY) * scaleY
              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
            })
            .join(' ')

          return (
            <g key={`series-${seriesIdx}`}>
              <path d={pathData} fill="none" stroke={series.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />

              {/* Data points */}
              {series.points.map((point, idx) => {
                const x = padding + idx * scaleX
                const y = height - padding - (point.value - minY) * scaleY

                return (
                  <circle
                    key={`point-${idx}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={series.color}
                    className="hover:r-6 transition-all"
                  >
                    {showTooltip && <title>{point.label || point.value.toFixed(0)}</title>}
                  </circle>
                )
              })}
            </g>
          )
        })}

        {/* Legend */}
        {points.map((series, idx) => (
          <g key={`legend-${idx}`}>
            <rect x={width - 200} y={padding + idx * 25} width="15" height="15" fill={series.color} />
            <text x={width - 180} y={padding + idx * 25 + 12} fontSize="12" fill="#1f2937">
              {series.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/**
 * Bar Chart Component
 */
export function BarChart({ config }: { config: ChartConfig }) {
  const { datasets, height = 300, yAxisLabel, showGrid = true, showTooltip = true } = config

  const { minY, maxY } = useMemo(() => {
    const allValues = datasets.flatMap((d) => d.data.map((p) => p.value))
    const min = Math.min(...allValues) * 0.9
    const max = Math.max(...allValues) * 1.1
    return { minY: min, maxY: max }
  }, [datasets])

  const width = 800
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const barWidth = (chartWidth / (datasets[0]?.data.length || 1)) / (datasets.length + 1)
  const scaleY = chartHeight / (maxY - minY || 1)

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={height} className="border border-gray-300 rounded-lg">
        {/* Grid */}
        {showGrid && (
          <>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = padding + (chartHeight / 4) * i
              return (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              )
            })}
          </>
        )}

        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Y-axis label */}
        {yAxisLabel && (
          <text x="20" y="30" fontSize="12" fill="#1f2937" textAnchor="middle">
            {yAxisLabel}
          </text>
        )}

        {/* Bars */}
        {datasets.map((dataset, datasetIdx) =>
          dataset.data.map((point, pointIdx) => {
            const x = padding + (pointIdx + 1) * (chartWidth / (dataset.data.length + 1)) + datasetIdx * barWidth
            const barHeight = (point.value - minY) * scaleY
            const y = height - padding - barHeight

            return (
              <rect
                key={`bar-${datasetIdx}-${pointIdx}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={dataset.backgroundColor || CHART_COLORS.primary}
                className="hover:opacity-80 transition-opacity"
              >
                {showTooltip && <title>{point.label || point.value.toFixed(0)}</title>}
              </rect>
            )
          })
        )}

        {/* Legend */}
        {datasets.map((dataset, idx) => (
          <g key={`legend-${idx}`}>
            <rect x={width - 200} y={padding + idx * 25} width="15" height="15" fill={dataset.backgroundColor || CHART_COLORS.primary} />
            <text x={width - 180} y={padding + idx * 25 + 12} fontSize="12" fill="#1f2937">
              {dataset.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/**
 * Pie Chart Component
 */
export function PieChart({ config }: { config: ChartConfig }) {
  const { datasets, height = 300, showTooltip = true } = config

  const data = datasets[0]?.data || []
  const total = data.reduce((sum, p) => sum + p.value, 0)

  const width = height
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3

  const colors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.secondary,
    CHART_COLORS.danger,
    CHART_COLORS.info,
  ]

  let currentAngle = -Math.PI / 2

  return (
    <div className="w-full flex flex-col items-center">
      <svg width={width} height={height} className="border border-gray-300 rounded-lg">
        {data.map((point, idx) => {
          const sliceAngle = (point.value / total) * 2 * Math.PI
          const startAngle = currentAngle
          const endAngle = currentAngle + sliceAngle

          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(endAngle)
          const y2 = centerY + radius * Math.sin(endAngle)

          const largeArc = sliceAngle > Math.PI ? 1 : 0
          const pathData = `
            M ${centerX} ${centerY}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
          `

          const color = colors[idx % colors.length]
          currentAngle = endAngle

          return (
            <path
              key={`slice-${idx}`}
              d={pathData}
              fill={color}
              className="hover:opacity-80 transition-opacity"
            >
              {showTooltip && <title>{point.label} ({((point.value / total) * 100).toFixed(1)}%)</title>}
            </path>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {data.map((point, idx) => (
          <div key={`legend-${idx}`} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span className="text-sm">{point.label} ({((point.value / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Area Chart Component
 */
export function AreaChart({ config }: { config: ChartConfig }) {
  const { datasets, height = 300, yAxisLabel } = config

  const { minY, maxY, points } = useMemo(() => {
    const allValues = datasets.flatMap((d) => d.data.map((p) => p.value))
    const min = Math.min(...allValues) * 0.9
    const max = Math.max(...allValues) * 1.1
    const dataPoints = datasets.map((dataset) => ({
      label: dataset.label,
      color: dataset.backgroundColor || CHART_COLORS.primary,
      points: dataset.data,
    }))
    return { minY: min, maxY: max, points: dataPoints }
  }, [datasets])

  const width = 800
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const scaleX = chartWidth / (datasets[0]?.data.length - 1 || 1)
  const scaleY = chartHeight / (maxY - minY || 1)

  return (
    <div className="w-full overflow-auto">
      <svg width={width} height={height} className="border border-gray-300 rounded-lg">
        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1f2937" strokeWidth="2" />

        {/* Y-axis label */}
        {yAxisLabel && (
          <text x="20" y="30" fontSize="12" fill="#1f2937" textAnchor="middle">
            {yAxisLabel}
          </text>
        )}

        {/* Areas */}
        {points.map((series, seriesIdx) => {
          const areaPoints = series.points
            .map((point, idx) => {
              const x = padding + idx * scaleX
              const y = height - padding - (point.value - minY) * scaleY
              return [x, y]
            })
            .flat()

          const pathData = `M ${padding} ${height - padding} L ${series.points
            .map((point, idx) => {
              const x = padding + idx * scaleX
              const y = height - padding - (point.value - minY) * scaleY
              return `${x} ${y}`
            })
            .join(' L ')} L ${width - padding} ${height - padding} Z`

          return (
            <g key={`area-${seriesIdx}`}>
              <path d={pathData} fill={series.color} fillOpacity="0.3" />
              <path
                d={`M ${series.points
                  .map((point, idx) => {
                    const x = padding + idx * scaleX
                    const y = height - padding - (point.value - minY) * scaleY
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                  })
                  .join(' ')}`}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
              />
            </g>
          )
        })}

        {/* Legend */}
        {points.map((series, idx) => (
          <g key={`legend-${idx}`}>
            <rect x={width - 200} y={padding + idx * 25} width="15" height="15" fill={series.color} />
            <text x={width - 180} y={padding + idx * 25 + 12} fontSize="12" fill="#1f2937">
              {series.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
