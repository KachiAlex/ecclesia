import { prisma } from '@/lib/prisma'

export interface BirthdayAlert {
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  dateOfBirth: Date
  upcomingBirthday: Date
  ageTurning: number
  daysUntilBirthday: number
  profileImage: string | null
}

export class AIAssistantService {
  /**
   * Get all upcoming birthdays for a church within the next N days
   */
  static async getUpcomingBirthdays(churchId: string, daysAhead: number = 30): Promise<BirthdayAlert[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + daysAhead)

    const users = await prisma.user.findMany({
      where: {
        churchId,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        profileImage: true,
      },
    })

    const alerts: BirthdayAlert[] = []

    for (const user of users) {
      if (!user.dateOfBirth) continue

      const dob = new Date(user.dateOfBirth)
      const upcomingBirthday = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate()
      )

      if (upcomingBirthday < today) {
        upcomingBirthday.setFullYear(today.getFullYear() + 1)
      }

      if (upcomingBirthday <= endDate) {
        const diffMs = upcomingBirthday.getTime() - today.getTime()
        const daysUntilBirthday = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        const ageTurning = upcomingBirthday.getFullYear() - dob.getFullYear()

        alerts.push({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: dob,
          upcomingBirthday,
          ageTurning,
          daysUntilBirthday,
          profileImage: user.profileImage,
        })
      }
    }

    return alerts.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)
  }

  /**
   * Generate birthday notifications for all churches
   * Called by a cron job or scheduled task
   */
  static async generateBirthdayNotifications(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const churches = await prisma.church.findMany({
      select: { id: true, name: true },
    })

    let created = 0

    for (const church of churches) {
      const upcoming = await this.getUpcomingBirthdays(church.id, 7)

      for (const alert of upcoming) {
        const notificationDate = new Date(alert.upcomingBirthday)
        notificationDate.setHours(8, 0, 0, 0)

        const existing = await prisma.notification.findFirst({
          where: {
            churchId: church.id,
            userId: alert.userId,
            type: 'BIRTHDAY',
            scheduledFor: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            },
          },
        })

        if (existing) continue

        await prisma.notification.create({
          data: {
            churchId: church.id,
            userId: alert.userId,
            type: 'BIRTHDAY',
            title: `Birthday: ${alert.firstName} ${alert.lastName}`,
            message: `${alert.firstName} ${alert.lastName} turns ${alert.ageTurning} ${alert.daysUntilBirthday === 0 ? 'today' : `in ${alert.daysUntilBirthday} day(s)`}. Send them a birthday message!`,
            actionUrl: `/messages?to=${alert.userId}`,
            actionLabel: 'Send Message',
            metadata: {
              ageTurning: alert.ageTurning,
              daysUntilBirthday: alert.daysUntilBirthday,
              dateOfBirth: alert.dateOfBirth.toISOString(),
            },
            scheduledFor: notificationDate,
          },
        })
        created++
      }
    }

    return created
  }

  /**
   * Get pending notifications for a user
   */
  static async getUserNotifications(userId: string, limit: number = 10) {
    const now = new Date()

    return prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
    })
  }

  /**
   * Get pending notifications for church admins (church-wide + their own)
   */
  static async getChurchNotifications(churchId: string, limit: number = 20) {
    const now = new Date()

    return prisma.notification.findMany({
      where: {
        churchId,
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
    })
  }

  /**
   * Mark a notification as dismissed
   */
  static async dismissNotification(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
      },
    })
  }

  /**
   * Mark a notification as acted on
   */
  static async actOnNotification(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'ACTED_ON' },
    })
  }

  /**
   * Mark notifications as sent (after being viewed)
   */
  static async markAsSent(notificationIds: string[]) {
    if (notificationIds.length === 0) return

    await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  }

  /**
   * Generate a personalized birthday message using AI
   */
  static async generateBirthdayMessage(
    firstName: string,
    lastName: string,
    ageTurning: number,
    churchName: string
  ): Promise<string> {
    const openaiApiKey = process.env.OPENAI_API_KEY
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY

    const prompt = `Write a warm, personalized birthday message for ${firstName} ${lastName} who is turning ${ageTurning} today. They are a member of ${churchName}. Keep it concise (2-3 sentences), uplifting, and spiritually encouraging. Do not use placeholders.`

    if (deepseekApiKey) {
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
          }),
        })
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content.trim()
        }
      } catch (e) {
        console.error('DeepSeek API error:', e)
      }
    }

    if (openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
          }),
        })
        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content.trim()
        }
      } catch (e) {
        console.error('OpenAI API error:', e)
      }
    }

    return `Happy Birthday, ${firstName}! May God bless you abundantly on this special day and throughout the year ahead. You are a cherished member of ${churchName}, and we celebrate the gift of you!`
  }
}
