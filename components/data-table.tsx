"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Loader2, Search, Trash2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type HallAllocation = {
  id: number
  register_number: string
  student_name: string
  hall_name: string
  seat_number: string
  exam_date: string
  exam_time: string
}

type DataTableProps = {
  supabase: SupabaseClient
}

export function DataTable({ supabase }: DataTableProps) {
  const [allocations, setAllocations] = useState<HallAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const pageSize = 10

  const fetchAllocations = async () => {
    setLoading(true)
    setError("")

    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from("hall_allocations")
        .select("id", { count: "exact", head: true })
        .limit(1)

      if (tableCheckError) {
        // If there's an error, the table might not exist
        console.error("Table check error:", tableCheckError)
        setError("The hall_allocations table doesn't exist yet. Please run the setup SQL script.")
        setAllocations([])
        setTotalPages(1)
        setLoading(false)
        return
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("hall_allocations")
        .select("*", { count: "exact", head: true })
        .ilike("register_number", `%${searchTerm}%`)

      if (countError) {
        console.error("Count error:", countError)
        throw countError
      }

      const totalCount = count || 0
      setTotalPages(Math.ceil(totalCount / pageSize) || 1)

      // Fetch the current page of data
      const { data, error } = await supabase
        .from("hall_allocations")
        .select("*")
        .ilike("register_number", `%${searchTerm}%`)
        .order("register_number", { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) {
        console.error("Data fetch error:", error)
        throw error
      }

      setAllocations(data as HallAllocation[])
    } catch (err: any) {
      console.error("Error fetching allocations:", err)
      setError(
        err.message || "Failed to fetch hall allocations. Please make sure the database table is set up correctly.",
      )
      setAllocations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteLoading(id)

    try {
      const { error } = await supabase.from("hall_allocations").delete().eq("id", id)

      if (error) throw error

      // Refresh the data after deletion
      fetchAllocations()
    } catch (err: any) {
      console.error("Error deleting allocation:", err)
      setError(err.message || "Failed to delete hall allocation")
    } finally {
      setDeleteLoading(null)
    }
  }

  useEffect(() => {
    fetchAllocations()
  }, [page, searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by register number..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1) // Reset to first page on new search
            }}
          />
        </div>
        <Button variant="outline" onClick={() => fetchAllocations()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Register Number</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Hall Name</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Exam Date</TableHead>
              <TableHead>Exam Time</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading data...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-sm text-red-500 mb-2">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    If you haven't set up the database yet, please run the SQL script from the README.
                  </p>
                </TableCell>
              </TableRow>
            ) : allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-sm text-muted-foreground">No hall allocations found</p>
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell>{allocation.register_number}</TableCell>
                  <TableCell>{allocation.student_name}</TableCell>
                  <TableCell>{allocation.hall_name}</TableCell>
                  <TableCell>{allocation.seat_number}</TableCell>
                  <TableCell>{allocation.exam_date}</TableCell>
                  <TableCell>{allocation.exam_time}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(allocation.id)}
                      disabled={deleteLoading === allocation.id}
                    >
                      {deleteLoading === allocation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink isActive={pageNum === page} onClick={() => setPage(pageNum)}>
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
