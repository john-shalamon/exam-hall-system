"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Check, Copy, Database } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { supabaseUrl, supabaseAnonKey } from "@/app/env"

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const setupSQL = `
-- Create the hall_allocations table
CREATE TABLE IF NOT EXISTS hall_allocations (
  id SERIAL PRIMARY KEY,
  register_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  hall_name TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  exam_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on register_number for faster searches
CREATE INDEX IF NOT EXISTS idx_hall_allocations_register_number ON hall_allocations(register_number);

-- Sample data for testing (optional)
INSERT INTO hall_allocations (register_number, student_name, hall_name, seat_number, exam_date, exam_time)
VALUES
  ('REG12345', 'John Doe', 'Main Hall A', 'A101', '2023-05-15', '09:00 AM'),
  ('REG12346', 'Jane Smith', 'Main Hall A', 'A102', '2023-05-15', '09:00 AM'),
  ('REG12347', 'Robert Johnson', 'Main Hall B', 'B201', '2023-05-15', '01:00 PM'),
  ('REG12348', 'Emily Davis', 'Main Hall B', 'B202', '2023-05-15', '01:00 PM'),
  ('REG12349', 'Michael Wilson', 'Science Block', 'S101', '2023-05-16', '09:00 AM')
ON CONFLICT (register_number) DO NOTHING;
`

export function SetupGuide() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const runSetupScript = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const { error } = await supabase.rpc("pgcrypto", { query: setupSQL })

      if (error) throw error

      setSuccess(true)

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error("Error running setup script:", err)
      setError(err.message || "Failed to run setup script. Please run it manually in the Supabase SQL Editor.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(setupSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Setup Required</CardTitle>
        <CardDescription>The hall_allocations table needs to be created in your Supabase database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Database Table Not Found</AlertTitle>
            <AlertDescription>
              The application requires a hall_allocations table to store exam hall data. You can set it up automatically
              or manually.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">{setupSQL}</pre>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 dark:bg-green-900/20">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Database table created successfully! Reloading page...</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy SQL"}
        </Button>
        <Button onClick={runSetupScript} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? "Setting Up..." : "Setup Database"}
        </Button>
      </CardFooter>
    </Card>
  )
}
