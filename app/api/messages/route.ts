import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { MessageService } from '@/lib/services/message-service'
import { UserService } from '@/lib/services/user-service'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await MessageService.findByConversation(userId, conversationId, 100)

      // Mark messages as read
      await MessageService.markConversationAsRead(userId, conversationId)

      // Get user data for sender and receiver
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const sender = await UserService.findById(message.senderId)
          const receiver = await UserService.findById(message.receiverId)
          return {
            ...message,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              profileImage: sender.profileImage,
            } : null,
            receiver: receiver ? {
              id: receiver.id,
              firstName: receiver.firstName,
              lastName: receiver.lastName,
              profileImage: receiver.profileImage,
            } : null,
          }
        })
      )

      return NextResponse.json(messagesWithUsers)
    }

    // Get all conversations - need to get all messages and group them
    // This is less efficient but Firestore doesn't support OR queries easily
    const sentMessages = await MessageService.findByConversation(userId, userId, 1000) // Get all sent
    const receivedMessages = await MessageService.findByConversation(userId, userId, 1000) // Get all received
    
    // Combine and get unique partners
    const allMessages = [...sentMessages, ...receivedMessages]
    const partnerIds = new Set<string>()
    allMessages.forEach(msg => {
      if (msg.senderId !== userId) partnerIds.add(msg.senderId)
      if (msg.receiverId !== userId) partnerIds.add(msg.receiverId)
    })

    // Group by conversation partner
    const conversationMap = new Map<string, any>()

    for (const partnerId of partnerIds) {
      const conversationMessages = await MessageService.findByConversation(userId, partnerId, 1)
      if (conversationMessages.length > 0) {
        const lastMessage = conversationMessages[conversationMessages.length - 1]
        const partner = await UserService.findById(partnerId)
        const unreadCount = await MessageService.getUnreadCount(userId)

        conversationMap.set(partnerId, {
          partner: partner ? {
            id: partner.id,
            firstName: partner.firstName,
            lastName: partner.lastName,
            profileImage: partner.profileImage,
          } : null,
          lastMessage: {
            ...lastMessage,
            senderId: lastMessage.senderId,
            receiverId: lastMessage.receiverId,
          },
          unreadCount: lastMessage.receiverId === userId && !lastMessage.read ? 1 : 0,
        })
      }
    }

    return NextResponse.json(Array.from(conversationMap.values()))
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { receiverId, content, attachments, voiceNote } = body

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : ''

    const normalizedAttachments = Array.isArray(attachments)
      ? attachments
          .map((att: any) => ({
            url: typeof att?.url === 'string' ? att.url : null,
            name: typeof att?.name === 'string' ? att.name : undefined,
            contentType: typeof att?.contentType === 'string' ? att.contentType : undefined,
            size: typeof att?.size === 'number' ? att.size : undefined,
          }))
          .filter((att) => att.url)
      : []

    const normalizedVoiceNote =
      voiceNote && typeof voiceNote?.url === 'string'
        ? {
            url: voiceNote.url,
            duration: typeof voiceNote.duration === 'number' ? voiceNote.duration : undefined,
          }
        : undefined

    if (!trimmedContent && normalizedAttachments.length === 0 && !normalizedVoiceNote) {
      return NextResponse.json(
        { error: 'Message must include text, attachment, or voice note.' },
        { status: 400 }
      )
    }

    const message = await MessageService.create({
      senderId: userId,
      receiverId,
      content: trimmedContent,
      attachments: normalizedAttachments.length ? normalizedAttachments : undefined,
      voiceNote: normalizedVoiceNote,
    })

    // Get user data
    const sender = await UserService.findById(userId)
    const receiver = await UserService.findById(receiverId)

    return NextResponse.json({
      ...message,
      sender: sender ? {
        id: sender.id,
        firstName: sender.firstName,
        lastName: sender.lastName,
        profileImage: sender.profileImage,
      } : null,
      receiver: receiver ? {
        id: receiver.id,
        firstName: receiver.firstName,
        lastName: receiver.lastName,
        profileImage: receiver.profileImage,
      } : null,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

