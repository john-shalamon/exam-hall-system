"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { FileUploader } from "@/components/file-uploader"
import { ImageUploader } from "@/components/image-uploader"
import { DataTable } from "@/components/data-table"
import { createClient } from "@supabase/supabase-js"
import { supabaseUrl, supabaseAnonKey } from "@/app/env"
import { SetupGuide } from "@/components/setup-guide"

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("file")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const router = useRouter()
  const [tableExists, setTableExists] = useState<boolean | null>(null)

  const handleLogout = () => {
    router.push("/admin")
  }

  const checkTableExists = async () => {
    try {
      const { error } = await supabase.from("hall_allocations").select("id", { count: "exact", head: true }).limit(1)

      setTableExists(!error)
    } catch (err) {
      setTableExists(false)
    }
  }

  useEffect(() => {
    checkTableExists()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 font-bold">
            <h1 className="text-xl">Exam Hall Finder - Admin</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold mb-6">Upload Hall Allocation Data</h2>

          {uploadSuccess && (
            <Alert className="mb-6 bg-green-50 dark:bg-green-900/20">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Data has been successfully processed and stored in the database.</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="image">Upload Image</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Structured File</CardTitle>
                  <CardDescription>
                    Upload CSV, Excel, or other structured files containing hall allocation data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader supabase={supabase} onSuccess={() => setUploadSuccess(true)} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="image">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>Upload an image of the hall allocation sheet for OCR processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader supabase={supabase} onSuccess={() => setUploadSuccess(true)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            {tableExists === false ? (
              <SetupGuide />
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4">Current Hall Allocations</h3>
                <DataTable supabase={supabase} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
