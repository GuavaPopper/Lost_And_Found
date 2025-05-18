import { supabase } from "@/lib/supabase"
import { ReportType } from "./reports"

export interface SearchParams {
  keyword?: string
  category?: string
  dateFrom?: Date
  dateTo?: Date
  status?: string
  type?: ReportType
}

export interface SearchResult {
  id: string
  type: ReportType
  nama_barang: string
  kategori: string
  deskripsi: string
  lokasi: string
  tanggal: string
  status: string
  image?: string
  created_at: string
}

export async function searchItems(params: SearchParams = {}): Promise<SearchResult[]> {
  try {
    // Start with base queries
    let lostQuery = supabase
      .from("barang_hilang")
      .select("id_hilang, nama_barang, kategori, deskripsi, lokasi, tanggal_hilang, status, image, created_at")
    
    let foundQuery = supabase
      .from("barang_temuan")
      .select("id_temuan, nama_barang, kategori, deskripsi, lokasi, tanggal_temuan, status, image, created_at")
    
    // Apply filters to both queries
    if (params.keyword) {
      const term = `%${params.keyword}%`
      lostQuery = lostQuery.or(`nama_barang.ilike.${term},deskripsi.ilike.${term},lokasi.ilike.${term}`)
      foundQuery = foundQuery.or(`nama_barang.ilike.${term},deskripsi.ilike.${term},lokasi.ilike.${term}`)
    }
    
    if (params.category) {
      lostQuery = lostQuery.eq("kategori", params.category)
      foundQuery = foundQuery.eq("kategori", params.category)
    }
    
    if (params.status) {
      lostQuery = lostQuery.eq("status", params.status)
      foundQuery = foundQuery.eq("status", params.status)
    }
    
    if (params.dateFrom) {
      const fromDate = params.dateFrom.toISOString().split('T')[0]
      lostQuery = lostQuery.gte("tanggal_hilang", fromDate)
      foundQuery = foundQuery.gte("tanggal_temuan", fromDate)
    }
    
    if (params.dateTo) {
      const toDate = params.dateTo.toISOString().split('T')[0]
      lostQuery = lostQuery.lte("tanggal_hilang", toDate)
      foundQuery = foundQuery.lte("tanggal_temuan", toDate)
    }
    
    // Execute queries
    let lostItems: any[] = []
    let foundItems: any[] = []
    
    if (!params.type || params.type === "lost") {
      const { data: lostData, error: lostError } = await lostQuery
      if (lostError) throw lostError
      lostItems = lostData || []
    }
    
    if (!params.type || params.type === "found") {
      const { data: foundData, error: foundError } = await foundQuery
      if (foundError) throw foundError
      foundItems = foundData || []
    }
    
    // Combine and format results
    const results: SearchResult[] = [
      ...lostItems.map(item => ({
        id: item.id_hilang,
        type: "lost" as ReportType,
        nama_barang: item.nama_barang,
        kategori: item.kategori,
        deskripsi: item.deskripsi,
        lokasi: item.lokasi,
        tanggal: item.tanggal_hilang,
        status: item.status,
        image: item.image,
        created_at: item.created_at
      })),
      ...foundItems.map(item => ({
        id: item.id_temuan,
        type: "found" as ReportType,
        nama_barang: item.nama_barang,
        kategori: item.kategori,
        deskripsi: item.deskripsi,
        lokasi: item.lokasi,
        tanggal: item.tanggal_temuan,
        status: item.status,
        image: item.image,
        created_at: item.created_at
      }))
    ]
    
    // Sort results by date (newest first)
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error("Error searching items:", error)
    return []
  }
}

// Get categories for dropdown
export async function getCategories(): Promise<string[]> {
  try {
    const { data: lostCategories, error: lostError } = await supabase
      .from("barang_hilang")
      .select("kategori")
      .order("kategori")
    
    if (lostError) throw lostError
    
    const { data: foundCategories, error: foundError } = await supabase
      .from("barang_temuan")
      .select("kategori")
      .order("kategori")
    
    if (foundError) throw foundError
    
    // Combine categories and remove duplicates
    const allCategories = [
      ...(lostCategories || []).map(item => item.kategori),
      ...(foundCategories || []).map(item => item.kategori)
    ]
    
    return [...new Set(allCategories)]
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["electronics", "clothing", "accessories", "documents", "keys", "other"] // Return default categories
  }
} 