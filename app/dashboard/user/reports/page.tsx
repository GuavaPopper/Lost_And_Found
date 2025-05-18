"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Eye, Plus } from "lucide-react"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ViewItemDialog } from "@/components/view-item-dialog"
import { useAuth } from "@/hooks/use-auth"
import { useProtectedRoute } from "@/hooks/use-protected-route"
import { supabase } from "@/lib/supabase"
import { ReportItem } from "@/components/user-dashboard"

export default function ReportsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isAuthenticated, isLoading } = useProtectedRoute(["user"])
  
  const [lostItems, setLostItems] = useState<ReportItem[]>([])
  const [foundItems, setFoundItems] = useState<ReportItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  
  useEffect(() => {
    if (!user) return
    
    async function fetchUserReports() {
      setIsLoadingItems(true)
      try {
        // Fetch lost items
        const { data: lostData, error: lostError } = await supabase
          .from("barang_hilang")
          .select("*")
          .eq("id_user", user?.id || '')
          .order("created_at", { ascending: false })
        
        if (lostError) throw lostError
        
        // Fetch found items
        const { data: foundData, error: foundError } = await supabase
          .from("barang_temuan")
          .select("*")
          .eq("id_user", user?.id || '')
          .order("created_at", { ascending: false })
        
        if (foundError) throw foundError
        
        // Set data with type information
        setLostItems(lostData.map(item => ({ ...item, type: "lost" })) || [])
        setFoundItems(foundData.map(item => ({ ...item, type: "found" })) || [])
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoadingItems(false)
      }
    }
    
    fetchUserReports()
  }, [user])
  
  // Handle loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  // Return null if not authenticated - the hook will handle redirection
  if (!isAuthenticated) {
    return null
  }
  
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
  
  function handleViewItem(item: ReportItem) {
    setSelectedItem(item)
    setViewDialogOpen(true)
  }
  
  return (
    <DashboardLayout role="user">
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Your Reports</h2>
            <p className="text-muted-foreground">Manage your lost and found item reports</p>
          </div>
          <Button onClick={() => router.push('/dashboard/user/report')}>
            <Plus className="mr-2 h-4 w-4" /> New Report
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="lost">Lost Items</TabsTrigger>
              <TabsTrigger value="found">Found Items</TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              {lostItems.length + foundItems.length} report{lostItems.length + foundItems.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <TabsContent value="all" className="mt-4">
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-10">
                <p>Loading reports...</p>
              </div>
            ) : lostItems.length === 0 && foundItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">No reports yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a new report to get started.
                </p>
                <Button onClick={() => router.push('/dashboard/user/report')} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> New Report
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...lostItems, ...foundItems]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item) => (
                    <Card key={`${item.type}-${item.type === "lost" ? item.id_hilang : item.id_temuan}`} className="overflow-hidden">
                      {item.image && (
                        <div className="h-48 w-full">
                          <img
                            src={item.image}
                            alt={item.nama_barang}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={item.type === "lost" ? "destructive" : "default"}
                            className="mb-2"
                          >
                            {item.type === "lost" ? "Lost" : "Found"}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.nama_barang}</CardTitle>
                        <CardDescription>
                          {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(
                            new Date(item.type === "lost" ? (item.tanggal_hilang || new Date()) : (item.tanggal_temuan || new Date())),
                            "MMM d, yyyy"
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-2 text-sm">{item.deskripsi}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Location:</strong> {item.lokasi}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewItem(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="lost" className="mt-4">
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-10">
                <p>Loading lost items...</p>
              </div>
            ) : lostItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">No lost item reports</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't reported any lost items yet.
                </p>
                <Button onClick={() => router.push('/dashboard/user/report')} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Report Lost Item
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {lostItems
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item) => (
                    <Card key={`lost-${item.id_hilang}`} className="overflow-hidden">
                      {item.image && (
                        <div className="h-48 w-full">
                          <img
                            src={item.image}
                            alt={item.nama_barang}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive" className="mb-2">Lost</Badge>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.nama_barang}</CardTitle>
                        <CardDescription>
                          {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(new Date(item.tanggal_hilang || new Date()), "MMM d, yyyy")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-2 text-sm">{item.deskripsi}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Location:</strong> {item.lokasi}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewItem(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="found" className="mt-4">
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-10">
                <p>Loading found items...</p>
              </div>
            ) : foundItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">No found item reports</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't reported any found items yet.
                </p>
                <Button onClick={() => router.push('/dashboard/user/report')} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Report Found Item
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {foundItems
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((item) => (
                    <Card key={`found-${item.id_temuan}`} className="overflow-hidden">
                      {item.image && (
                        <div className="h-48 w-full">
                          <img
                            src={item.image}
                            alt={item.nama_barang}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="mb-2">Found</Badge>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.nama_barang}</CardTitle>
                        <CardDescription>
                          {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(new Date(item.tanggal_temuan || new Date()), "MMM d, yyyy")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-2 text-sm">{item.deskripsi}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Location:</strong> {item.lokasi}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleViewItem(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <ViewItemDialog 
        open={viewDialogOpen} 
        onOpenChange={setViewDialogOpen} 
        item={selectedItem} 
      />
    </DashboardLayout>
  )
} 