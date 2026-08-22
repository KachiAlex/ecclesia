import { NextResponse } from 'next/server'
import { getSpiritualCoachingResponse } from '@/lib/ai/openai'

export const dynamic = 'force-dynamic'

/**
 * Public AI status check endpoint
 * Tests if AI is actually working with a simple test query
 */
export async function GET() {
  try {
    const testQuestion = 'What is faith?'
    
    // Quick test to see if AI responds
    const startTime = Date.now()
    const response = await getSpiritualCoachingResponse(testQuestion)
    const duration = Date.now() - startTime

    // Check if we got a valid response
    const isWorking = response && 
                     !response.includes('not available') && 
                     !response.includes('configure') &&
                     response.length > 20

    if (isWorking) {
      return NextResponse.json({
        status: 'operational',
        provider: process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI',
        model: process.env.DEEPSEEK_API_KEY 
          ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
          : (process.env.OPENAI_MODEL || 'gpt-4'),
        responseTime: `${duration}ms`,
        testResponse: response.substring(0, 150) + '...',
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'AI not properly configured',
        details: response,
        provider: process.env.DEEPSEEK_API_KEY ? 'DeepSeek (not working)' : 'None',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'AI service error',
      error: error.message,
      provider: process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'OpenAI',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

