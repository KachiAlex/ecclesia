/**
 * Phase 4.2: Export Service
 * Handles PDF and CSV export of analytics data
 */

import PDFDocument from 'pdfkit'
import { Readable } from 'stream'
import { ChartDataPoint, ChartConfig } from '@/lib/types/chart-types'
import { format } from 'date-fns'

/**
 * PDF Export options
 */
export interface PDFExportOptions {
  title: string
  subtitle?: string
  includeChart?: boolean
  includeData?: boolean
  includeMetadata?: boolean
  chartImage?: Buffer
  metrics?: {
    totalValue?: number
    averageValue?: number
    peakValue?: number
  }
}

/**
 * CSV Export options
 */
export interface CSVExportOptions {
  filename?: string
  includeTimestamp?: boolean
  dateFormat?: string
}

/**
 * Export Service
 */
export class ExportService {
  /**
   * Generate PDF document from chart data
   */
  static async generatePDF(
    data: ChartDataPoint[],
    config: ChartConfig,
    options: PDFExportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const doc = new PDFDocument()

      // Collect data
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(options.title || 'Analytics Report', { align: 'center' })

      if (options.subtitle) {
        doc.fontSize(12).font('Helvetica').text(options.subtitle, { align: 'center' })
      }

      // Date range
      const startDate = config.startDate ? format(new Date(config.startDate), 'MMM dd, yyyy') : 'N/A'
      const endDate = config.endDate ? format(new Date(config.endDate), 'MMm dd, yyyy') : 'N/A'
      doc.fontSize(10).text(`Period: ${startDate} - ${endDate}`, { align: 'center' })

      doc.moveDown()

      // Metrics summary
      if (options.metrics && options.includeMetadata) {
        doc.fontSize(12).font('Helvetica-Bold').text('Summary Metrics')
        doc.fontSize(10).font('Helvetica')

        if (options.metrics.totalValue !== undefined) {
          doc.text(`Total Value: ${options.metrics.totalValue.toFixed(2)}`)
        }
        if (options.metrics.averageValue !== undefined) {
          doc.text(`Average Value: ${options.metrics.averageValue.toFixed(2)}`)
        }
        if (options.metrics.peakValue !== undefined) {
          doc.text(`Peak Value: ${options.metrics.peakValue.toFixed(2)}`)
        }

        doc.moveDown()
      }

      // Data table
      if (options.includeData && data.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Data Points')
        doc.fontSize(9).font('Helvetica')

        // Table headers
        const colX = [50, 150, 250, 350]
        const rowHeight = 20
        let Y = doc.y

        const headers = ['Date/Time', 'Label', 'Value', 'Notes']
        headers.forEach((header, i) => {
          doc.text(header, colX[i], Y)
        })

        Y += rowHeight
        doc.moveTo(40, Y).lineTo(550, Y).stroke()
        Y += 5

        // Table rows
        data.slice(0, 20).forEach((point) => {
          const time = typeof point.time === 'string' ? point.time : format(new Date(point.time), 'MMM dd HH:mm')
          const row = [time, point.label || '-', point.value.toFixed(2), '']

          row.forEach((cell, i) => {
            doc.text(cell, colX[i], Y)
          })

          Y += rowHeight

          // Prevent going off page
          if (Y > 700) {
            doc.addPage()
            Y = 50
          }
        })

        if (data.length > 20) {
          doc.text(`... and ${data.length - 20} more rows`, colX[0], Y)
        }
      }

      // Footer
      doc.fontSize(8)
      const footerY = doc.page.height - 30
      doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}`, 50, footerY, {
        align: 'center',
      })

      // Finalize
      doc.end()
    })
  }

  /**
   * Generate CSV from chart data
   */
  static async generateCSV(data: ChartDataPoint[], config: ChartConfig, options: CSVExportOptions = {}): Promise<string> {
    const { includeTimestamp = true, dateFormat = 'yyyy-MM-dd HH:mm:ss' } = options

    // CSV Headers
    const headers = ['Date/Time', 'Label', 'Value', 'Metadata']
    let csv = headers.join(',') + '\n'

    // CSV Rows
    data.forEach((point) => {
      const time = typeof point.time === 'string' ? point.time : format(new Date(point.time), dateFormat)
      const label = this.escapeCsvValue(point.label || '')
      const value = point.value.toFixed(2)
      const metadata = point.metadata ? this.escapeCsvValue(JSON.stringify(point.metadata)) : ''

      csv += `${time},${label},${value},${metadata}\n`
    })

    // Summary section
    if (includeTimestamp) {
      csv += `\n# Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}\n`
      csv += `# Chart Config: ${config.title}\n`
      csv += `# Period: ${config.startDate} to ${config.endDate}\n`
      csv += `# Total Records: ${data.length}\n`
    }

    return csv
  }

  /**
   * Escape CSV values that contain special characters
   */
  private static escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"` 
    }
    return value
  }

  /**
   * Generate JSON export
   */
  static async generateJSON(data: ChartDataPoint[], config: ChartConfig): Promise<string> {
    const exportData = {
      metadata: {
        title: config.title,
        subtitle: config.subtitle,
        startDate: config.startDate,
        endDate: config.endDate,
        timeInterval: config.timeInterval,
        generatedAt: new Date().toISOString(),
        recordCount: data.length,
      },
      data: data,
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Create download stream for file
   */
  static createDownloadStream(content: Buffer | string, filename: string): { stream: Readable; filename: string } {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content
    const stream = Readable.from([buffer])

    return {
      stream,
      filename,
    }
  }

  /**
   * Format filename with timestamp
   */
  static formatFilename(baseName: string, extension: string, timestamp: boolean = true): string {
    if (timestamp) {
      const ts = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      return `${baseName}_${ts}.${extension}`
    }
    return `${baseName}.${extension}`
  }

  /**
   * Validate export data
   */
  static validateExportData(data: ChartDataPoint[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(data)) {
      errors.push('Data must be an array')
    }

    if (data.length === 0) {
      errors.push('Data array is empty')
    }

    data.forEach((point, index) => {
      if (!point.hasOwnProperty('time')) {
        errors.push(`Point ${index}: missing 'time' property`)
      }
      if (!point.hasOwnProperty('value')) {
        errors.push(`Point ${index}: missing 'value' property`)
      }
      if (typeof point.value !== 'number') {
        errors.push(`Point ${index}: value must be a number`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
