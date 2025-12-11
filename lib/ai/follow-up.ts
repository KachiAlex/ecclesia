import { UserService } from '../services/user-service'
import { ChurchService } from '../services/church-service'
import { db } from '../firestore'
import { COLLECTIONS } from '../firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import { getSpiritualCoachingResponse } from './openai'

/**
 * Automatically assign mentor to new convert
 */
export async function assignMentorToNewConvert(userId: string) {
  try {
    const user = await UserService.findById(userId)

    if (!user || !user.churchId) {
      return null
    }

    // Get all users in church
    const churchUsers = await UserService.findByChurch(user.churchId)
    
    // Find potential mentors (LEADER or PASTOR)
    const potentialMentors = churchUsers.filter(u => 
      ['LEADER', 'PASTOR'].includes(u.role)
    )

    if (potentialMentors.length === 0) {
      return null
    }

    // Get mentee counts for each mentor
    const mentorsWithCounts = await Promise.all(
      potentialMentors.map(async (mentor) => {
        const assignments = await db.collection(COLLECTIONS.mentorAssignments)
          .where('mentorId', '==', mentor.id)
          .where('status', '==', 'Active')
          .count()
          .get()
        
        return {
          ...mentor,
          menteeCount: assignments.data().count || 0,
        }
      })
    )

    // Sort by mentee count and get the one with fewest
    mentorsWithCounts.sort((a, b) => a.menteeCount - b.menteeCount)
    const mentor = mentorsWithCounts[0]

    // Check if assignment already exists
    const existingSnapshot = await db.collection(COLLECTIONS.mentorAssignments)
      .where('mentorId', '==', mentor.id)
      .where('menteeId', '==', userId)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0]
      return {
        id: existingDoc.id,
        ...existingDoc.data(),
        mentor: {
          id: mentor.id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          email: mentor.email,
        },
      }
    }

    // Create mentor assignment
    const assignmentRef = db.collection(COLLECTIONS.mentorAssignments).doc()
    await assignmentRef.set({
      mentorId: mentor.id,
      menteeId: userId,
      status: 'Active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      id: assignmentRef.id,
      mentorId: mentor.id,
      menteeId: userId,
      status: 'Active',
      mentor: {
        id: mentor.id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        email: mentor.email,
      },
    }
  } catch (error) {
    console.error('Error assigning mentor:', error)
    return null
  }
}

/**
 * Generate daily follow-up messages for new converts
 */
export async function generateDailyFollowUp(userId: string, dayNumber: number) {
  try {
    const user = await UserService.findById(userId)

    if (!user) {
      return null
    }

    const prompts = [
      'Welcome to the family! Here\'s your first day encouragement and a Bible verse.',
      'Day 2: Let\'s talk about prayer and how to develop a prayer life.',
      'Day 3: Understanding the Bible and how to read it effectively.',
      'Day 4: The importance of fellowship and community.',
      'Day 5: Growing in faith and overcoming doubts.',
      'Day 6: Understanding God\'s love and grace.',
      'Day 7: Your first week milestone! Reflection and encouragement.',
    ]

    const prompt =
      prompts[dayNumber - 1] ||
      `Day ${dayNumber}: Continue your spiritual journey with encouragement and guidance.`

    const message = await getSpiritualCoachingResponse(
      `Generate a personalized daily follow-up message for ${user?.firstName || 'there'}, day ${dayNumber} of their journey. ${prompt}`,
      {
        userMaturity: (user as any)?.spiritualMaturity || undefined,
      }
    )

    // Extract scripture
    const scriptureMatch = message.match(/(\d+\s*[A-Za-z]+\s*\d+:\d+)/)
    const scripture = scriptureMatch ? scriptureMatch[1] : null

    return {
      message,
      scripture,
    }
  } catch (error) {
    console.error('Error generating daily follow-up:', error)
    return null
  }
}

/**
 * Schedule follow-ups for a new convert (7 days)
 */
export async function scheduleNewConvertFollowUps(userId: string) {
  try {
    const followUps = []

    for (let day = 1; day <= 7; day++) {
      const followUp = await generateDailyFollowUp(userId, day)
      if (followUp) {
        const followUpRef = db.collection(COLLECTIONS.followUps).doc()
        await followUpRef.set({
          userId,
          type: 'New Convert',
          message: followUp.message,
          scripture: followUp.scripture,
          sentAt: new Date(Date.now() + day * 24 * 60 * 60 * 1000), // Schedule for future
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        
        const record = {
          id: followUpRef.id,
          userId,
          type: 'New Convert',
          message: followUp.message,
          scripture: followUp.scripture,
          sentAt: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
        }
        followUps.push(record)
      }
    }

    // Assign mentor
    await assignMentorToNewConvert(userId)

    return followUps
  } catch (error) {
    console.error('Error scheduling follow-ups:', error)
    return []
  }
}

