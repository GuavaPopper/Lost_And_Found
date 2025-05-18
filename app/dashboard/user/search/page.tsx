"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Search as SearchIcon, Filter, Eye, AlertCircle } from "lucide-react"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useProtectedRoute } from "@/hooks/use-protected-route"
import { SearchParams, SearchResult, searchItems } from "@/lib/supabase/search"
import { ReportType } from "@/lib/supabase/reports"

const searchSchema = z.object({
  keyword: z.string().optional(),
  category: z.enum(["all", "electronics", "clothing", "accessories", "documents", "keys", "other"]).optional(),
  type: z.enum(["all", "lost", "found"]),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

type SearchFormValues = z.infer<typeof searchSchema>

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

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAuthenticated, isLoading } = useProtectedRoute(["user"])
  
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keyword: searchParams.get("q") || "",
      category: "all",
      type: "all",
    }
  })

  // Run search when page loads with query parameter
  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      form.setValue("keyword", query)
      handleSearch({ keyword: query, type: "all" } as SearchFormValues)
    } else {
      // Load all items if no search query
      fetchAllItems()
    }
  }, [searchParams, form])

  // Function to fetch all items
  async function fetchAllItems() {
    setIsSearching(true)
    try {
      const results = await searchItems({})
      setSearchResults(results)
    } catch (error) {
      toast({
        title: "Error loading items",
        description: "There was an error loading items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Return null if not authenticated - the hook will handle redirection
  if (!isAuthenticated) {
    return null
  }

  async function handleSearch(data: SearchFormValues) {
    setIsSearching(true)
    try {
      // Convert form data to search params
      const params: SearchParams = {}
      
      if (data.keyword) params.keyword = data.keyword
      if (data.category && data.category !== "all") params.category = data.category
      if (data.type !== "all") params.type = data.type as ReportType
      if (data.dateFrom) params.dateFrom = data.dateFrom
      if (data.dateTo) params.dateTo = data.dateTo
      
      const results = await searchItems(params)
      setSearchResults(results)
      
      if (results.length === 0) {
        toast({
          title: "No items found",
          description: "Try adjusting your search criteria to find more items.",
        })
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "There was an error performing your search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  function viewItemDetails(item: SearchResult) {
    setSelectedItem(item)
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "accessories", label: "Accessories" },
    { value: "documents", label: "Documents" },
    { value: "keys", label: "Keys" },
    { value: "other", label: "Other" },
  ]

  return (
    <DashboardLayout role="user">
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Search Items</h2>
            <p className="text-muted-foreground">Find lost and found items across the campus</p>
          </div>
        </div>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
            <CardDescription>Use the filters below to narrow down your search</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="keyword"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Search Keywords</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g. laptop, wallet, black bag..."
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="lost">Lost Items</SelectItem>
                            <SelectItem value="found">Found Items</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span className="text-muted-foreground">Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || 
                                (form.getValues("dateTo") ? date > form.getValues("dateTo")! : false)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span className="text-muted-foreground">Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || 
                                (form.getValues("dateFrom") ? date < form.getValues("dateFrom")! : false)
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-end md:col-span-2">
                    <Button type="submit" className="ml-auto mr-0 w-full md:w-auto" disabled={isSearching}>
                      <Filter className="mr-2 h-4 w-4" />
                      {isSearching ? "Searching..." : "Apply Filters"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="lost">Lost Items</TabsTrigger>
              <TabsTrigger value="found">Found Items</TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <TabsContent value="all" className="mt-4">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">Loading items...</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we fetch the latest lost and found items.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No items found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {searchResults.map((item) => (
                  <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
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
                        {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(new Date(item.tanggal), "MMM d, yyyy")}
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
                        onClick={() => viewItemDetails(item)}
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
            {isSearching ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">Loading lost items...</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we fetch the latest lost items.
                </p>
              </div>
            ) : searchResults.filter(item => item.type === "lost").length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No lost items found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {searchResults
                  .filter(item => item.type === "lost")
                  .map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
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
                          {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(new Date(item.tanggal), "MMM d, yyyy")}
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
                          onClick={() => viewItemDetails(item)}
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
            {isSearching ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">Loading found items...</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we fetch the latest found items.
                </p>
              </div>
            ) : searchResults.filter(item => item.type === "found").length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No found items found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {searchResults
                  .filter(item => item.type === "found")
                  .map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
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
                          {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)} • {format(new Date(item.tanggal), "MMM d, yyyy")}
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
                          onClick={() => viewItemDetails(item)}
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
      
      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedItem.type === "lost" ? "destructive" : "default"}>
                    {selectedItem.type === "lost" ? "Lost" : "Found"}
                  </Badge>
                  {selectedItem.nama_barang}
                </div>
              </DialogTitle>
              <DialogDescription>
                {selectedItem.kategori.charAt(0).toUpperCase() + selectedItem.kategori.slice(1)} • 
                {format(new Date(selectedItem.tanggal), "MMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            {selectedItem.image && (
              <div className="mx-auto mb-4 h-64 max-w-full overflow-hidden rounded-md">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.nama_barang}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            
            <div className="grid gap-4">
              <div>
                <h4 className="mb-2 font-medium">Description</h4>
                <p className="text-sm">{selectedItem.deskripsi}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-1 text-sm font-medium">Location</h4>
                  <p className="text-sm">{selectedItem.lokasi}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium">Status</h4>
                  <Badge variant={getStatusBadgeVariant(selectedItem.status)}>
                    {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium">
                    {selectedItem.type === "lost" ? "Lost Date" : "Found Date"}
                  </h4>
                  <p className="text-sm">{format(new Date(selectedItem.tanggal), "PPP")}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium">Reported On</h4>
                  <p className="text-sm">{format(new Date(selectedItem.created_at), "PPP")}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
} 