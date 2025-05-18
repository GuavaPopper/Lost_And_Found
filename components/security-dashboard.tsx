"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, FileText, UserCheck, RefreshCw, CheckSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportItem } from "@/components/user-dashboard"
import { Badge } from "@/components/ui/badge"
import { VerifyReportDialog } from "@/components/verify-report-dialog"
import { useAuth } from "@/hooks/use-auth"
import { getPendingReports, getSecurityStats, SecurityStats } from "@/lib/supabase/security"

export function SecurityDashboard() {
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [pendingReports, setPendingReports] = useState<ReportItem[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    total: 0,
    lost: 0,
    found: 0,
    pending: 0,
    verified: 0,
    matched: 0,
    returned: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch all needed data
      const [pendingData, statsData] = await Promise.all([
        getPendingReports(),
        getSecurityStats()
      ])
      
      setPendingReports(pendingData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading security dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const openVerifyDialog = (report: ReportItem) => {
    setSelectedReport(report)
    setIsVerifyDialogOpen(true)
  }

  const handleVerified = () => {
    // Remove the report from pending reports if it was changed from "reported" status
    if (selectedReport) {
      setPendingReports(prev => 
        prev.filter(report => 
          report.type === "lost" 
            ? report.id_hilang !== selectedReport.id_hilang 
            : report.id_temuan !== selectedReport.id_temuan
        )
      );
      
      // Update stats
      setStats(prev => {
        // Calculate new stats based on previous state
        const newPending = Math.max(0, prev.pending - 1);
        
        // Increment the appropriate counter based on probable new status
        // Note: This is a best-effort update - the full refresh will happen shortly
        const newVerified = prev.verified + 1;
        
        return {
          ...prev,
          pending: newPending,
          verified: newVerified
        };
      });

      // Clear the selected report
      setSelectedReport(null);
      
      // Reload data in the background to ensure we have the latest data
      setTimeout(() => {
        loadDashboardData();
      }, 1000);
    }
  }

  const getItemDate = (report: ReportItem): string => {
    return report.type === "lost" ? report.tanggal_hilang || "" : report.tanggal_temuan || ""
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Security Dashboard</h2>
          <p className="text-muted-foreground">Verify reports and manage the lost and found system</p>
        </div>
        <div className="flex w-full md:w-auto">
          <Button asChild variant="outline" className="flex-1 md:flex-initial justify-center">
            <Link href="/dashboard/security/reports">
              <FileText className="mr-2 h-4 w-4" />
              All Reports
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.lost} lost, {stats.found} found</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">Verified by security</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matched}</div>
            <p className="text-xs text-muted-foreground">Items with matches</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returned || 0}</div>
            <p className="text-xs text-muted-foreground">Returned to owners</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pending Reports</CardTitle>
          <CardDescription>Reports that need verification by security personnel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center w-full">
              <p className="text-muted-foreground">Loading pending reports...</p>
            </div>
          ) : pendingReports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingReports.map((report) => (
                <div 
                  key={report.type === "lost" ? report.id_hilang : report.id_temuan} 
                  className="flex flex-col rounded-lg border p-3 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.type === "lost" ? "destructive" : "default"}>
                        {report.type === "lost" ? "Lost" : "Found"}
                      </Badge>
                      <span className="font-medium">{report.nama_barang}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {report.lokasi} • {new Date(getItemDate(report)).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Reported by: {report.reporter_name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link 
                        href={`/dashboard/security/reports/${report.type === "lost" ? 
                          `lost/${report.id_hilang}` : 
                          `found/${report.id_temuan}`}`}
                      >
                        View
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => openVerifyDialog(report)}>
                      Update Status
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center w-full">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">No pending reports</p>
              <p className="text-sm text-muted-foreground">
                All reports have been verified. Great job!
              </p>
            </div>
          )}
        </CardContent>
        {pendingReports.length > 0 && (
          <CardFooter className="border-t bg-muted/40 px-6 py-3 w-full">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/security/reports">View All Reports</Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {selectedReport && (
        <VerifyReportDialog 
          open={isVerifyDialogOpen} 
          onOpenChange={setIsVerifyDialogOpen} 
          report={selectedReport} 
          onVerified={handleVerified}
        />
      )}
    </div>
  )
}
