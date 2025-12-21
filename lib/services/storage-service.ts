/**
 * Storage Service
 * Handles file uploads using Vercel Blob
 */

import { put, del, head } from '@vercel/blob'

interface UploadOptions {
  file: File | Buffer
  fileName: string
  folder?: string
  userId?: string
  churchId?: string
  contentType?: string
}

export class StorageService {
  private static readonly PUBLIC_HOST = 'https://blob.vercel-storage.com'

  private static getToken(): string {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
    }
    return token
  }

  /**
   * Upload a file to storage
   */
  static async uploadFile(options: UploadOptions): Promise<{ url: string; path: string }> {
    try {
      const token = this.getToken()
      const { data, contentType } = await this.prepareBody(options.file, options.contentType)
      const filePath = this.buildFilePath(options)
      const { url, pathname } = await put(filePath, data, {
        access: 'public',
        contentType,
        token,
      })

      return {
        url,
        path: pathname || filePath,
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
      if (!filePath) return
      const token = this.getToken()
      const target = this.normalizePath(filePath)
      await del(target, { token })
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
      if (!filePath) return null
      const token = this.getToken()
      const target = this.normalizePath(filePath)
      await head(target, { token })
      return this.buildPublicUrl(target)
    } catch (error: any) {
      if (error?.name === 'BlobNotFoundError') {
        return null
      }
      console.error('Error getting file URL:', error)
      return null
    }
  }

  private static async prepareBody(
    file: File | Buffer,
    contentType?: string,
  ): Promise<{ data: Buffer; contentType: string }> {
    if (typeof File !== 'undefined' && file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      return {
        data: Buffer.from(arrayBuffer),
        contentType: contentType || file.type || 'application/octet-stream',
      }
    }

    if (Buffer.isBuffer(file)) {
      return {
        data: file,
        contentType: contentType || 'application/octet-stream',
      }
    }

    throw new Error('Unsupported file type for upload')
  }

  private static buildFilePath(options: UploadOptions): string {
    const timestamp = Date.now()
    const sanitizedFileName = options.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const folder = (options.folder || 'uploads').replace(/^\/+|\/+$/g, '')
    const userSegment = (options.userId || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${folder}/${userSegment}/${timestamp}-${sanitizedFileName}`
  }

  private static normalizePath(filePath: string): string {
    if (!filePath) {
      throw new Error('File path is required')
    }
    return filePath.startsWith('http') ? filePath : filePath.replace(/^\/+/, '')
  }

  private static buildPublicUrl(path: string): string {
    if (path.startsWith('http')) {
      return path
    }
    return `${this.PUBLIC_HOST}/${path.replace(/^\/+/, '')}`
  }
}

