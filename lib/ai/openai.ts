import OpenAI from 'openai'

// DeepSeek API is OpenAI-compatible, so we can use the OpenAI SDK
// DeepSeek API endpoint: https://api.deepseek.com
// Get your API key from: https://platform.deepseek.com/api_keys

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
const useDeepSeek = !!process.env.DEEPSEEK_API_KEY

if (!apiKey) {
  console.warn('DEEPSEEK_API_KEY or OPENAI_API_KEY not set. AI features will be disabled.')
}

const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
      baseURL: useDeepSeek ? 'https://api.deepseek.com' : undefined, // DeepSeek endpoint
    })
  : null

/**
 * Get the model name based on configuration
 * DeepSeek models: deepseek-chat, deepseek-coder
 */
function getModel(): string {
  if (useDeepSeek) {
    return process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  }
  return process.env.OPENAI_MODEL || 'gpt-4'
}

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
    return 'AI coaching is not available. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY.'
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
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
  } catch (error: any) {
    console.error('AI API error:', error)
    
    // Provide more helpful error messages
    if (error.message?.includes('API key')) {
      throw new Error('AI service configuration error. Please check your API key.')
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('AI service rate limit reached. Please try again later.')
    } else if (error.message?.includes('timeout')) {
      throw new Error('AI service timeout. Please try again.')
    } else {
      throw new Error('Failed to get AI response. Please try again later.')
    }
  }
}

/**
 * Generate a personalized spiritual growth plan
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
    title: string
    description: string
    duration: number // in days
    goals: Array<{ title: string; description: string; steps: string[] }>
    practices: Array<{ title: string; description: string; frequency: string }>
    milestones: Array<{ week: number; description: string }>
  }
}> {
  if (!openai) {
    return {
      plan: {
        title: 'Spiritual Growth Plan',
        description: 'AI growth plan generation is not available. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY.',
        duration: 30,
        goals: [],
        practices: [],
        milestones: [],
      },
    }
  }

  try {
    const systemPrompt = `You are a spiritual growth coach creating personalized growth plans for Christians.
Create a comprehensive, practical growth plan based on the user's profile. Include specific goals, daily/weekly practices, and milestones.`

    const userPrompt = `User Profile:
- Spiritual Maturity: ${userProfile.spiritualMaturity || 'Not specified'}
- Current Practices: ${userProfile.currentPractices?.join(', ') || 'None'}
- Goals: ${userProfile.goals?.join(', ') || 'General spiritual growth'}
- Challenges: ${userProfile.challenges?.join(', ') || 'None specified'}

Generate a personalized 30-day spiritual growth plan in JSON format: {
  plan: {
    title: string,
    description: string,
    duration: 30,
    goals: [{ title, description, steps: string[] }],
    practices: [{ title, description, frequency: string }],
    milestones: [{ week: number, description: string }]
  }
}`

    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(response)
    return parsed
  } catch (error: any) {
    console.error('AI API error:', error)
    return {
      plan: {
        title: 'Spiritual Growth Plan',
        description: 'Unable to generate personalized plan. Please try again.',
        duration: 30,
        goals: [],
        practices: [],
        milestones: [],
      },
    }
  }
}

/**
 * Generate sermon summary from description
 */
export async function generateSermonSummary(
  description: string,
  title?: string
): Promise<string> {
  if (!openai) {
    return description.substring(0, 200) + '...' // Fallback to truncated description
  }

  try {
    const systemPrompt = `You are a sermon summarizer. Create a concise, engaging summary of sermons that highlights key points and biblical themes.`

    const userPrompt = title
      ? `Sermon Title: ${title}\n\nDescription: ${description}\n\nCreate a concise summary (2-3 sentences).`
      : `Sermon Description: ${description}\n\nCreate a concise summary (2-3 sentences).`

    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    return completion.choices[0]?.message?.content || description.substring(0, 200) + '...'
  } catch (error: any) {
    console.error('AI API error:', error)
    return description.substring(0, 200) + '...' // Fallback
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
      recommendations: [],
    }
  }

  try {
    const systemPrompt = `You are a Bible reading plan recommender. Analyze the user's profile and recommend 3-5 personalized reading plans.
Each recommendation should include: title, description, duration (in days), topics (array), difficulty (beginner/intermediate/advanced), and reason for recommendation.`

    const userPrompt = `User Profile:
- Spiritual Maturity: ${userProfile.spiritualMaturity || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Completed Plans: ${userProfile.completedPlans?.join(', ') || 'None'}
- Preferred Duration: ${userProfile.preferredDuration || 'Flexible'} days

Recommend 3-5 reading plans in JSON format: { recommendations: [{ title, description, duration, topics, difficulty, reason }] }`

    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(response)
    return parsed
  } catch (error: any) {
    console.error('AI API error:', error)
    return {
      recommendations: [],
    }
  }
}
