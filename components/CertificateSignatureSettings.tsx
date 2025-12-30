'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

interface SignatureSettings {
  signatureUrl?: string
  signatureTitle: string
  signatureName: string
}

interface CertificateSignatureSettingsProps {
  churchId: string
}

export function CertificateSignatureSettings({ churchId }: CertificateSignatureSettingsProps) {
  const [settings, setSettings] = useState<SignatureSettings>({
    signatureTitle: 'Lead Pastor',
    signatureName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current settings
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/churches/${churchId}/certificate-signature`)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          signatureUrl: data.signatureUrl,
          signatureTitle: data.signatureTitle || 'Lead Pastor',
          signatureName: data.signatureName || '',
        })
        setPreviewUrl(data.signatureUrl || null)
      }
    } catch (error) {
      console.error('Failed to load signature settings:', error)
    }
  }, [churchId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Please select an image smaller than 2MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('signature', file)
      formData.append('title', settings.signatureTitle)
      formData.append('name', settings.signatureName)

      const response = await fetch(`/api/churches/${churchId}/certificate-signature`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings({
          signatureUrl: data.signatureUrl,
          signatureTitle: data.signatureTitle,
          signatureName: data.signatureName,
        })
        setPreviewUrl(data.signatureUrl)
        
        showMessage('success', 'Pastor signature has been updated successfully')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showMessage('error', error instanceof Error ? error.message : 'Failed to upload signature')
    } finally {
      setIsUploading(false)
    }
  }

  // Update text settings
  const handleUpdateSettings = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/churches/${churchId}/certificate-signature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: settings.signatureTitle,
          name: settings.signatureName,
        }),
      })

      if (response.ok) {
        showMessage('success', 'Signature settings have been saved successfully')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Update failed')
      }
    } catch (error) {
      console.error('Update error:', error)
      showMessage('error', error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Remove signature
  const handleRemoveSignature = async () => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      // Create a 1x1 transparent PNG
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, 1, 1)
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          formData.append('signature', blob, 'transparent.png')
          formData.append('title', settings.signatureTitle)
          formData.append('name', settings.signatureName)

          const response = await fetch(`/api/churches/${churchId}/certificate-signature`, {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            setSettings(prev => ({ ...prev, signatureUrl: undefined }))
            setPreviewUrl(null)
            
            showMessage('success', 'Pastor signature has been removed')
          }
        }
        setIsUploading(false)
      }, 'image/png')
    } catch (error) {
      console.error('Remove error:', error)
      showMessage('error', 'Failed to remove signature')
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5" />
          Certificate Signature Settings
        </h2>
        <p className="text-gray-600">
          Customize the pastor's signature and title that appears on course completion certificates
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Signature Image Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Pastor's Signature Image
          </label>
          
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Pastor's signature"
                  className="max-w-xs max-h-24 border border-gray-200 rounded-lg bg-white p-2"
                />
                <button
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                  onClick={handleRemoveSignature}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No signature uploaded yet
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Uploading...
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Upload a clear image of the pastor's signature. Supported formats: PNG, JPG, GIF. Max size: 2MB.
          </p>
        </div>

        {/* Title and Name Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pastor Title
            </label>
            <input
              type="text"
              value={settings.signatureTitle}
              onChange={(e) => setSettings(prev => ({ ...prev, signatureTitle: e.target.value }))}
              placeholder="e.g., Lead Pastor, Senior Pastor"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">
              The title that appears below the signature line
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pastor Name
            </label>
            <input
              type="text"
              value={settings.signatureName}
              onChange={(e) => setSettings(prev => ({ ...prev, signatureName: e.target.value }))}
              placeholder="e.g., John Smith"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">
              The pastor's name (optional)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpdateSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Certificate Preview</p>
              <p className="text-blue-700 mt-1">
                The signature and title will appear at the bottom of course completion certificates. 
                Changes will apply to all new certificates generated after saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}