"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"
import { supabaseUrl, supabaseAnonKey } from "@/app/env"

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type HallInfo = {
  register_number: string
  student_name: string
  hall_name: string
  seat_number: string
  exam_date: string
  exam_time: string
} | null

export function SearchForm() {
  const [registerNumber, setRegisterNumber] = useState("")
  const [hallInfo, setHallInfo] = useState<HallInfo>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerNumber.trim()) {
      setError("Please enter a register number")
      return
    }

    setLoading(true)
    setError("")
    setHallInfo(null)
    setSearched(true)

    try {
      const { data, error } = await supabase
        .from("hall_allocations")
        .select("*")
        .eq("register_number", registerNumber.trim())
        .single()

      if (error) throw error

      if (data) {
        setHallInfo(data as HallInfo)
      } else {
        setError("No hall allocation found for this register number")
      }
    } catch (err) {
      console.error("Error fetching hall info:", err)
      setError("Failed to fetch hall information. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter register number"
          value={registerNumber}
          onChange={(e) => setRegisterNumber(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hallInfo && (
        <Alert className="bg-green-50 dark:bg-green-900/20">
          <AlertTitle>Hall Information Found</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid gap-1">
              <p>
                <strong>Name:</strong> {hallInfo.student_name}
              </p>
              <p>
                <strong>Register Number:</strong> {hallInfo.register_number}
              </p>
              <p>
                <strong>Hall Name:</strong> {hallInfo.hall_name}
              </p>
              <p>
                <strong>Seat Number:</strong> {hallInfo.seat_number}
              </p>
              <p>
                <strong>Exam Date:</strong> {hallInfo.exam_date}
              </p>
              <p>
                <strong>Exam Time:</strong> {hallInfo.exam_time}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {searched && !error && !hallInfo && !loading && (
        <Alert>
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No hall allocation found for this register number. Please check and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
