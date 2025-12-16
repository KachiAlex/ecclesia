/**
 * Storage Service
 * Handles file uploads to Firebase Storage or AWS S3
 * Default: Firebase Storage (since Firebase is already configured)
 */

import { getStorage } from 'firebase-admin/storage'
import { getFirestoreDB } from '@/lib/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

interface UploadOptions {
  file: File | Buffer
  fileName: string
  folder?: string
  userId?: string
  churchId?: string
  contentType?: string
}

export class StorageService {
  private static bucket: any = null

  /**
   * Initialize storage bucket
   */
  private static async getBucket() {
    if (this.bucket) {
      return this.bucket
    }

    try {
      // Initialize Firebase if not already done
      if (getApps().length === 0) {
        const { initFirebase } = await import('@/lib/firestore')
        initFirebase()
      }

      const storage = getStorage()
      const projectId = process.env.FIREBASE_PROJECT_ID || 
                       process.env.FIREBASE_ADMIN_PROJECT_ID || 
                       process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

      if (!projectId) {
        throw new Error('Firebase project ID not configured')
      }

      this.bucket = storage.bucket(`${projectId}.appspot.com`)
      return this.bucket
    } catch (error: any) {
      console.error('Error initializing storage:', error)
      throw new Error(`Storage initialization failed: ${error.message}`)
    }
  }

  /**
   * Upload a file to storage
   */
  static async uploadFile(options: UploadOptions): Promise<{ url: string; path: string }> {
    try {
      const bucket = await this.getBucket()

      // Convert File to Buffer if needed
      let buffer: Buffer
      let contentType = options.contentType

      if (options.file instanceof File) {
        contentType = contentType || options.file.type
        const arrayBuffer = await options.file.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else {
        buffer = options.file
      }

      // Generate file path
      const timestamp = Date.now()
      const sanitizedFileName = options.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const folder = options.folder || 'uploads'
      const filePath = `${folder}/${options.userId || 'anonymous'}/${timestamp}-${sanitizedFileName}`

      // Create file reference
      const file = bucket.file(filePath)

      // Set metadata
      const metadata: any = {
        contentType: contentType || 'application/octet-stream',
        metadata: {
          uploadedBy: options.userId || 'anonymous',
          churchId: options.churchId || '',
          uploadedAt: new Date().toISOString(),
        },
      }

      // Upload file
      await file.save(buffer, {
        metadata,
        public: true, // Make file publicly accessible
      })

      // Make file publicly readable
      await file.makePublic()

      // Get public URL
      const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`

      return {
        url,
        path: filePath,
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      throw new Error(`File upload failed: ${error.message}`)
    }
  }

  /**
   * Upload image with optimization
   */
  static async uploadImage(
    file: File,
    options: {
      userId?: string
      churchId?: string
      folder?: string
      maxWidth?: number
      maxHeight?: number
      quality?: number
    } = {}
  ): Promise<{ url: string; path: string }> {
    try {
      // For now, upload as-is
      // TODO: Add image optimization using sharp or similar library
      // This would resize/compress images before upload

      const fileName = file.name || `image-${Date.now()}.${file.type.split('/')[1] || 'jpg'}`

      return this.uploadFile({
        file,
        fileName,
        folder: options.folder || 'avatars',
        userId: options.userId,
        churchId: options.churchId,
        contentType: file.type,
      })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = await this.getBucket()
      const file = bucket.file(filePath)
      await file.delete()
    } catch (error: any) {
      console.error('Error deleting file:', error)
      throw new Error(`File deletion failed: ${error.message}`)
    }
  }

  /**
   * Get file URL (if file exists)
   */
  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const bucket = await this.getBucket()
      const file = bucket.file(filePath)
      const [exists] = await file.exists()

      if (!exists) {
        return null
      }

      return `https://storage.googleapis.com/${bucket.name}/${filePath}`
    } catch (error: any) {
      console.error('Error getting file URL:', error)
      return null
    }
  }
}

