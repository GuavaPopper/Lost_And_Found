"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Filter, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { ReportItem } from "@/components/user-dashboard"
import { ViewItemDialog } from "@/components/view-item-dialog"
import { toast } from "@/components/ui/use-toast"

export default function AllReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [reportToReturn, setReportToReturn] = useState<ReportItem | null>(null)

  // Fetch all reports
  useEffect(() => {
    const fetchAllReports = async () => {
      setIsLoading(true)
      try {
        // Fetch lost items
        const { data: lostItems, error: lostError } = await supabase
          .from("barang_hilang")
          .select("*, user:id_user(nama)")
          .order("created_at", { ascending: false })
        
        if (lostError) throw lostError
        
        // Fetch found items
        const { data: foundItems, error: foundError } = await supabase
          .from("barang_temuan")
          .select("*, user:id_user(nama)")
          .order("created_at", { ascending: false })
        
        if (foundError) throw foundError
        
        // Format lost items
        const formattedLostItems = (lostItems || []).map(item => ({
          id_hilang: item.id_hilang,
          type: "lost" as const,
          id_user: item.id_user,
          nama_barang: item.nama_barang,
          kategori: item.kategori,
          deskripsi: item.deskripsi,
          lokasi: item.lokasi,
          tanggal_hilang: item.tanggal_hilang,
          status: item.status,
          image: item.image,
          created_at: item.created_at,
          reporter_name: item.user?.nama || "Unknown User"
        }))
        
        // Format found items
        const formattedFoundItems = (foundItems || []).map(item => ({
          id_temuan: item.id_temuan,
          type: "found" as const,
          id_user: item.id_user,
          nama_barang: item.nama_barang,
          kategori: item.kategori,
          deskripsi: item.deskripsi,
          lokasi: item.lokasi,
          tanggal_temuan: item.tanggal_temuan,
          status: item.status,
          image: item.image,
          created_at: item.created_at,
          reporter_name: item.user?.nama || "Unknown User"
        }))
        
        // Combine and sort by creation date (newest first)
        const allReports = [
          ...formattedLostItems,
          ...formattedFoundItems
        ].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setReports(allReports)
        setFilteredReports(allReports)
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllReports()
  }, [])

  // Filter reports based on search query, type and status filters
  useEffect(() => {
    let result = [...reports]
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(report => report.type === typeFilter)
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(report => report.status === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        report => 
          report.nama_barang.toLowerCase().includes(query) || 
          report.kategori.toLowerCase().includes(query) || 
          report.lokasi.toLowerCase().includes(query) ||
          report.deskripsi?.toLowerCase().includes(query) ||
          (report.reporter_name && report.reporter_name.toLowerCase().includes(query))
      )
    }
    
    setFilteredReports(result)
  }, [reports, searchQuery, typeFilter, statusFilter])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Get appropriate badge color based on report type
  const getTypeBadgeVariant = (type: string) => {
    return type === "lost" ? "destructive" : "default"
  }

  // Get appropriate badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'reported':
        return 'secondary'
      case 'verified':
        return 'outline'
      case 'matched':
        return 'default'
      case 'returned':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Handle opening the view dialog for a report
  const handleViewReport = (report: ReportItem) => {
    setSelectedReport(report)
    setIsViewDialogOpen(true)
  }

  // Handle opening the return confirmation dialog
  const handleReturnConfirmation = (report: ReportItem) => {
    setReportToReturn(report)
    setIsReturnDialogOpen(true)
  }

  // Handle mark as returned action
  const handleMarkAsReturned = async () => {
    if (!reportToReturn) return
    
    setIsUpdating(true)
    try {
      const table = reportToReturn.type === "lost" ? "barang_hilang" : "barang_temuan"
      const idField = reportToReturn.type === "lost" ? "id_hilang" : "id_temuan"
      const id = reportToReturn.type === "lost" ? reportToReturn.id_hilang : reportToReturn.id_temuan
      
      const { error } = await supabase
        .from(table)
        .update({ status: "returned" })
        .eq(idField, id)
      
      if (error) throw error
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => {
          if (report.type === reportToReturn.type) {
            if (
              (report.type === "lost" && report.id_hilang === reportToReturn.id_hilang) ||
              (report.type === "found" && report.id_temuan === reportToReturn.id_temuan)
            ) {
              return { ...report, status: "returned" }
            }
          }
          return report
        })
      )
      
      toast({
        title: "Item marked as returned",
        description: `${reportToReturn.nama_barang} has been marked as returned.`,
      })
    } catch (error) {
      console.error("Error updating item status:", error)
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setIsReturnDialogOpen(false)
      setReportToReturn(null)
    }
  }

  return (
    <div className="container px-0 mx-auto flex flex-col h-full max-w-7xl">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-background pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">All Reports</h1>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 w-full sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lost">Lost Items</SelectItem>
                <SelectItem value="found">Found Items</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="flex-grow mx-4 sm:mx-6 mb-6 border rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/40">
          <CardTitle>All Reports</CardTitle>
          <CardDescription>Manage lost and found item reports</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
              <span className="text-lg font-medium text-muted-foreground">Loading reports...</span>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="divide-y">
              {filteredReports.map((report) => (
                <div
                  key={report.type === "lost" ? report.id_hilang : report.id_temuan}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/50"
                >
                  <div className="space-y-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeBadgeVariant(report.type)}>
                        {report.type === "lost" ? "Lost" : "Found"}
                      </Badge>
                      <span className="font-medium">{report.nama_barang}</span>
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.kategori} • {report.lokasi} • {
                        new Date(report.type === "lost" 
                          ? report.tanggal_hilang || new Date().toISOString() 
                          : report.tanggal_temuan || new Date().toISOString()
                        ).toLocaleDateString()
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reported by: {report.reporter_name}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                    >
                      View
                    </Button>
                    
                    <Button
                      variant={report.status === "returned" ? "secondary" : "default"}
                      size="sm"
                      disabled={report.status === "returned"}
                      onClick={() => report.status !== "returned" && handleReturnConfirmation(report)}
                    >
                      {report.status === "returned" ? "Returned" : "Mark as Returned"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-1">No reports found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No reports have been submitted yet"}
              </p>
            </div>
          )}
        </CardContent>
        
        {filteredReports.length > 0 && (
          <CardFooter className="flex justify-end border-t px-4 pt-4 sm:px-6 sm:pt-6 py-3 bg-card">
            <div className="text-sm text-muted-foreground">
              Displaying {filteredReports.length} of {reports.length} report entries.
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* View Item Dialog */}
      {selectedReport && (
        <ViewItemDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} item={selectedReport} />
      )}

      {/* Mark as Returned Confirmation Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Item as Returned</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this item as returned to its owner?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {reportToReturn && (
            <div className="py-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getTypeBadgeVariant(reportToReturn.type)}>
                  {reportToReturn.type === "lost" ? "Lost" : "Found"}
                </Badge>
                <span className="font-medium">{reportToReturn.nama_barang}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {reportToReturn.kategori} • {reportToReturn.lokasi}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reported by: {reportToReturn.reporter_name}
              </p>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end gap-2 mt-3">
            <Button 
              variant="outline" 
              onClick={() => setIsReturnDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsReturned}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Return"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 