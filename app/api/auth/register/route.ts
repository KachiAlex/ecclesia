import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { ChurchService, generateSlug } from '@/lib/services/church-service'
import { SubscriptionPlanService, SubscriptionService } from '@/lib/services/subscription-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, password, churchName, churchCity, churchCountry } = body

    // Validate input - Church registration is MANDATORY
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: First name, last name, email, and password are required.' },
        { status: 400 }
      )
    }

    // Church name is MANDATORY - no personal accounts allowed
    if (!churchName || churchName.trim() === '') {
      return NextResponse.json(
        { error: 'Church organization registration is required. You must register a church to create an account.' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate unique slug for church
    let baseSlug = generateSlug(churchName)
    let slug = baseSlug
    let counter = 1
    
    // Check if slug exists and make it unique
    while (true) {
      const existingChurch = await ChurchService.findBySlug(slug)
      if (!existingChurch) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create church organization first
    const church = await ChurchService.create({
      name: churchName,
      slug,
      city: churchCity || null,
      country: churchCountry || null,
      email: email, // Use registrant's email as church contact initially
    })

    // Create user as church owner/admin
    const user = await UserService.create({
      firstName,
      lastName,
      email,
      phone: phone || null,
      password, // Will be hashed in service
      role: 'ADMIN', // Church owner gets ADMIN role
      churchId: church.id,
    })

    // Update church with owner ID
    await ChurchService.update(church.id, {
      ownerId: user.id,
    })

    // Find or create FREE plan with 30-day trial
    let freePlan
    const plansSnapshot = await db.collection(COLLECTIONS.subscriptionPlans)
      .where('type', '==', 'FREE')
      .limit(1)
      .get()
    
    if (plansSnapshot.empty) {
      // Create FREE plan with 30-day trial
      freePlan = await SubscriptionPlanService.create({
        name: 'Free Trial',
        type: 'FREE',
        description: '30-day free trial for new churches',
        price: 0,
        currency: 'USD',
        maxUsers: 50, // Limit during trial
        maxStorageGB: 5,
        maxSermons: 20,
        maxEvents: 10,
        maxDepartments: 5,
        maxGroups: 10,
        features: ['Basic Features', 'Member Management', 'Sermon Hub', 'Events', 'Giving'],
        billingCycle: 'monthly',
        trialDays: 30, // 30-day free trial
      })
    } else {
      const planData = plansSnapshot.docs[0].data()
      freePlan = {
        id: plansSnapshot.docs[0].id,
        ...planData,
        createdAt: planData.createdAt?.toDate ? planData.createdAt.toDate() : new Date(planData.createdAt),
        updatedAt: planData.updatedAt?.toDate ? planData.updatedAt.toDate() : new Date(planData.updatedAt),
      }
    }

    // Create 30-day trial subscription
    const now = new Date()
    const trialEndDate = new Date(now)
    trialEndDate.setDate(trialEndDate.getDate() + 30) // 30 days from now

    await SubscriptionService.create({
      churchId: church.id,
      planId: freePlan.id,
      status: 'TRIAL',
      startDate: now,
      endDate: trialEndDate,
      trialEndsAt: trialEndDate,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        church,
        trialEndsAt: trialEndDate.toISOString(),
        message: 'Church organization and account created successfully. You have a 30-day free trial.' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

