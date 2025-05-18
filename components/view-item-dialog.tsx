"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { ReportItem } from "@/components/user-dashboard"

interface ViewItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ReportItem | null
}

export function ViewItemDialog({ open, onOpenChange, item }: ViewItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [itemDetails, setItemDetails] = useState<ReportItem | null>(null)

  useEffect(() => {
    async function fetchItemDetails() {
      if (!item) return
      
      setIsLoading(true)
      try {
        const table = item.type === "lost" ? "barang_hilang" : "barang_temuan"
        const idField = item.type === "lost" ? "id_hilang" : "id_temuan"
        const id = item.type === "lost" ? item.id_hilang : item.id_temuan
        
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq(idField, id)
          .single()
          
        if (error) throw error
        
        if (data) {
          setItemDetails({
            ...data,
            type: item.type
          } as ReportItem)
        }
      } catch (error) {
        console.error("Error fetching item details:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (open && item) {
      fetchItemDetails()
    } else {
      setItemDetails(null)
    }
  }, [open, item])
  
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
  
  const getItemDate = (report: ReportItem): string => {
    return report.type === "lost" ? report.tanggal_hilang || "" : report.tanggal_temuan || ""
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <span className="mr-2">{itemDetails?.nama_barang}</span>
                <Badge variant={item.type === "lost" ? "destructive" : "default"}>
                  {item.type === "lost" ? "Lost" : "Found"}
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? "Loading item details..." : "Item details"}
          </DialogDescription>
        </DialogHeader>
        
        {!isLoading && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={getStatusBadgeVariant(itemDetails?.status || "")}>
              {itemDetails?.status ? itemDetails.status.charAt(0).toUpperCase() + itemDetails.status.slice(1) : "-"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {itemDetails && new Date(getItemDate(itemDetails)).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-4">
            {itemDetails?.image && (
              <div className="overflow-hidden rounded-md">
                <img
                  src={itemDetails.image}
                  alt={itemDetails.nama_barang}
                  className="w-full object-contain max-h-80"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{itemDetails?.kategori || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{itemDetails?.lokasi || "-"}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{itemDetails?.deskripsi || "-"}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Reported by</p>
              <p className="text-sm text-muted-foreground">{itemDetails?.reporter_name || item.reporter_name || "-"}</p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 