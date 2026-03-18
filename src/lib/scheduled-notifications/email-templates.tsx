/**
 * Email Templates for Recommendation Digests
 * React Email components for generating HTML emails
 */

'use client'

import React from 'react'
import { EmailDigest, EmailDigestSection } from './types'

export const RecommendationDigestEmail: React.FC<{
  digest: EmailDigest
  isDark?: boolean
}> = ({ digest, isDark = false }) => {
  const bgColor = isDark ? '#1f2937' : '#ffffff'
  const textColor = isDark ? '#f3f4f6' : '#111827'
  const mutedColor = isDark ? '#9ca3af' : '#6b7280'
  const accentColor = '#3b82f6'

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>{digest.subject}</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: ${isDark ? '#111827' : '#f9fafb'};
            color: ${textColor};
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${bgColor};
          }
          .header {
            background: linear-gradient(135deg, ${accentColor}, #2563eb);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header-logo {
            max-width: 60px;
            margin: 0 auto 16px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header .subtext {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 4px;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 24px;
            color: ${textColor};
          }
          .section {
            margin-bottom: 24px;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            border-radius: 8px;
            overflow: hidden;
          }
          .section-header {
            background-color: ${isDark ? '#374151' : '#f3f4f6'};
            padding: 12px 16px;
            border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          }
          .section-header-title {
            font-weight: 600;
            font-size: 14px;
            color: ${accentColor};
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-body {
            padding: 16px;
          }
          .section-content {
            color: ${textColor};
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 12px;
            margin-top: 12px;
          }
          .stat {
            background-color: ${isDark ? '#1f2937' : '#f9fafb'};
            padding: 12px;
            border-radius: 6px;
            text-align: center;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: ${accentColor};
          }
          .stat-label {
            font-size: 12px;
            color: ${mutedColor};
            margin-top: 4px;
          }
          .action-button {
            display: inline-block;
            background-color: ${accentColor};
            color: white;
            padding: 10px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            margin-top: 12px;
          }
          .action-button:hover {
            background-color: #2563eb;
          }
          .footer {
            background-color: ${isDark ? '#111827' : '#f9fafb'};
            padding: 24px;
            text-align: center;
            border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            font-size: 12px;
            color: ${mutedColor};
          }
          .footer-text {
            margin: 0;
            line-height: 1.5;
          }
          .unsubscribe {
            margin-top: 12px;
          }
          .unsubscribe a {
            color: ${accentColor};
            text-decoration: none;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            {digest.churchLogo && (
              <img src={digest.churchLogo} alt={digest.churchName} className="header-logo" />
            )}
            <h1>{digest.churchName}</h1>
            <p className="subtext">{digest.subject}</p>
          </div>

          {/* Main Content */}
          <div className="content">
            <p className="greeting">{digest.greeting}</p>

            {/* Sections */}
            {digest.sections.map((section, idx) => (
              <div key={idx} className="section">
                <div className="section-header">
                  <h2 className="section-header-title">
                    {section.icon && <span>{section.icon}</span>}
                    {section.title}
                  </h2>
                </div>
                <div className="section-body">
                  <div className="section-content">{section.content}</div>

                  {/* Stats Grid */}
                  {section.stats && section.stats.length > 0 && (
                    <div className="stats">
                      {section.stats.map((stat, statIdx) => (
                        <div key={statIdx} className="stat">
                          <div className="stat-value">{stat.value}</div>
                          <div className="stat-label">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  {section.actionUrl && (
                    <a href={section.actionUrl} className="action-button">
                      {section.actionText || 'View Details'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="footer">
            <p className="footer-text">{digest.footerText}</p>
            <div className="unsubscribe">
              <a href={digest.unsubscribeUrl}>Unsubscribe from these emails</a>
            </div>
            <p className="footer-text">
              © {new Date().getFullYear()} {digest.churchName}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

/**
 * Compact digest format - minimal details
 */
export const CompactDigestEmail: React.FC<{ digest: EmailDigest }> = ({ digest }) => {
  return <RecommendationDigestEmail digest={digest} />
}

/**
 * Detailed digest format - full information
 */
export const DetailedDigestEmail: React.FC<{ digest: EmailDigest }> = ({ digest }) => {
  return <RecommendationDigestEmail digest={digest} />
}

/**
 * Summary digest format - highlights only
 */
export const SummaryDigestEmail: React.FC<{ digest: EmailDigest }> = ({ digest }) => {
  return <RecommendationDigestEmail digest={digest} isDark />
}

/**
 * Generate digest HTML from digest object
 */
export function generateDigestHTML(digest: EmailDigest, isDark: boolean = false): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>${digest.subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: ${isDark ? '#111827' : '#f9fafb'};
          color: ${isDark ? '#f3f4f6' : '#111827'};
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: ${isDark ? '#1f2937' : '#ffffff'};
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .content {
          padding: 32px 24px;
        }
        .section {
          margin-bottom: 24px;
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
        }
        .section-header {
          background-color: ${isDark ? '#374151' : '#f3f4f6'};
          padding: 12px 16px;
          border-bottom: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        }
        .section-header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #3b82f6;
        }
        .section-body {
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer {
          background-color: ${isDark ? '#111827' : '#f9fafb'};
          padding: 24px;
          text-align: center;
          border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          font-size: 12px;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${digest.churchName}</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${digest.subject}</p>
        </div>
        <div class="content">
          <p>${digest.greeting}</p>
          ${digest.sections
            .map(
              (section) => `
            <div class="section">
              <div class="section-header">
                <h2>${section.icon ? section.icon + ' ' : ''}${section.title}</h2>
              </div>
              <div class="section-body">
                ${section.content}
                ${
                  section.actionUrl
                    ? `<p><a href="${section.actionUrl}" style="background: #3b82f6; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 12px;">${
                        section.actionText || 'View Details'
                      }</a></p>`
                    : ''
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="footer">
          <p>${digest.footerText}</p>
          <p style="margin-top: 12px;"><a href="${digest.unsubscribeUrl}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}
