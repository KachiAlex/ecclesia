import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set. AI features will be disabled.')
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

/**
 * Get AI spiritual coaching response
 */
export async function getSpiritualCoachingResponse(
  question: string,
  context?: {
    userMaturity?: string
    recentTopics?: string[]
    churchContext?: string
  }
): Promise<string> {
  if (!openai) {
    return 'AI coaching is not available. Please configure OPENAI_API_KEY.'
  }

  try {
    const systemPrompt = `You are a wise, compassionate spiritual coach helping Christians grow in their faith. 
Your responses should be:
- Bible-based and theologically sound
- Encouraging and supportive
- Practical and actionable
- Appropriate for the user's spiritual maturity level
- Focused on discipleship and spiritual growth

Always reference specific Bible verses when relevant. Be warm, understanding, and guide users toward deeper relationship with God.`

    const userPrompt = context?.userMaturity
      ? `User's spiritual maturity: ${context.userMaturity}\n\nQuestion: ${question}`
      : question

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to get AI response: ' + error.message)
  }
}

/**
 * Generate personalized reading plan recommendations
 */
export async function recommendReadingPlans(
  userProfile: {
    spiritualMaturity?: string
    interests?: string[]
    completedPlans?: string[]
    preferredDuration?: number
  }
): Promise<{
  recommendations: Array<{
    title: string
    description: string
    duration: number
    topics: string[]
    difficulty: string
    reason: string
  }>
}> {
  if (!openai) {
    return {
      recommendations: [
        {
          title: '30-Day New Believer Plan',
          description: 'A foundational reading plan for new Christians',
          duration: 30,
          topics: ['Salvation', 'Faith', 'Prayer'],
          difficulty: 'Beginner',
          reason: 'Recommended for new believers',
        },
      ],
    }
  }

  try {
    const prompt = `Based on this user profile, recommend 3-5 Bible reading plans:
- Spiritual Maturity: ${userProfile.spiritualMaturity || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Completed Plans: ${userProfile.completedPlans?.join(', ') || 'None'}
- Preferred Duration: ${userProfile.preferredDuration || 30} days

For each recommendation, provide:
1. Title
2. Description (2-3 sentences)
3. Duration in days
4. Topics covered (array)
5. Difficulty level (Beginner/Intermediate/Advanced)
6. Reason for recommendation

Return as JSON array.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a Bible reading plan expert. Provide recommendations in valid JSON format only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      recommendations: parsed.recommendations || [],
    }
  } catch (error: any) {
    console.error('Error generating reading plan recommendations:', error)
    return {
      recommendations: [],
    }
  }
}

/**
 * Generate AI summary of sermon content
 */
export async function generateSermonSummary(
  sermonText: string,
  title?: string
): Promise<{
  summary: string
  topics: string[]
  keyPoints: string[]
  scriptureReferences: string[]
}> {
  if (!openai) {
    return {
      summary: 'AI summary not available.',
      topics: [],
      keyPoints: [],
      scriptureReferences: [],
    }
  }

  try {
    const prompt = `Analyze this sermon${title ? ` titled "${title}"` : ''} and provide:
1. A concise summary (2-3 paragraphs)
2. Main topics/themes (array)
3. Key points (array of 3-5 points)
4. Scripture references mentioned (array)

Sermon content:
${sermonText}

Return as JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a sermon analysis expert. Extract key information and return as JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      summary: parsed.summary || '',
      topics: parsed.topics || [],
      keyPoints: parsed.keyPoints || [],
      scriptureReferences: parsed.scriptureReferences || [],
    }
  } catch (error: any) {
    console.error('Error generating sermon summary:', error)
    throw new Error('Failed to generate sermon summary')
  }
}

/**
 * Generate personalized spiritual growth plan
 */
export async function generateSpiritualGrowthPlan(
  userProfile: {
    spiritualMaturity?: string
    currentPractices?: string[]
    goals?: string[]
    challenges?: string[]
  }
): Promise<{
  plan: {
    dailyPractices: string[]
    weeklyPractices: string[]
    monthlyGoals: string[]
    recommendedResources: string[]
    milestones: string[]
  }
}> {
  if (!openai) {
    return {
      plan: {
        dailyPractices: ['Prayer', 'Bible reading'],
        weeklyPractices: ['Church attendance', 'Small group'],
        monthlyGoals: ['Complete a reading plan'],
        recommendedResources: [],
        milestones: [],
      },
    }
  }

  try {
    const prompt = `Create a personalized spiritual growth plan for a Christian with:
- Spiritual Maturity: ${userProfile.spiritualMaturity || 'Not specified'}
- Current Practices: ${userProfile.currentPractices?.join(', ') || 'None'}
- Goals: ${userProfile.goals?.join(', ') || 'Not specified'}
- Challenges: ${userProfile.challenges?.join(', ') || 'None'}

Provide:
1. Daily practices (3-5 items)
2. Weekly practices (2-3 items)
3. Monthly goals (2-3 items)
4. Recommended resources (books, studies, etc.)
5. Milestones to track progress

Return as JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a spiritual growth coach. Create personalized, practical growth plans.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)

    return {
      plan: parsed.plan || {
        dailyPractices: [],
        weeklyPractices: [],
        monthlyGoals: [],
        recommendedResources: [],
        milestones: [],
      },
    }
  } catch (error: any) {
    console.error('Error generating growth plan:', error)
    throw new Error('Failed to generate growth plan')
  }
}

