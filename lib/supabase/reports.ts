import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid'
import { BarangHilang, BarangTemuan } from "@/lib/supabase"

export type ReportType = "lost" | "found"

export interface ReportFormData {
  type: ReportType
  title: string
  category: string
  description: string
  location: string
  date: Date
  images?: File[]
}

export async function submitReport(data: ReportFormData, userId: string): Promise<boolean> {
  try {
    // Handle image upload if any
    let imageUrl: string | undefined
    if (data.images && data.images.length > 0) {
      try {
        imageUrl = await uploadImage(data.images[0], userId)
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError)
        // Continue without the image
      }
    }

    if (data.type === "lost") {
      // Submit lost item report
      const { error } = await supabase
        .from("barang_hilang")
        .insert({
          id_user: userId,
          nama_barang: data.title,
          kategori: data.category,
          deskripsi: data.description,
          lokasi: data.location,
          tanggal_hilang: data.date.toISOString().split('T')[0],
          status: "reported",
          image: imageUrl
        })

      if (error) throw error
    } else {
      // Submit found item report
      const { error } = await supabase
        .from("barang_temuan")
        .insert({
          id_user: userId,
          nama_barang: data.title,
          kategori: data.category,
          deskripsi: data.description,
          lokasi: data.location,
          tanggal_temuan: data.date.toISOString().split('T')[0],
          status: "reported",
          image: imageUrl
        })

      if (error) throw error
    }

    return true
  } catch (error) {
    console.error("Error submitting report:", error)
    return false
  }
}

async function uploadImage(file: File, userId: string): Promise<string | undefined> {
  try {
    // Get file extension
    const fileExt = file.name.split('.').pop()
    // Create a unique file name
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    // Simple path without subfolders to avoid permission issues
    const filePath = fileName
    
    console.log(`Attempting to upload: ${filePath}`, {
      fileSize: Math.round(file.size / 1024) + 'KB',
      fileType: file.type
    })
    
    // Upload directly without checking buckets first
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Use upsert to overwrite if exists
      })
    
    if (error) {
      console.error('Upload error:', error)
      throw error
    }
    
    console.log('Upload success:', data)
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath)
    
    console.log('Public URL:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('Image upload failed:', error)
    throw error // Let the caller handle the error
  }
}

export async function getUserReports(userId: string, type?: ReportType) {
  try {
    if (type === "lost" || !type) {
      const { data: lostItems, error: lostError } = await supabase
        .from("barang_hilang")
        .select("*")
        .eq("id_user", userId)
        .order("created_at", { ascending: false })

      if (lostError) throw lostError
      
      if (type === "lost") return lostItems as BarangHilang[]
    }

    if (type === "found" || !type) {
      const { data: foundItems, error: foundError } = await supabase
        .from("barang_temuan")
        .select("*")
        .eq("id_user", userId)
        .order("created_at", { ascending: false })

      if (foundError) throw foundError
      
      if (type === "found") return foundItems as BarangTemuan[]
    }

    // If no type specified, combine both types
    if (!type) {
      const { data: lostItems } = await supabase
        .from("barang_hilang")
        .select("*")
        .eq("id_user", userId)
        .order("created_at", { ascending: false })
        
      const { data: foundItems } = await supabase
        .from("barang_temuan")
        .select("*")
        .eq("id_user", userId)
        .order("created_at", { ascending: false })
        
      return [
        ...(lostItems || []).map(item => ({ ...item, type: "lost" })),
        ...(foundItems || []).map(item => ({ ...item, type: "found" }))
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    
    return []
  } catch (error) {
    console.error("Error fetching user reports:", error)
    return []
  }
} 