/**
 * Storage Service
 * Handles file uploads using Vercel Blob
 */

import { put, del, head } from '@vercel/blob'
import sharp from 'sharp'

interface UploadOptions {
  file: File | Buffer
  fileName: string
  folder?: string
  userId?: string
  churchId?: string
  contentType?: string
}

interface OptimizedImage {
  buffer: Buffer
  size: 'thumbnail' | 'medium' | 'original'
  width: number
  height: number
  format: string
}

export class StorageService {
  private static readonly PUBLIC_HOST = 'https://blob.vercel-storage.com'
  private static readonly IMAGE_SIZES = {
    thumbnail: { width: 128, height: 128, label: 'thumb' },
    medium: { width: 256, height: 256, label: 'med' },
    original: { width: 512, height: 512, label: 'orig' },
  }

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
  ): Promise<{ url: string; path: string; urls?: { thumbnail?: string; medium?: string; original?: string } }> {
    try {
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)

      // Optimize and resize image
      const optimized = await this.optimizeImage(uint8Array, {
        quality: options.quality || 80,
        maxWidth: options.maxWidth || 512,
        maxHeight: options.maxHeight || 512,
      })

      const baseFileName = file.name || `image-${Date.now()}`
      const nameWithoutExt = baseFileName.substring(0, baseFileName.lastIndexOf('.') || baseFileName.length)
      const ext = 'webp' // Always convert to webp for better compression

      const results: any = {
        urls: {},
      }

      // Upload original (full size) optimized version
      const originalResult = await this.uploadFile({
        file: optimized.original.buffer,
        fileName: `${nameWithoutExt}-orig.${ext}`,
        folder: options.folder || 'avatars',
        userId: options.userId,
        churchId: options.churchId,
        contentType: 'image/webp',
      })

      results.url = originalResult.url
      results.path = originalResult.path
      results.urls.original = originalResult.url

      // Upload medium version (for previews/thumbnails in lists)
      const mediumResult = await this.uploadFile({
        file: optimized.medium.buffer,
        fileName: `${nameWithoutExt}-med.${ext}`,
        folder: options.folder || 'avatars',
        userId: options.userId,
        churchId: options.churchId,
        contentType: 'image/webp',
      })

      results.urls.medium = mediumResult.url

      // Upload thumbnail version (for small displays)
      const thumbResult = await this.uploadFile({
        file: optimized.thumbnail.buffer,
        fileName: `${nameWithoutExt}-thumb.${ext}`,
        folder: options.folder || 'avatars',
        userId: options.userId,
        churchId: options.churchId,
        contentType: 'image/webp',
      })

      results.urls.thumbnail = thumbResult.url

      return results
    } catch (error: any) {
      console.error('Error uploading image:', error)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  }

  /**
   * Optimize image using sharp - resize and compress for web
   */
  private static async optimizeImage(
    imageBuffer: Uint8Array,
    options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<{ original: OptimizedImage; medium: OptimizedImage; thumbnail: OptimizedImage }> {
    try {
      const quality = options.quality || 80
      const maxWidth = options.maxWidth || 512

      // Start with the original buffer
      const sharpImage = sharp(Buffer.from(imageBuffer))
      const metadata = await sharpImage.metadata()

      // Calculate dimensions maintaining aspect ratio
      let width = metadata.width || maxWidth
      let height = metadata.height || width

      if (width > maxWidth) {
        const ratio = height / width
        width = maxWidth
        height = Math.round(maxWidth * ratio)
      }

      // Create original size (512x512 max or smaller)
      const original = await sharp(Buffer.from(imageBuffer))
        .resize(Math.min(width, 512), Math.min(height, 512), {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 6 })
        .toBuffer()

      // Create medium size (256x256)
      const medium = await sharp(Buffer.from(imageBuffer))
        .resize(256, 256, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: Math.max(quality - 10, 60), effort: 6 })
        .toBuffer()

      // Create thumbnail size (128x128)
      const thumbnail = await sharp(Buffer.from(imageBuffer))
        .resize(128, 128, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: Math.max(quality - 20, 50), effort: 6 })
        .toBuffer()

      return {
        original: {
          buffer: original,
          size: 'original',
          width: Math.min(width, 512),
          height: Math.min(height, 512),
          format: 'webp',
        },
        medium: {
          buffer: medium,
          size: 'medium',
          width: 256,
          height: 256,
          format: 'webp',
        },
        thumbnail: {
          buffer: thumbnail,
          size: 'thumbnail',
          width: 128,
          height: 128,
          format: 'webp',
        },
      }
    } catch (error: any) {
      console.error('Error optimizing image:', error)
      throw new Error(`Image optimization failed: ${error.message}`)
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

