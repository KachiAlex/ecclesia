import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { UserService } from '@/lib/services/user-service'
import { ChurchService, generateSlug } from '@/lib/services/church-service'
import { SubscriptionPlanService, SubscriptionService } from '@/lib/services/subscription-service'
import { db } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const user = await UserService.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has a church
    if (user.churchId) {
      return NextResponse.json(
        { error: 'You already have a church organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { churchName, churchCity, churchCountry } = body

    // Validate input
    if (!churchName) {
      return NextResponse.json(
        { error: 'Church name is required' },
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

    // Create church organization
    const church = await ChurchService.create({
      name: churchName,
      slug,
      city: churchCity || null,
      country: churchCountry || null,
      email: user.email, // Use user's email as church contact initially
    })

    // Update user to be admin of this church
    await UserService.update(userId, {
      churchId: church.id,
      role: 'ADMIN', // Make them admin
    })

    // Update church with owner ID
    await ChurchService.update(church.id, {
      ownerId: userId,
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
        maxUsers: 50,
        maxStorageGB: 5,
        maxSermons: 20,
        maxEvents: 10,
        maxDepartments: 5,
        maxGroups: 10,
        features: ['Basic Features', 'Member Management', 'Sermon Hub', 'Events', 'Giving'],
        billingCycle: 'monthly',
        trialDays: 30,
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
    trialEndDate.setDate(trialEndDate.getDate() + 30)

    await SubscriptionService.create({
      churchId: church.id,
      planId: freePlan.id,
      status: 'TRIAL',
      startDate: now,
      endDate: trialEndDate,
      trialEndsAt: trialEndDate,
    })

    return NextResponse.json(
      { 
        church,
        trialEndsAt: trialEndDate.toISOString(),
        message: 'Church organization registered successfully. You are now the admin and have a 30-day free trial.' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Church registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

