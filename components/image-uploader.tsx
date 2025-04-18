"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Loader2, ImageIcon } from "lucide-react"
import Tesseract from "tesseract.js"

type ImageUploaderProps = {
  supabase: SupabaseClient
  onSuccess: () => void
}

export function ImageUploader({ supabase, onSuccess }: ImageUploaderProps) {
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = e.target.files?.[0] || null
    setImage(selectedImage)
    setError("")

    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const parseOCRText = (text: string) => {
    // This is a simplified example of parsing OCR text
    // In a real application, you would need more sophisticated parsing logic

    const lines = text.split("\n").filter((line) => line.trim() !== "")
    const data = []

    // Simple pattern matching for register numbers (assuming format like REG12345)
    const regNoPattern = /[A-Z0-9]{6,10}/

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const regNoMatch = line.match(regNoPattern)

      if (regNoMatch) {
        const registerNumber = regNoMatch[0]
        const studentName = lines[i + 1] || "Unknown"
        const hallName = lines[i + 2] || "Unknown"
        const seatNumber = lines[i + 3] || "Unknown"

        data.push({
          register_number: registerNumber,
          student_name: studentName,
          hall_name: hallName,
          seat_number: seatNumber,
          exam_date: new Date().toISOString().split("T")[0], // Default to today
          exam_time: "09:00 AM", // Default time
        })

        // Skip the lines we've already processed
        i += 3
      }
    }

    return data
  }

  const uploadData = async (data: any[]) => {
    if (data.length === 0) {
      throw new Error("No valid data could be extracted from the image")
    }

    const { error } = await supabase.from("hall_allocations").upsert(data, { onConflict: "register_number" })

    if (error) throw error
  }

  const handleUpload = async () => {
    if (!image) {
      setError("Please select an image to upload")
      return
    }

    setLoading(true)
    setError("")
    setProgress(0)

    try {
      // Perform OCR on the image
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(m.progress * 100)
          }
        },
      })

      // Parse the OCR text to extract structured data
      const data = parseOCRText(result.data.text)

      // Upload the extracted data to Supabase
      await uploadData(data)

      onSuccess()

      // Reset form
      setImage(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err: any) {
      console.error("Error processing image:", err)
      setError(err.message || "Failed to process image")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} disabled={loading} />
      </div>

      {previewUrl && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-64 w-full object-contain" />
        </div>
      )}

      {loading && progress > 0 && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-500">Processing image: {Math.round(progress)}%</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleUpload} disabled={!image || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Process Image
          </>
        )}
      </Button>
    </div>
  )
}
