import { createServerClient } from "./supabase"

export interface FileUpload {
  file: File
  bucket: string
  path: string
  options?: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export class FileService {
  private static instance: FileService
  private supabase = createServerClient()

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService()
    }
    return FileService.instance
  }

  async uploadFile(upload: FileUpload): Promise<UploadResult> {
    try {
      const { file, bucket, path, options } = upload

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: "File size exceeds 10MB limit",
        }
      }

      // Validate file type
      if (!this.isValidFileType(file.type)) {
        return {
          success: false,
          error: "Invalid file type. Allowed: images, PDFs, documents",
        }
      }

      const { data, error } = await this.supabase.storage.from(bucket).upload(path, file, {
        cacheControl: options?.cacheControl || "3600",
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      }
    }
  }

  async uploadReturnImage(
    returnId: string,
    file: File,
    imageType: "damage" | "receipt" | "packaging",
  ): Promise<UploadResult> {
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const path = `returns/${returnId}/${imageType}/${timestamp}.${fileExtension}`

    return this.uploadFile({
      file,
      bucket: "return-images",
      path,
      options: {
        contentType: file.type,
        upsert: false,
      },
    })
  }

  async uploadShippingLabel(returnId: string, labelData: Blob): Promise<UploadResult> {
    const path = `returns/${returnId}/shipping-label.pdf`

    // Convert Blob to File
    const file = new File([labelData], "shipping-label.pdf", { type: "application/pdf" })

    return this.uploadFile({
      file,
      bucket: "shipping-labels",
      path,
      options: {
        contentType: "application/pdf",
        upsert: true,
      },
    })
  }

  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path])

      return !error
    } catch (error) {
      console.error("Failed to delete file:", error)
      return false
    }
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

      if (error) {
        console.error("Failed to create signed URL:", error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error("Failed to get signed URL:", error)
      return null
    }
  }

  private isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      // Documents
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Spreadsheets
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    return allowedTypes.includes(mimeType)
  }

  // Utility function to compress images before upload
  async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Return original if compression fails
            }
          },
          file.type,
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

export const fileService = FileService.getInstance()
