"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Clock, Download, FileText, Plus, ShieldAlert, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { AdminDashboardChart } from "@/components/admin-dashboard-chart"
import { 
  getAdminStats, 
  getRecentUsers, 
  getRecentReports, 
  getRecentActivityLogs, 
  getAllActivityLogs, 
  convertLogsToCSV, 
  getMonthlyReportStats,
  MonthlyStats
} from "@/lib/supabase/admin"
import { formatDistanceToNow } from "date-fns"
import { ReportItem } from "@/components/user-dashboard"
import { ActivityLog } from "@/lib/supabase/security"
import { UserData } from "@/lib/supabase/admin"
import { downloadCSV } from "@/lib/utils"

function getStatusBadgeVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
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

export function AdminDashboard() {
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    securityUsers: 0,
    adminUsers: 0,
    totalReports: 0,
    lostReports: 0,
    foundReports: 0,
    pendingReports: 0,
    matchedReports: 0,
    verifiedReports: 0,
    returnedReports: 0
  })
  const [recentUsers, setRecentUsers] = useState<UserData[]>([])
  const [recentReports, setRecentReports] = useState<ReportItem[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch all data in parallel
        const [statsData, usersData, reportsData, activitiesData, monthlyStatsData] = await Promise.all([
          getAdminStats(),
          getRecentUsers(5),
          getRecentReports(5),
          getRecentActivityLogs(3),
          getMonthlyReportStats()
        ])
        
        setStats(statsData)
        setRecentUsers(usersData)
        setRecentReports(reportsData)
        setRecentActivities(activitiesData)
        setMonthlyStats(monthlyStatsData)
      } catch (error) {
        console.error("Error loading admin dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Handle export of activity logs to CSV
  const handleExportActivityLogs = async () => {
    try {
      setIsExporting(true);
      
      // Get all activity logs
      const logs = await getAllActivityLogs();
      
      if (logs.length === 0) {
        alert("No activity logs to export.");
        return;
      }
      
      // Convert logs to CSV format
      const csvData = convertLogsToCSV(logs);
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `activity_logs_${date}.csv`;
      
      // Download the CSV file
      downloadCSV(csvData, filename);
    } catch (error) {
      console.error("Error exporting activity logs:", error);
      alert("Failed to export activity logs. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage users, reports, and system settings</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" asChild className="flex-1 md:flex-initial justify-center">
            <Link href="/dashboard/admin/reports">
              <FileText className="mr-2 h-4 w-4" />
              All Reports
            </Link>
          </Button>
          <Button onClick={() => setIsCreateUserDialogOpen(true)} className="flex-1 md:flex-initial justify-center">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.regularUsers} users, {stats.securityUsers} security, {stats.adminUsers} admin
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">{stats.lostReports} lost, {stats.foundReports} found</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchedReports}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <path d="M9 12l2 2 4-4" />
              <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedReports}</div>
            <p className="text-xs text-muted-foreground">Verified by security</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returnedReports}</div>
            <p className="text-xs text-muted-foreground">Items returned to owners</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-4 w-full">
        <div className="lg:col-span-3">
          <AdminDashboardChart 
            data={monthlyStats}
            isLoading={isLoading}
          />
        </div>
        
        <Card className="shadow-sm overflow-hidden h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Activity Logs</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleExportActivityLogs} disabled={isExporting}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
            <CardDescription>Recent system activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading activity logs...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex flex-col space-y-1 rounded-lg border p-3">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        By {activity.user_name || "System"}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">No recent activities found.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/40 px-6 py-3 mt-auto">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/admin/logs">View All Activity Logs</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 w-full">
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <Badge variant={user.role === "admin" ? "destructive" : user.role === "security" ? "outline" : "default"}>
                      {user.role === "admin" ? "Admin" : user.role === "security" ? "Security" : "User"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">No recent users found.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/40 px-6 py-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Reports</CardTitle>
            <CardDescription>Recently submitted reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.type === "lost" ? report.id_hilang : report.id_temuan} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Badge variant={report.type === "lost" ? "destructive" : "default"}>
                          {report.type === "lost" ? "Lost" : "Found"}
                        </Badge>
                        <span className="font-medium">{report.nama_barang}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {report.lokasi}
                      </span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">No recent reports found.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/40 px-6 py-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/admin/reports">View All Reports</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <CreateUserDialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen} />
    </div>
  )
}
