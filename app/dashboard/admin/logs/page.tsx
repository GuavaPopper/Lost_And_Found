"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Download, Loader2, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { getAllActivityLogs, convertLogsToCSV } from "@/lib/supabase/admin"
import { ActivityLog } from "@/lib/supabase/security"
import { downloadCSV } from "@/lib/utils"

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all activity logs
  useEffect(() => {
    const fetchActivityLogs = async () => {
      setIsLoading(true)
      try {
        const allLogs = await getAllActivityLogs()
        setLogs(allLogs)
        setFilteredLogs(allLogs)
      } catch (error) {
        console.error("Error fetching activity logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivityLogs()
  }, [])

  // Filter logs based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLogs(logs)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = logs.filter(log => 
      log.action.toLowerCase().includes(query) || 
      (log.user_name && log.user_name.toLowerCase().includes(query))
    )
    
    setFilteredLogs(filtered)
  }, [logs, searchQuery])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Export logs to CSV
  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      
      if (logs.length === 0) {
        alert("No activity logs to export.")
        return
      }
      
      const logsToExport = searchQuery ? filteredLogs : logs
      const csvData = convertLogsToCSV(logsToExport)
      const date = new Date().toISOString().split('T')[0]
      const filename = `activity_logs_${date}.csv`
      downloadCSV(csvData, filename)
    } catch (error) {
      console.error("Error exporting activity logs:", error)
      alert("Failed to export activity logs. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm:ss")
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="container px-0 mx-auto flex flex-col h-full max-w-7xl">
      {/* Page Header - Fixed position with better alignment */}
      <div className="sticky top-0 z-10 bg-background pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Logs</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={isExporting || logs.length === 0}
          className="hidden sm:flex"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>

      {/* Search and Filter - Better aligned and responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-6">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by action or user..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={isExporting || logs.length === 0}
            className="sm:hidden flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "..." : "Export"}
          </Button>
          <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>
      </div>

      {/* Main Content Card - Improved spacing and padding */}
      <Card className="flex-grow mx-4 sm:mx-6 mb-6 border rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/40">
          <CardTitle>System Activity Logs</CardTitle>
          <CardDescription>
            View all system activities performed by users, security personnel, and administrators.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
              <span className="text-lg font-medium text-muted-foreground">Loading activity logs...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[200px] whitespace-nowrap font-medium">Date & Time</TableHead>
                    <TableHead className="font-medium">Action</TableHead>
                    <TableHead className="w-[150px] whitespace-nowrap text-right font-medium">Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="text-right">{log.user_name || 'System'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-1">No activity logs found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search query." : "No system activities have been recorded yet."}
              </p>
            </div>
          )}
        </CardContent>
        
        {filteredLogs.length > 0 && (
          <CardFooter className="flex justify-end border-t px-4 pt-4 sm:px-6 sm:pt-6 py-3 bg-card">
            <div className="text-sm text-muted-foreground">
              Displaying {filteredLogs.length} of {logs.length} log entries.
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 