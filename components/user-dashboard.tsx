"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Clock, FileText, Plus, Search, ShieldAlert, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ReportItemDialog } from "@/components/report-item-dialog"
import { ViewItemDialog } from "@/components/view-item-dialog"
import { useAuth } from "@/hooks/use-auth"
import { getUserReports } from "@/lib/supabase/reports"
import { BarangHilang, BarangTemuan } from "@/lib/supabase"
import { getUserNotifications, markNotificationAsRead, Notification } from "@/lib/supabase/notifications"

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

// Define a more complete type that properly merges lost and found item properties
export type ReportItem = {
  type: "lost" | "found";
  id_hilang?: string;
  id_temuan?: string;
  id_user: string;
  nama_barang: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  status: string;
  tanggal_hilang?: string;
  tanggal_temuan?: string;
  image?: string;
  created_at: string;
  reporter_name?: string;
}

export function UserDashboard() {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()
  
  // Stats for the dashboard
  const [stats, setStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    reported: 0,
    verified: 0,
    matched: 0
  })

  // Load notifications
  useEffect(() => {
    if (user) {
      // Using client-side notifications
      const userNotifications = getUserNotifications(user.id);
      setNotifications(userNotifications);
    }
  }, [user]);

  // Load reports
  useEffect(() => {
    async function fetchReports() {
      if (!user) return
      
      setIsLoading(true)
      try {
        const fetchedReports = await getUserReports(user.id)
        console.log("Fetched reports:", fetchedReports)
        
        if (Array.isArray(fetchedReports)) {
          setReports(fetchedReports as ReportItem[])
          
          // Calculate stats
          const lostCount = fetchedReports.filter(r => r.type === "lost").length
          const foundCount = fetchedReports.filter(r => r.type === "found").length
          const reportedCount = fetchedReports.filter(r => r.status === "reported").length
          const verifiedCount = fetchedReports.filter(r => r.status === "verified").length
          const matchedCount = fetchedReports.filter(r => r.status === "matched").length
          
          setStats({
            total: fetchedReports.length,
            lost: lostCount,
            found: foundCount,
            reported: reportedCount,
            verified: verifiedCount,
            matched: matchedCount
          })
        }
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchReports()
  }, [user])

  // Helper function to get the item ID based on type
  const getItemId = (report: ReportItem): string => {
    return report.type === "lost" ? report.id_hilang || "" : report.id_temuan || ""
  }
  
  // Helper function to get the date based on type
  const getItemDate = (report: ReportItem): string => {
    return report.type === "lost" ? report.tanggal_hilang || "" : report.tanggal_temuan || ""
  }

  const handleViewItem = (report: ReportItem) => {
    setSelectedItem(report)
    setIsViewDialogOpen(true)
  }

  // Mark a notification as read when clicked
  const handleNotificationClick = (notification: Notification) => {
    if (!user) return;
    
    if (!notification.isRead) {
      markNotificationAsRead(user.id, notification.id);
      // Update local state to reflect the change
      setNotifications(notifications.map(n => 
        n.id === notification.id 
          ? { ...n, isRead: true } 
          : n
      ));
    }
    
    // Handle related actions if needed, like navigating to a related item
    if (notification.relatedItemId) {
      // Handle navigation to related item
    }
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 w-full">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Welcome back{user?.nama ? `, ${user.nama}` : ''}!</h2>
          <p className="text-muted-foreground">Here's an overview of your lost and found items</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setIsReportDialogOpen(true)}
            className="flex-1 md:flex-initial justify-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 w-full">
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
            <div className="text-2xl font-bold">{stats.reported}</div>
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
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matched}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-5 w-full">
        <TabsList className="grid w-full grid-cols-2 md:max-w-md">
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-5 w-full">
          <Card className="shadow-sm overflow-hidden w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Reports</CardTitle>
              <CardDescription>View and manage your lost and found reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center w-full">
                  <p className="text-muted-foreground">Loading your reports...</p>
                </div>
              ) : reports.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
                  {reports.slice(0, 6).map((report) => (
                    <div key={getItemId(report)} className="flex items-center justify-between rounded-lg border p-3">
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
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => handleViewItem(report)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">No reports found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't reported any lost or found items yet.
                  </p>
                  <Button onClick={() => setIsReportDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Report Item
                  </Button>
                </div>
              )}
            </CardContent>
            {reports.length > 6 && (
              <CardFooter className="border-t bg-muted/40 px-6 py-3">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/user/reports">View All Reports</Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-5 w-full">
          <Card className="shadow-sm overflow-hidden w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Notifications</CardTitle>
              <CardDescription>Check updates about your lost and found items</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex flex-col rounded-lg border p-3 ${!notification.isRead ? 'bg-muted' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{notification.message.split(':')[0]}</span>
                        </div>
                        {!notification.isRead && (
                          <Badge variant="destructive" className="ml-auto">New</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center w-full">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">No notifications yet</p>
                  <p className="text-sm text-muted-foreground">
                    You'll get notifications about updates to your lost and found items here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReportItemDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} />
      {selectedItem && (
        <ViewItemDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} item={selectedItem} />
      )}
    </div>
  )
}
