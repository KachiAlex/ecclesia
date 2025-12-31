#!/usr/bin/env tsx

/**
 * Script to check if "Call to Mission" course exists and recreate it if needed
 * Usage: tsx scripts/check-call-to-mission-course.ts
 */

import { DigitalCourseService } from '@/lib/services/digital-school-service'

async function main() {
  try {
    console.log('🔍 Checking for "Call to Mission" course...')
    
    // You'll need to provide your church ID here
    const churchId = process.env.CHURCH_ID || 'your-church-id'
    
    if (!churchId || churchId === 'your-church-id') {
      console.error('❌ Please set CHURCH_ID environment variable or update the script with your church ID')
      process.exit(1)
    }
    
    // List all courses for the church
    const courses = await DigitalCourseService.list(churchId)
    console.log(`📚 Found ${courses.length} courses in church ${churchId}`)
    
    // Check if "Call to Mission" exists
    const callToMissionCourse = courses.find(course => 
      course.title.toLowerCase().includes('call to mission') ||
      course.title.toLowerCase().includes('call-to-mission')
    )
    
    if (callToMissionCourse) {
      console.log('✅ "Call to Mission" course found!')
      console.log(`   ID: ${callToMissionCourse.id}`)
      console.log(`   Title: ${callToMissionCourse.title}`)
      console.log(`   Status: ${callToMissionCourse.status}`)
      console.log(`   Created: ${callToMissionCourse.createdAt}`)
    } else {
      console.log('❌ "Call to Mission" course not found')
      console.log('📋 Available courses:')
      courses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.title} (${course.status})`)
      })
      
      console.log('\n🔧 Would you like to recreate the "Call to Mission" course? (This script shows how)')
      console.log('   You can use the DigitalCourseService.create() method with the following structure:')
      console.log(`
      const newCourse = await DigitalCourseService.create({
        churchId: '${churchId}',
        title: 'Call to Mission',
        summary: 'A comprehensive course on understanding and responding to God\'s call to mission',
        accessType: 'open',
        status: 'published',
        pricing: { type: 'free' },
        createdBy: 'admin-user-id',
        tags: ['mission', 'calling', 'discipleship'],
        estimatedHours: 8
      })
      `)
    }
    
  } catch (error) {
    console.error('❌ Error checking courses:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}