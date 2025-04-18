"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Loader2, Upload, FileSpreadsheet, FileSpreadsheetIcon as FileCsv, FileX, Download } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

type FileUploaderProps = {
  supabase: SupabaseClient
  onSuccess: () => void
}

export function FileUploader({ supabase, onSuccess }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError("")
  }

  const processCSV = (csvText: string) => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  }

  const processExcel = (arrayBuffer: ArrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(worksheet)
  }

  const uploadData = async (data: any[]) => {
    // Map the data to match our database schema
    const mappedData = data.map((item) => ({
      register_number: item.register_number || item.registerNumber || item.regNo || "",
      student_name: item.student_name || item.studentName || item.name || "",
      hall_name: item.hall_name || item.hallName || item.hall || "",
      seat_number: item.seat_number || item.seatNumber || item.seat || "",
      exam_date: item.exam_date || item.examDate || item.date || "",
      exam_time: item.exam_time || item.examTime || item.time || "",
    }))

    // Insert data in batches to avoid hitting size limits
    const batchSize = 100
    const batches = []

    for (let i = 0; i < mappedData.length; i += batchSize) {
      batches.push(mappedData.slice(i, i + batchSize))
    }

    for (let i = 0; i < batches.length; i++) {
      const { error } = await supabase.from("hall_allocations").upsert(batches[i], { onConflict: "register_number" })

      if (error) throw error

      // Update progress
      setProgress(((i + 1) / batches.length) * 100)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setLoading(true)
    setError("")
    setProgress(0)

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          let data

          if (fileExtension === "csv") {
            data = await processCSV(e.target?.result as string)
          } else if (fileExtension === "xlsx" || fileExtension === "xls") {
            data = processExcel(e.target?.result as ArrayBuffer)
          } else {
            throw new Error("Unsupported file format")
          }

          await uploadData(data as any[])
          onSuccess()

          // Reset form
          setFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        } catch (err: any) {
          console.error("Error processing file:", err)
          setError(err.message || "Failed to process file")
        } finally {
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setError("Failed to read file")
        setLoading(false)
      }

      if (fileExtension === "csv") {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    } catch (err: any) {
      console.error("Error uploading file:", err)
      setError(err.message || "Failed to upload file")
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `register_number,student_name,hall_name,seat_number,exam_date,exam_time
REG12345,John Doe,Main Hall A,A101,2023-05-15,09:00 AM
REG12346,Jane Smith,Main Hall A,A102,2023-05-15,09:00 AM
REG12347,Robert Johnson,Main Hall B,B201,2023-05-15,01:00 PM`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "hall-allocation-template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} disabled={loading} />
      </div>
      <div className="flex justify-between items-center mt-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate} type="button">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm">
          {file.name.endsWith(".csv") ? (
            <FileCsv className="h-4 w-4" />
          ) : file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ? (
            <FileSpreadsheet className="h-4 w-4" />
          ) : (
            <FileX className="h-4 w-4" />
          )}
          <span>{file.name}</span>
        </div>
      )}

      {loading && progress > 0 && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-500">Processing data: {Math.round(progress)}%</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </>
        )}
      </Button>
    </div>
  )
}
