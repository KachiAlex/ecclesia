/**
 * Email Templates
 * Reusable email templates for the application
 */

export const EmailTemplates = {
  /**
   * Password Reset Email Template
   */
  passwordReset: (resetUrl: string, userName?: string) => ({
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Ecclesia</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Ecclesia. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Donation Receipt Email Template
   */
  donationReceipt: (
    receiptData: {
      amount: number
      type: string
      projectName?: string
      transactionId?: string
      date: Date
      receiptUrl?: string
    },
    userName?: string
  ) => ({
    subject: 'Thank You for Your Donation',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Ecclesia</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Thank You for Your Generosity!</h2>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>We are grateful for your donation. Here are the details:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1f2937;">$${receiptData.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Type:</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">${receiptData.type}</td>
                </tr>
                ${receiptData.projectName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Project:</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">${receiptData.projectName}</td>
                </tr>
                ` : ''}
                ${receiptData.transactionId ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Transaction ID:</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 12px;">${receiptData.transactionId}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                  <td style="padding: 8px 0; text-align: right; color: #1f2937;">${receiptData.date.toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            ${receiptData.receiptUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${receiptData.receiptUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Download Receipt</a>
            </div>
            ` : ''}
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Your generosity makes a difference. Thank you for supporting our mission!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Ecclesia. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  }),
}

